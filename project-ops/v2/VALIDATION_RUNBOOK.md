# Independent governance-document validation runbook

**Authority:** [Owner-approved operating-model decoupling](OWNER_AMENDMENT_INDEPENDENT_GOVERNANCE_2026-11-01.md) · [Issue #284](https://github.com/ginosega/fishing/issues/284).
**Status:** Automatically executed by [dedicated workflow](https://github.com/ginosega/fishing/blob/governance/project-ops/.github/workflows/governance-docs.yml) on pull requests against `governance/project-ops`. **Enforced blocking remains pending** until a GitHub branch ruleset makes `governance-docs` required. [P5 plan](P5_CANONICAL_BRANCH_IMPLEMENTATION_2026-11-01.md).

## What runs, and what does not

1. **Existing GitHub documentation-only CI:** For a PR changing only `.md`, `fishing-production.yml` classifies the PR as `docs`, runs `git diff --check` and emits `fishing-merge-ready`. The PWA browser suite is correctly skipped. Read the exact head SHA and actual GitHub run status each time.
2. **Dedicated structural CI:** The standard-library `tools/check_project_ops.py` and `tools/test_project_ops.py` on `governance/project-ops` execute automatically as job `governance-docs` for GitHub pull requests. The assistant may independently re-run source-level/semantic verification, but cannot substitute it for the exact required CI status. A `main`-router-only PR receives the existing FISH108 docs lane and does not copy active documents into main.
3. **Triggered semantic/evidence review:** For approvals, rejected approaches, deployment/field claims, supersession, migration and material decisions, verify the original approved record and actual source/CI/provider evidence. An assistant is not an independent human signatory; the owner approves only those decisions that require owner sign-off.

**Remaining limitation:** The independent governance workflow **is installed and executes automatically on the dedicated branch**; it is **not a required merge check until the owner edits GitHub rulesets** targeting that branch. [#284](https://github.com/ginosega/fishing/issues/284) tracks this exact mandatory enforcement gate. Do not modify FISH108's application workflow or bypass app tests. Owner has approved completing the full governance system before final adoption.

## Exact-head structural verification (fail unless indicated)

- **Repository and diff:** For governance work, verify PR base `governance/project-ops` and docs-only changed paths. Tool/validator changes require their own CI/review on this governance-only branch. The separate root router PR targets `main` and contains **only** `PROJECT_ROUTER.md` and `NEW_CHAT_PROMPT.md`. No public PWA/source/workflow/deployment modifications are in scope.
- **Five authoritative candidates:** Confirm `START_HERE.md`, `CURRENT_STATE.md`, `WORK_QUEUE.md`, `OPERATING_RULES.md`, `DECISIONS_INDEX.md`, plus root `PROJECT_ROUTER.md` and `NEW_CHAT_PROMPT.md`. Require headings and routing/current-state/work item fields defined in [DOC_VALIDATION_DESIGN.md](DOC_VALIDATION_DESIGN.md).
- **Size budgets:** Soft-warning/hard-fail UTF-8 byte budgets for entry 2048/4096, state 8192/12288, queue 10240/16384, rules 10240/16384, index 5120/8192. Each topic catalog warns at 8192 and fails at 12288. Do not silently raise limits or truncate safety requirements.
- **Static transfer prompt:** Exactly one easily copyable fenced text block, explicit repository, `PROJECT_ROUTER.md`, stale/missing fallback, rejected-decision lookup, unknown interrupted writes/no blind retry. The **copyable text** must contain **no fixed development branch, commit SHA, temporary issue/PR number or time-dependent project status**.
- **Router:** Contains active workstream, routed branch, entry point, review date, source evidence, and draft-versus-adopted distinction. Verify its same-branch entry file exists. Verify its referenced remote branch through GitHub, not an inferred default.
- **Relative references:** Resolve each local Markdown link in the full active governance corpus against the tree; fail unresolved targets or repository-root escapes. Remote GitHub links are not auto-crawled; verify consequential original evidence separately. Do not incorrectly treat a GitHub URL as a local path.
- **Single-owner state:** Work queue `## <stable-id> — ...` headings have unique IDs and valid `State, Owner, Next safe action, Prerequisites, Acceptance, Evidence` fields. Statuses limited to `blocked, ready, in-progress, review, closed`. Current state identifies source, CI, private hosted, public hosted, field acceptance separately and represents missing claims as unknown; **asserted verified/deployed/accepted external state needs an observed-at date and independent evidence link**.
- **Decision history:** Topic catalog IDs unique globally and statuses limited to `accepted, rejected, deferred, superseded, proposed`; each ADR linked from at least one topic catalog, has matching ID, original source/approval, rationale, rejected alternatives, and reconsideration condition. No unlinked supersession, and no historic proposal mislabeled adopted. The legacy section crosswalk continues to cover the original Decision Log without duplicating full prose.
- **Duplication:** Fail repeated large normalized paragraphs in two active files, flag paraphrased competing "current" claims for semantic review. Topic catalogs may grow only within their budgets; split instead of dumping chronology.
- **Whitespace and source preservation:** Observe GitHub `git diff --check`, and compare the entire PR diff for any unexpected pre-existing source modification.

## Negative-fixture regression tests (must visibly fail in memory)

Run tests on **copies/in-memory mutations only**, not on the tracked PR: missing working doc or heading; broken path; escaping repository path; duplicate work ID; duplicate topic decision ID; invalid status; unlinked ADR; oversized entry; stale SHA/branch/PR in the copyable prompt; claimed hosted `verified` without dated evidence; and repeated long active-state paragraph. Run a valid positive fixture containing a permitted `unknown` hosted state.

Check both **detection** and **absence of false positives** on the real candidate. A test that merely reports existing fixture files is not a successful execution.

## P3 review record

Each review adds a small dated evidence file or issue comment containing:
- exact GitHub PR head + base SHA, validation time and checked file count;
- the existing PR GitHub Actions run IDs and their actual conclusions;
- structural checks, byte warnings, negative fixture counts and semantic review outcome;
- disclosed limitations and any pending automation integration;
- the decision to continue to P4 or stop for a specific issue.

**Failure policy:** Correct the docs or tests, re-run checks on the **new** head and do not re-label a previous green run as valid for a changed SHA. Do not substitute the failing PWA offline-library browser suite for these governance checks.

**Required enforcement:** [#284](https://github.com/ginosega/fishing/issues/284) stays open until GitHub branch ruleset actively requires both `governance-docs` and existing `fishing-merge-ready` on `governance/project-ops`, with real negative merge-blocking proof. Automatic CI itself is installed on this branch; no separate vendor or public application deployment is required. Owner participation is limited to the GitHub ruleset edit, which the connected GitHub tool cannot perform.

<!-- exact canonical-governance CI proof; remove by closing PR unmerged -->
