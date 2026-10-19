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

## CURRENT NEW-CHAT START — October 19, 2026 v3 handoff

**The owner has ALREADY approved Fishing Companion v3 requirements, technical design, UX screens/flows AND the staged implementation plan.** Do not ask for these approvals again. The implementation-plan approval has one explicit prerequisite: **full reconciliation/transfer to this new Chat conversation before beginning P0 or any v3 implementation**. The previous chat performed only documentation approval, latest-main/open-PR/production evidence handoff, and durable-file reconciliation; **P0 itself was not executed, no app code changed, and no deployment or GitHub App/service setup occurred**.

- [Approved requirements](pwa/docs/Fishing_Companion_v3_Requirements.md) and [requirements approval](pwa/docs/Fishing_Companion_v3_Requirements_Approval_2026-10-19.md)
- [Approved technical architecture](pwa/docs/Fishing_Companion_v3_Technical_Design.md) and [design approval](pwa/docs/Fishing_Companion_v3_Technical_Design_Approval_2026-10-19.md)
- [Approved sign-in / editing-and-publishing / Connection Status UX](pwa/docs/Fishing_Companion_v3_UX_Review.md) and [UX approval](pwa/docs/Fishing_Companion_v3_UX_Approval_2026-10-19.md)
- [Approved staged implementation plan, P0–P8](pwa/docs/Fishing_Companion_v3_Implementation_Plan.md) and [conditional approval record](pwa/docs/Fishing_Companion_v3_Implementation_Plan_Approval_2026-10-19.md). Exact user-reviewed plan commit `7cc7eea06a110e041dbf552855957713df4b1c51`, blob `8d23d327033b1b348abb53d8462ccd2bb8dc0513`.

### Work to begin in this new chat

**Start P0 — Restore production and source baseline, investigate/measure reliability and plan tests — only after the first-actions restoration above and verification that the October 19 handoff PR was merged.** Re-read the approved plan, discover current GitHub permissions and exact latest main, open PR state, current production workflow and hosted `release.json`; audit current source/UI/offline/release/tests and safe preview strategy. Investigate and baseline the **Android installed-PWA external-link issue**, **post-deployment stale-session missing images/pages** and **3–4-second card-image appearance**. Gather user-device evidence via short step-by-step instructions as needed. Do not prematurely blame service worker or image sizes without reproduction/measurement. P0 is authorized by the approved plan **in this new chat**; stay within its scope and report results and proposed next stage.

### Current v3 product and architectural contract (do not reopen scope)

- **Public reading remains anonymous by default**, with only a discreet **Sign in with GitHub** link in the refreshed **Connection Status** dialog. Only one authorized GitHub account can edit and publish; valid prior sessions auto-restore if technically possible. Unauthorized accounts get no editing controls. Real PWA session persistence/callback behavior is **AUTH-P0**, a hard feasibility gate.
- **One Save and Publish** action (no separate approval per content item, no user-facing Copy Changes); direct GitHub/App-backed validation, atomic record/Markdown/media writes, safe PR auto-merge, FISH108 eligible content release and **final hosted byte/release verification**. A user can leave an editor after the service durably accepts a submission; status remains accessible.
- **Integrated image uploads**, existing Gear/KB Add/Edit and current-schema **Catch Add/Edit**; local Markdown pictures open existing viewer; **no Catch photos**, GPS, sessions or extra user capture complexity.
- **Connection Status visual refresh:** persist Automatic versus Work Offline across restarts; separate network, offline-library readiness/release identity, owner sign-in/out and any publication progress. Work Offline is for reading a complete verified offline library; no new queued writes.
- **Image performance:** instrument measured causes, consider deterministic build-generated small card thumbnails without changing canonical originals. **Deployment reliability:** protect old/new coherent release selection and preserve source/byte verification. **Android link bug:** ordinary links fail in Chrome installed PWA but work in Chrome and Edge browser tabs; long-press offers Open in browser; YouTube app-link opens in installed Chrome and in Edge browser. Installed Edge app and iOS remain unverified.
- **Local drafts are provisional, device-local only**, automatic Restore/Discard prompt; may continue an already-open edit after selecting Work Offline, but no background sync, offline new-session authoring, or automatic queued publishing. **Remove this support layer if reliability testing finds unacceptable regressions**, retaining safe online authoring.
- **No new features**, broad multi-user support, offline queue/sync, Catch photo/GPS, or parallel content database. Preserve canonical GitHub source and the existing approved v2 application until a separate v3 cutover approval.
- Technical design recommends **GitHub App + minimal trusted publishing broker**, with credentials/authorization verified server-side. **AUTH-P0** must test cross-origin session persistence and OAuth return on real installed Android/iOS PWAs. Do not assume third-party cookies; no unapproved custom domain, paid provider, privilege expansion, or security workaround.
- **Authorization boundaries:** Plan and scoped work approved after transfer. A specific provider/domain/permission or paid infrastructure change, independently released v2 reliability fix, and v3 production cutover require their own later user approvals. No branch-rule bypass. Any application/runtime change uses Full Application Release; eligible normal content stays FISH108.
- **Chat default.** If an upcoming hands-on browser/UI test truly requires Work-only capability, tell the user before that step, explain why and obtain agreement to temporarily switch. Don't wait until a long unresponsive turn. Installed Android/iOS physical-device tests may still require the user's help.

### GitHub/production snapshot verified during October 19 handoff (historical)

- `main` **before** handoff approval commits: `7cc7eea06a110e041dbf552855957713df4b1c51`, **0 open PRs**. The new documentation-only handoff PR changes latest main but **does not publish the PWA**. Confirm its merge and new current main at startup.
- Latest successful main production workflow: **#520** / GitHub Actions run **38686171921**, Fast Content Release, **October 15, 2026 UTC**, published source `4fc893d044b72e61fbc36cfd82103af55bc36f97`.
- Verified hosted release `f5eab01e9d5af6101f03a7094de5b565`, **100 Gear / 60 KB / 12 Catches / 431 files**, `hostedBytesMatch: true`; release/source match confirmed by deploy-content log and hosted-verification artifact. Actual new-chat production evidence may supersede this snapshot.
- This handoff preserves all active fishing, Garmin Force Current commissioning/storage, gear-watch and KB TODOs from this file and the canonical `Fishing_TODO.md`; do not invent resolution. FISH114 remains last completed application milestone at checkpoint; **FISH-TODO-115** was next unused standalone application ID.

**Opening instruction for this new conversation:** Acknowledge the approved plan/handoff state; restore current repository and production evidence, then begin P0 in Chat mode under the approved plan. If implementation requires unavailable tools, make that capability gap explicit before switching modes or performing the work. Do not repeat past requirements/design/UX/plan debates and do not start with an unsolicited approval request.

---

## Prior handoff checkpoint — October 12, 2026 (historical)

Verified production **before** this documentation-only reconciliation:

- source revision: `e71c9ab6a90da46f8b46c7977bf476a1633fa94c`;
- last production change: Banks Lake Location representative picture, **PR #228 merged**;
- workflow **#517** / run `38207507318`, Fast Content Release, succeeded;
- hosted release ID: `0f4bd1f9e9e12b2b1981d61b48e3e501`;
- hosted counts: **100 Gear / 60 KB / 12 Catches**, **431 files**;
- exact-current-main guard, Pages deployment and byte/release-identity verification succeeded: `hostedBytesMatch: true`;
- open PRs before handoff: **0**.

This handoff changes only the five root project Markdown records and **does not publish a new PWA release**. Thus the post-handoff `main` commit may differ from the production source revision above. Always inspect the latest workflow, hosted verification and actual `main` at new-chat start.



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
- Earlier motor/battery research in Electronics Research was replaced; its **current Notes are focused on chart plotters/fish finders**. Garmin Force Current has its own Gear record and maintenance Notes.
- October releases added/updated Flutter Spoon content, NRS Zander PFD, YakAttack BackWater DryPak, Z-Man ShroomZ Micro Finesse Jig, Z-Man Finesse TRD, Z-Man branding, Luhr Jensen Trout & Kokanee Dodger, Yamamoto Senko and three lure-picture replacements.

### October 8–12 verified content additions/edits

- **PR #221:** YakAttack Fully Loaded TracPak Combo Kit (orange) and YakAttack 10L Roll-Top Drybag (orange), using existing images.
- **PRs #222–224:** Garmin Force Current with Power Steer foot pedals Gear item, component Notes, and final display name.
- **PR #225:** Electronics Research renamed/refocused to chart plotters/fish finders; dedicated picture. Do **not** reinstate old motor/battery Notes on that page.
- **PR #226:** Lake Stevens Location fishing guide for launch/access, bass, trout, kokanee and perch.
- **PR #227:** Garmin Force Current maintenance checklist and illustrated components Notes.
- **PR #228:** Banks Lake Location representative picture (uploaded image preserved). The previous ChatGPT turn was interrupted, but this PR was **merged and production verified**, so do **not** reopen it.

Current authoritative content at the handoff: **100 Gear / 60 KB / 12 Catches**, including **10 Locations**.

Git history and current canonical source are authoritative for exact values.

## Active RVR119 Force Current commissioning — important

The motorization purchase is complete. **Do not revert to the old “no purchase decision” state.**

### Purchased October 6, 2026

- Garmin **Force Current** trolling motor
- Garmin **Power Steer wireless foot pedals**
- Garmin handheld remote
- Garmin MOB tag
- **Redodo 24V 50Ah LiFePO4 battery**
- Redodo charger
- Garmin high-efficiency propeller
- Garmin weedless propeller
- purchase price: **$2,800**
- seller: Gresham, Oregon
- original Garmin receipt: **July 2026**
- Garmin directly confirmed to the user that the remaining three-year standard warranty will be honored with that receipt
- seller reported **freshwater-only** use

### Current task — FISH-TODO-040

FISH-TODO-040 remains OPEN and now means **commission/integrate the owned Force Current system**, not compare candidate motors.

Current work:

1. clean and inspect motor/mount/shaft/rope/connectors/props/sacrificial anodes;
2. inspect, charge and baseline the Redodo battery/charger;
3. clear prior-user Garmin data and restore factory defaults;
4. restore/re-pair the handheld remote, both Power Steer pedals and MOB tag;
5. update motor/remote/pedals through ActiveCaptain;
6. calibrate both pedals and the handheld remote;
7. install on RVR119 with proper 40A circuit protection;
8. perform on-water motor compass/bow-offset calibration and full propulsion/steering/Anchor Lock/MOB testing.

Do not run the propeller out of water. Do not perform invasive preventive service on this three-month-old warrantied motor unless a fault requires it.

### Active storage-case search and foam insert

Find a **hard-plastic** storage case/bin for the motor and pedals:

- minimum usable internal dimensions: **38 × 18 × 8 in**;
- compact/snug fit strongly preferred;
- **orange preferred**;
- no flexible bags;
- no need for expensive/heavy Pelican/Otter-level construction;
- Hyper Tough 50-gallon tote was rejected as too large;
- verify **usable interior dimensions**, not exterior dimensions alone;
- a **48 × 19 × 14 in lidded hard-plastic bin** is being discussed for the foam-insert solution; purchase/ownership and actual usable interior dimensions were **not confirmed**;
- use a protective insert that leaves the Force Current controls, shaft, pedals and connectors unloaded. Cut closed-cell EVA/PE sheet foam is the safe default; rigid Fireblock/Gaps & Cracks spray foam should not directly encase the gear. Window & Door low-expansion foam was considered as a **test**, not selected as the permanent design;
- **FISH-TODO-040 remains OPEN**; do not infer the storage or commissioning work is done.

Transport constraint remains: the kayak goes on the F-150 roof rack, so the motor, propulsion battery and pedals must remain readily removable before roof loading. The Newport 24V 50Ah LoPRO remains only a possible future lower-profile battery alternative; the **Redodo 24V 50Ah is the currently owned battery**.

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
- FISH-TODO-040: purchased Force Current commissioning/integration and hard-plastic storage-case selection, described above.
- Fishing Companion v3 **requirements, design, UX and staged implementation plan all APPROVED October 19, 2026**, the last with **mandatory full new-chat transfer before P0**. See the top CURRENT NEW-CHAT START instructions and [plan approval record](pwa/docs/Fishing_Companion_v3_Implementation_Plan_Approval_2026-10-19.md). Plan now authorizes scoped post-transfer P0; AUTH-P0, provider/permission/cost decisions, any v2 maintenance release, provisional draft reliability removal and later explicit v3 production cutover gates remain binding.

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
