# FISH118 D4 signed-original verification + accepted-form Exit fix.
# Replaces ONLY the exact already-deployed PRIVATE D4 Worker after preflight.
# Do NOT use this script for a public cutover or a changed Worker version.
param(
 [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{40}$')][string]$ExpectedHead,
 [Parameter(Mandatory=$true)][ValidatePattern('^[0-9a-f-]{36}$')][string]$ExpectedWorkerVersion,
 [switch]$Deploy
)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$root=(Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
$preview=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$source=Join-Path $preview 'wrangler.d4-catch-ux.local.jsonc'
$candidate=Join-Path $preview 'wrangler.d4-image-verify-exit.local.jsonc'
$meta=Join-Path $preview 'src\generated\d3-pilot.bundle.sha256.json'
$origin='https://fishing-auth-p0-test.ginosega.workers.dev'
$priorVersion=$ExpectedWorkerVersion
$priorHash='1c54171190e66d76bc2a0d6158560927fdca32c22251d5e3a92102699d04282e'
function Need([bool]$ok,[string]$reason){if(-not $ok){throw $reason}}
function One([string]$text,[string]$pattern,[string]$label){
 Need ([regex]::Matches($text,$pattern).Count -eq 1) ('Unexpected configuration: '+$label)
}
function WorkerVersion{
 $lines=@(& npx.cmd --yes wrangler@4.153.0 deployments status --name fishing-auth-p0-test)
 Need ($LASTEXITCODE -eq 0) 'Cannot read existing private Worker deployment.'
 $match=[regex]::Matches(($lines -join [Environment]::NewLine),'(?m)\(100%\)\s+([0-9a-f-]{36})')
 Need ($match.Count -eq 1) 'Ambiguous private Worker version.'
 return $match[0].Groups[1].Value
}
function Status([string]$path,[string]$method='GET'){
 try{
  $r=Invoke-WebRequest -Uri ($origin+$path) -Method $method -TimeoutSec 25 -UseBasicParsing -MaximumRedirection 0 -Headers @{'Cache-Control'='no-store'}
  return [int]$r.StatusCode
 }catch{
  if($_.Exception.Response){return [int]$_.Exception.Response.StatusCode}
  throw ('Unable to verify '+$path)
 }
}
function PublicHash{
 $r=Invoke-WebRequest -Uri ($origin+'/fishing/') -TimeoutSec 25 -UseBasicParsing -MaximumRedirection 0 -Headers @{'Cache-Control'='no-store'}
 Need ([int]$r.StatusCode -eq 200) 'Public V2 is unavailable.'
 $sha=[Security.Cryptography.SHA256]::Create()
 try{return [BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes([string]$r.Content))).Replace('-','').ToLowerInvariant()}
 finally{$sha.Dispose()}
}
function SecurityProof{
 Need ((Status '/__d3_pilot__/') -eq 401) 'Anonymous pilot exposed.'
 Need ((Status '/__d3_pilot__/pilot.js') -eq 401) 'Private script exposed.'
 Need ((Status '/__d3_fast__/github-check' 'POST') -eq 401) 'Unsigned webhook accepted.'
 Need ((Status '/session') -eq 200) 'Session unavailable.'
 Need ((Status '/api/v3/media' 'POST') -eq 403) 'Anonymous upload unexpectedly accepted.'
 Need ((Status '/api/v3/assets/Gear/Lures/assets/test.jpg?revision=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa') -eq 404) 'Anonymous private image unexpectedly visible.'
}
function D1Proof([string]$config){
 $sql="SELECT state,reason_code,merge_sha FROM p3_operations WHERE operation_id='p3_23bf8ff9-c95b-40ba-9c1d-b4463b2e6489'"
 $o=@(& npx.cmd --yes wrangler@4.153.0 d1 execute fishing-p3-sandbox --remote --json --config $config --command $sql)
 Need ($LASTEXITCODE -eq 0) 'Remote D1 read-only proof failed.'
 $rows=@(ConvertFrom-Json -InputObject ($o -join [Environment]::NewLine))
 Need ($rows.Count -eq 1 -and $rows[0].success -eq $true -and @($rows[0].results).Count -eq 1) 'Unexpected D1 results.'
 $r=$rows[0].results[0]
 Need ($r.state -eq 'Live' -and $null -eq $r.reason_code -and
  $r.merge_sha -eq '45f3d5da6aa797d01be61b3078585ea4449bcf91') 'Existing verified operation drifted.'
}
function GearReceipt([string]$config){
 $sql="SELECT state,reason_code,merge_sha,pr_number FROM p3_operations WHERE operation_id='p3_366c88b0-3b4a-4896-8c44-3c9264715cd7'"
 $o=@(& npx.cmd --yes wrangler@4.153.0 d1 execute fishing-p3-sandbox --remote --json --config $config --command $sql)
 Need ($LASTEXITCODE -eq 0) 'Gear operation read-only proof failed.'
 $rows=@(ConvertFrom-Json -InputObject ($o -join [Environment]::NewLine))
 Need ($rows.Count -eq 1 -and $rows[0].success -eq $true -and @($rows[0].results).Count -eq 1) 'Unexpected Gear D1 result.'
 $row=$rows[0].results[0]
 Need ($row.pr_number -eq 32 -and $row.merge_sha -eq 'cdd4812cfb99442435c7217e451d63ba307f7884' -and
  @('Verifying','Live').Contains([string]$row.state)) 'Gear durable merge receipt differs from verified private GitHub PR #32.'
 return [string]$row.state
}
Push-Location $root
try{
 $head=(& git rev-parse HEAD).Trim()
 $branch=(& git branch --show-current).Trim()
 Need ($LASTEXITCODE -eq 0 -and $head -eq $ExpectedHead -and
  $branch -eq 'feature/fish118-p3-mock-publisher') 'Wrong branch or pinned head.'
 Need (@(& git status --porcelain --untracked-files=no).Count -eq 0) 'Tracked checkout dirty.'
 Need ($ExpectedWorkerVersion -ne '0a11dc90-2595-409d-9f8c-86154fe581a0') 'Older D4 Worker still deployed; confirm previous Catch UX deployment.'
 & git check-ignore -q -- $candidate
 Need ($LASTEXITCODE -eq 0) 'New config must be gitignored.'
 Need (Test-Path -LiteralPath $source) 'Existing D4 deployment config missing.'
 $original=[IO.File]::ReadAllText($source)
 $sourceSha=(Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash
 foreach($pattern in @(
  '"name"\s*:\s*"fishing-auth-p0-test"',
  '"main"\s*:\s*"src/d3-owner-runtime\.mjs"',
  '"keep_vars"\s*:\s*true',
  '"D3_WRITE_ENABLED"\s*:\s*"true"',
  '"D3_RUNNER_ENABLED"\s*:\s*"true"',
  '"D3_PILOT_ENABLED"\s*:\s*"true"',
  '"D3_READ_TOKENS_ENABLED"\s*:\s*"true"',
  '"D3_TEST_HOST_ENABLED"\s*:\s*"true"',
  '"D4_MEDIA_ENABLED"\s*:\s*"true"',
  '"D3_FAST_WATCHDOG_ENABLED"\s*:\s*"true"',
  '"D3_FAST_WEBHOOK_ENABLED"\s*:\s*"true"',
  '"D3_FAST_TRACE_ENABLED"\s*:\s*"false"',
  '"class_name"\s*:\s*"D3FastWakeAlarm"',
  '"binding"\s*:\s*"DB"',
  '"binding"\s*:\s*"OPERATIONS_DB"',
  '"crons"\s*:\s*\[\s*"\*/5 \* \* \* \*"\s*\]'
 )){One $original $pattern $pattern}
 foreach($flag in @('D2_WRITE_ENABLED','D2_RUNNER_ENABLED','D2_READ_TOKENS_ENABLED','D2_TEST_HOST_ENABLED')){
  One $original ('"'+$flag+'"\s*:\s*"false"') $flag
 }
 foreach($secret in @('D2_GITHUB_APP_PRIVATE_KEY','D2_CSRF_KEY','D3_FAST_WEBHOOK_SECRET')){
  Need ($original -notmatch ('"'+$secret+'"\s*:')) 'Unexpected plaintext secret config.'
 }
 $oldPilot='"D3_PILOT_SHA256": "'+$priorHash+'"'
 One $original ([regex]::Escape($oldPilot)) 'Previous deployed D4 browser bundle'
 Push-Location (Join-Path $root 'pwa')
 try{
  & node tools/build-d3-pilot.mjs --check
  Need ($LASTEXITCODE -eq 0) 'Pilot build failed.'
  & node tools/verify-d3-windows-eol.mjs
  Need ($LASTEXITCODE -eq 0) 'Windows EOL check failed.'
  & node tools/verify-d3-csp.mjs
  Need ($LASTEXITCODE -eq 0) 'CSP test failed.'
  & node tools/verify-d3-runtime.mjs
  Need ($LASTEXITCODE -eq 0) 'Runtime validation failed.'
 }finally{Pop-Location}
 $manifest=ConvertFrom-Json -InputObject ([IO.File]::ReadAllText($meta))
 $newHash=[string]$manifest.sha256
 Need ($manifest.format -eq 'fishing-d3-pilot-local-build-v1' -and
  $newHash -match '^[a-f0-9]{64}$' -and $newHash -ne $priorHash) 'New pilot hash invalid.'
 $newPilot='"D3_PILOT_SHA256": "'+$newHash+'"'
 $adjusted=$original.Replace($oldPilot,$newPilot)
 Need ($adjusted.Replace($newPilot,$oldPilot) -ceq $original) 'Unreviewed config mutation.'
 if(Test-Path -LiteralPath $candidate){
  Need ([IO.File]::ReadAllText($candidate) -ceq $adjusted) 'Existing ignored config differs. Do not overwrite.'
 }else{
  [IO.File]::WriteAllText($candidate,$adjusted,(New-Object Text.UTF8Encoding($false)))
 }
 Push-Location $preview
 try{
  $before=WorkerVersion
  Need ($before -eq $priorVersion) 'Worker changed since preflight pinned its version.'
  SecurityProof
  D1Proof $source
  $gearBefore=GearReceipt $source
  $v2=PublicHash
  $temp=Join-Path $env:TEMP ('d4-private-original-proof-'+[guid]::NewGuid().ToString('N'))
  try{
   & npx.cmd --yes wrangler@4.153.0 deploy --dry-run --config $candidate --outdir $temp
   Need ($LASTEXITCODE -eq 0) 'Wrangler dry-run failed.'
  }finally{if(Test-Path $temp){Remove-Item -LiteralPath $temp -Recurse -Force}}
  Need ((WorkerVersion) -eq $before -and (PublicHash) -eq $v2) 'Worker/public V2 changed during preflight.'
  Need ((Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash -eq $sourceSha) 'Previous config changed.'
  if(-not $Deploy){
   Write-Output ('PASS: D4 IMAGE VERIFICATION/EXIT PREFLIGHT; private Worker '+$before)
   Write-Output ('PINNED_SOURCE_HEAD: '+$head)
   Write-Output ('NEW_PRIVATE_PILOT_HASH: '+$newHash)
   Write-Output ('GEAR_OPERATION_BEFORE: '+$gearBefore)
   Write-Output 'No remote changes.'
  }else{
   & npx.cmd --yes wrangler@4.153.0 deploy --config $candidate
   Need ($LASTEXITCODE -eq 0) 'Deploy outcome unknown. Inspect before retrying.'
   $after=WorkerVersion
   Need ($after -ne $before) 'Private Worker version unchanged; investigate before retrying.'
   SecurityProof
   D1Proof $candidate
   $gearAfter=GearReceipt $candidate
   Need ((PublicHash) -eq $v2) 'Public V2 byte identity changed.'
   Need ((Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash -eq $sourceSha) 'Existing D4 config changed.'
   Write-Output ('PASS: PRIVATE D4 VERIFIED IMAGE/EXIT WORKER '+$after)
   Write-Output ('NEW_PRIVATE_PILOT_HASH: '+$newHash)
   Write-Output ('GEAR_OPERATION_AFTER: '+$gearAfter)
   Write-Output 'Public V2 unchanged; owner auth, private upload, webhook, Cron, D1 preserved.'
  }
 }finally{Pop-Location}
}finally{Pop-Location}
