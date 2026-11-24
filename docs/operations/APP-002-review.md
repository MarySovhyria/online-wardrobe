# APP-002 — Browser photo preparation review

2026-11-24 · **QA PASS, AC1–AC7** · local working tree, not a deployment.

Independent QA inspected the implementation and executed `npm test`: **23/23 passed**. The Orchestrator executed production build, formatting/type checks and real browser inference/workflows. No required fixes or accepted follow-ups remain.

| Criterion | Result | Evidence                                                                                                                                                                                                                                                                                                                                               |
| --------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC1       | PASS   | Production Next.js build lists only root and not-found static routes. No Python/MLX/child-process runtime, setup scripts or extraction/FLUX APIs remain. Browser trace makes no AI API request.                                                                                                                                                        |
| AC2       | PASS   | Standalone upright item guidance, optional background checkbox and lighting controls replace worn/garment-class/generation choices.                                                                                                                                                                                                                    |
| AC3       | PASS   | Real U2NetP/WASM inference in Chrome and WebKit produces transparent/solid pixels and cropped bounds. Simulated model fetch failure, retry, cancellation and keep-background save succeed.                                                                                                                                                             |
| AC4       | PASS   | Pixel tests verify neutral RGB/alpha identity, retained alpha/positions and bounded opt-in suggestions. Real Auto light/reset and manual lighting work in both browsers. No smoothing/generation path.                                                                                                                                                 |
| AC5       | PASS   | Compared-original display does not change accepted output: captured uploaded Blob matches edited preview bytes exactly. Controls invalidate acceptance; file replacement resets settings/acceptance. Cancelled work cannot overwrite replacement. Metadata edits retain acceptance.                                                                    |
| AC6       | PASS   | Existing metadata-only editing works without photo processing/upload in both engines. Existing four-piece outfit with two tops opens and exports all four images. Existing outfit layout tests pass. No schema/migration changes.                                                                                                                      |
| AC7       | PASS   | README covers Vercel/Node build, pinned/static assets, downloads/device limits, browser requirements, notices and Supabase variables/redirects. `vercel.json` explicitly runs npm build with asset preparation. Initial model verified and cached setup repeated. Altered-download integration test rejects checksum mismatch without writing a model. |

## Executed evidence

- `npm test`: 23/23 passed, independently rerun by delegated QA.
- `npm run build`: passed after browser encoder fix; prebuild asset setup passed. No AI server route in output.
- `npm run typecheck`, `npm run format:check`, `git diff --check` and team gates are completion checks.
- Browser engines: installed Chrome **158.0.8127.37**, Playwright WebKit **27.2**, headless on this Mac. 390×844 viewport verified without horizontal overflow; screenshot inspected. No browser exceptions on final all-mocked-account/storage run.
- Real shipped U2NetP/ONNX WASM ran on a synthetic upright striped-shirt fixture, about 1.9 seconds in final runs on this machine. This establishes executable browser inference, not accuracy/speed across real garments or devices. Model masking and transparent/solid output bounds inspected numerically.
- WebKit exposed native Canvas WebP fallback-to-PNG. Fixed with lazy pinned jSquash WebP WASM encoder, integrated into original preparation, lighting and cutout serialization. Latest Chrome/WebKit workflows and exact WebP Blob uploads pass.
- Browser fixtures: `/private/tmp/wardrobe-outfit-check/photo-check.mjs`, `metadata-check.mjs`, `versions.mjs`; screenshots and export images are local execution artifacts. No credentials or private photos are stored in review files. The browser fixtures use synthetic photos and fake account/storage routes; model/runtime/codec assets are real.
- Initial build found stale Next development validators pointing at retired routes. Old generated type cache moved to a temporary directory; clean production regeneration passed. Generated next-env changes restored to original tracked content.

## Operations and limits

No Vercel project creation/deployment, live Supabase verification, database migration or real garment-quality assessment performed. Existing outstanding expanded-outfit migration is separate; APP-002 needs no new migration. Source photos are prepared on device; only explicitly accepted results upload through the existing private storage flow. Model/runtime/codec assets are generated by predev/prebuild and ignored by Git. Initial downloads require a connection; browser runtime/device failures retain a keep-background path. Ignored Python environments and model caches were left untouched.

Product direction and current capability documented in DEC-002, PRODUCT, STATE and ROADMAP. README is the user-facing setup/change documentation; no release requested.

## Follow-up: Vercel reports retired function duration

2026-11-24: developer reports Hobby validation failure for `api/create-flatlay`. Read-only comparison confirms local HEAD `d2fd312` still contains the retired route with `maxDuration = 960`, while working-tree route deletions/browser-processing changes remain uncommitted. The local production app-paths manifest has no AI routes. No duration cap is needed in the new browser pipeline. The developer must commit/push the complete update and deploy that new commit; redeploying old source preserves the error. README now includes commit/root-directory/build-command and stale-cache troubleshooting. No commit, push or remote deployment performed by the agent.
