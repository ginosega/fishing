# Fishing Context

**Status:** Active v1 production; v2 implementation and pinned migration committed. Browser/offline acceptance and isolated preview remain open. Reconciled September 9, 2026 (Pacific time). Restore actual current GitHub state before acting.

## Authority and current phase

Repository: `ginosega/fishing`. The approved future design is `Fishing_Companion_v2_Approved_Baseline.md`; exact user responses remain in the Requirements Inventory and Design Review at `0bd773366130a302b0e80d5cd085a71731ff9e63`. All fourteen decisions are resolved. Original source audit and technical contracts are preserved with dated September 9 addenda. The detailed continuation is `Fishing_v2_Work_Handoff_2026-09-09.md`.

The implementation branch `feature/v2-implementation-20260908` was observed at `24f57ca7d72a9751e0935c6eb46e842f61493db2`, draft PR 64 open and unmerged. Pinned migration commit `6615ae7296e48d90dceab303b6b5a1fbc041ab80` succeeded in run `34328748390`. The first hosted browser run `34330339245` passed two of six tests. No v2 preview or production cutover has been accepted. These are dated checkpoints, not permanent refs; preserve newer work.

## Migration and preservation

The original audit baseline is `1fa82a0cb653b8205bc8a45a1cf4608a616bf3b2`, reconciled to main `79f36144abad39a9515b8f2d7710852f1c7e7114`. The verified v1 production bundle comes from `4f2fe70f47da9cca3704722de87f7282bcc00f83`, run #312 / `34237232075`. The original source and authored Markdown remain authoritative; historical records are reference material, not competing current databases.

The approved migration contains 69 Gear, 54 KB and five Catches. Three paired setups became six independent rod/reel records with exact component facts and duplicated original Notes. Unaffected IDs, original narrative and actual Catch relationships were preserved. Canonical JSON SHA-256 values are Gear `e001c82a49c63b8ac21c93b559bc4768a40d267eff8bdf3fb6e73225cac64256`, KB `85bbf03d55b98432a21ed67288fc11e72c7fcf660a9af6de59ccf4beaa6268a4`, Catches `db97091e484021f0b261b91a27c790bd9f2bd4a8221bbd432e47400e21e9459b`. The full report is `v2/migration/reconciliation.json` on the implementation branch. Do not rerun the one-time migration to resume work.

Forty-nine archived image captures were explicitly approved and adopted exact-byte; two were rejected. Eight exceptions remain: seven required (Tsuridamashii, Rapala F-3, KB Perch, Popper, Whopper Plopper, Mack's Pee Wee Hoochie, River2Sea Whopper Plopper 60) and one optional generic inline-spinner picture. Rapala is incorrectly optional in the committed report and requires correction. No automatic image acquisition or invented replacements.

The user accepted source equivalence and waived a separate device-only IndexedDB export for this baseline. No device inspection was performed. Preserve v1 browser stores and reconcile any later-discovered local-only records before retirement.

## V2 architecture and engineering state

Three independent Gear/KB/Catch contracts share identity, Markdown, picture, path and validation conventions. Gear has ordinary independent rods/reels; Catch retains optional Species/Location/owned Lure-Bait relationships, text Size and Species-derived pictures. Gear/KB representative pictures use local paths and authored captions. No generic graph, paired setup relationship, media ownership/provenance system, Planner, sessions or speculative structures. P1 includes full-library offline reading and minimal Gear/KB Prepare/Copy handoffs. P2 direct Save, authentication, integrated uploads, offline editing/outbox/sync and Catch browser authoring remain deferred.

The committed runtime includes pinned Node 24 dependencies, ESM modules, schema/semantic validation, source-aware handoffs, Markdown sanitization, original-image validation, deterministic build, versioned complete-release service worker and Playwright suite. Core 15/15, dependency audit and build verification passed. Browser failures concern viewer accessibility/test selectors, editor heading ambiguity, successful upgrade selecting the new release and retry after corrupted content. The service-worker promotion/last-good guarantee also needs review. Preserve strict tests and repair real defects; do not treat a passing build as browser acceptance. The full failures and recovery evidence are in the Work Handoff.

## Production and release boundaries

The existing v1 root is `https://ginosega.github.io/fishing/`. Last verified production run #312 / `34237232075` has a retained `fishing-pwa` artifact `10060378687`, SHA-256 `83100e9cf2788b2d33959b39a6bb63fdd0e78c5e512936a07e46b22632bf7dbf`, through December 7, 2026. The source audit, migration and browser evidence artifacts have shorter retention; Git history and committed data remain durable. Preserve a fresh verified v1 root and rollback checkpoint before release work.

Complete the remaining runtime fixes and real-browser/offline acceptance, correct media accounting, reconcile current main, and publish a safe combined artifact with v2 only at `/fishing/v2-preview/` and isolated service-worker scope. Verify hosted assets and v1 functionality. Stop before production cutover until the user explicitly accepts the preview and separately authorizes cutover. Do not merge draft PR 64 or remove active v1 code before that gate. Consolidate temporary workflows at the appropriate stage without weakening meaningful checks.

## Current task and process state

FISH071/072/074/079/080 are DONE; FISH073/075/081 IN PROGRESS; FISH076/078 OPEN; FISH077 DEFERRED. The next unused task ID is 082. The canonical TODO retains all unrelated fishing and equipment work. Original complete audit/design documents and historical decisions remain preserved; the September 9 addenda record current implementation evidence.

Chat mode remains the default. The user has explicitly authorized a temporary Work session for authenticated repository/development/browser execution through the isolated preview. Complexity alone is not a reason to switch modes. Authorized work should proceed through real completion without repeated status-only stops, while preserving current source, permissions, meaningful tests and separate acceptance gates. Before the next chat transfer, reconcile current GitHub state and update Context, Decision Log, TODO, bootstrap and affected release records.
