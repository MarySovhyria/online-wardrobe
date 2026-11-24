# Work records

Live directories: `ideas/`, `epics/`, `stories/`, `bugs/`, `handoffs/`. Each record
is Markdown with YAML front matter. Templates live in `.team/templates/`;
fictional examples are excluded from this backlog.

| Type    | ID and filename | Purpose                                              |
| ------- | --------------- | ---------------------------------------------------- |
| idea    | `IDEA-001.md`   | Raw input and PO recommendation before decomposition |
| epic    | `EPIC-001.md`   | Approved outcome and minimum linked stories          |
| story   | `APP-001.md`    | Executable feature or operational work               |
| bug     | `BUG-001.md`    | Observed defect tied to a requirement or regression  |
| handoff | `HND-001.md`    | Durable cross-role assignment/result                 |

Allocate the next unused numeric ID in that type after inspecting live files;
never recycle IDs or include fictional EXAMPLE IDs. Orchestrator serializes ID
allocation and shared state changes. Filename must equal the `id` field. Titles
may change without renaming IDs. Use repository-relative Markdown links from the
record's directory; keep links resolvable.

## Front matter

For compatibility with the dependency-free checker, use flat `key: value` scalar
fields only (strings, dates, booleans); no arrays, multiline scalars, aliases or
nested YAML in front matter. Put rich data in the Markdown sections. Allowed
workflow states: IDEA, DISCOVERY, DESIGN, READY, IN_PROGRESS, REVIEW, DONE, BLOCKED,
PARKED, CANCELLED. Handoffs instead use OPEN, RETURNED or CLOSED.

All work records require `id`, `type`, `status`, `owner`, `created` (YYYY-MM-DD).
Stories/bugs also require `epic`, `priority` (low/medium/high/critical), `ux`
(NONE/LIGHT/FULL), `qa_result` (PENDING/PASS/FAIL/PASS_WITH_FOLLOW_UP) and
`follow_up_accepted` (true/false). `epic: none` is valid for small roadmap-anchored
work or a documented regression. Before READY, use `ux: NONE` only provisionally
and keep READY-06 unchecked until classification is actually reviewed.

Idea `recommendation` is PENDING/BUILD/INVESTIGATE/PARK/REJECT; approval authority
is recorded in the body. A checker pass does not validate approval authenticity.

## Workflow rules

Use the matching template, preserving its sections and gate IDs. Replace TODOs
with evidence or justified not-applicable explanations before checking boxes.
Acceptance criteria use numbered `AC1:`, `AC2:`, etc. Log transitions with date,
actor, from/to, reason, authority and evidence. BLOCKED/PARKED entries include
prior state, responsible owner and resume trigger.

Stories/bugs require both READY/DONE gate sections even while IDEA. A checked
gate needs a short justification/evidence reference; “[x] READY-01: TODO” fails.
Before READY record an approved roadmap/epic anchor or a cited regression, scope
authority, design if applicable and QA expectations. Before DONE record the
developer completion report, per-AC review, documentation/STATE/decision/roadmap
closeout and any explicitly accepted follow-up. See `.team/workflow.md` for the
full semantics and developer override policy.

Do not create placeholder live tickets just to fill these directories. Bootstrap
creates README files so empty directories remain versionable. Do not turn
historically implemented capabilities into new READY tickets or pretend a
bootstrap report is an application release.
