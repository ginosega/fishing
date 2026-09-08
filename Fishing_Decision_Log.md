# Fishing Decision Log

**Status:** Current decision authority, reconciled September 8, 2026. Complete earlier decisions are preserved in `Fishing_Decision_History_Through_2026-09-06.md`, `History/` and Git history. Superseded historical CURRENT labels do not override this index.

## Release authority

The latest application release is PR60, final head `cd47dc9ce39660840de493346e7df9fda72a14e5`, normal CI #307 / `34191643311`, merge `ecd9f3d52ca8180ea4f48ec888e7574105deafda`, production #308 / `34191692935`, including actual GitHub Pages deployment. Gear schema4/66 uses `2026-09-08-my-gear-v4-perception-joyride-1`; KB schema1/54 uses `2026-09-08-kb-v1-cranberry-lake-picture-1`; Catch schema2/5 remains `2026-09-04-catches-v2-external-notes-1`. FISH069 and FISH070 are DONE; FISH063 remains OPEN. No application release is pending. See `pwa/RELEASE_2026-09-08_CRANBERRY_COPY.md`.
 Previous PR58 and earlier releases remain historical evidence.

## Current decisions

| Date | Area | Decision / status |
|---|---|---|
| 2026-09-08 | Cranberry Lake picture | Accept the exact user-authored add-picture handoff for `location-cranberry-lake-deception-pass`. Preserve all existing facts and complete Markdown; register the validated uploaded PNG with alt/caption `Cranberry Lake`, null credit/sourceUrl and no inferred ownership. Advance KB dataVersion to `2026-09-08-kb-v1-cranberry-lake-picture-1`. PR60/FISH069 DONE. |
| 2026-09-08 | Page-copy consistency | Home/KB root share `Fishing reference and catch log`; Gear Guides uses `Equipment, rig, and presentation reference`; Catch Log uses `Recorded catches`; Techniques uses `Strategy, conditions, and species reference` without a period. Reuse category metadata on card/page and retain permanent regression coverage. PR60/FISH070 DONE. |
| 2026-09-08 | Perception Joyride | Accept the user's Gear add handoff exactly: stable Gear/media ID `perception-joyride-10-0`, internal category `accessories`, submitted type `Accessories`, name/manufacturer/model/specifications/link unchanged, no Notes. Register the already-uploaded source `pwa/assets/gear-source/perception-joyride-10.png` with explicit owner `perception-joyride-10-0`; do not infer additional relationships. PR58/FISH068 DONE. |
| 2026-09-08 | Rods & Reels hero caption | Change only `technique-rods-reels` picture caption to `Baitcasting reel`. Preserve src, alt, credit/sourceUrl, complete authored Markdown and image bytes. Advance KB dataVersion for the accepted seed change. PR58/FISH068 DONE. |
| 2026-09-08 | Mutable source media | A user-maintained image is not a frozen historical hash fixture. Validate actual format, size, stable identity, explicit owner and exact transformed bytes. Preserve accepted prior hashes in release history. PR57/FISH067. |
| 2026-09-08 | Dagger specifications | User confirmed Length `10' 6"`. Correct only that specification, preserve other facts and advance Gear dataVersion. PR56/FISH065 DONE. |
| 2026-09-08 | KB hero images | Apply explicit picture handoffs to Fishing Line, Walking Bait and Rods & Reels using source-aware promotion. Preserve complete authored Markdown and exact bytes. Fishing Line explicitly links to Sufix 832; no other Gear association is inferred. PR56/FISH066 DONE. |
| 2026-09-08 | Dagger addition | PR54 added separate Kayaks Gear record `dagger-axis-10-5`, no Notes and explicit image ownership. FISH064 DONE. |
| 2026-09-07 | Operating mode | Chat by default. Work only for a specific Work-only capability, with explanation and user approval. Complexity, duration, research, files and artifacts are not reasons to switch. |
| 2026-09-07 | End-to-end execution | An authorized change continues through implementation, validation, PR/CI, merge, production verification, cleanup and authoritative records. Progress is informational, not an approval gate. Stop only for a genuine blocker or complete scope. |
| 2026-08-29 | Source of truth | GitHub is durable. Current domain-owned runtime sources prevail over historical OneNote/PDF, migrated Topics, old chats or stale bootstrap text. Original migration/audit and PR28 content acceptance remain closed. |
| 2026-09-07 | Documentation continuity | Preserve exact historical records in Git history/History, keep concise current authority and one canonical TODO. Historical snapshots are not parallel current authority. |
| 2026-08-31 | Product scope | Single-user, personal, offline-capable. Public-but-non-advertised Pages acceptable. Accounts, sync, multi-user, Planner, sessions and trip history are out of scope. |
| 2026-09-02 | Domain architecture | Share stable identity, explicit ownership, strict validation, authored narrative and feature-driven relationships without forcing identical schemas/storage. `gear://`/`kb://` are navigation, not speculative relationship graphs. |
| 2026-09-04 | Narrative ownership | Gear/Catch structured records own facts/relationships; optional stable-ID Markdown owns narrative. No inline Notes, generated Catch Notes or Provenance/source fields. |
| 2026-09-08 | Gear schema4 | 66 records; JSON/IndexedDB facts. Manufacturer `{name}`, ordered Links `{label,url}` without classifications; optional ordinary product metadata. Preserve IDs and non-seed local records in upgrades. No retired profiles/usage/connections/knowledgeRefs or setup mainLine/leader. |
| 2026-09-07 | Gear taxonomy | Display Equipment, stable key `accessories`; Types Kayaks, Tools, Tackle Management, Electronics, Storage, Accessories. Do not silently recategorize an explicit accepted handoff. |
| 2026-09-07 | KB taxonomy | Flat types location/species/equipment/technique/knot. Equipment displays Gear Guides. Existing IDs/paths do not change on reclassification; historical prefixes are conventions only. |
| 2026-09-08 | KB model | Schema1/54 entities. One envelope: id, type, name, optional description/picture and complete Markdown Content. No nested subtype/atomic guidance schema. |
| 2026-09-07 | Catch model | Schema2/five catches. Exact known Species/Location, one Lure/Bait, optional known setup/presentation; no inference. Catch owns forward references, backlinks derived. |
| 2026-09-07 | Browser authoring | Gear/KB Add/Edit create validated copyable handoff packages for chat/repository promotion. No direct browser GitHub writes or competing local database. Existing IDs read-only, taxonomy chat-managed. |
| 2026-09-07 | KB editing | Complete Markdown/Preview; immutable existing IDs/paths; safe reclassification; source-aware pictures, stale-source checks and complete candidate validation. Deployed PR48/FISH060. |
| 2026-09-07 | Image ownership | Preserve source/provenance and exact owner IDs; source records and transformed display media distinct. Do not infer ownership from labels/filenames. Never delete original bytes as a side effect. |
| 2026-09-07 | Image transport | User uploads binaries directly to exact GitHub branch/path/filename. Assistant verifies and handles text/manifests/release; never transport binary/base64 through connector. |
| 2026-09-07 | Notes media | Gear-ID-prefixed sibling images with safe relative paths; validate actual format/extension, size, ownership, exact bytes and offline inclusion. Preserve legacy Notes paths. |
| 2026-09-07 | Picture replacement | Explicit Keep/Replace with actual source/media identity, same-filename replacement allowed, old provenance retained; no bulk migration or premature deletion. |
| 2026-09-04 | Final validation | Revalidate complete transformed data after every media/build stage, not source only. Permanent model, routing, authoring, media and final-bundle gates must remain. |
| 2026-09-08 | Release permissions | Use authorized connector writes for workflow changes; never bypass denied runner permissions. Retain permanent gates and remove disposable source-promotion workflows. |
| 2026-09-07 | Release process | Feature branch/PR, exact final-head/current-base CI, expected-head merge, actual production Pages verification. Respect denied permissions, no bypass/omission of tests, no one-time migration reruns. Avoid overlapping `fishing-pages` releases. |
| 2026-09-07 | Authored content tests | User-maintained Markdown is not a frozen full-text fixture. Validate stable ownership/paths, durable accepted facts and authored links; allow legitimate additions/formatting. Preserve exact user text. |
| 2026-09-07 | Search/layout | Root Gear/KB Search always, nonempty query hides categories; Browse Search at 10+; filters right aligned as applicable; Line flat, Rods grouped. |
| 2026-09-04 | Markdown/display | Preserve nested/loose lists and continuation paragraphs; stable-ID links independent of Related heading. Square white contain thumbnails, no cropping. |

## Unresolved decisions and history

PowerBait hook-size guidance (#4 versus #8) and loop-knot guidance remain unresolved. KB filename/destination usability is FISH063. Candidate products, unconfirmed purchases, kayak motor/LiveScope research and speculative relationships must not be represented as owned/current. Use `Fishing_TODO.md` for all open work. Detailed earlier decisions, release evidence, superseded rationale and exact historical SHAs remain in preserved history.

Before chat transfer, reconcile actual repository state and outstanding transactions, not remembered conversation. Keep deployed, approved pending and historical facts distinct. Do not call a task complete until requested release, cleanup and records are complete. New work starts from current main, not closed release branches or one-time migrations.
