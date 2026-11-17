# WP3 / H1 isolated Pages owner/editor build — source-only acceptance

**Scope:** FISH-TODO-118 WP3 S0 source readiness. This is a complete **local/CI** candidate for the proposed dedicated `fishing-v3-wp3-test` Pages project. It is not hosted, deployed, approved for Cloudflare provisioning, write-enabled, or publicly Live.

## Immutable physical release

Build by explicit, non-default mode `--d6-wp3-hosted-candidate` together with `--d6-reader-candidate --d6-owner-connection-candidate --d6-owner-editor-preview`, `--base=/fishing/`, a caller-specified isolated `--out` and a pinned source SHA. The builder refuses any combination with WP2, static-only Stage A, incomplete reader/owner/editor flags, pending media or the ordinary production output. It preserves the V2 default, WP1 editor preview and WP2 staged builds.

The WP3 mode pins `d6Wp3Staging:true` into **both** `release.json` and its SHA256-signed manifest, and includes that bit in the content-addressed release ID. The browser bundle is built with `__FISHING_D6_WP3_STAGING__=true` and validates this distinct immutable release marker at bootstrap before granting the **read-only** reader. The reader accepts the *exact* `https://fishing-v3-wp3-test.ginosega.workers.dev/fishing/` origin (or deliberate test loopback), never WP2 or public V2; it rejects dual WP2/WP3/static flags. The one owner-session and canonical GitHub authoring-source browser clients use this same pinned origin, with staging-only source revisions explicitly separate from the immutable hosted Pages release. No client token or GitHub write method is introduced.

**The preserved WP1 editor preview is not production writer authorization.** H1's separate, source-only Worker entrypoint from #504 returns 404 for all operations/media routes and fails 503 if a server-side writer flag is switched on. Before H2, a separately reviewed owner-approved Worker and UI writer activation will still be required. No browser setting, release marker or D6 editor UI is an authorization to publish.

## Physical packaging and CI

`node pwa/tools/package-d6-static-pages.mjs --in=<verified-isolated-dist> --out=<unused-isolated-upload-dir> --mode=wp3-owner-preview` is a local-only transformation. The new mode requires exact WP3 markers on both pointer and manifest, reader + owner Connection Status + editor preview markers, no WP2/static/pending-media flags, no source/path overlap or symlink aliases to production, and successful full release verifier results **before and after** copying. Upload output contains only a single physical `fishing/` subtree. No project creation or deployment is supported.

`.github/workflows/fishing-production.yml` `validate-full` now builds the dedicated WP3 Pages output, independently verifies release/hash/counts and manifest, physically packages a second copy, independently verifies that copy, checks its pointer matches the source and rejects an extra root app. It retains **one source-only artifact** `d6-wp3-h1-pages-source-only` on PR runs for separately approved H1 execution. The upload-artifact action is *not* a Cloudflare upload or permission change; existing `deploy-full` and `deploy-content` behavior remain unchanged and skip PRs.

`WP3-PAGES01–06` cover exact reader origin/revision marker checks, owner/session canonical source origin, materialized `/fishing/` subtree, malicious/mixed/relabelled marker denials, failed release proofs, no production output or deploy path. Existing WP1 and WP2 source/release tests remain required.

## Follow-up approval

Requires exact-head `validate-full` and `fishing-merge-ready` PASS and separately verifying the retained H1 Pages artifact's release ID/source revision/manifest hashes. Then, and only then, present owner the **H1 read-only Cloudflare infrastructure** permission request from #503, with proposed Worker `fishing-v3-wp3-test`, Pages `fishing-v3-wp3-test`, new isolated AUTH_DB and WP3_DB, exact OAuth callback and server-only credentials. Actual provider IDs, D1 schema and host byte verification remain *unobserved*. H2 GitHub write permission, real provider PR test and H3 recovery acceptance each need their own later approvals.

Public V2 and accepted WP2 read-only environments are out of scope and untouched. The twelve WP3-owned matrix requirement IDs remain open for future hosted write/recovery proof, not for this CI artifact.
