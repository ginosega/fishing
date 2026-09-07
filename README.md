# Fishing Project

The durable home for the Fishing project: owned gear, fishing and kayak knowledge, local waters, catch observations, and the Fishing Companion PWA.

## Operating mode

Use Chat mode by default. Do not recommend Work merely because a task is complex, lengthy, file-heavy, analytical, involves research or calculations, or creates artifacts. Recommend a temporary switch only for a specific Work-only capability, explain the need, and obtain approval first.

## Current state

Production is healthy. The latest verified runtime release is PR #48, merge `6d04e29b6770000eaa50f6c449ad82bc88f7326d`, production workflow #252 (`34142574286`), September 7, 2026. All build, test, final-bundle and GitHub Pages deployment steps succeeded. Gear schema4, the user-verified Cylinder Weights image, and KB Add/Edit are live. FISH-TODO-058, 059 and 060 are complete.

KB Add/Edit is deployed through PR48 / FISH-TODO-060, including complete Markdown editing/Preview, stable-ID and document-path preservation, source-aware picture changes, validated handoffs, and repository promotion. No schema migration or competing local KB database was introduced. The release records and open backlog are reconciled; there is no pending application release. User acceptance of the new KB editor remains a normal follow-up, not a failed deployment.

Live site: https://ginosega.github.io/fishing/

## Authoritative records

- [Fishing_Context.md](Fishing_Context.md) — current state, architecture and owned equipment.
- [Fishing_TODO.md](Fishing_TODO.md) — canonical backlog and completed items.
- [Fishing_Decision_Log.md](Fishing_Decision_Log.md) — accepted decisions and unresolved conflicts.
- [Fishing_New_Chat_Bootstrap_Prompt.md](Fishing_New_Chat_Bootstrap_Prompt.md) — restore procedure for new chats.
- [pwa/README.md](pwa/README.md) — runtime, authoring, media, build and release procedures.
- [pwa/DATA_MODEL_RECONCILIATION_DESIGN.md](pwa/DATA_MODEL_RECONCILIATION_DESIGN.md) — shared architectural principles.
- [pwa/KB_DATA_MODEL_DESIGN.md](pwa/KB_DATA_MODEL_DESIGN.md) — unified KB/Catch model.
- [Fishing_Release_Handoff_2026-09-06.md](Fishing_Release_Handoff_2026-09-06.md) — historical recovery and PR47 release evidence.
- [Fishing_Decision_History_Through_2026-09-06.md](Fishing_Decision_History_Through_2026-09-06.md) — archived decision history.

## Fishing Companion

The single-user, offline-capable PWA has three durable domains: My Gear, Knowledge Base, and Catch Log. They share stable identity, explicit fact ownership, strict validation, exact feature-driven relationships, and authored-narrative separation, without forcing identical schemas or persistence. Gear uses structured JSON/IndexedDB plus optional stable-ID Markdown Notes. KB uses a structured index over complete authored Markdown documents. Catch stores exact historical facts and relationships plus optional Markdown Notes.

The current seed contains 64 Gear items (schema4), 54 KB entities (schema1), and five catches (schema2). My Gear displays Equipment while retaining key `accessories`; KB displays Gear Guides while retaining type `equipment`. Stable IDs and authored `gear://` / `kb://` links do not change with labels or taxonomy.

Browser Gear Add/Edit prepares validated `fishing-companion-gear-change-v1` handoffs for chat/repository promotion. It does not write GitHub or maintain a competing local database. KB Add/Edit follows the same model while preserving its complete Markdown document and source/derived picture boundary. The existing Gear functionality must remain intact.

## Historical references

The OneNote migration and MHT hyperlink restoration were completed August 29, 2026. The historical reconciliation and PR28 content acceptance were closed by user decision. OneNote/PDF, migrated Topics, Gear Registry, Tackle Inventory and old chats are reference evidence, not parallel runtime databases. Preserve authored facts and do not infer unconfirmed purchases or historical catch relationships.

Relevant references include [Fishing Gear Registry](Fishing_Gear_Registry.md), [Tackle Inventory](Fishing_Tackle_Inventory.md), [Bonafide RVR119](Topics/Bonafide_RVR119_Kayak.md), [Fish Finder Electronics & Wiring](Topics/Fish_Finder_Electronics_Wiring.md), [Kayak Rigging & Storage](Topics/Kayak_Rigging_Accessories_Storage.md), [Rods & Reels](Topics/Rods_Reels_Line_Knots.md), [Fishing Techniques](Topics/Fishing_Techniques.md), [Local Waters](Topics/Local_Waters_Locations.md), [Safety & Regulations](Topics/Safety_Regulations_Fish_Handling.md), [Maintenance](Topics/Maintenance_Repairs_Procedures.md), [Researched Gear](Topics/Researched_Candidate_Gear.md), and [Historical Field Observations](Topics/Trip_Logs_Field_Observations.md).

## Release discipline

Fetch current main and relevant branches before changes; preserve all user-authored files and direct-main edits. Meaningful runtime work uses a feature branch, normal PR, exact final-head/current-base CI, expected-head merge, and verified production Pages deployment. Every build transformation must validate the final deployable data. Respect workflow permissions; do not silently omit required checks. Do not rerun one-time migration scripts against current schemas.

User image binaries are uploaded directly by the user to an exact GitHub branch/path/filename. The assistant handles text, manifests, verification, testing and release; never transport user image bytes through the connector. Existing images and provenance must be preserved until valid replacement is registered. The shared Pages concurrency group is `fishing-pages` with `cancel-in-progress: true`; avoid overlapping releases and direct-main content writes.
