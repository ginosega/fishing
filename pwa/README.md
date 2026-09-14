# Fishing Companion production application

Fishing Companion is the active PWA published at https://ginosega.github.io/fishing/.

## Current verified production — September 14, 2026

FISH107 is live and production-verified.

FISH107 shipped through [PR136](https://github.com/ginosega/fishing/pull/136). It corrected the canonical **Skylety Fishing Hook Sharpener** Gear type from `Kayaks` to `Tools`. This was the only canonical source change; notes, picture, picture sequence and all other fields remain unchanged.

Current production:

- application source: `6fae3afbe8f227b4c12875c5d5e8f0d4c0c8861f`
- release: `21d203ccdef509cd99626680ae34de98`
- production workflow: [run 34811980881](https://github.com/ginosega/fishing/actions/runs/34811980881)
- feature exact-head acceptance: [run 34811426937](https://github.com/ginosega/fishing/actions/runs/34811426937) at `f36be26dddfb2da8c0957917c0fceb389192177e`
- hosted v2 files: **342**
- production-bundle artifact: `10334724772`
- production-acceptance-evidence artifact: `10335063749`
- Pages artifact: `10334664984`
- hosted-verification artifact: `10334949254`

The exact-current-main deployment passed complete source/core validation, Chromium/WebKit preview and production acceptance, archived-v1 cutover acceptance, exact-current-main protection, Pages deployment, hosted-byte verification and hosted-browser verification. Hosted verification reported source revision `6fae3afbe8f227b4c12875c5d5e8f0d4c0c8861f`, release `21d203ccdef509cd99626680ae34de98`, and 342 hosted v2 files.

Canonical counts remain **80 Gear, 56 KB and 5 Catches**. Current measured source-validation baselines remain **110 canonical library paths** and **245 inventory references**.

FISH102–FISH106 remain live and production-verified. FISH106 originally promoted Skylety using its supplied `Kayaks` type; FISH107 supersedes that classification for current production by setting it to `Tools`.

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

FISH106 and FISH107 are content/Gear releases only; FISH107's Skylety type correction does not alter the runtime, schema, offline, sequence, or authoring architecture described above.

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
