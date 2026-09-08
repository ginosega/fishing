# Fishing Context

**Status: ACTIVE / production healthy.** Reconciled September 8, 2026. The latest maintenance release is PR56, merge `531f04a84c0d75e2a7f23dc368149de5026b607b`, production #285 / `34188668110` succeeded including actual GitHub Pages deployment. The latest application-feature release remains PR48. No application release is pending.

## Authority and operating mode

The durable repository is `ginosega/fishing`. Restore current main and relevant branches before acting; do not depend on old chats, stale bootstrap checkpoints or historical release labels. Current structured PWA sources own runtime facts. Root Gear Registry, Tackle Inventory, Topics, former OneNote/PDF and historical records are reference material, not parallel runtime databases. Original migration/audit and PR28 content acceptance remain closed. Earlier documentation is preserved in Git history and `History/`.

Use Chat mode by default. Do not recommend Work for complexity, length, file volume, research, calculations, analysis or artifacts. Recommend temporary Work only for a specific Work-only capability, explain why and obtain user approval. An authorized change continues through implementation, validation, PR/CI, merge, production verification, cleanup and authoritative-record reconciliation without intermediate approval gates. Progress is informational; stop only for genuine blockers or complete scope.

## Current runtime architecture

Fishing Companion is single-user and offline-capable, with three durable domains sharing stable identity, explicit ownership, strict validation, authored narrative and exact feature-driven relationships without forcing identical schemas or storage.

**My Gear:** Schema4, 65 source records, dataVersion `2026-09-08-my-gear-v4-dagger-length-1`. Structured JSON/IndexedDB owns facts; optional stable-ID Markdown owns Notes. Manufacturer `{name}`, optional Model and Specifications, ordered Links `{label,url}` without classifications. No inline Notes, profiles, usage/connections, knowledgeRefs or setup mainLine/leader. Equipment is the display label for internal category `accessories`, with Kayaks, Tools, Tackle Management, Electronics, Storage and Accessories. All existing IDs and non-seed local records must be preserved.

**Knowledge Base:** Schema1, 54 entities, dataVersion `2026-09-08-kb-v1-three-hero-images-1`. Flat types location/species/equipment/technique/knot, with complete authored Markdown Content and optional description/picture. Equipment displays Gear Guides, subtitle `Equipment, rigs, and presentations reference`. Type—not an ID prefix or directory—controls taxonomy. No nested atomic guidance schema or duplicate local KB database.

**Catch Log:** Schema2, five historical catches, dataVersion `2026-09-04-catches-v2-external-notes-1`. Exact known Species/Location, one Lure/Bait and optional known setup/presentation; no inferred relationships. Structured facts and forward references own relationships, backlinks are derived, optional Markdown owns narrative. No Planner, sessions, trip history, accounts, sync or multi-user expansion.

Browser Gear/KB Add/Edit prepares validated copyable packages for chat/repository promotion; it does not write GitHub directly or maintain competing data. Existing IDs are immutable; taxonomy and paired-setup administration are chat-managed. `gear://` and `kb://` are authored navigation, not a speculative relationship graph.

## Current equipment and media state

The owned Dagger Axis 10.5 is Gear/media ID `dagger-axis-10-5`, category Equipment/Kayaks. The user-confirmed Length is `10' 6"`; Height `15.25"`, Width `28.5"`, Weight `50 lb`, and Cockpit opening `52.5"x23.5" (6.0 deck)` remain as submitted. No Notes were requested or created. FISH-TODO-065 is resolved.

The current Dagger source path is `pwa/assets/gear-source/dagger-axis-10-5.png`, with explicit owner `dagger-axis-10-5`. Direct user replacements at that exact source path must be preserved; prior source versions remain in Git history. The media pipeline validates actual format/extension/size and copies source bytes without recompression into the built Gear asset.

PR56 also registered three KB hero pictures from the exact user-uploaded repository files:
- `technique-fishing-line` → `./assets/kb/entries/technique-fishing-line.jpg`, alt `Sufix 832 fishing line`, explicit Gear association `sufix-832-15`.
- `technique-walking-bait` → `./assets/kb/entries/technique-walking-bait.jpg`, alt `Heddon Zara Spook`, with no inferred owner/provenance.
- `technique-rods-reels` → `./assets/kb/entries/technique-rods-reels.png`, alt `Baitcasting reel`, with no inferred owner/provenance.

The supplied Markdown for all three entries was a keep operation and remains unchanged. Previous PR52 Buzzbait/Jack Hammer media, the Bonafide RVR119 record/Notes/media and all other user-authored content remain preserved. FISH-TODO-063 separately tracks clearer KB filename/destination guidance.

## Release and validation

PR56 final feature head `d17d7b0c52955c06ef55659d6062e8b6f4a44759` passed normal CI #284 / `34188600391` against main `5265a393cce601a59540de2a17f5b7c56b4d3535`. Merge `531f04a84c0d75e2a7f23dc368149de5026b607b` passed production #285 / `34188668110`, including actual Pages deployment. The workflow passed the accepted kayak correction/KB image regression, Dagger identity/ownership checks, all existing Gear/KB/Catch model/routing/authoring/media tests, build, authored Notes materialization, local-media materialization, complete transformed-bundle validation, exact accepted KB-image byte checks and final bundle verification.

No one-time migration was rerun and no permanent test was bypassed. The live site is `https://ginosega.github.io/fishing/`. Start future work from current main and the canonical TODO, preserve direct-main edits, and coordinate releases around `fishing-pages` concurrency. For exact latest release evidence use `pwa/DAGGER_AXIS_RELEASE_2026-09-08.md`.
