# Fishing Context

**Status:** Active working context. OneNote migration/link restoration completed 2026-08-29; Fishing Companion My Gear architecture refactored 2026-09-01.

This is a compact router/current-state summary. Do not use it as the detailed owner for procedures or long-form knowledge.

## User fishing profile

- Primary geography: Western Washington, especially Kirkland / Lake Washington / Lake Sammamish, plus camping trips to regional lakes.
- Main fishing partners: son Jacob and family.
- Main platforms: Bonafide RVR119 kayak, bank fishing, dock fishing.
- Common targets: bass, trout, panfish/perch, and opportunistic mixed species.
- Preferred planning style: practical, rod-by-rod, matched to actual gear and location conditions.
- Fishing Companion is intended to make the project knowledge and inventory fast to consume in the field.

## Current core platform

- Kayak: **Bonafide RVR119**.
- OneNote specs: 11'9" length, 35" width, 85 lb weight, 425 lb capacity, S/N `LPS00469H526`.
- Current propulsion: paddle-only.
- No pedal drive, motor, anchor, stakeout pole, or drift sock currently documented as owned.
- Mapping: Garmin Navionics phone app for detailed contours.
- On-water electronics: Humminbird Helix 5 CHIRP DI GPS G3, XNT 9 HW DI T transducer, base map.

Details:

- `Topics/Bonafide_RVR119_Kayak.md`
- `Topics/Fish_Finder_Electronics_Wiring.md`
- `Topics/Kayak_Rigging_Accessories_Storage.md`

## Current rod systems

### Spinning / Jacob-friendly / finesse / trout

- Rod: Daiwa Tatula XT `TATULAXT702MFS`, 7', medium power, fast action, 2-piece.
- Reel: Daiwa Exceler LT `EXELT2500D-XH`, 6.2:1 gear ratio.
- Main line: Sufix 832 15 lb Hi-Vis Yellow braid, 300 yd, part `660-115Y`.
- Leader: Seaguar InvizX 8 lb fluorocarbon.
- Primary role: drop shot, Ned rig, wacky worm, small spoons, inline spinners, small Rapalas, trout/panfish, Jacob's smaller hard baits.

### Baitcasting / general-purpose bass / heavier trolling plugs

- Rod: Shimano Zodias `ZDC72MHB`, 7'2", medium-heavy, fast.
- Reel: Shimano 22 SLX DC XT 71HG, 7.4:1 gear ratio.
- Main line: PowerPro Super8 Slick V2 30 lb Moss Green braid.
- Leader: Seaguar InvizX 12 lb fluorocarbon.
- Primary role: spinnerbaits, chatterbaits, crankbaits, jigs, soft plastics, swimbaits, topwater, and kayak trolling heavier plugs such as Flicker Shad.

### Shore trout spincast

- Pflueger President Spincast Combo, part `PRESSC-606L2CBO`.
- Rod: 6'6", medium power, 2-piece.
- Reel: 8-14 lb line weight, 3.8:1 gear ratio.
- Recommended line: 6 lb monofilament, e.g. Berkley Trilene XL.
- Primary role: simple shore trout bottom/bobber rigs, small spoons/spinners, and kid/guest-friendly bank fishing.

Details: `Topics/Rods_Reels_Line_Knots.md` and the structured My Gear seed.

## Current project data routing

### My Gear PWA data

My Gear uses structured local-first data and does **not** parse the Markdown inventory tables for its records.

- Baseline/portable dataset: `pwa/data/gear.seed.json`
- Schema/validation: `pwa/gear-model.js`
- Live local/offline data: browser IndexedDB through `pwa/gear-store.js`
- UI: `pwa/gear-app.js`
- Current seed data version: `2026-09-01-my-gear-v1`

Current My Gear categories:

- Rods & Reels
- Line
- Weights
- Snaps & Swivels
- Hooks
- Lures
- Bait

**Knots are intentionally not in My Gear.** They belong in the Knowledge Base domain and will be reconsidered as part of the KB redesign.

`Fishing_Gear_Registry.md` and `Fishing_Tackle_Inventory.md` remain useful migrated/reference material and transitional legacy-planner inputs, but they are no longer the My Gear application's canonical runtime inventory source.

### Knowledge Base / planner

The current Knowledge Base/planner still uses migrated Markdown during the transition:

- `Topics/Rods_Reels_Line_Knots.md`
- `Topics/Fishing_Techniques.md`
- `Topics/Local_Waters_Locations.md`
- `Topics/Trip_Logs_Field_Observations.md`
- plus legacy registry/inventory inputs still consumed by the old planner code.

The KB architecture is **not final**. Redesign its data model before deeper development; do not simply extend the old Markdown parsing pattern by default.

Catch history is still Markdown-backed and currently matched to gear by text. Future structured catch records should reference stable gear/setup/location IDs.

## Fishing Companion current production state

Live URL:

`https://ginosega.github.io/fishing/`

Current production commit:

`8af0c654168cdefad37f79368719ac66a69c98b1`

Current production workflow:

- GitHub Actions run **#70 / 33590304599**
- build: success
- structured My Gear model tests: success
- My Gear routing/layout regression tests: success
- bundle verification: success
- GitHub Pages deployment: success

The structured My Gear refactor was merged in PR #9. PR #10 then fixed a Sev 1 routing/layout regression introduced by the refactor.

Current accepted behavior after PR #10:

- Home My Gear subtext: `Browse your inventory of equipment, tackle, and bait`
- My Gear page header: title and subtext on the left, Back button on the right
- My Gear contains no Knots category
- My Gear contains no visible **My Gear data** import/export card
- structured My Gear owns all `#/inventory/...` routes, including leaf pages
- the legacy Markdown router is isolated to Home/Knowledge Base/planner routes

The current build needs a quick user acceptance retest after PR #10 before the project moves into Knowledge Base architecture work.

## Deferred v2 behavior

- Do not add My Gear Add/Edit/Delete forms yet.
- Do not expose JSON import/export controls in the current v1 UI.
- The underlying repository/IndexedDB design remains writable so those features can be added later.
- When v2 manual bulk editing is resumed, preferred workflow is JSON export → edit externally → import; do not add a raw JSON editor inside the PWA.

## Current operational constraints

- Paddle-only kayak with no anchor/drift sock means fishing plans should emphasize route fishing, controlled drifts, trolling passes, and casting ahead rather than hovering over one spot.
- The Helix has sonar/down imaging/GPS but no side imaging or forward-facing sonar.
- Navionics is the contour-planning tool; Helix confirms depth, weeds, bait, bottom changes, and fish marks.
- User usually carries only two rods on the kayak.
- Jacob's tackle is shared, but Jacob's smaller Rapalas should normally be prioritized for the spinning rod.

## High-value current locations

- Lake Washington: north end/Kenmore/Log Boom/Sammamish River mouth, Juanita Bay, Kirkland waterfront, Mercer Island.
- Lake Sammamish: north end, Idylwood, State Park, east shoreline, Tibbetts/bench areas.
- Camping/trip lakes: Silver Lake Whatcom County, Cranberry Lake at Deception Pass, Mayfield Lake/Ike Kinswa, Lake Chelan, Lake Cle Elum.

## Active unresolved priorities

See `Fishing_TODO.md`. Current important items include:

- Finish acceptance testing the post-refactor My Gear UI, starting with the PR #10 routing/layout fix.
- Redesign the Knowledge Base data model before deeper KB work; Knots belong there.
- Preserve and resolve source conflicts, especially hook-size guidance for PowerBait and loop-knot guidance.
- Move catch history to structured records later, with stable gear/setup/location references.
- Verify purchase status for Bonafide RVR119 Under Seat Tackle Storage and YakAttack fish cooler bag.
- Verify actual installed state of fish-finder wiring/fuse/connector details.
- Verify Bonafide RVR119 insert bolt/thread sizes.
- Decide whether/how to modify the rear flush rod-holder angle.

## Migration record

The OneNote PDF was migrated and the later OneNote Single File Web Page/MHT export was used to recover hyperlinks, which are embedded inline in the relevant Markdown files. On 2026-08-29, migration audit/reconciliation was closed with OneNote designated as the most up-to-date historical source of truth. Historical chat material remains supplemental evidence and decision history.

If something later seems missing or conflicts with recollection, use `Fishing_Decision_Log.md`, `Fishing_TODO.md`, user confirmation, manufacturer documentation, the structured My Gear seed, or historical-source recovery as appropriate, then update the authoritative source for the affected data domain.
