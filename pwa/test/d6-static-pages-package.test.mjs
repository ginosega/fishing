import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {packageD6StaticPages} from '../tools/package-d6-static-pages.mjs';

const ID='0123456789abcdef0123456789abcdef';
const SHA='a'.repeat(40);
// Windows developer-mode/admin privileges are not required for directory
// junctions. The Linux CI lane continues to exercise native POSIX symlinks.
async function directoryAlias(t,target,alias){
 try{
  await fs.symlink(target,alias,process.platform==='win32'?'junction':'dir');
  return true;
 }catch(error){
  if(process.platform==='win32'&&
     (error?.code==='EPERM'||error?.code==='EACCES')){
   t.skip('Windows directory link creation is blocked by local policy; POSIX CI covers this guard');
   return false;
  }
  throw error;
 }
}
const fixture=async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'fishing-d6-stage-test-'));
 t.after(()=>fs.rm(root,{recursive:true,force:true}));
 const src=path.join(root,'input'),out=path.join(root,'upload');
 const pointer={id:ID,sourceRevision:SHA,d6ReaderCandidate:true,
  d6StaticStaging:true,pendingMedia:false,
  manifest:'releases/'+ID+'/manifest.json'};
 const manifest={releaseId:ID,sourceRevision:SHA,d6ReaderCandidate:true,
  d6StaticStaging:true,pendingMedia:false,base:'/fishing/'};
 await fs.mkdir(path.join(src,'releases',ID),{recursive:true});
 await fs.writeFile(path.join(src,'index.html'),'<html>D6 read-only</html>');
 await fs.writeFile(path.join(src,'release.json'),JSON.stringify(pointer));
 await fs.writeFile(path.join(src,pointer.manifest),JSON.stringify(manifest));
 const report={releaseId:ID,sourceRevision:SHA,files:2,bytes:123,verified:true};
 return {root,src,out,pointer,manifest,report,
  verifyRelease:async()=>report};
};

test('D6-PACK01 physically materializes exact /fishing/ subtree and no root app',async t=>{
 const x=await fixture(t);
 const result=await packageD6StaticPages({source:x.src,destination:x.out,
  verifyRelease:x.verifyRelease});
 assert.equal(result.physicalBase,'fishing/');
 assert.equal(result.deployed,false);
 assert.deepEqual(await fs.readdir(x.out),['fishing']);
 assert.equal(await fs.readFile(path.join(x.out,'fishing/index.html'),'utf8'),
  '<html>D6 read-only</html>');
 assert.equal(await fs.readFile(path.join(x.out,'fishing/release.json'),'utf8'),
  JSON.stringify(x.pointer));
 await assert.rejects(fs.stat(path.join(x.out,'index.html')));
});
test('D6-PACK02 missing staging markers and wrong scope fail closed',async t=>{
 const x=await fixture(t);
 for(const [field,value,inManifest] of [
  ['d6StaticStaging',false,false],['d6ReaderCandidate',false,false],
  ['pendingMedia',true,false],['base','/',true],
  ['d6StaticStaging',false,true],['sourceRevision','bad',true]
 ]){
  const file=path.join(x.src,inManifest?x.pointer.manifest:'release.json');
  const original=JSON.parse(await fs.readFile(file));
  await fs.writeFile(file,JSON.stringify({...original,[field]:value}));
  await assert.rejects(packageD6StaticPages({source:x.src,destination:x.out,
   verifyRelease:x.verifyRelease}),/denied/);
  await fs.writeFile(file,JSON.stringify(original));
 }
 await assert.rejects(fs.stat(x.out));
});
test('D6-PACK03 never overwrite or package inside source, including canonical dist',async t=>{
 const x=await fixture(t);
 await fs.mkdir(x.out);
 await assert.rejects(packageD6StaticPages({source:x.src,destination:x.out,
  verifyRelease:x.verifyRelease}),/already exists/);
 await assert.rejects(packageD6StaticPages({source:x.src,
  destination:path.join(x.src,'nested'),verifyRelease:x.verifyRelease}),
  /overlapping/);
});
test('D6-PACK04 verification failure leaves no upload directory',async t=>{
 const x=await fixture(t);let count=0;
 await assert.rejects(packageD6StaticPages({source:x.src,destination:x.out,
  verifyRelease:async()=>{if(++count===2)throw Error('bad copied hash');
   return x.report;}}),/bad copied hash/);
 await assert.rejects(fs.stat(x.out));
 assert.deepEqual((await fs.readdir(x.root)).sort(),['input']);
});
test('D6-PACK05 verifier must positively attest source and copied artifact',async t=>{
 const x=await fixture(t);
 await assert.rejects(packageD6StaticPages({source:x.src,destination:x.out,
  verifyRelease:async()=>({...x.report,verified:false})}),/verification failed/);
 assert.deepEqual(await fs.readdir(x.root),['input']);
});

test('D6-PACK06 production dist and nested production output are forbidden',async t=>{
 const x=await fixture(t);
 const productionDist=path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),'../dist');
 const nested=path.join(productionDist,'__d6_stage_a_should_not_exist__');
 for(const output of [productionDist,nested]){
  await assert.rejects(packageD6StaticPages({
   source:x.src,destination:output,verifyRelease:x.verifyRelease,
  }),/production release paths/);
 }
 await assert.rejects(fs.lstat(nested));
 await assert.rejects(packageD6StaticPages({
  source:productionDist,destination:x.out,verifyRelease:x.verifyRelease,
 }),/production release paths/);
});

test('D6-PACK07 symlinked destination ancestor cannot alias source directory',async t=>{
 const x=await fixture(t);
 const alias=path.join(x.root,'source-alias');
 if(!await directoryAlias(t,x.src,alias))return;
 await assert.rejects(packageD6StaticPages({
  source:x.src,destination:path.join(alias,'nested'),
  verifyRelease:x.verifyRelease,
 }),/symlinked parent/);
 await assert.rejects(fs.lstat(path.join(x.src,'nested')));
 assert.deepEqual((await fs.readdir(x.src)).sort(),
  ['index.html','release.json','releases']);
});

test('D6-PACK08 symlinked source ancestor cannot bypass overlap checks',async t=>{
 const x=await fixture(t);
 const alias=path.join(x.root,'root-alias');
 if(!await directoryAlias(t,x.root,alias))return;
 await assert.rejects(packageD6StaticPages({
  source:path.join(alias,'input'),
  destination:path.join(x.src,'nested'),
  verifyRelease:x.verifyRelease,
 }),/symlinked parent/);
 await assert.rejects(fs.lstat(path.join(x.src,'nested')));
});

test('D6-PACK09 approved owner Connection Status real-record candidate is isolated and read-only',async t=>{
 const x=await fixture(t);
 // The real D6 builder omits false optional flags; it does not serialize
 // d6StaticStaging:false. Stage A still REQUIRES explicit true.
 const {d6StaticStaging:ignoredPointer,...pointerBase}=x.pointer;
 const {d6StaticStaging:ignoredManifest,...manifestBase}=x.manifest;
 const pointer={...pointerBase,d6OwnerConnectionCandidate:true};
 const manifest={...manifestBase,d6OwnerConnectionCandidate:true};
 await fs.writeFile(path.join(x.src,'release.json'),JSON.stringify(pointer));
 await fs.writeFile(path.join(x.src,pointer.manifest),JSON.stringify(manifest));
 const result=await packageD6StaticPages({source:x.src,destination:x.out,
  verifyRelease:x.verifyRelease,mode:'owner-read-only'});
 assert.equal(result.mode,'owner-read-only');
 assert.equal(Object.hasOwn(pointer,'d6StaticStaging'),false);
 assert.equal(Object.hasOwn(manifest,'d6StaticStaging'),false);
 assert.equal(result.deployed,false);
 assert.equal(result.verified,true);
 assert.deepEqual(await fs.readdir(x.out),['fishing']);
 assert.equal(JSON.parse(await fs.readFile(
  path.join(x.out,'fishing/release.json'),'utf8'))
  .d6OwnerConnectionCandidate,true);
 await assert.rejects(fs.stat(path.join(x.out,'index.html')));
});
test('D6-PACK10 owner packaging rejects static, mixed, missing and unverified releases',async t=>{
 const x=await fixture(t);
 // The real D6 builder omits false optional flags; it does not serialize
 // d6StaticStaging:false. Stage A still REQUIRES explicit true.
 const {d6StaticStaging:ignoredPointer,...pointerBase}=x.pointer;
 const {d6StaticStaging:ignoredManifest,...manifestBase}=x.manifest;
 const pointer={...pointerBase,d6OwnerConnectionCandidate:true};
 const manifest={...manifestBase,d6OwnerConnectionCandidate:true};
 await fs.writeFile(path.join(x.src,'release.json'),JSON.stringify(pointer));
 await fs.writeFile(path.join(x.src,pointer.manifest),JSON.stringify(manifest));
 for(const [file,field,value] of [
  ['release.json','d6OwnerConnectionCandidate',false],
  ['release.json','d6StaticStaging',true],
  [pointer.manifest,'d6OwnerConnectionCandidate',false],
  [pointer.manifest,'d6StaticStaging',true],
  [pointer.manifest,'base','/fishing/__v3_owner_candidate__/'],
 ]){
  const target=path.join(x.src,file);
  const original=JSON.parse(await fs.readFile(target,'utf8'));
  await fs.writeFile(target,JSON.stringify({...original,[field]:value}));
  await assert.rejects(packageD6StaticPages({source:x.src,
   destination:x.out,verifyRelease:x.verifyRelease,
   mode:'owner-read-only'}),/denied/);
  await fs.writeFile(target,JSON.stringify(original));
 }
 await assert.rejects(packageD6StaticPages({source:x.src,
  destination:x.out,verifyRelease:x.verifyRelease,mode:'static'}),
  /denied/);
 await assert.rejects(packageD6StaticPages({source:x.src,
  destination:x.out,verifyRelease:x.verifyRelease,mode:'other'}),
  /denied/);
 await assert.rejects(packageD6StaticPages({source:x.src,
  destination:x.out,verifyRelease:async()=>({...x.report,verified:false}),
  mode:'owner-read-only'}),/verification failed/);
 await assert.rejects(fs.stat(x.out));
});
