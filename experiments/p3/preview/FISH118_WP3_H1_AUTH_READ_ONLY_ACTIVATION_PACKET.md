# FISH-TODO-118 / WP3 H1 — isolated authenticated READ activation packet

**Status: SOURCE-ONLY CANDIDATE; NOT APPROVED FOR PROVIDER CHANGES OR DEPLOYMENT.**
**Parent source:** draft #508, exact validated head `154b5e50bec8a8e4992bdd5fe6d978ddb0d33578`, GitHub source CI #43666746356 PASS; app source remains draft/unmerged.

## 1. Completed, separately evidenced H1 baseline

Owner-approved isolated H1 static/read-only hosting exists only at:
- Worker `fishing-v3-wp3-test`, origin `https://fishing-v3-wp3-test.ginosega.workers.dev`; **100% active Worker version** `f361544a-9374-4c4f-b73c-fe98658c3fb6`, uploaded 2026-11-15T04:52:34.840Z ([read-only inventory receipt](https://github.com/ginosega/fishing/issues/377#issuecomment-6889738461)).
- Pages `https://fishing-v3-wp3-test.pages.dev/fishing/`, immutable release `14ca85788af5a057933f74d85b242566`; owner verified 577/577 hosted pointer/manifest/asset SHA256 files. `sourceRevision=75978eaf787f9964bc645cbc8113f5be0213fd2d` is the **CI test-merge revision**, not a PR-head SHA.
- Isolated `AUTH_DB` D1 `0d8da698-87b8-4b5e-a1e7-fe6de49e5afc` (2 auth tables) and `WP3_DB` `5a47841e-7874-4ec8-9fa8-be0315f6a802` (10 operations tables); schema/index columns owner-reported PASS.
- `GET /session`, `GET /auth/start` and `GET /api/v3/authoring-source` currently return **503**; `POST /api/v3/operations` and `POST /api/v3/media` **404** (5/5 owner checks, [field receipt](https://github.com/ginosega/fishing/issues/377#issuecomment-6889644199)).

Accepted WP2 isolated read-only and public V2 remain separate and untouched. H1 static/denial acceptance does **not** establish authenticated owner/source-read acceptance.

## 2. Source-only artifact and immutable safety delta

`pwa/wrangler.wp3-h1-auth-candidate.jsonc` is an **undeployed** sibling of `pwa/wrangler.wp3-h1.jsonc`. It has the same isolated script, exact Worker origin, owner/repository, `AUTH_DB`, `WP3_DB`, Pages flag and gateway profile. The **only six** differences are the following flags changing from literal `false` to `true`:

- `D6_SESSION_ENABLED` — existing owner session read.
- `D6_OAUTH_ENABLED` — existing PKCE OAuth start/callback.
- `D6_SOURCE_ENABLED` — existing owner-only canonical `main` read.
- `D6_READ_TOKEN_ENABLED` — existing short-lived GitHub App **read-only** installation token path.
- `D6_SIGNER_ENABLED` — server-only GitHub App JWT signer.
- `D6_SIGNOUT_ENABLED` — owner-only local D1 session revocation.

`D6_WP3_RUNTIME_ENABLED`, `D6_WP3_WRITE_ENABLED`, `D6_WP3_MOUNT_ENABLED`, `D6_WP3_ISOLATED_WRITE_PROFILE_ENABLED` remain literal **false**. `D6_HOSTED_PREFLIGHT_ENABLED` remains **false**. The source-only H1 Worker entrypoint permanently rejects *all methods* under `/api/v3/operations` and `/api/v3/media` as 404; any writer flag set to `true` causes a blanket 503. It never imports the WP3 publisher, operation writer, media ticket API or GitHub write-token transport. The candidate file contains no client secrets, key material, app/installation IDs, route bindings or new provider resources.

`pwa/test/d6-wp3-h1-auth-readiness.test.mjs` enforces that exact six-flag delta, unmodified initial deployed config, no stored credentials, no provider writes and fail-closed behavior when OAuth secrets are missing. Prior #501 original OAuth/PKCE and owner/source tests, #504 H1 boundary tests and #508 deployment tests must remain passing.

**Neither a source-only CI PASS nor this file authorizes using the candidate in `wrangler deploy`.** Existing H1 deployed configuration stays in place until separate approval.

## 3. Separate owner approval still required before live provider changes

Present to the owner an exact, narrowly scoped H1 authorization for the following **as a single reviewed read-only stage**; do not assume approval from WP3 source implementation, the earlier H1 static deployment, or a documentation merge:

1. Register a **dedicated WP3 GitHub OAuth App** with only `https://fishing-v3-wp3-test.ginosega.workers.dev/auth/callback` as the callback, and validate issuer/redirect. OAuth is solely for the one human owner; do not request user repository publishing OAuth scopes.
2. Register/install or explicitly verify a distinct narrowly scoped GitHub App for the owner account, **Only select repositories: `ginosega/fishing`**, repository ID `1350909744`, owner GitHub ID `265665562`; only repository **Contents: read-only** and implicit Metadata read. No Contents write, Pull requests write, Workflows, Actions, Administration, secrets or org-wide scopes. Verify actual App ID, installation ID, granted scopes and selected repo server-side. H2 write-permission changes need a *different* approval.
3. Add only the six expected **encrypted** bindings to the **dedicated WP3 Worker**, not WP2 or public Worker: `D6_OAUTH_CLIENT_ID`, `D6_OAUTH_CLIENT_SECRET`, `D6_GITHUB_APP_ID`, `D6_GITHUB_INSTALLATION_ID`, `D6_GITHUB_APP_PRIVATE_KEY`, and `D6_CSRF_KEY`. Use newly provisioned WP3 values, never copy WP2 or private D5 credentials. IDs and private values need not be disclosed in chat, source, PR, screenshots, CI logs or shell history; only sanitized presence/name checks may be shared.
4. Approve one guarded, explicitly isolated rollout of the candidate auth/read config **after** checking the active Worker version, encrypted binding names, exact callback and Pages bytes, and exact-head CI. Preserve both D1 UUIDs. Do not automatically replace the known-good read-only release or change any V2/WP2 resource.

**Cloudflare operational caveat:** `wrangler secret put` creates a new Worker version **and deploys immediately**; it is not an inert preparation command. Never run an unguarded sequence of secret puts while assuming the active Worker version will remain unchanged. Use a separately reviewed, non-active version/staged-secret procedure or an owner-approved coordinated encrypted configuration rollout. An API/transport timeout makes the provider outcome **UNKNOWN**: inspect exact deployment history before any retry. Do not include secret values in command lines, files committed to GitHub, chat or logs.

Read-only inspection before approval is acceptable:

```powershell
npx wrangler deployments list --name fishing-v3-wp3-test
npx wrangler secret list --name fishing-v3-wp3-test
npx wrangler deploy --config pwa/wrangler.wp3-h1-auth-candidate.jsonc --dry-run
```

The dry run is **not** permission to run a real deploy. Check that `secret list` reveals names only and compare to the six-name inventory; verify that the dry run still targets the correct script, binds only the two isolated D1 databases, and has no write routes/flags. Stop if any item differs.

## 4. Post-approval acceptance matrix (owner-operated; not yet run)

- Capture new active Worker deployment version, its exact config/source provenance and retained 577/577 Pages hashes; no change to original WP2/public V2.
- On Windows Edge, initiate OAuth from the **WP3** origin: only first-party `/auth/start` redirects to GitHub, its `redirect_uri` is the exact WP3 callback, flow state is one-use PKCE and `__Host-` cookies are host-only/Secure/HttpOnly. The callback returns to `/fishing/` for the true owner only.
- Authorized owner `GET /session` returns 200 with `authenticated:true` and `authorized:true`; owner `GET /api/v3/authoring-source` returns a 200 response bound to `ginosega/fishing`, canonical `main`, the expected repo ID and a stable source/tree read. Staging read may legitimately differ from immutable Pages release test-merge SHA; verify both separately. Confirm exact canonical Gear/KB/Catch and Markdown counts against trusted main without assuming they match future revisions.
- Anonymous, foreign-owner, expired/revoked-session and wrong-origin requests must not receive canonical source. No response or browser storage contains an OAuth access token, GitHub App JWT, installation token, private key, D1 session hash or signer material. Owner-only signout revokes exactly the caller's session.
- Recheck **all methods** of `/api/v3/operations` and `/api/v3/media` yield 404 even when the real owner is signed in. Deliberately disallowed writer flags must cause blanket 503 in automated tests; do not toggle them in the live Worker.
- Fail closed if callback origin/issuer, App ID/installation, repo selection, granted scopes, D1 records, GitHub main ref, hosted release integrity or read token permissions differ. Capture only sanitized owner evidence in issue #377. No actual GitHub repository change or PR creation is an H1 acceptance step.

## 5. Explicitly not authorized

No GitHub App contents/PR **write** permission, no WP3 operation/media publisher activation, no owner operation authorizer, no writer D1 test, no H2/H3 publishing/recovery, no application `main` merge, no WP4 public Live, no WP5/6 field completion or public cutover. Each remains a separate scoped gate under the V3 completion contract and Operating Model v2.
