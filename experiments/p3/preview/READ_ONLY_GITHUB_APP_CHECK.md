# P3-2 — Browser-only, read-only GitHub App installation verification

**Authority:** Owner approved the isolated P3 preview and GitHub App sandbox on October 22, 2026, and confirms all four original GitHub App Worker bindings have been saved. **This step performs no content write, creates no PR and leaves publishing disabled.** The sandbox is the private `ginosega/fishing-p3-sandbox`, exact GitHub repository ID **`1430581407`**. The production `ginosega/fishing` repository and AUTH-P0 Worker are out of scope.

**Current status:** The source and test suite are committed to draft PR #263; Cloudflare deployment of this diagnostic is **not yet reported or verified**. ChatGPT has no Cloudflare management connection and cannot run it against stored Cloudflare secrets.

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

**Alternative:** The Workers dashboard quick editor may expose an **HTTP** testing tab where you can set method **POST**, path `/_internal/verify-sandbox`, and header `X-P3-Diagnostic-Key`; be careful that it must target the **actual deployed Worker origin**, not a temporary preview hostname, because the Worker rejects any origin other than `APP_ORIGIN`. The Edge method above is deterministic for the deployed URL.

## Immediately disable the diagnostic when finished

Return to **Cloudflare → P3 Worker → Settings → Variables and Secrets** and **delete only `P3_DIAGNOSTIC_KEY`**, then **Deploy**. This makes the diagnostic route reject all requests, even though its code remains temporarily deployed. Do not remove the four GitHub App settings. Do not enable `P3_WRITE_ENABLED`.

Optional stronger cleanup later: redeploy the previous no-diagnostic P3 Worker version. Never deploy to AUTH-P0 or production.

## Security meaning and remaining work

A successful result verifies that the configured sandbox GitHub App key and installation can mint a **short-lived, repository-ID-restricted Contents-read-only token**, and that it can fetch the **correct private repository**. The token and signed App JWT are never returned to your browser. No repository changes occur.

**A successful read-only check does NOT independently prove** that the GitHub App is *only installed* on the sandbox (verify this in GitHub → Settings → Applications → Installed GitHub Apps → Configure), or that the App has the expected Contents / Pull Requests **write** permissions. It also does not authorize turning on publishing before the privileged-service security/CI/rules checks.

The diagnostic is a temporary setup gate, not an owner-session replacement. Later publishing APIs must still use trustworthy server-side login, anti-CSRF, D1 durability, audit and source-aware validation.
