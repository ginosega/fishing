# Fishing

## Current review correction and production checkpoint

The supplied first-review corrections are implemented at `d5f09f058e298f3852f4bf6d0ca2545984a0d6ab` on `feature/v2-implementation-20260908` (PR 69 merged into that feature only). The [feedback record](Fishing_v2_Review_Feedback_2026-09-09.md) preserves the user wording. Engineering and prepublication validation pass 19 core tests and all 20 Chromium/WebKit scenarios, with all 217 live v1 files matching their preserved archive.

**Latest user authorization:** “take this all the way to production; I don't need to test these changes in preview, let's go ahead with this build.” This authorizes production cutover and waives another user preview-review gate. Do not ask again for general cutover or preview acceptance. It does not explicitly resolve the seven previously required missing-image exceptions. The actual production build failed with `Migration has 7 unresolved media exceptions; pending-media preview only`. A decision to defer those required pictures or approved replacement images is the current blocker.

No correction refresh or production cutover has been published. The existing live v1 root and original preview (`5da786ef…`, release `b924b223850b4a2741fedb92ce924584`) remain unchanged. PR 70 passed prepublication validation but was closed unmerged after the user requested direct production. Its branch retains the verified combined-deployment and durable-archive approach as reference. PR 64 remains draft/unmerged pending media resolution and production integration. No one-time migration was rerun, source data changed, new images acquired or browser stores removed.

See [Review correction checkpoint](Fishing_v2_Review_Release_2026-09-09.md) for exact refs, CI and continuation. This checkpoint supersedes older statements below that still require user preview acceptance/cutover approval. Chat remains the permanent default; the explicitly authorized Work implementation phase is paused only on the required-media decision.

Durable repository for personal fishing/kayak knowledge, owned Gear, catches and Fishing Companion. GitHub is authoritative. Historical records are retained in Git and `History/`, not maintained as competing current databases.

## Existing live preview and source references

**Initial preview remains published.** P1 engineering and automated browser acceptance are complete. The isolated [v2 preview](https://ginosega.github.io/fishing/v2-preview/) is published and hosted verification passed; user review is pending. V1 remains at the root. Draft PR 64 is unmerged. See [Fishing_v2_Preview_Release_2026-09-09.md](Fishing_v2_Preview_Release_2026-09-09.md) for exact evidence and recovery.

The existing v1 site remains live at https://ginosega.github.io/fishing/. Its exact run #314 (`34369680844`) bundle, source `cac5b4108a63fcaab498b256afa4420ce2dbbd70`, was preserved. Preview code is pinned to `5da786ef121d7cfa39f98a8c69f3b6cf09f8eca6` on `feature/v2-implementation-20260908`. The one-time migration remains `6615ae7296e48d90dceab303b6b5a1fbc041ab80`; it was not rerun. No user preview acceptance or production cutover has occurred. Restore actual latest refs before acting.

## Collaborative v2 documents

- [Approved requirements and architecture baseline](Fishing_Companion_v2_Approved_Baseline.md) — accepted product requirements and phase gates.
- [Requirements Inventory](Fishing_Companion_v2_Requirements_Inventory.md) — original user-authored Response column, preserved verbatim.
- [Design Review](Fishing_Companion_v2_Design_Review.md) — all fourteen accepted **[Gino Sega]:** decisions.
- [Source, Dependency and Data Audit](Fishing_Companion_v2_Source_Audit.md) — complete original audit and preservation evidence; [September 9 addendum](Fishing_Companion_v2_Source_Audit_Addendum_2026-09-09.md) records migration and acceptance state.
- [Minimal Architecture and Technical Contracts](Fishing_Companion_v2_Technical_Contracts.md) — complete approved design; [September 9 addendum](Fishing_Companion_v2_Technical_Contracts_Addendum_2026-09-09.md) records executable implementation and remaining engineering gates.
- [Machine-readable schema](v2/contracts/schema.json) — draft-2020-12 structure for the three v2 domains.
- [Preview release and rollback evidence](Fishing_v2_Preview_Release_2026-09-09.md) — exact deployed revisions, tests, review checklist and durable recovery.
- [Work Handoff](Fishing_v2_Work_Handoff_2026-09-09.md) — historical engineering checkpoint and current preview closeout pointer.

Original user responses take precedence over summaries. The approved v2 design supersedes conflicting historical architectural requirements for the future application, not the still-live v1 runtime.

## Authoritative project records

- [Context](Fishing_Context.md) — current source, migration and release status.
- [TODO](Fishing_TODO.md) — canonical open work; engineering, browser acceptance and publication complete; user review, required media and separate cutover remain open.
- [Decision Log](Fishing_Decision_Log.md) — accepted decisions and standing process.
- [New-chat bootstrap](Fishing_New_Chat_Bootstrap_Prompt.md) — current restoration and Chat review instructions.
- [PWA README](pwa/README.md) — current v1 implementation and build commands; [v2 handoff note](pwa/README_v2_Handoff_2026-09-09.md) records the preservation boundary.
- [Latest documented v1 release](pwa/RELEASE_2026-09-08_CRANBERRY_COPY.md) — release evidence, not the final word on later direct-main changes.
- [History](History/) and Git history — archived source, decisions, tests and release evidence.

Root Gear Registry, Tackle Inventory, Topics and former OneNote/PDF material remain historical/reference sources. Structured runtime files and authored Markdown own current facts. Never infer ownership or historical catches from reference material.

## Operating and release discipline

Use Chat mode by default. Do not recommend Work for complexity, duration, file volume, research, calculations, analysis or artifact creation. Recommend temporary Work only for a specific Work-only capability, explain the need and obtain approval. The initial temporary Work phase is historical. The user explicitly authorized the follow-up review implementation and production execution; the required-media decision is the remaining input blocker. P2 remains deferred.

Restore latest main and relevant branches before acting. Preserve user-authored files and direct-main changes. An authorized implementation proceeds end-to-end through validation, normal PR/CI, actual deployment verification and reconciliation without repeated approval gates. Progress updates are informational. Stop only for genuine blockers or completed scope. Respect denied permissions, do not weaken meaningful tests to obtain green, do not rerun one-time migrations, and avoid overlapping Pages releases.

V2 is a clean architecture, not a license to discard data. The initial release is static, single-user and GitHub-backed, with full offline reading and minimal Gear/KB authoring handoffs. The one-time cutover uses a separate preview URL and recoverable v1 baseline. The migration retained exact source content and approved image bytes; seven required media exceptions and one optional missing picture remain. The original device-only export was waived by the user based on source-equivalence evidence; no device inspection is claimed. Preserve the old browser stores. Do not restart an old migration or release from a historical chat.
