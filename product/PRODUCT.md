# Product constitution

Initialized 2026-10-13 from the existing README, source and the developer's
wardrobe/extraction/flat-lay/collage requests. This records supplied direction;
unconfirmed strategy remains TODO. Current implementation belongs in STATE.

## Vision

Help someone turn photographs of their own clothing into a private digital
wardrobe and assemble a one-page outfit collage similar to the supplied Pinterest
reference. The current app is named **The Edit — your personal wardrobe** in README.

## Target User

Known: the developer wants to manage their own wardrobe. As of 2026-11-24, approved photo input is upright standalone clothing, processed free in the browser for Vercel compatibility (DEC-002). Earlier worn-photo requests are superseded.

TODO: Confirm whether the intended audience remains personal use or includes
other users, and define their needs. Account support is existing capability,
not evidence of an approved commercial or multi-user launch strategy.

## Core Problems

- Clothing is embedded in photos of people/backgrounds rather than reusable pieces.
- Hidden fabric and orientation make a simple cutout less suitable for flat-lays.
- Individual pieces need an editable top-to-bottom composition for an outfit image.

## Product Principles

Derived from supplied requests and documented behaviour:

- Use upright standalone clothing photos, with optional browser foreground removal.
- Avoid per-photo paid inference; photo preparation runs on the visitor’s device.
- Let the user inspect and explicitly accept the photo result before saving; preserve garment geometry and avoid generative reconstruction.
- Keep personal clothing/account data private within the documented ownership model.
- Provide a responsive wardrobe and an editable, exportable outfit sheet.

TODO: Confirm any additional product principles; do not infer them from framework choices.

## MVP Outcomes

Existing requested outcomes: add and organise clothing; extract reusable cutouts;
adjust lighting on upright standalone photos; assemble/save outfits and export a collage.

TODO: Developer-approved MVP boundary, current milestone, release audience and
success measures. Existing features are not an automatically accepted launch gate.

## Explicit Non-goals

Current photo non-goals (DEC-002): worn-photo extraction, hidden-fabric generation, smoothing/wrinkle repair and paid inference. Bootstrap-only non-goal was application changes during workspace installation.

TODO: Define product non-goals. Missing categories, sharing, recommendations and
unsupported hosting are current limitations, not approved permanent non-goals.

## Constraints

- Developer owns implementation and final product authority; the AI team manages
  product thinking, UX, planning, QA/operations and shared state.
- Core team workflow must work with Markdown and Git; integrations are optional.
- Application architecture and environment constraints are documented in README
  and STATE. They describe current reality and must not be silently promoted to
  irreversible product decisions.

## Open Product Questions

- What outcome should NOW prioritize?
- Is this for personal use only, or what audience should a future release serve?
- What defines the approved MVP and its success?
- What non-goals and constraints should be treated as long-term commitments?

These questions do not block the team bootstrap. Resolve only the questions
material to the next actual idea; do not invent tickets or priorities for them.
