# Fishing Companion PWA

## Status and architecture

Production is healthy. PR52 head `28d84e650e0b3e1722a81d4abeeed7cb7572662c` passed normal CI #266 / `34185963172`; merge `91ee0966eff5ef95d6a7d192a95b10940d0b534e` passed production #267 / `34186006471`, including actual Pages deployment. Buzzbait KB and Jack Hammer Gear image changes are deployed; FISH062 DONE. See `IMAGE_RELEASE_2026-09-07.md` for exact evidence and source preservation. PR48 remains the latest application-feature release (KB Add/Edit), PR47 deployed Gear schema4/Cylinder Weights, PR49 closed those records, and PR50/51 recovered/reconciled the project. No pending application release. Earlier complete PWA documentation is preserved in `../History/2026-09-07-pre-recovery/pwa/README.md` and `../History/2026-09-07-pre-image-closeout/pwa/README.md`.

Fishing Companion is single-user/offline-capable. GitHub is durable source of truth. Three domains share stable identity, explicit ownership, strict validation, exact feature-driven relationships, authored narrative separation and final transformed-data validation without identical schemas/storage. No Planner, sessions, trip history, accounts, sync or multi-user expansion.

### My Gear

Schema4, 64 records, data version `2026-09-06-my-gear-v4-ordered-links-1`. Sources: `data/gear.seed.json`, `gear-model.js`, `gear-store.js`, `gear-app.js`, `gear-content/` and media pipeline. Structured facts use JSON/IndexedDB; optional Notes use `<stable-id>.md`. No inline Notes, profiles, usage/connections, knowledgeRefs or setup mainLine/leader. Gear Add/Edit generates validated `fishing-companion-gear-change-v1` packages; no direct GitHub writes or competing local DB. Existing IDs read-only; taxonomy/paired-setup administration chat-managed. Ordinary Manufacturer, Model, Specifications, Links optional; ordered links have label/url only. Equipment retains internal key `accessories`, with Kayaks, Tools, Tackle Management, Electronics, Storage, Accessories.

### Knowledge Base

Schema1, 54 entities (8 Locations, 7 Species, 22 Equipment, 7 Techniques, 10 Knots), data version `2026-09-04-kb-v1-final-content-1`. `data/kb.seed.json` indexes complete Markdown documents in `kb-content/`. Envelope id/type/name/optional description/picture/Content path. Flat types location, species, equipment, technique, knot. Equipment displays Gear Guides with subtitle `Equipment, rigs, and presentations reference`. Type, not directory/prefix, controls taxonomy; existing IDs and paths preserved. Add/Edit supports complete Markdown/Preview, source-aware pictures, safe reclassification, validated copyable packages and repository promotion. No atomic guidance schema or duplicate local KB database.

### Catch Log

Schema2, five historical records, data version `2026-09-04-catches-v2-external-notes-1`. `data/catches.seed.json` owns exact known relationships; `catch-content/<id>.md` owns optional narrative. Species/Location required, exactly one Lure/Bait, optional setup/presentation only when known. No inference, generated Notes, Provenance, Planner or sessions. Backlinks derive from Catch-owned references; exact catch picture overrides Species fallback.

## Media, Markdown and offline behavior

`media-sources.json` owns source/provenance; `media-owners.json` exact Gear associations; `local-media.json` active local sources. `apply-local-media.mjs` validates and materializes images. KB may intentionally reuse built Gear media with exact identity. Preserve source bytes/provenance, validate actual format/extension/path/owner/size, and revalidate complete transformed data. No premature deletion or inferred ownership. User binaries are uploaded directly to exact GitHub branch/path/filenames, never transported through the connector. Gear Notes support safe Gear-ID-prefixed sibling images and legacy paths, with exact-byte copying/offline manifests. Existing-picture Edit supports explicit Keep/Replace and same-filename replacement.

PR52 uses the existing source-aware pipeline. The Buzzbait image is an exact-byte copy into `assets/kb/entries/technique-buzzbait.jpg`, registered through the KB overlay with the supplied metadata. Jack Hammer uses the existing `zman-jack-hammer` media ID and exact Gear owner, with local source `assets/gear-source/zman-jack-hammer.png`. Previous remote provenance remains in `media-overrides.json` and the release record; the new upload's external origin is not guessed. Source JSON schemas, data versions, authored Markdown and historical relationships remain unchanged. Do not move/delete source media as a cleanup shortcut. FISH063 separately tracks clearer filename/destination guidance in the editor.

The shared Markdown renderer supports headings, links, images, code, tables, blockquotes, nested/loose lists and continuation paragraphs. Do not flatten valid Markdown. Stable-ID links may appear under any heading; validate targets rather than requiring Related. Root Gear/KB Search always; nonempty search hides category cards. Browse Search at 10+; filters right-aligned where applicable. Card images use square white contain frames, never cropped source rewrites. Line flat, Rods grouped; no raw JSON editor.

## Build, tests and deployment

From repository root:

```bash
node pwa/gear-model.test.mjs
node pwa/my-gear-routing.test.mjs
node pwa/gear-media-policy.test.mjs
node pwa/kb-model.test.mjs
node pwa/kb-routing.test.mjs
node pwa/kb-authoring.test.mjs
node pwa/kb-promotion.test.mjs
node pwa/final-content.test.mjs
node pwa/build.mjs
node pwa/apply-authored-notes.mjs
node pwa/apply-local-media.mjs
node pwa/verify-final-bundle.mjs
```

The permanent `.github/workflows/fishing-pwa-build.yml` runs syntax, model, routing, authoring, media, content, build and final-bundle checks. New runtime modules must be included in the build, versioned module graph and service-worker offline manifest. `node pwa/serve.mjs` serves local development at `http://127.0.0.1:4173`.

Meaningful runtime work uses a feature branch, normal CI against current base, expected-head merge and actual production Pages verification. Once authorized, continue through cleanup and authoritative-record reconciliation without intermediate approval gates. Respect workflow permissions, never omit permanent tests or rerun one-time migrations. Shared `fishing-pages` concurrency has cancel-in-progress true; avoid overlapping releases/main content writes. User-maintained Markdown must not be frozen as an exact full-text fixture; validate durable facts, ownership/paths and links while permitting legitimate edits. PR50 fixed that regression. Historical handoffs and audit branches must not be resumed as pending application work.
