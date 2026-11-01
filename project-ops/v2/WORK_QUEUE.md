# Fishing Project — active work queue (candidate)

**Governance status:** Independent of V3 PWA application tests by owner-approved [amendment](OWNER_AMENDMENT_INDEPENDENT_GOVERNANCE_2026-11-01.md). Assistant owns routine documentation/validation; project owner authorizes consequential decisions and runs fresh-chat acceptance.

## FISH-OPS-V2 — Independent operating-model migration

State: review
Owner: project owner / assistant implementer
Next safe action: Verify docs-only [PR #288](https://github.com/ginosega/fishing/pull/288), structural/semantic decision coverage and exact links, then conduct owner-run P4 cold-start before adoption.
Prerequisites: [P1 design approval](P1_DESIGN_APPROVAL_2026-11-01.md); [independence amendment](OWNER_AMENDMENT_INDEPENDENT_GOVERNANCE_2026-11-01.md); migration [reconciliation](P2_MIGRATION_RECONCILIATION_2026-11-01.md).
Acceptance: Preserved old canonical records and historical approved/rejected options, bounded working docs, static prompt, clean-chat test, final owner adoption; **no PWA test dependency**.
Evidence: [governance PR #288](https://github.com/ginosega/fishing/pull/288) · [issue #282](https://github.com/ginosega/fishing/issues/282).

## FISH-OPS-V2-VALIDATION — Independent documentation verification

State: review
Owner: assistant implementer
Next safe action: Confirm exact-head docs-only CI on #288 and independent structural/negative-fixture evidence; prepare owner P4 fresh-chat test. Permanent structural CI enforcement remains separate.
Prerequisites: Document contract from [validation design](DOC_VALIDATION_DESIGN.md), approved amendment; do not alter PWA-owned FISH108 workflow.
Acceptance: Tests are repeatable and evidence-backed; **permanent always-on CI automation explicitly tracked separately**, never claimed installed if absent.
Evidence: [Issue #284](https://github.com/ginosega/fishing/issues/284) · [independent P3 validation](P3_INDEPENDENT_VALIDATION_2026-11-01.md) · [PR #288](https://github.com/ginosega/fishing/pull/288).

## FISH-OPS-V2-RECOVERY — Owner-run cold-start / adoption

State: blocked
Owner: project owner for independent new-chat observations; assistant supplies exact instructions and evaluates evidence
Next safe action: After independent governance validation, use [static prompt](../../NEW_CHAT_PROMPT.md) in two fresh Fishing ChatGPT conversations for normal and emergency scenarios.
Prerequisites: Verified docs PR #288 source, current `main` router absence safely handled, prior rejected decision indexed and testable.
Acceptance: New chats retrieve approved status and negative-decision reasons without history dump, distinguish Git/CI/provider/device and do not retry ambiguous writes; P5 owner accepts limitations and deployment-independent plan.
Evidence: [P4 test plan](P4_COLD_START_TEST_PLAN.md).

## FISH-TODO-118 — Fishing Companion V3 (separate, paused)

State: blocked
Owner: project owner / assistant developer
Next safe action: On independent resumption, verify V3 branch and private Worker/source/CI, Gear Notes and Catch issues, and original security/provider release gates.
Prerequisites: V3 product/owner authorization; **not** necessary for governance P4/P5.
Acceptance: All V3 security/latency/deployment/field acceptance and separate public cutover gates remain unchanged.
Evidence: [PR #263](https://github.com/ginosega/fishing/pull/263), [PWA Playwright defect #287](https://github.com/ginosega/fishing/issues/287).

## Independent fishing equipment and editorial backlog

Preserve all open/deleted/closed tasks in [FISHING_BACKLOG_INDEX.md](FISHING_BACKLOG_INDEX.md); not subsumed by V3 feature scope or governance tasks.
