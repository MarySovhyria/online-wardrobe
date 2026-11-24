# Product-development workflow

## Lifecycle and state ownership

`IDEA → DISCOVERY → DESIGN (when required) → READY → IN_PROGRESS → REVIEW → DONE`

Side states: `BLOCKED`, `PARKED`, `CANCELLED`. Only the Orchestrator normally changes
workflow state. Specialists propose states and return artifacts. The developer
may override any state or decision; record the override and its reason, rather
than fabricating gate evidence. A developer override is recorded in History and
may leave a deliberate checker failure until the missing evidence is supplied.

| From                       | To                | Requirement                                                                  |
| -------------------------- | ----------------- | ---------------------------------------------------------------------------- |
| IDEA                       | DISCOVERY         | Raw idea captured; PO evaluation requested                                   |
| DISCOVERY                  | DISCOVERY         | INVESTIGATE: record specific questions, evidence and owner                   |
| DISCOVERY                  | DESIGN            | BUILD scope authorized; UX:LIGHT/FULL requires design                        |
| DISCOVERY                  | READY             | BUILD scope authorized, UX:NONE justified, READY gate passes                 |
| DESIGN                     | READY             | Applicable design approved; READY gate passes                                |
| READY                      | IN_PROGRESS       | Developer starts implementation or explicitly delegates coding               |
| IN_PROGRESS                | REVIEW            | Developer reports completion with available evidence                         |
| REVIEW                     | DONE              | QA and DONE gates satisfied; closeout recorded                               |
| REVIEW                     | IN_PROGRESS       | Cited failure needs agreed-scope changes; preserve review history            |
| DISCOVERY / DESIGN / READY | DISCOVERY         | Changed requirement invalidates readiness/design; PO re-evaluates            |
| Any active state           | BLOCKED           | Record blocker, owner, missing input and prior state                         |
| Any active state           | PARKED            | Record reason and revisit trigger; PO PARK recommendation                    |
| Any unfinished state       | CANCELLED         | Record rejection/cancellation reason; preserve files                         |
| BLOCKED / PARKED           | Prior valid stage | Resolve blocker/revisit trigger; recheck stale approvals and gates           |
| DONE                       | DISCOVERY         | Explicit reopening, with reason and new scope; otherwise create a linked bug |

PO REJECT recommends CANCELLED, not file deletion. CANCELLED work restarts only
on developer instruction, with recorded history. An idea record ends at an
approved recommendation: BUILD links to derived epics/stories rather than
pretending the idea itself passed implementation QA. Epic completion evaluates
its own success/completion criteria and linked story status. Story and bug gates
below apply to executable work; operational work can use a story with UX:NONE.

## Authority and conflicts

Within product artifacts, precedence is:

1. Explicit human developer instructions and approvals.
2. Accepted entries in `product/DECISIONS.md`.
3. `product/PRODUCT.md`.
4. Approved product requirements / epics.
5. Approved design specifications.
6. Individual tickets.
7. Agent recommendations.

System/tool restrictions still apply. Existing code describes reality, not a new
product requirement. If a lower source conflicts with a higher one, record both
sources, affected artifacts, impact and owner in a handoff; do not silently
resolve it. PO owns product ambiguity; Designer owns interaction clarification;
QA owns evidence questions. Escalate unresolved disagreements, major scope
changes and architecture-impacting requirements to the developer. Accepted
decisions can be superseded only with explicit developer authorization.

## Request-driven automation

1. **Capture:** allocate one IDEA ID; preserve the developer's raw input. Scan
   existing ideas to avoid duplicate work. Do not split an unreviewed idea into
   an implementation backlog.
2. **Product review:** PO reads PRODUCT/ROADMAP/STATE/DECISIONS and returns exactly
   one BUILD / INVESTIGATE / PARK / REJECT. Explain problem, outcome, roadmap
   impact, minimum scope, exclusions, unknowns and authority needed.
3. **Scope approval:** record existing authorization with its source. Ask only
   for an uncovered material decision; continue independent preparation while
   waiting. An expired wait is not approval. BUILD is a recommendation, not a
   grant of authority.
4. **Epic:** for approved substantial work create/update an outcome-oriented
   epic. Small work can link directly to an approved roadmap outcome. Record the
   source idea and approval; never invent an active milestone.
5. **Design:** classify UX:NONE/LIGHT/FULL. Route LIGHT/FULL to Designer; record
   design completeness and approval. FULL needs implementable interactions.
6. **Decompose:** create only the minimum coherent stories, bugs or operational
   stories. Keep acceptance criteria traceable to approved outcomes and design.
7. **Readiness:** QA defines expectations; Orchestrator evaluates every applicable
   READY check, links evidence and records missing facts. Run the gate checker.
8. **Development:** hand off READY work to the developer. “Start” records work
   ownership; coding by agents requires explicit delegation. No low-level design
   is required at READY unless an accepted constraint requires it.
9. **Review:** capture developer completion/evidence. QA evaluates the agreed
   criteria and relevant regression/operational scope; returns PASS, FAIL or
   PASS WITH FOLLOW-UP with criterion-specific findings. Unspecified behaviour
   goes to PO rather than becoming an invented failure.
10. **Closeout:** assess/update STATE, decisions, epic/roadmap and release notes
    where applicable. Record follow-up acceptance and DONE history. A workflow
    closeout is not a production release.

The Orchestrator creates durable handoffs before delegation and merges results
after reading them. Specialists must not edit shared state concurrently. When
subagents are unavailable, perform clearly labelled sequential role passes.
Reuse artifacts on retries; avoid repeatedly spawning a role for unchanged work.

## READY gate for stories and bugs

Use these exact checklist IDs under `## READY Gate` in each executable ticket.
An unchecked item fails the gate. Check a box only when its text cites evidence
or explains why it is not applicable. TODO/NEEDS_CONFIRMATION does not pass.

| ID       | Required recorded evidence                                                                   |
| -------- | -------------------------------------------------------------------------------------------- |
| READY-01 | Explicit problem / user need (bugs: observed versus expected behaviour)                      |
| READY-02 | Explicit expected outcome                                                                    |
| READY-03 | Included scope and explicit out-of-scope items                                               |
| READY-04 | Numbered, testable acceptance criteria (AC1, AC2, …)                                         |
| READY-05 | Dependencies identified, with resolution/owner or justified none                             |
| READY-06 | UX:NONE/LIGHT/FULL recorded; required design complete and approved, or NONE rationale        |
| READY-07 | Important edge/error states covered, or justified absence                                    |
| READY-08 | QA scenarios and required evidence defined against acceptance criteria                       |
| READY-09 | Relevant accepted decisions referenced, or an explicit checked finding of none               |
| READY-10 | No unresolved product question blocks implementation; approved scope/roadmap anchor recorded |

READY does not transfer architecture or implementation ownership to an agent.
For bugs, a documented regression is the scope anchor; an approved epic is not
required merely to fix that regression. Product changes disguised as bugs return
to PO. READY-01 through READY-10 must remain satisfied in IN_PROGRESS and REVIEW.

## DONE gate for stories and bugs

Use these exact checklist IDs under `## DONE Gate`. All READY checks must also
remain satisfied. QA result alone does not close a ticket.

| ID      | Required recorded evidence                                                                                   |
| ------- | ------------------------------------------------------------------------------------------------------------ |
| DONE-01 | Developer reports implementation complete and supplies available commit/PR/notes/test evidence               |
| DONE-02 | Every acceptance criterion evaluated with result and evidence                                                |
| DONE-03 | Required QA passed, or PASS WITH FOLLOW-UP explicitly accepted by developer; no unresolved failing criterion |
| DONE-04 | Documentation impact assessed, with changed files or reason for no changes                                   |
| DONE-05 | STATE reflects changed capability/limits, or explicit no-capability-change assessment                        |
| DONE-06 | Durable decisions recorded where made, or explicit finding of no new decision                                |
| DONE-07 | Epic/roadmap progress assessed and updated where applicable; release notes assessed for release work         |

Record `qa_result: PASS`, `FAIL`, `PASS_WITH_FOLLOW_UP`, or `PENDING` in executable
ticket front matter. `follow_up_accepted: true` requires a linked developer
acceptance entry, not an agent assumption. A FAIL returns to development or
becomes BLOCKED. Proposed scope changes cannot manufacture a PASS for failing
agreed criteria; PO/developer must explicitly amend criteria and preserve history.

## Approval policy

Require explicit developer approval for material changes to vision, target user
or MVP scope; major unauthorized roadmap reprioritization; reversing an accepted
decision; undelegated architecture decisions; destructive repository actions;
production/infrastructure changes, secrets, billing or externally visible
releases. Record the action, reason and relevant policy/source when requesting it.
Do not repeat approval already granted for the same scope in the session.

Routine tickets, design refinement within approved scope, QA findings,
documentation synchronization and ordinary state transitions need no extra
approval. The Orchestrator must prepare a concrete, reviewable result before
requesting approval for an external write/release. A planning handoff grants no
external messaging permission.

## Evidence, safety and portability

Never claim tests passed because a script exists. Distinguish inspected code,
historical reported validation, current executed validation and deployed/runtime
verification. Missing evidence is NEEDS_CONFIRMATION. Update changed capability
rows with a source and date; do not erase older decisions/history.

Inspect before writing; preserve code, existing docs and unrelated working-tree
changes. IDs are unique across live tickets and stable over time. Markdown/Git
is sufficient. Integrations are adapters, not alternative undisclosed sources
of truth: PO gets product/ticket access, Designer product/design access, QA
repository/CI/operations read access, Orchestrator coordination. Elevated writes
remain with the developer unless delegated. Do not copy secrets into artifacts.
