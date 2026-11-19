# FISH-TODO-118 WP3 H2 — isolated Worker emergency OFF only.
# SOURCE ONLY. Do not schedule or execute without separately approved H2
# owner scope and a verified Task Scheduler configuration. This script is
# deliberately incapable of enabling the Worker or selecting a new target.
# Task execution alone is NOT proof of OFF; separately verify Cloudflare
# deployments API shows the exact OFF version at 100% and writer denial.
param(
  [Parameter(Mandatory=$true)]
  [ValidatePattern('^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')]
  [string]$OffVersion
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$worker = 'fishing-v3-wp3-test'
$wrangler = Get-Command -Name 'wrangler' -ErrorAction Stop
if ($null -eq $wrangler -or [string]::IsNullOrWhiteSpace($wrangler.Source)) {
  throw 'H2 OFF restore CLI unavailable; remote readback required'
}
& $wrangler.Source versions deploy "$OffVersion@100" --name $worker --yes --message 'WP3 H2 approved safety OFF restoration'
if ($LASTEXITCODE -ne 0) {
  throw 'H2 OFF restore command failed; remote readback required'
}
Write-Output 'H2 OFF restore command exited zero. Independently verify pinned Cloudflare deployment and write-route denials.'
