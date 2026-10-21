# Fishing Companion v3 — P0-B Nonproduction Card Thumbnail Prototype

**Date:** October 20, 2026  
**Status updated October 21, 2026:** The owner **approved the thumbnail implementation**, accepted the measured browser performance improvement, and explicitly **waived further visual-quality review and a separately hosted Android preview/device comparison**. Full CI validation of exact latest prototype head in [run #526](https://github.com/ginosega/fishing/actions/runs/39436154092) passed. **Separate authorization to deploy a v2 maintenance release has not yet been given**; prototype PR #248 remains unmerged and v2 production unchanged. P0-A stale-session behavior on new deployments is independently unresolved.

## Authority, isolation and evidence

- [Approved v3 staged implementation plan](Fishing_Companion_v3_Implementation_Plan.md): P0-B measurement and P2 optional independent v2 maintenance/ P7 integrated v3 generated-thumbnail design. Production release requires independent approval.
- [Initial P0-B source inventory and Android link record](Fishing_Companion_v3_P0_Image_and_External_Link_Diagnostics_2026-10-19.md).
- [Draft, **unmerged** application PR #248](https://github.com/ginosega/fishing/pull/248), branch `prototype/v3-p0b-release-card-thumbnails-20261020`, **latest checked head** `6bd9d5e04c69851b2f4c64813c3b6821f6ff8db6` (adds self-contained visual comparisons to the original measured prototype). The current head was validated successfully by run #526. Do not merge before separate production go-ahead.
- [GitHub Actions full validation run #525](https://github.com/ginosega/fishing/actions/runs/39431537020), run ID `39431537020`, **SUCCESS**: core tests and preview verification; preview-scope browser **52 passed**, production-root build/verify; production-scope browser **54 passed**; deploy jobs **skipped**. Screenshot/HTML/trace evidence in [production-acceptance-evidence artifact](https://github.com/ginosega/fishing/actions/runs/39431537020/artifacts/12269531026); full generated candidate build artifact `12269606375` was **not deployed**.
- Last production remains the previously hosted v2 release; documentation-only changes may place current GitHub `main` ahead of that published source. Verify the actual latest deployed release again before any future release decision.

## What the prototype changes — and does not

1. `pwa/tools/card-thumbnails.mjs` reads the **unique** original Gear/KB record picture references, including species images reused by Catch cards. It generates stable WebP derivatives in a 512 × 270 maximum box, quality 80, alpha quality 90, encoded at build time. For animated originals, cards use the first frame; complete originals remain available in detail/viewer. Original content/bytes are **never rewritten**.
2. `pwa/tools/build.mjs` adds the generated `releases/<releaseId>/card-thumbnails/<sha256-of-logical-source-path>.webp` files and source-to-derivative map to the release identity calculation. All generated files are enumerated by the normal release manifest and per-file SHA-256 verifier. `--without-card-thumbnails` deliberately produces a control build for comparison.
3. `pwa/src/release.mjs` validates mapping names, that original canonical source files are present in the manifest, and that every derivative file is present and integrity-checked. Historical manifests without `cardThumbnails` continue to validate.
4. `pwa/src/app.mjs` and `pwa/src/ui.mjs` use mapped derivatives **only for grid/card images**; Gear/KB detail picture, viewer, Markdown, knot sequence, canonical URLs, schema, and Catch picture derivation remain unchanged.
5. Tests cover deterministic derivative bytes, source-byte immutability, both build variants and verified release manifests, online/offline integrity, user interface regressions, and side-by-side baseline/candidate browser measurements. The existing Full Application Release pathway validated the draft PR **without publishing it**.

### Complete card-picture storage budget

| Metric | Measured result |
|---|---:|
| Unique Gear/KB original card sources | 146 |
| Original files referenced by cards | 107,935,148 bytes (102.94 MiB) |
| All 146 disposable derivative files | 1,640,348 bytes (1.56 MiB) |
| Candidate byte reduction for card image requests | **98.48%** |
| Additional complete offline-library storage | **about 1.56 MiB** (originals retained) |
| Candidate production-scope manifest total | 185,344,105 bytes, 575 files |
| Canonical record counts | 100 Gear / 60 KB / 12 Catches (unchanged) |

The 98.48% saving compares card originals against generated card derivatives; **it does not reduce the total offline library by 98.48%**, because offline use still includes the unchanged original pictures.

### Above-fold browser latency, before versus after

Each measured build used an independent browser context and release scope. The time is **navigation start through all above-fold card images decoded plus two animation frames**, not necessarily first-pixel paint. Chromium requested 80 ms latency / 1 MiB/s via DevTools; **the effective bandwidth constraint on service-worker-mediated fetches was not independently validated**, so the observed timings must not be construed as a real 1 MiB/s WAN measurement. WebKit used an unthrottled local fixture. These tests were **not run on the owner's Android phone**.

| Browser / viewport | Baseline | Prototype | Relative speed |
|---|---:|---:|---:|
| Chromium / Gear Lures, 1280 × 900 | 1,205 ms | 719 ms | 1.68× |
| Chromium / KB Techniques, 390 × 844 | 1,398 ms | 737 ms | 1.90× |
| WebKit / Gear Lures, 1280 × 900 | 1,482 ms | 906 ms | 1.64× |
| WebKit / KB Techniques, 390 × 844 | 1,170 ms | 551 ms | 2.12× |

Production-scope repeat comparisons also improved: Chromium Gear 1,155 → 712 ms, KB 1,316 → 722 ms; WebKit Gear 1,469 → 903 ms, KB 1,168 → 557 ms. Results are CI observations, not a guarantee of identical perceptual speedup on mobile devices.

**Representative above-fold image bytes:** Gear Lures 12 card pictures, **5,055,100 → 67,502 bytes** (98.66% reduction). KB Techniques 6 pictures at the 390-pixel test viewport, **18,505,090 → 351,028 bytes** (98.10% reduction). These are manifest bytes associated with currently visible image elements, not verified bytes transferred over the device's network interface.

## October 21 owner acceptance and outstanding release authorization

- **Owner-approved behavior:** Use 512 × 270 maximum generated WebP card images, preserving full originals for Gear/KB detail pages, viewer and Markdown. The owner expects no material visual difference at thumbnail display size and accepts the measured Chromium/WebKit browser improvements as sufficient evidence of value.
- **Device preview and image-quality review waived by owner:** **Do not** provision another Pages repository, public preview site or request an Android performance comparison for this thumbnail change. This is an explicit choice to accept residual real-device visual/performance uncertainty; it does not imply those checks were conducted.
- **Verified source validation:** [exact-head Full Application CI #526](https://github.com/ginosega/fishing/actions/runs/39436154092) completed successfully, covering core, release byte verification, preview/production-scope browser tests and full original/detail-image retention. The 98% byte reductions are for card requests, not for total offline storage.
- **Separate v2 maintenance deployment permission still required:** The approved project plan explicitly requires a *specific production release authorization*. The owner's wording approves the **change** and waives the preview, but does not explicitly direct publication to production. Until that gate is resolved, maintain PR #248 as a draft and do not merge/deploy.
- **Deployment caveat:** Current v2 still has an independently reproduced **post-deployment stale-session** weakness. Publishing any new v2 version, including thumbnails, can expose already-open sessions to unavailable prior-release content until refreshed. Before offering a maintenance release, state this known risk and preserve a rollback plan; do not misstate it as fixed by thumbnails. Real Android offline quota and installed-PWA timing remain unmeasured, although the browser offline/release integrity checks passed. No new vendor, app permissions, hosting or security changes are involved.

**P0-C:** Chrome Android installed-PWA external link Custom Tab behavior was **accepted by the owner on October 20, 2026**, and remains closed with no code change. **P0-A:** Old-client release consistency remains separate and open. **AUTH-P0:** Installed-PWA GitHub sign-in/callback and session proof remains mandatory.
