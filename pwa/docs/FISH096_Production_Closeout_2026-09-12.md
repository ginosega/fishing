# FISH096 — Production Closeout

**Status:** DONE / production-verified  
**Date:** September 12, 2026  
**Implementation PR:** [PR109](https://github.com/ginosega/fishing/pull/109)  
**Production source:** `0782d1fd6ff9a176d94132c4dc962589b9480e32`  
**Production release:** `23f6839d69df2018aed54fa6d3fc70d4`  
**Production workflow:** [run 34716722379](https://github.com/ginosega/fishing/actions/runs/34716722379)  
**Hosted v2 files:** 214  
**Hosted-verification artifact:** `10305125488`

## Approval trail

FISH096 followed the required staged workflow. The user separately approved the requirements and the implementation design before implementation began. The authoritative review records are:

- `FISH096_Knot_Step_By_Step_Picture_Sequences_Requirements_2026-09-12.md`
- `FISH096_Requirements_Approval_2026-09-12.md`
- `FISH096_Knot_Step_By_Step_Picture_Sequences_Design_2026-09-12.md`

PR109 implements that approved scope. No FISH077/P2 capability was pulled into FISH096.

## Delivered behavior

FISH096 adds an optional Knot-only step-by-step picture sequence while preserving the existing static-picture model for every record that does not use a sequence.

A Knot sequence is represented explicitly in structured KB data as an ordered `pictureSequence`. Sequence frames live under `KB/Knots/assets/<knot-id>/` and use contiguous zero-padded `step-01`, `step-02`, ... naming. The final sequence frame is also the record's canonical `picture.src`; validation prevents the representative picture and final frame from drifting apart. The build/release inventory treats every explicit frame as production content and fails closed if any referenced frame is missing or invalid.

Normal card/detail browsing loads only the representative final frame. Clicking a sequence picture opens the sequence viewer at frame 1. The viewer provides Previous, Play/Pause, Next and Close; manual navigation does not wrap, automatic playback advances once per second and loops, and manual navigation while playing pauses first. It provides a frame indicator, preserves one shared picture caption, supports Left/Right, Space and Escape keyboard controls, and retains the existing zoom/pan/pinch behavior. Remaining frames are preloaded only after the sequence viewer opens.

The existing static viewer remains unchanged.

## Authoring behavior

Knot Add/Edit authoring keeps sequence controls inside the existing Picture section and Picture action selector. Sequence creation/replacement uses a native multi-file chooser labelled **Choose local pictures**. The complete intended sequence must be selected together; filenames establish order; the final frame automatically becomes the representative picture; and the Repository picture path is derived from that final frame.

Supported conversions are:

- static picture → complete step-by-step sequence;
- existing sequence → complete replacement sequence;
- existing sequence → new single picture;
- existing sequence → remove sequence while retaining the current representative final picture;
- remove picture/sequence entirely.

Converting into a sequence never silently reuses the old static picture as its final frame. Replacing/removing a reference does not automatically delete superseded source image files. Changing a sequenced Knot to a non-Knot type requires resolving the sequence before Prepare Changes.

The P1 `fishing-companion-change-v2` handoff was extended to carry complete ordered sequence paths/file hashes and sequence intent atomically with picture changes. Preparing/copying remains a source-aware handoff only: there is still no Direct Save or browser-side GitHub write. After Prepare, the UI provides the exact GitHub upload-folder link for `KB/Knots/assets/<knot-id>/`.

## Offline and loading behavior

FISH096 preserves the FISH091 online-only-default contract. Ordinary online browsing does not download every sequence frame or the complete library. **Connection Status → Update offline library** includes all referenced sequence frames in the complete verified offline generation. Prior complete-generation fallback and failed/corrupt-update retention remain unchanged.

No permanent production sample sequence was added solely for testing, so canonical KB counts and the hosted v2-file count remain unchanged by test fixtures.

## Acceptance and production evidence

The final implementation head was `6a7caf1e8d54c5aaef654ff051c085742c666ac1`. PR acceptance [run 34716390133](https://github.com/ginosega/fishing/actions/runs/34716390133) passed the complete source/core gate, preview-scope Chromium/WebKit acceptance, production build verification, and production-browser/archived-v1 cutover acceptance.

During acceptance, the tests exposed and caused repair of one real authoring-state defect: selecting a sequence action could initially be reclassified as an already-saved sequence and reset to Keep, and successful multi-file selection cleared the native chooser. Commit `5157d72615babf3998534479d7caca37ae9e4b4e` corrected that state transition and preserved selected files.

A later combined conversion scenario failed because the existing dirty-editor navigation guard correctly prevented leaving a prepared editor without confirmation. That was an acceptance-test isolation problem rather than a product defect. Commit `6a7caf1e8d54c5aaef654ff051c085742c666ac1` separated the conversion scenarios and added an explicit native multi-file retention assertion. The resulting PR run passed.

PR109 was then merged to `main` as `0782d1fd6ff9a176d94132c4dc962589b9480e32`. Production [run 34716722379](https://github.com/ginosega/fishing/actions/runs/34716722379) passed:

- source/core validation and verified production build;
- preview-scope Chromium/WebKit acceptance;
- production-browser and actual archived-v1 cutover acceptance;
- exact-current-main deployment guard;
- GitHub Pages deployment;
- hosted byte verification of all 214 v2 files;
- hosted browser verification of online-only/offline-library behavior and existing application regressions; and
- hosted FISH096 verification of Add Knot sequence selection, local sequence preview, ordered handoff metadata and the exact per-Knot GitHub upload link.

Hosted verification reported release `23f6839d69df2018aed54fa6d3fc70d4`, source `0782d1fd6ff9a176d94132c4dc962589b9480e32`, 214 v2 files, and artifact `10305125488`.

## Subsequent production advancement on September 12, 2026

After FISH096 had already been production-verified, the user directly uploaded 13 Palomar step PNGs under the Knot assets tree. That source-only upload advanced `main` and triggered the normal production workflow. The resulting production state was independently verified as:

- source `7d43898d1c8e59ec87fcc8913e45c1df01957fd1`;
- release `921777f82c4216eccfb26d17e1043a57`;
- [workflow run 34717459805](https://github.com/ginosega/fishing/actions/runs/34717459805);
- 214 hosted v2 files; and
- hosted-verification artifact `10305581445`.

All 42 production-browser tests passed, as did source/core validation, preview acceptance, archived-v1 cutover acceptance, exact-current-main deployment protection, Pages deployment and hosted verification.

The 13 uploaded Palomar images are intentionally **unreferenced source assets** at this point. No canonical Palomar `pictureSequence` record change has yet been made, so the build correctly excludes those PNGs from the release manifest. This is expected behavior and directly confirms the FISH096 rule that directory contents alone do not define or publish a sequence; the ordered sequence must be explicit in canonical KB data.

The original FISH096 feature-release identity above remains the authoritative historical closeout for implementation PR109. The later source/release identity is the current production state after the subsequent unreferenced asset upload.

## Scope preserved

FISH077/P2 remains **DEFERRED**. FISH096 does not add Direct Save, authentication, integrated GitHub uploads, offline authoring, outbox/sync, Catch authoring, generic multi-image galleries, per-frame captions, drag/drop ordering, playback-speed controls or autoplay on viewer open.

FISH091 remains DONE and its explicit offline-library preparation model is unchanged. Existing Gear, KB and Catch identities/content remain unchanged except for the schema/runtime capability needed to support future Knot sequence records.

## Continuation

FISH-TODO-096 is **DONE / production-verified**. The next unused canonical task ID is **FISH-TODO-097**. Continue in Chat mode from actual latest `main`; do not restart FISH096 implementation or deployment work.