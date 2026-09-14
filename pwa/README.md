# Fishing Companion production application

Fishing Companion is the active PWA published at https://ginosega.github.io/fishing/.

## FISH108 release model

Fishing Companion uses two publication lanes. The authoritative policy is [`docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md`](docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md).

### Fast Content Release

Automatically selected only when **every changed file** is under canonical content roots `Gear/`, `KB/`, or `Catches/` beneath this `pwa/` directory. Typical examples are source-aware Gear/KB add/edit packages, Markdown, representative pictures, Knot sequence frames, and Catch records.

The fast lane performs:

1. lightweight PR review of the exact canonical diff;
2. locked dependency installation with GitHub Actions cache reuse;
3. one production build, whose source inventory validates schemas, semantic references, canonical paths, Markdown/resources, image/media integrity and unresolved-media rules;
4. `verify.mjs` verification of the exact generated release and manifest;
5. exact-current-main guarded Pages deployment after merge; and
6. dependency-free byte-for-byte hosted verification plus release/source-identity checks.

It deliberately skips Node application behavior tests, dependency audit, Chromium/WebKit installation, preview-browser regression, archived-v1/cutover regression and hosted browser acceptance because canonical content-only changes cannot alter application/runtime behavior.

### Full Application Release

Any changed file outside `Gear/`, `KB/`, or `Catches/` forces the full lane. Mixed content+code changes also force full. The full lane covers runtime/UI/service-worker changes, schemas/contracts, tests, tools/build logic, dependencies, workflows, migration/recovery/offline architecture and any other non-content change.

The full lane retains durable v1 recovery checks, dependency audit, Node tests, preview build, Chromium/WebKit preview acceptance, production-root build/verification, production browser and real archived-v1 cutover acceptance, exact-current-main protection, Pages deployment, byte-for-byte hosted verification and hosted browser verification. Manual workflow dispatch always uses full.

If eligibility is uncertain, use full.

### FISH109 rerun hardening

Pages deployment and hosted-evidence artifact names include `github.run_attempt`, so a failed deployment job can be rerun without duplicate `github-pages` artifact ambiguity. `tools/verify-hosted-fast.mjs` uses bounded backoff for transient Pages propagation/network responses while still failing persistent byte/release mismatches. The exact-current-main guard remains mandatory and prevents stale runs from deploying after `main` advances.

## Source-derived content state

Gear/KB/Catch counts, canonical path totals and inventory-reference totals are mutable content state rather than application invariants. Build/release manifests derive counts from current canonical source. Core tests compare validated maps/inventory against the actual source rather than manually maintained library totals. Full hosted browser verification compares runtime counts against the exact built manifest.

Adding a normal item/page therefore must not require editing test baselines merely because the library grew.

## Routine authoring administration

Routine Fast Content Releases do not consume application-level FISH task IDs and do not require one-off production closeout documents or root project-state edits solely to record the item publication. Git history, the content PR, workflow run and hosted verification artifact are the durable release evidence.

Project-state records are updated for architecture/product-behavior/durable-decision/backlog changes or during a requested handoff/reconciliation.

## Directory layout

| Location | Purpose |
|---|---|
| `Gear/` | Canonical physical Gear source, including structured records, category content and assets |
| `KB/` | Canonical physical Knowledge Base source, including structured records, category content and assets |
| `Catches/` | Canonical physical Catch source and notes |
| `src/` | Browser application, editor, viewer, verified offline releases and service worker |
| `tools/` | Build, source validation and local/hosted verification, including fast hosted verifier |
| `test/` | Core integrity and Chromium/WebKit full-lane acceptance, including retained v1-store/cutover coverage |
| `contracts/` | Canonical domain schema |
| `migration/` | Original reconciliation/image approvals and historical migration/recovery evidence |
| `docs/` | Requirements, designs, durable release policy and historical release evidence |
| `icon.png` | Canonical app/fav/touch icon |
| `dist/` | Generated build; ignored by Git |

Logical record/source references and generated release content remain `Gear/...`, `KB/...` and `Catches/...` even though physical repository source lives beneath `pwa/`.

## Current runtime model

Fishing Companion retains independent Gear, KB and Catch domains. Gear/KB Add/Edit provides **Prepare Changes → Copy Changes** source-aware handoffs; the browser does not write repository source directly.

Simple Markdown-only narrative edits to existing canonical content may be made directly in GitHub. Structured record fields, paths, picture metadata/sequences and relationships should continue through Fishing Companion Edit or an equivalent source-aware workflow.

FISH091 makes online-only the default: ordinary online startup does not prepare the complete offline library. **Connection Status → Update offline library** explicitly prepares/refreshes the verified complete generation; previous verified generations remain fallback until successfully replaced.

FISH096 provides optional Knot-only explicit ordered `pictureSequence` support. Logical frames use `KB/Knots/assets/<knot-id>/`; physical source is `pwa/KB/Knots/assets/<knot-id>/`. `picture.src` equals the final frame and remains representative. Directory contents alone never create a sequence. Add/replace uses complete multi-file selection; the final ordered frame becomes representative; no prior static picture is silently reused when converting into a sequence.

FISH102 pins **Line-Tackle-Knot Reference** first only on KB → Knots; remaining Knot cards are alphabetical.

FISH103 keeps external HTTP(S) links new-tab with `noopener noreferrer`, internal navigation same-tab, Caption focus stable, new-KB Markdown Preview validation ordering correct, and generated GitHub upload-folder links on physical `/pwa/...` source paths.

## Fishing Companion v3

**Fishing Companion v3** is the preferred name for the deferred future phase historically tracked as `FISH-TODO-077/P2`. It remains **DEFERRED**. Authentication, direct GitHub save/upload, integrated uploads, offline authoring/outbox/sync, Catch authoring and multi-user generalization are not current production.

## Development and publication

Use Node 24 and locked `package-lock.json`.

`.github/workflows/fishing-production.yml` is the sole active publisher and automatically classifies each application/content PR or `main` push into Fast Content or Full Application Release from the changed-file set. Documentation-only changes remain excluded from publication triggers.

`tools/verify-hosted-fast.mjs` is intentionally dependency-free and is used only after a fast content deployment to compare every hosted file against the exact built `dist/` tree and verify release/source identity; FISH109 adds bounded retry/backoff for transient propagation/network failures. `tools/verify-hosted.mjs` remains the full browser-backed hosted verifier for application releases.

Historical implementation/release details remain in Git history and dated records under `docs/`; exact current production identity should be read from current workflow/Pages evidence rather than assumed from old narrative documents.
