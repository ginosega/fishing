# Fishing Context

## Current authoritative state — September 13, 2026

FISH-TODO-106 is **DONE / production-verified**.

### FISH106 — Gear tools, storage and accessories batch

FISH106 shipped through [PR134](https://github.com/ginosega/fishing/pull/134). It implemented six supplied `fishing-companion-change-v2` Gear add packages together.

Canonical additions:

- `kastking-brutus-silicone-foldable-extendable-net`: **KastKing Brutus Silicone Foldable Extendable Net**, category `accessories`, type `Tools`, extended length `45"`, hoop size `20'' x 16'' x 10''`, canonical Markdown `Gear/Equipment/content/KastKing Brutus Silicone Foldable Extendable Net.md`, picture `Gear/Equipment/assets/KastKing Brutus Silicone Foldable Extendable Net.png`.
- `kastking-cutthroat-7-stainless-steel-pliers`: **KastKing Cutthroat 7" Stainless Steel Pliers**, category `accessories`, type `Tools`, canonical Markdown `Gear/Equipment/content/KastKing Cutthroat 7 Stainless Steel Pliers.md`, picture `Gear/Equipment/assets/KastKing Cutthroat 7-in Stainless Steel Pliers.png`.
- `skylety-fishing-hook-sharpener`: **Skylety Fishing Hook Sharpener**, category `accessories`, supplied type `Kayaks`, color `Orange`, model `Fishing Hook Sharpener File Double Sided`, picture `Gear/Equipment/assets/Skylety Fishing Hook Sharpener.png`.
- `plano-sportsman-s-trunk`: **Plano Sportsman's Trunk**, category `accessories`, type `Storage`, size `Large`, color `Blaze Orange`, exterior dimensions `37.25"L x 18"W x 14"H`, model number `PLAT19BOE`, picture `Gear/Equipment/assets/Plano Sportsman's Trunk.png`.
- `kastking-v10-pivot-grip-fishing-rod-holder`: **KastKing V10 Pivot Grip Fishing Rod Holder**, category `accessories`, type `Storage`, picture `Gear/Equipment/assets/KastKing V10 Pivot Grip Fishing Rod Holder.png`.
- `palmyth-flexible-fishing-gloves`: **Palmyth Flexible Fishing Gloves**, category `accessories`, type `Accessories`, size `Large`, color `Black/Grey`, picture `Gear/Equipment/assets/Palmyth Flexible Fishing Gloves.png`.

The two supplied Markdown notes are canonical and were promoted verbatim. The Brutus note records the included KastKing hook remover/fish gripper and 44 lb capacity. The Cutthroat note records the included KastKing Line Stripper and KastKing Radius Line Spooler links/video.

All six pictures were user-supplied and had already been uploaded to physical canonical source under `pwa/Gear/Equipment/assets/` before package promotion. Their repository byte sizes matched the package metadata during promotion validation; FISH106 referenced them in place and did not regenerate or rewrite their bytes. The Plano Sportsman's Trunk PNG was the initially missing upload and was subsequently verified at **1,016,850 bytes** before promotion proceeded.

The supplied package base revisions were verified as ancestors of current source, all six IDs were absent, and there was no intervening structured Gear conflict. CI exposed only the expected stale acceptance baselines caused by the six additions. Final validator-measured baselines are **80 Gear / 56 KB / 5 Catches**, **110 canonical library paths**, and **245 source inventory references**.

Feature acceptance evidence:

- feature PR: [PR134](https://github.com/ginosega/fishing/pull/134)
- final exact feature head: `4a1c9dd5d765bd07b4ce3b36b6e3bc17ff43a8b0`
- exact-head acceptance: [run 34808981155](https://github.com/ginosega/fishing/actions/runs/34808981155), success
- merged application source: `9b419e07f9a3a56a2be1ddbfb0df1760fe2730cb`

Final verified production:

- source `9b419e07f9a3a56a2be1ddbfb0df1760fe2730cb`
- release `fe94ec0a8b0c606f72847ef3fda0a5b6`
- [workflow run 34809970042](https://github.com/ginosega/fishing/actions/runs/34809970042)
- **342 hosted v2 files**
- production-bundle artifact `10334457339`
- production-acceptance-evidence artifact `10334502241`
- Pages artifact `10334936059`
- hosted-verification artifact `10334477509`

That exact-current-main run passed source/core validation, Chromium/WebKit preview acceptance, production-browser acceptance, actual archived-v1 cutover acceptance, exact-current-main guard, Pages deployment, byte-for-byte hosted verification and hosted-browser verification. Hosted verification reported source revision `9b419e07f9a3a56a2be1ddbfb0df1760fe2730cb`, release `fe94ec0a8b0c606f72847ef3fda0a5b6`, and 342 hosted v2 files; the generated release contains all six FISH106 pictures and both FISH106 Markdown notes.

FISH102–FISH105 remain complete and production-verified. FISH102 added the Line-Tackle-Knot Reference and pinned-first Knot-category ordering. FISH103 moved canonical physical domain source under `pwa/` and fixed external/internal link targeting, Caption focus and new-KB Markdown Preview validation ordering. FISH104 added the Humminbird Fish Finder Gear record and notes/picture. FISH105 corrected Perception Joyride 10.0 to `Kayaks` and added four KastKing tackle-management items.

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

Canonical counts are **80 Gear, 56 KB and 5 Catches**. The six FISH106 Gear items are canonical under Gear → Equipment with the supplied type values. The FISH105 KastKing tackle-management items and corrected Perception Joyride 10.0 remain canonical. The Humminbird Fish Finder remains canonical in Gear → Equipment / `Electronics`. The Line-Tackle-Knot Reference is canonical and pinned first on KB → Knots.

Active Knot sequences are Palomar (13 PNG), Albright (15 JPG), Arbor (9 JPG), Bowline (7 JPG), FG (29 JPG), Improved Clinch (11 PNG), Modified Uni (12 JPG), and Trilene (15 PNG). Non-Slip Loop uses its static representative picture. Every sequence is explicitly referenced by canonical KB data and participates in FISH091 explicit complete-library preparation; directory contents alone never create a sequence.

Double Uni Knot and Single Uni Knot no longer exist in canonical KB source. The canonical PWA icon is `pwa/icon.png`. Historical filenames/bytes remain in Git history only as recovery evidence.

## Continuation

FISH071–076 and FISH078–106 are complete. Fishing Companion v3 (`FISH-TODO-077/P2`) remains deferred. Existing fishing/equipment/content backlog and purchase uncertainty remain active in `Fishing_TODO.md`; FISH104 still does not by itself close `FISH-TODO-005`. FISH105 still does not automatically close `FISH-TODO-014`; the supplied Gear package does not explicitly identify the HyperSeal 3600 box as the backlog's specific “KastKing 3600 deep box” target. FISH106 does not alter either conclusion.

The next unused canonical application task ID is **FISH-TODO-107** unless current `main` has already allocated it.

For a new chat, read `README.md`, this file, `Fishing_TODO.md`, `Fishing_Decision_Log.md`, then `Fishing_New_Chat_Bootstrap_Prompt.md`. Historical release/migration evidence remains in Git history and `pwa/docs/`; do not restart completed FISH096–FISH106 release work.
