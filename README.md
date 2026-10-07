# Fishing

Persistent Fishing project and source repository for Fishing Companion.

## Current continuation — October 7, 2026

`ginosega/fishing` is the durable source of truth. Fishing Companion remains a three-domain PWA with canonical source under `pwa/Gear/`, `pwa/KB/`, and `pwa/Catches/`.

Always restore actual latest `main`, current open PRs, and the latest successful production evidence before relying on exact SHA/release/count values. Historical checkpoint identifiers in project Markdown are evidence only.

### October 7 production checkpoint

The latest verified hosted production at this handoff is current `main`:

- production source revision: `574228e5cce29b6bb8095204e7233be8e9e68106`;
- source change: Z-Man ShroomZ Micro Finesse Jig description updated to reference Ned rig usage/technique;
- production workflow: **#491** / run `37255448422`;
- hosted release ID: `62631f3b48f069638bf9e48d13b7c195`;
- hosted counts: **Gear 97 / KB 59 / Catches 12**;
- hosted files: **426**;
- release lane: Fast Content Release;
- exact-current-main guard: passed;
- GitHub Pages deployment: passed;
- hosted byte/release-identity verification: passed with `hostedBytesMatch: true`;
- open PRs before handoff reconciliation: **0**.

This handoff is documentation-only and may advance `main` without republishing the PWA. The production identity above remains the authoritative hosted checkpoint until a later content/application release succeeds.

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
- Electronics Research motor/battery notes refreshed with Garmin Force Current and Newport 24V 50Ah LoPRO details.
- October content releases added/updated Flutter Spoon guidance, NRS Zander PFD, YakAttack BackWater DryPak, Z-Man ShroomZ Micro Finesse Jig, Z-Man Finesse TRD, Z-Man branding, Luhr Jensen Trout & Kokanee Dodger, Yamamoto Senko, and the Sixth Sense/Berkley lure pictures.

Current canonical source, not this summary, controls exact record values.

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
