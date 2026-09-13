# Fishing Companion production application

Fishing Companion is the active v2 PWA published at https://ginosega.github.io/fishing/.

## Current verified production — September 13, 2026

FISH100 is live through [PR119](https://github.com/ginosega/fishing/pull/119). The user-supplied change package replaces only Palomar's canonical Markdown; no structured record, representative image, or sequence references changed. Package validation [run 34740644154](https://github.com/ginosega/fishing/actions/runs/34740644154) verified exact base ancestry, record fingerprint and Markdown SHA-256 and retained all 13 sequence frames. Pre-merge production acceptance [run 34740670930](https://github.com/ginosega/fishing/actions/runs/34740670930) passed. FISH100's feature merge source was `141198d1fbc1c651cd0b41d642d057c0f3b8a81c`.

Subsequent direct source uploads staged unreferenced Improved Clinch, Modified Uni and Trilene frames plus `KB/Knots/assets/Non-Splip Loop Knot.png`. Because canonical KB records still do not reference these files, they are not active release/offline content.

Current production:

- source: `52afc4335445706fa07d210dd8f3f2823e9636eb`
- release: `c135fa258e6e1c8ed16324a57661d17e`
- production workflow: [run 34765625164](https://github.com/ginosega/fishing/actions/runs/34765625164)
- hosted v2 files: 288
- hosted-verification artifact: `10320926230`

The exact-current-main deployment passed complete source/core validation, Chromium/WebKit preview and production acceptance, archived-v1 cutover acceptance, Pages deployment, hosted-byte verification and hosted-browser verification.

Active Knot sequences remain Palomar 13 PNG frames, Albright 15 JPG frames, Arbor 9 JPG frames, Bowline 7 JPG frames, and FG 29 JPG frames. FISH100 does not alter sequence behavior or media; it changes only Palomar's Markdown instructions/video content. Directory-only staged images remain inactive until explicitly referenced.
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