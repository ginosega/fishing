# AUTH-P0 — GitHub identity and installed-PWA feasibility experiment

**Status: nonproduction P1 proof only. Not deployed. No GitHub App or Cloudflare resources are created by this repository code.**

This is a deliberately separate implementation in `experiments/auth-p0/`. It does not import the live PWA, alter its UX, install a GitHub App, publish to `main`, enable repository writes or configure a live host. Do not merge this draft PR into the application release path. Only a separate, future approved v3 publishing stage may add the actual write API.

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
| Windows Edge/Chrome browser tab | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| Android Chrome **installed** PWA | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| Android Edge **installed** PWA (if supported) | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| iPhone Safari **Home Screen** PWA | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| Browser cross-origin test with GitHub Pages as caller | Pending | Pending | Pending | Pending | Pending | Pending | **Pending; crucial** |

For each real-device sign-in, document where GitHub authorization opens (browser vs installed app), whether the callback navigates back into the installed standalone PWA or stays in a browser, and whether the session is available within the installed PWA on reopening. Test an expired session (temporarily invalidate in D1 or wait until expiry), application-level revocation on another device, and state-replay rejection. Demonstrate cross-origin denial and a direct write attempt never gaining privileges.

**AUTH-P0 must remain open** unless actual owner/denied-account results and real installed-device callback/session data are recorded. The same-origin test alone cannot choose the final GitHub Pages cross-origin session architecture. If a domain migration or browser-held application credential is proposed later, request a new user decision before changing v3 design.

## Official documentation consulted

- GitHub: [GitHub App user access tokens](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app); [OAuth-only apps need not be installed](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-with-a-github-app-on-behalf-of-a-user); [permissions](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app)
- Cloudflare: [Workers free plan limits](https://developers.cloudflare.com/workers/platform/limits/); [D1 setup](https://developers.cloudflare.com/d1/get-started/); [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/); [Wrangler secrets](https://developers.cloudflare.com/workers/wrangler/commands/workers/)