# FISH118 / AUTH-P0 G1-B — Negative security verification

**Prepared:** October 22, 2026  
**Stage result:** **Local negative-security source checks: PASS (11 new tests / 0 failures). Live deployed-service negative verification: NOT COMPLETED. G1-B remains OPEN until required live checks or an explicitly accepted coverage exception.**  
**Source:** GitHub experimental branch `experiment/fish118-auth-p0-cloudflare-feasibility`, [draft PR #262](https://github.com/ginosega/fishing/pull/262).  
**Run environment:** Node.js `v22.16.0`, isolated local workspace. No live credentials, OAuth authorizations, Cloudflare D1 mutations, Worker deployment, external GitHub API changes or production changes.

## 1. Executed security suite and provenance

Added [`test/negative-security.test.mjs`](test/negative-security.test.mjs), containing **11 self-contained executable tests** against the actual modular Worker and gateway. Tests use simulated GitHub OAuth, D1, and GitHub Pages, not a network target.

The locally executed files were verified to have the **same Git blob SHA as the repository versions**:

| File | Verified Git blob SHA |
| --- | --- |
| `src/worker.mjs` | `c4d012dfaba8336216ca8e903f78257a8358c0ce` |
| `gateway.mjs` | `e97a84e6c203b70d0292664e4076aa9584973bbe` |
| `test/negative-security.test.mjs` | `cf0d324182737b3be196427db9853d34b0f43ebb` |

**G1-B test-only run:** `node --test test/negative-security.test.mjs` → **11 pass, 0 fail, 0 skipped** (approximately 125 ms on the test runner).  
**Additional local compatibility check:** `npm test` with the **six baseline tests from the owner-provided October 21 prototype archive plus the 11 new G1-B tests** → **17 pass, 0 fail**. **This was not the full current branch suite**: the original prototype archive contains only six older Worker tests, not the later 9+7+3 G1-A suite. The full **19-test G1-A** current-branch result was separately recorded in [the approved G1-A report](AUTH_P0_G1A_Test_and_Parity_Report_2026-10-22.md). Do not portray the 17-test local compatibility run as a complete current-branch `npm test` result or claim a combined 30-test run without actually performing it.

## 2. Results — checks exercised

| Test | Simulated attack/negative condition | Actual source behavior |
| --- | --- | --- |
| **G1-B01** | No session, malformed/guessed cookie, then an actual previously valid session with its D1 expiry set to zero | **PASS**: anonymous for missing/bad/expired sessions; server-side expiry respected |
| **G1-B02** | Open redirects, protocol-relative targets, malformed `return`, path traversal, query or NUL variants | **PASS**: 400, no OAuth state persisted, no redirect |
| **G1-B03** | Missing/mismatched flow cookie, missing code, corrupted OAuth state | **PASS**: 400 before contacting mocked GitHub; no session |
| **G1-B04** | Expired OAuth flow and replay of successful owner callback | **PASS**: 400 with no additional token exchange or duplicate session |
| **G1-B05** | Different simulated GitHub numeric account ID | **PASS**: 403, no owner session cookie or D1 session |
| **G1-B06** | Wrong/missing Origin, cross-site/same-site Fetch Metadata, missing/wrong intent on sign-out/revoke-all | **PASS**: 403 and existing owner session retained; valid same-origin revoke-all deletes session |
| **G1-B07** | Even owner cookie attempts publishing or methods POST, PATCH, PUT, DELETE on publishing and public gateway routes | **PASS**: no publication API (404); gateway method rejection (405) |
| **G1-B08** | Unexpected host, insecure base origin, missing secret | **PASS**: 421/503; session and gateway fail closed |
| **G1-B09** | Mock GitHub OAuth exchange failure with sensitive-looking data | **PASS**: generic 502, no session, no exposed code/token/secret in response |
| **G1-B10** | Omitted `Sec-Fetch-Site` but otherwise valid origin, intent, and owner session | **CONFIRMED CURRENT ALLOWANCE**: request succeeds (200); see security note below |
| **G1-B11** | Credential-bearing browser request, upstream tries to inject cookie/CORS/Location, malformed encoded asset paths, external upstream redirect | **PASS**: credentials not forwarded; unsafe headers suppressed; invalid paths 400 before upstream; redirect 502 and no reflected destination |

A passing **G1-B10** means the test accurately captured an intentionally observed permissive behavior; it is **not** a security-positive claim that missing Fetch Metadata is rejected.

## 3. One hardening finding (not changed in this stage)

`src/worker.mjs` implements:

```js
req.headers.get('Origin') === origin &&
(req.headers.get('Sec-Fetch-Site') || 'same-origin') === 'same-origin' &&
req.headers.get('X-Fish-P0-Intent') === 'signout'
```

The missing Fetch Metadata header is treated as `same-origin`. An attacker cannot satisfy the exact Origin and custom intent with an ordinary disallowed cross-site browser fetch without facing CORS/preflight restrictions, and the session cookie is HttpOnly/SameSite=Lax, so the observed allowance **is not evidence of a practical bypass by itself**. However, it removes a useful independent check if future write endpoints carry stronger consequences.

**Disposition:** Do **not** silently modify or redeploy the owner-approved P0 Worker. Before new publishing routes, decide whether to require `Sec-Fetch-Site: same-origin` for state-changing browser requests (with a documented compatibility exception if specific supported browsers omit it), and add purpose-specific CSRF validation for *publishing*. This is a **G1 security hardening issue**, not a demonstrated current account compromise.

## 4. Live deployed-service check — inconclusive, not passed

Attempted read-only public lookup of these exact deployed Cloudflare test routes:

- `GET https://fishing-auth-p0-test.ginosega.workers.dev/session`
- `GET https://fishing-auth-p0-test.ginosega.workers.dev/publications`
- `GET https://fishing-auth-p0-test.ginosega.workers.dev/auth/start?return=https%3A%2F%2Fevil.example` (invalid allowlist destination; expected 400 before D1 insertion)

The web client returned **“URL is not accessible via this tool”** for all three, providing **no HTTP status, JSON body or independently validated endpoint outcome**. The local runner also has no outbound DNS access. **No live negative-security PASS is claimed**; the inability to fetch does not imply the Cloudflare Worker is down. We deliberately did not start a valid OAuth flow, call `/auth/callback`, revoke any real sessions, probe another user's account, or send state-changing live requests.

The owner's earlier cross-device revocation and real OAuth PWA returns remain valid **owner-reported functional field evidence**, but are different from live hostile-input testing.

## 5. Remaining G1-B acceptance and safe next options

1. **Live read-only negative checks:** Use a browser/console on a device with access to the deployed test site to verify anonymous `/session`, 404 for unknown publication route (GET), and invalid `return` requests yielding 400. Record exact observed HTTP status and no sensitive response headers. This needs **no new worker deployment**. If more negative HTTP-method tests are required, use a scoped owner-approved testing environment and avoid invoking real sign-out/revoke-all against active sessions.
2. **Live rejected account:** In a controlled environment, test a distinct owner-managed GitHub identity or explicitly accept mock-only account denial coverage. Never ask for login credentials or OAuth callback codes in chat.
3. **Expiry and replay:** Local mock tests prove program logic, not Cloudflare D1 behavior under real clock/race/restart. G1-C will address an isolated expiry/reauth proof; one-use state replay can also be validated safely in controlled automation.
4. **Before any write-enabled P3:** Document and test stricter CSRF/session failure behavior, rate limits, publisher-route authorization, and the explicit decision on omitted Fetch Metadata.

## 6. Gate status and authority

- **G1-A:** PASS from separate test report.
- **G1-B:** **LOCAL SECURITY TESTS PASS; LIVE CHECKS INCOMPLETE.** No production-worthy security approval is claimed.
- **G1-C (session lifecycle), G1-D (hosted-byte integrity), G1-E (operational metrics):** OPEN.
- **AUTH-P0/G1:** OPEN. **P3 publishing:** HOLD. **Production:** unchanged.
- Owner-approved conditional gateway architecture and G1 test plan are [unchanged](AUTH_P0_G1_Closeout_and_Hosting_Decision_2026-10-22.md) and independently [signed off](AUTH_P0_G1_Closeout_Approval_2026-10-22.md).

**No Worker was redeployed, no GitHub permission/installation was expanded, no canonical content was touched, and draft PR #262 stays unmerged.**
