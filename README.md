# Fishing Project

This repository is the durable working home for the Fishing project: fishing and kayak knowledge, owned gear/tackle data, local-water notes, catch observations, and the **Fishing Companion** PWA.

## Operating mode

**Operating mode: This project uses Chat mode by default. Do not recommend Work unless a task specifically requires a Work-only capability. Never recommend Work merely because the project or task is complex, lengthy, file-heavy, analytical, or involves creating artifacts. Explain the specific need and obtain the user's approval before recommending a temporary switch.**

## Project status

**Status: NORMAL PROJECT MAINTENANCE / FISHING COMPANION PRODUCTION VERIFIED THROUGH PR #32 / PR #28 CONTENT ACCEPTANCE CLOSED**

The OneNote migration and hyperlink restoration were completed on 2026-08-29. OneNote was designated the most up-to-date historical source of truth for migration closure; historical Fishing chats remain supplemental evidence and decision history. Temporary migration audit/reconciliation files were removed after closure.

Fishing Companion has three durable application-data domains with shared architectural principles but deliberately different storage models:

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

**Equipment** is a flat peer type for rigs, presentations, lure/gear guides, and related equipment knowledge. **Technique** is for strategy, seasonal/condition guidance, species tactics, and other non-equipment fishing methods. Existing stable `technique-*` IDs may remain unchanged when an article belongs to Equipment.

Equipment and Technique article files currently share the physical directory `pwa/kb-content/techniques/`; the entity's `type` determines where it appears in the app. Content-only edits are safe. Renaming or moving a file requires updating its registered `content` path in `pwa/data/kb.seed.json`.

Authored navigation may use `gear://stable-id` or `kb://stable-id`; these links are navigation, not a maintained relationship graph. The links may live under `# Links`, `## Related`, or another sensible Markdown section; stable target identity matters, not the heading label.

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

Latest release: **PR #32 — Complete final KB Markdown acceptance cleanup**

- exact tested PR head: `973b8cb0294cfbab789b2f9dde69830199c5b83a`
- PR CI: run **#151 / 33848718142** — success
- merge commit: `356174e1376d591e9b33bef06e52e9fdb5c3d31c`
- production workflow: run **#152 / 33848766888** — success
- production build: success
- transformed/local-media KB validation: success
- replacement Largemouth/Smallmouth Bass image validation: success
- bundle verification: success
- GitHub Pages artifact upload: success
- **Deploy to GitHub Pages: success**

PR #32 completed the PR #28 authored-content acceptance pass. It fixed residual list/wrapping artifacts in Chatterbait, Jerkbait, Inline Trolling Rig, and Spring Fishing and updated `final-content.test.mjs` to validate actual authored `gear://` / `kb://` navigation rather than a specific `## Related` heading.

Recent stabilization sequence:

- **PR #25** — Catch imagery and browse-list media polish; merge `26aebfe4f428bebd735baf5a1b30ffa26b8a0b33`
- **PR #26** — repository-local media hardening and image validation; merge `9af96810cb02c81da2a0e3f5463071e020ae6cfc`; production run #113 / `33833494282`
- **PR #27** — Recovery B Gear/browse/content updates; merge `2635d9eb5cb80d446050090ba3f5a2736cac0c84`; production run #117 / `33834793404`
- **PR #28** — final KB content and imagery batch; merge `093139e5314af55691e608277b68b79b2d369166`; production run #121 / `33840208952`
- **PR #29** — documentation/state reconciliation after PR #28; merge `b3e1b4735cbdc26c41a0bf96b8f4a19bcb09d3ca`
- **PR #30** — Gear-backed KB picture validation hotfix and post-transform validation guard; merge `f64217485df024ebebf15af5adfb9bbd7018be5d`; production run #125 / `33843111957`
- **PR #31** — durable state reconciliation after recovery; merge `e5458b789e3098536ff685799bb1135c9e407392`; production run #128 / `33844993323`
- **PR #32** — final PR #28 Markdown acceptance cleanup; merge `356174e1376d591e9b33bef06e52e9fdb5c3d31c`; production run #152 / `33848766888`

## Current acceptance state

The PR #28 feature/content batch is **accepted and closed**. The user completed the broad manual Equipment/Technique Markdown cleanup; final review covered all 15 modified article files, fixed four remaining structural artifacts, and production-validated the replacement Largemouth/Smallmouth Bass pictures through the local-media pipeline.

Future article edits are ordinary Knowledge Base maintenance rather than continuation of the PR #28 recovery/acceptance sequence.

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

Repository-local images are validated by `pwa/apply-local-media.mjs` for supported format/extension/structure before entering the production bundle. The same step also validates the transformed KB bundle after media substitutions.

## Interrupted-chat recovery result

The interrupted thread has been fully reconstructed and closed. The substantive sequence was PR #24 taxonomy → PR #25 catch/media polish → PR #26 local-media hardening → PR #27 Recovery B → PR #28 final MHT content/images → PR #29 state reconciliation → PR #30 production recovery → PR #31 state reconciliation → PR #32 final content acceptance. No separate post-PR #29 hidden/unmerged application build was found.

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

A build that transforms data after initial source validation must also validate the **final deployable transformed data**, not only the pre-transform source. PR #30 made this rule explicit for KB/local-media processing.

For requirements with substantial architecture, deployment, maintenance, performance, or usability impact, surface the tradeoff and confirm priority before implementation. Privacy/access control remains P3 unless explicitly elevated.
