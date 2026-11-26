# L01 — Owner-approved private V3 Add/Edit and standalone deployment

> **HISTORICAL — RETIRED NOV 26, 2026.** The private Worker has been retired; these commands and authorizations are no longer valid. Some resource bindings are now production. Do not execute this procedure. See [current application guide](../README.md) and [project router](../../PROJECT_ROUTER.md).


The owner approved one private deployment on November 23, 2026. The only target is the existing `fishing-d6-wp2-test` Cloudflare Worker with its existing O02 read-only snapshot config. Application PR #567 must remain open/draft and public V2 must not be changed.

Use the existing dedicated Windows checkout `$HOME\fishing-o02-private`. From **any PowerShell directory**, fetch the feature branch; stop on conflicts or errors:

```powershell
$Repo = Join-Path $HOME 'fishing-o02-private'
$Branch = 'feature/fish118-v3-direct-gear-save'
if (-not (Test-Path (Join-Path $Repo '.git'))) {
    if (Test-Path $Repo) { throw 'Private checkout path exists but is not a Git repository.' }
    git clone --single-branch --branch $Branch https://github.com/ginosega/fishing.git $Repo
    if ($LASTEXITCODE -ne 0) { throw 'Clone failed. Stop.' }
} else {
    git -C $Repo fetch origin $Branch
    if ($LASTEXITCODE -ne 0) { throw 'Fetch failed. Stop.' }
    git -C $Repo switch $Branch
    if ($LASTEXITCODE -ne 0) { throw 'Switch failed. Stop.' }
    git -C $Repo pull --ff-only origin $Branch
    if ($LASTEXITCODE -ne 0) { throw 'Fast-forward failed. Stop.' }
}
```

Confirm exact PR head and its successful CI, then supply its **full 40-character revision** to the preflight:

```powershell
& (Join-Path $Repo 'pwa\tools\d6-l01-private-deploy.ps1') -ExpectedRevision '<exact-40-character-head-SHA>'
```

After `L01 PRIVATE PREFLIGHT PASS`, the already approved private-only deployment is:

```powershell
& (Join-Path $Repo 'pwa\tools\d6-l01-private-deploy.ps1') -ExpectedRevision '<same-40-character-head-SHA>' -Deploy
```

Preflight checks exact clean source, Node.js 24, all old O02 private bindings and flags, software-only V3 release identity, Wrangler dry-run and read-only D1 inventory. No provider write occurs until `-Deploy`. Postflight verifies the hosted source SHA, software-only V3 release identity, and anonymous media/offline-snapshot denial. Expect `L01 PRIVATE DEPLOYMENT SMOKE PASS`.

**Stop on any failure.** Do not blindly retry an ambiguous deployment. Never share credentials, tokens or browser cookies.

After deployment, owner Windows Edge and Android PWA checks: Add Gear and Add KB with cover pictures and Notes images, KB Knot sequences, new Catch Notes images and inherited species picture, Replace/Remove picture preserving originals, new-item Save/Exit detail visibility, automatic record-owned paths after name/category/type changes, update/offline content and immutable current photos, and the deferred D01 yellow warning position directly under Save/Cancel. Log Edge/Android PASS/fail in FISH-TODO-118 issue #377. A01 public cutover remains unapproved.