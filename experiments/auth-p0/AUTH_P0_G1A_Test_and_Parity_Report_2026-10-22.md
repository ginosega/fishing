# FISH118 / AUTH-P0 G1-A — Reproducible test suite and dashboard-source parity

**Date:** October 22, 2026  
**Result:** **PASS — 19 tests passed, 0 failed** under Node.js `v22.16.0`.  
**Scope:** Unmerged nonproduction [draft PR #262](https://github.com/ginosega/fishing/pull/262), no Pages / Cloudflare deployment, no GitHub permission changes, no production application edits.  
**Authorization:** Owner-approved [G1 closeout](AUTH_P0_G1_Closeout_and_Hosting_Decision_2026-10-22.md) and [separate sign-off](AUTH_P0_G1_Closeout_Approval_2026-10-22.md) authorize G1-A–E verification, not G1 closure or P3 permissions.

## 1. How source and tests were executed

A local Node 22 test directory was populated from the earlier owner-provided AUTH-P0 source archive, with the **current, authoritative GitHub experimental-branch sources restored and checked by Git blob SHA**. The dashboard-editor single-file version was assembled from the byte-equivalent modular Worker, standalone gateway and checked test PWA assets; its reconstructed output's `git hash-object` **exactly matched GitHub's dashboard file blob** before testing. The final local runner matched the experiment branch after the one-line test fix and added parity test.

**Exact Git blob source verification:**

| Repository file | Git blob SHA verified against local `git hash-object` |
| --- | --- |
| `src/worker.mjs` | `c4d012dfaba8336216ca8e903f78257a8358c0ce` |
| `gateway.mjs` | `e97a84e6c203b70d0292664e4076aa9584973bbe` |
| `cloudflare-editor-worker.js` | `92d683f241e4f7918af0faf718489b8dbe2ebaeb` |
| `test/gateway.test.mjs` | `9a223f519058cc9fdc36f9443216463cbfe43027` |
| `test/worker.test.mjs` after correction | `ad06a195251c1e94185becba8d5925038a4d360b` |
| `test/parity.test.mjs` newly added | `8d8786d132af895eb6b03ff1dca796569f692da0` |

`package.json` script: `npm test` → `node --test test/*.test.mjs`. No secrets, Cloudflare connections, real GitHub OAuth requests or live network access were required; external calls and D1 were mocked. No separate GitHub Actions run was triggered.

**Completed command:**

```text
$ node --version
v22.16.0
$ npm test
> node --test test/*.test.mjs

1..19
# tests 19
# pass 19
# fail 0
# cancelled 0
# skipped 0
# todo 0
```

The original pre-fix six-worker-test subset also passed; the existing seven gateway tests passed against exact source. The final full suite includes all original nine Worker tests, seven gateway tests and three newly added parity tests.

## 2. One test defect discovered and fixed

The **first actual complete repository test run** returned **15 PASS / 1 FAIL** among the 16 existing tests. Failure was **only** the assertion in `test/worker.test.mjs` checking the test-only allowlisted `/fishing/` OAuth state. It used the regular expression `/^[A-Za-z0-9_-]{43}\\\\.f$/` (in source: two backslashes before `.`), which expects a literal backslash before a character rather than the deliberate `.f` suffix. The generated state was valid; the assertion was wrong.

**Corrected the assertion only:** match 43 URL-safe nonce characters and a literal `.f` suffix using one backslash before the dot in the JavaScript regex literal. The same callback test then passed. No runtime/OAuth/Worker functionality changed. The fix was committed on the experimental branch as **`5682f1900a57dd8f678ca050129652e05934bafc`**.

This was a test-harness defect, not evidence of broken deployed Android OAuth. The failure and correction are retained here; do not rewrite history to imply the original run was green.

## 3. Added dashboard-parity regression coverage

New **`test/parity.test.mjs`** adds three independent tests:

1. **Gateway source equality:** strip the standalone `export` keyword and compare the full `gatewayResponse` code against the inlined dashboard version. This catches credential-forwarding, response-cache and upstream-routing drift.
2. **Authentication/session source equality:** remove only the dashboard's explicitly inlined static asset block and two static routing lines, then compare all remaining authentication, session, CSP and OAuth-handler source **exactly** with `src/worker.mjs`. This covers subtle token/CSRF/owner-access divergence.
3. **Bundled PWA asset equality:** request dashboard `manifest.webmanifest`, `sw.js` and both PNG icons through the test Worker; verify **actual response bytes**, not just filenames or sizes, against the corresponding `public/` files.

All three passed alongside existing functional tests. If source changes later, run `npm test` and update the generated dashboard artifact in lockstep.

## 4. Important limitations

- **Repository-source parity: PASS.** Exact checked source files and bundled assets were exercised; two Worker entry-point functional test coverage remains in `worker.test.mjs`.
- **Current live Cloudflare deployed-version parity: NOT PROVEN.** Because the dashboard was deployed by owner copy/paste and there is no connected Cloudflare administration/version read action, the tests cannot confirm that the deployed Worker has byte-for-byte identical JavaScript or current secrets/bindings. The earlier live field results prove *functional* behavior, not an exact deployment hash. Establish a trustworthy deploy/version fingerprint and automated deployment process before promoting a real write-enabled service.
- **No hosted security penetration test:** D1 and GitHub OAuth mocked in this suite. Unauthorized live account, session expiration, targeted malicious requests and Cloudflare operational metrics remain separate **G1-B–E** work.
- **No production/P3 implication:** PASS of G1-A does not close AUTH-P0; no writes or v3 cutover were authorized.

## 5. Next work item

**G1-B — Negative security testing:** run carefully bounded isolated-service tests for anonymous/unauthorized requests, invalid OAuth return targets, no publishing endpoints, cross-origin CSRF and single-use/expired state with controlled mocks. For a live test requiring Cloudflare console mutation, an alternative GitHub account, credentials or Worker redeployment, obtain the already-required separate approval before acting. Record test type, evidence, outcome, limitations and any newly discovered defects.

**Gate summary:** `G1-A = PASS`; `G1-B–E = OPEN`; `AUTH-P0/G1 = OPEN`; `P3 = HOLD`; production and test deployment unchanged.
