# FISH118 P3-29 — Hardened disabled ingress Worker: source and deployment preparation

**October 24, 2026 PDT — SOURCE ONLY; NOT DEPLOYED.** P3-28 live Access edge proof [sandbox run #40163736773](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40163736773) passed all 9 tests: anonymous and invalid service token denied, dedicated service token reached inert Hello World. Owner confirmed both URL toggles OFF afterward. The isolated **command bridge** remains independently verified hard-disabled and unrouted. GitHub Apps, D1 mutation and publishing remain prohibited.

## Immutable deployment artifact

`src/p3-disabled-ingress-worker.mjs` is **a different artifact** from `src/p3-access-ingress.mjs` (P3-26 future authenticated command handler). This deployment candidate exports only `fetch` and always returns HTTP 503 with `{"ok":false,"ready":false,"mode":"ingress-disabled"}`, regardless of HTTP method/path, Access headers, env or flags. It imports neither Access JWT verification, HMAC, native D1 acceptance, nor GitHub code; performs no subrequests and reads no privileges. `test/p3-disabled-ingress-worker.test.mjs` verifies all these denial invariants against malicious enabled flags/getters. The content-only source commit and its Git blob SHA are to be independently pinned in the **private** infrastructure workflow; never check out a moving PR HEAD at deploy time.

## Deployment safety contract

Pre-existing Worker: `fishing-p3-access-ingress-sandbox`, no other Worker. It already exists as an isolated Cloudflare Hello World starter per owner screenshots, both Production/Preview URLs OFF, with no custom domain, route, cron, D1, service or other binding. Guarded Wrangler JSON config for this *disabled-only stage* must contain:

```json
{
  "name": "fishing-p3-access-ingress-sandbox",
  "main": "./p3-disabled-ingress-worker.mjs",
  "compatibility_date": "2026-10-24",
  "workers_dev": false,
  "preview_urls": false,
  "vars": {
    "P3_WRITE_ENABLED": "false",
    "P3_INGRESS_ENABLED": "false",
    "P3_COMMAND_BRIDGE_ENABLED": "false"
  }
}
```

No `services`, `d1_databases`, `routes`, `kv_namespaces`, secrets, custom domains, assets, queue consumers, or additional event handlers. Do not reuse the command Worker's per-Worker Editor token; provision a **different individual Worker Editor token** scoped only to `fishing-p3-access-ingress-sandbox` if a future guarded deploy is separately approved. Reuse existing Cloudflare account ID and existing Access app read-only metadata token to verify the exact Access app/hostname/service-token policy. Production routing must remain OFF throughout deployment.

Cloudflare documentation warns that redeploying a Worker may re-enable `workers.dev` if `workers_dev:false` is absent. Preview URLs must also be explicitly disabled. Source must remain hard-disabled if a provider configuration silently changes. Ref: https://developers.cloudflare.com/workers/configuration/routing/workers-dev/ and https://developers.cloudflare.com/workers/wrangler/configuration/.

## Gate order and rollback

1. **Source review + CI**: full canonical Fishing tests pass; collect immutable source commit/blob. GitHub production `main` remains unchanged; draft PR #263 stays unmerged.
2. **Private sandbox guard**: require owner-only manual preflight; verify the exact pinned source commit/blob, isolated existing Worker identity, both URL toggles OFF, no bindings/routes and the narrow worker-edit token. Explicitly reject unknown binding types, lack of metadata or an unexpected Access app/hostname.
3. **Separate deployment approval**: never deploy just because source CI passes. Use a one-time manually confirmed guarded deployment targeting ONLY the pre-existing ingress Worker; no generic Wrangler script from user input, no D1 or secret upload. Retain recovery/rollback instructions if Wrangler reports success but postflight fails; avoid automatic redeploy.
4. **Independent postflight**: confirm remote binding metadata includes only the three plain-text false flags, no secret, service, D1, queues or routes, and both URLs still OFF. A source hash of the remote script is distinct from binding verification: do not falsely claim deployed byte identity without independently fetching the code or verifying a reliable immutable deployment artifact.
5. **No live activation**: No public request, Access edge test, command acceptance, HMAC, JWKS, owner writes or publishing in P3-29. A future command-capable ingress requires independent review of JWT `common_name`/issuer/AUD, key rotation, fixed outbound service-binding target and the source-only P3-26 modules. Never replace the hard-disabled command Worker merely to prove a transit path.

P3-29 proceeds as a **reviewable source and strictly read-only preflight** first. The owner must explicitly approve the exact deployment step after guard validation.
