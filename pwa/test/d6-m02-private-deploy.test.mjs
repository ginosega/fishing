import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
const config=JSON.parse(readFileSync(new URL('../wrangler.direct-gear-private.jsonc',import.meta.url),'utf8'));
const script=readFileSync(new URL('../tools/d6-m02-private-deploy.ps1',import.meta.url),'utf8');
test('M02 private deployment is approved only for existing owner test host',()=>{
 assert.equal(config.name,'fishing-d6-wp2-test');
 assert.equal(config.vars.D6_M02_MEDIA_ENABLED,'true');
 assert.equal(config.vars.D6_M03_THUMBNAILS_ENABLED,'true');
 assert.deepEqual(config.images,{binding:'IMAGES'});
 assert.deepEqual(config.r2_buckets,[{
  binding:'MEDIA_R2',bucket_name:'fishing-v3-owner-media-test',
 }]);
 assert.equal(config.routes,undefined);
 for(const key of ['D6_SOURCE_ENABLED','D6_READ_TOKEN_ENABLED','D6_SIGNER_ENABLED'])
  assert.equal(config.vars[key],'false');
});
test('M02 guided deployment builds and checks exact private source first',()=>{
 for(const marker of ['[ValidatePattern(', 'git rev-parse HEAD',
  '--d6-owner-media-upload', '--d6-r2-card-thumbnails',
  "Require-Equal $Config.images.binding 'IMAGES'", 'tools/verify.mjs', '--dry-run',
  'd1 execute fishing-v3-wp3-operations-test --remote --json --command',
  'if(-not $Deploy)', 'deploy --config $ConfigFile',
  'Private manifest denies anonymous requests (403)']){
  assert.ok(script.includes(marker),'Missing '+marker);
 }
 assert.ok(script.indexOf('--dry-run')<script.lastIndexOf('deploy --config $ConfigFile'));
 assert.match(script,/Require-AtLeast \(\[int\]\$D1\.\$key\)/,
  'new uploads must not fail the historical-total baseline');
 assert.match(script,/Require-Equal \(\[int\]\$D1\.\$key\)/,
  'original historical associations and content counts stay exact');
 assert.match(script,/@\('associations',276\)/);
 assert.match(script,/historical=0\) AS new_refs/);
 assert.match(script,/\$D1\.historical\+\[int\]\$D1\.new_refs/);
 assert.doesNotMatch(script,/@\('historical',276\)/,
  'original M01 media associations may be replaced by new ones');
 assert.doesNotMatch(script,/r2 bucket (?:create|delete)|d1 migrations apply/);
});