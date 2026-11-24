# Fictional worked example — not a live product requirement

All IDs, approvals, implementation and test results below are imaginary. They
show the lifecycle only. Do not copy them into tickets, STATE, roadmap or accepted
decisions. This example does not establish existing app behaviour.

## 1. IDEA capture

**EX-IDEA-001**, IDEA: “Let me put a short label on an exported outfit sheet.”
Orchestrator preserves the request and creates a PO handoff. No implementation
stories are created until PO has evaluated it.

## 2. DISCOVERY and Product Owner result

Primary recommendation: **BUILD** (fictional).

- Problem: a downloaded outfit image loses the user's chosen context.
- Outcome: an optional label appears in the export and its preview.
- Minimum scope: one optional label on the outfit sheet.
- Exclusions: social sharing, generated captions, new storage sync.
- Roadmap impact: an imagined, already approved export-personalization outcome.
- Authority: imagined developer approval recorded in this example, not actual approval.
- Design: UX:LIGHT; existing export flow gains one input and visible label.

## 3. DESIGN handoff

Orchestrator → Designer: define label interaction within that scope.
Designer returns an imaginary complete specification: optional input before
export; blank means no label; input limit disclosed; preview and download agree;
keyboard-accessible labelled field; existing export loading/error feedback stays;
small-screen wrapping defined. New backend persistence is out of scope.
The imagined approved specification is linked in EX-APP-001.

## 4. READY ticket and QA expectations

**EX-APP-001** contains problem, outcome, scope, no new dependencies, UX:LIGHT
specification, blank/limit/error cases and three criteria:

1. AC1: A entered label appears consistently in preview and PNG.
2. AC2: An empty label produces an unlabeled sheet.
3. AC3: The input enforces the agreed limit and works by keyboard on small screens.

QA defines scenarios for each AC and preservation of existing collage export.
Orchestrator records all gate explanations:

- [x] READY-01: User problem in the fictional discovery above.
- [x] READY-02: Preview/export label outcome specified above.
- [x] READY-03: Single optional label; storage/sharing excluded.
- [x] READY-04: AC1–AC3 are observable and testable.
- [x] READY-05: No new dependency; existing export path identified.
- [x] READY-06: Imaginary approved LIGHT specification covers the changed behaviour.
- [x] READY-07: Blank, length-limit, export error and mobile cases covered.
- [x] READY-08: Per-AC scenarios and export regression expectations documented.
- [x] READY-09: Fictional decision review found no conflicting accepted decision.
- [x] READY-10: Imaginary authorized scope/roadmap anchor; no blocking product question.

Orchestrator moves READY → IN_PROGRESS when the developer starts. The team does
not code merely because the developer asks “Start EX-APP-001.”

## 5. Developer completion and REVIEW

Developer hypothetically reports implementation complete, supplying code notes
and test evidence. Orchestrator records that report and moves to REVIEW.
QA evaluates AC1–AC3 and export regression, records actual methods/results,
and returns imaginary **PASS**. An unspecified font preference is an IMPROVEMENT,
not a failing invented requirement.

## 6. Closeout, DONE and state feedback

- [x] DONE-01: Imaginary developer completion notes/evidence captured.
- [x] DONE-02: Imaginary per-AC evaluation recorded.
- [x] DONE-03: Imaginary required QA PASS; no failing criteria.
- [x] DONE-04: Imaginary export usage documentation updated.
- [x] DONE-05: Imaginary STATE row changes to “optional export label: IMPLEMENTED”.
- [x] DONE-06: No imaginary durable architecture/product decision was made.
- [x] DONE-07: Imaginary epic/roadmap outcome closed; no public release involved.

Only after these records does the Orchestrator mark DONE. In the real project,
STATE and roadmap must remain unchanged by this fictional example. A review PASS
does not authorize publishing the app or spending money.
