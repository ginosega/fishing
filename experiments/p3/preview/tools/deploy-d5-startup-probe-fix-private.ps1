# FISH118 D5 repair of private startup probe's bundled browser JS.
# PREPARE by default. -Deploy performs ONE newly approved version-locked rollout.
# Preserve currently deployed D3, public V2, Pages and all private flags unchanged.
param(
 [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{40}$')][string]$ExpectedHead,
 [Parameter(Mandatory=$true)][long]$ExpectedSourceCiRun,
 [Parameter(Mandatory=$true)][long]$ExpectedFullCiRun,
 [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{40}$')][string]$ExpectedReviewedPrHead,
 [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9-]{36}$')][string]$ExpectedWorkerVersion,
 [Parameter(Mandatory=$true)][string]$PreviousConfig,
 [Parameter(Mandatory=$true)][string]$PreviousGeneratedDir,
 [switch]$Deploy
)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$root=(Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
$preview=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$privateOrigin='https://fishing-auth-p0-test.ginosega.workers.dev'
$pagesOrigin='https://cf47a8f1.fishing-v3-owner-d5-test.pages.dev'
$pagesSourceHead='ff9908dc8965cd8713f04cc86bbecd8d78dfd94e'
$pagesRelease='4d57578d466b4757eafafed8f1983998'
$expectedPublicV2='963f4dd58debd122dd5aea8a12a0187ca1af550ffecccaaaeef541791503e09d'
$worker='fishing-auth-p0-test'
$diagnostic='/__d5_startup_diagnostic__/'
$candidate='/fishing/__v3_owner_candidate__/'
$newConfig=Join-Path $preview 'wrangler.d5-startup-probe-fix.local.jsonc'
$attemptMarker=Join-Path $env:TEMP ('fishing-d5-startup-probe-fix-'+$ExpectedHead+'.deploy-attempt')
function Need([bool]$value,[string]$message){if(-not $value){throw $message}}
function MustOnce([string]$value,[string]$regex,[string]$message){
 Need ([regex]::Matches($value,$regex).Count -eq 1) $message
}
function ShaText([string]$value){
 $hasher=[Security.Cryptography.SHA256]::Create()
 try{return [BitConverter]::ToString($hasher.ComputeHash([Text.Encoding]::UTF8.GetBytes($value))).Replace('-','').ToLowerInvariant()}
 finally{$hasher.Dispose()}
}
function Version{
 $output=@(& npx.cmd --yes wrangler@4.153.0 deployments status --name $worker)
 Need ($LASTEXITCODE -eq 0) 'Could not query active private Worker version'
 $m=[regex]::Matches(($output -join [Environment]::NewLine),'(?m)\(100%\)\s+([a-f0-9-]{36})')
 Need ($m.Count -eq 1) 'Private Worker current version ambiguous'
 return $m[0].Groups[1].Value
}
function Http([string]$url){
 try{return Invoke-WebRequest -Uri $url -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 45 -Headers @{'Cache-Control'='no-store'}}
 catch{
  if($_.Exception.Response){return $_.Exception.Response}
  throw ('Cannot inspect HTTP resource '+$url)
 }
}
function Status([string]$path){
 $r=Http ($privateOrigin+$path)
 return [int]$r.StatusCode
}
function PublicV2{
 $r=Http ($privateOrigin+'/fishing/')
 Need ([int]$r.StatusCode -eq 200) 'Public V2 proxy unavailable'
 return ShaText ([string]$r.Content)
}
function PrivateProof{
 foreach($path in @('/__d3_pilot__/','/__d3_pilot__/pilot.js','/__d3_pilot__/pilot.css')){
  Need ((Status $path) -eq 401) ('Private pilot anonymous denial changed: '+$path)
 }
 Need ((Status '/session') -eq 200) 'Private session GET unavailable'
 Need ((Status '/api/v3/operations/latest') -in @(401,403,404)) 'Private operations status exposure changed'
}
function RunProof([long]$id,[string]$expectedName,[string]$ciHead,[string]$event){
 $r=Invoke-RestMethod -Uri ('https://api.github.com/repos/ginosega/fishing/actions/runs/'+$id) -Headers @{'User-Agent'='Fishing-D5-Operator';'Accept'='application/vnd.github+json'} -TimeoutSec 35
 Need ($r.head_sha -ceq $ciHead -and $r.name -ceq $expectedName -and
  $r.event -ceq $event -and $r.status -ceq 'completed' -and $r.conclusion -ceq 'success') ('Required pinned CI missing or incomplete: '+$expectedName)
}
function VerifyHostedPointer{
 $pages=Http ($pagesOrigin+$candidate+'release.json')
 $private=Http ($privateOrigin+$candidate+'release.json')
 Need ([int]$pages.StatusCode -eq 200 -and [int]$private.StatusCode -eq 200) 'D5 owner release pointer unavailable'
 $ptr=([string]$pages.Content|ConvertFrom-Json)
 Need ($ptr.id -ceq $pagesRelease -and $ptr.sourceRevision -ceq $pagesSourceHead) 'Pages immutable source changed'
 Need ((ShaText ([string]$pages.Content)) -ceq (ShaText ([string]$private.Content))) 'Private Worker candidate differs from immutable Pages'
}
$previousPath=(Resolve-Path -LiteralPath $PreviousConfig).Path
$previousGenerated=(Resolve-Path -LiteralPath $PreviousGeneratedDir).Path
Need ($previousPath -cne $newConfig -and $previousPath -cmatch 'wrangler\.[a-z0-9.-]+\.local\.jsonc$') 'Previous config must be a different ignored local Wrangler config'
Need ($ExpectedWorkerVersion -ceq '13b4a6ab-5f54-4b1c-89c3-00226ae9d0f3') 'Require pinned prior deployed D5 startup diagnostic version'
Push-Location $root
try{
 Need ((& git rev-parse HEAD).Trim() -ceq $ExpectedHead -and $LASTEXITCODE -eq 0) 'Unexpected current checkout HEAD'
 Need (@(& git status --porcelain --untracked-files=no).Count -eq 0) 'Tracked checkout dirty'
 $remote=@(& git ls-remote origin refs/heads/feature/fish118-d5-owner-integration)
 Need ($LASTEXITCODE -eq 0 -and $remote.Count -eq 1 -and
  ($remote[0] -split '\s+')[0] -ceq $ExpectedHead) 'Remote isolated integration head moved'
 $mergedPr=Invoke-RestMethod -Uri 'https://api.github.com/repos/ginosega/fishing/pulls/355' -Headers @{'User-Agent'='Fishing-D5-Operator';'Accept'='application/vnd.github+json'} -TimeoutSec 35
 Need ($mergedPr.merged -eq $true -and $mergedPr.merge_commit_sha -ceq $ExpectedHead -and
  $mergedPr.head.sha -ceq $ExpectedReviewedPrHead -and $mergedPr.base.ref -ceq 'feature/fish118-d5-owner-integration') 'Source PR #355 merge or reviewed head not verified'
 RunProof $ExpectedSourceCiRun 'Fishing P3 isolated source validation' $ExpectedHead 'push'
 RunProof $ExpectedFullCiRun 'Fishing production acceptance and deployment' $ExpectedReviewedPrHead 'pull_request'
 $source=[IO.File]::ReadAllText($previousPath)
 $beforeConfigSha=(Get-FileHash -LiteralPath $previousPath -Algorithm SHA256).Hash
 foreach($regex in @(
  '"name"\s*:\s*"fishing-auth-p0-test"',
  '"main"\s*:\s*"src/d3-owner-runtime\.mjs"',
  '"keep_vars"\s*:\s*true',
  '"APP_ORIGIN"\s*:\s*"https://fishing-auth-p0-test\.ginosega\.workers\.dev"',
  '"D3_SANDBOX_REPO_ID"\s*:\s*"1430581407"',
  '"D3_PILOT_ENABLED"\s*:\s*"true"',
  '"D3_READ_TOKENS_ENABLED"\s*:\s*"true"',
  '"D3_WRITE_ENABLED"\s*:\s*"true"',
  '"D5_OWNER_CANDIDATE_ENABLED"\s*:\s*"true"',
  '"D5_OWNER_PAGES_ORIGIN"\s*:\s*"https://cf47a8f1\.fishing-v3-owner-d5-test\.pages\.dev"',
  '"D5_STARTUP_DIAGNOSTIC_ENABLED"\s*:\s*"true"',
  '"binding"\s*:\s*"DB"',
  '"binding"\s*:\s*"OPERATIONS_DB"',
  '"workers_dev"\s*:\s*true'
 )){MustOnce $source $regex ('Missing/duplicate private config field: '+$regex)}
 # Existing startup diagnostic must remain enabled; this rollout changes code ONLY.
 Need ([regex]::Matches($source,'"D5_STARTUP_DIAGNOSTIC_ENABLED"\s*:').Count -eq 1) 'Startup diagnostic flag changed or duplicated'
 Need ($source -notmatch 'REPLACE_WITH_') 'Config has placeholders'
 Need ([regex]::Matches($source,'"database_id"\s*:\s*"[a-f0-9-]{36}"').Count -eq 2) 'Private D1 binding count changed'
 foreach($name in @('D2_CSRF_KEY','D2_GITHUB_APP_PRIVATE_KEY','GITHUB_CLIENT_SECRET','D3_FAST_WEBHOOK_SECRET')){
  Need ($source -notmatch ('"'+$name+'"\s*:')) ('Potential secret in local config: '+$name)
 }
 $pilot=[regex]::Match($source,'"D3_PILOT_SHA256"\s*:\s*"([a-f0-9]{64})"')
 $style=[regex]::Match($source,'"D3_PILOT_CSS_SHA256"\s*:\s*"([a-f0-9]{64})"')
 Need ($pilot.Success -and $style.Success) 'Previous private pilot hashes unavailable'
 $target=Join-Path $preview 'src\generated'
 if(-not (Test-Path -LiteralPath $target)){New-Item -ItemType Directory $target | Out-Null}
 foreach($item in @(
  @('d3-pilot.bundle.txt',$pilot.Groups[1].Value),
  @('d3-pilot.css.txt',$style.Groups[1].Value)
 )){
  $src=Join-Path $previousGenerated $item[0]
  $dst=Join-Path $target $item[0]
  Need (Test-Path -LiteralPath $src) ('Previous private pilot asset missing: '+$item[0])
  Need ((Get-FileHash -LiteralPath $src -Algorithm SHA256).Hash.ToLowerInvariant() -ceq $item[1]) ('Previous pilot asset hash mismatch: '+$item[0])
  if(Test-Path -LiteralPath $dst){
   Need ((Get-FileHash -LiteralPath $dst -Algorithm SHA256).Hash.ToLowerInvariant() -ceq $item[1]) ('New checkout pilot asset changed: '+$item[0])
  }else{Copy-Item -LiteralPath $src -Destination $dst}
 }
 & git check-ignore -q -- $newConfig
 Need ($LASTEXITCODE -eq 0) 'New Wrangler config must be gitignored'
 # Do not alter a single variable, binding, route, schedule or secret.
 $new=$source
 if(Test-Path -LiteralPath $newConfig){
  Need ([IO.File]::ReadAllText($newConfig) -ceq $new) 'Prior diagnostic config differs; stop'
 }else{[IO.File]::WriteAllText($newConfig,$new,(New-Object Text.UTF8Encoding($false)))}
 Need ((Status $diagnostic) -eq 200) 'Existing diagnostic page unavailable; stop'
 Need ((Status ($diagnostic+'probe.js')) -eq 200) 'Existing probe script unavailable; stop'
 PrivateProof
 VerifyHostedPointer
 $before=Version
 Need ($before -ceq $ExpectedWorkerVersion) 'Active private Worker is not owner-approved baseline'
 $public=PublicV2
 Need ($public -ceq $expectedPublicV2) 'Public V2 proxy differs from pinned owner-accepted baseline'
 $dryDir=Join-Path $env:TEMP ('fishing-d5-startup-dry-'+[guid]::NewGuid().ToString('N'))
 try{
  Push-Location $preview
  try{
   & npx.cmd --yes wrangler@4.153.0 deploy --dry-run --config $newConfig --outdir $dryDir
   Need ($LASTEXITCODE -eq 0) 'Wrangler private Worker dry run failed'
  }finally{Pop-Location}
 }finally{if(Test-Path $dryDir){Remove-Item -LiteralPath $dryDir -Recurse -Force}}
 Need ((Version) -ceq $before) 'Private Worker changed during preflight'
 Need ((PublicV2) -ceq $public) 'Public V2 changed during preflight'
 Need ([IO.File]::ReadAllText($newConfig) -ceq $source) 'Diagnostic repair config differs from last deployed config'
 Need ((Get-FileHash -LiteralPath $previousPath -Algorithm SHA256).Hash -ceq $beforeConfigSha) 'Previous config changed'
 if(-not $Deploy){
  Write-Output 'PASS: D5 STARTUP PROBE FIX PREPARED ONLY'
  Write-Output ('EXACT_SOURCE_HEAD: '+$ExpectedHead)
  Write-Output ('CURRENT_WORKER_VERSION: '+$before)
  Write-Output ('PREPARED_IGNORED_CONFIG: '+$newConfig)
  Write-Output 'NO DEPLOY, NO PUBLIC V2 CHANGE, NO BROWSER DATA CHANGE'
 }else{
  Need (-not (Test-Path -LiteralPath $attemptMarker)) 'Deploy attempt marker exists; NEVER retry without independent provider reconciliation'
  Need ((Version) -ceq $before -and (PublicV2) -ceq $public -and (Status $diagnostic) -eq 200) 'Pre-deploy worker/public status drift'
  # Create marker atomically BEFORE the one authorized deploy. Keep it even if
  # the deploy or post-check fails. Never blindly retry an unknown outcome.
  $marker=[IO.File]::Open($attemptMarker,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
  try{
   $bytes=[Text.Encoding]::UTF8.GetBytes(('SOURCE_HEAD='+$ExpectedHead+'; PREVIOUS_VERSION='+$before+'; UTC='+[DateTime]::UtcNow.ToString('o')))
   $marker.Write($bytes,0,$bytes.Length)
  }finally{$marker.Dispose()}
  Write-Output 'D5_STARTUP_PROBE_FIX_SINGLE_ATTEMPT_MARKER_CREATED'
  Push-Location $preview
  try{
   Write-Output 'BEGINNING_ONE_OWNER_APPROVED_PRIVATE_PROBE_FIX_WORKER_DEPLOY'
   & npx.cmd --yes wrangler@4.153.0 deploy --config $newConfig
   Need ($LASTEXITCODE -eq 0) 'Worker deploy outcome unknown: inspect provider, DO NOT RETRY'
   $after=Version
   Need ($after -cne $before) 'Worker version not updated: reconcile, DO NOT RETRY'
   PrivateProof
   VerifyHostedPointer
   Need ((PublicV2) -ceq $public) 'Public V2 proxy changed: stop, investigate'
   $page=Http ($privateOrigin+$diagnostic)
   $script=Http ($privateOrigin+$diagnostic+'probe.js')
   Need ([int]$page.StatusCode -eq 200 -and [int]$script.StatusCode -eq 200) 'Private startup diagnostic unavailable'
   Need ([string]$page.Content -match 'Fishing D5 startup diagnostic' -and
    [string]$script.Content -match 'Candidate cache count' -and
    [string]$script.Content -notmatch '\b__name\s*\(' -and
    [string]$script.Content -notmatch 'browserProbe\.toString\s*\(') 'Deployed probe includes obsolete bundler helper or unexpected content'
   Need ((Status ($diagnostic+'unknown')) -eq 404) 'Diagnostic routing too broad'
   Write-Output ('PASS: D5 STARTUP PROBE FIX PRIVATE WORKER DEPLOYED: '+$after)
   Write-Output ('PREVIOUS_WORKER_VERSION: '+$before)
   Write-Output ('SOURCE_HEAD: '+$ExpectedHead)
   Write-Output ('DIAGNOSTIC_URL: '+$privateOrigin+$diagnostic)
   Write-Output 'PASS: PRIVATE PILOT, IMMUTABLE PAGES, PUBLIC V2 UNCHANGED'
   Write-Output 'NO SANDBOX PUBLISH OR PUBLIC CUTOVER'
  }finally{Pop-Location}
 }
}finally{Pop-Location}
