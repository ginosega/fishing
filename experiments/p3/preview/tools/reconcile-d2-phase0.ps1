# FISH118 D2 phase-0: refresh ONLY the LOCAL, untracked deployment
# configuration after a reviewed source change. NO network, deploy, D1
# migration, OAuth, GitHub write, or secret read. All four gates stay off.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$templatePath = Join-Path $root 'wrangler.d2-phase0.example.jsonc'
$localPath = Join-Path $root 'wrangler.d2-phase0.local.jsonc'
if (-not (Test-Path -LiteralPath $templatePath)) { throw 'Missing phase-0 template.' }
if (-not (Test-Path -LiteralPath $localPath)) { throw 'Run prepare-d2-phase0.ps1 before reconciliation.' }
$template = [System.IO.File]::ReadAllText($templatePath)
$old = [System.IO.File]::ReadAllText($localPath)
if ($old -notmatch '"name"\s*:\s*"fishing-auth-p0-test"' -or
    $old -notmatch '"D2_WRITE_ENABLED"\s*:\s*"false"' -or
    $old -notmatch '"D2_RUNNER_ENABLED"\s*:\s*"false"' -or
    $old -notmatch '"D2_READ_TOKENS_ENABLED"\s*:\s*"false"' -or
    $old -notmatch '"D2_TEST_HOST_ENABLED"\s*:\s*"false"') {
    throw 'Local configuration is not the exact hard-off target; refuse refresh.'
}
function Get-ExistingDatabaseId([string]$text, [string]$binding, [string]$database) {
    # Match strictly inside ONE JSONC D1 binding object; no unsafe cross-object
    # lookahead or guessing. Only UUID values, never secret values, are used.
    $pattern = '"binding"\s*:\s*"' + [regex]::Escape($binding) +
        '"\s*,\s*"database_name"\s*:\s*"' + [regex]::Escape($database) +
        '"\s*,\s*"database_id"\s*:\s*"([a-f0-9-]+)"'
    $matches = [regex]::Matches($text, $pattern)
    if ($matches.Count -ne 1) { throw "Expected exactly one $binding D1 binding." }
    $id = $matches[0].Groups[1].Value
    if ($id -notmatch '^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$') {
        throw "Invalid existing D1 ID for $binding."
    }
    return $id
}
$authId = Get-ExistingDatabaseId $old 'DB' 'fishing-auth-p0'
$p3Id = Get-ExistingDatabaseId $old 'OPERATIONS_DB' 'fishing-p3-sandbox'
if ($authId -eq $p3Id) { throw 'D1 databases must remain distinct.' }
$new = $template.Replace('REPLACE_EXISTING_AUTH_P0_D1_UUID', $authId)
$new = $new.Replace('REPLACE_EXISTING_MIGRATED_P3_D1_UUID', $p3Id)
if ($new.Contains('REPLACE_') -or $new.Contains('D2_GITHUB_APP_PRIVATE_KEY')) {
    throw 'Template requires review; refused local refresh.'
}
foreach ($name in @('GITHUB_CLIENT_ID','GITHUB_CLIENT_SECRET',
   'OWNER_GITHUB_ID','D2_CSRF_KEY','D2_HOST_PROBE_KEY')) {
    # Names may appear only in the required-secrets declaration, not vars.
    if ($new -notmatch ('"' + $name + '"')) { throw "Missing required secret name $name." }
    if ($new -match ('"'+$name+'"\s*:')) { throw "Secret $name is configured as plaintext." }
}
if ($new -notmatch '"preview_urls"\s*:\s*false' -or
    $new -notmatch '"observability"\s*:\s*\{\s*"enabled"\s*:\s*true') {
    throw 'Phase-0 preview/logging settings missing.'
}
[System.IO.File]::WriteAllText($localPath, $new, (New-Object System.Text.UTF8Encoding($false)))
Write-Output 'PASS: Refreshed local hard-off phase-0 configuration from reviewed template.'
Write-Output 'PASS: Preserved both existing D1 IDs; required secrets by name only.'
Write-Output 'PASS: No network calls, migrations, secrets, or Cloudflare deployment.'
Write-Output 'NEXT: npx.cmd wrangler deploy --dry-run --config .\wrangler.d2-phase0.local.jsonc'
