import test from 'node:test';
import assert from 'node:assert/strict';
import {createD3OwnerTestShell,D3OwnerShellError}
 from '../src/d3-owner-test-shell.mjs';
const ORIGIN='https://fishing.example';
const main='a'.repeat(40),tree='b'.repeat(40);
const op='p3_01234567-1234-4234-8234-123456789abc';
const note='KB/Locations/content/P3 Test Lake.md';
const boot={root:ORIGIN+'/fishing/',release:{id:'r'.repeat(32),sourceRevision:'v2-main'}};
const source=()=>({
 ok:true,repositoryId:1430581407,
 sourceRevision:main,treeSha:tree,canonicalLive:false,sandboxOnly:true,
 data:{
  gear:{schemaVersion:2,items:[{
   id:'p3-test-rod',category:'rods-reels',type:'Spinning rod',
   name:'P3 Test Rod',manufacturer:'Fixture Only',
  }]},
  kb:{schemaVersion:2,entities:[{
   id:'location-p3-test-lake',type:'location',name:'P3 Test Lake',
   content:note,
  }]},
  catches:{schemaVersion:2,catches:[]},
 },
 files:[note],markdown:[{path:note,body:'# P3 Test Lake\n'}],
});
const pkg={
 format:'fishing-companion-change-v2',domain:'gear',operation:'edit',
 id:'p3-test-rod',base:{schemaVersion:2,sourceRevision:main,
  recordHash:'e'.repeat(64)},
 changes:{set:{name:'Changed'},unset:[],baseFields:{name:'Old'}},
 picture:{action:'keep'},pictureSequence:{action:'keep'},
 notes:{action:'keep'},
};
const json=(value,status=200)=>new Response(JSON.stringify(value),{
 status,headers:{'Content-Type':'application/json'},
});
const denial=code=>e=>e instanceof D3OwnerShellError&&e.code===code;
function fixture({enabled=true,online=true,owner=true,sourceFailure=false,
 publishing=true,serverReady=publishing}={}){
 const network=[],renders=[];
 const request=async (url,opts)=>{
  network.push({url,method:opts.method});
  assert(url.startsWith(ORIGIN+'/'));
  if(url.endsWith('/session'))return json(owner?{
   authenticated:true,authorized:true,csrfToken:'c'.repeat(43),
   sandboxPublishingReady:serverReady,
  }:{authenticated:false,authorized:false});
  if(url.endsWith('/api/v3/authoring-source'))
   return sourceFailure?json({ok:false},503):json(source());
  if(url.endsWith('/api/v3/operations')){
   assert.equal(opts.method,'POST');
   const value=JSON.parse(opts.body);
   assert.equal(value.snapshot.package.base.sourceRevision,main);
   assert.equal(value.idempotencyKey,'sandbox-idempotency-key-12345');
   return json({ok:true,operationId:op,state:'Accepted',
    accepted:true,duplicate:false,canonicalLive:false,
    statusPath:'/api/v3/operations/'+op},202);
  }
  throw Error('Unexpected URL: '+url);
 };
 const shell=createD3OwnerTestShell({
  origin:ORIGIN,request,enabled:()=>enabled,online:()=>online,
  makeKey:()=> 'sandbox-idempotency-key-12345',
  publishingEnabled:()=>publishing,
  bootstrap:async(settings,extras)=>{
   renders.push({settings,extras});return {settings,extras};
  },
 });
 return {shell,network,renders};
}
test('D3-B01 shell must be explicitly armed; default public entry unchanged',async()=>{
 const x=fixture({enabled:false});
 await assert.rejects(x.shell.start(boot),denial('NOT_ENABLED'));
 assert.equal(x.network.length,0);
 assert.equal(x.renders.length,0);
});
test('D3-B02 anonymous owner pilot fails closed without showing public V2 records',async()=>{
 const x=fixture({owner:false});
 await assert.rejects(x.shell.start(boot),denial('OWNER_SESSION_REQUIRED'));
 assert.equal(x.renders.length,0);
 assert.deepEqual(x.network.map(n=>n.method),['GET']);
});
test('D3-B03 verified owner uses immutable sandbox main for Gear/KB, not public V2',async()=>{
 const x=fixture();
 const {extras}=await x.shell.start(boot);
 assert.equal(extras.sandboxSource.sourceRevision,main);
 assert.equal(extras.sandboxSource.markdown.get(note),'# P3 Test Lake\n');
 assert.equal(typeof extras.v3.publish,'function');
 assert.deepEqual(x.network.map(n=>n.method),['GET','GET']);
 const result=await extras.v3.publish(pkg);
 assert.equal(result.accepted,true);
 assert.equal(result.canonicalLive,false);
 assert.equal(result.operationId,op);
 assert.equal(x.network.length,3);
 assert.equal(x.network[2].method,'POST');
});
test('D3-B04 missing private source must fail closed, never substitute public V2',async()=>{
 const x=fixture({sourceFailure:true});
 await assert.rejects(x.shell.start(boot),denial('SANDBOX_SOURCE_UNAVAILABLE'));
 assert.equal(x.renders.length,0);
 assert.equal(x.network.length,2);
});
test('D3-B05 offline pilot fails closed before owner/source network requests',async()=>{
 const x=fixture({online:false});
 await assert.rejects(x.shell.start(boot),denial('OFFLINE_DENIED'));
 assert.equal(x.renders.length,0);
 assert.equal(x.network.length,0);
});
test('D3-B06 mismatched origin cannot assemble an owner shell',async()=>{
 const x=fixture();
 await assert.rejects(x.shell.start({...boot,root:'https://other.example/fishing/'}),
  denial('ORIGIN_DENIED'));
 assert.equal(x.network.length,0);
});
test('D3-B07 the test-only shell cannot be started twice',async()=>{
 const x=fixture();
 await x.shell.start(boot);
 await assert.rejects(x.shell.start(boot),denial('ALREADY_STARTED'));
});

test('D3-B09 client opt-in alone cannot show Save without server publishing readiness',async()=>{
 const x=fixture({publishing:true,serverReady:false});
 const {extras}=await x.shell.start(boot);
 assert.equal(extras.sandboxSource.repositoryId,1430581407);
 assert.equal(extras.v3.publish,undefined);
 assert.deepEqual(x.network.map(n=>n.method),['GET','GET']);
});
test('D3-B08 authenticated read-only pilot has sandbox source but no publishing UI',async()=>{
 const x=fixture({publishing:false});
 const {extras}=await x.shell.start(boot);
 assert.equal(extras.sandboxSource.sourceRevision,main);
 assert.equal(extras.v3.publish,undefined);
 assert.deepEqual(x.network.map(n=>n.method),['GET','GET']);
});
