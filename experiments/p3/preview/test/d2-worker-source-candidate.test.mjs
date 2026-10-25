import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {prepareChange} from '../../../../pwa/src/handoff.mjs';
import {createD2WorkerGearCandidate,D2SourceError} from '../src/d2-worker-source-candidate.mjs';
const ID=1430581407,API='https://api.github.com/repos/ginosega/fishing-p3-sandbox';
const MAIN='a'.repeat(40),TREE='b'.repeat(40),OP='p3_01234567-1234-4234-8234-123456789abc';
const original={id:'p3-test-rod',category:'rods-reels',type:'Spinning rod',name:'P3 Test Rod',manufacturer:'Fixture Only'};
const source={
 'pwa/Gear/gear.json':{schemaVersion:2,items:[original]},
 'pwa/KB/kb.json':{schemaVersion:2,entities:[{id:'location-p3-test-lake',type:'location',name:'P3 Test Lake',content:'KB/Locations/content/P3 Test Lake.md'}]},
 'pwa/Catches/catches.json':{schemaVersion:2,catches:[]},
 'pwa/KB/Locations/content/P3 Test Lake.md':'# P3 Test Lake\n',
};
const reply=(value,status=200)=>({ok:status===200,status,redirected:false,json:async()=>value});
const sha1=bytes=>createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
const files=(all=source)=>{
 const blobs={};
 const tree=Object.entries(all).map(([path,data])=>{
  const bytes=Buffer.from(typeof data==='string'?data:JSON.stringify(data));
  const sha=sha1(bytes);
  blobs[sha]={sha,size:bytes.length,encoding:'base64',content:bytes.toString('base64')};
  return {path,type:'blob',mode:'100644',size:bytes.length,sha};
 });
 return {blobs,tree};
};
function build({write=false,read=true,base=MAIN,moveAfter=false,mutateSource={},unsafeRepo=false,
 tokenScope=true,modifyBlob=false,treeTruncated=false}={}){
 const latest={...structuredClone(source),...mutateSource};
 const {blobs,tree}=files(latest);
 const trace=[];let mainReads=0;
 const request=async(url,opt)=>{
  trace.push({url,method:opt.method,redirect:opt.redirect});
  assert(url===API||url.startsWith(API+'/'),'request cannot select arbitrary repository');
  assert.equal(opt.method,'GET');
  assert.equal(opt.redirect,'manual');
  assert.equal(opt.headers.Authorization,'Bearer sandbox-read-token-example');
  if(url===API)return reply({id:unsafeRepo?13:ID,full_name:'ginosega/fishing-p3-sandbox',private:true});
  if(url===API+'/git/ref/heads/main'){
   mainReads++;return reply({object:{sha:moveAfter&&mainReads>1?'f'.repeat(40):base}});
  }
  if(url===API+'/git/commits/'+MAIN)return reply({sha:MAIN,tree:{sha:TREE}});
  if(url===API+'/git/trees/'+TREE+'?recursive=1')return reply({sha:TREE,truncated:treeTruncated,tree});
  if(url.startsWith(API+'/git/blobs/')){
   const b=blobs[url.slice((API+'/git/blobs/').length)];
   if(!b)return reply({},404);
   return reply(modifyBlob?{...b,content:Buffer.from('malicious mutation').toString('base64')}:b);
  }
  throw Error('Unexpected mock request');
 };
 const subject=createD2WorkerGearCandidate({
  request,issueReadToken:async args=>{
   trace.push({issued:args});
   return {repositoryId:ID,token:'sandbox-read-token-example',
    permissions:{contents:tokenScope?'read':'write'}};
  },sourceEnabled:()=>read,
 });
 return {subject,trace,mainReads:()=>mainReads};
}
const packageFor=async(change={name:'P3 Test Rod Updated'},base=original)=>
 prepareChange({
  domain:'gear',operation:'edit',id:'p3-test-rod',
  baseRecord:base,record:{...base,...change},
  sourceRevision:MAIN,
 });
const isDenied=code=>e=>e instanceof D2SourceError&&e.code===code;
test('D2-S01 real PWA promoter yields one validated Gear/gear.json write with exact source SHA',async()=>{
 const pkg=await packageFor();const x=build();
 const plan=await x.subject.plan({package:pkg,expectedMainSha:MAIN,operationId:OP});
 assert.equal(plan.validated,true);
 assert.equal(plan.operationId,OP);
 assert.equal(plan.repositoryId,ID);
 assert.equal(plan.sourceRevision,MAIN);
 assert.equal(plan.changes.length,1);
 assert.equal(plan.changes[0].path,'Gear/gear.json');
 const next=JSON.parse(plan.changes[0].body);
 assert.equal(next.items.length,1);
 assert.equal(next.items[0].name,'P3 Test Rod Updated');
 assert.equal(next.items[0].manufacturer,'Fixture Only');
 assert.equal(x.mainReads(),2);
 assert(!JSON.stringify(plan).includes('sandbox-read-token-example'));
 assert(x.trace.every(t=>!t.method||t.method==='GET'));
});
test('D2-S02 proposed authenticated accepted operation can use same read-only validator',async()=>{
 const pkg=await packageFor();
 const x=build();
 const v=await x.subject.validate({snapshot:{package:pkg,media:[]},repositoryId:ID});
 assert.deepEqual(v,{valid:true,repositoryId:ID,sourceRevision:MAIN});
 assert.equal(x.mainReads(),2);
});
test('D2-S03 feature gate off before token minting, source retrieval or mutation',async()=>{
 const x=build({read:false});
 await assert.rejects(x.subject.plan({package:await packageFor(),expectedMainSha:MAIN,operationId:OP}),
  isDenied('SOURCE_DISABLED'));
 assert.equal(x.trace.length,0);
});
test('D2-S04 forged issuer token grant and wrong immutable repo deny before manifests',async()=>{
 for(const bad of [{unsafeRepo:true,code:'REPOSITORY_DENIED'},
  {tokenScope:false,code:'READ_SCOPE_DENIED'}]){
  const x=build(bad);
  await assert.rejects(x.subject.plan({package:await packageFor(),
   expectedMainSha:MAIN,operationId:OP}),isDenied(bad.code));
  assert(!x.trace.some(t=>t.url?.includes('/git/blobs/')));
 }
});
test('D2-S05 mismatched or moving main is conflict, no candidate returned',async()=>{
 const first=build({base:'c'.repeat(40)});
 await assert.rejects(first.subject.plan({package:await packageFor(),expectedMainSha:MAIN,
  operationId:OP}),isDenied('MAIN_MOVED'));
 const second=build({moveAfter:true});
 await assert.rejects(second.subject.plan({package:await packageFor(),
  expectedMainSha:MAIN,operationId:OP}),isDenied('MAIN_MOVED'));
});
test('D2-S06 corrupted Git blob contents and truncated source tree fail closed',async()=>{
 for(const invalid of [
  {modifyBlob:true,code:'BLOB_DIGEST_DENIED'},
  {treeTruncated:true,code:'TREE_UNAVAILABLE'},
 ]){
  const x=build(invalid);
  await assert.rejects(x.subject.plan({package:await packageFor(),
   expectedMainSha:MAIN,operationId:OP}),isDenied(invalid.code));
 }
});
test('D2-S07 missing known narrative asset in immutable source denies',async()=>{
 const bad=structuredClone(source);delete bad['pwa/KB/Locations/content/P3 Test Lake.md'];
 const x=build({mutateSource:bad});
 // Remove asset explicitly since merging in build() preserves original.
 const y=build({mutateSource:{'pwa/KB/kb.json':{
  schemaVersion:2,entities:[{id:'location-p3-test-lake',type:'location',
   name:'P3 Test Lake',content:'KB/Locations/content/Missing.md'}]}}});
 await assert.rejects(y.subject.plan({package:await packageFor(),expectedMainSha:MAIN,
  operationId:OP}),isDenied('MISSING_REFERENCED_FILE'));
 assert(x);
});
test('D2-S08 original base-record conflict is never silently overwritten',async()=>{
 const sourceVariant={...original,manufacturer:'Somebody Else Updated It'};
 const x=build({mutateSource:{'pwa/Gear/gear.json':{schemaVersion:2,items:[sourceVariant]}}});
 const pkg=await packageFor({manufacturer:'My Version'});
 await assert.rejects(x.subject.plan({package:pkg,expectedMainSha:MAIN,operationId:OP}),
  isDenied('BASE_HASH_DENIED'));
});
test('D2-S09 no-op, content outside Gear, new records and media change are unavailable',async()=>{
 const cases=[
  await packageFor({name:original.name}),
  {...await packageFor(),id:'other-record'},
  {...await packageFor(),picture:{action:'remove',base:{$absent:true}}},
  {...await packageFor(),notes:{action:'replace',path:'Gear/Rods-Reels/content/foo.md',body:'x',baseSha256:'e'.repeat(64)}},
  {...await packageFor(),operation:'add'},
 ];
 for(const pkg of cases){
  const x=build();
  await assert.rejects(x.subject.plan({package:pkg,expectedMainSha:MAIN,operationId:OP}),
   e=>e instanceof D2SourceError);
 }
});
test('D2-S10 published PR validation must independently pin exact main and operation',async()=>{
 const pkg=await packageFor();
 const x=build();
 for(const input of [
  {package:pkg,expectedMainSha:'g'.repeat(40),operationId:OP},
  {package:pkg,expectedMainSha:MAIN,operationId:'invalid'},
 ]){
  await assert.rejects(x.subject.plan(input),isDenied('INVALID_REQUEST'));
 }
 await assert.rejects(x.subject.validate({snapshot:{package:pkg,media:[]},
  repositoryId:1350909744}),isDenied('INVALID_REQUEST'));
});
