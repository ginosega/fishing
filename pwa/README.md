# Fishing Companion production application

Fishing Companion is the active v2 PWA published at https://ginosega.github.io/fishing/.

## Current verified production — September 12, 2026

FISH097 is live through [PR112](https://github.com/ginosega/fishing/pull/112), activating the existing FISH096 sequence capability for the canonical Palomar Knot using the 13 previously uploaded frames. Package validation [run 34723150221](https://github.com/ginosega/fishing/actions/runs/34723150221) verified the source-aware bases and all 13 exact image byte counts/SHA-256 hashes before promotion.

Current production:

- source: `934d70bdd669180479f8c5a71c5e1050d2dbf56d`
- release: `696737730abf20323e5f308739aa14c4`
- production workflow: [run 34723495195](https://github.com/ginosega/fishing/actions/runs/34723495195)
- hosted v2 files: 227
- hosted-verification artifact: `10306962337`

The deployment passed complete source/core validation, Chromium/WebKit preview and production acceptance, archived-v1 cutover acceptance, exact-current-main guard, Pages deployment, hosted-byte verification and hosted-browser verification. The published manifest now includes all 13 Palomar frames. Palomar uses `step-13.png` as representative `picture.src`, caption `Palomar knot`, and explicit ordered `pictureSequence` references from `step-01.png` through `step-13.png`.

FISH096 remains the underlying production sequence feature; see [FISH096 production closeout](docs/FISH096_Production_Closeout_2026-09-12.md).

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