# P3-2 — Browser-only, read-only GitHub App installation verification

**Authority:** Owner approved the isolated P3 preview and GitHub App sandbox on October 22, 2026, and confirms all four original GitHub App Worker bindings have been saved. **This step performs no content write, creates no PR and leaves publishing disabled.** The sandbox is the private `ginosega/fishing-p3-sandbox`, exact GitHub repository ID **`1430581407`**. The production `ginosega/fishing` repository and AUTH-P0 Worker are out of scope.

**Current status:** The source and test suite are committed to draft PR #263; Cloudflare deployment of this diagnostic is **not yet reported or verified**. ChatGPT has no Cloudflare management connection and cannot run it against stored Cloudflare secrets.

## Live proof completed — HTTP 200 (owner reported)

The owner completed the hosted read-only test with the corrected outbound GitHub `User-Agent`. The Edge console returned:

```json
{"verified":true,"repository":"ginosega/fishing-p3-sandbox","repositoryId":1430581407,"tokenScope":"contents:read","publishingEnabled":false}
```

**This closes the P3-2 read-only installation-authentication proof as PASS.** The owner supplied the HTTP 200 response and diagnostic key **length 48**, but no secret or private key content was shared. The Worker authenticated to GitHub and verified the *exact private sandbox*, requesting only a restricted, read-only installation token. The earlier GitHub API 403 errors cleared after adding the required `User-Agent: fishing-p3-sandbox-publisher` request header.

**Immediate next action:** Delete the `P3_DIAGNOSTIC_KEY` **Cloudflare Secret**, deploy the resulting Worker settings change, and optionally verify that an attempted diagnostic call now returns 403. This cleanup remains **pending owner confirmation**. Retain the other four settings; `P3_WRITE_ENABLED` must stay exactly `false`. Do not repeat the App credential registration steps or expose keys in chat.

Read-only proof does not authorize a writable sandbox publishing trial. The G3 privileged-write hardening, trusted owner session, CSRF, idempotent D1 operation coordination, branch protection / required exact-head source checks and deployment identity verification remain distinct pending gates.

## One additional temporary secret

To prevent anyone on the Internet from triggering the sandbox token check, the diagnostic route requires a fresh **temporary** high-entropy key, **separate** from the GitHub App PEM and unrelated to OAuth passwords. This key is a test-only capability, and we will delete it after verification.

1. Using your password manager, generate a new **32–64 character random alphanumeric string**. Save it in a local temporary note; **do not post it in chat or GitHub**.
2. Open [Cloudflare Dashboard](https://dash.cloudflare.com/) → Workers & Pages → **`fishing-p3-sandbox-preview`** → **Settings** → **Variables and Secrets** → **Add**.
3. Add the following:
   - Name: **`P3_DIAGNOSTIC_KEY`**
   - Type: **Secret**, *not* Text
   - Value: the new random string
4. Click **Deploy** to apply it. Do **not** modify `APP_ORIGIN`, `DB`, `P3_GITHUB_APP_ID`, `P3_GITHUB_INSTALLATION_ID`, `P3_GITHUB_PRIVATE_KEY` or `P3_WRITE_ENABLED=false`.

## Deploy the prepared diagnostic code — no terminal

1. Open [the **single-file** Worker for Cloudflare dashboard pasting](worker-dashboard-paste.mjs) on GitHub (browse the exact `feature/fish118-p3-mock-publisher` branch of `ginosega/fishing`).
2. Click **Raw**. Use **Ctrl+A** and **Ctrl+C** to copy the *entire* JavaScript file (including its initial comments).
3. In the **existing new P3 Worker only**, open **Edit code**. Replace its prior disabled test code completely with the copied code. Do **not** use the separate `src/worker.mjs` source file for manual dashboard copying: it imports another module that the editor will not automatically include.
4. Click **Deploy**. The new version retains `GET /health` and `GET /session`, all publishing routes remain **503**, and it adds exactly one temporary **POST `/_internal/verify-sandbox`** endpoint.
5. Test **`/health`** at the Worker's exact existing URL. Expected result remains `{"ok":true,"ready":false,"mode":"preview-no-publishing"}`. If that fails, stop and roll back to the previous P3 Worker version.

## Send one owner-controlled request from Edge (without putting any secret in a URL)

1. In **Microsoft Edge**, open the P3 Worker's **actual `workers.dev` /health URL**, the same one you verified previously. Stay on that page.
2. Press **F12**, open **Console**. If Edge warns against pasting code you don't understand, inspect the three lines below: they ask for your temporary diagnostic key, send a **single POST to the same Worker's `/_internal/verify-sandbox` endpoint**, and print the status/response. Nothing is sent to ChatGPT or GitHub from your browser.
3. Paste the following lines into the Edge Console and press **Enter**:

```javascript
const key = prompt("Enter your temporary P3 diagnostic key:");
const response = await fetch("/_internal/verify-sandbox", {
  method: "POST",
  headers: { "X-P3-Diagnostic-Key": key }
});
console.log(response.status, await response.text());
```

4. Enter the *temporary* 32–64 character diagnostic key into the browser prompt. **Never paste the PEM private key, App installation token, or a real user password.**
5. Expected response is **HTTP 200** with:

```json
{"verified":true,"repository":"ginosega/fishing-p3-sandbox","repositoryId":1430581407,"tokenScope":"contents:read","publishingEnabled":false}
```

If you see **HTTP 403**, the temporary key is missing/wrong, the secret wasn't deployed, or the key is too short. If **HTTP 503**, the App credentials, installation, exact sandbox scope, GitHub availability or configuration may have failed; do not assume authentication succeeded. Share only the **HTTP status and JSON response (no secrets)** in chat.

### Diagnostic 503 follow-up (October 22)

The owner completed this test with a **48-character key**. The Worker returned `503 {"ok":false,"ready":false}`, confirming the request reached the P3 Worker but the initial diagnostic didn't distinguish its fail-closed causes. **No sandbox authentication PASS and no GitHub write is claimed.**

The current source adds a **nonsecret `code`** field to authorized 503 responses. To use it:

1. First inspect **`P3_WRITE_ENABLED`** in the *P3 preview Worker*: type **Text**, value exactly **`false`** (lowercase); do **not** set it true.
2. Leave `P3_DIAGNOSTIC_KEY` and the four stored App bindings unchanged. **Do not regenerate or paste any private key.**
3. Copy the **latest single-file [`worker-dashboard-paste.mjs`](worker-dashboard-paste.mjs)** into the P3 Cloudflare Worker code editor and **Deploy**. Confirm `/health` still returns `{"ok":true,"ready":false,"mode":"preview-no-publishing"}`.
4. Repeat the Edge console POST above with the *same saved temporary key*. A 503 now contains one of the **nonsecret stage codes** below; send back its full JSON (not your key):
   - `write_flag_not_false`: `P3_WRITE_ENABLED` absent or not exactly the text `false`
   - `invalid_app_identifiers`: App ID or Installation ID missing/non-numeric
   - `missing_app_private_key` / `app_key_signing_failed`: PEM Secret missing or unusable
   - `installation_token_http_401`, `...403`, `...404` or `...0`: GitHub rejected the App JWT, token scope or installation (or another HTTP failure)
   - `installation_token_scope_mismatch`: minted token missing expected Contents-read permission
   - `sandbox_read_http_403`, `...404`, `sandbox_identity_mismatch`: sandbox read or identity failed
   - `unexpected_proof_error`: some other source issue; never expose the raw GitHub error or secrets
5. If still 403 after redeploy, confirm `P3_DIAGNOSTIC_KEY` is still a Cloudflare Secret. If a different 503 response appears, don't repeatedly rotate the key; diagnose the returned stage first.

### Required GitHub User-Agent fix (October 22)

The owner reconfirmed that GitHub App ID, installation ID, sandbox selection, and permissions match. The latest Worker then returned `{"ok":false,"ready":false,"code":"app_installation_lookup_http_403"}` from the *first JWT-authenticated GET*, before any token request. Source review found a concrete bug: the common outbound GitHub request headers were missing the required **`User-Agent`** field. GitHub explicitly documents returning **HTTP 403** for missing/invalid User-Agent. Cloudflare Workers must not be assumed to provide a suitable default. The header is now supplied explicitly as `User-Agent: fishing-p3-sandbox-publisher` in **every** GitHub API subrequest; tests enforce it across the entire preflight and read-only path.

**Next action:** The owner needs only to re-copy the latest [single-file Worker code](worker-dashboard-paste.mjs), replace the existing code in the **P3 preview Worker**, and Deploy. Confirm the unchanged `/health` response and rerun the *existing* Edge console POST with the **existing** 48-character temporary diagnostic key. Do not recreate or share GitHub App private keys, rotate/recreate App IDs, or change Cloudflare settings. `P3_WRITE_ENABLED` must remain `false`. If a new failure code appears, share only the nonsecret status/JSON body and diagnose that stage; after a 200 result, delete the temporary diagnostic key secret.

**This is a plausible root-cause fix based on published GitHub requirements, not a claimed live success**; until the owner reruns the hosted diagnostic the real App installation has not passed its read-only check.

Sources: [GitHub User-Agent requirement](https://docs.github.com/en/rest/using-the-rest-api/getting-started-with-the-rest-api#user-agent), [Cloudflare fetch request header support](https://developers.cloudflare.com/workers/runtime-apis/fetch/).

### Token HTTP 403 even after owner settings match

The owner confirmed that the GitHub App ID, installation ID, selected sandbox repository, and requested permissions **all match in the GitHub UI**, but the live diagnostic still returned `installation_token_http_403`. GitHub documents both the token-issuance endpoint's 403 status and the JWT-authenticated, **read-only** endpoints `GET /app/installations/{id}` and `GET /repos/ginosega/fishing-p3-sandbox/installation`.

The latest Worker diagnostic now runs those two GET preflight checks before it attempts the token POST. The first checks that GitHub sees the expected numeric App ID and installation ID, `ginosega` account, installation not suspended, selected-only repository scope, **Contents read/write** and **Pull requests write**. The second confirms the *same App installation* is attached to the private sandbox. Any failure returns a fixed, nonsecret code such as `app_installation_lookup_http_403`, `app_installation_id_mismatch`, `app_installation_permissions_mismatch`, or `sandbox_installation_lookup_http_404`; token issuance is not attempted if the preflight fails. If the two GET calls pass but the POST still fails, the response remains `installation_token_http_403`, proving the denial is limited to token creation rather than a missing installation.

To run the improved check, **do not change or regenerate any existing GitHub App values**. Re-copy the latest [`worker-dashboard-paste.mjs`](worker-dashboard-paste.mjs) using GitHub **Raw**, replace only the P3 preview Worker source through Cloudflare **Edit code**, **Deploy**, confirm `/health`, and run the **same diagnostic key POST** from Edge Console. Share only the new HTTP status and JSON body.

The new code does **not** collect or disclose the GitHub API response body, signed JWT, PEM or installation access token. Publishing stays off; delete the temporary diagnostic secret after testing.

The extra diagnostic details are only available after successful comparison against the temporary `P3_DIAGNOSTIC_KEY`. They never return GitHub response bodies, App private keys, JWTs, or installation tokens. All publishing endpoints remain disabled.

**Alternative:** The Workers dashboard quick editor may expose an **HTTP** testing tab where you can set method **POST**, path `/_internal/verify-sandbox`, and header `X-P3-Diagnostic-Key`; be careful that it must target the **actual deployed Worker origin**, not a temporary preview hostname, because the Worker rejects any origin other than `APP_ORIGIN`. The Edge method above is deterministic for the deployed URL.

## Immediately disable the diagnostic when finished

Return to **Cloudflare → P3 Worker → Settings → Variables and Secrets** and **delete only `P3_DIAGNOSTIC_KEY`**, then **Deploy**. This makes the diagnostic route reject all requests, even though its code remains temporarily deployed. Do not remove the four GitHub App settings. Do not enable `P3_WRITE_ENABLED`.

Optional stronger cleanup later: redeploy the previous no-diagnostic P3 Worker version. Never deploy to AUTH-P0 or production.

## Security meaning and remaining work

A successful result verifies that the configured sandbox GitHub App key and installation can mint a **short-lived, repository-ID-restricted Contents-read-only token**, and that it can fetch the **correct private repository**. The token and signed App JWT are never returned to your browser. No repository changes occur.

**A successful read-only check does NOT independently prove** that the GitHub App is *only installed* on the sandbox (verify this in GitHub → Settings → Applications → Installed GitHub Apps → Configure), or that the App has the expected Contents / Pull Requests **write** permissions. It also does not authorize turning on publishing before the privileged-service security/CI/rules checks.

The diagnostic is a temporary setup gate, not an owner-session replacement. Later publishing APIs must still use trustworthy server-side login, anti-CSRF, D1 durability, audit and source-aware validation.
