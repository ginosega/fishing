# Fishing Companion v2 production release — September 10, 2026

Status: implementation and acceptance in progress; production publication not yet claimed.

## Authorization and scope

The user directed “take this all the way to production; I don't need to test these changes in preview, let's go ahead with this build.” After the seven missing pictures were identified, the user said “Yes, omit those, and those gear and KB items can just have no picture. I will add these to the site later.” This resolves both cutover and media gates. Gear Tsuridamashii ball-bearing snap swivels, Rapala Original Floating F-3, Mack's Pee Wee Hoochie and River2Sea Whopper Plopper 60, plus KB Perch, Popper and Whopper Plopper, retain absent pictures. Generic inline-spinner remains optional. Future user-supplied pictures use normal source validation. No new images or migration rerun.

The first-review corrections are preserved from PR69. The migration still contains Gear69/KB54/Catches5 and six independent rod/reel components, with 49 approved archived image adoptions. Catch is read-only; P2 remains deferred.

## Production-specific implementation

The loader verifies the service-worker protocol before loading release data; v1 and v2 share the same root worker URL. The actual preserved v1 build is exercised during cutover acceptance, including retained IndexedDB and caches. No browser stores are deleted. Preview-scope and production-scope suites run in Chromium and WebKit, retaining complete verified library, corruption/retry/rollback, dirty forms, authoring and responsive layout coverage. Production has no visible release diagnostics or missing-picture boxes.

`fishing-production.yml` is the sole active pipeline: locked audit, core validation, both scope suites, root build, exact-current-main guard, serialized Pages publication and actual hosted-byte/browser verification. It replaces competing v1/preview publishers and one-time migration/workspace scaffolding; all prior workflows and evidence remain in Git history. The root source application is v2; old pwa sources are retained as historical recovery/reference, not automatically rebuilt or deployed.

## Recovery

Checkpoint `checkpoint/v1-before-v2-preview-20260909`, commit `4aafcd2f88b35bb34b608e2f85dec1daffc6c1d1`, preserves `recovery/v1-production.zip` (SHA-256 `fc036dc92dbf25a250917f8236c22099b798be1d5f2aa7274f6df9cb5215396e`) and historical `recovery/v1-migration-source.zip` (`83100e9cf2788b2d33959b39a6bb63fdd0e78c5e512936a07e46b22632bf7dbf`). Each production gate verifies both Git-held archives. To recover v1, publish the extracted production ZIP through one serialized Pages deployment; retain browser stores. Recovery does not depend on expiring artifacts or this workspace.

## Evidence

Local production build, byte verification and 20 core tests pass. Hosted browser/root-cutover results and publication revision will be recorded after the gate completes.
