# AUTH-P0 — GitHub identity and installed-PWA feasibility experiment

**Current status (October 22, 2026): isolated, nonproduction AUTH-P0 test DEPLOYED, with strong real-device PASS evidence for the read-only Cloudflare gateway, OAuth/PWA reentry, cross-device revocation, and Windows/Android verified offline operation and persistence. AUTH-P0/G1 remains OPEN pending targeted security/operational proof and the owner's hosting/session policy decision. See the [formal G1 closeout and hosting decision draft](AUTH_P0_G1_Closeout_and_Hosting_Decision_2026-10-22.md). Production is unchanged; PR #262 remains draft/unmerged.**

This is a deliberately separate implementation in `experiments/auth-p0/`. It does not import the live PWA, alter its UX, install a GitHub App, publish to `main`, enable repository writes or configure a live host. Do not merge this draft PR into the application release path. Only a separate, future approved v3 publishing stage may add the actual write API.

**Evidence ordering:** The initial matrix below is a historical snapshot of the standalone harness tests *before* the gateway checks. Later entries supersede its then-pending revoke-all/offline/PWA gateway items. The [G1 closeout](AUTH_P0_G1_Closeout_and_Hosting_Decision_2026-10-22.md) is the consolidated current assessment; do not mark historical rows as newly tested without owner evidence.

**Owner approval recorded, October 22, 2026:** The owner explicitly approved the [formal G1 closeout and hosting decision](AUTH_P0_G1_Closeout_and_Hosting_Decision_2026-10-22.md) **as written**. The approved document remains unchanged. The exact scope and conditional outcomes are preserved in the separate [approval record](AUTH_P0_G1_Closeout_Approval_2026-10-22.md): **conditional gateway architecture direction approved; G1-A–E approved as the next tests; GitHub authorization-revocation/session lifetime policy still requires a later choice; AUTH-P0/G1 remains OPEN; P3 and production cutover remain unauthorized.**

## Owner-reported live field evidence — October 22, 2026

**Test deployment:** Cloudflare Free Worker `fishing-auth-p0-test` on `https://fishing-auth-p0-test.ginosega.workers.dev`, with D1 database `fishing-auth-p0`, `DB` binding, `APP_ORIGIN` and encrypted OAuth client/owner-ID settings. GitHub App `fishing-companion-auth-p0`, OAuth-only, no repository installation or GitHub write permissions. No secret values or OAuth tokens are committed or recorded here. This is the standalone same-origin PWA proof, **not** an integration with `https://ginosega.github.io/fishing/`.

The owner directly performed the following tests on their own devices and reported outcomes in the Fishing project chat. Device OS build, Chrome/Edge exact versions and timestamp-by-test were not collected.

| Device, browser/app | Scenario | Field result |
| --- | --- | --- |
| Windows Microsoft Edge ordinary browser | GitHub OAuth sign-in and approved owner identity | **PASS** — authenticated owner displayed |
| Windows Edge ordinary browser | Close tab, open new tab | **PASS** — existing session recognized |
| Windows Edge ordinary browser | Close all Edge windows, relaunch Edge | **PASS** — existing session recognized |
| Android Chrome ordinary browser | GitHub OAuth sign-in | **PASS** — authenticated owner displayed |
| Android Chrome home-screen shortcut | First launch from shortcut | **PASS** — session recognized; **not** considered standalone PWA proof |
| Android Chrome standalone installed PWA | Chrome offered `Install app`, app installed/launched | **PASS** — existing owner session recognized |
| Android standalone installed PWA | Sign out, then start GitHub OAuth from within PWA | **PASS** — callback returned to installed PWA; sign-in succeeded |
| Android Chrome and installed PWA | Sign out inside installed PWA, switch to and refresh existing Chrome tab | **PASS** — Chrome reported signed out |
| Android standalone installed PWA | Fully dismiss from Android recent-apps screen, then relaunch | **PASS** — session persisted |
| Android standalone installed PWA | Restart Android phone, launch installed PWA | **PASS** — session persisted |
| iPhone/iOS | All real-device scenarios | **NOT TESTED** — owner has no iPhone; explicitly chose to skip |
| Android Edge installed PWA | All real-device scenarios | **NOT TESTED** |
| Live GitHub Pages site to separately hosted Worker | Cross-origin authorization/session/cookie transport | **NOT TESTED**; principal unresolved P1 design gate |
| Unauthorized different GitHub account | Live OAuth sign-in denial | **NOT TESTED**; mock unit tests cover basic denial |
| Explicit revoke-all, session expiry, authorization cancellation | Live device cases | **NOT TESTED**; unit-level revocation/expiry/state checks are not equivalent |
| Blocking third-party cookies | Live browser test with GitHub Pages as caller | **NOT TESTED**; do not assume CORS solves blocked third-party cookies |

**Observed bug and correction:** The first deployed dashboard-editor Worker did not permit PWA manifest/icon loading under the strict CSP. Android Chrome offered `Create shortcut` but not `Install app`. On October 22 the experiment branch added `manifest-src 'self'; img-src 'self'` and a source-level regression check for CSP and manifest/assets; the owner deployed the corrected single-file Worker `cloudflare-editor-worker.js`, after which Chrome offered genuine installation. This fixes the same-origin test harness only.

**Interpretation:** One owner, first-party Cloudflare hostname, HttpOnly app cookie, and real installed Android Chrome PWA proved successful for tested sign-in, same-app OAuth reentry, sign-out, session sharing, browser/app restart and Android device restart. It **does not establish** usable first-party authentication for the GitHub Pages production origin. Original first-party cookies are scoped to `ginosega.workers.dev`; GitHub Pages `ginosega.github.io` calls would be cross-site and may lose cookies under privacy controls. No production app, repository authoring route or publishing service was deployed. **Keep P1 AUTH-P0 gate open**, keep this PR draft/unmerged; evaluate and separately approve an end-to-end session transport for the Pages-hosted app before P3/P4 implementation or any cutover. iOS is explicitly untested rather than passed/failed.

## Approved next-phase read-only gateway experiment — October 22, 2026

**Owner authorization:** The owner explicitly approved extending the **existing Cloudflare AUTH-P0 test Worker only** with a read-only `/fishing/` gateway of `https://ginosega.github.io/fishing/`. The separate OAuth-only GitHub App/Cloudflare Free configuration is retained. No production Pages URL, deployed v2 source, GitHub App permission, installation, custom domain, paid service, canonical authored content, or workflow is changed. **Historical implementation note:** the original gateway code was prepared before deployment; the subsequent owner-confirmed live deployment and real-device tests are recorded below and assessed in the formal G1 closeout.

The gateway source is [`gateway.mjs`](gateway.mjs), imported by [`src/worker.mjs`](src/worker.mjs) and inlined without dependency in the [dashboard editor version](cloudflare-editor-worker.js). Route `/fishing/` and children are GET/HEAD only and proxy to the **hard-coded** Pages hostname/path without any inbound cookies, Authorization or browser headers. Reject redirects, unsupported encoding, invalid paths, upstream failures and write methods. Never rewrite public app bytes or reflect upstream `Set-Cookie`. Workers explicitly request identity encoding and fail closed on compressed upstream assets to protect SHA-verified PWA content. Proxy response caching is disabled for this experiment.

`GET /auth/start?return=%2Ffishing%2F` is a narrowly allowlisted **test-only** launch variation; its one-use cookie-bound GitHub OAuth state receives a `.f` suffix and is stored as a D1 state hash. After a successful owner OAuth callback the server redirects to `/fishing/` instead of the existing test harness `/`. Other return destinations are rejected. The callback URL in the GitHub App remains `/auth/callback`; no credential or persistent session token is placed in the URL.

**Important constraint:** the published v2 app has no built-in OAuth UI. Its release-aware SW intercepts all navigation within `/fishing/`, and SHA checks forbid test-only HTML/JS injection. The existing root AUTH-P0 harness includes test links to the gateway and the allowlisted sign-in-return flow, but this **does not prove sign-in initiated from the final v3 Connection Status screen**. It will require a later isolated signed-off v3 application UI preview, never an unapproved change to production. The proxy can validate first-party cookie availability, app/release/offline behavior and OAuth callback routing with the real published PWA.

**Automated checks prepared:** `node --test test/*.test.mjs` includes seven read-only proxy test cases (`test/gateway.test.mjs`) covering byte preservation, no leaked browser credentials, HEAD behavior, disallowed writes, fixed-origin routing, no open redirects, origin failures and disallowed compressed assets; the expanded original Worker suite covers allowlisted state-bound callback and both entry points. The seven gateway tests passed locally on Node 22. Full expanded suite, Cloudflare runtime and actual Pages PWA byte-verification are separate acceptance steps; no claim of hosted proof yet.

**Safe dashboard deployment after review:** Go to `fishing-auth-p0-test` → Edit code → select Latest → replace the code with the `Raw` text of `cloudflare-editor-worker.js` from this experiment branch → Deploy the **test Worker only**. No secrets or D1 migration are necessary. The original AUTH-P0 test root remains at `/`. New gateway entry URL is `https://fishing-auth-p0-test.ginosega.workers.dev/fishing/`. Verify the app first in a normal browser before installing its **separate** Android PWA. Existing production app and prepared offline library on `ginosega.github.io` remain separate and must not be removed.

**Live gateway verification — owner-reported October 22, 2026:** Owner deployed the updated single-file Worker to the isolated `fishing-auth-p0-test.ginosega.workers.dev` origin and confirmed that `/fishing/` loaded the real Fishing Companion. In Windows Edge InPrivate (to avoid the `/fishing/` PWA service worker's normal navigation interception), `/fishing/release.json` returned JSON with the expected production release `131ebca9c6d46fa1c1d815ad43a318f6`. The owner then opened the matching `/fishing/releases/131ebca9c6d46fa1c1d815ad43a318f6/manifest.json` and reported all five fields matched: `releaseId` above, `base=/fishing/`, counts `gear=100`, `kb=60`, `catches=12`. This is **field confirmation of release metadata and basic app loading**, **not** independent SHA comparison of all proxied files or proof that full offline preparation, installed-PWA return, or write security work live. Offline integrity proof remains in progress. Entering a manifest/release URL in ordinary regular Edge may be intercepted as home-page navigation by the existing service worker; the InPrivate observation is stronger evidence for the direct gateway file response.

**Live offline-library preparation — owner-reported October 22, 2026:** On the Cloudflare gateway in regular desktop Edge, the owner selected **Connection Status → Update offline library**. The application reported **“Offline library ready”**, **575 files**, with **no errors**. The verified-release manifest has **575 application file entries**; the build writes the manifest and `release.json` separately, yielding **577 total hosted files**. The SW's `state()` correctly reports `entry.meta.files = entries.size`, while `prepareRelease()` caches the independently verified release pointer and manifest as additional metadata. This difference is **expected**, not missing files. This verifies successful gateway-origin library preparation, but a physical disconnected/reload/offline navigation test remains pending.

**Live fully disconnected gateway test — owner-reported October 22, 2026:** After the gateway-origin 575-file verified offline library reached **Ready**, the owner disconnected their Windows PC from the internet and refreshed the Cloudflare `/fishing/` app in regular Microsoft Edge. The application opened, and the owner successfully navigated **My Gear, Knowledge Base, and Catch Log**, opened Gear and KB detail pages, and verified that all tested text and pictures displayed. No failures reported. This constitutes **real offline field acceptance** for the tested Windows Edge gateway-origin PWA. It does **not** prove Android installed-gateway-PWA behavior, GitHub Pages-origin cookie sharing, full file-by-file proxy byte identity on the origin side, or v3 authoring integration. No need to alter production to obtain this result.

**Android gateway installation — owner-reported October 22, 2026:** In Google Chrome on Android, the owner opened `https://fishing-auth-p0-test.ginosega.workers.dev/fishing/`, Chrome offered **Install app**, installed the gateway version, and launched the actual Fishing Companion successfully as a standalone PWA without the normal Chrome address bar. All three installation/launch checks **PASS**. This is **not yet** proof of GitHub OAuth callback returning to that installed `/fishing/` app or a verified Android offline-library preparation; those scenarios remain to be tested separately. The earlier `/` AUTH-P0 harness PWA and the original GitHub Pages production PWA remain distinct.

**Android installed gateway PWA — OAuth return, owner-reported October 22, 2026:** Starting in normal Android Chrome at the root AUTH-P0 harness `https://fishing-auth-p0-test.ginosega.workers.dev/`, the owner signed out and used **Start owner sign-in then return to the gateway PWA**. After GitHub authentication, the **actual Fishing Companion** launched in the **installed standalone gateway PWA**, not a regular Chrome browser tab; the app appeared to function correctly. **PASS: state-bound OAuth callback reentry to an already installed real Fishing Companion gateway PWA.** Limitations: the live v2 PWA has no native Sign In/auth-status UI; a logged-in session inside that specific PWA UI was not visibly checked. This validates navigation/reentry of the approved gateway callback from the separate same-origin harness, **not** a production GitHub Pages cross-site cookie solution or full future v3 Connection Status flow. The draft remains unmerged and the existing live Pages app untouched.

**Android gateway session persistence after callback — owner-reported October 22, 2026:** After GitHub authorization returned to the installed standalone gateway PWA, the owner switched to Android Chrome and reopened the root AUTH-P0 authentication test on the **same Cloudflare origin**. It displayed **“Signed in as the approved owner”** without reauthentication. **PASS** for owner session availability from Chrome following the real installed-PWA OAuth return. This is not proof that the unchanged production v2 PWA itself exposes owner state (it has no such UI), nor does it establish cross-site cookie sharing with the `github.io` hostname. Cross-device revocation/expiry are still pending live tests.

**Live cross-device revoke-all — owner-reported October 22, 2026:** With an authenticated test session on Android Chrome, the owner selected **Revoke all test sessions** in the root AUTH-P0 test harness. Both Android Chrome and Windows Edge then displayed **Anonymous — read only**, with Windows tested after reopening/refreshing its test page. **PASS:** server-side application-session revocation was reflected on both devices; merely clearing a cookie on the phone would not have invalidated the independent Windows session. This supports the `DELETE FROM sessions WHERE github_id = ?` behavior verified in the original unit suite. It does **not** prove immediate GitHub App authorization revocation propagation (a separate design limitation), a forced update inside an already rendered unrefreshed app, or expiry behavior. No live publication/write API was present.

**Android gateway offline-library preparation — owner-reported October 22, 2026:** On the **installed Android Chrome Fishing Companion gateway PWA** at the Cloudflare origin, the owner selected **Connection Status → Update offline library** while online and confirmed preparation **completed successfully**, with no reported errors. This is PASS for preparation on real installed Android hardware, independently of prior Windows gateway offline acceptance. It does not yet prove disconnected Android navigation, cold restart, or image availability. Those scenarios remain in the next test.

**Android gateway PWA — offline operation and restart persistence, owner-reported October 22, 2026:** The owner subsequently confirmed that the **installed gateway PWA's offline library worked on Android** and that the **prepared offline library persisted across an Android device restart**. **PASS** for usable offline library and device-restart persistence on the tested device, resolving the owner's earlier concern. The owner did not give a per-page or per-image breakdown for Android, nor explicitly confirm that the device remained disconnected throughout the restart, so do not infer those narrower scenarios. The source SW deliberately persists release caches in Cache Storage with a completion marker and validates stored hashes; it does not intentionally purge caches on restart. No persistence fix is indicated by the observed result.

**Gateway feasibility checkpoint (owner-reported, October 22):** **PASS** on loading published Fishing Companion through Cloudflare, expected release pointer/manifest and 100/60/12 counts, Windows 575-file verified offline preparation and disconnected refresh/content/photos, genuine Android installed gateway PWA, test-harness OAuth returning to that standalone PWA, subsequent owner session in Android Chrome, cross-device revoke-all, Android verified offline preparation, Android offline use, and Android restart persistence. **Still unproven/independent gates:** exact upstream-vs-gateway byte comparison across representative assets (though verified library succeeds); future sign-in initiated within the real *v3* UI; live unauthorized second-account rejection, expiry/refresh and security-abuse hardening; operational/latency/quota behavior; actual publishing/write API (not authorized); production URL change and installed-PWA migration (not authorized). The existing `ginosega.github.io` PWA remains production; draft PR #262 remains unmerged. Treat these results as **feasibility evidence**, not production authorization.

**Acceptance sequence:** 1. `/fishing/` loads actual Fishing Companion with expected release and content counts, not AUTH-P0 harness. 2. Inspect `/fishing/release.json` and a release JSON/image; compare to actual current Pages bytes/release identity; do not infer current SHA from stale snapshots. 3. Prepare/update the gateway-origin offline library, exercise online → deliberate Work Offline → full reload/restart offline and then restore Automatic. 4. Install gateway PWA on Android (consider uninstalling the **old AUTH-P0 root-scope test PWA** first to avoid overlapping same-origin scopes, without clearing browser data). Confirm the new `/fishing/` app session and launching works. 5. From the root harness, use “Start owner sign-in then return to the gateway PWA” and record where GitHub and callback open. 6. Confirm signout/signin via the test harness, session expiry/revocation and live unauthorized identity where feasible. 7. Verify no write routes work. Do not begin P3 or P4 without formally closing remaining AUTH-P0 security gates.

## Design to verify

- Cloudflare Free Worker HTTPS origin serves a tiny **installable PWA test harness** and trusted OAuth endpoints on **one origin**. This tests whether owner sign-in, callback, and revocable HttpOnly cookie session survive desktop/Android/iOS installed-PWA navigation/restart.
- GitHub App OAuth authorization-code flow with SHA-256 PKCE, random cookie-bound state, 10-minute single-use D1-backed flow, server-side OAuth exchange, identity lookup via `GET https://api.github.com/user`, numeric owner-ID comparison.
- **No GitHub App installation, installation token, private key, content permissions, GitHub tokens in client code, token persistence, or publishing API.** GitHub App auth does not require installing the App (GitHub Docs).
- Seven-day first-party, `Secure; HttpOnly; SameSite=Lax; Path=/` opaque application session; only SHA-256 digest in D1. Explicit signout/revoke-all deletes session rows. Start and callback use top-level navigation, not cross-site fetches.
- All responses private/no-store; strict CSP, origin checks for state-changing endpoints, no CORS allowances, no token or URL logging. The test service intentionally returns 404 for `/publications` and other publishing paths.
- The callback redirects to `/` at the **Cloudflare test origin**. This is **not** proof that control reliably returns to the existing `ginosega.github.io` installed PWA; that requires real-device evaluation, and potentially a separate approved architecture decision.

### Explicit limitations / unresolved AUTH-P0 gates

1. **Not a complete v3 authentication system.** It tests same-origin mechanics only; it does not authenticate the existing GitHub Pages PWA or support a GitHub Pages-to-Cloudflare cross-origin cookie. No cross-site cookie should be assumed to work.
2. The absence of retained GitHub user tokens means **external GitHub authorization revocation cannot be detected immediately** for a still-active seven-day *application* session. Application-level `signout` and `revoke-all` do revoke immediately. If immediate GitHub-revocation propagation is required, that is a security design decision for later approval, not a proved feature.
3. This prototype has no rate limiting, edge abuse controls, operational dashboard, automated cleanup of expired rows, secondary recovery channel, production secret rotation plan, or full system audit. Those are required before a hardened v3 service.
4. `__Host-` cookies are first-party only **on the Cloudflare test hostname**. They neither authenticate the original GitHub Pages PWA nor necessarily share state with installed standalone browser storage.
5. Test PWA assets and service worker are disposable, do not cache authentication state or intercept requests, and have no integration with FISH091 offline library.
6. No production or preview publishing release is caused by this package. All code remains in the isolated branch and draft PR unless separately authorized.

## Confirmed P1 permission matrix

| GitHub App scope | AUTH-P0 permission |
| --- | --- |
| Repository Metadata | Mandatory read-only (GitHub default) |
| Repository Contents, Pull requests, Actions, Checks, Statuses | **No access** |
| Repository Workflows, Administration, Pages, Secrets | **No access** |
| All Organization permissions | **No access** |
| All Account permissions | **No access** |
| Webhooks | **Disabled** |
| Installation | **Not required for OAuth-only P1**; do not install on the repository |

Future publishing permissions are a **separate** explicit approval and are not requested here. GitHub client ID identifies the App, not the personal owner; only the numeric account ID returned from GitHub's authenticated API is trusted.

## Local, secret-free checks

Requires Node.js 20+.

```sh
cd experiments/auth-p0
npm test
```

The built-in `node:test` suite mocks GitHub and D1 and checks anonymity, owner login/session, denied accounts, one-time expired/replayed OAuth state, session revocation, CSRF/origin rejection, no write endpoint and host/env fail-closed behavior. These tests **do not** constitute an end-to-end hosted or physical device acceptance pass.

## Manual account-side setup — only after owner-authorized P1 setup

There is no configured Cloudflare connector or GitHub App administration endpoint in the present Chat GitHub connection, so account resources cannot be provisioned by that connection. **Never paste a client secret, OAuth code, Cloudflare token or private key into Chat or commit it to GitHub.** The steps below are for the account owner using their local terminal and account consoles.

1. Sign into a **Cloudflare Free** account and enable the account's `workers.dev` subdomain if needed. Pick the isolated Worker name `fishing-auth-p0` (or choose a unique test name). Confirm the exact final hostname; it must be an HTTPS Worker hostname and must not point to the Fishing Companion production PWA.
2. From a local copy of this isolated folder, run `npx wrangler login` and `npx wrangler d1 create fishing-auth-p0`. Copy `wrangler.example.toml` to local `wrangler.toml` and fill in `APP_ORIGIN` and the returned D1 database UUID. `wrangler.toml` is deliberately ignored by Git.
3. Run `npx wrangler d1 migrations apply fishing-auth-p0 --remote` to create the two small D1 tables. Nothing stores canonical fishing records or OAuth user access tokens.
4. Register a personal-account GitHub App at [GitHub Developer Settings](https://github.com/settings/apps/new). Use a unique P1-only App name, homepage URL matching `APP_ORIGIN`, and callback `https://ACTUAL_WORKER_HOST/auth/callback`. Select **Only on this account**, set **all permissions to No access except mandatory Metadata read**, turn **webhooks off**, and do **not** request user authorization automatically during installation. Do not install the App on `ginosega/fishing`; user sign-in works without a repository installation. Enable expiring user access tokens if prompted.
5. On that GitHub App settings page, obtain the **Client ID** and generate one **Client Secret**. Get the numeric ID of the single approved GitHub account from the trusted GitHub account profile/API (`GET https://api.github.com/user` while authenticated, or `GET https://api.github.com/users/USERNAME` for public ID). Do **not** place the secret or numeric allowlist in committed source.
6. From the local project, configure each secret using the interactive commands `npx wrangler secret put GITHUB_CLIENT_ID`, `npx wrangler secret put GITHUB_CLIENT_SECRET`, and `npx wrangler secret put OWNER_GITHUB_ID`. Enter each value at the prompt (not as command-line arguments, terminal history, or in Chat). Wrangler's `secret put` may deploy a new Worker version; that is permitted **only for this isolated nonproduction Worker**.
7. Run `npx wrangler deploy` for the isolated Worker. Open its exact HTTPS address. Verify that the PWA test harness loads, session is anonymous, the GitHub sign-in link opens the expected GitHub App, and the callback returns to the test origin. Keep production untouched.

**Host-order dependency:** GitHub App callback registration needs the confirmed Worker hostname, and the Worker secrets need the GitHub App Client ID/Secret. Follow the steps in order. Do not deploy this into the existing PWA domain or Pages release process.

## Physical-device acceptance matrix and evidence

For each of the following, record date, device/OS/browser version, app installation mode, test Worker URL, result and any callback URL/focus behavior:

| Environment | Start signed out | OAuth owner callback | Close/reopen persistence | Device restart persistence | Sign out and revoke-all | Unauthorized account | Block third-party cookies |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Windows Edge/Chrome browser tab | Not assessed; see owner-reported results above | Pending | Pending | Pending | Pending | Pending | Pending |
| Android Chrome **installed** PWA | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| Android Edge **installed** PWA (if supported) | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| iPhone Safari **Home Screen** PWA | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| Browser cross-origin test with GitHub Pages as caller | Pending | Pending | Pending | Pending | Pending | Pending | **Pending; crucial** |

For each real-device sign-in, document where GitHub authorization opens (browser vs installed app), whether the callback navigates back into the installed standalone PWA or stays in a browser, and whether the session is available within the installed PWA on reopening. Test an expired session (temporarily invalidate in D1 or wait until expiry), application-level revocation on another device, and state-replay rejection. Demonstrate cross-origin denial and a direct write attempt never gaining privileges.

**AUTH-P0 must remain open** unless actual owner/denied-account results and real installed-device callback/session data are recorded. The same-origin test alone cannot choose the final GitHub Pages cross-origin session architecture. If a domain migration or browser-held application credential is proposed later, request a new user decision before changing v3 design.

## Official documentation consulted

- GitHub: [GitHub App user access tokens](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app); [OAuth-only apps need not be installed](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-with-a-github-app-on-behalf-of-a-user); [permissions](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app)
- Cloudflare: [Workers free plan limits](https://developers.cloudflare.com/workers/platform/limits/); [D1 setup](https://developers.cloudflare.com/d1/get-started/); [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/); [Wrangler secrets](https://developers.cloudflare.com/workers/wrangler/commands/workers/)