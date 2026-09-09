# Fishing Context

**Status:** P1 engineering and automated browser acceptance are complete. The isolated [v2 preview](https://ginosega.github.io/fishing/v2-preview/) is published and hosted verification passed; user review is pending. V1 remains at the root. Draft PR 64 is unmerged. See [Fishing_v2_Preview_Release_2026-09-09.md](Fishing_v2_Preview_Release_2026-09-09.md) for exact evidence and recovery. Reconciled September 9, 2026. Restore actual current GitHub state before acting.

## Authority and current phase

Repository: `ginosega/fishing`. The approved future design is `Fishing_Companion_v2_Approved_Baseline.md`; exact user responses remain in the Requirements Inventory and Design Review at `0bd773366130a302b0e80d5cd085a71731ff9e63`. All fourteen decisions are resolved. Original source audit and technical contracts are preserved with dated September 9 addenda. The current release authority is `Fishing_v2_Preview_Release_2026-09-09.md`; the Work Handoff retains historical engineering evidence.

The implementation branch `feature/v2-implementation-20260908` is pinned at `5da786ef121d7cfa39f98a8c69f3b6cf09f8eca6`, draft PR 64 open and unmerged. Migration `6615ae7296e48d90dceab303b6b5a1fbc041ab80` is unchanged. Acceptance run `34376934726` passed 19 core and 16 Chromium/WebKit browser tests. Workflow-only PR 66 merged at `5679e1a9c7e829b2745efaf0e42986f07eea6ac0`; PR 67 refreshed the footer/workflow at `1922c8d5f249eaf3e556ee71a26d430791c7b997`. Final publication run `34378889165` and actual-hosted evidence are in [Fishing_v2_Preview_Release_2026-09-09.md](Fishing_v2_Preview_Release_2026-09-09.md). These are dated checkpoints, not reset instructions.

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

V2 is published only at `/fishing/v2-preview/` with its own worker scope. Hosted HTML, release pointer, manifest, code, content and images were compared to the pinned build; live browser checks passed. User review and seven required media exceptions remain. Do not merge PR 64, remove v1 code or cut over until explicit preview acceptance and separate cutover authorization. Preserve combined deployment: a standalone v1 Pages upload would remove the nested preview. Temporary migration/workspace workflows remain inactive historical scaffolding; consolidate them into the final production pipeline when cutover is authorized.

## Current task and process state

FISH071/072/073/074/075/079/080/081 are DONE; FISH076/078 WAITING ON USER; FISH077 DEFERRED. The next unused task ID is 082. All unrelated backlog work is retained.

Chat mode remains the default. The authorized temporary Work phase through hosted preview verification is complete; return to Chat for review. Complexity alone is not a reason to switch modes. Authorized work should proceed through real completion without repeated status-only stops, while preserving current source, permissions, meaningful tests and separate acceptance gates. Before the next chat transfer, reconcile current GitHub state and update Context, Decision Log, TODO, bootstrap and affected release records.
