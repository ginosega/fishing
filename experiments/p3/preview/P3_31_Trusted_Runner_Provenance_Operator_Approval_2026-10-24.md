# FISH118 P3-31 — Trusted-runner provenance and single-operation approval

**October 24 PDT / October 25 UTC, 2026. SOURCE ONLY; NO RUNTIME APPROVAL.**

This stage builds on the completed P3-30 source review. Work was confined to draft PR #263 in ginosega/fishing. Production main remains 587b978118df64cc9ec584375c458fa2b10fecfa and the private sandbox main remains bf9bf2f4b4c0e1dc347cdd2bab58b28f1dc69d05. P3-29 remains CLOSED: both ingress and command bridge are unrouted, disabled static-503 Workers. No Cloudflare deployment, access-policy change, credentials, real D1 operation, GitHub sandbox publish, production merge, or route activation happened.

## New source-only security modules

**src/p3-runner-provenance.mjs** checks a cryptographically signed GitHub Actions OIDC assertion (RS256) using an injected, fixed-URL JWKS request capability, and then authenticates the separate GitHub App installation using short-lived App JWT and two GET-only metadata endpoints. There is no default fetch, installation token minting, or publish method. The signed OIDC must match the exact private sandbox repository and immutable ID 1430581407, numeric owner ID 265665562, GitHub owner actor, private visibility, main branch/ref type, manual workflow_dispatch event, GitHub-hosted runner, immutable July-2026-style subject, expected audience, exact reviewed workflow_ref and workflow_sha, bounded issue/expiry, run ID and attempt. The source denies unexpected reusable-workflow identity, untrusted JOSE remote-key headers, wrong owner/repo and invalid signatures. App metadata must match configured IDs, owner numeric identity, selected-repository installation, unsuspended status, and an exact owner-reviewed permissions matrix with no unexpected expanded grant; GitHub App response is redacted. Neither token nor credentials are returned.

**src/p3-operator-approval.mjs** verifies an ECDSA P-256 owner approval signed by a key held outside the runner. Only a pinned public JWK belongs in this future verifier. An explicit canonical one-operation envelope grants only the 'accept' action, and binds owner/repository ID, verified Actions run ID and attempt, exact workflow SHA, operation idempotency key, SHA-256 of exact request bytes, a UUID approval ID and a maximum 5-minute validity. Wrong owner/action/run/bytes, forgery and expired approval fail closed. A future persistent atomic consumeApproval ledger must consume each signed envelope exactly once; no real ledger was created in this stage and the source has no in-memory fallback. Test-generated keys are disposable and were not deployed/provisioned.

Neither helper is imported by the active Cloudflare Workers, PWA, preview sentinel, private GitHub Actions workflow or publishing runtime. The existing signer, trusted-runner composition, command bridge and D1 acceptance service remain unchanged. This is an isolated proof design, not an end-to-end owner-approved command transport.

## CI evidence

New tests: test/p3-runner-provenance.test.mjs (P3-R01 through R07) and test/p3-operator-approval.test.mjs (P3-O01 through O07). They exercise real locally generated RSA and ECDSA signatures with mock GitHub API and simulated one-use ledger. Denials cover wrong signed identity, branch, actor, owner, workflow, reused workflow, altered signature, JWKS failure, unauthorized App grants, tampered body/idempotency, replay and absent ledger.

**Exact source commit 58f0b1762c16dab3b5e11dcee6889b229c86ed8f**, successful [isolated source CI #40168349458](https://github.com/ginosega/fishing/actions/runs/40168349458): **356/356 tests passed** (80 PWA, 43 broker, 233 P3 preview), all workflow validation steps green. The subsequent documentation-only commit has its own CI check. These tests are not live verification of GitHub OIDC, App requests, operator key possession, any remote D1 ledger, or Cloudflare network behavior.

## Next separate approval/review gates

1. Review a future **manual-only private trusted-runner workflow** with exact path, signed workflow SHA, owner dispatch checks and GitHub Actions OIDC id-token:write permission (this allows OIDC issuance; it is not Contents-write). No pull_request-controlled source or untrusted reusable workflows.
2. Verify actual GitHub OIDC immutable subject and workflow claims from real read-only evidence, and implement a pinned-domain, size/time-bounded JWKS retrieval adapter with rotation and redirect denial. Do not take a JWKS URL from JWT headers.
3. Privately inspect the real GitHub App grants/installation permission matrix and owner ID. A mismatched matrix must fail, not be ignored. Do not expose keys, tokens or raw assertion content.
4. Design a separately approved human signing UX and external owner-private-key custody, with per-operation payload hash display, explicit expiry, rotation and revocation. The runner must never be able to self-sign its approval.
5. Propose a durable one-use approval ledger and a safe recovery/status protocol for ambiguous timeouts, with separately scoped migration/remote write permission; do not repeat R1-R4 or blindly retry.
6. Under new explicit approval only, integrate the signed proof with a trusted command caller and later run inert read-only Cloudflare tests; dynamic ingress/service binding, D1 Accepted operations, GitHub PR writes, and production cutover each remain separate gates.

## Security references

- GitHub Actions OIDC issuer, signed claims, immutable owner/repository subject and runner metadata: https://docs.github.com/en/actions/reference/security/oidc
- Authenticated App installation metadata and selected-repository access: https://docs.github.com/en/rest/apps/apps
- GitHub App installation scope API: https://docs.github.com/en/rest/apps/installations

**Disposition:** P3-31 source implementation and CI PASS. Runtime provenance, live operator approval, durable replay control, sandbox publishing and production remain unproven and disabled.
