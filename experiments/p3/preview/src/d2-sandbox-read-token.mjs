/**
 * FISH118 D2: source-only, default-OFF, Cloudflare-server-side GitHub App
 * sandbox READ-token issuer. No key in browser, source, Actions or responses.
 * Existing App may have write rights; this module requests only contents:read
 * for ONE immutable sandbox repo ID. No general GitHub API proxy.
 */
import {appJwt} from './github-app-readonly.mjs';
const ID=1430581407,REPO='ginosega/fishing-p3-sandbox';
const API='https://api.github.com';
const grant={checks:'read',contents:'write',metadata:'read',pull_requests:'write'};
const CONTENT_READ={contents:'read'};
const CHECK_READ={checks:'read',contents:'read',pull_requests:'read'};
const safeScope=p=>same(p,CONTENT_READ)?CONTENT_READ:same(p,CHECK_READ)?CHECK_READ:null;
export class D2TokenError extends Error{
 constructor(code){super('D2 sandbox read token denied');this.name='D2TokenError';this.code=code;}
}
const fail=code=>{throw new D2TokenError(code);};
const ok=(v,c)=>{if(!v)fail(c);};
const numId=s=>typeof s==='string'&&/^[1-9]\d{0,15}$/.test(s);
const same=(a,b)=>a&&typeof a==='object'&&!Array.isArray(a)&&
 Object.keys(a).sort().join(',')===Object.keys(b).sort().join(',')&&
 Object.keys(b).every(k=>a[k]===b[k]);
export function createD2SandboxReadTokenIssuer({
 env,request,enabled=()=>false,
}={}){
 ok(typeof request==='function'&&typeof enabled==='function','INVALID_CONFIG');
 async function api(jwt,url,method='GET',body){
  ok([
   API+'/app/installations/'+env.D2_GITHUB_INSTALLATION_ID,
   API+'/repos/'+REPO+'/installation',
   API+'/app/installations/'+env.D2_GITHUB_INSTALLATION_ID+'/access_tokens',
  ].includes(url),'URL_DENIED');
  let response;
  try{response=await request(url,{
   method,redirect:'manual',
   headers:{
    Authorization:'Bearer '+jwt,Accept:'application/vnd.github+json',
    'X-GitHub-Api-Version':'2026-03-10',
    'User-Agent':'fishing-d2-sandbox-read',
    ...(body?{'Content-Type':'application/json'}:{}),
   },
   ...(body?{body:JSON.stringify(body)}:{}),
  });}catch{fail('GITHUB_UNAVAILABLE');}
  ok(response?.ok===true&&!response.redirected,'GITHUB_UNAVAILABLE');
  try{return await response.json();}catch{fail('BAD_GITHUB_RESPONSE');}
 }
 async function issueReadToken({repositoryId,permissions}={}){
  ok(enabled()===true,'READ_TOKENS_DISABLED');
  const subset=safeScope(permissions);
  ok(repositoryId===ID&&subset,'READ_SCOPE_DENIED');
  ok(numId(env?.D2_GITHUB_APP_ID)&&numId(env?.D2_GITHUB_INSTALLATION_ID)&&
   typeof env?.D2_GITHUB_APP_PRIVATE_KEY==='string'&&
   env.D2_GITHUB_APP_PRIVATE_KEY.length>32,'MISSING_SERVER_KEY');
  let jwt;
  try{jwt=await appJwt({appId:env.D2_GITHUB_APP_ID,
   privateKey:env.D2_GITHUB_APP_PRIVATE_KEY});}
  catch{fail('APP_SIGNING_DENIED');}
  const inst=await api(jwt,API+'/app/installations/'+env.D2_GITHUB_INSTALLATION_ID);
  ok(inst?.id===Number(env.D2_GITHUB_INSTALLATION_ID)&&
   inst.app_id===Number(env.D2_GITHUB_APP_ID)&&
   inst.account?.login==='ginosega'&&
   inst.repository_selection==='selected'&&
   inst.suspended_at==null&&same(inst.permissions,grant),'INSTALLATION_DENIED');
  const target=await api(jwt,API+'/repos/'+REPO+'/installation');
  ok(target?.id===inst.id&&target.app_id===inst.app_id&&
   target.account?.login==='ginosega','TARGET_DENIED');
  const issued=await api(jwt,API+'/app/installations/'+inst.id+'/access_tokens',
   'POST',{repository_ids:[ID],permissions:subset});
  ok(typeof issued?.token==='string'&&issued.token.length>=12&&
   same(issued.permissions,subset)&&
   Array.isArray(issued.repositories)&&issued.repositories.length===1&&
   issued.repositories[0]?.id===ID&&
   issued.repositories[0]?.full_name===REPO,'TOKEN_DENIED');
  return {repositoryId:ID,permissions:{...subset},token:issued.token};
 }
 return Object.freeze({issueReadToken});
}
