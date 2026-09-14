# Fishing

Persistent Fishing project and source repository for Fishing Companion.

## Current production — September 13, 2026

FISH-TODO-102 and FISH-TODO-103 are **DONE / production-verified**.

FISH102 added the **Line-Tackle-Knot Reference** KB Knot entry, its Markdown and picture, and pins that card first on KB → Knots while leaving the remaining Knot cards alphabetical. It shipped through [PR124](https://github.com/ginosega/fishing/pull/124). Its verified production source was `4912f93149e9de1e9cde9ff5176b4a4831a67812`, release `beff9138c96489abd9723c5fcfeef0ff`, production [run 34770966552](https://github.com/ginosega/fishing/actions/runs/34770966552), with hosted-verification artifact `10322381375`. Canonical counts became 69 Gear, 56 KB and 5 Catches.

FISH103 then completed the PWA source/layout and authoring fixes through [PR125](https://github.com/ginosega/fishing/pull/125), followed by verifier-only [PR126](https://github.com/ginosega/fishing/pull/126) and [PR127](https://github.com/ginosega/fishing/pull/127). FISH103 physically moved canonical domain source under `pwa/Gear/`, `pwa/KB/` and `pwa/Catches/` while preserving logical record/release paths as `Gear/...`, `KB/...` and `Catches/...`; external structured/Markdown web links now open in a new tab while internal/in-app links stay same-tab; Gear/KB picture-caption typing retains focus while preview captions update; and new-KB Markdown Preview assigns its provisional content path before whole-library validation.

Current verified production:

- site: https://ginosega.github.io/fishing/
- source: `94772e62788fa98903930e4b5649fabb9629c6d0`
- release: `b8c8222697222f1dd43861427d5006fb`
- production workflow: [run 34795289032](https://github.com/ginosega/fishing/actions/runs/34795289032)
- hosted v2 files: **327**
- production-bundle artifact: `10328869743`
- production-acceptance-evidence artifact: `10329538071`
- Pages artifact: `10329392228`
- hosted-verification artifact: `10329313590`

The exact-current-main run passed source/core validation, Chromium/WebKit preview acceptance, production-browser acceptance, actual archived-v1 cutover acceptance, exact-current-main protection, Pages deployment, byte-for-byte hosted verification and hosted-browser verification. Hosted verification specifically confirmed the FISH103 physical-source layout, external/internal link targeting, stable caption focus and new-KB Markdown Preview behavior.

## Current product behavior

Fishing Companion has independent Gear, Knowledge Base and Catch domains. Canonical physical domain source now lives under `pwa/Gear/`, `pwa/KB/` and `pwa/Catches/`. Logical record paths and generated release content remain `Gear/...`, `KB/...` and `Catches/...`. The active application/build/test system is also under `pwa/`.

FISH091 remains in force: ordinary online use is lightweight and does **not** download the complete library. **Connection Status → Update offline library** explicitly creates/refreshes a verified complete offline generation. A prior complete generation can remain as offline fallback; failed or corrupt updates preserve it.

FISH096 remains in force: Knot records may optionally have explicit ordered `pictureSequence` frames under logical `KB/Knots/assets/<knot-id>/`; `picture.src` is the final/representative frame. Normal browsing loads only the representative frame. Sequence Add/Edit remains a source-aware Prepare/Copy handoff, not Direct Save.

FISH102's **Line-Tackle-Knot Reference** is the first card only on KB → Knots; the remaining Knot cards stay alphabetical. Other list/search/detail ordering is unchanged.

FISH103 keeps authoring as Prepare Changes → Copy Changes. GitHub upload-folder links now point to the physical `pwa/...` source folders. External HTTP(S) links from structured Links and Markdown open a new tab with `noopener noreferrer`; `gear://`, `kb://`, anchors, local links and other in-app navigation remain same-tab.

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

When the user says **“It’s time to transfer to a new chat”** (or clearly says the current chat is too long and should be transferred), ask for confirmation that they want the full handoff. Once confirmed, reconcile the chat against current repository/production state, update the authoritative project records and bootstrap prompt, perform a final cross-file consistency check, and leave a clean continuation point without repeated “Proceed” prompts. The final handoff response must include a clickable GitHub link to `Fishing_New_Chat_Bootstrap_Prompt.md` so the user can copy it into the new Chat-mode conversation.

Preserve unresolved fishing/equipment/content backlog and explicit purchase uncertainty. FISH071–076 and FISH078–103 are complete; Fishing Companion v3 (`FISH-TODO-077/P2`) remains deferred. The next unused canonical application task ID is **FISH-TODO-104** unless actual newer `main` has already allocated it.

Historical milestones and release evidence remain in Git history and `pwa/docs/`; the root project-state files intentionally describe the current continuation state rather than repeating every prior release. Use [`pwa/docs/README.md`](pwa/docs/README.md) as the authority guide for interpreting dated project records and milestone-era “current” statements.

## Development

Use Node 24 and the locked `pwa/package-lock.json`. From `pwa/`: `npm ci`, `npm test`, `npm run build -- --base=/fishing/`, `npm run verify`.

`.github/workflows/fishing-production.yml` is the sole active production pipeline. Runtime/source changes use the normal feature-PR/CI path and deploy only from exact current `main`. Documentation-only project-state reconciliation does not republish the application.