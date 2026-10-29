import test from 'node:test';
import assert from 'node:assert/strict';
import {createD3SandboxOperationRunner,D3RunnerError}
  from '../src/d3-sandbox-operation-runner.mjs';

const ID=1430581407,OP='p3_01234567-1234-4234-8234-123456789abc';
const BASE='a'.repeat(40),HEAD='b'.repeat(40),MERGE='c'.repeat(40);
const BRANCH='p3-test-'+OP.slice(3);
const PATH='KB/Locations/content/P3 Test Lake.md';
const failure=code=>e=>e instanceof D3RunnerError&&e.code===code;
const pkg=(domain='gear',notesAction='keep')=>({
  format:'fishing-companion-change-v2',domain,operation:'edit',
  id:domain==='gear'?'p3-test-rod':'location-p3-test-lake',
  picture:{action:'keep'},pictureSequence:{action:'keep'},
  notes:{action:notesAction,...(notesAction!=='keep'?{path:PATH}:{})},
});
function fixture({domain='gear',notesAction='keep',enabled=true,
  unknownMerge=false,invalidCheck=false,invalidPaths=false,
  invalidPR=false,stolenLease=false,untrustedHost=false,
  invalidSnapshot=false,pendingCheck=false}={}){
  const trace=[];let row={operationId:OP,state:'Accepted'};
  const snapshot=()=>invalidSnapshot?{}:{package:pkg(domain,notesAction),media:[]};
  const expected=domain==='gear'?['pwa/Gear/gear.json']:
    notesAction==='keep'?['pwa/KB/kb.json']:
    ['pwa/KB/kb.json','pwa/'+PATH];
  const store={
    claim:async({operationId})=>{
      trace.push('claim');
      return stolenLease?null:{operationId,state:row.state};
    },
    get:async()=>structuredClone(row),
    releasePendingCheckLease:async({operationId,leaseOwner})=>{
      trace.push('release-pending');
      assert.equal(operationId,OP);
      assert.equal(leaseOwner,'lease-owner-012345');
      return row.state==='Checking';
    },
    readSnapshot:async()=>snapshot(),
    markMergeAttempt:async()=>{
      trace.push('mark-merge');
      if(row.state!=='Merging'||row.reasonCode!=null)return false;
      row.reasonCode='merge_attempted';return true;
    },
    advance:async({from,to,details})=>{
      assert.equal(row.state,from);
      trace.push('advance:'+from+'>'+to);
      row={...row,state:to,
        ...(from==='Merging'&&to==='Deploying'?{reasonCode:null}:{}),
        ...details};
      return structuredClone(row);
    },
  };
  const runner=createD3SandboxOperationRunner({
    enabled:()=>enabled,store,
    currentMain:async info=>{
      trace.push('main');assert.equal(info.repositoryId,ID);
      return BASE;
    },
    createDraft:async info=>{
      trace.push('PR');assert.equal(info.repositoryId,ID);
      assert.equal(info.expectedMainSha,BASE);
      assert.equal(info.domain,domain);
      return {number:18,branch:invalidPR?'wrong':BRANCH,
        baseSha:BASE,headSha:HEAD,state:'open',merged:false};
    },
    observeCheck:async info=>{
      trace.push('check');
      assert.equal(info.expectedHeadSha,HEAD);
      if(pendingCheck)throw Object.assign(new Error('CI is pending'),{code:'CHECK_PENDING'});
      return {repositoryId:ID,prNumber:18,
        headSha:invalidCheck?'f'.repeat(40):HEAD,
        baseSha:BASE,actionsAppId:15368,checkName:'validate-sandbox-head',
        checkObserved:'success',checkRunId:125,workflowRunId:126};
    },
    merge:async info=>{
      trace.push('merge');
      assert.equal(info.repositoryId,ID);
      if(unknownMerge)throw Error('remote merge receipt uncertain');
      return {repositoryId:ID,sandboxMerged:true,
        canonicalLive:false,mergeSha:MERGE};
    },
    verifyHosted:async info=>{
      trace.push('host');
      assert.equal(info.mergeSha,MERGE);
      assert.deepEqual(info.expectedPaths,expected);
      return {verified:!untrustedHost,repositoryId:ID,
        mergeSha:MERGE,canonicalLive:false,
        verifiedPaths:invalidPaths?expected.slice(0,1):expected,
        verifiedReleaseId:'d'.repeat(32),workflowRunId:126};
    },
  });
  return {runner,trace,expected,
    run:()=>runner.run({operationId:OP,leaseOwner:'lease-owner-012345'}),
    get state(){return row.state;}};
}

test('D3-R01 no enabled Worker means no D1 lease or GitHub operation',async()=>{
  const x=fixture({enabled:false});
  await assert.rejects(x.run(),failure('RUNNER_DISABLED'));
  assert.deepEqual(x.trace,[]);
});

test('D3-R02 Gear edit advances one durable state per run, sandbox Live only',async()=>{
  const x=fixture();
  for(const state of ['Validating','Checking','Merging','Deploying',
    'Verifying','Live']){
    const r=await x.run();
    assert.equal(r.state,state);
    assert.equal(r.canonicalLive,false);
  }
  assert.equal(x.state,'Live');
  assert.equal(x.trace.filter(v=>v==='merge').length,1);
  assert(x.trace.indexOf('mark-merge')<x.trace.indexOf('merge'));
});

test('D3-R03 KB Markdown requires both canonical JSON and Markdown hosted proof',async()=>{
  const x=fixture({domain:'kb',notesAction:'replace'});
  for(let i=0;i<6;i++)await x.run();
  assert.equal(x.state,'Live');
  assert.deepEqual(x.expected,['pwa/KB/kb.json','pwa/'+PATH]);
  const refused=fixture({domain:'kb',notesAction:'replace',invalidPaths:true});
  for(let i=0;i<5;i++)await refused.run();
  await assert.rejects(refused.run(),failure('HOSTED_UNVERIFIED'));
  assert.equal(refused.state,'Verifying');
});

test('D3-R04 existing remote merge uncertainty prevents every blind retry',async()=>{
  const x=fixture({unknownMerge:true});
  for(let i=0;i<3;i++)await x.run();
  await assert.rejects(x.run(),/remote merge receipt uncertain/);
  assert.equal(x.state,'Merging');
  await assert.rejects(x.run(),failure('MERGE_RECONCILIATION_REQUIRED'));
  assert.equal(x.trace.filter(v=>v==='merge').length,1);
});

test('D3-R05 stale checks and forged PR branch cannot advance to merge',async()=>{
  for(const prop of ['invalidPR','invalidCheck']){
    const x=fixture({[prop]:true});
    await x.run();
    if(prop==='invalidPR'){
      await assert.rejects(x.run(),failure('PR_UNVERIFIED'));
      assert.equal(x.state,'Validating');
    }else{
      await x.run();
      await assert.rejects(x.run(),failure('CHECK_UNVERIFIED'));
      assert.equal(x.state,'Checking');
    }
    assert.equal(x.trace.includes('merge'),false);
  }
});

test('D3-R06 lease refusal and invalid original snapshot are nonmutating',async()=>{
  const x=fixture({stolenLease:true});
  assert.equal((await x.run()).progressed,false);
  assert.equal(x.trace.includes('main'),false);
  const y=fixture({invalidSnapshot:true});
  await y.run();
  await assert.rejects(y.run(),failure('INVALID_SNAPSHOT'));
  assert.equal(y.trace.includes('PR'),false);
});

test('D3-R07 a false hosted success signal never labels canonical content Live',async()=>{
  const x=fixture({untrustedHost:true});
  for(let i=0;i<5;i++)await x.run();
  await assert.rejects(x.run(),failure('HOSTED_UNVERIFIED'));
  assert.equal(x.state,'Verifying');
});

test('D3-R08 invalid operation ID/lease input never claims state',async()=>{
  const x=fixture();
  await assert.rejects(x.runner.run({
    operationId:'invalid',leaseOwner:'lease-owner-012345',
  }),failure('INVALID_REQUEST'));
  await assert.rejects(x.runner.run({
    operationId:OP,leaseOwner:'short',
  }),failure('INVALID_REQUEST'));
  assert.equal(x.trace.length,0);
});

test('D3-R09 pending CI releases exact D1 lease, does not advance or merge',async()=>{
  const x=fixture({pendingCheck:true});
  await x.run(); // Accepted -> Validating
  await x.run(); // Validating -> Checking
  await assert.rejects(x.run(),e=>e.code==='CHECK_PENDING');
  assert.equal(x.state,'Checking');
  assert.equal(x.trace.filter(t=>t==='release-pending').length,1);
  assert.equal(x.trace.includes('merge'),false);
});
