# Fishing

## Current production state — September 10, 2026

Fishing Companion production source `76094d48055ca9e2363298763cdbf00586fbeb71` is published and hosted-verified by [production run 34544432559](https://github.com/ginosega/fishing/actions/runs/34544432559); release `d6334fcb8a34834f1918df95b8f04efd` contains 205 hosted files and passed production navigation, image-viewer, complete-offline-reload and record-count checks. Routine site-authored updates include PR75/PR76 (Pflueger spincast rod/reel), PR77 (Tsuridamashii snap-swivels picture), PR79 (Rapala Original Floating, Mack's Pee Wee Hoochie, River2Sea Whopper Plopper 60 and Yellow Perch pictures plus Rebel Pop-R replacement), PR81 (Kokanee/Largemouth/Smallmouth Species updates), and PR84 (Popper and Whopper Plopper Gear-Guide pictures). All seven originally deferred required pictures have now been supplied and published. Generic inline-spinner remains optional. The cleanup and initial-release sections below are dated historical evidence; P2 remains deferred.

## Repository cleanup — September 10, 2026

The user approved the new site's appearance and behavior, then requested repository cleanup. Production source, tests, contracts and migration evidence have moved from root `v2/` into `pwa/`; the preserved icon was the only build dependency on the former v1 `pwa/`. Retained v2 specifications/release references are in `pwa/docs/`. Root `History/`, `Topics/`, obsolete registries/handoffs and v1 runtime/assets/per-item helpers are removed from main, recoverable at `checkpoint/pre-repo-cleanup-20260910` (`edca2a3f04fc8c32dec65b9330d43944be1a561c`). Canonical Gear/KB/Catch bytes, including the newer unreferenced Pflueger image upload, are unchanged. No image adoption or migration rerun.

Add/Edit creates copyable source-change packages, not one-off helper/release files. Routine changes must update canonical files and existing project records; reusable code/tests stay under `pwa/`, and significant release references belong under `pwa/docs/`. No new per-item scripts/release records in either root. Cleanup PR73 is merged and published. [Production run 34490532301](https://github.com/ginosega/fishing/actions/runs/34490532301) passes all 20 core tests, 42 browser scenarios across the two scopes, and all 197 hosted-file comparisons. Current production source `6a64be686cf751720884469b98f2fcc4df94ec6a`, release `d63599a99498d62fdfb1fc22c04643c2`. See [cleanup/release evidence](pwa/docs/Repository_Cleanup_2026-09-10.md).


V2 is published at [Fishing Companion](https://ginosega.github.io/fishing/). Production revision `6a64be686cf751720884469b98f2fcc4df94ec6a`, release `d63599a99498d62fdfb1fc22c04643c2`, passed [publication and hosted verification](https://github.com/ginosega/fishing/actions/runs/34490532301). PR64 is merged. The user authorized production and waived another preview review; all seven previously required missing pictures are explicitly deferred. The affected records remain available without pictures. No acceptance or media approval blocks this release.

Validation: 20 core tests, 20 preview-scope and 22 production-scope Chromium/WebKit scenarios, including the actual archived-v1 worker transition and retained browser stores. All 197 hosted files match the verified production build; live navigation, image viewer, offline reload, counts and absent-picture behavior pass. These are automated browser and direct hosted checks, not physical-device inspection.

The sole active pipeline is `.github/workflows/fishing-production.yml`. V1 and the earlier preview are historical; use the production root. V1 sources are archived in Git history and the pre-cleanup checkpoint; exact rollback ZIPs remain in Git. Old browser stores are retained. P2 remains deferred. This authorized Work phase is complete; continue in Chat.

## Project authority

GitHub `ginosega/fishing` is the durable source of truth. Restore actual latest main before acting and preserve newer user changes. Current domain sources are `Gear/gear.json`, `KB/kb.json`, `Catches/catches.json`, their authored Markdown and local image bytes. Application source and tests live in `pwa/`; retained specifications and release evidence live in `pwa/docs/`. Historical root registries, Topics, History and v1 sources were removed from main and remain in the pre-cleanup Git checkpoint.

- [Context](Fishing_Context.md), [TODO](Fishing_TODO.md) and [Decision Log](Fishing_Decision_Log.md).
- [New Chat bootstrap](Fishing_New_Chat_Bootstrap_Prompt.md) — copy the full contents into a Chat conversation.
- [Production release and recovery](pwa/docs/Fishing_v2_Production_Release_2026-09-10.md).
- [Approved Baseline](pwa/docs/Fishing_Companion_v2_Approved_Baseline.md), [Requirements Inventory](pwa/docs/Fishing_Companion_v2_Requirements_Inventory.md) and [Design Review](pwa/docs/Fishing_Companion_v2_Design_Review.md) — original user responses remain authoritative.
- [Source Audit](pwa/docs/Fishing_Companion_v2_Source_Audit.md) and [addendum](pwa/docs/Fishing_Companion_v2_Source_Audit_Addendum_2026-09-09.md); [Technical Contracts](pwa/docs/Fishing_Companion_v2_Technical_Contracts.md), [addendum](pwa/docs/Fishing_Companion_v2_Technical_Contracts_Addendum_2026-09-09.md) and [schema](pwa/contracts/schema.json).
- [Verbatim review feedback](pwa/docs/Fishing_v2_Review_Feedback_2026-09-09.md); [review checkpoint](pwa/docs/Fishing_v2_Review_Release_2026-09-09.md), [original preview release](pwa/docs/Fishing_v2_Preview_Release_2026-09-09.md) and [Work Handoff](pwa/docs/Fishing_v2_Work_Handoff_2026-09-09.md) are dated historical evidence.

## Scope and operation

Three independent Gear/KB/Catch domains share identity, Markdown, picture and validation conventions. P1 includes read-only Catch Log, full-library offline reading and minimal source-aware Gear/KB Prepare Changes → Copy Changes handoffs. Direct Save, authentication, uploads, offline editing/outbox/sync and Catch browser authoring remain deferred. No Planner, sessions, paired-setup relationships, speculative ownership/media graph, accounts or multi-user expansion.

Chat is the permanent default. Work requires a specific approved execution need; complexity, duration, research or file volume alone are not reasons to switch. Authorized work proceeds through meaningful tests, normal feature PR/CI, exact-head/current-base checks, serialized deployment and hosted verification without repeated approval requests. Preserve source and history; never rerun the one-time migration or acquire pictures automatically.

## Build

Use Node24 and the locked `pwa/package-lock.json`: `npm ci`, `npm test`, `npm run build -- --base=/fishing/`, `npm run verify` from `pwa/`. The production workflow additionally runs both browser scopes and real v1 cutover acceptance. Update source through a feature PR; main source/runtime changes run the complete gate before one Pages deployment. Documentation-only reconciliation does not republish the application.
