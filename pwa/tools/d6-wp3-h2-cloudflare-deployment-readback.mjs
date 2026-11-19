/**
 * FISH-TODO-118 / WP3 H2 — isolated Cloudflare deployment readback.
 *
 * SOURCE ONLY. Uses the documented Cloudflare Worker deployments GET API.
 * No Worker deployment, D1 write, operator activation, or token output.
 * The caller must provide the independently authorized account credential.
 *
 * Cloudflare's deployments list is newest-first; the FIRST deployment is
 * the active one. Reject all mixed traffic, redirects, missing/ambiguous
 * API envelopes or mismatched version identities. A returned attestation
 * proves only the provider's deployment record—not edge convergence,
 * session/CSRF, permitted writer scopes or application acceptance.
 */
const WORKER='fishing-v3-wp3-test';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACCOUNT=/^[0-9a-f]{32}$/i;
const MAX_BYTES=65536;

export class D6H2DeploymentReadError extends Error {
 constructor(code){
  super('H2 isolated Worker deployment readback unavailable');
  this.name='D6H2DeploymentReadError';this.code=code;
 }
}
const deny=code=>{throw new D6H2DeploymentReadError(code);};
const need=(ok,code)=>{if(!ok)deny(code);};

export function verifyD6H2DeploymentList(raw,{expectedVersion}={}){
 need(UUID.test(expectedVersion??''),'INVALID_VERSION_PIN');
 need(raw&&typeof raw==='object'&&!Array.isArray(raw)&&
  raw.success===true&&
  Array.isArray(raw.result?.deployments)&&
  raw.result.deployments.length>=1,
  'UNVERIFIED_DEPLOYMENTS');
 const current=raw.result.deployments[0];
 need(current&&UUID.test(current.id??'')&&
  current.strategy==='percentage'&&
  Array.isArray(current.versions)&&current.versions.length===1&&
  UUID.test(current.versions[0]?.version_id??'')&&
  current.versions[0].percentage===100,
  'AMBIGUOUS_TRAFFIC');
 need(current.versions[0].version_id===expectedVersion,
  'VERSION_MISMATCH');
 return Object.freeze({
  verified:true,workerName:WORKER,
  version:current.versions[0].version_id,
  traffic:100,deploymentId:current.id,
  sourceOnly:true,isLive:false,canPublish:false,
 });
}

export function createD6H2CloudflareDeploymentReadback({
 accountId,getAccessToken,network=globalThis.fetch,
}={}){
 need(ACCOUNT.test(accountId??'')&&
  typeof getAccessToken==='function'&&typeof network==='function',
  'INVALID_CONFIG');
 const uri='https://api.cloudflare.com/client/v4/accounts/'+
  accountId+'/workers/scripts/'+WORKER+'/deployments?per_page=1';

 async function read({expectedVersion}={}){
  need(UUID.test(expectedVersion??''),'INVALID_VERSION_PIN');
  let response;
  try{
   const token=await getAccessToken();
   need(typeof token==='string'&&token.length>=12&&
    token.length<4096&&!/[\s\r\n]/.test(token),
    'AUTH_UNAVAILABLE');
   response=await network(uri,{
    method:'GET',
    headers:{'Authorization':'Bearer '+token,'Accept':'application/json'},
    redirect:'error',credentials:'omit',cache:'no-store',
   });
  }catch(e){
   if(e instanceof D6H2DeploymentReadError)throw e;
   deny('NETWORK_UNAVAILABLE');
  }
  need(response?.ok===true&&response.status===200&&
   /^application\/json(?:\s*;|$)/i.test(
    response.headers?.get?.('Content-Type')??''),
   'HTTP_UNVERIFIED');
  const len=response.headers?.get?.('Content-Length');
  need(len===null||/^\d+$/.test(len)&&Number(len)<=MAX_BYTES,
   'BODY_UNVERIFIED');
  let body;
  try{
   // Refuse oversized reads even if the provider omits Content-Length.
   const reader=response.body?.getReader();
   need(reader,'BODY_UNVERIFIED');
   const chunks=[];let size=0,finished=false;
   try{
    for(let n=0;n<128;n++){
     const {done,value}=await reader.read();
     if(done){finished=true;break;}
     need(value instanceof Uint8Array,'BODY_UNVERIFIED');
     size+=value.byteLength;
     need(size<=MAX_BYTES,'BODY_UNVERIFIED');
     chunks.push(value);
    }
   }finally{
    if(!finished)await reader.cancel().catch(()=>{});
   }
   need(finished&&size>0,'BODY_UNVERIFIED');
   const bytes=new Uint8Array(size);let offset=0;
   for(const part of chunks){bytes.set(part,offset);offset+=part.length;}
   body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  }catch(e){
   if(e instanceof D6H2DeploymentReadError)throw e;
   deny('BODY_UNVERIFIED');
  }
  return verifyD6H2DeploymentList(body,{expectedVersion});
 }
 return Object.freeze({read});
}
