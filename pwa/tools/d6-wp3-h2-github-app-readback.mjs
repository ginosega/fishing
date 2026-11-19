/**
 * FISH-TODO-118 WP3 H2 — Worker-bound GitHub App installation READBACK.
 *
 * SOURCE ONLY: no JWT creation, token minting, repository write or install
 * change. The caller must independently obtain the SAME APP's short-lived
 * JWT using the existing Worker-bound app identity (never the ChatGPT GitHub
 * connector's credential or the browser's OAuth session).
 *
 * GET /repos/ginosega/fishing/installation proves installation on this repo
 * with the selected permission set, but not that it is the ONLY selected
 * repository. A second separately approved repository-universe proof is
 * required before claiming sole-repo scope.
 */
const URL='https://api.github.com/repos/ginosega/fishing/installation';
const OWNER=265665562;
const PERMISSIONS=Object.freeze({
 metadata:'read',contents:'write',pull_requests:'write',
});
const JWT=/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const MAX=65536;

export class D6H2AppReadbackError extends Error{
 constructor(code){
  super('H2 Worker-bound GitHub App installation not independently verified');
  this.name='D6H2AppReadbackError';this.code=code;
 }
}
const deny=code=>{throw new D6H2AppReadbackError(code);};
const need=(v,code)=>{if(!v)deny(code);};
const plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&
 Object.getPrototypeOf(v)===Object.prototype;

export function verifyD6H2GitHubAppInstallation(raw,{expectedAppId}={}){
 need(Number.isSafeInteger(expectedAppId)&&expectedAppId>0,
  'APP_ID_UNPINNED');
 need(plain(raw)&&Number.isSafeInteger(raw.id)&&raw.id>0&&
  raw.app_id===expectedAppId&&
  raw.account?.id===OWNER&&
  raw.account?.login==='ginosega'&&
  raw.target_id===OWNER&&raw.target_type==='User'&&
  raw.repository_selection==='selected'&&
  raw.suspended_at===null&&
  plain(raw.permissions)&&
  Object.keys(raw.permissions).length===3&&
  Object.entries(PERMISSIONS).every(
   ([key,val])=>raw.permissions[key]===val),
  'INSTALLATION_NOT_APPROVED');
 return Object.freeze({
  verified:true,installationId:raw.id,appId:raw.app_id,
  ownerGitHubId:OWNER,repositoryFullName:'ginosega/fishing',
  repositorySelection:'selected',
  contents:'write',pullRequests:'write',metadata:'read',
  suspended:false,
  soleRepositoryProven:false,
  requiresIndependentRepositoryList:true,
  sourceOnly:true,canPublish:false,isLive:false,
 });
}

export function createD6H2GitHubAppReadback({
 expectedAppId,getAppJwt,network=globalThis.fetch,
}={}){
 need(Number.isSafeInteger(expectedAppId)&&expectedAppId>0&&
  typeof getAppJwt==='function'&&typeof network==='function',
  'INVALID_CONFIG');
 async function read(){
  let response;
  try{
   const token=await getAppJwt();
   need(typeof token==='string'&&token.length>=20&&
    token.length<=4096&&JWT.test(token),
    'APP_JWT_UNAVAILABLE');
   response=await network(URL,{
    method:'GET',redirect:'error',credentials:'omit',cache:'no-store',
    headers:{
     'Authorization':'Bearer '+token,
     'Accept':'application/vnd.github+json',
     'X-GitHub-Api-Version':'2026-03-10',
    },
   });
  }catch(e){
   if(e instanceof D6H2AppReadbackError)throw e;
   deny('NETWORK_UNAVAILABLE');
  }
  need(response?.status===200&&response.ok===true&&
   /^application\/json(?:;|$)/i.test(
    response.headers?.get?.('Content-Type')??''),
   'HTTP_UNVERIFIED');
  const declared=response.headers?.get?.('Content-Length');
  need(declared===null||/^\d+$/.test(declared)&&Number(declared)<=MAX,
   'BODY_UNVERIFIED');
  let payload;
  try{
   const reader=response.body?.getReader();
   need(reader,'BODY_UNVERIFIED');
   let length=0,done=false;const parts=[];
   try{
    for(let i=0;i<128;i++){
     const part=await reader.read();
     if(part.done){done=true;break;}
     need(part.value instanceof Uint8Array,'BODY_UNVERIFIED');
     length+=part.value.length;
     need(length<=MAX,'BODY_UNVERIFIED');
     parts.push(part.value);
    }
   }finally{
    if(!done)await reader.cancel().catch(()=>{});
   }
   need(done&&length>0,'BODY_UNVERIFIED');
   const result=new Uint8Array(length);let n=0;
   for(const p of parts){result.set(p,n);n+=p.length;}
   payload=JSON.parse(
    new TextDecoder('utf-8',{fatal:true}).decode(result));
  }catch(e){
   if(e instanceof D6H2AppReadbackError)throw e;
   deny('BODY_UNVERIFIED');
  }
  return verifyD6H2GitHubAppInstallation(payload,{expectedAppId});
 }
 return Object.freeze({read});
}
