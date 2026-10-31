// Owner-only V3 Connection Status presentation. The existing controller and
// polling panel remain the source of truth, not a second publication engine.
const ACTIVE=new Set(['Accepted','Validating','Checking','Merging','Deploying','Verifying']);
const TERMINAL=new Set(['Failed','Conflict']);
const TYPES=Object.freeze({gear:'Gear',kb:'Knowledge Base',catches:'Catch'});
export function publicationGuidance(phase,reasonCode){
 if(phase==='Conflict'||/^(SOURCE_CONFLICT|SOURCE_CHANGED|SUBMISSION_CONFLICT)$/.test(reasonCode??'')){
  return {heading:'Source conflict',
   message:'The source changed while publishing. Review the latest entry and reconcile your edit before submitting again.'};
 }
 // These codes may indicate a form/content correction; do not label an
 // unrecognized backend/CI failure correctable just because it says Failed.
 if(['INVALID_CHANGE','INVALID_RECORD','INVALID_CONTENT','MISSING_MEDIA','MISSING_ASSET'].includes(reasonCode)){
  return {heading:'Validation failed',
   message:'Review the entry and its image references. Correct the problem, then clear the failed status before publishing again.'};
 }
 return {heading:'Publishing service error',
  message:'The app cannot resolve this failure. Contact ChatGPT with Copy diagnostics from Help & Diagnostics. Clearing the status does not repair the problem.'};
}
export function displayPublicationSummary(summary){
 if(!summary||!['gear','kb','catches'].includes(summary.domain)||
    !['add','edit'].includes(summary.action)||
    typeof summary.itemName!=='string'||!summary.itemName.trim())return null;
 return {name:summary.itemName,
  action:TYPES[summary.domain]+' · '+(summary.action==='add'?'Added':'Updated'),
  completedAt:Number.isSafeInteger(summary.completedAt)&&summary.completedAt>0?
   new Date(summary.completedAt*1000):null,
  reasonCode:typeof summary.reasonCode==='string'?summary.reasonCode:null};
}
export function mountV3ConnectionExperience({
 dialog,controller,documentObject=document,onSignIn=()=>{},
}={}){
 if(!dialog?.insertBefore||typeof controller?.current!=='function')throw Error('V3 Connection UI requires owner controller');
 const mk=(tag,cls='',label='')=>{const e=documentObject.createElement(tag);
  if(cls)e.className=cls;if(label)e.textContent=label;return e;};
 const btn=(label,callback)=>{const e=mk('button','btn secondary',label);
  e.type='button';e.addEventListener('click',callback);return e;};
 const account=mk('section','v3-connection-section v3-account');
 account.append(mk('h2','','Account'));
 const accountBody=mk('div','v3-account-body');account.append(accountBody);
 // Native details/summary matches Help & Diagnostics and keeps completed
 // publication history accessible without occupying space by default.
 const publishing=mk('details','v3-connection-section v3-publishing');
 const publishingToggle=mk('summary','v3-publishing-toggle');
 const publishingHeading=mk('h2','','Publishing Status');
 const publishingDot=mk('span','v3-publication-dot');
 publishingDot.hidden=true;
 publishingDot.setAttribute('aria-hidden','true');
 publishingHeading.append(publishingDot);
 publishingToggle.append(publishingHeading);
 publishing.append(publishingToggle);
 const publicationBody=mk('div','v3-publication-body');
 publicationBody.setAttribute('aria-live','polite');
 publishing.append(publicationBody);
 // Keep diagnostics last, after Account and Publishing Status.
 const anchor=dialog.querySelector?.('.v3-connection-help')||
  dialog.querySelector?.('#connection-close')||null;
 dialog.insertBefore(account,anchor);
 dialog.insertBefore(publishing,anchor);
 let statusError='';
 const command=(label,call)=>{
  const control=btn(label,()=>{
   statusError='';
   try{
    const p=call();
    Promise.resolve(p).then(()=>paint(),()=>{statusError='Action unavailable. Check the connection and try again.';paint();});
   }catch{statusError='Action unavailable. Check publication status again.';paint();}
  });
  return control;
 };
 const title=(label)=>mk('strong','v3-connection-value',label);
 const caption=(label)=>mk('p','hint',label);
 const appendSummary=(body,summary,{includeTime=false}={})=>{
  const info=displayPublicationSummary(summary);if(!info)return;
  body.append(title(info.name),caption(info.action));
  if(includeTime&&info.completedAt&&!Number.isNaN(info.completedAt.getTime()))
   body.append(caption('Completed '+info.completedAt.toLocaleString()));
 };
 let previousIndicatorActive=false;
 function paintIndicator(display){
  // The caller supplies the same authoritative tone used for the header dot.
  // Keep this accordion open for active or failed work; collapse as soon as
  // the header dot returns to network green/yellow (Live or cleared).
  // Manual expansion of a completed record remains available between
  // indicator changes; normal network repaint must not undo user choice.
  const tone=display?.tone;
  const active=tone==='publishing'||tone==='error';
  publishingDot.hidden=!active;
  if(active){
   publishingDot.dataset.tone=tone;
   publishingDot.title=display.title;
   publishing.open=true;
  }else{
   delete publishingDot.dataset.tone;
   publishingDot.title='';
   if(previousIndicatorActive)publishing.open=false;
  }
  previousIndicatorActive=active;
 }
 function paint(){
  const state=controller.current(),authorized=state.authorized===true;
  accountBody.replaceChildren();
  publicationBody.replaceChildren();
  if(state.phase==='Checking'||state.phase==='SigningOut'){
   accountBody.append(caption(state.phase==='Checking'?'Checking account…':'Signing out…'));
  }else if(authorized){
   const login=typeof state.ownerLogin==='string'&&/^[A-Za-z0-9-]{1,39}$/.test(state.ownerLogin)?
    state.ownerLogin:'owner';
   accountBody.append(title('Signed in as '+login),
    command('Sign out',()=>controller.signOut()));
  }else if(state.phase==='Unavailable'){
   accountBody.append(caption('Account status unavailable. Reconnect and reopen Connection Status.'));
  }else{
   accountBody.append(title('Not signed in'),
    caption('Sign in to add or edit content.'));
   if(state.phase!=='Offline'){
    const a=mk('a','btn secondary','Sign in with GitHub');
    a.href=globalThis.location?.pathname==='/__d3_pilot__/'?
     '/auth/start?return=%2F__d3_pilot__%2F':
     globalThis.location?.pathname==='/fishing/__d3_pilot__/'?
     '/auth/start?return=%2Ffishing%2F__d3_pilot__%2F':
     '/auth/start?return=%2Ffishing%2F';
    a.addEventListener('click',onSignIn);
    accountBody.append(a);
   }
  }
  if(!authorized){
   publicationBody.append(caption('Sign in to view publishing status.'));
   return;
  }
  const phase=state.publication,summary=state.summary;
  if(TERMINAL.has(phase)){
   const guidance=publicationGuidance(phase,summary?.reasonCode);
   publicationBody.append(title('Publishing failed · '+guidance.heading));
   appendSummary(publicationBody,summary);
   publicationBody.append(caption(guidance.message));
   if(state.statusReadError)publicationBody.append(caption('Latest status check unavailable; the confirmed failure remains recorded.'));
   publicationBody.append(command('Clear',()=>controller.acknowledgeFailedPublication()));
  }else if(ACTIVE.has(phase)){
   publicationBody.append(title('Publishing: '+phase));
   appendSummary(publicationBody,summary);
   publicationBody.append(caption(state.statusReadError?
    'Status update unavailable. Your publication may still be processing.':
    'Updates automatically. No action required.'));
   if(state.statusReadError)
    publicationBody.append(command('Check again',()=>controller.refreshPublication()));
  }else if(phase==='Live'&&state.sandboxVerified===true){
   publicationBody.append(title('Completed · Sandbox Live'));
   appendSummary(publicationBody,summary,{includeTime:true});
   publicationBody.append(caption('Publication completed and verified.'));
  }else if(phase==='Cleared'){
   publicationBody.append(title('Failed status cleared'));
   appendSummary(publicationBody,summary);
   publicationBody.append(caption('The previous failure was acknowledged. It was not republished.'));
  }else if(phase==='Unknown'||state.statusReadError){
   publicationBody.append(title('Publication status unavailable'));
   appendSummary(publicationBody,summary);
   publicationBody.append(caption('The outcome could not be verified. Do not submit the same change again until its status is known.'));
   publicationBody.append(command('Check again',()=>controller.refreshPublication()));
  }else{
   publicationBody.append(caption('No recent publication available.'));
  }
  if(statusError)publicationBody.append(caption(statusError));
 }
 paint();
 return Object.freeze({paint,paintIndicator,remove(){account.remove();publishing.remove();}});
}
