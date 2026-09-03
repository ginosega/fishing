# Fishing Companion PWA

Fishing Companion is a single-user, offline-capable fishing application with deliberately different data domains that share the same architectural rules:

- **My Gear** is structured, local-first inventory data plus lightweight Markdown Notes.
- **Knowledge Base** is a unified structured index over complete authored Markdown documents.
- **Catch Log** is separate structured historical data and owns the cross-entity relationships that current product behavior actually needs.

The app is personal and browse-focused. It does not currently need access control, accounts, synchronization, a planner, fishing sessions, or trip history. My Gear editing remains deferred.

## Product model

The two top-level workflows are:

1. **My Gear** — owned rod/reel setups, line, weights, snaps/swivels, hooks, lures, and bait.
2. **Knowledge Base** — Locations, Species, Techniques, Knots, and Catch Log.

Knots are Knowledge Base entities, not My Gear records.

The accepted cross-domain principle is documented in `pwa/DATA_MODEL_RECONCILIATION_DESIGN.md`: do not add a structured relationship merely because two entities are conceptually related. Use a maintained stable-ID relationship only when current application behavior requires that relationship as a durable fact. Otherwise, authored Markdown links are sufficient.

## My Gear architecture

```text
pwa/data/gear.seed.json
        ↓
strict schema validation
        ↓
IndexedDB local store
        ↓
GearRepository
        ↓
structured My Gear UI
```

Key files:

- `pwa/data/gear.seed.json` — bundled baseline/portable data.
- `pwa/gear-model.js` — strict schema-v2 validation and display helpers.
- `pwa/gear-store.js` — IndexedDB repository and deterministic seed-version migration.
- `pwa/gear-app.js` — owner of all `#/inventory/...` routes.
- `pwa/media-owners.json` — explicit stable-ID ownership for Gear media.
- `pwa/media-sources.json` — image source/provenance metadata.
- `pwa/media-ui.js` — presentation and zoom only; it must not infer Gear identity from display text or mutate Gear facts.

Current seed metadata:

- schema version `2`
- data version `2026-09-02-my-gear-v2`
- 61 records across 7 categories

Manufacturer, model, specifications, manufacturer links, and retailer/resource links are explicit structured facts. Optional `notes` is Markdown narrative. Do not reconstruct product facts from Markdown, display text, image aliases, or old migration/reference files.

### My Gear schema v2

Ordinary product items use exact allowed fields for stable ID, category, type, name, manufacturer, model, specifications, links, and optional Notes. Rods & Reels remain first-class setup records with embedded rod and reel value objects.

The following legacy/speculative concepts are intentionally absent:

- top-level `profiles`;
- `usage` / `connections` guidance structures;
- `usageProfileId` / `connectionProfileId`;
- setup `mainLine` / `leader` relationship fields;
- `configuration` relationship objects;
- `knowledgeRefs`.

Useful setup or item-specific information can be written in Notes instead. Generic technique/knot knowledge belongs in the KB.

### My Gear UI

The current UI remains browse-only:

- Home subtext: `Browse your inventory of equipment, tackle, and bait`
- title/subtitle left and Back button right
- no Knots category
- no My Gear data/import/export card
- no Add/Edit/Delete forms
- category cards and leaf routes remain structured
- Gear narrative section is **Notes**, rendered through the shared safe Markdown renderer

When editing work resumes, normal forms are the everyday CRUD path. Validated JSON export/import may become a backup/bulk-edit path. Do not add an in-app raw JSON editor.

## Unified Knowledge Base architecture

```text
pwa/data/kb.seed.json
        ↓
schema + content validation
        ↓
one complete Markdown document per entity
        ↓
safe presentation renderer
        ↓
browsable Knowledge Base UI
```

Key files:

- `pwa/data/kb.seed.json` — structured entity index.
- `pwa/kb-content/` — complete Markdown documents.
- `pwa/data/catches.seed.json` — structured Catch Log.
- `pwa/kb-model.js` — Knowledge Base and Catch Log validation.
- `pwa/markdown-render.js` — Markdown presentation, internal-link rewriting, and safe image rendering.
- `pwa/kb-app.js` — owner of Home and all `#/kb/...` routes.
- `pwa/KB_DATA_MODEL_DESIGN.md` — accepted KB design and Catch relationship rules.
- `pwa/DATA_MODEL_RECONCILIATION_DESIGN.md` — accepted common architecture and My Gear v2 design.

### Unified entity schema

Every Location, Species, Technique, and Knot has exactly the same logical fields:

| Field | Rule |
|---|---|
| `id` | Immutable lowercase kebab-case stable ID. |
| `type` | `location`, `species`, `technique`, or `knot`. |
| `name` | User-facing name. |
| `description` | Optional card/page-header subtext. |
| `picture` | Optional representative card/header picture. |
| `content` | Path to one complete Markdown document. |

`type` is only the top-level discriminator. Techniques do not have a grouping subtype.

Use, Rigging, Notes, Resources, Warnings, links, tables, and embedded images belong inside Content as normal Markdown. The app does not parse headings or prose to infer domain facts.

### Markdown links and images

- External websites use ordinary Markdown links.
- Relative links to registered KB Markdown documents become stable KB routes.
- Explicit My Gear links use `gear://stable-gear-id`.
- Explicit Knowledge Base links may use `kb://stable-kb-id`.
- `gear://` and `kb://` links are authored navigation, not maintained reverse relationships.
- Local images live under `pwa/assets/kb/`, are validated/copied at build time, cached offline, and open in the shared zoom viewer.
- External images may render online but are not durable/offline assets.
- Representative Picture and embedded Content images use one source asset scaled by CSS; separate thumbnails are not currently generated.

## Structured Catch Log

Catch Log is separate from general knowledge because catches require exact historical relationships.

Each record includes:

- stable ID and date, with optional time;
- structured size;
- required Species and Location IDs;
- exact-spot Markdown notes, including depth/structure/conditions when known;
- optional rod/reel setup ID;
- optional Technique ID;
- exactly one Lure or Bait My Gear ID plus a name snapshot;
- optional picture and notes;
- provenance.

There is no Session ID, generic additional-gear relationship, or separate depth/structure field. Historical setup or technique attribution is not inferred. The 2026-08-04 source row was migrated as two catches because it recorded both a perch and a largemouth bass.

Catch backlinks on Location, Species, Technique, setup, lure, and bait pages are computed from Catch records; backlinks are not stored redundantly.

## Media identity

Gear images use two separate concerns:

- `media-sources.json` owns source/provenance and image retrieval information;
- `media-owners.json` owns the exact association between a media record and one or more stable Gear IDs, optionally with `component: rod|reel` for a setup.

The build validates every owner. `media-ui.js` performs exact owner-ID lookup and never falls back to fuzzy aliases, page headings, manufacturer/model text, or rendered labels. Gear records without a suitable mapped/cached image remain image-free rather than receiving a look-alike.

## Retired architecture

The following are intentionally retired and not bundled as runtime models:

- the legacy `app.js` Markdown fact parser;
- `legacy-app-loader.js`;
- My Gear profile/HTML guidance model;
- Planner and Planner Attributes;
- fishing sessions, Session ID, and trip history;
- Markdown catch-table parsing and fuzzy gear-name matching;
- fuzzy media-to-Gear identity matching.

The migrated `Topics/*.md`, `Fishing_Gear_Registry.md`, and `Fishing_Tackle_Inventory.md` remain valuable reference/history, but they are not PWA runtime data sources.

## Routes

My Gear owns:

- `#/inventory`
- `#/inventory/{category}`
- `#/inventory/item/{stable-id}`

Knowledge Base owns:

- `#/home`
- `#/kb`
- `#/kb/locations`
- `#/kb/species`
- `#/kb/techniques`
- `#/kb/knots`
- `#/kb/entity/{stable-id}`
- `#/kb/catches`
- `#/kb/catch/{stable-id}`

`pwa/my-gear-routing.test.mjs` and `pwa/kb-routing.test.mjs` guard the route boundary, Notes/Markdown behavior, media identity, and retired-Planner constraints.

## Offline and storage behavior

The Service Worker caches the application shell, three seed datasets, every registered KB Content document, local KB images, and available build-time product images. IndexedDB remains the live My Gear store.

When the bundled My Gear schema/data version advances, seed-managed local stores are deterministically refreshed from the validated seed. Stable Gear IDs are preserved so Catch Log references remain valid. Non-seed/imported local data must not be silently discarded.

The shared viewer supports fit-to-view minimum zoom, pinch/pan, +/-/reset controls, and mobile dynamic-viewport containment. My Gear and KB media are presentation-only.

## Local development

From repository root:

```bash
node pwa/serve.mjs
```

Open `http://127.0.0.1:4173`.

Build with:

```bash
node pwa/build.mjs
```

The build writes `pwa/dist/` and validates:

- strict My Gear schema v2, stable IDs, dataVersion, and legacy-field rejection;
- Gear Notes `gear://` and `kb://` target IDs and absence of raw application routes;
- explicit media owner IDs/component selectors;
- unified KB entity schema and one-to-one Content paths;
- Catch Log references and lure-or-bait constraint;
- registered KB Markdown links plus `gear://` / `kb://` IDs;
- required local KB image paths;
- route/layout/Notes/media regressions and retired Planner behavior;
- deployable bundle contents.

For meaningful changes, use a feature/fix branch and pull request. PR CI is build-only. Merge only after the exact final head passes, then verify both the production build and GitHub Pages deploy jobs before saying the change is live.

## Recent release history

- PR #9 — structured My Gear refactor
- PR #10 — routing/layout fix and accepted My Gear browse behavior
- PR #13 — unified Knowledge Base, structured Catch Log, retired Planner/parser, and title-only site header
- PR #15 — accepted Fishing Companion data-model reconciliation design
- PR #16 — My Gear schema-v2 implementation, Markdown Notes/internal links, strict validation, and explicit media ownership

Production status is verified separately after each merge; do not infer a successful live deployment from PR CI alone.

## Future work

- Resolve the preserved PowerBait hook-size conflict.
- Resolve the preserved loop-knot conflict.
- Continue curating complete KB documents and structured catches.
- Later add My Gear CRUD forms and optional JSON backup/bulk import/export.
- Consider synchronization/backups only after the single-device local-first model is stable.
