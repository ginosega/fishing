# O03 — Owner-approved private deployment and field acceptance

## Approved scope

The owner approved the **private O03 deployment and validation** on 2026-11-22 Pacific. Use ONLY the existing isolated Worker `fishing-d6-wp2-test`, unchanged O02 Wrangler config `pwa/wrangler.o02-private.jsonc`, original D1/R2/Images bindings and authenticated `/fishing/` application. No new Worker flag or provider resource is required: O03 changes only a separately gated app + service worker reader and matching release/manifest identity. No D1/R2 media writes, public V2 deployment, app/governance merge, public V3 release or V2 device cleanup.

The source-only O03 implementation and regression suite live in open draft [app PR #567](https://github.com/ginosega/fishing/pull/567). Before executing deployment, verify that the **latest exact PR head** matches the successful CI commit and that required checks passed. `-ExpectedRevision` must be the **complete 40-character** approved source SHA.

## Owner Windows PowerShell: from ANY current directory

The existing checkout from O02 is reused at `$HOME\fishing-o02-private`. No `cd` or `Set-Location` is required or permitted in owner instructions. This preparation block can also clone that checkout if it does not yet exist:

```powershell
$Repo = Join-Path $HOME 'fishing-o02-private'
$Branch = 'feature/fish118-v3-direct-gear-save'
if (-not (Test-Path (Join-Path $Repo '.git'))) {
    if (Test-Path $Repo) { throw 'O03 checkout path exists but is not a Git repository.' }
    git clone --single-branch --branch $Branch https://github.com/ginosega/fishing.git $Repo
    if ($LASTEXITCODE -ne 0) { throw 'O03 clone failed; stop.' }
} else {
    git -C $Repo fetch origin $Branch
    if ($LASTEXITCODE -ne 0) { throw 'O03 fetch failed; stop.' }
    git -C $Repo switch $Branch
    if ($LASTEXITCODE -ne 0) { throw 'O03 checkout failed; stop.' }
    git -C $Repo pull --ff-only origin $Branch
    if ($LASTEXITCODE -ne 0) { throw 'O03 fast-forward failed; stop.' }
}
```

Preflight **only** (use the latest verified exact-head SHA at the time you execute):

```powershell
& (Join-Path $Repo 'pwa\tools\d6-o03-private-deploy.ps1') -ExpectedRevision '<verified-40-character-SHA>'
```

Require `O03 PRIVATE PREFLIGHT PASS`. The script selects the `pwa` directory using its own `$PSScriptRoot`; checks clean exact Git source, Node 24, immutable release/manifest `d6OfflineContentReading` + every earlier private flag, exact D1/media/Images/owner Worker bindings, Wrangler dry-run and read-only live D1 counts. It does not deploy without `-Deploy`.

Approved deployment, only **after that preflight**:

```powershell
& (Join-Path $Repo 'pwa\tools\d6-o03-private-deploy.ps1') -ExpectedRevision '<same-verified-40-character-SHA>' -Deploy
```

Require `O03 PRIVATE DEPLOYMENT SMOKE PASS`: hosted release ID and source match, O03/O02 flags present, anonymous media and current snapshot requests deny (403). If any command fails or the deploy result is ambiguous, stop and share the sanitized error output; do not blindly retry a possibly in-progress deploy. Never paste secrets, auth cookies or tokens.

## Field acceptance: Windows Edge, then installed Android PWA

Use the owner-only `https://fishing-d6-wp2-test.ginosega.workers.dev/fishing/` origin; **do not test public V2**.

1. **Prepare updated software first:** In Automatic and signed-in, open Connection Status → Update/Prepare Offline Library. This may download the new O03 immutable software release even if O02 content snapshots have not changed. Require completion and a verified Ready message. Do not switch to Work Offline until this succeeds.
2. **Windows Edge Work Offline:** Select Work Offline. The app should reload and display the *current V3 content*: Gear/KB/Catches, Notes Markdown, photos, Gear covers, Knot frame sequences and Catch/KB links; none should rely on frozen V2 content. In Edge Network, no live `/api/v3/` D1/R2 requests should occur while Work Offline. Existing read-only safeguards block Save/Publish; do not make a real provider write in this mode.
3. **Offline restart:** With Work Offline selected, disconnect Wi-Fi/network, close/reopen the installed PWA or Edge tab and navigate among Gear/KB/Catches/Notes/photos; the selected current snapshot must survive restart with no network. Restore network; choose Automatic and verify the current online D1 view returns. An open dirty editor must not be discarded merely by a mode change.
4. **Android installed PWA:** Repeat Update/Prepare, Work Offline navigation including an image, a Knot sequence and Notes, disconnected restart and Automatic recovery. The offline library must remain read-only and not silently fall back to release-bound V2 content. Any visible error or missing image is a failure to investigate, not something to work around by clearing browser storage.
5. **Retained content:** In Automatic, a repeated Update without source changes should report up-to-date. O03 content-cache corruption/eviction denial is covered by source tests; **do not intentionally corrupt caches or clear site data on owner devices** for field testing.

Record Edge/Android PASS or failures, release/source identity and precise displayed errors in [issue #377](https://github.com/ginosega/fishing/issues/377).

**Boundary:** Source CI and deployment smoke are not device acceptance. O03 is not owner-closed until verified browsing on both devices. D01/L01/A01 remain open; final V3 will contain **zero** V2 compatibility, reuse or cleanup code. Removal of V2 device storage is manual and entirely outside V3 after final cutover approval.
