# Fishing Companion v2 — Source Audit Addendum

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
