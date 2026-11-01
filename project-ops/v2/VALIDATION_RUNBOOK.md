# Independent governance-document validation runbook

**Authority:** [Owner-approved operating-model decoupling](OWNER_AMENDMENT_INDEPENDENT_GOVERNANCE_2026-11-01.md) · [Issue #284](https://github.com/ginosega/fishing/issues/284).
**Status:** Active *procedure for validating the draft*, not yet an adopted project operating policy or an automatically enforced GitHub check.

## What runs, and what does not

1. **Existing GitHub documentation-only CI:** For a PR changing only `.md`, `fishing-production.yml` classifies the PR as `docs`, runs `git diff --check` and emits `fishing-merge-ready`. The PWA browser suite is correctly skipped. Read the exact head SHA and actual GitHub run status each time.
2. **Independent structural validator:** The assistant performs the deterministic checks below directly against the **exact immutable GitHub PR head tree**, using read-only GitHub file/tree APIs (or the identical locally run checker on a checkout). It can run as part of the ordinary governance PR review without modifying app code, CI workflows, or provider infrastructure.
3. **Triggered semantic/evidence review:** For approvals, rejected approaches, deployment/field claims, supersession, migration and material decisions, verify the original approved record and actual source/CI/provider evidence. An assistant is not an independent human signatory; the owner approves only those decisions that require owner sign-off.

**Important limitation:** Steps 2–3 are independently executed **per change**, not currently **automatically enforced by a permanent GitHub required CI status**. Do not claim they are. Issue #284 remains open for future safe governance-only enforcement. Do not modify FISH108's application workflow or bypass existing app validation gates to introduce a new executable tool. P4 tests may proceed if Steps 1–3 pass; P5 owner must explicitly consider this outstanding difference.

## Exact-head structural verification (fail unless indicated)

- **Repository and diff:** Verify base `main`, docs-only changed paths, no `pwa/`, `.github/workflows/`, executable tooling, provider credentials, or original signed-off approval files modified; the docs PR remains draft until P4/P5.
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

**Future enforcement:** #284 stays open until an actually independent, continuously triggered governance validation service/CI is implemented, evidenced and reviewed. Avoid a second, contradictory authority store. Owner participation is not required for routine checks, but is required to accept a temporary enforcement limitation at P5.

<!-- CI proof only: no change of governed policy. -->
