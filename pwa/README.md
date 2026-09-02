# Fishing Companion PWA

Fishing Companion is a single-user, offline-capable fishing application with two deliberately different data domains:

- **My Gear** is structured, local-first inventory data.
- **Knowledge Base** is a unified structured index over complete authored Markdown documents, with a separate structured Catch Log.

The app is personal and browse-focused. It does not currently need access control, accounts, synchronization, a planner, fishing sessions, or trip history. My Gear editing remains deferred.

## Product model

The two top-level workflows are:

1. **My Gear** — owned rod/reel setups, line, weights, snaps/swivels, hooks, lures, and bait.
2. **Knowledge Base** — Locations, Species, Techniques, Knots, and Catch Log.

Knots are Knowledge Base entities, not My Gear records.

## My Gear architecture

```text
pwa/data/gear.seed.json
        ↓
schema validation
        ↓
IndexedDB local store
        ↓
GearRepository
        ↓
structured My Gear UI
```

Key files:

- `pwa/data/gear.seed.json` — bundled baseline/portable data.
- `pwa/gear-model.js` — schema, validation, and display helpers.
- `pwa/gear-store.js` — IndexedDB repository.
- `pwa/gear-app.js` — owner of all `#/inventory/...` routes.
- `pwa/media-ui.js` — presentation and zoom only; it must not mutate gear facts.

Current seed metadata:

- schema version `1`
- data version `2026-09-01-my-gear-v1`
- 61 records across 7 categories

Manufacturer, model, specifications, manufacturer links, retailer/resource links, usage guidance, and connection guidance are explicit fields. Do not reconstruct these facts from Markdown or display text.

### My Gear v1 UI

The current UI is browse-only:

- Home subtext: `Browse your inventory of equipment, tackle, and bait`
- title/subtitle left and Back button right
- no Knots category
- no My Gear data/import/export card
- no Add/Edit/Delete forms
- category cards and leaf routes remain structured

When v2 resumes, normal forms are the everyday CRUD path. Validated JSON export/import may become a backup/bulk-edit path. Do not add an in-app raw JSON editor.

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
- `pwa/markdown-render.js` — Markdown presentation, link rewriting, and safe image rendering.
- `pwa/kb-app.js` — owner of Home and all `#/kb/...` routes.
- `pwa/KB_DATA_MODEL_DESIGN.md` — accepted design and relationship rules.

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

## Retired architecture

The following are intentionally retired and not bundled:

- the legacy `app.js` Markdown fact parser;
- `legacy-app-loader.js`;
- Planner and Planner Attributes;
- fishing sessions, Session ID, and trip history;
- Markdown catch-table parsing and fuzzy gear-name matching.

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

`pwa/my-gear-routing.test.mjs` and `pwa/kb-routing.test.mjs` guard the route boundary and retired-Planner constraints.

## Offline and media behavior

The Service Worker caches the application shell, three seed datasets, every registered KB Content document, local KB images, and available build-time product images. IndexedDB remains the live My Gear store.

The shared viewer supports fit-to-view minimum zoom, pinch/pan, +/-/reset controls, and mobile dynamic-viewport containment. My Gear and KB media are presentation-only.

Two Tsuridamashii products intentionally remain without pictures because no exact reliable source image was available. Do not substitute look-alikes.

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

- My Gear schema, stable IDs, profiles, and critical mappings;
- unified KB entity schema and one-to-one Content paths;
- Catch Log references and lure-or-bait constraint;
- registered Markdown links and `gear://` IDs;
- required local KB image paths;
- route/layout regressions and retired Planner behavior;
- deployable bundle contents.

For meaningful changes, use a feature/fix branch and pull request. PR CI is build-only. Merge only after the exact final head passes, then verify both the production build and GitHub Pages deploy jobs before saying the change is live.

## Current production baseline

The last production state before the unified KB feature was:

- PR #9 — structured My Gear refactor
- PR #10 — routing/layout fix
- commit `8af0c654168cdefad37f79368719ac66a69c98b1`
- workflow #70 / `33590304599`

The user accepted that My Gear flow on 2026-09-02. The unified KB/Catch Log implementation follows through the normal branch/PR/deploy workflow.

## Future work

- Resolve the preserved PowerBait hook-size conflict.
- Resolve the preserved loop-knot conflict.
- Continue curating complete KB documents and structured catches.
- Later add My Gear CRUD forms and optional JSON backup/bulk import/export.
- Consider synchronization/backups only after the single-device local-first model is stable.
