# Fishing Companion V3 — one content architecture

**Status:** owner-approved direction; technical implementation companion only. **Single active backlog and acceptance statuses** belong to [FISH-TODO-118 consolidation ledger in protected governance PR #569](https://github.com/ginosega/fishing/blob/governance/fish118-kb-owner-accepted-catches-next-20261119/project-ops/v2/FISH-TODO-118_CONSOLIDATION_SCOPE.md), linked from canonical `WORK_QUEUE.md` when that PR is approved and merged. [ADR-0012](https://github.com/ginosega/fishing/blob/governance/fish118-kb-owner-accepted-catches-next-20261119/project-ops/v2/decisions/records/ADR-0012.md) records the architecture decision; owner direction is recorded in [issue #377](https://github.com/ginosega/fishing/issues/377#issuecomment-7058493017). Source-only work remains in draft PR #567. No D1 schema/data writes, R2 upload, Worker deployment, GitHub merge or public cutover are authorized by this plan.

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

1. **Expandable D1 catalogs and Add parity — SOURCE-ONLY CI PASS, FIELD PENDING.** Preserve the proven 100 Gear/60 KB/12 Catch initial IDs as a *temporary migration-integrity floor*, not a maximum. Implement Gear/KB insert-only owner Add with expected revision 0; reject duplicate IDs with 409 and independently read after Save. Continue to fail closed on missing original IDs while offline remains the old snapshot. Do not claim D1-only startup until slice 2.
2. **D1 as one online content authority — SOURCE-ONLY CI PASS, FIELD PENDING.** Boot online Gear, KB and Catches from current D1 without loading immutable content JSON first. Use domain schemas, IDs and referential validation and a separately approved completeness marker/manifest rather than perpetual historic count assumptions. Preserve offline read-only behavior until slice 4. No second writable record source.
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

At draft PR #567 exact source `bb04b906de7bdd707a81ab3004c6a90d00c0a5df` (CI [#44873777455](https://github.com/ginosega/fishing/actions/runs/44873777455) PASS), 100/60/12 imported D1 records are reconciled. Unmerged source now implements Gear/KB insert-only Add and **fully flagged D1-first Automatic-mode online startup**, with the verified frozen release kept for Work Offline / ordinary V2. This is not yet deployed; original-ID independent completeness and Automatic failure recovery remain open. The approved private Worker still uses the older implementation. R2 is private/Standard and was empty at last owner preflight; source media adapters are unmounted and disabled. The immutable-release offline content needs independently versioned D1/R2 snapshots under ADR-0012. Do not substitute source CI for provider or owner field acceptance. Follow the **single governance ledger** for the rest of the ordered engineering acceptance items.
