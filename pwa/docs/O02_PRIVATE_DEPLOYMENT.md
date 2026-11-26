# O02 — owner-approved private deployment and field verification

> **HISTORICAL — RETIRED NOV 26, 2026.** The private Worker has been retired; these commands and authorizations are no longer valid. Some resource bindings are now production. Do not execute this procedure. See [current application guide](../README.md) and [project router](../../PROJECT_ROUTER.md).


## Approval and boundaries

Owner approved **the private O02 deployment** on 2026-11-22 Pacific. This approval covers only the previously accepted test Worker `fishing-d6-wp2-test` and its matching owner-only `/fishing/` immutable UI release. No public V2, main/governance merge, new Cloudflare resource, bulk data migration, R2 mutation, or anonymous public V3 cutover.

O02 source gate: [draft PR #567](https://github.com/ginosega/fishing/pull/567). Confirm its **exact latest head** and successful corresponding CI before any deployment. The new read-only `/api/v3/content/offline-snapshot` endpoint requires the existing owner session, existing private media gates, and `D6_O02_OFFLINE_SNAPSHOT_ENABLED=true`. The client must have `--d6-o02-offline-content` with matching release and manifest flags. The unchanged M02/M03 config and deployment script remain separate.

## Owner Windows deployment (no credentials shared)

From **any PowerShell directory**, use a dedicated checkout at `$HOME\fishing-o02-private`. These commands handle checkout location themselves. The deployment script uses `$PSScriptRoot` to select its own `pwa` directory, so you never need to run `cd` or `Set-Location`.

```powershell
$Repo = Join-Path $HOME 'fishing-o02-private'
$Branch = 'feature/fish118-v3-direct-gear-save'
if (-not (Test-Path (Join-Path $Repo '.git'))) {
  if (Test-Path $Repo) { throw 'O02 checkout path exists but is not a Git repository.' }
  git clone --single-branch --branch $Branch https://github.com/ginosega/fishing.git $Repo
  if ($LASTEXITCODE -ne 0) { throw 'O02 clone failed; stop.' }
} else {
  git -C $Repo fetch origin $Branch
  if ($LASTEXITCODE -ne 0) { throw 'O02 fetch failed; stop.' }
  git -C $Repo switch $Branch
  if ($LASTEXITCODE -ne 0) { throw 'O02 checkout failed; stop.' }
  git -C $Repo pull --ff-only origin $Branch
  if ($LASTEXITCODE -ne 0) { throw 'O02 fast-forward failed; stop.' }
}
```

Copy the **40-character** verified SHA from the current exact-head CI checkpoint into `-ExpectedRevision`. First run the non-mutating preflight:

```powershell
& (Join-Path $Repo 'pwa\tools\d6-o02-private-deploy.ps1') -ExpectedRevision <verified-full-40-character-SHA>
```

Only after `O02 PRIVATE PREFLIGHT PASS`, run the separately approved deployment, still from **any** PowerShell directory:

```powershell
& (Join-Path $Repo 'pwa\tools\d6-o02-private-deploy.ps1') -ExpectedRevision <same-verified-full-40-character-SHA> -Deploy
```

The script requires exact source, clean tracked files, Node.js 24, unchanged private origin, D1/R2/Images bindings and secrets, prior M02/M03 flags, correct release/manifest identities, source build validation, Wrangler dry-run, and **read-only live D1 totals**. Only after these pass and `-Deploy` is present does it deploy the *existing* private Worker. It then checks hosted source/release identity, anonymous media denial, and anonymous snapshot denial (expected 403).

If a command fails, **stop** and report its output. Do not automatically rerun a possibly in-flight deployment. Never paste Cloudflare credentials or session cookies.

## Owner acceptance after a successful smoke

On Windows Edge and the installed Android PWA, verify the signed-in owner in Automatic mode, open Connection Status, click Prepare/Update:

1. Existing software verification may still display its normal progress; O02 image preparation then shows increasing `N/total images` counts. Second line changes from checking to reusing/downloading to verifying; Ready is shown only after verification.
2. Repeat the action without changing any image. Expect `Offline library is already up to date.` and no redundant R2 downloads.
3. Confirm Gear cover images, Knowledge Base photos/Knots, Catch Notes pictures and existing M03 thumbnails/viewer behavior stay intact. A failed update must not destroy a previous verified library.
4. On both devices, verify Work Offline does not create D1 or R2 network requests. **Do not claim current-content offline browsing is complete:** routing Work Offline reading to the new content generation is **O03**, not O02.

Capture the reported hosted release ID, source revision, success/failure messages, any image counts, and Android/Edge outcomes in issue #377. Avoid provider writes or old-publisher workflows.

**Exit rule:** Passing source CI or the deployment smoke is not O02 owner field acceptance, not O03 current-content offline acceptance, and not permission to merge PR #567.
