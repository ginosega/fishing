# Windows PowerShell 5.1 test: no Pages/Worker provider access, no deployment operator execution.
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
if($PSVersionTable.PSVersion.Major -ne 5){throw 'Test requires Windows PowerShell 5.1 (powershell.exe)'}
$operatorPath=Join-Path $PSScriptRoot '..\..\experiments\p3\preview\tools\update-d5-owner-pages-private.ps1'
$tokens=$null
$parseErrors=$null
$ast=[System.Management.Automation.Language.Parser]::ParseFile($operatorPath,[ref]$tokens,[ref]$parseErrors)
if($parseErrors.Count -ne 0){throw 'Pages deployment operator has PS5.1 syntax errors'}
$functions=@($ast.FindAll({
 param($node)
 $node -is [System.Management.Automation.Language.FunctionDefinitionAst] -and
 $node.Name -ceq 'InvokeNativeOutput'
},$true))
if($functions.Count -ne 1){throw 'Native warning wrapper missing or ambiguous'}
# Import only the wrapper function AST, never dot-source/call the deployment script.
Invoke-Expression $functions[0].Extent.Text

$dir=Join-Path $env:TEMP ('d5-stderr-fixture-'+[guid]::NewGuid().ToString('N'))
New-Item -Path $dir -ItemType Directory -ErrorAction Stop | Out-Null
try{
 $warn=Join-Path $dir 'warn-success.cmd'
 $warningScript=(@('@echo off','echo [WARNING] Wrangler git working tree is dirty 1>&2',
  'echo https://12345678.fishing-v3-owner-d5-test.pages.dev','exit /b 0') -join [Environment]::NewLine)
 [IO.File]::WriteAllText($warn,$warningScript,[Text.Encoding]::ASCII)
 $result=InvokeNativeOutput { & $warn }
 if($result.ExitCode -ne 0){throw 'Native warning with exit 0 was falsely reported as a failure'}
 $joined=$result.Lines -join [Environment]::NewLine
 if(-not $joined.Contains('Wrangler git working tree is dirty')){throw 'Native stderr warning not retained'}
 if(-not $joined.Contains('https://12345678.fishing-v3-owner-d5-test.pages.dev')){throw 'Immutable Pages URL missing'}
 if($ErrorActionPreference -cne 'Stop'){throw 'ErrorActionPreference not restored after success'}

 $fail=Join-Path $dir 'warn-failure.cmd'
 $failureScript=(@('@echo off','echo [WARNING] Wrangler upload failed 1>&2',
  'echo https://12345678.fishing-v3-owner-d5-test.pages.dev','exit /b 27') -join [Environment]::NewLine)
 [IO.File]::WriteAllText($fail,$failureScript,[Text.Encoding]::ASCII)
 $result=InvokeNativeOutput { & $fail }
 if($result.ExitCode -ne 27){throw 'Nonzero native exit code was lost or misreported as success'}
 if(-not (($result.Lines -join [Environment]::NewLine).Contains('Wrangler upload failed'))){throw 'Native failure message lost'}
 if($ErrorActionPreference -cne 'Stop'){throw 'ErrorActionPreference not restored after native failure'}

 $threw=$false
 try{InvokeNativeOutput {throw 'synthetic PowerShell error'} | Out-Null}catch{$threw=$true}
 if(-not $threw){throw 'Native wrapper swallowed a terminating PowerShell exception'}
 if($ErrorActionPreference -cne 'Stop'){throw 'ErrorActionPreference not restored after thrown exception'}
 Write-Output 'PASS: PowerShell 5.1 native stderr, exit 0 warning, nonzero failure and thrown exception; no Pages or Worker call'
}finally{
 Remove-Item -LiteralPath $dir -Recurse -Force -ErrorAction SilentlyContinue
}
