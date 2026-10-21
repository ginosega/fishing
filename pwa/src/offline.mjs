// Explicit complete-offline-library management. Editing remains exclusively in memory.
export function createOffline({root,releaseId,onStatus,isDirty,notify}){
 let registration=null,updating=false,checking=null,switching=false,warned=false;
 let status={state:'Incomplete',releaseId:null,files:0,bytes:0,failed:[]};
 const publish=next=>{status={...status,...next};onStatus({...status,updating});};
 const handler=event=>{const msg=event.data||{};if(msg.type==='FISHING_V2_STATUS'||msg.type==='FISHING_V2_PROGRESS')publish(msg.status);};
 navigator.serviceWorker?.addEventListener('message',handler);
 async function command(type){
  const controller=registration?.active||navigator.serviceWorker?.controller;if(!controller)return;
  return new Promise((resolve,reject)=>{
   const channel=new MessageChannel();const timeout=setTimeout(()=>{channel.port1.close();reject(new Error('The offline operation did not respond.'));},180000);
   channel.port1.onmessage=e=>{clearTimeout(timeout);channel.port1.close();if(e.data?.type==='FISHING_V2_STATUS'){publish(e.data.status);resolve(e.data.status);}else reject(new Error('Unexpected offline response'));};
   controller.postMessage({type},[channel.port2]);
  });
 }
 // Check the hosted pointer through the worker's own verified network path.
 // Do not trust the page's intercepted release.json: it is pinned to this tab.
 async function checkCurrent(){
  if(!navigator.onLine||updating||switching)return !switching;
  if(checking)return checking;
  checking=(async()=>{
   const controller=navigator.serviceWorker?.controller||registration?.active;
   if(!controller)return true;
   const response=await new Promise(resolve=>{
    const channel=new MessageChannel();const timeout=setTimeout(()=>{channel.port1.close();resolve(null);},6000);
    channel.port1.onmessage=event=>{clearTimeout(timeout);channel.port1.close();resolve(event.data);};
    try{controller.postMessage({type:'CHECK_CURRENT'},[channel.port2]);}catch{clearTimeout(timeout);channel.port1.close();resolve(null);}
   });
   if(response?.type!=='FISHING_V2_CURRENT'||!response.releaseId||response.releaseId===releaseId)return true;
   if(isDirty()){
    if(!warned){notify('A new Fishing Companion release is available. Finish or copy your unsaved changes before reloading.','warning');warned=true;}
    return false;
   }
   // Reload the entire verified release (JS, JSON, CSS, Markdown and images) atomically.
   // location.reload preserves the current hash route, but never mixes A and B.
   switching=true;location.reload();return false;
  })().catch(()=>true).finally(()=>{checking=null;});
  return checking;
 }
 const controllerChanged=()=>{command('STATUS').catch(()=>{});checkCurrent().catch(()=>{});};
 const becameActive=()=>{if(!document.hidden)checkCurrent().catch(()=>{});};
 async function start(){
  if(!('serviceWorker' in navigator)){publish({state:'Incomplete',message:'Service workers are unavailable in this browser.'});return;}
  try{
   registration=await navigator.serviceWorker.register(new URL('sw.js',root),{scope:root});
   navigator.serviceWorker.addEventListener('controllerchange',controllerChanged);
   window.addEventListener('focus',becameActive);
   window.addEventListener('pageshow',becameActive);
   window.addEventListener('online',becameActive);
   document.addEventListener('visibilitychange',becameActive);
   await navigator.serviceWorker.ready;await command('STATUS');await checkCurrent();
  }catch(error){publish({state:'Incomplete',message:error.message});}
 }
 async function update(){
  if(updating)return;
  if(!navigator.onLine){publish({...status,message:'Reconnect to the internet before updating the offline library.'});return;}
  updating=true;
  if(!registration){await start();if(!registration){updating=false;return;}}
  publish({state:'Downloading',releaseId:status.releaseId,message:'Checking the current production release…'});
  try{
   // A worker update is lightweight under FISH091; it never provisions content.
   await registration.update();
   const worker=registration.installing;
   if(worker)await new Promise((resolve,reject)=>{
    const changed=()=>{if(worker.state==='activated'){worker.removeEventListener('statechange',changed);resolve();}else if(worker.state==='redundant'){worker.removeEventListener('statechange',changed);reject(new Error('The current service worker could not activate.'));}};
    worker.addEventListener('statechange',changed);changed();
   });
   await command('PREPARE');
  }catch(error){await command('STATUS').catch(()=>{});publish({...status,message:error.message});}finally{updating=false;publish(status);}
 }
 function reload(){if(updating){notify('The offline update is still running. Reload when it finishes.');return;}if(isDirty()&&!confirm('Your prepared changes have not been saved. Discard the current edit and reload?'))return;location.reload();}
 function dispose(){navigator.serviceWorker?.removeEventListener('message',handler);navigator.serviceWorker?.removeEventListener('controllerchange',controllerChanged);window.removeEventListener('focus',becameActive);window.removeEventListener('pageshow',becameActive);window.removeEventListener('online',becameActive);document.removeEventListener('visibilitychange',becameActive);}
 return {start,update,reload,dispose,checkCurrent,getStatus:()=>status,getSessionReleaseId:()=>releaseId};
}
