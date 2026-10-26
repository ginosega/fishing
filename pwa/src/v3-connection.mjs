/**
 * FISH118 D3 owner Connection Status controller and UI, strictly opt-in.
 * The public v2 bootstrap does not construct/enable this controller.
 * Auth session and publication state are supplied by the same-origin gateway;
 * UI visibility NEVER grants publishing rights.
 */
const OP=/^p3_[0-9a-f-]{36}$/;
export class D3ConnectionError extends Error{
 constructor(code){super('V3 Connection Status owner service unavailable');
  this.name='D3ConnectionError';this.code=code;}
}
const fail=code=>{throw new D3ConnectionError(code);};
const need=(x,code)=>{if(!x)fail(code);};
const initial=()=>({
 authenticated:false,authorized:false,phase:'Unverified',
 operationId:null,publication:'None',sandboxVerified:false,
 publicLive:false,
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
 let state=initial(),generation=0;
 const emit=()=>onChange(Object.freeze({...state}));
 const current=()=>Object.freeze({...state});
 const gate=()=>need(enabled()===true,'NOT_ENABLED');
 const offline=()=>need(online()===true,'OFFLINE');
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
  // Hide all authoring controls immediately, including when the network
  // response is ambiguous. Server remains the actual authorization boundary.
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
 async function refreshPublication(){
  gate();offline();need(state.authorized,'OWNER_REQUIRED');
  const pending=lifecycle.tracking();
  if(!OP.test(pending?.operationId??'')){
   state={...state,operationId:null,publication:'None',
    sandboxVerified:false,publicLive:false};emit();
   return current();
  }
  const id=pending.operationId,seq=generation;
  state={...state,operationId:id,publication:'Checking'};emit();
  try{
   const result=await lifecycle.refresh();
   if(seq!==generation||!state.authorized)return current();
   need(result?.operationId===id&&
    typeof result.phase==='string'&&
    result.publicLive!==true,'STATUS_UNTRUSTED');
   state={...state,operationId:id,publication:result.phase,
    sandboxVerified:result.sandboxVerified===true,
    publicLive:false};
   emit();return current();
  }catch{
   if(seq===generation&&state.authorized){
    state={...state,operationId:id,publication:'Unknown',
     sandboxVerified:false,publicLive:false};emit();
   }
   return current();
  }
 }
 return Object.freeze({current,restore,signOut,refreshPublication});
}

/**
 * Mounts inside the existing Connection Status dialog, not in the app header
 * or a special owner URL. No HTML injection or unsafe links.
 */
export function mountD3ConnectionPanel({
 dialog,controller,documentObject,onSignIn=()=>{},
}={}){
 need(dialog?.appendChild&&typeof controller?.current==='function'&&
  typeof controller?.restore==='function'&&
  typeof controller?.signOut==='function'&&
  typeof documentObject?.createElement==='function'&&
  typeof onSignIn==='function','INVALID_PANEL');
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
 const command=(name,callback)=>{
  const b=documentObject.createElement('button');
  b.type='button';b.className='btn secondary';b.textContent=name;
  b.addEventListener('click',callback);tools.appendChild(b);return b;
 };
 function paint(){
  tools.replaceChildren();
  const state=controller.current();
  if(state.phase==='Checking'||state.phase==='SigningOut'){
   desc.textContent=state.phase==='Checking'?'Checking owner session…':
    'Signing out…';return;
  }
  if(state.authorized){
   desc.textContent='Signed in as owner.';
   command('Sign out',()=>{void controller.signOut().then(paint,paint);});
   if(state.operationId){
    const p=documentObject.createElement('p');
    p.textContent='Publication '+state.publication+
      (state.sandboxVerified?' · sandbox verified':'');
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
   if(state.phase==='Offline')return;
   // Link is intentionally only in the Connection Status dialog.
   const a=documentObject.createElement('a');
   a.href='/auth/start?return=%2Ffishing%2F';a.textContent='Sign in with GitHub';
   a.addEventListener('click',onSignIn);
   tools.appendChild(a);
  }
 }
 paint();
 return Object.freeze({paint,remove:()=>section.remove()});
}
