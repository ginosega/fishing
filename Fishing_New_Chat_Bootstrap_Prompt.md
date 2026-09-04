# Fishing New Chat Bootstrap Prompt

**Status:** ACTIVE HANDOFF — PRODUCTION VERIFIED 2026-09-04

Copy the prompt below into a new **Chat-mode** Fishing conversation.

---

You are helping with my persistent **Fishing** project. The durable project repository is `ginosega/fishing` on GitHub. Do not rely on assumptions from an old chat; restore current state from the repository first.

## Operating mode

Operating mode: This project uses Chat mode by default. Do not recommend Work unless a task specifically requires a Work-only capability. Never recommend Work merely because the project or task is complex, lengthy, file-heavy, analytical, or involves creating artifacts. Explain the specific need and obtain my approval before recommending a temporary switch.

## First actions in this new chat

Read these files first, in order:

1. `README.md`
2. `Fishing_Context.md`
3. `Fishing_TODO.md`
4. `Fishing_Decision_Log.md`
5. `pwa/README.md`

Then, depending on the task:

- For **My Gear**, inspect `pwa/data/gear.seed.json`, `pwa/gear-model.js`, `pwa/gear-store.js`, `pwa/gear-app.js`, `pwa/media-owners.json`, `pwa/media-sources.json`, `pwa/local-media.json`, and `pwa/apply-local-media.mjs`.
- For **Knowledge Base/Catch Log**, inspect `pwa/data/kb.seed.json`, `pwa/data/catches.seed.json`, `pwa/kb-model.js`, `pwa/kb-app.js`, `pwa/markdown-render.js`, and the relevant complete documents under `pwa/kb-content/`.
- For data-model rationale, inspect `pwa/KB_DATA_MODEL_DESIGN.md` and `pwa/DATA_MODEL_RECONCILIATION_DESIGN.md`.
- Use `Topics/*.md`, `Fishing_Gear_Registry.md`, and `Fishing_Tackle_Inventory.md` only as migrated/reference history when useful; they are **not runtime application data sources**.

## Current architecture — important

Fishing Companion has three durable application-data domains that share identity/ownership/validation principles without forcing identical storage.

### 1. My Gear — structured local-first

Architecture:

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

Current seed:

- schema version `2`
- data version `2026-09-04-my-gear-v2-final-content-1`
- **63 records**
- categories: Rods & Reels, Line, Weights, Snaps & Swivels, Hooks, Lures, Bait

My Gear owns structured owned facts such as manufacturer, model, specifications, typed external links, and stable identity. Optional `notes` is Markdown narrative.

Do **not** reintroduce the retired v1 concepts:

- `profiles`
- structured `usage` / `connections`
- `usageProfileId` / `connectionProfileId`
- setup `mainLine` / `leader`
- speculative `configuration` or `knowledgeRefs`
- raw HTML guidance
- manufacturer/model/link-type inference from Markdown or display text

Authored Notes may use:

- `gear://stable-gear-id`
- `kb://stable-kb-id`

Those are navigation links, not maintained domain relationships.

**Knots are not My Gear records.**

### 2. Knowledge Base — unified indexed Markdown documents

Every KB entity uses the same envelope:

- stable `id`
- `type`: `location`, `species`, `equipment`, `technique`, or `knot`
- `name`
- optional `description`
- optional `picture`
- `content`: one complete Markdown document

Current seed:

- schema version `1`
- data version `2026-09-04-kb-v1-final-content-1`
- **54 entities**: 8 Locations, 7 Species, 22 Equipment, 7 Techniques, 10 Knots

**Equipment** is a flat peer type for rigs, presentations, lure/gear guides, and equipment-oriented fishing knowledge. **Technique** is for strategy, seasonal/condition guidance, species tactics, and other non-equipment methods. Existing stable `technique-*` IDs may remain unchanged when an article is classified as Equipment.

Use, Rigging, Notes, Resources, tables, links, warnings, and embedded pictures belong inside complete Markdown Content. Do not add atomic schema fields or parse prose to infer domain facts.

### 3. Catch Log — structured historical relationships

`pwa/data/catches.seed.json` currently contains **5 catches**.

Catch Log owns the exact structured relationships current product behavior needs:

- Catch → Species
- Catch → Location
- optional Catch → setup
- optional Catch → Technique/Equipment presentation when explicitly recorded
- exactly one Catch → Lure or Bait

Historical setup/technique is never inferred. Backlinks are computed rather than stored redundantly.

An exact `catch.picture` overrides the fallback image. When absent, Catch cards/pages use the linked Species picture.

## Retired product concepts

Do not reintroduce unless I explicitly reopen them:

- Planner / Planner Attributes
- fishing sessions / Session ID
- trip history or no-catch session model
- legacy Markdown fact parser/router
- fuzzy Gear identity matching
- fuzzy media-to-Gear matching

The current application is browse-focused and personal.

## Current Fishing Companion production state

Live site:

`https://ginosega.github.io/fishing/`

### Latest verified release

**PR #28 — Add final Fishing KB content and imagery batch**

- exact tested PR head: `c397985e99532b0ea572afd9910c0d131469a439`
- PR CI: **#120 / 33840154633** — success
- merge commit: `093139e5314af55691e608277b68b79b2d369166`
- production workflow: **#121 / 33840208952** — success
- production build: success
- GitHub Pages artifact upload: success
- **Deploy to GitHub Pages: success**

Immediately preceding releases:

- PR #26 — repository-local media hardening; merge `9af96810cb02c81da2a0e3f5463071e020ae6cfc`; production #113 / `33833494282`
- PR #27 — Recovery B Gear/browse/content updates; merge `2635d9eb5cb80d446050090ba3f5a2736cac0c84`; production #117 / `33834793404`

### What PR #28 delivered

The final supplied MHT batch became the current authored KB content. Existing pages refreshed:

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

New KB pages:

- Inline Spinner
- Snaps & Swivels
- Flasher Rig
- Inline Trolling Rig
- Bobber Rig
- Slip Sinker Rig
- Spring Fishing

The batch also:

- added authored My Gear/KB cross-links where appropriate;
- added Inline Spinner and Snaps & Swivels links to relevant Gear Notes;
- activated the new local rig images and replacement Rainbow Trout, Coastal Cutthroat Trout, Smallmouth Bass, and Largemouth Bass pictures;
- reused exact owned-Gear images for the requested Swimbait, Jerkbait, Crankbait, Chatterbait, Spinnerbait, Jig, and Frog KB pages;
- renamed lure types to **Soft plastics and swimbaits**, **Topwater**, and **Trolling lures**;
- removed the separate Material spec row from the South Bend 120-Piece Hook Assortment and South Bend 24-Piece Assorted Brass Swivels;
- corrected Search+filter layout so dropdown/filter controls sit on the right.

## Current UI conventions

- Root My Gear and root Knowledge Base always have Search.
- Browse-list Search appears at **10 or more entries** and is omitted below 10.
- On pages with both Search and a dropdown/filter, the filter is right-aligned.
- Line is intentionally flat; Rods & Reels retains grouping.
- My Gear title/subtitle are left; Search/Back actions sit to the right on large screens and adapt on mobile.
- My Gear contains no Knots category.
- My Gear is browse-only: no visible My Gear data card, no Export/Import controls, no Add/Edit/Delete forms.
- Gear leaf pages use structured Manufacturer / Model, Specifications, Links, and optional Markdown **Notes**.
- KB representative pictures that depict a specific owned item may store explicit `gearItemId` and link the caption to that My Gear leaf.

## Media workflow — standing rule

This is important because it blocked the project repeatedly on 2026-09-03.

The failure was **not** the PWA, GitHub Actions, or bad image files. The unreliable step was transporting binary image bytes/base64 through ChatGPT's GitHub tool path.

For future user-supplied images:

1. I provide the exact feature branch, repository path, and filename.
2. I upload the binary image directly to GitHub myself on that branch.
3. You verify that file in GitHub.
4. You update `pwa/local-media.json`, data, Markdown, tests, and build checks as appropriate.
5. **Do not try to base64-encode or upload image binaries through ChatGPT/GitHub connector calls.**

`pwa/apply-local-media.mjs` validates repository-local image size, signature/structure, and filename extension, copies active local assets into `dist`, and verifies that the built bytes match the source. The production workflow also asserts required local assets.

## My Gear v2 editing — still deferred

Do not build editing UI unless I explicitly resume it.

When resumed:

- normal forms are the everyday Add/Edit/Delete path;
- validated JSON export/import may be backup/bulk-edit tooling;
- no in-app raw JSON editor.

## Current core fishing setup

### Kayak

- Bonafide RVR119, paddle-only.
- No pedal drive, motor, anchor, stakeout pole, or drift sock currently documented as owned.
- Humminbird Helix 5 CHIRP DI GPS G3 with XNT 9 HW DI T transducer.
- Garmin Navionics phone app for detailed contours.

### Main spinning setup

- Daiwa Tatula XT `TATULAXT702MFS`
- Daiwa Exceler LT `EXELT2500D-XH`
- Sufix 832 15 lb Hi-Vis Yellow braid
- Seaguar InvizX 8 lb fluorocarbon leader

### Main baitcasting setup

- Shimano Zodias `ZDC72MHB`
- Shimano 22 SLX DC XT 71HG
- PowerPro Super8 Slick V2 30 lb Moss Green braid
- Seaguar InvizX 12 lb fluorocarbon leader

### Shore trout spincast setup

- Pflueger President Spincast Combo `PRESSC-606L2CBO`
- 6'6" medium-power 2-piece rod
- 3.8:1 reel
- recommended 6 lb mono

For exact product values and current owned inventory, trust `pwa/data/gear.seed.json` rather than reconstructing from this bootstrap.

## Current unresolved priorities

Use `Fishing_TODO.md` as canonical. Important current items:

1. Spot-check/accept the PR #28 production content and imagery; report any final corrections.
2. Resolve the PowerBait hook-size conflict (#4 OneNote rig vs. prior #8 guidance).
3. Resolve the loop-knot guidance conflict.
4. Continue adding structured catches; record setup on new catches when known.
5. Verify actual fish-finder power/wiring installed state.
6. Verify Bonafide RVR119 brass insert/thread sizes.
7. Resolve rear flush rod-holder angle modification.
8. Confirm purchase status of Bonafide under-seat tackle storage and YakAttack fish cooler bag.
9. Remaining candidate KB articles include Texas Rig, Carolina Rig, Alabama Rig, Neko Rig, and Spoons.

## Evidence/status labels for reference Markdown

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

Do not convert candidate gear into owned gear unless I confirm it or current durable runtime data already establishes ownership.

## Durable update rules

### My Gear

- update `pwa/data/gear.seed.json` for durable baseline Gear changes;
- preserve stable IDs and strict schema-v2 validity;
- update tests when invariants change;
- data fixes belong in structured records, not presentation hacks;
- do not parse legacy Markdown to recreate Gear facts.

### Knowledge Base / Catch Log

- update `pwa/data/kb.seed.json` for the entity index;
- update the registered complete document under `pwa/kb-content/` for authored KB content;
- update `pwa/data/catches.seed.json` for structured catches;
- preserve stable IDs and validate `gear://`, `kb://`, and Catch relationships;
- do not infer domain relationships from prose.

### Project state

- update `Fishing_Context.md` for current state;
- update `Fishing_Decision_Log.md` for durable decisions/process rules;
- update `Fishing_TODO.md` for unresolved/completed work;
- keep this bootstrap consistent with those files when transferring chats.

## Development/deployment workflow

For meaningful PWA changes:

1. fetch latest `main` and create a normal feature/fix branch;
2. make coherent durable commits;
3. open a PR;
4. wait for **PR CI on the exact final head**;
5. fix failures and rerun until that exact head is green;
6. merge that tested head;
7. verify the production workflow on the exact merge commit;
8. verify both production build and actual **Deploy to GitHub Pages** succeeded;
9. only then call the change live.

Avoid disposable workflows and routine direct-to-main editing. If a task times out, prefer durable GitHub checkpoints over keeping important state only in the chat turn.

If a requirement materially affects architecture, deployment, maintenance burden, performance, or usability, explain the impact and discuss priority before letting it drive the design. Privacy/access control remains P3 unless explicitly elevated.

## Immediate continuation instruction

Start in **Chat mode**. Restore state from the repository in the read order above and confirm the latest `main`/production state before making new changes. Treat My Gear schema v2, unified five-type KB Entity model, structured Catch Log, flat Equipment taxonomy, direct-GitHub user-image upload workflow, retired Planner scope, and current browse-only My Gear behavior as durable decisions unless I explicitly reopen them.

The likely immediate next step is either my PR #28 visual/content acceptance pass or a new request from me. Do not restart the My Gear or KB architecture design from scratch.

---

This bootstrap supersedes all earlier Fishing bootstrap versions.
