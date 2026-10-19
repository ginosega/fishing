# Fishing

Persistent Fishing project and source repository for Fishing Companion.

**October 19, 2026 v3 planning checkpoint:** [v3 requirements](pwa/docs/Fishing_Companion_v3_Requirements.md) and [technical design](pwa/docs/Fishing_Companion_v3_Technical_Design.md) were **separately approved as-is**; see [requirements approval](pwa/docs/Fishing_Companion_v3_Requirements_Approval_2026-10-19.md) and [technical design approval](pwa/docs/Fishing_Companion_v3_Technical_Design_Approval_2026-10-19.md). The user requested a [screen-level UX preview](pwa/docs/Fishing_Companion_v3_UX_Review.md) before implementation. **UX review, staged implementation planning and explicit implementation authorization remain pending**. Documentation-only; published v2 unchanged.

## Current continuation — October 12, 2026

`ginosega/fishing` is the durable source of truth. Fishing Companion remains a three-domain PWA with canonical source under `pwa/Gear/`, `pwa/KB/`, and `pwa/Catches/`.

Always restore actual latest `main`, current open PRs, and the latest successful production evidence before relying on exact SHA/release/count values. Historical checkpoint identifiers in project Markdown are evidence only.

### October 12 verified production checkpoint

- production source revision: `e71c9ab6a90da46f8b46c7977bf476a1633fa94c`;
- latest source change: add the **September 24, 2026 Banks Lake representative picture** to the Banks Lake Location record (PR [#228](https://github.com/ginosega/fishing/pull/228));
- production workflow: **#517** / run `38207507318`, **Fast Content Release**;
- hosted release ID: `0f4bd1f9e9e12b2b1981d61b48e3e501`;
- hosted counts: **Gear 100 / KB 60 / Catches 12**; hosted files: **431**;
- exact-current-main guard, Pages publication and hosted byte/release-identity verification passed: `hostedBytesMatch: true`;
- **PR #228 is merged; open PRs: 0** at the start of this reconciliation.

This October 12 handoff only changes the five root project Markdown files. These documentation-only changes **do not publish the PWA**; after merging the handoff, `main` can be ahead of the production source revision. For the next task, always recheck actual current `main`, open PRs and latest successful hosted verification rather than assuming these identifiers are current.

## Current application state

FISH114 — Android/Edge maskable launcher icon — remains the latest completed application/architecture change and is **implemented, production-verified, user-verified, and closed**. The approved transparent `pwa/icon.png` remains unchanged; the production build generates the opaque maskable variant.

FISH071–076 and FISH078–114 are complete/implemented. The next unused application/architecture task ID is **FISH-TODO-115** unless newer `main` allocates it. Routine FISH108 content work does not consume application IDs.

## Recent canonical content state

Since the September 18 handoff, routine content work has added or reconciled:

- five **Banks Lake catches from September 24, 2026**, each with a Catch record, picture and Notes Markdown;
- the **Lake whitefish** Species KB entry and picture;
- the 12-inch smallmouth, 14-inch largemouth and 8-inch Lake whitefish catches linked to **Z-Man Ned Rig Kit**;
- the 15-inch and 14-inch smallmouth catches linked to **Berkley PowerBait Power Jerk Shad**;
- updated **Z-Man Ned Rig Kit** specifications;
- **ZMan Finesse ShadZ**, **ZMan Trick ShotZ**, and **ZMan TRD GobyZ**, including pictures and Drop Shot Notes links;
- **Blue Fox Flash Spinner** and **Bad River Tackle Company Trout/Panfish Spinners**;
- retirement of the old generic/South Bend inline-spinner Gear item and cleanup of its live KB link;
- **VMC Swimbait Jig** Notes;
- Banks Lake inline-image filename/case and Markdown formatting cleanup;
- Berkley PowerBait Power Jerk Shad Notes wording cleanup;
- Pflueger President Spincast Combo rod/reel content and reel-capacity updates.
- Electronics Research previously covered motor/battery research; **its current Notes were refocused on chart plotters and fish finders** on October 9.
- October content releases added/updated Flutter Spoon guidance, NRS Zander PFD, YakAttack BackWater DryPak, Z-Man ShroomZ Micro Finesse Jig, Z-Man Finesse TRD, Z-Man branding, Luhr Jensen Trout & Kokanee Dodger, Yamamoto Senko, and the Sixth Sense/Berkley lure pictures.

Current canonical source, not this summary, controls exact record values.

## October 8–12 canonical content reconciliation

The following content changes are **implemented, merged and hosted-verified**, not outstanding application tasks:

- **PR #221:** two orange YakAttack Gear items — Fully Loaded TracPak Combo Kit and 10L Roll-Top Drybag with Air Valve; both use previously uploaded PNGs.
- **PRs #222–224:** Garmin Force Current with Power Steer Foot Pedals Gear entry, illustrated component Notes, and corrected display name. Current Gear ID remains `garmin-force-current-kayak-trolling-motor-with-power-steering-foot-pedals`.
- **PR #225:** `electronics-research` is now **Electronics Research**, with a new representative PNG; its Notes cover **chart plotters/fish finders**. Earlier motor and battery research sections were removed from this page. Do not restore them solely because prior handoff documents mentioned them.
- **PR #226:** detailed **Lake Stevens** kayak-fishing Location page, including North Cove/Davies Beach launches, bass/perch/trout/kokanee strategies, tackle from My Gear, seasonal patterns and regulations. It has no representative picture; one was not requested.
- **PR #227:** expanded Garmin Force Current Notes with a maintenance checklist and component links/three inline pictures; the canonical Gear metadata and picture were unchanged.
- **PR #228:** Banks Lake Location representative picture `KB/Locations/assets/2026-09-24 Banks Lake, WA.png`, using the uploaded PNG without altering it. This was the release interrupted in ChatGPT, but it **subsequently passed PR validation, merged and deployed** in production run #517.

Current canonical source has **100 Gear / 60 KB / 12 Catches**, including **10 Location** KB entries. The published application has no new architecture/feature work from these releases. Keep all source-aware validation, fast-release and ownership rules unchanged.

## Current RVR119 motorization / commissioning

The motorization purchase decision is complete. On **October 6, 2026**, the user purchased a used **Garmin Force Current with Power Steer wireless foot pedals** for the Bonafide RVR119.

Purchased package:

- Garmin Force Current trolling motor;
- Garmin Power Steer wireless foot pedals;
- Garmin handheld remote and MOB tag;
- **Redodo 24V 50Ah LiFePO4 battery** and Redodo charger;
- Garmin high-efficiency propeller and weedless propeller;
- total purchase price: **$2,800** from the seller in Gresham, Oregon.

The seller supplied the original **July 2026 Garmin receipt**. Garmin support confirmed directly to the user that the remaining three-year standard warranty will be honored with that original receipt. The motor has never been used in saltwater.

### Active commissioning work

FISH-TODO-040 remains OPEN, but its purpose has changed from purchase research to commissioning and RVR119 integration. Current work is to:

- clean and inspect the motor, mount, shaft, rope, connectors, props and sacrificial anodes without invasive disassembly;
- fully charge and baseline the Redodo battery/charger;
- clear prior-user navigation data and restore Garmin factory defaults;
- reset/re-pair the remote, both Power Steer pedals and MOB tag as applicable;
- update the motor, remote and pedals through Garmin/ActiveCaptain;
- calibrate the Power Steer pedals and handheld remote;
- after installation on the RVR119, perform the required on-water compass/bow-offset calibration and full functional test;
- preserve the Garmin requirement for a 40A protected power feed and never run the propeller out of water.

### Storage case search

The user is actively looking for a **hard-plastic storage case/bin** for the motor and pedals. Durable requirements:

- minimum usable **internal dimensions: 38 × 18 × 8 in**;
- snug/compact fit strongly preferred;
- **orange preferred** if available;
- hard plastic is required; flexible storage bags are rejected;
- a heavy/expensive Pelican/Otter-style case is unnecessary;
- the previously considered Hyper Tough 50-gallon tote is too large.

### Storage-case cushioning and fit — current exploration

The current discussion concerns a **48 × 19 × 14 in lidded hard-plastic bin** for the motor and pedals. Its **actual usable interior dimensions and purchase/ownership status are not independently confirmed**; the old minimum **38 × 18 × 8 in usable interior** remains the fit requirement until measurements confirm otherwise. The user is considering a custom cushioning insert. Cut **closed-cell EVA or polyethylene foam** is the safer reusable baseline. Construction **Fireblock/Gaps & Cracks** spray foam is too firm/unpredictable for direct equipment cushioning; flexible Window & Door foam is only a cautious sample experiment, not an approved permanent solution. Never apply expanding foam to the motor or pedals directly, and do not compromise connectors/shaft/controls or trap water.

The Newport LoPRO battery remains an interesting form factor for future packaging, but the currently owned propulsion battery is the Redodo 24V 50Ah LiFePO4.

## Science of the Strike research

Recent transcript reviews covered:

- largemouth vision;
- scent and taste;
- barometric pressure and lunar cycle;
- crawfish;
- dissolved oxygen and turbidity.

When turning these into Fishing Companion content, preserve the distinction between study evidence and host inference. Avoid converting single-study values or host extrapolations into universal rules. Potential additions belong primarily in Bass Behavior and Habitat, Bass Fishing Techniques, seasonal pages and Electronics Research according to the existing editorial ownership model.

## Release model

FISH108 establishes two release lanes. Full policy: [`pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md`](pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md).

- **Fast Content Release:** only when every changed repository file is under `pwa/Gear/`, `pwa/KB/`, and/or `pwa/Catches/`.
- **Full Application Release:** any change outside those roots that can affect application/runtime behavior.
- Documentation-only project-state reconciliation does not publish the PWA.

Routine source-aware content releases do not consume an application task ID or require per-item closeout documents. Preserve unrelated/newer source changes and user-uploaded binary bytes.

## Durable product/editorial behavior

- Gear/KB Add/Edit remains **Prepare Changes → Copy Changes**, producing `fishing-companion-change-v2`; the browser does not write GitHub directly.
- FISH091: ordinary online use does not provision the complete offline library; **Connection Status → Update offline library** explicitly prepares/refreshes it.
- FISH096: Knot-only ordered `pictureSequence`; frames live under `pwa/KB/Knots/assets/<id>/`.
- FISH102: Line-Tackle-Knot Reference is pinned first only on KB → Knots.
- FISH103: external HTTP(S) links open in a new tab; internal/local links remain same-tab; authoring upload links use physical `/pwa/...` paths.
- FISH107: Skylety Fishing Hook Sharpener canonical type is `Tools`.
- Broad Behavior/Habitat pages answer **where fish are and why**; broad Fishing Techniques pages answer **how to catch them once located**; detailed seasonal strategy belongs in Spring/Summer/Fall/Winter Fishing.
- Same-page Markdown links target renderer slugs: lowercase, punctuation removed, spaces converted to hyphens.

## Project continuation

Chat mode is the permanent default. At the start of a new chat, restore actual latest `main`, confirm open PR state, then read in order:

1. `README.md`
2. `Fishing_Context.md`
3. `Fishing_TODO.md`
4. `Fishing_Decision_Log.md`
5. `Fishing_New_Chat_Bootstrap_Prompt.md`

When the user says **“It’s time to transfer to a new chat”**, ask once to confirm the full handoff, then reconcile repository/production state, update durable records, preserve unresolved work and purchase uncertainty, cross-check the files, and finish with a clickable GitHub link to `Fishing_New_Chat_Bootstrap_Prompt.md`.

`.github/workflows/fishing-production.yml` is the sole active production publisher.
