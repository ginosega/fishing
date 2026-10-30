# FISH118 D3: source-only fix to previously approved read-only pilot.
# The ONLY remote write is one guarded Worker deploy. No new flags, secrets,
# D1 operations, GitHub publishing, Cron or public Fishing content changes.
param([Parameter(Mandatory=$true)][string]$ExpectedHead,
      [switch]$ApproveNavigationRepair)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$old='b4433324-a9f9-4d32-86e4-e2e3e441698e'
$name='fishing-auth-p0-test'
$origin='https://fishing-auth-p0-test.ginosega.workers.dev'
$pilotSha='73172bb626d57098cfebbb20e4cf57e64b91b06b313a610da43fb1c9496d0032'
$hardoffSha='0c81d91d5b743024d16e65d7732e1e4a889a07d5c578f25e8a6bddbf0b8a63fa'
$root=(Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
$preview=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$config=Join-Path $preview 'wrangler.d3-readonly.local.jsonc'
$hardoff=Join-Path $preview 'wrangler.d3-hardoff.local.jsonc'
$asset=Join-Path $preview 'src\generated\d3-pilot.bundle.txt'
$meta=Join-Path $preview 'src\generated\d3-pilot.bundle.sha256.json'
function RequireOne([string]$content,[string]$regex,[string]$name){
 if([regex]::Matches($content,$regex).Count -ne 1){
  throw "D3 read-only repair guard refused: $name"
 }
}
function LiveVersion{
 $output=@(& npx.cmd wrangler deployments status --name $name 2>&1)
 if($LASTEXITCODE -ne 0){throw 'Cloudflare Worker status unavailable.'}
 $matches=[regex]::Matches(($output -join [Environment]::NewLine),'(?m)\(100%\)\s+([a-f0-9-]{36})')
 if($matches.Count -ne 1){throw 'Live Cloudflare version ambiguous.'}
 return $matches[0].Groups[1].Value
}
function Status([string]$path,[string]$method='GET'){
 try{
  $r=Invoke-WebRequest -Uri ($origin+$path) -Method $method -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 30 -Headers @{'Cache-Control'='no-store'}
  return [int]$r.StatusCode
 }catch{
  if($_.Exception.Response){return [int]$_.Exception.Response.StatusCode}
  throw "Expected origin unreachable: $path"
 }
}
function HomeHash{
 $r=Invoke-WebRequest -Uri ($origin+'/fishing/') -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 30
 if($r.StatusCode -ne 200){throw 'Public Fishing homepage unavailable.'}
 $h=[Security.Cryptography.SHA256]::Create()
 try{
  $b=[Text.Encoding]::UTF8.GetBytes([string]$r.Content)
  return ([BitConverter]::ToString($h.ComputeHash($b)).Replace('-','').ToLowerInvariant())
 }finally{$h.Dispose()}
}
if(-not $ApproveNavigationRepair){throw 'Explicit previously approved read-only repair switch required.'}
if($ExpectedHead -notmatch '^[0-9a-f]{40}$'){throw 'Full reviewed source SHA required.'}
Push-Location $root
try{
 $head=(& git rev-parse HEAD).Trim()
 $branch=(& git branch --show-current).Trim()
 $dirty=@(& git status --porcelain --untracked-files=no)
 if($LASTEXITCODE -ne 0 -or $head -ne $ExpectedHead -or
  $branch -ne 'feature/fish118-p3-mock-publisher' -or
  $dirty.Count -ne 0){throw 'Source checkout does not match reviewed clean PR.'}
}finally{Pop-Location}
foreach($p in @($config,$hardoff,$asset,$meta)){
 if(-not (Test-Path -LiteralPath $p)){throw 'Missing local read-only configuration or bundle.'}
}
Push-Location (Join-Path $root 'pwa')
try{
 & node tools/build-d3-pilot.mjs --check
 if($LASTEXITCODE -ne 0){throw 'Private pilot bundle build failed.'}
 & node tools/verify-d3-runtime.mjs
 if($LASTEXITCODE -ne 0){throw 'Bundled Worker local verification failed.'}
}finally{Pop-Location}
$m=Get-Content -LiteralPath $meta -Raw | ConvertFrom-Json
$digest=(Get-FileHash -LiteralPath $asset -Algorithm SHA256).Hash.ToLowerInvariant()
if($m.format -ne 'fishing-d3-pilot-local-build-v1' -or
 $m.sha256 -ne $pilotSha -or $digest -ne $pilotSha -or
 (Get-Item -LiteralPath $asset).Length -ne $m.bytes){
 throw 'Navigation-only fix unexpectedly changed private browser JS.'
}
$c=[IO.File]::ReadAllText($config)
$previous=[IO.File]::ReadAllText($hardoff)
if(-not $previous.Contains('"D3_PILOT_SHA256": "'+$hardoffSha+'"')){
 throw 'Cannot validate original known hard-off baseline.'
}
$expected=$previous.Replace($hardoffSha,$pilotSha)
$expected=$expected.Replace('"D3_PILOT_ENABLED": "false"','"D3_PILOT_ENABLED": "true"')
$expected=$expected.Replace('"D3_READ_TOKENS_ENABLED": "false"','"D3_READ_TOKENS_ENABLED": "true"')
if($c -cne $expected){
 throw 'Runtime configuration differs from last approved read-only deployment.'
}
foreach($flag in @('D3_PILOT_ENABLED','D3_READ_TOKENS_ENABLED')){
 RequireOne $c ('"'+$flag+'"\s*:\s*"true"') "$flag stays enabled"
}
foreach($flag in @('D2_WRITE_ENABLED','D2_RUNNER_ENABLED',
 'D2_READ_TOKENS_ENABLED','D2_TEST_HOST_ENABLED','D3_WRITE_ENABLED',
 'D3_RUNNER_ENABLED','D3_TEST_HOST_ENABLED')){
 RequireOne $c ('"'+$flag+'"\s*:\s*"false"') "$flag stays OFF"
}
foreach($regex in @(
 '"name"\s*:\s*"fishing-auth-p0-test"',
 '"main"\s*:\s*"src/d3-owner-runtime\.mjs"',
 '"APP_ORIGIN"\s*:\s*"https://fishing-auth-p0-test\.ginosega\.workers\.dev"',
 '"D3_SANDBOX_REPO_ID"\s*:\s*"1430581407"',
 '"D3_GITHUB_APP_ID"\s*:\s*"5436811"',
 '"D3_GITHUB_INSTALLATION_ID"\s*:\s*"174361658"',
 '"workers_dev"\s*:\s*true',
 '"preview_urls"\s*:\s*false',
 '"keep_vars"\s*:\s*true',
 '"binding"\s*:\s*"DB"',
 '"binding"\s*:\s*"OPERATIONS_DB"',
 '"crons"\s*:\s*\[\s*\]'
)){RequireOne $c $regex $regex}
$ids=[regex]::Matches($c,'"database_id"\s*:\s*"[a-f0-9-]{36}"')
if($ids.Count -ne 2 -or $c.Contains('REPLACE_WITH_')){
 throw 'Unexpected D1 bindings or placeholders.'
}
foreach($secret in @('D2_CSRF_KEY','D2_GITHUB_APP_PRIVATE_KEY',
 'D2_HOST_PROBE_KEY','GITHUB_CLIENT_SECRET')){
 if($c -match ('"'+$secret+'"\s*:\s*"')){
  throw 'A server secret appears in plaintext vars.'
 }
}
Write-Output 'PASS: Unchanged read-only config, original D1 bindings, private JS checksum.'
Write-Output 'PASS: All D2 gates and D3 publishing/runner/test-host OFF; no Cron.'
Push-Location $preview
try{
 if((LiveVersion) -ne $old){throw 'Current deployed Worker differs from pinned read-only version.'}
 $before=HomeHash
 foreach($item in @(
  @('/__d3_pilot__/',401),
  @('/__d3_pilot__/pilot.js',401),
  @('/api/v3/authoring-source',401),
  @('/__d3_test__/operations/invalid/Gear/gear.json',404)
 )){
  if((Status $item[0]) -ne $item[1]){
   throw "Unexpected anonymous status before deploy: $($item[0])"
  }
 }
 if((Status '/api/v3/operations' 'POST') -ne 503){throw 'Publishing unexpectedly enabled.'}
 $folder=Join-Path $env:TEMP ('fishing-d3-navigation-'+[guid]::NewGuid().ToString('N'))
 try{
  $discard=@(& npx.cmd wrangler deploy --dry-run --config $config --outdir $folder 2>&1)
  if($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $folder)){
   throw 'Actual local-config Wrangler dry-run failed.'
  }
 }finally{
  if(Test-Path -LiteralPath $folder){Remove-Item -LiteralPath $folder -Recurse -Force}
 }
 if((LiveVersion) -ne $old){throw 'Worker changed during dry-run.'}
 Write-Output 'PASS: Verified current live version, blocked anonymous endpoints and Wrangler dry-run.'
 # ONLY provider mutation, within the already approved read-only scope.
 & npx.cmd wrangler deploy --config $config
 if($LASTEXITCODE -ne 0){throw 'Deploy outcome uncertain; do not blindly retry.'}
 $next=LiveVersion
 if($next -eq $old){throw 'No new Worker version observed.'}
 foreach($item in @(
  @('/__d3_pilot__/',401),
  @('/__d3_pilot__/pilot.js',401),
  @('/api/v3/authoring-source',401),
  @('/__d3_test__/operations/invalid/Gear/gear.json',404)
  )){
  if((Status $item[0]) -ne $item[1]){
   throw "Unexpected anonymous status after deploy: $($item[0])"
  }
 }
 if((Status '/api/v3/operations' 'POST') -ne 503){
  throw 'Publishing gate changed after navigation repair.'
 }
 if((HomeHash) -ne $before){throw 'Public Fishing homepage changed.'}
 Write-Output 'PASS: Anonymous private routes denied, publication OFF, public V2 unchanged.'
 Write-Output ('SAFE_REPAIR_VERSION: '+$next)
 Write-Output 'PASS: Read-only navigation fix deployed with no new privileges.'
}finally{Pop-Location}
