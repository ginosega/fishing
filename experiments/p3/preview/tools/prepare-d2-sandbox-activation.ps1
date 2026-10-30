# FISH118 D2 — prepare a LOCAL, hard-OFF private sandbox activation
# config from the already-proven phase-0 deployment. This script NEVER
# deploys, mutates D1, reads private keys or enables a Cron/write route.
# Run in experiments/p3/preview.
param(
  [Parameter(Mandatory=$true)][string]$AppId,
  [Parameter(Mandatory=$true)][string]$InstallationId
)
$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$oldPath=Join-Path $root 'wrangler.d2-phase0.local.jsonc'
$templatePath=Join-Path $root 'wrangler.d2-production-origin.example.jsonc'
$targetPath=Join-Path $root 'wrangler.d2-sandbox.local.jsonc'
if (-not (Test-Path -LiteralPath $oldPath) -or -not (Test-Path -LiteralPath $templatePath)) {
  throw 'Phase-0 local configuration or sandbox template missing.'
}
if (Test-Path -LiteralPath $targetPath) {
  throw 'Sandbox local config already exists; review it before regeneration.'
}
foreach ($value in @($AppId,$InstallationId)) {
  if ($value -notmatch '^[1-9][0-9]{0,15}$' -or
      [long]$value -gt 9007199254740991) {
    throw 'Invalid App or installation ID.'
  }
}
if ($AppId -eq $InstallationId) { throw 'App ID and installation ID must differ.' }
$prior=[System.IO.File]::ReadAllText($oldPath)
$template=[System.IO.File]::ReadAllText($templatePath)
foreach ($flag in @('D2_WRITE_ENABLED','D2_RUNNER_ENABLED',
   'D2_READ_TOKENS_ENABLED','D2_TEST_HOST_ENABLED')) {
  if ($prior -notmatch ('"'+$flag+'"\s*:\s*"false"') -or
      $template -notmatch ('"'+$flag+'"\s*:\s*"false"')) {
    throw "Publishing gate $flag is not hard-OFF."
  }
}
if ($prior -notmatch '"name"\s*:\s*"fishing-auth-p0-test"' -or
    $template -notmatch '"name"\s*:\s*"fishing-auth-p0-test"' -or
    $prior -match '"triggers"\s*:' -or
    $prior -match '"D2_GITHUB_APP_PRIVATE_KEY"\s*:') {
  throw 'Phase-0 deployed configuration differs from reviewed baseline.'
}
function Read-DbId([string]$text,[string]$binding,[string]$database){
  $pattern='"binding"\s*:\s*"'+[regex]::Escape($binding)+
    '"\s*,\s*"database_name"\s*:\s*"'+[regex]::Escape($database)+
    '"\s*,\s*"database_id"\s*:\s*"([a-f0-9-]+)"'
  $found=[regex]::Matches($text,$pattern)
  if ($found.Count -ne 1){throw "Expected one $binding database binding."}
  $id=$found[0].Groups[1].Value
  if ($id -notmatch '^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$'){
    throw "Invalid database UUID for $binding."
  }
  return $id
}
$auth=Read-DbId $prior 'DB' 'fishing-auth-p0'
$sandbox=Read-DbId $prior 'OPERATIONS_DB' 'fishing-p3-sandbox'
if ($auth -eq $sandbox){throw 'D1 databases must be distinct.'}
# First deployment of the sandbox config must NOT install a Cron. Cloudflare
# requires crons: [] to remove existing triggers; omitting triggers may retain
# them. Cron is installed only in a later, separately reviewed activation.
$sourceCron='"triggers": { "crons": ["*/5 * * * *"] }'
if (-not $template.Contains($sourceCron)){throw 'Unexpected Cron template; refuse preparation.'}
$config=$template.Replace('REPLACE_EXISTING_AUTH_P0_D1_UUID',$auth)
$config=$config.Replace('REPLACE_EXISTING_MIGRATED_P3_D1_UUID',$sandbox)
$config=$config.Replace('REPLACE_WITH_DEDICATED_SANDBOX_APP_ID',$AppId)
$config=$config.Replace('REPLACE_WITH_DEDICATED_SELECTED_INSTALLATION_ID',$InstallationId)
$config=$config.Replace($sourceCron,'"triggers": { "crons": [] }')
if ($config.Contains('REPLACE_') -or
    $config -notmatch '"compatibility_flags"\s*:\s*\[\s*"global_fetch_strictly_public"\s*\]' -or
    $config -notmatch '"triggers"\s*:\s*\{\s*"crons"\s*:\s*\[\s*\]' -or
    $config -notmatch '"D2_SANDBOX_REPO_ID"\s*:\s*"1430581407"' -or
    $config -notmatch '"keep_vars"\s*:\s*true'){
  throw 'Prepared sandbox config failed hard-OFF checks.'
}
foreach($name in @('GITHUB_CLIENT_ID','GITHUB_CLIENT_SECRET','OWNER_GITHUB_ID',
  'D2_CSRF_KEY','D2_HOST_PROBE_KEY','D2_GITHUB_APP_PRIVATE_KEY')) {
  if($config -notmatch ('"'+$name+'"') -or
     $config -match ('"'+$name+'"\s*:')) {
    throw "Missing encrypted-secret requirement or unsafe plaintext $name."
  }
}
[System.IO.File]::WriteAllText($targetPath,$config,
  (New-Object System.Text.UTF8Encoding($false)))
Write-Output 'PASS: Prepared private-sandbox local config with existing D1 IDs and GitHub App IDs.'
Write-Output 'PASS: All four D2 flags false; Cron explicitly empty; existing secrets required by name.'
Write-Output 'PASS: No PEM read, GitHub write, D1 mutation, or Worker deployment.'
