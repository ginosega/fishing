# FISH118 D5 — Isolated V3 reader candidate (source-only, October 29/30, 2026)

## Purpose and authorization boundary

The owner approved uninterrupted routine D5 source/CI work after the October 29 **129/129 Windows source PASS**. The current public GitHub Pages Fishing Companion remains **V2**, and draft PR #263 remains **unmerged**. The authenticated Cloudflare private `/__d3_pilot__/` writes only to the isolated sandbox repository. Neither pilot nor the public /fishing/ PWA is replaced by the reader candidate.

This candidate exercises integrated V3 **public-library reading** behavior without owner authorization or publishing. It is intentionally **not yet a complete V3 owner PWA** and **does not close D3 installed Android OAuth/session**, a public text-only `V3-SAVE-09` <=60-second Save-to-Live, or final production rollout. No new Worker route, provider, secret, GitHub permission, production write, release upload or public app scope is authorized here.

## Source implementation

- Optional explicit CLI `--v3-reader-candidate` **requires** `--v3-reading-mode`, exact base `/fishing/__v3_reader_candidate__/` and a distinct explicit output path. It refuses the ordinary `pwa/dist` output. A bare `--v3-reading-mode` remains SW-only and **does not** opt the public entry into V3.
- `pwa/src/entry.mjs` continues to invoke the original `bootstrap(settings)` when the candidate flag is off. Only the candidate bundle passes a read-only `v3` context; `selectV3ReaderCandidate` verifies the exact root, an explicitly marked verified manifest, matching release/source identity and HTTPS (or localhost).
- The candidate context contains **no** `auth`, `lifecycle`, `publish`, `stageMedia`, private `sandboxSource`, or owner authorization. It permits V3 Connection Status reading-mode controls, allowlisted Copy Diagnostics and local Markdown Picture Viewer but cannot expose authoring controls.
- The candidate creates its own `manifest.webmanifest` start/scope and `sw.js` at `/fishing/__v3_reader_candidate__/`, never replacing the ordinary `/fishing/` worker. Its content/release/thumbnail files are built and byte-verified under that separate base. The immutable release hash and manifest identify the candidate.
- Normal public V2 build defaults and owner-only private D3 pilot source/routes remain separate. There is **no** deployment or credential activation in this change.

## Validation

Added `D5-RC01..RC05` unit regressions for normal V2 bootstrap, no owner authority, fail-closed scope/manifest, release identity and build-option gates. Expanded isolated PR CI to build this candidate into `/tmp/fishing-v3-reader-candidate`, run `tools/verify.mjs` against all manifest-listed bytes, and assert the independent candidate release marker. CI runs **no deploy**.

Expected developer command from the `pwa` folder (use a throwaway local output, not the ordinary V2 dist directory):

```powershell
node .\tools\build.mjs --base=/fishing/__v3_reader_candidate__/ --v3-reading-mode --v3-reader-candidate --out="$HOME\fishing-v3-reader-candidate"
node .\tools\verify.mjs --out="$HOME\fishing-v3-reader-candidate"
```

Build/verify are **source-only**. Opening `index.html` as a `file://` document cannot test service workers or installation. To exercise the verified candidate in **Windows Edge or Chrome on the same PC** without any hosted deployment, run the following in another PowerShell terminal (it only binds `127.0.0.1`; stop with Ctrl+C):

```powershell
node .\\tools\\serve-v3-reader-candidate.mjs --out="$HOME\\fishing-v3-reader-candidate"
```

Then navigate to `http://127.0.0.1:4173/fishing/__v3_reader_candidate__/`. The loopback-only server never serves `/fishing/` or the D3 private pilot, handles encoded media filenames, rejects traversal and never uploads/publishes files. Tests `D5-RS01..02` cover these boundaries. In Windows Edge, verify Connection Status shows Automatic and Work Offline, Update offline library prepares a complete local copy, Work Offline persists after reload, missing online network does not break prepared reading, and Copy Diagnostics excludes secrets. Review a Gear/KB Markdown image and test its original-quality Picture Viewer. A local desktop preview **does not** satisfy installed Android PWA or actual hosted owner-auth acceptance.

A future secure-origin, isolated-scope **device test hosting** decision and proper HTTPS Android checks are required; do not publish over the canonical public `/fishing/` SW.

## Acceptance still needed

1. Exact-head independent CI PASS for all canonical PWA tests and candidate build/verify; optional owner Windows command/verification.
2. Serve the **verified independent candidate** at its exact HTTPS same-origin scope only after explicit scoped hosting/security approval; confirm no collision or accidental V2 SW/library reuse and no auto-owner publishing.
3. Windows Edge/Chrome and **installed Android Chrome PWA**: Automatic default; prepare offline library; Work Offline persists across relaunch and truly makes no routine network requests; missing/corrupted assets never mingle with live network; return to Automatic; release transitions protect dirty editors.
4. V3 local Markdown images open their original bytes (including keyboard use), existing linked images preserve link behavior, missing images show a non-fetching fallback, and Copy Diagnostics excludes secrets/operation IDs/draft text.
5. Independently integrate **owner GitHub OAuth and CSRF-backed publisher** into the proper installed V3 app scope, with session/relaunch/logout/online acceptance, before D3/D6 completion. This read-only candidate is not an auth substitute.
6. Run D6 signed-off requirement traceability, rollback and true public <=60-second canonical publication checks before any separately authorized V3 production cutover.

D4 separate direct hosted original-image byte audit and Knot-sequence replacement/interrupted upload remain documented limitations; do not manufacture new publisher writes just to repeat previous success.

## Source-CI baseline reconciliation — October 29 late

The first push-triggered isolated source CI run [#41009327363](https://github.com/ginosega/fishing/actions/runs/41009327363) passed canonical PWA tests, built and byte-verified the independent candidate, passed the standalone broker, D2/D3 bundle/CSP/Wrangler dry-run, and Windows-script parsing. Its final 760-case legacy P3 preview suite reported **759 PASS / 1 FAIL**: `P2P3-04` checked that `.github/workflows/fishing-production.yml` retains `merge-ready`, but the experimental draft branch held an outdated file missing that job. No user-facing candidate failure was implicated.

Instead of relaxing the required-check test or changing public `main`, the draft branch's entire production workflow was reconciled **verbatim** to the current protected `main` file, blob `40b71f3a5e7c4a0ec42eb434dbb8b9a12d74b580` (reconciled draft commit `a30e84fe9824a2165500dc535b0353f618ce4d4c`). This preserves the current `validate-docs` and `merge-ready` safeguards and avoids an accidental future downgrade by draft PR #263. No production workflow was edited on main, and no deploy ran. **A fresh exact-head CI result after this alignment is required before claiming the complete source suite PASS.**


## Exact-source validation success — October 30 UTC

**Full isolated push CI [#41009690121](https://github.com/ginosega/fishing/actions/runs/41009690121): SUCCESS**, exact tested draft source `fbfbf8c97f769eaeba4ff2ac0affdbc6b963d1a5`. The CI log confirms **136/136 PWA unit tests PASS**, including D5-RC01..05 and D5-RS01..02; **43/43 isolated broker tests PASS**; **760/760 private preview/P3 tests PASS**, including the previously failing P2P3-04 protected-workflow requirement. It also successfully built the candidate, validated all immutable manifest bytes using `tools/verify.mjs`, confirmed the isolated candidate release marker, bundled the D2/D3 backend source, ran CSP/Windows parsing/Cloudflare Wrangler **dry-run only**, and verified the generated pilot source. Prior run #41009327363's 759/760 result is superseded after the exact `main` production workflow was copied unchanged into the draft branch.

**Acceptance status:** isolated candidate source/CI/build/byte-verification gate **PASS**, with no deployment. It is still **not** a browser/device or installed-Android acceptance. No hosted public V2, private Cloudflare runtime or production GitHub content changed. Subsequent documentation-only commits are not code-source retests.

## October 29/30 — owner Windows feedback and isolated candidate repairs

Owner browser findings on the initial local Windows Edge candidate: **Update offline library worked**, but the **Automatic/Work Offline buttons appeared unresponsive**, and the two real Markdown PNGs in `KB/Locations/content/banks-lake.md` did not open the original Picture Viewer. This report supersedes any earlier claim of installed browser interaction acceptance. The deployed private publisher and public V2 were unaffected.

**Picture Viewer confirmed defect:** `markdown-viewer.mjs` admitted HTTPS original-image URLs but excluded the explicitly supported loopback `http://127.0.0.1` candidate origin. Changed the allowlist to HTTPS or loopback-only HTTP (`127.0.0.1`, `localhost`, `[::1]`), denying insecure remote HTTP, embedded credentials and unsafe URLs. D5-V07/08 test real Banks Lake table-style image references and negative URL cases.

**Reading-mode response/UX:** The former client imposed a 4s timeout on `V3_SET_MODE`, even though the SW verifies all 500+ cached assets before committing Work Offline; this can produce a silent timeout/uncertain visual status on slower devices. Extended Work Offline response timeout to 180s (other V3 mode requests 12s), explicitly report verification progress and selected state in the Connection Status dialog, disable concurrent submissions while waiting, provide a `Retry reading controls` action after an unavailable initial capability response, retry initial capability discovery after an explicit offline library update, and return a fail-closed error reply if verification throws. The original on-device failure did not capture a console trace proving which exact response failed; do not overstate the timeout as independently proven root cause.

**Independent exact-source [CI #41010928402](https://github.com/ginosega/fishing/actions/runs/41010928402), tested source `6a960d249dd7b9d9296f501f5f4418537cf073af`: FULL SUCCESS.** Logs establish **140/140 PWA source PASS**, **43/43 standalone broker PASS**, **760/760 private P3 suite PASS**; the candidate build/manifest byte verification PASS; *real Chromium headless*, loopback-only `D5-browser mode control responds after verified offline library preparation` and `D5-browser Banks Lake Markdown PNGs open original viewer on loopback` **2/2 PASS**. The browser test performed Automatic → prepare verified complete library → Work Offline → reload persisted → Automatic, plus opening and closing the Banks Lake original-image viewer. No Cloudflare deployment, public production modification or owner publishing write occurred.

**Outstanding:** Owner Windows **Edge** retest after stopping local loopback server, pulling latest code, rebuilding and restarting is not yet supplied; real Chromium success does not substitute for Edge owner observation. Installed Android/HTTPS candidate scope, real V3 owner-session integration, public <=60s publication proof and D6 cutover remain open.

## October 29/30 — Edge owner field findings and reader candidate verification

The owner reported three field issues **after** the previous 2/2 Chromium PASS: (1) `Reading mode` status label absent on initial Connection Status opening and after reload, appearing only after pressing a mode button; (2) header connectivity dot remained green while Work Offline was selected; (3) Markdown original-image viewer not activated for both `KB/Locations/content/banks-lake.md` and `Gear/Equipment/content/Garmin Force Current Kayak Trolling Motor with Power Steering Foot Pedals.md` images in Edge. These are **owner observations**, not signs that initial Chromium acceptance covered the Edge case.

**Fixes on unmerged V3 draft:** Connection Status renders a prefixed `Reading mode: Checking service worker…` immediately, re-reads the persisted mode every time the dialog opens, clearly distinguishes `Browser online/offline` from `Reading Automatic/Work Offline`, and displays the active candidate release/source short IDs to identify stale cached code. The dot stays green for normal browser-online Automatic, becomes **blue** when explicit Work Offline is selected (and gray when mode is not verified); the V2 indicator stays unchanged. The viewer compares validated Markdown source URLs as canonical browser URLs rather than strict raw DOM-property equality, accommodating encoded filename normalization, while retaining the same-origin/local image validation and the historical skip for images intentionally wrapped inside links. The source logic remains default OFF for public V2.

**Important release-semantics caveat:** Selecting Work Offline intentionally freezes a complete verified release; locally rebuilding candidate assets does not replace the cached release until Automatic is restored and a new library prepared. Earlier tests created a fresh browser context on each new candidate build and consequently did not simulate a previously pinned Edge candidate. This is a plausible source of Edge-vs-fresh-Chromium differences, **not a proven root cause** without the owner's active release/source identity and Edge observations. A clean InPrivate restart, fresh candidate build and mode/source identity check are required before attributing any remaining failure.

**Exact-source fully isolated [CI #41012355230](https://github.com/ginosega/fishing/actions/runs/41012355230), source `ff9dc182feb4e366ccad970a21955a79c313319e`: SUCCESS.** Logs: 140/140 PWA regressions PASS, 43/43 broker PASS, 760/760 private preview P3 PASS; candidate build and manifest-byte verification PASS; 4/4 real Chromium browser tests PASS: mode transitions and persistence, Banks Lake original viewer, Garmin real percent-encoded-space images viewer, and both article viewers while Work Offline is selected. Test run is loopback-only; no source merges to main, GitHub Pages release, Cloudflare deployment or owner publication. Subsequent checkpoint commits only update documentation.

**Still OPEN:** Owner Windows Edge acceptance, installed Android PWA/HTTPS with separate scope, D3 owner OAuth integration and public <=60s Save-to-Live, plus D6 deployment approval.

## October 30 — owner Edge retest PASS and publishing-header state semantics

The owner explicitly confirmed **the Windows Edge Connection Status reading-mode UI and Markdown original-image viewer on Banks Lake and Garmin motor both passed the retest**. Close these bounded desktop reader acceptance items. Do not interpret this as installed Android or integrated authenticated owner publishing acceptance. The owner is **remaining in the same chat**; the canonical five root docs were updated on main, with no new chat transfer.

**New owner UX decision:** Restore the public V2 convention for normal connectivity: header dot **green if browser online, yellow if browser offline**, irrespective of the V3 reading preference (Automatic or Work Offline). During a server-accepted, authenticated owner publication, use a **blue** indicator; hover `title` identifies the current stage: Submitting, Accepted, Validating, Checking, Merging, Deploying or Verifying. A confirmed `Failed`/`Conflict` is **red** and remains red across transient status read errors and dialog reopen until explicitly acknowledged/cleared by the owner (or verified new result). A temporary status-read timeout is **not** a terminal publication failure. Anonymous/nonowner UI never reveals private operation details. On verified Live, revert to green/yellow browser connectivity.

**Global header freshness:** The original owner status polling was dialog-visible only. The opt-in `trackInHeader:true` mode in `pwa/src/v3-connection.mjs` keeps one existing read-only owner operation check active roughly every five seconds **even when the dialog closes**, but only if the app tab is visible, owner authorized, online, and publication actively progressing. The normal standalone/default panel still stops polling on modal closure. Terminal success/failure, hidden tab, offline and sign-out stop polling. Existing no-overlapping-read, server-authoritative Live and no-auto-republish protections remain unchanged.

**In-app recovery:** The owner can Check publication status and, after server-confirmed terminal failure, explicitly **Acknowledge and clear failed status**. The button clears the local durable tracked failure marker so a corrected new owner edit can be submitted; it does not repair GitHub CI, an actual conflict or Worker/GitHub infrastructure. Unknown/ambiguous submissions must be reconciled by server read rather than blindly retried. For systemic failures, the app does not yet supply full diagnosis or automatic repair.

**Exact-source isolated CI:** [#41068451025](https://github.com/ginosega/fishing/actions/runs/41068451025) **SUCCESS** for source commit `1ac38306ed8d7090ac6b874182c0e7c75b936c36`. It reports **149/149 PWA tests** (including new indicator tests D5-IND01..06, sticky-terminal D3-C22 and header-poll D3-C23/24), **43/43 broker**, **760/760 private P3**, **4/4 real Chromium local candidate browser** cases, candidate immutable build/byte validation and D3 Worker dry-run. The earlier source-CI at `268018e65a0b6e786c21e9ec1027b12d1b46ec8f` independently reported 154/154 PWA; no test files were deleted in the later eight commits. Seven conditional `FISH118-M01..M07` workflow-lane test results present in the earlier log did not appear in the later log; this is a coverage difference in output to investigate before D6 if material, not seven reported failures. **No deployment** was triggered by either isolated source run. Owner has not field-tested blue/red publishing behavior in an authenticated integrated V3 app.

