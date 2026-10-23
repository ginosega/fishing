# FISH118 P3-13 — Trusted sandbox runner, draft-to-CI observation integration

**Date:** October 23, 2026  
**Status:** source-only on [draft PR #263](https://github.com/ginosega/fishing/pull/263). No GitHub App, private sandbox, Worker deployment, live D1 migrations, production main, or publishing configuration was changed.

## Source authority and safety gates

- Live repository check: production `ginosega/fishing` `main` remained at `4a1a8c44317b56a4d47e818db9cd2b5587a966d8`, with the active free-plan GitHub Ruleset #25742040.
- Private sandbox `ginosega/fishing-p3-sandbox` `main` remained at `e37db3b18bd9948bf4453d7f885f868e830a9a9a`. Synthetic sandbox PR #1 remains unmerged; no new live branch or PR was created.
- P3-11 live owner-executed read-only App token evidence and P3-12 durable Checking-state observation/recovery are independently documented in [P3-11](P3_11_App_Checks_Read_Proof_Handoff_2026-10-23.md) and [P3-12](P3_12_Durable_Check_Observation_and_Recovery_2026-10-23.md).

## Implemented composition root

New source-only [trusted-sandbox-runner.mjs](src/trusted-sandbox-runner.mjs) assembles the existing hardened components for one **server-owned owner ID and exact private sandbox repository ID 1430581407**:

- `createD1OperationStore` (idempotent request, trusted snapshot, lease, immutable PR receipt).
- `createD1CheckObservationStore` (migration `0003` staging, auditable compare-and-swap CI observations).
- `createSandboxDispatcher` (session-guarded request acceptance, trusted checkout/source-aware validation, immutable sandbox branch and draft-PR creation).
- `createSandboxCheckReadTokenIssuer` (sandbox-only, exact `contents:read / pull_requests:read / checks:read` ephemeral App token).
- `createSandboxCheckObserver` (GitHub GET only, matching draft PR/base/head and GitHub Actions check).
- `createSandboxCheckCoordinator` (bounded retry, lease recovery, immutable audit, remains in `Checking`).

**Separate deny-by-default gates:**

1. `createDraftStep` can proceed only if **both** the trusted operator callback `allowSandboxWrites()` returns true and `env.P3_WRITE_ENABLED === 'true'`. Neither occurs in any live service or deployment. The test harness simulates the write-enabled branch only with fake GitHub HTTP and disposable Git data.
2. `observeCheck` can proceed only if **all three** conditions hold: the trusted operator callback `allowCheckObservation()` returns true; `env.P3_CHECK_OBSERVATION_ENABLED === 'true'`; **and `env.P3_WRITE_ENABLED === 'false'`**. It does not depend on the draft creation write gate and cannot acquire a write-scope token.
3. Both trusted callbacks default to false. Merely importing or constructing this module does **not** initiate GitHub API calls, create a D1 row, request a token or schedule any background task. No Worker route or GitHub Actions deployment imports it.

The exposed runner interface is exactly `accept`, `createDraftStep`, `observeCheck`, `get`, `getCheck`, and `checkHistory`. The three status reads remain scoped to the trusted owner and exact sandbox repository. It does **not** expose a merge, deploy, publish-to-production, generic GitHub mutation, token issuer, or migration method.

## Source-aware lifecycle proof

New [trusted-sandbox-runner.test.mjs](test/trusted-sandbox-runner.test.mjs) uses actual in-memory SQLite migrations 0001/0002/0003, real D1 stores, actual session/Origin/CSRF guard, the actual dispatcher and source-aware trusted checkout flow over a temporary Git repository, with **mock-only GitHub HTTP/token issuers**. It tests:

- P3-I01: accepted → validating → Checking with immutable PR evidence, then successful exact-head CI observation, D1 audit; zero additional GitHub writes and no merge/deploy method.
- P3-I02: restart after successful CI reuses persisted proof and makes no additional GitHub calls.
- P3-I03: an in-progress GitHub Actions check is durably retried with cooldown, then completed successfully by a later runner.
- P3-I04: changed head/main or completed failed CI is recorded for manual review, never a positive success.
- P3-I05: `P3_WRITE_ENABLED=true` blocks the separate read-only CI path before any token or GitHub request.
- P3-I06: absent explicit trusted approvals leaves both paths disabled.
- P3-I07: the runner cannot read another owner's stored operation.
- P3-I08: no merge/deploy or token method is exposed.

**Isolated GitHub Actions run [#40033150725](https://github.com/ginosega/fishing/actions/runs/40033150725) passed all 243 source tests: 80 PWA + 43 standalone P3 + 120 preview tests, including eight new trusted-runner integration tests.** The file and report additions still require the final exact-head CI run to be checked independently.

## What this does not do

The source now has an integrated trusted Node composition root, but **it is not routed, deployed, scheduled, or connected to Cloudflare**. No live `0002` or `0003` migration occurred. The injected simulated write path is not a proof of a live App-created sandbox PR. The existing owner's P3-11 sandbox-only read permission is unchanged. The unprotected private sandbox will not be auto-merged under this design. Real v3 content publishing, application auth and Cloudflare deployment remain separate future gates requiring explicit owner authorization.

**Next recommendation:** review the secure trusted-runner execution/deployment and isolated migration rollout plan before any operational change. Full v3 production auto-publishing still needs its own live safety checks, protected public main gate and separately approved cutover. Chat mode suffices for planning and source tests; another Work mode chat is not necessary.
