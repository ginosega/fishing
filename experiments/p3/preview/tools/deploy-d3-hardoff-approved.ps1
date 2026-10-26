# FISH118 D3: one-time approved hard-OFF Cloudflare Worker replacement.
# No secrets, D1 changes, new routes, Cron, publishing, or GitHub writes.
param([Parameter(Mandatory=$true)][string]$ExpectedHead,
      [switch]$ApproveHardOffDeployment)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$old='82b678b2-b024-4428-922c-d2363f2bcbc2'
$name='fishing-auth-p0-test'
$origin='https://fishing-auth-p0-test.ginosega.workers.dev'
$root=(Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
$preview=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$config=Join-Path $preview 'wrangler.d3-hardoff.local.jsonc'
$parked=Join-Path $preview 'wrangler.d2-parked.local.jsonc'
$asset=Join-Path $preview 'src\generated\d3-pilot.bundle.txt'
$meta=Join-Path $preview 'src\generated\d3-pilot.bundle.sha256.json'
function ExactlyOne([string]$text,[string]$pattern,[string]$label){
 if([regex]::Matches($text,$pattern).Count -ne 1){throw "Safety check failed: $label"}
}
function LiveVersion {
 $output=@(& npx.cmd wrangler deployments status --name $name 2>&1)
 if($LASTEXITCODE -ne 0){throw 'Wrangler deployment status unavailable.'}
 $matches=[regex]::Matches(($output -join [Environment]::NewLine),'(?m)\(100%\)\s+([0-9a-f-]{36})')
 if($matches.Count -ne 1){throw 'Live Worker version is ambiguous.'}
 return $matches[0].Groups[1].Value
}
function Status([string]$path,[string]$method='GET'){
 try{
  $r=Invoke-WebRequest -Uri ($origin+$path) -Method $method -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 30
  return [int]$r.StatusCode
 }catch{
  if($_.Exception.Response){return [int]$_.Exception.Response.StatusCode}
  throw "Origin inaccessible at $path"
 }
}
function IndexHash{
 $r=Invoke-WebRequest -Uri ($origin+'/fishing/') -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 30
 if($r.StatusCode -ne 200){throw 'Public Fishing index unavailable.'}
 $bytes=[Text.Encoding]::UTF8.GetBytes([string]$r.Content)
 $h=[Security.Cryptography.SHA256]::Create()
 try{return ([BitConverter]::ToString($h.ComputeHash($bytes)).Replace('-','').ToLowerInvariant())}
 finally{$h.Dispose()}
}
if(-not $ApproveHardOffDeployment){throw 'Explicit approved hard-OFF switch required.'}
if($ExpectedHead -notmatch '^[a-f0-9]{40}$'){throw 'Expected source SHA required.'}
Push-Location $root
try{
 $head=(& git rev-parse HEAD).Trim()
 $branch=(& git branch --show-current).Trim()
 $dirty=@(& git status --porcelain --untracked-files=no)
 if($LASTEXITCODE -ne 0 -or $head -ne $ExpectedHead -or
  $branch -ne 'feature/fish118-p3-mock-publisher' -or
  $dirty.Count -ne 0){throw 'Git source revision, branch or cleanliness mismatch.'}
}finally{Pop-Location}
foreach($path in @($config,$parked,$asset,$meta)){
 if(-not (Test-Path -LiteralPath $path)){throw 'A verified local preflight artifact is missing.'}
}
$c=[IO.File]::ReadAllText($config)
$p=[IO.File]::ReadAllText($parked)
$manifest=Get-Content -LiteralPath $meta -Raw | ConvertFrom-Json
$hash=(Get-FileHash -LiteralPath $asset -Algorithm SHA256).Hash.ToLowerInvariant()
if($manifest.format -ne 'fishing-d3-pilot-local-build-v1' -or
 $hash -ne $manifest.sha256 -or
 $hash -notmatch '^[a-f0-9]{64}$' -or
 (Get-Item -LiteralPath $asset).Length -ne $manifest.bytes){
 throw 'Pilot bytes or SHA-256 manifest mismatch.'
}
$checks=@(
 @('"name"\s*:\s*"fishing-auth-p0-test"','Worker identity'),
 @('"main"\s*:\s*"src/d3-owner-runtime\.mjs"','D3 entry'),
 @('"APP_ORIGIN"\s*:\s*"https://fishing-auth-p0-test\.ginosega\.workers\.dev"','Origin'),
 @('"workers_dev"\s*:\s*true','Workers.dev'),
 @('"preview_urls"\s*:\s*false','Preview OFF'),
 @('"keep_vars"\s*:\s*true','Preserve variables/secrets'),
 @('"type"\s*:\s*"Text"','Text module'),
 @('"fallthrough"\s*:\s*true','Text fallback'),
 @('"D2_SANDBOX_REPO_ID"\s*:\s*"1430581407"','D2 repo'),
 @('"D3_SANDBOX_REPO_ID"\s*:\s*"1430581407"','D3 repo'),
 @('"D2_GITHUB_APP_ID"\s*:\s*"5436811"','D2 App'),
 @('"D3_GITHUB_APP_ID"\s*:\s*"5436811"','D3 App'),
 @('"D2_GITHUB_INSTALLATION_ID"\s*:\s*"174361658"','D2 installation'),
 @('"D3_GITHUB_INSTALLATION_ID"\s*:\s*"174361658"','D3 installation'),
 @('"binding"\s*:\s*"DB"','Sessions D1'),
 @('"binding"\s*:\s*"OPERATIONS_DB"','Operations D1'),
 @('"database_name"\s*:\s*"fishing-auth-p0"','Sessions D1 name'),
 @('"database_name"\s*:\s*"fishing-p3-sandbox"','Operations D1 name'),
 @('"crons"\s*:\s*\[\s*\]','Zero Cron')
)
foreach($row in $checks){ExactlyOne $c $row[0] $row[1]}
ExactlyOne $c ('"D3_PILOT_SHA256"\s*:\s*"'+$hash+'"') 'Pilot checksum'
ExactlyOne $p '"main"\s*:\s*"src/d2-live-publisher-worker\.mjs"' 'Parked D2 source'
foreach($flag in @('D2_WRITE_ENABLED','D2_RUNNER_ENABLED','D2_READ_TOKENS_ENABLED',
 'D2_TEST_HOST_ENABLED','D3_WRITE_ENABLED','D3_RUNNER_ENABLED',
 'D3_READ_TOKENS_ENABLED','D3_TEST_HOST_ENABLED','D3_PILOT_ENABLED')){
 ExactlyOne $c ('"'+$flag+'"\s*:\s*"false"') "$flag disabled"
}
foreach($secret in @('D2_CSRF_KEY','D2_HOST_PROBE_KEY','D2_GITHUB_APP_PRIVATE_KEY',
 'GITHUB_CLIENT_ID','GITHUB_CLIENT_SECRET','OWNER_GITHUB_ID')){
 if($c -match ('"'+$secret+'"\s*:\s*"')){
  throw 'An encrypted secret was redeclared as a plaintext variable.'
 }
}
if($c -match '"D3_GITHUB_APP_PRIVATE_KEY"\s*:' -or
 $c -match '"D3_HOST_PROBE_KEY"\s*:' -or
 $c.Contains('REPLACE_WITH_') -or
 $c -match '"crons"\s*:\s*\[\s*"'){
 throw 'Unexpected secret, unresolved placeholder or Cron.'
}
$regex='"database_id"\s*:\s*"([a-f0-9-]{36})"'
$ids=[regex]::Matches($c,$regex)
$oldIds=[regex]::Matches($p,$regex)
if($ids.Count -ne 2 -or $oldIds.Count -ne 2){throw 'Expected exactly two D1 UUIDs.'}
for($i=0;$i -lt 2;$i++){
 if($ids[$i].Groups[1].Value -ne $oldIds[$i].Groups[1].Value){
  throw 'Existing D1 UUID drift.'
 }
}
if($ids[0].Groups[1].Value -eq $ids[1].Groups[1].Value){
 throw 'D1 UUIDs must be distinct.'
}
Write-Output 'PASS: Exact Git head, original D1 bindings, pilot hash and all flags OFF.'
Push-Location $preview
try{
 if((LiveVersion) -ne $old){throw 'Worker changed from pinned parked D2 version.'}
 $before=IndexHash
 if((Status '/__d3_pilot__/') -ne 404 -or
    (Status '/__d3_pilot__/pilot.js') -ne 404){
  throw 'D3 pilot route unexpectedly live before deployment.'
 }
 Write-Output 'PASS: Parked D2 version and public homepage verified.'
 $folder=Join-Path $env:TEMP ('fishing-d3-dryrun-'+[guid]::NewGuid().ToString('N'))
 try{
  $discard=@(& npx.cmd wrangler deploy --dry-run --config $config --outdir $folder 2>&1)
  if($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $folder)){
   throw 'Local-config Wrangler dry-run failed; no deployment.'
  }
 }finally{
  if(Test-Path -LiteralPath $folder){Remove-Item -LiteralPath $folder -Force -Recurse}
 }
 if((LiveVersion) -ne $old){throw 'Live Worker changed during dry-run.'}
 Write-Output 'PASS: Real-config Wrangler dry-run; parked version unchanged.'
 # The ONLY remote-changing command, authorized for hard-OFF replacement.
 & npx.cmd wrangler deploy --config $config
 if($LASTEXITCODE -ne 0){throw 'Deploy outcome uncertain; do not blindly retry.'}
 $next=LiveVersion
 if($next -eq $old){throw 'Cloudflare did not switch to a new Worker version.'}
 Write-Output 'PASS: Disabled D3 Worker version deployed.'
 if((Status '/__d3_pilot__/') -ne 404 -or
    (Status '/__d3_pilot__/pilot.js') -ne 404 -or
    (Status '/__d3_test__/operations/invalid/Gear/gear.json') -ne 404){
  throw 'Private D3 path unexpectedly available.'
 }
 if((Status '/api/v3/authoring-source') -ne 503 -or
    (Status '/api/v3/operations' 'POST') -ne 503){
  throw 'D3 source/publishing gates unexpectedly open.'
 }
 if((IndexHash) -ne $before){throw 'Public Fishing HTML changed; investigate rollback.'}
 Write-Output 'PASS: Pilot hidden, publishing OFF, public HTML unchanged.'
 Write-Output ('SAFE_NEW_VERSION: '+$next)
 Write-Output 'PASS: Approved hard-OFF deployment complete; old D2 rollback retained.'
}finally{Pop-Location}
