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
Evidence: [Audit procedure](SEMANTIC_AUDIT_SOP.md) and [validator](VALIDATION_RUNBOOK.md). At 2026-11-09 Stage A milestone audit, verified drift: old governance text claimed Stage A Pages/Worker unprovisioned and D6 hosted/field acceptance absent despite owner-confirmed provider and device PASS. An in-place correction is tracked in [protected PR #397](https://github.com/ginosega/fishing/pull/397); verify exact-head checks and merge state separately. Default main remains `fc85bd38`, D6 draft [#395](https://github.com/ginosega/fishing/pull/395) exact-head [CI #42579092617](https://github.com/ginosega/fishing/actions/runs/42579092617) PASS, Stage A field [#377](https://github.com/ginosega/fishing/issues/377#issuecomment-6755722813). Owner-reported bytes/device data are not independent assistant HTTP fetches; weekly scheduled audit separate.

## FISH-TODO-118 — Fishing Companion V3 continuation

State: in-progress — D5 private UX [#357](https://github.com/ginosega/fishing/issues/357) CLOSED; installed-owner Android Phase 1 7/7 and non-submitting Phase 2 8/8, private Gear sandbox Save→Live owner PASS. D6 **isolated Stage A static-only ACCEPTED**: draft [#395](https://github.com/ginosega/fishing/pull/395) source/CI, Pages, Worker, 577-file SHA-256 hashes and Windows/Android field PASS. Public V2 unchanged. Publisher, owner auth and production cutover OPEN; final status UX [#396](https://github.com/ginosega/fishing/issues/396) release-blocking.
Owner: project owner / assistant implementer
Next safe action: Stage A is complete; no Pages or Worker redeploy. Reconcile actual public V2 hosted release/rollback and installed SW scope, then review approved same-origin owner-session design and bounded canonical `main` GitHub read authority **source-only** under SEC-001/002/004/005, ARC-003/004. Preserve current staged Worker `c11b46aa-afd7-43d4-94b9-a2d18e26aa7b` pinned to immutable Pages `04f07981.fishing-v3-d6-static-test.pages.dev`; auth/publishing disabled. Require separate owner approval for credentials, write privileges, public route/domain change, merges and cutover. [#377](https://github.com/ginosega/fishing/issues/377#issuecomment-6755722813).
Prerequisites: Protected `governance/project-ops` routed from default `main`; D5 private owner source, UX #365/#369 and post-merge [CI #42404707930](https://github.com/ginosega/fishing/actions/runs/42404707930) PASS. Private D5 Pages `63a65b86.fishing-v3-owner-d5-test.pages.dev`, Worker `cf6daf23-e44a-4648-89fc-cabcc681819b` preserved. Original V3 prototype [#263](https://github.com/ginosega/fishing/pull/263) unmerged; D6 selective draft stack [#381–#395](https://github.com/ginosega/fishing/pull/395) also unmerged and independent of public `main`.
Acceptance: D5 private UX #357 owner PASS on Windows/Android; installed-owner Phase 1 7/7 and Phase 2 8/8 non-submitting PASS, private sandbox Save→Live PASS [#341](https://github.com/ginosega/fishing/issues/341). D6 isolated Stage A static-only full CI, hosted-byte and route checks and both Windows/Android field PASS [#377](https://github.com/ginosega/fishing/issues/377#issuecomment-6755722813). **Not accepted:** public V3 production deployment, canonical-main owner auth/source, publisher/write operations, installed-PWA public upgrade/rollback; long-lived drafts/media/session/conflicts [#342](https://github.com/ginosega/fishing/issues/342). No source/CI/proxy evidence substitutes for public hosted acceptance.
UX scope: [#357](https://github.com/ginosega/fishing/issues/357) **CLOSED / private owner acceptance complete**, covering Add Catch layout, stacked Offline Library text, compact Markdown controls, superseding `Verifying the offline library...` copy ([#373](https://github.com/ginosega/fishing/pull/373), not deployed), and link/image icons disabled in Preview and re-enabled in Edit. No further UX upload is needed solely for this accepted batch; keep future new findings separately scoped.
D6 gate: Source-only stacked draft [#381–#395](https://github.com/ginosega/fishing/pull/395) head `940c92f4c423475cbd54e0305cb7476108ec78d0`, exact [full CI #42579092617](https://github.com/ginosega/fishing/actions/runs/42579092617) PASS. **Owner-reported Stage A HOSTED + FIELD PASS**: Pages immutable deployment `04f07981-e077-41a5-b5b3-83d932c73494`; Worker active version `c11b46aa-afd7-43d4-94b9-a2d18e26aa7b`; release `f017e0a0f3ad1a3f310e35fb9ce94be9`; Worker routes deny auth/API/writes; **577/577 SHA-256 bytes match** at 2026-11-09T14:16:40.498Z; Gear 100/KB 60/Catches 12; Windows Edge 5/5 and Android Chrome 4/4 owner PASS. Remaining production gates: canonical-main read authority and owner authentication, publisher/write, rollback, final Connection Status UX [#396](https://github.com/ginosega/fishing/issues/396), app migration and explicit public cutover. Preserve #342 drafts, D3 120 narrative cap, #287/#303 blockers and #301 deferred.
Evidence: [D5 acceptance #341](https://github.com/ginosega/fishing/issues/341), [drafts #342](https://github.com/ginosega/fishing/issues/342), [private UX #357](https://github.com/ginosega/fishing/issues/357), [D6 Stage A evidence #377](https://github.com/ginosega/fishing/issues/377#issuecomment-6755722813), [final UX gate #396](https://github.com/ginosega/fishing/issues/396), [draft #395](https://github.com/ginosega/fishing/pull/395), [CI #42579092617](https://github.com/ginosega/fishing/actions/runs/42579092617). Stage A owner receipts do **not** establish public V3 Live or grant provider write authority.

## Independent fishing equipment and editorial backlog

Open, closed and explicitly deleted personal fishing/gear/KB tasks remain discoverable at [FISHING_BACKLOG_INDEX.md](FISHING_BACKLOG_INDEX.md); do not absorb into V3 milestones or reopen silently.
