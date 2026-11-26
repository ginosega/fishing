# M01 — Verified historical content-image inventory (source only)

**Scope:** Original source-controlled Gear, KB and Catch photos under pwa/Gear, pwa/KB and pwa/Catches. Part of owner-approved ADR-0012 and the single FISH-TODO-118 acceptance ledger. The full historical-media migration is NOT complete.

**Pinned accepted source:** 57f35b701b10cda1eb7d567b6f2a250c7b27ef38. The independent pwa/migration/d6-historic-media-source-blobs.json ledger records each exact historical path, byte size and Git blob SHA-1. Git blob SHA-1 is not the photo SHA-256.

**Complete portable inventory:** pwa/migration/d6-historic-media-inventory.json.gz is a gzip-compressed, human-readable JSON archive containing all 274 paths, verified byte lengths, SHA-256 of actual bytes, pinned Git blob IDs, and the original record owners/roles (cover, article, Notes, knot-step). The source-only test regenerates the whole JSON and verifies it byte-for-byte. To create a plain JSON locally, run from pwa: node tools/d6-historic-media-inventory.mjs --out /path/to/new-inventory.json. Target must not exist. No Cloudflare/D1/R2 calls are made.

## Exact inventory

| Domain | Files | Bytes |
| --- | ---: | ---: |
| Gear | 112 | 59,194,180 |
| Knowledge Base | 154 | 104,289,222 |
| Catches | 8 | 2,927,716 |
| **Total** | **274** | **166,411,118** |

- 265 files referenced by the original content graph; 284 owner references in total.
- 111 ordered KB knot-frame references; preserve their ordering from the original records.
- 8 legitimate KB-to-Gear cross-domain image files, stored once in Gear paths.
- 0 missing local image references.
- 9 unreferenced historical image files. These must NOT be deleted or excluded solely because they are unreferenced.

### Unreferenced historical paths (retain pending disposition)

1. Gear/Equipment/content/Garmin Force Current.png
2. Gear/Equipment/content/Newport-24V-50Ah-LoPRO-Lithium-LiFePo4-Battery.png
3. Gear/Lures/assets/berkley-gulp-minnow.webp
4. Gear/Lures/assets/berkley-power-jerk-shad.jpg
5. Gear/Lures/assets/rebel-pop-r.webp
6. Gear/Lures/assets/sixth-sense-divine-swimbait.webp
7. Gear/Rods-Reels/assets/pflueger-president-spincast.webp
8. KB/Locations/assets/location-cranberry-lake-deception-pass.png
9. KB/Species/assets/kokanee-phases.png

## Provenance and migration guardrails

- The 274 images are canonical fishing-content files; 20 other image files in pwa/assets, the root app icon and documentation illustrations are UI/documentation assets and stay in immutable software releases.
- Original D1 records may have been owner-edited after import. This is a pinned original-source inventory, NOT a live D1 export. Before any R2 migration, reconcile current D1 media paths and record revisions in a separately authorized read-only preflight.
- Preserve historical source backups, original logical image paths, and ordered knot-frame metadata. Confirm whether to retain all nine orphans in future R2 storage instead of silently discarding or deleting them.
- No R2 uploads, binding, D1 metadata schema/data writes, Worker changes, app merge or cutover were authorized or performed. M01 inventory source-CI PASS is distinct from actual owner-approved migration, parity verification and device acceptance.

Evidence: GitHub issue #377, draft source PR #567, canonical governance FISH-TODO-118 consolidation ledger and ADR-0012.
