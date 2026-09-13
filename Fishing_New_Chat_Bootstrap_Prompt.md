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

## Current production continuation point — September 13, 2026

FISH-TODO-101 is **DONE / production-verified**. The submitted Knot change-package batch plus the explicit request to remove Double Uni Knot and Single Uni Knot were validated and applied through [PR121](https://github.com/ginosega/fishing/pull/121). Branch validation [run 34766670229](https://github.com/ginosega/fishing/actions/runs/34766670229) passed all submitted stale-base checks, verified the deletion targets, and recomputed the exact byte counts/SHA-256 hashes for all **39** pre-uploaded media files. Full pre-merge production acceptance [run 34766717362](https://github.com/ginosega/fishing/actions/runs/34766717362) passed.

FISH101 activates Improved Clinch (11 PNG), Modified Uni (12 JPG), and Trilene (15 PNG) sequences; adds the submitted static Non-Slip Loop picture; applies the submitted Knot content/structured refinements; updates Bowline's description; retains Palomar's 13-frame sequence while applying its submitted Markdown refinement; and removes Double Uni Knot and Single Uni Knot records plus their Markdown articles. Canonical KB count is now **55**.

The feature merge source was `360d71ff2bfaf075ad498d18f05126268f6606f1`. Its first exact-main Pages deployment succeeded, but post-deploy verification exposed a stale hosted verifier expected count of 57. Verification-only [PR122](https://github.com/ginosega/fishing/pull/122) changed only that verifier expectation to 55; no application content or runtime behavior changed.

Current verified production:

- source: `2b76f9f91757705e361ed3485da0627e493c8d7d`
- release: `eeba6be85560163522778e2e795d91d9`
- production workflow: [run 34768935480](https://github.com/ginosega/fishing/actions/runs/34768935480)
- hosted v2 files: **325**
- hosted-verification artifact: `10322070321`
- site: https://ginosega.github.io/fishing/

Active Knot sequences are Palomar (13 PNG), Albright (15 JPG), Arbor (9 JPG), Bowline (7 JPG), FG (29 JPG), Improved Clinch (11 PNG), Modified Uni (12 JPG), and Trilene (15 PNG). Non-Slip Loop has the submitted static representative picture. Double Uni Knot and Single Uni Knot are no longer canonical KB records.

The current exact-main production run passed source/core validation, Chromium/WebKit preview and production acceptance, archived-v1 cutover acceptance, exact-current-main deployment protection, Pages deployment, hosted-byte verification and hosted-browser verification.

Do **not** restart FISH096–FISH101 implementation/deployment work.

## Current durable behavior

Fishing Companion uses independent Gear, KB and Catch domains. Canonical data is in repository-root `Gear/`, `KB/` and `Catches/`; active application/build/test code is under `pwa/`. `.github/workflows/fishing-production.yml` is the sole active production publisher.

FISH091 remains active: normal online use does not provision the complete offline library. **Connection Status → Update offline library** is the explicit verified complete-library preparation/refresh action. Online browsing uses current production; a prior complete generation may remain offline fallback; failed/corrupt updates preserve that prior generation.

FISH096 adds optional **Knot-only** explicit ordered `pictureSequence` support. Frames live under `KB/Knots/assets/<knot-id>/step-01...`; `picture.src` must equal the final frame and remains the representative picture. Cards/detail pages load only the representative frame. The sequence viewer opens at frame 1 with Previous / Play-Pause / Next / Close, one-second looping playback, frame indicator, shared caption, keyboard controls and existing zoom/pan gestures. Manual navigation does not wrap; automatic playback loops. Remaining frames preload only after viewer open.

Knot Add/Edit keeps sequence operations in the existing Picture section. Add/replace sequence uses native complete multi-file selection; filenames define order; the final frame automatically becomes the representative picture. Converting into a sequence requires the complete intended sequence and never silently reuses the old static picture. Converting out may use a new static picture or retain the existing representative final frame. Old source image bytes are not automatically deleted.

Prepare Changes → Copy Changes remains a source-aware P1 handoff. It carries explicit sequence intent, ordered paths and file hashes, but it still does not write to GitHub directly.

FISH-TODO-077/P2 remains **DEFERRED**: no authentication, Direct Save, integrated browser upload, offline authoring, outbox/sync or Catch authoring.

## Task state

FISH071–076 and FISH078–101 are complete. FISH077/P2 remains deferred. Preserve all unresolved fishing/equipment/content backlog and explicit purchase uncertainty in `Fishing_TODO.md`.

The next unused canonical task ID is **FISH-TODO-102** unless actual newer `main` has already allocated it.

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