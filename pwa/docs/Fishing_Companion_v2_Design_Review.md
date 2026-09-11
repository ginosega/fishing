# Fishing Companion v2 — Requirements Reconciliation and Design Review

> Repository layout: production source/tests/contracts now live under `pwa/`; this document is retained PWA reference. Old `v2/`, v1 `pwa/`, History and Topics paths in dated evidence refer to the [pre-cleanup snapshot](https://github.com/ginosega/fishing/blob/edca2a3f04fc8c32dec65b9330d43944be1a561c/). Current instructions: [PWA README](../README.md).

> Current authority: original user responses below are preserved unchanged and approved through the [Approved Baseline](Fishing_Companion_v2_Approved_Baseline.md). P1 is implemented and published; original draft/approval status lines below are historical. See the [production release](Fishing_v2_Production_Release_2026-09-10.md) for current evidence.

**Status:** Assistant review / proposed design / awaiting joint approval. No v2 implementation authorized.
**Prepared:** September 8, 2026 (Pacific time).
**Reviewed repository commit:** `000e2aa121b43e131a9b91a411d8069fcc8bb31a`.
**User response source:** [Fishing_Companion_v2_Requirements_Inventory.md](Fishing_Companion_v2_Requirements_Inventory.md), blob `30f6aa902044cf413f483a6bc07ebcfc100e3631`.

## 1. How we will work together

The original inventory, including every user-authored Response cell, is the authoritative requirements input. This companion document records my interpretation, recommendations, engineering evidence, and the decisions that still need discussion. It does not replace or rewrite the user's responses. If my interpretation conflicts with a Response cell, the Response cell prevails until we resolve the discrepancy explicitly.

We will settle the remaining design questions before selecting the final architecture or beginning a v2 build. An accepted user requirement is not the same as acceptance of my proposed implementation. The existing application and its current source data remain untouched. The next step is a joint review of the open decisions below; after that, I will reconcile the approved requirements, finalize the technical design and migration plan, and only then begin implementation with the user's approval.

The overarching goal is to reduce the number of concepts, data copies, special cases, release steps, and permanent compatibility paths. We will preserve real user data and useful behavior, not complexity that exists only to support retired or hypothetical requirements.

## 2. Requirements already established by the responses

The following summarizes the accepted direction. The complete original responses remain in the inventory; this table is not intended to replace their exact wording.

| IDs | Reconciled requirement | Priority / status |
|---|---|---|
| S1–S7 | Personal, single-user Gear/KB/Catch application. All three domains readable at launch. Windows Edge/Chrome, iPhone Safari/Chrome, Android Edge/Chrome. Offline reading of text and images is P1; offline editing is P2 and must not drive unnecessary P1 complexity. | Accepted |
| G1–G10, G15–G16 | Keep the existing eight Gear categories and present Equipment types. Name, Manufacturer, Model, flexible ordered specifications, ordered Links, optional Markdown Notes and picture. No manufacturer database, quantity ledger, purchase history, or special structured specification units. Delete/category/type administration is rare and may be handled through chat. | Accepted |
| G11–G14 | Replace paired setups with separate rod and reel Gear items, each with its own facts, picture, links and Notes. No maintained setup, line, installed-accessory, or other relationship graph. Describe changing relationships with authored links in Notes. | Accepted; migration/type detail open |
| K1–K12 | Five flat KB types, complete authored Markdown, optional picture and an 80-character description. No article templates, atomic guidance, research ingestion, structured location/species extras, taxonomy administration, or in-app revision system. Taxonomy labels and membership may evolve through chat. | Accepted; presentation boundary open |
| K8, C7, C11 | Structured Catch relationships exist only for Species, Location, and owned Lure/Bait. Derived My Catch History appears on Species, Location, Lure and Bait pages. Other associations remain authored Markdown links. | Accepted |
| C1–C13 | Individual catches only; no sessions/trips. Local date/time, simple text Size, optional Species, Location and owned Lure/Bait; all other conditions and equipment in Notes. Catch browser Add/Edit and Species/Location/Lure filters are P2; date-range filter P3. No analytics. | Accepted; optional-reference details open |
| C9, M1 | A Catch has no independent representative-picture record. It displays its selected Species picture, or no picture if Species is absent or has no picture. | Accepted |
| M2–M14 | One authoritative representative picture for each Gear/KB item; user-supplied local images, authored caption, no visible Alt Text field, no source/provenance/owner metadata or viewer product link. Arbitrary user-chosen safe filenames, intentional file reuse, original-only storage, no remote images, no automatic conversion by default. Retain the current viewer's zoom, pan, pinch and caption. | Accepted; file policy/folder layout open |
| T1–T9 | Markdown for all narrative, human-readable filenames, current simple editor/Preview, ordinary links in the same tab, no automatic video enrichment, templates, drafts or revision UI. Retain durable internal linking. In-app deletion/reference-protection machinery is unnecessary. | Accepted; filename/link conventions open |
| U1–U11 | Three home cards. Preserve the existing visual design, cards and detail layouts except the agreed model/editor changes. Remove KB category counts. Search only at Gear root, KB root, Gear/Lures and KB/Gear Guides. Gear lists sort by Type then Name without special grouping; KB by Name; Catches newest first. No persisted search/filter state. | Accepted |
| U5 | Gear type filters appear only when a list has more than nine items and more than one distinct type. The filter rule is separate from the explicit search-placement rule. No KB type filters. | Accepted |
| A1–A12 | GitHub remains authoritative. Gear/KB browser Add/Edit remains useful; Catch authoring P2, deletion rare/chat-managed, reclassification P2, taxonomy administration through chat. No general import/export, autosave, persistent drafts, or elaborate merge editor. Prefer local-first sync eventually, but all such machinery is P2 and needs an explicit agreed plan. | Accepted; save architecture open |
| P1–P12 | Full offline library desired; no ongoing legacy-export support or extra backup service. Public Pages remains acceptable. Versions need not appear in the UI. Browser-only data must be considered before migration. | Accepted; cache/update/recovery design open |
| R1–R12 | Reproducible build, data validation, behavior/browser tests, actual production verification, automatic deployment after accepted changes, no unnecessary staging for ordinary releases, no staging upload branch requirement, fewer noisy workflows and concise records. | Accepted; engineering implementation to specify |
| X1–X9 | Build v2 alongside v1, preserve all facts/content/images, perform a verified migration, test v2 at a separate URL for the initial cutover, then replace the existing site. Remove v1 from the active tree after success; Git retains recovery history. No permanent old-schema adapters or manual approval of every migration row required. | Accepted; implementation strategy proposed below |

### Important distinctions

The request for a third home card does not mean Catch Log needs every P2 authoring/filter feature at launch. P1 includes viewing the complete Catch Log. The request for offline reading does not authorize local-first synchronization now. The request to remove source/provenance/owner metadata does not remove the need to validate file paths or protect files from accidental overwrites. The user's preference for no deletion-protection feature does not mean migration or normal writes may silently discard data. These are separate engineering integrity responsibilities.

## 3. Discussion A — Authoring, local-first storage and synchronization

**Related IDs:** A1–A6, A9–A11, P1–P5, P11–P12, R2, R9. This is the most consequential unresolved architecture choice.

### What the current implementation actually does

`pwa/gear-store.js` initializes IndexedDB from `gear.seed.json`. Seed-managed stores are replaced when schema/dataVersion changes, while imported stores have a separate preservation/upgrade path. Gear/KB Add/Edit currently prepares copyable packages rather than saving to GitHub. KB authoring includes source and displayed entities, data versions, Markdown snapshots, media mappings and source-aware validation. The production source therefore already supports two different read/persistence patterns without providing the desired local-first synchronization workflow.

There is no reason to keep a permanent editable Gear database merely because the prototype has one. Conversely, a future offline outbox must not be added casually: it requires persistent pending changes, retries, ordering, conflict semantics, credential handling and recovery. That is real product complexity, not a small variation of the current handoff.

### Recommended staged approach

| Stage | User experience | Technical boundary |
|---|---|---|
| P1 launch | Gear/KB Add/Edit with current-style Preview and a clear Prepare/Copy Changes action. ChatGPT promotes the change to GitHub. Catch entry can be handled through chat. The published application reads one generated repository snapshot. | No editable runtime database, no sync queue, no embedded GitHub credentials, no backend. A minimal, version-aware handoff replaces redundant source/media snapshots. |
| P2a, only if useful | A normal Save button and optional direct file upload. | Explicitly authorized repository-writing mechanism. The application never embeds a permanent secret in public source or treats the ChatGPT connector's credentials as browser credentials. |
| P2b, only if approved after P2a | Save locally while offline, show Pending/Synced/Failed state, and send queued changes when connectivity returns. | Durable local outbox of user changes and image bytes, safe retries, authentication, scoped commits, conflict policy, and recovery. No general multi-user sync platform or second permanent authoritative inventory. |

I recommend delivering P1 first, then evaluating P2a before committing to P2b. This preserves your preferred long-term direction without putting a P2 synchronization system on the critical path for a reliable first release. It also allows us to stop after P1 if the handoff workflow proves sufficient.

### Direct GitHub Save tradeoff

A public static site can read public repository data without authentication, but it cannot securely write to GitHub without an authorized identity. A GitHub token hardcoded into JavaScript, committed to the repository, or casually stored in browser storage is not an acceptable solution. A real direct-save design would need a deliberate authentication/authorization approach, such as a narrowly scoped GitHub authorization flow supported by a small service, or another explicitly approved mechanism. That service is additional infrastructure and would be justified only if the value of direct Save warrants it. We must not assume the assistant's connected GitHub authorization can be silently reused by a web page.

### What “last in wins” can safely mean

Your preferred conflict policy can be simple. I recommend last-writer-wins **for the same logical record**, not replacing the complete Gear/KB/Catch dataset with a stale copy. A save should carry the record ID, changed fields/content and a base revision. A later save can replace the relevant record/content if the current state is still compatible. An unrelated edit must not be overwritten. If the item was deleted, its identity changed, or the schema is incompatible, the save should stop with a clear message rather than resurrecting or corrupting data. A failed sync must remain pending rather than being reported as saved.

For a future offline outbox, retries must be idempotent: sending the same change twice must not create two records or duplicate a file. A user-visible pending state is sufficient; a general merge editor is not required. We will agree on the exact field/document conflict behavior before implementing it.

### Browser-only data and updates

“Browser-only records” means data stored in IndexedDB on one device that has never been committed to GitHub. The current application can retain imported data separately from seed-managed data. Your statement that none are known is useful, but does not prove every browser contains only repository data. Before cutover, a one-time diagnostic/export process should inspect the relevant browsers/devices and preserve any differences. We do not need a permanent import/export feature to perform that migration check.

The Update Available question concerns published app/content versions, not editing an item. A form changes nothing authoritative until the explicit Save/Prepare action. A newly deployed repository version may become available separately. The application should not reload over unsaved form work or silently lose a pending edit. For P1 read-only data, a simple version refresh and offline-cache status is sufficient.

**Decision A1:** Accept the staged P1 handoff → optional P2 direct Save → optional P2 offline outbox plan, or do you want to prioritize a different order? **[Gino Sega]:** Accepted.

**Decision A2:** For a future direct Save, are you willing to authorize GitHub through a secure login/authorization flow and, if necessary, a small backend service? This does not imply adding a user-account system to the public reading site. **[Gino Sega]:** That sounds reasonable; we can revisit if and when we address this P2.

**Decision A3:** For last-writer-wins, do you prefer a whole-document replacement when the same Markdown article is edited twice, while structured fields merge independently where safe? My recommendation is yes, with no silent overwrite of unrelated records and a visible failure for deletion/schema conflicts. **[Gino Sega]:** I agree with your recommendation.

## 4. Discussion B — Source folders, filenames and media limits

**Related IDs:** M2, M4–M6, M8–M13, T2, T4, P4.

### Folder structure

I agree with your preference for folders that match the site hierarchy, without going down to Type level. I propose a stable folder key for each Category, with the human-readable display label allowed to change independently. This avoids moving the entire library when a label is renamed.

```text
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
  ...other current categories...
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

The names above are illustrative, not final directory names. A category's stored key and folder name need not match its display label. A reclassified entry should retain its existing content/image paths unless we explicitly choose to relocate those files; otherwise a simple taxonomy edit turns into a potentially fragile file move and link rewrite. New files would be created in the destination category folder. This is a small, predictable exception to physical folder alignment, and the entry's structured Type/Category remains authoritative.

Each entry points directly to its optional representative picture and Markdown file. The asset and content folders may contain images reused by multiple entries. No owner prefixes, media IDs, or source/derived directories are required in the authored model. The build may emit a separate generated asset tree, but that is not a second authoritative media repository.

### Filename policy

I recommend allowing spaces, capitals, digits, Unicode letters, hyphens, underscores, parentheses and ordinary punctuation that is safe as a filename. Preserve the user's chosen filename; do not silently convert it to a slug or Gear ID. Reject empty names, `.`/`..`, directory separators, control characters, unsafe/reserved platform names, and collisions. Compare paths in a case-insensitive/canonicalized way for collision protection so Windows and case-sensitive hosting do not disagree. Encode paths correctly in URLs and Markdown. A practical filename length limit is 180 characters (and a conservative UTF-8 byte limit) to prevent filesystem/path problems. Exact validation details will be tested rather than implemented with a restrictive ID-prefix regex.

For Markdown, suggest a filename based on the article name, such as `Silver Lake, Whatcom County.md`, but allow the user to edit it. Renaming the display Name should not automatically rename the file. Existing document paths remain valid until an explicit move. Stable IDs remain independent of file names and categories.

### Proposed image acceptance policy

| Rule | Proposal | Rationale |
|---|---|---|
| Supported upload formats | JPEG/JPG, PNG, WebP, GIF | Broad browser support; preserves the currently supported ordinary image formats, including legacy GIFs. No format conversion pipeline required. |
| Maximum file size | 10 MiB per image | Existing source validation already uses this limit. It is generous for ordinary web images while preventing unusually large files from silently inflating the offline library. A limit is simpler than automatic compression. |
| Maximum dimensions | Propose 6,000 × 6,000 pixels, with a 36-megapixel ceiling | Prevents an extremely large decompressed image from consuming excessive memory despite a small compressed file. This is a proposed safety/performance bound, not an existing project requirement. We will validate against actual images before adopting it. |
| HEIC/HEIF | Not supported for P1 uploads | Cross-browser display and decoding differences make an automatic conversion path undesirable. Convert explicitly before uploading if necessary. |
| SVG | Not accepted as user-content images | Avoids adding a separate sanitization/security model for executable or externally referencing SVG content. Trusted application icons remain a separate matter. |
| AVIF | Defer unless needed | No demonstrated need to add another decoder/validation path. Existing images, if any, must be inventoried before migration. |
| Oversized/invalid file | Reject with a clear size, dimension or format error | No silent recompression, resizing, cropping, or filename changes. The user can prepare a smaller file and retry. |
| Existing source images | Preserve and inventory before applying new restrictions | An existing accepted file must not disappear merely because a new upload policy is narrower. Any exception or conversion must be explicit and tested. |

The dimension limit is deliberately open for your review. The actual image inventory may show that a different limit is more appropriate. I would not introduce a hard total-library quota without measuring the current assets and the target devices' available storage.

### When would thumbnails become necessary?

We should measure rather than guess. The first implementation should load representative pictures lazily, provide explicit image dimensions, reuse cached files, and keep one authoritative image. We will measure total offline bytes, number of images, initial list transfer, image decode/render time, memory and scrolling on the supported phone/desktop browsers. If full-size images make lists slow or the offline bundle unreasonably large, we can introduce deterministic generated thumbnails without changing the authored picture model. Generated images would be disposable build outputs; the original remains authoritative. I recommend against building a transformation service before we have that evidence.

A representative-image gallery means several pictures attached to one entry, with next/previous navigation or thumbnails. You have confirmed that one representative picture plus any number of images in Markdown is sufficient, so no gallery data model is needed. Catch Notes should use the same Markdown image support.

**Decision B1:** Approve the category-level folder pattern above, including stable folder names and no automatic file move on reclassification? **[Gino Sega]:** Approved.

**Decision B2:** Approve the safe human-readable filename approach, including spaces/capitals and no ID matching requirement? **[Gino Sega]:** Approved.

**Decision B3:** Are JPEG/PNG/WebP/GIF, 10 MiB, and the proposed 6,000-pixel/36-megapixel limit acceptable? I recommend explicit rejection rather than automatic resizing. We will verify the policy against the existing library before final approval. **[Gino Sega]:** Accepted and approved.

**Decision B4:** Approve one authoritative image with lazy loading and performance measurement before considering generated thumbnails? No galleries or automatic optimization in P1. **[Gino Sega]:** Approved.

## 5. Discussion C — Rods & Reels and migration of setup data

**Related IDs:** G11–G14, X2–X4.

Your decision to split rods and reels removes the need for the special paired-component schema, setup editor, component media ownership, and maintained setup relationships. All new items can use the same ordinary Gear facts and picture/Notes structure.

The current seed has three setup records: `setup-spinning`, `setup-baitcasting`, and `setup-spincasting`. Each contains a rod and reel with separate manufacturer/model/specifications/links. The spinning and baitcasting identities are known from the source. The spincasting record describes a Pflueger President Spincast Combo, but that does not establish a separately identified rod model beyond the recorded combo facts.

The likely migration is six individual records, three rods and three reels, replacing three combined records. If the actual spincasting rod is not yet identified, preserve the known combo facts and mark its model as unknown rather than inventing one. The old setup IDs can be mapped in the one-time migration record; other existing Gear/KB/Catch IDs should normally remain unchanged to preserve links. There is no benefit in globally renaming stable IDs merely because v2 is a new version.

You specified five types: Baitcasting rod, Spinning rod, Baitcasting reel, Spinning reel, and Spincasting reel. A sixth type, Spincasting rod, would be a natural way to represent the third rod separately; we should not silently add it without agreement. The original three setup Notes, component facts and pictures must be reconciled into the new items without duplication or lost narrative. Any existing links to a combined setup need a deliberate migration mapping. We will not infer new ownership or equipment identities from historical reference material.

**Decision C1:** Should we add **Spincasting rod** as a sixth Rods & Reels type? If not, which of your five types should contain the spincasting rod? **[Gino Sega]:** Yes, add it as a sixth type.

**Decision C2:** For the still-unidentified spincasting rod, should the new record use the known combo description with an unknown model until you identify it? I recommend that rather than inventing a model. **[Gino Sega]:** Copy the current manufacturer, model, specifications, and links from the current rod and reel items to the new ones. Copy the notes content used for the current setup into two identical markdown files, one for the rod and one for the reel. I will make changes to the specifications and notes using the Edit Gear Item feature on the new rod and reel pages.

**Decision C3:** Do you agree that we should preserve all unaffected IDs, assign new IDs to the individual rod/reel records, and maintain an old-to-new mapping only in the migration report (not as a permanent setup-compatibility system)? **[Gino Sega]:** Yes, I agree.

## 6. Discussion D — Catch simplification and historical preservation

**Related IDs:** C3–C11, K4/K8, M1.

I recommend a very small Catch model: ID, date, optional local time, optional text Size, optional Species ID, optional Location ID, optional owned Lure/Bait ID, and optional Markdown Notes path. There is no Catch-owned representative picture. Its display image is derived from Species. No setup, technique, line, trailer, depth, weather, or other structured fields are needed for P1. A single Lure/Bait reference is sufficient; non-owned tackle can be described in Notes. The source of a derived Catch backlink is the Catch record, not a reverse relationship table.

The current five Catch records have null setup/technique references and null exact pictures. They contain known Species, Location and Lure/Bait references, along with measurement objects. The v2 text Size field can preserve the existing measurements as their original human-readable values, such as `13 in`, without inventing extra precision. Existing authored Catch Notes remain exact. If future source data contains a fact that is removed from the structured schema, it must be preserved in the migration archive and, where useful, migrated into authored Notes rather than silently discarded.

The user has explicitly made Species optional because identification may be unknown. I recommend that Location and Lure/Bait also be optional, consistent with the stated goal of avoiding invented or mandatory associations. A missing Species means no representative image; a selected Species without a picture also means no image. A missing owned Lure/Bait reference may still have explanatory Notes, but does not create a backlink to a product that is not recorded as owned.

**Decision D1:** Confirm the exact P1 Catch fields above, including optional Location as well as optional Species and Lure/Bait, and no separate Catch picture. **[Gino Sega]:** Confirmed.

**Decision D2:** Approve migrating existing structured Size values to plain text while preserving their original units and all current historical facts? No automatic enrichment or guesses. **[Gino Sega]:** Approved.

## 7. Discussion E — KB presentation taxonomy and internal links

**Related IDs:** K2–K3, K8, T2, T4, X3.

There is no need for a universal definition of every fishing presentation. I suggest a practical editorial rule: **Gear Guides** explains the physical rig, lure configuration, or equipment and how it is assembled or presented; **Techniques** explains the broader fishing method, strategy, conditions, or application. Some topics legitimately overlap. Choose the type that makes the entry easiest to find and put cross-references in Markdown. Do not introduce a second `kind`, tags, or a relationship graph merely to resolve borderline classifications. Reclassification can be chat-managed and does not need to move the article file.

For example, a Texas rig reference can reasonably be a Gear Guide; a spring bass strategy can be a Technique. An article about fishing a particular presentation may belong in either depending on its actual emphasis. We can review ambiguous existing entries after agreeing on the rule, without requiring a full taxonomy redesign.

I recommend keeping `gear://<stable-id>` and `kb://<stable-id>` links. They are already used in authored content, are independent of display names and physical paths, and give us durable navigation across a file reorganization. The editor can expose a read-only ID and a Copy Link action on each item, so you do not have to manually construct or hunt for a link. Copy Link is a small usability control, not a relationship database. Standard relative Markdown links can remain valid for ordinary local resources, but entity navigation should use the stable-ID convention.

**Decision E1:** Accept the practical Gear Guides/Techniques editorial rule, with ambiguous entries classified by their primary purpose and authored cross-links rather than additional taxonomy fields? **[Gino Sega]:** Accepted.

**Decision E2:** Keep the current `gear://` / `kb://` convention and add a simple Copy Link control? I recommend this over changing all existing authored links. **[Gino Sega]:** Agreed.

## 8. Proposed minimal domain contracts (illustrative, not approved schemas)

The following shows the direction of the design. Exact field names, optionality, paths and version format will be finalized only after the open decisions are resolved.

### Common conventions

- Stable, opaque-to-the-user ID. Existing IDs are preserved wherever possible; category/name/file changes do not redefine identity.
- One authoritative structured record per entity; no duplicate source/display entity snapshots or media ownership tables.
- Authored narrative is stored in Markdown, with a single explicit path or a deterministic documented path. No duplicate inline narrative database.
- Representative pictures are ordinary optional properties of Gear/KB, referencing user-maintained local files. Image metadata is limited to path and user-authored caption. Display alt text is derived from the caption or entity name, without a separate authoring field.
- Only required, feature-driven relationships are stored. Internal links in Markdown are navigation, not an inferred graph.
- Schema versions change only for structural changes; ordinary content changes use the repository/build revision.

### Gear example

```json
{
  "id": "vmc-crs-crankbait-snaps",
  "category": "snaps-swivels",
  "type": "Snap",
  "name": "VMC CRS Crankbait Snaps",
  "manufacturer": "VMC",
  "model": "CRS",
  "specifications": [{ "label": "Size", "value": "1" }],
  "links": [{ "label": "VMC", "url": "https://example.com/product" }],
  "picture": { "src": "Gear/Snaps-Swivels/assets/VMC CRS Crankbait Snaps.jpg", "caption": "VMC CRS Crankbait Snaps" },
  "notes": "Gear/Snaps-Swivels/content/VMC CRS Crankbait Snaps.md"
}
```

This is an illustrative fictional record, not a new owned item or a proposed factual correction. Fields such as optional Manufacturer/Model remain separately editable as requested. The exact saved representation may omit empty optional properties.

### KB example

```json
{
  "id": "location-silver-lake-whatcom",
  "type": "location",
  "name": "Silver Lake, Whatcom County",
  "description": "Freshwater fishing reference",
  "picture": { "src": "KB/Locations/assets/Silver Lake.jpg", "caption": "Silver Lake" },
  "content": "KB/Locations/content/Silver Lake, Whatcom County.md"
}
```

The example demonstrates the shape only. Existing authored descriptions and article text will be preserved rather than replaced by these examples.

### Catch example

```json
{
  "id": "catch-2026-07-27-silver-lake-largemouth-01",
  "date": "2026-07-27",
  "time": "20:00",
  "size": "13 in",
  "speciesId": "species-largemouth-bass",
  "locationId": "location-silver-lake-whatcom",
  "lureOrBaitId": "berkley-flicker-shad-5",
  "notes": "Catches/content/2026-07-27 Silver Lake largemouth.md"
}
```

The example represents the intended simplified field shape using existing known facts, not a completed migration. Nullable fields may be absent when unknown. Picture display is derived from Species; no `picture` field or reverse-reference array is stored on the Catch. The final mapping must reconcile actual source records and content files.

## 9. Current implementation assessment — Keep / Simplify / Replace / Remove

This assessment is grounded in the source files listed below. It is an initial architecture assessment, not a completed line-by-line dependency audit or a claim that all runtime bugs have been diagnosed. Before implementation we will enumerate actual dependencies, assets, references, generated files and tests, and produce a removal plan with preservation checks.

| Area / current source | Recommendation | Evidence and reason |
|---|---|---|
| Gear/KB/Catch domain separation | Keep | Distinct domain facts are justified; generic entity/relationship infrastructure is not. `gear-model.js`, `kb-model.js`. |
| Gear ordinary facts, ordered specifications/links | Keep / simplify | Already close to desired schema. Replace unnecessary manufacturer object with simple text if migration and UI benefit; avoid a wholesale redesign of useful fields. `gear-model.js`, `gear-app.js`. |
| Paired setup schema and special editor | Replace | `SETUP_FIELDS`, `COMPONENT_FIELDS`, embedded rod/reel validation and `renderSetupEditor` exist solely for the retiring paired-setup design. Migrate to ordinary records. |
| Gear IndexedDB seed/import/upgrade logic | Replace for P1; archive migration utilities | `gear-store.js` maintains seed-managed and imported states and includes schema3→4 upgrade paths. P1 can read the generated bundle; future offline authoring is a separate approved feature. |
| KB flat index and complete Markdown | Keep / simplify | Preserves desired document model. Remove duplicate authoring/source overlays and obsolete metadata in the new implementation. |
| Catch model and backlinks | Simplify | Remove setup/technique and independent picture fields, optionalize required associations, use text Size; retain exact forward references and derive only desired backlinks. |
| Markdown renderer | Keep behavior; evaluate reuse/replacement | Must preserve lists, tables, ordinary links and safe rendering. Current custom parser contains many special cases; choose a tested minimal renderer or retain well-tested components only after comparison. `markdown-render.js`. |
| Internal link conventions | Keep | Stable-ID navigation survives name, category and file changes. Add Copy Link usability rather than a relationship table. |
| Gear/KB media registries and overlays | Replace | `media-sources.json`, `media-owners.json`, `media-overrides.json`, `local-media.json`, `kb-picture-model.js`, `apply-local-media.mjs` manage duplicate source/owner/display concepts. One picture field removes the need for that runtime graph. |
| Remote image discovery/download and video title enrichment | Remove | `build.mjs` fetches remote product images, discovers page metadata, and calls YouTube oEmbed. These are explicitly unnecessary and introduce network variability. Preserve actual images before removal. |
| Current image viewer | Keep behavior; simplify integration | Zoom/pan/pinch/caption are wanted. Remove product/source link handling and have item renderers supply picture data directly. `media-ui.js`. |
| Post-render image and route patching | Replace | `media-ui.js` and `gear-app.js` use DOM observation/enhancement and separate route ownership. Prefer one explicit router and shared direct-rendered components. |
| Gear/KB browser editors | Keep UX; replace data/promotion plumbing | Preserve separate fields, repeaters and Preview. Simplify handoffs and media controls; remove setup-only restrictions, source/owner UI, and unnecessary source snapshots. |
| Multiple content/media build stages | Replace | Current build, authored-Notes stage, local-media stage and final validation mutate/package data in sequence. Prefer one deterministic source validation and bundle build with a final output check. |
| Runtime/data version machinery | Simplify | Schema versions are structural; a content revision can be the Git commit/build ID. No manual dataVersion bump for every picture or article edit. |
| Permanent release-specific content tests | Replace with stable contracts | The current workflow includes many dated acceptance tests and exact source/output paths. Preserve meaningful assertions in migration fixtures and contract tests, not historical image/file locks. |
| PWA offline behavior | Keep requirement; replace cache implementation as needed | Current service worker precaches core files, Gear media and KB/Notes manifests; Gear media failures are optional while other asset failures can abort install. A verified complete library and last-known-good activation are needed for P1. |
| Current card/detail visual design | Keep | User explicitly likes existing design. Preserve appearance and behavior with shared components, not old implementation constraints. |
| Legacy migration/compatibility code | Remove from normal runtime after migration | One-time migration is required; permanent schema3/4 and historical adapter paths are not. Preserve old code in Git. |
| Release workflow and documentation | Simplify | One standard CI/build/deploy path, concise current records, meaningful checks, no disposable promotion workflows or documentation-only production deployments. |

## 10. Offline reading and update/recovery design

The entire library is a reasonable goal given your expected limited growth, but browser storage is not an unlimited guaranteed disk. The final migration must measure actual image bytes and test the target devices. An offline badge should distinguish Ready, Downloading and Incomplete states; merely having a service worker installed is not proof that every article and image is available.

For P1, I recommend a versioned, complete read-only content bundle and asset manifest. The application downloads and verifies the new release before making it active. If an update fails because of a missing file, network failure or insufficient storage, the previously complete version remains available. New content is not presented as offline-ready until all required assets have been verified. The user may explicitly refresh/update; ordinary data edits still require their own Save/Prepare action. We should test this behavior in the supported mobile browsers, including quota/eviction scenarios, rather than promising permanent offline availability beyond browser guarantees.

A diagnostic should expose the deployed build ID, offline readiness, asset count/size and any failed assets without exposing technical versions in ordinary browsing. A one-time migration audit will also check browser storage so retiring IndexedDB does not discard local-only data. No permanent editable data store is necessary for P1 read-only runtime content.

## 11. Migration and preservation plan

### Source snapshot and inventory

Before migration, freeze a known source commit and enumerate all authoritative Gear, KB and Catch records, Markdown documents, image files and current media mappings. Record IDs, paths, hashes, sizes, references and active picture choices. Inspect all current source/derived media relationships and identify missing or remote-only images. Remote images must be replaced with user-supplied local files before v2 can satisfy the no-remote-image requirement. Do not assume a successful old build implies every currently referenced source exists.

### Browser-only data

Use a one-time, explicit read/export diagnostic on the user's relevant devices. Compare any local Gear records against the repository source and preserve differences before disabling the old database. No silent import/merge/replace or deletion of local records. The current five Catch records are source-managed; no local Catch writer is currently documented. Do not infer that there are no local-only Gear records merely because none are known.

### Transformation

Create the v2 domain records using a deterministic, repeatable one-time migration tool. Preserve existing IDs wherever possible; generate new IDs for split rods/reels and document old-to-new mappings. Preserve all structured facts, links and authored Markdown. Convert removed structured fields into appropriate authored Notes or a clearly retained migration archive when necessary; never silently discard unique information. Preserve the exact active user picture bytes and authored captions, intentionally shared files, and all internal links. Do not infer ownership or historical Catch relationships.

### Reconciliation and cutover

Compare source and destination record inventories, field values, Markdown text/hashes, image hashes, links and relationship targets. A count difference caused by splitting three setups into individual items must be explained by the mapping, not treated as missing or extra inventory. Validate final output and offline inclusion, then run browser acceptance on the separate v2 URL. The user does not need to manually approve every record, but the report must be available and all discrepancies resolved or explicitly accepted. Preserve the old deployed version and commit for rollback. Replace the original URL only after the separate v2 is verified. Remove the v1 active source/code after success, retaining Git history and an explicit rollback reference.

## 12. Proposed implementation and release roadmap

| Phase | Deliverable | Exit condition |
|---|---|---|
| 0. Requirements agreement | Reconciled accepted requirements and finalized open decisions in this document. | User explicitly approves the agreed v2 baseline and architecture. |
| 1. Source/dependency/data audit | Full source/asset inventory, actual CI failure taxonomy, browser-only data check plan, remote-image list, migration mapping. | No unknown authoritative data sources or unexamined dependencies in the migration scope. |
| 2. Minimal architecture and contracts | Final schemas, folder/path rules, authoring protocol, offline design, dependency/tooling choice and test plan. | User agrees to any remaining architecture tradeoffs; contracts are testable. |
| 3. Small vertical slice | Shared navigation, one Gear item, one KB article, one Catch, local picture/Markdown, simple editing handoff and offline read. | Representative browser and source/build tests pass without legacy media/persistence machinery. |
| 4. Complete migration | All records, files, links and active pictures migrated; split rods/reels and optional Catch fields reconciled. | Automated preservation report and full integrity checks pass. |
| 5. Complete P1 UI and offline acceptance | All three read-only domains, Gear/KB Add/Edit handoff, approved search/filter/layout rules, viewer, complete offline cache. | Supported-browser smoke tests, full offline library verification and production-like build pass. |
| 6. v2 cutover | Separate v2 URL accepted, final current-source reconciliation, production replacement and rollback checkpoint. | Actual production deployment and critical browser/asset checks pass; old version recoverable. |
| 7. P2 review | Evaluate direct Save, upload integration, Catch browser authoring/filters and offline outbox in priority order. | Each feature implemented only after its specific design/cost is approved. |

Ordinary development releases should not require user acceptance on a separate staging URL. The separate v2 URL is a one-time migration/cutover safeguard, as requested in X7. Automatic production deployment follows an accepted merge and successful required checks. Documentation-only edits should not trigger an unnecessary application deployment. Failures should remain visible and actionable, not be hidden by weakening tests.

## 13. Remaining approval checklist

The next response can simply reference the decision IDs. Accepting a recommendation does not require repeating the complete inventory.

| Decision | Topic | Recommended answer / action |
|---|---|---|
| A1 | Staged authoring | P1 handoff, optional P2 direct Save, then optional P2 offline outbox. |
| A2 | Direct-save authentication | Secure explicit authorization; no embedded static-site token; backend only if justified. |
| A3 | Conflict semantics | Last writer wins on same logical record/document, not unrelated data; clear errors for deletion/schema conflicts. |
| B1 | Folder architecture | Category-level assets/content folders, stable folder keys, no automatic move on reclassification. |
| B2 | Filenames | Human-readable safe filenames, spaces/capitals allowed, no ID requirement. |
| B3 | Image limits | JPEG/PNG/WebP/GIF, 10 MiB, proposed 6,000px/36MP; no automatic conversion. |
| B4 | Thumbnails/galleries | One authoritative picture; measure performance first; no gallery schema. |
| C1 | Rod types | Add Spincasting rod as sixth type, subject to confirmation. |
| C2 | Unknown rod | Preserve known combo facts; do not invent a separate rod model. |
| C3 | Identity migration | Preserve unaffected IDs; new IDs for split components; one-time mapping only. |
| D1 | Catch schema | Optional Species, Location, Lure/Bait; text Size; Notes; Species-derived picture only. |
| D2 | Historical sizes | Convert to display text preserving values/units; no invented facts. |
| E1 | KB taxonomy | Classify by primary article purpose; no extra taxonomy fields. |
| E2 | Internal links | Keep gear:// and kb://; add Copy Link usability. |

## 14. Source evidence and audit boundary

Reviewed current GitHub main at `000e2aa121b43e131a9b91a411d8069fcc8bb31a`. The user response document is unchanged. Source inspection covered the canonical README, Context, TODO, Decision Log, bootstrap, PWA README and latest release; the existing data model reconciliation design; `pwa/gear-model.js`, `kb-model.js`, `gear-store.js`, `gear-app.js`, `kb-app.js`, `kb-authoring-model.js`, `kb-picture-model.js`, `authoring-common.js`, `markdown-render.js`, `media-ui.js`, `build.mjs`, `apply-local-media.mjs`, `image-validation.mjs`, `sw.js`, the Gear/Catch source seeds, media manifests and relevant permanent tests; and the production workflow. This supports the architectural conclusions above, but is not yet a complete dependency-by-dependency or byte-level migration inventory.

Current source references: [Gear model](https://github.com/ginosega/fishing/blob/edca2a3f04fc8c32dec65b9330d43944be1a561c/pwa/gear-model.js), [KB/Catch model](https://github.com/ginosega/fishing/blob/edca2a3f04fc8c32dec65b9330d43944be1a561c/pwa/kb-model.js), [Gear persistence](https://github.com/ginosega/fishing/blob/edca2a3f04fc8c32dec65b9330d43944be1a561c/pwa/gear-store.js), [Gear UI](https://github.com/ginosega/fishing/blob/edca2a3f04fc8c32dec65b9330d43944be1a561c/pwa/gear-app.js), [KB UI](https://github.com/ginosega/fishing/blob/edca2a3f04fc8c32dec65b9330d43944be1a561c/pwa/kb-app.js), [KB authoring](https://github.com/ginosega/fishing/blob/edca2a3f04fc8c32dec65b9330d43944be1a561c/pwa/kb-authoring-model.js), [Media resolution](https://github.com/ginosega/fishing/blob/edca2a3f04fc8c32dec65b9330d43944be1a561c/pwa/kb-picture-model.js), [Build](https://github.com/ginosega/fishing/blob/edca2a3f04fc8c32dec65b9330d43944be1a561c/pwa/build.mjs), [Local media](https://github.com/ginosega/fishing/blob/edca2a3f04fc8c32dec65b9330d43944be1a561c/pwa/apply-local-media.mjs), [Service worker](https://github.com/ginosega/fishing/blob/edca2a3f04fc8c32dec65b9330d43944be1a561c/pwa/sw.js), [Production workflow](https://github.com/ginosega/fishing/blob/cac5b4108a63fcaab498b256afa4420ce2dbbd70/.github/workflows/fishing-pwa-build.yml).

The latest inspected completed production run #312 (`34237232075`) succeeded. The preceding run #311 (`34237203787`) failed because `final-content.test.mjs` attempted to stat the deleted `pwa/assets/gear-source/bonafide-rvr119.png`. This is one confirmed coupling issue. The complete failure-email history, actual deployed-browser behavior, asset totals, and all code dependencies still require the planned audit. ChatGPT response failures are a separate reliability issue and cannot be attributed to this application architecture without evidence.

**No runtime, schema, data, media, CI workflow or deployment changes are made by this design review.** The original inventory remains the user's editable requirements source. The next step is to resolve the decision checklist together before implementation.
