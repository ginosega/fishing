# P3 documentation validation — exact evidence and remaining gate

**Status:** HISTORICAL VALIDATION EXPERIMENT, superseded by [owner-approved independent governance amendment](OWNER_AMENDMENT_INDEPENDENT_GOVERNANCE_2026-11-01.md). The V3 full-suite failure is not a governance blocker; no tooling or application merge occurred. Do **not** mark P3 accepted or activate operating-model routing until the remaining prerequisites pass.

## Separate scoped implementation
- Tooling branch `tooling/fish-ops-v2-doc-validation` and [draft PR #285](https://github.com/ginosega/fishing/pull/285) target the V3 development branch only, not public `main`.
- Changed: `tools/check_project_ops.py`, `tools/test_project_ops.py`, and `.github/workflows/fishing-production.yml`. Existing FISH108 release classifier remains unchanged; `validate-docs` retains `git diff --check` and adds a static checker; full lane runs the validator's regression fixtures.
- Tooling PR source at `05b1743b34fed23178f7838492feb56ed9d41970`. Full [run #41331650515](https://github.com/ginosega/fishing/actions/runs/41331650515) **FAILED** after the validator fixtures, durable recovery checks, dependency audit and core tests PASSED; Playwright preview-scope regression timed out after 12 minutes with repeated 120-second waits for offline-library tests. The **same test names and behavior predated this change** on October 30 [run #41143225486](https://github.com/ginosega/fishing/actions/runs/41143225486). Exact current source run also requires recheck; do not mark #285 full-suite accepted.

## Strict docs-only integration probe (passed)

- Isolated *temporary* draft PR [#286](https://github.com/ginosega/fishing/pull/286) compared **documentation branch as head** with **tooling branch as base**, allowing the GitHub merge-ref to run the newly proposed `validate-docs` without prematurely merging tool code to the feature branch.
- Exact docs head at probe `137101a819510e9cb17b95846795c4578744910e` (this may be behind later docs commits).
- GitHub Actions [run #41332302407](https://github.com/ginosega/fishing/actions/runs/41332302407): `classify` SUCCESS, `validate-docs` SUCCESS, `fishing-merge-ready` SUCCESS; full and content lanes SKIPPED as appropriate. This checks the **actual populated P2 corpus** and its routing/ADR/link/size rules, **not only empty fixtures**.
- PR #286 was **closed unmerged** after the probe; no production/app merge or site deployment.
- Prior docs-only run [#41332122280](https://github.com/ginosega/fishing/actions/runs/41332122280) failed on whitespace trailing double-spaces in seven newly added markdown files. All reported whitespace lines were fixed on the documentation branch. The passing later probe is stronger evidence, but #283 requires a final exact-head run after final source reconciliation.

## Current governance interpretation (2026-11-01 owner amendment)

This is a preserved **historical V3-dependent P3 experiment**. Its remaining application-CI/merge steps are **superseded**, not mandatory. See [independence amendment](OWNER_AMENDMENT_INDEPENDENT_GOVERNANCE_2026-11-01.md), [current state](CURRENT_STATE.md), and [independent validation runbook](VALIDATION_RUNBOOK.md).

- The old full PWA test failure was a valid reason not to merge executable tooling into the existing PWA-owned workflow, but **not a reason to block governance documentation work**.
- [PR #285](https://github.com/ginosega/fishing/pull/285) should remain unmerged; [PR #283](https://github.com/ginosega/fishing/pull/283) is superseded by the independent main-based [PR #288](https://github.com/ginosega/fishing/pull/288).
- The successful strict-docs demonstration [run #41332302407](https://github.com/ginosega/fishing/actions/runs/41332302407) is valid as a historical verification of the *former* candidate corpus, **not** an installed check on the new governance branch.
- New governance validation must verify the exact current #288 HEAD and record the distinction between GitHub's existing whitespace checks and separate deterministic governance structural tests; no permanent CI integration should be claimed until independently installed and verified.
- P4 fresh-chat tests and P5 owner acceptance proceed independently of application test issue [#287](https://github.com/ginosega/fishing/issues/287).

**No public PWA application release, Cloudflare/D1 operation, authoring retry or V3 merge is authorized by this document.**
