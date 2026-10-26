import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../tools/reconcile-d2-confirmed-sandbox-merge.sql',import.meta.url),'utf8');
const strip=sql.replace(/^--[^\r\n]*(?:\r?\n|$)/gm,'').trim();
test('D2-R01 one-time receipt reconciliation is an exact single-row CAS only',()=>{
 assert.match(strip,/^UPDATE p3_operations\s+SET state = 'Deploying'/);
 assert.match(strip,/merge_sha = '89be79a9c933dd36bd909edd585091232831c835'/);
 assert.match(strip,/WHERE operation_id = 'p3_343ef7ba-1c87-4d5d-a2ad-92e91eab420f'/);
 assert.match(strip,/AND github_id = 265665562/);
 assert.match(strip,/AND repo_id = 1430581407/);
 assert.match(strip,/AND state = 'Merging'/);
 assert.match(strip,/AND pr_number = 16/);
 assert.match(strip,/AND main_base_sha = '69b236c8af663cdce687dc855bb117a01874060a'/);
 assert.match(strip,/AND pr_head_sha = 'fc7879d67217e0f0a36676e40dadbce7060f66a6'/);
 assert.match(strip,/AND workflow_run_id = 40288266980/);
 assert.match(strip,/AND reason_code = 'merge_attempted'/);
 assert.match(strip,/AND merge_sha IS NULL/);
 assert.match(strip,/AND verified_release_id IS NULL/);
 assert.match(strip,/lease_expires_at <= CAST\(strftime\('%s','now'\) AS INTEGER\)/);
 assert.match(strip,/AND \(SELECT COUNT\(\*\) FROM p3_operations\) = 1/);
 assert.match(strip,/AND \(SELECT COUNT\(\*\) FROM p3_requests/);
 assert.match(strip,/RETURNING operation_id, state, pr_number, workflow_run_id, merge_sha, reason_code;\s*$/);
 const semicolons=(strip.match(/;/g)||[]).length;
 assert.equal(semicolons,1,'only one SQL statement permitted');
 assert(!/\b(?:DROP|DELETE|ALTER|CREATE|ATTACH|INSERT|REPLACE|VACUUM|PRAGMA)\b/i.test(strip));
 assert(!/\bUPDATE\s+(?!p3_operations)/i.test(strip));
});

test('D2-R02 PowerShell recovery avoids forbidden Wrangler import API and preserves CAS SQL',()=>{
 const ps=readFileSync(new URL('../tools/execute-d2-verified-merge-reconciliation.ps1',import.meta.url),'utf8');
 assert.match(ps,/git hash-object -- \$sqlPath/);
 assert(ps.includes('f479be01c118ef9a1d87d46c95e5adc15c7ee258'));
 assert.match(ps,/--remote --json --config .*--command \$command/);
 assert.doesNotMatch(ps,/--file\s+\.\\/);
 assert.match(ps,/\$quoted\.Count -ne 12/);
 assert.match(ps,/\$command\.Contains\("'"\)/);
 assert.match(ps,/NO GitHub/i);
 const literals=Array.from(strip.matchAll(/'([^']*)'/g),m=>m[1]);
 assert.equal(literals.length,12,'fixed and reviewed literal inventory');
 const encoded=strip.replace(/'([^']*)'/g,(_,v)=>
  'char('+Array.from(v).map(c=>c.charCodeAt(0)).join(',')+')');
 assert(!encoded.includes("'"),'query passed to cmd has no vulnerable quote characters');
 assert(encoded.includes('WHERE operation_id = char('));
 assert(encoded.includes('RETURNING operation_id, state, pr_number, workflow_run_id, merge_sha, reason_code;'));
 assert(encoded.length<7900,'Windows native-command safety length bound');
});
