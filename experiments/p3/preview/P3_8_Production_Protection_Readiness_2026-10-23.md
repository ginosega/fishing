# FISH118 P3-8 — GitHub Free public-production protection readiness

**Date:** October 23, 2026
**Decision:** Owner will **not** upgrade to a paid GitHub plan. Use the existing private sandbox for synthetic tests without auto-merge, and require enforceable **GitHub Free public repository branch protection** on `ginosega/fishing` before v3 production auto-publishing. Keep publisher-side independently validated exact-sha checks and GitHub enforcement. The required-check workflow has now been released and hosted-verified as described below. The public production main ruleset is now active and independently verified as documented below. No v3 production cutover is authorized.

## Public main GitHub Free ruleset — ACTIVE AND VERIFIED October 23, 2026

The owner created and enabled [repository ruleset #25742040](https://github.com/ginosega/fishing/rules/25742040) using GitHub Free. The GitHub connector independently verified the actual saved rules:

- Public `ginosega/fishing` repository; pinned numeric ID `1350909744`; ruleset name `main`, target `branch`, enforcement **active**.
- Branch condition includes `~DEFAULT_BRANCH` (actual default is `main`) and excludes no branches.
- `bypass_actors: []` and `current_user_can_bypass: "never"`: no account, App or admin bypass exceptions.
- Rules `deletion`, `non_fast_forward` (no force pushes), `pull_request` (0 required human reviews), and `required_status_checks`.
- Strict up-to-date check (`strict_required_status_checks_policy: true`), no creation exemption, exact `fishing-merge-ready` pinned to **GitHub Actions integration ID `15368`**.
- `GET /branches/main` returned **`protected: true`** and still pointed to the verified production source SHA `4a1a8c44317b56a4d47e818db9cd2b5587a966d8`. The *legacy* `protection.enabled: false` field is from a different branch-protection mechanism; it does not override the active ruleset.

The source-only readiness module now additionally exposes `auditProductionRuleset()`, requiring exact active ruleset identity and all of the above safeguards, with adversarial tests. It is **read-only and never authorizes merges**. The prior classic branch audit remains for older configuration diagnostics.

**Production branch protection is configured and independently verified.** This does not authorize v3 publishing, GitHub App permission expansion, private sandbox merges, P3 Cloudflare write enablement, D1 migration 0002 or v3 cutover. No paid GitHub plan, visibility change or new deployment is needed.

---
## Production CI workflow release completed — October 23, 2026

Following the owner's "Proceed" instruction, the separate full-application required-check workflow PR #264 was fully reviewed against production main, then **merged (squash)** with an immutable expected-head-SHA guard:

- Production main source/merge SHA: `4a1a8c44317b56a4d47e818db9cd2b5587a966d8`.
- PR #264 head: `7c6d65fcf8405d1be6557d0b93ab586cce304ea3`. Final PR exact-head [full CI run #39986130452](https://github.com/ginosega/fishing/actions/runs/39986130452) PASSED, including the unique `fishing-merge-ready` check.
- Separate smoke draft PRs [#265](https://github.com/ginosega/fishing/pull/265) (docs-only) and [#266](https://github.com/ginosega/fishing/pull/266) (canonical Catches formatting-only change) targeted the unmerged workflow branch, **not production main**. Both live Actions workflows succeeded, each verified the intended lane and `fishing-merge-ready`, and both PRs were **closed unmerged**.
- Production main [GitHub Actions run #39990546320](https://github.com/ginosega/fishing/actions/runs/39990546320) initially failed one WebKit preview-only offline navigation heading timeout (53 browser tests passed, one failed), and correctly prevented deployment. Retrying the failed jobs at **run attempt 2** passed the full validation and completed GitHub Pages deployment plus **actual hosted byte/release identity and browser verification**. No source changes, test bypasses, or schema/production content modifications were needed to pass.
- Hosted source revision: `4a1a8c44317b56a4d47e818db9cd2b5587a966d8`. Hosted release ID: **`504d615b2bef361da06d655ee621d43a`**. **577 verified hosted files**; counts **100 Gear / 60 KB / 12 Catches**. Hosted acceptance includes online/offline transition, release identity and application navigation; [hosted evidence artifact #12519043138](https://github.com/ginosega/fishing/actions/runs/39990546320/artifacts/12519043138).
- The released workflow is now on public production main and preserves the FISH108 Fast Content Release policy; it requires no paid GitHub plan.

**HISTORICAL — GitHub branch-protection configuration was still open at this earlier checkpoint.** The connected GitHub integration cannot write admin branch-rule settings. The owner needs to open `ginosega/fishing` → Settings → Branches → Add rule for `main` and enable **Require a pull request before merging** (no required human approvals for single-owner publishing), **Require status checks to pass** → `fishing-merge-ready` from **GitHub Actions**, **require branch up-to-date** (strict), **Do not allow bypassing** (including administrators), and disallow branch deletion and force pushes. Do not require a deployment check (the deployment is after merge), and do not require a second human reviewer. The branch must be independently verified as `protected:true` and the rules verified by the owner's GitHub admin UI after setup before declaring the production auto-merge protection gate satisfied. No private sandbox or GitHub plan change is needed.

The experimental publisher code still has **no production cutover**. The private sandbox PR #1 remains draft/unmerged; v3 P3 writes, App permission expansion and D1 migration 0002 remain disabled/unapplied.

---

## Historical pre-release record — staged workflow PR #264

Owner directed continued implementation with no GitHub plan upgrade. To avoid mixing production CI changes into experimental P3 publisher source, a separate **draft, unmerged [PR #264](https://github.com/ginosega/fishing/pull/264)** was created from unchanged production main SHA `35e88c47d96f4d7021afa642fdee9e6616c65e83`.

The staged workflow removes only pull-request path filters (retaining the existing main/push and hosted deployment restrictions), preserves FISH108 fast content and full application validation, adds a docs-only non-release PR lane, and provides one stable always-evaluated `fishing-merge-ready` final job. A separate `pwa/test/merge-gate-policy.test.mjs` suite tests changed-file classification with real Git and Bash. A caught regression in mixed Markdown/canonical file order was corrected to require the full lane regardless of changed-file ordering.

**Historical pre-merge checkpoint:** At that time PR #264 was source-only and unmerged. The later production merge, successful retry, hosted deployment and remaining branch-protection configuration are recorded above.

---
## Actual GitHub facts checked on October 23

| Repository | ID | Visibility | Main SHA | Status |
| --- | ---: | --- | --- | --- |
| `ginosega/fishing` | `1350909744` | Public | `35e88c47d96f4d7021afa642fdee9e6616c65e83` | `protected:false`, checks enforcement off |
| `ginosega/fishing-p3-sandbox` | `1430581407` | Private | `e37db3b18bd9948bf4453d7f885f868e830a9a9a` | `protected:false`, checks enforcement off; GitHub Free private rulesets endpoint returned HTTP 403 |

The private synthetic draft [PR #1](https://github.com/ginosega/fishing-p3-sandbox/pull/1) passed an actual exact-head GitHub Actions job `validate-sandbox-head` on [run #39976510965](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/39976510965). It stays draft, open, unmerged; this did NOT exercise the publisher GitHub App or a GitHub merge. Source drafts [#262](https://github.com/ginosega/fishing/pull/262) and [#263](https://github.com/ginosega/fishing/pull/263) stay unmerged. Existing hosted production release is unaffected.

GitHub documentation establishes that protected branches are available on public repositories under GitHub Free; branch rules can require PRs, checks, and force-push/deletion restrictions. Branch protection can apply to admins when configured. No payment or repository visibility change is necessary for the *public production repository*.

## FISH108 compatibility blocker found: do NOT enable required checks yet

The current production workflow is `.github/workflows/fishing-production.yml` and its exact job names are:

- `classify` determines `content` versus `full` from changed paths;
- `validate-content` runs only if `classify` selects `content`;
- `validate-full` runs only for `full`;
- `deploy-content` and `deploy-full` run only for corresponding main/push publication with hosted verification.

Crucially, the **entire pull_request workflow has a path filter**: `pwa/**` excluding `pwa/docs/**` and `pwa/README.md`, or changes to `.github/workflows/**`. Root documentation-only PRs may trigger no workflow at all. Marking the existing lane-specific or deployment jobs as required could block legitimate PRs, or produce a "skipped counts as success" ambiguity. The exact deployed FISH108 Fast Content Release policy must be preserved, including its lightweight validation for canonical-only Gear/KB/Catches edits and full validation for runtime/schema/workflow changes.

**Recommended separately-reviewed PR before activating protection:**

1. Modify the production workflow's **pull_request** trigger to run for *all* PRs (remove PR path filters). Retain the existing main/push filters so documentation-only main commits do **not** initiate Pages deployment.
2. Keep existing `content` and `full` release lanes. Add an explicit `docs-only` non-release classification for genuinely documentation-only PRs, with a lightweight source check; if docs-only detection is ambiguous, use the full lane. Do not reclassify runtime/schema/media-transform or mixed changes as fast content.
3. Add **one unique, always-evaluated, never-skipped final PR job** with stable job/check name `fishing-merge-ready`. It depends on `classify` and the relevant lane jobs and fails unless classification succeeded **and exactly the intended lane's validation succeeded**. It must not depend on deployment jobs, which are correctly absent/skipped in PRs. It must fail on missing, failed, cancelled or ambiguous validation rather than treating an absent workflow as passed. Make the PR job available for changes only to docs and for content-only changes.
4. Prove three PR types before requiring this check: a content-only change should run the FISH108 fast lane; a runtime/workflow change must run full; a docs-only change must generate the stable required check **without deploying**. Test failure injection, check job uniqueness, concurrent base changes, and external GitHub App-created PR workflows. Github docs state that a PR created by a GitHub App installation token normally triggers GitHub Actions, unlike most events created with the workflow `GITHUB_TOKEN`.
5. Only **after** that workflow modification has passed the normal Full Application Release process and GitHub Pages hosted verification, enable protected `main` through GitHub's owner/admin settings and require `fishing-merge-ready` from **GitHub Actions** (observed App ID `15368`) on an up-to-date PR branch. Use **zero required human approvals** if supported, consistent with the signed-off single-owner automatic publishing UX. Require PR creation and no bypass, no force pushes, no deletion, and apply the restrictions to admin too. Do **not** rely on a required human reviewer, which would defeat automatic publishing.
6. Verify the effective settings through GitHub's owner/admin UI plus a known good/bad nonproduction PR before v3 cutover. Ordinary connected GitHub installation permissions **cannot read the administration-only full protection endpoint**, so the read-only `GET /branches/main` response is necessary but not a complete proof.

**Owner confirmation is required before changing live production workflow/rules.** In particular, enabling rules ahead of the stable required check may disrupt routine content and full releases. If ordinary documentation PRs are unexpectedly blocked, **do not bypass checks or remove protection silently**; correct the workflow/rules through a separately reviewed rollback.

## Additional publisher-side safeguards (independent of branch protection)

The new source-only, read-only `src/production-protection-readiness.mjs` exports:

- `auditProductionBranchSummary`: pinned public production repository numeric ID and `main`; checks `protected:true`, required check `fishing-merge-ready`, status check enforcement level `everyone`, and the required check's Actions App source `15368`. It always returns `needsOwnerAdminVerification:true` and `neverAuthorizesMerge:true`: branch summary does **not** prove full admin bypass/PR/force-push protections.
- `auditExactPRCheck`: checks that an open, **non-draft**, unmerged same-repo PR has the exact expected head AND base SHAs, and that one unambiguous check-run on the exact head is `completed/success` and created by GitHub Actions App `15368`; rejects missing, stale, untrusted, skipped, neutral, failing, duplicate, and incomplete check-run responses. It **does not call GitHub** or merge.

[Source test suite](test/production-protection-readiness.test.mjs) uses mocked branch/PR/check objects and tests every fail-closed case. No GitHub App Checks permission was granted, no REST live merge/branch write was performed and these modules are not deployed.

For actual server-side use, implement a separate securely authorized GitHub REST check-run fetch. A GitHub App checking a **private** sandbox requires `Checks: read`, which the installed P3 App does not currently have. **Do not expand its permissions silently**; owner permission review is still necessary. The public production repository may expose check metadata to public read requests, but access still needs safe rate limiting and direct trusted-source validation, not browser-provided claims. GitHub's REST merge endpoint accepts a mandatory expected PR head `sha`; the publisher must supply it and reread the base immediately before merge to detect conflict.

**Draft PR incompatibility:** Existing P3 prototype creates a draft PR, which GitHub cannot merge. The eventual publisher must transition to ready-for-review **after** checks and owner policy controls, then independently reacquire PR/check/base evidence before an expected-sha merge. This is a separate future permission, source, and live-test gate. Do not auto-convert private synthetic smoke PR #1 or merge it.

## Gate status

- **Completed:** factual repo/workflow audit; owner choice to stay on GitHub Free; controlled synthetic private PR exact-head CI; source-only production branch/read-only exact-check audit tests; proposed FISH108-compatible stable check design.
- **Blocked/not started:** production `fishing-merge-ready` job; live public branch protection; owner-admin full rule verification; publisher check-run REST token; GitHub App write/merge protocol; hosted production v3 cutover.
- **Still prohibited:** changing production `main`, Github App permissions, private sandbox PR #1 merge, AUTH-P0 Worker, Cloudflare P3 Worker/`P3_WRITE_ENABLED=false`, D1 0002, or v3 production publication without their corresponding approval.

## Official GitHub references

- [About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [Troubleshooting required status checks](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks)
- [Workflow trigger events and GitHub App tokens](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow)
- [Check runs and read permissions](https://docs.github.com/en/rest/checks/runs)
- [PR merge head-SHA preconditions](https://docs.github.com/en/rest/pulls/pulls)
