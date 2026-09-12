# Fishing Companion v2 production release — September 10, 2026

## FISH095 production closeout — September 11, 2026

FISH095 is fully closed in production. [PR101](https://github.com/ginosega/fishing/pull/101) added the Topwater Fishing and Bass Fishing Technique records with exact `TODO` Notes and exact validated pre-uploaded PNG bytes. [PR102](https://github.com/ginosega/fishing/pull/102) repaired the hosted verifier after the first deployment exposed its stale KB=54 expectation; the live content itself was already correct. Final production source `620e47943ee9ef38aaa2ff46b0dbe7d4606ef3ba`, release `168554f1b4fe274f0030d389a047fd12`, [run 34656039216](https://github.com/ginosega/fishing/actions/runs/34656039216) passed the full acceptance pipeline, exact-current-main Pages deployment, **214 hosted v2 file** byte comparisons and hosted browser/refinement verification.

The package images were not rewritten: Topwater Fishing PNG SHA-256 `e2edbf4e6dbad5fb66f10bfa9752d46316b9f174cc8d4b65798609a5f102448a`; Bass Fishing PNG SHA-256 `1a711ecc4625d025e6ffe74c2f21c52a3a8eee056c744a7df901b2fb7e4b41f8`. No captions were invented. Canonical counts are now Gear 69 / KB 56 / Catches 5, with 106 Markdown routes. No schema, architecture, Catch or P2 scope changed.

Later documentation reconciliation is non-runtime and does **not** republish or alter release `168554f1b4fe274f0030d389a047fd12`.


## Current verified production — FISH094, September 11, 2026

Current deployed production source is `32759b83305e1dbb3818b676accb0aee3961ddf7`, release `a81d35da0db7b000ed031c17a9387de3`, produced by FISH094/[PR99](https://github.com/ginosega/fishing/pull/99) and fully verified in [production run 34645325275](https://github.com/ginosega/fishing/actions/runs/34645325275). The run passed source/core validation, preview- and production-scope Chromium/WebKit acceptance, archived-v1 cutover acceptance, the exact-current-main guard, Pages deployment, hosted-byte verification and hosted-browser verification. Hosted verification reported 210 v2 files and passed production navigation, counts, image viewer, complete offline reload, absent-picture behavior and no release diagnostics.

FISH094 applied only the validated `technique-trout-fishing` package. The submitted record hash and base description matched current source. The deployed description is `Casting, bank-fishing, still-fishing, and kayak-trolling guidance`; the record references `KB/Techniques/assets/Trout Fishing.png`; no caption was invented; `KB/Techniques/content/trout-fishing.md` remained unchanged. The PNG had already been uploaded separately and was preserved byte-for-byte at 1,867,783 bytes with SHA-256 `7f883a4d7d6bbc5dfba152414ac81513f5bac8c896648769349e85bebd220306`.

Preceding completed production milestones now reconciled into project state: FISH090/[PR95](https://github.com/ginosega/fishing/pull/95), source `470c74472e569010b81659c86fdd60937d6a9159`, run `34634890084`; FISH092/[PR97](https://github.com/ginosega/fishing/pull/97), source `ef883688c3f0786e35821f0baca5394c8f2156a5`, run `34640020315`; and FISH093/[PR98](https://github.com/ginosega/fishing/pull/98), source `347beab04ce60bb372c390bd8820b25c3d7b6314`, successful run `34642839586` attempt 2. FISH090 fixed first-link editing and replaced canonical `pwa/icon.png` with exact user-uploaded bytes (1,541,464 bytes; 1254×1254 RGBA; SHA-256 `055cea4acde10ac18a74cc0a42f03a03190ea4a12df17acc0d5808a1637b822a`). FISH092 normalized durable KB category `content/` + `assets/`; FISH093 normalized durable Gear category `assets/` + `content/`.

Historical snapshot — FISH091/[draft PR96](https://github.com/ginosega/fishing/pull/96) is requirements-only, WAITING ON USER and **not part of this production release**. No online-only-default runtime/service-worker/loader/UI/build/test implementation is authorized until requirements and a separate abbreviated design receive user signoff. FISH077/P2 remains DEFERRED. Next unused canonical task ID is FISH-TODO-095.

The documentation-only reconciliation after this release does not republish or alter release `a81d35da0db7b000ed031c17a9387de3`.

## FISH087 KB authoring batch production closeout — September 11, 2026

FISH-TODO-087 is DONE through [PR92](https://github.com/ginosega/fishing/pull/92). Verified production source `dee0ff76f6b15e861fa8864151aad88c8fe28f5e`, release `40c849b4014013f22200843c9d222c2c`, passed [production run 34614884273](https://github.com/ginosega/fishing/actions/runs/34614884273). The run completed source/core validation, preview- and production-scope browser acceptance, archived-v1 cutover acceptance, exact-current-main guard, Pages deployment, all 205 hosted-file comparisons and complete hosted browser verification.

Hosted verification reported production navigation, counts, image viewer, complete offline reload, absent-picture behavior and no release diagnostics as passing. The deployed release includes the user-restored `KB/Locations/content/lake-bosworth.md`. PR92 applied the validated KB location/species authoring batch and one matching browser-regression update to expect no Species subtitle after intentional description removal. No schema, architecture, picture, direct-Save/P2 or broader release policy changed.

The later documentation reconciliation updates project records only. It does not republish or alter release `40c849b4014013f22200843c9d222c2c`.

## Icon filename cleanup and current state — September 11, 2026

FISH-TODO-086 is DONE through [PR91](https://github.com/ginosega/fishing/pull/91). Current production source `afd7afc9ee91fb3dc81a15635e14ec932bda2b1b`, release `11789b7bace383d161add0ac7d313579`, passed [production run 34608018650](https://github.com/ginosega/fishing/actions/runs/34608018650): 21 core tests, 24 preview-scope and 26 production-scope Chromium/WebKit scenarios, archived-v1 transition, exact-current-main Pages deployment, all 205 hosted-file comparisons and complete hosted browser verification.

The approved transparent PNG is now `pwa/icon.png`; its bytes are unchanged (SHA-256 `e46bcb2260f550380c4df2a42d512bbcd19b24dbf9e987815a0070afd350b922`). The obsolete `pwa/icon.svg` and former `pwa/revised-icon.png` paths are removed from current source. New builds use `icon.png` for the manifest, favicon and Apple touch icon. Historical filenames remain accepted only by release validation and compatibility tests so retained cached releases stay readable. Git history retains both removed paths. Canonical Gear/KB/Catch files are unchanged.

FISH084, FISH085 and FISH086 are complete; PR89–PR91 are merged and no release or icon work remains pending. P2/FISH077 remains deferred, all unrelated backlog is retained, and next unused task ID is FISH-TODO-087. Continue in Chat using actual latest main. This documentation reconciliation does not redeploy.

## Historical Chat handoff audit — before icon filename cleanup

Rechecked latest main `36d894439632b45aa358c7a93a38b19dff822875` and successful production run `34566907478`. Later commits are documentation only; source `240dbfa67a1810ef51fde24f7bd0fb1d1c867bcf` and release `c15f12f49c4162706fb14eb2791e3204` remain the verified production pair. No release is pending. Current handoff, scope and Chat-default policy: [Context](../../Fishing_Context.md) and [bootstrap](../../Fishing_New_Chat_Bootstrap_Prompt.md).

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

V2 is published at [Fishing Companion](https://ginosega.github.io/fishing/). Production revision `ceef1df0dd8b204e7aa59c63e95a0d75346f4a92`, release `7ff6f62d921d5e86e0d97ae89b361120`, passed [publication and hosted verification](https://github.com/ginosega/fishing/actions/runs/34441600093). PR64 is merged. The user authorized production and waived another preview review; all seven previously required missing pictures are explicitly deferred. The affected records remain available without pictures. No acceptance or media approval blocks this release.

Validation: 20 core tests, 20 preview-scope and 22 production-scope Chromium/WebKit scenarios, including the actual archived-v1 worker transition and retained browser stores. All 197 hosted files match the verified production build; live navigation, image viewer, offline reload, counts and absent-picture behavior pass. These are automated browser and direct hosted checks, not physical-device inspection.

The sole active pipeline is `.github/workflows/fishing-production.yml`. V1 and the earlier preview are historical; use the production root. V1 sources and exact rollback ZIPs remain in Git. Old browser stores are retained. P2 remains deferred. This authorized Work phase is complete; continue in Chat.


## Authorization and scope

The user directed “take this all the way to production; I don't need to test these changes in preview, let's go ahead with this build.” After the seven missing pictures were identified, the user said “Yes, omit those, and those gear and KB items can just have no picture. I will add these to the site later.” This resolves both cutover and media gates. Gear Tsuridamashii ball-bearing snap swivels, Rapala Original Floating F-3, Mack's Pee Wee Hoochie and River2Sea Whopper Plopper 60, plus KB Perch, Popper and Whopper Plopper, retain absent pictures. Generic inline-spinner remains optional. Future user-supplied pictures use normal source validation. No new images or migration rerun.

The first-review corrections are preserved from PR69. The migration still contains Gear69/KB54/Catches5 and six independent rod/reel components, with 49 approved archived image adoptions. Catch is read-only; P2 remains deferred.

## Production-specific implementation

The loader verifies the service-worker protocol before loading release data; v1 and v2 share the same root worker URL. The actual preserved v1 build is exercised during cutover acceptance, including retained IndexedDB and caches. No browser stores are deleted. Preview-scope and production-scope suites run in Chromium and WebKit, retaining complete verified library, corruption/retry/rollback, dirty forms, authoring and responsive layout coverage. Production has no visible release diagnostics or missing-picture boxes.

`fishing-production.yml` is the sole active pipeline: locked audit, core validation, both scope suites, root build, exact-current-main guard, serialized Pages publication and actual hosted-byte/browser verification. It replaces competing v1/preview publishers and one-time migration/workspace scaffolding; all prior workflows and evidence remain in Git history. The root source application is v2; old pwa sources are retained as historical recovery/reference, not automatically rebuilt or deployed.

## Recovery

Checkpoint `checkpoint/v1-before-v2-preview-20260909`, commit `4aafcd2f88b35bb34b608e2f85dec1daffc6c1d1`, preserves `recovery/v1-production.zip` (SHA-256 `fc036dc92dbf25a250917f8236c22099b798be1d5f2aa7274f6df9cb5215396e`) and historical `recovery/v1-migration-source.zip` (`83100e9cf2788b2d33959b39a6bb63fdd0e78c5e512936a07e46b22632bf7dbf`). Each production gate verifies both Git-held archives. To recover v1, publish the extracted production ZIP through one serialized Pages deployment; retain browser stores. Recovery does not depend on expiring artifacts or this workspace.

## Evidence

Current-base integration gate [34441204142](https://github.com/ginosega/fishing/actions/runs/34441204142) and main publication [34441600093](https://github.com/ginosega/fishing/actions/runs/34441600093) pass. PR64 merged at `ceef1df0dd8b204e7aa59c63e95a0d75346f4a92`; production release `7ff6f62d921d5e86e0d97ae89b361120`. Twenty core tests, 20 preview-scope and 22 production-scope browser scenarios pass. All 197 actual hosted files match; production scope, counts69/54/5, images, viewer, absent-picture pages, offline reload and no release diagnostics verified. Direct cloud-browser review also completed, including the existing v1 session transition. No physical-device inspection is claimed.

The old preview is superseded by the root production URL. The main documentation-only closeout reconciles README, Context, TODO, Decision Log, source/technical addenda and bootstrap without republishing code. Original baseline/user responses and canonical source bytes remain unchanged.

## FISH091 production milestone — September 11, 2026

FISH091 subsequently superseded the earlier requirements-only snapshot in this release history. [PR105](https://github.com/ginosega/fishing/pull/105) merged the approved online-only-default implementation. Production source `44fa3bcbff289d2a7aa37c4967e0f5f195b53ca0` built release `01c5ed3535d358086032b0985e2af87b` in [run 34676802369](https://github.com/ginosega/fishing/actions/runs/34676802369); 214 hosted v2 files were byte-verified and hosted browser verification passed, including online-only first use, explicit complete-library preparation and offline reload. FISH077/P2 remains DEFERRED.
