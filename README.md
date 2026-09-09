# Fishing

Durable repository for personal fishing/kayak knowledge, owned Gear, catches and Fishing Companion. GitHub is authoritative. Historical records are retained in Git and `History/`, not maintained as competing current databases.

## Current state

**V2 implementation and pinned migration are committed; browser/offline acceptance and isolated preview remain open.** The approved requirements, fourteen user decisions and technical design are complete. The current engineering continuation is documented in [Fishing Companion v2 Work Handoff](Fishing_v2_Work_Handoff_2026-09-09.md). Do not restart the vertical slice or rerun the one-time migration simply because an older document describes it as planned.

The existing v1 site remains live at https://ginosega.github.io/fishing/. The latest inspected successful v1 production run is #312 (`34237232075`), source `4f2fe70f47da9cca3704722de87f7282bcc00f83`. The implementation is isolated on `feature/v2-implementation-20260908`, draft PR 64. The pinned migration succeeded at `6615ae7296e48d90dceab303b6b5a1fbc041ab80`. The first hosted browser run `34330339245` passed 2/6 tests; no v2 preview or production cutover has been accepted. Restore actual latest main and branch before acting.

## Collaborative v2 documents

- [Approved requirements and architecture baseline](Fishing_Companion_v2_Approved_Baseline.md) — accepted product requirements and phase gates.
- [Requirements Inventory](Fishing_Companion_v2_Requirements_Inventory.md) — original user-authored Response column, preserved verbatim.
- [Design Review](Fishing_Companion_v2_Design_Review.md) — all fourteen accepted **[Gino Sega]:** decisions.
- [Source, Dependency and Data Audit](Fishing_Companion_v2_Source_Audit.md) — complete original audit and preservation evidence; [September 9 addendum](Fishing_Companion_v2_Source_Audit_Addendum_2026-09-09.md) records migration and acceptance state.
- [Minimal Architecture and Technical Contracts](Fishing_Companion_v2_Technical_Contracts.md) — complete approved design; [September 9 addendum](Fishing_Companion_v2_Technical_Contracts_Addendum_2026-09-09.md) records executable implementation and remaining engineering gates.
- [Machine-readable schema](v2/contracts/schema.json) — draft-2020-12 structure for the three v2 domains.
- [Work Handoff](Fishing_v2_Work_Handoff_2026-09-09.md) — exact commits, failed browser scenarios, preserved artifacts and next engineering sequence.

Original user responses take precedence over summaries. The approved v2 design supersedes conflicting historical architectural requirements for the future application, not the still-live v1 runtime.

## Authoritative project records

- [Context](Fishing_Context.md) — current source, migration and release status.
- [TODO](Fishing_TODO.md) — canonical open work; implementation and browser acceptance are in progress, migration complete, preview and media resolution open.
- [Decision Log](Fishing_Decision_Log.md) — accepted decisions and standing process.
- [New-chat bootstrap](Fishing_New_Chat_Bootstrap_Prompt.md) — current restoration and temporary Work continuation instructions.
- [PWA README](pwa/README.md) — current v1 implementation and build commands; [v2 handoff note](pwa/README_v2_Handoff_2026-09-09.md) records the preservation boundary.
- [Latest documented v1 release](pwa/RELEASE_2026-09-08_CRANBERRY_COPY.md) — release evidence, not the final word on later direct-main changes.
- [History](History/) and Git history — archived source, decisions, tests and release evidence.

Root Gear Registry, Tackle Inventory, Topics and former OneNote/PDF material remain historical/reference sources. Structured runtime files and authored Markdown own current facts. Never infer ownership or historical catches from reference material.

## Operating and release discipline

Use Chat mode by default. Do not recommend Work for complexity, duration, file volume, research, calculations, analysis or artifact creation. Recommend temporary Work only for a specific Work-only capability, explain the need and obtain approval. The user has authorized a temporary Work session for authenticated repository/development/browser execution through the isolated v2 preview. This does not authorize P2 features or production cutover.

Restore latest main and relevant branches before acting. Preserve user-authored files and direct-main changes. An authorized implementation proceeds end-to-end through validation, normal PR/CI, actual deployment verification and reconciliation without repeated approval gates. Progress updates are informational. Stop only for genuine blockers or completed scope. Respect denied permissions, do not weaken meaningful tests to obtain green, do not rerun one-time migrations, and avoid overlapping Pages releases.

V2 is a clean architecture, not a license to discard data. The initial release is static, single-user and GitHub-backed, with full offline reading and minimal Gear/KB authoring handoffs. The one-time cutover uses a separate preview URL and recoverable v1 baseline. The migration retained exact source content and approved image bytes; seven required media exceptions and one optional missing picture remain. The original device-only export was waived by the user based on source-equivalence evidence; no device inspection is claimed. Preserve the old browser stores. Do not restart an old migration or release from a historical chat.
