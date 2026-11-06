// Static, owner-candidate-only inline bootstrap. A matching CSP hash is supplied
// by the exact-scope private static gateway. No public V2 execution path.
export const D5_OWNER_FIRST_VISIT_SCRIPT=`(()=>{
 'use strict';
 const base='/fishing/__v3_owner_candidate__/';
 if(location.pathname!==base)return;
 const root=new URL(base,location.origin);
 const swUrl=new URL('sw.js',root).href;
 const retryKey='fishing-d5-scoped-bootstrap-reloaded';
 const sw=navigator.serviceWorker;
 let finished=false,timer=null;
 const showError=message=>{
  const paint=()=>{
   const main=document.getElementById('app');if(!main)return;
   const p=document.createElement('p');p.setAttribute('role','alert');
   p.textContent=message;
   const retry=document.createElement('button');retry.type='button';
   retry.textContent='Retry startup';retry.addEventListener('click',()=>{
    try{sessionStorage.removeItem(retryKey);}catch{}
    location.reload();
   });
   main.replaceChildren(p,retry);
  };
  if(document.readyState==='loading')
   document.addEventListener('DOMContentLoaded',paint,{once:true});
  else paint();
 };
 const cleanup=()=>{clearTimeout(timer);sw?.removeEventListener('controllerchange',check);};
 const fail=message=>{
  if(finished)return;finished=true;cleanup();showError(message);
 };
 const load=()=>{
  if(finished)return;finished=true;cleanup();
  // Dynamic scripts are async by default. Unlike the original deferred
  // loader, they can execute before the document body has been parsed.
  const attachLoader=()=>{
   try{sessionStorage.removeItem(retryKey);}catch{}
   for(const spec of [
    ['manifest','manifest.webmanifest',''],
    ['icon','icon.png','image/png'],
    ['apple-touch-icon','icon.png','']]){
    const item=document.createElement('link');item.rel=spec[0];
    item.href=new URL(spec[1],root).href;
    if(spec[2])item.type=spec[2];
    document.head.append(item);
   }
   const script=document.createElement('script');
   script.src=new URL('loader.js',root).href;
   script.onerror=()=>showError('The verified startup loader is unavailable. Retry while online.');
   document.head.append(script);
  };
  if(document.readyState==='loading')
   document.addEventListener('DOMContentLoaded',attachLoader,{once:true});
  else attachLoader();
 };
 function check(){
  if(sw?.controller?.scriptURL===swUrl)load();
 }
 if(!sw){showError('Service workers are required for verified startup.');return;}
 sw.addEventListener('controllerchange',check);
 // Registration precedes loader.js. This prevents a broader legacy
 // /fishing/ worker from intercepting the parser-requested loader.
 timer=setTimeout(async()=>{
  if(finished)return;
  try{
   const reg=await sw.getRegistration(root.href);
   if(reg?.scope===root.href&&reg.active?.scriptURL===swUrl){
    let attempted=false;
    try{attempted=sessionStorage.getItem(retryKey)==='1';}catch{}
    if(!attempted){
     try{sessionStorage.setItem(retryKey,'1');location.reload();return;}
     catch{}
    }
   }
  }catch{}
  fail('The isolated Fishing Companion service worker did not take control. Retry while online.');
 },20000);
 Promise.resolve().then(async()=>{
  const prior=await sw.getRegistration(root.href);
  if(prior?.scope!==root.href||prior.active?.scriptURL!==swUrl)
   await sw.register(swUrl,{scope:root.href});
  check();
 }).catch(()=>fail('The isolated Fishing Companion service worker could not be registered. Retry while online.'));
 check();
})();`;
