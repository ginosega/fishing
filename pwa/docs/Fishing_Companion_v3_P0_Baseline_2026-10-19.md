# Fishing Companion v3 — P0 Baseline and Reliability Investigation

**Status:** INITIAL P0 SOURCE/RELEASE BASELINE RECORDED — October 19, 2026. **Not P0 acceptance complete:** physical-device reproduction and measured network/image timings remain open. This report is investigative and documentation-only; it changes no v2 application, service, deployment, secrets, or canonical content.

**Authority:** [Approved implementation plan](Fishing_Companion_v3_Implementation_Plan.md), [approval and required handoff](Fishing_Companion_v3_Implementation_Plan_Approval_2026-10-19.md), approved v3 requirements/design/UX. The new-chat handoff was completed before beginning P0.

## 1. Verified baseline and distinction between source and production

- Repository: `ginosega/fishing`; latest `main` before this documentation PR: `0f2a74eaa176cae64847b87f810093b23f198156`. October 19 handoff PR #238 is merged, with no open PRs at the P0 start.
- The five mandatory root records (`README.md`, `Fishing_Context.md`, `Fishing_TODO.md`, `Fishing_Decision_Log.md`, `Fishing_New_Chat_Bootstrap_Prompt.md`) were read in that order from the exact main revision above.
- GitHub connector grants repository read/write permissions; no GitHub App, trusted broker, custom domain, external test environment or new credentials were provisioned.
- The latest production workflow returned by the Actions runs API was successful **#520 / run 38686171921**, October 15, 2026 UTC, `main` source `4fc893d044b72e61fbc36cfd82103af55bc36f97`, Fast Content Release.
- Its `deploy-content` job `116261628031` passed the exact-current-main guard, GitHub Pages deployment and **hosted byte/release-identity verifier** at `2026-10-15T05:21:12.647Z`. Logged hosted result: release `f5eab01e9d5af6101f03a7094de5b565`; 431 files; 100 Gear / 60 KB / 12 Catches; `hostedBytesMatch: true`. Workflow artifact `actual-hosted-content-verification-1` ID `11950301397` exists and is not expired.
- Live site: https://ginosega.github.io/fishing/ . The independent GET of current live `release.json` was **not available from this chat's web/container tools**; the last successful hosted verifier and lack of newer runs establish the latest **verified** deployment, not a fresh same-minute HTTP verification.
- `main` is ahead of the published source because docs-only PRs do not trigger the PWA publisher. Do not equate `main` SHA with deployed `sourceRevision`.

The production workflow `.github/workflows/fishing-production.yml` is sole publisher. Content-only eligible diffs get lightweight FISH108; application/runtime diffs get Full Application Release. The workflow's relevant `push` paths exclude `pwa/docs/**`, `pwa/README.md` and root handoff records; this P0 document alone cannot publish the PWA.

## 2. Existing architecture and test inventory

- Content roots: `pwa/Gear`, `pwa/KB`, `pwa/Catches`; canonical records: `gear.json` (100), `kb.json` (60), `catches.json` (12). Public reading and Gear/KB Prepare Changes → Copy Changes remain v2 behavior.
- Build: `pwa/tools/build.mjs`; integrity/release: `pwa/src/release.mjs`, `pwa/tools/verify.mjs`; hosted: `verify-hosted-fast.mjs` and `verify-hosted.mjs`. Content-addressed release under `releases/<id>/`; top-level `release.json` and manifest.
- Startup: `pwa/src/loader.js` registers/negotiates SW then fetches and validates release pointer/manifest and release-pinned styles/application. `pwa/src/app.mjs` fetches canonical JSON from the chosen release.
- Worker: `pwa/src/sw.mjs` intercepts same-origin GETs in scope, validates online release bytes, remembers client release contexts in a process-local `Map`, and supports explicitly prepared complete offline generations with SHA verification. `pwa/src/offline.mjs` exposes Update/Repair status; automatic public browsing is online-current, and full offline preparation is opt-in.
- UI and Markdown: `pwa/src/ui.mjs`, `pwa/src/dom.mjs`, `pwa/src/markdown.mjs`; styles `pwa/src/styles.css`, asset pages `pwa/assets/card-icons` and `pwa/assets/page-hero`.
- Tests: `pwa/test/*.test.mjs` (core, validation, offline integrity, layout/icon/hero and authoring) and Playwright `pwa/test/browser.spec.mjs`, `fish096.spec.mjs`; Playwright configured for Chromium and WebKit using desktop contexts. Full-lane tests include preview, production-root and archived-v1/cutover fixtures.
- No current browser test provides installed Chrome/Edge Android PWA OAuth-return evidence. Existing offline tests validate complete generation fallback and explicit update, but the specific *old tab → new Pages deploy → worker termination → old release subresource* sequence is not covered. Ordinary Markdown external link target/rel behavior can be asserted in browser tests, but that alone does not test Android installed-PWA activation.

## 3. Reliability investigations — observed symptoms vs source mechanisms

### REL-1: Ordinary external links in Chrome installed Android PWA

**Previously provided device evidence (not independently reproduced in this chat):** ordinary HTTP(S) links fail on tap in installed Chrome PWA, work in Chrome and Edge browser tabs; long press offers Open in browser; YouTube app links work in installed Chrome and Edge browser. Installed Edge PWA and iOS unverified.

**Source findings:** `pwa/src/markdown.mjs` changes external Markdown HTTP(S) links to `target="_blank"`, `rel="noopener noreferrer"`; `pwa/src/ui.mjs` does the same for structured record links. App internal link router intercepts `#/...` anchors only. No Android-specific link handler was found. This may interact with installed-PWA window/navigation delegation, but the exact cause remains **unknown without a device reproduction**. Do not remove safe link attributes or change YouTube delegation speculatively.

**Next evidence:** On one representative existing external link, record installed Chrome PWA tap result, long press result, Chrome browser-tab result, app/Chrome/Android version and whether a new window briefly appears; repeat in installed Edge if present and iOS only if applicable. Then create a targeted reproduction test and minimal design candidate. An independently released v2 fix requires separate approval.

### REL-2: Old open tab loses images/pages after production deploy

**Previously reported symptom:** an existing open session can show absent pages/images following a new release; no new production deployment has been triggered as part of P0.

**Concrete source-level failure path identified (requires regression test to confirm actual field cause):**
1. `sw.mjs` remembers a tab's selected release context only in `const clientContexts=new Map()`.
2. A terminated/restarted service worker has no persisted mapping for that still-open client. `contextFor()` then calls `loadOnlineContext()`, selecting the latest deployed release (B).
3. The still-open app/DOM may request a `releases/A/...` picture or Markdown page pinned to its former release (A). In the pinned-asset branch, when current context release B differs, the worker serves A only if the **explicit prepared offline fallback** happens to be A; otherwise it returns HTTP 503 (`Release unavailable for this session`).
4. The UI's `recordCard()` hides failing image elements on `onerror`. `appendMarkdown()` turns a failed request into a page-render error. These behaviors can present as blank images and missing pages.

This is a **high-confidence reproducible candidate from code**, not a claim that the user-device incident has already been recreated or that all errors share the same cause. It also risks read-after-deploy inconsistency when a new release supersedes A before an old-session resource was fetched. Test both worker-survival and worker-restart scenarios, multiple clients, with and without a complete offline library. Avoid an unbounded cache or incompatible release mixing. Preserve manifest/hash integrity and atomic release selection.

### REL-3: Card images visible 3–4 seconds after page load

**User observation, not stopwatch measurement:** approximately 3–4 seconds on desktop and mobile.

**Static repository inventory measured from main's Git tree and three canonical JSON files (not hosted transfer timings):**
- 155 representative Gear/KB image references (100 Gear, 55 KB; nine repeated image paths), **146 unique referenced picture files**, all found in source. Catch records do not have direct picture fields; their cards may derive their species image.
- Of 155 references, **61 exceed 500 KB**, **47 exceed 1 MB**, **seven exceed 3 MB**; median referenced file is **274.9 KB**, maximum **3.54 MB**. The sum **110.79 MB** counts repeated references. All 294 image blobs in the repository total approximately **185.06 MB**, including non-card assets.
- `ui.mjs recordCard()` requests `ctx.asset(record.picture.src)` — the **full canonical original** — with `loading="lazy"`; displayed as `135px` tall desktop / `100px` mobile. No build-generated card thumbnail mapping exists.
- `sw.mjs` checks online release context and verifies asset bytes, which can add latency; neither its incremental cost nor network/decode/render breakdown has been measured.

**Candidate direction, not approved as a fix:** instrument navigation start, request timing, response bytes, decode and first-visible image. Compare network transfer/decode and service-worker overhead. If supported, deterministic small build-generated thumbnails without modifying originals could substantially reduce card transfers; include them in release identity, hash manifest, offline-library size, v1/cutover tests and Full Application Release. Do not assert thumbnails alone solve the observed delay until timed.

## 4. Controlled test strategy and device matrix

**Nonproduction strategy:** Initially use existing local Playwright preview scope `/fishing/v2-preview/`, fixture-generated A/B release manifests and isolated test caches. Do not point a prototype at live GitHub Pages, modify production GitHub secrets, create a public preview environment or introduce credentials until explicit scope/provider approval. A future isolated hosted preview may be proposed if real installed-PWA OAuth callbacks cannot be modeled under the local scope. Keep production v2 untouched.

| Environment | External links | A→B release coherence | Card image first-visible latency | Authentication (later AUTH-P0) |
|---|---|---|---|---|
| Windows Edge browser | Desktop automated/manual | Controlled browser test | Network/CPU-controlled timings | Later |
| Windows Chrome browser | Desktop automated/manual | Controlled browser test | Network/CPU-controlled timings | Later |
| Android Chrome browser tab | Manual | Manual | Real network/devtools when possible | Later |
| Android Chrome installed PWA | **Manual required** | **Manual required** | **Manual required** | **Real-device hard gate** |
| Android Edge browser tab | Manual | Manual | Manual | Later |
| Android Edge installed PWA | Manual if installed | Manual if installed | Manual | Real-device hard gate |
| iPhone Safari / installed PWA | Manual where available | Manual | Manual | Real-device hard gate |
| iPhone Chrome browser | Manual where available | Manual | Manual | Later |

**Measurement protocol:** repeat a known representative Gear or KB grid with warm and cold image caches on one desktop and one Android device; gather time from navigation to first visible image and to all above-fold images, request count and image bytes, relevant response failures, effective network and device versions. Establish quantitative acceptance targets *after* collecting the baseline, not as an invented pass threshold. For A→B, retain an old tab before a controlled candidate release switch; use worker termination/restart, cold fetch of old pinned images/Markdown, prepared vs unprepared offline library and same-release byte verification. Capture 503 URLs and selected release IDs. Device issues cannot be signed off by Chromium/WebKit desktop automation alone.

## 5. Status and required next steps

- **Done at P0 start:** exact-main/handoff/open-PR confirmation; current GitHub permissions; production workflow/hosted verifier identity; architecture/release/test inventory; initial source-driven failure hypotheses; quantified canonical card-image size inventory; controlled-test and real-device matrix.
- **Not yet done:** direct live `release.json` GET from chat environment (blocked), instrumented browser/network performance, controlled reproduction of stale open-tab failure, physical Android installed-PWA link reproduction, real iOS/Edge installed behavior, signed-off quantitative thresholds, and any new preview environment.
- **Before P0 acceptance:** add deterministic A→B worker restart regression to a safe test fixture, record controlled timing trials and manual Android result; classify fixes as optional independently approved P2 v2 releases versus future v3 packages. Any code/test change uses the Full Application Release process; P0 documentation alone publishes nothing.
- **Then P1 AUTH-P0:** prepare a *proposal* for minimal GitHub App permissions, owner numeric ID allowlist, secure session hosting, and branch/CI trigger checks. Stop for explicit approval before new GitHub App/service/domain/permission/paid-provider provisioning; validate installed-PWA OAuth/session persistence before trusted publishing implementation.

**Production and scope declaration:** No runtime code, UI, service-worker behavior, canonical Gear/KB/Catch source, secrets, provider setup or deployment was changed by this P0 documentation checkpoint.
