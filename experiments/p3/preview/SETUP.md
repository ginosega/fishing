# P3-1 Cloudflare Free preview setup (approved, not yet provisioned)

**Owner approval:** October 22, 2026: isolated Cloudflare Free Worker/D1 plus disposable GitHub sandbox with least-privilege publishing rights approved. **Current state:** source configuration only. ChatGPT's available provider connectors cannot create Cloudflare Worker/D1 resources, create a GitHub repository or configure a GitHub App, so none of those resources is claimed as created. Do not send API tokens, App private keys, D1 IDs, installation IDs or callback secrets in chat.

## Owner-reported environment progress — October 22, 2026

The owner reports the new **preview Worker is running and reaches its isolated D1 database**, and that the **three P3 tables have now been created**. The first browser-console attempt failed because Cloudflare flattened the pasted SQL onto one line: the leading `--` SQL comment then commented out all remaining SQL. The owner correctly diagnosed and fixed the issue. These are **owner-reported** facts; table indexes and Cloudflare deployment identity have not been independently verified. **Do not instruct future D1 Console users to paste the raw commented migration**. Never use the AUTH-P0 database for P3. The GitHub sandbox repository/App installation have not yet been reported complete. Publishing remains disabled.

## Exact isolation boundaries

- **Separate new Worker:** `fishing-p3-sandbox-preview`, **not** the currently functioning AUTH-P0 test Worker.
- **Separate new D1 DB:** `fishing-p3-sandbox`. Do not migrate AUTH-P0 D1 or any production database.
- **No public-write routes:** `src/worker.mjs` implements only anonymous `GET /health` and `GET /session`; publication/auth/operation paths return 503. A successful health check returns `ready:false` and `mode:preview-no-publishing`.
- **Hostname:** only a new `workers.dev` test hostname, matched exactly against the `APP_ORIGIN` binding. No custom domain, no Pages URL changes.
- **No write-capable GitHub App credentials in the Worker yet.** No GitHub API calls in the scaffold.
- **No new paid services.** Keep Cloudflare Free and check plan before applying any resource.

## Operator-side Cloudflare creation (not executed by ChatGPT)

1. In the existing Cloudflare Free account, create an isolated D1 database named `fishing-p3-sandbox` using **Workers & Pages → D1** or the documented command `npx wrangler@4 d1 create fishing-p3-sandbox`.
2. Copy [`wrangler.jsonc.example`](wrangler.jsonc.example) to an untracked `wrangler.jsonc`; fill the new D1 database UUID and the **exact future HTTPS `workers.dev` preview origin**. The file is gitignored. Do not reuse the AUTH-P0 database ID or Worker name.
3. **D1 browser Console (owner completed table creation):** When using Cloudflare Console, **omit SQL `--` comments** and execute each `CREATE TABLE` / `CREATE INDEX` statement separately from [`migrations/0001_initial.sql`](migrations/0001_initial.sql). The browser editor may flatten pasted text to one line, causing `--` to comment out every subsequent statement. Verify the tables with `SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE 'p3_%' ORDER BY name;`. Check indexes with `SELECT name, tbl_name FROM sqlite_master WHERE type = 'index' AND name LIKE 'p3_%' ORDER BY name;`. **For future NEW databases only**, Wrangler can apply the original commented migration using `npx wrangler@4 d1 migrations apply fishing-p3-sandbox --remote --config wrangler.jsonc`. Do not reapply migration tooling to an already manually initialized database without checking schema and migration tracking.
4. Deploy **only this disabled preview worker** with `npx wrangler@4 deploy --config wrangler.jsonc`. Confirm the returned URL is the exact configured `APP_ORIGIN`.
5. Confirm `GET /health` → HTTP 200 with `{"ok":true,"ready":false,"mode":"preview-no-publishing"}`; `GET /session` → anonymous, `POST /publications` → 503, and alternate Origin/Host → 503. Record the new deployment version/Worker ID in a separate nonsecret evidence note.
6. Retain rollback: redeploy the previous **new preview** version or disable the new Worker; never switch the production Pages URL. Do not change the existing P0 Worker or its D1 database.

**Important:** The command examples are run by an owner with Cloudflare access, not by this conversation. A Cloudflare dashboard interaction may use the same settings. Never grant a blanket Cloudflare account write token to GitHub or store a token in a repository. If CI deployment is later approved, use a narrowly scoped Cloudflare token via GitHub Actions secrets and source-controlled pinned deployments; see [Cloudflare official GitHub Actions guidance](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/).

## GitHub sandbox (approved, not yet created)

1. Create a **private, independent** repository `ginosega/fishing-p3-sandbox` at [GitHub New Repository](https://github.com/new). Do not fork, copy canonical production data, or grant any App access to `ginosega/fishing`.
2. Use a **dedicated test publishing GitHub App**, distinct from the read-only/OAuth AUTH-P0 test App, in [GitHub Developer Settings](https://github.com/settings/apps). Minimal repository permissions: **Contents: Read/write; Pull requests: Read/write; Metadata: Read (GitHub mandatory)**. Grant Checks/Actions **read-only only if necessary** for the exact endpoints; never grant Administration, Secrets, Pages or Actions write.
3. Choose **Only select repositories** and install on `ginosega/fishing-p3-sandbox` **only**. Never select “All repositories.” GitHub distinguishes App authorization (who signed in) from App installation (which repository it may write).
4. Keep any GitHub App private key and installation token in provider secret storage, **not** in the browser/Client URL, repository files or chat. Do not enable the preview's disabled publishing endpoints merely because the App is installed.
5. After the repository exists, record only its nonsecret repository ID and name, the App permission set, and the no-production-access condition. Do not send App private keys/credentials in chat.

See [official GitHub App installation steps](https://docs.github.com/en/apps/using-github-apps/installing-a-github-app-from-a-third-party) and [GitHub App permissions](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app).

## Gates still necessary before testing a real publication

Server-owned D1 session and CSRF validation, a durable operation queue/leases and atomic idempotency, source-controlled deployed SHA, sandbox-restricted App installation token generation, exact PR head/check/branch rule linkage, Node-based canonical `inventorySource` validation under a trusted GitHub Actions check, recovery on crash/retry, and verified sandbox hosted identity. **This scaffold intentionally does not enable those functions**, so sandbox creation/installation does not constitute a security pass or publishing completion.
