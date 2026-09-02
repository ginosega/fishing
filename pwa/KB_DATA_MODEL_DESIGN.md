# Fishing Companion Knowledge Base Data Model

**Status:** Accepted / implemented architecture

**Updated:** 2026-09-02

## 1. Product direction

Fishing Companion has two separate data domains:

- **My Gear** remains the structured local-first inventory backed by `pwa/data/gear.seed.json` and IndexedDB.
- **Knowledge Base** becomes a browse-only information repository backed by one consistent KB Entity model plus a separate structured Catch Log.

The Knowledge Base is not a planner or recommendation engine. It will not assemble fishing plans, infer recommendations from prose, score catch similarity, or require planner-specific attributes.

The user-facing Knowledge Base sections are Locations, Species, Techniques, Knots, and Catch Log.

The initial redesign is browse-only and seed-managed. Add/Edit/Delete forms, including a future **Record a catch** form, are outside this scope.

## 2. Goals

- Preserve complete authored fishing knowledge without breaking it into unnecessary atomic fields.
- Give every KB entity and catch a stable ID.
- Use one entity schema and one generic renderer for Locations, Species, Techniques, and Knots.
- Preserve Markdown headings, tables, images, internal links, My Gear links, and website links.
- Support reliable catch backlinks to locations, species, techniques, rod/reel setups, and lure/bait records.
- Validate explicit relationships rather than infer them by matching names in prose.
- Keep My Gear and the KB as separate data owners.
- Preserve offline browsing after the site and its content have been cached.

## 3. Non-goals

- No Planner page, plan draft, recommendation scoring, or app inference.
- No planner attributes such as season, depth range, structure, cover, temperature, or clarity fields.
- No fishing-session, trip-history, or no-catch data model.
- No separate schemas for Location, Species, Technique, and Knot.
- No Technique subtype, category, or grouping field.
- No atomic Technique fields such as Use, Rigging, Notes, or Links.
- No knot connection-type taxonomy.
- No Markdown-table parsing to manufacture KB or My Gear identities.
- No catch-entry or KB-editing forms in v1.
- No generic catch `gear` field or structured additional-gear list.
- No separate catch depth or structure fields.

## 4. Source layout

```text
pwa/data/kb.seed.json            # Unified KB Entity catalog
pwa/data/catches.seed.json       # Structured Catch Log
pwa/kb-content/                  # Complete Markdown documents
  locations/
  species/
  techniques/
  knots/
  reference/
pwa/assets/kb/                   # Locally stored KB pictures and Markdown images
```

`kb.seed.json` contains one `entities` array. Every entity has the same six logical fields: ID, Type, Name, Description, Picture, and Content.

`Content` is represented in the source catalog by a repository-relative path to one complete Markdown file. The Markdown file is the field value’s authored content; the application loads and renders it as one document. This keeps Markdown pleasant to edit and review without introducing different entity schemas.

An entity that primarily points to an external long-form article still has a local Markdown document containing the authored introduction and normal link to that page. No special content mode is required.

The build validates the catalog and copies all registered Markdown and local image assets into the offline bundle. The browser does not parse arbitrary headings or tables to discover IDs, names, or relationships.

The read-only KB does not require IndexedDB in v1. A future editing project can add a repository/store layer without changing the portable baseline representation.

## 5. Unified KB Entity schema

### 5.1 Dataset envelope

```json
{
  "schemaVersion": 1,
  "dataVersion": "YYYY-MM-DD-kb-v1",
  "entities": []
}
```

### 5.2 Entity fields

| Field | Required | Type | Rule |
|---|---:|---|---|
| `id` | Yes | string | Unique immutable lowercase kebab-case ID. |
| `type` | Yes | enum | Exactly `location`, `species`, `technique`, or `knot`. |
| `name` | Yes | string | User-facing entity name. |
| `description` | No | plain text or null | Optional card and page-header subtext. |
| `picture` | No | picture object or null | Optional representative card/header image. |
| `content` | Yes | string | Repository-relative path to one complete Markdown document. |

There are no entity-specific data fields. The entity `type` is only the top-level discriminator that places an entity in Locations, Species, Techniques, or Knots. It is not a Technique grouping or subtype.

Recommended ID prefixes remain useful for readability and validation: `location-...`, `species-...`, `technique-...`, and `knot-...`. Names and descriptions may be corrected without changing IDs.

### 5.3 Picture object

```json
{
  "src": "./assets/kb/example.jpg",
  "alt": "Descriptive alternative text",
  "caption": "Optional caption",
  "credit": "Optional creator or source name",
  "sourceUrl": "https://example.com/original"
}
```

Only `src` and `alt` are required when `picture` is present. User-owned pictures can omit `sourceUrl`; externally sourced media should retain source/credit when known.

The current My Gear pipeline stores one cached image per product and scales the same image for smaller presentation and zoom. The initial KB implementation may use the same one-asset approach. Separate thumbnail generation is not required and can be considered later only if performance measurements justify it.

### 5.4 Content rules

The complete Markdown Content document may contain:

- any heading structure appropriate to the subject;
- Use, Rigging, Notes, Resources, Warnings, or other headings when useful;
- paragraphs, lists, and tables;
- any number of embedded pictures;
- normal links to websites, articles, videos, other KB pages, and My Gear records.

Example embedded image:

```markdown
## How to rig it

![Diagram showing a Ned rig](../../assets/kb/techniques/ned-rig-diagram.png)

Insert the hook point through the nose of the bait…
```

Local repository images are validated, copied into the build, and cached for offline use. Externally hosted image URLs may render online but are not considered durable or reliably offline, so verified images should normally be stored locally.

Embedded Content images should be tappable through the same zoom viewer behavior used for My Gear images.

### 5.5 Links

- External websites use ordinary Markdown links.
- Links between KB documents use ordinary repository-relative Markdown paths. The build rewrites a path only when that exact path is registered to a KB entity.
- Inline links to My Gear use an explicit stable-ID form such as `gear://berkley-flicker-shad-5`; the build validates the ID and the renderer opens the structured My Gear leaf route.
- Catch relationships always store stable IDs rather than Markdown links.

No fuzzy name matching is permitted for relationship creation.

## 6. Representative KB Entities

### Location — Lake Sammamish

```json
{
  "id": "location-lake-sammamish",
  "type": "location",
  "name": "Lake Sammamish",
  "description": "Local bass and trout water with distinct north-end, south-end, and east-shore patterns.",
  "picture": null,
  "content": "./kb-content/locations/lake-sammamish.md"
}
```

### Species — Largemouth Bass

```json
{
  "id": "species-largemouth-bass",
  "type": "species",
  "name": "Largemouth Bass",
  "description": null,
  "picture": null,
  "content": "./kb-content/species/largemouth-bass.md"
}
```

### Technique — Ned Rig

```json
{
  "id": "technique-ned-rig",
  "type": "technique",
  "name": "Ned Rig",
  "description": "A finesse mushroom-jighead presentation with a short buoyant bait that stands on bottom.",
  "picture": null,
  "content": "./kb-content/techniques/ned-rig.md"
}
```

The complete Markdown page owns Use, Rigging, retrieve instructions, My Gear links, video/article links, and the unresolved loop-knot note.

### Knot — Palomar

```json
{
  "id": "knot-palomar",
  "type": "knot",
  "name": "Palomar Knot",
  "description": "A strong, simple terminal knot for braid, fluorocarbon, and monofilament.",
  "picture": null,
  "content": "./kb-content/knots/palomar.md"
}
```

## 7. Catch Log schema

Catch Log remains separate because catches are structured historical records with exact relationships rather than general authored knowledge.

### 7.1 Dataset envelope

```json
{
  "schemaVersion": 1,
  "dataVersion": "YYYY-MM-DD-catches-v1",
  "catches": []
}
```

### 7.2 Catch fields

| Field | Required | Type | Rule |
|---|---:|---|---|
| `id` | Yes | string | Unique immutable `catch-...` ID. |
| `date` | Yes | ISO date | `YYYY-MM-DD`. |
| `time` | No | string | Optional local time when recorded. |
| `size` | Yes | size object | At least one known length, weight, or authored display value. |
| `speciesId` | Yes | string | Must resolve to an entity whose type is `species`. |
| `locationId` | Yes | string | Must resolve to an entity whose type is `location`. |
| `exactSpotNotes` | No | Markdown string | Exact spot, access, depth, structure, cover, conditions, or map/website links. |
| `rodReelSetupId` | Conditional | string or null | Must resolve to a My Gear `rods-reels` setup when known. Historical unknowns stay `null`. |
| `techniqueId` | No | string or null | Must resolve to an entity whose type is `technique` when explicitly recorded. Do not infer solely from lure type. |
| `lureOrBait` | Yes | object | Exactly one lure or bait reference. |
| `picture` | No | picture object or null | Optional catch picture. |
| `notes` | No | Markdown string | Additional gear, observations, and other catch-specific narrative. |
| `source` | Yes | string | Project evidence label such as `ONENOTE SOURCE` or `USER VERIFIED`. |

There is no Session ID, trip record, generic Gear field, additional-gear relationship list, or separate depth/structure field.

### 7.3 Size object

```json
{
  "length": { "value": 13, "unit": "in" },
  "weight": null,
  "display": null
}
```

At least one of `length`, `weight`, or `display` must be non-null. Initial allowed units are length `in` or `cm` and weight `oz`, `lb`, or `g`.

### 7.4 Lure-or-bait object

```json
{
  "type": "lure",
  "itemId": "berkley-flicker-shad-5",
  "nameSnapshot": "Berkley Flicker Shad 5"
}
```

`type` is exactly `lure` or `bait`; `itemId` must resolve to the matching My Gear category; and `nameSnapshot` preserves the historical display name if the My Gear record is later renamed or unavailable.

### 7.5 Historical rules

- Existing catch records do not identify rod/reel setup; `rodReelSetupId` remains `null` rather than being inferred.
- `techniqueId` is not inferred solely from lure type.
- Each Catch represents one species/result. A source row with multiple fish/species is split into separate Catch records.
- Depth, structure, access/platform, and conditions belong in `exactSpotNotes`.
- Additional gear and catch-specific observations belong in `notes`.

### 7.6 Representative Catch

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

## 8. Catch backlinks

Only Catch records own catch relationships. Backlinks are computed at render time:

- Location entity: catches whose `locationId` matches.
- Species entity: catches whose `speciesId` matches.
- Technique entity: catches whose `techniqueId` matches.
- Rod/reel setup page: catches whose `rodReelSetupId` matches.
- Lure or bait page: catches whose `lureOrBait.itemId` matches.

KB Entities and My Gear records do not store duplicate catch-ID arrays. Knot entities do not receive Catch History unless the Catch schema is deliberately expanded later.

## 9. Routes and behavior

```text
#/kb
#/kb/locations
#/kb/species
#/kb/techniques
#/kb/knots
#/kb/entity/{stable-id}
#/kb/catches
#/kb/catch/{stable-id}
```

The four KB category lists are filtered views of the same Entity collection. All use the same card and leaf-page renderer.

Home presents **My Gear** and **Knowledge Base**. Knowledge Base opens Locations, Species, Techniques, Knots, and Catch Log. There is no Planner choice or route.

My Gear continues to own all `#/inventory/...` routes. The KB router owns all `#/kb/...` routes and must not compete with My Gear.

Applicable detail pages show computed Catch History. Empty states remain explicit and do not invent attribution.

The site header removes the `FISHING KNOWLEDGE BASE` kicker and displays only the Fishing Companion title.

## 10. Migration map

### 10.1 Locations

Create `location` entities and complete Markdown Content for Lake Washington, Lake Sammamish, Silver Lake (Whatcom County), Cranberry Lake, Mayfield Lake, Lake Chelan, Lake Cle Elum, and Lake Bosworth.

- Keep subareas as headings initially.
- Preserve access notes, regulation warnings, tactics, observations, tables, and links.
- Do not create separate entities for every point, launch, shoreline, or bench in v1.
- Keep exact catch spots in Catch records.
- Migration does not convert historical regulations, stocking, access, or conditions into current verification.

### 10.2 Techniques

Create `technique` entities with complete Markdown Content where current material is sufficiently developed. Related material may stay together as one coherent long-form page rather than being split into atomic entities: the initial Trout Fishing entity contains casting/spoons, inline spinners, still/slip-sinker fishing, bobber fishing, and kayak trolling as headings; Topwater Fishing similarly keeps its related presentations together. Other initial entities include paddle-only kayak strategy, wacky worm, Ned rig, drop shot, jigs, spinnerbait, chatterbait, crankbait, jerkbait, swimbait/soft jerk shad, seasonal bass guidance, and color/scent/visibility reference guidance.

- Preserve headings such as Use, Rigging, Technique, Gear, Resources, and Notes inside Markdown Content.
- Preserve the paddle-only constraint and unresolved PowerBait hook-size and loop-knot conflicts.
- Use My Gear stable IDs for explicit inline gear links where useful.
- Do not create planner attributes or scan prose to infer catch/gear relationships.
- Keep Texas, Carolina, Alabama, and incomplete Neko material as TODO/candidate content rather than presenting empty entities as complete guidance.

### 10.3 Rods, reels, line, and knots

| Current content | Owner after migration |
|---|---|
| Owned rod/reel/line product facts | My Gear structured seed; do not duplicate as KB identity data. |
| Spinning vs baitcasting guidance | Complete KB reference Content linked from relevant entities or gear. |
| Baitcaster setup and spooling resources | Complete KB reference Content linked from relevant gear. |
| Line material notes | Complete KB reference Content linked from knots and Line. |
| Knot table and knot guidance | Individual `knot` entities. |
| Direct tie / snap / swivel guidance | Complete KB reference Content. |
| Trout rigging examples | Technique entity Content; avoid duplicate authoritative prose. |
| Reel maintenance cross-reference | Existing maintenance topic remains the content owner. |

Initial Knot entities are Palomar, FG, Albright, Trilene, Improved Clinch, Modified Uni, Double Uni, Loop/Non-slip Loop, Single Uni, and Arbor. Loop and Single Uni retain disputed/discouraged guidance in prose.

### 10.4 Catch Log

The four OneNote catch-log rows become five structured catches:

| Source date/location | Catch records | My Gear lure ID | Setup |
|---|---:|---|---|
| 2026-07-27 Silver Lake | 13 in Largemouth Bass | `berkley-flicker-shad-5` | Unknown/null |
| 2026-08-04 Lake Sammamish | 10 in Perch; 12 in Largemouth Bass | `strike-king-kvd-square-bill-1` | Unknown/null |
| 2026-08-19 Mayfield Lake | 12 in Northern Pikeminnow | `berkley-flicker-shad-5` | Unknown/null |
| 2026-08-20 Mayfield Lake | 12 in Northern Pikeminnow | `berkley-flicker-shad-5` | Unknown/null |

- Split the mixed-species Lake Sammamish row into two catches.
- Do not infer rod/reel setup or Technique.
- Move depth, structure, access/platform, and conditions into `exactSpotNotes`.
- Move observations and next-adjustment narrative into `notes` when catch-specific.
- Do not create Catch records for no-bite outings, scouting observations, or unknown outcomes.
- Preserve valuable no-bite/scouting observations in Location Content.
- Keep the Lake Chelan unknown outcome out of Catch Log.

### 10.5 Transitional inventory Markdown

`Fishing_Gear_Registry.md` and `Fishing_Tackle_Inventory.md` may be consulted for migrated context, but they are not KB or My Gear data sources. Exact My Gear IDs and product facts come from `pwa/data/gear.seed.json`.

## 11. Initial Species entities

At minimum, catches require Largemouth Bass, Perch (exact species unresolved in the source), and Northern Pikeminnow. Additional Species entities should be created only where durable content is sufficient, likely including Smallmouth Bass, Rainbow Trout, Coastal Cutthroat Trout, and Kokanee.

## 12. Validation requirements

The validator must reject:

- duplicate or malformed entity/catch IDs;
- entity `type` outside `location`, `species`, `technique`, or `knot`;
- missing names or Content paths;
- nonexistent or escaping Content paths;
- nonexistent local pictures or Markdown image paths;
- Catch references to nonexistent or wrong-type entities;
- nonexistent My Gear setup, lure, or bait references;
- lure/bait type inconsistent with the referenced My Gear category;
- rod/reel references that do not point to a My Gear setup;
- invalid Catch dates, sizes, or lure/bait selections.

Validation must not infer or repair references by matching names.

## 13. Acceptance criteria

- Home contains My Gear and Knowledge Base; no Planner is shown.
- Knowledge Base contains Locations, Species, Techniques, Knots, and Catch Log.
- Category cards open filtered lists; list cards open generic entity pages.
- Complete Markdown renders intact with headings, tables, pictures, and links.
- Markdown pictures are tappable, zoomable, and available offline when local.
- Catch backlinks appear on applicable KB and My Gear pages.
- Historical catches do not claim unrecorded setups or techniques.
- My Gear routes and accepted layout remain unchanged.
- No editing/import/export UI is introduced.
- The site header displays only the Fishing Companion title.
- The app remains usable offline after initialization.

Regression tests must cover route ownership, absence of Planner code/UI, absence of text-matching catch attribution, unified Entity/Content validation, Markdown image validation, Catch cross-references, known lure mappings, the split 2026-08-04 catches, null historical setup/technique IDs, and offline bundle contents.

## 14. Implementation sequence

1. Add the unified KB Entity and Catch validators, seeds, and tests.
2. Migrate complete Markdown Content without deleting legacy sources until equivalence is checked.
3. Add generic entity lists/pages, Markdown rendering, pictures, and Catch Log views.
4. Add computed catch backlinks.
5. Remove Planner UI, routes, scoring, plan-draft storage, and obsolete parser paths.
6. Remove the site-header kicker.
7. Preserve the explicit My Gear router boundary and rerun its regression suite.
8. Update README/context/TODO/decision history and identify legacy files safe to retire.
9. Open one implementation PR, let its exact final head pass CI, merge normally, and verify production build and Pages deployment.
