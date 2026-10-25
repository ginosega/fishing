# FISH118 P3-30 — Source-only Access ingress security and activation-prerequisite review

**Review date:** October 24, 2026 PDT / October 25 UTC. **Disposition: DESIGN REVIEW ONLY — no authorization to deploy, enable, write D1, create publishing PRs, or merge.** This is a review of current unmerged P3 source, not an execution/verification record for any future runtime.

## Follow-on P3-30 source hardening — completed October 24 PDT / October 25 UTC

**SOURCE ONLY; NO WORKER DEPLOYMENT OR CONFIGURATION CHANGE.** Following the owner's express authorization to proceed with this review's next source-only step, draft PR #263 received:
- `src/p3-bounded-response.mjs`: reusable strict-UTF-8, maximum-byte streaming receipt reader; rejects missing/lying/oversized Content-Length, chunk overrun and invalid UTF-8 without loading an unbounded provider body.
- `src/p3-access-jwks-requester.mjs`: explicitly injected and non-networked-by-default requester enforcing exact issuer-owned `/cdn-cgi/access/certs` URL; manual redirects/no-store; status, MIME, size and JSON checks; 2-second abort signal; 5-minute max positive cache; five-second forced-refresh cooldown; concurrent-request singleflight; expired/outage failure closed. `fetchImpl` must remain trusted and injected from a separately approved Worker runtime adapter; source does not expose a route.
- `src/p3-access-jwt-verifier.mjs`: on an unknown `kid`, retries its configured pinned JWKS requester at most once with `forceRefresh`. Existing issuer, audience, signed service `common_name`, time, RS256 and crypto-signature checks remain unchanged.
- `src/p3-access-ingress.mjs` and `src/p3-trusted-command-client.mjs`: use the bounded reader before parsing an upstream 202 receipt (1 KiB and 4 KiB respectively). An overrun fails closed; no accepted outcome is falsely reported.
- New `test/p3-access-jwks-requester.test.mjs` (P3-J01–J08), `test/p3-bounded-response.test.mjs` (P3-B01–B05); augmented ingress (P3-I09) and trusted-client (P3-T09) tests cover real locally signed RS256 rotation, unknown-kid refresh, cache expiry, redirect/host policy, forged Content-Length, chunk overflow, concurrent fetch singleflight and confidential denial.

**Exact tested source commit:** `9574014dad2a2c5f62b399766722b4434be689ac`. [P3 isolated source CI run #40167785899](https://github.com/ginosega/fishing/actions/runs/40167785899) **completed/success**: 80 PWA + 43 broker + 219 isolated P3 = **342/342 tests passed**, including new cases, with all five workflow validation steps successful. This is Node source/fixture CI only; no real Cloudflare Access JWT, JWKS network call, live service binding or remote D1 write was performed. The subsequent documentation-only closeout commit will have its own exact-head CI evidence.

**Still unresolved, requiring a separate later review:** live trusted GitHub runner/App/owner provenance, operator approval design, runtime ingress bootstrap and Cloudflare Free 10 ms CPU budget, live Access issuer/AUD/service Client ID verification, private service-binding compatibility, real network outage behavior, authenticated D1 status reconciliation and all deployment/enable/write/publish gates. Rotation tests and mocked fetch injection do NOT satisfy these real-provider proof gates.

Cloudflare's published Access docs show rolling JWT signing keys under the configured team `/cdn-cgi/access/certs` endpoint and a previous-key overlap window; the implementation uses key ID selection plus bounded refresh. Reference: https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/ . The Workers runtime supports outbound request abort signals during a handler: https://developers.cloudflare.com/workers/runtime-apis/request/ . No secret values are recorded.

## Restored authority and fixed scope

- Public ginosega/fishing main at review: 587b978118df64cc9ec584375c458fa2b10fecfa (five-file docs-only P3-29 transfer, no PWA deployment); review input is draft PR #263 head dfea112022d82d3d21328d900383e7c85f518c53. P1 draft PR #262 and unrelated #268 remain outside scope.
- Private ginosega/fishing-p3-sandbox main: bf9bf2f4b4c0e1dc347cdd2bab58b28f1dc69d05. GitHub owner ID 265665562, private sandbox repository ID 1430581407, subject to trusted runtime revalidation. No current App publisher permission or GitHub write action is inferred.
- Production remains Full Application workflow #672, run 39990546320, hosted source 4a1a8c44317b56a4d47e818db9cd2b5587a966d8; release 504d615b2bef361da06d655ee621d43a, 577 files, 100 Gear, 60 KB, 12 Catches, based on canonical hosted evidence. Later main commits are documentation only.
- P3-29 is CLOSED: deployment run 40165892787 and independent postflight 40166553523 passed. Ingress is a nonpublic static 503 sentinel with exactly three literal false flags, no D1, service, HMAC or route bindings and both Production/Preview URLs OFF. The original command bridge is separately hard-disabled and unrouted, with D1/HMAC attached but both flags false. The old preflight zero-bindings check is NOT suitable for the already-deployed ingress. Do not redeploy or run migrations R1–R4.
- Source validation on reviewed draft head: P3 isolated CI run 40167025577 completed successfully. This is source CI, not a real Access/JWKS/service-binding/D1 proof.

## Reviewed source boundary

P3-25 signer: experiments/p3/preview/src/p3-trusted-command-client.mjs.
P3-26 Access JWT verifier: experiments/p3/preview/src/p3-access-jwt-verifier.mjs.
P3-26 ingress: experiments/p3/preview/src/p3-access-ingress.mjs.
P3-20 internal HMAC gate: experiments/p3/preview/src/p3-internal-command-gate.mjs.
P3-23 native D1 acceptance composition: experiments/p3/preview/src/p3-native-acceptance-service.mjs.
Disabled deployed sentinels: experiments/p3/preview/src/p3-disabled-ingress-worker.mjs and src/p3-disabled-bridge-worker.mjs.

Proposed topology: trusted private GitHub Actions runner -> Access Service Auth-protected HTTPS ingress -> locally verified Access JWT -> exact inbound POST and bounded HMAC body -> same-account Cloudflare Worker service binding P3_COMMAND_SERVICE -> separately enabled internal-only command service -> isolated native D1. The only current code invoking the latter is a simulated binding in source tests. A GitHub runner cannot directly call an in-process Cloudflare service binding. The service-bound logical URL in the current source contains the legacy preview hostname purely to preserve the fixed signed method/path. It is NEVER a permitted external fetch destination.

## 1. Access identity: feasible, with actual runtime evidence still outstanding

Cloudflare's service-token Access application JWT example has type=app, iss=https://<team>.cloudflareaccess.com, aud containing the application AUD, sub as an empty string, and common_name equal to the service token Client ID. This matches the intended verifier constraints. The signed common_name is NOT a GitHub username or numeric GitHub owner identity.

Official source: https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/application-token/

The verifier source explicitly enforces RS256, issuer, audience, app type, time bounds, empty sub and exact service Client ID, then checks signature against the kid-matching RSA key. It has hard token/JWKS size bounds and no default network client. This is an appropriate fail-closed source-only foundation. Never trust bare Cf-Access-Jwt-Assertion, bare service-token headers or a decoded unsigned JWT.

**Evidence gap:** Read-only P3-27/28/29 evidence establishes the dedicated Access app, exact protected hostname, sole Service Auth policy, dedicated token, and an earlier benign authenticated edge test. It does NOT independently demonstrate the actual future command handler receiving a JWT with the configured issuer, app AUD and service common_name; no JWT claims or secrets should be pasted into logs, GitHub or chat. Before activation, validate these exact nonsecret values via separately authorized read-only Access metadata and a privacy-preserving claim shape/provenance proof. A synthetic fixture must not be passed off as live evidence.

October 2026 Cloudflare strict service-token authentication now treats service-token requests as service-only, denies failures with 401/403, and does not issue an authorization cookie. Existing organizations may have to opt in; do not assume organization-wide strict mode was enabled. Check the setting read-only before proposing any change. Regardless of this setting, the established single Service Auth policy must stay exclusive. Source: https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/

## 2. Key material, remote JWKS and rotation: NOT IMPLEMENTED FOR RUNTIME

Cloudflare documents the issuer-pinned /cdn-cgi/access/certs endpoint, current and previous keys, rotation roughly every six weeks and a seven-day previous-key overlap. Select a key by signed header kid, do not pin a single current PEM or trust a client-specified URL. Source: https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/

The current createP3AccessJwtVerifier() requires an injected requestJwks(url) and deliberately does not perform fetch; this prevents accidental egress but leaves the real runtime adapter, caching and network failure handling unproven.

Required design before deployment: permit ONLY the configured HTTPS issuer plus exact suffix /cdn-cgi/access/certs; no redirects; bounded response and reasonable short timeout; positive-cache for a short bounded TTL (proposed 5 minutes); refresh on unknown kid at most once with bounded work; never accept unknown/expired keys or arbitrarily stale data; fail closed when a needed key cannot be obtained; no untrusted URL from JWT claims; no secret/claim logging. Test rotation with both keys, forced unknown-kid refresh, same-kid replacement/revocation behavior, redirect denial, bad content and outage. Confirm Free-tier 10 ms CPU and subrequest limits with an actual guarded test, not just Node source tests. Workers Free documented limit is 10 ms CPU per invocation and 50 external subrequests per request. Source: https://developers.cloudflare.com/workers/platform/limits/

## 3. Transport, HMAC and provenance: NOT IMPLEMENTED END-TO-END

The ingress is source-only, accepts exact HTTPS origin and POST /p3/internal/accept, requires a verified Access service identity, strips Access/service-token/other arbitrary headers, and forwards only bounded JSON body and three validated X-P3 proof headers through the injected P3_COMMAND_SERVICE.fetch. The internal gate independently checks signed POST path /_p3/internal/command, 60-second timestamp, nonce, HMAC-SHA256 and scope before an atomic D1 nonce insert and Accepted+snapshot batch. The body and HMAC proof must remain byte-for-byte unchanged through both Workers.

Outstanding: construct and test a real same-account service binding using the exact target Worker name, with no public route on the target, and make the logical-URL distinction explicit in source/runbooks so nobody substitutes global fetch. Consider a future protocol v2 with a neutral internal logical host to remove the otherwise misleading legacy public preview hostname, but never silently change the v1 HMAC canonical string.

Access service identity authenticates a CI client capability only. A second trusted boundary must confirm the runner originates from the trusted private sandbox workflow on an exact approved branch/commit, and must verify sandbox repository ID, numeric GitHub owner identity, current GitHub App installation repository scope, and least-privilege permissions using authenticated provider data. Do not treat arbitrary repository event payload, user-submitted PR code, actor text, a static numeric fixture or the Access common_name as adequate GitHub owner authorization. Protect credentials from pull_request-controlled scripts, logs and artifacts. Require a separately reviewable operator approval predicate bound to a specific intended operation; an unconditional true callback after enabling flags is not an approval system.

HMAC secret needs a distinct trusted runner secret and command Worker secret under separately approved provisioning, never in browser/source. Define rotation with overlapping explicit versions or controlled pause and rollback, without automatic attempts to publish. Current production/sandbox secret values need not be re-shared.

## 4. Code hardening identified by this review

- p3-access-ingress.mjs calls upstream.text() before enforcing a 1 KiB response limit. A malicious or malfunctioning downstream could force excessive buffering before denial. Use bounded stream reads and reject early, including misleading Content-Length.
- p3-trusted-command-client.mjs similarly calls response.text() before enforcing its 4 KiB receipt bound. Use the same bounded reader and denial cases.
- A live JWKS fetch/cache/timeout adapter, a live verified ingress bootstrap, and live operator approval/transport implementations do not exist in current draft source. Local injected mocks cannot prove these.
- Ensure a response-disconnect/timeout after D1 Accepted is recorded as an UNKNOWN outcome, not a failed acceptance; do not repeat a command merely because its reply was lost.

These are source-hardening design findings, not evidence of exploited vulnerabilities or of a remotely reachable handler: both deployed Workers still deny all requests.

## 5. D1 and operation recovery: separate, gated phase

R1–R4 already completed, 7 tables/4 indexes/5 triggers, last confirmed empty application tables. Never repeat or restore migrations merely for this review. D1 nonce insertion and the atomic Accepted+snapshot batch are two separate transactions; partial acceptance is possible across that boundary. Each attempted command uses a fresh signed nonce and a stable idempotency key. On timeout or 503, a trusted read-only, exact owner/repository-scoped status lookup must establish the durable state before deciding whether a new nonce with the same idempotency key is safe. There is currently no approved or deployed live status endpoint in the P3-25 trusted client. No blind retry, automatic replay, or GitHub write after an uncertain operation.

Accepted means durably recorded for future validation; it does NOT mean canonical validation succeeded, checks passed, a GitHub PR was created or anything was published.

## 6. Cloudflare / GitHub least privilege and fail-closed rollout

- Keep the original public preview and public production unchanged. Keep the ingress and command Worker separate. Under Cloudflare service binding, caller and callee are separate deployed Workers; a binding gives a caller explicit private access to the named target. Source: https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/
- Ingress should have no direct D1, GitHub App token, publishing permission or HMAC signing secret. Command Worker should own only isolated D1/HMAC and expose no public route. GitHub runner should have only sandbox repo read/check scope until a separate publisher approval; adding sandbox Contents-write/Pull-requests-write is a later independent stage.
- Do not change the existing static-503 ingress merely to run a read-only proof. An actual dynamic JWT ingress deployment and a binding, even with write flags off, require fresh explicit owner approval. Cloudflare Access and routing configuration must be read/verified first; never rely solely on an application policy without signed JWT validation.
- Any worker-code or binding change may partially succeed despite a failed CLI step. Pin exact source commit/blob and target, no automatic retries, reconcile independent remote settings after each explicit deployment. Roll back by restoring static-503 code and disabling URLs/flags on separate approval; do not represent D1 Time Travel restore as a standard rollback.
- Existing private postflight workflow is metadata-only and purposely forbids new bindings. It will need a separately designed future guard for a new approved configuration; do not weaken or reuse the current disabled-only guard.

## 7. Recommended gated sequence

**P3-30 (this review, permitted):** document threat model and dependencies; optionally prepare isolated source-only bounded receipt readers, injected fixed-domain JWKS adapter and adversarial tests on draft PR #263. No new runtime configuration or provisioned credentials.

**Future source gate, requiring reviewed source/test evidence:** implement a strictly pinned JWKS requester with rotation/cache tests, trusted operator provenance, safe receipt reader, and a private status/ambiguous-outcome protocol in a draft-only branch. Ensure a full P3 CI pass on exact head.

**Future read-only infrastructure gate, fresh owner approval required:** read-only confirmation of existing Access app AUD/issuer/service-token scope and strict-service-token setting, future exact Worker/service-binding permissions, GitHub App installation/owner checks, and disabled deployment plan. Keep all real Workers static 503 and unrouted until separately scoped deployment approval.

**Future deployment gate, fresh owner approval required:** approve each immutable artifact, exact target, bindings/routes, provider permissions and postflight; do not activate write flags. Independently test a harmless Access-protected endpoint only under that approval.

**Future state mutation gate, fresh owner approval required:** first remotely accepted isolated D1 operation with explicit idempotency/replay/recovery evidence. Later sandbox GitHub PR write, merge, publishing and production cutover each need their own independent authorization. Never combine these into one Proceed.

## Decision

Architecture is **conditionally viable but NOT activation-ready**. The Cloudflare Access JWT claim shape and private service bindings are documented and source assumptions are substantially aligned, but real bound identity, runtime JWKS behavior, privileged GitHub provenance, bounded receipts, recovery and active service-binding transport remain unproved. P3-29 remains CLOSED. P3-30 does not authorize any new provider change, deploy, DB write, PR publish or production change.
