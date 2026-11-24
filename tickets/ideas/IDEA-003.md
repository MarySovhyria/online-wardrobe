---
id: IDEA-003
type: idea
status: READY
owner: orchestrator
created: 2026-11-24
recommendation: BUILD
---

# Vercel-compatible standalone photo preparation

## Raw Input

Developer requests replacing local AI extraction to host on Vercel, accepting upright clothing photos and simpler lighting cleanup. During planning they selected standalone photos only, free in-browser processing, lighting only (no smoothing), and Auto light plus sliders. They approved the complete plan and explicitly requested implementation.

## Context

Current Python/MLX processing cannot accompany the existing Next.js app unchanged on Vercel. Earlier worn-photo/reconstruction direction is superseded by this explicit request. IDEA-001 garment-fidelity discovery supplies context, not evidence that its original issue was reproduced.

## Product Review

- Recommendation: BUILD, returned by delegated Product Owner during planning.
- Outcome: browser-only optional foreground removal, reversible lighting, review/acceptance, existing private saving.
- Minimum scope: APP-002 AC1–AC7. Exclude worn photos, generative reconstruction, wrinkle repair, paid inference, database changes and deployment.
- UX: LIGHT; sequential Designer/QA preparation role passes completed during planning.
- Dependencies: pinned model/runtime assets, real browser inference and build verification.
- Authority: developer's approved plan and explicit implementation request. No production release or billing authority inferred.
- Roadmap: current bounded Vercel-compatibility outcome; no broader launch commitment.
- Next action: implement APP-002 and obtain independent QA.

## Scope Authority

Developer-approved plan, followed by “Implement the approved plan.”

## Derived Work

[APP-002](../stories/APP-002.md)

## History

2026-11-24 | Orchestrator | IDEA → DISCOVERY → READY | Delegated PO BUILD; scope and plan explicitly approved.

2026-11-24 | Orchestrator | Approved recommendation retained | Derived APP-002 completed with QA PASS; no release performed.
