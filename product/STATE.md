# Current product reality

Snapshot: 2026-11-24, inspected checkout and local APP-001 validation (earlier bootstrap rows retain their verification limits). IMPLEMENTED means source exists for the
capability; it does not prove a remote environment is configured or a production
release is verified. PARTIAL means support has a material functional limitation.
NOT IMPLEMENTED means no implementation evidence was found in the inspected
paths, not a decision never to build it. NEEDS_CONFIRMATION flags uncertain facts.

| Capability                                                                   | State           | Evidence                                                                                                                         | Limits / confirmation needed                                                                                                                                                      |
| ---------------------------------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Account signup/sign-in/sign-out, confirmation and recovery                   | IMPLEMENTED     | [UI](../src/app/page.tsx), [README](../README.md)                                                                                | Live email/provider/redirect configuration: NEEDS_CONFIRMATION                                                                                                                    |
| Private wardrobe create/edit/delete, categories, search/filter/sort          | IMPLEMENTED     | [UI](../src/app/page.tsx), [client/models](../src/lib/supabase.ts)                                                               | Seven categories: Tops, Bottoms, Outerwear (legacy jacket key), Cardigans, Hats, Shoes, Jewelry; expanded schema migration required on existing databases (APP-001, 2026-11-24)   |
| Database/storage owner isolation and atomic outfit selection save            | IMPLEMENTED     | [initial schema](../supabase/schema.sql), [migration](../supabase/migrations/20261124_outfit_categories.sql)                     | Isolated PostgreSQL 16 fresh/legacy migrations, owner isolation and atomic validation passed 2026-11-24; actual Supabase migration/auth/storage not applied or tested             |
| Browser image preparation                                                    | IMPLEMENTED     | [preparePhoto](../src/lib/supabase.ts), [tests](../tests/photo.test.mjs)                                                         | JPEG/PNG/WebP up to 10 MiB; max 1600px edge; HEIC unsupported                                                                                                                     |
| Worn clothing segmentation                                                   | IMPLEMENTED     | [engine](../local-ai/engine.py), [extraction endpoint](../src/app/api/extract-clothing/route.ts)                                 | Semantic classes, not instances; layered tops/outerwear/cardigans can combine; hidden fabric remains missing. Hats/Jewelry require standalone photos (2026-11-24)                 |
| Standalone background removal                                                | IMPLEMENTED     | [engine](../local-ai/engine.py), [cutout](../src/lib/clothing-cutout.ts)                                                         | U2Net foreground extraction may retain a person if used on a worn photo; edge quality needs review                                                                                |
| Upright flat-lay generation / hidden fabric                                  | PARTIAL         | [FLUX worker](../local-ai/flatlay.py), [endpoint](../src/app/api/create-flatlay/route.ts), [UI](../src/app/page.tsx)             | AI estimates missing detail and can change colour/pattern/shape; MLX Apple Silicon/macOS 15+, 512px/four-step previews; not exact reconstruction                                  |
| Original/generated/cutout review before storage                              | IMPLEMENTED     | [editor](../src/app/page.tsx), [mask processing](../src/lib/clothing-cutout.ts)                                                  | Original retained only in editor memory; final transparent WebP saved; failed generation preserves prior preview                                                                  |
| Local model execution and shared concurrency lock                            | IMPLEMENTED     | [Node worker](../src/lib/local-extraction.ts), [lock](../local-ai/worker_lock.py), [requirements](../local-ai/requirements.txt)  | Extraction timeout 180s, FLUX 900s; model setup required on host; browser does not run AI                                                                                         |
| Editable outfit collage / PNG export                                         | IMPLEMENTED     | [collage](../src/components/outfit-collage.tsx), [layout](../src/lib/outfit-layout.ts), [tests](../tests/outfit-layout.test.mjs) | Multiple pieces per category; item-ID controls and legacy layout compatibility; auto-placement, drag/keyboard, rotate/scale/flip; 1600×2240 PNG; image URLs required (2026-11-24) |
| Dedicated Saved outfits section / selections                                 | IMPLEMENTED     | [UI](../src/app/page.tsx), [save_outfit](../supabase/schema.sql)                                                                 | Direct navigation, open/delete, independent multi-piece selection and browser-local layouts. Saves new outfits/copies; remote migration still required (2026-11-24)               |
| Custom collage persistence across devices                                    | PARTIAL         | [local layout storage](../src/lib/outfit-layout.ts)                                                                              | Positions are account-scoped browser localStorage; selections in Supabase; custom positions do not sync across browsers                                                           |
| Responsive UI                                                                | IMPLEMENTED     | [styles](../src/app/globals.css), [UI](../src/app/page.tsx)                                                                      | APP-001 narrow-screen navigation and keyboard composition checked locally; full device/accessibility audit not performed                                                          |
| Standard Vercel serverless local-AI deployment                               | NOT IMPLEMENTED | [README deployment limits](../README.md)                                                                                         | Requires persistent Node/Python/model host or a separately secured service                                                                                                        |
| Automated storage reconciliation / complete account-deletion storage cleanup | NOT IMPLEMENTED | [README data limits](../README.md)                                                                                               | Partial storage/database failures can leave orphaned files; no job implemented                                                                                                    |
| AI product-team workflow                                                     | IMPLEMENTED     | [entry instructions](../AGENTS.md), [workflow](../.team/workflow.md), [review](../.team/bootstrap-review.md)                     | Request-driven Codex workflow; no background scheduler/service; specialist runtime availability varies                                                                            |

## Verification Boundary

APP-001 local update (2026-11-24): 27 tests, typecheck, production build and formatting passed; mocked Chrome workflows verified seven-piece save/reopen/export, independent edits, legacy layouts, error recovery, accessory restrictions and 390px navigation. Isolated PostgreSQL 16 verified new/fresh/legacy schema, ownership and atomic saves. See [review](../docs/operations/APP-001-review.md). This does not verify or apply the remote Supabase migration. No actual AI-quality re-evaluation or deployment occurred.

Bootstrap inspected source, README, schema and test definitions. Application tests,
live Supabase policies/auth/email, deployment and real models were not re-run as
part of this documentation/workflow change. README reports earlier automated,
browser and model checks including an approximately 67-second FLUX sample on an
8 GB M1; those are historical reports, not new results. They do not establish
correctness for every garment or remote configuration.

The checkout already contained uncommitted extraction/FLUX/collage changes before
bootstrap. Their functionality is inventoried here; this workspace does not imply
those changes were committed, merged or released. Keep existing application diffs.

## Update Protocol

At meaningful closeout, update affected capability rows, evidence/date and known
limitations. If no capability changes, record that assessment in the ticket's
DONE-05 evidence. Preserve honest verification boundaries and unknowns; never
substitute roadmap intent for current product reality.
