import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {readFileSync} from 'node:fs';
import {selectD6PublicReader,D6_READER_BASE,
 D6_READER_ORIGIN as PROD,D6_WP2_STAGING_ORIGIN as WP2,
 D6_WP3_STAGING_ORIGIN as WP3}
 from '../src/d6-public-reader.mjs';
import {createD6OwnerSessionReadiness}
 from '../src/d6-owner-session-readiness.mjs';
import {createD6CanonicalSourceClient}
 from '../src/d6-canonical-authoring-source.mjs';
import {packageD6StaticPages}
 from '../tools/package-d6-static-pages.mjs';

const ID='0123456789abcdef0123456789abcdef',SHA='a'.repeat(40);
const pointer=()=>({
 id:ID,sourceRevision:SHA,d6ReaderCandidate:true,
 d6OwnerConnectionCandidate:true,d6OwnerEditorPreview:true,
 d6Wp3Staging:true,pendingMedia:false,
 manifest:'releases/'+ID+'/manifest.json',
});
const manifest=()=>({
 releaseId:ID,sourceRevision:SHA,base:'/fishing/',
 d6ReaderCandidate:true,d6OwnerConnectionCandidate:true,
 d6OwnerEditorPreview:true,d6Wp3Staging:true,pendingMedia:false,
});
async function setup(t){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'fishing-wp3-pages-'));
 t.after(()=>fs.rm(root,{recursive:true,force:true}));
 const source=path.join(root,'built'),destination=path.join(root,'pages-upload');
 const p=pointer(),m=manifest();
 await fs.mkdir(path.join(source,'releases',ID),{recursive:true});
 await fs.writeFile(path.join(source,'index.html'),'<html>WP3 isolated candidate</html>');
 await fs.writeFile(path.join(source,'release.json'),JSON.stringify(p));
 await fs.writeFile(path.join(source,p.manifest),JSON.stringify(m));
 const evidence={releaseId:ID,sourceRevision:SHA,files:2,bytes:123,
  verified:true};
 return {root,source,destination,p,m,
  verifyRelease:async()=>evidence};
}
const read=v=>JSON.parse(v);
async function set(x,which,key,val){
 const file=which==='pointer'?'release.json':x.p.manifest;
 const original=read(await fs.readFile(path.join(x.source,file),'utf8'));
 const replacement={...original,[key]:val};
 await fs.writeFile(path.join(x.source,file),JSON.stringify(replacement));
 return async()=>fs.writeFile(path.join(x.source,file),JSON.stringify(original));
}
const pack=x=>packageD6StaticPages({source:x.source,destination:x.destination,
 verifyRelease:x.verifyRelease,mode:'wp3-owner-preview'});

test('WP3-PAGES01 pinned reader is WP3-only and release/manifest-stamped',()=>{
 const good={
  enabled:true,wp3Staging:true,
  root:WP3+D6_READER_BASE,release:pointer(),manifest:manifest(),
 };
 const reader=selectD6PublicReader(good);
 assert.deepEqual(Object.keys(reader),['enabled','readerOnly']);
 assert.equal(reader.readerOnly,true);
 assert(Object.isFrozen(reader));
 for(const invalid of [
  {root:PROD+D6_READER_BASE},
  {root:WP2+D6_READER_BASE},
  {wp2Staging:true},
  {staticStaging:true},
  {wp3Staging:false},
  {release:{...pointer(),d6Wp3Staging:false}},
  {manifest:{...manifest(),d6Wp3Staging:false}},
  {release:{...pointer(),d6Wp2Staging:true}},
  {manifest:{...manifest(),d6Wp2Staging:true}},
 ]){
  assert.throws(()=>selectD6PublicReader({...good,...invalid}),
   /D6 staged origin|D6 reader scope/);
 }
});

test('WP3-PAGES02 exact owner session and canonical source clients reject mixed host and modes',()=>{
 const req=async()=>{throw Error('No remote access in this test')};
 const session={root:WP3+'/fishing/',request:req,
  enabled:()=>false,online:()=>false,wp3Staging:true};
 const actor=createD6OwnerSessionReadiness(session);
 assert.deepEqual(Object.keys(actor),['check']);
 for(const bad of [{root:PROD+'/fishing/'},
  {root:WP2+'/fishing/'},{wp2Staging:true}]){
  assert.throws(()=>createD6OwnerSessionReadiness({...session,...bad}));
 }
 const source={...session,expectedReleaseRevision:SHA};
 const client=createD6CanonicalSourceClient(source);
 assert.deepEqual(Object.keys(client),['load']);
 for(const bad of [{root:PROD+'/fishing/'},
  {root:WP2+'/fishing/'},{wp2Staging:true}]){
  assert.throws(()=>createD6CanonicalSourceClient({...source,...bad}));
 }
});

test('WP3-PAGES03 physical Pages upload exactly one fishing/ subtree, no deploy',async t=>{
 const x=await setup(t);
 const r=await pack(x);
 assert.equal(r.mode,'wp3-owner-preview');
 assert.equal(r.deployed,false);
 assert.equal(r.verified,true);
 assert.equal(r.sourceRevision,SHA);
 assert.deepEqual(await fs.readdir(x.destination),['fishing']);
 assert.equal(await fs.readFile(path.join(x.destination,'fishing/index.html'),'utf8'),
  '<html>WP3 isolated candidate</html>');
 assert.deepEqual(read(await fs.readFile(
  path.join(x.destination,'fishing/release.json'),'utf8')),x.p);
 await assert.rejects(fs.stat(path.join(x.destination,'index.html')));
});

test('WP3-PAGES04 refuse mixed, missing, wrong and production/WP2 release markers',async t=>{
 const x=await setup(t);
 const cases=[
  ['pointer','d6Wp3Staging',false],
  ['manifest','d6Wp3Staging',false],
  ['pointer','d6Wp2Staging',true],
  ['manifest','d6Wp2Staging',true],
  ['pointer','d6OwnerEditorPreview',false],
  ['manifest','d6OwnerEditorPreview',false],
  ['pointer','d6OwnerConnectionCandidate',false],
  ['manifest','d6OwnerConnectionCandidate',false],
  ['pointer','d6ReaderCandidate',false],
  ['manifest','d6ReaderCandidate',false],
  ['pointer','d6StaticStaging',true],
  ['manifest','d6StaticStaging',true],
  ['pointer','pendingMedia',true],
  ['manifest','pendingMedia',true],
  ['manifest','base','/fishing/v2-preview/'],
 ];
 for(const [which,key,value] of cases){
  const undo=await set(x,which,key,value);
  await assert.rejects(pack(x),/denied/,
   'must deny '+which+'/'+key+'='+value);
  await undo();
 }
 await assert.rejects(fs.stat(x.destination));
});

test('WP3-PAGES05 wrong package mode or verification fails without output',async t=>{
 const x=await setup(t);
 for(const mode of ['static','owner-read-only','invalid']){
  await assert.rejects(packageD6StaticPages({
   source:x.source,destination:x.destination,mode,
   verifyRelease:x.verifyRelease,
  }),/denied/);
 }
 await assert.rejects(packageD6StaticPages({
  source:x.source,destination:x.destination,mode:'wp3-owner-preview',
  verifyRelease:async()=>({...await x.verifyRelease(),verified:false}),
 }),/verification failed/);
 await assert.rejects(fs.stat(x.destination));
});

test('WP3-PAGES06 local build defines an exclusive WP3 owner/editor marker, never auto-deploys',()=>{
 const build=readFileSync(new URL('../tools/build.mjs',import.meta.url),'utf8');
 const entry=readFileSync(new URL('../src/entry.mjs',import.meta.url),'utf8');
 const pages=readFileSync(new URL('../tools/package-d6-static-pages.mjs',import.meta.url),'utf8');
 assert.match(build,/--d6-wp3-hosted-candidate/);
 assert.match(build,/d6Wp3Staging&&\(!d6ReaderCandidate/);
 assert.match(build,/__FISHING_D6_WP3_STAGING__/);
 assert.match(build,/d6Wp3Staging:true/);
 assert.match(entry,/__FISHING_D6_WP3_STAGING__===true/);
 assert.match(entry,/wp3Staging:d6Wp3Staging/);
 assert.match(pages,/wp3-owner-preview/);
 assert.doesNotMatch(build,/wrangler\s+deploy|pages\s+deploy/);
});
