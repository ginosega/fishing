# FISH118 → v3 P3 — Trusted publishing foundation: scoped implementation authorization proposal

**Prepared:** October 22, 2026  
**Status:** **PROPOSAL FOR OWNER REVIEW — NOT YET APPROVED FOR PRIVILEGED ACTIONS.**  
**Gate:** [AUTH-P0/G1 owner-accepted closeout](AUTH_P0_G1_Final_Decision_and_Waivers_2026-10-22.md), with explicit live-test/metrics exceptions and the current seven-day manual-revoke session policy.  
**Reference:** [Approved v3 implementation plan, P3](../../pwa/docs/Fishing_Companion_v3_Implementation_Plan.md), [approved technical design](../../pwa/docs/Fishing_Companion_v3_Technical_Design.md) and [Fast Content Release policy](../../pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md).

## 1. Goal and scope

Build a minimal **trusted server-side GitHub publishing broker** for the **sole authorized owner** to publish one validated, source-aware content change to GitHub, track its exact PR/CI/merge/deploy/hosted release result, and **never report Live until the intended published source SHA is verified**. App authoring UI integration is **P4**, not part of P3. Preserve anonymous public reading and the existing GitHub Pages v2 site.

**Proposed P3 service design:** reuse the approved **Cloudflare same-origin gateway + D1** model, but create a **separate protected nonproduction service deployment** after permission/preview approval. Do not promote or mutate the manual `fishing-auth-p0-test` experiment into a write-enabled production service. The current AUTH-P0 Worker remains OAuth/read-only.

**Security/session baseline:** the owner explicitly selected current P0 **seven-day absolute nonrenewing Secure HttpOnly first-party session**, D1 validation, local Sign out and Revoke all, **no GitHub authorization-revocation webhook**, and accepted that GitHub external grant revocation may not end existing local sessions before expiration. This accepted trade-off does **not** waive server-side authorization on every publication operation or anti-CSRF protections.

## 2. Minimum GitHub App permissions to request — proposal, NOT granted

| Scope | Proposed access | Why |
| --- | --- | --- |
| **Repository access** | **Only a specifically approved test repository for initial privileged P3 tests**; production `ginosega/fishing` access is a later separate step. | Ensure that new P3 code cannot modify canonical production while publishing is first tested |
| **Metadata** | Read (GitHub App mandatory baseline) | Resolve repository identity and compare expected immutable owner/repo IDs |
| **Contents** | Read and write | Read latest canonical source, create one atomic candidate tree/commit in an approved test repo, push only permitted test branch |
| **Pull requests** | Read and write | Open exactly one change PR, read conflicts/review/merge status and merge only after allowed checks |
| **Checks / Actions** | **Read only if the particular CI/hosted verification endpoints require it** | Observe workflow/check results and exact commit identity; first verify endpoint-specific requirements |
| **Actions write, Administration, Secrets, Pages write, Workflows write, Issues write** | **NOT requested** | Existing GitHub Actions publisher owns deployment; no need to edit workflows/rulesets, trigger arbitrary workflows or manage secrets |

**Implementation detail:** issue short-lived (~1 hour) **installation access tokens restricted to the approved repository and the minimum granted permission subset**, held exclusively server-side. GitHub's API supports narrowing installation tokens by `repositories`/`repository_ids` and `permissions`; it cannot enlarge an installation's rights. Never store App private keys or installation tokens in browser JavaScript, URLs, GitHub source files or logs. Never grant `Workflows write` merely to author content.

**Current App status:** the existing P0 test GitHub App is **OAuth-only, not installed for repository writes**. Do **not** silently repurpose, reinstall or increase its permissions. The owner must explicitly approve the App configuration, specific allowed repository and any credential setup.

## 3. Recommended safety-first preview progression

**Stage P3-0 (code/design only; zero repository writes):** Build a hermetic broker with fake GitHub and fake D1 adapters. Enforce immutable owner GitHub numeric ID; one allowlisted repository ID/name, only Gear/KB/Catches canonical content roots (P3 starts with Gear/KB), strict source-aware v2 package, schema, Markdown/media hashes and canonical asset path rules. Test denial for traversal, other repositories, additional users, no or expired session, cross-site CSRF, large files and duplicate submission. Test the exact seven-day session policy plus signing out/revoking; no webhook.

**Stage P3-1 (explicit preview-service setup permission):** Configure a **separate Cloudflare Free nonproduction Worker and D1 database**, deployment from source-controlled, reviewable pipeline with pinned artifact identity. Retain the original test Worker unchanged. Configure only necessary secrets/owner allowlist; no paid service or custom domain. Capture safe summary metrics and a fail-closed / rollback procedure.

**Stage P3-2 (explicit GitHub installation permission):** Provision or authorize one **disposable sandbox repository** for initial write tests, then install the least-privilege App on that sandbox repository **only**. Create branch and content-only PR; verify exact PR head/check SHA, test CI classification and rejection cases, merge only if sandbox branch rules allow and the owner separately authorizes the first real test merge. If the publisher needs production workflow semantics, test via an isolated preview build/job and capture release-pointer/hosted verification without touching the live `ginosega/fishing` public site.

**Stage P3-3 (publication reliability acceptance):** Simulate duplicate submit/retries, changing `main` while queued, schema/Markdown/media conflicts, unauthorized or expired identity, CSRF, failing GitHub API, CI failure, merge race, deployment timeout, release-pointer mismatch and service restart. Operations must not issue duplicate GitHub changes or conflate Merged with Live. Review sandbox logs without exposing credentials.

**Stage P3-4 (subsequent specific authorization):** Only after nonproduction PASS, ask separately for the **actual `ginosega/fishing` App installation and v3 preview scope**, repository-specific permission grant, and any canonical-repo test PR strategy. P4 application UI and P8 production cutover remain separate approvals. No auto-publishing to production until P8 and full acceptance.

**Alternative for owner consideration:** Instead of provisioning a sandbox repository, use `ginosega/fishing` with unmerged, explicitly test-only PRs and strict branch protection, but that would require early installation of a write-capable App against the actual canonical production repository and creates avoidable risk. **Recommended default is a separate disposable sandbox first.** Do not create either without the owner's specific authorization.

## 4. Transaction and publication semantics

1. Owner browser sends a validated immutable snapshot and an idempotency key to an authenticated API; anonymous users cannot call it. Server revalidates exact Origin/CSRF plus numeric owner ID **on every modifying request**.
2. Server durably records `Accepted` and a uniquely keyed operation in D1 before permitting background continuation; no back-end operation may be silently dropped after the client navigates away.
3. Trusted service loads the **current** canonical source from the allowed repository and performs full source-aware conflict detection / schema/media/path verification. Never overwrite unrelated or newer edits. For P3 initial tests, use only controlled disposable sample records.
4. Service creates **one atomic branch commit** containing JSON, Markdown and media together; opens exactly one content PR with traceable operation ID. Reconcile API retries by comparing existing branch/PR/operation state, not by creating a second PR.
5. Wait for the **specific** PR head SHA, correct checks and safe merge state; stop when branch rules require human review and do not bypass. Use installation token so normal PR/push workflows can trigger. Let existing GitHub release workflow run as defined; do not grant `Actions write` by default.
6. Persist `Accepted → Validating → Merging → Deploying → Verifying → Live` plus explicit `Conflict`, `Failed` and `Pending` states. Only mark `Live` after verified hosted release points at the merged revision/expected release ID. If merge succeeded but deployment failed, report `Merged / Deploy failed`, not Live.
7. Keep durable sanitized evidence: operation ID, requested record/domain, input fingerprint, GitHub PR number, PR head SHA, merge SHA, workflow run ID, deployed release ID, verified HTTP evidence and bounded timestamps; **no credentials or user access tokens** in logs.

## 5. Security and operational hardening that G1 waivers do not remove

- Real preview must exercise unauthorized, expired and revoked sessions, concurrent requests, CSRF, malformed media, traversal and wrong-repository IDs **before GitHub writes are permitted**. The owner waived additional *AUTH-P0* live tests, not privileged-service acceptance.
- Use an explicit protected API request intent/CSRF token or other reviewed robust anti-CSRF mechanism; the current P0 signout's missing-Fetch-Metadata allowance must **not** silently become a publishing-write policy.
- Install scope, branch restrictions, secrets, issuance/token refresh, safe audit logs, outbound API rate limiting, quotas, D1 retention/cleanup and manual security rollback must be validated.
- Record source-controlled Cloudflare deployed SHA/version; capture Worker requests/CPU/D1 utilization during preview. The owner's waiver of earlier P0 metrics doesn't make future operating costs known.
- Preserve original v2 production and offline library. Do not introduce new domains, paid tiers, write-capable production endpoints or use original owner OAuth harness as a hidden authorization mechanism.
- For v3 preview and ultimately P8, test real release updates, dirty-editor preservation and old offline generation fallback; these were deferred, not waived, during G1-D.

## 6. Approval that would be required before privileged work

The owner has **already** approved the overarching v3 features, technical design, UX and staged plan, and has now **closed G1 with explicit exceptions**. Only these *new specific actions* still need authorization:

1. **P3 isolated implementation work** that is strictly source-only/mock-only can proceed in an isolated branch without permission elevation once its scope is acknowledged.
2. **Create a separate nonproduction Cloudflare Worker/D1 environment** on Cloudflare Free, with approved secret storage and CI deployment boundaries.
3. **Create/identify a disposable sandbox GitHub repository**, authorize a GitHub App with **Contents R/W, PR R/W, mandatory Metadata read and only endpoint-required Checks/Actions read** for that sandbox repository, then enable controlled sample PR/merge tests.
4. Later, separately approve actual `ginosega/fishing` write App installation and subsequent production service cutover/hosting/URL choices.

**Current disposition:** **P3 planning completed for owner review; no write-access setup, new cloud service, sandbox repo, GitHub App permission change, privileged Worker or production modification is authorized by this proposal.**

## 7. Official permission/token references

- [GitHub: Choosing GitHub App permissions](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app).
- [GitHub: Generating a GitHub App installation token](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app).
- [GitHub Actions `GITHUB_TOKEN` event rules](https://docs.github.com/en/actions/concepts/security/github_token).
- [Owner-approved v3 plan P3](../../pwa/docs/Fishing_Companion_v3_Implementation_Plan.md).
