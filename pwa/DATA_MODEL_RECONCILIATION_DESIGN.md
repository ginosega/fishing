# Fishing Companion Data Model Reconciliation Design

**Status:** ACCEPTED / IMPLEMENTATION AUTHORIZED

**Accepted:** 2026-09-02

**Purpose:** Reconcile the My Gear, Knowledge Base, and Catch Log data models so they follow the same underlying architectural principles without forcing identical schemas, identical storage mechanisms, or speculative cross-entity relationship maintenance.

---

## 1. Background

Fishing Companion has three durable application-data domains:

1. **My Gear** — structured owned inventory and rod/reel setup data, seeded from JSON and stored locally in IndexedDB.
2. **Knowledge Base** — a structured entity catalog whose long-form Content is authored as complete Markdown documents.
3. **Catch Log** — structured historical catch records with explicit stable-ID relationships to KB entities and My Gear records.

The KB/Catch redesign established stronger rules around stable identity, strict schemas, explicit relationships where product behavior requires them, single ownership of facts, and avoidance of inference from prose or presentation text.

My Gear already has stable IDs and structured product facts, but it still carries several mechanisms inherited from the earlier Markdown-derived design:

- reusable `profiles.connections` and `profiles.usage` guidance;
- direct `usage`/`connections` blocks and profile references on Gear records;
- raw HTML guidance inside structured JSON;
- some raw internal KB routes inside that guidance;
- permissive structural validation compared with KB/Catch validation;
- product-media association inferred from rendered text and aliases rather than stable Gear identity;
- setup `mainLine` and `leader` display strings that are not needed by current product behavior.

This design removes those legacy seams before future My Gear editing/CRUD is implemented.

---

## 2. Core design decision

Architectural consistency means **shared rules**, not identical schemas.

The three domains may use different persistence and different record shapes, but they must agree on identity, ownership, validation, routing boundaries, and when a relationship deserves structured representation.

The central simplification accepted during review is:

> **Do not add a relationship to a schema merely because two entities are conceptually related. Store a structured relationship only when the relationship itself is a durable fact required by current application behavior. Otherwise, use authored Markdown links where useful.**

For the current product:

- Catch Log needs structured relationships because they drive historical meaning, backlinks, and future filtering/query behavior.
- My Gear does **not** need maintained Gear→Gear or Gear→KB relationships.
- My Gear instead gets one flexible Markdown-capable `notes` field.
- Notes may link to another Gear item or KB article by stable ID, but those links are authored navigation, not maintained domain relationships.

---

## 3. Shared architectural principles

### 3.1 Stable identity

Every independently referenceable durable entity has an immutable stable ID.

Examples:

- Gear item: `sufix-832-15`
- Gear setup: `setup-spinning`
- KB entity: `technique-ned-rig`
- Catch: `catch-2026-07-27-silver-lake-largemouth-01`

Names, labels, routes, Markdown paths, and display strings are not identities.

Embedded value objects that are not independently referenced do not need their own IDs. The rod and reel nested inside a Rods & Reels setup remain embedded value objects.

### 3.2 Structured relationships are feature-driven

When a structured relationship is required by product behavior, it uses a stable ID and is strictly validated.

Current examples are Catch Log relationships:

- Catch → Species
- Catch → Location
- Catch → Technique
- Catch → Rod/Reel setup
- Catch → Lure/Bait

My Gear does not introduce setup-line or related-knowledge relationships merely for normalization or potential future use.

### 3.3 Authored links are not domain relationships

Narrative Markdown can link to other application entities without creating a maintained relationship graph.

Accepted internal link conventions:

- `gear://stable-gear-id` → My Gear item/setup
- `kb://stable-kb-id` → Knowledge Base entity
- ordinary Markdown URLs → external websites
- registered relative Markdown links remain valid inside KB documents where already supported

Example Gear Notes:

```markdown
Works well with the [FG Knot](kb://knot-fg).

See my [spinning setup](gear://setup-spinning).
```

The renderer converts those IDs into current application routes. The author may add or omit these links pragmatically; there is no requirement to maintain exhaustive associations or reverse links.

### 3.4 One authoritative owner for each fact

**My Gear owns:**

- owned item/setup identity;
- manufacturer/model/part facts;
- product specifications;
- exact external links for the owned item;
- item/setup-specific Notes;
- ownership/display facts required by the My Gear UI.

**Knowledge Base owns:**

- reusable fishing knowledge;
- technique instructions;
- knot guidance;
- general rigging/selection/use guidance;
- species/location reference material.

**Catch Log owns:**

- historical catch facts;
- structured historical relationships to Gear and KB entities;
- catch-specific notes and provenance.

### 3.5 No identity inference from presentation

Application code must not discover Gear identity by comparing rendered names, headings, manufacturer/model strings, fuzzy aliases, or prose.

Presentation helpers may format known entities but may not create or guess domain identity.

### 3.6 Routes are presentation concerns

Structured data and authored internal-link schemes store IDs, not hash routes.

The router/renderer constructs current routes:

- My Gear: `#/inventory/item/{id}`
- KB: `#/kb/entity/{id}`
- Catch: `#/kb/catch/{id}`

### 3.7 Backlinks are computed only where useful

Catch backlinks remain computed from Catch-owned forward references.

No new Gear↔KB or Gear↔Gear backlink system is introduced. A Markdown link does not imply a reverse-link requirement.

### 3.8 Strict schemas, deliberate narrative flexibility

Each structured domain rejects unknown structural fields.

Flexibility is modeled deliberately:

- Gear product variation → labeled `specifications` list;
- Gear narrative → Markdown `notes`;
- KB long-form knowledge → complete Markdown `content` documents;
- Catch narrative → existing Markdown note fields.

### 3.9 Portable model is independent of storage

- My Gear remains JSON seed + IndexedDB because it is local-first and future-editable.
- KB remains JSON catalog + Markdown because it is authored/document-oriented and currently browse-only.
- Catch Log remains structured JSON until a future editing feature demonstrates a need for a writable repository.

Physical storage symmetry is not an architectural goal.

### 3.10 Presentation/media never owns Gear facts

Media metadata may identify its Gear owner by stable ID, but it does not own manufacturer/model/specification facts.

---

## 4. Accepted target architecture

### 4.1 My Gear

```text
pwa/data/gear.seed.json
        ↓
strict Gear schema validation
        ↓
IndexedDB local store
        ↓
GearRepository
        ↓
My Gear UI
```

My Gear is structured inventory plus a flexible Notes field. It is not a relationship graph or a second knowledge base.

### 4.2 Knowledge Base

```text
pwa/data/kb.seed.json
        ↓
strict KB schema validation
        ↓
registered complete Markdown documents
        ↓
KB rendering
```

No KB schema change is required for reconciliation.

### 4.3 Catch Log

```text
pwa/data/catches.seed.json
        ↓
strict Catch schema validation
        ↓
validated Gear + KB relationships
        ↓
Catch UI + computed backlinks
```

Catch Log remains the principal structured cross-domain relationship owner.

---

## 5. My Gear schema v2

### 5.1 Dataset envelope

```json
{
  "schemaVersion": 2,
  "dataVersion": "YYYY-MM-DD-my-gear-v2",
  "items": []
}
```

Changes from v1:

- remove top-level `profiles`;
- require and validate `dataVersion`;
- reject unknown structural fields.

### 5.2 Product item

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
    { "label": "Color", "value": "Hi-Vis Yellow" }
  ],
  "links": [],
  "notes": "Optional Markdown or null"
}
```

There is no `knowledgeRefs`, `connections`, `usage`, `connectionProfileId`, or `usageProfileId` in schema v2.

### 5.3 Rods & Reels setup

Rods & Reels remain first-class setup records because that is the accepted user-facing model and Catch Log references setups.

Representative shape:

```json
{
  "id": "setup-spinning",
  "category": "rods-reels",
  "type": "Spinning",
  "name": "Daiwa Tatula XT + Daiwa Exceler LT",
  "rod": {
    "manufacturer": { "name": "Daiwa", "url": "https://..." },
    "model": "Tatula XT",
    "specifications": [],
    "links": []
  },
  "reel": {
    "manufacturer": { "name": "Daiwa", "url": "https://..." },
    "model": "Exceler LT",
    "specifications": [],
    "links": []
  },
  "notes": "Optional Markdown or null"
}
```

The v1 `mainLine` and `leader` strings are removed as structured setup fields. If line configuration or a recommendation is worth recording, it belongs in Notes unless a future accepted feature demonstrates that the app itself needs a maintained structured relationship.

### 5.4 Notes

The existing user-facing **How to use it** section becomes **Notes**.

`notes` is Markdown-capable narrative intended for practical information that is useful on the specific Gear page.

It may contain:

- item-specific observations;
- concise usage guidance;
- setup reminders;
- product-specific instructions;
- links to external resources;
- `gear://...` links when another owned item is useful context;
- `kb://...` links when a KB article is useful context.

Notes are not required to model or maintain every conceptual relationship. They are intentionally lightweight authored content.

Raw HTML guidance blocks are not part of the Gear schema.

---

## 6. Retiring the Gear profiles model

The v1 `profiles.connections` and `profiles.usage` mechanism is removed.

The current profile system originally reduced duplicate generated guidance across Gear records. It now adds unnecessary indirection and creates a second place to maintain fishing knowledge.

During migration, effective profile/direct-guidance content must be reviewed semantically and handled as appropriate:

1. **Useful concise Gear-page material** → convert to Markdown Notes on the affected Gear item(s).
2. **Reusable knowledge that belongs in an existing KB article** → keep or merge into that KB article; Gear Notes may link to it when useful.
3. **Obsolete/redundant material** → remove.
4. **Unresolved conflicts** → preserve in the proper owner rather than silently resolving them.

Migration is not required to create a Gear→KB relationship record for every piece of reusable knowledge.

---

## 7. Internal Markdown links

### 7.1 Gear links

Existing convention remains:

```markdown
[My lure](gear://stable-gear-id)
```

### 7.2 KB links

Add the equivalent stable-ID convention:

```markdown
[Ned Rig](kb://technique-ned-rig)
```

This convention may be used in Gear Notes and anywhere else rendered by the shared safe Markdown renderer where internal KB navigation is appropriate.

### 7.3 Validation

Internal stable-ID links should fail build/test validation when their target ID does not exist.

This validation protects navigation integrity without elevating the link into a domain relationship or requiring reverse association maintenance.

---

## 8. Media reconciliation

The media-source/provenance manifest remains separate from Gear facts.

The accepted change is to replace fuzzy page-text/alias matching with explicit Gear ownership.

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

A shared image may list multiple Gear owners.

A setup component may specify:

```json
{ "gearItemId": "setup-spinning", "component": "rod" }
```

Initial valid component selectors are `rod` and `reel`.

The UI/media helper performs exact owner-ID lookup; it does not score aliases or inspect rendered page text to guess identity.

---

## 9. Validation design

### 9.1 Strict Gear record shapes

Schema v2 defines exact allowed fields for:

- ordinary product items;
- Rods & Reels setups;
- their embedded manufacturer/specification/link/value-object structures.

Unknown structural fields fail validation.

### 9.2 Required dataset versioning

`dataVersion` is required and non-empty.

### 9.3 Legacy-field rejection

Schema v2 rejects:

- top-level `profiles`;
- `usage`;
- `connections`;
- `usageProfileId`;
- `connectionProfileId`;
- setup `mainLine`;
- setup `leader`;
- speculative `configuration` relationship fields;
- `knowledgeRefs`.

### 9.4 Cross-domain validation

The build/test graph validation must continue to verify Catch relationships and authored links:

- Catch KB IDs resolve to the correct KB types;
- Catch Gear IDs resolve to the required Gear categories;
- every `gear://` link resolves to an existing Gear ID;
- every `kb://` link resolves to an existing KB ID;
- registered KB-document links resolve correctly;
- every media owner resolves to an existing Gear item;
- media component selectors are valid for the referenced Gear shape.

### 9.5 No fuzzy fallback

A broken ID fails validation rather than falling back to a similar name, alias, manufacturer/model string, or generated route.

---

## 10. Storage and migration

`GearRepository` and IndexedDB remain appropriate.

The production browser may already contain the schema-v1 seeded Gear bundle. Migration must therefore be deterministic.

Accepted migration behavior:

- validated seed-managed v1 data may be replaced by the bundled v2 seed when the seed `dataVersion` advances;
- existing stable Gear IDs are preserved;
- Catch records remain valid because referenced Gear setup/lure/bait IDs are not renamed;
- non-seed/imported local data must not be silently discarded if such data exists;
- no Add/Edit/Delete UI is introduced by this reconciliation.

A small read-only `KnowledgeRepository` may be introduced as a code-organization cleanup if useful, but it is optional and must not expand into a new storage/synchronization architecture.

---

## 11. Routing and UX

Existing routes remain unchanged.

My Gear leaf pages preserve their accepted product facts, links, media, and Catch History behavior.

The principal Gear-page content change is:

```text
How to use it  →  Notes
```

Notes render through the shared safe Markdown renderer.

There is no new Related Knowledge, Line Configuration, relationship-management, or backlink UI.

---

## 12. Implementation plan

### Phase 1 — migration inventory

Audit:

- every v1 profile;
- every direct `usage`/`connections` block;
- every profile reference;
- every setup `mainLine`/`leader` string;
- every raw internal route in Gear guidance;
- every media alias association.

### Phase 2 — content conversion

- convert retained Gear-page guidance to Markdown Notes;
- move/merge reusable KB content only where appropriate;
- replace useful internal route links with stable-ID Markdown links;
- preserve unresolved PowerBait and loop-knot conflicts rather than resolving them incidentally.

### Phase 3 — Gear schema v2

- set `schemaVersion: 2`;
- advance `dataVersion`;
- remove `profiles` and legacy guidance fields;
- remove setup `mainLine`/`leader` fields;
- add `notes` where needed;
- preserve stable IDs and reviewed product facts.

### Phase 4 — Markdown support

- render Gear Notes with the shared safe Markdown renderer;
- add `kb://stable-id` support alongside `gear://stable-id`;
- validate both target types.

### Phase 5 — strict model validation

- enforce exact Gear fields;
- require `dataVersion`;
- reject all legacy/speculative fields;
- retain existing category/type validation.

### Phase 6 — media identity

- add explicit Gear owner IDs/component selectors to media metadata;
- validate owners;
- remove fuzzy Gear-page alias matching.

### Phase 7 — regression and deployment

Before merge, the exact implementation PR head must pass:

- JavaScript syntax validation;
- structured My Gear model tests;
- My Gear routing/layout tests;
- unified KB model tests;
- KB routing/Markdown tests;
- new Notes/internal-link tests;
- new media-owner tests;
- build validation;
- bundle verification.

After merge, verify production build and GitHub Pages deployment before declaring the change live.

---

## 13. Accepted decisions

### Decision A — Common architecture principles

**ACCEPTED.** Use shared rules for identity, ownership, validation, routing separation, and feature-driven relationship modeling.

### Decision B — Remove Gear profiles

**ACCEPTED.** Remove the profile mechanism from Gear schema v2. Retained Gear-page narrative becomes Markdown Notes; reusable knowledge remains/lands in KB as appropriate.

### Former Decision C — Normalize setup line relationships

**REJECTED / REMOVED FROM TARGET DESIGN.** Do not create `mainLineItemId`, `leaderItemId`, or equivalent setup-line relationships. Record useful line/setup information in Notes when desired.

### Former Decision D — Add Gear → KB knowledge references

**REJECTED / REMOVED FROM TARGET DESIGN.** Do not create `knowledgeRefs` or an equivalent maintained relationship. Use authored `kb://stable-id` links in Notes when useful.

### Decision E — Markdown Notes in Gear

**ACCEPTED.** Replace the current How to use it presentation with a safe-Markdown Notes field. Notes may contain `gear://` and `kb://` internal links.

### Decision F — Keep embedded rod/reel components

**ACCEPTED.** Rods & Reels remain setup entities with embedded rod/reel value objects. Do not normalize components into separate first-class Gear records without a future functional requirement.

### Decision G — Explicit media ownership

**ACCEPTED.** Associate media with exact Gear IDs, optionally plus `component: rod|reel`; eliminate fuzzy rendered-text identity matching.

### Decision H — Keep storage mechanisms intentionally different

**ACCEPTED.** IndexedDB remains appropriate for local-first Gear; catalog + Markdown remains appropriate for browse-only KB.

### Decision I — Optional read-only KB repository layer

**ACCEPTED AS OPTIONAL.** It may be introduced if it materially simplifies data access, but it is not required for the data-model reconciliation and must remain lightweight.

---

## 14. Acceptance criteria

Implementation is complete when:

1. Gear schema v2 is documented and enforced.
2. Existing Gear stable IDs and reviewed product facts are preserved.
3. `profiles`, legacy guidance structures, setup line strings, and speculative relationship fields are absent from Gear v2.
4. My Gear leaf pages present Markdown **Notes** instead of **How to use it**.
5. Notes can navigate by `gear://` and `kb://` stable IDs.
6. Internal links are validated without being treated as maintained relationships.
7. Catch Log remains the owner of structured historical Gear/KB relationships.
8. Gear rejects unknown structural fields.
9. Media association uses explicit Gear identity rather than alias/text matching.
10. KB remains complete authored Markdown and is not fragmented for symmetry.
11. My Gear remains local-first without adding CRUD/import/export UI.
12. Catch relationships/backlinks continue to work unchanged.
13. All required tests pass on the exact PR head.
14. Production build and GitHub Pages deployment are verified after merge.

---

## 15. Resulting conceptual model

```text
MY GEAR
Structured owned facts
+ Markdown Notes
+ optional authored internal links
        │
        │ referenced by stable ID when a Catch needs it
        ▼
CATCH LOG
Structured historical facts
+ maintained stable-ID relationships
        │
        │ references KB by stable ID
        ▼
KNOWLEDGE BASE
Stable entity catalog
+ complete authored Markdown knowledge
```

Fishing Companion therefore has **different domain models with one set of architectural principles**, while avoiding speculative relationship maintenance.