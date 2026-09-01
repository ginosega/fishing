# Fishing Companion PWA

Fishing Companion is the mobile/offline front end for the Fishing Markdown knowledge base.

## Current product scope

The current app is intentionally **single-user and personal**. It is built around one user's own Fishing knowledge base: owned gear/tackle, saved knots, fishing locations, curated techniques, and catch history.

The app does **not** need access control in the current phase. A publicly reachable but non-advertised URL is acceptable; the current product is still designed only for the user's own data and workflows. Privacy/access restriction is a **P3** requirement unless explicitly elevated for a specific reason.

A future generalized version could add per-user:

- gear/tackle inventories;
- saved knots and preferred setups;
- fishing locations and personal location notes;
- catch/trip logs;
- preferences and other personalized planning inputs.

That multi-user product is explicitly deferred until the personal version is mature.

## Requirement tradeoff rule

Before implementing a requirement that would materially affect architecture, deployment, maintenance burden, performance, or usability, surface the impact and discuss the requirement's priority before allowing it to drive the design.

- **P1** requirements may justify substantial complexity when they protect correctness, safety, or a core user need.
- **P2** requirements should be balanced against implementation/deployment cost.
- **P3** requirements should not create significant complexity, friction, or usability loss without an explicit discussion and decision.

This rule applies to Fishing Companion and should also be used for other applications developed with the user, including TowCalc.

## Product model

The app has two top-level workflows:

1. **My Gear** — browse owned rod/reel setups, line, weights, snaps/swivels, hooks, lures, bait, and saved knots. The first mobile acceptance pass established normalized category and leaf-page behavior rather than exposing source-table bookkeeping directly.
2. **Knowledge Base** — build a fishing plan from any combination of water, date/time, target species, current rod/reel setup, or lure/bait. The app ranks relevant location notes, techniques, owned tackle, knot/connection guidance, and similar catch history into a field-oriented plan.

Knots remain first-class browseable records and plan components.

### My Gear information architecture

The visible mobile hierarchy is intentionally flatter than the underlying data model:

- **Rods & Reels** uses first-class owned setup records grouped directly under Spinning, Baitcasting, and Spincasting. Setup type is a reusable classification/guidance attribute, not an intermediate navigation page.
- **Line** separates owned products from reusable Braided, Fluorocarbon, and Monofilament type knowledge.
- **Lures** can aggregate multiple owned size/color/weight variants into one product-family card while retaining variant-level inventory data for planning and catch history.
- **Weights**, **Snaps & Swivels**, and other terminal tackle use physical item/type records rather than naming the item after a technique that happens to use it.
- Explicit relationships connect gear to techniques, rigs, knots, and other gear. Where a dedicated Knowledge Base page owns the detailed procedure, My Gear usually summarizes the relationship and links to it rather than duplicating the procedure.

Applicable My Gear leaf pages standardize on **Manufacturer / Model**, **Specifications**, and **Links**. Source bookkeeping such as Status, Evidence, and Detail File is not exposed in the field UI.

Search and type filters use progressive disclosure. Search is normally omitted below roughly 12 normalized cards unless direct lookup is unusually useful; type filters appear only when they materially reduce a non-trivial list. Category-specific usability can override those heuristics.

## Source-of-truth rule

**GitHub Markdown remains authoritative.** The PWA does not maintain a second fishing database.

`build.mjs` copies the selected canonical Markdown files into the deploy bundle under `kb/`. `app.js` parses those Markdown files in the browser and builds transient inventory, technique, location, knot, setup, relationship, and catch-history models. The service worker caches both the app shell and the copied Markdown so the core experience works offline after the first load.

Current source files:

- `Fishing_Gear_Registry.md`
- `Fishing_Tackle_Inventory.md`
- `Topics/Rods_Reels_Line_Knots.md`
- `Topics/Fishing_Techniques.md`
- `Topics/Local_Waters_Locations.md`
- `Topics/Trip_Logs_Field_Observations.md`

## Acceptance testing

Testing is phone-first, with desktop/tablet secondary. Ordinary feedback is batched so the deployed UI remains stable during an active pass; blocking defects may be fixed immediately.

The first **My Gear** acceptance pass was completed on 2026-08-31. The consolidated My Gear refactor is now the build under second-pass acceptance testing. Detailed temporary observations are tracked in `TESTING_FEEDBACK.md` until they are either implemented or migrated into durable documentation/TODO/decision records.

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

Markdown remains human-readable and authoritative, but selected records may gain lightweight stable IDs/metadata as the app matures. The goal is to make relationships such as lure ↔ technique ↔ species ↔ structure ↔ knot ↔ setup ↔ catch more explicit without moving the source of truth into a separately maintained JSON/database layer.
