# APP-003 — Mobile preview-centered editing

2026-11-24 · UX:FULL · delegated Designer complete recommendation within direct developer request. No separate human design approval claimed.

## Studio

At <=760px, compact header and bounded dynamic-viewport workspace contain heading/Auto-arrange, centered portrait board, named selected-piece strip, compact Rotate/Size/Actions and seven category triggers in a 4×2 grid. Save/name/export stays below; choosing or adjusting requires no page-list scrolling. Reduce decorative spacing/board size on short portrait viewports. Preserve board coordinates/aspect ratio and desktop full picker/controls.

Category trigger opens native modal bottom sheet, max48dvh. Reduce board while open so its full bounding box remains above the sheet. Label current category, show selected count, close/Done, category tabs and internally scrolling thumbnails with pressed/selected states. Toggling keeps sheet open and supports repeated-category pieces with live board updates. Empty category offers Add a piece, closing before existing editor navigation.

Done/X/backdrop/Escape retain selection and restore focus without moving the editing page; background scroll locked while open. Native modal traps focus/inerts background. On resize to desktop, close/release lock and focus matching desktop category button. Hidden mobile UI leaves tab order.

Select items by board or named strip; controls act on active ID. Default Rotate on changing active item; existing angle/90-degree actions, size, flip/reset/remove retained. Switching tools does not mutate the pose. Removing active chooses another surviving item or empty instruction. All action targets >=44px, labelled sliders/values, visible keyboard focus.

## Photo lighting

Default interpretation of brightness: existing photo-preparation controls, no new outfit filters. On mobile keep prepared/result preview sticky above scrolling lighting controls; existing Compare/Reset/accept/save semantics unchanged. Desktop remains as before. This interpretation was stated while optional clarification remained unanswered.

## Verification

390×844 and shorter375×667; all categories and tools available with board visible; sheet internal scroll, full board above sheet, same-category toggles, dismissal/focus, empty navigation, resize/desktop, no horizontal overflow, save/reopen/export. Photo brightness control and sticky preview simultaneously visible, existing acceptance persists correctly. No schema/model changes or deployment.
