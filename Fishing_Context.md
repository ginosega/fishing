# Fishing Context

**Status:** Active v1 production; v2 implementation and pinned migration committed; browser/offline acceptance and isolated preview outstanding. Reconciled September 9, 2026 (Pacific time). This is a checkpoint, not a substitute for fetching current GitHub state.

## Authority and exact continuation

Repository: `ginosega/fishing`. Current main at reconciliation: `79f36144abad39a9515b8f2d7710852f1c7e7114`. V2 branch: `feature/v2-implementation-20260908`, head `24f57ca7d72a9751e0935c6eb46e842f61493db2`. Draft PR 64 is open, unmerged and not approved for cutover. The verified migration commit is `6615ae7296e48d90dceab303b6b5a1fbc041ab80`. The [Work Handoff](Fishing_v2_Work_Handoff_2026-09-09.md) is the detailed execution checkpoint; the [bootstrap](Fishing_New_Chat_Bootstrap_Prompt.md) is the new-chat entry point. No runtime fixes were committed after the failed browser run in this handoff session.

All fourteen approved Design Review decisions remain authoritative at `0bd773366130a302b0e80d5cd085a71731ff9e63`. The original Requirements Inventory and Design Review are unchanged. The Approved Baseline governs requirements; the Source Audit, Technical Contracts and schema govern implementation details subject to those requirements. Current structured source and authored Markdown prevail over historical discussions and source exports.

## Authorized scope and operating mode

Chat is the permanent default. The user has explicitly authorized a temporary Work session because its authenticated repository/development/browser execution capabilities are materially useful for completing v2. Do not suggest that Work is required merely because the project is lengthy or complex. Restore current state and complete the already-authorized engineering/isolated-preview phase without repeated Proceed interruptions.

P1 includes three independent domains, ordinary rod/reel records, source-backed Gear/KB handoffs, read-only Catch Log, complete offline reading, strict image/path/Markdown validation, deterministic releases and an isolated preview. P2 direct Save, authentication, integrated uploads, offline edit queue/sync, and Catch browser authoring remain deferred. Production cutover requires explicit user acceptance of the preview and a separate approval. Do not merge PR 64, replace the v1 root, remove v1 runtime, or clear old browser stores as a shortcut.

## Implementation and verification state

The feature branch contains the v2 application, shared contracts, editor/handoff modules, image viewer, offline service worker, release builder/verifier, exact dependency lockfile, migration/reproduction tooling, generated source data, and browser tests. Dependencies include Node 24, Ajv 8.20.0, DOMPurify 3.4.15, markdown-it 15.0.1, esbuild 0.28.2, sharp 0.35.4 and Playwright 1.62.0. The pinned migration run [34328748390](https://github.com/ginosega/fishing/actions/runs/34328748390) succeeded and committed the generated files at `6615ae7296e48d90dceab303b6b5a1fbc041ab80`. Fifteen core tests, dependency audit and a verified preview build passed in hosted CI.

The latest inspected acceptance run is [34330339245](https://github.com/ginosega/fishing/actions/runs/34330339245), PR merge test commit `3b68d951b19f1c51e16c9d6b427ae884168bb5f9`. It failed with 2/6 browser tests passing. Complete-library installation, SHA-256 verification and offline reload passed; mobile layout and nested-worker scope isolation passed. Navigation/viewer and editor test selectors need correction; upgrade/retry behavior requires investigation and implementation fixes. The actual error evidence and next steps are recorded in the Work Handoff. No all-green browser gate, published v2 preview, user acceptance or production cutover is claimed.

## Pinned migration and preservation

The approved source is `79f36144abad39a9515b8f2d7710852f1c7e7114`; archive source is `4f2fe70f47da9cca3704722de87f7282bcc00f83`. Source Gear 66 becomes 69 through the approved three-to-six component split; KB 54 and Catches 5 retain identity. Exact component facts/links, all original narrative bytes, unaffected IDs, dates, original measurements and known Catch relationships are preserved. The original structured Catch objects and removed fields remain in reconciliation evidence. No new ownership, rod model or historical Catch attribution is invented.

Canonical destination SHA-256 values:

| File | SHA-256 |
|---|---|
| `Gear/gear.json` | `e001c82a49c63b8ac21c93b559bc4768a40d267eff8bdf3fb6e73225cac64256` |
| `KB/kb.json` | `85bbf03d55b98432a21ed67288fc11e72c7fcf660a9af6de59ccf4beaa6268a4` |
| `Catches/catches.json` | `db97091e484021f0b261b91a27c790bd9f2bd4a8221bbd432e47400e21e9459b` |

The full evidence is committed at `v2/migration/reconciliation.json`; `v2/migration/reproduce.py` and `.github/workflows/v2-migrate.yml` document the original reproduction. The original source/archive hashes and approved image decision file are pinned. Do not rerun or overwrite the one-time migration simply to continue the project. A later source refresh, if genuinely required before cutover, must be separately reconciled and must preserve approved content and existing destination edits.

## Media decisions and remaining exceptions

The user approved 49 of 51 archived Gear captures for exact-byte adoption, and rejected two. The accepted files are committed as local originals. The remaining eight exceptions are: malformed Tsuridamashii snap-swivels image; missing Rapala Original Floating F-3 picture; remote KB pictures for Perch, Popper and Whopper Plopper; rejected Mack's Pee Wee Hoochie and River2Sea Whopper Plopper 60 captures; and one optional absent generic inline-spinner picture. The current reconciliation JSON mistakenly flags Rapala optional, yielding six pending flags instead of seven required items. Correct this classification and add a regression gate before a release candidate. Do not fabricate replacement assets or fetch pictures automatically. Keep all exceptions visible until actual replacements or explicit acceptance.

Six KB pictures reuse Gear image files without duplication. The unused malformed Kokanee WebP was excluded after its active valid PNG was reconciled. The original source and approved adopted bytes remain authoritative; any future user replacement is a new source change, not a historical hash-lock violation.

The user accepted source equivalence and waived a separate device-only IndexedDB export for this migration baseline. No device export was performed. This is an accepted waiver, not a claim that every device was inspected. Retain v1 browser stores; reconcile any newly discovered local-only records before retirement and do not clear browser data without a separate preservation decision.

## Production and recovery

The live v1 URL is https://ginosega.github.io/fishing/. At reconciliation the latest verified production build is #312, run `34237232075`, source `4f2fe70f47da9cca3704722de87f7282bcc00f83`. Its archived `fishing-pwa` artifact ID 10060378687 has SHA-256 `83100e9cf2788b2d33959b39a6bb63fdd0e78c5e512936a07e46b22632bf7dbf` and retention through December 7, 2026. The source audit archive and migration evidence are separately retained through October 9, 2026. Git history is durable; temporary runner artifacts are not. The original audit source is `1fa82a0cb653b8205bc8a45a1cf4608a616bf3b2` and source-audit run 34312003986 succeeded. Historical last fully documented feature release PR 60/merge `ecd9f3d52ca8180ea4f48ec888e7574105deafda` remains in release history.

V1 continues using its schema 4 Gear/IndexedDB, schema 1 KB, schema 2 Catch, source media registries and transformed build. Current v1 code is not replaced by the v2 feature branch. Before preview publication, confirm the actual current Pages deployment, capture the root artifact/hash inventory, and publish only through a safe combined deployment preserving the v1 root. Before eventual production cutover, reconcile current main, create a rollback checkpoint, obtain explicit approval, and verify actual hosted assets.

## Current equipment and content facts

Bonafide RVR119 and its complete authored Notes are retained. Dagger Axis 10.5 uses ID `dagger-axis-10-5` and confirmed length `10' 6"`; Perception Joyride 10.0 uses ID `perception-joyride-10-0` and the submitted source facts. Preserve latest source images and no-Notes state rather than restoring older picture bytes. The unidentified Pflueger spincasting rod remains represented only by the recorded combo facts, without an invented model or picture. Rods & Reels caption is `Baitcasting reel`; Cranberry Lake retains its complete article and accepted image. Fishing Line's explicit Sufix 832 association must not be inferred into unrelated gear ownership. All five historical Catch records and their original measurements/Notes remain intact.

The approved v2 schema has Gear `id, category, type, name, manufacturer?, model?, specifications[], links[], picture?, notes?`; KB `id, type, name, content, description?, picture?`; Catch `id, date, time?, size?, speciesId?, locationId?, lureOrBaitId?, notes?`. Gear and KB share conventions but remain separate domains. Catch History is derived only from the three approved forward references. No Planner, sessions, setup associations, generic relationship graph, source/provenance/owner media graph, accounts or multi-user expansion.

## Open work and project process

FISH-TODO-073 and FISH-TODO-075 remain IN PROGRESS; 074 is DONE for the pinned migration; 076 is OPEN for the preview/cutover; 077 is DEFERRED; 078 is OPEN; 079 records the accepted device-check waiver; 080 tracks reconciliation/handoff until publication is verified; 081 tracks the real-browser failures. See the canonical TODO for precise status and all unrelated fishing backlog. The current exact next step is to fix and rerun browser/offline acceptance, then publish and verify the isolated preview. There is no standing authorization to cut over production.

Preserve exact authored files and current Git history, not an old temporary workspace or an inferred file path. Normal runtime work uses a feature branch, meaningful CI, exact-head/current-base integration and verified deployment. Do not weaken tests or bypass permissions. Reconcile records after actual milestones, and use the approved temporary Work capability only for the execution need identified above.
