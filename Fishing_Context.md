# Fishing Context

## Current authoritative state — September 28, 2026

`ginosega/fishing` is the durable source of truth. Restore actual current `main` and current open-PR state before repository work. For exact production identity, inspect the latest successful `main` production workflow plus its hosted verification evidence; checkpoint values in project Markdown are historical evidence, not permanent truth.

### Current verified production checkpoint

- production source revision: `626e874d3fc88f7ac11dd97988920f90bc2fb8ea`
- implementation PR: #200
- production workflow: **#422** / run `36430594308`
- hosted release ID: `0e2e4d903de78b6affe1d1dc55204c7b`
- hosted counts: **Gear 90 / KB 58 / Catches 11**
- release lane: Fast Content Release
- exact-current-main guard: passed
- Pages deployment: passed
- hosted byte/release-identity verification: passed
- open PRs before handoff reconciliation: 0

The September 28 handoff is documentation-only and may move `main` beyond the production source revision above without republishing the PWA.

## Application / architecture state

FISH114 remains the latest completed application/architecture change: Android/Edge maskable launcher icon, implemented/production-verified/user-verified/closed. FISH071–076 and FISH078–114 are complete/implemented. The next unused application/architecture ID is **FISH-TODO-115** unless newer `main` allocates it. Routine FISH108 content work does not consume application IDs.

Fishing Companion remains a three-domain PWA:

- Gear canonical source: `pwa/Gear/`
- Knowledge Base canonical source: `pwa/KB/`
- Catch canonical source: `pwa/Catches/`

`.github/workflows/fishing-production.yml` is the sole active production publisher.

## Recent canonical content — September 24–28

Current source includes the following durable content changes:

- **Five Banks Lake catches from 2026-09-24**, all with Catch records, pictures and Notes Markdown:
  - Smallmouth bass — 12 in — `zman-ned-rig-kit`
  - Largemouth bass — 14 in — `zman-ned-rig-kit`
  - Lake whitefish — 8 in — `lake-whitefish` species + `zman-ned-rig-kit`
  - Smallmouth bass — 15 in — `berkley-powerbait-power-jerk-shad`
  - Smallmouth bass — 14 in — `berkley-powerbait-power-jerk-shad`
- **Lake whitefish** added as a Species KB entry with picture and authored content.
- **Z-Man Ned Rig Kit** specifications now include Finesse TRD stickbait, TRD Tickler, TRD Craw and 1/6 oz + 1/10 oz jigheads.
- **ZMan Finesse ShadZ**, **ZMan Trick ShotZ**, and **ZMan TRD GobyZ** added as Gear with Green Pumpkin specifications, Drop Shot Notes links and pictures.
- **Blue Fox Flash Spinner** and **Bad River Tackle Company Trout/Panfish Spinners** added.
- Old generic/South Bend inline-spinner Gear item removed and its live Inline Spinner KB reference cleaned up.
- **VMC Swimbait Jig** Notes added.
- Berkley PowerBait Power Jerk Shad Notes wording updated.
- Banks Lake inline-image filename/case and Markdown formatting corrected while preserving the intended two Steamboat Rock images.
- Pflueger President Spincast Combo rod/reel Notes were revised; current reel capacity is `110 yd / 4 lb, 90 yd / 6 lb, 70 yd / 8 lb`.

Current source always controls over this summary.

## RVR119 motorization research — active / no purchase decision

The user is researching motorization for the Bonafide RVR119. No motor or battery has been selected or purchased.

### Current candidates

1. **Garmin Force Current with Power Steer Foot Pedals**
2. **Newport NK180Pro HD + 24V 50Ah LoPRO + Wizard Motorization Kit**
3. **Newport NK300 HD + 36V 50Ah LoPRO + Wizard Motorization Kit**

### Durable constraints and preferences

- The RVR119 is transported on the roof rack of the user's F-150, so motor and battery removal before roof loading is important.
- A battery that fits beneath the RVR119 seat is strongly preferred.
- The user specifically likes Newport's low-profile LoPRO form factor.
- Preserve purchase uncertainty; research/comparison does not imply ownership.
- Compare not just speed/thrust but also lake-positioning capability, river ruggedness, remaining installed weight, setup/teardown effort, range, reliability, price and serviceability.

### Current research conclusions

- The **NK180 HD** is the lightest removable propulsion option and best preserves the RVR119's river-oriented character.
- The **NK300 HD** is a much stronger propulsion system and only modestly more expensive than the complete NK180 RVR kit, but adds substantial motor+battery weight on the water.
- The **Force Current** is differentiated primarily by electric steering/GPS boat control — Anchor Lock, Bow Lock, heading/route control, remote control and Power Steer — rather than by raw propulsion.
- Newport motors are designed to be removed from their stern brackets for travel; the Wizard steering/control lines must be disconnected.
- Garmin explicitly requires the Force Current motor to be removed before transporting the kayak; the motor detaches from the installed mount and the Power Steer pedals detach from their rails.
- The large removable components therefore do not need to be lifted onto the F-150 roof with the kayak.
- For the Force Current, the 24V 50Ah LoPRO is preferable to the same-size 12V 100Ah LoPRO because the two store roughly similar energy while 24V allows the motor's full 24V performance.

### Useful next research

- Find RVR119-specific Power Steer pedal/rail installation photos or measurements.
- Compare real parking-lot setup/teardown for Force Current vs Wizard-equipped Newport systems.
- Continue real-owner reliability research, especially Force Current steering/calibration/shutdown reports.
- Research other manufacturers' **24V low-profile batteries** that can fit beneath the RVR119 seat and compare them with Newport 24V 50Ah LoPRO.
- Estimate realistic range/runtime for the user's lake and river use rather than relying on marketing maxima.

## Science of the Strike transcript research

Recent transcript reviews covered:

- largemouth vision;
- scent and taste;
- barometric pressure and lunar cycle;
- crawfish;
- dissolved oxygen and turbidity.

Durable editorial rule: distinguish evidence presented in studies from host opinion/inference. Do not turn population-specific studies, lab thresholds, anecdotal conversions or host extrapolations into universal fishing rules.

Potential Fishing Companion destinations:

- **Bass Behavior and Habitat:** visual ecology, chemical senses, fronts/weather, crawfish biology, dissolved oxygen, stratification and turbidity;
- **Bass Fishing Techniques:** presentation angle/color, bite retention/scent testing, pre/post-front execution, crawfish presentation and turbid-water presentation;
- **Summer Fishing:** thermocline/oxygen-compressed habitat;
- **Electronics Research:** 2D-sonar thermocline identification and forward-facing-sonar visual-angle implications.

Do not reintroduce retired Technique pages such as Water Visibility or Color and Scent merely to house podcast material.

## KB editorial architecture

- **Bass/Trout Behavior and Habitat:** where fish are and why — habitat, structure/cover, temperature, oxygen, forage, light, wind/current, depth and pattern recognition.
- **Bass/Trout Fishing Techniques:** how to catch fish once located — presentation, lure/bait/rig selection, retrieve/cadence, depth control, strike handling and bank/kayak execution.
- **Spring/Summer/Fall/Winter Fishing:** detailed seasonal playbooks combining location and presentation.
- **Topwater Fishing:** broad surface strategy; Frog, Popper, Whopper Plopper, Walking Bait and Buzzbait remain narrower Gear Guides.
- Internal `kb://` links are curated for reader value, not added mechanically.

Retired live Technique pages remain retired unless explicitly requested: Bass Fishing, Spring Bass Fishing, Fall Bass Fishing, Bass Power and Search Overview, Color and Scent, Paddle-only Kayak Strategy, Seasonal Bass Guidance and Water Visibility.

## FISH108 release model

Full policy: `pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md`.

### Fast Content Release

Use only when every changed repository file is beneath `pwa/Gear/`, `pwa/KB/`, and/or `pwa/Catches/`. Before mutation validate current source/open PRs, package source revision/ancestry, record hashes/base fields when applicable, IDs/types/paths/references, media existence/hash and conflicts. Preserve unrelated/newer source and user-uploaded bytes.

Fast releases use one lightweight content PR, locked cached dependencies, canonical content/build verification, exact-current-main protection, Pages deployment and dependency-free hosted byte/release-identity verification. Do not run the Full Application suite for routine content-only work unless a genuine non-content problem is found.

### Full Application Release

Runtime/UI/assets, service worker, schema/contracts, tests, build/tooling, dependencies, workflow, migration/recovery/offline architecture or mixed content+non-content work uses the full lane. Documentation-only project-state reconciliation does not publish the PWA.

## Durable authoring/product behavior

- Gear/KB Add/Edit remains **Prepare Changes → Copy Changes**; copying is not saving and the browser does not write GitHub source directly.
- GitHub upload links use physical `/pwa/...` paths; packages use logical `Gear/...`, `KB/...`, `Catches/...` paths.
- Existing IDs remain stable unless intentionally retired/replaced.
- Simple Markdown narrative edits may be direct; structured fields/links/pictures/sequences/relationships use source-aware workflow.
- KB description maximum is 80 characters.
- Same-page Markdown links target renderer-generated lowercase punctuation-stripped hyphenated slugs.
- FISH091 offline library is explicitly provisioned through **Connection Status → Update offline library**.
- FISH096 Knot sequences require explicit ordered `pictureSequence` frames.
- FISH102 pins Line-Tackle-Knot Reference first only under KB → Knots.
- FISH103 external HTTP(S) links open new-tab; internal/local links remain same-tab.
- FISH107 canonical Skylety Fishing Hook Sharpener type is `Tools`.

## Backlog / unresolved state

- RVR119 Under Seat Tackle Storage remains back-ordered/not purchased and is the user's #1 needed fishing equipment item.
- FISH-TODO-014 KastKing 3600 deep-box watch remains open unless explicitly resolved.
- Texas Rig, Carolina Rig, Alabama Rig, Neko Rig and Spoons KB pages remain open.
- Fishing Companion v3 remains deferred and requires explicit approval.
- RVR119 motorization research is active; no purchase decision.
- Preserve all other active items in `Fishing_TODO.md`.
