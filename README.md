# The Edit — your personal wardrobe

A mobile-first private wardrobe built with Next.js (App Router), React, TypeScript, Supabase, and custom responsive CSS. Warm neutrals, olive accents, editorial typography, a desktop sidebar, and thumb-friendly mobile navigation. Standalone clothing photo preparation runs in the visitor’s browser, with optional background removal and lighting adjustments. No paid image API or Python server is required.

## Included

- Email/password signup, email confirmation, login, sign out, and password recovery.
- JPEG/PNG/WebP selection, client-side resizing to a maximum 1600px edge, and 10 MiB input limits.
- Upright standalone clothing photos, optional browser background removal, original comparison, and WebP storage.
- Optional Auto light and manual Brightness, Contrast and Shadows controls, with explicit preview acceptance before saving a new photo.
- Wardrobe grid with category filters, name/color search, newest/oldest/name sorting.
- Edit clothing details, replace photos, and confirm before deletion.
- One-page outfit collages with tops, bottoms, outerwear, cardigans, hats, shoes and jewelry, including multiple pieces of each type with automatic placement, drag/keyboard positioning, rotation, resizing, flipping, and 1600 × 2240 PNG export. Outfit pieces save atomically; layout adjustments are remembered in the current browser.
- Opening a saved outfit creates an editable selection; saving makes a new outfit, never overwrites the original.
- PostgreSQL row-level security, owner-scoped private storage, and expiring signed image URLs.
- Setup screen when backend environment variables are absent. No fake accounts or demo records.

## Local setup

Requires Node.js **22.18+** (Node 24 recommended) and npm. Photo processing runs in the browser; no Python installation, local AI service, GPU or inference API key is required.

```sh
npm install
cp .env.example .env.local
```

### 1. Create the backend

Create a project at https://supabase.com. In its **SQL Editor**, run the entire `supabase/schema.sql` file once against a fresh project. It creates the tables, indexes, access policies, atomic outfit-save function, and private `clothing` bucket.

This is an initial schema, not an idempotent migration. Do not rerun it against an initialized database; use migrations for subsequent changes. If using an existing project, audit existing permissive storage policies: policies are OR-combined, so a broad pre-existing policy can undermine owner-only access.

#### Existing projects: enable expanded outfits

Before using the updated app with an existing database, run [`supabase/migrations/20261124_outfit_categories.sql`](supabase/migrations/20261124_outfit_categories.sql) once in the Supabase **SQL Editor**. Fresh projects already include these changes in `schema.sql` and should skip this migration. The migration preserves existing outfits and clothing, adds cardigans, hats and jewelry, and allows multiple distinct pieces of each category in an outfit. The existing `jacket` category key is retained and displayed as **Outerwear**.

The migration runs in one transaction and retains ownership policies. `save_outfit` accepts an array of distinct clothing UUIDs and still supports older category-to-UUID objects. Do not use the new app against the old schema: new categories and repeated categories require this migration. After applying it, verify a saved outfit with two pieces of the same category and confirm another account cannot access those pieces. A committed migration cannot simply be reversed after new data is added; the old schema cannot represent the additional categories or repeated category links.

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

Open http://localhost:3000. Create an account and confirm the email. Development and production build preparation download checksum-verified background-removal model assets and matching ONNX Runtime Web WASM files into the app’s generated static assets. Internet access is needed on first setup; these generated files are not committed. The browser downloads them when background removal is requested. Keep the model and runtime attribution distributed with the assets.

### Preparing clothing photos

Use **one upright item photographed on its own**, ideally in even light against a simple contrasting background. Pairs of shoes are fine. Worn clothing, rotated garments, hidden fabric reconstruction and wrinkle repair are no longer supported. Flatten folds before taking the photo; lighting adjustments cannot reconstruct concealed details or remove creases reliably.

1. Select a JPEG, PNG or WebP photo. HEIC is unsupported; export it to JPEG first. The app accepts files up to 10 MiB and prepares images with a maximum 1600px edge. Transparent PNGs retain transparency.
2. Optionally choose **Remove background**. The U²-NetP foreground model runs in a dedicated browser worker using single-thread WebAssembly. It selects foreground rather than a named garment, so inspect fine edges, straps, jewelry and similar foreground/background colors. Download and processing progress are shown. If processing fails, retry or choose **Keep background** and continue without a cutout.
3. Keep neutral lighting or click **Auto light** for gentle, bounded automatic correction. Adjust **Brightness**, **Contrast** and **Shadows** manually if needed. Adjustments are recomputed from the prepared original rather than repeatedly editing an already-adjusted image. They preserve geometry and transparency; color fidelity still needs visual review.
4. Use **Compare original** and **Reset lighting** to review the result. Comparison changes only what is displayed.
5. Click **Use this photo** to accept the current preview, then save the clothing item. Replacing the photo or changing processing settings requires accepting the new preview again. Editing the name, category or color alone does not.

Processing happens on the visitor’s device. Only the accepted WebP result uploads to private Supabase storage; original photos are not sent to an inference provider or a Next.js processing route. WebP uses the browser’s native encoder where available and a browser-side WASM encoder fallback on Safari/WebKit. Photo validation and re-encoding are not malware scanning. Authentication, image saving and loading still require access to Supabase. First-use model downloads and processing time depend on connection and device; keep-background saving remains available when background removal is unavailable. No per-photo inference fee applies, but hosting and Supabase have their own quotas and costs.

Use a modern browser with Canvas and WebAssembly. Background removal additionally needs Web Workers and OffscreenCanvas; when those are unavailable, keep the background. Local workflow checks passed in Chrome 158.0.8127.37 and WebKit 27.2, including a 390px viewport. This is not a real-phone performance or garment-edge accuracy guarantee.

## Outfit collage studio

Open **Outfit studio** and select pieces from your wardrobe; you can select several pieces from the same category. Open **Saved outfits** to browse, reopen or delete saved looks. The white portrait sheet arranges tops above bottoms, with shoes below and a jacket alongside. Use **Auto-arrange** to restore that layout, or select a piece and drag it. Arrow keys move the focused piece; Shift + arrow moves it farther. The **Straighten** slider and 90° buttons rotate a cutout; **Size**, **Flip**, and **Reset piece** adjust its appearance. The layout keeps each piece inside the page.

**Download PNG** exports a 1600 × 2240 image on a white background, using the same positions, rotation, size, and layer order as the preview. Selection outlines and editing controls are omitted. Downloads need access to the signed clothing photo URLs; refresh the wardrobe if a photo has expired.

**Save outfit** saves the clothing selection to Supabase and its composition to this browser's local storage, scoped to your account and outfit ID. Reopening a saved outfit here restores the composition; other browsers use the default arrangement. Clearing browser data also removes custom arrangements. Keep a PNG for a portable copy. Existing databases require the expanded-outfits migration described above.

The collage controls rotate existing photos or cutouts. Photograph clothing upright before uploading; the editor does not reconstruct hidden fabric. Hats and jewelry have their own wardrobe categories.

## Validation

```sh
npm test
npm run typecheck
npm run build
npm run format:check
```

Automated checks cover image validation and preparation, cutout geometry and transparency, model tensors/masks, lighting behavior, encoding and outfit layout handling. Browser processing states require the smoke tests below. Unit tests do not replace real model/browser checks or live Supabase access-policy checks. Run the applicable checks above and exercise the smoke tests below before a release. The production build uses webpack.

### Required live smoke tests

Use a real configured Supabase project before releasing:

1. Sign up as user A, confirm email, sign out, sign in. Request a password reset and set a new password from the email link.
2. Prepare and save upright standalone items in each category. Check optional background removal, retry after a processing/download failure, Keep background, original comparison, Auto light, manual sliders, Reset lighting and explicit acceptance. Changing a photo or processing settings must disable saving until accepted again. Check rapid photo changes, closing the editor during processing, slow connections, unsupported devices, fine edges, transparency, search/filter/sort, optional metadata and oversized/unsupported uploads.
3. Edit a name and replace a photo. Verify the new photo appears in saved outfits.
4. Save a partial and a complete outfit; rotate, flip, resize, drag, and keyboard-move pieces. Download a PNG and compare it with the board. Reopen a saved layout after reloading, save a variation, delete an outfit, and verify clothing remains.
5. Save multiple distinct pieces of the same category, including jewelry. Change a linked piece to a category already represented in its saved outfit: all links remain and their categories update. Duplicate item IDs, invalid categories, foreign-owned/missing items and malformed RPC input must fail atomically.
6. Delete a piece: its outfit links disappear and its file is removed through Storage API.
7. Sign in as user B in a different browser profile. Verify A's wardrobe/outfits are absent. Using B's authenticated client, try reading/updating A's known row IDs, linking A's clothing, and signing/downloading A's storage path; all must be denied or return no rows. Anonymous requests must also fail.
8. Test at 375px phone width and desktop width, keyboard navigation, dialog focus/Escape, and loading/error states on a slow connection.

## Data and security

- `clothing_items`: owner, name, category, color, image path, creation date.
- `outfits`: owner, name, creation date.
- `outfit_items`: outfit/item links, with multiple distinct items per category and each item included at most once per outfit. Composite foreign keys enforce category/slot consistency; deletion cascades remove links.
- `save_outfit`: security-invoker function that inserts the outfit and all links in one transaction; RLS applies to both sides of every link.
- Files live in private storage at `<user UUID>/<random UUID>.webp`. Only the owner can manage that folder.
- Signed URLs last one hour and are refreshed while the page remains open. They are temporary bearer links: anyone receiving a copied URL can view that image until expiration. Never share them unintentionally.
- Database ownership and image path prefix constraints prevent cross-user references. No admin credentials are used by the app.
- Browser sessions are stored by Supabase in local storage. Sign out on shared devices. UI gating is convenience only; RLS is the security boundary.

Storage and PostgreSQL writes cannot be one transaction. Replacements upload first, commit the row, then remove the old file. Failed row writes attempt to remove the new upload. Item deletion commits the row deletion then removes the file. Network interruption or a failed cleanup can leave an orphaned private file; the app reports cleanup failures when possible. For larger deployments, add a scheduled storage reconciliation job. Deleting an auth user cascades database rows but does not remove their storage objects; account deletion needs server-side storage cleanup.

## Deploy to Vercel

1. Import the repository into Vercel as a **Next.js** project. Use Node.js **22.18+** (Node 24 is recommended), `npm install` for installation and `npm run build` for the build command. The repository’s `vercel.json` sets the build command to `npm run build` so asset preparation runs. Keep Next.js’s default output settings. Build setup prepares pinned, checksum-verified model and matching WASM assets; the build environment needs network access for uncached assets.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for the intended Vercel environment(s), using the project’s public publishable or legacy anon key. Never use a secret/service-role key. Public variables are embedded during the build, so rebuild when changing them.
3. In Supabase **Authentication → URL Configuration**, set Site URL to the exact production HTTPS origin and allow that origin plus its `/?recovery=1` URL. Add only the specific preview origins you intend to use for authentication; configure corresponding Vercel preview variables if needed. Preserve localhost redirects for local development.
4. Verify the Supabase schema is initialized. Existing installations need the expanded-outfits migration described above if it has not already been applied. This browser-processing update requires **no additional database migration**.
5. Deploy, then test authentication, password recovery, real browser background removal, keep-background saving, accepted-photo uploads and outfit export against the production origin. Check a phone and desktop browser, including the first model download and failure/retry paths.

Vercel serves the web app and static model/runtime assets; inference runs on the visitor’s device. There are no Python workers, child processes, separately hosted model services or extraction API routes to configure. This repository change prepares deployment compatibility; it does not itself create or deploy a Vercel project. Review Vercel and Supabase usage quotas for your audience. Model/runtime downloads count toward static-asset traffic.

### If Vercel reports `api/create-flatlay` has an invalid `maxDuration`

The retired FLUX route used `maxDuration = 960`. The browser-processing version removes both old AI routes, so a deployment reporting that function is using older source or build output. Commit and push the full browser-processing update, including deleted files and new source/build scripts; ignored generated photo assets are recreated during the build. Check the deployment's commit SHA and configured root directory against the updated repository. Build command must be `npm run build`.

Deploy the new commit rather than redeploying the previous failed commit. If the correct new commit still shows stale functions, redeploy that new deployment with **Use existing Build Cache** unchecked. See [Vercel build troubleshooting](https://vercel.com/docs/deployments/troubleshoot-a-build). The updated Next.js build should list only `/` and `/_not-found`, with no `/api/create-flatlay` or `/api/extract-clothing`.

For another Node.js host, use `npm install`, `npm run build`, then `npm start`, with the same public environment variables and Supabase authentication configuration.

## Project map

- `src/app/page.tsx`: authentication, wardrobe, photo editor, studio and saved outfits.
- `src/app/globals.css`: responsive design system and page layouts.
- `src/components/outfit-collage.tsx`: collage preview, pointer/keyboard editing and PNG export.
- `src/lib/outfit-layout.ts`: placement, bounds and browser layout storage.
- `src/lib/supabase.ts`: browser client, shared models and photo preparation.
- `src/lib/clothing-cutout.ts`: mask application, transparency and cropping.
- `scripts/`: browser model/runtime asset preparation.
- `supabase/schema.sql`: initial database/storage setup and security policies.
- `supabase/migrations/20261124_outfit_categories.sql`: expanded categories and multiple pieces per category for existing databases.
- `tests/`: image preparation, processing and outfit layout checks.
