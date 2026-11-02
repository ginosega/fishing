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
Next safe action: **Investigate GitHub Actions check completion/reporting delay with read-only evidence; no further publication or deploy needed for smoke acceptance.** Owner's post-repair KB Notes edit operation `p3_a1956817-7335-4b39-ab7f-9bb42c9a9835` reached sandbox **Live** 2026-11-02 20:30:37 UTC: [PR #58](https://github.com/ginosega/fishing-p3-sandbox/pull/58) merged once at 20:30:23, exact-head [CI #41519600212](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/41519600212) PASS, owner D1 110s Accepted→Live and 119s Save→Completed. State splits: 1s Accepted, 13s Validating, **73s Checking**, 14s Merging, 1s Deploying, 8s Verifying. Worker trace on currently deployed `2909a0fd-fc8a-4bfa-a340-802c65771fde` shows `github_protected_merge` refused, then repaired `merge_fast_independent_proof` **succeeded in 3.648s on same lease**, followed by hosted-byte verification and Live. Targeted post-repair functional field smoke **PASS**; watchdog exceptional recovery [#303](https://github.com/ginosega/fishing/issues/303) remains independent and unproven. GitHub PR #58 runner last log 20:29:13.743 UTC vs reported CI completion 20:30:08 (~54s reporting gap); PR #57 had ~49s, whereas #56 had ~3s. This is **not a verified GitHub incident or automatic 60s exception**. Keep [#305](https://github.com/ginosega/fishing/issues/305) OPEN and 60s performance gate FAIL; retain protected exact-head CI/merge, source/host proof, no blind retries, deferred post-V3 media #301, security/D1–D6 gates, and no public V3 cutover.
Prerequisites: Current source-only repair `077ba3f783afb2ab93aa2b7f33cbbb6132716af1` passed CI #41515383884. Previous restored Worker `2fb554e9-9c9d-4343-be3b-71ab14d2c569` was superseded by trace-enabled pilot `17a6b05f-4259-4282-85dc-9c5ee12e1c67`, now superseded by repair `2909a0fd-fc8a-4bfa-a340-802c65771fde`; earlier accepted #310/#311 fixes remain. Source validation ≠ hosted private deployment ≠ field acceptance.
Acceptance: The owner verified saved inline Notes images reappear in Edit Item → Preview Markdown ([#310 completed/closed](https://github.com/ginosega/fishing/issues/310)) and Catch Notes-only Publishing Status displays species and date rather than “Catch · Undated” ([#311 completed/closed](https://github.com/ginosega/fishing/issues/311)). Original stuck KB PR #45 recovered to Live without a duplicate merge. All six owner publications [PRs #46–51](https://github.com/ginosega/fishing-p3-sandbox/pulls?q=is%3Apr+is%3Amerged) reached Live: KB Notes 63s; Gear Notes+image 71s; Gear Notes 64s; Gear Notes+Specification/Link 62s; Catch Notes 53s; Catch data-only 62s. **Mean 62.5s; only 1/6 ≤60s (1/5 non-image); sustained V3-SAVE-09 performance acceptance NOT MET.** #303 fast recovery after exception not yet field-proven. Species-derived Catch cover untested due private sandbox asset absence. D1–D6 functional/security/device acceptance and final release/cutover gates remain in effect.
Evidence: [#310](https://github.com/ginosega/fishing/issues/310), [#311](https://github.com/ginosega/fishing/issues/311) owner-reported private deployment and field acceptance Nov 1 PST / Nov 2 UTC; source [CI #41403337380](https://github.com/ginosega/fishing/actions/runs/41403337380); performance [#305](https://github.com/ginosega/fishing/issues/305); watchdog [#303](https://github.com/ginosega/fishing/issues/303); prior cross-domain Notes recovery [CI #41398731923](https://github.com/ginosega/fishing/actions/runs/41398731923).

## Independent fishing equipment and editorial backlog

Open, closed and explicitly deleted personal fishing/gear/KB tasks remain discoverable at [FISHING_BACKLOG_INDEX.md](FISHING_BACKLOG_INDEX.md); do not absorb into V3 milestones or reopen silently.
