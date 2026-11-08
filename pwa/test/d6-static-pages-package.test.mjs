import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {packageD6StaticPages} from '../tools/package-d6-static-pages.mjs';

const ID='0123456789abcdef0123456789abcdef';
const SHA='a'.repeat(40);
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
 await fs.symlink(x.src,alias,'dir');
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
 await fs.symlink(x.root,alias,'dir');
 await assert.rejects(packageD6StaticPages({
  source:path.join(alias,'input'),
  destination:path.join(x.src,'nested'),
  verifyRelease:x.verifyRelease,
 }),/symlinked parent/);
 await assert.rejects(fs.lstat(path.join(x.src,'nested')));
});
