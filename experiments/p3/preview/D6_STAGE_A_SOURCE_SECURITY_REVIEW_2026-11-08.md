# D6 Stage A — bounded source/security review

**Review date:** 2026-11-08. **Scope:** stacked source-only draft #393 (physical Pages packaging) and #394 (default-off static Worker). This review does not grant approval to deploy, merge, change Cloudflare, or write to the public V2 site.

## Evidence reviewed (bounded)

- Pages packager, package unit tests, and canonical release verifier in pwa/.
- Static Stage A Worker and its route/security unit tests in experiments/p3/preview/src and pwa/test.
- Stage A proposal: D6_STATIC_STAGING_STAGE_A_PLAN_2026-11-08.md.
- Exact-head #393 full CI [#42526449217](https://github.com/ginosega/fishing/actions/runs/42526449217) PASS; #394 full CI [#42529599618](https://github.com/ginosega/fishing/actions/runs/42529599618) PASS at 18c9b109cb6bdf245dbece34816353dd745cf7f5. These runs precede this security fix; **they do not attest this new branch**.

## Finding SR-01 — production-dist path guard (must fix)

**Severity:** pre-deployment source release blocker. The original packaging path check used inside(output,productionDist), which forbade a staging output *above* production pwa/dist but did not reject a destination *below* it. It also relied on lexical paths and could miss a parent symlink aliasing production or source.

**Change on this draft:** reject both descendants and ancestors of pwa/dist, reject nested/overlapping source/output trees, then independently repeat path checks against physical real paths including existing symlinked ancestors of as-yet-uncreated destinations. New D6-PACK06 through D6-PACK08 regressions deny production descendants, production source paths, symlinked destination aliases and symlinked source-parent aliases, without writing the forbidden output.

**Closure:** pending exact-head CI success. The CI packaging step already uses isolated dist-d6-static-staging to dist-d6-static-pages-upload; no provider resource was modified. Filesystem path safety assumes the checked directory tree is not maliciously changed concurrently between verification and final rename; do not run packaging in an untrusted writable worktree.

## Review controls retained from #394

- Worker defaults **OFF**. Requires the literal nonsecret enable flag and an exact, syntactically pinned immutable Pages deployment hostname under the proposed isolated Stage A project. Public production hostname and private D5 origins are not allowed.
- Only GET/HEAD and the scoped static release inventory under /fishing/ are forwarded. Auth, sessions, API, OAuth, media upload, publishing and admin routes do not reach upstream.
- No requester-supplied upstream origin; embedded query, fragment, encoded traversal/separators and unsupported methods are denied. Upstream redirects, failures and unexpected response URLs fail closed.
- Cookie, Location, auth and CORS response headers are not forwarded. No GitHub App token, D1, owner session, publishing service, custom domain or deployment workflow is introduced.

## Residual verification gates — NOT accepted as hosted

1. The Worker hostname pattern is a *syntax check*, not independent proof of an actual immutable Pages deployment, its Cloudflare account ownership, or the exact Git SHA. Collect and verify immutable deployment ID/hostname, Pages project and release receipts at deployment time.
2. The static path allowlist restricts to a release-id tree, not an in-Worker dynamically verified manifest membership list. The packaged local artifact is fully inventoried and hash-checked, but the **actual hosted** immutable Pages tree and Worker response bytes must be checked against the manifest and SHA (including all immutable assets, shell, loader, SW, errors and redirects) before Gate A acceptance. Treat unexpected responses as failure.
3. Prove /fishing/, /fishing/index.html, root redirect, scope and offline use against the actual isolated Worker origin, with independent negative-route probes and owner Android/Windows read-only acceptance.
4. No Stage A test Pages project or Worker deployment has been authorized or observed; keep public V2, D5 private Worker/Pages and device drafts untouched. Separate explicit owner approval is required for exact nonproduction provider targets, binding/deploy and later field verification. Do not attach production GitHub App credentials, writer access, D1, OAuth, public DNS or treat draft-branch SHA as canonical main.

## Disposition

**Source review:** SR-01 correction proposed, **await exact-head CI**. Source-only review is not a live/deployment approval. Once the revised PR is validated, report resolved finding separately, and ask for explicit staging resource/deploy approval before any provider action.
