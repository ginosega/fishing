# Fishing Companion v2 — Minimal Architecture and Technical Contracts

> Repository layout: production source/tests/contracts now live under `pwa/`; this document is retained PWA reference. Old `v2/`, v1 `pwa/`, History and Topics paths in dated evidence refer to the [pre-cleanup snapshot](https://github.com/ginosega/fishing/blob/edca2a3f04fc8c32dec65b9330d43944be1a561c/). Current instructions: [PWA README](../README.md).

**Status:** Original approved body preserved. User-authorized v2 production is published and verified; seven absent pictures are explicitly deferred. Current evidence: [production release](Fishing_v2_Production_Release_2026-09-10.md). Dated phase/status statements in the body below are historical.
**Date:** September 8, 2026, Pacific time.
**Source baseline:** `1fa82a0cb653b8205bc8a45a1cf4608a616bf3b2`.
**Related:** [Approved Baseline](Fishing_Companion_v2_Approved_Baseline.md) · [Source Audit](Fishing_Companion_v2_Source_Audit.md) · [JSON Schema](../contracts/schema.json).

## 1. Architectural decision

Build a small, framework-free JavaScript/ESM application with three explicit domain models, shared rendering/validation primitives, a single router, and one deterministic repository-to-static-bundle build. GitHub owns durable facts, authored Markdown and original images. The browser reads a complete published snapshot. P1 does not contain an editable IndexedDB database, synchronization engine, backend, account system, or secret.

The goal is fewer independent concepts, not forcing every domain into an identical entity schema. Gear is owned inventory; KB is reusable authored knowledge; Catch is a historical event. Their shared concerns are identity, paths, pictures, links, validation and display. Only Catch has the three approved structured relationships. No generic relationship graph, media ownership registry or abstract schema-management framework is introduced.

The application is divided into small modules by responsibility rather than a large framework: source/domain validation, content/path resolution, repository snapshot loader, router, shared UI components, Gear views/editor, KB views/editor, Catch views, Markdown renderer, picture viewer, and offline/update controller. An explicit state change renders the affected view; there is no MutationObserver patching, competing route ownership, or post-render media association pass. Existing CSS and viewer behavior are reused where practical.

## 2. Authoritative source and schema contract

The canonical source layout is:

```text
Gear/
  gear.json
  Rods-Reels/{assets,content}/
  Line/{assets,content}/
  Weights/{assets,content}/
  Snaps-Swivels/{assets,content}/
  Hooks/{assets,content}/
  Lures/{assets,content}/
  Bait/{assets,content}/
  Equipment/{assets,content}/
KB/
  kb.json
  Locations/{assets,content}/
  Species/{assets,content}/
  Gear-Guides/{assets,content}/
  Techniques/{assets,content}/
  Knots/{assets,content}/
Catches/
  catches.json
  content/
v2/
  contracts/schema.json
  src/                 # new application and build source
```

Braces in the diagram represent two sibling directories, not literal folder names. Folder keys remain stable when display labels change; paths are explicit record properties, not inferred from Type, Name or ID. A reclassification does not automatically move existing content. New files use the destination category. An explicit move is a separate validated operation. Catches have no separate representative-image folder because their pictures are derived from Species; Markdown images may reuse approved local paths in the Gear/KB asset directories.

### Schema version and canonical representation

The initial v2 domain schema version is `2` for each domain. This is a new contract epoch and does not imply a migration from every historical integer version. Each root contains `schemaVersion` plus its domain array (`items`, `entities`, or `catches`). There is no manually incremented content dataVersion. The Git source revision is recorded in generated build metadata, not duplicated in every authoritative record.

The machine-readable JSON Schema is [v2/contracts/schema.json](../contracts/schema.json), using JSON Schema draft 2020-12. It defines the exact permitted fields and rejects unknown properties. The three roots are independently validated against `#/$defs/gearBundle`, `#/$defs/kbBundle` and `#/$defs/catchBundle`. The schema was checked with a draft-2020-12 validator and exercised against three valid and three invalid representative fixtures. This is contract validation, not a claim that the future migration has passed.

Optional properties are omitted when absent, rather than represented by unnecessary empty objects or nulls. Boundary input may be normalized from null/empty values before validation; it must not silently discard a meaningful value. Ordered arrays retain author order. No source JSON contains inline Markdown, media provenance, owner tables, or generated display metadata.

### Gear record

```json
{
  "id": "vmc-crs-crankbait-snaps",
  "category": "snaps-swivels",
  "type": "Snaps",
  "name": "VMC CRS Crankbait Snaps",
  "manufacturer": "VMC",
  "model": "CRS",
  "specifications": [{ "label": "Size", "value": "1" }],
  "links": [{ "label": "VMC", "url": "https://example.com/product" }],
  "picture": { "src": "Gear/Snaps-Swivels/assets/VMC CRS Crankbait Snaps.jpg", "caption": "VMC CRS Crankbait Snaps" },
  "notes": "Gear/Snaps-Swivels/content/VMC CRS Crankbait Snaps.md"
}
```

This is a schema example, not a new owned record. Required: ID, Category, Type and Name. Optional: Manufacturer and Model as plain text, ordered Specifications and Links, one Picture and one Notes path. A specification has a required value and an optional label; a link has label and HTTP(S) URL. The existing eight category keys are retained. Rods & Reels permits exactly the six approved types; Equipment retains Kayaks, Tools, Tackle Management, Electronics, Storage and Accessories. Other current type vocabularies are preserved, with repository-managed taxonomy changes through chat. Type labels do not determine IDs or file paths. No setup, line assignment, stock quantity, purchase ledger or installed-accessory relationship fields.

### Knowledge Base record

```json
{
  "id": "location-silver-lake-whatcom",
  "type": "location",
  "name": "Silver Lake, Whatcom County",
  "description": "Freshwater fishing reference",
  "picture": { "src": "KB/Locations/assets/Silver Lake.jpg", "caption": "Silver Lake" },
  "content": "KB/Locations/content/Silver Lake, Whatcom County.md"
}
```

Required: ID, Type, Name and Content path. Description is optional and limited to 80 characters. Picture is optional. Internal type keys remain `location`, `species`, `equipment`, `technique`, `knot`; Equipment displays as Gear Guides. The existing complete Markdown remains a single article per entry. There are no extra atomic guidance, location, species, tag, kind or graph fields. The example description is illustrative and must not overwrite the actual existing Silver Lake description.

### Catch record

```json
{
  "id": "catch-2026-07-27-silver-lake-largemouth-01",
  "date": "2026-07-27",
  "time": "20:00",
  "size": "13 in",
  "speciesId": "species-largemouth-bass",
  "locationId": "location-silver-lake-whatcom",
  "lureOrBaitId": "berkley-flicker-shad-5",
  "notes": "Catches/content/2026-07-27 Silver Lake largemouth.md"
}
```

Required: stable ID and valid local calendar Date. All other fields are optional. Time is local `HH:MM`, without an invented timezone or conversion. Size is plain text; original units are retained. The three optional IDs must resolve to KB Species, KB Location, and owned Gear Lures/Bait respectively. Only one owned Lure/Bait may be selected. Unknown identification or non-owned tackle may be described in Notes without inventing a reference. No independent Catch picture, setup, technique, structured measurements, name-snapshot requirement, or reverse relationships.

The Catch picture is resolved at display time from its Species record. Only Species, Location and Lure/Bait pages derive Catch History from forward Catch references. An absent reference is not an error. Deleting or reclassifying a referenced entity requires explicit reference reconciliation rather than silently creating a dangling link.

### Shared semantics beyond JSON Schema

The JSON Schema controls shape and basic bounds. One shared semantic validation layer additionally checks unique IDs within each domain; exact taxonomy membership; actual calendar validity; reference existence and category/type; valid HTTP(S) URL parsing; safe repository paths; case/Unicode collision rules; file existence; media format/dimensions; and safe Markdown links. A complete candidate dataset is validated after each proposed change. Schema versions change only for structural changes; content changes use the source revision.

Existing IDs are preserved wherever possible. New IDs are generated once, guaranteed unique, and never regenerated when a display Name or Category changes. ID prefixes are not used as taxonomy or path authorities. No permanent setup-ID aliases are added. The one-time migration records the old-to-new component mapping and explicitly resolves any references that cannot be mapped to one unambiguous target.

## 3. Path, media and Markdown contracts

### Paths and filenames

Canonical record paths are repository-root-relative POSIX paths without a leading `./`, for example `Gear/Lures/assets/My Lure.jpg`. They are not URL strings. The resolver joins them only under the approved repository root; it must reject absolute paths, traversal, backslashes, NUL/control characters, unsafe percent-encoding and symlink escapes. It validates the path before reading or copying a file. A missing required asset is a build error, not an automatic network lookup.

Preserve user-chosen human-readable filenames, including Unicode, spaces, capitals, digits, parentheses, hyphens, underscores and ordinary safe punctuation. Normalize to NFC for validation and collision comparison. Reject empty/dot components, separators, control/bidi characters that could conceal a path, Windows reserved device names (including names with extensions), trailing spaces/dots and platform-forbidden punctuation. The filename limit is 180 Unicode characters and 240 UTF-8 bytes; the full repository-relative path is limited to 240 UTF-8 bytes. These are conservative cross-platform path bounds, not a requirement to slugify names. Use a canonical case-insensitive comparison for collisions. Two different source paths must not be accepted if they could collide on Windows or a case-insensitive filesystem.

Only the final filename extension determines the intended file type; actual bytes must agree. A display-name edit never renames its file. URL generation percent-encodes individual path segments exactly once, retains the site/release base path, and never treats an untrusted path as a URL to fetch from an arbitrary origin. Markdown relative links resolve against the owning article's canonical directory. Entity navigation uses stable-ID URIs rather than physical filenames.

### Representative pictures and file operations

A Picture is either absent or `{src, caption?}`. Its source is a local repository path. Caption is authored by the user; display alt text falls back to the entity Name when no useful caption exists. There is no Alt Text editor, source/credit/provenance field, media ID, owner graph, or product destination. The viewer receives this object directly and retains the approved enlarge, close, zoom, pan, pinch and caption behaviors.

Only JPEG/JPG, PNG, WebP and GIF are accepted as user-content image formats. Validate actual format and extension, maximum 10 MiB, width/height at most 6,000, and at most 36 megapixels. Full decoding must detect corrupt payloads, not just matching signatures. Animated images require bounded validation of all frames; no automatic resize, crop, compression or format conversion occurs. The trusted application icon is a separate asset class. No HEIC/HEIF, AVIF, user SVG or remote image source is permitted in P1. Existing exceptions are handled through the migration audit, not silently deleted.

An explicit image replacement may use the same filename or a new safe name. The current file's hash and the desired file's hash are checked against the user's intent. The source image bytes are copied unchanged into the generated bundle. Intentional reuse is supported by referencing the same path. Removal clears an entity's association; it does not automatically delete a shared file. A source file may be deleted only through an explicit operation after all references are checked. Git history preserves retired bytes. No permanent media ownership table is required; reference checks are derived from the records and Markdown.

### Markdown and links

All three domains use ordinary authored Markdown. There is no mandatory template, YAML front matter, inline narrative database, rich CMS, automatic video enrichment or generated caption. Preserve original UTF-8 text and line endings/bytes during migration unless a specific transformation is approved. Rendering may normalize line endings in memory, but source files are not rewritten merely to satisfy a renderer.

Use a tested CommonMark parser with tables enabled and a strict safe-rendering boundary. Raw executable HTML, scripts, event handlers, unsafe URL schemes, remote images and embedded external objects are not allowed. Ordinary external HTTP(S) hyperlinks remain valid and open in the same tab. Preserve code blocks, nested/loose lists, continuation paragraphs, tables, images and headings. Markdown images require meaningful authored alternative text in the Markdown syntax; this is distinct from the removed representative-picture Alt Text form. The parser must not resolve links inside code examples as actual references.

Retain `gear://<id>` and `kb://<id>` as authored navigation. A renderer converts these to the corresponding application route after validating the target ID. A Copy Link action supplies the correct URI or page URL. Unknown IDs, unsafe schemes and missing local resources fail validation with the source path and location. A simple local table-of-contents can be rendered from existing headings if useful, but no new article template or metadata graph is introduced.

## 4. P1 authoring and handoff protocol

Gear and KB retain their familiar separate fields, repeaters, textarea and Preview. The form starts from a repository snapshot. Changes stay in memory until Prepare/Copy Changes; preparing a package is not a save. The UI warns before leaving a dirty form. There is no autosave, persistent draft database, direct GitHub token, backend or offline outbox in P1. Catch authoring remains chat-managed until its approved P2 phase.

The handoff format is `fishing-companion-change-v2`. A package contains one domain operation, one stable ID, only changed structured fields for an edit (a complete record for an add), optional Markdown changes, an explicit picture action, and a base revision/fingerprint sufficient for safe promotion. It must not contain full Gear/KB/Catch datasets, duplicate source/display entities, base64 images or provenance snapshots.

Illustrative edit envelope:

```json
{
  "format": "fishing-companion-change-v2",
  "domain": "gear",
  "operation": "edit",
  "id": "vmc-crs-crankbait-snaps",
  "base": { "schemaVersion": 2, "sourceRevision": "<commit-sha>", "recordHash": "<sha256>" },
  "changes": {
    "set": { "model": "CRS" },
    "unset": [],
    "baseFields": { "model": "<previous-value>" }
  },
  "notes": { "action": "keep" },
  "picture": { "action": "keep" }
}
```

The angle-bracket strings above are explanatory placeholders, not valid record values. The implementation uses a documented canonical JSON serialization for hashes and distinguishes an absent property from null. Changed ordered arrays (Specifications/Links) are treated as complete logical fields. A changed Markdown document uses a complete replacement body plus its current path and base file SHA-256. A new document uses `create`; intentional removal uses `remove`. No unchanged Markdown body is copied into the package. A picture add/replace identifies the exact desired repository path and optionally the selected local-file size/hash, with instructions for a direct GitHub upload. The package never transports binary data.

### Promotion transaction

1. Read current main and the current target record/Markdown/media paths. Confirm the submitted operation, ID, base schema and requested fields. Validate the candidate using the same domain/path/reference rules as the build.
2. Compare base fingerprints for the fields or document being changed. Unrelated records and fields are never overwritten by a stale package. A later intentional edit of the same logical field/document may win under the approved last-writer-wins rule. Deletion, identity and incompatible-schema conflicts fail visibly rather than resurrecting or corrupting data.
3. For an image upload, verify the exact committed bytes/path and intended replacement. Same-filename replacement is allowed; a shared-file overwrite requires explicit intent for all affected references. Do not delete the old file before the new source validates.
4. Apply only the changed record and associated authorized files. Revalidate the complete candidate dataset and all references. Commit on a feature branch, run required checks, and merge using the expected head against current main. If another direct-main edit intervenes, rebase/reconcile without discarding it.
5. Confirm the actual Pages deployment and critical published assets. A failed promotion does not claim success or leave a partially accepted record. Keep the original source/version recoverable until the transaction completes.

A minimal package can still be human-readable and copyable. The exact implementation encoding (including field deletion markers and hashes) will be frozen by executable protocol tests in the first vertical slice; the semantics above are binding. P2 direct Save and offline synchronization require their own later security/identity/queue contract and are not added now.

## 5. Read-only data, routing and UI behavior

The application loads one complete generated snapshot and builds in-memory Maps keyed by ID. There is no second authoritative browser database. Data is validated before becoming visible. Related Catch History is computed from the three approved foreign keys; no reverse arrays are persisted. Content is loaded by its explicit path and cached in memory for the current session as useful.

The router alone owns all routes. Existing `#/inventory/...` and `#/kb/...` URLs should remain compatible where they identify unchanged entities. New component routes use their new IDs. The on-page Back button navigates to the parent hierarchy, while the browser Back button follows actual navigation history. Search/filter state is not persisted across navigation or refresh. Unknown or retired IDs show a clear missing-item state with a route to the parent; no guessed entity is displayed.

The UI requirements are preserved exactly from the approved inventory: three home cards; no KB category counts; Gear and KB root search; search on Gear/Lures and KB/Gear Guides only; no new site-wide search; Gear Type filters only when a list has more than nine items and more than one distinct type; no KB Type filters; Gear sorted by Type then Name without special grouping; KB by Name; Catches newest first. The new Rods & Reels page uses the same ordinary Gear list/detail components as other categories. Keep the existing card density, square contain images without cropping, detail-section order and visual style. Preserve the current domain-specific search behavior rather than introduce an unapproved full-text search engine. Catch filters and browser authoring are P2.

Use semantic controls, keyboard access, focus handling, readable responsive layout and no page-level horizontal overflow. These are engineering quality requirements, not a new customization feature. The viewer must work by tap/click on phones without relying on hover.

## 6. Complete offline reading and update protocol

The P1 offline unit is one complete release: shell, JS/CSS, domain JSON, all authoritative Markdown, all referenced local images and required icons/fonts. A generated manifest lists every required file with its release-relative path, byte length and SHA-256. The build copies original Markdown/image bytes unchanged and verifies them against the source. The manifest is generated last and is not self-hashed. The source commit and structural schema versions are included in release metadata. No product/media/YouTube network acquisition occurs during the build.

Use immutable release URLs under a versioned path, with a stable small entry loader. The loader and service worker resolve a single active release; old clients continue using the files for their own release rather than mixing old code with new incompatible data. A new release is fetched into a separate cache namespace and all required responses are verified for status, byte length and digest before it becomes active. A failed or incomplete download does not replace the last complete version. Retain the previous complete release until the new one has been verified and no active client requires the old assets. Cache cleanup is explicit and cannot remove the only usable release.

The offline UI distinguishes Ready, Downloading and Incomplete, and provides a simple explicit update/retry action. App updates are separate from the Gear/KB Prepare action. Do not reload over a dirty form; offer to apply the update after the user finishes/discards the edit. A diagnostic may show build ID, asset count/bytes and failed paths. The app may fall back to the last complete version if a new version is unavailable, but must not silently present an incomplete release as ready.

Browser storage is best-effort and can be evicted by the operating system or browser. The design does not promise permanent offline persistence. Test actual quota/eviction behavior on the supported browsers, including interrupted downloads, corrupt/missing assets, failed upgrades and recovery. No P1 IndexedDB editing store is required; Cache Storage may be used for versioned read-only assets. The exact service-worker install/activate protocol must pass an executable two-release failure/recovery test before P1 acceptance.

## 7. Tooling and dependency decision

Use modern JavaScript ESM without React/Vue or a general UI framework. The audited v1 has no npm package manifest or third-party dependency; its useful model/viewer/CSS behavior can be reused selectively. The following small toolset is selected for the v2 implementation, with exact versions locked and tested during the first vertical slice. No dependency has been installed into production by this document.

| Purpose | Selected approach | Boundary |
|---|---|---|
| Runtime/build platform | Node.js 24 LTS, browser target ES2022 | Reproducible Node version in CI and project configuration. Existing v1 remains on its current runtime until cutover. |
| Bundling | esbuild (candidate 0.28.2) | Build-only. No development server or framework required in production. |
| Markdown | markdown-it (candidate 15.0.1) | Tested CommonMark parser with tables; compare the complete existing corpus before replacing the old renderer. |
| Sanitization | DOMPurify (candidate 3.4.15) | Browser-safe HTML boundary; raw HTML disabled by default and strict allowlist. No arbitrary executable markup. |
| Schema validation | Ajv (candidate 8.20.0) | JSON Schema 2020-12 plus small semantic validators. Share contracts across build and editor; no generic schema-admin UI. |
| Image validation | sharp (candidate 0.35.4) | Build-only full decode, metadata and bounded input validation. Never use its transformation APIs to silently alter accepted originals. |
| Browser tests | @playwright/test (candidate 1.62.0) | Test dependency only. Chromium and WebKit smoke tests; real iOS/Android acceptance remains separate. |

Versions above are verified available candidates, not a claim of an installed lockfile. The first vertical slice will install exact versions, commit `package-lock.json`, run `npm ci`, check licensing/security and freeze the tested set. Any necessary adjustment is an engineering implementation decision recorded with its test evidence. Avoid adding a second framework, state manager, database, CMS, custom router library, video service or image-transformation service without demonstrated need. P2 authentication/sync dependencies are not part of this set.

## 8. Deterministic build and CI contract

One build command reads the authoritative source and produces a fresh disposable output directory. There is no persistent generated media database, source-promotion overlay, or multi-stage mutation of already validated data.

The build sequence is: load source → validate domain schemas and semantic references → parse/validate all authored Markdown and image references → validate current source image bytes → copy content/assets unchanged → bundle application code/CSS → write normalized domain data and complete asset manifest → validate final output → package release. The build must fail on a missing required resource, invalid image, unsafe path, duplicate/colliding filename, unknown structured reference or invalid schema. It must not silently skip a requested picture. Unused historical files may be retained in Git without being packaged; intentional source deletion is separate.

Build output is deterministic for the same source revision and pinned tools. No build timestamp, random identifier or network-fetched content affects published bytes. Source files that are meaningful to the user retain their exact bytes; JSON formatting may be canonicalized without changing values or ordered arrays. A double-build comparison verifies identical output hashes. Current source content determines validation expectations—historical image bytes and entire article text are migration evidence, not permanent locks.

### Required tests

- **Schema/semantic:** valid/invalid records; exact type and reference checks; optional Catch fields; rejected retired fields; stable IDs; ordered fields; duplicate IDs; safe paths and collisions.
- **Migration fixtures:** all 66 original Gear records, 54 KB entities, five Catches, component-copy/Notes-duplication mapping, exact preserved fields, source/content hashes and explained count changes. No inferred purchases or relationships.
- **Media:** actual format/extension/dimensions, corrupt/truncated images (including the two audited WebP cases), same-filename replacement, shared-file reuse, missing file, remote rejection, source-to-output bytes.
- **Markdown:** complete existing corpus, nested/loose lists, tables, code, ordinary/internal links, safe images, malicious URL/HTML rejection and no link extraction from code examples.
- **Authoring:** Add/Edit, no-op, optional field removal, stale unrelated edit, same-field overwrite, Markdown replacement, image upload handoff, conflicts and dirty-form warning.
- **Routing/UI:** every domain and category, six rod/reel types, exact search/filter/sort rules, parent Back versus browser Back, absent pictures, derived Catch History, viewer interactions and responsive layout.
- **Offline:** complete manifest, interrupted download, corrupt asset, quota failure, old/new version isolation, retained last-good release, update deferred for dirty forms, recovery and missing-cache status.
- **Production:** exact-head build, required artifact integrity, actual Pages deployment, HTTP verification of the entry, build metadata and representative data/Markdown/images, followed by real-device acceptance when required.

A normal release uses one authoritative CI/build/deploy workflow. PRs validate without deploying production; approved main changes deploy automatically after required checks. Documentation-only changes do not trigger a production build. User direct-main image/content uploads remain supported; validate the current source rather than require a staging-upload branch. Avoid overlapping Pages releases, preserve direct edits, and use expected-head merges. Failures remain actionable; no weakening or wholesale removal of meaningful tests for a green result.

### Preview and cutover

The one-time v2 preview will use an isolated path such as `/fishing/v2-preview/` with a separate service-worker scope and release cache. The deployment artifact must preserve the verified v1 root while exposing the v2 preview; a preview deployment must never accidentally replace production. The final combined-publish mechanics are validated against GitHub Pages before use. No separate user-account or hosting platform is required. Once the preview passes migration and browser acceptance, reconcile current main, create a rollback checkpoint, deploy v2 at the original root, verify actual critical assets, and remove obsolete v1 runtime code from the active tree. Preserve Git history and a recoverable v1 artifact. Ordinary subsequent releases do not require a second staging URL.

## 9. Migration contract and remaining work

The migration tool is one-time, deterministic and restartable without mutating its source. Input is an exact current-main snapshot plus any explicitly reconciled browser-only differences and accepted image replacements. It writes a new source tree in a separate working location. It does not delete or edit v1 records in place. The source baseline is refreshed and compared again before cutover to incorporate direct-main changes.

Each of the three setups becomes two independent records using the exact mapping in the Source Audit. Copy each component's current Manufacturer, Model, Specifications and Links without alteration. Copy the original Notes bytes into two files. Preserve all unaffected IDs and every other existing fact. The old setup IDs are documented in the migration report and not retained as runtime aliases. Resolve any existing setup links explicitly. The unidentified spincasting rod remains represented by the exact recorded combo facts, with no invented model or picture.

The five Catch records keep their IDs, dates, times, known references and complete Notes. Convert their measurements to text with original values/units. Preserve original structured measurements and name snapshots in migration evidence. Retired fields with actual unique facts must be transferred to Notes or retained in the archive, not silently discarded. No new ownership or Catch attribution is inferred. KB articles and active accepted image bytes remain unchanged unless an explicit user correction/replacement is approved.

The migration report must include source/destination counts and IDs, all field transformations, old/new paths, exact content/image hashes, active picture selections, changed references, deliberate exclusions, and every unresolved exception. Expected Gear count is 69 only if the source still contains the current 66 records and the approved three-to-six split; the final source determines actual counts. The final validation must compare against the refreshed source, not a frozen historical record count.

The source audit identified 51 remote-only Gear captures, three independent remote KB images, one malformed active image and an absent Rapala picture. These are migration tasks, not permission to fetch new images automatically or invent replacements. A separate user decision may be necessary if the existing captured bytes are to be promoted as local originals instead of user-supplied replacements. The one-time browser-only data diagnostic must be completed before the old IndexedDB store is retired. No permanent import/export or compatibility adapter is required after successful reconciliation.

## 10. Phase exit and implementation authorization boundary

The source/dependency/data audit and this technical-contract design are complete. The machine schema is an executable contract, but the future application, migration utility, package lockfile, complete offline service worker, browser suite, and v2 preview are not yet implemented or tested. Those belong to the next phases and must not be described as completed.

The next implementation milestone is a small vertical slice: one ordinary Gear record, one KB article, one Catch record, local picture/Markdown, the shared renderer/router, simple handoff, and complete offline read behavior without legacy media/persistence machinery. Use fictional fixtures first, then the actual source mapping. The full migration follows only after the source preservation and image/device gates are satisfied. The user has approved the v2 baseline and authorized the audit/contracts work; this document does not silently authorize P2 direct Save, offline synchronization, or an immediate production cutover.
