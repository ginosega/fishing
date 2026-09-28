# Fishing

Persistent Fishing project and source repository for Fishing Companion.

## Current continuation — September 28, 2026

`ginosega/fishing` is the durable source of truth. Fishing Companion remains a three-domain PWA with canonical source under `pwa/Gear/`, `pwa/KB/`, and `pwa/Catches/`.

Always restore actual latest `main`, current open PRs, and the latest successful production evidence before relying on exact SHA/release/count values. Historical checkpoint identifiers in project Markdown are evidence only.

### September 28 production checkpoint

The latest verified hosted production at this handoff is the Fast Content Release for the Electronics Research update:

- production source revision: `006be1c74e3e64c98be518398298965b3489fa5f`;
- source change: direct `main` content edit to `pwa/Gear/Equipment/content/Electronics Research.md`;
- production workflow: **#423** / run `36452795689`;
- hosted release ID: `51b68e6a7353b876bad9648d1aac8072`;
- hosted counts: **Gear 90 / KB 58 / Catches 11**;
- release lane: Fast Content Release;
- exact-current-main guard: passed;
- GitHub Pages deployment: passed;
- hosted byte/release-identity verification: passed;
- open PRs before handoff reconciliation: **0**.

The handoff itself is documentation-only and may advance `main` without republishing the PWA. The production identity above remains the authoritative hosted checkpoint until a later content/application release succeeds.

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

Current canonical source, not this summary, controls exact record values.

## Current RVR119 motorization research

No motor or battery purchase has been made or selected.

Active candidates are:

- **Garmin Force Current with Power Steer Foot Pedals**, most naturally paired with a 24V low-profile battery;
- **Newport NK180Pro HD + 24V 50Ah LoPRO + Wizard**;
- **Newport NK300 HD + 36V 50Ah LoPRO + Wizard**.

Durable constraints/preferences:

- the RVR119 is transported on the F-150 roof rack, so the motor and battery must be easily removable before roof loading;
- low-profile battery packaging that fits under the RVR119 seat is strongly preferred;
- the Newport LoPRO form factor is especially attractive;
- compare lake-fishing boat control/positioning against river ruggedness, weight, setup/teardown, range, reliability and cost;
- preserve purchase uncertainty until the user explicitly chooses and purchases a system.

Current research indicates all three motor systems are removable for transport. The NK180 is the lightest removable motor; the NK300 adds substantially more propulsion at a weight penalty; the Force Current's key differentiator is GPS/electric boat control such as Anchor Lock/Bow Lock and hands-free Power Steer rather than raw propulsion.

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
