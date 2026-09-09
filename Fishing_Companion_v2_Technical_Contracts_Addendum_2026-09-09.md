# Fishing Companion v2 — Implementation and Acceptance Addendum

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
