import test from 'node:test';
import assert from 'node:assert/strict';
import {createD3PublicationLifecycle,D3LifecycleError}
 from '../src/d3-publication-lifecycle.mjs';

const op='p3_343ef7ba-1c87-4d5d-a2ad-92e91eab420f';
const key='d3-editor-once-20261026-111111';
const pkg={format:'fishing-companion-change-v2',domain:'gear',
 operation:'edit',id:'p3-test-rod',picture:{action:'keep'},
 pictureSequence:{action:'keep'},changes:{set:{name:'updated'}},
 notes:{action:'keep'}};
const isCode=code=>e=>e instanceof D3LifecycleError&&e.code===code;
function storage(){
 const db=new Map();
 return {
  getItem:x=>db.get(x)??null,
  setItem:(x,v)=>db.set(x,v),removeItem:x=>db.delete(x),
  entries:()=>[...db.entries()],
 };
}
const live={operationId:op,state:'Live',terminal:true,publicLive:false,
 sandboxVerified:true,needsAttention:false};
const success={operationId:op,state:'Accepted',accepted:true,canonicalLive:false};

test('D3-L01 feature gate must be enabled and media is rejected before network',async()=>{
 let n=0;
 const flow=createD3PublicationLifecycle({
  client:{publish:async()=>{n++;return success;},status:async()=>live},makeKey:()=>key,
 });
 await assert.rejects(flow.submit(pkg),isCode('NOT_ENABLED'));
 const enabled=createD3PublicationLifecycle({
  client:{publish:async()=>{n++;return success;},status:async()=>live},
  makeKey:()=>key,enabled:()=>true,
 });
 await assert.rejects(enabled.submit({...pkg,picture:{action:'replace'}}),
  isCode('MEDIA_REQUIRES_D4'));
 assert.equal(n,0);
});

test('D3-L02 network ambiguity retains SAME idempotency key and payload; no automatic retry',async()=>{
 let calls=0;const seen=[];
 const client={
  publish:async payload=>{calls++;seen.push(payload);if(calls===1)throw Error('timeout');
   return success;},
  status:async()=>live,
 };
 const flow=createD3PublicationLifecycle({
  client,enabled:()=>true,makeKey:()=>key,
 });
 const input=structuredClone(pkg);
 await assert.rejects(flow.submit(input),/timeout/);
 assert.equal(flow.tracking().phase,'Unknown');
 assert.equal(flow.tracking().needsReconciliation,true);
 assert.equal(flow.tracking().canLeaveEditor,false);
 assert.equal(calls,1);
 // In-flight package snapshot is immutable from external editor changes.
 input.changes.set.name='changed after uncertainty';
 await assert.rejects(flow.submit(input),isCode('PAYLOAD_CHANGED_AFTER_SUBMIT'));
 assert.equal(calls,1);
 const receipt=await flow.submit(pkg); // explicit user action; same exact request
 assert.equal(receipt.phase,'Accepted');
 assert.equal(receipt.operationId,op);
 assert.equal(receipt.canLeaveEditor,true);
 assert.equal(receipt.publicLive,false);
 assert.equal(seen[0].idempotencyKey,key);
 assert.equal(seen[1].idempotencyKey,key);
 assert.deepEqual(seen[0].package,seen[1].package);
 assert.equal(calls,2);
});

test('D3-L03 double submission shares one in-flight network request',async()=>{
 let resolve;
 const gate=new Promise(done=>{resolve=done;});
 let calls=0;
 const flow=createD3PublicationLifecycle({
  enabled:()=>true,makeKey:()=>key,
  client:{publish:async()=>{calls++;await gate;return success;},status:async()=>live},
 });
 const a=flow.submit(pkg);
 const b=flow.submit(pkg);
 resolve();
 const [first,second]=await Promise.all([a,b]);
 assert.equal(calls,1);
 assert.deepEqual(first,second);
});

test('D3-L04 only public operation ID persists; restore never trusts local Live claims',async()=>{
 const store=storage();
 const client={publish:async()=>success,status:async()=>live};
 const a=createD3PublicationLifecycle({
  enabled:()=>true,makeKey:()=>key,storage:store,client,
 });
 const state=await a.submit(pkg);
 assert.equal(state.trackingStored,true);
 const json=JSON.stringify(store.entries());
 assert(json.includes(op));assert(!json.includes(key));
 assert(!json.includes('updated'));assert(!json.includes('csrf'));
 const b=createD3PublicationLifecycle({
  enabled:()=>true,makeKey:()=>key,storage:store,client,
 });
 assert.equal(b.tracking().phase,'NeedsStatusCheck');
 assert.equal(b.tracking().publicLive,false);
 const last=await b.refresh();
 assert.equal(last.sandboxVerified,true);
 assert.equal(last.publicLive,false);
 await assert.rejects(a.submit(pkg),isCode('ALREADY_ACCEPTED'));
 const forgotten=b.forgetCompleted();
 assert.equal(forgotten.phase,'Idle');
 assert.equal(store.entries().length,0);
});

test('D3-L05 status cannot be forgotten before authenticated terminal proof',async()=>{
 const store=storage();
 let readCalls=0;
 const client={publish:async()=>success,status:async()=>{
  readCalls++;return {operationId:op,state:'Verifying',terminal:false,
   publicLive:false,sandboxVerified:false,needsAttention:false};
 }};
 const flow=createD3PublicationLifecycle({
  enabled:()=>true,makeKey:()=>key,storage:store,client,
 });
 await flow.submit(pkg);
 await assert.rejects(async()=>flow.forgetCompleted(),isCode('UNVERIFIED_TERMINAL_STATUS'));
 const r=await flow.refresh();
 assert.equal(r.phase,'Verifying');
 assert.equal(readCalls,1);
 assert.throws(()=>flow.forgetCompleted(),isCode('UNVERIFIED_TERMINAL_STATUS'));
});

test('D3-L06 expired session or outage cannot invent a Live status or delete receipt',async()=>{
 const store=storage();
 const client={publish:async()=>success,status:async()=>{throw Error('unauthorized');}};
 const flow=createD3PublicationLifecycle({
  enabled:()=>true,makeKey:()=>key,storage:store,client,
 });
 await flow.submit(pkg);
 await assert.rejects(flow.refresh(),/unauthorized/);
 assert.equal(flow.tracking().phase,'NeedsStatusCheck');
 assert.equal(flow.tracking().publicLive,false);
 assert.equal(store.entries().length,1);
});

test('D3-L07 storage unavailable still preserves an in-memory accepted receipt',async()=>{
 const broken={getItem:()=>{throw Error('locked');},
  setItem:()=>{throw Error('quota');},removeItem:()=>{throw Error('locked');}};
 const flow=createD3PublicationLifecycle({
  enabled:()=>true,makeKey:()=>key,storage:broken,
  client:{publish:async()=>success,status:async()=>live},
 });
 const s=await flow.submit(pkg);
 assert.equal(s.phase,'Accepted');
 assert.equal(s.trackingStored,false);
 assert.equal(s.operationId,op);
});

test('D3-L08 every durable intermediate state stays navigable and never claims Live',async()=>{
 for(const stage of ['Accepted','Validating','Checking','Merging','Deploying','Verifying']){
  const client={publish:async()=>success,status:async()=>({
   operationId:op,state:stage,terminal:false,publicLive:false,
   sandboxVerified:false,needsAttention:false,
  })};
  const flow=createD3PublicationLifecycle({enabled:()=>true,makeKey:()=>key,client});
  await flow.submit(pkg);
  const result=await flow.refresh();
  assert.equal(result.phase,stage);
  assert.equal(result.canLeaveEditor,true);
  assert.equal(result.publicLive,false);
 }
});
