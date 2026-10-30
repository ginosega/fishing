import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {formatV3Diagnostics} from '../src/diagnostics.mjs';

test('D5-C01 Copy Diagnostics contains only bounded nonsecret public/release facts',()=>{
 const release='a'.repeat(32),source='b'.repeat(40);
 const output=formatV3Diagnostics({
  releaseId:release,sourceRevision:source,mode:'Work Offline',online:false,
  offline:{state:'Ready',releaseId:release,files:575,bytes:123456789,
   message:'secret-csrf-private-key-draft-filename'},
  publicationState:'Live',
  userAgent:'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/122 Edg/122 token-in-UA',
  storageUsed:98765,storageQuota:98765432,
  csrf:'private-key',operationId:'p3_secrettoken',draft:'private notes',
 });
 for(const expected of ['App release: '+release,'Source revision: '+source,
  'Browser: Edge','Platform: Windows','Reading mode: Work Offline',
  'Browser network: Offline','Offline library: Ready',
  'Offline files: 575','Offline bytes: 123456789',
  'Publication state: Live','Storage used (approximate bytes): 98765'])
  assert(output.includes(expected),expected);
 for(const forbidden of ['csrf','secret','draft','private','token','p3_','filename'])
  assert(!output.toLowerCase().includes(forbidden),forbidden);
});
test('D5-C02 untrusted diagnostic fields are rejected, not interpolated',()=>{
 const output=formatV3Diagnostics({
  releaseId:'my-password',sourceRevision:'../secret',mode:'danger',
  online:'yes',offline:{state:'Bad',releaseId:'blob:secret',
   files:-1,bytes:NaN},publicationState:'API_KEY',userAgent:'password',
  storageUsed:-5,storageQuota:Infinity,
 });
 assert(output.includes('App release: Unavailable'));
 assert(output.includes('Source revision: Unavailable'));
 assert(output.includes('Reading mode: Automatic'));
 assert(output.includes('Browser network: Unavailable'));
 assert(output.includes('Offline files: Unavailable'));
 assert(output.includes('Publication state: Unavailable'));
 assert(!output.includes('password'));
 assert(!output.includes('secret'));
 assert(!output.includes('API_KEY'));
});
test('D5-C03 diagnostics UI is V3-only and never serializes owner operations or drafts',()=>{
 const ui=readFileSync(new URL('../src/ui.mjs',import.meta.url),'utf8');
 assert(ui.includes('if(v3Mode){\n  const details='));
 assert(ui.includes("button('Copy diagnostics'"));
 assert(ui.includes('formatV3Diagnostics({'));
 assert(ui.includes('publicationState:ownerController?.current()?.publication'));
 assert(!ui.includes('operationId:ownerController?.current()?.operationId'));
 assert(!ui.includes('JSON.stringify(ownerController?.current())'));
});
