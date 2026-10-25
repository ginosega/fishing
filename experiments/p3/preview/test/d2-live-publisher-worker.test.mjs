import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createD2SandboxHostProof,D2HostProofError} from '../src/d2-sandbox-host-proof.mjs';
import {createD2LivePublisherWorker} from '../src/d2-live-publisher-worker.mjs';
const ID=1430581407,ORIGIN='https://fishing-v3-test.example';
const MERGE='d'.repeat(40),TREE='e'.repeat(40);
const OP='p3_01234567-1234-4234-8234-123456789abc';
const PATH='/__d2_test__/operations/'+OP+'/Gear/gear.json';
const FILE='pwa/Gear/gear.json';
const API='https://api.github.com/repos/ginosega/fishing-p3-sandbox';
const BYTES=new TextEncoder().encode('{"fixture":"private sandbox test"}\n');
const HASH=createHash('sha256').update(BYTES).digest('hex');
const BLOB=createHash('sha1').update(Buffer.concat([
 Buffer.from('blob '+BYTES.length+'\0'),Buffer.from(BYTES),
])).digest('hex');
const expected={
 repositoryId:ID,operationId:OP,mergeSha:MERGE,expectedPath:FILE,
 canonicalLive:false,
};
function fixture({changeBytes=false,changeSha=false,changeStatus=false}={}){
 const calls=[];
 let proof;
 const store={get:async id=>id===OP?{
  operationId:OP,state:changeStatus?'Accepted':'Verifying',
  mergeSha:MERGE,workflowRunId:443311,
 }:null};
 const requestGitHub=async url=>{
  calls.push(url);
  let data;
  if(url===API)data={id:ID,private:true,full_name:'ginosega/fishing-p3-sandbox'};
  else if(url===API+'/git/ref/heads/main')data={object:{sha:MERGE}};
  else if(url===API+'/git/commits/'+MERGE)data={sha:MERGE,tree:{sha:TREE}};
  else if(url===API+'/git/trees/'+TREE+'?recursive=1')
   data={sha:TREE,truncated:false,tree:[{path:FILE,sha:BLOB,type:'blob',mode:'100644',size:BYTES.length}]};
  else if(url===API+'/git/blobs/'+BLOB)
   data={sha:BLOB,encoding:'base64',size:BYTES.length,
    content:Buffer.from(BYTES).toString('base64')};
  else throw Error('Nonallowlisted GitHub read');
  return {ok:true,status:200,redirected:false,json:async()=>data};
 };
 const requestHosted=async (url,options)=>{
  assert.equal(url,ORIGIN+PATH);
  assert.equal(options.method,'GET');
  assert.equal(options.cache,'no-store');
  const request=new Request(url,{headers:options.headers});
  assert.equal(await proof.authorizeProbe(request,OP),true);
  return new Response(changeBytes?'wrong':BYTES,{
   status:200,
   headers:{'X-D2-Sandbox-Merge-Sha':MERGE,
    'X-D2-Sandbox-Blob-Sha256':changeSha?'0'.repeat(64):HASH,
    'Cache-Control':'private, no-store'},
  });
 };
 proof=createD2SandboxHostProof({
  origin:ORIGIN,key:'x'.repeat(40),store,
  issueReadToken:async()=>({repositoryId:ID,
   permissions:{contents:'read'},token:'server-only-token'}),
  requestGitHub,requestHosted,now:()=>100000,
 });
 return {proof,calls};
}
const denied=code=>e=>e instanceof D2HostProofError&&e.code===code;
test('D2-L01 external exact production-origin bytes match immutable sandbox merged Git blob',async()=>{
 const f=fixture();
 const out=await f.proof.verifyHosted(expected);
 assert.equal(out.verified,true);
 assert.equal(out.canonicalLive,false);
 assert.equal(out.hostedSha256,HASH);
 assert.equal(out.verifiedReleaseId,HASH.slice(0,32));
 assert.equal(out.workflowRunId,443311);
 assert.equal(out.testPath,PATH);
 assert.equal(f.calls.length,5);
});
test('D2-L02 a wrong hosted response or changed HTTP digest cannot claim verification',async()=>{
 for(const mode of [{changeBytes:true,code:'HOSTED_BYTES_MISMATCH'},
  {changeSha:true,code:'HOSTED_METADATA_MISMATCH'},
  {changeStatus:true,code:'DURABLE_EVIDENCE_MISSING'}]){
  const f=fixture(mode);
  await assert.rejects(f.proof.verifyHosted(expected),denied(mode.code));
 }
});
test('D2-L03 invalid proof receipt rejected before GitHub read or HTTP request',async()=>{
 const f=fixture();
 for(const wrong of [
  {...expected,repositoryId:1350909744},
  {...expected,canonicalLive:true},
  {...expected,mergeSha:'0'.repeat(40)},
  {...expected,expectedPath:'pwa/KB/kb.json'},
 ]){
  if(wrong.mergeSha==='0'.repeat(40))
   await assert.rejects(f.proof.verifyHosted(wrong),denied('DURABLE_EVIDENCE_MISSING'));
  else await assert.rejects(f.proof.verifyHosted(wrong),denied('INVALID_RECEIPT'));
 }
 assert.equal(f.calls.length,0);
});
test('D2-L04 signed probe never authorizes wrong path, identity or missing header',async()=>{
 const f=fixture();
 assert.equal(await f.proof.authorizeProbe(new Request(ORIGIN+PATH),OP),false);
 assert.equal(await f.proof.authorizeProbe(new Request(ORIGIN+'/api/v3/operations'),OP),false);
 assert.equal(await f.proof.authorizeProbe(new Request(ORIGIN+PATH,
  {headers:{'X-Fish-D2-Host-Probe':'100030.'+'a'.repeat(43)}}),OP),false);
});
test('D2-L05 scheduled publisher is default-off and HTTP gateway is delegated',async()=>{
 const calls=[];
 const route={fetch:async req=>new Response('SAFE:'+new URL(req.url).pathname)};
 const worker=createD2LivePublisherWorker({
  route,requestGitHub:async()=>{calls.push('github');throw Error('should not run');},
  requestHosted:async()=>{calls.push('hosted');throw Error('should not run');},
 });
 const http=await worker.fetch(new Request(ORIGIN+'/session'),{});
 assert.equal(await http.text(),'SAFE:/session');
 await worker.scheduled({cron:'* * * * *'},{D2_RUNNER_ENABLED:'false'},
  {waitUntil(){calls.push('task');}});
 assert.deepEqual(calls,[]);
});
