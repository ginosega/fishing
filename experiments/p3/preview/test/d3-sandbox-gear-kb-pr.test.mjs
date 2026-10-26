import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createD3SandboxGearKBPRAdapter,D3SandboxPRError}
  from '../src/d3-sandbox-gear-kb-pr.mjs';

const ID=1430581407,OP='p3_01234567-1234-4234-8234-123456789abc';
const BASE='8'.repeat(40),TREE='9'.repeat(40),NEXT='a'.repeat(40);
const API='https://api.github.com/repos/ginosega/fishing-p3-sandbox';
const BRANCH='p3-test-'+OP.slice(3);
const json={action:'write',path:'pwa/KB/kb.json',
  body:'{"schemaVersion":2,"entities":[]}\n'};
const md={action:'write',
  path:'pwa/KB/Locations/content/P3 Test Lake.md',
  body:'# P3 Test Lake\n\nSandbox validation.\n'};
const pkg={domain:'kb',operation:'edit',id:'location-p3-test-lake'};
const denied=code=>e=>e instanceof D3SandboxPRError&&e.code===code;
const reply=(value,status=200)=>({ok:status===200,status,
  redirected:false,json:async()=>value});
const gitHash=bytes=>createHash('sha1')
  .update(Buffer.from('blob '+bytes.length+'\0'))
  .update(bytes).digest('hex');

function fixture({enabled=true,wrongRepo=false,badToken=false,
  changedMain=false,planned=[json,md],candidateDomain='kb',
  existingBranch=false,receipt=true,badBlob=false,
  wrongPR=false,oldReceipt=false}={}){
  const trace=[];
  let mainReads=0,branchCommitted=false,branchHead=NEXT,prExists=false;
  const request=async(url,options)=>{
    trace.push({url,method:options.method,body:options.body});
    assert(url===API||url.startsWith(API+'/'));
    assert.equal(options.redirect,'manual');
    assert.equal(options.headers.Authorization,'Bearer d3-sandbox-write-token');
    if(url===API&&options.method==='GET')
      return reply({id:wrongRepo?1350909744:ID,
        full_name:'ginosega/fishing-p3-sandbox',private:true});
    if(url===API+'/git/ref/heads/main'&&options.method==='GET'){
      mainReads++;
      return reply({object:{sha:changedMain&&mainReads>1?NEXT:BASE}});
    }
    if(url===API+'/git/ref/heads/'+BRANCH&&options.method==='GET')
      return existingBranch?reply({object:{sha:branchHead}}):reply({},404);
    if(url===API+'/git/commits/'+BASE)
      return reply({sha:BASE,tree:{sha:TREE}});
    if(url===API+'/git/commits/'+NEXT)
      return reply({sha:NEXT,parents:[{sha:BASE}]});
    if(url===API+'/git/blobs'&&options.method==='POST'){
      const b=JSON.parse(options.body);
      const bytes=Buffer.from(b.content,'base64');
      return reply({sha:badBlob?'f'.repeat(40):gitHash(bytes)});
    }
    if(url===API+'/git/trees'&&options.method==='POST')
      return reply({sha:'c'.repeat(40)});
    if(url===API+'/git/commits'&&options.method==='POST'){
      const body=JSON.parse(options.body);
      return reply({sha:NEXT,tree:{sha:'c'.repeat(40)},
        parents:body.parents.map(sha=>({sha}))});
    }
    if(url===API+'/git/refs'&&options.method==='POST'){
      const body=JSON.parse(options.body);
      branchCommitted=true;branchHead=body.sha;
      return reply({ref:body.ref,object:{sha:body.sha}});
    }
    if(url.startsWith(API+'/pulls?')&&options.method==='GET'){
      return reply(prExists?[{
        number:17,head:{ref:BRANCH,sha:wrongPR?BASE:branchHead,repo:{id:ID}},
        base:{ref:'main',repo:{id:ID}},state:'open',merged_at:null,
      }]:[]);
    }
    if(url===API+'/pulls'&&options.method==='POST'){
      prExists=true;
      return reply({
        number:17,head:{ref:BRANCH,sha:wrongPR?BASE:branchHead,repo:{id:ID}},
        base:{ref:'main',repo:{id:ID}},state:'open',merged_at:null,
      });
    }
    throw Error('Unexpected API call: '+options.method+' '+url);
  };
  const adapter=createD3SandboxGearKBPRAdapter({
    enabled:()=>enabled,request,
    issueToken:async ()=>({
      repositoryId:ID,
      token:'d3-sandbox-write-token',
      permissions:{contents:badToken?'read':'write',pull_requests:'write'},
    }),
    trustedCandidate:async()=>({
      validated:true,repositoryId:ID,operationId:OP,sourceRevision:BASE,
      domain:candidateDomain,operation:'edit',
      changes:planned,
    }),
    knownBranchReceipt:async()=>receipt?{
      operationId:OP,repositoryId:ID,baseSha:oldReceipt?NEXT:BASE,
      headSha:NEXT,branch:BRANCH,
    }:null,
    onBranchCreated:async data=>data,
  });
  const create=()=>adapter.createDraft({
    operationId:OP,domain:'kb',expectedMainSha:BASE,package:pkg,
  });
  return {adapter,create,trace,
    get branchCommitted(){return branchCommitted;},
    get mainReads(){return mainReads;}};
}

test('D3-P01 hard-off by default causes no token or GitHub call',async()=>{
  const a=createD3SandboxGearKBPRAdapter({
    request:()=>{throw Error('no request');},
    issueToken:()=>{throw Error('no token');},
    trustedCandidate:()=>{throw Error('no planner');},
  });
  await assert.rejects(a.createDraft({
    operationId:OP,domain:'kb',expectedMainSha:BASE,package:pkg,
  }),denied('WRITES_DISABLED'));
});

test('D3-P02 source-planned JSON+Markdown becomes one draft PR, no merge',async()=>{
  const x=fixture(),receipt=await x.create();
  assert.equal(receipt.number,17);
  assert.equal(receipt.baseSha,BASE);
  assert.equal(receipt.headSha,NEXT);
  assert.equal(receipt.branch,BRANCH);
  assert.equal(receipt.state,'open');
  assert.equal(receipt.merged,false);
  assert.equal(receipt.reused,false);
  assert(x.branchCommitted);
  assert.equal(x.mainReads,2);
  const blobs=x.trace.filter(r=>r.url===API+'/git/blobs');
  assert.equal(blobs.length,2);
  const contents=blobs.map(r=>Buffer.from(JSON.parse(r.body).content,'base64').toString());
  assert.deepEqual(contents,[json.body,md.body]);
  assert(!x.trace.some(r=>/\/merge$/.test(r.url)));
  assert(x.trace.every(r=>r.url.startsWith(API)));
});

test('D3-P03 invalid repo or permission prevents all mutating calls',async()=>{
  for(const choice of [
    {badToken:true,code:'TOKEN_SCOPE_DENIED'},
    {wrongRepo:true,code:'REPOSITORY_DENIED'},
  ]){
    const x=fixture(choice);
    await assert.rejects(x.create(),denied(choice.code));
    assert(!x.trace.some(r=>r.method==='POST'));
  }
});

test('D3-P04 browser-supplied candidate path cannot mutate Catches or scripts',async()=>{
  const invalid=[
    [json,{...md,path:'pwa/Catches/catches.json'}],
    [{...json,path:'pwa/Catches/catches.json'}],
    [json,{...md,path:'pwa/KB/../../worker.js'}],
    [json,{...md,path:'pwa/Gear/Lures/content/Other.md'}],
  ];
  for(const changes of invalid){
    const x=fixture({planned:changes});
    await assert.rejects(x.create(),denied('UNSAFE_CANDIDATE_WRITE'));
    assert(!x.trace.some(r=>r.method==='POST'));
  }
});

test('D3-P05 unverified source, corrupt returned blob, moving main deny safely',async()=>{
  const source=fixture({candidateDomain:'gear'});
  await assert.rejects(source.create(),denied('CANDIDATE_UNVERIFIED'));
  const badBlob=fixture({badBlob:true});
  await assert.rejects(badBlob.create(),denied('GITHUB_BLOB_MISMATCH'));
  assert(!badBlob.branchCommitted);
  const moved=fixture({changedMain:true});
  await assert.rejects(moved.create(),denied('MAIN_MOVED_AFTER_VALIDATION'));
  assert(!moved.branchCommitted);
});

test('D3-P06 preexisting branch without exact durable receipt cannot resume',async()=>{
  for(const options of [
    {existingBranch:true,receipt:false},
    {existingBranch:true,oldReceipt:true},
  ]){
    const x=fixture(options);
    await assert.rejects(x.create(),denied('BRANCH_RECONCILIATION_REQUIRED'));
    assert(!x.trace.some(r=>r.method==='POST'));
  }
});

test('D3-P07 exact durable branch receipt can resume missing draft PR only',async()=>{
  const x=fixture({existingBranch:true,receipt:true});
  const r=await x.create();
  assert.equal(r.reused,false);
  assert.equal(r.headSha,NEXT);
  assert.equal(x.trace.filter(z=>z.method==='POST').length,1);
  assert.equal(x.trace.find(z=>z.method==='POST').url,API+'/pulls');
});

test('D3-P08 forged PR head does not pass verification',async()=>{
  const x=fixture({wrongPR:true});
  await assert.rejects(x.create(),denied('PR_IDENTITY_DENIED'));
  assert(x.branchCommitted);
});
