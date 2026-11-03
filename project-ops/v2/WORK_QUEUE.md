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

State: in-progress
Owner: project owner / assistant implementer
Next safe action: **PREPARE-only private rollout checkpoint** for merged development source `d1332d2e9e03aa3abc64bf9af7630f6b5fdaabc2` ([#334](https://github.com/ginosega/fishing/pull/334)). Confirm an exact-source, existing-Worker-version guarded private preflight against owner-reported diagnostic Worker `fbb26029-9e0b-4a13-93f0-357a1bfa7b79`; review output before separately approving any private deployment. Two-file conditional *missing-PR-metadata-only* improvement #334 passed exact-head [P3 CI #41569898686](https://github.com/ginosega/fishing/actions/runs/41569898686) and [full CI #41569898694](https://github.com/ginosega/fishing/actions/runs/41569898694), including `fishing-merge-ready`, and merged 2026-11-03 03:25 UTC. **NOT deployed or owner field tested.** Last owner private publishing test [sandbox PR #59](https://github.com/ginosega/fishing-p3-sandbox/pull/59), [CI #41562510786](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/41562510786), D1 Accepted→Live **56s**, user Save→Completed **62s** (2026-11-02 Pacific); new instrumentation caught refused immediate post-merge PR readback and safe independent read-only recovery without repeat PUT. Exact inconsistent PR field remains unknown. After separately authorized private deployment and observed verification, conduct one controlled owner Notes-only publication, then correlate hosted spans, D1, GitHub CI and browser completion. Normal **≤60s gate remains FAIL**. Keep exact-head CI, secure merge/host proof, durable receipts, no blind retries, no public V3 cutover/FISH108 waiver. [#305](https://github.com/ginosega/fishing/issues/305) remains performance tracker; [#303](https://github.com/ginosega/fishing/issues/303) exceptional watchdog and deferred [#301](https://github.com/ginosega/fishing/issues/301) unchanged.
Prerequisites: Prior tracing repair source `077ba3f783afb2ab93aa2b7f33cbbb6132716af1` passed [CI #41515383884](https://github.com/ginosega/fishing/actions/runs/41515383884) and owner-deployed Worker `2909a0fd-fc8a-4bfa-a340-802c65771fde`; subsequent owner-reported private diagnostic Worker `fbb26029-9e0b-4a13-93f0-357a1bfa7b79` hosts the field test, while the newer #334 merge-readback source has no private deployment evidence. Owner-accepted #310/#311 remain in place. Source validation ≠ private hosted deployment ≠ owner field acceptance.
Acceptance: The owner verified saved inline Notes images reappear in Edit Item → Preview Markdown ([#310 completed/closed](https://github.com/ginosega/fishing/issues/310)) and Catch Notes-only Publishing Status displays species and date rather than “Catch · Undated” ([#311 completed/closed](https://github.com/ginosega/fishing/issues/311)). Original stuck KB PR #45 recovered to Live without a duplicate merge. All six owner publications [PRs #46–51](https://github.com/ginosega/fishing-p3-sandbox/pulls?q=is%3Apr+is%3Amerged) reached Live: KB Notes 63s; Gear Notes+image 71s; Gear Notes 64s; Gear Notes+Specification/Link 62s; Catch Notes 53s; Catch data-only 62s. **Mean 62.5s; only 1/6 ≤60s (1/5 non-image); sustained V3-SAVE-09 performance acceptance NOT MET.** #303 fast recovery after exception not yet field-proven. Species-derived Catch cover untested due private sandbox asset absence. D1–D6 functional/security/device acceptance and final release/cutover gates remain in effect.
Evidence: [#310](https://github.com/ginosega/fishing/issues/310), [#311](https://github.com/ginosega/fishing/issues/311) owner-reported private deployment and field acceptance Nov 1 PST / Nov 2 UTC; source [CI #41403337380](https://github.com/ginosega/fishing/actions/runs/41403337380); performance [#305](https://github.com/ginosega/fishing/issues/305); watchdog [#303](https://github.com/ginosega/fishing/issues/303); prior cross-domain Notes recovery [CI #41398731923](https://github.com/ginosega/fishing/actions/runs/41398731923).

## Independent fishing equipment and editorial backlog

Open, closed and explicitly deleted personal fishing/gear/KB tasks remain discoverable at [FISHING_BACKLOG_INDEX.md](FISHING_BACKLOG_INDEX.md); do not absorb into V3 milestones or reopen silently.
