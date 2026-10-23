/**
 * P3-3 server-only owner gate; NOT ROUTED OR DEPLOYED.
 * Trusted OAuth callback must first issue a first-party Secure HttpOnly
 * __Host- cookie and independently CSRF token. This module never issues
 * sessions or trusts browser-supplied owner ID, expiry or GitHub tokens.
 */
const COOKIE='__Host-fish_p3_session';
const DURATION=7*24*60*60;
export class SessionGuardError extends Error {
 constructor(code){super('Not authorized for publishing');this.name='SessionGuardError';this.code=code;}
}
const refuse=code=>{throw new SessionGuardError(code);};
const check=(ok,code)=>{if(!ok)refuse(code);};
const isToken=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{43,128}$/.test(v);
const sha=async value=>{
 const bytes=new TextEncoder().encode(value);
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),
  v=>v.toString(16).padStart(2,'0')).join('');
};
function extractCookie(header){
 if(typeof header!=='string'||header.length>4096)return null;
 const values=[];
 for(const part of header.split(';')){
  const idx=part.indexOf('=');
  if(idx<0)continue;
  if(part.slice(0,idx).trim()===COOKIE)values.push(part.slice(idx+1).trim());
 }
 return values.length===1&&isToken(values[0])?values[0]:null;
}
function sameDigest(a,b){
 if(typeof a!=='string'||typeof b!=='string'||a.length!==64||b.length!==64)return false;
 let difference=0;for(let i=0;i<64;i++)difference|=a.charCodeAt(i)^b.charCodeAt(i);
 return difference===0;
}
export function createP3OwnerSessionGuard({DB,ownerGitHubId,origin,now=()=>Math.floor(Date.now()/1000)}={}){
 check(DB?.prepare&&Number.isSafeInteger(ownerGitHubId)&&ownerGitHubId>0 &&
  typeof origin==='string'&&origin.startsWith('https://')&&new URL(origin).origin===origin,'INVALID_CONFIGURATION');
 async function authorize(request){
  check(request instanceof Request,'INVALID_REQUEST');
  let url;
  try{url=new URL(request.url);}catch{refuse('INVALID_REQUEST');}
  check(url.origin===origin && url.protocol==='https:'&&request.method==='POST','CROSS_ORIGIN');
  check(request.headers.get('Origin')===origin,'CROSS_ORIGIN');
  check(request.headers.get('Sec-Fetch-Site')==='same-origin','CROSS_ORIGIN');
  check(request.headers.get('X-P3-Intent')==='publish','MISSING_INTENT');
  check(/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get('Content-Type')??''),'CONTENT_TYPE');
  check(!request.headers.has('Authorization'),'UNSUPPORTED_BEARER_AUTH');
  const token=extractCookie(request.headers.get('Cookie'));
  const csrf=request.headers.get('X-P3-CSRF');
  check(isToken(token)&&isToken(csrf),'MISSING_SESSION_OR_CSRF');
  const tokenHash=await sha(token);
  const entry=await DB.prepare('SELECT github_id,csrf_hash,created_at,expires_at FROM p3_sessions WHERE token_hash=?').bind(tokenHash).first();
  const current=now();
  check(entry && Number.isSafeInteger(current) && current>=0 &&
    entry.github_id===ownerGitHubId && Number.isSafeInteger(entry.created_at)&&
    Number.isSafeInteger(entry.expires_at) &&
    entry.created_at<=current && entry.expires_at>current &&
    entry.expires_at>entry.created_at&&entry.expires_at-entry.created_at<=DURATION,'UNAUTHORIZED');
  check(sameDigest(await sha(csrf),entry.csrf_hash),'CSRF_DENIED');
  return Object.freeze({githubId:ownerGitHubId,authorized:true});
 }
 return Object.freeze({authorize});
}
