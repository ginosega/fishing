# FISH118 D2: LOCAL, READ-ONLY Wrangler configuration preparation.
# This script cannot deploy, alter a Worker, modify a D1 DB, or read secrets.
# Run from Windows PowerShell with the repository checked out.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$template = Join-Path $root 'wrangler.d2-phase0.example.jsonc'
$target = Join-Path $root 'wrangler.d2-phase0.local.jsonc'
if (-not (Test-Path -LiteralPath $template)) { throw 'Missing phase-0 template.' }
if (Test-Path -LiteralPath $target) {
    throw 'Local config already exists. Review or rename it before regeneration.'
}
# Use the Windows command shim explicitly: npx.ps1 is blocked on
# standard systems where PowerShell script execution policy is restricted.
$raw = @(& npx.cmd wrangler d1 list --json)
if ($LASTEXITCODE -ne 0 -or $raw.Count -eq 0) {
    throw 'Wrangler D1 list failed; check local Cloudflare login.'
}
# Windows PowerShell receives native stdout as multiple pipeline records.
$rawJson = $raw -join [Environment]::NewLine
try {
    $parsed = ConvertFrom-Json -InputObject $rawJson
} catch {
    throw 'Wrangler D1 list output is not valid JSON; do not deploy.'
}
# Explicit pipeline flattening avoids nested System.Object[] values returned
# by ConvertFrom-Json from being treated as a single database record.
if ($parsed -is [System.Array]) {
    $databaseEntries = @($parsed | ForEach-Object { $_ })
} elseif ($null -ne $parsed.result) {
    $databaseEntries = @($parsed.result | ForEach-Object { $_ })
} elseif ($null -ne $parsed.databases) {
    $databaseEntries = @($parsed.databases | ForEach-Object { $_ })
} else {
    throw 'Unrecognized Wrangler D1 list JSON structure; do not deploy.'
}
$databaseNames = @($databaseEntries | ForEach-Object { [string]$_.name })
if ($databaseNames -notcontains 'fishing-auth-p0' -or
    $databaseNames -notcontains 'fishing-p3-sandbox') {
    throw 'Expected D1 database names missing from Wrangler account; do not deploy.'
}
function Get-UniqueDatabaseUuid([object[]]$items, [string]$databaseName) {
    $found = @($items | Where-Object { [string]$_.name -ceq $databaseName })
    if ($found.Count -ne 1) {
        throw "Expected exactly one D1 database named $databaseName in this Cloudflare account."
    }
    $uuid = [string]$found[0].uuid
    if ($uuid -notmatch '^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$') {
        throw "Wrangler did not return a valid D1 ID for $databaseName."
    }
    return $uuid
}
$auth = Get-UniqueDatabaseUuid -items $databaseEntries -databaseName 'fishing-auth-p0'
$sandbox = Get-UniqueDatabaseUuid -items $databaseEntries -databaseName 'fishing-p3-sandbox'
if ($auth -eq $sandbox) { throw 'AUTH and P3 databases must be distinct.' }
$config = [System.IO.File]::ReadAllText($template)
$config = $config.Replace('REPLACE_EXISTING_AUTH_P0_D1_UUID', $auth)
$config = $config.Replace('REPLACE_EXISTING_MIGRATED_P3_D1_UUID', $sandbox)
if ($config.Contains('REPLACE_') -or $config.Contains('D2_GITHUB_APP_PRIVATE_KEY')) {
    throw 'Unexpected unresolved placeholder or key material in phase-0 config.'
}
[System.IO.File]::WriteAllText($target, $config, (New-Object System.Text.UTF8Encoding($false)))
Write-Output 'PASS: Prepared phase-0 local config with both existing D1 database IDs.'
Write-Output 'PASS: No migrations, secrets, GitHub writes, cron, or Cloudflare deploy executed.'
Write-Output 'NEXT: npx wrangler deploy --dry-run --config .\wrangler.d2-phase0.local.jsonc'
