import {GEAR_EQUIPMENT,KB_TECHNIQUES,KB_KNOTS} from './taxonomy.mjs';
/** WP1 preview-only port of the accepted D5 Gear/KB editor.
 * No live writer; immutable source must pass the D6 owner preview gate.
 * The existing V2 editor.mjs is intentionally untouched.
 */
import {el,text,button,field,input,select,section,toolbar,status,picture} from './dom.mjs';
import {createCatchEditor} from './catch-editor.mjs';
import {createCatchEditor as createD6DirectCatchEditor} from './d6-direct-catch-editor.mjs';
import {DOMAIN,GEAR_CATEGORIES,gearCategoryLabel,gearCategoryKey,gearCategoryChoices,KB_TYPES,ROD_TYPES,EQUIPMENT_TYPES,ID_PATTERN,categoryFolder,safePath,encodedPath,newId,suggestedFilename,sha256,sequenceFolder,sequencePicturePath} from './shared.mjs';
import {TAXONOMY,validateRecord,validateRecords} from './validation.mjs';
import {parseMarkdown,sanitizeHtml,markdownRouteMap} from './markdown.mjs';
import {narrativePath,picturePath} from './handoff.mjs';
import {newNarrativePath} from './d6-v3-content-paths.mjs';
import {openViewer,openSequenceViewer} from './viewer.mjs';
import {validateBrowserImage} from './image-validation.mjs';
import {createNotesMarkdownEditor} from './notes-markdown-editor.mjs';
import {DIRECT_D1_MEDIA_CAPABILITIES,presentD6OwnerImageCapability}
 from './d6-owner-media-capabilities.mjs';
import {saveD6OwnerEditorMedia} from './d6-owner-media-editor-save.mjs';
import {draftNotesPreviewOptions} from './editor-preview.mjs';
import {restoreD6RevisionAwareDraft,saveD6RevisionAwareDraft} from './d6-revision-aware-draft-recovery.mjs';

const standaloneV3=typeof __FISHING_D6_STANDALONE_V3__!=='undefined'&&
 __FISHING_D6_STANDALONE_V3__===true;
const clone=value=>structuredClone(value);
function serialize(record){return JSON.stringify(record);}
function optional(record,key,value){if(value.trim())record[key]=value.trim();else delete record[key];}
function knownFiles(ctx){
 const files=ctx.v3?.source?.files instanceof Set?
  new Map([...ctx.v3.source.files].map(path=>[path,{path}])):
  new Map(ctx.manifest.files.filter(x=>
   x.path.startsWith(`releases/${ctx.release.id}/content/`))
   .map(x=>[x.path.slice(`releases/${ctx.release.id}/content/`.length),x]));
 // A new image may be in verified D1/R2 but not in an old software release.
 if(ctx.mediaLiveReader===true&&ctx.mediaPublishedPaths instanceof Set)
  for(const path of ctx.mediaPublishedPaths)files.set(path,{path});
 return files;
}
function knownPaths(ctx){return new Set(knownFiles(ctx).keys());}
function editorMaps(ctx,domain,record){const data=clone(ctx.data),key=DOMAIN[domain].array;data[domain][key]=data[domain][key].filter(x=>x.id!==record.id).concat(record);return {data,maps:validateRecords(data),routes:markdownRouteMap(data)};}
const SEQUENCE_ACTIONS=new Set(['add-sequence','replace-with-sequence','replace-sequence']);
const STATIC_FILE_ACTIONS=new Set(['add-static','replace-static','replace-with-static']);
const acceptedImages='.jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif';

// Existing Gear entries can predate their first Notes document. When the
// first Notes text or image is added, the Save must also name that document.
export function d6GearNotesPathForSave(record,markdown){
 return record?.notes||(typeof markdown==='string'&&markdown.trim()?
  narrativePath('gear',record):undefined);
}

export async function createD6ApprovedEditorPreview(ctx,{domain,baseRecord=null,category=null,type=null,onBack=()=>{},onExit=()=>{},onDirty=()=>{}}={}){
 // WP1 only: the D5 controls have NO saving or publishing capability.
 // The full WP3 coordinator will be integrated only after later gates.
 if(ctx?.v3?.ownerAuthoringPreview!==true||
    ctx?.v3?.source?.sourceOnly!==true||
    ctx?.v3?.source?.canPublish!==false||
    !['gear','kb'].includes(domain))
  throw Error('Verified read-only owner editor preview required.');
 const directGear=domain==='gear'&&
  ctx.v3?.directGearEnabled===true&&
  typeof ctx.v3?.directGearClient?.read==='function'&&
  typeof ctx.v3?.directGearClient?.save==='function';
 const directKB=domain==='kb'&&
  ctx.v3?.directKBEnabled===true&&
  typeof ctx.v3?.directKBClient?.read==='function'&&
  typeof ctx.v3?.directKBClient?.save==='function';
 const directSave=directGear||directKB;
 if(standaloneV3&&!directSave)
  throw Error('Standalone V3 requires authenticated direct D1 Save.');
 if(ctx.v3?.directGearEnabled===true&&domain==='gear'&&
    !directGear)
  throw Error('Direct Gear service unavailable. No edit was submitted.');
 if(ctx.v3?.directKBEnabled===true&&domain==='kb'&&
    !directKB)
  throw Error('Direct KB service unavailable. No edit was submitted.');
 let directRevision=directSave&&!baseRecord?0:null,directNotes=null;
 if(directSave&&baseRecord){
  const latest=await (directGear?ctx.v3.directGearClient:
   ctx.v3.directKBClient).read(baseRecord.id);
  if(latest.record?.id!==baseRecord.id||
     !Number.isSafeInteger(latest.revision)||latest.revision<1)
   throw Error('This record could not be verified in D1.');
  baseRecord=latest.record;directRevision=latest.revision;
  directNotes=directGear?latest.notes:latest.markdown;
 }
 const editing=Boolean(baseRecord),key=domain==='gear'?'notes':'content',record=baseRecord?clone(baseRecord):{id:'',name:'',...(domain==='gear'?{category:category||'lures',type:'',specifications:[],links:[]}:{type:type||KB_TECHNIQUES,content:''})};
 if(!editing&&domain==='gear')record.type=(record.category==='rods-reels'?ROD_TYPES:record.category===GEAR_EQUIPMENT?EQUIPMENT_TYPES:TAXONOMY[record.category]||[])[0]||'';
 let baseText='',body='',baseHash=null,mediaAction='keep',fileInfo=null,previewUrl=null,sequenceInfos=[],sequenceUrls=[],savePending=false,saveAccepted=false,notesEditor=null;
 if((directSave&&baseRecord)||baseRecord?.[key]){
  let bytes;
  if(directSave&&baseRecord)bytes=new TextEncoder().encode(directNotes);
  else if(ctx.v3?.source?.markdown instanceof Map){
   const text=ctx.v3.source.markdown.get(baseRecord[key]);
   if(typeof text!=='string')
    throw new Error('The immutable sandbox Markdown is missing.');
   bytes=new TextEncoder().encode(text);
  }else{
   const response=await fetch(ctx.asset(baseRecord[key]));
   if(!response.ok)throw new Error(`Cannot read original Markdown: ${response.status}`);
   bytes=new Uint8Array(await response.arrayBuffer());
  }
  baseText=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  body=baseText;baseHash=await sha256(bytes);
 }
 if(!editing&&domain==='kb')body='';
 // Keep pristine server data distinct from a restored local draft.
 const original=serialize(record),initialBody=body;
 const draftStore=ctx.v3?.drafts??null;
 const draftKey=domain+':'+(editing?'edit:'+baseRecord.id:
  'add:'+(domain==='gear'?record.category:record.type));
 const recovery=await restoreD6RevisionAwareDraft({store:draftStore,key:draftKey,
  sourceRevision:ctx.release.sourceRevision,baseHash,
  baseRevision:directSave?directRevision:null});
 if(recovery.status==='restored'||recovery.status==='review'){
  for(const fieldName of Object.keys(record))delete record[fieldName];
  Object.assign(record,recovery.record);body=recovery.notes;
 }
 const reviewOnly=recovery.reviewOnly===true;
 const draftWritable=!reviewOnly&&
  !['stale','corrupt','unavailable','conflict','legacy'].includes(recovery.status);
 const host=el('div',{class:'editor'}),notice=el('div',{class:'editor-notice','aria-live':'polite'}),form=el('form',{class:'editor-form'});
 if(recovery.message)status(notice,recovery.message,
  recovery.status==='restored'||recovery.status==='discarded'?'info':'warning');
 let draftSequence=0;
 const warnDraft=()=>status(notice,
  'Device draft could not be saved. Keep this editor open until the changes are safely submitted.','warning');
 const reviewAction=reviewOnly?toolbar(button('Discard saved draft and reload',async()=>{
  if(!confirm('Discard this saved draft permanently and reload the current server record?'))return;
  try{await draftStore.discard(draftKey);location.reload();}
  catch{status(notice,'The saved draft could not be discarded. It was retained.','warning');}
 },{variant:'danger'})):null;
 const discardDraft=async()=>{
  ++draftSequence;
  if(draftStore&&draftWritable)await draftStore.discard(draftKey);
 };
 const writeDraft=()=>saveD6RevisionAwareDraft({store:draftStore,key:draftKey,domain,
  sourceRevision:ctx.release.sourceRevision,baseHash,
  baseRevision:directSave?directRevision:null,
  record,notes:body,requiresMedia:mediaAction!=='keep'||
   Boolean(notesEditor?.uploads().length)});
 const persistDraft=()=>{
  if(!draftStore||!draftWritable||saveAccepted)return;
  const sequence=++draftSequence;
  if(!dirty()){
   void draftStore.discard(draftKey).catch(warnDraft);
   return;
  }
  void writeDraft()
   .then(()=>{if(sequence===draftSequence&&!saveAccepted)
    status(notice,'Draft saved on this device. Nothing has been published.','info');},
    warnDraft);
 };
 const dirty=()=>!saveAccepted&&(serialize(record)!==original||body!==initialBody||mediaAction!=='keep');
 function changed(){if(saveAccepted)return;
  if(directSave)prepareButton.disabled=savePending||reviewOnly||!dirty();
  onDirty?.(dirty());persistDraft();}
 function update(fieldName,value){optional(record,fieldName,value);changed();}
 function revokeLocal(clearInput=true){if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null;}for(const url of sequenceUrls)URL.revokeObjectURL(url);sequenceUrls=[];fileInfo=null;sequenceInfos=[];if(clearInput)fileInput.value='';}
 function recalcSequencePaths(){if(!sequenceInfos.length||!ID_PATTERN.test(record.id))return;for(const info of sequenceInfos)info.path=sequencePicturePath(record,info.name);record.pictureSequence=sequenceInfos.map(x=>x.path);picturePathInput.value=record.pictureSequence.at(-1);record.picture={src:picturePathInput.value,...(captionInput.value?{caption:captionInput.value}:{})};}
 function control(label,value,change,options={}){const c=input(value,options);c.addEventListener('input',()=>change(c.value));return field(label,c,options.hint||'');}
 function requiredControl(label,keyName,options={}){
  const c=input(record[keyName]||'',{required:true,maxlength:160,...options});
  c.addEventListener('input',()=>{
   record[keyName]=c.value;
   if(keyName==='name'&&!editing){
    record.id=c.value.trim()?newId(c.value,
     new Set(ctx.data[domain][DOMAIN[domain].array].map(x=>x.id))):'';
    idInput.value=record.id;
    notesEditor?.syncPaths();
    recalcSequencePaths();
    // An unsubmitted new record's image and Knot paths follow its
    // generated ID when the owner changes Name after selecting files.
    refreshSelectedPicturePath();
    renderPicture();
   }
   changed();
  });
  return field(label,c);
 }
 // All Gear and Knowledge Base types share this non-editable generated ID.
 // Published IDs remain stable so links, Catches and media paths do not break.
 const idInput=input(record.id,{required:true,maxlength:160,readonly:true});
 const nameField=requiredControl('Name','name');
 form.append(nameField,field(editing?'ID':
  'ID (generated automatically)',idInput));
 const categoryControls=el('div',{class:'form-grid'});let typeSelect=null;
 if(domain==='gear'){
  // Use native select controls on Windows and Android; native datalist input
  // suggestions did not reliably expose existing choices on mobile browsers.
  // Explicit Add buttons keep user-defined values available without editing
  // the selection text or changing historical category keys.
  const categoryRows=gearCategoryChoices(ctx.data.gear.items);
  const categorySelect=select(categoryRows,record.category,()=>{
   setCategory(categorySelect.value);
  });
  const typesFor=c=>[...new Set([
   ...(c==='rods-reels'?ROD_TYPES:c===GEAR_EQUIPMENT?EQUIPMENT_TYPES:TAXONOMY[c]||[]),
   ...ctx.data.gear.items.filter(item=>item.category===c).map(item=>item.type),
  ])].filter(Boolean).sort((a,b)=>a.localeCompare(b));
  typeSelect=select([],record.type,()=>{
   record.type=typeSelect.value;
   notesEditor?.syncPaths();
   changed();
  });
  function updateTypes(reset){
   const choices=typesFor(record.category);
   if(reset)record.type=choices[0]||'';
   typeSelect.replaceChildren(...(choices.length?
    choices.map(value=>el('option',{value},value)):
    [el('option',{value:''},'Select or add a type')]));
   if(record.type&&!choices.includes(record.type))
    typeSelect.append(el('option',{value:record.type},record.type));
   typeSelect.value=record.type;
  }
  function setCategory(key){
   if(key===record.category)return;
   record.category=key;
   updateTypes(true);
   notesEditor?.syncPaths();
   refreshSelectedPicturePath();
   renderPicture();
   changed();
  }
  updateTypes(false);

  function addValueControl({label,maxlength,onUse}){
   const valueInput=input('',{maxlength,placeholder:'New '+label.toLowerCase()});
   const panel=el('div',{class:'new-choice'});
   panel.hidden=true;
   const open=button('Add new '+label.toLowerCase(),()=>{
    panel.hidden=false;
    valueInput.focus();
   });
   const apply=button('Add',()=>{
    const value=valueInput.value.trim();
    if(!value){status(notice,'Enter a new '+label.toLowerCase()+' first.','error');return;}
    if(onUse(value)!==true)return;
    panel.hidden=true;
    valueInput.value='';
   },{variant:'primary'});
   const cancel=button('Cancel',()=>{
    panel.hidden=true;valueInput.value='';
   });
   panel.append(field('New '+label.toLowerCase(),valueInput),
    toolbar(apply,cancel));
   return {open,panel};
  }
  const newCategory=addValueControl({label:'Category',maxlength:80,onUse:label=>{
   const key=gearCategoryKey(label);
   if(!key||key.length>80||!/^[a-z0-9][a-z0-9-]*$/.test(key)){
    status(notice,'Category must use a name of up to 80 characters.','error');
    return false;
   }
   if(!categoryRows.some(row=>row[0]===key)){
    const name=gearCategoryLabel(key);
    categoryRows.push([key,name]);
    categorySelect.append(el('option',{value:key},name));
   }
   categorySelect.value=key;
   setCategory(key);
   return true;
  }});
  const newType=addValueControl({label:'Type',maxlength:160,onUse:label=>{
   if(label.length>160){
    status(notice,'Type must be 160 characters or fewer.','error');
    return false;
   }
   const existing=Array.from(typeSelect.options).find(option=>
    option.value.toLowerCase()===label.toLowerCase());
   const selected=existing?.value||label;
   if(!existing)typeSelect.append(el('option',{value:selected},selected));
   typeSelect.value=selected;
   record.type=selected;
   notesEditor?.syncPaths();
   changed();
   return true;
  }});
  categoryControls.append(
   el('div',{class:'gear-choice-control'},field('Category',categorySelect),
    newCategory.open,newCategory.panel),
   el('div',{class:'gear-choice-control'},field('Type',typeSelect),
    newType.open,newType.panel));
  form.append(categoryControls,el('div',{class:'form-grid'},control('Manufacturer',record.manufacturer||'',value=>update('manufacturer',value),{maxlength:120}),control('Model',record.model||'',value=>update('model',value),{maxlength:160})));
  function repeater(title,keyName,fields){
   const holder=el('div',{class:'repeater'}),rows=el('div',{});
   function renderRows(){rows.replaceChildren(...(record[keyName]||[]).map((item,index)=>{const row=el('div',{class:'repeat-row'});for(const [fieldName,label] of fields){const c=input(item[fieldName]||'',{maxlength:fieldName==='url'?2000:500,placeholder:label});c.addEventListener('input',()=>{item[fieldName]=c.value;changed();});c.setAttribute('aria-label',label);row.append(c);}const actions=toolbar(button('↑',()=>move(index,-1),{disabled:index===0,title:'Move up'}),button('↓',()=>move(index,1),{disabled:index===record[keyName].length-1,title:'Move down'}),button('Remove',()=>{record[keyName].splice(index,1);renderRows();changed();},{variant:'danger'}));row.append(actions);return row;}));}
   function move(index,delta){const array=record[keyName];[array[index],array[index+delta]]=[array[index+delta],array[index]];renderRows();changed();}
   holder.append(text('h3',title),rows,button('Add '+(keyName==='links'?'link':'specification'),()=>{if(!record[keyName])record[keyName]=[];record[keyName].push(Object.fromEntries(fields.map(([k])=>[k,''])));renderRows();changed();}));renderRows();return holder;
  }
  form.append(repeater('Specifications','specifications',[['label','Label (optional)'],['value','Value']]),repeater('Links','links',[['label','Label'],['url','URL']]));
 }else{
  typeSelect=select(KB_TYPES.map(r=>[r[0],r[1]]),record.type,()=>{record.type=typeSelect.value;notesEditor?.syncPaths();renderActionOptions(true);refreshSelectedPicturePath();renderPicture();changed();});
  form.append(field('Type',typeSelect),control('Description',record.description||'',value=>update('description',value),{maxlength:80,hint:'Optional, maximum 80 characters.'}));
 }

 const pictureHost=el('div',{class:'picture-editor'}),pictureInfo=el('div',{}),fileInput=el('input',{type:'file',accept:acceptedImages}),picturePathInput={value:record.picture?.src||''},captionInput=input(record.picture?.caption||'',{maxlength:1000}),pictureSelect=select([],mediaAction,()=>{mediaAction=pictureSelect.value;revokeLocal();applyAction();renderActionOptions(false);renderPicture();changed();});
 // Logical paths remain internal; the owner selects a file, never a repository path.
 function refreshSelectedPicturePath(){
  if(!fileInfo||!record.picture||!ID_PATTERN.test(record.id))return;
  const path=picturePath(domain,record,fileInfo.name);
  record.picture.src=path;picturePathInput.value=path;
 }
 function actionOptions(){
  const hasSequence=Boolean(baseRecord?.pictureSequence?.length||
   (mediaAction==='keep'&&record.pictureSequence?.length));
  const hasPicture=Boolean(baseRecord?.picture||
   (mediaAction==='keep'&&record.picture));
  if(hasSequence){
   if(domain==='kb'&&record.type===KB_KNOTS)return [['keep','Keep current sequence'],['replace-sequence','Replace step-by-step sequence'],['replace-with-static','Replace with single picture'],['remove-sequence-keep-picture','Remove sequence, keep representative picture'],['remove-picture','Remove picture from item']];
   return [['keep','Keep current sequence'],['replace-with-static','Replace with single picture'],['remove-sequence-keep-picture','Remove sequence, keep representative picture'],['remove-picture','Remove picture from item']];
  }
  if(domain==='kb'&&record.type===KB_KNOTS)return hasPicture?[['keep','Keep current picture'],['replace-static','Replace picture'],['replace-with-sequence','Replace with step-by-step sequence'],['remove-picture','Remove picture from item']]:[['keep','Keep no picture'],['add-static','Add picture'],['add-sequence','Add step-by-step sequence']];
  return hasPicture?[['keep','Keep current picture'],['replace-static','Replace picture'],['remove-picture','Remove picture from item']]:[['keep','Keep no picture'],['add-static','Add picture']];
 }
 function renderActionOptions(typeChanged=false){
  const options=actionOptions();if(!options.some(([value])=>value===mediaAction)){const hadLocal=Boolean(fileInfo||sequenceInfos.length);revokeLocal();mediaAction='keep';
    if(!editing&&hadLocal){delete record.picture;delete record.pictureSequence;picturePathInput.value='';}
    if(typeChanged&&baseRecord){if(baseRecord.picture===undefined)delete record.picture;else record.picture=clone(baseRecord.picture);
     if(baseRecord.pictureSequence===undefined)delete record.pictureSequence;
     else record.pictureSequence=clone(baseRecord.pictureSequence);} }
  pictureSelect.replaceChildren(...options.map(([value,label])=>el('option',{value,selected:value===mediaAction},label)));pictureSelect.value=mediaAction;
 }
 function applyAction(){
  if(mediaAction==='keep'&&editing){if(baseRecord.picture===undefined)delete record.picture;else record.picture=clone(baseRecord.picture);
     if(baseRecord.pictureSequence===undefined)delete record.pictureSequence;
     else record.pictureSequence=clone(baseRecord.pictureSequence);captionInput.value=record.picture?.caption||'';picturePathInput.value=record.picture?.src||'';}
  if(mediaAction==='keep'&&!editing){delete record.picture;delete record.pictureSequence;captionInput.value='';picturePathInput.value='';}
  if(mediaAction==='remove-picture'){delete record.picture;delete record.pictureSequence;picturePathInput.value='';}
  if(mediaAction==='remove-sequence-keep-picture'){if(baseRecord?.picture)record.picture=clone(baseRecord.picture);delete record.pictureSequence;picturePathInput.value=record.picture?.src||'';captionInput.value=record.picture?.caption||captionInput.value;}
  if(mediaAction==='replace-with-static'){delete record.pictureSequence;}
 }
 function refreshCaptionPreview(){const figure=pictureInfo.querySelector('figure.picture');if(!figure)return;let caption=figure.querySelector('figcaption');if(captionInput.value){if(!caption){caption=el('figcaption',{});figure.append(caption);}caption.textContent=captionInput.value;}else caption?.remove();}
 captionInput.addEventListener('input',()=>{if(record.picture)optional(record.picture,'caption',captionInput.value);refreshCaptionPreview();changed();});
 function orderedSequenceFiles(files){
  const parsed=[...files].map(file=>{const match=/^step-(\d+)\.(jpe?g|png|webp|gif)$/i.exec(file.name);if(!match)throw new Error(`Sequence files must use step-01, step-02, ... names: ${file.name}`);return {file,number:Number(match[1]),digits:match[1]};}).sort((a,b)=>a.number-b.number);
  if(parsed.length<2)throw new Error('A step-by-step sequence requires at least two pictures.');
  parsed.forEach((item,index)=>{const expected=String(index+1).padStart(2,'0');if(item.digits!==expected)throw new Error(`Sequence numbering must be contiguous: expected step-${expected}, got ${item.file.name}`);});
  return parsed.map(x=>x.file);
 }
 async function chooseFile(){
  try{
   if(SEQUENCE_ACTIONS.has(mediaAction)){
    const files=orderedSequenceFiles(fileInput.files||[]),infos=[];for(const file of files){const info=await validateBrowserImage(file);infos.push({...info,file,name:file.name,path:sequencePicturePath(record,file.name)});}
    revokeLocal(false);sequenceInfos=infos;sequenceUrls=files.map(file=>URL.createObjectURL(file));record.pictureSequence=sequenceInfos.map(x=>x.path);picturePathInput.value=record.pictureSequence.at(-1);record.picture={src:picturePathInput.value,...(captionInput.value?{caption:captionInput.value}:{})};renderPicture();changed();return;
   }
   const file=fileInput.files?.[0];if(!file)return;fileInfo={...(await validateBrowserImage(file)),file};if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=URL.createObjectURL(file);picturePathInput.value=picturePath(domain,record,file.name);record.picture={src:picturePathInput.value,...(captionInput.value?{caption:captionInput.value}:{})};if(mediaAction==='replace-with-static')delete record.pictureSequence;renderPicture();changed();
  }catch(error){fileInput.value='';revokeLocal();status(notice,error.message,'error');renderPicture();}
 }
 fileInput.addEventListener('change',chooseFile);
 function renderPicture(){
  pictureInfo.replaceChildren();const sequenceMode=SEQUENCE_ACTIONS.has(mediaAction),existingSequence=Boolean(record.pictureSequence?.length),hasLocalSequence=sequenceInfos.length>0;
  fileInput.multiple=sequenceMode;fileInput.disabled=!(sequenceMode||STATIC_FILE_ACTIONS.has(mediaAction))||!ID_PATTERN.test(record.id);
  const resolveSavedImage=ctx.image||ctx.asset;
  const savedPaths=knownPaths(ctx);
  const src=mediaAction==='remove-picture'?null:hasLocalSequence?
   sequenceUrls.at(-1):previewUrl||(
    record.picture?.src&&savedPaths.has(record.picture.src)?
     resolveSavedImage(record.picture.src):null);
  if(src){
   const sequence=hasLocalSequence?sequenceUrls:
    (record.pictureSequence||[]).map(path=>
     savedPaths.has(path)?resolveSavedImage(path):null);
   const canViewSequence=(hasLocalSequence||existingSequence)&&
    mediaAction!=='remove-sequence-keep-picture'&&
    mediaAction!=='replace-with-static'&&
    sequence.length>=2&&sequence.every(Boolean);
   const activate=canViewSequence?
    ()=>openSequenceViewer(sequence,record.name||'Picture',captionInput.value):
    ()=>openViewer(src,record.name||'Picture',captionInput.value);
   pictureInfo.append(picture(src,record.name||'Picture',captionInput.value,activate));
  }
  if(fileInfo)pictureInfo.append(text('p',`${fileInfo.name} · ${fileInfo.width} × ${fileInfo.height} · ${fileInfo.bytes.toLocaleString()} bytes`,'hint'));
  if(sequenceInfos.length)pictureInfo.append(text('p',`${sequenceInfos.length} pictures selected`,'hint'),text('p',`First frame: ${sequenceInfos[0].name}`,'hint'),text('p',`Representative picture: ${sequenceInfos.at(-1).name}`,'hint'));
  else if(existingSequence&&mediaAction!=='remove-sequence-keep-picture'&&mediaAction!=='replace-with-static')pictureInfo.append(text('p',`${record.pictureSequence.length} pictures in current sequence`,'hint'));
  if(mediaAction==='remove-picture')pictureInfo.append(text('p','The picture and any sequence reference will be removed; source bytes are not deleted.','hint'));
  if(mediaAction==='remove-sequence-keep-picture')pictureInfo.append(text('p','The sequence reference will be removed; the representative picture will remain. Source bytes are not deleted.','hint'));
  if(domain==='kb'&&record.type!==KB_KNOTS&&record.pictureSequence)pictureInfo.append(text('p','This entry still has a step-by-step sequence. Replace it with a single picture, keep only its representative picture, or remove the picture before preparing changes.','notice warning'));
  const fileLabel=sequenceMode?'Choose local pictures':'Choose a local picture';
  pictureHost.replaceChildren(field('Picture action',pictureSelect),pictureInfo,
   field(fileLabel,fileInput,!ID_PATTERN.test(record.id)?
    'Enter the item Name before selecting pictures.':
    sequenceMode?'Select ordered step-01, step-02, ... files. All upload with Save.':
    'The original picture uploads with Save.'),
   field('Caption (optional)',captionInput));
  if(ctx.v3?.mediaCapabilities?.canUploadNewImages!==true){
   // Image actions remain unavailable until authenticated D4 staging is enabled.
   // Hide the obsolete v2 manual-upload suggestion in the gated UI.
   for(const control of [pictureSelect,fileInput,captionInput])
    control.disabled=true;
   pictureHost.replaceChildren(pictureInfo,text('p','Image changes and Knot sequences will become available with integrated uploads. Existing images are preserved.','hint'));
  }
 }
 renderActionOptions(false);renderPicture();
 form.insertBefore(section('Picture',pictureHost),nameField.nextElementSibling.nextElementSibling);

 const v3Notes=Boolean(ctx.v3?.source);
 if(v3Notes){
  notesEditor=createNotesMarkdownEditor({
   domain,getRecord:()=>record,value:body,label:'Markdown',
   onChange:value=>{body=value;changed();},
   // In live-media mode only D1-published originals are previewable.
   // The accepted Notes editor adds locally selected files itself.
   knownPaths:()=>ctx.mediaLiveReader===true?
    new Set(ctx.mediaPublishedPaths??[]):knownPaths(ctx),
   allowUpload:ctx.v3?.mediaCapabilities?.canUploadNewImages===true,
   resolveSavedAsset:path=>(ctx.image||ctx.asset)(path),
   resolveSavedThumbnail:ctx.notesThumbnail,
   linkMaps:()=>ctx.maps,
   // Preview must remain available while a new record's required fields are
   // incomplete. Save and Publish retains full validateRecords/validateRecord.
   // Use the accepted local Notes preview: unpublished selections use their
   // in-memory blob URLs; saved assets still use ctx.image for private R2.
   previewOptions:()=>draftNotesPreviewOptions(ctx,domain,record),
  });
  presentD6OwnerImageCapability(notesEditor.element,
   ctx.v3?.mediaCapabilities??DIRECT_D1_MEDIA_CAPABILITIES);
  // V3-only enhancement: retain the exact accepted D5 Notes component.
  // A visible-text button has no image alt text; keep its accessible name
  // and hover description in sync when Preview toggles to Edit.
  const notesPreview=notesEditor.element.querySelector(
   '.notes-toolbar > .btn:not(.notes-icon-button)');
  if(!notesPreview)throw Error('Notes Preview control is unavailable.');
  const labelPreview=()=>{
   const label=notesPreview.textContent.trim();
   notesPreview.setAttribute('aria-label',label);
   notesPreview.setAttribute('title',
    label==='Edit'?'Return to Markdown editor':'Preview Markdown');
  };
  labelPreview();
  notesPreview.addEventListener('click',labelPreview);
  form.append(section('Notes',notesEditor.element));
 }else{
  const textArea=el('textarea',{rows:14,class:'markdown-editor',value:body,spellcheck:true});
  textArea.addEventListener('input',()=>{body=textArea.value;changed();});
  const preview=el('div',{class:'markdown-preview',hidden:true});let showPreview=false;
  const previewButton=button('Preview Markdown',()=>{
   try{
    const owner=record[key]||narrativePath(domain,record),previewRecord=clone(record);
    if(!previewRecord[key])previewRecord[key]=owner;
    const {maps,routes}=editorMaps(ctx,domain,previewRecord);
    const parsed=parseMarkdown(body,{owner,maps,assetBase:ctx.base,
     exists:knownPaths(ctx),pathRoutes:routes,allowMissing:true});
    const unresolved=parsed.references.filter(r=>r.local&&!knownPaths(ctx).has(r.local));
    if(unresolved.length)throw Error('Upload referenced local files first: '+unresolved.map(r=>r.local).join(', '));
    preview.innerHTML=sanitizeHtml(parsed.html,window);showPreview=!showPreview;
    preview.hidden=!showPreview;textArea.hidden=showPreview;
    previewButton.textContent=showPreview?'Edit Markdown':'Preview Markdown';
    status(notice,'Markdown preview is local and has not been saved.','info');
   }catch(error){status(notice,error.message,'error');}
  });
  form.append(section('Notes',field('Markdown',textArea),previewButton,preview));
 }
 const actionNotice=el('div',{class:'editor-notice editor-action-feedback','aria-live':'assertive'});
 const prepareButton=button(standaloneV3||directSave?'Save':'Prepare Changes',()=>form.requestSubmit(),{variant:'primary'});
 form.addEventListener('submit',async event=>{
  event.preventDefault();
  // Even programmatic submissions cannot stage media or send a write.
  if(ctx.v3?.ownerAuthoringPreview===true&&!directSave)return;
  if(savePending||saveAccepted)return;
  if(reviewOnly){status(notice,'This saved draft is for copying only. Save is blocked until you discard it and open a fresh edit.','warning');return;}
  savePending=true;prepareButton.disabled=true;cancelButton.disabled=true;
  prepareButton.textContent='Saving…';prepareButton.setAttribute('aria-busy','true');
  notice.replaceChildren();actionNotice.replaceChildren();
  status(actionNotice,'Saving changes and pictures…','info');
  try{
   if(!ID_PATTERN.test(record.id))throw new Error('The ID must use lowercase letters, numbers and hyphens.');
   const existing=ctx.data[domain][DOMAIN[domain].array];if(!editing&&existing.some(x=>x.id===record.id))throw new Error('This ID already exists.');
   // Sandbox source is exclusively synthetic. Refuse production-like IDs
   // BEFORE staging any original image; editing existing records is unchanged.
   if(!editing&&ctx.v3?.source?.sandboxOnly===true&&
      !record.id.startsWith('p3-'))
    throw new Error('Private sandbox IDs must begin with p3-. Update the ID before publishing.');
   notesEditor?.syncPaths();
   body=notesEditor?.value()??body;
   const notesUploads=notesEditor?.uploads()??[];
   const candidate=clone(record),sequenceSet=SEQUENCE_ACTIONS.has(mediaAction);
   // Keep can restore undefined optional properties. Strict schema forbids
   // pictureSequence on Gear even when its value is undefined.
   if(candidate.picture===undefined)delete candidate.picture;
   if(candidate.pictureSequence===undefined)delete candidate.pictureSequence;
   if(domain==='gear'&&Object.hasOwn(candidate,'pictureSequence'))
    throw new Error('Gear records cannot contain picture sequences.');
   if(domain==='gear'){candidate.specifications=(candidate.specifications||[]).map(x=>{const item={value:x.value.trim()};if(x.label?.trim())item.label=x.label.trim();return item;});candidate.links=(candidate.links||[]).map(x=>({label:x.label.trim(),url:x.url.trim()}));}
   if(sequenceSet){if(sequenceInfos.length<2)throw new Error('Select the complete step-by-step sequence before preparing changes.');recalcSequencePaths();candidate.pictureSequence=sequenceInfos.map(x=>x.path);candidate.picture={src:candidate.pictureSequence.at(-1),...(captionInput.value.trim()?{caption:captionInput.value.trim()}:{})};}
   if(mediaAction==='remove-picture'){delete candidate.picture;delete candidate.pictureSequence;}
   if(mediaAction==='remove-sequence-keep-picture'){delete candidate.pictureSequence;if(candidate.picture)optional(candidate.picture,'caption',captionInput.value);}
   if(STATIC_FILE_ACTIONS.has(mediaAction)){
    if(mediaAction==='replace-with-static'&&!fileInfo)throw new Error('Select the replacement single picture before preparing changes.');
    candidate.picture={src:safePath(picturePathInput.value),...(captionInput.value.trim()?{caption:captionInput.value.trim()}:{})};if(mediaAction==='replace-with-static')delete candidate.pictureSequence;
   }
   if(mediaAction==='keep'&&candidate.picture)optional(candidate.picture,'caption',captionInput.value);
   if(candidate.pictureSequence&&candidate.type!==KB_KNOTS)throw new Error('Step-by-step sequences are Knot-only. Resolve the sequence before changing this entry to another Type.');
   if(!editing){if(body)candidate[key]=directSave?newNarrativePath(domain,candidate):narrativePath(domain,candidate);else delete candidate[key];}
   if(domain==='gear'&&body.trim()&&!candidate.notes)
    candidate.notes=d6GearNotesPathForSave(candidate,body);
   if(domain==='kb'&&!body.trim())throw new Error('Knowledge Base Notes are required.');
   const result=editorMaps(ctx,domain,candidate);validateRecord(candidate,domain,ctx.data);
   const owner=candidate[key]||narrativePath(domain,candidate),parsed=parseMarkdown(body,{owner,maps:result.maps,assetBase:ctx.base,exists:new Set([...knownPaths(ctx),...notesUploads.map(x=>x.path)]),pathRoutes:result.routes});void parsed;
   if(candidate.picture&&!knownPaths(ctx).has(candidate.picture.src)&&!fileInfo&&!sequenceSet)throw new Error('This picture is not saved. Select its original image file before saving.');
   if(fileInfo&&candidate.picture.src!==picturePath(domain,candidate,fileInfo.name))throw new Error('The selected picture no longer matches this item. Select the original file again.');
   if(fileInfo&&knownPaths(ctx).has(candidate.picture.src)){const existingFile=knownFiles(ctx).get(candidate.picture.src);if(existingFile.sha256!==fileInfo.sha256&&!['replace-static','replace-with-static'].includes(mediaAction))throw new Error('A different file already exists at this path. Use an explicit replacement.');}
   if(sequenceSet){for(const info of sequenceInfos){const existingFile=knownFiles(ctx).get(info.path);if(existingFile&&existingFile.sha256!==info.sha256&&mediaAction==='add-sequence')throw new Error(`A different file already exists at ${info.path}. Use an explicit replacement.`);}}
   if(directSave){
    if((directGear?ctx.v3?.directGearCanSave?.():
       ctx.v3?.directKBCanSave?.())!==true)
     throw Error('Work Offline or signed out. Save is unavailable; your edit is preserved.');
    const wantsMedia=mediaAction!=='keep'||fileInfo||sequenceSet||notesUploads.length;
    // Browser media integration remains unreachable on the current Worker:
    // its immutable DIRECT_D1_MEDIA_CAPABILITIES deny upload and no
    // coordinator is installed. Never fall back to text Save for media edits.
    let saved;
    const privateMedia=ctx.v3?.mediaCapabilities?.canUploadNewImages===true;
    if(wantsMedia||privateMedia){
     const uploads=sequenceSet?
      sequenceInfos.map(x=>({path:x.path,file:x.file,role:'knot-step'})):
      fileInfo?[{path:candidate.picture?.src,file:fileInfo.file,role:'cover'}]:[];
     uploads.push(...notesUploads.map(x=>({
      path:x.path,file:x.file,role:'notes',
     })));
     saved=await saveD6OwnerEditorMedia({
      domain,record:candidate,markdown:body,expectedRevision:directRevision,
      uploads,capabilities:ctx.v3?.mediaCapabilities,
      coordinator:ctx.v3?.ownerMediaCoordinator,
     });
    }else{
     saved=directGear?await ctx.v3.directGearClient.save({
      record:candidate,notes:body,expectedRevision:directRevision,
     }):await ctx.v3.directKBClient.save({
      record:candidate,markdown:body,expectedRevision:directRevision,
     });
    }
    if(saved?.record?.id!==candidate.id||
       saved.revision!==directRevision+1)
     throw Error('Save was not verified. Your edit is preserved.');
    try{
     if(directGear)ctx.v3?.onDirectGearSaved?.();
     else ctx.v3?.onDirectKBSaved?.();
    }catch{/* saved row remains authoritative */}
    saveAccepted=true;
    // A verified D1/R2 Save is final; no second Exit action is needed.
    // Keep the Saving… state until the freshly saved record is reloaded.
    for(const control of form.querySelectorAll('input,select,textarea,button'))
     control.disabled=true;
    onDirty?.(false);
    try{await discardDraft();}catch{/* verified server row remains authoritative */}
    onExit({savedId:candidate.id,savedRecord:candidate});
    window.location.reload();
    return;
   }

  }catch(error){
   const message=error?.code==='PREVIOUS_PUBLICATION_NOT_LIVE'?
    'The previous publication is not yet verified Live. Check Connection Status before starting another publication. No new publication was submitted.':
    error?.code==='UNTRUSTED_STATUS'?
    'Could not verify the previous publication. Your edit is preserved; check Connection Status before trying again.':
    error?.message||'Save was not confirmed. Your edit is retained.';
   status(notice,message,'error');
   status(actionNotice,message,'error');
  }
  finally{savePending=false;prepareButton.removeAttribute('aria-busy');
   if(!saveAccepted){prepareButton.textContent='Save';prepareButton.disabled=reviewOnly||!dirty();cancelButton.disabled=false;}}
 });
 const cancelButton=button('Cancel',async()=>{
  if(!dirty()||!standaloneV3){onBack();return;}
  cancelButton.disabled=true;
  try{
   // The draft store serializes prior writes. This final write confirms
   // the latest editable text/fields before the owner chooses to leave.
   if(!draftStore||!draftWritable||await writeDraft()!==true)
    throw Error('Device draft unavailable');
   const needsReselect=Boolean(recovery.requiresMedia||fileInfo||
    sequenceInfos.length||notesEditor?.uploads().length);
   onBack({deviceDraftSaved:true,needsReselect});
  }catch{
   status(actionNotice,
    'Unable to save the device draft. Keep this editor open or copy your edits before leaving.','error');
  }finally{cancelButton.disabled=false;}
 });
 const actions=toolbar(prepareButton,cancelButton);
 prepareButton.disabled=true;
 prepareButton.setAttribute('aria-label',directGear?'Save Gear':directKB?'Save Knowledge Base':'Save and Publish unavailable in WP1 preview');
 const blocked=standaloneV3||directSave?null:text('p','Editor preview only. Save and Publish is disabled until the secure production publishing pipeline is complete. Your changes have not been submitted.','hint');
 form.append(actions,actionNotice);
 host.append(notice,...(reviewAction?[reviewAction]:[]),
  ...(blocked?[blocked]:[]),form);
 return {element:host,isDirty:dirty,discardDraft,dispose:()=>{revokeLocal();notesEditor?.dispose();},record};
}

/**
 * Reuse the accepted D5 Catch Add/Edit form with its publishing button
 * permanently disabled in WP1. Capture submit BEFORE the D5 form handler,
 * including programmatic submit events; no publishing callback is reachable.
 */
export async function createD6ApprovedCatchPreview(ctx,options={}){
 if(standaloneV3&&ctx?.v3?.directCatchEnabled!==true)
  throw Error('Standalone V3 requires direct Catch Save.');
 if(ctx?.v3?.directCatchEnabled===true){
  if(ctx?.v3?.ownerAuthoringPreview!==true||
     ctx?.v3?.source?.sourceOnly!==true||
     ctx?.v3?.source?.canPublish!==false)
   throw Error('Verified private Catch owner editor required.');
  return createD6DirectCatchEditor(ctx,{...options,
   publishChange:async()=>{throw Error('Legacy GitHub publishing disabled.');},
  });
 }
 if(ctx?.v3?.ownerAuthoringPreview!==true||
    ctx?.v3?.source?.sourceOnly!==true||
    ctx?.v3?.source?.canPublish!==false)
  throw Error('Verified read-only owner Catch editor preview required.');
 if(standaloneV3)throw Error('Legacy Catch publication is disabled in V3.');
 const editor=await createCatchEditor(ctx,{
  ...options,publishChange:async()=>{
   throw Error('Publishing is disabled in this WP1 preview.');
  },onPrepared:()=>{},
 });
 const form=editor.element.querySelector('form');
 const submit=form?.querySelector('button[type="submit"]');
 if(!form||!submit)throw Error('Approved Catch editor controls unavailable');
 // The owner's browser cannot enable a hidden GitHub/media write; no
 // callback in this module is connected to a publishing provider.
 form.addEventListener('submit',event=>{
  event.preventDefault();event.stopImmediatePropagation();
 },true);
 submit.disabled=true;
 submit.setAttribute('aria-label','Save and Publish unavailable in WP1 preview');
 editor.element.prepend(text('p',
  'Editor preview only. Save and Publish is disabled until the secure production publishing pipeline is complete. Nothing has been submitted.','hint'));
 return editor;
}
