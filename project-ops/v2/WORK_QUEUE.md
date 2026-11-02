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
Next safe action: **Investigate remaining 60s publishing latency without reducing exact-head CI or merge/host proof.** Owner's post-repair KB Notes-only [sandbox PR #58](https://github.com/ginosega/fishing-p3-sandbox/pull/58), operation `p3_a1956817-7335-4b39-ab7f-9bb42c9a9835`: merged once, [CI #41519600212](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/41519600212) PASS, owner D1 Live 2026-11-02 20:30:37 UTC. D1 Accepted→Live **110s** (Checking **73s**), Save→Completed **119s**: performance gate **FAIL**; targeted tracing repair runtime field **PASS**. On current owner-deployed private Worker `2909a0fd-fc8a-4bfa-a340-802c65771fde`, first merge readback refused but same-lease independent proof succeeded in 3.648s, with no repeat merge. Five PRs #52–56 show 0.5–5s between last runner log and GitHub check completion versus ~49–54s on #57/#58; cause inside runner finalization/reporting unknown and no confirmed Nov 2 provider incident. Normal #56 owner E2E **76s** also missed 60s, so resolving exceptional reporting latency alone may not meet requirement. GitHub PR #58/main now match; original exact post-merge readback predicate unknown, retain both guards. Next: source-only, redact-only [draft PR #327](https://github.com/ginosega/fishing/pull/327) instruments CI observer and PR/main merge-readback categories, with exact-head P3 [CI #41525824616](https://github.com/ginosega/fishing/actions/runs/41525824616) PASS; full-lane [CI #41525824597](https://github.com/ginosega/fishing/actions/runs/41525824597) still pending, **NO MERGE / private deployment**. Stale-head full-lane [CI #41524385841](https://github.com/ginosega/fishing/actions/runs/41524385841) failed the already-known [offline-library Playwright blocker #287](https://github.com/ginosega/fishing/issues/287), requiring scoped owner authorization before modifying PWA tests or application. No waiver or test removal; proceed only after applicable exact-head gates. #305 performance OPEN; separate #303 exceptional watchdog and deferred post-V3 #301 unaffected; no public V3 cutover, no blind retries.
Prerequisites: Current source-only repair `077ba3f783afb2ab93aa2b7f33cbbb6132716af1` passed CI #41515383884. Previous restored Worker `2fb554e9-9c9d-4343-be3b-71ab14d2c569` was superseded by trace-enabled pilot `17a6b05f-4259-4282-85dc-9c5ee12e1c67`, now superseded by repair `2909a0fd-fc8a-4bfa-a340-802c65771fde`; earlier accepted #310/#311 fixes remain. Source validation ≠ hosted private deployment ≠ field acceptance.
Acceptance: The owner verified saved inline Notes images reappear in Edit Item → Preview Markdown ([#310 completed/closed](https://github.com/ginosega/fishing/issues/310)) and Catch Notes-only Publishing Status displays species and date rather than “Catch · Undated” ([#311 completed/closed](https://github.com/ginosega/fishing/issues/311)). Original stuck KB PR #45 recovered to Live without a duplicate merge. All six owner publications [PRs #46–51](https://github.com/ginosega/fishing-p3-sandbox/pulls?q=is%3Apr+is%3Amerged) reached Live: KB Notes 63s; Gear Notes+image 71s; Gear Notes 64s; Gear Notes+Specification/Link 62s; Catch Notes 53s; Catch data-only 62s. **Mean 62.5s; only 1/6 ≤60s (1/5 non-image); sustained V3-SAVE-09 performance acceptance NOT MET.** #303 fast recovery after exception not yet field-proven. Species-derived Catch cover untested due private sandbox asset absence. D1–D6 functional/security/device acceptance and final release/cutover gates remain in effect.
Evidence: [#310](https://github.com/ginosega/fishing/issues/310), [#311](https://github.com/ginosega/fishing/issues/311) owner-reported private deployment and field acceptance Nov 1 PST / Nov 2 UTC; source [CI #41403337380](https://github.com/ginosega/fishing/actions/runs/41403337380); performance [#305](https://github.com/ginosega/fishing/issues/305); watchdog [#303](https://github.com/ginosega/fishing/issues/303); prior cross-domain Notes recovery [CI #41398731923](https://github.com/ginosega/fishing/actions/runs/41398731923).

## Independent fishing equipment and editorial backlog

Open, closed and explicitly deleted personal fishing/gear/KB tasks remain discoverable at [FISHING_BACKLOG_INDEX.md](FISHING_BACKLOG_INDEX.md); do not absorb into V3 milestones or reopen silently.
