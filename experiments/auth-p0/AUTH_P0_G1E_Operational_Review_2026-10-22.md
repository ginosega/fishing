# FISH118 / G1-E — Cloudflare Free operational verification and recovery

**Reviewed:** October 22, 2026  
**Status:** **SOURCE FAILURE-HANDLING TESTS PASS (10/10). Free-tier suitability CONDITIONAL for a low-traffic, one-owner personal PWA. Actual Cloudflare request/CPU/D1 metrics and deployed failure behavior NOT OBSERVED; formal G1-E operational acceptance is not yet complete.**  
**Owner's explicit instruction:** waive the extra G1-D independent byte-for-byte comparison and proceed with G1-E. Waiver recorded separately in [AUTH_P0_G1D_Comparison_Waiver_2026-10-22.md](AUTH_P0_G1D_Comparison_Waiver_2026-10-22.md). Do not mistake the waived comparison for a passed test.

**Scope:** existing nonproduction Cloudflare Worker `fishing-auth-p0-test.ginosega.workers.dev`, D1 test DB, unchanged read-only gateway, no deployment/Cloudflare settings/production repository changes, no secrets, no authoring/publishing API. All repository work confined to [draft PR #262](https://github.com/ginosega/fishing/pull/262).

## 1. Verified Free-plan operating limits (official docs as checked October 22, 2026)

| Resource | Cloudflare Workers/D1 Free | Relevance |
| --- | --- | --- |
| Workers requests | **100,000/day, shared account quota, resets midnight UTC** | A standalone library preparation makes many independent GET requests; budget includes other Workers on the account |
| Worker CPU | **10 ms per invocation** | Runtime can exceed budget despite low request count; network wait time is not equivalent to CPU time |
| Memory | **128 MB per isolate** | Public responses are streamed, not eagerly hashed or buffered by gateway |
| External subrequests | **50 per invocation** | Current public asset GET triggers one upstream Pages fetch, not 575 within one invocation |
| D1 rows read | **5,000,000/day** | Session lookups and any future status queries; enforced on Free tier |
| D1 rows written | **100,000/day** | OAuth state/session creation/revocation; enforced on Free tier |
| D1 storage | **500 MB per database**, **5 GB total on Free account** | D1 stores session/flow metadata, not canonical fishing content |
| D1 queries/invocation | **50 on Free** | Current auth session checks use a small number of queries |
| Workers Free quota exhaustion | **Error 1027** at Workers runtime/edge | Gateway code cannot catch errors when invocation is denied before execution; must fail closed and offer explicit read-only Pages fallback |
| D1 Free daily row quota exhaustion | **Queries return errors until midnight UTC** | Owner sign-in/session operations can become unavailable; no silent escalation to paid service |

**References:** [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/), [D1 Free enforcement, Sep 2026](https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/), [Workers request/CPU metrics](https://developers.cloudflare.com/workers/observability/metrics-and-analytics/), [Workers logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/), [workers.dev guidance](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/).

**Capacity interpretation (planning, NOT metered actuals):**

- The owner's field-confirmed offline release consists of **575 manifest-listed files**, plus the release pointer and version manifest fetched separately. Initial complete preparation makes approximately **577 static fetches**, in addition to any page/application requests and retries. **At least hundreds of Worker requests per one-device fresh preparation** is a defensible order-of-magnitude estimate; actual totals require Cloudflare metrics.
- 575 alone is **0.575%** of an account-wide 100,000/day request budget; roughly 173 such 575-request downloads could fit if they were the **only** traffic and none retried. This is an *illustration*, not a promise; initial preparation may exceed 575 requests.
- Gateway code requests upstream **one public file per Worker invocation**. The limit of 50 external subrequests is therefore not 50 offline assets **in total**; the app requests each asset separately from its service worker.
- As currently written, the gateway sends no caching hint beyond `no-store` to client. The PWA's explicit integrity-verified offline library remains browser Cache Storage, while every online cache-miss/public asset fetch is proxied to Pages. Operationally that makes Cloudflare and Pages **both** uptime dependencies for fresh online resources.
- Account-specific CPU quantiles, daily request totals, D1 rows, response/error rates and quotas **could not be read**: there is no connected Cloudflare management/analytics tool and the model's runtime cannot reach the test hostname. Therefore capacity is only **plausibly sufficient** for a single-owner personal PWA, **not proven under live operational load**.

## 2. Source-matched executable operational tests

**Added:** [`test/operations-failure.test.mjs`](test/operations-failure.test.mjs) using Node v22.16.0 and the exact GitHub source Worker/Gateway. `git hash-object` locally matched the GitHub file blob for the test and source.

**Actual commands/results:**

```text
node --test test/operations-failure.test.mjs
# tests 10
# pass 10
# fail 0

node --test test/worker.test.mjs test/negative-security.test.mjs test/session-lifecycle.test.mjs test/operations-failure.test.mjs
# tests 36
# pass 36
# fail 0
```

**Accounting:** The 36-test compatible combined run uses 10 new G1-E tests, 11 G1-B tests, 9 G1-C tests, and **six tests from an earlier OAuth prototype archive**. It is **not** the entire latest PR's suite (G1-A's newer gateway/parity cases are not included in that 36-test invocation). No outbound requests, live D1 changes or Cloudflare logins occurred.

| Test | Simulated operational condition | Result |
| --- | --- | --- |
| G1-E01 | Ordinary public asset + sensitive incoming cookies/Authorization | **PASS:** one fixed GitHub Pages upstream GET, no inbound credentials forwarded, original bytes and no-store policy |
| G1-E02 | Upstream missing file, secret-bearing body | **PASS:** sanitized 404, upstream body and `Set-Cookie` suppressed |
| G1-E03 | Upstream responds 429, 500 or 503 | **PASS:** controlled 502, no internal detail disclosure |
| G1-E04 | Upstream redirect to arbitrary host | **PASS:** controlled 502, redirect not followed or reflected |
| G1-E05 | DNS/timeout style `fetch` rejection | **PASS:** controlled 502, no stack/secret reflection |
| G1-E06 | Unexpected compressed upstream response | **PASS:** controlled 502 instead of forwarding bytes that might violate release hashes |
| G1-E07 | HEAD request | **PASS:** one upstream HEAD, proper 200 and no body |
| G1-E08 | POST/PUT/DELETE to public gateway path | **PASS:** 405 with zero upstream calls |
| G1-E09 | D1 operations throw while mandatory binding exists | **PASS:** auth returns sanitized 502; **separate public GET still works** |
| G1-E10 | Entire mandatory DB binding missing/misconfigured | **PASS for security fail-closed:** 503 for all paths, including public; **availability limitation** |

**Boundary:** These are simulated source-response tests, not deployed Cloudflare faults, timing measurements, or evidence that edge-level 1027 and quota throttling are catchable by the Worker. The approved P0 Worker was **not** redeployed to introduce faults.

## 3. Material operating risks and how to manage them

**A. Account exhaustion / CPU overrun:** A burst of static fetches or unexpected public traffic could hit the account's 100,000 request/day limit or 10 ms CPU limit. Cloudflare can fail with **1027 / exceeded resources before Worker JavaScript runs**, so application-level try/catch is not a universal recovery mechanism. Never configure fail-open on a route exposing auth/publishing functions. Keep the old Pages address as a **manual reader-only fallback**; authenticated publishing must remain unavailable during an API outage. Do not buy a paid plan by default.

**B. GitHub Pages outage or upstream timeout:** Gateway returns a sanitized 502 for upstream network/5xx/redirect errors. A previously installed PWA with a complete verified offline library can fall back while network requests fail if its service worker is healthy; fresh installations and online-only assets may fail. Users can also open the still-live direct Pages URL *if GitHub Pages itself is available*. Avoid promising universal offline recovery without preparation.

**C. D1 outage or exhausted quota:** Existing D1-bound Worker with a failing query returns generic auth 502. Public file proxy can still serve unauthenticated content. **A missing D1 binding fails `configOk()` for every route, including public**, causing blanket 503; this is deliberate security fail-closed in P0 but operationally couples public-reader uptime to auth configuration. Recommend separating the public gateway from the private-auth preflight in the eventual production design without allowing any protected API access on a broken configuration.

**D. App state, session revocation and retries:** D1-authenticated owner status is checked server-side for each authorization call. Signout/revoke-all test passed across actual Android and Windows sessions. Existing P0 auth uses no application session refresh, and **GitHub-side authorization revocation isn't immediately checked after OAuth**; this unresolved D3 policy is documented in G1-C and should be resolved before G1 closes. Do not implement auto-retry of publishing requests without idempotency and durable operation status in P3.

**E. Proxy implementation/deployment drift:** Owner deployed a hand-copied single-file Worker. G1-A verified its *repository* inline Worker code against modular source; **Cloudflare deployed script SHA still unknown**. Production-grade write service should have source-controlled CI deployment, version stamping, secret-safe configuration, scoped deployment credentials and emergency rollback. Keep experimental P0 unchanged until a separately scoped preview is approved.

**F. Hostname and domain:** Cloudflare describes `workers.dev` as intended for personal/hobby projects, recommending custom domains/routes for production. The owner has **not authorized** purchasing a domain or selecting a permanent production hostname. The test hostname is **not** silently promoted to v3 production.

## 4. Monitoring and recovery procedure (no new service required)

For the **existing isolated test** or a later explicitly approved preview:

1. Open [Cloudflare dashboard — Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages), choose `fishing-auth-p0-test`, and view **Metrics**. Record the last 24 hours and, if available, last 7 days for: total requests, successful vs errored invocations, **Exceeded Resources**, upstream subrequests, CPU time per invocation (including p95/p99 if displayed), and latency/wall time. Cloudflare's `Success` invocation status **is not** the same as HTTP 200; a controlled 502 may still register a successful Worker invocation. Capture safe numerical aggregates only—not cookies, auth codes, secrets or account IDs.
2. Open Cloudflare **D1 → `fishing-auth-p0` → Metrics → Row Metrics**. Record rows read/written, database/storage usage and whether free-tier limit or query errors occurred.
3. Check logs/issues for **unexpected errors or retries** only if diagnostics are available within the existing Free plan; do not enable paid telemetry or retain OAuth payloads. Treat new-asset 502s, session 502s and edge 1027 as distinct failure categories.
4. If **public gateway unavailable**: for reading, use `https://ginosega.github.io/fishing/` (the original installation) or a prepared gateway offline library. This **does not authenticate** the original Pages app or change its URL. Never try to work around auth failures by forwarding session cookies or enabling client-held GitHub tokens.
5. If **auth/D1 unavailable or permissions broken**: **disable/avoid any publish action**; maintain anonymous read where functioning. Check D1 quota, Cloudflare dashboard incident/metrics, deploy settings and platform status. Do not reconfigure secrets in response to an unverified transient error.
6. If **Workers Free daily quota exhausted**: wait for the reset at **midnight UTC**, or explicitly return to user for approval of a paid plan; do not silently purchase or change route fail mode.
7. Before a write-enabled v3 preview: document controlled redeployment/rollback, secret rotation and loss recovery, request limits, rate limiting, durable publication retries/idempotency, permission scope, logging retention and a simple “service degraded / publishing unavailable” owner UX.

**Proposed, not adopted alert policy:** investigate any `exceededResources`/1027 error or material increase in authentication 502s; review capacity before sustained daily usage approaches the Free request/CPU/D1 limits. A specific numerical alert threshold requires real baseline metrics and owner review.

## 5. G1-E exit gate and outstanding work

| Requirement | Current evidence | Status |
| --- | --- | --- |
| Official Free-tier limits and realistic per-device request estimate | Docs reviewed, estimate grounded in 575 verified asset entries | **PASS as planning review** |
| Source fail-closed scenarios | 10 source-matched regression tests passed | **PASS** |
| Real Cloudflare request/error/CPU data | No Cloudflare connection or screenshots | **NOT MEASURED** |
| Real D1 row read/write and storage usage | No connected D1 metrics access | **NOT MEASURED** |
| Real deployed fault and resource-limit simulation | Not performed; no fault injection authorized | **NOT TESTED** |
| Operator recovery and explicit fallback | Documented above; no destructive rehearsal | **DOCUMENTED, rehearsal pending before P8** |
| **G1-E overall** | Source/limits positive; live metrics unavailable | **CONDITIONAL; formal gate OPEN** |

**Recommended next checkpoint:** review the Cloudflare dashboard's safe aggregate request/CPU/D1 metrics when convenient and decide the remaining G1-B/C operational/security exceptions and final D3 session policy. It is reasonable to progress to formal G1 review **without** forcing the owner to do another byte-by-byte comparison, as explicitly waived; it is **not** reasonable to relabel unmeasured Cloudflare performance as verified.

**Project state:** G1-A PASS; G1-B local negative PASS/live pending; G1-C local lifecycle PASS/D3 policy and live expiry pending; G1-D independent byte comparison WAIVED, preview release-transition test deferred; G1-E source failure PASS/live metrics pending. **AUTH-P0/G1 still OPEN; P3 HOLD; draft PR #262 unmerged; production unchanged.**
