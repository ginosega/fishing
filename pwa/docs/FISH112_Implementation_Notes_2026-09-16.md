# FISH112 Implementation Notes — Fixed Cross-Platform Card Icons

FISH112 replaces platform-dependent rendered card emoji with a fixed bundled PNG set while preserving the existing Home, My Gear, and Knowledge Base layouts, card geometry, labels, navigation, search/Back controls, and approximately the existing 45 px icon slot.

## Production asset set

The approved final artwork is stored under `pwa/assets/card-icons/` as 16 transparent PNGs with retained soft shadows:

- Home: My Gear, Knowledge Base, Catch Log
- My Gear: Rods & Reels, Line, Weights, Snaps & Swivels, Hooks, Lures, Bait, Equipment
- Knowledge Base: Locations, Species, Techniques, Knots, Gear Guides

The final files are project-generated artwork rather than bundled copies of Google/Noto, Microsoft Fluent, Twemoji, or other third-party icon source files, so no third-party icon asset attribution is required for the packaged PNGs.

## Runtime/build approach

`pwa/src/card-icons.css` maps the existing navigation-card routes to the bundled PNGs and suppresses the platform emoji glyph rendering in the existing `.card-icon` slot. The application card markup and navigation behavior are unchanged.

`pwa/tools/build.mjs` includes the icon bytes in release identity generation and copies them into each content-addressed application release under `releases/<release-id>/card-icons/`. The FISH112 stylesheet is loaded with the release stylesheet so relative icon URLs remain release-scoped and offline-verifiable.

## Regression coverage

`pwa/test/fish112.test.mjs` verifies:

- the asset directory contains exactly the 16 approved filenames;
- each asset remains a transparent PNG;
- every asset is referenced by the FISH112 stylesheet;
- the production build preserves every icon byte-for-byte;
- every icon is represented in the generated release manifest and stylesheet.

FISH112 is a Full Application Release because it changes runtime assets, stylesheet behavior, build logic, and tests outside the canonical Gear/KB/Catch content roots.
