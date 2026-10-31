## Current decision and next execution gate — October 31, 2026

## Immediate next step — private Publishing Status disclosure acceptance

Owner confirmed private Worker version `9570feaa-2731-4b29-8d95-4503c1e5056c` after validating the latest Notes editor Insert copy / missing Name behavior. Only pending small UX refinement: when Connection Status opens, Publishing Status is initially expanded for ongoing/failed publication and collapsed otherwise, but it never changes expansion in response to later status polling or completion until the dialog is closed/reopened. Code was source committed at `f52f7ba7e22d3eb71af348176531ee1ea502666c`. New guarded `experiments/p3/preview/tools/deploy-d3-publishing-state-private.ps1` prepares by default and has an explicit `-Deploy` switch. It is pinned to previous JS/CSS bundle hashes from `cbf4339` CI and the current Worker version provided by owner. CI validates Windows PowerShell syntax. Do not deploy public V2 or approve public V3 cutover. After private deployment, owner should observe publication complete while dialog stays open and verify manual disclosure state is preserved; test reopen defaults independently.


## Current V3 Publishing Status disclosure UX amendment

**Owner-approved private V3 Connection Status correction (October 31, 2026):** Publishing Status must choose its automatic disclosure state **only when the Connection Status dialog is opened**. On opening: expanded if publishing is active or a confirmed Failed/Conflict, collapsed for Live/cleared/no active publication. **While the dialog is already open, status polling and transitions (including completion to Live) must never expand or collapse the disclosure**; preserve any user-chosen expanded/collapsed state. Continue updating the dot, status text, action buttons, and verified summary while open. On a later close and reopen, apply the default again. Source fix moves disclosure initialization into `onDialogOpen()` and invokes that immediately after `showModal()`; `paintIndicator()` now only updates the dot. Add tests for Live completion while open, manually collapsed active status, and reopen defaults. Source validation and deployed Windows/Android acceptance remain distinct gates; public V2 unchanged.


## Current screenshot-based editor acceptance checkpoint

October 31 Edge screenshots confirm the unfinished Add Gear form produces `gear schema: /items/1/id ... /items/1/name ...` on **Preview Markdown** if Name has not been entered. This is not an invalid internal link. Already implemented in the pending, **not yet field-deployed** preview fix (`draftNotesPreviewOptions`): preview uses the validated catalog without requiring a complete draft; Save and Publish still performs full record validation. The second screenshot shows an image insert attempted before an item ID was generated. Such insertion must still be blocked because the item ID defines its photo storage path, but the message now explicitly says **Enter a Name above first. The generated item ID is required to store the image.** Both Insert link and Insert image forms must show **Insert**, already implemented in the pending private build. User confirmed links, images, and ordered/unordered table lists worked; publication/Picture Viewer not yet accepted. Retest after the version-locked private Worker deployment, keeping public V2 unchanged.


## Current immediate D3 owner feedback checkpoint — October 31, 2026

Owner deployed private Worker version `7cbef72d-d4ab-4c17-a451-2a06c3867436` and confirmed anonymous denial/public V2 stability. Reported error previewing a Notes link to existing D3 Verification and requested both Insert image and Insert link button texts be changed to **Insert**. No usable screenshot text was included in the current visible context. Source fix separates Gear/KB draft Markdown Preview from premature whole-record validation (use verified source maps and owner fallback path); the strict validation at Save/Publish is preserved. Add regression using actual `p3-test-rod` and `location-p3-test-lake` sandbox IDs. Next run dedicated source CI, then owner-run dry-run preflight and version-locked private deployment using `experiments/p3/preview/tools/deploy-d3-notes-preview-fix-private.ps1`. No public V2 changes or live UX acceptance yet.


The owner approved preserving all working existing Markdown link formats: `site://` is additive for Home/My Gear/Knowledge Base/Catch Log navigation, not a migration target. `gear://`, `kb://`, relative Markdown paths and HTTP(S) stay unchanged. `catches://ID` works if manually typed, but **no individual Catch entries appear in the Insert link picker**. D6 must do a targeted link audit and fix only proven stale/broken links; do not bulk rewrite content. Decision is documented in `Fishing_Decision_Log.md`.

At this checkpoint the V3 source branch `feature/fish118-p3-mock-publisher` app HEAD before decision-docs is `1599ec97b12fe7287bc0c6b7ff2015e6e5dac34d`. Latest isolated source gate [41228286422](https://github.com/ginosega/fishing/actions/runs/41228286422) PASSED. Work on a version-locked, protected **private online-only** D3 pilot release to owner-test Notes editing, image/link insertion, table-cell lists, viewer opt-in, publishing, and the earlier Connection Status refinements. The existing deployment PowerShell script `deploy-d3-publishing-disclosure.ps1` has historical pinned SHA requirements and is not automatically reusable for latest HEAD. Require exact expected local HEAD, latest deployed Worker version, anonymous denials, D1, private configuration and public V2 identity before/after private deployment. The private pilot is not equivalent to installed PWA or offline Work Offline, which must be tested separately in D5/D6. D6 ≤60-second public text save, complete original-byte/rollback tests and separate explicit public V3 cutover approval remain OPEN. The owner has not requested to transfer to a new chat.

## October 30 verified source checkpoint — stay in this chat

## Current V3 Notes link feature checkpoint — code committed, field acceptance pending

Owner approved the shared Insert link dialog alongside Insert image in every V3 Notes editor (Gear, KB, Catches), in normal and expanded modes. Show selectable Site page versus External URL, a customizable label prefilled from highlighted Markdown, a searchable and category-filterable page selector, and insert at the editing cursor. **Picker includes Gear + Knowledge Base entries and Home/My Gear/Knowledge Base/Catch Log navigation, but NEVER individual Catch records.** Manual `catches://<ID>` references still work if the Catch exists; `gear://<ID>` and `kb://<ID>` remain unchanged. New `site://home`, `site://gear`, `site://kb`, `site://catches` use stable navigation routes. External links require HTTP(S), no credentials, and open separately. No new storage or schema changes. Source work: [edd2fcb](https://github.com/ginosega/fishing/commit/edd2fcb96dcbe47fcb5a4fcf9136d60f5e7e8682); private build UX/device acceptance and other D6 release gates remain OPEN. No deploy for this individual feature.


## October 31 V3 Notes amendment — code committed, real-device field test pending

The owner explicitly approved the shared Gear, Knowledge Base and **Catch Notes** editor with **Insert image**, compact top **Preview Markdown**, full-page expansion, per-image viewer OFF by default and optional `"viewer: caption"`. The owner clarified that **Catch photos are prohibited only as representative top-of-page pictures**; photos IN Catch Notes are required and do not alter the Catch JSON schema or default Species image. Table lists support `- ...<br/>- ...` and `1. ...<br/>2. ...`; no general HTML. Original bytes use guarded private D4 GitHub blob stage, signed tickets and verified source/hosted bytes. **No deployed UX acceptance yet**, no production/public V3 cutover, no waiver of ≤60s text-only acceptance. See [the authoritative October 31 amendment](pwa/docs/Fishing_Companion_v3_Notes_Editor_Amendment_2026-10-31.md). Continue integrated V3 acceptance in Windows Edge and installed Android Chrome (not iPhone).


## Current checkpoint — approved V3 Connection Status, no standalone deployment

**Owner-approved October 31, 2026:** The V3 Connection Status screen's Alpine Mist dark mode and compact layout are **UX signed off**. Separate green/yellow actual-network dot, and the same blue/red publication tone as the header. Publishing Status is a native Help & Diagnostics-style disclosure, collapsed by default when the publication indicator is absent, expanded automatically for active publishing or verified Failed/Conflict, and manually expandable after success. Final Offline Library controls: label the one action **Prepare** until a selected offline library is verified Ready, **Update** thereafter, **Preparing…** while the download is active; **remove Reload from V3** because it only refreshes the browser page. Preserve V2's existing Reload and Update offline library behavior. **No deployment requested or performed for the final Offline Library wording change**; owner will inspect in the next integrated build. Alpine Mist's earlier private Worker deployment was owner-confirmed; rollout of the subsequent publishing disclosure change is not independently confirmed here. V3 draft PR #263 remains open/unmerged. This screen-level sign-off does **not** complete full Work Offline/installed Android acceptance, D6 sub-60-second real-publish validation, rollback testing, or separately required public production V3 cutover approval. Source change: [07ea986](https://github.com/ginosega/fishing/commit/07ea98683ceed66b0c735b9e590ed099f0241577).


**Final isolated source gate (October 30, supersedes preceding validation-pending language):** [GitHub Actions #41088642846](https://github.com/ginosega/fishing/actions/runs/41088642846) **SUCCESS** on exact application source commit `1bbce127be86525c02e6ad26f32ff08973bea038`. Evidence: **154/154 PWA**, **4/4 real Chromium isolated candidate**, **43/43 broker**, **763/763 private P3 publishing** tests; byte-verified local reader candidate and D3 Worker Wrangler packaging dry-run. The completed test includes the source-verified owner-only D1 latest-publication item summary and name sanitization. Earlier failing runs were caused by a stale removed-text browser assertion and an overbroad item-name cleanup regex; both were corrected and independently retested. **No private Worker deployment, no real signed-in owner UI field test, and no public V3 release/cutover.** V3 remains on draft [PR #263](https://github.com/ginosega/fishing/pull/263). The owner is continuing in the same conversation; do not initiate a new-chat handoff. Final next gate: owner Edge review of the newly built isolated reader layout; then deliberate private authenticated pilot build/deployment and Windows/Android owner acceptance of Account, server-backed latest Live item/time, and failure-recovery UI. The PWA device/hosting/speed/D6 gates remain open.

---

## October 30 in-chat V3 Connection Status UX update (not a chat-transfer request)

User remains in the **same chat** and fully approved the detailed V3 Connection Status redesign: six always-structured sections Status, Mode, Offline Library, Account, Publishing Status, Help & Diagnostics (last collapsed). Normal indicator green/yellow for network with exactly `Connection status: Online` or `Connection status: Offline`; publishing blue tooltip `Publishing: <step>`; verified failed/conflict red sticky `Publishing failed`. No reading-mode tooltip. Status shows only Online or Offline; Mode shows pressed Automatic/Work Offline, conditional Retry only if service-worker controls unavailable; Offline Library uses **Update**. Account signed in as `ginosega` based on exact server-authenticated GitHub owner identity, otherwise signed-out view with GitHub sign-in. Publishing Status **never disappears**; in Live state shows last owner-scoped server-backed item/action/completion time through reloads; in failure/uncertain state displays reason-specific conservative guidance, Clear / Check again only as applicable, never blind replay. Help & Diagnostics is separate, collapsed, with Copy diagnostics/version info; special development candidate identification not in production main view.

V3 source implementation is on unmerged draft [PR #263](https://github.com/ginosega/fishing/pull/263), including `pwa/src/v3-connection-experience.mjs`, UI/styling/indicator changes, `d2-unified-owner-session.mjs` authorized username, owner-only D1 `summary()` from hash-verified durable request, guarded GET response, validated browser client, lifecycle/controller, and tests. Existing owner header polling reused headless; no new write or deployment. **Do not claim exact-head isolated source CI success, owner authenticated field test, private Worker deployment, or public V3 release until independently verified.** The previously confirmed Windows Edge reading-mode and Markdown viewer passes remain true for the older candidate. User has already approved UX design; proceed with CI remediation, then owner browser preview and later authenticated/device acceptance. Preserve full historical bootstrap below.

---

## October 30 source-status update — owner remains in this chat

**Final source checkpoint (October 30, supersedes earlier CI pointers):** The V3 owner publication indicator now keeps its step hover current **while Connection Status is closed**, using the existing authenticated, read-only 5-second polling path; only when a publication is active and the tab is visible, owner-authorized and online. Terminal Live/Failed/Conflict, hidden tab, offline or sign-out stop polling; no background publish/retry. Normal green/yellow still means physical browser connectivity even in Work Offline, blue is active publish, red is verified Failed/Conflict until explicit acknowledgement. [Isolated CI #41068451025](https://github.com/ginosega/fishing/actions/runs/41068451025) **PASS** at source `1ac38306ed8d7090ac6b874182c0e7c75b936c36`: **149/149 PWA tests, 43/43 broker, 760/760 private P3, 4/4 real Chromium, candidate byte-verified, Worker dry-run only**. The prior source CI's 154-case PWA output included seven FISH118-M workflow-lane cases not listed in this exact run; no test files were removed by this update. **No hosting/Worker/public V3 deployment**, no authenticated header color/hover device field acceptance yet. The owner remains in this chat. [Detailed D5 evidence](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/D5_Isolated_V3_Reader_Candidate_2026-10-29.md).

---

## October 30 in-chat continuation update — read before older "pending Edge" instructions

The owner has **NOT requested a new chat transfer**; this short top update is for future continuity only. The existing **complete** Bootstrap remains intact below; copy the entire file if a new chat is eventually requested. Its earlier October 30 sections saying the Edge D5 reading-mode/Markdown-viewer retest is pending are **superseded**: owner has now retested in Windows Edge, and **both Connection Status and Banks Lake/Garmin original-image viewer PASS**.

New V3 indicator user decision: **green online, yellow offline** (same as V2) regardless of reading preference; **blue only while an owner publication is underway**, with mouse-hover publishing step; **red sticky after server-confirmed Failed/Conflict** until an explicit owner action clears the acknowledged failed status, or a verified new outcome. A transient status GET failure is not a server Failed/Conflict. Draft V3 source implements this plus explanatory in-app failure acknowledgement. [Exact-source CI #41067354331](https://github.com/ginosega/fishing/actions/runs/41067354331) **SUCCESS** at `268018e65a0b6e786c21e9ec1027b12d1b46ec8f`: 154 PWA, 760 private P3, 43 broker, 4 real Chromium and isolated reader build verification all passed. **No public or private Worker deployment; new owner-publishing colors not yet owner field-accepted.**

The owner can use in-app **Check publication status**, and after a **confirmed** Failed/Conflict use **Acknowledge and clear failed status**; this only clears previously verified tracking so that a new corrected edit can be submitted. It does **not** repair CI, conflicts or infrastructure failures. An unknown submission must not be blindly resubmitted; query server receipt first. Some recoveries require external investigation. Draft V3 [PR #263](https://github.com/ginosega/fishing/pull/263) unmerged, public V2 unchanged. Pending: authenticated integrated PWA color/hover and recovery device acceptance, Android installed OAuth/session, D4 remaining media/thumbnail safety, D6/public repeated <=60s and separately approved cutover. This is **not an instruction to start a new chat**.

---

## AUTHORITATIVE FULL NEW-CHAT START — October 30, 2026 (Fishing V3 D4/D5; Edge acceptance pending)

I am resuming my persistent **Fishing** project. **This is the full canonical project handoff, not a request to generate a shorter handoff.** I copy the **ENTIRE contents** of this file from GitHub `ginosega/fishing` **`main`** when transitioning chats. Read the whole prompt and five root documents, but treat this **October 30 checkpoint as authoritative**: any earlier “CURRENT,” “NEXT” or old planned-deployment instructions in the history below are superseded, not permissions to redo work. Use **Chat mode** by default, and proceed through routine approved engineering work with few interruptions.

### Start with GitHub ground truth before acting

Read the complete, current **`main`** versions, in this order: `README.md` → `Fishing_Context.md` → `Fishing_TODO.md` → `Fishing_Decision_Log.md` → this full `Fishing_New_Chat_Bootstrap_Prompt.md`. Then inspect the active development draft and its two evidence files; do not rely on old chat snippets or assume the GitHub branch remains at a past SHA. The last inspected public `main` before the documentation-only update was `a77e50f1fe296e3c16db18aa0fd5f9b17b7c95f4`; future documentation merges advance main without publishing the PWA. Re-query current branch heads and the actual hosted release rather than treating a `main` docs commit as a deployment.

Current repositories and refs as observed during the October 30 handoff:
- **Canonical public repo:** `ginosega/fishing`, branch `main`, https://ginosega.github.io/fishing/ is still **V2**. **No public V3 cutover or merge-to-main of application code authorized.** Draft [FISH118 PR #263](https://github.com/ginosega/fishing/pull/263), branch `feature/fish118-p3-mock-publisher`, most recent seen draft head `1933725237196c592a7451270fbc9df9fb828b72` (documentation-only after code). PR #263 is open/draft and currently marked **unmergeable against main**; don't resolve by accidentally bringing V3 source into public main. [AUTH-P0 draft PR #262](https://github.com/ginosega/fishing/pull/262) still open. Earlier unrelated PR #268 is **closed**.
- **Private sandbox:** `ginosega/fishing-p3-sandbox`, last observed private main `c93da0a79ae37c243b6bd0f32f8cb9b484c5a40b`, isolated Cloudflare D1 `fishing-p3-sandbox`. Authenticated owner pilot Worker `fishing-auth-p0-test` is at `https://fishing-auth-p0-test.ginosega.workers.dev/__d3_pilot__/` with GitHub OAuth return through `/auth/start?return=%2F__d3_pilot__%2F`. The owner browser pilot is **outside** the public installed `/fishing/` PWA service-worker scope.
- **Source CI confidence:** latest independently passed *application source* is `ff9dc182feb4e366ccad970a21955a79c313319e`, [isolated Actions run #41012355230](https://github.com/ginosega/fishing/actions/runs/41012355230). It reports **140/140 PWA, 43/43 broker, 760/760 private P3 test cases, isolated reader manifest/byte verification, and 4/4 real Chromium loopback acceptance tests**. Draft branch docs may be later; don't present source CI as exact-head validation of a later application change or as GitHub Pages/Cloudflare deployment.
- **Source evidence:** [D4 receipts + D5 early implementation](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/D4_D5_Transition_2026-10-29.md) and [D5 isolated V3 reader build, Edge field bugs and 4/4 real Chromium acceptance](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/D5_Isolated_V3_Reader_Candidate_2026-10-29.md). Keep these linked to actual source branch, and never replace the complete root GitHub `main` files with the previously shortened copies from PR #263.

### What has been accomplished — do not repeat already accepted publications

**D1/D2:** approved V3 requirements, technical design, owner UX and finite **D1–D6** delivery stages; owner-gated private broker/D1/private GitHub App sandbox and initial source-verified Gear publication are established. No old P3 submilestone restart, no repeat D1 migrations, no manual state edits or rerunning a completed PR/merge to prove status. User preapproved routine interim GitHub workflows and tests; do not pause for each, but consequential new infrastructure, permissions, costs or production releases need separate explicit approval.

**D3:** authenticated owner-only private Gear/KB sandbox authoring and Android Chrome **browser** pilot works, including owner-confirmed correction of the cross-device status message and Check publication status button. Gated approximately **five-second automatic read-only polling while visible/authorized/in-progress** is present in draft source, with terminal, hidden, offline/signout and duplicate-check safeguards; do not assume this precise UI revision has been privately deployed or installed-device accepted. An installed **Android Chrome V3 PWA** with the actual owner GitHub OAuth callback/return/session restoration/relaunch/logout remains **not accepted**. Anonymous/wrong-owner denial and reconnect edges still merit device proof.

**D4:** user saw private sandbox **Catch Add PR #31, Gear picture Add PR #32, ordered two-image Knot sequence Add PR #34, Gear original-image Replace PR #35, Catch Edit PR #37** become sandbox Live. Independently observed read-only D1 audit `#35 Live / #36 Failed / #37 Live` matches provider PR/CI outcomes. Fabricated non-synthetic Catch Edit PR #36 failed CI and was never merged. Core D4 functional acceptance is supported; **not** independently done: direct GET original hosted-image bytes/hash proof, replacement of an *existing* Knot image sequence, interrupted media-upload negative real-device proof and applying deterministic small WebP thumbnails to *private* V3 cards. Public V2 already ships WebP card thumbnails; original detail pictures are preserved. No Catch photos per approved requirements.

**Private performance:** PR #26 achieved a single owner **59-second Save→sandbox Live**, D1 **56-second Accepted→Live**. Do not claim repeated <=60-second behavior or public `V3-SAVE-09`. Public requirement remains **every routine text-only Gear/KB/Catch click→independent canonical GitHub-source/hosted-byte verified Live within 60 seconds**, without skipping CI, safety, merge proof or rollback. No public V3 cutover approved; private and public Live are distinct.

**D5 source:** isolated V3 reader candidate is deliberately **read-only**: `/fishing/__v3_reader_candidate__/` with a separate scoped service worker/manifest/release hash and mandatory explicit `--v3-reader-candidate --v3-reading-mode` option. The ordinary V2 build does not switch to V3. Offline library is fully verified before persistent Work Offline, uses cache-only ordinary reads, no publication/polling, no silent network mixing; Automatic restores network. Local Markdown originals use Picture Viewer; allowlisted Copy Diagnostics never exposes session tokens, CSRF, owner IDs, operation IDs, draft text or private URLs. The reader candidate contains **no** owner OAuth/publisher/server write and is **not an integrated V3 owner PWA**.

### CURRENT OWNER-BLOCKING FIELD TEST — Windows Edge

The owner tested the local V3 reader candidate in Microsoft Edge and reported that:
1. The `Reading mode` text was absent on initial Connection Status opening and after reload, appeared only following a mode-button click.
2. The header connection dot stayed green after selecting Work Offline; the browser remained connected, but the **reading preference** was changed.
3. Markdown pictures on **Knowledge Base → Locations → Banks Lake** and **Gear → Equipment → Garmin Force Current motor** did not open full Picture Viewer.

The draft source was updated to show an initial `Reading mode: Checking service worker…` and repeat readback on dialog open, display the active source/release ID, distinguish network status from persistent reading mode, show a **blue header dot for Work Offline** (gray while unverified, green on online Automatic), and use canonical URL comparisons for validated Markdown images including space-encoded Garmin filenames. **Four real Chromium browser cases passed** at `ff9dc182...`: mode change and persistence, Banks Lake original Viewer, all three Garmin original images, and both articles' Viewer in Work Offline. **But the owner's updated Edge retest is STILL PENDING; the preceding Edge bugs must not be called fixed on the user's device merely because CI passed.**

Critical stale-release detail: **Work Offline deliberately pins the previously verified entire cached release**, so rebuilding the candidate directory doesn't necessarily replace the running JS in a retained Edge context. To retest, ask owner to switch old candidate to Automatic if possible, close all Edge InPrivate windows, stop any older local server (Ctrl+C), then pull/build/verify/serve the new candidate on its own scoped localhost URL. Compare displayed source and release IDs. If still broken, request **Copy Diagnostics** (allowlisted), DOM/console error and exact mode state; don't just add speculative fixes or force-delete a potentially valuable real offline library.

#### Known-good local-only source acceptance instructions (Windows, no deployment)

PowerShell checkout is `$HOME\fishing-d2-deploy` on expected branch `feature/fish118-p3-mock-publisher`. Verify current branch and `git pull --ff-only`, then in `pwa` run:

```powershell
$ErrorActionPreference = 'Stop'
Set-Location "$HOME\fishing-d2-deploy"
if ((git branch --show-current).Trim() -ne 'feature/fish118-p3-mock-publisher') { throw 'Unexpected Git branch' }
git pull --ff-only
if ($LASTEXITCODE -ne 0) { throw 'Git pull failed' }
Set-Location .\pwa
$out = "$HOME\fishing-v3-reader-candidate"
node .\tools\build.mjs --base=/fishing/__v3_reader_candidate__/ --v3-reading-mode --v3-reader-candidate --out="$out"
if ($LASTEXITCODE -ne 0) { throw 'Reader build failed' }
node .\tools\verify.mjs --out="$out"
if ($LASTEXITCODE -ne 0) { throw 'Manifest/byte verification failed' }
node .\tools\serve-v3-reader-candidate.mjs --out="$out"
```

Then open **a fresh Microsoft Edge InPrivate window** at `http://127.0.0.1:4173/fishing/__v3_reader_candidate__/`. This server is loopback-only and never hosts, uploads, publishes, or routes public Pages/Cloudflare bytes; stop with Ctrl+C. The `--out` directory is deliberately **not** ordinary `pwa/dist`. Test Connection Status initial and reload mode label, Automatic/Work Offline toggling, blue dot and independent browser-online text, both Markdown article viewers in Automatic and Work Offline, Copy Diagnostics, persisted release identity, and proper fail-closed offline behavior.

### Next work after the owner Edge acceptance

Finish D5 reader state/UX and errors on actual Edge with source IDs; then develop a strictly separated secure HTTPS/device candidate **only after approval of any new host/route or cost**. Complete installed Android PWA owner session/OAuth/scope/signout, multi-device negative/recovery cases and pending D4 bounded media/thumbnail/hash evidence. Consolidate D6 acceptance, stable repeated public canonical ≤60s publication proof and rollback. **Do not merge draft PR #263 into public main or deploy public V3 without a separate final approval.**

### Handoff and working preferences

- Read **all five full GitHub `main` root Markdown files**, not just summary headings. Use newer links and source logs over stale historical narrative. The V3 draft branch previously contained *shorter* and older root docs, so preserve the longer main canonical versions and reconcile any future source PR carefully. New chats paste the entire Bootstrap from main, not a concise surrogate. Do not overwrite main historical documentation with the draft's abbreviated copies.
- Owner prefers progress through authorized steps without repeated approvals and no background promises. Unresolved material hosting, provider/payment/permissions/secret operations and public cutover remain consequential and require explicit approval. Do not reveal sensitive recovery bookmarks or ask for tokens in chat. Use Chat mode unless a genuinely necessary Work-only task.
- No iPhone testing. Windows Edge/Chrome and Android Chrome/installed PWA are relevant. No Catch pictures; anonymous reading default; only owner signs in. Preserve editorial and design approvals, immutable source, verified thumbnails, full original images and minimal GitHub permissions. Protect dirty editors; no offline queued writes.
- Continue non-PWA fishing tracks without silently closing them: Bonafide RVR119 under-seat tackle tray availability (FISH-TODO-008), KastKing box (014), Garmin Force Current + Redodo 24V 50Ah/40A protected kayak wiring and first on-water calibration/commissioning/storage foam (040), and existing tackle, waterbody, KB and gear maintenance TODOs. A reported wiring completion does not by itself prove motor commissioning.

**Transition rule:** This is the authoritative current section. Older October 29/28/26/21 passages below remain complete historical evidence; don't resume their obsolete “next step,” and don't re-perform already signed-off source/CI or private GitHub writes without reason.

---

## CURRENT NEW-CHAT START — October 29, 2026 (authoritative full Fishing handoff)

You are resuming my **Fishing** project after the October 29 private Fishing Companion V3 performance sprint. **Use this ENTIRE prompt, including the older history below; do not reduce this to a short handoff.** All older October 28, October 26–27, October 21 and earlier sections lower in the file are historical and **must not override this October 29 checkpoint**, although their detailed background and approvals remain preserved. Before any action, read the *latest real GitHub `main`* versions of `README.md`, `Fishing_Context.md`, `Fishing_TODO.md`, `Fishing_Decision_Log.md` and this bootstrap; also read the still-open FISH118 branch and evidence. Do not restart completed P0/P3 or repeat prior user approvals.

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

### First actions in the new chat

- Confirm current repo `ginosega/fishing` latest main (will advance when this docs-only handoff PR merges), draft PR #263 (`feature/fish118-p3-mock-publisher`) and #262, and both private sandbox/public release status. The handoff intentionally **did not merge application code**. Any conflicts arising from this new documentation baseline should be reconciled source-aware instead of overwriting new main edits.
- Before future deployment read exact FISH118 source and guarded local deployment scripts; do not re-run successful Wrangler migrations, repeat P3/PR validations, or republish `P3 Test Lake` merely to inspect status. User-approved interim source tests can proceed without frequent approvals, but no secrets, providers, or public cutover are implicitly approved.
- Resume with the **approved but not yet implemented ~5s Connection Status automatic polling enhancement**, with retained manual fallback, only when active/visible/authenticated; robust terminal, offline, device and signout behavior. Preserve Android Chrome pilot and desktop Edge tests; integrated installed Android PWA sign-in/callback still needs separate proof.
- Performance under 60s is **provisional**: #26 59s user, 56s audited server; signed check webhook 202 `accepted:true`; optimized CI and merge watchdog working, but 1s margin and no repeatability claim. Preserve data; next normal publication timing provides additional evidence.
- **Transition is now complete; proceed with planned engineering work rather than requesting another handoff or reopening approved planning.** Never use private Pilot success as evidence that public canonical V3 is live.

---

## AUTHORITATIVE NEW-CHAT START — October 28, 2026 (read FIRST; later older Oct 21/19 sections are historical)

I am continuing the persistent **Fishing** project, specifically FISH-TODO-118 Fishing Companion v3 D3 acceptance and delivery architecture work. This is a **full new-chat transfer**, not a request to restart planning. **Do not ask me to reapprove already approved milestones or repeat already completed source checks/publications.** Work in Chat mode by default. Restore actual current GitHub main, PRs, production, private pilot and latest source CI before acting.

**GitHub snapshot Oct 28 (reverify in the new chat):** pre-handoff `main` = `daab53b72de8dcf749e5fbc76e2aca0884805dd4`; open [draft PR #262](https://github.com/ginosega/fishing/pull/262) (AUTH-P0), open [draft PR #263](https://github.com/ginosega/fishing/pull/263) (FISH118 P3/D3 isolated publishing, latest verified source head `8b8715afdf75120dbfa2d4a2ab2a1aec6956e9b7`, isolated source CI [#705](https://github.com/ginosega/fishing/actions/runs/40748114768) SUCCESS), and unrelated open [PR #268](https://github.com/ginosega/fishing/pull/268) (weight-section adjustment). **Do not merge draft #263 wholesale, edit unrelated #268, or assume draft-source CI is a production deployment.** The five-root-docs handoff is prepared on docs-only branch `docs/fishing-chat-handoff-2026-10-28`; after its eventual merge main will advance without updating hosted V2.

Production V2: [main Full Application run #672](https://github.com/ginosega/fishing/actions/runs/39990546320) succeeded October 23, 2026, source `4a1a8c44317b56a4d47e818db9cd2b5587a966d8`, verified hosted release `504d615b2bef361da06d655ee621d43a`, **577 hosted files / 100 Gear / 60 KB / 12 Catches**, GitHub Pages hosted-byte/release identity and browser validation passed. This hosted source is NOT the Oct 28 `main` commit; documentation/experimental work does not itself publish the site.

**Scope and authority:** FISH-TODO-118 Fishing Companion v3 retains the **October 19 approved requirements, technical architecture, UX and plan**, plus the **October 27 V3-SAVE-09 amendment**: routine valid text-only Gear/KB/Catch Save-and-Publish must reach independently publicly retrievable, SHA/hosted-byte-verified canonical Live **within 60 seconds measured from the owner's click** for every normal-operation acceptance run. No per-save human approval/signature, no false early Live, no skipped security/CI/merge/hosted evidence. Final public V3 cutover, material hosting/routing/permission/cost changes require distinct consequential approval. The owner preapproves *routine interim verification/workflows* and prefers few checkpoints; never interpret that as permission for cutover or bypassing required protections.

**D3 private pilot:** Owner-only test origin `https://fishing-auth-p0-test.ginosega.workers.dev`, pilot route `/__d3_pilot__/` (OUTSIDE installed `/fishing/` PWA scope). Both sandbox Gear and Knowledge Base samples became **Live · sandbox verified**. KB operation `p3_5527208d-a67c-4a2c-876d-9edaee353bc8`, private [PR #18](https://github.com/ginosega/fishing-p3-sandbox/pull/18), exact merged/main SHA `97f68efc932084f2e607480c12cee37a94f81758`, verified release ID `1dcb68bab0f88638b009d3ce13d69426`. Owner ran a **read-only remote D1 audit** PASS: seven transitions `Accepted → Validating → Checking → Merging → Deploying → Verifying → Live`, no replay/manual D1 edit. Recovery fixed missing GitHub App PR merged/SHA summary data using GET merged-status 204 + exact private-main/commit-tree/parent/file evidence. No new publication required. [D3 acceptance and performance report](experiments/p3/preview/D3_Acceptance_And_60s_Delivery_Evidence_2026-10-28.md).

**Real Android Chrome owner pilot:** Signed-out private page showed Not Found (expected), GitHub OAuth silently reused authorization and opened owner pilot, `P3 Test Lake` KB contents survived reload, and Sign Out action worked. An initial **cross-device publication-status bug** (PC/Edge had local receipt; Android did not) was fixed by an authenticated read-only owner/repository-scoped latest D1 operation endpoint + safe browser discovery. Owner explicitly confirmed the **publication status message now shows and Check publication status works on Android**; draft source tests #705 passed, and the private pilot fix was deployed. Exact post-fix Worker version was not supplied—inspect it if needed. This closes that defect but is **NOT installed Android V3 PWA acceptance**. [Device evidence](experiments/p3/preview/D3_Owner_Device_Acceptance_2026-10-28.md).

**60-second blocker:** nine successful existing `main` content-only GitHub Pages Actions runs took **85–183 seconds from Actions run creation to hosted verification**, *before* Save click/PR/check/merge. Current five-minute Cron cannot be the normal driver; removing Cron alone cannot make the present Actions/Pages path compliant. Evaluate isolated event-driven progression + durable recovery-only Cron, instrument real click-to-public-proof timings, and benchmark (A) minimized but fully verified Pages lane vs (B) versioned same-origin verified-content delivery sourced from authorized canonical GitHub commits. Candidate B requires separate approval for material production routing/hosting; no synthetic sandbox Live substitution. See D3 report. Do not claim V3-SAVE-09 satisfied.

**Next actions after new-chat restore:** Reverify `main`, open PRs, latest successful Pages hosted evidence and private pilot status. Continue inside existing finite **D1–D6** delivery sequence, not more `P3-N` submilestones. D3 remains OPEN only for remaining private owner/device negative/session edges (post-signout direct-route denial, relaunch/re-auth, wrong-owner/anonymous and conflict reliability evidence) and **integrated installed Android Chrome V3 PWA** OAuth/session/status acceptance; browser-tab pilot cannot close PWA gate. Work through real 60-second public delivery architecture/measurements before production cutover. Do not repeat already verified KB PR #18, rerun migration or ask for approvals already granted. Do not invent asynchronous work. Keep V2/gear/KB/Catch and non-V3 equipment TODOs intact.

**Other active fishing work:** Preserve FISH-TODO-008 RVR119 under-seat tray backorder, -014 KastKing box, -040 Garmin Force Current/Redodo 24V 50Ah commissioning and removable 40A protected kayak wiring, calibration/functional testing, storage bin foam; retain all other still-open tackle/research/KB tasks. New October 26 completed kayak wiring report does NOT establish motor on-water commissioning. Do not infer purchases or completion.

**Operating protocol for this chat:**

1. Read the complete five canonical root files from the latest approved GitHub `main` in order: `README.md`, `Fishing_Context.md`, `Fishing_TODO.md`, `Fishing_Decision_Log.md`, this complete `Fishing_New_Chat_Bootstrap_Prompt.md`. For the live D3 work also inspect draft PR #263 and the two linked private-pilot acceptance documents. If a docs-only handoff PR has not yet merged, use its branch only for handoff context while distinguishing it clearly from canonical `main`.
2. Preserve the October 19 requirements/design/UX/planning approvals, October 27 `V3-SAVE-09` 60-second acceptance gate, and October 25 finite D1–D6 reset. No per-item signing/confirmation; no iPhone testing required (Android Chrome/Windows Edge/Chrome are the real devices).
3. Confirm the D3 owner Android cross-device status issue is FIXED, privately deployed and owner tested. Do not mistake private `/__d3_pilot__/` for an installed `/fishing/` V3 PWA; outstanding integrated installed-PWA session/logout/return and negative flows still count. Do not resubmit/remerge KB PR #18 or mutate D1 manually. Keep private `Live` distinct from public canonical Live.
4. Work toward satisfying the *actual* ≤60 second click-to-hosted-verified normal content publication gate, not merely reducing Cron delays. Do not bypass existing branch protections, GitHub App least privilege, exact CI head/merge proof, idempotency, hosted byte verification, or source-of-truth GitHub.
5. Keep the existing public V2 hosted site unchanged unless the user approves a consequential new deployment/cutover; no material hosting/routing/cost change without explicit approval. Do not modify unrelated open PR #268. User preapproves routine interim workflow/validation runs and asks for minimal pause/approval prompts.
6. Keep Gear/KB/Catches PWA editorial data and unrelated fishing gear/open tasks intact. For future transfers, update the five root project files in GitHub and provide a link to the *full* bootstrap—never replace it with a compact prompt.

**Current specific checkpoint (at source head `8b8715afdf75120dbfa2d4a2ab2a1aec6956e9b7`):** D3 cross-device Android owner-status fix source and tests passed isolated CI #705, user confirmed status message and button now work. The root handoff documentation is separately handled via docs-only branch/PR; this source head can change in the meantime. This is NOT a request to deploy that old head or to repeat the successful owner check.

---

You are continuing my persistent **Fishing** project. The durable repository is `ginosega/fishing` on GitHub. Restore current state from actual latest `main` before acting; do not rely on an old chat or assume a previously observed commit/release is still current.

## CURRENT FULL NEW-CHAT START — October 26–27, 2026 PDT: D3 read-only pilot HOME verified, Gear/KB acceptance next

**THIS IS THE LATEST AUTHORITATIVE TRANSFER SECTION.** I, the owner, have copied the **ENTIRE** up-to-date canonical `Fishing_New_Chat_Bootstrap_Prompt.md` from public GitHub `ginosega/fishing` `main` into a new Fishing project chat. Resume in Chat mode, with full prior project context restored from the repository. All earlier historical "CURRENT/NEXT" blocks below (including old D2 parked-only, D3 not deployed, P3-29 or R1/R2 instructions) are superseded. **DO NOT recreate completed source, trigger old deployments or replay the completed D2 operation.** Do not mistake this full prompt for a brief handoff summary.

### First required step: restore exact authoritative GitHub and hosted state

1. Fetch actual **latest** GitHub `ginosega/fishing` `main` SHA, then read all five complete canonical root files **in order**: `README.md`, `Fishing_Context.md`, `Fishing_TODO.md`, `Fishing_Decision_Log.md`, and **entire** `Fishing_New_Chat_Bootstrap_Prompt.md`. Sections dated Oct 26–27 and later supersede earlier versions without deleting historical evidence. This handoff intentionally adds docs only; the source and hosting can change asynchronously.
2. Fetch exact head/status for open PRs [#263 DRAFT V3 D3 work](https://github.com/ginosega/fishing/pull/263), [#262 DRAFT AUTH-P0](https://github.com/ginosega/fishing/pull/262), and unrelated [#268](https://github.com/ginosega/fishing/pull/268). Do **not** wholesale merge #262/#263, close, mutate or overwrite #268, or infer that an isolated passing CI deploys production. Public `main` observed **before this documentation handoff** `0c7d70e280d44f3ec484d427b6888397ffcd621b`. Draft #263 source + detailed D3 receipt checkpoint `db0c4e4d85ff50629335c3da537580ade6747494` observed after adding the live D3 closeout; reverify current head. Latest verified code/head source [CI #610](https://github.com/ginosega/fishing/actions/runs/40445715656) passed from `0a383a23a1b49acd99e46e612ac4770ee7c9eb24`; later changes to #263 were documentation-only at time of handoff. Private `ginosega/fishing-p3-sandbox` `main` was `89be79a9c933dd36bd909edd585091232831c835`.
3. Read detailed [D3 Owner Authoring checkpoint](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/D3_OWNER_AUTHORING_START_2026-10-26.md) on latest #263 head, plus [finite D1–D6 plan](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/FISH118_V3_Finite_Delivery_Reset_2026-10-25.md), [D1 selected architecture](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/D1_V3_Architecture_Consolidation_2026-10-25.md), [approved requirements audit](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/D1_V3_Requirements_Compliance_Audit_2026-10-25.md), and [D2 verified closeout](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/D2_SANDBOX_VERIFIED_CLOSEOUT_2026-10-26.md). Those detailed files live on **draft PR #263**, not public canonical `main`.
4. Verify live Worker read-only state and latest public V2 hosted bytes using appropriate tools/user-provided evidence when necessary. GitHub connector cannot control the user's Cloudflare dashboard. Do not request private keys, tokens, HMAC secrets, cookies or OAuth codes. Do not ask user to rerun completed deployment scripts.

### Proven Cloudflare and browser state at transfer

**Live Worker:** `fishing-auth-p0-test`, production URL `https://fishing-auth-p0-test.ginosega.workers.dev`, deployed **`91f601dd-b960-4f7b-91e7-01abd0399030`** as of owner's successful Oct 26 evening verification. It serves the protected read-only owner pilot on `/__d3_pilot__/`, *not* a generally published V3 app. Owner's Windows PowerShell ran one-time `tools/deploy-d3-csp-repair.ps1` after exact-code CI #610 passed. Wrangler **4.153.0**, current Worker bundle upload **1018.90 KiB, gzip 256.43 KiB**, startup 104 ms. The script ended with `SAFE_CSP_REPAIR_VERSION: 91f601dd-b960-4f7b-91e7-01abd0399030`, `PASS: Anonymous private routes denied, publication OFF, public V2 unchanged`, and `PASS: Owner-only strict CSP repair deployed with no new privileges`. **The deployment is DONE. Do not repeat it.**

**Exact enabled flags:** `D3_PILOT_ENABLED=true`, `D3_READ_TOKENS_ENABLED=true`. **Disabled:** `D3_WRITE_ENABLED=false`, `D3_RUNNER_ENABLED=false`, `D3_TEST_HOST_ENABLED=false`; `D2_WRITE_ENABLED=false`, `D2_RUNNER_ENABLED=false`, `D2_READ_TOKENS_ENABLED=false`, `D2_TEST_HOST_ENABLED=false`. No Cron, no GitHub writer, no test-host uploader. D1 bindings unchanged: `DB → fishing-auth-p0` (owner sessions), `OPERATIONS_DB → fishing-p3-sandbox` (durable operations). The same encrypted D2 Github App PEM and host-probe secret were reused on the same protected Worker; no secret value was moved, exposed, rotated or copied. Existing AUTH/CSRF owner session. Owner-only pilot JS is an embedded Text module behind an authenticated route, 277633 bytes, SHA-256 **`72b5b70fdd52fcf9f08cf18bac9c56ec342265d299aefbf70d2bd708a5503b9b`**. Strict security policy still disallows `unsafe-eval` and `unsafe-inline`; AJV 2020 canonical schema validators are precompiled at Node build time; Windows CRLF normalizes in memory to give the identical checked pilot bytes. No D1 migration, GitHub sandbox publication or canonical public V3 change occurred. The old Worker **`218ecd67-d00e-4fe8-b686-886034654418`** failed browser Ajv CSP and is **not** current; earlier hard-off version `56f775f6-ca91-464e-be9b-40ec2bed40e6` and D2 parked `82b678b2-b024-4428-922c-d2363f2bcbc2` are prior recovery identities.

**Exactly what the owner visually verified:** Edge visited `https://fishing-auth-p0-test.ginosega.workers.dev/__d3_pilot__/` and showed a **fully styled, owner-only sandbox HOME** with private Gear/KB banner, green Connection Status indicator, shared site header, Alpine hero graphic, and tiles **My Gear**, **Knowledge Base**, **Catch Log**. They said, “That worked,” and supplied screenshot. This proves navigation now returns content (prior 401 solved) and browser bundle initializes (prior Ajv `unsafe-eval` blocked compilation/inline styles solved). **It DOES NOT prove the three content screens or Connection Status owner details were tested**. Do not label D3 read-only acceptance COMPLETE. Nothing about actual Gear/KB/Catch item counts or absence of editing controls is established by the pictured HOME alone.

**IMMEDIATE NEXT STEP (browser test, NO DEPLOY):** Have owner open each test UI screen on the *same already working pilot* and verify:
- **My Gear:** private sandbox record `P3 Test Rod D2 Verification`, no full public V2 Gear collection, no Add/Edit/Save and Publish in read-only mode.
- **Knowledge Base:** private sandbox location `P3 Test Lake` with synthetic fixture notes, no full public V2 KB collection, no authoring controls.
- **Catch Log:** zero private sandbox catches (not 12 public V2 catches).
- **Connection Status:** owner correctly signed in (existing AUTH-P0 session), read-only online-only pilot, sign-out/session renewal as supported; no editing/publishing actions and no exposed tokens.
- **Reliability/negatives:** normal Edge refresh, no CSP console exceptions; anonymous and cross-origin calls forbidden, published V2 `/fishing/` unchanged.
Ask only for the minimum evidence/screenshots required; do not request credentials, HAR with cookies or a needless Cloudflare redeployment. A standalone `/__d3_pilot__/` outside `/fishing/` service-worker scope does **not** satisfy installed Android PWA testing or persistent offline-reader requirements. Distinguish browser UI acceptance from direct source/GitHub proof.

**Actual public Fishing Companion remains V2.** The last independently verified successful canonical `main` production workflow [#672](https://github.com/ginosega/fishing/actions/runs/39990546320) published release `504d615b2bef361da06d655ee621d43a`: **577 files, 100 Gear, 60 KB, 12 Catches**, main application source `4a1a8c44317b56a4d47e818db9cd2b5587a966d8`. User's D3 scripts verified byte-identical hosted public index after deployment; documentation-only commits do not publish a new V3 product. Recheck actual hosted/public release if changed. Current V2 installed PWA/service-worker/offline and copy-paste editor remain separate.

### Finite roadmap and what remains beyond current pilot

- **D1 COMPLETE** architecture, AUTH-P0 plus publishing consolidation and signed-off requirements/UX/design/security model (October 19–25).
- **D2 COMPLETE** one genuine owner-authorized synthetic private-sandbox Gear text edit through D1 durable Accepted, GitHub PR #16, exact-head GitHub Actions CI [#40288266980](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40288266980), normal merge to private `main` SHA `89be79a9c933dd36bd909edd585091232831c835`, verified bytes `73362eb77bd59219aa6f78fb93e9d47b`, D1 `Live`. Original operation `p3_343ef7ba-1c87-4d5d-a2ad-92e91eab420f` and once-reconciled `merge_attempted` ambiguity were completed safely. **NEVER resubmit, replay or remigrate D2**.
- **D3 IN PROGRESS:** real owner/OAuth/Connection Status protected private pilot deployed and home visually correct; still needs four read-only content/session/negative UI checks above, then **real generic owner Gear + KB Add/Edit one Save and Publish** using sandbox repo **numeric ID 1430581407**, immutable source snapshot, source-aware validation, D1 idempotency and lease, short-lived scoped GitHub App tokens, draft PR → exact-head CI → normal merge → hosted byte proof. Owner-friendly status across navigation, fail-closed ambiguous merges/no duplicate retries, offline denial. Existing source-only adapters and tests on draft #263 are NOT evidence of working live writes. No Writer/Runner gates enabled and no general V3 production cutover. Windows AND installed Android PWA owner acceptance remains.
- **D4 NOT COMPLETE:** original Gear/KB/Knot image upload, atomic ordered Knot sequences and Catch Add/Edit (no Catch photos/GPS).
- **D5 NOT COMPLETE:** persistent Automatic/Work Offline *reading* preference, Connection Status controls, Markdown Picture Viewer, release/service-worker/offline/stale-session resilience, optional safe drafts. No offline publishing queue.
- **D6 NOT COMPLETE:** signed-off requirement traceability, secure full integration on Windows/installed Android, release/rollback, **separate explicit approval** before public canonical V3 rollout. Keep the V2 rollback path.

**Behavior/security:** Anonymous visitors see public Fishing read-only by default and generally no visible Sign In. Only owner signs in via discreet **Connection Status** link, valid session restored automatically; one Save and Publish, no second signature/confirmation step; new GitHub write must be scoped to private sandbox until new owner approval and cannot bypass checks/merge/byte proof. The owner preapproves routine engineering source edits/isolated CI runs, not privileged Cloudflare changes, GitHub App write activation, secrets, first consequential publishing or final production cutover. Keep current D3 writer, runner and host flags OFF. Preserve old exact status receipts and avoid false “public Live” claims. No arbitrary new P3-N micro-milestones or repeating already completed steps. Do not merge #263 wholesale into public main.

**Other fishing backlog remains valid:** RVR119/Force Current motor, Redodo 24V 50Ah battery wiring/fuses/connectors/charger, under-seat tray availability, foam protective case, rod/tackle/fishing catches and KB items remain in historical sections of `Fishing_TODO.md` and `Fishing_Context.md`. Preserve all existing OPEN and WAITING states; do not infer a purchase merely from a discussion. FISH108 v2 Fast Content Release vs Full Application Release policy stays binding. Owner uses Chat by default and prefers continuous work without artificial approval pauses.

### Transfer/continuation convention

The owner requested this **complete GitHub documentation handoff**. Canonical five root files must be refreshed and merged as a **documentation-only PR** without deploying V3 or changing app code; this bootstrap must stay the complete document (do not shorten/remove historical blocks). At the beginning of the next chat, fetch latest `main` and these full docs, reread the D3 checkpoint on latest draft #263, then resume at owner browser read-only content acceptance. No more approval questioning for routine tests; ask for specific consequential scopes only. Do not claim a future handoff is done before verifying the documentation merge.

---

## CURRENT FULL NEW-CHAT START — October 26, 2026 PDT: D2 completed/parked; D3 active

**THIS NEW SECTION IS THE LATEST AUTHORITATIVE CHAT-START BLOCK.** I, the owner, copied the **ENTIRE canonical `Fishing_New_Chat_Bootstrap_Prompt.md`** from up-to-date public `ginosega/fishing` `main` into a new Fishing project chat. Do NOT treat this as an abbreviated prompt. Earlier October 25 D2 activation, October 24 P3-29/P3-30 and R1/R2, or October 21 "next" instructions preserved below are **HISTORICAL**. Work in normal Chat mode.

### Required restoration (before implementing)

1. Fetch **actual latest** `ginosega/fishing` `main` SHA, then read all five complete root Markdown files **in order**: `README.md`, `Fishing_Context.md`, `Fishing_TODO.md`, `Fishing_Decision_Log.md`, **entire** `Fishing_New_Chat_Bootstrap_Prompt.md`. New sections in all files supersede prior dated "CURRENT" checkpoints. Reverify everything whose SHA could have moved during handoff.
2. Check all open PRs and exact head/CI: [draft AUTH #262](https://github.com/ginosega/fishing/pull/262), [draft trusted publisher+D3 #263](https://github.com/ginosega/fishing/pull/263), unrelated [#268](https://github.com/ginosega/fishing/pull/268). Recheck private `ginosega/fishing-p3-sandbox` main and latest successful main production Pages workflow plus actual hosted-release bytes. **Do not merge #262/#263 wholesale** or touch #268. A handoff documentation merge does not establish a new V3 application release.
3. Re-read the approved [finite D1–D6 delivery plan](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/FISH118_V3_Finite_Delivery_Reset_2026-10-25.md), [D1 architecture](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/D1_V3_Architecture_Consolidation_2026-10-25.md), [requirements audit](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/D1_V3_Requirements_Compliance_Audit_2026-10-25.md), [D2 VERIFIED closeout](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/D2_SANDBOX_VERIFIED_CLOSEOUT_2026-10-26.md), and **[D3 implementation checkpoint](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/D3_OWNER_AUTHORING_START_2026-10-26.md)**. These are on experimental **draft PR #263**, not necessarily public main. Inspect actual source and tests on its current head rather than relying on dated prose.
4. Honor October 19 signed-off v3 requirements/technical design/UX/implementation plan, October 22 AUTH-P0/G1 feasibility acceptance and its limited waivers. Do not repeat completed D2, R1–R4 migrations, or v2 FISH115–117 releases. Don't create arbitrary P3-42+ checkpoints or per-edit owner ECDSA signing ceremony. Continue in six finite deliverables D1–D6.

### October 26, 2026 GitHub and D1/Cloudflare verified checkpoint

**Authoritative latest checkpoint; all October 25 `D2 IN PROGRESS` and October 24 `NEXT P3-N` instructions below are HISTORICAL.** New chats must read the five root handoff files from the **actual latest `main`**, recheck live GitHub/host status, then resume D3; do not assume the SHA below remains current after this documentation PR merges.

**Verified GitHub before the documentation merge:** public `ginosega/fishing` `main` `64503470a2db7364a437b5e1eb0f4c120da61644`; private `ginosega/fishing-p3-sandbox` `main` `89be79a9c933dd36bd909edd585091232831c835`; FISH118 development [draft PR #263](https://github.com/ginosega/fishing/pull/263) exact head `4fdc75bb77dd5452b61866d1401c573569e130f2` with [isolated source CI #467](https://github.com/ginosega/fishing/actions/runs/40349790051) **SUCCESS**. Owner-approved AUTH-P0 feasibility [draft PR #262](https://github.com/ginosega/fishing/pull/262) remains unmerged. Unrelated [PR #268](https://github.com/ginosega/fishing/pull/268) must be preserved. These experimental branches are NOT wholesale production merge candidates.

**Public V2 remains the live Fishing Companion.** Latest successful production `main` workflow was [#672](https://github.com/ginosega/fishing/actions/runs/39990546320), source `4a1a8c44317b56a4d47e818db9cd2b5587a966d8`, hosted release `504d615b2bef361da06d655ee621d43a`, **577 hosted files / 100 Gear / 60 KB / 12 Catches**. Documentation updates do not constitute V3 rollout. FISH115–117 v2 fixes remain released; FISH108 still governs content vs application release lanes. Confirm latest hosted release independently if source/deploy state changes.

**D1: completed** at approved architecture/design level. The fixed six-deliverable roadmap remains **D1–D6**, never new open-ended P3-numbered milestones. **D2: COMPLETE** end-to-end for a single owner-authenticated, sandbox-only Gear text edit. D1 operation `p3_343ef7ba-1c87-4d5d-a2ad-92e91eab420f` reached `Live`, `reason_code=NULL`, GitHub [private sandbox PR #16](https://github.com/ginosega/fishing-p3-sandbox/pull/16) merged, exact-head [workflow 40288266980](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40288266980) passed, merge SHA `89be79a9c933dd36bd909edd585091232831c835`, verified hosted-byte release ID `73362eb77bd59219aa6f78fb93e9d47b`. A successful GitHub merge briefly lacked its D1 receipt (`merge_attempted`); the **one-time, exact-match read-only-proof-based reconciliation already succeeded**, after which Cron reached Live. **Never resubmit this operation or rerun reconciliation**. Full [D2 verified closeout](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/D2_SANDBOX_VERIFIED_CLOSEOUT_2026-10-26.md).

**D2 Cloudflare test Worker safely PARKED by owner.** `fishing-auth-p0-test` at `https://fishing-auth-p0-test.ginosega.workers.dev`, deployed version `82b678b2-b024-4428-922c-d2363f2bcbc2`: `D2_WRITE_ENABLED=false`, `D2_RUNNER_ENABLED=false`, `D2_READ_TOKENS_ENABLED=false`, `D2_TEST_HOST_ENABLED=false`; deployed triggers have **no Cron**. Existing `DB=fishing-auth-p0` and `OPERATIONS_DB=fishing-p3-sandbox` bindings remain, and verified D1 data is retained. Do not redeploy or reactivate D2 for the next chat; this shutdown is complete. No public canonical source was changed by this experiment.

**D3: IN PROGRESS, not deployed or accepted.** The D3 source work is on draft #263: `experiments/p3/preview/src/d3-authoring-client.mjs` (same-origin session/CSRF and durable receipts), `d3-publication-lifecycle.mjs` (original idempotency key, no silent retries or storage of packages/credentials, status persistence), `d3-trusted-gear-kb-candidate.mjs` (sandbox-only source-aware text Gear edits and KB adds/edits, canonical/Markdown/conflict safeguards); gated opt-in `publishChange` in `pwa/src/editor.mjs`, and opt-in owner-authoring restrictions in `pwa/src/ui.mjs`. Production app `pwa/src/app.mjs` **does not activate `ctx.v3`**. The real trusted GitHub reader, generic sandbox Gear/KB PR/runner, same-origin Connection Status sign-in UI and end-to-end D3 tests **are not yet implemented or deployed**. D3's earlier isolated test failure was fixed; exact-head **CI #467 passed**. [D3 checkpoint](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/D3_OWNER_AUTHORING_START_2026-10-26.md).

**NEXT ACTIVE WORK:** Finish **D3**, without an approval stop for routine source/CI work: implement a trusted immutable private-sandbox snapshot loader, securely connect source-aware Gear/KB add/edit candidate to guarded idempotent D1 + GitHub PR/check/merge + actual hosted proof, implement Connection Status-only owner sign-in/restore/Sign out and real `Save and Publish` UI with durable status after navigation, verify anonymous/unauthorized/deep-link denial, conflict/expired/offline/ambiguous-save behavior, and run Windows + Android installed-PWA integration tests. Keep privileged runtime gates off until specific live authorization/security checks; do not expose private tokens. Move next to **D4** uploads and Catch editing, **D5** offline/Connection Status/viewer/release reliability, **D6** integrated acceptance and separately approved production cutover. The owner approved using intended production Cloudflare infrastructure rather than building a separate preview website, accepts temporary downtime, but **not public-main writes, bypass, data loss, unverified Live claims or an unapproved final cutover**. No new per-save owner signing ceremony.

**Other Fishing work:** Do not discard existing unresolved equipment, kayak/Force Current commissioning, purchase availability, catching and KB items elsewhere in this file and `Fishing_TODO.md`. Do not infer purchases, silently close active items or reopen completed v2 releases. The user requested this complete GitHub-based transfer and will copy the **entire canonical Bootstrap prompt**, not a short substitute.



### Concrete NEXT action — finish D3 without waiting for routine approvals

**D3 source-only implementation is present on draft #263 but is not an authorized/generally enabled GitHub writer, and not an integrated deployed V3 PWA.** In the former chat, `experiments/p3/preview/src/d3-authoring-client.mjs`, `d3-publication-lifecycle.mjs`, `d3-trusted-gear-kb-candidate.mjs`, opted-in Gear/KB `publishChange` in `pwa/src/editor.mjs`, and guarded Add/Edit in `pwa/src/ui.mjs` were added and passed exact-head isolated CI #467. **`pwa/src/app.mjs` does not enable the V3 UI.** The D2 real runner still accepts only the synthetic `gear/p3-test-rod` fixture; no generic Gear/KB broker activation was performed.

1. Implement and test a **trusted immutable private-sandbox GitHub source snapshot loader**, including complete canonical Gear/KB/Catches JSON, Markdown, referenced file inventory, exact repo ID/ref/commit/tree/blob hashes and race/size limits; wire it into the D3 source-aware Gear/KB text candidate. Do not trust browser-reported source or silently overwrite concurrent changes.
2. Expand the guarded GitHub/D1 publishing broker and ordinary PR + exact-head CI + merge + hosted-byte proof to test **Gear and KB Add/Edit** in **private sandbox repository ID `1430581407` only**. Retain owner GitHub numeric-ID session, first-party CSRF, repo-scoped short-lived App token, idempotency, crash/merge-attempt safety, exact release lineage and honest `Accepted` vs sandbox `Live`; do NOT weaken the D2 one-record guard ad hoc or send writes to public canonical main.
3. Integrate Connection Status-only discreet `Sign in with GitHub`, silent valid-session restoration, owner-only Add/Edit, Sign out, and **one Save and Publish (no second approval/signature)**. Keep the dirty edit after unknown/malformed submission; show persistent durable operation status after navigating away and reopening. No Copy Changes in opted-in V3 mode; current V2 keeps its existing editor until final authorized cutover. Distinguish verified sandbox `Live` from public production.
4. Pass security denial/conflict/duplicate/expiry/offline/read-only and real Windows/Android installed-PWA owner sign-in/callback acceptance against intended production Cloudflare gateway, using sandbox content/isolated test paths. User preapproved routine source/CI; ask for actual Cloudflare deployment command/device tests only if required. No separate preview website; temporary site downtime is tolerated, not unapproved public-main writes or loss of rollback.
5. Proceed to **D4** original-image and Knot atomic browser upload + Catch Add/Edit (no Catch photos/GPS); **D5** persistent Automatic/Work Offline reading mode, Connection Status, viewer, release reliability; **D6** full integrated acceptance and **separately explicit owner-approved public production V3 cutover**. No queued offline publishing, multiuser roles or unapproved feature expansion.

**Important D2 do-not-repeat:** the sandbox operation was submitted exactly once; the post-merge D1 `merge_attempted` state required one independently proven merge receipt reconciliation, completed successfully. Sandbox `Live` was then verified. Owner deployed Cloudflare **parked Worker version `82b678b2-b024-4428-922c-d2363f2bcbc2`**, with all four D2 flags false and NO Cron. **Do not resubmit, remigrate, rerun the reconciliation SQL or reenable the finished scheduler.** Existing test D1 data must be retained.

### Owner working agreements and other project work

- I preapprove **interim source edits, standard GitHub PR/CI/validation work, and internal runs**, without repeated "Proceed?" pauses. Respect separate consequential permissions/security gates, first public-canonical GitHub write and final V3 release approval. Chat mode is default; use Work mode only for real GUI/browser capability needs, and ask me to perform local PowerShell/Android tests when the tools cannot. My known Windows checkout for approved Wrangler commands is `C:\\Users\\ginos\\fishing-d2-deploy\\experiments\\p3\\preview`.
- Keep **all unrelated fishing priorities and purchase uncertainty**: Bonafide RVR119 / Garmin Force Current, Redodo 24V 50Ah, trolling wiring/charger/storage foam, under-seat tackle tray availability, fishing records, KB and Science of the Strike. The older complete sections below and `Fishing_TODO.md` retain their details. Don't infer purchases or falsely close open items.
- **Future full chat transitions:** refresh actual GitHub/production state, update the five official root Markdown files via the eligible documentation-only PR under branch rules, preserve previous sections as clearly historical, and give me the **canonical full Bootstrap prompt URL** to open and copy the ENTIRE contents. Do not supply only a short handoff.
- **First reply of this new conversation:** acknowledge the verified D2 outcome and parked Worker, report freshly checked `main`, draft #263 head and CI, and continue the D3 implementation without another general approval request.

---


## HISTORICAL FULL NEW-CHAT START — October 25, 2026 PDT, D2 real-publication activation gate

**THIS IS THE MOST RECENT AND AUTHORITATIVE START SECTION.** I (the owner) copied the **ENTIRE canonical Fishing_New_Chat_Bootstrap_Prompt.md** from public main into this new chat, not an abbreviated handoff. The older October 24 “CURRENT NEW-CHAT START/P3-29/P3-30,” R1/R2, and October 21 instructions farther down are **HISTORICAL and SUPERSEDED**. Do not follow their obsolete “NEXT” directions. Work in normal Chat mode unless I ask otherwise.

### Required restore before any work

1. Read the actual latest public ginosega/fishing **main versions of all five root files IN ORDER**: README.md, Fishing_Context.md, Fishing_TODO.md, Fishing_Decision_Log.md and this ENTIRE Bootstrap Prompt. This handoff was prepared on a docs-only branch and merged under the established SOP; always fetch the new exact main SHA.
2. Inspect all open PRs (especially **DRAFT #262 AUTH-P0**, **DRAFT #263 FISH118 publishing**, unrelated **#268 weight edit**), exact CI head of #263, private ginosega/fishing-p3-sandbox main, current provider evidence and most recent real production Pages release. Do not merge the V3 draft source PRs or change #268 simply to resume work.
3. Read the current [finite D1–D6 delivery plan](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/FISH118_V3_Finite_Delivery_Reset_2026-10-25.md), [D1 architecture](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/D1_V3_Architecture_Consolidation_2026-10-25.md), [D1 signed-off compliance audit](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/D1_V3_Requirements_Compliance_Audit_2026-10-25.md), [D2 initial integration checkpoint](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/D2_Guarded_Owner_Session_Operations_Source_2026-10-25.md), and **MOST IMPORTANT** [D2 interrupted-run recovery and operational gate](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/D2_Interrupted_Run_Recovery_and_Operational_Gate_2026-10-25.md). These documents are on **draft PR #263**, NOT merged public main. Read current source rather than treating prose as a deployed system.
4. Do not redo approved October 19 requirements/design/UX/staged plan, October 22 AUTH-P0/G1 owner feasibility acceptance, R1–R4 D1 migrations, P3-29 static-disabled Worker, Access tests, or P3-37 read-only OIDC. Do not create P3-42+ arbitrary milestones.

### Verified GitHub and V2 live state before transition

**Verified before this documentation handoff (October 25, 2026 PDT):** public production main was 587b978118df64cc9ec584375c458fa2b10fecfa; private ginosega/fishing-p3-sandbox main was 69b236c8af663cdce687dc855bb117a01874060a; public draft [PR #263](https://github.com/ginosega/fishing/pull/263) was OPEN, DRAFT at f2673d2c3fc343c8ebce44c0e306429c8be387ab; owner-accepted AUTH-P0 [PR #262](https://github.com/ginosega/fishing/pull/262) was also OPEN/DRAFT; unrelated [PR #268](https://github.com/ginosega/fishing/pull/268) remains open and must be preserved. After this docs-only PR merges, re-read GitHub main/PRs/hosted deployment to establish NEW exact SHAs; these are pre-handoff observations.

**Actual live V2 application:** latest verified full Pages release remains [main workflow #672](https://github.com/ginosega/fishing/actions/runs/39990546320), source 4a1a8c44317b56a4d47e818db9cd2b5587a966d8, release 504d615b2bef361da06d655ee621d43a, 577 hosted files (100 Gear, 60 KB, 12 Catches). A documentation-only main merge does NOT publish a V3 build or establish a new release; verify this independently after merge. FISH115–117 remain released; FISH108 governs eligible content-only changes.

**Operational safety:** Existing isolated D1 migrations R1–R4 were completed/reconciled (last verified seven tables, four indexes, five triggers; application tables empty at that time); do not reapply or restore them or expose a private recovery bookmark. The P3 command bridge and Access ingress Workers remain hard-disabled/unrouted with production/preview URLs OFF at the last verified postflight [#40166553523](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40166553523). The live [GitHub-signed OIDC proof #40207347824](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40207347824) verified only its exact read-only manual workflow, not a future privileged publisher. Historical Access/App metadata evidence is not a deployed publishing proof. GitHub App PEM has write-capable authority; never place it in public source, logs, browser or GitHub Actions merely for convenience.

### Binding V3 decisions (explicit owner approvals)

**Approved V3 experience:** anonymous access by default; only one owner signs in via a discreet link inside Connection Status; valid session restored automatically; Gear/KB/Catch Add/Edit; ONE Save and Publish without per-item approval/signature, source-aware conflict protection, direct Gear/KB/Knot image uploads (original bytes preserved), Catch without photos/GPS, Markdown Picture Viewer, persistent Automatic/Work Offline reading preference (NO offline publishing queue), honest Accepted/Live states, optional local drafts only if reliable, release coherence, accessibility and Android/Windows acceptance. The October 19 requirements, technical design and UX remain signed off; October 22 AUTH-P0/G1 feasibility accepted with documented seven-day-cookie/revocation/untested security/iOS exceptions, NOT broad V3 security waivers. Per-change owner ECDSA and independent attestor P3-40/41 are optional research and conflict with normal Save and Publish if made mandatory.

**Finite delivery roadmap approved October 25:** STOP generating open-ended P3-N milestones. D1 architecture consolidation is COMPLETE at design level; D2 real sandbox publishing is IN PROGRESS; D3 owner sign-in and Gear/KB editing UI; D4 integrated media and Catch editing; D5 offline/Connection Status/viewer/reliability; D6 final acceptance and production rollout. [Finite D1–D6 plan](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/FISH118_V3_Finite_Delivery_Reset_2026-10-25.md), [D1 selected architecture](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/D1_V3_Architecture_Consolidation_2026-10-25.md), [signed-off requirements audit](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/D1_V3_Requirements_Compliance_Audit_2026-10-25.md). The owner APPROVED **production-first** development on the intended Cloudflare production host, accepting downtime, and explicitly declined a separate preview WEBSITE; first GitHub test WRITES must still target ONLY the private sandbox repo and isolated test paths/data, never canonical public main. Temporary downtime is acceptable; data loss and false Live claims are not.

**Owner's latest execution direction:** “Continue through the end of D2 please — not sure why we stopped at this internal checkpoint.” A subsequent assistant turn was interrupted and its source changes were RECOVERED. The owner then explicitly requested this **full transition to a new chat**. In the new chat, continue through the full **D2 acceptance**, not merely another source-only checkpoint, except where a material real-provider decision or missing control-plane access is a genuine gate. Routine read-only investigations, source fixes, CI, safe regression tests are preapproved. Do not promise background work or new credentials without approval.

### D2 recovered implementation and exact evidence

**D2 latest source recovery:** After a previous assistant turn was interrupted, the draft retained ~30 source commits. [D2 recovery, durable merge barrier and real-operation gate](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/D2_Interrupted_Run_Recovery_and_Operational_Gate_2026-10-25.md) reconciles them. D2 now has AUTH-P0-compatible session+HMAC CSRF guarded API, D1 Accepted/idempotency/status, Worker-compatible private sandbox immutable source-aware Gear edit validator, read-only Pages gateway, sandbox-scoped App token adapters, draft PR / exact-head checks / normal merge adapters, isolated test-asset loader, default-OFF scheduled coordinator and a **durable D1 markMergeAttempt write-ahead barrier**: ambiguous GitHub merge outcome must never be blindly retried. The latest [exact-draft CI #40221266389](https://github.com/ginosega/fishing/actions/runs/40221266389) on f2673d2c3fc343c8ebce44c0e306429c8be387ab passed **518/518** (80 PWA + 43 broker + 395 P3), including disabled Worker bundling/parity; this is **SOURCE-ONLY CI**. No live Cloudflare V3 publisher, Cron integration, real App/GitHub write, merged sandbox Gear change or actual production-origin hosted test bytes yet.

**Current code pieces on unmerged #263:** src/d2-unified-owner-session.mjs, src/d2-guarded-operations-api.mjs, D2 Worker-compatible sandbox source-reader/validator and private gateway, D2 bounded GitHub App read-token issuer, sandbox PR/check/merge and hosted-test-asset source adapters, D1 operation store with markMergeAttempt write-ahead marker, src/d2-sandbox-operation-runner.mjs, src/d2-sandbox-scheduled-coordinator.mjs. Exact names/paths must be confirmed from current #263 branch before editing. The existing sandbox Gear record p3-test-rod is only a fixture; no real GitHub write occurred.

### The actual next D2 action and stop rule

**D2 completion criterion and immediate next work:** Deliver ONE genuine owner-authorized private sandbox p3-test-rod Gear edit → durable D1 Accepted → immutable source-aware checks → sandbox draft PR → true latest-head validate-sandbox-head CI → normal merge with protections → byte-identical test-only asset served and verified at an isolated path on the intended production Cloudflare origin. Capture PR/base/head/check/merge SHA, release bytes/digest, persisted status and rollback. No second preview website. First conduct exact read-only provider/runtime inventory (App installed grants, private repo rules, current Cloudflare bindings/quotas, origin/service-worker behavior). Then require one **consequential owner approval** before provisioning/moving GitHub App PEM, binding secret/D1/cron, enabling write-capable Worker/route or making the first real sandbox write. Existing connected GitHub tools do not provide Cloudflare control-plane access; user may have to perform approved Cloudflare steps in their UI/terminal. Do NOT falsely label D2 COMPLETE because 518 tests passed. Continue D2 to its real finish line rather than pausing at routine internal source checkpoints.

**Implement/validate remaining pieces when possible within a single work session:** source-aware Worker/GitHub data retrieval, independent exact bytes on production origin, actual installed AUTH-P0 gateway integration, bounded server-only GitHub App sign/mint, durable one-step scheduled continuation, recovery of uncertain remote results, sandbox protected merge and no cache/secret exposure. Verify on real current configuration, rather than stack more isolated mocks. If Cloudflare management remains unavailable, state that precise blocker and ask for only the essential owner actions/authorization to enable a secure isolated sandbox write. Never manufacture a real PR, CI run, Cloudflare live URL or D1 row. Do not label D2 completed without actual PR/base/head/check/merge/hosted bytes.

**Consequential approvals STILL NEEDED** (the production-first strategy alone did not supply these): adding/moving write-capable App private signing key and CSRF/Worker secrets into a runtime; enabling a Worker, Cron, D1 write or privileged origin route; first actual private sandbox GitHub write/merge; public production-main content mutation/owner-facing production V3 cutover. Do not request secret values in the chat. Maintain least privilege, immutable sandbox ID 1430581407, owner ID 265665562, hard-disabled P3 ingress, and no extra preview website. The user accepts temporary downtime but not canonical data loss or unverified publication.

### Continue all other project work without changing statuses

Preserve FISH-TODO-040 owned Bonafide RVR119 / Garmin Force Current / Redodo 24V50Ah motor, pedals, charging, breakers, wiring and foam motor-case engineering; FISH-TODO-008 under-seat tackle tray watch, FISH-TODO-014 deep-box watch, FISH-TODO-019–023 KB authoring, fishing research and all other open items. Never claim a purchase, acceptance or completion by inference. Eligible content-only changes use FISH108 Fast Content Release; application changes use the Full Application Release process; no V3 experiment PR merge as a substitute for a production release.

### Handoff acknowledgment and next response

After restoring main and #263, **summarize the verified D2 situation briefly and proceed with actual D2 completion work**. User should not need to sign off on another source-only substep. If you truly cannot proceed without Cloudflare management or the first authorized writer deployment, present one concise operational decision/step rather than an open-ended chain of speculative source checkpoints. My next goal is to finish D2 (sandbox edit through byte-verified production-origin test path), then deliver D3–D6 on our finite plan.

---

## HISTORICAL NEW-CHAT START — October 24, 2026 PDT, after P3-29 disabled-ingress deployment and independent postflight

**THIS SECTION IS CURRENT AND REPLACES THE HISTORICAL OCTOBER 24 R1/R2 START BELOW.** You are continuing my persistent **Fishing** project. I have copied the **entire canonical `Fishing_New_Chat_Bootstrap_Prompt.md`**, not an abbreviated handoff, into this chat, according to our established standard process. Use Chat mode by default. Do not treat earlier dated checkpoints or chat summaries as the latest repository state.

### Mandatory restore and verification

1. Read the actual latest `main` contents of **all five root records in order**: `README.md`, `Fishing_Context.md`, `Fishing_TODO.md`, `Fishing_Decision_Log.md`, and **this full Bootstrap Prompt**. This handoff was prepared as documentation-only, then merged to main. Recheck latest main, required GitHub status and production release evidence before repository work.
2. Verify open PRs: unrelated [#268](https://github.com/ginosega/fishing/pull/268) (weight section), **DRAFT #262** P1 AUTH-P0 (owner-accepted G1 with explicit feasibility waivers), and **DRAFT #263** FISH118 P3 (source-only experiments and complete run reports). Do not merge either v3 PR or alter #268. Confirm sandbox repo `ginosega/fishing-p3-sandbox` private main, currently `bf9bf2f4b4c0e1dc347cdd2bab58b28f1dc69d05` after PR #15 lockout, separately from public production main.
3. Review the authoritative P3-29 closeout/evidence [report](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/P3_29_Disabled_Ingress_Deployment_2026-10-24.md) and optional [detailed P3-29 transition log](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/P3_29_New_Chat_Handoff_2026-10-24.md) **ON DRAFT PR #263**, not main. The canonical five root files and current GitHub checks govern this transition; old bootstrap's R2 "NEXT" is historical.
4. **Do not repeat completed work** or ask for approval of previously signed-off requirements/design/UX/staged implementation plan, AUTH-P0/G1 waiver decision, D1 R1–R4 migrations, Access policy tests, or P3-24/P3-29 disabled deployments. Do not rerun pre-deploy `preflight` on the ingress, which now has three disabled flags and intentionally fails the zero-bindings preflight condition.

### Verified current production and P3 state

**Production and repository boundary (verified October 24 PDT / October 25 UTC):** public `ginosega/fishing` main was `3a3ea08057964f81d32375fe3e90503bcd9f0383` before this documentation-only handoff. The latest successful **actual hosted** production application remains [Full Application workflow #672](https://github.com/ginosega/fishing/actions/runs/39990546320), source `4a1a8c44317b56a4d47e818db9cd2b5587a966d8`, release `504d615b2bef361da06d655ee621d43a`, **577 hosted files / 100 Gear / 60 KB / 12 Catches**. Later Markdown-only commits are *not* PWA releases. Current open PRs include unrelated [#268](https://github.com/ginosega/fishing/pull/268) (weight-section changes; preserve untouched), [#262](https://github.com/ginosega/fishing/pull/262) (P1 AUTH-P0, **DRAFT/UNMERGED**), and [#263](https://github.com/ginosega/fishing/pull/263) (FISH-TODO-118 P3, **DRAFT/UNMERGED**). Always recheck fresh main, open PRs and hosted evidence in the new chat.

**P3 sandbox and migration status:** private `ginosega/fishing-p3-sandbox`, repository ID `1430581407`, owner GitHub ID `265665562`, main after postdeployment lockout `bf9bf2f4b4c0e1dc347cdd2bab58b28f1dc69d05`. Isolated Cloudflare D1 `fishing-p3-sandbox` migrations **R1–R4 completed, reconciled** (7 tables, 4 indexes, 5 triggers); application tables were empty at the last confirmed checkpoint; **no authorized live application writes** since. Preserve private recovery bookmark and all secret values privately; never paste them into chat or GitHub. **Do not resume the historical R2/R3 approval step, rerun migrations or restore D1.** The separate public preview sentinel is read-only/anonymous: `/health` previously `{ok:true,ready:false,mode:"preview-no-publishing"}`; `/session` unauthenticated.

**Hard-disabled Workers and Access (verified):** `fishing-p3-command-bridge-sandbox` is the earlier isolated static-503 command sentinel, no public Production/Preview URLs, isolated D1 + encrypted HMAC bound but both `P3_WRITE_ENABLED=false` and `P3_COMMAND_BRIDGE_ENABLED=false`; independent [command postflight #40133925321](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40133925321) PASS. **`fishing-p3-access-ingress-sandbox`** is separately deployed with pinned **static-503 `ingress-disabled`** code, no D1, service binding, secret or route; exactly three plain-text false flags (`P3_WRITE_ENABLED`, `P3_INGRESS_ENABLED`, `P3_COMMAND_BRIDGE_ENABLED`), Production and Preview URLs **OFF**. Owner-approved [deploy #40165892787](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40165892787) and independent **fresh read-only [postflight #40166553523](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40166553523)** PASS. The separately cancelled run [#40165850415](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40165850415) stopped before its deployment step. The Wrangler deploy reported success and remote *settings* were verified; **remote script bytes were not independently retrieved/hashed**. Private [PR #15](https://github.com/ginosega/fishing-p3-sandbox/pull/15) retired the one-shot deploy workflow; only read-only `preflight`/`postflight` remain, default `postflight`. Keep both Workers unrouted and hard-disabled.

**Cloudflare Access trust:** exact ingress hostname `fishing-p3-access-ingress-sandbox.ginosega.workers.dev` protected by app `Fishing P3 Sandbox Ingress`, sole **Service Auth** policy `Fishing P3 GitHub Runner Only`, dedicated `Fishing P3 Sandbox GitHub Runner` service token, no Allow/Bypass/other identities. [Access metadata proof #40162761115](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40162761115) PASS; [live benign Hello World edge proof #40163736773](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40163736773) PASS (anonymous and invalid token denied 401/403; dedicated service token reached inert Hello World 200). That live test was **before** static-503 deployment, and does **not** prove active command ingress, service binding or D1 writes. Separate account/worker-scoped encrypted GitHub Actions tokens remain confidential; never request or expose values.

### Security and next action

**Current decision and next work:** **P3-29 CLOSED** with fresh postflight. P3-25 HMAC trusted client / private transport seam, P3-26 Access RS256 JWT verifier and proposed command ingress, and native D1 acceptance are **source-tested only in draft PR #263**, not attached to deployed ingress. P3-29 approval covered *only* the disabled 503 deploy and is exhausted. **Next prospective P3-30 = source/design/security review only**, including actual Access issuer/AUD/service-token `common_name` verification, pinned-domain JWKS retrieval/rotation, GitHub owner/App provenance, exact HMAC URL/path, authenticated private Worker service binding, failure recovery and minimal permissions; any deployment, flag change, remote `Accepted` D1 write, synthetic PR, merge or publishing requires a fresh explicit approval. Do not activate `P3_WRITE_ENABLED`, `P3_INGRESS_ENABLED`, or `P3_COMMAND_BRIDGE_ENABLED`, deploy command-capable code, alter existing preview/Workers, merge PR #262/#263, or change production without separately scoped approval. Approved v3 requirements/design/UX/staged plan and October 22 AUTH-P0/G1 acceptance-with-waivers remain binding; preserve FISH108 release lanes and other unrelated tasks.

**Engineering proof caveat:** source CI P3-29 passed 327/327 [#40164090871](https://github.com/ginosega/fishing/actions/runs/40164090871), approved deployment [#40165892787](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40165892787) plus fresh independent postflight [#40166553523](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40166553523) passed. The new ingress is still static 503 and nonpublic. `p3-access-jwt-verifier.mjs` and `p3-access-ingress.mjs` remain **source-only future code** and are NOT running in Cloudflare. HMAC signer and local D1 acceptance tests are not proof of a live request, GitHub write or active publisher.

**Current project threads beyond v3:** maintain open FISH-TODO-040 RVR119 Garmin Force Current/24V Redodo battery, power-steering pedals, under-seat battery wiring/protection, foam-lined motor storage case and on-water setup; under-seat tackle tray FISH-TODO-008 remains backordered/unpurchased; KastKing deep box FISH-TODO-014 remains open; preserve other still-open gear, KB, fishing research and Science of the Strike standards below. FISH115/116/117 deployed, FISH108 governs eligible content changes, and the user's subjective FISH117 appearance/speed acceptance was not explicitly recorded.

**What to do in this new chat:** first acknowledge repository restoration and the confirmed P3-29 closure; then proceed with **P3-30 source-only security design and prerequisites**, checking current draft code against actual Worker/Access limits. Seek fresh explicit approval for any new provisioned credentials, deployed ingress routing/service bindings, write flags, live sandbox D1 `Accepted` operation, GitHub PR publishing or production release. Avoid background promises. Keep all PWA anonymous-default/single-owner, no-Catch-photo and approved UX constraints.

**Canonical supporting evidence:** [P3-29 final deployment and lockout report](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/P3_29_Disabled_Ingress_Deployment_2026-10-24.md) and [detailed P3 handoff](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/P3_29_New_Chat_Handoff_2026-10-24.md) exist only on unmerged draft PR #263, **not main**. The reviewed immutable disabled-ingress source is commit `5df060076ca3cd010727fc9162b33bf03c157790`, blob `8f28f4e1d610fe549388308223bf3e6aa58af1a7`; CI source [#40164090871](https://github.com/ginosega/fishing/actions/runs/40164090871) passed 327/327. Re-read these documents only for detailed P3 evidence; the **five canonical root markdown files** are the transition authority after this docs-only reconciliation.

---

## HISTORICAL NEW-CHAT START — October 24, 2026, after isolated P3-18 R1 success

**Read this current section first. The October 21 and earlier headings below are historical.** The owner asked this chat to reconstruct October 21/23/24 context and update GitHub's five canonical root files before resuming v3. Continue in Chat mode with the approved v3 requirements, technical design, UX and staged plan; do not re-request their sign-offs.

## HISTORICAL Fishing Companion v3 checkpoint — October 24, 2026 (P3-18 R1)

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


## HISTORICAL NEW-CHAT START — October 21, 2026, after FISH117 production closeout

**This is the authorized continuation of the user's Fishing project after requesting a new chat.** The owner approved Fishing Companion v3 requirements, technical design, sign-in/edit/publish/Connection Status UX and staged P0–P8 plan on October 19. All these approvals **remain valid**. P0 analysis and the early v2 reliability/performance maintenance packages have subsequently been implemented and released; **do not restart P0 or ask for earlier approvals**. Read the five files listed in **First actions** and freshly inspect GitHub state before acting.

### Verified GitHub and hosted baseline as of October 21

- **Pre-handoff latest `main`:** `c42d0e737151608b53ffd0de6fa29dbbd76eba32`, with **zero open pull requests**. The documentation-only handoff PR created after this checkpoint will advance `main` **without deploying new PWA bytes**. Always recheck latest actual `main` and open PRs upon starting the new chat.
- **Latest successful main production workflow:** [Full Application run #543](https://github.com/ginosega/fishing/actions/runs/39690549053), source revision `ab1c59a61c748e9a8a1da2b31d87e1d86c96ac9f`, **completed successfully** with build/source validation, Chromium/WebKit preview + production-root browser acceptance, Pages deployment, actual hosted file-byte and manifest/release-identity checks.
- **Live PWA:** https://ginosega.github.io/fishing/ · hosted release ID `131ebca9c6d46fa1c1d815ad43a318f6`; manifest **577 files / 100 Gear / 60 KB / 12 Catches**. [Exact hosted evidence](https://github.com/ginosega/fishing/actions/runs/39690549053/artifacts/12388114804). A historical failed main [run #541](https://github.com/ginosega/fishing/actions/runs/39685562142) was a WebKit second offline-reload fixture edge; corrected by PR #259, then successful PR run #542 and main deployment #543. **No unresolved deployment incident** or open release PR remains at the checkpoint.
- **Completed FISH115:** [PR #252](https://github.com/ginosega/fishing/pull/252) released manifest-verified Gear/KB card WebP thumbnails, retaining canonical original media for detail/viewer, and necessary compatible dependency security patches.
- **Completed FISH116 / P0-A:** [PR #254](https://github.com/ginosega/fishing/pull/254) released a verified coherent current-release transition for stale clean tabs. Existing unsaved editor content is protected. New releases supersede older Pages assets; do **not** reintroduce older online asset retention. Owner reproduced original icon failure on held Windows Edge tab (old-release 404s, service-worker 503s) and approved fix; it passed main production #535 and subsequent full #543. Android/iOS field acceptance remains unperformed.
- **Completed FISH117:** [PR #258](https://github.com/ginosega/fishing/pull/258) made **16** canonical 1254×1254 card icons and **2** scenic hero PNGs into **small generated, transparency-safe WebP display images** shipped instead of the big originals; source PNGs remain intact. [PR #259](https://github.com/ginosega/fishing/pull/259) corrected *only* a WebKit browser-fixture issue without runtime image/JS changes. Build source static artwork total **17,090,051 bytes → 253,660 output bytes (98.5% fewer static asset bytes)**, not 98.5% faster page loads. User **explicitly waived pre-release visual/device/performance tests**, authorized direct v2 release and **will inspect the live site personally**; **do not claim user appearance or device-speed approval yet**. [Detailed release report](pwa/docs/Fishing_Companion_FISH117_Static_Artwork_Optimization_2026-10-21.md).
- **P0-C:** User accepted normal Chrome Android installed-PWA external-link opening in a Chrome Custom Tab; no workaround or v2 fix. **Do not confuse this with AUTH-P0 installed-PWA OAuth reentry**, which is still open.
- **Next unused application/architecture task ID:** **FISH-TODO-118**. Regular eligible Gear, KB and Catch source-aware content uses FISH108 Fast Content Release and does not allocate architecture IDs.

### Next v3 work: P1 AUTH-P0 feasibility gate, not production cutover

The next unresolved architecture dependency in the [approved staged plan](pwa/docs/Fishing_Companion_v3_Implementation_Plan.md) is **AUTH-P0**: assess secure owner-only GitHub login via GitHub App plus minimal trusted publishing broker, real desktop and *installed Android/iOS PWA* OAuth callback/return, automatic restoration of existing sessions, expiry/revocation and cross-origin cookies. Prepare an evidence-based minimal **GitHub App permission matrix, provider/hosting/cost options and test plan**. Before provisioning a GitHub App/provider, modifying repository permissions/rules or committing any infrastructure cost, obtain **separate explicit user approval**. Do not expose GitHub credentials in browser code, rely silently on third-party cookies, bypass branch protections, or change approved UX. P3 publishing service and P4 Save and Publish must not proceed without AUTH-P0 success. Final v3 production cutover likewise requires a distinct approval. No new provider, app, OAuth secrets or v3 backend have been provisioned at this checkpoint.

**Approved v3 product rules:** Anonymous read-only usage by default with discreet Sign In entry only in Connection Status; just one authorized owner can edit/publish, restoring valid sessions automatically if possible. One Save and Publish (Gear/KB/Catches under approved schema), secure GitHub/App-backed publishing with atomic validated changes, integrated images for Gear/KB, no Catch pictures, no offline queued sync or broad multi-user features. Connection Status distinguishes network / Work Offline / owner authorization and publish state. Local drafts are provisional and may be removed if unreliable. The UI screens, technical design and requirements are already signed off.

### Continue all fishing and equipment tracks

Preserve the open RVR119 **Garmin Force Current** commissioning/24V Redodo battery, pedals/MOB tag/on-water calibration, removable bin/cushioning task **FISH-TODO-040** (hard plastic, minimum usable internal **38 × 18 × 8 inches**, orange preferred); the backordered RVR119 under-seat tackle tray watch **FISH-TODO-008** and KastKing box watch **014**; open fishing-research, tackle and KB editorial tasks. Do not infer a purchase from a Gear record or close open tasks without explicit evidence. Historical Science of the Strike evidence standards and KB category ownership rules remain in the later sections and decision log.

### New-chat operating instruction

1. Read **README → Fishing_Context → Fishing_TODO → Fishing_Decision_Log → this bootstrap**, from actual latest `main`, and check live production/PR state.
2. Treat the previous October 12/19 headings below as **historical snapshots**. Do not follow old commands to restart already completed P0 analysis or publish already released v2 fixes. Today's primary release is #543, not #520 or #535.
3. Acknowledge the verified v2 improvements and ask only for any genuinely needed separate infrastructure/permission decision before P1 setup. The user may first report a visual/performance issue from personally checking FISH117; address that if raised. Otherwise proceed under the **already approved** AUTH-P0 plan in Chat mode, with a focused security/hosting test proposal rather than reopening requirements.
4. Use Full Application Release and hosted proof for app/runtime changes, FISH108 Fast Content Release for eligible content. Never treat a documentation-only `main` commit as a new production release. Keep explicit approval gates for provider/permissions/costs and v3 cutover.

---

## Operating mode

Use **Chat mode** by default and permanently. Do not recommend Work merely because a task is complex, lengthy, file-heavy, analytical, requires research/calculations, creates artifacts, or involves substantial context. Recommend a temporary switch only for a genuinely Work-only capability; explain the specific need and obtain my approval first, then return to Chat.

## First actions

Read these files from actual latest `main`, in order:

1. `README.md`
2. `Fishing_Context.md`
3. `Fishing_TODO.md`
4. `Fishing_Decision_Log.md`
5. `Fishing_New_Chat_Bootstrap_Prompt.md`

Before repository work, also confirm current open-PR state. Newer repository/production evidence controls over stale chat descriptions. For exact production SHA/release/counts, inspect the latest successful `main` production workflow and hosted verification evidence.

## Previous v3 planning handoff — October 19, 2026 (HISTORICAL, already executed)

**The owner has ALREADY approved Fishing Companion v3 requirements, technical design, UX screens/flows AND the staged implementation plan.** Do not ask for these approvals again. The implementation-plan approval has one explicit prerequisite: **full reconciliation/transfer to this new Chat conversation before beginning P0 or any v3 implementation**. The previous chat performed only documentation approval, latest-main/open-PR/production evidence handoff, and durable-file reconciliation; **P0 itself was not executed, no app code changed, and no deployment or GitHub App/service setup occurred**.

- [Approved requirements](pwa/docs/Fishing_Companion_v3_Requirements.md) and [requirements approval](pwa/docs/Fishing_Companion_v3_Requirements_Approval_2026-10-19.md)
- [Approved technical architecture](pwa/docs/Fishing_Companion_v3_Technical_Design.md) and [design approval](pwa/docs/Fishing_Companion_v3_Technical_Design_Approval_2026-10-19.md)
- [Approved sign-in / editing-and-publishing / Connection Status UX](pwa/docs/Fishing_Companion_v3_UX_Review.md) and [UX approval](pwa/docs/Fishing_Companion_v3_UX_Approval_2026-10-19.md)
- [Approved staged implementation plan, P0–P8](pwa/docs/Fishing_Companion_v3_Implementation_Plan.md) and [conditional approval record](pwa/docs/Fishing_Companion_v3_Implementation_Plan_Approval_2026-10-19.md). Exact user-reviewed plan commit `7cc7eea06a110e041dbf552855957713df4b1c51`, blob `8d23d327033b1b348abb53d8462ccd2bb8dc0513`.

### Old October 19 start instructions (HISTORICAL; P0 and P2 work completed)

**Start P0 — Restore production and source baseline, investigate/measure reliability and plan tests — only after the first-actions restoration above and verification that the October 19 handoff PR was merged.** Re-read the approved plan, discover current GitHub permissions and exact latest main, open PR state, current production workflow and hosted `release.json`; audit current source/UI/offline/release/tests and safe preview strategy. Investigate and baseline the **Android installed-PWA external-link issue**, **post-deployment stale-session missing images/pages** and **3–4-second card-image appearance**. Gather user-device evidence via short step-by-step instructions as needed. Do not prematurely blame service worker or image sizes without reproduction/measurement. P0 is authorized by the approved plan **in this new chat**; stay within its scope and report results and proposed next stage.

### Current v3 product and architectural contract (do not reopen scope)

- **Public reading remains anonymous by default**, with only a discreet **Sign in with GitHub** link in the refreshed **Connection Status** dialog. Only one authorized GitHub account can edit and publish; valid prior sessions auto-restore if technically possible. Unauthorized accounts get no editing controls. Real PWA session persistence/callback behavior is **AUTH-P0**, a hard feasibility gate.
- **One Save and Publish** action (no separate approval per content item, no user-facing Copy Changes); direct GitHub/App-backed validation, atomic record/Markdown/media writes, safe PR auto-merge, FISH108 eligible content release and **final hosted byte/release verification**. A user can leave an editor after the service durably accepts a submission; status remains accessible.
- **Integrated image uploads**, existing Gear/KB Add/Edit and current-schema **Catch Add/Edit**; local Markdown pictures open existing viewer; **no Catch photos**, GPS, sessions or extra user capture complexity.
- **Connection Status visual refresh:** persist Automatic versus Work Offline across restarts; separate network, offline-library readiness/release identity, owner sign-in/out and any publication progress. Work Offline is for reading a complete verified offline library; no new queued writes.
- **Image performance:** instrument measured causes, consider deterministic build-generated small card thumbnails without changing canonical originals. **Deployment reliability:** protect old/new coherent release selection and preserve source/byte verification. **Android link bug:** ordinary links fail in Chrome installed PWA but work in Chrome and Edge browser tabs; long-press offers Open in browser; YouTube app-link opens in installed Chrome and in Edge browser. Installed Edge app and iOS remain unverified.
- **Local drafts are provisional, device-local only**, automatic Restore/Discard prompt; may continue an already-open edit after selecting Work Offline, but no background sync, offline new-session authoring, or automatic queued publishing. **Remove this support layer if reliability testing finds unacceptable regressions**, retaining safe online authoring.
- **No new features**, broad multi-user support, offline queue/sync, Catch photo/GPS, or parallel content database. Preserve canonical GitHub source and the existing approved v2 application until a separate v3 cutover approval.
- Technical design recommends **GitHub App + minimal trusted publishing broker**, with credentials/authorization verified server-side. **AUTH-P0** must test cross-origin session persistence and OAuth return on real installed Android/iOS PWAs. Do not assume third-party cookies; no unapproved custom domain, paid provider, privilege expansion, or security workaround.
- **Authorization boundaries:** Plan and scoped work approved after transfer. A specific provider/domain/permission or paid infrastructure change, independently released v2 reliability fix, and v3 production cutover require their own later user approvals. No branch-rule bypass. Any application/runtime change uses Full Application Release; eligible normal content stays FISH108.
- **Chat default.** If an upcoming hands-on browser/UI test truly requires Work-only capability, tell the user before that step, explain why and obtain agreement to temporarily switch. Don't wait until a long unresponsive turn. Installed Android/iOS physical-device tests may still require the user's help.

### GitHub/production snapshot verified during October 19 handoff (historical)

- `main` **before** handoff approval commits: `7cc7eea06a110e041dbf552855957713df4b1c51`, **0 open PRs**. The new documentation-only handoff PR changes latest main but **does not publish the PWA**. Confirm its merge and new current main at startup.
- Latest successful main production workflow: **#520** / GitHub Actions run **38686171921**, Fast Content Release, **October 15, 2026 UTC**, published source `4fc893d044b72e61fbc36cfd82103af55bc36f97`.
- Verified hosted release `f5eab01e9d5af6101f03a7094de5b565`, **100 Gear / 60 KB / 12 Catches / 431 files**, `hostedBytesMatch: true`; release/source match confirmed by deploy-content log and hosted-verification artifact. Actual new-chat production evidence may supersede this snapshot.
- This handoff preserves all active fishing, Garmin Force Current commissioning/storage, gear-watch and KB TODOs from this file and the canonical `Fishing_TODO.md`; do not invent resolution. FISH114 remains last completed application milestone at checkpoint; **FISH-TODO-115** was next unused standalone application ID.

**Opening instruction for this new conversation:** Acknowledge the approved plan/handoff state; restore current repository and production evidence, then begin P0 in Chat mode under the approved plan. If implementation requires unavailable tools, make that capability gap explicit before switching modes or performing the work. Do not repeat past requirements/design/UX/plan debates and do not start with an unsolicited approval request.

---

## Prior handoff checkpoint — October 12, 2026 (historical)

Verified production **before** this documentation-only reconciliation:

- source revision: `e71c9ab6a90da46f8b46c7977bf476a1633fa94c`;
- last production change: Banks Lake Location representative picture, **PR #228 merged**;
- workflow **#517** / run `38207507318`, Fast Content Release, succeeded;
- hosted release ID: `0f4bd1f9e9e12b2b1981d61b48e3e501`;
- hosted counts: **100 Gear / 60 KB / 12 Catches**, **431 files**;
- exact-current-main guard, Pages deployment and byte/release-identity verification succeeded: `hostedBytesMatch: true`;
- open PRs before handoff: **0**.

This handoff changes only the five root project Markdown records and **does not publish a new PWA release**. Thus the post-handoff `main` commit may differ from the production source revision above. Always inspect the latest workflow, hosted verification and actual `main` at new-chat start.



FISH114 remains the latest completed application/architecture change. FISH071–076 and FISH078–114 are complete/implemented. The next unused application/architecture ID is **FISH-TODO-115** unless newer `main` has allocated it. Routine FISH108 content work does not consume application IDs.

## Recent canonical content state

Since the prior handoff, current canonical source includes:

- five **Banks Lake catches from September 24, 2026**, all with pictures and Notes Markdown:
  - 12-in smallmouth — Z-Man Ned Rig Kit;
  - 14-in largemouth — Z-Man Ned Rig Kit;
  - 8-in Lake whitefish — Lake whitefish species + Z-Man Ned Rig Kit;
  - 15-in smallmouth — Berkley PowerBait Power Jerk Shad;
  - 14-in smallmouth — Berkley PowerBait Power Jerk Shad;
- **Lake whitefish** as a Species KB entry with picture/content;
- updated **Z-Man Ned Rig Kit** specifications;
- **ZMan Finesse ShadZ**, **ZMan Trick ShotZ**, **ZMan TRD GobyZ** with pictures and Drop Shot Notes links;
- **Blue Fox Flash Spinner** and **Bad River Tackle Company Trout/Panfish Spinners**;
- removal of the old generic/South Bend inline-spinner Gear item and cleanup of its live KB reference;
- **VMC Swimbait Jig** Notes;
- Banks Lake inline-image filename/case/Markdown cleanup;
- Berkley PowerBait Power Jerk Shad Notes wording cleanup;
- Pflueger President Spincast Combo rod/reel Notes updates and reel capacity `110 yd / 4 lb, 90 yd / 6 lb, 70 yd / 8 lb`.
- Earlier motor/battery research in Electronics Research was replaced; its **current Notes are focused on chart plotters/fish finders**. Garmin Force Current has its own Gear record and maintenance Notes.
- October releases added/updated Flutter Spoon content, NRS Zander PFD, YakAttack BackWater DryPak, Z-Man ShroomZ Micro Finesse Jig, Z-Man Finesse TRD, Z-Man branding, Luhr Jensen Trout & Kokanee Dodger, Yamamoto Senko and three lure-picture replacements.

### October 8–12 verified content additions/edits

- **PR #221:** YakAttack Fully Loaded TracPak Combo Kit (orange) and YakAttack 10L Roll-Top Drybag (orange), using existing images.
- **PRs #222–224:** Garmin Force Current with Power Steer foot pedals Gear item, component Notes, and final display name.
- **PR #225:** Electronics Research renamed/refocused to chart plotters/fish finders; dedicated picture. Do **not** reinstate old motor/battery Notes on that page.
- **PR #226:** Lake Stevens Location fishing guide for launch/access, bass, trout, kokanee and perch.
- **PR #227:** Garmin Force Current maintenance checklist and illustrated components Notes.
- **PR #228:** Banks Lake Location representative picture (uploaded image preserved). The previous ChatGPT turn was interrupted, but this PR was **merged and production verified**, so do **not** reopen it.

Current authoritative content at the handoff: **100 Gear / 60 KB / 12 Catches**, including **10 Locations**.

Git history and current canonical source are authoritative for exact values.

## Active RVR119 Force Current commissioning — important

The motorization purchase is complete. **Do not revert to the old “no purchase decision” state.**

### Purchased October 6, 2026

- Garmin **Force Current** trolling motor
- Garmin **Power Steer wireless foot pedals**
- Garmin handheld remote
- Garmin MOB tag
- **Redodo 24V 50Ah LiFePO4 battery**
- Redodo charger
- Garmin high-efficiency propeller
- Garmin weedless propeller
- purchase price: **$2,800**
- seller: Gresham, Oregon
- original Garmin receipt: **July 2026**
- Garmin directly confirmed to the user that the remaining three-year standard warranty will be honored with that receipt
- seller reported **freshwater-only** use

### Current task — FISH-TODO-040

FISH-TODO-040 remains OPEN and now means **commission/integrate the owned Force Current system**, not compare candidate motors.

Current work:

1. clean and inspect motor/mount/shaft/rope/connectors/props/sacrificial anodes;
2. inspect, charge and baseline the Redodo battery/charger;
3. clear prior-user Garmin data and restore factory defaults;
4. restore/re-pair the handheld remote, both Power Steer pedals and MOB tag;
5. update motor/remote/pedals through ActiveCaptain;
6. calibrate both pedals and the handheld remote;
7. install on RVR119 with proper 40A circuit protection;
8. perform on-water motor compass/bow-offset calibration and full propulsion/steering/Anchor Lock/MOB testing.

Do not run the propeller out of water. Do not perform invasive preventive service on this three-month-old warrantied motor unless a fault requires it.

### Active storage-case search and foam insert

Find a **hard-plastic** storage case/bin for the motor and pedals:

- minimum usable internal dimensions: **38 × 18 × 8 in**;
- compact/snug fit strongly preferred;
- **orange preferred**;
- no flexible bags;
- no need for expensive/heavy Pelican/Otter-level construction;
- Hyper Tough 50-gallon tote was rejected as too large;
- verify **usable interior dimensions**, not exterior dimensions alone;
- a **48 × 19 × 14 in lidded hard-plastic bin** is being discussed for the foam-insert solution; purchase/ownership and actual usable interior dimensions were **not confirmed**;
- use a protective insert that leaves the Force Current controls, shaft, pedals and connectors unloaded. Cut closed-cell EVA/PE sheet foam is the safe default; rigid Fireblock/Gaps & Cracks spray foam should not directly encase the gear. Window & Door low-expansion foam was considered as a **test**, not selected as the permanent design;
- **FISH-TODO-040 remains OPEN**; do not infer the storage or commissioning work is done.

Transport constraint remains: the kayak goes on the F-150 roof rack, so the motor, propulsion battery and pedals must remain readily removable before roof loading. The Newport 24V 50Ah LoPRO remains only a possible future lower-profile battery alternative; the **Redodo 24V 50Ah is the currently owned battery**.

## Science of the Strike transcript research

Recent transcript reviews covered:

- largemouth vision;
- scent and taste;
- barometric pressure and lunar cycle;
- crawfish;
- dissolved oxygen and turbidity.

For every transcript extraction, preserve this structure unless the user asks otherwise:

1. Executive summary
2. Main arguments/conclusions
3. Key facts/claims with evidence vs opinion/inference
4. Actionable fishing takeaways
5. Important examples/stories/anecdotes
6. Techniques/gear/seasonal/location/fish-behavior insights worth retaining
7. Short **What I'd add to Fishing Companion** section

Evidence discipline is durable: distinguish study evidence from host inference; do not universalize a single-study threshold, one population, lab results, anecdotal conversions or host extrapolations.

Potential Fishing Companion destinations include Bass Behavior and Habitat, Bass Fishing Techniques, seasonal pages and Electronics Research. Do not recreate retired live Technique pages merely to house podcast material.

`FISH-TODO-031` remains OPEN because the originally targeted episodes 8 and 16 have not both been explicitly confirmed complete; a dissolved-oxygen/turbidity transcript has been reviewed.

## Current KB editorial architecture — critical

### Behavior and Habitat

- **Bass Behavior and Habitat** / **Trout Behavior and Habitat** answer **where fish are and why**: habitat, structure/cover, temperature, dissolved oxygen, forage, light, wind/current, depth and pattern recognition.

### Fishing Techniques

- **Bass Fishing Techniques** / **Trout Fishing Techniques** answer **how to catch fish once located**: presentation choice, lure/bait/rig selection, retrieves, depth control, strike handling and bank/kayak execution.

### Seasonal playbooks

- Spring Fishing, Summer Fishing, Fall Fishing and Winter Fishing own detailed seasonal location + presentation strategy.

### Topwater

- Topwater Fishing owns broad surface-fishing strategy; Frog, Popper, Whopper Plopper, Walking Bait and Buzzbait remain narrower Gear Guides.

### Linking/retirement rules

- Use curated `kb://` links where they materially help the reader.
- Do not reintroduce retired Technique pages unless explicitly requested: Bass Fishing, Spring Bass Fishing, Fall Bass Fishing, Bass Power and Search Overview, Color and Scent, Paddle-only Kayak Strategy, Seasonal Bass Guidance and Water Visibility.

## FISH108 release policy — critical

Full policy: `pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md`.

### Fast Content Release

Use only when **every changed repository file** is under one or more of:

- `pwa/Gear/`
- `pwa/KB/`
- `pwa/Catches/`

Before mutation, restore current source/open PRs and validate source revision/ancestry, record hashes/base fields where applicable, conflict state, IDs/schema/types/paths/references, notes/media actions and supplied media metadata. Apply only requested changes; preserve unrelated/newer source and user-uploaded bytes.

Use one lightweight content PR, locked cached dependencies, canonical production build/source inventory validation, generated-release verification, exact-current-main guard, Pages deployment and dependency-free byte-for-byte hosted/release-identity verification.

Do not manually escalate routine content-only work to the full app suite unless a genuine non-content issue is discovered. Routine Fast Content Releases do **not** consume application task IDs or require per-item project-state documents.

### Full Application Release

Runtime/UI/assets, service worker, schema/contracts, tests, build/tooling, dependencies, workflow, migration/recovery/offline architecture or mixed content+non-content changes use the full suite. Documentation-only project-state reconciliation does not publish the PWA.

## Durable authoring/application behavior

- Gear/KB Add/Edit remains **Prepare Changes → Copy Changes**; copying is not saving and the browser does not write GitHub source directly.
- GitHub upload links target physical `/pwa/...`; packages use logical `Gear/...`, `KB/...`, `Catches/...` paths.
- Existing IDs remain stable unless intentionally retired/replaced.
- Simple Markdown narrative edits may be direct; structured fields/categories/types/specifications/links/pictures/sequences/paths/relationships use the source-aware workflow.
- KB `description` maximum is 80 characters.
- Same-page Markdown links use renderer-generated lowercase punctuation-stripped hyphenated anchors.
- FISH091: complete offline library is explicitly prepared through **Connection Status → Update offline library**.
- FISH096: Knot sequences use explicit ordered `pictureSequence` frames under `pwa/KB/Knots/assets/<id>/`.
- FISH102: Line-Tackle-Knot Reference is pinned first only under KB → Knots.
- FISH103: external HTTP(S) links open new-tab; internal/local links remain same-tab.
- FISH107: Skylety Fishing Hook Sharpener canonical type is `Tools`.
- `.github/workflows/fishing-production.yml` is the sole active publisher.

## Active backlog highlights

- FISH-TODO-008: RVR119 Under Seat Tackle Storage remains back-ordered/not purchased and is the user's #1 needed fishing equipment item.
- FISH-TODO-014 remains open; do not infer the existing HyperSeal 3600 resolved the historical deep-box target.
- FISH-TODO-019/020/021/022/023: Texas Rig, Carolina Rig, Alabama Rig, Neko Rig and Spoons KB pages remain open.
- FISH-TODO-039: Apply T-9 on kayak hardware.
- FISH-TODO-040: purchased Force Current commissioning/integration and hard-plastic storage-case selection, described above.
- Fishing Companion v3 **requirements, design, UX and staged implementation plan all APPROVED October 19, 2026**, the last with **mandatory full new-chat transfer before P0**. See the top CURRENT NEW-CHAT START instructions and [plan approval record](pwa/docs/Fishing_Companion_v3_Implementation_Plan_Approval_2026-10-19.md). Plan now authorizes scoped post-transfer P0; AUTH-P0, provider/permission/cost decisions, any v2 maintenance release, provisional draft reliability removal and later explicit v3 production cutover gates remain binding.

FISH-TODO-030 was explicitly deleted and must never be restored. FISH-TODO-038 outer rod holder work is complete.

## Chat-transfer convention

For this project, **“It’s time to transfer to a new chat”** is the standard transfer cue. Ask once to confirm the full handoff. After confirmation, execute it end-to-end without repeated Proceed prompts: restore actual current `main`, open PRs and production evidence; reconcile completed/unresolved work; update authoritative records where durable state changed; preserve purchase uncertainty; cross-check the files; and finish with a clickable GitHub link to this bootstrap prompt.

## Working rules

- Use current GitHub source as authority.
- Do not repeat completed migration/cutover/release work.
- Preserve unrelated concurrent source changes and user-uploaded bytes.
- Fishing Companion change packages are implementation instructions, not JSON merely to explain.
- Do not infer purchases/ownership or close WAITING/OPEN purchase items without explicit evidence.
- Historical milestone docs and old production identities are evidence only; current exact production state comes from current GitHub/Pages evidence.
