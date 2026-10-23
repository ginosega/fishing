/**
 * Source-only Node dispatcher: owner-authenticated accept -> D1 lease ->
 * trusted exact-head canonical validation -> sandbox draft PR -> D1 Checking.
 * NOT ROUTED/DEPLOYED; no merge, production or Live transition.
 */
import {createSandboxPRAdapter} from './sandbox-github-pr.mjs';
import {createTrustedSandboxCandidate} from '../../src/trusted-sandbox-candidate.mjs';

const ID=1430581407;
const op=s=>typeof s==='string'&&/^p3_[0-9a-f-]{36}$/.test(s);
const sha=s=>typeof s==='string'&&/^[a-f0-9]{40}$/.test(s);
export class DispatchError extends Error{
 constructor(code){super('Sandbox publish operation not ready');this.name='DispatchError';this.code=code;}
}
const deny=code=>{throw new DispatchError(code);};
const check=(v,code)=>{if(!v)deny(code);};
const MAX_BYTES=128*1024;
export function createSandboxDispatcher({guard,store,trustedCheckout,releaseCheckout,
 sourceAware,readMainSha,issueToken,githubFetch,
 publishingGate=()=>false,makeLease=()=> 'p3-run-'+crypto.randomUUID(),
}={}){
 check(typeof guard?.authorize==='function'&&
  ['accept','get','readSnapshot','branchReceipt','saveBranchReceipt','claim','advance']
  .every(name=>typeof store?.[name]==='function')&&
  typeof trustedCheckout==='function'&&typeof releaseCheckout==='function'&&
  typeof sourceAware?.promote==='function'&&typeof readMainSha==='function'&&
  typeof issueToken==='function'&&typeof githubFetch==='function'&&
  typeof publishingGate==='function'&&typeof makeLease==='function',
  'INVALID_CONFIGURATION');
 const trustedCandidate=createTrustedSandboxCandidate({trustedCheckout,releaseCheckout,store,sourceAware});
 async function accept(request){
  await guard.authorize(request);
  const length=request.headers.get('Content-Length');
  if(length!==null)check(/^\d+$/.test(length)&&Number(length)<=MAX_BYTES,'PAYLOAD_TOO_LARGE');
  const text=await request.text();
  check(new TextEncoder().encode(text).length<=MAX_BYTES,'PAYLOAD_TOO_LARGE');
  let body;
  try{body=JSON.parse(text);}catch{deny('MALFORMED_JSON');}
  check(body&&typeof body==='object'&&!Array.isArray(body)&&
   Object.keys(body).sort().join(',')==='idempotencyKey,snapshot','INVALID_BODY');
  const record=await store.accept(body);
  return Object.freeze({operationId:record.operationId,state:record.state,inserted:record.inserted});
 }
 async function step(operationId){
  check(op(operationId),'INVALID_OPERATION');
  check(publishingGate()===true,'WRITES_DISABLED');
  const leaseOwner=makeLease();
  const claimed=await store.claim({operationId,leaseOwner});
  if(!claimed)return Object.freeze({operationId,state:'Unclaimed'});
  if(claimed.state==='Accepted'){
   const next=await store.advance({operationId,leaseOwner,from:'Accepted',to:'Validating'});
   check(next?.state==='Validating','LEASE_LOST');
   return Object.freeze({operationId,state:'Validating'});
  }
  if(claimed.state!=='Validating')
   return Object.freeze({operationId,state:claimed.state,action:'no_automatic_advance'});
  try{
   const snapshot=await store.readSnapshot(operationId);
   check(snapshot?.package&&['gear','kb'].includes(snapshot.package.domain),'INVALID_DURABLE_SNAPSHOT');
   const base=await readMainSha({repositoryId:ID});
   check(base?.repositoryId===ID&&sha(base.sha),'UNVERIFIED_MAIN');
   const github=createSandboxPRAdapter({
    request:githubFetch,issueToken,publishingGate,trustedCandidate,
    knownReceipt:async({repositoryId,operationId:requested})=>{
     if(repositoryId!==ID||requested!==operationId)return null;
     return store.branchReceipt(operationId);
    },
    onBranchCreated:async evidence=>{
     check(evidence.operationId===operationId&&evidence.repositoryId===ID,'RECEIPT_ID_MISMATCH');
     return store.saveBranchReceipt({...evidence,leaseOwner});
    },
   });
   const pr=await github.createDraft({
    operationId,domain:snapshot.package.domain,expectedMainSha:base.sha,
   });
   check(pr?.baseSha===base.sha&&sha(pr.headSha)&&Number.isSafeInteger(pr.number),'UNVERIFIED_DRAFT_PR');
   const next=await store.advance({operationId,leaseOwner,from:'Validating',to:'Checking',
    details:{prNumber:pr.number,prHeadSha:pr.headSha,mainBaseSha:base.sha}});
   check(next?.state==='Checking','LEASE_LOST_AFTER_PR');
   return Object.freeze({operationId,state:'Checking',prNumber:pr.number,headSha:pr.headSha});
  }catch(error){
   // A branch may exist already: never mark Failed or retry blindly. The
   // durable receipt + lease expiry permit reviewed deterministic recovery.
   return Object.freeze({operationId,state:'NeedsReview',
    reasonCode:error instanceof DispatchError?error.code:'NEEDS_RECONCILIATION'});
  }
 }
 return Object.freeze({accept,step});
}
