# FISH118 — AUTH-P0 G1 closeout and hosting decision: owner approval

**Decision date:** October 22, 2026  
**Owner statement in Fishing project chat:** **“I approved the document as is.”**  
**Approved document:** [AUTH_P0_G1_Closeout_and_Hosting_Decision_2026-10-22.md](AUTH_P0_G1_Closeout_and_Hosting_Decision_2026-10-22.md), Git blob `189b1ba89e4671ae4770bb44f1842ddf5052f491`; user approved the existing text **unchanged**.  
**Repository scope:** experimental FISH118 branch / [draft PR #262](https://github.com/ginosega/fishing/pull/262); no merge to `main` or production release authorized.

## Recorded decisions and boundaries

1. **D1 — Conditional architectural direction: APPROVED IN PRINCIPLE.** Target a same-origin Cloudflare Worker gateway for v3 with GitHub Pages continuing as canonical public publisher. A **new v3 launch URL and separately installed PWA** are acceptable *in principle*, subject to preview/acceptance and a later explicit permanent-hostname and production-cutover decision. This is not a present migration or URL change.
2. **D2 — Current provider/cost bounds: APPROVED FOR TESTING/PLANNING.** Continue within existing Cloudflare **Free** setup for isolated AUTH-P0 G1 tests and planning a potential P3 preview; **no domain purchase, paid service, permanent production address, additional production Worker provisioning or new credentials** are approved. A concrete nonproduction P3 preview setup needs its own scoped deployment permission.
3. **D3 — Session policy direction: AGREED AS A DESIGN DIRECTION, POLICY UNRESOLVED.** Retain first-party `Secure; HttpOnly` session cookies and evaluate bounded lifetime, revocation and reauthentication. The sign-off **does not choose** whether GitHub-side authorization revocation must be immediate or may have a finite lag. It **does not finalize** the P0 seven-day session lifetime. Document the trade-off and bring the exact policy back for an owner decision **before G1 can close**.
4. **D4 — Remaining G1 tests: APPROVED AS THE NEXT WORK.** Complete the named G1-A–E source/CI tests, negative checks, expiry/revocation, hosted byte-fidelity/release coherence, and operational/fail-closed evidence; report the observed outcomes and a revised G1 pass/fail recommendation. This approval **does not automatically authorize** modifying/redeploying the test Cloudflare Worker, granting GitHub App/repository write permissions, creating the publishing service, or changing production. If a test would require those separately gated actions, stop for approval.
5. **G1 formal result remains OPEN.** The approved document says **Architecture A conditional GO for design/planning; AUTH-P0/G1 OPEN; P3 HOLD; production unchanged**. The owner approved that conditional result, not a declaration of full security acceptance.

## What can happen next without another approval

- Review existing code, the published app manifest/source evidence and official operational limits.
- Run local or repository-isolated test suites without changing runtime/provider configuration.
- Make **documentation and nonproduction experiment test-harness-only changes** within the approved G1 scope and keep them isolated in draft PR #262.
- Record PASS/FAIL/NOT TESTED distinctly, including security and session limitations.
- Return with a **separate formal final G1 sign-off request**, then (only if G1 closes) propose the P3 write-permissions/infrastructure scope.

**Protected invariants:** production `https://ginosega.github.io/fishing/` stays authoritative; existing installed app/offline caches stay intact; no canonical Gear/KB/Catches edits; no repository App installation, write permission, Cloudflare paid plan, new domain, write route, production cutover or unreviewed v3 UX change.

## Traceability

- [Owner-approved G1 decision document](AUTH_P0_G1_Closeout_and_Hosting_Decision_2026-10-22.md) (left unchanged)
- [AUTH-P0 evidence ledger](README.md)
- [v3 approved implementation plan and P1/G1 gate](../../pwa/docs/Fishing_Companion_v3_Implementation_Plan.md)
- [Draft PR #262](https://github.com/ginosega/fishing/pull/262)

**Next workstream:** G1-A — reproducible expanded test suite and source/deployed dashboard-editor parity verification, followed by G1-B–E as applicable.
