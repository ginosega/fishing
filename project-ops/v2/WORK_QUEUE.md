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
Acceptance: Under [ADR-0011](decisions/records/ADR-0011.md) and owner-approved [ADR-0012](decisions/records/ADR-0012.md), preserve approved Gear/KB/Catch UX, owner-only revision-safe D1 records+Markdown, one private R2 historical/new image store, unified Save, independently verified current-content Work Offline snapshots, safe drafts, reconciled data/media, Edge/Android acceptance and separate public cutover. **Full stable-ID scope and acceptance obligations: [FISH-TODO-118 consolidation ledger](FISH-TODO-118_CONSOLIDATION_SCOPE.md).** The original per-edit GitHub publishing pathway remains superseded.
Next safe action: **L01 — prepare one separately owner-approved private deployment and focused Edge/Android acceptance**, not another architecture phase. Source [draft #567](https://github.com/ginosega/fishing/pull/567) exact head `254a27715783d1f733aef24ec1e18a8f8d33e5bd`, [CI #45344403769](https://github.com/ginosega/fishing/actions/runs/45344403769) SUCCESS (release/browser acceptance SKIPPED). Existing private build based on `7e838e93` was owner-tested (most Android tests PASS; Category/Type spacing FAIL; Windows suite PASS). Since then source-only 14px choice/Notes gaps, **Add/Cancel** labels, Save→automatic Exit, and **Catch Species select + explicit KB Species creation** were implemented/tested; **not yet deployed or field accepted**. Confirm hosted identity/version and security when deploying; target Gear/KB/Catch, real KB Species starter Notes/edit, offline protection and no regression. Complete L01 parity/standalone runtime review and separately gate A01 fresh installation. **No new deploy, app merge or public cutover authorization implied.** [Checkpoint](https://github.com/ginosega/fishing/issues/377#issuecomment-7124565706).

**O01 source-only exit (2026-11-22 Pacific):** App PR #567 `9534a633`, [CI](https://github.com/ginosega/fishing/actions/runs/45086501775) PASS 647/647. Coherent read-only D1/Markdown/R2 registry manifest; source only, no independent R2/provider proof. [Receipt](https://github.com/ginosega/fishing/issues/377#issuecomment-7088054611).

**D01 private functional acceptance: PASS.** Initial revision-aware draft Restore/Discard accepted on Windows and Android ([receipt](https://github.com/ginosega/fishing/issues/377#issuecomment-7093730903)); subsequent owner private testing also PASS for offline warning placement, Save denial, Cancel confirmation and preserved device draft ([L01 checkpoint](https://github.com/ginosega/fishing/issues/377#issuecomment-7124565706)). Preserve draft safeguards. Public V2 untouched.

**O02 owner receipt (2026-11-22 Pacific):** Private deployment and tests PASS; [receipt](https://github.com/ginosega/fishing/issues/377#issuecomment-7091119413), [CI](https://github.com/ginosega/fishing/actions/runs/45097701645) 688/688 at app PR #567 `0337f33f`. Hosted Worker/release IDs unavailable; owner-reported only.

**Standalone final V3 (owner 2026-11-22):** L01 removes V2/FISH091 reader, cache reuse, compatibility, install detection, upgrade and cleanup code after O03/D01 parity. A01 tests a clean V3 install; owner later **manually** clears V2 PWA/site data on three devices using browser/OS controls only. V3 itself never touches V2 site data. Preserve D1/R2 and unrelated data. [Directive](https://github.com/ginosega/fishing/issues/377#issuecomment-7089557303) · [Ledger](FISH-TODO-118_CONSOLIDATION_SCOPE.md).

**Current owner-approved scope:** [ADR-0011](decisions/records/ADR-0011.md) owner-only direct D1 Save and [ADR-0012](decisions/records/ADR-0012.md) one D1/R2 content authority, revised verified Work Offline snapshots, plus [L01 Add/Edit parity and legacy UI cleanup](https://github.com/ginosega/fishing/issues/377#issuecomment-7106183933) before final V3 acceptance; private M01–M03 implementation and tests were separately authorized and owner-accepted. Under [owner's narrow M03 exception](https://github.com/ginosega/fishing/issues/377#issuecomment-7086996544), per-image opt-in inline Notes thumbnails are approved and accepted; blanket inline Notes conversion remains deferred under REL-007. This closes **only private M03**, not O01–A01 or future provider/public work. No generic publisher/watchdog or speculative service restarts.

**WP0 — ACCEPTED (2026-11-10 owner approval).** Owner reviewed [66-ID requirement matrix](FISH118_WP0_REQUIREMENT_MATRIX.md), [D5/D6 integration manifest](FISH118_WP0_INTEGRATION_MANIFEST.md), and selective draft PR dispositions. Accepted WP5 owner-operated testing on Windows Edge and Android (no iPhone test PASS claim; no removal of supported-platform scope); approved measured Gear-card baseline/numeric threshold determination during WP1, verified again in WP5. The historical ≤60s per-edit GitHub publishing gate is superseded for direct-D1 content Save by ADR-0011; code release verification remains required.

**WP1 — SOURCE-ONLY FRONTEND EXIT VERIFIED (2026-11-12).** Accepted D5 Gear/KB/Catch/Notes, Connection Status incl. Help & Diagnostics, original media/link/viewer, draft/offline guards, and absent sandbox handoff are integrated into the D6 production-root owner-preview. 30 WP1-owned requirement rows reconciled in [WP1 exit evidence](FISH118_WP1_EXIT_EVIDENCE.md). Final exact-head [draft #444](https://github.com/ginosega/fishing/pull/444) at `1fff918f1830d8fc9dcc24dbb111896c3875a3ff`, [CI #43157202532](https://github.com/ginosega/fishing/actions/runs/43157202532) SUCCESS: 38/38 WP1 Chromium/WebKit editor/denial/performance browser tests, 56/56 production browsers, full validation and merge-ready PASS, deploy jobs SKIPPED. Source-only acceptance is **not** a hosted writable RC or permission to merge app PRs. Explicit later verifications: production publication-cleared drafts (WP3/WP4) and physical offline/editor/external link and owner UX (WP5).

**Former WP3 H2/H3 and WP4 GitHub publisher milestones — STOPPED by owner architecture simplification.** The prior synthetic PR, scheduler, watchdog and Windows OFF-canary gate are not prerequisites. The direct Gear write/read/reload and migration have already passed in the existing private Worker. Continue the same pattern for KB/Catches without reviving the legacy pathway; public V2 still in service.

**Historical WP1/WP2 evidence (2026-11-10–12 Pacific):** Source-only WP1 accepted at [draft #444](https://github.com/ginosega/fishing/pull/444) `1fff918f` [CI #43157202532](https://github.com/ginosega/fishing/actions/runs/43157202532) PASS; owner-approved editor/draft/viewer, security and mobile-browser checks are detailed in the [WP1 exit ledger](FISH118_WP1_EXIT_EVIDENCE.md), [issue #357](https://github.com/ginosega/fishing/issues/357) and [issue #341](https://github.com/ginosega/fishing/issues/341). Isolated owner read-only OAuth/canonical-source WP2 accepted at [draft #455](https://github.com/ginosega/fishing/pull/455) `77b8e182` [CI #43277247187](https://github.com/ginosega/fishing/actions/runs/43277247187) PASS; owner reported private Worker `f0849ef6`, unchanged Pages release `f43fb624`, authenticated main read and anonymous/write denial ([receipt](https://github.com/ginosega/fishing/issues/377#issuecomment-6833628839)). [WP2 exit ledger](FISH118_WP2_EXIT_EVIDENCE.md) preserves seven source-owned requirements. These were earlier bounded private/source checkpoints, not public V3, live per-edit GitHub publishing, app merge or current L01 field acceptance.

**Owner/production gates:** Auth/revision/integrity, backup/export, Edge/Android acceptance and separate private deployment, protected merge and public cutover approvals remain necessary. Public V2 unchanged until approval. No old publisher/watchdog, forced dual-run or full rollback rehearsal. Current Work Offline safeguards remain until O03 parity. Proposed V3 origin `https://fishing.ginosega.workers.dev/fishing/` needs separate authorization.

**Evidence:** [D6 release issue #377](https://github.com/ginosega/fishing/issues/377); inspect live exact PR/CI/hosted/owner receipts independently at each milestone. Never promote source-only CI to deployed, complete RC or Live.

## Independent fishing equipment and editorial backlog

Open, closed and explicitly deleted personal fishing/gear/KB tasks remain discoverable at [FISHING_BACKLOG_INDEX.md](FISHING_BACKLOG_INDEX.md); do not absorb into V3 milestones or reopen silently.
