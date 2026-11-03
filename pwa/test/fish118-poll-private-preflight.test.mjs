import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../../experiments/p3/preview/tools/prepare-d3-poll-2s-private.ps1',import.meta.url),'utf8');

test('FISH118-P2S01 preflight has no live deployment command or deploy switch',()=>{
 assert.doesNotMatch(source,/\[switch\]\s*\$Deploy|\b-Deploy\b/);
 assert.equal((source.match(/wrangler@4\.153\.0 deploy\b/g)||[]).length,1);
 assert.match(source,/wrangler@4\.153\.0 deploy --dry-run --config/);
 assert.doesNotMatch(source,/git push\b|git merge(?!-base)\b|d1 execute[^\n]*--command[^\n]*(?:UPDATE|INSERT|DELETE)/i);
});
test('FISH118-P2S02 prior Worker identity and both JS digests are pinned',()=>{
 for(const value of [
  '693d46c3-a5f6-4441-af32-397dae1b55d4',
  'b6d5d25a61b563516e4a3fca20614622d29000e3db320423d27d8d1cb3026f52',
  '8451a8a4822455057863bd354b84880e0244a320e2b50e18a59ef25c33114264',
  '4648e26bfcb7e97e292337c7e7f59fa35541b0030c378b7262968fa4e347f480',
 ])assert(source.includes(value));
});
test('FISH118-P2S03 rejects source drift and unexpected tracked files',()=>{
 assert.match(source,/git rev-parse HEAD/);
 assert.match(source,/git merge-base --is-ancestor/);
 assert.match(source,/git diff --name-only/);
 assert.match(source,/changed\.Count -eq 2/);
 assert.match(source,/Unexpected source scope since polling merge/);
});
test('FISH118-P2S04 verifies private asset bytes, session, status, webhook and D1',()=>{
 for(const value of [
  'verify-d3-windows-eol.mjs','verify-d3-csp.mjs','verify-d3-runtime.mjs',
  '/__d3_pilot__/pilot.css','/__d3_pilot__/pilot.js',
  '/__d3_fast__/github-check','/api/v3/operations/latest',
  'SELECT state,reason_code,merge_sha FROM p3_operations',
  'f124386bebfe481ecfc1dbd5bf625f24df5823ff',
 ])assert(source.includes(value));
});
test('FISH118-P2S05 retains private-only flags, public V2 and encrypted config',()=>{
 for(const value of [
  'D3_FAST_WEBHOOK_ENABLED','D3_FAST_WATCHDOG_ENABLED',
  'D3_FAST_TRACE_ENABLED','D4_MEDIA_ENABLED','D3_SANDBOX_REPO_ID',
  'D3_INTEGRATED_PWA_ENABLED','D2_WRITE_ENABLED',
  'PublicDigest','git check-ignore -q','Get-FileHash',
 ])assert(source.includes(value));
});
