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
Next safe action: Validate and guarded-deploy the private owner-editor fixes for [saved Notes image preview #310](https://github.com/ginosega/fishing/issues/310) and [Catch publishing-summary identity #311](https://github.com/ginosega/fishing/issues/311); source changes remain private and require exact-head CI and owner preflight. Then owner retests reopening a saved inline image in Edit→Preview Markdown (Gear/KB/Catches) and Notes-only Catch publication status. No D1 migration or modification of historical request hashes. Continue strict 60s performance blocker [#305](https://github.com/ginosega/fishing/issues/305) with stage-specific D1 analysis, and exceptional watchdog [#303](https://github.com/ginosega/fishing/issues/303) recovery tests. Inline Notes derivative optimization [#301](https://github.com/ginosega/fishing/issues/301) remains deferred.
Prerequisites: Current private Worker `af78819d-4e1c-48ae-812a-99c5c630a0ca` (owner-reported deployment Nov 1 PST) is the last known field version; V3 development branch and private sandbox separate from public V2; version-lock operator deployment against existing Worker. No public cutover approval.
Acceptance: KB Notes-only previously stalled [PR #45](https://github.com/ginosega/fishing-p3-sandbox/pull/45) finally reached Live without a duplicate merge. Cross-domain owner tests [sandbox PRs #46–51](https://github.com/ginosega/fishing-p3-sandbox/pulls?q=is%3Apr+is%3Amerged) all reached Live: KB Notes 63s; Gear Notes+image 71s; Gear Notes 64s; Gear Notes+data 62s; Catch Notes 53s; Catch data-only 62s. **Only 1/6 at ≤60s**, mean 62.5s; sustained performance acceptance NOT MET. Gear/KB/Catch Notes-only merge recovery source-tested, but saved inline Notes image Edit preview and Catch status label fail in field. Species-derived Catch cover remains untested due private sandbox species asset absence. D1–D6 functional/security/device release gates unchanged.
Evidence: Source CI validated earlier recovery fixes [#41395435871](https://github.com/ginosega/fishing/actions/runs/41395435871) and [#41397366075](https://github.com/ginosega/fishing/actions/runs/41397366075). Cross-domain Notes-only Gear/Catch test CI [#41398731923](https://github.com/ginosega/fishing/actions/runs/41398731923) PASS. New UI/summary fixes are source-only awaiting exact-head green validation; issues [#310](https://github.com/ginosega/fishing/issues/310), [#311](https://github.com/ginosega/fishing/issues/311), performance [#305](https://github.com/ginosega/fishing/issues/305), reliability [#303](https://github.com/ginosega/fishing/issues/303).

## Independent fishing equipment and editorial backlog

Open, closed and explicitly deleted personal fishing/gear/KB tasks remain discoverable at [FISHING_BACKLOG_INDEX.md](FISHING_BACKLOG_INDEX.md); do not absorb into V3 milestones or reopen silently.
