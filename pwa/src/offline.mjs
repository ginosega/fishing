// Explicit complete-offline-library management. Editing remains exclusively in memory.
export function createOffline({root,releaseId,onStatus,isDirty,notify,
 onlineOnly=false,v3ReadingMode=false,onMode=()=>{}}){
 // Isolated private owner pilot lives outside /fishing/ SW scope. Its
 // content is fetched from an authenticated immutable sandbox snapshot,
 // NEVER cached as part of the verified public V2 offline release.
 if(onlineOnly===true){
  const status={state:'OnlineOnly',releaseId:null,files:0,bytes:0,failed:[],
   message:'Private sandbox pilot · online-only'};
  return {
   start:async()=>onStatus({...status,updating:false}),
   checkCurrent:async()=>true,
   getStatus:()=>({...status}),
   update:async()=>notify('The private sandbox pilot does not have an offline library.'),
   reload:()=>{if(isDirty()&&!confirm('Discard the unfinished private sandbox edit?'))return;location.reload();},
   dispose:()=>{},
   getSessionReleaseId:()=>releaseId,
   getMode:()=> 'Automatic',getModeAvailable:()=>false,
   setMode:async()=>false,refreshMode:async()=>{},
  };
 }
 let registration=null,updating=false,checking=null,switching=false,warned=false;
 let mode='Automatic',modeAvailable=false;
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
 async function modeCommand(type,newMode){
  const worker=registration?.active||navigator.serviceWorker?.controller;
  if(!worker)return null;
  return new Promise(resolve=>{
   const channel=new MessageChannel();
   const timeout=setTimeout(()=>{channel.port1.close();resolve(null);},4000);
   channel.port1.onmessage=event=>{
    clearTimeout(timeout);channel.port1.close();
    const value=event.data;
    resolve(value?.type==='FISHING_V3_MODE'&&
     ['Automatic','Work Offline'].includes(value.mode)?value:null);
   };
   try{worker.postMessage({type,mode:newMode},[channel.port2]);}
   catch{clearTimeout(timeout);channel.port1.close();resolve(null);}
  });
 }
 function setModeState(result){
  if(result?.available!==true)return false;
  modeAvailable=true;mode=result.mode;onMode(mode,modeAvailable);
  return true;
 }
 async function refreshMode(){
  if(!v3ReadingMode)return true;
  const result=await modeCommand('V3_READ_MODE');
  return setModeState(result); // A missing/untrusted SW reply is never consent to publish.
 }
 async function setMode(next){
  if(!v3ReadingMode||!['Automatic','Work Offline'].includes(next))return false;
  if(!registration)await start();
  if(!modeAvailable){
   notify('Work Offline is not enabled for this application release.','warning');
   return false;
  }
  const result=await modeCommand('V3_SET_MODE',next);
  if(!setModeState(result)){
   notify('Reading-mode change could not be verified. Previous mode retained.','warning');
   return false;
  }
  if(result.error){notify(result.error,'warning');return false;}
  if(next==='Work Offline'&&isDirty())
   notify('The unsaved editor stays open, but publishing is disabled in Work Offline.','warning');
  return true;
 }
 // Check the hosted pointer through the worker's own verified network path.
 // Do not trust the page's intercepted release.json: it is pinned to this tab.
 async function checkCurrent(){
  if(mode==='Work Offline'||!navigator.onLine||updating||switching)return !switching;
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
   await navigator.serviceWorker.ready;await command('STATUS');
   await refreshMode();await checkCurrent();
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
 return {start,update,reload,dispose,checkCurrent,getStatus:()=>status,
  getSessionReleaseId:()=>releaseId,getMode:()=>mode,
  getModeAvailable:()=>modeAvailable,setMode,refreshMode};
}
