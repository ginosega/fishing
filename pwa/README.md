# Fishing Companion production application

Fishing Companion is the active PWA published at https://ginosega.github.io/fishing/.

## Current verified production — September 13, 2026

FISH106 is live and production-verified.

FISH106 shipped through [PR134](https://github.com/ginosega/fishing/pull/134). It added six canonical Gear records: KastKing Brutus Silicone Foldable Extendable Net (`Tools`), KastKing Cutthroat 7" Stainless Steel Pliers (`Tools`), Skylety Fishing Hook Sharpener (supplied type `Kayaks`), Plano Sportsman's Trunk (`Storage`), KastKing V10 Pivot Grip Fishing Rod Holder (`Storage`) and Palmyth Flexible Fishing Gloves (`Accessories`). The Brutus net and Cutthroat pliers also have canonical Markdown notes under `Gear/Equipment/content/`.

All six PNGs were user-supplied source files already uploaded under physical source `pwa/Gear/Equipment/assets/` before package promotion. FISH106 references those bytes in place rather than rewriting them. Repository byte sizes matched the supplied package metadata before promotion; the initially missing Plano Sportsman's Trunk PNG was verified at 1,016,850 bytes before the atomic batch proceeded.

Current production:

- application source: `9b419e07f9a3a56a2be1ddbfb0df1760fe2730cb`
- release: `fe94ec0a8b0c606f72847ef3fda0a5b6`
- production workflow: [run 34809970042](https://github.com/ginosega/fishing/actions/runs/34809970042)
- hosted v2 files: **342**
- production-bundle artifact: `10334457339`
- production-acceptance-evidence artifact: `10334502241`
- Pages artifact: `10334936059`
- hosted-verification artifact: `10334477509`

The exact-current-main deployment passed complete source/core validation, Chromium/WebKit preview and production acceptance, archived-v1 cutover acceptance, exact-current-main protection, Pages deployment, hosted-byte verification and hosted-browser verification. Hosted verification reported source revision `9b419e07f9a3a56a2be1ddbfb0df1760fe2730cb`, release `fe94ec0a8b0c606f72847ef3fda0a5b6`, and 342 hosted v2 files.

Canonical counts are **80 Gear, 56 KB and 5 Catches**. Current measured source-validation baselines are **110 canonical library paths** and **245 inventory references**.

FISH102–FISH105 remain live and production-verified. FISH102 added the Line-Tackle-Knot Reference and pinned-first Knot-category behavior. FISH103 relocated canonical physical domain source beneath this `pwa/` directory and fixed external/internal link targeting, Caption focus and new-KB Markdown Preview validation ordering. FISH104 added the Humminbird Fish Finder record, notes and picture. FISH105 corrected Perception Joyride 10.0 and added four KastKing tackle-management records.

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

Simple Markdown-only narrative/content edits to existing canonical content files may be made directly in GitHub. Structured record fields, paths, picture metadata/sequences and relationships should continue through Fishing Companion Edit or an equivalent source-aware workflow.

FISH091 makes online-only the default: ordinary online startup does not prepare the complete offline library. **Connection Status → Update offline library** explicitly prepares/refreshes the verified complete offline generation. Previous verified generations remain fallback until successfully replaced; failure does not destroy the prior generation.

FISH096 adds optional Knot-only explicit ordered `pictureSequence` support. Logical frame paths use `KB/Knots/assets/<knot-id>/` while physical source files are under `pwa/KB/Knots/assets/<knot-id>/`. `picture.src` equals the final frame. Ordinary browsing loads only that representative frame; the sequence viewer opens at frame 1, supports manual stepping, one-second looping Play/Pause, frame position, shared caption, keyboard controls and the existing zoom/pan gestures. Remaining frames preload only after the viewer opens. The full explicit sequence is included when the user prepares the complete offline library.

Directory contents alone never create a sequence. Every frame must be explicitly referenced by the KB record before it becomes release/offline content.

Knot authoring uses the existing Picture section with complete native multi-file selection, filename-defined ordering, automatic final-frame representation, local sequence preview and supported static↔sequence conversions. The P1 handoff records complete sequence intent/paths/file hashes atomically with picture changes and provides the exact physical repository upload-folder link under `pwa/`. It remains Prepare/Copy only.

FISH102 pins **Line-Tackle-Knot Reference** first only on KB → Knots. Remaining Knot cards are alphabetical.

FISH103 link behavior is durable: external HTTP(S) links from structured Links and rendered Markdown open in a new tab with `noopener noreferrer`; internal `gear://`, `kb://`, anchors/local and other in-app links remain same-tab. Gear/KB Caption editing must retain focus while its preview text updates, and new-KB Markdown Preview must assign a provisional required content path before whole-library validation.

FISH106 is a content/Gear release only; it does not alter the runtime, schema, offline, sequence, or authoring architecture described above.

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
