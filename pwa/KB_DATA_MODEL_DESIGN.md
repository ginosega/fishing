# Fishing Companion Knowledge Base Data Model

**Status: ACCEPTED / IMPLEMENTED / CURRENT.** Reconciled for the 2026-09-06 handoff. The underlying KB/Catch architecture is deployed and unchanged; the approved **Gear Guides** display-label refinement is pending release with My Gear schema4. Historical design and release details remain available in Git history and the Decision History.

## Product direction

Knowledge Base is a browsable repository of reusable fishing information, not a Planner or session/trip tracking application. Its articles are complete authored Markdown documents indexed by a small, strict entity catalog. Fishing Companion has separate My Gear, Knowledge Base, and Catch Log domains that share architectural principles but do not need identical schemas or storage.

The latest verified production/main checkpoint is `cdb1c500f08394a9c44ea2012b6de72adbd46ecc`, PR45, production workflow#235 reported successful. The pending Gear refinement is on`feature/gear-guides-ordered-links` at`24ea22ac187f81b42c2d91743e0a470ba3d1ad94`, not yet merged/deployed. The exact source/test/release handoff is`../Fishing_Release_Handoff_2026-09-06.md`. Do not treat the pending UI label as a deployed change or invent a PR number.

## Unified entity envelope

Every Location, Species, Equipment, Technique and Knot has the same logical fields:

| Field | Rule |
|---|---|
| id | Immutable lowercase kebab-case stable ID. |
| type | One of location, species, equipment, technique, knot. |
| name | User-facing name. |
| description | Optional card/page-header subtext. |
| picture | Optional representative card/header picture. |
| content | Path to one complete Markdown document. |

`type` is the only top-level discriminator. There is no nested Equipment or Technique subtype field, no connection type for Knots, and no Session ID. Use flexible Markdown for rigging, use cases, cautions, resources, warnings, videos, diagrams and images instead of proliferating atomic metadata fields.

Current KB schema1/data version`2026-09-04-kb-v1-final-content-1` has54 entities:8 Locations,7 Species,22 Equipment,7 Techniques,10 Knots. The pending release changes the user-facing KB equipment card to **Gear Guides** with exact subtitle`Equipment, rigs, and presentations reference`. The internal type remains`equipment`; no entity IDs, content paths, or domain relationships change.

## Taxonomy and content ownership

Location covers waters/access/seasonal and local observations; Species covers identification/behavior/habitat/targeting notes; Equipment covers rigs, presentations, lure and gear guides; Technique covers strategy, conditions, seasonal and species-oriented methods; Knot covers connection guidance and learning resources. Equipment is a flat peer type, not a nested Technique type. A historical ID such as`technique-*` may remain valid after classification as Equipment because stable identity is not derived from current display taxonomy.

Equipment and Technique articles currently share the physical directory`pwa/kb-content/techniques/`. The entity's`type` in`data/kb.seed.json` determines browse placement. Do not rename/move content files without updating their registered paths. Do not introduce a parallel folder-only taxonomy or duplicate the complete article into another domain.

The KB's equipment type is not the same thing as the owned Gear inventory category. My Gear's pending **Equipment** category retains key`accessories` and contains owned kayaks/tools/electronics/storage/tackle-management items. The KB card **Gear Guides** contains reusable knowledge. The two can link by stable ID without sharing a single taxonomy or creating a speculative relationship graph.

## Structured index and authored documents

The index is`pwa/data/kb.seed.json`; complete documents live in`pwa/kb-content/`; strict validation is in`pwa/kb-model.js`; UI/routes in`pwa/kb-app.js`; safe shared rendering in`pwa/markdown-render.js`. A new article needs a registered stable ID/type/name/content path and a complete Markdown document. Ordinary edits to an existing Markdown file do not require reauthoring the index if its identity/path stay unchanged. The build verifies registered content and internal targets.

The shared renderer handles headings, paragraphs, tables, blockquotes, code, emphasis, links/images, and nested/loose list structure. PR34 fixed nested-list indentation; PR41 fixed loose ordered-list continuation paragraphs and numbering. Valid authored source should not be flattened to work around the renderer. Authored navigation may appear under`# Links`,`## Related`, or any sensible section; tests validate actual stable-ID targets, not a required heading label.

External links use safe HTTP(S).`kb://<id>` and`gear://<id>` resolve stable navigation; registered relative KB links can be resolved through the index. Raw app hash routes/direct Markdown links are not the durable authored convention. Missing internal IDs fail validation rather than fuzzy-matching. This is navigation, not a maintained all-to-all relationship graph.

## Catch Log as a separate domain

Catches need exact historical facts and relationships, so they are not just KB articles. Schema2/data version`2026-09-04-catches-v2-external-notes-1` has5 records. Required Species/Location references, exactly one Lure/Bait, optional known setup/technique, date/time/size and optional exact picture belong in structured Catch data. Do not infer setup/technique from an older narrative or create generic additional-gear/session/trip relationships. Catch backlinks are computed from Catch-owned forward references.

Optional authored Catch narrative lives at`pwa/catch-content/<catch-id>.md` and renders as one Notes card. PR39 preserved the five original user-authored Exact Spot Notes verbatim while retiring structured Exact Spot Notes, generated Notes, source/Provenance fields, and duplicate narrative cards. A missing file means no Notes. Exact Catch picture takes priority; otherwise Species picture may be used as a presentation fallback. No session ID, Planner Attributes, trip history, or no-bite-session model is part of the product.

## Cross-domain consistency

The accepted rule is: store a structured relationship only when current application behavior requires the relationship as a durable fact. Catch's historical references, explicit owned-Gear media ownership and intentional KB reuse of a particular owned picture qualify. A general article link to a lure/rig is sufficient as authored navigation. Do not copy Gear records into KB or add a relationship field simply because another domain has one. My Gear and KB share stable IDs/validation/navigation principles, while their content ownership and storage remain appropriate to their different jobs.

The Gear schema4 change is limited to owned product links/taxonomy/media authoring. KB schema1 and Catch schema2 are unaffected. Do not migrate the KB because the Gear category is renamed or the KB card label changes. The source of truth and compatibility rationale are detailed in`DATA_MODEL_RECONCILIATION_DESIGN.md`.

## Picture and media handling

KB`picture.src` may use safe HTTP(S), safe`./assets/kb/...`, or intentional built owned-Gear`./assets/gear/...` paths. Explicit`gearItemId`/media identity is required where a KB picture depicts a particular owned item. Do not infer ownership from captions or labels or duplicate every Gear image into KB.

The repository-local media pipeline validates actual image format/structure, extension, size and safe paths, copies exact bytes, updates built metadata and verifies final output. Source-valid KB data can become invalid after media substitution; PR30 established the rule that final deployable transformed data must be revalidated. Do not rely on source validation alone.

User-supplied image binaries are uploaded directly to GitHub at the exact branch/path specified by the assistant; never transport/reconstruct binary bytes through the ChatGPT/GitHub connector. The pending Gear Notes sibling-image policy is confined to Gear authored content, supports safe Gear-ID-prefixed images beside the Markdown, preserves existing Notes image paths, and includes referenced assets offline. It does not alter KB identity or require duplicate media.

## UI and offline behavior

Root Knowledge Base Search is always available. A nonempty query hides category cards and shows matching results directly below controls; browse Search appears at10+entries. Card thumbnails use square white contain frames to preserve full source images without cropping. The Knowledge Base remains browsable, with stable routes and complete documents. Catch history is surfaced only where supported by exact relationships; no speculative reverse-link graph.

The Service Worker caches the shell, registered KB Content, relevant local KB/media assets, and Gear/Catch Notes manifests. Normal authored Markdown edits trigger the Pages build/deployment. Avoid overlapping direct-main content commits with coordinated runtime PR CI because the shared`fishing-pages` concurrency group cancels in-progress runs.

## Current content acceptance and future work

The PR28 content/imagery batch was accepted and closed through PR32 after source cleanup and media validation. It added Inline Spinner, Snaps & Swivels, Flasher Rig, Inline Trolling Rig, Bobber Rig, Slip Sinker Rig and Spring Fishing, and refreshed the principal lure/rig and Trout Fishing articles. PR34/41 subsequently fixed Markdown renderer behavior. This work is completed historical maintenance, not an open migration.

Future ordinary content work includes Texas, Carolina, Alabama and Neko rigs, Spoons, and relevant research in the canonical TODO. Maintain source facts and avoid inventing missing ownership or relationships. The immediate project release task is FISH-TODO-058, the preserved unmerged Gear refinement; it does not require redesigning the KB. Complete the normal release and update deployment status only after exact-head CI, merge, and actual Pages deployment succeed.