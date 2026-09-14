# Fishing Context

## Current authoritative state — September 13, 2026

FISH-TODO-102 and FISH-TODO-103 are **DONE / production-verified**.

### FISH102 — Line-Tackle-Knot Reference

FISH102 shipped through [PR124](https://github.com/ginosega/fishing/pull/124). It added KB Knot record `line-tackle-knot-reference`, Markdown `KB/Knots/content/Line-Tackle-Knot Reference.md`, picture `KB/Knots/assets/Line-Tackle-Knot Reference.png`, and the ordinary detail route `#/kb/line-tackle-knot-reference`.

The **Line-Tackle-Knot Reference** card is pinned first only on KB → Knots; all remaining Knot cards stay alphabetical. Other category/search/detail ordering is unchanged. Canonical counts became **69 Gear, 56 KB and 5 Catches**.

FISH102 verified production source was `4912f93149e9de1e9cde9ff5176b4a4831a67812`, release `beff9138c96489abd9723c5fcfeef0ff`, [workflow run 34770966552](https://github.com/ginosega/fishing/actions/runs/34770966552), hosted-verification artifact `10322381375`.

### FISH103 — PWA source relocation and authoring regressions

FISH103 shipped through feature [PR125](https://github.com/ginosega/fishing/pull/125), followed by verifier-only [PR126](https://github.com/ginosega/fishing/pull/126) and [PR127](https://github.com/ginosega/fishing/pull/127). PR126 and PR127 changed only hosted-verifier dialog handling; they did not change application behavior, canonical data or release content.

FISH103's durable result is:

- canonical physical domain source moved from repository-root `Gear/`, `KB/` and `Catches/` to `pwa/Gear/`, `pwa/KB/` and `pwa/Catches/`;
- logical record/source references and generated release paths remain `Gear/...`, `KB/...` and `Catches/...`;
- the build's default physical source root is `pwa/`;
- GitHub upload-folder links from Gear/KB Add/Edit now point to the physical `pwa/...` source location;
- external HTTP(S) links from structured Links and rendered Markdown open a new tab with `noopener noreferrer`;
- internal `gear://`, `kb://`, local/anchor and in-app links remain same-tab;
- picture-caption typing on Gear/KB Add/Edit retains focus while the preview caption updates without a full picture-section rerender;
- new-KB Markdown Preview assigns a provisional required `content` path before whole-library validation, preventing the empty-content-path schema failure;
- production-workflow path filtering now relies on `pwa/**` for canonical application/domain source because the old root domain folders no longer exist.

FISH103 does **not** change FISH091 offline semantics or FISH096 sequence semantics.

Final verified production:

- source `94772e62788fa98903930e4b5649fabb9629c6d0`
- release `b8c8222697222f1dd43861427d5006fb`
- [workflow run 34795289032](https://github.com/ginosega/fishing/actions/runs/34795289032)
- **327 hosted v2 files**
- production-bundle artifact `10328869743`
- production-acceptance-evidence artifact `10329538071`
- Pages artifact `10329392228`
- hosted-verification artifact `10329313590`

That exact-current-main run passed source/core validation, Chromium/WebKit preview acceptance, production-browser acceptance, actual archived-v1 cutover acceptance, exact-current-main guard, Pages deployment, hosted-byte verification and hosted-browser verification. Hosted browser verification explicitly confirmed FISH103's physical PWA source folders, link-target behavior, stable Caption focus and new-KB Markdown Preview.

## Operating mode

This project uses **Chat mode by default and permanently**. Do not recommend Work merely because a task is complex, lengthy, file-heavy, analytical, involves research/calculation, creates artifacts or has substantial context. Recommend a temporary switch only for a genuinely Work-only capability; explain the specific need and obtain explicit approval first, then return to Chat afterward.

Before implementation/release/repository-write work, restore actual latest `main` and current open-PR state. Never rely on a previously observed commit as though it is still current.

## Durable repository and production architecture

`ginosega/fishing` is authoritative. Canonical physical domain data lives under `pwa/Gear/`, `pwa/KB/` and `pwa/Catches/`. Logical record/release paths remain `Gear/...`, `KB/...` and `Catches/...`. The active PWA implementation, contracts, build tools, tests, migration evidence and release documentation also live under `pwa/`. `.github/workflows/fishing-production.yml` is the sole active production publisher.

Fishing Companion uses three independent but consistent domains — Gear, KB and Catch — rather than a forced generic entity framework. The KB entity model covers Location, Species, Equipment/Gear Guides, Technique and Knot. Paths are explicit record properties rather than inferred identities.

Gear and KB support source-aware Prepare Changes → Copy Changes authoring. Preparing/copying is **not saving** and the browser does not write to GitHub. Canonical implementation work occurs through repository changes, PR/CI, merge and production verification.

## Offline behavior — FISH091

FISH091 remains **DONE / production-verified** and unchanged by FISH102/FISH103.

Ordinary online startup/navigation does not provision the complete offline library. Online browsing uses current production. **Connection Status → Update offline library** is the explicit complete-library preparation/refresh action. A prior verified complete generation may remain the offline fallback until explicitly refreshed; failed, corrupt or quota-failed refreshes preserve the prior complete generation. A device without a prepared complete generation must not claim offline readiness.

## Knot picture sequences — FISH096

A KB Knot may optionally contain an explicit ordered `pictureSequence` of at least two frames. Logical frame paths are under `KB/Knots/assets/<knot-id>/` using contiguous zero-padded `step-01`, `step-02`, ... names; physical files are under `pwa/KB/Knots/assets/<knot-id>/`. Runtime order comes from the explicit structured array, not directory scanning. Every frame receives the existing path/image/integrity validation and is included in the verified complete offline library.

`picture.src` must equal the final sequence frame and remains the record's representative picture. Cards and ordinary detail pages load only that representative frame. Clicking it opens the sequence viewer at frame 1. The viewer provides Previous, Play/Pause, Next and Close, a frame indicator, one shared caption, Left/Right/Space/Escape keyboard controls and existing zoom/pan/pinch behavior. Manual Previous/Next does not wrap; automatic playback runs at one second per frame and loops; manual stepping pauses playback first. Remaining frames are preloaded only after the viewer is opened.

Existing static-picture records and the existing static viewer remain unchanged. Knot Add/Edit sequence authoring stays inside the existing Picture section. Add/replace sequence uses a native multi-file picker labelled **Choose local pictures** and requires the complete intended sequence at once. Filenames establish order and the final frame automatically becomes `picture.src`; there is no separate representative selection and no option to silently reuse a prior static picture as the final sequence frame. Existing sequences can be replaced, converted to a new single picture, reduced to the existing representative picture, or removed. Superseded source image files are not automatically deleted.

The `fishing-companion-change-v2` handoff explicitly carries sequence action, ordered paths and selected-file hashes. It remains a Prepare/Copy handoff only; there is no integrated repository upload or Direct Save.

## Fishing Companion v3 — deferred future phase

**Fishing Companion v3** is the preferred current name for the future phase historically recorded as `FISH-TODO-077/P2`. It remains **DEFERRED**. Historical references to `FISH-TODO-077/P2` remain valid identifiers, but new prose should call the phase Fishing Companion v3.

Do not treat the following as implemented or implicitly approved: authentication, direct GitHub save/upload, integrated uploads, offline authoring, outbox/sync, Catch authoring or multi-user generalization.

The retired Planner, Trip History/Sessions, paired-setup structures and old v1-only source conventions must not be reintroduced without a new explicit requirement.

## Content and media state

Canonical counts are **69 Gear, 56 KB and 5 Catches**. The Line-Tackle-Knot Reference is canonical and pinned first on KB → Knots.

Active Knot sequences are Palomar (13 PNG), Albright (15 JPG), Arbor (9 JPG), Bowline (7 JPG), FG (29 JPG), Improved Clinch (11 PNG), Modified Uni (12 JPG), and Trilene (15 PNG). Non-Slip Loop uses its static representative picture. Every sequence is explicitly referenced by canonical KB data and participates in FISH091 explicit complete-library preparation; directory contents alone never create a sequence.

Double Uni Knot and Single Uni Knot no longer exist in canonical KB source. The canonical PWA icon is `pwa/icon.png`. Historical filenames/bytes remain in Git history only as recovery evidence.

## Continuation

FISH071–076 and FISH078–103 are complete. Fishing Companion v3 (`FISH-TODO-077/P2`) remains deferred. Existing fishing/equipment/content backlog and purchase uncertainty remain active in `Fishing_TODO.md`. The next unused canonical application task ID is **FISH-TODO-104** unless current `main` has already allocated it.

For a new chat, read `README.md`, this file, `Fishing_TODO.md`, `Fishing_Decision_Log.md`, then `Fishing_New_Chat_Bootstrap_Prompt.md`. Historical release/migration evidence remains in Git history and `pwa/docs/`; do not restart completed FISH096–FISH103 release work.