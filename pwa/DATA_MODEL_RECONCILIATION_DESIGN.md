# Fishing Companion Data Model Reconciliation Design

**Status:** ACCEPTED / IMPLEMENTED / CURRENT

**Accepted:** 2026-09-02

**Reconciled through:** 2026-09-04 / PR #34 / production content checkpoint `0b89ebc20de049fe5d072e93edcdcaa7b13d01b2`

**Purpose:** Keep My Gear, Knowledge Base, and Catch Log architecturally consistent without forcing identical schemas, identical persistence, or speculative relationship maintenance.

## 1. Core decision

Architectural consistency means **shared rules**, not identical storage or record shapes.

The three domains must agree on:

- stable identity;
- explicit fact ownership;
- strict schema validation;
- exact relationships when product behavior requires them;
- no inference of identity/relationships from prose or presentation text;
- route generation from stable IDs rather than routes stored as data;
- computed backlinks rather than duplicated reverse references;
- deliberate separation of structured facts from authored narrative;
- final-form validation whenever build-time transformation changes already-validated structured data.

Central rule:

> **Do not add a relationship to a schema merely because two entities are conceptually related. Store a structured relationship only when the relationship itself is a durable fact required by current application behavior. Otherwise, use authored Markdown links where useful.**

Current consequence:

- Catch Log needs structured relationships because they define historical meaning and drive backlinks/filtering.
- My Gear does **not** maintain a Gear→Gear or Gear→KB relationship graph.
- KB does **not** infer relationships by scanning Markdown.
- `gear://...` and `kb://...` links are authored navigation, not maintained relationship records.

## 2. Current durable domains

### My Gear

```text
pwa/data/gear.seed.json
        ↓
strict schema-v2 validation
        ↓
IndexedDB local store
        ↓
GearRepository
        ↓
My Gear UI
```

Current production seed: schema version `2`, data version `2026-09-04-my-gear-v2-final-content-1`, **63 records**.

My Gear owns owned identity and product/setup facts: manufacturer, model, specifications, typed external links, and item/setup-specific Notes.

### Knowledge Base

```text
pwa/data/kb.seed.json
        ↓
strict unified entity validation
        ↓
registered complete Markdown documents
        ↓
KB renderer/routes
```

Current production seed: schema version `1`, data version `2026-09-04-kb-v1-final-content-1`, **54 entities**: 8 Location, 7 Species, 22 Equipment, 7 Technique, 10 Knot.

KB owns reusable fishing knowledge. One complete Markdown document owns headings, narrative, tables, nested lists, links, warnings, resources, and embedded pictures.

Equipment and Technique entities currently share the physical `pwa/kb-content/techniques/` directory; `type` controls taxonomy. That directory layout is not itself a domain discriminator.

### Catch Log

```text
pwa/data/catches.seed.json
        ↓
strict Catch validation
        ↓
validated Gear + KB relationships
        ↓
Catch UI + computed backlinks
```

Current seed contains **5 structured catches**. Catch Log owns historical catch facts and the exact structured cross-domain relationships current product behavior requires.

## 3. Stable identity

Every independently referenceable durable entity has an immutable stable ID.

Examples: Gear item `sufix-832-15`, Gear setup `setup-spinning`, KB entity `technique-ned-rig`, Catch `catch-2026-07-27-silver-lake-largemouth-01`.

Names, descriptions, taxonomy, Markdown paths, picture files, routes, and display labels are not identity. Embedded rod/reel component value objects do not need independent IDs because current product behavior does not reference them independently.

Stable IDs deliberately survive taxonomy changes. An entity may retain a `technique-*` ID while its current KB `type` is `equipment`.

## 4. Fact ownership

### My Gear owns

- owned item/setup identity;
- manufacturer/model/part facts;
- product specifications;
- typed external links;
- item/setup-specific Markdown Notes;
- exact stable association of media to Gear identity through the media ownership layer.

### Knowledge Base owns

- reusable fishing knowledge;
- rigging/use/selection guidance;
- equipment/presentation guides;
- strategy and seasonal/condition guidance;
- knot guidance;
- species/location reference material;
- authored internal/external resource links.

### Catch Log owns

- historical catch facts;
- required Species and Location relationships;
- exactly one lure/bait relationship;
- optional setup/presentation relationships when actually recorded;
- catch-specific narrative and provenance.

Presentation/media helpers do not own product facts.

## 5. Structured relationships are feature-driven

Current maintained structured relationships are principally Catch-owned:

- Catch → Species
- Catch → Location
- Catch → optional rod/reel setup
- Catch → optional Technique/Equipment presentation
- Catch → exactly one Lure/Bait

A representative KB picture may also carry explicit `gearItemId` when it depicts a specific owned item and the UI should link the caption to that My Gear leaf. This is a narrow presentation/navigation relationship with exact identity, not a general Gear↔KB graph.

My Gear does not add line configuration, related-lure, related-knot, or related-knowledge structured relationships merely for normalization.

## 6. Authored links are navigation, not relationship records

Accepted internal Markdown link schemes:

```markdown
[Owned item](gear://stable-gear-id)
[Knowledge article](kb://stable-kb-id)
```

Registered relative KB Markdown links are also supported. The renderer constructs current routes and build validation ensures targets exist.

Authored stable-ID navigation is independent of section labeling: `# Links`, `## Related`, or another sensible Markdown heading is acceptable. Tests validate the durable stable-ID link/target, **not a particular heading string**. PR #32 made this invariant explicit after the user's valid formatting cleanup removed old `## Related` headings.

There is no requirement to maintain reverse links or exhaustive associations merely because an authored link exists.

## 7. My Gear schema v2

Dataset envelope:

```json
{
  "schemaVersion": 2,
  "dataVersion": "YYYY-MM-DD-my-gear-v2",
  "items": []
}
```

Ordinary items contain accepted structured fields for stable ID, category, type, name, manufacturer, model, specifications, links, and optional Markdown `notes`. Rods & Reels remain first-class setup records with embedded rod/reel product value objects and optional Notes.

Retired/rejected from schema v2: top-level profiles, usage/connections and profile IDs, setup `mainLine`/`leader`, configuration relationship objects, `knowledgeRefs`, raw HTML guidance, and unknown structural fields.

## 8. Unified Knowledge Base envelope

Every Location, Species, Equipment, Technique, and Knot uses:

```text
id
name
type
description?
picture?
content
```

There are no entity-specific atomic data fields. Current top-level types are `location`, `species`, `equipment`, `technique`, and `knot`.

**Equipment** is a flat peer type for rigs, presentations, lure-family guides, and equipment-oriented knowledge. **Technique** remains for strategy, conditions, species-oriented methods, and broader approaches. No nested taxonomy was added.

## 9. Catch model rules

Catch relationships use exact stable IDs and strict category/type validation.

Historical rules:

- do not infer setup;
- do not infer technique/presentation solely from lure identity;
- do not invent session/trip relationships;
- exact spot/depth/structure/conditions belong in catch Markdown narrative;
- a multi-species source row becomes separate catches when appropriate.

Backlinks are computed from Catch forward references rather than stored redundantly. Exact Catch image overrides linked Species art; Species art is presentation fallback only.

## 10. No identity inference from presentation

Application code must not discover Gear or KB identity from rendered names, page headings, manufacturer/model strings, image aliases, fuzzy text similarity, Markdown prose, or generated routes. Broken IDs fail validation rather than falling back to a similar-looking record.

## 11. Routes are presentation concerns

Structured data and authored internal links store stable IDs, not hash routes.

- Gear: `#/inventory/item/{id}`
- KB: `#/kb/entity/{id}`
- Catch: `#/kb/catch/{id}`

`gear-app.js` owns all `#/inventory/...`; `kb-app.js` owns Home and all `#/kb/...`.

## 12. Storage symmetry is not a goal

- My Gear uses JSON seed + IndexedDB because it is local-first and intended for future editing.
- KB uses JSON catalog + Markdown because it is document-oriented and browse-only.
- Catch Log remains structured JSON until an editing feature justifies a writable repository/store.

Storage should not be changed merely to make domains look alike.

## 13. Media reconciliation

Media is separate from Gear facts.

### Remote/source media

- `media-sources.json` owns source/provenance/retrieval metadata.
- `media-owners.json` owns exact Gear stable-ID association.
- `media-ui.js` looks up exact owners and never performs fuzzy identity matching.

A setup component may use explicit `component: rod|reel` ownership.

### Repository-local media

PR #26 added `local-media.json` and `apply-local-media.mjs`. Repository-local images are validated for size, supported format structure/signature, and extension consistency, then copied into the production bundle.

KB `picture.src` accepts only `http(s)` URLs, safe `./assets/kb/...` paths, or safe `./assets/gear/...` paths when intentionally reusing built owned-Gear media. Arbitrary local roots remain invalid.

PR #32's production pipeline also validated the user's replacement Largemouth/Smallmouth Bass images under this same model.

### Final transformed-data validation

PR #30 established:

> **If a build step mutates already-validated structured data, validate the final deployable transformed data after the mutation.**

The motivating defect was PR #28's valid source KB seed becoming runtime-invalid after six picture sources were transformed to `./assets/gear/...`. `apply-local-media.mjs` now revalidates the transformed built KB bundle after all media substitutions and before deployment.

### User-supplied binary transport rule

> **Do not transport user image binaries/base64 through ChatGPT→GitHub connector calls.**

ChatGPT specifies the exact branch/path/filename; the user uploads the binary directly; ChatGPT verifies it and handles text configuration, data, Markdown, tests, PR, and deployment.

## 14. Validation rules

Current build/test validation includes:

- strict exact Gear record shapes and legacy-field rejection;
- required non-empty data versions;
- five-type KB enum and exact entity shapes;
- stable unique IDs and one registered Markdown Content path per KB entity;
- Catch type/category relationships and exactly one lure/bait per Catch;
- `gear://`, `kb://`, and registered relative-link target validation;
- authored stable-ID navigation independent of section-heading label;
- exact Gear media owner IDs/component selectors;
- KB picture-source allow-list;
- repository-local image validation;
- route ownership and retired-Planner regression tests;
- final-content regression tests;
- final transformed KB-bundle validation after local-media substitution.

Nested-list rendering is a presentation invariant rather than a data-model relationship. PR #34 added regression coverage ensuring indentation-based nested unordered/ordered Markdown lists remain nested in rendered HTML. This did **not** alter the KB entity envelope, storage model, or cross-domain relationship rules.

## 15. Search/filter and UI principles

These are presentation conventions, not data-model changes:

- root My Gear and KB have Search;
- browse-list Search appears at **10+ entries**;
- if a page has Search and dropdown/filter, the filter is right-aligned;
- Line is a flat list while Rods & Reels remains grouped;
- My Gear stays browse-only until CRUD is explicitly resumed;
- correctly indented Markdown lists remain nested in Fishing Companion.

## 16. Current implementation/release status

Reconciliation design was accepted in PR #15 and implemented in PR #16. Subsequent production work preserved the same principles:

- PR #24 — flat Equipment peer type
- PR #25 — Catch/media polish and browse conventions
- PR #26 — repository-local media hardening
- PR #27 — Recovery B Gear/browse/content updates
- PR #28 — final KB content/image batch and authored cross-links
- PR #29 — project-state reconciliation
- PR #30 — Gear-backed KB picture validation + final transformed-data guard
- PR #31 — durable state reconciliation after recovery
- PR #32 — final PR #28 authored-content acceptance and heading-independent link regression
- PR #33 — state reconciliation after final acceptance
- PR #34 — indentation-aware nested Markdown list rendering

Latest verified runtime release:

- PR #34 exact tested head `4c94156416e7bfddfb912991c86bc3e5af66b91c`
- CI #158 / `33850003616` success
- merge `82601038f0e931f6ef1bee4c8f5e062a73c793c5`
- production #159 / `33850049987` tests + build + transformed/local-media validation + bundle verification + Pages deploy success
- user confirmed the live nested-list fix

Latest audited production content checkpoint before nightly reconciliation:

- `main` `0b89ebc20de049fe5d072e93edcdcaa7b13d01b2`
- production #161 / `33850346865` success through GitHub Pages deployment
- includes subsequent authored-content maintenance to Buzzbait, Fishing Line, Rods & Reels, and Walking Bait

The PR #28 content-acceptance sequence is closed. No current production requirement justifies reopening the core data-model architecture.

## 17. Future editing direction

My Gear CRUD remains deferred. When resumed, normal forms are the everyday edit path, validated JSON export/import can support backup/bulk editing, and there should be no raw JSON editor inside the PWA.

Future KB/Catch editing should add persistence only when the requested feature demonstrates the need. Do not redesign current schemas merely for hypothetical future synchronization.
