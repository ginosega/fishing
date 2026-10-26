# FISH118 D3: prepare local, hard-disabled Cloudflare Worker configuration.
# SOURCE-ONLY operator preflight. Does NOT deploy, issue a GitHub token,
# write to D1, move a Cloudflare secret or change a repository branch.
# Preserve the verified parked D2 worker as the rollback until D3 acceptance.
$ErrorActionPreference = 'Stop'
$preview = Split-Path -Parent $PSScriptRoot
$repo = (Resolve-Path (Join-Path $preview '..\..\..')).Path
$parked = Join-Path $preview 'wrangler.d2-parked.local.jsonc'
$target = Join-Path $preview 'wrangler.d3-hardoff.local.jsonc'
if (-not (Test-Path -LiteralPath $parked)) {
  throw 'Verified D2 parked local configuration is missing.'
}
if (Test-Path -LiteralPath $target) {
  throw 'A D3 local config already exists. Inspect manually; no overwrite.'
}
$source = [System.IO.File]::ReadAllText($parked)
$expected = @(
 '"name"\s*:\s*"fishing-auth-p0-test"',
 '"main"\s*:\s*"src/d2-live-publisher-worker\.mjs"',
 '"workers_dev"\s*:\s*true',
 '"preview_urls"\s*:\s*false',
 '"keep_vars"\s*:\s*true',
 '"APP_ORIGIN"\s*:\s*"https://fishing-auth-p0-test\.ginosega\.workers\.dev"',
 '"D2_SANDBOX_REPO_ID"\s*:\s*"1430581407"',
 '"D2_GITHUB_APP_ID"\s*:\s*"5436811"',
 '"D2_GITHUB_INSTALLATION_ID"\s*:\s*"174361658"',
 '"binding"\s*:\s*"DB"',
 '"binding"\s*:\s*"OPERATIONS_DB"',
 '"database_name"\s*:\s*"fishing-auth-p0"',
 '"database_name"\s*:\s*"fishing-p3-sandbox"',
 '"crons"\s*:\s*\[\s*\]'
)
foreach($pattern in $expected){
  if([regex]::Matches($source,$pattern).Count -ne 1) {
    throw "Parked config does not match expected boundary: $pattern"
  }
}
foreach($flag in @('D2_WRITE_ENABLED','D2_RUNNER_ENABLED',
                    'D2_READ_TOKENS_ENABLED','D2_TEST_HOST_ENABLED')){
  if([regex]::Matches($source,'"'+$flag+'"\s*:\s*"false"').Count -ne 1){
    throw "Parked Worker safety gate not OFF: $flag"
  }
}
foreach($name in @('D3_WRITE_ENABLED','D3_RUNNER_ENABLED',
                    'D3_READ_TOKENS_ENABLED','D3_TEST_HOST_ENABLED',
                    'D3_PILOT_ENABLED','D3_PILOT_SHA256')){
  if($source -match '"'+$name+'"\s*:'){
    throw "Unexpected D3 setting already in parked configuration: $name"
  }
}
# Local DB identifiers MUST be the previously deployed values. We never
# log or paste them and refuse any still-placeholder or missing UUID.
$dbIds = [regex]::Matches($source,
 '"database_id"\s*:\s*"(?<id>[0-9a-f-]{36})"')
if($dbIds.Count -ne 2 -or $dbIds[0].Groups['id'].Value -eq
    $dbIds[1].Groups['id'].Value){
  throw 'Existing D1 bindings must retain two distinct real local UUIDs.'
}
$node = Join-Path $repo 'pwa\tools\build-d3-pilot.mjs'
$verify = Join-Path $repo 'pwa\tools\verify-d3-runtime.mjs'
if(-not (Test-Path -LiteralPath $node) -or
   -not (Test-Path -LiteralPath $verify)){
  throw 'D3 pilot generator/verifier source is missing. Update PR checkout.'
}
Push-Location (Join-Path $repo 'pwa')
try{
  & node $node --check
  if($LASTEXITCODE -ne 0){throw 'D3 private pilot build failed.'}
  & node $verify
  if($LASTEXITCODE -ne 0){throw 'D3 embedded runtime verification failed.'}
}finally{Pop-Location}
$metaPath = Join-Path $preview 'src\generated\d3-pilot.bundle.sha256.json'
$meta = Get-Content -LiteralPath $metaPath -Raw | ConvertFrom-Json
if($meta.format -ne 'fishing-d3-pilot-local-build-v1' -or
   $meta.sha256 -notmatch '^[0-9a-f]{64}$' -or
   [int]$meta.bytes -lt 1024 -or [int]$meta.bytes -gt 3145728){
  throw 'Generated pilot SHA-256 manifest is invalid.'
}
# Only local configuration edits follow. Exact replacements (count=1).
$next = $source
$rules = '"keep_vars": true, "rules": [{"type":"Text","globs":["**/*.txt"]}],'
$next = [regex]::Replace($next,'"keep_vars"\s*:\s*true\s*,',$rules)
$next = [regex]::Replace($next,
 '"main"\s*:\s*"src/d2-live-publisher-worker\.mjs"',
 '"main": "src/d3-owner-runtime.mjs"')
$extra = @'
"vars": {
    "D3_SANDBOX_REPO_ID": "1430581407",
    "D3_GITHUB_APP_ID": "5436811",
    "D3_GITHUB_INSTALLATION_ID": "174361658",
    "D3_WRITE_ENABLED": "false",
    "D3_RUNNER_ENABLED": "false",
    "D3_READ_TOKENS_ENABLED": "false",
    "D3_TEST_HOST_ENABLED": "false",
    "D3_PILOT_ENABLED": "false",
    "D3_PILOT_SHA256": "PILOT_SHA_TO_SUBSTITUTE",
'@
$extra = $extra.Replace('PILOT_SHA_TO_SUBSTITUTE',$meta.sha256)
$next = [regex]::Replace($next,'"vars"\s*:\s*\{',
 [System.Text.RegularExpressions.MatchEvaluator]{param($match) $extra})
# Reuse the six existing encrypted D2/OAuth Worker secret bindings.
# There is NO new D3 App PEM, probe value, plaintext secret or export step.
if($next -eq $source -or $next -notmatch '"main": "src/d3-owner-runtime\.mjs"' -or
   $next -notmatch [regex]::Escape($meta.sha256)){
  throw 'D3 local config preparation did not match source invariants.'
}
foreach($flag in @('D2_WRITE_ENABLED','D2_RUNNER_ENABLED',
                    'D2_READ_TOKENS_ENABLED','D2_TEST_HOST_ENABLED',
                    'D3_WRITE_ENABLED','D3_RUNNER_ENABLED',
                    'D3_READ_TOKENS_ENABLED','D3_TEST_HOST_ENABLED',
                    'D3_PILOT_ENABLED')){
  if([regex]::Matches($next,'"'+$flag+'"\s*:\s*"false"').Count -ne 1){
    throw "Unsafe D3 config flag or duplicate: $flag"
  }
}
if($next -notmatch '"crons"\s*:\s*\[\s*\]' -or
   $next -match '"crons"\s*:\s*\[\s*"'){
  throw 'D3 first-deploy config must have ZERO scheduled triggers.'
}
if($next -match '"(?:D2|D3)_GITHUB_APP_PRIVATE_KEY"\s*:'){
  throw 'App private key must be an encrypted secret, not a variable.'
}
[System.IO.File]::WriteAllText($target,$next,
 (New-Object System.Text.UTF8Encoding($false)))
Write-Output 'PASS: Local pilot Text module built and SHA-256 verified.'
Write-Output 'PASS: D3 hard-OFF local config prepared from exact parked D2 bindings.'
Write-Output 'PASS: Two original D1 database UUIDs retained (not printed).'
Write-Output 'PASS: All D2 and D3 flags OFF; no Cron; no public routes added.'
Write-Output 'No Cloudflare deployment, secret operation, D1 mutation or GitHub publication.'
Write-Output 'NEXT: Independently review this ignored local config before any dry-run.'
