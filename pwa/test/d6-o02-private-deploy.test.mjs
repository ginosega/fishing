import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const existing=JSON.parse(read('../wrangler.direct-gear-private.jsonc'));
const o02=JSON.parse(read('../wrangler.o02-private.jsonc'));
const priorScript=read('../tools/d6-m02-private-deploy.ps1');
const script=read('../tools/d6-o02-private-deploy.ps1');

test('O02-DEPLOY01 new config adds only one opt-in on existing private host',()=>{
 const {D6_O02_OFFLINE_SNAPSHOT_ENABLED,...vars}=o02.vars;
 assert.equal(D6_O02_OFFLINE_SNAPSHOT_ENABLED,'true');
 assert.deepEqual(vars,existing.vars,
  'do not change existing M02/M03 flags, origin, owner or write authority');
 assert.deepEqual({...o02,vars:existing.vars},existing,
  'no extra host, R2 bucket, D1 table/binding, routes or assets path');
 assert.equal(existing.vars.D6_O02_OFFLINE_SNAPSHOT_ENABLED,undefined,
  'existing M02/M03 deployment remains disabled for O02');
 assert.equal(o02.keep_vars,true,'preserve existing Worker variables/secrets');
 assert.equal(o02.routes,undefined,'public route cannot be added');
});

test('O02-DEPLOY02 separate script enforces pinned clean Windows source',()=>{
 for(const flag of [
  '[ValidatePattern(', 'git rev-parse HEAD', 'git status --porcelain',
  '$ConfigFile=\'wrangler.o02-private.jsonc\'',
  "Require-Equal $Config.vars.D6_O02_OFFLINE_SNAPSHOT_ENABLED 'true'",
  '--d6-o02-offline-content',
  "'d6OfflineContentPreparation'",
  'tools/verify.mjs','--dry-run',
  'd1 execute fishing-v3-wp3-operations-test --remote --json --command',
  'if(-not $Deploy)',
  'deploy --config $ConfigFile',
  'Require-Equal $Remote.d6OfflineContentPreparation $true',
  "Require-Equal $SnapshotStatus 403",
  "Require-Equal $Status 403",
 ]){
  assert.ok(script.includes(flag),'Missing deployment gate '+flag);
 }
 assert.ok(script.indexOf('--dry-run')<
  script.lastIndexOf('deploy --config $ConfigFile'));
 assert.ok(script.indexOf('if(-not $Deploy)')<
  script.lastIndexOf('deploy --config $ConfigFile'));
 assert.match(script,/Require-Equal \$Manifest\.counts\.gear 100/);
 assert.match(script,/Require-Equal \$Manifest\.counts\.kb 60/);
 assert.match(script,/Require-Equal \$Manifest\.counts\.catches 12/);
 assert.doesNotMatch(script,/d1 migrations apply|r2 bucket (?:create|delete)/i);
 assert.match(script,/MEDIA_R2/);
 assert.match(script,/D6_M03_THUMBNAILS_ENABLED/);
});

test('O02-DEPLOY03 existing accepted M02 script cannot activate O02',()=>{
 assert.match(priorScript,/wrangler\.direct-gear-private\.jsonc/);
 assert.doesNotMatch(priorScript,/--d6-o02-offline-content/);
 assert.doesNotMatch(priorScript,/D6_O02_OFFLINE_SNAPSHOT_ENABLED/);
});

test('O02-DEPLOY04 preflight selects its own working directory',()=>{
 assert.match(script,/Set-Location \(Split-Path -Parent \$PSScriptRoot\)/,
  'PowerShell script must derive the PWA directory from its own location');
 const instructions=read('../docs/O02_PRIVATE_DEPLOYMENT.md');
 assert.doesNotMatch(instructions,/^cd pwa\s*$/m,
  'owner must never be asked to change directories');
 assert.match(instructions,/git -C \$Repo fetch origin/);
 assert.match(instructions,/Join-Path \$Repo 'pwa\\tools\\d6-o02-private-deploy\.ps1'/);
});
