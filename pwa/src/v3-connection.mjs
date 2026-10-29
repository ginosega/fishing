/**
 * FISH118 D3 owner Connection Status controller and UI, strictly opt-in.
 * The public v2 bootstrap does not construct/enable this controller.
 * Auth session and publication state are supplied by the same-origin gateway;
 * UI visibility NEVER grants publishing rights.
 */
const OP=/^p3_[0-9a-f-]{36}$/;
const ACTIVE=new Set(['Accepted','Validating','Checking','Merging','Deploying','Verifying']);
export class D3ConnectionError extends Error{
 constructor(code){super('V3 Connection Status owner service unavailable');
  this.name='D3ConnectionError';this.code=code;}
}
const fail=code=>{throw new D3ConnectionError(code);};
const need=(x,code)=>{if(!x)fail(code);};
const initial=()=>({
 authenticated:false,authorized:false,phase:'Unverified',
 operationId:null,publication:'None',sandboxVerified:false,
 publicLive:false,statusReadError:false,
});
export function createD3ConnectionController({
 auth,lifecycle,enabled=()=>false,online=()=>true,onChange=()=>{},
}={}){
 need(typeof auth?.session==='function'&&
  typeof auth?.signOut==='function'&&
  typeof lifecycle?.tracking==='function'&&
  typeof lifecycle?.refresh==='function'&&
  [enabled,online,onChange].every(x=>typeof x==='function'),
  'INVALID_CONFIG');
 let state=initial(),generation=0,statusRequest=null;
 const emit=()=>onChange(Object.freeze({...state}));
 const current=()=>Object.freeze({...state});
 const gate=()=>need(enabled()===true,'NOT_ENABLED');
 const offline=()=>need(online()===true,'OFFLINE');
 const replace=next=>{
  if(Object.keys(next).some(key=>next[key]!==state[key])){
   state=next;emit();
  }
 };
 async function restore(){
  gate();const seq=++generation;
  state={...initial(),phase:online()?'Checking':'Offline'};
  emit();
  if(!online())return current();
  let reply;
  try{reply=await auth.session();}
  catch{
   if(seq===generation){state={...initial(),phase:'Unavailable'};emit();}
   return current();
  }
  if(seq!==generation)return current();
  const valid=reply&&typeof reply.authenticated==='boolean'&&
   typeof reply.authorized==='boolean'&&
   (!reply.authorized||reply.authenticated===true);
  if(!valid){state={...initial(),phase:'Unavailable'};emit();
   return current();}
  state={...initial(),authenticated:reply.authenticated,
   authorized:reply.authorized,phase:reply.authorized?'Owner':'Anonymous'};
  emit();
  return current();
 }
 async function signOut(){
  gate();offline();need(state.authorized,'OWNER_REQUIRED');
  const seq=++generation;
  // Invalidate any outstanding GET before waiting for sign-out to finish.
  // Neither stale status nor an ambiguous logout can restore owner controls.
  state={...initial(),phase:'SigningOut'};emit();
  try{
   const result=await auth.signOut();
   need(result===true,'SIGNOUT_UNCONFIRMED');
   if(seq===generation){state={...initial(),phase:'Anonymous'};emit();}
   return current();
  }catch{
   if(seq===generation){state={...initial(),phase:'Unavailable'};emit();}
   throw new D3ConnectionError('SIGNOUT_UNCONFIRMED');
  }
 }
 async function refreshPublication({silent=false,canApply=()=>true}={}){
  gate();offline();need(state.authorized,'OWNER_REQUIRED');
  need(typeof canApply==='function','INVALID_CONFIG');
  // A previous generation's GET must finish before we start a new one,
  // but must not strand a reopened dialog or a newly accepted operation.
  // Same-generation, same-operation readers share the existing GET.
  const seq=generation;
  if(statusRequest){
   const previous=statusRequest;
   await previous.promise;
   if(seq!==generation||!state.authorized||!online()||!canApply())
    return current();
   const now=lifecycle.tracking()?.operationId??null;
   if(previous.seq===seq&&previous.id===now)return current();
   return refreshPublication({silent,canApply});
  }
  const tracked=lifecycle.tracking();
  const id=OP.test(tracked?.operationId??'')?tracked.operationId:null;
  const work=(async()=>{
   try{
    const result=id?await lifecycle.refresh():await lifecycle.discover();
    if(seq!==generation||!state.authorized||!online()||!canApply())
     return current();
    // A different Save and Publish may have been accepted during this GET.
    const now=lifecycle.tracking()?.operationId??null;
    if(now!==id&&!(id===null&&now===result?.operationId))
     return current();
    need(typeof result?.phase==='string'&&result.phase.length<60&&
     result.publicLive!==true&&
     (result.operationId===null||OP.test(result.operationId))&&
     (id===null||result.operationId===id),
     'STATUS_UNTRUSTED');
    replace({...state,operationId:result.operationId,
     publication:result.operationId?result.phase:'None',
     sandboxVerified:result.sandboxVerified===true,
     publicLive:false,statusReadError:false});
    return current();
   }catch(error){
    if(seq===generation&&state.authorized&&canApply()){
     // A transient GET failure is not a publication failure. Preserve
     // the last known state during automatic checks, permitting retry.
     // Manual checks still surface uncertainty through Unknown.
     if(error?.code==='SESSION_EXPIRED'||
        error?.code==='OWNER_SESSION_REQUIRED'){
      replace({...initial(),phase:'Unavailable'});
     }else{
      replace({...state,publication:silent?state.publication:'Unknown',
       sandboxVerified:silent?state.sandboxVerified:false,
       publicLive:false,statusReadError:true});
     }
    }
    return current();
   }
  })();
  const promise=work.finally(()=>{
   if(statusRequest?.promise===promise)statusRequest=null;
  });
  statusRequest={seq,id,promise};
  return promise;
 }
 return Object.freeze({current,restore,signOut,refreshPublication});
}

/**
 * Mounts inside the existing Connection Status dialog, not in the app header
 * or a special owner URL. No HTML injection or unsafe links.
 */
export function mountD3ConnectionPanel({
 dialog,controller,documentObject,onSignIn=()=>{},online=()=>true,
 windowObject=null,setTimer=(fn,ms)=>setTimeout(fn,ms),
 clearTimer=id=>clearTimeout(id),
}={}){
 need(dialog?.appendChild&&typeof controller?.current==='function'&&
  typeof controller?.restore==='function'&&
  typeof controller?.signOut==='function'&&
  typeof documentObject?.createElement==='function'&&
  [onSignIn,online,setTimer,clearTimer].every(x=>typeof x==='function'),
  'INVALID_PANEL');
 const section=documentObject.createElement('section');
 section.className='v3-owner-connection';
 const title=documentObject.createElement('h3');
 title.textContent='Owner';
 const desc=documentObject.createElement('p');
 desc.setAttribute('aria-live','polite');
 const tools=documentObject.createElement('div');
 tools.className='toolbar';
 section.append(title,desc,tools);
 dialog.appendChild(section);
 let timer=null,checking=false,disposed=false,failures=0,rendered=null;
 const listeners=[];
 const observe=(target,event,fn)=>{
  if(typeof target?.addEventListener==='function'){
   target.addEventListener(event,fn);
   listeners.push(()=>target.removeEventListener?.(event,fn));
  }
 };
 const allowed=()=>{
  const state=controller.current();
  return !disposed&&dialog.open===true&&
   documentObject.visibilityState!=='hidden'&&online()===true&&
   state.authorized===true&&ACTIVE.has(state.publication);
 };
 function suspend(){
  if(timer!==null){clearTimer(timer);timer=null;}
 }
 function schedule(){
  if(!allowed()){suspend();return;}
  if(timer!==null||checking)return;
  // Brief, bounded backoff for failed GETs; never retry a publish.
  const delay=failures===0?5000:Math.min(30000,5000*2**Math.min(failures,3));
  timer=setTimer(()=>tick(),delay);
 }
 async function tick(){
  timer=null;
  if(!allowed()||checking)return;
  checking=true;
  try{
   await controller.refreshPublication({silent:true,canApply:allowed});
   failures=controller.current().statusReadError?
    Math.min(failures+1,3):0;
  }finally{
   checking=false;paint();schedule();
  }
 }
 const command=(name,callback)=>{
  const b=documentObject.createElement('button');
  b.type='button';b.className='btn secondary';b.textContent=name;
  b.addEventListener('click',callback);tools.appendChild(b);return b;
 };
 function paint(){
  if(disposed)return;
  const state=controller.current();
  const signature=JSON.stringify([
   state.phase,state.authorized,state.operationId,state.publication,
   state.sandboxVerified,state.statusReadError,
  ]);
  if(signature===rendered){schedule();return;}
  rendered=signature;
  tools.replaceChildren();
  if(state.phase==='Checking'||state.phase==='SigningOut'){
   desc.textContent=state.phase==='Checking'?'Checking owner session…':
    'Signing out…';
  }else if(state.authorized){
   desc.textContent='Signed in as owner.';
   command('Sign out',()=>{
    suspend();
    void controller.signOut().then(paint,paint);
   });
   if(state.operationId){
    const p=documentObject.createElement('p');
    p.textContent='Publication '+state.publication+
      (state.sandboxVerified?' · sandbox verified':'')+
      (state.statusReadError?' · status update unavailable':'');
    desc.appendChild(p);
   }
   command('Check publication status',()=>{
    void controller.refreshPublication().then(paint,paint);
   });
  }else{
   desc.textContent=state.phase==='Offline'?
    'Offline. Owner sign-in requires a connection.':
    state.phase==='Unavailable'?'Owner session status unavailable.':
    'Anonymous browsing.';
   if(state.phase!=='Offline'){
    // Link is intentionally only in the Connection Status dialog.
    const a=documentObject.createElement('a');
    a.href=globalThis.location?.pathname==='/__d3_pilot__/'?
     '/auth/start?return=%2F__d3_pilot__%2F':
     '/auth/start?return=%2Ffishing%2F';
    a.textContent='Sign in with GitHub';
    a.addEventListener('click',onSignIn);
    tools.appendChild(a);
   }
  }
  schedule();
 }
 observe(dialog,'close',suspend);
 observe(dialog,'cancel',suspend);
 observe(documentObject,'visibilitychange',()=>{
  if(documentObject.visibilityState==='hidden')suspend();
  else schedule();
 });
 const win=windowObject??documentObject.defaultView;
 observe(win,'offline',suspend);
 observe(win,'online',schedule);
 paint();
 return Object.freeze({paint,suspend,remove:()=>{
  disposed=true;suspend();
  for(const unsubscribe of listeners)unsubscribe();
  section.remove();
 }});
}
