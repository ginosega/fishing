# FISH118 P3-17 — Manual 0001 / Wrangler history reconciliation (SOURCE-ONLY)

**Date:** October 23, 2026. **Status:** All local Wrangler 0001–0003 stages passed; remote still unapproved; gated operator plan, draft [PR #263](https://github.com/ginosega/fishing/pull/263). **No remote SQL mutation, remote schema migration, remote ledger creation, deployment, GitHub sandbox writes, or publishing activation.** Owner-run remote read-only SELECT/PRAGMA metadata checks were completed in P3-16/P3-17.

## 1. Verified starting evidence

The owner completed [P3-16 read-only inventory](P3_16_Read_Only_Cloudflare_Inventory_2026-10-23.md): the isolated Cloudflare D1 `fishing-p3-sandbox` currently contains exactly the `0001_initial.sql` three tables and three indexes with matching definitions; no `0002` or `0003` objects; `PRAGMA foreign_key_check` empty; Time Travel info returned a recovery bookmark; the deployed `fishing-p3-sandbox-preview` Worker uses the matching `DB` binding and `P3_WRITE_ENABLED=false`; anonymous `/health` remains `ready:false` and `/session` remains unauthorized. **`d1_migrations` does not exist.** This is owner-executed Cloudflare evidence, not direct Cloudflare inspection by the GitHub connector. P3 operation/session/event counts were later verified as exactly zero via an explicitly bound, remote **SELECT-only** query (see the owner-run preflight section). Do not infer future emptiness from that snapshot.

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

### Owner-run data-count preflight — passed October 23, 2026

The owner used Wrangler 4.152.0 from PowerShell with a **temporary local `--config` that binds `DB` to the exact isolated D1 UUID**. This was necessary because an unconfigured `d1 execute fishing-p3-sandbox --remote` attempted to call the Cloudflare API using the literal database name and returned code 10000 even though `wrangler whoami` confirmed OAuth and D1 permissions. `d1 list --json` independently confirmed the exact sandbox UUID; its deprecated `num_tables:0` field is not a reliable schema inventory.

The corrected, explicitly bound command queried **only counts** in the remote sandbox and returned:

| Table | Records |
|---|---:|
| `p3_sessions` | 0 |
| `p3_operations` | 0 |
| `p3_events` | 0 |

Result metadata: `success:true`, `changed_db:false`, `changes:0`, `rows_written:0`. This satisfies the zero-existing-rows prerequisite for this snapshot; recheck immediately before any future write. The actual UUID, Cloudflare account ID, private config, token and bookmark are **excluded** from GitHub. **No live Wrangler migration or schema mutation was performed.**

**Next authorized activity: local-only actual Wrangler rehearsal.** Use a totally separate, synthetic local D1 config/UUID and explicit `--local --persist-to` on every execute/list/apply. Create the pre-existing 0001 schema locally without Wrangler ledger, then let Wrangler locally discover/apply only unchanged `0001` and check ledger contents; never include remote `0002` or `0003` in that rehearsal directory. Wrangler has now listed only `0001` pending in the owner-executed local rehearsal; whether local apply creates the expected ledger remains unverified. No remote migrate permission follows from the counts.
### Local-only Wrangler 4.152.0 first-stage rehearsal — confirmed pending

The owner created a disposable **local-only** Wrangler D1 with a synthetic database UUID, separate temporary persistence directory, and migration directory containing **only** unchanged canonical `0001_initial.sql` sourced from immutable P3 feature commit `d58833d3f4faa093f6a78b883af89f82eafddfb0`. This was separate from both remote `fishing-p3-sandbox` and `fishing-auth-p0`.

- `npx.cmd --yes wrangler@4.152.0 d1 execute LOCAL_P3 --local --persist-to $state --config $cfg --file $sql` returned `Resource location: local`, confirmed the synthetic `LOCAL_P3` database and reported **6 commands executed successfully** (the three tables and three indexes of 0001).
- `npx.cmd --yes wrangler@4.152.0 d1 migrations list LOCAL_P3 --local --persist-to $state --config $cfg` returned `Resource location: local` and exactly **one pending migration: `0001_initial.sql`**, despite its schema already existing in the local database.
- This independently validates Wrangler's pending-file *discovery* behavior on a ledgerless, pre-initialized local schema.

### Local-only Wrangler 4.152.0 migration 0001 apply and ledger reconciliation — PASSED

The owner subsequently executed **`d1 migrations apply LOCAL_P3 --local --persist-to $state --config $cfg`** in the same synthetic isolated local database, with the same single unchanged 0001 file. Wrangler reported **`Resource location: local`**, displayed **only `0001_initial.sql`**, received explicit human confirmation, executed **7 commands successfully**, and displayed a successful status for that migration.

After the local-only apply:

- `SELECT name FROM d1_migrations ORDER BY id` returned **exactly one entry: `0001_initial.sql`**.
- `SELECT type,name FROM sqlite_master WHERE name LIKE 'p3_%' ORDER BY type,name` returned the **same three named tables and three named indexes**. This verifies object identity/number but was not a separate post-apply comparison of full `sqlite_master.sql` definitions.
- `d1 migrations list LOCAL_P3 --local --persist-to $state --config $cfg` reported **`No migrations to apply!`**.
- Every command explicitly used **`--local`**, a **synthetic local D1 UUID** and a **temporary persistence directory**. Neither the production D1 nor the private P3 sandbox D1 was modified; the **remote `d1_migrations` table remains absent** as established in P3-16.

**Conclusion:** Real Wrangler 4.152.0 locally reconciled an identical manually initialized schema by safely replaying the unchanged, idempotent 0001 while establishing its normal local migration ledger. This is an important proof of method, **not permission or proof that a future remote execution will succeed**. Recheck schema, live row counts, Worker isolation, available recovery bookmark and exact migration directory immediately before any separately approved remote stage.

### Local-only Wrangler 4.152.0 migration 0002 discovery — PASSED

The owner subsequently added the unchanged canonical `0002_durable_snapshot_and_audit.sql` from immutable source commit `d58833d3f4faa093f6a78b883af89f82eafddfb0` to the same synthetic local migration directory alongside `0001_initial.sql`, with no 0003 file. Guard checks confirmed the synthetic `LOCAL_P3` binding and exactly these two migration filenames.

The owner ran `npx.cmd --yes wrangler@4.152.0 d1 migrations list LOCAL_P3 --local --persist-to $state --config $cfg`. Wrangler printed **`Resource location: local`** and exactly **one pending migration: `0002_durable_snapshot_and_audit.sql`**. This confirms local ordered pending-file discovery and that 0001 remains recorded.

### Local-only Wrangler 4.152.0 migration 0002 apply and verification — PASSED

The owner next executed `npx.cmd --yes wrangler@4.152.0 d1 migrations apply LOCAL_P3 --local --persist-to $state --config $cfg` using the same isolated synthetic local database. Wrangler displayed **only `0002_durable_snapshot_and_audit.sql`**, received interactive confirmation and reported **5 commands executed successfully** with migration status success. All operator commands explicitly used `--local` and the verified temporary persistence directory.

Post-apply owner-executed **local-only** read results:

- `SELECT name FROM d1_migrations ORDER BY id`: exactly `0001_initial.sql`, then `0002_durable_snapshot_and_audit.sql`.
- `SELECT type,name FROM sqlite_master WHERE name LIKE 'p3_%' ORDER BY type,name`: exactly **4 P3 tables**, **3 P3 indexes**, and **3 P3 triggers**, with expected names: new `p3_requests`, `p3_operation_accepted_audit`, `p3_operation_transition_audit`, and `p3_operation_transition_guard`, alongside the original six objects.
- `PRAGMA foreign_key_check` returned **zero rows**, `success:true`.
- `d1 migrations list --local --persist-to` returned **`No migrations to apply!`**.

The reconciliation and additive 0002 sequence therefore passed a **real local Wrangler migration tool rehearsal**. This does not prove cloud/remote migration success, migration-backup durability, trigger semantics in hosted Cloudflare D1, or permission to mutate the remote database. Full `sqlite_master.sql` definition comparisons were not separately rerun locally after applying 0002; the source-based SQLite tests cover structural/trigger expectations independently.

### Local-only Wrangler 4.152.0 migration 0003 discovery — PASSED

The owner added the unchanged canonical `0003_ci_observation_recovery.sql` from immutable source commit `d58833d3f4faa093f6a78b883af89f82eafddfb0` to the same synthetic local rehearsal migration directory. Guard checks verified the exact synthetic `LOCAL_P3` binding and exactly three canonical migration filenames: `0001_initial.sql`, `0002_durable_snapshot_and_audit.sql`, and `0003_ci_observation_recovery.sql`.

The owner executed `npx.cmd --yes wrangler@4.152.0 d1 migrations list LOCAL_P3 --local --persist-to $state --config $cfg` and Wrangler reported **`Resource location: local`** with **only `0003_ci_observation_recovery.sql` pending**. This independently confirms ordered pending-file discovery, with 0001 and 0002 tracked as applied.

### Local-only Wrangler 4.152.0 migration 0003 apply and verification — PASSED

The owner performed the final interactive **local-only** `d1 migrations apply LOCAL_P3 --local --persist-to $state --config $cfg` on the same synthetic database and temporary state directory. Wrangler displayed **only `0003_ci_observation_recovery.sql`**, received confirmation and executed **5 commands successfully** with successful migration status.

Owner-run follow-up queries on the same synthetic local D1 returned:

- `SELECT name FROM d1_migrations ORDER BY id`: **exactly three filenames, in order:** `0001_initial.sql`, `0002_durable_snapshot_and_audit.sql`, `0003_ci_observation_recovery.sql`.
- `SELECT type,name FROM sqlite_master WHERE name LIKE 'p3_%' ORDER BY type,name`: **six named P3 tables, three indexes and five triggers**, including the two 0003 tables (`p3_ci_observations`, `p3_ci_observation_audit`) and two 0003 triggers (`p3_ci_observation_insert_audit`, `p3_ci_observation_update_audit`). Existing 0001 and 0002 objects remain present.
- `PRAGMA foreign_key_check`: **empty result set**.
- `d1 migrations list LOCAL_P3 --local --persist-to`: **No migrations to apply**.

**Disposition: P3-17 local actual-Wrangler migration rehearsal COMPLETE.** Wrangler 4.152.0 successfully reproduced the manually installed 0001 plus missing migration-history condition, reconciled 0001 through its own ledger, and applied 0002/0003 in separately inspected local stages. Independent source-level SQLite tests also passed. **Remote Cloudflare D1 is still unchanged**: it retains manually installed 0001 with *no* `d1_migrations` ledger, and no 0002 or 0003 objects. The local result is not blanket authorization to mutate Cloudflare. A separate remote sandbox approval package, targeted account/configuration check, fresh read-only preflight, recovery review, and individual migration stage approval are still required.

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

**Next recommended check:** the entire `0001`/`0002`/`0003` actual Wrangler **local** rehearsal is now complete and verified. Review the separate P3-18 remote-sandbox approval proposal; **no remote D1 migration is approved**. Chat mode is sufficient.
