# Fishing

## Current production state — September 11, 2026

Fishing Companion production source `1f3f6df97390db186303148dcb5fa62ad0ba90e9` is published; see the verifier caveat below for [production run 34565111477](https://github.com/ginosega/fishing/actions/runs/34565111477); release `7572c94504e4482c9987828b95a653f6` contains 205 hosted files and passed production navigation, image-viewer, complete-offline-reload and record-count checks. Routine site-authored updates include PR75/PR76 (Pflueger spincast rod/reel), PR77 (Tsuridamashii snap-swivels picture), PR79 (Rapala Original Floating, Mack's Pee Wee Hoochie, River2Sea Whopper Plopper 60 and Yellow Perch pictures plus Rebel Pop-R replacement), PR81 (Kokanee/Largemouth/Smallmouth Species updates), and PR84 (Popper and Whopper Plopper Gear-Guide pictures). All seven originally deferred required pictures have now been supplied and published. Generic inline-spinner remains optional. The cleanup and initial-release sections below are dated historical evidence; P2 remains deferred.

## FISH084 production closeout — September 11, 2026

FISH-TODO-084's eight UI/authoring changes are implemented and live through the single PR89 production release: source `1f3f6df97390db186303148dcb5fa62ad0ba90e9`, release `7572c94504e4482c9987828b95a653f6`. [Production run 34565111477](https://github.com/ginosega/fishing/actions/runs/34565111477) passed all 20 core tests, 24 preview-scope and 26 production-scope Chromium/WebKit scenarios, the archived-v1 transition, Pages publication and exact comparisons of all 205 hosted files. Its subsequent hosted browser verifier failed on an ambiguous Yellow Perch heading: the page h1 and the new Catch-card h2 now share that text. The workflow is NOT green.

Direct cloud-browser follow-up verified the published home/KB/Catch wording, normal-weight dates below Species, page search, exact runtime icon references, Yellow Perch page/image viewer, Offline Ready for 203 files, real clipboard instruction plus valid JSON, Gear/KB Add Exit to the originating roots and KB Edit Exit to its original item without a warning. The original hosted verifier had already completed actual offline reload before reaching the ambiguous selector. No physical-device inspection or browser-originated repository writes are claimed.

FISH-TODO-085 tracks the permanent verifier-only selector correction (`level:1` for the Yellow Perch page-heading locator) and automated verification closeout. The user's one-PR/one-release instruction prevents silently adding a follow-up PR/release; that exception requires user direction. No second release was made.

The runtime uses the exact user-uploaded `pwa/revised-icon.png` (1,243,451 bytes, 1254 × 1254 PNG; SHA-256 `89a81bac58c460cdb6ccc509b6b240ac84937b619990c6ac9b187ddc4b75980c`). The older documentation reference is historical and was not substituted. The favicon, manifest and Apple touch icon use this image; complete offline release integrity includes it and older SVG-icon releases remain readable for recovery.

Catch card dates appear directly below Species at regular weight, including derived Catch History cards. Existing search inputs use `Search [page title]`; no new search inputs were added. Knowledge Base card/subtitle reads `Fishing reference library`; Catch Log home-card subtext and list-page heading read `Recorded catches`. Back buttons retain only `Back`.

After a successful Copy Changes, Exit returns edits to their original item and adds to their originating Gear/KB root or category. Exit alone bypasses the unsaved-changes warning. Further edits invalidate the prepared package and remove Exit; ordinary Back, Cancel, navigation and reload remain guarded. Copy text contains an explicit repository implementation/deployment instruction above valid `fishing-companion-change-v2` JSON; manual-copy fallback includes that same instruction. Preparing/copying is not saving. KB Notes remain required; its schema and viewer behavior are unchanged.

## Repository cleanup — September 10, 2026

The user approved the new site's appearance and behavior, then requested repository cleanup. Production source, tests, contracts and migration evidence have moved from root `v2/` into `pwa/`; the preserved icon was the only build dependency on the former v1 `pwa/`. Retained v2 specifications/release references are in `pwa/docs/`. Root `History/`, `Topics/`, obsolete registries/handoffs and v1 runtime/assets/per-item helpers are removed from main, recoverable at `checkpoint/pre-repo-cleanup-20260910` (`edca2a3f04fc8c32dec65b9330d43944be1a561c`). Canonical Gear/KB/Catch bytes, including the newer unreferenced Pflueger image upload, are unchanged. No image adoption or migration rerun.

Add/Edit creates copyable source-change packages, not one-off helper/release files. Routine changes must update canonical files and existing project records; reusable code/tests stay under `pwa/`, and significant release references belong under `pwa/docs/`. No new per-item scripts/release records in either root. Cleanup PR73 is merged and published. [Production run 34490532301](https://github.com/ginosega/fishing/actions/runs/34490532301) passes all 20 core tests, 42 browser scenarios across the two scopes, and all 197 hosted-file comparisons. Current production source `6a64be686cf751720884469b98f2fcc4df94ec6a`, release `d63599a99498d62fdfb1fc22c04643c2`. See [cleanup/release evidence](pwa/docs/Repository_Cleanup_2026-09-10.md).

## Historical initial v2 production closeout

The following paragraphs are dated historical evidence from the initial v2 cutover and do not override the current production state or pending-work section above.

V2 is published at [Fishing Companion](https://ginosega.github.io/fishing/). Production revision `6a64be686cf751720884469b98f2fcc4df94ec6a`, release `d63599a99498d62fdfb1fc22c04643c2`, passed [publication and hosted verification](https://github.com/ginosega/fishing/actions/runs/34490532301). PR64 is merged. The user authorized production and waived another preview review; all seven previously required missing pictures are explicitly deferred. The affected records remain available without pictures. No acceptance or media approval blocks this release.

Validation: 20 core tests, 20 preview-scope and 22 production-scope Chromium/WebKit scenarios, including the actual archived-v1 worker transition and retained browser stores. All 197 hosted files match the verified production build; live navigation, image viewer, offline reload, counts and absent-picture behavior pass. These are automated browser and direct hosted checks, not physical-device inspection.

The sole active pipeline is `.github/workflows/fishing-production.yml`. V1 and the earlier preview are historical; use the production root. V1 sources are archived in Git history and the pre-cleanup checkpoint; exact rollback ZIPs remain in Git. Old browser stores are retained. P2 remains deferred. This authorized Work phase is complete; continue in Chat.

## Project authority

GitHub `ginosega/fishing` is the durable source of truth. Restore actual latest main before acting and preserve newer user changes. Current domain sources are `Gear/gear.json`, `KB/kb.json`, `Catches/catches.json`, their authored Markdown and local image bytes. Application source and tests live in `pwa/`; retained specifications and release evidence live in `pwa/docs/`. Historical root registries, Topics, History and v1 sources were removed from main and remain in the pre-cleanup Git checkpoint.

- [Context](Fishing_Context.md), [TODO](Fishing_TODO.md) and [Decision Log](Fishing_Decision_Log.md).
- [New Chat bootstrap](Fishing_New_Chat_Bootstrap_Prompt.md) — copy the full contents into a Chat conversation.
- [Production release and recovery](pwa/docs/Fishing_v2_Production_Release_2026-09-10.md).
- [UI refinement scope and production closeout](pwa/docs/Fishing_UI_Refinement_Approved_Scope_2026-09-10.md) — FISH084 implementation and FISH085 verifier caveat.
- [Approved Baseline](pwa/docs/Fishing_Companion_v2_Approved_Baseline.md), [Requirements Inventory](pwa/docs/Fishing_Companion_v2_Requirements_Inventory.md) and [Design Review](pwa/docs/Fishing_Companion_v2_Design_Review.md) — original user responses remain authoritative.
- [Source Audit](pwa/docs/Fishing_Companion_v2_Source_Audit.md) and [addendum](pwa/docs/Fishing_Companion_v2_Source_Audit_Addendum_2026-09-09.md); [Technical Contracts](pwa/docs/Fishing_Companion_v2_Technical_Contracts.md), [addendum](pwa/docs/Fishing_Companion_v2_Technical_Contracts_Addendum_2026-09-09.md) and [schema](pwa/contracts/schema.json).
- [Verbatim review feedback](pwa/docs/Fishing_v2_Review_Feedback_2026-09-09.md); [review checkpoint](pwa/docs/Fishing_v2_Review_Release_2026-09-09.md), [original preview release](pwa/docs/Fishing_v2_Preview_Release_2026-09-09.md) and [Work Handoff](pwa/docs/Fishing_v2_Work_Handoff_2026-09-09.md) are dated historical evidence.

## Scope and operation

Three independent Gear/KB/Catch domains share identity, Markdown, picture and validation conventions. P1 includes read-only Catch Log, full-library offline reading and minimal source-aware Gear/KB Prepare Changes → Copy Changes handoffs. Direct Save, authentication, uploads, offline editing/outbox/sync and Catch browser authoring remain deferred. No Planner, sessions, paired-setup relationships, speculative ownership/media graph, accounts or multi-user expansion.

Chat is the permanent default. Work requires a specific approved execution need; complexity, duration, research or file volume alone are not reasons to switch. Authorized work proceeds through meaningful tests, normal feature PR/CI, exact-head/current-base checks, serialized deployment and hosted verification without repeated approval requests. Preserve source and history; never rerun the one-time migration or acquire pictures automatically.

## Build

Use Node24 and the locked `pwa/package-lock.json`: `npm ci`, `npm test`, `npm run build -- --base=/fishing/`, `npm run verify` from `pwa/`. The production workflow additionally runs both browser scopes and real v1 cutover acceptance. Update source through a feature PR; main source/runtime changes run the complete gate before one Pages deployment. Documentation-only reconciliation does not republish the application.
