# Fishing

Durable repository for personal fishing/kayak knowledge, owned Gear, catches and Fishing Companion. GitHub is authoritative. Historical records are retained in Git and `History/`, not maintained as competing current databases.

## Current state

**V2 requirements approved; application implementation not started.** The latest user decision commit is `0bd773366130a302b0e80d5cd085a71731ff9e63`. All fourteen design-review decisions are resolved. The next work is the read-only source/dependency/data audit and implementation-ready technical contracts. No P2 synchronization or direct-save infrastructure is authorized for P1.

The existing v1 site remains the live application at https://ginosega.github.io/fishing/. Its last fully documented runtime release is PR60, merged as `ecd9f3d52ca8180ea4f48ec888e7574105deafda`, production run `34191692935`. Subsequent direct-main uploads and builds must be inspected from current main, not assumed to match that release. The latest previously inspected completed production run was #312 (`34237232075`), successful. See the current Context and release records for evidence. No v2 code, data or media has been deployed.

## Collaborative v2 documents

- [Approved requirements and architecture baseline](Fishing_Companion_v2_Approved_Baseline.md) — consolidated accepted requirements, technical contract, migration gates and roadmap.
- [Requirements Inventory](Fishing_Companion_v2_Requirements_Inventory.md) — original user-authored Response column; preserved verbatim.
- [Design Review](Fishing_Companion_v2_Design_Review.md) — all fourteen accepted **[Gino Sega]:** decisions and the source-grounded preliminary architecture assessment.

The original user responses take precedence over summaries if a discrepancy is found. The approved v2 design supersedes conflicting historical architectural requirements for the future application, not the still-live v1 runtime.

## Authoritative project records

- [Context](Fishing_Context.md) — actual current runtime and pending v2 state.
- [TODO](Fishing_TODO.md) — canonical open work and v2 implementation phases.
- [Decision Log](Fishing_Decision_Log.md) — accepted decisions and standing process.
- [New-chat bootstrap](Fishing_New_Chat_Bootstrap_Prompt.md) — restoration instructions.
- [PWA README](pwa/README.md) — current v1 implementation and build commands.
- [Latest documented v1 release](pwa/RELEASE_2026-09-08_CRANBERRY_COPY.md) — release evidence, not the final word on later direct-main changes.
- [History](History/) and Git history — archived source, decisions, tests and release evidence.

Root Gear Registry, Tackle Inventory, Topics and former OneNote/PDF material remain historical/reference sources. Structured runtime files and authored Markdown own current facts. Never infer ownership or historical catches from reference material.

## Operating and release discipline

Use Chat mode by default. Do not recommend Work for complexity, duration, file volume, research, calculations, analysis or artifact creation. Recommend temporary Work only for a specific Work-only capability, explain the need and obtain approval.

Restore latest main and relevant branches before acting. Preserve user-authored files and direct-main changes. An authorized implementation proceeds end-to-end through validation, normal PR/CI, merge, actual deployment verification and reconciliation without repeated approval gates. Stop only for a genuine blocker or completed scope. Respect denied permissions, do not weaken meaningful tests to obtain green, do not rerun one-time migrations, and avoid overlapping Pages releases.

V2 is a clean architectural design, not a license to discard data. Its initial release is static, single-user and GitHub-backed, with full offline reading and minimal Gear/KB authoring handoffs. Direct Save and offline synchronization remain separate P2 decisions. The one-time v2 cutover uses a separate preview URL and a recoverable v1 baseline. Do not restart an old migration or release from a historical chat.
