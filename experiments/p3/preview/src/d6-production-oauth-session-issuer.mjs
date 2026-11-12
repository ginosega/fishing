import {readD6BoundedJson} from './d6-bounded-json-response.mjs';
import {isD6GatewayOrigin}
 from '../../../../pwa/server/d6-pages-path-gateway.mjs';

/**
 * D6 canonical-production GitHub OAuth session issuer, SOURCE ONLY.
 * No Worker export, installed route, credential binding, publisher or writer.
 * Reuses the field-accepted AUTH-P0 D1 tables and exact __Host- cookie
 * protocol; never stores GitHub OAuth access tokens or browser-held keys.
 *
 * Deliberately separate from the D6 read gateway until a later reviewed
 * runtime-composition PR and explicit production credentials approval.
 */
export const D6_OAUTH_ORIGIN='https://fishing.ginosega.workers.dev';
export const D6_OAUTH_OWNER_ID=265665562;
const START='/auth/start',CALLBACK='/auth/callback',RETURN='/fishing/';
const FLOW='__Host-fish_p0_flow',SESSION='__Host-fish_p0_session';
const AUTHORIZE='https://github.com/login/oauth/authorize';
const EXCHANGE='https://github.com/login/oauth/access_token';
const IDENTITY='https://api.github.com/user';
const FLOW_AGE=600,SESSION_AGE=7*24*60*60;
const B64=/^[A-Za-z0-9_-]{43}$/;
const CODE=/^[A-Za-z0-9_-]{8,512}$/;
const enc=new TextEncoder();
const headers=Object.freeze({
 'Cache-Control':'private, no-store, max-age=0',
 'X-Content-Type-Options':'nosniff',
 'Referrer-Policy':'no-referrer',
 'X-Frame-Options':'DENY',
 'Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'",
});
const json=(status,error)=>new Response(JSON.stringify({ok:false,error}),{
 status,headers:{...headers,'Content-Type':'application/json; charset=utf-8'},
});
const denied=(status=503)=>json(status,status===503?
 'AUTH_TEMPORARILY_UNAVAILABLE':'INVALID_AUTH_REQUEST');
const cookie=(name,value,age)=>name+'='+value+'; Path=/; Max-Age='+
 age+'; Secure; HttpOnly; SameSite=Lax';
const redirect=(location,cookies=[])=>{
 const r=new Response(null,{status:303,headers:{...headers,Location:location}});
 for(const c of cookies)r.headers.append('Set-Cookie',c);
 return r;
};
const clearing=()=>cookie(FLOW,'',0);
const withClear=r=>{r.headers.append('Set-Cookie',clearing());return r;};
const b64=bytes=>{
 let raw='';for(const x of new Uint8Array(bytes))raw+=String.fromCharCode(x);
 return btoa(raw).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
};
const fixed=(a,b)=>{
 if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)
  return false;
 let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);
 return diff===0;
};
const readCookie=(req,name)=>{
 const head=req.headers.get('Cookie');
 if(typeof head!=='string'||head.length>4096)return null;
 const found=[];
 for(const part of head.split(';')){
  const pos=part.indexOf('=');
  if(pos>0&&part.slice(0,pos).trim()===name)
   found.push(part.slice(pos+1).trim());
 }
 return found.length===1&&B64.test(found[0])?found[0]:null;
};
const goodRequest=(req,path,origin)=>{
 if(!(req instanceof Request)||req.method!=='GET'||
    req.headers.has('Authorization'))return null;
 let url;try{url=new URL(req.url);}catch{return null;}
 if(url.origin!==origin||url.pathname!==path||
   url.hash||url.username||url.password)return null;
 const mode=req.headers.get('Sec-Fetch-Mode');
 const dest=req.headers.get('Sec-Fetch-Dest');
 if((mode&&mode!=='navigate')||(dest&&dest!=='document'))return null;
 return url;
};

export function createD6ProductionOAuthSessionIssuer({
 AUTH_DB,clientId,clientSecret,requestGitHub,cryptoApi=globalThis.crypto,
 now=()=>Math.floor(Date.now()/1000),enabled=()=>false,
 origin=D6_OAUTH_ORIGIN,
}={}){
 if(!isD6GatewayOrigin(origin)||typeof enabled!=='function'||
    typeof now!=='function')
  throw Error('Invalid D6 OAuth configuration');
 const sha=async value=>b64(await cryptoApi.subtle.digest(
  'SHA-256',enc.encode(value)));
 const nonce=()=>b64(cryptoApi.getRandomValues(new Uint8Array(32)));
 function ready(){
  if(enabled()!==true)return false;
  return AUTH_DB&&typeof AUTH_DB.prepare==='function'&&
   typeof requestGitHub==='function'&&
   typeof clientId==='string'&&/^[A-Za-z0-9_.-]{4,128}$/.test(clientId)&&
   typeof clientSecret==='string'&&clientSecret.length>=16&&
   typeof cryptoApi?.getRandomValues==='function'&&
   typeof cryptoApi?.subtle?.digest==='function';
 }
 function time(){
  const value=now();
  if(!Number.isSafeInteger(value)||value<1)return null;
  return value;
 }
 async function provider(url,options,maxBytes){
  // Only two fixed first-party server-side OAuth endpoints; never follow
  // redirects or forward a session cookie to GitHub.
  if(url!==EXCHANGE&&url!==IDENTITY)throw Error('endpoint denied');
  const result=await requestGitHub(url,{
   ...options,redirect:'manual',cache:'no-store',credentials:'omit',
  });
  if(!(result instanceof Response)||result.status!==200||
     result.redirected===true||(result.url&&result.url!==url)||
     !/^application\/json\b/i.test(result.headers.get('Content-Type')??''))
   throw Error('provider rejected');
  // Reject oversized provider bytes during streaming, before buffering.
  return readD6BoundedJson(result,maxBytes);
 }
 async function start(request){
  if(!ready())return denied();
  const url=goodRequest(request,START,origin);
  if(!url||url.search||['cross-site','same-site'].includes(
   request.headers.get('Sec-Fetch-Site')))return denied(404);
  const at=time();
  if(at===null)return denied();
  try{
   const state=nonce(),verifier=nonce();
   const result=await AUTH_DB.prepare(
    'INSERT INTO auth_flows (state_hash, code_verifier, expires_at) VALUES (?, ?, ?)')
    .bind(await sha(state),verifier,at+FLOW_AGE).run();
   if(result?.success!==true)throw Error('flow storage failed');
   const target=new URL(AUTHORIZE);
   target.searchParams.set('client_id',clientId);
   target.searchParams.set('redirect_uri',origin+CALLBACK);
   target.searchParams.set('state',state);
   target.searchParams.set('code_challenge',await sha(verifier));
   target.searchParams.set('code_challenge_method','S256');
   target.searchParams.set('allow_signup','false');
   return redirect(target.toString(),[cookie(FLOW,state,FLOW_AGE)]);
  }catch{return denied();}
 }
 async function callback(request){
  if(!ready())return denied();
  const url=goodRequest(request,CALLBACK,origin);
  if(!url)return withClear(denied(404));
  const keys=[...url.searchParams.keys()];
  const state=url.searchParams.get('state');
  const code=url.searchParams.get('code');
  const flow=readCookie(request,FLOW);
  if(keys.length!==2||keys.sort().join(',')!=='code,state'||
    !B64.test(state??'')||!CODE.test(code??'')||
    !B64.test(flow??'')||!fixed(state,flow))
   return withClear(denied(400));
  const at=time();
  if(at===null)return withClear(denied());
  try{
   // Atomic DELETE RETURNING: the same state can never be exchanged twice,
   // including if the provider lookup or session insert later fails.
   const pending=await AUTH_DB.prepare(
    'DELETE FROM auth_flows WHERE state_hash = ? AND expires_at > ? RETURNING code_verifier')
    .bind(await sha(state),at).first();
   if(!B64.test(pending?.code_verifier??''))
    return withClear(denied(400));
   const exchanged=await provider(EXCHANGE,{
    method:'POST',headers:{
     Accept:'application/json','Content-Type':'application/json',
     'User-Agent':'fishing-d6-oauth',
    },
    body:JSON.stringify({
     client_id:clientId,client_secret:clientSecret,code,
     redirect_uri:origin+CALLBACK,
     code_verifier:pending.code_verifier,
    }),
   },16384);
   const token=exchanged?.access_token;
   if(typeof token!=='string'||token.length<16||token.length>2048||
      !/^[A-Za-z0-9_-]+$/.test(token)||
      String(exchanged?.token_type).toLowerCase()!=='bearer')
    throw Error('missing ephemeral token');
   const identity=await provider(IDENTITY,{
    method:'GET',headers:{
     Authorization:'Bearer '+token,
     Accept:'application/vnd.github+json',
     'X-GitHub-Api-Version':'2022-11-28',
     'User-Agent':'fishing-d6-oauth',
    },
   },16384);
   if(identity?.id!==D6_OAUTH_OWNER_ID)
    return withClear(denied(403));
   const sid=nonce();
   const recorded=await AUTH_DB.prepare(
    'INSERT INTO sessions (token_hash, github_id, expires_at) VALUES (?, ?, ?)')
    .bind(await sha(sid),D6_OAUTH_OWNER_ID,at+SESSION_AGE).run();
   if(recorded?.success!==true)throw Error('session storage failed');
   return redirect(RETURN,[clearing(),cookie(SESSION,sid,SESSION_AGE)]);
  }catch{return withClear(denied());}
 }
 // No token/flow/key/identity response method. No write or signout routes.
 return Object.freeze({start,callback});
}
