# Fishing Decision Log

## FISH088 Kingforest inline-spinner production closeout — September 11, 2026

FISH-TODO-088 is DONE through [PR93](https://github.com/ginosega/fishing/pull/93). Production source `364a599a4eeb51457ece46457d738ebb4f0d82f3`, release `97e6a320ed42c432b875de9fe8c2ef25`, passed [production run 34621210887](https://github.com/ginosega/fishing/actions/runs/34621210887) through full validation, exact-current-main Pages deployment, 206 hosted v2 files and complete hosted byte/browser verification.

Decision/result: apply the submitted `fishing-companion-change-v2` Gear edit under the approved source-aware authoring rules because the structured-record and Notes bases matched. The package-specified image was not duplicated: the user had already uploaded `Gear/Lures/assets/Kingforest Inline Spinner.png` on newer current `main`, and its exact 430,419-byte size/SHA-256 matched the package. The record now names Kingforest, has empty structured links, uses the supplied Notes body and references that image. The historical optional-media disposition remains historical evidence rather than current absence.

Two regression assertions were corrected because the requested source change legitimately increased referenced-source inventory 235 → 236 and eliminated the last pictureless Lure. Absent-picture behavior remains tested on a pictureless KB Location. No schema, architecture, direct-Save/P2, Catch or broader authoring decision changed. FISH084–088 are DONE; FISH077/P2 remains DEFERRED; unrelated backlog is unchanged. Next unused canonical task ID: FISH-TODO-089. This reconciliation is non-runtime and does not republish production.

## FISH087 KB authoring batch production closeout — September 11, 2026

FISH-TODO-087 is DONE through [PR92](https://github.com/ginosega/fishing/pull/92). Production source `dee0ff76f6b15e861fa8864151aad88c8fe28f5e`, release `40c849b4014013f22200843c9d222c2c`, passed [production run 34614884273](https://github.com/ginosega/fishing/actions/runs/34614884273) through full validation, exact-current-main Pages deployment, all 205 hosted-file comparisons and hosted browser verification.

Decision/result: the submitted KB package was applied under the approved v2 authoring/merge rules. All submitted structured-record and replacement-document base hashes matched current source when validated. The unrelated newer Silver Lake Markdown edit was preserved because the package specified Notes `keep`. The missing Lake Bosworth file was treated as an independent current-main integrity defect; after the user restored it, PR92 was refreshed against that repaired base. A single browser regression was updated to expect no Species subtitle after intentional description removal. No schema, architecture, picture, direct-Save/P2, or broader authoring decision changed.

FISH084–087 are DONE; FISH077/P2 remains DEFERRED; unrelated backlog is unchanged. Next unused canonical task ID: FISH-TODO-088. This documentation reconciliation is non-runtime and does not republish production.

## Icon filename cleanup and current state — September 11, 2026

FISH-TODO-086 is DONE through [PR91](https://github.com/ginosega/fishing/pull/91). Current production source `afd7afc9ee91fb3dc81a15635e14ec932bda2b1b`, release `11789b7bace383d161add0ac7d313579`, passed [production run 34608018650](https://github.com/ginosega/fishing/actions/runs/34608018650): 21 core tests, 24 preview-scope and 26 production-scope Chromium/WebKit scenarios, archived-v1 transition, exact-current-main Pages deployment, all 205 hosted-file comparisons and complete hosted browser verification.

The approved transparent PNG is now `pwa/icon.png`; its bytes are unchanged (SHA-256 `e46bcb2260f550380c4df2a42d512bbcd19b24dbf9e987815a0070afd350b922`). The obsolete `pwa/icon.svg` and former `pwa/revised-icon.png` paths are removed from current source. New builds use `icon.png` for the manifest, favicon and Apple touch icon. Historical filenames remain accepted only by release validation and compatibility tests so retained cached releases stay readable. Git history retains both removed paths. Canonical Gear/KB/Catch files are unchanged.

FISH084, FISH085 and FISH086 are complete; PR89–PR91 are merged and no release or icon work remains pending. P2/FISH077 remains deferred, all unrelated backlog is retained, and next unused task ID is FISH-TODO-087. Continue in Chat using actual latest main. This documentation reconciliation does not redeploy.

## Historical Chat handoff audit — before icon filename cleanup

Restored and audited GitHub main `36d894439632b45aa358c7a93a38b19dff822875` before this documentation-only handoff. Its changes after production source `240dbfa67a1810ef51fde24f7bd0fb1d1c867bcf` are documentation only; the deployed release remains `c15f12f49c4162706fb14eb2791e3204`. Production run `34566907478` is successful; PR89 and PR90 are merged, no PRs are open and no release jobs are queued or running at this audit. This handoff does not require another build or deployment.

FISH084 and FISH085 are DONE; no UI, icon-transfer, verifier or production-acceptance work remains from this chat. FISH077/P2 stays DEFERRED. All unrelated TODO rows and purchase uncertainties are retained; next unused task ID is FISH-TODO-086. Resume by reading actual latest main, then respond to the user's next requested work rather than restarting a completed release. The bootstrap, Context, TODO, Decision Log, README and affected PWA records were cross-checked for release identity, icon state, completed tasks, deferred scope and Chat-default instructions.

Operating mode: This project uses Chat mode by default. Do not recommend Work unless a task specifically requires a Work-only capability. Never recommend Work merely because the project or task is complex, lengthy, file-heavy, analytical, or involves creating artifacts. Explain the specific need and obtain my approval before recommending a temporary switch. Chat is the permanent default; this temporary Work conversation is complete. Do not promise background work.

## PR89/PR90 production closeout — historical release evidence

FISH-TODO-084 and FISH-TODO-085 are DONE. The eight UI/authoring refinements from PR89 and the user-authorized icon transparency/verifier correction in [PR90](https://github.com/ginosega/fishing/pull/90) are live at production source `240dbfa67a1810ef51fde24f7bd0fb1d1c867bcf`, release `c15f12f49c4162706fb14eb2791e3204`. [Production run 34566907478](https://github.com/ginosega/fishing/actions/runs/34566907478) is green: 20 core tests, 24 preview-scope and 26 production-scope Chromium/WebKit scenarios, archived-v1 worker/store transition, exact-current-main Pages deployment, all 205 hosted-file comparisons and the complete hosted browser verifier passed. PR90 CI [run 34566584530](https://github.com/ginosega/fishing/actions/runs/34566584530) also passed.

Historical PR89 evidence: source `1f3f6df97390db186303148dcb5fa62ad0ba90e9`, release `7572c94504e4482c9987828b95a653f6`, [run 34565111477](https://github.com/ginosega/fishing/actions/runs/34565111477) published successfully and compared all 205 hosted files, but its browser verifier failed because Yellow Perch matched both the page h1 and a Catch History h2. That historical run remains failed; PR90 repairs the selector with `level:1` and completes a new fully verified release.

Historical PR89 direct cloud-browser follow-up verified the published home/KB/Catch wording, normal-weight dates below Species, page search, exact runtime icon references, Yellow Perch page/image viewer, Offline Ready for 203 files, real clipboard instruction plus valid JSON, Gear/KB Add Exit to the originating roots and KB Edit Exit to its original item without a warning. The original hosted verifier had already completed actual offline reload before reaching the ambiguous selector. No physical-device inspection or browser-originated repository writes are claimed.

The user explicitly authorized the follow-up PR/release and clarified: “The white border surrounding the green button image should be transparent.” This supersedes the earlier one-PR limit for this correction. No further icon transfer or approval is pending.

The PR90 runtime used the transparent-background edit of `pwa/revised-icon.png` (renamed without byte changes to `pwa/icon.png` in PR91) (1,208,529 bytes, 1254 × 1254 RGBA PNG; SHA-256 `e46bcb2260f550380c4df2a42d512bbcd19b24dbf9e987815a0070afd350b922`). The built-in image editor was instructed to remove only the exterior white background and preserve the green button and fish/hook artwork. Alpha inspection and browser regressions verify transparent exterior pixels, retained center opacity, source-derived dimensions and exact served bytes. The original opaque upload remains recoverable in PR89 history (SHA-256 `89a81bac58c460cdb6ccc509b6b240ac84937b619990c6ac9b187ddc4b75980c`). Favicon, manifest and Apple touch icon all use the corrected PNG; offline integrity includes it and older SVG-icon releases remain readable for recovery.

Catch card dates appear directly below Species at regular weight, including derived Catch History cards. Existing search inputs use `Search [page title]`; no new search inputs were added. Knowledge Base card/subtitle reads `Fishing reference library`; Catch Log home-card subtext and list-page heading read `Recorded catches`. Back buttons retain only `Back`.

After a successful Copy Changes, Exit returns edits to their original item and adds to their originating Gear/KB root or category. Exit alone bypasses the unsaved-changes warning. Further edits invalidate the prepared package and remove Exit; ordinary Back, Cancel, navigation and reload remain guarded. Copy text contains an explicit repository implementation/deployment instruction above valid `fishing-companion-change-v2` JSON; manual-copy fallback includes that same instruction. Preparing/copying is not saving. KB Notes remain required; its schema and viewer behavior are unchanged.

## Post-production authoring updates — September 10, 2026

The site-authored Prepare Changes → Copy Changes workflow has now been exercised through routine production updates including PR75/PR76 (Pflueger spincast rod/reel), PR77 (Tsuridamashii snap-swivels picture), PR79 (four previously deferred pictures plus Rebel Pop-R replacement), PR81 (Kokanee/Largemouth/Smallmouth Species updates), and PR84 (the final Popper and Whopper Plopper Gear-Guide pictures). At that historical milestone, production source `76094d48055ca9e2363298763cdbf00586fbeb71` passed the full production pipeline and hosted verification in [run 34544432559](https://github.com/ginosega/fishing/actions/runs/34544432559); release `d6334fcb8a34834f1918df95b8f04efd` contains 205 hosted files. The original decision accepting seven missing required pictures remains historical authority for the cutover; all seven exceptions are now resolved by later user-supplied images. FISH078 is DONE. Generic inline-spinner remains optional; P2 remains DEFERRED.

## Repository cleanup — September 10, 2026

The user approved the new site's appearance and behavior, then requested repository cleanup. Production source, tests, contracts and migration evidence have moved from root `v2/` into `pwa/`; the preserved icon was the only build dependency on the former v1 `pwa/`. Retained v2 specifications/release references are in `pwa/docs/`. Root `History/`, `Topics/`, obsolete registries/handoffs and v1 runtime/assets/per-item helpers are removed from main, recoverable at `checkpoint/pre-repo-cleanup-20260910` (`edca2a3f04fc8c32dec65b9330d43944be1a561c`). Canonical Gear/KB/Catch bytes, including the newer unreferenced Pflueger image upload, are unchanged. No image adoption or migration rerun.

Add/Edit creates copyable source-change packages, not one-off helper/release files. Routine changes must update canonical files and existing project records; reusable code/tests stay under `pwa/`, and significant release references belong under `pwa/docs/`. No new per-item scripts/release records in either root. Cleanup PR73 is merged and published. [Production run 34490532301](https://github.com/ginosega/fishing/actions/runs/34490532301) passes all 20 core tests, 42 browser scenarios across the two scopes, and all 197 hosted-file comparisons. Cleanup production source `6a64be686cf751720884469b98f2fcc4df94ec6a`, release `d63599a99498d62fdfb1fc22c04643c2`. See [cleanup/release evidence](pwa/docs/Repository_Cleanup_2026-09-10.md).


## Production closeout — September10, 2026

V2 is published at [Fishing Companion](https://ginosega.github.io/fishing/). Production revision `6a64be686cf751720884469b98f2fcc4df94ec6a`, release `d63599a99498d62fdfb1fc22c04643c2`, passed [publication and hosted verification](https://github.com/ginosega/fishing/actions/runs/34490532301). PR64 is merged. The user authorized production and waived another preview review; all seven previously required missing pictures are explicitly deferred. The affected records remain available without pictures. No acceptance or media approval blocks this release.

Validation: 20 core tests, 20 preview-scope and 22 production-scope Chromium/WebKit scenarios, including the actual archived-v1 worker transition and retained browser stores. All 197 hosted files match the verified production build; live navigation, image viewer, offline reload, counts and absent-picture behavior pass. These are automated browser and direct hosted checks, not physical-device inspection.

The sole active pipeline is `.github/workflows/fishing-production.yml`. V1 and the earlier preview are historical; use the production root. V1 sources are archived in Git history and the pre-cleanup checkpoint; exact rollback ZIPs remain in Git. Old browser stores are retained. P2 remains deferred. This authorized Work phase is complete; continue in Chat.

**Historical evidence follows.** Earlier pending gates below are superseded; see the [production release](pwa/docs/Fishing_v2_Production_Release_2026-09-10.md).



## Historical review correction and media-blocked checkpoint

The supplied first-review corrections are implemented at `d5f09f058e298f3852f4bf6d0ca2545984a0d6ab` on `feature/v2-implementation-20260908` (PR 69 merged into that feature only). The [feedback record](pwa/docs/Fishing_v2_Review_Feedback_2026-09-09.md) preserves the user wording. Engineering and prepublication validation pass 19 core tests and all 20 Chromium/WebKit scenarios, with all 217 live v1 files matching their preserved archive.

**Latest user authorization:** “take this all the way to production; I don't need to test these changes in preview, let's go ahead with this build.” This authorizes production cutover and waives another user preview-review gate. Do not ask again for general cutover or preview acceptance. It does not explicitly resolve the seven previously required missing-image exceptions. The actual production build failed with `Migration has 7 unresolved media exceptions; pending-media preview only`. A decision to defer those required pictures or approved replacement images is the current blocker.

No correction refresh or production cutover has been published. The existing live v1 root and original preview (`5da786ef…`, release `b924b223850b4a2741fedb92ce924584`) remain unchanged. PR 70 passed prepublication validation but was closed unmerged after the user requested direct production. Its branch retains the verified combined-deployment and durable-archive approach as reference. PR 64 remains draft/unmerged pending media resolution and production integration. No one-time migration was rerun, source data changed, new images acquired or browser stores removed.

See [Review correction checkpoint](pwa/docs/Fishing_v2_Review_Release_2026-09-09.md) for exact refs, CI and continuation. This checkpoint supersedes older statements below that still require user preview acceptance/cutover approval. Chat remains the permanent default; the explicitly authorized Work implementation phase is paused only on the required-media decision.

**Status:** Original September 9 decision body preserved. Removed decision-history files and `History/` remain recoverable at the pre-cleanup checkpoint and in Git history. Previous CURRENT labels do not override the latest approved requirements.

## V2 design approval

All fourteen decisions in the user-annotated Design Review are accepted. Decision source: `0bd773366130a302b0e80d5cd085a71731ff9e63`. The original Inventory and Design Review preserve the user's exact wording. The Approved v2 Baseline is the consolidated requirements authority. The source audit and minimal architecture/contracts are complete, with September 9 implementation addenda. P1 engineering and automated browser acceptance are complete. The isolated [v2 preview](https://ginosega.github.io/fishing/v2-preview/) is published and hosted verification passed; user review is pending. V1 remains at the root. Draft PR 64 is unmerged. See [Fishing_v2_Preview_Release_2026-09-09.md](pwa/docs/Fishing_v2_Preview_Release_2026-09-09.md) for exact evidence and recovery. P2 features remain separately authorized.

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

Workflow-only PR 66 and refresh PR 67 publish the isolated preview with the exact current v1 root, after preserving current and migration-source archives in Git. The [preview release record](pwa/docs/Fishing_v2_Preview_Release_2026-09-09.md) records hosted evidence. The authorized temporary Work phase is complete; review continues in Chat. User preview acceptance, required media and separate production cutover remain open. No P2 work or device inspection is implied.

## Standing decisions

| Area | Decision |
|---|---|
| Operating mode | Chat by default. Work only for a specific Work-only capability with explanation and user approval; complexity, duration, research, files and artifacts alone are not reasons. |
| Source of truth | GitHub is durable. Current structured runtime source and authored Markdown prevail over historical OneNote/PDF, Topics, old chats or stale bootstrap text. |
| End-to-end execution | An authorized change continues through validation, PR/CI, actual deployment verification and state reconciliation. Progress is informational, not an approval gate. Stop only for genuine blockers or complete scope. |
| Preservation | Preserve user-authored text/files, confirmed facts, ownership and actual historical relationships. Do not infer purchases or catch attribution. Preserve direct-main edits and validated source bytes. |
| Project scope | Personal single-user application; no Planner, sessions, speculative graph or multi-user expansion. |
| Documentation | Keep concise current authority and one canonical TODO; historical detail remains in Git history and retained PWA references, not parallel current databases. |
| Releases | Restore current main; normal exact-head/current-base checks for meaningful runtime work, expected-head merge, actual Pages deployment, no skipped meaningful gates, no one-time migration reruns or permission bypass. Avoid overlapping Pages releases. |
| V2 scope control | Requirements approval does not automatically authorize P2. Use approved baseline; ask only for genuine new decisions or explicit implementation authorization. |

## Historical v1 production authority — superseded

The last fully documented v1 application release is PR 60, final head `cd47dc9ce39660840de493346e7df9fda72a14e5`, CI #307 / `34191643311`, merge `ecd9f3d52ca8180ea4f48ec888e7574105deafda`, production #308 / `34191692935`. Later direct-main changes exist. The audited source baseline is `1fa82a0cb653b8205bc8a45a1cf4608a616bf3b2`; the original migration-media run was #312 / `34237232075`. Current preserved v1 is run #314 / `34369680844`, source `cac5b4108a63fcaab498b256afa4420ce2dbbd70`, published unchanged alongside the isolated preview. Verify actual main/current deployment before acting. V1-specific model/media/authoring rules remain in force until cutover.

## V1-only architecture (historical during migration)

Gear schema 4 uses JSON/IndexedDB, paired setups, manufacturer objects, ordered links and external Notes. KB schema 1 uses flat entities and Markdown. Catch schema 2 uses exact known associations and external Notes. The media system has source/owner/override/local manifests and source/derived stages. Browser Gear/KB editing produces source-aware handoffs. V1 preserves stable IDs, explicit ownership, source provenance, safe paths, final transformed-data checks and all accepted user content. Its implementation and historical decisions remain documented in `pwa/README.md`, `pwa/DATA_MODEL_RECONCILIATION_DESIGN.md`, prior Decision Log versions and release files. Do not remove safeguards from live v1 as a shortcut; replace them only with approved v2 architecture after preservation and validation.

## Open work

FISH-TODO-084, FISH-TODO-085, FISH-TODO-086 and FISH-TODO-087 are DONE. The canonical TODO retains deferred P2 and existing fishing/gear research. All seven originally deferred required pictures are resolved; generic inline-spinner remains optional. Production cutover and automated/hosted acceptance are complete. FISH063's old media-authoring policy and FISH039's setup recording are superseded for v2; they do not justify reintroducing retired structures. PowerBait hook-size and loop-knot guidance remain unresolved. The next unused canonical task ID is FISH-TODO-088. No approved future feature is treated as already deployed.