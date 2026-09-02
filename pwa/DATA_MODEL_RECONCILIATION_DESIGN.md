# Fishing Companion Data Model Reconciliation Design

**Status:** PROPOSED / REVIEW REQUIRED / NOT IMPLEMENTED

**Updated:** 2026-09-02

**Purpose:** Reconcile the existing My Gear, Knowledge Base, and Catch Log data models so they follow the same underlying architectural principles without forcing identical schemas or identical storage mechanisms.

**Implementation gate:** This document is a design proposal only. Do not change the My Gear schema, Knowledge Base schema, Catch Log schema, runtime behavior, routing, or production data until the user has reviewed and accepted the design or requested revisions.

---

## 1. Background

Fishing Companion currently has three durable kinds of application data:

1. **My Gear** — structured owned inventory/configuration data with a JSON seed and an IndexedDB-backed local repository.
2. **Knowledge Base** — a structured entity catalog whose long-form Content is authored as complete Markdown documents.
3. **Catch Log** — structured historical catch records with explicit stable-ID relationships to Knowledge Base entities and My Gear records.

The Knowledge Base and Catch Log were redesigned on 2026-09-02 after My Gear had already been refactored away from Markdown-table parsing. The KB redesign established stronger architectural rules around stable identities, explicit relationships, strict schemas, single ownership of facts, and avoidance of inference from prose.

My Gear already follows several of those principles, but it still carries some structures inherited from the earlier Markdown-derived architecture:

- setup line assignments are stored as display strings rather than My Gear IDs;
- reusable usage and connection guidance is stored inside My Gear `profiles` even when the same subject is now owned by the Knowledge Base;
- some internal KB navigation is embedded as raw `#/...` route strings inside Gear guidance;
- the Gear schema validates known fields but does not reject every unknown structural field;
- product-media association is inferred from rendered text and aliases even though stable Gear IDs now exist.

This proposal removes those remaining inconsistencies before future My Gear editing/CRUD is implemented.

The goal is **architectural reconciliation**, not schema homogenization. Gear, knowledge, and catches are different domain objects and should retain different shapes where their domain requirements differ.

---

## 2. Design objective

Fishing Companion should behave as one coherent data system with three domain owners:

```text
                    Fishing Companion data graph

        ┌────────────────────┐
        │      My Gear       │
        │ owned items/setup  │
        └─────────┬──────────┘
                  │ stable IDs
                  │
        ┌─────────▼──────────┐
        │     Catch Log      │
        │ historical events │
        └─────────┬──────────┘
                  │ stable IDs
                  │
        ┌─────────▼──────────┐
        │  Knowledge Base    │
        │ reusable knowledge│
        └────────────────────┘
```

The three domains should follow the same rules for:

- identity;
- ownership;
- relationships;
- validation;
- portability;
- routing separation;
- presentation separation;
- backlink computation;
- migration safety.

They do **not** need to use the same physical store or the same field set.

---

## 3. Shared architectural principles

These principles become the proposed common foundation for Fishing Companion data.

### 3.1 Stable entity identity

Every independently referenceable durable entity has an immutable stable ID.

Examples:

- My Gear item: `sufix-832-15`
- My Gear setup: `setup-spinning`
- KB entity: `technique-ned-rig`
- Catch: `catch-2026-07-27-silver-lake-largemouth-01`

Names, descriptions, manufacturer/model text, file paths, and UI routes may change without changing identity.

Embedded **value objects** that are not independently referenced do not require their own IDs. For example, the rod and reel objects nested inside a first-class Rods & Reels setup may remain embedded value objects unless a future requirement needs independent rod/reel identity.

### 3.2 Explicit structured relationships use stable IDs

Whenever one structured record refers to another durable entity, it stores the target stable ID.

Do not use as foreign keys:

- display names;
- manufacturer/model strings;
- filenames;
- rendered text;
- URL fragments;
- hash routes;
- fuzzy aliases.

Examples:

- a setup's installed main line should reference `sufix-832-15`, not `Sufix 832 15 lb Hi-Vis Yellow braid`;
- a Catch references `species-largemouth-bass`, not `Largemouth Bass`;
- My Gear references reusable KB knowledge by KB entity ID, not by `#/kb/...` route.

### 3.3 Narrative links are not structured relationships

The stable-ID rule above applies to structured relationships.

Authored Markdown Content may continue to contain normal authoring-friendly links. The current KB convention remains valid:

- ordinary external Markdown links for websites;
- repository-relative Markdown links between registered KB documents;
- `gear://stable-gear-id` for explicit links from KB Content to My Gear.

The build must validate these links and resolve registered KB document links to stable KB entities at runtime.

This preserves readable GitHub Markdown authoring without treating a file path as a domain foreign key.

### 3.4 One authoritative owner for each fact

A fact should have one durable owner.

**My Gear owns:**

- what equipment/tackle/bait is owned;
- manufacturer/model/part identity;
- product specifications;
- external manufacturer/retailer/resource links that describe that exact item;
- user-specific setup configuration;
- item-specific or model-specific notes;
- explicit relationships to other owned gear;
- explicit links to relevant reusable knowledge.

**Knowledge Base owns:**

- reusable fishing knowledge;
- technique instructions;
- generic rigging guidance;
- generic knot guidance;
- general line/leader usage guidance;
- location/species reference material;
- reusable warnings/resources/notes.

**Catch Log owns:**

- historical catch date/time/size;
- historical species/location relationships;
- recorded setup/technique relationships;
- exact lure-or-bait relationship;
- catch-specific observations and provenance.

No domain should maintain a duplicate catch-ID list. Catch backlinks remain computed.

### 3.5 No identity or relationship inference from presentation

Application code must not discover domain identity by inspecting rendered labels, page headings, normalized manufacturer/model text, aliases, or prose.

Presentation helpers may format known records, but they may not create or guess relationships.

### 3.6 Routes are presentation concerns

Structured data stores stable IDs, not UI routes.

The renderer/router converts IDs into the current route form:

- My Gear: `#/inventory/item/{id}`
- KB: `#/kb/entity/{id}`
- Catch Log: `#/kb/catch/{id}`

Changing a route in the future should not require rewriting domain data.

### 3.7 Backlinks are computed from relationship owners

The record that owns the relationship stores the forward reference. Reverse navigation is computed.

Examples:

- Catch stores `locationId`; the Location page computes matching catches.
- Catch stores `lureOrBait.itemId`; the Lure page computes matching catches.
- A setup stores `mainLineItemId`; a future Line page could compute setup backlinks if desired without storing duplicate setup IDs on the Line record.

### 3.8 Strict schemas, explicit flexibility

Each domain schema should reject unknown structural fields.

Flexibility should be deliberately modeled, not achieved by silently accepting arbitrary properties.

Examples of deliberate flexibility:

- Gear specifications remain a labeled list because products vary widely;
- KB Content remains Markdown because long-form knowledge varies widely;
- Catch `notes` and `exactSpotNotes` remain Markdown narrative fields.

### 3.9 Portable model is independent of runtime storage

A domain model is not defined by where it happens to be stored.

- My Gear may remain JSON seed + IndexedDB because it is local-first and intended to become editable.
- KB may remain JSON catalog + authored Markdown because it is currently browse-only and document-oriented.
- Catch Log may remain structured JSON until catch entry/editing requires a writable repository.

Architectural consistency does not require putting every domain into IndexedDB.

### 3.10 Presentation/media never owns domain facts

Images, cached media, video-title enhancement, zoom state, and display formatting remain presentation concerns.

Media metadata may reference a stable domain owner, but it may not become the source of truth for manufacturer/model/specifications or other gear facts.

---

## 4. Current-state reconciliation findings

### 4.1 What is already consistent

The current implementation already has a strong shared foundation:

- My Gear, KB entities, and catches all have stable IDs.
- My Gear no longer parses Markdown inventory tables.
- KB entity identity is not inferred from Markdown headings or prose.
- Catch relationships are explicit and validated.
- Catch backlinks are computed rather than stored redundantly.
- My Gear and KB have explicit route ownership boundaries.
- `gear://stable-id` gives authored KB content an explicit bridge to My Gear.
- `GearRepository` separates My Gear storage from My Gear rendering.
- media code is presentation-only and does not mutate My Gear facts.

### 4.2 Remaining My Gear inconsistencies

The principal remaining issues are:

1. **Setup line relationships are strings.**
   - `setup-spinning.mainLine` duplicates the identity of `sufix-832-15` as text.
   - `setup-spinning.leader` duplicates the identity of `seaguar-invizx-8` as text.
   - the baitcasting setup has the same problem.

2. **`profiles.connections` and `profiles.usage` own reusable knowledge.**
   - much of this material overlaps KB Techniques and Knots;
   - this creates two possible owners for the same guidance.

3. **Raw KB routes appear in Gear content.**
   - structured Gear should not store `#/kb/...` navigation strings.

4. **Gear schema validation is less strict than KB validation.**
   - known fields are validated, but unexpected fields are not universally rejected;
   - current setup-only fields such as `mainLine` and `leader` are not strongly validated as relationships.

5. **Gear media association still uses fuzzy presentation identity.**
   - `media-sources.json` contains aliases;
   - `media-ui.js` compares normalized rendered text against aliases to decide which image belongs to a page.

These are the targets of this reconciliation.

---

## 5. Non-goals

This project intentionally does **not** include the following unless separately reopened:

- building My Gear Add/Edit/Delete forms;
- exposing JSON import/export in the current UI;
- adding an in-app JSON editor;
- redesigning the accepted My Gear navigation or category hierarchy merely for visual consistency;
- changing the accepted unified KB Entity schema without a demonstrated need;
- putting the KB into IndexedDB solely for symmetry;
- replacing Markdown KB Content with atomic structured technique fields;
- reintroducing Planner, Planner Attributes, sessions, Session ID, or trip history;
- inferring historical setup or technique on existing catches;
- making rod and reel components separate first-class entities solely for normalization aesthetics;
- changing existing stable IDs merely to impose a new naming convention;
- generalizing Fishing Companion into a multi-user application.

---

## 6. Proposed target domain architecture

### 6.1 My Gear

```text
pwa/data/gear.seed.json
        ↓
strict Gear schema validation
        ↓
explicit relationship validation
        ↓
IndexedDB local store
        ↓
GearRepository
        ↓
My Gear UI
```

The portable Gear bundle remains the baseline representation. IndexedDB remains the live local store.

The proposed change is primarily **schema cleanup and relationship normalization**, not a storage change.

### 6.2 Knowledge Base

```text
pwa/data/kb.seed.json
        ↓
strict KB schema validation
        ↓
registered complete Markdown documents
        ↓
validated explicit authored links
        ↓
KB rendering
```

No KB schema change is required merely to reconcile it with My Gear.

Some KB Content will likely be updated because reusable material currently duplicated in My Gear profiles should have a single KB owner.

### 6.3 Catch Log

```text
pwa/data/catches.seed.json
        ↓
strict Catch schema validation
        ↓
validated Gear + KB relationships
        ↓
Catch UI + computed backlinks
```

No Catch schema change is currently required.

### 6.4 Cross-domain validation

The build should treat the three datasets as one validated graph after each individual domain passes its own shape validation.

Conceptually:

```text
validateGearBundle(gear)
validateKbBundle(kb)
validateCatchBundle(catches)
             ↓
validateFishingRelationships({ gear, kb, catches, media })
```

The exact function/file organization can be chosen during implementation. The important design rule is to distinguish:

- **domain shape validation**, and
- **cross-domain relationship validation**.

This avoids making one domain's schema validator responsible for another domain's implementation details.

---

## 7. Proposed My Gear schema v2

### 7.1 Dataset envelope

Proposed portable form:

```json
{
  "schemaVersion": 2,
  "dataVersion": "YYYY-MM-DD-my-gear-v2",
  "items": []
}
```

The v1 top-level `profiles` object is removed after its content is classified and migrated.

`dataVersion` becomes required and validated.

### 7.2 Stable IDs

Existing stable Gear IDs should normally be preserved exactly.

Do not rename records merely to add category prefixes or make IDs cosmetically resemble KB IDs. Existing IDs are already referenced by catches and potentially by KB Content.

A stable-ID rename is a data migration and should occur only when the identity itself is wrong, not because a different naming style would look cleaner.

### 7.3 Product-item shape

A normal non-setup Gear record would continue to use the current structured product facts, with two proposed additions:

- optional item-specific `notes`;
- optional structured `knowledgeRefs`.

Representative shape:

```json
{
  "id": "sufix-832-15",
  "category": "line",
  "type": "Braided",
  "name": "Sufix 832",
  "manufacturer": {
    "name": "Sufix",
    "url": "https://..."
  },
  "model": "832 Advanced Superline",
  "specifications": [
    { "label": "Strength", "value": "15 lb" },
    { "label": "Color", "value": "Hi-Vis Yellow" },
    { "label": "Length", "value": "300 yd" },
    { "label": "Part", "value": "660-115Y" }
  ],
  "links": [],
  "knowledgeRefs": {
    "connections": [
      "knot-fg",
      "knot-albright"
    ],
    "usage": []
  },
  "notes": null
}
```

This is illustrative, not an approved final mapping of Sufix knowledge references.

### 7.4 Rods & Reels setup shape

Rods & Reels remain first-class **setup records** because that is the accepted user-facing My Gear concept and the Catch Log references setups.

The embedded rod and reel remain value objects for now.

Representative shape:

```json
{
  "id": "setup-spinning",
  "category": "rods-reels",
  "type": "Spinning",
  "name": "Daiwa Tatula XT + Daiwa Exceler LT",
  "rod": {
    "manufacturer": {
      "name": "Daiwa",
      "url": "https://..."
    },
    "model": "Tatula XT",
    "specifications": [],
    "links": []
  },
  "reel": {
    "manufacturer": {
      "name": "Daiwa",
      "url": "https://..."
    },
    "model": "Exceler LT",
    "specifications": [],
    "links": []
  },
  "configuration": {
    "mainLineItemId": "sufix-832-15",
    "leaderItemId": "seaguar-invizx-8"
  },
  "knowledgeRefs": {
    "connections": [],
    "usage": []
  },
  "notes": "Primary light/finesse/Jacob-friendly setup."
}
```

The exact wording and whether a setup needs any `knowledgeRefs` at all should be determined during content migration, not assumed from this example.

### 7.5 Setup configuration relationships

For known installed/current owned relationships:

```json
{
  "mainLineItemId": "sufix-832-15",
  "leaderItemId": "seaguar-invizx-8"
}
```

Rules:

- IDs must resolve to My Gear records in category `line`.
- `mainLineItemId` may be null when not known.
- `leaderItemId` may be null when no leader is used or the current leader is unknown.
- a recommendation is **not** automatically a relationship.

Example: the Pflueger spincast setup currently has a recommendation for 6 lb monofilament, but no durable owned 6 lb mono item is established. That should remain an item-specific recommendation/note until an actual owned line record is confirmed; the model must not invent a `mainLineItemId`.

### 7.6 Knowledge references

Proposed Gear-to-KB bridge:

```json
{
  "knowledgeRefs": {
    "connections": ["knot-palomar"],
    "usage": ["technique-crankbait"]
  }
}
```

Rules:

- all values are KB stable IDs;
- every target must exist;
- `connections` normally points to Knot entities, but may point to a Technique when the reusable connection/rigging guidance genuinely belongs there;
- `usage` normally points to Technique entities;
- the renderer constructs KB routes from the ID;
- no raw `#/kb/...` strings are stored in Gear data.

The two groups are intentionally small and user-facing. They preserve the useful conceptual distinction of the current Gear page sections without preserving embedded duplicate guidance.

If review determines that two categories are unnecessary, this can be simplified before implementation to one `relatedKnowledgeIds` array. The final choice should favor the least structure needed by the accepted UI.

### 7.7 Item-specific notes

Gear may retain narrative that truly belongs to the owned item or setup.

Examples that can remain Gear-owned:

- the user's role for a particular rod/reel setup;
- a product-specific rigging detail unique to that lure;
- a manufacturer/model-specific setup instruction;
- a note that a particular product is shared with Jacob;
- a unique maintenance instruction for a reel;
- a recommendation specific to the user's owned spincast setup.

Proposed representation:

```json
{
  "notes": "Markdown-capable item-specific note or null."
}
```

If Markdown is allowed here, it should use the same safe Markdown renderer as other narrative application content rather than storing raw HTML fragments in JSON.

The schema should not retain arbitrary `html` guidance blocks.

---

## 8. Removing the current Gear `profiles` model

### 8.1 Why profiles should not remain the general knowledge owner

The current `profiles.connections` and `profiles.usage` solved an earlier problem: avoid duplicating the same generated guidance across many Gear records.

After the KB redesign, however, many of those profiles are no longer merely deduplicated Gear display fragments. They are reusable fishing knowledge that properly belongs in Techniques and Knots.

Keeping both creates:

- duplicate owners;
- inconsistent updates;
- unresolved-conflict duplication;
- raw HTML inside structured Gear data;
- internal route coupling;
- future CRUD complexity.

### 8.2 Profile migration classification

Every current profile must be reviewed and classified into one of four buckets:

1. **KB-owned reusable knowledge**
   - move/merge into an existing KB document;
   - create a new KB entity only when a durable standalone subject is genuinely warranted.

2. **Gear-owned item/setup-specific note**
   - move onto the relevant Gear record as `notes` or an exact external resource link.

3. **Gear → KB relationship**
   - replace the embedded prose with a `knowledgeRefs` stable-ID link.

4. **Obsolete/redundant content**
   - remove after confirming the authoritative owner already contains the needed information.

### 8.3 Do not mechanically copy profile text into KB

Migration should be semantic, not a bulk text relocation.

Before moving profile content:

- compare it with the existing target KB document;
- preserve user-verified facts and unresolved conflicts;
- avoid duplicate paragraphs;
- preserve current evidence/status meaning;
- use the KB's authored structure rather than recreating Profile headings mechanically.

---

## 9. Cross-domain relationship ownership

This section defines who stores each forward relationship.

| Relationship | Owner | Stored form |
|---|---|---|
| Catch → Species | Catch | `speciesId` |
| Catch → Location | Catch | `locationId` |
| Catch → Technique | Catch | `techniqueId` |
| Catch → Rod/Reel setup | Catch | `rodReelSetupId` |
| Catch → Lure/Bait | Catch | `lureOrBait.itemId` |
| Setup → Main line | Setup | `configuration.mainLineItemId` |
| Setup → Leader | Setup | `configuration.leaderItemId` |
| Gear → reusable knowledge | Gear | `knowledgeRefs` KB IDs |
| KB authored prose → Gear | KB Content | explicit `gear://stable-id` link |
| KB authored prose → KB | KB Content | registered relative Markdown link |
| Media → Gear owner | Media metadata | explicit Gear item ID/component selector |

Reverse relationships are computed when/if the UI needs them.

### 9.1 Bidirectional navigation does not require duplicate semantic ownership

A KB Technique can contain an authored inline `gear://...` link while a Gear record also has a `knowledgeRefs.usage` link to that Technique.

These should not be interpreted as two copies of one database foreign key. They are two independently authored navigation choices serving different reading contexts:

- the Gear page says, “Here is reusable knowledge relevant to this item”;
- the KB prose says, “Here is a specific owned item relevant at this point in the explanation.”

Neither should be auto-created through fuzzy matching.

---

## 10. Media reconciliation

### 10.1 Current issue

Gear product images are sourced separately from `gear.seed.json`, which is a sound separation of concerns.

The remaining problem is association: the presentation layer currently infers which media record applies by comparing rendered page text with aliases.

Once stable Gear IDs exist, that inference is unnecessary.

### 10.2 Proposed explicit owner association

The build-time media manifest should explicitly identify its Gear owner(s).

Representative ordinary item:

```json
{
  "id": "sufix-832-media",
  "owners": [
    { "gearItemId": "sufix-832-15" }
  ],
  "sourcePage": "https://...",
  "imageSource": "https://...",
  "destination": "https://...",
  "alt": "Sufix 832 Advanced Superline"
}
```

A product image shared by multiple variants may list multiple owners:

```json
{
  "owners": [
    { "gearItemId": "seaguar-invizx-8" },
    { "gearItemId": "seaguar-invizx-12" }
  ]
}
```

A Rods & Reels setup component can use an explicit component selector:

```json
{
  "owners": [
    { "gearItemId": "setup-spinning", "component": "rod" }
  ]
}
```

Allowed component values should be strictly validated, initially `rod` or `reel`.

### 10.3 Media remains presentation data

The media manifest continues to own:

- source page;
- image source URL;
- cached asset generation metadata;
- alternate text;
- image destination.

It does **not** own:

- Gear name;
- manufacturer/model;
- specifications;
- ownership status;
- relationships.

The Gear UI should emit stable owner identity into the DOM or call a media helper with stable identity directly. `media-ui.js` should perform an exact lookup, not score text aliases.

---

## 11. Validation design

### 11.1 Strict Gear fields

Gear schema v2 should define exact allowed fields for each discriminated record shape.

Unknown fields should fail validation.

For example, a product item should not silently accept an accidental `mainLine` property, and a setup should not silently accept arbitrary undeclared relationship fields.

### 11.2 Category/type validation

Existing Gear categories remain:

- `rods-reels`
- `line`
- `weights`
- `snaps-swivels`
- `hooks`
- `lures`
- `bait`

`type` remains the user-facing subcategory/type field. Category-specific UI behavior can continue to use it.

There is no requirement to create separate JavaScript classes for every category.

### 11.3 Relationship validation

Cross-domain validation should verify at build/test time:

- setup `mainLineItemId` exists and is category `line`;
- setup `leaderItemId` exists and is category `line`;
- every Gear `knowledgeRefs` ID exists in the KB;
- every Catch KB ID exists and has the required KB type;
- every Catch Gear ID exists and has the required Gear category;
- every `gear://` Content link references an existing Gear ID;
- every registered KB Markdown link resolves to an existing KB entity;
- every media owner references an existing Gear item;
- media component selectors are valid for the target Gear shape.

### 11.4 No fuzzy fallback

A broken relationship should fail validation rather than silently fall back to:

- a matching name;
- a matching alias;
- a similar manufacturer/model;
- a generated route;
- the first record with similar text.

The failure should identify the source record and missing target ID.

---

## 12. Storage and repository design

### 12.1 GearRepository remains appropriate

My Gear is intentionally local-first and future-editable, so the existing repository boundary remains a good architectural choice.

The repository should continue to expose domain data rather than storage implementation details.

### 12.2 KB does not need IndexedDB for symmetry

The current read-only KB can remain seed/document-backed.

Putting KB documents into IndexedDB merely to resemble My Gear would add complexity without improving the domain model.

### 12.3 Optional read-only KnowledgeRepository cleanup

A future implementation may introduce a small `KnowledgeRepository` or equivalent data-access layer that encapsulates:

- loading `kb.seed.json`;
- validation;
- entity lookup;
- Content loading/caching;
- Catch bundle loading or delegated Catch access.

This would make `kb-app.js` less responsible for raw fetching and more closely match the clean repository boundary already used by My Gear.

This is a **code-organization improvement**, not a prerequisite for accepting the data-model reconciliation.

It should not expand into a new database or synchronization architecture.

---

## 13. Routing and rendering

Existing route ownership remains unchanged:

**My Gear owns:**

```text
#/inventory
#/inventory/{category}
#/inventory/item/{stable-id}
```

**Knowledge Base owns:**

```text
#/home
#/kb
#/kb/locations
#/kb/species
#/kb/techniques
#/kb/knots
#/kb/entity/{stable-id}
#/kb/catches
#/kb/catch/{stable-id}
```

The reconciliation must not reintroduce competing routers.

### 13.1 Gear related-knowledge rendering

A Gear page with KB references should render links generated from stable IDs.

Possible user-facing grouping:

```text
Knots & connections
  Palomar Knot
  FG Knot

How to use it
  Ned Rig
  Drop Shot
```

The actual headings may remain consistent with the accepted My Gear UI where sensible.

The content of those KB entries is not copied into the Gear record.

### 13.2 Item-specific notes rendering

If `notes` is adopted as Markdown, render through the shared safe Markdown renderer.

Do not store or directly inject arbitrary raw HTML from Gear JSON.

---

## 14. Migration plan

No implementation occurs until this design is accepted.

After acceptance, the recommended migration is staged.

### Phase 1 — inventory and mapping audit

Create an explicit migration worksheet/list covering:

- every Gear v1 profile;
- every direct Gear `usage`/`connections` block;
- every setup `mainLine`/`leader` string;
- every raw internal `#/kb/...` link in Gear data;
- every media-source alias mapping.

Classify each item according to the target ownership rules before editing runtime data.

### Phase 2 — KB ownership cleanup

For reusable Gear guidance:

- identify the existing KB owner;
- merge missing content into that complete KB document;
- preserve conflicts such as loop-knot and PowerBait guidance rather than silently resolving them;
- create a new KB entity only if the subject does not fit an existing entity and deserves durable standalone treatment.

### Phase 3 — Gear schema v2 seed

Transform `gear.seed.json`:

- increment `schemaVersion` to `2`;
- update `dataVersion`;
- remove `profiles`;
- remove direct `usage`/`connections` HTML structures;
- convert setup line strings to exact IDs where ownership/current configuration is established;
- preserve unowned recommendations as notes rather than fake relationships;
- add only reviewed `knowledgeRefs`;
- move genuinely item-specific material into `notes` or exact external links.

### Phase 4 — strict validators and graph validation

Update tests and model code so the exact final schema is enforced.

Add cross-domain tests for all new relationships.

### Phase 5 — media explicit ownership

Replace alias-based page identity matching with explicit Gear owner IDs/component selectors.

The build must verify all media owners.

### Phase 6 — Gear repository migration

The production browser may already contain schema-v1 Gear data in IndexedDB.

Migration behavior must be explicit.

At minimum:

- seed-managed v1 stores may be replaced with the validated v2 bundled seed;
- non-seed/imported local data must not be silently discarded;
- if a non-seed v1 bundle can exist, provide a deterministic v1→v2 migration or a clearly handled compatibility path.

The fact that the current v1 UI exposes no editing/import controls lowers practical risk, but migration logic should still be deliberate.

### Phase 7 — UI integration

Update My Gear rendering to:

- display setup configuration from stable relationships;
- render related KB links from IDs;
- render item-specific Markdown notes safely;
- preserve accepted category/leaf routing and catch history behavior.

### Phase 8 — regression and production verification

Use the normal feature branch / PR workflow.

Before merge, the exact final head must pass:

- JavaScript syntax validation;
- Gear schema tests;
- cross-domain relationship tests;
- KB/Catch tests;
- routing/layout tests;
- build validation;
- bundle verification.

After merge, verify both production build and GitHub Pages deployment before declaring the change live.

---

## 15. Compatibility and data-preservation rules

### 15.1 Preserve stable IDs

Existing Gear, KB, and Catch IDs are durable integration points.

Do not rename them for stylistic consistency.

### 15.2 Preserve accepted My Gear facts

Schema migration must not re-research or reconstruct reviewed manufacturer/model/specification/link facts from older Markdown.

The current structured seed remains the source for existing Gear facts during conversion.

### 15.3 Preserve Catch history exactly

Existing catches remain unchanged unless a migration is mechanically required by a renamed target—which this design intentionally avoids.

Do not infer historical setup or technique.

### 15.4 Preserve unresolved conflicts

The reconciliation is not authority to resolve unrelated content conflicts.

In particular, preserve:

- PowerBait hook-size conflict;
- loop-knot conflict.

Move them to the correct knowledge owner if necessary, but do not silently choose a side.

---

## 16. Testing requirements

The implementation should add tests beyond the current record-count and critical-field cases.

### 16.1 Gear shape tests

Verify:

- exact allowed fields;
- required `dataVersion`;
- no `profiles` in schema v2;
- no legacy `usage`, `connections`, `usageProfileId`, or `connectionProfileId` fields;
- setup `configuration` shape;
- valid product item shape;
- invalid extra property rejection.

### 16.2 Gear relationship tests

Verify:

- known setup main-line IDs;
- known setup leader IDs;
- wrong-category target rejection;
- missing Gear target rejection;
- missing KB target rejection;
- inappropriate knowledge target/type where restricted.

### 16.3 Legacy-route tests

Ensure Gear seed/data contains no structured raw `#/kb/...` relationship strings.

### 16.4 Media tests

Verify:

- every media owner resolves to Gear;
- component values are valid;
- media lookup works by exact owner identity;
- alias/text matching is not required for Gear page association.

### 16.5 Cross-domain graph tests

Build/test validation should load all three datasets together and prove that every structured relationship is resolvable.

### 16.6 Regression tests

Preserve current accepted behavior:

- category cards open correctly;
- gear leaf pages remain reachable;
- KB routes remain independent;
- Catch backlinks still work;
- manufacturer/retailer links remain correct;
- images remain presentation-only;
- no My Gear data/import/export card returns;
- no CRUD UI is accidentally introduced.

---

## 17. Proposed decisions requiring user review

The design is intentionally explicit about the decisions that should be accepted or revised before implementation.

### Decision A — Adopt common architecture principles

Proposed: accept Sections 3 and 9 as the durable cross-domain rules for Fishing Companion.

### Decision B — Remove Gear `profiles`

Proposed: migrate reusable knowledge to the KB, item-specific material to Gear notes/resources, and delete the profile mechanism from Gear schema v2.

### Decision C — Normalize setup line relationships

Proposed: use stable My Gear IDs for known current main-line and leader relationships; keep recommendations as narrative when the target is not an established owned Gear record.

### Decision D — Add Gear → KB stable knowledge references

Proposed shape:

```json
"knowledgeRefs": {
  "connections": [],
  "usage": []
}
```

Review question: keep the two semantic groups, or simplify to a single related-KB-ID list?

### Decision E — Permit item-specific Markdown notes in Gear

Proposed: one optional safe-Markdown `notes` field for content that truly belongs to the specific owned item/setup; no raw HTML guidance blocks.

### Decision F — Keep embedded rod/reel components

Proposed: Rods & Reels remain setup entities with embedded rod/reel value objects. Do not normalize rods and reels into separate first-class Gear records unless a future functional requirement needs that identity.

### Decision G — Replace media alias matching with explicit Gear ownership

Proposed: media manifest stores exact Gear owner IDs, optionally plus `component: rod|reel`; presentation code performs exact lookup.

### Decision H — Keep storage mechanisms intentionally different

Proposed: retain IndexedDB for Gear; retain catalog + Markdown for browse-only KB; do not use physical storage symmetry as an architectural goal.

### Decision I — Optional KB repository layer

Proposed: treat a read-only `KnowledgeRepository` as a code-organization improvement that may be implemented with the reconciliation if it remains small, but do not make it a prerequisite for the data model itself.

---

## 18. Acceptance criteria for the eventual implementation

The reconciliation is complete when all of the following are true:

1. My Gear, KB, and Catch schemas have documented, non-overlapping fact ownership.
2. Every structured cross-record relationship uses a stable ID.
3. No setup line assignment duplicates an existing Gear entity merely as display text.
4. Gear no longer owns generic reusable knot/technique knowledge in profiles.
5. Gear data contains no raw UI routes as structured relationships.
6. Gear schema rejects unknown structural fields.
7. Gear item-specific narrative uses a safe shared narrative format rather than raw HTML blocks.
8. Media association uses explicit Gear identity rather than rendered-text matching.
9. Catch Log relationships and backlinks continue to work without inferred history.
10. KB Content remains complete authored Markdown and is not broken into unnecessary atomic fields.
11. My Gear remains local-first and future-editable without adding CRUD in this project.
12. Existing stable IDs and reviewed Gear facts are preserved.
13. All domain and cross-domain tests pass on the exact PR head.
14. Production build and GitHub Pages deployment are verified after merge.

---

## 19. Resulting conceptual model

If accepted, Fishing Companion will have three different schemas that share one architecture:

```text
MY GEAR
Structured owned facts
+ user-specific configuration
+ item-specific notes
+ stable refs to owned gear / KB
        │
        │ IDs
        ▼
CATCH LOG
Structured historical facts
+ exact stable relationships
        │
        │ IDs
        ▼
KNOWLEDGE BASE
Stable entity index
+ complete authored Markdown knowledge
```

The design deliberately avoids two opposite mistakes:

- forcing all three domains into one universal schema; and
- allowing each domain to invent incompatible rules for identity, relationships, ownership, or validation.

The desired result is **different domain models, one set of architectural principles**.

---

## 20. Review status

**No implementation has been authorized by this document.**

After user review, this document should be revised until the decisions above are accepted. Only then should an implementation branch update the Gear schema, data, KB content, media associations, validators, tests, and runtime code.
