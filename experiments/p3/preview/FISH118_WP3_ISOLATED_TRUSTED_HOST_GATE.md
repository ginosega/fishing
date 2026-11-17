# FISH-TODO-118 WP3 — one isolated trusted OAuth + publishing host (source-only)

**Status:** Source composition only; not a deployable Worker, configured Cloudflare resource, OAuth callback grant, database migration, App installation/write grant, or hosted acceptance.

**Dependency:** PR #501 source-only exact-head CI PASS `2bc3d0b33620a69d915505cf1099feaf8991710b`; all prior source PRs remain draft/unmerged. This candidate reuses the existing #497 source-only trusted publishing host, #500 independently fenced origin boundaries, and #501 separate same-origin OAuth/read profile.

## Owner-proposed fixed origin and page pairing

- WP3 proposed Worker origin: `https://fishing-v3-wp3-test.ginosega.workers.dev`
- WP3 proposed Pages base: `https://fishing-v3-wp3-test.pages.dev/fishing/`
- This pair is a **candidate**, not a confirmed existing Cloudflare resource. Do not deploy or register an OAuth callback until the owner separately approves these exact values.
- Existing WP2 staged Worker remains read-only: `https://fishing-d6-wp2-test.ginosega.workers.dev`. Existing public V2 origin remains unchanged: `https://fishing.ginosega.workers.dev`.

## Unified (not duplicate) architecture

`createD6ProductionWp3TrustedHostCandidate` now selects from a trusted Worker `env.D6_ORIGIN`: the previously reviewed production profile, unchanged, or the exact proposed WP3 isolated origin. Any other host is ineligible for writes. It composes `createD6ProductionRuntimeBindingContract` for the **same** origin first, preserving the original OAuth PKCE, Github owner verification, D2 host-only session cookie/CSRF, canonical snapshot READ and Pages release probe. It uses the original WP3 trusted source-review, Accepted operation receipt/D1 lifecycle, signer, narrowly scoped GitHub App installation tokens, original-media upload proof and signed ticket, atomic Git tree, five-step PR writer and one-step Unknown-fenced publisher. There is no second login, alternate privileged provider, new API, browser token, or automatic retry.

The isolated profile requires ALL existing global/repo/owner/gateway/session/runtime/write/mount flags AND the **additional server-only, literal string** `true` gates: `D6_WP3_ISOLATED_READ_ENABLED`, `D6_WP3_ISOLATED_PAGES_ENABLED`, `D6_WP3_READ_PROFILE_ENABLED`, `D6_WP3_ISOLATED_WRITE_PROFILE_ENABLED`, `D6_STATIC_ENABLED`, `D6_OAUTH_ENABLED`, `D6_SOURCE_ENABLED`, `D6_READ_TOKEN_ENABLED`, `D6_SIGNER_ENABLED`, `D6_SESSION_ENABLED`. Both older WP2 flags `D6_WP2_STAGING_ENABLED` and `D6_ISOLATED_PAGES_ENABLED` must not equal `true`. Independently, the trusted host must receive `ownerApproval()===true` and every GitHub outbound provider step still requires `authorizeStep` and a durable Unknown D1 fence. Neither approval callback exists as an HTTP or browser control.

The selected origin is passed to `createD2UnifiedOwnerSession`, `createD6ProductionPublishIntake`, the direct operation/media routes, the single gateway, and the HMAC media ticket issuer/verifier. A valid public-origin cookie, media ticket or CSRF token is not accepted for the isolated host; revoking the source-only gate disables the host before WP3 D1 schema inspection or any GitHub grant. The canonical snapshot loader uses **staging** main-vs-hosted revision handling only in the isolated profile because the immutable Pages release is separate from the live repository main; it still pins the trusted canonical `main` ref/commit/tree and verifies the main ref has not moved. Source publication remains a **VerifiedPr**, not `Live` or a claim that Pages bytes have deployed.

The existing ten-table read-only WP3 schema introspection is retained as a prerequisite before any D1 write attempt or token issue. A distinct `AUTH_DB` (host-only owner session/PKCE) and `WP3_DB` (publishing receipts/Unknown fences) must be provisioned and bound explicitly in the future, with no WP2 credential reuse. No migration or D1 initialization occurs here.

## Evidence and acceptance boundaries

New `WP3-ISOHOST01–07` tests exercise: isolated same-host Pages read with write routes absent before owner approval; actual D2 session/CSRF protection and independently missing WP3 schema denial; original media route denial; wrong/mixed WP2/WP3/public profiles; original OAuth PKCE callback, valid owner session and still no publishing without approval; revocation; incomplete D1 schema denial. Existing #497 HOST01–10 and #500/#501 tests remain applicable. No test performs an authorized GitHub provider mutation.

## Next separately approved hosted checkpoint

1. Confirm and approve exact dedicated Cloudflare Worker and Pages names, immutable uploaded Pages build source/release/manifest, and GitHub OAuth application callback for the WP3 origin. Do NOT retarget the active WP2 hosted site or public V2.
2. Review a bounded Cloudflare provision/verification plan: new private `AUTH_DB`, isolated `WP3_DB` with the exact ten-table schema and existing required indexes, and server-only AES/HMAC/App/OAuth/CSRF material; inspect all schema before setting any write switches. Preserve separate kill switches and a strictly isolated Worker script.
3. Approve exact minimally scoped GitHub App install/read/write permissions (contents write only for the controlled source branch and pull request write only for PR creation). Keep user controls separate; no GitHub main merge or public release.
4. Perform security denial probes in the approved hosted environment BEFORE granting a write token: anonymous, foreign owner, invalid CSRF, wrong origin, wrong method, missing D1 table, retired OAuth session, host/mount/writer switches OFF.
5. Only after explicit *separate* owner authorization of this checkpoint, conduct one bounded controlled real GitHub PR publication for a synthetic or owner-approved non-destructive record; independently GET-verify Git blob/root tree, branch, commit and PR; then inject duplicate/stale-source/ambiguous HTTP/lost-ack/reconciliation and original-media tests. No automatic blind retry. Close WP3's twelve matrix rows only on verified provider and owner evidence.
6. Keep WP4 Save→verified public Live, WP5 complete private RC field acceptance, and WP6 cutover separately owner gated. Public V2 remains unchanged until WP6.

**Never interpret source-only CI, a GitHub 201, D1 Accepted/Unknown, or VerifiedPr as public Live.**
