# M01 — Historical media R2 + D1 owner-reported COMPLETE

## Verified owner-run R2 copy (2026-11-21)

- Pinned original source: `57f35b701b10cda1eb7d567b6f2a250c7b27ef38`.
- Owner-run and verified: **274 logical paths**, **272 unique content SHA-256 objects**, **166,411,118 original path bytes**, **nine unreferenced original images retained**, **111 original Knot steps**.
- Private bucket `fishing-v3-owner-media-test` received 272 new objects and each object passed local SHA-256 and R2 readback verification.
- Key format remains `staged/v1/sha256/<sha256>`, with MIME and SHA-256 custom metadata expected by the existing private reader.
- No D1 changes, Worker bindings, routes, merges or V2 releases were authorized or performed in the R2 copy.

## D1 media metadata (owner-approved and imported 2026-11-21 Pacific)

The D1 media registry uses the **existing two-table design**: `d6_media_objects` stores content SHA and R2 identity; `d6_media_refs` maps original logical paths to their **individual current record owners**. The reference key `(logical_path,domain,record_id)` preserves an original image used by more than one record; the same logical path must never be associated with different bytes. Nine unreferenced originals retain their objects without fabricated record owners.

The read-only compatibility adapter recognizes original relative Markdown images and historical cover/Knot paths, using a current D1 record and Markdown image token as the authority. V3 *new* upload paths continue through the existing strict role/path validator.

The original source-only plan-generation command (retained for provenance, **do not rerun after successful import**) was:

```powershell
node tools/d6-m01-d1-media-plan.mjs --out "$HOME\M01-D1-media-plan.json" --report "$HOME\M01-original-media-inventory.json"
```

The owner explicitly approved the D1 metadata writes, exported a 408,440-byte SQL backup, passed an in-memory full rehearsal, and executed the migration with single-line Wrangler commands. Owner-reported live postflight: **272 media objects, 276 owner associations, 265 distinct referenced paths, 11 shared image paths**. Gear 100 / KB 60 / Catches 12, including previously edited record revisions 5/4/3, remain unchanged. Nine unreferenced images retain R2 bytes without fabricated owner associations. The initial Windows multiline SQL invocation failed before creating tables; a read-only provider check confirmed zero tables before the corrected successful operation. [Permanent M01 owner command receipt](https://github.com/ginosega/fishing/issues/377#issuecomment-7074674340). No re-import/re-upload needed. Private Worker media bindings and deployment are **still not approved**; source image routes remain OFF in the deployed Worker.
