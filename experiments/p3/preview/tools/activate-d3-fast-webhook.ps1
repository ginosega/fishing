# FISH118 P1 signed-check webhook receiver activation, private sandbox ONLY.
# Keeps existing durable watchdog enabled. Repository webhook stays inactive
# until user manually checks Active in GitHub after this gate passes.
param(
 [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{40}$')][string]$ExpectedHead,
 [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9-]{36}$')][string]$ExpectedWorkerVersion,
 [switch]$Deploy
)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$root=(Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
$preview=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$oldConfig=Join-Path $preview 'wrangler.d3-pilot-hash-repair.local.jsonc'
$newConfig=Join-Path $preview 'wrangler.d3-fast-webhook-enabled.local.jsonc'
$worker='fishing-auth-p0-test'
$origin='https://fishing-auth-p0-test.ginosega.workers.dev'
$expectedPilot='4befa904a5a14d944b9b09fdee6d2ffb56eb33885f692016e7f0b18233346ea6'
function Need([bool]$pass,[string]$message){if(-not $pass){throw $message}}
function One([string]$text,[string]$rx){Need ([regex]::Matches($text,$rx).Count -eq 1) ('Config drift: '+$rx)}
function LiveVersion {
 $out=@(& npx.cmd --yes wrangler@4.153.0 deployments status --name $worker)
 Need ($LASTEXITCODE -eq 0) 'Worker version inspection failed.'
 $m=[regex]::Matches(($out -join [Environment]::NewLine),'(?m)\(100%\)\s+([0-9a-f-]{36})')
 Need ($m.Count -eq 1) 'Multiple or ambiguous Worker versions.'
 return $m[0].Groups[1].Value
}
function Status([string]$path,[string]$method='GET'){
 try{
  $r=Invoke-WebRequest -Uri ($origin+$path) -Method $method -UseBasicParsing -TimeoutSec 25 -MaximumRedirection 0 -Headers @{'Cache-Control'='no-store'}
  return [int]$r.StatusCode
 }catch{
  if($_.Exception.Response){return [int]$_.Exception.Response.StatusCode}
  throw ('Read-only route status not available: '+$path)
 }
}
function PublicHash{
 $r=Invoke-WebRequest -Uri ($origin+'/fishing/') -UseBasicParsing -TimeoutSec 25 -MaximumRedirection 0 -Headers @{'Cache-Control'='no-store'}
 Need ([int]$r.StatusCode -eq 200) 'V2 gateway unavailable.'
 $sha=[Security.Cryptography.SHA256]::Create()
 try{return [BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes([string]$r.Content))).Replace('-','').ToLowerInvariant()}
 finally{$sha.Dispose()}
}
function D1Proof([string]$config){
 $op='p3_3a45cec8-3838-4964-898e-24575a740588'
 $merge='f8167b2167731cff50772debae413bf18e6c55ce'
 $sql="SELECT COUNT(*) AS total,SUM(CASE WHEN state='Live' AND reason_code IS NULL THEN 1 ELSE 0 END) AS live_count,SUM(CASE WHEN operation_id='$op' AND state='Live' AND reason_code IS NULL AND merge_sha='$merge' THEN 1 ELSE 0 END) AS latest FROM p3_operations"
 $raw=@(& npx.cmd --yes wrangler@4.153.0 d1 execute fishing-p3-sandbox --remote --json --config $config --command $sql)
 Need ($LASTEXITCODE -eq 0) 'D1 read-only query failed.'
 $data=@(ConvertFrom-Json -InputObject ($raw -join [Environment]::NewLine))
 Need ($data.Count -eq 1 -and $data[0].success -eq $true -and @($data[0].results).Count -eq 1) 'Unexpected D1 JSON response.'
 $v=$data[0].results[0]
 Need ([int]$v.total -eq 4 -and [int]$v.live_count -eq 4 -and [int]$v.latest -eq 1) 'Four known sandbox Live receipts not verified; STOP.'
}
function WebhookSecretName{
 $raw=@(& npx.cmd --yes wrangler@4.153.0 secret list --name $worker --format json --config $oldConfig)
 Need ($LASTEXITCODE -eq 0) 'Cannot read Worker secret names.'
 $secrets=@(ConvertFrom-Json -InputObject ($raw -join [Environment]::NewLine))
 Need (@($secrets | Where-Object {$_.name -eq 'D3_FAST_WEBHOOK_SECRET'}).Count -eq 1) 'Encrypted webhook secret name missing.'
}
Push-Location $root
try{
 $head=(& git rev-parse HEAD).Trim()
 $branch=(& git branch --show-current).Trim()
 Need ($LASTEXITCODE -eq 0 -and $head -eq $ExpectedHead -and $branch -eq 'feature/fish118-p3-mock-publisher') 'Wrong reviewed Git branch/head.'
 $dirty=@(& git status --porcelain --untracked-files=no)
 Need ($dirty.Count -eq 0) 'Tracked worktree changed.'
 & git check-ignore -q $newConfig
 Need ($LASTEXITCODE -eq 0) 'Private candidate not gitignored.'
 Need (Test-Path -LiteralPath $oldConfig) 'Last deployed pilot-hash repair config not found.'
 $original=[IO.File]::ReadAllText($oldConfig)
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
  '"D3_FAST_WEBHOOK_ENABLED"\s*:\s*"false"',
  '"D3_FAST_TRACE_ENABLED"\s*:\s*"false"',
  '"class_name"\s*:\s*"D3FastWakeAlarm"',
  '"new_sqlite_classes"\s*:\s*\[\s*"D3FastWakeAlarm"\s*\]',
  '"binding"\s*:\s*"DB"',
  '"binding"\s*:\s*"OPERATIONS_DB"',
  '"crons"\s*:\s*\[\s*"\*/5 \* \* \* \*"\s*\]'
 )){One $original $rule}
 One $original ('"D3_PILOT_SHA256"\s*:\s*"'+$expectedPilot+'"')
 Need ($original -notmatch '"D3_FAST_WEBHOOK_SECRET"\s*:') 'Encrypted webhook secret must not appear in config.'
 $from='"D3_FAST_WEBHOOK_ENABLED": "false"'
 $to='"D3_FAST_WEBHOOK_ENABLED": "true"'
 One $original ([regex]::Escape($from))
 $new=$original.Replace($from,$to)
 Need ($new.Replace($to,$from) -ceq $original) 'Config change exceeds one flag.'
 if(Test-Path -LiteralPath $newConfig){
  Need ([IO.File]::ReadAllText($newConfig) -ceq $new) 'Previously staged config does not match.'
 }else{
  [IO.File]::WriteAllText($newConfig,$new,(New-Object Text.UTF8Encoding($false)))
 }
 Push-Location (Join-Path $root 'pwa')
 try{
  & node tools/build-d3-pilot.mjs --check
  Need ($LASTEXITCODE -eq 0) 'Pilot bundle build check failed.'
  & node tools/verify-d3-runtime.mjs
  Need ($LASTEXITCODE -eq 0) 'D3 Worker runtime validation failed.'
 }finally{Pop-Location}
 Push-Location $preview
 try{
  Need ((LiveVersion) -eq $ExpectedWorkerVersion) 'Worker version has changed.'
  Need ((Status '/__d3_fast__/github-check') -eq 404) 'Webhook receiver already enabled.'
  Need ((Status '/__d3_pilot__/') -eq 401) 'Anonymous pilot admission changed.'
  Need ((Status '/session') -eq 200) 'Session route unavailable.'
  $public=PublicHash
  D1Proof $oldConfig
  WebhookSecretName
  $tmp=Join-Path $env:TEMP ('fishing-d3-webhook-'+[guid]::NewGuid().ToString('N'))
  try{
   & npx.cmd --yes wrangler@4.153.0 deploy --dry-run --config $newConfig --outdir $tmp
   Need ($LASTEXITCODE -eq 0) 'Wrangler dry-run failed; no deploy.'
  }finally{if(Test-Path -LiteralPath $tmp){Remove-Item -LiteralPath $tmp -Force -Recurse}}
  Need ((LiveVersion) -eq $ExpectedWorkerVersion -and (PublicHash) -eq $public) 'Drift during preflight.'
  if(-not $Deploy){
   Write-Output ('PASS: PREPARED ONLY, webhook remains disabled. Worker '+$ExpectedWorkerVersion)
  }else{
   & npx.cmd --yes wrangler@4.153.0 deploy --config $newConfig
   Need ($LASTEXITCODE -eq 0) 'Deploy outcome uncertain. Inspect before retry.'
   $after=LiveVersion
   Need ($after -ne $ExpectedWorkerVersion) 'No new Worker version observed.'
   Need ((Status '/__d3_fast__/github-check') -eq 401) 'Unsigned GET not rejected at active webhook receiver.'
   Need ((Status '/__d3_fast__/github-check' 'POST') -eq 401) 'Unsigned POST not rejected.'
   Need ((Status '/__d3_pilot__/') -eq 401) 'Anonymous pilot denial changed.'
   Need ((Status '/session') -eq 200) 'Session API unavailable after deployment.'
   Need ((PublicHash) -eq $public) 'Public V2 proxy byte identity changed.'
   D1Proof $newConfig
   WebhookSecretName
   Write-Output ('PASS: SIGNED RECEIVER ON, EXISTING WATCHDOG ON. GitHub hook still inactive. Worker '+$after)
  }
 }finally{Pop-Location}
}finally{Pop-Location}
