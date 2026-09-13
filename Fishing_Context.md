# Fishing Context

## Current authoritative state — September 13, 2026

FISH-TODO-101 is **DONE / production-verified**. The submitted Knot change-package batch plus the explicit request to remove Double Uni Knot and Single Uni Knot were validated and applied through [PR121](https://github.com/ginosega/fishing/pull/121). Branch validation [run 34766670229](https://github.com/ginosega/fishing/actions/runs/34766670229) confirmed all submitted record/content stale-base checks and recomputed the exact byte count and SHA-256 for all **39** pre-uploaded media files. Full pre-merge production acceptance [run 34766717362](https://github.com/ginosega/fishing/actions/runs/34766717362) passed.

FISH101's canonical content result is:

- Improved Clinch: submitted description/Markdown plus an explicit 11-frame PNG sequence, `step-11.png` representative;
- Modified Uni: submitted description/Markdown plus an explicit 12-frame JPG sequence, `step-12.jpg` representative;
- Non-Slip Loop: renamed to **Non-Slip Loop Knot**, submitted description/Markdown, and static representative `KB/Knots/assets/Non-Splip Loop Knot.png`;
- Palomar: submitted Markdown refinement; structured record and existing 13-frame sequence remain otherwise unchanged;
- Trilene: submitted description/Markdown plus an explicit 15-frame PNG sequence, `step-15.png` representative;
- Bowline Knot: description updated to `Use for tying a rope to the bow of a boat`; existing 7-frame sequence retained;
- Double Uni Knot and Single Uni Knot: canonical records and Markdown articles removed.

The resulting canonical KB count is **55**. Required source-test fixtures were aligned only to the deliberate deletions: KB records 57→55, validated library paths 107→105, and referenced source files 237→235.

The feature merge source was `360d71ff2bfaf075ad498d18f05126268f6606f1`. Its first exact-main Pages deployment succeeded, but post-deploy verification exposed a stale hosted verifier expectation of 57 KB records. Verification-only [PR122](https://github.com/ginosega/fishing/pull/122) changed only that expectation to 55; no application content or runtime behavior changed.

Current verified production:

- source `2b76f9f91757705e361ed3485da0627e493c8d7d`
- release `eeba6be85560163522778e2e795d91d9`
- [workflow run 34768935480](https://github.com/ginosega/fishing/actions/runs/34768935480)
- **325 hosted v2 files**
- hosted-verification artifact `10322070321`

The current run passed source/core validation, Chromium/WebKit preview acceptance, production-browser acceptance, actual archived-v1 cutover acceptance, exact-current-main guard, Pages deployment, hosted-byte verification and hosted-browser verification.

## Operating mode

This project uses **Chat mode by default and permanently**. Do not recommend Work merely because a task is complex, lengthy, file-heavy, analytical, involves research/calculation, creates artifacts or has substantial context. Recommend a temporary switch only for a genuinely Work-only capability; explain the specific need and obtain explicit approval first, then return to Chat afterward.

Before implementation/release/repository-write work, restore actual latest `main` and current open-PR state. Never rely on a previously observed commit as though it is still current.

## Durable repository and production architecture

`ginosega/fishing` is authoritative. Canonical domain data lives in repository-root `Gear/`, `KB/` and `Catches/`. The active PWA implementation, contracts, build tools, tests, migration evidence and release documentation live under `pwa/`. `.github/workflows/fishing-production.yml` is the sole active production publisher.

Fishing Companion uses three independent but consistent domains — Gear, KB and Catch — rather than a forced generic entity framework. The KB entity model covers Location, Species, Equipment/Gear Guides, Technique and Knot. Paths are explicit record properties rather than inferred identities.

Gear and KB support source-aware Prepare Changes → Copy Changes authoring. Preparing/copying is **not saving** and the browser does not write to GitHub. Canonical implementation work occurs through repository changes, PR/CI, merge and production verification.

## Offline behavior — FISH091

FISH091 remains **DONE / production-verified** and unchanged by FISH101.

Ordinary online startup/navigation does not provision the complete offline library. Online browsing uses current production. **Connection Status → Update offline library** is the explicit complete-library preparation/refresh action. A prior verified complete generation may remain the offline fallback until explicitly refreshed; failed, corrupt or quota-failed refreshes preserve the prior complete generation. A device without a prepared complete generation must not claim offline readiness.

## Knot picture sequences — FISH096

A KB Knot may optionally contain an explicit ordered `pictureSequence` of at least two frames. Frames are stored under `KB/Knots/assets/<knot-id>/` using contiguous zero-padded `step-01`, `step-02`, ... names. Runtime order comes from the explicit structured array, not directory scanning. Every frame receives the existing path/image/integrity validation and is included in the verified complete offline library.

`picture.src` must equal the final sequence frame and remains the record's representative picture. Cards and ordinary detail pages load only that representative frame. Clicking it opens the sequence viewer at frame 1. The viewer provides Previous, Play/Pause, Next and Close, a frame indicator, one shared caption, Left/Right/Space/Escape keyboard controls and existing zoom/pan/pinch behavior. Manual Previous/Next does not wrap; automatic playback runs at one second per frame and loops; manual stepping pauses playback first. Remaining frames are preloaded only after the viewer is opened.

Existing static-picture records and the existing static viewer remain unchanged.

Knot Add/Edit sequence authoring stays inside the existing Picture section. Add/replace sequence uses a native multi-file picker labelled **Choose local pictures** and requires the complete intended sequence at once. Filenames establish order and the final frame automatically becomes `picture.src`; there is no separate representative selection and no option to silently reuse a prior static picture as the final sequence frame. Existing sequences can be replaced, converted to a new single picture, reduced to the existing representative picture, or removed. Superseded source image files are not automatically deleted.

The `fishing-companion-change-v2` P1 handoff explicitly carries sequence action, ordered paths and selected-file hashes. It remains a Prepare/Copy handoff only; there is no integrated repository upload or Direct Save.

## Deferred scope

FISH-TODO-077/P2 remains **DEFERRED**. Do not treat the following as implemented or implicitly approved: authentication, Direct Save, integrated browser-side GitHub uploads, offline authoring, outbox/sync, Catch authoring or multi-user generalization.

The retired Planner, Trip History/Sessions, paired-setup structures and old v1-only source conventions must not be reintroduced without a new explicit requirement.

## Content and media state

All seven originally required missing pictures from the v2 cutover have since been resolved. The historically optional generic inline-spinner now has the user-supplied Kingforest picture. Current source includes the later validated location pictures, Trout Fishing picture, Topwater Fishing and Bass Fishing Technique records, and all other post-cutover canonical authoring changes already merged before FISH096.

The active Knot sequences are Palomar (13 PNG, `step-13.png` representative), Albright (15 JPG, `step-15.jpg`), Arbor (9 JPG, `step-09.jpg`), Bowline (7 JPG, `step-07.jpg`), FG (29 JPG, `step-29.jpg`), Improved Clinch (11 PNG, `step-11.png`), Modified Uni (12 JPG, `step-12.jpg`), and Trilene (15 PNG, `step-15.png`). Non-Slip Loop uses the submitted static representative `Non-Splip Loop Knot.png`. Every sequence is explicitly referenced by canonical KB data and participates in FISH091 explicit complete-library preparation; directory contents alone never create a sequence.

Double Uni Knot and Single Uni Knot no longer exist in canonical KB source. The canonical PWA icon is `pwa/icon.png`. Historical filenames/bytes remain in Git history only as recovery evidence.

## Continuation

FISH071–076 and FISH078–101 are complete except FISH077/P2, which remains deferred. Existing fishing/equipment/content backlog and purchase uncertainty remain active in `Fishing_TODO.md`. The next unused canonical task ID is **FISH-TODO-102**.

For a new chat, read `README.md`, this file, `Fishing_TODO.md`, `Fishing_Decision_Log.md`, then `Fishing_New_Chat_Bootstrap_Prompt.md`. Historical release/migration evidence remains in Git history and `pwa/docs/`; do not restart completed FISH096–FISH101 release work.