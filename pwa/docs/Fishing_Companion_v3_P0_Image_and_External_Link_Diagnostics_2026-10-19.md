# Fishing Companion v3 — P0-B/P0-C Image and External-Link Diagnostics

**Recorded:** October 19, 2026 (Pacific time)  
**Final disposition update — October 20, 2026:** Desktop CI and thumbnail byte benchmarks passed. **P0-C is CLOSED — OWNER ACCEPTED CHROME ANDROID NATIVE CUSTOM TAB BEHAVIOR; NO CODE CHANGE.** On October 19, the owner originally preferred a separate browser tab; on October 20, after verifying Google's official Chrome Android PWA behavior, the owner accepted the in-app/Custom Tab navigation and requested moving on. P0-B image-performance follow-up remains separate and open.

See [approved v3 implementation plan](Fishing_Companion_v3_Implementation_Plan.md), [P0 baseline](Fishing_Companion_v3_P0_Baseline_2026-10-19.md), and [stale-session diagnostics](Fishing_Companion_v3_P0_Stale_Session_Diagnostics_2026-10-19.md).

## P0-B: Grid image performance

**Source observation:** `pwa/src/ui.mjs` `recordCard()` uses `ctx.asset(record.picture.src)` for small grid cards and sets `loading='lazy'`; cards present images approximately 135px high on desktop and 100px on mobile from `pwa/src/styles.css`. The original full-resolution canonical pictures are used with no card-sized derivative mapping. The service worker online path verifies immutable content bytes. This is a credible performance contributor, but source inspection alone cannot apportion network transfer versus integrity verification, browser decode and layout.

### Verified baseline inventory — actual latest source tree

Measured using blob sizes in the recursive Git tree at `24abbccb1c6c0c6e024b59468289f22352155808`, matched to the references in `pwa/Gear/gear.json` and `pwa/KB/kb.json`:

| Grid | Source cards with pictures | Combined original file sizes | Individual originals above 1 MiB |
|---|---:|---:|---:|
| Gear / Lures | 42 / 42 | 16,471,721 bytes (15.71 MiB) | 4 |
| Knowledge Base / Techniques | 9 / 9 | 27,949,518 bytes (26.65 MiB) | 9 |

Largest examples: Lures Z-Man Jack Hammer 2,787,253 bytes, Strike King Red Eyed Special 1,632,906 bytes; KB Bass Behavior and Habitat 3,544,583 bytes, Trout Behavior and Habitat 3,393,658 bytes, Bass Fishing Techniques 3,346,655 bytes. These totals represent all picture references on each grid, **not guaranteed initial transfer**; the browser requests only images entering its lazy-load threshold, and caching/network/device conditions vary.

### Controlled test/measurement implementation

- [Diagnostic PR #242](https://github.com/ginosega/fishing/pull/242) is **CLOSED WITHOUT MERGE** after test/benchmark completion. It contains **test-only**, nonproduction changes; it was not merged under investigative P0 approval because `pwa/test/**` triggers the full app production release lane when merged.
- Browser probe: Gear Lures at 1280×900 and KB Techniques at 390×844, first and repeat navigation; record above-fold visible image count, original manifest bytes, browser resource timings, last decode + double animation frame and logged `P0_IMAGE_METRIC`. The 390px test is a *mobile-sized desktop engine*, **not Android emulation**.
- Candidate-size benchmark: create **in memory only** a 512×270 maximum, WebP quality 80 derivative using existing locked Sharp dependency for every Lures and Techniques original; log `P0_THUMBNAIL_METRIC` source/candidate totals and examples. Originals are read, never overwritten. This is a byte-budget experiment, not a shipping format or visual-acceptance decision.
- PR workflow [#522](https://github.com/ginosega/fishing/actions/runs/39344837588) tests initial browser probes. Updated head [#523](https://github.com/ginosega/fishing/actions/runs/39345000450) includes nondestructive derivative benchmark. **Full validation passed** on both [run #523](https://github.com/ginosega/fishing/actions/runs/39345000450) and the exact final diagnostic head [run #524](https://github.com/ginosega/fishing/actions/runs/39345445909), `92728ca66cb89d8f9490b61194a7827714803206`. No deployment was triggered.

**Provisional direction:** deterministic, disposable card derivatives, stored separate from canonical originals, referenced by a manifest-aware mapping and included in release identities, per-file SHA verification and complete offline budget. Do not change source pictures, original detail-view resolution, FISH108 content eligibility or production without a separately approved v2 maintenance release. Acceptability requires actual perceptual comparison (photographs vs illustrations, transparency), mobile pixel density, successful image rendering and measured timing gain.

### Measured browser-run evidence (CI #522, diagnostic head `48a9e8c53530`)

The local GitHub Actions runner executed the probes in Chromium and WebKit against the generated release; both new image probes and both external-popup checks completed in each engine.

| Engine | Page / viewport | Navigation | Elapsed to decode all above-fold images and two animation frames |
|---|---|---|---:|
| Chromium | Gear Lures / 1280×900 | First; repeat | 680 ms; 730 ms |
| Chromium | KB Techniques / 390×844 | First; repeat | 778 ms; 811 ms |
| WebKit | Gear Lures / 1280×900 | First; repeat | 1,103 ms; 927 ms |
| WebKit | KB Techniques / 390×844 | First; repeat | 784 ms; 669 ms |

- Gear Lures: 12 above-fold image elements, representing **5,055,100 original bytes (4.82 MiB)** in the release manifest.
- KB Techniques at 390px: four above-fold image elements, representing **12,262,437 original bytes (11.69 MiB)** in the release manifest.
- These are **local, unthrottled, headless, repeatable CI browser observations**, measuring time from navigation to all selected above-fold images decoded plus two animation frames. They are **not first-image visual paint times**, actual bytes observed over an Android mobile radio, or a reproduction of the user-reported 3–4-second delay.
- The initial probe's `imageFileReads` counter used an over-escaped regex and erroneously logged zero even though browser resource timings existed. **Ignore this field for #522/#523**; it was corrected in the subsequent exact head `92728ca66cb` (run #524). Manifest referenced bytes are accurate independently of that diagnostic counter.
- Both a structured Gear external link and a Palomar Knot YouTube Markdown link produced a new popup context in **desktop browser** mode in both engines. This does **not** validate Android YouTube app delegation or Android installed-PWA link taps.
- **Overall run #522 failed** in a separate pre-existing WebKit offline-integrity test: `tampered prepared content is rejected; online retry does not silently repair the complete library` expected status `Incomplete` but observed `Downloading` for 12 seconds. Its relationship to test environment timing is not yet established; no application source or offline behavior was changed by the probe PR. [Full failure log](https://github.com/ginosega/fishing/actions/runs/39344837588). **Do not describe full #522 CI as passed.**

### Verified derivative-size benchmark (full CI #523 and exact-head #524)

The locked Sharp dependency read each original without modifying or committing it, then created an in-memory WebP candidate with `resize({width:512,height:270,fit:'inside',withoutEnlargement:true})` and `webp({quality:80,effort:4})`. Results matched in successful runs #523 and #524:

| Set | Originals | Candidate WebP derivatives | Potential byte reduction |
|---|---:|---:|---:|
| Gear Lures — 42 | 15.71 MiB | 0.26 MiB | **98.32%** |
| KB Techniques — 9 | 26.65 MiB | 0.53 MiB | **98.02%** |

Representative byte measurements: Z-Man Jack Hammer 2,787,253 → 13,318; Bass Behavior and Habitat 3,544,583 → 74,308; Trout Behavior and Habitat 3,393,658 → 73,504. These are file-byte budgets rather than measured page-load speedups. The candidate sizes and visual fidelity have not been accepted for release, and no candidate assets have been added to production or canonical image paths.

**Validation:** run #523 completed successfully, including 54 preview-browser and 56 production-browser acceptance checks. Exact-head run #524 also completed successfully (54 preview and 56 production browser checks), including the fixed image read counter and both desktop link activation controls. The single transient WebKit assertion failure observed in earlier run #522 did not reproduce in either full passing rerun. Preserve the original failure as an investigated intermittent signal; do not claim it was definitively understood or fixed.


## P0-C: External-link behavior in installed Android Chrome PWA — CLOSED

**Owner decision October 20, 2026 — ACCEPTED PLATFORM BEHAVIOR, NO FIX.** Google's [official PWA manifest guidance](https://web.dev/articles/add-manifest) states that on Android, links with `target="_blank"` open in a **Chrome Custom Tab**. Chrome's [Custom Tabs documentation](https://developer.chrome.com/docs/android/custom-tabs/guide-get-started) confirms Custom Tabs are browser-powered in-app web experiences, rather than ordinary external tab navigation.

**Physical-device evidence (October 19):** On the owner's Android device, the external Daiwa Tatula XT Gear product link opened in-app from installed Fishing Companion but opened in a **new Chrome browser tab** from the same page in regular Chrome. The owner initially described the in-app behavior as unwanted; **on October 20, explicitly accepted this documented Chrome behavior and asked that the project move on**. This later accepted behavior **supersedes** the out-of-app browser-tab requirement recorded in [PR #246](https://github.com/ginosega/fishing/pull/246). Do not reclassify an otherwise-working Chrome Custom Tab as a defect simply because it is attached to the installed PWA.

**Source and validation:** `pwa/src/ui.mjs` and `pwa/src/markdown.mjs` already use `target="_blank" rel="noopener noreferrer"` for structured/Markdown external links; app internal `#/...` routes remain within the SPA. Diagnostic [PR #242](https://github.com/ginosega/fishing/pull/242) exercised browser new-tab behavior in Chromium and WebKit; full CI [#523](https://github.com/ginosega/fishing/actions/runs/39345000450) and [#524](https://github.com/ginosega/fishing/actions/runs/39345445909) passed. No changes to links or Android intents are necessary.

**Boundaries:** The accepted behavior applies specifically to **installed Chrome Android PWAs**, not a universal claim about installed Edge/iOS. Existing YouTube native-app delegation, safe external URLs, ordinary browser-tab behavior and internal routes remain required. A new, distinct *failure to load* an external link should be investigated separately if actually reproduced. **OAuth sign-in redirect/callback behavior is not covered**; AUTH-P0 still requires installed-PWA device validation. No speculative regular-browser escape workaround, nonproduction Android intent experiment or v2 maintenance production release is warranted for P0-C.

## Release and governance

P0 investigations and their documentation are complete for external-link behavior. Diagnostic PR #242 was **closed unmerged**, preserving test evidence and avoiding the Full Application Release path for `pwa/test` changes. Production v2 and original images remain unchanged. P0-B thumbnail design/prototype and release decisions remain separately open; no provider, identity, secret or cost was introduced.
