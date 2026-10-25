# FISH118 P3-27 — Approved Cloudflare Access provisioning: strict read-only policy verification

**October 24, 2026 — OWNER APPROVED ACCESS PROVISIONING.** The next approved work is to create a dedicated Cloudflare Access service token, service-auth-only application/policy, and protect the proposed ingress hostname. This does **not** approve a live command endpoint, script deployment, service binding activation, remote D1 mutation, draft PR creation/merge, or production change.

## Authoritative destination and names

- Exact future ingress host: `fishing-p3-access-ingress-sandbox.ginosega.workers.dev` (no additional paths, hostname wildcards, or other domains).
- Proposed ingress Worker name: `fishing-p3-access-ingress-sandbox` (separate from the already verified, *unrouted* `fishing-p3-command-bridge-sandbox` and existing `fishing-p3-sandbox-preview`).
- Cloudflare Access application: **Fishing P3 Sandbox Ingress**, type **Self-hosted**, exact entire ingress hostname.
- Cloudflare Access service token: **Fishing P3 Sandbox GitHub Runner**, dedicated solely to private GitHub Actions, not the D1 API token or GitHub App key.
- Access application policy: exactly **one Service Auth** policy; Include selector **Service Token** → the exact newly created token above. **No Allow, Bypass, Everyone, Any Access Service Token, email-domain, or unreviewed additional policies.** Do not add public path overrides, alternate application domains, or custom rules allowing unauthenticated requests.
- Keep the deployed command Worker **unchanged and inaccessible directly**: `P3_WRITE_ENABLED=false`, `P3_COMMAND_BRIDGE_ENABLED=false`, workers.dev + Version URLs disabled.

Official Cloudflare docs: <https://developers.cloudflare.com/workers/configuration/cloudflare-access/>; <https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/>; <https://developers.cloudflare.com/cloudflare-one/access-controls/policies/common-policies/>. Cloudflare's October 2026 **Strict service token authentication** mode is strongly recommended: it disables fallback to ordinary Allow policies for token-bearing requests and returns 401/403 rather than redirecting to login. Verify existing Zero Trust organization setting before changing global behavior, since the setting affects other applications.

## Owner dashboard provisioning sequence — no new public routes yet

1. **Zero Trust**: Confirm Zero Trust is enabled for the same Cloudflare account used by isolated D1. Do not reconfigure existing production applications.
2. **Service token first**: Zero Trust → Access controls → Service credentials → Service Tokens → **Create Service Token**. Name exactly **Fishing P3 Sandbox GitHub Runner**. Choose a reasonable short rotation window (e.g., one year; record expiration). Copy the generated Client ID and Client Secret (the Client Secret is only shown once); do not paste either into chat, issue, commit or logs. Save both to the **private** `ginosega/fishing-p3-sandbox` GitHub Actions repository secrets:
   - `P3_ACCESS_CLIENT_ID`
   - `P3_ACCESS_CLIENT_SECRET`
3. **Service-auth-only Access app**: Zero Trust → Access controls → Applications → Create new → **Self-hosted and private**. Name exactly **Fishing P3 Sandbox Ingress**. Select an exact public hostname `fishing-p3-access-ingress-sandbox.ginosega.workers.dev` via Cloudflare's supported custom-input/hostname mode where applicable. Protect the *whole hostname*, not only `/p3/internal/accept`. Add one **Service Auth** policy → **Include: Service Token** → select **Fishing P3 Sandbox GitHub Runner**. No other policies or destinations. Keep it hidden from App Launcher and do not enable Bypass/Public overrides.
4. **Independent read-only metadata API token**: In Cloudflare account-owned API Tokens, create **Fishing P3 Access Read Verification** with account-level only `Access: Apps and Policies Read` and `Access: Service Tokens Read` for the exact existing Cloudflare account. No Workers edit/admin permissions, no D1 write permissions, no Access policy write. Save it only to sandbox repository Actions secret `P3_ACCESS_READ_TOKEN`. Reuse existing account ID secret `P3_D1_CLOUDFLARE_ACCOUNT_ID`; don't create or share a new account ID.
5. **Stop at this boundary**. Do not enable/create a public Worker route yet, run `wrangler deploy`, or allow traffic. Have the assistant inspect a **manual, read-only** GitHub preflight and its sanitized logs first.

## Guarded read-only preflight

The private sandbox [PR #11](https://github.com/ginosega/fishing-p3-sandbox/pull/11) passed exact-head CI and squash-merged to `main` at `6edd0739fec7edb929ed3498b5086d9c0891923c`. New owner-manual [`Fishing P3 Access service-only read-only verification`](https://github.com/ginosega/fishing-p3-sandbox/actions/workflows/fishing-p3-access-readonly.yml) invokes `scripts/p3_access_guard.py metadata`. Its only Cloudflare requests are `GET` to enumerate account-scoped Access applications, Access service tokens, and the matched app's policies. It binds exact app/token names and hostname, ensures one specific token-only Service Auth policy, validates the application audience (AUD) exists, refuses broad/public/extra paths, token expiry, and disabled credential. It returns only `PASS`/redacted STOP results, never Client IDs, secret values, account IDs, app IDs, or the raw provider response. No automated trigger or mutation exists.

The workflow validates **policy metadata**, not Edge routing behavior. A later, separately reviewed test must confirm unauthenticated traffic is actually denied and that correct service-token authentication works before any ingress route is exposed for use. This is not a proof of the actual Access JWT end-to-end yet. If the metadata preflight fails, diagnose and rectify policy configuration *without creating any new ingress Worker endpoint*.

## Live Cloudflare Access metadata preflight — PASS, October 24, 2026 (PDT)

The owner created the Cloudflare Access application and service token, stored the restricted Account API token in the private GitHub Actions repository, and manually dispatched the read-only workflow. Independently checked [private GitHub Actions run #40162761115](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40162761115), job #121077580265, on sandbox main `6edd0739fec7edb929ed3498b5086d9c0891923c` — `workflow_dispatch`, `metadata` mode, **completed/success**.

The actual logs show all **9** new fail-closed policy tests passed, followed by:
- `PASS: Access application exact sandbox ingress hostname, no overrides or other origins`
- `PASS: One unexpired, enabled dedicated service token and one exclusive Service Auth policy`
- `PASS: Source-bound Access AUD present; no broad allow/bypass/other service tokens`
- `PASS: Read-only metadata inspection. No route, Worker, policy, token or D1 modified.`

These outputs verify **Cloudflare Access control-plane metadata** only. They do not verify enforcement of unauthenticated requests to a live hostname; no ingress Worker was created or made public by this run. Do not enable the real command service, D1 write flags, or publish flow. Next controlled step is to create a separate, inert **Hello World** ingress Worker named `fishing-p3-access-ingress-sandbox` under the already protected exact hostname, then disable its `workers.dev` and Preview/Version URLs, with **no D1, service binding, secret, route or custom domain**, and verify those settings before any edge-route testing. For the eventual edge proof, use a static 503 response and require demonstration of Access enforcement before attaching any privileged binding. A Worker with all public URLs disabled cannot prove live Access edge enforcement; that requires a separately gated temporary protected route only after inert code and Access metadata are verified.

## Next boundary after metadata proof

After successful read-only policy verification, establish an isolated **Hello World** ingress Worker with all public/preview URLs initially disabled, and only later permit its single `workers.dev` hostname under verified Cloudflare Access protection. Do not deploy `p3-access-ingress.mjs` until a separate guarded deployment/edge protection review; it remains source-only in production repo draft PR #263. Owner must approve the exact ingress route and traffic test before making the hostname live. The original disabled command Worker remains isolated and never receives messages through this provisional route.

The P3-26 cryptographic Access validator is source-tested, but its pinned JWKS fetch adapter, Access app AUD/team issuer, key rotation, JWT `common_name` enforcement, Worker-to-Worker service binding, and the HMAC logical-request-host mismatch must all be verified before any first real `Accepted` request. Keep command acceptance/publishing disabled until explicitly approved.

**Boundary accounting:** No Access resources were created by GitHub source work. ChatGPT's available GitHub connector can commit vetted code, read private workflow logs and inspect sanitized results, but cannot directly operate Cloudflare dashboard/API or initiate GitHub Actions manual workflows. New Cloudflare Access objects require the owner's dashboard action and secret creation. No Cloudflare Access write API credential is requested from the owner.
