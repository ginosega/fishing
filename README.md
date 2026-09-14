# Fishing

Persistent Fishing project and source repository for Fishing Companion.

## Current continuation — September 14, 2026

FISH108 establishes the durable two-lane release model for Fishing Companion:

- **Fast Content Release** is the default for routine canonical Gear / Knowledge Base / Catch changes when every changed file is under `pwa/Gear/`, `pwa/KB/`, or `pwa/Catches/`.
- **Full Application Release** is required for runtime, schema, test, build/tooling, workflow, dependency, migration/recovery/offline, or mixed content+code changes.

The detailed policy is [`pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md`](pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md).

Routine `fishing-companion-change-v2` authoring releases now use a lightweight content PR, canonical source/build verification, exact-main Pages deployment, and dependency-free hosted byte verification. They do **not** run the browser/v1-cutover/dependency-audit suite, consume a new `FISH-TODO-###` application task ID, or require per-item README/Context/TODO/bootstrap/production-closeout updates.

Changing library counts are source data, not durable test baselines. Current counts and release identity are derived from canonical source and the exact generated release rather than maintained manually in project-state Markdown.

**FISH109** hardens release retries without changing the two-lane model: Pages and hosted-evidence artifacts are named per workflow run attempt, and the fast hosted verifier retries bounded transient propagation/network failures. A failed deployment job can therefore be rerun without colliding with an earlier `github-pages` artifact.

For the exact currently deployed source/release when needed, use the latest successful `main` production workflow and deployed `release.json`; do not rely on an older release identity copied into narrative documentation.

## Current product behavior

Fishing Companion has independent Gear, Knowledge Base and Catch domains. Canonical physical domain source lives under `pwa/Gear/`, `pwa/KB/` and `pwa/Catches/`. Logical record paths and generated release content remain `Gear/...`, `KB/...` and `Catches/...`. The active application/build/test system is under `pwa/`.

FISH091 remains in force: ordinary online use is lightweight and does **not** download the complete library. **Connection Status → Update offline library** explicitly creates/refreshes a verified complete offline generation. A prior complete generation can remain as offline fallback; failed or corrupt updates preserve it.

FISH096 remains in force: Knot records may optionally have explicit ordered `pictureSequence` frames under logical `KB/Knots/assets/<knot-id>/`; `picture.src` is the final/representative frame. Normal browsing loads only the representative frame. Sequence Add/Edit remains a source-aware Prepare/Copy handoff, not Direct Save.

FISH102's **Line-Tackle-Knot Reference** is the first card only on KB → Knots; the remaining Knot cards stay alphabetical. Other list/search/detail ordering is unchanged.

FISH103 keeps authoring as Prepare Changes → Copy Changes. GitHub upload-folder links point to the physical `pwa/...` source folders. External HTTP(S) links from structured Links and Markdown open a new tab with `noopener noreferrer`; `gear://`, `kb://`, anchors, local links and other in-app navigation remain same-tab.

## Fishing Companion v3

**Fishing Companion v3** is the preferred name for the future phase historically tracked as `FISH-TODO-077/P2`. It remains **DEFERRED**. Do not treat authentication, direct GitHub save/upload, integrated uploads, offline authoring/outbox/sync, Catch authoring or multi-user generalization as implemented or implicitly approved.

## Project continuation

Chat mode is the permanent default. Do not recommend Work merely because work is complex, lengthy, file-heavy, analytical, research-heavy or artifact-producing. Use Work only for a genuinely Work-only capability after explaining why and obtaining explicit approval.

At the start of a new chat, restore actual latest `main`, then read in order:

1. `README.md`
2. `Fishing_Context.md`
3. `Fishing_TODO.md`
4. `Fishing_Decision_Log.md`
5. `Fishing_New_Chat_Bootstrap_Prompt.md`

Before repository work, also confirm current open-PR state. For an exact current production identity, inspect the latest successful production workflow/release rather than stale narrative metadata.

When the user says **“It’s time to transfer to a new chat”** (or clearly says the current chat is too long and should be transferred), ask for confirmation that they want the full handoff. Once confirmed, reconcile the chat against current repository/production state, update authoritative records only where durable project state actually changed, perform a final cross-file consistency check, and leave a clean continuation point without repeated “Proceed” prompts. The final handoff response must include a clickable GitHub link to `Fishing_New_Chat_Bootstrap_Prompt.md`.

Preserve unresolved fishing/equipment/content backlog and explicit purchase uncertainty. FISH071–076 and FISH078–109 are complete/implemented; Fishing Companion v3 (`FISH-TODO-077/P2`) remains deferred. FISH104 does not by itself close `FISH-TODO-005`, and FISH105 does not by itself close `FISH-TODO-014`.

The next unused **application/architecture** task ID is **FISH-TODO-110**. Routine Fast Content Releases do not consume that ID.

Historical milestones and exact release evidence remain in Git history and `pwa/docs/`; use [`pwa/docs/README.md`](pwa/docs/README.md) when interpreting dated milestone-era “current” statements.

## Development and publication

Use Node 24 and the locked `pwa/package-lock.json`.

`.github/workflows/fishing-production.yml` is the sole active production pipeline and automatically chooses Fast Content vs Full Application Release from the changed-file set. Documentation-only project-state changes do not publish the application.
