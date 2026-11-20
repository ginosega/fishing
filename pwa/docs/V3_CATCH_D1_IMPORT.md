# V3 Catch Log — original 12 records, direct D1 Save and Add (SOURCE ONLY)

FISH-TODO-118 / [ADR-0011](../../project-ops/v2/decisions/records/ADR-0011.md). This document and the current draft PR **do not authorize** Catch D1 import, Worker deployment, source merge or public cutover.

## Frozen source and scope

- Original \`pwa/Catches/catches.json\` Git blob \`1522cf990f3ac6422ef17970793ec86604007a5a\`: 12 Catch IDs, all 12 linked Notes Markdown files; eight original Catch photographs, referenced in ten Notes articles. Original media paths and existing Gear/KB links are retained.
- **Source-only** generator \`node tools/d6-catch-migration.mjs --out <fresh-folder>\` reads immutable Git blobs to avoid Windows CRLF changes and verifies the tracked Catch image bytes. Locally writes \`catch-import.sql\` (one proposed \`d6_catch_records\` CREATE TABLE + 12 insert-only statements) and \`catch-integrity.json\`; neither file performs a provider write.
- Private Worker reuse only: \`D6_DIRECT_CATCH_ENABLED\` plus \`--d6-direct-catch-save\` in the established Gear + KB release. The existing session-bound owner CSRF, optimistic revisions and offline read-only protections apply.
- After import, original 12 records are mandatory for online collection completeness; signed-in owner may subsequently **Add a new Catch** (revision 0 request -> revision 1 insert, collision returns 409), or **Edit** an existing Catch (revision checked, stale 409). Normal anonymous list/details read the existing D1; original offline snapshot remains static/read-only. No new uploaded photos or Notes images are supported yet. Do not portray their insertion as a working feature.

## Separate operator/owner gates before ANY provider write

1. Verify exact tested PR head, approved private Worker configuration, existing full Gear 100 + KB 60 D1 data, original 12 Catch source, source fast/merge-ready CI.
2. Owner first runs local source-only generator in an **unused** Documents directory. Recheck \`catch-import.sql\` and frozen \`catch-integrity.json\` including 12 IDs/12 Notes/eight photos and ten links.
3. Independently query isolated D1 \`fishing-v3-wp3-operations-test\` **read-only** for Gear=100, KB=60, and that **no Catch table/rows exist**. If unexpectedly present, stop; never repeat an uncertain write. Export the **complete latest D1** to an operator-controlled local SQL backup and record size/SHA-256. The previous pre-KB backup is not current.
4. Obtain a new **explicit owner approval** for Catch schema + 12 initial-row insert-only D1 write. Execute once, then read-only verify exact original 12 IDs, valid JSON/Notes and Gear/KB preservation. Do not automatically retry if outcome is ambiguous.
5. Obtain distinct explicit owner approval for a **single** in-place update to the **existing private Worker** and local release build with \`--d6-direct-catch-save\`. Verify former Worker version/release immediately before deploying, preserve D1 bindings, encryption secrets, OFF switches and public V2.
6. Run the existing read-only \`node tools/d6-catch-reconcile.mjs --report <catch-integrity.json> --out <unused-result.json>\` against exact private Worker: all 12 original record/Notes hashes, eight referenced hosted photo bytes and paths, release identity/manifest. The baseline validator expects revision 1; **do not repeat unchanged-baseline reconciliation after deliberate Catch owner Saves/Add**.
7. Windows Edge and Android acceptance: Catch history/list/details/photo/linked Gear/KB, owner edit Notes and reversible Save→reload→restore, **one** new Catch Add→reload proof with new ID and safe test content, 409 stale refusal, Work Offline read-only. No deleting records or unapproved bulk updates.

**Fail closed.** CI/source checks are not provider or physical field acceptance. No GitHub per-edit publishing, watchdog, scheduler, new Cloudflare resource, automatic provider retry, public V2 change, code merge or public V3 cutover.
