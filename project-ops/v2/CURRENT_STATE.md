# Fishing Project — current state

Last reconciled (UTC): **2026-11-02, GitHub source and checks; provider deployment not queried**
Source baseline: `main@fc85bd38c4c688026700971b4c2d463c293eebf3` (P5 router activation), with canonical governance source `governance/project-ops` (refresh branch HEAD on every session).
**Status:** **Operating Model v2 adopted.** P0–P3 audit/migration/verification completed, P4 normal/emergency recovery and negative-decision tests PASS, P5 router deployed to default `main`, canonical governance branch protected with required `governance-docs` and `fishing-merge-ready` checks. The independent application V3 workstream is next; all its security/provider/field gates remain unchanged.

## Environments

| Environment | Source | CI | Private hosted | Public hosted | Field acceptance | Observed at / evidence |
| --- | --- | --- | --- | --- | --- | --- |
| Project governance | Default-`main` `PROJECT_ROUTER.md` → `governance/project-ops` | Required independent structural `governance-docs` and `fishing-merge-ready`; full-validator hardening merged | not-applicable | Static recovery prompt/router on GitHub `main` (no application deployment) | P4 owner tests passed; P5 owner directed full activation | 2026-11-02 [main router merge #292](https://github.com/ginosega/fishing/pull/292) · [ruleset](https://github.com/ginosega/fishing/rules/26335925) · [hardening PR #297](https://github.com/ginosega/fishing/pull/297) |
| Fishing Companion V3 | [Draft PR #263](https://github.com/ginosega/fishing/pull/263), head historically `406723f` | Latest exact V3 source/CI **not freshly checked**; unrelated Playwright test issue [#287](https://github.com/ginosega/fishing/issues/287) | **unknown** current Worker version and Gear Notes image-fix deployment | Public V3 cutover **not authorized** | Gear Notes and Catch publication unresolved; no current owner acceptance | 2026-11-01 [historical decision log](../../Fishing_Decision_Log.md) · [app issue #287](https://github.com/ginosega/fishing/issues/287) |
| Public Fishing Companion V2 | `main` (refresh current source) | No PWA code/workflow changes in governance activation | not-applicable | Existing V2 public site; precise current deployed bytes **not freshly checked** | Not retested here | 2026-11-02 [FISH108 policy](../../pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md) |

## Active workstreams

**FISH-OPS-V2 — ADOPTED:** Exactly one canonical active governance corpus under `governance/project-ops`; default `main` contains only static retrieval prompt and router. [P4 acceptance](P4_RECOVERY_ACCEPTANCE_2026-11-01.md). Permanent independent workflow protects the governance branch, including missing-document, broken-link and irrelevant-PWA-path checks. Required-status [ruleset #26335925](https://github.com/ginosega/fishing/rules/26335925) has no bypass actors. A deliberately invalid non-draft [PR #296](https://github.com/ginosega/fishing/pull/296) was blocked by GitHub and closed unmerged. [Final activation evidence](P5_CANONICAL_BRANCH_IMPLEMENTATION_2026-11-01.md).

**FISH-TODO-118 — NEXT: Fishing Companion V3:** Reopen only from a verified current [PR #263](https://github.com/ginosega/fishing/pull/263)/branch/issue checkpoint. Independently compare source, exact-head CI and private Worker deployment. The Gear Notes original Notes image serving fix may exist in source but deployed version and field acceptance are **unknown**. The failed Catch publication is **ambiguous**; preserve draft/receipt and reconcile D1 operation ID before any retry. Reassess compact searchable lure/bait picker and remaining V3 D1–D6 criteria on verified private build. No direct whole-prototype merge, separate publishing attestor, blind retry, or public V3 cutover without original approvals.

**Independent fishing/equipment editorial tasks:** Preserve [separate backlog](FISHING_BACKLOG_INDEX.md); deleted items stay deleted absent explicit new owner instruction.

**Truth boundary:** Repo source or CI does not prove Cloudflare/Pages hosted byte/version identity, private field acceptance, or public V3 readiness. Refresh time-sensitive claims before consequential actions.
