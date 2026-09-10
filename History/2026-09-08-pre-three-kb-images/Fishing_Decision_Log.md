# Fishing Decision Log

**Status:** Current decision authority, reconciled September 8, 2026. Complete earlier decisions are preserved in `Fishing_Decision_History_Through_2026-09-06.md` and `History/`. Superseded or historical CURRENT labels do not override this index.

## Release authority

The latest maintenance release is PR54, merge `0c07816b33c282cbc31e162812ad15c45d3a4bbe`, normal CI #273 / `34187137697` and production #274 / `34187188334`, including actual Pages deployment. Dagger Axis 10.5 was added, all existing Gear retained and the concurrent fishing-line image upload preserved. Gear schema4 now has 65 records, dataVersion `2026-09-08-my-gear-v4-dagger-axis-1`. See `pwa/DAGGER_AXIS_RELEASE_2026-09-08.md`. FISH064 DONE; FISH065 awaits length confirmation. No application release is pending. Documentation closeout PR55 is administrative.

The latest application-feature release remains PR48, merge `6d04e29b6770000eaa50f6c449ad82bc88f7326d`, production #252 / `34142574286`. PR49 documentation closeout merge `024bec08a51c103e98c9913e786db2de40155b64` passed production #254 / `34159581055`. PR50 recovered CI and incorporated the audit branch, merge `fcf28f34b89f68c22e8a2200e8410509801ff801`, production #260 / `34184126036`. PR51 reconciled recovery. PR52 deployed Buzzbait/Jack Hammer images, merge `91ee0966eff5ef95d6a7d192a95b10940d0b534e`, production #267 / `34186006471`; PR53 closed those records, merge `edc1526663e2ded348b516049ffaa23ccbf594bf`, production #269 / `34186306578`. FISH058–062 remain DONE.

## Current decisions

| Date | Area | Decision / status |
|---|---|---|
| 2026-09-08 | Dagger addition | Add user-authorized Dagger Axis 10.5 as separate Kayaks Gear record, with exact supplied facts, stable ID `dagger-axis-10-5`, no Notes and explicit image owner. Preserve all existing records and advance the dataVersion. Deployed PR54/FISH064. |
| 2026-09-08 | Dagger specifications | Preserve supplied Length `12' 6"` without silently correcting the apparent model inconsistency. FISH065 awaits user confirmation; no alternative value has been accepted. |
| 2026-09-08 | Concurrent media | Preserve the user-uploaded `technique-fishing-line.jpg` from main during the Dagger merge. Do not infer an entry association, provenance or ownership from its filename. |
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
| 2026-09-07 | KB model | Schema1/54 entities. One envelope: id, type, name, optional description/picture and complete Markdown Content. No nested subtype/atomic guidance schema. |
| 2026-09-07 | Catch model | Schema2/five catches. Exact known Species/Location, one Lure/Bait, optional known setup/presentation; no inference. Catch owns forward references, backlinks derived. |
| 2026-09-07 | Browser authoring | Gear/KB Add/Edit create validated copyable handoff packages for chat/repository promotion. No direct browser GitHub writes or competing local database. Existing IDs read-only, taxonomy chat-managed; paired setup changes limited/chat-managed. |
| 2026-09-07 | KB editing | Complete Markdown/Preview; immutable existing IDs/paths; safe reclassification; source-aware pictures, stale-source checks and complete candidate validation. Deployed PR48/FISH060. |
| 2026-09-07 | Image ownership | Preserve source/provenance and exact owner IDs; source records and transformed display media distinct. Do not infer ownership from labels/filenames. Never delete original bytes as a side effect. |
| 2026-09-07 | Image transport | User uploads binaries directly to exact GitHub branch/path/filename. Assistant verifies and handles text/manifests/release; never transport binary/base64 through connector. |
| 2026-09-07 | Notes media | Gear-ID-prefixed sibling images with safe relative paths; validate actual format/extension, size, ownership, exact bytes and offline inclusion. Preserve legacy Notes paths. Deployed PR47. |
| 2026-09-07 | Picture replacement | Explicit Keep/Replace with actual source/media identity, same-filename replacement allowed, old provenance retained; no bulk migration or premature deletion. |
| 2026-09-04 | Final validation | Revalidate complete transformed data after every media/build stage, not source only. Permanent model, routing, authoring, media and final-bundle gates must remain. |
| 2026-09-08 | Release permissions | Use authorized connector writes for workflow changes; never bypass denied runner permissions. PR54 retained permanent gates and removed disposable source-promotion workflows without weakening the standard workflow. |
| 2026-09-07 | Release process | Feature branch/PR, exact final-head/current-base CI, expected-head merge, actual production Pages verification. Respect denied permissions, no bypass/omission of tests, no one-time migration reruns. Avoid overlapping `fishing-pages` releases. |
| 2026-09-07 | Authored content tests | User-maintained Markdown is not a frozen full-text fixture. Validate stable ownership/paths, durable accepted facts and authored links; allow legitimate additions/formatting. Preserve exact user text. PR50/FISH061. |
| 2026-09-06 | Gear/Cylinder release | PR47 deployed schema4 and registered valid Cylinder Weights image preserving ID/owner/provenance; user verified image live. FISH058/059 DONE. |
| 2026-09-07 | KB release | PR48 deployed Add/Edit; PR49 closed docs. FISH060 DONE. User acceptance feedback does not invalidate deployment. |
| 2026-09-07 | Search/layout | Root Gear/KB Search always, nonempty query hides categories; Browse Search at 10+; filters right aligned as applicable; Line flat, Rods grouped. |
| 2026-09-04 | Markdown/display | Preserve nested/loose lists and continuation paragraphs; stable-ID links independent of Related heading. Square white contain thumbnails, no cropping. Lure display labels Soft plastics and swimbaits, Topwater, Trolling; stored alias retained. |

## Unresolved decisions and history

PowerBait hook-size guidance (#4 versus #8) and loop-knot guidance remain unresolved. Preserve conflicting source guidance until deliberately researched/tested. The Dagger length awaits user confirmation under FISH065. KB filename/destination usability is FISH063. Candidate products, unconfirmed purchases, kayak motor/LiveScope research and speculative relationships must not be represented as owned/current. Use `Fishing_TODO.md` for all open work. Detailed earlier decisions, release evidence, superseded rationale and exact historical SHAs remain in preserved decision history and History snapshots.

Before chat transfer, reconcile actual repository state and outstanding transactions, not remembered conversation. Keep deployed, approved pending and historical facts distinct. Do not call a task complete until requested release, cleanup and records are complete. New work starts from current main, not closed release branches or one-time migrations.
