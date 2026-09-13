# Fishing

Persistent Fishing project and source repository for Fishing Companion.

## Current production — September 13, 2026

FISH-TODO-101 is **DONE / production-verified**. The submitted Knot change-package batch and explicit request to remove Double Uni Knot and Single Uni Knot were validated and applied through [PR121](https://github.com/ginosega/fishing/pull/121). Branch validation [run 34766670229](https://github.com/ginosega/fishing/actions/runs/34766670229) confirmed all package stale-base checks and recomputed the exact byte counts/SHA-256 hashes for all **39** pre-uploaded media files. Full pre-merge production acceptance [run 34766717362](https://github.com/ginosega/fishing/actions/runs/34766717362) passed.

FISH101 activates explicit sequences for Improved Clinch (11 PNG frames, `step-11.png` representative), Modified Uni (12 JPG frames, `step-12.jpg` representative), and Trilene (15 PNG frames, `step-15.png` representative); adds the submitted static Non-Slip Loop picture; applies the submitted Knot Markdown/structured refinements; updates Bowline's description; and removes the Double Uni Knot and Single Uni Knot records plus their Markdown articles. Palomar retains its existing 13-frame sequence while receiving the submitted Markdown refinement. The resulting canonical KB count is **55**.

The feature merge source was `360d71ff2bfaf075ad498d18f05126268f6606f1`. Its first exact-main Pages deployment succeeded, but hosted verification exposed a stale expected KB count of 57. Verification-only [PR122](https://github.com/ginosega/fishing/pull/122) changed only that verifier expectation to 55; no application data or behavior changed.

Current verified production:

- site: https://ginosega.github.io/fishing/
- source: `2b76f9f91757705e361ed3485da0627e493c8d7d`
- release: `eeba6be85560163522778e2e795d91d9`
- production workflow: [run 34768935480](https://github.com/ginosega/fishing/actions/runs/34768935480)
- hosted v2 files: **325**
- hosted-verification artifact: `10322070321`

The exact-current-main run passed source/core validation, Chromium/WebKit preview and production acceptance, archived-v1 cutover acceptance, exact-current-main protection, Pages deployment, hosted-byte verification and hosted-browser verification.

## Current product behavior

Fishing Companion has independent Gear, Knowledge Base and Catch domains. Canonical source is repository-root `Gear/`, `KB/` and `Catches/`; the active application/build/test system is under `pwa/`.

FISH091 remains in force: ordinary online use is lightweight and does **not** download the complete library. **Connection Status → Update offline library** explicitly creates/refreshes a verified complete offline generation. A prior complete generation can remain as offline fallback; failed or corrupt updates preserve it.

FISH096 adds optional Knot-only ordered `pictureSequence` support. Sequence frames are explicit structured references under `KB/Knots/assets/<knot-id>/`; the final frame is also the canonical representative `picture.src`. Normal browsing loads only that representative frame. The sequence viewer opens at frame 1 with Previous / Play-Pause / Next / Close, one-second looping playback, frame position, keyboard controls and existing zoom/pan gestures. Add/Edit supports complete multi-file sequence selection and static↔sequence conversion within the existing Picture section. Prepare/Copy remains a source-aware handoff, not Direct Save.

Active Knot sequences are now Palomar (13 PNG), Albright (15 JPG), Arbor (9 JPG), Bowline (7 JPG), FG (29 JPG), Improved Clinch (11 PNG), Modified Uni (12 JPG), and Trilene (15 PNG). Non-Slip Loop has the submitted static representative picture. Directory contents alone never define a sequence.

FISH077/P2 — authentication, Direct Save, integrated uploads, offline authoring, outbox/sync and Catch authoring — remains **DEFERRED**.

## Project continuation

Chat mode is the permanent default. Do not recommend Work merely because work is complex, lengthy, file-heavy, analytical, research-heavy or artifact-producing. Use Work only for a genuinely Work-only capability after explaining why and obtaining explicit approval.

At the start of a new chat, restore actual latest `main`, then read in order:

1. `README.md`
2. `Fishing_Context.md`
3. `Fishing_TODO.md`
4. `Fishing_Decision_Log.md`
5. `Fishing_New_Chat_Bootstrap_Prompt.md`

Preserve unresolved fishing/equipment/content backlog and explicit purchase uncertainty. The next unused canonical task ID is **FISH-TODO-102**.

Historical milestones and release evidence remain in Git history and `pwa/docs/`; the root project-state files intentionally describe the current continuation state rather than repeating every prior release. Use [`pwa/docs/README.md`](pwa/docs/README.md) as the authority guide for interpreting dated project records and milestone-era “current” statements.

## Development

Use Node 24 and the locked `pwa/package-lock.json`. From `pwa/`: `npm ci`, `npm test`, `npm run build -- --base=/fishing/`, `npm run verify`.

`.github/workflows/fishing-production.yml` is the sole active production pipeline. Runtime/source changes use the normal feature-PR/CI path and deploy only from exact current `main`. Documentation-only project-state reconciliation does not republish the application.