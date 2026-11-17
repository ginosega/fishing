# FISH-TODO-118 WP3 — source integration and hosted-readiness gate

**Status:** PR #498 candidate. Source only, **not hosted**, not merged into main, not authorization for credentials, D1 provisioning, Worker binding, real GitHub writes, merge, deployment or production cutover.

## Critical integration findings and remediation

1. **GitHub root-tree location** (corrected here). The immutable canonical source reader loads `pwa/Gear/gear.json`, `pwa/KB/kb.json`, and `pwa/Catches/catches.json` from the GitHub *repository root* commit tree, while the existing content validation/metadata paths are relative to `pwa/`. The previous atomic tree Git request used those relative paths verbatim, which could create top-level `Gear/`, `KB/`, `Catches/` paths instead of changing V3 content. `describeD6AtomicTreeStep` now binds exactly `pwa/` before hashing the immutable Unknown D1 request descriptor. All original validation remains over canonical relative paths. The independent full-tree readback compares only the prefixed actual Git paths, rejects unrelated root edits and continues to require no `truncated` tree.
2. **Independent recursive Git tree readback** (corrected here). The actual #472 verifier asks for immutable `GET /git/trees/{sha}?recursive=1`. The #488 pinned provider transport previously denied any GET query outside PR discovery. It now accepts only `?recursive=1` for an exact pinned Git tree SHA, with all other query, origin, method, body, authorization, redirect and token restrictions preserved.
3. **Canonical-source reader request contract** (corrected here). The original snapshot loader requests pinned Git contents and the bounded `WP2VerifiedMarkdown` GraphQL read with `redirect:manual`; it does not pass `credentials:omit` / `cache:no-store` explicitly. #497's new host denied its valid read requests. The `createD6Wp3CanonicalSourceTransport` replaces that adapter, restricts GET to exact pinned repository/main/tree/blob/commit routes (including exact recursive tree), allows only the existing bounded read-only GraphQL prefix, verifies the original App-token/header shape, and **adds** `credentials:omit` / `cache:no-store` to outbound calls without granting writes.

## Source regression and joined workflow validation

- New exact Git path and source transport checks `WP3-END01–09`: root/pwa path binding, path traversal and double-prefix denial, exact recursive GET, changed/forged query denial, original snapshot-reader request shape, markdown GraphQL read-only, token scope/header restrictions, revocation and non-force write preservation.
- New joined checks `WP3-JOIN01–04` invoke **the actual** five-step coordinator's tree writer, existing durable D1 Unknown claim and tree SHA candidate custodian, trusted GitHub provider transport and independent #472 GET + `d6_atomic_tree_verified`, followed by existing #477 recovery-lifecycle inspection. They cover a valid root-tree change without unrelated modifications, lost GitHub POST acknowledgment without replay, source drift after fencing, and source drift before the first fence.
- Existing #470–#497 unit and integration suites must continue to pass at the exact PR head. Simulated/provider fakes in these tests do **not** establish live GitHub App permissions or a hosted success.

## Additional discovered pre-host publishing blocker: novel text blobs

The existing `#470` atomic source/media planner computes a Git SHA for **newly generated canonical JSON and Markdown text**, then attempts an immutable `GET /git/blobs/{sha}` before planning the tree entry. A new, never-before-published text body will ordinarily **not yet exist in GitHub's object store**, and the current media Git-blob staging flow covers only original images. As a result, a novel content edit can fail closed before a Git tree mutation, even with the corrected `pwa/` paths.

This is not resolved by the transport fixes or joined tree tests in this PR: those tests use synthetic plans with preexisting predicted text SHAs. Before any real hosted content acceptance, implement and test a bounded, immutable, verifiable text-object creation strategy—such as Git Tree API inline `content` bound to independently checked Git blob digests, or separately fenced-and-reconciled text-blob staging. Preserve the one-Unknown-before-provider-write rule, no blind retries, canonical source-only paths and independent root-tree proof. **Do not claim source-integrated real text publishing or WP3 exit until this is resolved.** Track this as a separate bounded source fix if required.

## Explicit remaining blocker for isolated hosted WP3 acceptance

The existing #490/#492/#493 write route and canonical D2 session pin the canonical production origin. Existing WP2 staging allows a separate exact hostname **for READ only**. #497 deliberately refuses write activation on WP2 staging. This is necessary and must **not** be worked around by rewriting the browser Origin, sharing cookies/CSRF across origins, routing to a second implicit login or deploying the draft writer on the production domain.

A **dedicated isolated WP3 same-origin write profile** remains to be reviewed and implemented, with explicit exact hostname, first-party OAuth redirect/cookie/CSRF handling, immutable GitHub repository and root content checks, narrowly granted App token scopes, isolated WP3 D1 binding, and negative cross-origin security tests. These details depend on an approved isolated-host plan and have not been authorized or provisioned. A separate bounded source PR may be required after this review, followed by owner-approved hosted integration. Consequently **passing #498 will complete the planned three-source-PR integration sequence, but cannot by itself close WP3**.

## Next owner decision checkpoint (NOT yet approval)

After exact-head CI on #498 and reconciliation of the source-only PR stack, present the proposed isolated hostname, Worker/D1/App binding plan and testing approach for **separate explicit approval**. No automatic merges, schema execution, GitHub write calls or deployment are permitted merely by publishing this document.

The later hosted checkpoint must independently prove an owner-authenticated canonical Accepted operation, optional original media stage/verification, complete non-retried fenced Git tree/branch/commit/advance/PR operations, independent D1 proof, security failures and reconciliation. Even VerifiedPr is not a Live app change: WP4 owns guarded merge, deployment and hosted release verification.
