# Fishing Companion v2 — Source Audit Addendum

## Icon filename cleanup and current state — September 11, 2026

FISH-TODO-086 is DONE through [PR91](https://github.com/ginosega/fishing/pull/91). Current production source `afd7afc9ee91fb3dc81a15635e14ec932bda2b1b`, release `11789b7bace383d161add0ac7d313579`, passed [production run 34608018650](https://github.com/ginosega/fishing/actions/runs/34608018650): 21 core tests, 24 preview-scope and 26 production-scope Chromium/WebKit scenarios, archived-v1 transition, exact-current-main Pages deployment, all 205 hosted-file comparisons and complete hosted browser verification.

The approved transparent PNG is now `pwa/icon.png`; its bytes are unchanged (SHA-256 `e46bcb2260f550380c4df2a42d512bbcd19b24dbf9e987815a0070afd350b922`). The obsolete `pwa/icon.svg` and former `pwa/revised-icon.png` paths are removed from current source. New builds use `icon.png` for the manifest, favicon and Apple touch icon. Historical filenames remain accepted only by release validation and compatibility tests so retained cached releases stay readable. Git history retains both removed paths. Canonical Gear/KB/Catch files are unchanged.

FISH084, FISH085 and FISH086 are complete; PR89–PR91 are merged and no release or icon work remains pending. P2/FISH077 remains deferred, all unrelated backlog is retained, and next unused task ID is FISH-TODO-087. Continue in Chat using actual latest main. This documentation reconciliation does not redeploy.

## Historical Chat handoff audit — before icon filename cleanup

Rechecked latest main `36d894439632b45aa358c7a93a38b19dff822875` and successful production run `34566907478`. Later commits are documentation only; source `240dbfa67a1810ef51fde24f7bd0fb1d1c867bcf` and release `c15f12f49c4162706fb14eb2791e3204` remain the verified production pair. No release is pending. Current handoff, scope and Chat-default policy: [Context](../../Fishing_Context.md) and [bootstrap](../../Fishing_New_Chat_Bootstrap_Prompt.md).

GitHub comparison from pre-UI production `76094d48055ca9e2363298763cdbf00586fbeb71` through PR90 shows no changed paths under Gear, KB or Catches. Current counts are Gear69/KB54/Catches5. Current canonical JSON SHA-256 evidence (not permanent article locks):

| Source | SHA-256 |
|---|---|
| `Gear/gear.json` | `bb8a610d87ce455d8a5ead89d68c7059993d9453edac01a01e9b7c2e43cc0abc` |
| `KB/kb.json` | `29185228d15af89bd9447ebe1ace70ee148343b465962dd62bba281a7160ac21` |
| `Catches/catches.json` | `db97091e484021f0b261b91a27c790bd9f2bd4a8221bbd432e47400e21e9459b` |

## PR89/PR90 production closeout — historical release evidence

FISH-TODO-084 and FISH-TODO-085 are DONE. The eight UI/authoring refinements from PR89 and the user-authorized icon transparency/verifier correction in [PR90](https://github.com/ginosega/fishing/pull/90) are live at production source `240dbfa67a1810ef51fde24f7bd0fb1d1c867bcf`, release `c15f12f49c4162706fb14eb2791e3204`. [Production run 34566907478](https://github.com/ginosega/fishing/actions/runs/34566907478) is green: 20 core tests, 24 preview-scope and 26 production-scope Chromium/WebKit scenarios, archived-v1 worker/store transition, exact-current-main Pages deployment, all 205 hosted-file comparisons and the complete hosted browser verifier passed. PR90 CI [run 34566584530](https://github.com/ginosega/fishing/actions/runs/34566584530) also passed.

Historical PR89 evidence: source `1f3f6df97390db186303148dcb5fa62ad0ba90e9`, release `7572c94504e4482c9987828b95a653f6`, [run 34565111477](https://github.com/ginosega/fishing/actions/runs/34565111477) published successfully and compared all 205 hosted files, but its browser verifier failed because Yellow Perch matched both the page h1 and a Catch History h2. That historical run remains failed; PR90 repairs the selector with `level:1` and completes a new fully verified release.

Historical PR89 direct cloud-browser follow-up verified the published home/KB/Catch wording, normal-weight dates below Species, page search, exact runtime icon references, Yellow Perch page/image viewer, Offline Ready for 203 files, real clipboard instruction plus valid JSON, Gear/KB Add Exit to the originating roots and KB Edit Exit to its original item without a warning. The original hosted verifier had already completed actual offline reload before reaching the ambiguous selector. No physical-device inspection or browser-originated repository writes are claimed.

The user explicitly authorized the follow-up PR/release and clarified: “The white border surrounding the green button image should be transparent.” This supersedes the earlier one-PR limit for this correction. No further icon transfer or approval is pending.

The PR90 runtime used the transparent-background edit of `pwa/revised-icon.png` (renamed without byte changes to `pwa/icon.png` in PR91) (1,208,529 bytes, 1254 × 1254 RGBA PNG; SHA-256 `e46bcb2260f550380c4df2a42d512bbcd19b24dbf9e987815a0070afd350b922`). The built-in image editor was instructed to remove only the exterior white background and preserve the green button and fish/hook artwork. Alpha inspection and browser regressions verify transparent exterior pixels, retained center opacity, source-derived dimensions and exact served bytes. The original opaque upload remains recoverable in PR89 history (SHA-256 `89a81bac58c460cdb6ccc509b6b240ac84937b619990c6ac9b187ddc4b75980c`). Favicon, manifest and Apple touch icon all use the corrected PNG; offline integrity includes it and older SVG-icon releases remain readable for recovery.

Catch card dates appear directly below Species at regular weight, including derived Catch History cards. Existing search inputs use `Search [page title]`; no new search inputs were added. Knowledge Base card/subtitle reads `Fishing reference library`; Catch Log home-card subtext and list-page heading read `Recorded catches`. Back buttons retain only `Back`.

After a successful Copy Changes, Exit returns edits to their original item and adds to their originating Gear/KB root or category. Exit alone bypasses the unsaved-changes warning. Further edits invalidate the prepared package and remove Exit; ordinary Back, Cancel, navigation and reload remain guarded. Copy text contains an explicit repository implementation/deployment instruction above valid `fishing-companion-change-v2` JSON; manual-copy fallback includes that same instruction. Preparing/copying is not saving. KB Notes remain required; its schema and viewer behavior are unchanged.

The following earlier release/audit sections are historical evidence and do not override this closeout.

> Repository layout: production source/tests/contracts now live under `pwa/`; this document is retained PWA reference. Old `v2/`, v1 `pwa/`, History and Topics paths in dated evidence refer to the [pre-cleanup snapshot](https://github.com/ginosega/fishing/blob/edca2a3f04fc8c32dec65b9330d43944be1a561c/). Current instructions: [PWA README](../README.md).

## Production closeout — September10, 2026

V2 is published at [Fishing Companion](https://ginosega.github.io/fishing/). Production revision `ceef1df0dd8b204e7aa59c63e95a0d75346f4a92`, release `7ff6f62d921d5e86e0d97ae89b361120`, passed [publication and hosted verification](https://github.com/ginosega/fishing/actions/runs/34441600093). PR64 is merged. The user authorized production and waived another preview review; all seven previously required missing pictures are explicitly deferred. The affected records remain available without pictures. No acceptance or media approval blocks this release.

Validation: 20 core tests, 20 preview-scope and 22 production-scope Chromium/WebKit scenarios, including the actual archived-v1 worker transition and retained browser stores. All 197 hosted files match the verified production build; live navigation, image viewer, offline reload, counts and absent-picture behavior pass. These are automated browser and direct hosted checks, not physical-device inspection.

The sole active pipeline is `.github/workflows/fishing-production.yml`. V1 and the earlier preview are historical; use the production root. V1 sources and exact rollback ZIPs remain in Git. Old browser stores are retained. P2 remains deferred. This authorized Work phase is complete; continue in Chat.

**Historical evidence follows.** Earlier pending gates below are superseded; see the [production release](Fishing_v2_Production_Release_2026-09-10.md).



**Status:** Pinned migration and P1 engineering complete; isolated preview published and hosted-verified, awaiting user review. The [preview release record](Fishing_v2_Preview_Release_2026-09-09.md) is the current release authority. Original audit tables remain preserved.

The migration at `6615ae7296e48d90dceab303b6b5a1fbc041ab80` was not rerun. Gear 66 → 69, KB 54 → 54, Catches 5 → 5; six independent rod/reel components, confirmed facts, original narrative, stable unaffected IDs and actual Catch relationships remain unchanged. Canonical JSON and all Gear/KB/Catch files are unchanged from that migration. All 136 report entries sourced from repository files were compared byte-for-byte with current main `cac5b4108a63fcaab498b256afa4420ce2dbbd70` and match. Subsequent publication integration changes only the workflow.

Forty-nine explicitly approved archived captures retain their exact bytes. The two rejected captures were not adopted. Seven required exceptions remain: Tsuridamashii snap-swivels, Rapala Original Floating F-3, KB Perch, Popper, Whopper Plopper, Mack's Pee Wee Hoochie and River2Sea Whopper Plopper 60. Generic inline-spinner is the sole optional exception. Rapala's erroneous optional flag is corrected in the report and migration tool; a source-aware regression enforces this exact accounting. No migration rerun or image acquisition occurred.

The publication guard discovered newer live v1 build #314 / `34369680844`, source `cac5b4108a63fcaab498b256afa4420ce2dbbd70`, superseding the previously inspected #312 root. Its 217-file archive is preserved unchanged for the combined preview. Relative to the older archive, remote Eagle Claw and Rapala DT06 captures use JPG instead of WebP, and an F-3 PNG is now present. These build captures do not constitute approval to change v2's adopted images or resolve its required exceptions. Both archives are retained durably in the rollback branch; the older one remains the approved migration-media evidence. No original source or current user replacement was overwritten.

The user accepted source equivalence and waived a separate device-only IndexedDB export for this baseline. No physical-device inspection was performed. Preserve all old browser stores and reconcile any later-discovered local-only records before retirement.

Dependency audit, source validation, complete-release build verification, 19 core tests and 16 Chromium/WebKit browser scenarios passed. Actual hosted comparisons cover every v1 and v2 file; browser verification covers navigation, a representative decoded image/viewer, offline reload and return to v1. See the release record for exact revisions, run links, archive hashes and test limitations. Historical failed runs remain evidence, not current unresolved engineering failures.
