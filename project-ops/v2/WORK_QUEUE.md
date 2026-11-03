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
Evidence: [Audit procedure](SEMANTIC_AUDIT_SOP.md), [automated governance validation](VALIDATION_RUNBOOK.md). Scheduled audit created 2026-11-01; its latest outcome is not independently verified here. Bounded milestone and transfer audit on 2026-11-03 reconciled [#332](https://github.com/ginosega/fishing/pull/332), owner-reported private diagnostic deployment/test, and merged development [#334](https://github.com/ginosega/fishing/pull/334) against source/CI/provider/field boundaries; no scheduled-run PASS is inferred.

## FISH-TODO-118 — Fishing Companion V3 continuation

State: in-progress — **isolated read-only D5 reader core OWNER PASS; authenticated owner app and D6 OPEN**
Owner: project owner / assistant implementer
Next safe action: **Bounded D5 authenticated owner-device acceptance gap review.** Use current source and pre-existing private pilot evidence, identify available/absent auth + app integration and an appropriately isolated HTTPS test origin, then propose safe field tests for owner sign-in/session/relaunch, Add/Edit authorization and direct/stale links, editor preservation through Work Offline transition, and blocked Save & Publish while Offline. Do not assume this reader-only Pages site can exercise authenticated owner writes. Any new hosted route, credentials, deploy, publisher write or public V3 cutover needs separately scoped authorization.

Prerequisites: Current V3 development `feature/fish118-p3-mock-publisher@cecda55439a121fa59c5cb0aadc4530cd63859ce`, draft [PR #263](https://github.com/ginosega/fishing/pull/263) still unmerged, source PR [#345](https://github.com/ginosega/fishing/pull/345) merged with [full CI #41708206199](https://github.com/ginosega/fishing/actions/runs/41708206199), [P3 CI #41708206367](https://github.com/ginosega/fishing/actions/runs/41708206367) and [postmerge P3 #41713127319](https://github.com/ginosega/fishing/actions/runs/41713127319) SUCCESS. Owner performed read-only Pages local build, verification and packaging audit, one authorized test-project deployment, then local/hosted SHA-256 comparison and route isolation tests on immutable release `42e15e65600bfd93fb12ee4507245bed`.

Acceptance: **D5 isolated read-only reader core accepted**: hosted identity/12 of 12 sampled files byte-equivalent; six unrelated routes isolated with 404; owner Android Automatic/Work Offline/no-page-rerender and preparation 10/10 PASS; Gear, KB, Catch image/Notes and diagnostics 6/6 PASS; separate installed Android test PWA launches, persists mode through relaunch and offline reading, returns to Automatic, existing public V2 installation unaffected (owner-reported). [#341](https://github.com/ginosega/fishing/issues/341) holds detailed evidence, unknowns and residual noncore negative tests. This is **not** installed/authenticated V3 owner acceptance. Owner private sandbox KB Notes-only Save→Completed 60s met latency threshold once and closed performance investigation [#305](https://github.com/ginosega/fishing/issues/305), but representative V3-SAVE-09 **public Live** D6 gate remains OPEN. Device-local owner draft recovery is unimplemented/provisional [#342](https://github.com/ginosega/fishing/issues/342) under REL-002; never infer durable draft restoration from successful in-memory editor tests.

D6 release gate: Authenticated Android owner session and CSRF-backed publishing, offline/no-lost-draft safety, verified source+CI, hosted full public bytes, rollback, representative Save→public Live, and **separate owner-approved V3 public cutover**. FISH108 protections unchanged; no bypasses or retries of ambiguous writes. Other open issues [#287](https://github.com/ginosega/fishing/issues/287) intermittent offline reliability, [#303](https://github.com/ginosega/fishing/issues/303) exceptional recovery and deferred [#301](https://github.com/ginosega/fishing/issues/301) remain separate.

Evidence: [#341](https://github.com/ginosega/fishing/issues/341) owner Windows/Android observed on 2026-11-03 Pacific; [#345](https://github.com/ginosega/fishing/pull/345) merged; [#342](https://github.com/ginosega/fishing/issues/342) local drafts; [#305](https://github.com/ginosega/fishing/issues/305) performance closeout; [D5 candidate](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/D5_Isolated_V3_Reader_Candidate_2026-10-29.md).

## Independent fishing equipment and editorial backlog

Open, closed and explicitly deleted personal fishing/gear/KB tasks remain discoverable at [FISHING_BACKLOG_INDEX.md](FISHING_BACKLOG_INDEX.md); do not absorb into V3 milestones or reopen silently.
