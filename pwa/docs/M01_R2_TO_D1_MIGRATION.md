# M01 — Historical media R2 copy and proposed D1 metadata

## Verified owner-run R2 copy (2026-11-21)

- Pinned original source: `57f35b701b10cda1eb7d567b6f2a250c7b27ef38`.
- Owner-run and verified: **274 logical paths**, **272 unique content SHA-256 objects**, **166,411,118 original path bytes**, **nine unreferenced original images retained**, **111 original Knot steps**.
- Private bucket `fishing-v3-owner-media-test` received 272 new objects and each object passed local SHA-256 and R2 readback verification.
- Key format remains `staged/v1/sha256/<sha256>`, with MIME and SHA-256 custom metadata expected by the existing private reader.
- No D1 changes, Worker bindings, routes, merges or V2 releases were authorized or performed in the R2 copy.

## Source-only D1 proposal (not yet owner-approved for writes)

The D1 media registry uses the **existing two-table design**: `d6_media_objects` stores content SHA and R2 identity; `d6_media_refs` maps original logical paths to their **individual current record owners**. The reference key `(logical_path,domain,record_id)` preserves an original image used by more than one record; the same logical path must never be associated with different bytes. Nine unreferenced originals retain their objects without fabricated record owners.

The read-only compatibility adapter recognizes original relative Markdown images and historical cover/Knot paths, using a current D1 record and Markdown image token as the authority. V3 *new* upload paths continue through the existing strict role/path validator.

Run locally from the pinned V3 source checkout:

```powershell
node tools/d6-m01-d1-media-plan.mjs --out "$HOME\M01-D1-media-plan.json" --report "$HOME\M01-original-media-inventory.json"
```

The output is a **proposal file**, not executed SQL. It has a bounded read-only D1 preflight SQL, schema SQL, insert-only object/ref batches and a postflight count query. Owner authorization and a fresh database backup are required before any actual D1 schema or metadata writes. Current Gear/KB/Catch record data and revisions must be preserved.
