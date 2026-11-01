# P5 implementation — one canonical governance branch, no PWA deployment

**Date:** 2026-11-01  
**Status:** IMPLEMENTATION UNDERWAY — P5 owner directed finishing automatically required governance CI before activation. This file does **not** certify that a GitHub protection rule has been installed or main router merged.

## Rationale / adopted implementation approach

The owner explicitly approved a robust operating model **independent of PWA V3 development**, and asked for permanent automatic checks before adoption. An initial tooling-only PR against public `main` would cause the PWA-owned production workflow to run because its main-push path filter matches all `.github/workflows/**`; installing governance CI on `main` therefore could trigger an unrelated public V2 rebuild/redeployment. That is not necessary.

**Separate ownership now:**
- **`main`** is the stable, public/default project discovery location. The only new files on its [router PR #292](https://github.com/ginosega/fishing/pull/292) are `PROJECT_ROUTER.md` and unchanged `NEW_CHAT_PROMPT.md` (both Markdown). The existing docs-only FISH108 lane handles this PR, without an application build/deployment.
- **`governance/project-ops`** is the *single canonical active* governance state, operating rules, work queue, decision topical catalogs, ADRs and original decision-log index. It also contains the independent `.github/workflows/governance-docs.yml` and `tools/check_project_ops.py`/ `tools/test_project_ops.py`. Source is based on public main plus governance-only changes; it is not the V3 PR branch.
- The default router sends a new chat to the independently maintained governance branch. No second copy of active docs will be merged into `main`.
- **`feature/fish118-p3-mock-publisher`** remains separate V3 engineering source and retains its own FISH108 app/Cloudflare/Pages/field gates.

A workflow file on `governance/project-ops` does not trigger the PWA production workflow's **push** event, which filters branches to `main`/a historical V2 implementation branch. Ordinary docs-only PRs targeted at governance run **both** the new `governance-docs` structural job and existing FISH108 `validate-docs`/`fishing-merge-ready`, with Full App/deploy lanes skipped. This is a separation of **source/CI ownership**, not relaxation of FISH108 for real app changes.

## Verified integration proof

- Earlier [positive corpus PR #290](https://github.com/ginosega/fishing/pull/290) and [negative link PR #291](https://github.com/ginosega/fishing/pull/291) used the new workflow on a branch and demonstrated PASS / intentional FAIL respectively; both closed unmerged.
- Dedicated canonical branch integration tested by [valid PR #293](https://github.com/ginosega/fishing/pull/293) and [invalid PR #294](https://github.com/ginosega/fishing/pull/294). Capture the **actual exact check-run conclusions** before claiming results; both are temporary and must close unmerged.
- The validator executes standard-library Python, on every PR (no user secrets or hosted services), with required active files/fields, static prompt, local links, work/decision IDs, ADR provenance, byte budgets, audited host verification assertions and fixture regressions. It never certifies private/public deployment.
- Original governance recovery P4 A/B/C/D **passed** in real fresh ChatGPT Fishing-project conversations and is documented in [P4 acceptance](P4_RECOVERY_ACCEPTANCE_2026-11-01.md).

## Mandatory owner-only GitHub branch protection action

The GitHub app permits reading rulesets but **not writing/editing branch protection rulesets**. Until a ruleset is installed on the **governance branch**, `governance-docs` may fail yet a PR can still merge (negative proof exposed this gap). This must not be called enforced.

Owner opens repository **Settings → Rules → Rulesets** and creates a branch ruleset named e.g. `governance-project-ops`, targeted to branch `governance/project-ops`. Configure:
- Require a pull request before merging, no bypass.
- Require status checks to pass, **strict/up-to-date**:
  - `governance-docs` (from GitHub Actions)
  - `fishing-merge-ready` (existing FISH108 check).
- Disallow force-push and branch deletion, matching the existing main integrity controls.
- Activate the ruleset. The assistant will read back the ruleset and demonstrate the intentionally broken documentation PR cannot merge while a valid one can pass. The owner need not perform any local test or code changes.

**Do not add a second main-based source of truth** or edit the existing main FISH108 workflow merely to make this process pass.

## Final activation after required branch rule

1. Read back active governance ruleset and exact branch ref; prove invalid PR blocked on required status, valid PR green, no public Pages deployment.
2. Verify router-only [PR #292](https://github.com/ginosega/fishing/pull/292) exact SHA, changed paths, `validate-docs` and `fishing-merge-ready` PASS. Confirm current `main` ref and strict ruleset.
3. Mark #292 ready and merge through normal protected main PR path, never bypassing required CI. Validate `PROJECT_ROUTER.md` and `NEW_CHAT_PROMPT.md` on default main; verify the router points to `governance/project-ops` and its entry.
4. Mark active governance work queue and rules adopted **in place** on governance branch, through required docs PR and mandatory checks. Add a concise `README` pointer on `main` only if new-chat discoverability requires it, via a separate docs-only PR.
5. Record final P5 merge SHA and acceptance on [issue #282](https://github.com/ginosega/fishing/issues/282), close #284 only after required-check evidence, then resume V3 separately after rechecking current code/CI/Cloudflare/field proof.

**This architecture requires no public V2 application deployment, no V3 browser-suite pass and no external service.** It does require the one GitHub ruleset configuration that cannot be performed through the connected GitHub tool.

## Historic alternatives superseded

- Old V3-based docs [#283](https://github.com/ginosega/fishing/pull/283) and workflow tooling [#285](https://github.com/ginosega/fishing/pull/285) closed unmerged due unrelated app CI coupling.
- Original main-based **full-docs** draft [#288](https://github.com/ginosega/fishing/pull/288) was a validated recovery/provenance baseline; it must **not** be merged as a second authority once the canonical branch and router-only PR #292 are adopted.
- Main-based executable workflow draft [#289](https://github.com/ginosega/fishing/pull/289) must not be merged: it risks an unapproved public V2 full release. Its successful experimental code was safely installed only on the dedicated governance branch.
