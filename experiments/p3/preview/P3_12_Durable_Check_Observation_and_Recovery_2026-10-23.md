# FISH118 P3-12 — Durable sandbox CI observation and recovery

**Date:** October 23, 2026  
**Status:** Source-only implementation on unpublished, draft [Fishing PR #263](https://github.com/ginosega/fishing/pull/263); **no deployment, no migration execution, no GitHub write authorization, no sandbox merge**.

## Baseline and evidence

- Production `ginosega/fishing` public main remained `4a1a8c44317b56a4d47e818db9cd2b5587a966d8`, hosted-release ID `504d615b2bef361da06d655ee621d43a`, protected by GitHub Free active ruleset #25742040. All P3 work stays on the feature branch in draft PR #263.
- Private synthetic `ginosega/fishing-p3-sandbox` main remains `e37db3b18bd9948bf4453d7f885f868e830a9a9a`; synthetic draft PR #1 remains open and unmerged.
- The P3-11 **owner-executed live proof** confirmed the dedicated App installation `Checks:read`, an ephemeral sandbox-only `contents:read`, `pull_requests:read`, `checks:read` grant, exact PR head `7e39c018081e9677b33c3bcab7ebe80b44d924f8`, and GitHub Actions check-run ID `120492395098` completed/success. Source: [P3-11 report](P3_11_App_Checks_Read_Proof_Handoff_2026-10-23.md). The proof did not perform mutation attempts or deploy a Worker.

## Changes staged in draft PR #263

1. [Migration 0003](migrations/0003_ci_observation_recovery.sql) adds `p3_ci_observations` with immutable repository/PR/head/base/branch identity and bounded attempt count; a separate append-only `p3_ci_observation_audit` table receives a row for every inserted or updated observation through SQL triggers. The schema is confined to the isolated P3 database; **0002 and 0003 have not been applied to live D1**.
2. [D1 observation adapter](src/d1-check-observation-store.mjs) checks the exact owner, repo ID `1430581407`, `Checking` state, PR head/base and unexpired lease in a **single fenced SQL statement**. It uses a compare-and-swap attempt number, refuses replacement of a prior `passed` or `review` result, and releases leases without changing the operation's main state. No GitHub API or write-to-repository methods exist.
3. [Checking coordinator](src/sandbox-check-coordinator.mjs) is independent, not deployed, and **disabled by default**. When explicitly constructed by a future trusted server, it claims an existing `Checking` operation, rechecks its immutable D1 receipt, invokes only the restricted sandbox check observer, validates the returned non-mergeable evidence, records the attempt durably and releases the claim. There is **no `Merging` transition, PR update, token-write issuer, deployment, or production path**.
4. The [sandbox check observer](src/sandbox-check-observer.mjs) now differentiates `CHECK_PENDING` from `CHECK_NOT_SUCCESSFUL`: checks still running are retryable; completed failures require review.
5. The [in-memory SQLite fixture](test/d1-fixture.mjs) now tests source-only schema 0003 alongside 0001/0002. [Recovery tests](test/check-observation-recovery.test.mjs) exercise the real SQLite lease/receipt/audit code and mocked read-only check observations.

## Recovery policy

| Condition | Persisted result / action |
| --- | --- |
| Exact-head GitHub Actions check completed/success | Store immutable success evidence and request **manual review**; stay `Checking` |
| In-progress or not-yet-present check, temporary GitHub read/network problem | Store `retry`, schedule bounded exponential backoff, release lease |
| Scheduled retry not yet due | No GitHub API call and no additional attempt; release lease |
| Twelve unsuccessful transient observations | Store `review` with `ci_retry_exhausted`; no further automatic polling |
| Completed unsuccessful check, wrong PR identity, wrong Actions App or untrusted proof | Store `review`; stop automatic retry |
| Main/PR/lease changes during read, CAS race, DB error or lost lease | Refuse success; require reconciliation/recovery; never assume a write succeeded |
| Restart after recorded success/review | Return previously recorded non-mergeable evidence; no new API request or overwriting prior success |

Exponential retry delays start at 15 seconds and cap at 480 seconds per attempt, with at most 12 checks per operation. The schema and store record no GitHub JWTs, App installation tokens, private keys or raw GitHub exception bodies. The `reason_code` values are static, bounded diagnostic codes. Source-only test clocks are synthetic; no job scheduling, alarm or Cloudflare task was enabled.

## Validation and limitations

- The first complete exact-branch validation passed [GitHub Actions #40031322094](https://github.com/ginosega/fishing/actions/runs/40031322094): **80 PWA + 43 standalone + 112 P3 preview = 235/235 passed**; 14 new P3-D01 through P3-D14 recovery tests passed.
- Checks include pending→retry→success, cooldown suppression, failed/forged check refusal, wrong/moved PR, active and expired leases, network reads exceeding lease expiry, receipt CAS refusal, 12-attempt cap, immutable audit history, and no merge/deployment surfaces.
- This is **source-only end-to-end behavior**, not a live App-created PR, D1 deployment test, GitHub-hosted CI poll, or live Cloudflare Worker test. The previous P3-11 live read proof stands separately.
- The coordinator has not been wired into the existing `sandbox-dispatcher.mjs`, which currently stops at `Checking`. That integration requires a reviewed trusted runner and actual D1 migration before deployment.
- A successful historical check is only an observation. It is **never merge authority**, and future production publishing must still independently verify a fresh exact-head+base required check under the production protection ruleset.

## Gates unchanged

Do not run D1 migrations 0002/0003 in Cloudflare, enable `P3_WRITE_ENABLED`, add a Worker route, activate a scheduled poller, create/merge an App-published sandbox PR, change GitHub App permissions, change production `main`, or cut over v3 without the applicable explicit authorization. The private sandbox remains unprotected on GitHub Free, so sandbox auto-merge remains prohibited.

**Next suggested stage:** source-only trusted-runner integration design and additional crash/reconciliation tests, then separately request approval for any isolated D1 migration or Worker deployment. **Chat mode supports this work; Work mode is not necessary.**
