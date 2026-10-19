# Fishing Companion v3 — P0-A Stale-Session Release Diagnostics

**Date:** October 19, 2026  
**Status:** Controlled *source-level* failure reproduction implemented and initial core CI passed; physical-device confirmation and final browser acceptance still required.  
**Authority:** [Approved v3 staged implementation plan](Fishing_Companion_v3_Implementation_Plan.md) and [P0 baseline](Fishing_Companion_v3_P0_Baseline_2026-10-19.md).

## Investigation artifacts

- [Draft diagnostic PR #240](https://github.com/ginosega/fishing/pull/240), branch `test/v3-p0-stale-session-20261019`, initial test commit `e96d782f04ed6cd5fd6920538a4b96253489e8fb`.
- [Full Application Release PR validation run #521](https://github.com/ginosega/fishing/actions/runs/39342907392) — check current final status rather than inferring it from this dated document. The core-test + preview-build stage passed at the time of this report.
- Existing test fixture: `pwa/test/offline-integrity.test.mjs`, which compiles the **real current** `pwa/src/sw.mjs` into an isolated in-memory service-worker environment with SHA-verified A/B release manifests, response simulation and CacheStorage fixture.
- Production v2 remains the last verified release `f5eab01e9d5af6101f03a7094de5b565`, source `4fc893d044b72e61fbc36cfd82103af55bc36f97`; PR test validation does **not** deploy or modify production.

## Reproduction cases and controls

| Case | Simulated event | Current v2 result asserted in new core tests | Interpretation |
|---|---|---|---|
| Held old client, worker remains active | Client loads release A, new Pages artifact B replaces A while a previously unrequested A image/Markdown remains linked in DOM | A image/Markdown response HTTP **503**; fresh client can read B | Asset availability across deployment is not guaranteed by the old client context alone |
| Held old client, worker terminated/restarted | A session persists while B replaces A; SW JavaScript memory is lost | Old A resource responses HTTP **503**; new B client succeeds | Volatile `clientContexts` cannot reconstruct old client's coherent release |
| Positive control | The user explicitly prepared and verified a **complete A offline library**, then B deploys and SW restarts | A article and image return HTTP **200** with the original checked bytes, while new B client succeeds | Complete offline A is a valid but **opt-in** fallback, not a safe default solution |

These tests deliberately capture **existing defective behavior**, not acceptance of HTTP 503 as correct. A `test.todo` records the desired regression invariant: old open clients must not lose their selected release's needed image/Markdown bytes when production advances. When a fix is implemented, invert the diagnostics into passing acceptance tests; do not enshrine the 503 responses as expected production behavior.

### Important scope/causality limitation

The tests model a replacement Pages artifact that contains only B, which matches the repository's current single-release build-artifact strategy. They validate the service worker source against this controlled condition. They **do not prove** the exact field incident on the owner's installed Android PWA, nor measure how often browsers terminate a worker or whether release A assets are ever briefly retained by the live CDN.

Two concrete failure mechanisms are evident from current source:

1. `sw.mjs` holds a client's chosen context in `clientContexts = new Map()` with no persistent per-client record; a restarted worker resolves the current online pointer B for an old A tab.
2. For an A-pinned resource missing from current hosting, the worker can only fall back to the explicitly prepared, verified A library; otherwise it responds 503. `ui.mjs` hides failed card images and can display a page error when Markdown fetches fail.

Neither mechanism by itself justifies an unmeasured or unapproved change to offline-library provisioning, security boundaries or production behavior.

## Candidate directions for later implementation review

- **Graceful release transition:** detect a newer verified release and refresh a clean client to B, preserving the current route and protecting unsaved Gear/KB editor state. Prove the entire transition is atomic; do not blend A JSON/UI with B Markdown/media.
- **Bounded old-release preservation:** if needed, retain a deliberately scoped verified A release resource set for outstanding clients. Evaluate cost, cleanup/leases and offline semantics; do not silently download the whole library on ordinary startup.
- **Per-client context durability:** test restart recovery independently; persistence alone cannot recover removed A bytes. Do not assume SW memory is permanent.
- Keep exact SHA/manifest checks, independent completed offline-library generations, and source/byte verification unchanged. Avoid requiring full offline preparation for ordinary online browsing.

## Engineering and approval status

**Completed in this work package:** Updated/current main and open-PR audit; isolated A/B worker test additions; source-level observations of 503 failures and verified A fallback; core Node test/preview-build validation passing. Draft PR is unmerged to avoid triggering a new production build/deployment.

**Still open:** final Chromium/WebKit full workflow result; optional browser/real-device reproductions; quantitative failure timing, fix selection, rollback/acceptance criteria, and a separate explicit v2 maintenance release decision if an independent fix is proposed.

**Guardrail:** `pwa/test/*` changes count as **Full Application Release**, not FISH108 content. Do not merge draft PR #240 or ship any v2 reliability fix solely under this P0 investigative approval. Revalidate head/base/checks and obtain the agreed separate maintenance approval before an application-release merge.
