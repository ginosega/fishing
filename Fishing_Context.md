# Fishing Context

## Production execution — September 10, 2026

The user authorized production cutover and waived another preview review, then explicitly resolved the picture gate: “Yes, omit those, and those gear and KB items can just have no picture. I will add these to the site later.” The seven named pictures are intentionally absent; all Gear/KB records remain. The generic inline-spinner picture remains optional. `v2/migration/media-decisions.json` records this decision separately from the preserved original migration report. No images were acquired or canonical records changed.

Production implementation and root-scope acceptance are in progress. The consolidated `fishing-production.yml` replaces the old v1/preview publishers and one-time workflows; history and the exact v1 rollback ZIPs remain in Git. The root loader now verifies the v2 worker protocol because v1 and v2 share the same `sw.js` URL. Acceptance covers the actual archived v1 worker, retained IndexedDB/cache stores, both browser engines, full offline reading and all prior integrity/editing assertions. Do not claim deployment until the hosted production gate passes. No additional user approval is needed.

The earlier media-blocked and preview-only checkpoints below are historical and superseded by this decision. See [production release](Fishing_v2_Production_Release_2026-09-10.md) for current execution evidence.


## Current review correction and production checkpoint

The supplied first-review corrections are implemented at `d5f09f058e298f3852f4bf6d0ca2545984a0d6ab` on `feature/v2-implementation-20260908` (PR 69 merged into that feature only). The [feedback record](Fishing_v2_Review_Feedback_2026-09-09.md) preserves the user wording. Engineering and prepublication validation pass 19 core tests and all 20 Chromium/WebKit scenarios, with all 217 live v1 files matching their preserved archive.

**Latest user authorization:** “take this all the way to production; I don't need to test these changes in preview, let's go ahead with this build.” This authorizes production cutover and waives another user preview-review gate. Do not ask again for general cutover or preview acceptance. It does not explicitly resolve the seven previously required missing-image exceptions. The actual production build failed with `Migration has 7 unresolved media exceptions; pending-media preview only`. A decision to defer those required pictures or approved replacement images is the current blocker.

No correction refresh or production cutover has been published. The existing live v1 root and original preview (`5da786ef…`, release `b924b223850b4a2741fedb92ce924584`) remain unchanged. PR 70 passed prepublication validation but was closed unmerged after the user requested direct production. Its branch retains the verified combined-deployment and durable-archive approach as reference. PR 64 remains draft/unmerged pending media resolution and production integration. No one-time migration was rerun, source data changed, new images acquired or browser stores removed.

See [Review correction checkpoint](Fishing_v2_Review_Release_2026-09-09.md) for exact refs, CI and continuation. This checkpoint supersedes older statements below that still require user preview acceptance/cutover approval. Chat remains the permanent default; the explicitly authorized Work implementation phase is paused only on the required-media decision.

**Initial-preview checkpoint (historical):** P1 engineering and automated browser acceptance are complete. The isolated [v2 preview](https://ginosega.github.io/fishing/v2-preview/) is published and hosted verification passed; user review is pending. V1 remains at the root. Draft PR 64 is unmerged. See [Fishing_v2_Preview_Release_2026-09-09.md](Fishing_v2_Preview_Release_2026-09-09.md) for exact evidence and recovery. Reconciled September 9, 2026. Restore actual current GitHub state before acting.

## Authority and current phase

Repository: `ginosega/fishing`. The approved future design is `Fishing_Companion_v2_Approved_Baseline.md`; exact user responses remain in the Requirements Inventory and Design Review at `0bd773366130a302b0e80d5cd085a71731ff9e63`. All fourteen decisions are resolved. Original source audit and technical contracts are preserved with dated September 9 addenda. The current release authority is `Fishing_v2_Preview_Release_2026-09-09.md`; the Work Handoff retains historical engineering evidence.

The initially published preview used `feature/v2-implementation-20260908` at `5da786ef121d7cfa39f98a8c69f3b6cf09f8eca6`, draft PR 64 open and unmerged. Migration `6615ae7296e48d90dceab303b6b5a1fbc041ab80` is unchanged. Acceptance run `34376934726` passed 19 core and 16 Chromium/WebKit browser tests. Workflow-only PR 66 merged at `5679e1a9c7e829b2745efaf0e42986f07eea6ac0`; PR 67 refreshed the footer/workflow at `1922c8d5f249eaf3e556ee71a26d430791c7b997`. Final publication run `34378889165` and actual-hosted evidence are in [Fishing_v2_Preview_Release_2026-09-09.md](Fishing_v2_Preview_Release_2026-09-09.md). These are dated checkpoints, not reset instructions.

## Migration and preservation

The original audit baseline is `1fa82a0cb653b8205bc8a45a1cf4608a616bf3b2`, reconciled to main `79f36144abad39a9515b8f2d7710852f1c7e7114`. The historical migration-media bundle comes from `4f2fe70f47da9cca3704722de87f7282bcc00f83`, run #312 / `34237232075`. The original source and authored Markdown remain authoritative; historical records are reference material, not competing current databases.

The approved migration contains 69 Gear, 54 KB and five Catches. Three paired setups became six independent rod/reel records with exact component facts and duplicated original Notes. Unaffected IDs, original narrative and actual Catch relationships were preserved. Canonical JSON SHA-256 values are Gear `e001c82a49c63b8ac21c93b559bc4768a40d267eff8bdf3fb6e73225cac64256`, KB `85bbf03d55b98432a21ed67288fc11e72c7fcf660a9af6de59ccf4beaa6268a4`, Catches `db97091e484021f0b261b91a27c790bd9f2bd4a8221bbd432e47400e21e9459b`. The full report is `v2/migration/reconciliation.json` on the implementation branch. Do not rerun the one-time migration to resume work.

Forty-nine archived image captures were explicitly approved and adopted exact-byte; two were rejected. Eight exceptions remain: seven required (Tsuridamashii, Rapala F-3, KB Perch, Popper, Whopper Plopper, Mack's Pee Wee Hoochie, River2Sea Whopper Plopper 60) and one optional generic inline-spinner picture. Rapala is now correctly required in the report and enforced by regression coverage. No automatic image acquisition or invented replacements.

The user accepted source equivalence and waived a separate device-only IndexedDB export for this baseline. No device inspection was performed. Preserve v1 browser stores and reconcile any later-discovered local-only records before retirement.

## V2 architecture and engineering state

Three independent Gear/KB/Catch contracts share identity, Markdown, picture, path and validation conventions. Gear has ordinary independent rods/reels; Catch retains optional Species/Location/owned Lure-Bait relationships, text Size and Species-derived pictures. Gear/KB representative pictures use local paths and authored captions. No generic graph, paired setup relationship, media ownership/provenance system, Planner, sessions or speculative structures. P1 includes full-library offline reading and minimal Gear/KB Prepare/Copy handoffs. P2 direct Save, authentication, integrated uploads, offline editing/outbox/sync and Catch browser authoring remain deferred.

The runtime includes pinned Node 24 dependencies, independent contracts, source-aware handoffs, Markdown sanitization, deterministic build and verified complete-release offline reading. Viewer names/selectors, dirty navigation, release-update races, failed-content retry and atomic cache promotion are repaired. Incomplete/corrupt caches cannot report Offline Ready. Four fault-injection core tests and eight scenarios in each of Chromium/WebKit pass; the publication gate repeats them at the exact pinned feature revision. See the technical addendum for test scope and limitations.

## Production and release boundaries

The existing v1 root is `https://ginosega.github.io/fishing/`. All 217 files from actual v1 run #314 / `34369680844` were verified before and after combined publication. Current and older migration-source ZIPs are retained in Git on `checkpoint/v1-before-v2-preview-20260909`, with exact hashes and restore instructions in [Fishing_v2_Preview_Release_2026-09-09.md](Fishing_v2_Preview_Release_2026-09-09.md). Recovery does not depend on expiring CI artifacts.

V2 is published only at `/fishing/v2-preview/` with its own worker scope. Hosted HTML, release pointer, manifest, code, content and images were compared to the pinned build; live browser checks passed. User review and seven required media exceptions remain. Production cutover is now explicitly authorized; resolve or obtain explicit deferral of the seven required pictures, then complete production-scope validation before integration and publication. Preserve combined deployment: a standalone v1 Pages upload would remove the nested preview. Temporary migration/workspace workflows remain inactive historical scaffolding; consolidate them into the final production pipeline when cutover is authorized.

## Current task and process state

FISH071/072/073/074/075/079/080/081 are DONE; FISH076/078 WAITING ON USER; FISH077 DEFERRED. FISH082 is DONE. The next unused task ID is 083. All unrelated backlog work is retained.

Chat mode remains the default. The current authorized Work execution is paused on the required-media decision; do not ask again for general cutover approval. Complexity alone is not a reason to switch modes. Authorized work should proceed through real completion without repeated status-only stops, while preserving current source, permissions, meaningful tests and separate acceptance gates. Before the next chat transfer, reconcile current GitHub state and update Context, Decision Log, TODO, bootstrap and affected release records.
