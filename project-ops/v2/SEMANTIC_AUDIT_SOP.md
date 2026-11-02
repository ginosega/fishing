# Semantic-drift audit — standard operating procedure

**Status:** Active governance procedure, subject to the existing protected documentation PR checks.
**Purpose:** Detect *truth and decision drift* that a deterministic Markdown validator cannot detect. This is independent of the PWA application release pipeline.

## Triggers and owner burden

- **Scheduled backstop:** ChatGPT scheduled task **Fishing Semantic Audit** was created on **2026-11-01**, configured for Monday mornings in `America/Los_Angeles` (weekly, flexible timing). It is intended to execute without owner initiation; the first scheduled audit has **not yet run**. If the scheduled task is paused, fails, cannot use connected GitHub or lacks reliable evidence, report **AUDIT BLOCKED** rather than **PASS**. Do not infer an audit occurred from a schedule.
- **At material project transitions:** The assistant completes a targeted semantic audit **as part of** milestone/phase acceptance, significant approved product or architecture decisions, PR integration or public/private release acceptance, operating-model branch/authority changes, and before a planned chat transfer after substantial work. Reconcile and document state **before reporting the milestone accepted**. No extra owner reminder or approval is needed for normal documentation reconciliation.
- **GitHub PR structural checks:** Separately, every PR targeting the canonical `governance/project-ops` branch automatically runs the required `governance-docs` and `fishing-merge-ready` checks. These detect schema/links/size/duplicate-ID errors; they **do not** establish semantic freshness.

## Bounded audit procedure

1. Verify `ginosega/fishing` default `main` [router](https://github.com/ginosega/fishing/blob/main/PROJECT_ROUTER.md), active governance branch, canonical [CURRENT_STATE.md](CURRENT_STATE.md), relevant [WORK_QUEUE.md](WORK_QUEUE.md), and [DECISIONS_INDEX.md](DECISIONS_INDEX.md). Confirm exact GitHub ref; do not read all historical documents.
2. Review GitHub issue and PR changes, merged commits, exact-head CI/check results, and owner decisions since the previous successful audit or within the bounded audit window. For substantial approved decisions, retrieve relevant topic catalogs and original approval evidence, including rejected/deferred/superseded choices.
3. Compare claims and next safe actions: active versus closed tasks, milestone status, current branch/source, accepted versus only source-implemented or CI-validated behavior, provider deployment, field acceptance, authoring/publication receipts, and historical decision supersession.
4. Classify each finding as **verified drift** (supported mismatch), **potential drift** (needs evidence), **unknown** (source cannot determine provider/owner truth), or **no observed drift within the reviewed scope**. Quote exact source links and observed-at timestamps; absence of a change or check is not evidence of deployment or field acceptance.
5. When verified drift exists, recommend a minimal **in-place** update to the single authoritative state/work item/index on a protected governance documentation PR. Normal authorized corrections can be proposed autonomously; a new owner decision, changed privilege/trust boundary, provider write or application deployment requires its existing approval gate. No blind retry of an ambiguous operation. The required validator and assistant semantic review must pass before merge.
6. Produce a dated, bounded audit result containing the GitHub head/window, records checked, differences, evidence links, unresolved unknowns, action/owner and whether corrections were applied or merely proposed. Do not report corrections as merged until GitHub confirms the merge.

## Operational failure safeguards

The weekly ChatGPT task is the **independent time-based trigger**, not a GitHub webhook, continuously running agent, or guarantee of GitHub connectivity. It may deliver an audit summary without directly creating GitHub PRs. A scheduled run that reports GitHub inaccessible is a **failed/blocked audit** and must not reset the last-successful-audit checkpoint.

A milestone audit is an **operating requirement executed by the assistant during that workflow**, not proof that GitHub has an LLM which can automatically verify semantics. A GitHub PR can pass structural CI while a real-world deployment has changed unrecorded. For that reason, the weekly scheduled audit and milestone reviews are complementary, not substitutes for truthful provider/owner verification.

## Drift window

- Structural violations detectable by the GitHub validator: blocked before canonical governance PR merge.
- GitHub-visible semantic discrepancies: normally reviewed at the **next material checkpoint**, with **weekly scheduled audit** as an independent backstop. An audit that cannot run or lacks enough evidence may leave drift unrecognized.
- Provider-/device-only changes absent from GitHub: **not bounded by a weekly guarantee**; require credible provider evidence or owner observation to settle, otherwise status stays `unknown`.

**Maintenance:** The assistant includes this audit gate in routine V3 milestone completion; the owner is not expected to remember or manually launch weekly audits. The audit task's schedule and findings are separate from the protected source of truth; changes to the schedule must be reflected in this file.
