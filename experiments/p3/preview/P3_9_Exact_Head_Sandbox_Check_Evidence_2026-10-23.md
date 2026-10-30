# FISH118 P3-9 — Exact-head private-sandbox CI evidence (source-only)

**Date:** October 23, 2026. **Status:** Source-only observer and adversarial tests implemented on draft PR #263. **No App permission expansion, sandbox merge, runner deployment, Cloudflare change, production modification or v3 publishing enablement.**

## Boundary and source authority

Owner retained GitHub Free. Public production `ginosega/fishing` is protected by [active ruleset #25742040](https://github.com/ginosega/fishing/rules/25742040), pinned to `fishing-merge-ready` from GitHub Actions (ID 15368), PR-only, no bypass, strict base, force-push and deletion restrictions. Production `main` remained at `4a1a8c44317b56a4d47e818db9cd2b5587a966d8` with hosted release `504d615b2bef361da06d655ee621d43a`. The **private** sandbox remains unprotected, is used only with synthetic fixture data and does not authorize automatic merges.

The isolated sandbox's `main` is `e37db3b18bd9948bf4453d7f885f868e830a9a9a`. Owner-connector-created [draft smoke PR #1](https://github.com/ginosega/fishing-p3-sandbox/pull/1) is still open and unmerged, with head `7e39c018081e9677b33c3bcab7ebe80b44d924f8`. It passed the real sandbox [GitHub Actions workflow #39976510965](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/39976510965) after owner-approved workflow installation.

## Implementation

[Source-only `sandbox-check-observer.mjs`](src/sandbox-check-observer.mjs) exports `createSandboxCheckObserver()` with a strict, initially **disabled** observer. Its only public method is `observe()`. It never creates refs, PRs, merges, deployments or writes to D1.

The eventual trusted server must supply repository ID **1430581407**, PR number, immutable expected head SHA, expected main base SHA and expected branch from **server-owned durable receipt data**, not a browser body. A separately approved token issuer must issue an App installation token restricted to this repository with exactly `contents:read`, `pull_requests:read` and **`checks:read`**. Write scopes are rejected.

All GitHub requests are fixed-repository **GET** only. The observer verifies the repository ID/name/visibility; reads the current main SHA and exact PR metadata; queries check runs at the exact immutable PR head and rejects missing/ambiguous/truncated results; requires exactly one `validate-sandbox-head` check from GitHub Actions App ID **15368**, with matching head SHA and **completed/success** (not neutral/skipped). It re-reads current main and PR after the check to detect moved main/head/base. Only then does it return a frozen, bounded evidence record with `readyForManualReview:true`, **`canMerge:false`, `canDeploy:false`**.

Adversarial [source tests](test/sandbox-check-observer.test.mjs) use only mocked, read-only GitHub HTTP and token issuers; they test wrong repository/branch/head/base, enabled-state, missing read scope, forbidden write scopes, replay/movement, wrong Actions App, skipped/neutral/failing/missing/duplicate/truncated check runs, GitHub HTTP 403, network errors, invalid JSON and lack of any merge/deploy action. No live owner secrets are used.

## Independently observed read-only sandbox evidence

The existing **ChatGPT owner GitHub connector** could read the private sandbox check-run endpoint. That is **not** evidence that the dedicated P3 publishing GitHub App can read checks. The read-only query returned:

- `GET repo`: exact private repo ID `1430581407`.
- `GET main`: `e37db3b18bd9948bf4453d7f885f868e830a9a9a`.
- `GET pull/1`: draft and open, exact same-repo head `7e39c018081e9677b33c3bcab7ebe80b44d924f8`, correct base, unchanged.
- `GET check-runs` for that head: `total_count:1`; check-run ID `120492395098`, name `validate-sandbox-head`, Actions App `15368`, exact head, **completed/success**.

This confirms the underlying evidence shape and live GitHub read endpoint **through the owner connection**, not through the unpermissioned publisher App or a deployed runner.

## Boundaries and next gate

The dedicated `fishing-p3-sandbox-publisher` GitHub App is currently reported installed only for private sandbox content and PR access **without Checks:read**. Adding Checks:read to its installation or requesting a token with that grant requires **a separate explicit owner permission review**. This source-only observer remains disabled and unintegrated pending that approval. The subsequent trusted Node/Cloudflare handoff, D1 migration 0002, durable check poll/recovery, first **App-created** sandbox PR and any merge are distinct live-write or operational gates. No automatic merge in private sandbox is permitted while branch enforcement is unavailable. The public production ruleset is already independently verified; its presence does not grant v3 production publishing authorization.

**Work mode:** Not required for this source-only GitHub repository work, which is supported by the connected GitHub interface. It could be considered only if a future GUI-only administration step cannot be done in Chat and the owner prefers an interactive browser workflow; no mode switch was made.
