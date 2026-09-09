# Fishing

Durable repository for personal fishing/kayak knowledge, owned Gear, catches and Fishing Companion. GitHub is authoritative. Historical records are retained in Git and `History/`, not maintained as competing current databases.

## Current state

**V2 requirements approved; repository audit and minimal technical design complete; application implementation not started.** All fourteen user decisions are resolved. The user has authorized the source/dependency/data audit and engineering contracts. Their findings and outstanding migration gates are recorded below. The next implementation milestone is the small Gear/KB/Catch vertical slice. P2 direct Save, authentication and offline synchronization remain separately deferred.

The existing v1 site remains live at https://ginosega.github.io/fishing/. The audited source baseline is `1fa82a0cb653b8205bc8a45a1cf4608a616bf3b2`. The latest inspected successful production run is #312 (`34237232075`), for source commit `4f2fe70f47da9cca3704722de87f7282bcc00f83`. The last fully documented feature release is PR60, merge `ecd9f3d52ca8180ea4f48ec888e7574105deafda`, production `34191692935`. No v2 runtime, migration, preview or production cutover has occurred. Restore actual latest main before acting.

## Collaborative v2 documents

- [Approved requirements and architecture baseline](Fishing_Companion_v2_Approved_Baseline.md) — accepted product requirements and phase gates.
- [Requirements Inventory](Fishing_Companion_v2_Requirements_Inventory.md) — original user-authored Response column, preserved verbatim.
- [Design Review](Fishing_Companion_v2_Design_Review.md) — all fourteen accepted **[Gino Sega]:** decisions.
- [Source, Dependency and Data Audit](Fishing_Companion_v2_Source_Audit.md) — exact source/build evidence, media exceptions, migration mapping and reliability findings.
- [Minimal Architecture and Technical Contracts](Fishing_Companion_v2_Technical_Contracts.md) — domain contracts, files/media, authoring, offline, UI, dependencies and release design.
- [Machine-readable schema](v2/contracts/schema.json) — draft-2020-12 structure for the three v2 domains.

Original user responses take precedence over summaries. The approved v2 design supersedes conflicting historical architectural requirements for the future application, not the still-live v1 runtime.

## Authoritative project records

- [Context](Fishing_Context.md) — current source, completed audit, preservation findings and pending state.
- [TODO](Fishing_TODO.md) — canonical open work; FISH072 complete, FISH073–076 implementation/cutover, FISH078–079 media/device gates.
- [Decision Log](Fishing_Decision_Log.md) — accepted decisions and standing process.
- [New-chat bootstrap](Fishing_New_Chat_Bootstrap_Prompt.md) — restoration instructions.
- [PWA README](pwa/README.md) — current v1 implementation and build commands.
- [Latest documented v1 release](pwa/RELEASE_2026-09-08_CRANBERRY_COPY.md) — release evidence, not the final word on later direct-main changes.
- [History](History/) and Git history — archived source, decisions, tests and release evidence.

Root Gear Registry, Tackle Inventory, Topics and former OneNote/PDF material remain historical/reference sources. Structured runtime files and authored Markdown own current facts. Never infer ownership or historical catches from reference material.

## Operating and release discipline

Use Chat mode by default. Do not recommend Work for complexity, duration, file volume, research, calculations, analysis or artifact creation. Recommend temporary Work only for a specific Work-only capability, explain the need and obtain approval.

Restore latest main and relevant branches before acting. Preserve user-authored files and direct-main changes. An authorized implementation proceeds end-to-end through validation, normal PR/CI, merge, actual deployment verification and reconciliation without repeated approval gates. Progress updates are informational. Stop only for genuine blockers or completed scope. Respect denied permissions, do not weaken meaningful tests to obtain green, do not rerun one-time migrations, and avoid overlapping Pages releases.

V2 is a clean architecture, not a license to discard data. The initial release is static, single-user and GitHub-backed, with full offline reading and minimal Gear/KB authoring handoffs. The one-time cutover uses a separate preview URL and recoverable v1 baseline. The audit identified remote-only images and potential browser-only data that must be reconciled before migration acceptance. Do not restart an old migration or release from a historical chat.