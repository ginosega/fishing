# Fishing Companion PWA

Fishing Companion is a single-user, offline-capable, browse-focused fishing application with three durable data domains that share identity/ownership/validation rules without forcing identical schemas or storage:

- **My Gear** — structured local-first owned facts plus optional stable-ID Markdown Notes.
- **Knowledge Base** — unified structured index over complete authored Markdown documents.
- **Catch Log** — structured historical facts/relationships plus optional stable-ID Markdown Notes.

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
strict schema-v3 validation
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
- `gear-app.js` — all `#/inventory/...` routes and user-facing type-label aliases
- `gear-content/` — optional authored Notes keyed by Gear stable ID
- `apply-authored-notes.mjs` — shared Gear/Catch Notes validation, materialization, and offline manifests
- `media-owners.json` — exact stable-ID Gear media ownership
- `media-sources.json` — remote/source media metadata
- `local-media.json` — repository-local active media configuration
- `apply-local-media.mjs` — validates/materializes repository-local media after the main build
- `media-ui.js` — presentation/zoom only; never infers or mutates Gear facts

Current seed metadata:

- schema version `3`
- data version `2026-09-04-my-gear-v3-external-notes-1`
- **63 records** across 7 categories

Ordinary product facts are explicit structured data. Optional authored Notes live at `gear-content/<gear-id>.md` and are not duplicated in Gear JSON. Rods & Reels remain first-class setup records with embedded rod/reel value objects.

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
- a non-empty root Search hides the category-card grid and shows matching item cards immediately below the page controls
- browse-list Search appears at **10+ entries**
- if a searchable list also has a dropdown/filter, the filter is right-aligned
- Line is intentionally flat; Rods & Reels retains grouping
- no Knots category
- no My Gear data/import/export card
- no current Add/Edit/Delete forms
- leaf pages use structured Manufacturer / Model, Specifications, Links, and optional Markdown **Notes**
- internal Notes links use `gear://stable-id` and `kb://stable-id`

Current user-facing lure-type labels include **Soft plastics and swimbaits**, **Topwater**, and **Trolling**. `gear.seed.json` still stores the pre-PR #36 value `Trolling lures`; `gear-app.js` maps that internal value to `Trolling` wherever it is displayed or searched. This copy-only presentation change deliberately avoids bumping the seed dataVersion or refreshing IndexedDB.

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

Use, Rigging, Notes, Resources, Warnings, links, tables, nested lists, and embedded images stay in Markdown Content rather than atomic schema fields.

### Physical Markdown layout

Equipment and Technique entities currently share the physical directory `kb-content/techniques/`; the entity's `type` in `data/kb.seed.json` controls where it appears in the UI. This is a storage-path convention, not a taxonomy leak.

Content-only Markdown edits are safe. Renaming or moving an article file requires updating the entity's registered `content` path. Build validation checks registered content and internal stable-ID links.

### Authored Markdown rendering conventions

`markdown-render.js` is a safe custom renderer. Current durable behavior includes:

- headings, paragraphs, tables, block quotes, code blocks, inline emphasis/code/links/images;
- registered relative KB links and `gear://` / `kb://` stable-ID navigation;
- nested unordered and ordered lists based on Markdown indentation.

List indentation is semantic. PR #34 fixed the prior defect where all list items were flattened even when the source contained valid indented sub-items. Do not work around the renderer by flattening correctly authored source; regression coverage in `kb-routing.test.mjs` protects nested unordered and ordered lists.

Authored stable-ID links may live under `# Links`, `## Related`, or another sensible Markdown section. Tests validate the stable-ID links themselves, not a particular heading label.

### Final content set and acceptance

PR #28 refreshed Swimbait, Jerkbait, Crankbait, Chatterbait / Bladed Jig, Spinnerbait, Jigs, Frogs, Drop Shot, Wacky Worm, Ned Rig, and Trout Fishing; it added Inline Spinner, Snaps & Swivels, Flasher Rig, Inline Trolling Rig, Bobber Rig, Slip Sinker Rig, and Spring Fishing.

The user completed a broad formatting cleanup of those imported pages on 2026-09-04. Final acceptance inspected the modified Equipment/Technique documents, fixed remaining structure/wrapping artifacts, and validated replacement Largemouth/Smallmouth Bass images. PR #32 production-verified the final state. The PR #28 content acceptance is therefore **closed**.

Subsequent direct Markdown edits are ordinary current KB maintenance and are not continuation of PR #28 acceptance. PR #36 was branched from exact `main` `97857fb947603c9e27a683b8c1f646fd540b1a1a`, preserving all such user edits through `trilene.md`.

## Structured Catch Log

Catch Log is separate because catches require exact historical relationships rather than general authored knowledge. Structured Catch JSON contains only stable identity/date/size, required Species and Location IDs, exactly one Lure or Bait relationship, optional rod/reel setup and presentation/technique IDs when actually recorded, and an optional exact catch picture.

Optional authored Catch Notes live separately at `catch-content/<catch-id>.md`. The old structured Exact Spot Notes, generated Notes, and source/Provenance fields are retired; Catch leaves render one optional **Notes** card from Markdown.

There is no Session ID, generic additional-gear relationship, or trip/no-catch model. Historical setup/technique attribution is not inferred.

Current seed contains **5 catches**. Catch backlinks are computed from Catch records; they are not stored redundantly. If `catch.picture` is null, Catch cards/pages use the linked Species picture as a presentation fallback.

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

### KB picture sources

A KB `picture.src` may be an `http(s)` URL, a safe `./assets/kb/...` path, or a safe `./assets/gear/...` path when intentionally reusing a built owned-Gear image. The Gear-backed case is required by PR #28's exact owned-item picture reuse.

### Repository-local media

`local-media.json` configures active user-supplied local Gear/KB media. `apply-local-media.mjs` validates image size/signatures/extensions, materializes active images, updates built metadata, verifies bytes, and **revalidates the fully transformed built KB bundle before deployment**.

This final-form validation rule was added in PR #30 after a source-valid KB bundle became runtime-invalid only after local-media substitution. PR #32 also confirmed the replacement Largemouth/Smallmouth Bass images pass the same local-media pipeline.

### Card-thumbnail presentation

PR #36 standardized Gear, KB, and Catch card thumbnails as square frames with a white background and `object-fit: contain`. Wide rectangular fish images therefore display at full width with white space above/below instead of being center-cropped. Tall or square source images likewise remain fully visible. This is a CSS presentation rule; source image files do not need to be rewritten to square dimensions.

### User-supplied binary workflow

**Do not upload or base64-transport user image binaries through ChatGPT/GitHub connector calls.** The user uploads binaries directly to the specified GitHub feature branch/path; ChatGPT verifies them and handles manifests/data/content/tests/PR/deploy.

## Search behavior

- Root My Gear and root Knowledge Base always provide Search.
- A non-empty root Search hides the category-card grid and shows matching result cards directly below the page controls.
- Browse-list Search appears at 10+ entries.
- Type-page Search filters the visible result-card list in place.
- The root/category hiding behavior relies on the standard HTML `hidden` attribute plus the stylesheet invariant `[hidden] { display: none !important; }`; this prevents explicit grid/list `display` declarations from keeping hidden category cards onscreen.

## Routes

My Gear owns `#/inventory`, `#/inventory/{category}`, and `#/inventory/item/{stable-id}`.

Knowledge Base owns `#/home`, `#/kb`, the five entity-category routes, `#/kb/entity/{stable-id}`, `#/kb/catches`, and `#/kb/catch/{stable-id}`.

`my-gear-routing.test.mjs`, `kb-routing.test.mjs`, and `final-content.test.mjs` guard route/content/media regressions. `kb-routing.test.mjs` also protects nested Markdown list behavior; `final-content.test.mjs` validates stable authored KB/Gear navigation and now also guards the square/contain thumbnail and hidden-state CSS invariants introduced in PR #36.

## Offline and storage behavior

The Service Worker caches the shell, seed datasets, registered KB Content, validated Gear/Catch authored Notes manifests and Markdown, local KB assets, and available build-time/local Gear images. IndexedDB remains the live My Gear store.

When bundled Gear schema/data version advances, seed-managed local stores are refreshed deterministically from validated seed data while stable IDs preserve Catch references. Non-seed/imported local data must not be silently discarded.

The shared image viewer supports fit-to-view minimum zoom, pinch/pan, +/-/reset, and mobile viewport containment.

## Retired architecture

Do not reintroduce without an explicit product decision: legacy Markdown fact parser/router, My Gear profiles/HTML guidance, Planner/Planner Attributes, sessions/Session ID/trip history, Markdown catch-table parsing, fuzzy Gear-name matching, or fuzzy media identity matching.

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
node pwa/apply-authored-notes.mjs
node pwa/apply-local-media.mjs
```

CI additionally runs structured-model, routing, KB Markdown, nested-list, final-content regression tests, post-transform/local-media validation, and deployable-bundle verification.

## Current production state

### Latest verified runtime release

**PR #39 — Unify authored Gear and Catch Notes as Markdown**

- exact tested PR head: `77ec40db223b275366a73091974ecd4d421a2c90`
- PR CI: **#196 / 33907218850** — success
- merge commit: `e997492b995f7e7cb8fa4af21ef1f2953df63a78`
- production workflow: **#197 / 33907284576** — success
- all structured-model/routing/Markdown/final-content tests: success
- PWA build + unified authored-Notes validation + transformed/local-media validation: success
- bundle verification and GitHub Pages artifact upload: success
- **Deploy to GitHub Pages: success**

PR #39 completed the authored-content architecture cleanup begun in PR #38: My Gear schema v3 contains only structured owned facts while optional Notes live in `pwa/gear-content/<gear-id>.md`; Catch Log schema v2 contains only structured catch facts/relationships while optional Notes live in `pwa/catch-content/<catch-id>.md`. The five existing user-authored Exact Spot Notes were preserved verbatim as Catch Markdown. The prior generated Catch Notes and Provenance/source card were retired, so Catch leaves now render one optional Markdown-backed **Notes** card. Gear and Catch Notes use the same renderer, stable-ID navigation conventions, build validation, asset-manifest pattern, and offline caching.

PR #36 remains the prior UX-polish release for the **Trolling** display alias, square non-cropping thumbnails, and root-search replacement behavior.

For meaningful runtime changes, use a normal feature/fix branch and PR. Merge only after exact-head CI passes, then verify both the production build and actual Pages deployment before saying a release is live. Any build stage that mutates already-validated structured data must validate the final deployable form after the mutation.

For deliberate one-file authored Markdown cleanup, direct GitHub edits are acceptable, but every `pwa/**` commit triggers the shared workflow. Because `.github/workflows/fishing-pwa-build.yml` uses one `fishing-pages` concurrency group with `cancel-in-progress: true`, avoid overlapping direct `main` edits with coordinated runtime PR validation/deployment.

## Future work

Canonical future work is `../Fishing_TODO.md`. The PR #28 content cleanup, PR #34 nested-list defect, and PR #36 UX-polish items are complete. Remaining themes include the PowerBait hook-size conflict, loop-knot conflict, candidate rig/spoon pages, structured catch additions, hardware/install-state verification, and eventual My Gear CRUD.
