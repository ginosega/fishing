# FISH118 P3-17 — Manual 0001 / Wrangler history reconciliation (SOURCE-ONLY)

**Date:** October 23, 2026. **Status:** Source-only rehearsal and gated operator plan, draft [PR #263](https://github.com/ginosega/fishing/pull/263). **No remote SQL, schema migration, ledger creation, deployment, GitHub sandbox writes, or publishing activation.**

## 1. Verified starting evidence

The owner completed [P3-16 read-only inventory](P3_16_Read_Only_Cloudflare_Inventory_2026-10-23.md): the isolated Cloudflare D1 `fishing-p3-sandbox` currently contains exactly the `0001_initial.sql` three tables and three indexes with matching definitions; no `0002` or `0003` objects; `PRAGMA foreign_key_check` empty; Time Travel info returned a recovery bookmark; the deployed `fishing-p3-sandbox-preview` Worker uses the matching `DB` binding and `P3_WRITE_ENABLED=false`; anonymous `/health` remains `ready:false` and `/session` remains unauthorized. **`d1_migrations` does not exist.** This is owner-executed Cloudflare evidence, not direct Cloudflare inspection by the GitHub connector. The live P3 operation/session/event **row counts are not yet established**. Do not infer empty tables from the size or table count.

Production public `ginosega/fishing` main remains `4a1a8c44317b56a4d47e818db9cd2b5587a966d8`; private synthetic sandbox main remains `e37db3b18bd9948bf4453d7f885f868e830a9a9a`; production GitHub Free ruleset #25742040 was active at checkpoint. Keep PR #263 draft and unmerged.

## 2. Wrangler behavior and reconciliation choice

Cloudflare [D1 migration documentation](https://developers.cloudflare.com/d1/reference/migrations/) says migration files are applied in filename order and completed filenames are stored in the configured `d1_migrations` table. The [Wrangler CLI reference](https://developers.cloudflare.com/d1/wrangler-commands/) says `d1 migrations apply` applies **all pending** files selected by the migration directory/config, asks for confirmation interactively, captures backups, and rolls back a failed migration while retaining earlier successful ones. **A normal apply in the current directory could apply all 0001–0003 at once**; it must NOT be used without a reviewed restricted migration set and separate approval.

**Preferred candidate (not yet an operational authorization):** after verified zero existing P3 rows, unchanged 0001 definitions, safe recovery point and local Wrangler test, allow **Wrangler itself to replay the unchanged, idempotent `0001_initial.sql` as the *only* discoverable migration** in a private temporary configuration. That source is exclusively `CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS`, with no inserts or drops. A local SQLite replay leaves the exact schema and seeded rows unchanged. If Wrangler's actual selected-version/ledger behavior is independently confirmed, this can create its supported `d1_migrations` entry for 0001, without manually fabricating the internal ledger. Inspect the resulting remote ledger and schema before any further migration.

**Do not** manually create/INSERT/UPDATE `d1_migrations` as an alternative. Do not blindly invoke apply on the full three-file migration set. Do not assume the local SQLite rehearsal proves Cloudflare's Wrangler implementation or deployability. If a local Wrangler rehearsal of the same staged setup fails, stop and revisit the strategy instead of proceeding remotely.

After an explicitly approved 0001 reconciliation stage succeeds, the *next separately reviewed and approved stages* could add only `0002_durable_snapshot_and_audit.sql` to the discoverable local migration directory, apply it with Wrangler, then verify the one table and three triggers; later add only `0003_ci_observation_recovery.sql`, apply, and verify its two tables and two triggers. In every stage the local directory is **the exact prefix of the canonical files**, not a new custom SQL script. Each later stage has a fresh stop/review/approval gate; never use `--yes` on a remote apply, automated CI/CD, or unattended scheduling.

## 3. Source-only implementation and rehearsal

- [Pure reconciliation gate](src/p3-migration-reconciliation.mjs) accepts an exact P3-15 schema preflight and independent yes/no evidence for DB binding, disabled Worker/publishing flag, FK integrity and Time Travel recovery. It **refuses to mark the plan reviewable if any durable table's row count is nonzero or unknown**; today those counts are unknown, so a remote apply is blocked until a fresh owner-run read-only row-count query and new explicit approval.
- Only a verified `0001` reference with precisely the known `WRANGLER_LEDGER_MISSING` condition can reach `OPERATOR_REVIEW_ONLY`. Any schema drift, duplicate/unknown ledger entry, unexpected already-created `0002`/`0003` object, missing recovery evidence, missing/changed Worker gates or wrong DB identity returns `HALT`. **Every result has `safeToApply:false`, `requiresSeparateOwnerApproval:true`, `canMerge:false` and `canDeploy:false`.** No filesystem, network, SQL or Wrangler execution exists in this module.
- [Real SQLite rehearsal tests](test/p3-migration-reconciliation.test.mjs) exercise the exact checked-in three SQL migration files in a disposable in-memory SQLite instance. They prove manual 0001 plus absent ledger is blocked pending reconciliation, idempotent unchanged 0001 replay and preserved existing rows, refusal of unverified/nonempty rows, schema-drift stop, ordered 0002/0003 tables/triggers/integrity/audit behavior and a failed staged SQL transaction rollback. Any **test-only fixture migration name table is explicitly NOT Wrangler's real ledger implementation**.
- This is **not** a Wrangler CLI local integration or live Cloudflare migration proof. A future source-only/local Wrangler rehearsal with the *same restricted directory* is required to demonstrate the tool's real pending-file and ledger behavior before remote execution.

## 4. Future read-only prerequisite before any approval

From the owner's authenticated PowerShell session, check **only** the exact isolated DB, not production or AUTH-P0. Do not include any stored row values or identifiers in the response:

```powershell
npx.cmd --yes wrangler@4 d1 execute fishing-p3-sandbox --remote --command "SELECT 'p3_sessions' AS table_name, count(*) AS n FROM p3_sessions UNION ALL SELECT 'p3_operations', count(*) FROM p3_operations UNION ALL SELECT 'p3_events', count(*) FROM p3_events;" --json
```

Report only the three counts. If *any* count is not zero, stop: the source-only replay proves `0001` is idempotent, but applying `0002` introduces audit triggers that would not retroactively log earlier operations. A separate data-preservation and historical audit policy is then required.

## 5. Operator-stage outline — **NOT FOR EXECUTION YET**

1. **Private target/config review.** Confirm selected Cloudflare account, exact target `fishing-p3-sandbox` and the matching UUID in the deployed Worker's `DB` binding. Keep local `wrangler.jsonc` untracked with `APP_ORIGIN` and `P3_WRITE_ENABLED=false`; do not paste config secrets/UUIDs into Chat or source control. Use only a private temporary migration directory **in the same Wrangler config context** whose contents initially are an *unchanged copy* of canonical `0001_initial.sql`, never 0002 or 0003. Verify file equality with hashes and `d1 migrations list --local` during a disposable *local* Wrangler rehearsal.
2. **Owner-approved stage 0001 (future only).** Recheck remote 0001 schema/no unexpected objects, three row counts, foreign keys, matched DB binding, disabled Worker, current exact main identity, Time Travel and a **fresh pre-mutation bookmark** (stored privately). Only after explicit approval, invoke Wrangler with the *restricted* single-file migration set against exactly the isolated remote database. Human-reviewed preview must show **only 0001** as pending. Abort if any other filename appears or if Wrangler attempts account/resource provisioning.
3. **After 0001:** stop, prove canonical P3 schema and zero row/data change, `d1_migrations` exists with **exactly `0001_initial.sql`**, no `0002`/`0003` objects, FK clean, Worker health disabled, independent recovery route. A post-apply backup is not equivalent to a pre-apply bookmark; preserve the latter for reviewed recovery.
4. **Stage 0002 (later approval only):** add canonical 0002 file to restricted directory, keeping 0001. Confirm **only 0002 pending**, then apply after approval; verify `p3_requests` plus three triggers, prefix ledger exactly 0001/0002, FK clean, no unexpected data change or Worker deployment.
5. **Stage 0003 (later approval only):** add canonical 0003 file, confirm **only 0003 pending**, apply after approval; verify `p3_ci_observations` and `p3_ci_observation_audit` plus their two triggers, exactly three ledger filenames, FK clean, Worker still write-disabled.
6. **Runtime stays disabled.** None of these schema stages enable owner sign-in, scheduling, GitHub App writes, branch/PR creation, merges, deployment, or production publishing. The private sandbox is unprotected under GitHub Free and cannot auto-merge.

### Stop and recovery conditions

Stop on unexpected Wrangler migration table creation during an *inspection* command, schema drift, nonempty operation/session/event tables, any extra migration file, unexpected DB name/UUID, changed Worker/version, `P3_WRITE_ENABLED` not false, missing fresh recovery point, migration-tool output not understood, or a partial remote migration. Wrangler's automatic per-migration rollback is not sufficient to assume a multi-stage batch had no side effects. **Do not run guessed DROP/INSERT fixes or D1 `time-travel restore` without analyzing intervening writes and obtaining destructive-recovery approval.** On Cloudflare Free, the Time Travel history window is seven days; a restore replaces the isolated database state, not just a migration ledger. [Time Travel reference](https://developers.cloudflare.com/d1/reference/time-travel/).

## Validation evidence

- [GitHub Actions isolated P3 source validation #40042317013](https://github.com/ginosega/fishing/actions/runs/40042317013) completed successfully on rehearsal-source revision `79c8668a71279fe4d1c3a029b145755a8701abdb`: **272/272 tests passed** (80 PWA, 43 standalone broker and 149 preview tests). Nine new P3-L01 through P3-L09 reconciliation cases passed. This does **not** constitute Wrangler-CLI or Cloudflare-hosted migration execution.
- A later report-only commit will require an additional exact-head CI check before the final P3-17 checkpoint is declared validated.

## 6. Approval disposition

**P3-17 authorization:** source-only rehearsal, pure plan module, tests and this document on PR #263. **No authorization** to run remote Wrangler migrations or even establish a remote ledger. No new Cloudflare services, permissions, secrets, DB clones, Worker deployment or GitHub sandbox write.

**Next recommended check:** owner-supplied read-only row counts, then a local **actual-Wrangler-only** staged-directory rehearsal (no `--remote`) before submitting exact remote action commands for approval. Chat mode is sufficient.
