# Fishing Companion V3 — P3-29 New Chat Handoff

**Checkpoint:** October 24, 2026 PDT (GitHub Action log timestamps October 25 UTC). **P3-29 is CLOSED.** The hard-disabled ingress was deployed, immediate and separately dispatched read-only postflights passed, and its deployment workflow was locked back to GET-only verification. This is now only a supplemental P3 evidence note; the official next-chat input is the ENTIRE five-file canonical bootstrap.

## Official full new-chat transfer — completed

The owner reaffirmed the standard process: update all five root Markdown records and then copy the **complete** Bootstrap Prompt into the new chat. [Public docs-only PR #269](https://github.com/ginosega/fishing/pull/269) successfully merged to production-source main commit `587b978118df64cc9ec584375c458fa2b10fecfa`, **without triggering a PWA deployment**, updating `README.md`, `Fishing_Context.md`, `Fishing_TODO.md`, `Fishing_Decision_Log.md`, and the full `Fishing_New_Chat_Bootstrap_Prompt.md`.

**Official file to copy in its entirety:** https://github.com/ginosega/fishing/blob/main/Fishing_New_Chat_Bootstrap_Prompt.md . This supporting P3 note is **NOT** a substitute for the full bootstrap prompt.

Fresh, independently inspected [manual postflight #40166553523](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40166553523), job #121088686729, **PASS**: exactly three plain-text false flags, both ingress URLs OFF, no extra bindings, exact dedicated Access Service Auth policy intact and no Cloudflare mutation. The `deploy-disabled` mode remains removed via private PR #15. Do not rerun the predeploy `preflight` mode (it expects zero bindings). Begin only P3-30 **source/design security review** after restoring current `main` in the new Chat, with separate authorization required for any activation/deployment/write.

## Canonical repositories

- **Public source + untouched production:** `ginosega/fishing` production main remains at `3a3ea08057964f81d32375fe3e90503bcd9f0383` (last independently read). Future source lives in **DRAFT unmerged PR #263** https://github.com/ginosega/fishing/pull/263 , branch `feature/fish118-p3-mock-publisher`. P1 AUTH PR #262 unmerged. Do **not** merge/deploy production.
- **Private isolated P3 sandbox:** `ginosega/fishing-p3-sandbox`, repo ID `1430581407`, owner GitHub ID `265665562`. Main SHA **`bf9bf2f4b4c0e1dc347cdd2bab58b28f1dc69d05`** after P3-29 deployment lockout PR #15. Private content experiment PR #1 remains unmerged. GitHub App sandbox-only, publishing not enabled.

## Cloudflare runtime boundaries

| Component | Verified state |
|---|---|
| `fishing-p3-sandbox-preview` | Separate preview sentinel, no publisher, health previously `ok:true,ready:false,mode:preview-no-publishing`; do not modify |
| `fishing-p3-command-bridge-sandbox` | P3-24 hard-disabled static HTTP 503 Worker; Production + Preview URLs OFF, no routes; isolated D1 and encrypted HMAC bindings; `P3_WRITE_ENABLED=false`, `P3_COMMAND_BRIDGE_ENABLED=false`; independent read-only [postflight #40133925321](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40133925321) PASS |
| `fishing-p3-access-ingress-sandbox` | P3-29 **static 503 `ingress-disabled` source DEPLOYED**; Production + Preview URLs OFF; three false plain-text flags only; **no D1, service binding, secrets or custom routes**; immediate postflight PASS; fresh postflight pending |
| Cloudflare Access | App `Fishing P3 Sandbox Ingress` protects exact hostname `fishing-p3-access-ingress-sandbox.ginosega.workers.dev` with one policy `Fishing P3 GitHub Runner Only` action Service Auth, dedicated token `Fishing P3 Sandbox GitHub Runner`, no Allow/Bypass/other token |
| Isolated D1 | `fishing-p3-sandbox`; migrations R1–R4 applied, 7 tables/4 indexes/5 triggers at last checkpoint; no authorized application writes yet; private recovery bookmark saved by owner, NEVER reveal/request it |

## Verified run sequence and exact code

- Access metadata [#40162761115](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40162761115) **PASS**: Access app exact hostname, single service token and Service Auth policy.
- P3-28 live benign Access edge test [#40163736773](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40163736773) **PASS** while ingress was only Hello World: no-credential GET denied 401/403; invalid-token GET denied; dedicated service-token GET reached Hello World 200. URLs were switched OFF afterward. Do not treat this as live test of the new static-503 code.
- P3-29 future ingress static source `experiments/p3/preview/src/p3-disabled-ingress-worker.mjs` pinned at public source commit **`5df060076ca3cd010727fc9162b33bf03c157790`**, Git blob **`8f28f4e1d610fe549388308223bf3e6aa58af1a7`**. 327/327 source tests passed [#40164090871](https://github.com/ginosega/fishing/actions/runs/40164090871). This source always responds HTTP 503 with `{"ok":false,"ready":false,"mode":"ingress-disabled"}`, no imports/no subrequests, even when supplied enabled flags.
- Read-only P3-29 preflight [#40165050989](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40165050989) **PASS**, verifying ingress zero bindings/both URLs OFF and source/Access identities.
- **ACTUAL P3-29 DEPLOYMENT** [#40165892787](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40165892787), job `121086737630`, **completed/success** on sandbox SHA `1494e0b0bf66061cd75c6472bda0b128cff58863`. Wrangler 4.152.0 deployed reviewed hard-disabled ingress `--no-bundle`, reported success. Immediate provider settings postflight: exact three `false` vars, no extra bindings, Production/Preview URLs OFF and Access policy correct. **No independent remote script-byte hash** was obtained. Earlier cancelled run [#40165850415](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40165850415) failed initial validation; Wrangler installation and deployment steps were **skipped** — not an additional deployment. PASS/STOP entries printed during unit tests are simulated.
- **LOCKOUT** private [PR #15](https://github.com/ginosega/fishing-p3-sandbox/pull/15) removed `deploy-disabled` mode, restored read-only preflight/postflight guard, made `postflight` default. CI 53/53 Python guard tests PASS, merged to main **`bf9bf2f4b4c0e1dc347cdd2bab58b28f1dc69d05`**. Git history retains the one-off guarded deploy implementation for audit. No Cloudflare changes from lockout PR.
- The last production draft report is `experiments/p3/preview/P3_29_Disabled_Ingress_Deployment_2026-10-24.md`. This handoff file itself is maintained in draft PR #263; both unmerged.

## Existing secrets: do not disclose or relocate

All are private GitHub Actions repository secrets in `ginosega/fishing-p3-sandbox`: `P3_D1_CLOUDFLARE_TOKEN`, `P3_D1_CLOUDFLARE_ACCOUNT_ID`, `P3_D1_SANDBOX_UUID`, `P3_WORKER_CLOUDFLARE_TOKEN` (**command bridge only**), `P3_BRIDGE_HMAC_SECRET`, `P3_ACCESS_CLIENT_ID`, `P3_ACCESS_CLIENT_SECRET`, `P3_ACCESS_READ_TOKEN`, `P3_INGRESS_WORKER_CLOUDFLARE_TOKEN` (**ingress Worker only**). Never paste values in chat, PRs or logs. Tokens are narrow by individual Worker, Access read roles, or D1 task, not all account resources.

## Future milestone — NOT approved for activation

P3-25 HMAC trusted runner signer, P3-26 Access RS256 JWT verifier and proposed authenticated service-binding ingress, and native D1 operation acceptance are **source-only** in draft PR #263. Real authenticated ingress has not been deployed; **NO live service binding** connects ingress to the separate disabled command Worker. GitHub Actions runner cannot call Cloudflare Worker service bindings directly; identity-protected ingress was selected as possible bridge. Future review must evaluate actual Access JWT issuer/AUD/`common_name` claims, secure fixed-domain JWKS retrieval/cache and rotation, authenticated GitHub owner/App identity, HMAC logical request host/path, separate activation flags and rollback. Any live D1 `Accepted` write, sandbox PR creation, or production merge/deploy requires its own explicit owner approval. Preserve single-owner/anonymous-default V3 boundaries, no catch photos, existing preview and production unchanged.

**Safe transition rule — satisfied:** independent read-only postflight PASS; all five canonical files merged on main, including the ENTIRE bootstrap. New chat picks up at **P3-30 security design review only**.
