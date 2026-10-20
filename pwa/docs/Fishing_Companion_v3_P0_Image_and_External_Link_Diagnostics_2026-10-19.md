# Fishing Companion v3 — P0-B/P0-C Image and External-Link Diagnostics

**Recorded:** October 19, 2026 (Pacific time)  
**Status:** Source inventory complete; draft-only Playwright/browser and nondestructive thumbnail benchmark CI initiated. Actual Android installed-PWA reproduction and cross-device performance acceptance remain open.

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

- [Diagnostic draft PR #242](https://github.com/ginosega/fishing/pull/242) has **test-only**, unmerged changes; it must not be merged under investigative P0 approval because `pwa/test/**` triggers the full app production release lane when merged.
- Browser probe: Gear Lures at 1280×900 and KB Techniques at 390×844, first and repeat navigation; record above-fold visible image count, original manifest bytes, browser resource timings, last decode + double animation frame and logged `P0_IMAGE_METRIC`. The 390px test is a *mobile-sized desktop engine*, **not Android emulation**.
- Candidate-size benchmark: create **in memory only** a 512×270 maximum, WebP quality 80 derivative using existing locked Sharp dependency for every Lures and Techniques original; log `P0_THUMBNAIL_METRIC` source/candidate totals and examples. Originals are read, never overwritten. This is a byte-budget experiment, not a shipping format or visual-acceptance decision.
- PR workflow [#522](https://github.com/ginosega/fishing/actions/runs/39344837588) tests initial browser probes. Updated head [#523](https://github.com/ginosega/fishing/actions/runs/39345000450) includes nondestructive derivative benchmark. **Consult the final exact-head CI result and job logs; there are no asserted timing or conversion numbers in this document until the runs finish.**

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

Updated probe/derivative run [#523](https://github.com/ginosega/fishing/actions/runs/39345000450) and regex-corrected exact-head run [#524](https://github.com/ginosega/fishing/actions/runs/39345445909) were still in progress/pending at the time this measurement appendix was added. Final exact-head acceptance and the converted WebP byte budget must be reviewed separately before recommending release.


## P0-C: External-link activation in installed Android PWA

**Previously observed:** ordinary external links may do nothing on a normal tap from the installed Chrome Android PWA, while browser-tab links work, long-press `Open in browser` works, and YouTube app links open. This has **not been reproduced independently on the device**.

**Source facts:**

- Manifest `display:'standalone'` and scope `./`.
- Both `pwa/src/markdown.mjs` for external HTTP(S) Markdown links and `pwa/src/ui.mjs` for structured `record.links` emit `target='_blank' rel='noopener noreferrer'`.
- Internal SPA interception is restricted to `#/...` navigation; ordinary external click handling is **not** intercepted by the app.
- Existing `FISH103` browser test asserts safe link attributes but does not click links.
- [Draft PR #242](https://github.com/ginosega/fishing/pull/242) adds controlled desktop Chromium/WebKit popup activation for one structured Gear and one Markdown KB link; log prefix `P0_LINK_METRIC`. This checks the desktop/control path, **not** Android installed Chrome, Android Custom Tabs, installed Edge PWA, or YouTube app association.

Relevant public platform guidance: [MDN on standalone web apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Create_a_standalone_app) explains manifest display mode, and [Google Chrome web.dev manifest guidance](https://github.com/GoogleChrome/web.dev/blob/main/src/site/content/en/progressive-web-apps/add-manifest/index.md) describes `target='_blank'` in installed Android PWAs as opening Chrome Custom Tabs. Actual OS/app versions and installed-shell delegation can differ; these references **do not establish the cause** of the owner's incident.

### Required next device evidence

1. On the existing installed **Chrome Android Fishing Companion**, visit a known Gear item's **Links** section and tap one ordinary external HTTPS link. Capture whether nothing appears, a Custom Tab appears briefly, another app opens, or a permission/chooser dialog appears.
2. On the same link, use long-press Open in browser, then repeat a normal tap from **Chrome browser tab** (not the installed PWA). Compare with an ordinary Markdown external link and a YouTube link.
3. Record Android version, Chrome version, PWA installation route (Chrome vs Edge), whether Edge-installed PWA reproduces if applicable, and whether it began after an OS/browser update. A remote DevTools trace is optional if needed, not the default request.
4. Test prospective remediation in **nonproduction** installed Chrome/Edge on Android, with a regression matrix for YouTube delegation, desktop/browser tabs, malicious URLs, accessibility and external navigation escape. No speculative `rel` removal, forced `_self` navigation, browser-UI mode change, or JS popup fallback without evidence.

**Stop condition:** without a verified on-device failure and measured safe candidate, defer the Android link fix rather than claim it is resolved by desktop tests.

## Release and governance

P0 investigations are allowed. PR #242 and its nonproduction tests are **not automatically authorized to merge**; any `pwa/test`, `pwa/src`, build or worker change merged to main triggers the Full Application Release path. Production v2 and its released image bytes remain unchanged. The independent v2 maintenance-vs-v3 deferral decision and real-device evidence belong in the P0 recommendation/acceptance gate. No new provider, identity, secret or cost is introduced.
