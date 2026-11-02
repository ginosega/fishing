import test from 'node:test';
import assert from 'node:assert/strict';
import {createD3OneStepVerifiedSource}
 from '../src/d3-one-step-verified-source.mjs';

const ID=1430581407;
const op='p3_6bff0a3b-caff-44e2-a4f8-2cafe12842c1';
const other='p3_4c5f68ec-aad0-4ee5-b33b-1ee812b9e970';
const head='a'.repeat(40),next='b'.repeat(40);

function fixture(){
 const calls=[];
 const loadSnapshot=async args=>{
  calls.push({...args});
  if(args.repositoryId!==ID)throw Error('REPOSITORY_DENIED');
  if(args.expectedMainSha&&args.expectedMainSha!==head)
   throw Error('MAIN_MOVED');
  return {repositoryId:ID,sourceRevision:head,
   operationId:args.operationId??null,
   data:{gear:{items:[]},kb:{entities:[]},catches:{catches:[]}},
   files:new Set(),markdown:new Map(),blobHashes:new Map()};
 };
 return {...createD3OneStepVerifiedSource({loadSnapshot}),calls};
}
test('STEP-01 one full verified GitHub source read is reused only for same immutable operation and HEAD',async()=>{
 const f=fixture();
 assert.equal(await f.currentMain({repositoryId:ID,operationId:op}),head);
 assert.equal(f.calls.length,1);
 const value=await f.loadForCandidate({repositoryId:ID,operationId:op,
  expectedMainSha:head});
 assert.equal(value.sourceRevision,head);
 assert.equal(value.operationId,op);
 assert.equal(f.calls.length,1,'not a second full GitHub snapshot');
});
test('STEP-02 one-shot consumed snapshot cannot be reused again',async()=>{
 const f=fixture();
 await f.currentMain({repositoryId:ID,operationId:op});
 await f.loadForCandidate({repositoryId:ID,operationId:op,expectedMainSha:head});
 await f.loadForCandidate({repositoryId:ID,operationId:op,expectedMainSha:head});
 assert.equal(f.calls.length,2);
 assert.equal(f.calls[1].expectedMainSha,head);
});
test('STEP-03 wrong operation never receives the cached source',async()=>{
 const f=fixture();
 await f.currentMain({repositoryId:ID,operationId:op});
 await f.loadForCandidate({repositoryId:ID,operationId:other,expectedMainSha:head});
 assert.equal(f.calls.length,2);
 assert.equal(f.calls[1].operationId,other);
});
test('STEP-04 wrong main SHA requires the full original expected-HEAD verifier',async()=>{
 const f=fixture();
 await f.currentMain({repositoryId:ID,operationId:op});
 await assert.rejects(f.loadForCandidate({repositoryId:ID,operationId:op,
  expectedMainSha:next}),/MAIN_MOVED/);
 assert.equal(f.calls.length,2);
 assert.equal(f.calls[1].expectedMainSha,next);
});
test('STEP-05 wrong repository is denied through original remote trust gate',async()=>{
 const f=fixture();
 await f.currentMain({repositoryId:ID,operationId:op});
 await assert.rejects(f.loadForCandidate({repositoryId:44,operationId:op,
  expectedMainSha:head}),/REPOSITORY_DENIED/);
 assert.equal(f.calls.length,2);
});
test('STEP-06 invalid operation rejected without token or source access',async()=>{
 const f=fixture();
 await assert.rejects(f.currentMain({repositoryId:ID,operationId:'untrusted'}),
  /INVALID_SOURCE_SCOPE/);
 assert.equal(f.calls.length,0);
});
test('STEP-07 failed first verification leaves no stored snapshot',async()=>{
 let calls=0;
 const f=createD3OneStepVerifiedSource({
  loadSnapshot:async()=>{calls++;throw Error('MAIN_MOVED');},
 });
 await assert.rejects(f.currentMain({repositoryId:ID,operationId:op}),/MAIN_MOVED/);
 await assert.rejects(f.loadForCandidate({repositoryId:ID,operationId:op,
  expectedMainSha:head}),/MAIN_MOVED/);
 assert.equal(calls,2);
});
test('STEP-08 starting another validation clears previous operation snapshot',async()=>{
 const f=fixture();
 await f.currentMain({repositoryId:ID,operationId:op});
 await f.currentMain({repositoryId:ID,operationId:other});
 await f.loadForCandidate({repositoryId:ID,operationId:op,expectedMainSha:head});
 assert.equal(f.calls.length,3);
});
test('STEP-09 source proof with foreign returned identity cannot be reused',async()=>{
 let count=0;
 const f=createD3OneStepVerifiedSource({loadSnapshot:async()=>{
  count++;return {repositoryId:44,operationId:op,sourceRevision:head};
 }});
 await assert.rejects(f.currentMain({repositoryId:ID,operationId:op}),
  /UNVERIFIED_SOURCE_SNAPSHOT/);
 assert.equal(count,1);
});
test('STEP-10 constructed without a verified source loader is denied',()=>{
 assert.throws(()=>createD3OneStepVerifiedSource(),/INVALID_SOURCE_LOADER/);
});
