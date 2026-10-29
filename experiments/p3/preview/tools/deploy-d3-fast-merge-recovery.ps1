# P1 fast merge recovery: deploy the private pilot from reviewed exact source.
# Uses existing encrypted-secret-bearing Worker configuration UNCHANGED.
param(
 [Parameter(Mandatory=$true)][string]$ExpectedHead,
 [Parameter(Mandatory=$true)][string]$ExpectedWorkerVersion,
 [switch]$Deploy
)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$root=(Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
$preview=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$config=Join-Path $preview 'wrangler.d3-fast-webhook-enabled.local.jsonc'
$origin='https://fishing-auth-p0-test.ginosega.workers.dev'
function Assert([bool]$ok,[string]$text){if(-not $ok){throw $text}}
function Version {
 $a=@(& npx.cmd --yes wrangler@4.153.0 deployments status --name fishing-auth-p0-test)
 Assert ($LASTEXITCODE -eq 0) 'Version inspection failed'
 $m=[regex]::Matches(($a -join "`n"),'(?m)\(100%\)\s+([0-9a-f-]{36})')
 Assert ($m.Count -eq 1) 'Ambiguous Worker version'
 return $m[0].Groups[1].Value
}
function Status([string]$path,[string]$method='GET'){
 try {
  $r=Invoke-WebRequest ($origin+$path) -Method $method -MaximumRedirection 0 -TimeoutSec 25 -UseBasicParsing
  return [int]$r.StatusCode
 } catch {
  if($_.Exception.Response){return [int]$_.Exception.Response.StatusCode}
  throw
 }
}
function V2Hash {
 $r=Invoke-WebRequest ($origin+'/fishing/') -TimeoutSec 25 -UseBasicParsing
 Assert ($r.StatusCode -eq 200) 'Public V2 unavailable'
 $b=[Text.Encoding]::UTF8.GetBytes([string]$r.Content)
 $sha=[Security.Cryptography.SHA256]::Create()
 try{return [BitConverter]::ToString($sha.ComputeHash($b)).Replace('-','').ToLowerInvariant()}
 finally{$sha.Dispose()}
}
Push-Location $root
try {
 Assert ((& git rev-parse HEAD).Trim() -eq $ExpectedHead) 'Unexpected source HEAD'
 Assert ((& git branch --show-current).Trim() -eq 'feature/fish118-p3-mock-publisher') 'Unexpected branch'
 Assert (@(& git status --porcelain --untracked-files=no).Count -eq 0) 'Tracked worktree modified'
 Assert (Test-Path -LiteralPath $config) 'Previous local Worker config missing'
 & git check-ignore -q $config
 Assert ($LASTEXITCODE -eq 0) 'Worker config not gitignored'
 $raw=[IO.File]::ReadAllText($config)
 foreach($word in @('"D3_FAST_WATCHDOG_ENABLED": "true"','"D3_FAST_WEBHOOK_ENABLED": "true"','"D3_FAST_TRACE_ENABLED": "false"','"D3_PILOT_SHA256": "4befa904a5a14d944b9b09fdee6d2ffb56eb33885f692016e7f0b18233346ea6"')){
  Assert ($raw.Contains($word)) ('Configuration unexpected: '+$word)
 }
 $cfgHash=(Get-FileHash -LiteralPath $config -Algorithm SHA256).Hash
 Push-Location (Join-Path $root 'pwa')
 try {
  & node tools/build-d3-pilot.mjs --check
  Assert ($LASTEXITCODE -eq 0) 'Pilot bundle mismatch'
  & node tools/verify-d3-runtime.mjs
  Assert ($LASTEXITCODE -eq 0) 'Worker runtime validation failed'
 }finally{Pop-Location}
 Push-Location $preview
 try {
  Assert ((Version) -eq $ExpectedWorkerVersion) 'Unexpected deployed version'
  Assert ((Status '/__d3_pilot__/') -eq 401) 'Anonymous pilot exposed'
  Assert ((Status '/__d3_fast__/github-check') -eq 401) 'Webhook GET no longer denied'
  Assert ((Status '/__d3_fast__/github-check' 'POST') -eq 401) 'Unsigned webhook POST accepted'
  $v2=V2Hash
  $sql="SELECT COUNT(*) AS n,SUM(CASE WHEN state='Live' AND reason_code IS NULL THEN 1 ELSE 0 END) AS live FROM p3_operations;"
  $result=@(& npx.cmd --yes wrangler@4.153.0 d1 execute fishing-p3-sandbox --remote --json --config $config --command $sql)
  Assert ($LASTEXITCODE -eq 0) 'Read-only D1 check failed'
  $rows=@(ConvertFrom-Json -InputObject ($result -join "`n"))
  Assert ($rows.Count -eq 1 -and $rows[0].success -eq $true -and $rows[0].results[0].n -eq 5 -and $rows[0].results[0].live -eq 5) 'D1 baseline changed'
  $tmp=Join-Path $env:TEMP ('fishing-merge-fast-'+[guid]::NewGuid().ToString('N'))
  try {
   & npx.cmd --yes wrangler@4.153.0 deploy --dry-run --config $config --outdir $tmp
   Assert ($LASTEXITCODE -eq 0) 'Dry-run failed'
  }finally{if(Test-Path $tmp){Remove-Item -Recurse -Force $tmp}}
  Assert ((Version) -eq $ExpectedWorkerVersion -and (V2Hash) -eq $v2) 'Preflight drift'
  Assert ((Get-FileHash $config -Algorithm SHA256).Hash -eq $cfgHash) 'Config modified'
  if($Deploy){
   & npx.cmd --yes wrangler@4.153.0 deploy --config $config
   Assert ($LASTEXITCODE -eq 0) 'Deploy outcome uncertain; do not repeat blindly'
   $after=Version
   Assert ($after -ne $ExpectedWorkerVersion) 'Worker version unchanged'
   Assert ((Status '/__d3_pilot__/') -eq 401 -and (Status '/__d3_fast__/github-check') -eq 401) 'Private route changed'
   Assert ((V2Hash) -eq $v2) 'Public V2 changed'
   Assert ((Get-FileHash $config -Algorithm SHA256).Hash -eq $cfgHash) 'Config changed'
   Write-Output ('PASS: FAST MERGE RECOVERY DEPLOYED, Worker '+$after)
  }else{Write-Output 'PASS: PREPARED ONLY'}
 }finally{Pop-Location}
}finally{Pop-Location}
