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
Evidence: [Audit procedure](SEMANTIC_AUDIT_SOP.md) and [validator](VALIDATION_RUNBOOK.md). At 2026-11-09 Stage A milestone audit, verified drift: old governance text claimed Stage A Pages/Worker unprovisioned and D6 hosted/field acceptance absent despite owner-confirmed provider and device PASS. The in-place correction [protected PR #397](https://github.com/ginosega/fishing/pull/397) **was merged after both required checks passed**; current owner downtime simplification is an additional scoped reconciliation, linked to [#377](https://github.com/ginosega/fishing/issues/377#issuecomment-6756201287). Default main remains `fc85bd38`, D6 draft [#395](https://github.com/ginosega/fishing/pull/395) exact-head [CI #42579092617](https://github.com/ginosega/fishing/actions/runs/42579092617) PASS, Stage A field [#377](https://github.com/ginosega/fishing/issues/377#issuecomment-6755722813). Owner-reported bytes/device data are not independent assistant HTTP fetches; weekly scheduled audit separate.

## FISH-TODO-118 — Fishing Companion V3 continuation

State: in-progress — D5 authenticated private owner UX [#357](https://github.com/ginosega/fishing/issues/357) CLOSED and Windows/Android acceptance PASS; private synthetic Gear Save→Live owner PASS [#341](https://github.com/ginosega/fishing/issues/341). D6 static Stage A [#395](https://github.com/ginosega/fishing/pull/395) owner-accepted with 577/577 hosted bytes and Windows/Android tests. **D6 source-only production stack through draft [#413](https://github.com/ginosega/fishing/pull/413) CI PASS, not deployed**: exact head `f0d4831fd6e907c13f6ee1da4f538bd5e3c922ee`; [CI #42864416093](https://github.com/ginosega/fishing/actions/runs/42864416093) completed SUCCESS, required `classify`, `validate-full`, `fishing-merge-ready`; explicit compiled opt-in owner Connection Status candidate 4/4 browser tests PASS in Chromium/WebKit; deploy skipped. Owner-approved D5 Connection Status design is preserved without redesign; final hosted owner acceptance [#396](https://github.com/ginosega/fishing/issues/396) remains OPEN. Public V2 unchanged. [D6 evidence #377](https://github.com/ginosega/fishing/issues/377#issuecomment-6774782967).
Owner: project owner / assistant implementer
Next safe action: Focus on a **usable integrated V3** rather than repeating isolated UX work: reconcile the approved D5 editor, current canonical main content/media, and D6 same-origin default-OFF production session/source with a guarded canonical-main publisher, conflict/idempotency/unknown-result receipts and explicit hosted Live proof. Prepare source and staging review only; obtain **separate owner approval** for live GitHub App/OAuth credentials/permissions, D1, public Worker route, public origin and final cutover. Then independently verify Windows Edge/Android, drafts [#342](https://github.com/ginosega/fishing/issues/342) and final UX #396. Never merge draft D6 stack to `main` without cutover authorization.
Prerequisites: Default `main` router → protected `governance/project-ops`; D5 owner source and D6 immutable static Stage A preserved. Original prototype [#263](https://github.com/ginosega/fishing/pull/263) still draft/unmerged; selective D6 drafts [#395–#413](https://github.com/ginosega/fishing/pull/413) staged on source branches, not public main. Real production same-origin address `https://fishing.ginosega.workers.dev/fishing/` is **proposed, not owner-approved/activated**. SEC-001/002/004/005, ARC-003/004/007 and PUB-002/003/004 apply; D2/D3 private sandbox authority must never be repointed to canonical main.
Acceptance: D5 private UX/owner field PASS [#357](https://github.com/ginosega/fishing/issues/357); isolated Stage A static read-only hosted/source and owner device PASS [#377](https://github.com/ginosega/fishing/issues/377#issuecomment-6755722813). **Source CI/browser acceptance only** for #413; no real production OAuth/D1/owner session, no canonical-main hosted read, no production write/publish, no final V3 owner Windows/Android field acceptance, no new public hosted release and no live cutover. #396 final Connection Status is **integration verification, not a design reopening**; #342 long-lived offline/media draft durability remains provisional. Owner ARC-007 accepts planned V2 downtime/in-place V3 repairs and waives V2 uptime/rollback rehearsal/seamless device migration, **not** integrity or approval.
Evidence: [D6 milestone #377](https://github.com/ginosega/fishing/issues/377), [exact-head #413 CI](https://github.com/ginosega/fishing/actions/runs/42864416093), [owner-accepted D5 UX #357](https://github.com/ginosega/fishing/issues/357), [final UX #396](https://github.com/ginosega/fishing/issues/396), [draft durability #342](https://github.com/ginosega/fishing/issues/342), [V2 downtime amendment](https://github.com/ginosega/fishing/issues/377#issuecomment-6756201287). Provider/device evidence and GitHub Actions CI remain separate; do not claim public Live from a green source check.

## Independent fishing equipment and editorial backlog

Open, closed and explicitly deleted personal fishing/gear/KB tasks remain discoverable at [FISHING_BACKLOG_INDEX.md](FISHING_BACKLOG_INDEX.md); do not absorb into V3 milestones or reopen silently.
