# FISH118 D3: prospective READ-ONLY pilot deployment. NOT APPROVED YET.
# A separate owner authorization is required before use.
# Enables ONLY private owner pilot and selected-sandbox read tokens.
# Never enables operation posting, GitHub writes, runner, host probe, or Cron.
param([Parameter(Mandatory=$true)][string]$ExpectedHead,
      [switch]$ApproveReadOnlyPilot)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$previous='56f775f6-ca91-464e-be9b-40ec2bed40e6'
$name='fishing-auth-p0-test'
$origin='https://fishing-auth-p0-test.ginosega.workers.dev'
$root=(Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
$preview=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$config=Join-Path $preview 'wrangler.d3-readonly.local.jsonc'
$hardoff=Join-Path $preview 'wrangler.d3-hardoff.local.jsonc'
$bundle=Join-Path $preview 'src\generated\d3-pilot.bundle.txt'
$meta=Join-Path $preview 'src\generated\d3-pilot.bundle.sha256.json'
function ExactlyOne([string]$text,[string]$pattern,[string]$label){
 if([regex]::Matches($text,$pattern).Count -ne 1){
  throw "Read-only deployment guard denied: $label"
 }
}
function Version {
 $res=@(& npx.cmd wrangler deployments status --name $name 2>&1)
 if($LASTEXITCODE -ne 0){throw 'Cannot verify live Worker version.'}
 $v=[regex]::Matches(($res -join [Environment]::NewLine),'(?m)\(100%\)\s+([0-9a-f-]{36})')
 if($v.Count -ne 1){throw 'Ambiguous live Worker version.'}
 return $v[0].Groups[1].Value
}
function Code([string]$path,[string]$method='GET'){
 try{
  $res=Invoke-WebRequest -Uri ($origin+$path) -Method $method -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 30 -Headers @{'Cache-Control'='no-store'}
  return [int]$res.StatusCode
 }catch{
  if($_.Exception.Response){return [int]$_.Exception.Response.StatusCode}
  throw "Origin unavailable: $path"
 }
}
function IndexHash {
 $res=Invoke-WebRequest -Uri ($origin+'/fishing/') -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 30 -Headers @{'Cache-Control'='no-store'}
 if($res.StatusCode -ne 200){throw 'Public Fishing homepage unavailable.'}
 $hash=[Security.Cryptography.SHA256]::Create()
 try{
  $bytes=[Text.Encoding]::UTF8.GetBytes([string]$res.Content)
  return ([BitConverter]::ToString($hash.ComputeHash($bytes)).Replace('-','').ToLowerInvariant())
 }finally{$hash.Dispose()}
}
if(-not $ApproveReadOnlyPilot){throw 'Separate explicit read-only pilot approval required.'}
if($ExpectedHead -notmatch '^[a-f0-9]{40}$'){throw 'Exact source SHA required.'}
Push-Location $root
try{
 $head=(& git rev-parse HEAD).Trim()
 $branch=(& git branch --show-current).Trim()
 $dirty=@(& git status --porcelain --untracked-files=no)
 if($LASTEXITCODE -ne 0 -or $head -ne $ExpectedHead -or
  $branch -ne 'feature/fish118-p3-mock-publisher' -or
  $dirty.Count -ne 0){throw 'Unreviewed Git checkout.'}
}finally{Pop-Location}
foreach($path in @($config,$hardoff,$bundle,$meta)){
 if(-not (Test-Path -LiteralPath $path)){throw 'Missing prepared local pilot artifact.'}
}
$c=[IO.File]::ReadAllText($config)
$previousConfig=[IO.File]::ReadAllText($hardoff)
$m=Get-Content -LiteralPath $meta -Raw | ConvertFrom-Json
$sha=(Get-FileHash -LiteralPath $bundle -Algorithm SHA256).Hash.ToLowerInvariant()
if($m.format -ne 'fishing-d3-pilot-local-build-v1' -or
 $sha -ne $m.sha256 -or
 (Get-Item -LiteralPath $bundle).Length -ne $m.bytes){
 throw 'Private pilot JS integrity failed.'
}
foreach($rule in @(
 @('"name"\s*:\s*"fishing-auth-p0-test"','same Worker'),
 @('"main"\s*:\s*"src/d3-owner-runtime\.mjs"','embedded Worker'),
 @('"APP_ORIGIN"\s*:\s*"https://fishing-auth-p0-test\.ginosega\.workers\.dev"','same origin'),
 @('"preview_urls"\s*:\s*false','no preview'),
 @('"keep_vars"\s*:\s*true','encrypted secrets retained'),
 @('"D2_GITHUB_APP_ID"\s*:\s*"5436811"','existing App'),
 @('"D3_GITHUB_APP_ID"\s*:\s*"5436811"','matching App'),
 @('"D2_GITHUB_INSTALLATION_ID"\s*:\s*"174361658"','existing installation'),
 @('"D3_GITHUB_INSTALLATION_ID"\s*:\s*"174361658"','matching installation'),
 @('"D3_SANDBOX_REPO_ID"\s*:\s*"1430581407"','only sandbox'),
 @('"type"\s*:\s*"Text"','embedded JS'),
 @('"fallthrough"\s*:\s*true','module defaults'),
 @('"crons"\s*:\s*\[\s*\]','no Cron'),
 @('"binding"\s*:\s*"DB"','owner session D1'),
 @('"binding"\s*:\s*"OPERATIONS_DB"','operation D1')
)){
 ExactlyOne $c $rule[0] $rule[1]
}
ExactlyOne $c ('"D3_PILOT_SHA256"\s*:\s*"'+$sha+'"') 'bundled JS SHA'
foreach($flag in @('D3_PILOT_ENABLED','D3_READ_TOKENS_ENABLED')){
 ExactlyOne $c ('"'+$flag+'"\s*:\s*"true"') "$flag read-only"
}
foreach($flag in @('D2_WRITE_ENABLED','D2_RUNNER_ENABLED',
 'D2_READ_TOKENS_ENABLED','D2_TEST_HOST_ENABLED',
 'D3_WRITE_ENABLED','D3_RUNNER_ENABLED','D3_TEST_HOST_ENABLED')){
 ExactlyOne $c ('"'+$flag+'"\s*:\s*"false"') "$flag remains OFF"
}
$pattern='"database_id"\s*:\s*"([0-9a-f-]{36})"'
$a=[regex]::Matches($c,$pattern)
$b=[regex]::Matches($previousConfig,$pattern)
if($a.Count -ne 2 -or $b.Count -ne 2){throw 'D1 binding count drifted.'}
for($i=0;$i -lt 2;$i++){
 if($a[$i].Groups[1].Value -ne $b[$i].Groups[1].Value){
  throw 'D1 binding identity drifted.'
 }
}
foreach($secret in @('GITHUB_CLIENT_ID','GITHUB_CLIENT_SECRET',
 'OWNER_GITHUB_ID','D2_CSRF_KEY','D2_HOST_PROBE_KEY','D2_GITHUB_APP_PRIVATE_KEY')){
 if($c -match ('"'+$secret+'"\s*:\s*"')){
  throw 'Server secret must not be declared as plaintext variable.'
 }
}
if($c.Contains('REPLACE_WITH_') -or
 $c -match '"crons"\s*:\s*\[\s*"'){
 throw 'Unreviewed placeholder or scheduled trigger.'
}
Write-Output 'PASS: Only private owner pilot and sandbox read gates enabled.'
Write-Output 'PASS: Original D1 IDs, encrypted secrets, source hash, zero Cron and writer OFF.'
Push-Location $preview
try{
 if((Version) -ne $previous){throw 'Current Worker differs from approved hard-off version.'}
 $before=IndexHash
 if((Code '/__d3_pilot__/') -ne 404 -or
    (Code '/api/v3/authoring-source') -ne 503){
  throw 'Read-only pilot endpoints had been opened before this deployment.'
 }
 $folder=Join-Path $env:TEMP ('fishing-d3-readonly-'+[guid]::NewGuid().ToString('N'))
 try{
  $output=@(& npx.cmd wrangler deploy --dry-run --config $config --outdir $folder 2>&1)
  if($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $folder)){
   throw 'Read-only Worker local-config dry-run failed.'
  }
 }finally{if(Test-Path -LiteralPath $folder){Remove-Item -LiteralPath $folder -Recurse -Force}}
 if((Version) -ne $previous){throw 'Worker changed during local dry-run.'}
 Write-Output 'PASS: Existing hard-off version and private routes checked; Wrangler dry-run passed.'
 # Only remote-changing command; requires separate owner authorization.
 & npx.cmd wrangler deploy --config $config
 if($LASTEXITCODE -ne 0){throw 'Read-only deployment uncertain; never retry automatically.'}
 $new=Version
 if($new -eq $previous){throw 'No new Worker version observed.'}
 # Anonymous traffic MUST be denied; even if a route was accidentally
 # provisioned, it must never expose private sandbox bytes or JavaScript.
 if((Code '/__d3_pilot__/') -ne 401 -or
    (Code '/__d3_pilot__/pilot.js') -ne 401 -or
    (Code '/api/v3/authoring-source') -ne 401){
  throw 'Owner-only private routes are not refusing anonymous access.'
 }
 if((Code '/api/v3/operations' 'POST') -ne 503 -or
    (Code '/__d3_test__/operations/invalid/Gear/gear.json') -ne 404){
  throw 'Publishing or private hosted-asset gate unexpectedly changed.'
 }
 if((IndexHash) -ne $before){throw 'Public Fishing homepage bytes changed.'}
 Write-Output 'PASS: Anonymous pilot and private source refused; writes blocked.'
 Write-Output 'PASS: Public Fishing homepage byte-identical.'
 Write-Output ('SAFE_READONLY_VERSION: '+$new)
 Write-Output 'PASS: Owner-only read pilot active; no GitHub writer or Cron.'
}finally{Pop-Location}
