# FISH118 P3-0 — Isolated trusted publishing broker prototype

**Owner authorization:** October 22, 2026, approved the P3 staging proposal. Source-only and mock-only implementation is approved; live GitHub App permission grants, installation, hosted Worker/D1 provisioning, sandbox repository creation or writes, merging and production cutover still require separately scoped permission.

## Implemented here

A pure Node.js broker with injectable repository, source-aware validation and operation-store adapters. It has **no HTTP server, Cloudflare deployment, real GitHub client, tokens or configured destination**. It exercises immutable submit snapshots, exact-owner/repository checks, strict Origin/Fetch-Metadata/CSRF conditions, media size/hash/path checks, idempotency, durable-operation interface contracts and conservative PR/check/merge/hosted-verification states.

The included fake adapters are **not real GitHub/D1**. Their behavior is useful for API-contract testing, but not a security or reliability attestation for a real service. A source-aware validator adapter **must** return validated candidate changes; the fake merely returns a controlled fixture. **Actual pwa/src/handoff.mjs promotion, schema/Ajv validation, media inventory and full-source verification are not yet integrated**, and are mandatory before a privileged preview.

Run `cd experiments/p3 && npm test` (Node.js 22+).

## Gates to complete before any privileged preview

1. Replace in-memory store with atomic, durable D1 transactions/leases/recovery; implement trustworthy session lookup from server-owned D1 and a signed/intended CSRF mechanism. The prototype’s session object is an injected test fixture, **never acceptable as a browser claim**.
2. Integrate repository's actual `pwa/src/handoff.mjs` `validatePackage/promoteChange` in review mode, Ajv schema and full `inventorySource` + Markdown/media/reference validation against freshly fetched current source.
3. Use approved sandbox-restricted GitHub App installation token; create a single atomic branch commit + content-only PR; verify exact PR head/checks/rulesets, merged SHA, workflow deployment and hosted release identity. Never bypass protected branches or claim Live prematurely.
4. Implement compare-and-swap/claim semantics, operation retry and reconciliation across crashes, API rate/size limits, logging/error confidentiality, Cloudflare Free quotas, secret management, automated deployments/rollback and real adversarial tests.
5. Obtain the separate explicit owner approvals before creating/deploying any Cloudflare Worker/D1, sandbox repository or GitHub App writes.

**Current status:** P3-0 source-only prototype; not production-ready. Existing `ginosega.github.io/fishing` and AUTH-P0 Worker unchanged. The completed AUTH-P0 decision and waivers remain in [draft PR #262](https://github.com/ginosega/fishing/pull/262).
