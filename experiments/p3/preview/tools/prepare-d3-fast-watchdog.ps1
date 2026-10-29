# FISH118 P1: sandbox-only SQLite Durable Object, owner-run Wrangler.
# Default: prepare candidate + dry run. -Deploy: one guarded existing Worker replacement.
# Never create secrets/webhooks, edit D1, enable publishing flags or touch public GitHub.
param(
 [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{40}$')][string]$ExpectedHead,
 [string]$ExpectedWorkerVersion='',
 [switch]$Deploy
)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$root=(Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
$preview=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$oldConfig=Join-Path $preview 'wrangler.d3-cross-device-status-fix.local.jsonc'
$newConfig=Join-Path $preview 'wrangler.d3-fast-watchdog.local.jsonc'
$worker='fishing-auth-p0-test'
$origin='https://fishing-auth-p0-test.ginosega.workers.dev'
function Require([bool]$ok,[string]$message){if(-not $ok){throw $message}}
function ExactlyOne([string]$src,[string]$pattern,[string]$name){
 Require ([regex]::Matches($src,$pattern).Count -eq 1) ('Unexpected config shape: '+$name)
}
function Version {
 $out=@(& npx.cmd --yes wrangler@4.153.0 deployments status --name $worker)
 Require ($LASTEXITCODE -eq 0) 'Cannot verify existing Worker version.'
 $m=[regex]::Matches(($out -join [Environment]::NewLine),'(?m)\(100%\)\s+([0-9a-f-]{36})')
 Require ($m.Count -eq 1) 'Expected exactly one 100% Worker version.'
 return $m[0].Groups[1].Value
}
function Status([string]$url){
 try{
  $r=Invoke-WebRequest -Uri ($origin+$url) -UseBasicParsing -TimeoutSec 25 -MaximumRedirection 0 -Headers @{'Cache-Control'='no-store'}
  return [int]$r.StatusCode
 }catch{
  if($_.Exception.Response){return [int]$_.Exception.Response.StatusCode}
  throw 'Unable to inspect existing private route.'
 }
}
function PublicHash {
 $r=Invoke-WebRequest -Uri ($origin+'/fishing/') -UseBasicParsing -TimeoutSec 25 -MaximumRedirection 0 -Headers @{'Cache-Control'='no-store'}
 Require ([int]$r.StatusCode -eq 200) 'Existing public V2 proxy unavailable.'
 $sha=[Security.Cryptography.SHA256]::Create()
 try{return [BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes([string]$r.Content))).Replace('-','').ToLowerInvariant()}
 finally{$sha.Dispose()}
}
function CheckD1([string]$config) {
 $sql="SELECT COUNT(*) AS n,SUM(CASE WHEN state='Live' AND reason_code IS NULL THEN 1 ELSE 0 END) AS live_count FROM p3_operations"
 $out=@(& npx.cmd --yes wrangler@4.153.0 d1 execute fishing-p3-sandbox --remote --json --config $config --command $sql)
 Require ($LASTEXITCODE -eq 0) 'Read-only sandbox D1 check failed.'
 $rows=@(ConvertFrom-Json -InputObject ($out -join [Environment]::NewLine))
 Require ($rows.Count -eq 1 -and $rows[0].success -eq $true -and @($rows[0].results).Count -eq 1) 'Unexpected D1 response.'
 Require ([int]$rows[0].results[0].n -eq 3 -and [int]$rows[0].results[0].live_count -eq 3) 'Old sandbox publication records changed. STOP.'
}
Push-Location $root
try{
 $head=(& git rev-parse HEAD).Trim()
 $branch=(& git branch --show-current).Trim()
 Require ($head -eq $ExpectedHead -and $branch -eq 'feature/fish118-p3-mock-publisher') 'Wrong Git head or branch.'
 $dirty=@(& git status --porcelain --untracked-files=no)
 Require ($dirty.Count -eq 0) 'Tracked working files changed.'
 & git check-ignore -q $newConfig
 Require ($LASTEXITCODE -eq 0) 'Private config path not Git-ignored.'
 Require (Test-Path -LiteralPath $oldConfig) 'Last working D3 config missing.'
 $source=[IO.File]::ReadAllText($oldConfig)
 foreach($rule in @(
  '"name"\s*:\s*"fishing-auth-p0-test"',
  '"main"\s*:\s*"src/d3-owner-runtime\.mjs"',
  '"keep_vars"\s*:\s*true',
  '"workers_dev"\s*:\s*true',
  '"binding"\s*:\s*"DB"',
  '"binding"\s*:\s*"OPERATIONS_DB"',
  '"APP_ORIGIN"\s*:\s*"https://fishing-auth-p0-test\.ginosega\.workers\.dev"',
  '"D3_SANDBOX_REPO_ID"\s*:\s*"1430581407"',
  '"crons"\s*:\s*\[\s*"\*/5 \* \* \* \*"\s*\]'
 )){ExactlyOne $source $rule $rule}
 foreach($name in @('D3_WRITE_ENABLED','D3_RUNNER_ENABLED','D3_TEST_HOST_ENABLED','D3_READ_TOKENS_ENABLED','D3_PILOT_ENABLED')){
  ExactlyOne $source ('"'+$name+'"\s*:\s*"true"') $name
 }
 foreach($name in @('D2_WRITE_ENABLED','D2_RUNNER_ENABLED','D2_READ_TOKENS_ENABLED','D2_TEST_HOST_ENABLED')){
  ExactlyOne $source ('"'+$name+'"\s*:\s*"false"') $name
 }
 Require ($source -notmatch '"(?:migrations|exports|durable_objects)"\s*:') 'Existing DO config detected. Do not overwrite.'
 Require ($source -notmatch '"D3_FAST_') 'Fast mode already configured; do not duplicate.'
 Require ($source -notmatch 'REPLACE_WITH_|"D2_CSRF_KEY"\s*:|"D2_GITHUB_APP_PRIVATE_KEY"\s*:') 'Placeholders or plaintext secrets in predecessor.'
 ExactlyOne $source '"vars"\s*:\s*\{' 'vars block'
 $flags='"vars": {'+[Environment]::NewLine+'    "D3_FAST_WATCHDOG_ENABLED": "false",'+[Environment]::NewLine+'    "D3_FAST_WEBHOOK_ENABLED": "false",'+[Environment]::NewLine+'    "D3_FAST_TRACE_ENABLED": "false",'
 $updated=[regex]::Replace($source,'"vars"\s*:\s*\{',$flags)
 Require ($updated.TrimEnd().EndsWith('}')) 'Unrecognized JSONC ending.'
 $last=$updated.LastIndexOf('}')
 $prefix=$updated.Substring(0,$last).TrimEnd()
 Require (-not $prefix.EndsWith(',')) 'Unexpected existing trailing comma.'
 $extra=@'
,
  "durable_objects": {
    "bindings": [{"name": "D3_FAST_WAKE_DO", "class_name": "D3FastWakeAlarm"}]
  },
  "migrations": [
    {"tag": "d3_fast_wake_v1", "new_sqlite_classes": ["D3FastWakeAlarm"]}
  ]
'@
 $candidate=$prefix+$extra+"}"+[Environment]::NewLine
 if(Test-Path -LiteralPath $newConfig){
  Require ([IO.File]::ReadAllText($newConfig) -ceq $candidate) 'Previously staged candidate differs; STOP.'
 }else{
  [IO.File]::WriteAllText($newConfig,$candidate,(New-Object Text.UTF8Encoding($false)))
 }
 Push-Location (Join-Path $root 'pwa')
 try{
  & node tools/build-d3-pilot.mjs --check
  Require ($LASTEXITCODE -eq 0) 'D3 pilot generation failed.'
  & node tools/verify-d3-runtime.mjs
  Require ($LASTEXITCODE -eq 0) 'D3 worker package check failed.'
 }finally{Pop-Location}
 Push-Location $preview
 try{
  $pre=Version
  if($ExpectedWorkerVersion){Require ($pre -eq $ExpectedWorkerVersion) 'Worker version changed since preflight.'}
  if($Deploy){Require ($ExpectedWorkerVersion -ne '') 'Deploy requires an exact -ExpectedWorkerVersion.'}
  $public=PublicHash
  Require ((Status '/__d3_fast__/github-check') -eq 404) 'Webhook route unexpectedly active before deploy.'
  CheckD1 $oldConfig
  $temp=Join-Path $env:TEMP ('fishing-p1-dryrun-'+[guid]::NewGuid().ToString('N'))
  try{
   & npx.cmd --yes wrangler@4.153.0 deploy --dry-run --config $newConfig --outdir $temp
   Require ($LASTEXITCODE -eq 0) 'Wrangler candidate dry-run failed; no deploy.'
  }finally{if(Test-Path -LiteralPath $temp){Remove-Item $temp -Force -Recurse}}
  Require ((Version) -eq $pre -and (PublicHash) -eq $public) 'Existing Worker/V2 changed during preflight.'
  if(-not $Deploy){
   Write-Output ('PASS: PREPARED ONLY, no account mutation. Predecessor Worker version: '+$pre)
   Write-Output ('Git head: '+$head)
  }else{
   & npx.cmd --yes wrangler@4.153.0 deploy --config $newConfig
   Require ($LASTEXITCODE -eq 0) 'Deploy outcome uncertain. Read-only reconciliation required before retry.'
   $after=Version
   Require ($after -ne $pre) 'Worker version did not change; inspect, do not repeat blindly.'
   Require ((Status '/__d3_fast__/github-check') -eq 404) 'Fast route unexpectedly enabled.'
   Require ((PublicHash) -eq $public) 'Public V2 proxy changed. STOP and inspect rollback.'
   CheckD1 $newConfig
   Write-Output ('PASS: DISABLED-ONLY private DO provisioning; Worker version '+$after)
  }
 }finally{Pop-Location}
}finally{Pop-Location}
