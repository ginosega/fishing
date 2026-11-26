/**
 * C03: ONLY an explicit user click may select a verified older offline library
 * after D1 online startup fails. The existing service worker validates cache
 * hashes/completeness and exact release identity before changing reading mode.
 * This module cannot provision, write records, or relax owner Save gates.
 */
const ID=/^[a-f0-9]{32}$/;
export const d6CanOfferOfflineRecovery=error=>
 error?.code==='D1_BOOTSTRAP_UNAVAILABLE';
export function selectD6VerifiedOffline({
 releaseId,controller=globalThis.navigator?.serviceWorker?.controller,
 channelFactory=()=>new MessageChannel(),timeoutMs=180000,
}={}){
 if(!ID.test(releaseId??'')||!controller||
  typeof controller.postMessage!=='function'||
  typeof channelFactory!=='function'||!Number.isSafeInteger(timeoutMs)||
  timeoutMs<1||timeoutMs>180000)
  return Promise.reject(Error('VERIFIED_OFFLINE_LIBRARY_UNAVAILABLE'));
 return new Promise((resolve,reject)=>{
  let channel,timer,done=false;
  function finish(ok){
   if(done)return;done=true;clearTimeout(timer);
   try{channel?.port1?.close();}catch{}
   try{channel?.port2?.close();}catch{}
   ok?resolve(true):reject(Error('VERIFIED_OFFLINE_LIBRARY_UNAVAILABLE'));
  }
  try{
   channel=channelFactory();
   if(!channel?.port1||!channel?.port2)throw Error('Invalid channel');
   timer=setTimeout(()=>finish(false),timeoutMs);
   channel.port1.onmessage=event=>{
    const reply=event?.data;
    finish(reply?.type==='FISHING_V3_MODE'&&reply.available===true&&
     reply.mode==='Work Offline'&&!reply.error);
   };
   controller.postMessage({
    type:'V3_SET_MODE',mode:'Work Offline',expectedReleaseId:releaseId,
   },[channel.port2]);
  }catch{finish(false);}
 });
}
export function mountD6OfflineRecovery({main,error,releaseId,doc=document,
 reload=()=>location.reload(),recover=selectD6VerifiedOffline}={}){
 if(!d6CanOfferOfflineRecovery(error)||!main||
    typeof doc?.createElement!=='function')return false;
 const description=doc.createElement('p');
 description.textContent='If you previously prepared an offline library, you can open that verified snapshot in read-only mode. It may not include your latest online changes.';
 const control=doc.createElement('button');
 control.type='button';control.textContent='Open verified offline library';
 const feedback=doc.createElement('p');
 feedback.setAttribute('role','status');
 control.addEventListener('click',async()=>{
  if(control.disabled)return;
  control.disabled=true;feedback.textContent='Verifying the offline library…';
  try{
   await recover({releaseId});
   // No content is rendered from D1 after a failed bootstrap. Restart into
   // the service worker's verified Work Offline reading mode.
   reload();
  }catch{
   feedback.textContent='No complete verified offline library is available for this app release. Connect online and prepare the offline library before relying on offline access.';
   control.disabled=false;
  }
 });
 main.append(description,control,feedback);
 return true;
}
