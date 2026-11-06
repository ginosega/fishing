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
Next safe action: **Diagnose Android normal-Chrome startup first**, before resuming nine-point authenticated owner acceptance. The private Worker D5 app remains indefinitely at an inert `Loading Fishing Companion…` shell across normal Chrome tabs, even after force-stop, while fresh Incognito loads and the immutable standalone Pages origin works in normal Chrome. JavaScript is allowed. Chrome Settings show 169 MB in an unschemed entry and 132 B in an explicit HTTPS entry; do not infer corruption or delete storage/drafts/service workers. [Issue #341](https://github.com/ginosega/fishing/issues/341) records field observations. Isolated read-only startup diagnostic [draft PR #352](https://github.com/ginosega/fishing/pull/352) is **source only**, not merged or privately deployed, with exact-head tests pending. Require CI and diff verification, then separate owner authorization for a version-locked private Worker-only rollout, preserving existing D3 pilot, Pages release and V2 public proxy. Collect only sanitized phone-visible diagnostics, determine root cause, then resume bounded non-writing authenticated Android checks. No Save & Publish, public cutover, data reset or D1 migration.

Prerequisites: Original development [draft PR #263](https://github.com/ginosega/fishing/pull/263) remains unmerged. Isolated owner source `feature/fish118-d5-owner-integration@ff9908dc8965cd8713f04cc86bbecd8d78dfd94e` after guarded [#348](https://github.com/ginosega/fishing/pull/348) and [#350](https://github.com/ginosega/fishing/pull/350); [isolated postmerge CI #42128911310](https://github.com/ginosega/fishing/actions/runs/42128911310) SUCCESS. Owner-operated Pages immutable release `4d57578d466b4757eafafed8f1983998` on `cf47a8f1.fishing-v3-owner-d5-test.pages.dev` passed 13/13 hosted hash samples and 6/6 route isolation; private Worker `cd6641f1-ab29-4d66-89f4-d119f865f403` passed release/D3 pilot/public V2 preservation checks. Hosted/Worker version and field results are owner-reported, not assistant-direct Cloudflare observations.

Acceptance: Earlier isolated **reader-only Android** core PASS (10/10 modes, 6/6 media/diagnostics); authenticated Windows Phase A 7/7 and B 5/5 **PASS** without publishing, and final authenticated red/amber ~12px versus Notes preview/green gap owner **PASS**. Source-only #348/#350 notice fix is now **merged and privately deployed**, not awaiting first CI or provider rollout. Wider authenticated Android owner tests **BLOCKED** at normal-profile Chrome startup and **NOT YET ACCEPTED**; anonymous/Incognito or Pages startup success is not authenticated Android owner acceptance. IndexedDB draft support is source-implemented and same-session Restore/Discard tested; persistent relaunch, quota, refusal, corruption and selected media remain **unverified** [#342](https://github.com/ginosega/fishing/issues/342).

D6 gate: Complete authenticated Android owner; separately authorize any first synthetic sandbox Save & Publish; validate exact source+CI, hosted public bytes, CSRF/operation receipts, representative public Save→Live, rollback plan and **explicit owner-approved public V3 cutover**. Keep 144 real narratives outside 120 cap; [#287](https://github.com/ginosega/fishing/issues/287), [#303](https://github.com/ginosega/fishing/issues/303) open, [#301](https://github.com/ginosega/fishing/issues/301) deferred. Private ~60s [#305](https://github.com/ginosega/fishing/issues/305) does not constitute public Live proof.

Evidence: 2026-11-05 Pacific owner [Pages receipt](https://github.com/ginosega/fishing/issues/341#issuecomment-6672975302), [private Worker receipt](https://github.com/ginosega/fishing/issues/341#issuecomment-6673998497), [final spacing visual PASS](https://github.com/ginosega/fishing/issues/341#issuecomment-6674642914); [source PR #350](https://github.com/ginosega/fishing/pull/350), [postmerge CI #42128911310](https://github.com/ginosega/fishing/actions/runs/42128911310), [draft issue #342](https://github.com/ginosega/fishing/issues/342). Normal Chrome startup failure and diagnostic scope [issue #341](https://github.com/ginosega/fishing/issues/341) · source-only [draft PR #352](https://github.com/ginosega/fishing/pull/352), latest head `eefc74b7fb67e2775592eb89e1859e444ef0b7fd` (CI in progress; no private deploy). No sandbox publish or public cutover.

## Independent fishing equipment and editorial backlog

Open, closed and explicitly deleted personal fishing/gear/KB tasks remain discoverable at [FISHING_BACKLOG_INDEX.md](FISHING_BACKLOG_INDEX.md); do not absorb into V3 milestones or reopen silently.
