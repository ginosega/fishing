# Fishing Context

**Status: ACTIVE / production healthy.** Reconciled September 8, 2026. The latest content release is PR56, merge `531f04a84c0d75e2a7f23dc368149de5026b607b`, production #285 / `34188668110`, successful including actual Pages deployment. See `pwa/RELEASE_2026-09-08_KAYAK_KB_IMAGES.md`. No application release is pending.

## Authority and operating mode

The durable repository is `ginosega/fishing`. Restore current main and relevant branches before acting; do not depend on old chats, stale bootstrap checkpoints or historical release labels. Structured PWA sources own runtime facts. Root Gear Registry, Tackle Inventory, Topics, former OneNote/PDF and historical records are references, not parallel runtime databases. Original migration/audit and PR28 content acceptance remain closed. Earlier documentation is preserved in Git history and `History/`, including `History/2026-09-08-pre-three-kb-images/`.

Use Chat mode by default. Do not recommend Work for complexity, length, file volume, research, calculations, analysis or artifacts. Recommend temporary Work only for a specific Work-only capability, explain why and obtain user approval. An authorized change continues through implementation, validation, PR/CI, merge, production verification, cleanup and authoritative-record reconciliation without intermediate approval gates. Progress is informational; stop only for genuine blockers or complete scope.

## Current runtime architecture

Fishing Companion is single-user and offline-capable, with three durable domains sharing stable identity, explicit ownership, strict validation, authored narrative and exact feature-driven relationships without forcing identical schemas or storage.

**My Gear:** Schema4, 65 source records, dataVersion `2026-09-08-my-gear-v4-dagger-length-1`. Structured JSON/IndexedDB owns facts; optional stable-ID Markdown owns Notes. Manufacturer `{name}`, optional Model and Specifications, ordered Links `{label,url}` without classifications. No inline Notes, profiles, usage/connections, knowledgeRefs or setup mainLine/leader. Equipment is the display label for internal category `accessories`, with Kayaks, Tools, Tackle Management, Electronics, Storage and Accessories. All existing IDs and non-seed local records must be preserved.

**Knowledge Base:** Schema1, 54 entities, dataVersion `2026-09-08-kb-v1-three-hero-images-1`. Flat types location/species/equipment/technique/knot, with complete authored Markdown Content and optional description/picture. Equipment displays Gear Guides, subtitle `Equipment, rigs, and presentations reference`. Type—not an ID prefix or directory—controls taxonomy. No nested atomic guidance schema or duplicate local KB database.

**Catch Log:** Schema2, five historical catches, dataVersion `2026-09-04-catches-v2-external-notes-1`. Exact known Species/Location, one Lure/Bait and optional known setup/presentation; no inferred relationships. Structured facts and forward references own relationships, backlinks are derived, optional Markdown owns narrative. No Planner, sessions, trip history, accounts, sync or multi-user expansion.

Browser Gear/KB Add/Edit prepares validated copyable packages for chat/repository promotion; it does not write GitHub directly or maintain competing data. Existing IDs are immutable; taxonomy and paired-setup administration are chat-managed. `gear://` and `kb://` are authored navigation, not a speculative relationship graph.

## Equipment and media state

Dagger Axis 10.5 is an owned Kayaks Equipment record, ID/media ID `dagger-axis-10-5`. The user confirmed Length `10' 6"`, now corrected. Other specifications remain Height `15.25"`, Width `28.5"`, Weight `50 lb`, Cockpit opening `52.5"x23.5" (6.0 deck)`. Manufacturer, model, ordered link and no-Notes state are unchanged. FISH065 is DONE.

The current source `pwa/assets/gear-source/dagger-axis-10-5.png` is Git blob `17ad66ac19cc0a71f3ca4c3fd4ea6ec5e881ac51`, 393226 bytes, from the user's main replacement commit `5265a393cce601a59540de2a17f5b7c56b4d3535`. The original blob `b6b9c96057adda124b7369952e851b13cf2f3b7b` remains in Git history. Existing owner, source path and destination are preserved. The media pipeline validates actual type/extension/size, resolves explicit owners, and copies source bytes without recompression.

The three KB pictures are registered at `./assets/kb/entries/technique-fishing-line.jpg`, `./assets/kb/entries/technique-walking-bait.jpg` and `./assets/kb/entries/technique-rods-reels.png`. Their IDs, names, descriptions, content paths and original complete Markdown remain unchanged. Fishing Line's explicit `gearItemId` is `sufix-832-15`; no Gear association is inferred for the other two. All null provenance fields are retained as supplied. FISH066 is DONE.

The existing Bonafide RVR119, its authored Notes, all other Gear ownership, previous Buzzbait/Jack Hammer images, and all KB/Catch records remain preserved. FISH063 separately tracks clearer KB filename/destination guidance. Historical media references do not imply ownership or external provenance.

## Release and validation

PR56 final head `d17d7b0c52955c06ef55659d6062e8b6f4a44759` passed normal CI #284 / `34188600391` against main `5265a393cce601a59540de2a17f5b7c56b4d3535`. Merge `531f04a84c0d75e2a7f23dc368149de5026b607b` passed production #285 / `34188668110`, including actual Pages deployment. The source-aware promotion used current resolved Gear media; all permanent source/model/routing/authoring/promotion/media/content and final-bundle tests passed. New regression checks verify exact source facts, image blobs, authored Markdown and byte-identical final assets. Temporary executors were removed, denied permissions respected and no migration rerun.

The live site is `https://ginosega.github.io/fishing/`. Browser acceptance and independent HTTP verification remain separate. Start future work from current main, not the closed PR56 branch or historical migrations. Preserve direct-main edits and coordinate releases around `fishing-pages` concurrency. Exact evidence is in the latest release closeout; prior Dagger, image and recovery closeouts remain historical. Open work belongs in `Fishing_TODO.md`.