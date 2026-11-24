-- Existing projects only: run once in the Supabase SQL Editor as postgres.
-- Fresh projects should run supabase/schema.sql instead. No rows are deleted.
-- The legacy "jacket" key remains; the app labels it "Outerwear".
-- Transactional: a failure rolls back every schema/function change.
begin;

alter table public.clothing_items
    drop constraint clothing_items_category_check,
    add constraint clothing_items_category_check
        check (category in ('top', 'bottom', 'jacket', 'cardigan', 'hat', 'shoes', 'jewelry'));

alter table public.outfit_items
    drop constraint outfit_items_slot_check,
    add constraint outfit_items_slot_check
        check (slot in ('top', 'bottom', 'jacket', 'cardigan', 'hat', 'shoes', 'jewelry')),
    drop constraint outfit_items_pkey,
    add constraint outfit_items_pkey primary key (outfit_id, clothing_item_id);

-- Client: supabase.rpc('save_outfit', { p_name, p_items: selectedItemIds })
-- p_items is a nonempty JSON array of distinct clothing UUID strings. Legacy
-- category-to-UUID objects remain supported, including category validation.
-- Ownership is checked under caller RLS; any failure aborts the whole call.
create or replace function public.save_outfit(p_name text, p_items jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
    v_user_id uuid := auth.uid();
    v_outfit_id uuid;
    v_item_ids uuid[];
    v_item_count integer;
    v_link_count integer;
begin
    if v_user_id is null then
        raise exception 'Authentication required' using errcode = '42501';
    end if;
    if p_name is null or pg_catalog.char_length(p_name) not between 1 and 100 then
        raise exception 'Outfit name must contain 1 to 100 characters'
            using errcode = '22023';
    end if;

    if p_items is null or pg_catalog.jsonb_typeof(p_items) not in ('array', 'object') then
        raise exception 'Items must be an array of UUID strings or a legacy category object'
            using errcode = '22023';
    end if;

    if pg_catalog.jsonb_typeof(p_items) = 'array' then
        if exists (
            select 1 from pg_catalog.jsonb_array_elements(p_items) as item(value)
            where pg_catalog.jsonb_typeof(item.value) <> 'string'
        ) then
            raise exception 'Each item must be a UUID string' using errcode = '22023';
        end if;
        select pg_catalog.array_agg(item.value::uuid) into v_item_ids
        from pg_catalog.jsonb_array_elements_text(p_items) as item(value);
    else
        if exists (
            select 1 from pg_catalog.jsonb_each(p_items) as item
            where item.key not in ('top', 'bottom', 'jacket', 'cardigan', 'hat', 'shoes', 'jewelry')
               or pg_catalog.jsonb_typeof(item.value) <> 'string'
        ) then
            raise exception 'Each item must use a valid category and UUID string'
                using errcode = '22023';
        end if;
        select pg_catalog.array_agg(item.value::uuid) into v_item_ids
        from pg_catalog.jsonb_each_text(p_items) as item;
        if exists (
            select 1 from pg_catalog.jsonb_each_text(p_items) as item
            where not exists (
                select 1 from public.clothing_items c
                where c.id = item.value::uuid and c.category = item.key
                  and c.user_id = v_user_id
            )
        ) then
            raise exception 'Items must belong to you and match their categories'
                using errcode = '22023';
        end if;
    end if;

    v_item_count := coalesce(pg_catalog.cardinality(v_item_ids), 0);
    if v_item_count = 0 then
        raise exception 'Choose at least one clothing item' using errcode = '22023';
    end if;
    if (select count(distinct item.id) from pg_catalog.unnest(v_item_ids) as item(id)) <> v_item_count then
        raise exception 'Each clothing item may appear only once' using errcode = '22023';
    end if;

    insert into public.outfits (user_id, name)
    values (v_user_id, p_name) returning id into v_outfit_id;

    -- Derive the category from the owned row instead of trusting the client.
    -- The FK and RLS still apply, including to concurrent category changes.
    insert into public.outfit_items (outfit_id, clothing_item_id, slot)
    select v_outfit_id, c.id, c.category
    from public.clothing_items c
    where c.id = any(v_item_ids) and c.user_id = v_user_id;
    get diagnostics v_link_count = row_count;
    if v_link_count <> v_item_count then
        raise exception 'One or more clothing items are missing or do not belong to you'
            using errcode = '22023';
    end if;
    return v_outfit_id;
end;
$$;

revoke execute on function public.save_outfit(text, jsonb) from public, anon;
grant execute on function public.save_outfit(text, jsonb) to authenticated;

commit;

-- Verify using authenticated clients, not an admin role:
-- 1. Existing outfits still open; a legacy category object still saves.
-- 2. Save two tops and two jewelry pieces in the same outfit; all four persist.
-- 3. Change a linked top to a category already present; both links remain.
-- 4. Duplicate UUIDs, foreign/missing items, malformed values, empty input and
--    legacy category mismatches fail without leaving an outfit or partial links.
-- 5. User B cannot read or link user A's clothing or outfits; anonymous RPC fails.
-- Rollback after a successful commit needs a separate reviewed migration:
-- new categories and repeated category links cannot fit the old schema. Restore
-- a pre-migration backup only if the loss of subsequent writes is acceptable.
