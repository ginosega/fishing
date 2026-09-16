# Fishing

Persistent Fishing project and source repository for Fishing Companion.

## Current continuation — September 15, 2026

The project is in a clean production state after the September 14–15 KB/Techniques redesign and Topwater/cross-link pass. Fishing Companion remains a three-domain PWA (Gear, Knowledge Base, Catch) with canonical source under `pwa/Gear/`, `pwa/KB/`, and `pwa/Catches/`.

### Current KB editorial structure

The major fishing-reference pages now have intentionally different jobs:

- **Bass Behavior and Habitat** and **Trout Behavior and Habitat** answer **where the fish are and why**: enduring habitat, structure/cover, temperature, oxygen, forage, light, wind/current, depth, and pattern-recognition principles.
- **Bass Fishing Techniques** and **Trout Fishing Techniques** answer **how to catch fish once located**: presentation choice, lure/bait selection, retrieves, rigs, depth control, strike handling, bank/kayak execution, and related tactics.
- **Spring Fishing**, **Summer Fishing**, **Fall Fishing**, and **Winter Fishing** are the authoritative seasonal playbooks for **both bass and trout**, combining seasonal location changes with seasonal presentation strategy.
- **Topwater Fishing** is the broad specialized surface-fishing reference. Narrower Gear Guides such as Frog, Popper, Whopper Plopper, Walking Bait, and Buzzbait remain focused companion pages.

These pages are deliberately complementary. Avoid rebuilding detailed seasonal mini-guides inside the Behavior/Habitat or species-wide Techniques pages unless there is a clear reason; route readers to the seasonal pages instead. Likewise, keep lure-specific mechanics in the relevant Gear Guide when that is the better home.

Retired/replaced live Technique pages include the old **Bass Fishing**, **Spring Bass Fishing**, **Fall Bass Fishing**, Bass Power and Search Overview, Color and Scent, Paddle-only Kayak Strategy, Seasonal Bass Guidance, and Water Visibility pages. Historical migration/release evidence may still mention them; do not treat those historical references as live canonical content.

The September 15 Topwater release also completed a curated cross-link pass across related species, seasonal, location, tackle, and topwater Gear Guide pages. Continue the same editorial standard: add internal links where they materially help the reader, not mechanically on every keyword occurrence.

## Release model

FISH108 establishes the durable two-lane release model:

- **Fast Content Release** is the default for routine canonical Gear / Knowledge Base / Catch changes when every changed file is under `pwa/Gear/`, `pwa/KB/`, or `pwa/Catches/`.
- **Full Application Release** is required for runtime, schema, test, build/tooling, workflow, dependency, migration/recovery/offline, or mixed content+code changes.

The detailed policy is [`pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md`](pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md).

Routine `fishing-companion-change-v2` authoring releases use a lightweight content PR, canonical source/build verification, exact-current-main Pages deployment, and dependency-free hosted byte verification. They do **not** consume a new `FISH-TODO-###` application task ID or require per-item README/Context/TODO/bootstrap churn.

FISH109 adds run-attempt-specific deployment/evidence artifacts and bounded retry/backoff for transient hosted-verification failures while preserving the exact-current-main guard.

FISH110 centralizes the Fishing Companion **Copy Changes** handoff and routes eligible source-aware content packages explicitly into the FISH108 Fast Content Release process while preserving unrelated/newer source changes.

FISH111 establishes one shared horizontal page grid: the site-header brand/connection control align to the same left/right insets as page content, and long-form Notes/Markdown content uses the full main content width. Intentional component-specific caps for pictures, details tables, and editor forms remain unchanged.

For the exact currently deployed source/release when needed, use the latest successful `main` production workflow and deployed `release.json`; any checkpoint copied into documentation is historical once `main` advances.

## Current product behavior

Fishing Companion has independent Gear, Knowledge Base and Catch domains. Canonical physical domain source lives under `pwa/Gear/`, `pwa/KB/` and `pwa/Catches/`; logical record/release paths remain `Gear/...`, `KB/...` and `Catches/...`. The active application/build/test system is under `pwa/`.

Gear/KB Add/Edit remains **Prepare Changes → Copy Changes**, producing source-aware `fishing-companion-change-v2` packages. Preparing/copying is not saving; the browser does not write GitHub source directly. Simple Markdown-only narrative edits may be made directly in GitHub. Structured fields, paths, pictures/sequences, specifications, structured links and relationships should use Fishing Companion Edit or an equivalent source-aware workflow.

Authoring notes:

- normalize accidental trailing whitespace unless the user explicitly asks to preserve it;
- KB `description` values are schema-limited to **80 characters**;
- preserve unrelated concurrent changes and user-uploaded bytes;
- validate supplied media bytes/hashes when a source-aware package provides them.

FISH091 remains in force: ordinary online use does not download the complete library. **Connection Status → Update offline library** explicitly creates/refreshes a verified complete offline generation.

FISH096 remains in force: Knot records may optionally have explicit ordered `pictureSequence` frames under logical `KB/Knots/assets/<knot-id>/`; `picture.src` is the final/representative frame.

FISH102 keeps **Line-Tackle-Knot Reference** pinned first only on KB → Knots.

FISH103 keeps external HTTP(S) links new-tab with `noopener noreferrer`, internal navigation same-tab, and authoring upload links on physical `/pwa/...` source paths.

FISH111 keeps the site header and page body on the same horizontal insets and lets long-form Notes/Markdown sections extend to the full right content margin.

## Fishing Companion v3

**Fishing Companion v3** is the preferred name for the future phase historically tracked as `FISH-TODO-077/P2`. It remains **DEFERRED**. Authentication, direct GitHub save/upload, integrated uploads, offline authoring/outbox/sync, Catch authoring, and multi-user generalization are not implemented or implicitly approved.

## Project continuation

Chat mode is the permanent default. Do not recommend Work merely because work is complex, lengthy, file-heavy, analytical, research-heavy, or artifact-producing. Use Work only for a genuinely Work-only capability after explaining why and obtaining explicit approval.

At the start of a new chat, restore actual latest `main`, then read in order:

1. `README.md`
2. `Fishing_Context.md`
3. `Fishing_TODO.md`
4. `Fishing_Decision_Log.md`
5. `Fishing_New_Chat_Bootstrap_Prompt.md`

Before repository work, also confirm current open-PR state. For exact current production identity, inspect the latest successful production workflow/release rather than stale narrative metadata.

When the user says **“It’s time to transfer to a new chat”** (or clearly equivalent wording), ask for confirmation that they want the full handoff. Once confirmed, reconcile the chat against current repository/production state, update authoritative records where durable state changed, perform a final cross-file consistency check, and finish with a clickable GitHub link to `Fishing_New_Chat_Bootstrap_Prompt.md`.

Preserve unresolved fishing/equipment/content backlog and explicit purchase uncertainty. FISH071–076 and FISH078–111 are complete/implemented; Fishing Companion v3 (`FISH-TODO-077/P2`) remains deferred. The next unused **application/architecture** task ID is **FISH-TODO-112**. Routine Fast Content Releases do not consume that ID.

Historical milestones and exact release evidence remain in Git history and `pwa/docs/`; use [`pwa/docs/README.md`](pwa/docs/README.md) when interpreting dated milestone-era “current” statements.

## Development and publication

Use Node 24 and the locked `pwa/package-lock.json`.

`.github/workflows/fishing-production.yml` is the sole active production pipeline and automatically chooses Fast Content vs Full Application Release from the changed-file set. Documentation-only project-state changes do not publish the application.
