# FISH118 P3-25 — Trusted command signer and transport boundary

**October 24, 2026 — SOURCE ONLY. No new deployments, DB writes, PR creation, publishing activation or production changes.** P3-24 hard-disabled command Worker was deployed and its private binding/disable flags were verified via read-only [Actions run #40133925321](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40133925321). Its postflight workflow remains read-only.

## Implemented

`src/p3-trusted-command-client.mjs` defines a narrow, source-only trusted signer and command protocol compatible with the P3-20/21/23 gate/native D1 composition. It requires all three safeguards: `P3_WRITE_ENABLED=true`, `P3_COMMAND_CLIENT_ENABLED=true`, and a trusted operator approval predicate; **all are off by default**. It also requires an authenticated/trusted numeric owner ID equal to server-owned `P3_OWNER_GITHUB_ID` and the exact private repository ID `1430581407`. The owner ID must be resolved through a trusted GitHub App identity check before any real use, not inferred from a source fixture.

A caller can request **only** `accept` with a bounded Gear/KB text-only v2 snapshot, an explicit idempotency key, and a fresh cryptographically random nonce. It uses the original reviewed HMAC-SHA256 signature protocol, 60-second server time window, fixed method/path/request origin, 8 KiB body bound, strictly checked 202 receipt, and redacted errors. There is **no automatic retry** on a network timeout: the operation may have committed before the response was lost, so recover through trusted owner-scoped status using the **same idempotency key** and a fresh nonce under a separately approved flow. The client exposes no GitHub App token, SQL, PR, merge, deploy, or status interfaces.

The `transport` is an explicitly injected private, trusted capability. **No default `fetch` exists and no route is enabled.** This is a source-only seam for future reviewed transport; a fake transport is used in tests to call the actual source-only internal HMAC gate and locally atomic D1 operation store. The logical Request URL is the original fixed sandbox preview-origin constant from P3-20 and is NOT an authorized public destination. Do not call global `fetch` with that URL or route commands through the currently public preview Worker.

## Passing source CI — October 24, 2026

The verified source-test result is [GitHub Actions run #40134946824](https://github.com/ginosega/fishing/actions/runs/40134946824), job #120994375117, against corrected draft source commit `d4401cb35ea5877e93a859802c02ae9d55d08b49`: **completed/success**. Independently reviewed logs show **80 PWA + 43 broker + 187 P3 = 310 of 310 passing tests**, including **P3-T01 through P3-T08**. The initial source-test fixture mistakenly omitted and then initialized its local `DB` binding after reference; the fixture was corrected in two follow-up source commits before this successful result. No remote Worker dispatch, D1 write, GitHub App write or deployment occurred.

Cloudflare's current [service binding documentation](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/) explicitly supports one Worker calling another without a public URL, while its [HTTP binding documentation](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/http/) specifies invoking `env.BINDING.fetch(request)` from the *calling Worker*. This confirms the technical need for a separate, authenticated ingress/caller between GitHub Actions and the private command Worker; the current synthetic transport callback must not be mistaken for a deployed private connection.

## Critical unresolved runtime connection

GitHub Actions' Node runner cannot directly call a Cloudflare Worker **service binding**: service bindings are available to another Cloudflare Worker. The new command Worker has `workers_dev=false`, version URLs disabled, no custom routes and no public command route. Therefore neither GitHub Actions nor a browser can reach it now. It would be incorrect to wire the injected transport directly to a public URL, expose the signing secret to the PWA, enable `P3_WRITE_ENABLED` or claim this implementation delivers end-to-end publishing.

Before any live command acceptance, select and security-review **one** transport design: (A) a privately gated ingress Worker with Cloudflare Access identity+service binding to the command Worker, or (B) another owner-trusted Cloudflare Worker caller invoked through an explicitly authenticated route/queue. Evaluate free-tier feasibility, Cloudflare Access service-token scope, ingress replay/provenance and routing, audit/rate limiting, and safe management of the shared HMAC secret. Reconcile the fixed logical Request origin with the actual private service-binding URL before activation. Neither architecture has been approved or deployed.

## Required next gates

1. Verify the true GitHub owner ID and App installation identity from authenticated GitHub context; the local ID `778899` used in fixtures is intentionally synthetic.
2. Approve the internal-only caller and network design, not just HMAC signing.
3. Provision a trust-separated signer (the existing encrypted Worker HMAC key alone does not authorize GitHub Actions, does not make an ingress private, and must never appear in PWA/client code).
4. Test the real binding and read-only identity/dry-run behavior first, with all write flags disabled, and separately authorize one synthetic D1 `Accepted` operation before enabling write flags even in the sandbox.
5. Only after this, review sandbox draft PR creation, source-aware candidate validation and PR-head CI. Production merge, deployment and publication remain separately blocked.

Tests prove the pure signer + HMAC gate + native SQLite D1 transaction via injected fake transport, including default-off, valid signed acceptance, replay refusal, wrong owner/repo, bad receipt, sender/receiver HMAC mismatch, ambiguous network failure, and no public fetch. They are **not** a real Cloudflare network or D1 write proof. Current `P3_WRITE_ENABLED` and `P3_COMMAND_BRIDGE_ENABLED` remain `false` on the deployed bridge.
