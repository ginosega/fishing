import {el,text,button,field,input,select,section,toolbar,status,picture} from './dom.mjs';
import {DOMAIN,GEAR_CATEGORIES,KB_TYPES,ROD_TYPES,EQUIPMENT_TYPES,ID_PATTERN,categoryFolder,safePath,encodedPath,newId,suggestedFilename,sha256,sequenceFolder,sequencePicturePath} from './shared.mjs';
import {TAXONOMY,validateRecord,validateRecords} from './validation.mjs';
import {parseMarkdown,sanitizeHtml,markdownRouteMap} from './markdown.mjs';
import {prepareChange,narrativePath,picturePath,equal} from './handoff.mjs';
import {openViewer,openSequenceViewer} from './viewer.mjs';
import {validateBrowserImage} from './image-validation.mjs';

const clone=value=>structuredClone(value);
function serialize(record){return JSON.stringify(record);}
function optional(record,key,value){if(value.trim())record[key]=value.trim();else delete record[key];}
function knownFiles(ctx){const prefix=`releases/${ctx.release.id}/content/`;return new Map(ctx.manifest.files.filter(x=>x.path.startsWith(prefix)).map(x=>[x.path.slice(prefix.length),x]));}
function knownPaths(ctx){return new Set(knownFiles(ctx).keys());}
function editorMaps(ctx,domain,record){const data=clone(ctx.data),key=DOMAIN[domain].array;data[domain][key]=data[domain][key].filter(x=>x.id!==record.id).concat(record);return {data,maps:validateRecords(data),routes:markdownRouteMap(data)};}
function linkToUpload(path){const dir=path.split('/').slice(0,-1).map(encodeURIComponent).join('/');return `https://github.com/ginosega/fishing/tree/main/${dir}`;}
function linkToSequenceUpload(folder){return `https://github.com/ginosega/fishing/upload/main/${encodedPath(folder)}`;}
const SEQUENCE_ACTIONS=new Set(['add-sequence','replace-with-sequence','replace-sequence']);
const STATIC_FILE_ACTIONS=new Set(['add-static','replace-static','replace-with-static']);
const acceptedImages='.jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif';

export async function createEditor(ctx,{domain,baseRecord=null,category=null,type=null,onBack,onExit,onPrepared,onDirty}){
 const editing=Boolean(baseRecord),key=domain==='gear'?'notes':'content',record=baseRecord?clone(baseRecord):{id:'',name:'',...(domain==='gear'?{category:category||'lures',type:'',specifications:[],links:[]}:{type:type||'technique',content:''})};
 if(!editing&&domain==='gear')record.type=(record.category==='rods-reels'?ROD_TYPES:record.category==='accessories'?EQUIPMENT_TYPES:TAXONOMY[record.category])[0];
 let baseText='',body='',baseHash=null,idTouched=false,mediaAction='keep',fileInfo=null,previewUrl=null,sequenceInfos=[],sequenceUrls=[],prepared=null;
 if(baseRecord?.[key]){const response=await fetch(ctx.asset(baseRecord[key]));if(!response.ok)throw new Error(`Cannot read original Markdown: ${response.status}`);const bytes=new Uint8Array(await response.arrayBuffer());baseText=new TextDecoder('utf-8',{fatal:true}).decode(bytes);body=baseText;baseHash=await sha256(bytes);}
 if(!editing&&domain==='kb')body='';
 const host=el('div',{class:'editor'}),notice=el('div',{class:'editor-notice','aria-live':'polite'}),form=el('form',{class:'editor-form'}),output=el('div',{class:'handoff-output'});
 const original=serialize(record),initialBody=body;
 const dirty=()=>serialize(record)!==original||body!==initialBody||mediaAction!=='keep';
 function changed(){prepared=null;output.replaceChildren();onDirty?.(dirty());}
 function update(fieldName,value){optional(record,fieldName,value);changed();}
 function revokeLocal(clearInput=true){if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null;}for(const url of sequenceUrls)URL.revokeObjectURL(url);sequenceUrls=[];fileInfo=null;sequenceInfos=[];if(clearInput)fileInput.value='';}
 function recalcSequencePaths(){if(!sequenceInfos.length||!ID_PATTERN.test(record.id))return;for(const info of sequenceInfos)info.path=sequencePicturePath(record,info.name);record.pictureSequence=sequenceInfos.map(x=>x.path);picturePathInput.value=record.pictureSequence.at(-1);record.picture={src:picturePathInput.value,...(captionInput.value?{caption:captionInput.value}:{})};}
 function control(label,value,change,options={}){const c=input(value,options);c.addEventListener('input',()=>change(c.value));return field(label,c,options.hint||'');}
 function requiredControl(label,keyName,options={}){const c=input(record[keyName]||'',{required:true,maxlength:160,...options});c.addEventListener('input',()=>{record[keyName]=c.value;if(keyName==='name'&&!editing&&!idTouched){record.id=newId(c.value,new Set(ctx.data[domain][DOMAIN[domain].array].map(x=>x.id)));idInput.value=record.id;recalcSequencePaths();renderPicture();}changed();});return field(label,c);}
 const idInput=input(record.id,{required:true,maxlength:160,readonly:editing});idInput.addEventListener('input',()=>{idTouched=true;record.id=idInput.value;recalcSequencePaths();renderPicture();changed();});
 const nameField=requiredControl('Name','name');
 form.append(nameField,field('ID',idInput));
 const categoryControls=el('div',{class:'form-grid'});let typeSelect=null;
 if(domain==='gear'){
  const categorySelect=select(GEAR_CATEGORIES.map(r=>[r[0],r[1]]),record.category,()=>{record.category=categorySelect.value;const choices=typesFor(record.category);if(!choices.includes(record.type))record.type=choices[0];typeSelect.replaceChildren(...choices.map(x=>el('option',{value:x},x)));typeSelect.value=record.type;changed();});
  const typesFor=c=>c==='rods-reels'?ROD_TYPES:c==='accessories'?EQUIPMENT_TYPES:TAXONOMY[c];
  typeSelect=select(typesFor(record.category),record.type,()=>{record.type=typeSelect.value;changed();});
  categoryControls.append(field('Category',categorySelect),field('Type',typeSelect));
  form.append(categoryControls,el('div',{class:'form-grid'},control('Manufacturer',record.manufacturer||'',value=>update('manufacturer',value),{maxlength:120}),control('Model',record.model||'',value=>update('model',value),{maxlength:160})));
  function repeater(title,keyName,fields){
   const holder=el('div',{class:'repeater'}),rows=el('div',{});
   function renderRows(){rows.replaceChildren(...(record[keyName]||[]).map((item,index)=>{const row=el('div',{class:'repeat-row'});for(const [fieldName,label] of fields){const c=input(item[fieldName]||'',{maxlength:fieldName==='url'?2000:500,placeholder:label});c.addEventListener('input',()=>{item[fieldName]=c.value;changed();});c.setAttribute('aria-label',label);row.append(c);}const actions=toolbar(button('↑',()=>move(index,-1),{disabled:index===0,title:'Move up'}),button('↓',()=>move(index,1),{disabled:index===record[keyName].length-1,title:'Move down'}),button('Remove',()=>{record[keyName].splice(index,1);renderRows();changed();},{variant:'danger'}));row.append(actions);return row;}));}
   function move(index,delta){const array=record[keyName];[array[index],array[index+delta]]=[array[index+delta],array[index]];renderRows();changed();}
   holder.append(text('h3',title),rows,button('Add '+(keyName==='links'?'link':'specification'),()=>{if(!record[keyName])record[keyName]=[];record[keyName].push(Object.fromEntries(fields.map(([k])=>[k,''])));renderRows();changed();}));renderRows();return holder;
  }
  form.append(repeater('Specifications','specifications',[['label','Label (optional)'],['value','Value']]),repeater('Links','links',[['label','Label'],['url','URL']]));
 }else{
  typeSelect=select(KB_TYPES.map(r=>[r[0],r[1]]),record.type,()=>{record.type=typeSelect.value;renderActionOptions(true);renderPicture();changed();});
  form.append(field('Type',typeSelect),control('Description',record.description||'',value=>update('description',value),{maxlength:80,hint:'Optional, maximum 80 characters.'}));
 }

 const pictureHost=el('div',{class:'picture-editor'}),pictureInfo=el('div',{}),fileInput=el('input',{type:'file',accept:acceptedImages}),picturePathInput=input(record.picture?.src||'',{placeholder:'Repository-relative picture path'}),captionInput=input(record.picture?.caption||'',{maxlength:1000}),pictureSelect=select([],mediaAction,()=>{mediaAction=pictureSelect.value;revokeLocal();applyAction();renderActionOptions(false);renderPicture();changed();});
 function actionOptions(){
  const hasSequence=Boolean(record.pictureSequence?.length||baseRecord?.pictureSequence?.length);
  const hasPicture=Boolean(record.picture||baseRecord?.picture);
  if(hasSequence){
   if(domain==='kb'&&record.type==='knot')return [['keep','Keep current sequence'],['replace-sequence','Replace step-by-step sequence'],['replace-with-static','Replace with single picture'],['remove-sequence-keep-picture','Remove sequence, keep representative picture'],['remove-picture','Remove picture']];
   return [['keep','Keep current sequence'],['replace-with-static','Replace with single picture'],['remove-sequence-keep-picture','Remove sequence, keep representative picture'],['remove-picture','Remove picture']];
  }
  if(domain==='kb'&&record.type==='knot')return hasPicture?[['keep','Keep current picture'],['replace-static','Replace picture'],['replace-with-sequence','Replace with step-by-step sequence'],['remove-picture','Remove picture']]:[['keep','Keep no picture'],['add-static','Add picture'],['add-sequence','Add step-by-step sequence']];
  return hasPicture?[['keep','Keep current picture'],['replace-static','Replace picture'],['remove-picture','Remove picture']]:[['keep','Keep no picture'],['add-static','Add picture']];
 }
 function renderActionOptions(typeChanged=false){
  const options=actionOptions();if(!options.some(([value])=>value===mediaAction)){revokeLocal();mediaAction='keep';if(typeChanged&&baseRecord){record.picture=clone(baseRecord.picture);record.pictureSequence=clone(baseRecord.pictureSequence);} }
  pictureSelect.replaceChildren(...options.map(([value,label])=>el('option',{value,selected:value===mediaAction},label)));pictureSelect.value=mediaAction;
 }
 function applyAction(){
  if(mediaAction==='keep'&&editing){record.picture=clone(baseRecord.picture);record.pictureSequence=clone(baseRecord.pictureSequence);captionInput.value=record.picture?.caption||'';picturePathInput.value=record.picture?.src||'';}
  if(mediaAction==='keep'&&!editing){delete record.picture;delete record.pictureSequence;captionInput.value='';picturePathInput.value='';}
  if(mediaAction==='remove-picture'){delete record.picture;delete record.pictureSequence;picturePathInput.value='';}
  if(mediaAction==='remove-sequence-keep-picture'){if(baseRecord?.picture)record.picture=clone(baseRecord.picture);delete record.pictureSequence;picturePathInput.value=record.picture?.src||'';captionInput.value=record.picture?.caption||captionInput.value;}
  if(mediaAction==='replace-with-static'){delete record.pictureSequence;}
 }
 picturePathInput.addEventListener('input',()=>{if(picturePathInput.readOnly)return;fileInfo=null;if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null;}if(mediaAction==='keep')mediaAction=record.picture?'replace-static':'add-static';renderActionOptions(false);if(picturePathInput.value)record.picture={src:picturePathInput.value,...(captionInput.value?{caption:captionInput.value}:{})};renderPicture();changed();});
 captionInput.addEventListener('input',()=>{if(record.picture)optional(record.picture,'caption',captionInput.value);renderPicture();changed();});
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
   const file=fileInput.files?.[0];if(!file)return;fileInfo=await validateBrowserImage(file);if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=URL.createObjectURL(file);picturePathInput.value=picturePath(domain,record,file.name);record.picture={src:picturePathInput.value,...(captionInput.value?{caption:captionInput.value}:{})};if(mediaAction==='replace-with-static')delete record.pictureSequence;renderPicture();changed();
  }catch(error){fileInput.value='';revokeLocal();status(notice,error.message,'error');renderPicture();}
 }
 fileInput.addEventListener('change',chooseFile);
 function renderPicture(){
  pictureInfo.replaceChildren();const sequenceMode=SEQUENCE_ACTIONS.has(mediaAction),existingSequence=Boolean(record.pictureSequence?.length),hasLocalSequence=sequenceInfos.length>0;
  fileInput.multiple=sequenceMode;fileInput.disabled=!(sequenceMode||STATIC_FILE_ACTIONS.has(mediaAction));picturePathInput.readOnly=sequenceMode||(mediaAction==='keep'&&existingSequence);
  const src=mediaAction==='remove-picture'?null:hasLocalSequence?sequenceUrls.at(-1):previewUrl||((record.picture?.src&&knownPaths(ctx).has(record.picture.src))?ctx.asset(record.picture.src):null);
  if(src){const activate=(hasLocalSequence||existingSequence)&&mediaAction!=='remove-sequence-keep-picture'&&mediaAction!=='replace-with-static'?()=>openSequenceViewer(hasLocalSequence?sequenceUrls:record.pictureSequence.map(ctx.asset),record.name||'Picture',captionInput.value):()=>openViewer(src,record.name||'Picture',captionInput.value);pictureInfo.append(picture(src,record.name||'Picture',captionInput.value,activate));}
  if(fileInfo)pictureInfo.append(text('p',`${fileInfo.name} · ${fileInfo.width} × ${fileInfo.height} · ${fileInfo.bytes.toLocaleString()} bytes`,'hint'));
  if(sequenceInfos.length)pictureInfo.append(text('p',`${sequenceInfos.length} pictures selected`,'hint'),text('p',`First frame: ${sequenceInfos[0].name}`,'hint'),text('p',`Representative picture: ${sequenceInfos.at(-1).name}`,'hint'));
  else if(existingSequence&&mediaAction!=='remove-sequence-keep-picture'&&mediaAction!=='replace-with-static')pictureInfo.append(text('p',`${record.pictureSequence.length} pictures in current sequence`,'hint'));
  if(mediaAction==='remove-picture')pictureInfo.append(text('p','The picture and any sequence reference will be removed; source bytes are not deleted.','hint'));
  if(mediaAction==='remove-sequence-keep-picture')pictureInfo.append(text('p','The sequence reference will be removed; the representative picture will remain. Source bytes are not deleted.','hint'));
  if(domain==='kb'&&record.type!=='knot'&&record.pictureSequence)pictureInfo.append(text('p','This entry still has a step-by-step sequence. Replace it with a single picture, keep only its representative picture, or remove the picture before preparing changes.','notice warning'));
  const fileLabel=sequenceMode?'Choose local pictures':'Choose a local picture';
  pictureHost.replaceChildren(field('Picture action',pictureSelect),pictureInfo,field(fileLabel,fileInput,sequenceMode?'Select the complete sequence; files must be named step-01, step-02, ... and manually uploaded to the repository.':'File must be manually uploaded to repository'),field('Repository picture path',picturePathInput),field('Caption (optional)',captionInput));
 }
 renderActionOptions(false);renderPicture();
 form.insertBefore(section('Picture',pictureHost),nameField.nextElementSibling.nextElementSibling);

 const textArea=el('textarea',{rows:14,class:'markdown-editor',value:body,spellcheck:true});textArea.addEventListener('input',()=>{body=textArea.value;changed();});
 const preview=el('div',{class:'markdown-preview',hidden:true});let showPreview=false;
 const previewButton=button('Preview Markdown',()=>{
  try{const {maps,routes}=editorMaps(ctx,domain,record);const owner=record[key]||narrativePath(domain,record);const parsed=parseMarkdown(body,{owner,maps,assetBase:ctx.base,exists:knownPaths(ctx),pathRoutes:routes,allowMissing:true});const unresolved=parsed.references.filter(r=>r.local&&!knownPaths(ctx).has(r.local));if(unresolved.length)throw new Error('Upload referenced local files first: '+unresolved.map(r=>r.local).join(', '));preview.innerHTML=sanitizeHtml(parsed.html,window);showPreview=!showPreview;preview.hidden=!showPreview;textArea.hidden=showPreview;previewButton.textContent=showPreview?'Edit Markdown':'Preview Markdown';status(notice,'Markdown preview is local and has not been saved.','info');}catch(error){status(notice,error.message,'error');}
 });
 form.append(section('Notes',field('Markdown',textArea),previewButton,preview));
 const prepareButton=button('Prepare Changes',()=>form.requestSubmit(),{variant:'primary'});
 form.addEventListener('submit',async event=>{
  event.preventDefault();try{
   if(!ID_PATTERN.test(record.id))throw new Error('The ID must use lowercase letters, numbers and hyphens.');
   const existing=ctx.data[domain][DOMAIN[domain].array];if(!editing&&existing.some(x=>x.id===record.id))throw new Error('This ID already exists.');
   const candidate=clone(record),sequenceSet=SEQUENCE_ACTIONS.has(mediaAction);
   if(domain==='gear'){candidate.specifications=(candidate.specifications||[]).map(x=>{const item={value:x.value.trim()};if(x.label?.trim())item.label=x.label.trim();return item;});candidate.links=(candidate.links||[]).map(x=>({label:x.label.trim(),url:x.url.trim()}));}
   if(sequenceSet){if(sequenceInfos.length<2)throw new Error('Select the complete step-by-step sequence before preparing changes.');recalcSequencePaths();candidate.pictureSequence=sequenceInfos.map(x=>x.path);candidate.picture={src:candidate.pictureSequence.at(-1),...(captionInput.value.trim()?{caption:captionInput.value.trim()}:{})};}
   if(mediaAction==='remove-picture'){delete candidate.picture;delete candidate.pictureSequence;}
   if(mediaAction==='remove-sequence-keep-picture'){delete candidate.pictureSequence;if(candidate.picture)optional(candidate.picture,'caption',captionInput.value);}
   if(STATIC_FILE_ACTIONS.has(mediaAction)){
    if(mediaAction==='replace-with-static'&&!fileInfo)throw new Error('Select the replacement single picture before preparing changes.');
    candidate.picture={src:safePath(picturePathInput.value),...(captionInput.value.trim()?{caption:captionInput.value.trim()}:{})};if(mediaAction==='replace-with-static')delete candidate.pictureSequence;
   }
   if(mediaAction==='keep'&&candidate.picture)optional(candidate.picture,'caption',captionInput.value);
   if(candidate.pictureSequence&&candidate.type!=='knot')throw new Error('Step-by-step sequences are Knot-only. Resolve the sequence before changing this entry to another Type.');
   if(!editing){if(body)candidate[key]=narrativePath(domain,candidate);else delete candidate[key];}
   if(domain==='kb'&&!body.trim())throw new Error('Knowledge Base Notes are required.');
   const result=editorMaps(ctx,domain,candidate);validateRecord(candidate,domain,ctx.data);
   const owner=candidate[key]||narrativePath(domain,candidate),parsed=parseMarkdown(body,{owner,maps:result.maps,assetBase:ctx.base,exists:knownPaths(ctx),pathRoutes:result.routes});void parsed;
   if(candidate.picture&&!knownPaths(ctx).has(candidate.picture.src)&&!fileInfo&&!sequenceSet)throw new Error('The picture is not in this release. Select its local file before preparing or upload the original to the repository first.');
   if(fileInfo&&candidate.picture.src!==picturePath(domain,candidate,fileInfo.name))throw new Error('The selected file must use its proposed repository path.');
   if(fileInfo&&knownPaths(ctx).has(candidate.picture.src)){const existingFile=knownFiles(ctx).get(candidate.picture.src);if(existingFile.sha256!==fileInfo.sha256&&!['replace-static','replace-with-static'].includes(mediaAction))throw new Error('A different file already exists at this path. Use an explicit replacement.');}
   if(sequenceSet){for(const info of sequenceInfos){const existingFile=knownFiles(ctx).get(info.path);if(existingFile&&existingFile.sha256!==info.sha256&&mediaAction==='add-sequence')throw new Error(`A different file already exists at ${info.path}. Use an explicit replacement.`);}}
   let pictureAction='keep';if(mediaAction==='remove-picture')pictureAction=baseRecord?.picture?'remove':'keep';else if(sequenceSet||STATIC_FILE_ACTIONS.has(mediaAction))pictureAction=editing&&baseRecord?.picture?'replace':'add';else if(editing&&!equal(baseRecord.picture,candidate.picture))pictureAction=candidate.picture?'replace':'remove';
   let pictureSequenceAction='keep';if(sequenceSet)pictureSequenceAction='set';else if(editing&&baseRecord?.pictureSequence&&!candidate.pictureSequence)pictureSequenceAction='remove';
   prepared=await prepareChange({domain,operation:editing?'edit':'add',id:candidate.id,baseRecord,record:candidate,baseText,text:body,sourceRevision:ctx.release.sourceRevision,notesPath:candidate[key]||narrativePath(domain,candidate),baseFileHash:baseHash,pictureAction,picturePath:candidate.picture?.src,pictureFile:sequenceSet?null:fileInfo,pictureSequenceAction,pictureSequencePaths:candidate.pictureSequence,pictureSequenceFiles:sequenceSet?sequenceInfos.map(x=>({path:x.path,bytes:x.bytes,sha256:x.sha256})):undefined});
   const copyNotice=el('div',{'aria-live':'polite',class:'copy-notice'}),json=JSON.stringify(prepared,null,2),clipboardText='Fishing Companion change package: Please implement the JSON change package below in the ginosega/fishing repository. Restore and read current main and its project instructions, validate and apply only these requested changes, carry them through one feature PR, CI, merge, production deployment and hosted verification, then reconcile project records. This is an instruction to perform the repository work, not merely explain the JSON.\n\n'+json,area=el('textarea',{rows:12,readonly:true,class:'package-text',value:clipboardText}),exit=button('Exit',onExit);exit.hidden=true;
   const upload=sequenceSet?[text('p','Upload the selected originals to:','hint'),el('code',{},sequenceFolder(candidate)+'/'),el('p',{},el('a',{href:linkToSequenceUpload(sequenceFolder(candidate)),target:'_blank',rel:'noopener noreferrer'},'Open the repository upload folder'))]:fileInfo?[text('p','Upload the selected original to the repository path before promotion:','hint'),el('code',{},candidate.picture.src),el('p',{},el('a',{href:linkToUpload(candidate.picture.src),target:'_blank',rel:'noopener noreferrer'},'Open the repository upload folder'))]:[];
   output.replaceChildren(text('h3','Prepared change package'),text('p','Copy this instruction and change package into the Fishing project chat. Preparing is not saving.','hint'),area,copyNotice,toolbar(button('Copy Changes',async()=>{try{const copying=prepared;await navigator.clipboard.writeText(clipboardText);if(prepared!==copying||!output.contains(area))return;exit.hidden=false;status(copyNotice,'Changes copied to clipboard. Paste them into the Fishing project chat for implementation and deployment.','success');}catch{area.focus();area.select();status(copyNotice,'Clipboard unavailable. Select and copy the package manually, then paste it into the Fishing project chat for implementation and deployment.','warning');}},{variant:'primary'}),button('Select text',()=>{area.focus();area.select();}),exit),...upload);
   status(notice,'Package prepared. Nothing has been saved.','success');onPrepared?.(prepared);output.scrollIntoView({block:'nearest'});
  }catch(error){status(notice,error.message,'error');}
 });
 const actions=toolbar(prepareButton,button('Cancel',onBack));form.append(actions);host.append(notice,form,output);
 return {element:host,isDirty:dirty,dispose:()=>{revokeLocal();},record};
}