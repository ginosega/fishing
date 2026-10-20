# Fishing Companion v3 — P0-B Nonproduction Card Thumbnail Prototype

**Date:** October 20, 2026  
**Status:** Isolated prototype built and full GitHub Actions application validation passed. **Not merged or deployed; visual/real-device/release acceptance still open.**

## Authority, isolation and evidence

- [Approved v3 staged implementation plan](Fishing_Companion_v3_Implementation_Plan.md): P0-B measurement and P2 optional independent v2 maintenance/ P7 integrated v3 generated-thumbnail design. Production release requires independent approval.
- [Initial P0-B source inventory and Android link record](Fishing_Companion_v3_P0_Image_and_External_Link_Diagnostics_2026-10-19.md).
- [Draft, **unmerged** application PR #248](https://github.com/ginosega/fishing/pull/248), branch `prototype/v3-p0b-release-card-thumbnails-20261020`, head `b2979b828ee1ee259b174c181e9d322f088e9ad7`.
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

## Remaining release gates

- **Visual review:** Review screenshots/quality for both photograph and illustrative art, fine detail, text embedded in original artwork, transparency, blur/sharpening, display-density fit, and whether 512 × 270 quality 80 is sufficient. CI asserts images decode and appear, not subjective quality; screenshot artifacts have not been visually approved by the owner.
- **Real Android measurements:** Confirm card-load speed/appearance in the **installed** Fishing Companion PWA and regular browser, ideally cold/warm conditions, against the known previous 3–4-second observation. Chromium/WebKit desktop automation is useful but not a substitute.
- **Immutable, complete offline behavior:** CI test suite passed with generated assets included; before release, confirm size/quota/error-retry behavior on Android, including generated and original pictures after explicit Work Offline preparation and after software updates.
- **Maintenance versus v3:** Decide only after those checks whether the independently scoped changes qualify for a separately approved v2 Full Application maintenance release or should remain in v3 P7. Reverify current `main`, source/preview hashes, PR head, hosted production identity, rollback and release policy.
- **Do not merge draft #248 or deploy** merely because test CI succeeded. No GitHub App, hosting provider, permissions, external navigation, user session or content schema changes are required by this prototype.

**P0-C:** Chrome Android installed-PWA external link Custom Tab behavior was **accepted by the owner on October 20, 2026**, and remains closed with no code change. **P0-A:** Old-client release consistency remains separate and open. **AUTH-P0:** Installed-PWA GitHub sign-in/callback and session proof remains mandatory.
