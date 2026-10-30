# FISH118 D2: derive a LOCAL owner-only, ONE-fixture acceptance configuration.
# Enables only guarded acceptance and read-only GitHub source validation.
# Runner and hosted test paths remain OFF; Cron remains EMPTY.
# Never deploys or reads secrets/PEM. Run from experiments/p3/preview.
$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$source=Join-Path $root 'wrangler.d2-sandbox.local.jsonc'
$target=Join-Path $root 'wrangler.d2-submit.local.jsonc'
if (-not (Test-Path -LiteralPath $source)) {throw 'Missing reviewed sandbox local config.'}
if (Test-Path -LiteralPath $target) {throw 'Submission local config already exists; inspect it before replacing.'}
$c=[System.IO.File]::ReadAllText($source)
if ($c -notmatch '"name"\s*:\s*"fishing-auth-p0-test"' -or
    $c -notmatch '"D2_SANDBOX_REPO_ID"\s*:\s*"1430581407"' -or
    $c -notmatch '"D2_GITHUB_APP_ID"\s*:\s*"5436811"' -or
    $c -notmatch '"D2_GITHUB_INSTALLATION_ID"\s*:\s*"174361658"' -or
    $c -notmatch '"triggers"\s*:\s*\{\s*"crons"\s*:\s*\[\s*\]' -or
    $c -notmatch '"compatibility_flags"\s*:\s*\[\s*"global_fetch_strictly_public"\s*\]') {
    throw 'Sandbox config identity, empty Cron, or host-proof settings changed.'
}
foreach($flag in @('D2_WRITE_ENABLED','D2_RUNNER_ENABLED',
    'D2_READ_TOKENS_ENABLED','D2_TEST_HOST_ENABLED')) {
    $pattern='"'+$flag+'"\s*:\s*"false"'
    $matchesFound=[regex]::Matches($c,$pattern)
    if ($matchesFound.Count -ne 1) {throw "Expected exactly one hard-OFF $flag."}
}
$c=[regex]::Replace($c,'"D2_WRITE_ENABLED"\s*:\s*"false"',
    '"D2_WRITE_ENABLED": "true"')
$c=[regex]::Replace($c,'"D2_READ_TOKENS_ENABLED"\s*:\s*"false"',
    '"D2_READ_TOKENS_ENABLED": "true"')
if ($c -notmatch '"D2_RUNNER_ENABLED"\s*:\s*"false"' -or
    $c -notmatch '"D2_TEST_HOST_ENABLED"\s*:\s*"false"' -or
    $c -notmatch '"triggers"\s*:\s*\{\s*"crons"\s*:\s*\[\s*\]' -or
    $c -match '"D2_GITHUB_APP_PRIVATE_KEY"\s*:') {
    throw 'Submission safety gates failed.'
}
[System.IO.File]::WriteAllText($target,$c,(New-Object System.Text.UTF8Encoding($false)))
Write-Output 'PASS: Owner-authorized sandbox Gear acceptance + source reads enabled locally.'
Write-Output 'PASS: Runner OFF, hosted proof OFF, Cron EMPTY; public fishing repo remains out of scope.'
Write-Output 'PASS: No secret read, network call, D1 mutation, or Worker deployment.'
