# Fishing Decision Log

This file records **current durable decisions**. Detailed historical release evidence remains in Git history and dated `pwa/docs/` records rather than being repeated here.

## Operating mode

**Decision:** Chat mode is the permanent default. Do not recommend Work merely because work is complex, lengthy, file-heavy, analytical, research/calculation-heavy or artifact-producing. Use a temporary Work switch only for a genuinely Work-only capability after explaining the need and obtaining explicit user approval.

## Fishing Companion v3 P0-C — accepted Chrome Android external links (October 20, 2026)

**Owner decision:** Accept Google's [documented Chrome Android PWA behavior](https://web.dev/articles/add-manifest): tapping an ordinary external link with `target="_blank"` in an installed Chrome PWA may open it in a browser-powered **Chrome Custom Tab** attached to the app, rather than a separate regular-browser tab. On October 19 the owner initially preferred an out-of-app Chrome tab and observed that the Daiwa Gear link opened in-app, while ordinary Chrome opened it in a new tab. After verifying Google's platform documentation on October 20, the owner explicitly accepted the installed-PWA behavior and directed the project to move on. This **supersedes** the prior out-of-app requirement. P0-C is **CLOSED — ACCEPTED NATIVE BEHAVIOR / NO CODE CHANGE**.

**Preserve:** existing external link activation and safe `noopener noreferrer`, internal app routing, YouTube native-app delegation, and normal browser-tab new-tab behavior. Do **not** pursue Android intent/browser-escape hacks or a v2 maintenance release merely to force a regular tab. This acceptance is specific to Chrome Android, not proof about Edge/iOS installed behavior. The separate v3 **AUTH-P0 sign-in/callback return feasibility gate remains mandatory**. Source evidence and disposition: [P0-B/P0-C diagnostics](pwa/docs/Fishing_Companion_v3_P0_Image_and_External_Link_Diagnostics_2026-10-19.md).

## New-chat transfer and handoff

**Decision:** When the user says **“It’s time to transfer to a new chat”** or clearly equivalent wording, ask once for confirmation that they want the full project handoff. Once confirmed, execute it end-to-end without repeated “Proceed” prompts: restore actual latest `main`, open PRs and current production evidence; reconcile durable state; update authoritative records where project state actually changed; preserve unresolved work and purchase uncertainty; cross-check records/bootstrap; and finish with a clickable GitHub link to `Fishing_New_Chat_Bootstrap_Prompt.md`.

Routine content releases do not require state-file churn merely so a later handoff can discover them. Git history and current canonical source remain authoritative for those events.

## Repository authority

**Decision:** `ginosega/fishing` is authoritative. Restore actual latest `main` and open-PR state before implementation/release/repository-write work.

Canonical physical content roots are `pwa/Gear/`, `pwa/KB/` and `pwa/Catches/`; logical paths remain `Gear/...`, `KB/...` and `Catches/...`. `.github/workflows/fishing-production.yml` is the sole active publisher.

For exact current production SHA/release ID/counts, inspect the latest successful `main` production workflow and deployed `release.json`/hosted verification evidence. Do not maintain volatile production identifiers as permanent narrative truth.

## FISH108 — two-lane release discipline

**Decision/status:** APPROVED and IMPLEMENTED. Full policy: [`pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md`](pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md).

### Fast Content Release

Use Fast Content Release only when **every changed file** is beneath `pwa/Gear/`, `pwa/KB/` and/or `pwa/Catches/`.

Fast releases require source/package conflict validation before mutation, one lightweight content PR, locked cached dependency installation, one canonical production build/source inventory validation, exact generated-release verification, exact-current-main deployment protection, and dependency-free byte-for-byte hosted/release-identity verification.

**Decision:** Do not run full Node behavior tests, Chromium/WebKit, preview-browser regression, archived-v1/cutover regression, dependency audit or hosted browser acceptance for content-only work unless validation reveals an actual non-content problem.

**Decision:** A routine Fast Content Release does not consume a `FISH-TODO-###` application/architecture ID and does not require a per-item production-closeout or per-item project-state document update.

### Full Application Release

Any file outside the three canonical content roots forces full. Runtime/UI/assets, service worker, schema/contracts, tests, build/tooling, dependencies, workflow, migration/recovery/offline architecture and mixed content+non-content changes retain the comprehensive full suite. If eligibility is ambiguous, use full.

## FISH109 — release retry hardening

**Decision/status:** IMPLEMENTED and production-verified. Pages deployment and hosted-evidence artifacts are run-attempt-specific; hosted verification uses bounded retry/backoff for transient propagation/network failures; exact-current-main protection remains mandatory.

## FISH110 — release-aware Copy Changes handoff

**Decision/status:** IMPLEMENTED and production-verified. Gear/KB Add/Edit → **Copy Changes** uses one centralized release-aware instruction. Eligible content-only packages route through FISH108 Fast Content Release; non-fast packages use the repository's current appropriate lane. The human instruction and JSON remain separated by a blank line so JSON is parseable.

## FISH111 — shared page layout alignment

**Decision/status:** IMPLEMENTED and production-verified. Fishing Companion uses one shared horizontal content grid: the site-header brand/connection control and main page content share the same left/right insets, and long-form Notes/Markdown uses the full main-content width rather than the former 900 px/78ch caps. Mobile preserves the same rule with its existing 16 px inset. Pictures, detail tables, editor forms and other intentionally narrower components keep their own caps.

## FISH112 — fixed cross-platform card icon artwork

**Decision/status:** IMPLEMENTED / PRODUCTION-VERIFIED / USER-VERIFIED.

### Final implementation decision

**Decision:** Home, My Gear, and Knowledge Base card icons use 16 bundled user-approved transparent PNG assets under `pwa/assets/card-icons/` rather than OS-dependent emoji glyphs. Preserve current card geometry, spacing, labels, search/Back controls, routes, navigation, and small icon scale/placement.

**Decision:** The final generated transparent-with-shadow PNG assets are the authoritative artwork. Earlier exploratory Google/Noto, Fluent, Twemoji-style references and mockups are historical design references only and are not the live source assets.

**Decision:** The production build must carry these assets into each content-addressed release and include them in release identity/manifest verification. Regression coverage must continue to protect the exact 16-file set, transparency, card mappings, production-build byte preservation, and manifest inclusion.

### Production closeout

FISH112 was implemented in PR #168 and released through Full Application Release workflow #298 / run `35119930916` from source revision `89ca4773365f8d99750b9424b5cb9eefb4a29907`. Hosted release `f5d691d727fd439ff5553f6c7db509f4` passed actual hosted production byte and browser verification. The user then inspected production and confirmed that it looks correct.

Detailed evidence: [`pwa/docs/FISH112_Production_Closeout_2026-09-16.md`](pwa/docs/FISH112_Production_Closeout_2026-09-16.md).

**Decision:** FISH112 is closed.

## FISH113 — responsive scenic page heroes

**Decision/status:** IMPLEMENTED / PRODUCTION-VERIFIED / USER-VERIFIED / CLOSED.

### Final artwork and responsive behavior

**Decision:** Home, My Gear, and Knowledge Base root pages use the scenic mountain/lake hero artwork under `pwa/assets/page-hero/`. Non-root headers remain unchanged.

**Decision:** The authoritative hero pair is:

- `page-hero.png` — 1536 × 512 (3:1), used for standard/narrow layouts;
- `page-hero-wide.png` — 3072 × 512 (6:1), used for sufficiently wide landscape layouts.

**Decision:** The 3:1 asset must remain pixel-for-pixel the exact centered crop of the 6:1 master so crossing the responsive breakpoint looks like one continuous scene rather than two separately generated images.

**Decision:** Wide-hero activation is geometry-based responsive art direction, not monitor/display-resolution detection. Preserve the dark overlay treatment and existing page text/card/navigation behavior.

**Decision:** The superseded WebP hero artwork is retired; the final PNG pair is authoritative.

### Production closeout

FISH113's final responsive implementation was merged in PR #173 as source revision `fab438e2833b131204a5e4c29ab1685df0ae8fbf`. Full Application workflow #312 / run `35139240830` deployed hosted release `6a1f85979ecabc197ec66368b9fe0a65` after a targeted retry cleared one unrelated timing-sensitive WebKit offline-cache test. Actual hosted byte/release/browser verification passed.

The user inspected the final live responsive behavior and confirmed: **“It’s great. No more adjustments are needed.”**

Detailed evidence: [`pwa/docs/FISH113_Production_Closeout_2026-09-16.md`](pwa/docs/FISH113_Production_Closeout_2026-09-16.md).

**Decision:** FISH113 is closed.

## FISH114 — Android/Edge maskable launcher icon

**Decision/status:** IMPLEMENTED / PRODUCTION-VERIFIED / USER-VERIFIED / CLOSED.

**Decision:** Preserve the approved transparent `pwa/icon.png` as the ordinary source icon. Generate the Android adaptive/maskable variant at build time rather than replacing or mutating the approved source.

**Decision:** The production manifest publishes both an ordinary `purpose: "any"` icon and a dedicated `purpose: "maskable"` icon. The generated maskable icon uses opaque `#11665c` background, centered approved artwork, and participates in release identity and verification.

FISH114 was implemented in PR #179 from source revision `771c80baa21fe17f331614f6658b5278475178ed`. Full Application workflow #349 / run `35306208653` deployed hosted release `9e9cc6e2f388439c1d745c0e74122c33`; full validation, Pages deployment and actual hosted byte/browser verification passed. The user visually inspected the installed Android result and confirmed it looks great.

Detailed evidence: [`pwa/docs/FISH114_Production_Closeout_2026-09-18.md`](pwa/docs/FISH114_Production_Closeout_2026-09-18.md).

**Decision:** FISH114 is closed. The next unused application/architecture task ID is **FISH-TODO-115** unless newer `main` has already allocated it.

## KB editorial ownership model

**Decision:** Broad fishing-reference pages have complementary responsibilities:

- **Behavior and Habitat** pages own **where fish are and why**: habitat, structure/cover, temperature, oxygen, forage, light, wind/current, depth and pattern-recognition principles.
- **Fishing Techniques** pages own **how to catch fish once located**: presentation/lure/bait choice, rigs, retrieve/cadence, depth control, strike handling and bank/kayak execution.
- **Spring / Summer / Fall / Winter Fishing** own detailed seasonal location + presentation strategy for both bass and trout.
- **Topwater Fishing** owns broad specialized surface-fishing strategy; Frog, Popper, Whopper Plopper, Walking Bait and Buzzbait remain narrower companion Gear Guides.

**Decision:** Internal cross-links should be curated for reader value rather than mechanically applied to every keyword occurrence.

**Decision:** The old Bass Fishing, Spring Bass Fishing, Fall Bass Fishing, Bass Power and Search Overview, Color and Scent, Paddle-only Kayak Strategy, Seasonal Bass Guidance and Water Visibility pages are retired from live canonical content. Historical evidence may still mention them.

## Domain architecture and authoring boundary

**Decision:** Fishing Companion retains independent Gear, Knowledge Base and Catch domains. KB types are Location, Species, Equipment/Gear Guide, Technique and Knot. Paths are explicit record properties; existing IDs remain stable unless intentionally retired/replaced. Retired trips/sessions/planner/setup structures remain retired unless explicitly re-approved.

**Decision:** Gear/KB browser Add/Edit uses **Prepare Changes → Copy Changes** to create `fishing-companion-change-v2`. Preparing/copying is not saving; browser-side repository writes/uploads are not current production. Physical authoring upload links use `/pwa/...` while packages use logical paths.

Simple Markdown-only narrative edits may be made directly. Structured record fields, categories/types, specifications, structured links, picture metadata/sequences, paths and relationships should use the source-aware workflow.

### Authoring constraints

- Normalize accidental trailing whitespace unless explicitly asked to preserve it.
- KB `description` maximum is 80 characters.
- Preserve unrelated concurrent changes and user-uploaded bytes; reconcile newer `main` before merge if it advances.
- Same-page Markdown heading links must target the renderer-generated slug: lowercase, punctuation stripped, spaces converted to hyphens. Do not use capitalized/percent-encoded original heading text as the anchor target.

## Durable application behavior

- **FISH091:** normal online use does not provision the complete offline library; **Connection Status → Update offline library** explicitly prepares/refreshes a verified complete generation.
- **FISH096:** Knot-only explicit ordered `pictureSequence`; physical frames under `pwa/KB/Knots/assets/<id>/`; at least two frames; `picture.src` is final/representative; directory contents alone never create a sequence.
- **FISH102:** Line-Tackle-Knot Reference is pinned first only on KB → Knots.
- **FISH103:** external HTTP(S) links open new-tab with `noopener noreferrer`; internal app/local links remain same-tab; authoring uploads use physical `/pwa/...`; Caption focus and provisional new-KB Markdown Preview behavior retained.
- **FISH107:** canonical Skylety Fishing Hook Sharpener type is `Tools`.

## Backlog decisions

**FISH-TODO-005:** resolved. The user explicitly confirmed the installed fish-finder power system as Amped Outdoors 12V 8Ah, 3A fuse, IP68 connector and 22–18 AWG disconnects.

**FISH-TODO-014:** remains OPEN. FISH105's HyperSeal 3600 was not explicitly identified as the historical deep-box watch target.

**Decision:** The broad Technique redesign does not implicitly close specialized future pages. Texas Rig, Carolina Rig, Alabama Rig, Neko Rig and Spoons remain open until explicitly completed.

## Fishing Companion v3

**Decision (October 19, 2026):** Fishing Companion v3, tracked as FISH-TODO-037 (historically FISH-TODO-077/P2), has **explicitly approved requirements**; the user reviewed and signed off [the v3 requirements](pwa/docs/Fishing_Companion_v3_Requirements.md) **as-is**. The [approval record](pwa/docs/Fishing_Companion_v3_Requirements_Approval_2026-10-19.md) identifies the exact reviewed version. **Technical design preparation and review are authorized; design sign-off, implementation, and production deployment are not.** Approved scope: public anonymous reading; discreet GitHub sign-in in Connection Status; a single authenticated owner; direct automatic Save and Publish via validated GitHub releases; integrated media uploads; current-schema Catch authoring; clickable Markdown pictures; persistent Automatic/Work Offline reading selection; performance and Android/deployment reliability fixes. Device-local draft recovery and offline continuation of an already-open edit are provisional and removable at testing. Full offline authoring/queued sync, broad multi-user support, Catch photos/GPS, and user-facing Copy Changes are excluded. Preserve GitHub as canonical source and the established release checks.

**Decision (October 19, 2026 — subsequent v3 gate):** The user explicitly approved [v3 technical design](pwa/docs/Fishing_Companion_v3_Technical_Design.md) **as-is**, with no additional v3 features. The [technical design approval record](pwa/docs/Fishing_Companion_v3_Technical_Design_Approval_2026-10-19.md) pins the exact reviewed revision. The user additionally requested a [screen-level UX preview](pwa/docs/Fishing_Companion_v3_UX_Review.md) for sign-in, editing/submit/publish and Connection Status **before implementation**. UX review and implementation plan are pending; **neither implementation nor deployment is authorized**. AUTH-P0 remains a mandatory real-device auth/session feasibility gate; draft recovery remains provisional.

**Decision (October 19, 2026 — v3 UX approval):** The user stated **“I approve the screens and flows”** after viewing the sign-in, editing/submit/publish, and refreshed Connection Status visual examples and interactive mockup. See [approved UX review](pwa/docs/Fishing_Companion_v3_UX_Review.md) and [UX approval record](pwa/docs/Fishing_Companion_v3_UX_Approval_2026-10-19.md), pinned to the exact previously reviewed `main` revision. The [staged implementation plan](pwa/docs/Fishing_Companion_v3_Implementation_Plan.md) is **DRAFT / NOT APPROVED**. **No implementation, GitHub App/provider setup, or deployment authorization** has been given. AUTH-P0 and the separate production cutover gate remain in force; local drafts remain removable.

**Decision (October 19, 2026 — v3 implementation-plan approval and chat transfer):** After separate approval of v3 requirements, technical design and UX, the owner explicitly approved the [staged v3 implementation plan](pwa/docs/Fishing_Companion_v3_Implementation_Plan.md) **with the condition that a full project-state audit/reconciliation and transfer to a fresh Chat conversation take place before P0 or any implementation**. The [approval record](pwa/docs/Fishing_Companion_v3_Implementation_Plan_Approval_2026-10-19.md) pins the reviewed plan to `7cc7eea06a110e041dbf552855957713df4b1c51` and blob `8d23d327033b1b348abb53d8462ccd2bb8dc0513`. Do not repeat plan approval in the new chat. After this handoff, restore current main, open PRs, latest successful production workflow and hosted identity, then begin P0 there. **No implementation, GitHub App/provider provisioning, browser test or production deployment in the old handoff chat.** AUTH-P0 proof, special provider/domain/permissions and optional v2-fix approvals, draft-removal gate and separate v3 cutover approval all still apply. The approved scope is unchanged; ordinary current v2 Gear/KB edits still use the established Copy Changes/FISH108 process until an approved v3 release replaces that experience.

**Production evidence for handoff (October 15, 2026 UTC):** Latest successful main production run **#520 / 38686171921**, source revision `4fc893d044b72e61fbc36cfd82103af55bc36f97`, hosted release `f5eab01e9d5af6101f03a7094de5b565`, 431 files, 100 Gear / 60 KB / 12 Catches; hosted byte match true. Main was `7cc7eea06a110e041dbf552855957713df4b1c51` with zero open PRs before the documentation-only handoff; recheck both identities in new chat.

## Open application work

FISH071–076 and FISH078–114 are complete/implemented. There is no currently allocated open application task after FISH114. The next unused application/architecture task ID is **FISH-TODO-115** unless actual newer `main` has already allocated it. Routine Fast Content Releases do not consume that ID.
## October 12, 2026 project handoff reconciliation

**Audit outcome:** PRs #221–#228 are all merged and deployed; the interrupted Banks Lake representative image change in PR #228 was successfully finished (production workflow #517 / run `38207507318`). As verified at the start of this documentation-only handoff: published source `e71c9ab6a90da46f8b46c7977bf476a1633fa94c`, release `0f4bd1f9e9e12b2b1981d61b48e3e501`, **100 Gear / 60 KB / 12 Catches**, **431 hosted files**, `hostedBytesMatch: true`, and **0 open PRs**. These are dated evidence, not permanent future-state values.

**Canonical content clarification:** `electronics-research` was renamed **Electronics Research** and intentionally refocused on chart plotters/fish finders; the prior motor/battery Notes sections are no longer on that page. Garmin Force Current Gear and maintenance/component Notes now cover motor content. A Lake Stevens Location guide was added, and the Banks Lake Location now has a representative picture. These are completed content changes; no new architecture task was allocated.

**Outstanding equipment clarification:** FISH-TODO-040 remains **OPEN** pending commissioning/installation/functional testing and case-fit/cushioning decisions. A 48 × 19 × 14 in hard-plastic lidded bin is being evaluated, but exact **interior** dimensions and purchased status were not confirmed. Do not claim the case/foam installation is completed. The historical under-seat tackle tray back-order and other open purchase items are not implicitly resolved.

**Release decision unchanged:** Documentation-only reconciliation does not trigger PWA publication because the publisher's `push`/`pull_request` path filters exclude the root project Markdown files. Handoff commits may move `main` ahead of the last deployed production source SHA; distinguish these identities rather than reporting an outdated production release as current `main`.

## RVR119 Force Current purchase and commissioning — October 6–7, 2026

**Decision:** The motorization purchase decision is complete. The user purchased a used **Garmin Force Current + Power Steer wireless foot-pedal system** on October 6, 2026 for **$2,800** from a seller in Gresham, Oregon. The package includes the motor, both Power Steer pedals, Garmin handheld remote, Garmin MOB tag, Redodo 24V 50Ah LiFePO4 battery and charger, high-efficiency propeller and weedless propeller.

**Warranty evidence:** The seller transferred the original **July 2026** Garmin receipt. The user contacted Garmin directly and Garmin confirmed that the remaining three-year standard warranty will be honored with the original receipt. The seller reported that the motor has never been used in saltwater.

**Decision:** FISH-TODO-040 remains OPEN but now tracks **commissioning/integration**, not pre-purchase comparison. The baseline process is to document/clean/inspect, charge and baseline the Redodo battery, clear previous-user data, restore defaults, re-pair controls, install current software through ActiveCaptain, calibrate the pedals/remote, then complete motor compass/bow-offset calibration and full functional testing on the installed RVR119. Do not perform invasive preventive service on the three-month-old warranted motor absent a fault.

**Safety/maintenance constraints:** Preserve Garmin's 40A protected-feed requirement; disconnect battery power before propeller/electrical service; never run the propeller out of water; inspect exposed rope/mount/connectors/props/sacrificial anodes as owner maintenance.

**Storage decision:** The motor/pedal storage solution must be **hard plastic**, not a flexible bag. Minimum usable internal dimensions are **38 × 18 × 8 in**; snug/compact fit is preferred and **orange is preferred**. Pelican/Otter-level protection/cost is unnecessary. The Hyper Tough 50-gallon tote is too large. Verify actual usable interior dimensions because molded bins often lose substantial space to taper/handles/wheels.

**Transport constraint retained:** The RVR119 is transported on the F-150 roof rack, so the Force Current motor, battery and Power Steer pedals must remain easy to remove before roof loading. The Newport LoPRO is no longer the selected battery; it remains only a possible future low-profile alternative to the currently owned Redodo 24V 50Ah battery.

## Science of the Strike evidence standard — September 28, 2026

**Decision:** When extracting Science of the Strike transcripts or incorporating them into Fishing Companion, explicitly distinguish study evidence from the hosts' opinions, extrapolations and fishing hypotheses. Do not convert a single study's thresholds, one population's behavior, lab results, or host inferences into universal fishing rules.

**Decision:** Podcast-derived additions should follow the existing KB ownership model rather than create redundant pages. Behavior/Habitat owns enduring location/biology drivers; Fishing Techniques owns execution/presentation; seasonal detail belongs in seasonal pages; electronics-specific implications belong in Electronics Research.
