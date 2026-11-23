import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const script=read('../tools/d6-l01-private-deploy.ps1');
const pilot=JSON.parse(read('../wrangler.o02-private.jsonc'));
const baseline=JSON.parse(read('../wrangler.direct-gear-private.jsonc'));

test('L01 source-pinned private deploy uses only the separately approved O02 config',()=>{
 for(const term of ["$ConfigFile='wrangler.o02-private.jsonc'",
  'git rev-parse HEAD','git status --porcelain',
  '--d6-standalone-v3','--d6-o03-offline-reading',
  '--d6-o02-offline-content','fishing-companion-software-v3',
  "'d6OfflineContentReading','standaloneV3'",
  '$null -ne $Manifest.counts','tools/verify.mjs','--dry-run',
  'd1 execute fishing-v3-wp3-operations-test --remote --json --command',
  'if(-not $Deploy)', 'L01 PRIVATE PREFLIGHT PASS',
  'L01 PRIVATE DEPLOYMENT SMOKE PASS',
  'Require-Equal $Remote.standaloneV3 $true']){
  assert.ok(script.includes(term),'Missing gated L01 step: '+term);
 }
 assert.ok(script.indexOf('if(-not $Deploy)')<
  script.lastIndexOf('deploy --config $ConfigFile'));
 assert.match(script, /Set-Location \(Split-Path -Parent \$PSScriptRoot\)/);
 assert.equal(pilot.name,'fishing-d6-wp2-test');
 assert.equal(pilot.routes,undefined);
 assert.equal(pilot.vars.D6_O02_OFFLINE_SNAPSHOT_ENABLED,'true');
 assert.equal(baseline.vars.D6_O02_OFFLINE_SNAPSHOT_ENABLED,undefined);
 assert.equal(pilot.keep_vars,true);
 const {D6_O02_OFFLINE_SNAPSHOT_ENABLED,...vars}=pilot.vars;
 assert.deepEqual({...pilot,vars},baseline,
  'no new Worker, binding, authority, R2 bucket or public route');
});
