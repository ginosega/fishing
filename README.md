# Fishing

V2 is published at [Fishing Companion](https://ginosega.github.io/fishing/). Production revision `ceef1df0dd8b204e7aa59c63e95a0d75346f4a92`, release `7ff6f62d921d5e86e0d97ae89b361120`, passed [publication and hosted verification](https://github.com/ginosega/fishing/actions/runs/34441600093). PR64 is merged. The user authorized production and waived another preview review; all seven previously required missing pictures are explicitly deferred. The affected records remain available without pictures. No acceptance or media approval blocks this release.

Validation: 20 core tests, 20 preview-scope and 22 production-scope Chromium/WebKit scenarios, including the actual archived-v1 worker transition and retained browser stores. All 197 hosted files match the verified production build; live navigation, image viewer, offline reload, counts and absent-picture behavior pass. These are automated browser and direct hosted checks, not physical-device inspection.

The sole active pipeline is `.github/workflows/fishing-production.yml`. V1 and the earlier preview are historical; use the production root. V1 sources and exact rollback ZIPs remain in Git. Old browser stores are retained. P2 remains deferred. This authorized Work phase is complete; continue in Chat.

## Project authority

GitHub `ginosega/fishing` is the durable source of truth. Restore actual latest main before acting and preserve newer user changes. Current domain sources are `Gear/gear.json`, `KB/kb.json`, `Catches/catches.json`, their authored Markdown and local image bytes. Historical root registries, Topics, `pwa/` and `History/` are reference material, not competing runtime databases.

- [Context](Fishing_Context.md), [TODO](Fishing_TODO.md) and [Decision Log](Fishing_Decision_Log.md).
- [New Chat bootstrap](Fishing_New_Chat_Bootstrap_Prompt.md) — copy the full contents into a Chat conversation.
- [Production release and recovery](Fishing_v2_Production_Release_2026-09-10.md).
- [Approved Baseline](Fishing_Companion_v2_Approved_Baseline.md), [Requirements Inventory](Fishing_Companion_v2_Requirements_Inventory.md) and [Design Review](Fishing_Companion_v2_Design_Review.md) — original user responses remain authoritative.
- [Source Audit](Fishing_Companion_v2_Source_Audit.md) and [addendum](Fishing_Companion_v2_Source_Audit_Addendum_2026-09-09.md); [Technical Contracts](Fishing_Companion_v2_Technical_Contracts.md), [addendum](Fishing_Companion_v2_Technical_Contracts_Addendum_2026-09-09.md) and [schema](v2/contracts/schema.json).
- [Verbatim review feedback](Fishing_v2_Review_Feedback_2026-09-09.md); [review checkpoint](Fishing_v2_Review_Release_2026-09-09.md), [original preview release](Fishing_v2_Preview_Release_2026-09-09.md) and [Work Handoff](Fishing_v2_Work_Handoff_2026-09-09.md) are dated historical evidence.

## Scope and operation

Three independent Gear/KB/Catch domains share identity, Markdown, picture and validation conventions. P1 includes read-only Catch Log, full-library offline reading and minimal source-aware Gear/KB Prepare Changes → Copy Changes handoffs. Direct Save, authentication, uploads, offline editing/outbox/sync and Catch browser authoring remain deferred. No Planner, sessions, paired-setup relationships, speculative ownership/media graph, accounts or multi-user expansion.

Chat is the permanent default. Work requires a specific approved execution need; complexity, duration, research or file volume alone are not reasons to switch. Authorized work proceeds through meaningful tests, normal feature PR/CI, exact-head/current-base checks, serialized deployment and hosted verification without repeated approval requests. Preserve source and history; never rerun the one-time migration or acquire pictures automatically.

## Build

Use Node24 and the locked `v2/package-lock.json`: `npm ci`, `npm test`, `npm run build -- --base=/fishing/`, `npm run verify` from `v2/`. The production workflow additionally runs both browser scopes and real v1 cutover acceptance. Update source through a feature PR; main source/runtime changes run the complete gate before one Pages deployment. Documentation-only reconciliation does not republish the application.
