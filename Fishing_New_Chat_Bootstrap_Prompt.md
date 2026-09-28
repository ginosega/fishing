You are continuing my persistent **Fishing** project. The durable repository is `ginosega/fishing` on GitHub. Restore current state from actual latest `main` before acting; do not rely on an old chat or assume a previously observed commit/release is still current.

## Operating mode

Use **Chat mode** by default and permanently. Do not recommend Work merely because a task is complex, lengthy, file-heavy, analytical, requires research/calculations, creates artifacts, or involves substantial context. Recommend a temporary switch only for a genuinely Work-only capability; explain the specific need and obtain my approval first, then return to Chat.

## First actions

Read these files from actual latest `main`, in order:

1. `README.md`
2. `Fishing_Context.md`
3. `Fishing_TODO.md`
4. `Fishing_Decision_Log.md`
5. `Fishing_New_Chat_Bootstrap_Prompt.md`

Before repository work, also confirm current open-PR state. Newer repository/production evidence controls over stale chat descriptions. For exact production SHA/release/counts, inspect the latest successful `main` production workflow and hosted verification evidence.

## Handoff checkpoint — September 28, 2026

At this handoff, the latest verified hosted production is the Fast Content Release for the Pflueger President spincast reel update:

- production source revision: `626e874d3fc88f7ac11dd97988920f90bc2fb8ea`;
- implementation PR: #200;
- production workflow: **#422**, run `36430594308`;
- hosted release ID: `0e2e4d903de78b6affe1d1dc55204c7b`;
- hosted counts: **Gear 90 / KB 58 / Catches 11**;
- exact-current-main guard, Pages deployment and hosted byte/release-identity verification all passed;
- open PRs before handoff reconciliation: **0**.

The handoff update itself is documentation-only and may advance `main` without republishing the PWA. Treat the production source revision above as the hosted production checkpoint until a later release succeeds.

FISH114 remains the latest completed application/architecture change. FISH071–076 and FISH078–114 are complete/implemented. The next unused application/architecture ID is **FISH-TODO-115** unless newer `main` has allocated it. Routine FISH108 content work does not consume application IDs.

## Recent canonical content state

Since the prior handoff, current canonical source includes:

- five **Banks Lake catches from September 24, 2026**, all with pictures and Notes Markdown:
  - 12-in smallmouth — Z-Man Ned Rig Kit;
  - 14-in largemouth — Z-Man Ned Rig Kit;
  - 8-in Lake whitefish — Lake whitefish species + Z-Man Ned Rig Kit;
  - 15-in smallmouth — Berkley PowerBait Power Jerk Shad;
  - 14-in smallmouth — Berkley PowerBait Power Jerk Shad;
- **Lake whitefish** as a Species KB entry with picture/content;
- updated **Z-Man Ned Rig Kit** specifications;
- **ZMan Finesse ShadZ**, **ZMan Trick ShotZ**, **ZMan TRD GobyZ** with pictures and Drop Shot Notes links;
- **Blue Fox Flash Spinner** and **Bad River Tackle Company Trout/Panfish Spinners**;
- removal of the old generic/South Bend inline-spinner Gear item and cleanup of its live KB reference;
- **VMC Swimbait Jig** Notes;
- Banks Lake inline-image filename/case/Markdown cleanup;
- Berkley PowerBait Power Jerk Shad Notes wording cleanup;
- Pflueger President Spincast Combo rod/reel Notes updates and reel capacity `110 yd / 4 lb, 90 yd / 6 lb, 70 yd / 8 lb`.

Git history and current canonical source are authoritative for exact values.

## Active RVR119 motorization research — important

No motor or propulsion battery has been selected or purchased.

Current candidates:

1. **Garmin Force Current with Power Steer Foot Pedals**
2. **Newport NK180Pro HD + 24V 50Ah LoPRO + Wizard Motorization Kit**
3. **Newport NK300 HD + 36V 50Ah LoPRO + Wizard Motorization Kit**

Durable user constraints/preferences:

- RVR119 is transported on the roof rack of the user's F-150; motor and battery must be easily removable before roof loading.
- Low-profile battery packaging that can fit beneath the RVR119 seat is strongly preferred.
- The Newport LoPRO form factor is specifically attractive.
- Preserve purchase uncertainty; research does not imply ownership.
- Compare boat positioning, river ruggedness, installed/removable weight, setup/teardown, range, reliability, cost and serviceability — not just thrust/speed.

Current research status:

- NK180 HD: lightest removable motor and best preserves the RVR119's river character.
- NK300 HD: materially stronger propulsion and only modestly more expensive than the complete NK180 RVR kit, but carries a substantial on-water weight penalty.
- Force Current: strongest differentiator is GPS/electric boat control — Anchor Lock, Bow Lock, heading/route control, remote control and true hands-free Power Steer.
- Newport motors are designed to come off their stern brackets for travel; Wizard steering/control lines must be disconnected.
- Garmin explicitly requires Force Current removal before transport; its motor detaches from the installed mount and Power Steer pedals detach from their rails.
- Large motor/battery components therefore do not need to be lifted onto the truck roof with the kayak.
- For Force Current, 24V 50Ah LoPRO is preferable to the same-footprint 12V 100Ah LoPRO because stored energy is similar while 24V preserves full 24V motor performance.

Useful next research:

- other manufacturers' **24V low-profile batteries** that fit under the RVR119 seat;
- RVR119-specific Force Current/Power Steer pedal installation photos/measurements;
- parking-lot setup/teardown comparison for Force Current vs Wizard-equipped Newport;
- realistic range/runtime in the user's lake and river use;
- real-owner reliability, particularly Force Current steering/calibration/shutdown reports.

Track this as **FISH-TODO-040**; do not mark it complete until the user explicitly decides the research is finished or chooses a system.

## Science of the Strike transcript research

Recent transcript reviews covered:

- largemouth vision;
- scent and taste;
- barometric pressure and lunar cycle;
- crawfish;
- dissolved oxygen and turbidity.

For every transcript extraction, preserve this structure unless the user asks otherwise:

1. Executive summary
2. Main arguments/conclusions
3. Key facts/claims with evidence vs opinion/inference
4. Actionable fishing takeaways
5. Important examples/stories/anecdotes
6. Techniques/gear/seasonal/location/fish-behavior insights worth retaining
7. Short **What I'd add to Fishing Companion** section

Evidence discipline is durable: distinguish study evidence from host inference; do not universalize a single-study threshold, one population, lab results, anecdotal conversions or host extrapolations.

Potential Fishing Companion destinations include Bass Behavior and Habitat, Bass Fishing Techniques, seasonal pages and Electronics Research. Do not recreate retired live Technique pages merely to house podcast material.

`FISH-TODO-031` remains OPEN because the originally targeted episodes 8 and 16 have not both been explicitly confirmed complete; a dissolved-oxygen/turbidity transcript has been reviewed.

## Current KB editorial architecture — critical

### Behavior and Habitat

- **Bass Behavior and Habitat** / **Trout Behavior and Habitat** answer **where fish are and why**: habitat, structure/cover, temperature, dissolved oxygen, forage, light, wind/current, depth and pattern recognition.

### Fishing Techniques

- **Bass Fishing Techniques** / **Trout Fishing Techniques** answer **how to catch fish once located**: presentation choice, lure/bait/rig selection, retrieves, depth control, strike handling and bank/kayak execution.

### Seasonal playbooks

- Spring Fishing, Summer Fishing, Fall Fishing and Winter Fishing own detailed seasonal location + presentation strategy.

### Topwater

- Topwater Fishing owns broad surface-fishing strategy; Frog, Popper, Whopper Plopper, Walking Bait and Buzzbait remain narrower Gear Guides.

### Linking/retirement rules

- Use curated `kb://` links where they materially help the reader.
- Do not reintroduce retired Technique pages unless explicitly requested: Bass Fishing, Spring Bass Fishing, Fall Bass Fishing, Bass Power and Search Overview, Color and Scent, Paddle-only Kayak Strategy, Seasonal Bass Guidance and Water Visibility.

## FISH108 release policy — critical

Full policy: `pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md`.

### Fast Content Release

Use only when **every changed repository file** is under one or more of:

- `pwa/Gear/`
- `pwa/KB/`
- `pwa/Catches/`

Before mutation, restore current source/open PRs and validate source revision/ancestry, record hashes/base fields where applicable, conflict state, IDs/schema/types/paths/references, notes/media actions and supplied media metadata. Apply only requested changes; preserve unrelated/newer source and user-uploaded bytes.

Use one lightweight content PR, locked cached dependencies, canonical production build/source inventory validation, generated-release verification, exact-current-main guard, Pages deployment and dependency-free byte-for-byte hosted/release-identity verification.

Do not manually escalate routine content-only work to the full app suite unless a genuine non-content issue is discovered. Routine Fast Content Releases do **not** consume application task IDs or require per-item project-state documents.

### Full Application Release

Runtime/UI/assets, service worker, schema/contracts, tests, build/tooling, dependencies, workflow, migration/recovery/offline architecture or mixed content+non-content changes use the full suite. Documentation-only project-state reconciliation does not publish the PWA.

## Durable authoring/application behavior

- Gear/KB Add/Edit remains **Prepare Changes → Copy Changes**; copying is not saving and the browser does not write GitHub source directly.
- GitHub upload links target physical `/pwa/...`; packages use logical `Gear/...`, `KB/...`, `Catches/...` paths.
- Existing IDs remain stable unless intentionally retired/replaced.
- Simple Markdown narrative edits may be direct; structured fields/categories/types/specifications/links/pictures/sequences/paths/relationships use the source-aware workflow.
- KB `description` maximum is 80 characters.
- Same-page Markdown links use renderer-generated lowercase punctuation-stripped hyphenated anchors.
- FISH091: complete offline library is explicitly prepared through **Connection Status → Update offline library**.
- FISH096: Knot sequences use explicit ordered `pictureSequence` frames under `pwa/KB/Knots/assets/<id>/`.
- FISH102: Line-Tackle-Knot Reference is pinned first only under KB → Knots.
- FISH103: external HTTP(S) links open new-tab; internal/local links remain same-tab.
- FISH107: Skylety Fishing Hook Sharpener canonical type is `Tools`.
- `.github/workflows/fishing-production.yml` is the sole active publisher.

## Active backlog highlights

- FISH-TODO-008: RVR119 Under Seat Tackle Storage remains back-ordered/not purchased and is the user's #1 needed fishing equipment item.
- FISH-TODO-014 remains open; do not infer the existing HyperSeal 3600 resolved the historical deep-box target.
- FISH-TODO-019/020/021/022/023: Texas Rig, Carolina Rig, Alabama Rig, Neko Rig and Spoons KB pages remain open.
- FISH-TODO-039: Apply T-9 on kayak hardware.
- FISH-TODO-040: RVR119 motorization research, described above.
- Fishing Companion v3 remains deferred and requires explicit approval.

FISH-TODO-030 was explicitly deleted and must never be restored. FISH-TODO-038 outer rod holder work is complete.

## Chat-transfer convention

For this project, **“It’s time to transfer to a new chat”** is the standard transfer cue. Ask once to confirm the full handoff. After confirmation, execute it end-to-end without repeated Proceed prompts: restore actual current `main`, open PRs and production evidence; reconcile completed/unresolved work; update authoritative records where durable state changed; preserve purchase uncertainty; cross-check the files; and finish with a clickable GitHub link to this bootstrap prompt.

## Working rules

- Use current GitHub source as authority.
- Do not repeat completed migration/cutover/release work.
- Preserve unrelated concurrent source changes and user-uploaded bytes.
- Fishing Companion change packages are implementation instructions, not JSON merely to explain.
- Do not infer purchases/ownership or close WAITING/OPEN purchase items without explicit evidence.
- Historical milestone docs and old production identities are evidence only; current exact production state comes from current GitHub/Pages evidence.
