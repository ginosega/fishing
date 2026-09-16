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

**Decision/status:** IMPLEMENTED / PRODUCTION-VERIFIED / USER-VERIFIED.

### Final implementation decision

**Decision:** Home, My Gear, and Knowledge Base card icons use 16 bundled user-approved transparent PNG assets under `pwa/assets/card-icons/` rather than OS-dependent emoji glyphs. Preserve current card geometry, spacing, labels, search/Back controls, routes, navigation, and small icon scale/placement.

**Decision:** The final generated transparent-with-shadow PNG assets are the authoritative artwork. Earlier exploratory Google/Noto, Fluent, Twemoji-style references and mockups are historical design references only and are not the live source assets.

**Decision:** The production build must carry these assets into each content-addressed release and include them in release identity/manifest verification. Regression coverage must continue to protect the exact 16-file set, transparency, card mappings, production-build byte preservation, and manifest inclusion.

### Production closeout

FISH112 was implemented in PR #168 and released through Full Application Release workflow #298 / run `35119930916` from source revision `89ca4773365f8d99750b9424b5cb9eefb4a29907`. Hosted release `f5d691d727fd439ff5553f6c7db509f4` passed actual hosted production byte and browser verification. The user then inspected production and confirmed that it looks correct.

Detailed evidence: [`pwa/docs/FISH112_Production_Closeout_2026-09-16.md`](pwa/docs/FISH112_Production_Closeout_2026-09-16.md).

**Decision:** FISH112 is closed. The next unused application/architecture task ID is **FISH-TODO-113** unless newer `main` has already allocated it.

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

FISH071–076 and FISH078–112 are complete/implemented. There is no currently allocated open application task after FISH112. The next unused application/architecture task ID is **FISH-TODO-113** unless actual newer `main` has already allocated it. Routine Fast Content Releases do not consume that ID.
