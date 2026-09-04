# Fishing Project

This repository is the durable working home for the Fishing project: owned fishing gear/tackle, local-water and technique knowledge, catch history, kayak notes, and the **Fishing Companion** PWA.

## Operating mode

Operating mode: This project uses Chat mode by default. Do not recommend Work unless a task specifically requires a Work-only capability. Never recommend Work merely because the project or task is complex, lengthy, file-heavy, analytical, or involves creating artifacts. Explain the specific need and obtain my approval before recommending a temporary switch.

## Migration status

**ONENOTE MIGRATION COMPLETE / NORMAL PROJECT MAINTENANCE**

The 73-page OneNote PDF export was migrated to GitHub Markdown, and the later OneNote Single File Web Page/MHT export was used to restore external hyperlinks. On 2026-08-29 the migration audit was closed with OneNote designated as the most up-to-date historical source of truth. Historical Fishing chats remain useful supplemental evidence, but they are not a completeness gate.

Temporary migration/reconciliation artifacts were removed after closure. Future corrections are ordinary project maintenance.

## Current application architecture

Fishing Companion has three durable application-data domains that follow the same underlying architectural principles without forcing identical storage formats.

### My Gear

- Bundled baseline / portable representation: `pwa/data/gear.seed.json`
- Schema/validation: `pwa/gear-model.js`
- Live local/offline store: browser IndexedDB through `pwa/gear-store.js`
- UI / route owner: `pwa/gear-app.js`
- Current schema version: **2**
- Current data version: **`2026-09-04-my-gear-v2-final-content-1`**
- Current record count: **63** across Rods & Reels, Line, Weights, Snaps & Swivels, Hooks, Lures, and Bait

My Gear stores explicit owned-item facts: stable ID, category/type, manufacturer/model, specifications, typed links, and optional Markdown `notes`. Rod/reel components remain embedded in the setup record. It does **not** maintain a general Gear→Gear or Gear→KB relationship graph.

Authored navigation inside Notes may use:

- `gear://stable-gear-id`
- `kb://stable-kb-id`

These are validated links, not maintained reverse relationships.

**Knots are not My Gear records.** They belong to the Knowledge Base.

`Fishing_Gear_Registry.md` and `Fishing_Tackle_Inventory.md` remain migrated/reference material, not PWA runtime sources.

### Knowledge Base

- Structured entity catalog: `pwa/data/kb.seed.json`
- Complete authored documents: `pwa/kb-content/`
- Schema/validation: `pwa/kb-model.js`
- UI / route owner: `pwa/kb-app.js`
- Safe Markdown renderer: `pwa/markdown-render.js`
- Current schema version: **1**
- Current data version: **`2026-09-04-kb-v1-final-content-1`**
- Current entity count: **54**
  - 8 Locations
  - 7 Species
  - 22 Equipment
  - 7 Techniques
  - 10 Knots

Every KB entity uses the same envelope: stable ID, Type, Name, optional Description, optional Picture, and one complete Markdown Content document. The peer types are `location`, `species`, `equipment`, `technique`, and `knot`.

Equipment contains rigs, presentations, and gear-use guides. Techniques contains strategy, seasonal/condition guidance, and broader fishing methods. Existing stable `technique-*` IDs are intentionally preserved when an article is classified as Equipment.

### Catch Log

- Structured data: `pwa/data/catches.seed.json`
- Current data version: **`2026-09-03-catches-v1-yellow-perch-1`**
- Current catch count: **5**

Catch records own the structured cross-domain relationships that current product behavior actually requires: Species, Location, optional Technique, optional Rod/Reel setup, and exactly one Lure or Bait. Historical setup/technique values remain null unless actually recorded. Catch backlinks are computed from these forward references.

The Planner, Planner Attributes, fishing sessions, Session ID, trip history, Markdown catch parsing, and fuzzy identity matching are retired.

## Media architecture and upload rule

Gear media identity is explicit and stable-ID based:

- `pwa/media-sources.json` — source/provenance metadata
- `pwa/media-owners.json` — exact Gear ownership by stable ID
- `pwa/local-media.json` — repository-local media overrides/assets
- `pwa/apply-local-media.mjs` — validates and materializes local media into the deploy bundle

**Standing image-ingestion rule:** do not transfer user-supplied image binaries through the ChatGPT→GitHub connector. That path repeatedly failed during the 2026-09-03 recovery. When a new user image needs to become a repository asset, the assistant should specify the exact active feature branch and repository path, the user should upload the image directly in GitHub, and the assistant should then verify the Git blob and wire the asset into manifests/data/tests.

Local images are format/integrity validated before they are included in the production bundle. Do not substitute look-alike product images when the exact owned-item image is unavailable.

## Fishing Companion PWA

Live site:

`https://ginosega.github.io/fishing/`

Current product scope is **single-user and personal**. A publicly reachable but non-advertised URL is acceptable; access control and multi-user generalization remain deferred unless explicitly elevated.

Top-level workflows:

1. **My Gear** — browse owned equipment, tackle, and bait.
2. **Knowledge Base** — browse Locations, Species, Equipment, Techniques, Knots, and Catch Log.

### Current verified production release

Latest verified release:

- PR **#28** — `Add final Fishing KB content and imagery batch`
- merge commit **`093139e5314af55691e608277b68b79b2d369166`**
- production workflow **#121 / `33840208952`**
- build job: success
- all model/routing/final-content tests: success
- local-media validation: success
- bundle verification: success
- GitHub Pages artifact upload: success
- **Deploy to GitHub Pages: success**

Recent release sequence:

- PR #24 — flat Equipment KB taxonomy and related polish
- PR #25 — catch imagery/browse-list media polish and Yellow Perch convention
- PR #26 — repository-local media hardening and image validation
- PR #27 — Recovery B Gear/search/layout/content fixes
- PR #28 — final KB content/images batch, new Equipment/Technique articles, species-image replacements, lure-type cleanup, and filter placement fix

Current accepted browse behavior includes:

- Search appears on browsable lists at **10+ entries**; root My Gear and root Knowledge Base have global search.
- On large screens, Search is placed with page actions; when Search and a dropdown/filter coexist, the filter control is right-aligned.
- My Gear → Line is intentionally flat rather than grouped by braid/fluorocarbon headings.
- Current lure type labels include **Soft plastics and swimbaits**, **Topwater**, and **Trolling lures**.
- Gear leaf Notes may link to relevant KB articles using `kb://...`.
- KB representative pictures that depict a specific owned item can carry its exact Gear stable ID so the caption links to My Gear.

## Deferred editing features

My Gear remains browse-only. Do not add Add/Edit/Delete forms or expose JSON import/export controls unless the user explicitly resumes v2 editing work.

When v2 editing resumes, normal forms are the everyday path; validated JSON export → external edit → import may be used for bulk editing/backup. Do not add an in-app raw JSON editor.

## Start here in a new chat

Copy `Fishing_New_Chat_Bootstrap_Prompt.md` into a new **Chat-mode** conversation.

Required repository read order:

1. `README.md`
2. `Fishing_Context.md`
3. `Fishing_TODO.md`
4. `Fishing_Decision_Log.md`
5. `pwa/README.md`

Then inspect the relevant runtime data/model files for the task. Do not reconstruct current PWA state from old chats or legacy Markdown when the structured runtime data is available.

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

## Time-sensitive information

Fishing regulations, stocking, product availability, launch/access rules, weather, and current fishing conditions are time-sensitive. Reverify with current authoritative sources when planning a trip or purchase.

## Development / deployment rule

For meaningful PWA changes:

1. start from current `main`;
2. use a normal feature/fix branch;
3. make coherent durable commits on GitHub;
4. open a PR;
5. require PR CI to pass on the **exact final head SHA**;
6. merge only that tested head;
7. verify the resulting production workflow on the exact merge commit;
8. verify the actual **Deploy to GitHub Pages** step before calling the change live.

Do not treat temporary ChatGPT-side preparation as durable progress. Prefer small resumable GitHub commits when a long tool-driven turn could fail.

Before implementing a requirement with substantial architecture, deployment, maintenance, performance, or usability impact, surface the tradeoff and confirm its priority. Privacy/access control is P3 unless explicitly elevated.
