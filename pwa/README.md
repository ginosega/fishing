# Fishing Companion PWA

**Status: production healthy.** Latest maintenance release PR54, merge `0c07816b33c282cbc31e162812ad15c45d3a4bbe`, production #274 / `34187188334` succeeded September 8, 2026. The Dagger Axis 10.5 addition is deployed. See [Dagger release closeout](DAGGER_AXIS_RELEASE_2026-09-08.md). No application release is pending. Current domain source counts are Gear4/65, KB1/54, Catch2/5.

## Architecture

The application is a single-user, offline-capable Progressive Web App published at https://ginosega.github.io/fishing/. GitHub is the durable source of truth. Structured source JSON, stable-ID authored Markdown, validated media manifests and a versioned build produce the deployed bundle. Historical markdown, Topics, OneNote/PDF and migration records are reference material rather than competing runtime databases.

My Gear uses `data/gear.seed.json`, schema4, dataVersion `2026-09-08-my-gear-v4-dagger-axis-1`, with 65 records. The browser's `gear-store.js` provides IndexedDB persistence; seed-managed stores receive accepted version changes, while non-seed local records must be preserved. Structured facts use stable IDs, manufacturer `{name}`, optional model/specifications and ordered links `{label,url}`. Rod/reel setups have explicit component records. Optional Notes are separate `gear-content/<gear-id>.md` files; no inline Notes or retired profiles/connection fields. Internal category `accessories` displays Equipment with six fixed Types, including Kayaks.

The Knowledge Base uses `data/kb.seed.json`, schema1, 54 entities, dataVersion `2026-09-04-kb-v1-final-content-1`. Flat types are location, species, equipment, technique and knot. Each entry has a stable ID, name, optional description/picture and complete authored Markdown Content in `kb-content/`. Equipment displays Gear Guides. The Catch Log uses `data/catches.seed.json`, schema2, five historical records, dataVersion `2026-09-04-catches-v2-external-notes-1`. Exact known relationships and optional stable-ID narrative are preserved. No Planner, sessions, speculative relationship graph, accounts or multi-user expansion.

Browser Add/Edit creates validated copyable handoff packages for chat/repository promotion. It does not write GitHub or create another authoritative database. `gear://` and `kb://` are authored navigation. Stable IDs, explicit media ownership, safe paths, source provenance and final transformed-data validation govern all domains.

## Build and tests

Use Node.js 22. From the repository root, run the standard test scripts and build in the same order as `.github/workflows/fishing-pwa-build.yml`. The workflow is the authoritative complete gate; do not omit its permanent tests or replace it with an incomplete local approximation.

```sh
node pwa/dagger-axis.test.mjs
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
node pwa/dagger-axis.test.mjs --dist
```

The workflow also checks JavaScript syntax and required output files, image assets, stable data versions and historical content invariants. `build.mjs` writes `dist/` and validates structured Gear/KB/Catch sources and authored links. `apply-authored-notes.mjs` copies validated Notes and images. `apply-local-media.mjs` validates local source bytes, explicit owners and KB picture overlays, then materializes final display assets. `verify-final-bundle.mjs` validates the complete transformed bundle after all media stages. The Dagger regression test verifies exact authored fields, source blob/format, owner and byte-identical built image. Do not run old one-time migrations or treat user-maintained Markdown as a frozen full-text fixture.

The production build is deployed by `.github/workflows/fishing-pwa-build.yml` on main through GitHub Actions and Pages. Meaningful runtime work uses a feature branch/PR, current-base normal CI, exact-head merge and actual Pages deployment verification. The Pages concurrency group is `fishing-pages`, with cancel-in-progress. Coordinate concurrent direct-main uploads and releases. Respect denied workflow permissions; do not bypass them or remove tests to obtain a green build.

## Media and current addition

My Gear media is registered in `media-sources.json`, `media-owners.json`, `media-overrides.json` and `local-media.json`. The canonical source and transformed display asset are distinct. Local Gear images belong under `assets/gear-source/`, while built display assets belong under `assets/gear/`. KB images use approved `assets/kb/` locations or validated authored-content paths. Preserve original bytes, stable ownership and provenance; never infer an owner from a filename or discard old source bytes as a replacement side effect.

The Dagger Axis 10.5 is ID/media ID `dagger-axis-10-5`, with source `assets/gear-source/dagger-axis-10-5.png` and built asset `assets/gear/dagger-axis-10-5.png`. Its explicit owner is the same Gear ID. The source Git blob is `b6b9c96057adda124b7369952e851b13cf2f3b7b` (563763 bytes). All submitted product fields and link order are preserved; no Notes were created. The submitted Length `12' 6"` is retained pending FISH065 confirmation. Previous Gear, KB/Catch, media and authored content are unchanged. The independent user upload `assets/kb/entries/technique-fishing-line.jpg` was preserved without inferred association.

PR52 previously registered the Buzzbait and Jack Hammer pictures. Its source-aware metadata and historical provenance remain intact. The separate filename-usability issue FISH063 is open; it is not a defect in the completed Dagger deployment. See `IMAGE_RELEASE_2026-09-07.md` and `DAGGER_AXIS_RELEASE_2026-09-08.md` for exact release evidence.

## Authoritative records and history

The root README, Context, TODO, Decision Log and bootstrap describe current project state. Complete earlier documentation is preserved in Git history and `History/`, including the exact pre-Dagger copies under `History/2026-09-08-pre-dagger-addition/`. The Dagger release is closed; user browser acceptance and independent live HTTP verification are not claimed merely from successful CI. The next change must restore current main and consult the canonical TODO rather than resuming a historical release branch.
