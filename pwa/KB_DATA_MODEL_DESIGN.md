# Fishing Companion Knowledge Base Data Model

**Status:** Draft for user review — architecture and migration plan only. No application implementation or production change is included in this document.

**Prepared:** 2026-09-02

## 1. Accepted product direction

Fishing Companion has two distinct domains:

- **My Gear** remains the structured local-first inventory backed by `pwa/data/gear.seed.json` and IndexedDB.
- **Knowledge Base** becomes a browse-only information repository backed by explicit structured records plus authored Markdown or linked long-form content.

The Knowledge Base is not a planner or recommendation engine. It will not assemble fishing plans, infer recommendations from prose, score catch similarity, or require planner-only season/depth/structure attributes.

The user-facing Knowledge Base sections are:

1. Locations
2. Species
3. Techniques
4. Knots
5. Catch Log

The current v1 redesign is browse-only and seed-managed. Add/Edit/Delete forms, including a future **Record a catch** form, are outside this scope.

## 2. Goals

- Preserve useful migrated fishing knowledge without forcing long-form writing into an excessively atomic model.
- Give every KB entity and catch a stable ID.
- Support complete Markdown articles and external long-form pages without reconstructing them from fragments.
- Support reliable catch backlinks to locations, species, techniques, rod/reel setups, and lure/bait records.
- Validate explicit relationships at build time rather than infer relationships by matching names in prose.
- Preserve normal Markdown links, tables, images, and external websites in authored content.
- Keep My Gear and the KB as separate data owners.
- Preserve offline browsing after the site and content have been cached.

## 3. Non-goals

- No Planner page, plan draft, recommendation scoring, or app inference.
- No planner attributes such as season, depth range, structure, cover, temperature, or clarity fields.
- No fishing-session, trip-history, or no-catch data model.
- No reconstruction of complete articles from atomic facts.
- No Markdown-table parsing to manufacture KB or My Gear identities.
- No catch-entry forms or general KB editing forms in v1.
- No generic catch `gear` field and no structured additional-gear list.
- No separate catch depth or structure fields.
- No knot connection-type taxonomy.

## 4. Proposed source layout

The exact filenames may be adjusted during implementation, but the ownership boundary should be preserved:

```text
pwa/data/kb.seed.json            # Locations, species, techniques, knots
pwa/data/catches.seed.json       # Structured catch records
Topics/KB/                       # Complete authored Markdown pages
  Locations/
  Species/
  Techniques/
  Knots/
  Reference/
```

`kb.seed.json` is a structured catalog, not a replacement for authored Markdown. A record may point to a complete repository Markdown page or to an external long-form page.

`catches.seed.json` is structured because catch relationships must be exact and must support backlinks.

The build will validate both datasets and copy the referenced Markdown into the offline bundle. The browser will not parse arbitrary headings or tables to discover IDs, names, relationships, or links.

The read-only KB does not require IndexedDB in v1. A future catch-entry or KB-editing project can add a repository/store layer separately without changing this baseline representation.

## 5. Shared conventions

### 5.1 Stable IDs

All IDs are lowercase kebab-case and immutable after publication.

Recommended prefixes:

- `location-...`
- `species-...`
- `technique-...`
- `knot-...`
- `catch-...`

Names may be corrected without changing IDs.

### 5.2 Pictures

Pictures are optional and use a small media object rather than an unexplained URL:

```json
{
  "src": "./assets/kb/example.jpg",
  "alt": "Descriptive alternative text",
  "caption": "Optional caption",
  "credit": "Optional creator or source name",
  "sourceUrl": "https://example.com/original"
}
```

Only `src` and `alt` are required when a picture is present. An exact user-owned picture can omit `sourceUrl`; externally sourced media should retain source/credit when known.

### 5.3 Complete content references

A Location or Species record points to one complete content source:

```json
{ "kind": "markdown", "path": "Topics/KB/Locations/Lake_Sammamish.md" }
```

or:

```json
{
  "kind": "url",
  "href": "https://example.com/complete-guide",
  "label": "Open the complete guide"
}
```

For `kind: markdown`, the PWA renders the complete file. It does not decompose and reassemble the document.

For `kind: url`, the PWA shows a normal link and does not ingest or copy the external page.

### 5.4 Resource links

Technique and Knot records may contain typed resources:

```json
{
  "type": "video",
  "label": "How to tie the Palomar knot",
  "url": "https://www.youtube.com/..."
}
```

Allowed initial types are `video`, `article`, `reference`, and `website`. Link labels are authored explicitly; they are not inferred from hostnames or surrounding prose.

### 5.5 Markdown links

- External websites use ordinary Markdown links.
- Links between complete KB Markdown files use ordinary repository-relative Markdown paths. The build may rewrite a path only when that exact path is registered to a KB record.
- Inline links from Markdown to My Gear use an explicit stable-ID form such as `gear://berkley-flicker-shad-5`; the build validates the ID and the renderer opens the structured My Gear leaf route.
- Structured relationships, including all Catch relationships, always store stable IDs rather than Markdown links.

No fuzzy name matching is permitted for relationship creation.

### 5.6 Catch backlinks

Only Catch records own catch relationships. Backlinks are computed at render time:

- Location page: catches whose `locationId` matches.
- Species page: catches whose `speciesId` matches.
- Technique page: catches whose `techniqueId` matches.
- Rod/reel setup page: catches whose `rodReelSetupId` matches.
- Lure or bait page: catches whose `lureOrBait.itemId` matches.

Location, Species, Technique, and My Gear records do not store duplicate catch-ID arrays.

## 6. Dataset envelopes

### 6.1 KB catalog

```json
{
  "schemaVersion": 1,
  "dataVersion": "YYYY-MM-DD-kb-v1",
  "locations": [],
  "species": [],
  "techniques": [],
  "knots": []
}
```

### 6.2 Catch Log

```json
{
  "schemaVersion": 1,
  "dataVersion": "YYYY-MM-DD-catches-v1",
  "catches": []
}
```

The KB and Catch Log have independent `dataVersion` values so narrative/catalog updates do not imply catch-history changes and vice versa.

## 7. Entity definitions

### 7.1 Location

| Field | Required | Type | Rule |
|---|---:|---|---|
| `id` | Yes | string | Unique immutable `location-...` ID. |
| `name` | Yes | string | User-facing location name. |
| `picture` | No | media object | Optional representative image. |
| `content` | Yes | content reference | Complete Markdown page or external long-form link. |

`catches` is a computed view and is not stored.

Subareas such as Juanita Bay, the Lake Sammamish south end, or the bench west of Tibbetts Beach remain headings or prose inside the parent location page unless the user later decides they deserve independent browse records. Exact catch spots belong in `Catch.exactSpotNotes`.

### 7.2 Species

| Field | Required | Type | Rule |
|---|---:|---|---|
| `id` | Yes | string | Unique immutable `species-...` ID. |
| `name` | Yes | string | User-facing species name. “Species” is both singular and plural. |
| `picture` | No | media object | Optional representative image. |
| `content` | Yes | content reference | Complete Markdown page or external long-form link. |

`catches` is a computed view and is not stored.

Species identity must not be inferred beyond the source record. The existing Lake Sammamish catch says only “perch”; until user-verified, it should remain a generic Perch record or be explicitly labeled as species not recorded rather than silently converted to Yellow Perch.

### 7.3 Technique

| Field | Required | Type | Rule |
|---|---:|---|---|
| `id` | Yes | string | Unique immutable `technique-...` ID. |
| `name` | Yes | string | User-facing technique name. |
| `type` | Yes | string | User-facing grouping label; named `type`, not `kind`. |
| `picture` | No | media object | Optional representative image. |
| `description` | Yes | plain text | Brief list/card summary. |
| `use` | Conditional | Markdown string | Short authored Use section. |
| `rigging` | Conditional | Markdown string | Short authored Rigging section. |
| `notes` | No | Markdown string | Optional authored notes. |
| `links` | No | resource-link array | Explicit videos/articles/resources. |
| `content` | Conditional | content reference | Complete Markdown or external guide used instead of assembled sections. |

A Technique uses one of two presentation forms:

1. **Section form:** `use` and/or `rigging`, optional `notes`, and optional resource `links`.
2. **Complete-document form:** one `content` reference plus optional resource `links`.

When `content` is present, the UI opens/renders that complete document. It does not extract headings or combine the document with atomic `use`/`rigging` sections. `description` remains available for the browse card.

The initial schema treats `type` as an explicit non-empty user-facing string instead of prematurely freezing a complex taxonomy. Likely initial values include `Rig`, `Method`, `Lure technique`, and `Strategy`.

`catches` is a computed view and is not stored.

### 7.4 Knot

| Field | Required | Type | Rule |
|---|---:|---|---|
| `id` | Yes | string | Unique immutable `knot-...` ID. |
| `name` | Yes | string | User-facing knot name. |
| `picture` | No | media object | Optional diagram/photo. |
| `notes` | Conditional | Markdown string | Short authored guidance, cautions, or conflict notes. |
| `links` | No | resource-link array | Explicit videos/articles/resources. |
| `content` | Conditional | content reference | Complete Markdown or external guide used instead of short notes. |

At least one of `notes`, `content`, or `links` must be present.

There is no `connectionType` field. Intended connections, line compatibility, cautions, and unresolved conflicts live naturally in `notes` or the complete content page.

### 7.5 Catch

| Field | Required | Type | Rule |
|---|---:|---|---|
| `id` | Yes | string | Unique immutable `catch-...` ID. |
| `date` | Yes | ISO date | `YYYY-MM-DD`. |
| `time` | No | string | Optional local time when recorded. |
| `size` | Yes | size object | At least one known length, weight, or authored display value. |
| `speciesId` | Yes | string | Must resolve to a Species ID. |
| `locationId` | Yes | string | Must resolve to a Location ID. |
| `exactSpotNotes` | No | Markdown string | Exact spot, access, depth, structure, cover, conditions, or map/website links. |
| `rodReelSetupId` | Conditional | string or null | Must resolve to a My Gear `rods-reels` setup when known. Historical unknowns stay `null`. |
| `techniqueId` | No | string or null | Must resolve to a Technique ID when explicitly recorded. Do not infer solely from lure type. |
| `lureOrBait` | Yes | object | Exactly one lure or bait reference. |
| `picture` | No | media object | Optional catch picture. |
| `notes` | No | Markdown string | Additional gear, observations, and other catch-specific narrative. |
| `source` | No | string | Optional project evidence label such as `ONENOTE SOURCE` or `USER VERIFIED`. |

There is no Session ID, trip record, generic Gear field, additional-gear relationship list, or separate depth/structure field.

#### Size object

```json
{
  "length": { "value": 13, "unit": "in" },
  "weight": null,
  "display": null
}
```

- `length` and `weight` are optional measurement objects.
- `display` is an optional authored fallback such as `Small; not measured`.
- At least one of the three must be non-null.
- Initial allowed units: length `in` or `cm`; weight `oz`, `lb`, or `g`.

#### Lure-or-bait object

```json
{
  "type": "lure",
  "itemId": "berkley-flicker-shad-5",
  "nameSnapshot": "Berkley Flicker Shad 5"
}
```

- `type` is exactly `lure` or `bait`.
- `itemId` must resolve to the matching My Gear category.
- `nameSnapshot` preserves the historical display name if the My Gear record is later renamed or unavailable.
- New catches require this object. A historical catch without a known lure or bait must be preserved explicitly as unresolved during migration rather than assigned invented gear.

#### Historical rod/reel rule

The existing catch records do not identify the rod/reel setup. Their `rodReelSetupId` values remain `null`. A future Record a Catch form may require a setup for new entries, but the v1 seed validator must allow historical unknowns.

#### One species per Catch

Each Catch represents one species/result. If an outing row contains multiple fish or species, it is split into separate Catch records. The 2026-08-04 Lake Sammamish row therefore becomes one Perch Catch and one Largemouth Bass Catch, both retaining the same source lure and spot notes.

## 8. Representative records

These examples demonstrate the model; they are not implementation data yet.

### 8.1 Location — Lake Sammamish

```json
{
  "id": "location-lake-sammamish",
  "name": "Lake Sammamish",
  "picture": null,
  "content": {
    "kind": "markdown",
    "path": "Topics/KB/Locations/Lake_Sammamish.md"
  }
}
```

The complete page retains the north end, south end, east shoreline, Tibbetts-area observations, tactics, access notes, tables, and links as authored Markdown.

### 8.2 Species — Largemouth Bass

```json
{
  "id": "species-largemouth-bass",
  "name": "Largemouth Bass",
  "picture": null,
  "content": {
    "kind": "markdown",
    "path": "Topics/KB/Species/Largemouth_Bass.md"
  }
}
```

### 8.3 Technique — Ned Rig

```json
{
  "id": "technique-ned-rig",
  "name": "Ned Rig",
  "type": "Rig",
  "picture": null,
  "description": "A finesse mushroom-jighead presentation with a short buoyant bait that stands on bottom.",
  "use": "Use in cold, clear, pressured conditions and around gravel flats, rocky points, and drop-offs.",
  "rigging": "Use the spinning setup with 15 lb braid to 8 lb fluorocarbon leader, a [Z-Man Finesse ShroomZ](gear://zman-finesse-shroomz), and a TRD-style bait. Tie direct with a Palomar knot.",
  "notes": "Current retrieves, in order of emphasis: pop the bottom; swim and glide; drag and dead-stick; straight retrieve. Loop-knot guidance remains unresolved and must not be silently normalized.",
  "links": [
    {
      "type": "video",
      "label": "Ned Rig — Wendell Fishing",
      "url": "https://youtu.be/6xY7EgZJXM0?si=x_k8zC-ckohPcdod"
    }
  ]
}
```

### 8.4 Knot — Palomar

```json
{
  "id": "knot-palomar",
  "name": "Palomar Knot",
  "picture": null,
  "notes": "Strong and easy. Works with braid, fluorocarbon, and monofilament and is useful for small hooks and light line. Ensure the loop cinches evenly above the eye.",
  "links": [
    {
      "type": "video",
      "label": "How to tie the Palomar knot",
      "url": "https://youtube.com/shorts/IlQDI4bi694?is=zoKRljv9K4l7K5yp"
    }
  ]
}
```

### 8.5 Catch — Silver Lake largemouth

```json
{
  "id": "catch-2026-07-27-silver-lake-largemouth-01",
  "date": "2026-07-27",
  "time": "20:00",
  "size": {
    "length": { "value": 13, "unit": "in" },
    "weight": null,
    "display": null
  },
  "speciesId": "species-largemouth-bass",
  "locationId": "location-silver-lake-whatcom",
  "exactSpotNotes": "Shore fishing from the beach north of the county park office; 3–5 ft over gravel bottom.",
  "rodReelSetupId": null,
  "techniqueId": null,
  "lureOrBait": {
    "type": "lure",
    "itemId": "berkley-flicker-shad-5",
    "nameSnapshot": "Berkley Flicker Shad 5"
  },
  "picture": null,
  "notes": "Bass was shallow over gravel near evening. The Flicker Shad proved viable for bass as well as trout/pikeminnow-oriented use.",
  "source": "ONENOTE SOURCE"
}
```

## 9. User-facing routes and behavior

Proposed routes:

```text
#/kb
#/kb/locations
#/kb/location/{stable-id}
#/kb/species
#/kb/species/{stable-id}
#/kb/techniques
#/kb/technique/{stable-id}
#/kb/knots
#/kb/knot/{stable-id}
#/kb/catches
#/kb/catch/{stable-id}
```

The Home page presents **My Gear** and **Knowledge Base**. Knowledge Base opens a category page for Locations, Species, Techniques, Knots, and Catch Log. There is no Planner choice or route.

The structured My Gear app continues to own all `#/inventory/...` routes. The KB router must not compete for them.

Applicable detail pages show computed Catch History. Empty states remain explicit and do not invent attribution.

The site header will remove the `FISHING KNOWLEDGE BASE` kicker and display only the Fishing Companion site title. This is bundled with the implementation and does not justify a standalone production build.

## 10. Migration map

### 10.1 `Topics/Local_Waters_Locations.md`

Create initial Location records and complete Markdown pages for:

- Lake Washington
- Lake Sammamish
- Silver Lake, Whatcom County
- Cranberry Lake, Deception Pass State Park
- Mayfield Lake
- Lake Chelan
- Lake Cle Elum
- Lake Bosworth

Migration rules:

- Keep lake subareas as headings within the complete page initially.
- Keep launches, access notes, regulations warnings, tactics, user observations, and current links in the authored page.
- Do not create separate location records for every point, launch, shoreline, or bench in v1.
- Keep exact catch spots in Catch records.
- Reverify time-sensitive regulations, stocking, access, and conditions when using the information; migration does not convert historical notes into current verification.

### 10.2 `Topics/Fishing_Techniques.md`

Create Technique records or complete Technique/Reference pages for the current material:

| Current content | Proposed target |
|---|---|
| General paddle-only kayak strategy | Complete Technique page, type `Strategy`. |
| Trout casting/spoons | Complete Technique page or linked guide. |
| Inline spinners | Technique record. |
| Still fishing / slip-sinker rig | Technique record. |
| Bobber fishing | Technique record. |
| Kayak trolling | Complete Technique page, type `Method`. |
| Wacky worm | Technique record, type `Rig`. |
| Ned rig | Technique record, type `Rig`. |
| Drop shot | Technique record, type `Rig`. |
| Jigs | Complete Technique page or linked guide. |
| Spinnerbait | Technique record. |
| Chatterbait / bladed jig | Technique record. |
| Crankbait | Technique record. |
| Jerkbait | Technique record. |
| Swimbait / soft jerk shad | Complete Technique page. |
| Frog, Whopper Plopper, Popper, Buzzbait, Walking bait | Individual records where current content is sufficient; otherwise one complete Topwater guide with browse links. |
| Seasonal bass notes | Preserve as one complete long-form guide; do not atomize into planner attributes. |
| Color, scent, and water-visibility notes | Preserve as authored reference content with existing caution/verification wording. |
| Texas, Carolina, Alabama, and incomplete Neko pages | Keep as TODOs/candidates; do not publish empty records as complete guidance. |

Migration rules:

- Preserve the existing paddle-only constraint in the appropriate complete guide.
- Preserve unresolved PowerBait hook-size and loop-knot conflicts verbatim until separately resolved.
- Use My Gear stable IDs for explicit inline gear links where useful.
- Do not create structured season/depth/structure relationships.
- Do not infer catches or gear relationships by scanning technique prose.

### 10.3 `Topics/Rods_Reels_Line_Knots.md`

Migration ownership:

| Current content | Owner after migration |
|---|---|
| Owned rod/reel/line product facts | My Gear structured seed; do not duplicate as KB identity data. |
| Spinning vs baitcasting guidance | Complete KB reference/technique page. |
| Baitcaster setup and spooling resources | Complete KB reference page linked from relevant gear. |
| Line material notes | Complete KB reference page linked from Line and Knots. |
| Knot table and knot guidance | Individual Knot records. |
| Direct tie / snap / swivel guidance | Complete KB reference page; may link to My Gear categories/items. |
| Trout rigging examples | Technique pages; avoid duplicate authoritative prose. |
| Reel maintenance cross-reference | Existing maintenance topic remains the content owner. |

Initial Knot records:

- Palomar
- FG
- Albright
- Trilene
- Improved Clinch
- Modified Uni
- Double Uni
- Loop / Non-slip Loop
- Single Uni
- Arbor

The Loop and Single Uni notes retain their disputed/discouraged status in prose. There is no structured connection-type field.

### 10.4 `Topics/Trip_Logs_Field_Observations.md`

The four OneNote catch-log rows become five Catch records:

| Source date/location | Catch records | My Gear lure ID | Setup |
|---|---:|---|---|
| 2026-07-27 Silver Lake | 13 in Largemouth Bass | `berkley-flicker-shad-5` | Unknown/null |
| 2026-08-04 Lake Sammamish | 10 in Perch; 12 in Largemouth Bass | `strike-king-kvd-square-bill-1` | Unknown/null |
| 2026-08-19 Mayfield Lake | 12 in Northern Pikeminnow | `berkley-flicker-shad-5` | Unknown/null |
| 2026-08-20 Mayfield Lake | 12 in Northern Pikeminnow | `berkley-flicker-shad-5` | Unknown/null |

Migration rules:

- Split the mixed-species Lake Sammamish row into two catches.
- Do not infer rod/reel setups.
- Do not infer `techniqueId` solely from lure type.
- Move depth, structure, access/platform, and conditions into `exactSpotNotes`.
- Move observations and next-adjustment narrative into `notes` when catch-specific.
- Do not create Catch records for no-bite outings, scouting observations, or unknown outcomes.
- Preserve valuable no-bite/scouting observations in their Location page or another complete long-form reference page.
- Keep the Lake Chelan unknown outcome out of Catch Log.

### 10.5 Transitional inventory Markdown

`Fishing_Gear_Registry.md` and `Fishing_Tackle_Inventory.md` may be consulted for migrated context while the legacy application is retired, but they do not become the KB or My Gear data source. Exact My Gear IDs and product facts come from `pwa/data/gear.seed.json`.

## 11. Initial species set

At minimum, the structured catches require:

- Largemouth Bass
- Perch — exact species unresolved in the source record
- Northern Pikeminnow

Additional Species pages should be created only where current durable content is sufficient, likely including Smallmouth Bass, Rainbow Trout, Coastal Cutthroat Trout, and Kokanee. Sparse or unverified species references should remain within a complete location/technique page until there is enough content for a useful browse page.

## 12. Validation requirements

The implementation validator must reject:

- duplicate or malformed IDs;
- missing required fields;
- references to nonexistent Location, Species, Technique, My Gear setup, lure, or bait IDs;
- a lure/bait type that does not match the referenced My Gear category;
- a rod/reel reference that does not point to a My Gear `rods-reels` setup;
- nonexistent Markdown content paths;
- missing labels or invalid URLs for resource links;
- Technique records with neither a complete content reference nor authored section content;
- Knot records with no notes, content, or links;
- Catch records with invalid dates, size values, or multiple/absent lure-or-bait selections.

Validation must not attempt to infer or repair invalid references by matching names.

## 13. Implementation acceptance criteria

### Product behavior

- Home contains My Gear and Knowledge Base; no Planner is shown.
- Knowledge Base contains Locations, Species, Techniques, Knots, and Catch Log.
- Category cards open lists; list cards open leaf pages.
- Complete Markdown pages render intact with tables, images, and links.
- External long-form content opens through its authored link.
- Catch backlinks appear on the applicable KB and My Gear leaf pages.
- Historical catches do not claim rod/reel setups that were not recorded.
- My Gear routes and accepted layout remain unchanged.
- No My Gear CRUD or JSON import/export UI is introduced.
- The site header displays only the site title, without `FISHING KNOWLEDGE BASE` above it.
- The app remains usable offline after initialization.

### Regression tests

- Explicit route ownership for `#/inventory/...` and `#/kb/...`.
- No `#/plan` route or planner UI copy.
- No planner scoring, localStorage plan draft, or text-matching catch attribution in the deployed bundle.
- KB schema/content-reference validation.
- Catch schema and cross-domain reference validation.
- Known catch-to-lure mappings for Flicker Shad and KVD Square Bill.
- The mixed 2026-08-04 row produces two catch records.
- Unknown historical setup IDs remain null.
- Required offline bundle files are cached.

## 14. Implementation sequence after design approval

1. Fetch the latest `main` SHA and create a normal feature branch.
2. Add KB and Catch schemas, validators, seeds, and validation tests.
3. Migrate complete Markdown pages without deleting legacy sources until equivalence is checked.
4. Add the browse-only KB router and UI.
5. Add structured Catch Log pages and computed backlinks.
6. Remove Planner UI, routes, scoring, plan-draft storage, and obsolete parser paths.
7. Remove the site-header kicker.
8. Preserve the explicit My Gear router boundary and rerun its regression suite.
9. Update project README/context/TODO/decision history and identify any legacy files safe to retire.
10. Open one coherent implementation PR, let its exact final head pass CI, merge normally, and verify both production build and Pages deployment.

No production implementation should begin until this design and its migration rules are accepted.
