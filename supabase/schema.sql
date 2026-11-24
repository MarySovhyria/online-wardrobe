-- Online Wardrobe: initial schema for a fresh Supabase project.
-- Run this entire file once in the Supabase Dashboard SQL Editor as postgres.
-- It is transactional, but intentionally not a repeatable migration: existing
-- application tables/policies with these names must be migrated separately.
-- Supabase supplies auth.users, auth.uid(), storage.buckets and storage.objects.
-- Clients must sign in and use the authenticated role (never expose service_role).
-- Store image_path as a bucket-relative key: <auth user UUID>/<unique filename>.
-- Upload to bucket 'clothing'; use authenticated downloads or signed URLs.
-- image_path is a reference only: deleting a row does NOT delete its Storage
-- object. Delete files through the Storage API, not direct storage.objects SQL.
-- Storage policies protect files independently of clothing_items rows.

begin;

create table public.clothing_items (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid()
        references auth.users(id) on delete cascade,
    name text not null check (char_length(name) between 1 and 100),
    category text not null check (category in ('top', 'bottom', 'jacket', 'cardigan', 'hat', 'shoes', 'jewelry')),
    color text check (char_length(color) <= 50),
    image_path text not null check (
        starts_with(image_path, user_id::text || '/')
        and char_length(image_path) > char_length(user_id::text || '/')
    ),
    created_at timestamptz not null default now(),
    -- Required by the composite FK below, so a category change cannot leave
    -- an existing outfit item in the wrong slot (even outside client RLS).
    constraint clothing_items_id_category_key unique (id, category)
);

create table public.outfits (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid()
        references auth.users(id) on delete cascade,
    name text not null check (char_length(name) between 1 and 100),
    created_at timestamptz not null default now()
);

create table public.outfit_items (
    outfit_id uuid not null references public.outfits(id) on delete cascade,
    clothing_item_id uuid not null,
    slot text not null check (slot in ('top', 'bottom', 'jacket', 'cardigan', 'hat', 'shoes', 'jewelry')),
    constraint outfit_items_pkey primary key (outfit_id, clothing_item_id),
    constraint outfit_items_clothing_slot_fkey
        foreign key (clothing_item_id, slot)
        references public.clothing_items(id, category)
        on update cascade on delete cascade
);

-- Owner-filtered lists ordered by creation time; also index user deletion FKs.
create index clothing_items_user_created_at_idx
    on public.clothing_items (user_id, created_at desc);
create index outfits_user_created_at_idx
    on public.outfits (user_id, created_at desc);
-- The outfit_items PK already indexes outfit_id; index the other FK as well.
create index outfit_items_clothing_slot_idx
    on public.outfit_items (clothing_item_id, slot);

alter table public.clothing_items enable row level security;
alter table public.outfits enable row level security;
alter table public.outfit_items enable row level security;

-- Explicit grants avoid dependence on project default privileges. No anonymous
-- access or TRUNCATE grants; RLS governs authenticated SELECT/INSERT/UPDATE/DELETE.
revoke all on public.clothing_items, public.outfits, public.outfit_items
    from public, anon, authenticated;
grant usage on schema public to authenticated;
grant select, insert, update, delete
    on public.clothing_items, public.outfits, public.outfit_items
    to authenticated;

-- USING protects existing rows; WITH CHECK protects inserted/updated rows and
-- prevents transferring ownership. Supabase admin/service roles bypass RLS;
-- keep those credentials server-side and validate any privileged writes.
create policy clothing_items_owner on public.clothing_items
    for all to authenticated
    using (user_id = (select auth.uid()))
    with check (user_id = (select auth.uid()));

create policy outfits_owner on public.outfits
    for all to authenticated
    using (user_id = (select auth.uid()))
    with check (user_id = (select auth.uid()));

-- Both sides must belong to the caller, including when a link is moved by an
-- UPDATE. Parent-table RLS also applies to these subqueries. The composite FK
-- cascades category changes into slots; each distinct piece can appear once.
create policy outfit_items_owner on public.outfit_items
    for all to authenticated
    using (
        exists (
            select 1 from public.outfits o
            where o.id = outfit_items.outfit_id
              and o.user_id = (select auth.uid())
        )
        and exists (
            select 1 from public.clothing_items c
            where c.id = outfit_items.clothing_item_id
              and c.user_id = (select auth.uid())
              and c.category = outfit_items.slot
        )
    )
    with check (
        exists (
            select 1 from public.outfits o
            where o.id = outfit_items.outfit_id
              and o.user_id = (select auth.uid())
        )
        and exists (
            select 1 from public.clothing_items c
            where c.id = outfit_items.clothing_item_id
              and c.user_id = (select auth.uid())
              and c.category = outfit_items.slot
        )
    );

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

-- Private uploads, maximum 10 MiB (10 * 1024 * 1024 bytes).
-- If the bucket already exists, apply the same privacy/upload restrictions.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'clothing', 'clothing', false, 10485760,
    array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
    name = excluded.name,
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Supabase already enables RLS and configures grants on storage.objects.
-- Folder ownership is authoritative: the first folder must equal auth.uid().
-- UPDATE checks both old and new paths, so moves cannot cross owner folders.
-- This policy is scoped to clothing and grants no access to other buckets.
-- On non-empty projects, audit other storage policies: permissive policies are
-- OR-combined and an existing broad policy could grant additional access.
create policy clothing_storage_owner on storage.objects
    for all to authenticated
    using (
        bucket_id = 'clothing'
        and (storage.foldername(name))[1] = (select auth.uid())::text
    )
    with check (
        bucket_id = 'clothing'
        and (storage.foldername(name))[1] = (select auth.uid())::text
    );

commit;

-- Smoke-test via two separately signed-in clients (not the SQL Editor's admin
-- role): each can CRUD only their own rows and clothing/<uid>/... bucket keys.
-- Cross-owner outfit links, wrong-category links and duplicate item IDs must
-- fail. Multiple distinct items of the same category must succeed. Deleting an
-- outfit/item cascades its links. Category edits must update every linked slot,
-- including when the destination category already has another piece.
-- RPC tests: arrays and legacy objects both save; reject NULL/scalar/empty
-- input, invalid legacy categories, non-string/malformed UUIDs, duplicate IDs,
-- foreign-owned/missing items and legacy category mismatches. Failed calls must
-- leave no new outfit or links. All seven categories must be accepted.
-- Reject empty/>100-character names, >50-character colors, and image paths
-- outside the row owner's UUID folder or with no filename after the prefix.
-- Anonymous requests must have no access to these rows/files or the RPC.
-- Uploads over 10485760 bytes or outside the MIME allowlist must fail.
