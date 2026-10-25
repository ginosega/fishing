# FISH118 P3-34 — Verify-only signatures with atomic isolated acceptance

**Checkpoint:** October 24, 2026 PDT / October 25 UTC. **Disposition: SOURCE-ONLY INTEGRATION PASS. NO PROVIDER, DATABASE OR PUBLISHING ACTIVATION.**

## Canonical boundary

- Restored public `ginosega/fishing` main `587b978118df64cc9ec584375c458fa2b10fecfa` and private `ginosega/fishing-p3-sandbox` main `bf9bf2f4b4c0e1dc347cdd2bab58b28f1dc69d05` before work. Draft PR #263 is the only modified branch; draft AUTH PR #262 and unrelated PR #268 untouched.
- Actual production v2 deployment remains workflow #672, source `4a1a8c44317b56a4d47e818db9cd2b5587a966d8`, release `504d615b2bef361da06d655ee621d43a`. P3-29 Cloudflare command bridge and Access ingress remain disabled static-503 sentinels, no external URLs or access to production data.
- No GitHub Actions workflow file was installed in the private sandbox, no GitHub/Cloudflare credentials were provisioned or changed, no remote D1 migration was applied or repeated, and no live operation was accepted or published.

## New source-only implementation

1. `src/p3-operator-approval.mjs` now exports **`createP3OperatorApprovalVerifier`** with `verify()`: actual ECDSA P-256 WebCrypto signature verification over `p3-operator-approval-v1\n<canonical envelope>`; checks the raw command body SHA-256, 5-minute maximum validity, exact sandbox repository and owner, signed workflow run ID/attempt/SHA, idempotency key and immutable approval ID. It requires an injected verified GitHub Actions OIDC and authenticated App installation provenance source; no default provider access. It returns a frozen narrow verified approval envelope with its signed-envelope digest, and does **not** touch a replay ledger, D1, GitHub or external network except through the independently supplied provenance verifier. The historic `createP3OperatorApproval().authorize()` consume-first interface is retained solely for backward-compatible isolated P3-31 tests; **do not compose it with P3-33's atomic service**.
2. `src/p3-internal-command-gate.mjs` now also exports **`verifyP3InternalCommandSignature`**, a verify-only HMAC-SHA256 check using the existing P3-20 signing domain, exact fixed internal POST path/method, nonce, millisecond timestamp, body hash and 60-second validity window. It has no nonce-store or other write side effect. Existing separate consume-first `createP3InternalCommandGate` is historical and is **not** wired to the atomic receiver. Future actual ingress must independently validate the HTTP route, Access service identity and request boundaries; verifying an HMAC does not prove a GitHub user identity.
3. New `src/p3-atomic-signature-verifier.mjs` composes the verify-only HMAC and owner ECDSA stages, binding both to the same exact command body and idempotency key, while the injected trusted provenance verifier independently verifies GitHub-signed RSA OIDC claims and authenticated GitHub App installation GET responses. No default network, database, replay consumption, workflow, installation token minting or publishing method is reachable. Rejects malformed or additional unreviewed authorization fields.
4. The P3-33 `src/p3-atomic-acceptance-proof.mjs` remains unmodified: it accepts the verify-only result and performs ONE local SQLite/D1-shaped atomic `DB.batch` for accepted operation, canonical snapshot, exact signed owner approval, and HMAC nonce; the existing SQL trigger adds the Accepted audit inside the same transaction. Duplicate approval, nonce, or idempotency rolls back everything. Neither a lost acknowledgment nor a missing record authorizes an automatic retry.

## Test evidence

New `test/p3-atomic-cryptographic-integration.test.mjs`, eight isolated cases P3-C01–C08, exercises:
- **Actual locally signed RSA-2048 OIDC JWT**, strict issuer/audience/immutable owner and sandbox IDs, workflow identity, GitHub JWT App signing with mock **GET-only** App-installation responses.
- **Actual locally signed ECDSA P-256 owner approval** and HMAC-SHA256 over the same request bytes and protected timestamp/nonce.
- Verification-only stages yield zero D1 writes before authorization, and a verified command performs exactly one atomic operation/snapshot/approval/nonce/audit transaction.
- HMAC forgery, body changes, timestamp and nonce tampering; forged ECDSA or changed owner approval, wrong signed OIDC actor/repo/workflow; all rejected before touching D1.
- Signed replay rejected by the atomic database uniqueness constraints; disabled source path denies work before requesting JWT keys, App metadata or D1; independently exported verify-only HMAC and ECDSA helpers have no ledger consumption.

**Exact implementation/test commit:** `beab3250dab0cc3af08246dd21f1f5930229ed20`. [P3 isolated source CI run #40169992063](https://github.com/ginosega/fishing/actions/runs/40169992063) **completed/success**: 80 PWA + 43 standalone broker + 256 isolated P3 = **379/379 passed** (zero failures); all CI workflow steps including bundle-source validation passed. The following documentation-only checkpoint must pass its own exact-head source CI.

## Remaining blockers and next security gate

**Source cryptography proof is NOT runtime authorization proof.** No live signed GitHub OIDC assertion was received by this code; the real key-fetch/network behavior, actual private installation metadata/permission matrix and real Cloudflare Access service identity are not demonstrated here. Keys were locally generated and never provisioned. The GitHub OIDC JWKS and App responses were simulated, and database transactions ran against isolated Node SQLite fixtures rather than remotely provisioned D1.

The atomic module still accepts an injected verification callback; **future runtime wiring must pin the audited verifier implementation** and must not accept caller-supplied `verified:true` objects. Security-gate follow-up should review exact input transport and trust boundaries among the GitHub runner, Cloudflare Access ingress, service binding, and private Worker. Validate real Access assertion issuer, AUD and service Client ID without exposing tokens. The existing legacy consume-first code paths must never be used alongside atomic acceptance or enabled accidentally. Confirm the isolated database identity and plan any new atomic-approval ledger schema as a separately authorized migration AFTER existing R1–R4, without rerunning those migrations.

An owner-controlled operator signing key and operator approval UX still require independent setup/review; no owner signature can be automatically minted by the runner. A dedicated manual-only workflow must remain only a template outside executable `.github/workflows` until explicitly approved. No service-bound handler, live D1 Accepted operation, test PR publication, automatic merge, or production v3 cutover is authorized by this source success.

**Recommendation:** review the proposed runtime composition and explicit per-provider activation gates, then request a separately approved **read-only** OIDC/Access/App preflight before attempting any Worker binding or D1 schema change. Leave the P3-29 disabled sentinels untouched.
