import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareChange,narrativePath} from '../../../../pwa/src/handoff.mjs';
import {createD3GuardedOperationsApi} from '../src/d3-guarded-operations-api.mjs';

const ID=1430581407,OWNER=265665562,SHA='a'.repeat(40);
const OP='p3_01234567-1234-4234-8234-123456789abc';
const origin='https://fishing.example';
const original={id:'p3-test-rod',name:'P3 Test Rod D2 Verification',
  manufacturer:'Fixture Only',category:'rods-reels',type:'Spinning rod'};
const header={'Content-Type':'application/json'};
const newPost=body=>new Request(origin+'/api/v3/operations',{
  method:'POST',headers:header,body:JSON.stringify(body),
});
const read=json=>json.json();
const edit=()=>prepareChange({
  domain:'gear',operation:'edit',id:original.id,
  baseRecord:original,record:{...original,name:'P3 Test Rod D3 Verified'},
  sourceRevision:SHA,
});
const kbAdd=()=>{
  const record={id:'location-p3-d3-lake',name:'D3 Test Lake',type:'location'};
  return prepareChange({domain:'kb',operation:'add',id:record.id,record,
    sourceRevision:SHA,notesPath:narrativePath('kb',record),
    text:'# D3 Test Lake\n\nSynthetic fixture only.\n'});
};
const envelope=pkg=>({
  idempotencyKey:'idempotency-1234567890',
  snapshot:{package:pkg,media:[]},
});
function fixture({enabled=true,owner=OWNER,goodSource=true,
  conflict=false,inserted=true,existing=false}={}){
  const calls={writes:0,validations:0,status:0,authorizations:0,source:null};
  const session={
    describe:async()=>({authenticated:true,authorized:true,csrfToken:'redacted'}),
    authorizeWrite:async()=>{calls.authorizations++;return {ownerGitHubId:owner,authorized:true};},
    authorizeStatus:async()=>({ownerGitHubId:owner,authorized:true}),
  };
  const store={
    lookupReceipt:async command=>existing?{
      operationId:OP,state:'Checking',inserted:false,
    }:null,
    accept:async command=>{
      calls.writes++;
      assert.equal(command.snapshot.media.length,0);
      return {operationId:OP,state:'Accepted',inserted};
    },
    get:async id=>{calls.status++;return id===OP?{operationId:OP,state:'Checking'}:null;},
    latest:async()=>{calls.status++;return {operationId:OP,state:'Live',
     verifiedReleaseId:'a'.repeat(32)};},
  };
  const validateCandidate=async input=>{
    calls.validations++;calls.source=input;
    if(conflict)throw Object.assign(Error('drift'),{code:'SOURCE_CONFLICT'});
    return {
      validated:goodSource,repositoryId:ID,
      domain:input.package.domain,operation:input.package.operation,
      sourceRevision:SHA,changes:[{action:'write',path:'pwa/Gear/gear.json',body:'{}'}],
    };
  };
  const api=createD3GuardedOperationsApi({
    enabled:()=>enabled,session,store,validateCandidate,
  });
  return {api,calls};
}

test('D3-A01 disabled writer rejects before checking auth, package or D1',async()=>{
  const f=fixture({enabled:false});
  const res=await f.api.handle(newPost(envelope(await edit())));
  assert.equal(res.status,503);
  assert.deepEqual(f.calls,{writes:0,validations:0,status:0,authorizations:0,source:null});
});

test('D3-A02 owner Gear edit returns durable Accepted, never public Live',async()=>{
  const f=fixture(),res=await f.api.handle(newPost(envelope(await edit())));
  assert.equal(res.status,202);
  const receipt=await read(res);
  assert.equal(receipt.ok,true);
  assert.equal(receipt.accepted,true);
  assert.equal(receipt.duplicate,false);
  assert.equal(receipt.canonicalLive,false);
  assert.equal(receipt.operationId,OP);
  assert.equal(f.calls.validations,1);
  assert.equal(f.calls.writes,1);
  assert.equal(f.calls.source.repositoryId,ID);
  assert.equal(f.calls.source.ownerGitHubId,OWNER);
});

test('D3-A03 KB add accepts text-only canonical package, no new data domain',async()=>{
  const f=fixture();
  const res=await f.api.handle(newPost(envelope(await kbAdd())));
  assert.equal(res.status,202);
  assert.equal(f.calls.source.package.domain,'kb');
  assert.equal(f.calls.source.package.operation,'add');
  assert.equal(f.calls.writes,1);
});

test('D3-A04 previously Accepted idempotency key produces no false fresh 202',async()=>{
  const f=fixture({inserted:false});
  const res=await f.api.handle(newPost(envelope(await edit())));
  assert.equal(res.status,200);
  assert.equal((await read(res)).duplicate,true);
});

test('D3-A05 unverified source, conflict or wrong owner never reach durable accept',async()=>{
  for(const [props,status] of [
    [{goodSource:false},409],[{conflict:true},409],[{owner:22},409],
  ]){
    const f=fixture(props);
    const res=await f.api.handle(newPost(envelope(await edit())));
    assert.equal(res.status,status);
    assert.equal(f.calls.writes,0);
  }
});

test('D3-A06 malformed body, media, extra repository, unsafe Catch media fail before D1',async()=>{
  const pkg=await edit();
  const attempts=[
    {...envelope(pkg),repositoryId:1350909744},
    {...envelope(pkg),snapshot:{package:pkg,media:[{bytes:12}]}},
    {...envelope(pkg),snapshot:{package:{...pkg,domain:'catches',
      picture:{action:'add',path:'Catches/assets/disallowed.jpg'}},media:[]}},
    {...envelope(pkg),snapshot:{package:{...pkg,picture:{action:'remove'}},media:[]}},
  ];
  for(const body of attempts){
    const f=fixture(),res=await f.api.handle(newPost(body));
    assert.equal(res.status,400);
    assert.equal(f.calls.validations,0);
    assert.equal(f.calls.writes,0);
  }
  const f=fixture(),malformed=new Request(origin+'/api/v3/operations',{
    method:'POST',headers:header,body:'not JSON',
  });
  const res=await f.api.handle(malformed);
  assert.equal(res.status,400);
});

test('D3-A11 source validation 409 returns enum only, never exception text',async()=>{
 const thrown=Object.assign(new Error('SECRET_PRIVATE_TEXT_NEVER_SHOWN'),
  {code:'INVALID_PROMOTION'});
 const session={describe:async()=>({authenticated:true,authorized:true}),
  authorizeWrite:async()=>({authorized:true,ownerGitHubId:OWNER}),
  authorizeStatus:async()=>({authorized:true,ownerGitHubId:OWNER})};
 const store={lookupReceipt:async()=>null,
  accept:async()=>{throw Error('Unexpected accept');},
  get:async()=>null,latest:async()=>null};
 const api=createD3GuardedOperationsApi({session,store,enabled:()=>true,
  validateCandidate:async()=>{throw thrown;}});
 const response=await api.handle(newPost(envelope(await edit())));
 assert.equal(response.status,409);
 const parsed=await response.json();
 assert.deepEqual(parsed,{ok:false,error:'UNVERIFIED_SOURCE',
  diagnostic:'INVALID_PROMOTION'});
 assert.equal(JSON.stringify(parsed).includes('SECRET_PRIVATE_TEXT'),false);
 thrown.code='secretMessage123';
 const repeat=await api.handle(newPost(envelope(await edit())));
 assert.equal((await repeat.json()).diagnostic,'INTERNAL_VALIDATION_ERROR');
});
test('D3-A07 authenticated status survives navigation; unknown IDs stay hidden',async()=>{
  const f=fixture();
  const res=await f.api.handle(new Request(origin+'/api/v3/operations/'+OP));
  assert.equal(res.status,200);
  const value=await read(res);
  assert.equal(value.operation.state,'Checking');
  assert.equal(value.canonicalLive,false);
  const missing=await f.api.handle(
    new Request(origin+'/api/v3/operations/p3_unknown'));
  assert.equal(missing.status,404);
});

test('D3-A12 authorized latest read recovers cross-device Live without a write',async()=>{
 const f=fixture();
 const res=await f.api.handle(new Request(origin+'/api/v3/operations/latest'));
 assert.equal(res.status,200);
 const body=await res.json();
 assert.equal(body.ok,true);
 assert.equal(body.canonicalLive,false);
 assert.equal(body.operation.operationId,OP);
 assert.equal(body.operation.state,'Live');
 assert.equal(f.calls.status,1);
 assert.equal(f.calls.writes,0);
 assert.equal(f.calls.validations,0);
 const foreign=fixture({owner:42});
 const denied=await foreign.api.handle(
  new Request(origin+'/api/v3/operations/latest'));
 assert.equal(denied.status,404);
 assert.equal(foreign.calls.status,0);
 assert.equal(foreign.calls.writes,0);
});

test('D3-A08 public anonymous session read is allowed while writer is hard off',async()=>{
  const f=fixture({enabled:false});
  const res=await f.api.handle(new Request(origin+'/session'));
  assert.equal(res.status,200);
  assert.equal((await read(res)).authorized,true);
  assert.equal(f.calls.writes,0);
});

test('D3-A10 session advertises writer readiness only when server is armed',async()=>{
 const disabled=fixture({enabled:false});
 const blocked=await disabled.api.handle(new Request(origin+'/session'));
 assert.equal((await blocked.json()).sandboxPublishingReady,false);
 const enabled=fixture();
 const allowed=await enabled.api.handle(new Request(origin+'/session'));
 assert.equal((await allowed.json()).sandboxPublishingReady,true);
 assert.equal(enabled.calls.writes,0);
});
test('D3-A09 lost 202 replays the original receipt WITHOUT revalidating moved source',async()=>{
  const f=fixture({existing:true,conflict:true,goodSource:false});
  const res=await f.api.handle(newPost(envelope(await edit())));
  assert.equal(res.status,200);
  const body=await res.json();
  assert.equal(body.operationId,OP);
  assert.equal(body.state,'Checking');
  assert.equal(body.accepted,true);
  assert.equal(body.duplicate,true);
  assert.equal(body.canonicalLive,false);
  assert.equal(f.calls.validations,0);
  assert.equal(f.calls.writes,0);
  assert.equal(f.calls.authorizations,1);
});

test('D3-UX04 both latest and tracked operation GET return the owner-only durable display summary',async()=>{
 const calls={summary:0,authorization:0};
 const record={operationId:OP,state:'Live',verifiedReleaseId:'a'.repeat(32)};
 const display={domain:'gear',action:'edit',itemName:'Garmin Force Current',
  completedAt:1793360000,reasonCode:null};
 const store={
  accept:async()=>{throw Error('POST must not run');},
  lookupReceipt:async()=>null,
  latest:async()=>record,
  get:async id=>id===OP?record:null,
  summary:async id=>{calls.summary++;assert.equal(id,OP);return display;},
 };
 const session={
  describe:async()=>({authenticated:true,authorized:true}),
  authorizeWrite:async()=>{throw Error('POST must not run');},
  authorizeStatus:async()=>{calls.authorization++;return {authorized:true,ownerGitHubId:OWNER};},
 };
 const api=createD3GuardedOperationsApi({session,store,enabled:()=>true,
  validateCandidate:async()=>{throw Error('no writer');}});
 for(const path of ['/api/v3/operations/latest','/api/v3/operations/'+OP]){
  const response=await api.handle(new Request(origin+path,{method:'GET'}));
  assert.equal(response.status,200);
  const body=await response.json();
  assert.deepEqual(body.operation.summary,display);
  assert.equal(body.canonicalLive,false);
 }
 assert.equal(calls.summary,2);
 assert.equal(calls.authorization,2);
 const bad=createD3GuardedOperationsApi({
  session:{...session,authorizeStatus:async()=>({authorized:false,ownerGitHubId:OWNER})},
  store,enabled:()=>true,validateCandidate:async()=>{throw Error('no writer');},
 });
 assert.notEqual((await bad.handle(new Request(origin+'/api/v3/operations/latest'))).status,200);
 assert.equal(calls.summary,2,'anonymous requests never read owner details');
});
