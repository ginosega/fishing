# FISH118 / AUTH-P0 G1-C — Session lifecycle verification and policy review

**Prepared:** October 22, 2026  
**Status:** **Local session-lifecycle tests PASS (9 of 9). Policy recommendation prepared; exact v3 session duration and GitHub authorization-revocation behavior require owner approval. Live D1-expiry/reauth test NOT completed. G1-C not formally closed.**  
**Scope:** Isolated experimental branch, draft [PR #262](https://github.com/ginosega/fishing/pull/262); **no change to Cloudflare configuration/deployment, GitHub App, cookies, production PWA, D1 live rows or repository permissions.**

## 1. Reproducible evidence

Added [`test/session-lifecycle.test.mjs`](test/session-lifecycle.test.mjs) with nine independently executable lifecycle tests, executed using **Node.js v22.16.0** against the **SHA-verified current modular AUTH-P0 Worker** and an in-memory D1/GitHub OAuth mock. Local `git hash-object` of the test source agreed with its GitHub content SHA. No network calls occurred.

**Command and actual results:**

```text
$ node --test test/session-lifecycle.test.mjs
# tests 9
# pass 9
# fail 0
# cancelled 0
# skipped 0

$ node --test test/session-lifecycle.test.mjs test/negative-security.test.mjs test/worker.test.mjs
# tests 26
# pass 26
# fail 0
# cancelled 0
# skipped 0
```

**Important accounting:** The second command combined 9 new G1-C, 11 G1-B and **6 older authentication tests from the owner-provided October 21 prototype archive**. It was **not** a 39-test execution of all current experiment-branch suites; the later G1-A nine-worker/seven-gateway/three-parity cases are not locally mounted in this test directory. G1-A and G1-B have their own separately recorded successful tests.

A first run of the new lifecycle file had 8 pass / 1 fail because the **new mock D1 harness** had a missing block around its simulated `DELETE FROM sessions WHERE github_id` branch, inadvertently binding `else if` to the inner loop. This was **fixed in the new test harness only**, and then the nine tests and combined subset passed. **The production/authentication Worker source was not changed.**

| Case | Verification | Result |
| --- | --- | --- |
| **G1-C01** | Login produces `__Host-` Secure HttpOnly SameSite=Lax Path=/ cookie; D1 expiry is `now + 604800` seconds, 7-day absolute TTL | PASS |
| **G1-C02** | Repeated session reads do **not** renew expiry; still valid at `expiry - 1` second, invalid at `expiry` and later | PASS |
| **G1-C03** | Expiring a D1 row immediately returns anonymous even when browser still sends cookie; new approved GitHub OAuth produces fresh working session | PASS (mock D1) |
| **G1-C04** | Sign out on one device/session deletes only that D1 session; independent owner sessions remain valid | PASS |
| **G1-C05** | Revoke-all deletes all owner sessions, including three independent simulated clients; stale cookies cannot revoke again | PASS |
| **G1-C06** | Expired session cannot revoke active owner sessions; its local sign-out clears cookie without invalidating another session | PASS |
| **G1-C07** | OAuth flow expires at exactly 600 seconds; expired callback rejected; fresh OAuth flow works | PASS |
| **G1-C08** | Subsequent `/session` checks make **zero** GitHub API calls after initial authorization; prior GitHub-side authorization revocation is **not checked** | PASS as characterization; **security limitation** |
| **G1-C09** | GitHub ID other than numeric allowlisted owner cannot obtain app session | PASS |

The owner's October 22 field test independently established real **cross-device revoke-all** across Android Chrome and Windows Edge, but did **not** simulate a live expiry or GitHub authorization revocation. Do not confuse the two evidence types.

## 2. Exact session mechanism verified in source

In `src/worker.mjs` and the matching dashboard-editor build:

- **OAuth state:** generated random 32-byte state, 600-second `auth_flows.expires_at`, one-time atomic `DELETE ... RETURNING`, binding to an HttpOnly flow cookie; `return` only `/` or `/fishing/`.
- **Application session:** random 32-byte opaque cookie `__Host-fish_p0_session`; `Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`; **SHA-256 of session secret** stored in D1 with numeric GitHub identity and seven-day `expires_at`.
- **Validation:** for each `GET /session`, checks cookie format, hashes cookie, reads D1 with `expires_at > now` and compares numeric owner identity. An expired/missing/invalid row produces `{authenticated:false,authorized:false}`. No sliding refresh or session extension exists.
- **Revocation:** signed-out session deletes its matching D1 hash; owner-authorized revoke-all deletes every D1 session for that GitHub identity. Both clear caller's cookie. In the running app, authorization-state UI is currently the **root test harness only**: the unchanged v2 PWA has no built-in owner/expiry screen.
- **No GitHub grant revalidation:** GitHub user access token exists only transiently during OAuth verification and is discarded. A session already issued is therefore valid until local D1 expiry or explicit local revocation, even if the person separately revokes the **GitHub App authorization** after that initial sign-in. This is a tested source limitation, **not evidence that actual upstream revocation has been exercised**.
- **Expired D1-row cleanup:** source validates `expires_at` on reads but does **not** automatically delete expired session/flow rows. Retention/cleanup is an operational prerequisite for production hardening (G1-E/P3).

## 3. External provider behavior (separately researched; no functionality added)

GitHub documents the **`github_app_authorization`** webhook with action **`revoked`**, emitted when a user revokes authorization of a GitHub App. GitHub Apps receive this event by default when webhooks are enabled; the owner-approved AUTH-P0 test App has **webhooks disabled**, and the existing Worker has **no webhook receiver**. A **future hardened v3** backend could enable app webhooks, verify GitHub's HMAC signature, deduplicate delivery, and immediately delete all local sessions for the sender's immutable numeric GitHub ID, with explicit behavior for failed/retried deliveries. That would support **prompt, but not mathematically instantaneous**, revocation and would require separately reviewed app settings, secret, route and operational monitoring. It is **not approved/implemented** by this report.

Official references:
- [GitHub webhook events: `github_app_authorization`](https://docs.github.com/en/webhooks/webhook-events-and-payloads#github_app_authorization).
- [GitHub App user token generation and revocation](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app).
- [GitHub security: token expiration and revocation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/token-expiration-and-revocation).

## 4. Recommended owner decision (not yet approved)

**The issue:** For a write-enabled v3 owner session, how long should a device continue to retain server-side editing authority after a successful GitHub sign-in **without** rechecking GitHub authorization?

| Candidate | Convenience | GitHub authorization revoked outside the app | Security / complexity |
| --- | --- | --- | --- |
| **A. Keep 7-day absolute session, with manual revoke-all** (current P0 policy) | Few repeated sign-ins; successful restart tests | Can remain valid for **up to 7 days** if not separately revoked | Simple, but longest upstream-revocation lag |
| **B. Use 24-hour absolute session, with manual revoke-all** | Sign in more often; may be rapid if already signed into GitHub | A valid local session lasts **at most 24 hours after issuance**, regardless of GitHub revocation | Simpler, limits passive exposure, but trades away persistence convenience |
| **C. 7-day absolute session plus verified GitHub authorization-revocation webhook** | Preserves current convenience | Prompt server-side session deletion when GitHub's signed event is received and processed; finite failover gap if delivery fails | **Recommended for consideration** if frequent reauthentication is undesirable; more components, validation and monitoring; new webhook setup requires approval |

**Proposed default recommendation:** **C**, conditional on successful isolated event-signature/delivery/retry acceptance and explicit separate authorization to enable the webhook. Keep a fixed absolute expiry (no silent rolling extension), first-party HttpOnly cookie, server-authorized write checks, immediate local signout/revoke-all, and a documented **fail-safe if webhook delivery or monitoring is unavailable**. For a smaller deployment with no webhook operations, **B** is the simpler risk-limiting fallback.

**This is not a final policy decision.** The approved closeout's D3 specifically defers lifetime/upstream revocation policy to the owner. Do not enable webhooks, change the seven-day P0 session, configure a new D1 migration, grant app repository permissions, or begin P3 without the required decisions.

## 5. Remaining evidence needed before formal G1-C closure

1. **Hosted test / expiry:** Verify actual Cloudflare+D1 session expiry and anonymous fallback, followed by successful reauthentication, using a deliberately isolated test session. This can be done via a separate bounded preview/temporary policy or safely expiring an owner-controlled test row but **requires separately scoped approval before touching a live Worker or its D1 data**. No user cookies/keys should be shared with Chat.
2. **Session policy D3:** Explicit owner choice between a shorter finite session, 7-day session with residual external grant lag, or a verified GitHub authorization-revocation webhook. Confirm the acceptable detection/delivery latency and loss-of-webhook behavior.
3. **Future write-enabled enforcement:** Implement and test per-request owner authorization and purpose-specific CSRF for publishing, audit retention, cleanup of expired sessions, and authorization checks after revoked/expired sessions; all remain **P3 preview** and must be approved separately.
4. **Browser UX:** In an isolated v3 preview, verify expiration produces anonymous/read-only editor state and prompts deliberate GitHub reauthorization from Connection Status, without losing unsaved local edits; production v2 does not have that UI.

## 6. Gate outcome

**G1-C: LOCAL SOURCE TESTS PASS (9/9), but FINAL POLICY + LIVE EXPIRY TEST PENDING. G1 remains OPEN.**  
**G1-A: PASS. G1-B: local PASS / live still pending. G1-D and G1-E: not started.**  
**P3: HOLD. Production: unchanged. PR #262: draft/unmerged.**
