# FISH118 P3-10 — GitHub App Checks:read permission and disabled check-reader token

**Date:** October 23, 2026. **Scope:** Owner expressly approved adding only `Checks: read` to the dedicated `fishing-p3-sandbox-publisher` GitHub App. Current status: approved by owner, but **not yet confirmed granted on the GitHub installation**; owner action required in GitHub’s App registration and installation UI. The connected GitHub interface does not expose GitHub App registration administration.

## Post-approval one-shot integration proof prepared

After the owner confirmed the GitHub App permission change was completed, the ChatGPT GitHub connector revalidated the synthetic sandbox PR and Actions evidence: PR #1 is still open/draft/unmerged; `main` remains `e37db3e8cf80f9c54badc1e56ef97382ccefec87`; PR head `7e39c018081e9677b33c3bcab7ebe80b44d924f8`; check-run ID `120492395098` from GitHub Actions ID `15368` is `completed/success`.

**Independent permission-verification limitation:** This GitHub connector explicitly disallows querying `GET /apps/fishing-p3-sandbox-publisher` and `GET /repos/ginosega/fishing-p3-sandbox/installation`, and it cannot mint a token using credentials of the separate custom publisher App. The owner's UI confirmation is evidence of the administrative action but is **not** a live App-installation scope read. Do not mark this specific App credential check complete yet.

Added [tools/verify-sandbox-check-read.mjs](tools/verify-sandbox-check-read.mjs), a trusted Node one-shot proof that composes the P3-10 restricted token issuer and P3-9 read-only observer. It pins the exact existing synthetic PR #1, requires explicit `P3_CHECK_READ_PROOF_ENABLED=true` **and** `P3_WRITE_ENABLED=false`, checks the installed App's read grant, and returns only a small immutable record (`verified:true`, repo ID, PR identity, exact check run, `canMerge:false`, `canDeploy:false`). The CLI emits only error codes on failure; it never prints App JWTs, GitHub installation tokens or private key material. Source tests use local temporary RSA keys and mocked GitHub responses, never real secrets.

**Actual live test pending:** Run this script only in a trusted Node environment with existing App ID/installation ID/private key delivered through secrets (not command-line arguments, GitHub logs or ChatGPT messages). Existing Cloudflare Worker secrets cannot be inspected through the GitHub connector, and this Node program is not automatically deployed into Cloudflare. A secure, separately approved execution path must be established before claiming live proof. If the user wants ChatGPT to navigate Cloudflare's GUI and establish that path, a temporary switch to ChatGPT Work is appropriate; any Worker code change/deploy is a distinct operational approval gate. No production or Cloudflare config changed.

---
## Requested administrative change (owner-approved, UI pending)

Open [GitHub Developer Settings → GitHub Apps](https://github.com/settings/apps), edit `fishing-p3-sandbox-publisher`, choose **Permissions & events**, change **Repository permissions → Checks** from **No access** to **Read-only**, and save. GitHub requires the owner to separately approve the newly requested permissions for the existing installation. Maintain *Only select repositories* = `ginosega/fishing-p3-sandbox`. Do not change any other App permission, add production access, enable publisher writes, create or merge PRs, or deploy Cloudflare Worker changes. GitHub docs: [modifying an App](https://docs.github.com/en/apps/maintaining-github-apps/modifying-a-github-app-registration).

Existing App state, as previously verified: sandbox-only installation, Contents/PR read-write, no Checks read. The P3 Worker remains `P3_WRITE_ENABLED=false`. Updating the App registration without owner acceptance of the new installation permissions is **not sufficient**; old installation scopes stay in effect.

## Implemented source-only token issuer

The new [sandbox-check-read-token.mjs](src/sandbox-check-read-token.mjs) is a Node-only, **disabled-by-default** read grant issuer (`createSandboxCheckReadTokenIssuer`). It performs exact immutable repository-ID checks (`1430581407`), App JWT signature, installation account/App ID/selected-repository validation and confirms **`permissions.checks==='read'`** on the actual installation **before** minting any token. It requests a single-repo installation access token restricted to exactly:

```json
{"repository_ids":[1430581407],"permissions":{"contents":"read","pull_requests":"read","checks":"read"}}
```

GitHub’s implicit `metadata:read` permission is permitted; additional or write grants and extra repositories are rejected. Tokens remain in trusted in-memory Node code only, never in a client response, log or Git remote. Issuer has no merge, write or deploy method. The sandbox check observer itself is independently disabled by default and returns `canMerge:false`, `canDeploy:false`.

## Tests and next gate

[sandbox-check-read-token.test.mjs](test/sandbox-check-read-token.test.mjs) exercises: disabled-state zero API requests, exact installation + JWT and single-repo grant, wrong repository and unauthorized scope, pending Checks:read acceptance, invalid App/owner/selection, unexpected repository grant, malformed key/403, and complete composition with the immutable-PR/head/base/GitHub Actions evidence observer. Tests use ephemeral local signing keys and mocked GitHub APIs, not actual dedicated App credentials.

**Not yet performed:** a live dedicated App proof using real installation-scoped check token. Even the existing owner GitHub connector’s successful `GET /check-runs` is **not** that proof. Once the owner approves the GitHub App installation permission update, verify the actual `installation.permissions.checks=='read'`, mint an ephemeral scoped read-only token in a reviewed trusted Node runner, read the real synthetic sandbox PR #1’s check run and return only safe evidence. Deploying a runner or diagnostic endpoint is a separate operational step; no secrets should be pasted into Chat.

**Work mode:** Only optional for the GitHub admin UI change, since current connected GitHub tools cannot edit the App registration. Chat mode supports all source-only implementation and CI checks.
