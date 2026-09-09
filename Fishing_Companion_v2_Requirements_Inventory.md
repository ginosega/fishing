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
| C1 | Purpose | Individual fish, not trips or no-catch sessions. | Confirm this scope. | Confirmed. |
| C2 | Editing | Straightforward Add/Edit if Catch is included at launch. | Should catches be authored in the browser or through ChatGPT/repository changes? | Adding a catch in the browser is a P2 for launch; adding it via chat is fine. |
| C3 | Date/time | Date required, time optional, no unnecessary timezone transformations. | Do you need exact timestamps or just local date/time? | Local date/time. |
| C4 | Species/location | Exact KB references when known; preserve unknown historical facts. | Must new catches select existing KB entries? Can a missing entry be created during capture? | Creating a missing Species entry during capture is a P2. note that I might not know the species when I catch it, so we probably should not make this required. |
| C5 | Size | Preserve original measurements and units without false precision. | Which length/weight fields and metric support do you need? | The Size field that we currently have is fine. Since it is a text field I can add text for both length and weight if I want to. |
| C6 | Lure/bait | Reconsider mandatory owned-Gear reference. | Should free text be allowed? Can there be no lure/bait or more than one? | I like the links to owned gear where it exists (and the "My catch history" link back to the catch from that lure or bait Gear page), but like Species I don't think that this should be a required field, and if the catch is made with gear that I don't have in the Gear list, then I'll just leave it blank and add something to the Notes. |
| C7 | Equipment references | Optional exact known setup and technique references. | Which additional gear, line, leader, or trailer references are useful? | None - just lure or bait. This is because for these Gear items we want to populate the "My Catch History" card. That is also true for Locations KB entries, but we don't need that functionality for other Gear or KB types - if I decide to do that for any other gear used on a catch I would just add that to the Notes for that catch. |
| C8 | Conditions | Keep spot/depth/structure/conditions in Markdown unless filters require fields. | Which conditions, if any, should be structured for reporting? | None. |
| C9 | Pictures | Shared picture structure. | One picture or multiple? Species fallback, generic placeholder, or none? | Single picture. If a Species is included in the catch log then use that species' picture. If the Species field is left blank then do not use a picture for the catch. |
| C10 | Browse | Chronological list with useful filters. | Which filters and sorts do you need? | This is not a P1, but the P2 filters are Species, Location, and Lure/Bait. The P3 filter is Date Range. |
| C11 | Backlinks | Derive only real references. | Which Gear/KB pages should display Catch history? | Gear: Lure and Bait. KB: Location and Species. |
| C12 | Analytics | Defer dashboards and statistics. | Any statistics, maps, or CSV export needed at launch? | No. |
| C13 | History | Preserve all five existing records and Notes exactly. | Confirm no unknown historical facts should be filled by inference. | Confirmed. |

## 5. Images and media

**Insight:** Eliminate source/provenance/owner metadata from the application. The containing item establishes its representative picture; Git history still protects old files.

| ID | Topic | Proposed default / requirement | Question for you | Response |
|---|---|---|---|---|
| M1 | Picture authority | Accepted direction: one optional picture object on each Gear/KB item, no separate authoritative registry. | Should Catch use exactly the same structure? | Not exactly. Catch should use the picture for the selected Species. As noted above though, Species should be an optional field for a catch, so a picture may not exist. |
| M2 | Metadata | Accepted direction: local path, alt text, optional authored caption; no source, provenance, owner, or product destination. | Should alt text be required or default to the item name and remain editable? | I really don't need alt text. If you want to include it you are welcome to, but just make it the picture's caption. I don't want to see an Alt Text field on an Add/Edit Item page. |
| M3 | Acquisition | Accepted direction: user-supplied images only; no web sourcing. | Confirm no automatic image retrieval is needed. | Confirmed. |
| M4 | Filenames | Accepted direction: independent of ID; validate safety, not naming convention. | Permit spaces, capitals, and Unicode, or prefer a safe ASCII subset? | I prefer to use spaces and capitals, but if you have concerns about this I am flexible - let me know. |
| M5 | Folders | Clear upload destination with no hidden naming rules. | One shared image folder or separate Gear/KB/Catch/content folders? | It's helpful to me when the GitHub folder structure aligns with the site architecture. That way, when I am looking for an image or markdown file for a Gear item I would start in a folder named "Gear." Where I think that can get messy though, is if we go too far down that path - since there's a chance we may add or rename Types, for example, we would not want to have folders at that level. I think this is less risky for the Category level (Rods, Reels, Lures, Snaps & Swivels, Species, Knots, Gear Guides, etc.). So my preference is to have Gear\[Category] and KB[Category] folders. Let me know if you agree with that, and if you do then we can discuss the next level - we need to decide where to store the authoritative picture (where applicable), and where to store the content (markdown files and images reference in those files). What do you think of this: Gear\[Category]\assets, Gear\[Category]\content, KB[Category]\assets, KB[Category]\content, and Catches\content? |
| M6 | Upload UX | Prefer file selection/upload integrated with chosen authoring architecture. | Must the form upload the file, or is a separate GitHub upload acceptable? | A form upload is preferable, but it is not a P1. A GitHub upload is acceptable. |
| M7 | Replacement | Keep/Replace/Remove, no accidental overwrite or premature deletion. | Keep replaced files only in Git history or also in active assets? | Only in Git history. |
| M8 | Sharing | Ordinary explicit path reuse; no ownership graph. | May two items reference the same image file? | Yes. |
| M9 | Derivatives | One authoritative picture; generate thumbnails only if performance requires. | Separate optimized thumbnails/full-size images now, or only when demonstrated necessary? | I *think* only if necessary, but how will we know when that is necessary? |
| M10 | Viewer | Basic enlarge/close; remove source and product-page UI. | Keep zoom, pan, pinch, and caption display? | Yes, keep zoom, pan, pinch, and caption display. You did a great job with the image viewer. |
| M11 | Markdown images | Keep local images in articles/Notes. | Should Catch Notes support them? Do you need representative-image galleries? | Yes, Catch Notes should support them. What do you mean by representative-image galleries? |
| M12 | Formats | Validate actual format, extension, existence, safe path, size, and collision. | Which formats and size limit should be supported? | I'd like you to propose these limits and the rationale for each and I can review and approve. |
| M13 | Transforms | No automatic cropping or changes without approval. | Should uploads be resized/compressed automatically? | I worry that this is an area that could get too complicated. Is it possible that when we agree to size limits per above we can then just prevent uploads of anything that exceeds them? |
| M14 | Remote images | Local representative images by default. | Disallow remote images entirely, or only for representative pictures? | Disallow entirely. |

## 6. Markdown and content

**Insight:** One authoritative document and predictable safe rendering are more valuable than a general-purpose content management system.

| ID | Topic | Proposed default / requirement | Question for you | Response |
|---|---|---|---|---|
| T1 | Narrative authority | Markdown for KB, Gear Notes, and Catch Notes. | Confirm the same narrative format for all three. | Confirm. |
| T2 | Filenames | One document per entity with stable reference. | Stable-ID, human-readable, or arbitrary Markdown filenames? | Human-readable. I will need to be able to easily locate it when browsing GitHub, so I suppose it should match the item's name, for example "VMC CRS Crankbait Snaps.md," "Silver Lake, Whatcom County.md," or "Chatterbait.md." |
| T3 | Editor | Simple Markdown editor and preview. | Which toolbar, split view, autosave, or full-screen features matter? | The current implementation (a "Preview" button but no toolbar, autosave, or full-screen features) is working great. |
| T4 | Internal links | Durable ID-based navigation. | Keep gear:// and kb:// or use standard relative Markdown links? | I like the current links, but I have not used any yet so if you want to propose a change, I am willing to hear it. |
| T5 | External links | Ordinary authored links. | New tabs? Automatic YouTube titles/previews or plain links? | No new tabs, no automatic titles or previews. Just plain links. |
| T6 | Markdown features | Common Markdown with safe rendering. | Any required HTML, footnotes, task lists, diagrams, or special syntax? | Nothing special required - keep as-is. |
| T7 | Templates | No required article structure. | Optional templates or table of contents needed? | None needed, or wanted. |
| T8 | Deletion | Protect referenced content and report broken links. | Should deletion be blocked while referenced or allow explicit override? | I worry that detecting and preventing deletion could introduce unnecessary complexity, so I would say leave this out of scope. If I break something, it's on me to find and fix it. |
| T9 | History | Git history rather than an in-app revision system. | Is ordinary editor undo plus Git sufficient? | Yes. |

## 7. Browsing and UI

**Insight:** Preserve useful behavior, not post-render patches, duplicate route handlers, or historical implementation mechanisms.

| ID | Topic | Proposed default / requirement | Question for you | Response |
|---|---|---|---|---|
| U1 | Home | Three domain entry points; no unused navigation. | Are these the only home cards? | Yes, and I like your suggestion to add "Catch Log" as a third card. |
| U2 | Gear layouts | Preserve useful layouts, not their old implementation. | Which pages should remain exactly as they are, and which should change? | Rods & Reels should change to be split into separate rod and reel pages - we've discussed that above. The rest of the Gear pages are fine, no changes needed. The New Gear Item and Edit Gear Item pages will need to change though, per the decisions we've made in this document. |
| U3 | KB layouts | Five flat category cards and familiar article pages. | Any KB navigation/layout changes? | We don't need the "[#] entries" labels on the category cards. No changes needed to the other KB pages, although we will need to change the New KB Entry and Edit KB Entry pages per the decisions we've made in this document. |
| U4 | Search | Simple domain search, with global search only if useful. | One site-wide search, separate searches, or both? Which content must be indexed? | Slight change to current behavior: search at the My Gear and KB level and on the Gear/Lures and KB/Gear Guides pages due to their length. |
| U5 | Filters | Context-specific, not a blanket site-wide rule. | Keep the ten-item threshold? Which pages need filters and which should not have them? | Let's refine the rule to be > 9 items, *and* >1 types. The second clause prevents filters that would produce the same list. Note that filters are only needed for Gear pages, not KB articles because those don't have types. For Catches, see my response to C10. |
| U6 | Grouping | Explicit meaningful grouping and predictable sorting. | Which pages should be grouped? User-controlled sort order? | This is where we could easily run into category-specific UI that adds complexity for minimal value, which I'd like to avoid. So for Gear let's just go with what we have today on most Gear pages: sort items first by type (e.g., Chatterbaits above Crankbaits above Inline Spinners) and then by name (e.g., Berkely Flicker Shad above Rapala DT). This means that the Rods & Reels page will lose its Baitcasing, Spinning, and Spincasting groups, which is okay. For the KB, flat lists sorted by Name (current implementation) is fine. For the Catch Log, continue to sort by Date, with the newest date at the top.  |
| U7 | Cards | Consistent square contain images without cropping. | Do you need compact/dense list modes? | No. Keep the existing UI. |
| U8 | Details | Shared header, facts, picture, narrative, links, relevant catch history. | Which sections/order matter on each domain's detail page? | No change to existing; the pages look great today. |
| U9 | Navigation | Stable deep links, back behavior, clear missing-item handling. | Should search/filter state survive navigation and refresh? | No. I like the way the on-page Back button works today in conjunction with the broswer's Back button: If I want to navigating up the site hierarchy I use the on-page button, and if I want to navigate through the page view history I  use  the broswer button. |
| U10 | Accessibility | Responsive, keyboard accessible, readable, no horizontal overflow. | Any specific accessibility or font-size requirements? | No. Not a concern for me. |
| U11 | Appearance | Reuse approved visual language unless redesign has a clear benefit. | Should v2 look essentially like v1 or receive a visual redesign? | Like v1. |

## 8. Authoring and source of truth

**Insight:** The save workflow is a pivotal decision. A minimal handoff, direct authorized repository save, and local-first sync have very different complexity costs.

| ID | Topic | Proposed default / requirement | Question for you | Response |
|---|---|---|---|---|
| A1 | Authority | GitHub remains durable authority unless explicitly changed. | Confirm GitHub owns all Gear, KB, Catch, Markdown, and images. | Confirmed. |
| A2 | Editing coverage | Consistent Add/Edit across domains with domain-specific fields. | Should every domain support browser Add/Edit/Delete? | Yes, modulo the exceptions noted elsewhere in this document. |
| A3 | Save workflow | Choose a clear repository handoff, authorized direct write, or local-first sync model. | Prefer A: copy to ChatGPT, B: Save updates GitHub, or C: save locally and sync later? | I will preface my answer by saying that this is where we need to be careful not to over-engineer and add unnecessary complexity and potential fragility. You and I must *completely and explicity* agree on the plan for this before doing any work. My preference is to have adds/edits/deletes made in the app, saved locally first (in case of offline usage), and then synced as soon as the network is available; if I am online the sync would happen immediately. *That said* I am flexible here and I consider that a P2, and will accept either saving to GitHub or copying to ChatGPT. I would like to hear your thoughts on this topic and work out the plan - potentially a staged plan - with you.  |
| A4 | ChatGPT role | Assistance and complex edits, not necessarily mandatory promotion. | Should ordinary edits be possible without ChatGPT? | Ideally yes, but see my comments to A3 above. |
| A5 | Handoff | If retained, minimal change plus base revision, not full redundant datasets. | What should a handoff contain? Whole article or changed portion? | IMHO, only the changed portion. |
| A6 | Image authoring | Align upload with the selected save workflow. | Direct file upload from form or separate GitHub upload plus path entry? | Ideally direct file upload from form, but again see my comments to A3 above. |
| A7 | Identity/taxonomy | Automatic stable IDs and safe reclassification. | Should all renaming/reclassification be UI-managed? | Renaming yes. Reclassification is a P2. |
| A8 | Taxonomy administration | Avoid generic admin framework. | Do you need to create/edit types and categories yourself? | No, I would expect to have to go through you for that. |
| A9 | Drafts | Simple unsaved-change protection. | Persistent drafts/autosave or leave-page warning sufficient? | No persistent drafts or auto-saves are needed. |
| A10 | Conflicts | Never silently overwrite newer edits. | Reload, diff, or merge editor for stale changes? | Last in wins. Let me know if you need more info on specific scenarios. |
| A11 | Bulk data | No generic merge/replace/import system without actual need. | Do you need ongoing CSV/JSON import/export or just backup? | No import/export needed. |
| A12 | Errors | Clear actionable validation/save messages. | What current Add/Edit frustrations must v2 explicitly fix? | None that I am aware of. |

## 9. Persistence, offline, hosting

**Insight:** Offline reading does not imply offline editing. Avoid maintaining two competing authoritative datasets by accident.

| ID | Topic | Proposed default / requirement | Question for you | Response |
|---|---|---|---|---|
| P1 | Runtime source | Read-only generated bundle if local editable storage is unnecessary. | Must the browser maintain editable inventory data? | See my response to A3; I consider that a P2. |
| P2 | IndexedDB | Remove or simplify if not serving an approved feature. | Do you use local import/merge/replace or have browser-only records? | I am not sure what "browser-only records" means.. |
| P3 | Offline editing | Defer unless explicitly needed. | Must you create/edit records while disconnected? | See my response to A3; I consider that a P2. |
| P4 | Offline library | Cache required content/images predictably. | Entire library offline or selected/downloaded subsets? | I anticipate using this often when offline (e.g., fishing in remote areas), so having the entire library offline would be good. Let me know if you have concerns with that, and know that I don't expect the library to grow much larger than it is today except for the catch log (which reuses pictures anyway), and a one-time addition of the pictures that are currently sourced from the Web. |
| P5 | Updates | Clear update state and no loss of unsaved work. | Automatic update, update control, or manual refresh? | I am not sure if I am correctly interpreting the question, but I do not expect a Gear or KB item to be updated until and unless I click a "Save Changes" or "Add Item" button. |
| P6 | Versions | Separate structural schema versions from content/build revisions. | Should version numbers be visible to you? | No. |
| P7 | Legacy compatibility | One-time migration outside normal runtime. | Must old JSON exports remain importable indefinitely? | No. |
| P8 | Technology | Choose simplest maintainable stack after requirements. | Any preference for plain JS, TypeScript, framework, or hosting? | No. |
| P9 | Privacy | Static hosting if sufficient; public-but-unadvertised is not private. | Is current public Pages access still acceptable or is authentication required? | The current is acceptable. |
| P10 | Backup | Git history and verified backups/restores. | Do you want an additional automated off-GitHub backup? | No. |
| P11 | Local migration | Audit all browser-only data before replacing persistence. | Which devices/browsers may contain uncommitted local data? | I think all of them, but let me know if this introduces unintended complexity. |
| P12 | Failures | Clear errors, no silent authoritative replacement. | Error page, last-known-good fallback, or both? | Both, if that does not introduce unintended complexity. |

## 10. Build and reliability

**Insight:** Routine content edits should be boring. Tests should protect invariants and behavior without freezing user-maintained content.

| ID | Topic | Proposed default / requirement | Question for you | Response |
|---|---|---|---|---|
| R1 | Release quality | Reproducible validation and verified production. | What confidence level is required before I say ready to verify? | I don't think I have the knowledge and understanding to answer that question, so maybe that should be your call. |
| R2 | Pipeline | One normal CI/build pipeline plus deployment; no disposable promotion workflows. | Automatic deploy after approved merge or manual production gate? | Your proposal is accepted. |
| R3 | Tests | Protect invariants/behavior, not frozen historical data. | Agree legitimate content edits should not require unrelated test changes? | Yes. |
| R4 | Validation | Check records, refs, paths, formats, and generated output. | Any essential integrity rules missing or needless rules to remove? | Your proposal is accepted. |
| R5 | Browser tests | Test critical user workflows and approved offline behavior. | Which workflows must have browser-level coverage? | Your proposal is accepted. |
| R6 | Deployment | Verify actual Pages deployment and published critical assets. | Require staging acceptance before production cutover? | I am the only user of this application, so I think that deploying to a staging and having me test on a separate URL is overkill. If we release a bug to production we'll just fix it there. |
| R7 | Content changes | Validate/deploy app changes; avoid documentation-only production releases. | Should article/image edits deploy automatically after validation? | Yes. |
| R8 | Notifications | Diagnose failures and remove obsolete/noisy workflows, not hide real failures. | All failures, production-only failures, or another notification policy? | Your proposal is accepted. |
| R9 | Concurrency | Preserve direct edits and avoid overlapping releases. | Would you use a staging branch/folder for images rather than direct main uploads? | No. |
| R10 | Dependencies | Reproducible builds and minimal necessary tooling. | Any tooling or dependency constraints? | No. |
| R11 | Records | Concise current documentation plus Git/PR history. | How much separate release documentation do you want? | Your proposal is accepted. |
| R12 | Chat process | Shorter transactions, durable checkpoints, no repetitive interruptions. | Any additional working rules? | No. |

## 11. Migration and launch

**Insight:** Clean slate means architecture, not data loss. V1 remains recoverable until v2 passes migration and production acceptance.

| ID | Topic | Proposed default / requirement | Question for you | Response |
|---|---|---|---|---|
| X1 | Repository | Build v2 alongside preserved v1. | Separate fishing-v2 repository or new directory/branch in existing repo? | Your proposal is accepted. |
| X2 | Preservation | All authoritative facts, text, images, and known relationships retained. | Any records explicitly excluded from v2? | None excluded. |
| X3 | IDs | Preserve stable IDs despite filenames/routes changing. | Confirm existing IDs remain stable. | I am okay if they remain, and also okay if you decide you want to change them. |
| X4 | Media migration | Map active pictures to simple fields, verify bytes/captions. | When several candidates exist, choose currently displayed picture or review each ambiguity? | Your proposal is accepted; I can change these later if needed. |
| X5 | Local data | Export/audit actual browser-only records. | Any known local-only data or imports? | None. |
| X6 | Reconciliation | Counts, IDs, field diffs, image/content checks, reference validation. | Do you want to approve a migration report before full cutover? | No. |
| X7 | Cutover | Staging acceptance, rollback, v1 preserved. | Replace existing URL or launch v2 at a separate URL first? | This is one case where we should probably stage v2 on a separate URL, test it, and then replace v1 only when we are confident that v2 is working. |
| X8 | Cleanup | Remove obsolete runtime machinery after validation, preserve Git history. | Archive old implementation rather than retain compatibility code? | Your proposal is accepted - remove v1, we still have it in Git if needed. |
| X9 | Done | Approved requirements, preservation, tests, production smoke checks, rollback, reconciled docs. | What additional completion criteria matter? | None. |

## 12. Explicitly deferred or excluded candidates

These candidates are not assumed to be initial v2 requirements. Promote any that you genuinely need now.

| Candidate | Proposed disposition | Question | Response |
|---|---|---|---|
| Planner, trips, sessions, no-catch outings | Remove | Any exception? | None. |
| Multi-user accounts, login, synchronization | Defer | Is single-user sufficient? | Yes. |
| Automatic web image sourcing and provenance tracking | Remove | Confirm no exception. | Confirmed. |
| Product shopping/deal engine and price updates | P3 | Any current need? | No. |
| Generic relationship graph and inferred links | Remove | Any exact relationship missing above? | Only between a Catch and the Lure/Bait/Location. |
| Catch dashboards, maps, advanced analytics | P3 | Promote any to P1/P2? | No. |
| Inventory transaction ledger, depreciation | P3 | Any current need? | No. |
| Configurable schemas and taxonomy administration | P3 | Repository-managed taxonomy sufficient? | Yes. |
| Rich-text CMS and collaborative approval workflows | Defer | Any current need? | No. |
| In-app revision browser and merge editor | P3 | Git plus simple conflict prevention sufficient? | Yes. |
| Automated research ingestion and video metadata enrichment | P3 | Ordinary authored links sufficient? | Yes. |
| Image galleries and automatic optimization | P3 unless required | One picture plus Markdown images sufficient? | Yes. |
| Permanent old-schema compatibility adapters | Remove after migration | Any old export format still used? | No. |

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
