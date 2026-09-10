# Fishing Decision Log

## Production closeout — September10, 2026

V2 is published at [Fishing Companion](https://ginosega.github.io/fishing/). Production revision `ceef1df0dd8b204e7aa59c63e95a0d75346f4a92`, release `7ff6f62d921d5e86e0d97ae89b361120`, passed [publication and hosted verification](https://github.com/ginosega/fishing/actions/runs/34441600093). PR64 is merged. The user authorized production and waived another preview review; all seven previously required missing pictures are explicitly deferred. The affected records remain available without pictures. No acceptance or media approval blocks this release.

Validation: 20 core tests, 20 preview-scope and 22 production-scope Chromium/WebKit scenarios, including the actual archived-v1 worker transition and retained browser stores. All 197 hosted files match the verified production build; live navigation, image viewer, offline reload, counts and absent-picture behavior pass. These are automated browser and direct hosted checks, not physical-device inspection.

The sole active pipeline is `.github/workflows/fishing-production.yml`. V1 and the earlier preview are historical; use the production root. V1 sources and exact rollback ZIPs remain in Git. Old browser stores are retained. P2 remains deferred. This authorized Work phase is complete; continue in Chat.

**Historical evidence follows.** Earlier pending gates below are superseded; see the [production release](Fishing_v2_Production_Release_2026-09-10.md).



## Historical review correction and media-blocked checkpoint

The supplied first-review corrections are implemented at `d5f09f058e298f3852f4bf6d0ca2545984a0d6ab` on `feature/v2-implementation-20260908` (PR 69 merged into that feature only). The [feedback record](Fishing_v2_Review_Feedback_2026-09-09.md) preserves the user wording. Engineering and prepublication validation pass 19 core tests and all 20 Chromium/WebKit scenarios, with all 217 live v1 files matching their preserved archive.

**Latest user authorization:** “take this all the way to production; I don't need to test these changes in preview, let's go ahead with this build.” This authorizes production cutover and waives another user preview-review gate. Do not ask again for general cutover or preview acceptance. It does not explicitly resolve the seven previously required missing-image exceptions. The actual production build failed with `Migration has 7 unresolved media exceptions; pending-media preview only`. A decision to defer those required pictures or approved replacement images is the current blocker.

No correction refresh or production cutover has been published. The existing live v1 root and original preview (`5da786ef…`, release `b924b223850b4a2741fedb92ce924584`) remain unchanged. PR 70 passed prepublication validation but was closed unmerged after the user requested direct production. Its branch retains the verified combined-deployment and durable-archive approach as reference. PR 64 remains draft/unmerged pending media resolution and production integration. No one-time migration was rerun, source data changed, new images acquired or browser stores removed.

See [Review correction checkpoint](Fishing_v2_Review_Release_2026-09-09.md) for exact refs, CI and continuation. This checkpoint supersedes older statements below that still require user preview acceptance/cutover approval. Chat remains the permanent default; the explicitly authorized Work implementation phase is paused only on the required-media decision.

**Status:** Current decision authority, reconciled September 9, 2026. Complete historical decisions remain in `Fishing_Decision_History_Through_2026-09-06.md`, `History/` and Git history. Previous CURRENT labels do not override the latest approved requirements.

## V2 design approval

All fourteen decisions in the user-annotated Design Review are accepted. Decision source: `0bd773366130a302b0e80d5cd085a71731ff9e63`. The original Inventory and Design Review preserve the user's exact wording. The Approved v2 Baseline is the consolidated requirements authority. The source audit and minimal architecture/contracts are complete, with September 9 implementation addenda. P1 engineering and automated browser acceptance are complete. The isolated [v2 preview](https://ginosega.github.io/fishing/v2-preview/) is published and hosted verification passed; user review is pending. V1 remains at the root. Draft PR 64 is unmerged. See [Fishing_v2_Preview_Release_2026-09-09.md](Fishing_v2_Preview_Release_2026-09-09.md) for exact evidence and recovery. P2 features remain separately authorized.

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

## September 9 implementation and handoff decisions

| Area | Decision / recorded result |
|---|---|
| Scope authorization | The user authorized P1 implementation through browser/offline acceptance and isolated preview. A temporary Work session is approved for authenticated repository/development/browser execution, not complexity alone. The permanent Chat-default policy remains. |
| Migration | The pinned one-time migration succeeded in run `34328748390`, commit `6615ae7296e48d90dceab303b6b5a1fbc041ab80`. Gear 66 → 69, KB 54, Catches 5; exact approved narrative and image adoption reconciliation preserved. Do not rerun the original migration merely to resume. |
| Media | Forty-nine archived captures explicitly adopted, two rejected. Seven required exceptions plus one optional generic inline-spinner picture remain. Rapala F-3 is now correctly required in the report and regression coverage. No automatic acquisition, invented replacement or silent deletion. |
| Device baseline | The user accepted source equivalence and waived a separate device-only IndexedDB export. No device inspection was performed. Preserve old stores and reconcile any newly discovered local-only data before retirement. |
| Browser acceptance | Repaired at `5da786ef121d7cfa39f98a8c69f3b6cf09f8eca6`: 19 core and 16 Chromium/WebKit scenarios pass, plus actual hosted verification. Earlier failed runs remain evidence. No physical-device inspection is claimed. |
| Offline integrity | Preserve immutable pinned releases and last-known-good behavior. A successful verified update must select the correct release after explicit reload; failed/corrupt updates must not delete the only complete cache or mix code and data. Unique cache generations commit a completion marker only after all bytes verify; failed attempts retain older complete releases. Offline Ready verifies current bytes. |
| Preview | Publish only at `/fishing/v2-preview/` with isolated service-worker scope, preserving v1 root and a recoverable baseline. Verify actual hosted assets. Explicit preview acceptance and separate production-cutover authorization remain required. |
| Documentation | Preserve original approved requirements, source audit, technical contracts, machine schemas and historical records. Current Context, TODO, Decision Log and bootstrap must reflect implemented/migrated state. Dated addenda retain original audit/design detail. |

## September 9 verified preview milestone

Workflow-only PR 66 and refresh PR 67 publish the isolated preview with the exact current v1 root, after preserving current and migration-source archives in Git. The [preview release record](Fishing_v2_Preview_Release_2026-09-09.md) records hosted evidence. The authorized temporary Work phase is complete; review continues in Chat. User preview acceptance, required media and separate production cutover remain open. No P2 work or device inspection is implied.

## Standing decisions

| Area | Decision |
|---|---|
| Operating mode | Chat by default. Work only for a specific Work-only capability with explanation and user approval; complexity, duration, research, files and artifacts alone are not reasons. |
| Source of truth | GitHub is durable. Current structured runtime source and authored Markdown prevail over historical OneNote/PDF, Topics, old chats or stale bootstrap text. |
| End-to-end execution | An authorized change continues through validation, PR/CI, actual deployment verification and state reconciliation. Progress is informational, not an approval gate. Stop only for genuine blockers or complete scope. |
| Preservation | Preserve user-authored text/files, confirmed facts, ownership and actual historical relationships. Do not infer purchases or catch attribution. Preserve direct-main edits and validated source bytes. |
| Project scope | Personal single-user application; no Planner, sessions, speculative graph or multi-user expansion. |
| Documentation | Keep concise current authority and one canonical TODO; historical detail remains in Git/History, not parallel current databases. |
| Releases | Restore current main; normal exact-head/current-base checks for meaningful runtime work, expected-head merge, actual Pages deployment, no skipped meaningful gates, no one-time migration reruns or permission bypass. Avoid overlapping Pages releases. |
| V2 scope control | Requirements approval does not automatically authorize P2. Use approved baseline; ask only for genuine new decisions or explicit implementation authorization. |

## Current production authority

The last fully documented v1 application release is PR 60, final head `cd47dc9ce39660840de493346e7df9fda72a14e5`, CI #307 / `34191643311`, merge `ecd9f3d52ca8180ea4f48ec888e7574105deafda`, production #308 / `34191692935`. Later direct-main changes exist. The audited source baseline is `1fa82a0cb653b8205bc8a45a1cf4608a616bf3b2`; the original migration-media run was #312 / `34237232075`. Current preserved v1 is run #314 / `34369680844`, source `cac5b4108a63fcaab498b256afa4420ce2dbbd70`, published unchanged alongside the isolated preview. Verify actual main/current deployment before acting. V1-specific model/media/authoring rules remain in force until cutover.

## V1-only architecture (historical during migration)

Gear schema 4 uses JSON/IndexedDB, paired setups, manufacturer objects, ordered links and external Notes. KB schema 1 uses flat entities and Markdown. Catch schema 2 uses exact known associations and external Notes. The media system has source/owner/override/local manifests and source/derived stages. Browser Gear/KB editing produces source-aware handoffs. V1 preserves stable IDs, explicit ownership, source provenance, safe paths, final transformed-data checks and all accepted user content. Its implementation and historical decisions remain documented in `pwa/README.md`, `pwa/DATA_MODEL_RECONCILIATION_DESIGN.md`, prior Decision Log versions and release files. Do not remove safeguards from live v1 as a shortcut; replace them only with approved v2 architecture after preservation and validation.

## Open work

The canonical TODO now tracks user preview review, required media resolution, separately authorized cutover and existing fishing/gear research. Engineering, automated acceptance and isolated publication are complete. FISH063's old media-authoring policy and FISH039's setup recording are superseded for v2; they do not justify reintroducing retired structures. PowerBait hook-size and loop-knot guidance remain unresolved. The next unused canonical task ID is FISH-TODO-083. No approved future feature is treated as already deployed.
