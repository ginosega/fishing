You are continuing my persistent **Fishing** project. The durable repository is `ginosega/fishing` on GitHub. Restore current state from the latest `main` before acting; do not rely on an old chat or assume a previously observed commit is still current.

## Operating mode

Operating mode: This project uses Chat mode by default. Do not recommend Work unless a task specifically requires a Work-only capability. Never recommend Work merely because the project or task is complex, lengthy, file-heavy, analytical, requires research/calculations, creates artifacts, or involves substantial context. Explain the specific Work-only need and obtain my approval before recommending a temporary switch. Return to Chat afterward.

## First actions

Read these files from actual latest `main`, in order:

1. `README.md`
2. `Fishing_Context.md`
3. `Fishing_TODO.md`
4. `Fishing_Decision_Log.md`
5. `Fishing_New_Chat_Bootstrap_Prompt.md`

Before implementation, release or repository-write work, also confirm current open-PR state. Newer primary repository evidence controls over stale chat descriptions.

## Current production continuation point — September 12, 2026

FISH-TODO-096 is **DONE / production-verified**. Requirements and design for Knot step-by-step picture sequences were separately approved before implementation. [PR109](https://github.com/ginosega/fishing/pull/109) is merged.

Current verified production:

- source: `0782d1fd6ff9a176d94132c4dc962589b9480e32`
- release: `23f6839d69df2018aed54fa6d3fc70d4`
- production workflow: [run 34716722379](https://github.com/ginosega/fishing/actions/runs/34716722379)
- hosted v2 files: 214
- hosted-verification artifact: `10305125488`
- site: https://ginosega.github.io/fishing/

The production run passed source/core validation, Chromium/WebKit preview and production acceptance, actual archived-v1 cutover acceptance, exact-current-main deployment protection, Pages deployment, hosted-byte verification and hosted-browser verification. The authoritative closeout is `pwa/docs/FISH096_Production_Closeout_2026-09-12.md`.

Do **not** restart FISH096 implementation/deployment work.

## Current durable behavior

Fishing Companion uses independent Gear, KB and Catch domains. Canonical data is in repository-root `Gear/`, `KB/` and `Catches/`; active application/build/test code is under `pwa/`. `.github/workflows/fishing-production.yml` is the sole active production publisher.

FISH091 remains active: normal online use does not provision the complete offline library. **Connection Status → Update offline library** is the explicit verified complete-library preparation/refresh action. Online browsing uses current production; a prior complete generation may remain offline fallback; failed/corrupt updates preserve that prior generation.

FISH096 adds optional **Knot-only** explicit ordered `pictureSequence` support. Frames live under `KB/Knots/assets/<knot-id>/step-01...`; `picture.src` must equal the final frame and remains the representative picture. Cards/detail pages load only the representative frame. The sequence viewer opens at frame 1 with Previous / Play-Pause / Next / Close, one-second looping playback, frame indicator, shared caption, keyboard controls and existing zoom/pan gestures. Manual navigation does not wrap; automatic playback loops. Remaining frames preload only after viewer open.

Knot Add/Edit keeps sequence operations in the existing Picture section. Add/replace sequence uses native complete multi-file selection; filenames define order; the final frame automatically becomes the representative picture. Converting into a sequence requires the complete intended sequence and never silently reuses the old static picture. Converting out may use a new static picture or retain the existing representative final frame. Old source image bytes are not automatically deleted.

Prepare Changes → Copy Changes remains a source-aware P1 handoff. It now carries explicit sequence intent, ordered paths and file hashes, but it still does not write to GitHub directly.

FISH-TODO-077/P2 remains **DEFERRED**: no authentication, Direct Save, integrated browser upload, offline authoring, outbox/sync or Catch authoring.

## Task state

FISH071–076 and FISH078–096 are complete. FISH077/P2 remains deferred. Preserve all unresolved fishing/equipment/content backlog and explicit purchase uncertainty in `Fishing_TODO.md`.

The next unused canonical task ID is **FISH-TODO-097** unless actual newer `main` has already allocated it.

## Working rules

- Use current GitHub source as authority for code, content, project state and release evidence.
- Do not repeat completed migration/cutover/release work.
- Preserve unrelated concurrent source changes and user-uploaded bytes.
- For source/runtime changes, use a feature PR, full CI, merge, production deployment and hosted verification unless the user explicitly changes that workflow.
- Documentation-only reconciliation does not republish production.
- P1 authoring packages are implementation instructions, not merely JSON to explain.
- Do not infer purchases/ownership or close WAITING ON USER items without user confirmation.
- Historical v1/preview files, old task snapshots and prior release identities are evidence only; current state is in the five restore-order files and dated `pwa/docs/` closeouts.
- After actual milestones, update Context, TODO, Decision Log, README, affected technical/release records and this bootstrap, then cross-check them before handoff.