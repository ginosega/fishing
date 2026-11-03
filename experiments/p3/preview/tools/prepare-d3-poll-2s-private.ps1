# FISH118 / FISH287: PREPARE-ONLY 2s polling private rollout.
# This script CANNOT deploy. Owner approval and a separate version-locked
# command are required after reviewing the complete preflight output.
param(
 [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{40}$')][string]$ExpectedHead,
 [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9-]{36}$')][string]$ExpectedWorkerVersion
)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$root=(Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
$preview=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$worker='fishing-auth-p0-test'
$origin='https://fishing-auth-p0-test.ginosega.workers.dev'
$baseline='c0051133da3da4072da0a504632c815780844596'
$deployedVersion='693d46c3-a5f6-4441-af32-397dae1b55d4'
$oldJs='b6d5d25a61b563516e4a3fca20614622d29000e3db320423d27d8d1cb3026f52'
$newJs='8451a8a4822455057863bd354b84880e0244a320e2b50e18a59ef25c33114264'
$cssHash='4648e26bfcb7e97e292337c7e7f59fa35541b0030c378b7262968fa4e347f480'
$sourceConfig=Join-Path $preview 'wrangler.d3-check-merge-diagnostics.local.jsonc'
$candidateConfig=Join-Path $preview 'wrangler.d3-poll-2s-private.local.jsonc'
$manifestPath=Join-Path $preview 'src\generated\d3-pilot.bundle.sha256.json'
$jsPath=Join-Path $preview 'src\generated\d3-pilot.bundle.txt'
$cssPath=Join-Path $preview 'src\generated\d3-pilot.css.txt'
function Need([bool]$condition,[string]$message) {
 if(-not $condition){throw $message}
}
function Once([string]$content,[string]$pattern,[string]$label) {
 Need ([regex]::Matches($content,$pattern).Count -eq 1) ('Unexpected private config: '+$label)
}
function WorkerVersion {
 $output=@(& npx.cmd --yes wrangler@4.153.0 deployments status --name $worker)
 Need ($LASTEXITCODE -eq 0) 'Current Cloudflare Worker version unavailable; STOP.'
 $hits=[regex]::Matches(($output -join [Environment]::NewLine),'(?m)\(100%\)\s+([a-f0-9-]{36})')
 Need ($hits.Count -eq 1) 'Ambiguous Cloudflare active Worker version; STOP.'
 return $hits[0].Groups[1].Value
}
function Status([string]$path,[string]$method='GET') {
 try {
  $r=Invoke-WebRequest -Uri ($origin+$path) -Method $method -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 25 -Headers @{'Cache-Control'='no-store'}
  return [int]$r.StatusCode
 }catch {
  if($_.Exception.Response){return [int]$_.Exception.Response.StatusCode}
  throw ('Unable to verify private route '+$path)
 }
}
function PrivateProof {
 Need ((Status '/__d3_pilot__/') -eq 401) 'Private pilot page exposed or unavailable.'
 Need ((Status '/__d3_pilot__/pilot.js') -eq 401) 'Private pilot JavaScript exposed or unavailable.'
 Need ((Status '/__d3_pilot__/pilot.css') -eq 401) 'Private pilot CSS exposed or unavailable.'
 Need ((Status '/session') -eq 200) 'Owner session endpoint unavailable.'
 Need ((Status '/api/v3/operations/latest') -in @(401,403,404)) 'Unauthenticated operation history exposed.'
 Need ((Status '/__d3_fast__/github-check' 'POST') -eq 401) 'Unsigned webhook must be refused.'
}
function PublicDigest {
 $r=Invoke-WebRequest -Uri ($origin+'/fishing/') -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 25 -Headers @{'Cache-Control'='no-store'}
 Need ([int]$r.StatusCode -eq 200) 'Public V2 proxy unavailable.'
 $sha=[Security.Cryptography.SHA256]::Create()
 try {
  return [BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes([string]$r.Content))).Replace('-','').ToLowerInvariant()
 }finally {$sha.Dispose()}
}
function CompletedD1Proof([string]$config) {
 # Read-only audit of the last owner-verified publication (sandbox PR #60).
 $sql="SELECT state,reason_code,merge_sha FROM p3_operations WHERE operation_id='p3_e0d3240a-cb7d-4a26-881b-22a0cf8ca10b'"
 $output=@(& npx.cmd --yes wrangler@4.153.0 d1 execute fishing-p3-sandbox --remote --json --config $config --command $sql)
 Need ($LASTEXITCODE -eq 0) 'Read-only D1 checkpoint unavailable.'
 $rows=@(ConvertFrom-Json -InputObject ($output -join [Environment]::NewLine))
 Need ($rows.Count -eq 1 -and $rows[0].success -eq $true -and @($rows[0].results).Count -eq 1) 'Unexpected D1 checkpoint results.'
 $row=$rows[0].results[0]
 Need ($row.state -eq 'Live' -and $null -eq $row.reason_code -and
  $row.merge_sha -eq 'f124386bebfe481ecfc1dbd5bf625f24df5823ff') 'Last verified private sandbox receipt drift; STOP.'
}
Push-Location $root
try {
 Need ((& git branch --show-current).Trim() -ceq 'feature/fish118-p3-mock-publisher') 'Unexpected development branch.'
 $actual=(& git rev-parse HEAD).Trim()
 Need ($LASTEXITCODE -eq 0 -and $actual -ceq $ExpectedHead) 'Source HEAD does not match approved operator input.'
 Need (@(& git status --porcelain --untracked-files=no).Count -eq 0) 'Tracked source checkout is dirty.'
 & git merge-base --is-ancestor $baseline HEAD
 Need ($LASTEXITCODE -eq 0 -and $actual -cne $baseline) 'Expected merged polling source not present.'
 $changed=@(& git diff --name-only $baseline HEAD)
 Need ($LASTEXITCODE -eq 0 -and $changed.Count -eq 2) 'Unexpected source scope since polling merge.'
 foreach($path in @(
  'experiments/p3/preview/tools/prepare-d3-poll-2s-private.ps1',
  'pwa/test/fish118-poll-private-preflight.test.mjs'
 )){Need ($changed -contains $path) ('Preflight source path missing: '+$path)}
 Need ($ExpectedWorkerVersion -ceq $deployedVersion) 'Owner-pinned previous Worker version differs from approved version.'
 Need (Test-Path -LiteralPath $sourceConfig) 'Previously deployed private config missing; do not fabricate or select another.'
 foreach($path in @($sourceConfig,$candidateConfig)){
  & git check-ignore -q -- $path
  Need ($LASTEXITCODE -eq 0) 'Private configuration must be Git-ignored.'
 }
 $source=[IO.File]::ReadAllText($sourceConfig)
 $sourceHash=(Get-FileHash -LiteralPath $sourceConfig -Algorithm SHA256).Hash
 Need ($source -notmatch 'REPLACE_WITH_') 'Unfilled private configuration placeholder.'
 foreach($rule in @(
  '"name"\s*:\s*"fishing-auth-p0-test"',
  '"main"\s*:\s*"src/d3-owner-runtime\.mjs"',
  '"APP_ORIGIN"\s*:\s*"https://fishing-auth-p0-test\.ginosega\.workers\.dev"',
  '"D3_SANDBOX_REPO_ID"\s*:\s*"1430581407"',
  '"keep_vars"\s*:\s*true',
  '"workers_dev"\s*:\s*true',
  '"preview_urls"\s*:\s*false',
  '"D3_PILOT_ENABLED"\s*:\s*"true"',
  '"D3_READ_TOKENS_ENABLED"\s*:\s*"true"',
  '"D3_WRITE_ENABLED"\s*:\s*"true"',
  '"D3_RUNNER_ENABLED"\s*:\s*"true"',
  '"D3_TEST_HOST_ENABLED"\s*:\s*"true"',
  '"D4_MEDIA_ENABLED"\s*:\s*"true"',
  '"D3_FAST_WEBHOOK_ENABLED"\s*:\s*"true"',
  '"D3_FAST_WATCHDOG_ENABLED"\s*:\s*"true"',
  '"D3_FAST_TRACE_ENABLED"\s*:\s*"true"',
  '"binding"\s*:\s*"DB"',
  '"binding"\s*:\s*"OPERATIONS_DB"',
  '"database_name"\s*:\s*"fishing-auth-p0"',
  '"database_name"\s*:\s*"fishing-p3-sandbox"',
  '"crons"\s*:\s*\[\s*"\*/5 \* \* \* \*"\s*\]'
 )){Once $source $rule $rule}
 foreach($flag in @('D2_WRITE_ENABLED','D2_RUNNER_ENABLED','D2_READ_TOKENS_ENABLED','D2_TEST_HOST_ENABLED')){
  Once $source ('"'+$flag+'"\s*:\s*"false"') $flag
 }
 $integrated=[regex]::Matches($source,'"D3_INTEGRATED_PWA_ENABLED"\s*:\s*"([^"]*)"')
 Need ($integrated.Count -le 1 -and ($integrated.Count -eq 0 -or
  $integrated[0].Groups[1].Value -ceq 'false')) 'Private pilot must not activate integrated public V3.'
 foreach($secret in @('D2_CSRF_KEY','D2_GITHUB_APP_PRIVATE_KEY','GITHUB_CLIENT_SECRET','D3_FAST_WEBHOOK_SECRET')){
  Need ($source -notmatch ('"'+$secret+'"\s*:')) 'Secret declared as plaintext configuration value.'
 }
 Need ([regex]::Matches($source,'"database_id"\s*:\s*"[a-f0-9-]{36}"').Count -eq 2) 'Private D1 database bindings drifted.'
 $pilotMatch=[regex]::Matches($source,'"D3_PILOT_SHA256"\s*:\s*"([a-f0-9]{64})"')
 $cssMatch=[regex]::Matches($source,'"D3_PILOT_CSS_SHA256"\s*:\s*"([a-f0-9]{64})"')
 Need ($pilotMatch.Count -eq 1 -and $cssMatch.Count -eq 1) 'Private asset digest fields missing or duplicated.'
 Need ($pilotMatch[0].Groups[1].Value -ceq $oldJs) 'Existing local JS digest is not the owner-deployed previous pilot.'
 Need ($cssMatch[0].Groups[1].Value -ceq $cssHash) 'Existing local CSS digest is not the approved private pilot.'
 Need ([regex]::Matches($source,[regex]::Escape($oldJs)).Count -eq 1) 'Old JS digest appears more than once.'
 Push-Location (Join-Path $root 'pwa')
 try {
  & node tools/build-d3-pilot.mjs --check
  Need ($LASTEXITCODE -eq 0) 'Private pilot JS/CSS build failed.'
  & node tools/verify-d3-windows-eol.mjs
  Need ($LASTEXITCODE -eq 0) 'Windows generated-byte reproducibility failed.'
  & node tools/verify-d3-csp.mjs
  Need ($LASTEXITCODE -eq 0) 'Strict-CSP validation failed.'
  & node tools/verify-d3-runtime.mjs
  Need ($LASTEXITCODE -eq 0) 'Private runtime source validation failed.'
 }finally {Pop-Location}
 $meta=Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
 Need ($meta.format -eq 'fishing-d3-pilot-local-build-v1' -and
  $meta.sha256 -ceq $newJs -and $meta.cssSha256 -ceq $cssHash -and
  $meta.bytes -eq 345213 -and $meta.cssBytes -eq 27172) 'New pilot bundle differs from exact-head CI evidence.'
 foreach($artifact in @(@($jsPath,$newJs,$meta.bytes),@($cssPath,$cssHash,$meta.cssBytes))){
  Need (Test-Path -LiteralPath $artifact[0]) 'Generated private asset missing.'
  Need ((Get-FileHash -LiteralPath $artifact[0] -Algorithm SHA256).Hash.ToLowerInvariant() -ceq $artifact[1]) 'Generated asset SHA-256 mismatch.'
  Need ((Get-Item -LiteralPath $artifact[0]).Length -eq $artifact[2]) 'Generated asset size mismatch.'
 }
 $oldField=$pilotMatch[0].Groups[1]
 $candidate=$source.Substring(0,$oldField.Index)+$newJs+
  $source.Substring($oldField.Index+$oldField.Length)
 Need ($candidate.Replace($newJs,$oldJs) -ceq $source) 'Unexpected candidate config change.'
 if(Test-Path -LiteralPath $candidateConfig){
  Need ([IO.File]::ReadAllText($candidateConfig) -ceq $candidate) 'Prepared candidate config differs; STOP.'
 }else{
  [IO.File]::WriteAllText($candidateConfig,$candidate,(New-Object Text.UTF8Encoding($false)))
 }
 Push-Location $preview
 try {
  $before=WorkerVersion
  Need ($before -ceq $ExpectedWorkerVersion) 'Remote Worker version changed; STOP.'
  PrivateProof
  CompletedD1Proof $sourceConfig
  $v2Before=PublicDigest
  $out=Join-Path $env:TEMP ('fishing-poll2-preflight-'+[guid]::NewGuid().ToString('N'))
  try {
   & npx.cmd --yes wrangler@4.153.0 deploy --dry-run --config $candidateConfig --outdir $out
   Need ($LASTEXITCODE -eq 0) 'Private Worker package dry-run failed.'
  }finally {
   if(Test-Path -LiteralPath $out){Remove-Item -LiteralPath $out -Recurse -Force}
  }
  Need ((WorkerVersion) -ceq $before) 'Remote Worker changed during PREPARE; STOP.'
  Need ((PublicDigest) -ceq $v2Before) 'Public V2 proxy drift during PREPARE; STOP.'
  PrivateProof
  Need ((Get-FileHash -LiteralPath $sourceConfig -Algorithm SHA256).Hash -ceq $sourceHash) 'Existing private config mutated.'
  Need (@(& git status --porcelain --untracked-files=no).Count -eq 0) 'Tracked source changed during PREPARE.'
  Write-Output ('PASS: PRIVATE V3 POLL-2S PREPARED ONLY; existing Worker '+$before)
  Write-Output ('SOURCE_HEAD: '+$actual)
  Write-Output ('OLD_PRIVATE_JS_SHA256: '+$oldJs)
  Write-Output ('NEW_PRIVATE_JS_SHA256: '+$newJs)
  Write-Output ('PRIVATE_CSS_SHA256_UNCHANGED: '+$cssHash)
  Write-Output ('CANDIDATE_CONFIG: '+$candidateConfig)
  Write-Output 'No Worker, D1, GitHub, Cron, secret, public V2, or publishing write was performed.'
  Write-Output 'STOP: a separately reviewed, owner-approved deployment is required.'
 }finally {Pop-Location}
}finally {Pop-Location}
