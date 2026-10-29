# FISH118 P1: approved sandbox-only watchdog enablement, one-flag config diff.
# No webhook activation, new permissions, schema writes, or production changes.
param(
 [Parameter(Mandatory=$true)][ValidatePattern('^[0-9a-f]{40}$')][string]$ExpectedHead,
 [Parameter(Mandatory=$true)][ValidatePattern('^[0-9a-f-]{36}$')][string]$ExpectedWorkerVersion,
 [switch]$Deploy
)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$root=(Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
$preview=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$oldConfig=Join-Path $preview 'wrangler.d3-fast-watchdog.local.jsonc'
$newConfig=Join-Path $preview 'wrangler.d3-fast-watchdog-enabled.local.jsonc'
$name='fishing-auth-p0-test'
$origin='https://fishing-auth-p0-test.ginosega.workers.dev'
function Require([bool]$ok,[string]$why){if(-not $ok){throw $why}}
function One([string]$s,[string]$p){Require ([regex]::Matches($s,$p).Count -eq 1) ('Unexpected config pattern: '+$p)}
function Version {
 $out=@(& npx.cmd --yes wrangler@4.153.0 deployments status --name $name)
 Require ($LASTEXITCODE -eq 0) 'Worker version lookup failed.'
 $v=[regex]::Matches(($out -join [Environment]::NewLine),'(?m)\(100%\)\s+([0-9a-f-]{36})')
 Require ($v.Count -eq 1) 'Ambiguous deployed Worker version.'
 return $v[0].Groups[1].Value
}
function Route {
 try{
  $r=Invoke-WebRequest -Uri ($origin+'/__d3_fast__/github-check') -Method GET -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 20
  return [int]$r.StatusCode
 }catch{
  if($_.Exception.Response){return [int]$_.Exception.Response.StatusCode}
  throw 'Could not verify disabled webhook route.'
 }
}
function PublicHash {
 $r=Invoke-WebRequest -Uri ($origin+'/fishing/') -UseBasicParsing -TimeoutSec 25 -MaximumRedirection 0 -Headers @{'Cache-Control'='no-store'}
 Require ([int]$r.StatusCode -eq 200) 'Public V2 proxy not available.'
 $h=[Security.Cryptography.SHA256]::Create()
 try{return [BitConverter]::ToString($h.ComputeHash([Text.Encoding]::UTF8.GetBytes([string]$r.Content))).Replace('-','').ToLowerInvariant()}
 finally{$h.Dispose()}
}
function ReadD1([string]$config){
 $sql="SELECT COUNT(*) AS total,SUM(CASE WHEN state='Live' AND reason_code IS NULL THEN 1 ELSE 0 END) AS completed FROM p3_operations"
 $out=@(& npx.cmd --yes wrangler@4.153.0 d1 execute fishing-p3-sandbox --remote --json --config $config --command $sql)
 Require ($LASTEXITCODE -eq 0) 'Read-only D1 verification failed.'
 $items=@(ConvertFrom-Json -InputObject ($out -join [Environment]::NewLine))
 Require ($items.Count -eq 1 -and $items[0].success -eq $true -and @($items[0].results).Count -eq 1) 'D1 response shape changed.'
 Require ([int]$items[0].results[0].total -eq 3 -and [int]$items[0].results[0].completed -eq 3) 'D1 publication baseline changed.'
}
function CheckSecret {
 $out=@(& npx.cmd --yes wrangler@4.153.0 secret list --name $name --format json --config $oldConfig)
 Require ($LASTEXITCODE -eq 0) 'Cannot inspect encrypted secret NAMES.'
 $secrets=@(ConvertFrom-Json -InputObject ($out -join [Environment]::NewLine))
 Require (@($secrets | Where-Object {$_.name -eq 'D3_FAST_WEBHOOK_SECRET'}).Count -eq 1) 'Signed webhook secret name missing.'
}
Push-Location $root
try{
 $head=(& git rev-parse HEAD).Trim()
 $branch=(& git branch --show-current).Trim()
 Require ($LASTEXITCODE -eq 0 -and $head -eq $ExpectedHead -and $branch -eq 'feature/fish118-p3-mock-publisher') 'Wrong source branch or SHA.'
 $dirty=@(& git status --porcelain --untracked-files=no)
 Require ($dirty.Count -eq 0) 'Tracked local source differs; refuse.'
 & git check-ignore -q $newConfig
 Require ($LASTEXITCODE -eq 0) 'New local config would not be gitignored.'
 Require (Test-Path -LiteralPath $oldConfig) 'Previously deployed private config not found.'
 $source=[IO.File]::ReadAllText($oldConfig)
 foreach($p in @(
  '"name"\s*:\s*"fishing-auth-p0-test"',
  '"main"\s*:\s*"src/d3-owner-runtime\.mjs"',
  '"keep_vars"\s*:\s*true',
  '"D3_FAST_WATCHDOG_ENABLED"\s*:\s*"false"',
  '"D3_FAST_WEBHOOK_ENABLED"\s*:\s*"false"',
  '"D3_FAST_TRACE_ENABLED"\s*:\s*"false"',
  '"class_name"\s*:\s*"D3FastWakeAlarm"',
  '"new_sqlite_classes"\s*:\s*\[\s*"D3FastWakeAlarm"\s*\]',
  '"binding"\s*:\s*"DB"',
  '"binding"\s*:\s*"OPERATIONS_DB"',
  '"crons"\s*:\s*\[\s*"\*/5 \* \* \* \*"\s*\]'
 )){One $source $p}
 Require ($source -notmatch '"D3_FAST_WEBHOOK_SECRET"\s*:') 'Do not put secrets into local variables.'
 $from='"D3_FAST_WATCHDOG_ENABLED": "false"'
 $to='"D3_FAST_WATCHDOG_ENABLED": "true"'
 One $source ([regex]::Escape($from))
 $candidate=$source.Replace($from,$to)
 Require ($candidate.Replace($to,$from) -ceq $source) 'Unexpected additional config change.'
 if(Test-Path -LiteralPath $newConfig){
  Require ([IO.File]::ReadAllText($newConfig) -ceq $candidate) 'Previously staged candidate differs.'
 }else{
  [IO.File]::WriteAllText($newConfig,$candidate,(New-Object Text.UTF8Encoding($false)))
 }
 Push-Location (Join-Path $root 'pwa')
 try{
  & node tools/build-d3-pilot.mjs --check
  Require ($LASTEXITCODE -eq 0) 'Pilot source verification failed.'
  & node tools/verify-d3-runtime.mjs
  Require ($LASTEXITCODE -eq 0) 'Worker runtime package verification failed.'
 }finally{Pop-Location}
 Push-Location $preview
 try{
  Require ((Version) -eq $ExpectedWorkerVersion) 'Unexpected Worker version; no deploy.'
  Require ((Route) -eq 404) 'Webhook route unexpectedly open.'
  $hash=PublicHash
  ReadD1 $oldConfig
  CheckSecret
  $folder=Join-Path $env:TEMP ('fishing-p1-enable-'+[guid]::NewGuid().ToString('N'))
  try{
   & npx.cmd --yes wrangler@4.153.0 deploy --dry-run --config $newConfig --outdir $folder
   Require ($LASTEXITCODE -eq 0) 'Wrangler dry run failed.'
  }finally{if(Test-Path -LiteralPath $folder){Remove-Item -LiteralPath $folder -Force -Recurse}}
  Require ((Version) -eq $ExpectedWorkerVersion -and (PublicHash) -eq $hash) 'Worker or proxy drift during dry run.'
  if(-not $Deploy){
   Write-Output ('PASS: PREPARED ONLY, current Worker version '+$ExpectedWorkerVersion)
  }else{
   & npx.cmd --yes wrangler@4.153.0 deploy --config $newConfig
   Require ($LASTEXITCODE -eq 0) 'Deploy outcome uncertain; read-only inspection before retry.'
   $after=Version
   Require ($after -ne $ExpectedWorkerVersion) 'No new version observed; do not retry blindly.'
   Require ((Route) -eq 404) 'GitHub webhook unexpectedly active.'
   Require ((PublicHash) -eq $hash) 'Public V2 proxy changed.'
   ReadD1 $newConfig
   CheckSecret
   Write-Output ('PASS: WATCHDOG ON, WEBHOOK OFF. New Worker version '+$after)
  }
 }finally{Pop-Location}
}finally{Pop-Location}
