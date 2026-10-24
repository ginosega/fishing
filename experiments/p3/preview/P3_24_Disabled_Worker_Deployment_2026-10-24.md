# FISH118 P3-24 — Disabled isolated Worker deployment and signer provisioning

**October 24, 2026 — owner approved a disabled isolated Worker deployment and secret setup; live command acceptance and publishing remain unapproved.** R1–R4 are complete and verified in `fishing-p3-sandbox`. The existing `fishing-p3-sandbox-preview` sentinel, P1 AUTH-P0 Worker, production app and source branches must not be touched.

## First deployment — immutable disabled Worker

`src/p3-disabled-bridge-worker.mjs` is the entire separate Worker entry point. It exports only `fetch`, returning a static HTTP 503 `bridge-disabled` response on every path and HTTP method, even if both software flags are mistakenly set to true. It has **no D1 SQL, GitHub API, authentication endpoint, signer usage, operation acceptance, cron or service binding routes**. It intentionally does not import the source-only accepting service; that later stage needs a new reviewed source diff.

Private sandbox GitHub Actions will pin this exact code by SHA, verify its digest, and generate a deployment configuration for a uniquely named **new Worker** `fishing-p3-command-bridge-sandbox`: `workers_dev=false`, `preview_urls=false`, no routes, no cron, flags `P3_WRITE_ENABLED=false`, `P3_COMMAND_BRIDGE_ENABLED=false`, and D1 `DB` binding pinned to the isolated `fishing-p3-sandbox` UUID independently verified against Cloudflare metadata and Wrangler D1 inventory. No domain or public version URL will be exposed. The initial Worker must not replace or affect the existing preview Worker.

Deployment is intentionally manual-only in the private sandbox CI workflow: read-only `preflight` first, then separate exact-confirmation `deploy-disabled` only when required secrets exist. **No push-triggered deployment, no automatic retry, no Worker deletion.** A new, narrowly scoped Cloudflare Workers API token may be required because the existing D1-only token was provisioned for database migrations, not script deployments. Tokens are never placed in source/chat/logs.

## HMAC secret creation and lifecycle

The dedicated `P3_BRIDGE_HMAC_SECRET` is generated on the owner's local computer using a cryptographically secure random generator (at least 48 bytes). The same value is saved as a **private GitHub Actions repository secret** in `ginosega/fishing-p3-sandbox`. Its value is passed to Wrangler **only via a restricted, short-lived temp `--secrets-file`**, never echoed. The Worker stores it as an encrypted secret binding. This is **provisioning only**: the hard-disabled first Worker has no code path that uses the secret. No code, key, token, database identifier or signer value should be pasted in chat. The secret must not be reused for Cloudflare API credentials, GitHub installation tokens or consumer-facing PWA JavaScript.

Cloudflare secret updates (`wrangler secret put`) can create a new Worker version/deployment; avoid ad hoc secret updates outside the reviewed deployment path. Rotation must be explicitly reviewed and must update the eventual trusted Node signer and Worker verifier coherently; disabled mode allows safe rotation before activation. GitHub grants for the App were already owner-confirmed correctly configured, and require no updates.

## Private sandbox deployment workflow prepared — October 24, 2026

Private sandbox [PR #9](https://github.com/ginosega/fishing-p3-sandbox/pull/9) passed exact-head infrastructure CI and was squash-merged to sandbox main `db616b94a19b2760a00518f775580e58d9c83978`. Its manual-only workflow [`Fishing P3 disabled command bridge (manual)`](https://github.com/ginosega/fishing-p3-sandbox/actions/workflows/fishing-p3-disabled-bridge.yml) has **no push/PR trigger**, and supports only `preflight`, `deploy-disabled` (explicit `DEPLOY-DISABLED-P3-BRIDGE-ONLY` confirmation), and `postflight`. The script pins public draft P3 source commit `503fbe5d8595981936388b81355df8cad08f5252` and exact Git blob `38c6e142cb898d547faf8131c831f8db41027050`, uses Wrangler 4.152.0 and no Cloudflare prod/preview Worker name. The initial infra PR's source pin typo was corrected before CI passed; the audited main workflow uses the correct immutable commit. Six Python guard tests passed in CI; existing synthetic-content validation was unchanged.

**Deployment not yet executed.** To avoid an account-level Admin token, owner first creates the uniquely named **empty separate Worker** `fishing-p3-command-bridge-sandbox` in Cloudflare and disables **both workers.dev and Version URLs** in its Settings → Domains & Routes. This blank Worker must be confirmed pre-existing and unrouted. Cloudflare's granular role docs require product-level Admin to create a Worker, but permit individual-Worker `Editor` to update/deploy an existing Worker; the automation then only needs the latter. Source: https://developers.cloudflare.com/workers/authorization/workers/ .

In the private sandbox GitHub repository Actions secrets, the owner adds:
1. `P3_WORKER_CLOUDFLARE_TOKEN`: separate, narrowly scoped **individual-Worker Editor** Cloudflare API token restricted to `fishing-p3-command-bridge-sandbox`, not the legacy D1 token or an account-wide Admin token.
2. `P3_BRIDGE_HMAC_SECRET`: **48 randomly generated bytes, base64url encoded** (64 characters), stored as a private GitHub Actions secret; no values in PRs/chat/logs. A Node 24 local one-liner: `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"`. Retain value locally only as long as needed to enter the GitHub secret, then securely discard the local output. GitHub Actions deploy passes it to the new Cloudflare Worker as encrypted Worker secret via protected temporary secrets file.

The previous three D1 secrets already exist in that private repository and are reused for **read-only** exact DB identity matching; no new D1 privileges are authorized. After owner setup, run **manual `preflight` only** and review actual private job logs; do not jump straight to `deploy-disabled` on guessed credentials. After preflight passes, the owner can dispatch `deploy-disabled` with the exact text `DEPLOY-DISABLED-P3-BRIDGE-ONLY`. Postflight will verify separate Worker metadata, D1 binding ID, encrypted secret binding name/type, both false flags, workers.dev disabled and Version URLs disabled.

This deployment is source-only infrastructure code until those explicit manual operator actions. It does not create a public command route, publish content, issue GitHub App write tokens, run migrations or alter production. The future trusted Node → Worker command enablement is a **separate** owner-reviewed change.

## Postdeploy verification / blockers

- Confirm GitHub CI exact source SHA and deployment guard, separately scoped Cloudflare Worker deploy token, exact account and D1 UUID.
- Verify the new Worker actually exists, has the precise D1 `DB` binding, no `workers.dev` or preview/version URL, no routes, and both flags disabled. Do not probe an unknown public hostname as if it were safe.
- Keep all six existing application tables plus the nonce ledger empty. No operation IDs, PRs, merges, publication or production deploys should be created.
- Deploy success does NOT authorize connecting the command gate. No traffic, service binding, cron, GitHub App write token, or D1 writes are part of P3-24.
- A future separately approved release would require a real authenticated owner ID, hardened endpoint/service binding threat model, consistent HMAC secret in trusted Node and Worker, exactly-once durable nonce, and explicit write enablement with recovery/rollback procedures.

Reference docs: https://developers.cloudflare.com/workers/wrangler/configuration/ ; https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/ ; https://developers.cloudflare.com/workers/configuration/secrets/ .
