# Fishing Decision Log

**Status:** Current decision authority, reconciled September 9, 2026. Complete historical decisions remain in `Fishing_Decision_History_Through_2026-09-06.md`, `History/` and Git history. Previous CURRENT labels do not override the latest approved requirements.

## V2 design approval

All fourteen decisions in the user-annotated Design Review are accepted. Decision source: `0bd773366130a302b0e80d5cd085a71731ff9e63`. The original Inventory and Design Review preserve the user's exact wording. [Approved v2 baseline](Fishing_Companion_v2_Approved_Baseline.md) is the consolidated requirements authority. The user explicitly authorized the source audit and minimal architecture/contracts; those deliverables are now documented in [Source Audit](Fishing_Companion_v2_Source_Audit.md) and [Technical Contracts](Fishing_Companion_v2_Technical_Contracts.md). V2 runtime and pinned migration are committed on the isolated feature branch. Browser/offline acceptance, preview and cutover remain incomplete; P2 features remain deferred and require separate authorization. See the dated Work Handoff.

| Area | Accepted decision |
|---|---|
| A1 | P1 minimal Gear/KB handoff, optional P2 direct Save, then optional P2 offline outbox. Do not build sync for P1. |
| A2 | Future secure GitHub authorization and small service are reasonable if needed, to be revisited at P2. No public embedded credentials. |
| A3 | Last-writer-wins for the same logical record/document; safe independent structured-field merging, whole-document Markdown replacement, no unrelated overwrite, visible deletion/schema conflicts. |
| B1 | Category-level assets/content folders, stable directory keys, no automatic move on reclassification. |
| B2 | Human-readable safe filenames including spaces/capitals, independent of IDs. |
| B3 | JPEG/PNG/WebP/GIF; 10 MiB, 6,000-pixel per-axis and 36-megapixel limits; reject rather than transform. Check existing sources before enforcement. |
| B4 | One authoritative picture; lazy loading and measured performance before optional derived thumbnails. No galleries or automatic optimization in P1. |
| C1 | Add Spincasting rod as the sixth independent Rods & Reels type. |
| C2 | Copy current component facts/links exactly and duplicate original setup Notes into both component Notes documents; user will correct them through Edit. No invented identities. |
| C3 | Preserve unaffected IDs; assign new component IDs; one-time old-to-new mapping only. |
| D1 | Catch has date, optional time/text Size/Species/Location/owned Lure-Bait and Notes. No setup/technique or separate picture. Species picture is derived. |
| D2 | Preserve existing measurements as text with original values/units; no enrichment or invented facts. |
| E1 | Gear Guides/Techniques classified by primary article purpose, with authored cross-links rather than extra taxonomy fields. |
| E2 | Keep gear:// and kb:// stable-ID navigation and add Copy Link. |

The remaining Inventory responses are approved requirements: retain current domain/category structures except agreed simplifications, current visual design, explicit search/filter/sort rules, full offline reading, rare chat-managed deletion/taxonomy administration, and no unnecessary source/provenance/owner metadata. Consult the approved baseline rather than reinterpreting historical v1 decisions.

## New engineering decisions and audit evidence

| Date | Area | Decision / recorded result |
|---|---|---|
| 2026-09-08 | Phase scope | Complete the authorized source/dependency/data audit and testable technical contracts without changing v1 production. The initial vertical slice was subsequently implemented; P2 remains deferred. |
| 2026-09-08 | Source audit | Pin the audit to main `1fa82a0cb653b8205bc8a45a1cf4608a616bf3b2`, retain a complete source snapshot and verified production-bundle evidence. Source and published data/content were reconciled; 12 source tests, four dist tests and final-bundle validation passed. Device-only state and browser acceptance are not claimed. |
| 2026-09-08 | Media exceptions | Record 51 remote-only Gear captures, three independent remote KB pictures, one malformed active WebP, one unused malformed WebP and the absent Rapala image. Preserve existing archived bytes. Default to user-supplied replacements; an explicit exception is required to adopt existing captures as local originals. No automatic web acquisition or silent deletion. |
| 2026-09-08 | Domain contracts | Use three independent v2 schema-version-2 roots with direct optional pictures and Markdown paths. JSON Schema 2020-12 plus shared semantic validation; no redundant dataVersion, owner graph, setup model or duplicate narrative database. Exact source fields and authored bytes are preserved in migration. |
| 2026-09-08 | Component migration | Adopt the six new component IDs and paths listed in the Source Audit as the deterministic migration mapping. Copy all source component facts/links and duplicate each setup Notes byte-for-byte. Do not infer a new spincasting rod identity or picture. |
| 2026-09-08 | Files and validation | Use repository-relative paths, Unicode-safe human filenames, stable category folders, collision/traversal checks and full image decoding. Source Markdown/image bytes remain authoritative; generated assets are disposable. |
| 2026-09-08 | Runtime architecture | Framework-free JS/ESM, one explicit router, shared direct-rendered components, tested Markdown/sanitization, one read-only snapshot and no P1 editable IndexedDB. Keep current visual and viewer behavior. |
| 2026-09-08 | Authoring | Minimal version-aware per-record handoff; changed fields and changed Markdown only. Validate current source before promotion, preserve unrelated changes, use expected-head merges and explicit picture/file operations. No backend or credential in P1. |
| 2026-09-08 | Offline | One complete versioned release, SHA-256 asset manifest, verified installation and retained last-known-good release. No partial offline-ready claim or incompatible code/data mixing. Quota/eviction and real-device behavior require tests. |
| 2026-09-08 | Tooling | Select minimal Node 24/ESM tooling, esbuild, markdown-it, DOMPurify, Ajv, build-only image decoding and Playwright. Exact dependency versions are to be locked and tested in the vertical slice; no new production dependency has been installed. |
| 2026-09-08 | Release process | One deterministic validation/build/deploy path, meaningful invariant/behavior tests, no historical content locks, no build-time product/video retrieval. The one-time preview must preserve the v1 root and use an isolated service-worker scope. Ordinary releases need no staging URL. |
| 2026-09-08 | Remaining gates | FISH078 covers media replacements; FISH079 covers one-time browser-only data export/difference checks. These are migration acceptance requirements, not reopened general design questions. |

## September 9, 2026 — implementation and handoff decisions

| Area | Decision / verified result |
|---|---|
| P1 implementation | The user authorized the complete P1 implementation and isolated preview. Preserve draft PR 64 at observed head `24f57ca7d72a9751e0935c6eb46e842f61493db2` and the current feature branch; do not restart completed work. |
| Temporary Work authorization | The user explicitly approved temporary Work for the specific need for authenticated repository/development/browser execution and continuous engineering through the preview. Chat remains the default after this phase. Work is not required merely because a task is complex, long or file-heavy. |
| Migration acceptance | The pinned migration succeeded at `6615ae7296e48d90dceab303b6b5a1fbc041ab80` in run 34328748390. Preserve the generated Gear 69 / KB 54 / Catches 5, exact authored bytes, source/transform evidence and all approved image decisions. A later source refresh must be justified and separately reconciled; no routine rerun. |
| Archived media | Adopt 49 of 51 reviewed archived captures exactly as approved in the submitted decision CSV; reject Mack's Pee Wee Hoochie and River2Sea Whopper Plopper 60. No automatic acquisition or inference of ownership. Seven required exceptions remain, plus the optional generic inline-spinner picture. The Rapala F-3 optional flag is a migration-report defect to correct. |
| Device-only data | The user accepted source-equivalence evidence and waived the separate v1 IndexedDB device export for this baseline. This is not a claim of device inspection. Keep v1 stores intact and reconcile any later-discovered data before retirement. |
| Acceptance evidence | Hosted run 34330339245 passed 15 core tests and verified build, then failed 4 of 6 browser tests. Two browser scenarios passed. A valid acceptance gate requires correcting real defects and test mistakes, not removing coverage or accepting a partial result. |
| Preview/cutover | The user authorizes publishing only a separate preview that preserves the v1 root and has its own service-worker scope. Preview acceptance and production cutover are distinct. Do not merge PR 64 or replace the production root before explicit acceptance/approval. |
| Handoff discipline | Reconcile current state and complete a durable bootstrap before switching chats. Prefer source-backed exact commit/CI references, preserve original requirements, and record unverified items explicitly. No status-only Proceed loops; authorized engineering should run to completion within the available session. |
| Tooling cleanup | Temporary migration/workspace/acceptance workflows are not the final release architecture. Consolidate them into the normal validated build/deploy path when appropriate; do not delete needed evidence or remove meaningful gates to make CI green. |

## Current production authority

The last fully documented v1 application release is PR 60, final head `cd47dc9ce39660840de493346e7df9fda72a14e5`, CI #307 / `34191643311`, merge `ecd9f3d52ca8180ea4f48ec888e7574105deafda`, production #308 / `34191692935`. Later direct-main changes exist. The audited source baseline is `1fa82a0cb653b8205bc8a45a1cf4608a616bf3b2`; the latest inspected successful production run is #312 / `34237232075`. Verify actual main/current deployment before acting. Historical release evidence is in `pwa/RELEASE_2026-09-08_CRANBERRY_COPY.md` and earlier records. V1-specific model/media/authoring rules are superseded for v2 but remain in force for live v1 until cutover.

## Standing decisions

| Area | Decision |
|---|---|
| Operating mode | Chat by default. Work only for a specific Work-only capability with explanation and user approval; complexity, duration, research, files and artifacts alone are not reasons. |
| Source of truth | GitHub is durable. Current structured runtime source and authored Markdown prevail over historical OneNote/PDF, Topics, old chats or stale bootstrap text. |
| End-to-end execution | An authorized change continues through validation, PR/CI, merge, actual deployment verification and state reconciliation. Progress is informational, not an approval gate. Stop only for genuine blockers or complete scope. |
| Preservation | Preserve user-authored text/files, confirmed facts, ownership and actual historical relationships. Do not infer purchases or catch attribution. Preserve direct-main edits and validated source bytes. |
| Project scope | Personal single-user application; no Planner, sessions, speculative graph or multi-user expansion. |
| Documentation | Keep concise current authority and one canonical TODO; historical detail remains in Git/History, not parallel current databases. |
| Releases | Restore current main; normal exact-head/current-base checks for meaningful runtime work, expected-head merge, actual Pages deployment, no skipped meaningful gates, no one-time migration reruns or permission bypass. Avoid overlapping Pages releases. |
| V2 scope control | Requirements approval does not automatically authorize P2. The P1 application/isolated-preview implementation is already authorized; ask only for genuine new decisions or separate production-cutover/P2 approval. |

## V1-only architecture (historical during migration)

Gear schema 4 uses JSON/IndexedDB, paired setups, manufacturer objects, ordered links and external Notes. KB schema 1 uses flat entities and Markdown. Catch schema 2 uses exact known associations and external Notes. The media system has source/owner/override/local manifests and source/derived stages. Browser Gear/KB editing produces source-aware handoffs. V1 preserves stable IDs, explicit ownership, source provenance, safe paths, final transformed-data checks and all accepted user content. Its current implementation and historical decisions are documented in `pwa/README.md`, `pwa/DATA_MODEL_RECONCILIATION_DESIGN.md`, prior Decision Log versions and release files. Do not remove those safeguards from live v1 as a shortcut; replace them only with approved v2 architecture after preservation and validation.

## Open work

The canonical TODO contains current v2 implementation/acceptance, media and cutover tasks plus existing fishing/gear research. The dated Work Handoff records exact open browser failures; the pinned migration is complete. FISH063's old media-authoring policy and FISH039's setup recording are superseded for v2; they do not justify reintroducing retired structures. PowerBait hook-size and loop-knot guidance remain unresolved. The next unused canonical task ID is FISH-TODO-082. No approved future feature is treated as already deployed.
