# FISH-TODO-118 / WP3 H2 — Windows Task Scheduler QUERY ONLY.
# No registration, removal, modifications, credentials or arbitrary actions.
# This output is non-secret local OS readback, not Cloudflare OFF evidence.
param(
 [Parameter(Mandatory=$true)]
 [ValidatePattern('^Fishing-WP3-H2-OFF-[a-f0-9]{16}$')]
 [string]$TaskName,
 [Parameter(Mandatory=$true)]
 [ValidatePattern('^[A-Za-z0-9_.-]{1,32}\\[A-Za-z0-9_.-]{1,64}
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction Stop
if ($task.TaskName -cne $TaskName -or $task.TaskPath -ne '\') {
 throw 'H2 safety task identity mismatch'
}
$actions = @($task.Actions)
$triggers = @($task.Triggers)
if ($actions.Count -ne 1 -or $triggers.Count -ne 1) {
 throw 'H2 safety task has unexpected actions/triggers'
}
$action = $actions[0]
$trigger = $triggers[0]
$exe = [System.IO.Path]::GetFileName([string]$action.Execute)
if ($exe -ine 'powershell.exe' -or
 $trigger.CimClass.CimClassName -ne 'MSFT_TaskTimeTrigger') {
 throw 'H2 safety task action/trigger mismatch'
}
$timestamp = [DateTimeOffset]::Parse(
 [string]$trigger.StartBoundary,
 [Globalization.CultureInfo]::InvariantCulture,
 [Globalization.DateTimeStyles]::AssumeLocal
).ToUnixTimeSeconds()
$enabled = ($task.Settings.Enabled -eq $true -and
 $trigger.Enabled -eq $true -and
 $task.State -ne 'Disabled')
# The CLI's default run-as account is NOT an identity attestation.
# Independently verify the task's actual principal as the owner's SID.
# Reject S4U: it cannot access the network/encrypted user credentials.
$principal = $task.Principal
if ($null -eq $principal -or
 [string]::IsNullOrWhiteSpace([string]$principal.UserId)) {
 throw 'H2 task principal unavailable'
}
try {
 $expectedSid = [System.Security.Principal.NTAccount]::new(
  $ExpectedRunAsUser
 ).Translate([System.Security.Principal.SecurityIdentifier]).Value
} catch {
 throw 'H2 expected Windows owner identity unresolved'
}
try {
 $configuredUser = [string]$principal.UserId
 if ($configuredUser -match '^S-1-[0-9-]+$') {
  $observedSid = [System.Security.Principal.SecurityIdentifier]::new(
   $configuredUser).Value
 } else {
  $observedSid = [System.Security.Principal.NTAccount]::new(
   $configuredUser
  ).Translate([System.Security.Principal.SecurityIdentifier]).Value
 }
} catch {
 throw 'H2 configured task principal unresolved'
}
if ($expectedSid -ne $observedSid) {
 throw 'H2 task run-as identity mismatch'
}
$logonType = [string]$principal.LogonType
if (@('Interactive','Password','InteractiveOrPassword') -cnotcontains $logonType) {
 throw 'H2 task cannot use owner network authentication context'
}
if ([string]$principal.RunLevel -ne 'Limited') {
 throw 'H2 task privilege level mismatch'
}
$record = [ordered]@{
 taskName = $task.TaskName
 action = 'powershell.exe ' + [string]$action.Arguments
 deadline = [long]$timestamp
 enabled = [bool]$enabled
 oneShot = $true
 scheduler = 'windows-task-scheduler'
 verified = $true
}
$record | ConvertTo-Json -Depth 3 -Compress
)]
 [string]$ExpectedRunAsUser
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction Stop
if ($task.TaskName -cne $TaskName -or $task.TaskPath -ne '\') {
 throw 'H2 safety task identity mismatch'
}
$actions = @($task.Actions)
$triggers = @($task.Triggers)
if ($actions.Count -ne 1 -or $triggers.Count -ne 1) {
 throw 'H2 safety task has unexpected actions/triggers'
}
$action = $actions[0]
$trigger = $triggers[0]
$exe = [System.IO.Path]::GetFileName([string]$action.Execute)
if ($exe -ine 'powershell.exe' -or
 $trigger.CimClass.CimClassName -ne 'MSFT_TaskTimeTrigger') {
 throw 'H2 safety task action/trigger mismatch'
}
$timestamp = [DateTimeOffset]::Parse(
 [string]$trigger.StartBoundary,
 [Globalization.CultureInfo]::InvariantCulture,
 [Globalization.DateTimeStyles]::AssumeLocal
).ToUnixTimeSeconds()
$enabled = ($task.Settings.Enabled -eq $true -and
 $trigger.Enabled -eq $true -and
 $task.State -ne 'Disabled')
$record = [ordered]@{
 taskName = $task.TaskName
 action = 'powershell.exe ' + [string]$action.Arguments
 deadline = [long]$timestamp
 enabled = [bool]$enabled
 oneShot = $true
 scheduler = 'windows-task-scheduler'
 verified = $true
}
$record | ConvertTo-Json -Depth 3 -Compress
