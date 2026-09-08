# Fishing Context

**Status: ACTIVE / production healthy.** Reconciled September 8, 2026. The latest maintenance release is PR54, merge `0c07816b33c282cbc31e162812ad15c45d3a4bbe`, production #274 / `34187188334` succeeded. See `pwa/DAGGER_AXIS_RELEASE_2026-09-08.md`. The latest application-feature release remains PR48. No application release is pending.

## Authority and operating mode

The durable repository is `ginosega/fishing`. Restore current main and relevant branches before acting; do not depend on old chats, stale bootstrap checkpoints or historical release labels. Current structured PWA sources own runtime facts. Root Gear Registry, Tackle Inventory, Topics, former OneNote/PDF and historical records are reference material, not parallel runtime databases. Original migration/audit and PR28 content acceptance remain closed. Earlier documentation is preserved in Git history and `History/`, including `History/2026-09-08-pre-dagger-addition/`.

Use Chat mode by default. Do not recommend Work for complexity, length, file volume, research, calculations, analysis or artifacts. Recommend temporary Work only for a specific Work-only capability, explain why and obtain user approval. An authorized change continues through implementation, validation, PR/CI, merge, production verification, cleanup and authoritative-record reconciliation without intermediate approval gates. Progress is informational; stop only for genuine blockers or complete scope.

## Current runtime architecture

Fishing Companion is single-user and offline-capable, with three durable domains sharing stable identity, explicit ownership, strict validation, authored narrative and exact feature-driven relationships without forcing identical schemas or storage.

**My Gear:** Schema4, 65 source records, dataVersion `2026-09-08-my-gear-v4-dagger-axis-1`. Structured JSON/IndexedDB owns facts; optional stable-ID Markdown owns Notes. Manufacturer `{name}`, optional Model and Specifications, ordered Links `{label,url}` without classifications. No inline Notes, profiles, usage/connections, knowledgeRefs or setup mainLine/leader. Equipment is the display label for internal category `accessories`, with Kayaks, Tools, Tackle Management, Electronics, Storage and Accessories. All existing IDs and non-seed local records must be preserved.

**Knowledge Base:** Schema1, 54 entities, dataVersion `2026-09-04-kb-v1-final-content-1`. Flat types location/species/equipment/technique/knot, with complete authored Markdown Content and optional description/picture. Equipment displays Gear Guides, subtitle `Equipment, rigs, and presentations reference`. Type—not an ID prefix or directory—controls taxonomy. No nested atomic guidance schema or duplicate local KB database.

**Catch Log:** Schema2, five historical catches, dataVersion `2026-09-04-catches-v2-external-notes-1`. Exact known Species/Location, one Lure/Bait and optional known setup/presentation; no inferred relationships. Structured facts and forward references own relationships, backlinks are derived, optional Markdown owns narrative. No Planner, sessions, trip history, accounts, sync or multi-user expansion.

Browser Gear/KB Add/Edit prepares validated copyable packages for chat/repository promotion; it does not write GitHub directly or maintain competing data. Existing IDs are immutable; taxonomy and paired-setup administration are chat-managed. `gear://` and `kb://` are authored navigation, not a speculative relationship graph.

## Equipment and media state

The Dagger Axis 10.5 has been added as an owned Kayaks Equipment record, ID/media ID `dagger-axis-10-5`. Its exact submitted fields are preserved, including Length `12' 6"`, Height `15.25"`, Width `28.5"`, Weight `50 lb`, and Cockpit opening `52.5"x23.5" (6.0 deck)`. No Notes were requested or created. The supplied length appears inconsistent with the model designation; FISH-TODO-065 awaits confirmation. Do not silently change it.

The original uploaded picture is `pwa/assets/gear-source/dagger-axis-10-5.png`, Git blob `b6b9c96057adda124b7369952e851b13cf2f3b7b`. Its owner is explicit and its external origin is not inferred. The local-media pipeline validates type/extension/size and copies source bytes without recompression. The existing Bonafide RVR119 record, its Notes, media and all other ownership remain unchanged. The user-uploaded `technique-fishing-line.jpg` on main was preserved during PR54; it has no inferred association.

Previous PR52 registered the Buzzbait picture at `./assets/kb/entries/technique-buzzbait.jpg` and Jack Hammer local source `pwa/assets/gear-source/zman-jack-hammer.png`. Their prior source provenance, ownership and user-authored content remain preserved. FISH063 separately tracks clearer KB filename/destination guidance.

## Release and validation

PR54 final head `bb13ca083b2f99c0fc6006ff7a1362b73f993912` passed normal CI #273 / `34187137697` against main `0f3107d8279ccca75ccb74f907391f370041c9e3`. Merge `0c07816b33c282cbc31e162812ad15c45d3a4bbe` passed production #274 / `34187188334`, including actual Pages deployment. Source and transformed Dagger image identity/ownership/bytes, all existing permanent tests, build and final-bundle validation passed. Disposable promotion workflows were removed; a denied runner workflow-write permission was respected and the authorized connector performed the permanent workflow update. No migration was rerun. Documentation closeout PR55 is administrative.

The live site is `https://ginosega.github.io/fishing/`. User browser acceptance and independent HTTP verification remain separate from verified Pages deployment. Start future work from current main, not the closed PR54 branch or the prior migration/audit branches. Preserve direct-main edits and coordinate releases around `fishing-pages` concurrency. For exact release evidence use the Dagger closeout, then the prior image and recovery closeouts. Open work belongs in `Fishing_TODO.md`; do not reopen completed releases merely because a historical handoff remains in Git history.
