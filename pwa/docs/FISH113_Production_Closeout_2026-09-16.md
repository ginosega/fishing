# FISH113 Production Closeout — 2026-09-16

## Status

**IMPLEMENTED / PRODUCTION-VERIFIED / USER-VERIFIED / CLOSED**

FISH113 adds scenic page-header artwork to the Fishing Companion Home, My Gear, and Knowledge Base root pages and uses responsive art direction so wide landscape layouts preserve the intended mountain/lake composition without excessive vertical cropping.

## Final artwork

Authoritative source assets:

- `pwa/assets/page-hero/page-hero.png` — 1536 × 512 (3:1)
- `pwa/assets/page-hero/page-hero-wide.png` — 3072 × 512 (6:1)

The 3:1 asset is pixel-for-pixel the exact centered crop of the 6:1 master. Regression coverage verifies this relationship so the responsive swap remains visually seamless.

The superseded WebP hero asset was removed. The PNG pair above is the authoritative artwork.

## Final behavior

- Scenic hero appears only on root Home, My Gear, and Knowledge Base routes.
- Standard/narrow layouts use `page-hero.png`.
- Sufficiently wide landscape layouts use `page-hero-wide.png`.
- The wide layout uses geometry-based responsive behavior rather than display-resolution detection.
- Existing page wording, cards, routes, search/Back behavior, and non-root headers remain unchanged.
- The hero keeps the existing dark overlay treatment for title/subtitle legibility.

## Implementation and release evidence

Final responsive-art-direction implementation:

- PR: #173
- merged source revision: `fab438e2833b131204a5e4c29ab1685df0ae8fbf`

Full Application production release:

- workflow run number: #312
- workflow run ID: `35139240830`
- hosted release ID: `6a1f85979ecabc197ec66368b9fe0a65`
- hosted source revision: `fab438e2833b131204a5e4c29ab1685df0ae8fbf`
- hosted file count: 380
- hosted source-derived counts: Gear 82 / KB 57 / Catch 5

The first production validation attempt was blocked by one unrelated timing-sensitive WebKit offline-cache test. A targeted retry of the failed validation job passed without any FISH113 code change. The Full Application deployment then completed successfully.

Production verification passed the exact-current-main guard, GitHub Pages deployment, actual hosted byte/release identity checks, production browser behavior, offline-library flows, navigation, counts, pinned Knot ordering, image viewer, FISH096 Knot authoring checks, and FISH103 link/preview checks.

The deployed release contains both final hero assets under the content-addressed release path.

## User verification

After production deployment, the user visually inspected the responsive hero on the live site, including the wide-screen behavior, and confirmed: **“It’s great. No more adjustments are needed.”**

FISH113 is therefore closed.

## Next application task ID

The next unused application/architecture task ID is **FISH-TODO-114**, unless newer `main` has already allocated it. Routine FISH108 Fast Content Releases do not consume application task IDs.
