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
Next safe action: **D5 independent V3 reader and real-device acceptance gap review.** Verify existing source/loopback evidence, then list remaining Automatic/Work Offline persistence, complete-library integrity, release consistency, Markdown original-image viewer, Copy Diagnostics, drafts, Windows and installed Android HTTPS scope tests. Select one bounded next acceptance task without new hosting, permissions, full-CI churn, or public V2 SW collision unless separately authorized. After D5, D6 consolidates whole-app owner/security/device/hosted-byte/rollback and representative performance acceptance.

Prerequisites: Development `feature/fish118-p3-mock-publisher@48c0a6fb1751464e5ac2691a906084207f8fe36f` merged [#336](https://github.com/ginosega/fishing/pull/336) 2s polling, [#337](https://github.com/ginosega/fishing/pull/337) offline test Ready guard, [#339](https://github.com/ginosega/fishing/pull/339) verified corrupt-cache status, and [#338](https://github.com/ginosega/fishing/pull/338) prepare-only private rollout. #338 exact-head [P3 CI #41593793328](https://github.com/ginosega/fishing/actions/runs/41593793328) and [full CI #41593793185](https://github.com/ginosega/fishing/actions/runs/41593793185) passed their required jobs. Owner reported private deployment to Worker `1a0ff4db-69ab-42a6-a577-9f1873f6f3b2` on 2026-11-02 Pacific, with existing private auth, D1 receipt and V2 proxy postflight PASS. No direct Cloudflare provider access; public V3 cutover is not approved.

Acceptance: Owner KB Notes-only Save→Completed **exactly 60 seconds**, one threshold PASS. Owner closed further publishing-performance **optimization**; [#305](https://github.com/ginosega/fishing/issues/305) is closed for investigation only. Historical cross-domain 53–71s samples and later 62s/61s samples do not demonstrate sustained ≤60s. Formal V3-SAVE-09 **representative Save→public Live D6 release acceptance remains OPEN**; one private sandbox result is not public-hosted-byte proof. Existing D4 publisher/media field evidence is in [D4/D5 transition](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/D4_D5_Transition_2026-10-29.md); original-hosted-image byte comparison, existing Knot replacement/interrupted upload, and full D5 installed-device acceptance are not claimed. [#287](https://github.com/ginosega/fishing/issues/287) intermittent WebKit reliability remains open; exceptional [#303](https://github.com/ginosega/fishing/issues/303) and deferred [#301](https://github.com/ginosega/fishing/issues/301) remain separate.

D6 release gate: Source/CI and existing protected merge, hosted bytes, verified on-device owner/session/security/offline, rollback, normal representative ≤60s public publishing and **separately owner-approved** public V3 cutover. No FISH108 bypass or blind retries.

## Independent fishing equipment and editorial backlog

Open, closed and explicitly deleted personal fishing/gear/KB tasks remain discoverable at [FISHING_BACKLOG_INDEX.md](FISHING_BACKLOG_INDEX.md); do not absorb into V3 milestones or reopen silently.
