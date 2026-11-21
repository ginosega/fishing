import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {prepareM01OriginalMediaInventory}
 from '../tools/d6-historic-media-inventory.mjs';

const root=new URL('../',import.meta.url);
const expectedBytes=166411118;
const archive=new URL('../migration/d6-historic-media-inventory.json.gz',
 import.meta.url);

test('V3-M01-01 scan all 274 original photos from pinned accepted source', {
 timeout:180000,
},async()=>{
 const report=await prepareM01OriginalMediaInventory();
 assert.equal(report.format,'fish118-m01-content-photo-inventory-v1');
 assert.equal(report.sourceRevision,
  '57f35b701b10cda1eb7d567b6f2a250c7b27ef38');
 assert.deepEqual(report.counts.domains,{
  gear:{files:112,bytes:59194180},
  kb:{files:154,bytes:104289222},
  catches:{files:8,bytes:2927716},
 });
 assert.equal(report.counts.files,274);
 assert.equal(report.counts.bytes,expectedBytes);
 assert.equal(report.assets.length,274);
 assert.equal(report.counts.missingReferences,0);
 const unique=new Set();
 for(const item of report.assets){
  assert.ok(!unique.has(item.path));unique.add(item.path);
  assert.match(item.sha256,/^[a-f0-9]{64}$/);
  assert.match(item.gitBlobSha1,/^[a-f0-9]{40}$/);
  assert.ok(Number.isSafeInteger(item.bytes)&&item.bytes>0);
  assert.ok(Array.isArray(item.references));
 }
 const captures=report.assets.filter(x=>x.path.startsWith('Catches/'));
 assert.equal(captures.length,8);
 assert.ok(captures.every(x=>x.references.some(r=>r.domain==='catches')));
 // KB can legitimately refer to Gear imagery; no automatic copy/duplication.
 assert.ok(report.crossDomainPaths.every(x=>x.startsWith('Gear/')));
 assert.ok(report.counts.crossDomainFiles>=1);
 assert.ok(report.counts.knotFrames>=1);
 assert.deepEqual(report.unreferencedPaths,
  report.assets.filter(x=>!x.references.length).map(x=>x.path));
 // Output the exact manifest once for generating a source-only portable
 // checksum/ownership archive. It includes *metadata*, never image bytes.
 const humanReadable=JSON.stringify(report,null,2)+'\n';
 if(existsSync(archive)){
  assert.equal(gunzipSync(readFileSync(archive)).toString('utf8'),
   humanReadable,'Committed migration inventory differs from actual bytes');
 }else{
  console.log('M01_VERIFIED_MANIFEST_GZIP_B64='+
   gzipSync(Buffer.from(humanReadable),{mtime:0}).toString('base64'));
 }
 console.log('M01_VERIFIED_SUMMARY='+JSON.stringify({
  sourceRevision:report.sourceRevision,counts:report.counts,
  orphanPaths:report.unreferencedPaths,
  crossDomainPaths:report.crossDomainPaths,
 }));
});
test('V3-M01-02 original image source ledger is pinned and complete',()=>{
 const proof=JSON.parse(readFileSync(new URL(
  '../migration/d6-historic-media-source-blobs.json',import.meta.url),
  'utf8'));
 assert.equal(proof.sourceRevision,
  '57f35b701b10cda1eb7d567b6f2a250c7b27ef38');
 assert.equal(proof.expectedFiles,274);
 assert.equal(proof.expectedBytes,expectedBytes);
 const items=proof.assets;
 const unique=new Set(items.map(x=>x.path));
 assert.equal(unique.size,274);
 assert.equal(items.reduce((n,x)=>n+x.bytes,0),expectedBytes);
 assert.equal(items.filter(x=>x.path.startsWith('Gear/')).length,112);
 assert.equal(items.filter(x=>x.path.startsWith('KB/')).length,154);
 assert.equal(items.filter(x=>x.path.startsWith('Catches/')).length,8);
});
test('V3-M01-03 scanner cannot write provider data or silently migrate',()=>{
 const src=readFileSync(new URL('../tools/d6-historic-media-inventory.mjs',
  import.meta.url),'utf8');
 assert.doesNotMatch(src,/wrangler|cloudflare\.com|fetch\(/i);
 assert.doesNotMatch(src,/\.put\(|\.batch\(|INSERT INTO d6_media/i);
 assert.match(src,/writeFile\(destination,/);
 assert.match(src,/flag:'wx'/);
});
