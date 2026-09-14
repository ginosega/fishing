# Fishing Context

## Current authoritative state — September 14, 2026

FISH-TODO-107 is **DONE / production-verified**.

### FISH107 — Skylety Fishing Hook Sharpener type correction

FISH107 shipped through [PR136](https://github.com/ginosega/fishing/pull/136). It implemented one supplied `fishing-companion-change-v2` Gear edit package:

- Gear ID: `skylety-fishing-hook-sharpener`
- **Skylety Fishing Hook Sharpener**
- category remains `accessories`
- canonical type changed from `Kayaks` to `Tools`
- notes: keep
- picture: keep
- picture sequence: keep

Package validation established that base revision `9b419e07f9a3a56a2be1ddbfb0df1760fe2730cb` was the deployed application parent of the then-current docs-only `main`, the current record still had base type `Kayaks`, and its canonical fingerprint exactly matched supplied record hash `31811a75b2d315a2c98a7b25bf8b51fd52c77195b6c54783e90cdb0aa4c57db8`. `Tools` is an allowed Equipment type. There was no structured-data conflict.

The final feature diff contained exactly one file and one semantic line change in `pwa/Gear/gear.json`: `type: Kayaks` → `type: Tools`. Counts, paths, notes, pictures, picture sequences and media references were unchanged, so validator baselines remain **80 Gear / 56 KB / 5 Catches**, **110 canonical library paths**, and **245 source inventory references**.

Feature acceptance evidence:

- feature PR: [PR136](https://github.com/ginosega/fishing/pull/136)
- feature branch: `feature/fish107-skylety-type`
- final exact feature head: `f36be26dddfb2da8c0957917c0fceb389192177e`
- exact-head acceptance: [run 34811426937](https://github.com/ginosega/fishing/actions/runs/34811426937), success
- merged application source: `6fae3afbe8f227b4c12875c5d5e8f0d4c0c8861f`

Final verified production:

- source `6fae3afbe8f227b4c12875c5d5e8f0d4c0c8861f`
- release `21d203ccdef509cd99626680ae34de98`
- [workflow run 34811980881](https://github.com/ginosega/fishing/actions/runs/34811980881), run number 188
- validate job `103874988437`, success
- deploy job `103876502029`, success
- **342 hosted v2 files**
- production-bundle artifact `10334724772`
- production-acceptance-evidence artifact `10335063749`
- Pages artifact `10334664984`
- hosted-verification artifact `10334949254`

The exact-current-main production run passed durable-v1 recovery, locked dependency audit, source/core validation, Chromium/WebKit preview acceptance, production-root verification, production-browser and real archived-v1 cutover acceptance, exact-current-main guard, Pages deployment, byte-for-byte hosted verification and hosted-browser verification. Hosted verification reported source revision `6fae3afbe8f227b4c12875c5d5e8f0d4c0c8861f`, release `21d203ccdef509cd99626680ae34de98`, and 342 hosted v2 files.

FISH102–FISH106 remain complete and production-verified. FISH106's historical release evidence correctly records that Skylety entered canonical Gear using its then-supplied `Kayaks` type; FISH107 is the authoritative later correction to `Tools`.

## Operating mode

This project uses **Chat mode by default and permanently**. Do not recommend Work merely because a task is complex, lengthy, file-heavy, analytical, involves research/calculation, creates artifacts or has substantial context. Recommend a temporary switch only for a genuinely Work-only capability; explain the specific need and obtain explicit approval first, then return to Chat afterward.

Before implementation/release/repository-write work, restore actual latest `main` and current open-PR state. Never rely on a previously observed commit as though it is still current.

## New-chat transfer protocol

When the user says **“It’s time to transfer to a new chat”** or clearly states that the current chat is getting too long and should be transferred, ask the user to confirm that they want the full project-state handoff prepared. Once confirmed, complete the handoff without repeated “Proceed” prompts: restore current `main`/PR state, reconcile the chat against repository and production evidence, update the authoritative project records and bootstrap prompt, preserve exact continuation state and unresolved work, perform a cross-file consistency check, and leave the repository in a clean continuation state. The final response must include a clickable GitHub link to `Fishing_New_Chat_Bootstrap_Prompt.md` so the user can copy it into the new Chat-mode conversation.

This transfer phrase is a durable Fishing-project convention rather than an automatic ChatGPT product trigger. A user-requested lighter transfer overrides the full protocol.

## Durable repository and production architecture

`ginosega/fishing` is authoritative. Canonical physical domain data lives under `pwa/Gear/`, `pwa/KB/` and `pwa/Catches/`. Logical record/release paths remain `Gear/...`, `KB/...` and `Catches/...`. The active PWA implementation, contracts, build tools, tests, migration evidence and release documentation also live under `pwa/`. `.github/workflows/fishing-production.yml` is the sole active production publisher.

Fishing Companion uses three independent but consistent domains — Gear, KB and Catch — rather than a forced generic entity framework. The KB entity model covers Location, Species, Equipment/Gear Guides, Technique and Knot. Paths are explicit record properties rather than inferred identities.

Gear and KB support source-aware Prepare Changes → Copy Changes authoring. Preparing/copying is **not saving** and the browser does not write to GitHub. Canonical implementation work occurs through repository changes, PR/CI, merge and production verification.

## Offline behavior — FISH091

FISH091 remains **DONE / production-verified**. Ordinary online startup/navigation does not provision the complete offline library. Online browsing uses current production. **Connection Status → Update offline library** is the explicit complete-library preparation/refresh action. A prior verified complete generation may remain the offline fallback until explicitly refreshed; failed, corrupt or quota-failed refreshes preserve the prior complete generation. A device without a prepared complete generation must not claim offline readiness.

## Knot picture sequences — FISH096

A KB Knot may optionally contain an explicit ordered `pictureSequence` of at least two frames. Logical frame paths are under `KB/Knots/assets/<knot-id>/` using contiguous zero-padded `step-01`, `step-02`, ... names; physical files are under `pwa/KB/Knots/assets/<knot-id>/`. Runtime order comes from the explicit structured array, not directory scanning. Every frame receives the existing path/image/integrity validation and is included in the verified complete offline library.

`picture.src` must equal the final sequence frame and remains the record's representative picture. Cards and ordinary detail pages load only that representative frame. Clicking it opens the sequence viewer at frame 1. The viewer provides Previous, Play/Pause, Next and Close, a frame indicator, one shared caption, Left/Right/Space/Escape keyboard controls and existing zoom/pan/pinch behavior. Manual Previous/Next does not wrap; automatic playback runs at one second per frame and loops; manual stepping pauses playback first. Remaining frames are preloaded only after the viewer is opened.

Existing static-picture records and the existing static viewer remain unchanged. Knot Add/Edit sequence authoring stays inside the existing Picture section. Add/replace sequence uses a native multi-file picker labelled **Choose local pictures** and requires the complete intended sequence at once. Filenames establish order and the final frame automatically becomes `picture.src`; there is no separate representative selection and no option to silently reuse a prior static picture as the final sequence frame. Existing sequences can be replaced, converted to a new single picture, reduced to the existing representative picture, or removed. Superseded source image files are not automatically deleted.

The `fishing-companion-change-v2` handoff explicitly carries sequence action, ordered paths and selected-file hashes. It remains a Prepare/Copy handoff only; there is no integrated repository upload or Direct Save.

## Fishing Companion v3 — deferred future phase

**Fishing Companion v3** is the preferred current name for the future phase historically recorded as `FISH-TODO-077/P2`. It remains **DEFERRED**. Historical references to `FISH-TODO-077/P2` remain valid identifiers, but new prose should call the phase Fishing Companion v3.

Do not treat authentication, direct GitHub save/upload, integrated uploads, offline authoring, outbox/sync, Catch authoring or multi-user generalization as implemented or implicitly approved.

The retired Planner, Trip History/Sessions, paired-setup structures and old v1-only source conventions must not be reintroduced without a new explicit requirement.

## Content and media state

Canonical counts are **80 Gear, 56 KB and 5 Catches**. The six FISH106 Gear items remain canonical under Gear → Equipment; FISH107 supersedes the original Skylety classification so **Skylety Fishing Hook Sharpener is now type `Tools`**. The FISH105 KastKing tackle-management items and corrected Perception Joyride 10.0 remain canonical. The Humminbird Fish Finder remains canonical in Gear → Equipment / `Electronics`. The Line-Tackle-Knot Reference is canonical and pinned first on KB → Knots.

Active Knot sequences are Palomar (13 PNG), Albright (15 JPG), Arbor (9 JPG), Bowline (7 JPG), FG (29 JPG), Improved Clinch (11 PNG), Modified Uni (12 JPG), and Trilene (15 PNG). Non-Slip Loop uses its static representative picture. Every sequence is explicitly referenced by canonical KB data and participates in FISH091 explicit complete-library preparation; directory contents alone never create a sequence.

Double Uni Knot and Single Uni Knot no longer exist in canonical KB source. The canonical PWA icon is `pwa/icon.png`. Historical filenames/bytes remain in Git history only as recovery evidence.

## Continuation

FISH071–076 and FISH078–107 are complete. Fishing Companion v3 (`FISH-TODO-077/P2`) remains deferred. Existing fishing/equipment/content backlog and purchase uncertainty remain active in `Fishing_TODO.md`; FISH104 still does not by itself close `FISH-TODO-005`. FISH105 still does not automatically close `FISH-TODO-014`; the supplied Gear package does not explicitly identify the HyperSeal 3600 box as the backlog's specific “KastKing 3600 deep box” target. FISH106 and FISH107 do not alter either conclusion.

The next unused canonical application task ID is **FISH-TODO-108** unless current `main` has already allocated it.

For a new chat, read `README.md`, this file, `Fishing_TODO.md`, `Fishing_Decision_Log.md`, then `Fishing_New_Chat_Bootstrap_Prompt.md`. Historical release/migration evidence remains in Git history and `pwa/docs/`; do not restart completed FISH096–FISH107 release work.
