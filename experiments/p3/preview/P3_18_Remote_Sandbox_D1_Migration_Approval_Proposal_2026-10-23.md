# FISH118 P3-18 — Remote isolated D1 migrations R1, R2 and R3 COMPLETE

**October 24, 2026 — FINAL DISPOSITION: R1, R2 and R3 COMPLETED AND VERIFIED on isolated Cloudflare D1 `fishing-p3-sandbox`.** The owner-triggered R3 Github Actions migration applied canonical `0003_ci_observation_recovery.sql` once; final independent segmented read-only D1 verification proved ordered 0001+0002+0003 ledger, 14 exact canonical schema definitions (six tables, three indexes, five triggers), six empty P3 application tables, clean foreign keys and hosted preview still anonymous/disabled. Earlier failed workflows were due to postflight SQL verification errors (the precise cause of error 7500 remains unidentified), not proof the migration failed. **No reapply, restore, ledger edit, Worker deploy, sandbox publishing, P3_WRITE_ENABLED activation, experimental PR merge or production cutover is authorized.** The private sandbox GitHub Actions workflow remains read-only. Previous R1/R2/R3 gate text below is historical, superseded by this final closeout.



## R3 remote sandbox migration — FINAL CLOSEOUT (October 24, 2026)

**R3 COMPLETE / VERIFIED.** The owner separately authorized exactly the canonical `0003_ci_observation_recovery.sql` for isolated remote `fishing-p3-sandbox`. Work switched from locally run PowerShell scripts to a manual-only GitHub Actions workflow in the private `ginosega/fishing-p3-sandbox` repository.

**Preflight:** [run #40116451442](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40116451442) completed successfully: Cloudflare API/Wrangler D1 UUID, name and backend matched; immutable 0001/0002/0003 SQL hashes matched; pre-R3 migration ledger exactly 0001+0002; 10 canonical schema objects, four empty tables, clean foreign keys; anonymous/disabled preview Worker; only 0003 pending.

**One remote migration:** [owner-dispatched R3 apply run #40116809827](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40116809827) repeated and passed all safeguards, saved a fresh private pre-R3 D1 Time Travel bookmark as an Actions artifact before any write, and invoked Wrangler 4.152.0 to apply only 0003 on the verified isolated remote D1. **Wrangler returned exit success.** Its postflight failed on the first subsequent read-only D1 query, so the *run as a whole* was marked failed; that did not justify reapplying the migration. No retry, restore, manual SQL edit, GitHub publishing write or Worker deployment occurred.

**Verification incident:** Read-only [postflight run #40117755726](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40117755726) failed at the first aggregate schema query. Read-only [diagnostic run #40118647640](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40118647640) proved Wrangler `SELECT 1` and Cloudflare D1 API `SELECT 1` both worked, while the aggregate schema query returned HTTP 400 / Cloudflare code 7500. The exact underlying cause remains undetermined. Security/incident PRs #3–#5 changed the sandbox workflow to **read-only only**, adding separately verified segmented schema queries and preventing repeat migration dispatch.

**Conclusive independent verification:** [GitHub Actions run #40122355363](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40122355363) on private sandbox main `c9a0598678e2568ec7cd92c40cb9540c3e85021c`, manual mode `diagnose`, finished **completed/success**. Actual logs confirm:

- **13 guard unit tests passed**, exact Cloudflare/Wrangler D1 identity, original immutable three SQL files.
- Wrangler and native D1 API `SELECT 1` passed; hosted preview Worker disabled and anonymous.
- `PASS: migration ledger` with exactly ordered **0001_initial.sql, 0002_durable_snapshot_and_audit.sql, 0003_ci_observation_recovery.sql**.
- `PASS: schema object names/types` and **14 separate exact definition checks** matching all **six tables, three indexes and five triggers**.
- Six separate `PASS: empty P3 table` checks: `p3_sessions`, `p3_operations`, `p3_events`, `p3_requests`, `p3_ci_observations`, `p3_ci_observation_audit`.
- `PASS: foreign-key integrity`, final `R3 REMOTE SANDBOX MIGRATION VERIFIED by segmented Cloudflare D1 READ-ONLY queries` statement.

**Scope and recovery controls:** P3-18 isolated R1/R2/R3 migration work is complete, **not** the publisher implementation. Keep the sandbox Actions workflow in read-only diagnostic mode, with no R3 apply/restore/Worker deployment route. The pre-R3 Time Travel bookmark exists only in the private run #40116809827's artifact, subject to **seven-day retention**; never expose it in public PR/chat or restore unnecessarily. Public production `ginosega/fishing` main and sandbox synthetic content PR #1 were not modified by this migration, while experimental P1 AUTH-P0 PR #262 and P3 PR #263 remain draft and unmerged. Further P3 write permission, sandbox Worker service deployment, publishing activation, merge and production v3 cutover require their own authorization.

## R3 owner authorization — October 24, 2026 (historical pre-execution checkpoint)

**Separate stage approval received:** After the completed R2 closeout, the assistant asked, “Would you like to authorize R3?” The owner replied **“yes.”** This is a narrowly scoped approval for **only unchanged `0003_ci_observation_recovery.sql`** on the already-approved isolated Cloudflare Free D1 `fishing-p3-sandbox`, with preserved safety controls. The approval does **not** authorize any other SQL, recovery restore, Worker deployment, `P3_WRITE_ENABLED` change, GitHub write/merge, PR merge, production changes, or v3 cutover.

**Required fresh preflight:** using a temporary private Wrangler configuration, independently compare the named sandbox D1 in live Wrangler inventory with its Cloudflare Dashboard UUID/storage backend and the deployed disabled Worker's `DB` binding. Download the immutable canonical 0001+0002+0003 from pinned reviewed GitHub source and byte-verify SHA-256 (0003 Git blob `9c48d41f181b1adf55ee8ea4ec50f96c517921cc`; SHA-256 `a5afb9122cac8557dbac438754fe49833db31a8c5678e6c1ca2f4c959a36d562`). Preflight must show exactly **10 existing P3 schema definitions** (4 tables / 3 indexes / 3 triggers), **ledger 0001 then 0002 and nothing else**, all four P3 tables empty, no foreign-key violations, anonymous and disabled hosted Worker. The private migration directory must contain **exactly canonical 0001+0002+0003**, and both preview checks must show **only `0003_ci_observation_recovery.sql` pending**.

**Recovery and interactive gate:** save a **fresh pre-R3 D1 Time Travel bookmark privately**; never publish its value or Cloudflare account/DB configuration. Wrangler's interactive remote prompt must show exactly 0003 against the verified isolated `DB` resource before user confirmation. On unexpected target/file, STOP/CANCEL. Afterward, require the exact 0001/0002/0003 ledger, **14 P3 schema objects** (6 tables / 3 indexes / 5 triggers), zero unexpected application data, FK clean and still-disabled/anonymous Worker. Do not automatically retry, reapply SQL, manually edit migrations ledger, or restore after a partial/unclear failure; review evidence first.

**Historical pre-execution checkpoint (superseded above):** A PowerShell script had been prepared, but remote R3 execution was instead performed through the private GitHub Actions workflow. Successful read-only verification followed. No R3 migration remains pending. Keep [PR #263](https://github.com/ginosega/fishing/pull/263) draft/unmerged.

## R2 authorization record — October 24, 2026 (no remote execution yet)

After the completed R1 closeout and new-chat project reconciliation, the owner explicitly said **“Thank you. Let's proceed with R2.”** This is the separate R2-stage authorization required by the P3-18 plan, **not** an additional R3 or publisher permission. The GitHub draft [PR #263 discussion](https://github.com/ginosega/fishing/pull/263#issuecomment-6386366100) records the exact scope.

For R2 only, use verified unchanged canonical 0001+0002 from this branch, a **fresh** isolated D1 UUID/backend and Wrangler ledger/complete six-object schema check, three zero row counts, no foreign-key violations, disabled sandbox Worker binding/flag and anonymous hosted health/session, **new private pre-R2 Time Travel bookmark**, and a restricted migration directory listing **0002 alone as pending**. Preserve Wrangler's native interactive prompt; approve only a target showing `fishing-p3-sandbox` and **0002 alone**. Read-only postflight must show ledger 0001+0002, four P3 tables/three indexes/three triggers with canonical definitions, zero unexpected application rows, clean FK and still-disabled Worker. **Stop without retries, manual ledger edits or restore** on any ambiguity. No external credential/bookmark values belong in GitHub/chat.

**Execution follow-up:** The owner subsequently applied R2 and supplied a successful Wrangler CLI and postflight transcript. This paragraph records the previous authorization checkpoint; the closeout below is current. R3, deployment, GitHub write permissions/merge, `P3_WRITE_ENABLED` activation and v3 production cutover remain blocked.

## R2 remote sandbox migration — FINAL CLOSEOUT (owner-run, October 24, 2026)

**R2 COMPLETE / VERIFIED from owner-supplied execution and postflight transcript.** An earlier R2 PowerShell preflight initially stopped on a `.Count` parsing error, *before any migration*, after passing the live isolated-D1 name/dashboard/inventory identity, immutable 0001+0002 source SHA-256 and two-file staging, explicit remote config and six-object canonical schema checks. The script was corrected without bypassing the guardrails.

The owner subsequently ran the corrected R2 operator script and supplied this sanitized final evidence:

- Wrangler **4.152.0** displayed `Resource location: remote` and **exactly one pending migration**, `0002_durable_snapshot_and_audit.sql`; the owner explicitly accepted Wrangler's interactive prompt to apply one migration to the previously verified isolated `DB` binding.
- Wrangler reported **5 SQL commands executed** (2.03 ms shown) and successful application of `0002_durable_snapshot_and_audit.sql`.
- The scripted read-only postflight printed `PASS: Exact canonical P3 schema definitions (10 objects).` These comprise **four P3 tables, three indexes, three triggers** (the original six objects plus the four additions from 0002).
- `PASS: Remote Wrangler migration ledger exactly 0001_initial.sql + 0002_durable_snapshot_and_audit.sql`.
- `PASS: Expected P3 application tables all empty.` and `PASS: No foreign-key violations.`
- `PASS: Hosted preview health/session still disabled and anonymous.`
- Final script disposition: `R2 REMOTE SANDBOX MIGRATION: PASS (schema, ledger, empty data, FK and disabled Worker verified).`

**Evidence boundary:** Cloudflare migration and checks were performed on the owner's authenticated Windows/Wrangler environment; ChatGPT reviewed the supplied output and canonical code in draft PR #263 but did **not independently query Cloudflare**. No recovery-bookmark values or private database identifiers are stored in GitHub. Preserve the private recovery bookmark if created; do not initiate a restore after this successful stage.

**Historical R2 next gate (superseded above): R3 not yet authorized at that checkpoint.** `0003_ci_observation_recovery.sql` adds two CI observation/audit tables plus two triggers. It requires a **separate owner approval**; fresh isolated-target/config and unchanged-source checks; prior 0001+0002 ledger, ten schema definitions, empty application rows, FK-clean and disabled hosted Worker proof; a fresh private Time Travel bookmark; and a restricted migration directory containing exactly 0001+0002+0003, with **only 0003 pending**. If separately authorized and executed, verify six tables/three indexes/five triggers and ordered ledger 0001+0002+0003. **Do not apply R3, deploy a Worker, enable publishing, write to or merge GitHub repositories, or cut over v3 without their respective additional approvals.**

## R1 remote migration final disposition — COMPLETE (owner-executed and verified)

The owner supplied the missing remote Wrangler 4.152.0 execution transcript and recovery confirmation after the passing read-only postflight. This **closes R1**; there is no outstanding R1 operational check.

- Prior to the mutation, the guarded R1 script returned `PASS: Final R1 state and migration source verified.` and `PASS: Fresh recovery bookmark saved privately.` The owner confirmed that bookmark exists **without sharing its value**.
- Wrangler reported **`Resource location: remote`**, targeting only the previously validated isolated `DB` binding for `fishing-p3-sandbox`; its interactive migration preview contained **exactly `0001_initial.sql`**, and the owner approved the prompt.
- Wrangler reported **`Executed 7 commands in 0.98ms`**, displayed `0001_initial.sql` with **success**, and the calling script printed `R1 command completed. Post-migration verification required.`
- Subsequent remote read-only queries verified the ledger now contains **exactly one applied migration, `0001_initial.sql`**, the original **three P3 tables and three indexes** retain expected definitions, all **three P3 tables remain empty**, and `PRAGMA foreign_key_check` returned no rows. D1 query metadata reported `changed_db:false`, `rows_written:0` for all the verification queries.
- The owner also confirmed anonymous hosted `GET /health` returned **`ok:true`, `ready:false`, `mode:preview-no-publishing`**, and `GET /session` returned **`authenticated:false`, `authorized:false`**.

**Conclusion:** the first isolated **remote** migration stage **R1 is COMPLETED**. The existing source-matched 0001 schema was reconciled under Wrangler's migration history, with no application data loss and no publisher activation. No restore was performed; the recovery bookmark must remain private. This result does **not** approve R2 or R3, deployment, enablement of publishing, or PR merge.

## R2 review gate — COMPLETE (historical preflight requirements)

Before requesting authorization to apply `0002_durable_snapshot_and_audit.sql` remotely, review the additive changes: one new `p3_requests` table and exactly three triggers (`p3_operation_accepted_audit`, `p3_operation_transition_guard`, `p3_operation_transition_audit`), with no app deployment or writes to GitHub. R2 must **not** introduce `0003` into the restricted migration folder until after separately approved R2 is verified.

If R2 is later explicitly approved, conduct a **new** isolated-target/config and SHA-256 check against immutable canonical 0002, confirm current Wrangler history exactly 0001, compare all six existing P3 schema definitions, verify all three tables still empty and FK clean, check the Worker remains bound to the sandbox with `P3_WRITE_ENABLED=false` plus anonymous health/session, and record a new private pre-R2 Time Travel bookmark. Restricted migration directory must contain **exactly 0001 and 0002**. Before any remote write, Wrangler's pending preview must list **only 0002**. Stop on any drift or unexpected prompt. Postflight must show ledger `0001, 0002`, **4 P3 tables, 3 indexes, 3 triggers**, zero unexpected rows and FK violations, and still-disabled publishing. R3 will require a new, independent approval after R2 passes.
## R1 remote postflight — initial query checkpoint (prior to final CLI confirmation)

The owner ran **four read-only remote queries** using Wrangler v4.152.0 against the approved `DB` binding in the isolated Cloudflare D1 **after** the R1-only apply instructions had been provided. The queries returned:

- `SELECT name FROM d1_migrations ORDER BY id`: **exactly one row, `0001_initial.sql`**, `success:true`, `changed_db:false`, `rows_written:0`.
- `sqlite_master` P3 definitions: exactly the **three original P3 tables and three original indexes**, with expected column definitions, index definitions, table constraints, names and no 0002/0003 tables/triggers. The definitions provided are consistent with the reviewed canonical 0001 SQL; this is an evidence review of the returned SQL, not a new automated full-definition comparison.
- `SELECT` P3 table counts: **sessions 0, operations 0, events 0**.
- `PRAGMA foreign_key_check`: **no violations**, `success:true`.
- Remote D1 reported `size_after:61440`, up from 53248 in the prior preflight, consistent with a new Wrangler ledger. The postflight SELECTs themselves wrote **zero rows**.

**R1 database-state result at this checkpoint: PASS.** The missing CLI output and bookmark confirmation were subsequently supplied by the owner and verified as recorded in the **R1 final disposition** above.

**Checkpoint resolved:** the user subsequently supplied successful Wrangler output, bookmark confirmation, and disabled hosted `/health` and `/session` results. **R2 and R3 remain unapproved.** Do not rerun 0001 or perform a restore.
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
| **R1: ledger reconciliation** | Apply only unchanged idempotent `0001_initial.sql` to already-existing 0001 remote schema; Wrangler establishes/records its own `d1_migrations` entry | Original six P3 objects unchanged; ledger only 0001; three P3 row counts still zero | **COMPLETE — owner-executed, bookmark retained privately, postflight passed** |
| **R2: durable request/audit** | Apply only `0002_durable_snapshot_and_audit.sql` | Four P3 tables, three indexes, three triggers; ledger exactly 0001–0002 | **COMPLETE October 24 — owner-executed, postflight PASS** |
| **R3: CI observation recovery** | Apply only `0003_ci_observation_recovery.sql` | Six P3 tables, three indexes, five triggers; ledger exactly 0001–0003 | **OWNER APPROVED October 24, guarded remote execution/postflight PENDING** |

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

**R1 is completed**, with the approved isolated remote migration, confirmed private pre-change bookmark, matching schema and empty data, clean foreign-key checks, and deny-by-default hosted responses. **No authorization exists for R2 or R3**, changing `P3_WRITE_ENABLED`, binding production, creating/deploying Worker code, using GitHub App write scopes, creating or merging a sandbox PR, enabling schedulers, or merging [draft PR #263](https://github.com/ginosega/fishing/pull/263). R2 and R3 each require a separate explicit approval after prior-stage verification. No earlier `Proceed` constitutes approval for these later stages.

## References

- [P3-16 owner-executed read-only inventory](P3_16_Read_Only_Cloudflare_Inventory_2026-10-23.md)
- [P3-17 actual Wrangler local rehearsal](P3_17_Wrangler_Migration_History_Reconciliation_2026-10-23.md)
- [Cloudflare D1 migrations and ledger](https://developers.cloudflare.com/d1/reference/migrations/)
- [Cloudflare D1 Wrangler commands](https://developers.cloudflare.com/d1/wrangler-commands/)
- [Cloudflare D1 Time Travel and backups](https://developers.cloudflare.com/d1/reference/time-travel/)
