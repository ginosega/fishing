import {verifyReadOnlySandboxInstallation} from './github-app-readonly.mjs';

/**
 * P3 Cloudflare Free sandbox deployment sentinel.
 * No GitHub write API, OAuth callback or publish routes.
 * Temporary secret-guarded, read-only GitHub App installation probe ONLY.
 * Publishing remains disabled.
 */
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{
 'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',
 'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',
 'Content-Security-Policy':"default-src 'none'; connect-src 'self'; frame-ancestors 'none'",
}});
const fail=()=>json({ok:false,ready:false},503);
// Only a high-entropy, owner-controlled Secret permits the temporary probe.
// Constant-time comparison of equal-length SHA-256 digests, no token logging.
async function authorizedProbe(request,env){
 const received=request.headers.get('X-P3-Diagnostic-Key');
 const expected=env?.P3_DIAGNOSTIC_KEY;
 if(typeof received!=='string'||received.length<32||received.length>256||
    typeof expected!=='string'||expected.length<32||expected.length>256)return false;
 const toDigest=async value=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));
 const a=await toDigest(received),b=await toDigest(expected);
 let diff=0;
 for(let i=0;i<a.length;i++)diff|=a[i]^b[i];
 return diff===0;
}
export function createWorker({verify=verifyReadOnlySandboxInstallation}={}){
 return {
 async fetch(request,env){
  let url;
  try{url=new URL(request.url);}catch{return fail();}
  // This Worker is meant for a single explicitly configured new
  // preview hostname. Never return authenticated status on a mismatch.
  if(!env?.APP_ORIGIN || url.origin!==env.APP_ORIGIN || url.protocol!=='https:')return fail();
  if(url.pathname==='/health'){
   if(request.method!=='GET')return json({ok:false},405);
   if(!env.DB?.prepare)return fail();
   try{
    const result=await env.DB.prepare('SELECT 1 AS alive').first();
    if(Number(result?.alive)!==1)return fail();
    return json({ok:true,ready:false,mode:'preview-no-publishing'});
   }catch{return fail();}
  }
  // One temporary proof-of-installation route. It NEVER writes GitHub;
  // it may only read the exact private sandbox with a scoped one-hour token.
  if(url.pathname==='/_internal/verify-sandbox'){
   if(request.method!=='POST')return json({error:'Not found'},404);
   if(env?.P3_WRITE_ENABLED!=='false')return fail();
   if(!await authorizedProbe(request,env))return json({error:'Forbidden'},403);
   try{
    const result=await verify({env});
    if(result?.verified!==true||result?.repository!=='ginosega/fishing-p3-sandbox'||
       result?.repositoryId!==1430581407||result?.tokenScope!=='contents:read'||
       result?.publishingEnabled!==false)return fail();
    return json({verified:true,repository:result.repository,
      repositoryId:result.repositoryId,tokenScope:'contents:read',publishingEnabled:false});
   }catch{return fail();}
  }
  if(url.pathname==='/session'){
   if(request.method!=='GET')return json({ok:false},405);
   return json({authenticated:false,authorized:false});
  }
  // All write-oriented and privileged routes are disabled.
  if(url.pathname.startsWith('/publications')||url.pathname.startsWith('/operations')||
     url.pathname.startsWith('/auth')||url.pathname.startsWith('/session/'))
    return json({error:'Publishing not enabled'},503);
  return json({error:'Not found'},404);
 }
 };
}
export default createWorker();
