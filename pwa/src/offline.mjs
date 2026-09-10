// Read-only release management. Editing remains exclusively in memory.
export function createOffline({root,releaseId,onStatus,isDirty,notify}){
 let registration=null,updating=false;
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
 async function start(){
  if(!('serviceWorker' in navigator)){publish({state:'Incomplete',message:'Service workers are unavailable in this browser.'});return;}
  try{
   registration=await navigator.serviceWorker.register(new URL('sw.js',root),{scope:root});
   navigator.serviceWorker.addEventListener('controllerchange',()=>{command('STATUS').catch(()=>{});notify('An offline release is ready. Reload when you have finished any edits.');});
   await navigator.serviceWorker.ready;await command('STATUS');
  }catch(error){publish({state:'Incomplete',message:error.message});}
 }
 async function update(){
  if(updating)return;
  updating=true;
  if(!registration){await start();if(!registration){updating=false;return;}}
  publish({state:'Downloading',message:'Checking for a complete release…'});
  try{
   await registration.update();
   const worker=registration.installing;
   if(worker)await new Promise((resolve,reject)=>{
    const changed=()=>{if(worker.state==='activated'){worker.removeEventListener('statechange',changed);resolve();}else if(worker.state==='redundant'){worker.removeEventListener('statechange',changed);reject(new Error('The new release was incomplete. The previous release is retained.'));}};
    worker.addEventListener('statechange',changed);changed();
   });
   await command('REPAIR');
  }catch(error){await command('STATUS').catch(()=>{});publish({...status,message:error.message});}finally{updating=false;publish(status);}
 }
 function reload(){if(updating){notify('The offline update is still running. Reload when it finishes.');return;}if(isDirty()&&!confirm('Your prepared changes have not been saved. Discard the current edit and reload?'))return;location.reload();}
 function dispose(){navigator.serviceWorker?.removeEventListener('message',handler);}
 return {start,update,reload,dispose,getStatus:()=>status};
}
