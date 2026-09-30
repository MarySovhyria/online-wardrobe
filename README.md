# The Edit — your personal wardrobe

A mobile-first private wardrobe built with Next.js (App Router), React, TypeScript, Supabase, and custom responsive CSS. Warm neutrals, olive accents, editorial typography, a desktop sidebar, and thumb-friendly mobile navigation. Clothing extraction runs locally with SegFormer Clothes and rembg; no paid image API is used.

## Included

- Email/password signup, email confirmation, login, sign out, and password recovery.
- JPEG/PNG/WebP selection, client-side resizing to a maximum 1600px edge, and 10 MiB input limits.
- Local clothing extraction for worn and standalone garments, original/cutout comparison, and transparent WebP storage.
- Wardrobe grid with category filters, name/color search, newest/oldest/name sorting.
- Edit clothing details, replace photos, and confirm before deletion.
- Four-slot outfit studio (top, bottom, jacket, shoes), optional slots, atomic saves, revisit and delete outfits.
- Opening a saved outfit creates an editable selection; saving makes a new outfit, never overwrites the original.
- PostgreSQL row-level security, owner-scoped private storage, and expiring signed image URLs.
- Setup screen when backend environment variables are absent. No fake accounts or demo records.

## Local setup

Requires Node.js **22.18+** (Node 24 recommended), npm, and **Python 3.11–3.13**. Tested on macOS Apple Silicon with Python 3.13. Other platforms require compatible Python package wheels.

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

### 4. Set up free local clothing extraction

Run once from the project folder:

```sh
npm run ai:setup
```

This creates a project-specific Python environment in `.venv`, installs the inference packages, and downloads SegFormer Clothes (~110 MB) and U2Net (~176 MB) to `.local-ai`. Allow roughly 1 GB of disk space including dependencies. An internet connection is needed for setup; no API key, account, GPU, or per-photo credits are needed for extraction. Both directories are ignored by Git. Re-run setup if models or dependencies are missing. Python is used directly by the Next.js server, so you do not need to start a separate service.

In the photo editor, choose:

- **Someone wearing the clothing:** [SegFormer Clothes](https://huggingface.co/Xenova/segformer_b2_clothes) selects tops/outer layers, trousers/shorts, skirts, or both shoes. Select the wardrobe category first; Bottoms offers separate trouser and skirt options. Use one person per photo. This is semantic segmentation, not text prompting or instance selection: multiple people wearing the same type of garment would be combined. Layered tops and jackets may also be combined. Dresses are not currently supported by the wardrobe categories.
- **Clothing on its own:** [rembg](https://github.com/danielgatis/rembg) with the U2Net model removes the background around the foreground item or pair of shoes. Keep people out of this mode; it may retain the person as foreground.

Click **Extract clothing**, compare with the original, then save the cutout. Changing the photo, category, photo type, or garment type clears the previous result. Viewing the original for comparison still saves the cutout. Segmentation preserves only visible fabric: arms, hair, and other garments can leave holes where fabric is hidden. Fine edges and layered garments need review.

The browser resizes/re-encodes the photo and sends up to 3 MiB of prepared WebP to the authenticated Next.js route. The route launches the local Python worker, which reads the photo from stdin and returns an inline PNG mask. It does not save source photos to disk or send them to an AI provider. The browser applies that mask to the original pixels, crops with padding, and saves only the transparent cutout in private Supabase storage. If the website runs on another computer, that host processes the photo; it does not run AI in the visitor's browser. Supabase authentication and saving still require internet access.

Only one extraction runs per Next.js server process at a time to limit CPU and memory use. The worker is killed after 180 seconds. There is no hourly credit limit or paid fallback. Missing setup and empty results produce actionable errors and leave saving disabled. The SegFormer download is pinned to model revision `b5ddd0f`; rembg explicitly uses U2Net rather than its default model. This setup is intended for your personal wardrobe; review the [upstream SegFormer model license](https://huggingface.co/mattmdjaga/segformer_b2_clothes#license) before commercial reuse.

### 5. Run

```sh
npm run dev
```

Open http://localhost:3000. Create an account and confirm the email. Choose a photo, extract and review your first piece, then save it and assemble an outfit.

Phone photos must be JPEG, PNG, or WebP. HEIC is not supported; export it to JPEG first. Transparent PNGs preserve transparency during WebP conversion. The backend enforces allowed MIME types and file size; the browser additionally decodes/re-encodes images. This is not malware scanning.

## Validation

```sh
npm test
npm run test:ai
npm run typecheck
npm run build
npm run format:check
```

The automated tests cover photo validation, resizing, mask transparency/cropping, route authentication and concurrency, invalid worker responses, garment label mapping (including excluding skin), and invalid image rejection. Route tests stub the worker; Python tests exercise label mapping and input validation. These are not end-to-end browser tests. Both real model paths were also exercised locally with a public worn-clothing photo and a synthetic standalone shirt. The production build uses webpack.

### Required live smoke tests

Use a real configured Supabase project before releasing:

1. Sign up as user A, confirm email, sign out, sign in. Request a password reset and set a new password from the email link.
2. Extract and save one worn and one standalone item per category. Check original comparison, transparent edges, cropping, and changing the photo/category/type after extraction. Test missing local setup, no matching clothing, and worker failures; saving must stay disabled without a cutout. Check search, sorting, filters, optional metadata, and oversized/unsupported upload errors.
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

Local extraction needs the full project checkout, Python environment, model files, and a Node.js host that can launch child processes. For a self-hosted machine, run `npm install`, `npm run ai:setup`, `npm run build`, then `npm start` from the project root. Configure both Supabase environment variables, the production Site URL, and allowed redirect origin. Rebuild after changing public environment variables.

This version does **not** support extraction on a standard Vercel serverless deployment: the local Python environment and models are not deployed there. A public deployment would need a suitable persistent host or a separately secured model service. Supabase storage/authentication and any rented hosting still have their own quotas/costs; local AI has no per-photo API fee.

## Project map

- `src/app/page.tsx`: authentication, wardrobe, upload/edit form, studio, and confirmation dialog.
- `src/app/globals.css`: responsive design system and page layouts.
- `src/lib/supabase.ts`: browser client, shared models, photo preparation.
- `src/lib/clothing-cutout.ts`: mask application, transparency, and crop processing.
- `src/app/api/extract-clothing/route.ts`: authenticated entry point for local extraction.
- `src/lib/extraction-handler.ts`: upload validation, worker responses, and concurrency control.
- `src/lib/local-extraction.ts`: bounded Python worker lifecycle.
- `local-ai/`: setup, model inference, dependencies, and Python tests.
- `scripts/setup-local-ai.mjs`: one-command local installation.
- `tests/clothing-cutout.test.mjs` and `tests/extract-clothing.test.mjs`: cutout and route tests.
- `supabase/schema.sql`: database/storage setup and security policies.
- `tests/photo.test.mjs`: image preparation unit tests.

Future features can be split into route/components as the app grows. This first version intentionally avoids a separate API server, drag-and-drop outfit canvas, and unnecessary state-management dependencies.
