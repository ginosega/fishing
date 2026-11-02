# Fishing Project — active work queue

**Authority:** Canonical active state is `governance/project-ops`; default `main` `PROJECT_ROUTER.md` and `NEW_CHAT_PROMPT.md` are static entry points. [Operating rules](OPERATING_RULES.md) apply to subsequent work.

## FISH-OPS-V2 — Operating Model v2 adoption

State: closed
Owner: project owner; assistant implementation
Next safe action: Routine in-place upkeep only, through protected governance PRs; do not reopen migration solely because PWA app development resumes.
Prerequisites: P1 design approval and independence amendment; completed P2, P3, P4 and P5 evidence.
Acceptance: Five bounded current documents, permanent static transfer prompt/router, indexed accepted/rejected/deferred/superseded lessons and original sources, no duplicate active authority; owner-approved full adoption.
Evidence: [Owner directive](P5_OWNER_DIRECTIVE_COMPLETE_GOVERNANCE_2026-11-01.md), [P4 acceptance](P4_RECOVERY_ACCEPTANCE_2026-11-01.md), [main router PR #292](https://github.com/ginosega/fishing/pull/292), [ruleset #26335925](https://github.com/ginosega/fishing/rules/26335925).

## FISH-OPS-V2-VALIDATION — Required independent structural checks

State: closed
Owner: assistant implementer; project owner configured protected branch
Next safe action: Maintain validator and fixture checks through review/required CI on canonical governance branch; keep PWA release safeguards separate.
Prerequisites: `governance-docs` on `governance/project-ops`, required `fishing-merge-ready`, strict up-to-date status rules.
Acceptance: Valid governance PR PASS; invalid missing link FAIL; non-draft failing PR's GitHub merge state blocked; entire working corpus and ancillary docs covered; deleting all active docs no longer bypasses validator.
Evidence: [Issue #284](https://github.com/ginosega/fishing/issues/284), [ruleset](https://github.com/ginosega/fishing/rules/26335925), [negative block PR #296](https://github.com/ginosega/fishing/pull/296), [hardening PR #297](https://github.com/ginosega/fishing/pull/297).

## FISH-OPS-V2-RECOVERY — Bounded new-chat transfer

State: closed
Owner: assistant for ongoing maintenance; project owner accepted P4 field recovery
Next safe action: For normal handoff repeat exact unchanged fenced static prompt; for emergency recover it from default main and recheck router/refs.
Prerequisites: [P4 field evidence](P4_RECOVERY_ACCEPTANCE_2026-11-01.md) and active main router.
Acceptance: Both normal and emergency new-chat recoveries passed, including prior rejected alternatives and safe handling of unknown provider/publishing state.
Evidence: [P4 acceptance](P4_RECOVERY_ACCEPTANCE_2026-11-01.md), [static prompt](../../NEW_CHAT_PROMPT.md).

## FISH-OPS-V2-SEMANTIC-AUDIT — Ongoing semantic reconciliation

State: in-progress
Owner: assistant; weekly ChatGPT scheduled task for independent backstop
Next safe action: Run bounded semantic review at each major V3 decision, milestone and release/owner-acceptance checkpoint, plus weekly scheduled Fishing Semantic Audit; propose protected in-place governance corrections when evidence shows drift.
Prerequisites: [SEMANTIC_AUDIT_SOP.md](SEMANTIC_AUDIT_SOP.md) and available connected GitHub source; never treat inaccessible GitHub or unverified provider state as an audit PASS.
Acceptance: Dated evidence-linked audit summary after successful scheduled/checkpoint review; source, CI, hosted deployment, owner field acceptance and decision supersession remain accurately differentiated; verified corrections use the protected governance branch.
Evidence: [Audit procedure](SEMANTIC_AUDIT_SOP.md), [automated governance validation](VALIDATION_RUNBOOK.md). Scheduled audit created 2026-11-01; first scheduled run has not yet executed.

## FISH-TODO-118 — Fishing Companion V3 continuation

State: in-progress
Owner: project owner / assistant implementer
Next safe action: Recover the already-merged [KB Notes-only sandbox PR #45](https://github.com/ginosega/fishing-p3-sandbox/pull/45), which owner reported stuck at Merging despite successful GitHub merge. Narrow exact-merged-proof correction is source-CI-validated at `8101a8e6cd4f4d7f433d4a4fa7370073ec11d6e0` ([run #41395435871](https://github.com/ginosega/fishing/actions/runs/41395435871)); run guarded private prepare-only then version-locked owner deployment. Preserve the original D1 operation and **never resubmit or repeat GitHub merge**. Verify original Notes content/Viewer and fast wake after recovery, then resume independent Gear/Catch tests and ≤60-second release gate [#305](https://github.com/ginosega/fishing/issues/305); separately track [#303](https://github.com/ginosega/fishing/issues/303). Inline Notes optimization remains deferred [#301](https://github.com/ginosega/fishing/issues/301).
Prerequisites: Existing V3 security and operating governance approvals; private Worker already owner-reported deployed, no pending ambiguous publication/automatic duplicate submission; public V3 cutover remains independently gated.
Acceptance: Owner-confirmed Catch Notes image, caption and Viewer Live; sandbox [PR #43](https://github.com/ginosega/fishing-p3-sandbox/pull/43) baseline 116s stopwatch/111s D1 with 70s Validating, then [PR #44](https://github.com/ginosega/fishing-p3-sandbox/pull/44) normal text-only Live in **59.45s** with much faster owner-observed Validating (one provisional ≤60s PASS). Repeated measurements and hosted/device/security acceptance remain pending; species-derived cover image untested because sandbox species pictures are absent.
Evidence: Draft V3 [PR #263](https://github.com/ginosega/fishing/pull/263) `3827a49c3bc1e09e1acc95df502191e7e444936f`, source [CI #41392474921](https://github.com/ginosega/fishing/actions/runs/41392474921) PASS (184 PWA, 43 broker, 790 private tests and Chromium), owner-reported private Worker `463f67af-9f6d-4d32-a561-4dd100a73c6f` deployed Nov 1 PST, [sandbox PR #44](https://github.com/ginosega/fishing-p3-sandbox/pull/44) merged with [CI #41393437060](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/41393437060) success Nov 2 UTC, owner 59.45s timing Nov 1 PST; owner D1 screenshot from [PR #43](https://github.com/ginosega/fishing-p3-sandbox/pull/43); [issue #305](https://github.com/ginosega/fishing/issues/305), [watchdog #303](https://github.com/ginosega/fishing/issues/303); [KB Notes-only recovery issue #308](https://github.com/ginosega/fishing/issues/308), owner stuck Merging Nov 1 PST, merged [sandbox PR #45](https://github.com/ginosega/fishing-p3-sandbox/pull/45), exact-head [CI #41395435871](https://github.com/ginosega/fishing/actions/runs/41395435871) PASS; no private rollout yet.

## Independent fishing equipment and editorial backlog

Open, closed and explicitly deleted personal fishing/gear/KB tasks remain discoverable at [FISHING_BACKLOG_INDEX.md](FISHING_BACKLOG_INDEX.md); do not absorb into V3 milestones or reopen silently.
