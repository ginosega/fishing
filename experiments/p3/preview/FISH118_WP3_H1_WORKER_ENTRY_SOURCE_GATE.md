# FISH-TODO-118 WP3 — H1 isolated read-only Worker source candidate

**Source-only:** this is a *dedicated Cloudflare module Worker handler shape* for a future H1 read-only checkpoint. No Worker script, route, D1 database, Pages project, OAuth callback, secret, GitHub App permission or deployment was created or modified by this PR.

## Exact target

Proposed new script `fishing-v3-wp3-test` (not yet provisioned), proposed Worker origin `https://fishing-v3-wp3-test.ginosega.workers.dev` and proposed Pages `https://fishing-v3-wp3-test.pages.dev/fishing/`. These names must be owner-approved and independently verified before infrastructure execution. Neither the accepted WP2 read-only Worker nor public V2 is a target.

Entry module: `pwa/server/d6-wp3-h1-read-only-worker.mjs`. Its frozen Cloudflare-shaped default export has **only** `fetch(request,env)`; it shares the already validated `createD6ProductionRuntimeBindingContract` for original OAuth/PKCE, hashed owner session and canonical GitHub source reads.

### Fail-closed perimeter

The outer entrypoint itself demands `D6_WP3_H1_READ_ONLY_ENABLED=true` (separate H1-specific server-only approval/configuration, **default OFF**), exact WP3 HTTPS origin, repository numeric ID `1350909744`, owner numeric ID `265665562`, original D6 production global and gateway caps, WP3 read/Pages/profile pins and both WP2 switches not true. Missing/mismatched configuration yields HTTP 503 without a provider/D1 call. Wrong request origin yields 404.

Before invoking the read composition it **always** rejects every `/api/v3/operations` or `/api/v3/media` path with 404, regardless of method or OAuth state. **Any** active WP3 runtime/write/mount/isolated-write-profile switch causes the **entire H1 Worker to return 503**. H1 never imports the trusted WP3 publisher or provider-write token issuer. A future H2 server-side owner-approved write path requires **another source and CI review** and a new owner authorization; H1 cannot turn into a publisher through environment changes alone.

All session, signout, OAuth callback and canonical-source details still have the independent checks in the original D6 read runtime. No user-controlled query/Origin/header changes the configured target or provides permission to run a writer.

### Tests and next gate

`WP3-H1W01–06` verify global-off read and write denials; exact proposed Pages GET without leaking a bearer token; operation/media 404 even with owner OAuth flags; blanket denial for any accidental writer-enabled flag; public/WP2/mixed-profile and foreign-origin denial; revocation; and default Worker exports no secret or publisher interfaces.

This candidate **does not itself confirm** that the existing owner UI, immutable release, complete hosted asset hashes or OAuth callback are ready at the proposed Pages/Worker origins. Follow-up source-only tasks: a dedicated `/fishing/` WP3 owner/editor build with exact release and packaged asset evidence; owner-approved H1 Cloudflare configuration and deployment receipt. Existing PR #503 separates that owner permission gate from H2 GitHub writes, H3 fault recovery and WP4 verified public Live.
