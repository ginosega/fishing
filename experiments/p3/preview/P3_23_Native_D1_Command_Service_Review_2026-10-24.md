# FISH118 P3-23 — Native D1 command acceptance composition: security and deployment review

**October 24, 2026 — SOURCE-ONLY, NO DEPLOYMENT.** R1–R4 are complete and independently verified in isolated Cloudflare D1. The existing preview Worker remains an anonymous, disabled sentinel (`P3_WRITE_ENABLED=false`). This work does **not** deploy a new Worker route, create GitHub draft PRs, enable publishing or alter production.

## Source-only composition

`src/p3-native-acceptance-service.mjs` wires the previously unit-tested:
- `createP3InternalCommandGate` (HMAC request and owner-scoped command validation, strict timestamp/nonce/route/8 KiB body).
- `createP3D1CommandNonceStore` (native D1 single-statement unique replay nonce).
- `createD1OperationStore` (native `DB.batch()` atomic Accepted+snapshot+audit).

It requires a **trusted, explicitly provisioned numeric `P3_OWNER_GITHUB_ID`**, an exact isolated `APP_ORIGIN`, and a real `DB.prepare`/native `DB.batch` binding. The owner ID must be verified through an authenticated owner identity before any deployment; do **not** use any test or assumed ID. The three independent publication gates remain `P3_WRITE_ENABLED`, `P3_COMMAND_BRIDGE_ENABLED` and trusted operator opt-in, all disabled by default. No public route imports the new service. No GitHub tokens, branches, merges, deployments, generic SQL or read/write endpoints are exported.

The nonce ledger insertion and Accepted+snapshot batch are **two separate durable atomic operations**. If a request fails after consuming a nonce, the caller must sign a *fresh* nonce and retry with the **same server-bound idempotency key**. A repeated nonce is never accepted, even across Worker instances. Operation history and audit must be reconciled rather than assuming a client timeout means no write.

## Required review before any live activation

1. **Caller identity:** the eventual Node runner is trusted, exclusively the private sandbox workflow or another authenticated owner-side service. No PWA/client/browser must receive the HMAC shared secret or an App token; a public `workers.dev` hostname is **not** an authentication boundary. Reject unrelated origins/methods and never expose a generic SQL or admin route. Review network abuse and body-size limits.
2. **Secret lifecycle:** generate independent high-entropy `P3_BRIDGE_HMAC_SECRET` only under a future approved setup; store it in the private GitHub Actions runner secret and isolated Cloudflare Worker secret, not source, PR, logs, chat or frontend; review rotation/revocation. Current three D1 secrets are **not** an HMAC signer and must not be repurposed.
3. **D1 validation:** live test must prove exact bound remote database UUID, R4 ledger, correct owner ID, valid one-time nonce, atomic operation and snapshot/audit rows, and replay refusal while ensuring no live/published content. Existing R4 migration and previous R3/R4 safety workflows must **not** be rerun.
4. **Worker rollout:** a separately reviewed (preferably **separate internal-only Worker/service binding**) design must avoid opening new privileged public routes on the existing sentinel unexpectedly. Running HMAC-only through an internet-facing Worker requires a thorough threat model and independent owner approval. Maintain a disabled default and an explicit opt-in, with reversible code/flag rollout not conflated with database rollback.
5. **GitHub writes:** accepting an operation is **not** permission to call `createDraftStep`. A second trusted runner proof must demonstrate full source-aware content validation, correct GitHub App installation id and least-privilege sandbox-only tokens, lease idempotency and exact PR head CI. The private GitHub Free sandbox cannot safely auto-merge; keep all PRs draft/unmerged until a separate review.
6. **Production:** public `ginosega/fishing` `main`, Pages, P1 AUTH-P0 experiment, original sandbox synthetic PR #1, and live app user experience are all unchanged. No production cutover authorization.

## Source test closeout — October 24, 2026

Full repository [GitHub Actions run #40127405968](https://github.com/ginosega/fishing/actions/runs/40127405968) on source commit `3553ff439c51627d3fa0bf922539c0bafd4d6d1d` **completed/success**. The actual logs establish **299 of 299 tests passed**: 80 PWA + 43 broker + 176 P3 preview. New P3-S01…S08 tests passed, including a real local SQLite D1 batch, source-only operation state, a persistent nonce ledger, replay across a new service instance, an idempotent retry, invalid owner/origin, missing migration and no import into the deployed Worker sentinel. This is **not** a remote write proof and is **not** permission to deploy or publish.

## Evidence and next decision

`test/p3-native-acceptance-service.test.mjs` runs the service against actual local in-memory SQLite migrations 0001–0004 and the native `DB.batch()` fixture, covering disabled state, valid signed accepted snapshot, replay across instances, idempotent retry, missing R4 fail-closed, forged signer/action, wrong owner config, and absence of a Worker route. **Source-only CI must pass before proposing live activation.**

**Recommended next gate:** finish reviewing the service composition and threat model, then request **separate owner approval** for isolated Worker deployment and trusted signer secret setup. Do not deploy or switch `P3_WRITE_ENABLED` under this source-only review.
