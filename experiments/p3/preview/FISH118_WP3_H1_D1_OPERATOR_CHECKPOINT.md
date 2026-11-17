# FISH-TODO-118 / WP3 H1 — exact isolated D1 schema operator checkpoint

**Scope:** owner-approved H1 isolated **read-only** hosting; source-only generator, no Cloudflare provider mutation in this PR. Owner-created dedicated databases were reported 2026-11-14:
- `AUTH_DB` → `fishing-v3-wp3-auth-test`, D1 UUID `0d8da698-87b8-4b5e-a1e7-fe6de49e5afc`.
- `WP3_DB` → `fishing-v3-wp3-operations-test`, D1 UUID `5a47841e-7874-4ec8-9fa8-be0315f6a802`.

These D1 UUIDs are configuration metadata only. The owner has **not yet provided** the WP3 Pages project creation receipt or the empty-database `sqlite_master` output. **Neither can be inferred** from these database creation receipts. The existing WP2 and D5 D1 IDs are separate and forbidden targets. The H1 Worker remains read-only; it cannot be switched to a writer through environment changes alone.

## A. Preflight before running any D1 schema changes (read-only)

From the same authenticated Wrangler account, verify the proposed dedicated Pages name and inspect the *named* new databases:

```powershell
npx wrangler pages project list
npx wrangler d1 execute fishing-v3-wp3-auth-test --remote --command="SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;"
npx wrangler d1 execute fishing-v3-wp3-operations-test --remote --command="SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;"
```

Confirm the Pages project name exactly `fishing-v3-wp3-test`. If missing, create with the **separately approved H1** step `npx wrangler pages project create fishing-v3-wp3-test --production-branch main` and verify it appears; do not create another project with a substituted name. **Do not apply SQL if either dedicated database shows an unexpected existing table**. A nonempty schema is an investigation/stop condition, not an automatic migration target.

## B. Generate reviewed schema files from the WP3 source (source-only)

Use an *exact GitHub branch/commit* for this source-only generator, and a fresh folder outside the repository. Run after the new PR's required exact-head checks pass.

```powershell
git clone --single-branch --branch feature/fish118-wp3-h1-d1-schema https://github.com/ginosega/fishing.git "$HOME\fishing-wp3-h1-schema"
Set-Location "$HOME\fishing-wp3-h1-schema"
npm ci --prefix pwa --no-audit --no-fund
$SourceSHA = (git rev-parse HEAD).Trim()
node pwa/tools/prepare-d6-wp3-h1-migrations.mjs --out="$HOME\fishing-wp3-h1-sql" --source-revision=$SourceSHA
Get-Content "$HOME\fishing-wp3-h1-sql\manifest.json"
```

The generator refuses an existing output directory. On a rerun, choose a *new* unused folder; never delete or overwrite the earlier proof. It creates only `auth.sql`, `operations.sql` and a SHA256 manifest. The AUTH schema is the accepted historical AUTH-P0 table contract (2 tables and 2 expiry indexes); the 10 operations table definitions come **directly** from `D6_WP3_D1_SCHEMA_PLAN` and retain both receipt uniqueness safeguards. No handwritten second operations schema exists. The manifest says `executed:false` and `canPublish:false`; don't interpret preparation as schema readiness or hosted deployment. The recorded generator source SHA may differ from #505's already verified Pages artifact PR test-merge source SHA.

## C. Execute only after preflight shows the two intended empty databases

These two commands actually *mutate the two new, explicitly H1-approved D1 databases*. The owner runs them only after verifying the target database names and the exact generated SQL manifest; no existing WP2/D5/production D1 is touched:

```powershell
npx wrangler d1 execute fishing-v3-wp3-auth-test --remote --file="$HOME\fishing-wp3-h1-sql\auth.sql"
npx wrangler d1 execute fishing-v3-wp3-operations-test --remote --file="$HOME\fishing-wp3-h1-sql\operations.sql"
```

Read-only postflight probes:

```powershell
npx wrangler d1 execute fishing-v3-wp3-auth-test --remote --command="SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;"
npx wrangler d1 execute fishing-v3-wp3-operations-test --remote --command="SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;"
npx wrangler d1 execute fishing-v3-wp3-operations-test --remote --command="PRAGMA index_list('d6_operation_receipts');"
```

Expected: `auth_flows`, `sessions` (and SQLite's system-managed tables excluded); ten `d6_...` operations tables; unique owner+idempotency key and partial `d6_operation_active_record` indexes on receipts. A full read-only `createD6Wp3D1Readiness.inspect` must be run on the bound Worker test database later, before H2 write enablement; table count alone is insufficient. Record Wrangler output, database UUIDs, source SHA, SQL digests, schema/PRAGMA proof, and owner approval in the WP3 hosted receipt. Do not store secrets or session tokens.

## D. Gate / boundaries

**H1 only:** after source CI and verified schema, proceed with dedicated read-only Pages and Worker upload, exact `AUTH_DB`/`WP3_DB` bindings, OAuth callback, least-privilege App **contents:read** only, default-OFF writer flags and denial tests, with separate hosted byte proof and owner Edge login. No `contents:write`, `pull_requests:write`, real provider branch/PR mutation, public `main` merge, or Live. Any unverified Pages resource, unrelated D1 content, schema mismatch, missing index, incorrectly pinned origin, stale CI head, or unexpected credential scope is an immediate stop.
