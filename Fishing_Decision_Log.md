# Fishing Decision Log

This file records **current durable decisions**. Detailed historical release evidence remains in Git history and dated `pwa/docs/` records rather than being repeated here.

## Operating mode

**Decision:** Chat mode is the permanent default. Do not recommend Work merely because work is complex, lengthy, file-heavy, analytical, research/calculation-heavy or artifact-producing. Use a temporary Work switch only for a genuinely Work-only capability after explaining the need and obtaining explicit user approval.

## New-chat transfer and handoff

**Decision:** When the user says **“It’s time to transfer to a new chat”** (or clearly equivalent wording), ask for confirmation that they want the full project handoff. Once confirmed, execute it end-to-end without repeated “Proceed” prompts: restore actual latest `main`, open PRs and current production evidence; reconcile durable state; update authoritative records where project state actually changed; preserve unresolved work; cross-check records/bootstrap; and finish with a clickable GitHub link to `Fishing_New_Chat_Bootstrap_Prompt.md`.

Routine content releases do not require state-file churn merely so a later handoff can discover them; Git history and the latest production workflow/release are authoritative for those events. Handoffs should still capture **durable editorial/architecture changes** that materially affect how future work is organized.

## Repository authority

**Decision:** `ginosega/fishing` is authoritative. Restore actual latest `main` and open-PR state before implementation/release/repository-write work.

Canonical physical content roots are `pwa/Gear/`, `pwa/KB/` and `pwa/Catches/`; logical record/release paths remain `Gear/...`, `KB/...` and `Catches/...`. `.github/workflows/fishing-production.yml` is the sole active Pages publisher.

For exact current production SHA/release ID/counts, inspect the latest successful `main` production workflow and deployed `release.json`; do not maintain volatile production identifiers/counts as durable narrative state.

## KB editorial ownership model

**Decision:** Broad fishing-reference pages should have clear, complementary responsibilities rather than duplicate one another.

- **Behavior and Habitat** pages own **where fish are and why**: enduring habitat, structure/cover, temperature, oxygen, forage, light, wind/current, depth and pattern-recognition principles.
- **Fishing Techniques** pages own **how to catch fish once located**: presentation/lure/bait choice, rigs, retrieve/cadence, depth control, strike handling and bank/kayak execution.
- **Spring / Summer / Fall / Winter Fishing** own **seasonal location + seasonal presentation strategy** for both bass and trout. They are the authoritative seasonal playbooks.
- **Topwater Fishing** owns broad specialized surface-fishing strategy; Frog, Popper, Whopper Plopper, Walking Bait and Buzzbait Gear Guides remain narrower companion references.

**Decision:** Avoid rebuilding detailed seasonal mini-guides inside Behavior/Habitat or broad Techniques pages. A short seasonal routing summary is appropriate; detailed seasonal strategy should link to the season pages.

**Decision:** Internal cross-links should be **curated for reader value**, not mechanically added to every keyword occurrence. Link to a broader Technique page where the surrounding content naturally invites deeper context.

**Decision:** The old Bass Fishing, Spring Bass Fishing, Fall Bass Fishing, Bass Power and Search Overview, Color and Scent, Paddle-only Kayak Strategy, Seasonal Bass Guidance and Water Visibility pages are retired from live canonical content. Historical migration/release evidence may still mention them and should not be rewritten merely to erase historical references.

## FISH108 — two-lane release discipline

**Decision/status:** APPROVED and IMPLEMENTED. Full policy: [`pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md`](pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md).

### Fast Content Release

Use the fast lane only when **every changed file** is beneath one or more of:

- `pwa/Gear/`
- `pwa/KB/`
- `pwa/Catches/`

This is the default for routine source-aware Gear/KB add/edit packages, Markdown content, pictures, Knot sequence frames and Catch records.

Fast safeguards are package/source conflict validation before mutation; lightweight content PR; locked dependency installation with cache reuse; one production build whose source inventory validates schemas, semantic references, paths, Markdown/resources and media integrity; independent generated-release verification; exact-current-main guard; Pages deployment; and dependency-free byte-for-byte hosted/release-identity verification.

**Decision:** Do not run Node application behavior tests, Chromium/WebKit, preview-browser regression, durable-v1/cutover regression, dependency audit or hosted browser acceptance for a content-only change unless validation reveals an actual non-content problem.

### Full Application Release

Any file outside those three roots forces the full lane. Mixed content+non-content changes also force full. Runtime/UI/service worker, schema/contracts, tests, build/tooling, dependencies, workflow, migration/recovery/offline architecture and other non-content changes retain the comprehensive full suite. Manual workflow dispatch is full.

If fast-lane eligibility is ambiguous, use full; do not broaden eligibility to make a failing release pass.

### Source-derived content expectations

**Decision:** Gear/KB/Catch counts, canonical-path totals and reference totals are mutable library state, not application invariants. Validation and hosted acceptance derive them from canonical source or the exact generated release. Historical counts in dated release evidence remain historical facts, not future hand-maintained baselines.

### Routine authoring is not an application task

**Decision:** A routine Fast Content Release does **not** consume a `FISH-TODO-###` application/architecture task ID. It also does not require a per-item production-closeout Markdown document or README/Context/TODO/Decision Log/bootstrap edits solely to record the publication.

Its durable audit trail is the supplied source-aware package and validation, the lightweight PR/merge, the successful fast workflow/Pages deployment, and hosted verification artifact.

Update project-state documents when architecture/product behavior/durable decisions/backlog state changes, or during a requested handoff/reconciliation.

## FISH109 — release retry hardening

**Decision/status:** IMPLEMENTED and production-verified. Pages deployment artifacts and hosted-evidence artifacts are named with `github.run_attempt`, allowing a failed deployment job to be rerun without duplicate-artifact ambiguity. The fast hosted verifier retries only bounded transient HTTP/network failures with backoff; persistent or non-retryable mismatches still fail. The exact-current-main guard remains authoritative and must not be bypassed when `main` advances during a run.

## FISH110 — release-aware Copy Changes handoff

**Decision/status:** IMPLEMENTED and production-verified. The Fishing Companion shared Gear/KB editor uses one centralized Copy Changes instruction helper. The handoff must tell the receiving chat to restore current `main` and project instructions, validate the source-aware package against current canonical content, preserve unrelated/newer changes, and apply only the requested changes.

**Decision:** Eligible content-only packages route through one Fast Content Release PR, lightweight validation/build, merge, production deployment, and hosted byte/release-identity verification. Do not automatically run Full Application Release or create/update project-state records unless validation shows they are required. Non-fast changes defer to the repository's current appropriate lane.

**Decision:** Keep the Copy Changes JSON handoff parseable with a blank-line boundary between human instruction and package JSON. Regression coverage must reject the obsolete pre-FISH108 `one feature PR` / `then reconcile project records` boilerplate.

## FISH111 — shared page layout alignment

**Decision/status:** IMPLEMENTED. Fishing Companion uses one shared horizontal content grid for the site shell and page body. The site-header brand and connection-status control align to the same left/right content insets as the main page content. Long-form Notes/Markdown sections are not constrained by the former 900 px section cap or 78ch Markdown cap; they use the full main content width through the right-side page margin. The mobile rule remains the same alignment using the existing 16 px page inset.

**Decision:** Specialized content with an intentional narrower presentation — such as pictures, details tables, and editor forms — keeps its existing component-specific maximum widths. FISH111 broadens the shared long-form Notes/Markdown region, not every component on every page.

## Domain architecture and authoring boundary

**Decision:** Fishing Companion retains independent Gear, Knowledge Base and Catch domains with shared utilities where useful; do not force them into a generic graph/entity framework. KB types are Location, Species, Equipment/Gear Guide, Technique and Knot. Paths are explicit record properties; existing IDs remain stable unless intentionally retired/replaced. Retired trips/sessions/planner/setup structures remain retired unless explicitly re-approved.

**Decision:** Gear/KB browser Add/Edit uses **Prepare Changes → Copy Changes** to create a source-aware `fishing-companion-change-v2` handoff. Preparing/copying is not saving; browser-side repository writes/uploads are not current production. Existing source/base conflict checks remain required. GitHub upload links point to physical `pwa/...` source folders while package paths remain logical. The Copy Changes prefix follows FISH110 and routes eligible content-only packages to FISH108 Fast Content Release without automatic project-state churn.

Simple Markdown-only narrative edits to existing canonical files may be made directly in GitHub. Structured record fields, categories/types, specifications, structured links, picture metadata/sequences, paths and relationships should use Fishing Companion Edit or an equivalent source-aware workflow.

### Authoring constraints

**Decision:** Treat accidental trailing whitespace in Fishing Companion change packages as non-semantic by default. Remove trailing spaces from structured text values and text lines unless the user explicitly instructs preservation. This normalization does not authorize unrelated wording/content changes or media substitution.

**Decision:** KB `description` values must satisfy the schema maximum of **80 characters**. Check this before opening a release PR; do not wait for CI to discover an avoidable length violation.

**Decision:** Preserve unrelated concurrent changes and user-uploaded media bytes. If `main` advances while work is in progress, reconcile the newer commit before merge rather than merging blindly over it.

## Durable application behavior

**FISH091 — offline model:** normal online use does not provision the complete offline library. **Connection Status → Update offline library** explicitly prepares/refreshes a verified complete generation; failed/corrupt/quota-failed refreshes preserve the prior verified generation.

**FISH096 — Knot sequences:** optional and Knot-only; physical frames under `pwa/KB/Knots/assets/<id>/`, logical paths `KB/Knots/assets/<id>/`; explicit array defines order; at least two frames; `picture.src` equals final/representative frame; cards/detail load only representative frame; sequence viewer supports approved controls/keyboard/zoom behavior with no autoplay on open; complete multi-file selection establishes order; conversion into sequence never silently reuses an old static picture; replacing references does not delete old source files; complete offline preparation includes every referenced frame. Directory contents alone never create a sequence.

**FISH102:** Line-Tackle-Knot Reference is pinned first only on KB → Knots; remaining Knot cards alphabetical.

**FISH103:** canonical physical domain source stays under `pwa/`; authoring upload links use physical `/pwa/...`; external HTTP(S) links open new-tab with `noopener noreferrer`; internal app/local links remain same-tab; Caption editing retains focus; new-KB Markdown Preview assigns a provisional required content path before whole-library validation.

**FISH107:** current canonical Skylety Fishing Hook Sharpener type is `Tools`. FISH106's `Kayaks` value remains historical evidence of the earlier supplied package only.

**FISH110:** Copy Changes uses release-aware boilerplate aligned to FISH108; eligible source-aware content packages are routed to Fast Content Release and routine project-state churn is explicitly avoided unless validation shows it is required.

**FISH111:** site-header/page-body horizontal alignment and full-width long-form Notes/Markdown content are shared application rules across Fishing Companion.

## Backlog decisions

**FISH-TODO-005:** remains **WAITING ON USER**. FISH104 does not explicitly confirm every fish-finder power-system component as installed.

**FISH-TODO-014:** remains **OPEN**. FISH105's HyperSeal 3600 item was not explicitly identified as the historical “KastKing 3600 deep box” watch target.

**Decision:** The broad September 2026 Technique-page redesign does not implicitly close specialized future pages. Texas Rig, Carolina Rig, Alabama Rig, Neko Rig and Spoons remain open backlog items until explicitly completed.

## Fishing Companion v3

**Decision:** **Fishing Companion v3** is the preferred name for the deferred future phase historically `FISH-TODO-077/P2`. It remains **DEFERRED**. Authentication, direct GitHub save/upload, integrated uploads, offline authoring/outbox/sync, Catch authoring and multi-user generalization are not current production or implicitly approved.

## Open application work

FISH071–076 and FISH078–111 are complete/implemented. The next unused **application/architecture** task ID is **FISH-TODO-112** unless actual current `main` already allocated it. Routine Fast Content Releases do not consume that ID.
