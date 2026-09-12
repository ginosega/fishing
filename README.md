# Fishing

Persistent Fishing project and source repository for Fishing Companion.

## Current production — September 12, 2026

FISH-TODO-096 is **DONE / production-verified**. The user-approved Knot step-by-step picture-sequence requirements and design were implemented in [PR109](https://github.com/ginosega/fishing/pull/109) and merged to `main` as `0782d1fd6ff9a176d94132c4dc962589b9480e32`.

Current verified production subsequently advanced after the user uploaded 13 Palomar source frames to `main`:

- site: https://ginosega.github.io/fishing/
- source: `7d43898d1c8e59ec87fcc8913e45c1df01957fd1`
- release: `921777f82c4216eccfb26d17e1043a57`
- production workflow: [run 34717459805](https://github.com/ginosega/fishing/actions/runs/34717459805)
- hosted v2 files: **214**
- hosted-verification artifact: `10305581445`

The deployment passed source/core validation, Chromium/WebKit preview and production acceptance, archived-v1 cutover acceptance, exact-current-main protection, Pages deployment, all hosted-byte comparisons and hosted browser verification. FISH096 hosted verification exercised Add Knot sequence selection, local sequence preview, ordered handoff metadata and the exact per-Knot GitHub upload link.

The 13 uploaded files `KB/Knots/assets/knot-palomar/step-01.png` through `step-13.png` are preserved source assets but are currently **unreferenced**. They are therefore not part of the published release and do not yet make Palomar an active step-by-step sequence. Do not infer or create the Palomar `pictureSequence` record change without an explicit authoring request/package.

See [FISH096 production closeout](pwa/docs/FISH096_Production_Closeout_2026-09-12.md) for the durable feature-release record.

## Current product behavior

Fishing Companion has independent Gear, Knowledge Base and Catch domains. Canonical source is repository-root `Gear/`, `KB/` and `Catches/`; the active application/build/test system is under `pwa/`.

FISH091 remains in force: ordinary online use is lightweight and does **not** download the complete library. **Connection Status → Update offline library** explicitly creates/refreshes a verified complete offline generation. A prior complete generation can remain as offline fallback; failed or corrupt updates preserve it.

FISH096 adds optional Knot-only ordered `pictureSequence` support. Sequence frames are explicit structured references under `KB/Knots/assets/<knot-id>/`; the final frame is also the canonical representative `picture.src`. Normal browsing loads only that representative frame. The sequence viewer opens at frame 1 with Previous / Play-Pause / Next / Close, one-second looping playback, frame position, keyboard controls and existing zoom/pan gestures. Add/Edit supports complete multi-file sequence selection and static↔sequence conversion within the existing Picture section. Prepare/Copy remains a source-aware handoff, not Direct Save.

FISH077/P2 — authentication, Direct Save, integrated uploads, offline authoring, outbox/sync and Catch authoring — remains **DEFERRED**.

## Project continuation

Chat mode is the permanent default. Do not recommend Work merely because work is complex, lengthy, file-heavy, analytical, research-heavy or artifact-producing. Use Work only for a genuinely Work-only capability after explaining why and obtaining explicit approval.

At the start of a new chat, restore actual latest `main`, then read in order:

1. `README.md`
2. `Fishing_Context.md`
3. `Fishing_TODO.md`
4. `Fishing_Decision_Log.md`
5. `Fishing_New_Chat_Bootstrap_Prompt.md`

Preserve unresolved fishing/equipment/content backlog and explicit purchase uncertainty. The next unused canonical task ID is **FISH-TODO-097**.

Historical milestones and release evidence remain in Git history and `pwa/docs/`; the root project-state files intentionally describe the current continuation state rather than repeating every prior release. Use [`pwa/docs/README.md`](pwa/docs/README.md) as the authority guide for interpreting dated project records and milestone-era “current” statements.

## Development

Use Node 24 and the locked `pwa/package-lock.json`. From `pwa/`: `npm ci`, `npm test`, `npm run build -- --base=/fishing/`, `npm run verify`.

`.github/workflows/fishing-production.yml` is the sole active production pipeline. Runtime/source changes use the normal feature-PR/CI path and deploy only from exact current `main`. Documentation-only project-state reconciliation does not republish the application.