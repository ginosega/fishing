# Fishing

Persistent Fishing project and source repository for Fishing Companion.

## Current production — September 13, 2026

FISH-TODO-100 is **DONE / production-verified**. The user-supplied `fishing-companion-change-v2` edit package for Palomar was validated and applied through [PR119](https://github.com/ginosega/fishing/pull/119). Package validation [run 34740644154](https://github.com/ginosega/fishing/actions/runs/34740644154) confirmed the submitted base source is an ancestor of current source, the current Palomar record fingerprint exactly matched `d09e83e7cfc3ddd6531389fc460620c66b23cfafb5a1b4866f6c20c89be8e94a`, and the current Markdown SHA-256 exactly matched `05a439f4d5b2a5db6b37666c20dc742e29685cd11aaffce351ae7cc0e7ff8580`. All source tests passed. Pre-merge production acceptance [run 34740670930](https://github.com/ginosega/fishing/actions/runs/34740670930) passed.

FISH100 changes only `KB/Knots/content/palomar.md` to the exact submitted replacement. No structured Palomar fields changed. The existing representative picture `KB/Knots/assets/knot-palomar/step-13.png` and full explicit 13-frame `pictureSequence` remain unchanged. Its feature merge source was `141198d1fbc1c651cd0b41d642d057c0f3b8a81c`.

After FISH100 merged, the user uploaded additional Knot image assets for Improved Clinch (11 PNG frames), Modified Uni (12 JPG frames), Trilene (15 PNG frames), and `KB/Knots/assets/Non-Splip Loop Knot.png`. Those later uploads changed source bytes only; they are not referenced by canonical KB records and therefore do **not** activate or publish new picture sequences. Directory contents alone never define a sequence.

Current verified production includes FISH100 plus those later source-only uploads:

- site: https://ginosega.github.io/fishing/
- source: `52afc4335445706fa07d210dd8f3f2823e9636eb`
- release: `c135fa258e6e1c8ed16324a57661d17e`
- production workflow: [run 34765625164](https://github.com/ginosega/fishing/actions/runs/34765625164)
- hosted v2 files: **288**
- hosted-verification artifact: `10320926230`

The exact-current-main run passed source/core validation, Chromium/WebKit preview and production acceptance, archived-v1 cutover acceptance, exact-current-main protection, Pages deployment, hosted-byte verification and hosted-browser verification. The staged unreferenced image uploads are correctly absent from release content until a future explicit canonical package references them.
## Current product behavior

Fishing Companion has independent Gear, Knowledge Base and Catch domains. Canonical source is repository-root `Gear/`, `KB/` and `Catches/`; the active application/build/test system is under `pwa/`.

FISH091 remains in force: ordinary online use is lightweight and does **not** download the complete library. **Connection Status → Update offline library** explicitly creates/refreshes a verified complete offline generation. A prior complete generation can remain as offline fallback; failed or corrupt updates preserve it.

FISH096 adds optional Knot-only ordered `pictureSequence` support. Sequence frames are explicit structured references under `KB/Knots/assets/<knot-id>/`; the final frame is also the canonical representative `picture.src`. Normal browsing loads only that representative frame. The sequence viewer opens at frame 1 with Previous / Play-Pause / Next / Close, one-second looping playback, frame position, keyboard controls and existing zoom/pan gestures. Add/Edit supports complete multi-file sequence selection and static↔sequence conversion within the existing Picture section. Prepare/Copy remains a source-aware handoff, not Direct Save.

FISH097 applies that capability to Palomar with 13 explicit PNG frames. FISH098 applies it to Albright with 15 explicit JPG frames. FISH099 adds explicit Arbor (9 JPG), Bowline (7 JPG), and FG (29 JPG) sequences and updates the submitted knot content while preserving Palomar and Albright sequence behavior. FISH100 refines only Palomar Markdown content; its structured record and 13-frame sequence remain unchanged.

FISH077/P2 — authentication, Direct Save, integrated uploads, offline authoring, outbox/sync and Catch authoring — remains **DEFERRED**.

## Project continuation

Chat mode is the permanent default. Do not recommend Work merely because work is complex, lengthy, file-heavy, analytical, research-heavy or artifact-producing. Use Work only for a genuinely Work-only capability after explaining why and obtaining explicit approval.

At the start of a new chat, restore actual latest `main`, then read in order:

1. `README.md`
2. `Fishing_Context.md`
3. `Fishing_TODO.md`
4. `Fishing_Decision_Log.md`
5. `Fishing_New_Chat_Bootstrap_Prompt.md`

Preserve unresolved fishing/equipment/content backlog and explicit purchase uncertainty. The next unused canonical task ID is **FISH-TODO-101**.

Historical milestones and release evidence remain in Git history and `pwa/docs/`; the root project-state files intentionally describe the current continuation state rather than repeating every prior release. Use [`pwa/docs/README.md`](pwa/docs/README.md) as the authority guide for interpreting dated project records and milestone-era “current” statements.

## Development

Use Node 24 and the locked `pwa/package-lock.json`. From `pwa/`: `npm ci`, `npm test`, `npm run build -- --base=/fishing/`, `npm run verify`.

`.github/workflows/fishing-production.yml` is the sole active production pipeline. Runtime/source changes use the normal feature-PR/CI path and deploy only from exact current `main`. Documentation-only project-state reconciliation does not republish the application.