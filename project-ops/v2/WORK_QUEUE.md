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

State: in-progress — **D5 Windows owner accepted and 12px warning defect CLOSED; normal Android Chrome owner startup BLOCKED; sandbox publication and public D6 OPEN**
Owner: project owner / assistant implementer
Next safe action: **Investigate service-worker scope/registration mismatch without mutating browser storage.** Owner's repaired outside-candidate-scope diagnostic now executes and reports a service-worker-controlled probe page, `Candidate registration: MISSING_OR_DIFFERENT`, active worker and `HELLO: OK`, filtered candidate cache count 0, and network HTTP 200 for `loader.js`/the expected D5 release pointer. Exact controlling worker identity and whether a broader-scope worker intercepts the app **remain unknown**. Review source and [issue #341 diagnostic field receipt](https://github.com/ginosega/fishing/issues/341#issuecomment-6689383065), then propose read-only scope discriminator before changing code or browser state. Chrome site entries 169 MB and 132 B, drafts, existing service workers, Pages release, D3 pilot and public V2 must remain untouched. No third Worker deployment or Save & Publish authorization. Authenticated Android D5 owner acceptance and D6 remain BLOCKED.

Prerequisites: Original development [draft PR #263](https://github.com/ginosega/fishing/pull/263) remains unmerged. Isolated integration `feature/fish118-d5-owner-integration@acaafc92a39a6bd08aa7598ce67be8c5e2012cba` after guarded [PR #352](https://github.com/ginosega/fishing/pull/352) and repaired [PR #355](https://github.com/ginosega/fishing/pull/355); [exact-head postmerge P3 CI #42245002148](https://github.com/ginosega/fishing/actions/runs/42245002148) SUCCESS. Immutable owner Pages release `4d57578d466b4757eafafed8f1983998` remains. Owner reported second private Worker **`453a019d-1f01-46f9-b319-d793350dd56d`** deployed with D3 pilot, Pages and public V2 preservation PASS. No app Save & Publish, D1 migration, public cutover or independent assistant Cloudflare verification.

Acceptance: Earlier isolated **reader-only Android** core PASS (10/10 modes, 6/6 media/diagnostics); authenticated Windows Phase A 7/7 and B 5/5, warning spacing PASS. Repaired Android phone diagnostic script **runs and produces a report** (not app startup acceptance). Authenticated Android owner startup still BLOCKED; normal Chrome app shell remains unresponsive, cause unknown. Zero 'candidate cache count' is prefix-filtered only and does not mean all caches are absent; the controlling worker's scope has not been determined. Drafts remain provisional [#342](https://github.com/ginosega/fishing/issues/342).

D6 gate: Complete authenticated Android owner; separately authorize any first synthetic sandbox Save & Publish; validate exact source+CI, hosted public bytes, CSRF/operation receipts, representative public Save→Live, rollback plan and **explicit owner-approved public V3 cutover**. Keep 144 real narratives outside 120 cap; [#287](https://github.com/ginosega/fishing/issues/287), [#303](https://github.com/ginosega/fishing/issues/303) open, [#301](https://github.com/ginosega/fishing/issues/301) deferred. Private ~60s [#305](https://github.com/ginosega/fishing/issues/305) does not constitute public Live proof.

Evidence: 2026-11-06 Pacific [owner second private Worker rollout](https://github.com/ginosega/fishing/issues/341#issuecomment-6689136359), [owner diagnostic field report and scope mismatch](https://github.com/ginosega/fishing/issues/341#issuecomment-6689383065), [merged source PR #355](https://github.com/ginosega/fishing/pull/355), [postmerge CI #42245002148](https://github.com/ginosega/fishing/actions/runs/42245002148), [original Windows owner acceptance](https://github.com/ginosega/fishing/issues/341#issuecomment-6674642914), and [draft durability issue #342](https://github.com/ginosega/fishing/issues/342). No verified root cause, Android owner acceptance, sandbox publish or public cutover.

## Independent fishing equipment and editorial backlog

Open, closed and explicitly deleted personal fishing/gear/KB tasks remain discoverable at [FISHING_BACKLOG_INDEX.md](FISHING_BACKLOG_INDEX.md); do not absorb into V3 milestones or reopen silently.
