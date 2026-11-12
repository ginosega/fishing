# FISH118 WP1 — source-only frontend exit evidence ledger

**Audit date:** 2026-11-12 UTC. **Status:** working evidence; **not** an acceptance or a live-WP status pointer. Only the FISH-TODO-118 entry in [WORK_QUEUE.md](WORK_QUEUE.md) determines active WP and next safe action. The 66-ID approved [WP0 requirements matrix](FISH118_WP0_REQUIREMENT_MATRIX.md) remains the scope authority; this ledger covers its **30 WP1-owned IDs only**.

**Integrated candidate:** [draft #444](https://github.com/ginosega/fishing/pull/444) at `1fff918f1830d8fc9dcc24dbb111896c3875a3ff`, stacked over exact-head PASS [#429](https://github.com/ginosega/fishing/pull/429), [#430](https://github.com/ginosega/fishing/pull/430), [#431](https://github.com/ginosega/fishing/pull/431), [#435](https://github.com/ginosega/fishing/pull/435), [#437](https://github.com/ginosega/fishing/pull/437), [#439](https://github.com/ginosega/fishing/pull/439), [#442](https://github.com/ginosega/fishing/pull/442). #444 exact-head CI is **PENDING**; never promote earlier-head tests into #444 acceptance.

**Evidence scope:** A production-shaped isolated `/fishing/` D6 owner-preview build with all three real canonical JSON catalogs and original asset bytes, fresh gated source read, local owner-only editor UX, *no* publishing/media endpoint, and all deploy jobs skipped. D5 private Windows/Android field PASS and D6 read-only Stage A field PASS are **not** evidence of a complete writable RC. WP2 auth, WP3 complete publishing, WP4 verified Live, WP5 hosted/owner/device acceptance, and WP6 production cutover remain separate.

| WP1-owned requirement | Integrated source/test evidence | Source-only state |
| --- | --- | --- |
| V3-SAVE-08 | D6 owner editor uses disabled Save and Publish, no V2 Copy Changes; #444 B16 | PENDING #444 |
| V3-UPLOAD-05 | Original image #437 B09 / #439 B10; generated card thumbnails #431 M01, physical package CI | PASS |
| V3-CATCH-01 | Existing canonical Catch Add/Edit: field/ID/lure/Notes #444 B14; prior #429/#431 | PENDING #444 |
| V3-CATCH-03 | Sorted canonical Catch cards, inferred Species artwork, original detail #444 B15; D6 owner browser 03 | PENDING #444 |
| V3-CATCH-04 | No GPS, trips, Catch cover/new required fields: `catch-editor.mjs`, #444 B14 | PENDING #444 |
| V3-VIEW-01 | Opt-in original Notes Picture Viewer real-record browser #437 B09 | PASS |
| V3-VIEW-02 | Safe Markdown/internal links #435 B07/08; alt and viewer caption #439 B10 | PASS |
| V3-VIEW-03 | Missing original image degrades with accessible fallback #437 B09 | PASS |
| V3-CONNECTION-01 | D6 owner connection browser 01/02; `offline-integrity.test.mjs` D6-O02/03 | PASS |
| V3-CONNECTION-02 | Offline no write: #431 B06, #442 B12, D6-O03 and owner gate EG04 | PASS |
| V3-CONNECTION-03 | Unprepared Work Offline cannot strand user, D6-O02 | PASS |
| V3-CONNECTION-04 | Atomic verified offline preparation and failure rollback, D6-O04/O06 and offline-integrity tests | PASS |
| V3-CONNECTION-05 | Dirty edit protected on disconnected/reload, #431 B06, #442 B05, release-transition tests | PASS |
| V3-CONNECTION-06 | Exact approved D5 Account/Publishing source, D6 owner-browser 01/02, Help #444 B17 | PENDING #444 |
| V3-CONNECTION-07 | Already-open edit remains locally on disconnection #431 B06; accepted private D5 Work Offline field evidence; physical final WP5 | WP5 recheck |
| V3-PERF-01 | Real Gear Lures card decode 2s ceiling, #431 M01 repeated #442 | PASS |
| V3-PERF-02 | Recorded Chromium network/decode and WebKit unthrottled card bytes/times in #431 M01 | PASS |
| V3-PERF-03 | Derived thumbnails through build; originals retained on detail/viewer #437 B09, #439 B10 | PASS |
| V3-PERF-04 | Real Gear/KB keyboard search #442 B13; manifest offline file verification and D6-O04 | PASS |
| V3-LINK-01 | Normal native external URL behavior preserved; accepted Chrome Android Custom Tab behavior; final device WP5 | WP5 recheck |
| V3-LINK-02 | Internal routes #435 B07/08; normal safe external anchors and rel noopener/noreferrer in shared UI, FISH103 browser regression | PASS |
| V3-DRAFT-01 | Local unsent edit and success/failure messaging #431 B05, #442 B12 | PASS |
| V3-DRAFT-02 | Reload restores by explicit confirmation #442 B05, stale retains on decline #442 B11 | PASS |
| V3-DRAFT-03 | Owner-only per-record Markdown/base/structured draft, no byte persistence, D6 draft store tests 02/04/05 and warning | PASS (media limitation) |
| V3-DRAFT-04 | No offline queue or background writes, #431 B06, #442 B11/B12 | PASS |
| V3-DRAFT-05 | Stale/quota/blocked recovery, #442 B11/B12, draft store DRAFT03/06 | PASS |
| V3-DRAFT-06 | Separate local draft store, no premature deletion in WP1; final verified-publication clearing is WP3/WP4 | WP3 recheck |
| V3-OPS-03 | Offline state/bytes/release through Connection Status and D6-O04; accepted D5 source | PASS |
| V3-OPS-04 | D5 allowlisted `formatV3Diagnostics`, restored D6 Help+copy/fallback #444 B17 | PENDING #444 |
| V3-X-02 | Canonical IDs/assets unchanged: real-count D6 browser 03 and physical package #424; #444 B14/B15 no writes | PENDING #444 |

**Exit gate remaining:** Exact-head #444 full application, Chromium/WebKit B14–B17, production browser, merge-ready PASS; both deployments SKIPPED. Then reconcile the row states and accepted WP3/WP5 recheck boundaries. Do not declare WP1 accepted before the source-only gate and requirement review finish; do not merge application PRs or enable production publishing. Owner-approved D5 UX strings and the single-user canonical source contract remain unchanged. No new feature package or acceptance criterion is introduced.
