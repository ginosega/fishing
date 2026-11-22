# Approved M02 private-only deployment of the Fishing Companion test Worker.
# Run on the owner's Windows PC; Cloudflare credentials stay local.
# -Deploy is required to publish. Without it, only local + D1 preflights run.
param(
 [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{40}$')]
 [string]$ExpectedRevision,
 [switch]$Deploy
)
$ErrorActionPreference='Stop'
Set-Location (Split-Path -Parent $PSScriptRoot) -ErrorAction Stop
function Check-Exit([string]$Name){
 if($LASTEXITCODE -ne 0){throw "$Name failed (exit $LASTEXITCODE). Stop; do not blindly rerun."}
}
function Require-Equal($Actual,$Expected,[string]$Name){
 if($Actual -ne $Expected){throw "Unexpected $Name. Stop."}
}
$Head=(& git rev-parse HEAD).Trim()
Check-Exit 'Source revision'
Require-Equal $Head $ExpectedRevision 'source revision'
$Changes=@(& git status --porcelain --untracked-files=no)
Check-Exit 'Git status'
if($Changes.Count -ne 0){throw 'Tracked source modifications detected; stop.'}
$ConfigFile='wrangler.direct-gear-private.jsonc'
$Config=Get-Content $ConfigFile -Raw | ConvertFrom-Json
$Origin='https://fishing-d6-wp2-test.ginosega.workers.dev'
Require-Equal $Config.name 'fishing-d6-wp2-test' 'Worker name'
Require-Equal $Config.main './server/d6-direct-gear-worker.mjs' 'Worker script'
Require-Equal $Config.vars.D6_ORIGIN $Origin 'private origin'
Require-Equal $Config.vars.D6_M02_MEDIA_ENABLED 'true' 'owner-approved M02 flag'
Require-Equal $Config.workers_dev $true 'private workers.dev host'
if($null -ne $Config.routes){throw 'Public routes are not permitted.'}
if(@($Config.r2_buckets).Count -ne 1){throw 'Unexpected R2 binding count.'}
Require-Equal $Config.r2_buckets[0].binding 'MEDIA_R2' 'R2 binding'
Require-Equal $Config.r2_buckets[0].bucket_name 'fishing-v3-owner-media-test' 'private R2 bucket'
if(@($Config.d1_databases).Count -ne 2){throw 'Unexpected D1 bindings.'}
Require-Equal $Config.d1_databases[0].binding 'AUTH_DB' 'AUTH_DB binding'
Require-Equal $Config.d1_databases[0].database_id '0d8da698-87b8-4b5e-a1e7-fe6de49e5afc' 'AUTH_DB id'
Require-Equal $Config.d1_databases[1].binding 'WP3_DB' 'WP3_DB binding'
Require-Equal $Config.d1_databases[1].database_id '5a47841e-7874-4ec8-9fa8-be0315f6a802' 'WP3_DB id'
foreach($flag in @('D6_SOURCE_ENABLED','D6_READ_TOKEN_ENABLED','D6_SIGNER_ENABLED')){
 Require-Equal $Config.vars.$flag 'false' "$flag still OFF"
}
if(@($Config.assets.run_worker_first) -notcontains '/api/*'){
 throw 'Private API routing is missing.'
}
$Node=(& node --version).Trim()
Check-Exit 'Node version'
if($Node -notmatch '^v24\.'){throw "Node.js 24 is required; found $Node."}
if(-not (Test-Path 'node_modules\esbuild') -or -not (Test-Path 'node_modules\sharp')){
 & npm ci --no-audit --no-fund
 Check-Exit 'Local dependency installation'
}
$Output=Join-Path (Get-Location).Path 'dist-v3-pilot'
$Args=@(
 'tools/build.mjs',
 '--base=/fishing/',
 "--out=$Output",
 "--source=$((Get-Location).Path)",
 "--source-revision=$ExpectedRevision",
 '--d6-reader-candidate',
 '--d6-wp2-hosted-candidate',
 '--d6-owner-connection-candidate',
 '--d6-owner-editor-preview',
 '--d6-direct-gear-save',
 '--d6-direct-kb-save',
 '--d6-direct-catch-save',
 '--d6-owner-media-upload'
)
& node @Args
Check-Exit 'M02 private UI build'
& node tools/verify.mjs "--out=$Output"
Check-Exit 'M02 immutable release verification'
$Release=Get-Content (Join-Path $Output 'release.json') -Raw | ConvertFrom-Json
Require-Equal $Release.sourceRevision $ExpectedRevision 'built source'
$ManifestFile=Join-Path $Output ($Release.manifest.Replace('/','\'))
$Manifest=Get-Content $ManifestFile -Raw | ConvertFrom-Json
Require-Equal $Manifest.releaseId $Release.id 'manifest release ID'
Require-Equal $Manifest.base '/fishing/' 'manifest base'
foreach($flag in @('d6ReaderCandidate','d6Wp2Staging','d6OwnerConnectionCandidate','d6OwnerEditorPreview','d6DirectGearSave','d6DirectKBSave','d6DirectCatchSave','d6OwnerMediaUpload')){
 Require-Equal $Release.$flag $true "release $flag"
 Require-Equal $Manifest.$flag $true "manifest $flag"
}
Require-Equal $Manifest.counts.gear 100 'Gear catalog'
Require-Equal $Manifest.counts.kb 60 'KB catalog'
Require-Equal $Manifest.counts.catches 12 'Catches catalog'
Write-Host 'PASS: Exact private M02 build and immutable release verified.'

# Wrangler dry-run creates no live Worker deployment.
& npx --yes wrangler@4.166.0 deploy --config $ConfigFile --dry-run
Check-Exit 'Wrangler dry-run'
Write-Host 'PASS: Private Worker dry-run. No live changes made.'

# Read-only database guard. No D1 writes or original-image R2 copies.
$Sql="SELECT (SELECT COUNT(*) FROM d6_media_objects) AS objects, (SELECT COUNT(*) FROM d6_media_refs) AS associations, (SELECT COUNT(DISTINCT logical_path) FROM d6_media_refs) AS paths, (SELECT COUNT(*) FROM d6_media_refs WHERE historical=1) AS historical, (SELECT COUNT(*) FROM d6_gear_records) AS gear, (SELECT COUNT(*) FROM d6_kb_records) AS kb, (SELECT COUNT(*) FROM d6_catch_records) AS catches;"
$Raw=@(& npx --yes wrangler@4.166.0 d1 execute fishing-v3-wp3-operations-test --remote --json --command $Sql)
Check-Exit 'Read-only live D1 preflight'
try{$Results=@(ConvertFrom-Json -InputObject ($Raw -join [Environment]::NewLine))}
catch{throw 'Could not parse read-only D1 verification result; no deployment.'}
if($Results.Count -ne 1 -or $Results[0].success -ne $true -or @($Results[0].results).Count -ne 1){
 throw 'Invalid live D1 verification response; no deployment.'
}
$D1=$Results[0].results[0]
foreach($check in @(@('objects',272),@('associations',276),@('paths',265),@('historical',276),@('gear',100),@('kb',60),@('catches',12))){
 $key=$check[0]
 Require-Equal ([int]$D1.$key) ([int]$check[1]) "live D1 $key"
}
Write-Host 'PASS: Live D1 media/content preflight (read-only).'

if(-not $Deploy){
 Write-Host 'M02 PRIVATE PREFLIGHT PASS. No deployment performed.'
 exit 0
}
Write-Host 'DEPLOY: Approved M02 private test Worker only.'
& npx --yes wrangler@4.166.0 deploy --config $ConfigFile
Check-Exit 'Approved private M02 deployment'
Write-Host 'PASS: Wrangler private deployment completed.'

# Read-only hosted acceptance: exact release and anonymous media denial.
$Remote=Invoke-RestMethod -Uri "$Origin/fishing/release.json?m02=$($Release.id)" -Headers @{'Cache-Control'='no-cache'}
Require-Equal $Remote.id $Release.id 'hosted release ID'
Require-Equal $Remote.sourceRevision $ExpectedRevision 'hosted source'
Require-Equal $Remote.d6OwnerMediaUpload $true 'hosted media flag'
Write-Host 'PASS: Hosted private release pointer matches M02 source.'
$Status=0
try{
 $Answer=Invoke-WebRequest -Uri "$Origin/api/v3/media/manifest" -UseBasicParsing -MaximumRedirection 0
 $Status=[int]$Answer.StatusCode
}catch{
 if($null -eq $_.Exception.Response){throw}
 $Status=[int]$_.Exception.Response.StatusCode
}
Require-Equal $Status 403 'unauthenticated media protection'
Write-Host 'PASS: Private manifest denies anonymous requests (403).'
Write-Host 'M02 PRIVATE DEPLOYMENT SMOKE PASS; owner browser acceptance remains.'
