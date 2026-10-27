import test from 'node:test';
import assert from 'node:assert/strict';
import {createD3AuthoringClient,describeD3Operation,D3ClientError}
 from '../src/d3-authoring-client.mjs';
const origin='https://fishing-auth-p0-test.ginosega.workers.dev';
const op='p3_343ef7ba-1c87-4d5d-a2ad-92e91eab420f';
const csrf='c'.repeat(43);
const sample={format:'fishing-companion-change-v2',domain:'gear',operation:'edit',
 id:'p3-test-rod',base:{schemaVersion:2,sourceRevision:'f'.repeat(40),
 recordHash:'e'.repeat(64)},changes:{set:{name:'new'},unset:[],
 baseFields:{name:'old'}},notes:{action:'keep'},picture:{action:'keep'},
 pictureSequence:{action:'keep'}};
const ok=(body,status=200)=>new Response(JSON.stringify(body),{
 status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'},
});
const refuse=(code)=>e=>e instanceof D3ClientError&&e.code===code;
test('D3-C01 source-only is inert until explicit enabled gate, no network',async()=>{
 const hits=[];
 const client=createD3AuthoringClient({origin,request:async()=>{hits.push(1);}});
 await assert.rejects(client.session(),refuse('NOT_ENABLED'));
 await assert.rejects(client.publish({package:sample,idempotencyKey:'idempotent-test-001'}),
  refuse('NOT_ENABLED'));
 assert.deepEqual(hits,[]);
});
test('D3-C02 anonymous session has no CSRF or ability to publish',async()=>{
 const calls=[];
 const client=createD3AuthoringClient({origin,enabled:()=>true,
  request:async (url,init)=>{calls.push({url,init});return ok({authenticated:false,authorized:false});},
 });
 assert.deepEqual(await client.session(),{authenticated:false,authorized:false,
  sandboxPublishingReady:false});
 await assert.rejects(client.publish({package:sample,idempotencyKey:'idempotent-test-001'}),
  refuse('OWNER_SESSION_REQUIRED'));
 assert.equal(calls.length,1);
 assert.equal(calls[0].url,origin+'/session');
 assert.equal(calls[0].init.credentials,'same-origin');
 assert.equal(calls[0].init.cache,'no-store');
});
test('D3-C03 accepted text-only edit is not public live; durable receipt required before navigating',async()=>{
 let calls=0;
 const client=createD3AuthoringClient({origin,enabled:()=>true,
  request:async (url,init)=>{
   calls++;
   if(url.endsWith('/session'))return ok({authenticated:true,authorized:true,csrfToken:csrf});
   assert.equal(url,origin+'/api/v3/operations');
   assert.equal(init.headers['X-Fish-V3-CSRF'],csrf);
   assert.equal(init.headers['X-Fish-V3-Intent'],'publish');
   assert.equal(init.credentials,'same-origin');
   assert.equal(init.cache,'no-store');
   assert.deepEqual(JSON.parse(init.body),
    {idempotencyKey:'idempotent-test-001',snapshot:{package:sample,media:[]}});
   return ok({ok:true,operationId:op,state:'Accepted',accepted:true,
    duplicate:false,statusPath:'/api/v3/operations/'+op,canonicalLive:false},202);
  },
 });
 assert.deepEqual(await client.session(),{authenticated:true,authorized:true,
  sandboxPublishingReady:false});
 assert.deepEqual(await client.publish({package:sample,idempotencyKey:'idempotent-test-001'}),
  {operationId:op,state:'Accepted',accepted:true,duplicate:false,canonicalLive:false});
 assert.equal(calls,2);
});
test('D3-C04 malformed receipt or timeout is not treated as Accepted',async()=>{
 const client=createD3AuthoringClient({origin,enabled:()=>true,
  request:async(url)=>{
   if(url.endsWith('/session'))return ok({authenticated:true,authorized:true,csrfToken:csrf});
   return ok({ok:true,operationId:'not-an-id',state:'Accepted'},202);
  },
 });
 await client.session();
 await assert.rejects(client.publish({package:sample,idempotencyKey:'idempotent-test-001'}),
  refuse('UNTRUSTED_RECEIPT'));
});
test('D3-C05 unsafe cross-origin, offline, media, and missing owner are refused before write',async()=>{
 assert.throws(()=>createD3AuthoringClient({origin:'http://insecure.example',request:async()=>{}}),
  refuse('INVALID_CONFIGURATION'));
 let online=false,hits=0;
 const client=createD3AuthoringClient({origin,online:()=>online,enabled:()=>true,
  request:async(url)=>{
   hits++;
   if(url.endsWith('/session'))return ok({authenticated:true,authorized:true,csrfToken:csrf});
   throw Error('Must not submit');
  },
 });
 await assert.rejects(client.session(),refuse('OFFLINE_DENIED'));
 assert.equal(hits,0);online=true;await client.session();
 await assert.rejects(client.publish({package:{...sample,picture:{action:'replace'}},
  idempotencyKey:'idempotent-test-001'}),refuse('MEDIA_REQUIRES_D4'));
 await assert.rejects(client.publish({package:sample,idempotencyKey:'bad'}),
  refuse('INVALID_IDEMPOTENCY_KEY'));
 assert.equal(hits,1);
});
test('D3-C06 status never mislabels verified sandbox test as canonical public Live',async()=>{
 const client=createD3AuthoringClient({origin,enabled:()=>true,
  request:async(url)=>{
   if(url.endsWith('/session'))return ok({authenticated:true,authorized:true,csrfToken:csrf});
   return ok({ok:true,canonicalLive:false,
    operation:{operationId:op,state:'Live',verifiedReleaseId:'a'.repeat(32)}});
  },
 });
 await client.session();const status=await client.status(op);
 assert.equal(status.state,'Live');
 assert.equal(status.sandboxVerified,true);
 assert.equal(status.publicLive,false);
 const canonical=describeD3Operation({operationId:op,state:'Live'},{canonicalLive:true});
 assert.equal(canonical.publicLive,true);
});
test('D3-C07 owner session expires or revokes; no cached CSRF can authorize future writes',async()=>{
 let hits=0;
 const client=createD3AuthoringClient({origin,enabled:()=>true,
  request:async(url)=>{
   hits++;
   if(url.endsWith('/session'))return ok({authenticated:true,authorized:true,csrfToken:csrf});
   return ok({ok:false,error:'SESSION_DENIED'},401);
  },
 });
 await client.session();
 await assert.rejects(client.publish({package:sample,idempotencyKey:'idempotent-test-001'}),
  refuse('SESSION_EXPIRED'));
 await assert.rejects(client.publish({package:sample,idempotencyKey:'idempotent-test-001'}),
  refuse('OWNER_SESSION_REQUIRED'));
 assert.equal(hits,2);
});

test('D3-C08 signed-in owner signs out through existing first-party P0 endpoint',async()=>{
 const requests=[];
 const client=createD3AuthoringClient({origin,enabled:()=>true,
  request:async(url,init)=>{
   requests.push({url,init});
   if(url===origin+'/session')return ok({
    authenticated:true,authorized:true,csrfToken:csrf});
   if(url===origin+'/session/signout')return ok({signedOut:true});
   throw Error('Unexpected request');
  },
 });
 await client.session();
 assert.equal(await client.signOut(),true);
 assert.equal(requests[1].url,origin+'/session/signout');
 assert.equal(requests[1].init.method,'POST');
 assert.equal(requests[1].init.headers['X-Fish-P0-Intent'],'signout');
 assert.equal(requests[1].init.credentials,'same-origin');
 assert.equal(requests[1].init.redirect,'manual');
 await assert.rejects(client.publish({
  package:sample,idempotencyKey:'idempotent-test-001',
 }),refuse('OWNER_SESSION_REQUIRED'));
 assert.equal(requests.length,2);
});
test('D3-C10 authenticated server readiness is distinct from session permission',async()=>{
 const client=createD3AuthoringClient({origin,enabled:()=>true,
  request:async()=>ok({authenticated:true,authorized:true,
   csrfToken:csrf,sandboxPublishingReady:true}),
 });
 assert.deepEqual(await client.session(),{authenticated:true,authorized:true,
  sandboxPublishingReady:true});
});
test('D3-C09 ambiguous signout cannot preserve cached CSRF or retry implicitly',async()=>{
 let count=0;
 const client=createD3AuthoringClient({origin,enabled:()=>true,
  request:async url=>{
   count++;
   if(url===origin+'/session')return ok({
    authenticated:true,authorized:true,csrfToken:csrf});
   return ok({signedOut:false},503);
  },
 });
 await client.session();
 await assert.rejects(client.signOut(),refuse('SIGNOUT_UNCONFIRMED'));
 await assert.rejects(client.signOut(),refuse('OWNER_SESSION_REQUIRED'));
 await assert.rejects(client.publish({
  package:sample,idempotencyKey:'idempotent-test-001',
 }),refuse('OWNER_SESSION_REQUIRED'));
 assert.equal(count,2);
});
