# Fishing Companion PWA

Fishing Companion is a single-user, offline-capable fishing application with two deliberately different data domains:

- **My Gear** uses a structured local-first data model.
- **Knowledge Base / planner** still uses migrated GitHub Markdown while its long-term model is reconsidered separately.

## Current product scope

The app is intentionally **single-user and personal**. It is designed around the user's own gear/tackle, locations, techniques, catch history, and field-planning workflows.

The app does **not** need access control in the current phase. A publicly reachable but non-advertised URL is acceptable. Privacy/access restriction remains a **P3** requirement unless explicitly elevated.

A future generalized version may add per-user inventories, catch logs, locations, preferences, synchronization, and other personalization. That multi-user product is deferred until the personal version is mature.

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

My Gear no longer derives application records from Markdown tables.

```text
Bundled structured JSON seed
          ↓
   schema validation
          ↓
      IndexedDB
   live local store
          ↓
   GearRepository
          ↓
      My Gear UI
```

### Structured data

`pwa/data/gear.seed.json` is the bundled initial dataset and portable representation.

Current seed metadata:

- schema version: `1`
- data version: `2026-09-01-my-gear-v1`

Each item uses explicit fields rather than facts inferred from prose, including:

- stable `id`;
- `category` and `type`;
- `manufacturer.name` and optional manufacturer URL;
- `model`;
- optional structured specifications;
- optional typed retailer/resource links;
- optional connection and usage profiles or item-specific guidance.

Rod/reel setups use structured rod and reel component objects.

This architecture specifically prevents the recurring parser bugs encountered during the Markdown-derived implementation: manufacturer/model ambiguity, part numbers being mistaken for models, manufacturer links being mislabeled as retailer links, and product/link text leaking into the wrong fields.

### Live local storage

Browser **IndexedDB** is the live My Gear store, accessed through `GearRepository` in `pwa/gear-store.js`. My Gear UI code does not directly manipulate IndexedDB.

On first use, the validated bundled JSON seed initializes IndexedDB. While the database remains seed-managed, a newer bundled `dataVersion` may advance it automatically. Future user-managed edits must not be silently overwritten.

### Current editing scope

The current v1 UI is intentionally **browse-only**.

- No Add/Edit/Delete forms are exposed yet.
- The temporary **My Gear data** export/import card has been removed from the UI.
- JSON import/export remains a future v2/bulk-edit capability, not a current acceptance requirement.
- When that work resumes, preferred manual bulk editing is export JSON → edit externally → import.
- Do not build an in-app raw JSON editor.

The repository and IndexedDB layers were intentionally designed to support later writes without requiring the current UI to expose them.

## My Gear information architecture

Current categories:

- Rods & Reels
- Line
- Weights
- Snaps & Swivels
- Hooks
- Lures
- Bait

Rods & Reels are grouped by Spinning, Baitcasting, and Spincasting. Line is grouped by Braided, Fluorocarbon, and Monofilament. Lures use search and a type filter; Hooks use a type filter.

Applicable leaf pages render structured **Manufacturer / Model**, **Specifications**, and **Links** fields. Optional **Knots & connections**, **How to use it**, and catch-history panels render only when the item model supplies them.

Manufacturer links come from the explicit manufacturer object and display only the manufacturer's name. Retailer links are separate typed records.

## Hybrid router boundary

The application is temporarily hybrid while the Knowledge Base still uses the legacy Markdown-driven app.

Route ownership is explicit:

- `pwa/gear-app.js` owns **all** `#/inventory/...` routes.
- `pwa/legacy-app-loader.js` loads the legacy `app.js` only for Home, Knowledge Base, and planner routes.
- The two routers must never compete for My Gear hashes.

This rule was added after the structured refactor initially caused a Sev 1 regression: clicking a gear card returned to the My Gear root instead of opening the leaf page.

`pwa/my-gear-routing.test.mjs` now regression-tests the routing boundary and accepted header structure.

## Accepted My Gear layout after PR #10

- Home My Gear subtext: `Browse your inventory of equipment, tackle, and bait`
- My Gear root title/subtitle are on the left.
- Back button is on the right.
- No visible My Gear import/export/data card.
- No Knots category.
- Category cards open structured category pages.
- Item cards open structured gear leaf pages.

## Knowledge Base transitional architecture

The Knowledge Base/planner has **not** yet been refactored. The legacy app still loads selected migrated Markdown files because planner, location, technique, and current catch-log behavior depend on them.

Transitional Markdown inputs include:

- `Fishing_Gear_Registry.md`
- `Fishing_Tackle_Inventory.md`
- `Topics/Rods_Reels_Line_Knots.md`
- `Topics/Fishing_Techniques.md`
- `Topics/Local_Waters_Locations.md`
- `Topics/Trip_Logs_Field_Observations.md`

The first two remain legacy/reference inputs only; **My Gear itself does not consume Markdown-derived inventory records**.

Do not treat the current Knowledge Base implementation as the final architecture. Before deeper KB development, design its domain model deliberately, including:

- Knots as KB entities;
- techniques and rigs;
- species/season/depth/structure relationships;
- locations;
- narrative content vs structured fields;
- stable relationships back to My Gear records.

Catch history is also still read from the trip-log Markdown during this phase. A future structured catch model should reference gear/setup/location entities by stable ID.

## Offline behavior

Two mechanisms are used deliberately:

- **Service Worker cache** — application shell, bundled seed JSON, transitional Knowledge Base files, and cached product media.
- **IndexedDB** — live My Gear data.

This allows My Gear to be browsed offline after initialization.

## Media

Gear imagery is fetched/cached at build time from curated product sources where possible. Media behavior is presentation-only; it must not mutate My Gear content fields.

The image viewer supports fit-to-view minimum zoom, pinch/pan, +/-/reset controls, and mobile dynamic-viewport containment. Two Tsuridamashii product images remain unavailable because Amazon and externally indexed mirrors did not provide a reliable image response to the build runner; do not substitute unverified look-alike imagery.

## Current production state

Live URL:

`https://ginosega.github.io/fishing/`

Structured My Gear refactor:

- PR #9
- merge commit `972dca92812d4e129ab7311e64a0915e3f158c69`

Sev 1 routing/layout fix:

- PR #10
- production commit `8af0c654168cdefad37f79368719ac66a69c98b1`
- production workflow **#70 / 33590304599**
- structured model tests: success
- routing/layout tests: success
- build/bundle verification: success
- GitHub Pages deploy: success

The next action is a user acceptance retest of the post-PR #10 My Gear flow. If accepted, move to Knowledge Base architecture design rather than adding more My Gear v2 features.

## Acceptance testing

Testing is phone-first, desktop/tablet secondary.

Immediate retest path:

1. Home — verify My Gear subtext.
2. My Gear root — verify header layout, categories, no Knots, no My Gear data card.
3. Open representative category pages.
4. Open representative leaf pages from category cards; confirm they do not bounce back to My Gear.
5. Spot-check Manufacturer / Model, Specifications, Links, guidance, images, and catch-history panels.
6. Retest the image viewer on desktop and mobile.

Do **not** spend the current acceptance pass testing JSON import/export; it is not exposed in v1.

## Browser testing

Normal use/testing path is the deployed GitHub Pages URL.

For local development from repo root:

```bash
node pwa/serve.mjs
```

Local URL:

```text
http://127.0.0.1:4173
```

## Build and deployment

From repo root:

```bash
node pwa/build.mjs
```

The build validates the structured My Gear seed and writes the deployable site to `pwa/dist/`.

CI validates:

- JavaScript syntax;
- structured My Gear schema/content;
- stable IDs/profile references;
- critical manufacturer/model mappings;
- My Gear routing/layout regression behavior;
- bundle contents.

For meaningful changes, use a branch + PR. PR CI is build-only. After merge, verify both the production build and GitHub Pages deploy jobs before saying the change is live. Avoid disposable workflows and routine direct-to-main edits.

## Recommendation provenance

The current planner distinguishes:

- **Curated KB** — directly sourced from current Knowledge Base content.
- **User observed** — trip/catch-log evidence.
- **App inference** — deterministic ranking/combination of existing knowledge, not newly asserted historical fact.

Preserve or improve this provenance model when the Knowledge Base architecture is redesigned.

## Future work

Near-term sequence:

1. Finish post-PR #10 My Gear acceptance.
2. Design the Knowledge Base domain model, including Knots.
3. Decide which KB content should be structured fields versus narrative content.
4. Move catch history to structured records with stable references.
5. Later add normal My Gear Add/Edit/Delete forms.
6. Later expose validated JSON export/import for bulk editing if still useful.
7. Consider synchronization/backups only after the single-device local-first model is stable.
