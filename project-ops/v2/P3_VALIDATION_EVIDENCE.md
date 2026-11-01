# P3 documentation validation — exact evidence and remaining gate

**Status:** Strict docs-only validation PASS; full application validation **FAILED on a reproducible, pre-existing V3-branch browser-test issue**. [Blocker #287](https://github.com/ginosega/fishing/issues/287) requires separately scoped owner approval for remediation. No merger, deployment or bypass authorized. Do **not** mark P3 accepted or activate operating-model routing until the remaining prerequisites pass.

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

## Remaining mandatory P3 steps
1. Confirm **full application validation** on #285 completed success on exact tool head; if failed, diagnose and correct without dropping required checks.
2. Independently review/change scope and merge **only the tooling PR into the V3 development branch** after full CI. Do not merge to public `main`.
3. Re-run docs-only PR #283 against the now-updated feature branch, checking exact current head, strict `validate-docs`, `fishing-merge-ready` and no unrelated source modification.
4. Record negative fixture result, link integrity and original approval preservation. Keep docs PR draft/unmerged until P4 new-chat owner test and P5 final approval.
5. Do not mistake structural docs CI for verified Cloudflare Worker status or completed historical semantic coverage; those remain separate.

**Owner responsibility:** No routine action. Stop only for P4's genuinely fresh ChatGPT project-chat test or an unresolved material safety/authorization issue.
