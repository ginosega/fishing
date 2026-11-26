# Fishing project router — durable workstream pointer

**Scope:** This small router is published on repository default `main` when the P5 owner-authorized operating-model activation is complete. Its routed governance documents remain authoritative for dynamic project state; review this default-branch router first. **If encountered only on a non-default draft branch, it does not itself establish adoption.**

Primary workstream: Fishing Companion V3 production maintenance and closeout ([production integration PR #587](https://github.com/ginosega/fishing/pull/587)); production software authority is default `main`. Use canonical [WORK_QUEUE](https://github.com/ginosega/fishing/blob/governance/project-ops/project-ops/v2/WORK_QUEUE.md) and [issue #377](https://github.com/ginosega/fishing/issues/377) to find the next approved work and exact active PR, if any. Historical draft PR #567 is not the active software authority. Operating Model v2 governance remains the support workstream ([issue #282](https://github.com/ginosega/fishing/issues/282)).
Active workstreams: Fishing Companion V3 (default `main`; verify current maintenance branches/PRs via canonical governance); Project governance (canonical branch `governance/project-ops`).
Routed branch: `governance/project-ops`
Entry point: `project-ops/v2/START_HERE.md`
Routing reviewed at: 2026-11-26
Evidence: [P1 owner design acceptance](https://github.com/ginosega/fishing/blob/governance/project-ops/project-ops/v2/P1_DESIGN_APPROVAL_2026-11-01.md) · [independent governance amendment](https://github.com/ginosega/fishing/blob/governance/project-ops/project-ops/v2/OWNER_AMENDMENT_INDEPENDENT_GOVERNANCE_2026-11-01.md) · [P4 passed](https://github.com/ginosega/fishing/blob/governance/project-ops/project-ops/v2/P4_RECOVERY_ACCEPTANCE_2026-11-01.md) · [P5 owner directive](https://github.com/ginosega/fishing/blob/governance/project-ops/project-ops/v2/P5_OWNER_DIRECTIVE_COMPLETE_GOVERNANCE_2026-11-01.md).

## Safe routing

1. Verify this file is on the repository's actual default branch, not a draft or stale worktree.
2. Verify `governance/project-ops` exists in current GitHub refs; then read only its `START_HERE.md`, `CURRENT_STATE.md` and relevant `WORK_QUEUE.md`.
3. Retrieve `OPERATING_RULES.md` before consequential action, and consult applicable accepted/rejected/deferred/superseded topic catalogs before substantive proposals.
4. If branch, issue/PR or evidence is stale, explicitly state uncertainty and use current GitHub issue/PR and original approval evidence; do not bulk-load historic bootstrap.

The independent governance branch carries its own [automated governance CI](https://github.com/ginosega/fishing/blob/governance/project-ops/.github/workflows/governance-docs.yml). Software release validation and independent governance checks remain separate. A passing GitHub source check is never proof of Cloudflare deployment or owner field acceptance.
