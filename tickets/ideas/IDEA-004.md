---
id: IDEA-004
type: idea
status: READY
owner: orchestrator
created: 2026-11-24
recommendation: BUILD
---

# Mobile choosing and adjusting without losing the preview

## Raw Input

Developer asks for pop-up clothing selection with buttons for every clothing type in mobile outfit creation, and immediate preview while adjusting brightness/rotation rather than scrolling between controls and image.

## Context

Current studio stacks board, controls and full wardrobe picker on mobile. Photo preparation similarly places lighting controls below its preview. Existing category/multi-selection and private persistence stay unchanged.

## Product Review

Delegated PO: BUILD. Smallest useful scope is category-triggered mobile bottom sheet, visible board with compact controls, original desktop behavior and persistent data unchanged. UX:FULL completed by delegated Designer. AC1–AC7 in APP-003. New per-outfit brightness semantics are excluded; optional clarification was offered, and after waiting the Orchestrator stated the default interpretation as existing photo-lighting preview visibility. This adds no filters or persistence fields.

## Scope Authority

Direct developer implementation request. No deployment or database change authorized. Independent picker/transform work does not depend on the optional brightness preference.

## Derived Work

[APP-003](../stories/APP-003.md)

## History

2026-11-24 | Orchestrator | IDEA → DISCOVERY → READY | PO BUILD, complete FULL design within direct request.
