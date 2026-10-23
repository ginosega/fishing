# FISH118 P3-11 — Dedicated sandbox App Checks:read live proof handoff

**Date:** October 23, 2026. **Owner action:** Owner reported GitHub App permissions updated and installation approved. **Verified only by owner report, not by a dedicated-App authenticated GitHub API response.**

## Source-only work completed in Chat

Trusted one-shot [Node script](tools/verify-sandbox-check-read.mjs) and [adversarial suite](test/verify-sandbox-check-read.test.mjs) now exist in draft `ginosega/fishing` PR #263. A test using temporary locally generated RSA signing keys and mocked GitHub API returned only safe evidence; failures for missing approved installation check scope, stale base/main, changed PR, wrong Actions App, missing/failing check, no permission, and invalid token were exercised. GitHub exact-head isolated source validation **run #40005410897** completed **success: 80 PWA + 43 standalone + 98 preview tests = 221/221**.

The real private synthetic sandbox is still at main `e37db3e8cf80f9c54badc1e56ef97382ccefec87`. Sandbox draft [PR #1](https://github.com/ginosega/fishing-p3-sandbox/pull/1) has head `7e39c018081e9677b33c3bcab7ebe80b44d924f8` and successful GitHub Actions check-run `120492395098` from Actions App ID `15368`, confirmed using the **owner ChatGPT GitHub connector**. No merge occurred. This is **not** confirmation that the dedicated sandbox publisher App has the Checks permission.

## Remaining secure live proof

The existing ChatGPT GitHub connector **does not accept** custom GitHub App registration or installation lookup endpoints, and cannot use the `fishing-p3-sandbox-publisher` private signing key. Source-only Node proof code therefore has not run using that App's actual credentials.

The trusted runtime must securely have the existing `P3_GITHUB_APP_ID`, `P3_GITHUB_INSTALLATION_ID`, and `P3_GITHUB_PRIVATE_KEY` (do not expose values in logs, ChatGPT chat, PRs, Git remotes or commit history). For the one-shot operation it must set only `P3_CHECK_READ_PROOF_ENABLED=true` and **`P3_WRITE_ENABLED=false`** and execute:

```sh
node experiments/p3/preview/tools/verify-sandbox-check-read.mjs
```

It preflights installed App identity and `checks:read`, mints a **single repository** temporary `contents:read`, `pull_requests:read`, `checks:read` grant, checks immutable sandbox PR #1 and the exact successful Actions check, rechecks current main and PR, and emits only small safe `verified:true`/`canMerge:false` evidence or a static refusal code. **No GitHub write verbs, no deployment or merge.** Success should be recorded in the project report by check-run ID, not token.

**Execution options:**

- A trusted local Node environment under the owner's control, if the owner still has the original private App key in a local secret manager. Set environment variables without placing key contents in shell history; never paste the key into ChatGPT. The existing Cloudflare Worker secret cannot be exported through GitHub.
- Alternatively, temporarily switch to **ChatGPT Work** for a browser-mediated Cloudflare setup, but a Worker-based diagnostic must be separately designed and approved. The CLI is Node-specific and should **not** simply be pasted into Cloudflare's Worker runtime. Work may navigate the Cloudflare UI, but cannot reveal secret values and must not silently add public diagnostics, persistence, write permissions, or change production. A protected read-only diagnostic would require explicit owner approval and should be removed after proof.

**Still prohibited without further approval:** changing `P3_WRITE_ENABLED=false`, deploying any P3 write route, applying D1 migration 0002, using App content/PR write scope in proof, creating/merging App-published sandbox PRs, modifying public production `main`, or v3 release cutover. `ginosega/fishing` public `main` is protected by active GitHub Free ruleset #25742040 and its verified Pages release ID is `504d615b2bef361da06d655ee621d43a`.

**Next decision:** choose local secure one-shot Node execution or Work-mode Cloudflare diagnostic. Work is useful for the latter; no mode change is needed for continued source-only GitHub work.
