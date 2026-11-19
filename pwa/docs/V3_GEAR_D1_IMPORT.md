# V3 — complete Gear D1 migration (prepared, not authorized for execution)

**Status:** source-only preparation under ADR-0011, FISH-TODO-118, draft PR #567. The successful private pilot remains live. This document is **not permission** to run a bulk D1 import, merge, or publish V3.

## Source scope and safety

- Exact frozen V2 Gear source: `pwa/Gear/gear.json`, Git blob `741ba8f19c06834eb6e92fea84404fdb2ac58f88`. The candidate branch Gear catalog matches `main`; neither is edited.
- **100 Gear records**, eight categories, **63 linked Notes** Markdown files, **100 record pictures**, **112 Gear image files** in total. Eight of the images are embedded alongside Equipment Notes in `Gear/Equipment/content/`; the rest reside in assets folders.
- The 99 records not yet migrated are prepared as insert-only rows. The previously owner-tested `daiwa-tatula-xt-rod` is intentionally omitted from the import; its stored revision must remain at least 3, preserving the restored `Tatula XT` Model.
- All record IDs and original Notes text are retained. Old Gear image and Notes image URLs remain existing immutable files in the app release. **No new R2 bucket or image uploading** is needed for this one-time import. New images uploaded during future editing are not covered by this checkpoint.
- Nothing here modifies public V2, KB, Catches, OAuth, or existing provider resources.

## Prepare locally — no Cloudflare writes

From the exact reviewed PR commit, in `pwa` with Node 24 and `npm ci` completed:

```powershell
$Out = Join-Path $HOME 'Documents\Fishing-V3-Gear-Import'
New-Item -ItemType Directory -Path $Out -Force | Out-Null
node.exe tools/d6-gear-migration.mjs --out $Out
```

The generator **fails closed** on an unexpected Gear source SHA, counts, missing Notes/images, invalid Gear schema, or duplicate IDs. It creates exactly two new local files:

- `gear-import.sql`: 99 `INSERT ... ON CONFLICT(id) DO NOTHING` statements; never replaces the pilot row and never updates existing Gear content
- `gear-integrity.json`: source SHA, 100 IDs, record/Notes hashes and 112 image hashes; no secrets

The generator refuses to overwrite either existing local output file. Review the files before the separately authorized import. The integrity report is a local verification artifact, not an additional content datastore.

## Mandatory pre-import provider gate — separate owner approval

1. Confirm Cloudflare target is the **existing isolated** D1 `fishing-v3-wp3-operations-test` ID `5a47841e-7874-4ec8-9fa8-be0315f6a802`. Check that `d6_gear_records` still has **one** row, the pilot ID, with restored Model `Tatula XT` and revision at least 3. If counts or data differ, stop and investigate; do not force the source snapshot over newer D1 edits.
2. **Export the entire D1 database** to an operator-controlled local folder before the import. Cloudflare documents `wrangler d1 export <database> --remote --output=<file>` for an SQL backup. Confirm nonzero file size, record its SHA-256, and ensure the file includes all previously existing D1 operations tables as well as Gear. Keep the backup outside the repo and do not upload private record data to GitHub or chat.
3. Confirm the local source generator and tests passed at the exact PR head. Review the 99 inserts, selected Notes/media hashes, and the intended target.
4. Obtain explicit owner authorization for the **99-row** database write before running `wrangler d1 execute --remote --file`. Do not rerun a command with an ambiguous result: first query the database and reconcile exact row IDs.

Cloudflare D1 export/import reference: https://developers.cloudflare.com/d1/best-practices/import-export-data/

## Post-import read-only reconciliation

1. Require 100 rows; 63 nonempty `notes_text` values; 100 IDs matching the frozen source; pilot revision unchanged. A partial catalog returns `503 GEAR_MIGRATION_INCOMPLETE` and cannot masquerade as a complete V3 library.
2. After a **separately approved private Worker code deployment**, the new anonymous `GET /api/v3/content/gear` endpoint reads all 100 validated D1 records. The existing per-record GET and authenticated conditional Save remain unchanged.
3. Run the read-only verifier with the local integrity report:

```powershell
node.exe tools/d6-gear-reconcile.mjs --report "$Out\gear-integrity.json" --out "$Out\gear-reconciliation.json"
```

The verifier checks the hosted release identity and hashes for **all 112 image assets**, enumerates 100 D1 IDs, reads every Gear record, and compares JSON and Notes to the frozen source for all **99 new rows**. The pilot is checked for its preserved revision and restored Model, not overwritten from source. Success is reported only after all checks pass.

4. In Edge, verify category counts and search, a sample of images (including an Equipment Notes inline image), Notes links, and another authenticated Save → reload with revision increment. Repeat on Android before final release. **No public cutover is included.**
5. Offline library remains read-only. Full synchronization of future D1 edits into the separately prepared offline snapshot needs its own acceptance before V3 release; do not claim that online D1 writes automatically update an older offline snapshot.

## Recovery

If the import or reconciliation fails, stop. Do **not** blindly repeat it, delete or overwrite the pilot record, or switch public routes. The operator retains the verified SQL export and Cloudflare D1 recovery options; any restore needs a separate explicit decision because the test database also holds other tables. A successful source CI or import count is not equivalent to private owner field acceptance.
