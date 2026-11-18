# FISH-TODO-118 / WP3 H2 — single-operation resumable operator procedure

**Status:** SOURCE-ONLY procedure and non-authorizing resume guard. This is not a Cloudflare deployment, live publisher, browser automation, operator approval, H2 hosted acceptance, or public Live. The authoritative state remains governance/project-ops/project-ops/v2/WORK_QUEUE.md. Track the H2 provider receipts in issue #377.

## Purpose and bounded scope

Replace repeated R8/R9 intake-window diagnostics with ONE named synthetic KB operation that can be resumed, by verifying durable state after each independent provider step. This runbook supplements (does not replace) the approved FISH118 V3 Completion Contract and H2 activation approval packet. It does not change the original publishing coordinator, GitHub writer, owner session/CSRF trust, D1 schema, APP permissions or deployment flow.

Source candidate stack (all draft/unmerged at authoring): #554 receipt diagnostics; #556 canonical Markdown batching; #557 real SQLite receipt tests. Any activation must build and independently review the then-current *exact* source head, not redeploy the old #554-only R9 candidate. Prior Windows R9 result was inconclusive: its browser Console disappeared; last owner readback showed the original OFF Worker at 100%, all ten WP3 D1 operation tables empty, no publishing branch and canonical main unchanged.

Fixed synthetic identity: WP3-H2-SYNTH-KB-001, id h2-synthetic-kb-publishing-proof, key wp3_h2_synthetic_kb_001, notes KB/Techniques/content/h2-synthetic-kb-publishing-proof.md, target ginosega/fishing refs/heads/main. Do not insert the synthetic record into main, merge the synthetic PR, or reuse a stale source revision/fixture hash.

## Read-only plan guard (new source module)

pwa/server/d6-wp3-h2-resume-plan.mjs exports planD6Wp3H2Resume. It accepts:

1. A **fresh isolated WP3_DB SELECT** of the exact durable d6_operation_receipts row, including operation_id, owner_github_id, idempotency_key, domain, operation_kind, record_id, state, source_revision, snapshot_sha256, created_at and updated_at.
2. A fresh **original authenticated D2 owner/CSRF POST status** result from /api/v3/operations/{operationId}/status, produced by the existing D1 lifecycle inspector (not a client-authored status object).
3. Optionally the last locally retained non-secret checkpoint, which acts only as a rollback/progress alarm. The checkpoint is NEVER authority for an operation, grant or retry.

The guard rejects foreign or Unknown receipt rows; changed operation IDs or source revisions; inconsistent D1 receipt vs lifecycle state; non-prefix verified steps; missing Unknown/reconciliation transition; regressions or skipped steps; malformed/forged status and false Live/publish fields. Input shape checks cannot authenticate arbitrary text: the operator MUST obtain both observations independently from the approved environment. The guard has no fetch, D1 write, GitHub API, Worker mutation, token issuer, activation window, credential or permission. Its proposed approvalPins deliberately omit operator-approved true, enabling flags, fixture envelope digest, window start/end and secrets. **Never deploy from the advisory pins alone.**

Advisory outcomes:

| D1-derived lifecycle status | Guard action | Allowed next operator task |
| --- | --- | --- |
| No verified Accepted receipt | No plan available | Stop intake ambiguity and inspect D1; NEVER repeat POST just because browser logs vanished |
| AwaitingAuthorizedWrite for exact next step | REQUEST_EXACT_STEP_APPROVAL | Seek fresh owner approval for exactly that step before a separate beginOne |
| ReconciliationRequired for same step | RECONCILE_ONLY | Perform existing independent GitHub GET readback via reconcileOne; NEVER call beginOne again |
| VerifiedPr | VERIFY_UNMERGED_PR_READ_ONLY | Independently fetch exact PR, commit, tree, branch, diff and main; still not Live or mergeable by implication |

Each plan records a non-secret checkpoint; after interruption, repeat the authoritative D1 + authenticated status reads, compare with the checkpoint and stop if progress changed unexpectedly. A missing checkpoint does not invalidate verified D1 facts, but requires a fresh read and reconciliation; it never permits re-posting or write replay.

## Readiness gates before requesting *any* new provider activation

1. Verify source stack exact head, changed files, approved bounded fixture, all required CI and immutable build. Existing draft PR and CI success is not a Cloudflare Worker version. No public V2, WP2, H1 or app-main deployment.
2. Independently inspect the **Worker-bound** GitHub App installation through its official App API, including account/installation/repository identity, selection and approved contents:write and pull_requests:write only. New **source-only** `pwa/server/d6-wp3-h2-app-installation-preflight.mjs` reuses the production RSA App signer and fixed official endpoints: `GET /app`, `GET /app/installations/{id}`, `GET /repos/ginosega/fishing/installation`, a metadata:read-only installation-token issuance, then `GET /installation/repositories?per_page=100`. It requires the actual Worker-bound App/installation IDs, installed user, **exactly one** selected repository, contents:write/pull_requests:write/metadata:read and no other installed grants. It outputs only nonsecret evidence. This source module has not been run with live Worker-bound credentials: no verified provider result exists yet. The connected ChatGPT GitHub app or owner UI alone is not a substitute. No new permission change without owner approval.
3. Verify the current isolated OFF Worker version and traffic, its two exact dedicated D1 bindings/schema/indexes, seven encrypted secret *names* (not values), Pages/owner source, canonical main, synthetic ID/path absence, and all existing operation rows or absence. Do not assume historical R9 zero counts are current.
4. The stacked source-only `pwa/server/d6-wp3-h2-single-action-controller.mjs` implements one approved **intake**, one **step** (one begin + separate observed Unknown + independent reconcile) or one **reconcile-only** phase per call. `pwa/tools/d6-wp3-h2-atomic-journal.mjs` persists an exclusive one-shot local claim before any ON attempt, with a separate sanitized completion record. **Neither is yet a runnable/live operator adapter**: before provider use, independently review the missing Cloudflare version/approval adapter, first-party owner-session/CSRF HTTP adapter, independently observed raw D1 and App API preflights, and crash-independent OFF watchdog. The R9 PowerShell script remains intake-only and must not be reused. The server H2 approval still limits the static phase (intake OR steps), next step and <=1800-second window. Never auto-authorize a new step, repeat a Save, or relax these constraints.
5. Prove capture of sanitized HTTP results without relying on a volatile Edge Console. Never persist session cookies, CSRF, tokens, App JWT, PEM, raw authenticated request headers or secret values. Preserve only response status, safe fixed failure-stage label, operation ID, receipt status and nonsecret proof identities.

**Stop here until these prerequisites and any newly proposed controller have been independently source-reviewed and exact-CI validated.** This document does not authorize publishing.

## Source-only controller integration boundary

The controller requires real, separately reviewed callbacks `readPreflight`, `readReceipt`, `readOwnerStatus`, `verifyApproval`, `armIndependentOff`, `activate`, `sendOne`, `restoreOff`, `verifyOff`, `journal`, and `verifyFinalPr`. **Do not wire these to production or run the source module as an operator by itself.** Validation of callback object fields is fail-closed input checking, not provider authentication; adapters must independently check Cloudflare deployments and D1, the Worker-bound GitHub App API, signed-in first-party session/CSRF and exact prior consent. No callback may return an invented successful attestation.

Per `runPhase`, the module checks an exact preflight and out-of-band owner grant, claims a one-shot action in the local journal, requires a separately armed crash-independent OFF watchdog, activates one exact phase, executes at most one Save or one begin plus its independent readback, and restores/verifies the pinned OFF version in `finally`. It cannot advance to a new GitHub step or automatically retry a failed write. A lost receipt/HTTP acknowledgment burns the local claim and requires independent D1/GitHub reconciliation. Local claims are not global or provider-authoritative and must never substitute for fresh remote evidence. The standalone local journal uses exclusive flushed files and rejects unknown/secret-bearing fields.

**A real OFF watchdog that survives controller process termination is a hard prerequisite.** An in-process timer or `finally` is insufficient; the unintegrated callback interface alone does not prove this functionality. If OFF is not independently verified at 100%, stop further work and use the reviewed emergency OFF procedure with separate owner authority.

## Provider OFF transport — source-only, NOT independent supervision

`pwa/tools/d6-wp3-h2-cloudflare-off-api.mjs` implements a narrowly pinned REST transport against Cloudflare's documented deployment API. It can verify that the **most recent** isolated `fishing-v3-wp3-test` deployment and a separate GET detail both show prior OFF version `b552efc6-a24c-4ca1-ab6c-b88a68c99ff0` at 100% traffic, or request a single redeployment of **that OFF version only** and read it back. Its default gate is DENY; only an independently authorized operator could supply the Cloudflare account/token and enable the adapter. There is no ON method, asset upload, changed Worker route or secret update. It does **not** run merely by import or by source CI.

**Critical limitation:** A deployment metadata readback does **not** prove all edge locations have converged, that the OFF version's four write flags are disabled, or that authenticated write routes deny. Its result deliberately includes `writeRoutesDenied:false` and `offVersionFlagsVerified:false`. A separate verified HTTP denial, source/version binding and independent OFF supervisor are required before passing `verifyOff` to the controller. An independently running, process-exit-surviving watchdog with a separately proven deadline is **still not implemented** by this adapter. No live Cloudflare API call or deployment has occurred.

## Consolidated H2 sequence once separately approved

### Phase A — one exact intake

Read-only prerequisites and denied OFF tests PASS. Fresh owner approves the exact candidate Worker, fixture bytes/SHA, scope and target. Activate narrowly under a separately verified interval. Submit the synthetic KB envelope exactly **once** under existing owner session and CSRF. Persist sanitized response before browser closure. Independently read back one Accepted receipt, UUID, source revision and snapshot SHA-256. If the status is 503, Unknown, absent or contradictory, restore OFF and reconcile D1/GitHub read-only. **No second POST.** If no Accepted row can be proven, stop; no provider step.

### Phase B — five separately approved steps for the SAME UUID

For each step in tree, branch, commit, advance, pr:

1. Refresh OFF/source/owner/DB state, inspect the existing D1 lifecycle and run the read-only resume guard against the exact Accepted receipt plus optional previous checkpoint. Confirm pinned source revision and ordered prior verified prefix.
2. For AwaitingAuthorizedWrite, request specific owner permission for THIS operation/step/window. Validate the exact H2 server authorization pins and deploy narrowly with other scopes OFF. Send one authenticated beginOne, not a second Save. A durable Unknown fence is the expected *intermediate* outcome, **not** proof that provider mutation succeeded.
3. For ReconciliationRequired, use ONLY the existing reconcileOne independent GitHub GET/readback path, and inspect D1 verified receipt for this step. An uncertain provider write MUST NOT be retried.
4. Preserve sanitized step outcome and nonsecret checkpoint, restore the known OFF Worker and independently confirm 100% OFF before changing the approved step or leaving the operator session. On an interruption, reread D1 first and resume from the observed Unknown or next approved step; never infer progress from clipboard, timer, HTTP success or local notes.
5. Do not advance to the next step unless the current independent verification and immutable proof prefix match the existing lifecycle contract.

The existing server authorizer permits only one approved next step and exact prior prefix; this procedure does not weaken it or grant broader provider rights. The operation ID and source revision must remain unchanged. Any unexpected main movement, missing D1 row, foreign branch/PR, mismatched Git blob, long-running or uncertain step or auth mismatch results in STOP/OFF and safe read-only reconciliation.

### Phase C — VerifiedPr and OFF closure

The independent verifier confirms the operation-owned branch fish-v3/publish/{operationId}, exactly the reviewed KB/kb.json plus one Techniques Markdown change, immutable PR/branch/commit/tree digest chain, original canonical main unchanged, no force update, no merge, no public Live, and the existing D1 VerifiedPr state. Verify 100% OFF, denied writable endpoints, unchanged V2/WP2, and reconciled operation tables. Leave synthetic PR unmerged and preserve receipts pending separate explicit owner disposition. Record source/CI, artifact, owner, Cloudflare/D1 and GitHub evidence in issue #377.

## Boundaries and follow-up

A single logical synthetic operation may span multiple separately authorized phases. **It is not equivalent to a single uninterrupted time window.** H2 VerifiedPr is only WP3 hosted publishing proof. H3 duplicate/concurrent/uncertain-write recovery, WP4 fast public Live verification, WP5 complete private hosted Windows/Android RC and WP6 public cutover remain gated by their independent acceptance contract. No production release follows from this runbook.
