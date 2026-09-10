# Fishing Companion PWA

**Historical v1 reference.** The authorized production transition and sole active pipeline are recorded in [v2 production release](../Fishing_v2_Production_Release_2026-09-10.md). The build/deployment instructions below are historical; do not run a competing v1 publication. Exact v1 recovery bytes remain in Git.

**Status: production healthy.** Latest application release PR60, final head `cd47dc9ce39660840de493346e7df9fda72a14e5`, normal CI #307 / `34191643311`, merge `ecd9f3d52ca8180ea4f48ec888e7574105deafda`, production #308 / `34191692935`, including actual GitHub Pages deployment. Gear schema4/66 uses `2026-09-08-my-gear-v4-perception-joyride-1`; KB schema1/54 uses `2026-09-08-kb-v1-cranberry-lake-picture-1`; Catch schema2/5 remains `2026-09-04-catches-v2-external-notes-1`. FISH069 and FISH070 are DONE; FISH063 remains OPEN. No application release is pending. See `pwa/RELEASE_2026-09-08_CRANBERRY_COPY.md`.

## Architecture

The application is a single-user, offline-capable Progressive Web App published at https://ginosega.github.io/fishing/. GitHub is the durable source of truth. Structured source JSON, stable-ID authored Markdown, validated media manifests and a versioned build produce the deployed bundle. Historical markdown, Topics, OneNote/PDF and migration records are reference material rather than competing runtime databases.

My Gear uses `data/gear.seed.json`, schema4, dataVersion `2026-09-08-my-gear-v4-perception-joyride-1`, with 66 records. `gear-store.js` provides IndexedDB persistence; seed-managed stores receive accepted version changes, while non-seed local records must be preserved. Structured facts use stable IDs, manufacturer `{name}`, optional model/specifications and ordered links `{label,url}`. Optional Notes are separate `gear-content/<gear-id>.md` files; no inline Notes or retired profiles/connection fields. Internal category `accessories` displays Equipment with fixed Types including Kayaks and Accessories.

The Knowledge Base uses `data/kb.seed.json`, schema1, 54 entities, dataVersion `2026-09-08-kb-v1-cranberry-lake-picture-1`. Flat types are location, species, equipment, technique and knot. Each entry has a stable ID, name, optional description/picture and complete authored Markdown Content in `kb-content/`. Equipment displays Gear Guides. The Catch Log uses `data/catches.seed.json`, schema2, five historical records, dataVersion `2026-09-04-catches-v2-external-notes-1`. Exact known relationships and optional stable-ID narrative are preserved. No Planner, sessions, speculative relationship graph, accounts or multi-user expansion.

Browser Add/Edit creates validated copyable handoff packages for chat/repository promotion. It does not write GitHub or create another authoritative database. `gear://` and `kb://` are authored navigation. Stable IDs, explicit media ownership, safe paths, source provenance and final transformed-data validation govern all domains.

## Build and tests

Use Node.js 22. `.github/workflows/fishing-pwa-build.yml` is the authoritative complete gate; do not omit its permanent tests or replace it with an incomplete approximation. Current permanent release gates include:

```sh
node pwa/accepted-2026-09-08.test.mjs
node pwa/accepted-2026-09-08-joyride-caption.test.mjs
node pwa/cranberry-lake-picture.test.mjs
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
node pwa/cranberry-lake-picture.test.mjs --dist
```

The workflow also validates JavaScript syntax, required output files, stable data versions and historical content invariants. `build.mjs` writes `dist/`; authored Notes and local media are materialized and then the complete transformed bundle is revalidated. The Joyride/caption regression verifies the exact submitted structured item, no Notes, explicit media owner, actual source format and byte-identical built image and Rods & Reels caption in source and final KB data. Previous Dagger and three-KB-image regression coverage remains intact.

Production is deployed from main by the same workflow through GitHub Actions and Pages. Meaningful runtime work uses a feature branch/PR, current-base normal CI, expected-head merge and actual Pages deployment verification. The Pages concurrency group is `fishing-pages`, cancel-in-progress. Respect denied workflow permissions; do not bypass them or remove tests to obtain a green build.

## Media and current release

PR60 registered Cranberry Lake hero media at `assets/kb/entries/location-cranberry-lake-deception-pass.png`, alt/caption `Cranberry Lake`, with null credit/sourceUrl and no inferred ownership. The PNG is blob `201852612f8985fba057bfe224292bfe2a24d69d` (1,981,945 bytes) at release time. The KB dataVersion is `2026-09-08-kb-v1-cranberry-lake-picture-1`. Its exact authored Markdown and other entity facts are unchanged. The permanent Cranberry regression checks source identity, metadata, actual format and exact published image/Markdown copies. Historical hashes are evidence, not locks on user-maintained sources.

Home and KB root share `Fishing reference and catch log`; Gear Guides uses `Equipment, rig, and presentation reference`; Catch Log uses `Recorded catches`; Techniques uses `Strategy, conditions, and species reference` without a period. The existing KB routing test enforces card/page consistency. See [latest release](RELEASE_2026-09-08_CRANBERRY_COPY.md).


My Gear media is registered in `media-sources.json`, `media-owners.json`, `media-overrides.json` and `local-media.json`. Canonical source and transformed display assets are distinct. Local Gear images belong under `assets/gear-source/`, while built display assets belong under `assets/gear/`. KB images use approved `assets/kb/` locations or validated authored-content paths. Preserve original bytes, stable ownership and provenance; never infer an owner from a filename or discard old source bytes as a replacement side effect.

Perception Joyride 10.0 is Gear/media ID `perception-joyride-10-0`. Its source is `assets/gear-source/perception-joyride-10.png`, Git blob `f24403f79788755e267ee721f5e93c34c3f8f472` (562530 bytes), explicitly owned by that Gear ID. The built asset is `assets/gear/perception-joyride-10-0.png` and is checked byte-for-byte against the source. No Notes were created. Submitted type `Accessories` and all submitted specifications/link are preserved exactly.

Dagger Axis 10.5 remains Gear/media ID `dagger-axis-10-5`, with confirmed Length `10' 6"` and the latest user-replaced source preserved. The three prior KB hero pictures remain registered. Rods & Reels still uses `assets/kb/entries/technique-rods-reels.png`, alt `Baitcasting reel`, now caption `Baitcasting reel`; its authored Markdown and picture bytes were not changed. Fishing Line explicitly links to `sufix-832-15`; no additional associations are inferred.

FISH063 remains OPEN for clearer KB image filename/upload-destination guidance; PR60 did not alter that editor usability issue. FISH069/070 are DONE.

## Authoritative records and history

The root README, Context, TODO, Decision Log and bootstrap describe current project state. Complete earlier documentation is preserved in Git history and `History/`. New work must restore current main and consult the canonical TODO rather than resuming a historical release branch.
