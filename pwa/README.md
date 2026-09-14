# Fishing Companion production application

Fishing Companion is the active PWA published at https://ginosega.github.io/fishing/.

## Current verified production — September 13, 2026

FISH102 and FISH103 are live and production-verified.

FISH102 shipped through [PR124](https://github.com/ginosega/fishing/pull/124). It added the **Line-Tackle-Knot Reference** Knot entry, Markdown and picture and pins that card first only on KB → Knots while keeping the rest alphabetical. FISH102 verified production was source `4912f93149e9de1e9cde9ff5176b4a4831a67812`, release `beff9138c96489abd9723c5fcfeef0ff`, [run 34770966552](https://github.com/ginosega/fishing/actions/runs/34770966552), hosted-verification artifact `10322381375`.

FISH103 shipped through feature [PR125](https://github.com/ginosega/fishing/pull/125), followed by verifier-only [PR126](https://github.com/ginosega/fishing/pull/126) and [PR127](https://github.com/ginosega/fishing/pull/127). It relocates canonical physical domain source under this `pwa/` directory, fixes external/internal link targets, preserves Caption focus during preview updates and fixes new-KB Markdown Preview validation ordering. PR126/PR127 changed only hosted-verifier dialog handling.

Current production:

- source: `94772e62788fa98903930e4b5649fabb9629c6d0`
- release: `b8c8222697222f1dd43861427d5006fb`
- production workflow: [run 34795289032](https://github.com/ginosega/fishing/actions/runs/34795289032)
- hosted v2 files: **327**
- production-bundle artifact: `10328869743`
- production-acceptance-evidence artifact: `10329538071`
- Pages artifact: `10329392228`
- hosted-verification artifact: `10329313590`

The exact-current-main deployment passed complete source/core validation, Chromium/WebKit preview and production acceptance, archived-v1 cutover acceptance, exact-current-main protection, Pages deployment, hosted-byte verification and hosted-browser verification. Hosted verification explicitly passed the FISH103 physical-source, link-target, Caption-focus and new-KB-preview checks.

Canonical counts are **69 Gear, 56 KB and 5 Catches**.

## Directory layout

| Location | Purpose |
|---|---|
| `Gear/` | Canonical physical Gear source, including structured records, category content and assets |
| `KB/` | Canonical physical Knowledge Base source, including structured records, category content and assets |
| `Catches/` | Canonical physical Catch source and notes |
| `src/` | Browser application, editor, viewer, verified offline releases and service worker |
| `tools/` | Build, source validation and local/hosted verification |
| `test/` | Core integrity and Chromium/WebKit acceptance, including retained v1-store/cutover coverage |
| `contracts/` | Canonical domain schema |
| `migration/` | Original reconciliation/image approvals and historical migration evidence; no executable migration remains |
| `docs/` | Approved requirements/designs, exact user feedback, technical references and release/recovery evidence; see [`docs/README.md`](docs/README.md) for current-authority vs historical-record rules |
| `icon.png` | Canonical user-supplied app/fav/touch icon |
| `dist/` | Generated build; ignored by Git |

Logical record/source references and generated release content remain `Gear/...`, `KB/...` and `Catches/...` even though the physical repository source lives beneath `pwa/`. The build's default source root is this directory. There is no production dependency on deleted repository-root `Gear/`, `KB/`, `Catches/`, the former root `v2/`, deleted v1 runtime/assets, `History/` or `Topics/`.

## Current runtime model

Fishing Companion retains independent Gear, KB and Catch domains. Gear/KB Add/Edit provides Prepare Changes → Copy Changes source-aware handoffs; the browser does not write repository source directly.

FISH091 makes online-only the default: ordinary online startup does not prepare the complete offline library. **Connection Status → Update offline library** explicitly prepares/refreshes the verified complete offline generation. Previous verified generations remain fallback until successfully replaced; failure does not destroy the prior generation.

FISH096 adds optional Knot-only explicit ordered `pictureSequence` support. Logical frame paths use `KB/Knots/assets/<knot-id>/` while physical source files are under `pwa/KB/Knots/assets/<knot-id>/`. `picture.src` equals the final frame. Ordinary browsing loads only that representative frame; the sequence viewer opens at frame 1, supports manual stepping, one-second looping Play/Pause, frame position, shared caption, keyboard controls and the existing zoom/pan gestures. Remaining frames preload only after the viewer opens. The full explicit sequence is included when the user prepares the complete offline library.

Directory contents alone never create a sequence. Every frame must be explicitly referenced by the KB record before it becomes release/offline content.

Knot authoring uses the existing Picture section with complete native multi-file selection, filename-defined ordering, automatic final-frame representation, local sequence preview and supported static↔sequence conversions. The P1 handoff records complete sequence intent/paths/file hashes atomically with picture changes and provides the exact physical repository upload-folder link under `pwa/`. It remains Prepare/Copy only.

FISH102 pins **Line-Tackle-Knot Reference** first only on KB → Knots. Remaining Knot cards are alphabetical.

FISH103 link behavior is durable: external HTTP(S) links from structured Links and rendered Markdown open in a new tab with `noopener noreferrer`; internal `gear://`, `kb://`, anchors/local and other in-app links remain same-tab. Gear/KB Caption editing must retain focus while its preview text updates, and new-KB Markdown Preview must assign a provisional required content path before whole-library validation.

## Fishing Companion v3

**Fishing Companion v3** is the preferred name for the deferred future phase historically tracked as `FISH-TODO-077/P2`. It remains **DEFERRED**. Future scope includes authentication, direct GitHub save/upload, integrated uploads, offline authoring/outbox/sync, Catch authoring and multi-user generalization.

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

Routine authoring changes update canonical JSON/Markdown/pictures under `pwa/Gear/`, `pwa/KB/` and `pwa/Catches/`. Do not add per-item JavaScript helpers, one-off release scripts/tests or routine release Markdown. Reuse the source-derived validation. Significant application requirements/design/release evidence belongs in `docs/`.

Historical implementation/release details remain in Git history and dated records under `docs/`; current continuation state is in the repository-root README/Context/TODO/Decision Log/bootstrap. Use [`docs/README.md`](docs/README.md) when interpreting dated project records so milestone-era “current” statements are not mistaken for present project state.