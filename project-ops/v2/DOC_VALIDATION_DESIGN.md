# FISH-OPS-V2 — P1 Documentation Validation Design and Rollout

**Status:** P1 proposal, not implemented and not yet accepted  
**Tracked action:** [FISH-OPS-V2 P3 documentation validator — issue #284](https://github.com/ginosega/fishing/issues/284)  
**Parent:** [initiative #282](https://github.com/ginosega/fishing/issues/282) · [draft PR #283](https://github.com/ginosega/fishing/pull/283)  
**Inputs:** [P1 operating-model design](P1_OPERATING_MODEL_DESIGN.md), [audit](AUDIT_2026-10-31.md), and `.github/workflows/fishing-production.yml` in the verified V3 source baseline.

## 1. Explicit decision to make in P1

**Recommend automated local + CI structural validation, plus mandatory human approval/evidence reconciliation.** Manual-only checks are insufficient to prevent repeated file sprawl, broken routing, or missing required status. Automated checks alone cannot determine whether a Cloudflare deployment is real or a product decision has legitimate owner authorization.

This issue is **not optional backlog**: the new operating model is **not adopted** until the validator is implemented, its positive/negative cases are exercised, and an actual docs-only PR runs the check. Do not start it prematurely while the P2 document formats are still changing.

## 2. Validator scope

**Validate only:**
- The five active files under `project-ops/v2/` and the indexed, *declared* ADRs/reference paths they link.
- Files changed in the current PR when they are inside those active paths, plus historical-approval paths only to confirm no unreviewed modifications.
- The invariant that there is **one active owner** for each named state/work item/decision; the legacy root documents are explicitly historical.
- Accepted project Markdown conventions. Do not parse and lint every Gear/KB/Catches content page as a documentation-governance file.

**Do not do:** GitHub API probes, online link crawling, Cloudflare/Pages access, external network calls, reading private credentials, running scripts embedded in Markdown, inferring hosted status from CI, or rewriting files automatically during CI.

## 3. Minimal machine-checkable document conventions

Use **Markdown headings and fixed field labels**, not a second editable JSON/YAML "state database". Avoid a sprawling schema or a dependency-heavy Markdown compiler. Proposed examples:

`START_HERE.md`: required `#` title, `## Read order`, `## Evidence boundaries`, and links to `CURRENT_STATE.md` and `WORK_QUEUE.md`.

`CURRENT_STATE.md`: required `Last reconciled (UTC):`, `Source baseline:`, `## Environments`, `## Active workstreams`, and each active workstream row carries `Source`, `CI`, `Private hosted`, `Public hosted`, `Field acceptance`, `Observed at`, `Evidence`. A state may explicitly be `unknown`.

`WORK_QUEUE.md`: `## <stable-id> — <title>` with required lines `State:`, `Owner:`, `Next safe action:`, `Prerequisites:`, `Acceptance:`, `Evidence:`. IDs are unique within the document. A closed/accepted item should leave the active queue and remain discoverable in GitHub history/issues.

`OPERATING_RULES.md`: required sections for `Authority and evidence`, `Owner approval gates`, `Publishing and recovery`, `Release validation`, `Project handoff`. It links to FISH108 and exact approved baseline/amendment records.

`DECISIONS_INDEX.md`: one row per indexed ADR/approval with `ID`, `status`, `document`, `approved date`, `scope` and `superseded-by` where relevant; unique IDs. Historical owner approvals can have existing identifiers/links rather than being silently re-numbered into invented new ADR approvals.

Standards are **not fixed until the first five working files are drafted and tested**. Define them once in the validator rather than keeping two independent schema specifications.

## 4. Automated checks — severity and ownership

| Check | Behavior after rollout | Why |
| --- | --- | --- |
| Mandatory five active docs and essential headings/field labels | **Fail** | Avoid missing routing or unverifiable state |
| UTF-8 bytes / docs budgets | **Warn** above soft target; **fail** above hard cap | Prevent a new uncontrolled document monolith |
| Unique work IDs, ADR IDs and active-authority owners | **Fail** | Prevent contradictory duplicate state |
| Allowed status vocabulary, unknown/not-verified permitted | **Fail** malformed values | Preserve source/CI/hosted/field truthfulness |
| Evidence URL/ref + `observed_at` for *asserted external verified state* | **Fail** when missing | No unverifiable "deployed" or "field accepted" assertions |
| Local relative file links | **Fail** on missing file, escaping repo, or clear broken target; avoid false positives on GitHub-style anchors | Startup references must be usable |
| Git diff touches an original approved baseline or approval record unexpectedly | **Fail** unless separately allowed by explicit scope review | Preserve exact signed-off provenance |
| Full old-bootstrap copy or duplicated large current-state section in active files | **Fail** for explicit known forbidden patterns; **warn** for heuristic near-duplication | Prevent repeat sprawl, without pretending to semantically understand all prose |
| Stale historical assertion/timestamp | **Warn** with observed date, no fabricated current result | Old evidence may remain valid as historical fact |
| External HTTP link availability | **Not checked in CI**; manual as needed | Network errors and security costs cause flaky CI |
| Whether owner really approved a change, actual private/public hosted identity, or user device behavior | **Human gate** | Tools and text cannot establish these facts alone |

**Important:** Treat any unreviewed claim of `verified` without origin, timestamp and evidence as a hard validation failure. However, a dated historical source or `unknown` should be legal. Do not require a current Cloudflare query to validate a pure documentation PR.

### Size targets (UTF-8 bytes)

| Document | Soft warning | Hard limit |
| --- | ---: | ---: |
| `START_HERE.md` | 2,048 | 4,096 |
| `CURRENT_STATE.md` | 8,192 | 12,288 |
| `WORK_QUEUE.md` | 10,240 | 16,384 |
| `OPERATING_RULES.md` | 10,240 | 16,384 |
| `DECISIONS_INDEX.md` | 5,120 | 8,192 |

If a safety rule legitimately exceeds the hard limit, move the detail into a **specifically linked reference** and retain the effective rule/trigger in `OPERATING_RULES`. Exemptions require documented review; do not silently raise limits to bypass a failing check.

## 5. Negative and positive fixtures

Automated tests should cover:
- Valid minimal five-file project, with an explicit `unknown` private Worker status: PASS.
- Missing `START_HERE`/state document or section: FAIL.
- Bad relative path including `../` traversal outside repo: FAIL.
- Duplicate work ID and conflicting active owner: FAIL.
- Duplicate accepted ADR ID or unlinked supersession: FAIL.
- `CURRENT_STATE` says `verified private hosted` with no date or evidence link: FAIL.
- Intentional `unknown private hosted` state: PASS.
- Oversized current document: WARN at soft, FAIL at hard.
- Unreviewed edit to original Oct 19 approval record: FAIL.
- Dated prior CI described as historical rather than current: PASS.
- Attempt to paste historical full bootstrap into active START_HERE: FAIL.
- Non-V3 gear/KB Markdown unaffected by validator: PASS.

Run the same fixture suite locally and in CI. Errors must include filename, field/line where practical, and a brief resolution path.

## 6. Implementation and merge sequencing (important FISH108 boundary)

Existing `.github/workflows/fishing-production.yml` has `validate-docs` for Markdown-only PRs, but **currently checks only `git diff --check`**. It always classifies workflow changes or executable scripts as **Full Application Release validation**, not a documentation-only change. **Do not bypass or weaken this.**

**Stage V0 — P1 design** (now): approve this policy and document schema; no code/workflow change.

**Stage V1 — P2 non-destructive working documents:** populate five active Markdown docs on **still-draft, unmerged** PR #283. Perform structured manual validation and full provenance/approval coverage review. Do **not** activate the new handoff protocol, deprecate historical records or merge the docs PR yet.

**Stage V2 — P3 separate tooling PR** (issue #284): independently branch from the V3 feature branch (not from PR #283) to add a small deterministic standard-Node `tools/check-project-ops.mjs` (path provisional), fixtures and a workflow invocation from `validate-docs`. It must operate in a fixture/contract mode while the new five active docs are still pending in PR #283, without falsely passing an active-but-incomplete document set. Keep existing `git diff --check` and lane classifier. Because that PR changes `.github/workflows/**` and executable `tools/**`, it **must** pass the existing **full application** PR-validation lane. Merge tooling only to the reviewed V3 development branch, after its own proper approval; do **not** push to public `main` or deploy. A PR full test is not deployment authorization.

**Stage V3 — P3 end-to-end proof on PR #283:** reconcile/rebase the draft documentation branch with the tooling commit on the V3 branch. With the five active docs present, require **strict** checks (no fixture-only bypass). Confirm the draft docs-only PR runs the new validator and existing `fishing-merge-ready` in the **docs** lane, with positive/negative test fixtures already proven in the separate tooling PR. Record exact CI SHA and results on #284. If this cannot be demonstrated, keep PR #283 draft/unmerged and #284 open.

**Stage V4 — P4 cold-start and P5 adoption:** cold-start test the **draft docs branch**, using only bounded reads, before final owner sign-off. After passing and owner acceptance, merge documentation PR #283 to the intended reviewed development branch, update project instructions, and formally supersede the old full-bootstrap transfer protocol. Reconcile new refs after merges. Only then resume V3 feature development with fresh real-provider state checks; existing PR #263 remains subject to its own gates.

**Important public-main boundary:** eventually bringing the executable tooling/workflow change into public `main` can invoke **Full Application Release** and Pages deployment. That is a separately controlled integration/release under FISH108; neither issue #284 nor the docs-only PR preauthorizes a public merge or hosted change.

## 7. Operational maintenance after rollout

- Any active-doc change runs the validator automatically in the PR docs lane; content-only release changes are not required to update active docs.
- If validators fail, correct the underlying state or explicitly mark unknown; never mask missing proof with fake SHA/timestamps or downgrade security checks.
- Review validators alongside schema changes; expanded project docs must preserve small entry and ownership rules.
- The human closeout review still verifies current Git/CI/provider/device facts, owner decisions and legal branch/merge boundaries.
- CI can prevent structural degradation; it **cannot** prove ChatGPT will never produce an Unknown error.

## 8. P1 acceptance for documentation validation

- [ ] Owner agrees to **automated + human**, not manual-only.
- [ ] Owner agrees to the staged **docs-only PR → separate full-lane tooling PR → docs-only end-to-end CI proof** sequence.
- [ ] Owner agrees to the scope, soft/hard budgets, failure-vs-warning policy and explicit allowance for unknown status.
- [ ] Issue #284 remains open as a mandatory P3 gate until validator, fixtures, workflow and CI evidence are accepted.
