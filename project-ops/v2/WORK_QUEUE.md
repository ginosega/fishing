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

State: in-progress — **isolated D5 functional repairs private deployed/owner Chrome 5A 6/6 and Edge 5B PASS on previous candidate; UX-01–05 [PR #365](https://github.com/ginosega/fishing/pull/365) source merged + exact-merge CI PASS at `571fb6c2` but not yet privately deployed or owner accepted**. Authenticated installed owner PWA, synthetic publication and D6 OPEN.
Owner: project owner / assistant implementer
Next safe action: Fix the Pages update operator PowerShell 5.1 native-stderr warning issue through a **separate guarded source/CI PR** before any additional Pages upload; do not retry the previous successful one-attempt Pages upload. Then prepare and separately request owner approval for a private Pages/Worker UX-01–05 rollout, with exact source/release/Worker/V2-preservation receipts and Android/Windows field acceptance. No D1, publishing, public V2/V3 or cutover authorization.
Prerequisites: Routed `governance/project-ops`; isolated integration `feature/fish118-d5-owner-integration@571fb6c2c3161bd461f9a15feb9d7ead5a63d671`; merged functional PRs #361/#360, operator #363, [UX PR #365](https://github.com/ginosega/fishing/pull/365), source PR CI [#42350181125](https://github.com/ginosega/fishing/actions/runs/42350181125)/[#42350181176](https://github.com/ginosega/fishing/actions/runs/42350181176) SUCCESS and exact-merge push [CI #42389538137](https://github.com/ginosega/fishing/actions/runs/42389538137) SUCCESS. Last **owner-reported** private release remains [Pages/Worker receipt](https://github.com/ginosega/fishing/issues/341#issuecomment-6703269944): immutable Pages `6fa3a075`, release `047a79c162289d51c0a8da1a4fca31ca`; Worker `05c50e5f-c09e-444e-b361-69e67f3f111e`. Public [draft #263](https://github.com/ginosega/fishing/pull/263) unmerged.
Acceptance: Earlier Windows A 7/7, B 5/5, 12px notice and Android routine draft/auth/online/offline PASS; [Phase 5A](https://github.com/ginosega/fishing/issues/341#issuecomment-6703384387) regular Chrome 6/6 PASS for repaired startup and authoring-only readiness, retained original unsent Notes, no Save & Publish; [Phase 5B](https://github.com/ginosega/fishing/issues/341#issuecomment-6703545836) normal Edge first-visit/navigation/restart PASS. **Not proven:** true preexisting broad SW collision on untreated profile, authenticated installed owner PWA, synthetic publication, long-duration draft corruption/quota/media/conflict/session-expiry negatives, independent public D6 byte/publish verification. Owner-operated receipts are not provider API attestation. Preserve one-attempt Pages upload marker; do not retry.
UX scope: [#357](https://github.com/ginosega/fishing/issues/357) **source complete / CI PASS, private field acceptance PENDING** — UX-01 Catch Log Add Catch left-aligned row, UX-02 stacked Offline Library messages, UX-03 compact Preview/Edit + expand/restore icons, UX-04 exact Work Offline verification subtext, UX-05 icon-only accessible Insert Link/Image. Preserve no global read-only wait, unchanged V2, drafts and publication safety.
D6 gate: separately approved installed authenticated owner PWA and synthetic sandbox Save→Live tests, verified public source/CI/hosted bytes/rollback, and **explicit** owner-approved V3 cutover. Keep 144 real narratives beyond current 120 cap; [#287](https://github.com/ginosega/fishing/issues/287), [#303](https://github.com/ginosega/fishing/issues/303) open, [#301](https://github.com/ginosega/fishing/issues/301) deferred. Private ~60s [#305](https://github.com/ginosega/fishing/issues/305) does not establish public D6.
Evidence: [#341](https://github.com/ginosega/fishing/issues/341) prior field/deployment receipts; [#358](https://github.com/ginosega/fishing/issues/358) repaired authoring readiness; [#342](https://github.com/ginosega/fishing/issues/342) provisional drafts; [#357](https://github.com/ginosega/fishing/issues/357) UX source merged but rollout/field pending; [#365](https://github.com/ginosega/fishing/pull/365) guarded UX merge + [push CI](https://github.com/ginosega/fishing/actions/runs/42389538137). GitHub source, exact-head CI, private hosted state, owner acceptance, and public Live remain distinct.

## Independent fishing equipment and editorial backlog

Open, closed and explicitly deleted personal fishing/gear/KB tasks remain discoverable at [FISHING_BACKLOG_INDEX.md](FISHING_BACKLOG_INDEX.md); do not absorb into V3 milestones or reopen silently.
