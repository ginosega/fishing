import test from 'node:test';
import assert from 'node:assert/strict';
import {createD3CheckWebhookWake,D3CheckWakeError} from '../src/d3-fast-check-webhook.mjs';
const secret='very-long-unique-sandbox-webhook-secret-not-a-real-secret';
const sha='a'.repeat(40);
const payload={
 action:'completed',repository:{id:1430581407,full_name:'ginosega/fishing-p3-sandbox',private:true},
 installation:{id:174361658},check_run:{id:77,app:{id:15368},
 name:'validate-sandbox-head',status:'completed',conclusion:'success',head_sha:sha},
};
const err=code=>e=>e instanceof D3CheckWakeError&&e.code===code;
async function signed(p=payload,{secretKey=secret,body=null,headerSha=null}={}){
 const content=body??JSON.stringify(p),bytes=new TextEncoder().encode(content);
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secretKey),
  {name:'HMAC',hash:'SHA-256'},false,['sign']);
 const signature=Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,bytes)))
  .map(b=>b.toString(16).padStart(2,'0')).join('');
 return new Request('https://fishing-auth-p0-test.ginosega.workers.dev/_internal/d3-check',{
  method:'POST',headers:{
   'X-Hub-Signature-256':'sha256='+(headerSha??signature),
   'X-GitHub-Delivery':'12345678-1234-1234-1234-123456789abc',
   'X-GitHub-Event':'check_run',
  },body:content});
}
const operationId='p3_5527208d-a67c-4a2c-876d-9edaee353bc8';
const fixture=({enabled=true,lookup=async()=>({
 operationId,repositoryId:1430581407,prHeadSha:sha,state:'Checking'})}={})=>{
 const calls=[];
 const receiver=createD3CheckWebhookWake({secret,enabled:()=>enabled,
  lookupChecking:async args=>{calls.push(['lookup',args]);return lookup(args);},
  armWatchdog:async args=>{calls.push(['arm',args]);}});
 return {receiver,calls};
};
test('E1 off gate never reads body or D1',async()=>{
 const f=fixture({enabled:false});
 await assert.rejects(f.receiver.handle(await signed()),err('DISABLED'));
 assert.equal(f.calls.length,0);
});
test('E2 valid signed event only wakes exact D1 checking record; never marks passed',async()=>{
 const f=fixture();
 const result=await f.receiver.handle(await signed());
 assert.equal(result.accepted,true);
 assert.equal(result.checkPassed,false);
 assert.equal(result.merged,false);
 assert.equal(result.canonicalLive,false);
 assert.equal(f.calls.length,2);
 assert.equal(f.calls[1][1].operationId,operationId);
});
test('E3 invalid HMAC denied before D1',async()=>{
 const f=fixture();
 await assert.rejects(f.receiver.handle(await signed(payload,{secretKey:'different-signing-key-long-enough-123456'})),err('SIGNATURE_DENIED'));
 assert.equal(f.calls.length,0);
});
test('E4 wrong repository / GitHub App / check name / SHA cannot schedule',async()=>{
 for(const path of [
  {repository:{...payload.repository,id:44}},
  {installation:{id:1}},
  {check_run:{...payload.check_run,app:{id:9}}},
  {check_run:{...payload.check_run,head_sha:'b'.repeat(40)}},
  {check_run:{...payload.check_run,name:'untrusted-check'}},
  {action:'created'}
 ]){
  const f=fixture({lookup:async()=>null});
  const r=await f.receiver.handle(await signed({...payload,...path}));
  assert.equal(r.accepted,false);
  assert.equal(f.calls.some(x=>x[0]==='arm'),false);
 }
});
test('E5 no matching D1 operation is a no-op',async()=>{
 const f=fixture({lookup:async()=>null});
 assert.equal((await f.receiver.handle(await signed())).reason,'NO_WAITING_OPERATION');
 assert.equal(f.calls.filter(x=>x[0]==='arm').length,0);
});
test('E6 malformed record fails closed',async()=>{
 const f=fixture({lookup:async()=>({operationId,repositoryId:1430581407,
  prHeadSha:sha,state:'Merging'})});
 await assert.rejects(f.receiver.handle(await signed()),err('DURABLE_RECEIPT_DRIFT'));
 assert.equal(f.calls.filter(x=>x[0]==='arm').length,0);
});
test('E7 forged status and conclusion never wake',async()=>{
 const f=fixture();
 const r=await f.receiver.handle(await signed({...payload,check_run:{
  ...payload.check_run,conclusion:'failure'}}));
 assert.equal(r.accepted,false);
 assert.equal(f.calls.length,0);
});
test('E8 duplicate signed messages may wake, but no write occurs from webhook',async()=>{
 const f=fixture();
 await f.receiver.handle(await signed());
 await f.receiver.handle(await signed());
 assert.equal(f.calls.filter(x=>x[0]==='arm').length,2);
});

test('E9 signed repository check webhook need not alter App-level subscriptions',async()=>{
 const f=fixture(),webhook={...payload};
 delete webhook.installation;
 const result=await f.receiver.handle(await signed(webhook));
 assert.equal(result.accepted,true);
 assert.equal(f.calls.filter(x=>x[0]==='arm').length,1);
});
