# FISH118 P3-32 — Manual runner and durable approval replay design

**Checkpoint:** October 24, 2026 PDT / October 25 UTC. **STATUS: SOURCE-ONLY DESIGN AND LOCAL PROOF. NO WORKFLOW ACTIVATION, D1 MIGRATION, REMOTE WRITE, SERVICE BINDING OR PUBLISHING AUTHORIZED.**

## Authority restored

- Public production main: `587b978118df64cc9ec584375c458fa2b10fecfa`; latest actual hosted production source: `4a1a8c44317b56a4d47e818db9cd2b5587a966d8`, successful workflow #672.
- Private sandbox main: `bf9bf2f4b4c0e1dc347cdd2bab58b28f1dc69d05`. Sandbox ID 1430581407, owner numeric ID 265665562.
- All P3 additions are unmerged source-only on draft public PR #263. AUTH PR #262 remains draft; unrelated PR #268 outside scope.
- P3-29 CLOSED; both command bridge and ingress are disabled static 503 sentinels; ingress has no D1, service or secret bindings and both Worker URLs off. Do not redeploy or repeat R1–R4 migrations.

## Deliverables (not operational)

- `design/p3-trusted-command.workflow.proposed.yml`: an **inert** fail-closed *example only*, located OUTSIDE either repository's executable `.github/workflows` directory. One `workflow_dispatch` trigger with a nonsecret ID, concurrency serialized, repository ID and owner actor checks, main ref, job-scoped `permissions: contents: read, id-token: write` and an `exit 1` sentinel. It cannot publish. It has no secrets, credentials, Worker fetch or D1 command. These permissions are a **proposal** for a future manual-only runner, not an Actions permission change. A separate owner approval is mandatory before creating any real workflow, even a disabled one.
- `design/p3_operator_approval_ledger.schema.sql`: an **unapplied proposed schema** explicitly outside `migrations/`. One approval UUID primary key; signed envelope digest unique; exact repo/owner, run/attempt, workflow SHA, idempotency key, body hash, issuance/expiry and consumed timestamp; no raw command payload, credentials or JWTs. **Do not move to the active migrations directory or apply to isolated remote D1 without a separately approved migration gate.**
- `src/p3-approval-ledger.mjs`: source-only, disabled-by-default ledger interface. One SQLite `INSERT ... ON CONFLICT DO NOTHING RETURNING approval_id` is atomic; competing consumes yield exactly one success. Requires literal write and ledger flags plus injected trusted approval callback, no default bindings, network access or credentials. Read-only status requires a separate literal status flag and the same injected trusted approval callback; returns `Consumed` for exact matching ID and envelope digest or `Unknown`, **never** `SafeToRetry`. Error details are redacted.
- `src/p3-operator-approval.mjs` updated to pass exact signed approval context, workflow SHA, idempotency and body hash to the injected ledger, not only an approval ID. The ledger remains disconnected from any live Worker.
- `test/p3-approval-ledger.test.mjs`: disposable local SQLite schema, concurrent insertion/replay, scope/time denial, unverifiable status, lost receipt after commit, and end-to-end local signature verification -> one-use ledger. No remote D1 writes.

## Important trust boundary

A future owner-triggered GitHub Actions job may request a GitHub-issued OIDC assertion only after owner-approved workflow installation. `id-token: write` authorizes identity token issuance, **not** GitHub repository Contents-write or App installation minting. Server-side provenance verification must use a known GitHub OIDC issuer/key set, exact immutable sandbox owner and repository IDs, audited audience, exact reviewed workflow_ref/workflow_sha, actor ID and run attempt. A future operator-signed ECDSA approval must come from a private signing key **outside** the runner, GitHub Secrets and Workers. No workflow input or JWT `kid` may select a URL. Client, ingress and receiver must each independently enforce their applicable scopes; an Access service-token JWT does not prove owner identity.

The proposed workflow file does not yet correspond to a real reviewed workflow SHA or real OIDC claims. Live OIDC subject settings for the existing sandbox repository still require a separately approved read-only provider proof. GitHub's immutable default subject applies to new repositories created after July 15, 2026, but actual repository/token policy must still be read rather than inferred. See [GitHub OIDC reference](https://docs.github.com/en/actions/reference/security/oidc) and [GitHub immutable-subject announcement](https://github.blog/changelog/2026-04-23-immutable-subject-claims-for-github-actions-oidc-tokens/).

## Lost acknowledgment and ordering

P3-31 currently calls its injected `consumeApproval` *before* dispatching a signed HMAC command. P3-32's table models only one-use consumption, **not** an atomic combined operation acceptance. A crash can occur after ledger insertion but before command acceptance, and a second crash can occur after the D1 operation was Accepted but before the user receives its receipt. It is a serious outstanding integration requirement, not a solved behavior.

The future decision should favor moving trusted signature validation, durable approval consumption, idempotent operation insertion and audit into one owner-scoped **server-side D1 transactional boundary**, if the final isolated service architecture permits it. This requires a new reviewed schema, service code, binding and deployment authorization. Where that cannot be done atomically, the server must explicitly record a recoverable status and refuse automatic retry. The command HMAC nonce ledger from R4 addresses transport replay only and must **not** substitute for owner approval authorization.

**Recovery rule:** on timeout/lost acknowledgment, mark the outcome `UNKNOWN`; query the exact approval digest through a separately approved authenticated read-only status operation, then query the exact repository/owner/idempotency-key operation status. A `Consumed` approval does **not** prove an Accepted or Published operation. An absent approval does **not** prove that replay is safe. No second signature, run attempt, nonce, or new operation may be created by an automatic retry. Human review and a new explicit approval would be needed to handle a proven nonacceptance; a confirmed prior acceptance resumes from its existing operation ID.

Approval rows must not be automatically purged while replay risk exists. Scope a separate retention/archival decision and distinct status-read credentials before rollout. There are no secrets or recovery bookmarks in these design files.

## Later separate gates

1. Review/approve workflow path, owner-only dispatch, minimum repository permissions, SHA pinning, branch protection, GitHub OIDC `sub` format, GitHub App permission matrix, runner checkout and secret custody before any file goes into private sandbox `.github/workflows`.
2. Design owner signing UX and signature provisioning/rotation. Manual approval must display exactly what is accepted; operator private signing key stays outside Actions/Worker/cloud.
3. Review proposed schema as a NEW migration, precise database identity and existing R1–R4 counts; get explicit authorization before applying a migration. **Never re-run R1–R4.**
4. Make the owner-signature check independently enforceable at the isolated trusted receiver and solve the atomic consumption/acceptance/recovery gap; source tests alone cannot authorize wiring to a live command route.
5. Only under later separate provider/service/enablement gates: inert live GitHub OIDC/JWKS proof, App read-only identity proof, Cloudflare Access-only test, Worker service binding, bounded internal command path, then isolated test `Accepted`, then test PR and eventual production v3 cutover. Preserve the existing disabled sentinels until expressly approved.

## CI evidence

**Exact implementation and design commit:** `0415c81d3e01a8f69a5399dbd5123c91d63b8ece`. [P3 isolated source validation run #40168875176](https://github.com/ginosega/fishing/actions/runs/40168875176) **completed/success**: 80 PWA + 43 broker + 240 isolated P3 = **363/363 tests passed, zero failed**. All validation steps passed, including browser-paste Worker source checks and the new seven approval-ledger tests. This validates local SQLite and simulated provider fixtures only; it is not live provider, remote D1, or enabled Worker evidence. The docs-only checkpoint commit following this evidence will be independently checked.

**Disposition:** design and source fixtures only; no live trusted runner, live replay ledger, D1 Accepted event, GitHub publishing or production change.
