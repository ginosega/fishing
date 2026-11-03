# FISH118 D5 — isolated Pages reader: staged-only runbook

Prepared 2026-11-03. **SOURCE REVIEW ONLY; NO CLOUDFLARE SITE CREATED OR DEPLOYED.** See GitHub issue #341.

## Scope

Separate Cloudflare Pages Direct Upload temporary origin, at its assigned `https://<approved-project>.pages.dev/fishing/__v3_reader_candidate__/`. The candidate is **public read-only**, no owner OAuth or publishing. Public V2, current installed V2, the D3 private Worker, and their service workers and routes remain untouched. This is not a substitute for final integrated installed owner-PWA acceptance.

## Source review and build gate

Before any hosting, incorporate the adjacent `pwa/tools/prepare-v3-reader-pages.mjs` and `pwa/test/prepare-v3-reader-pages.test.mjs` into a narrowly scoped development PR based on `feature/fish118-p3-mock-publisher`; verify full exact-head CI and original source integrity. **Do not treat this downloaded candidate as a reviewed GitHub commit.** The six fixture tests cover packaging only, not a full real-source build.

After the code is reviewed and merged to the development branch, obtain its exact 40-hex HEAD and ensure a clean Windows checkout. From the `pwa` directory:

```powershell
$ErrorActionPreference = 'Stop'
if (git status --porcelain) { throw 'Working tree is not clean' }
$Head = (git rev-parse HEAD).Trim()
$Candidate = "$HOME\fishing-v3-reader-candidate"
$Stage = "$HOME\fishing-v3-pages-staged"
if ((Test-Path $Candidate) -or (Test-Path $Stage)) { throw 'Existing directories: stop, do not overwrite' }
npm.cmd ci --no-audit --no-fund
node .\tools\build.mjs '--base=/fishing/__v3_reader_candidate__/' --v3-reading-mode --v3-reader-candidate "--out=$Candidate" "--source-revision=$Head"
node .\tools\verify.mjs "--out=$Candidate"
node .\tools\prepare-v3-reader-pages.mjs "--candidate=$Candidate" "--out=$Stage" "--expected-source=$Head"
node .\tools\prepare-v3-reader-pages.mjs "--audit-only=$Stage" "--expected-source=$Head"
```

The CLI invokes the canonical `verify.mjs` before creating any output. It refuses incorrect release identity/base, pending media, wrong file hashes, unmanifested files, forbidden dynamic server assets, unsafe symlinks, an existing destination and manifest scope mismatch. It copies all verified output beneath `fishing/__v3_reader_candidate__/`. Root upload directory contains only that path plus `404.html`, `_headers` and `robots.txt`; no deployment commands are embedded.

## Approval gate — STOP HERE

Record exact reviewed source commit, canonical verification results, release ID, file-count/bytes, full proposed Pages project name, assigned origin and cleanup plan. Obtain **specific owner approval** before creating or deploying any Cloudflare project. No new permissions/secrets/custom domain/Cloudflare route changes are included.

## After separate approval only

Use Cloudflare Pages Direct Upload to create exactly the named temporary project and upload only the independently re-audited `$Stage` directory. The correct Pages hostname must be returned by Cloudflare, never inferred. The `404.html` prevents Pages' implicit SPA fallback, and `_headers` applies noindex/nosniff/referrer policy to static responses. Noindex is not access control: the test site is public.

Verify actual hosted bytes and release identity using independent HTTP GET hashes for `release.json`, manifest, `index.html`, `sw.js`, `app.js`, CSS, JSON bundle, and sample original Notes image. Verify that `/`, `/fishing/`, `/__d3_pilot__/`, `/auth/start`, `/api/v3/`, unknown assets and traversal do **not** serve candidate app content. Check MIME, exact service-worker scope, manifest start/scope and unchanged V2 origin before Android installation. If anything differs, stop instead of patching existing V2 routes.

## Android read-only acceptance checklist

Record date/time, source SHA, release ID, Android and Chrome version, exact test-origin and PASS/FAIL/NOT TESTED for:

1. Reader-only banner and Gear/KB/Catch content; no Edit/Save or live owner sign-in.
2. Automatic on first visit, explicit Prepare, then Ready with complete verified file count.
3. Work Offline persisted after closing/relaunch; disconnected Gear/KB/Catch/images load; return to Automatic.
4. Missing/offline library reports honest state; no release mixing. Avoid destructive cache-tamper tests on the phone.
5. Opt-in Notes images open original quality and caption; untagged images and linked images retain their behavior.
6. Copy Diagnostics succeeds or provides manual copy, without credentials, operation IDs or private drafts.
7. Existing V2 installed app operates unaffected; uninstall/clear separate temporary test PWA data afterward.

Production installed-owner OAuth/session integration and draft restoration issue #342 remain separate. Final V3-SAVE-09 public 60-second delivery and V3 cutover remain OPEN.

## Rollback / cleanup

Stop after failure; do not automatically repeat uploads. Delete **only** the temporary Pages project after separate owner consent and uninstall the temporary test PWA. Never delete or alter public V2 hosting, the existing owner-auth Worker, or their service workers.

Official docs: https://developers.cloudflare.com/pages/get-started/direct-upload/ ; https://developers.cloudflare.com/pages/configuration/serving-pages/ ; https://developers.cloudflare.com/pages/configuration/headers/ .
