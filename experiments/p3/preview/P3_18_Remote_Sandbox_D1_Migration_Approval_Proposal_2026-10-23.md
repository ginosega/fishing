# FISH118 P3-18 — Remote isolated D1 migration approval and gated execution plan (R1 ONLY)

**October 23, 2026. Status: R1 ONLY CONDITIONALLY APPROVED by the owner in this chat; remote preflight and execution not yet performed.** The owner's immediate `proceed` responded to an explicit invitation to approve **R1 only** after reviewing this proposal. Approval covers only verified application of **unchanged `0001_initial.sql`** to the isolated `fishing-p3-sandbox` D1, by Wrangler's native migration mechanism, **after fresh preflight/target/bookmark verification and a one-file interactive preview**. It does not authorize R2, R3, remote restores, deploys, merges, GitHub write operations, or publishing activation.


## R1 conditional approval checkpoint — October 23, 2026

- Owner responded **`proceed`** immediately after the assistant explicitly requested approval for **R1 only**. Interpret narrowly as R1 approval, with all conditions in this document still binding.
- **No remote SQL migration, ledger creation, D1 restore, Worker deploy, or publishing activation has occurred.** The next owner-run commands will prepare a restricted remote-only config and perform *read-only* R1 preflight. Do not run migration apply until those results have been reviewed and the live single-file target/prompt is verified.
- Recheck the exact named isolated database's UUID against the earlier privately retained owner-verified configuration; verify remote 0001 schema (six objects and full definitions), missing Wrangler ledger, all three empty application tables, FK integrity and disabled hosted Worker. A new private Time Travel bookmark is required immediately before any remote mutation.
- When the approved R1 is eventually applied, Wrangler may create its **own** `d1_migrations` table and record `0001_initial.sql`; it may **not** make 0002/0003 available in the restricted folder. Any discrepancy cancels the R1 authorization until reviewed.

## R1 owner-executed preparation attempt — BLOCKED (no remote mutation)

The owner opened a fresh Windows PowerShell session and began the private R1 preflight script. Wrangler 4.152.0 `d1 list --json` returned **Cloudflare API authentication code 10000** when requesting the D1 database list, despite previous successful `whoami` OAuth permission and database queries. This is an **unresolved D1 API authentication/access failure**, not proof that the database or its SQL schema changed.

The script then continued interactively after thrown exceptions: JSON parsing of failed list output failed, `$db` could not be verified, and the new config was written using an **unverified/null database UUID**. The local rehearsal `$root` variable was absent in the new PowerShell session, so the hash comparison against the previously verified local file **never ran**. The script's final `Write-Host` messages were unconditional and incorrectly printed success; **they must not be treated as valid verification**.

Result: a canonical 0001 SQL file was downloaded into a new temporary local directory, but the private R1 configuration and source-hash evidence are **invalid**. There was **no remote SQL, migration apply, D1 ledger initialization, restore, Worker deployment or publishing activation**. **R1 is STOPPED. Do not reuse `$r1Cfg` from this attempt or run any `--remote` migration.**

Remediation: diagnose intermittent D1 API code 10000 without exposing tokens, verify Wrangler credential *source* and account identity, and independently reestablish the exact D1 UUID/config. Reconstruct the local rehearsal path from trusted evidence or use a pinned canonical-file SHA-256; do not rely on a stale `$root` PowerShell variable. Replace line-by-line unsafe script fragments with **a single terminating `try { ... } catch { ... }` guarded preparation procedure** that cannot display a success message after errors. R1's owner approval is conditional, **not an instruction to bypass failed preflight**.
### Follow-up OAuth and D1 inventory retry — successful, R1 still pending

Owner's new PowerShell diagnostic printed **no environment-variable names matching `CLOUDFLARE_*` or `CF_API_*`**; `wrangler@4.152.0 whoami` confirmed the same OAuth account and `d1 (write)` scope. A repeat of `d1 list --json` **succeeded**, returning the expected two D1 databases; the named sandbox's UUID matched the previously checked identity and its version was `production`. Earlier D1 API error `10000` was therefore intermittent in observed calls, **not proven permanently resolved**. No DB mutation occurred.

**Still blocked until fresh preparation:** old `$r1Cfg` created during the failed step is untrusted and **must not be used**. The next R1 preparation is a single fail-closed script rechecking the previously verified private `fishing-p3-inspection.json`, live D1 UUID, and a sha256 comparison of the newly staged immutable 0001 against the actual successful local rehearsal file at the previously observed temporary directory. It publishes a new private `$r1Cfg` variable **only upon full success** and performs no remote SQL write. A fresh read-only remote schema/ledger/row-count/FK check, Worker flag/binding checks, and fresh private Time Travel bookmark follow before the approved R1 migration can be performed. R2/R3 not approved.
### Confirmed Windows PowerShell JSON-shape parsing defect — identity checks PASSED

A fresh owner-run diagnostic in the same PowerShell session corrected the previous code's nested-array handling by using `ConvertFrom-Json -InputObject ($raw -join "`n")` with the direct pipeline to `Where-Object`. It returned **DatabasesParsed = 2**, **SandboxMatches = 1**, **IdentityMatches = True**, **StorageVersionMatches = True**. This rules out an actual D1 UUID mismatch in the latest owner-supplied inventory: the earlier script comparison failed due to incorrect PowerShell array wrapping.

**Next preparation:** replace the flawed construction with a guarded single-block script; recover the approved local reference file by its recorded isolated temp directory, hash-match unchanged canonical 0001, and stage **only 0001** in a **new** private config with verified UUID/binding. The old failed config must not be reused. Do not run migration until fresh remote read-only schema/row/ledger/FK preflight and a current private Time Travel bookmark are verified. **R1 is approved conditionally but NOT executed; R2/R3 remain unapproved.**
### Owner-confirmed guarded R1 configuration preparation — PASSED

The owner executed the corrected, single guarded Windows PowerShell block and reported all four success lines: `PASS: D1 identity verified.`, `PASS: Canonical 0001 SHA-256 verified.`, `PASS: Exactly one migration file staged.`, and `PASS: R1 configuration ready for read-only preflight.`, followed by `No remote database changes performed.`

This confirms the owner-side remote target UUID/name/storage identity check against the previously verified private config, canonical 0001 byte hash against the successful disposable local rehearsal, and a fresh private directory containing exactly one migration SQL file. No D1 write or remote migration has occurred. **Next: fresh SQL/Worker read-only preflight, privately capture Time Travel recovery bookmark immediately before R1 apply, then guarded single-file migration R1 only.**

### Owner-confirmed R1 remote read-only SQL and Worker preflight — PASSED

Owner ran the fully guarded R1 **remote read-only** checks using the newly verified private `$r1Cfg` and reported:

- `PASS: Six remote 0001 schema definitions match local rehearsal.`
- `PASS: Remote Wrangler ledger absent.`
- `PASS: All three P3 tables contain zero rows.`
- `PASS: No foreign-key violations.`
- `R1 READ-ONLY PREFLIGHT PASSED.` / `No remote database modifications performed.`
- Cloudflare Dashboard re-confirmed `fishing-p3-sandbox-preview` Worker `DB` binding to the isolated `fishing-p3-sandbox` and `P3_WRITE_ENABLED` literally `false`.

**R1 stage decision:** conditionally approved previously and the remote preflight now PASSED; **R1 migration apply NOT YET RUN**. Next prerequisite: obtain a fresh private pre-change Time Travel bookmark via Wrangler `d1 time-travel info DB --config $r1Cfg --json`, confirm the file is privately retained, re-guard exact DB binding/one-file SQL hash immediately before an interactive **R1-only** `d1 migrations apply DB --remote --config $r1Cfg`, then read-only postflight. Never stage 0002/0003 before reviewing R1. R2/R3 not approved.
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
| **R1: ledger reconciliation** | Apply only unchanged idempotent `0001_initial.sql` to already-existing 0001 remote schema; Wrangler establishes/records its own `d1_migrations` entry | Original six P3 objects unchanged; ledger only 0001; three P3 row counts still zero | **Owner approved R1 only, conditional on fresh checks; NOT EXECUTED** |
| **R2: durable request/audit** | Apply only `0002_durable_snapshot_and_audit.sql` | Four P3 tables, three indexes, three triggers; ledger exactly 0001–0002 | **Separate explicit approval after verifying R1 — NOT GIVEN** |
| **R3: CI observation recovery** | Apply only `0003_ci_observation_recovery.sql` | Six P3 tables, three indexes, five triggers; ledger exactly 0001–0003 | **Separate explicit approval after verifying R2 — NOT GIVEN** |

**Never execute a normal remote apply with all three migrations initially discoverable.** Because `d1 migrations apply` processes pending files in order, the *temporary private* migration folder is staged as **0001 only → 0001+0002 → 0001+0002+0003**, and every stage stops for verification before adding the next. Do not run remote apply using the synthetic `LOCAL_P3` configuration.

## Private target configuration and immutable staging (R1 preflight preparation permitted)

For the conditionally approved R1 preflight, use a **new, clearly named private remote-only Wrangler config** under a temporary directory, separate from the existing synthetic local rehearsal `$cfg`. The remote config must select **only** `fishing-p3-sandbox` by its real UUID obtained from `wrangler d1 list`, with `DB` binding, migration directory set to a **private restricted folder**, and no remote `AUTH-P0` binding. Keep `P3_WRITE_ENABLED=false`; no need to deploy this config to a Worker. Double-check `Get-Content` locally without sharing IDs, and compare account/UUID privately against deployed Worker binding. The earlier unconfigured call treated the database name as an API identifier and returned authentication error 10000: **every future D1 command must use explicit `--config` and the `DB` binding.**

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

**R1 only has received conditional owner approval** in direct response to the R1 approval request. Execution **must not start** until the fresh owner-run preflight has been checked, the sole correct D1 target and pending-file preview are established, and a new pre-change Time Travel bookmark is privately retained. This approval does **not** authorize R2, R3, changing `P3_WRITE_ENABLED`, binding production, creating/deploying Worker code, using GitHub App write scopes, creating or merging a sandbox PR, enabling schedulers, or merging [draft PR #263](https://github.com/ginosega/fishing/pull/263). R2 and R3 require their own later explicit approvals after the prior-stage postflight is verified. No `Proceed` from a prior source-only stage constitutes approval for these later stages.

## References

- [P3-16 owner-executed read-only inventory](P3_16_Read_Only_Cloudflare_Inventory_2026-10-23.md)
- [P3-17 actual Wrangler local rehearsal](P3_17_Wrangler_Migration_History_Reconciliation_2026-10-23.md)
- [Cloudflare D1 migrations and ledger](https://developers.cloudflare.com/d1/reference/migrations/)
- [Cloudflare D1 Wrangler commands](https://developers.cloudflare.com/d1/wrangler-commands/)
- [Cloudflare D1 Time Travel and backups](https://developers.cloudflare.com/d1/reference/time-travel/)
