/* FISH118 D4: V3 owner-only Catch Add/Edit, canonical text-only workflow.
 * No Catch images, GPS, offline writes, copy/export, or separate confirmation.
 * This module is unreachable from published V2 routes and never grants
 * server authorization. Source-aware verification remains server-side.
 */
import {el,text,button,field,toolbar,status} from './dom.mjs';
import {DOMAIN,ID_PATTERN,newId,sha256} from './shared.mjs';
import {validateRecord} from './validation.mjs';
import {parseMarkdown,markdownRouteMap,sanitizeHtml} from './markdown.mjs';
import {applyCatchField,catchFieldValue,speciesCatchChoices,lureCatchChoices} from './catch-fields.mjs';
import {prepareChange,narrativePath} from './handoff.mjs';
import {createNotesMarkdownEditor} from './notes-markdown-editor.mjs';
import {catchLureTargets,filterCatchLureTargets,applyCatchLureSelection}
 from './catch-lure-picker.mjs';

const clone=value=>structuredClone(value);
const str=value=>typeof value==='string'?value.trim():'';
const allowed=new Set(['id','date','time','size','speciesId',
 'speciesName','locationId','locationName',
 'lureOrBaitId','lureOrBaitName','notes']);
const validReceipt=r=>r?.accepted===true&&
 /^p3_[a-f0-9-]{36}$/.test(r.operationId??'');
// Show only a bounded, machine-generated error code. Never surface raw server
// responses, authentication data, request packages or staged image bytes.
export function catchPublicationErrorText(error){
 const message=typeof error?.message==='string'&&error.message.length<=450?
  error.message:'Catch publication not confirmed. Keep this edit and check Connection Status.';
 const code=typeof error?.code==='string'&&/^[A-Z][A-Z0-9_]{2,63}$/.test(error.code)?
  error.code:null;
 return message+(code?' (code: '+code+')':'');
}

export function suggestedCatchId(record,existing,{sandboxOnly=false}={}){
 const location=(record.locationId??record.locationName??'')
  .replace(/^location-/,'');
 const species=(record.speciesId??record.speciesName??'')
  .replace(/^species-/,'');
 return newId([sandboxOnly?'p3-test-catch':'catch',
  record.date||'undated',location||'unknown',
  species||'fish'].join('-'),existing);
}

/**
 * Private P3 source CI permits fabricated Catch entries only. Keep this
 * presentation guard scoped to that sandbox; production names are unrestricted.
 * This mirrors the trusted sandbox validator, which remains authoritative.
 */
export function validatePrivateSandboxCatch(record,{sandboxOnly=false,adding=false,count=0}={}){
 if(!sandboxOnly)return;
 if(!record?.id?.startsWith('p3-test-catch-'))
  throw new Error('Private sandbox Catch IDs must start with p3-test-catch-.');
 if(adding&&count>=5)
  throw new Error('The private sandbox has reached its five-Catch test limit.');
 for(const [key,label] of [
  ['speciesName','Species'],['locationName','Location'],
  ['lureOrBaitName','Lure or bait'],
 ]){
  const value=record[key];
  if(!value)continue;
  if(/p3|test|synthetic/i.test(value)||
   (key==='lureOrBaitName'&&value==='Other'))continue;
  throw new Error('Private sandbox '+label+' must clearly identify fabricated test data. Include "Test", "Synthetic", or "p3" (for example, "Synthetic '+value+'"). Real '+label.toLowerCase()+' names are permitted in production.');
 }
}

export async function prepareCatchPackage({
 ctx,record,baseRecord=null,text:notesText='',baseText='',baseHash=null,notesImages=[],
}={}){
 if(!ctx?.v3?.source||!(ctx.v3.source.files instanceof Set)||
  !ctx.release?.sourceRevision)
  throw new Error('Verified private Catch source is required.');
 if(!record||typeof record!=='object'||Array.isArray(record)||
  Object.keys(record).some(key=>!allowed.has(key))||
  !ID_PATTERN.test(record.id??''))
  throw new Error('Invalid Catch fields or identity.');
 if(baseRecord&&baseRecord.id!==record.id)
  throw new Error('Existing Catch IDs cannot be changed.');
 const candidate=clone(record);
 for(const key of ['time','size','speciesId','speciesName',
  'locationId','locationName','lureOrBaitId','lureOrBaitName'])
  if(!str(candidate[key]))delete candidate[key];
  else candidate[key]=str(candidate[key]);
 // Fail fast before a durable receipt, GitHub PR or unneeded CI run.
 // Sandbox-only synthetic-content restrictions never apply to production.
 validatePrivateSandboxCatch(candidate,{
  sandboxOnly:ctx.v3.source.sandboxOnly===true,
  adding:!baseRecord,count:ctx.data.catches.catches.length,
 });
 if(typeof notesText!=='string'||typeof baseText!=='string')
  throw new Error('Invalid Catch Notes.');
 if(baseRecord?.notes&&!notesText.trim())
  throw new Error('Existing Catch Notes cannot be removed in this pilot.');
 const expectedPath=narrativePath('catches',candidate);
 if(baseRecord?.notes)candidate.notes=baseRecord.notes;
 else if(notesText.trim())candidate.notes=expectedPath;
 else delete candidate.notes;
 const known=ctx.v3.source.files;
 if(baseRecord?.notes&&!known.has(baseRecord.notes))
  throw new Error('The original Catch Notes are missing from the verified source.');
 if(!baseRecord?.notes&&candidate.notes&&known.has(candidate.notes))
  throw new Error('The new Catch Notes path already exists.');
 if(!baseRecord&&ctx.data.catches.catches.some(c=>c.id===candidate.id))
  throw new Error('A Catch with this ID already exists.');
 const maps=validateRecord(candidate,'catches',ctx.data);
 if(notesText.trim()){
  const data=clone(ctx.data),items=data.catches.catches;
  const pos=items.findIndex(x=>x.id===candidate.id);
  if(pos<0)items.push(candidate);else items[pos]=candidate;
  parseMarkdown(notesText,{owner:candidate.notes,
   maps,exists:new Set([...known,...notesImages.map(x=>x.path)]),pathRoutes:markdownRouteMap(data),
   assetBase:ctx.base});
 }
 return prepareChange({
  domain:'catches',operation:baseRecord?'edit':'add',
  id:candidate.id,baseRecord,record:candidate,
  baseText,text:notesText,sourceRevision:ctx.release.sourceRevision,
  notesPath:candidate.notes??expectedPath,baseFileHash:baseHash,notesImages,
 });
}

export async function createCatchEditor(ctx,{
 baseRecord=null,onBack=()=>{},onExit=()=>{},
 onDirty=()=>{},onPrepared=()=>{},publishChange,
}={}){
 if(typeof publishChange!=='function'||!ctx?.v3?.source)
  throw new Error('Owner-only Catch publishing is unavailable.');
 const editing=Boolean(baseRecord),record=baseRecord?clone(baseRecord):
  {id:'',date:''};
 const original=JSON.stringify(record);
 let initialText='',notesText='',baseHash=null;
 if(baseRecord?.notes){
  const source=ctx.v3.source.markdown;
  if(!(source instanceof Map)||!source.has(baseRecord.notes))
   throw new Error('The verified Catch Notes cannot be loaded.');
  initialText=source.get(baseRecord.notes);
  if(typeof initialText!=='string')
   throw new Error('Invalid verified Catch Notes.');
  notesText=initialText;
  baseHash=await sha256(new TextEncoder().encode(initialText));
 }
 let pending=false,accepted=false,notesEditor=null;
 const dirty=()=>!accepted&&
  (JSON.stringify(record)!==original||notesText!==initialText);
 const host=el('div',{class:'editor'}),form=el('form',{class:'editor-form'}),
  notice=el('div',{class:'editor-notice','aria-live':'polite'}),
  actionNotice=el('div',{'aria-live':'polite'}),
  output=el('div',{class:'handoff-output'});
 const updated=()=>{if(!accepted){output.replaceChildren();onDirty(dirty());}};
 const ids=new Set(ctx.data.catches.catches.map(x=>x.id));
 const idInput=el('input',{type:'text',readonly:true,value:record.id});
 const generateId=()=>{
  if(editing)return;
  record.id=suggestedCatchId(record,ids,{
   sandboxOnly:ctx.v3.source.sandboxOnly===true});
  idInput.value=record.id;
  notesEditor?.syncPaths();
 };
 const dateInput=el('input',{type:'date',required:true,value:record.date});
 dateInput.addEventListener('input',()=>{
  record.date=dateInput.value;generateId();updated();
 });
 const timeInput=el('input',{type:'time',value:record.time||''});
 timeInput.addEventListener('input',()=>{
  if(timeInput.value)record.time=timeInput.value;else delete record.time;
  updated();
 });
 const sizeInput=el('input',{type:'text',maxlength:500,
  placeholder:'e.g., 14 in',value:record.size||''});
 sizeInput.addEventListener('input',()=>{
  if(sizeInput.value.trim())record.size=sizeInput.value;
  else delete record.size;
  updated();
 });
 const species=speciesCatchChoices(ctx.data),
  lure=lureCatchChoices(ctx.data);
 const createAutocomplete=(key,label,choices)=>{
  const id='catch-'+key+'-options';
  const list=el('datalist',{id},choices.map(name=>el('option',{value:name})));
  const entry=el('input',{type:'text',list:id,maxlength:160,
   autocomplete:'off',value:catchFieldValue(record,key,
    key==='species'?species.linked:lure.linked)});
  entry.addEventListener('input',()=>{
   applyCatchField(record,key,entry.value,
    key==='species'?species.linked:lure.linked);
   generateId();updated();
  });
  return el('div',{class:'catch-combobox'},field(label,entry),list);
 };
 const speciesField=createAutocomplete('species','Species',species.suggestions);
 const locationEntry=el('input',{type:'text',maxlength:160,
  placeholder:'Enter lake, river, or specific location',
  value:catchFieldValue(record,'location',ctx.data.kb.entities
   .filter(e=>e.type==='location'))});
 locationEntry.addEventListener('input',()=>{
  applyCatchField(record,'location',locationEntry.value,
   ctx.data.kb.entities.filter(e=>e.type==='location'));
  generateId();updated();
 });
 const locationField=field('Location',locationEntry);
 // The native datalist becomes very tall and hard to scan as the Gear
 // catalog grows. Use the same search/filter/bounded list pattern as
 // Insert link, but leave the Catch form compact until Choose is pressed.
 const lureDisplay=el('input',{type:'text',readonly:true,
  value:catchFieldValue(record,'lureOrBait',lure.linked),
  placeholder:'No lure or bait selected'});
 const lurePickButton=button('Choose',openLurePicker);
 const lureSummary=el('div',{class:'catch-lure-summary'},
  field('Lure or bait',lureDisplay),lurePickButton);
 const lurePanel=el('div',{class:'catch-lure-panel',hidden:true});
 const lureKinds='catch-lure-kind-'+Math.random().toString(36).slice(2);
 const gearRadio=el('input',{type:'radio',name:lureKinds,checked:true});
 const customRadio=el('input',{type:'radio',name:lureKinds});
 const lureSearch=el('input',{type:'search',placeholder:'Search Gear by name or type',
  'aria-label':'Search lures and bait'});
 const targets=catchLureTargets(ctx.data);
 const groups=[...new Set(targets.map(x=>x.group))].sort((a,b)=>a.localeCompare(b));
 const lureFilter=el('select',{},
  el('option',{value:'all'},'All types'),
  groups.map(group=>el('option',{value:group},group)));
 const lureList=el('select',{size:7,'aria-label':'Matching lure or bait items'});
 const customInput=el('input',{type:'text',maxlength:160,
  placeholder:'Enter a custom lure or bait'});
 const gearFields=el('div',{class:'catch-lure-catalog'},
  field('Search catalog',lureSearch),field('Gear type',lureFilter),
  field('Matching items',lureList));
 const customFields=el('div',{class:'catch-lure-custom',hidden:true},
  field('Custom lure or bait',customInput));
 const lureMessage=el('div',{'aria-live':'polite'});
 let visibleTargets=[];
 function renderLureList(){
  const old=lureList.value;
  visibleTargets=filterCatchLureTargets(targets,{
   query:lureSearch.value,group:lureFilter.value});
  lureList.replaceChildren(...(visibleTargets.length?
   visibleTargets.map(x=>el('option',{value:x.key},
    x.group+' · '+x.name)):
   [el('option',{value:'',disabled:true},'No matching items')]));
  if(visibleTargets.some(x=>x.key===old))lureList.value=old;
  else if(visibleTargets.length)lureList.value=visibleTargets[0].key;
 }
 function updateLureMode(){
  gearFields.hidden=!gearRadio.checked;
  customFields.hidden=gearRadio.checked;
 }
 function closeLurePicker(){lurePanel.hidden=true;lureMessage.replaceChildren();}
 function openLurePicker(){
  closeLurePicker();
  lureSearch.value='';lureFilter.value='all';customInput.value='';
  gearRadio.checked=true;customRadio.checked=false;
  const current=record.lureOrBaitId;
  renderLureList();
  if(current&&visibleTargets.some(x=>x.key==='gear:'+current))
   lureList.value='gear:'+current;
  else if(record.lureOrBaitName){
   const item=visibleTargets.find(x=>x.kind==='name'&&
    x.name.toLocaleLowerCase()===record.lureOrBaitName.toLocaleLowerCase());
   if(item)lureList.value=item.key;
   else{
    customRadio.checked=true;gearRadio.checked=false;
    customInput.value=record.lureOrBaitName;
   }
  }
  updateLureMode();lurePanel.hidden=false;
  lurePanel.scrollIntoView({block:'nearest'});
  if(gearRadio.checked)lureSearch.focus();else customInput.focus();
 }
 lureSearch.addEventListener('input',renderLureList);
 lureFilter.addEventListener('change',renderLureList);
 gearRadio.addEventListener('change',updateLureMode);
 customRadio.addEventListener('change',updateLureMode);
 const selectLure=button('Select',()=>{
  const item=gearRadio.checked?
   visibleTargets.find(x=>x.key===lureList.value):
   {kind:'name',name:customInput.value.trim()};
  try{
   if(!item?.name?.trim())throw Error('Choose a lure or bait or enter a custom name.');
   applyCatchLureSelection(record,item);
   lureDisplay.value=catchFieldValue(record,'lureOrBait',lure.linked);
   updated();closeLurePicker();
  }catch(error){status(lureMessage,error.message,'error');}
 });
 lurePanel.append(el('h3',{},'Choose lure or bait'),
  el('fieldset',{class:'catch-lure-kind'},
   el('legend',{},'Source'),
   el('label',{},gearRadio,' Gear catalog or previous entries'),
   el('label',{},customRadio,' Custom name')),
  gearFields,customFields,lureMessage,
  el('div',{class:'notes-image-actions'},
   button('Cancel',closeLurePicker),selectLure));
 const lureField=el('div',{class:'catch-lure-picker'},lureSummary,lurePanel);
 generateId();
 notesEditor=createNotesMarkdownEditor({
  domain:'catches',getRecord:()=>record,value:notesText,
  label:'Notes (Markdown, optional)',
  onChange:value=>{notesText=value;updated();},
  knownPaths:()=>ctx.v3.source.files,
  allowUpload:typeof ctx.v3.stageMedia==='function',
  linkMaps:()=>ctx.maps,
  previewOptions:()=>({owner:record.notes||narrativePath('catches',record),
   maps:ctx.maps,pathRoutes:markdownRouteMap(ctx.data),assetBase:ctx.base}),
 });
  const submit=el('button',{type:'submit',class:'btn primary'},'Save and Publish');
 const actions=toolbar(submit,button('Cancel',onBack));
 form.append(
  field(baseRecord?'ID':'ID (generated automatically)',idInput),
  field('Date',dateInput),field('Time (optional)',timeInput),
  field('Size (optional)',sizeInput),
  speciesField,locationField,lureField,
  notesEditor.element,
  actions,actionNotice,
 );
 form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(pending||accepted)return;
  pending=true;submit.disabled=true;
  notice.replaceChildren();actionNotice.replaceChildren();
  try{
   notesEditor.syncPaths();
    notesText=notesEditor.value();
    const notesUploads=notesEditor.uploads();
    if(notesUploads.length&&typeof ctx.v3?.stageMedia!=='function')
     throw Error('Direct Notes image publishing requires the D4 media service.');
    const pkg=await prepareCatchPackage({
    ctx,record,baseRecord,text:notesText,baseText:initialText,baseHash,
     notesImages:notesUploads.map(x=>({path:x.path,bytes:x.bytes,sha256:x.sha256})),
   });
   // No local queuing, retrying, or optimistic publication confirmation.
   const receipt=await publishChange(pkg,notesUploads.map(x=>({path:x.path,file:x.file})));
   if(!validReceipt(receipt))
    throw new Error('A durable Catch publication receipt was not confirmed.');
   accepted=true;
   for(const control of form.querySelectorAll('input,select,textarea,button'))
    control.disabled=true;
   // Keep the submitted Catch form visible and locked for review.
   // Rejected submissions keep Save and Publish / Cancel for correction.
   actions.replaceChildren(button('Exit',onExit,{variant:'primary'}));
   output.replaceChildren(text('p',
    'Publication accepted. Verification and publishing are in progress. You may leave the editor and check publication status in the Connection Status screen.',
    'hint'));
   notice.replaceChildren();
   actionNotice.replaceChildren();
   onDirty(false);
   try{onPrepared(receipt);}catch{ /* Cannot undo a durable receipt. */ }
  }catch(error){
   status(notice,catchPublicationErrorText(error),'error');
   status(actionNotice,'Nothing was confirmed as published. Your edit is retained.','error');
  }finally{
   pending=false;if(!accepted)submit.disabled=false;
  }
 });
 if(ctx.v3.source.sandboxOnly===true)
  host.append(text('p',
   'Private sandbox: use fabricated test Catch data only. Real catches belong in the eventual production release.','hint'));
 host.append(notice,form,output);
 return {element:host,isDirty:dirty,dispose:()=>notesEditor.dispose(),record};
}
