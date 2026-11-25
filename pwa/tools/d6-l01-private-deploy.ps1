# A01 standalone V3 private acceptance deployment on the existing test Worker.
# Private acceptance only; public cutover remains separately approved.
# Owner executes with local Cloudflare credentials; GitHub CI cannot deploy.
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
function Require-AtLeast([int]$Actual,[int]$Minimum,[string]$Name){
 if($Actual -lt $Minimum){throw "Missing original M01 $Name. Stop."}
}
$Head=(& git rev-parse HEAD).Trim()
Check-Exit 'Source revision'
Require-Equal $Head $ExpectedRevision 'source revision'
$Changes=@(& git status --porcelain --untracked-files=no)
Check-Exit 'Git status'
if($Changes.Count -ne 0){throw 'Tracked source modifications detected; stop.'}
$ConfigFile='wrangler.l01-private.jsonc'
$Config=Get-Content $ConfigFile -Raw | ConvertFrom-Json
Require-Equal $Config.define.__FISHING_D6_STANDALONE_V3__ 'true' 'canonical V3 Worker build'
$Origin='https://fishing-d6-wp2-test.ginosega.workers.dev'
Require-Equal $Config.name 'fishing-d6-wp2-test' 'Worker name'
Require-Equal $Config.main './server/d6-direct-gear-worker.mjs' 'Worker script'
Require-Equal $Config.vars.D6_ORIGIN $Origin 'private origin'
Require-Equal $Config.vars.D6_M02_MEDIA_ENABLED 'true' 'owner-approved M02 flag'
Require-Equal $Config.vars.D6_M03_THUMBNAILS_ENABLED 'true' 'owner-approved M03 flag'
Require-Equal $Config.vars.D6_O02_OFFLINE_SNAPSHOT_ENABLED 'true' 'owner-approved read-only O02 snapshot flag'
Require-Equal $Config.keep_vars $true 'preserve existing private Worker vars'
Require-Equal $Config.images.binding 'IMAGES' 'owner-approved Images binding'
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
foreach($flag in @('D6_GATEWAY_ENABLED','D6_REPOSITORY_ID','D6_WP2_STAGING_ENABLED','D6_ISOLATED_PAGES_ENABLED','D6_STATIC_ENABLED','D6_SOURCE_ENABLED','D6_READ_TOKEN_ENABLED','D6_SIGNER_ENABLED','D6_HOSTED_PREFLIGHT_ENABLED')){
 if($null -ne $Config.vars.$flag){throw "Obsolete variable $flag must not be configured."}
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
$BuildOptions=@(
 'tools/build.mjs',
 "--out=$Output",
 "--source-revision=$ExpectedRevision"
)
& node @BuildOptions
Check-Exit 'L01 standalone V3 UI build'
& node tools/verify.mjs "--out=$Output"
Check-Exit 'L01 immutable release verification'
$Release=Get-Content (Join-Path $Output 'release.json') -Raw | ConvertFrom-Json
Require-Equal $Release.sourceRevision $ExpectedRevision 'built source'
$ManifestFile=Join-Path $Output ($Release.manifest.Replace('/','\'))
$Manifest=Get-Content $ManifestFile -Raw | ConvertFrom-Json
Require-Equal $Manifest.releaseId $Release.id 'manifest release ID'
Require-Equal $Manifest.base '/fishing/' 'manifest base'
Require-Equal $Manifest.format 'fishing-companion-software-v3' 'standalone V3 format'
if($null -ne $Manifest.counts){throw 'Standalone release must not embed old content counts.'}
if($null -ne $Manifest.cardThumbnails){throw 'Standalone release must not embed historical thumbnails.'}
if(Test-Path (Join-Path $Output ('releases\'+$Release.id+'\content'))){
 throw 'Standalone V3 must not bundle historical content.'
}
foreach($flag in @('d6ReaderCandidate','d6Wp2Staging','d6OwnerConnectionCandidate','d6OwnerEditorPreview','d6DirectGearSave','d6DirectKBSave','d6DirectCatchSave','d6OwnerMediaUpload','d6R2CardThumbnails','d6OfflineContentPreparation','d6OfflineContentReading','standaloneV3')){
 Require-Equal $Release.$flag $true "release $flag"
 Require-Equal $Manifest.$flag $true "manifest $flag"
}
Write-Host 'PASS: Exact L01 software-only V3 release identity verified.'

# Wrangler dry-run creates no live Worker deployment.
& npx --yes wrangler@4.166.0 deploy --config $ConfigFile --dry-run
Check-Exit 'Wrangler dry-run'
Write-Host 'PASS: Private Worker dry-run. No live changes made.'

# Read-only database guard. No D1 writes or original-image R2 copies.
$Sql="SELECT (SELECT COUNT(*) FROM d6_media_objects) AS objects, (SELECT COUNT(*) FROM d6_media_refs) AS associations, (SELECT COUNT(DISTINCT logical_path) FROM d6_media_refs) AS paths, (SELECT COUNT(*) FROM d6_media_refs WHERE historical=1) AS historical, (SELECT COUNT(*) FROM d6_media_refs WHERE historical=0) AS new_refs, (SELECT COUNT(*) FROM d6_gear_records) AS gear, (SELECT COUNT(*) FROM d6_kb_records) AS kb, (SELECT COUNT(*) FROM d6_catch_records) AS catches, (SELECT json_group_array(id) FROM d6_gear_records) AS gear_ids, (SELECT json_group_array(id) FROM d6_kb_records) AS kb_ids, (SELECT json_group_array(id) FROM d6_catch_records) AS catches_ids, (SELECT COUNT(*) FROM d6_gear_records WHERE json_extract(record_json,'$.category')='accessories') AS obsolete_gear, (SELECT COUNT(*) FROM d6_kb_records WHERE json_extract(record_json,'$.type') IS NULL OR json_extract(record_json,'$.type') NOT IN ('locations','species','gear-guides','techniques','knots')) AS obsolete_kb;"
$Raw=@(& npx --yes wrangler@4.166.0 d1 execute fishing-v3-wp3-operations-test --remote --json --command $Sql)
Check-Exit 'Read-only live D1 preflight'
try{$Results=@(ConvertFrom-Json -InputObject ($Raw -join [Environment]::NewLine))}
catch{throw 'Could not parse read-only D1 verification result; no deployment.'}
if($Results.Count -ne 1 -or $Results[0].success -ne $true -or @($Results[0].results).Count -ne 1){
 throw 'Invalid live D1 verification response; no deployment.'
}
$D1=$Results[0].results[0]
# New owner uploads legitimately increase total objects/refs/paths.
# Preserve the verified M01 historical import, not stale exact totals.
foreach($check in @(@('objects',272),@('associations',276),@('paths',265))){
 $key=$check[0]
 Require-AtLeast ([int]$D1.$key) ([int]$check[1]) "live D1 $key"
}
# A verified replacement can retire one historical=1 association and
# insert one historical=0 association for the same Gear record.
# Check the complete refs partition, rather than freezing historic=276.
if(([int]$D1.historical+[int]$D1.new_refs) -ne [int]$D1.associations){
 throw 'Live D1 media association classification mismatch. Stop.'
}
foreach($check in @(@('gear',100),@('kb',60),@('catches',12))){
 $key=$check[0]
 Require-AtLeast ([int]$D1.$key) ([int]$check[1]) "live D1 $key"
}
Write-Host ('PASS: Live D1 media/content preflight (read-only): historical='+
 $D1.historical+' new_refs='+$D1.new_refs+'.')

# Normalized software must not be deployed against the old taxonomy.
$LedgerRaw=& node --input-type=module -e "import {D6_NORMALIZED_IDS} from './src/d6-normalized-id-ledger.mjs'; console.log(JSON.stringify(D6_NORMALIZED_IDS));"
Check-Exit 'Canonical original-ID ledger'
$Ledger=$LedgerRaw | Out-String | ConvertFrom-Json
$Normalized=([int]$D1.obsolete_gear -eq 0 -and [int]$D1.obsolete_kb -eq 0)
Write-Host ('Obsolete categories: gear='+$D1.obsolete_gear+' kb='+$D1.obsolete_kb)
foreach($domain in @('gear','kb','catches')){
 $idField=$domain+'_ids'
 # Windows PowerShell 5.1 emits the decoded JSON array as one pipeline object.
 # Assign first; wrapping ConvertFrom-Json directly in @() can nest that array.
 $DecodedIds=ConvertFrom-Json -InputObject ([string]$D1.$idField)
 $ActualIds=@($DecodedIds)
 if($ActualIds.Count -ne [int]$D1.$domain){throw "Unexpected $domain ID list length. No deployment."}
 $Missing=@($Ledger.$domain | Where-Object {$ActualIds -cnotcontains $_})
 if($Missing.Count -ne 0){$Normalized=$false}
 Write-Host ("Canonical $domain IDs: actual="+$ActualIds.Count+" missing="+$Missing.Count)
}
if(-not $Normalized){
 if($Deploy){throw 'Canonical D1 migration is not verified. No deployment.'}
 Write-Host 'L01 PRIVATE SOFTWARE PREFLIGHT PASS; D1 normalization pending. No deployment performed.'
 exit 0
}
Write-Host 'PASS: Canonical D1 taxonomy and original-ID baseline.'
if(-not $Deploy){
 Write-Host 'L01 PRIVATE PREFLIGHT PASS. No deployment performed.'
 exit 0
}
Write-Host 'DEPLOY: Approved L01 standalone Add/Edit UI to existing private Worker only.'
& npx --yes wrangler@4.166.0 deploy --config $ConfigFile
Check-Exit 'Approved private O03 deployment'
Write-Host 'PASS: Wrangler private deployment completed.'

# Read-only hosted acceptance: exact release and anonymous media denial.
$Remote=Invoke-RestMethod -Uri "$Origin/fishing/release.json?l01=$($Release.id)" -Headers @{'Cache-Control'='no-cache'}
Require-Equal $Remote.id $Release.id 'hosted release ID'
Require-Equal $Remote.sourceRevision $ExpectedRevision 'hosted source'
Require-Equal $Remote.d6OwnerMediaUpload $true 'hosted media flag'
Require-Equal $Remote.d6R2CardThumbnails $true 'hosted M03 thumbnail flag'
Require-Equal $Remote.d6OfflineContentPreparation $true 'hosted O02 content flag'
Require-Equal $Remote.d6OfflineContentReading $true 'hosted O03 reading flag'
Require-Equal $Remote.standaloneV3 $true 'hosted L01 software-only flag'
Write-Host 'PASS: Hosted private release pointer matches L01 source.'
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
# Both anonymous reads must be denied, even after the new route is enabled.
$SnapshotStatus=0
try{
 $Answer=Invoke-WebRequest -Uri "$Origin/api/v3/content/offline-snapshot" -UseBasicParsing -MaximumRedirection 0
 $SnapshotStatus=[int]$Answer.StatusCode
}catch{
 if($null -eq $_.Exception.Response){throw}
 $SnapshotStatus=[int]$_.Exception.Response.StatusCode
}
Require-Equal $SnapshotStatus 403 'unauthenticated O02 snapshot protection'
Write-Host 'PASS: New O02 snapshot denies anonymous requests (403).'
Write-Host 'L01 PRIVATE DEPLOYMENT SMOKE PASS; owner Edge and Android Add/Edit/offline acceptance required.'
