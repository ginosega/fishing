# Fishing Companion PWA

Fishing Companion is a single-user, offline-capable fishing application. The application is being developed in two deliberately different data domains:

- **My Gear** uses a structured local-first data model.
- **Knowledge Base / planner** still uses the migrated GitHub Markdown knowledge base while its long-term model is reconsidered separately.

## Current product scope

The current app is intentionally **single-user and personal**. It is designed around the user's own gear/tackle, locations, techniques, catch history, and field-planning workflows.

The app does **not** need access control in the current phase. A publicly reachable but non-advertised URL is acceptable. Privacy/access restriction remains a **P3** requirement unless explicitly elevated.

A future generalized version may add per-user inventories, catch logs, locations, preferences, synchronization, and other personalized planning inputs. That multi-user product is deferred until the personal version is mature.

## Requirement tradeoff rule

Before implementing a requirement that would materially affect architecture, deployment, maintenance burden, performance, or usability, surface the impact and discuss the requirement's priority before allowing it to drive the design.

- **P1** requirements may justify substantial complexity when they protect correctness, safety, or a core user need.
- **P2** requirements should be balanced against implementation/deployment cost.
- **P3** requirements should not create significant complexity, friction, or usability loss without an explicit discussion and decision.

This rule also applies to other applications developed with the user, including TowCalc.

## Product model

The app has two top-level workflows:

1. **My Gear** — browse owned rod/reel setups, line, weights, snaps/swivels, hooks, lures, and bait.
2. **Knowledge Base** — currently provides the existing fishing planner and technique/location knowledge. Its architecture will be reconsidered before deeper development.

**Knots are not My Gear records.** They belong in the Knowledge Base domain and are intentionally absent from My Gear until the Knowledge Base redesign is completed. Gear records may later reference Knowledge Base knots through stable IDs.

## My Gear architecture

My Gear no longer derives its application records from Markdown tables.

The model is:

```text
Bundled structured JSON seed
          ↓
   schema validation
          ↓
      IndexedDB
   live local store
          ↓
   Gear Repository
          ↓
      My Gear UI
```

### Structured data

`pwa/data/gear.seed.json` is the bundled initial dataset and portable interchange representation. Each item has explicit fields rather than fields inferred from prose, including:

- stable `id`;
- `category` and `type`;
- `manufacturer.name` and optional manufacturer URL;
- `model`;
- optional structured specifications;
- optional typed retailer/resource links;
- optional connection and usage profiles or item-specific guidance.

Rod/reel setups use structured rod and reel component objects.

This prevents presentation code from having to infer whether a URL is a manufacturer link or retailer link, where the manufacturer ends and model begins, or whether a part number is a model.

### Live local storage

The browser's **IndexedDB** database is the live My Gear store. It is available offline and is accessed through `GearRepository`; My Gear UI code does not directly manipulate IndexedDB.

On first use, the validated bundled JSON seed initializes IndexedDB. While the database is still seed-managed, a newer bundled `dataVersion` automatically advances the local database. Once the user imports a manually edited JSON file, that local database becomes user-managed and future seed revisions do not silently overwrite it.

### JSON export/import

The My Gear root includes:

- **Export My Gear JSON** — downloads the current local database in the same schema used by the application.
- **Import My Gear JSON** — validates an edited file and previews added, modified, omitted, and unchanged stable IDs before any change is applied.
- **Merge** — adds/updates imported stable IDs while preserving local records omitted from the file.
- **Replace** — makes the imported file the complete local My Gear database, so omissions act as deletions.

There is intentionally **no raw JSON editor inside the PWA**.

There are also intentionally **no Add/Edit/Delete forms yet**. Until those are developed, export → edit externally → import is the supported manual editing path.

## My Gear information architecture

The current categories are:

- Rods & Reels
- Line
- Weights
- Snaps & Swivels
- Hooks
- Lures
- Bait

Rods & Reels are grouped by Spinning, Baitcasting, and Spincasting. Line is grouped by Braided, Fluorocarbon, and Monofilament. Lures use search and a type filter; Hooks use a type filter.

Applicable leaf pages render structured **Manufacturer / Model**, **Specifications**, and **Links** fields. Optional **Knots & connections**, **How to use it**, and catch-history panels render only when the item model supplies them.

Manufacturer links are generated from the explicit manufacturer object and therefore display only the manufacturer's name. Retailer links are separate typed records.

## Knowledge Base transitional architecture

The Knowledge Base/planner has **not** yet been refactored. The existing `app.js` still loads selected migrated Markdown files because planner, location, technique, and current catch-log behavior depend on them.

Current transitional Markdown inputs include:

- `Fishing_Gear_Registry.md`
- `Fishing_Tackle_Inventory.md`
- `Topics/Rods_Reels_Line_Knots.md`
- `Topics/Fishing_Techniques.md`
- `Topics/Local_Waters_Locations.md`
- `Topics/Trip_Logs_Field_Observations.md`

The first two files are retained during this transition even though **My Gear itself no longer consumes Markdown-derived inventory records**. Do not treat the present Knowledge Base implementation as the final architecture; its data model will be reconsidered before deeper KB development.

Catch history is also still read from the migrated trip-log Markdown during this phase. A future structured catch model should reference gear/setup/location records by stable ID.

## Offline behavior

Two mechanisms are used deliberately:

- **Service Worker cache** — application shell, bundled seed JSON, Knowledge Base files, and cached product media.
- **IndexedDB** — live My Gear user data.

This allows the PWA to browse My Gear and use its local inventory without a network connection after installation/initialization.

## Acceptance testing

Testing is phone-first, with desktop/tablet secondary. The previous Markdown-derived My Gear implementation completed its content scrub before this local-first refactor so the structured seed could be created from reviewed data rather than from an unreviewed migration snapshot.

The structured My Gear build must be acceptance-tested before work moves into the Knowledge Base redesign. Key checks include category/list/leaf content, images and viewer behavior, manufacturer/retailer links, catch histories, JSON export/import validation and preview, and offline behavior.

## Browser testing

The normal testing/use path is the deployed GitHub Pages URL.

For local development, from the repository root:

```bash
node pwa/serve.mjs
```

The app is served at:

```text
http://127.0.0.1:4173
```

Local testing is optional and is not required for normal use.

## Build only

From the repository root:

```bash
node pwa/build.mjs
```

The build validates the structured My Gear seed before creating the deployable site in `pwa/dist/`.

CI also validates stable IDs, profile references, critical manufacturer/model mappings, and bundle contents before deployment.

## Hosting and updates

Fishing Companion uses GitHub Pages. GitHub Actions builds `pwa/dist/` and deploys the artifact whenever relevant files change on `main`.

The deployed HTML version-stamps the primary JavaScript/CSS entry points, and the service worker uses a build-versioned cache. A normal reload should usually pick up a new deployment; fully closing/reopening an installed PWA or a hard refresh remains the fallback during testing.

## Recommendation provenance

The existing planner distinguishes:

- **Curated KB** — directly sourced from current Knowledge Base content.
- **User observed** — trip/catch-log evidence.
- **App inference** — deterministic ranking/combination of existing knowledge, not a newly asserted historical fact.

This provenance model should be preserved or improved when the Knowledge Base architecture is redesigned.

## Future work

Near-term architectural work after My Gear acceptance:

1. Design the Knowledge Base domain model, including moving Knots there explicitly.
2. Decide which Knowledge Base content should be structured fields versus narrative content.
3. Move catch history to structured records with stable references to gear/setup/location entities.
4. Later add normal My Gear Add/Edit/Delete forms on top of the existing repository layer.
5. Consider synchronization/backups only after the single-device local-first model is stable.
