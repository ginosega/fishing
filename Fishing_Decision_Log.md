# Fishing Decision Log

**Status:** Active decision history, reconciled 2026-09-06 for an interrupted, unmerged release. The full pre-reconciliation historical log is preserved verbatim in `Fishing_Decision_History_Through_2026-09-06.md`. This file is the current decision index; the release handoff contains implementation evidence and exact checkpoints.

## Current decision authority

The last verified production baseline is PR #45, main `cdb1c500f08394a9c44ea2012b6de72adbd46ecc`. The approved Gear refinement is preserved on `feature/gear-guides-ordered-links` at `24ea22ac187f81b42c2d91743e0a470ba3d1ad94` but has not been merged or deployed. FISH-TODO-058 remains IN PROGRESS. No PR number has yet been assigned to this feature. See `Fishing_Release_Handoff_2026-09-06.md`.

## Decisions

| Date | Area | Decision | Rationale / status |
|---|---|---|---|
| 2026-09-06 | Operating mode | Use Chat by default. Work only for a specific Work-only capability, with explanation and user approval. | CURRENT; complexity, long work, research, files, and artifacts are not reasons to switch. |
| 2026-08-29 | Source of truth | GitHub is the durable project home. OneNote was accepted as the most up-to-date historical migration source; migrated documents and old chats remain reference evidence. | CURRENT; original migration and exhaustive audit are closed. |
| 2026-08-29 | New-chat handoff | Reconcile context, decisions, TODO, affected records, and bootstrap before transferring a long active project. Restore live repository state at the start of the next chat. | CURRENT; do not depend on chat memory or stale bootstrap text. |
| 2026-08-31 | Product scope | Keep Fishing Companion single-user and personal; public-but-non-advertised GitHub Pages is acceptable. | CURRENT; accounts, sync, and multi-user product deferred. |
| 2026-09-01 | My Gear storage | Use strict structured JSON/IndexedDB for owned facts and stable IDs, not Markdown inventory parsing. | CURRENT; local-first storage with one authoritative repository source. |
| 2026-09-04 | Narrative ownership | Gear and Catch structured records contain facts/relationships; optional authored narratives live in stable-ID Markdown. No duplicate inline Notes, generated Catch Notes, or Provenance fields. | CURRENT; PR38/39. Gear schema3 introduced this boundary; schema4 retains it. |
| 2026-09-02 | Cross-domain architecture | Share identity, ownership, validation, and feature-driven relationship principles without forcing identical schemas/storage. Use authored `gear://`/`kb://` links for navigation, not speculative relationship graphs. | CURRENT; Catch owns exact historical relationships. |
| 2026-09-02 | KB model | One unified envelope: id, type, name, optional description/picture, complete Markdown Content. Flat peer types location, species, equipment, technique, knot. | CURRENT; no nested type hierarchy or atomic guidance schema. |
| 2026-09-03 | KB taxonomy | Equipment contains rigs/presentations/gear guides; Technique contains strategy/conditions/species methods. Stable IDs may retain historical prefixes. | CURRENT; underlying equipment type unchanged by the new card label. |
| 2026-09-02 | Catch scope | Catch Log has exact known Species/Location, one Lure/Bait, optional known setup/technique, computed backlinks; no inference, Planner, sessions, or trip history. | CURRENT. |
| 2026-09-06 | Gear authoring | Browser Add/Edit validates and prepares `fishing-companion-gear-change-v1` packages for chat/repository promotion; do not write directly to GitHub or a divergent local database. | CURRENT / DEPLOYED via PR42; PR44 cache fix user-confirmed. |
| 2026-09-06 | Gear taxonomy administration | Item forms may select/reclassify among canonical Categories/Types, but cannot create, rename, or remove taxonomy. | CURRENT; taxonomy changes remain chat/repository work. |
| 2026-09-06 | Original Accessories naming | The initial eighth category was Accessories, with Miscellaneous among its Types. | SUPERSEDED as a naming decision by the user's later Equipment/Accessories request; retain historical record. It remains the deployed baseline until the pending release. |
| 2026-09-06 | Approved Gear taxonomy | Display My Gear **Equipment** with stable key `accessories`; Types Kayaks, Tools, Tackle Management, Electronics, Storage, Accessories. Keep the approved light-blue kayak/gray-paddle icon. | APPROVED / IMPLEMENTED ON UNMERGED BRANCH; not yet production. |
| 2026-09-06 | KB card naming | Display internal `equipment` type as **Gear Guides**, subtitle `Equipment, rigs, and presentations reference`. | APPROVED / PENDING RELEASE; no internal type or stable-ID change. |
| 2026-09-06 | Gear schema4 links | Manufacturer has only name. Links are ordered `{label,url}` pairs, without classifications or a separate manufacturer URL. Migrate former manufacturer URLs first, preserve subsequent order, omit empty Links sections. | APPROVED / PENDING RELEASE; preserve all 64 records and stable IDs. |
| 2026-09-06 | Optional product metadata | Manufacturer, Model, Specifications, and Links are optional for ordinary products; Name, Category, Type, and ID required. Rod/Reel components retain strict paired schema. | CURRENT; no invented blank product facts. |
| 2026-09-06 | Notes images | Allow Gear-ID-prefixed sibling images in `pwa/gear-content/`, referenced relatively. Validate actual format/extension, size, path/ownership, exact bytes, and offline inclusion; preserve legacy Notes paths. | APPROVED / IMPLEMENTED ON UNMERGED BRANCH; main hero media remains separate. |
| 2026-09-06 | Legacy picture replacement | Show actual source/media identity, explicit Keep/Replace, and support same-filename replacement. Promote valid user-uploaded local images while retaining existing media ID/owner; no bulk migration or premature deletion. | APPROVED / PENDING RELEASE; Cylinder Weights replacement binary not yet supplied. |
| 2026-09-03 | Image transport | User uploads image binaries directly to the specified GitHub branch/path. Assistant handles verification and text/config/release work; never base64-transport image bytes through ChatGPT/GitHub. | CURRENT / STANDING PROCESS. |
| 2026-09-04 | Post-transform validation | Revalidate the final deployable structured data after any build transformation, especially media path substitution. | CURRENT; fixes the PR30 startup-failure class. |
| 2026-09-01 | Release process | Use normal branch/PR, exact-final-head CI against current base, expected-head merge, and actual production Pages deployment verification. | CURRENT; temporary migration workflow success is not a release. |
| 2026-09-06 | Pending-release checkpoint | Preserve `feature/gear-guides-ordered-links` at `24ea22ac187f81b42c2d91743e0a470ba3d1ad94`; finish temporary-artifact cleanup, permanent CI integration, normal PR and deployment. | IN PROGRESS / FISH-TODO-058. The workflow permission failure was recovered without modifying main. |
| 2026-09-06 | Bonafide inventory | PR45 added the owned RVR119, exact specs/Notes/local image, bringing Gear to 64 records. | CURRENT / DEPLOYED. Preserve authored data, including original Notes heading; no unrequested serial-number redaction. |
| 2026-09-06 | Cylinder image | Keep existing `thkfish-cylinder-weights` media until a valid replacement is supplied and registered. | WAITING ON USER / FISH-TODO-059. |
| 2026-09-04 | Search/layout | Root Gear/KB Search always; nonempty query hides categories. Browse Search at10+; filter right-aligned where applicable; Line flat, Rods grouped. | CURRENT. |
| 2026-09-04 | Lure names | Display Soft plastics and swimbaits, Topwater, and Trolling; retain stored `Trolling lures` alias for a copy-only change. | CURRENT. |
| 2026-09-04 | Thumbnails | Square white frames with `object-fit: contain`; no image cropping or source rewrites required. | CURRENT. |
| 2026-09-04/05 | Markdown | Preserve nested/loose list semantics and continuation paragraphs; validate stable-ID links independent of heading labels. | CURRENT; PR34/41. |
| 2026-09-04 | Content acceptance | PR28 content batch was accepted and closed through PR32; later direct Markdown edits are ordinary maintenance. | CLOSED; do not reopen old migration cleanup by default. |
| 2026-09-06 | Release separation | Publish an accurate docs-only handoff without merging unvalidated runtime work. | CURRENT; preserve unmerged source and incorporate handoff into feature before final release. |

## Historical and unresolved decisions

The historical decision log is preserved in `Fishing_Decision_History_Through_2026-09-06.md`, including original research, release evidence, superseded rationale, exact older SHAs, and candidate gear. Earlier CURRENT labels in that archival document are historical snapshots, not overrides of the current decisions above. For exact source facts, use current runtime data and the relevant domain owner rather than a historical summary.

PowerBait hook-size guidance remains unresolved (#4 in some historical rigs versus #8 in prior recommendations). Loop-knot guidance also remains unresolved. Preserve both conflicts until deliberately researched/tested and decided. Candidate products, unconfirmed purchases, and researched kayak motor/LiveScope configurations must not be represented as owned. Bonafide under-seat storage, YakAttack cooler, clothing candidates, remaining rigs, and other outstanding work remain in `Fishing_TODO.md`.

## Handoff discipline

Before new-chat transfer, reconcile the actual repository and outstanding transactions/actions, not merely the remembered conversation. Keep production, approved pending design, and historical state distinct. Preserve all current user-authored files. A feature is completed only after required tests, merge, and actual deployment evidence exist. The exact pending release record is `Fishing_Release_Handoff_2026-09-06.md`; the bootstrap and TODO point to the same branch and status.
