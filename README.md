# Fishing Project

This repository is the durable working home for the Fishing project: fishing and kayak knowledge, owned gear/tackle data, local-water notes, catch observations, and the **Fishing Companion** PWA.

## Operating mode

**Operating mode: This project uses Chat mode by default. Do not recommend Work unless a task specifically requires a Work-only capability. Never recommend Work merely because the project or task is complex, lengthy, file-heavy, analytical, or involves creating artifacts. Explain the specific need and obtain the user's approval before recommending a temporary switch.**

## Project status

**Status: NORMAL PROJECT MAINTENANCE / PRODUCTION HEALTHY / PR #36 UX POLISH DEPLOYED / PR #28 CONTENT ACCEPTANCE CLOSED**

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

The current user-facing lure type labels are **Soft plastics and swimbaits**, **Topwater**, and **Trolling**. The existing seed value `Trolling lures` remains stored internally and is mapped to the display label `Trolling` in `pwa/gear-app.js`; this wording-only change intentionally did not force an IndexedDB seed migration.

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

Equipment and Technique article files currently share `pwa/kb-content/techniques/`; the entity's `type` determines where it appears in the app. Content-only edits are safe. Renaming or moving a file requires updating its registered `content` path in `pwa/data/kb.seed.json`.

Authored navigation may use `gear://stable-id` or `kb://stable-id`; these links are navigation, not a maintained relationship graph. The links may live under `# Links`, `## Related`, or another sensible Markdown section; stable target identity matters, not the heading label.

Markdown indentation is meaningful for lists. Fishing Companion must preserve nested unordered/ordered list structure rather than flattening indented sub-items.

### Catch Log

- source: `pwa/data/catches.seed.json`
- **5 structured catches** remain in the current seed
- catches store required Species/Location IDs, exactly one Lure or Bait relationship, and optional setup/technique IDs when actually known
- historical setup/technique values are never inferred
- backlinks are computed from Catch-owned forward references rather than duplicated on KB/Gear records
- optional exact catch pictures override the default Species-picture fallback

## Fishing Companion PWA

Live site: `https://ginosega.github.io/fishing/`

Current product scope is **single-user, personal, offline-capable, and browse-focused**. Access control/multi-user generalization remains deferred unless explicitly elevated.

### Latest verified runtime release

**PR #36 — Polish Gear labels, thumbnails, and root search UX**

- exact tested PR head: `30c8fb265b66d9287efe7fe3c34f732f98f9f7ca`
- PR CI: **#176 / 33893140327** — success
- merge commit: `15c5ac6f8f3d37ad8b884436c6312083b1939921`
- production workflow: **#177 / 33893200789** — success
- all structured-model/routing/Markdown/final-content tests: success
- PWA build and transformed/local-media validation: success
- bundle verification and GitHub Pages artifact upload: success
- **Deploy to GitHub Pages: success**

PR #36 implemented three presentation/UX fixes without changing the accepted data model: the user-facing lure label is now **Trolling**; all Gear/KB/Catch card thumbnails use square white frames with `object-fit: contain` so wide images remain fully visible instead of being cropped; and root My Gear/Knowledge Base searches now hide the category-card grids as soon as a query is entered so results appear immediately below the page controls.

PR #34 remains the prior renderer release that added indentation-aware nested unordered/ordered Markdown lists.

### Latest verified authored-content baseline before PR #36

The feature branch for PR #36 was created from exact `main` **`97857fb947603c9e27a683b8c1f646fd540b1a1a`**, preserving all user-authored Markdown edits through the subsequent `trilene.md` update. PR #36 merged on top of that exact state; no direct content edits were overwritten.

The earlier night-end content audit checkpoint was `955d37bf675f3163fe610324809a972916c98ef0`, production run #166 / `33851195203`. It remains historical audit evidence rather than the current production head.

### Stabilization/recovery history

PR #25 catch/media polish → PR #26 local-media hardening → PR #27 Recovery B → PR #28 final content/image batch → PR #29 reconciliation → PR #30 transformed-picture validation hotfix → PR #31 reconciliation → PR #32 final content acceptance → PR #33 reconciliation → PR #34 nested-list renderer fix → PR #35 night-end reconciliation → PR #36 UX polish.

The interrupted-chat recovery and PR #28 acceptance sequences are closed. No hidden/unmerged post-PR #29 application build was found.

## Current UI/content conventions

- Root My Gear and root Knowledge Base each have Search.
- When a root/category Search query is non-empty, the category cards are hidden and matching results replace them directly below the page header/search controls.
- Browse-list Search appears at **10 or more entries**; smaller lists omit it.
- When a page has both Search and a dropdown/filter, the filter control is right-aligned.
- Line is intentionally a flat list; Rods & Reels retains setup grouping.
- My Gear remains browse-only: no Add/Edit/Delete forms and no visible JSON import/export UI.
- Gear leaf pages use structured product facts plus optional Markdown **Notes**.
- KB representative pictures may link to a specific owned Gear record by explicit stable ID.
- Authored KB/Gear stable-ID links are heading-independent.
- Nested Markdown lists are indentation-sensitive and must remain nested in the PWA.
- Gear, KB, and Catch card thumbnails use square white frames with `object-fit: contain`; full source imagery must remain visible, with white letterboxing where aspect ratios do not fill the square.

Current user-facing lure type labels include **Soft plastics and swimbaits**, **Topwater**, and **Trolling**.

## Media workflow — important

The repeated 2026-09-03 image failures were isolated to transporting binary image bytes through the ChatGPT→GitHub connector, not to the PWA or GitHub Actions.

**Standing convention for new user-supplied images:**

1. ChatGPT chooses the exact repository branch/path/filename.
2. The user uploads the binary image directly to GitHub on that feature branch.
3. ChatGPT verifies the GitHub file and updates text manifests/data/tests.
4. Do **not** base64-encode or transport user image binaries through ChatGPT/GitHub tool calls.

Repository-local images are validated by `pwa/apply-local-media.mjs` for supported format/extension/structure before entering the production bundle. The same step also validates the transformed KB bundle after media substitutions.

## Deferred v2 editing features

The My Gear repository/IndexedDB architecture is writable, but editing UI is intentionally deferred. When resumed, normal forms are the everyday Add/Edit/Delete path; validated JSON export/import may be a backup/bulk-edit path; do not add an in-app raw JSON editor.

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

A build that transforms data after initial source validation must also validate the **final deployable transformed data**, not only the pre-transform source.

Routine one-file authored-content edits may be made directly in GitHub when the user intentionally chooses that workflow, but be aware that each `pwa/**` commit triggers the shared Pages workflow and can cancel another in-progress run because the workflow uses a single `fishing-pages` concurrency group with `cancel-in-progress: true`. For coordinated runtime work, prefer a feature branch/PR and avoid overlapping direct `main` edits until CI/deploy completes.

For requirements with substantial architecture, deployment, maintenance, performance, or usability impact, surface the tradeoff and confirm priority before implementation. Privacy/access control remains P3 unless explicitly elevated.

## Historical night-end audit checkpoint — 2026-09-04

The night-end audit established **63 My Gear records, 54 KB entities, and 5 catches**; PR #28 content acceptance closed; PR #30 production recovery closed; PR #34 nested-list rendering fixed and user-confirmed; and no hidden unmerged feature work. Its final pre-reconciliation production checkpoint was `955d37bf675f3163fe610324809a972916c98ef0`, run **#166 / 33851195203**. That checkpoint is historical; current production is PR #36 merge `15c5ac6f8f3d37ad8b884436c6312083b1939921` / run **#177 / 33893200789**.
