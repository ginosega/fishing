# Fishing Context

## Latest handoff reconciliation — October 19, 2026

**v3 planning state:** Requirements, technical design, UX screens/flows and staged implementation plan have **all been explicitly APPROVED**. The [implementation-plan approval](pwa/docs/Fishing_Companion_v3_Implementation_Plan_Approval_2026-10-19.md) has a mandatory **full new-chat transfer before P0**. No P0 investigation or v3 implementation has yet begun; no new provider/domain/permissions or production cutover is preapproved. The [new-chat bootstrap](Fishing_New_Chat_Bootstrap_Prompt.md) now carries the current start instructions. Begin P0 only after restoring fresh actual main/current open PRs/latest hosted production identity in that new Chat conversation. AUTH-P0 proof and staged approvals/Work-mode checkpoints remain binding.

**Latest successful production evidence observed during handoff (October 15, 2026 UTC):** Fast Content Release workflow **#520** / run **38686171921**, production source `4fc893d044b72e61fbc36cfd82103af55bc36f97`, release ID `f5eab01e9d5af6101f03a7094de5b565`, **431 hosted files / 100 Gear / 60 KB / 12 Catches**, `hostedBytesMatch: true` from deploy-content verification log. Latest main at start of handoff was `7cc7eea06a110e041dbf552855957713df4b1c51` with **zero open PRs**. Subsequent documentation-only reconciliation moves main ahead without updating published PWA. All identities are checkpoint snapshots, not substitutes for new-chat verification.

## Previous authoritative audit checkpoint — October 12, 2026 (historical)

`ginosega/fishing` is the durable source of truth. Restore actual current `main` and current open-PR state before repository work. For exact production identity, inspect the latest successful `main` production workflow plus its hosted verification evidence; checkpoint values in project Markdown are historical evidence, not permanent truth.

### October 12 verified production checkpoint

- production source revision: `e71c9ab6a90da46f8b46c7977bf476a1633fa94c`;
- latest source change: add the **September 24, 2026 Banks Lake representative picture** to the Banks Lake Location record (PR [#228](https://github.com/ginosega/fishing/pull/228));
- production workflow: **#517** / run `38207507318`, **Fast Content Release**;
- hosted release ID: `0f4bd1f9e9e12b2b1981d61b48e3e501`;
- hosted counts: **Gear 100 / KB 60 / Catches 12**; hosted files: **431**;
- exact-current-main guard, Pages publication and hosted byte/release-identity verification passed: `hostedBytesMatch: true`;
- **PR #228 is merged; open PRs: 0** at the start of this reconciliation.

This October 12 handoff only changes the five root project Markdown files. These documentation-only changes **do not publish the PWA**; after merging the handoff, `main` can be ahead of the production source revision. For the next task, always recheck actual current `main`, open PRs and latest successful hosted verification rather than assuming these identifiers are current.

## Application / architecture state

FISH114 remains the latest completed application/architecture change: Android/Edge maskable launcher icon, implemented/production-verified/user-verified/closed. FISH071–076 and FISH078–114 are complete/implemented. The next unused application/architecture ID is **FISH-TODO-115** unless newer `main` allocates it. Routine FISH108 content work does not consume application IDs.

Fishing Companion remains a three-domain PWA:

- Gear canonical source: `pwa/Gear/`
- Knowledge Base canonical source: `pwa/KB/`
- Catch canonical source: `pwa/Catches/`

`.github/workflows/fishing-production.yml` is the sole active production publisher.

## Recent canonical content — September 24–October 5

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
- Earlier Electronics Research motor/battery material was superseded: current **Electronics Research** Notes contain chart plotter/fish-finder material only.
- October releases added/updated Flutter Spoon content, NRS Zander PFD, YakAttack BackWater DryPak, Z-Man ShroomZ Micro Finesse Jig, Z-Man Finesse TRD, Z-Man branding, Luhr Jensen Trout & Kokanee Dodger, Yamamoto Senko and three lure-picture replacements.

Current source always controls over this summary.

## October 8–12 canonical content reconciliation

The following content changes are **implemented, merged and hosted-verified**, not outstanding application tasks:

- **PR #221:** two orange YakAttack Gear items — Fully Loaded TracPak Combo Kit and 10L Roll-Top Drybag with Air Valve; both use previously uploaded PNGs.
- **PRs #222–224:** Garmin Force Current with Power Steer Foot Pedals Gear entry, illustrated component Notes, and corrected display name. Current Gear ID remains `garmin-force-current-kayak-trolling-motor-with-power-steering-foot-pedals`.
- **PR #225:** `electronics-research` is now **Electronics Research**, with a new representative PNG; its Notes cover **chart plotters/fish finders**. Earlier motor and battery research sections were removed from this page. Do not restore them solely because prior handoff documents mentioned them.
- **PR #226:** detailed **Lake Stevens** kayak-fishing Location page, including North Cove/Davies Beach launches, bass/perch/trout/kokanee strategies, tackle from My Gear, seasonal patterns and regulations. It has no representative picture; one was not requested.
- **PR #227:** expanded Garmin Force Current Notes with a maintenance checklist and component links/three inline pictures; the canonical Gear metadata and picture were unchanged.
- **PR #228:** Banks Lake Location representative picture `KB/Locations/assets/2026-09-24 Banks Lake, WA.png`, using the uploaded PNG without altering it. This was the release interrupted in ChatGPT, but it **subsequently passed PR validation, merged and deployed** in production run #517.

Current canonical source has **100 Gear / 60 KB / 12 Catches**, including **10 Location** KB entries. The published application has no new architecture/feature work from these releases. Keep all source-aware validation, fast-release and ownership rules unchanged.

## RVR119 Force Current ownership and commissioning — active

The user **purchased the motorization system on October 6, 2026**. Do not preserve the old “no purchase decision” state.

### Owned system

- **Garmin Force Current** trolling motor
- **Garmin Power Steer wireless foot pedals**
- Garmin handheld remote
- Garmin MOB tag
- **Redodo 24V 50Ah LiFePO4 battery**
- Redodo battery charger
- Garmin high-efficiency propeller
- Garmin weedless propeller
- used-package purchase price: **$2,800**
- seller location: Gresham, Oregon
- original Garmin purchase: **July 2026**
- original Garmin receipt transferred to the user
- Garmin support directly confirmed the remaining **three-year standard warranty will be honored with the original receipt**
- seller confirmed the motor has **never been used in saltwater**

### Active setup / commissioning work

FISH-TODO-040 remains OPEN as the commissioning/integration task. The current baseline procedure is:

1. document serial/receipt and as-purchased condition;
2. clean and inspect exposed motor/mount/shaft/rope/connectors/props/anodes; no invasive service on a three-month-old warranted unit unless a fault requires it;
3. inspect, charge and baseline the Redodo battery and verify the Redodo LiFePO4 charger;
4. use a 40A protected motor feed and never run the propeller out of water;
5. clear prior-user Garmin navigation data and restore motor defaults;
6. restore remote defaults and re-pair the remote, both Power Steer pedals and MOB tag;
7. update Force Current, remote and pedal software through ActiveCaptain;
8. calibrate both Power Steer pedals and the handheld remote;
9. after RVR119 installation, perform on-water motor compass/bow-offset calibration and a complete propulsion/steering/Anchor Lock/MOB functional test.

### Storage case search

The user wants a **hard-plastic** storage case/bin for the motor and pedals with:

- minimum usable internal dimensions **38 × 18 × 8 in**;
- a snug/compact fit rather than a large tote;
- **orange preferred**;
- no flexible bags;
- no need for Pelican/Otter-level thickness or cost;
- Hyper Tough 50-gallon bin rejected as too large.

Continue searching by **verified usable interior dimensions**, not exterior dimensions alone.

### Storage-case cushioning and fit — current exploration

The current discussion concerns a **48 × 19 × 14 in lidded hard-plastic bin** for the motor and pedals. Its **actual usable interior dimensions and purchase/ownership status are not independently confirmed**; the old minimum **38 × 18 × 8 in usable interior** remains the fit requirement until measurements confirm otherwise. The user is considering a custom cushioning insert. Cut **closed-cell EVA or polyethylene foam** is the safer reusable baseline. Construction **Fireblock/Gaps & Cracks** spray foam is too firm/unpredictable for direct equipment cushioning; flexible Window & Door foam is only a cautious sample experiment, not an approved permanent solution. Never apply expanding foam to the motor or pedals directly, and do not compromise connectors/shaft/controls or trap water.

### Remaining integration considerations

- Motor and battery must remain easy to remove because the RVR119 is transported on the F-150 roof rack.
- The Force Current motor and Power Steer pedals are removable for transport.
- The Newport 24V 50Ah LoPRO remains of interest only as a possible future lower-profile battery alternative; the Redodo 24V 50Ah is the currently owned propulsion battery.
- RVR119-specific mount/pedal placement, power routing, circuit protection and practical setup/teardown remain part of the active installation work.

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
- Fishing Companion v3 requirements, technical design, UX screens/flows **and staged implementation plan** are all approved as of October 19, 2026. [Approved plan](pwa/docs/Fishing_Companion_v3_Implementation_Plan.md) · [plan approval/caveat](pwa/docs/Fishing_Companion_v3_Implementation_Plan_Approval_2026-10-19.md). **First transfer to a new Chat before beginning P0**; restart baseline investigation there. Preserve FISH108, single-author public-readable GitHub App architecture and UX, AUTH-P0 real-device login/session feasibility, excluded offline queued sync/multi-user/Catch pictures, provisional removable local drafts, and separate approvals for provider/permissions, v2 maintenance releases, and v3 production cutover.
- RVR119 Force Current purchase is complete; commissioning, storage-case selection and RVR119 installation remain active under FISH-TODO-040.
- Preserve all other active items in `Fishing_TODO.md`.

## Next-chat entry point

After handoff, open [Fishing_New_Chat_Bootstrap_Prompt.md](Fishing_New_Chat_Bootstrap_Prompt.md) from latest `main`, copy its instructions to a new Chat-mode Fishing conversation, and freshly resolve GitHub/production identity before acting.
