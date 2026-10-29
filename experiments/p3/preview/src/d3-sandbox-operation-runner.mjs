/**
 * FISH118 D3 -- private-sandbox-only Gear/KB operation state machine.
 * SOURCE-ONLY, disabled by default, NO Cloudflare route or Cron registered.
 * Inherits the D2 durable merge-attempt write-ahead barrier without changing
 * or resubmitting the completed D2 fixture operation.
 *
 * Callbacks are trusted, lease-bound server adapters. Real CI, ordinary merge
 * and hosted-byte verification are required; test mocks do not prove Live.
 */
import {safePath} from '../../../../pwa/src/shared.mjs';
const ID=1430581407;
const OP=/^p3_[0-9a-f-]{36}$/;
const SHA=/^[a-f0-9]{40}$/;
const RELEASE=/^[a-f0-9]{32}$/;
const BRANCH=id=>'p3-test-'+id.slice(3);
export class D3RunnerError extends Error{
  constructor(code){
    super('D3 private-sandbox operation blocked');
    this.name='D3RunnerError';this.code=code;
  }
}
const fail=code=>{throw new D3RunnerError(code);};
const need=(v,code)=>{if(!v)fail(code);};
const positive=n=>Number.isSafeInteger(n)&&n>0;
function textOnly(pkg){
  return pkg?.format==='fishing-companion-change-v2'&&
    ['gear','kb'].includes(pkg.domain)&&
    ['add','edit'].includes(pkg.operation)&&
    pkg.picture?.action==='keep'&&
    (pkg.pictureSequence?.action??'keep')==='keep'&&
    ['keep','create','replace'].includes(pkg.notes?.action);
}
function expectedPaths(pkg){
  need(textOnly(pkg),'INVALID_SNAPSHOT');
  const canonical=pkg.domain==='gear'?'pwa/Gear/gear.json':
    'pwa/KB/kb.json';
  const paths=[canonical];
  if(pkg.notes.action!=='keep'){
    let relative;
    try{relative=safePath(pkg.notes.path);}
    catch{fail('UNSAFE_MARKDOWN_PATH');}
    const prefix=pkg.domain==='gear'?'Gear/':'KB/';
    need(relative.startsWith(prefix)&&relative.includes('/content/')&&
      relative.endsWith('.md'),'UNSAFE_MARKDOWN_PATH');
    paths.push('pwa/'+relative);
  }
  return paths;
}
function exactPaths(expected,observed){
  return Array.isArray(observed)&&
    expected.length===observed.length&&
    new Set(observed).size===observed.length&&
    expected.every(p=>observed.includes(p));
}
export function createD3SandboxOperationRunner({
  store,currentMain,createDraft,observeCheck,merge,verifyHosted,
  enabled=()=>false,
  measure=async(_phase,work)=>work(),
}={}){
  need(['claim','get','advance','readSnapshot','markMergeAttempt'].every(x=>
    typeof store?.[x]==='function')&&
    [currentMain,createDraft,observeCheck,merge,verifyHosted,enabled,measure]
      .every(x=>typeof x==='function'),'INVALID_CONFIGURATION');
  async function run({operationId,leaseOwner}={}){
    need(enabled()===true,'RUNNER_DISABLED');
    need(OP.test(operationId??'')&&
      typeof leaseOwner==='string'&&
      /^[A-Za-z0-9_-]{12,96}$/.test(leaseOwner),'INVALID_REQUEST');
    const claimed=await measure('lease_claim',()=>store.claim({operationId,leaseOwner}));
    if(!claimed)return Object.freeze({progressed:false,reason:'NOT_CLAIMED',
      operationId,canonicalLive:false});
    const state=claimed.state;
    const record=await store.get(operationId);
    need(record?.operationId===operationId&&record.state===state,
      'RECEIPT_DRIFT');
    const advance=async(to,details={})=>{
      const work=()=>store.advance({operationId,leaseOwner,
        from:state,to,details});
      const row=await (to==='Live'?measure('state_to_live',work):work());
      need(row?.operationId===operationId&&row.state===to,'D1_CAS_DENIED');
      return Object.freeze({progressed:true,operationId,state:to,
        canonicalLive:false});
    };
    if(state==='Accepted')return advance('Validating');
    if(state==='Validating'){
      const saved=await measure('snapshot_validation',()=>store.readSnapshot(operationId));
      need(textOnly(saved?.package)&&Array.isArray(saved.media)&&
        saved.media.length===0,'INVALID_SNAPSHOT');
      const pkg=saved.package;
      expectedPaths(pkg);
      const base=await currentMain({repositoryId:ID,operationId,
        package:pkg});
      need(SHA.test(base),'MAIN_UNVERIFIED');
      const pr=await measure('github_prepare_pr',()=>createDraft({operationId,repositoryId:ID,
        expectedMainSha:base,domain:pkg.domain,package:pkg,leaseOwner}));
      need(pr?.baseSha===base&&SHA.test(pr.headSha)&&
        positive(pr.number)&&pr.state==='open'&&pr.merged===false&&
        pr.branch===BRANCH(operationId),'PR_UNVERIFIED');
      return advance('Checking',{prNumber:pr.number,
        prHeadSha:pr.headSha,mainBaseSha:base});
    }
    const receipt={repositoryId:ID,prNumber:record.prNumber,
      expectedHeadSha:record.prHeadSha,
      expectedBaseSha:record.mainBaseSha,
      expectedBranch:BRANCH(operationId)};
    if(['Checking','Merging'].includes(state)){
      need(positive(receipt.prNumber)&&
        SHA.test(receipt.expectedHeadSha??'')&&
        SHA.test(receipt.expectedBaseSha??''),
        'PR_RECEIPT_MISSING');
    }
    if(state==='Checking'){
      let check;
      try{check=await measure('check_observation',()=>observeCheck(receipt));}
      catch(error){
        // A pending (read-only) GitHub check must release this exact D1
        // lease so the next DO alarm can retry before the 60s TTL.
        // Unknown check, identity, merge and network outcomes are NEVER
        // silently treated as a successful check or published release.
        if(['CHECK_PENDING','CHECK_MISSING_OR_AMBIGUOUS'].includes(error?.code)){
          const released=await store.releasePendingCheckLease({operationId,leaseOwner});
          need(released===true,'CHECK_LEASE_RELEASE_DENIED');
        }
        throw error;
      }
      need(check?.repositoryId===ID&&
        check.prNumber===receipt.prNumber&&
        check.headSha===receipt.expectedHeadSha&&
        check.baseSha===receipt.expectedBaseSha&&
        check.actionsAppId===15368&&
        check.checkName==='validate-sandbox-head'&&
        check.checkObserved==='success'&&
        positive(check.checkRunId)&&positive(check.workflowRunId),
        'CHECK_UNVERIFIED');
      return advance('Merging',{workflowRunId:check.workflowRunId});
    }
    if(state==='Merging'){
      // If remote merge outcome is ambiguous, leave the D1 marker intact
      // for an independently proved read-only reconciliation. Never retry.
      need(record.reasonCode==null,'MERGE_RECONCILIATION_REQUIRED');
      const marked=await store.markMergeAttempt({operationId,leaseOwner});
      need(marked===true,'MERGE_RECONCILIATION_REQUIRED');
      const result=await measure('github_protected_merge',()=>merge({...receipt,operationId,leaseOwner}));
      need(result?.sandboxMerged===true&&
        result.repositoryId===ID&&result.canonicalLive===false&&
        SHA.test(result.mergeSha),'MERGE_UNVERIFIED');
      return advance('Deploying',{mergeSha:result.mergeSha});
    }
    if(state==='Deploying'){
      need(SHA.test(record.mergeSha??''),'MERGE_RECEIPT_MISSING');
      return advance('Verifying');
    }
    if(state==='Verifying'){
      need(SHA.test(record.mergeSha??''),'MERGE_RECEIPT_MISSING');
      const saved=await store.readSnapshot(operationId);
      need(textOnly(saved?.package)&&Array.isArray(saved.media)&&
        saved.media.length===0,'INVALID_SNAPSHOT');
      const paths=expectedPaths(saved.package);
      const verified=await measure('hosted_byte_release_proof',()=>verifyHosted({
        operationId,repositoryId:ID,mergeSha:record.mergeSha,
        expectedPaths:paths,canonicalLive:false,
      }));
      need(verified?.verified===true&&
        verified.repositoryId===ID&&
        verified.mergeSha===record.mergeSha&&
        verified.canonicalLive===false&&
        exactPaths(paths,verified.verifiedPaths)&&
        RELEASE.test(verified.verifiedReleaseId)&&
        positive(verified.workflowRunId),'HOSTED_UNVERIFIED');
      return advance('Live',{verifiedReleaseId:verified.verifiedReleaseId,
        workflowRunId:verified.workflowRunId});
    }
    fail('TERMINAL_OR_UNKNOWN_STATE');
  }
  return Object.freeze({run});
}
