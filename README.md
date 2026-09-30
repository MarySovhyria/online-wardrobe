# The Edit — your personal wardrobe

A mobile-first private wardrobe built with Next.js (App Router), React, TypeScript, Supabase, and custom responsive CSS. Warm neutrals, olive accents, editorial typography, a desktop sidebar, and thumb-friendly mobile navigation. No external font or image services are used.

## Included

- Email/password signup, email confirmation, login, sign out, and password recovery.
- Private JPEG/PNG/WebP uploads, client-side resizing to a maximum 1600px edge, and 10 MiB upload limits.
- Wardrobe grid with category filters, name/color search, newest/oldest/name sorting.
- Edit clothing details, replace photos, and confirm before deletion.
- Four-slot outfit studio (top, bottom, jacket, shoes), optional slots, atomic saves, revisit and delete outfits.
- Opening a saved outfit creates an editable selection; saving makes a new outfit, never overwrites the original.
- PostgreSQL row-level security, owner-scoped private storage, and expiring signed image URLs.
- Setup screen when backend environment variables are absent. No fake accounts or demo records.

## Local setup

Requires Node.js **22.18+** (Node 24 recommended) and npm.

```sh
npm install
cp .env.example .env.local
```

### 1. Create the backend

Create a project at https://supabase.com. In its **SQL Editor**, run the entire `supabase/schema.sql` file once against a fresh project. It creates the tables, indexes, access policies, atomic outfit-save function, and private `clothing` bucket.

This is an initial schema, not an idempotent migration. Do not rerun it against an initialized database; use migrations for subsequent changes. If using an existing project, audit existing permissive storage policies: policies are OR-combined, so a broad pre-existing policy can undermine owner-only access.

### 2. Set environment variables

Find your project URL and publishable key in the Supabase project settings / Connect dialog. A legacy `anon` key also works.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key
```

These are public browser credentials; database and storage policies enforce authorization. **Never put a secret or service-role key in a `NEXT_PUBLIC_` variable.** `.env.local` is ignored by Git.

### 3. Configure authentication

In Supabase **Authentication → Providers**, enable email/password authentication. Keep email confirmation enabled.

In **Authentication → URL Configuration**:

- Local Site URL: `http://localhost:3000`
- Allow redirect URLs: `http://localhost:3000` and `http://localhost:3000/?recovery=1`
- For deployment, set Site URL to your exact HTTPS production origin and allow both that origin and its `/?recovery=1` URL.

The app uses Supabase's browser session/implicit link flow. Default confirmation and recovery email templates work: links return to the app's root with an auth fragment, which Supabase consumes. Do not replace them with PKCE/server callback templates without adding the corresponding callback route. Recovery links use the `?recovery=1` marker so the dedicated new-password form survives URL-fragment consumption and page refresh.

Configure custom SMTP before inviting real users. Supabase's default email sender has delivery restrictions and rate limits. For reliable email tests, use permitted recipient addresses or your own SMTP provider. Configure your password policy in Supabase too; the UI requires at least 8 characters.

### 4. Run

```sh
npm run dev
```

Open http://localhost:3000. Create an account and confirm the email. Upload your first piece, then assemble an outfit.

Phone photos must be JPEG, PNG, or WebP. HEIC is not supported; export it to JPEG first. Transparent PNGs preserve transparency during WebP conversion. The backend enforces allowed MIME types and file size; the browser additionally decodes/re-encodes images. This is not malware scanning.

## Validation

```sh
npm test
npm run typecheck
npm run build
npm run format:check
```

The automated tests cover photo type/size rejection, resize dimensions, WebP encoding, and bitmap cleanup. They mock browser image APIs; they are not end-to-end browser tests. The production build uses webpack for predictable behavior in restricted development environments.

### Required live smoke tests

Use a real configured Supabase project before releasing:

1. Sign up as user A, confirm email, sign out, sign in. Request a password reset and set a new password from the email link.
2. Upload one image per category. Check search, all sorting modes, filters, optional metadata, and oversized/unsupported upload errors.
3. Edit a name and replace a photo. Verify the new photo appears in saved outfits.
4. Save a partial and a complete outfit, revisit both, save a variation, delete an outfit, and verify clothing remains.
5. Change a clothing category: linked outfit slots move with it. If the destination slot is occupied, the database rejects the whole edit without losing the original. Remove the conflicting saved outfit first.
6. Delete a piece: its outfit links disappear and its file is removed through Storage API.
7. Sign in as user B in a different browser profile. Verify A's wardrobe/outfits are absent. Using B's authenticated client, try reading/updating A's known row IDs, linking A's clothing, and signing/downloading A's storage path; all must be denied or return no rows. Anonymous requests must also fail.
8. Test at 375px phone width and desktop width, keyboard navigation, dialog focus/Escape, and loading/error states on a slow connection.

## Data and security

- `clothing_items`: owner, name, category, color, image path, creation date.
- `outfits`: owner, name, creation date.
- `outfit_items`: outfit/item links, one item per slot. Composite foreign keys enforce category/slot consistency; deletion cascades remove links.
- `save_outfit`: security-invoker function that inserts the outfit and all links in one transaction; RLS applies to both sides of every link.
- Files live in private storage at `<user UUID>/<random UUID>.webp`. Only the owner can manage that folder.
- Signed URLs last one hour and are refreshed while the page remains open. They are temporary bearer links: anyone receiving a copied URL can view that image until expiration. Never share them unintentionally.
- Database ownership and image path prefix constraints prevent cross-user references. No admin credentials are used by the app.
- Browser sessions are stored by Supabase in local storage. Sign out on shared devices. UI gating is convenience only; RLS is the security boundary.

Storage and PostgreSQL writes cannot be one transaction. Replacements upload first, commit the row, then remove the old file. Failed row writes attempt to remove the new upload. Item deletion commits the row deletion then removes the file. Network interruption or a failed cleanup can leave an orphaned private file; the app reports cleanup failures when possible. For larger deployments, add a scheduled storage reconciliation job. Deleting an auth user cascades database rows but does not remove their storage objects; account deletion needs server-side storage cleanup.

## Deploy

Import this project into Vercel, select Next.js, and set both environment variables for the production environment. Set Supabase's Site URL and allowed redirect origin to the deployed HTTPS address. Redeploy after changing public environment variables, since Next.js embeds them at build time.

Supabase stores account information and clothing photos; Vercel hosts the frontend. Check their current pricing, database/storage quotas, email limits, and regional data-hosting options before public use. No AI service is used and no photo is sent to a third-party image-processing API.

## Project map

- `src/app/page.tsx`: authentication, wardrobe, upload/edit form, studio, and confirmation dialog.
- `src/app/globals.css`: responsive design system and page layouts.
- `src/lib/supabase.ts`: browser client, shared models, photo preparation.
- `supabase/schema.sql`: database/storage setup and security policies.
- `tests/photo.test.mjs`: image preparation unit tests.

Future features can be split into route/components as the app grows. This first version intentionally avoids a separate API server, drag-and-drop outfit canvas, and unnecessary state-management dependencies.
