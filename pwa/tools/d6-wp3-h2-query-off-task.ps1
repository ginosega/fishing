# FISH-TODO-118 / WP3 H2 — Windows Task Scheduler QUERY ONLY.
# No registration, removal, modifications, credentials or arbitrary actions.
# This output is non-secret local OS readback, not Cloudflare OFF evidence.
param(
 [Parameter(Mandatory=$true)]
 [ValidatePattern('^Fishing-WP3-H2-OFF-[a-f0-9]{16}$')]
 [string]$TaskName
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
