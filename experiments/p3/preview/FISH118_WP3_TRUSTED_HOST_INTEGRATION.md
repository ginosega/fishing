# FISH-TODO-118 WP3 — trusted host integration candidate (source-only)

This is the second of three planned runtime-wiring PRs. It is **unmounted**, **disabled by default** and not authorization to create privileges, install secrets, apply migrations, deploy a Worker, modify public V2 or perform GitHub writes.

## Existing components connected

- **Read side:** the already-validated WP2 `createD6ProductionRuntimeBindingContract` remains responsible for OAuth/session/read-source/static routes; no substitute login is created.
- **Write authentication:** the existing D2 `createD2UnifiedOwnerSession`, using its same AUTH-P0 session cookie and fixed-session HMAC CSRF (a repeated verification does not consume a one-time token); all writer requests require first-party POST.
- **Read/write credentials:** the already-reviewed GitHub App signer, read-token and narrow write-token issuers. Credentials are server-side only; GitHub App permission checks and token scope validation remain in the original issuers.
- **Provider data plane:** the existing pinned, method-restricted GitHub provider transport; no bypassing or blind retries. The original canonical snapshot loader retains its trusted same-source GitHub read behavior.
- **Durable publication:** existing immutable D1 receipts/Accepted-operation reader, staging fence/independent original blob verification/signed tickets, #496 real five-step provider wiring, #494 request-bound dispatcher and #493 single gateway.
- **D1 entry guard:** ten-table, read-only WP3 schema inspection after D2 authorization and before any writer dependency, GitHub token request or provider mutation; missing/partial schema fails closed.

## Server-only switches

`D6_PRODUCTION_ENABLED`, `D6_GATEWAY_ENABLED`, pinned `D6_ORIGIN`, `D6_OWNER_GITHUB_ID`, `D6_REPOSITORY_ID`, `D6_SESSION_ENABLED` plus distinct `D6_WP3_RUNTIME_ENABLED`, `D6_WP3_WRITE_ENABLED`, `D6_WP3_MOUNT_ENABLED` and an operator-supplied **non-browser** `ownerApproval()` must all be true before any write. A separate exact-step `authorizeStep` callback still defaults to denied. No writer credentials are touched merely by constructing the host.

The new host exposes **only** `fetch`. No deployed Worker entrypoint exists; no write env variables or secrets have been installed on Cloudflare.

## Important remaining isolated-origin acceptance gap

The existing WP2 isolated staging hostname is supported for **reads only**. The earlier #490/#492/#493 write route components pin the *public production* origin. This #497 host deliberately **does not bypass that restriction, rewrite a browser Origin header, or retarget production session cookies/CSRF to a staging Worker**. Even when WP3 switches are configured, the WP2 staging profile stays 404 for all write namespaces.

Before an isolated hosted WP3 writer can be authorized, the runtime must have a separately reviewed, exact **dedicated isolated WP3 origin** profile: same-origin D2 cookies/CSRF and OAuth redirect, pinned Pages/Worker paths, permission-bound GitHub App source, and independent write-denial regression tests. The WP2 read-only checkpoint and public V2 must remain untouched. This origin/security work and full failure-injection acceptance belong in the next WP3 source gate and require separate owner authorization prior to provider activation.

## Planned acceptance controls

At a future **separately owner-approved** hosted WP3 checkpoint, provision the exact ten-table isolated WP3 D1 schema; verify exact hosted artifact and bindings; approve narrowly scoped GitHub App contents/PR write grant; then test one operation-owned GitHub PR under authenticated owner control. Capture durable Unknown fences, independent Git GET + D1 VerifiedTree/Branch/Commit/Advance/Pr, no duplicate writes, broken media, changed main, and missing/lost acknowledgments. Never mark Accepted or VerifiedPr as public Live. WP4 retains verified merge/deployment; WP5 comprehensive field RC; WP6 public cutover.
