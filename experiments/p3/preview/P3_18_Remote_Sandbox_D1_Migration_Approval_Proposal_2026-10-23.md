# FISH118 P3-18 — Remote isolated D1 migration approval proposal (NOT APPROVED)

**October 23, 2026. Status: PROPOSAL FOR REVIEW ONLY.** This is a controlled *future* procedure, not permission to run `--remote`, create/alter `d1_migrations`, migrate schemas, deploy, activate publishing, merge a PR, change GitHub App permissions, or write to the private synthetic GitHub sandbox.

## Authority and scope

- **Sole target:** Cloudflare D1 **`fishing-p3-sandbox`** bound as **`DB`** to **`fishing-p3-sandbox-preview`**. Explicitly exclude `fishing-auth-p0` and any production D1/Worker.
- **Installed starting schema:** manually installed, source-matched `0001_initial.sql`: 3 tables + 3 indexes; remote `d1_migrations` absent; no 0002/0003 objects.
- **Data:** owner confirmed **0 rows** in remote `p3_sessions`, `p3_operations` and `p3_events` via read-only SELECT using an explicit UUID-bound temporary private `--config`. Snapshot must be **rechecked immediately before remote work**.
- **Runtime disabled:** owner verified `P3_WRITE_ENABLED=false` and exact D1 binding in Cloudflare dashboard; hosted GET `/health` returned `ok:true, ready:false, mode:preview-no-publishing`; hosted GET `/session` returned `authenticated:false, authorized:false`. Recheck before/after each stage.
- **Integrity/recovery:** remote `PRAGMA foreign_key_check` returned no violations; production D1 backend and `d1 time-travel info` bookmark available. **The earlier bookmark is not a new pre-change recovery checkpoint.** Create/read a fresh, privately retained bookmark before a future approved remote write; do not post its value, DB UUID, account ID, auth token or complete private config to GitHub.
- **Owner-run real-tool proof:** actual `wrangler@4.152.0` with explicit **`--local`** and synthetic database successfully replayed already-installed 0001, recorded Wrangler's 0001 ledger entry, then applied only 0002, then only 0003 with separate checks. Final local evidence: ordered ledger 0001–0003, six P3 tables/three indexes/five triggers, empty foreign-key check and no pending local migrations. See [P3-17](P3_17_Wrangler_Migration_History_Reconciliation_2026-10-23.md).
- **Immutable SQL source:** exactly checked-in 0001–0003 files at reviewed commit `d58833d3f4faa093f6a78b883af89f82eafddfb0` or byte-verified identical files from current reviewed feature branch. No edited SQL, migration file renaming, or hand-authored migration ledger entries.
- The application feature remains in draft [PR #263](https://github.com/ginosega/fishing/pull/263); **do not merge**. Production GitHub `main` and private sandbox `main` must remain unchanged through this D1-only work.

## Approval model — three independent write gates

| Stage | Exact changes Wrangler may make | Expected after stage | Approval |
|---|---|---|---|
| **R1: ledger reconciliation** | Apply only unchanged idempotent `0001_initial.sql` to already-existing 0001 remote schema; Wrangler establishes/records its own `d1_migrations` entry | Original six P3 objects unchanged; ledger only 0001; three P3 row counts still zero | **Explicit approval for R1 only — NOT GIVEN** |
| **R2: durable request/audit** | Apply only `0002_durable_snapshot_and_audit.sql` | Four P3 tables, three indexes, three triggers; ledger exactly 0001–0002 | **Separate explicit approval after verifying R1 — NOT GIVEN** |
| **R3: CI observation recovery** | Apply only `0003_ci_observation_recovery.sql` | Six P3 tables, three indexes, five triggers; ledger exactly 0001–0003 | **Separate explicit approval after verifying R2 — NOT GIVEN** |

**Never execute a normal remote apply with all three migrations initially discoverable.** Because `d1 migrations apply` processes pending files in order, the *temporary private* migration folder is staged as **0001 only → 0001+0002 → 0001+0002+0003**, and every stage stops for verification before adding the next. Do not run remote apply using the synthetic `LOCAL_P3` configuration.

## Private target configuration and immutable staging (prepare only after separate approval)

Use a **new, clearly named private remote-only Wrangler config** under a temporary directory, separate from the existing synthetic local rehearsal `$cfg`. The remote config must select **only** `fishing-p3-sandbox` by its real UUID obtained from `wrangler d1 list`, with `DB` binding, migration directory set to a **private restricted folder**, and no remote `AUTH-P0` binding. Keep `P3_WRITE_ENABLED=false`; no need to deploy this config to a Worker. Double-check `Get-Content` locally without sharing IDs, and compare account/UUID privately against deployed Worker binding. The earlier unconfigured call treated the database name as an API identifier and returned authentication error 10000: **every future D1 command must use explicit `--config` and the `DB` binding.**

Before each stage validate the private folder's **exact filenames and SHA-256 fingerprints** against the immutable source (use `Get-FileHash` or a bytewise check). Staging must not introduce any additional SQL files or subdirectories. Confirm Wrangler version 4.152.0, account identity, correct DB `production` storage backend, D1 UUID match, feature branch source, and still-disabled hosted Worker.

For an approved stage only, the intended command shape is:

```powershell
# REFERENCE SHAPE ONLY — DO NOT EXECUTE WITHOUT STAGE-SPECIFIC APPROVAL.
# $remoteCfg must be independently verified and must NOT be $cfg (the synthetic local config).
npx.cmd --yes wrangler@4.152.0 d1 migrations apply DB --remote --config $remoteCfg
```

**Safety gate:** manually inspect Wrangler's interactive pending-file preview. It MUST show **exactly one approved file**, for the corresponding R1/R2/R3 gate, and the correct isolated database. If it lists any other file, unexpected database, asks for resource creation or token change, or skips confirmation, **cancel**. The `--yes` here is an npm `npx` installer option, **not** permission to suppress Wrangler's interactive confirmation. Never pass Wrangler's noninteractive `-y/--yes` to remote migration apply.

## Required read-only preflight immediately before each remote write

Each SQL query below is read-only. Replace `$remoteCfg` with the verified **private remote config** (never reuse synthetic `$cfg`) and run from the owner's authenticated machine, with the exact `DB` binding. Do not publish identifiers, tokens or row content.

```powershell
npx.cmd --yes wrangler@4.152.0 d1 execute DB --remote --config $remoteCfg --command "SELECT type,name,sql FROM sqlite_master WHERE sql IS NOT NULL AND name LIKE 'p3_%' ORDER BY type,name;" --json
npx.cmd --yes wrangler@4.152.0 d1 execute DB --remote --config $remoteCfg --command "SELECT 'p3_sessions' AS table_name,count(*) AS n FROM p3_sessions UNION ALL SELECT 'p3_operations',count(*) FROM p3_operations UNION ALL SELECT 'p3_events',count(*) FROM p3_events;" --json
npx.cmd --yes wrangler@4.152.0 d1 execute DB --remote --config $remoteCfg --command "PRAGMA foreign_key_check;" --json
npx.cmd --yes wrangler@4.152.0 d1 time-travel info fishing-p3-sandbox --json
```

Before R1: require precisely pinned 0001 definitions, three zero row counts, missing ledger and no unexpected P3 objects. Before R2/R3: verify exactly the previous stage's objects and `SELECT name FROM d1_migrations ORDER BY id` gives only the prior approved prefix. Avoid querying `d1_migrations` before R1 because it does not exist. Confirm in Cloudflare Dashboard that Worker `DB` binding is still exact isolated D1 and `P3_WRITE_ENABLED=false`; GET `/health`/`/session` anonymously and confirm still disabled.

Capture a **fresh, privately held Time Travel bookmark** just before a remote mutation; confirm recovery retention/restore implications. Time Travel is a recovery mechanism, not an isolated automatic rollback guarantee: `time-travel restore` changes the entire D1 state and is **not authorized** by migration-stage approval.

## Required immediate post-stage read-only checks

- **R1:** read `d1_migrations` names, require only `0001_initial.sql`. Compare P3 object names **and normalized full definitions** against the pre-apply exact 0001 reference; verify the three original row counts unchanged, FK clean, and anonymous hosted Worker still disabled.
- **R2:** read exactly ordered 0001–0002 ledger; verify new `p3_requests` and exactly the three expected operation audit/guard triggers; no unexpected objects; zero original/application rows and FK clean; still-disabled Worker. **STOP for review; don't add 0003 yet.**
- **R3:** read exactly ordered 0001–0003 ledger; verify six tables, three indexes, five triggers with expected definitions; FK clean; still-disabled Worker; row counts unchanged. Only after positive verification mark remote-schema staging complete (which **still does not deploy a publisher**).

Failures or ambiguous results are immediate STOP conditions. Do not rerun partial migrations, create/delete rows/ledger entries manually, deploy a Worker, use speculative `DROP`/recovery SQL, or attempt D1 Time Travel restore without a new assessment and explicit destructive-recovery approval.

## What this proposal does not approve

This document is not authorization to run R1, R2, R3, alter `P3_WRITE_ENABLED`, bind production, create/deploy new Worker code, use GitHub App write scopes, create or merge a sandbox PR, enable schedulers, or merge [draft PR #263](https://github.com/ginosega/fishing/pull/263). R1/R2/R3 are **three separate human approval decisions** after each prior-stage verification. Do not use a general user `Proceed` from earlier source-only work as approval for any stage.

## References

- [P3-16 owner-executed read-only inventory](P3_16_Read_Only_Cloudflare_Inventory_2026-10-23.md)
- [P3-17 actual Wrangler local rehearsal](P3_17_Wrangler_Migration_History_Reconciliation_2026-10-23.md)
- [Cloudflare D1 migrations and ledger](https://developers.cloudflare.com/d1/reference/migrations/)
- [Cloudflare D1 Wrangler commands](https://developers.cloudflare.com/d1/wrangler-commands/)
- [Cloudflare D1 Time Travel and backups](https://developers.cloudflare.com/d1/reference/time-travel/)
