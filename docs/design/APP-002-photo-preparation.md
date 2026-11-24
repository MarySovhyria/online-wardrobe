# APP-002 — Standalone photo preparation

2026-11-24 · UX:LIGHT · approved plan and sequential Designer/QA preparation in planning. No implementation verification implied.

User flow: Add/edit photo → prepared original → optional Remove background → optional Auto light/manual lighting → Compare original → Use this photo → existing metadata/save.

- AC1–2: Require one upright standalone item (shoe pair accepted), no worn/generative controls. Browser only, no photo processing API.
- AC3: Background removal off by default. Loading/processing live status, retry, cancel/keep background. Preserve lighting/source on failure. Keep-background path needs no model download.
- AC4: Neutral lighting default; opt-in gentle bounded Auto light plus Brightness, Contrast and Shadows. Reset lighting does not change background choice. No wrinkle removal or generated details.
- AC5: Explicit acceptance of current result required before replacing a photo. Settings/photo edits invalidate acceptance; metadata edits and original comparison do not. Comparing displays prepared original but acceptance always refers to current edited result. Show accepted status. Cancel/replace/close cannot allow stale work to update the result.
- AC6: Existing metadata-only edits need no photo replacement. Existing wardrobe/outfit flows unchanged.
- AC7: Explain first-use asset download, device processing, limits and Vercel setup.

Accessible labels/slider values, keyboard controls, visible focus and live status; stack existing preview/controls on narrow screens. Invalid files show recoverable error. Processing failure cannot enable acceptance of an older preview; retry or keep background restores a current result. Closing discards unsaved changes through existing navigation.

QA: real shipped worker/model/WASM, Chrome and WebKit, transparent and retained-background save, compared result acceptance, lighting reset/Auto bounds, replacement/cancellation races, unavailable model/browser, metadata-only editing and outfit regression. No deployment or new database migration.
