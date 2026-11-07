# D5 existing private Worker update. PREPARE by default; -Deploy requires new owner approval.
# Rebind ONLY the owner Pages origin; preserve prior ignored config, D3 pilot and secrets.
param(
 [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{40}$')][string]$ExpectedHead,
 [Parameter(Mandatory=$true)][long]$ExpectedCiRun,
 [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9-]{36}$')][string]$ExpectedWorkerVersion,
 [Parameter(Mandatory=$true)][ValidatePattern('^https://[a-f0-9]{8,32}\.fishing-v3-owner-d5-test\.pages\.dev$')][string]$PreviousPagesOrigin,
 [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{32}$')][string]$ExpectedPreviousRelease,
 [Parameter(Mandatory=$true)][ValidatePattern('^https://[a-f0-9]{8,32}\.fishing-v3-owner-d5-test\.pages\.dev$')][string]$NewPagesOrigin,
 [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{32}$')][string]$ExpectedNewRelease,
 [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{64}$')][string]$ExpectedPublicV2Digest,
 [Parameter(Mandatory=$true)][string]$PreviousConfig,
 [Parameter(Mandatory=$true)][string]$PreviousGeneratedDir,
 [switch]$Deploy
)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$repo=(Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
$preview=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$worker='fishing-auth-p0-test'
$private='https://fishing-auth-p0-test.ginosega.workers.dev'
$scope='/fishing/__v3_owner_candidate__/'
$newConfig=Join-Path $preview 'wrangler.d5-owner-update.local.jsonc'
$marker=Join-Path $env:TEMP ('fishing-d5-owner-worker-update-'+$ExpectedHead+'-'+$ExpectedWorkerVersion+'.attempt')
function Need([bool]$ok,[string]$message){if(-not $ok){throw $message}}
function ShaText([string]$s){
 $h=[Security.Cryptography.SHA256]::Create()
 try{return [BitConverter]::ToString($h.ComputeHash([Text.Encoding]::UTF8.GetBytes($s))).Replace('-','').ToLowerInvariant()}
 finally{$h.Dispose()}
}
function GetText([string]$url){
 $r=Invoke-WebRequest -Uri $url -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 45 -Headers @{'Cache-Control'='no-store'}
 Need ([int]$r.StatusCode -eq 200) ('HTTP failure: '+$url)
 return [string]$r.Content
}
function Status([string]$url){
 try{
  $r=Invoke-WebRequest -Uri $url -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 30 -Headers @{'Cache-Control'='no-store'}
  return [int]$r.StatusCode
 }catch{
  if($_.Exception.Response){return [int]$_.Exception.Response.StatusCode}
  throw
 }
}
function ActiveWorker{
 $output=@(& npx.cmd --yes wrangler@4.153.0 deployments status --name $worker)
 Need ($LASTEXITCODE -eq 0) 'Could not inspect current Worker version'
 $m=[regex]::Matches(($output -join [Environment]::NewLine),'(?m)\(100%\)\s+([a-f0-9-]{36})')
 Need ($m.Count -eq 1) 'Worker version ambiguous'
 return $m[0].Groups[1].Value
}
function PrivateProof{
 foreach($path in @('/__d3_pilot__/','/__d3_pilot__/pilot.js','/__d3_pilot__/pilot.css')){
  Need ((Status ($private+$path)) -eq 401) ('Private pilot exposed: '+$path)
 }
 Need ((Status ($private+'/session')) -eq 200) 'Private session endpoint unavailable'
 Need ((Status ($private+'/api/v3/operations/latest')) -in @(401,403,404)) 'Anonymous operations exposed'
}
function VerifyPointer([string]$origin,[string]$release,[string]$source){
 $pointer=GetText ($origin+$scope+'release.json') | ConvertFrom-Json
 Need ($pointer.id -ceq $release) ('Release mismatch at '+$origin)
 if($source){Need ($pointer.sourceRevision -ceq $source) ('Source mismatch at '+$origin)}
 return (GetText ($origin+$scope+'release.json'))
}
Need ($PreviousPagesOrigin -cne $NewPagesOrigin) 'Must pin distinct old/new immutable Pages releases'
$previousPath=(Resolve-Path -LiteralPath $PreviousConfig).Path
$previousAssets=(Resolve-Path -LiteralPath $PreviousGeneratedDir).Path
Need ($previousPath -cne $newConfig -and $previousPath -cmatch 'wrangler\.[a-z0-9.-]+\.local\.jsonc$') 'Previous config must be separate ignored Wrangler file'
Push-Location $repo
try{
 Need ((& git rev-parse HEAD).Trim() -ceq $ExpectedHead -and $LASTEXITCODE -eq 0) 'Unexpected checkout HEAD'
 Need (@(& git status --porcelain --untracked-files=no).Count -eq 0) 'Tracked checkout dirty'
 $up=@(& git ls-remote origin refs/heads/feature/fish118-d5-owner-integration)
 Need ($LASTEXITCODE -eq 0 -and $up.Count -eq 1 -and ($up[0] -split '\s+')[0] -ceq $ExpectedHead) 'Integration branch drift'
 $ci=Invoke-RestMethod -Uri ('https://api.github.com/repos/ginosega/fishing/actions/runs/'+$ExpectedCiRun) -TimeoutSec 35 -Headers @{'User-Agent'='Fishing-D5-Operator';'Accept'='application/vnd.github+json'}
 Need ($ci.head_sha -ceq $ExpectedHead -and $ci.event -ceq 'push' -and $ci.name -ceq 'Fishing P3 isolated source validation' -and $ci.head_branch -ceq 'feature/fish118-d5-owner-integration' -and $ci.status -ceq 'completed' -and $ci.conclusion -ceq 'success') 'Exact-head source CI absent'
 $beforeVersion=ActiveWorker
 Need ($beforeVersion -ceq $ExpectedWorkerVersion) 'Previous Worker version differs from live'
 PrivateProof
 $beforeV2=ShaText (GetText ($private+'/fishing/'))
 Need ($beforeV2 -ceq $ExpectedPublicV2Digest) 'Public V2 proxy digest drift'
 $oldPtr=VerifyPointer $PreviousPagesOrigin $ExpectedPreviousRelease ''
 $privateOldPtr=GetText ($private+$scope+'release.json')
 Need ((ShaText $oldPtr) -ceq (ShaText $privateOldPtr)) 'Worker does not point at previous immutable Pages origin'
 $newPtr=VerifyPointer $NewPagesOrigin $ExpectedNewRelease $ExpectedHead
 $newHtml=GetText ($NewPagesOrigin+$scope)
 $inline=[regex]::Matches($newHtml,'(?s)<script>(.*?)</script>')
 Need ($inline.Count -eq 1 -and $newHtml.Contains('Isolated V3 owner sandbox candidate')) 'Missing unique candidate bootstrap'
 $bootstrapSha=[Security.Cryptography.SHA256]::Create()
 try{$bootstrapBytes=$bootstrapSha.ComputeHash([Text.Encoding]::UTF8.GetBytes($inline[0].Groups[1].Value))}
 finally{$bootstrapSha.Dispose()}
 $bootstrapHash="'sha256-"+[Convert]::ToBase64String($bootstrapBytes)+"'"
 $source=[IO.File]::ReadAllText($previousPath)
 $sourceHash=(Get-FileHash -LiteralPath $previousPath -Algorithm SHA256).Hash
 foreach($pattern in @(
  '"name"\s*:\s*"fishing-auth-p0-test"',
  '"main"\s*:\s*"src/d3-owner-runtime\.mjs"',
  '"keep_vars"\s*:\s*true',
  '"D3_PILOT_ENABLED"\s*:\s*"true"',
  '"D3_WRITE_ENABLED"\s*:\s*"true"',
  '"D5_OWNER_CANDIDATE_ENABLED"\s*:\s*"true"',
  '"D5_STARTUP_DIAGNOSTIC_ENABLED"\s*:\s*"true"',
  '"binding"\s*:\s*"DB"',
  '"binding"\s*:\s*"OPERATIONS_DB"',
  '"workers_dev"\s*:\s*true'
 )){
  Need ([regex]::Matches($source,$pattern).Count -eq 1) ('Previous config unexpected: '+$pattern)
 }
 Need ([regex]::Matches($source,'"database_id"\s*:\s*"[a-f0-9-]{36}"').Count -eq 2) 'D1 bindings differ'
 foreach($secret in @('D2_CSRF_KEY','D2_GITHUB_APP_PRIVATE_KEY','GITHUB_CLIENT_SECRET','D3_FAST_WEBHOOK_SECRET')){
  Need ($source -notmatch ('"'+$secret+'"\s*:')) 'Private secret found in config'
 }
 Need ($source -notmatch 'REPLACE_WITH_') 'Previous config includes placeholders'
 $oldField='"D5_OWNER_PAGES_ORIGIN"'
 $oldValue='"D5_OWNER_PAGES_ORIGIN": "'+$PreviousPagesOrigin+'"'
 Need ([regex]::Matches($source,'"D5_OWNER_PAGES_ORIGIN"\s*:').Count -eq 1) 'Missing/duplicate D5 origin'
 $matches=[regex]::Matches($source,'"D5_OWNER_PAGES_ORIGIN"\s*:\s*"([^"]+)"')
 Need ($matches.Count -eq 1 -and $matches[0].Groups[1].Value -ceq $PreviousPagesOrigin) 'D5 origin differs from expected current config'
 $newText=$matches[0].Value.Replace($PreviousPagesOrigin,$NewPagesOrigin)
 $new=$source.Replace($matches[0].Value,$newText)
 Need ($new.Replace($newText,$matches[0].Value) -ceq $source) 'Unexpected config mutation'
 $pilot=[regex]::Match($source,'"D3_PILOT_SHA256"\s*:\s*"([a-f0-9]{64})"')
 $pilotCss=[regex]::Match($source,'"D3_PILOT_CSS_SHA256"\s*:\s*"([a-f0-9]{64})"')
 Need ($pilot.Success -and $pilotCss.Success) 'Prior pilot hashes missing'
 $generated=Join-Path $preview 'src\generated'
 if(-not (Test-Path -LiteralPath $generated)){New-Item -ItemType Directory -Path $generated | Out-Null}
 foreach($item in @(@('d3-pilot.bundle.txt',$pilot.Groups[1].Value),@('d3-pilot.css.txt',$pilotCss.Groups[1].Value))){
  $from=Join-Path $previousAssets $item[0];$to=Join-Path $generated $item[0]
  Need (Test-Path -LiteralPath $from) ('Missing preserved pilot artifact '+$item[0])
  Need ((Get-FileHash -LiteralPath $from -Algorithm SHA256).Hash.ToLowerInvariant() -ceq $item[1]) ('Original pilot hash mismatch: '+$item[0])
  if(Test-Path -LiteralPath $to){
   Need ((Get-FileHash -LiteralPath $to -Algorithm SHA256).Hash.ToLowerInvariant() -ceq $item[1]) 'Prepared pilot artifact drift'
  }else{Copy-Item -LiteralPath $from -Destination $to}
 }
 & git check-ignore -q -- $newConfig
 Need ($LASTEXITCODE -eq 0) 'New ignored Wrangler config not covered by .gitignore'
 if(Test-Path -LiteralPath $newConfig){
  Need ([IO.File]::ReadAllText($newConfig) -ceq $new) 'Preexisting prepared config differs; stop'
 }else{[IO.File]::WriteAllText($newConfig,$new,(New-Object Text.UTF8Encoding($false)))}
 $dry=Join-Path $env:TEMP ('fishing-d5-owner-worker-dry-'+[guid]::NewGuid().ToString('N'))
 try{
  Push-Location $preview
  try{
   & npx.cmd --yes wrangler@4.153.0 deploy --dry-run --config $newConfig --outdir $dry
   Need ($LASTEXITCODE -eq 0) 'Private Worker dry-run failed'
  }finally{Pop-Location}
 }finally{if(Test-Path $dry){Remove-Item -LiteralPath $dry -Recurse -Force}}
 Need ((ActiveWorker) -ceq $beforeVersion) 'Worker version drift during preflight'
 Need ((ShaText (GetText ($private+'/fishing/'))) -ceq $beforeV2) 'Public V2 drift during preflight'
 Need ((Get-FileHash -LiteralPath $previousPath -Algorithm SHA256).Hash -ceq $sourceHash) 'Previous config changed'
 if(-not $Deploy){
  Write-Output ('PASS: D5 OWNER WORKER UPDATE PREPARED ONLY; VERSION: '+$beforeVersion)
  Write-Output ('EXACT_HEAD: '+$ExpectedHead)
  Write-Output ('NEW_PAGES_RELEASE: '+$ExpectedNewRelease)
  Write-Output ('EXPECTED_BOOTSTRAP_CSP_HASH: '+$bootstrapHash)
  Write-Output ('PREPARED_IGNORED_CONFIG: '+$newConfig)
  Write-Output 'NO DEPLOY, NO D1/SECRET/PUBLIC V2 CHANGE'
 }else{
  Need (-not (Test-Path -LiteralPath $marker)) 'Worker deploy attempt exists; reconcile remotely before retry'
  Need ((ActiveWorker) -ceq $beforeVersion -and (ShaText (GetText ($private+'/fishing/'))) -ceq $beforeV2) 'Pre-deploy baseline changed'
  $file=[IO.File]::Open($marker,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
  try{
   $bytes=[Text.Encoding]::UTF8.GetBytes(('HEAD='+$ExpectedHead+'; WORKER='+$beforeVersion+'; PAGES='+$NewPagesOrigin+'; UTC='+[DateTime]::UtcNow.ToString('o')))
   $file.Write($bytes,0,$bytes.Length)
  }finally{$file.Dispose()}
  Push-Location $preview
  try{
   & npx.cmd --yes wrangler@4.153.0 deploy --config $newConfig
   Need ($LASTEXITCODE -eq 0) 'Worker deploy UNKNOWN; inspect version and marker before any retry'
  }finally{Pop-Location}
  $after=ActiveWorker
  Need ($after -cne $beforeVersion) 'No distinct Worker version; reconcile before retry'
  PrivateProof
  Need ((ShaText (GetText ($private+'/fishing/'))) -ceq $beforeV2) 'Public V2 changed: stop'
  $workerPtr=GetText ($private+$scope+'release.json')
  Need ((ShaText $workerPtr) -ceq (ShaText $newPtr)) 'Private gateway pointer differs from immutable Pages'
  $page=Invoke-WebRequest -Uri ($private+$scope) -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 45 -Headers @{'Cache-Control'='no-store'}
  Need ([int]$page.StatusCode -eq 200 -and [string]$page.Content -ceq $newHtml) 'Worker HTML differs from immutable Pages'
  Need ([string]$page.Headers['Content-Security-Policy'] -match [regex]::Escape($bootstrapHash)) 'Trusted bootstrap CSP hash absent'
  Need ((Status ($private+$scope+'unknown')) -eq 404) 'Owner static route too broad'
  Need ((ShaText (VerifyPointer $PreviousPagesOrigin $ExpectedPreviousRelease '')) -eq (ShaText $oldPtr)) 'Old immutable Pages release altered'
  Write-Output ('PASS: D5 OWNER PRIVATE WORKER UPDATED: '+$after)
  Write-Output ('PREVIOUS_WORKER_VERSION: '+$beforeVersion)
  Write-Output ('NEW_PAGES_ORIGIN: '+$NewPagesOrigin)
  Write-Output ('SOURCE_HEAD: '+$ExpectedHead)
  Write-Output 'OLD PAGES, D3 PILOT, D1 AND PUBLIC V2 PRESERVED; NO PUBLISH TEST'
 }
}finally{Pop-Location}
