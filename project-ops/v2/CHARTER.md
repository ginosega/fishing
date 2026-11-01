# Fishing Project Operating Model v2 — initiative charter

**ID:** FISH-OPS-V2
**Status:** P0 audit completed; P1 owner-approved, then amended to independent governance; P2 complete as draft; P3 independent document verification and P4/P5 adoption pending
**Owner:** Fishing Companion project owner
**Authorized:** 2026-10-31
**Tracker:** [GitHub issue #282](https://github.com/ginosega/fishing/issues/282)
**Historical V3 evidence baseline:** `feature/fish118-p3-mock-publisher@406723f880960d33d40bd07984559432c8caa233` (historical references only).
**Independent governance baseline:** `main@5d47b28d4e0908f5c796927b3d074911cc1881b8` → [docs-only PR #288](https://github.com/ginosega/fishing/pull/288). [Effective owner amendment](OWNER_AMENDMENT_INDEPENDENT_GOVERNANCE_2026-11-01.md).
**Working branch:** `docs/fish-ops-v2-2026-10-31` (documentation-only, from that exact commit)

## Decision

Pause *new V3 feature development* while we refactor project documentation and ChatGPT handoff/retrieval practices. Do not erase project history or rewrite approved requirements. The owner will review the new model and its cold-start evidence before feature work resumes.

The ChatGPT project "Unknown error" root cause is **not confirmed**. We are addressing verified duplication, oversized working context, conflicting dated checkpoints, and a brittle full-history handoff process.

## Mission

Create a **small, reliable, current working context** whose contents are authoritative, easy to verify against GitHub/CI/hosted evidence, and sufficient to resume work from a fresh conversation. Preserve durable approved design, decisions, source, test and publication history as selectively retrievable references.

## Scope: operating model, not application rewrite

Included:
- Map the existing five oversized canonical root documents to intended consumers and sources of truth.
- Consolidate duplicated *active* status, work queue, and operating instructions.
- Design bounded entry-point and read protocol; no full-chat reconstruction as a normal restart procedure.
- Index existing approved V3 requirements/design/implementation plan and decisions without wholesale duplication.
- Add lightweight docs-validation checks that verify required fields, file-size budgets and links.
- Establish in-place active status updates, decision supersession and evidence links.
- Demonstrate new-project-chat cold-start and recovery.

Excluded:
- New V3 features, schema or architecture redesign.
- Changing public V2, private V3 Worker, D1, GitHub App permissions, secrets, production/sandbox publishing or deployment.
- Merge of the existing V3 draft PR #263 or public cutover.
- Deletion of the existing five canonical documents or unreviewed modification of approved specifications.

## Proposed active documents (subject to audit)

| Document | Single responsibility | Target budget |
| --- | --- | ---: |
| `START_HERE.md` | Small new-chat entry point and reference map | 1–2 KB |
| `CURRENT_STATE.md` | Latest verified state; source, CI, private deployed, field-accepted explicitly separated | 4–8 KB |
| `WORK_QUEUE.md` | Active prioritized work with prerequisites, blockers, and acceptance | 5–10 KB |
| `OPERATING_RULES.md` | Owner-approval gates, security, operational workflow, bounded retrieval, handoff | 5–10 KB |
| `DECISIONS_INDEX.md` | Stable links to still-effective and superseded decision records | 2–5 KB |

Location and naming are proposals; settle them during design before duplicating any active state. Original Markdown files remain present as historical evidence until a separately reviewed documentation cutover.

## Operating policies to preserve and enforce

1. **Authority:** GitHub source is authoritative for versioned code and specs, but *does not establish* actual deployed Cloudflare state. Hosted evidence and owner field tests are independent.
2. **Truthful status:** Record `source implemented`, `CI validated`, `deployed`, `field accepted` separately, and mark evidence `unknown` when not independently verified.
3. **Security and deployment:** Keep existing exact-HEAD CI and integrity gates, owner authorization, credential isolation, least privilege, fail-closed behavior, recovery/rollback, and public V2 isolation.
4. **Retrieval:** At the start of a chat, retrieve only the small routing/status files. Read specific requirement/ADR/test/code ranges as the task needs; no wholesale bootstrap or prior-chat replay.
5. **Change history:** Update current state *in place*. Keep rationale and evidence via commits, PRs, issues, dated reports and stable links; never turn active state into a chronological prepend-only log.
6. **Safety of migration:** Keep this effort on a docs-only branch. No application deployment or merged production change is authorized by this charter.

## Work phases

- **P0 — Audit:** Inventory files, duplicate claims, safety controls, referenced requirements, historical provenance; create coverage/reconciliation matrix.
- **P1 — Design:** Confirm file ownership, information taxonomy, ADR convention, working-size targets, retrieval and handoff protocol.
- **P2 — Migration:** Populate bounded active files with reviewed facts from repo and source evidence. Archive/relabel legacy files without deleting historical content.
- **P3 — Verification:** Run docs structural checks and manual critical-safeguard reconciliation; compare HEAD, CI and hosted evidence distinctly.
- **P4 — Cold-start acceptance:** Validate a new Fishing-project chat can identify repo/branch, open blockers, unknown deployments, next safe step, and engineering gates using bounded reads.
- **P5 — Adoption:** Owner acceptance; merge documentation only after review; establish maintenance procedure; resume V3 from a fresh reconciled checkpoint.

## Acceptance

See issue #282 for the checkable definition of done. In particular: no lost historical data, no contradictory active authority, verified links, security controls preserved, passing docs checks, successful clean-chat restart, and no V3/public V2 infrastructure or feature code changed by this initiative.

## Frozen V3 work checkpoint (not a deployment authorization)

- Gear Notes embedded image: code fix source-validated, hosted Worker rollout and owner field acceptance not yet independently confirmed.
- Catch Notes Add: `Fishing publication lifecycle is unavailable` requires precise diagnostic reconciliation. Preserve draft and receipts; avoid blind retries.
- Catch lure/bait picker: redesigned and source-validated; private deployment and field acceptance outstanding.
- Check latest deployed private Worker version and the exact Git source/CI evidence before authorizing any future guarded rollout.

**Next task:** Complete P0 audit/reconciliation matrix, then prepare a precise P1 operating-model design for owner review. Do not begin V3 deployments.
