/**
 * FISH118 D2 -- isolated SOURCE-ONLY server-side one-step scheduler.
 * No public HTTP endpoint, default OFF, no credentials, no default fetch,
 * no automatic retries of unknown GitHub merge outcomes. A trusted private
 * scheduled handler (not yet installed) must provide each capability.
 *
 * A sandbox "Live" terminal status means only sandbox test-byte verified;
 * canonicalLive is ALWAYS false. Public repo writes are forbidden.
 */
const ID=1430581407;
const OP=/^p3_[a-f0-9-]{36}$/;
const SHA=/^[a-f0-9]{40}$/;
const REL=/^[a-f0-9]{32}$/;
export class D2RunnerError extends Error{
 constructor(code){super('D2 sandbox operation blocked');this.name='D2RunnerError';this.code=code;}
}
const fail=code=>{throw new D2RunnerError(code);};
const need=(ok,code)=>{if(!ok)fail(code);};
const okNumber=n=>Number.isSafeInteger(n)&&n>0;
const branch=operationId=>'p3-test-'+operationId.slice(3);
export function createD2SandboxOperationRunner({
 store,currentMain,createDraft,observeCheck,merge,verifyHosted,
 enabled=()=>false,
}={}){
 need(['claim','get','advance','readSnapshot','markMergeAttempt'].every(x=>typeof store?.[x]==='function')&&
  [currentMain,createDraft,observeCheck,merge,verifyHosted,enabled]
   .every(x=>typeof x==='function'),'INVALID_CONFIG');
 async function run({operationId,leaseOwner}={}){
  need(enabled()===true,'RUNNER_DISABLED');
  need(OP.test(operationId??'')&&
   typeof leaseOwner==='string'&&/^[A-Za-z0-9_-]{12,96}$/.test(leaseOwner),
   'INVALID_REQUEST');
  const claimed=await store.claim({operationId,leaseOwner});
  if(!claimed)return Object.freeze({progressed:false,reason:'NOT_CLAIMED',
   operationId,canonicalLive:false});
  const state=claimed.state;
  const record=await store.get(operationId);
  need(record?.operationId===operationId&&record.state===state,
   'RECEIPT_DRIFT');
  const advance=async(to,details={})=>{
   const next=await store.advance({
    operationId,leaseOwner,from:state,to,details,
   });
   need(next?.operationId===operationId&&next.state===to,
    'D1_CAS_DENIED');
   return Object.freeze({progressed:true,operationId,state:to,canonicalLive:false});
  };
  if(state==='Accepted')return advance('Validating');
  if(state==='Validating'){
   const snapshot=await store.readSnapshot(operationId);
   need(snapshot?.package?.format==='fishing-companion-change-v2'&&
    snapshot.package.domain==='gear'&&
    snapshot.package.operation==='edit'&&
    snapshot.package.id==='p3-test-rod'&&
    Array.isArray(snapshot.media)&&snapshot.media.length===0,
    'SNAPSHOT_DENIED');
   const sha=await currentMain({repositoryId:ID,operationId,package:snapshot.package});
   need(SHA.test(sha),'MAIN_UNVERIFIED');
   // This callback MUST re-fetch source, revalidate & durably save branch
   // receipt under lease BEFORE PR creation; never trust the snapshot alone.
   const pr=await createDraft({operationId,repositoryId:ID,
    expectedMainSha:sha,package:snapshot.package,leaseOwner});
   need(pr?.baseSha===sha&&SHA.test(pr.headSha)&&
    okNumber(pr.number)&&pr.state==='open'&&pr.merged===false&&
    pr.branch===branch(operationId),'PR_UNVERIFIED');
   return advance('Checking',{
    prNumber:pr.number,prHeadSha:pr.headSha,mainBaseSha:sha,
   });
  }
  const info={
   repositoryId:ID,prNumber:record.prNumber,
   expectedHeadSha:record.prHeadSha,
   expectedBaseSha:record.mainBaseSha,
   expectedBranch:branch(operationId),
  };
  if(['Checking','Merging'].includes(state)){
   need(okNumber(info.prNumber)&&SHA.test(info.expectedHeadSha)&&
    SHA.test(info.expectedBaseSha),'PR_RECEIPT_MISSING');
  }
  if(state==='Checking'){
   const check=await observeCheck(info);
   need(check?.repositoryId===ID&&
    check.prNumber===info.prNumber&&
    check.headSha===info.expectedHeadSha&&
    check.baseSha===info.expectedBaseSha&&
    check.actionsAppId===15368&&
    check.checkName==='validate-sandbox-head'&&
    check.checkObserved==='success'&&okNumber(check.checkRunId),
    'CHECK_UNVERIFIED');
   return advance('Merging');
  }
  if(state==='Merging'){
   // First persist a D1 write-ahead merge marker. Even if the process
   // crashes before or during a GitHub call, the next worker must NOT
   // issue another remote mutation. Only read-only reconciliation may
   // determine whether that first attempt was already applied.
   need(record.reasonCode==null,'MERGE_RECONCILIATION_REQUIRED');
   const marked=await store.markMergeAttempt({operationId,leaseOwner});
   need(marked===true,'MERGE_RECONCILIATION_REQUIRED');
   const result=await merge({...info,operationId,leaseOwner});
   need(result?.sandboxMerged===true&&
    result.repositoryId===ID&&
    result.canonicalLive===false&&
    SHA.test(result.mergeSha),'MERGE_UNVERIFIED');
   return advance('Deploying',{mergeSha:result.mergeSha});
  }
  if(state==='Deploying'){
   need(SHA.test(record.mergeSha??''),'MERGE_RECEIPT_MISSING');
   return advance('Verifying');
  }
  if(state==='Verifying'){
   need(SHA.test(record.mergeSha??''),'MERGE_RECEIPT_MISSING');
   const hosted=await verifyHosted({operationId,repositoryId:ID,
    mergeSha:record.mergeSha,expectedPath:'pwa/Gear/gear.json',
    canonicalLive:false});
   need(hosted?.verified===true&&hosted.repositoryId===ID&&
    hosted.mergeSha===record.mergeSha&&hosted.canonicalLive===false&&
    REL.test(hosted.verifiedReleaseId)&&okNumber(hosted.workflowRunId),
    'HOSTED_UNVERIFIED');
   return advance('Live',{verifiedReleaseId:hosted.verifiedReleaseId,
    workflowRunId:hosted.workflowRunId});
  }
  fail('TERMINAL_OR_UNKNOWN_STATE');
 }
 return Object.freeze({run});
}
