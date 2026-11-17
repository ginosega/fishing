/**
 * FISH-TODO-118 / WP3 H2 — one-operation owner CSRF handoff, SOURCE ONLY.
 *
 * This is NOT a general session/status route, publisher, credential mint,
 * Worker deployment or permission grant. It uses the existing D2 session
 * authority; its result is the session-bound CSRF token, NEVER the server key.
 * No H1, WP2, public V3 or ordinary /session behavior is changed.
 */
import {createD2UnifiedOwnerSession}
 from '../../experiments/p3/preview/src/d2-unified-owner-session.mjs';

export const D6_WP3_H2_OWNER_CSRF_PATH='/api/v3/h2/owner-csrf';
export const D6_WP3_H2_OWNER_CSRF_INTENT='WP3-H2-SYNTH-KB-001-CSRF';
const ORIGIN='https://fishing-v3-wp3-test.ginosega.workers.dev';
const MAIN='fc85bd38c4c688026700971b4c2d463c293eebf3';
const SHA256='ca753cb403f9e3054b2a2f092e877fee92cd58c4da10966f52d86fa07333f408';
const RECORD='h2-synthetic-kb-publishing-proof';
const PATH='KB/Techniques/content/'+RECORD+'.md';
const OWNER=265665562;
const CSRF=/^[A-Za-z0-9_-]{43}$/;
const headers=Object.freeze({
 'Content-Type':'application/json; charset=utf-8',
 'Cache-Control':'private, no-store, max-age=0',
 'Vary':'Cookie',
 'X-Content-Type-Options':'nosniff',
 'Referrer-Policy':'no-referrer',
 'X-Robots-Tag':'noindex, nofollow',
 'Cross-Origin-Resource-Policy':'same-origin',
 'X-Frame-Options':'DENY',
 'Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'",
});
const respond=(status,body)=>new Response(JSON.stringify(body),{
 status,headers,
});
const missing=()=>respond(404,{ok:false,error:'NOT_FOUND'});
const denied=()=>respond(403,{ok:false,error:'OWNER_DENIED'});
const unavailable=()=>respond(503,{ok:false,error:'TEMPORARILY_UNAVAILABLE'});

const pinned=env=>env&&typeof env==='object'&&
 env.D6_ORIGIN===ORIGIN&&env.D6_OWNER_GITHUB_ID===String(OWNER)&&
 env.D6_REPOSITORY_ID==='1350909744'&&
 env.D6_WP3_H2_TEST_NAME==='WP3-H2-SYNTH-KB-001'&&
 env.D6_WP3_H2_APPROVED_SOURCE_REVISION===MAIN&&
 env.D6_WP3_H2_APPROVED_ENVELOPE_SHA256===SHA256&&
 env.D6_WP3_H2_APPROVED_RECORD_ID===RECORD&&
 env.D6_WP3_H2_APPROVED_NOTES_PATH===PATH&&
 env.D6_WP2_STAGING_ENABLED!=='true'&&
 env.D6_ISOLATED_PAGES_ENABLED!=='true';

/**
 * A same-origin script must explicitly request this route using the custom
 * H2 intent header; a link, navigation, form, cross-origin fetch or redirect
 * cannot obtain the token. The D2 session verifier independently reads its
 * exact AUTH_DB owner row and derives CSRF from the existing server-only key.
 *
 * enabled must be BOTH the H2 four-switch writer gate and the time-limited
 * operator approval. Recheck it after the asynchronous D2 lookup.
 */
export function createD6Wp3H2OwnerCsrfHandoff({
 env={},enabled=()=>false,now=()=>Math.floor(Date.now()/1000),
}={}){
 if(typeof enabled!=='function'||typeof now!=='function')
  throw Error('Invalid H2 owner CSRF handoff');
 async function serve(request){
  if(!pinned(env)||enabled()!==true)return missing();
  if(!(request instanceof Request))return missing();
  let url;
  try{url=new URL(request.url);}catch{return missing();}
  if(request.method!=='GET'||url.origin!==ORIGIN||
   url.pathname!==D6_WP3_H2_OWNER_CSRF_PATH||
   url.search||url.hash||url.username||url.password||
   request.headers.has('Authorization')||
   request.headers.get('Sec-Fetch-Site')!=='same-origin'||
   request.headers.get('X-Fish-V3-H2-Intent')!==
    D6_WP3_H2_OWNER_CSRF_INTENT||
   request.headers.get('Accept')!=='application/json'||
   (request.headers.has('Origin')&&
    request.headers.get('Origin')!==ORIGIN))
   return missing();
  if(typeof env.AUTH_DB?.prepare!=='function'||
   typeof env.D6_CSRF_KEY!=='string'||
   new TextEncoder().encode(env.D6_CSRF_KEY).length<32)
   return unavailable();
  try{
   const d2=createD2UnifiedOwnerSession({
    AUTH_DB:env.AUTH_DB,ownerGitHubId:OWNER,
    origin:ORIGIN,csrfKey:env.D6_CSRF_KEY,now,
   });
   const owner=await d2.describe(request);
   if(owner?.authenticated!==true||owner.authorized!==true||
    owner.ownerLogin!=='ginosega'||
    !CSRF.test(owner.csrfToken??''))return denied();
   if(!pinned(env)||enabled()!==true)return missing();
   return respond(200,{ok:true,test:'WP3-H2-SYNTH-KB-001',
    csrfToken:owner.csrfToken});
  }catch{return denied();}
 }
 return Object.freeze({serve});
}
