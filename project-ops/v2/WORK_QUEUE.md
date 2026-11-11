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
Next safe action: Validate [draft #431](https://github.com/ginosega/fishing/pull/431) exact-head full CI for measured 2s Gear-card / derivative-byte budgets and disconnected-owner editing/draft-denial coverage. Correct any regressions on the same WP1 branch; review remaining Notes/media/offline editor controls without changing owner-approved failure UI. Publishing remains disabled and source-only CI is not a hosted acceptance.

**Owner-approved delivery scope (2026-11-10):** [FISH118 V3 Completion Contract](FISH118_V3_COMPLETION_CONTRACT.md), finite **WP0–WP6**, in order. All remaining V3 work and any new blocker MUST map to a WP; no new package/scope without documented evidence and explicit owner approval. This entry is the **only live WP status pointer**; do not duplicate plan text in the router, startup prompt or current-state history.

**WP0 — ACCEPTED (2026-11-10 owner approval).** Owner reviewed [66-ID requirement matrix](FISH118_WP0_REQUIREMENT_MATRIX.md), [D5/D6 integration manifest](FISH118_WP0_INTEGRATION_MANIFEST.md), and selective draft PR dispositions. Accepted WP5 owner-operated testing on Windows Edge and Android (no iPhone test PASS claim; no removal of supported-platform scope); approved measured Gear-card baseline/numeric threshold determination during WP1, verified again in WP5. The fixed ≤60s text publishing gate remains unchanged.

**Active package: WP1 — Complete V3 frontend.** Status: **in progress**. Owner: project owner / assistant implementer. Approved D5 Gear/KB/Catch/Notes/media UI is integrated into D6 canonical owner preview with fresh session/source checks; publishing OFF. [#429](https://github.com/ginosega/fishing/pull/429) CI PASS, [#430](https://github.com/ginosega/fishing/pull/430) CI PASS; [#431](https://github.com/ginosega/fishing/pull/431) numeric card performance/offline negative tests pending exact-head CI. **WP1 exit:** approved real-record controls, media/link/viewer/offline/draft/denial paths, no sandbox-only production UI and measurable Gear-card behavior pass integrated browser CI; later full private-hosted release and owner device acceptance remain WP5.

**Current evidence/blockers:** D5 private owner/field results [#357](https://github.com/ginosega/fishing/issues/357), [#341](https://github.com/ginosega/fishing/issues/341); D6 Stage A hosted read-only owner field PASS. [#424](https://github.com/ginosega/fishing/pull/424) physical real-record read-only package CI PASS; [#429](https://github.com/ginosega/fishing/pull/429) head `767c30e8414ce5a2f8faac13eab0ec55cb1e1cbe` [CI #43070750483](https://github.com/ginosega/fishing/actions/runs/43070750483) PASS owner editor 8/8; [#430](https://github.com/ginosega/fishing/pull/430) head `e95cc6086d5e7bf135360d01659e626821b0673f` [CI #43079777196](https://github.com/ginosega/fishing/actions/runs/43079777196) PASS 442/442 source, 54 preview, 6 owner Connection Status, 14/14 WP1 draft/editor/card browsers, 56 production; source-only artifact uploaded, no deploy. Real-record IndexedDB local draft autosave/reload/Restore PASS in Chromium/WebKit; image bytes NOT persisted and #342 remains provisional. Observed Gear lures above-fold baseline: 633–720ms desktop, 455–644ms mobile (Chromium 80ms RTT/1MiB/s, WebKit unthrottled); [#431](https://github.com/ginosega/fishing/pull/431) proposes 2s and 96/64KiB CI gates, disconnected-owner denial. **Owner reviewed static failure screens and approved existing exact strings, dual editor notices, Clear action and Connection Status UX AS-IS (2026-11-11); no copy/visual changes approved.** All app PRs draft, unmerged; no complete privately hosted V3 RC, no production credential/write route and public V2 unchanged.

**Owner/production gates:** Approved final D5 Connection Status UI to be **field-verified**, not redesigned ([#396](https://github.com/ginosega/fishing/issues/396)); provisional drafts [#342](https://github.com/ginosega/fishing/issues/342) may use existing approved removal fallback; fast publishing/recovery [#303](https://github.com/ginosega/fishing/issues/303) is WP4; #301 deferred. GitHub canonical data; one owner, same-origin server-only trust, ≤60s normal text Save→public verified Live. Owner accepts planned V2 downtime instead of dual-running/full rollback rehearsal. **Separate owner authorization still required** for provider credentials, production D1/Worker, publishing enablement, merge-to-`main` (auto-deploys), and cutover. Public URL `https://fishing.ginosega.workers.dev/fishing/` accepted in principle but is not active/production authorized.

**Evidence:** [D6 release issue #377](https://github.com/ginosega/fishing/issues/377); inspect live exact PR/CI/hosted/owner receipts independently at each milestone. Never promote source-only CI to deployed, complete RC or Live.

## Independent fishing equipment and editorial backlog

Open, closed and explicitly deleted personal fishing/gear/KB tasks remain discoverable at [FISHING_BACKLOG_INDEX.md](FISHING_BACKLOG_INDEX.md); do not absorb into V3 milestones or reopen silently.
