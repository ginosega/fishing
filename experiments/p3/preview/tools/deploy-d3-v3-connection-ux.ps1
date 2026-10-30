# FISH118 V3 Connection Status -- private owner pilot bundle + CSS refresh.
# PREPARE by default. -Deploy requires a version-locked operator command.
# No public GitHub Pages deployment, new D1 schema, tokens, Cron or feature flags.
param(
 [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{40}$')][string]$ExpectedHead,
 [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9-]{36}$')][string]$ExpectedWorkerVersion,
 [Parameter(Mandatory=$true)][ValidatePattern('^wrangler\.d[34]-[a-z0-9-]+\.local\.jsonc$')][string]$ExistingConfig,
 [switch]$Deploy
)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$root=(Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
$preview=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$sourceConfig=Join-Path $preview $ExistingConfig
$nextConfig=Join-Path $preview 'wrangler.d3-v3-connection-ux.local.jsonc'
$meta=Join-Path $preview 'src\generated\d3-pilot.bundle.sha256.json'
$bundle=Join-Path $preview 'src\generated\d3-pilot.bundle.txt'
$css=Join-Path $preview 'src\generated\d3-pilot.css.txt'
$origin='https://fishing-auth-p0-test.ginosega.workers.dev'
$worker='fishing-auth-p0-test'
function Need([bool]$ok,[string]$message){if(-not $ok){throw $message}}
function ExactlyOne([string]$value,[string]$regex,[string]$label){
 Need ([regex]::Matches($value,$regex).Count -eq 1) ('Unexpected private config: '+$label)
}
function CurrentWorkerVersion{
 $out=@(& npx.cmd --yes wrangler@4.153.0 deployments status --name $worker)
 Need ($LASTEXITCODE -eq 0) 'Cloudflare deployed version unavailable'
 $m=[regex]::Matches(($out -join [Environment]::NewLine),'(?m)\(100%\)\s+([a-f0-9-]{36})')
 Need ($m.Count -eq 1) 'Deployed Worker version ambiguous'
 return $m[0].Groups[1].Value
}
function Status([string]$route,[string]$method='GET'){
 try {
  $result=Invoke-WebRequest -Uri ($origin+$route) -Method $method -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 25 -Headers @{'Cache-Control'='no-store'}
  return [int]$result.StatusCode
 }catch{
  if($_.Exception.Response){return [int]$_.Exception.Response.StatusCode}
  throw ('Unable to verify private route: '+$route)
 }
}
function PublicDigest{
 $r=Invoke-WebRequest -Uri ($origin+'/fishing/') -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 25 -Headers @{'Cache-Control'='no-store'}
 Need ([int]$r.StatusCode -eq 200) 'Existing public V2 proxy unavailable'
 $sha=[Security.Cryptography.SHA256]::Create()
 try{
  return [BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes([string]$r.Content))).Replace('-','').ToLowerInvariant()
 }finally{$sha.Dispose()}
}
function Proof([bool]$newCss){
 Need ((Status '/__d3_pilot__/') -eq 401) 'Anonymous pilot page is not private'
 Need ((Status '/__d3_pilot__/pilot.js') -eq 401) 'Anonymous pilot script is not private'
 if($newCss){Need ((Status '/__d3_pilot__/pilot.css') -eq 401) 'Anonymous private CSS unexpectedly open'}
 Need ((Status '/session') -eq 200) 'Session endpoint missing'
 $status=Status '/api/v3/operations/latest'
 Need ($status -ne 200 -and $status -in @(401,403,404)) 'Unauthenticated publishing history exposed'
 Need ((Status '/__d3_fast__/github-check' 'POST') -eq 401) 'Unsigned webhook must be denied'
}
Push-Location $root
try{
 Need ((& git branch --show-current).Trim() -ceq 'feature/fish118-p3-mock-publisher') 'Unexpected Git branch'
 Need ((& git rev-parse HEAD).Trim() -ceq $ExpectedHead) 'Unexpected source HEAD'
 Need (@(& git status --porcelain --untracked-files=no).Count -eq 0) 'Tracked worktree not clean'
 Need (Test-Path -LiteralPath $sourceConfig) 'Latest deployed private Worker config not present'
 foreach($file in @($sourceConfig,$nextConfig)){
  & git check-ignore -q -- $file
  Need ($LASTEXITCODE -eq 0) 'Private config must be Git-ignored'
 }
 $source=[IO.File]::ReadAllText($sourceConfig)
 $originalDigest=(Get-FileHash -LiteralPath $sourceConfig -Algorithm SHA256).Hash
 foreach($rule in @(
  '"name"\s*:\s*"fishing-auth-p0-test"',
  '"main"\s*:\s*"src/d3-owner-runtime\.mjs"',
  '"keep_vars"\s*:\s*true',
  '"APP_ORIGIN"\s*:\s*"https://fishing-auth-p0-test\.ginosega\.workers\.dev"',
  '"D3_SANDBOX_REPO_ID"\s*:\s*"1430581407"',
  '"D3_PILOT_ENABLED"\s*:\s*"true"',
  '"D3_READ_TOKENS_ENABLED"\s*:\s*"true"',
  '"D3_WRITE_ENABLED"\s*:\s*"true"',
  '"D3_RUNNER_ENABLED"\s*:\s*"true"',
  '"D3_TEST_HOST_ENABLED"\s*:\s*"true"',
  '"binding"\s*:\s*"DB"',
  '"binding"\s*:\s*"OPERATIONS_DB"',
  '"crons"\s*:\s*\[\s*"\*/5 \* \* \* \*"\s*\]'
 )){ExactlyOne $source $rule $rule}
 foreach($name in @('D2_WRITE_ENABLED','D2_RUNNER_ENABLED','D2_READ_TOKENS_ENABLED','D2_TEST_HOST_ENABLED')){
  ExactlyOne $source ('"'+$name+'"\s*:\s*"false"') $name
 }
 # The V3 integrated PWA must remain disabled during standalone owner pilot acceptance.
 # Older approved D4 configs may omit this future-only flag entirely.
 # Either absent or exact false is safe; never permit an enabled value.
 $integrated=[regex]::Matches($source,'"D3_INTEGRATED_PWA_ENABLED"\s*:\s*"([^"]*)"')
 Need ($integrated.Count -le 1 -and ($integrated.Count -eq 0 -or
  $integrated[0].Groups[1].Value -ceq 'false')) 'Integrated owner PWA must remain off'
 Need ($source -notmatch 'REPLACE_WITH_') 'Unfilled config placeholder'
 Need ([regex]::Matches($source,'"database_id"\s*:\s*"[0-9a-f-]{36}"').Count -eq 2) 'Unverified private D1 bindings'
 foreach($secret in @('D2_CSRF_KEY','D2_GITHUB_APP_PRIVATE_KEY','GITHUB_CLIENT_SECRET','D3_FAST_WEBHOOK_SECRET')){
  Need ($source -notmatch ('"'+$secret+'"\s*:')) 'Private secret literal in configuration'
 }
 $pilotMatch=[regex]::Matches($source,'"D3_PILOT_SHA256"\s*:\s*"[a-f0-9]{64}"')
 Need ($pilotMatch.Count -eq 1) 'Existing pilot digest missing'
 Need ($source -notmatch '"D3_PILOT_CSS_SHA256"\s*:') 'Config already has CSS. Inspect before replacing.'
 $oldPilot=$pilotMatch[0].Value
 Push-Location (Join-Path $root 'pwa')
 try {
  & node tools/build-d3-pilot.mjs --check
  Need ($LASTEXITCODE -eq 0) 'Owner pilot bundle failed to build'
  & node tools/verify-d3-windows-eol.mjs
  Need ($LASTEXITCODE -eq 0) 'Windows bundle byte parity failed'
  & node tools/verify-d3-csp.mjs
  Need ($LASTEXITCODE -eq 0) 'Strict CSP verification failed'
  & node tools/verify-d3-runtime.mjs
  Need ($LASTEXITCODE -eq 0) 'Worker runtime source validation failed'
 }finally{Pop-Location}
 $manifest=Get-Content -LiteralPath $meta -Raw | ConvertFrom-Json
 Need ($manifest.format -eq 'fishing-d3-pilot-local-build-v1') 'Unknown generated build format'
 foreach($entry in @(@($bundle,$manifest.sha256,$manifest.bytes),@($css,$manifest.cssSha256,$manifest.cssBytes))){
  Need (Test-Path -LiteralPath $entry[0]) 'Generated private bundle missing'
  Need ((Get-FileHash -LiteralPath $entry[0] -Algorithm SHA256).Hash.ToLowerInvariant() -eq $entry[1]) 'Generated bundle digest mismatch'
  Need ((Get-Item -LiteralPath $entry[0]).Length -eq $entry[2]) 'Generated bundle byte mismatch'
 }
 Need ($manifest.sha256 -match '^[a-f0-9]{64}$' -and $manifest.cssSha256 -match '^[a-f0-9]{64}$') 'Invalid private build digest'
 $newPilot='"D3_PILOT_SHA256": "'+[string]$manifest.sha256+'"'
 $newCss='"D3_PILOT_CSS_SHA256": "'+[string]$manifest.cssSha256+'",'
 $replacement=$newCss+[Environment]::NewLine+'    '+$newPilot
 $candidate=$source.Replace($oldPilot,$replacement)
 Need ($candidate.Replace($replacement,$oldPilot) -ceq $source -and $candidate -cne $source) 'Unexpected config changes'
 if(Test-Path -LiteralPath $nextConfig){
  Need ([IO.File]::ReadAllText($nextConfig) -ceq $candidate) 'Existing prepared config drift'
 }else{
  [IO.File]::WriteAllText($nextConfig,$candidate,(New-Object Text.UTF8Encoding($false)))
 }
 Push-Location $preview
 try {
  $before=CurrentWorkerVersion
  Need ($before -eq $ExpectedWorkerVersion) 'Deployed Worker version changed. Stop.'
  Proof $false
  $public=PublicDigest
  $dir=Join-Path $env:TEMP ('fishing-v3-connection-ux-'+[guid]::NewGuid().ToString('N'))
  try {
   & npx.cmd --yes wrangler@4.153.0 deploy --dry-run --config $nextConfig --outdir $dir
   Need ($LASTEXITCODE -eq 0) 'Wrangler private Worker dry-run failed'
  }finally{if(Test-Path $dir){Remove-Item -LiteralPath $dir -Recurse -Force}}
  Need ((CurrentWorkerVersion) -eq $before -and (PublicDigest) -eq $public) 'Private Worker or public V2 drift during preflight'
  Need ((Get-FileHash -LiteralPath $sourceConfig -Algorithm SHA256).Hash -eq $originalDigest) 'Original local config modified'
  if(-not $Deploy){
   Write-Output ('PASS: PREPARED ONLY; existing version '+$before)
   Write-Output ('NEW_PRIVATE_JS_SHA256: '+$manifest.sha256)
   Write-Output ('NEW_PRIVATE_CSS_SHA256: '+$manifest.cssSha256)
   Write-Output ('CONFIG: '+$nextConfig)
   Write-Output 'No private Worker, D1, GitHub, secret, Cron or public V2 change.'
  }else{
   & npx.cmd --yes wrangler@4.153.0 deploy --config $nextConfig
   Need ($LASTEXITCODE -eq 0) 'Worker deploy uncertain. Inspect, do NOT retry blindly.'
   $after=CurrentWorkerVersion
   Need ($after -ne $before) 'No new private Worker version; inspect first'
   Proof $true
   Need ((PublicDigest) -eq $public) 'Public V2 proxy changed after rollout'
   Write-Output ('PASS: PRIVATE owner pilot Connection Status UX deployed: '+$after)
   Write-Output 'Anonymous CSS/JS/page denied, V2 proxy stable; no D1 or GitHub mutation.'
  }
 }finally{Pop-Location}
}finally{Pop-Location}
