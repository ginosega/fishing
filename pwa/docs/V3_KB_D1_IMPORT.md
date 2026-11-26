# V3 Knowledge Base — direct D1 migration and acceptance (source only)

**FISH-TODO-118 / ADR-0011.** This is a proposed procedure, **not approval**
for a D1 schema or data write, private deployment, PR merge or V3 cutover.
Gear has already passed private owner acceptance. Reuse the **same** existing
private Worker, isolated D1, OAuth, Notes editor, links and immutable images.
Do not revive the old GitHub per-edit publisher/watchdog system.

## Exact original source

- Frozen `pwa/KB/kb.json`, Git blob
  `39217633803ad3969d710fa8d770197c0e83b2a3` (matches `main`)
- **60 KB entries and 60 linked Markdown documents**: 10 Locations, 8 Species,
  23 Equipment, 9 Techniques and 10 Knots
- **154 images within KB**, plus existing cross-domain Gear pictures already
  referenced by KB; **8 knot records have 111 sequence frames**
- No records, Markdown paths, knot-frame ordering, or existing Gear image URLs
  should be renamed; images remain in the immutable existing app release
- New uploaded media and Add Entry are **not** supported by this first direct-D1
  integration. They must not be portrayed as working Save actions.

## Prepare — local/source-only

On the exact reviewed PR head, after Node 24 dependencies are present, run
`node tools/d6-kb-migration.mjs --out <new-local-output-directory>` from
`pwa`. This generates only `kb-integrity.json` and `kb-import.sql`
using immutable Git blobs for JSON and Markdown, independent of Windows CRLF
checkout conversion; source images are checked against Git. It refuses
overwriting existing report/SQL files.

The SQL proposes one `CREATE TABLE IF NOT EXISTS d6_kb_records` with
`id,revision,record_json,content_text,updated_at`, plus **60 insert-only**
statements with `ON CONFLICT(id) DO NOTHING`. The SQL must not overwrite Gear
or existing KB edits. The original full-image source inventory is retained
for reconciliation; only referenced images belong in the hosted release.

## Separate owner authorization for provider writes

1. Verify exact code revision, passing fast/merge-ready CI, private Worker
   configuration, and target existing D1:
   `fishing-v3-wp3-operations-test`,
   `5a47841e-7874-4ec8-9fa8-be0315f6a802`.
2. **Read-only D1 preflight via a single-line Wrangler `--command=...`**
   confirming the Gear table still has 100 rows and that no KB table/rows
   preexist. Do not use `--file` for the read-only check: Wrangler handles
   file execution as an import and hides returned SELECT rows.
3. **Export the complete current operations-test D1 database to local SQL**
   (it includes Gear and legacy operations tables) and record size + SHA-256.
   Protect the local backup; never paste signed download URLs or backup data.
4. Review/generated SQL and report identities, and obtain **explicit owner
   approval** for the one-time KB schema + 60-row write. Execute only once.
   If an outcome is ambiguous, reconcile live rows first; never blindly retry.
5. Read-only verify exactly 60 KB IDs with schema-valid JSON and text,
   original Gear count/pilot untouched, then obtain **separate approval** to
   deploy the candidate to the **existing private Worker** with the new
   `--d6-direct-kb-save` build flag and `D6_DIRECT_KB_ENABLED=true`.
   No new resources/credentials/provider services.
6. Run the read-only
   `node tools/d6-kb-reconcile.mjs --report <kb-integrity.json> --out <new-result.json>`
   to check D1 source hashes, all 60 Markdown articles, record pictures,
   knot frames, linked media and hosted-release manifest. After PASS, the
   owner tests KB navigation, search, Markdown links/images, knots and one
   controlled Save → reload → restore in Edge and Android.

**Fail closed.** Any missing source/hosted media, partial import, disabled
flag, session/CSRF error, stale revision or unknown provider result blocks
acceptance. Preserve Gear data and published V2. The offline KB snapshot
remains read-only; current D1 edits are not automatically merged into an
older offline snapshot. Whole-app acceptance/public V3 cutover are later,
separately approved checkpoints.
