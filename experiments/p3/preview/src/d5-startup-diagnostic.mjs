/**
 * D5 Android startup diagnostic. Private Worker-only, default OFF and outside
 * the candidate service-worker scope. No draft/cookie/auth/token access.
 */
export const D5_STARTUP_DIAGNOSTIC_PREFIX='/__d5_startup_diagnostic__/';
const securityHeaders={
 'Cache-Control':'no-store',
 'X-Content-Type-Options':'nosniff',
 'Referrer-Policy':'no-referrer',
 'X-Frame-Options':'DENY',
 'X-Robots-Tag':'noindex, nofollow, noarchive',
 'Permissions-Policy':'camera=(), microphone=(), geolocation=()',
 'Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'",
};
const documentHtml=[
 '<!doctype html><html lang="en"><head><meta charset="utf-8">',
 '<meta name="viewport" content="width=device-width,initial-scale=1">',
 '<title>Fishing D5 startup diagnostic</title>',
 '<style>body{font:16px system-ui,sans-serif;background:#14231e;color:#eef7f2;margin:0;padding:1.2rem}main{max-width:42rem;margin:auto}h1{font-size:1.3rem}p{line-height:1.5}button{font:inherit;padding:.65rem;border-radius:.4rem;background:#c2e7d9;color:#13251e;border:0;margin-right:.6rem}pre{white-space:pre-wrap;overflow-wrap:anywhere;padding:1rem;border:1px solid #546d61;border-radius:.4rem;font-size:.85rem}small{color:#bacfc4}</style>',
 '<script src="/__d5_startup_diagnostic__/probe.js" defer></script></head>',
 '<body><main><h1>Fishing D5 startup diagnostic</h1>',
 '<p>Read-only checks outside the app service-worker scope. No stored data or drafts are changed.</p>',
 '<p id="progress">Checking browser state…</p>',
 '<pre id="results">Diagnostic script has not started.</pre>',
 '<button id="rerun" type="button" disabled>Run again</button>',
 '<button id="copy" type="button" disabled>Copy results</button>',
 '<p><small>Share only the results on this page. Do not share cookies, network logs or authorization headers.</small></p>',
 '</main></body></html>',
].join('');
// The probe is kept as literal browser JavaScript. Never use Function.toString()
// here: Wrangler/esbuild keep_names may inject out-of-scope helper symbols.
// A tagged raw string preserves JavaScript regexes and '\\n' without evaluation.
const clientScript=String.raw`(function browserProbe(){
 'use strict';
 const base='/fishing/__v3_owner_candidate__/';
 const out=document.getElementById('results'),progress=document.getElementById('progress');
 const rerun=document.getElementById('rerun'),copy=document.getElementById('copy');
 let report='';
 const add=(label,value)=>{
  report+=label+': '+String(value).slice(0,120)+'\n';
  out.textContent=report;
 };
 const bounded=async(promise,ms)=>{
  let timer;
  try{return await Promise.race([
   Promise.resolve(promise).then(value=>({value}),error=>({error})),
   new Promise(resolve=>{timer=setTimeout(()=>resolve({timeout:true}),ms);}),
  ]);}finally{clearTimeout(timer);}
 };
 const outcome=x=>x.timeout?'TIMEOUT':x.error?'ERROR '+(x.error.name||'unknown'):null;
 const hello=worker=>new Promise(resolve=>{
  const channel=new MessageChannel();
  let completed=false;
  const done=value=>{if(completed)return;completed=true;clearTimeout(timer);channel.port1.close();resolve(value);};
  const timer=setTimeout(()=>done('NO_REPLY_IN_3_SECONDS'),3000);
  channel.port1.onmessage=event=>done(event.data?.protocol==='fishing-companion-v2'?'OK':'UNEXPECTED_REPLY');
  try{worker.postMessage({type:'HELLO'},[channel.port2]);}catch{done('MESSAGE_FAILED');}
 });
 const checkResource=async(name,path,asJson)=>{
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),7000);
  try{
   const r=await bounded(fetch(base+path,{
    cache:'no-store',credentials:'omit',redirect:'error',signal:controller.signal,
   }),8000);
   if(outcome(r)){add(name,outcome(r));return;}
   const response=r.value;
   if(!response.ok){add(name,'HTTP '+response.status);return;}
   if(asJson){
    const data=await bounded(response.json(),2500);
    if(outcome(data)){add(name,outcome(data));return;}
    const id=data.value?.id;
    add(name,/^[a-f0-9]{32}$/.test(id||'')?'HTTP 200, release '+id:'HTTP 200, unexpected JSON');
   }else add(name,'HTTP 200, '+(response.headers.get('Content-Type')||'content type unavailable').slice(0,55));
  }catch(error){add(name,'ERROR '+(error?.name||'unknown'));}
  finally{clearTimeout(timer);}
 };
 async function execute(){
  rerun.disabled=true;copy.disabled=true;report='';
  progress.textContent='Running read-only checks…';
  add('Probe','D5 Android isolated startup v1');
  add('JavaScript running','yes');
  add('Browser online hint',navigator.onLine?'online':'offline');
  add('Probe page controlled by SW',navigator.serviceWorker?.controller?'yes':'no');
  if(!navigator.serviceWorker)add('Candidate worker','API UNAVAILABLE');
  else{
   const candidate=await bounded(navigator.serviceWorker.getRegistration(
    new URL(base,location.origin)),4500);
   if(outcome(candidate))add('Candidate registration',outcome(candidate));
   else{
    const registration=candidate.value;
    add('Candidate registration',registration?.scope===new URL(base,location.origin).href?'EXACT_SCOPE':'MISSING_OR_DIFFERENT');
    if(registration){
     add('Active state',registration.active?.state||'none');
     add('Waiting state',registration.waiting?.state||'none');
     add('Installing state',registration.installing?.state||'none');
     if(registration.active)add('Active worker HELLO',await hello(registration.active));
    }
   }
  }
  if('caches' in window){
   const cachesResult=await bounded(caches.keys(),4500);
   if(outcome(cachesResult))add('Candidate cache count',outcome(cachesResult));
   else add('Candidate cache count',cachesResult.value.filter(
    key=>key.startsWith('fishing-v2:'+base+':')).length);
  }
  // Fetches originate from this outside-scope page; no candidate SW
  // registration, offline-preparation, cache reads or storage writes occur.
  await checkResource('Network loader.js','loader.js',false);
  await checkResource('Network release.json','release.json',true);
  progress.textContent='Read-only checks complete.';
  rerun.disabled=false;copy.disabled=false;
 }
 rerun.addEventListener('click',()=>{void execute();});
 copy.addEventListener('click',()=>{
  if(!navigator.clipboard?.writeText){progress.textContent='Copy unavailable; select displayed text.';return;}
  navigator.clipboard.writeText(report).then(
   ()=>{progress.textContent='Results copied.';},
   ()=>{progress.textContent='Copy unavailable; select displayed text.';});
 });
 void execute();
})();`;
export function createD5StartupDiagnostic({origin,enabled=()=>false}={}){
 let url;try{url=new URL(origin);}catch{throw Error('Invalid startup diagnostic origin');}
 if(url.protocol!=='https:'||url.origin!==origin||
    url.username||url.password||url.pathname!=='/'||
    typeof enabled!=='function')throw Error('Invalid startup diagnostic configuration');
 const serve=request=>{
  if(!(request instanceof Request))return new Response('Not found',{status:404,headers:securityHeaders});
  let url;try{url=new URL(request.url);}catch{return new Response('Not found',{status:404,headers:securityHeaders});}
  const isPage=url.pathname===D5_STARTUP_DIAGNOSTIC_PREFIX;
  const isScript=url.pathname===D5_STARTUP_DIAGNOSTIC_PREFIX+'probe.js';
  if(enabled()!==true||url.origin!==origin||url.username||url.password||
   url.search||url.hash||(!isPage&&!isScript))
   return new Response('Not found',{status:404,headers:securityHeaders});
  if(request.method!=='GET'&&request.method!=='HEAD')
   return new Response('Read only',{status:405,headers:{...securityHeaders,Allow:'GET, HEAD'}});
  return new Response(request.method==='HEAD'?null:isPage?documentHtml:clientScript,{
   status:200,headers:{...securityHeaders,
    'Content-Type':isPage?'text/html; charset=utf-8':'text/javascript; charset=utf-8'},
  });
 };
 return Object.freeze({serve});
}
