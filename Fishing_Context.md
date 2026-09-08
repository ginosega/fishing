**Status: ACTIVE / production healthy / KB Add/Edit deployed.** Reconciled September 7, 2026 against the deployed PR48 application release and PR49 documentation closeout.

## Immediate release checkpoint

PR #48, final head `85245de2451db97370268e14dfc2c66a53c8c61d`, passed normal PR CI #251 / `34142498510` against main `f05b7ec532d8e45f3fc36c1e0976c5ea40eb9983`. Merge `6d04e29b6770000eaa50f6c449ad82bc88f7326d` passed production #252 / `34142574286`, including the actual Deploy to GitHub Pages step. The production run completed September 7, 2026 at 16:18:08 UTC. This remains the latest application-feature release. PR #49 then closed the release records; merge `024bec08a51c103e98c9913e786db2de40155b64` passed production #254 / `34159581055`.

PR47 is the preceding user-accepted Gear release, merge `f05b7ec532d8e45f3fc36c1e0976c5ea40eb9983`, production #240 / `34135326910`. Gear schema4 and the user-uploaded Cylinder Weights image were verified by the user. FISH-TODO-058, 059 and 060 are DONE. The September 6 handoff is historical recovery evidence, not an open release instruction. No historical migration is to be rerun.

There is no pending application release. The remaining backlog is maintained in `Fishing_TODO.md`; user acceptance of KB Add/Edit can be recorded without reopening the completed deployment.

## Operating mode and source authority

Use Chat mode by default. Do not recommend Work for complexity, duration, file volume, analysis, research, or artifact creation. Recommend it only for a specific Work-only capability, explain the need, and obtain user approval.

For an authorized change, continue end-to-end until the requested implementation, validation, release, production verification, cleanup, and authoritative-document reconciliation are complete. Intermediate findings or progress reports are not approval gates and must not end active work. Stop only for a genuine blocker requiring user input/permission or when the requested scope is actually complete.

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

### My Gear — deployed schema4

Main contains schema **4**, data version `2026-09-06-my-gear-v4-ordered-links-1`, **64 records**. Source/runtime owners are `pwa/data/gear.seed.json`, `pwa/gear-model.js`, `pwa/gear-store.js`, `pwa/gear-app.js`, and the media/Notes pipeline. Structured product/setup facts are in JSON/IndexedDB; optional authored Notes live at `pwa/gear-content/<stable-id>.md`. Inline JSON Notes, profiles, usage/connections, setup mainLine/leader, and knowledgeRefs are retired. Knots belong in KB, not My Gear.

Existing Add/Edit authoring is live from PR42, with PR44's cache fix user-confirmed. `#/inventory/new` and `#/inventory/edit/<id>` generate a validated `fishing-companion-gear-change-v1` package for chat/repository promotion. The browser does not write GitHub or create a divergent local Gear database. Existing IDs are read-only. Category/Type administration remains chat-managed. Rods & Reels have embedded components and limited setup editing; new paired setups/component changes remain chat-managed. Manufacturer, Model, Specifications, and Links are optional for ordinary products.

The eighth category displays **Equipment**, retaining internal key `accessories`, with Types Kayaks, Tools, Tackle Management, Electronics, Storage, Accessories. The approved light-blue kayak/gray-paddle icon is live. Taxonomy administration remains chat-managed.

Manufacturer is `{name}`; Links are ordered `{label,url}` pairs, with former manufacturer URLs first and no classifications. The form omits Manufacturer URL and Link Type; empty Links sections are hidden. The schema3→4 upgrade preserves non-seed local records, and seed-managed data refreshes by version.

Supporting Notes images may live beside Markdown in `pwa/gear-content/` with safe Gear-ID-prefixed filenames. The build validates format, extension, ownership, size, exact bytes and offline inclusion; legacy `assets/gear-notes/` references remain supported. Existing-picture Edit shows actual source/media identity, explicit Keep/Replace and same-filename replacement. No bulk conversion is required. Permanent media-policy and final-bundle tests run in the normal Pages workflow.

### Knowledge Base

Schema **1**, data version `2026-09-04-kb-v1-final-content-1`, **54 entities**: 8 Locations, 7 Species, 22 Equipment, 7 Techniques, 10 Knots. Each uses id, type, name, optional description/picture, and one complete Markdown Content path. Sources are `pwa/data/kb.seed.json`, `pwa/kb-content/`, `pwa/kb-model.js`, `pwa/kb-app.js`, and shared renderer.

Equipment is a flat peer type for rigs, presentations, lure/gear guides; Technique is for strategy/conditions/species-oriented guidance. Their documents currently share `pwa/kb-content/techniques/`, and type—not directory or ID prefix—controls taxonomy. PR47 changed the KB equipment card display to **Gear Guides** with exact subtitle `Equipment, rigs, and presentations reference`, without changing the underlying type or stable IDs. The KB remains document-oriented. Add/Edit is deployed under FISH-TODO-060: complete Markdown, immutable existing ID/path, source-aware image actions, validated copyable handoffs and no competing local database. The source index and transformed display pictures must remain distinct. Existing Type prefixes are conventions, not identity constraints after reclassification.

### Catch Log

Schema **2**, data version `2026-09-04-catches-v2-external-notes-1`, **5 catches**. Source `pwa/data/catches.seed.json`; optional narrative `pwa/catch-content/<catch-id>.md`. Required Species and Location IDs, exactly one Lure/Bait, optional setup/presentation only when actually known. Historical setup/technique is never inferred. Backlinks derive from Catch-owned forward references. Exact catch picture overrides Species fallback. One optional Notes card; no structured Exact Spot Notes, generated Notes, source/Provenance, Planner, sessions, or trip history.

## Media, Markdown, and UI conventions

Media identity is explicit in `pwa/media-owners.json`; source/provenance is in `pwa/media-sources.json`; active local images in `pwa/local-media.json`, applied by `pwa/apply-local-media.mjs`. Exact owner IDs must be preserved. KB may intentionally reuse built Gear picture paths with explicit ownership. Validate the final transformed KB/combined bundle after media substitutions; source-only validation is insufficient.

User image binaries are uploaded directly to GitHub at the exact branch/path/filename specified by the assistant. Do not transport user image bytes/base64 through ChatGPT/GitHub connectors. Assistant verifies the uploaded file, updates text data/manifests/tests, and runs CI. Existing image bytes should be retained/reused, not reconstructed. Ordinary Markdown edits can be made directly in GitHub, but `pwa/**` commits trigger Pages. The shared `fishing-pages` concurrency group uses `cancel-in-progress: true`; avoid overlapping content commits with runtime release validation/deployment.

Root My Gear/KB Search is always available; nonempty search hides the category grid and shows results directly below controls. Browse Search appears at 10+ records; filters align right when present. Line is flat, Rods & Reels grouped. No My Gear raw JSON editor. Card thumbnails use square white contain frames without cropping. User-facing lure labels include Soft plastics and swimbaits, Topwater, and Trolling; the stored `Trolling lures` alias remains intentional.

The custom Markdown renderer preserves nested unordered/ordered lists and loose-list continuation paragraphs. Do not flatten valid source to work around rendering. Authored stable-ID links may appear under any sensible heading; validate targets rather than requiring `## Related`. PR34/PR41 fixed those renderer defects. PR28 final content acceptance closed through PR32; subsequent direct Markdown changes are normal maintenance.

## Current content and unresolved priorities

PR45 added the owned Bonafide RVR119, Gear ID `bonafide-rvr119`, source image `pwa/assets/gear-source/bonafide-rvr119.png`, Notes `pwa/gear-content/bonafide-rvr119.md`. Preserve the exact user-provided specs, links, and authored Notes. The public serial number remains as supplied unless the user requests removal. Do not silently rename the authored `# Accessories` Notes heading during taxonomy migration.

Cylinder Weights is Gear ID `cylinder-weights`, media ID `thkfish-cylinder-weights`. The user uploaded `pwa/assets/gear-source/thkfish-cylinder-weights.jpg`; PR47 registered it while preserving the media ID, owner and provenance. The user confirmed the new image appears on the live site. FISH-TODO-059 is DONE.

Use `Fishing_TODO.md` for the full backlog. Important unresolved items include fish-finder installed power/wiring, kayak insert threads, rear flush rod-holder angle, under-seat tackle storage and cooler ownership, PowerBait hook-size and loop-knot conflicts, remaining Texas/Carolina/Alabama/Neko/Spoons KB pages, and Catch additions. Historical research/candidate gear is not owned without confirmation. The separate Trailer griddle item belongs in the Trailer project, not Fishing.

## Release and handoff history

PR39 established external Gear/Catch Notes; PR41 fixed loose ordered lists; PR42 deployed Gear Add/Edit; PR44 fixed module caching and was user-confirmed; PR45 added the Bonafide RVR119; PR46 reconciled the interrupted handoff; PR47 deployed schema4 and Cylinder Weights; PR48 deployed KB Add/Edit. Production #252 completed successfully on September 7, 2026. Historical content acceptance and migration audits remain closed.

The current application-code baseline is PR48 merge `6d04e29b6770000eaa50f6c449ad82bc88f7326d`; later documentation-only reconciliations do not change the application model or record counts. Preserve all 64 Gear, 54 KB and five Catch records; do not reintroduce Planner/sessions, inferred relationships, raw JSON editing, or duplicate storage. Future changes start from current main and the canonical backlog. Keep Context, TODO, Decision Log, bootstrap and PWA README consistent with actual release evidence.
