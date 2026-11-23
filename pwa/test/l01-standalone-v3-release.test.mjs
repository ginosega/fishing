import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';
import {execFile} from 'node:child_process';
import vm from 'node:vm';
import {verify} from '../tools/verify.mjs';
import {validateManifest} from '../src/release.mjs';

const exec=promisify(execFile);
const builder=fileURLToPath(new URL('../tools/build.mjs',import.meta.url));
const revision='a'.repeat(40);
const flags=[
 '--base=/fishing/',
 '--source-revision='+revision,
 '--d6-reader-candidate',
 '--d6-wp2-hosted-candidate',
 '--d6-owner-connection-candidate',
 '--d6-owner-editor-preview',
 '--d6-direct-gear-save',
 '--d6-direct-kb-save',
 '--d6-direct-catch-save',
 '--d6-owner-media-upload',
 '--d6-r2-card-thumbnails',
 '--d6-o02-offline-content',
 '--d6-o03-offline-reading',
 '--d6-standalone-v3',
];

test('L01-BUILD01 standalone V3 contains only verified software, never frozen records/images or V2 cache reuse', {timeout:120000},async()=>{
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'fishing-l01-'));
 try{
  const out=path.join(tmp,'standalone');
  await exec(process.execPath,[builder,'--out='+out,...flags],{
   timeout:110000,maxBuffer:1024*1024,
  });
  const pointer=JSON.parse(await fs.readFile(path.join(out,'release.json'),'utf8'));
  const manifest=JSON.parse(await fs.readFile(path.join(out,pointer.manifest),'utf8'));
  assert.equal(pointer.standaloneV3,true);
  assert.equal(manifest.standaloneV3,true);
  assert.equal(manifest.format,'fishing-companion-software-v3');
  assert.equal(manifest.counts,undefined);
  assert.equal(manifest.cardThumbnails,null);
  assert.equal(await fs.stat(path.join(out,'releases',pointer.id,'content'))
   .then(()=>true,()=>false),false);
  assert.equal(await fs.stat(path.join(out,'releases',pointer.id,'card-thumbnails'))
   .then(()=>true,()=>false),false);
  assert(manifest.files.every(item=>!/(?:^|\/)(?:content|card-thumbnails)\//.test(item.path)));
  const report=await verify(out);
  assert.equal(report.verified,true);
  assert.equal(report.counts,null);
  const html=await fs.readFile(path.join(out,'index.html'),'utf8');
  const loader=await fs.readFile(path.join(out,'loader.js'),'utf8');
  const worker=await fs.readFile(path.join(out,'sw.js'),'utf8');
  const app=await fs.readFile(path.join(out,'releases',pointer.id,'app.js'),'utf8');
  assert.doesNotMatch(app,/fishing-companion-change-v2/);
  assert.match(app,/V3_LEGACY_GITHUB_AUTHORING_DISABLED/);
  assert.match(app,/V3_LEGACY_GITHUB_CHANGE_PACKAGE_DISABLED/);
  assert.doesNotMatch(app,/Canonical GitHub authoring source not verified/);
  // Retired GitHub content-publication controls must not ship in the V3 UI.
  for(const legacy of [/Repository picture path/,/Copy Changes/,
   /Open the repository upload folder/,/manual(?:ly)? uploaded to (?:the )?repository/i,
   /Prepared change package/])
   assert.doesNotMatch(app,legacy);
  assert.match(app,/Remove picture from item/);
  assert.doesNotMatch(html,/V2 preview|Pending media/);
  assert.match(loader,/fishing-companion-v3/);
  assert.match(loader,/Standalone V3 software manifest required/);
  assert.match(loader,/standaloneV3/);
  assert.doesNotMatch(loader,/fishing-companion-v2/);
  assert.match(worker,/fishing-v3-software:/);
  // Runtime behavior matters: a dormant string in the minifier output is
  // not permission to read V2 caches. Never touch the owner's old site data.
  const handlers=new Map(),opened=[];
  const caches={keys:async()=>['fishing-v2:/fishing/:offline:preserve'],
   open:async name=>{opened.push(name);
    return {match:async()=>null,put:async()=>{},delete:async()=>false};}};
  const self={registration:{scope:'https://example.test/fishing/'},
   addEventListener:(name,callback)=>handlers.set(name,callback),
   clients:{matchAll:async()=>[],claim:async()=>{}},skipWaiting:async()=>{}};
  vm.runInNewContext(worker,{self,caches,URL,Response,TextEncoder,TextDecoder,crypto:globalThis.crypto,console});
  const message=handlers.get('message');
  assert.equal(typeof message,'function');
  let reply,pending;
  message({data:{type:'V3_READ_MODE'},ports:[{postMessage:value=>{reply=value;}}],
   waitUntil:value=>{pending=value;}});
  await pending;
  assert.equal(reply?.mode,'Automatic');
  message({data:{type:'STATUS'},ports:[{postMessage:value=>{reply=value;}}],
   waitUntil:value=>{pending=value;}});
  await pending;
  assert.equal(reply?.type,'FISHING_V3_STATUS');
  assert.equal(reply?.status?.state,'Incomplete');
  assert(opened.length>0);
  assert(opened.every(name=>name.startsWith('fishing-v3-software:')),
   'standalone V3 never opens V2 software caches');
  const invalid={...manifest,
   files:[...manifest.files,{
    path:'releases/'+pointer.id+'/content/Gear/gear.json',
    bytes:1,sha256:'b'.repeat(64),
   }],totalBytes:manifest.totalBytes+1};
  assert.throws(()=>validateManifest(invalid,pointer,'/fishing/'),
   /Standalone V3 contains frozen content/);
 }finally{
  await fs.rm(tmp,{recursive:true,force:true});
 }
});
