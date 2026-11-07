# D5 existing-project Pages candidate update; PREPARE by default, never public V2.
# -Deploy is a separate, one-attempt, owner-authorized action.
param(
 [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{40}$')][string]$ExpectedHead,
 [Parameter(Mandatory=$true)][long]$ExpectedCiRun,
 [Parameter(Mandatory=$true)][ValidatePattern('^https://[a-f0-9]{8,32}\.fishing-v3-owner-d5-test\.pages\.dev$')][string]$PreviousPagesOrigin,
 [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{32}$')][string]$ExpectedPreviousRelease,
 [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9-]{36}$')][string]$ExpectedWorkerVersion,
 [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{64}$')][string]$ExpectedPublicV2Digest,
 [ValidatePattern('^[a-f0-9]{32}$')][string]$ExpectedNewRelease,
 [switch]$Deploy
)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$repo=(Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
$project='fishing-v3-owner-d5-test'
$worker='fishing-auth-p0-test'
$private='https://fishing-auth-p0-test.ginosega.workers.dev'
$scope='/fishing/__v3_owner_candidate__/'
$marker=Join-Path $env:TEMP ('fishing-d5-owner-pages-update-'+$ExpectedHead+'.attempt')
function Need([bool]$ok,[string]$message){if(-not $ok){throw $message}}
function ShaText([string]$s){
 $h=[Security.Cryptography.SHA256]::Create()
 try{return [Convert]::ToHexString($h.ComputeHash([Text.Encoding]::UTF8.GetBytes($s))).ToLowerInvariant()}
 finally{$h.Dispose()}
}
function GetText([string]$url){
 $r=Invoke-WebRequest -Uri $url -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 45 -Headers @{'Cache-Control'='no-store'}
 Need ([int]$r.StatusCode -eq 200) ('HTTP not 200: '+$url)
 return [string]$r.Content
}
function ActiveWorker{
 $lines=@(& npx.cmd --yes wrangler@4.153.0 deployments status --name $worker)
 Need ($LASTEXITCODE -eq 0) 'Cannot read active private Worker version'
 $match=[regex]::Matches(($lines -join [Environment]::NewLine),'(?m)\(100%\)\s+([a-f0-9-]{36})')
 Need ($match.Count -eq 1) 'Worker version ambiguous'
 return $match[0].Groups[1].Value
}
function ProofBaseline{
 Need ((ActiveWorker) -ceq $ExpectedWorkerVersion) 'Worker version drift; STOP'
 Need ((ShaText (GetText ($private+'/fishing/'))) -ceq $ExpectedPublicV2Digest) 'Public V2 proxy digest drift'
 $old=GetText ($PreviousPagesOrigin+$scope+'release.json') | ConvertFrom-Json
 Need ($old.id -ceq $ExpectedPreviousRelease) 'Previous immutable Pages release differs'
}
Push-Location $repo
try{
 Need ((& git rev-parse HEAD).Trim() -ceq $ExpectedHead -and $LASTEXITCODE -eq 0) 'Unexpected checkout HEAD'
 Need (@(& git status --porcelain --untracked-files=no).Count -eq 0) 'Tracked checkout dirty'
 $up=@(& git ls-remote origin refs/heads/feature/fish118-d5-owner-integration)
 Need ($LASTEXITCODE -eq 0 -and $up.Count -eq 1 -and ($up[0] -split '\s+')[0] -ceq $ExpectedHead) 'Source branch HEAD drift'
 $ci=Invoke-RestMethod -Uri ('https://api.github.com/repos/ginosega/fishing/actions/runs/'+$ExpectedCiRun) -TimeoutSec 35 -Headers @{'User-Agent'='Fishing-D5-Operator';'Accept'='application/vnd.github+json'}
 Need ($ci.head_sha -ceq $ExpectedHead -and $ci.name -ceq 'Fishing P3 isolated source validation' -and $ci.event -ceq 'push' -and $ci.head_branch -ceq 'feature/fish118-d5-owner-integration' -and $ci.status -ceq 'completed' -and $ci.conclusion -ceq 'success') 'Pinned exact-head P3 push CI unavailable'
 ProofBaseline
 $temp=Join-Path $env:TEMP ('fishing-d5-pages-update-'+[guid]::NewGuid().ToString('N'))
 $candidate=Join-Path $temp 'candidate'
 $site=Join-Path $temp 'site'
 Push-Location (Join-Path $repo 'pwa')
 try{
  & npm.cmd ci --no-audit --no-fund
  Need ($LASTEXITCODE -eq 0) 'Locked npm install failed'
  & node tools/build.mjs --base=/fishing/__v3_owner_candidate__/ --v3-reading-mode --v3-owner-candidate "--source-revision=$ExpectedHead" "--out=$candidate"
  Need ($LASTEXITCODE -eq 0) 'V3 owner build failed'
  & node tools/verify.mjs "--out=$candidate"
  Need ($LASTEXITCODE -eq 0) 'All-asset validation failed'
  & node tools/stage-v3-owner-pages.mjs "--candidate=$candidate" "--out=$site" "--expected-source=$ExpectedHead"
  Need ($LASTEXITCODE -eq 0) 'Owner Pages staging failed'
 }finally{Pop-Location}
 $ptr=Get-Content -LiteralPath (Join-Path $candidate 'release.json') -Raw | ConvertFrom-Json
 $manifest=Get-Content -LiteralPath (Join-Path $candidate $ptr.manifest) -Raw | ConvertFrom-Json
 Need ($ptr.sourceRevision -ceq $ExpectedHead -and $manifest.sourceRevision -ceq $ExpectedHead -and $manifest.releaseId -ceq $ptr.id -and $manifest.base -ceq $scope -and $manifest.v3OwnerCandidate -eq $true -and $manifest.files.Count -ge 500) 'Source/release/scope mismatch'
 Need ($ptr.id -cne $ExpectedPreviousRelease) 'Candidate unexpectedly equals older release'
 if($Deploy){
  Need ($ExpectedNewRelease -ceq $ptr.id) 'Deploy must pin release ID from completed prepare'
 }else{
  Write-Output ('PASS: D5 OWNER PAGES UPDATE PREPARED ONLY; NEW_RELEASE_ID: '+$ptr.id)
  Write-Output ('SOURCE_HEAD: '+$ExpectedHead)
  Write-Output ('PREVIOUS_PAGES_ORIGIN: '+$PreviousPagesOrigin)
  Write-Output 'NO DEPLOY, NO CONFIG/WORKER/D1 OR PUBLIC V2 CHANGE'
 }
 if($Deploy){
  Need (-not (Test-Path -LiteralPath $marker)) 'Previous deploy attempt exists; reconcile Pages before any retry'
  ProofBaseline
  # Durable marker BEFORE invoking provider. Retain even if provider times out.
  $stream=[IO.File]::Open($marker,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
  try{
   $bytes=[Text.Encoding]::UTF8.GetBytes(('HEAD='+$ExpectedHead+'; RELEASE='+$ptr.id+'; PREVIOUS='+$PreviousPagesOrigin+'; UTC='+[DateTime]::UtcNow.ToString('o')))
   $stream.Write($bytes,0,$bytes.Length)
  }finally{$stream.Dispose()}
  $output=@(& npx.cmd --yes wrangler@4.153.0 pages deploy $site "--project-name=$project" --branch=d5-owner-test "--commit-hash=$ExpectedHead" --commit-dirty=false 2>&1)
  $code=$LASTEXITCODE
  $output | ForEach-Object {Write-Output $_}
  Need ($code -eq 0) 'Pages upload outcome UNKNOWN; inspect remote project and marker, never blind retry'
  $match=[regex]::Matches(($output -join [Environment]::NewLine),'https://[a-f0-9]{8,32}\.fishing-v3-owner-d5-test\.pages\.dev')
  Need ($match.Count -ge 1) 'Immutable Pages URL uncertain; do not retry'
  $newOrigin=$match[$match.Count-1].Value
  Need ($newOrigin -cne $PreviousPagesOrigin) 'Deployment did not produce a new immutable origin'
  $newPtr=GetText ($newOrigin+$scope+'release.json') | ConvertFrom-Json
  Need ($newPtr.id -ceq $ptr.id -and $newPtr.sourceRevision -ceq $ExpectedHead -and $newPtr.manifestSha256 -ceq $ptr.manifestSha256) 'Hosted release pointer mismatch'
  $samples=@('release.json',[string]$ptr.manifest,'index.html','loader.js','sw.js','manifest.webmanifest','icon.png','icon-maskable.png',
   ('releases/'+$ptr.id+'/app.js'),('releases/'+$ptr.id+'/styles.css'),
   ('releases/'+$ptr.id+'/content/Gear/gear.json'),('releases/'+$ptr.id+'/content/KB/kb.json'),('releases/'+$ptr.id+'/content/Catches/catches.json'))
  $i=0
  foreach($asset in $samples){
   $relative=if($asset -ceq 'index.html'){''}else{$asset}
   $remoteFile=Join-Path $temp ('remote-'+$i+'.bin')
   Invoke-WebRequest -Uri ($newOrigin+$scope+$relative) -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 60 -OutFile $remoteFile -Headers @{'Cache-Control'='no-store'} | Out-Null
   Need ((Get-FileHash -LiteralPath $remoteFile -Algorithm SHA256).Hash -ceq (Get-FileHash -LiteralPath (Join-Path $candidate $asset) -Algorithm SHA256).Hash) ('Hosted byte mismatch: '+$asset)
   $i++
  }
  Need ($i -eq 13) 'Hosted sample check incomplete'
  ProofBaseline
  Write-Output ('PASS: D5 OWNER PAGES EXISTING PROJECT UPDATED; IMMUTABLE_PAGES_ORIGIN: '+$newOrigin)
  Write-Output ('NEW_RELEASE_ID: '+$ptr.id)
  Write-Output ('HOSTED_SAMPLE_HASHES: '+$i+'/13')
  Write-Output ('SOURCE_HEAD: '+$ExpectedHead)
  Write-Output 'WORKER UNCHANGED; DO NOT USE PAGES ORIGIN AS AUTHENTICATED APP'
 }
 Write-Output ('LOCAL_STAGING_FOR_AUDIT: '+$temp)
}finally{Pop-Location}
