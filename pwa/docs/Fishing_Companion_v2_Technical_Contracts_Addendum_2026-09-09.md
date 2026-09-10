# Fishing Companion v2 — Implementation and Acceptance Addendum

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
