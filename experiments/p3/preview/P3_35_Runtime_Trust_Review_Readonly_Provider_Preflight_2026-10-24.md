# FISH118 P3-35 — Runtime trust-boundary review and read-only provider preflight plan

**October 24 PDT / October 25 UTC 2026. SOURCE-ONLY SECURITY REVIEW.**

**Disposition: NOT READY FOR LIVE COMMAND INGRESS OR PUBLISHING.** Review-only changes on draft PR #263. No new executable workflow, Cloudflare deployment, route, token, service binding, D1 schema/write, App installation, sandbox publish or production modification is authorized. The two hard-disabled P3-29 Worker sentinels must remain closed.

## Actual repository and provider evidence retrieved for this review

| Boundary | Verified evidence | Limitation |
| --- | --- | --- |
| Production repository | GitHub connector GET `ginosega/fishing` main **`587b978118df64cc9ec584375c458fa2b10fecfa`** | Documentation-only main; no new v3 production deployment |
| Source review branch | GitHub connector GET PR #263 head at review start **`096b33e892d1b7286af7fecc87c138576c1a67c2`**, **draft** | This public branch is **not** a runtime trust anchor |
| Private sandbox | GitHub connector GET repository ID **1430581407**, name `ginosega/fishing-p3-sandbox`, `private: true`, default `main`, head **`bf9bf2f4b4c0e1dc347cdd2bab58b28f1dc69d05`** | Repo identity and owner ID are not by themselves proof of an individual Actions run or App installation |
| Existing private preflight | Read `main:.github/workflows/fishing-p3-disabled-ingress.yml` at blob `75df0a75ff85499bd5a27ba42874b7f218d29747`; current workflow has ONLY manual `preflight` or `postflight`, `contents: read`, and NO deploy command | Its `preflight` expects **zero** ingress bindings from before the hard-disabled deployment; do **not** invoke it now. Only `postflight` is consistent with existing disabled flags |
| Historical Access / ingress metadata proof | Re-read private GitHub Actions run [#40166553523](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40166553523): `workflow_dispatch`, **completed/success**, exact private `main` SHA `bf9bf2f4b4c0e1dc347cdd2bab58b28f1dc69d05`, same read-only postflight workflow. The P3-29 checkpoint records its provider read-only checks and static-503 disabled lockout | Historic verification; does **not** prove current live Worker byte hash, signed Access JWT claims, new command-binding health, or that anything is enabled. This review did **not** rerun the private workflow |
| Public GitHub OIDC discovery | Retrieved official `https://token.actions.githubusercontent.com/.well-known/openid-configuration` directly; its `issuer` is `https://token.actions.githubusercontent.com` and `jwks_uri` is `https://token.actions.githubusercontent.com/.well-known/jwks`. Retrieved the public RSA JWKS endpoint. | **Only public issuer metadata and current public verification keys**; no GitHub OIDC JWT was requested or verified from our sandbox. Do not pin current ephemeral `kid` or publish raw JWKS in repository |
| GitHub App / Access signing identity | Reviewed official read-only App installation GET endpoints, Access JWT validation docs and current P3 source; no App private key, Access token or live JWT used | Real App installation permissions and actual Access issuer/AUD/signed service `common_name` are **NOT independently verified at this stage** |

Other open PRs #262 (AUTH draft) and #268 (unrelated) unchanged. No private repo commits. Production latest hosted v2 source remains `4a1a8c44317b56a4d47e818db9cd2b5587a966d8`, [workflow #672](https://github.com/ginosega/fishing/actions/runs/39990546320); previous hosted-identity evidence remains canonical.

## Runtime architecture review: separate identities, separate authorities

Proposed future request path:

1. **Manual GitHub Actions runner** in the *private sandbox* obtains a fresh signed GitHub OIDC token with a narrowly scoped expected audience. It is not an owner approval by itself. Every action path must stay manual-only, pinned and vetted; the owner identity is a numeric allowlist. The uninstalled P3-32 workflow template remains outside `.github/workflows`.
2. **Human owner** authorizes one exact command by independent ECDSA signature. The private signing key must remain **outside GitHub Actions, both Workers, the PWA and repository code**. The signature binds the complete command bytes, idempotency key, owner/repository, workflow SHA and run attempt, with a brief expiry. The runner cannot self-sign approval.
3. **Cloudflare Access** authenticates a separate, narrowly scoped service-token client at the *HTTPS ingress*. A valid Access Service Auth assertion proves only the permitted service client, **not** the human or GitHub Actions identity. Ingress validates the signed JWT against its pinned team issuer/AUD/service Client ID and exact service-authorization policy, and performs strict route, content-type, size, timeout and header checks.
4. **Private same-account Cloudflare Service Binding** forwards only an allowlisted, bounded internal protocol to the **separately disabled command Worker**. Cloudflare confirms a Service Binding can address a Worker without publishing that Worker at any public URL. Do not forward the Access assertion, Access service secret or arbitrary client headers to the command Worker.
5. **Command Worker** independently checks GitHub-signed OIDC JWT and authenticates the exact GitHub App installation through **App-JWT-authenticated GET only**, independently verifies owner ECDSA and command HMAC, checks complete scope, and only after that performs ONE atomic D1 batch: operation + canonical snapshot + unique approval ledger + unique HMAC nonce; existing trigger inserts `accepted` event. A 202 receipt indicates **Accepted only**, never Published or Live.
6. **Recovery/status** is separately authenticated read-only. A lost acknowledgment means **unknown**, not permission to retry; the immutable approval digest links to the existing operation if committed. No remote D1 write or provider action is approved by a metadata preflight.

**BLOCKING P3-35 FINDING — signed provenance does not cross today's source transport.** `src/p3-access-ingress.mjs` currently extracts only `X-P3-Timestamp`, `X-P3-Nonce`, `X-P3-Signature` and exact bounded command-body bytes before constructing its private service-binding Request. It intentionally strips **all other headers**. `src/p3-trusted-command-client.mjs` similarly sends only the original command JSON and those HMAC headers. Therefore, the GitHub OIDC assertion, owner-signed canonical approval envelope and detached ECDSA signature required by the P3-34 atomic verifier are **not delivered to the command Worker**. No combination of Access `common_name` and HMAC fixes this, since neither proves human approval. The P3-34 cryptographic integration was fully **injected locally** and does not solve this real ingress/transport gap.

**Required separate source design before any ingress activation:** define a bounded protocol that transports the exact command bytes, GitHub OIDC JWT, immutable owner approval and ECDSA signature across the Access ingress and Service Binding, while keeping the HMAC bound to the exact *inner command* and nonce/timestamp. The ingress must not accept arbitrary headers or log proof contents, and the private receiver must not trust an unverified caller-supplied `verified:true` assertion. Reassess total size limits: 8 KiB command plus up to 10 KiB OIDC plus signature/envelope cannot fit the existing 8192-byte outer Request limit. Review strict parsing, canonical bytes, duplicate JSON keys, replay, origin, credential stripping and distinct error paths. Do NOT enlarge limits or rewire live Workers under this review approval.

**Additional review:** `src/p3-runner-provenance.mjs` signs a GitHub App JWT *inside its injected verifier*. This attests private **server App configuration**, not the runner's personal identity; the latter comes only from the signed OIDC token and independent owner ECDSA. The App signing key must never reside in the public ingress or the PWA. GitHub API authentication response and permission matrix must be read through the exact allowed GET endpoints, and any unexpected permissions fail closed. Signing plus two GitHub API GET operations and multiple public-key verifications add runtime CPU/network expense; Cloudflare Free capacity and outage behavior are **not yet measured**.

## Proposed narrow read-only preflight: sequence and evidence gates

**G35-A — Already safe baseline (completed here):**
- GET sandbox repository metadata and current `main` commit. Confirm exact private identity, numerical IDs and workflow source from the **actual** private `main`; no public-branch copy counts as a private workflow.
- Read and record existing P3-29 read-only postflight **historical** pass; do not claim it constitutes fresh live verification.
- Query **public, unauthenticated** GitHub OIDC discovery and JWKS metadata only. Store issuer/JWKS URL, **never** a current signing key, token, JWT body, or untrusted `kid`. All public network lookup must remain separate from the pending sandbox-run assertion.

**G35-B — Future owner-approved GitHub OIDC claim proof (NOT executed):**
- Review and obtain separate explicit owner permission **before** installing even a non-publishing workflow into private `.github/workflows`. Use `workflow_dispatch` only, strict ref/actor/repo ID check, job-scoped `contents: read` and `id-token: write`, pinned code and reviewed workflow `workflow_sha`; no PR source, workflow_call or self-hosted runner. Exact immutable OIDC subject is expected for repositories created after July 15, 2026; verify the *actual* signed token because custom subject settings or workflow identity can change claims.
- Request one GitHub OIDC assertion with the explicitly reviewed `aud`. Verify its actual RSA signature using pinned issuer-provided JWKS and the P3-31 claim verifier. Output only redacted `pass/fail`, repo/owner IDs, run ID/attempt, workflow SHA and a field-presence summary, **not** token, raw JWT claim set, authorization headers or cryptographic private key. Signature verification must happen inside a safe owner-approved environment and no token may be pasted to Chat or GitHub issues.
- This does **not** require App installation tokens, an accepted operation, Access opening, Worker deployment, or D1 modifications.

**G35-C — Future App GET-only proof (NOT executed):**
- A separately permissioned trusted environment may sign a short-lived GitHub App JWT using an owner-controlled App private key and issue precisely two `GET` requests: `/app/installations/{expected-id}`, `/repos/ginosega/fishing-p3-sandbox/installation`. Validate app ID, installation ID, numeric owner account, exact repository selection, unsuspended status, and the exact *owner-reviewed actual* permission matrix. Review real `contents/pull_requests/checks/metadata` grants **as observed**, not test fixture examples. Do not issue `POST /access_tokens`, merge, create PR, refresh/revoke secret or modify an App.
- The current GitHub **connector's** credentials are not the application's own JWT and cannot substitute for this App identity proof. An unavailable authenticated endpoint is **UNPROVEN**, not a successful or negative grant check.
- Redacted output contains only booleans/immutable IDs and vetted permission names/levels, never JWT, key material or HTTP credential headers.

**G35-D — Future Access-only metadata and JWT proof (NOT executed):**
- With separately approved **read-only Cloudflare Access credentials**, read the exact existing Access app, AUD, team issuer, hostname, sole Service Auth policy, dedicated token *metadata* and the closed ingress Worker settings. Reuse owner-run `postflight` only; `preflight` is intentionally wrong for the already-deployed disabled worker. Require Production and Preview URLs OFF, exactly three literal disabled vars, **no service/D1/secret/route binding** on ingress; command Worker also stays disabled.
- Public Cloudflare Access signing certificate endpoint is pinned to the exact privately confirmed team domain `https://<team>.cloudflareaccess.com/cdn-cgi/access/certs`; inspect **public signing keys only** with bounded GET and no redirects. Do not guess or publish the team URL or AUD until owner review.
- Proving an **actual signed** `Cf-Access-Jwt-Assertion` in a future HTTP request will require a separately approved inert, Access-only path/handler or equivalent isolated proof; the current disabled 503 ingress does not provide such a validation handler and its endpoints remain OFF. Do not enable them as a side effect of checking metadata. Verify signed issuer, app AUD, `type: app`, `sub: ''` and exact service client `common_name` privately. Do not log/return the JWT or service-token client secret. Cloudflare's docs recommend verifying the header signature even if Access already protects the Worker.

**G35-E — Not part of ANY read-only gate:** Install trusted workflow, change routing, set or expose Worker/App/owner signing secrets, bind D1/service, apply new atomic-approval migration, create Accepted operations, mint installation tokens, GitHub writes, PRs, auto-merge, hosted publishing or production cutover. Those are distinct owner-approved stages. Never rerun R1–R4; the separate P3-32 consume-first ledger is **not** to be deployed alongside proposed P3-33 atomic ledger.

## Security references, current documentation

- GitHub OIDC official reference and 2026 immutable subjects: https://docs.github.com/en/actions/reference/security/oidc
- GitHub OIDC public discovery (retrieved in this review): https://token.actions.githubusercontent.com/.well-known/openid-configuration
- GitHub App-JWT-authenticated installation GET API: https://docs.github.com/en/rest/apps/apps
- Cloudflare Access JWT signature, issuer/AUD and rotating keys: https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/
- Cloudflare private service binding behavior: https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/

## Outcome and recommended next work

**Source review completed.** We have genuine read-only evidence for sandbox repo, prior disabled ingress postflight and the public OIDC issuer/JWKS URL; **no private runner OIDC JWT, real GitHub App identity response or live Cloudflare Access JWT was acquired**. An enabled provider integration remains blocked by the missing signed-proof transport and by incomplete operator/provider identity gates.

**Recommended next SOURCE-ONLY step**: design and test the bounded **signed-proof transport envelope** with exact inner command bytes and allowlisted fields, without changing any deployed Cloudflare Worker or private sandbox workflow. Once the transport model is coherent, ask for separately scoped permission to install a **strictly manual/read-only GitHub OIDC preflight**, followed by App GET and Access metadata checks. The actual Access JWT test, service binding, D1 migration and publishing stay distinct.

No secrets, raw JWTs, keys, bookmarks or Access audiences stored in this document.
