# FISH118 D3: guarded owner-only Connection Status refresh.
# Default mode is READ-ONLY preflight + local dry-run. -Deploy performs one
# exact-head replacement of the EXISTING private pilot Worker (no new resources).
# The public GitHub Pages V2 deployment, webhook, watchdog and Cron are untouched.
param(
 [Parameter(Mandatory=$true)]
 [ValidatePattern('^[a-f0-9]{40}$')][string]$ExpectedHead,
 [ValidatePattern('^$|^[a-f0-9-]{36}$')][string]$ExpectedWorkerVersion='',
 [switch]$Deploy
)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$root=(Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
$preview=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$sourceConfig=Join-Path $preview 'wrangler.d3-fast-webhook-enabled.local.jsonc'
$candidateConfig=Join-Path $preview 'wrangler.d3-connection-poll.local.jsonc'
$meta=Join-Path $preview 'src\generated\d3-pilot.bundle.sha256.json'
$origin='https://fishing-auth-p0-test.ginosega.workers.dev'
$oldPilotHash='4befa904a5a14d944b9b09fdee6d2ffb56eb33885f692016e7f0b18233346ea6'
function Require([bool]$condition,[string]$reason){
 if(-not $condition){throw $reason}
}
function One([string]$value,[string]$pattern,[string]$label){
 Require ([regex]::Matches($value,$pattern).Count -eq 1) ('Config drift: '+$label)
}
function WorkerVersion {
 $out=@(& npx.cmd --yes wrangler@4.153.0 deployments status --name fishing-auth-p0-test)
 Require ($LASTEXITCODE -eq 0) 'Cannot check the existing Worker version.'
 $m=[regex]::Matches(($out -join [Environment]::NewLine),'(?m)\(100%\)\s+([0-9a-f-]{36})')
 Require ($m.Count -eq 1) 'Existing Worker version is ambiguous.'
 return $m[0].Groups[1].Value
}
function HttpStatus([string]$path,[string]$method='GET'){
 try{
  $r=Invoke-WebRequest -Uri ($origin+$path) -Method $method -TimeoutSec 25 -UseBasicParsing -MaximumRedirection 0 -Headers @{'Cache-Control'='no-store'}
  return [int]$r.StatusCode
 }catch{
  if($_.Exception.Response){return [int]$_.Exception.Response.StatusCode}
  throw ('Cannot verify private route '+$path)
 }
}
function PublicHash{
 $r=Invoke-WebRequest -Uri ($origin+'/fishing/') -TimeoutSec 25 -UseBasicParsing -MaximumRedirection 0 -Headers @{'Cache-Control'='no-store'}
 Require ([int]$r.StatusCode -eq 200) 'Public V2 gateway unavailable.'
 $sha=[Security.Cryptography.SHA256]::Create()
 try{
  return [BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes([string]$r.Content))).Replace('-','').ToLowerInvariant()
 }finally{$sha.Dispose()}
}
function PrivateRouteProof{
 Require ((HttpStatus '/__d3_pilot__/') -eq 401) 'Anonymous private pilot unexpectedly open.'
 Require ((HttpStatus '/__d3_pilot__/pilot.js') -eq 401) 'Anonymous private script unexpectedly open.'
 Require ((HttpStatus '/__d3_fast__/github-check' 'POST') -eq 401) 'Unsigned webhook unexpectedly accepted.'
 Require ((HttpStatus '/session') -eq 200) 'Session route unavailable.'
}
function D1Proof([string]$config){
 # READ ONLY. Do not mutate or replay the completed PR #26 operation.
 $sql="SELECT state,reason_code,merge_sha FROM p3_operations WHERE operation_id='p3_23bf8ff9-c95b-40ba-9c1d-b4463b2e6489'"
 $out=@(& npx.cmd --yes wrangler@4.153.0 d1 execute fishing-p3-sandbox --remote --json --config $config --command $sql)
 Require ($LASTEXITCODE -eq 0) 'Read-only D1 audit failed.'
 $rows=@(ConvertFrom-Json -InputObject ($out -join [Environment]::NewLine))
 Require ($rows.Count -eq 1 -and $rows[0].success -eq $true -and @($rows[0].results).Count -eq 1) 'Unexpected D1 audit shape.'
 $r=$rows[0].results[0]
 Require ($r.state -eq 'Live' -and $null -eq $r.reason_code -and $r.merge_sha -eq '45f3d5da6aa797d01be61b3078585ea4449bcf91') 'Last verified sandbox receipt drift; STOP.'
}
Push-Location $root
try{
 $head=(& git rev-parse HEAD).Trim()
 $branch=(& git branch --show-current).Trim()
 Require ($LASTEXITCODE -eq 0 -and $head -eq $ExpectedHead -and $branch -eq 'feature/fish118-p3-mock-publisher') 'Wrong Git HEAD/branch.'
 Require (@(& git status --porcelain --untracked-files=no).Count -eq 0) 'Tracked checkout is dirty.'
 & git check-ignore -q -- $candidateConfig
 Require ($LASTEXITCODE -eq 0) 'Candidate config must be Git-ignored.'
 Require (Test-Path -LiteralPath $sourceConfig) 'Existing private Worker config missing.'
 $original=[IO.File]::ReadAllText($sourceConfig)
 $originalDigest=(Get-FileHash -LiteralPath $sourceConfig -Algorithm SHA256).Hash
 foreach($rule in @(
  '"name"\s*:\s*"fishing-auth-p0-test"',
  '"main"\s*:\s*"src/d3-owner-runtime\.mjs"',
  '"keep_vars"\s*:\s*true',
  '"D3_WRITE_ENABLED"\s*:\s*"true"',
  '"D3_RUNNER_ENABLED"\s*:\s*"true"',
  '"D3_READ_TOKENS_ENABLED"\s*:\s*"true"',
  '"D3_TEST_HOST_ENABLED"\s*:\s*"true"',
  '"D3_PILOT_ENABLED"\s*:\s*"true"',
  '"D3_FAST_WATCHDOG_ENABLED"\s*:\s*"true"',
  '"D3_FAST_WEBHOOK_ENABLED"\s*:\s*"true"',
  '"D3_FAST_TRACE_ENABLED"\s*:\s*"false"',
  '"class_name"\s*:\s*"D3FastWakeAlarm"',
  '"binding"\s*:\s*"DB"',
  '"binding"\s*:\s*"OPERATIONS_DB"',
  '"crons"\s*:\s*\[\s*"\*/5 \* \* \* \*"\s*\]'
 )){One $original $rule $rule}
 foreach($name in @('D2_WRITE_ENABLED','D2_RUNNER_ENABLED','D2_READ_TOKENS_ENABLED','D2_TEST_HOST_ENABLED')){
  One $original ('"'+$name+'"\s*:\s*"false"') $name
 }
 foreach($secret in @('D2_GITHUB_APP_PRIVATE_KEY','D2_CSRF_KEY','D3_FAST_WEBHOOK_SECRET')){
  Require ($original -notmatch ('"'+$secret+'"\s*:')) 'Plaintext secret entry found in local config.'
 }
 $oldValue='"D3_PILOT_SHA256": "'+$oldPilotHash+'"'
 One $original ([regex]::Escape($oldValue)) 'deployed pilot hash'
 Push-Location (Join-Path $root 'pwa')
 try{
  & node tools/build-d3-pilot.mjs --check
  Require ($LASTEXITCODE -eq 0) 'Pilot bundle build failed.'
  & node tools/verify-d3-windows-eol.mjs
  Require ($LASTEXITCODE -eq 0) 'Pilot byte normalization failed.'
  & node tools/verify-d3-csp.mjs
  Require ($LASTEXITCODE -eq 0) 'Pilot CSP validation failed.'
  & node tools/verify-d3-runtime.mjs
  Require ($LASTEXITCODE -eq 0) 'Worker runtime check failed.'
 }finally{Pop-Location}
 $manifest=ConvertFrom-Json -InputObject ([IO.File]::ReadAllText($meta))
 $newHash=[string]$manifest.sha256
 Require ($manifest.format -eq 'fishing-d3-pilot-local-build-v1' -and $newHash -match '^[a-f0-9]{64}$' -and $newHash -ne $oldPilotHash) 'Generated pilot hash is not new and verified.'
 $newValue='"D3_PILOT_SHA256": "'+$newHash+'"'
 $candidate=$original.Replace($oldValue,$newValue)
 Require ($candidate.Replace($newValue,$oldValue) -ceq $original) 'Unexpected candidate config change.'
 if(Test-Path -LiteralPath $candidateConfig){
  Require ([IO.File]::ReadAllText($candidateConfig) -ceq $candidate) 'Existing candidate config differs; STOP.'
 }else{
  [IO.File]::WriteAllText($candidateConfig,$candidate,(New-Object Text.UTF8Encoding($false)))
 }
 Push-Location $preview
 try{
  $pre=WorkerVersion
  if($ExpectedWorkerVersion){
   Require ($pre -eq $ExpectedWorkerVersion) 'Worker version changed since review.'
  }
  if($Deploy){Require ($ExpectedWorkerVersion -ne '') 'Deployment needs reviewed -ExpectedWorkerVersion.'}
  PrivateRouteProof
  D1Proof $sourceConfig
  $v2=PublicHash
  $temp=Join-Path $env:TEMP ('fishing-d3-connection-poll-'+[guid]::NewGuid().ToString('N'))
  try{
   & npx.cmd --yes wrangler@4.153.0 deploy --dry-run --config $candidateConfig --outdir $temp
   Require ($LASTEXITCODE -eq 0) 'Wrangler dry-run failed.'
  }finally{if(Test-Path $temp){Remove-Item -LiteralPath $temp -Force -Recurse}}
  Require ((WorkerVersion) -eq $pre -and (PublicHash) -eq $v2) 'Worker/public V2 drift during preflight.'
  Require ((Get-FileHash -LiteralPath $sourceConfig -Algorithm SHA256).Hash -eq $originalDigest) 'Deployed config changed.'
  if(-not $Deploy){
   Write-Output ('PASS: PREPARED ONLY; existing Worker '+$pre)
   Write-Output ('REVIEWED_SOURCE_HEAD: '+$head)
   Write-Output ('NEW_OWNER_PILOT_HASH: '+$newHash)
   Write-Output 'No Worker, public V2, GitHub, or D1 mutation performed.'
  }else{
   & npx.cmd --yes wrangler@4.153.0 deploy --config $candidateConfig
   Require ($LASTEXITCODE -eq 0) 'Deployment outcome uncertain: inspect remote state before retry.'
   $after=WorkerVersion
   Require ($after -ne $pre) 'Worker version unchanged; inspect, do not retry blindly.'
   PrivateRouteProof
   D1Proof $candidateConfig
   Require ((PublicHash) -eq $v2) 'Public V2 proxy changed; STOP and inspect.'
   Require ((Get-FileHash -LiteralPath $sourceConfig -Algorithm SHA256).Hash -eq $originalDigest) 'Original local config changed.'
   Write-Output ('PASS: Private D3 status polling Worker deployed '+$after)
   Write-Output ('NEW_OWNER_PILOT_HASH: '+$newHash)
   Write-Output 'Public V2 identity preserved; webhook, watchdog, Cron and private D1 receipt verified.'
  }
 }finally{Pop-Location}
}finally{Pop-Location}
