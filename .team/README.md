# Personal AI product team

This workspace implements the developer-supplied **Codex Bootstrap Specification:
Personal AI Product Team** (`codex_ai_product_team_bootstrap.docx`, inspected on
2026-10-13). It coordinates planning, UX, review and project state. The developer
owns implementation and final authority.

## How to use it

Open Codex in this repository. The root [AGENTS.md](../AGENTS.md) routes meaningful
requests through [workflow.md](workflow.md) and the four role contracts. Start a
new session after adding/changing repository instructions so they are discovered
at startup, or explicitly ask the current session to read `AGENTS.md`. See the
[official instruction-discovery guide](https://learn.chatgpt.com/docs/agent-configuration/agents-md).

Example requests:

- “New idea: [your idea]. Run product discovery.”
- “Prepare the approved next roadmap epic until it is ready for development.”
- “Which READY ticket should I implement next, and why?”
- “Start APP-001.” (Records a development handoff; you implement it.)
- “Implement APP-001 for me.” (Explicitly delegates that ticket's coding.)
- “APP-001 is implemented in [commit/PR or notes]. Run review and closeout.”
- “Give me a project review: progress, blockers, risks and recommended next work.”

No daemon, recurring job, paid API, external plugin or account is installed.
Automation runs when a Codex session handles a request. When specialist
subagents are available the Orchestrator delegates to them; otherwise it runs
the same roles sequentially and records that mode. Role prompt files are not
registered standalone services or sandbox permissions. Actual tool restrictions
still apply. Chat messages are inputs; persist conclusions and approvals in
files before treating them as durable project facts.

## File map

| Path                                                            | Responsibility                                                      |
| --------------------------------------------------------------- | ------------------------------------------------------------------- |
| `AGENTS.md`                                                     | Repository entry point and conversational routing                   |
| `.team/workflow.md`                                             | Lifecycle, precedence, approvals, READY/DONE gates                  |
| `.team/agents/`                                                 | Orchestrator, Product Owner, Designer, QA/DevOps prompts            |
| `.team/templates/`                                              | Idea, epic, story, bug, handoff, design and release reviews         |
| `.team/check.mjs`                                               | Read-only structural and recorded-gate checker, built-in Node only  |
| `.team/examples/`                                               | Fictional worked example; never part of live backlog                |
| `.team/bootstrap-review.md`                                     | Bootstrap evidence, assumptions and acceptance review               |
| `product/PRODUCT.md`                                            | Stable vision, user, principles, non-goals and unknowns             |
| `product/ROADMAP.md`                                            | Outcome intentions: NOW/NEXT/LATER/PARKED/COMPLETED                 |
| `product/STATE.md`                                              | Current implemented/partial/missing capability and evidence         |
| `product/DECISIONS.md`                                          | Proposed/accepted/superseded durable decisions                      |
| `product/GLOSSARY.md`                                           | Domain terms based on existing evidence                             |
| `tickets/`                                                      | Work records, ideas and durable handoffs; see its README            |
| `docs/design/`                                                  | Approved interaction specifications and design review records       |
| `docs/operations/`                                              | QA, release and operational evidence                                |
| Existing `README.md`                                            | Application setup, architecture, validation and deployment guidance |
| Existing `src/`, `local-ai/`, `supabase/`, `tests/`, `scripts/` | Application implementation; preserved by bootstrap                  |

There was no equivalent product, ticket, design or team structure to merge.
`tickets/ideas/` and `tickets/handoffs/` supplement the supplied structure so raw
ideas and cross-role handoffs have durable homes. No application documentation
was moved or replaced. Markdown/Git is authoritative; optional adapters may
synchronize it later.

## Check recorded gates

```sh
node .team/check.mjs
node --test .team/check.test.mjs
node .team/check.mjs --gate READY tickets/stories/APP-001.md
node .team/check.mjs --gate DONE tickets/stories/APP-001.md
```

The checker validates required workspace files, IDs/front matter, checklist
entries, links in live tickets, and recorded gates for READY/IN_PROGRESS/REVIEW/
DONE records. Exit 0 means structural consistency; it does not approve scope,
verify a test claim or launch agents. Templates and examples are excluded from
live-ticket validation. No populated production tickets are created by bootstrap.

## Re-running bootstrap / resuming work

Inspect existing files and Git status first. Reuse exact paths and existing IDs;
do not reset product files or replace their contents with templates. Merge only
missing sections, and preserve accepted decisions, status history and evidence.
Report conflicts before making conflicting edits. Regenerate neither the backlog
nor approvals from chat memory. Read live files after any interruption and resume
the recorded unfinished stage. Do not commit, publish, or provision integrations
as a side effect of bootstrap.

Unknowns are listed in PRODUCT and ROADMAP; they do not block using the workspace.
The next useful step is a real product-discovery request with a developer-chosen
outcome. A repository/CI integration can later supply review evidence; a ticketing
or design integration remains optional and needs its own scoped authorization.
