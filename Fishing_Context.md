# Fishing Context

**Status:** Active authoritative current-state summary. OneNote migration/link restoration completed 2026-08-29; My Gear schema-v2/data-model reconciliation completed 2026-09-02; repository-local media recovery completed 2026-09-03; latest Fishing Companion production release verified 2026-09-04.

This file is a compact router/current-state summary. Detailed procedures and long-form fishing knowledge belong in their domain owners.

## Operating mode

Operating mode: This project uses Chat mode by default. Do not recommend Work unless a task specifically requires a Work-only capability. Never recommend Work merely because the project or task is complex, lengthy, file-heavy, analytical, or involves creating artifacts. Explain the specific need and obtain the user's approval before recommending a temporary switch.

## User fishing profile

- Primary geography: Western Washington, especially Kirkland / Lake Washington / Lake Sammamish, plus regional camping lakes.
- Main fishing partners: son Jacob and family.
- Main platforms: Bonafide RVR119 kayak, bank fishing, dock fishing.
- Common targets: bass, trout, panfish/perch, and opportunistic mixed species.
- Preferred planning style: practical, rod-by-rod, matched to actual gear and current location conditions.
- Fishing Companion is intended to make project knowledge and inventory fast to consume in the field.

## Current core platform

- Kayak: **Bonafide RVR119**, paddle-only.
- No pedal drive, motor, anchor, stakeout pole, or drift sock currently documented as owned.
- Mapping: Garmin Navionics phone app for detailed contours.
- On-water electronics: Humminbird Helix 5 CHIRP DI GPS G3 with XNT 9 HW DI T transducer.

Details remain in `Topics/Bonafide_RVR119_Kayak.md`, `Topics/Fish_Finder_Electronics_Wiring.md`, and `Topics/Kayak_Rigging_Accessories_Storage.md`.

## Current rod systems

### Spinning / finesse / trout

- Daiwa Tatula XT `TATULAXT702MFS`, 7', medium, fast, 2-piece.
- Daiwa Exceler LT `EXELT2500D-XH`, 6.2:1.
- Sufix 832 15 lb Hi-Vis Yellow braid.
- Seaguar InvizX 8 lb fluorocarbon leader.

### Baitcasting / general-purpose bass

- Shimano Zodias `ZDC72MHB`, 7'2", medium-heavy, fast.
- Shimano 22 SLX DC XT 71HG, 7.4:1.
- PowerPro Super8 Slick V2 30 lb Moss Green braid.
- Seaguar InvizX 12 lb fluorocarbon leader.

### Shore trout spincast

- Pflueger President Spincast Combo, part `PRESSC-606L2CBO`.
- 6'6" medium-power 2-piece rod, 3.8:1 reel.
- Recommended 6 lb monofilament.

For exact current owned-record values, trust `pwa/data/gear.seed.json`.

## Application data routing

### My Gear

My Gear is structured local-first data and does **not** parse Markdown inventory tables.

Runtime/source owners:

- `pwa/data/gear.seed.json`
- `pwa/gear-model.js`
- `pwa/gear-store.js`
- `pwa/gear-app.js`
- `pwa/media-owners.json`
- `pwa/media-sources.json`
- `pwa/local-media.json`
- `pwa/apply-local-media.mjs`

Current seed:

- schema version `2`
- data version `2026-09-04-my-gear-v2-final-content-1`
- **63 records**
- categories: Rods & Reels, Line, Weights, Snaps & Swivels, Hooks, Lures, Bait

My Gear owns structured product/setup facts. Optional `notes` is Markdown. `gear://` and `kb://` links inside Notes are authored navigation, not maintained domain relationships. Knots are intentionally not in My Gear.

`Fishing_Gear_Registry.md` and `Fishing_Tackle_Inventory.md` remain migrated/reference sources, not runtime sources.

### Knowledge Base

Knowledge Base entities use one unified envelope:

- `id`
- `type`: `location`, `species`, `equipment`, `technique`, or `knot`
- `name`
- optional `description`
- optional `picture`
- `content`: one complete Markdown document

Runtime/source owners are `pwa/data/kb.seed.json`, `pwa/kb-content/`, `pwa/kb-model.js`, `pwa/kb-app.js`, and `pwa/markdown-render.js`.

Current seed:

- schema version `1`
- data version `2026-09-04-kb-v1-final-content-1`
- **54 entities**: 8 Locations, 7 Species, 22 Equipment, 7 Techniques, 10 Knots

Equipment is a flat peer category for rigs, presentations, lure/gear guides, and equipment knowledge. Technique is reserved for strategy/conditions/species-oriented guidance. Stable IDs survive taxonomy changes.

PR #28 added Inline Spinner, Snaps & Swivels, Flasher Rig, Inline Trolling Rig, Bobber Rig, Slip Sinker Rig, and Spring Fishing and refreshed Swimbait, Jerkbait, Crankbait, Chatterbait, Spinnerbait, Jig, Frog, Drop Shot, Wacky Worm, Ned Rig, and Trout Fishing.

### Catch Log

- source: `pwa/data/catches.seed.json`
- **5 structured catches**
- required Species + Location IDs
- exactly one Lure or Bait relationship
- optional setup/technique references only when actually known
- no inference of historical setup/technique
- backlinks computed from Catch-owned forward references
- optional exact catch picture overrides Species-picture fallback

Planner, Planner Attributes, fishing sessions, session IDs, and trip history are retired.

## Fishing Companion production state

Live URL: `https://ginosega.github.io/fishing/`

### Latest verified release

**PR #28 — Add final Fishing KB content and imagery batch**

- exact tested head: `c397985e99532b0ea572afd9910c0d131469a439`
- PR CI: **#120 / 33840154633**, success
- merge commit: `093139e5314af55691e608277b68b79b2d369166`
- production workflow: **#121 / 33840208952**, success
- production build: success
- GitHub Pages artifact: success
- **Deploy to GitHub Pages: success**

Recent releases immediately preceding it:

- PR #26: repository-local media hardening; merge `9af96810cb02c81da2a0e3f5463071e020ae6cfc`; production #113 / `33833494282`
- PR #27: Recovery B Gear/browse/content updates; merge `2635d9eb5cb80d446050090ba3f5a2736cac0c84`; production #117 / `33834793404`

### Current accepted behavior

- Root My Gear and root Knowledge Base have Search.
- Browse-list Search appears at **10+ entries**.
- When Search and a dropdown/filter coexist, the filter control is right-aligned.
- Line is flat; Rods & Reels remains grouped by setup type.
- My Gear is browse-only with no visible import/export card and no CRUD forms.
- Gear leaf pages show structured facts plus optional Markdown **Notes**.
- Applicable Gear Notes link to KB articles with stable `kb://` IDs.
- KB pictures for specific owned items may explicitly reference a stable Gear ID.
- Lure type labels include **Soft plastics and swimbaits**, **Topwater**, and **Trolling lures**.
- South Bend hook/swivel records retain requested size information without a separate `Material` specification row.

## Media handling convention

The repeated 2026-09-03 failures were isolated to binary transport through the ChatGPT-to-GitHub tool path, not to the PWA or GitHub Actions.

Standing workflow for user-supplied images:

1. ChatGPT specifies exact branch/path/filename.
2. User uploads the binary directly to GitHub on that feature branch.
3. ChatGPT verifies the uploaded file and handles manifests/data/tests/PR/deploy.
4. Do **not** encode or push image binaries through ChatGPT tool calls.

`pwa/apply-local-media.mjs` validates repository-local image size, format signatures/structure, and extension consistency before copying assets into the build. `pwa/local-media.json` is the active local-media configuration.

## Deferred v2 behavior

- Do not add My Gear Add/Edit/Delete forms yet.
- Do not expose JSON import/export controls in the current UI.
- Future normal CRUD should use ordinary forms.
- Future bulk backup/edit may use validated JSON export → edit externally → import.
- Do not add an in-app raw JSON editor.

## Current operational constraints

- Paddle-only kayak with no anchor/drift sock: emphasize route fishing, controlled drifts, trolling passes, and casting ahead rather than stationary hovering.
- Helix has sonar/down imaging/GPS but no side imaging or forward-facing sonar.
- Navionics is the contour-planning tool; Helix confirms depth, weeds, bait, bottom changes, and fish marks.
- User usually carries only two rods on the kayak.

## Active unresolved priorities

Use `Fishing_TODO.md` as canonical. Important unresolved items include:

- resolve PowerBait hook-size guidance conflict;
- resolve loop-knot guidance conflict;
- continue structured Catch Log additions without inventing historical relationships;
- verify actual fish-finder wiring/power installed state;
- verify Bonafide RVR119 insert bolt/thread sizes;
- decide whether/how to modify the rear flush rod-holder angle;
- confirm purchase status of Bonafide under-seat tackle storage and YakAttack fish cooler bag;
- complete remaining candidate KB articles such as Texas, Carolina, Alabama, Neko rigs, and Spoons;
- perform user-facing spot-check/acceptance of the latest PR #28 production content if not already done.

## Migration record

OneNote PDF migration and MHT link restoration are closed historical work. If something later appears missing or conflicts with recollection, use current structured runtime data, `Fishing_Decision_Log.md`, `Fishing_TODO.md`, user confirmation, manufacturer documentation, or targeted historical-source recovery as appropriate. Do not reopen exhaustive migration reconciliation by default.
