# FISH118 — P3-0 Mock Publisher Implementation Report

**Date:** October 22, 2026  
**Authority:** Owner approved [P3 Trusted Publishing Authorization Proposal](https://github.com/ginosega/fishing/blob/experiment/fish118-auth-p0-cloudflare-feasibility/experiments/auth-p0/FISH118_P3_Trusted_Publishing_Authorization_Proposal_2026-10-22.md) and said to proceed. This report covers **P3-0 source-only/mock-only**, not provisioning or repository write privileges.  
**Branch:** `feature/fish118-p3-mock-publisher` (isolated from AUTH-P0 draft PR #262; based on `main` `35e88c47d96f4d7021afa642fdee9e6616c65e83`).  
**Deployment:** NONE. **Real GitHub API publishing:** NONE. **Canonical content/production:** unchanged.

## Completed implementation

1. [`src/broker.mjs`](src/broker.mjs): injectable trust boundary, identity/session-expiry checks on `submit`, explicit same-origin Fetch Metadata and CSRF checks, exactly one allowlisted repository and Gear/KB domain, bounded media size and SHA-256 verification, immutable submission snapshots, idempotency key/fingerprint protection, and owner-only operation status.
2. [`src/memory-adapters.mjs`](src/memory-adapters.mjs): entirely local fake GitHub state/PR/check/merge/deployment responses and in-memory operation store. These cannot reach any real GitHub repository or Cloudflare service. The store models an `insertOnce`/compare-current-state contract, **not durable D1 transactions**.
3. Publication-state machine: `Accepted → Validating → Checking → Merging → Deploying → Live`, plus `Conflict` and `Failed`. A pending CI or deployment status does not advance; a moved `main` blocks merge; a failed check does not merge; `Live` requires successful verified hosted release identity whose source SHA matches the merged SHA. Fake adapter idempotently returns the same simulated PR for the operation ID.
4. Candidate promotion is a **required injected `sourceAware.promote` boundary**. It must return `validated: true` and concrete canonical-path changes before a simulated PR is created. The current test adapter is a **controlled fake** and is NOT the real `pwa/src/handoff.mjs`, Ajv/schema or `inventorySource` validator. No production-grade content validation is claimed.

## Execution and verification

Test runner: Node.js `v22.16.0`, `cd experiments/p3 && npm test` (`node --test test/*.test.mjs`).

```text
# tests 16
# pass 16
# fail 0
# cancelled 0
# skipped 0
```

Test cases exercise unauthorized, expired and mismatched sessions; exact Origin/CSRF/Fetch Metadata requirements; forbidden repository IDs; invalid package/domain; media traversal/size/hash; immutable snapshot; duplicate requests and incompatible idempotency keys; pending/failed CI; stale `main` conflict; wrong deployed SHA; owner-only operation status; and rejection of an unvalidated candidate. These are local unit/regression results, **not live security tests**.

Tested Git blob matches, confirmed against actual repository contents after committing:

| File | Confirmed SHA |
| --- | --- |
| `src/broker.mjs` | `7513b0842de657e3dce0f6190ba46900b0d06c56` |
| `src/memory-adapters.mjs` | `0a951ac1f320a573d138e9bae5a4f23449833495` |
| `test/broker.test.mjs` | `1ed53d091b8e7ff56efa1aaf21ff770188f0180a` |

An initial local 16-test run produced **15 PASS / 1 FAIL** because the new test expected a **Failed** result for an unvalidated candidate while the source initially categorized it as a **Conflict**. The classification was corrected in the broker to reserve **Conflict** for stale-source review and **Failed** for security/validation/CI/deployment failures; the affected CI failure test was also updated accordingly. The final exact-SHA source and all sixteen tests passed. This was not a defect in deployed code: nothing was deployed.

## Explicit remaining gates before P3 live preview

- **Real server-owned auth boundary:** don't pass caller-supplied session objects as proof of identity. Use D1 lookup on each write, exact owner ID allowlist, an independently validated CSRF token tied to the session, signed-out/revoked/expired rejection and provider-specific deployment config.
- **Source-aware canonical validation:** integrate the real `pwa/src/handoff.mjs` `validatePackage/promoteChange` with `conflictPolicy: 'review'`, Ajv record/library schema and semantic validation, Markdown references, media actual bytes/digests, path collision checking and entire source inventory. Never accept a client or arbitrary adapter's unsubstantiated `validated: true` in deployed code.
- **Durability and concurrency:** current stepper is single-threaded and memory-only. Implement D1 atomic insert/CAS claims, leases, restart-safe reconciliation, bounded retries, idempotent GitHub PR/merge calls and durable event/error statuses; test worker crash between side effect and store update.
- **Real GitHub App adapter:** restricted one-repository installation tokens, atomic branch commit, PR head exact SHA and actual safe check/ruleset validation, merge with current-main guard, normal content-only production workflow semantics, honest hosted verification and rollback.
- **Host operation:** separate Cloudflare Free preview Worker/D1 under new scoped consent, source-controlled deploy fingerprint, rate/size limits, secrets, metrics and recovery. Actual sandbox repository plus App Contents/PR write rights are NOT presently granted.
- **Future app UX:** P4 sign-in and Gear/KB Save and Publish; P8 full browser/offline/cutover tests remain separate.

**Gate result:** P3-0 local mock prototype **PASS**. **P3-1 (Cloudflare preview) and P3-2 (sandbox GitHub App writes) NOT STARTED — further explicit scoped approval required before either.** No production, Cloudflare, GitHub App permission or `main` mutation occurred.
