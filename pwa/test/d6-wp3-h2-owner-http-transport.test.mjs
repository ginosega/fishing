import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createD6H2FirstPartyOwnerTransport,D6H2OwnerTransportError}
 from '../server/d6-wp3-h2-owner-http-transport.mjs';

const ORIGIN='https://fishing-v3-wp3-test.ginosega.workers.dev';
const TOKEN='a'.repeat(43),ID='123e4567-e89b-42d3-a456-426614174000';
const SHA='b'.repeat(40),BODY='{"idempotencyKey":"wp3_h2_synthetic_kb_001"}';
const HASH=createHash('sha256').update(BODY).digest('hex');
const digest=async raw=>createHash('sha256').update(raw).digest('hex');
const json=(data,status=200,headers={})=>new Response(
 JSON.stringify(data),{status,headers:{
 'Content-Type':'application/json',...headers,
 }});
const csrfReply=()=>json({ok:true,test:'WP3-H2-SYNTH-KB-001',csrfToken:TOKEN});
const receipt=()=>({
 ok:true,operationId:ID,sourceRevision:SHA,
 canPublish:false,isLive:false,
});
const status=(step='tree',state='AwaitingAuthorizedWrite')=>({
 ...receipt(),state,step,verifiedSteps:[],safeToRetryWrite:false,
 requiresHostedReleaseProof:true,
});
const use=handler=>{
 const calls=[];
 const transport=createD6H2FirstPartyOwnerTransport({
  pageOrigin:ORIGIN,topLevel:true,expectedEnvelopeSha256:HASH,
  sha256:digest,
  network:async(url,opts)=>{
   calls.push({url,opts});
   return handler(url,opts,calls.length);
  },
 });
 return {transport,calls};
};
const denied=async(f,code)=>assert.rejects(f,e=>
 e instanceof D6H2OwnerTransportError&&e.code===code);

test('WP3-H2HTTP01 first-party CSRF obtained only inside owner and single exact intake POST',async()=>{
 const x=use((url,opts)=>opts.method==='GET'?csrfReply():
  json(receipt(),202));
 const p=await x.transport.one({mode:'intake',body:BODY});
 assert.equal(p.httpStatus,202);assert.equal(p.operationId,ID);
 assert.equal(x.calls.length,2);
 assert.equal(x.calls[0].url,ORIGIN+'/api/v3/h2/owner-csrf');
 assert.equal(x.calls[0].opts.headers['X-Fish-V3-H2-Intent'],
  'WP3-H2-SYNTH-KB-001-CSRF');
 assert.equal(x.calls[1].url,ORIGIN+'/api/v3/operations');
 assert.equal(x.calls[1].opts.method,'POST');
 assert.equal(x.calls[1].opts.credentials,'include');
 assert.equal(x.calls[1].opts.mode,'same-origin');
 assert.equal(x.calls[1].opts.redirect,'error');
 assert.equal(x.calls[1].opts.headers['X-Fish-V3-CSRF'],TOKEN);
 assert.equal(x.calls[1].opts.headers['X-Fish-V3-Intent'],'publish');
 assert.equal(x.calls[1].opts.body,BODY);
 assert.equal(x.calls[1].opts.headers.Authorization,undefined);
 assert(!JSON.stringify(p).includes(TOKEN));
});

test('WP3-H2HTTP02 status, begin and reconcile only use server-derived URL',async()=>{
 for(const mode of ['status','step','reconcile']){
  const x=use((url,opts)=>opts.method==='GET'?csrfReply():
   json(status(),mode==='step'?202:200));
  const result=await x.transport.one({mode,operationId:ID});
  assert.equal(result.httpStatus,mode==='step'?202:200);
  assert.equal(result.state,'AwaitingAuthorizedWrite');
  assert.equal(result.canPublish,false);assert.equal(result.isLive,false);
  assert.equal(x.calls.length,2);
  assert.equal(x.calls[1].url,ORIGIN+'/api/v3/operations/'+ID+'/'+
   ({status:'status',step:'begin',reconcile:'reconcile'}[mode]));
  assert.equal(x.calls[1].opts.body,'{}');
 }
});

test('WP3-H2HTTP03 altered envelope rejected before network',async()=>{
 const x=use(()=>{throw Error('should not network');});
 await denied(()=>x.transport.one({mode:'intake',body:BODY+' '}),'INVALID_ENVELOPE');
 assert.equal(x.calls.length,0);
});

test('WP3-H2HTTP04 wrong origin or non-top-level execution blocked',()=>{
 for(const ctx of [
  {pageOrigin:'https://example.com',topLevel:true},
  {pageOrigin:ORIGIN,topLevel:false},
  {pageOrigin:ORIGIN,topLevel:null},
 ]){
  assert.throws(()=>createD6H2FirstPartyOwnerTransport({
   ...ctx,sha256:digest,expectedEnvelopeSha256:HASH,network:fetch,
  }),D6H2OwnerTransportError);
 }
});

test('WP3-H2HTTP05 failed CSRF never POSTs',async()=>{
 for(const reply of [
  json({ok:false,test:'WP3-H2-SYNTH-KB-001'},403),
  json({ok:true,test:'wrong',csrfToken:TOKEN}),
  json({ok:true,test:'WP3-H2-SYNTH-KB-001',csrfToken:'wrong'}),
 ]){
  const x=use(()=>reply.clone());
  await denied(()=>x.transport.one({mode:'status',operationId:ID}),
   'CSRF_UNAVAILABLE');
  assert.equal(x.calls.length,1);
 }
});

test('WP3-H2HTTP06 ambiguous POST has one attempt, returns no raw secrets',async()=>{
 const x=use((url,opts)=>{
  if(opts.method==='GET')return csrfReply();
  throw Error('network interrupted');
 });
 await denied(()=>x.transport.one({mode:'intake',body:BODY}),
  'HTTP_OUTCOME_UNKNOWN');
 assert.equal(x.calls.filter(c=>c.opts.method==='POST').length,1);
});

test('WP3-H2HTTP07 503 returns only fixed allowlisted diagnostic stage',async()=>{
 const x=use((url,opts)=>opts.method==='GET'?csrfReply():
  json({ok:false,error:'token private secret'},503,{
   'X-Fish-V3-H2-Failure-Stage':'RECEIPT_INSERT',
  }));
 const result=await x.transport.one({mode:'intake',body:BODY});
 assert.deepEqual(result,{httpStatus:503,
  failureStage:'RECEIPT_INSERT',ok:false});
 assert(!JSON.stringify(result).includes('token private'));
});

test('WP3-H2HTTP08 forged 200 Live, wrong operation and HTML fail closed',async()=>{
 const bad=[
  json({...status(),canPublish:true},200),
  json({...status(),isLive:true},200),
  json({...status(),operationId:'wrong'},200),
  json({...status(),sourceRevision:'bad'},200),
  new Response('<html>error</html>',{status:200,
   headers:{'Content-Type':'text/html'}}),
 ];
 for(const reply of bad){
  const x=use((url,opts)=>opts.method==='GET'?csrfReply():reply.clone());
  await denied(()=>x.transport.one({mode:'status',operationId:ID}),
   'HTTP_OUTCOME_UNKNOWN');
 }
});

test('WP3-H2HTTP09 other operation, arbitrary path or nonempty step body rejected',async()=>{
 const x=use(()=>{throw Error('not reachable');});
 for(const req of [
  {mode:'step',operationId:'wrong'},
  {mode:'publish',operationId:ID},
  {mode:'status',operationId:ID,body:'{}'},
  {mode:'intake',operationId:ID,body:BODY},
 ]){
  await assert.rejects(x.transport.one(req),D6H2OwnerTransportError);
 }
 assert.equal(x.calls.length,0);
});
