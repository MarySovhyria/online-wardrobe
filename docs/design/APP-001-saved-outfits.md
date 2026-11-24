# APP-001 — Saved outfits and independent pieces

2026-11-24 · UX:LIGHT · delegated Designer review; complete within the explicit developer-authorized scope.

- AC1: Saved outfits becomes a fourth navigation destination on desktop/mobile. List existing cards with open/delete actions; empty state offers Create an outfit. Opening restores all pieces into studio, retaining existing save-as-copy behavior.
- AC2: Tops, Bottoms, Outerwear, Cardigans, Hats, Shoes, Jewelry in category filters and editor. Preserve `jacket` as the stored Outerwear key.
- AC3: Independent item toggles, aria-pressed and visible checkmarks, selected count, named active-piece controls. Category filters never replace the selection. All pieces have independent movement, rotation, scale, flip and removal. Initial repeated-category arrangement separates pieces. Named selected-piece buttons let users select obscured pieces.
- AC4: Save/reopen/export every piece. Layout remains browser-local with legacy category-key compatibility. Save snapshots resolved item positions.
- AC5: Existing records retained through an incremental migration and backwards-compatible RPC.
- AC6: Disable empty/busy save; retain composition and feedback on save failure. Reuse load/error and deletion confirmation patterns. Cancel preserves records.
- AC7: Hats/Jewelry use standalone photos and explain unsupported worn segmentation. Cardigans use upper garment segmentation. No new AI capability implied.

Responsive/accessibility: four mobile navigation actions fit narrow screens; category controls wrap; buttons retain visible focus and labels. Collage keyboard movement and named controls apply to active item IDs. Error feedback uses existing live alerts. No new destructive interaction or loading model.

QA scenarios: dedicated empty/populated view and delete/cancel; all category filters/editor options; repeated tops/jewelry selection, transform/remove independence; save/reopen/refresh/export; legacy layout; load/save failure retention; accessory mode restrictions; desktop/mobile/keyboard. Typecheck, layout regression tests and production build, plus isolated PostgreSQL validation when available. No remote deployment required.
