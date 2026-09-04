# Fishing Companion Data Model Reconciliation Design

**Status:** ACCEPTED / IMPLEMENTED / CURRENT

**Accepted:** 2026-09-02

**Reconciled through:** 2026-09-04 / PR #28

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
- deliberate separation of structured facts from authored narrative.

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

Current production seed:

- schema version `2`
- data version `2026-09-04-my-gear-v2-final-content-1`
- 63 records

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

Current production seed:

- schema version `1`
- data version `2026-09-04-kb-v1-final-content-1`
- 54 entities: 8 Location, 7 Species, 22 Equipment, 7 Technique, 10 Knot

KB owns reusable fishing knowledge. One complete Markdown document owns headings, narrative, tables, links, warnings, resources, and embedded pictures.

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

Current seed contains 5 structured catches.

Catch Log owns historical catch facts and the exact structured cross-domain relationships current product behavior requires.

## 3. Stable identity

Every independently referenceable durable entity has an immutable stable ID.

Examples:

- Gear item: `sufix-832-15`
- Gear setup: `setup-spinning`
- KB entity: `technique-ned-rig`
- Catch: `catch-2026-07-27-silver-lake-largemouth-01`

Names, descriptions, taxonomy, Markdown paths, picture files, routes, and display labels are not identity.

Embedded rod/reel component value objects do not need independent IDs because current product behavior does not reference them independently.

Stable IDs deliberately survive taxonomy changes. For example, an entity may retain a `technique-*` ID while its current KB `type` is `equipment`.

## 4. Fact ownership

### My Gear owns

- owned item/setup identity;
- manufacturer/model/part facts;
- product specifications;
- typed external links for the owned item;
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

A representative KB picture may also carry an explicit `gearItemId` when it depicts a specific owned item and the UI should link the caption to that My Gear leaf. This is a narrow presentation/navigation relationship with exact identity, not a general Gear↔KB graph.

My Gear does not add line configuration, related-lure, related-knot, or related-knowledge structured relationships merely for normalization.

## 6. Authored links are navigation, not relationship records

Accepted internal Markdown link schemes:

```markdown
[Owned item](gear://stable-gear-id)
[Knowledge article](kb://stable-kb-id)
```

Registered relative KB Markdown links are also supported.

The renderer constructs current routes. Build validation ensures targets exist.

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

Ordinary items contain the accepted structured fields for stable ID, category, type, name, manufacturer, model, specifications, links, and optional Markdown `notes`.

Rods & Reels remain first-class setup records with embedded rod/reel product value objects and optional Notes.

Retired/rejected from schema v2:

- top-level `profiles`;
- `usage` / `connections`;
- `usageProfileId` / `connectionProfileId`;
- setup `mainLine` / `leader`;
- `configuration` relationship objects;
- `knowledgeRefs`;
- raw HTML guidance;
- unknown structural fields.

The former **How to use it** presentation became **Notes**.

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

There are no entity-specific atomic data fields.

Current top-level types:

- `location`
- `species`
- `equipment`
- `technique`
- `knot`

**Equipment** was added as a flat peer type on 2026-09-03 for rigs, presentations, lure-family guides, and equipment-oriented knowledge. **Technique** remains for strategy, conditions, species-oriented methods, and broader approaches.

No nested taxonomy was added.

## 9. Catch model rules

Catch relationships use exact stable IDs and strict category/type validation.

Historical rules:

- do not infer setup;
- do not infer technique/presentation solely from lure identity;
- do not invent session/trip relationships;
- exact spot/depth/structure/conditions belong in catch Markdown narrative;
- a multi-species source row becomes separate catches when appropriate.

Backlinks are computed from Catch forward references rather than stored redundantly.

Catch picture behavior is presentation-only: an exact Catch image overrides, otherwise linked Species art is the fallback.

## 10. No identity inference from presentation

Application code must not discover Gear or KB identity from:

- rendered names;
- page headings;
- manufacturer/model strings;
- image aliases;
- fuzzy text similarity;
- Markdown prose;
- generated routes.

Broken IDs fail validation rather than falling back to a similar-looking record.

## 11. Routes are presentation concerns

Structured data and authored internal links store stable IDs, not hash routes.

Current route construction:

- Gear: `#/inventory/item/{id}`
- KB: `#/kb/entity/{id}`
- Catch: `#/kb/catch/{id}`

Route ownership is explicit:

- `gear-app.js` owns all `#/inventory/...`
- `kb-app.js` owns Home and all `#/kb/...`

## 12. Storage symmetry is not a goal

- My Gear uses JSON seed + IndexedDB because it is local-first and intended for future editing.
- KB uses JSON catalog + Markdown because it is document-oriented and browse-only.
- Catch Log remains structured JSON until an editing feature justifies a writable repository/store.

A future feature may change persistence, but storage should not be changed merely to make domains look alike.

## 13. Media reconciliation

Media is separate from Gear facts.

### Remote/source media

- `media-sources.json` owns source/provenance/retrieval metadata.
- `media-owners.json` owns exact Gear stable-ID association.
- `media-ui.js` looks up exact owners and never performs fuzzy identity matching.

A setup component may use explicit `component: rod|reel` ownership.

### Repository-local media

PR #26 added:

- `local-media.json`
- `apply-local-media.mjs`

Repository-local images are validated for size, supported format structure/signature, and extension consistency, then copied into the production bundle. This was added after a malformed Kokanee WebP passed the earlier pipeline yet rendered blank.

### User-supplied binary transport rule

A separate reliability decision was made after repeated 2026-09-03 failures:

> **Do not transport user image binaries/base64 through ChatGPT→GitHub connector calls.**

Instead:

1. ChatGPT specifies exact branch/path/filename.
2. User uploads the binary directly to GitHub.
3. ChatGPT verifies the uploaded file.
4. ChatGPT updates text configuration, data, Markdown, tests, PR, and deployment.

This process rule prevents a known tool-transport failure mode without changing domain identity/ownership principles.

## 14. Validation rules

Current build/test validation includes:

- strict exact Gear record shapes;
- required non-empty data versions;
- legacy Gear field rejection;
- five-type KB enum and exact entity shapes;
- stable unique IDs;
- one registered Markdown Content path per KB entity;
- Catch type/category relationships;
- exactly one lure/bait per Catch;
- `gear://` and `kb://` target validation;
- registered relative KB links;
- exact Gear media owner IDs/component selectors;
- repository-local image validation;
- route ownership and retired-Planner regression tests;
- final-content regression tests for the 2026-09-04 batch.

## 15. Search/filter and UI principles

These are presentation conventions, not data-model changes:

- root My Gear and KB have Search;
- browse-list Search appears at **10+ entries**;
- if a page has Search and dropdown/filter, the filter is right-aligned;
- Line is a flat list while Rods & Reels remains grouped;
- My Gear stays browse-only until CRUD is explicitly resumed.

## 16. Current implementation/release status

Reconciliation design was accepted in PR #15 and implemented in PR #16. Subsequent production work preserved the same principles:

- PR #24 — flat Equipment peer type
- PR #26 — repository-local media hardening
- PR #27 — Recovery B Gear/browse/content updates
- PR #28 — final KB content/image batch and authored cross-links

Latest verified release:

- PR #28 exact tested head `c397985e99532b0ea572afd9910c0d131469a439`
- CI #120 / `33840154633` success
- merge `093139e5314af55691e608277b68b79b2d369166`
- production #121 / `33840208952` build + Pages deploy success

No current production requirement justifies reopening the core data-model architecture.

## 17. Future editing direction

My Gear CRUD remains deferred. When resumed:

- normal forms are the everyday edit path;
- validated JSON export/import can support backup/bulk editing;
- no raw JSON editor inside the PWA.

Future KB/Catch editing should add persistence only when the requested feature demonstrates the need. Do not redesign current schemas merely for hypothetical future synchronization.
