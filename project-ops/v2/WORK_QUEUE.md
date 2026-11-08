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
Evidence: [Audit procedure](SEMANTIC_AUDIT_SOP.md), [validator](VALIDATION_RUNBOOK.md). Targeted 2026-11-08 pre-transfer audit independently checked default `main@fc85bd38`, governance `4c319544`, draft [#391](https://github.com/ginosega/fishing/pull/391) exact-head source/CI and [#377](https://github.com/ginosega/fishing/issues/377#issuecomment-6727229533) staging checkpoint; **verified drift** found in outdated D6 source/next-action summaries and is proposed for in-place correction via protected governance PR. No D6 deployment or owner field acceptance is inferred; weekly scheduled task's latest result not checked. D5 private hosting/device evidence remains owner-reported. [Exact CI #42522670640](https://github.com/ginosega/fishing/actions/runs/42522670640).

## FISH-TODO-118 — Fishing Companion V3 continuation

State: in-progress — private D5 UX [#357](https://github.com/ginosega/fishing/issues/357) CLOSED; installed-owner Android PWA Phase 1 **7/7**, Phase 2 **8/8 non-submitting** owner PASS, private Gear synthetic Save→Live owner PASS. Drafts/edge cases [#342](https://github.com/ginosega/fishing/issues/342) provisional. **D6 source/CI PASS** through unmerged [draft #391](https://github.com/ginosega/fishing/pull/391); Stage A hosted verification, provider auth, publisher and public cutover **OPEN**. Public V2 unchanged.
Owner: project owner / assistant implementer
Next safe action: **Stage A source-only physical staging packaging and static Worker proxy with dry-run verification**, following the [D6 plan](https://github.com/ginosega/fishing/blob/feature/fish118-d6-static-staging-build/experiments/p3/preview/D6_STATIC_STAGING_STAGE_A_PLAN_2026-11-08.md). Prior selective production-root source packages [draft PRs #381–#391](https://github.com/ginosega/fishing/pull/391) are open/unmerged and exact-head [full CI #42522670640](https://github.com/ginosega/fishing/actions/runs/42522670640) PASS, including separate staging artifact, **not** actual hosted evidence. The proposed test Worker `fishing-d6-static-test.ginosega.workers.dev` and Pages project `fishing-v3-d6-static-test` are **not provisioned**. Owner approval required before Cloudflare staging provisioning/deployment, provider credentials/permissions, public route changes or production cutover. Source SHA on a draft branch is not canonical `main`; authoring source/owner-session/write flags stay OFF. Preserve public V2, D5 private Worker, installed app and local drafts. [D6 issue #377](https://github.com/ginosega/fishing/issues/377#issuecomment-6727229533).
Prerequisites: Protected `governance/project-ops` routed from default main; D5 isolated owner source, guarded UX #365/#369 merged, [push CI #42404707930](https://github.com/ginosega/fishing/actions/runs/42404707930) PASS. Private D5 Pages `63a65b86.fishing-v3-owner-d5-test.pages.dev` owner-verified [13/13 sampled hashes](https://github.com/ginosega/fishing/issues/357#issuecomment-6711987156), Worker version `cf6daf23-e44a-4648-89fc-cabcc681819b` [owner receipt](https://github.com/ginosega/fishing/issues/357#issuecomment-6712057010); public [V3 prototype #263](https://github.com/ginosega/fishing/pull/263) draft/unmerged. D6 selective draft stack [#381–#391](https://github.com/ginosega/fishing/pull/391) is separate from protected public `main`.
Acceptance: Private D5 owner-reported UX #357 CLOSED: corrected Android UX-04/05 and Windows Edge 5/5 PASS [Android](https://github.com/ginosega/fishing/issues/357#issuecomment-6712119921) · [Windows](https://github.com/ginosega/fishing/issues/357#issuecomment-6712174984). Installed owner PWA Phase 1 **7/7**, Phase 2 **8/8 non-submitting** (Add Catch, synthetic Edit, Notes draft/autosave, Work Offline/Automatic, relaunch and Restore) [#341](https://github.com/ginosega/fishing/issues/341#issuecomment-6715260931). Private Gear sandbox Save→Live owner PASS [#341](https://github.com/ginosega/fishing/issues/341#issuecomment-6718163566). Not accepted: public D6 deployment, complete installed-PWA offline-submit negative, long-lived drafts/media/quota/session/conflicts and broader SW collisions [#342](https://github.com/ginosega/fishing/issues/342). Source CI is not hosted or device verification.
UX scope: [#357](https://github.com/ginosega/fishing/issues/357) **CLOSED / private owner acceptance complete**, covering Add Catch layout, stacked Offline Library text, compact Markdown controls, superseding `Verifying the offline library...` copy ([#373](https://github.com/ginosega/fishing/pull/373), not deployed), and link/image icons disabled in Preview and re-enabled in Edit. No further UX upload is needed solely for this accepted batch; keep future new findings separately scoped.
D6 gate: [draft stack #381–#391](https://github.com/ginosega/fishing/pull/391) source/CI **PASS only**, exact-head [run #42522670640](https://github.com/ginosega/fishing/actions/runs/42522670640): tests, ordinary V2 build, isolated D6 reader/static-staging build and browser acceptance PASS; no deployments. Existing owner Android installed PWA Phase 1 7/7 and non-submitting Phase 2 8/8 private D5 PASS, with independent synthetic private Gear Save→Live owner PASS; these are not D6 public acceptance. Remaining: stage `/fishing/` physical upload and fixed static-only Worker, exact hosted V3 bytes, main-based provider read authority, authenticated owner field tests, rollback, guarded publishing and **explicit owner-approved public cutover**. [#342](https://github.com/ginosega/fishing/issues/342) long-lived/local-media/conflict drafts remain provisional; D3 120 narrative cap still binds, #287/#303 separate and #301 deferred. Public V2 unchanged.
Evidence: [D5 owner #341](https://github.com/ginosega/fishing/issues/341#issuecomment-6712189499), [installed PWA Phase 1](https://github.com/ginosega/fishing/issues/341#issuecomment-6712729663) and [Phase 2](https://github.com/ginosega/fishing/issues/341#issuecomment-6715260931), [drafts #342](https://github.com/ginosega/fishing/issues/342), [UX #357](https://github.com/ginosega/fishing/issues/357), [startup follow-up #358](https://github.com/ginosega/fishing/issues/358), [D6 source/CI and Stage A #377](https://github.com/ginosega/fishing/issues/377#issuecomment-6727229533), [draft #391](https://github.com/ginosega/fishing/pull/391), [CI #42522670640](https://github.com/ginosega/fishing/actions/runs/42522670640). No public V3 release or provider operation implied.

## Independent fishing equipment and editorial backlog

Open, closed and explicitly deleted personal fishing/gear/KB tasks remain discoverable at [FISHING_BACKLOG_INDEX.md](FISHING_BACKLOG_INDEX.md); do not absorb into V3 milestones or reopen silently.
