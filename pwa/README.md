# Fishing Companion production application

Fishing Companion is the active v2 PWA published at https://ginosega.github.io/fishing/.

## Current verified production — September 13, 2026

FISH101 is live through feature [PR121](https://github.com/ginosega/fishing/pull/121) plus verification-only [PR122](https://github.com/ginosega/fishing/pull/122). The submitted Knot change-package batch and explicit removal of Double Uni Knot and Single Uni Knot were validated before promotion. Branch validation [run 34766670229](https://github.com/ginosega/fishing/actions/runs/34766670229) passed all submitted stale-base checks and recomputed exact byte counts/SHA-256 hashes for all **39** pre-uploaded media files. Full pre-merge production acceptance [run 34766717362](https://github.com/ginosega/fishing/actions/runs/34766717362) passed.

The feature release activates Improved Clinch (11 PNG), Modified Uni (12 JPG), and Trilene (15 PNG) sequences; adds the submitted static Non-Slip Loop picture; applies the submitted Knot content/structured refinements; updates Bowline's description; retains Palomar's existing 13-frame sequence while applying its submitted Markdown refinement; and removes Double Uni Knot and Single Uni Knot records plus their Markdown articles. Canonical KB count is now **55**.

The feature merge source was `360d71ff2bfaf075ad498d18f05126268f6606f1`. Its first exact-main Pages deployment succeeded, but post-deploy hosted verification exposed a stale expected KB count of 57. PR122 changes only that hosted-verifier expectation to 55; no application content or behavior changed.

Current production:

- source: `2b76f9f91757705e361ed3485da0627e493c8d7d`
- release: `eeba6be85560163522778e2e795d91d9`
- production workflow: [run 34768935480](https://github.com/ginosega/fishing/actions/runs/34768935480)
- hosted v2 files: **325**
- hosted-verification artifact: `10322070321`

The exact-current-main deployment passed complete source/core validation, Chromium/WebKit preview and production acceptance, archived-v1 cutover acceptance, exact-current-main protection, Pages deployment, hosted-byte verification and hosted-browser verification.

Active Knot sequences are Palomar 13 PNG frames, Albright 15 JPG frames, Arbor 9 JPG frames, Bowline 7 JPG frames, FG 29 JPG frames, Improved Clinch 11 PNG frames, Modified Uni 12 JPG frames, and Trilene 15 PNG frames. Non-Slip Loop uses the submitted static representative picture. Double Uni Knot and Single Uni Knot are no longer canonical KB records. Directory-only images still never create a sequence; explicit canonical references remain required.

## Directory layout

| Location | Purpose |
|---|---|
| `src/` | Browser application, editor, viewer, verified offline releases and service worker |
| `tools/` | Build, source validation and local/hosted verification |
| `test/` | Core integrity and Chromium/WebKit acceptance, including retained v1-store/cutover coverage |
| `contracts/` | Canonical domain schema |
| `migration/` | Original reconciliation/image approvals and historical migration evidence; no executable migration remains |
| `docs/` | Approved requirements/designs, exact user feedback, technical references and release/recovery evidence; see [`docs/README.md`](docs/README.md) for current-authority vs historical-record rules |
| `icon.png` | Canonical user-supplied app/fav/touch icon |
| `dist/` | Generated build; ignored by Git |

Canonical content stays in repository-root `Gear/`, `KB/` and `Catches/`. The build reads those sources plus this directory. There is no production dependency on the former root `v2/`, deleted v1 runtime/assets, `History/` or `Topics/`.

## Current runtime model

Fishing Companion retains independent Gear, KB and Catch domains. Gear/KB Add/Edit provides Prepare Changes → Copy Changes source-aware handoffs; the browser does not write repository source directly.

FISH091 makes online-only the default: ordinary online startup does not prepare the complete offline library. **Connection Status → Update offline library** explicitly prepares/refreshes the verified complete offline generation. Previous verified generations remain fallback until successfully replaced; failure does not destroy the prior generation.

FISH096 adds optional Knot-only explicit ordered `pictureSequence` support. Frames are canonical source assets under `KB/Knots/assets/<knot-id>/` with contiguous `step-01`, `step-02`, ... naming and explicit structured order. `picture.src` equals the final frame. Ordinary browsing loads only that representative frame; the sequence viewer opens at frame 1, supports manual stepping, one-second looping Play/Pause, frame position, shared caption, keyboard controls and the existing zoom/pan gestures. Remaining frames preload only after the viewer opens. The full explicit sequence is included when the user prepares the complete offline library.

Directory contents alone never create a sequence. Every frame must be explicitly referenced by the KB record before it becomes release/offline content.

Knot authoring uses the existing Picture section with complete native multi-file selection, filename-defined ordering, automatic final-frame representation, local sequence preview and supported static↔sequence conversions. The P1 handoff records complete sequence intent/paths/file hashes atomically with picture changes and provides the exact repository upload-folder link. It remains Prepare/Copy only.

FISH077/P2 remains deferred: no authentication, Direct Save, integrated browser uploads, offline authoring/outbox/sync or Catch authoring.

## Development and publication

Use Node 24 and the locked `package-lock.json`:

```text
npm ci
npm test
npm run build -- --base=/fishing/
npm run verify
```

`.github/workflows/fishing-production.yml` runs the source/core gate, both browser scopes, actual archived-v1 transition, dependency audit, exact-current-main guard, serialized Pages deployment and actual hosted verification. Documentation-only changes do not deploy.

V1 recovery tests use the durable recovery material preserved in Git; do not run old competing publishers or overwrite the production root with historical v1/preview output.

## Source and file hygiene

Routine authoring changes update canonical JSON/Markdown/pictures in domain category folders. Do not add per-item JavaScript helpers, one-off release scripts/tests or routine release Markdown. Reuse the source-derived validation. Significant application requirements/design/release evidence belongs in `docs/`.

Historical implementation/release details remain in Git history and the dated records under `docs/`; current continuation state is in the repository-root README/Context/TODO/Decision Log/bootstrap. Use [`docs/README.md`](docs/README.md) when interpreting dated project records so milestone-era “current” statements are not mistaken for present project state.