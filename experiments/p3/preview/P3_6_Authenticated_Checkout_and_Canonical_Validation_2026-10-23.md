# FISH118 P3-6 — Authenticated exact-SHA sandbox checkout and canonical validation

**Date:** October 23, 2026. **Branch:** feature/fish118-p3-mock-publisher, draft [PR #263](https://github.com/ginosega/fishing/pull/263). **Scope:** Node source, tests and documentation only. No production, Pages publisher, AUTH-P0 Worker, deployed Cloudflare P3 Worker, GitHub App permission, private sandbox contents or deployed D1 was changed. No live sandbox write, PR, merge or release has occurred.

## Background

The [October 23 handoff](../../../Fishing_New_Chat_Handoff_2026-10-23_P3.md) identified a security gap: P3-5 proved local worktree consistency but did not authenticate GitHub as the origin of the exact source. This slice closes the missing source-only acquisition layer while preserving P3_WRITE_ENABLED=false and existing approvals.

## Code implemented

- [Authenticated sandbox checkout](../src/authenticated-sandbox-checkout.mjs): a trusted Node-only provider pins repository name ginosega/fishing-p3-sandbox and numeric ID 1430581407, and rejects client-controlled remotes, paths, branch names and SHA overrides. Uses GitHub App Contents-read token to verify the private repository, its main ref and immutable commit, then initializes a disposable Git worktree, fetches fixed main over token-authenticated HTTPS, compares FETCH_HEAD and checked-out HEAD to independently verified GitHub SHA, checks clean worktree and remote, and returns a tracked disposable checkout lease. Errors fail closed, delete temporary checkouts, and do not leak tokens.
- [Restricted read-only App issuer](src/sandbox-read-token.mjs): Node-only RSA App JWT, selected-repository owner/installation preflight, and installation access token restricted to one exact sandbox repository and Contents read. GitHub's implicit Metadata read is allowed; extra token permissions or repositories fail. No additional App permission was requested.
- [Trusted Node validation composition](../src/p3-trusted-node-validation.mjs): wires the issuer and checkout directly to P3-5 trusted candidate bridge and **actual** createCanonicalSourceAware implementation. It cannot accept an injected fake source promoter, offers no HTTP route, merge or GitHub write action, and cannot set a publication state to Live. Immutable submitted packages still come from the server-owned D1 store.

The Git credential helper contains code only, never the token. The token exists briefly in the Git child process environment, not source, persisted remote config, CLI arguments or HTTP responses. System/global Git configuration, interactive prompts and credential helper persistence are disabled. The temporary helper is stored inside Git metadata and removed.

## Tests and evidence

- [Authenticated checkout / canonical integration tests](../test/authenticated-sandbox-checkout.test.mjs): real temporary Git checkout and bare Git fixtures, mocked REST and Git transport; wrong repository ID, branch/main movement, wrong commit, substituted fetched SHA, bad origin/paths, credential-free Git config, cleanup ownership, real canonical Gear edit, source conflict, invalid taxonomy, broken Markdown and assembled App JWT-to-validator flow.
- [Read-only grant tests](test/sandbox-read-token.test.mjs): correct narrow App installation token, denied cross-repository/broader scopes, wrong owner, invalid installation status/config and GitHub mandatory Metadata-read compatibility.
- Existing P3-5 owner session, Origin/CSRF, D1 lease, branch-receipt, and canonical Gear/KB/media checks remain in separate tests. Mocked REST/Git transport and local Git are **not** a live authenticated checkout of the private populated sandbox. Its current main contains only README.

## Outstanding gates (not approved by this slice)

1. Introduce a minimal, nonproduction Gear/KB/Catches canonical fixture to the disposable private sandbox only after a separate live-write scope review. Avoid importing personal production Fishing content.
2. Add an exact-PR-head sandbox GitHub Actions validator and assess private-repository branch protection availability, costs, and missing Checks-read scope before any corresponding permission change.
3. Review/provision secure Node runner, P3 trusted owner OAuth session issuance, Worker/runner linkage, D1 migration 0002, operational audit/limits and crash recovery. No Node runner is deployed.
4. Require a separate authorization before the first real sandbox branch/PR write, first merge, production App installation or P8 cutover. Never claim Live without hosted release verification.

**Disposition:** P3-6 source code and integration tests added to draft PR #263. Automated test result must be checked at exact final commit. The Cloudflare preview remains write-disabled and all production/AUTH-P0 resources remain untouched.
