# Fishing Companion v2 — Implementation and Acceptance Addendum

## Icon filename cleanup and current state — September 11, 2026

FISH-TODO-086 is DONE through [PR91](https://github.com/ginosega/fishing/pull/91). Current production source `afd7afc9ee91fb3dc81a15635e14ec932bda2b1b`, release `11789b7bace383d161add0ac7d313579`, passed [production run 34608018650](https://github.com/ginosega/fishing/actions/runs/34608018650): 21 core tests, 24 preview-scope and 26 production-scope Chromium/WebKit scenarios, archived-v1 transition, exact-current-main Pages deployment, all 205 hosted-file comparisons and complete hosted browser verification.

The approved transparent PNG is now `pwa/icon.png`; its bytes are unchanged (SHA-256 `e46bcb2260f550380c4df2a42d512bbcd19b24dbf9e987815a0070afd350b922`). The obsolete `pwa/icon.svg` and former `pwa/revised-icon.png` paths are removed from current source. New builds use `icon.png` for the manifest, favicon and Apple touch icon. Historical filenames remain accepted only by release validation and compatibility tests so retained cached releases stay readable. Git history retains both removed paths. Canonical Gear/KB/Catch files are unchanged.

FISH084, FISH085 and FISH086 are complete; PR89–PR91 are merged and no release or icon work remains pending. P2/FISH077 remains deferred, all unrelated backlog is retained, and next unused task ID is FISH-TODO-087. Continue in Chat using actual latest main. This documentation reconciliation does not redeploy.

## Historical Chat handoff audit — before icon filename cleanup

Rechecked latest main `36d894439632b45aa358c7a93a38b19dff822875` and successful production run `34566907478`. Later commits are documentation only; source `240dbfa67a1810ef51fde24f7bd0fb1d1c867bcf` and release `c15f12f49c4162706fb14eb2791e3204` remain the verified production pair. No release is pending. Current handoff, scope and Chat-default policy: [Context](../../Fishing_Context.md) and [bootstrap](../../Fishing_New_Chat_Bootstrap_Prompt.md).

## PR89/PR90 production closeout — historical release evidence

FISH-TODO-084 and FISH-TODO-085 are DONE. The eight UI/authoring refinements from PR89 and the user-authorized icon transparency/verifier correction in [PR90](https://github.com/ginosega/fishing/pull/90) are live at production source `240dbfa67a1810ef51fde24f7bd0fb1d1c867bcf`, release `c15f12f49c4162706fb14eb2791e3204`. [Production run 34566907478](https://github.com/ginosega/fishing/actions/runs/34566907478) is green: 20 core tests, 24 preview-scope and 26 production-scope Chromium/WebKit scenarios, archived-v1 worker/store transition, exact-current-main Pages deployment, all 205 hosted-file comparisons and the complete hosted browser verifier passed. PR90 CI [run 34566584530](https://github.com/ginosega/fishing/actions/runs/34566584530) also passed.

Historical PR89 evidence: source `1f3f6df97390db186303148dcb5fa62ad0ba90e9`, release `7572c94504e4482c9987828b95a653f6`, [run 34565111477](https://github.com/ginosega/fishing/actions/runs/34565111477) published successfully and compared all 205 hosted files, but its browser verifier failed because Yellow Perch matched both the page h1 and a Catch History h2. That historical run remains failed; PR90 repairs the selector with `level:1` and completes a new fully verified release.

Historical PR89 direct cloud-browser follow-up verified the published home/KB/Catch wording, normal-weight dates below Species, page search, exact runtime icon references, Yellow Perch page/image viewer, Offline Ready for 203 files, real clipboard instruction plus valid JSON, Gear/KB Add Exit to the originating roots and KB Edit Exit to its original item without a warning. The original hosted verifier had already completed actual offline reload before reaching the ambiguous selector. No physical-device inspection or browser-originated repository writes are claimed.

The user explicitly authorized the follow-up PR/release and clarified: “The white border surrounding the green button image should be transparent.” This supersedes the earlier one-PR limit for this correction. No further icon transfer or approval is pending.

The PR90 runtime used the transparent-background edit of `pwa/revised-icon.png` (renamed without byte changes to `pwa/icon.png` in PR91) (1,208,529 bytes, 1254 × 1254 RGBA PNG; SHA-256 `e46bcb2260f550380c4df2a42d512bbcd19b24dbf9e987815a0070afd350b922`). The built-in image editor was instructed to remove only the exterior white background and preserve the green button and fish/hook artwork. Alpha inspection and browser regressions verify transparent exterior pixels, retained center opacity, source-derived dimensions and exact served bytes. The original opaque upload remains recoverable in PR89 history (SHA-256 `89a81bac58c460cdb6ccc509b6b240ac84937b619990c6ac9b187ddc4b75980c`). Favicon, manifest and Apple touch icon all use the corrected PNG; offline integrity includes it and older SVG-icon releases remain readable for recovery.

Catch card dates appear directly below Species at regular weight, including derived Catch History cards. Existing search inputs use `Search [page title]`; no new search inputs were added. Knowledge Base card/subtitle reads `Fishing reference library`; Catch Log home-card subtext and list-page heading read `Recorded catches`. Back buttons retain only `Back`.

After a successful Copy Changes, Exit returns edits to their original item and adds to their originating Gear/KB root or category. Exit alone bypasses the unsaved-changes warning. Further edits invalidate the prepared package and remove Exit; ordinary Back, Cancel, navigation and reload remain guarded. Copy text contains an explicit repository implementation/deployment instruction above valid `fishing-companion-change-v2` JSON; manual-copy fallback includes that same instruction. Preparing/copying is not saving. KB Notes remain required; its schema and viewer behavior are unchanged.

The following earlier release/audit sections are historical evidence and do not override this closeout.

> Repository layout: production source/tests/contracts now live under `pwa/`; this document is retained PWA reference. Old `v2/`, v1 `pwa/`, History and Topics paths in dated evidence refer to the [pre-cleanup snapshot](https://github.com/ginosega/fishing/blob/edca2a3f04fc8c32dec65b9330d43944be1a561c/). Current instructions: [PWA README](../README.md).

## Production closeout — September10, 2026

V2 is published at [Fishing Companion](https://ginosega.github.io/fishing/). Production revision `ceef1df0dd8b204e7aa59c63e95a0d75346f4a92`, release `7ff6f62d921d5e86e0d97ae89b361120`, passed [publication and hosted verification](https://github.com/ginosega/fishing/actions/runs/34441600093). PR64 is merged. The user authorized production and waived another preview review; all seven previously required missing pictures are explicitly deferred. The affected records remain available without pictures. No acceptance or media approval blocks this release.

Validation: 20 core tests, 20 preview-scope and 22 production-scope Chromium/WebKit scenarios, including the actual archived-v1 worker transition and retained browser stores. All 197 hosted files match the verified production build; live navigation, image viewer, offline reload, counts and absent-picture behavior pass. These are automated browser and direct hosted checks, not physical-device inspection.

The sole active pipeline is `.github/workflows/fishing-production.yml`. V1 and the earlier preview are historical; use the production root. V1 sources and exact rollback ZIPs remain in Git. Old browser stores are retained. P2 remains deferred. This authorized Work phase is complete; continue in Chat.

**Historical evidence follows.** Earlier pending gates below are superseded; see the [production release](Fishing_v2_Production_Release_2026-09-10.md).



**Later checkpoint:** [Review corrections and production authorization](Fishing_v2_Review_Release_2026-09-09.md). The evidence below is historical. The corrected implementation is verified but not published; the user has authorized production and waived another preview review. Seven required pictures still block the production build.

**Date:** September 9, 2026. The original Technical Contracts remain the approved design. P1 engineering and isolated preview publication are complete; user review and separate production cutover remain pending. Exact release and recovery evidence: [preview release record](Fishing_v2_Preview_Release_2026-09-09.md).

The verified implementation is `5da786ef121d7cfa39f98a8c69f3b6cf09f8eca6` on `feature/v2-implementation-20260908`, draft PR 64 unmerged. Migration `6615ae7296e48d90dceab303b6b5a1fbc041ab80` was not rerun. P1 retains three independent domains, Node 24 locked dependencies, schema/semantic validation, sanitized Markdown, source-aware Gear/KB Prepare/Copy handoffs and full-library offline reading. Catch is read-only. P2 remains deferred.

## Repairs and guarantees

- Viewer zoom controls expose accessible names through the shared button helper; page-heading selectors uniquely identify navigation targets. Absent footer messages are omitted rather than rendered as literal null text; readiness coverage checks this.
- Dirty editor navigation asks once, protects direct hash changes, and blocks release reload until discard is confirmed.
- Failed article loads expose Retry; selecting the same route can retry rendering. Cached corrupt bytes are rejected before serving and repair accepts only verified bytes.
- Offline update commands target the active worker. Reload remains disabled while the update command is incomplete, including the interval between a Ready broadcast and its command response.
- Each install/repair writes a unique cache generation. Its completion marker is written only after every release asset verifies. Failures remove only the uncommitted generation; older complete releases and pinned tabs remain usable. No copying over or deleting the last complete cache before replacement.
- Offline Ready revalidates current cached bytes; missing/corrupt content reports Incomplete until verified repair. Release pointer, manifest, code and content remain pinned together.
- The loader waits for the preview worker's exact script URL, even when a root v1 worker initially controls the page. Preview registration scope is `/fishing/v2-preview/`; v1 stores and its root worker remain intact.

## Meaningful acceptance

Run `34376934726` passes 19 core tests and all 16 browser scenarios (eight each in Chromium and WebKit). Four core fault-injection tests exercise real bundled service-worker code with missing/corrupt responses, storage failures during asset writes and final-marker publication, failed same-release repair, last-known-good recovery and immutable older bytes. Browser tests exercise full-manifest hash/byte verification, offline reload, navigation/filtering/stable links/Catch History, image viewer, Gear and KB handoffs, corrupt/missing upgrades, repair, dirty release reload, mobile viewport and existing v1 scope isolation.

Chromium receives browser offline emulation plus a disconnected test origin. WebKit's emulated offline reload produced an internal automation-engine failure in run `34372041635`; WebKit instead uses an origin that destroys connections. An independent fetch must fail, and the same content/integrity/offline-reload assertions remain. This is real network unavailability, not a weakened reload assertion. CI WebKit and mobile viewport checks are automated representative coverage, not a claim of physical Safari/iOS/device inspection. Browser storage remains best effort and eviction can invalidate readiness; no persistence guarantee beyond verified available bytes is claimed.

The combined-publication workflow repeats the full gate at the exact feature revision and verifies every hosted v1 file before publishing. It saves authenticated recovery ZIPs in Git before deployment, preserves the v1 root unchanged, adds only `v2-preview/`, then compares all hosted HTML/pointer/manifest/code/content/image bytes and runs actual-hosted browser checks. A production cutover is a separate user gate.

Seven required media exceptions plus one optional exception are enforced. Preview uses the approved pending-media build; it is not evidence that required-media acceptance is complete. Temporary migration/workspace workflows remain unused historical scaffolding and should be consolidated into the normal production pipeline during authorized cutover, without dropping evidence or tests. Do not run a standalone v1 Pages upload while preserving this combined preview.
