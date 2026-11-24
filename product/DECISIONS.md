# Durable decisions

Use ADR-style entries: ID, date, status, decision, reason and consequences, with
authority/evidence. Status: PROPOSED, ACCEPTED, SUPERSEDED or REJECTED. Only
ACCEPTED entries participate in product precedence. Reversals require explicit
developer authorization; preserve the original and link its superseding decision.

## DEC-001 — Markdown product-team workflow

- **Date:** 2026-10-13.
- **Status:** ACCEPTED.
- **Authority:** Developer request to implement the supplied
  `codex_ai_product_team_bootstrap.docx` orchestration specification.
- **Decision:** Use an Orchestrator, Product Owner, Designer and QA/DevOps role,
  with Markdown/Git project artifacts, explicit gates and structured handoffs.
  The developer retains implementation ownership and final authority. Integrations
  are optional; no background service or external integration is provisioned.
- **Reason:** The supplied operating model asks for a disciplined personal
  product team with auditable shared state and portable files.
- **Consequences:** The Orchestrator owns normal workflow transitions; specialists
  recommend/review. New ideas receive PO review before implementation decomposition.
  READY/DONE require evidence. Agents code only when explicitly delegated and
  cannot assume production/release/billing authorization.
- **Evidence:** [.team/workflow.md](../.team/workflow.md),
  [bootstrap review](../.team/bootstrap-review.md).

## Historical architecture decisions

NEEDS_CONFIRMATION: no prior accepted ADR collection was found. Existing Next.js,
Supabase, local extraction and FLUX choices are documented implementation facts
in README/STATE; bootstrap does not retroactively create binding architecture
decisions or silently authorize changes to them.

## Entry template

### DEC-xxx — Title

- Date: YYYY-MM-DD.
- Status: PROPOSED.
- Authority/evidence: TODO.
- Decision: TODO.
- Reason: TODO.
- Consequences: TODO.
- Supersedes / superseded by: none, unless explicitly authorized and linked.

## DEC-002 — Browser-only standalone photo preparation

- **Date:** 2026-11-24.
- **Status:** ACCEPTED.
- **Authority:** Developer selects standalone-only, free browser processing, lighting only, Auto light plus sliders; approves the plan and requests implementation.
- **Decision:** Retire worn-photo segmentation/local Python and FLUX reconstruction. Use optional browser foreground removal and reversible non-generative lighting for upright standalone clothing; no paid inference or separate AI server.
- **Reason:** Support Vercel deployment while preserving garment details and avoiding per-photo inference fees.
- **Consequences:** No wrinkle repair or hidden-fabric reconstruction; model download/device performance matters, so keep-background fallback is required. Existing Supabase data/schema remain unchanged. No deployment authorized.
- **Evidence:** IDEA-003, APP-002 and approved plan in this session. Earlier photo-processing preferences are historical and superseded by this explicit developer direction.
