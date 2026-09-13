# Fishing Context

## Current authoritative state — September 13, 2026

FISH-TODO-099 is **DONE / production-verified**. Four explicit user-supplied KB change packages were validated and applied through [PR116](https://github.com/ginosega/fishing/pull/116). Branch validation [run 34738967489](https://github.com/ginosega/fishing/actions/runs/34738967489) confirmed source-aware record/content bases and recomputed all 45 pre-uploaded JPG byte counts/SHA-256 hashes exactly. Pre-merge acceptance [run 34738991146](https://github.com/ginosega/fishing/actions/runs/34738991146) passed. A one-line stale hosted-verifier KB-count expectation discovered after the initial Pages deploy was repaired in verification-only [PR117](https://github.com/ginosega/fishing/pull/117), which also passed full CI.

Current verified production:

- source `9899849be676e971e3670fe72eba7ffd66986d68`
- release `b331a8c5575769159113a59a17b12bca`
- [workflow run 34740072017](https://github.com/ginosega/fishing/actions/runs/34740072017)
- 288 hosted v2 files
- hosted-verification artifact `10312475498`

The final run passed source/core validation, Chromium/WebKit preview acceptance, production-browser acceptance, actual archived-v1 cutover acceptance, exact-current-main guard, Pages deployment, hosted-byte verification and hosted-browser verification.

FISH096 remains the implemented sequence capability. FISH097 activates Palomar, FISH098 activates Albright, and FISH099 adds Arbor, Bowline, and FG sequences while updating only the package-requested canonical content. Albright keeps its existing 15-frame sequence and now has description `Easier on-the-water braid-to-fluoro alternative to the FG knot`. Arbor uses 9 frames with `step-09.jpg` representative. Bowline is a new Knot using 7 frames with `step-07.jpg` representative. FG retains its prior structured description and uses 29 frames with `step-29.jpg` representative.
## Operating mode

This project uses **Chat mode by default and permanently**. Do not recommend Work merely because a task is complex, lengthy, file-heavy, analytical, involves research/calculation, creates artifacts or has substantial context. Recommend a temporary switch only for a genuinely Work-only capability; explain the specific need and obtain explicit approval first, then return to Chat afterward.

Before implementation/release/repository-write work, restore actual latest `main` and current open-PR state. Never rely on a previously observed commit as though it is still current.

## Durable repository and production architecture

`ginosega/fishing` is authoritative. Canonical domain data lives in repository-root `Gear/`, `KB/` and `Catches/`. The active PWA implementation, contracts, build tools, tests, migration evidence and release documentation live under `pwa/`. `.github/workflows/fishing-production.yml` is the sole active production publisher.

Fishing Companion uses three independent but consistent domains — Gear, KB and Catch — rather than a forced generic entity framework. The KB entity model covers Location, Species, Equipment/Gear Guides, Technique and Knot. Paths are explicit record properties rather than inferred identities.

Gear and KB support source-aware Prepare Changes → Copy Changes authoring. Preparing/copying is **not saving** and the browser does not write to GitHub. Canonical implementation work occurs through repository changes, PR/CI, merge and production verification.

## Offline behavior — FISH091

FISH091 remains **DONE / production-verified** and unchanged by FISH096.

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

The active Knot sequences are Palomar (13 PNG frames, `step-13.png` representative), Albright (15 JPG frames, `step-15.jpg` representative), Arbor (9 JPG frames, `step-09.jpg` representative), Bowline (7 JPG frames, `step-07.jpg` representative), and FG (29 JPG frames, `step-29.jpg` representative). Every sequence is explicitly referenced by canonical KB data and participates in FISH091 explicit complete-library preparation; directory contents alone never create a sequence.

The canonical PWA icon is `pwa/icon.png`. Historical filenames/bytes remain in Git history only as recovery evidence.

## Continuation

FISH071–076, FISH078–099 are complete except FISH077/P2, which remains deferred. Existing fishing/equipment/content backlog and purchase uncertainty remain active in `Fishing_TODO.md`. The next unused canonical task ID is **FISH-TODO-100**.

For a new chat, read `README.md`, this file, `Fishing_TODO.md`, `Fishing_Decision_Log.md`, then `Fishing_New_Chat_Bootstrap_Prompt.md`. Historical release/migration evidence remains in Git history and `pwa/docs/`; do not restart completed FISH096, FISH097, FISH098 or FISH099 release work.