# Fishing Companion PWA

**Status: deployed baseline healthy; approved Gear schema4 refinement pending release.** Reconciled for the 2026-09-06 chat handoff. The exact unmerged source, test evidence, and release obligations are in `../Fishing_Release_Handoff_2026-09-06.md`.

## Product model and source of truth

Fishing Companion is a single-user, offline-capable personal PWA with three durable domains: My Gear, Knowledge Base, and Catch Log. They share stable identity, explicit ownership, strict validation, feature-driven relationships, and authored-narrative separation without forcing identical schemas or storage. There is no current need for accounts, synchronization, access control, Planner, fishing sessions, trip history, or a multi-user product.

The last verified production/main checkpoint is `cdb1c500f08394a9c44ea2012b6de72adbd46ecc`, merged PR45, with production workflow#235 reported successful. PR44's module-cache hotfix restored My Gear navigation and was user-confirmed. The pending feature branch is `feature/gear-guides-ordered-links`, head `24ea22ac187f81b42c2d91743e0a470ba3d1ad94`. Its temporary migration/build checks passed, but it has no normal PR, merge, or production deployment yet. Do not call the pending schema4 features live.

## My Gear architecture

```text
pwa/data/gear.seed.json
        ↓
strict versioned schema validation
        ↓
IndexedDB local store
        ↓
GearRepository
        ↓
structured My Gear UI
```

Runtime/source owners: `data/gear.seed.json`, `gear-model.js`, `gear-store.js`, `gear-app.js`, `gear-content/`, `apply-authored-notes.mjs`, `media-owners.json`, `media-sources.json`, `local-media.json`, `apply-local-media.mjs`, and `media-ui.js`. The store is local-first, but GitHub remains the authoritative durable source. Seed-managed stores refresh deterministically when schema/data version changes; imported/non-seed data must not be silently discarded.

### Deployed and pending versions

| Property | Deployed main | Approved pending feature |
|---|---|---|
| Schema | 3 | 4 |
| Data version | `2026-09-06-my-gear-v3-bonafide-rvr119-1` | `2026-09-06-my-gear-v4-ordered-links-1` |
| Records | 64 | 64, same stable IDs |
| Eighth category label | Accessories | Equipment (key remains `accessories`) |
| Sixth Type | Miscellaneous | Accessories |
| Links | Legacy typed links and manufacturer URL | Ordered `{label,url}` pairs only |
| Notes | External stable-ID Markdown | Same, plus sibling images |
| Existing-picture edit | Earlier filename-based handoff | Actual source/identity, explicit Keep/Replace |

The Equipment Types are Kayaks, Tools, Tackle Management, Electronics, Storage, Accessories. The approved light-blue kayak/gray-paddle SVG is retained. Taxonomy administration is chat/repository work; forms may select or reclassify among existing values, but cannot add, remove, or rename Categories/Types.

### Structured facts and authored Notes

Ordinary product records require id, category, type, and name. Manufacturer, Model, Specifications, and Links are optional when genuinely unavailable. Rods & Reels use a strict paired setup with rod/reel component value objects. Stable IDs never change with display names. Do not reintroduce profiles, usage/connections, knowledgeRefs, setup mainLine/leader, raw HTML guidance, or inline JSON Notes.

Optional authored Notes are solely `gear-content/<gear-id>.md`. The loader uses stable IDs and a generated manifest, returns no Notes when absent, and has no inline JSON fallback. `gear://` and `kb://` are authored navigation links, not a maintained relationship graph. Normal Markdown edits may be made directly on main; the Pages workflow still rebuilds/deploys. Do not lock the Notes count to an exact historical number as the collection grows.

### Browser Add/Edit authoring

PR42 deployed `#/inventory/new` and `#/inventory/edit/<stable-id>`. The browser validates records and generates `fishing-companion-gear-change-v1` packages for chat/repository promotion. It does not write GitHub or create a divergent local Gear database. Existing IDs are read-only. Rods & Reels retain limited setup identity/Notes editing; new paired setups and component/media edits remain chat-managed.

The pending refinement removes Manufacturer URL and Link Type controls. Manufacturer has only name; links are repeatable ordered Link Text/URL pairs. Migration moves former manufacturer URLs into first link positions and preserves subsequent order. Links render in stored order without deduplication/reclassification that would change author intent; empty Links sections remain absent. The New Gear Item subtitle is `Create a new Gear item entry for handoff.` The schema3→4 upgrade preserves non-seed local records and converts legacy fields. Validate the complete candidate bundle, not merely individual input controls.

Picture and Notes each use required Yes/No controls. Notes Yes reveals Markdown and Preview. Existing Notes are prepopulated; absent Notes can be created. Existing-picture Yes shows actual source/media identity and explicit Keep/Replace. Same-filename replacement is supported. Removing existing Notes/picture requires confirmation. The package records proposed actions and exact file paths. Validation means ready for handoff, not already saved.

## Knowledge Base and Catch Log

KB schema1/data version `2026-09-04-kb-v1-final-content-1`: 54 entities (8 Locations,7 Species,22 Equipment,7 Techniques,10 Knots). The unified envelope is id, type, name, optional description/picture, and complete Markdown Content path. Types are location,species,equipment,technique,knot. Equipment is a flat peer type for rigs/presentations/gear guides; Technique is for strategy/conditions/species-oriented methods. They currently share `kb-content/techniques/`, and entity type determines browse placement. Stable IDs may retain historical prefixes.

The pending KB card label is **Gear Guides**, exact subtitle `Equipment, rigs, and presentations reference`. The internal `equipment` type and all entity IDs remain unchanged. KB remains a browsable information repository, not a Planner or new atomic article editor.

Catch Log schema2/data version `2026-09-04-catches-v2-external-notes-1`:5 catches. Structured facts and exact Species/Location, one Lure/Bait, optional known setup/technique; no historical inference or sessions. Optional authored Notes are `catch-content/<catch-id>.md`. No structured Exact Spot Notes, generated Notes, source/Provenance, or additional speculative gear relationships. Catch backlinks are computed from forward references. An exact catch image overrides the linked Species-picture fallback.

Sources: `data/kb.seed.json`, `data/catches.seed.json`, `kb-model.js`, `kb-app.js`, `kb-content/`, `catch-content/`, `markdown-render.js`, and shared authored-Notes build. Further rationale is in `KB_DATA_MODEL_DESIGN.md` and `DATA_MODEL_RECONCILIATION_DESIGN.md`.

## Authored Markdown and media

The safe custom renderer supports headings, paragraphs, tables, blockquotes, code, emphasis, images, links, nested lists, and loose ordered-list continuation paragraphs. PR34/41 fixed list behavior; do not flatten valid source as a workaround. Authored navigation may use `gear://`/`kb://` under any sensible heading; validate exact stable-ID targets, not a required Related heading. Raw app routes/direct Markdown links are not the durable navigation convention.

### Image ownership and sources

`media-sources.json` owns media source/provenance metadata; `media-owners.json` owns exact stable Gear association. `media-ui.js` must never infer identity from aliases, headings, manufacturer/model text, or labels. `local-media.json` configures active local images. KB pictures may intentionally reuse built Gear assets through explicit identity, or use safe local KB paths/HTTP(S) sources.

User images are uploaded directly to the specified GitHub branch/path. Never transport/reconstruct user image bytes/base64 through the ChatGPT/GitHub connector. Assistant verifies uploaded files and changes text manifests/data/tests. The local-media stage validates actual signatures/structure, extension, nonempty size, and upper bounds, copies exact bytes without recompression, updates metadata, verifies bytes, and revalidates the final transformed data.

### Approved sibling Notes-image policy — pending release

Supporting images may live beside their Markdown in `pwa/gear-content/`. Use safe lowercase filenames prefixed with the Gear stable ID, for example:

```text
pwa/gear-content/
  bonafide-rvr119.md
  bonafide-rvr119-bow-hatch.png
```

The Markdown may contain `![Bow hatch](bonafide-rvr119-bow-hatch.png)`. The build accepts referenced JPEG/PNG/WebP/GIF, checks actual format against extension, safe owner/path, nonempty files no larger than10MiB, and copies exact bytes into the deploy bundle. Referenced assets are included in the offline manifest. Legacy `assets/gear-notes/` references remain valid. The hero/thumbnail picture has separate media ownership. Newly uploaded images become visible in Preview after deployment; no browser-local image storage is implied.

### Approved legacy picture replacement — pending release

Edit displays current deployed asset, stable media ID, and actual remote source or repository source path. With Picture Yes, choose Keep current picture (default) or Replace picture. Replacement can reuse the same filename, and the handoff includes the existing media ID/source plus `pwa/assets/gear-source/<filename>`. After direct user upload, repository promotion preserves original media ID/owner, registers the new local source, and retains old remote provenance. Do not delete current media before replacement validation. No bulk conversion is required.

Cylinder Weights: Gear ID `cylinder-weights`, media ID `thkfish-cylinder-weights`; proposed replacement path `pwa/assets/gear-source/cylinder-weights.png` or matching actual extension. No replacement image has yet been supplied or registered. Bonafide RVR119 already has a valid local image and its exact authored Notes; preserve them.

## Routes and UI conventions

My Gear owns `#/inventory`, `#/inventory/{category}`, `#/inventory/item/{id}`, `#/inventory/new`, and `#/inventory/edit/{id}`. KB owns home, KB category/entity, catches and catch detail routes. Root Gear/KB Search is always present; nonempty query hides category cards and shows results directly below controls. Browse Search appears at10+ items; filters right-aligned when present. Line is flat, Rods & Reels grouped. No Knots category in My Gear, no raw JSON editor.

Card thumbnails use square white frames with `object-fit:contain`, preserving full source aspect ratio; no source rewrite to square files. Lure labels include Soft plastics and swimbaits, Topwater, and Trolling. Stored `Trolling lures` remains an intentional display alias.

## Build and validation

From repository root, `node pwa/serve.mjs` runs local development at `http://127.0.0.1:4173`. The release pipeline runs:

```bash
node pwa/build.mjs
node pwa/apply-authored-notes.mjs
node pwa/apply-local-media.mjs
```

The pending feature adds permanent `image-validation.mjs`, `gear-media-policy.test.mjs`, and `verify-final-bundle.mjs`. The final normal workflow must invoke the policy tests and final-bundle verifier after build/media transformations. Validate all required assets, exact media owners, schemas, and final paths. The source-only validator is insufficient after transformation. Do not re-run one-time migration scripts against schema4.

The temporary workflow passed the complete tests/build in run#5 /`34088142949`, but push failed due GitHub workflow-file permission. Run#6 /`34088215783` successfully committed the recovered source, producing head`24ea22ac187f81b42c2d91743e0a470ba3d1ad94`. The permanent workflow integration and final PR CI are still pending. The full cleanup list and exact next steps are in the release handoff.

## Release process and history

Meaningful runtime changes use normal feature/fix branches and PRs. Fetch current main first, preserve user edits, verify exact final head/base CI, merge with expected head SHA, then verify production build and actual Deploy to GitHub Pages. The shared `fishing-pages` concurrency group uses `cancel-in-progress:true`; avoid overlapping direct-main edits and release workflows. Respect GitHub workflow-file permissions; do not bypass them or silently omit required CI changes.

Current deployed baseline is PR45. Prior releases: PR39 external Gear/Catch Notes, PR41 loose-list renderer, PR42 Add/Edit authoring, PR44 module-cache hotfix (user-confirmed), PR45 Bonafide. PR28 content acceptance is closed through PR32. Historical exact release SHAs/runs are preserved in the Decision History and Git history; do not treat historical 63-record/PR42 snapshots as current.

The immediate release task is FISH-TODO-058. Finish the preserved feature branch, remove temporary migration artifacts, integrate permanent tests, run normal PR CI, merge and verify actual Pages deployment. Only then update production status and mark it complete. FISH-TODO-059 separately tracks the user-supplied Cylinder Weights replacement.