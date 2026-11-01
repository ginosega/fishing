# P3 independent governance verification — November 1, 2026

**Scope:** Operating Model v2 draft under [governance PR #288](https://github.com/ginosega/fishing/pull/288), separate from V3 [PR #263](https://github.com/ginosega/fishing/pull/263), its PWA browser tests and FISH108 application release.  
**Basis:** [Owner-approved decoupling](OWNER_AMENDMENT_INDEPENDENT_GOVERNANCE_2026-11-01.md) · [verification procedure](VALIDATION_RUNBOOK.md).  
**Evidence status:** Source-based and GitHub CI checks run on the independent governance branch; **not** installed always-on structural CI, no application/provider deployments, **P4/P5 not passed**.

## Evidence and checks

- Initial independent governance source was a **main-based 33-file identical-blob transplant**; the continuing branch adds only new or edited Markdown governance documents.
- GitHub existing docs-only validation [run #41336916563](https://github.com/ginosega/fishing/actions/runs/41336916563) completed **success** on an earlier independent branch SHA. This is not a substitute for an exact latest-HEAD run, which must be linked separately on issue [#282](https://github.com/ginosega/fishing/issues/282) after the final docs commit.
- Read-only GitHub tree/contents inspection covered all **36 Markdown files present at the time of the independent manual review**: seven active/root router-prompt files, seven topic catalogs, nine ADRs, and 13 other scope/approval/audit/reference Markdown files.
- The five bounded active documents were within both target and hard limits: `START_HERE` 1,804 B, `CURRENT_STATE` 3,981 B, `WORK_QUEUE` 3,710 B, `OPERATING_RULES` 4,940 B, `DECISIONS_INDEX` 2,286 B. The root router and static prompt were present.
- All checked **local relative links** resolved to tracked files or declared directories; no repository escape, missing required active heading, duplicate active work item or repeated substantial active paragraph was identified.
- Seven catalogs contained **49 unique decision IDs**, including accepted, rejected, deferred and not-yet-adopted alternatives, with **nine linked ADR records**. All nine had original provenance, rationale and reconsideration fields; topic files remained below the hard 12 KB limit.
- The copyable static recovery prompt had no hardcoded V3 feature branch, temporary issue/PR number or 40-character SHA, and retained a missing/stale router fallback and unknown in-flight-operation warning. Governance routing remains a **draft**, not an installed `main` file until P5.
- Spot-checked original authority: [D1 gateway/attestor rationale](https://github.com/ginosega/fishing/blob/406723f880960d33d40bd07984559432c8caa233/experiments/p3/preview/D1_V3_Architecture_Consolidation_2026-10-25.md), [finite delivery reset](https://github.com/ginosega/fishing/blob/406723f880960d33d40bd07984559432c8caa233/experiments/p3/preview/FISH118_V3_Finite_Delivery_Reset_2026-10-25.md), [retired editorial pages](https://github.com/ginosega/fishing/blob/406723f880960d33d40bd07984559432c8caa233/Fishing_Decision_Log.md#L393-L419), and [V3-SAVE-09 amendment](https://github.com/ginosega/fishing/blob/406723f880960d33d40bd07984559432c8caa233/pwa/docs/Fishing_Companion_v3_Requirements.md#L105-L122). These corroborate the selected catalog summaries, not a guarantee that every old conversation decision was captured.
- Direct GitHub PR comparison verified **only new Markdown files versus `main`**; no original V3 requirements/approval, PWA code, CI workflow, Cloudflare/D1 config or executable source changed.

## Adversarial validation

Independently exercised **12 in-memory positive/negative fixture cases**. All 12 produced the expected pass/fail result: real static prompt, valid unknown hosted state, missing heading, duplicate work item, duplicate decision ID, repository-traversing relative link, broken local file link, oversized entry, missing ADR reconsideration rationale, hardcoded transient SHA, hardcoded feature branch, and unsupported verified hosted state lacking a dated evidence link.

These were **source-specific independent checks**, not a persistently installed GitHub Action or an assertion that every conceivable schema/semantic inconsistency is automatically detected.

## Important limitations and next gates

1. **Permanent structural CI enforcement is not installed.** Existing `validate-docs` on `main` checks whitespace only. Assistant-run deterministic per-change validation and Tier 2 semantic reviews are a proposed interim practice; [issue #284](https://github.com/ginosega/fishing/issues/284) remains open for a truly independent continuous enforcement mechanism.
2. **P4 fresh-chat test is not simulated.** The user must start a separate ChatGPT Fishing-project conversation and paste the static prompt. The new chat must discover current GitHub authority and reject a previously discarded approach without ingesting legacy bootstrap.
3. A GitHub decision-log heading crosswalk is not proof of perfect semantic extraction; chat-only historical reasoning may still be missing. Preserve original records and open an issue for any important gap.
4. No private Worker version, hosted Pages bytes or V3 acceptance is established by this governance audit; those belong to the separate application workstream.

**Next:** Verify exact final PR #288 docs-only CI HEAD, then obtain real P4 owner cold-start evidence. P5 owner approval must explicitly consider the remaining no-permanent-CI-enforcement limitation. Do not merge or deprecate the historical operating model beforehand.
