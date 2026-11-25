import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const build=readFileSync(new URL('../tools/build.mjs',import.meta.url),'utf8');
const buildPath=fileURLToPath(new URL('../tools/build.mjs',import.meta.url));

test('M02 owner-media build flag remains explicit with immutable matching identities',()=>{
 assert.match(build,/d6OwnerMediaUpload=true/);
 assert.match(build,/__FISHING_D6_OWNER_MEDIA_UPLOAD__/);
 assert.equal((build.match(/d6OwnerMediaUpload\?\{d6OwnerMediaUpload:true\}/g)||[]).length,3,
  'source digest, release and manifest must all include the media opt-in');
 const entry=readFileSync(new URL('../src/entry.mjs',import.meta.url),'utf8');
 assert.match(entry,/__FISHING_D6_OWNER_MEDIA_UPLOAD__===true/);
 assert.match(entry,/settings\.release\?\.d6OwnerMediaUpload!==true/);
 assert.match(entry,/settings\.manifest\?\.d6OwnerMediaUpload!==true/);
});

test('A01 rejects obsolete partial-build arguments',()=>{
 for(const args of [
  ['--d6-owner-media-upload'],
  ['--d6-owner-media-upload','--d6-reader-candidate',
   '--d6-owner-connection-candidate','--d6-wp2-hosted-candidate',
   '--d6-owner-editor-preview','--d6-direct-gear-save','--d6-direct-kb-save'],
 ]) {
  const run=spawnSync(process.execPath,[buildPath,...args],{encoding:'utf8'});
  assert.equal(run.status,1);
  assert.match(run.stderr,/Unsupported build option/);
 }
});
