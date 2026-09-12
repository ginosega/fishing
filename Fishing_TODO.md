# Fishing TODO

## FISH091 production-complete state — September 11, 2026

**FISH-TODO-091 — DONE.** Requirements and design were separately approved, implementation merged in [PR105](https://github.com/ginosega/fishing/pull/105), and production verification completed from source `44fa3bcbff289d2a7aa37c4967e0f5f195b53ca0` / release `01c5ed3535d358086032b0985e2af87b` / [run 34676802369](https://github.com/ginosega/fishing/actions/runs/34676802369). Online-only is now the default; full offline-library preparation/refresh is explicit through **Connection Status → Update offline library**. Failure retention, existing-library fallback, current-online-production behavior and no-library offline state are covered by automated acceptance and hosted verification. FISH077/P2 remains **DEFERRED**. Next unused canonical task ID remains **FISH-TODO-096**.

## FISH095 current task-state reconciliation — September 11, 2026

FISH-TODO-095 is **DONE**. [PR101](https://github.com/ginosega/fishing/pull/101) applied the two validated Fishing Companion KB add packages for **Topwater Fishing** and **Bass Fishing**. Each new Technique keeps the submitted identity/name/type, has required Notes created with the exact body `TODO`, and references the user-uploaded PNG without an invented caption. Before application, both add bases were clean on restored newer `main`; the two pre-uploaded PNGs were preserved byte-for-byte and validated against the package sizes and SHA-256 values: `Topwater Fishing.png` = 1,813,365 bytes / `e2edbf4e6dbad5fb66f10bfa9752d46316b9f174cc8d4b65798609a5f102448a`; `Bass Fishing.png` = 1,948,010 bytes / `1a711ecc4625d025e6ffe74c2f21c52a3a8eee056c744a7df901b2fb7e4b41f8`.

Source-derived regression expectations moved from KB 54 to KB 56 and from 104 to 106 Markdown routes. The first merged content release correctly deployed KB 56, but its hosted verifier still expected KB 54; [PR102](https://github.com/ginosega/fishing/pull/102) changed only that stale verifier expectation. Final production source `620e47943ee9ef38aaa2ff46b0dbe7d4606ef3ba`, release `168554f1b4fe274f0030d389a047fd12`, passed [production run 34656039216](https://github.com/ginosega/fishing/actions/runs/34656039216) through the complete source/core gate, preview- and production-scope Chromium/WebKit acceptance, archived-v1 cutover acceptance, exact-current-main Pages deployment, all **214 hosted v2 file** byte comparisons, and hosted browser/refinement verification.

No schema, domain architecture, Catch behavior, P2/direct-save scope, or FISH091 implementation changed. FISH091 is **DONE / production-verified**; FISH077/P2 remains **DEFERRED**. All unrelated fishing/equipment/content backlog and purchase uncertainty remain preserved. The next unused canonical task ID is **FISH-TODO-096**. Chat remains the permanent default. This reconciliation is documentation-only and does not republish production release `168554f1b4fe274f0030d389a047fd12`.


## Historical FISH090–094 task-state snapshot — September 11, 2026

Current deployed production is source `32759b83305e1dbb3818b676accb0aee3961ddf7`, release `a81d35da0db7b000ed031c17a9387de3`, fully verified by [run 34645325275](https://github.com/ginosega/fishing/actions/runs/34645325275) after FISH094/[PR99](https://github.com/ginosega/fishing/pull/99). The full validation, exact-current-main Pages deployment, hosted-byte and hosted-browser gates passed; hosted verification reported 210 v2 files.

Historical status at this milestone: FISH090 was DONE through PR95/run `34634890084`; FISH091 was waiting on user signoff in requirements-only draft PR96; FISH092 was DONE through PR97/run `34640020315`; FISH093 was DONE through PR98/run `34642839586` attempt 2; FISH094 was DONE through PR99/run `34645325275`; FISH077/P2 remained DEFERRED; and the next unused canonical task ID was FISH-TODO-095. Current FISH091 status is DONE/production-verified in the section above.

## FISH089 location-picture production closeout — September 11, 2026

FISH-TODO-089 is DONE through [PR94](https://github.com/ginosega/fishing/pull/94). Production source `5f413021f51a7d48ea8f7f96e99d9a81db9ee0a6`, release `7a7f62759f668cda0eece08125e798b2`, passed [production run 34625693090](https://github.com/ginosega/fishing/actions/runs/34625693090) through the full gate, exact-current-main Pages deployment, 209 hosted v2 files and complete hosted byte/browser verification. The four validated KB packages replaced Cranberry Lake's picture association, added pictures for Lake Sammamish, Mayfield Lake and Silver Lake, and applied the requested Mayfield description; all four Notes files were kept unchanged. Exact pre-uploaded image bytes were preserved.

FISH084–089 are DONE. FISH077/P2 remains DEFERRED. All unrelated fishing/equipment/content backlog and purchase uncertainty are preserved. The next unused canonical task ID is FISH-TODO-090. This documentation reconciliation does not redeploy the application.

## FISH088 Kingforest inline-spinner production closeout — September 11, 2026

FISH-TODO-088 is DONE through [PR93](https://github.com/ginosega/fishing/pull/93). Production source `364a599a4eeb51457ece46457d738ebb4f0d82f3`, release `97e6a320ed42c432b875de9fe8c2ef25`, passed [production run 34621210887](https://github.com/ginosega/fishing/actions/runs/34621210887) through the full gate, exact-current-main Pages deployment, 206 hosted v2 files and complete hosted byte/browser verification. The validated package renamed the inline spinner to Kingforest, replaced Notes, and references the exact user-uploaded 430,419-byte PNG (SHA-256 `57416d3c9d6dcee3e4fabfc324bd281756be5c9ff5cfc2b5a41affbbaaec8b14`). Source-derived inventory/missing-picture regression expectations were updated accordingly; no schema, architecture or P2 scope changed.

FISH084–088 are DONE. FISH077/P2 remains DEFERRED. All unrelated fishing/equipment/content backlog and purchase uncertainty are preserved. The next unused canonical task ID is FISH-TODO-089. This documentation reconciliation does not redeploy the application.

## FISH087 KB authoring batch production closeout — September 11, 2026

FISH-TODO-087 is DONE through [PR92](https://github.com/ginosega/fishing/pull/92). Production source `dee0ff76f6b15e861fa8864151aad88c8fe28f5e`, release `40c849b4014013f22200843c9d222c2c`, passed [production run 34614884273](https://github.com/ginosega/fishing/actions/runs/34614884273), including complete validation, exact-current-main Pages deployment, all 205 hosted-file comparisons and hosted browser verification. The restored `KB/Locations/content/lake-bosworth.md` is present in the deployed release.

FISH084–087 are DONE. FISH077/P2 remains DEFERRED. All unrelated fishing/equipment/content backlog and purchase uncertainty are preserved. The next unused canonical task ID is FISH-TODO-088. This documentation reconciliation does not redeploy the application.

## Icon filename cleanup and current state — September 11, 2026

FISH-TODO-086 is DONE through [PR91](https://github.com/ginosega/fishing/pull/91). Current production source `afd7afc9ee91fb3dc81a15635e14ec932bda2b1b`, release `11789b7bace383d161add0ac7d313579`, passed [production run 34608018650](https://github.com/ginosega/fishing/actions/runs/34608018650): 21 core tests, 24 preview-scope and 26 production-scope Chromium/WebKit scenarios, archived-v1 transition, exact-current-main Pages deployment, all 205 hosted-file comparisons and complete hosted browser verification.

The approved transparent PNG is now `pwa/icon.png`; its bytes are unchanged (SHA-256 `e46bcb2260f550380c4df2a42d512bbcd19b24dbf9e987815a0070afd350b922`). The obsolete `pwa/icon.svg` and former `pwa/revised-icon.png` paths are removed from current source. New builds use `icon.png` for the manifest, favicon and Apple touch icon. Historical filenames remain accepted only by release validation and compatibility tests so retained cached releases stay readable. Git history retains both removed paths. Canonical Gear/KB/Catch files are unchanged.

FISH084, FISH085 and FISH086 are complete; PR89–PR91 are merged and no release or icon work remains pending. P2/FISH077 remains deferred, all unrelated backlog is retained, and next unused task ID is FISH-TODO-087. Continue in Chat using actual latest main. This documentation reconciliation does not redeploy.

## Historical Chat handoff audit — before icon filename cleanup

Restored and audited GitHub main `36d894439632b45aa358c7a93a38b19dff822875` before this documentation-only handoff. Its changes after production source `240dbfa67a1810ef51fde24f7bd0fb1d1c867bcf` are documentation only; the deployed release remains `c15f12f49c4162706fb14eb2791e3204`. Production run `34566907478` is successful; PR89 and PR90 are merged, no PRs are open and no release jobs are queued or running at this audit. This handoff does not require another build or deployment.

FISH084 and FISH085 are DONE; no UI, icon-transfer, verifier or production-acceptance work remains from this chat. FISH077/P2 stays DEFERRED. All unrelated TODO rows and purchase uncertainties are retained; next unused task ID is FISH-TODO-086. Resume by reading actual latest main, then respond to the user's next requested work rather than restarting a completed release. The bootstrap, Context, TODO, Decision Log, README and affected PWA records were cross-checked for release identity, icon state, completed tasks, deferred scope and Chat-default instructions.

## Previous production state — before icon filename cleanup

At the PR90 milestone, production source was `240dbfa67a1810ef51fde24f7bd0fb1d1c867bcf`, published and fully verified in [run 34566907478](https://github.com/ginosega/fishing/actions/runs/34566907478); release `c15f12f49c4162706fb14eb2791e3204` contains 205 hosted files. PR77 supplied Tsuridamashii; PR79 supplied Rapala Original Floating, Mack's Pee Wee Hoochie, River2Sea Whopper Plopper 60 and Yellow Perch and replaced Rebel Pop-R; PR81 updated Kokanee/Largemouth/Smallmouth; PR84 supplied the final Popper and Whopper Plopper Gear-Guide pictures. All seven originally deferred required pictures are now resolved. FISH078 is DONE. Generic inline-spinner remains optional.

## PR89/PR90 production closeout — historical release evidence

FISH-TODO-084 and FISH-TODO-085 are DONE. The eight UI/authoring refinements from PR89 and the user-authorized icon transparency/verifier correction in [PR90](https://github.com/ginosega/fishing/pull/90) are live at production source `240dbfa67a1810ef51fde24f7bd0fb1d1c867bcf`, release `c15f12f49c4162706fb14eb2791e3204`. [Production run 34566907478](https://github.com/ginosega/fishing/actions/runs/34566907478) is green: 20 core tests, 24 preview-scope and 26 production-scope Chromium/WebKit scenarios, archived-v1 worker/store transition, exact-current-main Pages deployment, all 205 hosted-file comparisons and the complete hosted browser verifier passed. PR90 CI [run 34566584530](https://github.com/ginosega/fishing/actions/runs/34566584530) also passed.

Historical PR89 evidence: source `1f3f6df97390db186303148dcb5fa62ad0ba90e9`, release `7572c94504e4482c9987828b95a653f6`, [run 34565111477](https://github.com/ginosega/fishing/actions/runs/34565111477) published successfully and compared all 205 hosted files, but its browser verifier failed because Yellow Perch matched both the page h1 and a Catch History h2. That historical run remains failed; PR90 repairs the selector with `level:1` and completes a new fully verified release.

Historical PR89 direct cloud-browser follow-up verified the published home/KB/Catch wording, normal-weight dates below Species, page search, exact runtime icon references, Yellow Perch page/image viewer, Offline Ready for 203 files, real clipboard instruction plus valid JSON, Gear/KB Add Exit to the originating roots and KB Edit Exit to its original item without a warning. The original hosted verifier had already completed actual offline reload before reaching the ambiguous selector. No physical-device inspection or browser-originated repository writes are claimed.

The user explicitly authorized the follow-up PR/release and clarified: “The white border surrounding the green button image should be transparent.” This supersedes the earlier one-PR limit for this correction. No further icon transfer or approval is pending.

The PR90 runtime used the transparent-background edit of `pwa/revised-icon.png` (renamed without byte changes to `pwa/icon.png` in PR91) (1,208,529 bytes, 1254 × 1254 RGBA PNG; SHA-256 `e46bcb2260f550380c4df2a42d512bbcd19b24dbf9e987815a0070afd350b922`). The built-in image editor was instructed to remove only the exterior white background and preserve the green button and fish/hook artwork. Alpha inspection and browser regressions verify transparent exterior pixels, retained center opacity, source-derived dimensions and exact served bytes. The original opaque upload remains recoverable in PR89 history (SHA-256 `89a81bac58c460cdb6ccc509b6b240ac84937b619990c6ac9b187ddc4b75980c`). Favicon, manifest and Apple touch icon all use the corrected PNG; offline integrity includes it and older SVG-icon releases remain readable for recovery.

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
| FISH-TODO-078 | P2 | DONE | Original production accepted seven required pictures as absent. Tsuridamashii was supplied in PR77; PR79 supplied Rapala Original Floating F-3, Mack's Pee Wee Hoochie, River2Sea Whopper Plopper 60 and Yellow Perch; PR84 supplied the final Popper and Whopper Plopper Gear-Guide pictures. All seven required exceptions are resolved. The historically optional generic inline-spinner picture was later supplied by the user and associated in FISH088/PR93. Preserve original migration/media decisions as historical disposition. |
| FISH-TODO-079 | P1 | DONE | User accepted source equivalence and waived a separate device-only IndexedDB export for the pinned migration. No device inspection is claimed. Preserve old stores and reconcile any later-discovered local-only data before retirement. |
| FISH-TODO-080 | P1 | DONE | Reconcile current project records, decisions, TODO, source/technical addenda and bootstrap for temporary Work handoff. Preserve original requirements and complete a cross-file consistency audit. Details in the dated Work Handoff. |
| FISH-TODO-081 | P1 | DONE | Viewer names/selectors, dirty navigation, update/reload race, failed-content retry, atomic release publication and honest Offline Ready state repaired. Regression tests cover corruption, missing assets, quota/promotion failure, old-release immutability and repair. Full hosted gate passes without weakening integrity assertions. |
| FISH-TODO-082 | P1 | DONE | Supplied Word/twelve-screenshot review implemented in PR69 and published through PR64. Verbatim feedback is retained; layout, loading, missing-picture and clipboard success/failure checks pass. |
| FISH-TODO-083 | P1 | DONE | Consolidated production source/tests and PWA references under pwa; removed obsolete root/history/v1 helpers. Current source uploads and rollback preserved. Full CI and hosted verification pass. Routine Add/Edit must not accumulate per-item scaffolding. |
| FISH-TODO-084 | P1 | DONE | All eight UI/authoring refinements from PR89 are live and fully verified after PR90. Origin-aware post-copy Exit, prefixed JSON, Catch dates, search wording, KB/Catch labels and arrow-free Back buttons. Icon transparency correction and verifier closeout completed as FISH085. KB Notes remain required. |
| FISH-TODO-085 | P1 | DONE | User-authorized PR90 made the icon exterior transparent, added alpha/source-byte regression checks and narrowed the hosted Yellow Perch page-heading selector to level 1. Full CI, Pages deployment and complete hosted-byte/browser verification passed; evidence recorded above. |
| FISH-TODO-086 | P1 | DONE | PR91 renamed the transparent icon to icon.png without byte changes, removed unused icon.svg, updated build/manifest/favicon/Apple/hosted references and retained historical-name cache compatibility. Full CI and production hosted verification passed; evidence above. |
| FISH-TODO-087 | P1 | DONE | PR92 applied the validated KB location/species authoring batch and the matching Species-subtitle regression correction. Production source `dee0ff76f6b15e861fa8864151aad88c8fe28f5e`, release `40c849b4014013f22200843c9d222c2c`, run 34614884273 passed full CI, Pages deployment, 205 hosted-file comparisons and hosted browser verification. Lake Bosworth restoration is included in the verified production tree. |
| FISH-TODO-088 | P1 | DONE | PR93 applied the validated Kingforest inline-spinner Gear edit, preserving the pre-existing exact user-uploaded PNG and updating only source-derived regression expectations. Production source `364a599a4eeb51457ece46457d738ebb4f0d82f3`, release `97e6a320ed42c432b875de9fe8c2ef25`, run 34621210887 passed full CI, exact-current-main Pages deployment, 206 hosted v2 files and complete hosted byte/browser verification. |
| FISH-TODO-089 | P1 | DONE | PR94 applied four validated KB location-picture packages: Cranberry Lake picture replacement, Lake Sammamish/Mayfield Lake/Silver Lake picture additions, and the requested Mayfield description. Notes stayed unchanged and exact pre-uploaded image bytes were preserved. Production source `5f413021f51a7d48ea8f7f96e99d9a81db9ee0a6`, release `7a7f62759f668cda0eece08125e798b2`, run 34625693090 passed full CI, exact-current-main Pages deployment, 209 hosted v2 files and complete hosted byte/browser verification. |
| FISH-TODO-090 | P1 | DONE | PR95 fixed Edit Gear so an existing record with no `links` can add its first link, then replaced canonical `pwa/icon.png` with the exact user-uploaded icon-v3 bytes (1,541,464 bytes; 1254×1254 RGBA; SHA-256 `055cea4acde10ac18a74cc0a42f03a03190ea4a12df17acc0d5808a1637b822a`) and removed temporary `icon-v3.png`. Production source `470c74472e569010b81659c86fdd60937d6a9159`, run 34634890084 passed the complete gate and hosted verification. |
| FISH-TODO-091 | P1 | DONE | Requirements and abbreviated design were separately approved through PR103/PR104; PR105 implemented the online-only default and explicit verified offline-library preparation. Production source `44fa3bcbff289d2a7aa37c4967e0f5f195b53ca0`, release `01c5ed3535d358086032b0985e2af87b`, run `34676802369` passed the full production, exact-current-main, hosted-byte and hosted-browser gates. |
| FISH-TODO-092 | P1 | DONE | PR97 made `content/` and `assets/` durable across all five KB categories, added `KB/README.md`, and added source-layout regression coverage while preserving intentional Gear-Guide reuse of canonical Gear pictures. Production source `ef883688c3f0786e35821f0baca5394c8f2156a5`, run 34640020315 passed the full production gate and hosted verification. |
| FISH-TODO-093 | P1 | DONE | PR98 made `assets/` and `content/` durable across all eight Gear categories, including Bait and Hooks, added `Gear/README.md`, and added structural regression coverage without changing Gear records. Production source `347beab04ce60bb372c390bd8820b25c3d7b6314`, run 34642839586 attempt 2 passed the full production gate and hosted verification. |
| FISH-TODO-094 | P1 | DONE | PR99 applied the validated Trout Fishing KB package only: description `Casting, bank-fishing, still-fishing, and kayak-trolling guidance`, picture `KB/Techniques/assets/Trout Fishing.png`, no invented caption, Notes unchanged and exact pre-uploaded image bytes preserved (1,867,783 bytes; SHA-256 `7f883a4d7d6bbc5dfba152414ac81513f5bac8c896648769349e85bebd220306`). Production source `32759b83305e1dbb3818b676accb0aee3961ddf7`, release `a81d35da0db7b000ed031c17a9387de3`, run 34645325275 passed the complete gate, exact-current-main Pages deployment, 210 hosted v2 files and hosted byte/browser verification. |
| FISH-TODO-095 | P1 | DONE | PR101 added Topwater Fishing and Bass Fishing Technique records with exact `TODO` Notes and validated pre-uploaded PNG bytes; PR102 corrected the hosted verifier’s stale KB count. Production source `620e47943ee9ef38aaa2ff46b0dbe7d4606ef3ba`, release `168554f1b4fe274f0030d389a047fd12`, run `34656039216` passed full CI, Pages deployment, 214 hosted-file comparisons and hosted browser verification. |
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

FISH069/070 were completed in PR 60; FISH068 in PR 58; FISH067 in PR 57; FISH064–066 in PR 54/56; FISH062 in PR 52; FISH061 in PR 50; FISH060 in PR 48/49; FISH058 in PR 47; FISH059 was the Cylinder Weights media release. Complete evidence and the earlier completed-task table are preserved in Git history, the pre-cleanup checkpoint’s `History/2026-09-07-pre-recovery/Fishing_TODO.md` and the dated release files. The historical duplicate FISH060 handoff ID remains retired as `ARCHIVE-2026-09-06-HANDOFF`. The next unused canonical task ID is FISH-TODO-096. No completed task has been reopened or discarded by this reconciliation.