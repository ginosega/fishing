# Fishing Companion v2 production release — September 10, 2026

## FISH084 production closeout — September 11, 2026

FISH-TODO-084's eight UI/authoring changes are implemented and live through the single PR89 production release: source `1f3f6df97390db186303148dcb5fa62ad0ba90e9`, release `7572c94504e4482c9987828b95a653f6`. [Production run 34565111477](https://github.com/ginosega/fishing/actions/runs/34565111477) passed all 20 core tests, 24 preview-scope and 26 production-scope Chromium/WebKit scenarios, the archived-v1 transition, Pages publication and exact comparisons of all 205 hosted files. Its subsequent hosted browser verifier failed on an ambiguous Yellow Perch heading: the page h1 and the new Catch-card h2 now share that text. The workflow is NOT green.

Direct cloud-browser follow-up verified the published home/KB/Catch wording, normal-weight dates below Species, page search, exact runtime icon references, Yellow Perch page/image viewer, Offline Ready for 203 files, real clipboard instruction plus valid JSON, Gear/KB Add Exit to the originating roots and KB Edit Exit to its original item without a warning. The original hosted verifier had already completed actual offline reload before reaching the ambiguous selector. No physical-device inspection or browser-originated repository writes are claimed.

FISH-TODO-085 tracks the permanent verifier-only selector correction (`level:1` for the Yellow Perch page-heading locator) and automated verification closeout. The user's one-PR/one-release instruction prevents silently adding a follow-up PR/release; that exception requires user direction. No second release was made.

The runtime uses the exact user-uploaded `pwa/revised-icon.png` (1,243,451 bytes, 1254 × 1254 PNG; SHA-256 `89a81bac58c460cdb6ccc509b6b240ac84937b619990c6ac9b187ddc4b75980c`). The older documentation reference is historical and was not substituted. The favicon, manifest and Apple touch icon use this image; complete offline release integrity includes it and older SVG-icon releases remain readable for recovery.

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
