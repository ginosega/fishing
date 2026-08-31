# Fishing Companion PWA

Fishing Companion is the mobile/offline front end for the Fishing Markdown knowledge base.

## Product model

The app has two top-level workflows:

1. **My Gear & Knots** — browse owned rods, reels, line, weights, snaps/swivels, hooks, lures, bait, and saved knots. Item pages combine the structured inventory record with instructional mentions, connection/knot guidance, source links, and matching catch-log entries.
2. **Build a Fishing Plan** — start from any combination of water, date/time, target species, current rod/reel setup, or lure/bait. The app ranks relevant location notes, techniques, owned tackle, knot/connection guidance, and similar catch history into a field-oriented plan.

Knots are first-class records. They are browseable in the inventory workflow and are also attached to plan rigging chains such as main line → leader and leader → terminal tackle.

## Source-of-truth rule

**GitHub Markdown remains authoritative.** The PWA does not maintain a second fishing database.

`build.mjs` copies the selected canonical Markdown files into the deploy bundle under `kb/`. `app.js` parses those Markdown files in the browser and builds transient inventory, technique, location, knot, setup, and catch-history models. The service worker caches both the app shell and the copied Markdown so the core experience works offline after the first load.

Current source files:

- `Fishing_Gear_Registry.md`
- `Fishing_Tackle_Inventory.md`
- `Topics/Rods_Reels_Line_Knots.md`
- `Topics/Fishing_Techniques.md`
- `Topics/Local_Waters_Locations.md`
- `Topics/Trip_Logs_Field_Observations.md`

## Build

From the repository root:

```bash
node pwa/build.mjs
```

The deployable site is written to `pwa/dist/`.

For local testing, serve `pwa/dist` over HTTP rather than opening `index.html` directly, because `fetch()` and service workers require an HTTP(S) origin.

## Hosting

The repository contains a build-check workflow but does not automatically publish the site. Hosting/privacy should be chosen deliberately because a GitHub Pages deployment may expose the generated site even when the source repository is private, depending on account/Pages configuration.

## Recommendation provenance

The UI distinguishes:

- **Curated KB** — directly sourced from Markdown.
- **User observed** — trip/catch log evidence.
- **App inference** — deterministic ranking/combination of existing knowledge, not a newly asserted historical fact.

## Future data-model improvements

The current parser intentionally works against the human-readable Markdown that already exists. As the app matures, selected records can gain lightweight stable IDs/metadata in Markdown to make relationships (lure ↔ technique ↔ species ↔ structure ↔ knot ↔ catch) more explicit without moving the source of truth into JSON or application code.
