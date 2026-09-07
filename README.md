# Fishing Project

This repository is the durable working home for the Fishing project: fishing and kayak knowledge, owned gear/tackle data, local-water notes, catch observations, and the **Fishing Companion** PWA.

## Operating mode

**Use Chat mode by default. Do not recommend Work merely because the project or task is complex, lengthy, file-heavy, analytical, involves research or calculations, or creates artifacts. Recommend a temporary switch only when a specific Work-only capability is required, explain the need, and obtain the user's approval first.**

## Project status and immediate handoff

**Production healthy / normal content maintenance / Gear authoring refinement IN PROGRESS and NOT deployed.**

The latest verified main at the 2026-09-06 reconciliation checkpoint is `cdb1c500f08394a9c44ea2012b6de72adbd46ecc`, merged PR #45 (Bonafide RVR119), with production workflow #235 reported successful. PR44 fixed the module-cache/navigation regression and the user confirmed My Gear opens correctly.

The approved taxonomy, ordered-links, sibling Notes-image, and legacy-picture replacement feature is preserved on `feature/gear-guides-ordered-links`, head `24ea22ac187f81b42c2d91743e0a470ba3d1ad94`. Temporary migration/build validation passed, but normal final PR CI, merge, and production deployment remain outstanding. Do not invent a PR number or treat this feature as live. See **[Fishing Release Handoff](Fishing_Release_Handoff_2026-09-06.md)** for exact source/checkpoint details, test evidence, temporary cleanup, and release steps. The current bootstrap is **[Fishing_New_Chat_Bootstrap_Prompt.md](Fishing_New_Chat_Bootstrap_Prompt.md)**. FISH-TODO-058 is open until actual deployment verification.

The OneNote migration and MHT hyperlink restoration were completed on 2026-08-29. OneNote was designated the most up-to-date historical migration source. Exhaustive historical-chat reconciliation and dedicated temporary migration audit files were closed/retired by user decision. The PR28 content acceptance is closed. Historical chats, OneNote/PDF and migrated Markdown remain supplemental reference sources, not parallel active runtime databases.

## Authoritative project files

- **[Fishing_Context.md](Fishing_Context.md)** — current state, user equipment, application architecture, production/pending boundaries, and source routing.
- **[Fishing_Decision_Log.md](Fishing_Decision_Log.md)** — current accepted decisions, superseded naming choices, and unresolved design conflicts. Complete earlier history is preserved in `Fishing_Decision_History_Through_2026-09-06.md`.
- **[Fishing_TODO.md](Fishing_TODO.md)** — canonical active backlog and completed work; pending release and Cylinder picture follow-up are separate items.
- **[Fishing_New_Chat_Bootstrap_Prompt.md](Fishing_New_Chat_Bootstrap_Prompt.md)** — copyable instructions for restoring exact state in a new Chat-mode conversation.
- **[Fishing_Release_Handoff_2026-09-06.md](Fishing_Release_Handoff_2026-09-06.md)** — precise unmerged-feature source and release continuation record.
- **[pwa/README.md](pwa/README.md)** — runtime architecture, schemas, authoring, media, routes, build and release procedures.
- **[pwa/DATA_MODEL_RECONCILIATION_DESIGN.md](pwa/DATA_MODEL_RECONCILIATION_DESIGN.md)** — shared architectural principles and domain boundaries.
- **[pwa/KB_DATA_MODEL_DESIGN.md](pwa/KB_DATA_MODEL_DESIGN.md)** — unified KB/Catch model and current display-taxonomy distinction.

## Fishing Companion

Live site: https://ginosega.github.io/fishing/

The application is a single-user, offline-capable personal PWA with three durable domains. My Gear stores structured owned facts in JSON/IndexedDB with optional stable-ID Markdown Notes. Knowledge Base uses a unified structured index over complete authored Markdown documents. Catch Log stores exact historical facts/relationships with optional stable-ID Markdown Notes. The domains share identity, ownership, validation, and authored-link principles, but deliberately do not use identical schemas or persistence.

The deployed main seed has Gear schema3/data version `2026-09-06-my-gear-v3-bonafide-rvr119-1`, 64 records; KB schema1 with 54 entities; Catch schema2 with 5 catches. The pending feature uses Gear schema4/data version `2026-09-06-my-gear-v4-ordered-links-1` and preserves all 64 records and stable IDs.

The pending user-facing My Gear category is **Equipment** (stable key `accessories`), with Types Kayaks, Tools, Tackle Management, Electronics, Storage, Accessories. The KB internal `equipment` type is displayed as **Gear Guides** with the exact subtitle `Equipment, rigs, and presentations reference`. Existing category/type administration remains chat-managed, not a feature of item forms.

Browser Add/Edit authoring is already deployed from PR42. It validates and produces `fishing-companion-gear-change-v1` handoff packages for chat/repository promotion; it does not write directly to GitHub or maintain a competing local Gear database. The pending refinement simplifies Links to ordered text/URL pairs, supports sibling images in Notes, and makes existing-picture replacement explicit. See the release handoff for all details and pending status.

## Domain knowledge and historical references

The current main kayak is Bonafide RVR119, paddle-only. The exact owned Gear records are authoritative; current equipment details and unresolved installed-state questions are in `Fishing_Context.md` and the relevant Topics. Do not promote research/candidate items to owned without confirmation.

The following migrated records remain reference material and retain their historical value:

- [Fishing_Gear_Registry.md](Fishing_Gear_Registry.md)
- [Fishing_Tackle_Inventory.md](Fishing_Tackle_Inventory.md)
- [Bonafide RVR119 Kayak](Topics/Bonafide_RVR119_Kayak.md)
- [Fish Finder Electronics & Wiring](Topics/Fish_Finder_Electronics_Wiring.md)
- [Kayak Rigging, Accessories & Storage](Topics/Kayak_Rigging_Accessories_Storage.md)
- [Rods, Reels, Line & Knots](Topics/Rods_Reels_Line_Knots.md)
- [Fishing Techniques](Topics/Fishing_Techniques.md)
- [Local Waters & Locations](Topics/Local_Waters_Locations.md)
- [Safety, Regulations & Fish Handling](Topics/Safety_Regulations_Fish_Handling.md)
- [Maintenance, Repairs & Procedures](Topics/Maintenance_Repairs_Procedures.md)
- [Researched / Candidate Gear](Topics/Researched_Candidate_Gear.md)
- [Trip Logs & Field Observations (historical)](Topics/Trip_Logs_Field_Observations.md)

These documents do not feed the PWA inventory/KB/Catch runtime directly. Avoid reintroducing legacy Markdown fact parsers, duplicate schemas, Planner/session models, or fuzzy identity matching.

## Repository and release workflow

Before assistant repository modifications, fetch latest `main` and inspect relevant branch files. The user may deliberately edit Markdown on main, and those changes must be preserved. For meaningful PWA work, use a feature/fix branch and PR, verify exact final head against current base, merge with an expected head SHA, and verify the production build and actual **Deploy to GitHub Pages**. A successful temporary migration workflow or source-only build is not a production release.

The shared Pages workflow uses `fishing-pages` concurrency with `cancel-in-progress: true`; avoid overlapping direct-main content commits with PR validation/deployment. Any build stage mutating structured data must validate final deployable transformed data. GitHub workflow-file permissions must be respected; do not bypass a failed permission check or silently omit required permanent CI changes.

User-supplied image binaries are uploaded directly by the user to the exact branch/path/filename specified by the assistant. Do not send or reconstruct user image bytes/base64 through the ChatGPT/GitHub connector. The assistant verifies assets and handles text manifests, data, tests and releases. Ordinary stable-ID Markdown edits may be made directly in GitHub; this still triggers the automated Pages rebuild/deployment.

## Historical release context

PR39 unified external Gear/Catch Notes; PR41 fixed loose ordered-list rendering; PR42 deployed Gear Add/Edit authoring; PR44 fixed module-cache navigation and was user-confirmed; PR45 added the Bonafide RVR119. The former 63-record/night-end audit checkpoints and older latest-release references are historical. Exact earlier release evidence remains in the archived Decision History and Git history. New work should continue the current TODO and preserved pending branch, not reopen completed migrations or reconstruct an already-recovered hidden build.

For the next chat, copy the current bootstrap after this handoff reconciliation is merged into main. The bootstrap directs the assistant to re-fetch current state, preserve the unmerged feature, and finish its normal release rather than starting over.