# Fishing Companion v2 — Approved Requirements and Architecture Baseline

**Status:** Original approved body preserved. User-authorized v2 production is published and verified; seven absent pictures are explicitly deferred. Current evidence: [production release](Fishing_v2_Production_Release_2026-09-10.md). Dated phase/status statements in the body below are historical.
**Reconciled:** September 8, 2026, Pacific time.
**User decision commit:** `0bd773366130a302b0e80d5cd085a71731ff9e63`.

## 1. Authority and approval

The exact user-authored responses in [Requirements Inventory](Fishing_Companion_v2_Requirements_Inventory.md) and all fourteen **[Gino Sega]:** decisions in [Design Review](Fishing_Companion_v2_Design_Review.md) are preserved unchanged and are the authoritative evidence of approval. This document consolidates those decisions and supplies the implementation contract. If a summary conflicts with an original response, the original response prevails. Historical v1 architectural decisions continue to govern the live application until explicitly replaced; they do not override approved v2 requirements.

All A1–A3, B1–B4, C1–C3, D1–D2 and E1–E2 decisions are resolved. There are no outstanding product-design questions in that checklist. P2 authorization, a future direct-save security design and any unexpected migration exception remain separate decisions, not implicit scope. The user has not authorized an application build merely by approving the requirements.

## 2. Product and priorities

Fishing Companion is a personal, single-user application for owned Gear, reusable fishing knowledge and individual catches. No Planner, trips, sessions, accounts, social features, generic relationship graph, shopping engine, transaction ledger or speculative future platform. GitHub is the durable source of truth. Public GitHub Pages remains acceptable. Chat mode is the default for project work; Work is suggested only for a specific Work-only capability with prior approval.

P1 includes complete reading of all three domains, Gear and KB Add/Edit handoffs, full-library offline reading of text and images, the approved navigation/search/layout behavior, reliable builds and a verified v2 cutover. Catch browser Add/Edit, direct Save, integrated uploads, offline authoring/synchronization and selected filters are P2. A date-range Catch filter, routine UI deletion, taxonomy administration and other optional features are P3. Do not implement P2 infrastructure merely to make P1 theoretically extensible.

Supported targets: Windows Edge/Chrome, iPhone Safari/Chrome, and Android Edge/Chrome. Preserve the current visual language, cards, detail pages and viewer. Use ordinary accessible controls, responsive layouts and safe rendering without adding unwanted customization features.

## 3. Domain contracts

### My Gear

Retain the eight categories: Rods & Reels, Line, Weights, Snaps & Swivels, Hooks, Lures, Bait and Equipment. Preserve existing internal category keys where practical; labels and type names can evolve through chat. No website taxonomy administration. Retain the current Equipment types, including Kayaks, Tools, Tackle Management, Electronics, Storage and Accessories.

The paired setup model is retired. Every rod and reel is an ordinary Gear item with its own picture, Notes, facts and links. Rods & Reels has exactly six approved types: Baitcasting rod, Spinning rod, Spincasting rod, Baitcasting reel, Spinning reel and Spincasting reel. No structured setup, installed-accessory, line assignment or other maintained relationship. Changing associations belong in authored Notes and links.

The common authored facts are ID, Category, Type, Name, optional Manufacturer and Model, ordered flexible Specifications (label/value), ordered Links (label/URL), optional representative Picture and optional Markdown Notes. Preserve separate Name/Manufacturer/Model form fields and expandable specification/link rows. Manufacturer is plain text, not an entity. Specifications need no typed units, calculation or inventory quantities. Existing entry order controls link display order. Notes are absent from the detail page when empty but can be added through Edit. Ordinary display names may change without changing IDs or filenames. IDs remain visible in Edit and can be used in URLs.

### Knowledge Base

Retain the flat types Location, Species, Gear Guides, Technique and Knot (existing stable internal keys may remain). The shared entry envelope has ID, Type, Name, optional Description (maximum 80 characters), optional Picture and complete Markdown Content. No required article template, atomic guidance model, structured location/species fields or automatic research ingestion. Category labels/membership may be changed through chat; reclassification does not require file moves.

Gear Guides explain equipment, physical rigs, lure configurations and their presentation; Techniques emphasize methods, strategy, conditions and application. Ambiguous topics are classified by their primary purpose and may be cross-linked in Markdown. No additional kind, tag or relationship layer is needed to resolve the overlap.

### Catch Log

A Catch is an individual historical fish record, not a session. The approved P1 data is ID, required local Date, optional local Time, optional plain-text Size, optional Species ID, optional Location ID, optional owned Lure/Bait ID and optional Markdown Notes. No setup, technique, line, trailer, condition, structured size object, name-snapshot requirement or independent representative picture. Missing Species is valid. Unknown or non-owned tackle may be described in Notes without creating a false ownership reference.

A Catch displays the selected Species picture when available; otherwise it displays no picture. Exactly one optional owned Lure/Bait reference is supported. Derive My Catch History only on Gear Lure/Bait pages and KB Location/Species pages. No reverse relationship tables or other automatic related-item sections. Preserve exact historical facts; convert existing measurements to text with original values/units, never invented precision. Catch browser authoring and Species/Location/Lure-Bait filters are P2; date range is P3. Catches sort newest first.

### Identity, links and narrative

Preserve all unaffected existing IDs. New IDs are generated automatically and are independent of display names, taxonomy and filenames. New IDs are assigned to split rod/reel records; the old setup mapping is retained in the one-time migration report, not permanent runtime compatibility. Retain `gear://<id>` and `kb://<id>` authored links and add Copy Link. Ordinary safe relative links remain supported. External hyperlinks open in the same tab; no automatic YouTube title/preview enrichment.

Markdown is authoritative for Gear Notes, KB Content and Catch Notes. One document per entity, with human-readable user-editable filenames. No duplicate inline narrative database, mandatory template, autosave, persistent drafts or revision UI. The current simple textarea and Preview are sufficient. Render normal Markdown safely, without executing arbitrary embedded HTML/scripts. User-authored content must not be frozen into full-text regression fixtures.

## 4. Media and filesystem contract

Gear/KB have one optional representative picture stored directly in their entity record. The authored picture contains a local path and optional user-authored caption. Display alt text is derived from caption or item name; there is no Alt Text form field. No media ID, owner graph, source URL, provenance, credit, product-page destination, web acquisition, or generated caption. The current viewer retains enlarge/close, zoom, pan, pinch and caption behavior, without product/source links.

Catch images are derived from Species, not stored as Catch pictures. Markdown images are supported in all three narrative domains. One representative image plus any number of Markdown images replaces a gallery model. Explicit path reuse is allowed across items. There is one authoritative source image; generated derivatives are optional disposable build artifacts only if measured performance justifies them. No automatic crop, resize, compression or format conversion in P1.

### Source folders

Use the approved category-level pattern, with no Type-level folders:

```
Gear/
  gear.json
  Rods-Reels/
    assets/
    content/
  Line/
    assets/
    content/
  Lures/
    assets/
    content/
  ...other categories...
KB/
  kb.json
  Locations/
    assets/
    content/
  Species/
    assets/
    content/
  Gear-Guides/
    assets/
    content/
  Techniques/
    assets/
    content/
  Knots/
    assets/
    content/
Catches/
  catches.json
  content/
```

The stable directory key is independent of the current display label. Additional current Gear categories follow the same pattern. A category rename/reclassification does not automatically move existing files; new files use the destination category. Explicit file moves are separate operations. A file's containing folder does not determine its entity identity or ownership. Avoid redundant source/display image directories in the authored repository. The generated application bundle is separate and disposable.

Allow human-readable safe filenames with spaces, capitals, Unicode letters, digits and ordinary safe punctuation. Preserve the chosen name and do not require ID prefixes or silently slugify. Reject empty/dot names, directory separators, control characters, reserved platform names, unsafe traversal, invalid extensions and canonical/case-insensitive collisions. Use correct URL/Markdown encoding. Use a 180-character maximum and a conservative UTF-8 byte/path limit. Exact implementation checks must be tested on supported platforms. A display-name edit never automatically renames the document or image.

### Approved image policy

Accept JPEG/JPG, PNG, WebP and GIF. Maximum 10 MiB per file; maximum width and height 6,000 pixels, with a 36-megapixel ceiling. Reject oversized/invalid files with actionable errors rather than silently transforming them. HEIC/HEIF, SVG user content and AVIF are outside P1. Trusted application icons are separate. Remote images are not allowed, including in Markdown; ordinary external hyperlinks remain allowed. Existing accepted files must be inventoried before enforcing the new policy; any exception or replacement is explicit, never silent deletion.

Keep/Replace/Remove are the relevant picture operations. Replaced, unreferenced files need not remain in the active tree, but Git history preserves prior bytes. Validate actual file format, extension, size/dimensions, safe path, existence, references and overwrite collisions. A shared file must not be deleted merely because one item stops using it. No persistent ownership graph is required for these checks. Direct file upload from a form is P2; an exact GitHub upload path and filename is acceptable in P1.

## 5. P1 authoring and persistence architecture

The approved staged plan is P1 handoff, optional P2a direct GitHub Save, then optional P2b offline outbox. P1 is a static, repository-backed application with a deterministic generated read-only data bundle and no editable IndexedDB authority, synchronization queue, backend or embedded credential. Keep three distinct domain contracts with shared identity, picture, Markdown and validation utilities; do not force a generic entity framework.

Gear/KB editors retain the familiar fields and Preview. Prepare/Copy Changes produces a minimal, version-aware change package: operation, stable ID, changed structured fields, complete Markdown only when it changed, explicit picture action/path, and base revision sufficient for safe promotion. Do not send redundant complete databases, source/display copies or media provenance snapshots. ChatGPT reads current GitHub state and promotes the authorized change. Preparing a handoff is not a save. No persistent drafts/autosave are required; warn before discarding unsaved work.

The accepted conflict rule is last-writer-wins for the same logical record/document, not unrelated records. Structured fields can merge independently where safe; ordered specifications/links are treated as complete logical fields when changed. Markdown changes replace the whole document. A stale handoff never blindly replaces a whole domain bundle. Deletion, identity and incompatible-schema conflicts fail visibly. A future queue must retain failures, support idempotent retries and make Pending/Synced/Failed status explicit. No generic merge editor is required.

P2 direct Save requires an explicitly approved secure GitHub authorization design and possibly a small service. Never embed a permanent token in public code, presume browser access to the assistant's connector credentials, or introduce a public account system merely for reading. Offline editing/sync remains a separately approved P2 feature with its own architecture and cost review. No P2 infrastructure is implemented in advance.

### Offline reading

The entire library's data, Markdown and local images is the P1 offline target. Use a versioned, complete asset manifest and verified cache installation. Do not activate an incomplete release or mix old app code with new incompatible data. Preserve a complete last-known-good version until the new version is ready. Expose clear Ready/Downloading/Incomplete status and a simple explicit update mechanism. App/content updates are separate from form Save/Prepare. Do not reload over unsaved work. Storage quota and eviction are browser limitations; test real target browsers and report honestly rather than promising permanent offline availability. A diagnostic may show build ID, asset count/size and failures without exposing versions in normal browsing.

## 6. Build, tests and release architecture

Use a small, maintainable JavaScript/ESM application and a single deterministic source-validation/build path; select and pin necessary dependencies after the source audit. Do not retain a custom parser, framework, database or abstraction solely because v1 has it. Prefer a tested Markdown parser/sanitizer where it reduces maintenance risk. Use an explicit router and shared direct-rendered components instead of post-render media patching, duplicated route ownership or MutationObserver-based integration. Reuse current visual CSS and viewer behavior where practical.

Validate schemas, exact structured references, source paths, actual image formats/dimensions, source-to-output bytes, all required assets, safe Markdown and final generated data. Keep meaningful behavioral/integrity tests; replace historical filename/hash/content locks with current-source contracts and one-time migration fixtures. The build does not fetch product images or YouTube metadata from the web. Ordinary article/image changes should not require unrelated test edits or manual dataVersion bumps. Schema versions are structural; content/build revisions derive from source revision.

One normal CI/build/deploy workflow with meaningful branch validation, reproducible outputs, browser smoke tests and actual published-asset verification. Documentation-only changes do not trigger production builds. Approved content changes may deploy automatically after validation. Direct-main user uploads remain supported; no staging-upload branch is required. Avoid overlapping releases and preserve direct edits. Failures remain visible and actionable, not hidden by removing meaningful gates. The assistant owns the release-quality decision and must not claim a browser smoke test passed when only Pages deployment was verified.

No separate staging URL is required for ordinary releases. The one-time v2 cutover uses an isolated preview URL, then replaces the existing production URL only after verification. Keep v1 available for recovery until cutover. Exact Pages packaging/preview configuration is an engineering implementation detail to validate against the existing workflow; do not create a new hosting/account system without need.

## 7. Migration and preservation contract

Begin from the actual latest main, not the historical baseline in this document. Inventory every source record, authored document, local image, remote-only image, generated/media mapping, link and relevant browser-only record. Record counts, IDs, source paths, hashes, sizes, selected active pictures and references. Preserve a recoverable v1 commit and exact migration input. The previous schema4/66, KB1/54 and Catch2/5 counts are historical starting evidence, not immutable migration expectations.

Split each of the three existing setup records into a rod and reel. Add the sixth type, Spincasting rod. For each new item copy the current component's Manufacturer, Model, Specifications and Links exactly. Copy the complete original setup Notes into two identical Markdown files, one for the rod and one for the reel. The user will correct the resulting records through Edit. Do not replace recorded combo facts with guesses or silently invent an unidentified rod model. Assign new component IDs; preserve unaffected IDs. Record old-to-new mappings only in the migration report. Reconcile setup media and all authored references to the old IDs explicitly; do not silently choose an unrelated target.

Convert existing Catch measurements to text preserving original values/units, remove retired structured relationships only after preserving any unique facts in Notes or the migration archive, and preserve all five historical records and complete authored Notes. Do not infer missing species, location, ownership, lure, setup or other attribution. Preserve all current KB content and original source image bytes. Select the currently displayed picture where the source mapping is unambiguous; document ambiguities and resolve them explicitly. Existing remote-only images require user-supplied local replacements before the no-remote-image P1 cutover. No automatic web-image acquisition.

Before retiring IndexedDB, perform a one-time read-only export/difference check on relevant browsers/devices. The user knows of no local-only records, but that is not proof that none exist. Preserve any differences before disabling the old store. No permanent import/export feature is required. Do not erase existing browser storage merely to simplify migration.

Produce a machine-checkable reconciliation report: source/destination counts and IDs, field transformations, exact Markdown/image hashes or documented approved edits, old-to-new setup mappings, all surviving references, media exceptions and offline manifest completeness. Explain expected count changes, do not treat them as data loss. The user does not need to manually approve every record, but all discrepancies must be resolved or explicitly accepted. No silent deletion or guessed facts.

## 8. Implementation sequence and exit gates

| Phase | Work | Exit gate |
|---|---|---|
| 0 | Requirements reconciliation | All fourteen decisions accepted; completed by this baseline. |
| 1 | Read-only source/dependency/data and CI audit | Actual source inventory, media/remote gap list, migration mapping, browser-only check plan and failure taxonomy; no unexplained authoritative sources. |
| 2 | Final engineering contracts and small vertical slice | Testable schemas, folder/path rules, authoring protocol, offline design and necessary dependency choice; one representative Gear, KB and Catch path works without old media/persistence machinery. |
| 3 | Complete migration | All current records/content/images mapped, split setup data preserved, integrity report and exact-source checks pass. |
| 4 | Full P1 UI and offline acceptance | All approved browsing/editing handoff behavior, viewer, links, required search/filter rules and complete offline library pass representative supported-browser tests. |
| 5 | One-time preview and production cutover | Preview accepted, latest-main reconciliation, actual production deployment and critical smoke checks pass; rollback reference retained; obsolete v1 active code removed after success. |
| 6 | Optional P2 review | Direct Save, upload integration, Catch authoring/filters and offline outbox considered separately; no automatic scope expansion. |

## 9. Evidence, limits and next action

The earlier Design Review contains the source-grounded preliminary Keep/Simplify/Replace/Remove assessment. Current code confirms the paired setup special schema/editor, IndexedDB seed/import paths, multiple media registries/overlays, remote image and YouTube fetching, post-render image enhancement and multi-stage build. Those are concrete candidates for removal or replacement, not a completed dependency-by-dependency audit. The current workflow also includes dated acceptance tests and fixed historical content/media checks that require reconciliation with approved v2 requirements.

The latest previously inspected application run #312 succeeded; #311 failed following the deletion of a Bonafide image source still expected by a content test. This is one confirmed coupling, not a diagnosis of every notification or ChatGPT response failure. Do not claim a complete failure taxonomy, full image dimension/byte inventory, browser-only data check or deployed-browser acceptance until those steps have actually been performed.

The next task is the read-only phase-1 audit and the implementation-ready technical contracts. Application implementation and migration require an explicit go-ahead. The baseline is complete enough to begin that work without another general requirements questionnaire. Any genuine unexpected source-data conflict should be recorded with a concrete recommendation instead of silently inventing a resolution. The original inventory and review remain available for further collaborative edits.
