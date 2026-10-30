# FISH118 D4 private media + Catch pilot only. Never alters public V2 or D1.
# First execute without -Deploy; on PASS execute once with -Deploy.
param(
 [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{40}$')][string]$ExpectedHead,
 [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9-]{36}$')][string]$ExpectedWorkerVersion,
 [switch]$Deploy
)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$root=(Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
$preview=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$source=Join-Path $preview 'wrangler.d3-connection-poll.local.jsonc'
$candidate=Join-Path $preview 'wrangler.d4-private-media.local.jsonc'
$bundle=Join-Path $preview 'src\generated\d3-pilot.bundle.sha256.json'
$origin='https://fishing-auth-p0-test.ginosega.workers.dev'
$previous='6a3db817c67d47773ef0f911ceeea1c94e554163186ced006d8b7ab4893be542'
function Need([bool]$condition,[string]$message){
 if(-not $condition){throw $message}
}
function ExactlyOne([string]$data,[string]$regex,[string]$name){
 Need ([regex]::Matches($data,$regex).Count -eq 1) ('Configuration drift: '+$name)
}
function Version{
 $lines=@(& npx.cmd --yes wrangler@4.153.0 deployments status --name fishing-auth-p0-test)
 Need ($LASTEXITCODE -eq 0) 'Cannot read private Worker version.'
 $m=[regex]::Matches(($lines -join [Environment]::NewLine),'(?m)\(100%\)\s+([0-9a-f-]{36})')
 Need ($m.Count -eq 1) 'Worker version ambiguous.'
 return $m[0].Groups[1].Value
}
function Http([string]$path,[string]$method='GET'){
 try{
  $r=Invoke-WebRequest -Uri ($origin+$path) -Method $method -TimeoutSec 25 -UseBasicParsing -MaximumRedirection 0 -Headers @{'Cache-Control'='no-store'}
  return [int]$r.StatusCode
 }catch{
  if($_.Exception.Response){return [int]$_.Exception.Response.StatusCode}
  throw ('Unable to check endpoint '+$path)
 }
}
function PublicHash{
 $r=Invoke-WebRequest -Uri ($origin+'/fishing/') -TimeoutSec 25 -UseBasicParsing -MaximumRedirection 0 -Headers @{'Cache-Control'='no-store'}
 Need ([int]$r.StatusCode -eq 200) 'Public V2 cannot be verified.'
 $sha=[Security.Cryptography.SHA256]::Create()
 try{return [BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes([string]$r.Content))).Replace('-','').ToLowerInvariant()}
 finally{$sha.Dispose()}
}
function BaseProof{
 Need ((Http '/__d3_pilot__/') -eq 401) 'Anonymous owner page exposed.'
 Need ((Http '/__d3_pilot__/pilot.js') -eq 401) 'Anonymous pilot script exposed.'
 Need ((Http '/__d3_fast__/github-check' 'POST') -eq 401) 'Unsigned webhook accepted.'
 Need ((Http '/session') -eq 200) 'Owner session endpoint is unavailable.'
}
function D1Proof([string]$config){
 $sql="SELECT state,reason_code,merge_sha FROM p3_operations WHERE operation_id='p3_23bf8ff9-c95b-40ba-9c1d-b4463b2e6489'"
 $output=@(& npx.cmd --yes wrangler@4.153.0 d1 execute fishing-p3-sandbox --remote --json --config $config --command $sql)
 Need ($LASTEXITCODE -eq 0) 'Remote D1 read-only check failed.'
 $results=@(ConvertFrom-Json -InputObject ($output -join [Environment]::NewLine))
 Need ($results.Count -eq 1 -and $results[0].success -eq $true -and @($results[0].results).Count -eq 1) 'D1 check shape changed.'
 $row=$results[0].results[0]
 Need ($row.state -eq 'Live' -and $null -eq $row.reason_code -and $row.merge_sha -eq '45f3d5da6aa797d01be61b3078585ea4449bcf91') 'Last canonical private publication receipt drifted.'
}
Push-Location $root
try{
 $head=(& git rev-parse HEAD).Trim()
 $branch=(& git branch --show-current).Trim()
 Need ($LASTEXITCODE -eq 0 -and $head -eq $ExpectedHead -and $branch -eq 'feature/fish118-p3-mock-publisher') 'Wrong branch or revision.'
 Need (@(& git status --porcelain --untracked-files=no).Count -eq 0) 'Tracked files are dirty.'
 & git check-ignore -q -- $candidate
 Need ($LASTEXITCODE -eq 0) 'Candidate config must be Git ignored.'
 Need (Test-Path -LiteralPath $source) 'Reviewed deployed D3 Worker config missing.'
 $old=[IO.File]::ReadAllText($source)
 $sourceHash=(Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash
 foreach($regex in @(
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
 )){ExactlyOne $old $regex $regex}
 foreach($name in @('D2_WRITE_ENABLED','D2_RUNNER_ENABLED','D2_READ_TOKENS_ENABLED','D2_TEST_HOST_ENABLED')){
  ExactlyOne $old ('"'+$name+'"\s*:\s*"false"') $name
 }
 Need ($old -notmatch '"D4_MEDIA_ENABLED"\s*:\s*"true"') 'D4 already armed in old config.'
 foreach($secret in @('D2_GITHUB_APP_PRIVATE_KEY','D2_CSRF_KEY','D3_FAST_WEBHOOK_SECRET')){
  Need ($old -notmatch ('"'+$secret+'"\s*:')) 'Plaintext secret entry found in config.'
 }
 $oldPilot='"D3_PILOT_SHA256": "'+$previous+'"'
 ExactlyOne $old ([regex]::Escape($oldPilot)) 'Prior confirmed pilot hash'
 Push-Location (Join-Path $root 'pwa')
 try{
  & node tools/build-d3-pilot.mjs --check
  Need ($LASTEXITCODE -eq 0) 'Pilot bundle build failed.'
  & node tools/verify-d3-windows-eol.mjs
  Need ($LASTEXITCODE -eq 0) 'Windows EOL check failed.'
  & node tools/verify-d3-csp.mjs
  Need ($LASTEXITCODE -eq 0) 'Owner page CSP check failed.'
  & node tools/verify-d3-runtime.mjs
  Need ($LASTEXITCODE -eq 0) 'Runtime verification failed.'
 }finally{Pop-Location}
 $metadata=ConvertFrom-Json -InputObject ([IO.File]::ReadAllText($bundle))
 $newHash=[string]$metadata.sha256
 Need ($metadata.format -eq 'fishing-d3-pilot-local-build-v1' -and $newHash -match '^[a-f0-9]{64}$' -and $newHash -ne $previous) 'Untrusted new pilot source hash.'
 $newPilot='"D3_PILOT_SHA256": "'+$newHash+'"'
 $new=$old.Replace($oldPilot,$newPilot)
 $marker='"D3_PILOT_ENABLED": "true",'
 ExactlyOne $new ([regex]::Escape($marker)) 'Owner pilot flag'
 $armed=$marker+[Environment]::NewLine+'    "D4_MEDIA_ENABLED": "true",'
 $new=$new.Replace($marker,$armed)
 Need ($new.Replace($armed,$marker).Replace($newPilot,$oldPilot) -ceq $old) 'Candidate config contains unexpected changes.'
 if(Test-Path -LiteralPath $candidate){
  Need ([IO.File]::ReadAllText($candidate) -ceq $new) 'Existing ignored candidate differs, STOP.'
 }else{
  [IO.File]::WriteAllText($candidate,$new,(New-Object Text.UTF8Encoding($false)))
 }
 Push-Location $preview
 try{
  $before=Version
  Need ($before -eq $ExpectedWorkerVersion) 'Private Worker version drift; STOP.'
  BaseProof
  Need ((Http '/api/v3/media' 'POST') -eq 404) 'Media API unexpectedly armed before deployment.'
  D1Proof $source
  $public=PublicHash
  $temp=Join-Path $env:TEMP ('fishing-d4-'+[guid]::NewGuid().ToString('N'))
  try{
   & npx.cmd --yes wrangler@4.153.0 deploy --dry-run --config $candidate --outdir $temp
   Need ($LASTEXITCODE -eq 0) 'Wrangler dry run failed.'
  }finally{if(Test-Path $temp){Remove-Item -LiteralPath $temp -Recurse -Force}}
  Need ((Version) -eq $before -and (PublicHash) -eq $public) 'Worker/public V2 moved during preflight.'
  Need ((Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash -eq $sourceHash) 'Existing deployed config changed.'
  if(-not $Deploy){
   Write-Output ('PASS: D4 PRIVATE PREFLIGHT ONLY; Worker '+$before)
   Write-Output ('PINNED_SOURCE_HEAD: '+$head)
   Write-Output ('NEW_PRIVATE_PILOT_HASH: '+$newHash)
   Write-Output 'No live Worker, D1, GitHub or public V2 mutation.'
  }else{
   & npx.cmd --yes wrangler@4.153.0 deploy --config $candidate
   Need ($LASTEXITCODE -eq 0) 'Deployment outcome ambiguous; inspect before retry.'
   $after=Version
   Need ($after -ne $before) 'Worker not updated; inspect before retry.'
   BaseProof
   Need ((Http '/api/v3/media' 'POST') -eq 403) 'Anonymous media API did not fail closed as expected.'
   D1Proof $candidate
   Need ((PublicHash) -eq $public) 'Public V2 byte hash changed.'
   Need ((Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash -eq $sourceHash) 'Existing deployed config changed.'
   Write-Output ('PASS: D4 PRIVATE MEDIA PILOT DEPLOYED '+$after)
   Write-Output ('NEW_PRIVATE_PILOT_HASH: '+$newHash)
   Write-Output 'Public V2, webhook, watchdog, recovery Cron and original D1 receipt preserved.'
  }
 }finally{Pop-Location}
}finally{Pop-Location}
