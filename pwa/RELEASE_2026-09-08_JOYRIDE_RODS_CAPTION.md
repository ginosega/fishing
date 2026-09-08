# Perception Joyride / Rods & Reels caption — release closeout

**Status: DEPLOYED / CLOSED.** September 8, 2026. FISH-TODO-068 DONE.

## Release evidence

- PR58: https://github.com/ginosega/fishing/pull/58
- Final feature head: `001249eeb3fb3a17cdc7ffc668fe289d3eb58084`
- Normal PR CI: #297 / `34189898597`, success against main `c82be4b253d2703830aff7b7e7db9131b4f031ba`
- Merge: `8cceecc42d7ffab1c672e6991378d032136145b4`
- Production: #298 / `34189948481`, success including actual GitHub Pages deployment
- Live site: https://ginosega.github.io/fishing/

The production workflow passed JavaScript syntax, all existing Gear/KB/Catch model/routing/authoring/promotion/media/content tests, the prior Dagger and accepted-three-KB-image regressions, the new Perception Joyride/Rods-caption regression, build, authored Notes materialization, local-media materialization, complete transformed-bundle verification, exact source-to-built image checks, artifact upload and the actual `Deploy to GitHub Pages` step.

## Perception Joyride 10.0

The user-supplied Gear add was promoted exactly as submitted:
- Gear/media ID: `perception-joyride-10-0`
- Category: internal `accessories` (Equipment display)
- Type: `Accessories`
- Name: Perception Joyride 10.0
- Manufacturer: Perception
- Model: Joyride 10.0
- Specifications: Length `10'`; Height `15.25"`; Width `28.5"`; Weight `50 lb`; Color `Funkadelic`
- One ordered Perception manufacturer link, unchanged from the handoff
- Notes: none; no `gear-content/perception-joyride-10-0.md` created

The pre-uploaded source `pwa/assets/gear-source/perception-joyride-10.png` is Git blob `f24403f79788755e267ee721f5e93c34c3f8f472`, 562530 bytes. It is explicitly registered to owner `perception-joyride-10-0`; no other ownership or relationship was inferred. The build materializes `./assets/gear/perception-joyride-10-0.png` and permanent regression coverage verifies exact source identity, size, ownership, source path and byte-identical final output.

Gear remains schema4 and advances to 66 records with dataVersion `2026-09-08-my-gear-v4-perception-joyride-1` so accepted seed-managed clients receive the new item while non-seed local records remain protected.

## Rods & Reels caption

For KB entity `technique-rods-reels`, PR58 changed only picture caption from null to `Baitcasting reel`. The existing picture path `./assets/kb/entries/technique-rods-reels.png`, alt `Baitcasting reel`, null credit/sourceUrl, entity ID/name/description/content path and complete authored Markdown remain unchanged. The matching local-media caption was updated to the same value.

KB remains schema1/54 entities and advances to dataVersion `2026-09-08-kb-v1-rods-reels-caption-1`. The earlier Fishing Line and Walking Bait hero-picture metadata and exact bytes are unchanged. Fishing Line retains its explicit `sufix-832-15` Gear association; no new KB-to-Gear association was inferred.

## Preservation and cleanup

The latest Dagger Axis 10.5 source replacement, confirmed `10' 6"` length, all existing Gear facts/IDs/ownership/Notes, all authored KB Markdown, Catch records, prior media and historical relationships were preserved. The one-time Joyride promotion workflow was removed before normal PR CI. No one-time migration was rerun and no permanent test was disabled or bypassed.

FISH-TODO-063 remains OPEN for clearer KB image filename/upload-destination guidance and is unrelated to this completed release. Browser acceptance is a normal follow-up; verified production deployment itself is complete.
