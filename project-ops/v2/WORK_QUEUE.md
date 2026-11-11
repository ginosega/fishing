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
Next safe action: #424 exact-head CI now PASS and read-only real-record artifact retained; selectively integrate approved D5 Gear/KB/Catch/Notes/media editor in D6 production-root UI behind canonical session/source guards, with no active writer. Verify browser denial/owner flows and establish measurable card-load baseline/threshold before WP1 exit.

**Owner-approved delivery scope (2026-11-10):** [FISH118 V3 Completion Contract](FISH118_V3_COMPLETION_CONTRACT.md), finite **WP0–WP6**, in order. All remaining V3 work and any new blocker MUST map to a WP; no new package/scope without documented evidence and explicit owner approval. This entry is the **only live WP status pointer**; do not duplicate plan text in the router, startup prompt or current-state history.

**WP0 — ACCEPTED (2026-11-10 owner approval).** Owner reviewed [66-ID requirement matrix](FISH118_WP0_REQUIREMENT_MATRIX.md), [D5/D6 integration manifest](FISH118_WP0_INTEGRATION_MANIFEST.md), and selective draft PR dispositions. Accepted WP5 owner-operated testing on Windows Edge and Android (no iPhone test PASS claim; no removal of supported-platform scope); approved measured Gear-card baseline/numeric threshold determination during WP1, verified again in WP5. The fixed ≤60s text publishing gate remains unchanged.

**Active package: WP1 — Complete V3 frontend.** Status: **in progress**. Owner: project owner / assistant implementer. **Current critical path:** #424 read-only real-record package CI PASS but NOT hosted; now integrate approved D5 Gear/KB/Catch/Notes/media authoring into the D6 production-root app behind canonical verified session/source and fail-closed write-disabled gates. **WP1 exit:** all approved frontend controls, real-record navigation, privacy/offline/draft safeguards and measurable Gear-card behavior pass integrated CI and documented host-gate review. Do not imply source-only CI is final hosted acceptance.

**Current evidence/blockers:** D5 private editor, Notes, Catches, offline and sandbox Save→Live owner-PASS [#357](https://github.com/ginosega/fishing/issues/357)/[#341](https://github.com/ginosega/fishing/issues/341); D6 Stage A static hosted/device PASS. D6 source stack through [draft #423](https://github.com/ginosega/fishing/pull/423) full CI PASS. **WP1 #424 packaging correction passed** on unchanged stacked base: [draft #424](https://github.com/ginosega/fishing/pull/424) head `748351f658788a18fcdfdd819b3019cdd6bdacba`, [Actions #42971641623](https://github.com/ginosega/fishing/actions/runs/42971641623) SUCCESS (427/427 application tests, 54 preview/56 production browser, 6/6 real-record/Connection Status browser). Verified isolated `d6-final-owner-real-records-source-only` artifact [ID 13834173420](https://github.com/ginosega/fishing/actions/runs/42971641623/artifacts/13834173420) uploaded; **NO hosted release or owner editor**. Next WP1 critical path: selectively port approved D5 Gear/KB/Catch/Notes/media editor to D6 canonical source/session UI, with no default write route; integrated browser tests and performance threshold. All D6 app PRs draft/unmerged. Public V2 unchanged.

**Owner/production gates:** Approved final D5 Connection Status UI to be **field-verified**, not redesigned ([#396](https://github.com/ginosega/fishing/issues/396)); provisional drafts [#342](https://github.com/ginosega/fishing/issues/342) may use existing approved removal fallback; fast publishing/recovery [#303](https://github.com/ginosega/fishing/issues/303) is WP4; #301 deferred. GitHub canonical data; one owner, same-origin server-only trust, ≤60s normal text Save→public verified Live. Owner accepts planned V2 downtime instead of dual-running/full rollback rehearsal. **Separate owner authorization still required** for provider credentials, production D1/Worker, publishing enablement, merge-to-`main` (auto-deploys), and cutover. Public URL `https://fishing.ginosega.workers.dev/fishing/` accepted in principle but is not active/production authorized.

**Evidence:** [D6 release issue #377](https://github.com/ginosega/fishing/issues/377); inspect live exact PR/CI/hosted/owner receipts independently at each milestone. Never promote source-only CI to deployed, complete RC or Live.

## Independent fishing equipment and editorial backlog

Open, closed and explicitly deleted personal fishing/gear/KB tasks remain discoverable at [FISHING_BACKLOG_INDEX.md](FISHING_BACKLOG_INDEX.md); do not absorb into V3 milestones or reopen silently.
