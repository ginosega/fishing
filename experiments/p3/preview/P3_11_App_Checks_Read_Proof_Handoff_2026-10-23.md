# FISH118 P3-11 — Dedicated sandbox App Checks:read live proof

## October 23, 2026 live result — PASS for installation grant and exact-head check read

**Evidence provenance:** Owner-executed live proof on the owner's Windows computer using Node **v24.22.1** and the existing dedicated App PEM file. The owner returned the bounded JSON below in the Work conversation. This is actual-credential proof reported by the owner, not an agent-observed execution, an owner-connector substitute, or a mocked CI result. No credential values were provided to ChatGPT.

**Reviewed source:** Four modules downloaded from immutable production-repository feature commit `d5644511ab7a1165eb64cdcec660f64cb3cc956e`: `src/github-app-readonly.mjs`, `src/sandbox-check-read-token.mjs`, `src/sandbox-check-observer.mjs`, and `tools/verify-sandbox-check-read.mjs` under this preview directory. Source was inspected before supplying the local PowerShell launcher. The launcher reads the original PEM locally, sets the proof flag true and write flag exactly false, runs the one-shot script, and removes the temporary process environment variables in a finally block. No npm dependency install was needed.

```json
{
  "verified": true,
  "repository": "ginosega/fishing-p3-sandbox",
  "repositoryId": 1430581407,
  "prNumber": 1,
  "headSha": "7e39c018081e9677b33c3bcab7ebe80b44d924f8",
  "baseSha": "e37db3b18bd9948bf4453d7f885f868e830a9a9a",
  "checkName": "validate-sandbox-head",
  "checkRunId": 120492395098,
  "result": "completed/success",
  "checksReadPermissionConfirmed": true,
  "canMerge": false,
  "canDeploy": false
}
```

### What this success establishes

- The configured App's signed JWT successfully queried its actual installation and the sandbox-to-installation association. The installation matched the configured App/installation IDs, owner `ginosega`, selected-repository mode, unsuspended state, and **checks:read**.
- GitHub issued an ephemeral token requested with `repository_ids:[1430581407]` and exactly `contents:read`, `pull_requests:read`, `checks:read`. The issuer validated a one-repository returned grant and rejected additional/write permissions (implicit `metadata:read` only is allowed).
- That token read the private sandbox identity, current main, open/draft/unmerged PR #1, and the successful exact-head check from **GitHub Actions integration ID 15368**. Main and PR were reread after the check to reject intervening movement.
- Current verified base is **e37db3b18bd9948bf4453d7f885f868e830a9a9a**. The different SHA previously written in this handoff and P3-10 was a documentation inconsistency; it is not the base accepted by the live script. An independent owner-connector main read before local execution also matched the accepted SHA.

### Scope limits and precise security interpretation

- The script queries installation metadata, not `GET /app` registration metadata. Effective installation Checks:read is verified; the registration setting was previously owner-confirmed and is consistent with this grant, but **no independent registration-endpoint response was collected**.
- The read-only token's validated grant excludes Contents/PR write permissions, so it grants no authority to change contents or create/merge PRs. **No mutation was attempted to test denial.** `canMerge:false`/`canDeploy:false` also describe the observer's capability boundary, not responses from attempted writes.
- The returned token grant contains only sandbox repository ID 1430581407; it grants no production installation privileges. **Production is public**, so this does not prove that public production content cannot be read. No production-access denial probe was performed.
- The complete installation repository inventory was not enumerated. The verified one-repository scope is the issued token's grant; do not equate selected-repository mode alone with proof of the installation's entire inventory.
- No token value or expiry was printed. The script did not explicitly revoke the token; it remains subject to GitHub's expiry. No key/token was logged, committed, or returned by the proof.

### Changes and next stage

Cloud-browser sign-in could not be completed; no Cloudflare operational inspection or change resulted. **No GitHub App permissions, repository configuration, Cloudflare Worker, D1 migration/data, sandbox PR/content, production main, publishing flag, or deployment was changed by this verification.** Only this feature-branch evidence document and the draft PR conversation are updated for closeout. Local Node installation and temporary source downloads occurred on the owner's computer. Cloudflare's stored write flag was not independently reread; the local proof required `P3_WRITE_ENABLED=false`.

**P3-11 core live proof is complete.** Return to Chat mode for the next scoped source-only design of durable check observation/recovery and its integration with the trusted publishing flow. This result does not authorize operational integration: Worker deployment, migration 0002, App-created sandbox PRs, write enablement, merges, production App access or v3 cutover remain separate explicit gates. No next-stage implementation was performed here.

---

## Historical handoff — superseded by the live result above

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

