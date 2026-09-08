# Fishing Companion PWA

**Status: production healthy.** Latest content release PR58, merge `8cceecc42d7ffab1c672e6991378d032136145b4`, production #298 / `34189948481` succeeded September 8, 2026 including actual GitHub Pages deployment. Perception Joyride 10.0 is registered as owned Gear and the Rods & Reels picture caption is `Baitcasting reel`. See [latest release closeout](RELEASE_2026-09-08_JOYRIDE_RODS_CAPTION.md). No application release is pending. Source counts are Gear4/66, KB1/54, Catch2/5.

## Architecture

The application is a single-user, offline-capable Progressive Web App published at https://ginosega.github.io/fishing/. GitHub is the durable source of truth. Structured source JSON, stable-ID authored Markdown, validated media manifests and a versioned build produce the deployed bundle. Historical markdown, Topics, OneNote/PDF and migration records are reference material rather than competing runtime databases.

My Gear uses `data/gear.seed.json`, schema4, dataVersion `2026-09-08-my-gear-v4-perception-joyride-1`, with 66 records. `gear-store.js` provides IndexedDB persistence; seed-managed stores receive accepted version changes, while non-seed local records must be preserved. Structured facts use stable IDs, manufacturer `{name}`, optional model/specifications and ordered links `{label,url}`. Optional Notes are separate `gear-content/<gear-id>.md` files; no inline Notes or retired profiles/connection fields. Internal category `accessories` displays Equipment with fixed Types including Kayaks and Accessories.

The Knowledge Base uses `data/kb.seed.json`, schema1, 54 entities, dataVersion `2026-09-08-kb-v1-rods-reels-caption-1`. Flat types are location, species, equipment, technique and knot. Each entry has a stable ID, name, optional description/picture and complete authored Markdown Content in `kb-content/`. Equipment displays Gear Guides. The Catch Log uses `data/catches.seed.json`, schema2, five historical records, dataVersion `2026-09-04-catches-v2-external-notes-1`. Exact known relationships and optional stable-ID narrative are preserved. No Planner, sessions, speculative relationship graph, accounts or multi-user expansion.

Browser Add/Edit creates validated copyable handoff packages for chat/repository promotion. It does not write GitHub or create another authoritative database. `gear://` and `kb://` are authored navigation. Stable IDs, explicit media ownership, safe paths, source provenance and final transformed-data validation govern all domains.

## Build and tests

Use Node.js 22. `.github/workflows/fishing-pwa-build.yml` is the authoritative complete gate; do not omit its permanent tests or replace it with an incomplete approximation. Current permanent release gates include:

```sh
node pwa/accepted-2026-09-08.test.mjs
node pwa/accepted-2026-09-08-joyride-caption.test.mjs
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
node pwa/accepted-2026-09-08.test.mjs --dist
node pwa/accepted-2026-09-08-joyride-caption.test.mjs --dist
```

The workflow also validates JavaScript syntax, required output files, stable data versions and historical content invariants. `build.mjs` writes `dist/`; authored Notes and local media are materialized and then the complete transformed bundle is revalidated. The Joyride/caption regression verifies the exact submitted structured item, no Notes, explicit media owner, source blob/size, byte-identical built image and Rods & Reels caption in source and final KB data. Previous Dagger and three-KB-image regression coverage remains intact.

Production is deployed from main by the same workflow through GitHub Actions and Pages. Meaningful runtime work uses a feature branch/PR, current-base normal CI, expected-head merge and actual Pages deployment verification. The Pages concurrency group is `fishing-pages`, cancel-in-progress. Respect denied workflow permissions; do not bypass them or remove tests to obtain a green build.

## Media and current release

My Gear media is registered in `media-sources.json`, `media-owners.json`, `media-overrides.json` and `local-media.json`. Canonical source and transformed display assets are distinct. Local Gear images belong under `assets/gear-source/`, while built display assets belong under `assets/gear/`. KB images use approved `assets/kb/` locations or validated authored-content paths. Preserve original bytes, stable ownership and provenance; never infer an owner from a filename or discard old source bytes as a replacement side effect.

Perception Joyride 10.0 is Gear/media ID `perception-joyride-10-0`. Its source is `assets/gear-source/perception-joyride-10.png`, Git blob `f24403f79788755e267ee721f5e93c34c3f8f472` (562530 bytes), explicitly owned by that Gear ID. The built asset is `assets/gear/perception-joyride-10-0.png` and is checked byte-for-byte against the source. No Notes were created. Submitted type `Accessories` and all submitted specifications/link are preserved exactly.

Dagger Axis 10.5 remains Gear/media ID `dagger-axis-10-5`, with confirmed Length `10' 6"` and the latest user-replaced source preserved. The three prior KB hero pictures remain registered. Rods & Reels still uses `assets/kb/entries/technique-rods-reels.png`, alt `Baitcasting reel`, now caption `Baitcasting reel`; its authored Markdown and picture bytes were not changed. Fishing Line explicitly links to `sufix-832-15`; no additional associations are inferred.

FISH063 remains OPEN for clearer KB image filename/upload-destination guidance; PR58 did not alter that editor usability issue.

## Authoritative records and history

The root README, Context, TODO, Decision Log and bootstrap describe current project state. Complete earlier documentation is preserved in Git history and `History/`. New work must restore current main and consult the canonical TODO rather than resuming a historical release branch.
