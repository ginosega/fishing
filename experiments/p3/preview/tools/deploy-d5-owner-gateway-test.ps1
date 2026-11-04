# FISH118 D5 owner test: version-locked, exact-path Cloudflare Worker gate.
# PREPARE by default. -Deploy performs ONE approved same-origin test rollout.
# Never modifies public V2, D1 schema, credential values or existing pilot bytes.
param(
 [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{40}$')][string]$ExpectedHead,
 [Parameter(Mandatory=$true)][long]$ExpectedCiRun,
 [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9-]{36}$')][string]$ExpectedWorkerVersion,
 [Parameter(Mandatory=$true)][string]$PagesOrigin,
 [Parameter(Mandatory=$true)][string]$PreviousConfig,
 [Parameter(Mandatory=$true)][string]$PreviousGeneratedDir,
 [switch]$Deploy
)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$root=(Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
$preview=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$origin='https://fishing-auth-p0-test.ginosega.workers.dev'
$worker='fishing-auth-p0-test'
$newConfig=Join-Path $preview 'wrangler.d5-owner-candidate.local.jsonc'
function Need([bool]$ok,[string]$message){if(-not $ok){throw $message}}
function Once([string]$value,[string]$pattern,[string]$name){
 Need ([regex]::Matches($value,$pattern).Count -eq 1) ('Private config mismatch: '+$name)
}
function HashString([string]$s){
 $h=[Security.Cryptography.SHA256]::Create()
 try{return [BitConverter]::ToString($h.ComputeHash([Text.Encoding]::UTF8.GetBytes($s))).Replace('-','').ToLowerInvariant()}
 finally{$h.Dispose()}
}
function CurrentWorkerVersion{
 $lines=@(& npx.cmd --yes wrangler@4.153.0 deployments status --name $worker)
 Need ($LASTEXITCODE -eq 0) 'Cannot read current Worker version'
 $found=[regex]::Matches(($lines -join [Environment]::NewLine),'(?m)\(100%\)\s+([a-f0-9-]{36})')
 Need ($found.Count -eq 1) 'Current Worker version is ambiguous'
 return $found[0].Groups[1].Value
}
function HttpStatus([string]$route){
 try{
  $r=Invoke-WebRequest -Uri ($origin+$route) -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 30 -Headers @{'Cache-Control'='no-store'}
  return [int]$r.StatusCode
 }catch{
  if($_.Exception.Response){return [int]$_.Exception.Response.StatusCode}
  throw ('Unable to inspect route: '+$route)
 }
}
function PublicDigest{
 $r=Invoke-WebRequest -Uri ($origin+'/fishing/') -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 30 -Headers @{'Cache-Control'='no-store'}
 Need ([int]$r.StatusCode -eq 200) 'Existing public V2 proxy unavailable'
 return HashString ([string]$r.Content)
}
function PrivateProof{
 Need ((HttpStatus '/__d3_pilot__/') -eq 401) 'Anonymous private pilot page exposed'
 Need ((HttpStatus '/__d3_pilot__/pilot.js') -eq 401) 'Anonymous private pilot JS exposed'
 Need ((HttpStatus '/__d3_pilot__/pilot.css') -eq 401) 'Anonymous private pilot CSS exposed'
 Need ((HttpStatus '/session') -eq 200) 'Session endpoint unavailable'
 Need ((HttpStatus '/api/v3/operations/latest') -in @(401,403,404)) 'Anonymous publication status exposed'
}
Need ($PagesOrigin -cmatch '^https://[a-f0-9]{8,32}\.fishing-v3-owner-d5-test\.pages\.dev$') 'Require an immutable owner Pages test deployment URL'
Need ($ExpectedWorkerVersion -ne '00000000-0000-0000-0000-000000000000') 'Invalid expected Worker version'
$sourceConfig=(Resolve-Path -LiteralPath $PreviousConfig).Path
$previousAssets=(Resolve-Path -LiteralPath $PreviousGeneratedDir).Path
Need ($sourceConfig -cne $newConfig -and $sourceConfig -cmatch 'wrangler\.[a-z0-9.-]+\.local\.jsonc$') 'Invalid previous private config path'
Push-Location $root
try{
 Need ((& git rev-parse HEAD).Trim() -ceq $ExpectedHead -and $LASTEXITCODE -eq 0) 'Unexpected source checkout'
 Need (@(& git status --porcelain --untracked-files=no).Count -eq 0) 'Tracked checkout dirty'
 $up=@(& git ls-remote origin refs/heads/feature/fish118-d5-owner-integration)
 Need ($LASTEXITCODE -eq 0 -and $up.Count -eq 1 -and
  ($up[0] -split '\s+')[0] -ceq $ExpectedHead) 'Remote integration source drift'
 $ci=Invoke-RestMethod -Uri ('https://api.github.com/repos/ginosega/fishing/actions/runs/'+$ExpectedCiRun) -Headers @{'User-Agent'='Fishing-D5-Operator';'Accept'='application/vnd.github+json'} -TimeoutSec 30
 Need ($ci.head_sha -ceq $ExpectedHead -and $ci.status -ceq 'completed' -and
  $ci.conclusion -ceq 'success' -and
  $ci.name -ceq 'Fishing P3 isolated source validation') 'Exact-head source validation unavailable'
 $source=[IO.File]::ReadAllText($sourceConfig)
 $sourceHash=(Get-FileHash -LiteralPath $sourceConfig -Algorithm SHA256).Hash
 foreach($pattern in @(
  '"name"\s*:\s*"fishing-auth-p0-test"',
  '"main"\s*:\s*"src/d3-owner-runtime\.mjs"',
  '"keep_vars"\s*:\s*true',
  '"APP_ORIGIN"\s*:\s*"https://fishing-auth-p0-test\.ginosega\.workers\.dev"',
  '"D3_SANDBOX_REPO_ID"\s*:\s*"1430581407"',
  '"D3_PILOT_ENABLED"\s*:\s*"true"',
  '"D3_READ_TOKENS_ENABLED"\s*:\s*"true"',
  '"D3_WRITE_ENABLED"\s*:\s*"true"',
  '"binding"\s*:\s*"DB"',
  '"binding"\s*:\s*"OPERATIONS_DB"',
  '"workers_dev"\s*:\s*true'
 )){Once $source $pattern $pattern}
 Need ($source -notmatch '"D5_OWNER_CANDIDATE_ENABLED"\s*:' -and
  $source -notmatch '"D5_OWNER_PAGES_ORIGIN"\s*:') 'Owner route already configured; inspect before proceeding'
 Need ($source -notmatch 'REPLACE_WITH_') 'Config contains placeholders'
 Need ([regex]::Matches($source,'"database_id"\s*:\s*"[a-f0-9-]{36}"').Count -eq 2) 'D1 binding changed'
 foreach($secret in @('D2_CSRF_KEY','D2_GITHUB_APP_PRIVATE_KEY','GITHUB_CLIENT_SECRET','D3_FAST_WEBHOOK_SECRET')){
  Need ($source -notmatch ('"'+$secret+'"\s*:')) 'Plaintext private secret in config'
 }
 $oldPilot=[regex]::Match($source,'"D3_PILOT_SHA256"\s*:\s*"([a-f0-9]{64})"')
 $oldCss=[regex]::Match($source,'"D3_PILOT_CSS_SHA256"\s*:\s*"([a-f0-9]{64})"')
 Need ($oldPilot.Success -and $oldCss.Success) 'Previous pinned private pilot digests unavailable'
 $target=Join-Path $preview 'src\generated'
 if(-not (Test-Path -LiteralPath $target)){New-Item -ItemType Directory -Path $target | Out-Null}
 foreach($item in @(
  @('d3-pilot.bundle.txt',$oldPilot.Groups[1].Value),
  @('d3-pilot.css.txt',$oldCss.Groups[1].Value)
 )){
  $from=Join-Path $previousAssets $item[0]
  $to=Join-Path $target $item[0]
  Need (Test-Path -LiteralPath $from) ('Missing previously accepted pilot asset: '+$item[0])
  Need ((Get-FileHash -LiteralPath $from -Algorithm SHA256).Hash.ToLowerInvariant() -ceq $item[1]) ('Prior pilot SHA mismatch: '+$item[0])
  if(Test-Path -LiteralPath $to){
   Need ((Get-FileHash -LiteralPath $to -Algorithm SHA256).Hash.ToLowerInvariant() -ceq $item[1]) 'Conflicting new worktree pilot bytes'
  }else{Copy-Item -LiteralPath $from -Destination $to}
 }
 & git check-ignore -q -- $newConfig
 Need ($LASTEXITCODE -eq 0) 'Prepared Worker config must be Git ignored'
 foreach($file in @('src/generated/d3-pilot.bundle.txt','src/generated/d3-pilot.css.txt')){
  & git check-ignore -q -- ('experiments/p3/preview/'+$file)
  Need ($LASTEXITCODE -eq 0) 'Pilot artifact must be Git ignored'
 }
 $vars=[regex]::Matches($source,'"vars"\s*:\s*\{')
 Need ($vars.Count -eq 1) 'Ambiguous vars configuration'
 $at=$vars[0].Index+$vars[0].Length
 $insertion=[Environment]::NewLine+'    "D5_OWNER_CANDIDATE_ENABLED": "true",'+[Environment]::NewLine+
  '    "D5_OWNER_PAGES_ORIGIN": "'+$PagesOrigin+'",'
 $config=$source.Substring(0,$at)+$insertion+$source.Substring($at)
 Need ($config.Replace($insertion,'') -ceq $source) 'Unexpected config mutation'
 if(Test-Path -LiteralPath $newConfig){
  Need ([IO.File]::ReadAllText($newConfig) -ceq $config) 'Pre-existing prepared config drift; stop'
 }else{
  [IO.File]::WriteAllText($newConfig,$config,(New-Object Text.UTF8Encoding($false)))
 }
 # The verified immutable source host must already exist before enabling
 # a Worker route; an anonymous request must not obtain private content.
 $remote=Invoke-WebRequest -Uri ($PagesOrigin+'/fishing/__v3_owner_candidate__/release.json') -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 45 -Headers @{'Cache-Control'='no-store'}
 Need ([int]$remote.StatusCode -eq 200) 'Isolated Pages site unavailable'
 $pointer=$remote.Content | ConvertFrom-Json
 Need ($pointer.sourceRevision -ceq $ExpectedHead) 'Pages site is from different source'
 $before=CurrentWorkerVersion
 Need ($before -ceq $ExpectedWorkerVersion) 'Active private Worker version changed; stop'
 PrivateProof
 $public=PublicDigest
 $work=Join-Path $env:TEMP ('fishing-d5-owner-gateway-'+[guid]::NewGuid().ToString('N'))
 try{
  Push-Location $preview
  try{
   & npx.cmd --yes wrangler@4.153.0 deploy --dry-run --config $newConfig --outdir $work
   Need ($LASTEXITCODE -eq 0) 'Worker package dry-run failed'
  }finally{Pop-Location}
 }finally{if(Test-Path $work){Remove-Item -LiteralPath $work -Recurse -Force}}
 Need ((CurrentWorkerVersion) -ceq $before -and (PublicDigest) -ceq $public) 'Worker/public V2 drift during preflight'
 Need ((Get-FileHash -LiteralPath $sourceConfig -Algorithm SHA256).Hash -ceq $sourceHash) 'Prior deployed config was modified'
 if(-not $Deploy){
  Write-Output ('PASS: D5 OWNER GATEWAY PREPARED ONLY; existing Worker '+$before)
  Write-Output ('SOURCE_HEAD: '+$ExpectedHead)
  Write-Output ('IMMUTABLE_PAGES_ORIGIN: '+$PagesOrigin)
  Write-Output ('PREPARED_IGNORED_CONFIG: '+$newConfig)
  Write-Output 'No Worker, D1, GitHub or public V2 mutation.'
 }else{
  Push-Location $preview
  try{
   Need ((CurrentWorkerVersion) -ceq $before) 'Worker version changed immediately before deployment'
   & npx.cmd --yes wrangler@4.153.0 deploy --config $newConfig
   Need ($LASTEXITCODE -eq 0) 'Worker deploy uncertain; inspect, do NOT retry blindly'
   $after=CurrentWorkerVersion
   Need ($after -cne $before) 'New Worker version not established; inspect, do NOT retry'
   PrivateProof
   Need ((PublicDigest) -ceq $public) 'Public V2 proxy changed after rollout'
   Need ((HttpStatus '/fishing/__v3_owner_candidate__/') -eq 200) 'Integrated anonymous candidate route unavailable'
   $hostPointer=Invoke-WebRequest -Uri ($origin+'/fishing/__v3_owner_candidate__/release.json') -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 45 -Headers @{'Cache-Control'='no-store'}
   Need ((HashString ([string]$hostPointer.Content)) -ceq (HashString ([string]$remote.Content))) 'Same-origin hosted pointer differs'
   Write-Output ('PASS: D5 OWNER PRIVATE TEST GATEWAY DEPLOYED: '+$after)
   Write-Output ('PREVIOUS_WORKER_VERSION: '+$before)
   Write-Output ('SOURCE_HEAD: '+$ExpectedHead)
   Write-Output ('OWNER_TEST_URL: '+$origin+'/fishing/__v3_owner_candidate__/')
   Write-Output 'No public V2 change, no authenticated publish test run.'
  }finally{Pop-Location}
 }
}finally{Pop-Location}
