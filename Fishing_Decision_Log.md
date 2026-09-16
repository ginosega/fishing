# Fishing Decision Log

This file records **current durable decisions**. Detailed historical release evidence remains in Git history and dated `pwa/docs/` records rather than being repeated here.

## Operating mode

**Decision:** Chat mode is the permanent default. Do not recommend Work merely because work is complex, lengthy, file-heavy, analytical, research/calculation-heavy or artifact-producing. Use a temporary Work switch only for a genuinely Work-only capability after explaining the need and obtaining explicit user approval.

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

**Decision/status:** DESIGN SELECTED / NOT IMPLEMENTED. FISH112 is the active application/UI task.

### Why

Most current Home/My Gear/Knowledge Base card icons are raw Unicode emoji. Their appearance therefore varies by OS/device. The user wants a consistent curated set that looks the same on Windows and Android while keeping the present Fishing Companion layout.

### Core implementation decision

**Decision:** Replace OS-dependent emoji glyphs with bundled fixed artwork. Preserve current card geometry, spacing, labels, search/Back controls, navigation, and the current small icon scale/placement. FISH112 is **not** approval for the scenic headers, enlarged icon tiles/cards, bottom navigation, or other layout changes seen in exploratory AI mockups.

**Decision:** The generated screenshots used during design are references only, not production assets. Before implementation, verify licensing/attribution for any Google/Noto, Microsoft Fluent, Twemoji, or adapted artwork. Prefer scalable bundled assets such as SVG where practical.

### Approved My Gear icon mapping

- **Rods & Reels:** Google/Android rod-and-reel artwork.
- **Line:** spool with dark red/orange spool and clear/white-ish line.
- **Weights:** silver/gray teardrop sinker.
- **Snaps & Swivels:** silver barrel swivel only; not a snap swivel and not a generic chain link.
- **Hooks:** Twitter/Twemoji-style simple hook, silver, no crossbar through the middle.
- **Lures:** crankbait in a Sexy Shad-style color pattern.
- **Bait:** Fluent-style worm.
- **Equipment:** Fluent-style oblique light-blue kayak with paddle.

### Approved Knowledge Base icon mapping

The live KB root has exactly five category cards; there is no Tackle card.

- **Locations:** Google/Android pushpin exactly in the Android-style direction selected by the user — round red head with pale blue/gray needle/stem. Do not substitute a teardrop map-location pin or folded-map icon.
- **Species:** side-view rainbow trout.
- **Techniques:** compass.
- **Knots:** Google/Android blue rope-knot artwork.
- **Gear Guides:** open book with light pages and blue backing/edge.

### Approved Home icon mapping

- **My Gear:** tackle box.
- **Knowledge Base:** three plain stacked books with no spine text; preferred colors are green/blue/orange. It must remain distinct from the Gear Guides open-book icon.
- **Catch Log:** jumping largemouth bass with lure in its mouth and fishing line extending from the lure.

**Decision:** FISH112 implementation is a Full Application Release because it changes application/UI assets outside the canonical content roots. FISH112 is already allocated; the next unused application/architecture task ID is **FISH-TODO-113**.

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

## Durable application behavior

- **FISH091:** normal online use does not provision the complete offline library; **Connection Status → Update offline library** explicitly prepares/refreshes a verified complete generation.
- **FISH096:** Knot-only explicit ordered `pictureSequence`; physical frames under `pwa/KB/Knots/assets/<id>/`; at least two frames; `picture.src` is final/representative; directory contents alone never create a sequence.
- **FISH102:** Line-Tackle-Knot Reference is pinned first only on KB → Knots.
- **FISH103:** external HTTP(S) links open new-tab with `noopener noreferrer`; internal app/local links remain same-tab; authoring uploads use physical `/pwa/...`; Caption focus and provisional new-KB Markdown Preview behavior retained.
- **FISH107:** canonical Skylety Fishing Hook Sharpener type is `Tools`.

## Backlog decisions

**FISH-TODO-005:** remains WAITING ON USER. FISH104 does not prove every fish-finder power component is installed.

**FISH-TODO-014:** remains OPEN. FISH105's HyperSeal 3600 was not explicitly identified as the historical deep-box watch target.

**Decision:** The broad Technique redesign does not implicitly close specialized future pages. Texas Rig, Carolina Rig, Alabama Rig, Neko Rig and Spoons remain open until explicitly completed.

## Fishing Companion v3

**Decision:** Fishing Companion v3 is the preferred name for the deferred future phase historically tracked as FISH-TODO-077/P2. It remains DEFERRED. Authentication, direct GitHub save/upload, integrated uploads, offline authoring/outbox/sync, Catch authoring and multi-user generalization are not current production or implicitly approved.

## Open application work

FISH071–076 and FISH078–111 are complete/implemented. **FISH112 is active/open**. The next unused application/architecture task ID is **FISH-TODO-113** unless actual newer `main` has already allocated it. Routine Fast Content Releases do not consume that ID.
