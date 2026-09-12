# Fishing Companion production application

Fishing Companion is the active v2 PWA published at https://ginosega.github.io/fishing/.

## Current verified production — September 12, 2026

FISH096 is live through [PR109](https://github.com/ginosega/fishing/pull/109). The feature originally shipped at source `0782d1fd6ff9a176d94132c4dc962589b9480e32`, release `23f6839d69df2018aed54fa6d3fc70d4`.

Current production later advanced through the user's direct upload of 13 Palomar source frames:

- source: `7d43898d1c8e59ec87fcc8913e45c1df01957fd1`
- release: `921777f82c4216eccfb26d17e1043a57`
- production workflow: [run 34717459805](https://github.com/ginosega/fishing/actions/runs/34717459805)
- hosted v2 files: 214
- hosted-verification artifact: `10305581445`

The current deployment passed complete source/core validation, Chromium/WebKit preview and production acceptance, archived-v1 cutover acceptance, exact-current-main guard, Pages deployment, hosted-byte verification and hosted-browser verification. The uploaded Palomar frames remain unreferenced source assets and are not included in the published manifest until canonical KB data explicitly references them as a sequence. See [FISH096 production closeout](docs/FISH096_Production_Closeout_2026-09-12.md).

## Directory layout

| Location | Purpose |
|---|---|
| `src/` | Browser application, editor, viewer, verified offline releases and service worker |
| `tools/` | Build, source validation and local/hosted verification |
| `test/` | Core integrity and Chromium/WebKit acceptance, including retained v1-store/cutover coverage |
| `contracts/` | Canonical domain schema |
| `migration/` | Original reconciliation/image approvals and historical migration evidence; no executable migration remains |
| `docs/` | Approved requirements/designs, exact user feedback, technical references and release/recovery evidence |
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

Historical implementation/release details remain in Git history and the dated records under `docs/`; current continuation state is in the repository-root README/Context/TODO/Decision Log/bootstrap.