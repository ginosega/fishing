# P5 — Fishing Project Operating Model v2 adoption decision package

**Status:** **AWAITING EXPLICIT OWNER DECISION. NOT ADOPTED.** No merge, router activation, alteration of old approvals, or public V3 cutover is authorized by this file.
**Proposed integration:** [Independent governance PR #288](https://github.com/ginosega/fishing/pull/288), `governance/fish-ops-v2-independent` → `main`, docs-only.
**Previous stages:** [P1 design approval](P1_DESIGN_APPROVAL_2026-11-01.md), [independence amendment](OWNER_AMENDMENT_INDEPENDENT_GOVERNANCE_2026-11-01.md), [P2 migration reconciliation](P2_MIGRATION_RECONCILIATION_2026-11-01.md), [P3 independent verification](P3_INDEPENDENT_VALIDATION_2026-11-01.md), [P4 owner-observed PASS](P4_RECOVERY_ACCEPTANCE_2026-11-01.md).

## What adoption would activate

- Publish root `PROJECT_ROUTER.md` and static `NEW_CHAT_PROMPT.md` on repository default branch `main`. The static prompt will **not** contain status snapshots/temporary PRs, and on every future handoff will find the latest context via the default router. The router should be checked against the current `main` SHA/refs on each new chat.
- Adopt five bounded, role-owned docs under `project-ops/v2/`: `START_HERE`, `CURRENT_STATE`, `WORK_QUEUE`, `OPERATING_RULES`, and `DECISIONS_INDEX`, with topic-based catalogs and linked decision records/original evidence.
- Retain full historical original root Context/TODO/Decision Log/bootstrap and approved requirements. **No deletion or retroactive rewriting**. Old bootstrap becomes deprecated for new startup **only after P5**; add a concise transition pointer to README if needed, with non-destructive review and docs-only validation.
- Use exact static prompt for planned and emergency transfers; assistant checkpoints before planned transfer, newly started chats independently reconcile latest Git refs and pending operations. No need for user to reconstruct whole chat or paste giant bootstrap.
- Keep V3 application development separately paused until its own source/provider/test/owner safety gates are independently resumed. Do **not** merge V3 PR #263 or claim the Gear Notes fix was hosted; do **not** retry ambiguous Catch publication.

## Evidence at P5 review

- P2 source migration: seven topical decision catalogs (49 indexed decisions) and nine detail ADRs covering accepted/rejected/superseded lessons, 56-heading original Decision Log crosswalk, independent fishing equipment/KB backlog, historical original approvals retained.
- P3: bounded document sizes, local relative links, ID uniqueness and original approval provenance checked; 12/12 positive/negative independent fixtures passed. [GitHub docs-only run #41338032332](https://github.com/ginosega/fishing/actions/runs/41338032332) PASS at `9ceb8fd6ee5983dcb4a3ce765ab1330a5c0dfb60` before P4 evidence was added. **Refresh the SHA/CI before any merge**.
- P4: owner tested both unprepared emergency and normal prepared transfer in genuinely fresh Fishing-project chats and separately challenged prior rejected approaches and deployment ambiguity. [P4 acceptance](P4_RECOVERY_ACCEPTANCE_2026-11-01.md) marks A/B/C/D **PASS**.
- Source control: original PR #283 (V3-coupled docs) and #285 (V3-coupled tooling) are closed unmerged. PR #288 is based directly on `main`, with added Markdown governance docs only and no app code, workflow, provider or credential changes.

## Material limitation needing explicit owner acceptance

**Permanent automated governance structural CI is NOT installed.** The existing main GitHub `validate-docs` step currently runs `git diff --check` (whitespace), followed by `fishing-merge-ready` for docs-only PRs. The fuller checks (size caps, schema/IDs, local links, negative decisions/ADR provenance and 12 adversarial fixtures) were run **independently and recorded** under [validation runbook](VALIDATION_RUNBOOK.md), but will **not automatically execute as a required GitHub status on every future PR**.

Issue [#284](https://github.com/ginosega/fishing/issues/284) remains open to design/install a truly governance-independent automatic check **without relaxing FISH108 or depending on broken V3 browser tests**. Until resolved, operating rules require the assistant to execute independent structural and semantic checks on every material governance-document change before merge, record failure evidence and preserve bounded size/link policies. This is a process control, **not** equivalent to a permanent CI gate.

**Decision options:**
1. **Adopt now with explicitly accepted interim per-change validation**, retaining #284 as an outstanding high-priority independent-governance follow-up. Only if the owner expressly approves should #288 be finalized, checked again and merged to `main`.
2. **Defer adoption until automatic continuous structural CI is implemented**, while keeping draft #288 and fully functional static prompt accessible on its draft branch. Continue using historical handoff policy meanwhile.

Neither option authorizes weakening PWA tests, public V3 deployment, new services/credentials, or fictional provider acceptance.

## Owner decision requested

Does the owner approve **P5 adoption with the documented interim independent per-change structural validation in place of permanent required GitHub CI**, while #284 remains an open follow-up, or prefer to defer activation until that permanent CI is installed?

On adoption approval: assistant must verify current `main` and PR #288 exact HEAD/CI, ensure only docs changed, address any router/README discoverability and status labels without rewriting originals, run independent structural checks again, and then merge **only** authorized docs. Recheck default-branch router and static prompt after merge. Report the real merge SHA; never claim public PWA deployment was tested.
