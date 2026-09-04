# Fishing Companion Knowledge Base Data Model

**Status:** Accepted / implemented / current

**Updated:** 2026-09-04

**Current implementation verification:** The unified KB/Catch architecture originated in PR #13, was extended with flat Equipment taxonomy in PR #24, received the final content/image batch in PR #28, was hardened for transformed Gear-backed pictures in PR #30, completed authored-content acceptance in PR #32, and gained indentation-aware nested Markdown list rendering in PR #34. Latest verified runtime merge is `82601038f0e931f6ef1bee4c8f5e062a73c793c5`; production run #159 / `33850049987` completed tests, build, transformed/local-media validation, bundle verification, GitHub Pages artifact upload, and deployment successfully. The user confirmed the nested-list fix live. The latest audited production content checkpoint before nightly reconciliation is `0b89ebc20de049fe5d072e93edcdcaa7b13d01b2`, production run #161 / `33850346865`, success.

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
- Preserve Markdown headings, tables, nested lists, images, internal links, My Gear links, and external resources.
- Support exact Catch backlinks through structured IDs.
- Validate explicit relationships rather than infer them from prose/display text.
- Keep My Gear, KB, and Catch Log as separate fact owners.
- Preserve offline browsing after content/assets are cached.
- Validate the **final deployable form** whenever the build transforms already-validated KB data.

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
  techniques/                    # Physical home for both Equipment + Technique articles
  knots/
pwa/assets/kb/                   # Repository-local KB-specific images
pwa/assets/gear/                 # Built Gear image assets; may be reused by KB pictures
pwa/local-media.json             # Active repository-local media configuration
pwa/apply-local-media.mjs        # Local image validation/materialization + final KB revalidation
```

`kb.seed.json` contains one `entities` array. Every entity uses the same six logical fields: ID, Type, Name, Description, Picture, Content.

`Content` is represented by a path to one complete Markdown file. The build validates every registered document and internal application link.

Equipment and Technique articles currently share the physical `kb-content/techniques/` directory. The `type` field controls user-facing taxonomy; the directory name does not.

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
| `description` | No | plain text or null | Optional card/page-header subtext; obeys current description validation. |
| `picture` | No | picture object or null | Optional representative card/header image. |
| `content` | Yes | string | Repository-relative path to one complete Markdown document. |

Stable ID is identity. Names, taxonomy, descriptions, picture source, and Markdown paths may change without changing an ID. Existing `technique-*` IDs may therefore remain unchanged even when an article is now `type: equipment`.

## 6. Equipment vs. Technique

The flat five-type taxonomy improves semantic clarity without adding nested navigation.

### Equipment

Use for rigs and terminal presentations, lure-family/equipment guides, rigging-oriented gear knowledge, and practical use/selection information centered on equipment or presentation mechanics.

Examples include Wacky Worm, Ned Rig, Drop Shot, Jigs, Spinnerbait, Chatterbait / Bladed Jig, Crankbait, Jerkbait, Swimbait, Frogs, Inline Spinner, Snaps & Swivels, Flasher Rig, Inline Trolling Rig, Bobber Rig, and Slip Sinker Rig.

### Technique

Use for strategy, seasonal/condition guidance, species-oriented fishing methods, route/boat-control tactics, and broader fishing approaches not centered on one equipment family.

Examples include Trout Fishing, Spring Fishing, paddle-only kayak strategy, seasonal bass guidance, color/scent, and water visibility.

There is no nested taxonomy or subtype field.

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

### Allowed picture sources

A KB `picture.src` may be an `http(s)` URL, a safe repository-local path under `./assets/kb/...`, or a safe repository-local path under `./assets/gear/...` when intentionally reusing a built owned-Gear image. Arbitrary local roots are invalid.

The Gear-backed case is deliberate and required by PR #28's image-reuse design for Swimbait, Jerkbait, Crankbait, Chatterbait, Spinnerbait, and Jig.

Repository-local media is configured in `local-media.json` and validated/materialized by `apply-local-media.mjs`. Validation checks image size, supported format structure/signatures, and extension consistency. PR #32 confirmed the user's replacement Largemouth/Smallmouth Bass images through this same pipeline.

Separate thumbnail files are not required; one source asset is scaled by presentation CSS.

### Final-form validation rule

The build first validates source `kb.seed.json`, but `apply-local-media.mjs` may replace picture metadata in the **built** KB bundle. It therefore re-runs `validateKbBundle()` after all local-media substitutions and before deployment.

This rule was added in PR #30 after PR #28 exposed a gap: source data was valid, but six transformed picture paths were rejected by the old runtime validator. General rule: whenever a build stage mutates already-validated structured data, validate the **final deployable transformed form**, not just the source.

### User-supplied binary convention

ChatGPT must **not** upload/base64-transport user image binaries through connector tool calls. The user uploads the binary directly to the specified GitHub feature branch/path; ChatGPT verifies it and handles text/config/tests/release work.

## 8. Content rules

The complete Markdown document may contain any useful headings and narrative structure, including Use / When to Use, Rigging / Setup, Technique / Retrieve, Gear / Tackle, Notes / Warnings, Resources, tables, nested unordered/ordered lists, external links, `gear://stable-id`, `kb://stable-id`, registered relative KB-document links, and embedded local/external images.

The app does **not** parse headings or prose to infer structured facts or relationships.

Content-only Markdown edits are valid. Renaming or moving a document requires updating the entity's `content` path in `kb.seed.json`.

Authored stable-ID navigation is semantically independent of the heading it appears under. `# Links`, `## Related`, or another sensible section is acceptable; the durable requirement is that the `gear://` / `kb://` target exists. PR #32 changed the final-content regression accordingly.

Markdown list indentation is also semantic. PR #34 changed the custom renderer so indented child items remain nested `<ul>` / `<ol>` structures rather than being flattened. Regression tests cover nested unordered and ordered lists. Correctly authored nested source should not be flattened as a workaround.

## 9. Link rules

- External websites use ordinary Markdown links.
- Registered relative Markdown links become KB routes.
- My Gear navigation uses `gear://stable-gear-id`.
- KB navigation uses `kb://stable-kb-id`.
- Build validation requires internal IDs/registered paths to exist.
- Authored links are navigation, not automatically maintained reverse relationships.
- Tests validate stable-ID link presence/targets, not a particular Markdown heading label.
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

Current core rules:

- immutable catch stable ID;
- historical date/time and size;
- required `speciesId` and `locationId`;
- Markdown exact-spot/depth/structure/conditions narrative;
- optional `rodReelSetupId` only when known;
- optional presentation/technique reference only when explicitly recorded;
- exactly one Lure or Bait stable ID plus name snapshot;
- optional exact catch picture;
- catch-specific Markdown notes and provenance.

Historical setup/technique is never inferred solely from lure type or general context.

## 11. Catch backlinks and pictures

Only Catch records own catch relationships. Backlinks are computed at render time for applicable Location, Species, presentation/Technique/Equipment, setup, lure, and bait pages. KB/Gear records do not store duplicate catch-ID arrays.

If a Catch has an exact `picture`, use it; otherwise, use the linked Species representative picture as the UI fallback. The fallback does not copy Species image data into the Catch record.

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

All five entity-category lists are filtered views of the same entity collection. My Gear owns all `#/inventory/...` routes; KB owns Home and all `#/kb/...` routes.

## 13. Browse/search conventions

- Root Knowledge Base has Search.
- Entity lists show Search at **10+ entries**.
- Smaller lists omit Search.
- Search is a presentation filter; it does not create stored relationships.
- Equipment/Technique remain peer categories rather than nested navigation.

## 14. Production content state

PR #28 refreshed Swimbait, Jerkbait, Crankbait, Chatterbait / Bladed Jig, Spinnerbait, Jigs, Frogs, Drop Shot, Wacky Worm, Ned Rig, and Trout Fishing, and added Inline Spinner, Snaps & Swivels, Flasher Rig, Inline Trolling Rig, Bobber Rig, Slip Sinker Rig, and Spring Fishing.

The user completed a broad manual formatting cleanup of the imported pages on 2026-09-04. Final acceptance reviewed the modified Equipment/Technique documents, fixed residual structure/wrapping issues, validated replacement Largemouth/Smallmouth Bass images, and production-deployed PR #32 successfully.

**PR #28 content acceptance is closed.** Future changes to these articles are ordinary KB maintenance.

After PR #34, the user performed ordinary content-maintenance edits to Buzzbait, Fishing Line, Rods & Reels, and Walking Bait. The audited production content checkpoint is `0b89ebc20de049fe5d072e93edcdcaa7b13d01b2`, run #161 / `33850346865`, success.

## 15. Validation invariants

Build/tests verify at least:

- KB schema version/dataVersion and exact allowed entity fields;
- valid five-type enum;
- unique stable IDs and one-to-one Content paths;
- registered Markdown documents exist;
- description-length convention;
- local picture paths restricted to accepted http(s), `./assets/kb/...`, or `./assets/gear/...` forms;
- local image format/integrity;
- `gearItemId`, `gear://`, and `kb://` targets resolve;
- authored stable-ID navigation is retained independent of section heading;
- registered relative KB links resolve;
- nested unordered/ordered Markdown lists retain indentation-based hierarchy in renderer regression tests;
- Catch Species/Location/Gear/presentation references resolve to valid targets/categories;
- exactly one lure-or-bait per Catch;
- no historical inference/fuzzy fallback;
- route ownership and retired Planner behavior remain guarded by tests;
- **the fully transformed built KB bundle is valid after local-media substitution**.

## 16. Editing/storage direction

The current KB is browse-only and does not need IndexedDB merely for symmetry with My Gear. JSON catalog + Markdown documents are appropriate to authored knowledge.

If future KB/Catch editing is requested, add a repository/store layer only when the editing feature justifies it. Do not change storage merely to make all domains physically identical.

## 17. Current release verification

Latest verified runtime release:

- PR #34 exact head `4c94156416e7bfddfb912991c86bc3e5af66b91c`
- PR CI #158 / `33850003616` — success
- merge `82601038f0e931f6ef1bee4c8f5e062a73c793c5`
- production #159 / `33850049987` — tests, build, transformed/local-media validation, bundle verification, Pages artifact, and Deploy to GitHub Pages all succeeded
- user confirmed nested Chatterbait/Jerkbait lists display correctly in production

Latest verified production content checkpoint: `0b89ebc20de049fe5d072e93edcdcaa7b13d01b2`; production #161 / `33850346865` succeeded through Pages deployment.

## 18. Durable conflicts still unresolved

- PowerBait still-rig hook size: #4 in OneNote examples vs. prior #8 guidance.
- Loop-knot guidance: OneNote warning vs. some lure/presentation recommendations.

Keep both conflicts explicit until deliberately resolved; do not let unrelated content edits silently decide them.
