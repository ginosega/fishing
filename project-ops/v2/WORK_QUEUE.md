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
Evidence: [Audit procedure](SEMANTIC_AUDIT_SOP.md), [automated governance validation](VALIDATION_RUNBOOK.md). Weekly task created Nov 1; its latest outcome is not independently verified here. Nov 5 milestone review reconciles [#341](https://github.com/ginosega/fishing/issues/341) owner-private Pages/Worker and Windows A/B acceptance vs exact CI, and [#348](https://github.com/ginosega/fishing/pull/348) separately staged editor UX; no scheduled audit PASS or public V3 Live inferred.

## FISH-TODO-118 — Fishing Companion V3 continuation

State: in-progress — **read-only D5 Android reader accepted; D5 owner privately deployed with Windows Phase A 7/7 and B 5/5 owner PASS; authenticated Android owner, any sandbox publication and public D6 OPEN**
Owner: project owner / assistant implementer
Next safe action: **Bounded non-writing authenticated Android owner acceptance**, using the separately scoped private candidate without disturbing public V2 installation: OAuth/session/relaunch, mixed library and real edit denial, offline library Prepare, Work Offline/Automatic persistence, dirty synthetic editor preservation and appropriate Restore/Discard. The source-only editor notice spacing [PR #348](https://github.com/ginosega/fishing/pull/348) needs successful exact-head CI/guarded merge and separately authorized future hosting; deployed release remains unchanged. Device draft expiry/storage failure and persistent cross-session cases remain provisional under [#342](https://github.com/ginosega/fishing/issues/342). Any first sandbox publication, public V3 deploy or D1 migration requires separate approval.

Prerequisites: Original V3 source `feature/fish118-p3-mock-publisher@cecda55439a121fa59c5cb0aadc4530cd63859ce` / draft [#263](https://github.com/ginosega/fishing/pull/263) unmerged. Deployed private D5 owner source `0529c7e5ba7634ad305f9ab6646576c54f088caf` passed [isolated CI #42045138884](https://github.com/ginosega/fishing/actions/runs/42045138884), owner Pages release `2504b3b7e29a49841402c4687b12f9ad` at `https://380bc3a1.fishing-v3-owner-d5-test.pages.dev` hosted 13/13 samples + 6/6 negative routes, and owner Worker `c7a2b0fc-7738-43ab-a278-605846d675c6` with original D3 pilot/public V2 preserved [#341](https://github.com/ginosega/fishing/issues/341#issuecomment-6666562881). Owner authorization remains real-read-only plus synthetic sandbox-only write; no 144-narrative import above 120 cap. [#348](https://github.com/ginosega/fishing/pull/348) is a separate source-only UX follow-up with no deploy.

Acceptance: Isolated read-only D5 Android reader core accepted (12/12 sampled hashes, 6/6 route isolation, Android 10/10 modes + 6/6 media/diagnostics, installed test PWA). **Authenticated D5 Windows Phase A 7/7 OWNER PASS**: Trout deep-link OAuth restoration, 104 Gear/62 KB/17 Catch combined display, real read-only/direct-edit denied, synthetic Add/Edit fields, no CSP errors. **Windows Phase B 5/5 OWNER PASS**: synthetic unsaved text, Work Offline preserves editor while disabling publishing, Automatic restores, same InPrivate session reload Restore/Discard, deliberate discard. No Save & Publish invoked. Minor excessive space between two correct error/warning messages tracked as [PR #348](https://github.com/ginosega/fishing/pull/348), not deployed. IndexedDB owner drafts exist in source but long-lived durable/device/media/quota acceptance under [#342](https://github.com/ginosega/fishing/issues/342) still provisional; Android authenticated owner, sandbox publication and public D6 OPEN. Private 60s example [#305](https://github.com/ginosega/fishing/issues/305) not representative public Live.

D6 release gate: Authenticated Android owner session and CSRF-backed publishing, offline/no-lost-draft safety, verified source+CI, hosted full public bytes, rollback, representative Save→public Live, and **separate owner-approved V3 public cutover**. FISH108 protections unchanged; no bypasses or retries of ambiguous writes. Other open issues [#287](https://github.com/ginosega/fishing/issues/287) intermittent offline reliability, [#303](https://github.com/ginosega/fishing/issues/303) exceptional recovery and deferred [#301](https://github.com/ginosega/fishing/issues/301) remain separate.

Evidence: [#341](https://github.com/ginosega/fishing/issues/341) owner November 5 private Worker deployment and authenticated Windows A/B checks, [operator deployment receipt](https://github.com/ginosega/fishing/issues/341#issuecomment-6666562881), isolated [CI #42045138884](https://github.com/ginosega/fishing/actions/runs/42045138884), editor-notice [#348](https://github.com/ginosega/fishing/pull/348), [#342](https://github.com/ginosega/fishing/issues/342) provisional owner drafts, [#305](https://github.com/ginosega/fishing/issues/305) private 60s example. Owner evidence, source/CI and public D6 remain distinct.

## Independent fishing equipment and editorial backlog

Open, closed and explicitly deleted personal fishing/gear/KB tasks remain discoverable at [FISHING_BACKLOG_INDEX.md](FISHING_BACKLOG_INDEX.md); do not absorb into V3 milestones or reopen silently.
