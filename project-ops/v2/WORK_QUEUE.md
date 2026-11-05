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
Evidence: [Audit procedure](SEMANTIC_AUDIT_SOP.md), [automated governance validation](VALIDATION_RUNBOOK.md). The weekly task started 2026-11-01; latest scheduled outcome is not independently verified here. Bounded 2026-11-05 milestone review reconciled [#341](https://github.com/ginosega/fishing/issues/341), exact D5 source/CI, latest owner decision and operator-only Pages/Worker evidence; no scheduled-run PASS or fresh provider validation inferred.

## FISH-TODO-118 — Fishing Companion V3 continuation

State: in-progress — **isolated D5 reader OWNER PASS; D5 owner overlay/OAuth source and isolated CI PASS; owner deployment/field acceptance and D6 OPEN**
Owner: project owner / assistant implementer
Next safe action: **Bounded read-only D5 owner candidate Pages/Worker preflight.** Reverify `feature/fish118-d5-owner-integration@0529c7e5ba7634ad305f9ab6646576c54f088caf` and exact-head successful [isolated CI #42045138884](https://github.com/ginosega/fishing/actions/runs/42045138884), current existing isolated Pages deployment inventory, active Worker version, D3 pilot JS/CSS SHA pins, public V2 proxy, anonymous deny/auth gates. If reconciled, request **separate owner approval** for new immutable Pages test release; independently verify hosted hashes/direct startup. A later Worker origin retarget requires separately authorized version-locked preflight and preservation of D3 pilot. After rollout, owner Windows Phase A must verify OAuth read-only article return, combined library counts/provenance and real direct-edit refusal, sandbox-only Add/Edit and offline safeguards. Do not publish to private sandbox without separate approval; no D1 migration, permissions or public V3 cutover.

Prerequisites: Original V3 development `feature/fish118-p3-mock-publisher@cecda55439a121fa59c5cb0aadc4530cd63859ce` / draft [#263](https://github.com/ginosega/fishing/pull/263) remains unmerged; integrated owner source HEAD `0529c7e5ba7634ad305f9ab6646576c54f088caf` with [CI #42045138884](https://github.com/ginosega/fishing/actions/runs/42045138884) success (isolated, not full app PR). Existing reader acceptance from merged [#345](https://github.com/ginosega/fishing/pull/345) and Pages release `42e15e65600bfd93fb12ee4507245bed` remains distinct. Last owner-reported live private Worker `fa51e1f7-fb58-4960-87b6-81d0900578d8` and older Pages origin `https://a3fad3ca.fishing-v3-owner-d5-test.pages.dev` / release `c494ea713f63a4ac827c1d87a31e5308`; **not freshly reconciled with Cloudflare**. Owner [2026-11-05 authorization](https://github.com/ginosega/fishing/issues/341#issuecomment-6660554924) approves read-only real records + labeled private sandbox authoring only; refuses 144-narrative bulk migration across 120-narrative existing cap and any legacy D3/public V2 change.

Acceptance: **D5 isolated read-only reader core accepted:** 12/12 sampled hosted hashes, 6/6 isolated 404 routes, owner Android 10/10 reading modes, 6/6 media/diagnostics, independent installed test PWA offline relaunch and V2 independence PASS ([#341](https://github.com/ginosega/fishing/issues/341)). **D5 owner combined view and safe OAuth return are source/CI PASS, NOT DEPLOYED/FIELD ACCEPTED.** Previously, owner Windows Phase A failed deep link and showed synthetic-only signed-in content; an isolated 503 was not reproducible, so no unproved fix claimed. After separately approved Pages/Worker rollout, field test canonical content read-only and real Edit/direct-route denied, synthetic records only editable, OAuth Trout return, session/relaunch and Work Offline editor safety; **no sandbox publication without explicit authorization**. Device-local draft persistence is unimplemented/provisional [#342](https://github.com/ginosega/fishing/issues/342), not inferred from in-memory editor tests. One private 60s KB Notes-only sample closed investigation [#305](https://github.com/ginosega/fishing/issues/305), but representative public D6 V3-SAVE-09 Live still OPEN.

D6 release gate: Authenticated Android owner session and CSRF-backed publishing, offline/no-lost-draft safety, verified source+CI, hosted full public bytes, rollback, representative Save→public Live, and **separate owner-approved V3 public cutover**. FISH108 protections unchanged; no bypasses or retries of ambiguous writes. Other open issues [#287](https://github.com/ginosega/fishing/issues/287) intermittent offline reliability, [#303](https://github.com/ginosega/fishing/issues/303) exceptional recovery and deferred [#301](https://github.com/ginosega/fishing/issues/301) remain separate.

Evidence: [#341](https://github.com/ginosega/fishing/issues/341) 2026-11-03 Android reader acceptance and 2026-11-04 Windows owner Phase A failure; 2026-11-05 [owner approval + implementation/isolated CI](https://github.com/ginosega/fishing/issues/341#issuecomment-6660554924), [exact-head CI #42045138884](https://github.com/ginosega/fishing/actions/runs/42045138884); [#342](https://github.com/ginosega/fishing/issues/342) provisional draft recovery; [#305](https://github.com/ginosega/fishing/issues/305) private performance. Cloudflare versions are last operator-reported, not freshly provider-verified.

## Independent fishing equipment and editorial backlog

Open, closed and explicitly deleted personal fishing/gear/KB tasks remain discoverable at [FISHING_BACKLOG_INDEX.md](FISHING_BACKLOG_INDEX.md); do not absorb into V3 milestones or reopen silently.
