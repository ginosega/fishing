# Fishing Context

## Current production state — September 10, 2026

Current Fishing Companion production source is `26e6c9b3dcad25b10eae891871a7d8d873fdfedb`, published and hosted-verified by [run 34518842561](https://github.com/ginosega/fishing/actions/runs/34518842561). Post-production site-authored changes are PR75 (Pflueger spincast rod), PR76 (Pflueger spincast reel), and PR77 (Tsuridamashii ball-bearing snap-swivels picture). The supplied Tsuridamashii picture is now canonical and live. Six originally deferred required pictures remain: Gear Rapala Original Floating F-3, Mack's Pee Wee Hoochie and River2Sea Whopper Plopper60; KB Perch, Popper and Whopper Plopper. Generic inline-spinner remains optional. P2 remains deferred. Earlier cleanup/initial-release sections below remain dated historical evidence.

## Repository cleanup — September 10, 2026

The user approved the new site's appearance and behavior, then requested repository cleanup. Production source, tests, contracts and migration evidence have moved from root `v2/` into `pwa/`; the preserved icon was the only build dependency on the former v1 `pwa/`. Retained v2 specifications/release references are in `pwa/docs/`. Root `History/`, `Topics/`, obsolete registries/handoffs and v1 runtime/assets/per-item helpers are removed from main, recoverable at `checkpoint/pre-repo-cleanup-20260910` (`edca2a3f04fc8c32dec65b9330d43944be1a561c`). Canonical Gear/KB/Catch bytes, including the newer unreferenced Pflueger image upload, are unchanged. No image adoption or migration rerun.

Add/Edit creates copyable source-change packages, not one-off helper/release files. Routine changes must update canonical files and existing project records; reusable code/tests stay under `pwa/`, and significant release references belong under `pwa/docs/`. No new per-item scripts/release records in either root. Cleanup PR73 is merged and published. [Production run 34490532301](https://github.com/ginosega/fishing/actions/runs/34490532301) passes all 20 core tests, 42 browser scenarios across the two scopes, and all 197 hosted-file comparisons. Current production source `6a64be686cf751720884469b98f2fcc4df94ec6a`, release `d63599a99498d62fdfb1fc22c04643c2`. See [cleanup/release evidence](pwa/docs/Repository_Cleanup_2026-09-10.md).


V2 is published at [Fishing Companion](https://ginosega.github.io/fishing/). Production revision `6a64be686cf751720884469b98f2fcc4df94ec6a`, release `d63599a99498d62fdfb1fc22c04643c2`, passed [publication and hosted verification](https://github.com/ginosega/fishing/actions/runs/34490532301). PR64 is merged. The user authorized production and waived another preview review; all seven previously required missing pictures are explicitly deferred. The affected records remain available without pictures. No acceptance or media approval blocks this release.

Validation: 20 core tests, 20 preview-scope and 22 production-scope Chromium/WebKit scenarios, including the actual archived-v1 worker transition and retained browser stores. All 197 hosted files match the verified production build; live navigation, image viewer, offline reload, counts and absent-picture behavior pass. These are automated browser and direct hosted checks, not physical-device inspection.

The sole active pipeline is `.github/workflows/fishing-production.yml`. V1 and the earlier preview are historical; use the production root. V1 sources are archived in Git history and the pre-cleanup checkpoint; exact rollback ZIPs remain in Git. Old browser stores are retained. P2 remains deferred. This authorized Work phase is complete; continue in Chat.

## Authority and preserved source

The Approved Baseline and original Requirements Inventory/Design Review are authoritative. All fourteen original design decisions and user response bodies are unchanged. The review document and twelve screenshots are recorded verbatim in `pwa/docs/Fishing_v2_Review_Feedback_2026-09-09.md`; the UI corrections were implemented in PR69 before production integration.

The one-time migration is `6615ae7296e48d90dceab303b6b5a1fbc041ab80`: Gear69, KB54, Catches5, six independent rod/reel components. Original Markdown, confirmed facts, stable identities and actual Catch relationships are preserved. Forty-nine approved archived pictures were adopted exact-byte and two were rejected. Production changed no canonical data, Markdown or image bytes. The original source audit and migration reconciliation remain historical evidence, not instructions to reset sources.

The pinned canonical migration hashes remain Gear `e001c82a49c63b8ac21c93b559bc4768a40d267eff8bdf3fb6e73225cac64256`, KB `85bbf03d55b98432a21ed67288fc11e72c7fcf660a9af6de59ccf4beaa6268a4`, Catches `db97091e484021f0b261b91a27c790bd9f2bd4a8221bbd432e47400e21e9459b`. They are evidence, not permanent locks on future user-authored changes; tests validate current source.

## Pictures and browser data

The original production decision explicitly approved absence of seven required pictures and remains preserved in `pwa/migration/media-decisions.json` as historical migration disposition. The user later supplied and published the Tsuridamashii ball-bearing snap-swivels picture through PR77. Six required pictures remain deferred: Gear Rapala Original Floating F-3, Mack's Pee Wee Hoochie and River2Sea Whopper Plopper60, and KB Perch, Popper and Whopper Plopper. Generic inline-spinner remains optional. The user will supply pictures later; do not acquire them automatically or adopt the unapproved F-3 capture.

The user accepted source-equivalence evidence and waived a separate device-only IndexedDB export. No device inspection is claimed. Old v1 IndexedDB and caches remain; reconcile any later-discovered local-only records before retirement.

## Runtime and release discipline

V2 has independent Gear/KB/Catch domains and ordinary independent rods/reels. Catch retains optional Species/Location/owned Lure-Bait references, text Size and Species-derived pictures. P1 supports full offline reading and source-aware Gear/KB Prepare/Copy handoffs. P2 Save/auth/uploads/offline edits/sync/Catch authoring remains deferred. No generic graph, sessions, Planner, paired setups, speculative ownership/media system or accounts.

Complete releases are verified before readiness; corrupt or incomplete content is rejected, retries repair only verified bytes, and prior complete releases remain immutable for rollback. Dirty forms are protected. The production loader verifies the v2 worker protocol even when the prior v1 worker has the same URL. The release has the reviewed header, connection dialog, cards, controls, absent-image behavior and clipboard feedback; release diagnostics are absent from production.

`fishing-production.yml` is the sole active Pages pipeline. Old v1/preview publishers and one-time workflows are retained in Git history. Recovery checkpoint `checkpoint/v1-before-v2-preview-20260909` preserves both exact v1 ZIPs; see the production release for hashes and restoration. Do not use historical v1 build commands to overwrite production or delete retained browser stores.

## Backlog and next chat

FISH071–076,079–083 are DONE; FISH077 is DEFERRED. FISH078 remains DEFERRED for the six still-missing required pictures; the Tsuridamashii snap-swivels picture was supplied and published through PR77. Unrelated fishing/equipment/content backlog is preserved; next unused ID is084. Continue in Chat using the current bootstrap. New work must restore actual latest main, use normal PR/CI for runtime changes and update authoritative records after actual milestones.
