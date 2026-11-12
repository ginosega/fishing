/**
 * D6 read-only adapter for the owner-approved D5 Connection Status presenter.
 * SOURCE ONLY; built and mounted only under isolated D6 owner UI build flag.
 * Never represents authenticated display state as edit/publish permission.
 */
import {D6_READER_BASE,D6_READER_ORIGIN,D6_WP2_STAGING_ORIGIN}
 from './d6-public-reader.mjs';
const initial=phase=>Object.freeze({
 authenticated:false,authorized:false,ownerLogin:null,
 phase,operationId:null,publication:'None',summary:null,
 sandboxVerified:false,publicLive:false,statusReadError:false,
});
export function createD6OwnerConnectionAdapter({
 root,ownerReadiness,request,enabled=()=>false,online=()=>false,
 wp2Staging=false,
 readingMode=()=> 'Checking',onChange=()=>{},
}={}){
 let url;
 try{url=new URL(root);}catch{throw Error('D6 Connection Status root denied');}
 const loopback=url.protocol==='http:'&&
  ['localhost','127.0.0.1','[::1]'].includes(url.hostname);
 const exactOrigin=wp2Staging===true?
  D6_WP2_STAGING_ORIGIN:D6_READER_ORIGIN;
 if(typeof wp2Staging!=='boolean'||
    (url.origin!==exactOrigin&&!loopback)||
    url.pathname!==D6_READER_BASE||url.search||url.hash||
    url.username||url.password||
    typeof ownerReadiness?.check!=='function'||
    typeof request!=='function'||
    [enabled,online,readingMode,onChange].some(v=>typeof v!=='function'))
  throw Error('D6 Connection Status prerequisites denied');
 const endpoint=url.origin+'/session/signout';
 let state=initial('Unverified'),generation=0;
 const set=next=>{state=Object.freeze({...next});onChange(state);return state;};
 const current=()=>state;
 const ready=()=>enabled()===true&&online()===true&&
  readingMode()==='Automatic';
 async function restore(){
  const generationAtStart=++generation;
  if(!ready())return set(initial(online()?'Offline':'Offline'));
  set(initial('Checking'));
  let result;
  try{result=await ownerReadiness.check({readingMode:'Automatic'});}
  catch{result=null;}
  if(generation!==generationAtStart)return current();
  if(!ready())return set(initial('Offline'));
  if(result?.state==='Owner'&&result?.canPublish===false){
   // The read-only D6 bridge may report Owner; it never enables editing.
   const login=typeof result.ownerLogin==='string'&&
    /^[A-Za-z0-9-]{1,39}$/.test(result.ownerLogin)?
    result.ownerLogin:null;
   return set({...initial('Owner'),
    authenticated:true,authorized:true,ownerLogin:login});
  }
  if(result?.state==='Signed out'||result?.state==='Not authorized')
   return set(initial('Anonymous'));
  if(result?.state==='Offline')return set(initial('Offline'));
  return set(initial('Unavailable'));
 }
 async function signOut(){
  if(state.authorized!==true||!ready()||generation<1)
   throw Error('D6 owner sign-out unavailable');
  const seq=++generation;
  set(initial('SigningOut'));
  let reply;
  try{
   reply=await request(endpoint,{
    method:'POST',credentials:'same-origin',redirect:'manual',
    cache:'no-store',headers:{
     Accept:'application/json','X-Fish-P0-Intent':'signout',
    },
   });
   if(!(reply instanceof Response)||reply.status!==200||
      reply.redirected===true||(reply.url&&reply.url!==endpoint)||
      !/\bapplication\/json\b/i.test(
       reply.headers.get('Content-Type')??''))throw Error('Invalid sign-out');
   const body=await reply.json();
   if(body?.signedOut!==true)throw Error('Unconfirmed sign-out');
   // Even when a concurrent GET finished after sign-out started, it may
   // contain the OLD session. Invalidate its generation and fail closed.
   ++generation;
   return set(initial('Anonymous'));
  }catch{
   ++generation;
   set(initial('Unavailable'));
   throw Error('D6 sign-out outcome unconfirmed; do not retry blindly');
  }
 }
 // The approved presenter uses these only when a verified publication
 // exists. No canonical-main publisher has been activated in this phase.
 const refreshPublication=async()=>current();
 const acknowledgeFailedPublication=()=>{throw Error('No publication');};
 return Object.freeze({current,restore,signOut,refreshPublication,
  acknowledgeFailedPublication});
}
