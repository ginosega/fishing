# Fishing Project — current state (candidate)

Last reconciled (UTC): **2026-11-01 (GitHub project governance source and CI; no provider query)**
Source baseline: `main@5d47b28d4e0908f5c796927b3d074911cc1881b8` when independent governance was branched. Governance changes are on [draft PR #288](https://github.com/ginosega/fishing/pull/288), branch `governance/fish-ops-v2-independent`. **Refresh heads and evidence at each session; do not treat this SHA as current forever.**
**Status:** P0 audit complete, P1 approved and independently amended; P2 docs populated; P3 independent structural checks and 12 adversarial fixtures **passed**; main docs-only CI also passed [run #41337909748](https://github.com/ginosega/fishing/actions/runs/41337909748) on a reviewed branch head. Re-check the **latest** PR head/check on resumption. **P4 owner-observed normal and emergency recovery, rejected-decision, and deployment-safety tests **all passed**; [P4 acceptance](P4_RECOVERY_ACCEPTANCE_2026-11-01.md). **P5 owner adoption is pending**, including acceptance or deferral of missing permanent structural CI**. V3 application tests are **not a governance dependency**.

## Environments

| Environment | Source | CI | Private hosted | Public hosted | Field acceptance | Observed at / evidence |
| --- | --- | --- | --- | --- | --- | --- |
| Governance | Docs-only draft [#288](https://github.com/ginosega/fishing/pull/288) from `main` | Existing docs-only checks plus independent targeted validation; latest exact-head check must be refreshed | not-applicable | Default-branch router **not yet adopted** | P1 owner sign-off and P4 fresh-chat tests accepted; **P5 pending** | 2026-11-01 [independence approval](OWNER_AMENDMENT_INDEPENDENT_GOVERNANCE_2026-11-01.md) |
| PWA V3 (separate) | Draft [#263](https://github.com/ginosega/fishing/pull/263), last audited source `406723f` | Historical targeted validation only; **full PWA offline-library failures tracked separately** | **unknown**, no current Worker/version verification | V3 cutover **not approved** | Prior limited private Windows Edge tests, not complete V3 acceptance | 2026-10-31 historical [original Decision Log](../../Fishing_Decision_Log.md); 2026-11-01 [blocker #287](https://github.com/ginosega/fishing/issues/287) |
| Public PWA V2 (separate) | `main`, verify fresh before any app change | Current exact run **unknown** in this governance audit | not-applicable | Existing V2 baseline; current hosted byte identity **not freshly checked** | Not tested during governance work | 2026-11-01 source-only [FISH108](../../pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md) |

## Active workstreams

**FISH-OPS-V2 / governance:** P2 transferred 33 Markdown-only docs by **identical Git blobs** to main-based PR #288; [owner amendment](OWNER_AMENDMENT_INDEPENDENT_GOVERNANCE_2026-11-01.md) confirms independence. Topic catalogs now contain **49** curated decision entries, **9** rationale ADRs (including the governance decoupling decision), 56 historical Decision Log headings, plus a separate fishing backlog. The old V3-based governance PR #283 and attached validator #285 are superseded for this implementation and must not be merged. **P3 evidence:** [independent source/fixture review](P3_INDEPENDENT_VALIDATION_2026-11-01.md) passed, plus an earlier GitHub docs-only CI run; **permanent structural CI not installed**. **Next safe action:** present [P5 adoption decision package](P5_ADOPTION_REVIEW.md) and request explicit owner acceptance or deferral of the interim per-change structural checks. Then (only if owner authorizes) revalidate final docs-only PR against fresh main and merge/install router; until then draft/unmerged. Permanent automatic governance-only CI enforcement is a separately disclosed follow-up, not silently considered installed.

**PWA V3 / Gear Notes image:** Historic source fix exists; exact private Worker deployment/version **unknown**. Past field observation failed. No republishing as diagnosis.

**PWA V3 / Catch Add and lure picker:** Historic lifecycle error, draft/receipt implications, and source picker improvements remain in original app task. Exact private deployed build **unknown**. Preserve drafts and operation receipts; do not blindly retry an ambiguous accepted publish. [PR #263](https://github.com/ginosega/fishing/pull/263).

**PWA V3 / application full-lane failures:** [#287](https://github.com/ginosega/fishing/issues/287) concerns repeated Playwright offline-library timeouts, also observed before the governance-tooling experiment. It is **deferred to the separate application workstream**. Not a blocker for governance-only docs PR/checks.

**Evidence policy:** CI or PR presence is not proof of Cloudflare/Pages deployment or device acceptance. All time-sensitive claims are dated evidence, not live provider assertions.
