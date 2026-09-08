# Fishing Companion v2 — Requirements Inventory

**Status:** Draft for review; not an approved implementation specification.
**Date:** September 8, 2026
**Repository baseline:** `ginosega/fishing` at `4f2fe70f47da9cca3704722de87f7282bcc00f83`.

## How to use this inventory

Accepted directions reflect the user's explicit requirements. Proposed defaults are recommendations, not decisions. P0 protects data and release integrity; P1 is essential for the first useful v2; P2 is useful but optional at launch; P3 is deferred. Every question has a stable ID. You can answer all at once, say “accept your defaults except...”, or mark individual rows Keep, Simplify, Remove, or Defer. No implementation or repository change is authorized by this draft.

## Current baseline and key insights

The current application has Gear schema4/66, KB schema1/54, and Catch schema2/5. Gear uses IndexedDB and external Markdown Notes; KB uses a flat type index and authored Markdown; Catch owns exact historical references. Gear images are separately registered and looked up by owner, whereas KB has a picture field. Current media registries include media-sources, media-owners, media-overrides, and local-media. The application also contains source-aware handoffs and a multi-stage build pipeline.

These facts suggest several worthwhile redesign targets, not proof that every existing feature is defective. The data model should reflect the three distinct domains while sharing a small set of conventions: stable identity, optional representative pictures, authored narrative, safe links, and explicit feature-driven references. A generic entity graph, schema framework, or backend is not assumed. The authoring and persistence requirements must be settled before choosing technology.

The latest inspected production run #312 succeeded. Run #311 failed after deletion of `pwa/assets/gear-source/bonafide-rvr119.png`, because `final-content.test.mjs` still attempted to stat that path. This is one confirmed source/test coupling, not a comprehensive diagnosis of every failure email or chat problem.

## 1. Scope

**Insight:** Define the product before the architecture. A personal reference/inventory application should not inherit features of a general fishing platform.

| ID | Topic | Proposed default / requirement | Question for you | Response |
|---|---|---|---|---|
| S1 | Purpose | Personal inventory, reusable knowledge, and individual catch records; no general fishing platform. | Does this describe the complete purpose? | Yes |
| S2 | Release scope | All three domains in v2 unless explicitly deferred. | Must all three be complete at launch? | Yes |
| S3 | Devices | Responsive desktop and phone PWA. | Which devices and browsers must be supported? | Windows PC (Edge & Chrome), iPhone (Safari & Chrome), Android phone (Edge & Chrome) |
| S4 | Offline | Keep offline reading; decide editing separately. | What must work without internet? | Viewing previously-entered data including text and images is a P1, adding and editing items is a P2 |
| S5 | Exclusions | No Planner, sessions, accounts, social features, or speculative graphs. | Confirm these exclusions and identify any others. | Confirmed |
| S6 | Future features | No implementation for hypothetical requirements. | Which near-term features must influence architecture now? | We may consider how to add and edit records while offline, but not necessary to implement now, and this is an area where we should be very careful not to over-engineer or introduce unnecessary complexity and potential fragility for a P2 feature |
| S7 | Success | Prioritize data integrity, core workflows, and reliable releases. | What are your top three success criteria? | Agree with these |

## 2. My Gear

**Insight:** Model owned facts, not a generic product catalog. Special Rod/Reel structures should be justified by actual workflows, not preserved merely because they exist.

| ID | Topic | Proposed default / requirement | Question for you | Response |
|---|---|---|---|---|
| G1 | Inventory scope | Owned items only; no candidate-product catalog. | How should sold, lost, or retired items be handled? | These can be deleted - not necessary to expose Delete functionality on the site though - that would be a very rare need so I consider that a P3. Simply asking you in chat to do that would be fine. |
| G2 | Categories | Review the eight existing categories rather than preserve them automatically. | Which categories should be added, combined, renamed, or removed? | I think we keep the ones that we have now. Note that I do not feel we need a mechanism to create a new category via the website - that is a P3. |
| G3 | Equipment types | Retain only meaningful subtypes. | Which of Kayaks, Tools, Tackle Management, Electronics, Storage, and Accessories do you need? | What we have now accurately represents all of the types of gear that I have today, and I don't have any immediate need to add new gear that would necessitate a new type. It is somewhat likely that I may in the future, however, but I do not feel we need a mechanism to create a new type via the website - that is a P3, as long as you are able to do that when I give you that request in chat. |
| G4 | Type vocabulary | Controlled lists only where useful. | Should types be fixed, editable, or free text? | It is possible that I may want to change the name of a type in the future. I do not need that capability supported on the website, but you should be able to implement that if I ask via chat. |
| G5 | Identity | Preserve stable IDs and hide technical naming from normal editing. | Should IDs be completely hidden from the ordinary UI? | I don't need to see them on the page, but I don't mind if they are in the URL, and I like to see them on the Edit Item page. One thing to consider is how we will support authoring a link (for example, in a markdown file or Note) to a KB or Gear entry. That should be easy to do; if it requires me to get the ID from the target page's Edit view, that would be fine. |
| G6 | Product facts | Small common schema with optional manufacturer, model, specifications, links, and picture. | Which additional facts—part number, quantity, cost, purchase date, warranty, serial number—are genuinely required? | I like the schema that we have today for Gear items: Name, Manufacturer, and Model are called out separately on the entry form (and optional, although I will endeavor to fill these out for every Gear entry), and other fields are available as an expandable set of label/value pairs in the Specifications. We should preserve this model. |
| G7 | Manufacturers | Simple text rather than separate manufacturer entities. | Do you need a manufacturer database? | No. Simple text please. |
| G8 | Specifications | Ordered label/value facts unless typed fields enable a real feature. | Do any specifications need structured units, sorting, or calculations? | No. |
| G9 | Links | Ordered, user-authored label/URL pairs. | Is any link classification or special behavior needed? | I need to be able to control the order in which they are displayed on the page. I don't think we need to over-think this though - if you just show them in the order that they are entered, that is fine. |
| G10 | Quantities and variants | No SKU, lot, or transaction model without a use case. | How should quantities, colors, sizes, and variants be recorded? | I can either do that by entering label/value pairs in the Specifications section (e.g., "Colors / Green pumpkin, Chartreuse", or I can just add that info in the Notes markdown. |
| G11 | Rods and Reels | Preserve the three actual setups but redesign the model. | Should rods/reels be independent records linked into setups, or embedded components? Do you swap them? | This is an area where we should simplify by eliminating the requirement to maintain the linkage, and track rods and reels separately. The Category should still be "Rods & Reels" and within that there should be the following types: Baitcasting rod, Spinning rod, Baitcasting reel, Spinning reel, Spincasting reel. I can clarify the relationships in the Notes field, e.g., "This reel is currently mounted on the Diawa Tatula XT spinning rod", with "Diawa Tatula XT" linked to that item. |
| G12 | Component detail | Reuse common product fields and rendering. | Do individual rods/reels need pictures, links, specifications, and Notes, or only complete setups? | Per above, let's split these up into separate Gear items and have pictures, links, specs, and notes for each. |
| G13 | Line on setups | Do not reintroduce retired mainline/leader fields automatically. | Do you want structured line/leader assignments or are Notes sufficient? | Notes are sufficient. |
| G14 | Relationships | Only feature-driven relationships. | Do you need installed accessories, storage locations, trailer pairings, or other structured associations? | No - notes are sufficient, and preferred actually, since some of these relationships are subject to change. |
| G15 | History | No inventory transaction ledger by default. | Do you need purchase, retirement, maintenance, or usage history? | No. |
| G16 | Notes | Optional authoritative Markdown separate from facts. | Should Notes disappear when empty? Any other content fields needed? | Notes should disappear when empty but be available for me to add via the Edit Item view. |

## 3. Knowledge Base

**Insight:** The flat, Markdown-oriented KB is close to the desired design. Avoid reintroducing atomic guidance schemas or inferred relationship graphs.

| ID | Topic | Proposed default / requirement | Question for you | Response |
|---|---|---|---|---|
| K1 | Purpose | Reusable reference independent of ownership. | Confirm this remains a reference library, not a planning system. | Confirmed. |
| K2 | Types | Location, Species, Gear Guides, Techniques, Knots. | Are these the final types? | Yes, although the names may change, and I may move items from one to another. I am still not satisfied with where we landed on presentations, for example - are those Gear Guides or Techniques? You can make a valid argument for either. |
| K3 | Guide distinction | Equipment/rig/presentation reference versus methods/strategy/conditions. | Is this distinction useful and clear? | Yes - for me at least. This is how I think of these. |
| K4 | Entry schema | ID, type, name, optional description/picture, Markdown content. | What additional fields, if any, are essential? | No authored fields, but keep in mind there should be relationships between  Location and Species KB items and the catch log. |
| K5 | Description | Short authored summary. | Keep, change, or remove the 80-character limit? | Keep. |
| K6 | Article model | One complete Markdown article; no atomic guidance schema. | Do you want unrestricted headings and content without required templates? | Yes - no template needed. |
| K7 | Taxonomy | Flat categories; simple reclassification. | Do you need to administer categories/subcategories in the UI? | No, although I may ask you via chat to do that - see my comment above about Types. |
| K8 | References | Authored links and exact Catch backlinks; no inferred graph. | Do you want automatic Related Items sections? | Only for catches, and only to Locations and Species. Other links I can enter myself in the markdown. |
| K9 | External resources | Ordinary links and images; no automated research ingestion. | Should any web research/import functionality be in the application? | No. |
| K10 | Locations | Keep access, maps, regulations, and advice in Markdown by default. | Do you need structured coordinates, map pins, launch records, or region filters? | No. I will enter this if I want it in the markdown. |
| K11 | Species | Article plus stable identity for Catch references. | Are any species-specific structured fields needed? | No. |
| K12 | Lifecycle | Git history and controlled deletion. | Do you need drafts, publish states, or an in-app revision history? | No. |

## 4. Catch Log

**Insight:** A catch is a historical event. Preserve known facts and unknowns; do not force a new catch to reference owned tackle unless that is genuinely required.

| ID | Topic | Proposed default / requirement | Question for you | Response |
|---|---|---|---|---|
| C1 | Purpose | Individual fish, not trips or no-catch sessions. | Confirm this scope. |  |
| C2 | Editing | Straightforward Add/Edit if Catch is included at launch. | Should catches be authored in the browser or through ChatGPT/repository changes? |  |
| C3 | Date/time | Date required, time optional, no unnecessary timezone transformations. | Do you need exact timestamps or just local date/time? |  |
| C4 | Species/location | Exact KB references when known; preserve unknown historical facts. | Must new catches select existing KB entries? Can a missing entry be created during capture? |  |
| C5 | Size | Preserve original measurements and units without false precision. | Which length/weight fields and metric support do you need? |  |
| C6 | Lure/bait | Reconsider mandatory owned-Gear reference. | Should free text be allowed? Can there be no lure/bait or more than one? |  |
| C7 | Equipment references | Optional exact known setup and technique references. | Which additional gear, line, leader, or trailer references are useful? |  |
| C8 | Conditions | Keep spot/depth/structure/conditions in Markdown unless filters require fields. | Which conditions, if any, should be structured for reporting? |  |
| C9 | Pictures | Shared picture structure. | One picture or multiple? Species fallback, generic placeholder, or none? |  |
| C10 | Browse | Chronological list with useful filters. | Which filters and sorts do you need? |  |
| C11 | Backlinks | Derive only real references. | Which Gear/KB pages should display Catch history? |  |
| C12 | Analytics | Defer dashboards and statistics. | Any statistics, maps, or CSV export needed at launch? |  |
| C13 | History | Preserve all five existing records and Notes exactly. | Confirm no unknown historical facts should be filled by inference. |  |

## 5. Images and media

**Insight:** Eliminate source/provenance/owner metadata from the application. The containing item establishes its representative picture; Git history still protects old files.

| ID | Topic | Proposed default / requirement | Question for you |
|---|---|---|---|
| M1 | Picture authority | Accepted direction: one optional picture object on each Gear/KB item, no separate authoritative registry. | Should Catch use exactly the same structure? |
| M2 | Metadata | Accepted direction: local path, alt text, optional authored caption; no source, provenance, owner, or product destination. | Should alt text be required or default to the item name and remain editable? |
| M3 | Acquisition | Accepted direction: user-supplied images only; no web sourcing. | Confirm no automatic image retrieval is needed. |
| M4 | Filenames | Accepted direction: independent of ID; validate safety, not naming convention. | Permit spaces, capitals, and Unicode, or prefer a safe ASCII subset? |
| M5 | Folders | Clear upload destination with no hidden naming rules. | One shared image folder or separate Gear/KB/Catch/content folders? |
| M6 | Upload UX | Prefer file selection/upload integrated with chosen authoring architecture. | Must the form upload the file, or is a separate GitHub upload acceptable? |
| M7 | Replacement | Keep/Replace/Remove, no accidental overwrite or premature deletion. | Keep replaced files only in Git history or also in active assets? |
| M8 | Sharing | Ordinary explicit path reuse; no ownership graph. | May two items reference the same image file? |
| M9 | Derivatives | One authoritative picture; generate thumbnails only if performance requires. | Separate optimized thumbnails/full-size images now, or only when demonstrated necessary? |
| M10 | Viewer | Basic enlarge/close; remove source and product-page UI. | Keep zoom, pan, pinch, and caption display? |
| M11 | Markdown images | Keep local images in articles/Notes. | Should Catch Notes support them? Do you need representative-image galleries? |
| M12 | Formats | Validate actual format, extension, existence, safe path, size, and collision. | Which formats and size limit should be supported? |
| M13 | Transforms | No automatic cropping or changes without approval. | Should uploads be resized/compressed automatically? |
| M14 | Remote images | Local representative images by default. | Disallow remote images entirely, or only for representative pictures? |

## 6. Markdown and content

**Insight:** One authoritative document and predictable safe rendering are more valuable than a general-purpose content management system.

| ID | Topic | Proposed default / requirement | Question for you |
|---|---|---|---|
| T1 | Narrative authority | Markdown for KB, Gear Notes, and Catch Notes. | Confirm the same narrative format for all three. |
| T2 | Filenames | One document per entity with stable reference. | Stable-ID, human-readable, or arbitrary Markdown filenames? |
| T3 | Editor | Simple Markdown editor and preview. | Which toolbar, split view, autosave, or full-screen features matter? |
| T4 | Internal links | Durable ID-based navigation. | Keep gear:// and kb:// or use standard relative Markdown links? |
| T5 | External links | Ordinary authored links. | New tabs? Automatic YouTube titles/previews or plain links? |
| T6 | Markdown features | Common Markdown with safe rendering. | Any required HTML, footnotes, task lists, diagrams, or special syntax? |
| T7 | Templates | No required article structure. | Optional templates or table of contents needed? |
| T8 | Deletion | Protect referenced content and report broken links. | Should deletion be blocked while referenced or allow explicit override? |
| T9 | History | Git history rather than an in-app revision system. | Is ordinary editor undo plus Git sufficient? |

## 7. Browsing and UI

**Insight:** Preserve useful behavior, not post-render patches, duplicate route handlers, or historical implementation mechanisms.

| ID | Topic | Proposed default / requirement | Question for you |
|---|---|---|---|
| U1 | Home | Three domain entry points; no unused navigation. | Are these the only home cards? |
| U2 | Gear layouts | Preserve useful layouts, not their old implementation. | Which pages should remain exactly as they are, and which should change? |
| U3 | KB layouts | Five flat category cards and familiar article pages. | Any KB navigation/layout changes? |
| U4 | Search | Simple domain search, with global search only if useful. | One site-wide search, separate searches, or both? Which content must be indexed? |
| U5 | Filters | Context-specific, not a blanket site-wide rule. | Keep the ten-item threshold? Which pages need filters and which should not have them? |
| U6 | Grouping | Explicit meaningful grouping and predictable sorting. | Which pages should be grouped? User-controlled sort order? |
| U7 | Cards | Consistent square contain images without cropping. | Do you need compact/dense list modes? |
| U8 | Details | Shared header, facts, picture, narrative, links, relevant catch history. | Which sections/order matter on each domain's detail page? |
| U9 | Navigation | Stable deep links, back behavior, clear missing-item handling. | Should search/filter state survive navigation and refresh? |
| U10 | Accessibility | Responsive, keyboard accessible, readable, no horizontal overflow. | Any specific accessibility or font-size requirements? |
| U11 | Appearance | Reuse approved visual language unless redesign has a clear benefit. | Should v2 look essentially like v1 or receive a visual redesign? |

## 8. Authoring and source of truth

**Insight:** The save workflow is a pivotal decision. A minimal handoff, direct authorized repository save, and local-first sync have very different complexity costs.

| ID | Topic | Proposed default / requirement | Question for you |
|---|---|---|---|
| A1 | Authority | GitHub remains durable authority unless explicitly changed. | Confirm GitHub owns all Gear, KB, Catch, Markdown, and images. |
| A2 | Editing coverage | Consistent Add/Edit across domains with domain-specific fields. | Should every domain support browser Add/Edit/Delete? |
| A3 | Save workflow | Choose a clear repository handoff, authorized direct write, or local-first sync model. | Prefer A: copy to ChatGPT, B: Save updates GitHub, or C: save locally and sync later? |
| A4 | ChatGPT role | Assistance and complex edits, not necessarily mandatory promotion. | Should ordinary edits be possible without ChatGPT? |
| A5 | Handoff | If retained, minimal change plus base revision, not full redundant datasets. | What should a handoff contain? Whole article or changed portion? |
| A6 | Image authoring | Align upload with the selected save workflow. | Direct file upload from form or separate GitHub upload plus path entry? |
| A7 | Identity/taxonomy | Automatic stable IDs and safe reclassification. | Should all renaming/reclassification be UI-managed? |
| A8 | Taxonomy administration | Avoid generic admin framework. | Do you need to create/edit types and categories yourself? |
| A9 | Drafts | Simple unsaved-change protection. | Persistent drafts/autosave or leave-page warning sufficient? |
| A10 | Conflicts | Never silently overwrite newer edits. | Reload, diff, or merge editor for stale changes? |
| A11 | Bulk data | No generic merge/replace/import system without actual need. | Do you need ongoing CSV/JSON import/export or just backup? |
| A12 | Errors | Clear actionable validation/save messages. | What current Add/Edit frustrations must v2 explicitly fix? |

## 9. Persistence, offline, hosting

**Insight:** Offline reading does not imply offline editing. Avoid maintaining two competing authoritative datasets by accident.

| ID | Topic | Proposed default / requirement | Question for you |
|---|---|---|---|
| P1 | Runtime source | Read-only generated bundle if local editable storage is unnecessary. | Must the browser maintain editable inventory data? |
| P2 | IndexedDB | Remove or simplify if not serving an approved feature. | Do you use local import/merge/replace or have browser-only records? |
| P3 | Offline editing | Defer unless explicitly needed. | Must you create/edit records while disconnected? |
| P4 | Offline library | Cache required content/images predictably. | Entire library offline or selected/downloaded subsets? |
| P5 | Updates | Clear update state and no loss of unsaved work. | Automatic update, update control, or manual refresh? |
| P6 | Versions | Separate structural schema versions from content/build revisions. | Should version numbers be visible to you? |
| P7 | Legacy compatibility | One-time migration outside normal runtime. | Must old JSON exports remain importable indefinitely? |
| P8 | Technology | Choose simplest maintainable stack after requirements. | Any preference for plain JS, TypeScript, framework, or hosting? |
| P9 | Privacy | Static hosting if sufficient; public-but-unadvertised is not private. | Is current public Pages access still acceptable or is authentication required? |
| P10 | Backup | Git history and verified backups/restores. | Do you want an additional automated off-GitHub backup? |
| P11 | Local migration | Audit all browser-only data before replacing persistence. | Which devices/browsers may contain uncommitted local data? |
| P12 | Failures | Clear errors, no silent authoritative replacement. | Error page, last-known-good fallback, or both? |

## 10. Build and reliability

**Insight:** Routine content edits should be boring. Tests should protect invariants and behavior without freezing user-maintained content.

| ID | Topic | Proposed default / requirement | Question for you |
|---|---|---|---|
| R1 | Release quality | Reproducible validation and verified production. | What confidence level is required before I say ready to verify? |
| R2 | Pipeline | One normal CI/build pipeline plus deployment; no disposable promotion workflows. | Automatic deploy after approved merge or manual production gate? |
| R3 | Tests | Protect invariants/behavior, not frozen historical data. | Agree legitimate content edits should not require unrelated test changes? |
| R4 | Validation | Check records, refs, paths, formats, and generated output. | Any essential integrity rules missing or needless rules to remove? |
| R5 | Browser tests | Test critical user workflows and approved offline behavior. | Which workflows must have browser-level coverage? |
| R6 | Deployment | Verify actual Pages deployment and published critical assets. | Require staging acceptance before production cutover? |
| R7 | Content changes | Validate/deploy app changes; avoid documentation-only production releases. | Should article/image edits deploy automatically after validation? |
| R8 | Notifications | Diagnose failures and remove obsolete/noisy workflows, not hide real failures. | All failures, production-only failures, or another notification policy? |
| R9 | Concurrency | Preserve direct edits and avoid overlapping releases. | Would you use a staging branch/folder for images rather than direct main uploads? |
| R10 | Dependencies | Reproducible builds and minimal necessary tooling. | Any tooling or dependency constraints? |
| R11 | Records | Concise current documentation plus Git/PR history. | How much separate release documentation do you want? |
| R12 | Chat process | Shorter transactions, durable checkpoints, no repetitive interruptions. | Any additional working rules? |

## 11. Migration and launch

**Insight:** Clean slate means architecture, not data loss. V1 remains recoverable until v2 passes migration and production acceptance.

| ID | Topic | Proposed default / requirement | Question for you |
|---|---|---|---|
| X1 | Repository | Build v2 alongside preserved v1. | Separate fishing-v2 repository or new directory/branch in existing repo? |
| X2 | Preservation | All authoritative facts, text, images, and known relationships retained. | Any records explicitly excluded from v2? |
| X3 | IDs | Preserve stable IDs despite filenames/routes changing. | Confirm existing IDs remain stable. |
| X4 | Media migration | Map active pictures to simple fields, verify bytes/captions. | When several candidates exist, choose currently displayed picture or review each ambiguity? |
| X5 | Local data | Export/audit actual browser-only records. | Any known local-only data or imports? |
| X6 | Reconciliation | Counts, IDs, field diffs, image/content checks, reference validation. | Do you want to approve a migration report before full cutover? |
| X7 | Cutover | Staging acceptance, rollback, v1 preserved. | Replace existing URL or launch v2 at a separate URL first? |
| X8 | Cleanup | Remove obsolete runtime machinery after validation, preserve Git history. | Archive old implementation rather than retain compatibility code? |
| X9 | Done | Approved requirements, preservation, tests, production smoke checks, rollback, reconciled docs. | What additional completion criteria matter? |

## 12. Explicitly deferred or excluded candidates

These candidates are not assumed to be initial v2 requirements. Promote any that you genuinely need now.

| Candidate | Proposed disposition | Question |
|---|---|---|
| Planner, trips, sessions, no-catch outings | Remove | Any exception? |
| Multi-user accounts, login, synchronization | Defer | Is single-user sufficient? |
| Automatic web image sourcing and provenance tracking | Remove | Confirm no exception. |
| Product shopping/deal engine and price updates | P3 | Any current need? |
| Generic relationship graph and inferred links | Remove | Any exact relationship missing above? |
| Catch dashboards, maps, advanced analytics | P3 | Promote any to P1/P2? |
| Inventory transaction ledger, depreciation | P3 | Any current need? |
| Configurable schemas and taxonomy administration | P3 | Repository-managed taxonomy sufficient? |
| Rich-text CMS and collaborative approval workflows | Defer | Any current need? |
| In-app revision browser and merge editor | P3 | Git plus simple conflict prevention sufficient? |
| Automated research ingestion and video metadata enrichment | P3 | Ordinary authored links sufficient? |
| Image galleries and automatic optimization | P3 unless required | One picture plus Markdown images sufficient? |
| Permanent old-schema compatibility adapters | Remove after migration | Any old export format still used? |

## 13. Engineering decisions after requirements approval

These are engineering recommendations to evaluate after you answer the inventory, not additional features to assume now.

| Area | Evaluation |
|---|---|
| Domain model | Shared conventions versus distinct schemas; Rod/Reel representation; common picture/content types. |
| Storage | Static generated bundle versus local-first persistence; whether IndexedDB is necessary. |
| Authoring | Secure GitHub-backed workflow, minimal handoff if retained, upload UX, conflict protection. |
| Media | One picture record, optional derived assets, arbitrary safe filenames, no provenance graph. |
| UI | Explicit router and shared components; removal of post-render DOM patching. |
| Build | Deterministic validation, content/media packaging, offline manifest, staging and production deployment. |
| Tests | Contract, integrity, browser, migration, and production smoke tests. |
| Migration | One-time v1 mapping, preservation audit, rollback, no unnecessary permanent legacy pathways. |

## 14. Review order and next deliverables

The most consequential choices are A1–A6 (authoring), P1–P5 (storage/offline), G10–G14 (inventory/setup modeling), C2–C8 (Catch requirements), and M4–M9 (media workflow). These should be resolved before choosing a framework or final schema.

After your batch response, I will prepare an approved requirements baseline; a minimal domain/schema proposal; a source-grounded Keep/Simplify/Replace/Remove assessment; a storage/authoring/offline architecture with meaningful alternatives; a data/media migration plan; and a streamlined build/test/deployment roadmap. The separate reliability audit will inspect actual failure categories and browser behavior before declaring the prototype healthy or deciding what code is reusable.

No v2 implementation, schema migration, production change, or repository cleanup is authorized by this document. Existing v1 data, IDs, authored text, and images remain protected.

## Source basis

Repository files inspected at the stated commit: README.md; Fishing_Context.md; Fishing_TODO.md; Fishing_Decision_Log.md; Fishing_New_Chat_Bootstrap_Prompt.md; pwa/README.md; pwa/DATA_MODEL_RECONCILIATION_DESIGN.md; pwa/gear-model.js; pwa/kb-model.js; pwa/gear-store.js; pwa/gear-app.js; pwa/media-ui.js; .github/workflows/fishing-pwa-build.yml. GitHub Actions runs #311 and #312 were also inspected. This is a comprehensive requirements inventory, not a completed line-by-line code/dependency audit.
