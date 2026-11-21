# Fishing Companion V3 — one content architecture

**Status:** owner-approved direction, source-only work in draft PR #567. This plan does not authorize D1 schema/data writes, R2 uploads, Worker deployment, GitHub merge, or public cutover. Follow the existing protected approval gates.

## Target ownership

| Data | One V3 authority | Release/archive role |
| --- | --- | --- |
| Gear, KB, Catch records and Markdown | D1 | GitHub/immutable snapshots for backup and provenance, not online record authority |
| All content photos and knot steps (old + new) | Private R2, D1-indexed verified paths | Preserve original file hashes and historical source until acceptance |
| Derived card thumbnails | Unified reproducible R2 derivative/cache policy | UI artwork remains code-release static |
| Online Create/Edit/Save | One authenticated revision-protected D1 path with optional atomic R2-media references | No per-edit GitHub publishing |
| Offline Work Offline | Atomic verified snapshot of D1 records + referenced R2 bytes | Service-worker code stays versioned/release verified |
| Source JS/CSS/icons/manifest | Immutable versioned software release | Independent of record changes |

## Delivery slices and acceptance

1. **Expandable D1 catalogs and Add parity — SOURCE ONLY IN PROGRESS.** Preserve the proven 100 Gear/60 KB/12 Catch initial IDs as a *temporary migration-integrity floor*, not a maximum. Implement Gear/KB insert-only owner Add with expected revision 0; reject duplicate IDs with 409 and independently read after Save. Continue to fail closed on missing original IDs while offline remains the old snapshot. Do not claim D1-only startup until slice 2.
2. **D1 as one online content authority.** Boot online Gear, KB and Catches from current D1 without loading immutable content JSON first. Use domain schemas, IDs and referential validation and a separately approved completeness marker/manifest rather than perpetual historic count assumptions. Preserve offline read-only behavior until slice 4. No second writable record source.
3. **One Save orchestration.** Reconcile current text-only endpoints with source-only R2 media staging/publishing; same revision/CSRF/transaction contract for text-only, Notes images, cover images and complete KB Knot sequences. Consolidate Gear, KB, Catch Add/Edit without relaxing domain validation or allowing unlinked blobs.
4. **One R2 content image authority.** Bounded one-time copy of verified historical content photos, compare SHA-256/byte counts/logical paths, protect original backups, and switch **all** image read/thumbnail paths to D1-verified R2 only after owner acceptance. New media uses same R2 path. App UI icons/artwork remain static software assets.
5. **Verified offline snapshot.** Independently package current D1 content and referenced R2 media into a versioned, digest-verified content snapshot that can be atomically cached. Keep last complete good snapshot and read-only Work Offline; no partial libraries, offline write queue or silent merge of stale data. Software releases remain immutable.
6. **Retire legacy V3 runtime branches.** Remove obsolete V2 authoring/handoff, frozen-content overlay, release-bound thumbnail lookup and source-revision-only draft gating from V3 after parity tests; preserve public V2 and historical GitHub backup. Complete Windows Edge/Android on-device acceptance and a separately approved cutover.

## Strict rollout rules

- A source-only CI PASS is not a hosted or owner acceptance. Do not rerun completed 100/60/12 imports; preserve owner-edited D1 revisions.
- Do not enable a new R2 route or migration before exact owner authorization for Worker binding, D1 schema, provider writes and private deployment.
- Offline and record backup/integrity are product requirements, not disposable legacy code. Code-release integrity validation remains unchanged.
- Don't invent a second canonical content database, background publisher, watchdog, per-edit CI queue or multi-user account subsystem.
- Progress and evidence are tracked through existing FISH-TODO-118 issue #377, draft source PR #567 and protected governance PR #569; no parallel work queue.

## Current source facts

As of the current draft work, original 100/60/12 D1 content has been imported and reconciled; online data is overlaid on frozen release catalogs; offline is frozen-release based; Gear/KB Add is disabled on the accepted private Worker. The source-only unmerged revision introduces create support and expandable catalogs. R2 is private/Standard and was empty at last owner preflight; R2 media source modules are still unmounted/default OFF. No source-only code in this document implies a deployed change.
