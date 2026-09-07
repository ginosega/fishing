# Fishing Companion PWA

## Status and architecture

Production is healthy. The last user-verified release is PR47, merge `f05b7ec532d8e45f3fc36c1e0976c5ea40eb9983`, production #240 / `34135326910`, September 7, 2026. Gear schema4 and the user-uploaded Cylinder Weights picture are live. KB Add/Edit is the next release, FISH-TODO-060 / PR48 on `feature/kb-authoring`; do not call it deployed before actual verification.

Fishing Companion is a single-user, offline-capable personal application. GitHub is its durable source of truth. Three domains share stable IDs, explicit fact ownership, strict validation, exact feature-driven relationships and authored narrative separation. They intentionally retain domain-appropriate schemas and storage. There is no Planner, sessions, trip history, accounts, synchronization or multi-user scope.

## My Gear

`data/gear.seed.json` → schema validation → IndexedDB → `GearRepository` → `gear-app.js`. Schema4 version `2026-09-06-my-gear-v4-ordered-links-1`, 64 records. Ordinary products require id/category/type/name; manufacturer `{name}`, model, specifications `{label,value}` and ordered links `{label,url}` are optional. Rods & Reels retain strict paired components. Existing IDs are immutable. Internal `accessories` displays Equipment with Types Kayaks, Tools, Tackle Management, Electronics, Storage, Accessories. Category/Type administration is chat-managed.

Optional authored Notes live at `gear-content/<id>.md`; no inline JSON Notes, usage/connections, profiles or speculative knowledgeRefs. `gear://` and `kb://` are authored navigation, not relationship graphs. `#/inventory/new` and `#/inventory/edit/<id>` prepare validated `fishing-companion-gear-change-v1` packages. They do not write GitHub or a competing local store. Existing picture Keep/Replace, same-filename replacement, Notes Markdown/Preview and explicit removal confirmation are supported. New paired setups and component changes remain chat-managed.

## Knowledge Base

`data/kb.seed.json` indexes complete authored documents in `kb-content/`. Schema1 version `2026-09-04-kb-v1-final-content-1`, 54 entities: 8 Locations, 7 Species, 22 Equipment, 7 Techniques, 10 Knots. Fields are id, type, name, optional description/picture, and a required Markdown content path. Description maximum is 80 characters. The five flat types are location, species, equipment, technique and knot. Equipment is displayed as Gear Guides, subtitle `Equipment, rigs, and presentations reference`. Equipment and Technique documents may share legacy directories; type, not path or ID prefix, determines taxonomy.

### Add/Edit authoring

FISH-TODO-060 adds `#/kb/new`, `#/kb/new/<type>`, and `#/kb/edit/<id>` using the same handoff model as Gear. A complete Markdown article is edited with source and Preview; it is not an extra Notes field or atomic guidance schema. New IDs are generated from the initial type/name, and new content paths from the stable ID. Existing IDs and paths never change on rename or reclassification. Existing ID prefixes are historical identity, not validation constraints. A reclassification must preserve exact Catch references or be rejected.

The browser prepares `fishing-companion-kb-change-v1` packages containing a source version, original source/display entity, original Markdown, exact media mapping, proposed entity/content/picture actions and a human-readable summary. It never directly writes GitHub or maintains a competing KB database. Taxonomy changes remain chat/repository work.

Picture Yes/No, current-image preview/source, Keep/Replace, new upload, explicit Gear-image reuse, metadata and removal confirmation follow the existing Gear conventions. Uploaded hero images use safe KB-ID-prefixed filenames under `assets/kb/entries/`, with exact current filenames allowed for replacement. The upload is performed directly by the user on the designated GitHub branch. Existing media bytes are never deleted as an incidental edit. Supporting raster images may be placed beside the Markdown with an ID-prefixed filename or in `assets/kb/`; validate actual format, extension, size, path, ownership, and offline inclusion.

The repository index and deployed picture overlays are separate representations. `kb-authoring-source.json` is the untransformed source snapshot, `kb-media.json` is the active KB overlay, and `kb-picture-model.js` resolves exact media associations for both build and authoring. No displayed image path is blindly promoted into the canonical source. `promote-kb-change.mjs` validates stale source/Markdown/media, the complete candidate and exact relationships, upload bytes and image ownership. It dry-runs by default; explicit `--apply` writes the reviewed source files on a feature branch. Old image/provenance metadata is retained in `kb-media-history.json` when associations change. No historical migration is required.

## Catch Log

Schema2 version `2026-09-04-catches-v2-external-notes-1`, five catches. Required exact Species/Location and one Lure/Bait, optional known setup/technique, historical name snapshot and measured size. No inferred historical relationships, Planner, sessions, or duplicate narrative/provenance fields. Optional Notes are `catch-content/<catch-id>.md`. Backlinks are computed from Catch-owned forward references. Exact catch picture overrides Species fallback. Catch authoring is not part of FISH-TODO-060.

## Media and Markdown

`media-sources.json` owns Gear provenance, `media-owners.json` owns exact Gear associations, `local-media.json` registers active local assets, and `apply-local-media.mjs` materializes them without recompression. Preserve original IDs/owners and remote provenance. The final transformed data must be validated after image substitution; source-only checks do not prevent the historical PR30 startup-failure class. The user uploads actual images directly to GitHub; the assistant handles manifests, validation and release. Never base64-transport user image bytes through the connector.

The shared Markdown renderer supports headings, links, images, code, tables, blockquotes, nested/loose lists and continuation paragraphs. Do not flatten valid Markdown to work around rendering. Stable-ID links may appear under any heading; validate targets rather than requiring a Related heading. Source paths and exact authored text are preserved. Card images use square white contain frames, never cropped rewrites. Root Gear/KB Search is always available; nonempty search hides category cards. Browse Search appears at 10+ records; filters are right-aligned where applicable.

## Build, tests and deployment

From the repository root:

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

The permanent `.github/workflows/fishing-pwa-build.yml` runs syntax, model, routing, authoring, media, content, build and final-bundle checks. New runtime modules must be included in the build, versioned module graph and service-worker offline manifest, including the canonical KB authoring/overlay metadata. `node pwa/serve.mjs` serves local development at `http://127.0.0.1:4173`.

Meaningful runtime changes use a feature branch and PR, exact final-head/current-base CI, expected-head merge, and verified production deployment. Shared Pages concurrency is `fishing-pages` with `cancel-in-progress:true`. Do not overlap direct-main content writes with release validation. Temporary source integration tools must be removed before final PR CI. Respect workflow permissions and do not rerun one-time migrations. Preserve all existing records and authored files. The September 6 release handoff is historical; current state is in the root Context/TODO/Decision Log/bootstrap.
