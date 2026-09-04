# Fishing Companion PWA

Fishing Companion is a single-user, offline-capable, browse-focused fishing application with three durable data domains that share identity/ownership/validation rules without forcing identical schemas or storage:

- **My Gear** — structured local-first owned inventory plus lightweight Markdown Notes.
- **Knowledge Base** — unified structured index over complete authored Markdown documents.
- **Catch Log** — separate structured historical data that owns the exact cross-entity relationships current product behavior needs.

The app does not currently need accounts, synchronization, access control, a planner, fishing sessions, or trip history. My Gear editing remains deferred.

## Product model

Top-level workflows:

1. **My Gear** — owned rod/reel setups, line, weights, snaps/swivels, hooks, lures, and bait.
2. **Knowledge Base** — Locations, Species, Equipment, Techniques, Knots, and Catch Log.

Knots are Knowledge Base entities, not My Gear records.

The accepted cross-domain principle is documented in `DATA_MODEL_RECONCILIATION_DESIGN.md`:

> Store a structured relationship only when the relationship itself is a durable fact required by current application behavior. Otherwise, use authored Markdown links where useful.

Catch Log therefore owns structured historical relationships. My Gear and KB may use authored stable-ID navigation links without maintaining an exhaustive relationship graph.

## My Gear architecture

```text
pwa/data/gear.seed.json
        ↓
strict schema-v2 validation
        ↓
IndexedDB local store
        ↓
GearRepository
        ↓
structured My Gear UI
```

Key files:

- `data/gear.seed.json` — bundled baseline/portable data
- `gear-model.js` — strict schema-v2 validation/display helpers
- `gear-store.js` — IndexedDB repository and deterministic seed-version migration
- `gear-app.js` — all `#/inventory/...` routes
- `media-owners.json` — exact stable-ID Gear media ownership
- `media-sources.json` — remote/source media metadata
- `local-media.json` — repository-local active media configuration
- `apply-local-media.mjs` — validates/materializes repository-local media after the main build
- `media-ui.js` — presentation/zoom only; never infers or mutates Gear facts

Current seed metadata:

- schema version `2`
- data version `2026-09-04-my-gear-v2-final-content-1`
- **63 records** across 7 categories

Ordinary product facts are explicit structured data. Optional `notes` is Markdown narrative. Rods & Reels remain first-class setup records with embedded rod/reel value objects.

Retired/forbidden schema-v1 concepts:

- top-level `profiles`
- `usage` / `connections`
- `usageProfileId` / `connectionProfileId`
- setup `mainLine` / `leader`
- `configuration`
- `knowledgeRefs`
- raw HTML guidance

### My Gear UI conventions

- root My Gear has Search
- browse-list Search appears at **10+ entries**
- if a searchable list also has a dropdown/filter, the filter is right-aligned
- Line is intentionally flat; Rods & Reels retains grouping
- no Knots category
- no My Gear data/import/export card
- no current Add/Edit/Delete forms
- leaf pages use structured Manufacturer / Model, Specifications, Links, and optional Markdown **Notes**
- internal Notes links use `gear://stable-id` and `kb://stable-id`

Current lure-type labels include:

- **Soft plastics and swimbaits**
- **Topwater**
- **Trolling lures**

## Unified Knowledge Base architecture

```text
pwa/data/kb.seed.json
        ↓
strict schema + content validation
        ↓
one complete Markdown document per entity
        ↓
safe Markdown renderer
        ↓
browsable Knowledge Base UI
```

Key files:

- `data/kb.seed.json` — structured entity catalog
- `kb-content/` — complete Markdown documents
- `data/catches.seed.json` — structured Catch Log
- `kb-model.js` — Knowledge Base and Catch Log validation
- `markdown-render.js` — safe Markdown rendering and internal-link rewriting
- `kb-app.js` — Home and all `#/kb/...` routes
- `KB_DATA_MODEL_DESIGN.md` — accepted/current KB design
- `DATA_MODEL_RECONCILIATION_DESIGN.md` — shared architectural principles and My Gear schema-v2 rationale

Current KB seed metadata:

- schema version `1`
- data version `2026-09-04-kb-v1-final-content-1`
- **54 entities**: 8 Locations, 7 Species, 22 Equipment, 7 Techniques, 10 Knots

### Unified entity schema

Every Location, Species, Equipment, Technique, and Knot uses the same logical fields:

| Field | Rule |
|---|---|
| `id` | Immutable lowercase kebab-case stable ID. |
| `type` | `location`, `species`, `equipment`, `technique`, or `knot`. |
| `name` | User-facing name. |
| `description` | Optional card/page-header subtext. |
| `picture` | Optional representative card/header picture. |
| `content` | Path to one complete Markdown document. |

`type` is the only top-level discriminator. There is no nested Equipment or Technique taxonomy field.

**Equipment** contains rigs, presentations, lure/gear guides, and equipment-oriented knowledge. **Technique** contains strategy, seasonal/condition guidance, species tactics, and other non-equipment methods. Stable IDs are identity, so an Equipment article may legitimately retain a historical `technique-*` ID.

Use, Rigging, Notes, Resources, Warnings, links, tables, and embedded images stay in Markdown Content rather than atomic schema fields.

### Current final content set

PR #28 refreshed these existing pages from user-supplied MHT content:

- Swimbait
- Jerkbait
- Crankbait
- Chatterbait / Bladed Jig
- Spinnerbait
- Jigs
- Frogs
- Drop Shot
- Wacky Worm
- Ned Rig
- Trout Fishing

PR #28 added:

- Inline Spinner
- Snaps & Swivels
- Flasher Rig
- Inline Trolling Rig
- Bobber Rig
- Slip Sinker Rig
- Spring Fishing

Authored content may link to owned Gear and other KB articles by stable ID. Those links are navigation and are build-validated; they do not create reverse relationship maintenance requirements.

## Structured Catch Log

Catch Log is separate because catches require exact historical relationships rather than general authored knowledge.

Each record includes stable identity/date/size, required Species and Location IDs, exactly one Lure or Bait relationship, optional rod/reel setup and presentation/technique IDs when actually recorded, optional exact catch picture, Markdown narrative, and provenance.

There is no Session ID, generic additional-gear relationship, or trip/no-catch model. Historical setup/technique attribution is not inferred.

Current seed contains **5 catches**.

Catch backlinks on applicable Location, Species, Technique/Equipment, setup, lure, and bait pages are computed from Catch records. Backlinks are not stored redundantly.

If `catch.picture` is null, Catch cards/pages use the linked Species picture as a presentation fallback.

## Links and identity

- External websites use ordinary Markdown links.
- Registered relative KB Markdown links become stable KB routes.
- Explicit My Gear navigation uses `gear://stable-gear-id`.
- Explicit KB navigation uses `kb://stable-kb-id`.
- Catch relationships store stable IDs directly.
- Broken internal IDs fail validation rather than using fuzzy fallback.

## Media architecture

### Gear media identity

`media-sources.json` owns source/provenance; `media-owners.json` owns exact stable Gear association. `media-ui.js` performs exact owner-ID lookup and never guesses from aliases, headings, manufacturer/model strings, or rendered labels.

### Repository-local media

`local-media.json` configures active user-supplied local Gear/KB media. `apply-local-media.mjs`:

- validates image size;
- validates JPEG/PNG/GIF/WebP structural signatures;
- verifies filename extension matches detected format;
- copies active local Gear media into `dist/assets/gear/`;
- copies active local KB media into its stable `assets/kb/...` path;
- updates built media/KB metadata;
- verifies built KB bytes match source bytes.

This hardening was added after a corrupt Kokanee WebP could pass the earlier source pipeline yet render blank.

### User-supplied binary workflow

**Do not upload or base64-transport user image binaries through ChatGPT/GitHub connector calls.** Repeated 2026-09-03 failures isolated that transport step as unreliable.

Standing process:

1. ChatGPT specifies exact feature branch/path/filename.
2. User uploads binary directly to GitHub.
3. ChatGPT verifies the GitHub file.
4. ChatGPT handles manifests/data/content/tests/PR/deploy.

This is the standard workflow even when manual image upload is less convenient.

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
- `#/kb/equipment`
- `#/kb/techniques`
- `#/kb/knots`
- `#/kb/entity/{stable-id}`
- `#/kb/catches`
- `#/kb/catch/{stable-id}`

`my-gear-routing.test.mjs` and `kb-routing.test.mjs` guard route ownership and UI/Markdown regressions. `final-content.test.mjs` protects the 2026-09-04 final content batch.

## Offline and storage behavior

The Service Worker caches the shell, seed datasets, registered KB Content, local KB assets, and available build-time/local Gear images. IndexedDB remains the live My Gear store.

When bundled Gear schema/data version advances, seed-managed local stores are refreshed deterministically from validated seed data while stable IDs preserve Catch references. Non-seed/imported local data must not be silently discarded.

The shared image viewer supports fit-to-view minimum zoom, pinch/pan, +/-/reset, and mobile viewport containment.

## Retired architecture

Do not reintroduce without an explicit product decision:

- legacy Markdown fact parser/router
- My Gear profiles/HTML guidance model
- Planner / Planner Attributes
- sessions / Session ID / trip history
- Markdown catch-table parsing
- fuzzy Gear-name matching
- fuzzy media identity matching

Migrated `Topics/*.md`, `Fishing_Gear_Registry.md`, and `Fishing_Tackle_Inventory.md` remain valuable history/reference but are not runtime sources.

## Local development and build

From repository root:

```bash
node pwa/serve.mjs
```

Open `http://127.0.0.1:4173`.

Build pipeline:

```bash
node pwa/build.mjs
node pwa/apply-local-media.mjs
```

The CI workflow additionally runs structured-model, routing, KB Markdown, and final-content regression tests and verifies the deployable bundle.

## Current production release

Latest verified release:

- PR #28 — `Add final Fishing KB content and imagery batch`
- exact tested head `c397985e99532b0ea572afd9910c0d131469a439`
- PR CI #120 / `33840154633` — success
- merge `093139e5314af55691e608277b68b79b2d369166`
- production #121 / `33840208952` — build success, Pages artifact success, **Deploy to GitHub Pages success**

Recent stabilization:

- PR #26 — local media hardening
- PR #27 — Recovery B Gear/browse/content updates
- PR #28 — final KB/content/image batch

For meaningful changes, use a normal feature/fix branch and PR. Merge only after exact-head CI passes, then verify both the production build and actual Pages deployment before saying a release is live.

## Future work

Canonical future work is `../Fishing_TODO.md`. Major deferred/unresolved themes include PowerBait hook-size conflict, loop-knot conflict, remaining candidate rig/spoon pages, structured catch additions, hardware/install-state verification, and eventual My Gear CRUD.
