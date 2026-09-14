# Fishing

Persistent Fishing project and source repository for Fishing Companion.

## Current production — September 14, 2026

FISH-TODO-107 is **DONE / production-verified**.

FISH107 shipped through [PR136](https://github.com/ginosega/fishing/pull/136). It implemented the supplied `fishing-companion-change-v2` edit package for `skylety-fishing-hook-sharpener`, correcting its canonical Gear type from `Kayaks` to `Tools`.

This was the only canonical source change. Notes, picture, picture sequence, all other record fields, counts, paths, media and unrelated source were unchanged. The package base revision `9b419e07f9a3a56a2be1ddbfb0df1760fe2730cb`, record hash `31811a75b2d315a2c98a7b25bf8b51fd52c77195b6c54783e90cdb0aa4c57db8`, and base field `type: Kayaks` were validated before application.

Current verified production:

- site: https://ginosega.github.io/fishing/
- application source: `6fae3afbe8f227b4c12875c5d5e8f0d4c0c8861f`
- release: `21d203ccdef509cd99626680ae34de98`
- production workflow: [run 34811980881](https://github.com/ginosega/fishing/actions/runs/34811980881)
- feature exact-head acceptance: [run 34811426937](https://github.com/ginosega/fishing/actions/runs/34811426937) at `f36be26dddfb2da8c0957917c0fceb389192177e`
- hosted v2 files: **342**
- production-bundle artifact: `10334724772`
- production-acceptance-evidence artifact: `10335063749`
- Pages artifact: `10334664984`
- hosted-verification artifact: `10334949254`
- canonical counts: **80 Gear, 56 KB and 5 Catches**
- measured source baselines: **110 canonical library paths, 245 inventory references**

The exact-current-main run passed source/core validation, Chromium/WebKit preview acceptance, production-browser acceptance, actual archived-v1 cutover acceptance, exact-current-main protection, Pages deployment, byte-for-byte hosted verification and hosted-browser verification.

FISH102–FISH106 remain complete and production-verified. FISH106 added six Gear items including the Skylety sharpener using its then-supplied `Kayaks` type; FISH107 supersedes that classification for current canonical state by setting Skylety to `Tools`.

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

When the user says **“It’s time to transfer to a new chat”** (or clearly says the current chat is too long and should be transferred), ask for confirmation that they want the full handoff. Once confirmed, reconcile the chat against current repository/production state, update the authoritative project records and bootstrap prompt, perform a final cross-file consistency check, and leave a clean continuation point without repeated “Proceed” prompts. The final handoff response must include a clickable GitHub link to `Fishing_New_Chat_Bootstrap_Prompt.md` so the user can copy it into the new Chat-mode conversation.

Preserve unresolved fishing/equipment/content backlog and explicit purchase uncertainty. FISH071–076 and FISH078–107 are complete; Fishing Companion v3 (`FISH-TODO-077/P2`) remains deferred. FISH104 does not by itself close `FISH-TODO-005`, and FISH105 does not by itself close `FISH-TODO-014`. The next unused canonical application task ID is **FISH-TODO-108** unless actual newer `main` has already allocated it.

Historical milestones and release evidence remain in Git history and `pwa/docs/`; the root project-state files intentionally describe the current continuation state rather than repeating every prior release. Use [`pwa/docs/README.md`](pwa/docs/README.md) as the authority guide for interpreting dated project records and milestone-era “current” statements.

## Development

Use Node 24 and the locked `pwa/package-lock.json`. From `pwa/`: `npm ci`, `npm test`, `npm run build -- --base=/fishing/`, `npm run verify`.

`.github/workflows/fishing-production.yml` is the sole active production pipeline. Runtime/source changes use the normal feature-PR/CI path and deploy only from exact current `main`. Documentation-only project-state reconciliation does not republish the application.
