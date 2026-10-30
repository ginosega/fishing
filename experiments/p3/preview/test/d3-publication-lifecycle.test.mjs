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
 const forgotten=b.forgetCompleted();
 assert.equal(forgotten.phase,'Idle');
 assert.equal(store.entries().length,0);
 // A separate tab that retained the old receipt can independently prove
 // Live and start another edit instead of being blocked indefinitely.
 const nextReceipt=await a.submit(pkg);
 assert.equal(nextReceipt.phase,'Accepted');
 assert.equal(nextReceipt.operationId,op);
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

test('D3-L09 consecutive Gear and KB submissions auto-retire only a freshly verified Live receipt',async()=>{
 const first='p3_01234567-1111-4111-8111-123456789abc';
 const second='p3_01234567-2222-4222-8222-123456789abc';
 const keys=['new-test-gear-key-12345','new-test-kb-key-123456'];
 const stored=storage(),sent=[],statusReads=[];
 let prior={operationId:first,state:'Verifying',terminal:false,
  publicLive:false,sandboxVerified:false,needsAttention:false};
 const lifecycle=createD3PublicationLifecycle({
  enabled:()=>true,storage:stored,makeKey:()=>keys.shift(),
  client:{
   publish:async params=>{
    sent.push(params);
    return {accepted:true,canonicalLive:false,
     operationId:sent.length===1?first:second};
   },
   status:async id=>{statusReads.push(id);return prior;},
  },
 });
 await lifecycle.submit(pkg);
 assert.equal(sent.length,1);
 const kb={...pkg,domain:'kb',id:'location-p3-test-lake',
  notes:{action:'replace',path:'KB/Locations/content/P3 Test Lake.md',
   baseHash:'a'.repeat(64),text:'# P3 Test Lake D3 Verification'}};
 await assert.rejects(lifecycle.submit(kb),isCode('PREVIOUS_PUBLICATION_NOT_LIVE'));
 assert.equal(sent.length,1);
 assert.equal(lifecycle.tracking().operationId,first);
 assert.equal(stored.entries().length,1);
 prior={...prior,state:'Live',terminal:true,sandboxVerified:true};
 const accepted=await lifecycle.submit(kb);
 assert.equal(accepted.phase,'Accepted');
 assert.equal(accepted.operationId,second);
 assert.equal(sent.length,2);
 assert.equal(sent[1].package.domain,'kb');
 assert.notEqual(sent[0].idempotencyKey,sent[1].idempotencyKey);
 assert.deepEqual(statusReads,[first,first]);
 assert.equal(stored.entries().length,1);
 assert(JSON.stringify(stored.entries()).includes(second));
 assert(!JSON.stringify(stored.entries()).includes(first));
});

test('D3-L10 double-submit while verifying old Live receipt triggers only one new POST',async()=>{
 const first='p3_01234567-1111-4111-8111-123456789abc';
 const next='p3_01234567-2222-4222-8222-123456789abc';
 const stored=storage();
 let reads=0,posts=0,resolve;
 const gate=new Promise(r=>{resolve=r;});
 const lifecycle=createD3PublicationLifecycle({
  enabled:()=>true,storage:stored,
  makeKey:()=> 'fresh-owner-key-123456789abc',
  client:{
   publish:async()=>{posts++;return {accepted:true,canonicalLive:false,
    operationId:posts===1?first:next};},
   status:async id=>{reads++;assert.equal(id,first);await gate;
    return {operationId:first,state:'Live',terminal:true,
     publicLive:false,sandboxVerified:true,needsAttention:false};},
  },
 });
 await lifecycle.submit(pkg);
 const a=lifecycle.submit({...pkg,domain:'kb',id:'location-p3-test-lake'});
 const b=lifecycle.submit({...pkg,domain:'kb',id:'location-p3-test-lake'});
 resolve();
 const results=await Promise.all([a,b]);
 assert.equal(reads,1);
 assert.equal(posts,2);
 assert.deepEqual(results[0],results[1]);
 assert.equal(results[0].operationId,next);
});

test('D3-L11 previous failed/unknown/foreign status never discards receipt or posts a second edit',async()=>{
 for(const invalid of [
  {state:'Conflict',terminal:true,sandboxVerified:false,publicLive:false,needsAttention:true},
  {state:'Failed',terminal:true,sandboxVerified:false,publicLive:false,needsAttention:true},
  {state:'Live',terminal:true,sandboxVerified:false,publicLive:false,needsAttention:false},
  {state:'Live',terminal:true,sandboxVerified:true,publicLive:true,needsAttention:false},
  {state:'Merging',terminal:false,sandboxVerified:false,publicLive:false,needsAttention:false},
 ]){
  let posts=0;
  const db=storage(),lifecycle=createD3PublicationLifecycle({
   enabled:()=>true,storage:db,makeKey:()=>key,
   client:{publish:async()=>{posts++;return success;},
    status:async()=>({operationId:op,...invalid})},
  });
  await lifecycle.submit(pkg);
  await assert.rejects(lifecycle.submit({...pkg,domain:'kb'}),isCode('PREVIOUS_PUBLICATION_NOT_LIVE'));
  assert.equal(posts,1);
  assert.equal(db.entries().length,1);
  assert.equal(lifecycle.tracking().operationId,op);
 }
});

test('D3-L12 previous-status outage leaves old receipt and avoids a new POST',async()=>{
 let reads=0,posts=0;
 const db=storage();
 const flow=createD3PublicationLifecycle({
  enabled:()=>true,storage:db,makeKey:()=>key,
  client:{publish:async()=>{posts++;return success;},
   status:async()=>{reads++;throw Error('network unavailable');}},
 });
 await flow.submit(pkg);
 await assert.rejects(flow.submit({...pkg,domain:'kb'}),/network unavailable/);
 assert.equal(reads,1);
 assert.equal(posts,1);
 assert.equal(flow.tracking().operationId,op);
 assert.equal(db.entries().length,1);
});


test('D3-L13 mobile Chrome with no original browser receipt discovers server Live',async()=>{
 const store=storage();
 let latestReads=0,statusReads=0,publishes=0;
 const flow=createD3PublicationLifecycle({
  enabled:()=>true,storage:store,makeKey:()=>key,
  client:{
   latest:async()=>{latestReads++;return live;},
   status:async()=>{statusReads++;return live;},
   publish:async()=>{publishes++;return success;},
  },
 });
 assert.equal(flow.tracking().operationId,null);
 const found=await flow.discover();
 assert.equal(found.operationId,op);
 assert.equal(found.phase,'Live');
 assert.equal(found.sandboxVerified,true);
 assert.equal(found.publicLive,false);
 assert.equal(found.trackingStored,true);
 assert.equal(latestReads,1);
 assert.equal(statusReads,0);
 assert.equal(publishes,0);
 assert(!JSON.stringify(store.entries()).includes('csrf'));
 const next=createD3PublicationLifecycle({
  enabled:()=>true,storage:store,
  client:{latest:async()=>{throw Error('Should not discover');},
   status:async()=>live,publish:async()=>success},
 });
 assert.equal((await next.discover()).sandboxVerified,true);
 assert.equal(latestReads,1);
});
test('D3-L14 server lookup never overwrites ambiguous unsent edit',async()=>{
 const flow=createD3PublicationLifecycle({
  enabled:()=>true,makeKey:()=>key,
  client:{latest:async()=>{throw Error('Should not be read');},
   publish:async()=>{throw Error('Lost 202');},status:async()=>live},
 });
 await assert.rejects(flow.submit(pkg),/Lost 202/);
 await assert.rejects(flow.discover(),isCode('UNRESOLVED_SUBMISSION'));
 assert.equal(flow.tracking().phase,'Unknown');
 assert.equal(flow.tracking().operationId,null);
});
test('D3-L15 server discovery of no receipt remains empty without a write',async()=>{
 const flow=createD3PublicationLifecycle({
  enabled:()=>true,makeKey:()=>key,
  client:{latest:async()=>null,
   publish:async()=>{throw Error('No write');},status:async()=>{throw Error('No status');}},
 });
 const empty=await flow.discover();
 assert.equal(empty.operationId,null);
 assert.equal(empty.phase,'Idle');
 assert.equal(empty.sandboxVerified,false);
});

test('D4-L01 Catch text-only edit uses one durable receipt, no media or auto retry',async()=>{
 let n=0;
 const catchPkg={...pkg,domain:'catches',id:'catch-test-existing',
  changes:{set:{size:'14 in'}}};
 const flow=createD3PublicationLifecycle({
  enabled:()=>true,makeKey:()=>key,
  client:{publish:async request=>{
   n++;assert.equal(request.package.domain,'catches');
   return success;
  },status:async()=>live},
 });
 const receipt=await flow.submit(catchPkg);
 assert.equal(n,1);
 assert.equal(receipt.phase,'Accepted');
 assert.equal(receipt.canLeaveEditor,true);
 assert.equal(receipt.publicLive,false);
});

test('D3-L15 dismissed server-terminal failure stays dismissed across source reload and status lookup',async()=>{
 const old='p3_01234567-1111-4111-8111-123456789abc';
 const next='p3_01234567-2222-4222-8222-123456789abc';
 const db=storage();
 let posts=0,lookups=0;
 const failed={operationId:old,state:'Failed',terminal:true,
  publicLive:false,sandboxVerified:false,needsAttention:true};
 let latest=failed;
 const client={
  publish:async()=>({accepted:true,canonicalLive:false,
   operationId:++posts===1?old:next}),
  status:async()=>failed,
  latest:async()=>{lookups++;return latest;},
 };
 const first=createD3PublicationLifecycle({
  enabled:()=>true,client,storage:db,makeKey:()=>key,
 });
 await first.submit(pkg);
 // Until explicit owner acknowledgement, never permit a second POST.
 await assert.rejects(first.submit({...pkg,domain:'kb'}),
  isCode('PREVIOUS_PUBLICATION_NOT_LIVE'));
 assert.equal(posts,1);
 await first.refresh();
 first.forgetCompleted();
 assert.equal(first.tracking().operationId,null);
 assert.equal(db.entries().length,1,'Only dismissal marker persists');
 assert(!JSON.stringify(db.entries()).includes('updated'));
 assert.equal((await first.discover()).phase,'Idle');
 assert.equal(first.tracking().operationId,null);
 const reopened=createD3PublicationLifecycle({
  enabled:()=>true,client,storage:db,
  makeKey:()=> 'new-after-dismissed-failure-20261029',
 });
 assert.equal((await reopened.discover()).phase,'Idle',
  'Do not resurrect dismissed failure from server latest');
 assert.equal(lookups,2);
 const saved=await reopened.submit({...pkg,domain:'kb'});
 assert.equal(saved.phase,'Accepted');
 assert.equal(saved.operationId,next);
 assert.equal(posts,2);
 assert(!JSON.stringify(db.entries()).includes('dismissed-terminal'),
  'A confirmed new Accepted supersedes old dismissal marker');
});
test('D3-L16 acknowledgement never suppresses different, pending or unacknowledged provider operations',async()=>{
 const old='p3_01234567-1111-4111-8111-123456789abc';
 const other='p3_01234567-2222-4222-8222-123456789abc';
 const db=storage(),failure={operationId:old,state:'Conflict',
  terminal:true,publicLive:false,sandboxVerified:false,needsAttention:true};
 let recent=failure;
 const client={publish:async()=>({operationId:old,accepted:true,canonicalLive:false}),
  status:async()=>failure,latest:async()=>recent};
 const flow=createD3PublicationLifecycle({
  enabled:()=>true,storage:db,client,makeKey:()=>key,
 });
 await flow.submit(pkg);
 await flow.refresh();
 // The terminal status is still visible until owner explicitly dismisses.
 assert.equal((await flow.discover()).operationId,old);
 flow.forgetCompleted();
 const same=new Map(db.entries());
 recent={...failure,operationId:other};
 const another=createD3PublicationLifecycle({enabled:()=>true,
  client,storage:db,makeKey:()=>key});
 assert.equal((await another.discover()).operationId,other);
 // Even the same ID must not be hidden if its server status is no longer
 // an independently verified terminal Failed/Conflict.
 recent={...failure,state:'Checking',terminal:false,needsAttention:false};
 const rollback=createD3PublicationLifecycle({
  enabled:()=>true,storage:{
   getItem:key=>same.get(key)??null,
   setItem:(k,v)=>same.set(k,v),removeItem:k=>same.delete(k),
  },client,makeKey:()=>key,
 });
 assert.equal((await rollback.discover()).operationId,old);
});
