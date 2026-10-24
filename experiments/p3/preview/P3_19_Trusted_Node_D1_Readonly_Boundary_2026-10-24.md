# FISH118 P3-19 — Trusted Node to isolated D1 read-only boundary

**October 24, 2026 — SOURCE IMPLEMENTED AND REAL SANDBOX READ-ONLY SMOKE PASSED on draft PR #263.** The isolated R1/R2/R3 schema is completed and verified through private GitHub Actions; the P3 Worker is still a disabled, anonymous sentinel. Production main, preview Worker deployment, private sandbox writes/PR merge and P3 publishing have **not** been activated by this change.

## The current architectural gap

The P3-13 trusted Node checkout runner uses the OS filesystem/Git and cannot receive a Cloudflare Worker D1 binding merely by running on GitHub Actions. The Cloudflare D1 REST API can be called by a trusted server-side runner and supports parameterized queries; however, the REST `batch` contract has not been established as identical in atomicity to Worker `DB.batch()`. The P3 operation store relies on atomic `DB.batch` for accept + snapshot durability; **do not emulate it with separate REST calls or enable source-write operations through this module**.

## Narrow implementation

- `src/d1-rest-readonly.mjs`: server-only, authenticated direct Cloudflare D1 REST **READ-ONLY** adapter; checks exact sandbox UUID, name `fishing-p3-sandbox` and backend; no hardcoded account/database IDs or token.
- Allows exactly three preapproved server-authored, owner+repository-scoped SELECTs: existing Checking lease metadata, CI observation by operation, and CI observation audit history. Binds operation ID, numeric owner ID, and exact sandbox repository ID. No caller-provided SQL, no general SELECT, PRAGMA, UPDATE, INSERT, DELETE, DDL or mixed statements.
- Provides minimal `.prepare().bind().first()/all()` compatibility for these reads only; `.batch()` always rejects and `.run()` does not exist. Any provider HTTP error, unexpected JSON envelope, claimed database write or mismatch stops; raw error payloads, token, UUID or account ID are not logged.
- `test/d1-rest-readonly.test.mjs` exercises actual P3 check-store reader interfaces with simulated HTTP responses, owner/repository denial, no mutation, malformed provider data and wrong-target rejection.
- This module is **not imported** by the deployed Worker, registered as a route, scheduled in Actions, or invoked against real Cloudflare. No changes to existing permission flags, secrets, main branches or service providers.

## Next required boundary before a real publisher

The owner-approved P3 design still calls for atomic, owner-scoped, replay-safe durable operations via native D1 Worker binding or a separately verified equivalent, plus trusted GitHub App installation tokens. Prefer a minimal dedicated owner-authenticated Worker command endpoint with server-side allowed operations, no arbitrary SQL or generic GitHub mutation, and safe retry/receipt semantics. Security and deploy review must precede activation. Separately verify GitHub App `Contents: Read/Write`, `Pull requests: Read/Write`, `Checks: Read` restricted to repository ID 1430581407; no production-repository permission. Any Worker deployment, sandbox PR write, new secret or publishing-enable action remains an explicit owner gate. No enabled CI runner is being claimed by this document.

## Documentation basis

- Cloudflare D1 REST query: https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/query/
- Cloudflare D1 Worker binding: https://developers.cloudflare.com/d1/worker-api/
- Outstanding question on D1 REST batch atomic semantics: https://github.com/cloudflare/workers-sdk/issues/15904
- Approved architecture: `pwa/docs/Fishing_Companion_v3_Technical_Design.md`; current P3-14/P3-18 project status within this draft.

## Live sandbox proof — October 24, 2026

A separate infrastructure-only private sandbox [PR #6](https://github.com/ginosega/fishing-p3-sandbox/pull/6) added `.github/workflows/fishing-p3-trusted-read-smoke.yml` and narrowly permitted that exact workflow path in the existing infrastructure CI allowlist without changing synthetic-content validation. PR #6 passed private sandbox CI and was squash-merged to sandbox `main` at `cf4258738c1b016704fe594a6dd1b7112482971f`.

Its automatic `push` [GitHub Actions run #40123656675](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40123656675), using pinned public P3 source commit `250ee91e9270b216239d487f700a0b18b91e8aef`, completed **success**. The actual `live-read-only` job logs show:

> PASS: GitHub Actions trusted Node direct D1 read-only owner-scoped adapter executed three queries on isolated sandbox; all synthetic sentinel rows absent; preview Worker disabled/anonymous.

This verifies **actual Node → Cloudflare D1 REST API connection**, exact D1 target identity, three allowlisted operation/CI read queries with numeric owner/repo binding, and still-disabled hosted Worker in a trusted Actions runner. Existing repository secrets were used by Actions; no values appear in logs/source. The test did **not** execute D1 writes, `DB.batch()`, owner authentication/authoring, App write token issuance, branch creation, PR merge, deployment, or production publishing. Public Fishing production `main` and experimental PR statuses are unchanged.

**Next:** Implement and review a narrowly authenticated, replay-resistant **atomic D1 write boundary** on the isolated Worker binding, without generic SQL endpoints; only afterward activate a trusted sandbox draft-PR writer and verify the dedicated GitHub App's repository-restricted write grants. Cloudflare REST batch atomicity remains unproven and must not be silently assumed. No deployment is authorized solely by this successful read smoke.
