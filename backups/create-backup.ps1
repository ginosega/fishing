# Owner-operated read-only content backup. No release upload or retention deletion.
param(
 [ValidateSet('monthly','pre-major')][string]$Kind='monthly',
 [string]$BackupRoot="$HOME\Fishing-Backups",
 [string]$SdkRoot="$HOME\Fishing-Backups\tooling"
)
$ErrorActionPreference='Stop'
Set-Location (Join-Path $PSScriptRoot '..\pwa')
$BackupRoot=[IO.Path]::GetFullPath($BackupRoot)
$SdkRoot=[IO.Path]::GetFullPath($SdkRoot)
$Node=(& node --version).Trim()
if ($LASTEXITCODE -ne 0 -or $Node -notmatch '^v24\.') { throw 'Node.js 24 is required.' }
$Revision=(& git rev-parse HEAD).Trim()
if ($LASTEXITCODE -ne 0 -or $Revision -notmatch '^[a-f0-9]{40}$') { throw 'Cannot identify source revision.' }
if (-not (Test-Path (Join-Path $SdkRoot 'node_modules\@aws-sdk\client-s3'))) { throw 'Install the local backup SDK as described in backups/README.md.' }
$Stamp=Get-Date -Format 'yyyy-MM-dd'
$Name="fishing-backup-$Kind-$Stamp"
New-Item -ItemType Directory -Path $BackupRoot -Force | Out-Null
$Zip=Join-Path $BackupRoot "$Name.zip"
$Work=Join-Path $BackupRoot "$Name-work"
if ((Test-Path $Zip) -or (Test-Path "$Zip.sha256") -or (Test-Path $Work)) { throw 'Backup or work directory already exists; preserve it and inspect before retrying.' }
New-Item -ItemType Directory -Path $Work | Out-Null
$Sql=Join-Path $Work 'content-export.sql'
$Stage=Join-Path $Work 'stage'
Write-Host 'Do not edit fishing content or run media cleanup during backup.'
Write-Host 'STEP 1: Fresh read-only content D1 export'
$OldPreference=$ErrorActionPreference
try {
 $ErrorActionPreference='Continue'
 & npx.cmd --yes wrangler@4.166.0 d1 export fishing-v3-wp3-operations-test --remote --output $Sql 2> (Join-Path $Work 'export-stderr.txt')
 $Code=$LASTEXITCODE
} finally { $ErrorActionPreference=$OldPreference }
if ($Code -ne 0 -or -not (Test-Path $Sql -PathType Leaf)) { throw 'D1 export failed. Inspect local work directory; do not share signed URLs.' }
try {
 Write-Host 'STEP 2: Enter locally held, bucket-scoped read-only R2 credentials'
 $env:FISH_R2_ACCOUNT_ID=Read-Host 'Cloudflare Account ID'
 $env:FISH_R2_ACCESS_KEY_ID=Read-Host 'R2 Access Key ID'
 $Secret=Read-Host 'R2 Secret Access Key' -AsSecureString
 $env:FISH_R2_SECRET_ACCESS_KEY=(New-Object System.Management.Automation.PSCredential('R2',$Secret)).GetNetworkCredential().Password
 Remove-Variable Secret
 Write-Host 'STEP 3: Restore SQL in memory and verify every registered original'
 & node (Join-Path $PSScriptRoot 'prepare.mjs') $Sql $Stage $SdkRoot $Revision
 if ($LASTEXITCODE -ne 0) { throw 'Backup preparation failed; preserve work directory.' }
} finally {
 foreach($NameOfEnv in @('FISH_R2_ACCOUNT_ID','FISH_R2_ACCESS_KEY_ID','FISH_R2_SECRET_ACCESS_KEY')) { Remove-Item "Env:$NameOfEnv" -ErrorAction SilentlyContinue }
}
Write-Host 'STEP 4: Create ZIP and verify exact archive inventory and hashes'
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($Stage,$Zip,[System.IO.Compression.CompressionLevel]::Optimal,$false)
function EntryHash($Entry) {
 $Stream=$Entry.Open()
 $SHA=[System.Security.Cryptography.SHA256]::Create()
 try { return ([BitConverter]::ToString($SHA.ComputeHash($Stream))).Replace('-','') }
 finally { $Stream.Dispose();$SHA.Dispose() }
}
$Archive=[System.IO.Compression.ZipFile]::OpenRead($Zip)
try {
 $Entries=@{}
 foreach($Entry in $Archive.Entries) {
  if($Entry.Name) {
   $Path=$Entry.FullName.Replace('\','/')
   if($Entries.ContainsKey($Path)){throw "Duplicate ZIP entry: $Path"}
   $Entries[$Path]=$Entry
  }
 }
 $Manifest=Get-Content (Join-Path $Stage 'manifest.json') -Raw -Encoding UTF8 | ConvertFrom-Json
 $Images=@($Manifest.images | Where-Object {$null -ne $_})
 $Expected=@('content.sql','manifest.json','README.txt')+@($Images | ForEach-Object {$_.file})
 if($Images.Count -ne $Manifest.imageCount -or $Entries.Count -ne ($Images.Count+3) -or @($Expected | Sort-Object -Unique).Count -ne $Expected.Count -or (Compare-Object $Expected @($Entries.Keys))){throw 'Unexpected ZIP inventory.'}
 foreach($Path in @('content.sql','manifest.json','README.txt')){
  if((EntryHash $Entries[$Path]) -ne (Get-FileHash (Join-Path $Stage $Path) -Algorithm SHA256).Hash){throw "ZIP mismatch: $Path"}
 }
 if((EntryHash $Entries['content.sql']) -ne $Manifest.database.sha256 -or (Get-FileHash $Sql -Algorithm SHA256).Hash -ne $Manifest.database.sha256){throw 'SQL digest mismatch.'}
 $Total=[long]0
 foreach($Image in $Images){
  $Entry=$Entries[$Image.file]
  if($null -eq $Entry -or $Entry.Length -ne $Image.bytes -or (EntryHash $Entry) -ne $Image.sha256){throw "ZIP image mismatch: $($Image.file)"}
  $Total+=$Entry.Length
 }
 if($Total -ne $Manifest.imageBytes){throw 'Image byte count mismatch.'}
}finally{$Archive.Dispose()}
$Hash=(Get-FileHash $Zip -Algorithm SHA256).Hash
$Hash | Set-Content -LiteralPath "$Zip.sha256" -Encoding ASCII
Write-Host 'LOCAL RECOVERY BACKUP PASS'
Write-Host "Archive: $Zip"
Write-Host "Archive bytes: $((Get-Item $Zip).Length)"
Write-Host "Archive SHA256: $Hash"
Write-Host "Originals: $($Manifest.imageCount); bytes: $Total"
Write-Host 'Review archive contents before publishing to the public repository. No remote mutation or upload performed.'
Write-Host "Work files retained at $Work until independent download verification and approved local cleanup."
