import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const path=new URL('../tools/d6-wp3-h2-windows-readonly-stage-diagnostic.ps1',import.meta.url);
const script=readFileSync(path,'utf8');
const stages=[
 'verify-identity',
 'locate-offline-cli',
 'query-deployments',
 'parse-deployments',
 'select-latest',
 'verify-pinned-off',
 'write-evidence'
];

test('WP3-H2DIAG01 remains a distinct source-only read-only canary',()=>{
 assert(script.includes('SOURCE ONLY'));
 assert(script.includes('Requires new explicit owner approval'));
 assert(script.includes("'fishing-v3-wp3-test'"));
 assert(script.includes("'C:\\Program Files\\nodejs\\npx.cmd'"));
 assert(script.includes("--offline --yes 'wrangler@4.163.0' deployments list --name $worker --json"));
 assert.equal((script.match(/deployments list --name/g)||[]).length,1);
 assert(script.includes('2>$null'));
 assert(script.includes('[System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value'));
 assert(script.includes('.Translate([System.Security.Principal.SecurityIdentifier])'));
 assert(script.includes('created_on'));
 assert(script.includes('offTrafficPercentage = 100'));
 assert(script.includes('taskPrincipalSidMatches = $true'));
 assert(script.includes('isLive = $false'));
 assert(script.includes('canPublish = $false'));
});

test('WP3-H2DIAG02 records only a fixed failure stage, no raw exception',()=>{
 for(const stage of stages){
  assert(script.includes("$stage = '"+stage+"'"));
  assert(script.includes("'"+stage+"'"));
 }
 assert(script.includes("if ($stage -notin $safeStages) { $stage = 'unknown' }"));
 assert(script.includes("result = 'FAIL'"));
 assert(script.includes("stage = $stage"));
 assert(script.includes("result = 'PASS'"));
 assert(script.includes("stage = 'complete'"));
 assert(script.includes("throw 'WP3 H2 diagnostic canary FAIL; no readiness proof'"));
 assert(!/\$_.(?:Exception|ErrorDetails|ScriptStackTrace)/.test(script));
 assert(!/Get-ChildItem\s+Env:|Get-Content|Write-(?:Error|Verbose|Debug)/i.test(script));
 assert(!/Start-Transcript|Out-File|Add-Content|Set-Content/i.test(script));
});

test('WP3-H2DIAG03 exclusive evidence, no write operations, task creation or retries',()=>{
 assert.equal((script.match(/\[System\.IO\.FileMode\]::CreateNew/g)||[]).length,2);
 assert(!/\[System\.IO\.FileMode\]::(?:Create|OpenOrCreate|Append)\b/.test(script));
 assert(!/schtasks|Register-ScheduledTask|New-ScheduledTask|Start-ScheduledTask/i.test(script));
 assert(!/\bversions\s+(?:deploy|upload|rollback)\b/i.test(script));
 assert(!/\bwrangler\s+(?:deploy|login|secret|d1)\b/i.test(script));
 assert(!/\b(?:Invoke-WebRequest|Invoke-RestMethod|curl|fetch)\b/i.test(script));
 assert(!/api\/v3\/operations|POST\s|PUT\s|PATCH\s|DELETE\s/i.test(script));
 assert(!/authorization|access[_-]?token|private[_-]?key|Bearer|wrangler@latest/i.test(script));
 assert(!/Start-Sleep|while\s*\(|do\s*\{|retry/i.test(script.replace(/#.*$/gm,'')));
});

test('WP3-H2DIAG04 code does not claim provider or recovery proof on failure',()=>{
 const failSection=script.slice(script.lastIndexOf('} catch {'));
 assert(failSection.includes("result = 'FAIL'"));
 assert(failSection.includes('readOnly = $true'));
 assert(failSection.includes('isLive = $false'));
 assert(failSection.includes('canPublish = $false'));
 assert(!failSection.includes('offTrafficPercentage = 100'));
});
