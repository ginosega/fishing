# FISH118 P3-15 — Read-only CI runner and schema preflight

**October 23, 2026. Source-only work on draft [PR #263](https://github.com/ginosega/fishing/pull/263). No operational activation or deployment.**

## Verified baseline

- Public production main: `4a1a8c44317b56a4d47e818db9cd2b5587a966d8`, protected by active GitHub Free ruleset #25742040.
- Private synthetic sandbox main: `e37db3b18bd9948bf4453d7f885f868e830a9a9a`, repository ID `1430581407`; synthetic PR #1 remains separate and untouched.
- P3 draft PR #263 remains open/unmerged. Cloudflare's P3 isolated D1 was manually initialized with `0001`; migrations `0002` and `0003` remain unapplied remotely.

## Implemented source-only components

1. [Narrow D1 Checking lease reader](src/d1-check-lease-reader.mjs): exposes only owner-scoped `get`/`claim`; the claim performs D1 lease CAS but cannot advance the operation state, accept publications, create PRs or merge.
2. [Observation-only runner](src/read-only-check-runner.mjs): assembles only D1 lease reader, audit store, restricted GitHub check-read token issuer, exact-head GET check observer, and retry coordinator. Unlike the prior combined trusted runner, it does **not import or require** Node Git checkout, the source promoter, the dispatcher, sandbox GitHub PR writer or a write token. Its sole functions are `observeCheck`, `get`, `getCheck`, and `checkHistory`.
3. Check observation requires all three: `P3_WRITE_ENABLED === 'false'`, `P3_CHECK_OBSERVATION_ENABLED === 'true'`, and an explicit trusted `operatorApproved()` callback returning true. The callback defaults false. No setting was enabled in Cloudflare.
4. [Schema preflight](src/p3-schema-preflight.mjs) provides metadata-only D1 SQL reads and a conservative audit. It checks the **independently pinned six-object 0001 schema**, an explicitly supplied matched sandbox database/binding UUID, unknown or partially applied P3 objects, and the Wrangler migration ledger. A missing ledger after manual 0001 requires reconciliation; it is not an invitation to apply 0001 again. Every output has `safeToApply:false` and requires owner review.

## Tests and security boundaries

- [Observation runner tests](test/read-only-check-runner.test.mjs) use the actual in-memory 0001–0003 SQLite schema, immutable D1 receipt, fake restricted App token, and mock GET-only GitHub API: success, retry, restart, moved SHA, owner isolation, disabled controls and no write-capable import/methods.
- [Schema preflight tests](test/p3-schema-preflight.test.mjs) generate canonical 0001 with SQLite, then test schema drift, invalid/ambiguous ledger, unexpected 0002/0003 objects, wrong database/binding UUID, forged expected reference, duplicate metadata and SELECT-only access.
- This is **not** a Cloudflare Worker route, cron, scheduler, deployed Node runtime, verified remote migration history or live App/DB integration. D1 observation recording can write *only* its isolated lease/evidence rows when a future trusted runtime enables it. No GitHub write API exists in this read-only composition.
- A coincident source CI run never implies a production deployment; the public main and both isolated service settings remain unchanged.
- Source verification: [GitHub Actions run #40035275719](https://github.com/ginosega/fishing/actions/runs/40035275719) completed **success: 80 PWA + 43 standalone + 140 preview = 263/263 tests passed**. The branch received a subsequent test-title-only correction; its own exact-head CI must be checked before final closeout.

## Next operational gates — withheld

1. Read-only remote Cloudflare inventory: inspect actual D1 UUID/Worker binding, manual 0001 schema, Wrangler ledger and recovery support. This requires access through the owner's Cloudflare account; no secrets or full private config should be pasted into Chat.
2. **New explicit approval before applying remote 0002/0003.** Reconcile manual 0001 versus Wrangler history and record recovery readiness; never blindly issue `migrations apply` or restore.
3. Separately review the observer-only Cloudflare hosting and authenticated trigger design. This source composition is not yet connected to the live Worker; no route, new App token, cron, scheduled job, migration or deployment was performed.
4. Any sandbox App-created PR, GitHub write scope, automatic merge, production publishing or v3 cutover remains outside this increment. The private sandbox has no enforceable branch protection under GitHub Free and must not auto-merge.

[P3-14 activation and D1 migration plan](P3_14_Secure_Activation_and_D1_Migration_Plan_2026-10-23.md).