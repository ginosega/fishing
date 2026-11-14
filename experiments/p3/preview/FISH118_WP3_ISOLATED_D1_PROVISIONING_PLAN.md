# FISH-TODO-118 WP3 — isolated D1 provisioning readiness

**Status:** Source-only operator plan; **not an authorization to migrate, bind, deploy, or write**. This is part of the existing WP3 hosted integration checkpoint, not a new delivery package. Preserve the owner-approved WP0–WP6 completion contract and PUB-002/PUB-004.

## Existing D1 and provider boundaries

- WP2 has a previously owner-accepted **read-only** isolated hosted OAuth/session/source checkpoint. Its working `AUTH_DB`, sessions, secrets and currently deployed read-only gateway must remain unchanged until a separately scoped authorization.
- WP3 publishing uses immutable Accepted owner/source snapshots, one sticky Unknown fence before **each** uncertain external mutation, and separately verified original-media and Git tree/branch/commit/advance/PR proofs. A GitHub 201, Accepted D1 record or VerifiedPr is **not** public Live.
- Never import D5 sandbox credentials or use a browser-selected D1 name, GitHub repository, source revision, write token or custom downstream attestor.
- Existing #491–#494 are source-only and unmounted; **no hosted write runtime has been approved or activated**.

## Exact proposed WP3 schema inventory

The source-only `d6-production-wp3-d1-readiness.mjs` imports the existing SQL declarations directly and exposes a non-executing schema plan, in dependency order.

| Table | Existing source contract | Purpose |
| --- | --- | --- |
| `d6_operation_receipts` | `d6-production-operation-receipts.mjs` | Immutable owner Save intent; idempotency and active-record uniqueness |
| `d6_provider_step_fences` | `d6-production-github-step-writer.mjs` | Durable sticky Unknown claims for media/tree/branch/commit/advance/PR |
| `d6_media_stage_verified` | `d6-production-media-stage-reconcile.mjs` | Independently verified original Git blob bytes |
| `d6_atomic_tree_verified` | `d6-production-atomic-tree-reconciliation.mjs` | Exact atomic canonical text/Markdown/media Git tree proof |
| `d6_publish_branch_verified` | `d6-production-publish-branch-coordinator.mjs` | Operation-owned branch proof |
| `d6_publish_commit_verified` | `d6-production-publish-commit-coordinator.mjs` | Independently verified commit proof |
| `d6_publish_tree_candidates` | `d6-production-tree-candidate-custody.mjs` | Durable provisional Git tree result SHA custody after a fenced provider response; still requires independent Git tree proof |
| `d6_publish_commit_candidates` | `d6-production-commit-candidate-custody.mjs` | Durable provisional result SHA custody after a GitHub commit response |
| `d6_publish_advance_verified` | `d6-production-publish-advance-coordinator.mjs` | Non-force operation-branch advance proof |
| `d6_publish_pr_verified` | `d6-production-publish-pr-coordinator.mjs` | Exact GitHub PR identity readback |

Do not hand-edit, recalculate, or diverge from these existing component declarations. The receipts contract also contains the active-record partial unique index. All ten definitions remain non-authorizing **source** until separately approved provisioning.

## Proposed guarded hosted acceptance sequence — operator approval required

1. **Review exact environment**: specify dedicated isolated WP3 Worker/Pages origin, D1 binding target, GitHub App installation and the minimal proposed permissions. Keep the WP2 read-only staging Worker unaffected. Confirm whether the existing production-origin pin must be adapted *safely* for an isolated same-origin staging profile before any write route can be mounted; a disabled route that is source-correct is not yet an isolated-host-valid route.
2. **Request separate explicit owner authorization** for a newly provisioned isolated D1 database, any schema application, new secrets and permissions, worker write-route deployment, and controlled real GitHub provider writes. Never treat approvals for WP2 read-only deployment as WP3 write approval.
3. **Provision only in the approved isolated target**: retain WP2 `AUTH_DB`/sessions and public V2 unchanged; apply a reviewed migration using the exact source-imported SQL, with an operator-held immutable migration checksum and explicit target identity. No assistant-controlled automatic schema execution.
4. **Verify before enabling writes**: use the disabled-by-default `createD6Wp3D1Readiness({DB,enabled})` to inspect ten exact table/column layouts, plus idempotency and active-record unique indexes. A missing D1, changed columns or missing index **fails closed**. This result alone does not enable publishing.
5. **Bind narrow provider authority** only after separate approval: owner D2 same-origin session/CSRF, read-token issuer, scoped GitHub write-token issuer, original-image preflight and tickets, main/ref preconditions, one-step dispatcher, D1 fences/proofs, fail-closed runtime transport. Configure all independent kill switches OFF by default.
6. **Controlled hosted tests**: authenticate owner, accept a low-risk synthetic content operation, verify a fully fenced real GitHub PR (not merged), test missing media, uncertain/lost acknowledgments, source drift, duplicate/concurrent commands and no blind retry. Validate anonymous/cross-origin/expired-session/write-disabled paths. Capture exact provider/Worker/D1 and Windows Edge/Android owner evidence.
7. **Reconcile WP3**: verify all twelve WP3-owned requirement IDs from the 66-ID matrix and the approved WP3 exit contract before marking this package accepted. WP4 retains guarded merge/hosted Live and ≤60-second publishing; WP5 comprehensive private RC; WP6 separately authorized production cutover.

## Inspection limits

`createD6Wp3D1Readiness` exposes **only** `inspect()`, executes SQL `PRAGMA table_info`, `index_list` and `index_info` reads, and has no D1 mutation, migration or permission activation method. It cannot prove actual provider secrets, D1 isolation, release provenance, live GitHub access, correct CHECK constraints or a hosted Save outcome; those still require operator-controlled verification. In particular, a `schemaReady:true` result is **not** a license to execute SQL or turn on provider writes.

This document contains **no** credentials, database names, live endpoints beyond established canonical source, destructive database instructions or claims of an already-completed WP3 hosted checkpoint.
