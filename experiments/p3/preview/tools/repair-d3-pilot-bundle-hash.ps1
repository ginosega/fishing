# FISH118 D3 private-pilot bundle-hash repair. Only changes D3_PILOT_SHA256.
# -Deploy is one approved guarded update; webhook remains OFF; watchdog ON.
param(
 [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{40}$')][string]$ExpectedHead,
 [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9-]{36}$')][string]$ExpectedWorkerVersion,
 [switch]$Deploy
)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$root=(Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
$preview=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$oldConfig=Join-Path $preview 'wrangler.d3-fast-watchdog-enabled.local.jsonc'
$newConfig=Join-Path $preview 'wrangler.d3-pilot-hash-repair.local.jsonc'
$bundle=Join-Path $preview 'src\generated\d3-pilot.bundle.txt'
$meta=Join-Path $preview 'src\generated\d3-pilot.bundle.sha256.json'
$newSha='4befa904a5a14d944b9b09fdee6d2ffb56eb33885f692016e7f0b18233346ea6'
$name='fishing-auth-p0-test'
$origin='https://fishing-auth-p0-test.ginosega.workers.dev'
function Require([bool]$condition,[string]$reason){if(-not $condition){throw $reason}}
function One([string]$raw,[string]$pattern){Require ([regex]::Matches($raw,$pattern).Count -eq 1) ('Unexpected config: '+$pattern)}
function Version {
 $raw=@(& npx.cmd --yes wrangler@4.153.0 deployments status --name $name)
 Require ($LASTEXITCODE -eq 0) 'Cannot inspect Worker version.'
 $v=[regex]::Matches(($raw -join [Environment]::NewLine),'(?m)\(100%\)\s+([0-9a-f-]{36})')
 Require ($v.Count -eq 1) 'Ambiguous Worker version.'
 return $v[0].Groups[1].Value
}
function Status([string]$path){
 try {
  $r=Invoke-WebRequest -Uri ($origin+$path) -Method GET -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 25
  return [int]$r.StatusCode
 }catch{
  if($_.Exception.Response){return [int]$_.Exception.Response.StatusCode}
  throw ('Cannot inspect route '+$path)
 }
}
function PublicHash {
 $r=Invoke-WebRequest -Uri ($origin+'/fishing/') -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 25 -Headers @{'Cache-Control'='no-store'}
 Require ([int]$r.StatusCode -eq 200) 'Public proxy unavailable.'
 $h=[Security.Cryptography.SHA256]::Create()
 try{return [BitConverter]::ToString($h.ComputeHash([Text.Encoding]::UTF8.GetBytes([string]$r.Content))).Replace('-','').ToLowerInvariant()}
 finally{$h.Dispose()}
}
function CheckD1([string]$config) {
 $sql="SELECT COUNT(*) AS total,SUM(CASE WHEN state='Live' AND reason_code IS NULL THEN 1 ELSE 0 END) AS verified FROM p3_operations"
 $r=@(& npx.cmd --yes wrangler@4.153.0 d1 execute fishing-p3-sandbox --remote --json --config $config --command $sql)
 Require ($LASTEXITCODE -eq 0) 'Read-only D1 query failed.'
 $a=@(ConvertFrom-Json -InputObject ($r -join [Environment]::NewLine))
 Require ($a.Count -eq 1 -and $a[0].success -eq $true -and @($a[0].results).Count -eq 1) 'D1 response changed.'
 Require ([int]$a[0].results[0].total -eq 3 -and [int]$a[0].results[0].verified -eq 3) 'Historic sandbox Live receipts changed.'
}
function CheckSecret {
 $r=@(& npx.cmd --yes wrangler@4.153.0 secret list --name $name --format json --config $oldConfig)
 Require ($LASTEXITCODE -eq 0) 'Cannot read secret names.'
 $a=@(ConvertFrom-Json -InputObject ($r -join [Environment]::NewLine))
 Require (@($a | Where-Object {$_.name -eq 'D3_FAST_WEBHOOK_SECRET'}).Count -eq 1) 'Encrypted webhook secret missing.'
}
Push-Location $root
try {
 $head=(& git rev-parse HEAD).Trim()
 $branch=(& git branch --show-current).Trim()
 Require ($LASTEXITCODE -eq 0 -and $head -eq $ExpectedHead -and $branch -eq 'feature/fish118-p3-mock-publisher') 'Wrong Git branch or SHA.'
 $dirty=@(& git status --porcelain --untracked-files=no)
 Require ($dirty.Count -eq 0) 'Tracked local files changed.'
 & git check-ignore -q $newConfig
 Require ($LASTEXITCODE -eq 0) 'Private generated config not Git-ignored.'
 Require (Test-Path -LiteralPath $oldConfig) 'Latest activated private Worker config not found.'
 $old=[IO.File]::ReadAllText($oldConfig)
 foreach($rule in @(
  '"name"\s*:\s*"fishing-auth-p0-test"',
  '"main"\s*:\s*"src/d3-owner-runtime\.mjs"',
  '"keep_vars"\s*:\s*true',
  '"D3_PILOT_ENABLED"\s*:\s*"true"',
  '"D3_FAST_WATCHDOG_ENABLED"\s*:\s*"true"',
  '"D3_FAST_WEBHOOK_ENABLED"\s*:\s*"false"',
  '"D3_FAST_TRACE_ENABLED"\s*:\s*"false"',
  '"class_name"\s*:\s*"D3FastWakeAlarm"',
  '"new_sqlite_classes"\s*:\s*\[\s*"D3FastWakeAlarm"\s*\]',
  '"binding"\s*:\s*"DB"',
  '"binding"\s*:\s*"OPERATIONS_DB"',
  '"crons"\s*:\s*\[\s*"\*/5 \* \* \* \*"\s*\]'
 )){One $old $rule}
 One $old '"D3_PILOT_SHA256"\s*:\s*"[a-f0-9]{64}"'
 $oldSha=[regex]::Match($old,'"D3_PILOT_SHA256"\s*:\s*"([a-f0-9]{64})"').Groups[1].Value
 Require ($oldSha -ne $newSha) 'Pilot hash already correct; no deployment.'
 Require ($old -notmatch '"D3_FAST_WEBHOOK_SECRET"\s*:') 'Never store plaintext secrets.'
 Push-Location (Join-Path $root 'pwa')
 try {
  & node tools/build-d3-pilot.mjs --check
  Require ($LASTEXITCODE -eq 0) 'Pilot bundle build check failed.'
  & node tools/verify-d3-runtime.mjs
  Require ($LASTEXITCODE -eq 0) 'Worker bundle verification failed.'
 }finally{Pop-Location}
 $m=Get-Content -LiteralPath $meta -Raw | ConvertFrom-Json
 $hash=(Get-FileHash -LiteralPath $bundle -Algorithm SHA256).Hash.ToLowerInvariant()
 Require ($hash -eq $newSha -and $m.sha256 -eq $newSha -and [int64]$m.bytes -eq (Get-Item -LiteralPath $bundle).Length) 'Exact bundle SHA changed.'
 $from='"D3_PILOT_SHA256": "'+$oldSha+'"'
 $to='"D3_PILOT_SHA256": "'+$newSha+'"'
 One $old ([regex]::Escape($from))
 $candidate=$old.Replace($from,$to)
 Require ($candidate.Replace($to,$from) -ceq $old) 'Unapproved configuration change.'
 if(Test-Path -LiteralPath $newConfig){
  Require ([IO.File]::ReadAllText($newConfig) -ceq $candidate) 'Staged private candidate differs.'
 }else{
  [IO.File]::WriteAllText($newConfig,$candidate,(New-Object Text.UTF8Encoding($false)))
 }
 Push-Location $preview
 try {
  Require ((Version) -eq $ExpectedWorkerVersion) 'Deployed Worker version changed.'
  Require ((Status '/__d3_pilot__/') -eq 401) 'Anonymous pilot denial changed.'
  Require ((Status '/__d3_fast__/github-check') -eq 404) 'GitHub webhook unexpectedly enabled.'
  Require ((Status '/session') -eq 200) 'Session API unavailable.'
  $public=PublicHash
  CheckD1 $oldConfig
  CheckSecret
  $tmp=Join-Path $env:TEMP ('fishing-pilot-hash-'+[guid]::NewGuid().ToString('N'))
  try {
   & npx.cmd --yes wrangler@4.153.0 deploy --dry-run --config $newConfig --outdir $tmp
   Require ($LASTEXITCODE -eq 0) 'Wrangler dry-run failed.'
  }finally{if(Test-Path -LiteralPath $tmp){Remove-Item -LiteralPath $tmp -Force -Recurse}}
  Require ((Version) -eq $ExpectedWorkerVersion -and (PublicHash) -eq $public) 'Worker or public V2 changed during preflight.'
  if(-not $Deploy) {
   Write-Output ('PASS: PREPARED ONLY; old bundle '+$oldSha)
  }else{
   & npx.cmd --yes wrangler@4.153.0 deploy --config $newConfig
   Require ($LASTEXITCODE -eq 0) 'Deploy status uncertain; inspect before retry.'
   $after=Version
   Require ($after -ne $ExpectedWorkerVersion) 'No new Worker version; inspect before retry.'
   Require ((Status '/__d3_pilot__/') -eq 401) 'Anonymous pilot route changed.'
   Require ((Status '/__d3_fast__/github-check') -eq 404) 'Webhook became active.'
   Require ((Status '/session') -eq 200) 'Owner session route changed.'
   Require ((PublicHash) -eq $public) 'Public V2 changed.'
   CheckD1 $newConfig
   CheckSecret
   Write-Output ('PASS: PILOT HASH REPAIRED; watchdog ON, webhook OFF. Worker '+$after)
  }
 }finally{Pop-Location}
}finally{Pop-Location}
