# FISH118 D2 - execute ONE pre-reviewed CAS D1 reconciliation via Wrangler's
# successful --command API rather than --file (which uses Cloudflare D1 import).
# Run ONLY once, after independently proving PR #16's merge and sandbox main
# SHA; the SQL file is permanently pinned to its Git blob SHA.
# No GitHub writes, GitHub tokens, D1 migrations, or Worker deployment.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$sqlPath = Join-Path $PSScriptRoot 'reconcile-d2-confirmed-sandbox-merge.sql'
$config = Join-Path $root 'wrangler.d2-hosted-final.local.jsonc'
if (-not (Test-Path -LiteralPath $config)) { throw 'Missing final live Worker config.' }
if (-not (Test-Path -LiteralPath $sqlPath)) { throw 'Missing reviewed CAS SQL.' }
$blob = @(& git hash-object -- $sqlPath)
if ($LASTEXITCODE -ne 0 -or $blob.Count -ne 1 -or
    $blob[0].Trim() -ne 'f479be01c118ef9a1d87d46c95e5adc15c7ee258') {
 throw 'SQL file does not match the independently reviewed Git blob.'
}
# Parse a fixed SQL file; never accept untrusted data or custom SQL arguments.
$source = [System.IO.File]::ReadAllText($sqlPath)
$statement = [regex]::Replace($source,'(?m)^--[^\r\n]*(?:\r?\n|$)','')
$statement = [regex]::Replace($statement,'\s+',' ').Trim()
if (-not $statement.StartsWith('UPDATE p3_operations SET state = ') -or
    ([regex]::Matches($statement,';')).Count -ne 1 -or
    -not $statement.EndsWith('RETURNING operation_id, state, pr_number, workflow_run_id, merge_sha, reason_code;')) {
 throw 'SQL is not the expected single, bounded UPDATE RETURNING statement.'
}
# Windows PowerShell 5.1 -> npx.cmd can strip single-quoted SQL arguments.
# Replace fixed, ASCII-only SQL text literals with SQLite char(N,...) calls.
# This produces one quote-free SQL argument and does NOT change semantics.
$quoted = [regex]::Matches($statement,"'([^']*)'")
if ($quoted.Count -ne 0 -and $quoted.Count -ne 12) {
 throw 'Unexpected SQL literal inventory. No SQL will run.'
}
$command = [regex]::Replace($statement,"'([^']*)'",
 [System.Text.RegularExpressions.MatchEvaluator]{
  param($match)
  $literal = $match.Groups[1].Value
  if ($literal -notmatch '^[\x20-\x7E]*$') { throw 'Non-ASCII SQL literal.' }
  $values = @([System.Text.Encoding]::ASCII.GetBytes($literal) | ForEach-Object { [int]$_ })
  if ($values.Count -eq 0) { throw 'Empty SQL literal.' }
  return 'char(' + ($values -join ',') + ')'
 })
if ($command.Contains("'") -or $command.Length -gt 7900) {
 throw 'Refusing SQL with unsafe command-line quoting or excessive length.'
}
# This API uses the existing D1 SQL query permission that succeeded earlier.
# Do not retry the mutation if the remote response is ambiguous.
Push-Location $root
try {
 $raw = @(& npx.cmd wrangler d1 execute fishing-p3-sandbox --remote --json --config .\wrangler.d2-hosted-final.local.jsonc --command $command)
 $exitCode = $LASTEXITCODE
 if ($exitCode -ne 0) {
  foreach ($line in $raw) { Write-Output $line }
  throw "D1 reconciliation command failed (exit $exitCode). DO NOT RETRY; check D1 read-only."
 }
 $parsed = ConvertFrom-Json -InputObject ($raw -join [Environment]::NewLine)
} finally { Pop-Location }
$entries = @($parsed)
if ($entries.Count -ne 1 -or $entries[0].success -ne $true -or
    @($entries[0].results).Count -ne 1) {
 throw 'No single confirmed updated row. DO NOT RETRY; inspect D1 read-only.'
}
$r = @($entries[0].results)[0]
if ($r.operation_id -ne 'p3_343ef7ba-1c87-4d5d-a2ad-92e91eab420f' -or
    $r.state -ne 'Deploying' -or $r.pr_number -ne 16 -or
    $r.workflow_run_id -ne 40288266980 -or
    $r.merge_sha -ne '89be79a9c933dd36bd909edd585091232831c835' -or
    $null -ne $r.reason_code) {
 throw 'Returned row does not confirm the expected merge receipt. DO NOT RETRY.'
}
Write-Output 'PASS: The already-confirmed sandbox merge is durably reconciled.'
Write-Output 'PASS: No GitHub write, repeated merge, or Cloudflare Worker redeployment.'
$r | Format-List
