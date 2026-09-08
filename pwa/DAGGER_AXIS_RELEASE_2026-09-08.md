# Dagger Axis 10.5 / KB hero images — release closeout

**Status: DEPLOYED / CLOSED.** September 8, 2026. FISH-TODO-064 and FISH-TODO-065 are DONE. User browser acceptance remains separate; verified GitHub Pages deployment is complete.

## Release evidence

Initial Dagger addition:
- PR54: https://github.com/ginosega/fishing/pull/54
- Merge: `0c07816b33c282cbc31e162812ad15c45d3a4bbe`
- Production: #274 / `34187188334`, success including actual Pages deployment.

Correction and three KB hero pictures:
- PR56: https://github.com/ginosega/fishing/pull/56
- Final feature head: `d17d7b0c52955c06ef55659d6062e8b6f4a44759`
- Normal PR CI: #284 / `34188600391`, success against main `5265a393cce601a59540de2a17f5b7c56b4d3535`
- Merge: `531f04a84c0d75e2a7f23dc368149de5026b607b`
- Production: #285 / `34188668110`, success. The accepted kayak correction/KB image gate, Dagger source/ownership tests, all existing Gear/KB/Catch model/routing/authoring/media tests, build, authored Notes materialization, local-media materialization, transformed-bundle validation, exact accepted KB-image byte checks, artifact uploads and actual Deploy to GitHub Pages all succeeded.
- Production workflow: https://github.com/ginosega/fishing/actions/runs/34188668110
- Live site: https://ginosega.github.io/fishing/

## Dagger Axis correction

The owned Dagger Axis 10.5 remains Gear ID and media ID `dagger-axis-10-5`, category `accessories`, type `Kayaks`. The user confirmed the Length is `10' 6"`; the earlier `12' 6"` value is superseded. Height `15.25"`, Width `28.5"`, Weight `50 lb`, Cockpit opening `52.5"x23.5" (6.0 deck)`, manufacturer/model/link ordering, stable ID, explicit image owner and no-Notes state remain unchanged.

Gear remains schema4 with 65 source records and dataVersion `2026-09-08-my-gear-v4-dagger-length-1`. The current source image is `pwa/assets/gear-source/dagger-axis-10-5.png`, Git blob `17ad66ac19cc0a71f3ca4c3fd4ea6ec5e881ac51`, 393226 bytes. The previous source remains preserved in Git history. The build continues to validate and copy exact source bytes without recompression to the built Gear asset.

## Three KB hero pictures

PR56 promoted the three source-aware browser handoffs while keeping the submitted authored Markdown unchanged:

- `technique-fishing-line`: picture `./assets/kb/entries/technique-fishing-line.jpg`, alt `Sufix 832 fishing line`, explicit `gearItemId: sufix-832-15`. No additional provenance was inferred.
- `technique-walking-bait`: picture `./assets/kb/entries/technique-walking-bait.jpg`, alt `Heddon Zara Spook`, no Gear owner or provenance inferred.
- `technique-rods-reels`: picture `./assets/kb/entries/technique-rods-reels.png`, alt `Baitcasting reel`, no Gear owner or provenance inferred.

KB remains schema1 with 54 entities and dataVersion `2026-09-08-kb-v1-three-hero-images-1`. Catch remains schema2 with five historical records and is unchanged. Existing IDs, names, descriptions, content paths, Markdown, pictures, Gear records, ownership and historical relationships were preserved.

## Cleanup and remaining work

No one-time migration was rerun, no permanent validation gate was bypassed, and no source media was deleted as a side effect. The standard workflow retains permanent regression coverage for the accepted Dagger correction and the three KB hero pictures, including source/final identity and byte validation.

FISH-TODO-065 is closed by the confirmed `10' 6"` correction. FISH-TODO-063 remains OPEN and separately tracks clearer KB editor filename/upload-destination guidance; it does not invalidate this release.

The authoritative README, Context, TODO, Decision Log, PWA README and bootstrap are reconciled to this deployed state. Earlier exact records remain available in Git history and `History/`.
