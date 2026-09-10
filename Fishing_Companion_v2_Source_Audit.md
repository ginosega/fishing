# Fishing Companion v2 — Source, Dependency and Data Audit

**Status:** Original approved body preserved. User-authorized v2 production is published and verified; seven absent pictures are explicitly deferred. Current evidence: [production release](Fishing_v2_Production_Release_2026-09-10.md). Dated phase/status statements in the body below are historical.
**Audit date:** September 8, 2026, Pacific time.
**Authoritative source:** `1fa82a0cb653b8205bc8a45a1cf4608a616bf3b2` (approved baseline merge).
**Verified v1 build:** `4f2fe70f47da9cca3704722de87f7282bcc00f83`, production run #312 / `34237232075`.

## 1. Scope and evidence

The audit inspected the complete tracked source snapshot, all three structured datasets, all authored content, the media registries, local image bytes, the actual successful production bundle, JavaScript dependencies, build/test scripts, service worker and release configuration. The audit was performed without changing v1 application code, source records, images or production. The source snapshot was obtained through an isolated read-only GitHub Actions workflow; the temporary audit tooling is not part of the proposed production implementation.

- [Source audit run #2 — success](https://github.com/ginosega/fishing/actions/runs/34312003986), head `c7bb4690a314721c332bd4ef7351c48bb3b743c7`.
- [Complete source/audit artifact](https://github.com/ginosega/fishing/actions/runs/34312003986/artifacts/10088691303), containing `source-snapshot.zip`, `inventory.json`, and `summary.json`. Artifact SHA-256: `ff909f020af9460b8d745a4bed5c46bccd199f695ac84626a8cd8cca65f5d0cb`. The source ZIP is 20,625,886 bytes, SHA-256 `dc9ba62b7d4bcc904c944348c640f544796e426329294b5df7105b5495fb66af`. This artifact has a 30-day retention; the authoritative source remains in Git history.
- [Successful production run #312](https://github.com/ginosega/fishing/actions/runs/34237232075), with the actual Pages deployment and archived `fishing-pwa` bundle, artifact ID `10060378687`, SHA-256 `83100e9cf2788b2d33959b39a6bb63fdd0e78c5e512936a07e46b22632bf7dbf`.
- The audit-branch snapshot contains two additional audit-only files. Excluding them yields 247 files from the approved main tree. The source/data/media files are unchanged relative to the pinned main baseline. The published bundle contains 216 files and was built before the documentation-only v2 approvals; its source datasets match the current source records.

The original requirements and all fourteen user decisions remain authoritative. A successful old build is not proof of a complete offline library or a correct future migration. The audit distinguishes confirmed defects, expected legacy design, and tests that have not yet been performed.

## 2. Inventory and source integrity

| Area | Verified result |
|---|---|
| Tracked source | 247 files excluding audit instrumentation. Full path, byte count, Git blob and SHA-256 inventory is retained in the audit artifact. |
| My Gear | 66 records: 3 paired setups, 4 Line, 5 Weights, 4 Snaps/Swivels, 9 Hooks, 35 Lures, 3 Bait, 3 Equipment. |
| Knowledge Base | 54 entities: 8 Locations, 7 Species, 22 Gear Guides, 7 Techniques, 10 Knots. |
| Catch Log | Five individual historical catches. |
| Authored Markdown | 101 documents: 42 Gear Notes, 54 KB articles, five Catch Notes. All 101 source files are byte-identical to their published copies. |
| Source images | 36 user/content images, 20,378,972 bytes. The trusted application icon is separate. |
| Published image assets | 88 files, 27,337,125 bytes, including generated/remote captures and some unused assets. This is not the authoritative source-image count. |
| Published Gear media | 65 media records with 66 owner/component assignments. One owned source media record is not published. |
| KB pictures | 30: 27 local paths and three remote URLs. Six local pictures reuse published Gear assets. |
| Source/display data | Gear and Catch JSON are identical. KB has 25 source/display entity differences, all confined to the expected picture overlay; no non-picture fields differ. |
| IDs and relationships | All source domain IDs are unique. Existing Catch Species, Location and owned Lure/Bait references resolve to the correct domains/categories. |
| Markdown references | A CommonMark-aware static pass found 227 authored links, including 89 KB and 62 Gear stable-ID links, with no unresolved source targets. No authored Markdown images are currently present. |

The final source tests and published-bundle tests were run locally in an isolated copy using Node 22. All 12 pre-build source tests and four `--dist` tests passed. `verify-final-bundle.mjs` also passed and reported 66 Gear, 54 KB, five Catches, 65 media and 122 offline document assets. The successful v1 CI #312 provides the independent historical production-build result. This does not substitute for v2 browser tests or a new deterministic v2 build.

### What the source inventory does not include

The repository snapshot cannot reveal browser-only IndexedDB records, unsaved forms, or files that were never committed. It also cannot prove that every external image URL remains retrievable. There is no known local-only user data, but that remains an unverified device-level fact. The planned one-time browser diagnostic is required before retiring the old store.

## 3. Domain audit and migration mapping

### Gear and paired components

The source contains 63 ordinary Gear records and three paired setups. Each setup embeds independently recorded rod and reel facts. The approved migration produces 69 Gear records: 63 unchanged ordinary items plus six independent components. All unaffected IDs remain stable. The following IDs and content filenames are the proposed deterministic mapping; no component facts have yet been changed.

| Old setup | Component | New ID | Approved type | New Notes filename |
|---|---|---|---|---|
| `setup-spinning` | Rod | `daiwa-tatula-xt-rod` | Spinning rod | `Daiwa Tatula XT.md` |
| `setup-spinning` | Reel | `daiwa-exceler-lt-reel` | Spinning reel | `Daiwa Exceler LT.md` |
| `setup-baitcasting` | Rod | `shimano-zodias-rod` | Baitcasting rod | `Shimano Zodias.md` |
| `setup-baitcasting` | Reel | `shimano-slx-dc-xt-71hg-reel` | Baitcasting reel | `Shimano 22 SLX DC XT 71HG.md` |
| `setup-spincasting` | Rod | `pflueger-president-spincast-rod` | Spincasting rod | `Pflueger President Spincast Combo - Rod.md` |
| `setup-spincasting` | Reel | `pflueger-president-spincast-reel` | Spincasting reel | `Pflueger President Spincast Combo - Reel.md` |

All six IDs are absent from the existing Gear dataset. Each component's current Manufacturer, Model, Specifications and Links must be copied exactly. The new Name may distinguish the record, but must not imply a newly identified model. The original setup Notes must be copied byte-for-byte into both component documents. The current source SHA-256 values and complete component objects are retained in the machine audit inventory. No automatic rewriting of the copied prose is authorized.

The existing media registry has five component pictures: two spinning, two baitcasting and the Pflueger reel. The unidentified spincasting rod has no separately established picture. Its picture remains absent until supplied; do not duplicate the reel image by inference. The combined setup IDs are retired only after their references are reconciled. A stale setup link must not silently be redirected to one of the two components. Existing Catch setup references are all null, so the five historical catches require no setup attribution migration.

### Knowledge Base

The flat five-type entity model and 54 complete articles can be retained conceptually. The migration removes picture source/display overlays and unnecessary metadata, not article content. The current article names, descriptions, IDs, authored links, and text remain authoritative. The approved Gear Guides/Techniques editorial rule is used only for explicit reclassification; the audit found no reason to silently recategorize existing entries. Human-readable content paths and category folders will be mapped in the migration manifest, with every old path retained for reconciliation.

### Catch Log

All five records contain valid known Species, Location and Lure references and have null setup, technique and independent picture fields. The approved text Size values are `13 in`, `10 in`, `12 in`, `12 in`, and `12 in`, respectively, retaining their existing dates and original measurement units. All five authored Notes are preserved exactly. The original structured measurement objects and lure name snapshots are retained as migration evidence, not invented or silently discarded. The v2 model does not require historical data enrichment.

## 4. Media audit and concrete exceptions

The media model is the largest preservation issue. The source has 68 legacy remote-media definitions, 62 entries in `media-owners.json`, and 11 local Gear media entries (four are not in the legacy ownership registry). The published media inventory contains 65 records, including 11 local overrides and 54 remotely fetched records. Three of those remotely fetched records have byte-identical repository source images. The remaining 51 have no identical local source in the current repository. The 27 local KB pictures include six references to Gear media, leaving 21 independent local KB pictures; three additional KB pictures are remote URLs.

**Result:** 51 distinct Gear captures plus three independent KB pictures need approved local source files to meet the no-remote-image P1 requirement. Six KB pictures that reuse Gear media do not require six additional copies. All 51 existing Gear capture bytes are available in the successful archived bundle; they are not lost. The default is to obtain user-supplied local replacements, as approved. A one-time decision to adopt the existing captured bytes as local originals would be a separate explicit exception, not an automatic web-sourcing operation.

### Image defects and missing pictures

- `pwa/assets/gear-source/tsuridamashii-snap-swivels.webp` is an active image whose RIFF/header checks pass but full decoding fails. It is also present in the published bundle. Replace it with a valid image; simply matching the current hash or file extension is insufficient.
- `pwa/assets/kb/species/kokanee-phases.webp` is an unused legacy file with an inconsistent RIFF length and failed decoding. The active Kokanee picture is `kokanee-phases.png`, which is valid. Retain the old file in Git history and omit it from v2 only after reference reconciliation.
- `rapala-original-floating-f3` has an owned media definition but no published image record in the verified build. The source Gear item `rapala-original-floating` must not be confused with its media ID. It may remain without a picture until the user supplies one.
- `generic-1-inline-spinner` has no current representative-picture assignment. This is an allowed absent picture, not a missing-file failure.
- One published Gear image is AVIF (`river2sea-whopper-plopper-60.avif`). It requires an approved JPEG/PNG/WebP/GIF replacement rather than an automatic conversion.
- All current repository content images that could be decoded are within the approved 10 MiB, 6,000-pixel and 36-megapixel limits. The published images likewise have no size/dimension exceedances. The two decoding failures above are the actual policy exceptions; the trusted `icon.svg` is not user content.

The previous heuristic scan's zero-error result was not a complete media audit. It checked existence and headers but did not fully decode images, resolve every overlay, or distinguish remote-only captures. The detailed audit supersedes that heuristic conclusion.

### Remote-only inventory

The 51 Gear media IDs needing local sources are listed below. Each is traceable in the audit artifact to its exact owner, published asset, size and SHA-256. The list records existing images, not suggested purchases or inferred ownership.

| Group | Media IDs |
|---|---|
| Rods/reels | `daiwa-tatula-xt`, `daiwa-exceler-lt`, `shimano-zodias`, `shimano-slx-dc-xt-71hg`, `pflueger-president-spincast` |
| Line/weights/snaps | `powerpro-super8-slick-v2`, `seaguar-invizx`, `eagle-claw-egg-sinkers`, `eagle-claw-trolling-sinker`, `top-brass-glass-beads`, `vmc-crankbait-snaps` |
| Hooks | `gamakatsu-octopus-hook`, `vmc-redline-weedless-wacky-neko`, `vmc-crossover-rings`, `zman-finesse-shroomz`, `gamakatsu-g-finesse-drop-shot`, `owner-twistlock`, `gamakatsu-ewg-worm-hook` |
| Lures | `zman-original-chatterbait`, `zman-elite-evo`, `strike-king-red-eyed-special`, `sixth-sense-divine-spinnerbait`, `rebel-crawfish`, `berkley-flicker-shad-5`, `strike-king-kvd-square-bill-1`, `berkley-money-badger`, `berkley-stunna`, `rapala-dt06`, `rapala-ripstop`, `rapala-husky-jerk`, `mepps-aglia-3`, `macks-wedding-ring`, `kastmaster`, `dick-nite-spoon`, `luhr-jensen-dodger`, `macks-pee-wee-hoochie`, `rebel-pop-r`, `river2sea-whopper-plopper-60`, `strike-king-premier-pro-model-jig`, `strike-king-tour-grade-football-jig`, `yum-christie-craw`, `strike-king-rage-craw`, `sixth-sense-divine-swimbait`, `berkley-power-jerk-shad`, `fin-sanity-bluegill`, `yamamoto-senko`, `zman-ned-rig-kit` |
| Bait | `berkley-gulp-minnow`, `berkley-powerbait-trout-dough`, `berkley-powerbait-trout-nuggets`, `berkley-magnum-power-eggs` |

The three standalone KB remote pictures are `technique-popper`, `technique-whopper-plopper`, and `species-perch`. Six other KB entries reuse Gear assets: `technique-jigs`, `technique-spinnerbait`, `technique-chatterbait-bladed-jig`, `technique-crankbait`, `technique-jerkbait`, and `technique-swimbait-soft-jerk-shad`. These must share the corresponding approved local files rather than create unnecessary duplicate media records.

## 5. Dependency and implementation audit

The repository contains 33 JavaScript modules/tests under `pwa/` and no package.json, npm lockfile or installed third-party runtime package dependency. The production application uses native browser APIs, local ES modules, Node built-ins for the build, and the current custom Markdown renderer. A static import scan found 132 candidate module edges; its only apparent missing local import is a dynamically generated fixture in `runtime-versioning.test.mjs`, not a missing production module. The actual source tests pass. There is no evidence that a large framework is needed.

| Current area | Source evidence | Decision for v2 |
|---|---|---|
| Domain validation | `gear-model.js`, `kb-model.js` | Replace schema4 paired special cases with three small independent contracts and shared primitives. Keep feature-specific relationship validation. |
| Persistence | `gear-store.js` | Remove seed/import IndexedDB authority from P1; preserve read-only migration/export utilities until local differences are checked. |
| Navigation | `gear-app.js`, `kb-app.js` | Replace competing hash listeners and route interception with one explicit router. |
| Media | `media-ui.js`, four media registries, `kb-picture-model.js`, `apply-local-media.mjs` | Preserve the viewer interaction; replace owner/source overlays with direct optional picture fields and one safe file resolver. |
| Markdown | `markdown-render.js`, `kb-authoring-model.js` | Retain existing content semantics; use a tested CommonMark parser and safe rendering boundary rather than extend the custom parser. |
| Authoring | `gear-app.js`, `kb-authoring.js`, `kb-authoring-model.js`, `authoring-common.js`, `promote-kb-change.mjs` | Preserve form UX and Preview, remove redundant full-domain/source snapshots and special setup restrictions. |
| Build | `build.mjs`, `apply-authored-notes.mjs`, `apply-local-media.mjs`, `version-runtime.mjs`, `verify-final-bundle.mjs` | Replace sequential mutation/promotion stages with one source-validation/build operation and final output validation. |
| Network enrichment | `build.mjs` image discovery, remote fetch and YouTube oEmbed | Remove. All content/image inputs must exist locally before a successful v2 build. |
| Offline | `sw.js`, asset manifests | Replace incomplete/optional caching and immediate old-cache deletion with a verified complete release and last-known-good strategy. |
| Tests | Dated acceptance tests, model/routing/authoring/media tests, final-content tests | Retain meaningful behavioral/integrity coverage; migrate historical expectations into one-time fixtures, not permanent content locks. |
| Styling | `styles.css`, current cards/detail/viewer | Preserve visual language and useful CSS. Refactor only as required by the new direct-rendered architecture. |

### Confirmed reliability risks

The Gear and KB initializers use different persistence/read patterns and separate route ownership. The build has multiple stages that mutate generated data after earlier validation. Some remote media failures are logged and skipped, producing partial images rather than a failed complete-media build. The service worker's core cache includes data, but Gear images are added with `Promise.allSettled`; cache activation deletes older versions before a complete-library verification. These are concrete reasons to simplify the architecture and strengthen offline guarantees. They do not establish that every current browser failure is caused by the same mechanism.

The current custom Markdown renderer is not being declared insecure solely because it is custom. Its behavior will be compared against the approved content corpus. The replacement must preserve nested/loose lists, tables, code, images, ordinary links and stable-ID navigation while rejecting unsafe executable content. Any actual security finding must be demonstrated by a test rather than inferred from implementation style.

## 6. CI failure taxonomy and release approach

The available source and release evidence establishes the following classes:

| Class | Evidence | Resolution principle |
|---|---|---|
| Frozen user content | Production #257/#258, documented in `Fishing_Recovery_Closeout_2026-09-07.md`: a legitimate expanded Bonafide Notes file failed exact four-line assertions. | Validate durable facts, references and behavior; do not lock complete user-authored prose. |
| Frozen source path | Production #311, run `34237203787`: `final-content.test.mjs` attempted to stat a deleted Bonafide image source. #312 succeeded after the next source update. | Resolve current authoritative references, validate active files and preserve actual bytes without historic filename locks. |
| Source/derived ordering | PR60 closeout documents an initial preparation failure due to missing built media, followed by corrected build-before-promotion validation. | One deterministic build boundary; no partially materialized source/overlay state. |
| Permission boundary | PR60 closeout documents a denied runner workflow write that was subsequently handled through an authorized repository operation. | Never bypass denied permissions; use minimal scoped permissions and authorized connector writes. |
| Audit tooling error | This audit's first isolated run failed because shallow checkout did not contain HEAD^. Run #2 passed after checkout depth was corrected. | Test audit tooling, retain failure evidence and avoid hiding real errors. |

Remote network variability, overlapping release cancellation, stale local state and application initialization failures are supported risks from the source, but are not asserted as causes of particular uninspected failure emails. The Gmail path was previously denied and has not been retried. A complete historical classification of all 79 failed workflow runs is not claimed or required for the v2 source inventory. The production gate should make future failures actionable with one normal workflow, exact source revision, clear diagnostics, and no disposable promotion workflows.

## 7. Remaining gates before migration or cutover

The repository-source audit is complete. The following are concrete migration/acceptance tasks, not a request to reopen the requirements inventory:

1. **Browser-only data:** run the one-time read-only IndexedDB comparison on the relevant browsers/devices, export any differences and reconcile them before disabling the old store. No browser storage is to be cleared as part of this audit.
2. **Media:** resolve the 51 remote-only Gear captures, three standalone KB remote images, one malformed active WebP, and the absent Rapala picture choice. Preserve existing captured bytes until replacements are accepted. The user may supply replacements or explicitly approve a one-time reuse of archived captures, if desired; no automatic web acquisition is permitted.
3. **Migration dry run:** transform a pinned snapshot into the approved schema, duplicate setup Notes exactly, reconcile all old setup references, validate every source/destination field and hash, and report all intentional differences.
4. **Offline/device acceptance:** measure the actual complete v2 bundle, validate and decode all required images, test the atomic offline install/update/recovery behavior, and verify supported device/browser workflows. Browser quota and eviction limitations must be reported honestly.
5. **Cutover:** preserve the final current v1 source and published artifact, run v2 at the separate preview URL, reconcile direct-main edits, then replace production only after all blocking exceptions are resolved.

The implementation-ready technical design is in [Fishing_Companion_v2_Technical_Contracts.md](Fishing_Companion_v2_Technical_Contracts.md). Phase 1 and the design portion of Phase 2 are complete; no migrated data, v2 runtime, or production release is represented as finished. The first vertical slice and migration remain the next authorized implementation work to schedule, with the specific media/device gates above tracked in the canonical TODO.
