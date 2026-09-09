# Fishing Context

**Status:** Active v1 production; v2 requirements approved, implementation not started. Reconciled September 8, 2026 (Pacific time). Restore actual main before acting; this checkpoint is not a substitute for current source.

## Authority and design state

Repository: `ginosega/fishing`. The approved future design is [Fishing_Companion_v2_Approved_Baseline.md](Fishing_Companion_v2_Approved_Baseline.md). Exact user answers remain in the Requirements Inventory and the Design Review at decision commit `0bd773366130a302b0e80d5cd085a71731ff9e63`. All fourteen review decisions are resolved. The next phase is a read-only source/dependency/data/CI audit followed by implementation-ready technical contracts. No v2 build or migration has started and no P2 direct Save, authentication service or offline sync is authorized.

V2 preserves three distinct domains with common identity, Markdown, picture and validation conventions. Gear will use ordinary independent rod/reel records; Catch will keep only optional Species, Location and Lure/Bait relationships, text Size and Species-derived pictures. Gear/KB representative media is a simple local path plus authored caption, with no provenance/owner graph. Full-library offline reading and minimal Gear/KB handoffs are P1; direct Save, integrated uploads, offline authoring and Catch browser authoring are P2. Use the approved baseline for exact fields, file rules, UX and migration instructions. Existing v1 architectural decisions remain valid only for operating the current application until replacement.

## Current v1 runtime and source authority

The last fully documented application release is PR60, final head `cd47dc9ce39660840de493346e7df9fda72a14e5`, CI #307 / `34191643311`, merge `ecd9f3d52ca8180ea4f48ec888e7574105deafda`, production #308 / `34191692935`, including actual Pages deployment. The subsequent direct-main history is newer than this release record. Latest previously inspected completed run #312 / `34237232075` succeeded; #311 / `34237203787` failed because a content test still expected a deleted Bonafide image source. A complete failure taxonomy and independent browser acceptance have not been completed. The live URL is https://ginosega.github.io/fishing/.

At the documented baseline, Gear schema4/66 has dataVersion `2026-09-08-my-gear-v4-perception-joyride-1`, KB schema1/54 has `2026-09-08-kb-v1-cranberry-lake-picture-1`, and Catch schema2/5 has `2026-09-04-catches-v2-external-notes-1`. Verify current counts and content from main before migration. The exact source data, not these historical counts, is authoritative.

V1 Gear facts live in `pwa/data/gear.seed.json` and `gear-store.js` IndexedDB stores; non-seed imports may persist separately. Optional Notes use `pwa/gear-content/`. KB uses `pwa/data/kb.seed.json` and `pwa/kb-content/`. Catch uses `pwa/data/catches.seed.json` and `pwa/catch-content/`. V1 media is spread across `media-sources.json`, `media-owners.json`, `media-overrides.json`, `local-media.json`, source assets, generated overlays and transformed display files. Its build is `build.mjs`, `apply-authored-notes.mjs`, `apply-local-media.mjs`, and `verify-final-bundle.mjs`, driven by `.github/workflows/fishing-pwa-build.yml`. See `pwa/README.md` for exact current commands. Do not remove or modify that working implementation merely because v2 has approved replacements.

The current v1 source has three paired setup IDs: `setup-spinning`, `setup-baitcasting`, `setup-spincasting`. V2 must create six ordinary component records, add Spincasting rod, copy each component's recorded facts/links exactly, and duplicate each complete setup Notes document into both new component Notes files. The user will correct them later. Preserve unaffected IDs, all historical catch facts and authored text, and explicit media associations. No invented rod identities or historical Catch attribution. The one-time audit must identify remote-only images, actual current image bytes/dimensions, missing files, local-only browser records and all links to retired setup IDs.

## Current equipment/media facts requiring preservation

Perception Joyride 10.0: Gear ID `perception-joyride-10-0`, category `accessories`, type `Accessories`, manufacturer Perception, model Joyride 10.0. Recorded specifications: Length `10'`, Height `15.25"`, Width `28.5"`, Weight `50 lb`, Color `Funkadelic`. Original accepted product link and no-Notes state remain authoritative in the source. The historical source image was `pwa/assets/gear-source/perception-joyride-10.png`, blob `f24403f79788755e267ee721f5e93c34c3f8f472`; validate latest bytes rather than restoring a historical hash.

Dagger Axis 10.5: ID `dagger-axis-10-5`, confirmed Length `10' 6"`. Preserve the latest user-replaced image, current facts and no-Notes state. Bonafide RVR119 and all authored Notes must remain intact. The current image source must be checked; a previously deleted source filename is not evidence that the Gear item itself was deleted.

Cranberry Lake: ID `location-cranberry-lake-deception-pass`, complete original Markdown retained, picture `./assets/kb/entries/location-cranberry-lake-deception-pass.png`, historical blob `201852612f8985fba057bfe224292bfe2a24d69d`, alt/caption `Cranberry Lake`. Fishing Line, Walking Bait and Rods & Reels hero images and their authored articles are also preserved. Rods & Reels caption is `Baitcasting reel`. Fishing Line's explicit Sufix 832 link must not be inferred into unrelated ownership. Preserve all current source bytes and metadata until v2 migration is verified.

The documented v1 copy is: home/KB root `Fishing reference and catch log`; Gear Guides `Equipment, rig, and presentation reference`; Catch Log `Recorded catches`; Techniques `Strategy, conditions, and species reference` without a final period. V2 visual requirements and any later user edits supersede old presentation details. Do not infer purchases or current equipment from historical research.

## Migration and release boundaries

Preserve all current source records, Markdown, image bytes and actual relationships. Existing browser-only data is not known to exist, but must be checked on relevant devices before IndexedDB retirement. Preserve exact prior facts in migration archives and move removed structured information to Notes where useful. A source-to-destination report must explain expected count changes and validate all content, references and required offline files. The user does not need to approve each row. Remote-only pictures require user-supplied local replacements before cutover; no automated image retrieval.

The one-time v2 preview uses a separate URL. Ordinary releases do not require separate staging. After verified cutover, remove obsolete v1 active code while retaining Git history and an explicit rollback reference. No permanent legacy adapter or parallel authoritative database. Do not delete v1 code, source files, local browser data or historical media before preservation checks pass.

## Project process

Chat mode is default; Work only for a specific Work-only capability with explanation and prior approval. An authorized change continues through implementation, validation, PR/CI, merge, actual deployment verification and authoritative-record reconciliation without repeated status/approval stops. Restore current main, preserve direct edits, respect denied permissions, keep meaningful tests and never rerun a one-time migration. Historical release records and prior Context/Decision/TODO versions remain in Git and `History/`; they are not competing current authority. The canonical TODO records open work. The v1-specific PWA README remains an accurate implementation reference until cutover.
