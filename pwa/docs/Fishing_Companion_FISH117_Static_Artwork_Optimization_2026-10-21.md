# FISH117 — Static category and scenic header image optimization

**Date:** October 21, 2026  
**Status:** **Owner-authorized, implemented, Full Application released and hosted-verified.**  
**Production:** https://ginosega.github.io/fishing/

## Scope and owner decision

The owner approved immediate v2 production deployment of optimized static images used on the Home, My Gear and Knowledge Base root pages. The owner explicitly waived a dedicated visual review, a separate mobile preview and additional image-performance measurements: they will inspect appearance/performance directly on the published website. Mandatory application/offline/integrity validation and hosted verification remained enforced.

- **16 card icons:** source PNGs are 1254 × 1254 each, displayed at 45 × 45 CSS px. Published build creates 128 × 128 WebP display derivatives, quality 82, preserving actual transparent pixels.
- **2 scenic page headers:** original PNGs 1536 × 512 (standard) and 3072 × 512 (wide). Published build creates WebP targets 1440 and 2560 pixels wide respectively, keeping original aspect ratios and responsive CSS.
- Every original `pwa/assets/card-icons/*.png` and `pwa/assets/page-hero/*.png` remains **unaltered** as canonical source, not redundantly shipped in production/offline packages. No Gear/KB record photos, app launcher/maskable icon, layouts, hosting provider, service-worker release retention or dependency changes.
- Generated files and their SHA256/byte counts participate in the normal immutable release manifest and content-addressed release ID.

## Actual build sizes

[Run #543 core acceptance logs](https://github.com/ginosega/fishing/actions/runs/39690549053) report exactly **18 image files**, **17,090,051 original source bytes** and **253,660 generated WebP bytes**, removing **16,836,391 bytes (98.5%)** from the published static-image subset.

This is reduction in **image asset bytes**, not an observed 98.5% page-load speedup. Browser caching, visited routes and network conditions affect actual loading. The complete offline library contains all verified release files, so this change also removes the need to store full-size static original PNGs offline.

## Release sequence and validation

1. [Nonproduction image byte audit, run #1](https://github.com/ginosega/fishing/actions/runs/39680853657) measured original dimensions and WebP outputs. Temporary audit PR #257 closed **without merge**.
2. [PR #258](https://github.com/ginosega/fishing/pull/258) introduced deterministic generation and original-source preservation, CSS WebP URLs, updated legacy tests, and new deterministic/alpha/dimension tests. Exact-head [Full Application validation #540](https://github.com/ginosega/fishing/actions/runs/39683983848) passed. Merged as `a5d908f4d0d700d53aecde19ab680ea26c49db8d`.
3. Main workflow [#541](https://github.com/ginosega/fishing/actions/runs/39685562142) failed at WebKit's **second** offline reload fixture after terminating an HTTP socket. Two failed-job attempts showed the same transient Markdown request error while other core/image/browser cases succeeded; **no deployment occurred**.
4. [PR #259](https://github.com/ginosega/fishing/pull/259) isolated the correction to `pwa/test/browser.spec.mjs`. It keeps the first true-disconnect test and Chromium offline checks; for just the **second** WebKit offline reload, the test server returns HTTP 503 with no usable content instead of terminating its socket. The test still **requires** correct rendering of the complete, SHA-verified offline B article and intact prior offline A cache. It neither skips nor relaxes offline integrity acceptance, and changes no application runtime or imagery. [Full Application PR run #542](https://github.com/ginosega/fishing/actions/runs/39688317721) passed. Merged as production source `ab1c59a61c748e9a8a1da2b31d87e1d86c96ac9f`.
5. [Main production workflow #543](https://github.com/ginosega/fishing/actions/runs/39690549053) **SUCCEEDED**: security/dependencies, all core tests, Chromium/WebKit preview and production-root regressions, GitHub Pages deploy, hosted byte/manifest checks and real hosted browser acceptance.

## Verified production evidence

- **URL:** https://ginosega.github.io/fishing/
- **Source revision:** `ab1c59a61c748e9a8a1da2b31d87e1d86c96ac9f`
- **Hosted release ID:** `131ebca9c6d46fa1c1d815ad43a318f6`
- **Hosted release manifest:** 577 files, 100 Gear, 60 KB and 12 catches.
- **Hosted browser verification:** Online-only default, explicit complete offline-library preparation, offline reload, image viewer, navigation, counts, copied change-package behavior and other critical cases passed. [Artifact from #543](https://github.com/ginosega/fishing/actions/runs/39690549053/artifacts/12388114804).
- **Owner visual and real-device timing confirmation:** Intentionally deferred until the user checks production, as instructed. Do not describe these as already verified by the owner.

FISH117 is complete **as an engineering/release task**. Record any owner-reported appearance or performance defects as follow-up work. Next unused application/architecture task ID: **FISH-TODO-118**. AUTH-P0 and the separately approved v3 cutover gates remain independent.
