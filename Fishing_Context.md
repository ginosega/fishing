# Fishing Context

**Status: ACTIVE / production recovery verified.** Reconciled September 7, 2026. The latest maintenance release is PR50, merge `fcf28f34b89f68c22e8a2200e8410509801ff801`, production #260 / `34184126036` succeeded. The latest application-feature release remains PR48. See `Fishing_Recovery_Closeout_2026-09-07.md` for exact evidence and limitations. No application release is pending.

## Authority and operating mode

The durable repository is `ginosega/fishing`. Restore current main and relevant branches before acting; do not depend on an old chat or historical release checkpoint. Current structured PWA sources own runtime facts. The root Gear Registry, Tackle Inventory, Topics, former OneNote/PDF and historical records are reference material, not parallel runtime databases. The original migration audit and PR28 content acceptance remain closed.

Use Chat mode by default. Do not recommend Work for complexity, duration, research, analysis, file volume or artifact creation. Recommend a temporary switch only for a specific Work-only capability, explain the need and obtain approval. An authorized change continues end-to-end through implementation, validation, PR/CI, merge, production verification, cleanup and authoritative-record reconciliation. Intermediate updates are not approval gates. Stop only for a genuine blocker requiring user input/permission or completed scope.

## Fishing profile and current equipment

Primary geography is western Washington, especially Kirkland, Lake Washington, Lake Sammamish and regional camping lakes. Targets include bass, trout, perch/panfish and mixed species. The user prefers practical recommendations matched to actual owned gear, water conditions and field use.

The owned platform is a Bonafide RVR119 paddle-only kayak. A pedal drive, motor, anchor, stakeout pole and drift sock are not documented as owned. Contour planning uses Garmin Navionics on the phone. Electronics are Humminbird Helix 5 CHIRP DI GPS G3 with XNT 9 HW DI T transducer; installed power/wiring still needs verification. Favor paddle-compatible routes, drifts, trolling passes and casting ahead; do not assume motor, anchor, side imaging or forward-facing sonar.

Current rod systems, with structured records authoritative:

- Spinning: Daiwa Tatula XT `TATULAXT702MFS`, 7' medium fast 2-piece; Daiwa Exceler LT `EXELT2500D-XH`, 6.2:1; Sufix 832 15 lb Hi-Vis Yellow braid; Seaguar InvizX 8 lb fluorocarbon leader.
- Baitcasting: Shimano Zodias `ZDC72MHB`, 7'2" medium-heavy fast; Shimano 22 SLX DC XT 71HG, 7.4:1; PowerPro Super8 Slick V2 30 lb Moss Green braid; Seaguar InvizX 12 lb fluorocarbon leader.
- Shore/spincast: Pflueger President Spincast Combo `PRESSC-606L2CBO`, 6'6" medium 2-piece, 3.8:1 reel; recommended 6 lb monofilament.

The user typically carries two rods on the kayak. Detailed owners include `Topics/Bonafide_RVR119_Kayak.md`, `Topics/Fish_Finder_Electronics_Wiring.md`, `Topics/Kayak_Rigging_Accessories_Storage.md` and `Fishing_Gear_Registry.md`. All detailed pre-recovery context is retained in `History/2026-09-07-pre-recovery/Fishing_Context.md`.

## Application architecture

Fishing Companion is single-user and offline-capable, with three durable domains. They share stable identity, explicit fact ownership, strict validation, exact feature-driven relationships, authored-narrative separation and final transformed-data validation without forcing identical schemas/storage. No inferred identity, ownership or historical Catch attribution. `gear://` and `kb://` are authored navigation, not relationship tables.

**My Gear:** Schema4, 64 records, data version `2026-09-06-my-gear-v4-ordered-links-1`. `pwa/data/gear.seed.json` and `pwa/gear-model.js` own structured facts; IndexedDB is local-first storage. Optional narrative is `pwa/gear-content/<stable-id>.md`, never inline JSON Notes. Profiles, usage/connections, knowledgeRefs and setup mainLine/leader are retired. Knots belong in KB. Gear Add/Edit creates validated `fishing-companion-gear-change-v1` handoff packages, not direct GitHub writes or a competing local database. Existing IDs are read-only; taxonomy and paired-setup administration remain chat-managed. Ordinary product Manufacturer, Model, Specifications and Links are optional. Manufacturer is `{name}`; ordered Links are `{label,url}` without classifications. Gear's Equipment category retains key `accessories` and Types Kayaks, Tools, Tackle Management, Electronics, Storage, Accessories.

**Knowledge Base:** Schema1, 54 entities (8 Locations, 7 Species, 22 Equipment, 7 Techniques, 10 Knots), data version `2026-09-04-kb-v1-final-content-1`. `pwa/data/kb.seed.json` indexes complete authored Markdown in `pwa/kb-content/`. Envelope: id, type, name, optional description/picture and Content path. Types are location, species, equipment, technique, knot. Equipment is a flat peer for rigs/presentations/gear guides; Technique is for strategy/conditions/species methods. Directory and historical ID prefix do not determine type. The equipment card displays Gear Guides, subtitle `Equipment, rigs, and presentations reference`. Add/Edit edits complete Markdown with Preview, immutable existing IDs/paths, safe reclassification, source-aware images and validated copyable packages. No atomic guidance schema or duplicate KB database.

**Catch Log:** Schema2, five historical records, data version `2026-09-04-catches-v2-external-notes-1`. `pwa/data/catches.seed.json` owns exact known Species/Location, one Lure/Bait and optional known setup/presentation. Narrative is `pwa/catch-content/<catch-id>.md`. No inferred historical attribution, generated Notes, Provenance/source, Planner, sessions or trip history. Backlinks derive from Catch-owned forward references; exact catch picture overrides Species fallback.

## Media, Markdown and release safety

`pwa/media-sources.json` owns source/provenance, `pwa/media-owners.json` exact Gear associations, and `pwa/local-media.json` active local assets. KB can intentionally reuse built Gear images. Validate source image bytes, actual format/extension, safe paths, ownership and final transformed data after media substitution. Preserve image bytes and historical provenance; never delete current media before replacement validation. User binaries are uploaded directly to exact GitHub branch/path/filenames, never transported through the connector. Gear Notes sibling images may use safe Gear-ID-prefixed relative filenames; legacy Notes image paths remain supported.

Root Gear/KB Search always; nonempty search hides category cards. Browse Search at 10+ records; filters right-aligned where applicable. Line flat, Rods grouped. No raw JSON editor. Card images use square white contain frames, not cropping. Preserve valid nested/loose Markdown lists and continuation paragraphs. Stable-ID links may appear under any heading; never require a Related heading. User-facing lure labels include Soft plastics and swimbaits, Topwater and Trolling; stored `Trolling lures` remains intentional.

The Bonafide Gear ID is `bonafide-rvr119`, source image `pwa/assets/gear-source/bonafide-rvr119.png`, Notes `pwa/gear-content/bonafide-rvr119.md`. Preserve its latest user-expanded Notes, specs, links and supplied serial number unless removal is requested. Cylinder Weights is Gear ID `cylinder-weights`, media ID `thkfish-cylinder-weights`, source `pwa/assets/gear-source/thkfish-cylinder-weights.jpg`; PR47 registered it and the user verified it live. The latest Z-Man Jack Hammer and Buzzbait uploads remain intact, without inferred new ownership or media associations.

Meaningful runtime changes use a feature branch, normal PR CI against current base, expected-head merge and actual production Pages verification. Never omit permanent tests or rerun one-time migrations. Shared Pages concurrency is `fishing-pages` with `cancel-in-progress:true`; avoid overlapping main content writes/releases. Preserve user-authored files and final data on every reconciliation.

## Backlog and history

`Fishing_TODO.md` is the canonical active backlog. Outstanding work includes fish-finder wiring, kayak insert threads and rod-holder angle, under-seat storage/cooler ownership, bow-hatch tie-off, PowerBait hook-size/loop-knot conflicts, Texas/Carolina/Alabama/Neko/Spoons KB pages and Catch additions. Research/candidate products are not owned without confirmation. The separate Trailer griddle item belongs in the Trailer project.

PR39 externalized Gear/Catch Notes; PR41 fixed Markdown; PR42 deployed Gear Add/Edit; PR44 fixed caching; PR45 added RVR119; PR46 reconciled handoff; PR47 deployed schema4/Cylinder Weights; PR48 deployed KB Add/Edit; PR49 closed release records; PR50 repaired the content regression and incorporated the full audit branch. FISH-TODO-058/059/060/061 are DONE. Historical details are in the September 6 handoff, September 7 release closeout, decision history, Git history and the preserved pre-recovery context. New work starts from current main and the canonical TODO, not retired feature/audit branches.
