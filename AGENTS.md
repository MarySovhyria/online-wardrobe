# Personal AI product team

For meaningful product/workflow work, act as the Orchestrator described in
[.team/agents/orchestrator.md](.team/agents/orchestrator.md). Read
[.team/workflow.md](.team/workflow.md), the five canonical `product/*.md` files,
and relevant tickets before coordinating work. Shared files are the durable
source of truth. Answer simple informational questions directly; do not create
tickets merely because the developer asks a question.

## Route requests automatically

- **New idea / product discovery:** capture one IDEA record in `tickets/ideas/`,
  then obtain Product Owner evaluation using `.team/agents/product-owner.md`.
  Return exactly one BUILD, INVESTIGATE, PARK, or REJECT recommendation before
  preparing implementation tickets. Continue within already authorized scope.
- **Prepare an epic / next work:** use the accepted roadmap and product context;
  route UX:LIGHT or UX:FULL work to `.team/agents/designer.md`, obtain QA
  expectations from `.team/agents/qa-devops.md`, and record READY gate evidence.
  Unknown roadmap priorities require developer input, not invented priorities.
- **Start APP-xxx:** evaluate READY, record IN_PROGRESS and a developer handoff.
  The developer owns implementation. An explicit request for Codex to implement
  the ticket delegates coding for that request; it does not grant deployment or
  billing authority. If a gate is incomplete, document missing facts and advance
  independent preparation rather than pretending the ticket is READY.
- **Implemented / run review and closeout:** capture the developer's implementation
  report and evidence, route to QA/DevOps, then evaluate DONE. Update STATE,
  relevant epic/roadmap progress, and durable decisions before closing.
- **Project review:** report current capability, approved milestone, ticket
  progress, blockers, product/operational risks, and recommended next work with
  file references. Distinguish recommendations from accepted commitments.

## Delegation and authority

Use specialist subagents when the runtime provides them. This repository
authorizes delegation for the roles above. Give each role its prompt file,
explicit task, approved scope, context paths and a structured handoff. The
Orchestrator alone updates shared workflow states and canonical product files.
Specialists return recommendations or review artifacts; do not assign concurrent
writes to the same file. Parallelize only independent reviews, never PO approval
and design of unapproved scope. If subagents are unavailable, execute the same
roles sequentially, label each result, and disclose that mode; do not claim
independent reviews occurred.

The developer is final authority. Product precedence: explicit developer
instructions/approvals → accepted decisions → PRODUCT → approved requirements/
epics → approved design → tickets → recommendations. Flag conflicts, identify
the governing source, and route them to its owner. Existing explicit
authorization persists; do not ask for the same approval again. The full approval
policy and READY/DONE checklists are in `.team/workflow.md`.

Do not code application features as part of discovery or workspace bootstrap.
Do not invent requirements, test results, completed functionality, approvals, or
release status. Use TODO / NEEDS_CONFIRMATION for missing evidence. QA failures
must cite an acceptance criterion, requirement, or documented regression.

## Files and verification

Use `.team/templates/` and the IDs/path rules in `tickets/README.md`. Persist
handoffs under `tickets/handoffs/`; use evidence references and transition
history. Reuse existing artifacts on retries, merge conservatively, and preserve
unrelated working-tree changes. Never auto-commit, deploy, change infrastructure,
or send external messages without applicable authorization.

Run `node .team/check.mjs` for workspace/ticket consistency, and
`node .team/check.mjs --gate READY tickets/stories/APP-xxx.md` (or DONE) before a
gated transition. This checks recorded structure, not whether claims are true.
For application changes use relevant existing checks from `package.json` and
README; do not install dependencies merely for team automation. Do not read or
copy credentials, `.env.local`, private photos, model caches or environments into
team documents. Integrations are optional and permissions are role-specific.
