# FISH-TODO-118 / WP3 H2 — Task Scheduler read-only identity/Cloudflare canary.
# SOURCE ONLY: not automatically installed or executed. No Worker mutations.
# Owner approval is required before creating or running an OS task.
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
try {
 $expectedSid = [System.Security.Principal.NTAccount]::new(
  $ExpectedRunAsUser
 ).Translate([System.Security.Principal.SecurityIdentifier]).Value
 $actualSid = [System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value
 if ($expectedSid -ne $actualSid) {
  throw 'Task owner identity mismatch'
 }
 if (-not (Test-Path -LiteralPath $npx -PathType Leaf)) {
  throw 'Pinned local npx missing'
 }
 # No login, credential-file inspection, mutation, retry or package download.
 # Capture only CLI JSON; suppress stderr, never save raw OAuth metadata.
 $output = & $npx --offline --yes 'wrangler@4.163.0' deployments list --name $worker --json 2>$null
 if ($LASTEXITCODE -ne 0) {
  throw 'Read-only Cloudflare deployment query failed'
 }
 $deployments = @(($output -join [Environment]::NewLine) | ConvertFrom-Json)
 if ($deployments.Count -lt 1 -or $deployments.Count -gt 100) {
  throw 'Unexpected Cloudflare deployment list'
 }
 # Wrangler CLI JSON may list oldest first. Select greatest created_on.
 $newest = $deployments | Sort-Object {
  [DateTimeOffset]::Parse([string]$_.created_on).ToUnixTimeSeconds()
 } -Descending | Select-Object -First 1
 if ($newest.strategy -ne 'percentage' -or
  @($newest.versions).Count -ne 1 -or
  [string]$newest.versions[0].version_id -cne $ExpectedOffVersion -or
  [double]$newest.versions[0].percentage -ne 100) {
  throw 'Expected isolated OFF deployment unverified'
 }
 $record = [ordered]@{
  result = 'PASS'
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
 $body = [Text.Encoding]::UTF8.GetBytes(($record | ConvertTo-Json -Depth 3 -Compress))
 # Preserve one-shot proof; do not overwrite any prior result or raw auth.
 $stream = [System.IO.File]::Open($EvidencePath,
  [System.IO.FileMode]::CreateNew,
  [System.IO.FileAccess]::Write,
  [System.IO.FileShare]::None)
 try {
  $stream.Write($body,0,$body.Length)
  $stream.Flush($true)
 } finally { $stream.Dispose() }
 Write-Output 'WP3 H2 Windows read-only Task Scheduler canary PASS'
} catch {
 # Error details may contain provider/local paths. Do not log those details.
 throw 'WP3 H2 Windows read-only Task Scheduler canary failed; no readiness proof'
}
