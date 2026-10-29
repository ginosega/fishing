/**
 * FISH118 D2 — source-only AUTH-P0-compatible session + CSRF adapter.
 * No route, cookie issuer, OAuth token, installer token or D1 mutation.
 * EXACT AUTH-P0 format: __Host-fish_p0_session, base64url SHA-256 in
 * the existing "sessions" table (github_id, expires_at). No second login.
 *
 * A separately stored 32+-character server-only CSRF HMAC key is required
 * in the future runtime. The key is NEVER accessible in any client response.
 * This module does not provision it or enable writes.
 */
const COOKIE='__Host-fish_p0_session',WEEK=7*24*60*60;
const SESSION=/^[A-Za-z0-9_-]{43}$/;
const CSRF=/^[A-Za-z0-9_-]{43}$/;
const enc=new TextEncoder();
const b64=bytes=>{
 let s='';for(const n of new Uint8Array(bytes))s+=String.fromCharCode(n);
 return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
};
const sha=async v=>b64(await crypto.subtle.digest('SHA-256',enc.encode(v)));
const hmac=async(secret,value)=>{
 const key=await crypto.subtle.importKey('raw',enc.encode(secret),
  {name:'HMAC',hash:'SHA-256'},false,['sign']);
 return b64(await crypto.subtle.sign('HMAC',key,enc.encode(value)));
};
const matches=(a,b)=>{
 if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;
 let v=0;for(let i=0;i<a.length;i++)v|=a.charCodeAt(i)^b.charCodeAt(i);
 return v===0;
};
const strCookie=header=>{
 if(typeof header!=='string'||header.length>4096)return null;
 const found=[];
 for(const part of header.split(';')){
  const i=part.indexOf('=');
  if(i<0)continue;
  if(part.slice(0,i).trim()===COOKIE)found.push(part.slice(i+1).trim());
 }
 return found.length===1&&SESSION.test(found[0])?found[0]:null;
};
export class D2SessionError extends Error{
 constructor(code){super('D2 owner authorization denied');this.name='D2SessionError';this.code=code;}
}
const deny=code=>{throw new D2SessionError(code);};
const need=(truth,code)=>{if(!truth)deny(code);};
export function createD2UnifiedOwnerSession({AUTH_DB,ownerGitHubId,origin,csrfKey,
 now=()=>Math.floor(Date.now()/1000)}={}){
 need(AUTH_DB?.prepare&&Number.isSafeInteger(ownerGitHubId)&&ownerGitHubId>0&&
  typeof origin==='string'&&origin.startsWith('https://')&&
  new URL(origin).origin===origin&&
  typeof csrfKey==='string'&&enc.encode(csrfKey).length>=32&&
  typeof now==='function','INVALID_CONFIG');
 async function identity(request,{pilotNavigation=false}={}){
  need(request instanceof Request,'INVALID_REQUEST');
  let url;try{url=new URL(request.url);}catch{deny('INVALID_REQUEST');}
  need(url.origin===origin&&url.protocol==='https:','ORIGIN_DENIED');
  need(!request.headers.has('Authorization'),'BEARER_DENIED');
  const fetchSite=request.headers.get('Sec-Fetch-Site');
  const crossSite=fetchSite==='cross-site'||fetchSite==='same-site';
  // The OAuth redirect chain passes through github.com. Chromium may
  // label the final FIRST-PARTY HTML navigation cross-site, even though
  // the session was issued by our callback on this exact origin.
  // Only an exact GET document navigation is exempt; JSON, JS, status,
  // writes and any non-navigation cross-site request remain forbidden.
  const freshPilotNavigation=pilotNavigation===true&&
   request.method==='GET'&&
   (url.pathname==='/__d3_pilot__/'||
    url.pathname==='/fishing/__d3_pilot__/')&&
   !url.search&&!url.hash&&
   request.headers.get('Sec-Fetch-Mode')==='navigate'&&
   request.headers.get('Sec-Fetch-Dest')==='document';
  need(!crossSite||freshPilotNavigation,'CROSS_SITE_DENIED');
  const token=strCookie(request.headers.get('Cookie'));
  if(!token)return null;
  const hash=await sha(token);
  const row=await AUTH_DB.prepare(
   'SELECT github_id,expires_at FROM sessions WHERE token_hash=? AND expires_at>?')
   .bind(hash,now()).first();
  const at=now();
  if(!row||!Number.isSafeInteger(at)||at<0||
   row.github_id!==ownerGitHubId||
   !Number.isSafeInteger(row.expires_at)||row.expires_at<=at||
   row.expires_at>at+WEEK)return null;
  return {ownerGitHubId,token,expiresAt:row.expires_at};
 }
 async function csrfFor(session){
  need(session?.ownerGitHubId===ownerGitHubId&&SESSION.test(session.token??''),
   'SESSION_DENIED');
  // Domain-separated and exact-session bound. Fixed for life of valid
  // session, which is revoked by deleting its AUTH-P0 D1 row.
  return hmac(csrfKey,'fishing-v3-csrf-v1\n'+origin+'\n'+session.token);
 }
 async function authorizeWrite(request){
  need(request instanceof Request&&request.method==='POST','METHOD_DENIED');
  need(request.headers.get('Origin')===origin&&
   request.headers.get('Sec-Fetch-Site')==='same-origin',
   'CROSS_SITE_DENIED');
  need(request.headers.get('X-Fish-V3-Intent')==='publish','INTENT_DENIED');
  need(/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(
   request.headers.get('Content-Type')??''),'CONTENT_TYPE_DENIED');
  const session=await identity(request);
  need(session,'SESSION_DENIED');
  const received=request.headers.get('X-Fish-V3-CSRF');
  need(typeof received==='string'&&CSRF.test(received)&&
   matches(received,await csrfFor(session)),'CSRF_DENIED');
  return Object.freeze({ownerGitHubId,authorized:true});
 }
 async function authorizeStatus(request){
  need(request instanceof Request&&request.method==='GET','METHOD_DENIED');
  const session=await identity(request);
  need(session,'SESSION_DENIED');
  return Object.freeze({ownerGitHubId,authorized:true});
 }
 async function authorizePilotPage(request){
  need(request instanceof Request&&request.method==='GET','METHOD_DENIED');
  const session=await identity(request,{pilotNavigation:true});
  need(session,'SESSION_DENIED');
  return Object.freeze({ownerGitHubId,authorized:true});
 }
 async function describe(request){
  need(request instanceof Request&&request.method==='GET','METHOD_DENIED');
  const session=await identity(request);
  if(!session)return Object.freeze({authenticated:false,authorized:false});
  return Object.freeze({authenticated:true,authorized:true,
   csrfToken:await csrfFor(session),expiresAt:session.expiresAt});
 }
 return Object.freeze({describe,authorizeWrite,authorizeStatus,authorizePilotPage});
}
