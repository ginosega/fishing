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
Next safe action: Verify draft #444 exact-head `1fff918f1830d8fc9dcc24dbb111896c3875a3ff` full Chromium/WebKit, production and merge-ready PASS with both deployments skipped. It tests real Catch fields/listing, direct editor denials, no sandbox handoff, and restored owner-approved D5 Help & Diagnostics. Finish WP1's requirement-to-browser evidence review; do not close WP1 or advance to WP2 without confirmed exit. No app merge, credentials, publishing, Cloudflare or deployment.

**Owner-approved delivery scope (2026-11-10):** [FISH118 V3 Completion Contract](FISH118_V3_COMPLETION_CONTRACT.md), finite **WP0–WP6**, in order. All remaining V3 work and any new blocker MUST map to a WP; no new package/scope without documented evidence and explicit owner approval. This entry is the **only live WP status pointer**; do not duplicate plan text in the router, startup prompt or current-state history.

**WP0 — ACCEPTED (2026-11-10 owner approval).** Owner reviewed [66-ID requirement matrix](FISH118_WP0_REQUIREMENT_MATRIX.md), [D5/D6 integration manifest](FISH118_WP0_INTEGRATION_MANIFEST.md), and selective draft PR dispositions. Accepted WP5 owner-operated testing on Windows Edge and Android (no iPhone test PASS claim; no removal of supported-platform scope); approved measured Gear-card baseline/numeric threshold determination during WP1, verified again in WP5. The fixed ≤60s text publishing gate remains unchanged.

**Active package: WP1 — Complete V3 frontend.** Status: **in progress — final acceptance reconciliation pending**. Owner: project owner / assistant implementer. Approved D5 Gear/KB/Catch/Notes and Connection Status are integrated into the canonical D6 owner-preview root, guarded by fresh owner and source verification; publishing OFF. [#429](https://github.com/ginosega/fishing/pull/429), [#430](https://github.com/ginosega/fishing/pull/430) and [#431](https://github.com/ginosega/fishing/pull/431) exact-head CI all PASS. **WP1 exit still requires final requirement→integrated-browser/deny evidence for approved media, links/viewer, offline/drafts and no sandbox-only UI**, not a new hosted release or live publishing. Final private hosted and Windows/Android owner field acceptance remain WP5.

**Current evidence/blockers (2026-11-12):** D5 private field tests PASS [#357](https://github.com/ginosega/fishing/issues/357)/[#341](https://github.com/ginosega/fishing/issues/341); D6 read-only Stage A hosted/Windows/Android PASS. [#424](https://github.com/ginosega/fishing/pull/424) read-only real-record physical artifact PASS (not deployed); [#429](https://github.com/ginosega/fishing/pull/429) `767c30e8414ce5a2f8faac13eab0ec55cb1e1cbe` [CI #43070750483](https://github.com/ginosega/fishing/actions/runs/43070750483) PASS gated editor; [#430](https://github.com/ginosega/fishing/pull/430) `e95cc6086d5e7bf135360d01659e626821b0673f` [CI #43079777196](https://github.com/ginosega/fishing/actions/runs/43079777196) PASS local drafts/real-record editor. **Latest [draft #431](https://github.com/ginosega/fishing/pull/431) exact head `8762130ece349a37971e5f48f6dc5d8f6520a73f`, [CI #43084610219](https://github.com/ginosega/fishing/actions/runs/43084610219) COMPLETE SUCCESS:** 442/442 Node, 54 preview browsers, 6 owner Connection Status/real-record, **16/16 WP1 owner editor/draft/disconnected-denial/card browsers** Chromium/WebKit, 56 production browsers; merge-ready PASS, all deployments SKIPPED; verified source-only artifact `d6-wp1-owner-editor-preview-source-only` (ID 13885729408) uploaded but not hosted. Measured Gear lures desktop 670ms Chromium/701ms WebKit; mobile 666ms Chromium/509ms WebKit (Chromium 80ms RTT/1MiB/s, WebKit unthrottled), both under **≤2s** and **96KiB desktop/64KiB mobile** thumbnail-byte CI budgets; real device WP5 still required. Local drafts restore/retain and no-write offline denial tested; image bytes intentionally NOT persisted; #342 provisional. **Owner approved all rendered failure screens and existing exact UI strings/layout unchanged, including dual editor notices and Clear action (2026-11-11).** **[Draft #435](https://github.com/ginosega/fishing/pull/435) (`9a0102301c04c58cdc74252a2e3126e69328ac51`) [CI #43116065575](https://github.com/ginosega/fishing/actions/runs/43116065575) PASS:** approved Notes fixed site and Catch links with preview/deny tests. **[Draft #437](https://github.com/ginosega/fishing/pull/437) (`ff69a249152f1ab984bbba7647203a8178df5e90`) [CI #43129578345](https://github.com/ginosega/fishing/actions/runs/43129578345) PASS:** real-record original Notes Picture Viewer, broken-image and no-write integrated browsers; earlier test fixture failures corrected without weakening immutable release. **[Draft #439](https://github.com/ginosega/fishing/pull/439) `6817e533715a7f3dfd2079de2974faccd72aa6e6` [CI #43135554029](https://github.com/ginosega/fishing/actions/runs/43135554029) PASS:** real JPEG original Notes media picker, alt-required denial, preview and no-write Chromium/WebKit. **[Draft #442](https://github.com/ginosega/fishing/pull/442) `5d15378a13927888bd623eee91d53d3d315cca7f` [CI #43153569673](https://github.com/ginosega/fishing/actions/runs/43153569673) PASS:** stale/quota draft warnings, keyboard search and safe editor reload. **[Draft #444](https://github.com/ginosega/fishing/pull/444) `1fff918f1830d8fc9dcc24dbb111896c3875a3ff` PENDING:** Catch Add/Edit/list, anonymous/legacy handoff denials, and missing D5-approved Help & Diagnostics restored with privacy-safe copy/fallback. WP1 exit not yet accepted. All app PRs draft/unmerged; no provider publishing credentials, complete hosted/writable RC, Cloudflare/D1/Worker changes or public V3 deploy. Remaining WP1 review against the 66-ID accepted matrix is NOT yet a PASS declaration; preserve GitHub canonical source and approved D5 UX.

**Owner/production gates:** Approved final D5 Connection Status UI to be **field-verified**, not redesigned ([#396](https://github.com/ginosega/fishing/issues/396)); provisional drafts [#342](https://github.com/ginosega/fishing/issues/342) may use existing approved removal fallback; fast publishing/recovery [#303](https://github.com/ginosega/fishing/issues/303) is WP4; #301 deferred. GitHub canonical data; one owner, same-origin server-only trust, ≤60s normal text Save→public verified Live. Owner accepts planned V2 downtime instead of dual-running/full rollback rehearsal. **Separate owner authorization still required** for provider credentials, production D1/Worker, publishing enablement, merge-to-`main` (auto-deploys), and cutover. Public URL `https://fishing.ginosega.workers.dev/fishing/` accepted in principle but is not active/production authorized.

**Evidence:** [D6 release issue #377](https://github.com/ginosega/fishing/issues/377); inspect live exact PR/CI/hosted/owner receipts independently at each milestone. Never promote source-only CI to deployed, complete RC or Live.

## Independent fishing equipment and editorial backlog

Open, closed and explicitly deleted personal fishing/gear/KB tasks remain discoverable at [FISHING_BACKLOG_INDEX.md](FISHING_BACKLOG_INDEX.md); do not absorb into V3 milestones or reopen silently.
