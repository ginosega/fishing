# FISH118 WP1 — Gear-card performance acceptance

**Scope:** Approved V3-PERF-01–05 in WP1. Reproducible numeric CI regression budget from actual D6 canonical Gear lures, not a new feature. Original-image viewers stay unchanged (REL-004); inline Notes derivatives remain deferred (REL-007 / #301).

## Measured baseline

The canonical page has 42 Gear lures cards. Desktop 1280×900: 12 above-fold thumbnail images, 67,502 B total. Mobile 390×844: 6 images, 41,572 B. Timing starts at page navigation and ends after visible images decode plus two animation frames; it includes app bootstrap and layout.

| Exact CI run | Browser and network | Desktop | Mobile |
| --- | --- | ---: | ---: |
| #43077076872 | Chromium, 80ms RTT, 1MiB/s transfer | 696ms | 637ms |
| #43077076872 | WebKit, local/unthrottled | 720ms | 508ms |
| #43079777196 (full CI PASS) | Chromium, 80ms RTT, 1MiB/s transfer | 633ms | 644ms |
| #43079777196 (full CI PASS) | WebKit, local/unthrottled | 589ms | 455ms |

These are **single observations in each run**, not p95 or real Windows/Android field performance. Chromium and WebKit network timing must not be treated as comparable network results.

## Numeric CI regression gate for subsequent WP1 validation

- **At most 2,000ms** navigation-to-visible-thumbnail-decode for both desktop and mobile on each browser engine. The slowest observed baseline is 720ms, leaving room for normal runner variation while detecting meaningful degradation.
- **At most 96 KiB (98,304 B) desktop** visible thumbnail bytes, **64 KiB (65,536 B) mobile**. Full original images must not replace card derivatives.
- All above-fold images must decode and point to card-thumbnails/ manifest entries. No write requests.
- Chromium uses controlled 80ms RTT and 1MiB/s download/upload; WebKit remains local unthrottled, reported separately. Record time and byte budgets in CI logs.
- Gate failures block merge. Any necessary budget revision requires measured evidence and owner review; do not silently relax tests.

## Evidence boundary

WP5 independently measures the fully hosted release in Windows Edge and Android, verifies original image viewing/quality and obtains owner acceptance. This CI gate is not a hosted performance guarantee or new release milestone. Approved owner-operated iPhone waiver and the unchanged ≤60-second text Save-to-verified-public-Live target remain intact.

Evidence: [PR #430](https://github.com/ginosega/fishing/pull/430), full [CI #43079777196](https://github.com/ginosega/fishing/actions/runs/43079777196).
