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

const clone=value=>structuredClone(value);
const str=value=>typeof value==='string'?value.trim():'';
const allowed=new Set(['id','date','time','size','speciesId',
 'speciesName','locationId','locationName',
 'lureOrBaitId','lureOrBaitName','notes']);
const validReceipt=r=>r?.accepted===true&&
 /^p3_[a-f0-9-]{36}$/.test(r.operationId??'');

export function suggestedCatchId(record,existing,{sandboxOnly=false}={}){
 const location=(record.locationId??record.locationName??'')
  .replace(/^location-/,'');
 const species=(record.speciesId??record.speciesName??'')
  .replace(/^species-/,'');
 return newId([sandboxOnly?'p3-test-catch':'catch',
  record.date||'undated',location||'unknown',
  species||'fish'].join('-'),existing);
}

export async function prepareCatchPackage({
 ctx,record,baseRecord=null,text:notesText='',baseText='',baseHash=null,
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
   maps,exists:known,pathRoutes:markdownRouteMap(data),
   assetBase:ctx.base});
 }
 return prepareChange({
  domain:'catches',operation:baseRecord?'edit':'add',
  id:candidate.id,baseRecord,record:candidate,
  baseText,text:notesText,sourceRevision:ctx.release.sourceRevision,
  notesPath:candidate.notes??expectedPath,baseFileHash:baseHash,
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
 let pending=false,accepted=false;
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
 const lureField=createAutocomplete('lureOrBait','Lure or bait',
  lure.suggestions);
 generateId();
 const noteInput=el('textarea',{rows:12,
  placeholder:'Optional field notes in Markdown',value:notesText});
 noteInput.addEventListener('input',()=>{
  notesText=noteInput.value;updated();
 });
 const preview=el('div',{class:'markdown-preview',hidden:true});
 let showingPreview=false;
 const previewButton=button('Preview Markdown',()=>{
  try{
   const notesPath=record.notes||narrativePath('catches',record);
   const parsed=parseMarkdown(notesText,{
    owner:notesPath,maps:ctx.maps,exists:ctx.v3.source.files,
    pathRoutes:markdownRouteMap(ctx.data),assetBase:ctx.base,
    allowMissing:true,
   });
   preview.innerHTML=sanitizeHtml(parsed.html,window);
   showingPreview=!showingPreview;
   preview.hidden=!showingPreview;noteInput.hidden=showingPreview;
   previewButton.textContent=showingPreview?'Edit Markdown':'Preview Markdown';
   status(notice,'Markdown preview is local and has not been saved.','info');
  }catch(error){status(notice,error.message,'error');}
 });
  const submit=el('button',{type:'submit',class:'btn primary'},'Save and Publish');
 form.append(
  field('Catch ID (fixed after publication)',idInput),
  field('Date',dateInput),field('Time (optional)',timeInput),
  field('Size (optional)',sizeInput),
  speciesField,locationField,lureField,
  field('Notes (Markdown, optional)',noteInput),previewButton,preview,
  toolbar(submit,button('Cancel',onBack)),actionNotice,
 );
 form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(pending||accepted)return;
  pending=true;submit.disabled=true;
  notice.replaceChildren();actionNotice.replaceChildren();
  try{
   const pkg=await prepareCatchPackage({
    ctx,record,baseRecord,text:notesText,baseText:initialText,baseHash,
   });
   // No local queuing, retrying, or optimistic publication confirmation.
   const receipt=await publishChange(pkg);
   if(!validReceipt(receipt))
    throw new Error('A durable Catch publication receipt was not confirmed.');
   accepted=true;
   for(const control of form.querySelectorAll('input,select,textarea,button'))
    control.disabled=true;
   output.replaceChildren(text('h3','Publication accepted'),
    text('p','The Catch was accepted by the server. Source and hosted verification are in progress.','hint'),
    text('p','Operation ID'),el('code',{},receipt.operationId),
    text('p','Use Connection Status to check the final verified result.'),
    toolbar(button('Done',onExit,{variant:'primary'})));
   status(notice,'Accepted. This is not yet verified as Live.','success');
   onDirty(false);
   try{onPrepared(receipt);}catch{ /* Cannot undo a durable receipt. */ }
  }catch(error){
   status(notice,error?.message||'Catch publication not confirmed. Your edit is retained.','error');
   status(actionNotice,'Nothing was confirmed as published. Your edit is retained.','error');
  }finally{
   pending=false;if(!accepted)submit.disabled=false;
  }
 });
 if(ctx.v3.source.sandboxOnly===true)
  host.append(text('p',
   'Private sandbox: use fabricated test Catch data only. Real catches belong in the eventual production release.','hint'));
 host.append(notice,form,output);
 return {element:host,isDirty:dirty,dispose:()=>{},record};
}
