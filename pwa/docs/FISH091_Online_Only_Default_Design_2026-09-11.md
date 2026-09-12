# FISH091 — Online-Only Default / Explicit Offline Library Design

**Document type:** Abbreviated implementation design  
**Status:** APPROVED / IMPLEMENTED / PRODUCTION-VERIFIED  
**Date:** September 11, 2026  
**Requirements:** `FISH091_Online_Only_Default_Requirements_2026-09-11.md`, approved as written including S1–S4  
**Baseline:** current `main` after PR103 (`7c297e75d92ea5c0111df24bc383006d68dafbef`)  
**Approval/outcome:** The user separately approved this design, implementation completed, and FISH091 is DONE / production-verified. See `FISH091_Design_Approval_2026-09-11.md` and `FISH091_Production_Release_2026-09-11.md`.  
**Historical gate note:** This document did not itself authorize implementation while it was awaiting design review; that gate was later satisfied by the separate design approval.

## 1. Design summary

Fishing Companion will separate three responsibilities that the current implementation couples together:

1. **Current online use** — while the network is available, load the current production release and only the resources actually needed for the current session.
2. **Explicit offline preparation** — only the user action **Connection Status → Update offline library** may deliberately enumerate, download, verify, and commit the complete release for offline use.
3. **Offline fallback** — when a full application load occurs without network access, use the selected previously completed and verified offline release. Never mix files from different releases.

The service worker remains the integrity and offline-fallback boundary, but installing or updating the worker will no longer provision a release. Complete offline caches remain all-or-nothing verified generations.

## 2. Current coupling to remove

Current production has two startup couplings that FISH091 will remove:

- `pwa/src/sw.mjs` calls complete-release provisioning from the service-worker `install` event.
- `pwa/src/loader.js` waits for that installation/provisioning path before it proceeds to the production release pointer and application bundle.

The current fetch path also prefers a complete cached release before network content, which can pin online browsing to an older prepared release. FISH091 reverses that priority for online use while preserving complete caches as offline fallbacks.

## 3. Release-selection rules

The implementation will use these deterministic rules.

### 3.1 Full application load while online

- Fetch `release.json` from production with a fresh/no-stale-cache policy.
- Validate the pointer.
- Fetch and hash-validate the referenced manifest.
- Use that current production release for the entire newly loaded application session.
- Do not replace the release inside an already-open session merely because a deployment occurs.

This implements S1: the next normal full load/reload after deployment selects current production, without forced hot replacement of an active session.

### 3.2 Full application load while offline

- Select the durable offline-library pointer described below.
- Confirm that it points to a complete release generation with a valid completion marker, pointer, manifest, and integrity metadata.
- Serve that release consistently for the load.
- If no valid prepared release exists, return a small self-contained **not offline ready** page/state rather than pretending a partial browser cache is sufficient.

### 3.3 Online-to-offline transition inside an already-open session

The application will not silently substitute an older offline release underneath an already-open newer online session. If a requested asset for the active online release cannot be obtained, the request fails closed rather than mixing releases. A full reload while offline then selects the prepared offline fallback as a coherent release.

## 4. Service-worker design

### 4.1 Installation and activation

`install` will no longer call complete-release provisioning. It will perform only the lightweight worker lifecycle needed to activate the new worker. `activate` will claim clients and publish offline-library status; neither event will enumerate or download the full manifest.

This means a production deployment or service-worker update cannot itself trigger complete-library storage.

### 4.2 Remove service-worker coupling to the build release ID

The worker will no longer use a compile-time `__RELEASE_ID__` as the target of offline provisioning. The target for an explicit offline update is always the validated **current production pointer at the time the user requests the update**.

Consequences:

- content-only deployments do not need a different worker merely to point at a new release;
- ordinary online loads discover the current release from `release.json`;
- explicit offline preparation downloads the current release even if the worker code itself has not changed.

`pwa/tools/build.mjs` will therefore stop injecting `__RELEASE_ID__` into the worker bundle unless implementation proves a diagnostic-only use is still needed.

### 4.3 Online request path

For an online full load, the worker keeps a lightweight in-memory **online release context** containing the validated current pointer, manifest, and manifest-entry map. It does not create a complete Cache Storage generation.

- Stable root files such as `index.html` and `loader.js` use current-production network bytes and are checked against the current manifest when controlled by the FISH091 worker.
- `release.json` and its manifest are fetched with stale-cache avoidance and validated.
- Release-scoped files (`releases/<id>/...`) requested by the current session are fetched from production and checked against the validated manifest entry before being returned.
- Ordinary browser/HTTP caching remains allowed; the worker does not deliberately `cache.put()` the complete release during normal browsing.

This preserves release-integrity checks without turning online browsing into offline provisioning.

### 4.4 Explicit complete-library preparation

The worker retains the current staged-generation model, but the operation is entered only through an explicit command from the Connection Status action.

The command flow is:

1. fetch and validate the current production pointer;
2. fetch and validate its manifest;
3. if the selected offline generation already represents that exact release, verify it and report ready;
4. otherwise create a new uniquely named staging generation;
5. download every manifest file, verify byte count and SHA-256, and report progress;
6. write the validated pointer and manifest;
7. write the completion marker only after every file verifies;
8. atomically update the durable offline-library selection pointer to the new complete generation;
9. leave prior complete generations untouched.

A failure deletes only the incomplete staging generation and leaves the prior selected complete release intact.

The new worker will accept both a new `PREPARE` command and the existing `REPAIR` command as an explicit-user-action compatibility alias so an older already-open UI cannot accidentally lose the ability to request a complete update during transition.

### 4.5 Durable offline-library selection pointer

To make fallback selection deterministic, add a small metadata record that identifies the selected complete cache generation and release ID. This metadata is not the library itself and contains no content assets.

- It is updated only after a complete generation has committed successfully.
- If it is absent on first FISH091 use, the worker scans existing valid pre-FISH091 complete generations, selects the same best existing fallback the current implementation would have used, and records that selection without downloading content.
- If it references an invalid or missing generation, the worker scans other valid complete generations and repairs the metadata pointer.

This is a metadata-only compatibility step, not an automatic bulk migration.

### 4.6 Complete caches are not silently mutated during online browsing

Normal online navigation will not opportunistically fill, repair, or promote complete offline generations. If a prepared cache later fails integrity, it is reported as needing preparation/update. The user’s explicit **Update offline library** action creates or repairs a complete generation.

This keeps the meaning of “offline ready” tied to an intentional complete verified operation.

## 5. Loader design

`pwa/src/loader.js` will stop displaying or waiting on “Preparing the complete offline library.”

When service workers are supported, the loader may wait only for a lightweight FISH091-capable worker/controller handshake so subsequent release requests use the verified online/fallback path. The handshake remains compatible with the existing `fishing-companion-v2` protocol and adds a capability flag rather than changing the protocol name, so older loader code can still recognize the new worker during transition.

After the lightweight worker is available, the loader continues to:

- obtain and validate the current `release.json` pointer;
- hash-check the current manifest;
- set `__FISHING_BOOT__`;
- load that release’s stylesheet and application bundle.

No complete-library operation is part of this startup path.

If the network is unavailable and no prepared library exists, loader/worker behavior must produce the approved clear not-offline-ready state rather than the current generic complete-library-repair wording.

## 6. Connection Status / UI design

The existing connection dot/dialog remains the only control surface. No persistent Online/Offline mode switch is added.

The dialog will present **network state** and **offline-library state** as separate facts. Proposed status wording:

- `Online` / `Offline` — existing network state.
- `Offline library not prepared` — no selected complete release.
- `Offline library ready · current` — prepared release matches the current online session release.
- `Offline library ready · update available` — online session is newer than the prepared fallback.
- `Preparing offline library · X/Y files` — explicit preparation in progress.
- `Offline library needs update` — selected library failed integrity validation.

**Update offline library** is enabled only when online and no preparation is already running. The existing **Reload** action remains a guarded full reload; dirty-edit protection is unchanged.

The dot itself continues to represent network connectivity, not offline readiness.

## 7. Transition behavior

### Existing user with a complete library

- FISH091 does not delete or redownload it.
- After the FISH091 worker activates, online full loads use current production.
- The existing complete release remains the offline fallback until the user explicitly updates it.

### Existing open page during the FISH091 deployment

An already-open page is not forcibly reloaded or hot-swapped. The new worker activates without bulk download. The next guarded reload/full load uses current production. This preserves S1 and authoring safety rather than trading them for an automatic mid-session refresh.

### Future content deployments

Because current release selection comes from `release.json` rather than a worker-compiled release ID, a new content release does not require or trigger complete offline preparation. The next online full load uses the new release; the old prepared library remains available offline until explicitly updated.

## 8. Planned implementation surface

Expected runtime/test files, subject to implementation-time validation:

| File | Planned responsibility |
|---|---|
| `pwa/src/sw.mjs` | Remove install-time provisioning; network-current verified request path; explicit preparation; deterministic offline selection; offline fallback. |
| `pwa/src/loader.js` | Remove full-library startup gate; lightweight worker capability handshake; clearer no-offline-library failure. |
| `pwa/src/offline.mjs` | Explicit `PREPARE` flow, status/currentness handling, online-only update enablement, unchanged dirty reload guard. |
| `pwa/src/ui.mjs` | Distinguish network state from offline-library readiness/currentness. |
| `pwa/tools/build.mjs` | Remove unnecessary worker release-ID injection; update initial offline-status wording if needed. |
| `pwa/test/browser.spec.mjs` | Replace automatic-ready assumptions with approved A01–A11 scenarios and transition coverage. |
| `pwa/tools/verify-hosted.mjs` | Verify hosted online-only default first, then explicitly prepare and verify complete offline operation. |
| `pwa/test/core.test.mjs` / verification helpers | Only source-derived assertions needed to enforce the new lifecycle/integrity contract. |

Canonical Gear/KB/Catch records and authored Markdown are not part of FISH091.

## 9. Acceptance coverage mapping

Implementation is not complete until automated coverage demonstrates the approved requirements, including:

- **A01:** clean online first visit loads the app and creates no complete-library marker/generation.
- **A02:** clean online deep link loads without complete preparation.
- **A03:** no prepared library + offline full load gives a clear not-ready state.
- **A04:** explicit Update downloads, verifies, and atomically selects the current complete release.
- **A05:** prepared release survives real offline reload/navigation in Chromium and WebKit strategy already used by the project.
- **A06:** older prepared release + newer production uses newer production online without preparing it.
- **A07:** the same device offline-reloads into the older prepared fallback.
- **A08:** failed/corrupt explicit update retains the prior selected complete release.
- **A09:** worker/deployment update does not request the complete manifest asset set automatically.
- **A10:** ordinary browsing may cache visited resources but produces no complete-library marker.
- **A11:** Chromium/WebKit regressions retain dirty-edit, release integrity, legacy-worker transition, navigation, image, authoring, and scope protections.
- **A12:** hosted verifier first proves online-only behavior, then intentionally runs Update offline library and proves complete byte/integrity/offline behavior against the deployed site.

The production pipeline’s exact-current-main and hosted-byte verification remain unchanged.

## 10. Failure rules

- Never mix assets from different releases in one selected full load.
- Never mark a partial generation complete.
- Never replace the selected offline fallback until the new generation is complete and verified.
- Never auto-download a complete generation because of install, activate, deployment, navigation, or ordinary release checking.
- Never force-reload a dirty/open editing session merely because newer production exists.
- If the network disappears during a current online session and a needed current-release asset is unavailable, fail that request rather than substitute an older release underneath the session; a full offline reload selects the prepared fallback.

## 11. Explicit non-goals

No FISH077/P2 features are introduced: no direct save, auth, uploads, queued/offline editing, sync, Catch authoring, accounts, backend, selective offline packs, automatic background refresh, or major Connection Status redesign.

No new canonical data model, release format, or per-record caching policy is proposed.

## 12. Design signoff gate — satisfied

The user explicitly approved this design in `FISH091_Design_Approval_2026-09-11.md`, authorizing implementation through the normal FISH091 feature PR, full core/browser acceptance, production deployment, hosted verification, and project-state reconciliation.

Implementation, deployment, and hosted verification were subsequently completed; the authoritative release record is `FISH091_Production_Release_2026-09-11.md`.
