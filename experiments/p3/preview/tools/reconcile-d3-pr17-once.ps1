# FISH118 D3: one-time post-GitHub-merge D1 receipt reconciliation.
# The private sandbox PR is ALREADY merged. This NEVER invokes a GitHub
# mutation, deploys a Worker, or replays any accepted authoring operation.
# PRECONDITION: Independently verify PR #17 was squash-merged, private main
# is the exact merge commit, only Gear/gear.json changed, and exact-head CI
# run 40565214328 passed. Source reviewer checked via connected GitHub.
param(
 [Parameter(Mandatory=$true)][string]$ExpectedHead,
 [switch]$ReconcileVerifiedD3Merge
)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$op='p3_10a266d9-87c9-4dae-8293-abc942e99007'
$d2='p3_343ef7ba-1c87-4d5d-a2ad-92e91eab420f'
$repo=1430581407
$owner=265665562
$base='89be79a9c933dd36bd909edd585091232831c835'
$head='74e463e692d89b7a0b93efbcae51a58f8efff486'
$merged='7418cc15e5e392b6e52a48eb533804a5055ca8d7'
$workflow=40565214328
$config=Join-Path (Split-Path $PSScriptRoot -Parent) 'wrangler.d3-sandbox-write.local.jsonc'
$root=(Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
if(-not $ReconcileVerifiedD3Merge){throw 'Explicit one-time D3 reconciliation switch required.'}
if($ExpectedHead -notmatch '^[a-f0-9]{40}$'){throw 'Expected exact Git SHA required.'}
Push-Location $root
try{
 $actual=(& git rev-parse HEAD).Trim()
 if($LASTEXITCODE -ne 0 -or $actual -ne $ExpectedHead){
  throw 'Unexpected checked-out Git commit. No D1 write.'
 }
 $branch=(& git branch --show-current).Trim()
 if($LASTEXITCODE -ne 0 -or $branch -ne 'feature/fish118-p3-mock-publisher'){
  throw 'Wrong Git branch. No D1 write.'
 }
 $dirty=@(& git status --porcelain --untracked-files=no)
 if($LASTEXITCODE -ne 0 -or $dirty.Count -gt 0){
  throw 'Tracked local changes present. No D1 write.'
 }
}finally{Pop-Location}
if(-not (Test-Path -LiteralPath $config)){throw 'Missing reviewed D3 Wrangler configuration.'}
function ReadD1([string]$statement){
 $out=@(& npx.cmd --yes wrangler@4.153.0 d1 execute fishing-p3-sandbox --remote --json --config $config --command $statement)
 if($LASTEXITCODE -ne 0){throw 'D1 read failed (or write outcome uncertain). DO NOT RETRY.'}
 try{$decoded=ConvertFrom-Json -InputObject ($out -join [Environment]::NewLine)}
 catch{throw 'Could not parse D1 JSON. DO NOT RETRY if writing was attempted.'}
 $blocks=@($decoded)
 if($blocks.Count -ne 1 -or $blocks[0].success -ne $true){
  throw 'D1 result not exactly one success. DO NOT RETRY.'
 }
 return @($blocks[0].results)
}
function VerifyD2($row){
 if($row.operation_id -ne $d2 -or [int64]$row.github_id -ne $owner -or
  [int64]$row.repo_id -ne $repo -or $row.state -ne 'Live' -or
  [int64]$row.pr_number -ne 16 -or
  $row.merge_sha -ne $base -or
  $row.verified_release_id -ne '73362eb77bd59219aa6f78fb93e9d47b' -or
  $null -ne $row.reason_code){
  throw 'Completed D2 operation deviates from immutable verified proof.'
 }
}
$sqlRead="SELECT operation_id,github_id,repo_id,state,reason_code,pr_number,pr_head_sha,main_base_sha,merge_sha,workflow_run_id,verified_release_id,lease_owner,lease_expires_at,updated_at FROM p3_operations WHERE operation_id IN ('$op','$d2') ORDER BY operation_id;"
$before=@(ReadD1 $sqlRead)
if($before.Count -ne 2){throw 'Expected exactly two recognized operation receipts.'}
$d2row=@($before | Where-Object operation_id -eq $d2)
$target=@($before | Where-Object operation_id -eq $op)
if($d2row.Count -ne 1 -or $target.Count -ne 1){
 throw 'D1 returned unexpected operation set.'
}
VerifyD2 $d2row[0]
$t=$target[0]
if($t.operation_id -ne $op -or [int64]$t.github_id -ne $owner -or
 [int64]$t.repo_id -ne $repo -or $t.state -ne 'Merging' -or
 $t.reason_code -ne 'merge_attempted' -or
 [int64]$t.pr_number -ne 17 -or $t.pr_head_sha -ne $head -or
 $t.main_base_sha -ne $base -or $null -ne $t.merge_sha -or
 [int64]$t.workflow_run_id -ne $workflow -or
 $null -ne $t.verified_release_id -or
 $null -eq $t.lease_expires_at -or
 [int64]$t.lease_expires_at -gt [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()){
 throw 'D3 reconciliation preconditions failed. No D1 write.'
}
Write-Output 'PASS: Read-only D1 exact D2/D3 receipts, expired lease, and immutable merge evidence.'
# Atomic compare-and-swap with no second merge: the only allowed mutation.
# The migration 0002 guarded transition and audit trigger fire automatically.
$sqlUpdate="UPDATE p3_operations SET state='Deploying',reason_code=NULL,merge_sha='$merged',lease_owner=NULL,lease_expires_at=NULL,updated_at=unixepoch() WHERE operation_id='$op' AND github_id=$owner AND repo_id=$repo AND state='Merging' AND reason_code='merge_attempted' AND pr_number=17 AND pr_head_sha='$head' AND main_base_sha='$base' AND merge_sha IS NULL AND workflow_run_id=$workflow AND verified_release_id IS NULL AND lease_expires_at<=unixepoch() AND updated_at=$($t.updated_at) RETURNING operation_id,state,merge_sha,reason_code;"
$applied=@(ReadD1 $sqlUpdate)
if($applied.Count -ne 1 -or $applied[0].operation_id -ne $op -or
 $applied[0].state -ne 'Deploying' -or
 $applied[0].merge_sha -ne $merged -or
 $null -ne $applied[0].reason_code){
 throw 'D1 reconciliation not independently confirmed. DO NOT RETRY.'
}
Write-Output 'PASS: Exactly one D3 operation atomically reconciled to Deploying.'
$after=@(ReadD1 $sqlRead)
if($after.Count -ne 2){throw 'Postflight operation set changed.'}
$checkD2=@($after | Where-Object operation_id -eq $d2)
$checkD3=@($after | Where-Object operation_id -eq $op)
if($checkD2.Count -ne 1 -or $checkD3.Count -ne 1){throw 'Postflight operation identities changed.'}
VerifyD2 $checkD2[0]
$c=$checkD3[0]
if($c.merge_sha -ne $merged -or $null -ne $c.reason_code -or
 @('Deploying','Verifying','Live') -notcontains $c.state){
 throw 'Postflight D3 state incorrect. DO NOT RETRY.'
}
Write-Output ('D3_RECONCILED_STATE: '+$c.state)
Write-Output ('D3_RECONCILED_MERGE_SHA: '+$c.merge_sha)
Write-Output 'PASS: D2 unchanged, private D3 merge committed in D1; scheduler can resume.'
Write-Output 'ONE TIME ONLY. Do not rerun this script after it reports PASS.'
