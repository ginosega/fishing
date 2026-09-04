# Fishing Companion Knowledge Base Data Model

**Status:** Accepted / implemented / current

**Updated:** 2026-09-04

**Current implementation verification:** The unified KB/Catch architecture originated in PR #13, was extended with flat Equipment taxonomy in PR #24, and is current through PR #28. Latest verified production merge is `093139e5314af55691e608277b68b79b2d369166`; production run #121 / `33840208952` completed build and GitHub Pages deployment successfully.

Current production data contains **54 KB entities** (8 Locations, 7 Species, 22 Equipment, 7 Techniques, 10 Knots) and **5 structured catches**.

## 1. Product direction

Fishing Companion has three durable application-data domains:

- **My Gear** — structured local-first owned inventory backed by `pwa/data/gear.seed.json` and IndexedDB.
- **Knowledge Base** — browse-only information repository backed by one unified KB Entity model plus complete Markdown documents.
- **Catch Log** — separate structured historical data with explicit stable-ID relationships to KB entities and My Gear records.

The Knowledge Base is not a planner or recommendation engine. It does not assemble plans, score recommendations, infer relationships from prose, or require planner-specific attributes.

User-facing KB sections are Locations, Species, Equipment, Techniques, Knots, and Catch Log.

## 2. Goals

- Preserve complete authored fishing knowledge without unnecessary atomic fields.
- Give every KB entity and catch a stable ID.
- Use one entity envelope and generic renderer for all five KB entity types.
- Preserve Markdown headings, tables, images, internal links, My Gear links, and external resources.
- Support exact Catch backlinks through structured IDs.
- Validate explicit relationships rather than infer them from prose/display text.
- Keep My Gear, KB, and Catch Log as separate fact owners.
- Preserve offline browsing after content/assets are cached.

## 3. Non-goals

- No Planner / Planner Attributes.
- No recommendation scoring or parser-derived fishing plans.
- No fishing-session, Session ID, trip-history, or no-catch-session model.
- No entity-specific schema families.
- No Equipment/Technique subtype/grouping field.
- No atomic Use/Rigging/Notes/Links fields in KB entities.
- No knot connection taxonomy.
- No Markdown-table parsing to manufacture identity/relationships.
- No fuzzy name matching for cross-domain relationships.
- No KB/Catch editing forms in the current browse-focused release.

## 4. Source layout

```text
pwa/data/kb.seed.json            # Unified KB Entity catalog
pwa/data/catches.seed.json       # Structured Catch Log
pwa/kb-content/                  # Complete authored Markdown documents
  locations/
  species/
  techniques/
  knots/
pwa/assets/kb/                   # Repository-local KB images
pwa/local-media.json             # Active repository-local media configuration
pwa/apply-local-media.mjs        # Local image validation/materialization
```

`kb.seed.json` contains one `entities` array. Every entity uses the same six logical fields: ID, Type, Name, Description, Picture, Content.

`Content` is represented by a path to one complete Markdown file. The build validates every registered document and internal application link.

## 5. Unified KB Entity schema

### Dataset envelope

```json
{
  "schemaVersion": 1,
  "dataVersion": "YYYY-MM-DD-kb-v1",
  "entities": []
}
```

Current production data version: `2026-09-04-kb-v1-final-content-1`.

### Entity fields

| Field | Required | Type | Rule |
|---|---:|---|---|
| `id` | Yes | string | Unique immutable lowercase kebab-case ID. |
| `type` | Yes | enum | Exactly `location`, `species`, `equipment`, `technique`, or `knot`. |
| `name` | Yes | string | User-facing entity name. |
| `description` | No | plain text or null | Optional card/page-header subtext; obeys the current description-length validation. |
| `picture` | No | picture object or null | Optional representative card/header image. |
| `content` | Yes | string | Repository-relative path to one complete Markdown document. |

Stable ID is identity. Names, taxonomy, descriptions, picture source, and Markdown paths may change without changing an ID.

Existing `technique-*` IDs may therefore remain unchanged even when an article is now `type: equipment`.

## 6. Equipment vs. Technique

The flat five-type taxonomy was adopted to improve semantic clarity without adding nested navigation.

### Equipment

Use for rigs and terminal presentations, lure-family/equipment guides, rigging-oriented gear knowledge, and practical use/selection information centered on equipment or presentation mechanics.

Examples include Wacky Worm, Ned Rig, Drop Shot, Jigs, Spinnerbait, Chatterbait / Bladed Jig, Crankbait, Jerkbait, Swimbait, Frogs, Inline Spinner, Snaps & Swivels, Flasher Rig, Inline Trolling Rig, Bobber Rig, and Slip Sinker Rig.

### Technique

Use for strategy, seasonal/condition guidance, species-oriented fishing methods, route/boat-control tactics, and broader fishing approaches not centered on one equipment family.

Examples include Trout Fishing, Spring Fishing, paddle-only kayak strategy, seasonal bass guidance, color/scent, and water visibility.

There is no nested taxonomy or subtype field. The user reaches the article from one flat peer category.

## 7. Picture object and local media

Representative picture shape:

```json
{
  "src": "./assets/kb/example.png",
  "alt": "Descriptive alternative text",
  "caption": "Optional caption",
  "credit": null,
  "sourceUrl": null,
  "gearItemId": "optional-stable-owned-gear-id"
}
```

When `gearItemId` is present, it must resolve to an existing My Gear record. This is used when the representative image depicts a specific owned item; the UI may link the caption to that exact My Gear leaf.

Repository-local media is configured in `local-media.json` and validated/materialized by `apply-local-media.mjs`. Validation checks image size, supported format structure/signatures, and extension consistency. Built KB bytes are checked against repository source bytes.

Separate thumbnail files are not required; one source asset is scaled by presentation CSS.

### User-supplied binary convention

ChatGPT must **not** upload/base64-transport user image binaries through connector tool calls. The user uploads the binary directly to the specified GitHub feature branch/path; ChatGPT verifies it and handles text/config/tests/release work.

This is a reliability/process rule, not a KB schema rule.

## 8. Content rules

The complete Markdown document may contain any useful headings and narrative structure, including Use / When to Use, Rigging / Setup, Technique / Retrieve, Gear / Tackle, Notes / Warnings, Resources, tables, external links, `gear://stable-id`, `kb://stable-id`, registered relative KB-document links, and embedded local/external images.

The app does **not** parse headings or prose to infer structured facts or relationships.

## 9. Link rules

- External websites use ordinary Markdown links.
- Registered relative Markdown links become KB routes.
- My Gear navigation uses `gear://stable-gear-id`.
- KB navigation uses `kb://stable-kb-id`.
- Build validation requires internal IDs/registered paths to exist.
- Authored links are navigation, not automatically maintained reverse relationships.
- Catch relationships always store stable IDs directly.
- No fuzzy relationship creation is permitted.

## 10. Structured Catch Log

Catch Log remains separate because catches are structured historical records with exact relationships.

### Dataset envelope

```json
{
  "schemaVersion": 1,
  "dataVersion": "YYYY-MM-DD-catches-v1",
  "catches": []
}
```

### Current core fields

| Field | Rule |
|---|---|
| `id` | Immutable catch stable ID. |
| `date` / optional `time` | Historical date/time. |
| `size` | Structured length/weight or authored display value. |
| `speciesId` | Must resolve to Species. |
| `locationId` | Must resolve to Location. |
| `exactSpotNotes` | Markdown exact spot/depth/structure/conditions/access narrative. |
| `rodReelSetupId` | Optional; must resolve to a Rods & Reels setup when known. |
| `techniqueId` | Optional; may resolve to the accepted presentation/technique KB entity when explicitly recorded. Existing IDs remain valid across taxonomy moves. |
| `lureOrBait` | Exactly one My Gear Lure or Bait ID plus name snapshot. |
| `picture` | Optional exact-catch image. |
| `notes` | Markdown catch-specific narrative. |
| `source` | Provenance/evidence label. |

Historical setup/technique is never inferred solely from lure type or general context.

## 11. Catch backlinks and pictures

Only Catch records own catch relationships. Backlinks are computed at render time for applicable Location, Species, presentation/Technique/Equipment, setup, lure, and bait pages.

KB/Gear records do not store duplicate catch-ID arrays.

Picture rule: if a Catch has an exact `picture`, use it; otherwise, use the linked Species representative picture as the UI fallback. The species fallback is presentation behavior and does not copy species picture data into Catch records.

## 12. Routes

```text
#/kb
#/kb/locations
#/kb/species
#/kb/equipment
#/kb/techniques
#/kb/knots
#/kb/entity/{stable-id}
#/kb/catches
#/kb/catch/{stable-id}
```

All five entity category lists are filtered views of the same entity collection and use the same general card/leaf rendering model.

My Gear owns all `#/inventory/...` routes; KB owns Home and all `#/kb/...` routes.

## 13. Browse/search conventions

- Root Knowledge Base has Search.
- Entity lists show Search at **10+ entries**.
- Smaller lists omit Search.
- Search is a presentation filter; it does not create new stored indexes/relationships.
- Equipment/Technique remain peer categories rather than nested navigation.

## 14. Current production content state

PR #28 refreshed these existing articles from the user's supplied MHT pages: Swimbait, Jerkbait, Crankbait, Chatterbait / Bladed Jig, Spinnerbait, Jigs, Frogs, Drop Shot, Wacky Worm, Ned Rig, and Trout Fishing.

PR #28 added: Inline Spinner, Snaps & Swivels, Flasher Rig, Inline Trolling Rig, Bobber Rig, Slip Sinker Rig, and Spring Fishing.

The current local-media set also contains the requested rig illustrations and replacement Rainbow Trout, Coastal Cutthroat Trout, Smallmouth Bass, and Largemouth Bass images. Requested owned-Gear images are reused by exact stable Gear identity where appropriate.

## 15. Validation invariants

Build/tests verify at least:

- KB schema version/dataVersion and exact allowed entity fields;
- valid five-type enum;
- unique stable IDs and one-to-one Content paths;
- registered Markdown documents exist;
- description length convention;
- local image paths/format integrity;
- `gearItemId`, `gear://`, and `kb://` targets resolve;
- registered relative KB links resolve;
- Catch Species/Location/Gear/presentation references resolve to valid targets/categories;
- exactly one lure-or-bait per Catch;
- no historical inference/fuzzy fallback;
- route ownership and retired Planner behavior remain guarded by tests.

## 16. Editing/storage direction

The current KB is browse-only and does not need IndexedDB simply for symmetry with My Gear. JSON catalog + Markdown documents are appropriate to authored knowledge.

If future KB/Catch editing is requested, add a repository/store layer only when the editing feature justifies it. Do not change storage merely to make all domains physically identical.

## 17. Durable conflicts still unresolved

- PowerBait still-rig hook size: #4 in OneNote examples vs. prior #8 guidance.
- Loop-knot guidance: OneNote warning vs. some lure/presentation recommendations.

Keep both conflicts explicit until deliberately resolved; do not let unrelated content edits silently decide them.
