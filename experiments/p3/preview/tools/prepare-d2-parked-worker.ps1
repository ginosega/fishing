# FISH118 D2 post-success operator handoff.
# Prepare a LOCAL, inert Worker configuration only when the single sandbox
# operation is durably Live with the exact immutable GitHub merge and test
# hosted release receipt. Do not redeploy the verified public PWA.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$source = Join-Path $root 'wrangler.d2-hosted-final.local.jsonc'
$target = Join-Path $root 'wrangler.d2-parked.local.jsonc'
if (-not (Test-Path -LiteralPath $source)) { throw 'Missing currently deployed Worker config.' }
if (Test-Path -LiteralPath $target) { throw 'Parked config already exists; inspect before replacing.' }
$c = [System.IO.File]::ReadAllText($source)
$expected = @(
 '"name"\s*:\s*"fishing-auth-p0-test"',
 '"main"\s*:\s*"src/d2-live-publisher-worker.mjs"',
 '"D2_SANDBOX_REPO_ID"\s*:\s*"1430581407"',
 '"D2_GITHUB_APP_ID"\s*:\s*"5436811"',
 '"D2_GITHUB_INSTALLATION_ID"\s*:\s*"174361658"',
 '"APP_ORIGIN"\s*:\s*"https://fishing-auth-p0-test.ginosega.workers.dev"',
 '"compatibility_flags"\s*:\s*\[\s*"global_fetch_strictly_public"\s*\]',
 '"database_name"\s*:\s*"fishing-auth-p0"',
 '"database_name"\s*:\s*"fishing-p3-sandbox"',
 '"triggers"\s*:\s*\{\s*"crons"\s*:\s*\[\s*"\*/5 \* \* \* \*"\s*\]'
)
foreach ($rule in $expected) {
 if ([regex]::Matches($c,$rule).Count -ne 1) {
  throw "Current worker configuration failed an expected boundary: $rule"
 }
}
foreach ($flag in @('D2_WRITE_ENABLED','D2_RUNNER_ENABLED',
                    'D2_READ_TOKENS_ENABLED','D2_TEST_HOST_ENABLED')) {
 $rule = '"'+$flag+'"\s*:\s*"true"'
 if ([regex]::Matches($c,$rule).Count -ne 1) {
  throw "Current worker is not at the verified test settings: $flag"
 }
}
foreach ($name in @('D2_GITHUB_APP_PRIVATE_KEY','D2_CSRF_KEY',
                    'D2_HOST_PROBE_KEY','OWNER_GITHUB_ID','GITHUB_CLIENT_SECRET')) {
 if ($c -match ('"'+$name+'"\s*:')) {
  throw "Secret must not be redeclared as a plaintext variable: $name"
 }
}
# This is the SAME proven remote D1 query channel and cannot change D1.
$sql = 'SELECT operation_id,state,pr_number,workflow_run_id,merge_sha,verified_release_id,reason_code FROM p3_operations LIMIT 2;'
Push-Location $root
try {
 $raw = @(& npx.cmd wrangler d1 execute fishing-p3-sandbox --remote --json --config .\wrangler.d2-hosted-final.local.jsonc --command $sql)
 if ($LASTEXITCODE -ne 0) { throw 'Read-only D1 final-proof query failed.' }
 $parsed = ConvertFrom-Json -InputObject ($raw -join [Environment]::NewLine)
} finally { Pop-Location }
$entries = @($parsed)
if ($entries.Count -ne 1 -or $entries[0].success -ne $true -or
    @($entries[0].results).Count -ne 1) {
 throw 'Expected exactly one durable sandbox operation.'
}
$r = @($entries[0].results)[0]
if ($r.operation_id -ne 'p3_343ef7ba-1c87-4d5d-a2ad-92e91eab420f' -or
    $r.state -ne 'Live' -or $r.pr_number -ne 16 -or
    $r.workflow_run_id -ne 40288266980 -or
    $r.merge_sha -ne '89be79a9c933dd36bd909edd585091232831c835' -or
    $r.verified_release_id -ne '73362eb77bd59219aa6f78fb93e9d47b' -or
    $null -ne $r.reason_code) {
 throw 'D2 has not reached the exact verified terminal outcome. Do not park automatically.'
}
# Only remove future scheduling and disable the D2 test operations.
# Existing session/auth and public Pages proxy remain present on this Worker.
$next = $c
foreach ($flag in @('D2_WRITE_ENABLED','D2_RUNNER_ENABLED',
                    'D2_READ_TOKENS_ENABLED','D2_TEST_HOST_ENABLED')) {
 $rule = '"'+$flag+'"\s*:\s*"true"'
 $next = [regex]::Replace($next,$rule,'"'+$flag+'": "false"')
}
$next = [regex]::Replace($next,
 '"triggers"\s*:\s*\{\s*"crons"\s*:\s*\[\s*"\*/5 \* \* \* \*"\s*\]\s*\}',
 '"triggers": { "crons": [] }')
if ($next -eq $c -or
    [regex]::Matches($next,'"D2_[A-Z_]+ENABLED"\s*:\s*"true"').Count -ne 0 -or
    $next -notmatch '"triggers"\s*:\s*\{\s*"crons"\s*:\s*\[\s*\]\s*\}') {
 throw 'Prepared parked config did not pass hard-OFF verification.'
}
[System.IO.File]::WriteAllText($target,$next,(New-Object System.Text.UTF8Encoding($false)))
Write-Output 'PASS: One durable sandbox operation is Live with exact GitHub/host evidence.'
Write-Output 'PASS: Parked config prepared with all D2 test flags OFF and zero Cron triggers.'
Write-Output 'PASS: No D1 mutation, secret read, Worker deploy, or canonical GitHub mutation.'
