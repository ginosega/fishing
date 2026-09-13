# Fishing Decision Log

This file records **current durable decisions**. Detailed historical release evidence remains in Git history and dated `pwa/docs/` records rather than being repeated here.

## Operating mode

**Decision:** Chat mode is the permanent default for this project. Do not recommend Work merely because work is complex, lengthy, file-heavy, analytical, research/calculation-heavy or artifact-producing. Use a temporary Work switch only for a genuinely Work-only capability after explaining the need and obtaining explicit user approval.

## Repository authority and release discipline

**Decision:** `ginosega/fishing` is authoritative. Restore actual latest `main` and open-PR state before implementation/release/repository-write work. Canonical domain content lives in `Gear/`, `KB/` and `Catches/`; active app/build/test code lives under `pwa/`.

Runtime/source changes use normal PR/CI, merge and exact-current-main deployment. `.github/workflows/fishing-production.yml` is the sole active Pages publisher. Documentation-only reconciliation does not republish production.

## Domain architecture

**Decision:** Fishing Companion retains three independent but consistent domains — Gear, Knowledge Base and Catch — with shared utilities where useful. Do not force them into a generic graph/entity framework.

KB types are Location, Species, Equipment/Gear Guide, Technique and Knot. Paths are explicit record properties, not inferred identity. Existing IDs remain stable. Catch relationships remain the approved limited forward references; retired trips/sessions/planner/setup structures are not reintroduced without a new explicit requirement.

## P1 authoring boundary

**Decision:** Gear/KB browser Add/Edit uses **Prepare Changes → Copy Changes** to create a source-aware `fishing-companion-change-v2` handoff. Preparing/copying is not saving. Browser-side repository writes/uploads are not part of P1. Dirty forms remain protected and existing source/base conflict checks remain required.

Routine source changes update canonical files directly; do not create per-item release/helper scaffolding. Significant application-release references belong in `pwa/docs/`.

## FISH091 — online-only default / explicit offline library

**Decision/status:** DONE and production-verified. Ordinary online startup/navigation does not provision the complete offline library. **Connection Status → Update offline library** explicitly prepares or refreshes the verified complete offline generation. Online browsing uses current production even when an older complete offline generation remains available as fallback. Failed/corrupt/quota-failed explicit updates preserve the prior complete generation. Devices without a prepared generation must not claim offline readiness.

FISH096/FISH097/FISH098/FISH099 do not change this decision.

## FISH096 — Knot step-by-step picture sequences

**Decision/status:** DONE and production-verified. Requirements and design were separately approved before implementation. [PR109](https://github.com/ginosega/fishing/pull/109) originally shipped the feature as production source `0782d1fd6ff9a176d94132c4dc962589b9480e32`, release `23f6839d69df2018aed54fa6d3fc70d4`, [run 34716722379](https://github.com/ginosega/fishing/actions/runs/34716722379), with 214 hosted v2 files. Full feature closeout: `pwa/docs/FISH096_Production_Closeout_2026-09-12.md`.

After FISH096, the user uploaded 13 Palomar step images without yet changing canonical KB data. They correctly remained unreferenced and unpublished until FISH097 supplied an explicit source-aware package. This remains the durable proof that repository directory contents never define a sequence by themselves.

Durable decisions:

- picture sequences are optional and **Knot-only**;
- sequence frames live under `KB/Knots/assets/<knot-id>/` using contiguous zero-padded `step-01`, `step-02`, ... names;
- authoritative order is the explicit structured `pictureSequence`, never runtime directory inference;
- a sequence contains at least two frames and every frame passes existing path/image/build/offline integrity validation;
- `picture.src` must equal the final sequence frame and remains the normal representative picture;
- cards/detail pages load only that representative frame; clicking it opens the sequence viewer at frame 1;
- visible sequence controls are Previous / Play-Pause / Next / Close; manual navigation does not wrap, auto playback loops at one second per frame, manual navigation pauses playback first;
- one shared caption applies to the sequence; no per-frame captions;
- keyboard Left/Right/Space/Escape and existing zoom/pan/pinch behavior remain supported;
- no autoplay occurs on open; remaining frames are preloaded only after the sequence viewer opens;
- existing static-picture records and static viewer remain unchanged;
- sequence authoring stays inside the existing Picture section and uses native complete multi-file selection;
- filenames establish order, and the final frame automatically becomes the representative picture;
- conversion **into** a sequence requires supplying the complete intended sequence and never silently reuses the old static picture as the final frame;
- conversion **out of** a sequence may use a new static picture or retain the existing representative final frame;
- replacing/removing references never implicitly deletes old source image files;
- changing a sequenced Knot to another KB type requires resolving the sequence first;
- the P1 handoff explicitly carries sequence intent, ordered paths and selected-file hashes; it remains Prepare/Copy only;
- FISH091 explicit complete-library preparation includes every referenced sequence frame and retains its existing fallback/atomicity guarantees.

## FISH097 — Palomar sequence package activation

**Decision/status:** DONE and production-verified. The explicit user-supplied `fishing-companion-change-v2` package for `knot-palomar` was applied through [PR112](https://github.com/ginosega/fishing/pull/112). Branch validation [run 34723150221](https://github.com/ginosega/fishing/actions/runs/34723150221) confirmed the current record fingerprint/base fields and notes base hash and recomputed all 13 image byte counts/SHA-256 hashes exactly before promotion.

The package is authoritative for this content change: Palomar description is `Strong, simple knot for braid, fluoro, or mono`; the Markdown body is the exact submitted body; `picture.src` is `KB/Knots/assets/knot-palomar/step-13.png` with caption `Palomar knot`; and `pictureSequence` explicitly orders `step-01.png` through `step-13.png`. No unrelated canonical content or application architecture changed.

Current production source is `934d70bdd669180479f8c5a71c5e1050d2dbf56d`, release `696737730abf20323e5f308739aa14c4`, [run 34723495195](https://github.com/ginosega/fishing/actions/runs/34723495195), 227 hosted v2 files, hosted-verification artifact `10306962337`. Full CI, exact-current-main deployment, hosted-byte verification and hosted-browser verification passed. All 13 frames are now release-manifest content and participate in FISH091 explicit offline-library preparation.

## FISH098 — Albright sequence package activation

**Decision/status:** DONE and production-verified. The explicit user-supplied `fishing-companion-change-v2` package for `knot-albright` was applied through [PR114](https://github.com/ginosega/fishing/pull/114). Branch validation [run 34736320090](https://github.com/ginosega/fishing/actions/runs/34736320090) confirmed the current record fingerprint, notes base hash and absent picture/sequence bases, and recomputed all 15 image byte counts/SHA-256 hashes exactly before promotion. Pre-merge acceptance [run 34736339166](https://github.com/ginosega/fishing/actions/runs/34736339166) passed.

The package is authoritative for this content change: the Albright Markdown body is the exact submitted replacement; `picture.src` is `KB/Knots/assets/knot-albright/step-15.jpg` with caption `Albright knot`; and `pictureSequence` explicitly orders `step-01.jpg` through `step-15.jpg`. No structured field changes were requested, so the prior description and other fields remain unchanged. No unrelated canonical content or application architecture changed.

Current production source is `65ac208dbb1a116cc321d5b13bea1228b3d1ee6f`, release `29d23d0444d3a187d8f67edf0a28e82d`, [run 34736590334](https://github.com/ginosega/fishing/actions/runs/34736590334), 242 hosted v2 files, hosted-verification artifact `10310509883`. Full CI, exact-current-main deployment, hosted-byte verification and hosted-browser verification passed. All 15 frames are now release-manifest content and participate in FISH091 explicit offline-library preparation.

## FISH099 — four Knot content/sequence packages

**Decision/status:** DONE and production-verified. Four explicit user-supplied `fishing-companion-change-v2` packages were applied together through [PR116](https://github.com/ginosega/fishing/pull/116). Branch validation [run 34738967489](https://github.com/ginosega/fishing/actions/runs/34738967489) verified all package record/content bases and recomputed all 45 pre-uploaded JPG byte counts/SHA-256 hashes exactly before promotion. Pre-merge acceptance [run 34738991146](https://github.com/ginosega/fishing/actions/runs/34738991146) passed.

The package set is authoritative for these changes: Albright keeps its existing 15-frame sequence but updates description and Markdown; Arbor receives the submitted description/Markdown plus a 9-frame sequence with `step-09.jpg` representative; Bowline Knot is added with submitted Markdown plus a 7-frame sequence with `step-07.jpg` representative; FG retains its existing structured description, receives the submitted Markdown, and activates a 29-frame sequence with `step-29.jpg` representative. No unrelated domain architecture changed.

The first production deployment correctly published the new 57-record KB but exposed a stale hosted-verifier expected count of 56. Verification-only [PR117](https://github.com/ginosega/fishing/pull/117) changed that one expectation to 57. Final verified production source is `9899849be676e971e3670fe72eba7ffd66986d68`, release `b331a8c5575769159113a59a17b12bca`, [run 34740072017](https://github.com/ginosega/fishing/actions/runs/34740072017), 288 hosted v2 files, hosted-verification artifact `10312475498`. Full CI, exact-current-main deployment, hosted-byte verification and hosted-browser verification passed.

## Deferred P2 boundary

**Decision:** FISH-TODO-077/P2 remains **DEFERRED**. Authentication, Direct Save, integrated GitHub upload, offline authoring, outbox/sync, Catch authoring and multi-user generalization are not implemented or implicitly authorized by FISH096–FISH099.

## Media and repository layout

**Decision:** All Gear categories and all KB categories durably support `assets/` and `content/` folders. Representative images normally live in category `assets/`; Markdown and Markdown-local media belong under category `content/`, subject to existing approved cross-domain image exceptions. Supported user-content images remain JPEG/JPG/PNG/WebP/GIF under existing size/dimension limits.

The canonical application icon is `pwa/icon.png`. Historical icon names/bytes and old v1 files remain recovery/history only.

## Open work

FISH071–076 and FISH078–099 are complete; FISH077/P2 remains deferred. The canonical TODO preserves active fishing/gear/content research and purchase uncertainty, including unresolved PowerBait hook-size and loop-knot guidance questions. The next unused canonical task ID is **FISH-TODO-100**.