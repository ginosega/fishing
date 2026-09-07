# Fishing Companion Data Model Reconciliation Design

**Status: ACCEPTED architecture / deployed Gear schema3 / approved schema4 refinement pending release.** Reconciled for chat transfer on 2026-09-06. The original cross-domain design was accepted 2026-09-02 and authored-Notes ownership was completed in PR39. Historical source revisions remain in Git history; this document describes current principles and the next approved schema transition.

## 1. Core decision

Architectural consistency means shared design principles, not identical schemas, identical persistence, or speculative relationship maintenance. Store a structured relationship only when the relationship itself is a durable fact required by current application behavior. Otherwise, use authored Markdown links where useful.

The three domains are My Gear (owned facts), Knowledge Base (reusable authored knowledge), and Catch Log (historical facts/relationships). Each has a clear owner, stable IDs, strict validation, and a deliberate narrative boundary. Do not force a generic entity table, universal relationship graph, or one storage format on every domain merely for consistency.

## 2. Source and release authority

GitHub is the durable project source. Runtime My Gear uses a validated seed and local IndexedDB; the browser's authoring forms do not create a second authoritative inventory. KB is indexed complete Markdown; Catch has structured facts plus external narrative. Legacy OneNote, migrated Topics, and old inventory tables are reference history, not parallel runtime sources.

The latest verified main checkpoint is `cdb1c500f08394a9c44ea2012b6de72adbd46ecc`, PR45, production workflow#235 reported successful. Main has64 Gear records at schema3/data version`2026-09-06-my-gear-v3-bonafide-rvr119-1`. The approved schema4 source is unmerged on`feature/gear-guides-ordered-links`, head`24ea22ac187f81b42c2d91743e0a470ba3d1ad94`. The temporary build/tests passed, but normal PR CI, merge and actual Pages deployment are outstanding. The exact release handoff is`../Fishing_Release_Handoff_2026-09-06.md`; FISH-TODO-058 remains IN PROGRESS. No future PR number or deployment should be asserted before it exists.

## 3. Shared invariants

- **Stable identity:** lowercase kebab-case IDs are immutable. Display-name, category-label, and file-path changes must not break existing references. Never infer identity by text similarity.
- **Explicit ownership:** each durable fact or relationship belongs to one domain. Media owners and source/provenance metadata are distinct from presentation.
- **Strict schemas:** validate required fields, allowed values, unknown fields, types, and safe paths. Represent absence as absence; do not invent manufacturer/model or historical relationships.
- **Narrative separation:** facts stay structured; authored explanations, instructions, observations and flexible lists live in Markdown. No redundant inline JSON Notes or generated narrative fallbacks.
- **Feature-driven relationships:** Catch owns exact historical references. My Gear and KB use authored stable-ID navigation where sufficient, rather than maintaining duplicate speculative graphs.
- **Safe rendering:** user text is escaped; links allow safe schemes/paths; Markdown content is not executed as HTML/script. Validate URLs and assets at appropriate boundaries.
- **Final-form validation:** all build transformations, particularly media substitutions, must be followed by validation of the fully deployable data and required assets.
- **Preservation:** migrations must retain IDs, user-authored content, existing facts, and unconfirmed-state distinctions. No bulk data rewrite or file move without an actual need.

## 4. My Gear model

### Persistence and authoritative data

`data/gear.seed.json` → strict schema in`gear-model.js` → IndexedDB through`gear-store.js` → structured UI in`gear-app.js`. Seed-managed stores refresh when schema/data version changes. Non-seed/imported data must not be silently discarded; schema migrations preserve its records. GitHub remains the durable source of truth for the user's normal workflow.

The browser Add/Edit routes create validated`fishing-companion-gear-change-v1` packages for chat/repository promotion. They do not call repository merge/replace to store a proposed change or write GitHub directly. This deliberately avoids split-brain data and a new authentication/backend layer. The form may select/reclassify among existing categories/types but cannot administer the taxonomy. Paired Rod/Reel setups retain a limited editor; new setups/component facts/media remain chat-managed.

### Structured schema and version transition

Main schema3 has64 records, required stable ID/category/type/name for ordinary products, optional Manufacturer/Model/Specifications/Links, and strict embedded rod/reel components for setups. Inline Notes are prohibited. Profiles, usage/connections, knowledgeRefs, setup mainLine/leader, raw HTML guidance, and generic extra structural fields are retired.

Approved schema4 keeps the same64 records and stable IDs. Data version`2026-09-06-my-gear-v4-ordered-links-1`. Manufacturer is `{name}`; Links are ordered `{label,url}` pairs. Existing manufacturer URLs migrate into the first link position, followed by existing links in original order. Link classifications are removed, not retained as hidden unused metadata. The form has no separate Manufacturer URL or Link Type control. Leaf links preserve stored order; an empty Links section is omitted. The schema3→4 upgrade must preserve non-seed local records and validate its output. Rod/Reel component links follow the same pattern.

### Category identity and taxonomy

The eighth category retains stable key`accessories` but is approved to display **Equipment**, with Types Kayaks, Tools, Tackle Management, Electronics, Storage, Accessories. The approved light-blue kayak/gray-paddle icon remains. The earlier Accessories/Miscellaneous wording is the deployed schema3 baseline and a superseded naming decision; it is not the desired post-release taxonomy. Changing only labels does not justify changing stable IDs or introducing a new category key.

### Authored Notes

Optional narrative lives exclusively in`gear-content/<gear-id>.md`. A missing file means no Notes card. A valid nonempty file is loaded deterministically by stable ID; no JSON fallback. The shared build validates IDs, ownership, safe references, and generates a manifest for offline loading. The author controls content, headings and link placement. `gear://` and`kb://` are navigation links, not durable relationship-table entries.

Approved sibling-image policy: support Gear-ID-prefixed local images next to Markdown in`gear-content/`, referenced by relative filename. Validate safe paths, owner prefix, JPEG/PNG/WebP/GIF actual format and extension, nonempty size≤10MiB, exact-byte copying, and offline manifest inclusion. Existing`assets/gear-notes/` references remain supported. Hero/thumbnail media stays separately owned. This is approved and implemented on the pending branch, not yet deployed.

## 5. Knowledge Base model

KB uses one unified envelope: id, type, name, optional description/picture, and one complete Markdown Content path. Type enum: location,species,equipment,technique,knot. Schema1 remains current, data version`2026-09-04-kb-v1-final-content-1`,54 entities. Equipment is a flat peer type for rigs/presentations/gear guides; Technique is for strategy/conditions/species-oriented methods. Physical directories do not define taxonomy; existing IDs may retain historical prefixes.

The approved pending UI label is **Gear Guides** for internal`equipment`, with subtitle`Equipment, rigs, and presentations reference`. No schema, type, or identity change is needed. All flexible instructional content remains in Markdown. The KB is browsable, not a Planner, session system, or atomic article editor. Its indexed model is already architecturally consistent with Gear because the shared rules, not identical storage, are the design goal.

## 6. Catch Log model

Catch schema2/data version`2026-09-04-catches-v2-external-notes-1` contains5 historical records. Catch owns stable ID/date/time/size, required Species and Location references, exactly one Lure/Bait relationship, optional known rod/reel setup and presentation/technique, and optional exact picture. No invented historical attribution, generic additional-gear graph, Session ID, trips, or no-catch-session model. Backlinks are computed from Catch-owned forward references.

Optional authored narrative is`catch-content/<catch-id>.md`. The old structured Exact Spot Notes, generated Notes, and source/Provenance fields were retired in PR39. One optional Notes card uses the shared renderer/build/offline pipeline. The original user-authored spot information was preserved verbatim. An exact catch image overrides Species fallback; fallbacks are presentation, not duplicated source facts.

## 7. Links and relationship rules

External sources use safe HTTP(S) URLs. Authored Gear/KB navigation uses stable`gear://`/`kb://` targets, resolved by the application. Registered relative KB links may resolve to stable routes; raw app hash routes and direct Markdown file paths are not durable authored navigation. Missing internal IDs fail validation; do not use fuzzy matching.

A structured relationship is justified only when a current feature needs it. Catch's Species/Location/Lure/Bait/setup/technique references, exact media ownership, and explicit owned-Gear picture reuse are examples. A prose cross-reference between a rig and a product is not automatically a domain relationship. Do not duplicate the KB taxonomy in Gear or make Gear a generalized knowledge editor.

## 8. Media and build architecture

`media-sources.json` owns source/provenance;`media-owners.json` owns exact Gear associations;`local-media.json` configures active local assets;`apply-local-media.mjs` validates/materializes them;`media-ui.js` presents them. KB may intentionally reference built Gear assets with exact identity. Do not infer owners from aliases, labels, or filenames.

User images are uploaded directly to the specified GitHub branch/path. Never transport image bytes/base64 through the ChatGPT/GitHub connector. Validate source bytes and extension; copy exact bytes without recompression; verify final output. The pending existing-picture workflow shows actual source/media ID, explicit Keep/Replace, and supports same-filename replacement. Preserve media ID/owner and old provenance when promoting valid local replacement. No bulk migration or premature deletion is required.

The permanent build must run the relevant model/routing/content/media tests, authored-Notes and local-media stages, and final transformed-bundle verification before deployment. The pending feature introduces`image-validation.mjs`,`gear-media-policy.test.mjs`, and`verify-final-bundle.mjs`; integrate them into the permanent Pages workflow with authorized workflow-file changes. Temporary migration workflow success does not satisfy final release verification.

## 9. User-facing consistency

Root Gear/KB Search always; nonempty search hides category cards and places matching results directly below controls. Browse Search at10+, filters right-aligned when appropriate; Line flat, Rods grouped. Card thumbnails use square white contain frames without cropping. Stored`Trolling lures` may display as Trolling without needless data migration. The renderer preserves nested/loose lists and continuation paragraphs; authors should not flatten valid Markdown to compensate for rendering. Stable-ID links may appear under any sensible heading, with target validity—not heading text—as the invariant.

## 10. Historical and completion boundary

The original schema2 reconciliation, schema3 external-Notes migration, PR28 content acceptance, PR30 transformed-data recovery, PR34/41 Markdown fixes, and PR42 authoring release remain completed historical work. Original detailed versions remain in Git history and the Decision History. This pending refinement does not reopen those architectural choices. The full current source/test/cleanup checklist is in`../Fishing_Release_Handoff_2026-09-06.md`. Complete FISH-TODO-058 only after clean final-head PR CI, expected-head merge, and actual Pages deployment; then reconcile all production-status documents.