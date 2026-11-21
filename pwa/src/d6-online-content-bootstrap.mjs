/**
 * V3 content consolidation: one D1 online reader for all three domains.
 * Release content is an explicit, verified offline fallback ONLY. No writes.
 * Scoped to the existing fully flagged private direct-D1 build.
 */
import {validateRecords} from './validation.mjs';
import {verifyD6OriginalIds} from './d6-original-id-ledger.mjs';

const DOMAINS=['gear','kb','catches'];
export function isD6DirectContentBootstrap(v3){
 return v3?.enabled===true&&v3?.readerOnly===true&&
  DOMAINS.every(domain=>
   v3[domain==='catches'?'directCatchEnabled':
      domain==='kb'?'directKBEnabled':'directGearEnabled']===true&&
   typeof v3[domain==='catches'?'directCatchClient':
      domain==='kb'?'directKBClient':'directGearClient']?.list==='function');
}
/** A read-only query to the already-approved V3 service-worker reading mode. */
export function readD6VerifiedMode({
 controller=globalThis.navigator?.serviceWorker?.controller,
 channelFactory=()=>new MessageChannel(),timeoutMs=12000,
}={}){
 if(!controller||typeof controller.postMessage!=='function'||
    typeof channelFactory!=='function'||!Number.isSafeInteger(timeoutMs)||
    timeoutMs<1||timeoutMs>12000)
  return Promise.reject(Error('V3_READING_MODE_UNAVAILABLE'));
 return new Promise((resolve,reject)=>{
  let channel,timer,done=false;
  function finish(error,value){
   if(done)return;done=true;clearTimeout(timer);
   try{channel?.port1?.close();}catch{}
   try{channel?.port2?.close();}catch{}
   error?reject(error):resolve(value);
  }
  try{
   channel=channelFactory();
   if(!channel?.port1||!channel?.port2)throw Error('Invalid channel');
   timer=setTimeout(()=>finish(Error('V3_READING_MODE_UNAVAILABLE')),timeoutMs);
   channel.port1.onmessage=event=>{
    const msg=event?.data;
    if(msg?.type!=='FISHING_V3_MODE'||msg.available!==true||
       !['Automatic','Work Offline'].includes(msg.mode)||msg.error)
     return finish(Error('V3_READING_MODE_UNAVAILABLE'));
    finish(null,msg.mode);
   };
   controller.postMessage({type:'V3_READ_MODE'},[channel.port2]);
  }catch{finish(Error('V3_READING_MODE_UNAVAILABLE'));}
 });
}
/**
 * No D1 network call until V3 mode is positively verified Automatic.
 * In Automatic, all three D1 catalogs are validated together and a single
 * final validated data graph is returned, never a partial/mixed D1+release
 * graph. D1 failures are fatal, not silent stale-catalog fallback.
 */
export async function chooseD6BootstrapContent({
 v3,online,readMode,loadRelease,
}={}){
 if(typeof loadRelease!=='function')throw Error('V3_BOOT_CONFIG_INVALID');
 const fallback=async mode=>({
  source:'release',readingMode:mode,
  data:await loadRelease(),
 });
 if(!isD6DirectContentBootstrap(v3))
  return fallback('Legacy');
 if(online!==true)return fallback('Offline');
 if(typeof readMode!=='function')throw Error('V3_READING_MODE_UNAVAILABLE');
 const mode=await readMode();
 if(!['Automatic','Work Offline'].includes(mode))
  throw Error('V3_READING_MODE_UNAVAILABLE');
 if(mode==='Work Offline')return fallback(mode);
 try{
  const [gear,kb,catches]=await Promise.all([
   v3.directGearClient.list(),v3.directKBClient.list(),
   v3.directCatchClient.list(),
  ]);
  const data={
   gear:{schemaVersion:2,items:gear},
   kb:{schemaVersion:2,entities:kb},
   catches:{schemaVersion:2,catches},
  };
  // These independently pinned migration IDs must ALL still exist. A D1
  // catalog with the same row count but one substituted ID is rejected.
  for(const [domain,records] of [
   ['gear',gear],['kb',kb],['catches',catches],
  ])if(!verifyD6OriginalIds(domain,records))
   throw Error('D1_'+domain.toUpperCase()+'_BASELINE_INCOMPLETE');
  // Schema, category, references, and relationships are checked as one graph.
  validateRecords(data);
  return {source:'d1',readingMode:'Automatic',data};
 }catch(cause){
  // Never substitute frozen release content automatically. The UI may offer
  // a user-triggered switch ONLY through the existing verified SW offline gate.
  throw Object.assign(new Error(
   'Current online fishing content could not be verified. Retry online, or open a previously prepared offline library.'
  ),{code:'D1_BOOTSTRAP_UNAVAILABLE',cause});
 }
}
