import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
const config=JSON.parse(readFileSync(new URL('../wrangler.direct-gear-private.jsonc',import.meta.url),'utf8'));
const script=readFileSync(new URL('../tools/d6-m02-private-deploy.ps1',import.meta.url),'utf8');
test('M02 private deployment is approved only for existing owner test host',()=>{
 assert.equal(config.name,'fishing-d6-wp2-test');
 assert.equal(config.vars.D6_M02_MEDIA_ENABLED,'true');
 assert.deepEqual(config.r2_buckets,[{
  binding:'MEDIA_R2',bucket_name:'fishing-v3-owner-media-test',
 }]);
 assert.equal(config.routes,undefined);
 for(const key of ['D6_SOURCE_ENABLED','D6_READ_TOKEN_ENABLED','D6_SIGNER_ENABLED'])
  assert.equal(config.vars[key],'false');
});
test('M02 guided deployment builds and checks exact private source first',()=>{
 for(const marker of ['[ValidatePattern(', 'git rev-parse HEAD',
  '--d6-owner-media-upload', 'tools/verify.mjs', '--dry-run',
  'd1 execute fishing-v3-wp3-operations-test --remote --json --command',
  'if(-not $Deploy)', 'deploy --config $ConfigFile',
  'Private manifest denies anonymous requests (403)']){
  assert.ok(script.includes(marker),'Missing '+marker);
 }
 assert.ok(script.indexOf('--dry-run')<script.lastIndexOf('deploy --config $ConfigFile'));
 assert.doesNotMatch(script,/r2 bucket (?:create|delete)|d1 migrations apply/);
});