# FISH118 D3: PREPARE a separate local owner-authenticated read-only pilot.
# No Cloudflare deployment, secret change, D1 write, GitHub token or Cron.
# Strictly no sandbox publication: D3_WRITE/RUNNER/TEST_HOST stay OFF.
param([Parameter(Mandatory=$true)][string]$ExpectedHead)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$expectedLive='56f775f6-ca91-464e-be9b-40ec2bed40e6'
$oldPilotSha='0c81d91d5b743024d16e65d7732e1e4a889a07d5c578f25e8a6bddbf0b8a63fa'
$root=(Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
$preview=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$source=Join-Path $preview 'wrangler.d3-hardoff.local.jsonc'
$target=Join-Path $preview 'wrangler.d3-readonly.local.jsonc'
$metadata=Join-Path $preview 'src\generated\d3-pilot.bundle.sha256.json'
if($ExpectedHead -notmatch '^[0-9a-f]{40}$'){throw 'Expected exact PR SHA.'}
Push-Location $root
try{
 $head=(& git rev-parse HEAD).Trim()
 $branch=(& git branch --show-current).Trim()
 $changes=@(& git status --porcelain --untracked-files=no)
 if($LASTEXITCODE -ne 0 -or $head -ne $ExpectedHead -or
    $branch -ne 'feature/fish118-p3-mock-publisher' -or
    $changes.Count -ne 0){throw 'Unreviewed or dirty source checkout.'}
}finally{Pop-Location}
if(-not (Test-Path -LiteralPath $source) -or (Test-Path -LiteralPath $target)){
 throw 'Required hard-OFF config missing or read-only config already exists.'
}
$c=[IO.File]::ReadAllText($source)
function CheckOnce([string]$pattern,[string]$label){
 if([regex]::Matches($c,$pattern).Count -ne 1){
  throw "Source hard-OFF setting mismatch: $label"
 }
}
CheckOnce '"name"\s*:\s*"fishing-auth-p0-test"' 'Worker'
CheckOnce '"main"\s*:\s*"src/d3-owner-runtime\.mjs"' 'Owner runtime'
CheckOnce '"D3_PILOT_SHA256"\s*:\s*"0c81d91d5b743024d16e65d7732e1e4a889a07d5c578f25e8a6bddbf0b8a63fa"' 'Known deployed pilot hash'
CheckOnce '"crons"\s*:\s*\[\s*\]' 'No Cron'
foreach($flag in @('D2_WRITE_ENABLED','D2_RUNNER_ENABLED',
 'D2_READ_TOKENS_ENABLED','D2_TEST_HOST_ENABLED',
 'D3_WRITE_ENABLED','D3_RUNNER_ENABLED','D3_READ_TOKENS_ENABLED',
 'D3_TEST_HOST_ENABLED','D3_PILOT_ENABLED')){
 CheckOnce ('"'+$flag+'"\s*:\s*"false"') "$flag disabled"
}
$match=[regex]::Matches($c,'"database_id"\s*:\s*"[a-f0-9-]{36}"')
if($match.Count -ne 2){throw 'Original two D1 database identities missing.'}
Push-Location $preview
try{
 $deployed=@(& npx.cmd wrangler deployments status --name fishing-auth-p0-test 2>&1)
 if($LASTEXITCODE -ne 0){throw 'Cloudflare deployed-version status unavailable.'}
 $m=[regex]::Matches(($deployed -join [Environment]::NewLine),'(?m)\(100%\)\s+([0-9a-f-]{36})')
 if($m.Count -ne 1 -or $m[0].Groups[1].Value -ne $expectedLive){
  throw 'Live Worker drift from previously verified D3 hard-OFF deployment.'
 }
}finally{Pop-Location}
Push-Location (Join-Path $root 'pwa')
try{
 & node tools/build-d3-pilot.mjs --check
 if($LASTEXITCODE -ne 0){throw 'Updated private pilot build failed.'}
 & node tools/verify-d3-runtime.mjs
 if($LASTEXITCODE -ne 0){throw 'Updated private pilot bundled Worker test failed.'}
}finally{Pop-Location}
$manifest=Get-Content -LiteralPath $metadata -Raw | ConvertFrom-Json
if($manifest.sha256 -notmatch '^[0-9a-f]{64}$' -or $manifest.bytes -lt 1024 -or
 $manifest.bytes -gt 3145728){throw 'New pilot manifest invalid.'}
$updated=$c.Replace($oldPilotSha,[string]$manifest.sha256)
if($updated -eq $c){throw 'Failed to update private pilot SHA.'}
$updated=$updated.Replace('"D3_READ_TOKENS_ENABLED": "false"',
 '"D3_READ_TOKENS_ENABLED": "true"')
$updated=$updated.Replace('"D3_PILOT_ENABLED": "false"',
 '"D3_PILOT_ENABLED": "true"')
foreach($flag in @('D2_WRITE_ENABLED','D2_RUNNER_ENABLED',
 'D2_READ_TOKENS_ENABLED','D2_TEST_HOST_ENABLED',
 'D3_WRITE_ENABLED','D3_RUNNER_ENABLED','D3_TEST_HOST_ENABLED')){
 if([regex]::Matches($updated,('"'+$flag+'"\s*:\s*"false"')).Count -ne 1){
  throw "Unapproved write, runner or test-host flag: $flag"
 }
}
foreach($flag in @('D3_PILOT_ENABLED','D3_READ_TOKENS_ENABLED')){
 if([regex]::Matches($updated,('"'+$flag+'"\s*:\s*"true"')).Count -ne 1){
  throw "Read-only enablement config mismatch: $flag"
 }
}
if($updated -notmatch '"crons"\s*:\s*\[\s*\]' -or
 $updated.Contains('REPLACE_WITH_') -or
 [regex]::Matches($updated,'"database_id"\s*:\s*"[a-f0-9-]{36}"').Count -ne 2){
 throw 'Invalid D1, placeholder or Cron in read-only config.'
}
[IO.File]::WriteAllText($target,$updated,(New-Object Text.UTF8Encoding($false)))
Write-Output 'PASS: Current D3 hard-OFF live Worker version verified.'
Write-Output 'PASS: Updated owner pilot bundle verified and pinned.'
Write-Output 'PASS: Read-only local config prepared: owner pilot + sandbox read tokens only.'
Write-Output 'PASS: All publishing, runner, test host, D2 flags OFF; zero Cron.'
Write-Output 'No Cloudflare deployment, GitHub token request, secret change or D1 mutation.'
