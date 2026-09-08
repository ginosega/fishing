# Fishing Decision Log

**Status:** Current decision authority, reconciled September 8, 2026. Complete earlier decisions are preserved in `Fishing_Decision_History_Through_2026-09-06.md` and `History/`. Superseded historical CURRENT labels do not override this index.

## Release authority

The latest content release is PR56, head `d17d7b0c52955c06ef55659d6062e8b6f4a44759`, normal CI #284 / `34188600391`, merge `531f04a84c0d75e2a7f23dc368149de5026b607b`, production #285 / `34188668110`, including actual Pages deployment. Gear schema4/65 uses `2026-09-08-my-gear-v4-dagger-length-1`; KB schema1/54 uses `2026-09-08-kb-v1-three-hero-images-1`; Catch schema2/5 is unchanged. FISH065/066 DONE, FISH063 OPEN. See `pwa/RELEASE_2026-09-08_KAYAK_KB_IMAGES.md`. No application release is pending. Previous PR47–55 releases remain historical; PR48 introduced KB Add/Edit and PR54 added Dagger. Exact prior decision records are archived.

## Current decisions

| Date | Area | Decision / status |
|---|---|---|
| 2026-09-08 | Mutable source media | A user-maintained image is not a frozen historical hash fixture. Validate actual format, size, stable identity, explicit owner and exact transformed bytes. Preserve accepted prior hashes in release history. PR57/FISH067. |
| 2026-09-08 | Dagger specifications | User confirmed Length `10' 6"`. Correct only that specification, preserve other facts and advance Gear dataVersion. PR56/FISH065 DONE. |
| 2026-09-08 | KB hero images | Apply explicit picture handoffs to Fishing Line, Walking Bait and Rods & Reels using source-aware promotion. Preserve complete authored Markdown and exact bytes. Fishing Line explicitly links to Sufix 832; no other Gear association is inferred. PR56/FISH066 DONE. |
| 2026-09-08 | Concurrent media | Preserve latest direct-main Dagger PNG replacement, blob `cfb44c09b6ab3d79a53d50e626664dde5e148a3a`, with existing ID/owner/path. Prior blob remains in Git history; external origin is not inferred. |
| 2026-09-08 | Dagger addition | PR54 added the separate Kayaks Gear record `dagger-axis-10-5`, preserving exact original submitted fields, no Notes and explicit image ownership. Original length was superseded by the confirmed correction. FISH064 DONE. |
| 2026-09-07 | Operating mode | Chat by default. Work only for a specific Work-only capability, with explanation and user approval. Complexity, duration, research, files and artifacts are not reasons to switch. |
| 2026-09-07 | End-to-end execution | An authorized change continues through implementation, validation, PR/CI, merge, production verification, cleanup and authoritative records. Progress is informational, not an approval gate. Stop only for a genuine blocker or complete scope. |
| 2026-08-29 | Source of truth | GitHub is durable. Current domain-owned runtime sources prevail over historical OneNote/PDF, migrated Topics, old chats or stale bootstrap text. Original migration/audit and PR28 content acceptance remain closed. |
| 2026-09-07 | Documentation continuity | Preserve exact historical records in Git history/History, keep concise current authority and one canonical TODO. Historical snapshots are not parallel current authority. |
| 2026-08-31 | Product scope | Single-user, personal, offline-capable. Public-but-non-advertised Pages acceptable. Accounts, sync, multi-user, Planner, sessions and trip history are out of scope. |
| 2026-09-02 | Domain architecture | Share stable identity, explicit ownership, strict validation, authored narrative and feature-driven relationships without forcing identical schemas/storage. `gear://`/`kb://` are navigation, not speculative relationship graphs. |
| 2026-09-04 | Narrative ownership | Gear/Catch structured records own facts/relationships; optional stable-ID Markdown owns narrative. No inline Notes, generated Catch Notes or Provenance/source fields. |
| 2026-09-08 | Gear schema4 | 65 records; JSON/IndexedDB facts. Manufacturer `{name}`, ordered Links `{label,url}` without classifications; optional ordinary product metadata. Preserve IDs and non-seed local records in upgrades. No retired profiles/usage/connections/knowledgeRefs or setup mainLine/leader. |
| 2026-09-07 | Gear taxonomy | Display Equipment, stable key `accessories`; Types Kayaks, Tools, Tackle Management, Electronics, Storage, Accessories. Former Accessories/Miscellaneous naming superseded. |
| 2026-09-07 | KB taxonomy | Flat types location/species/equipment/technique/knot. Equipment displays Gear Guides and subtitle `Equipment, rigs, and presentations reference`. Existing IDs/paths do not change on reclassification; historical prefixes are conventions only. |
| 2026-09-08 | KB model | Schema1/54 entities. One envelope: id, type, name, optional description/picture and complete Markdown Content. No nested subtype/atomic guidance schema. |
| 2026-09-07 | Catch model | Schema2/five catches. Exact known Species/Location, one Lure/Bait, optional known setup/presentation; no inference. Catch owns forward references, backlinks derived. |
| 2026-09-07 | Browser authoring | Gear/KB Add/Edit create validated copyable handoff packages for chat/repository promotion. No direct browser GitHub writes or competing local database. Existing IDs read-only, taxonomy chat-managed; paired setup changes limited/chat-managed. |
| 2026-09-07 | KB editing | Complete Markdown/Preview; immutable existing IDs/paths; safe reclassification; source-aware pictures, stale-source checks and complete candidate validation. Deployed PR48/FISH060. |
| 2026-09-07 | Image ownership | Preserve source/provenance and exact owner IDs; source records and transformed display media distinct. Do not infer ownership from labels/filenames. Never delete original bytes as a side effect. |
| 2026-09-07 | Image transport | User uploads binaries directly to exact GitHub branch/path/filename. Assistant verifies and handles text/manifests/release; never transport binary/base64 through connector. |
| 2026-09-07 | Notes media | Gear-ID-prefixed sibling images with safe relative paths; validate actual format/extension, size, ownership, exact bytes and offline inclusion. Preserve legacy Notes paths. Deployed PR47. |
| 2026-09-07 | Picture replacement | Explicit Keep/Replace with actual source/media identity, same-filename replacement allowed, old provenance retained; no bulk migration or premature deletion. |
| 2026-09-04 | Final validation | Revalidate complete transformed data after every media/build stage, not source only. Permanent model, routing, authoring, media and final-bundle gates must remain. |
| 2026-09-08 | Release permissions | Use authorized connector writes for workflow changes; never bypass denied runner permissions. Retain permanent gates and remove disposable source-promotion workflows. |
| 2026-09-07 | Release process | Feature branch/PR, exact final-head/current-base CI, expected-head merge, actual production Pages verification. Respect denied permissions, no bypass/omission of tests, no one-time migration reruns. Avoid overlapping `fishing-pages` releases. |
| 2026-09-07 | Authored content tests | User-maintained Markdown is not a frozen full-text fixture. Validate stable ownership/paths, durable accepted facts and authored links; allow legitimate additions/formatting. Preserve exact user text. PR50/FISH061. |
| 2026-09-06 | Gear/Cylinder release | PR47 deployed schema4 and registered valid Cylinder Weights image preserving ID/owner/provenance; user verified image live. FISH058/059 DONE. |
| 2026-09-07 | KB release | PR48 deployed Add/Edit; PR49 closed docs. FISH060 DONE. User acceptance feedback does not invalidate deployment. |
| 2026-09-07 | Search/layout | Root Gear/KB Search always, nonempty query hides categories; Browse Search at 10+; filters right aligned as applicable; Line flat, Rods grouped. |
| 2026-09-04 | Markdown/display | Preserve nested/loose lists and continuation paragraphs; stable-ID links independent of Related heading. Square white contain thumbnails, no cropping. Lure display labels Soft plastics and swimbaits, Topwater, Trolling; stored alias retained. |

## Unresolved decisions and history

PowerBait hook-size guidance (#4 versus #8) and loop-knot guidance remain unresolved. Preserve conflicting source guidance until deliberately researched/tested. KB filename/destination usability is FISH063. Candidate products, unconfirmed purchases, kayak motor/LiveScope research and speculative relationships must not be represented as owned/current. Use `Fishing_TODO.md` for all open work. Detailed earlier decisions, release evidence, superseded rationale and exact historical SHAs remain in preserved decision history and History snapshots.

Before chat transfer, reconcile actual repository state and outstanding transactions, not remembered conversation. Keep deployed, approved pending and historical facts distinct. Do not call a task complete until requested release, cleanup and records are complete. New work starts from current main, not closed release branches or one-time migrations.