# FISH-OPS-V2 — owner-approved independent-governance amendment

**Date:** 2026-11-01
**Status:** Accepted owner amendment to P1 implementation and P3/P4 sequencing; **not** approval to activate the operating model or change PWA release controls.
**Initiative:** [#282](https://github.com/ginosega/fishing/issues/282) · **Independent governance draft PR:** [#288](https://github.com/ginosega/fishing/pull/288)

## Owner authorization and why the implementation changed

Following the discovery that a tooling/workflow PR against the PWA V3 branch was blocked by **pre-existing** Playwright/offline-library tests, the owner requested an explanation of why operating-model governance needed to depend on PWA acceptance. The assistant identified that it had introduced an *incidental* coupling by embedding the documentation checker in `.github/workflows/fishing-production.yml` and withdrew the proposal to fix the PWA as a prerequisite.

The owner then said:

> I agree with the amendment and decoupling, please implement that change and proceed with the operating model/project governance work independently of the PWA V3 project.

## Effective amendment

1. **Independent source and review base.** FISH-OPS-V2's canonical draft is moved from V3-dependent [PR #283](https://github.com/ginosega/fishing/pull/283) to a documentation-only [PR #288](https://github.com/ginosega/fishing/pull/288) based directly on `main`. Preserve copied historical evidence/decision records and all Git blob contents, but use PR #288 for future changes. No part of V3 PR #263 is required to adopt the governance model.
2. **PWA code and release policy stay untouched.** Do not alter `pwa/`, `.github/workflows/fishing-production.yml`, FISH108, Pages, Cloudflare, D1, credentials or the public site as part of this amendment. A PWA browser-suite failure is **not a governance acceptance failure**.
3. **Validation must be independent.** Retain the existing `main` Markdown-only `validate-docs`/ `fishing-merge-ready` check as a repository gate. Independently run and record deterministic *structural* governance checks (static prompt, links, size budgets, unique IDs, ADR provenance, negative fixtures) plus triggered semantic/evidence review. The earlier isolated strict-docs [run #41332302407](https://github.com/ginosega/fishing/actions/runs/41332302407) remains relevant historic proof, but cannot substitute for validating the new exact-head docs corpus.
4. **Permanent automation remains a separate governance follow-up.** The previous GitHub Actions validator [PR #285](https://github.com/ginosega/fishing/pull/285) was tied to PWA full-lane tests and is **not the adopted integration route**. [#284](https://github.com/ginosega/fishing/issues/284) will track a standalone docs-governance enforcement mechanism. Do **not** bypass the approved FISH108 policy to install workflow or executable tooling; any integration requiring changes to the PWA-owned workflow must be separately scoped and authorized, not an implicit P4 prerequisite.
5. **P4 can proceed without PWA remediation.** Cold-start validation on the new governance branch and independent decision history is the next substantive gate. P5 owner adoption review must plainly disclose whether permanently automatic GitHub CI enforcement is in place or whether a temporary per-change independent validation procedure is still used; never claim the former when only the latter exists.
6. **Prior decisions retained.** P1's five bounded active files, static copyable prompt plus default-branch router, topic-sharded accepted/rejected/superseded decision history, continuous sprawl prevention and low owner admin burden remain in scope. P2's historical crosswalk/ADR coverage is not discarded. Signed V3 approvals and separate deployment/field truth remain intact.

## Migration evidence and safety boundaries

- Pre-amendment historic source: `docs/fish-ops-v2-2026-10-31@8c78e0f8cd63db998a963a873148dbc57171af7b`.
- New governance work started from `main@5d47b28d4e0908f5c796927b3d074911cc1881b8` and copied **33 Markdown-only files by their exact original Git blob SHAs** to `governance/fish-ops-v2-independent`. Full original root/canonical V3 documents were not rewritten.
- [Blocker #287](https://github.com/ginosega/fishing/issues/287) is deferred to independent V3 application reliability work, not a prerequisite for this initiative.
- PR #288 remains draft until clean-chat test and owner acceptance. The default-branch router and static prompt are **not adopted on `main` before merge**.

**Not authorized:** Rewriting approval history, treating V3 source-validated code as deployed, publishing V3, reducing application integrity tests, creating a new vendor/paid service, or merging a workflow change to bypass a failing PWA suite.
