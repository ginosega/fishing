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
Evidence: [Audit procedure](SEMANTIC_AUDIT_SOP.md) and [validator](VALIDATION_RUNBOOK.md). Nov 25 Pacific milestone reconciliation: independently verified integration merge and CI, owner-reported deployment and field acceptance, and updated closeout gate. [Production receipt](https://github.com/ginosega/fishing/issues/377#issuecomment-7184493713). No independent weekly-audit claim.

## FISH-TODO-118 — Fishing Companion V3 continuation

State: in-progress
Owner: project owner / assistant implementer
Prerequisites: Default-main router and protected governance state; accepted requirements, technical design and bounded decisions; prior D5/private and D6/Stage A evidence verified; separate provider activation approvals retained.
Acceptance: Under [ADR-0011](decisions/records/ADR-0011.md) and owner-approved [ADR-0012](decisions/records/ADR-0012.md), preserve approved Gear/KB/Catch UX, anonymous published D1 records+Markdown and referenced media, explicit anonymous offline preparation (SEC-001), owner-only revision-safe authoring, one private R2 historical/new image store, unified Save, independently verified current-content Work Offline snapshots, safe drafts, reconciled data/media, Edge/Android acceptance and separate public cutover. **Full stable-ID scope and acceptance obligations: [FISH-TODO-118 consolidation ledger](FISH-TODO-118_CONSOLIDATION_SCOPE.md).** The original per-edit GitHub publishing pathway remains superseded.
Next safe action: **A01 backup/maintenance extension.** Design and implement one GitHub-hosted monthly + manual backup workflow reusing existing verified tooling; resolve public-content review, least-privilege credentials, consistency, failure/retention and separate approval gates before activation. Verify first remote recovery archive, document manual trigger and reusable owner-approved orphan audit/cleanup prompt; then complete exact local deletion proposal and final audit. See [consolidation ledger](FISH-TODO-118_CONSOLIDATION_SCOPE.md). [Owner direction](https://github.com/ginosega/fishing/issues/377#issuecomment-7199578926) · [Prompt scope](https://github.com/ginosega/fishing/issues/377#issuecomment-7199762162).

**A01.5 COMPLETE.** [Production field acceptance](https://github.com/ginosega/fishing/issues/377#issuecomment-7184493713): 23 PASS, 0 FAIL, two owner-waived Android cases. [Ledger](FISH-TODO-118_CONSOLIDATION_SCOPE.md) contains the source, CI and hosted evidence.

**A01.4 COMPLETE / PASS (Nov 25 Pacific).** Exact final private source `094155ec864af8fbbae375d7276abf03134fd2db`, 29/29 functional checks on parent, 10/10 targeted wording checks on final head, full CI PASS (415/415, audit zero vulnerabilities, verified build, Chromium 2/2). [Final CI receipt](https://github.com/ginosega/fishing/issues/377#issuecomment-7182487032) · [Detailed ledger](FISH-TODO-118_CONSOLIDATION_SCOPE.md).

**R01 — CLOSED / PASS.** R01 owner-reported provider and Android field acceptance PASS (2026-11-24 Pacific): exact owner-approved deletion of all 18 unreferenced images (including 11 historical originals and 2 R2-only objects), 16 D1 registry rows; 274 registered/physical R2 objects, 163100053 bytes, 287 associations, 276 paths, Gear 102/KB 60/Catches 14 unchanged. All retained SHA-256/bytes verified, zero missing/corrupt/orphan objects. SQL backup restore and 18 local image backups verified; corrected UTF-8 content identity `3a04520b341e69348030ede5127430219b4d6d2f18688034946e7bc82e3d8bc3` unchanged before/after. Earlier query-export CP437 discrepancy resolved with exact UTF-8 comparison; no live corruption. All six targeted Android tests PASS. [R01 owner disposition and final receipt](https://github.com/ginosega/fishing/issues/377#issuecomment-7147672233). No source/Worker/public deployment changes. Owner explicitly superseded retention of the eleven verified unreferenced historical originals; no general automated deletion authority. No automated GC, UI or extra infrastructure.

**O01 source-only exit (2026-11-22 Pacific):** App PR #567 `9534a633`, [CI](https://github.com/ginosega/fishing/actions/runs/45086501775) PASS 647/647. Coherent read-only D1/Markdown/R2 registry manifest; source only, no independent R2/provider proof. [Receipt](https://github.com/ginosega/fishing/issues/377#issuecomment-7088054611).

**D01 private functional acceptance: PASS.** Initial revision-aware draft Restore/Discard accepted on Windows and Android ([receipt](https://github.com/ginosega/fishing/issues/377#issuecomment-7093730903)); subsequent owner private testing also PASS for offline warning placement, Save denial, Cancel confirmation and preserved device draft ([L01 checkpoint](https://github.com/ginosega/fishing/issues/377#issuecomment-7124565706)). Preserve draft safeguards. Public V2 untouched.

**O02 owner receipt (2026-11-22 Pacific):** Private deployment and tests PASS; [receipt](https://github.com/ginosega/fishing/issues/377#issuecomment-7091119413), [CI](https://github.com/ginosega/fishing/actions/runs/45097701645) 688/688 at app PR #567 `0337f33f`. Hosted Worker/release IDs unavailable; owner-reported only.

**Standalone final V3:** L01 removes V2/FISH091 reader, cache reuse, upgrade detection and cleanup code. After production acceptance, separate owner-approved exact local cleanup across Android/Windows devices and profiles: obsolete installations, shortcuts, site data/caches and filesystem artifacts. Preserve drafts, production V3 offline data, necessary backup/evidence and unrelated files. [Expanded owner scope](https://github.com/ginosega/fishing/issues/377#issuecomment-7167347706) · [Ledger](FISH-TODO-118_CONSOLIDATION_SCOPE.md).

**Current owner-approved scope:** [ADR-0011](decisions/records/ADR-0011.md) owner-only direct D1 Save and [ADR-0012](decisions/records/ADR-0012.md) one D1/R2 content authority, revised verified Work Offline snapshots, plus [L01 Add/Edit parity and legacy UI cleanup](https://github.com/ginosega/fishing/issues/377#issuecomment-7106183933) before final V3 acceptance; private M01–M03 implementation and tests were separately authorized and owner-accepted. Under [owner's narrow M03 exception](https://github.com/ginosega/fishing/issues/377#issuecomment-7086996544), per-image opt-in inline Notes thumbnails are approved and accepted; blanket inline Notes conversion remains deferred under REL-007. This closes **only private M03**, not O01–A01 or future provider/public work. No generic publisher/watchdog or speculative service restarts.

**WP0 — ACCEPTED (2026-11-10 owner approval).** Owner reviewed [66-ID requirement matrix](FISH118_WP0_REQUIREMENT_MATRIX.md), [D5/D6 integration manifest](FISH118_WP0_INTEGRATION_MANIFEST.md), and selective draft PR dispositions. Accepted WP5 owner-operated testing on Windows Edge and Android (no iPhone test PASS claim; no removal of supported-platform scope); approved measured Gear-card baseline/numeric threshold determination during WP1, verified again in WP5. The historical ≤60s per-edit GitHub publishing gate is superseded for direct-D1 content Save by ADR-0011; code release verification remains required.

**WP1 — SOURCE-ONLY FRONTEND EXIT VERIFIED (2026-11-12).** Accepted D5 Gear/KB/Catch/Notes, Connection Status incl. Help & Diagnostics, original media/link/viewer, draft/offline guards, and absent sandbox handoff are integrated into the D6 production-root owner-preview. 30 WP1-owned requirement rows reconciled in [WP1 exit evidence](FISH118_WP1_EXIT_EVIDENCE.md). Final exact-head [draft #444](https://github.com/ginosega/fishing/pull/444) at `1fff918f1830d8fc9dcc24dbb111896c3875a3ff`, [CI #43157202532](https://github.com/ginosega/fishing/actions/runs/43157202532) SUCCESS: 38/38 WP1 Chromium/WebKit editor/denial/performance browser tests, 56/56 production browsers, full validation and merge-ready PASS, deploy jobs SKIPPED. Source-only acceptance is **not** a hosted writable RC or permission to merge app PRs. Explicit later verifications: production publication-cleared drafts (WP3/WP4) and physical offline/editor/external link and owner UX (WP5).

**Former WP3 H2/H3 and WP4 GitHub publisher milestones — STOPPED by owner architecture simplification.** The prior synthetic PR, scheduler, watchdog and Windows OFF-canary gate are not prerequisites. The direct Gear write/read/reload and migration have already passed in the existing private Worker. KB/Catches subsequently accepted; public V2 retired. Do not revive the legacy pathway.

**Historical WP1/WP2 evidence (2026-11-10–12 Pacific):** Source-only WP1 accepted at [draft #444](https://github.com/ginosega/fishing/pull/444) `1fff918f` [CI #43157202532](https://github.com/ginosega/fishing/actions/runs/43157202532) PASS; owner-approved editor/draft/viewer, security and mobile-browser checks are detailed in the [WP1 exit ledger](FISH118_WP1_EXIT_EVIDENCE.md), [issue #357](https://github.com/ginosega/fishing/issues/357) and [issue #341](https://github.com/ginosega/fishing/issues/341). Isolated owner read-only OAuth/canonical-source WP2 accepted at [draft #455](https://github.com/ginosega/fishing/pull/455) `77b8e182` [CI #43277247187](https://github.com/ginosega/fishing/actions/runs/43277247187) PASS; owner reported private Worker `f0849ef6`, unchanged Pages release `f43fb624`, authenticated main read and anonymous/write denial ([receipt](https://github.com/ginosega/fishing/issues/377#issuecomment-6833628839)). [WP2 exit ledger](FISH118_WP2_EXIT_EVIDENCE.md) preserves seven source-owned requirements. These were earlier bounded private/source checkpoints, not public V3, live per-edit GitHub publishing, app merge or current L01 field acceptance.

**Owner/production gates:** production deployment/field acceptance and approved resource/integration retirement complete; backup automation, separately approved credentials/permissions/merge/publication and local cleanup/final audit remain open. [Integration receipt](https://github.com/ginosega/fishing/issues/377#issuecomment-7183262869) · [Deployment/postflight](https://github.com/ginosega/fishing/issues/377#issuecomment-7183560520) · [Production field acceptance](https://github.com/ginosega/fishing/issues/377#issuecomment-7184493713).

**Evidence:** [D6 release issue #377](https://github.com/ginosega/fishing/issues/377); inspect live exact PR/CI/hosted/owner receipts independently at each milestone. Never promote source-only CI to deployed, complete RC or Live.

## Independent fishing equipment and editorial backlog

Open, closed and explicitly deleted personal fishing/gear/KB tasks remain discoverable at [FISHING_BACKLOG_INDEX.md](FISHING_BACKLOG_INDEX.md); do not absorb into V3 milestones or reopen silently.
