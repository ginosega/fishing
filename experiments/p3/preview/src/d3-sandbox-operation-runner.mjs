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
    ['gear','kb','catches'].includes(pkg.domain)&&
    ['add','edit'].includes(pkg.operation)&&
    ['keep','add','replace','remove'].includes(pkg.picture?.action)&&
    ['keep','set','remove'].includes(pkg.pictureSequence?.action??'keep')&&
    ['keep','create','replace'].includes(pkg.notes?.action);
}
function expectedPaths(pkg,media=[]){
  need(textOnly(pkg),'INVALID_SNAPSHOT');
  const canonical=pkg.domain==='gear'?'pwa/Gear/gear.json':
    pkg.domain==='kb'?'pwa/KB/kb.json':'pwa/Catches/catches.json';
  const paths=[canonical];
  if(pkg.notes.action!=='keep'){
    let relative;
    try{relative=safePath(pkg.notes.path);}
    catch{fail('UNSAFE_MARKDOWN_PATH');}
    const prefix=pkg.domain==='gear'?'Gear/':
      pkg.domain==='kb'?'KB/':'Catches/content/';
    need(relative.startsWith(prefix)&&relative.includes('/content/')&&
      relative.endsWith('.md')&&
      (pkg.domain!=='catches'||relative.split('/').length===3),
      'UNSAFE_MARKDOWN_PATH');
    paths.push('pwa/'+relative);
  }
  for(const m of media){
    let relative;
    try{relative=safePath(m.path);}catch{fail('UNSAFE_MEDIA_PATH');}
    need(['gear','kb'].includes(pkg.domain)&&
      relative.startsWith(pkg.domain==='gear'?'Gear/':'KB/')&&
      relative.includes('/assets/')&&
      /\.(jpe?g|png|webp|gif)$/i.test(relative),
      'UNSAFE_MEDIA_PATH');
    paths.push('pwa/'+relative);
  }
  need(paths.length<=26&&new Set(paths).size===paths.length,
   'INVALID_EXPECTED_PATHS');
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
  verifyMerged=async()=>null,enabled=()=>false,
  verifyMedia=async(_pkg,media)=>{
    need(media.length===0,'MEDIA_DISABLED');return [];
  },
  measure=async(_phase,work)=>work(),
}={}){
  need(['claim','get','advance','readSnapshot','markMergeAttempt'].every(x=>
    typeof store?.[x]==='function')&&
    [currentMain,createDraft,observeCheck,merge,verifyMerged,verifyHosted,enabled,verifyMedia,measure]
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
      need(textOnly(saved?.package)&&Array.isArray(saved.media),
        'INVALID_SNAPSHOT');
      const pkg=saved.package;
      const media=await verifyMedia(pkg,saved.media,{allowExpired:true});
      expectedPaths(pkg,media);
      const base=await currentMain({repositoryId:ID,operationId,
        package:pkg});
      need(SHA.test(base),'MAIN_UNVERIFIED');
      const pr=await measure('github_prepare_pr',()=>createDraft({operationId,repositoryId:ID,
        expectedMainSha:base,domain:pkg.domain,package:pkg,
        media:saved.media,leaseOwner}));
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
        // This exact PR/head/base's completed CI check failed. The owner
        // receives a durable terminal Failed instead of endless Checking.
        // Do NOT bypass CI, resubmit the operation or merge its PR.
        if(error?.code==='CHECK_NOT_SUCCESSFUL')
          return advance('Failed',{reasonCode:'sandbox_ci_failed'});
        // A trusted PR may outlive a separately merged sandbox workflow
        // update. Old main/head receipts cannot be merged or rebased.
        if(['MAIN_MOVED','PR_HEAD_OR_BASE_MOVED'].includes(error?.code))
          return advance('Conflict',{reasonCode:'sandbox_source_moved'});
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
      // The durable marker blocks any second GitHub merge request.
      need(record.reasonCode==null,'MERGE_RECONCILIATION_REQUIRED');
      const marked=await store.markMergeAttempt({operationId,leaseOwner});
      need(marked===true,'MERGE_RECONCILIATION_REQUIRED');
      let result;
      try{
        result=await measure('github_protected_merge',()=>merge({...receipt,operationId,leaseOwner}));
        need(result?.sandboxMerged===true&&result.repositoryId===ID&&
          result.canonicalLive===false&&SHA.test(result.mergeSha),
          'MERGE_UNVERIFIED');
      }catch(error){
        // A lost/ambiguous merge acknowledgement may follow a SUCCESSFUL
        // provider PUT. Prove the exact merged PR using READ-ONLY GETs
        // while the original D1 lease is still held; never repeat PUT.
        let proof;
        try{
          proof=await measure('merge_fast_independent_proof',()=>verifyMerged({
            operationId,repositoryId:ID,prNumber:receipt.prNumber,
            prHeadSha:receipt.expectedHeadSha,mainBaseSha:receipt.expectedBaseSha,
            workflowRunId:record.workflowRunId,canonicalLive:false,
          }));
        }catch{throw error;}
        if(!(proof?.verified===true&&proof.repositoryId===ID&&
          proof.operationId===operationId&&proof.prNumber===receipt.prNumber&&
          proof.prHeadSha===receipt.expectedHeadSha&&
          proof.mainBaseSha===receipt.expectedBaseSha&&
          proof.workflowRunId===record.workflowRunId&&
          proof.canonicalLive===false&&SHA.test(proof.mergeSha??'')))
          throw error;
        // The existing D1 advance is an atomic CAS on THIS unexpired lease,
        // the exact operation and Merging state. Failed CAS falls back to
        // the original no-retry, expired-lease read-only recovery.
        return advance('Deploying',{mergeSha:proof.mergeSha});
      }
      return advance('Deploying',{mergeSha:result.mergeSha});
    }
    if(state==='Deploying'){
      need(SHA.test(record.mergeSha??''),'MERGE_RECEIPT_MISSING');
      return advance('Verifying');
    }
    if(state==='Verifying'){
      need(SHA.test(record.mergeSha??''),'MERGE_RECEIPT_MISSING');
      const saved=await store.readSnapshot(operationId);
      need(textOnly(saved?.package)&&Array.isArray(saved.media),
        'INVALID_SNAPSHOT');
      const media=await verifyMedia(saved.package,saved.media,{allowExpired:true});
      const paths=expectedPaths(saved.package,media);
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
