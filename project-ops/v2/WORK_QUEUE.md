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
Next safe action: V3-SAVE-09 [Validating latency #305](https://github.com/ginosega/fishing/issues/305): run guarded **prepare-only** private rollout of exact-head [source CI #41392474921](https://github.com/ginosega/fishing/actions/runs/41392474921), then deliberate private deployment and a new single text-only publication with D1 stage timing. Source candidate removes a redundant full GitHub verified snapshot within one exact operation; the 70-second Validating interval is measured, but its execution/retry subcomponents are unproven. Retain [watchdog/Cron recovery #303](https://github.com/ginosega/fishing/issues/303) as a distinct unclosed recovery test. Continue existing D4/D5 and D6 ≤60-second release gates, excluding [deferred Notes image optimization #301](https://github.com/ginosega/fishing/issues/301).
Prerequisites: Operating Model v2 adopted, exact private Worker version verified by guarded script, no concurrent/unknown publication or silent retry; no public V3 cutover approval.
Acceptance: Owner-confirmed Catch Notes image/caption/Viewer Live; new synthetic Catch [sandbox PR #43](https://github.com/ginosega/fishing-p3-sandbox/pull/43) Live but 116s stopwatch/111s D1, with 70s Validating; prove improvement via repeated fresh E2E tests and D1 event measurements without weakening GitHub/owner/immutable main proof; complete remaining D1–D6 functional, device, security and release gates. Species-derived Catch cover remains untested due absent private sandbox species pictures.
Evidence: V3 draft [#263](https://github.com/ginosega/fishing/pull/263) candidate at `3827a49c3bc1e09e1acc95df502191e7e444936f`, exact-head [source CI #41392474921](https://github.com/ginosega/fishing/actions/runs/41392474921) PASS (184 PWA, 43 broker, 790 private tests and Chromium), owner-reported private Worker `c75e1e01-2274-446e-bb37-b623d2c07e4e` deployed Nov 1 PST for prior watchdog fix, owner-supplied D1 event timeline for operation `p3_6bff0a3b-caff-44e2-a4f8-2cafe12842c1` (Nov 2 UTC), [GitHub sandbox PR #43](https://github.com/ginosega/fishing-p3-sandbox/pull/43), [recovery issue #303](https://github.com/ginosega/fishing/issues/303), [deferred #301](https://github.com/ginosega/fishing/issues/301).

## Independent fishing equipment and editorial backlog

Open, closed and explicitly deleted personal fishing/gear/KB tasks remain discoverable at [FISHING_BACKLOG_INDEX.md](FISHING_BACKLOG_INDEX.md); do not absorb into V3 milestones or reopen silently.
