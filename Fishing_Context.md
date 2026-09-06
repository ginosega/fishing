# Fishing Context

**Status:** Active authoritative current-state summary. OneNote migration/link restoration completed 2026-08-29; My Gear local-first/data-model reconciliation completed 2026-09-02; repository-local media recovery completed 2026-09-03; PR #28 content acceptance, PR #34/PR #41 Markdown list rendering, PR #36 UX polish, PR #38 Gear Notes externalization, PR #39 Gear/Catch authored-Notes unification, and PR #42 My Gear Add/Edit authoring/handoff production-deployed by 2026-09-06. Project is in normal maintenance state.

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
- `pwa/gear-content/`
- `pwa/apply-authored-notes.mjs`
- `pwa/media-owners.json`
- `pwa/media-sources.json`
- `pwa/local-media.json`
- `pwa/apply-local-media.mjs`

Current seed:

- schema version `3`
- data version `2026-09-04-my-gear-v3-external-notes-1`
- **63 records**
- allowed categories: Rods & Reels, Line, Weights, Snaps & Swivels, Hooks, Lures, Bait, Accessories
- current Accessories Types: Kayaks, Tools, Tackle Management, Electronics, Storage, Miscellaneous

My Gear owns structured product/setup facts. Optional authored Notes live separately at `pwa/gear-content/<gear-id>.md`; inline JSON `notes` are retired. `gear://` and `kb://` links inside Notes are authored navigation, not maintained domain relationships. Knots are intentionally not in My Gear.

PR #42 added browser Add/Edit **authoring and handoff**, not a second durable database. `#/inventory/new` and `#/inventory/edit/<stable-id>` validate form data and generate a versioned `fishing-companion-gear-change-v1` package for the user to copy into Fishing chat. The form does not call `GearRepository.merge()`/`replace()` and does not write GitHub. GitHub/runtime structured data remains authoritative. Categories and Types are selected from canonical app definitions and are added/removed/renamed only through chat/repository work. Existing Gear IDs are read-only/stable. Picture and Notes Yes/No flows can request add/keep/replace/remove operations and identify the exact repository media/Markdown paths for handoff. Rods & Reels retain their paired-component schema and therefore use a limited edit form; creating/changing their component facts/media remains chat-managed.

For ordinary non-setup Gear products, Manufacturer, Model, Specifications, and Links are optional; Name, Category, Type, and stable ID remain required. This permits legitimate generic tools/storage/accessory records without inventing manufacturer/model data.

The current user-facing lure labels include **Soft plastics and swimbaits**, **Topwater**, and **Trolling**. The seed still contains the internal value `Trolling lures`; PR #36 maps that stored value to the user-facing `Trolling` label in `gear-app.js`, avoiding a seed/IndexedDB migration for a wording-only change.

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

The Equipment and Technique article bodies currently remain physically stored together under `pwa/kb-content/techniques/`; the entity `type` in `kb.seed.json` determines the browse category. Do not rename or move an article file without updating its registered `content` path.

PR #28 added Inline Spinner, Snaps & Swivels, Flasher Rig, Inline Trolling Rig, Bobber Rig, Slip Sinker Rig, and Spring Fishing and refreshed Swimbait, Jerkbait, Crankbait, Chatterbait, Spinnerbait, Jig, Frog, Drop Shot, Wacky Worm, Ned Rig, and Trout Fishing. The 2026-09-04 acceptance pass cleaned the imported Markdown formatting and replaced the Largemouth/Smallmouth Bass pictures supplied by the user.

Subsequent ordinary content maintenance remains part of current production and does not reopen PR #28 acceptance.

### Catch Log

- structured source: `pwa/data/catches.seed.json`
- authored Notes: `pwa/catch-content/<catch-id>.md`
- schema version `2`, data version `2026-09-04-catches-v2-external-notes-1`
- **5 structured catches**
- required Species + Location IDs
- exactly one Lure or Bait relationship
- optional setup/technique references only when actually known
- no inference of historical setup/technique
- backlinks computed from Catch-owned forward references
- optional exact catch picture overrides Species-picture fallback
- Catch narrative is one optional Markdown-backed **Notes** card; the old structured Exact Spot Notes / generated Notes / source-Provenance fields are retired

Planner, Planner Attributes, fishing sessions, session IDs, and trip history are retired.

## Fishing Companion production state

Live URL: `https://ginosega.github.io/fishing/`

### Latest verified runtime release

**PR #42 — Add My Gear item authoring and edit handoff**

- exact tested PR head: `81617e4dcaae92e67444a6a2fd51f6d96ba78b7d`
- PR CI: **#227 / 34062145243** — success
- merge commit: `ab27f2ff312cc181693aa86c4219b26b6977a274`
- production workflow: **#228 / 34062190429** — success
- structured-model/routing/Markdown/final-content tests: success
- PWA build + authored-Notes/local-media validation + bundle verification: success
- GitHub Pages artifact upload: success
- **Deploy to GitHub Pages: success**

PR #42 added the eighth allowed My Gear category, **Accessories**, with the user-approved light-blue kayak/gray-paddle icon and fixed Types Kayaks, Tools, Tackle Management, Electronics, Storage, and Miscellaneous. It also added safe browser Add/Edit authoring forms with stable read-only IDs, repeatable structured Specifications/Links, Picture and Notes Yes/No flows, Markdown Preview, validation, existing-content detection/removal confirmation, and a copyable repository-handoff package. The browser does not persist these authored changes as a competing local source of truth.

PR #41 remains the Markdown loose ordered-list renderer release; PR #39 remains the authored Gear/Catch Notes architecture release; PR #36 remains the prior UX-polish release for the **Trolling** display alias, square non-cropping thumbnails, and root-search replacement behavior.

### Current production lineage

PR #42 merged on exact tested head `81617e4dcaae92e67444a6a2fd51f6d96ba78b7d` as `ab27f2ff312cc181693aa86c4219b26b6977a274` and production-deployed in run #228 / `34062190429`.

The earlier night-end audit checkpoint `955d37bf675f3163fe610324809a972916c98ef0` / production #166 remains historical evidence rather than current production.

### Recent stabilization/recovery sequence

- PR #25: Catch imagery / browse-list media polish
- PR #26: repository-local media hardening
- PR #27: Recovery B Gear/browse/content updates
- PR #28: final KB content and imagery batch
- PR #29: state reconciliation
- PR #30: Gear-backed KB-picture validation hotfix
- PR #31: state reconciliation after recovery
- PR #32: final PR #28 Markdown acceptance cleanup
- PR #33: state reconciliation after final acceptance
- PR #34: nested Markdown list renderer fix
- PR #35: night-end project-state reconciliation
- PR #36: Gear label / thumbnail / root-search UX polish
- PR #38: external Gear Notes Markdown pipeline
- PR #39: remove inline Gear Notes duplicates; externalize Catch Notes and retire Catch Provenance
- PR #41: loose ordered-list/continuation-paragraph Markdown renderer fix
- PR #42: My Gear Accessories taxonomy + Add/Edit authoring/handoff UI

### Current accepted behavior

- Root My Gear and root Knowledge Base have Search.
- A non-empty root Search hides the category-card grid and shows matching result cards directly below the title/back/search controls.
- Browse-list Search appears at **10+ entries**.
- When Search and a dropdown/filter coexist, the filter control is right-aligned.
- Line is flat; Rods & Reels remains grouped by setup type.
- My Gear includes the **Accessories** category and provides `Add Gear item` plus per-leaf `Edit Gear item` authoring/handoff forms; there is still no visible raw JSON import/export editor.
- My Gear authoring does not mutate durable data directly; users copy the validated package into chat for repository promotion.
- Gear leaf pages show structured facts plus optional external Markdown **Notes**.
- Catch leaves show structured facts plus one optional external Markdown **Notes** card; no Provenance card.
- Applicable Gear Notes link to KB articles with stable `kb://` IDs.
- KB pictures for specific owned items may explicitly reference a stable Gear ID.
- User-facing lure labels include **Soft plastics and swimbaits**, **Topwater**, and **Trolling**.
- All Gear/KB/Catch card thumbnails use square white frames and `object-fit: contain`; full image width/height must remain visible, with white letterboxing when necessary.
- South Bend hook/swivel records retain requested size information without a separate `Material` specification row.
- Authored KB/Gear navigation links may live under `# Links`, `## Related`, or another sensible Markdown section; stable-ID target validity matters, not the section label.
- Markdown list indentation is semantic: the PWA renderer must preserve nested unordered/ordered list structure and loose list continuation paragraphs rather than flattening or restarting valid lists.

## Final content acceptance state

The PR #28 Equipment/Technique content and imagery batch is **accepted and closed** as of 2026-09-04. The user completed a broad manual Markdown cleanup directly in GitHub; final review inspected the modified Equipment/Technique documents, fixed remaining structural artifacts, validated replacement bass images through the repository-local media pipeline, and production-deployed PR #32.

No further PR #28 formatting-cleanup work is pending. Future content changes are ordinary KB maintenance.

## Interrupted-chat reconstruction

The interrupted-work sequence is fully reconstructed and closed: PR #24 taxonomy → PR #25 catch/media polish → PR #26 local-media hardening → PR #27 Recovery B → PR #28 final MHT content/images → PR #29 reconciliation → PR #30 production recovery → PR #31 reconciliation → PR #32 final content acceptance → PR #33 reconciliation. No separate hidden/unmerged post-PR #29 application build was found.

PR #34 and later work are subsequent normal application maintenance, not recovered hidden work.

## Media handling convention

The repeated 2026-09-03 failures were isolated to binary transport through the ChatGPT-to-GitHub tool path, not to the PWA or GitHub Actions.

Standing workflow for user-supplied images:

1. ChatGPT specifies exact branch/path/filename.
2. User uploads the binary directly to GitHub on that feature branch.
3. ChatGPT verifies the uploaded file and handles manifests/data/tests/PR/deploy.
4. Do **not** encode or push image binaries through ChatGPT tool calls.

`pwa/apply-local-media.mjs` validates repository-local image size, format signatures/structure, and extension consistency, copies active local assets into the build, updates built metadata, verifies built bytes, and revalidates the transformed KB bundle before deployment.

The thumbnail containment rule is presentation-only; source images do not need to be rewritten to square files.

## My Gear authoring / repository handoff behavior

- Normal product records can be authored with `#/inventory/new` and edited with `#/inventory/edit/<stable-id>`.
- The browser validates the final structured record and generates a `fishing-companion-gear-change-v1` package; it does not persist the change to GitHub or create a divergent local record.
- Category/Type taxonomy is chat-managed. The form only selects existing values; it does not add/remove/rename categories or types.
- Existing Gear IDs are immutable/read-only in the form.
- Picture Yes/No can request addition/replacement/removal; additions identify `pwa/assets/gear-source/<filename>` for direct GitHub binary upload.
- Notes Yes/No can create/update/remove `pwa/gear-content/<gear-id>.md`; Notes use the safe Markdown preview before handoff.
- Rods & Reels remain paired setup records. Their edit form exposes safe setup identity/Notes changes while component details/media remain chat-managed; new paired setup creation remains chat-managed.
- No in-app raw JSON editor is part of the current design.

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
- complete remaining candidate KB articles such as Texas, Carolina, Alabama, Neko rigs, and Spoons.

## Historical night-end audit checkpoint — 2026-09-04

The night-end audit found no unresolved data-model migration, hidden feature branch, pending PR #28 acceptance work, or known production outage. My Gear remained **63 records**, KB **54 entities**, and Catch Log **5 catches**. Its final pre-reconciliation baseline was `955d37bf675f3163fe610324809a972916c98ef0`, production #166 / `33851195203`. That checkpoint is historical; current production is PR #42 merge `ab27f2ff312cc181693aa86c4219b26b6977a274`, production #228 / `34062190429`.

## Migration record

OneNote PDF migration and MHT link restoration are closed historical work. If something later appears missing or conflicts with recollection, use current structured runtime data, `Fishing_Decision_Log.md`, `Fishing_TODO.md`, user confirmation, manufacturer documentation, or targeted historical-source recovery as appropriate. Do not reopen exhaustive migration reconciliation by default.
