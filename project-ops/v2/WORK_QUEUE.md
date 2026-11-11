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

State: in-progress
Owner: project owner / assistant implementer
Prerequisites: Default-main router and protected governance state; accepted requirements, technical design and bounded decisions; prior D5/private and D6/Stage A evidence verified; separate provider activation approvals retained.
Acceptance: All finite WP0–WP6 exit gates and the reviewed requirements→test matrix pass, final complete hosted owner/anonymous Windows/Android acceptance, authorized controlled real-record Save→GitHub→independently verified public Live, and preserved source/media/receipt integrity. No false Live.
Next safe action: Review the [WP0 66-ID requirements matrix](FISH118_WP0_REQUIREMENT_MATRIX.md) and [selective D5/D6 integration manifest](FISH118_WP0_INTEGRATION_MANIFEST.md); resolve named test exceptions and owner review before opening WP1 implementation.

**Owner-approved delivery scope (2026-11-10):** [FISH118 V3 Completion Contract](FISH118_V3_COMPLETION_CONTRACT.md), finite **WP0–WP6**, in order. All remaining V3 work and any new blocker MUST map to a WP; no new package/scope without documented evidence and explicit owner approval. This entry is the **only live WP status pointer**; do not duplicate plan text in the router, startup prompt or current-state history.

**Active package: WP0 — Freeze integration contract.** Status: **in-progress; inventory prepared for review, not yet WP0 accepted**. Owner: project owner / assistant implementer. [Requirement matrix](FISH118_WP0_REQUIREMENT_MATRIX.md) maps all 66 numbered V3 requirements to exactly one WP and source/test evidence; [integration manifest](FISH118_WP0_INTEGRATION_MANIFEST.md) maps D5/D6 source, the draft PR stack and production gaps. **Next:** complete protected governance CI and owner review of the source-disposition plus the original iPhone acceptance vs Windows/Android-only test preference and measurable card-performance threshold. Do not start WP1 until WP0 gate is accepted.

**Current evidence/blockers:** D5 private owner reading/editor/field UX and sandbox one-shot Save→Live previously owner-PASS [#357](https://github.com/ginosega/fishing/issues/357) / [#341](https://github.com/ginosega/fishing/issues/341); D6 Stage A read-only hosted/device PASS. D6 source-only stack through [draft #423](https://github.com/ginosega/fishing/pull/423) exact-head CI PASS ([#42913593871](https://github.com/ginosega/fishing/actions/runs/42913593871)); **no production authenticated publishing**. Read-only real-record [draft #424](https://github.com/ginosega/fishing/pull/424) exact-head [CI #42919892308](https://github.com/ginosega/fishing/actions/runs/42919892308) **FAILED** at owner Pages package marker verification, although **427/427 application tests** and six dedicated owner browser tests passed. #424 is a WP1 integration defect, not a release candidate; no hosted deployment. All D6 application PRs remain draft/unmerged. Public V2 unchanged.

**Owner/production gates:** Approved final D5 Connection Status UI to be **field-verified**, not redesigned ([#396](https://github.com/ginosega/fishing/issues/396)); provisional drafts [#342](https://github.com/ginosega/fishing/issues/342) may use existing approved removal fallback; fast publishing/recovery [#303](https://github.com/ginosega/fishing/issues/303) is WP4; #301 deferred. GitHub canonical data; one owner, same-origin server-only trust, ≤60s normal text Save→public verified Live. Owner accepts planned V2 downtime instead of dual-running/full rollback rehearsal. **Separate owner authorization still required** for provider credentials, production D1/Worker, publishing enablement, merge-to-`main` (auto-deploys), and cutover. Public URL `https://fishing.ginosega.workers.dev/fishing/` accepted in principle but is not active/production authorized.

**Evidence:** [D6 release issue #377](https://github.com/ginosega/fishing/issues/377); inspect live exact PR/CI/hosted/owner receipts independently at each milestone. Never promote source-only CI to deployed, complete RC or Live.

## Independent fishing equipment and editorial backlog

Open, closed and explicitly deleted personal fishing/gear/KB tasks remain discoverable at [FISHING_BACKLOG_INDEX.md](FISHING_BACKLOG_INDEX.md); do not absorb into V3 milestones or reopen silently.
