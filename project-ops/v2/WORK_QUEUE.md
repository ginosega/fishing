# Fishing Project — active work queue (candidate)

**Status:** P1 approved, P2 in progress; V3 feature development paused. Owner is the Fishing Companion project owner; assistant performs routine source/document work.

## FISH-OPS-V2 — Operating-model migration

State: review
Owner: project owner / assistant implementer
Next safe action: Verify strict P3 validator against populated draft docs and cross-check complete retained historical sources; do not merge before P4 acceptance.
Prerequisites: [P1 approval](P1_DESIGN_APPROVAL_2026-11-01.md), [source crosswalk](MIGRATION_COVERAGE_MATRIX.md), verified docs-only branch.
Acceptance: Five active docs bounded; rejected-approach coverage; link/source provenance; no pre-existing code, approvals or public V2 changed; [issue #282](https://github.com/ginosega/fishing/issues/282).
Evidence: [draft PR #283](https://github.com/ginosega/fishing/pull/283).

## FISH-OPS-V2-VALIDATION — Documentation CI

State: in-progress
Owner: assistant implementer
Next safe action: Complete full-lane CI on [PR #285](https://github.com/ginosega/fishing/pull/285), then integrate only to the V3 development branch and prove docs-only PR #283 runs strict structural validation.
Prerequisites: P2 document contracts finalized; [#284](https://github.com/ginosega/fishing/issues/284); no implicit public merge/deploy.
Acceptance: Valid and invalid fixtures tested; docs-only PR runs strict checks; exact-source CI evidence; preserve existing FISH108 classifier, checks and production safeguards.
Evidence: [validator design](DOC_VALIDATION_DESIGN.md).

## FISH-OPS-V2-RECOVERY — Cold-start and adoption

State: blocked
Owner: project owner at final acceptance; assistant prepares checks
Next safe action: Run separate normal and unprepared-emergency chat tests **after** P3; confirm rejected-decision retrieval and ambiguous in-flight safety.
Prerequisites: P2 docs/decision index and P3 validator evidence.
Acceptance: New chat locates default-branch router, distinguishes draft/active, reads bounded state and prior negative decisions; final owner approval; activate docs-only router on `main` without V3 deployment.
Evidence: [static recovery prompt](../../NEW_CHAT_PROMPT.md), [P1 design](P1_OPERATING_MODEL_DESIGN.md).

## FISH-TODO-118 — Fishing Companion V3 (paused)

State: blocked
Owner: project owner / assistant implementer
Next safe action: **Only after operating-model adoption**, refresh current private Worker, GitHub HEAD/CI, Gear Notes fix and Catch publication/UX gates.
Prerequisites: FISH-OPS-V2 P5; existing scoped security/provider/cutover approvals.
Acceptance: D6 real-device and hosted proof, 60-second ordinary text-only verified-Live requirement, separate explicit V3 production cutover approval; never infer from source CI.
Evidence: [PR #263](https://github.com/ginosega/fishing/pull/263), [requirements](../../pwa/docs/Fishing_Companion_v3_Requirements.md).

## Independent fishing equipment and editorial backlog

These tasks remain separate from V3 and the operating-model milestone, and **must not be silently closed or forgotten**. See [FISHING_BACKLOG_INDEX.md](FISHING_BACKLOG_INDEX.md) for currently open, closed, and expressly deleted items with source links.
