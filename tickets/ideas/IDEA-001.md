---
id: IDEA-001
type: idea
status: DISCOVERY
owner: orchestrator
created: 2026-10-13
recommendation: INVESTIGATE
---

# Preserve garment fidelity during photo upload and cleaning

## Raw Input

Developer, 2026-10-13:

> New idea: I want the photo upload and cleaning be better. Atm when the photo with clothing is uploaded the resulted piece is normally not like the original one. Run product discovery.

## Context

The intended outcome is a wardrobe piece that still looks like the actual
garment. Relevant product direction: [PRODUCT](../../product/PRODUCT.md),
[ROADMAP](../../product/ROADMAP.md), [STATE](../../product/STATE.md),
[DEC-001](../../product/DECISIONS.md). No similar live idea exists.

Source inspection distinguishes two processing paths:

- [Regular cutout processing](../../src/lib/clothing-cutout.ts) uses a mask to
  change alpha/crop while retaining the prepared photo's visible RGB values.
  Mask errors can remove fabric or include unwanted foreground. Image preparation
  and final WebP encoding can also affect detail; this is not pixel-identical
  preservation of the original uploaded file.
- FLUX flat-lay generation (`local-ai/flatlay.py`, historical; retired by APP-002) synthesizes a new 512px
  image from a reference limited to 512px. Its prompt asks for faithful details,
  but does not guarantee garment identity or exact hidden fabric.
- [Editor routing](../../src/app/page.tsx) extracts from the generated photo
  when a flat-lay is present, otherwise from the original prepared photo.
- Segmentation (`local-ai/engine.py`, historical; retired by APP-002) selects garment classes, with known
  occlusion and layered-garment limitations. Worn and standalone inputs differ.
- README/STATE report historical FLUX sleeve/colour drift. This discovery has
  not reproduced the developer's current failure or inspected private photos.

## Product Review

**Primary recommendation: INVESTIGATE**, returned by the delegated Product Owner
via [HND-002](../handoffs/HND-002.md).

### User problem and outcome

The saved wardrobe piece should be recognisable as the actual garment in the
photo. The developer reports frequent mismatch in the core clothing workflow;
its frequency, severity and first failing stage are NEEDS_CONFIRMATION. A faithful
result needs to distinguish visible garment detail from estimated hidden fabric.
Exact reconstruction of unseen fabric cannot be promised.

### Smallest useful scope

Identify the processing step where the mismatch first appears and the affected
photo/garment conditions, then recommend one bounded improvement outcome based
on that evidence. Use the stage comparison below and the developer's description
of what changed. Any examples supplied for evaluation remain outside team
Markdown; record only non-sensitive findings and approved evidence references.
No broad benchmark or arbitrary numerical threshold is required for discovery.

### Out of scope

Application implementation, replacement-model/vendor selection, paid services,
new categories, a broad uploader redesign, automated quality scoring, production
changes and roadmap reprioritisation. This discovery has not run models or
inspected private photos. Do not promise hidden-fabric identity or turn a known
generative limitation into a reproduced regression.

### Roadmap impact and decisions

This is a candidate improvement to an existing core outcome. The request makes
fidelity a discovery focus; it does not approve a new NOW milestone or complete
implementation scope. Keep [ROADMAP](../../product/ROADMAP.md) priorities unchanged.
DEC-001 governs routing and authority; no new accepted architecture decision or
implementation epic is justified at this stage.

### Dependencies and open questions

- Developer: confirm which action first produces the mismatch and what differs.
- Developer/context evidence: identify worn versus standalone input, garment
  category and any layered/occluded conditions on a representative failure.
- Orchestrator: record a stage-by-stage comparison from suitable supplied/permitted
  examples without copying private images or signed URLs into team artifacts.
- Product Owner: clarify the acceptable tradeoff if complete upright reconstruction
  conflicts with preserving visible garment detail. No preference is assumed.

The two requested clarifications remain pending. An answer is useful evidence,
not permission for a different architecture, billable service or release.

### UX classification and QA expectations

Provisional **UX:LIGHT** if eventual changes stay within the existing upload/
preview flow. No design is approved yet; substantially new correction interactions
would require reassessment after scope is established.

Separate garment identity (colour, pattern/logo, visible construction and shape)
from extraction correctness (right item, retained visible fabric, holes/edges,
unwanted foreground) and detail/display quality. A later agreed scope should
cover relevant worn/standalone and FLUX/non-FLUX paths, layering/occlusion,
empty/wrong selection, original comparison, result rejection, and preview-to-save
consistency. Numeric pass thresholds and specimen counts remain unapproved.

### Authority, next action and stopping condition

The developer authorized discovery; no extra approval is needed for evaluation
and documentation. Coding is not delegated by this request. No material product,
architecture or roadmap change is adopted.

Next, use the pending answers and a representative original/result comparison to
locate the first loss of fidelity. Stop when an evidence-supported failing stage
and problem class support a concrete, bounded improvement recommendation. If
comparison evidence is unavailable, retain the named gap and owner rather than
expanding into speculative model selection or claiming READY.

## Staged Evidence Plan

| Stage                                  | Compare / observe                                                         | What it can distinguish                                                      |
| -------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Original photo                         | Visible garment identity, type and occlusion                              | Establish known details; hidden fabric has no visible ground truth           |
| Prepared upload                        | Detail/colour relative to original, if intermediate available             | Resizing/re-encoding loss; do not assume loss explains this report           |
| Generated preview, only when FLUX used | Compare before background removal                                         | Synthesis changes to pattern, colour, construction or silhouette             |
| Transparent cutout                     | Compare against the image actually passed to extraction                   | Mask removal, holes, wrong item/foreground and crop issues                   |
| Saved display                          | Compare with accepted preview, if supplied/accessible in authorized scope | Encoding/rendering/persistence differences; saving currently uses the cutout |

Record input type, category, actions used, first differing stage, mismatch type,
visible versus estimated regions, expected/actual result and evidence limits.
The current source tests verify mask RGB invariance and mocked preparation
behaviour, not garment identity. No diagnostic instrumentation, model run or
quality benchmark is implemented by this plan.

## Scope Authority

The developer authorized product discovery and described a fidelity problem in
an existing core workflow. This does not authorize model replacement, paid
services, deployment or application implementation. No roadmap reprioritization
or new durable product decision is assumed.

## Clarification Requested

- Does the difference first appear after FLUX flat-lay generation, regular
  extraction without FLUX, or both?
- Is the mismatch primarily colour/pattern/logo/shape, missing fabric/holes/edges,
  or selection of the wrong garment/background?

Answers are pending. Do not assume FLUX alone explains this report.

## Derived Work

None. Product discovery precedes implementation stories and READY gates.

## History

- 2026-10-13 | Orchestrator | captured IDEA → DISCOVERY | Developer requested discovery; PO review assigned, fidelity-path clarification requested.

- 2026-10-13 | Product Owner → Orchestrator | DISCOVERY retained | INVESTIGATE recommendation recorded; stage evidence plan prepared; user clarifications pending.

2026-11-24 context: DEC-002/APP-002 supersedes the worn-photo and generative pipeline with standalone browser preparation; original fidelity observations remain historical, not newly reproduced.
