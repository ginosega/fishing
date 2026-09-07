# Fishing Context

**Status: ACTIVE / production healthy / Gear authoring refinement pending release.** Reconciled for chat transfer on 2026-09-06. This is the authoritative current-state router; historical facts and full release details remain in their domain owners and the release handoff.

## Immediate release checkpoint

The latest verified production source at this audit is main `cdb1c500f08394a9c44ea2012b6de72adbd46ecc`, merged PR #45 (Bonafide RVR119), with production workflow #235 reported successful. The user confirmed that PR #44's module-cache fix restored My Gear home-card navigation. No current production outage is known.

The approved Gear refinement is preserved, **not merged or deployed**, on `feature/gear-guides-ordered-links` at `24ea22ac187f81b42c2d91743e0a470ba3d1ad94`. Temporary migration workflow #6 / `34088215783` succeeded; the final normal PR, exact-head CI, merge, and production Pages deployment remain outstanding. The full source inventory and recovery/release checklist are in `Fishing_Release_Handoff_2026-09-06.md`. FISH-TODO-058 is IN PROGRESS. Do not restart the implementation or declare it live.

## Operating mode and source authority

Use Chat mode by default. Do not recommend Work for complexity, duration, file volume, analysis, research, or artifact creation. Recommend it only for a specific Work-only capability, explain the need, and obtain user approval.

The durable repository is `ginosega/fishing`; restore latest main and relevant branch state before acting. GitHub Markdown is the project knowledge base, but runtime data is owned by the structured PWA sources described below. Historical OneNote/PDF, migrated Topics, Gear Registry, and Tackle Inventory remain references, not parallel runtime databases. The old migration audit and PR #28 content acceptance are closed. Do not reopen them without a specific new discrepancy.

## User fishing profile and current equipment

Primary geography is western Washington, especially Kirkland, Lake Washington, Lake Sammamish, and regional camping lakes. Typical fishing partners are son Jacob and family; targets include bass, trout, perch/panfish, and mixed species. The user prefers practical recommendations matched to actual owned gear and current water conditions, and uses Fishing Companion for quick field reference.

The owned primary platform is a **Bonafide RVR119 paddle-only kayak**. No pedal drive, motor, anchor, stakeout pole, or drift sock is documented as owned. Contour planning uses Garmin Navionics on the phone. On-water electronics: Humminbird Helix 5 CHIRP DI GPS G3 with XNT 9 HW DI T transducer. The installed power/wiring state still needs verification. Detailed owners are `Topics/Bonafide_RVR119_Kayak.md`, `Topics/Fish_Finder_Electronics_Wiring.md`, and `Topics/Kayak_Rigging_Accessories_Storage.md`.

Current rod systems, with exact structured records authoritative:

- Spinning: Daiwa Tatula XT `TATULAXT702MFS`, 7' medium fast 2-piece; Daiwa Exceler LT `EXELT2500D-XH`, 6.2:1; Sufix 832 15 lb Hi-Vis Yellow braid; Seaguar InvizX 8 lb fluorocarbon leader.
- Baitcasting: Shimano Zodias `ZDC72MHB`, 7'2" medium-heavy fast; Shimano 22 SLX DC XT 71HG, 7.4:1; PowerPro Super8 Slick V2 30 lb Moss Green braid; Seaguar InvizX 12 lb fluorocarbon leader.
- Shore/spincast: Pflueger President Spincast Combo `PRESSC-606L2CBO`, 6'6" medium 2-piece, 3.8:1 reel; recommended 6 lb monofilament.

The user typically carries two rods on the kayak. For current paddle-only fishing, favor practical route fishing, drifts, trolling passes, and casting ahead rather than assuming stationary motor/anchor control. Helix provides sonar/down imaging/GPS, not side imaging or forward-facing sonar.

## Application domains and shared principles

Fishing Companion is single-user/offline-capable, with three durable domains that share stable identity, explicit fact ownership, strict validation, exact feature-driven relationships, authored-narrative separation, and final transformed-data validation. They need not share identical schemas or storage. `gear://` and `kb://` are authored navigation, not maintained relationship graphs. Do not infer identities or historical relationships from prose, labels, image aliases, or similar names.

### My Gear — deployed baseline

Main contains schema **3**, data version `2026-09-06-my-gear-v3-bonafide-rvr119-1`, **64 records**. Source/runtime owners are `pwa/data/gear.seed.json`, `pwa/gear-model.js`, `pwa/gear-store.js`, `pwa/gear-app.js`, and the media/Notes pipeline. Structured product/setup facts are in JSON/IndexedDB; optional authored Notes live at `pwa/gear-content/<stable-id>.md`. Inline JSON Notes, profiles, usage/connections, setup mainLine/leader, and knowledgeRefs are retired. Knots belong in KB, not My Gear.

Existing Add/Edit authoring is live from PR42, with PR44's cache fix user-confirmed. `#/inventory/new` and `#/inventory/edit/<id>` generate a validated `fishing-companion-gear-change-v1` package for chat/repository promotion. The browser does not write GitHub or create a divergent local Gear database. Existing IDs are read-only. Category/Type administration remains chat-managed. Rods & Reels have embedded components and limited setup editing; new paired setups/component changes remain chat-managed. Manufacturer, Model, Specifications, and Links are optional for ordinary products.

The deployed category is Accessories, with Types Kayaks, Tools, Tackle Management, Electronics, Storage, Miscellaneous. These labels are **superseded by the approved pending release**, not yet production state. The old 63-record count is historical and must not be used to overwrite PR45 data.

### My Gear — approved pending schema4

The pending feature uses data version `2026-09-06-my-gear-v4-ordered-links-1`, retaining all 64 records and stable IDs. My Gear displays **Equipment**, retains internal category key `accessories`, and has Types Kayaks, Tools, Tackle Management, Electronics, Storage, Accessories. The approved light-blue kayak/gray-paddle SVG remains the category icon. Taxonomy is still administered through chat.

Manufacturer is `{name}`; Links are ordered `{label,url}` pairs, with former manufacturer URLs first and no classifications. The form removes Manufacturer URL and Link Type, and uses subtitle `Create a new Gear item entry for handoff.` Leaf links retain stored order and the section is omitted when empty. A validated schema3→4 upgrade preserves non-seed local records; seed-managed data refreshes by version.

Supporting Notes images may live beside Markdown in `pwa/gear-content/`, with safe Gear-ID-prefixed filenames and relative references. The build validates formats, extensions, paths, ownership, sizes and offline inclusion, and preserves exact bytes. Old `assets/gear-notes/` references remain supported. Hero images remain separate media-owned assets. Existing-picture Edit shows the actual source/media ID, has explicit Keep/Replace, supports same-filename replacement, and preserves media identity. No bulk legacy migration is required.

### Knowledge Base

Schema **1**, data version `2026-09-04-kb-v1-final-content-1`, **54 entities**: 8 Locations, 7 Species, 22 Equipment, 7 Techniques, 10 Knots. Each uses id, type, name, optional description/picture, and one complete Markdown Content path. Sources are `pwa/data/kb.seed.json`, `pwa/kb-content/`, `pwa/kb-model.js`, `pwa/kb-app.js`, and shared renderer.

Equipment is a flat peer type for rigs, presentations, lure/gear guides; Technique is for strategy/conditions/species-oriented guidance. Their documents currently share `pwa/kb-content/techniques/`, and type—not directory or ID prefix—controls taxonomy. The pending release changes the KB equipment card display to **Gear Guides** with exact subtitle `Equipment, rigs, and presentations reference`, without changing the underlying type or stable IDs. The KB remains document-oriented and browse-only.

### Catch Log

Schema **2**, data version `2026-09-04-catches-v2-external-notes-1`, **5 catches**. Source `pwa/data/catches.seed.json`; optional narrative `pwa/catch-content/<catch-id>.md`. Required Species and Location IDs, exactly one Lure/Bait, optional setup/presentation only when actually known. Historical setup/technique is never inferred. Backlinks derive from Catch-owned forward references. Exact catch picture overrides Species fallback. One optional Notes card; no structured Exact Spot Notes, generated Notes, source/Provenance, Planner, sessions, or trip history.

## Media, Markdown, and UI conventions

Media identity is explicit in `pwa/media-owners.json`; source/provenance is in `pwa/media-sources.json`; active local images in `pwa/local-media.json`, applied by `pwa/apply-local-media.mjs`. Exact owner IDs must be preserved. KB may intentionally reuse built Gear picture paths with explicit ownership. Validate the final transformed KB/combined bundle after media substitutions; source-only validation is insufficient.

User image binaries are uploaded directly to GitHub at the exact branch/path/filename specified by the assistant. Do not transport user image bytes/base64 through ChatGPT/GitHub connectors. Assistant verifies the uploaded file, updates text data/manifests/tests, and runs CI. Existing image bytes should be retained/reused, not reconstructed. Ordinary Markdown edits can be made directly in GitHub, but `pwa/**` commits trigger Pages. The shared `fishing-pages` concurrency group uses `cancel-in-progress: true`; avoid overlapping content commits with runtime release validation/deployment.

Root My Gear/KB Search is always available; nonempty search hides the category grid and shows results directly below controls. Browse Search appears at 10+ records; filters align right when present. Line is flat, Rods & Reels grouped. No My Gear raw JSON editor. Card thumbnails use square white contain frames without cropping. User-facing lure labels include Soft plastics and swimbaits, Topwater, and Trolling; the stored `Trolling lures` alias remains intentional.

The custom Markdown renderer preserves nested unordered/ordered lists and loose-list continuation paragraphs. Do not flatten valid source to work around rendering. Authored stable-ID links may appear under any sensible heading; validate targets rather than requiring `## Related`. PR34/PR41 fixed those renderer defects. PR28 final content acceptance closed through PR32; subsequent direct Markdown changes are normal maintenance.

## Current content and unresolved priorities

PR45 added the owned Bonafide RVR119, Gear ID `bonafide-rvr119`, source image `pwa/assets/gear-source/bonafide-rvr119.png`, Notes `pwa/gear-content/bonafide-rvr119.md`. Preserve the exact user-provided specs, links, and authored Notes. The public serial number remains as supplied unless the user requests removal. Do not silently rename the authored `# Accessories` Notes heading during taxonomy migration.

Cylinder Weights is Gear ID `cylinder-weights`, media ID `thkfish-cylinder-weights`. Its replacement image remains pending user supply; preserve existing media until a valid local replacement is registered. The proposed source is `pwa/assets/gear-source/cylinder-weights.png` or matching real extension. Track separately as FISH-TODO-059.

Use `Fishing_TODO.md` for the full backlog. Important unresolved items include fish-finder installed power/wiring, kayak insert threads, rear flush rod-holder angle, under-seat tackle storage and cooler ownership, PowerBait hook-size and loop-knot conflicts, remaining Texas/Carolina/Alabama/Neko/Spoons KB pages, and Catch additions. Historical research/candidate gear is not owned without confirmation. The separate Trailer griddle item belongs in the Trailer project, not Fishing.

## Release and handoff history

PR39 established unified external Gear/Catch Notes and removed duplicate narrative fields. PR41 fixed loose ordered lists. PR42 deployed Gear Add/Edit authoring; PR44 fixed module cache and was user-confirmed; PR45 added the Bonafide RVR119. The exact main and unmerged branch checkpoint above supersede older ‘latest release’ wording. Historical PR28/PR30/PR34/PR36 and night-end audit facts remain in the Decision Log and release history. No hidden unmerged PR29 recovery work is outstanding.

The immediate next task is FISH-TODO-058, not a new architecture review. Resume the preserved branch and finish normal release work. The separate `Fishing_Release_Handoff_2026-09-06.md` records all temporary artifacts, test evidence, source SHAs, and release steps. Re-fetch current GitHub state on continuation. Do not mark the feature complete or deployed until actual evidence exists.