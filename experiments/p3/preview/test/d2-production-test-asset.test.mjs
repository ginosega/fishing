import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createD2ProductionTestAsset,D2HostError} from '../src/d2-production-test-asset.mjs';
const ORIGIN='https://fishing.example.test',ID=1430581407;
const API='https://api.github.com/repos/ginosega/fishing-p3-sandbox';
const OP='p3_01234567-1234-4234-8234-123456789abc';
const MERGE='c'.repeat(40),TREE='d'.repeat(40);
const PATH='pwa/Gear/gear.json';
const content=JSON.stringify({schemaVersion:2,items:[
 {id:'p3-test-rod',name:'D2 Published Test Rod'},
]})+'\n';
const bytes=Buffer.from(content);
const gitSha=createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
const sha256=createHash('sha256').update(bytes).digest('hex');
const path='/__d2_test__/operations/'+OP+'/Gear/gear.json';
const ok=x=>({status:200,ok:true,redirected:false,json:async()=>x});
function fixture({enabled=true,wrongCommit=false,wrongBlob=false,
 badReceipt=false,wrongRepo=false,denyOwner=false}={}){
 const trace=[];
 const receipt={operationId:OP,repositoryId:ID,mergeSha:MERGE,state:'Verifying'};
 const subject=createD2ProductionTestAsset({
  origin:ORIGIN,
  enabled:()=>enabled,
  ownerSession:{authorizeStatus:async()=>{
   trace.push('owner');
   if(denyOwner)throw Error('no authenticated owner');
  }},
  readReceipt:async()=>{
   trace.push('receipt');return badReceipt?null:receipt;
  },
  issueReadToken:async args=>{
   trace.push('token');assert.deepEqual(args,{repositoryId:ID,permissions:{contents:'read'}});
   return {repositoryId:ID,token:'read-only-token-example',permissions:{contents:'read'}};
  },
  request:async(url,opts)=>{
   trace.push({url,method:opts.method});
   assert.equal(opts.method,'GET');
   assert.equal(opts.redirect,'manual');
   if(url===API)return ok({id:wrongRepo?234:ID,
    full_name:'ginosega/fishing-p3-sandbox',private:true});
   if(url===API+'/git/commits/'+MERGE)
    return ok({sha:wrongCommit?'f'.repeat(40):MERGE,tree:{sha:TREE}});
   if(url===API+'/git/trees/'+TREE+'?recursive=1')
    return ok({sha:TREE,truncated:false,tree:[
     {path:PATH,type:'blob',mode:'100644',size:bytes.length,sha:gitSha}]});
   if(url===API+'/git/blobs/'+gitSha)
    return ok({sha:gitSha,size:bytes.length,encoding:'base64',
     content:wrongBlob?Buffer.from('tamper').toString('base64'):bytes.toString('base64')});
   throw Error('Unexpected external URL');
  },
 });
 const req=new Request(ORIGIN+path,{headers:{
  Cookie:'__Host-fish_p0_session='+('a'.repeat(43)),
  'Sec-Fetch-Site':'same-origin',
 }});
 return {subject,req,trace};
}
const refused=code=>e=>e instanceof D2HostError&&e.code===code;
test('D2-H01 owner-only production-origin path serves byte-identical merged sandbox Gear',async()=>{
 const x=fixture();
 const response=await x.subject.serve(x.req);
 assert.equal(response.status,200);
 assert.equal(response.headers.get('Cache-Control'),'private, no-store, max-age=0');
 assert.equal(response.headers.get('X-D2-Sandbox-Merge-Sha'),MERGE);
 assert.equal(response.headers.get('X-D2-Sandbox-Blob-Sha256'),sha256);
 assert.deepEqual(Buffer.from(await response.arrayBuffer()),bytes);
 assert.equal(x.trace.filter(z=>z.method).length,4);
 assert.equal(x.trace[0],'owner');
 assert(!response.headers.has('Set-Cookie'));
});
test('D2-H02 test path disabled before owner lookup, receipt, GitHub read',async()=>{
 const x=fixture({enabled:false});
 await assert.rejects(x.subject.serve(x.req),refused('TEST_HOST_DISABLED'));
 assert.equal(x.trace.length,0);
});
test('D2-H03 one exact path, method and origin only',async()=>{
 for(const u of [
  new Request(ORIGIN+'/__d2_test__/operations/invalid/Gear/gear.json'),
  new Request(ORIGIN+'/__d2_test__/operations/'+OP+'/KB/kb.json'),
  new Request(ORIGIN+path+'?token=123'),
  new Request('https://attacker.invalid'+path),
  new Request(ORIGIN+path,{method:'POST'}),
 ]){
  const x=fixture();
  await assert.rejects(x.subject.serve(u),refused('INVALID_REQUEST'));
  assert.equal(x.trace.length,0);
 }
});
test('D2-H04 no owner session, durable merge receipt or expected repo refuses before bytes',async()=>{
 for(const opts of [{denyOwner:true},{badReceipt:true},{wrongRepo:true}]){
  const x=fixture(opts);
  await assert.rejects(x.subject.serve(x.req),e=>e instanceof Error);
  assert(!x.trace.some(a=>typeof a==='object'&&a.url?.includes('/git/blobs/')));
 }
});
test('D2-H05 wrong merged commit or tampered Git blob never produces hosted output',async()=>{
 for(const opts of [{wrongCommit:true},{wrongBlob:true}]){
  const x=fixture(opts);
  await assert.rejects(x.subject.serve(x.req),e=>e instanceof Error);
 }
});
test('D2-H06 no GitHub write, owner signature, Cloudflare binding or public release',()=>{
 const x=fixture();assert.deepEqual(Object.keys(x.subject),['serve']);
 const source=createD2ProductionTestAsset.toString();
 assert(!source.includes("merge_method"));
 assert(!source.includes("POST /"));
});
