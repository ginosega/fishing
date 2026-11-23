import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';
import {execFile} from 'node:child_process';
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
  assert.doesNotMatch(html,/V2 preview|Pending media/);
  assert.match(loader,/fishing-companion-v3/);
  assert.doesNotMatch(loader,/fishing-companion-v2/);
  assert.match(worker,/fishing-v3-software:/);
  assert.doesNotMatch(worker,/fishing-v2:/);
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
