import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {verifyHosted,PAGES,GATEWAY} from '../tools/compare-hosted-bytes.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const id='1'.repeat(32),rev='a'.repeat(40);
function fixture(){
 const assets={},files=[];
 const paths=['index.html','loader.js','sw.js','manifest.webmanifest',
  'releases/'+id+'/app.js','releases/'+id+'/styles.css'];
 for(const category of ['Gear/gear.json','KB/kb.json','Catches/catches.json','Gear/Lures/assets/sample.png','KB/Bass/assets/sample.png','KB/Bass/content/test.md'])
  paths.push('releases/'+id+'/content/'+category);
 paths.push('releases/'+id+'/card-thumbnails/sample.webp');
 for(const path of paths){
  const b=Buffer.from('verified '+path);assets[path]=b;
  files.push({path,bytes:b.length,sha256:hash(b)});
 }
 const manifest=Buffer.from(JSON.stringify({format:'fishing-companion-release-v2',releaseId:id,sourceRevision:rev,base:'/fishing/',files,totalBytes:files.reduce((s,f)=>s+f.bytes,0)}));
 const ptr=Buffer.from(JSON.stringify({id,sourceRevision:rev,manifest:'releases/'+id+'/manifest.json',manifestSha256:hash(manifest)}));
 assets['release.json']=ptr;assets['releases/'+id+'/manifest.json']=manifest;
 const urls=new Map();
 for(const [p,b] of Object.entries(assets)){urls.set(PAGES+p,b);urls.set(GATEWAY+p,b);}
 return urls;
}
const get=urls=>async url=>{const bytes=urls.get(url);if(!bytes)throw Error('404 '+url);return {bytes,elapsedMs:1};};

test('G1-D01: exact direct/gateway bytes, anchored manifest and 13 representative files pass',async()=>{
 const result=await verifyHosted({get:get(fixture())});
 assert.equal(result.status,'PASS');
 assert.equal(result.checkedAssetCount,13);
 assert.equal(result.manifestFiles,13);
 assert.equal(result.sourceRevision,rev);
});
test('G1-D02: gateway body tampering fails',async()=>{
 const urls=fixture();urls.set(GATEWAY+'releases/'+id+'/app.js',Buffer.from('MALICIOUS'));
 await assert.rejects(verifyHosted({get:get(urls)}),/BYTE MISMATCH/);
});
test('G1-D03: identical origin tampering that violates manifest digest fails',async()=>{
 const urls=fixture(),name='releases/'+id+'/styles.css';
 for(const root of [PAGES,GATEWAY])urls.set(root+name,Buffer.alloc(urls.get(root+name).length,0x78));
 await assert.rejects(verifyHosted({get:get(urls)}),/SHA-256 mismatch/);
});
test('G1-D04: modified manifest fails pointer-anchored SHA-256',async()=>{
 const urls=fixture(),name='releases/'+id+'/manifest.json';
 for(const root of [PAGES,GATEWAY])urls.set(root+name,Buffer.from('tampered'));
 await assert.rejects(verifyHosted({get:get(urls)}),/Manifest SHA-256 mismatch/);
});
test('G1-D05: mid-comparison release switch is never reported as PASS',async()=>{
 const urls=fixture();let reads=0;
 const read=async url=>{
  if(url.endsWith('/release.json')&&++reads>2)return {bytes:Buffer.from('different'),elapsedMs:1};
  return {bytes:urls.get(url),elapsedMs:1};
 };
 await assert.rejects(verifyHosted({get:read}),/Release changed|BYTE MISMATCH/);
});
test('G1-D06: path traversal not fetched even when explicitly requested',async()=>{
 const urls=fixture();let reached=false;
 const read=async url=>{if(url.includes('evil'))reached=true;return {bytes:urls.get(url),elapsedMs:1}};
 await assert.rejects(verifyHosted({get:read,paths:['../../evil']}),/Asset not in manifest|Unsafe asset path/);
 assert.equal(reached,false);
});
