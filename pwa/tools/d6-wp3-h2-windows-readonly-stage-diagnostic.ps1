# FISH-TODO-118 / WP3 H2 — separately authorized diagnostic read-only scheduled canary.
# SOURCE ONLY. Distinct from the original failed canary; do not rerun that task.
# Requires new explicit owner approval before staging/registering/running any OS task.
param(
 [Parameter(Mandatory=$true)]
 [ValidatePattern('^[A-Za-z0-9_.-]{1,32}\\[A-Za-z0-9_.-]{1,64}$')]
 [string]$ExpectedRunAsUser,
 [Parameter(Mandatory=$true)]
 [ValidatePattern('^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')]
 [string]$ExpectedOffVersion,
 [Parameter(Mandatory=$true)]
 [ValidatePattern('^[A-Za-z]:\\[A-Za-z0-9 _\\().-]+\.json$')]
 [string]$EvidencePath
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$worker = 'fishing-v3-wp3-test'
$npx = 'C:\Program Files\nodejs\npx.cmd'
$stage = 'verify-identity'
# Reject original failed-canary evidence filename even if its file was never created.
# This check occurs before any attempt to write failure diagnostics.
if ([System.IO.Path]::GetFileName($EvidencePath) -ine 'h2-readonly-stage-diagnostic.json') {
 throw 'Separate diagnostic evidence filename required'
}

try {
 $expectedSid = [System.Security.Principal.NTAccount]::new(
  $ExpectedRunAsUser
 ).Translate([System.Security.Principal.SecurityIdentifier]).Value
 $actualSid = [System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value
 if ($expectedSid -ne $actualSid) { throw 'Identity validation failed' }

 $stage = 'locate-offline-cli'
 if (-not (Test-Path -LiteralPath $npx -PathType Leaf)) {
  throw 'Pinned local npx missing'
 }

 $stage = 'query-deployments'
 # Exactly one authenticated GET via pinned local CLI. No login, retry, mutation,
 # package download, credential-file read or provider stdout/stderr persistence.
 $output = & $npx --offline --yes 'wrangler@4.163.0' deployments list --name $worker --json 2>$null
 if ($LASTEXITCODE -ne 0) { throw 'Read-only deployment query failed' }

 $stage = 'parse-deployments'
 $deployments = @(($output -join [Environment]::NewLine) | ConvertFrom-Json)
 if ($deployments.Count -lt 1 -or $deployments.Count -gt 100) {
  throw 'Unexpected deployment list'
 }

 $stage = 'select-latest'
 $newest = $deployments | Sort-Object {
  [DateTimeOffset]::Parse([string]$_.created_on).ToUnixTimeSeconds()
 } -Descending | Select-Object -First 1

 $stage = 'verify-pinned-off'
 if ($newest.strategy -ne 'percentage' -or
  @($newest.versions).Count -ne 1 -or
  [string]$newest.versions[0].version_id -cne $ExpectedOffVersion -or
  [double]$newest.versions[0].percentage -ne 100) {
  throw 'Expected OFF deployment unverified'
 }

 $stage = 'write-evidence'
 $record = [ordered]@{
  result = 'PASS'
  stage = 'complete'
  readOnly = $true
  taskPrincipalSidMatches = $true
  workerName = $worker
  offVersion = $ExpectedOffVersion
  offTrafficPercentage = 100
  deploymentId = [string]$newest.id
  observedUtc = [DateTimeOffset]::UtcNow.ToString('o')
  isLive = $false
  canPublish = $false
 }
 $bytes = [Text.Encoding]::UTF8.GetBytes(($record | ConvertTo-Json -Depth 3 -Compress))
 $stream = [System.IO.File]::Open($EvidencePath,
  [System.IO.FileMode]::CreateNew,
  [System.IO.FileAccess]::Write,
  [System.IO.FileShare]::None)
 try {
  $stream.Write($bytes,0,$bytes.Length)
  $stream.Flush($true)
 } finally { $stream.Dispose() }
 Write-Output 'WP3 H2 read-only diagnostic canary PASS'
} catch {
 # Never persist $_, ErrorDetails, environment, CLI output, headers or paths.
 # Only the allowlisted stage and a literal FAIL marker may leave this process.
 $safeStages = @(
  'verify-identity','locate-offline-cli','query-deployments',
  'parse-deployments','select-latest','verify-pinned-off','write-evidence'
 )
 if ($stage -notin $safeStages) { $stage = 'unknown' }
 $failure = [ordered]@{
  result = 'FAIL'
  stage = $stage
  readOnly = $true
  workerName = $worker
  observedUtc = [DateTimeOffset]::UtcNow.ToString('o')
  isLive = $false
  canPublish = $false
 }
 try {
  # Exclusive create: never overwrite the original canary receipt or any draft.
  $bytes = [Text.Encoding]::UTF8.GetBytes(($failure | ConvertTo-Json -Depth 3 -Compress))
  $stream = [System.IO.File]::Open($EvidencePath,
   [System.IO.FileMode]::CreateNew,
   [System.IO.FileAccess]::Write,
   [System.IO.FileShare]::None)
  try {
   $stream.Write($bytes,0,$bytes.Length)
   $stream.Flush($true)
  } finally { $stream.Dispose() }
 } catch {
  # No fallback writes or raw diagnostics if the evidence path is unavailable.
 }
 throw 'WP3 H2 diagnostic canary FAIL; no readiness proof'
}
