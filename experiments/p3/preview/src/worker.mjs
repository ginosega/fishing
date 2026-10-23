/**
 * P3 Cloudflare Free sandbox deployment sentinel.
 * Deliberately NO GitHub API, OAuth callback, writable routes, tokens
 * or automatic production upgrade. Publishing remains disabled.
 * P3-1 infrastructure readiness only, NOT P3-2 publishing.
 */
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{
 'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',
 'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',
 'Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'",
}});
const fail=()=>json({ok:false,ready:false},503);
export default {
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
