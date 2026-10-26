import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const script=readFileSync(new URL('../tools/prepare-d2-parked-worker.ps1',import.meta.url),'utf8');
const ignored=readFileSync(new URL('../.gitignore',import.meta.url),'utf8');
test('D2-park-01 inactive Worker requires exact verified immutable D1 Live state',()=>{
 for(const v of ['p3_343ef7ba-1c87-4d5d-a2ad-92e91eab420f',
  '89be79a9c933dd36bd909edd585091232831c835',
  '73362eb77bd59219aa6f78fb93e9d47b',
  '40288266980']) assert(script.includes(v));
 assert.match(script,/\$r\.state -ne 'Live'/);
 assert.match(script,/\$null -ne \$r\.reason_code/);
 assert.match(script,/--remote --json --config/);
 assert.match(script,/SELECT operation_id,state,pr_number,workflow_run_id,merge_sha,verified_release_id,reason_code FROM p3_operations LIMIT 2;/);
 assert(script.includes("wrangler.d2-parked.local.jsonc"));
 assert(ignored.includes("wrangler.d2-parked.local.jsonc"));
});
test('D2-park-02 retire all sandbox write and test host gates and remove Cron',()=>{
 for(const flag of ['D2_WRITE_ENABLED','D2_RUNNER_ENABLED',
  'D2_READ_TOKENS_ENABLED','D2_TEST_HOST_ENABLED']) {
  assert(script.includes("'"+flag+"'"));
  assert(script.includes('"'+flag+'": "false"')===false); // computed, not unconditional
 }
 assert.match(script,/'"triggers": \{ "crons": \[\] \}'/);
 assert.match(script,/No D1 mutation, secret read, Worker deploy, or canonical GitHub mutation/);
 assert.doesNotMatch(script,/^\s*(?:&\s*)?(?:npx(?:\.cmd)?\s+)?wrangler\s+(?:deploy|secret|d1 migrations)/im);
});
