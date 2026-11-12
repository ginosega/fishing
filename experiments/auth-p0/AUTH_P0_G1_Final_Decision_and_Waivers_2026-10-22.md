# FISH118 — Formal AUTH-P0 / G1 decision and owner's accepted exceptions

**Decision date:** October 22, 2026  
**Owner's exact instruction in Fishing project chat:** “I think we can wave all three of those, and just go with the default session policy. None of those things concern me and I am ready to move on.”  
**Disposition:** **G1 ACCEPTED BY OWNER WITH DOCUMENTED WAIVERS — CLOSED FOR P3 PLANNING.** This is an explicit owner risk-acceptance decision, not proof that the waived tests passed, and not permission to deploy/enable write access.

## 1. Resolution of the three open conditions

The “three of those” refers to the three items from the preceding consolidated review: session policy, live security/expiration checks, and live operational metrics. The owner elected to move on without further testing of those items and chose the **current default implementation policy**, rather than introducing a GitHub revocation webhook or a shorter expiration.

| Topic | Final owner decision | Evidentiary truth retained |
| --- | --- | --- |
| **D3 — Default session policy** | **ACCEPT the existing AUTH-P0 seven-day (604,800-second) absolute, non-sliding owner session** with host-only Secure HttpOnly SameSite=Lax cookie; D1-backed per-request session validation, single-session signout and manual revoke-all. **No GitHub authorization-revocation webhook and no 24-hour policy change** in P3 baseline. | **Accepted residual risk:** if the owner revokes GitHub App authorization *outside* Fishing Companion, an already-issued application session may remain valid **until its seven-day expiry**, unless locally revoked or its D1 row is manually invalidated. Server-side publication authorization and CSRF checks remain mandatory when writes exist. |
| **Targeted live security/expiry** | **WAIVE** additional live malicious-request checks, second-GitHub-account denial, and separately simulated Cloudflare+D1 session expiry/reauth **as prerequisites to progressing beyond AUTH-P0**. | Existing source tests (11 negative + 9 lifecycle) and actual sign-in/cross-device revoke-all tests still count as PASS within their scope; **untested live cases remain NOT TESTED, never relabeled passed**. Their risk is accepted for this single-owner P0 feasibility checkpoint, not waived for actual write-enabled v3 service security regression coverage. |
| **Actual Cloudflare usage metrics** | **WAIVE** collection of actual Worker request/CPU/error and D1 row/storage metrics as G1 prerequisites. Keep Cloudflare **Free** as the planning/test constraint. | Metrics remain **UNMEASURED**, and free-tier suitability is a **planning estimate** rather than proven capacity. Monitoring, quota/recovery strategy, instrumentation and real preview metrics still belong to service implementation and preproduction acceptance. |

**Previously decided G1-D:** owner separately waived an **additional independent Pages-vs-gateway byte-for-byte comparison**; this remains **WAIVED / NOT EXECUTED**, not passed. CI directly verified all 577 GitHub Pages files; the gateway's verified 575-item offline library and offline/restart field tests passed. The separate live new-release/dirty-editor/offline-fallback **integration test remains for nonproduction P4/P8**, not silently waived.

## 2. G1 acceptance basis and confidence

- First-party owner OAuth with GitHub numeric owner ID verified in Windows Edge and Android Chrome; installed *real gateway Fishing Companion* PWA OAuth callback reentry observed.
- App sessions survive supported device/browser restarts; owner-reported true server-side cross-device revoke-all passed.
- Existing hosted v2 gateway PWA installs and reads offline; Windows verified 575 manifest assets and detail pictures; Android downloaded and used its library, with offline Cache Storage persisted across phone reboot.
- Auth/gateway repository implementation parity and source security/lifecycle/failure-regression tests passed in their individual reported runs. **No single consolidated full-suite invocation after all additional test files is recorded**; run entire suite before any privileged preview deploy.
- Cloudflare gateway retains existing Pages as canonical publisher and fallback. Session secrets and GitHub user tokens are never handed to browser JavaScript as part of the demonstrated design. Test worker has **no GitHub repository installation, publishing API or write permission**.

**Gate classification:** **G1 feasibility/hosting choice accepted and CLOSED WITH EXCEPTIONS by the owner.** It does **not** certify that the experimental prototype is hardened or ready to secure GitHub writes as-is. Its evidence justifies preparing P3. **G3/P3 security and integration tests may not be waived implicitly** because P3 introduces new privileged functionality and credentials.

## 3. Mandatory P3-specific boundaries remain

**Allowed next:** draft a concrete P3 scope, minimal GitHub App repository-permission matrix, protected isolated preview workflow, secret management, publishing threat model, tests and explicit owner authorization request. Existing app design/UX approvals remain intact.

**Not yet authorized:** granting any new GitHub App Contents/PR/Checks/Actions rights, installing App onto a repository, deploying a write-enabled Worker, provisioning production secrets/new infrastructure, merging draft PR #262, buying a domain/paid Cloudflare tier, changing `https://ginosega.github.io/fishing/` or cutting over v3 production. These all retain the originally approved separate stage gates.

**Never waiver by implication:** server-side authorization of every write, CSRF/state validation, repository/path allowlists, short-lived least-privilege installation token, input/schema/media validation and source-conflict safety, exact CI/run/head-to-merge association, no unsafe branch-rule bypass, idempotency, and hosted identity proof before declaring publication Live. Test with unauthorized/expired sessions and false-positive/conflict scenarios **before write-enabled preview acceptance**.

**Operational gaps remain observable as accepted residuals:** missing Fetch Metadata may currently be treated as same-origin for signed-out session handlers; improve or justify compatibility for state-changing privileged APIs. The existing test Worker is a manually deployed dashboard build and has no independently measured deployed JS fingerprint. Hardening should happen in future separately approved source-controlled preview infrastructure, not by modifying production.

## 4. Next stage and precise status

- **AUTH-P0/G1:** **CLOSED BY OWNER WITH DOCUMENTED WAIVERS** (a scope-specific feasibility decision).
- **Architecture:** same-origin Cloudflare gateway **approved in principle**, GitHub Pages canonical publisher; new v3 hostname/installation later requires separate cutover decision.
- **Session:** seven-day fixed absolute, server-side D1 session, manual signout/revoke-all. No webhook.
- **P3:** **PLANNING AUTHORIZED; CODE/DURABLE PREVIEW HOSTING/REPOSITORY WRITE PERMISSIONS NOT YET APPROVED**. Prepare a specific authorization proposal before privileged implementation.
- **Production:** v2 unchanged; test Worker unchanged; draft PR #262 remains open/unmerged.

## 5. Traceability

- [Original owner-approved G1 architecture decision](AUTH_P0_G1_Closeout_and_Hosting_Decision_2026-10-22.md) and [as-is approval record](AUTH_P0_G1_Closeout_Approval_2026-10-22.md) remain unchanged and historically accurate.
- [G1-A test/parity report](AUTH_P0_G1A_Test_and_Parity_Report_2026-10-22.md), [G1-B security](AUTH_P0_G1B_Negative_Security_Report_2026-10-22.md), [G1-C session](AUTH_P0_G1C_Session_Lifecycle_and_Policy_Review_2026-10-22.md), [G1-D comparison waiver](AUTH_P0_G1D_Comparison_Waiver_2026-10-22.md), [G1-E operations](AUTH_P0_G1E_Operational_Review_2026-10-22.md).
- [Previously approved v3 technical design](../../pwa/docs/Fishing_Companion_v3_Technical_Design.md) and [P1/G1–P3 staged implementation plan](../../pwa/docs/Fishing_Companion_v3_Implementation_Plan.md).
