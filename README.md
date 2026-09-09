# Fishing

Durable repository for personal fishing/kayak knowledge, owned Gear, catches and Fishing Companion. GitHub is authoritative. Historical records remain in Git and `History/`, not in competing current databases.

## Current state — September 9, 2026

**V1 is the production application. V2 implementation and its pinned one-time migration are committed on an isolated feature branch. Browser/offline acceptance is incomplete; the v2 preview has not been published or accepted.** The current handoff is [Fishing v2 Work Handoff](Fishing_v2_Work_Handoff_2026-09-09.md). Do not resume from the older design-only checkpoint.

The user has approved a temporary Work session for the specific need to run an authenticated development environment, inspect browser failures, implement corrections and carry the authorized work through the isolated preview. Chat remains the default project mode. This is not authorization for production cutover or P2 features.

| Authority | Current checkpoint |
|---|---|
| Main at reconciliation | `79f36144abad39a9515b8f2d7710852f1c7e7114` |
| V2 implementation branch | `feature/v2-implementation-20260908`, head `24f57ca7d72a9751e0935c6eb46e842f61493db2` |
| Draft integration PR | [#64](https://github.com/ginosega/fishing/pull/64), open and unmerged |
| Verified migration | `6615ae7296e48d90dceab303b6b5a1fbc041ab80`, run [34328748390](https://github.com/ginosega/fishing/actions/runs/34328748390) succeeded |
| Latest inspected browser gate | [34330339245](https://github.com/ginosega/fishing/actions/runs/34330339245), failed: 2 passed, 4 failed |
| Production | [Fishing Companion v1](https://ginosega.github.io/fishing/), latest verified build run #312 / `34237232075` |
| Intended preview | `/fishing/v2-preview/`, not yet deployed |

The approved migration contains 69 Gear records, 54 KB entries and five Catches; 49 explicitly approved archived images were adopted byte-for-byte. Eight media exceptions remain documented. The current report incorrectly marks the missing Rapala F-3 picture optional; that classification requires correction before acceptance. No source data should be silently discarded or the migration rerun merely because a later chat starts.

## Start or resume work

Read [Fishing_Context.md](Fishing_Context.md), [Fishing_TODO.md](Fishing_TODO.md), [Fishing_Decision_Log.md](Fishing_Decision_Log.md), and the [new-chat bootstrap](Fishing_New_Chat_Bootstrap_Prompt.md). The handoff contains exact CI failures, source hashes, recovery artifacts, and the next engineering actions. Always fetch current GitHub state before making changes; the commit IDs above are a dated checkpoint, not an instruction to reset newer work.

## Collaborative v2 documents

- [Approved requirements and architecture baseline](Fishing_Companion_v2_Approved_Baseline.md) — accepted product scope and phase gates.
- [Requirements Inventory](Fishing_Companion_v2_Requirements_Inventory.md) — original user-authored Response column, preserved verbatim.
- [Design Review](Fishing_Companion_v2_Design_Review.md) — all fourteen accepted **[Gino Sega]:** decisions.
- [Source, Dependency and Data Audit](Fishing_Companion_v2_Source_Audit.md) — original audit plus current migration evidence and exceptions.
- [Minimal Architecture and Technical Contracts](Fishing_Companion_v2_Technical_Contracts.md) — binding design and current implementation addendum.
- [Machine-readable schema](v2/contracts/schema.json) — draft-2020-12 contracts for the three v2 domains.
- [Migration reconciliation](v2/migration/reconciliation.json) — exact transformation, files, SHA-256 and unresolved exceptions on the feature branch.

Original user responses take precedence over summaries. The approved v2 design supersedes conflicting historical architecture for the future application, not the still-live v1 runtime.

## Authoritative project records

- [Context](Fishing_Context.md) — current state, preservation and phase boundaries.
- [TODO](Fishing_TODO.md) — canonical open work and current task statuses.
- [Decision Log](Fishing_Decision_Log.md) — accepted decisions and standing process.
- [Work Handoff](Fishing_v2_Work_Handoff_2026-09-09.md) — dated recovery/continuation checkpoint for this chat transfer.
- [New-chat bootstrap](Fishing_New_Chat_Bootstrap_Prompt.md) — copy-ready restoration instructions.
- [PWA README](pwa/README.md) — still-live v1 implementation and build commands.
- [Latest documented v1 feature release](pwa/RELEASE_2026-09-08_CRANBERRY_COPY.md) — historical release evidence, not a substitute for later source/CI verification.
- [History](History/) and Git history — archived source, decisions, tests and releases.

Root Gear Registry, Tackle Inventory, Topics and former OneNote/PDF material remain historical/reference sources. Structured runtime files and authored Markdown own current facts. Never infer ownership or catches from reference material.

## Operating and release discipline

Use Chat by default. Recommend temporary Work only for a specific Work-only capability with explanation and user approval; complexity, duration, research, calculations, files or artifacts alone are not reasons. The current temporary Work authorization applies to the v2 engineering/preview phase only.

Restore latest main and relevant branches before acting. Preserve user-authored files, direct-main changes and exact source bytes. An authorized implementation proceeds end-to-end through validation, PR/CI, deployment verification and reconciliation without repeated approval gates. Progress updates are informational. Stop only for genuine blockers or completed scope. Never claim a test or deployment passed without evidence; do not weaken meaningful tests, bypass permissions, or rerun one-time migrations without a justified preservation need.

V2 is a static, single-user, GitHub-backed application with full offline reading and minimal Gear/KB authoring handoffs. P2 direct Save, authentication, integrated uploads, offline editing/sync and Catch browser authoring remain deferred. Preserve v1 until an isolated preview is accepted and a separate production-cutover approval is given. Maintain a recoverable v1 checkpoint and avoid overlapping Pages releases. Only the accepted final cutover may remove obsolete active v1 runtime code; retain Git history and a rollback artifact.
