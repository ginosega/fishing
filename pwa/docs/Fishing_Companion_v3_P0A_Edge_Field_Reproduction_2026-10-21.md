# P0-A — Actual Microsoft Edge Stale-Session Reproduction (October 21, 2026)

**Status:** **FIELD REPRODUCED**, confirmed by owner-supplied screenshots and release IDs. **No reliability fix implemented yet.** Screenshot files remain in the owner's Chat conversation, not stored as GitHub binaries. This document records the exact observations and engineering implications without implying that all SW lifecycle scenarios have been reproduced.

## Controlled production transition

- Test environment: Microsoft Edge on Windows, normal browser tabs; original tab held open and unrefreshed with DevTools Network recording and Preserve log enabled. Owner prepared this before the deployment.
- **Release A** (old held tab): `f5eab01e9d5af6101f03a7094de5b565`, source `4fc893d044b72e61fbc36cfd82103af55bc36f97`, 100 Gear / 60 KB / 12 Catches.
- **Release B** (new production): `9f6464d53fe49d1e986bb35d2630c21a`, source `805972165f88f10898807639d8b9591ce0cf3d08`, 100 Gear / 60 KB / 12 Catches, 577 hosted files. Released in [PR #252](https://github.com/ginosega/fishing/pull/252), [main production workflow #531](https://github.com/ginosega/fishing/actions/runs/39624670945) successful, with hosted browser/source identity evidence. Changes: approved deterministic card thumbnails and compatible security patches to DOMPurify, markdown-it, fast-uri and argparse.
- Screen captures supplied October 21, approximately **9:17 AM** local for old-tab failure and **9:20 AM** for fresh-tab control, based on the Windows taskbar in the screenshots. Exact clocks may not match server timestamps.

## Owner's observed failure

1. The **old-tab My Gear root** showed normal headings/category labels but **missing visual icon artwork in all eight category cards**. Previously loaded or root-scoped page-hero images continued to appear.
2. Edge DevTools **Network** showed several old-release `card-icons/*.png` requests with **HTTP 503**, Type `text/plain`, **fulfilled by ServiceWorker**, initiated by `styles.css`. Selected request:
   ```text
   GET https://ginosega.github.io/fishing/releases/f5eab01e9d5af6101f03a7094de5b565/card-icons/gear-rods-reels.png
   HTTP 503 Service Unavailable (from service worker)
   ```
   Headers showed Content-Type `text/plain;charset=UTF-8`. The Console showed multiple analogous GET failures for `gear-lures.png`, `gear-line.png`, `gear-weights.png`, `gear-hooks.png`, `gear-bait.png`, `gear-equipment.png`, and `gear-snaps-swivels.png`.
3. Network also showed **underlying HTTP 404 fetches** for the old-release icon paths, initiated from `sw.js`. This demonstrates missing A-hosted asset responses; the service worker translated verified-release fetch failures into user-visible 503s.
4. Console in the held tab still reported the original A `releaseId` and `sourceRevision`.
5. **Fresh new Edge tab:** the user confirmed the new B release ID, app UI appeared normal, and the old missing-icons defect was **not** present. Its home page showed the notice **“Fishing Companion was updated. Reload when you have finished any edits.”** The user did not report a failure to load the fresh version.

The screenshots establish a *real production old-client asset deletion* failure, consistent with the previously simulated A→B deployment. They **do not prove** whether the service worker was terminated and restarted during this field reproduction, whether every uncached KB Markdown file fails under the same browser conditions, or how often the defect occurs across devices. Preserve these distinctions when designing the fix.

## Source correlation — precise, independently reviewable

- Current `pwa/tools/build.mjs` constructs a deploy artifact with only the current release under `releases/<id>/...`; GitHub Pages replacement means older A `card-icons` need not remain available.
- Current `pwa/src/sw.mjs` loads release-specific contexts and serves verified files with `networkFile`. If an A-pinned file is unavailable online, it attempts a verified **explicitly prepared** offline A library and otherwise returns HTTP **503**. `clientContexts = new Map()` is in-memory; its lifecycle is not durable across worker restart.
- Current `pwa/src/offline.mjs` registers a `controllerchange` listener that **unconditionally** calls `notify('Fishing Companion was updated. Reload when you have finished any edits.')`, without comparing already-loaded page release B against the controlling worker or current verified pointer. Therefore the *fresh B tab update banner* is consistent with a worker control change and **does not itself establish a release mismatch or a failed deployment**. The notice should be made release-aware/accurate during the reliability follow-up.
- The problem was **not caused by thumbnail quality or thumbnail mapping**: the failures are for older CSS-card-icon URLs absent from the new single-release publication. A routine future content deployment could trigger the same condition.

## Proposed engineering path (not yet acceptance or release)

1. Create **regression cases based on actual failed `card-icons`** and on KB Markdown/image paths, with real release A kept open while hosting switches to B. Cover old context retained, new service worker activation/restart, normal online mode, and optionally an existing complete offline A library.
2. Evaluate a **coherent release transition**: on detecting a newer verified release, safely switch an *unchanged/non-editing* old client to B before it tries to fetch removed A-only files; preserve current route; do **not** silently discard unsaved edits or blend release A JS/data with B media. A stale session may alternatively need a **bounded and verified A asset-retention strategy** until it is safe to transition. Do not assume persisting only the A ID can recover missing files.
3. Suppress misleading new-tab `controllerchange` notices by checking whether the loaded page is actually stale before recommending reload; retain appropriate messages for real updates and unsaved-editor protection.
4. Retain all SHA/manifest integrity checks and opted-in complete offline libraries; do not silently fetch the full >180 MiB library on every ordinary visit, change core offline semantics, or remove the old-session guard.
5. Validate separately on isolated PR with controlled A→B browser and service-worker fixtures, exact asset URLs, after-change editor protections, production-root build and release verifier. Any v2 reliability production merge requires **separate explicit owner approval** under the approved v3 implementation plan. Do not turn this report's observations into a deployed fix.

## Current next action

The owner has provided adequate field evidence. **No further screenshots or DevTools tests are required to begin solution design.** The held old tab can be refreshed after preserving needed evidence. Decide/implement the smallest defensible reliability correction in an isolated PR, verify it, and ask for specific production release authorization if deployed independently to v2. Reference [prior controlled P0-A reproduction](Fishing_Companion_v3_P0_Stale_Session_Diagnostics_2026-10-19.md) and [approved plan](Fishing_Companion_v3_Implementation_Plan.md).
