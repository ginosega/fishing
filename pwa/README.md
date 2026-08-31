# Fishing Companion PWA

Fishing Companion is the mobile/offline front end for the Fishing Markdown knowledge base.

## Current product scope

The current app is intentionally **single-user and personal**. It is built around one user's own Fishing knowledge base: owned gear/tackle, saved knots, fishing locations, curated techniques, and catch history.

The app does **not** need access control in the current phase. A publicly reachable but non-advertised URL is acceptable; the current product is still designed only for the user's own data and workflows.

A future generalized version could add per-user:

- gear/tackle inventories;
- saved knots and preferred setups;
- fishing locations and personal location notes;
- catch/trip logs;
- preferences and other personalized planning inputs.

That multi-user product is explicitly deferred until the personal version is mature.

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

## Browser testing

The normal testing/use path is the deployed GitHub Pages URL. Changes to the PWA or its canonical Markdown inputs trigger the GitHub Actions build/deploy workflow automatically.

For local development only, from the repository root:

```bash
node pwa/serve.mjs
```

That command rebuilds the app from the current Markdown knowledge base and serves it at:

```text
http://127.0.0.1:4173
```

Local testing is optional and is not required for normal app use.

## Build only

From the repository root:

```bash
node pwa/build.mjs
```

The deployable site is written to `pwa/dist/`.

## Hosting and updates

Fishing Companion uses GitHub Pages, matching the simple URL-based usage model used by TowCalc. Because Fishing Companion has a build step, GitHub Actions builds `pwa/dist/` and deploys that artifact to Pages whenever relevant files change on `main`.

The deployed HTML version-stamps `app.js` and `styles.css`, and the knowledge-base Markdown uses network-first loading with offline cache fallback. A normal reload should usually pick up the latest deployment; `Shift+F5` / hard refresh is the fallback when testing a new build.

The GitHub Pages site must be enabled once in repository settings with **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Recommendation provenance

The UI distinguishes:

- **Curated KB** — directly sourced from Markdown.
- **User observed** — trip/catch log evidence.
- **App inference** — deterministic ranking/combination of existing knowledge, not a newly asserted historical fact.

## Future data-model improvements

The current parser intentionally works against the human-readable Markdown that already exists. As the app matures, selected records can gain lightweight stable IDs/metadata in Markdown to make relationships (lure ↔ technique ↔ species ↔ structure ↔ knot ↔ catch) more explicit without moving the source of truth into JSON or application code.
