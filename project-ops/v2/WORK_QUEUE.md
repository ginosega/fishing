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
Evidence: [Audit procedure](SEMANTIC_AUDIT_SOP.md), [automated governance validation](VALIDATION_RUNBOOK.md). Weekly task created Nov 1; its latest outcome is not independently verified here. 2026-11-05 Pacific milestone reconciliation verified current [#341](https://github.com/ginosega/fishing/issues/341) owner-private Pages/Worker release and Windows spacing acceptance, merged [#350](https://github.com/ginosega/fishing/pull/350), exact-head [CI #42128911310](https://github.com/ginosega/fishing/actions/runs/42128911310), and [#342](https://github.com/ginosega/fishing/issues/342) provisional draft evidence; no scheduled audit PASS or public V3 Live inferred.

## FISH-TODO-118 — Fishing Companion V3 continuation

State: in-progress — **routine Android D5 private owner PASS on prior candidate**; first-visit and Add/Edit source fixes [PR #361](https://github.com/ginosega/fishing/pull/361) / [PR #360](https://github.com/ginosega/fishing/pull/360) **merged + exact-head CI PASS**, but new deployment/Android acceptance, five-item UX batch, synthetic publish and D6 OPEN.
Owner: project owner / assistant implementer
Next safe action: Prepare **owner-approved private** Pages/Worker rollout and focused untreated-profile Android verification for `d70fc1af19738cc6fb5d754584ce933d7c05bda8`, with exact release/source/Worker/V2-preservation receipts. **Do not add waiting to read-only pages**. Preserve owner drafts, verified-release bootstrap, fail-closed gates, public V2 and D3 pilot. Then implement the **five-item** [UX #357](https://github.com/ginosega/fishing/issues/357) batch. No provider deploy, publishing or public cutover implied by the merged source.
Prerequisites: Default-main router; isolated integration `feature/fish118-d5-owner-integration@d70fc1af19738cc6fb5d754584ce933d7c05bda8`; merged [PR #361](https://github.com/ginosega/fishing/pull/361) and [PR #360](https://github.com/ginosega/fishing/pull/360); [exact-head P3 CI #42307415880](https://github.com/ginosega/fishing/actions/runs/42307415880) SUCCESS. Last owner-reported Pages release `4d57578d466b4757eafafed8f1983998` and Worker `453a019d-1f01-46f9-b319-d793350dd56d`; no independent newer provider evidence or field acceptance. Public [draft #263](https://github.com/ginosega/fishing/pull/263) unmerged. Private deployment and synthetic Save & Publish require separate approval.
Acceptance: Windows A 7/7, B 5/5 and notice spacing PASS; isolated Android reader core/installed test PWA previously PASS. **Android authenticated regular-Chrome private owner routine field tests PASS:** device-local scoped-SW startup repair plus independent USB-free relaunch, GitHub sign-in/session persistence, real record overlay, Work Offline open-editor data preservation and refused publish, saved synthetic draft Restore after reload/full Chrome relaunch, and stale Edit link denied while preserving page/scroll [#341](https://github.com/ginosega/fishing/issues/341#issuecomment-6695095181), [#342](https://github.com/ginosega/fishing/issues/342#issuecomment-6694698372). **Not proven:** clean first visit on untreated phone, authenticated installed owner PWA, published synthetic operation, quota/corruption/media/conflict/expiry draft negatives, independent D6 hosted bytes.
D6 gate: Full source/CI + public hosted-byte and rollback proof, separately approved representative sandbox/publishing tests and public Save→Live, and **explicit owner-approved public V3 cutover**. Keep 144 real narratives beyond the current 120 cap; [#287](https://github.com/ginosega/fishing/issues/287), [#303](https://github.com/ginosega/fishing/issues/303) open, [#301](https://github.com/ginosega/fishing/issues/301) deferred. Private ~60s [#305](https://github.com/ginosega/fishing/issues/305) does not constitute public Live proof.
Evidence: [prior Android acceptance #341](https://github.com/ginosega/fishing/issues/341), [draft Restore #342](https://github.com/ginosega/fishing/issues/342), [PR #361](https://github.com/ginosega/fishing/pull/361), [PR #360](https://github.com/ginosega/fishing/pull/360), [exact-head P3 CI #42307415880](https://github.com/ginosega/fishing/actions/runs/42307415880), open [functional #358](https://github.com/ginosega/fishing/issues/358), [five-item UX #357](https://github.com/ginosega/fishing/issues/357). Source, CI, owner/provider hosting and field PASS remain separate.

## Independent fishing equipment and editorial backlog

Open, closed and explicitly deleted personal fishing/gear/KB tasks remain discoverable at [FISHING_BACKLOG_INDEX.md](FISHING_BACKLOG_INDEX.md); do not absorb into V3 milestones or reopen silently.
