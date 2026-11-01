# Fishing Project — current state

Last reconciled (UTC): **2026-11-01, GitHub source/CI only; no provider queries**
Source baseline: `main@5d47b28d4e0908f5c796927b3d074911cc1881b8` before governance branch setup. **Recheck current refs and required statuses.**
**Status:** P0/P1 design, P2 migration, P3 structural proof, and P4 A/B/C/D recovery **passed**. Owner directed completing [#284](https://github.com/ginosega/fishing/issues/284) **before final P5 activation**. A dedicated canonical governance branch and router-only PR are prepared. The model is not active until `PROJECT_ROUTER.md` is on `main` and a required governance check is verified in branch protection.

## Environments

| Environment | Source | CI | Private hosted | Public hosted | Field acceptance | Observed at / evidence |
| --- | --- | --- | --- | --- | --- | --- |
| Project governance | `governance/project-ops` (canonical); [router PR #292](https://github.com/ginosega/fishing/pull/292) | Dedicated governance-docs workflow installed **on governance branch**; positive/negative PR verification; **required branch rule must be checked** | not-applicable | Root router not yet verified on `main` | P1 owner-approved, P4 owner-tested PASS, final activation pending | 2026-11-01 [owner directive](P5_OWNER_DIRECTIVE_COMPLETE_GOVERNANCE_2026-11-01.md) · [implementation](P5_CANONICAL_BRANCH_IMPLEMENTATION_2026-11-01.md) |
| V3 app (separate) | [draft #263](https://github.com/ginosega/fishing/pull/263) | Historical component tests only; full app blocker [#287](https://github.com/ginosega/fishing/issues/287) separately tracked | **unknown** exact Worker/image-fix deployment | V3 public cutover not authorized | Partial historical owner testing; Gear/Catch defects pending | 2026-10-31 [original log](../../Fishing_Decision_Log.md); 2026-11-01 [issue #287](https://github.com/ginosega/fishing/issues/287) |
| Public PWA V2 (separate) | `main` (refresh ref) | No PWA source change in governance rollout | not-applicable | Current hosted release identity **not freshly checked** | No new field test | 2026-11-01 [release policy](../../pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md) |

## Active workstreams

**FISH-OPS-V2 — Governance installation:** The original main-based [draft #288](https://github.com/ginosega/fishing/pull/288) was a successful migration/recovery test, but distributing the same full docs to `main` and a governance-CI branch would create two authorities. Canonical bounded docs, seven topical catalogs (50 indexed decisions), ten rationale ADRs, 56-section historical index and fishing backlog now live on **`governance/project-ops` only**. [Router-only docs PR #292](https://github.com/ginosega/fishing/pull/292) installs static prompt and branch pointer onto main without application deployment. Standalone `governance-docs` CI is present on the branch; [positive/negative proof PRs #293/#294](https://github.com/ginosega/fishing/pull/293) test correct status, with no PWA release. **Next:** require governance-docs and existing merge-ready on canonical branch rules, verify bad PR blocks, then merge router PR #292, inspect default-branch routing and record P5 adoption. [Full plan](P5_CANONICAL_BRANCH_IMPLEMENTATION_2026-11-01.md).

**FISHING V3 — paused independently:** Private Gear Notes Worker version/image fix **unknown**, Catch attempted publication/operation receipt **unknown**; do not republish diagnostically. Lure/bait picker source improvements not owner field accepted. Do not infer deployment from source PR, branch, CI or sandbox GitHub.

**Evidence rule:** Never claim a provider rollout from repository state. All status statements above are dated source evidence; refresh at the next substantive transition.
