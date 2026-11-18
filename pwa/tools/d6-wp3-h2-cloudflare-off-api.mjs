/**
 * FISH-TODO-118 WP3 H2 — exact Cloudflare OFF deployment adapter.
 * SOURCE ONLY / DEFAULT DENY / NO EXECUTION ON IMPORT.
 *
 * Real Cloudflare REST API shape, one emergency-only POST to put the known
 * OFF Worker version at 100%, followed by independently fetched deployment
 * metadata. This is one component for a FUTURE independently supervised
 * rollback actor, NOT an OFF watchdog/process, credential store, owner
 * approval, or browser route. The caller MUST separately prove the target
 * OFF version's four write flags are false and that POST routes are denied.
 *
 * An API deployment readback alone does NOT prove global propagation or
 * that write routes are denied. Do not set the controller's offVerified or
 * writeRoutesDenied from this adapter alone.
 */
const API='https://api.cloudflare.com/client/v4';
const WORKER='fishing-v3-wp3-test';
const OFF='b552efc6-a24c-4ca1-ab6c-b88a68c99ff0';
const ACCOUNT=/^[a-f0-9]{32}$/i;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const LIMIT=65536;
const plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&
 Object.getPrototypeOf(v)===Object.prototype;

export class D6Wp3H2CloudflareOffError extends Error{
 constructor(code){
  super('H2 isolated Worker OFF traffic proof is unavailable');
  this.name='D6Wp3H2CloudflareOffError';this.code=code;
 }
}
const deny=code=>{throw new D6Wp3H2CloudflareOffError(code);};
const need=(v,code)=>{if(!v)deny(code);};
function isOff(d){
 return plain(d)&&UUID.test(d.id??'')&&
  d.strategy==='percentage'&&Array.isArray(d.versions)&&
  d.versions.length===1&&d.versions[0]?.version_id===OFF&&
  d.versions[0]?.percentage===100;
}

export function createD6Wp3H2CloudflareOffApi({
 accountId,apiToken,network=globalThis.fetch,
 enabled=()=>false,
}={}){
 need(typeof network==='function'&&typeof enabled==='function',
  'INVALID_CONFIG');
 function active(){
  need(enabled()===true,'DISABLED');
  need(ACCOUNT.test(accountId??'')&&
   typeof apiToken==='string'&&apiToken.length>=20&&
   apiToken.length<=4096&&!/\s/.test(apiToken),
   'CREDENTIAL_UNAVAILABLE');
 }
 const root=API+'/accounts/'+accountId+'/workers/scripts/'+WORKER+
  '/deployments';
 async function call(path,{method='GET',body,status=200}={}){
  active();
  need(path===root||UUID.test(path.slice(root.length+1))&&
   path.startsWith(root+'/')&&
   path.length===root.length+1+36,'URL_UNVERIFIED');
  need(method==='GET'||method==='POST'&&path===root,
   'METHOD_UNVERIFIED');
  let response;
  try{response=await network(path,{
   method,redirect:'manual',credentials:'omit',cache:'no-store',
   headers:{
    Authorization:'Bearer '+apiToken,
    Accept:'application/json',
    ...(method==='POST'?{'Content-Type':'application/json'}:{}),
   },
   ...(method==='POST'?{body}:{}),
  });}catch{deny('PROVIDER_UNAVAILABLE');}
  active();
  need(response?.status===status&&response.redirected!==true&&
   response.headers?.get?.('content-type')?.includes('application/json')&&
   typeof response.text==='function','PROVIDER_UNVERIFIED');
  let raw,value;
  try{
   raw=await response.text();
   need(raw.length>0&&raw.length<=LIMIT,'PROVIDER_UNVERIFIED');
   value=JSON.parse(raw);
  }catch{deny('PROVIDER_UNVERIFIED');}
  need(plain(value)&&value.success===true&&
   plain(value.result),'PROVIDER_UNVERIFIED');
  active();
  return value.result;
 }
 async function verifyTraffic({expectedDeploymentId}={}){
  active();
  const list=await call(root);
  need(Array.isArray(list.deployments)&&
   list.deployments.length>0&&list.deployments.length<=100,
   'DEPLOYMENT_LIST_UNVERIFIED');
  // Require strict descending creation order. Never infer the active version
  // by choosing the desired OFF entry somewhere in old deployment history.
  let last=Infinity;
  for(const d of list.deployments){
   const at=Date.parse(d?.created_on??'');
   need(Number.isFinite(at)&&at<last&&UUID.test(d.id??''),
    'DEPLOYMENT_ORDER_UNVERIFIED');
   last=at;
  }
  const latest=list.deployments[0];
  need(isOff(latest)&&
   (expectedDeploymentId===undefined||
    expectedDeploymentId===latest.id),
   'OFF_NOT_100_PERCENT');
  const detail=await call(root+'/'+latest.id);
  need(isOff(detail)&&detail.id===latest.id&&
   detail.created_on===latest.created_on,
   'DEPLOYMENT_READBACK_UNVERIFIED');
  return Object.freeze({
   verifiedTraffic:true,workerName:WORKER,version:OFF,
   deploymentId:latest.id,traffic:100,
   writeRoutesDenied:false,offVersionFlagsVerified:false,
   requiresIndependentRouteDenial:true,
   sourceOnly:true,canPublish:false,isLive:false,
  });
 }
 async function restoreOff(){
  active();
  // This is the ONLY mutation possible through this adapter. No ON
  // deployment, no changes to secrets, routes, bindings or other scripts.
  const deployed=await call(root,{
   method:'POST',status:200,
   body:JSON.stringify({strategy:'percentage',versions:[
    {version_id:OFF,percentage:100},
   ]}),
  });
  need(isOff(deployed),'RESTORE_NOT_ACKNOWLEDGED');
  return verifyTraffic({expectedDeploymentId:deployed.id});
 }
 return Object.freeze({verifyTraffic,restoreOff});
}
