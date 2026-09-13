# Fishing

Persistent Fishing project and source repository for Fishing Companion.

## Current production — September 13, 2026

FISH-TODO-099 is **DONE / production-verified**. Four user-supplied `fishing-companion-change-v2` KB packages were validated against current source and applied together in [PR116](https://github.com/ginosega/fishing/pull/116): Albright content/description refinement, Arbor content plus a 9-frame sequence, new Bowline Knot content plus a 7-frame sequence, and FG content plus a 29-frame sequence. Branch validation [run 34738967489](https://github.com/ginosega/fishing/actions/runs/34738967489) verified all package base fingerprints/content hashes and recomputed all **45** pre-uploaded JPG byte counts and SHA-256 hashes before promotion. Pre-merge production acceptance [run 34738991146](https://github.com/ginosega/fishing/actions/runs/34738991146) passed.

The first production deploy exposed only a stale hosted-verifier count fixture after Bowline raised the KB count from 56 to 57. Verification-only [PR117](https://github.com/ginosega/fishing/pull/117) changed that expected count and passed full CI before merge. The clean exact-current-main production rerun then passed end to end.

Current verified production:

- site: https://ginosega.github.io/fishing/
- source: `9899849be676e971e3670fe72eba7ffd66986d68`
- release: `b331a8c5575769159113a59a17b12bca`
- production workflow: [run 34740072017](https://github.com/ginosega/fishing/actions/runs/34740072017)
- hosted v2 files: **288**
- hosted-verification artifact: `10312475498`

The final production run passed source/core validation, Chromium/WebKit preview and production acceptance, archived-v1 cutover acceptance, exact-current-main protection, Pages deployment, all hosted-byte comparisons and hosted browser verification.

FISH099 preserves Albright's existing 15-frame sequence while changing its description to `Easier on-the-water braid-to-fluoro alternative to the FG knot` and replacing its Markdown exactly. Arbor now uses description `Use for tying line to spool`, the submitted Markdown, representative `step-09.jpg`, and ordered `step-01.jpg` through `step-09.jpg`. Bowline Knot is a new canonical Knot with the submitted Markdown, representative `step-07.jpg`, and ordered `step-01.jpg` through `step-07.jpg`. FG retains its existing structured description, uses the submitted Markdown, representative `step-29.jpg`, and ordered `step-01.jpg` through `step-29.jpg`.
## Current product behavior

Fishing Companion has independent Gear, Knowledge Base and Catch domains. Canonical source is repository-root `Gear/`, `KB/` and `Catches/`; the active application/build/test system is under `pwa/`.

FISH091 remains in force: ordinary online use is lightweight and does **not** download the complete library. **Connection Status → Update offline library** explicitly creates/refreshes a verified complete offline generation. A prior complete generation can remain as offline fallback; failed or corrupt updates preserve it.

FISH096 adds optional Knot-only ordered `pictureSequence` support. Sequence frames are explicit structured references under `KB/Knots/assets/<knot-id>/`; the final frame is also the canonical representative `picture.src`. Normal browsing loads only that representative frame. The sequence viewer opens at frame 1 with Previous / Play-Pause / Next / Close, one-second looping playback, frame position, keyboard controls and existing zoom/pan gestures. Add/Edit supports complete multi-file sequence selection and static↔sequence conversion within the existing Picture section. Prepare/Copy remains a source-aware handoff, not Direct Save.

FISH097 applies that capability to Palomar with 13 explicit PNG frames. FISH098 applies it to Albright with 15 explicit JPG frames. FISH099 adds explicit Arbor (9 JPG), Bowline (7 JPG), and FG (29 JPG) sequences and updates the submitted knot content while preserving Palomar and Albright sequence behavior.

FISH077/P2 — authentication, Direct Save, integrated uploads, offline authoring, outbox/sync and Catch authoring — remains **DEFERRED**.

## Project continuation

Chat mode is the permanent default. Do not recommend Work merely because work is complex, lengthy, file-heavy, analytical, research-heavy or artifact-producing. Use Work only for a genuinely Work-only capability after explaining why and obtaining explicit approval.

At the start of a new chat, restore actual latest `main`, then read in order:

1. `README.md`
2. `Fishing_Context.md`
3. `Fishing_TODO.md`
4. `Fishing_Decision_Log.md`
5. `Fishing_New_Chat_Bootstrap_Prompt.md`

Preserve unresolved fishing/equipment/content backlog and explicit purchase uncertainty. The next unused canonical task ID is **FISH-TODO-100**.

Historical milestones and release evidence remain in Git history and `pwa/docs/`; the root project-state files intentionally describe the current continuation state rather than repeating every prior release. Use [`pwa/docs/README.md`](pwa/docs/README.md) as the authority guide for interpreting dated project records and milestone-era “current” statements.

## Development

Use Node 24 and the locked `pwa/package-lock.json`. From `pwa/`: `npm ci`, `npm test`, `npm run build -- --base=/fishing/`, `npm run verify`.

`.github/workflows/fishing-production.yml` is the sole active production pipeline. Runtime/source changes use the normal feature-PR/CI path and deploy only from exact current `main`. Documentation-only project-state reconciliation does not republish the application.