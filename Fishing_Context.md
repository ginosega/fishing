# Fishing Context

### Current V3 Notes Markdown editor implementation checkpoint

The owner explicitly approved the shared Gear, Knowledge Base and **Catch Notes** editor with **Insert image**, compact top **Preview Markdown**, full-page expansion, per-image viewer OFF by default and optional `"viewer: caption"`. The owner clarified that **Catch photos are prohibited only as representative top-of-page pictures**; photos IN Catch Notes are required and do not alter the Catch JSON schema or default Species image. Table lists support `- ...<br/>- ...` and `1. ...<br/>2. ...`; no general HTML. Original bytes use guarded private D4 GitHub blob stage, signed tickets and verified source/hosted bytes. **No deployed UX acceptance yet**, no production/public V3 cutover, no waiver of ≤60s text-only acceptance. See [the authoritative October 31 amendment](pwa/docs/Fishing_Companion_v3_Notes_Editor_Amendment_2026-10-31.md). Continue integrated V3 acceptance in Windows Edge and installed Android Chrome (not iPhone).


### October 31 checkpoint — V3 Connection Status owner sign-off

**Owner-approved October 31, 2026:** The V3 Connection Status screen's Alpine Mist dark mode and compact layout are **UX signed off**. Separate green/yellow actual-network dot, and the same blue/red publication tone as the header. Publishing Status is a native Help & Diagnostics-style disclosure, collapsed by default when the publication indicator is absent, expanded automatically for active publishing or verified Failed/Conflict, and manually expandable after success. Final Offline Library controls: label the one action **Prepare** until a selected offline library is verified Ready, **Update** thereafter, **Preparing…** while the download is active; **remove Reload from V3** because it only refreshes the browser page. Preserve V2's existing Reload and Update offline library behavior. **No deployment requested or performed for the final Offline Library wording change**; owner will inspect in the next integrated build. Alpine Mist's earlier private Worker deployment was owner-confirmed; rollout of the subsequent publishing disclosure change is not independently confirmed here. V3 draft PR #263 remains open/unmerged. This screen-level sign-off does **not** complete full Work Offline/installed Android acceptance, D6 sub-60-second real-publish validation, rollback testing, or separately required public production V3 cutover approval. Source change: [07ea986](https://github.com/ginosega/fishing/commit/07ea98683ceed66b0c735b9e590ed099f0241577).


### October 30 final source validation — V3 Connection Status redesign

**Final isolated source gate (October 30, supersedes preceding validation-pending language):** [GitHub Actions #41088642846](https://github.com/ginosega/fishing/actions/runs/41088642846) **SUCCESS** on exact application source commit `1bbce127be86525c02e6ad26f32ff08973bea038`. Evidence: **154/154 PWA**, **4/4 real Chromium isolated candidate**, **43/43 broker**, **763/763 private P3 publishing** tests; byte-verified local reader candidate and D3 Worker Wrangler packaging dry-run. The completed test includes the source-verified owner-only D1 latest-publication item summary and name sanitization. Earlier failing runs were caused by a stale removed-text browser assertion and an overbroad item-name cleanup regex; both were corrected and independently retested. **No private Worker deployment, no real signed-in owner UI field test, and no public V3 release/cutover.** V3 remains on draft [PR #263](https://github.com/ginosega/fishing/pull/263). The owner is continuing in the same conversation; do not initiate a new-chat handoff. Final next gate: owner Edge review of the newly built isolated reader layout; then deliberate private authenticated pilot build/deployment and Windows/Android owner acceptance of Account, server-backed latest Live item/time, and failure-recovery UI. The PWA device/hosting/speed/D6 gates remain open.

---

### October 30 V3 Connection Status UX redesign — owner-approved source in validation

Owner approved final six sections: Status, Mode, Offline Library, Account, Publishing Status, collapsed Help & Diagnostics. Minimal indicator: normal connection green/yellow with `Connection status: Online/Offline`; during owner publication blue with `Publishing: <step>`; confirmed Failed/Conflict red sticky with `Publishing failed`; never show reading mode or network details in publishing tooltip. Mode selection is solely via two pressed buttons; Retry only on mode control failure; offline update label **Update**. Account displays verified username `ginosega` after authenticated owner session (server maps exact GitHub ID), not email; anonymous sees Not signed in. Publishing section is permanent and shows latest operation after completion with item, change action and independently verified completion time sourced from owner-only D1 snapshot/operation; Check again only for uncertainty; Clear only for terminal failed/Conflict and never auto-republishes. Help & Diagnostics is collapsed, independent; special local reader identity in diagnostics only.

Code was developed on `feature/fish118-p3-mock-publisher` / [draft PR #263](https://github.com/ginosega/fishing/pull/263). D1 `summary(operationId)` binds owner/repo, hashes stored immutable request, reads guarded item details and final verified Live `updated_at`; D3 status GET appends safe summary without exposing cross-owner data. Existing authenticated session retains server authority; browser receives allowlisted username only for authorized owner. `v3-connection-experience.mjs` is presentation-only; original controller and gated owner polling continue operating in headless mode, with bounded GET status and no extra publisher. No public V3 cutover or private Worker deployment. Source/reader validation and real integrated owner field testing still required. No new chat requested.

---

### October 30 final D3/D5 global-indicator source checkpoint

**Final source checkpoint (October 30, supersedes earlier CI pointers):** The V3 owner publication indicator now keeps its step hover current **while Connection Status is closed**, using the existing authenticated, read-only 5-second polling path; only when a publication is active and the tab is visible, owner-authorized and online. Terminal Live/Failed/Conflict, hidden tab, offline or sign-out stop polling; no background publish/retry. Normal green/yellow still means physical browser connectivity even in Work Offline, blue is active publish, red is verified Failed/Conflict until explicit acknowledgement. [Isolated CI #41068451025](https://github.com/ginosega/fishing/actions/runs/41068451025) **PASS** at source `1ac38306ed8d7090ac6b874182c0e7c75b936c36`: **149/149 PWA tests, 43/43 broker, 760/760 private P3, 4/4 real Chromium, candidate byte-verified, Worker dry-run only**. The prior source CI's 154-case PWA output included seven FISH118-M workflow-lane cases not listed in this exact run; no test files were removed by this update. **No hosting/Worker/public V3 deployment**, no authenticated header color/hover device field acceptance yet. The owner remains in this chat. [Detailed D5 evidence](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/D5_Isolated_V3_Reader_Candidate_2026-10-29.md).

---

### October 30 D5 acceptance update and status ownership

**Supersedes the older pending Edge retest note above.** Owner's Windows Edge retests **passed** for Connection Status and original Markdown viewer on Banks Lake and Garmin motor. The new desired indicator does **not** track Work Offline preference: V2-compatible green/yellow reflect navigator online/offline; blue tracks the server-accepted owner publication's actual active step (with step hover); red tracks verified Failed/Conflict and persists until explicit acknowledgement or a verified state change. Authenticated owner publishing status is not shown to anonymous readers. Status-query failures do not falsely infer terminal failure or erase a known terminal failure. The app's current failure action clears local durable tracking only after authenticated server terminal confirmation; no blind replay or automated conflict overwrite.

**Source-only validation:** [CI #41067354331](https://github.com/ginosega/fishing/actions/runs/41067354331) succeeded for code `268018e65a0b6e786c21e9ec1027b12d1b46ec8f`: 154 PWA, 760 private P3, 43 broker and 4 real Chromium tests (all passed). The new indicator has NOT been field accepted on integrated owner-installed V3; neither public V3 nor a new private Worker version has been deployed. User remains in current chat; no handoff requested. Existing October 30 full context and all history are preserved below.

---

## CURRENT verified architecture and acceptance context — October 30, 2026

**Authoritative over older dated snapshots later in this document.** Actual public `main` was `a77e50f1fe296e3c16db18aa0fd5f9b17b7c95f4` at the audit; documentation-only work will advance that SHA without constituting a PWA deployment. Preserve all earlier detailed architecture, tackle, gear and user preferences below.

### Separation of public production, owner pilot and read-only development candidate

1. **Public V2:** `https://ginosega.github.io/fishing/`, GitHub Pages from `ginosega/fishing` `main`. It has anonymous reading, Gear/KB/Catch, verified release manifests and explicit complete offline library, existing generated WebP card thumbnails and original-quality detail images. The production workflow can deploy only under its existing main-only safeguards. The five root docs on `main` are authoritative; V3 feature branch root docs were previously stale and shorter.
2. **Private V3 authoring pilot:** Worker `fishing-auth-p0-test` at `https://fishing-auth-p0-test.ginosega.workers.dev/__d3_pilot__/` is owner-session gated and routes to isolated D1 `fishing-p3-sandbox` and GitHub sandbox `ginosega/fishing-p3-sandbox`, latest observed private main `c93da0a79ae37c243b6bd0f32f8cb9b484c5a40b`. It is *outside* the installed public `/fishing/` PWA service-worker scope. Only authorized owner private test publishing is established; no canonical public Live follows from this.
3. **V3 D5 reader candidate:** development-only `feature/fish118-p3-mock-publisher` / [draft PR #263](https://github.com/ginosega/fishing/pull/263), scope `/fishing/__v3_reader_candidate__/`, separate manifest/service worker/release hash. Compile-time `--v3-reading-mode --v3-reader-candidate` with explicit separate output opts in **read-only** controls. It has no private owner OAuth, D3 lifecycle, publisher, media staging, Cloudflare route or repository write. Its loopback-only server binds `127.0.0.1`, not a public route. It cannot be substituted for D3 installed-Android owner-session or future integrated V3.

### D1–D6 implementation/evidence boundaries

- **D1/D2:** architecture and protected private GitHub sandbox source/publisher foundation accepted. Do not rerun completed migrations or repeat a private publication merely to get status.
- **D3:** owner-only GitHub sign-in, private Gear/KB authoring and cross-device Android browser publication status were established; owner confirmed the private browser status message and Check publication status button on Android after correction. Draft source implements approximately 5-second gated read-only polling only while owner/authenticated/visible/in-progress; terminal, offline, hidden and signout suspension are required. Its current private deployment/device acceptance is not proved by draft source. **Installed Android Chrome V3 PWA** callback/return, session restoration, signout, and robust offline/online remain open.
- **D4:** private PR #31 Catch Add, #32 Gear image Add, #34 ordered Knot sequence Add, #35 Gear original image Replace, #37 Catch Edit demonstrated sandbox Live. The owner executed read-only remote D1 audit: **#35 Live, #36 Failed, #37 Live**, matching CI/merge evidence. **Failed #36 was denied by non-synthetic sandbox source validation and was never merged**; don't resubmit/replay it. Core D4 was functionally accepted with bounded gaps: independently fetched original-hosted bytes vs Git blob SHA, replacement of an existing multi-image Knot sequence, interrupted real-device upload, and private pilot thumbnail generation/usage are not proven.
- **D5:** isolated read-only candidate source includes explicit complete-verified Work Offline preference, zero routine network reads when selected, versioned SW CacheStorage, safe fail-closed missing/corrupt responses, local-image original Viewer, and strictly allowlisted Copy Diagnostics. User's earlier local Windows `npm.cmd test` at `57a598453a97cd28ee11e45b77f475b8098e30b1` passed **129/129**. The latest independently completed CI [#41012355230](https://github.com/ginosega/fishing/actions/runs/41012355230) at source `ff9dc182feb4e366ccad970a21955a79c313319e` passed **140 PWA, 43 broker, 760 P3, four real Chromium tests and immutable candidate build/byte checks**. This does not imply installed Android or user Edge acceptance.
- **Field gap (October 30):** in Windows Edge, user observed missing initial/reload Reading mode label, unchanged green header dot in Work Offline and no viewer activation for Banks Lake or Garmin Force Current Markdown. Source repairs paint initial/readback labels, blue Work Offline indicator (network separate), source/release identity, canonical URL matching including percent-encoded filenames. The *new owner Edge retest is pending*; a previous Work Offline selection may keep running old verified cached JS despite local rebuild.
- **D6 and `V3-SAVE-09`:** real canonical public normal text-only Gear/KB/Catch click→hosted-byte verified Live **≤60s** remains an independent hard acceptance gate with repeated runs, correctness, threat/rollback checks, installed Android integration, and **separate public-cutover approval**. Private PR #26 yielded 59s once, with D1 Accepted→Live 56s; not a stable production SLA.

### Live development workflow and evidence

- Draft source [PR #263](https://github.com/ginosega/fishing/pull/263), branch `feature/fish118-p3-mock-publisher`, last observed head `1933725237196c592a7451270fbc9df9fb828b72`; earlier exact tested source `ff9dc182feb4e366ccad970a21955a79c313319e`. GitHub records currently show draft PR #263 **unmergeable against main**; never resolve by automatically merging its application code. Draft [AUTH-P0 #262](https://github.com/ginosega/fishing/pull/262) still open; unrelated PR #268 **closed** as of this audit.
- Exact implementation/evidence documents on *development branch*: [D4/D5 Transition](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/D4_D5_Transition_2026-10-29.md) and [D5 Candidate/Owner Edge](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/D5_Isolated_V3_Reader_Candidate_2026-10-29.md). Separate D3 performance and owner-device reports remain authoritative for their dated stages.
- **Owner next:** stop prior loopback server (Ctrl+C), switch cached Work Offline to Automatic where possible, close old Edge InPrivate windows, pull the exact V3 development branch, build and byte-verify reader candidate into a distinct directory and serve from local `127.0.0.1:4173/fishing/__v3_reader_candidate__/`. Check initial label, selected-mode blue indicator/reload and both Banks Lake/Garmin original-image viewers, then share allowlisted diagnostics and source if still failing.
- **Authority/prefs:** owner pre-approves routine tests/source verification and asks for fewer pauses. Separate authorization for public production/site cutover, new hosting/routing/provider/credential/cost changes. No iPhone testing; Windows Edge/Chrome and Android Chrome/PWA matter. Avoid false deployment claims, fabricated hosted SHA or risky D1/GitHub mutation.

---

## NEW current context and private pilot — October 29, 2026

**Verified October 29, 2026, 10:48–10:50 AM PDT.** This is the authoritative new handoff checkpoint. Older dated "current"/"next" sections later in this file are HISTORICAL, not new work instructions.

- **Production/public V2:** `https://ginosega.github.io/fishing/` remains V2; **no V3 public cutover is approved or completed**. Latest inspected successful `main` production/content workflow [#40884357094](https://github.com/ginosega/fishing/actions/runs/40884357094) at source `ef8bc0c3c7302d408126de35c7c2e8163574af9f` (October 29), with `deploy-content` success. This handoff changes root Markdown only; do not re-deploy V2. Freshly recheck actual main, jobs and hosted release identity next chat.
- **Current isolated V3 branch:** `feature/fish118-p3-mock-publisher`, draft [PR #263](https://github.com/ginosega/fishing/pull/263), exact reviewed post-audit source commit `539023142b02210ad5aab728cf381ff2abb02968` (verify fresh). The separate AUTH-P0 feasibility [draft PR #262](https://github.com/ginosega/fishing/pull/262) remains open. Neither draft PR is a public V3 release. **Do not merge #263 into public main or deploy the V3 public app without separate user authorization.**
- **Private D3 pilot:** Cloudflare Worker `fishing-auth-p0-test`, owner-only route `/__d3_pilot__/`; authenticated entry: `https://fishing-auth-p0-test.ginosega.workers.dev/auth/start?return=%2F__d3_pilot__%2F`. Isolated D1 `fishing-p3-sandbox`; private GitHub sandbox `ginosega/fishing-p3-sandbox`. Local Windows checkout `$HOME\fishing-d2-deploy`; ignored deployed config `experiments/p3/preview/wrangler.d3-fast-webhook-enabled.local.jsonc` is **local only**, not checked into GitHub; leave it and production resources untouched until a guarded deploy is genuinely needed. GitHub webhook active, `Check runs` ONLY, SSL verification on; Worker signed webhook + durable named-operation alarm/watchdog + Cron recovery remain in place. Webhook merely wakes exact checked operation: it never grants CI/merge proof.
- **Performance, actual owner clicks:** PR #20 [129s](https://github.com/ginosega/fishing-p3-sandbox/pull/20) → PR #21 [72s](https://github.com/ginosega/fishing-p3-sandbox/pull/21) → PR #26 **59s** (first private ≤60s success; [PR](https://github.com/ginosega/fishing-p3-sandbox/pull/26), [CI #40924758753](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40924758753)). PR #26 exact operation `p3_23bf8ff9-c95b-40ba-9c1d-b4463b2e6489`; GitHub head `3591e7605090b08c8b4b717fe0faca9392320a5d`; squash merge `45f3d5da6aa797d01be61b3078585ea4449bcf91`. GitHub CI workflow created 10:48:01, success 10:48:13 PDT (12s). PR created 10:47:56, merged 10:48:27 PDT. The owner received signed webhook HTTP `202`, `{"ok":true,"accepted":true}`: the event successfully matched eligible Checking and armed wake, not independent CI proof.
- **PR #26 primary read-only D1 event audit:** Accepted **10:47:43** → Validating **10:47:44** (1s) → Checking **10:47:57** (13s Validating) → Merging **10:48:18** (21s Checking) → Deploying **10:48:31** (13s Merging) → Verifying **10:48:32** (1s) → **Live 10:48:39** (7s Verifying). Thus **56s Accepted→Live**, consistent with owner Save→Live 59s. All transitions have null error_code; read-only D1 result `success:true`, zero writes, primary WNAM/SEA. Compared with preceding #21, Checking fell 36s→21s, explaining 15s of the 13s E2E improvement. Earlier long merge delay fell 78s→14s→13s through safe original-lease independent read-only reconciliation; never retry ambiguous GitHub PUT /merge.
- **CI optimization shipped to *private sandbox only*:** PRs [#22](https://github.com/ginosega/fishing-p3-sandbox/pull/22) and [#24](https://github.com/ginosega/fishing-p3-sandbox/pull/24) merged. Pinned exact trusted validator `e75b6009f947b03568124ddf8d2c513a63c4025c` now fetched via blob-filtered sparse clone *including* required `pwa/contracts`, `pwa/src`, `pwa/tools` and lockfile. Full canonical and Git identity/head/base checks preserved. Synthetic content proof [PR #25](https://github.com/ginosega/fishing-p3-sandbox/pull/25) PASSED and was CLOSED WITHOUT MERGE. The duplicate `ready_for_review` triggered check was removed; `opened`, `synchronize`, `reopened` still run. No public V2 change.
- **Performance decision:** ≤60s Save→Live **provisionally met once** in the private pilot, with only **1s margin**. Do **not** declare it reliably achieved across repetitions, nor a public V3 SLA. Retain publisher telemetry, event-loss retry, idempotency/no-duplicate merge, exact-hosted-byte proof, and measure future owner publications. Detailed source audit: [D3 First Live Watchdog Provider Evidence](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/D3_First_Live_Watchdog_Provider_Evidence_2026-10-29.md).
- **Next work after chat transfer:** The owner approved upgrading V3 **Connection Status** to automatically refresh the **owner-scoped, read-only status approximately every 5 seconds** while an authenticated visible in-progress operation exists; keep the Check publication status button; stop at Live/Failed/Conflict, on hidden/closed screen, offline, or sign-out; resume safely, no overlapping requests, no duplicate publish, no flicker, cross-device Edge/Android test. Approval/acceptance specification is [D3 Owner Device Acceptance](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/D3_Owner_Device_Acceptance_2026-10-28.md). **This UX feature is not implemented or deployed.** Then finish integrated installed V3 Android PWA owner-session acceptance (browser pilot alone is not a PWA acceptance), broader reliability and cutover gates. User explicitly requested **chat transfer before beginning** these updates.
- **Workflow:** User has preapproved routine interim tests/workflows and favors uninterrupted progress without approval pauses, except credentials/new resources/cutover or actions truly needing consent. Remain in Chat mode by default. Never request secrets in chat or expose confidential bookmarks. Preserve the other open fishing/gear tasks in historical TODO and user purchase uncertainty.

**Architecture boundaries:** Public site V2 remains GitHub Pages, anonymous usage default, only owner signs in to V3, no catch photos or broad multi-user syncing; owner-created drafts/offline library requirements remain governed by approved V3 scope. D3 pilot's Android Chrome browser owner login/status and desktop Edge read-only status were verified; **installed V3 Android PWA integration is still NOT TESTED**. Preserve branch/source validation and the existing disabled-only/public guardrails. The private pilot test is not a public cutover.

---


## CURRENT CONTEXT — October 28, 2026 Fishing chat handoff

**GitHub snapshot Oct 28 (reverify in the new chat):** pre-handoff `main` = `daab53b72de8dcf749e5fbc76e2aca0884805dd4`; open [draft PR #262](https://github.com/ginosega/fishing/pull/262) (AUTH-P0), open [draft PR #263](https://github.com/ginosega/fishing/pull/263) (FISH118 P3/D3 isolated publishing, latest verified source head `8b8715afdf75120dbfa2d4a2ab2a1aec6956e9b7`, isolated source CI [#705](https://github.com/ginosega/fishing/actions/runs/40748114768) SUCCESS), and unrelated open [PR #268](https://github.com/ginosega/fishing/pull/268) (weight-section adjustment). **Do not merge draft #263 wholesale, edit unrelated #268, or assume draft-source CI is a production deployment.** The five-root-docs handoff is prepared on docs-only branch `docs/fishing-chat-handoff-2026-10-28`; after its eventual merge main will advance without updating hosted V2.

Production V2: [main Full Application run #672](https://github.com/ginosega/fishing/actions/runs/39990546320) succeeded October 23, 2026, source `4a1a8c44317b56a4d47e818db9cd2b5587a966d8`, verified hosted release `504d615b2bef361da06d655ee621d43a`, **577 hosted files / 100 Gear / 60 KB / 12 Catches**, GitHub Pages hosted-byte/release identity and browser validation passed. This hosted source is NOT the Oct 28 `main` commit; documentation/experimental work does not itself publish the site.

**Scope and authority:** FISH-TODO-118 Fishing Companion v3 retains the **October 19 approved requirements, technical architecture, UX and plan**, plus the **October 27 V3-SAVE-09 amendment**: routine valid text-only Gear/KB/Catch Save-and-Publish must reach independently publicly retrievable, SHA/hosted-byte-verified canonical Live **within 60 seconds measured from the owner's click** for every normal-operation acceptance run. No per-save human approval/signature, no false early Live, no skipped security/CI/merge/hosted evidence. Final public V3 cutover, material hosting/routing/permission/cost changes require distinct consequential approval. The owner preapproves *routine interim verification/workflows* and prefers few checkpoints; never interpret that as permission for cutover or bypassing required protections.

**D3 private pilot:** Owner-only test origin `https://fishing-auth-p0-test.ginosega.workers.dev`, pilot route `/__d3_pilot__/` (OUTSIDE installed `/fishing/` PWA scope). Both sandbox Gear and Knowledge Base samples became **Live · sandbox verified**. KB operation `p3_5527208d-a67c-4a2c-876d-9edaee353bc8`, private [PR #18](https://github.com/ginosega/fishing-p3-sandbox/pull/18), exact merged/main SHA `97f68efc932084f2e607480c12cee37a94f81758`, verified release ID `1dcb68bab0f88638b009d3ce13d69426`. Owner ran a **read-only remote D1 audit** PASS: seven transitions `Accepted → Validating → Checking → Merging → Deploying → Verifying → Live`, no replay/manual D1 edit. Recovery fixed missing GitHub App PR merged/SHA summary data using GET merged-status 204 + exact private-main/commit-tree/parent/file evidence. No new publication required. [D3 acceptance and performance report](experiments/p3/preview/D3_Acceptance_And_60s_Delivery_Evidence_2026-10-28.md).

**Real Android Chrome owner pilot:** Signed-out private page showed Not Found (expected), GitHub OAuth silently reused authorization and opened owner pilot, `P3 Test Lake` KB contents survived reload, and Sign Out action worked. An initial **cross-device publication-status bug** (PC/Edge had local receipt; Android did not) was fixed by an authenticated read-only owner/repository-scoped latest D1 operation endpoint + safe browser discovery. Owner explicitly confirmed the **publication status message now shows and Check publication status works on Android**; draft source tests #705 passed, and the private pilot fix was deployed. Exact post-fix Worker version was not supplied—inspect it if needed. This closes that defect but is **NOT installed Android V3 PWA acceptance**. [Device evidence](experiments/p3/preview/D3_Owner_Device_Acceptance_2026-10-28.md).

**60-second blocker:** nine successful existing `main` content-only GitHub Pages Actions runs took **85–183 seconds from Actions run creation to hosted verification**, *before* Save click/PR/check/merge. Current five-minute Cron cannot be the normal driver; removing Cron alone cannot make the present Actions/Pages path compliant. Evaluate isolated event-driven progression + durable recovery-only Cron, instrument real click-to-public-proof timings, and benchmark (A) minimized but fully verified Pages lane vs (B) versioned same-origin verified-content delivery sourced from authorized canonical GitHub commits. Candidate B requires separate approval for material production routing/hosting; no synthetic sandbox Live substitution. See D3 report. Do not claim V3-SAVE-09 satisfied.

**Next actions after new-chat restore:** Reverify `main`, open PRs, latest successful Pages hosted evidence and private pilot status. Continue inside existing finite **D1–D6** delivery sequence, not more `P3-N` submilestones. D3 remains OPEN only for remaining private owner/device negative/session edges (post-signout direct-route denial, relaunch/re-auth, wrong-owner/anonymous and conflict reliability evidence) and **integrated installed Android Chrome V3 PWA** OAuth/session/status acceptance; browser-tab pilot cannot close PWA gate. Work through real 60-second public delivery architecture/measurements before production cutover. Do not repeat already verified KB PR #18, rerun migration or ask for approvals already granted. Do not invent asynchronous work. Keep V2/gear/KB/Catch and non-V3 equipment TODOs intact.

**Other active fishing work:** Preserve FISH-TODO-008 RVR119 under-seat tray backorder, -014 KastKing box, -040 Garmin Force Current/Redodo 24V 50Ah commissioning and removable 40A protected kayak wiring, calibration/functional testing, storage bin foam; retain all other still-open tackle/research/KB tasks. New October 26 completed kayak wiring report does NOT establish motor on-water commissioning. Do not infer purchases or completion.

**Context priority:** Use this dated Oct 28 checkpoint over Oct 21/Oct 19 P1-not-started wording below. Validate new live state on continuation.

---


## CURRENT engineering state — Oct 26–27, 2026: verified D3 sandbox pilot homepage

**Authoritative transfer checkpoint; all older "CURRENT/NEXT" sections below are historical and must not override this one.** This is a docs-only snapshot; re-check actual GitHub branch heads, CI and Cloudflare status in the next chat. Date of owner's latest successful test: October 26, 2026 PDT (late evening).

**Project and source:** `ginosega/fishing` public canonical `main` was `0c7d70e280d44f3ec484d427b6888397ffcd621b` immediately before this handoff branch. `ginosega/fishing-p3-sandbox` private `main` was `89be79a9c933dd36bd909edd585091232831c835`. V3 implementation lives on [open DRAFT PR #263](https://github.com/ginosega/fishing/pull/263), whose latest known documentation-checkpoint head is `db0c4e4d85ff50629335c3da537580ade6747494` after the D3 deployment receipt; the last independently verified **source CI #610** [succeeded](https://github.com/ginosega/fishing/actions/runs/40445715656) on earlier source head `0a383a23a1b49acd99e46e612ac4770ee7c9eb24` with Windows LF/CRLF parity, strict-CSP/Ajv schema parity, no-eval browser bundle, PowerShell syntax and Wrangler dry-run. The later PR head is documentation-only; refresh exact-head CI as needed. AUTH feasibility [draft #262](https://github.com/ginosega/fishing/pull/262) and unrelated [#268](https://github.com/ginosega/fishing/pull/268) remain open, untouched. Never wholesale merge #262/#263 or disturb #268.

**Live Worker—owner-executed, verified, DO NOT DEPLOY AGAIN:** `fishing-auth-p0-test` at `https://fishing-auth-p0-test.ginosega.workers.dev`, currently **`91f601dd-b960-4f7b-91e7-01abd0399030`**. The user executed the once-only strict-CSP repair at pinned draft source `0a383a23a1b49acd99e46e612ac4770ee7c9eb24` with Wrangler 4.153.0. Logs show `SAFE_CSP_REPAIR_VERSION: 91f601dd-b960-4f7b-91e7-01abd0399030`, passes for preserved original `DB=fishing-auth-p0` and `OPERATIONS_DB=fishing-p3-sandbox` D1 bindings, anonymous private route denials, publication OFF, zero Cron and byte-identical public Fishing V2 HTML. Strict CSP is retained; Ajv validators compile **at build time**, and Windows line endings are normalized **in memory**. Pilot bundle 277633 bytes, SHA-256 `72b5b70fdd52fcf9f08cf18bac9c56ec342265d299aefbf70d2bd708a5503b9b`. `D3_PILOT_ENABLED=true`, `D3_READ_TOKENS_ENABLED=true`; `D3_WRITE_ENABLED=false`, `D3_RUNNER_ENABLED=false`, `D3_TEST_HOST_ENABLED=false`, and all D2 write/runner/read/test-host flags false. Existing encrypted credentials unchanged. No D1 migration, private GitHub write, public-main application mutation or public V3 cutover occurred. Older Worker versions `218ecd67-d00e-4fe8-b686-886034654418` (pre-CSP) and `56f775f6-ca91-464e-be9b-40ec2bed40e6` (hard-off) are historical rollback references, not the current version.

**Observed browser progress, narrowly construed:** The user's Windows Edge screenshot of `/__d3_pilot__/` shows the authenticated and **fully styled private sandbox homepage** with warning banner, site header, connection-status indicator, hero artwork, and **My Gear**, **Knowledge Base** and **Catch Log** tiles. Owner confirmed “That worked.” The previous HTTP 401 for cross-site OAuth document navigation, CSP `unsafe-eval` Ajv initialization failure and blocked inline style were addressed. **DO NOT call all D3 read-only acceptance complete from this screenshot.** Yet unverified: opening Gear and seeing `P3 Test Rod D2 Verification`; opening KB and seeing `P3 Test Lake` with synthetic fixture notes; Catch Log displaying **zero** sandbox catches; Connection Status displaying authenticated owner; no Add/Edit/Save and Publish controls on all pages. The screenshot does not show these screens. Also verify correct sandbox rather than public V2 collection, no console errors and that browser refresh/session restoration work. Do not replay successful deployments for this verification.

**Public production is still V2**, not that sandbox pilot: latest separately verified public Pages workflow [#672](https://github.com/ginosega/fishing/actions/runs/39990546320), release `504d615b2bef361da06d655ee621d43a`, **577 files / 100 Gear / 60 KB / 12 Catches**. It was preserved byte-identical after the CSP repair. V2 stays anonymous-first with its existing editor/offline behavior. D3's standalone owner-only pilot is outside the installed `/fishing/` PWA service-worker scope; **do not count Windows pilot success as Android installed-PWA acceptance**.

**Finite V3 delivery status:** D1 architecture/design approved COMPLETE; D2 one real sandbox Gear edit/publish end-to-end COMPLETE; D3 owner sign-in and private read-only pilot *partially accepted* (homepage only), Gear/KB one Save and Publish with real private GitHub PR/CI/merge/hosted bytes and Windows/Android PWA integration **still in progress**; D4 media + Catch Add/Edit NOT complete; D5 offline preferences, Picture Viewer, stability NOT complete; D6 final end-to-end acceptance/rollback/public cutover NOT complete. No new numbered P3 micro-milestones. D2 private operation `p3_343ef7ba-1c87-4d5d-a2ad-92e91eab420f`, sandbox PR #16, merged main `89be79a9c933dd36bd909edd585091232831c835`, verified hosted bytes and one-time reconciliation are COMPLETE—**never re-submit/reconcile/replay**.

**Exact next action:** after refreshing GitHub/Cloudflare read-only inventory, finish **browser-only D3 pilot acceptance** on Gear, KB, Catch Log and Connection Status, including no authoring actions or public V2 data leakage, without a deploy. Then continue D3 gated owner Gear/KB publication and integration in draft #263, keeping any App-write, Worker writer/runner/Cron, first new sandbox writes and final public product cutover behind explicit consequential authorization. The owner pre-approves routine source edits/isolated CI and dislikes internal checkpoint interruptions; preserve false/off gates and source protections until their specific authorization.

**Full-chat handoff SOP:** The owner copies the **entire** canonical `Fishing_New_Chat_Bootstrap_Prompt.md` from fresh `main` into the new Fishing chat, not a shortened summary. At new chat start, read the complete five main files in order `README.md`, `Fishing_Context.md`, `Fishing_TODO.md`, `Fishing_Decision_Log.md`, `Fishing_New_Chat_Bootstrap_Prompt.md`; then the full D3 checkpoint at [draft PR #263](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/D3_OWNER_AUTHORING_START_2026-10-26.md). Preserve all other fishing/kayak/Force Current/storage/charger/equipment purchases and KB TODOs recorded below without inferring closures.

---


## CURRENT engineering context — October 26, 2026: D2 complete and parked; D3 next

**Authoritative latest checkpoint; all October 25 `D2 IN PROGRESS` and October 24 `NEXT P3-N` instructions below are HISTORICAL.** New chats must read the five root handoff files from the **actual latest `main`**, recheck live GitHub/host status, then resume D3; do not assume the SHA below remains current after this documentation PR merges.

**Verified GitHub before the documentation merge:** public `ginosega/fishing` `main` `64503470a2db7364a437b5e1eb0f4c120da61644`; private `ginosega/fishing-p3-sandbox` `main` `89be79a9c933dd36bd909edd585091232831c835`; FISH118 development [draft PR #263](https://github.com/ginosega/fishing/pull/263) exact head `4fdc75bb77dd5452b61866d1401c573569e130f2` with [isolated source CI #467](https://github.com/ginosega/fishing/actions/runs/40349790051) **SUCCESS**. Owner-approved AUTH-P0 feasibility [draft PR #262](https://github.com/ginosega/fishing/pull/262) remains unmerged. Unrelated [PR #268](https://github.com/ginosega/fishing/pull/268) must be preserved. These experimental branches are NOT wholesale production merge candidates.

**Public V2 remains the live Fishing Companion.** Latest successful production `main` workflow was [#672](https://github.com/ginosega/fishing/actions/runs/39990546320), source `4a1a8c44317b56a4d47e818db9cd2b5587a966d8`, hosted release `504d615b2bef361da06d655ee621d43a`, **577 hosted files / 100 Gear / 60 KB / 12 Catches**. Documentation updates do not constitute V3 rollout. FISH115–117 v2 fixes remain released; FISH108 still governs content vs application release lanes. Confirm latest hosted release independently if source/deploy state changes.

**D1: completed** at approved architecture/design level. The fixed six-deliverable roadmap remains **D1–D6**, never new open-ended P3-numbered milestones. **D2: COMPLETE** end-to-end for a single owner-authenticated, sandbox-only Gear text edit. D1 operation `p3_343ef7ba-1c87-4d5d-a2ad-92e91eab420f` reached `Live`, `reason_code=NULL`, GitHub [private sandbox PR #16](https://github.com/ginosega/fishing-p3-sandbox/pull/16) merged, exact-head [workflow 40288266980](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40288266980) passed, merge SHA `89be79a9c933dd36bd909edd585091232831c835`, verified hosted-byte release ID `73362eb77bd59219aa6f78fb93e9d47b`. A successful GitHub merge briefly lacked its D1 receipt (`merge_attempted`); the **one-time, exact-match read-only-proof-based reconciliation already succeeded**, after which Cron reached Live. **Never resubmit this operation or rerun reconciliation**. Full [D2 verified closeout](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/D2_SANDBOX_VERIFIED_CLOSEOUT_2026-10-26.md).

**D2 Cloudflare test Worker safely PARKED by owner.** `fishing-auth-p0-test` at `https://fishing-auth-p0-test.ginosega.workers.dev`, deployed version `82b678b2-b024-4428-922c-d2363f2bcbc2`: `D2_WRITE_ENABLED=false`, `D2_RUNNER_ENABLED=false`, `D2_READ_TOKENS_ENABLED=false`, `D2_TEST_HOST_ENABLED=false`; deployed triggers have **no Cron**. Existing `DB=fishing-auth-p0` and `OPERATIONS_DB=fishing-p3-sandbox` bindings remain, and verified D1 data is retained. Do not redeploy or reactivate D2 for the next chat; this shutdown is complete. No public canonical source was changed by this experiment.

**D3: IN PROGRESS, not deployed or accepted.** The D3 source work is on draft #263: `experiments/p3/preview/src/d3-authoring-client.mjs` (same-origin session/CSRF and durable receipts), `d3-publication-lifecycle.mjs` (original idempotency key, no silent retries or storage of packages/credentials, status persistence), `d3-trusted-gear-kb-candidate.mjs` (sandbox-only source-aware text Gear edits and KB adds/edits, canonical/Markdown/conflict safeguards); gated opt-in `publishChange` in `pwa/src/editor.mjs`, and opt-in owner-authoring restrictions in `pwa/src/ui.mjs`. Production app `pwa/src/app.mjs` **does not activate `ctx.v3`**. The real trusted GitHub reader, generic sandbox Gear/KB PR/runner, same-origin Connection Status sign-in UI and end-to-end D3 tests **are not yet implemented or deployed**. D3's earlier isolated test failure was fixed; exact-head **CI #467 passed**. [D3 checkpoint](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/D3_OWNER_AUTHORING_START_2026-10-26.md).

**NEXT ACTIVE WORK:** Finish **D3**, without an approval stop for routine source/CI work: implement a trusted immutable private-sandbox snapshot loader, securely connect source-aware Gear/KB add/edit candidate to guarded idempotent D1 + GitHub PR/check/merge + actual hosted proof, implement Connection Status-only owner sign-in/restore/Sign out and real `Save and Publish` UI with durable status after navigation, verify anonymous/unauthorized/deep-link denial, conflict/expired/offline/ambiguous-save behavior, and run Windows + Android installed-PWA integration tests. Keep privileged runtime gates off until specific live authorization/security checks; do not expose private tokens. Move next to **D4** uploads and Catch editing, **D5** offline/Connection Status/viewer/release reliability, **D6** integrated acceptance and separately approved production cutover. The owner approved using intended production Cloudflare infrastructure rather than building a separate preview website, accepts temporary downtime, but **not public-main writes, bypass, data loss, unverified Live claims or an unapproved final cutover**. No new per-save owner signing ceremony.

**Other Fishing work:** Do not discard existing unresolved equipment, kayak/Force Current commissioning, purchase availability, catching and KB items elsewhere in this file and `Fishing_TODO.md`. Do not infer purchases, silently close active items or reopen completed v2 releases. The user requested this complete GitHub-based transfer and will copy the **entire canonical Bootstrap prompt**, not a short substitute.


**Implementation seam for next chat:** source-only D3 candidate validates `gear` and `kb` packages against an injected canonical snapshot but cannot yet independently fetch/verify GitHub tree/blob identities or commit any edits. Previous D2 PR adapter strictly allows only `gear/p3-test-rod` and a single `pwa/Gear/gear.json` change; do **not** weaken that adapter's constraints just to make the D3 tests pass. Port/rework it behind owner GitHub session + CSRF, exact immutable repo/main snapshot verification, D1 idempotency/lease receipts, scoped GitHub App installation credentials, normal PR/check/merge and hosted proof. Owner edit UI is gated but not wired to the real same-origin boot context. Address this gap first rather than generating any new P3 milestone or silently enabling generalized writes. Final D3 acceptance demands authenticated owner Gear and KB Add/Edit, actual hosted sandbox bytes, durable status on return, real Android installed-PWA navigation, and negative security cases.

**Operational path:** the owner's Windows checkout for authorized Wrangler commands is `C:\\Users\\ginos\\fishing-d2-deploy\\experiments\\p3\\preview`. Prior local Wrangler 4.153.0 deployment of parked Worker was successful. Never claim this local filesystem can be accessed directly from the GitHub connector or this chat. Avoid asking for interim approvals; only request a user-operated Cloudflare command when actually necessary, with error stops. The approved full-handoff convention is to update the five root Markdown files on `main` via an eligible **documentation-only PR** and then direct the owner to copy the entire Bootstrap prompt from current main.


## HISTORICAL engineering context — October 25, 2026 PDT: finite V3 delivery, D2 in progress

**Supersedes October 24 P3-29 and all earlier “current” sections below.** Restore the full project from actual GitHub, not the old P3-30 or R2 instructions.

**Verified before this documentation handoff (October 25, 2026 PDT):** public production main was 587b978118df64cc9ec584375c458fa2b10fecfa; private ginosega/fishing-p3-sandbox main was 69b236c8af663cdce687dc855bb117a01874060a; public draft [PR #263](https://github.com/ginosega/fishing/pull/263) was OPEN, DRAFT at f2673d2c3fc343c8ebce44c0e306429c8be387ab; owner-accepted AUTH-P0 [PR #262](https://github.com/ginosega/fishing/pull/262) was also OPEN/DRAFT; unrelated [PR #268](https://github.com/ginosega/fishing/pull/268) remains open and must be preserved. After this docs-only PR merges, re-read GitHub main/PRs/hosted deployment to establish NEW exact SHAs; these are pre-handoff observations.

**Actual live V2 application:** latest verified full Pages release remains [main workflow #672](https://github.com/ginosega/fishing/actions/runs/39990546320), source 4a1a8c44317b56a4d47e818db9cd2b5587a966d8, release 504d615b2bef361da06d655ee621d43a, 577 hosted files (100 Gear, 60 KB, 12 Catches). A documentation-only main merge does NOT publish a V3 build or establish a new release; verify this independently after merge. FISH115–117 remain released; FISH108 governs eligible content-only changes.

**Approved V3 experience:** anonymous access by default; only one owner signs in via a discreet link inside Connection Status; valid session restored automatically; Gear/KB/Catch Add/Edit; ONE Save and Publish without per-item approval/signature, source-aware conflict protection, direct Gear/KB/Knot image uploads (original bytes preserved), Catch without photos/GPS, Markdown Picture Viewer, persistent Automatic/Work Offline reading preference (NO offline publishing queue), honest Accepted/Live states, optional local drafts only if reliable, release coherence, accessibility and Android/Windows acceptance. The October 19 requirements, technical design and UX remain signed off; October 22 AUTH-P0/G1 feasibility accepted with documented seven-day-cookie/revocation/untested security/iOS exceptions, NOT broad V3 security waivers. Per-change owner ECDSA and independent attestor P3-40/41 are optional research and conflict with normal Save and Publish if made mandatory.

**Finite delivery roadmap approved October 25:** STOP generating open-ended P3-N milestones. D1 architecture consolidation is COMPLETE at design level; D2 real sandbox publishing is IN PROGRESS; D3 owner sign-in and Gear/KB editing UI; D4 integrated media and Catch editing; D5 offline/Connection Status/viewer/reliability; D6 final acceptance and production rollout. [Finite D1–D6 plan](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/FISH118_V3_Finite_Delivery_Reset_2026-10-25.md), [D1 selected architecture](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/D1_V3_Architecture_Consolidation_2026-10-25.md), [signed-off requirements audit](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/D1_V3_Requirements_Compliance_Audit_2026-10-25.md). The owner APPROVED **production-first** development on the intended Cloudflare production host, accepting downtime, and explicitly declined a separate preview WEBSITE; first GitHub test WRITES must still target ONLY the private sandbox repo and isolated test paths/data, never canonical public main. Temporary downtime is acceptable; data loss and false Live claims are not.

**D2 latest source recovery:** After a previous assistant turn was interrupted, the draft retained ~30 source commits. [D2 recovery, durable merge barrier and real-operation gate](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/D2_Interrupted_Run_Recovery_and_Operational_Gate_2026-10-25.md) reconciles them. D2 now has AUTH-P0-compatible session+HMAC CSRF guarded API, D1 Accepted/idempotency/status, Worker-compatible private sandbox immutable source-aware Gear edit validator, read-only Pages gateway, sandbox-scoped App token adapters, draft PR / exact-head checks / normal merge adapters, isolated test-asset loader, default-OFF scheduled coordinator and a **durable D1 markMergeAttempt write-ahead barrier**: ambiguous GitHub merge outcome must never be blindly retried. The latest [exact-draft CI #40221266389](https://github.com/ginosega/fishing/actions/runs/40221266389) on f2673d2c3fc343c8ebce44c0e306429c8be387ab passed **518/518** (80 PWA + 43 broker + 395 P3), including disabled Worker bundling/parity; this is **SOURCE-ONLY CI**. No live Cloudflare V3 publisher, Cron integration, real App/GitHub write, merged sandbox Gear change or actual production-origin hosted test bytes yet.

**D2 completion criterion and immediate next work:** Deliver ONE genuine owner-authorized private sandbox p3-test-rod Gear edit → durable D1 Accepted → immutable source-aware checks → sandbox draft PR → true latest-head validate-sandbox-head CI → normal merge with protections → byte-identical test-only asset served and verified at an isolated path on the intended production Cloudflare origin. Capture PR/base/head/check/merge SHA, release bytes/digest, persisted status and rollback. No second preview website. First conduct exact read-only provider/runtime inventory (App installed grants, private repo rules, current Cloudflare bindings/quotas, origin/service-worker behavior). Then require one **consequential owner approval** before provisioning/moving GitHub App PEM, binding secret/D1/cron, enabling write-capable Worker/route or making the first real sandbox write. Existing connected GitHub tools do not provide Cloudflare control-plane access; user may have to perform approved Cloudflare steps in their UI/terminal. Do NOT falsely label D2 COMPLETE because 518 tests passed. Continue D2 to its real finish line rather than pausing at routine internal source checkpoints.

**Operational safety:** Existing isolated D1 migrations R1–R4 were completed/reconciled (last verified seven tables, four indexes, five triggers; application tables empty at that time); do not reapply or restore them or expose a private recovery bookmark. The P3 command bridge and Access ingress Workers remain hard-disabled/unrouted with production/preview URLs OFF at the last verified postflight [#40166553523](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40166553523). The live [GitHub-signed OIDC proof #40207347824](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40207347824) verified only its exact read-only manual workflow, not a future privileged publisher. Historical Access/App metadata evidence is not a deployed publishing proof. GitHub App PEM has write-capable authority; never place it in public source, logs, browser or GitHub Actions merely for convenience.

**Other project context unchanged:** Preserve FISH-TODO-040 owned Bonafide RVR119/Garmin Force Current/Redodo 24V50Ah motor, wiring, charger connectors and foam case commissioning; FISH-TODO-008 under-seat tray unpurchased/backordered; FISH-TODO-014 KastKing deep-box watch, all other OPEN Gear/KB/fishing projects and scientific evidence standards. No assumed purchase or closure.

**New-chat handoff SOP:** This update is a **docs-only branch → PR → required GitHub checks → merge to public main**, never a V3 deployment. Update/reconcile all five root files: README.md, Fishing_Context.md, Fishing_TODO.md, Fishing_Decision_Log.md, Fishing_New_Chat_Bootstrap_Prompt.md. The owner opens the **full canonical Bootstrap Prompt on main and copies its ENTIRE contents**, including historical sections, into a new Fishing chat. No short handoff substitute. Historical headings below remain archival and any old “NEXT P3-30/R2” statements are SUPERSEDED.

---


## HISTORICAL engineering and fishing context — October 24, 2026 PDT (P3-29 fully closed)

The prior "Latest engineering context" and P3-18 R1/R2 gate below are **historical**. They do not supersede this verified checkpoint.

**Production and repository boundary (verified October 24 PDT / October 25 UTC):** public `ginosega/fishing` main was `3a3ea08057964f81d32375fe3e90503bcd9f0383` before this documentation-only handoff. The latest successful **actual hosted** production application remains [Full Application workflow #672](https://github.com/ginosega/fishing/actions/runs/39990546320), source `4a1a8c44317b56a4d47e818db9cd2b5587a966d8`, release `504d615b2bef361da06d655ee621d43a`, **577 hosted files / 100 Gear / 60 KB / 12 Catches**. Later Markdown-only commits are *not* PWA releases. Current open PRs include unrelated [#268](https://github.com/ginosega/fishing/pull/268) (weight-section changes; preserve untouched), [#262](https://github.com/ginosega/fishing/pull/262) (P1 AUTH-P0, **DRAFT/UNMERGED**), and [#263](https://github.com/ginosega/fishing/pull/263) (FISH-TODO-118 P3, **DRAFT/UNMERGED**). Always recheck fresh main, open PRs and hosted evidence in the new chat.

**P3 sandbox and migration status:** private `ginosega/fishing-p3-sandbox`, repository ID `1430581407`, owner GitHub ID `265665562`, main after postdeployment lockout `bf9bf2f4b4c0e1dc347cdd2bab58b28f1dc69d05`. Isolated Cloudflare D1 `fishing-p3-sandbox` migrations **R1–R4 completed, reconciled** (7 tables, 4 indexes, 5 triggers); application tables were empty at the last confirmed checkpoint; **no authorized live application writes** since. Preserve private recovery bookmark and all secret values privately; never paste them into chat or GitHub. **Do not resume the historical R2/R3 approval step, rerun migrations or restore D1.** The separate public preview sentinel is read-only/anonymous: `/health` previously `{ok:true,ready:false,mode:"preview-no-publishing"}`; `/session` unauthenticated.

**Hard-disabled Workers and Access (verified):** `fishing-p3-command-bridge-sandbox` is the earlier isolated static-503 command sentinel, no public Production/Preview URLs, isolated D1 + encrypted HMAC bound but both `P3_WRITE_ENABLED=false` and `P3_COMMAND_BRIDGE_ENABLED=false`; independent [command postflight #40133925321](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40133925321) PASS. **`fishing-p3-access-ingress-sandbox`** is separately deployed with pinned **static-503 `ingress-disabled`** code, no D1, service binding, secret or route; exactly three plain-text false flags (`P3_WRITE_ENABLED`, `P3_INGRESS_ENABLED`, `P3_COMMAND_BRIDGE_ENABLED`), Production and Preview URLs **OFF**. Owner-approved [deploy #40165892787](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40165892787) and independent **fresh read-only [postflight #40166553523](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40166553523)** PASS. The separately cancelled run [#40165850415](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40165850415) stopped before its deployment step. The Wrangler deploy reported success and remote *settings* were verified; **remote script bytes were not independently retrieved/hashed**. Private [PR #15](https://github.com/ginosega/fishing-p3-sandbox/pull/15) retired the one-shot deploy workflow; only read-only `preflight`/`postflight` remain, default `postflight`. Keep both Workers unrouted and hard-disabled.

**Cloudflare Access trust:** exact ingress hostname `fishing-p3-access-ingress-sandbox.ginosega.workers.dev` protected by app `Fishing P3 Sandbox Ingress`, sole **Service Auth** policy `Fishing P3 GitHub Runner Only`, dedicated `Fishing P3 Sandbox GitHub Runner` service token, no Allow/Bypass/other identities. [Access metadata proof #40162761115](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40162761115) PASS; [live benign Hello World edge proof #40163736773](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40163736773) PASS (anonymous and invalid token denied 401/403; dedicated service token reached inert Hello World 200). That live test was **before** static-503 deployment, and does **not** prove active command ingress, service binding or D1 writes. Separate account/worker-scoped encrypted GitHub Actions tokens remain confidential; never request or expose values.

**Current decision and next work:** **P3-29 CLOSED** with fresh postflight. P3-25 HMAC trusted client / private transport seam, P3-26 Access RS256 JWT verifier and proposed command ingress, and native D1 acceptance are **source-tested only in draft PR #263**, not attached to deployed ingress. P3-29 approval covered *only* the disabled 503 deploy and is exhausted. **Next prospective P3-30 = source/design/security review only**, including actual Access issuer/AUD/service-token `common_name` verification, pinned-domain JWKS retrieval/rotation, GitHub owner/App provenance, exact HMAC URL/path, authenticated private Worker service binding, failure recovery and minimal permissions; any deployment, flag change, remote `Accepted` D1 write, synthetic PR, merge or publishing requires a fresh explicit approval. Do not activate `P3_WRITE_ENABLED`, `P3_INGRESS_ENABLED`, or `P3_COMMAND_BRIDGE_ENABLED`, deploy command-capable code, alter existing preview/Workers, merge PR #262/#263, or change production without separately scoped approval. Approved v3 requirements/design/UX/staged plan and October 22 AUTH-P0/G1 acceptance-with-waivers remain binding; preserve FISH108 release lanes and other unrelated tasks.

**Canonical supporting evidence:** [P3-29 final deployment and lockout report](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/P3_29_Disabled_Ingress_Deployment_2026-10-24.md) and [detailed P3 handoff](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/P3_29_New_Chat_Handoff_2026-10-24.md) exist only on unmerged draft PR #263, **not main**. The reviewed immutable disabled-ingress source is commit `5df060076ca3cd010727fc9162b33bf03c157790`, blob `8f28f4e1d610fe549388308223bf3e6aa58af1a7`; CI source [#40164090871](https://github.com/ginosega/fishing/actions/runs/40164090871) passed 327/327. Re-read these documents only for detailed P3 evidence; the **five canonical root markdown files** are the transition authority after this docs-only reconciliation.

**Continuing non-v3 work:** FISH-TODO-040 remains an active owned Garmin Force Current / Redodo 24V50Ah motor, pedals, charging/commissioning and removable RVR119 case/foam project. Existing owner-purchased motor, pedals and battery are not awaiting purchase. FISH-TODO-008 remains an unpurchased/backordered Bonafide RVR119 under-seat tray, FISH-TODO-014 KastKing deep-box watch remains open, and other fishing/gear/KB research/authoring TODOs retain their statuses. Preserve all prior detailed dimensions, electrical safety and planning notes; do not close tasks by inference.

**Transition SOP:** The owner copies the **entire** [Fishing_New_Chat_Bootstrap_Prompt.md](Fishing_New_Chat_Bootstrap_Prompt.md) into the new Fishing chat after the canonical five root files have been updated/merged in GitHub; don't substitute the auxiliary P3 handoff.

---

## HISTORICAL engineering context — October 24, 2026, P3-18

## HISTORICAL Fishing Companion v3 checkpoint — October 24, 2026, P3-18 R1

**Authority and scope:** Reconstructed from the owner-accepted October 22 AUTH-P0 feasibility closeout, the current draft [PR #262](https://github.com/ginosega/fishing/pull/262) and [PR #263](https://github.com/ginosega/fishing/pull/263), the GitHub production/sandbox repository state, the owner-reported October 24 R1 evidence, and the [P3-18 R1 final report](https://github.com/ginosega/fishing/blob/4e5f084a8be0f766b157d021a8346710dc38f85a/experiments/p3/preview/P3_18_Remote_Sandbox_D1_Migration_Approval_Proposal_2026-10-23.md) on the **draft P3 branch**. Later dated evidence in this section supersedes historical October 12/19/21 statements below. Keep experimental branches draft and unmerged.

- **Production:** `ginosega/fishing` `main` at `4a1a8c44317b56a4d47e818db9cd2b5587a966d8`; latest successful [main Full Application workflow #672](https://github.com/ginosega/fishing/actions/runs/39990546320) (October 23), production release `504d615b2bef361da06d655ee621d43a`, **577 hosted files / 100 Gear / 60 KB / 12 Catches**; exact-source Pages/hosted verification, including browser acceptance, passed. This documentation update is **not a PWA deploy**. FISH115–117 v2 releases remain complete. FISH117 owner's subjective visual/mobile speed acceptance is **not recorded**.
- **Open experiments:** [PR #262](https://github.com/ginosega/fishing/pull/262) AUTH-P0 and [PR #263](https://github.com/ginosega/fishing/pull/263) FISH118/P3 remain **OPEN, DRAFT, UNMERGED**. No v3 application UI, live publishing, or production cutover. **FISH-TODO-118 is allocated to this work**, not the next unused ID; allocate a new application ID only after inspecting current TODO/source.
- **P1 AUTH-P0/G1:** **OWNER-ACCEPTED/CLOSED WITH EXCEPTIONS on October 22**, not still awaiting its original feasibility decision. The owner approved the **same-origin Cloudflare gateway architecture in principle** after Windows/Android real installed-PWA OAuth reentry, session restoration/revoke-all and offline use. The seven-day absolute Secure HttpOnly D1 session, local Sign out/Revoke all and **no GitHub-side revocation webhook** were accepted; an externally revoked GitHub authorization may leave a current app session valid until local revoke or seven-day expiry. Live negative/expiry tests, provider metrics and independent two-origin byte-comparison were **waived/not verified**, not passed; iOS unavailable/not tested. Subsequent implementation/release acceptance and any new production origin/cutover remain separate approval gates. [Final G1 decision](https://github.com/ginosega/fishing/blob/081af3c0a5e6eff4cea04c8fc1a26688f7445bf1/experiments/auth-p0/AUTH_P0_G1_Final_Decision_and_Waivers_2026-10-22.md) is on draft PR #262, not `main`.
- **P3 approved scope and real sandbox:** Cloudflare **Free** disabled Worker `fishing-p3-sandbox-preview` on `https://fishing-p3-sandbox-preview.ginosega.workers.dev`, isolated D1 `fishing-p3-sandbox`; separate **private** `ginosega/fishing-p3-sandbox`, GitHub repository ID **1430581407**, `main` `e37db3b18bd9948bf4453d7f885f868e830a9a9a`, and dedicated sandbox-only GitHub App. The owner reported a successful HTTP 200 *Contents-read-only* installation-token/identity diagnostic, then removal of its temporary diagnostic key. No GitHub write-path proof or publication route is enabled; `P3_WRITE_ENABLED=false`. No App authorization for `ginosega/fishing`. Secrets, Cloudflare account/D1 identifiers, private configurations and Time Travel bookmarks must **never** be placed in chat or GitHub.
- **P3 progress:** P3-0 broker/real canonical validator, scoped sandbox App read probe, source security/operation tests, P3-3 durable D1/session foundation and subsequent sandbox/CI/migration safety design have progressed on draft PR #263. The **P3-17 actual Wrangler 4.152.0 local rehearsal of unchanged canonical 0001, 0002, 0003 is complete** (staged individually, local ledger 3 entries, six tables/three indexes/five triggers, FK clean). Isolated source and full PR validation on current P3 head are recorded as successful; **tests do not prove active publishing**.
- **P3-18 remote sandbox migration R1: COMPLETED/VERIFIED October 24.** After guarded isolated-target/unchanged-source checks and private fresh recovery bookmark, the owner approved Wrangler's interactive preview listing **only `0001_initial.sql`**, and Wrangler executed it successfully. Remote `d1_migrations` ledger now has **exactly 0001**; original three P3 tables/three indexes are unchanged; all three application tables have zero rows; FK check clean. Hosted anonymous `GET /health`: `{ok:true,ready:false,mode:"preview-no-publishing"}`; `GET /session`: `{authenticated:false,authorized:false}`. **R1 is closed; do not repeat it or disclose/restore from the bookmark.** [Detailed R1/R2 gate and owner evidence](https://github.com/ginosega/fishing/blob/4e5f084a8be0f766b157d021a8346710dc38f85a/experiments/p3/preview/P3_18_Remote_Sandbox_D1_Migration_Approval_Proposal_2026-10-23.md) are on draft PR #263.
- **NEXT: review R2 ONLY, no automatic migration.** `0002_durable_snapshot_and_audit.sql` would add **one `p3_requests` table + three audit/transition triggers**. It needs **new explicit owner approval**, fresh exact-target/schema/zero-row/hash preflight and private Time Travel bookmark, and a restricted Wrangler migration directory with **only 0001+0002**. Pending preview must show **only 0002**. Successful R2 postflight would have ledger 0001+0002, **four tables/three indexes/three triggers**, FK clean, zero unexpected data, Worker still disabled. **R3 (`0003_ci_observation_recovery.sql`) requires an independent later approval**, as do new Worker deployment, sandbox GitHub write/merge, PR #262/#263 merge, `P3_WRITE_ENABLED` change and production v3 cutover. No automatic remote D1 restore.
- **Other project tracks:** Preserve `FISH-TODO-040` owned Garmin Force Current/Redodo 24V system commissioning, kayak removable motor/battery/pedals installation and hard-plastic bin with protected foam fit; open `FISH-TODO-008` under-seat tackle tray, `014` KastKing box watch and all outstanding fishing/KB/research tasks. Never infer purchase or closure. Normal Gear/KB/Catch content remains under FISH108 Fast Content Release.

**New chat procedure:** Restore these five root files and live `main`/PRs/deployed evidence; next read [P3-18 R1/R2 gate](https://github.com/ginosega/fishing/blob/4e5f084a8be0f766b157d021a8346710dc38f85a/experiments/p3/preview/P3_18_Remote_Sandbox_D1_Migration_Approval_Proposal_2026-10-23.md) from draft PR #263, not `main`, and review the *R2 approval decision* before any remote write. Chat mode by default; preserve all past signed-off v3 requirements/design/UX/plan and separate permission/cutover gates.

---

## Historical handoff state — October 21, 2026, after FISH117

The owner is transferring to a new Chat after authorizing and completing two further v2 maintenance phases following the approved v3 plan. **Current pre-handoff `main` was `c42d0e737151608b53ffd0de6fa29dbbd76eba32`; open PRs: none.** The documentation-only handoff PR will move `main` beyond the published source without republishing. Verify fresh state before acting; old checkpoints further down this file are historical.

**Latest live PWA:** [main production Full Application workflow #543](https://github.com/ginosega/fishing/actions/runs/39690549053) fully successful; source `ab1c59a61c748e9a8a1da2b31d87e1d86c96ac9f`, release `131ebca9c6d46fa1c1d815ad43a318f6`, **577 files / 100 Gear / 60 KB / 12 Catches**; actual GitHub Pages verified bytes, manifest and browser tests passed. [FISH117 report](pwa/docs/Fishing_Companion_FISH117_Static_Artwork_Optimization_2026-10-21.md).

**Application work finished:** FISH115 full-resolution Gear/KB picture originals plus release-generated card thumbnails and compatible security patches deployed via PR #252; FISH116 P0-A stale-session 404/503 resolved through safe verified whole-release transitions and dirty-editor protection via PR #254, with old hosted releases not retained; FISH117 16 static category icons plus two scenic headers optimized to release-only WebP via PR #258 (PR #259 corrected a WebKit test fixture, no runtime change). Owners accepted Android Chrome installed-PWA external link behavior (P0-C) without changing it. FISH117 reduces static artwork bytes **17,090,051 → 253,660 (98.5%)**. The owner deliberately skipped visual/performance preview and plans to evaluate the deployed appearance/loading personally; no owner result or actual device timing is recorded. **Next unused application ID: FISH-TODO-118**.

**v3 remains approved but not yet cut over:** The requirements, technical design, sign-in/submit/publish/Connection Status UX, and staged implementation plan were approved October 19. P0 investigation and optional v2 reliability/performance fixes have since been completed. Next unresolved gate is **P1 AUTH-P0**: obtain scoped permission/provider/hosting approval before provisioning, prove secure GitHub App-backed single-owner sign-in and session restoration/callback in installed Android/iOS PWAs, and halt on any insecure cross-site cookie or credential-exposure approach. No signed-off v3 deployment or GitHub App provider installation has occurred. Requirements exclude background offline sync, multi-user roles and Catch pictures/GPS. Routine Gear/KB/Catch content remains under FISH108 Fast Content Release.

**Other active user work preserved:** Bonafide RVR119 Garmin Force Current commissioning, 24V Redodo battery and removable storage-case/foam design (FISH-TODO-040), backordered under-seat tackle tray watch (FISH-TODO-008), KastKing box watch (014), open purchase, fishing-research and KB-article items in `Fishing_TODO.md`; no inference of purchase or closure. Do not let the newer PWA releases erase these tasks.

**New-chat procedure:** Start with [Fishing_New_Chat_Bootstrap_Prompt.md](Fishing_New_Chat_Bootstrap_Prompt.md), read the five canonical files in order, inspect current `main`/PRs/latest successful hosted run, and act in Chat mode. Older October 12/19 "not yet started" text below reflects historical snapshots, not today's status.

---

## Latest handoff reconciliation — October 19, 2026

**v3 planning state:** Requirements, technical design, UX screens/flows and staged implementation plan have **all been explicitly APPROVED**. The [implementation-plan approval](pwa/docs/Fishing_Companion_v3_Implementation_Plan_Approval_2026-10-19.md) has a mandatory **full new-chat transfer before P0**. No P0 investigation or v3 implementation has yet begun; no new provider/domain/permissions or production cutover is preapproved. The [new-chat bootstrap](Fishing_New_Chat_Bootstrap_Prompt.md) now carries the current start instructions. Begin P0 only after restoring fresh actual main/current open PRs/latest hosted production identity in that new Chat conversation. AUTH-P0 proof and staged approvals/Work-mode checkpoints remain binding.

**Latest successful production evidence observed during handoff (October 15, 2026 UTC):** Fast Content Release workflow **#520** / run **38686171921**, production source `4fc893d044b72e61fbc36cfd82103af55bc36f97`, release ID `f5eab01e9d5af6101f03a7094de5b565`, **431 hosted files / 100 Gear / 60 KB / 12 Catches**, `hostedBytesMatch: true` from deploy-content verification log. Latest main at start of handoff was `7cc7eea06a110e041dbf552855957713df4b1c51` with **zero open PRs**. Subsequent documentation-only reconciliation moves main ahead without updating published PWA. All identities are checkpoint snapshots, not substitutes for new-chat verification.

## Previous authoritative audit checkpoint — October 12, 2026 (historical)

`ginosega/fishing` is the durable source of truth. Restore actual current `main` and current open-PR state before repository work. For exact production identity, inspect the latest successful `main` production workflow plus its hosted verification evidence; checkpoint values in project Markdown are historical evidence, not permanent truth.

### October 12 verified production checkpoint

- production source revision: `e71c9ab6a90da46f8b46c7977bf476a1633fa94c`;
- latest source change: add the **September 24, 2026 Banks Lake representative picture** to the Banks Lake Location record (PR [#228](https://github.com/ginosega/fishing/pull/228));
- production workflow: **#517** / run `38207507318`, **Fast Content Release**;
- hosted release ID: `0f4bd1f9e9e12b2b1981d61b48e3e501`;
- hosted counts: **Gear 100 / KB 60 / Catches 12**; hosted files: **431**;
- exact-current-main guard, Pages publication and hosted byte/release-identity verification passed: `hostedBytesMatch: true`;
- **PR #228 is merged; open PRs: 0** at the start of this reconciliation.

This October 12 handoff only changes the five root project Markdown files. These documentation-only changes **do not publish the PWA**; after merging the handoff, `main` can be ahead of the production source revision. For the next task, always recheck actual current `main`, open PRs and latest successful hosted verification rather than assuming these identifiers are current.

## Application / architecture state

FISH114 remains the latest completed application/architecture change: Android/Edge maskable launcher icon, implemented/production-verified/user-verified/closed. FISH071–076 and FISH078–114 are complete/implemented. The next unused application/architecture ID is **FISH-TODO-115** unless newer `main` allocates it. Routine FISH108 content work does not consume application IDs.

Fishing Companion remains a three-domain PWA:

- Gear canonical source: `pwa/Gear/`
- Knowledge Base canonical source: `pwa/KB/`
- Catch canonical source: `pwa/Catches/`

`.github/workflows/fishing-production.yml` is the sole active production publisher.

## Recent canonical content — September 24–October 5

Current source includes the following durable content changes:

- **Five Banks Lake catches from 2026-09-24**, all with Catch records, pictures and Notes Markdown:
  - Smallmouth bass — 12 in — `zman-ned-rig-kit`
  - Largemouth bass — 14 in — `zman-ned-rig-kit`
  - Lake whitefish — 8 in — `lake-whitefish` species + `zman-ned-rig-kit`
  - Smallmouth bass — 15 in — `berkley-powerbait-power-jerk-shad`
  - Smallmouth bass — 14 in — `berkley-powerbait-power-jerk-shad`
- **Lake whitefish** added as a Species KB entry with picture and authored content.
- **Z-Man Ned Rig Kit** specifications now include Finesse TRD stickbait, TRD Tickler, TRD Craw and 1/6 oz + 1/10 oz jigheads.
- **ZMan Finesse ShadZ**, **ZMan Trick ShotZ**, and **ZMan TRD GobyZ** added as Gear with Green Pumpkin specifications, Drop Shot Notes links and pictures.
- **Blue Fox Flash Spinner** and **Bad River Tackle Company Trout/Panfish Spinners** added.
- Old generic/South Bend inline-spinner Gear item removed and its live Inline Spinner KB reference cleaned up.
- **VMC Swimbait Jig** Notes added.
- Berkley PowerBait Power Jerk Shad Notes wording updated.
- Banks Lake inline-image filename/case and Markdown formatting corrected while preserving the intended two Steamboat Rock images.
- Pflueger President Spincast Combo rod/reel Notes were revised; current reel capacity is `110 yd / 4 lb, 90 yd / 6 lb, 70 yd / 8 lb`.
- Earlier Electronics Research motor/battery material was superseded: current **Electronics Research** Notes contain chart plotter/fish-finder material only.
- October releases added/updated Flutter Spoon content, NRS Zander PFD, YakAttack BackWater DryPak, Z-Man ShroomZ Micro Finesse Jig, Z-Man Finesse TRD, Z-Man branding, Luhr Jensen Trout & Kokanee Dodger, Yamamoto Senko and three lure-picture replacements.

Current source always controls over this summary.

## October 8–12 canonical content reconciliation

The following content changes are **implemented, merged and hosted-verified**, not outstanding application tasks:

- **PR #221:** two orange YakAttack Gear items — Fully Loaded TracPak Combo Kit and 10L Roll-Top Drybag with Air Valve; both use previously uploaded PNGs.
- **PRs #222–224:** Garmin Force Current with Power Steer Foot Pedals Gear entry, illustrated component Notes, and corrected display name. Current Gear ID remains `garmin-force-current-kayak-trolling-motor-with-power-steering-foot-pedals`.
- **PR #225:** `electronics-research` is now **Electronics Research**, with a new representative PNG; its Notes cover **chart plotters/fish finders**. Earlier motor and battery research sections were removed from this page. Do not restore them solely because prior handoff documents mentioned them.
- **PR #226:** detailed **Lake Stevens** kayak-fishing Location page, including North Cove/Davies Beach launches, bass/perch/trout/kokanee strategies, tackle from My Gear, seasonal patterns and regulations. It has no representative picture; one was not requested.
- **PR #227:** expanded Garmin Force Current Notes with a maintenance checklist and component links/three inline pictures; the canonical Gear metadata and picture were unchanged.
- **PR #228:** Banks Lake Location representative picture `KB/Locations/assets/2026-09-24 Banks Lake, WA.png`, using the uploaded PNG without altering it. This was the release interrupted in ChatGPT, but it **subsequently passed PR validation, merged and deployed** in production run #517.

Current canonical source has **100 Gear / 60 KB / 12 Catches**, including **10 Location** KB entries. The published application has no new architecture/feature work from these releases. Keep all source-aware validation, fast-release and ownership rules unchanged.

## RVR119 Force Current ownership and commissioning — active

The user **purchased the motorization system on October 6, 2026**. Do not preserve the old “no purchase decision” state.

### Owned system

- **Garmin Force Current** trolling motor
- **Garmin Power Steer wireless foot pedals**
- Garmin handheld remote
- Garmin MOB tag
- **Redodo 24V 50Ah LiFePO4 battery**
- Redodo battery charger
- Garmin high-efficiency propeller
- Garmin weedless propeller
- used-package purchase price: **$2,800**
- seller location: Gresham, Oregon
- original Garmin purchase: **July 2026**
- original Garmin receipt transferred to the user
- Garmin support directly confirmed the remaining **three-year standard warranty will be honored with the original receipt**
- seller confirmed the motor has **never been used in saltwater**

### Active setup / commissioning work

FISH-TODO-040 remains OPEN as the commissioning/integration task. The current baseline procedure is:

1. document serial/receipt and as-purchased condition;
2. clean and inspect exposed motor/mount/shaft/rope/connectors/props/anodes; no invasive service on a three-month-old warranted unit unless a fault requires it;
3. inspect, charge and baseline the Redodo battery and verify the Redodo LiFePO4 charger;
4. use a 40A protected motor feed and never run the propeller out of water;
5. clear prior-user Garmin navigation data and restore motor defaults;
6. restore remote defaults and re-pair the remote, both Power Steer pedals and MOB tag;
7. update Force Current, remote and pedal software through ActiveCaptain;
8. calibrate both Power Steer pedals and the handheld remote;
9. after RVR119 installation, perform on-water motor compass/bow-offset calibration and a complete propulsion/steering/Anchor Lock/MOB functional test.

### Storage case search

The user wants a **hard-plastic** storage case/bin for the motor and pedals with:

- minimum usable internal dimensions **38 × 18 × 8 in**;
- a snug/compact fit rather than a large tote;
- **orange preferred**;
- no flexible bags;
- no need for Pelican/Otter-level thickness or cost;
- Hyper Tough 50-gallon bin rejected as too large.

Continue searching by **verified usable interior dimensions**, not exterior dimensions alone.

### Storage-case cushioning and fit — current exploration

The current discussion concerns a **48 × 19 × 14 in lidded hard-plastic bin** for the motor and pedals. Its **actual usable interior dimensions and purchase/ownership status are not independently confirmed**; the old minimum **38 × 18 × 8 in usable interior** remains the fit requirement until measurements confirm otherwise. The user is considering a custom cushioning insert. Cut **closed-cell EVA or polyethylene foam** is the safer reusable baseline. Construction **Fireblock/Gaps & Cracks** spray foam is too firm/unpredictable for direct equipment cushioning; flexible Window & Door foam is only a cautious sample experiment, not an approved permanent solution. Never apply expanding foam to the motor or pedals directly, and do not compromise connectors/shaft/controls or trap water.

### Remaining integration considerations

- Motor and battery must remain easy to remove because the RVR119 is transported on the F-150 roof rack.
- The Force Current motor and Power Steer pedals are removable for transport.
- The Newport 24V 50Ah LoPRO remains of interest only as a possible future lower-profile battery alternative; the Redodo 24V 50Ah is the currently owned propulsion battery.
- RVR119-specific mount/pedal placement, power routing, circuit protection and practical setup/teardown remain part of the active installation work.

## Science of the Strike transcript research

Recent transcript reviews covered:

- largemouth vision;
- scent and taste;
- barometric pressure and lunar cycle;
- crawfish;
- dissolved oxygen and turbidity.

Durable editorial rule: distinguish evidence presented in studies from host opinion/inference. Do not turn population-specific studies, lab thresholds, anecdotal conversions or host extrapolations into universal fishing rules.

Potential Fishing Companion destinations:

- **Bass Behavior and Habitat:** visual ecology, chemical senses, fronts/weather, crawfish biology, dissolved oxygen, stratification and turbidity;
- **Bass Fishing Techniques:** presentation angle/color, bite retention/scent testing, pre/post-front execution, crawfish presentation and turbid-water presentation;
- **Summer Fishing:** thermocline/oxygen-compressed habitat;
- **Electronics Research:** 2D-sonar thermocline identification and forward-facing-sonar visual-angle implications.

Do not reintroduce retired Technique pages such as Water Visibility or Color and Scent merely to house podcast material.

## KB editorial architecture

- **Bass/Trout Behavior and Habitat:** where fish are and why — habitat, structure/cover, temperature, oxygen, forage, light, wind/current, depth and pattern recognition.
- **Bass/Trout Fishing Techniques:** how to catch fish once located — presentation, lure/bait/rig selection, retrieve/cadence, depth control, strike handling and bank/kayak execution.
- **Spring/Summer/Fall/Winter Fishing:** detailed seasonal playbooks combining location and presentation.
- **Topwater Fishing:** broad surface strategy; Frog, Popper, Whopper Plopper, Walking Bait and Buzzbait remain narrower Gear Guides.
- Internal `kb://` links are curated for reader value, not added mechanically.

Retired live Technique pages remain retired unless explicitly requested: Bass Fishing, Spring Bass Fishing, Fall Bass Fishing, Bass Power and Search Overview, Color and Scent, Paddle-only Kayak Strategy, Seasonal Bass Guidance and Water Visibility.

## FISH108 release model

Full policy: `pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md`.

### Fast Content Release

Use only when every changed repository file is beneath `pwa/Gear/`, `pwa/KB/`, and/or `pwa/Catches/`. Before mutation validate current source/open PRs, package source revision/ancestry, record hashes/base fields when applicable, IDs/types/paths/references, media existence/hash and conflicts. Preserve unrelated/newer source and user-uploaded bytes.

Fast releases use one lightweight content PR, locked cached dependencies, canonical content/build verification, exact-current-main protection, Pages deployment and dependency-free hosted byte/release-identity verification. Do not run the Full Application suite for routine content-only work unless a genuine non-content problem is found.

### Full Application Release

Runtime/UI/assets, service worker, schema/contracts, tests, build/tooling, dependencies, workflow, migration/recovery/offline architecture or mixed content+non-content work uses the full lane. Documentation-only project-state reconciliation does not publish the PWA.

## Durable authoring/product behavior

- Gear/KB Add/Edit remains **Prepare Changes → Copy Changes**; copying is not saving and the browser does not write GitHub source directly.
- GitHub upload links use physical `/pwa/...` paths; packages use logical `Gear/...`, `KB/...`, `Catches/...` paths.
- Existing IDs remain stable unless intentionally retired/replaced.
- Simple Markdown narrative edits may be direct; structured fields/links/pictures/sequences/relationships use source-aware workflow.
- KB description maximum is 80 characters.
- Same-page Markdown links target renderer-generated lowercase punctuation-stripped hyphenated slugs.
- FISH091 offline library is explicitly provisioned through **Connection Status → Update offline library**.
- FISH096 Knot sequences require explicit ordered `pictureSequence` frames.
- FISH102 pins Line-Tackle-Knot Reference first only under KB → Knots.
- FISH103 external HTTP(S) links open new-tab; internal/local links remain same-tab.
- FISH107 canonical Skylety Fishing Hook Sharpener type is `Tools`.

## Backlog / unresolved state

- RVR119 Under Seat Tackle Storage remains back-ordered/not purchased and is the user's #1 needed fishing equipment item.
- FISH-TODO-014 KastKing 3600 deep-box watch remains open unless explicitly resolved.
- Texas Rig, Carolina Rig, Alabama Rig, Neko Rig and Spoons KB pages remain open.
- Fishing Companion v3 requirements, technical design, UX screens/flows **and staged implementation plan** are all approved as of October 19, 2026. [Approved plan](pwa/docs/Fishing_Companion_v3_Implementation_Plan.md) · [plan approval/caveat](pwa/docs/Fishing_Companion_v3_Implementation_Plan_Approval_2026-10-19.md). **First transfer to a new Chat before beginning P0**; restart baseline investigation there. Preserve FISH108, single-author public-readable GitHub App architecture and UX, AUTH-P0 real-device login/session feasibility, excluded offline queued sync/multi-user/Catch pictures, provisional removable local drafts, and separate approvals for provider/permissions, v2 maintenance releases, and v3 production cutover.
- RVR119 Force Current purchase is complete; commissioning, storage-case selection and RVR119 installation remain active under FISH-TODO-040.
- Preserve all other active items in `Fishing_TODO.md`.

## Next-chat entry point

After handoff, open [Fishing_New_Chat_Bootstrap_Prompt.md](Fishing_New_Chat_Bootstrap_Prompt.md) from latest `main`, copy its instructions to a new Chat-mode Fishing conversation, and freshly resolve GitHub/production identity before acting.
