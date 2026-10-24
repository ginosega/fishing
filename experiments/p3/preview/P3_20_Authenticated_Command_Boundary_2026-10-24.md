# FISH118 P3-20 — Source-only authenticated command boundary

**October 24, 2026 — CODE AND SECURITY TESTS ONLY.** The owner confirmed that the dedicated P3 GitHub App already has Contents **read/write**, Pull requests **read/write**, and Checks **read** permissions, restricted to the private `ginosega/fishing-p3-sandbox` installation. **No further permission change or GitHub App reinstallation is requested.** App permissions are owner-confirmed; this increment does not introspect an unrelated GitHub App's installation privileges.

## Architecture

Trusted Node checkout/validation must remain separate from native Cloudflare D1 atomic writes. Cloudflare's Worker `DB.batch()` promises transaction rollback if a statement fails (official D1 binding docs); sequential direct REST requests must **not** substitute for this.

The P3-19 trusted Node-to-D1 read-only REST smoke passed in private sandbox Actions [#40123656675](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40123656675), with zero modifications. This source-only increment adds `src/p3-internal-command-gate.mjs` with no runtime import/deployment/route binding and no GitHub APIs.

- HMAC-SHA256 sign/verify with WebCrypto over a versioned canonical string binding POST, exact sandbox route, timestamp, nonce and exact request-byte SHA-256; constant-time `subtle.verify`, max 8 KiB streamed body, 60-second freshness window.
- Three independent control gates: `P3_WRITE_ENABLED=true`, `P3_COMMAND_BRIDGE_ENABLED=true`, and a trusted `operatorApproved()` predicate, all default closed. **The deployed P3 Worker currently remains `P3_WRITE_ENABLED=false`.**
- Server-provided owner GitHub ID + exact private sandbox repository ID `1430581407`; rejects browser claims of ownership, dynamic SQL, arbitrary methods/paths, merge, deploy and any command other than `accept` with narrowly validated Gear/KB no-media envelope.
- Dependency `consumeNonce()` is **required to be durable and atomic**, with a unique nonce SHA-256 constraint, and must reject second use even across different Worker instances. A **source-only native-D1 consumer and proposed migration 0004 are now implemented and tested** in P3-21, but migration 0004 has **not** been applied to the remote sandbox, and no Worker route has been connected. Without reviewed, migrated nonce storage and new explicit deployment approval the handler must not be wired to any route.
- Dependency `acceptSnapshot()` must use the existing D1 operation store with native Worker `DB.batch()` for idempotent Accepted+snapshot creation; the existing envelope check is *not* the full source-aware canonical validator, which must still run in trusted Node before draft-PR creation. Callback is deliberately not wired yet.
- Authenticated errors expose only controlled stage codes, not private HMAC keys, Cloudflare tokens or full provider responses.

This is **not** a public-facing privileged Worker endpoint, GitHub App token issuer, scheduled action, deployment configuration, changed secret or enabled publishing route. Future preview Worker integration requires explicit owner authorization, vetted replay-store migration, origin/network threat model, secret provisioning and fail-closed CI.

## Tests and next gates

The tests cover disabled defaults, valid MAC, replay denial, tampering, expiry, strict sandbox origin/path, payload oversize, narrowed schema, fail-closed nonce backend, non-disclosure and absence of merge/deploy/write-token interfaces. CI must pass before merging any design documents or requesting operational changes.

**Next engineering steps:** (1) obtain separate R4 approval and perform guarded remote migration only after review; (2) wire the audited nonce store and hardcoded owner-scoped `acceptSnapshot()` into a **separately approved** isolated Worker service using native D1 binding and `DB.batch()`; (3) trusted Node signature/invocation under reviewed private GitHub Actions/environment approval; and (4) separately approve sandbox Worker deploy and P3 write-enable/synthetic draft-PR proof. No change is requested from owner now.

## P3-21 source-only integration closeout — October 24, 2026

Local source CI [workflow #40124928871](https://github.com/ginosega/fishing/actions/runs/40124928871) passed **291/291 tests: 80 PWA + 43 broker + 168 P3**, including eight HMAC protocol tests, five new native-D1 nonce tests, and a full local signed-command → durable single-use nonce → native D1.batch Accepted+snapshot+audit flow. A missing 0004 ledger correctly fails closed. This is a **source-only test**; no remote migration, Worker deploy, secret change, sandbox GitHub write, P3 publication or production change occurred. See [P3-21](P3_21_Atomic_Nonce_Ledger_Source_2026-10-24.md).

## References

- Cloudflare D1 Worker API: https://developers.cloudflare.com/d1/worker-api/d1-database/
- Cloudflare Workers HMAC Web Crypto: https://developers.cloudflare.com/workers/runtime-apis/web-crypto/
- Cloudflare service bindings: https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/
