# Fishing Companion PWA

**Status: production healthy.** Latest maintenance release PR56, merge `531f04a84c0d75e2a7f23dc368149de5026b607b`, production #285 / `34188668110` succeeded September 8, 2026 including actual GitHub Pages deployment. Dagger Axis 10.5 Length is corrected to `10' 6"`, and hero pictures for Fishing Line, Walking Bait and Rods & Reels are deployed. No application release is pending. Current domain source counts are Gear4/65, KB1/54, Catch2/5.

## Architecture

The application is a single-user, offline-capable Progressive Web App published at https://ginosega.github.io/fishing/. GitHub is the durable source of truth. Structured source JSON, stable-ID authored Markdown, validated media manifests and a versioned build produce the deployed bundle. Historical markdown, Topics, OneNote/PDF and migration records are reference material rather than competing runtime databases.

My Gear uses `data/gear.seed.json`, schema4, dataVersion `2026-09-08-my-gear-v4-dagger-length-1`, with 65 records. The browser's `gear-store.js` provides IndexedDB persistence; seed-managed stores receive accepted version changes, while non-seed local records must be preserved. Structured facts use stable IDs, manufacturer `{name}`, optional model/specifications and ordered links `{label,url}`. Rod/reel setups have explicit component records. Optional Notes are separate `gear-content/<gear-id>.md` files; no inline Notes or retired profiles/connection fields. Internal category `accessories` displays Equipment with six fixed Types, including Kayaks.

The Knowledge Base uses `data/kb.seed.json`, schema1, 54 entities, dataVersion `2026-09-08-kb-v1-three-hero-images-1`. Flat types are location, species, equipment, technique and knot. Each entry has a stable ID, name, optional description/picture and complete authored Markdown Content in `kb-content/`. Equipment displays Gear Guides. The Catch Log uses `data/catches.seed.json`, schema2, five historical records, dataVersion `2026-09-04-catches-v2-external-notes-1`. Exact known relationships and optional stable-ID narrative are preserved. No Planner, sessions, speculative relationship graph, accounts or multi-user expansion.

Browser Add/Edit creates validated copyable handoff packages for chat/repository promotion. It does not write GitHub or create another authoritative database. `gear://` and `kb://` are authored navigation. Stable IDs, explicit media ownership, safe paths, source provenance and final transformed-data validation govern all domains.

## Build and tests

Use Node.js 22. From the repository root, follow `.github/workflows/fishing-pwa-build.yml`; it is the authoritative complete gate and must not be replaced by an incomplete approximation. Permanent gates include accepted kayak correction/KB image validation, Dagger source/ownership validation, Gear/KB/Catch model/routing/authoring/media tests, build, authored Notes materialization, local-media materialization and final transformed-bundle verification.

The production build is deployed by `.github/workflows/fishing-pwa-build.yml` on main through GitHub Actions and Pages. Meaningful runtime work uses a feature branch/PR, current-base normal CI, exact-head merge and actual Pages deployment verification. The Pages concurrency group is `fishing-pages`, with cancel-in-progress. Coordinate concurrent direct-main uploads and releases. Respect denied workflow permissions; do not bypass them or remove tests to obtain a green build.

## Media and current release

My Gear media is registered in `media-sources.json`, `media-owners.json`, `media-overrides.json` and `local-media.json`. Canonical source and transformed display asset are distinct. Local Gear images belong under `assets/gear-source/`, while built display assets belong under `assets/gear/`. KB images use approved `assets/kb/` locations or validated authored-content paths. Preserve original bytes, stable ownership and provenance; never infer an owner from a filename or discard old source bytes as a replacement side effect.

The Dagger Axis 10.5 is ID/media ID `dagger-axis-10-5`, with source `assets/gear-source/dagger-axis-10-5.png` and built asset `assets/gear/dagger-axis-10-5.png`. Its explicit owner is the same Gear ID. Current Length is `10' 6"`; the other submitted fields and link order remain unchanged, and no Notes were created. Current source Git blob is `17ad66ac19cc0a71f3ca4c3fd4ea6ec5e881ac51` (393226 bytes); prior source versions remain preserved in Git history.

PR56 registered these KB hero images without changing authored Markdown:
- Fishing Line: `assets/kb/entries/technique-fishing-line.jpg`, alt `Sufix 832 fishing line`, explicit Gear association `sufix-832-15`.
- Walking Bait: `assets/kb/entries/technique-walking-bait.jpg`, alt `Heddon Zara Spook`, no inferred owner/provenance.
- Rods & Reels: `assets/kb/entries/technique-rods-reels.png`, alt `Baitcasting reel`, no inferred owner/provenance.

PR52 previously registered Buzzbait and Jack Hammer pictures. Its source-aware metadata and historical provenance remain intact. The separate filename-usability issue FISH063 remains open. See `DAGGER_AXIS_RELEASE_2026-09-08.md` for exact latest release evidence.

## Authoritative records and history

The root README, Context, TODO, Decision Log and bootstrap describe current project state. Complete earlier documentation is preserved in Git history and `History/`. Start every change by restoring current main and the canonical TODO rather than resuming a historical release branch.
