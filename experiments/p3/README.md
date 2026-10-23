# FISH118 P3-0 — Isolated trusted publishing broker prototype

**Owner authorization:** October 22, 2026, approved the P3 staging proposal. Source-only and mock-only implementation is approved; live GitHub App permission grants, installation, hosted Worker/D1 provisioning, sandbox repository creation or writes, merging and production cutover still require separately scoped permission.

## Implemented here

A pure Node.js broker with injectable repository, source-aware validation and operation-store adapters. It has **no HTTP server, Cloudflare deployment, real GitHub client, tokens or configured destination**. It exercises immutable submit snapshots, exact-owner/repository checks, strict Origin/Fetch-Metadata/CSRF conditions, media size/hash/path checks, idempotency, durable-operation interface contracts and conservative PR/check/merge/hosted-verification states.

The included fake GitHub/D1 adapters remain **non-networking fakes**, not secure production adapters. The initial broker tests still use a controlled fake validator. A second adapter, [`src/source-aware.mjs`](src/source-aware.mjs), now uses the **real** `pwa/src/handoff.mjs` change promoter and `pwa/tools/library.mjs` **full canonical `inventorySource` validator** in a disposable copy of a trusted exact-main checkout. That inventory incorporates Ajv schema checks, Markdown references, path collisions and real image decoding. Tests under [`pwa/test/p3-source-aware.test.mjs`](../../pwa/test/p3-source-aware.test.mjs) cover edit conflicts, unrelated-field preservation, KB Add, broken Markdown, media metadata denial and broker-to-adapter integration. **This is still source-only**: the trusted checkout is a test fixture and no real GitHub adapter proves its SHA yet.

Run `cd experiments/p3 && npm test` (Node.js 22+, original standalone mock broker tests). To run the canonical validator integration, run `cd pwa && npm ci && npm test` with the repository's required Node 24 and locked dependencies; GitHub's full PR validation uses this command.

## Gates to complete before any privileged preview

1. Replace in-memory store with atomic, durable D1 transactions/leases/recovery; implement trustworthy session lookup from server-owned D1 and a signed/intended CSRF mechanism. The prototype’s session object is an injected test fixture, **never acceptable as a browser claim**.
2. **Integration source added, preview hookup not yet complete:** bind the real validator to a trusted freshly fetched, commit-SHA-verified source snapshot in the future GitHub adapter (never a client-supplied directory); finish full media write/replace semantics and repository candidate checks before the privileged preview.
3. Use approved sandbox-restricted GitHub App installation token; create a single atomic branch commit + content-only PR; verify exact PR head/checks/rulesets, merged SHA, workflow deployment and hosted release identity. Never bypass protected branches or claim Live prematurely.
4. Implement compare-and-swap/claim semantics, operation retry and reconciliation across crashes, API rate/size limits, logging/error confidentiality, Cloudflare Free quotas, secret management, automated deployments/rollback and real adversarial tests.
5. Obtain the separate explicit owner approvals before creating/deploying any Cloudflare Worker/D1, sandbox repository or GitHub App writes.

**Current status:** P3-0 source-only prototype; not production-ready. Existing `ginosega.github.io/fishing` and AUTH-P0 Worker unchanged. The completed AUTH-P0 decision and waivers remain in [draft PR #262](https://github.com/ginosega/fishing/pull/262).
