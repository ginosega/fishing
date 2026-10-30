# FISH118 D3: safe error-code visibility repair; NO new publishing privileges.
# Performs a single exact-version-pinned Worker update. No D1 writes, GitHub
# writes, operations, PWA public cutover, or changes to the active Cron scope.
param([Parameter(Mandatory=$true)][string]$ExpectedHead,
      [switch]$ApplyDiagnosticRefresh)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$root=(Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
$preview=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$oldConfig=Join-Path $preview 'wrangler.d3-sandbox-write.local.jsonc'
$newConfig=Join-Path $preview 'wrangler.d3-source-diagnostic.local.jsonc'
$bundle=Join-Path $preview 'src\generated\d3-pilot.bundle.txt'
$meta=Join-Path $preview 'src\generated\d3-pilot.bundle.sha256.json'
$worker='fishing-auth-p0-test'
$origin='https://fishing-auth-p0-test.ginosega.workers.dev'
$oldVersion='5fd62a0e-bd9d-4d91-bd63-fa40aff70fac'
$oldSha='7ab8081d14aabd37c77590b8e2a9c87199fdaebb6d63eb27edd2db27b98d9e2c'
function One([string]$raw,[string]$pattern,[string]$label){
 if([regex]::Matches($raw,$pattern).Count -ne 1){
  throw "D3 diagnostic rollout denied: $label"
 }
}
function LiveVersion {
 $raw=@(& npx.cmd --yes wrangler@4.153.0 deployments status --name $worker)
 if($LASTEXITCODE -ne 0){throw 'Cannot verify live Worker version.'}
 $matches=[regex]::Matches(($raw -join [Environment]::NewLine),
  '(?m)\(100%\)\s+([0-9a-f-]{36})')
 if($matches.Count -ne 1){throw 'Ambiguous live Worker version.'}
 return $matches[0].Groups[1].Value
}
function Status([string]$path,[string]$method='GET'){
 try {
  $reply=Invoke-WebRequest -Uri ($origin+$path) -Method $method -UseBasicParsing -TimeoutSec 30 -MaximumRedirection 0 -Headers @{'Cache-Control'='no-store'}
  return [int]$reply.StatusCode
 }catch {
  if($_.Exception.Response){return [int]$_.Exception.Response.StatusCode}
  throw "Cannot check private route status: $path"
 }
}
function PublicHash {
 $response=Invoke-WebRequest -Uri ($origin+'/fishing/') -UseBasicParsing -TimeoutSec 30 -MaximumRedirection 0 -Headers @{'Cache-Control'='no-store'}
 if($response.StatusCode -ne 200){throw 'Public V2 homepage not available.'}
 $sha=[Security.Cryptography.SHA256]::Create()
 try {
  return [BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes([string]$response.Content))).Replace('-','').ToLowerInvariant()
 }finally{$sha.Dispose()}
}
function VerifyD1 {
 $sql="SELECT COUNT(*) AS total, SUM(CASE WHEN state NOT IN ('Live','Conflict','Failed') THEN 1 ELSE 0 END) AS active, SUM(CASE WHEN operation_id='p3_343ef7ba-1c87-4d5d-a2ad-92e91eab420f' AND state='Live' AND reason_code IS NULL AND merge_sha='89be79a9c933dd36bd909edd585091232831c835' AND verified_release_id='73362eb77bd59219aa6f78fb93e9d47b' THEN 1 ELSE 0 END) AS d2 FROM p3_operations WHERE github_id=265665562 AND repo_id=1430581407;"
 $cmd=@('--yes','wrangler@4.153.0','d1','execute','fishing-p3-sandbox','--remote','--json','--config',$oldConfig,'--command',$sql)
 $raw=@(& npx.cmd @cmd)
 if($LASTEXITCODE -ne 0){throw 'Remote D1 read-only safety query failed.'}
 try{$parsed=ConvertFrom-Json -InputObject ($raw -join [Environment]::NewLine)}
 catch{throw 'Invalid remote D1 summary response.'}
 $rows=@($parsed)
 if($rows.Count -ne 1 -or $rows[0].success -ne $true -or @($rows[0].results).Count -ne 1){
  throw 'Unexpected D1 summary results.'
 }
 $s=$rows[0].results[0]
 if([int]$s.total -ne 1 -or [int]$s.active -ne 0 -or [int]$s.d2 -ne 1){
  throw 'Pending or unexpected operation: do not repair live Worker.'
 }
}
if(-not $ApplyDiagnosticRefresh){throw 'Explicit owner invocation switch required.'}
if($ExpectedHead -notmatch '^[0-9a-f]{40}$'){throw 'Exact 40-char reviewed SHA required.'}
Push-Location $root
try {
 $head=(& git rev-parse HEAD).Trim()
 $branch=(& git branch --show-current).Trim()
 $dirty=@(& git status --porcelain --untracked-files=no)
 if($LASTEXITCODE -ne 0 -or $head -ne $ExpectedHead -or
  $branch -ne 'feature/fish118-p3-mock-publisher' -or $dirty.Count -ne 0){
  throw 'Wrong source branch, commit or tracked working tree changed.'
 }
}finally{Pop-Location}
if(-not (Test-Path -LiteralPath $oldConfig)){throw 'Original published D3 config not available.'}
if(Test-Path -LiteralPath $newConfig){throw 'Diagnostic candidate already exists; do not retry blindly.'}
$original=[IO.File]::ReadAllText($oldConfig)
foreach($rule in @(
 '"name"\s*:\s*"fishing-auth-p0-test"',
 '"main"\s*:\s*"src/d3-owner-runtime\.mjs"',
 '"APP_ORIGIN"\s*:\s*"https://fishing-auth-p0-test\.ginosega\.workers\.dev"',
 '"D3_SANDBOX_REPO_ID"\s*:\s*"1430581407"',
 '"D2_GITHUB_APP_ID"\s*:\s*"5436811"',
 '"D3_GITHUB_APP_ID"\s*:\s*"5436811"',
 '"D2_GITHUB_INSTALLATION_ID"\s*:\s*"174361658"',
 '"D3_GITHUB_INSTALLATION_ID"\s*:\s*"174361658"',
 '"keep_vars"\s*:\s*true',
 '"workers_dev"\s*:\s*true',
 '"preview_urls"\s*:\s*false',
 '"binding"\s*:\s*"DB"',
 '"binding"\s*:\s*"OPERATIONS_DB"',
 '"crons"\s*:\s*\[\s*"\*/5 \* \* \* \*"\s*\]'
)){One $original $rule $rule}
One $original ('"D3_PILOT_SHA256"\s*:\s*"'+$oldSha+'"') 'Original pilot identity'
foreach($name in @('D3_WRITE_ENABLED','D3_RUNNER_ENABLED','D3_TEST_HOST_ENABLED','D3_READ_TOKENS_ENABLED','D3_PILOT_ENABLED')){
 One $original ('"'+$name+'"\s*:\s*"true"') "$name must remain ON"
}
foreach($name in @('D2_WRITE_ENABLED','D2_RUNNER_ENABLED','D2_READ_TOKENS_ENABLED','D2_TEST_HOST_ENABLED')){
 One $original ('"'+$name+'"\s*:\s*"false"') "$name must remain OFF"
}
if([regex]::Matches($original,'"database_id"\s*:\s*"[a-f0-9-]{36}"').Count -ne 2 -or $original.Contains('REPLACE_WITH_')){
 throw 'Expected pinned D1 bindings missing.'
}
foreach($secret in @('D2_CSRF_KEY','D2_GITHUB_APP_PRIVATE_KEY','D2_HOST_PROBE_KEY','GITHUB_CLIENT_SECRET')){
 if($original -match ('"'+$secret+'"\s*:\s*"')){throw 'Plaintext secret in local config.'}
}
Push-Location (Join-Path $root 'pwa')
try {
 & node tools/build-d3-pilot.mjs --check
 if($LASTEXITCODE -ne 0){throw 'Owner pilot bundle failed.'}
 & node tools/verify-d3-windows-eol.mjs
 if($LASTEXITCODE -ne 0){throw 'Windows parity failed.'}
 & node tools/verify-d3-csp.mjs
 if($LASTEXITCODE -ne 0){throw 'Strict CSP check failed.'}
 & node tools/verify-d3-runtime.mjs
 if($LASTEXITCODE -ne 0){throw 'Private Worker bundle validation failed.'}
}finally{Pop-Location}
$metadata=Get-Content -LiteralPath $meta -Raw | ConvertFrom-Json
$now=(Get-FileHash -LiteralPath $bundle -Algorithm SHA256).Hash.ToLowerInvariant()
if($metadata.format -ne 'fishing-d3-pilot-local-build-v1' -or
 $now -notmatch '^[0-9a-f]{64}$' -or $metadata.sha256 -ne $now -or
 $metadata.bytes -ne (Get-Item -LiteralPath $bundle).Length -or $now -eq $oldSha){
 throw 'New diagnostic client bundle cannot be verified.'
}
$proposed=$original.Replace($oldSha,$now)
if($proposed -ceq $original -or $proposed.Contains('REPLACE_WITH_')){
 throw 'Refuse any configuration change beyond owner pilot digest.'
}
[IO.File]::WriteAllText($newConfig,$proposed,(New-Object Text.UTF8Encoding($false)))
Push-Location $preview
try {
 if((LiveVersion) -ne $oldVersion){throw 'Worker changed since proven D3 sandbox activation.'}
 $public=PublicHash
 VerifyD1
 foreach($route in @('/__d3_pilot__/','/__d3_pilot__/pilot.js','/api/v3/authoring-source')){
  if((Status $route) -ne 401){throw "Unexpected anonymous private route: $route"}
 }
 $oldPost=Status '/api/v3/operations' 'POST'
 if(@(401,403,415) -notcontains $oldPost){
  throw 'Existing D3 POST unexpectedly permits anonymous write.'
 }
 $tmp=Join-Path $env:TEMP ('fishing-d3-diagnostic-'+[guid]::NewGuid().ToString('N'))
 try {
  $output=@(& npx.cmd --yes wrangler@4.153.0 deploy --dry-run --config $newConfig --outdir $tmp)
  if($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $tmp)){
   throw 'Wrangler dry-run failed. No deployment.'
  }
 }finally{if(Test-Path -LiteralPath $tmp){Remove-Item -LiteralPath $tmp -Force -Recurse}}
 VerifyD1
 if((LiveVersion) -ne $oldVersion -or (PublicHash) -ne $public){
  throw 'Live Worker or public V2 changed during preflight.'
 }
 Write-Output 'PASS: Exact source, config-only digest change, D1, current Worker and dry-run.'
 # Single approved code-refresh deployment, no automatic retry on ambiguity.
 & npx.cmd --yes wrangler@4.153.0 deploy --config $newConfig
 if($LASTEXITCODE -ne 0){throw 'Deployment outcome uncertain; do not retry.'}
 $nextVersion=LiveVersion
 if($nextVersion -eq $oldVersion){throw 'Expected new Worker version not observed.'}
 foreach($route in @('/__d3_pilot__/','/__d3_pilot__/pilot.js','/api/v3/authoring-source')){
  if((Status $route) -ne 401){throw "Anonymous private route no longer denied: $route"}
 }
 $post=Status '/api/v3/operations' 'POST'
 if(@(401,403,415) -notcontains $post){throw 'Anonymous POST denied invariant failed.'}
 if((PublicHash) -ne $public){throw 'Public V2 homepage changed.'}
 VerifyD1
 Write-Output ('SAFE_D3_SOURCE_DIAGNOSTIC_VERSION: '+$nextVersion)
 Write-Output ('D3_PILOT_SHA256: '+$now)
 Write-Output 'PASS: Only sandbox owner diagnostic code refreshed; publishing permissions and Cron unchanged.'
 Write-Output 'PASS: Public V2 unchanged; no D3 operations accepted or replayed.'
}finally{Pop-Location}
