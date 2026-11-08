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
Evidence: [Audit procedure](SEMANTIC_AUDIT_SOP.md), [validator](VALIDATION_RUNBOOK.md). Bounded 2026-11-07 milestone/transfer audit reconciled [closed UX #357](https://github.com/ginosega/fishing/issues/357), [D5 #341](https://github.com/ginosega/fishing/issues/341#issuecomment-6712189499), latest isolated source and [push CI #42404707930](https://github.com/ginosega/fishing/actions/runs/42404707930), owner-operated private Pages/Worker and device PASS. This is NOT a scheduled audit result or evidence of public V3 Live; latest weekly task result not independently checked.

## FISH-TODO-118 — Fishing Companion V3 continuation

State: in-progress — **private D5 UX batch complete and issue [#357](https://github.com/ginosega/fishing/issues/357) CLOSED**, but authenticated installed-owner PWA **Phase 1 7/7 and Phase 2 non-submitting 8/8 owner PASS**, provisional long-lived drafts, synthetic publication and D6/public cutover remain OPEN. Public V2 remains unchanged. [Phase 1 owner PWA PASS](https://github.com/ginosega/fishing/issues/341#issuecomment-6712729663); V2 catalog remains deliberately read-only in private D5 owner overlay; [Phase 2 installed PWA 8/8 owner PASS](https://github.com/ginosega/fishing/issues/341#issuecomment-6715260931); [Android draft checkpoint](https://github.com/ginosega/fishing/issues/342#issuecomment-6715263047). No Save & Publish occurred.
Owner: project owner / assistant implementer
Next safe action: With installed-owner Phase 1 and Phase 2 non-submitting owner PASS ([Phase 2 installed PWA 8/8 owner PASS](https://github.com/ginosega/fishing/issues/341#issuecomment-6715260931)), reconcile [#342](https://github.com/ginosega/fishing/issues/342) remaining provisional long-duration/media/quota/corruption/expiry/conflict draft cases and any separately approved targeted negatives. An offline UI/control check without submitting must not be presented as a runtime server-denial test. Preserve synthetic unsent draft, installed V2 and owner PWAs, old Pages/Worker/assets, one-attempt markers, and public V2. Do not clear browser storage, edit real V2 content, upload/deploy, write D1 or press Save & Publish. Next synthetic sandbox Save→Live and any D6/public cutover require separate explicit owner approval.
Prerequisites: `governance/project-ops` routed from default main; isolated `feature/fish118-d5-owner-integration@d3eb6cd573b4370ebf7c97b28de56ba99ded2f56`; guarded UX [#365](https://github.com/ginosega/fishing/pull/365), PowerShell 5.1 operator repair [#367](https://github.com/ginosega/fishing/pull/367) and UX follow-up [#369](https://github.com/ginosega/fishing/pull/369) merged, exact-head [post-merge push P3 CI #42404707930](https://github.com/ginosega/fishing/actions/runs/42404707930) **SUCCESS**. Owner private Pages `63a65b86.fishing-v3-owner-d5-test.pages.dev` release `b9125a483a4007ea6826865f76c55c20` [13/13 host samples PASS](https://github.com/ginosega/fishing/issues/357#issuecomment-6711987156); authenticated Worker `fishing-auth-p0-test` version `cf6daf23-e44a-4648-89fc-cabcc681819b` [operator PASS](https://github.com/ginosega/fishing/issues/357#issuecomment-6712057010) with old Pages/D3/D1/public V2 reportedly preserved. Public [V3 PR #263](https://github.com/ginosega/fishing/pull/263) still draft/unmerged.
Acceptance: Private UX-01/02/03 owner Android Chrome **PASS** on prior candidate and corrected UX-04/05 Android focused **PASS** on latest Worker; Windows Edge **5/5 PASS** on corrected Worker. [Android](https://github.com/ginosega/fishing/issues/357#issuecomment-6712119921) · [Windows](https://github.com/ginosega/fishing/issues/357#issuecomment-6712174984). Earlier Android startup 5A 6/6 and Edge first-visit 5B owner PASS on previous private candidate ([5A](https://github.com/ginosega/fishing/issues/341#issuecomment-6703384387) · [5B](https://github.com/ginosega/fishing/issues/341#issuecomment-6703545836)). **Not proven:** complete Android UX 5/5 on one latest build, actual offline Save & Publish rejection (no submission made), all older broad SW collision cases on a fresh installed owner profile, long-lived draft/media/quota/session negative paths, synthetic Save→Live, or public D6 hosted identity. [Phase 1 owner PWA PASS](https://github.com/ginosega/fishing/issues/341#issuecomment-6712729663) confirms separate installed owner app, startup/session, read-only navigation and V2 independence; source verifies only sandbox Edit, not V2 catalog Edit. [Phase 2 installed PWA 8/8 owner PASS](https://github.com/ginosega/fishing/issues/341#issuecomment-6715260931) confirms 8/8 installed owner Android non-submitting checks: Add Catch form, synthetic Edit, Notes autosave, Offline/Automatic text retention, app relaunch and one-time Restore; the draft remains saved. [Android draft checkpoint](https://github.com/ginosega/fishing/issues/342#issuecomment-6715263047). Owner operator/device reports are distinct from CI and provider telemetry.
UX scope: [#357](https://github.com/ginosega/fishing/issues/357) **CLOSED / private owner acceptance complete**, covering Add Catch layout, stacked Offline Library text, compact Markdown controls, exact `Verifying the offline catalog...` copy, and link/image icons disabled in Preview and re-enabled in Edit. No further UX upload is needed solely for this accepted batch; keep future new findings separately scoped.
D6 gate: authenticated installed-owner PWA Phase 1 7/7 and non-submitting Phase 2 8/8 owner PASS; runtime offline Save & Publish refusal NOT TESTED; provisional [#342](https://github.com/ginosega/fishing/issues/342) remains open for long-duration/local-media/conflict negatives; separately approved synthetic sandbox Save→Live, verified public source/CI/hosted bytes/rollback and **explicit** owner-approved public V3 cutover. Existing D3 120 narrative cap does not authorize importing 144 real narratives. [#287](https://github.com/ginosega/fishing/issues/287) and [#303](https://github.com/ginosega/fishing/issues/303) distinct open issues; [#301](https://github.com/ginosega/fishing/issues/301) deferred. Private ~60s [#305](https://github.com/ginosega/fishing/issues/305) does not establish public D6.
Evidence: [D5 owner checkpoint #341](https://github.com/ginosega/fishing/issues/341#issuecomment-6712189499) · [Phase 1 owner PWA PASS](https://github.com/ginosega/fishing/issues/341#issuecomment-6712729663) · [Phase 2 installed PWA 8/8 owner PASS](https://github.com/ginosega/fishing/issues/341#issuecomment-6715260931) · [Android draft checkpoint](https://github.com/ginosega/fishing/issues/342#issuecomment-6715263047) · [closed UX #357](https://github.com/ginosega/fishing/issues/357) · [draft recovery #342](https://github.com/ginosega/fishing/issues/342) · [startup follow-up #358](https://github.com/ginosega/fishing/issues/358) (issue status text may be stale relative to later 5A/5B source/device evidence; reconcile before any proposed rework). No public release or new provider operation implied.

## Independent fishing equipment and editorial backlog

Open, closed and explicitly deleted personal fishing/gear/KB tasks remain discoverable at [FISHING_BACKLOG_INDEX.md](FISHING_BACKLOG_INDEX.md); do not absorb into V3 milestones or reopen silently.
