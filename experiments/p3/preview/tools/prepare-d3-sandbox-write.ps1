# FISH118 D3: PREPARE-ONLY prospective sandbox Gear/KB publisher.
# NO provider mutation: no deploy, no GitHub write, no D1 operations or Cron.
# This script creates a gitignored candidate for LATER separate approval.
# Never execute an earlier D2 operation or previous repair script.
param([Parameter(Mandatory=$true)][string]$ExpectedHead)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$worker='fishing-auth-p0-test'
$origin='https://fishing-auth-p0-test.ginosega.workers.dev'
$knownVersion='91f601dd-b960-4f7b-91e7-01abd0399030'
$oldPilot='72b5b70fdd52fcf9f08cf18bac9c56ec342265d299aefbf70d2bd708a5503b9b'
$root=(Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
$preview=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$baseline=Join-Path $preview 'wrangler.d3-csp-repair.local.jsonc'
$next=Join-Path $preview 'wrangler.d3-sandbox-write.local.jsonc'
$bundle=Join-Path $preview 'src\generated\d3-pilot.bundle.txt'
$meta=Join-Path $preview 'src\generated\d3-pilot.bundle.sha256.json'
function Once([string]$body,[string]$pattern,[string]$name) {
 if([regex]::Matches($body,$pattern).Count -ne 1) {
  throw "D3 sandbox write preflight denied: $name"
 }
}
function LiveVersion {
 $raw=@(& npx.cmd wrangler deployments status --name $worker 2>&1)
 if($LASTEXITCODE -ne 0) {throw 'Live Worker version query failed.'}
 $found=[regex]::Matches(($raw -join [Environment]::NewLine),
  '(?m)\(100%\)\s+([a-f0-9-]{36})')
 if($found.Count -ne 1) {throw 'Live Worker version ambiguous.'}
 return $found[0].Groups[1].Value
}
function ResponseCode([string]$path,[string]$method='GET') {
 try {
  $r=Invoke-WebRequest -Uri ($origin+$path) -Method $method `
   -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 30 `
   -Headers @{'Cache-Control'='no-store'}
  return [int]$r.StatusCode
 }catch{
  if($_.Exception.Response) {
   return [int]$_.Exception.Response.StatusCode
  }
  throw "Cannot verify anonymous endpoint: $path"
 }
}
function PublicHash {
 $r=Invoke-WebRequest -Uri ($origin+'/fishing/') -UseBasicParsing `
  -MaximumRedirection 0 -TimeoutSec 30 `
  -Headers @{'Cache-Control'='no-store'}
 if($r.StatusCode -ne 200) {throw 'Public V2 homepage unavailable.'}
 $h=[Security.Cryptography.SHA256]::Create()
 try {
  $b=[Text.Encoding]::UTF8.GetBytes([string]$r.Content)
  return ([BitConverter]::ToString($h.ComputeHash($b)).Replace('-','').ToLowerInvariant())
 }finally{$h.Dispose()}
}
if($ExpectedHead -notmatch '^[0-9a-f]{40}$') {
 throw 'A reviewed exact source SHA is required.'
}
Push-Location $root
try{
 $head=(& git rev-parse HEAD).Trim()
 $branch=(& git branch --show-current).Trim()
 $dirty=@(& git status --porcelain --untracked-files=no)
 if($LASTEXITCODE -ne 0 -or $head -ne $ExpectedHead -or
  $branch -ne 'feature/fish118-p3-mock-publisher' -or
  $dirty.Count -ne 0) {
  throw 'Local source branch, SHA or tracked-file state differs from reviewed PR.'
 }
}finally{Pop-Location}
if(-not (Test-Path -LiteralPath $baseline)) {
 throw 'The previously verified local read-only CSP config is missing.'
}
if(Test-Path -LiteralPath $next) {
 throw 'Candidate already exists: inspect it; never overwrite a prior operator result.'
}
$c=[IO.File]::ReadAllText($baseline)
foreach($rule in @(
 @('"name"\s*:\s*"fishing-auth-p0-test"','same Worker'),
 @('"main"\s*:\s*"src/d3-owner-runtime\.mjs"','same owner runtime'),
 @('"APP_ORIGIN"\s*:\s*"https://fishing-auth-p0-test\.ginosega\.workers\.dev"','same origin'),
 @('"D3_SANDBOX_REPO_ID"\s*:\s*"1430581407"','private sandbox only'),
 @('"D2_GITHUB_APP_ID"\s*:\s*"5436811"','original App ID'),
 @('"D3_GITHUB_APP_ID"\s*:\s*"5436811"','selected D3 App'),
 @('"D2_GITHUB_INSTALLATION_ID"\s*:\s*"174361658"','original installation'),
 @('"D3_GITHUB_INSTALLATION_ID"\s*:\s*"174361658"','selected D3 installation'),
 @('"keep_vars"\s*:\s*true','preserve encrypted credentials'),
 @('"preview_urls"\s*:\s*false','no new preview URL'),
 @('"workers_dev"\s*:\s*true','existing Worker URL'),
 @('"binding"\s*:\s*"DB"','AUTH D1'),
 @('"binding"\s*:\s*"OPERATIONS_DB"','operations D1'),
 @('"crons"\s*:\s*\[\s*\]','prior Worker without Cron')
)) {Once $c $rule[0] $rule[1]}
Once $c ('"D3_PILOT_SHA256"\s*:\s*"'+$oldPilot+'"') 'pinned current pilot bytes'
foreach($flag in @('D3_PILOT_ENABLED','D3_READ_TOKENS_ENABLED')) {
 Once $c ('"'+$flag+'"\s*:\s*"true"') "$flag currently enabled"
}
foreach($flag in @('D3_WRITE_ENABLED','D3_RUNNER_ENABLED',
 'D3_TEST_HOST_ENABLED','D2_WRITE_ENABLED','D2_RUNNER_ENABLED',
 'D2_READ_TOKENS_ENABLED','D2_TEST_HOST_ENABLED')) {
 Once $c ('"'+$flag+'"\s*:\s*"false"') "$flag currently disabled"
}
$ids=[regex]::Matches($c,'"database_id"\s*:\s*"[a-f0-9-]{36}"')
if($ids.Count -ne 2 -or $c.Contains('REPLACE_WITH_')) {
 throw 'Verified D1 bindings missing or placeholder present.'
}
foreach($secret in @('D2_CSRF_KEY','D2_GITHUB_APP_PRIVATE_KEY',
 'D2_HOST_PROBE_KEY','GITHUB_CLIENT_SECRET')) {
 if($c -match ('"'+$secret+'"\s*:\s*"')) {
  throw 'Unacceptable plaintext secret inside local Wrangler vars.'
 }
}
Push-Location (Join-Path $root 'pwa')
try{
 & node tools/build-d3-pilot.mjs --check
 if($LASTEXITCODE -ne 0) {throw 'Owner pilot bundle failed.'}
 & node tools/verify-d3-windows-eol.mjs
 if($LASTEXITCODE -ne 0) {throw 'Windows/LF bundle parity failed.'}
 & node tools/verify-d3-csp.mjs
 if($LASTEXITCODE -ne 0) {throw 'Strict-CSP validators failed.'}
 & node tools/verify-d3-runtime.mjs
 if($LASTEXITCODE -ne 0) {throw 'Sandbox Worker source bundle failed.'}
}finally{Pop-Location}
$manifest=Get-Content -LiteralPath $meta -Raw | ConvertFrom-Json
$digest=(Get-FileHash -LiteralPath $bundle -Algorithm SHA256).Hash.ToLowerInvariant()
if($manifest.format -ne 'fishing-d3-pilot-local-build-v1' -or
 $manifest.sha256 -notmatch '^[a-f0-9]{64}$' -or
 $digest -ne $manifest.sha256 -or
 (Get-Item -LiteralPath $bundle).Length -ne $manifest.bytes) {
 throw 'Candidate pilot bytes do not match build metadata.'
}
if($digest -eq $oldPilot) {
 throw 'Expected reviewed owner pilot changes have not been rebuilt.'
}
$proposed=$c.Replace($oldPilot,$digest)
if($proposed -eq $c) {throw 'Cannot identify pinned current pilot SHA.'}
foreach($flag in @('D3_WRITE_ENABLED','D3_RUNNER_ENABLED',
 'D3_TEST_HOST_ENABLED')) {
 $from='"'+$flag+'": "false"'
 $to='"'+$flag+'": "true"'
 if([regex]::Matches($proposed,[regex]::Escape($from)).Count -ne 1) {
  throw "Cannot prepare $flag as an exact value-only change."
 }
 $proposed=$proposed.Replace($from,$to)
}
$fromCron='"crons": []'
$toCron='"crons": ["*/5 * * * *"]'
if([regex]::Matches($proposed,[regex]::Escape($fromCron)).Count -ne 1) {
 throw 'Unexpected Cron configuration; refuse staging.'
}
$proposed=$proposed.Replace($fromCron,$toCron)
if($proposed.Contains('REPLACE_WITH_') -or
 [regex]::Matches($proposed,'"database_id"\s*:\s*"[a-f0-9-]{36}"').Count -ne 2) {
 throw 'Unsafe candidate Wrangler configuration.'
}
foreach($flag in @('D3_WRITE_ENABLED','D3_RUNNER_ENABLED',
 'D3_TEST_HOST_ENABLED','D3_PILOT_ENABLED','D3_READ_TOKENS_ENABLED')) {
 Once $proposed ('"'+$flag+'"\s*:\s*"true"') "$flag candidate ON"
}
foreach($flag in @('D2_WRITE_ENABLED','D2_RUNNER_ENABLED',
 'D2_READ_TOKENS_ENABLED','D2_TEST_HOST_ENABLED')) {
 Once $proposed ('"'+$flag+'"\s*:\s*"false"') "$flag stays OFF"
}
Once $proposed '"crons"\s*:\s*\[\s*"\*/5 \* \* \* \*"\s*\]' 'five-minute isolated Cron'
[IO.File]::WriteAllText($next,$proposed,(New-Object Text.UTF8Encoding($false)))
Push-Location $preview
try{
 if((LiveVersion) -ne $knownVersion) {
  throw 'Worker differs from owner-verified read-only CSP version.'
 }
 $before=PublicHash
 foreach($item in @(
  @('/__d3_pilot__/',401),
  @('/__d3_pilot__/pilot.js',401),
  @('/api/v3/authoring-source',401),
  @('/__d3_test__/operations/invalid/Gear/gear.json',404)
 )) {
  if((ResponseCode $item[0]) -ne $item[1]) {
   throw "Unexpected anonymous private route: $($item[0])"
  }
 }
 if((ResponseCode '/api/v3/operations' 'POST') -ne 503) {
  throw 'The live writer is unexpectedly active.'
 }
 $folder=Join-Path $env:TEMP ('fishing-d3-publish-dryrun-'+[guid]::NewGuid().ToString('N'))
 try{
  $output=@(& npx.cmd wrangler deploy --dry-run --config $next --outdir $folder 2>&1)
  if($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $folder)) {
   throw 'Candidate Wrangler dry-run packaging failed.'
  }
 }finally{
  if(Test-Path -LiteralPath $folder) {Remove-Item -LiteralPath $folder -Recurse -Force}
 }
 if((LiveVersion) -ne $knownVersion -or (PublicHash) -ne $before) {
  throw 'Unexpected Worker/public homepage drift during local preparation.'
 }
 Write-Output ('D3_PREPARED_SOURCE_SHA: '+$ExpectedHead)
 Write-Output ('D3_PREPARED_PILOT_SHA256: '+$digest)
 Write-Output ('D3_LIVE_BASELINE_UNCHANGED: '+$knownVersion)
 Write-Output 'PASS: Source, owner client, D1 IDs, secrets boundary, pinned Worker and dry-run.'
 Write-Output 'PASS: Private sandbox publishing candidate prepared locally; no deploy.'
 Write-Output 'PASS: Live public V2 identical, existing read-only pilot untouched.'
 Write-Output 'DO NOT DEPLOY without explicit owner authorization for the new write/Cron scope.'
}finally{Pop-Location}
