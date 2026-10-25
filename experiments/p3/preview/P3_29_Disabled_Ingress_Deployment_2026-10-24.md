# FISH118 P3-29 — Hardened disabled ingress Worker: source and deployment preparation

**October 24, 2026 PDT — SOURCE-ONLY IMPLEMENTATION AND PRIVATE READ-ONLY PRE/POSTFLIGHT GUARD COMPLETE; INGRESS NOT DEPLOYED.** P3-28 live Access edge proof [sandbox run #40163736773](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40163736773) passed all 9 tests: anonymous and invalid service token denied, dedicated service token reached inert Hello World. Owner confirmed both URL toggles OFF afterward. The isolated **command bridge** remains independently verified hard-disabled and unrouted. GitHub Apps, D1 mutation and publishing remain prohibited.

## Immutable deployment artifact

`src/p3-disabled-ingress-worker.mjs` is **a different artifact** from `src/p3-access-ingress.mjs` (P3-26 future authenticated command handler). This deployment candidate exports only `fetch` and always returns HTTP 503 with `{"ok":false,"ready":false,"mode":"ingress-disabled"}`, regardless of HTTP method/path, Access headers, env or flags. It imports neither Access JWT verification, HMAC, native D1 acceptance, nor GitHub code; performs no subrequests and reads no privileges. `test/p3-disabled-ingress-worker.test.mjs` verifies all these denial invariants against malicious enabled flags/getters. The exact immutable source commit and Git blob SHA have been pinned in the **private** read-only infrastructure guard; never check out a moving PR HEAD at deploy time.

## Implementation and CI evidence — October 24, 2026 (PDT)

**Immutable source:** exact public source commit `5df060076ca3cd010727fc9162b33bf03c157790`, Git blob `8f28f4e1d610fe549388308223bf3e6aa58af1a7`, path `experiments/p3/preview/src/p3-disabled-ingress-worker.mjs`. This is the standalone static 503 Worker. The separate active ingress modules remain unused. Independently inspected [Fishing Actions run #40164090871](https://github.com/ginosega/fishing/actions/runs/40164090871), job #121081512112, exact source commit: **327/327 tests passed** (80 PWA, 43 broker, 204 P3), including new disabled-ingress P3-G01–G03.

**Private infrastructure:** [private sandbox PR #13](https://github.com/ginosega/fishing-p3-sandbox/pull/13) passed exact-head [Actions run #40164206023](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40164206023), independently verified **53/53 Python guard tests**, then squash-merged to sandbox main `2c766e3e376d13311766e854bd4bf30662212caf`. New manual-only, **read-only** workflow [Fishing P3 disabled ingress preflight](https://github.com/ginosega/fishing-p3-sandbox/actions/workflows/fishing-p3-disabled-ingress.yml) supports only `preflight` and `postflight` modes; it has **no deploy, URL toggle, secret upload, D1 access, or production GitHub publish action**. It checks out the exact canonical source commit and verifies its immutable Git blob. It then reads the exact existing ingress Worker `/settings` and `/subdomain` metadata; both URL settings must be disabled. Before deployment, it requires **zero bindings**; after a future disabled-only deployment, it requires exactly three distinct plain-text `false` flags, no service, D1, HMAC or other binding. Independently reads the existing exact Access app/single Service Auth policy and dedicated service token.

**Owner provisioning needed before running manual preflight:** create an account-owned Cloudflare API token with only **Specified Workers → `fishing-p3-access-ingress-sandbox` → Individual Workers Editor**, not All Workers, and save its generated value in the private repository GitHub Actions secret `P3_INGRESS_WORKER_CLOUDFLARE_TOKEN`. **Do not reuse or change** `P3_WORKER_CLOUDFLARE_TOKEN`, which is individually restricted to the disabled command bridge. No extra D1/secret/Access-edit permission is required; the guard reuses existing `P3_D1_CLOUDFLARE_ACCOUNT_ID` and `P3_ACCESS_READ_TOKEN`. Once stored, owner dispatches private ingress read-only workflow, `main`, mode `preflight`; assistant independently inspects logs and source/route checks before any separate disabled-only deployment approval.

No Cloudflare deployment occurred in P3-29 preparation; both ingress URL switches remain OFF per last owner confirmation. The static Hello World code remains installed in the ingress Worker until an explicitly authorized deployment. Its current code and binding status have not been remotely reverified through the new per-ingress Worker token yet; this is what the preflight will establish, together with the current routing metadata. Do not claim independent remote code byte verification from Worker settings.

## Real preflight reconciliation — October 24, 2026 (PDT)

Owner created a **separate**, ingress-Worker-scoped Cloudflare Account API token (`Individual Workers Editor` only for `fishing-p3-access-ingress-sandbox`), stored it exclusively in the private sandbox Actions secret `P3_INGRESS_WORKER_CLOUDFLARE_TOKEN`, and manually dispatched the read-only `preflight` workflow.

Independently inspected [private GitHub Actions run #40165050989](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40165050989) on sandbox main `2c766e3e376d13311766e854bd4bf30662212caf`, job #121084287196, **completed/success**. The actual logs show:

- All **9 fail-closed P3 ingress guard tests passed**. The deliberately refused deployment mode and simulated postflight text printed *during tests* are not real mutation or proof of a deployed disabled ingress.
- `PASS: Exact immutable source blob; only static 503 ingress handler`: pinned canonical source commit `5df060076ca3cd010727fc9162b33bf03c157790` and Git blob `8f28f4e1d610fe549388308223bf3e6aa58af1a7`.
- `PASS: Exact ingress Worker metadata, expected preflight bindings; Production and Preview URLs disabled`: live metadata confirmed the exact pre-existing Worker has **zero** bindings; neither Production nor Preview URL is enabled.
- `PASS: Exact Access app, hostname, service token and exclusive Service Auth policy`: fresh independent API metadata proof of the exact restricted Access application.
- `PASS: Read-only P3-29 preflight: no Worker deployments, config changes, D1 or GitHub publishing`.

**P3-29 read-only preflight PASSED.** The remote Worker still runs its pre-existing Hello World code until a distinct, *separately approved* hard-disabled deployment. Neither the Worker script's remote bytes nor token's actual deployment permission were proven by this metadata preflight, and no live endpoint test occurred. Do not infer deployment from successful preflight. Both URLs remain OFF as verified by Cloudflare metadata during this run.

**Next distinct gate:** independently review and authorize a one-time, manually confirmed deployment of the precise static 503 ingress source to **only** `fishing-p3-access-ingress-sandbox`, with `workers_dev:false`, `preview_urls:false`, only three plain-text `false` vars, no D1, service binding, or secret, and an immediate independent read-only postflight. Do not reuse previous command Worker incident's deprecated-ID workaround or automatically retry after a partial-success deploy. No active JWT/command ingress code or production application change is in scope.

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

## Approved disabled-only deployment workflow — October 24, 2026 (PDT)

**Owner explicitly approved only the P3-29 hard-disabled ingress deployment** after successful read-only preflight #40165050989. Private sandbox [PR #14](https://github.com/ginosega/fishing-p3-sandbox/pull/14) added an explicit one-shot `deploy-disabled` mode, passed [exact-head Actions CI](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40165265294) with **57/57 Python guard tests**, and was squash-merged into isolated sandbox main `1494e0b0bf66061cd75c6472bda0b128cff58863`. This source-only merge did **not** deploy anything.

The updated manual [P3-29 disabled ingress workflow](https://github.com/ginosega/fishing-p3-sandbox/actions/workflows/fishing-p3-disabled-ingress.yml) has only three choices:
- `preflight` (read-only, empty confirmation);
- `postflight` (read-only, empty confirmation);
- `deploy-disabled` (**requires exact manual confirmation `DEPLOY-DISABLED-P3-INGRESS-ONLY`**; only approved mutating operation).

On `deploy-disabled` it checks out immutable public commit `5df060076ca3cd010727fc9162b33bf03c157790`, checks blob `8f28f4e1d610fe549388308223bf3e6aa58af1a7`, re-verifies the exact existing ingress Worker has **zero bindings**, both Production and Preview URLs OFF, and the restricted Access application/service policy. It stages only the 503 ingress source and a strictly validated `wrangler.json`: fixed target `fishing-p3-access-ingress-sandbox`; `workers_dev:false`; `preview_urls:false`; only `P3_WRITE_ENABLED:false`, `P3_INGRESS_ENABLED:false`, `P3_COMMAND_BRIDGE_ENABLED:false` **as literal strings `"false"`**. No D1, service bindings, signing secrets, routes, assets, cron, queues or GitHub publishing.

Only after these checks does the runner invoke pinned **Wrangler 4.152.0** exactly once with `wrangler deploy --config wrangler.json --no-bundle`. Wrangler's raw logs are withheld to avoid leaking provider output. A zero exit code triggers immediate **read-only** live postflight: exact three plain-text `false` bindings, no extras, both URLs OFF and correct Access app/policy. A nonzero exit, timeout, or failed postflight is **not** a guarantee that code was unchanged; treat it as possible partial success, do not redeploy, and run an independent read-only state reconciliation. Independently rerun manual `postflight` on success to verify remote state. Successful postflight attests deployed settings and reported deploy outcome; it does **not** cryptographically hash the remote script's bytes.

**The owner must dispatch the actual workflow.** The available connected GitHub API actions cannot initiate `workflow_dispatch`. Safe handoff: GitHub Actions → workflow linked above → `Run workflow` → branch `main` → mode `deploy-disabled` → confirmation `DEPLOY-DISABLED-P3-INGRESS-ONLY` → Run exactly once. Both ingress URL toggles stay OFF. After completion, independently inspect logs and postflight before advancing. Original disabled command bridge and production application remain untouched.

## Gate order and rollback

1. **Source review + CI**: full canonical Fishing tests pass; collect immutable source commit/blob. GitHub production `main` remains unchanged; draft PR #263 stays unmerged.
2. **Private sandbox guard**: require owner-only manual preflight; verify the exact pinned source commit/blob, isolated existing Worker identity, both URL toggles OFF, no bindings/routes and the narrow worker-edit token. Explicitly reject unknown binding types, lack of metadata or an unexpected Access app/hostname.
3. **Separate deployment approval**: never deploy just because source CI passes. Use a one-time manually confirmed guarded deployment targeting ONLY the pre-existing ingress Worker; no generic Wrangler script from user input, no D1 or secret upload. Retain recovery/rollback instructions if Wrangler reports success but postflight fails; avoid automatic redeploy.
4. **Independent postflight**: confirm remote binding metadata includes only the three plain-text false flags, no secret, service, D1, queues or routes, and both URLs still OFF. A source hash of the remote script is distinct from binding verification: do not falsely claim deployed byte identity without independently fetching the code or verifying a reliable immutable deployment artifact.
5. **No live activation**: No public request, Access edge test, command acceptance, HMAC, JWKS, owner writes or publishing in P3-29. A future command-capable ingress requires independent review of JWT `common_name`/issuer/AUD, key rotation, fixed outbound service-binding target and the source-only P3-26 modules. Never replace the hard-disabled command Worker merely to prove a transit path.

P3-29 proceeds as a **reviewable source and strictly read-only preflight** first. The owner must explicitly approve the exact deployment step after guard validation.
