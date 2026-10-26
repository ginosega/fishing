# FISH118 D2: validate the exact owner-approved private-sandbox operation
# and create a LOCAL configuration for the final merge + hosted proof stage.
# Must be run after PR #16 passes exact-head CI and the durable state is
# Merging. Never deploys, changes D1, or reads/logs any secret.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$source = Join-Path $root 'wrangler.d2-runner.local.jsonc'
$target = Join-Path $root 'wrangler.d2-hosted-final.local.jsonc'
if (-not (Test-Path -LiteralPath $source)) { throw 'Missing runner config.' }
if (Test-Path -LiteralPath $target) { throw 'Final config already exists; inspect rather than overwrite.' }
$c = [System.IO.File]::ReadAllText($source)
$checks = @(
 '"name"\s*:\s*"fishing-auth-p0-test"',
 '"main"\s*:\s*"src/d2-live-publisher-worker.mjs"',
 '"D2_SANDBOX_REPO_ID"\s*:\s*"1430581407"',
 '"D2_GITHUB_APP_ID"\s*:\s*"5436811"',
 '"D2_GITHUB_INSTALLATION_ID"\s*:\s*"174361658"',
 '"D2_WRITE_ENABLED"\s*:\s*"true"',
 '"D2_RUNNER_ENABLED"\s*:\s*"true"',
 '"D2_READ_TOKENS_ENABLED"\s*:\s*"true"',
 '"D2_TEST_HOST_ENABLED"\s*:\s*"false"',
 '"compatibility_flags"\s*:\s*\[\s*"global_fetch_strictly_public"\s*\]',
 '"triggers"\s*:\s*\{\s*"crons"\s*:\s*\[\s*"\*/5 \* \* \* \*"\s*\]',
 '"binding"\s*:\s*"DB"',
 '"binding"\s*:\s*"OPERATIONS_DB"',
 '"database_name"\s*:\s*"fishing-auth-p0"',
 '"database_name"\s*:\s*"fishing-p3-sandbox"'
)
foreach ($pattern in $checks) {
 if ([regex]::Matches($c,$pattern).Count -ne 1) {
  throw "Runner config failed exact safety gate: $pattern"
 }
}
foreach ($name in @('OWNER_GITHUB_ID','D2_GITHUB_APP_PRIVATE_KEY','D2_CSRF_KEY','D2_HOST_PROBE_KEY')) {
 if ($c -match ('"'+$name+'"\s*:')) { throw "Encrypted binding $name cannot appear as plaintext config." }
}
# Preflight against the SAME isolated remote D1 binding that accepted the
# exact operation. This SELECT has no writes and no changes to GitHub.
$op = 'p3_343ef7ba-1c87-4d5d-a2ad-92e91eab420f'
# Windows PowerShell 5.1 reliably passes a single-line --command with
# no quoted SQL literals. Read at most 2 rows and REQUIRE exactly one,
# with the expected operation ID and all immutable evidence checked below.
# Never use --file here: Wrangler 4.152.0 mixes decorative progress output
# with --json, which cannot be passed to ConvertFrom-Json directly.
$sql = 'SELECT operation_id,state,pr_number,main_base_sha,pr_head_sha,workflow_run_id,merge_sha,reason_code FROM p3_operations LIMIT 2;'
Push-Location $root
try {
 # JSON output contains operation metadata only: no secrets or snapshots.
 $raw = @(& npx.cmd wrangler d1 execute fishing-p3-sandbox --remote --json --config .\wrangler.d2-runner.local.jsonc --command $sql)
 $exitCode = $LASTEXITCODE
 if ($exitCode -ne 0) {
  Write-Output "Wrangler D1 read-only preflight exit code: $exitCode"
  foreach ($line in $raw) { Write-Output $line }
  throw 'Remote read-only D1 preflight failed; see Wrangler diagnostic above.'
 }
 $parsed = ConvertFrom-Json -InputObject ($raw -join [Environment]::NewLine)
} finally { Pop-Location }
$entries = @($parsed)
if ($entries.Count -ne 1 -or
 $entries[0].success -ne $true -or @($entries[0].results).Count -ne 1) {
 throw 'Expected exactly one successful D1 result row.'
}
$r = @($entries[0].results)[0]
if ($r.operation_id -ne $op -or
 $r.state -ne 'Merging' -or $r.pr_number -ne 16 -or
 $r.main_base_sha -ne '69b236c8af663cdce687dc855bb117a01874060a' -or
 $r.pr_head_sha -ne 'fc7879d67217e0f0a36676e40dadbce7060f66a6' -or
 $r.workflow_run_id -ne 40288266980 -or
 $null -ne $r.merge_sha -or $null -ne $r.reason_code) {
 throw 'D1 did not match exact PR #16 / successful workflow / premerge state; keep hosted gate OFF.'
}
$from = '"D2_TEST_HOST_ENABLED": "false"'
$to = '"D2_TEST_HOST_ENABLED": "true"'
if ([regex]::Matches($c,[regex]::Escape($from)).Count -ne 1) {
 throw 'Expected exactly one hosted-test feature flag.'
}
$next = $c.Replace($from,$to)
[System.IO.File]::WriteAllText($target,$next,(New-Object System.Text.UTF8Encoding($false)))
Write-Output 'PASS: D1 Merging preflight confirms exact operation, PR #16, head/base SHA and successful workflow.'
Write-Output 'PASS: Final untracked local config prepared; hosted proof TRUE, Cron unchanged.'
Write-Output 'PASS: No Worker deployment, D1 mutation, GitHub write or secret exposure.'
