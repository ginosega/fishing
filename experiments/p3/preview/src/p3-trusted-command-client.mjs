/**
 * FISH118 P3-25 — source-only trusted signed-command client.
 *
 * No default network transport, automatic retry, GitHub capability or deployed
 * Worker import. A caller must inject a trusted *private* transport after a
 * separate architectural/deployment review; GitHub Actions alone has no Worker
 * service binding and cannot send to a Worker with all public URLs disabled.
 */
import {signP3InternalCommand} from './p3-internal-command-gate.mjs';

export class P3TrustedClientError extends Error {
 constructor(code){super('P3 trusted command client refused operation');this.name='P3TrustedClientError';this.code=code;}
}
const deny=code=>{throw new P3TrustedClientError(code);};
const need=(v,code)=>{if(!v)deny(code);};
const REPO_ID=1430581407;
const ORIGIN='https://fishing-p3-sandbox-preview.ginosega.workers.dev';
const PATH='/_p3/internal/command';
const key=/^[A-Za-z0-9_-]{12,96}$/;
const nonce=/^[A-Za-z0-9_-]{22,64}$/;
const operation=/^p3_[0-9a-f-]{36}$/;
const OWN= /^[1-9][0-9]{0,15}$/;
const maxBody=8192;
const encoder=new TextEncoder();
function defaultNonce(){
 const bytes=crypto.getRandomValues(new Uint8Array(24));
 return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function snapshotAllowed(snapshot){
 return snapshot && Object.getPrototypeOf(snapshot)===Object.prototype &&
   Object.keys(snapshot).sort().join(',')==='media,package' &&
   snapshot.package && Object.getPrototypeOf(snapshot.package)===Object.prototype &&
   snapshot.package.format==='fishing-companion-change-v2' &&
   ['gear','kb'].includes(snapshot.package.domain) &&
   ['add','edit'].includes(snapshot.package.operation) &&
   Array.isArray(snapshot.media) && snapshot.media.length===0;
}
export function createP3TrustedCommandClient({
 env,ownerGitHubId,transport,operatorApproved=()=>false,
 now=()=>Date.now(),makeNonce=defaultNonce,
}={}){
 need(env&&typeof env==='object'&&typeof transport==='function'&&
  typeof operatorApproved==='function'&&typeof now==='function'&&
  typeof makeNonce==='function'&&OWN.test(String(ownerGitHubId??''))&&
  Number.isSafeInteger(ownerGitHubId)&&ownerGitHubId>0 &&
  String(ownerGitHubId)===env.P3_OWNER_GITHUB_ID,'INVALID_CLIENT_CONFIG');

 const enabled=()=>env.P3_WRITE_ENABLED==='true'&&
  env.P3_COMMAND_CLIENT_ENABLED==='true'&&operatorApproved()===true;

 async function accept({idempotencyKey,snapshot,repositoryId=REPO_ID,ownerId=ownerGitHubId}={}){
  // No callback / token / nonce when the caller is not explicitly authorized.
  need(enabled(),'CLIENT_DISABLED');
  need(repositoryId===REPO_ID&&ownerId===ownerGitHubId,'WRONG_TRUSTED_SCOPE');
  need(typeof idempotencyKey==='string'&&key.test(idempotencyKey)&&
   snapshotAllowed(snapshot),'INVALID_COMMAND_BODY');
  const json=JSON.stringify({action:'accept',idempotencyKey,snapshot});
  need(typeof json==='string'&&encoder.encode(json).length<=maxBody,
   'PAYLOAD_TOO_LARGE');
  const timestamp=now(),freshNonce=makeNonce();
  need(Number.isSafeInteger(timestamp)&&timestamp>=1_000_000_000_000&&
   nonce.test(freshNonce),'INVALID_CLIENT_NONCE_OR_CLOCK');
  const secret=env.P3_BRIDGE_HMAC_SECRET;
  need(typeof secret==='string'&&secret.length>=32,'MISSING_SIGNING_SECRET');
  let headers;
  try{headers=await signP3InternalCommand({
   secret,nonce:freshNonce,timestamp,body:json});}
  catch{deny('SIGNING_FAILED');}
  // This URL is a fixed logical Request target only; 'transport' MUST route
  // through an approved private capability. Never call global fetch here.
  const req=new Request(ORIGIN+PATH,{method:'POST',
   headers:{...headers,'Content-Type':'application/json'},
   body:json});
  let response;
  try{response=await transport(req);}
  catch{deny('TRANSPORT_OUTCOME_UNKNOWN');}
  need(response instanceof Response,'TRANSPORT_OUTCOME_UNKNOWN');
  if(response.status!==202){
   if(response.status===409)deny('NONCE_ALREADY_CONSUMED');
   deny('COMMAND_NOT_ACCEPTED');
  }
  need(response.headers.get('Content-Type')?.toLowerCase().startsWith('application/json'),
   'INVALID_ACCEPT_RECEIPT');
  const len=response.headers.get('Content-Length');
  need(len===null||(/^\d+$/.test(len)&&Number(len)<=4096),'INVALID_ACCEPT_RECEIPT');
  let body;
  try{
   const content=await response.text();
   need(encoder.encode(content).length<=4096,'INVALID_ACCEPT_RECEIPT');
   body=JSON.parse(content);
  }catch{deny('INVALID_ACCEPT_RECEIPT');}
  need(body&&Object.getPrototypeOf(body)===Object.prototype&&
   Object.keys(body).sort().join(',')==='ok,operationId,state'&&
   body.ok===true&&operation.test(body.operationId)&&
   ['Accepted','Validating','Checking'].includes(body.state),
   'INVALID_ACCEPT_RECEIPT');
  return Object.freeze({operationId:body.operationId,state:body.state});
 }
 return Object.freeze({accept});
}
