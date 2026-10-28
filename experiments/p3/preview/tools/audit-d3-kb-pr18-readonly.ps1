# FISH118 D3: owner-run read-only receipt/audit inspection for recovered KB PR #18.
# No deploy, write API, merge, release or secret output. Uses existing config.
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$preview=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$config=Join-Path $preview 'wrangler.d3-merge-tree-recovery.local.jsonc'
if(-not (Test-Path -LiteralPath $config)){
 throw 'Expected deployed D3 Worker configuration unavailable.'
}
$op='p3_5527208d-a67c-4a2c-876d-9edaee353bc8'
function Query([string]$sql){
 if(-not $sql.TrimStart().StartsWith('SELECT ',[StringComparison]::OrdinalIgnoreCase)){
  throw 'Read-only SELECT required.'
 }
 $result=@(& npx.cmd --yes wrangler@4.153.0 d1 execute fishing-p3-sandbox --remote --json --config $config --command $sql)
 if($LASTEXITCODE -ne 0){throw 'Read-only D1 query failed.'}
 try{$parsed=ConvertFrom-Json -InputObject ($result -join [Environment]::NewLine)}
 catch{throw 'Unexpected D1 JSON response.'}
 $batch=@($parsed)
 if($batch.Count -ne 1 -or $batch[0].success -ne $true){
  throw 'Read-only D1 response not successful.'
 }
 return ,@($batch[0].results)
}
Push-Location $preview
try{
 $operations=Query "SELECT operation_id,state,reason_code,pr_number,pr_head_sha,main_base_sha,merge_sha,workflow_run_id,verified_release_id,lease_owner,lease_expires_at,created_at,updated_at FROM p3_operations WHERE operation_id='$op';"
 if($operations.Count -ne 1){throw 'Missing/ambiguous KB operation.'}
 $row=$operations[0]
 if($row.operation_id -ne $op -or $row.state -ne 'Live' -or
  $null -ne $row.reason_code -or $row.pr_number -ne 18 -or
  $row.pr_head_sha -ne '9276f35348e43a23c72208f3b2134e28554382fd' -or
  $row.main_base_sha -ne '7418cc15e5e392b6e52a48eb533804a5055ca8d7' -or
  $row.merge_sha -ne '97f68efc932084f2e607480c12cee37a94f81758' -or
  $row.workflow_run_id -ne 40600896518 -or
  $row.verified_release_id -notmatch '^[0-9a-f]{32}$' -or
  $null -ne $row.lease_owner -or $null -ne $row.lease_expires_at){
  throw 'KB status/receipt mismatch; do not claim D3 sandbox acceptance.'
 }
 $events=Query "SELECT event_id,event_type,from_state,to_state,event_at,error_code FROM p3_events WHERE operation_id='$op' ORDER BY event_id;"
 if($events.Count -lt 2 -or $events[0].to_state -ne 'Accepted' -or
  $events[$events.Count-1].from_state -ne 'Verifying' -or
  $events[$events.Count-1].to_state -ne 'Live'){
  throw 'D3 KB durable state-transition audit incomplete.'
 }
 if(@($events | Where-Object {$_.to_state -eq 'Failed' -or $_.to_state -eq 'Conflict'}).Count -ne 0){
  throw 'D3 KB audit contains terminal failure or conflict.'
 }
 Write-Output 'PASS: KB PR18 durable operation is Live with exact sandbox merge receipt and verified release identity.'
 Write-Output ('OPERATION_ID: '+$op)
 Write-Output ('MERGE_SHA: '+$row.merge_sha)
 Write-Output ('SANDBOX_VERIFIED_RELEASE_ID: '+$row.verified_release_id)
 Write-Output ('AUDIT_EVENT_COUNT: '+$events.Count)
 Write-Output ('AUDIT_TRANSITIONS: '+(($events | ForEach-Object {$_.to_state}) -join ' -> '))
 Write-Output 'NOTE: This is private sandbox-byte verification, not canonical public V3 Live or a 60-second benchmark.'
}finally{Pop-Location}
