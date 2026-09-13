# Fishing

Persistent Fishing project and source repository for Fishing Companion.

## Current production — September 12, 2026

FISH-TODO-098 is **DONE / production-verified**. The user-supplied `fishing-companion-change-v2` package for `knot-albright` was validated against current source and applied in [PR114](https://github.com/ginosega/fishing/pull/114). Branch validation [run 34736320090](https://github.com/ginosega/fishing/actions/runs/34736320090) confirmed the package record/notes bases and recomputed all 15 pre-uploaded JPG byte counts and SHA-256 hashes before promotion. Pre-merge production acceptance [run 34736339166](https://github.com/ginosega/fishing/actions/runs/34736339166) passed before merge.

Current verified production:

- site: https://ginosega.github.io/fishing/
- source: `65ac208dbb1a116cc321d5b13bea1228b3d1ee6f`
- release: `29d23d0444d3a187d8f67edf0a28e82d`
- production workflow: [run 34736590334](https://github.com/ginosega/fishing/actions/runs/34736590334)
- hosted v2 files: **242**
- hosted-verification artifact: `10310509883`

The production run passed source/core validation, Chromium/WebKit preview and production acceptance, archived-v1 cutover acceptance, exact-current-main protection, Pages deployment, all hosted-byte comparisons and hosted browser verification. The production archive contains all 15 Albright sequence frames.

Albright is now an active step-by-step Knot sequence: `pictureSequence` explicitly references `step-01.jpg` through `step-15.jpg`, `step-15.jpg` is the representative `picture.src`, and the caption is `Albright knot`. The package also replaced the Albright Markdown body exactly. No structured field changes were requested, so the existing Albright description remains unchanged. Directory contents alone still never create a sequence; FISH098 activated these already-uploaded frames through explicit canonical record references.

Palomar remains an active 13-frame sequence from FISH097. See [FISH096 production closeout](pwa/docs/FISH096_Production_Closeout_2026-09-12.md) for the underlying sequence-feature release record.

## Current product behavior

Fishing Companion has independent Gear, Knowledge Base and Catch domains. Canonical source is repository-root `Gear/`, `KB/` and `Catches/`; the active application/build/test system is under `pwa/`.

FISH091 remains in force: ordinary online use is lightweight and does **not** download the complete library. **Connection Status → Update offline library** explicitly creates/refreshes a verified complete offline generation. A prior complete generation can remain as offline fallback; failed or corrupt updates preserve it.

FISH096 adds optional Knot-only ordered `pictureSequence` support. Sequence frames are explicit structured references under `KB/Knots/assets/<knot-id>/`; the final frame is also the canonical representative `picture.src`. Normal browsing loads only that representative frame. The sequence viewer opens at frame 1 with Previous / Play-Pause / Next / Close, one-second looping playback, frame position, keyboard controls and existing zoom/pan gestures. Add/Edit supports complete multi-file sequence selection and static↔sequence conversion within the existing Picture section. Prepare/Copy remains a source-aware handoff, not Direct Save.

FISH097 applies that capability to Palomar with 13 explicit PNG frames. FISH098 applies it to Albright with 15 explicit JPG frames and the exact submitted Markdown replacement.

FISH077/P2 — authentication, Direct Save, integrated uploads, offline authoring, outbox/sync and Catch authoring — remains **DEFERRED**.

## Project continuation

Chat mode is the permanent default. Do not recommend Work merely because work is complex, lengthy, file-heavy, analytical, research-heavy or artifact-producing. Use Work only for a genuinely Work-only capability after explaining why and obtaining explicit approval.

At the start of a new chat, restore actual latest `main`, then read in order:

1. `README.md`
2. `Fishing_Context.md`
3. `Fishing_TODO.md`
4. `Fishing_Decision_Log.md`
5. `Fishing_New_Chat_Bootstrap_Prompt.md`

Preserve unresolved fishing/equipment/content backlog and explicit purchase uncertainty. The next unused canonical task ID is **FISH-TODO-099**.

Historical milestones and release evidence remain in Git history and `pwa/docs/`; the root project-state files intentionally describe the current continuation state rather than repeating every prior release. Use [`pwa/docs/README.md`](pwa/docs/README.md) as the authority guide for interpreting dated project records and milestone-era “current” statements.

## Development

Use Node 24 and the locked `pwa/package-lock.json`. From `pwa/`: `npm ci`, `npm test`, `npm run build -- --base=/fishing/`, `npm run verify`.

`.github/workflows/fishing-production.yml` is the sole active production pipeline. Runtime/source changes use the normal feature-PR/CI path and deploy only from exact current `main`. Documentation-only project-state reconciliation does not republish the application.