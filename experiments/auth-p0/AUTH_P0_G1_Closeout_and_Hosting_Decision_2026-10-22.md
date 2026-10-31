# FISH118 / G1 — AUTH-P0 closeout and v3 hosting decision

**Prepared:** October 22, 2026  
**Status:** **REVIEW DRAFT — CONDITIONAL GO for same-origin Cloudflare gateway architecture; G1 is NOT CLOSED; P3 is NOT authorized.**  
**Owner action:** Review the hosting/identity trade-offs and the explicit decisions in §9. This document records a recommendation, **not** an owner decision or implementation permission.  
**Location:** Isolated experiment branch, [draft PR #262](https://github.com/ginosega/fishing/pull/262); no production edits, credentials, GitHub permissions, or deployment from this document.

## 1. Executive decision

**Recommendation:** Choose **Architecture A — a same-origin Cloudflare Worker gateway plus D1-backed owner authentication** as the **conditional target design** for Fishing Companion v3. Keep the existing `ginosega/fishing` repository and GitHub Pages output as the canonical published public application; the gateway serves the same published public files at `/fishing/`, alongside its own first-party `/auth`, `/session`, and *future* publication endpoints. Do not put GitHub write credentials or a reusable browser-readable session token in the PWA.

**Why:** The owner has now validated actual release delivery, verified offline preparation and use in Windows Edge and installed Android Chrome, owner OAuth returning to the **real installed gateway PWA**, first-party session persistence, cross-device revoke-all, and Android offline-library survival after a device restart. This directly mitigates the untested assumption in the approved v3 technical design that a separately hosted API's cookies would work from `github.io`.

**Crucial cost/UX trade-off:** the eventual owner-enabled v3 PWA would use a **new URL and a separately installed PWA**. The existing `https://ginosega.github.io/fishing/` remains a valid public read-only production/fallback URL until a separately approved cutover; its current installation and cache **do not automatically become** the new one. A `workers.dev` hostname is free and compatible with personal/hobby use, but Cloudflare recommends a route/custom domain for production services; do not silently interpret the test `workers.dev` address as the permanent v3 URL.

**Decision classification:** The security/session *feasibility* evidence supports Architecture A. **G1 is still open** until the remaining targeted security/operational checks in §6 and owner approval in §9. **No P3 publishing-service development, permission enlargement or production cutover follows automatically.**

## 2. Authoritative baseline and scope

- **Source of authority:** [approved v3 requirements](../../pwa/docs/Fishing_Companion_v3_Requirements.md), [technical design](../../pwa/docs/Fishing_Companion_v3_Technical_Design.md), [UX review](../../pwa/docs/Fishing_Companion_v3_UX_Review.md), and [implementation plan](../../pwa/docs/Fishing_Companion_v3_Implementation_Plan.md), especially P1/G1, P3 and P8/G7; all approved October 19, 2026 **subject to subsequent stage/hosting/security decisions**.
- **Current repository check, October 22:** `main` `35e88c47d96f4d7021afa642fdee9e6616c65e83`; **one open PR, draft #262**. A documentation-only `main` commit is ahead of the last production application source. Refresh these before later actions.
- **Latest successful main production workflow:** [#543](https://github.com/ginosega/fishing/actions/runs/39690549053), source `ab1c59a61c748e9a8a1da2b31d87e1d86c96ac9f`, hosted release `131ebca9c6d46fa1c1d815ad43a318f6`; **577 total hosted files = 575 manifest-listed application files + release manifest + release pointer**, with **100 Gear, 60 KB, 12 Catches**.
- **Isolated test:** existing Cloudflare Free Worker `fishing-auth-p0-test.ginosega.workers.dev`, D1 `fishing-auth-p0`, GitHub App `fishing-companion-auth-p0`. OAuth-only, GitHub App mandatory repository Metadata read permission, **no GitHub App repository installation, no code/content/pull-request/workflow write permission, and no publication endpoint**. Provider configuration and credentials were created by the owner for the nonproduction proof; secrets are not in the repository.
- **Scope guard:** this write-up changes **documentation on draft experimental branch only**, not `main`, current Pages deployment, Cloudflare Worker, authorized GitHub App settings, or v3 UX.

## 3. Real-device evidence matrix (owner-reported; not an independent browser lab certification)

| Claim | Test and observed result | Disposition |
| --- | --- | --- |
| OAuth owner identity | Root Cloudflare AUTH-P0 harness authenticated numeric allowlisted GitHub owner on desktop Edge and Android Chrome. | **PASS** on those devices |
| Original harness PWA | Genuine Chrome Android install, in-app GitHub OAuth return, sign-out visible in ordinary Chrome; owner session retained after app close and phone reboot. | **PASS**; distinct from the real Fishing Companion |
| Real PWA through gateway | `/fishing/` loaded published Fishing Companion; Chrome offered **Install app** and launched it as a standalone Android PWA. | **PASS** |
| Release metadata | Owner read gateway `release.json` in desktop InPrivate; release ID matched, and manifest had matching `releaseId`, `base=/fishing/`, 100/60/12 counts. | **PASS** metadata; standalone upstream-vs-gateway byte comparator **not run** |
| Windows offline proof | Edge downloaded and SHA-verified the 575 manifest assets, reported Ready/no errors; disconnected Windows, refreshed and used My Gear, KB, Catch Log, sample detail pages and pictures. | **PASS** |
| OAuth back into *real installed gateway PWA* | Started GitHub OAuth from root test harness with allowlisted `return=/fishing/`; callback reopened **installed standalone gateway Fishing Companion**, not a Chrome tab. | **PASS**; native v3 in-app button does not exist yet |
| First-party session continuity | Following callback, Android Chrome root harness showed approved owner without reauthentication. | **PASS**; owner UI inside unchanged v2 app not testable |
| Cross-device revoke-all | Owner invoked revoke-all on Android; Android Chrome and separately authenticated Windows Edge both showed anonymous after refresh. | **PASS** for application sessions |
| Android offline preparation and persistence | Real installed gateway PWA prepared offline library, worked offline, and retained it after phone restart. | **PASS** for owner-reported offline functionality and persistence; no detailed Android per-asset accounting |
| iOS and Android Edge | Not tested; owner does not have iOS test hardware and explicitly skipped it. | **OUTSIDE owner-performed coverage**, not passed |
| Actual Save and Publish, v3 in-app sign-in | Not present in the unmodified v2 release. | **NOT TESTED / not in AUTH-P0 test deployment** |

**Confidence and boundaries:** The PWA's offline preparation invokes `verifyBytes` against the manifest SHA-256 for each of the 575 resources; the release manifest hash is checked separately and the pointer retained. This is substantial functional byte-integrity evidence through the proxy. It is **not the same as** an independent upstream-vs-gateway byte comparison for representative public assets or a measured performance/release-transition audit.

## 4. Architecture and security review

**Public read path:** Browser/installed PWA → gateway `GET /fishing/*` → hard-coded upstream `https://ginosega.github.io/fishing/*`. The implementation in [`gateway.mjs`](gateway.mjs) accepts only GET/HEAD, fixes the upstream origin, sends no inbound cookie/Authorization/Origin headers, rejects upstream redirects and unsupported content encoding, strips upstream `Set-Cookie`, does not rewrite response bytes, and does not cache through the gateway. Static read requests are **not authenticated**, preserving anonymous default.

**Private/auth path:** Same gateway origin `/auth/*` and `/session*` → GitHub OAuth authorization-code/PKCE → verify GitHub numeric user ID → opaque `__Host-` `Secure; HttpOnly; SameSite=Lax; Path=/` cookie and hashed D1 session. OAuth state is cookie-bound and consumed once; `return` permits exactly `/` or `/fishing/`. Browser receives no GitHub access token. `POST` sign-out/revoke-all require exact Origin plus purpose header and fail on cross-origin requests. Cross-device database-backed revoke-all passed on real devices. Source: [`src/worker.mjs`](src/worker.mjs).

**Write boundary:** None exists in AUTH-P0. `/publications` returns 404; `POST /fishing/*` returns 405. A future server must recheck numeric owner identity **for every write**, restrict repository and canonical content paths, validate source-aware packages/media, use a narrowly scoped GitHub App installation token stored only server-side, and enforce CSRF, idempotency, rate/size limits and release-safe PR/CI/merge rules. No current test supports saying GitHub publishing itself has been secured or implemented.

**Existing safeguards inspected in source:** configuration/host fail-closed, OAuth code/state validation, owner numeric ID check, seven-day expiring D1 sessions, one-use OAuth flow, private no-store auth responses, restrictive harness CSP, read-only upstream proxy, and regression unit-test coverage for denied identity, replay/expiry, forged origin and proxy leaks. The mock tests do not replace live negative testing; the entire expanded suite has **not been rerun as part of this closeout**. Earlier repository notes report seven gateway tests passed locally.

**Security concerns requiring an explicit production decision:**
1. **Upstream GitHub App authorization revocation is not immediately reflected** in an already valid seven-day local app session because the server discards user access tokens after initial identity verification. Local sign-out/revoke-all is immediate, but GitHub-side revocation is not currently revalidated. Decide the maximum acceptable session lifetime/reauthentication policy for v3 and test expiry; do not label it solved.
2. The test has **no abuse-oriented rate limiting, audit/event retention policy, session-row cleanup routine, secret rotation/recovery runbook or hardened incident workflow**. These are required before any write-enabled service or public v3 deployment.
3. An **unauthorized real second GitHub account** has not been exercised against the live service (unit test verifies owner-ID denial). Avoid collecting someone else's credentials; use a controlled owner-managed second account if practical, or record a conscious coverage exception with compensating proof.
4. No independent live proof yet of **CSRF denial, direct forbidden `POST`, state replay/expired state, malformed-origin/return abuse** against the deployed single-file Worker, beyond mock tests and owner field evidence.
5. Serving through a gateway adds an upstream network hop, Worker uptime dependency and a new install/storage origin; timeouts, quota exhaustion, GitHub Pages outage, new-release coherence, rollback and operations need rehearsed fail-closed/fallback behavior.
6. Deployed dashboard-editor single-file source must stay **in parity** with module source; an automated build/deploy and deployed-version comparison are preferable to manual copy/paste for any long-lived service.

## 5. Operational limits, costs and practical hosting choice

**Verified Cloudflare documentation as of October 22, 2026:** Workers Free allows **100,000 requests/day, 10 ms CPU per HTTP request, 50 subrequests/request, 128 MB memory**. D1 Free includes **5 million rows read/day, 100,000 rows written/day and 5 GB total storage**; Free D1 database size limit is **500 MB**. CPU time counts code execution, **not waiting for upstream HTTP/D1 I/O**, but cryptographic hashing and heavy content processing can still breach the 10 ms budget. These are account-plan limits, not a measured guarantee for this app.

- **Likely reasonable for one person's personal app**, but this is a planning inference, not a production load test. Preparing 575 assets can result in hundreds of gateway GETs per device; with no Worker-side cache every online file fetch also reaches GitHub Pages. Existing browser offline caches still function.
- **Known unmeasured:** actual request/day, Worker CPU percentile and errors, asset latency through Worker vs Pages, upstream failures, image/media sizes and behavior, D1 read/write metrics, new-release publishing and cache coherence.
- Cloudflare officially treats `workers.dev` as suitable for personal/hobby sites but recommends a route or custom domain for production services. A custom domain entails user-owned domain/DNS obligations and separate approval. **Do not order or configure one as part of this document.**
- **Preferred staged strategy:** continue isolated test for targeted G1 proof; if approved, plan a *separate nonproduction v3 preview Worker/environment* with source-controlled deployment and metrics. Choose permanent production hostname only in a later explicit hosting/cutover review. Do not repurpose `fishing-auth-p0-test` as production.
- No new service invoice is authorized. Cloudflare Free sufficiency must be measured and confirmed before a production commitment; if paid Worker capacity or a custom domain becomes necessary, stop for a new cost/domain decision.

**Current official references:** [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [Workers pricing including D1](https://developers.cloudflare.com/workers/platform/pricing/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/), [Workers routing / `workers.dev`](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/), [GitHub App permissions](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app), [GitHub Actions triggering and App tokens](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow).

## 6. Remaining G1 closeout work (before declaring AUTH-P0 closed)

**Must complete before passing G1 / starting P3 security-dependent development:**

- **G1-A — Reproducible test suite:** run the **entire** `npm test` / `node --test test/*.test.mjs` suite for module and dashboard-editor Worker using Node 20+ and record run/source SHA/coverage; verify no deploy source drift.
- **G1-B — Negative security tests:** verify anonymous `/session`, forbidden publishing requests, POST to public gateway, bad return URLs and forged-origin CSRF. Test unauthorized numeric GitHub identity and one-use/expired OAuth state with live isolated service **where safely possible**, noting any tests covered only by controlled mocks. Do not post actual OAuth codes, tokens or cookies into chat/issues.
- **G1-C — Session lifecycle:** measure a session invalidation/expiry path on both desktop and Android (prefer a safe isolated shortened-expiry test or controlled D1 test-session invalidation; avoid changing production sessions); confirm silent anonymous fallback and ability to sign in again. Explicitly settle GitHub-side authorization-revocation policy.
- **G1-D — Hosted release fidelity:** independently compare hash/byte size for representative `release.json`, manifest, JS, CSS, JSON and an image directly from Pages versus the gateway; verify new-release pointer update, no stale mixed content, dirty-editor protection and previously prepared offline fallback when feasible. Keep existing Pages production untouched.
- **G1-E — Baseline metrics and error handling:** collect Cloudflare Worker request, failure and CPU statistics during a bounded app/offline test; verify public GET timeout/upstream outage handling and that session endpoints fail closed. Record Free-tier capacity assumptions and alert/manual recovery plan.
- **G1-F — Permission, hostname and design sign-off:** approve a specific target session/hosting architecture and any amended UX/URL expectations, with stage-specific infrastructure/permission decisions; update the approved design/plan traceability **without overwriting their historical approvals**.

**May be implemented/tested during the separately authorized P3 preview (but must pass before any write-enabled public deployment):** hardened limits/logging/secret rotation, durable operation reconciliation, owner-only GitHub App installation permissions, token scope audit, cross-request CSRF/IDOR probes, branch-rule and bot-created workflow triggering, release/CI conflict/idempotency paths.

**Later P4/P8 acceptance:** actual Sign In/owner state embedded in v3 Connection Status, Save and Publish Gear/KB preview, final migration/installation instructions and rollback, all supported real-device/browser tests. iOS is **explicitly waived for this owner-run phase**, not silently passed. New permissions, paid plan, domain and any final production cutover each have their own approval.

## 7. Proposed next staged work order

1. **Now:** owner reviews this document and decides whether same-origin gateway + eventual new PWA URL is an acceptable target architecture (or requests the custom-domain/keep-URL alternatives).
2. **Next isolated AUTH-P0 closeout:** G1-A through G1-E, with evidence logged back into this experimental branch and no production changes or permissions. If a safe live negative test needs a temporary Worker code deployment, obtain scoped approval first.
3. **Formal G1 checkpoint:** reconcile evidence, document selected hostname/session policy/provider/cost constraints, amend the approved design if required, and obtain final explicit G1 sign-off.
4. **Only after G1:** propose **P3 trusted publishing foundation** with separately reviewed GitHub App installation permission matrix, infrastructure/secrets setup, PR/CI behavior, protected preview, and user approval **before** granting GitHub repository writes or deploying a write-enabled API.
5. **Eventually:** P4+ authoring integration, P8 production acceptance and **separate cutover approval**. Existing Pages v2 stays live and recoverable until that final decision.

## 8. Non-goals / explicit invariants

Do not migrate canonical Gear, KB or Catches into D1; do not weaken FISH108 source-aware validation, GitHub branch protection, atomic content publication or hosted hash/identity proof; do not require the public user to sign in; do not add browser-held GitHub tokens; do not destroy current PWA/cache; do not install/enlarge GitHub App privileges or purchase a domain by implication. The owner's Android installed gateway test does not migrate any existing production PWA data automatically.

## 9. Decisions requested from owner (**NONE YET APPROVED**)

| Decision | Recommended answer for review | Approval effect |
| --- | --- | --- |
| **D1 — Target architecture and app URL** | **Approve in principle:** same-origin Cloudflare gateway; keep GitHub Pages as canonical public publisher; permit a **different v3 app URL/install** after preview acceptance, without yet choosing a final hostname. | Authorizes documenting/designing toward this target, **not** P3 code/deployment or any production cutover. |
| **D2 — Hosting/cost constraints** | Continue **Cloudflare Free only** for nonproduction G1 tests and candidate P3 preview planning; no domain purchase, new plan or production hostname commitment. | Any preview provisioning, paid service, domain or production hosting needs its own scoped agreement. |
| **D3 — Session policy** | Retain first-party HttpOnly cookie design; propose a bounded application-session lifetime plus revocation/reauth evaluation. Owner chooses whether GitHub-side authorization revocation must terminate existing sessions immediately, or a documented finite delay is acceptable. | Final policy decided before G1 closure; not silently accepted as the P0 seven-day behavior. |
| **D4 — Residual tests / G1 gate** | Run G1-A–E next and return with a revised evidence-backed **G1 pass/fail recommendation**. | No authorization for repository write permissions, publishing service or v3 production cutover. |

**Recommended gate outcome as of this draft:** **Architecture A: CONDITIONAL GO for design planning. AUTH-P0/G1: OPEN; P3: HOLD; production: unchanged.**

## 10. Traceability

- [Test implementation, field-results ledger and outstanding test cases](README.md).
- [Prior hosting/session architecture comparison](AUTH_P0_Session_Transport_Architecture_2026-10-22.md).
- [Isolated Worker](src/worker.mjs), [read-only gateway](gateway.mjs), [Cloudflare dashboard build](cloudflare-editor-worker.js), [unit tests](test/).
- [v3 implementation plan P1/G1, P3, P8](../../pwa/docs/Fishing_Companion_v3_Implementation_Plan.md).
- [Draft PR #262](https://github.com/ginosega/fishing/pull/262) — must remain **draft/unmerged** until a separately reviewed integration scope exists.
