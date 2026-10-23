# P3-1/2 Cloudflare Free preview and GitHub sandbox setup

**Owner approval:** October 22, 2026: isolated Cloudflare Free Worker/D1 plus disposable GitHub sandbox with least-privilege publishing rights approved. **Current state:** Owner reports the isolated Worker/D1 provisioned, P3 tables and indexes verified, private sandbox repository created and publishing GitHub App installed on the sandbox. The available GitHub connector still cannot retrieve the new private repository (404), so independent App installation scope and hosted Cloudflare identity have not been established here. Do not send API tokens, App private keys, D1 IDs, installation IDs or callback secrets in chat.

## Owner-reported environment progress — October 22, 2026

The owner reports that the new **preview Worker is running and reaches its isolated D1 database**, and that **all three P3 tables and all three expected indexes are created and verified** in the browser Console. An initial attempt to paste a commented migration into Cloudflare's single-line Console failed because its leading `--` comment disabled the SQL; the owner removed this blocker. **The owner also reports creating the private `ginosega/fishing-p3-sandbox` GitHub repository**. These are owner-reported results; Cloudflare deployment identity is not independently verifiable through the current connection. **The GitHub sandbox returned 404 through the available GitHub connector on October 22; this does not establish that the private repository does not exist, and likely requires refreshing the connector's allowed repository selection.** The owner subsequently confirmed **creating and installing the dedicated publishing GitHub App on the private sandbox**; the access scope remains **owner-reported, not independently verified**. The Worker remains disabled for publishing; never change AUTH-P0 or production. Never paste `--` comments into the flattened D1 browser Console.

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

## GitHub sandbox (owner reports completed)

1. Create a **private, independent** repository `ginosega/fishing-p3-sandbox` at [GitHub New Repository](https://github.com/new). Do not fork, copy canonical production data, or grant any App access to `ginosega/fishing`.
2. Use a **dedicated test publishing GitHub App**, distinct from the read-only/OAuth AUTH-P0 test App, in [GitHub Developer Settings](https://github.com/settings/apps). Minimal repository permissions: **Contents: Read/write; Pull requests: Read/write; Metadata: Read (GitHub mandatory)**. Grant Checks/Actions **read-only only if necessary** for the exact endpoints; never grant Administration, Secrets, Pages or Actions write.
3. Choose **Only select repositories** and install on `ginosega/fishing-p3-sandbox` **only**. Never select “All repositories.” GitHub distinguishes App authorization (who signed in) from App installation (which repository it may write).
4. Keep any GitHub App private key and installation token in provider secret storage, **not** in the browser/Client URL, repository files or chat. Do not enable the preview's disabled publishing endpoints merely because the App is installed.
5. After the repository exists, record only its nonsecret repository ID and name, the App permission set, and the no-production-access condition. Do not send App private keys/credentials in chat.

See [official GitHub App installation steps](https://docs.github.com/en/apps/using-github-apps/installing-a-github-app-from-a-third-party) and [GitHub App permissions](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app).

## P3-2 next: read-only GitHub App proof (not yet connected to Worker)

The owner reports creating/installing the `fishing-p3-sandbox-publisher` test App **on the private sandbox only**. The ChatGPT GitHub connector does **not** currently see the new private `ginosega/fishing-p3-sandbox` repository; access from this connector is independent of the publishing App's installation.

A **non-networked-by-default** source helper now exists at [`src/github-app-readonly.mjs`](src/github-app-readonly.mjs). It supports GitHub-generated RSA/PKCS8 PEM keys, signs an RS256 App JWT in memory, requests a **one-hour installation token scoped to `fishing-p3-sandbox` with Contents read only**, then reads and checks the exact private repository identity. It returns only nonsecret metadata. **It is not imported or invoked by the current disabled Worker; it has not accessed GitHub or used real secrets.** Unit tests use fake HTTP responses and ephemeral test RSA keys.

**Browser-only preparation — without sharing secrets in chat:**

1. Open [your GitHub Apps](https://github.com/settings/apps), select **Edit** for `fishing-p3-sandbox-publisher`, and find the **App ID** (numeric; *not* the Client ID).
2. From that App's **Install App** page, select its installation on the `ginosega` account and **Configure**. Confirm repository access is **Only select repositories**, containing **`ginosega/fishing-p3-sandbox` only**. The installation ID is the number in the GitHub browser URL, e.g. `github.com/settings/installations/<installation-id>`; **do not** substitute the App ID for the Installation ID.
3. From the App's **General** settings page, use **Generate a private key**, saving the downloaded PEM file *locally*. **Never paste its content in ChatGPT, GitHub, any issue/PR, or any tracked source file.**
4. In Cloudflare **Workers & Pages**, open **`fishing-p3-sandbox-preview`** (not AUTH-P0) → **Settings** → **Variables and Secrets** → **Add**. Add:
   - `P3_GITHUB_APP_ID`: **Text**, numeric App ID.
   - `P3_GITHUB_INSTALLATION_ID`: **Text**, numeric Installation ID.
   - `P3_GITHUB_PRIVATE_KEY`: **Secret**, complete PEM file contents including BEGIN/END lines and original line breaks.
   - `P3_WRITE_ENABLED`: **Text**, exactly `false` (or leave the existing `false` value unchanged).
   Click **Deploy** to apply bindings. Preserve the existing `APP_ORIGIN` and `DB` binding unchanged. GitHub installation token is **not** a stored secret; it will be minted on demand, expire after one hour, and never reach the browser.
5. Delete any unnecessary duplicate *local* downloaded PEM copies after Cloudflare confirms the secret exists, but first check that the private key is stored safely and can be rotated later.
6. **Stop here**: current deployed preview Worker remains disabled and has no GitHub API route. The code must be connected to a server-only, owner-authenticated test operation and verified before touching any GitHub PR/write API. Never expose or print the PEM, JWT, or installation access token.

If the owner wishes ChatGPT to inspect the private sandbox repository directly, they may **separately update the ChatGPT GitHub connector's selected repository access** to include `ginosega/fishing-p3-sandbox` without dropping existing `ginosega/fishing` access. This does **not** change the publishing GitHub App's repository installation scope.

Sources: [GitHub generating installation tokens](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app), [Cloudflare Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/).

## Gates still necessary before testing a real publication

Server-owned D1 session and CSRF validation, a durable operation queue/leases and atomic idempotency, source-controlled deployed SHA, sandbox-restricted App installation token generation, exact PR head/check/branch rule linkage, Node-based canonical `inventorySource` validation under a trusted GitHub Actions check, recovery on crash/retry, and verified sandbox hosted identity. **This scaffold intentionally does not enable those functions**, so sandbox creation/installation does not constitute a security pass or publishing completion.
