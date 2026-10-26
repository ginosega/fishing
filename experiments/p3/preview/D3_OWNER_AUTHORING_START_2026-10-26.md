# FISH118 D3 — owner authoring implementation start (2026-10-26)

**Status:** IN PROGRESS, source-only UI/service contract implemented and tested; **no V3 UI enabled and no canonical public publisher enabled**. This checkpoint follows the proven [D2 sandbox Live outcome](D2_SANDBOX_VERIFIED_CLOSEOUT_2026-10-26.md). It does not authorize public `ginosega/fishing` writes or an unreviewed production v3 cutover.

## Controlling approval and fixed outcome

D3 is the **third of six finite V3 deliverables** in the [approved delivery reset](FISH118_V3_Finite_Delivery_Reset_2026-10-25.md), guided by [signed requirements](../../pwa/docs/Fishing_Companion_v3_Requirements.md), [technical design](../../pwa/docs/Fishing_Companion_v3_Technical_Design.md), [approved UX](../../pwa/docs/Fishing_Companion_v3_UX_Review.md), and [original staged plan](../../pwa/docs/Fishing_Companion_v3_Implementation_Plan.md). Preserve exactly one `Save and Publish`, no per-edit signature or confirmation ceremony; discrete `Sign in with GitHub` only in Connection Status, existing owner session automatically recognized, anonymous read-only by default.

**D3 acceptance requires:** owner sign-in and session restoration; real Gear and KB Add/Edit on intended production origin targeting **test-only sandbox repo**, one Save and Publish per edit; durable `Accepted` receipt; Leave/return status tracking; genuine CI/merged SHA/hosted identity; unauthorized and offline denial; conflict, expired session and ambiguous-save safety; Android installed-PWA authentication return. No public-main content changes until a separate consequential authorization.

## Immediate follow-on to completed D2

1. **Park the one-use sandbox D2 scheduler** once the final D1 `Live` record is confirmed by `tools/prepare-d2-parked-worker.ps1`. Operator deploys the resulting ignored `wrangler.d2-parked.local.jsonc` and verifies D2 flags all false, no Cron. Preserve first-party auth/Pages proxy; do not delete verified D1/audit records or remove encrypted secrets as a side effect.
2. **D3 source-only client contract** introduced in `src/d3-authoring-client.mjs`: opt-in only, same-HTTPS-origin owner `/session` call, session-bound CSRF, no GitHub tokens in browser, stable caller-provided idempotency key, server-supplied durable accepted operation ID, GET status, distinct sandbox `Live` vs public canonical `Live`, fail-closed offline, media deferred to D4, CSRF/session invalidation on 401/403. Tests `test/d3-authoring-client.test.mjs` cover these boundaries.
3. **Service expansion required before live D3 UI:** D2 accepts only the fixed `gear/p3-test-rod` text edit in private sandbox. A real D3 editor needs a validated, allowlisted set of **Gear and KB add/edit** operations and representative sandbox fixtures, not a general write to `ginosega/fishing`. Extend server-side canonical source validation, source conflict handling, status API, D1 snapshot and operation orchestration without introducing an unsafe fixture bypass. D4 will separately handle media binary staging.
4. **Owner UI integration required:** source-port `pwa/src/editor.mjs` Gear/KB editor and `pwa/src/ui.mjs` Connection Status to the authenticated V3 release shell, keeping v2 deployed and unchanged until a reviewed V3 runtime Full Application Release. Anonymous Add/Edit controls must be hidden; owner controls appear only after confirmed `/session`. Replace the user-facing Copy Changes flow only **in the gated V3 experience**; do not strand v2 users while V3 is incomplete.
5. **Lifecycle/status:** only navigate away on durable `Accepted`; recover operation/status after navigation and reload, resist double submit with stable key, preserve dirty form on network uncertainty, show Conflict/Failed/Unknown truthfully and never label test-only sandbox `Live` as public release.
6. **Real acceptance and cutover:** test on Windows and installed Android in the agreed same-origin environment; test unauthorized visitors, session revoke/expiry, offline status, reentered PWA. Preserve source/byte integrity and existing public v2 rollback. Production `main` writes and full V3 launch remain separately gated.

## Current architecture constraints

- Server is the existing Cloudflare gateway `fishing-auth-p0-test`, not a second preview site. Its two D1 bindings keep AUTH and operation data separate. `ginosega.github.io/fishing/` remains the original public PWA until final approved cutover.
- GitHub App PEM and OAuth secret stay in encrypted Worker bindings; never copy secrets to source, tests, browser, release files or chat.
- PR #263 is **experimental, draft and unmerged**. Do not merge it as a unit; reviewed source-aware port only. AUTH-P0 draft PR #262 and unrelated PR #268 must be respected.
- D2 first sandbox proof had one guarded human reconciliation after a successful remote merge and lost D1 receipt; future production reliability should include safe read-only unknown-result reconciliation, not a blind GitHub retry.
- If UI code requires adjusting an approved security or product behavior, record the precise variance before enabling it; no extra per-edit approval is necessary for normal Save.

**Next deliverable after D3:** D4 media and Catch authoring. This note reports technical work and remaining acceptance requirements, not a D3 release.

## D3 source implementation checkpoint — after D2 Worker shutdown

**Verified foundation now implemented on the existing draft PR #263:**

- `src/d3-publication-lifecycle.mjs` + unit tests hold the immutable submitted package and original idempotency key on uncertain network outcomes, prevent double POSTs, and require a **deliberate same-key, same-payload** retry rather than silent background retries. Store only the nonsecret operation ID for post-navigation authenticated status restoration; no package, owner cookie, CSRF, GitHub credential or idempotency key goes into storage. Source statuses are represented without false public Live claims.
- Existing `pwa/src/editor.mjs` now accepts an **optional injected `publishChange` callback**. Only that opted-in V3 path uses Save and Publish, disables controls after server Accepted, protects dirty drafts on uncertain save, and surfaces a durable operation ID. In plain V2 mode the original Prepare Changes / Copy Changes experience remains unchanged. D3 direct media changes are visibly unavailable until D4.
- Existing `pwa/src/ui.mjs` treats V3-mode owner authorization as an **opt-in presentation gate**: it hides anonymous Add/Edit links and denies direct editor URLs, while preserving the V2 UI for the public app. The backend remains the true authorization boundary; browser flags never authorize a write.
- `src/d3-authoring-client.mjs` maintains exact same-origin owner session+CSRF operations/status contract. Tests cover fake/malformed receipts, offline/unauthorized access, and honest sandbox `Live` labeling.
- `src/d3-trusted-gear-kb-candidate.mjs` and `test/d3-trusted-gear-kb-candidate.test.mjs` add a **source-only trusted planner** for private-sandbox Gear edits and KB add/edit with canonical schema checks, exact owner/repo guard, reviewed source-aware merge semantics, safe Markdown resource paths and links, conflict rejection, and atomic record+Markdown proposed writes. The loader is a server-injected dependency; real immutable GitHub tree/ref reads, D1 operation dispatch, generic PR adaptation and hosted D3 verification remain unwired/default-off.
- Regression tests `pwa/test/p3-v3-editor-ui-gates.test.mjs`, `test/d3-publication-lifecycle.test.mjs`, and `test/d3-authoring-client.test.mjs` run in the isolated CI lane.

**Not complete:** No runtime `ctx.v3` activation in `pwa/src/app.mjs`; no real Connection Status-only sign-in controls or session restoration in a compiled V3 Pages release; no *routed* server-side Gear/KB generalization beyond D2's one test fixture (the new D3 source-only planner is not yet integrated); no D3 hosted integration/Android acceptance. Source-only feature gates do **not** constitute delivered D3. Next implement restricted Gear/KB fixture-backed source-aware server validation, then same-origin owner/session and status UI against actual sandbox bytes, without changing public canonical content or introducing a duplicate preview host.


## D3 continuation after October 26 full-chat restoration — source-only checkpoint

After restoring public `main` `0c7d70e280d44f3ec484d427b6888397ffcd621b`, existing D2 completion evidence, private-sandbox `main` `89be79a9c933dd36bd909edd585091232831c835` and exact PR #263, D3 development advanced on **this same unmerged draft branch** without enabling the parked D2 Worker.

- `src/d3-sandbox-snapshot-loader.mjs` performs sandbox-ID-pinned read-only GitHub App access, immutable `main`/commit/tree/blob verification, full canonical Gear/KB/Catches JSON loading, known source/blob inventories, referenced Markdown reading and size/conflict checks. It is designed to inject into the earlier trusted Gear/KB candidate planner, not to expose GitHub credentials in the browser.
- `src/d3-sandbox-gear-kb-pr.mjs` adds a separate **default-off** sandbox-only multi-file Gear/KB draft-PR writer with canonical path allowlists, exact base/head checks, write-token scope, Git blob verification and durable branch receipt recovery. It is **not** the live D2 fixture PR adapter and has no standalone authority to merge, publish or activate a Cloudflare Worker.
- `src/d3-guarded-operations-api.mjs` and `src/d3-sandbox-operation-runner.mjs` provide default-off Gear/KB accepted-operation and D1 lifecycle contracts. The runner retains the D2 merge-attempt write-ahead barrier, exact-head CI evidence and explicit hosted-byte verification before sandbox `Live`. They are not registered in a production gateway or Cron.
- `pwa/src/v3-connection.mjs` adds a gated owner-only Connection Status controller/dialog panel: valid-session discovery, discreet GitHub sign-in, Sign out and durable sandbox publication-state restoration. `pwa/src/ui.mjs` instantiates it **only when a separate V3 integration supplies `ctx.v3.enabled`, authenticated session and publication lifecycle**. `pwa/src/app.mjs` and the real public V2 PWA still do not activate V3. `src/d3-authoring-client.mjs` now supports the existing same-origin first-party sign-out endpoint and clears cached authority even on ambiguous sign-out.
- Isolated unit/security tests were added for immutable source loading, trusted source-planning, draft PR validation, owner Connection Status, sign-out uncertainty, guarded operation acceptance and state transitions. The exact-head isolated GitHub [run #485](https://github.com/ginosega/fishing/actions/runs/40356889229) **PASSED** at commit `ef6a20dfea48f128c8f658fe3ec1c0757d1a9480`. This is a **source-only CI success**, not real D3 end-to-end acceptance or deployment.

**Remaining D3 work:** wire the trusted D3 source, guarded API, real sandbox PR/check/merge runner, multi-file hosted-byte verifier and owner auth/Connection Status into one gated production-origin Cloudflare service with secure secrets, D1 leases, default-off rollout and audited rollback. Verify real Gear and KB Add/Edit on the private sandbox, recover accepted/uncertain operations, and perform Windows + Android installed-PWA authentication/editor tests. The D2 parked Worker must remain off and the completed D2 operation untouched. No public-main write, experimental wholesale merge, unverified `Live` claim or final V3 cutover is authorized.


## D3 integrated default-off source checkpoint — October 26, 2026

**Status: source-composed and isolated CI validated; NOT deployed or D3 accepted.** All current work remains in draft FISH118 PR #263, not canonical production main.

- **Owner editor coherence:** the D3 owner sandbox source service/client loads authenticated, bounded private Gear/KB/Catches/Markdown and exact immutable sandbox source revision. An isolated opt-in owner shell and gated PWA editor use that source. Public V2 entrypoint is unchanged; no browser URL, fragment or local-storage setting activates this feature.
- **Lost-202 recovery:** D1 now provides read-only, owner/repository-bound receipt recovery, proving the original idempotency key, canonical payload and stored hash before any new source validation. No second operation or blind retry.
- **Sandbox PR and runner:** default-off trusted snapshot, Gear/KB candidate, scoped draft PR, exact-head CI, ordinary protected merge and durable D1 lifecycle are composed in the D3 coordinator and Worker. The prior D2 merge-attempt barrier remains in place.
- **Multi-file hosted verification:** default-off isolated test route checks HMAC or owner authentication and returns merged sandbox Git blobs; the verifier compares actual hosted JSON and Markdown bytes with the exact private merge commit. Its synthetic sandbox digest is NOT a public Pages release identity.
- **Secret boundary:** D3 has separately named encrypted GitHub App bindings and immutable private sandbox repo ID 1430581407. No token or private key is exposed to browser source/assets. The parked D2 Worker, Cron, data and completed receipt are untouched.
- **Regression and bundling:** negative auth/replay/conflict, source integrity, PR receipt, CI/merge, HMAC, hosted-byte and disabled Worker tests run in isolated CI; D3 gateway, owner shell, coordinator and Worker are separately bundled. Source-only success is not end-to-end D3 acceptance.

**Remaining D3 acceptance:** deploy the *gated* D3 service only after live provider/security review and a separately scoped consequential authorization; verify first real sandbox Gear and KB Add/Edit with D1 Accepted, GitHub PR/check/normal merge and actual hosted multi-file bytes; retest anonymous/foreign owner, expiry, conflict, lost acknowledgement, offline, reload, Windows and installed Android PWA OAuth. Preserve public canonical data, no second preview website, no unapproved final production cutover, and no extra per-save human signature.

**Next review:** inspect Cloudflare host/routing, App installation grants, service-worker cache and secret bindings before any D3 runtime activation. This does NOT reopen D2 or authorize public-main writes. Continue finite D1–D6 delivery.


## D3 read-only live-readiness audit — October 26, 2026

**Result: NOT READY for privileged activation; no live changes made.** Current PR #263 source CI #520 passed at head `e430b3c5bdd038ea41ad7582278bc68ad5399890`. Public main remained `0c7d70e280d44f3ec484d427b6888397ffcd621b`, private-sandbox main `89be79a9c933dd36bd909edd585091232831c835`. The last independently verified deployed D2 Worker is still the parked version recorded above, not a D3 runtime.

Read-only GitHub API checks: the sandbox is private, repository ID 1430581407, with main containing the three canonical JSON files and one KB narrative fixture. Its free-plan rulesets endpoint returns HTTP 403 requiring a paid account, and the branch-protection endpoint is unavailable to the connected integration; do not assume server-side private branch protection. The public production ruleset 25742040 still requires normal PR, exact `fishing-merge-ready` check from GitHub Actions App 15368, zero ordinary approvals, no non-fast-forward/deletion. Those public-main rules are not a license for D3 writes.

**Actionable source blockers before deployment:**
1. The standalone P0 auth feasibility homepage and `test-client.js`/`test.css` are still delegated by the D3 gateway at `/`; these routes belong only to P0 feasibility, not the approved V3 sign-in experience. Restrict D3 to the approved OAuth callback/start and session routes plus /fishing/.
2. The Connection Status GitHub link currently uses `/auth/start` without the return parameter; the P0 OAuth handler then returns the owner to `/`, instead of `/fishing/`. Fix the link to select the allowed first-party `return=/fishing/` and add an installed-PWA callback test.
3. The opt-in D3 owner shell is built/tested but is not referenced by the public V2 entrypoint; no separately hosted **same-origin, test-only pilot entry artifact** and matching restricted route are present. Do not enable a writer based on source-only unit tests that never exercise an actual editor.
4. Inspect owner session revocation, logout while editing, stale base/conflict, media rejection, D1 operation ownership, and verified two-file hosted path behavior on the real intended origin before accepting the feature.
5. GitHub App's *live* selected installation and effective contents-write/pull-request-write/checks-read grants, Worker encrypted-secret **names/types** (not values), current Cloudflare deployment ID, D1 DB binding names, Cron schedule and domain/route configuration are **not independently visible** through the available account tools. Obtain redacted read-only inventory from Cloudflare dashboard/Wrangler before staging. Never reveal PEM, OAuth/CSRF/probe values, D1 UUIDs, recovery bookmark or tokens in a shared transcript.

**Safe inventory (owner local terminal only, no mutation):** `npx.cmd wrangler deployments status --name fishing-auth-p0-test`; `npx.cmd wrangler secret list --name fishing-auth-p0-test` (show names and types, never secret values); inspect Cloudflare Workers dashboard Domains & Routes, Triggers, and Settings > Variables and Secrets for flags/types. Confirm the final parked D2 version and no Cron. No `deploy`, `secret put`, D1 `execute`, GitHub writes or production cutover are part of this audit.

**Gate:** resolve the product entrypoint/OAuth route mismatches and record live provider inventory, then obtain one specifically scoped authorization for new D3 privileged binding/activation and first isolated Gear/KB sandbox writes. No new P3 checkpoints; stay within D3.


## D3 parked-Worker live inventory and OAuth source correction

**Owner-supplied live Cloudflare evidence (October 26):**

- Wrangler 4.153.0 `deployments status --name fishing-auth-p0-test`: the live Worker is **version 82b678b2-b024-4428-922c-d2363f2bcbc2**, created 2026-10-26 15:08:32 UTC. This matches the deliberate final D2 parked disposition; it is not the source-only D3 Worker.
- Domains screenshot: the exact intended HTTPS Worker URL `fishing-auth-p0-test.ginosega.workers.dev` is enabled; preview URLs are OFF; no custom domains or routes. Anonymous access to the Worker URL is intended for publicly readable V2 pages but must never enable D3 owner write APIs without a session.
- Trigger-events screenshot: no Cron triggers, queue consumers, or email routing events. D2 is not scheduled.
- Wrangler `secret list` confirms encrypted secret names `D2_CSRF_KEY`, `D2_GITHUB_APP_PRIVATE_KEY`, `D2_HOST_PROBE_KEY`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `OWNER_GITHUB_ID`. These outputs do not verify underlying values. Separately named D3 signing/HMAC secrets are not currently listed, and must not be assumed provisioned.
- **Outstanding redacted/provider inventory**: Cloudflare **Settings → Bindings** (D1 DB bindings, OFF feature flags, variable vs encrypted secret types) and current GitHub App selected installation/effective repo permissions. Do not expose secret contents or D1 UUIDs.

**Source fixes on draft PR #263, still not deployed:**

- The GitHub sign-in anchor inside Connection Status now uses `/auth/start?return=%2Ffishing%2F`. AUTH-P0 already accepts that exact return destination and completes OAuth with a `/fishing/` redirect instead of the retired test homepage.
- D3 gateway only forwards approved `/auth/start`, `/auth/callback`, `/session/signout`, `/session/revoke-all` routes. Old P0 test homepage `/` and test assets `/test-client.js` and `/test.css` now return 404 in the source candidate. Actual V2 pages remain proxied by `/fishing/`.
- Regression assertions were added for the owner sign-in URL and legacy test-route denial. Isolated source CI #525 completed **success**; no Cloudflare deployment or actual D3 GitHub write resulted from these changes.

**Next stage:** review redacted Bindings evidence, finish gated pilot entrypoint and Cloudflare deploy configuration in source, then obtain a distinctly scoped runtime-activation approval. Do not silently enable D3, recreate the D2 Cron, run D1 migrations, merge PR #263, or modify public canonical main.


## D3 owner pilot entrypoint source checkpoint — October 26, 2026

**Owner's verified Cloudflare Bindings screenshot:** the live `fishing-auth-p0-test` production Worker has exactly the two expected D1 bindings `DB → fishing-auth-p0` and `OPERATIONS_DB → fishing-p3-sandbox`. No binding names or databases need modification. Earlier live inventory shows production Workers.dev on, preview off, no custom domains/routes, zero Cron, zero queue consumers and still parked D2 version `82b678b2-b024-4428-922c-d2363f2bcbc2`. The screenshot does not display plaintext environment variables or flags; those are not independently reverified by this evidence.

**Additional source-only work:**

- `pwa/src/ui.mjs` now uses the immutable private sandbox file inventory when validating Markdown references in opted-in owner mode. Public V2 inventory remains unchanged in ordinary mode.
- The new `d3-owner-pilot-entry.mjs` verifies the public V2 `release.json` manifest SHA-256, base, schema and CSS file before loading the separate owner-only test shell. Its Gear/KB source stays the private authenticated sandbox, not the public V2 release.
- `d3-owner-pilot-page.mjs` is a distinct test-only HTML document (not an injected rewrite of canonical `/fishing/`); `d3-owner-pilot-main.mjs` supplies a separately compiled browser entry. The test page is visibly marked as a private sandbox.
- `d3-owner-pilot-host.mjs` can serve the private pilot HTML/JS only after a freshly verified AUTH-P0 owner cookie, exact HTTPS origin, no query/bearer, source feature gate and exact pinned JS bundle SHA-256. The route uses no-store, noindex and restrictive CSP. Its future pilot bundle provider must supply exact bytes; missing or altered bytes fail closed.
- `d3-gated-auth-gateway.mjs` now recognizes `/__d3_pilot__/` and `/__d3_pilot__/pilot.js` only when `D3_PILOT_ENABLED=true`. The source-only main Worker does **not** supply `readPilotBundle` and has no live pilot asset binding; therefore there is still **no available test UI or new deployed endpoint**.
- `wrangler.d3-production-origin.example.jsonc` is a hard-OFF, no-Cron, placeholder-ID source template tied to the existing Worker and two existing D1 database names. It is intentionally NOT an executable deployment configuration. Do not install it, enable any D3 key/flags, or run remote D1 migrations based only on source tests.

**Remaining before one operator-approved live D3 pilot:** choose a secure same-origin, Worker-first distribution path for the compiled private pilot bundle (no Cloudflare static-asset bypass), pin SHA-256 and verify permission gates; review the future Wrangler local config's exact existing D1 UUIDs in private and encrypted secret names/types; confirm the selected GitHub App still has required effective read/write permissions; preserve the parked D2 rollback version. Only then authorize a controlled hard-OFF deployment, followed by separately authorized D3 owner read and sandbox writes/CI/hosted proof. The public V2 entrypoint and canonical repository remain unmodified.
