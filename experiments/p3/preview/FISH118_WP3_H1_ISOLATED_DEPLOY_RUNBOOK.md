# FISH-TODO-118 WP3 H1 — isolated read-only Pages and Worker deploy runbook

**Owner approval:** H1 isolated non-writable Cloudflare resources only, 2026-11-14. **Deployment status:** commands are a proposed operator sequence, not evidence that any upload happened. Source remains draft/unmerged. No GitHub permissions change, publisher, media API, WP2 redeployment, public V2 change, app-main merge, H2/H3 authorization or public cutover.

## Verified starting evidence

- New isolated Pages project `fishing-v3-wp3-test` exists (owner Wrangler inventory).
- New AUTH_DB D1 `fishing-v3-wp3-auth-test`, `0d8da698-87b8-4b5e-a1e7-fe6de49e5afc`, successfully executed the exact AUTH-P0 4-statement schema. Owner postflight sees `auth_flows` and `sessions`, plus Cloudflare-managed `_cf_KV`.
- New WP3_DB D1 `fishing-v3-wp3-operations-test`, `5a47841e-7874-4ec8-9fa8-be0315f6a802`, successfully executed 11 SQL statements (10 tables and partial index); owner postflight shows all 10 expected `d6_...` tables and the partial `d6_operation_active_record` unique index and unique owner/idempotency autoindex.
- The **indexed columns** have **not yet been field verified**: complete the two `PRAGMA index_info` checks below. Do not infer from `index_list` alone.
- #505 exact-head application CI #43639313066 PASS, deploy SKIPPED. GitHub Actions artifact `d6-wp3-h1-pages-source-only` (ID 14131686081; expires 2026-11-28). Immutable release `14ca85788af5a057933f74d85b242566`, 575 files, 100 Gear/60 KB/12 Catches, pending media zero. IMPORTANT: release.sourceRevision `75978eaf787f9964bc645cbc8113f5be0213fd2d` (test-merge SHA), not #505 head `b73a2cb0fc8b474aec3c3623b9a728a1aba0ad83`.
- #507 exact-head SQL CI #43650853389 PASS, artifact ID 14135954799; owner migrated only the two isolated D1s above.
- #508 provides a source-only Worker config for this dedicated script plus security tests. **Do not deploy until #508 exact-head required CI succeeds.**

## 1. Final read-only D1 uniqueness column checks

```powershell
npx wrangler d1 execute fishing-v3-wp3-operations-test --remote --command="PRAGMA index_info('d6_operation_active_record');"
npx wrangler d1 execute fishing-v3-wp3-operations-test --remote --command="PRAGMA index_info('sqlite_autoindex_d6_operation_receipts_2');"
```

Expected first index columns `owner_github_id,domain,record_id`; second index `owner_github_id,idempotency_key`. If either differs, **STOP** without editing source or D1. These checks complete the index portion, not the full Worker-bound D1-readiness test.

## 2. Exact CI Pages artifact staging (NO deployment until byte preflight verified)

In GitHub [run #43639313066](https://github.com/ginosega/fishing/actions/runs/43639313066), download artifact `d6-wp3-h1-pages-source-only`. Extract to a new empty folder, e.g. `$HOME\fishing-wp3-h1-pages`. ZIP root must contain **one** `fishing\` physical subdirectory, NOT the files directly at root. Then:

```powershell
$pages = Join-Path $HOME "fishing-wp3-h1-pages"
$p = Get-Content (Join-Path $pages "fishing\release.json") -Raw | ConvertFrom-Json
if ($p.id -ne "14ca85788af5a057933f74d85b242566" -or
    $p.sourceRevision -ne "75978eaf787f9964bc645cbc8113f5be0213fd2d" -or
    $p.d6Wp3Staging -ne $true -or $p.d6Wp2Staging -eq $true -or
    $p.d6ReaderCandidate -ne $true -or
    $p.d6OwnerEditorPreview -ne $true -or $p.pendingMedia -ne $false) {
    throw "Incorrect WP3 Pages immutable release"
}
if ($p.manifest -ne "releases/$($p.id)/manifest.json") {
    throw "Unexpected WP3 Pages manifest path"
}
if (!(Test-Path (Join-Path $pages "fishing\index.html")) -or
    (Test-Path (Join-Path $pages "index.html"))) { throw "Unexpected Pages physical root" }
Write-Host "PASS: expected WP3 Pages release identity"
```

If present and correct, execute **only** the dedicated WP3 Pages upload:

```powershell
npx wrangler pages deploy "$pages" --project-name fishing-v3-wp3-test --branch main --commit-hash 75978eaf787f9964bc645cbc8113f5be0213fd2d
if ($LASTEXITCODE -ne 0) { throw "WP3 Pages deployment failed" }
```

This is a Cloudflare write, but within the owner's approved **isolated H1 read-only** target. Do not substitute `fishing-v3-d6-static-test` or public V2. Record deployment ID/version and the **verified** release:

```powershell
npx wrangler pages deployment list --project-name fishing-v3-wp3-test
$hosted = Invoke-RestMethod -Uri "https://fishing-v3-wp3-test.pages.dev/fishing/release.json" -Method Get
$hosted | Select-Object id,sourceRevision,d6Wp3Staging,d6OwnerEditorPreview,pendingMedia
```

**Field correction (2026-11-14):** The immutable `release.json` pointer uses `id`, **not** `releaseId`. The WP2 marker is omitted altogether when false. The per-asset manifest intentionally contains both root assets (`index.html`, `loader.js`, etc.) **and** immutable `releases/<id>/...` paths. Never require every manifest entry to start with `releases/`; follow the canonical `pwa/src/release.mjs` manifest contract. The original operator's initial checks failed because of these verifier assumptions; corrected local verification eventually reported PASS for all 575 local file hashes.

**Owner-reported hosted receipt:** the operator compared hosted `https://fishing-v3-wp3-test.pages.dev/fishing/release.json` SHA256 to the exact verified local file and reported **PASS**; the sourceRevision and WP3 flag match. The pasted output displayed `releaseId` (blank) instead of `id`, because that select-field was wrong. Successful Pages deployment output/ID was not pasted, and no full hosted-manifest/575-asset readback has yet been shown. Treat this as hosted pointer proof only. Next run independent SHA256 checks of the hosted manifest and all 575 hosted assets, and preserve count/failure evidence before moving to the Worker.

**Full hosted-asset verifier field finding:** Owner's read-only 577-file PowerShell verifier stopped on HTTP 308 before completing the first 50 files, with no reported asset hash mismatch. Cloudflare Pages normally redirects `/fishing/index.html` to canonical `/fishing/`. Windows PowerShell's `Invoke-WebRequest` may reject that 308 instead of following it. For the ONE manifest entry `index.html`, read exact `https://fishing-v3-wp3-test.pages.dev/fishing/` and compare those returned bytes against the manifest's **index.html** size/SHA256. For every other manifest path, request its exact URL under the same pinned Pages base; reject/diagnose any other redirect, never bypass SHA256 or allow cross-origin redirect. The entire remote manifest+575-assets check remains PENDING until 577/577 hash matches are observed. Record first failed relative path/URL, but never log credentials or secret headers.

Check the hosted release identity and required release/manifest bytes; a successful upload alone is **not** full hosted hash validation. Do not launch H1 Worker if hosted release does not match.

## 3. Build and deploy only the dedicated H1 read-only Worker

After #508 exact-head CI PASS, obtain that branch in an empty local folder and run:

```powershell
git clone --single-branch --branch feature/fish118-wp3-h1-read-only-deployment https://github.com/ginosega/fishing.git "$HOME\fishing-wp3-h1-deploy"
Set-Location "$HOME\fishing-wp3-h1-deploy"
npm ci --prefix pwa --no-audit --no-fund
npx wrangler deploy --config pwa/wrangler.wp3-h1.jsonc --dry-run
```

The JSONC pins script `fishing-v3-wp3-test`, exact Worker origin, two D1 IDs/bindings, Pages read proxy, owner/repo IDs, **all GitHub OAuth/session/source flags OFF and all WP3 publisher flags OFF**. No token/App private key/OAuth client secret is present. Check the dry-run bundle and the name/bindings against the source and owner-provided D1 UUIDs. Only when verified:

```powershell
npx wrangler deploy --config pwa/wrangler.wp3-h1.jsonc
if ($LASTEXITCODE -ne 0) { throw "Dedicated WP3 H1 Worker deploy failed" }
```

At this stage, public static proxy may serve the verified WP3 Pages release but all owner login and canonical source endpoints are **deliberately disabled** until the separate H1 **read-only credentials and callback** stage. Operation and media endpoints must always return 404, even after owner login. Any non-false writer flag makes the entire H1 Worker return 503.

**Critical:** Follow this runbook stepwise with owner-reported provider receipts before advancing. In H1 OAuth/account read activation, add GitHub App only with `contents:read`, select ONLY `ginosega/fishing`, and never store secret values in chat, GitHub PRs or public logs. The OAuth callback must be exact `https://fishing-v3-wp3-test.ginosega.workers.dev/auth/callback`. No H2 app write scope or synthetic mutation is approved.

## 4. Acceptance stop conditions

Any unexpected database/index columns, wrong release test-merge SHA, wrong origin, wrong Pages root, unverified asset bytes, OAuth issuer/client mismatch, failed secret validation, added publishing route, or GitHub write permission is a FAIL/STOP, not permission to retry with bypasses. Preserve prior WP2 and public V2. All H1 hosted read and owner Edge field evidence must be recorded before seeking separate H2 authorization.
