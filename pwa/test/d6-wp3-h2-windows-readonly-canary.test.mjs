import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const script=readFileSync(new URL(
 '../tools/d6-wp3-h2-windows-readonly-canary.ps1',import.meta.url),'utf8');

test('WP3-H2CANARY01 pinned offline Wrangler, exact worker and version evidence',()=>{
 assert(script.includes("'fishing-v3-wp3-test'"));
 assert(script.includes("'wrangler@4.163.0' deployments list"));
 assert(script.includes('--offline --yes'));
 assert(script.includes("'C:\\Program Files\\nodejs\\npx.cmd'"));
 assert(script.includes('$ExpectedOffVersion'));
 assert(script.includes('$ExpectedRunAsUser'));
 assert(script.includes('.Translate([System.Security.Principal.SecurityIdentifier])'));
 assert(script.includes('GetCurrent().User.Value'));
 assert(script.includes('taskPrincipalSidMatches = $true'));
 assert(script.includes('offTrafficPercentage = 100'));
 assert(script.includes('offVersion = $ExpectedOffVersion'));
 assert(script.includes('created_on'));
 assert(script.includes('Sort-Object'));
 assert(script.includes('FileMode]::CreateNew'));
});

test('WP3-H2CANARY02 cannot mutate provider, create task, leak credentials or retry',()=>{
 assert(!/versions\s+(deploy|upload|rollback)/i.test(script));
 assert(!/\b(?:d1 execute|wrangler deploy|wrangler login|api\/v3\/operations)\b/i.test(script));
 assert(!/schtasks\.exe|Register-ScheduledTask|New-ScheduledTask/i.test(script));
 assert(!/authorization|access[_-]?token|private[_-]?key|Bearer|Get-Content/i.test(script));
 assert(!script.includes('Invoke-WebRequest'));
 assert(!script.includes('wrangler@latest'));
 assert(!/FileMode\\]::Create(?!New)/.test(script));
 assert(script.includes("throw 'WP3 H2 Windows read-only Task Scheduler canary failed; no readiness proof'"));
 assert(script.includes('isLive = $false'));
 assert(script.includes('canPublish = $false'));
});
