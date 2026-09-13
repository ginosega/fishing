# Fishing Companion production application

Fishing Companion is the active v2 PWA published at https://ginosega.github.io/fishing/.

## Current verified production — September 13, 2026

FISH099 is live through [PR116](https://github.com/ginosega/fishing/pull/116) plus verification-only [PR117](https://github.com/ginosega/fishing/pull/117). The four change packages update Albright content/description, activate a 9-frame Arbor sequence, add Bowline with a 7-frame sequence, and activate a 29-frame FG sequence. Package validation [run 34738967489](https://github.com/ginosega/fishing/actions/runs/34738967489) verified all source-aware bases and all 45 exact image byte counts/SHA-256 hashes; pre-merge acceptance [run 34738991146](https://github.com/ginosega/fishing/actions/runs/34738991146) passed.

Current production:

- source: `9899849be676e971e3670fe72eba7ffd66986d68`
- release: `b331a8c5575769159113a59a17b12bca`
- production workflow: [run 34740072017](https://github.com/ginosega/fishing/actions/runs/34740072017)
- hosted v2 files: 288
- hosted-verification artifact: `10312475498`

The clean final deployment passed complete source/core validation, Chromium/WebKit preview and production acceptance, archived-v1 cutover acceptance, exact-current-main guard, Pages deployment, hosted-byte verification and hosted-browser verification. The earlier first deploy had already published correct application content; PR117 repaired only the hosted verifier's stale expected KB count after Bowline increased the KB from 56 to 57.

Active Knot sequences are Palomar 13 PNG frames, Albright 15 JPG frames, Arbor 9 JPG frames, Bowline 7 JPG frames, and FG 29 JPG frames. Representative frames are their respective final frames. Directory contents alone still never activate a sequence; canonical explicit references do.
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