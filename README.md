# Fishing

## Chat handoff audit — September 11, 2026

Restored and audited GitHub main `36d894439632b45aa358c7a93a38b19dff822875` before this documentation-only handoff. Its changes after production source `240dbfa67a1810ef51fde24f7bd0fb1d1c867bcf` are documentation only; the deployed release remains `c15f12f49c4162706fb14eb2791e3204`. Production run `34566907478` is successful; PR89 and PR90 are merged, no PRs are open and no release jobs are queued or running at this audit. This handoff does not require another build or deployment.

FISH084 and FISH085 are DONE; no UI, icon-transfer, verifier or production-acceptance work remains from this chat. FISH077/P2 stays DEFERRED. All unrelated TODO rows and purchase uncertainties are retained; next unused task ID is FISH-TODO-086. Resume by reading actual latest main, then respond to the user's next requested work rather than restarting a completed release. The bootstrap, Context, TODO, Decision Log, README and affected PWA records were cross-checked for release identity, icon state, completed tasks, deferred scope and Chat-default instructions.

## Current production state — September 11, 2026

Fishing Companion production source `240dbfa67a1810ef51fde24f7bd0fb1d1c867bcf` is published and fully verified in [production run 34566907478](https://github.com/ginosega/fishing/actions/runs/34566907478); release `c15f12f49c4162706fb14eb2791e3204` contains 205 hosted files and passed production navigation, image-viewer, complete-offline-reload and record-count checks. Routine site-authored updates include PR75/PR76 (Pflueger spincast rod/reel), PR77 (Tsuridamashii snap-swivels picture), PR79 (Rapala Original Floating, Mack's Pee Wee Hoochie, River2Sea Whopper Plopper 60 and Yellow Perch pictures plus Rebel Pop-R replacement), PR81 (Kokanee/Largemouth/Smallmouth Species updates), and PR84 (Popper and Whopper Plopper Gear-Guide pictures). All seven originally deferred required pictures have now been supplied and published. Generic inline-spinner remains optional. The cleanup and initial-release sections below are dated historical evidence; P2 remains deferred.

## FISH084/FISH085 production closeout — September 11, 2026

FISH-TODO-084 and FISH-TODO-085 are DONE. The eight UI/authoring refinements from PR89 and the user-authorized icon transparency/verifier correction in [PR90](https://github.com/ginosega/fishing/pull/90) are live at production source `240dbfa67a1810ef51fde24f7bd0fb1d1c867bcf`, release `c15f12f49c4162706fb14eb2791e3204`. [Production run 34566907478](https://github.com/ginosega/fishing/actions/runs/34566907478) is green: 20 core tests, 24 preview-scope and 26 production-scope Chromium/WebKit scenarios, archived-v1 worker/store transition, exact-current-main Pages deployment, all 205 hosted-file comparisons and the complete hosted browser verifier passed. PR90 CI [run 34566584530](https://github.com/ginosega/fishing/actions/runs/34566584530) also passed.

Historical PR89 evidence: source `1f3f6df97390db186303148dcb5fa62ad0ba90e9`, release `7572c94504e4482c9987828b95a653f6`, [run 34565111477](https://github.com/ginosega/fishing/actions/runs/34565111477) published successfully and compared all 205 hosted files, but its browser verifier failed because Yellow Perch matched both the page h1 and a Catch History h2. That historical run remains failed; PR90 repairs the selector with `level:1` and completes a new fully verified release.

Historical PR89 direct cloud-browser follow-up verified the published home/KB/Catch wording, normal-weight dates below Species, page search, exact runtime icon references, Yellow Perch page/image viewer, Offline Ready for 203 files, real clipboard instruction plus valid JSON, Gear/KB Add Exit to the originating roots and KB Edit Exit to its original item without a warning. The original hosted verifier had already completed actual offline reload before reaching the ambiguous selector. No physical-device inspection or browser-originated repository writes are claimed.

The user explicitly authorized the follow-up PR/release and clarified: “The white border surrounding the green button image should be transparent.” This supersedes the earlier one-PR limit for this correction. No further icon transfer or approval is pending.

The runtime uses the transparent-background edit of `pwa/revised-icon.png` (1,208,529 bytes, 1254 × 1254 RGBA PNG; SHA-256 `e46bcb2260f550380c4df2a42d512bbcd19b24dbf9e987815a0070afd350b922`). The built-in image editor was instructed to remove only the exterior white background and preserve the green button and fish/hook artwork. Alpha inspection and browser regressions verify transparent exterior pixels, retained center opacity, source-derived dimensions and exact served bytes. The original opaque upload remains recoverable in PR89 history (SHA-256 `89a81bac58c460cdb6ccc509b6b240ac84937b619990c6ac9b187ddc4b75980c`). Favicon, manifest and Apple touch icon all use the corrected PNG; offline integrity includes it and older SVG-icon releases remain readable for recovery.

Catch card dates appear directly below Species at regular weight, including derived Catch History cards. Existing search inputs use `Search [page title]`; no new search inputs were added. Knowledge Base card/subtitle reads `Fishing reference library`; Catch Log home-card subtext and list-page heading read `Recorded catches`. Back buttons retain only `Back`.

After a successful Copy Changes, Exit returns edits to their original item and adds to their originating Gear/KB root or category. Exit alone bypasses the unsaved-changes warning. Further edits invalidate the prepared package and remove Exit; ordinary Back, Cancel, navigation and reload remain guarded. Copy text contains an explicit repository implementation/deployment instruction above valid `fishing-companion-change-v2` JSON; manual-copy fallback includes that same instruction. Preparing/copying is not saving. KB Notes remain required; its schema and viewer behavior are unchanged.

## Repository cleanup — September 10, 2026

The user approved the new site's appearance and behavior, then requested repository cleanup. Production source, tests, contracts and migration evidence have moved from root `v2/` into `pwa/`; the preserved icon was the only build dependency on the former v1 `pwa/`. Retained v2 specifications/release references are in `pwa/docs/`. Root `History/`, `Topics/`, obsolete registries/handoffs and v1 runtime/assets/per-item helpers are removed from main, recoverable at `checkpoint/pre-repo-cleanup-20260910` (`edca2a3f04fc8c32dec65b9330d43944be1a561c`). Canonical Gear/KB/Catch bytes, including the newer unreferenced Pflueger image upload, are unchanged. No image adoption or migration rerun.

Add/Edit creates copyable source-change packages, not one-off helper/release files. Routine changes must update canonical files and existing project records; reusable code/tests stay under `pwa/`, and significant release references belong under `pwa/docs/`. No new per-item scripts/release records in either root. Cleanup PR73 is merged and published. [Production run 34490532301](https://github.com/ginosega/fishing/actions/runs/34490532301) passes all 20 core tests, 42 browser scenarios across the two scopes, and all 197 hosted-file comparisons. Cleanup production source `6a64be686cf751720884469b98f2fcc4df94ec6a`, release `d63599a99498d62fdfb1fc22c04643c2`. See [cleanup/release evidence](pwa/docs/Repository_Cleanup_2026-09-10.md).

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
- [UI refinement scope and production closeout](pwa/docs/Fishing_UI_Refinement_Approved_Scope_2026-09-10.md) — FISH084/FISH085 implementation and successful production verification.
- [Approved Baseline](pwa/docs/Fishing_Companion_v2_Approved_Baseline.md), [Requirements Inventory](pwa/docs/Fishing_Companion_v2_Requirements_Inventory.md) and [Design Review](pwa/docs/Fishing_Companion_v2_Design_Review.md) — original user responses remain authoritative.
- [Source Audit](pwa/docs/Fishing_Companion_v2_Source_Audit.md) and [addendum](pwa/docs/Fishing_Companion_v2_Source_Audit_Addendum_2026-09-09.md); [Technical Contracts](pwa/docs/Fishing_Companion_v2_Technical_Contracts.md), [addendum](pwa/docs/Fishing_Companion_v2_Technical_Contracts_Addendum_2026-09-09.md) and [schema](pwa/contracts/schema.json).
- [Verbatim review feedback](pwa/docs/Fishing_v2_Review_Feedback_2026-09-09.md); [review checkpoint](pwa/docs/Fishing_v2_Review_Release_2026-09-09.md), [original preview release](pwa/docs/Fishing_v2_Preview_Release_2026-09-09.md) and [Work Handoff](pwa/docs/Fishing_v2_Work_Handoff_2026-09-09.md) are dated historical evidence.

## Scope and operation

Three independent Gear/KB/Catch domains share identity, Markdown, picture and validation conventions. P1 includes read-only Catch Log, full-library offline reading and minimal source-aware Gear/KB Prepare Changes → Copy Changes handoffs. Direct Save, authentication, uploads, offline editing/outbox/sync and Catch browser authoring remain deferred. No Planner, sessions, paired-setup relationships, speculative ownership/media graph, accounts or multi-user expansion.

Chat is the permanent default. Work requires a specific approved execution need; complexity, duration, research or file volume alone are not reasons to switch. Authorized work proceeds through meaningful tests, normal feature PR/CI, exact-head/current-base checks, serialized deployment and hosted verification without repeated approval requests. Preserve source and history; never rerun the one-time migration or acquire pictures automatically.

## Build

Use Node24 and the locked `pwa/package-lock.json`: `npm ci`, `npm test`, `npm run build -- --base=/fishing/`, `npm run verify` from `pwa/`. The production workflow additionally runs both browser scopes and real v1 cutover acceptance. Update source through a feature PR; main source/runtime changes run the complete gate before one Pages deployment. Documentation-only reconciliation does not republish the application.
