# FISH118 D4 FINAL AUDIT — READ-ONLY. No deploy, mutation, token output, or retry.
# Execute only from the private Windows operator checkout with existing gitignored config.
param(
 [string]$Config = '.\wrangler.d4-catch-edit-pilot.local.jsonc'
)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$preview=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$root=(Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
function Need([bool]$ok,[string]$message){
 if(-not $ok){throw $message}
}
Push-Location $root
try {
 $branch=(& git branch --show-current).Trim()
 Need ($LASTEXITCODE -eq 0 -and $branch -eq 'feature/fish118-p3-mock-publisher') 'Unexpected source branch'
 Push-Location $preview
 try {
  $configPath=Join-Path $preview $Config
  Need (Test-Path -LiteralPath $configPath) 'Private operator config missing; no audit performed'
  $sql="SELECT operation_id,state,reason_code,merge_sha,pr_number FROM p3_operations WHERE operation_id IN ('p3_74f99e36-9c19-475f-addb-ecc61b500721','p3_20174f48-bdbf-4103-8dc7-2444df9b63b8','p3_48371ff3-0c18-4202-af57-d9b907e9d674') ORDER BY operation_id;"
  $raw=@(& npx.cmd --yes wrangler@4.153.0 d1 execute fishing-p3-sandbox --remote --json --config $configPath --command $sql)
  Need ($LASTEXITCODE -eq 0) 'Remote D1 read-only query failed'
  $results=@(ConvertFrom-Json -InputObject ($raw -join [Environment]::NewLine))
  Need ($results.Count -eq 1 -and $results[0].success -eq $true) 'Unexpected remote query wrapper'
  $rows=@($results[0].results)
  Need ($rows.Count -eq 3) 'Expected exactly three private D4 operation receipts'
  $expected=@{
   'p3_74f99e36-9c19-475f-addb-ecc61b500721'=@{pr=35;sha='8ca5f95ea778f58366d3a6adfad0e2146e363406';state='Live'}
   'p3_20174f48-bdbf-4103-8dc7-2444df9b63b8'=@{pr=37;sha='c93da0a79ae37c243b6bd0f32f8cb9b484c5a40b';state='Live'}
   'p3_48371ff3-0c18-4202-af57-d9b907e9d674'=@{pr=36;sha=$null;state='Failed'}
  }
  foreach($row in $rows){
   $id=[string]$row.operation_id
   Need $expected.ContainsKey($id) 'Unexpected operation identity'
   $want=$expected[$id]
   Need ($row.pr_number -eq $want.pr) ('Unexpected PR number for '+$id)
   Need ($row.merge_sha -eq $want.sha) ('Unexpected merge receipt for '+$id)
   if($want.state -eq 'Live'){
    Need ($row.state -eq 'Live' -and $null -eq $row.reason_code) ('Verified Live D1 receipt differs for '+$id)
   }else{
    Need (@('Failed','Conflict').Contains([string]$row.state)) ('Expected terminal failed CI receipt for '+$id)
   }
   Write-Output ('PASS D1 '+$row.pr_number+' '+$row.state)
  }
  Write-Output 'PASS: all three D4 durable receipts reconcile to GitHub PR #35/#36/#37'
  Write-Output 'NOTE: D1 success is NOT a substitute for separately checking hosted original bytes.'
 }finally{Pop-Location}
}finally{Pop-Location}
