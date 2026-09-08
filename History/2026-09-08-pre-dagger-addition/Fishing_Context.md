# Fishing Context

**Status: ACTIVE / production healthy.** Reconciled September 8, 2026. Latest maintenance release PR52, merge `91ee0966eff5ef95d6a7d192a95b10940d0b534e`, normal CI #266 / `34185963172`, production #267 / `34186006471` succeeded, including actual Pages deployment. See `pwa/IMAGE_RELEASE_2026-09-07.md`. FISH-TODO-062 DONE; no pending application release. Browser acceptance remains a normal follow-up.

## Authority and operating mode

The durable repository is `ginosega/fishing`. Restore current main and relevant branches before acting; do not depend on old chats or historical release checkpoints. Current structured PWA sources own runtime facts. Root Gear Registry, Tackle Inventory, Topics, former OneNote/PDF and historical records are reference material, not parallel runtime databases. The original migration audit and PR28 content acceptance remain closed. Complete earlier context is preserved in `History/2026-09-07-pre-recovery/Fishing_Context.md` and `History/2026-09-07-pre-image-closeout/Fishing_Context.md`.

Use Chat mode by default. Do not recommend Work for complexity, duration, research, analysis, file volume or artifact creation. Recommend a temporary switch only for a specific Work-only capability, explain the need and obtain approval. An authorized change continues end-to-end through implementation, validation, PR/CI, merge, production verification, cleanup and authoritative-record reconciliation. Intermediate updates are not approval gates. Stop only for a genuine blocker requiring user input/permission or completed scope.

## Fishing profile and equipment

Primary geography is western Washington, especially Kirkland, Lake Washington, Lake Sammamish and regional camping lakes. Targets include bass, trout, perch/panfish and mixed species. Recommendations should match actual owned gear, water conditions and field use.

The owned platform is a Bonafide RVR119 paddle-only kayak. A pedal drive, motor, anchor, stakeout pole and drift sock are not documented as owned. Contour planning uses Garmin Navionics on the phone. Electronics are Humminbird Helix 5 CHIRP DI GPS G3 with XNT 9 HW DI T transducer; installed power/wiring still needs verification. Favor paddle-compatible routes, drifts, trolling passes and casting ahead; do not assume motor, anchor, side imaging or forward-facing sonar.

Current rod systems, with structured records authoritative:

- Spinning: Daiwa Tatula XT `TATULAXT702MFS`, 7' medium fast 2-piece; Daiwa Exceler LT `EXELT2500D-XH`, 6.2:1; Sufix 832 15 lb Hi-Vis Yellow braid; Seaguar InvizX 8 lb fluorocarbon leader.
- Baitcasting: Shimano Zodias `ZDC72MHB`, 7'2" medium-heavy fast; Shimano 22 SLX DC XT 71HG, 7.4:1; PowerPro Super8 Slick V2 30 lb Moss Green braid; Seaguar InvizX 12 lb fluorocarbon leader.
- Shore/spincast: Pflueger President Spincast Combo `PRESSC-606L2CBO`, 6'6" medium 2-piece, 3.8:1 reel; recommended 6 lb monofilament.

The user typically carries two rods on the kayak. Detailed reference material remains in the Bonafide, fish-finder, rigging and Rods/Reels Topics and Gear Registry. Preserve uncertainty about purchases and installation.

## Application architecture

Fishing Companion is single-user/offline-capable with three durable domains. They share stable identity, explicit fact ownership, strict validation, exact feature-driven relationships, authored-narrative separation and final transformed-data validation without forcing identical schemas/storage. No inferred identity, ownership or historical Catch attribution. `gear://` and `kb://` are authored navigation, not relationship tables.

**My Gear:** Schema4, 64 records, data version `2026-09-06-my-gear-v4-ordered-links-1`. `pwa/data/gear.seed.json` and `pwa/gear-model.js` own structured facts; IndexedDB is local-first storage. Optional narrative is `pwa/gear-content/<stable-id>.md`, never inline JSON Notes. Profiles, usage/connections, knowledgeRefs and setup mainLine/leader are retired. Knots belong in KB. Gear Add/Edit creates validated `fishing-companion-gear-change-v1` handoff packages, not direct GitHub writes or a competing local database. Existing IDs are read-only; taxonomy and paired-setup administration remain chat-managed. Ordinary product Manufacturer, Model, Specifications and Links are optional. Manufacturer is `{name}`; ordered Links are `{label,url}` without classifications. Gear Equipment retains key `accessories`, with Types Kayaks, Tools, Tackle Management, Electronics, Storage, Accessories.

**Knowledge Base:** Schema1, 54 entities (8 Locations, 7 Species, 22 Equipment, 7 Techniques, 10 Knots), data version `2026-09-04-kb-v1-final-content-1`. `pwa/data/kb.seed.json` indexes complete authored Markdown in `pwa/kb-content/`. Envelope: id, type, name, optional description/picture and Content path. Types location, species, equipment, technique, knot. Equipment is a flat peer for rigs/presentations/gear guides; Technique covers strategy/conditions/species methods. Directory and historical ID prefix do not determine type. The equipment card displays Gear Guides. Add/Edit edits complete Markdown with Preview, immutable existing IDs/paths, safe reclassification, source-aware pictures and validated copyable packages. No atomic guidance schema or duplicate KB database.

**Catch Log:** Schema2, five historical records, data version `2026-09-04-catches-v2-external-notes-1`. `pwa/data/catches.seed.json` owns exact known Species/Location, one Lure/Bait and optional known setup/presentation. Narrative is `pwa/catch-content/<catch-id>.md`. No inferred historical attribution, generated Notes, Provenance/source, Planner, sessions or trip history. Backlinks derive from Catch-owned references; exact catch picture overrides Species fallback.

## Media and current release

`pwa/media-sources.json` owns source/provenance, `pwa/media-owners.json` exact Gear associations, and `pwa/local-media.json` active local assets. KB may intentionally reuse built Gear images. Validate source bytes, format/extension, safe paths, ownership and final transformed data. Preserve source bytes and historical provenance; never delete current media before replacement validation. User binaries are uploaded directly to exact GitHub branch/path/filenames, never transported through the connector.

PR52 registered the supplied Buzzbait picture under `./assets/kb/entries/technique-buzzbait.jpg`, preserving the original equipment-directory source. Stable KB ID `technique-buzzbait`, authored Markdown and source dataVersion remain unchanged. Jack Hammer retains Gear/media ID `zman-jack-hammer`, exact ownership and all structured facts/Notes. Its active source is `pwa/assets/gear-source/zman-jack-hammer.png`; historical remote provenance remains in the source/override records and release closeout. The two image bytes were preserved, with no recompression or inferred new ownership. All 64 Gear, 54 KB and five Catch records remain unchanged.

The previous user-expanded Bonafide Notes remain authoritative at `pwa/gear-content/bonafide-rvr119.md`. Its Gear ID, specs, links and supplied serial number must not be rewritten without user authorization. Cylinder Weights retains Gear ID `cylinder-weights`, media ID `thkfish-cylinder-weights`, and source `pwa/assets/gear-source/thkfish-cylinder-weights.jpg`.

Root Gear/KB Search always; nonempty search hides category cards. Browse Search at 10+; filters right-aligned as appropriate. Line flat, Rods grouped. No raw JSON editor. Card images use square white contain frames, not cropping. Preserve valid nested/loose Markdown lists and continuation paragraphs. Stable-ID links may appear under any heading. User-facing lure labels include Soft plastics and swimbaits, Topwater and Trolling; stored `Trolling lures` remains intentional.

## Backlog and release safety

`Fishing_TODO.md` is canonical. FISH063 tracks the confusing KB picture filename/destination workflow; do not weaken safe paths or stable identity to solve it. Other open work includes fish-finder wiring, kayak insert threads, rod-holder angle, under-seat storage/cooler ownership, bow-hatch tie-off, PowerBait hook-size/loop-knot conflicts, Texas/Carolina/Alabama/Neko/Spoons KB pages and Catch additions. Research/candidate products are not owned without confirmation. The separate Trailer griddle item belongs in the Trailer project.

Meaningful runtime changes use feature branch/PR, normal CI against current base, expected-head merge and actual production Pages verification. Never omit permanent tests or rerun one-time migrations. Shared `fishing-pages` concurrency uses cancel-in-progress; avoid overlapping main content writes/releases. Preserve user-authored files and final data on every reconciliation. PR47–49 completed Gear schema4 and KB Add/Edit, PR50/51 recovered and reconciled the project, and PR52 deployed the two pictures. Historical details remain in the earlier release closeouts, recovery record, History and Git history. New work starts from current main and canonical TODO, not retired branches.
