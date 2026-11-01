# Fishing Project — active work queue

**Authority:** `governance/project-ops` is the single maintained governance source; default-`main` router PR #292 is separate from this branch. [P5 canonical installation plan](P5_CANONICAL_BRANCH_IMPLEMENTATION_2026-11-01.md).

## FISH-OPS-V2 — Complete safe governance adoption

State: blocked
Owner: assistant implementer / project owner for GitHub required-check rule
Next safe action: Finish [#284](https://github.com/ginosega/fishing/issues/284): verify `governance-docs` is required on `governance/project-ops` and invalid PR cannot merge; after owner-only ruleset change, merge the docs-only main router [PR #292](https://github.com/ginosega/fishing/pull/292), verify static prompt/router on default branch and mark P5 complete.
Prerequisites: [P1 approval](P1_DESIGN_APPROVAL_2026-11-01.md), [independent amendment](OWNER_AMENDMENT_INDEPENDENT_GOVERNANCE_2026-11-01.md), [owner P5 direction](P5_OWNER_DIRECTIVE_COMPLETE_GOVERNANCE_2026-11-01.md), [P4 pass](P4_RECOVERY_ACCEPTANCE_2026-11-01.md), [canonical branch plan](P5_CANONICAL_BRANCH_IMPLEMENTATION_2026-11-01.md).
Acceptance: Exactly one authoritative governance branch with automated required structural CI; small root router/static prompt on `main`; no PWA workflow/source changes, no public V2 deployment or V3 rollout; old approved documents preserved.
Evidence: [Issue #282](https://github.com/ginosega/fishing/issues/282), [#284](https://github.com/ginosega/fishing/issues/284).

## FISH-OPS-V2-VALIDATION — Enforce independent checks

State: in-progress
Owner: assistant implementer; project owner for GitHub ruleset edit
Next safe action: Validate actual canonical branch with successful [PR #293](https://github.com/ginosega/fishing/pull/293) and failing [PR #294](https://github.com/ginosega/fishing/pull/294), close both unmerged. Owner adds **required** `governance-docs` status to a branch ruleset targeting `governance/project-ops`; verify required status as readable GitHub evidence.
Prerequisites: Dedicated `.github/workflows/governance-docs.yml` already present on canonical branch; old FISH108 release workflow remains unchanged.
Acceptance: Automated structural validation and negative fixtures run on every governance PR, a missing link produces FAIL, and repository protection **blocks** that PR from merging.
Evidence: [Validation runbook](VALIDATION_RUNBOOK.md), [Issue #284](https://github.com/ginosega/fishing/issues/284).

## FISH-OPS-V2-RECOVERY — Preserve tested transfer behavior

State: review
Owner: assistant for ongoing updates; project owner at any new acceptance gate
Next safe action: After default router installation, perform a bounded read-only router smoke check and maintain static prompt; P4 already passed all four owner-executed tests.
Prerequisites: [P4 acceptance](P4_RECOVERY_ACCEPTANCE_2026-11-01.md).
Acceptance: Same static prompt, small default-branch router, indexed historical decisions on canonical governance branch; no full-bootstrap startup.
Evidence: [P4 acceptance](P4_RECOVERY_ACCEPTANCE_2026-11-01.md).

## FISH-TODO-118 — V3 application development (separate)

State: blocked
Owner: project owner / assistant developer
Next safe action: After governance adoption, independently reconcile source HEAD/CI and private Worker/owner acceptance, Gear Notes image and Catch failed operation before returning to V3.
Prerequisites: P5 adoption and original V3 approvals/security/provider gates. Governance CI does **not** require V3 browser-test success.
Acceptance: V3 D1–D6 technical, latency, source/provider/field and explicit public cutover gates unchanged.
Evidence: [V3 draft #263](https://github.com/ginosega/fishing/pull/263), [PWA issue #287](https://github.com/ginosega/fishing/issues/287).

The independent fishing gear/knowledge backlog remains indexed in [FISHING_BACKLOG_INDEX.md](FISHING_BACKLOG_INDEX.md); deleted or completed historical items are not reopened by inference.
