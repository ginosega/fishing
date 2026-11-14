# FISH-TODO-118 / WP3 — isolated hosted checkpoint: exact owner approval and execution contract

**State: PROPOSAL — source-only, not approved to provision, deploy, grant credentials or write to GitHub.**
**Reviewed source:** stacked draft PRs #496–#502; #502 exact head `6e2951987f80810c210d80fc938317e038d6bc74`, run [#43629953134](https://github.com/ginosega/fishing/actions/runs/43629953134) `validate-full` and `fishing-merge-ready` PASS, deployment SKIPPED. All these source PRs remain draft/unmerged; protected `main` and public V2 unchanged.

**Governance:** [FISH118 V3 completion contract](https://github.com/ginosega/fishing/blob/governance/project-ops/project-ops/v2/FISH118_V3_COMPLETION_CONTRACT.md) authorizes the WP3 *work package* and a bounded interim hosted checkpoint, **not** Cloudflare provisioning, new secrets, GitHub App permission changes, Worker routes, GitHub mutations or deployment. SEC-001/002/004/005; PUB-002/004/005/007; ARC-003/004/007 all remain applicable. This packet does not request an automatic merge or WP4/WP5/WP6 authorization.

## 1. Proposed dedicated hosted resources (all unverified/not created)

| Purpose | Exact proposed identifier / requirement | Isolation / stop condition |
| --- | --- | --- |
| Worker script | `fishing-v3-wp3-test` | New isolated script, **not** existing `fishing-d6-wp2-test`, D5 owner pilot or public `fishing` |
| Worker origin | `https://fishing-v3-wp3-test.ginosega.workers.dev` | Must be exact origin from #500/#501/#502; no custom public route, no browser input choice |
| Pages project | `fishing-v3-wp3-test` | New separate project; do not overwrite accepted WP2/Stage A Pages |
| Pages base | `https://fishing-v3-wp3-test.pages.dev/fishing/` | Exact same-host read pair only; immutable verified release and manifest required |
| `AUTH_DB` D1 binding | New isolated `fishing-v3-wp3-auth-test` (proposed D1 name) | GitHub OAuth `auth_flows` and hashed `sessions` tables in an **independent database**; do not bind WP2/D5 auth D1 |
| `WP3_DB` D1 binding | New isolated `fishing-v3-wp3-operations-test` (proposed D1 name) | Ten table definitions derived from `D6_WP3_D1_SCHEMA_PLAN`; exact column order/types and both operation-receipt uniqueness indexes; no content database |
| OAuth application | Dedicated GitHub OAuth App or separately approved callback configuration | Exactly `https://fishing-v3-wp3-test.ginosega.workers.dev/auth/callback`; separate client secret, callback/redirect proof before sign-in |
| GitHub App installation | To be independently confirmed, **not inferred from source** | Repository selection **selected**, only repo `ginosega/fishing` (repository numeric ID `1350909744`); owner account numeric ID `265665562`; no sandbox/GitHub Pages retargeting |
| Build/deployment | Immutable source revision and separately verified static build/manifest uploaded to the new Pages project | Same `/fishing/` SW scope; no default-main/public V2 deployment |

The names above are proposed configuration, **not** evidence of their existence, availability or provider approval. If Cloudflare name, GitHub OAuth callback policy or Pages host differs, revise and revalidate exact pins before any cloud step; never silently substitute another origin.

## 2. Trusted server bindings, capability gates and secrets

**New isolated Worker bindings:** `AUTH_DB` and `WP3_DB` (distinct D1 database IDs, not aliases). Server-only, never supplied by request headers/query/body: `D6_ORIGIN`, `D6_OWNER_GITHUB_ID`, `D6_REPOSITORY_ID`, `D6_GITHUB_APP_ID`, `D6_GITHUB_INSTALLATION_ID`, `D6_GITHUB_APP_PRIVATE_KEY`, `D6_OAUTH_CLIENT_ID`, `D6_OAUTH_CLIENT_SECRET`, `D6_CSRF_KEY`, `D6_WP3_MEDIA_TICKET_SECRET`. Require distinct test credentials where appropriate; do not check values, signing key, tokens, D1 IDs or session hashes into source, logs, CI, PR or browser. GitHub app private key and OAuth secret are separately permissioned credentials; no import from the older D5/WP2 sandbox.

**Unconditionally OFF at initial deployment:**
`D6_WP3_RUNTIME_ENABLED`, `D6_WP3_WRITE_ENABLED`, `D6_WP3_MOUNT_ENABLED`, `D6_WP3_ISOLATED_WRITE_PROFILE_ENABLED` and per-step `ownerApproval()/authorizeStep()`; no active provider write without a fresh, separately approved positive gate. This must hold even if other read/owner/OAuth flags are true. Do not route write requests to the Pages proxy.

**Exact read/owner profile pins, only after read-only approval and verified resources:**

```text
D6_PRODUCTION_ENABLED=true
D6_GATEWAY_ENABLED=true
D6_ORIGIN=https://fishing-v3-wp3-test.ginosega.workers.dev
D6_OWNER_GITHUB_ID=265665562
D6_REPOSITORY_ID=1350909744
D6_WP2_STAGING_ENABLED=false
D6_ISOLATED_PAGES_ENABLED=false
D6_WP3_ISOLATED_READ_ENABLED=true
D6_WP3_ISOLATED_PAGES_ENABLED=true
D6_WP3_READ_PROFILE_ENABLED=true
D6_STATIC_ENABLED=true
D6_SESSION_ENABLED=true
D6_OAUTH_ENABLED=true
D6_SOURCE_ENABLED=true
D6_READ_TOKEN_ENABLED=true
D6_SIGNER_ENABLED=true
D6_WP3_ISOLATED_WRITE_PROFILE_ENABLED=false
D6_WP3_RUNTIME_ENABLED=false
D6_WP3_WRITE_ENABLED=false
D6_WP3_MOUNT_ENABLED=false
```

These are **review candidates**, not a deployable `wrangler.toml`, a runnable command, or license to enable all read flags before the matched Pages release/credentials exist. The existing host factory returns only `fetch`; a future separate narrowly reviewed Worker entrypoint must inject the server-side owner approval and per-step authorization callbacks without exposing them as client toggles.

**Permission requirements:** OAuth authenticates the one human owner, **not** repository writes. GitHub App installation needs `contents:write` and `pull_requests:write` (and implicit metadata read) for the single repository only **after separate owner approval**. Each minted short-lived token asks for only `contents:read`, `contents:write` or `pull_requests:write` per verified step. GitHub App `contents:write` itself is *repository-scoped*, **not branch-scoped**; the server's pinned `fish-v3/publish/<uuid>` mutation transport and existing protected-main branch rules are therefore essential, not optional. Do not grant workflow, administration, deployments, secrets, Actions or organization permissions. Verify real app installation/account/repository IDs and granted scopes in server-only preflight and deny on mismatch.

**Operations schema:** Create D1 `auth_flows`/`sessions` tables with the existing AUTH-P0 session contract and `D6_WP3_D1_SCHEMA_PLAN` ten operations tables plus required unique receipt indexes only on these fresh isolated D1 databases. Never apply schema to WP2 or production. Validate PRAGMA table_info/index_list/index_info read-only before unlocking any write gate.

## 3. Engineering blockers before any deployment approval can be executed

This packet deliberately identifies current gaps instead of claiming the environment is ready:

1. **No reviewed deployable WP3 Worker entrypoint yet.** Source-only `createD6ProductionWp3TrustedHostCandidate` is not an installed Worker; an exact-name script/handler, binding contract and routing/security tests must be authored, CI-validated and inspected.
2. **No dedicated WP3 immutable Pages build yet.** Existing `pwa/tools/build.mjs` still has public/WP2 candidate switches; add reviewed WP3 build/release/manifest/reader-origin selection and physical `/fishing/` package/byte verification. Never reuse WP2 release bytes or turn a local build into hosted proof.
3. **No verified hosted resource inventory, OAuth callback registration or fresh D1/auth schema receipts.** Provider existence, unique names, permissions, account scoping and exact IDs must be confirmed at execution time.
4. **Stacked source PRs are still draft and unmerged.** Define an isolated deploy artifact strategy from the exact validated source head that does not merge app `main` or change V2. Re-run required CI if source changes; avoid redundant full CI for unchanged validated artifacts.
5. **Operator authorization implementation and step scope remain unopened.** `ownerApproval` and `authorizeStep` default deny; implement a reviewed server-only authorization mechanism before any provider mutation. Do not represent a static env flag or an authenticated browser request as standing approval for arbitrary steps.
6. **Owner-tested WP3 original media + lost-ack paths not hosted.** Synthetic CI evidence is not real provider recovery proof.

None of these blockers may be waived by broad source CI, a blank hosted page, or a GitHub App 201 response.

## 4. Execution stages and separate approval gates

| Gate | Owner decision required | Permitted work after approval | Positive evidence / stop criteria |
| --- | --- | --- | --- |
| **S0 — Source readiness (NOW)** | Existing standing source-only authorization | Review this packet, author exact Worker entrypoint and WP3 Pages build/host packaging, tests and CI; no service writes | Exact PR head, CI PASS, diff review; release and host artifacts unmounted |
| **H1 — Isolated read-only infrastructure (FUTURE)** | **Explicit** approval of exact Worker, Pages, **two new D1 databases and schemas**, OAuth app/callback, scoped *read-only* App credential/secrets and deployment | Provision isolated resources and deploy with all writer gates OFF | Provider IDs, Worker version, Pages release+manifest+file hashes, AUTH_DB and WP3_DB readiness, status/owner login, anonymous and direct-write denials, no token in browser |
| **H2 — Controlled write privilege (FUTURE)** | **New explicit** approval of GitHub App contents/PR write permissions, server-only secrets/authorizer and *one named synthetic publication exercise* | Enable bounded write gates for the named test window only; no merge to `main`, no public deployment | Valid owner+CSRF, source/recipient exact-main check, D1 Unknown fences, original image/Notes test, independent Git object/ref/PR readback → `VerifiedPr`, disable gates after test |
| **H3 — Failure/recovery acceptance (FUTURE)** | Approve bounded safe fault-injection and PR disposition; do not reuse implicit approval for destructive tests | Reconcile duplicate, simultaneous, stale-source, lost HTTP acknowledgement, partial media/unsafe paths and restored client session; never blindly retry ambiguous provider mutation | Operation IDs/receipts preserved, source and original bytes intact, no false Live; twelve WP3 requirement IDs backed by exact proof and owner acknowledgment |
| **WP4 onward** | Separate later approvals | WP4 verified Save→public Live, WP5 full private RC/Windows Edge/Android, WP6 actual main/cutover | Not part of this WP3 hosted test |

## 5. Mandatory negative probes and abort rules

Before H2, collect dated provider evidence for: anonymous/foreign owner, expired/revoked cookie, wrong `Origin`, cross-site CSRF, invalid/missing intent and method, failed source/release/manifest hash, missing/partial schema or uniqueness index, wrong GitHub App install/repo/scope, isolated/PW2/public host mismatch, direct `POST /api/v3/operations` and `POST /api/v3/media` while gates OFF. Confirm zero WP3 D1 writes and zero GitHub content/PR mutations for denied requests. Preserve immutable source revision and Worker/Pages deployment IDs.

**Stop immediately:** any unexpected `main` update, V2/WP2 changed host/credentials, unverified source/asset bytes, token exposure, missing D1 uniqueness, an ambiguous POST with no reconciled receipt, overly broad GitHub App grant, failed required CI, or missing explicit owner approval. Do not auto-retry unknown writes. Mark `VerifiedPr` only on independent GitHub proof; public `Live` is exclusively WP4/WP6.

## 6. Proposed immediate decision

**For owner review after this source-only document passes CI:** approve or modify proposed resource names, isolated dedicated database names, and a staged H1-first approach. This document is not an authorization request to execute H1 immediately because the two engineering blockers in §3 (Worker entrypoint and dedicated Pages build) remain. Continue S0 source implementation under the approved WP3 work package until exact-head CI and owner decision make H1 safely executable.

**WP3 success is not inferred from S0 or H1.** The governing completion-contract requirement remains a controlled, owner-authorized, real GitHub PR with independent validation of all approved source/media/failure cases and no false Live.
