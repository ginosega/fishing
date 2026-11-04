# FISH118 D5 owner test: NEW isolated Pages project only.
# Requires existing local Wrangler login; no public V2 or Worker changes.
# On an ambiguous provider result, STOP; inspect remotely, never blind retry.
param(
 [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{40}$')][string]$ExpectedHead,
 [Parameter(Mandatory=$true)][long]$ExpectedCiRun
)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$project='fishing-v3-owner-d5-test'
$root=(Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
$stage=Join-Path $env:TEMP ('fishing-d5-owner-'+[Guid]::NewGuid().ToString('N'))
$candidate=Join-Path $stage 'candidate'
$site=Join-Path $stage 'site'
function Need([bool]$ok,[string]$message){if(-not $ok){throw $message}}
function HashString([string]$s){
 $h=[Security.Cryptography.SHA256]::Create()
 try{return [BitConverter]::ToString($h.ComputeHash([Text.Encoding]::UTF8.GetBytes($s))).Replace('-','').ToLowerInvariant()}
 finally{$h.Dispose()}
}
Push-Location $root
try{
 Need ((& git rev-parse HEAD).Trim() -ceq $ExpectedHead -and $LASTEXITCODE -eq 0) 'Unexpected checkout HEAD'
 Need (@(& git status --porcelain --untracked-files=no).Count -eq 0) 'Tracked checkout dirty'
 $up=@(& git ls-remote origin refs/heads/feature/fish118-d5-owner-integration)
 Need ($LASTEXITCODE -eq 0 -and $up.Count -eq 1 -and
  ($up[0] -split '\s+')[0] -ceq $ExpectedHead) 'Remote owner source drift'
 $ci=Invoke-RestMethod -Uri ('https://api.github.com/repos/ginosega/fishing/actions/runs/'+$ExpectedCiRun) -Headers @{'User-Agent'='Fishing-D5-Operator';'Accept'='application/vnd.github+json'} -TimeoutSec 30
 Need ($ci.head_sha -ceq $ExpectedHead -and $ci.status -ceq 'completed' -and
  $ci.conclusion -ceq 'success' -and
  $ci.name -ceq 'Fishing P3 isolated source validation' -and
  $ci.head_branch -ceq 'feature/fish118-d5-owner-integration') 'Exact-head isolated CI not successful'
 Push-Location (Join-Path $root 'pwa')
 try{
  & npm.cmd ci --no-audit --no-fund
  Need ($LASTEXITCODE -eq 0) 'Locked npm dependency installation failed'
  & node tools/build.mjs --base=/fishing/__v3_owner_candidate__/ --v3-reading-mode --v3-owner-candidate "--source-revision=$ExpectedHead" "--out=$candidate"
  Need ($LASTEXITCODE -eq 0) 'Owner candidate build failed'
  & node tools/verify.mjs "--out=$candidate"
  Need ($LASTEXITCODE -eq 0) 'Owner candidate all-asset byte verify failed'
  & node tools/stage-v3-owner-pages.mjs "--candidate=$candidate" "--out=$site" "--expected-source=$ExpectedHead"
  Need ($LASTEXITCODE -eq 0) 'Owner candidate Pages staging failed'
 }finally{Pop-Location}
 $release=Get-Content -LiteralPath (Join-Path $candidate 'release.json') -Raw | ConvertFrom-Json
 $manifest=Get-Content -LiteralPath (Join-Path $candidate $release.manifest) -Raw | ConvertFrom-Json
 Need ($manifest.v3OwnerCandidate -eq $true -and $manifest.v3ReaderCandidate -ne $true -and
  $manifest.base -ceq '/fishing/__v3_owner_candidate__/' -and
  $manifest.sourceRevision -ceq $ExpectedHead -and $manifest.files.Count -ge 500) 'Incorrect staged source/release'
 Write-Output ('PASS: local all-byte verification and staging; source '+$ExpectedHead+', assets '+$manifest.files.Count)
 Write-Output 'Creating ONLY the new isolated Cloudflare Pages test project. Existing projects are never overwritten.'
 & npx.cmd --yes wrangler@4.153.0 pages project create $project --production-branch=d5-owner-test
 Need ($LASTEXITCODE -eq 0) 'Pages project creation uncertain. Inspect Cloudflare; do not retry blindly.'
 $out=@(& npx.cmd --yes wrangler@4.153.0 pages deploy $site "--project-name=$project" --branch=d5-owner-test "--commit-hash=$ExpectedHead" --commit-dirty=false 2>&1)
 $status=$LASTEXITCODE
 $out | ForEach-Object {Write-Output $_}
 Need ($status -eq 0) 'Pages deployment uncertain. Inspect Cloudflare; do not retry blindly.'
 $pattern='https://[a-f0-9]{8,32}\.'+[regex]::Escape($project)+'\.pages\.dev'
 $found=[regex]::Matches(($out -join [Environment]::NewLine),$pattern)
 Need ($found.Count -ge 1) 'Could not identify immutable Pages URL; inspect the deployment, do not redeploy.'
 $pagesOrigin=$found[$found.Count-1].Value
 $url=$pagesOrigin+'/fishing/__v3_owner_candidate__/'
 foreach($asset in @('release.json',[string]$release.manifest)){
  $http=Invoke-WebRequest -Uri ($url+$asset) -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 45 -Headers @{'Cache-Control'='no-store'}
  Need ([int]$http.StatusCode -eq 200) 'Hosted owner Pages asset unavailable'
  $local=Get-Content -LiteralPath (Join-Path $candidate $asset) -Raw
  Need ((HashString ([string]$http.Content)) -ceq (HashString $local)) ('Hosted asset byte mismatch: '+$asset)
 }
 Write-Output ('PASS: OWNER PAGES DEPLOYED AND HOSTED VERIFIED: '+$pagesOrigin)
 Write-Output ('SOURCE_HEAD: '+$ExpectedHead)
 Write-Output ('RELEASE_ID: '+$release.id)
 Write-Output ('IMMUTABLE_PAGES_ORIGIN: '+$pagesOrigin)
 Write-Output 'Worker remains unchanged. Do not install Pages URL as the authenticated owner app.'
}finally{
 Pop-Location
 Write-Output ('STAGING_FOLDER_FOR_AUDIT: '+$stage)
}
