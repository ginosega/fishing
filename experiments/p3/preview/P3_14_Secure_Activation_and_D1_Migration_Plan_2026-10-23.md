# FISH118 P3-14 — Secure activation and isolated D1 migration rollout

**October 23, 2026 — PLAN ONLY. No operational authorization.** Prepared on unpublished draft [PR #263](https://github.com/ginosega/fishing/pull/263). This plan does not apply SQL, deploy code, enable publishing, schedule a job or merge PRs.

## 1. Source-verified boundary

| Surface | Last verified |
| --- | --- |
| Public production main | 4a1a8c44317b56a4d47e818db9cd2b5587a966d8, protected by active GitHub Free ruleset #25742040; Pages release 504d615b2bef361da06d655ee621d43a |
| P3 draft source | feature/fish118-p3-mock-publisher on PR #263; remained draft/unmerged |
| Private sandbox main | e37db3b18bd9948bf4453d7f885f868e830a9a9a; repository ID 1430581407; existing draft PR #1 unchanged |
| Dedicated GitHub App | P3-11 owner-executed real-token check read passed; sandbox-only Contents/PR/Checks read token was validated |
| Cloudflare preview | Owner-reported separate Worker fishing-p3-sandbox-preview, isolated D1 database fishing-p3-sandbox, binding DB and P3_WRITE_ENABLED=false; **current Cloudflare settings and deployment ID cannot be independently viewed through this Chat's GitHub connector** |
| D1 schema | 0001 was created manually; 0002 and 0003 are source-only, unapplied remotely |
| Code | P3-13 trusted Node composition and source end-to-end tests passed 243/243; never routed/deployed |

**Critical architecture limitation:** The P3-13 composition includes filesystem/Git checkout, Node child processes and a D1-shaped injected store. Cloudflare Workers provide native D1 access through the Worker DB binding; a standalone Node checkout runner does **not** automatically have that binding. The deployed Cloudflare Worker is a read-only/deny-all publishing sentinel, not the Node publisher. Never assume P3-13's source-only pass proves that it is deployable as a single Worker.

## 2. Recommended rollout: independent review gates

### A. Read-only inventory (first operational request; no migration)

1. Owner/operator confirms the exact Cloudflare account, preview Worker name and workers.dev host, APP_ORIGIN, and remote D1 name **plus UUID**. Check UUID against the deployed Worker's DB binding and exclude AUTH-P0/production. No secret, token, signing key, account identifier or D1 UUID is required in Chat.
2. Record Worker deployment/version, anonymous health result with ready:false, publishing flag false, and whether a historical temporary diagnostic key is absent. Do not create a public diagnostic endpoint.
3. Inventory real remote SQLite tables, indexes, triggers, columns and the migration ledger. Initial 0001 was **manually executed**: its objects existing does not prove Wrangler's tracking table knows 0001 was applied. Review exact remote SQL schema/constraints, not just names.
4. Check D1 storage version and eligibility for point-in-time recovery; record nonsecret recovery readiness. Cloudflare Free has **seven days**, not the paid thirty-day Time Travel window.
5. **Stop** if database/Worker identity is ambiguous, existing 0001 differs, or the migration ledger is unknown. Do not approve a migration until the inventory is reconciled.

The commands below are **read-only examples, never executed by this plan**, from the owner's private local copy of experiments/p3/preview with an untracked wrangler.jsonc pointing ONLY to the isolated D1:

~~~powershell
npx wrangler@4 d1 info fishing-p3-sandbox --json
npx wrangler@4 d1 migrations list fishing-p3-sandbox --remote --config wrangler.jsonc
npx wrangler@4 d1 execute fishing-p3-sandbox --remote --config wrangler.jsonc --command "SELECT type,name,tbl_name FROM sqlite_master WHERE name LIKE 'p3_%' OR name='d1_migrations' ORDER BY type,name;"
npx wrangler@4 d1 execute fishing-p3-sandbox --remote --config wrangler.jsonc --command "PRAGMA foreign_key_check;"
npx wrangler@4 d1 time-travel info fishing-p3-sandbox
~~~

Capture table SQL from sqlite_master and PRAGMA table_info / foreign_key_list for exact comparison, without exposing stored rows. If migration list reports 0001 pending, this may be **only a ledger discrepancy** due to manual initialization. Do not blindly select apply. In the Cloudflare browser Console issue separate statements, not a pasted multiline script beginning with SQL -- comments: this editor previously flattened such scripts.

### B. Isolated schema-only migration (requires fresh, specific owner approval)

Prerequisites: A passes; verified manual 0001 matches source; migration history is reconciled; no active publishing/leases; pre-migration **D1 Time Travel bookmark** and UTC timestamp are privately recorded; exact target database UUID independently checked.

1. Test exact migrations in a disposable local SQLite/D1-compatible fixture. Verify 0001 objects, 0002 accepted/snapshot triggers and 0003 CI observation/audit constraints.
2. Select **one** reviewed strategy: if Wrangler has safely reconciled the manually applied 0001 history, apply only the approved pending files through migrations tooling, reviewing its pending list before each step. Otherwise use explicitly reviewed remote SQL file execution for 0002 and 0003 and maintain a migration ledger for future reconciliation. Never mix the strategies or patch internal Wrangler history casually.
3. Execute source **0002_durable_snapshot_and_audit.sql** first; verify p3_requests and operation transition/accepted triggers without inserting fishing data or losing 0001 rows. Halt on any error.
4. Execute source **0003_ci_observation_recovery.sql** next; verify p3_ci_observations, p3_ci_observation_audit, two append triggers, exact constraints, and migration status. Halt on any error.
5. Confirm the existing Worker remains on the **same deployment/version** and fails closed: health ready:false, anonymous session unauthenticated, publishing and privileged routes denied. **No Worker deployment is part of B.**
6. Retain the pre-change bookmark. D1 restore overwrites the **entire isolated database**, not just one migration; do not restore or run guessed DROP statements without evaluating later writes and seeking explicit destructive-recovery approval. If the SQL is additive and unused, a halted rollout may safely leave it dormant until reviewed.

Do not place raw migration execution commands in an automated workflow until the owner approves this scope after actual preflight.

### C. Trusted-runtime architecture (source-only next stage; no operational approval needed)

**Recommended split** after P3-13 tests, before any live runner activation:

- A dedicated trusted Node executor handles actual Git fetch, immutable worktree/checkout, full canonical source-aware validation and candidate construction, because this uses Git process and filesystem.
- A **separate observer-only Cloudflare Worker component** uses the existing isolated D1 binding, native fetch and only GitHub App contents:read / pull_requests:read / checks:read scope for CI observation. It does not import the Node Git validator, sandbox branch creator or write token issuer.
- Design authenticated, replay-safe communication between trusted Node executor and D1 owner-scoped operations before implementing a runtime connection. A Worker service binding is not, by itself, a direct D1 interface to external Node. Any externally reachable privileged route needs separate security design/approval; avoid public diagnostic or publication endpoints.
- **Known blocker in source:** P3-13 trusted-sandbox-runner currently demands checkout, session, write-token issuer and write HTTP dependencies at construction even when only observeCheck is requested. Refactor to an observer-only composition that never imports, requires or exposes write-capable dependencies. Fail closed absent exact owner/repository identity and opt-in; ensure no public access.
- Specify lease timeout and recovery if GitHub reads exceed the current lease, explicit bounded retries, operation idempotency, history and audit, and verification that a stored passed check is **not** merge authority.
- Require local tests verifying no GitHub non-GET requests, no D1 state jump beyond Checking, no production repo access from issued scoped token, no credential disclosure, and no read-only startup with write dependencies.

No trusted Node scheduler/agent, new hostname, Cloudflare API token or account-wide credential is approved here. Do not put App signing keys in GitHub repo, Actions logs, plaintext environment dumps or Chat.

### D. Read-only live observation proof (separate approval, after B and C)

Deploy only an isolated, reviewed, **observation-only** component with P3_WRITE_ENABLED=false, no auto-scheduler or public privileged endpoint. Test it against an explicitly approved synthetic Checking fixture inserted through the legitimate owner-scoped state path. Existing sandbox PR #1 was not created by D1 and **must not be falsely adopted** as an authentic operation without explicit test-fixture design and approval.

Demonstrate a real App-token read, exact Actions head/base identity, a single D1 lease, recorded success or bounded retry, recovery on restart, and no GitHub write. Record only nonsecret evidence. Revoke temporary test access and leave operations at Checking; no merge/deploy.

### E. GitHub App sandbox writes / v3 production cutover (separate approval, NOT INCLUDED)

App-created real sandbox branches or draft PRs, live owner-authenticated authoring, D1 0002/0003 migration execution, write flag changes, protected public production main integration, automatic publishing, and v3 release all remain **distinct approval gates**. The private sandbox remains unprotected under GitHub Free and is never permitted to auto-merge.

## 3. Stop conditions and recovery matrix

| Stop condition | Response |
| --- | --- |
| D1 UUID/name or Worker origin doesn't match isolated P3 | Stop; no SQL or deployment |
| Existing schema drift, Wrangler migration ledger disagreement, no verified recovery bookmark | Stop before migration; reconcile source/history |
| Unauthorized write-capable dependency in observer-only runtime | Stop; refactor and repeat adversarial tests |
| No authenticated Node-to-D1 handoff or owner-scoped operation identity | Stop before runtime activation |
| Synthetic PR #1 mistaken for D1-generated operation | Stop; design authorized fixture rather than rewriting history |
| Failed remote migration or unexpected schema objects | Stop, preserve bookmark and analyze; no automatic destructive rollback |
| Any change to P3_WRITE_ENABLED, GitHub App scopes, public production main, or Worker routes | Separate explicit approval; outside this plan |

Cloudflare D1 Time Travel can restore eligible databases to a prior bookmark but **destructively replaces entire database contents**. On Workers Free the point-in-time window is **seven days**. Rolling back a Worker deployment **does not roll back D1 schema**. No backup or restoration action is performed by this document.

## 4. Approval decision

**Approved in this increment:** authoring and source-only review of this plan on draft PR #263.

**Not yet approved:** actual Cloudflare inventory using owner credentials, remote SQL migrations 0002/0003, Worker deployment, scheduler, Node-to-D1 privilege bridge, any GitHub App write API, merge or production cutover.

**Recommendation:** first implement and test the *observer-only composition and read-only preflight validation* as source-only P3-15. Then request separate permission for Cloudflare read-only inventory A and, only after reviewing actual evidence, the tightly scoped isolated migration B. Continue in Chat mode; Work mode is not required.

Official references: [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/), [Wrangler D1 commands](https://developers.cloudflare.com/d1/wrangler-commands/), [D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/), [Workers D1 binding API](https://developers.cloudflare.com/d1/worker-api/).
