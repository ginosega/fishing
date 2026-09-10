# Fishing Companion v2 — Source Audit Addendum

## Production execution — September 10, 2026

The user authorized production cutover and waived another preview review, then explicitly resolved the picture gate: “Yes, omit those, and those gear and KB items can just have no picture. I will add these to the site later.” The seven named pictures are intentionally absent; all Gear/KB records remain. The generic inline-spinner picture remains optional. `v2/migration/media-decisions.json` records this decision separately from the preserved original migration report. No images were acquired or canonical records changed.

Production implementation and root-scope acceptance are in progress. The consolidated `fishing-production.yml` replaces the old v1/preview publishers and one-time workflows; history and the exact v1 rollback ZIPs remain in Git. The root loader now verifies the v2 worker protocol because v1 and v2 share the same `sw.js` URL. Acceptance covers the actual archived v1 worker, retained IndexedDB/cache stores, both browser engines, full offline reading and all prior integrity/editing assertions. Do not claim deployment until the hosted production gate passes. No additional user approval is needed.

The earlier media-blocked and preview-only checkpoints below are historical and superseded by this decision. See [production release](Fishing_v2_Production_Release_2026-09-10.md) for current execution evidence.


**Status:** Pinned migration and P1 engineering complete; isolated preview published and hosted-verified, awaiting user review. The [preview release record](Fishing_v2_Preview_Release_2026-09-09.md) is the current release authority. Original audit tables remain preserved.

The migration at `6615ae7296e48d90dceab303b6b5a1fbc041ab80` was not rerun. Gear 66 → 69, KB 54 → 54, Catches 5 → 5; six independent rod/reel components, confirmed facts, original narrative, stable unaffected IDs and actual Catch relationships remain unchanged. Canonical JSON and all Gear/KB/Catch files are unchanged from that migration. All 136 report entries sourced from repository files were compared byte-for-byte with current main `cac5b4108a63fcaab498b256afa4420ce2dbbd70` and match. Subsequent publication integration changes only the workflow.

Forty-nine explicitly approved archived captures retain their exact bytes. The two rejected captures were not adopted. Seven required exceptions remain: Tsuridamashii snap-swivels, Rapala Original Floating F-3, KB Perch, Popper, Whopper Plopper, Mack's Pee Wee Hoochie and River2Sea Whopper Plopper 60. Generic inline-spinner is the sole optional exception. Rapala's erroneous optional flag is corrected in the report and migration tool; a source-aware regression enforces this exact accounting. No migration rerun or image acquisition occurred.

The publication guard discovered newer live v1 build #314 / `34369680844`, source `cac5b4108a63fcaab498b256afa4420ce2dbbd70`, superseding the previously inspected #312 root. Its 217-file archive is preserved unchanged for the combined preview. Relative to the older archive, remote Eagle Claw and Rapala DT06 captures use JPG instead of WebP, and an F-3 PNG is now present. These build captures do not constitute approval to change v2's adopted images or resolve its required exceptions. Both archives are retained durably in the rollback branch; the older one remains the approved migration-media evidence. No original source or current user replacement was overwritten.

The user accepted source equivalence and waived a separate device-only IndexedDB export for this baseline. No physical-device inspection was performed. Preserve all old browser stores and reconcile any later-discovered local-only records before retirement.

Dependency audit, source validation, complete-release build verification, 19 core tests and 16 Chromium/WebKit browser scenarios passed. Actual hosted comparisons cover every v1 and v2 file; browser verification covers navigation, a representative decoded image/viewer, offline reload and return to v1. See the release record for exact revisions, run links, archive hashes and test limitations. Historical failed runs remain evidence, not current unresolved engineering failures.
