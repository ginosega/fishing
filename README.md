# Fishing Project

This repository is the durable working home for the Fishing project: fishing and kayak knowledge, owned gear/tackle data, local-water notes, catch observations, and the **Fishing Companion** PWA.

## Operating mode

**Operating mode: This project uses Chat mode by default. Do not recommend Work unless a task specifically requires a Work-only capability. Never recommend Work merely because the project or task is complex, lengthy, file-heavy, analytical, or involves creating artifacts. Explain the specific need and obtain the user's approval before recommending a temporary switch.**

## Project status

**Status: NORMAL PROJECT MAINTENANCE / FISHING COMPANION CURRENT PRODUCTION VERIFIED 2026-09-04**

The OneNote migration and hyperlink restoration were completed on 2026-08-29. OneNote was designated the most up-to-date historical source of truth for migration closure; historical Fishing chats remain supplemental evidence and decision history. Temporary migration audit/reconciliation files were removed after closure.

Fishing Companion has since been refactored into three durable application-data domains with shared architectural principles but deliberately different storage models:

1. **My Gear** — structured owned inventory in JSON + IndexedDB, with optional Markdown Notes.
2. **Knowledge Base** — a strict structured entity index over complete authored Markdown documents.
3. **Catch Log** — separate structured historical records that own the exact cross-entity relationships required by current application behavior.

The Planner, Planner Attributes, fishing sessions, session IDs, trip history, Markdown-derived identity inference, and fuzzy media-to-Gear matching are retired.

## Current application data architecture

### My Gear

Runtime/source owners:

- `pwa/data/gear.seed.json` — bundled baseline / portable representation
- `pwa/gear-model.js` — strict schema-v2 validation and display helpers
- `pwa/gear-store.js` — IndexedDB repository and seed migration
- `pwa/gear-app.js` — all `#/inventory/...` routes
- `pwa/media-owners.json`, `pwa/media-sources.json`, `pwa/local-media.json` — exact stable-ID media ownership/source configuration
- `pwa/apply-local-media.mjs` — validates and materializes repository-local media into the production bundle

Current seed:

- schema version `2`
- data version `2026-09-04-my-gear-v2-final-content-1`
- **63 records** across Rods & Reels, Line, Weights, Snaps & Swivels, Hooks, Lures, and Bait

Manufacturer, model, specifications, and typed links are structured facts. `notes` is optional Markdown narrative. Do not reintroduce `profiles`, structured usage/connection guidance, `knowledgeRefs`, setup `mainLine`/`leader`, or inference from display text/Markdown.

**Knots are not My Gear records.** They are Knowledge Base entities.

### Knowledge Base

Runtime/source owners:

- `pwa/data/kb.seed.json` — unified entity catalog
- `pwa/kb-content/` — one complete Markdown document per entity
- `pwa/kb-model.js` — KB/Catch validation
- `pwa/kb-app.js` — Home and all `#/kb/...` routes
- `pwa/markdown-render.js` — safe Markdown rendering and `gear://` / `kb://` navigation

Current KB seed:

- schema version `1`
- data version `2026-09-04-kb-v1-final-content-1`
- **54 entities**: 8 Locations, 7 Species, 22 Equipment, 7 Techniques, 10 Knots

Every KB entity uses the same envelope: stable `id`, `type`, `name`, optional `description`, optional `picture`, and one complete Markdown `content` document. Valid types are `location`, `species`, `equipment`, `technique`, and `knot`.

**Equipment** is a flat peer type for rigs, presentations, lure/gear guides, and related equipment knowledge. **Techniques** is for strategy, seasonal/condition guidance, species tactics, and other non-equipment fishing methods. Existing stable `technique-*` IDs may remain unchanged when an article belongs to Equipment.

Authored navigation may use `gear://stable-id` or `kb://stable-id`; these links are navigation, not a maintained relationship graph.

### Catch Log

- source: `pwa/data/catches.seed.json`
- **5 structured catches** remain in the current seed
- catches store required Species/Location IDs, exactly one Lure or Bait relationship, and optional setup/technique IDs when actually known
- historical setup/technique values are never inferred
- backlinks are computed from Catch-owned forward references rather than duplicated on KB/Gear records
- optional exact catch pictures override the default Species-picture fallback

## Fishing Companion PWA

Live site:

`https://ginosega.github.io/fishing/`

Current product scope is **single-user, personal, offline-capable, and browse-focused**. Access control/multi-user generalization remains deferred unless explicitly elevated.

### Current verified production release

Latest release: **PR #28 — Add final Fishing KB content and imagery batch**

- exact tested PR head: `c397985e99532b0ea572afd9910c0d131469a439`
- PR CI: run **#120 / 33840154633** — success
- merge commit: `093139e5314af55691e608277b68b79b2d369166`
- production workflow: run **#121 / 33840208952** — success
- production build: success
- GitHub Pages artifact upload: success
- **Deploy to GitHub Pages: success**

The current production release includes the final 2026-09-04 content/UI batch: expanded Equipment/Technique KB content, direct repository-local rig/species imagery, authored KB↔My Gear links, Inline Spinner and Snaps & Swivels Gear Notes links, revised lure-type labels, filter/dropdown placement correction, and the requested South Bend specification cleanup.

Recent stabilization sequence:

- **PR #26** — repository-local media hardening and image validation; merge `9af96810cb02c81da2a0e3f5463071e020ae6cfc`; production run #113 / `33833494282`
- **PR #27** — Recovery B Gear/browse/content updates; merge `2635d9eb5cb80d446050090ba3f5a2736cac0c84`; production run #117 / `33834793404`
- **PR #28** — final KB content and imagery batch; merge `093139e5314af55691e608277b68b79b2d369166`; production run #121 / `33840208952`

## Current UI conventions

- Root My Gear and root Knowledge Base each have Search.
- Browse-list Search appears when a list has **10 or more entries**; smaller lists omit it.
- When a page has both Search and a dropdown/filter, the filter control is right-aligned.
- Line is intentionally a flat list; Rods & Reels retains setup grouping.
- My Gear remains browse-only: no Add/Edit/Delete forms and no visible JSON import/export UI.
- Gear leaf pages use structured product facts plus optional Markdown **Notes**.
- KB representative pictures may link to a specific owned Gear record by explicit stable ID.

Current lure type labels include **Soft plastics and swimbaits**, **Topwater**, and **Trolling lures**.

## Media workflow — important

The repeated 2026-09-03 image failures were isolated to transporting binary image bytes through the ChatGPT→GitHub connector, not to the PWA or GitHub Actions.

**Standing convention for new user-supplied images:**

1. ChatGPT chooses the exact repository branch/path/filename.
2. The user uploads the binary image directly to GitHub on that feature branch.
3. ChatGPT verifies the GitHub file and updates text manifests/data/tests.
4. Do **not** base64-encode or transport user image binaries through ChatGPT/GitHub tool calls.

Repository-local images are validated by `pwa/apply-local-media.mjs` for supported format/extension/structure before entering the production bundle. The build verifies required local assets.

## Deferred v2 editing features

The My Gear repository/IndexedDB architecture is writable, but editing UI is intentionally deferred.

When resumed:

- normal forms are the everyday Add/Edit/Delete path;
- validated JSON export/import may be a backup/bulk-edit path;
- do **not** add an in-app raw JSON editor.

## Start here in a new chat

Copy `Fishing_New_Chat_Bootstrap_Prompt.md` into a new **Chat-mode** conversation. Required read order:

1. `README.md`
2. `Fishing_Context.md`
3. `Fishing_TODO.md`
4. `Fishing_Decision_Log.md`
5. `pwa/README.md`

Then inspect the current runtime source files for the task at hand. Legacy `Topics/*.md`, `Fishing_Gear_Registry.md`, and `Fishing_Tackle_Inventory.md` remain useful migrated/reference material but are **not runtime application data sources**.

## Evidence / status labels

Use these labels consistently in Markdown knowledge/reference material:

- **OWNED / INSTALLED**
- **USER VERIFIED**
- **USER OBSERVED**
- **MANUFACTURER DOCUMENTED**
- **ONENOTE SOURCE**
- **ONENOTE LINK RESTORED**
- **HISTORICAL CHAT SEED**
- **RESEARCHED / CANDIDATE**
- **REJECTED / SUPERSEDED**
- **PROBABLE**
- **UNKNOWN / UNRESOLVED**

Do not promote candidate gear to owned status without user confirmation or current durable data establishing ownership.

## Time-sensitive information

Fishing regulations, stocking, product availability, launch/access rules, weather, and current fishing conditions are time-sensitive. Reverify with current authoritative sources when planning a trip or purchase.

## Development / deployment rule

For meaningful PWA changes, use a normal feature/fix branch and PR. Merge only after the **exact final head** passes PR CI. After merge, verify the production workflow on the exact merge commit and confirm both the build and actual **Deploy to GitHub Pages** job succeeded before calling the release live.

For requirements with substantial architecture, deployment, maintenance, performance, or usability impact, surface the tradeoff and confirm priority before implementation. Privacy/access control remains P3 unless explicitly elevated.
