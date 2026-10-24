# FISH118 P3-24 — Disabled isolated Worker deployment and signer provisioning

**October 24, 2026 — owner approved a disabled isolated Worker deployment and secret setup; live command acceptance and publishing remain unapproved.** R1–R4 are complete and verified in `fishing-p3-sandbox`. The existing `fishing-p3-sandbox-preview` sentinel, P1 AUTH-P0 Worker, production app and source branches must not be touched.

## First deployment — immutable disabled Worker

`src/p3-disabled-bridge-worker.mjs` is the entire separate Worker entry point. It exports only `fetch`, returning a static HTTP 503 `bridge-disabled` response on every path and HTTP method, even if both software flags are mistakenly set to true. It has **no D1 SQL, GitHub API, authentication endpoint, signer usage, operation acceptance, cron or service binding routes**. It intentionally does not import the source-only accepting service; that later stage needs a new reviewed source diff.

Private sandbox GitHub Actions will pin this exact code by SHA, verify its digest, and generate a deployment configuration for a uniquely named **new Worker** `fishing-p3-command-bridge-sandbox`: `workers_dev=false`, `preview_urls=false`, no routes, no cron, flags `P3_WRITE_ENABLED=false`, `P3_COMMAND_BRIDGE_ENABLED=false`, and D1 `DB` binding pinned to the isolated `fishing-p3-sandbox` UUID independently verified against Cloudflare metadata and Wrangler D1 inventory. No domain or public version URL will be exposed. The initial Worker must not replace or affect the existing preview Worker.

Deployment is intentionally manual-only in the private sandbox CI workflow: read-only `preflight` first, then separate exact-confirmation `deploy-disabled` only when required secrets exist. **No push-triggered deployment, no automatic retry, no Worker deletion.** A new, narrowly scoped Cloudflare Workers API token may be required because the existing D1-only token was provisioned for database migrations, not script deployments. Tokens are never placed in source/chat/logs.

## HMAC secret creation and lifecycle

The dedicated `P3_BRIDGE_HMAC_SECRET` is generated on the owner's local computer using a cryptographically secure random generator (at least 48 bytes). The same value is saved as a **private GitHub Actions repository secret** in `ginosega/fishing-p3-sandbox`. Its value is passed to Wrangler **only via a restricted, short-lived temp `--secrets-file`**, never echoed. The Worker stores it as an encrypted secret binding. This is **provisioning only**: the hard-disabled first Worker has no code path that uses the secret. No code, key, token, database identifier or signer value should be pasted in chat. The secret must not be reused for Cloudflare API credentials, GitHub installation tokens or consumer-facing PWA JavaScript.

Cloudflare secret updates (`wrangler secret put`) can create a new Worker version/deployment; avoid ad hoc secret updates outside the reviewed deployment path. Rotation must be explicitly reviewed and must update the eventual trusted Node signer and Worker verifier coherently; disabled mode allows safe rotation before activation. GitHub grants for the App were already owner-confirmed correctly configured, and require no updates.

## Postdeploy verification / blockers

- Confirm GitHub CI exact source SHA and deployment guard, separately scoped Cloudflare Worker deploy token, exact account and D1 UUID.
- Verify the new Worker actually exists, has the precise D1 `DB` binding, no `workers.dev` or preview/version URL, no routes, and both flags disabled. Do not probe an unknown public hostname as if it were safe.
- Keep all six existing application tables plus the nonce ledger empty. No operation IDs, PRs, merges, publication or production deploys should be created.
- Deploy success does NOT authorize connecting the command gate. No traffic, service binding, cron, GitHub App write token, or D1 writes are part of P3-24.
- A future separately approved release would require a real authenticated owner ID, hardened endpoint/service binding threat model, consistent HMAC secret in trusted Node and Worker, exactly-once durable nonce, and explicit write enablement with recovery/rollback procedures.

Reference docs: https://developers.cloudflare.com/workers/wrangler/configuration/ ; https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/ ; https://developers.cloudflare.com/workers/configuration/secrets/ .
