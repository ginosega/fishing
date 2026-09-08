# Cranberry Lake picture and page-copy release

Status: DEPLOYED / CLOSED (application release). Date: September 8, 2026. FISH-TODO-069 and FISH-TODO-070 are DONE. This record is the current release evidence; earlier release files remain historical.

## Deployment evidence

PR60: https://github.com/ginosega/fishing/pull/60

- Base: `894586f3aac1c4f44a00917ad4071ee5ace2f9c4`.
- Final head: `cd47dc9ce39660840de493346e7df9fda72a14e5`.
- Normal PR CI #307, run `34191643311`: success, including all permanent syntax, model, routing, authoring, promotion, media, content, build, transformed-data, exact-source and final-bundle gates. CI artifact succeeded; deployment correctly skipped for the PR.
- Expected-head merge: `ecd9f3d52ca8180ea4f48ec888e7574105deafda`.
- Production #308, run `34191692935`: success. All permanent build and final-bundle checks, artifact uploads and the actual `Deploy to GitHub Pages` job succeeded.
- Site: https://ginosega.github.io/fishing/ . GitHub Pages deployment is verified. Independent browser/HTTP acceptance is not claimed; user visual acceptance is the normal follow-up.
- The final application diff contains no temporary promotion workflows or working scripts. No one-time migration was rerun and no user source image was deleted.

## Cranberry Lake handoff

The supplied `fishing-companion-kb-change-v1` package was applied through the existing source-aware promotion model, without manually rewriting its authored Markdown. The base entity, source entity and Markdown matched current main exactly. The preexisting uploaded image was validated as PNG and retained at its exact requested path.

- Stable entity ID: `location-cranberry-lake-deception-pass`.
- Name: Cranberry Lake, Deception Pass State Park.
- Source and display picture: `./assets/kb/entries/location-cranberry-lake-deception-pass.png`.
- Repository image path: `pwa/assets/kb/entries/location-cranberry-lake-deception-pass.png`.
- Image Git blob: `201852612f8985fba057bfe224292bfe2a24d69d`, 1,981,945 bytes. This is release evidence, not a permanent image-byte lock.
- Alt and caption: `Cranberry Lake`; credit and sourceUrl: null.
- Canonical Content: `./kb-content/locations/cranberry-lake-deception-pass.md`; original authored Markdown blob `1adc6c99612a9dec2f86d0f659c5f851c32966b3` retained.
- KB schema1 remains 54 entities; dataVersion advances from `2026-09-08-kb-v1-rods-reels-caption-1` to `2026-09-08-kb-v1-cranberry-lake-picture-1`.
- A matching local-media source record is registered. No Gear owner, media credit, external image origin or Catch attribution is inferred.
- No other KB entity facts, authored content paths, Gear facts/Notes, ownership, taxonomy, or Catch records were changed by the handoff.

## Page-copy corrections

The home Knowledge Base card and root KB page now share `Fishing reference and catch log`. The Gear Guides card and category page share `Equipment, rig, and presentation reference`. The Catch Log card and `#/kb/catches` page share `Recorded catches`. Techniques uses `Strategy, conditions, and species reference` without a final period on both card and page. Category pages reuse their existing metadata; KB and Catch subtitles use shared constants. The individual catch-detail date subtitle remains unchanged.

The permanent KB routing regression asserts the exact copy and shared usages. The Cranberry regression validates stable identity, complete picture metadata, actual PNG format, source and transformed data, and exact image/Markdown publication. Earlier accepted-media regressions now validate current user-maintained source files and exact published bytes rather than freezing historical source hashes or full Markdown text. Previous release fingerprints remain in historical records. All other permanent tests remain present.

## Reconciliation and continuity

The initial preparation attempt lacked current built Gear media; the successful promotion built current media before validating the exact package. Later preparation corrected current dataVersion assertions and mutable-source tests. The runner's attempted permanent-workflow update was denied for missing workflow permission; the connected authorized repository tool recorded the already validated tree. The final PR passed the complete normal CI with no temporary machinery. The source image and all authored content remained intact through recovery.

The authoritative README, Context, TODO, Decision Log, bootstrap and PWA README are reconciled in the documentation closeout. Exact pre-closeout versions are archived in `History/2026-09-08-pre-cranberry-closeout/`. FISH-TODO-063 remains OPEN as the separate KB filename/upload-destination usability improvement. Next canonical task ID is FISH-TODO-071. No other open work is implicitly completed.
