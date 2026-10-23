# FISH118 P3-16 — Read-only Cloudflare inventory and evidence collection

**October 23, 2026 — in progress; REMOTE EVIDENCE NOT YET COLLECTED.** This is a read-only inventory stage, not permission to migrate, deploy, restore, enable publishing, or schedule CI polling. No Cloudflare tool or connected Cloudflare account is available in this Chat. The owner may execute the following read-only commands on their authenticated Windows/PowerShell workstation and share only sanitized metadata.

## Grounded source checkpoint

- Production public `ginosega/fishing` main: `4a1a8c44317b56a4d47e818db9cd2b5587a966d8`, GitHub Free ruleset #25742040 active.
- P3 feature work remains on draft PR #263; do not merge.
- Private synthetic sandbox main: `e37db3b18bd9948bf4453d7f885f868e830a9a9a`; no new sandbox PR, no merge.
- Cloudflare account and live Worker binding details are **not visible** through the connected GitHub account. Owner previously created the isolated Worker `fishing-p3-sandbox-preview` and D1 `fishing-p3-sandbox`, reportedly with `P3_WRITE_ENABLED=false`, manual schema 0001. Source migrations 0002 and 0003 have **not** been approved or applied.

## First pass: database and Worker metadata only

From a local PowerShell terminal where Wrangler is already authenticated, these commands are **GET/read-only CLI operations**. Wrangler may require installing the local CLI package in npm cache. Stop if it asks to deploy, create a D1 database, apply migrations, or change Cloudflare configuration. Never share account identifiers, database UUIDs, environment variables, JWTs, App signing keys, API tokens, or private Wrangler configuration.

```powershell
npx --yes wrangler@4 d1 info fishing-p3-sandbox --json
npx --yes wrangler@4 deployments status --name fishing-p3-sandbox-preview --json
```

From the first output, record **only**: database `name` (must equal `fishing-p3-sandbox`), storage `version` (expected beta/new backend), approximate size, and that the D1 ID matches the **deployed Worker `DB` binding**, compared privately. From the second, record Worker name, latest deployed version/date and any deploy discrepancies, but avoid disclosing account IDs or private configuration.

## Second pass: SQLite metadata (after confirming exact isolated D1)

The following queries are **SELECT/PRAGMA only**. Use `--remote`, because Wrangler without it may inspect a disposable local database and produce misleading results. Name the exact sandbox D1, never AUTH-P0 or production.

```powershell
npx --yes wrangler@4 d1 execute fishing-p3-sandbox --remote --command "SELECT type,name,sql FROM sqlite_master WHERE sql IS NOT NULL AND (name LIKE 'p3_%') ORDER BY type,name;" --json
npx --yes wrangler@4 d1 execute fishing-p3-sandbox --remote --command "SELECT count(*) AS n FROM sqlite_master WHERE type='table' AND name='d1_migrations';" --json
npx --yes wrangler@4 d1 execute fishing-p3-sandbox --remote --command "PRAGMA foreign_key_check;" --json
```

**Only if the second query returns n=1:**

```powershell
npx --yes wrangler@4 d1 execute fishing-p3-sandbox --remote --command "SELECT name FROM d1_migrations ORDER BY id;" --json
```

If that table does not exist, **do not run `wrangler d1 migrations apply`**, and do not manually add a migration-history row. We need to reconcile manual 0001 against the real schema. We deliberately defer `wrangler migrations list` until the ledger's existence is known, to avoid relying on any potentially initializing behavior.

For schema verification, also compare `sqlite_master.sql`, `PRAGMA table_info` and foreign-key metadata against [0001 source](migrations/0001_initial.sql). Do not paste application-row contents, session token hashes, CSRF hashes, installed App credentials or stored request snapshots. The source-only [P3-15 audit](src/p3-schema-preflight.mjs) remains fail-closed and **never authorizes a migration**.

## Third pass: Time Travel and deployed Worker behavior

After confirming the exact sandbox D1 target:

```powershell
npx --yes wrangler@4 d1 time-travel info fishing-p3-sandbox --json
Invoke-RestMethod -Method Get -Uri 'https://fishing-p3-sandbox-preview.ginosega.workers.dev/health'
Invoke-RestMethod -Method Get -Uri 'https://fishing-p3-sandbox-preview.ginosega.workers.dev/session'
```

The Time Travel query must be read-only: **never call `time-travel restore`**. Record Time Travel support and that a nonempty recovery bookmark is available, not the bookmark string itself. Cloudflare Workers Free supports seven days of recovery. Health must remain `ready:false`, mode `preview-no-publishing`; session must remain unauthenticated/unauthorized. Cloudflare Worker binding/configuration comparison is a **local owner action**: confirm `DB` refers to the exact isolated D1 UUID and `P3_WRITE_ENABLED` remains literally `false`; avoid changing any settings.

## Mandatory stop conditions

- Wrangler is not authenticated to the expected Cloudflare account, the Worker or D1 database name differs, the D1 ID does not match the deployed Worker `DB` binding, or live `P3_WRITE_ENABLED` differs from `false`.
- D1 version does not support Time Travel, the schema differs from expected manual 0001, 0002/0003 objects unexpectedly already exist, or migration ledger is ambiguous.
- Any command requests a deploy, remote migration apply, SQL mutation, restore, new secret, new resource or write-token elevation.
- Any health/anonymous-session endpoint unexpectedly authorizes publication.

**Never execute:** `wrangler d1 migrations apply`, `wrangler d1 execute --file` for migrations, `d1 time-travel restore`, `wrangler deploy`, `secret put`, `INSERT`, `UPDATE`, `ALTER`, `CREATE` or `DROP` during P3-16.

## Return evidence, not credentials

Request a sanitized summary containing: D1 name and version, Worker deployed identity (no UUID required), confirmation whether Worker `DB` binding matches selected D1 (yes/no), list of P3 object names/types, whether 0002/0003 objects already exist, whether `d1_migrations` exists and its **filenames only**, `PRAGMA foreign_key_check` count, Time Travel support, health/session response, and any error messages with account IDs removed. Report status remains **PENDING** until these facts are actually observed; do not imply remote verification from source tests.

## Sources

- [Official D1 Wrangler CLI reference](https://developers.cloudflare.com/d1/wrangler-commands/)
- [Official Workers deployments CLI](https://developers.cloudflare.com/workers/wrangler/commands/workers/)
- [D1 migration tracking](https://developers.cloudflare.com/d1/reference/migrations/)
- [D1 Time Travel and backups](https://developers.cloudflare.com/d1/reference/time-travel/)
- [Free-plan D1 limits](https://developers.cloudflare.com/d1/platform/limits/)

**Next gate:** review actual read-only Cloudflare evidence and report any drift. Isolated D1 migrations 0002/0003, Worker deployment and GitHub sandbox writes remain separately approval-gated. No Work mode switch is necessary.