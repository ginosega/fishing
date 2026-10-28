# FISH118 D3: restore authenticated cross-device publication-status discovery in private owner pilot.
# One guarded Worker-only update; preserve public V2, Cron and D1.
# Performs a single exact-version-pinned Worker update. No D1 writes, GitHub
# writes, operations, PWA public cutover, or changes to the active Cron scope.
param([Parameter(Mandatory=$true)][string]$ExpectedHead,
      [Parameter(Mandatory=$true)][string]$ExpectedWorkerVersion,
      [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{64}
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$root=(Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
$preview=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$oldConfig=Join-Path $preview 'wrangler.d3-merge-tree-recovery.local.jsonc'
$newConfig=Join-Path $preview 'wrangler.d3-cross-device-status-fix.local.jsonc'
$bundle=Join-Path $preview 'src\generated\d3-pilot.bundle.txt'
$meta=Join-Path $preview 'src\generated\d3-pilot.bundle.sha256.json'
$worker='fishing-auth-p0-test'
$origin='https://fishing-auth-p0-test.ginosega.workers.dev'
$oldVersion=$ExpectedWorkerVersion  # caller supplies exact current deployed version
if($oldVersion -ne '4266c366-c41b-412a-9158-6552950be9e8'){
 throw 'Unexpected predecessor Worker version; no deploy.'
}
$oldSha='2432469c22796e19b15fbd9042d39832a81a9a51d7695f186029c7f3080d6708'
$newSha=$ExpectedPilotSha256
if($newSha -eq $oldSha){throw 'Owner pilot bundle is unchanged; refusing no-op update.'}
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
 # Availability is part of the gate, not a reason to bypass it.
 # Bound transient network retries to three attempts; any persistent
 # failure refuses the code deployment (or fails postflight visibly).
 $response=$null
 for($attempt=1;$attempt -le 3;$attempt++){
  try{
   $response=Invoke-WebRequest -Uri ($origin+'/fishing/') -UseBasicParsing -TimeoutSec 20 -MaximumRedirection 0 -Headers @{'Cache-Control'='no-store'} -ErrorAction Stop
   if([int]$response.StatusCode -ne 200){throw 'Public V2 homepage returned non-200.'}
   break
  }catch{
   if($attempt -eq 3){throw 'Public V2 unavailable after three bounded probes; verify Worker before any retry.'}
   Start-Sleep -Seconds 2
  }
 }
 if($null -eq $response -or [int]$response.StatusCode -ne 200){throw 'Public V2 homepage unavailable.'}
 $sha=[Security.Cryptography.SHA256]::Create()
 try {
  return [BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes([string]$response.Content))).Replace('-','').ToLowerInvariant()
 }finally{$sha.Dispose()}
}
function VerifyD1([switch]$AllowRecovery){
 $sql="SELECT COUNT(*) AS total, SUM(CASE WHEN operation_id='p3_343ef7ba-1c87-4d5d-a2ad-92e91eab420f' AND state='Live' AND reason_code IS NULL AND merge_sha='89be79a9c933dd36bd909edd585091232831c835' THEN 1 ELSE 0 END) AS d2, SUM(CASE WHEN operation_id='p3_10a266d9-87c9-4dae-8293-abc942e99007' AND state='Live' AND reason_code IS NULL AND pr_number=17 AND merge_sha='7418cc15e5e392b6e52a48eb533804a5055ca8d7' THEN 1 ELSE 0 END) AS gear, SUM(CASE WHEN operation_id='p3_5527208d-a67c-4a2c-876d-9edaee353bc8' AND github_id=265665562 AND repo_id=1430581407 AND state='Merging' AND reason_code='merge_attempted' AND pr_number=18 AND pr_head_sha='9276f35348e43a23c72208f3b2134e28554382fd' AND main_base_sha='7418cc15e5e392b6e52a48eb533804a5055ca8d7' AND merge_sha IS NULL AND workflow_run_id=40600896518 AND lease_expires_at<=unixepoch('now') THEN 1 ELSE 0 END) AS kb_blocked, SUM(CASE WHEN operation_id='p3_5527208d-a67c-4a2c-876d-9edaee353bc8' AND github_id=265665562 AND repo_id=1430581407 AND pr_number=18 AND pr_head_sha='9276f35348e43a23c72208f3b2134e28554382fd' AND main_base_sha='7418cc15e5e392b6e52a48eb533804a5055ca8d7' AND workflow_run_id=40600896518 AND merge_sha='97f68efc932084f2e607480c12cee37a94f81758' AND state IN ('Deploying','Verifying','Live') THEN 1 ELSE 0 END) AS kb_recovered FROM p3_operations;"
 $raw=@(& npx.cmd --yes wrangler@4.153.0 d1 execute fishing-p3-sandbox --remote --json --config $oldConfig --command $sql)
 if($LASTEXITCODE -ne 0){throw 'D1 read-only preflight failed.'}
 try{$p=ConvertFrom-Json -InputObject ($raw -join [Environment]::NewLine)}catch{throw 'Invalid D1 JSON.'}
 $a=@($p)
 if($a.Count -ne 1 -or $a[0].success -ne $true -or @($a[0].results).Count -ne 1){throw 'Unexpected D1 query result.'}
 $r=$a[0].results[0]
 if([int]$r.total -ne 3 -or [int]$r.d2 -ne 1 -or [int]$r.gear -ne 1){throw 'D1 baseline changed; no deployment.'}
 if($AllowRecovery){
  if(([int]$r.kb_blocked+[int]$r.kb_recovered) -ne 1){throw 'Unexpected KB D1 state after deployment.'}
 }elseif([int]$r.kb_blocked -ne 1 -or [int]$r.kb_recovered -ne 0){
  throw 'Expired KB merge marker no longer matches; no deployment.'
 }
}

if(-not $ApproveCrossDeviceStatusFix){throw 'Explicit one-time private Worker cross-device status update approval required.'}
if($ExpectedWorkerVersion -notmatch '^[0-9a-f-]{36}$'){throw 'Exact current Worker version required.'}
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
 $now -ne $newSha -or $metadata.sha256 -ne $newSha -or
 $metadata.bytes -ne (Get-Item -LiteralPath $bundle).Length){
 throw 'New diagnostic client bundle cannot be verified.'
}
$proposed=$original.Replace($oldSha,$newSha)
if($proposed.Contains('REPLACE_WITH_') -or
 $proposed -ceq $original -or
 [regex]::Matches($original,'"D3_PILOT_SHA256"\s*:\s*"'+$oldSha+'"').Count -ne 1 -or
 [regex]::Matches($proposed,'"D3_PILOT_SHA256"\s*:\s*"'+$newSha+'"').Count -ne 1 -or
 $proposed.Replace($newSha,$oldSha) -cne $original){
 throw 'Refuse config change beyond one exact reviewed owner pilot hash.'
}
if(Test-Path -LiteralPath $newConfig){
 # A failed preflight can leave a local candidate. Reuse it ONLY when it is
 # byte-for-byte the same vetted config. Never adopt unreviewed edits.
 if([IO.File]::ReadAllText($newConfig) -cne $proposed){
  throw 'Existing candidate config differs from the reviewed original; refuse.'
 }
 Write-Output 'PASS: Reusing exact existing candidate after pre-deployment timeout.'
}else{
 [IO.File]::WriteAllText($newConfig,$proposed,(New-Object Text.UTF8Encoding($false)))
}
Push-Location $preview
try {
 if((LiveVersion) -ne $oldVersion){throw 'Unexpected deployed Worker version; refuse replacement.'}
 $public=PublicHash
 VerifyD1
 foreach($route in @('/__d3_pilot__/','/__d3_pilot__/pilot.js','/api/v3/authoring-source')){
  if((Status $route) -ne 401){throw "Unexpected anonymous private route: $route"}
 }
 $oldPost=Status '/api/v3/operations' 'POST'
 if(@(401,403,415) -notcontains $oldPost){
  throw 'Existing D3 POST unexpectedly permits anonymous write.'
 }
 $tmp=Join-Path $env:TEMP ('fishing-d3-cross-device-status-fix-'+[guid]::NewGuid().ToString('N'))
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
 Write-Output 'PASS: Current exact Worker/config, two completed receipts, blocked KB and guarded dry-run.'
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
 VerifyD1 -AllowRecovery
 Write-Output ('SAFE_D3_CROSS_DEVICE_STATUS_VERSION: '+$nextVersion)
 Write-Output ('D3_PILOT_SHA256: '+$now)
 Write-Output 'PASS: Owner-only cross-device latest status added without GitHub writes or changing merge/hosted proof guards.'
 Write-Output 'PASS: Public V2 unchanged; completed Gear/D2 plus blocked-or-recovered KB preserved; no replay.'
}finally{Pop-Location}
)][string]$ExpectedPilotSha256,
      [switch]$ApproveCrossDeviceStatusFix)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$root=(Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
$preview=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$oldConfig=Join-Path $preview 'wrangler.d3-readonly-merge-status-fix.local.jsonc'
$newConfig=Join-Path $preview 'wrangler.d3-merge-tree-recovery.local.jsonc'
$bundle=Join-Path $preview 'src\generated\d3-pilot.bundle.txt'
$meta=Join-Path $preview 'src\generated\d3-pilot.bundle.sha256.json'
$worker='fishing-auth-p0-test'
$origin='https://fishing-auth-p0-test.ginosega.workers.dev'
$oldVersion=$ExpectedWorkerVersion  # caller supplies exact current deployed version
if($oldVersion -ne '5d09b49c-0b26-40c2-a00f-e86f90ad2cc0'){
 throw 'Unexpected predecessor Worker version; no deploy.'
}
$oldSha='2432469c22796e19b15fbd9042d39832a81a9a51d7695f186029c7f3080d6708'
$newSha='2432469c22796e19b15fbd9042d39832a81a9a51d7695f186029c7f3080d6708'
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
 # Availability is part of the gate, not a reason to bypass it.
 # Bound transient network retries to three attempts; any persistent
 # failure refuses the code deployment (or fails postflight visibly).
 $response=$null
 for($attempt=1;$attempt -le 3;$attempt++){
  try{
   $response=Invoke-WebRequest -Uri ($origin+'/fishing/') -UseBasicParsing -TimeoutSec 20 -MaximumRedirection 0 -Headers @{'Cache-Control'='no-store'} -ErrorAction Stop
   if([int]$response.StatusCode -ne 200){throw 'Public V2 homepage returned non-200.'}
   break
  }catch{
   if($attempt -eq 3){throw 'Public V2 unavailable after three bounded probes; verify Worker before any retry.'}
   Start-Sleep -Seconds 2
  }
 }
 if($null -eq $response -or [int]$response.StatusCode -ne 200){throw 'Public V2 homepage unavailable.'}
 $sha=[Security.Cryptography.SHA256]::Create()
 try {
  return [BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes([string]$response.Content))).Replace('-','').ToLowerInvariant()
 }finally{$sha.Dispose()}
}
function VerifyD1([switch]$AllowRecovery){
 $sql="SELECT COUNT(*) AS total, SUM(CASE WHEN operation_id='p3_343ef7ba-1c87-4d5d-a2ad-92e91eab420f' AND state='Live' AND reason_code IS NULL AND merge_sha='89be79a9c933dd36bd909edd585091232831c835' THEN 1 ELSE 0 END) AS d2, SUM(CASE WHEN operation_id='p3_10a266d9-87c9-4dae-8293-abc942e99007' AND state='Live' AND reason_code IS NULL AND pr_number=17 AND merge_sha='7418cc15e5e392b6e52a48eb533804a5055ca8d7' THEN 1 ELSE 0 END) AS gear, SUM(CASE WHEN operation_id='p3_5527208d-a67c-4a2c-876d-9edaee353bc8' AND github_id=265665562 AND repo_id=1430581407 AND state='Merging' AND reason_code='merge_attempted' AND pr_number=18 AND pr_head_sha='9276f35348e43a23c72208f3b2134e28554382fd' AND main_base_sha='7418cc15e5e392b6e52a48eb533804a5055ca8d7' AND merge_sha IS NULL AND workflow_run_id=40600896518 AND lease_expires_at<=unixepoch('now') THEN 1 ELSE 0 END) AS kb_blocked, SUM(CASE WHEN operation_id='p3_5527208d-a67c-4a2c-876d-9edaee353bc8' AND github_id=265665562 AND repo_id=1430581407 AND pr_number=18 AND pr_head_sha='9276f35348e43a23c72208f3b2134e28554382fd' AND main_base_sha='7418cc15e5e392b6e52a48eb533804a5055ca8d7' AND workflow_run_id=40600896518 AND merge_sha='97f68efc932084f2e607480c12cee37a94f81758' AND state IN ('Deploying','Verifying','Live') THEN 1 ELSE 0 END) AS kb_recovered FROM p3_operations;"
 $raw=@(& npx.cmd --yes wrangler@4.153.0 d1 execute fishing-p3-sandbox --remote --json --config $oldConfig --command $sql)
 if($LASTEXITCODE -ne 0){throw 'D1 read-only preflight failed.'}
 try{$p=ConvertFrom-Json -InputObject ($raw -join [Environment]::NewLine)}catch{throw 'Invalid D1 JSON.'}
 $a=@($p)
 if($a.Count -ne 1 -or $a[0].success -ne $true -or @($a[0].results).Count -ne 1){throw 'Unexpected D1 query result.'}
 $r=$a[0].results[0]
 if([int]$r.total -ne 3 -or [int]$r.d2 -ne 1 -or [int]$r.gear -ne 1){throw 'D1 baseline changed; no deployment.'}
 if($AllowRecovery){
  if(([int]$r.kb_blocked+[int]$r.kb_recovered) -ne 1){throw 'Unexpected KB D1 state after deployment.'}
 }elseif([int]$r.kb_blocked -ne 1 -or [int]$r.kb_recovered -ne 0){
  throw 'Expired KB merge marker no longer matches; no deployment.'
 }
}

if(-not $ApproveMergeTreeRecovery){throw 'Explicit one-time private Worker recovery fix approval required.'}
if($ExpectedWorkerVersion -notmatch '^[0-9a-f-]{36}$'){throw 'Exact current Worker version required.'}
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
 $now -ne $newSha -or $metadata.sha256 -ne $newSha -or
 $metadata.bytes -ne (Get-Item -LiteralPath $bundle).Length){
 throw 'New diagnostic client bundle cannot be verified.'
}
$proposed=$original
if($proposed.Contains('REPLACE_WITH_') -or
 [regex]::Matches($proposed,'"D3_PILOT_SHA256"\s*:\s*"'+$newSha+'"').Count -ne 1){
 throw 'Refuse config change beyond the exact reviewed private pilot hash.'
}
if(Test-Path -LiteralPath $newConfig){
 # A failed preflight can leave a local candidate. Reuse it ONLY when it is
 # byte-for-byte the same vetted config. Never adopt unreviewed edits.
 if([IO.File]::ReadAllText($newConfig) -cne $proposed){
  throw 'Existing candidate config differs from the reviewed original; refuse.'
 }
 Write-Output 'PASS: Reusing exact existing candidate after pre-deployment timeout.'
}else{
 [IO.File]::WriteAllText($newConfig,$proposed,(New-Object Text.UTF8Encoding($false)))
}
Push-Location $preview
try {
 if((LiveVersion) -ne $oldVersion){throw 'Unexpected deployed Worker version; refuse replacement.'}
 $public=PublicHash
 VerifyD1
 foreach($route in @('/__d3_pilot__/','/__d3_pilot__/pilot.js','/api/v3/authoring-source')){
  if((Status $route) -ne 401){throw "Unexpected anonymous private route: $route"}
 }
 $oldPost=Status '/api/v3/operations' 'POST'
 if(@(401,403,415) -notcontains $oldPost){
  throw 'Existing D3 POST unexpectedly permits anonymous write.'
 }
 $tmp=Join-Path $env:TEMP ('fishing-d3-merge-tree-recovery-'+[guid]::NewGuid().ToString('N'))
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
 Write-Output 'PASS: Current exact Worker/config, two completed receipts, blocked KB and guarded dry-run.'
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
 VerifyD1 -AllowRecovery
 Write-Output ('SAFE_D3_MERGE_TREE_RECOVERY_VERSION: '+$nextVersion)
 Write-Output ('D3_PILOT_SHA256: '+$now)
 Write-Output 'PASS: Read-only 204 merge status, PR-head/current-main equal tree and exact squash/file proof deployed; no security guard bypass.'
 Write-Output 'PASS: Public V2 unchanged; completed Gear/D2 plus blocked-or-recovered KB preserved; no replay.'
}finally{Pop-Location}
