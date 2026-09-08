# Fishing Context

**Status: ACTIVE / production healthy.** Reconciled September 8, 2026. Latest application release: PR60, final head `cd47dc9ce39660840de493346e7df9fda72a14e5`, normal CI #307 / `34191643311`, merge `ecd9f3d52ca8180ea4f48ec888e7574105deafda`, production #308 / `34191692935`, including actual GitHub Pages deployment. Gear schema4/66 uses `2026-09-08-my-gear-v4-perception-joyride-1`; KB schema1/54 uses `2026-09-08-kb-v1-cranberry-lake-picture-1`; Catch schema2/5 remains `2026-09-04-catches-v2-external-notes-1`. FISH069 and FISH070 are DONE; FISH063 remains OPEN. No application release is pending. See `pwa/RELEASE_2026-09-08_CRANBERRY_COPY.md`.

## Authority and operating mode

The durable repository is `ginosega/fishing`. Restore current main and relevant branches before acting; do not depend on old chats, stale bootstrap checkpoints or historical release labels. Structured PWA sources own runtime facts. Root Gear Registry, Tackle Inventory, Topics, former OneNote/PDF and historical records are references, not parallel runtime databases. Original migration/audit and PR28 content acceptance remain closed. Earlier documentation is preserved in Git history and `History/`.

Use Chat mode by default. Do not recommend Work for complexity, length, file volume, research, calculations, analysis or artifacts. Recommend temporary Work only for a specific Work-only capability, explain why and obtain user approval. An authorized change continues through implementation, validation, PR/CI, merge, production verification, cleanup and authoritative-record reconciliation without intermediate approval gates. Progress is informational; stop only for genuine blockers or complete scope.

## Current runtime architecture

Fishing Companion is single-user and offline-capable, with three durable domains sharing stable identity, explicit ownership, strict validation, authored narrative and exact feature-driven relationships without forcing identical schemas or storage.

**My Gear:** Schema4, 66 source records, dataVersion `2026-09-08-my-gear-v4-perception-joyride-1`. Structured JSON/IndexedDB owns facts; optional stable-ID Markdown owns Notes. Manufacturer `{name}`, optional Model and Specifications, ordered Links `{label,url}` without classifications. No inline Notes, profiles, usage/connections, knowledgeRefs or setup mainLine/leader. Equipment is the display label for internal category `accessories`, with Kayaks, Tools, Tackle Management, Electronics, Storage and Accessories. All existing IDs and non-seed local records must be preserved.

**Knowledge Base:** Schema1, 54 entities, dataVersion `2026-09-08-kb-v1-cranberry-lake-picture-1`. Flat types location/species/equipment/technique/knot, with complete authored Markdown Content and optional description/picture. Equipment displays Gear Guides. Type—not an ID prefix or directory—controls taxonomy. No nested atomic guidance schema or duplicate local KB database.

**Catch Log:** Schema2, five historical catches, dataVersion `2026-09-04-catches-v2-external-notes-1`. Exact known Species/Location, one Lure/Bait and optional known setup/presentation; no inferred relationships. Structured facts and forward references own relationships, backlinks are derived, optional Markdown owns narrative. No Planner, sessions, trip history, accounts, sync or multi-user expansion.

Browser Gear/KB Add/Edit prepares validated copyable packages for chat/repository promotion; it does not write GitHub directly or maintain competing data. Existing IDs are immutable; taxonomy and paired-setup administration are chat-managed. `gear://` and `kb://` are authored navigation, not a speculative relationship graph.

## Equipment and media state

**Perception Joyride 10.0:** PR58 added owned Gear ID/media ID `perception-joyride-10-0`, category `accessories`, type `Accessories`, exactly as supplied. Manufacturer Perception; model Joyride 10.0; specifications Length `10'`, Height `15.25"`, Width `28.5"`, Weight `50 lb`, Color `Funkadelic`; one ordered Perception link. No Notes file exists. The source is `pwa/assets/gear-source/perception-joyride-10.png`, Git blob `f24403f79788755e267ee721f5e93c34c3f8f472`, 562530 bytes, explicitly owned by `perception-joyride-10-0`. The build materializes byte-identical display media at `./assets/gear/perception-joyride-10-0.png`.

**Dagger Axis 10.5:** owned Gear/media ID `dagger-axis-10-5`; confirmed Length `10' 6"`. Current source `pwa/assets/gear-source/dagger-axis-10-5.png` remains the latest user replacement; prior versions remain in Git history. Existing owner, other specifications, link and no-Notes state are unchanged.

**KB hero media:** Fishing Line, Walking Bait and Rods & Reels retain the exact PR56 image bytes and complete authored Markdown. Fishing Line explicitly links its picture to Gear ID `sufix-832-15`; no Gear association is inferred for Walking Bait or Rods & Reels. PR58 changed only Rods & Reels picture caption from null to `Baitcasting reel`; its src `./assets/kb/entries/technique-rods-reels.png`, alt `Baitcasting reel`, credit/sourceUrl null and Markdown remain unchanged.

The existing Bonafide RVR119 and its Notes, all other Gear ownership, previous Buzzbait/Jack Hammer images and all Catch records remain preserved. FISH-TODO-063 separately tracks clearer KB image filename/upload-destination guidance.

## Current Cranberry Lake and page-copy release

Cranberry Lake retains stable ID `location-cranberry-lake-deception-pass`, its original description/content path and complete authored Markdown. Its new picture is `./assets/kb/entries/location-cranberry-lake-deception-pass.png`, alt/caption `Cranberry Lake`, null credit/sourceUrl; matching local-media registration, no inferred ownership. The source PNG is blob `201852612f8985fba057bfe224292bfe2a24d69d` (1,981,945 bytes). The source and published bytes are validated without a permanent historical hash lock.

Home and KB root share `Fishing reference and catch log`; Gear Guides uses `Equipment, rig, and presentation reference`; Catch Log uses `Recorded catches`; Techniques uses `Strategy, conditions, and species reference` without a final period. Category metadata is shared by card/page. No other runtime facts or authored narrative changed. FISH069/070 DONE, FISH063 OPEN.

## Release and validation

PR60 final head `cd47dc9ce39660840de493346e7df9fda72a14e5` passed normal CI #307 / `34191643311` against main `894586f3aac1c4f44a00917ad4071ee5ace2f9c4`. Merge `ecd9f3d52ca8180ea4f48ec888e7574105deafda` passed production #308 / `34191692935`, including the actual Pages deploy. All existing permanent tests, build, authored media/Notes, transformed-data checks and final-bundle validation passed. Temporary promotion machinery was removed before PR CI; no migration was rerun. Prior PR58 and earlier release evidence remains in historical release files.

The live site is `https://ginosega.github.io/fishing/`. GitHub Pages deployment is verified; independent browser/HTTP acceptance is not claimed. Start future work from current main and the canonical TODO. Preserve direct-main edits and coordinate releases around `fishing-pages` concurrency. Exact evidence is in `pwa/RELEASE_2026-09-08_CRANBERRY_COPY.md`; prior release files remain historical.
