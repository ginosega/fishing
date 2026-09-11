# Fishing TODO

## Chat handoff audit — September 11, 2026

Restored and audited GitHub main `36d894439632b45aa358c7a93a38b19dff822875` before this documentation-only handoff. Its changes after production source `240dbfa67a1810ef51fde24f7bd0fb1d1c867bcf` are documentation only; the deployed release remains `c15f12f49c4162706fb14eb2791e3204`. Production run `34566907478` is successful; PR89 and PR90 are merged, no PRs are open and no release jobs are queued or running at this audit. This handoff does not require another build or deployment.

FISH084 and FISH085 are DONE; no UI, icon-transfer, verifier or production-acceptance work remains from this chat. FISH077/P2 stays DEFERRED. All unrelated TODO rows and purchase uncertainties are retained; next unused task ID is FISH-TODO-086. Resume by reading actual latest main, then respond to the user's next requested work rather than restarting a completed release. The bootstrap, Context, TODO, Decision Log, README and affected PWA records were cross-checked for release identity, icon state, completed tasks, deferred scope and Chat-default instructions.

## Current production state — September 11, 2026

Current Fishing Companion production source is `240dbfa67a1810ef51fde24f7bd0fb1d1c867bcf`, published and fully verified in [run 34566907478](https://github.com/ginosega/fishing/actions/runs/34566907478); release `c15f12f49c4162706fb14eb2791e3204` contains 205 hosted files. PR77 supplied Tsuridamashii; PR79 supplied Rapala Original Floating, Mack's Pee Wee Hoochie, River2Sea Whopper Plopper 60 and Yellow Perch and replaced Rebel Pop-R; PR81 updated Kokanee/Largemouth/Smallmouth; PR84 supplied the final Popper and Whopper Plopper Gear-Guide pictures. All seven originally deferred required pictures are now resolved. FISH078 is DONE. Generic inline-spinner remains optional.

## FISH084/FISH085 production closeout — September 11, 2026

FISH-TODO-084 and FISH-TODO-085 are DONE. The eight UI/authoring refinements from PR89 and the user-authorized icon transparency/verifier correction in [PR90](https://github.com/ginosega/fishing/pull/90) are live at production source `240dbfa67a1810ef51fde24f7bd0fb1d1c867bcf`, release `c15f12f49c4162706fb14eb2791e3204`. [Production run 34566907478](https://github.com/ginosega/fishing/actions/runs/34566907478) is green: 20 core tests, 24 preview-scope and 26 production-scope Chromium/WebKit scenarios, archived-v1 worker/store transition, exact-current-main Pages deployment, all 205 hosted-file comparisons and the complete hosted browser verifier passed. PR90 CI [run 34566584530](https://github.com/ginosega/fishing/actions/runs/34566584530) also passed.

Historical PR89 evidence: source `1f3f6df97390db186303148dcb5fa62ad0ba90e9`, release `7572c94504e4482c9987828b95a653f6`, [run 34565111477](https://github.com/ginosega/fishing/actions/runs/34565111477) published successfully and compared all 205 hosted files, but its browser verifier failed because Yellow Perch matched both the page h1 and a Catch History h2. That historical run remains failed; PR90 repairs the selector with `level:1` and completes a new fully verified release.

Historical PR89 direct cloud-browser follow-up verified the published home/KB/Catch wording, normal-weight dates below Species, page search, exact runtime icon references, Yellow Perch page/image viewer, Offline Ready for 203 files, real clipboard instruction plus valid JSON, Gear/KB Add Exit to the originating roots and KB Edit Exit to its original item without a warning. The original hosted verifier had already completed actual offline reload before reaching the ambiguous selector. No physical-device inspection or browser-originated repository writes are claimed.

The user explicitly authorized the follow-up PR/release and clarified: “The white border surrounding the green button image should be transparent.” This supersedes the earlier one-PR limit for this correction. No further icon transfer or approval is pending.

The runtime uses the transparent-background edit of `pwa/revised-icon.png` (1,208,529 bytes, 1254 × 1254 RGBA PNG; SHA-256 `e46bcb2260f550380c4df2a42d512bbcd19b24dbf9e987815a0070afd350b922`). The built-in image editor was instructed to remove only the exterior white background and preserve the green button and fish/hook artwork. Alpha inspection and browser regressions verify transparent exterior pixels, retained center opacity, source-derived dimensions and exact served bytes. The original opaque upload remains recoverable in PR89 history (SHA-256 `89a81bac58c460cdb6ccc509b6b240ac84937b619990c6ac9b187ddc4b75980c`). Favicon, manifest and Apple touch icon all use the corrected PNG; offline integrity includes it and older SVG-icon releases remain readable for recovery.

Catch card dates appear directly below Species at regular weight, including derived Catch History cards. Existing search inputs use `Search [page title]`; no new search inputs were added. Knowledge Base card/subtitle reads `Fishing reference library`; Catch Log home-card subtext and list-page heading read `Recorded catches`. Back buttons retain only `Back`.

After a successful Copy Changes, Exit returns edits to their original item and adds to their originating Gear/KB root or category. Exit alone bypasses the unsaved-changes warning. Further edits invalidate the prepared package and remove Exit; ordinary Back, Cancel, navigation and reload remain guarded. Copy text contains an explicit repository implementation/deployment instruction above valid `fishing-companion-change-v2` JSON; manual-copy fallback includes that same instruction. Preparing/copying is not saving. KB Notes remain required; its schema and viewer behavior are unchanged.

## Repository cleanup — September 10, 2026

The user approved the new site's appearance and behavior, then requested repository cleanup. Production source, tests, contracts and migration evidence have moved from root `v2/` into `pwa/`; the preserved icon was the only build dependency on the former v1 `pwa/`. Retained v2 specifications/release references are in `pwa/docs/`. Root `History/`, `Topics/`, obsolete registries/handoffs and v1 runtime/assets/per-item helpers are removed from main, recoverable at `checkpoint/pre-repo-cleanup-20260910` (`edca2a3f04fc8c32dec65b9330d43944be1a561c`). Canonical Gear/KB/Catch bytes, including the newer unreferenced Pflueger image upload, are unchanged. No image adoption or migration rerun.

Add/Edit creates copyable source-change packages, not one-off helper/release files. Routine changes must update canonical files and existing project records; reusable code/tests stay under `pwa/`, and significant release references belong under `pwa/docs/`. No new per-item scripts/release records in either root. Cleanup PR73 is merged and published. [Production run 34490532301](https://github.com/ginosega/fishing/actions/runs/34490532301) passes all 20 core tests, 42 browser scenarios across the two scopes, and all 197 hosted-file comparisons. Cleanup production source `6a64be686cf751720884469b98f2fcc4df94ec6a`, release `d63599a99498d62fdfb1fc22c04643c2`. See [cleanup/release evidence](pwa/docs/Repository_Cleanup_2026-09-10.md).


_Last reconciled: September 11, 2026._

This is the canonical backlog. Preserve source, ownership uncertainty and unrelated work.

## Historical V2 production project state

The following section is dated historical evidence from the initial v2 cutover and does not override the current state or task tables below.

V2 is published at [Fishing Companion](https://ginosega.github.io/fishing/). Production revision `6a64be686cf751720884469b98f2fcc4df94ec6a`, release `d63599a99498d62fdfb1fc22c04643c2`, passed [publication and hosted verification](https://github.com/ginosega/fishing/actions/runs/34490532301). PR64 is merged. The user authorized production and waived another preview review; all seven previously required missing pictures are explicitly deferred. The affected records remain available without pictures. No acceptance or media approval blocks this release.

Validation: 20 core tests, 20 preview-scope and 22 production-scope Chromium/WebKit scenarios, including the actual archived-v1 worker transition and retained browser stores. All 197 hosted files match the verified production build; live navigation, image viewer, offline reload, counts and absent-picture behavior pass. These are automated browser and direct hosted checks, not physical-device inspection.

The sole active pipeline is `.github/workflows/fishing-production.yml`. V1 and the earlier preview are historical; use the production root. V1 sources are archived in Git history and the pre-cleanup checkpoint; exact rollback ZIPs remain in Git. Old browser stores are retained. P2 remains deferred. This authorized Work phase is complete; continue in Chat.


## Current application task register

| ID | Priority | Status | Work item / next action |
|---|---|---|---|
| FISH-TODO-071 | P1 | DONE | Reconcile the approved Inventory and fourteen Design Review decisions into the authoritative baseline. Preserve original responses. PR 62. |
| FISH-TODO-072 | P1 | DONE | Complete the pinned source/dependency/data/media audit and minimal technical contracts. Source and verified-build evidence retained; browser/device gates tracked separately. |
| FISH-TODO-073 | P1 | DONE | P1 implementation and review corrections integrated through PR64; production evidence is in the September10 release record. |
| FISH-TODO-074 | P1 | DONE | Pinned one-time migration completed at `6615ae7296e48d90dceab303b6b5a1fbc041ab80`, run 34328748390 success. Gear 66 → 69, KB 54, Catches 5, exact narrative preservation, 49 approved image adoptions and machine reconciliation. The historical media exceptions were tracked by 078 and are now resolved; production closeout 076 is complete. Do not rerun the original migration. |
| FISH-TODO-075 | P1 | DONE | 20 core tests, 20 preview-scope and 22 production-scope Chromium/WebKit scenarios pass, plus actual hosted verification. Includes actual-v1 worker transition and retained stores; no physical-device inspection claimed. |
| FISH-TODO-076 | P1 | DONE | User-authorized production cutover completed through PR64, consolidated single pipeline, root-scope offline/browser acceptance, hosted-byte verification and record reconciliation. V1 rollback preserved in Git; obsolete publishers and one-time workflows retired in history. |
| FISH-TODO-077 | P2 | DEFERRED | Direct Save/authentication, integrated uploads, Catch browser authoring and offline editing/outbox/sync require separate approval. No P2 infrastructure in P1. |
| FISH-TODO-078 | P2 | DONE | Original production accepted seven required pictures as absent. Tsuridamashii was supplied in PR77; PR79 supplied Rapala Original Floating F-3, Mack's Pee Wee Hoochie, River2Sea Whopper Plopper 60 and Yellow Perch; PR84 supplied the final Popper and Whopper Plopper Gear-Guide pictures. All seven required exceptions are resolved. Generic inline-spinner remains optional. Preserve original migration/media decisions as historical disposition. |
| FISH-TODO-079 | P1 | DONE | User accepted source equivalence and waived a separate device-only IndexedDB export for the pinned migration. No device inspection is claimed. Preserve old stores and reconcile any later-discovered local-only data before retirement. |
| FISH-TODO-080 | P1 | DONE | Reconcile current project records, decisions, TODO, source/technical addenda and bootstrap for temporary Work handoff. Preserve original requirements and complete a cross-file consistency audit. Details in the dated Work Handoff. |
| FISH-TODO-081 | P1 | DONE | Viewer names/selectors, dirty navigation, update/reload race, failed-content retry, atomic release publication and honest Offline Ready state repaired. Regression tests cover corruption, missing assets, quota/promotion failure, old-release immutability and repair. Full hosted gate passes without weakening integrity assertions. |
| FISH-TODO-082 | P1 | DONE | Supplied Word/twelve-screenshot review implemented in PR69 and published through PR64. Verbatim feedback is retained; layout, loading, missing-picture and clipboard success/failure checks pass. |
| FISH-TODO-083 | P1 | DONE | Consolidated production source/tests and PWA references under pwa; removed obsolete root/history/v1 helpers. Current source uploads and rollback preserved. Full CI and hosted verification pass. Routine Add/Edit must not accumulate per-item scaffolding. |
| FISH-TODO-084 | P1 | DONE | All eight UI/authoring refinements from PR89 are live and fully verified after PR90. Origin-aware post-copy Exit, prefixed JSON, Catch dates, search wording, KB/Catch labels and arrow-free Back buttons. Icon transparency correction and verifier closeout completed as FISH085. KB Notes remain required. |
| FISH-TODO-085 | P1 | DONE | User-authorized PR90 made the icon exterior transparent, added alpha/source-byte regression checks and narrowed the hosted Yellow Perch page-heading selector to level 1. Full CI, Pages deployment and complete hosted-byte/browser verification passed; evidence recorded above. |
| FISH-TODO-063 | P2 | SUPERSEDED | Historical v1 KB filename/upload usability issue. V2 approved filename/authoring model replaces old ID-prefix/source-owner requirements; v1 is now historical. |
| FISH-TODO-039 | P2 | SUPERSEDED | Historical structured setup recording on catches. V2 removes setup references; equipment details belong in Catch Notes. |

## Existing fishing, equipment and content backlog

The following items remain open/deferred independently of the v2 rebuild. Their original full descriptions and history remain available in the prior TODO and source documents. Retain explicit purchase uncertainty.

| ID | Priority | Status | Work item |
|---|---|---|---|
| FISH-TODO-005 | P2 | WAITING ON USER | Verify exact installed fish-finder power system; historical Amped Outdoors 12V 8Ah, 3A fuse, IP68 connector and disconnects need confirmation. |
| FISH-TODO-006 | P2 | OPEN | Verify Bonafide RVR119 brass insert thread sizes. |
| FISH-TODO-007 | P2 | OPEN | Decide whether/how to modify rear flush rod-holder angle; preserve Pelican installation details and evaluate alternatives to heat-bending. |
| FISH-TODO-008 | P2 | WAITING ON USER | Confirm whether RVR119 Under Seat Tackle Storage was purchased; do not infer ownership. |
| FISH-TODO-009 | P2 | WAITING ON USER | Confirm whether YakAttack 38 x 13 fish cooler bag was purchased; verify exact SKU/status. |
| FISH-TODO-010 | P2 | OPEN | Buy/consider tubes and internal tube jigheads for Lake Washington/Sammamish smallmouth. |
| FISH-TODO-011 | P2 | OPEN | Buy/consider bullet weights for Texas rigs/Rage Craw. |
| FISH-TODO-012 | P2 | OPEN | Buy/consider 1/8 oz weighted EWG hooks for Power Jerk Shad/depth control. |
| FISH-TODO-013 | P2 | OPEN | Buy/consider Carolina Keepers as slip-sinker alternative. |
| FISH-TODO-014 | P3 | OPEN | Watch for KastKing 3600 deep box. |
| FISH-TODO-015 | P3 | OPEN | Buy/consider Berkley Warpig, 1/2 oz, 3 in, Blue Shad. |
| FISH-TODO-016 | P3 | OPEN | Buy/consider Bait Pop with red flake; water-soluble/shrimp-extract preference. |
| FISH-TODO-017 | P2 | OPEN | Resolve PowerBait still-rig hook size (#4 versus #8). |
| FISH-TODO-018 | P2 | OPEN | Resolve loop-knot guidance conflict. |
| FISH-TODO-019 | P2 | OPEN | Build Texas Rig KB page. |
| FISH-TODO-020 | P3 | OPEN | Build Carolina Rig KB page. |
| FISH-TODO-021 | P3 | OPEN | Build Alabama Rig KB page. |
| FISH-TODO-022 | P3 | OPEN | Build Neko Rig KB page using historical seed references and complete authored article. |
| FISH-TODO-023 | P3 | OPEN | Build Spoons KB page. |
| FISH-TODO-024 | P3 | OPEN | Research Lake Bosworth bass. |
| FISH-TODO-025 | P3 | OPEN | Visit/check Holiday Sports in Burlington. |
| FISH-TODO-026 | P3 | OPEN | Research/join fishing club. |
| FISH-TODO-027 | P2 | OPEN | Buy/consider NRS ATB Wetshoe size 11. |
| FISH-TODO-028 | P2 | OPEN | Buy/consider NRS Champion Jacket and Bib, with neoprene cuffs, waterproof zipper and articulated hood requirements. |
| FISH-TODO-029 | P2 | OPEN | Determine bow-hatch item tie-offs, including tool bag/bilge pump. |
| FISH-TODO-030 | P3 | DEFERRED | Evaluate trailer battery for kayak motor/electronics only if motor project returns. |
| FISH-TODO-031 | P3 | OPEN | Listen/watch Science of the Strike episodes 8 and 16 (dissolved oxygen/turbidity). |
| FISH-TODO-032 | P3 | OPEN | Continue individual structured Catch records, with no trips/no-bite sessions or inferred relationships. |
| FISH-TODO-033 | P3 | OPEN | Create regulations recheck checklist for Fish Washington, lake rules, species identification and bait/retention implications. |
| FISH-TODO-034 | P3 | OPEN | Spot-check authored links in GitHub Preview and PWA. |
| FISH-TODO-037 | P3 | DEFERRED | Multi-user generalization only if a future explicit requirement arises. |

## Historical completion and release references

FISH069/070 were completed in PR 60; FISH068 in PR 58; FISH067 in PR 57; FISH064–066 in PR 54/56; FISH062 in PR 52; FISH061 in PR 50; FISH060 in PR 48/49; FISH058 in PR 47; FISH059 was the Cylinder Weights media release. Complete evidence and the earlier completed-task table are preserved in Git history, the pre-cleanup checkpoint’s `History/2026-09-07-pre-recovery/Fishing_TODO.md` and the dated release files. The historical duplicate FISH060 handoff ID remains retired as `ARCHIVE-2026-09-06-HANDOFF`. The next unused canonical task ID is FISH-TODO-086. No completed task has been reopened or discarded by this reconciliation.
