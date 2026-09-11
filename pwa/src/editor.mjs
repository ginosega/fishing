import {el,text,button,field,input,select,section,toolbar,status,picture} from './dom.mjs';
import {DOMAIN,GEAR_CATEGORIES,KB_TYPES,ROD_TYPES,EQUIPMENT_TYPES,ID_PATTERN,categoryFolder,safePath,encodedPath,newId,suggestedFilename,sha256,validateSemantics} from './shared.mjs';
import {TAXONOMY,validateRecord,validateRecords} from './validation.mjs';
import {parseMarkdown,sanitizeHtml,markdownRouteMap} from './markdown.mjs';
import {prepareChange,narrativePath,picturePath,equal} from './handoff.mjs';
import {openViewer} from './viewer.mjs';
import {validateBrowserImage} from './image-validation.mjs';

const clone=value=>structuredClone(value);
function serialize(record){return JSON.stringify(record);}
function optional(record,key,value){if(value.trim())record[key]=value.trim();else delete record[key];}
function knownFiles(ctx){const prefix=`releases/${ctx.release.id}/content/`;return new Map(ctx.manifest.files.filter(x=>x.path.startsWith(prefix)).map(x=>[x.path.slice(prefix.length),x]));}
function knownPaths(ctx){return new Set(knownFiles(ctx).keys());}
function editorMaps(ctx,domain,record){const data=clone(ctx.data),key=DOMAIN[domain].array;data[domain][key]=data[domain][key].filter(x=>x.id!==record.id).concat(record);return {data,maps:validateRecords(data),routes:markdownRouteMap(data)};}
function linkToUpload(path){const dir=path.split('/').slice(0,-1).map(encodeURIComponent).join('/');return `https://github.com/ginosega/fishing/tree/main/${dir}`;}
export async function createEditor(ctx,{domain,baseRecord=null,category=null,type=null,onBack,onExit,onPrepared,onDirty}){
 const editing=Boolean(baseRecord),key=domain==='gear'?'notes':'content',record=baseRecord?clone(baseRecord):{id:'',name:'',...(domain==='gear'?{category:category||'lures',type:'',specifications:[],links:[]}:{type:type||'technique',content:''})};
 if(!editing&&domain==='gear')record.type=(record.category==='rods-reels'?ROD_TYPES:record.category==='accessories'?EQUIPMENT_TYPES:TAXONOMY[record.category])[0];
 let baseText='',body='',baseHash=null,idTouched=false,pictureAction='keep',fileInfo=null,previewUrl=null,prepared=null;
 if(baseRecord?.[key]){const response=await fetch(ctx.asset(baseRecord[key]));if(!response.ok)throw new Error(`Cannot read original Markdown: ${response.status}`);const bytes=new Uint8Array(await response.arrayBuffer());baseText=new TextDecoder('utf-8',{fatal:true}).decode(bytes);body=baseText;baseHash=await sha256(bytes);}
 if(!editing&&domain==='kb')body='';
 const host=el('div',{class:'editor'}),notice=el('div',{class:'editor-notice','aria-live':'polite'}),form=el('form',{class:'editor-form'}),output=el('div',{class:'handoff-output'});
 const original=serialize(record);const initialBody=body;
 const dirty=()=>serialize(record)!==original||body!==initialBody||pictureAction!=='keep';
 function changed(){prepared=null;output.replaceChildren();onDirty?.(dirty());}
 function update(fieldName,value){optional(record,fieldName,value);changed();}
 function control(label,value,change,options={}){const c=input(value,options);c.addEventListener('input',()=>change(c.value));return field(label,c,options.hint||'');}
 function requiredControl(label,keyName,options={}){const c=input(record[keyName]||'',{required:true,maxlength:160,...options});c.addEventListener('input',()=>{record[keyName]=c.value;if(keyName==='name'&&!editing&&!idTouched){record.id=newId(c.value,new Set(ctx.data[domain][DOMAIN[domain].array].map(x=>x.id)));idInput.value=record.id;}changed();});return field(label,c);}
 const idInput=input(record.id,{required:true,maxlength:160,readonly:editing});idInput.addEventListener('input',()=>{idTouched=true;record.id=idInput.value;changed();});
 const nameField=requiredControl('Name','name');
 form.append(nameField,field('ID',idInput));
 const categoryControls=el('div',{class:'form-grid'});
 if(domain==='gear'){
  const categorySelect=select(GEAR_CATEGORIES.map(r=>[r[0],r[1]]),record.category,()=>{record.category=categorySelect.value;const choices=typesFor(record.category);if(!choices.includes(record.type))record.type=choices[0];typeSelect.replaceChildren(...choices.map(x=>el('option',{value:x},x)));typeSelect.value=record.type;changed();});
  const typesFor=c=>c==='rods-reels'?ROD_TYPES:c==='accessories'?EQUIPMENT_TYPES:TAXONOMY[c];
  const typeSelect=select(typesFor(record.category),record.type,()=>{record.type=typeSelect.value;changed();});
  categoryControls.append(field('Category',categorySelect),field('Type',typeSelect));
  form.append(categoryControls,el('div',{class:'form-grid'},control('Manufacturer',record.manufacturer||'',value=>update('manufacturer',value),{maxlength:120}),control('Model',record.model||'',value=>update('model',value),{maxlength:160})));
  function repeater(title,keyName,fields){
   const holder=el('div',{class:'repeater'}),rows=el('div',{});
   function renderRows(){rows.replaceChildren(...(record[keyName]||[]).map((item,index)=>{
    const row=el('div',{class:'repeat-row'});
    for(const [fieldName,label] of fields){const c=input(item[fieldName]||'',{maxlength:fieldName==='url'?2000:500,placeholder:label});c.addEventListener('input',()=>{item[fieldName]=c.value;changed();});c.setAttribute('aria-label',label);row.append(c);}
    const actions=toolbar(button('↑',()=>move(index,-1),{disabled:index===0,title:'Move up'}),button('↓',()=>move(index,1),{disabled:index===record[keyName].length-1,title:'Move down'}),button('Remove',()=>{record[keyName].splice(index,1);renderRows();changed();},{variant:'danger'}));row.append(actions);return row;
   }));}
   function move(index,delta){const array=record[keyName];[array[index],array[index+delta]]=[array[index+delta],array[index]];renderRows();changed();}
   holder.append(text('h3',title),rows,button('Add '+(keyName==='links'?'link':'specification'),()=>{record[keyName].push(Object.fromEntries(fields.map(([k])=>[k,''])));renderRows();changed();}));renderRows();return holder;
  }
  form.append(repeater('Specifications','specifications',[['label','Label (optional)'],['value','Value']]),repeater('Links','links',[['label','Label'],['url','URL']]));
 }else{
  const typeSelect=select(KB_TYPES.map(r=>[r[0],r[1]]),record.type,()=>{record.type=typeSelect.value;changed();});
  form.append(field('Type',typeSelect),control('Description',record.description||'',value=>update('description',value),{maxlength:80,hint:'Optional, maximum 80 characters.'}));
 }
 const pictureHost=el('div',{class:'picture-editor'}),pictureInfo=el('div',{}),fileInput=el('input',{type:'file',accept:'.jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif'}),picturePathInput=input(record.picture?.src||'',{placeholder:'Repository-relative picture path'}),captionInput=input(record.picture?.caption||'',{maxlength:1000}),pictureSelect=select(['keep','add','replace','remove'],pictureAction,()=>{pictureAction=pictureSelect.value;if(pictureAction==='keep'||pictureAction==='remove'){fileInfo=null;if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null;}}renderPicture();changed();});
 picturePathInput.addEventListener('input',()=>{fileInfo=null;if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null;}if(pictureAction==='keep')pictureAction=record.picture?'replace':'add';pictureSelect.value=pictureAction;if(picturePathInput.value)record.picture={src:picturePathInput.value,...(captionInput.value?{caption:captionInput.value}:{})};changed();});
 captionInput.addEventListener('input',()=>{if(pictureAction==='keep')pictureAction=record.picture?'replace':'add';pictureSelect.value=pictureAction;if(record.picture)optional(record.picture,'caption',captionInput.value);changed();});
 async function chooseFile(){
  const file=fileInput.files?.[0];if(!file)return;
  try{
   fileInfo=await validateBrowserImage(file);
   if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=URL.createObjectURL(file);
   pictureAction=record.picture?'replace':'add';pictureSelect.value=pictureAction;
   picturePathInput.value=picturePath(domain,record,file.name);record.picture={src:picturePathInput.value,...(captionInput.value?{caption:captionInput.value}:{})};renderPicture();changed();
  }catch(error){fileInput.value='';fileInfo=null;status(notice,error.message,'error');}
 }
 fileInput.addEventListener('change',chooseFile);
 function renderPicture(){
  pictureInfo.replaceChildren();
  const src=pictureAction==='remove'?null:previewUrl||((record.picture?.src&&knownPaths(ctx).has(record.picture.src))?ctx.asset(record.picture.src):null);
  if(src)pictureInfo.append(picture(src,record.name||'Picture',captionInput.value,()=>openViewer(src,record.name||'Picture',captionInput.value)));
  if(fileInfo)pictureInfo.append(text('p',`${fileInfo.name} · ${fileInfo.width} × ${fileInfo.height} · ${fileInfo.bytes.toLocaleString()} bytes`,'hint'));
  if(pictureAction==='remove')pictureInfo.append(text('p','The picture reference will be removed; source bytes are not deleted.','hint'));
 }
 pictureHost.append(field('Picture action',pictureSelect),pictureInfo,field('Choose a local picture',fileInput,'File must be manually uploaded to repository'),field('Repository picture path',picturePathInput),field('Caption (optional)',captionInput));renderPicture();
 form.insertBefore(section('Picture',pictureHost),nameField.nextElementSibling.nextElementSibling);
 const textArea=el('textarea',{rows:14,class:'markdown-editor',value:body,spellcheck:true});textArea.addEventListener('input',()=>{body=textArea.value;changed();});
 const preview=el('div',{class:'markdown-preview',hidden:true});let showPreview=false;
 const previewButton=button('Preview Markdown',()=>{
  try{const {maps,routes}=editorMaps(ctx,domain,record);const owner=record[key]||narrativePath(domain,record);const parsed=parseMarkdown(body,{owner,maps,assetBase:ctx.base,exists:knownPaths(ctx),pathRoutes:routes,allowMissing:true});
   const unresolved=parsed.references.filter(r=>r.local&&!knownPaths(ctx).has(r.local));if(unresolved.length)throw new Error('Upload referenced local files first: '+unresolved.map(r=>r.local).join(', '));
   preview.innerHTML=sanitizeHtml(parsed.html,window);showPreview=!showPreview;preview.hidden=!showPreview;textArea.hidden=showPreview;previewButton.textContent=showPreview?'Edit Markdown':'Preview Markdown';status(notice,'Markdown preview is local and has not been saved.','info');
  }catch(error){status(notice,error.message,'error');}
 });
 form.append(section('Notes',field('Markdown',textArea),previewButton,preview));
 const prepareButton=button('Prepare Changes',()=>form.requestSubmit(),{variant:'primary'});
 form.addEventListener('submit',async event=>{
  event.preventDefault();try{
   if(!ID_PATTERN.test(record.id))throw new Error('The ID must use lowercase letters, numbers and hyphens.');
   const existing=ctx.data[domain][DOMAIN[domain].array];if(!editing&&existing.some(x=>x.id===record.id))throw new Error('This ID already exists.');
   const candidate=clone(record);
   if(domain==='gear'){
    candidate.specifications=(candidate.specifications||[]).map(x=>{const item={value:x.value.trim()};if(x.label?.trim())item.label=x.label.trim();return item;});
    candidate.links=(candidate.links||[]).map(x=>({label:x.label.trim(),url:x.url.trim()}));
   }
   if(pictureAction==='remove')delete candidate.picture;
   if(['add','replace'].includes(pictureAction)){candidate.picture={src:safePath(picturePathInput.value),...(captionInput.value.trim()?{caption:captionInput.value.trim()}:{})};}
   if(!editing){if(body)candidate[key]=narrativePath(domain,candidate);else delete candidate[key];}
   if(domain==='kb'&&!body.trim())throw new Error('Knowledge Base Notes are required.');
   const result=editorMaps(ctx,domain,candidate);validateRecord(candidate,domain,ctx.data);
   const owner=candidate[key]||narrativePath(domain,candidate);
   const parsed=parseMarkdown(body,{owner,maps:result.maps,assetBase:ctx.base,exists:knownPaths(ctx),pathRoutes:result.routes});
   if(pictureAction==='keep'&&editing)candidate.picture=clone(baseRecord.picture);
   if(candidate.picture&&!knownPaths(ctx).has(candidate.picture.src)&&!fileInfo)throw new Error('The picture is not in this release. Select its local file before preparing or upload the original to the repository first.');
   if(fileInfo&&candidate.picture.src!==picturePath(domain,candidate,fileInfo.name))throw new Error('The selected file must use its proposed repository path.');
   if(fileInfo&&knownPaths(ctx).has(candidate.picture.src)){
    const existingFile=knownFiles(ctx).get(candidate.picture.src);if(existingFile.sha256!==fileInfo.sha256&&pictureAction!=='replace')throw new Error('A different file already exists at this path. Use an explicit replacement.');
   }
   prepared=await prepareChange({domain,operation:editing?'edit':'add',id:candidate.id,baseRecord,record:candidate,baseText,text:body,sourceRevision:ctx.release.sourceRevision,notesPath:candidate[key]||narrativePath(domain,candidate),baseFileHash:baseHash,pictureAction,picturePath:candidate.picture?.src,pictureFile:fileInfo});
   const copyNotice=el('div',{'aria-live':'polite',class:'copy-notice'});
   const json=JSON.stringify(prepared,null,2),clipboardText='Fishing Companion change package: Please implement the JSON change package below in the ginosega/fishing repository. Restore and read current main and its project instructions, validate and apply only these requested changes, carry them through one feature PR, CI, merge, production deployment and hosted verification, then reconcile project records. This is an instruction to perform the repository work, not merely explain the JSON.\n\n'+json,area=el('textarea',{rows:12,readonly:true,class:'package-text',value:clipboardText});
   const exit=button('Exit',onExit);exit.hidden=true;
   output.replaceChildren(text('h3','Prepared change package'),text('p','Copy this instruction and change package into the Fishing project chat. Preparing is not saving.','hint'),area,copyNotice,toolbar(button('Copy Changes',async()=>{try{const copying=prepared;await navigator.clipboard.writeText(clipboardText);if(prepared!==copying||!output.contains(area))return;exit.hidden=false;status(copyNotice,'Changes copied to clipboard. Paste them into the Fishing project chat for implementation and deployment.','success');}catch{area.focus();area.select();status(copyNotice,'Clipboard unavailable. Select and copy the package manually, then paste it into the Fishing project chat for implementation and deployment.','warning');}},{variant:'primary'}),button('Select text',()=>{area.focus();area.select();}),exit),...(fileInfo?[text('p','Upload the selected original to the repository path before promotion:','hint'),el('code',{},candidate.picture.src),el('p',{},el('a',{href:linkToUpload(candidate.picture.src),target:'_blank',rel:'noopener noreferrer'},'Open the repository upload folder'))]:[]));
   status(notice,'Package prepared. Nothing has been saved.','success');onPrepared?.(prepared);output.scrollIntoView({block:'nearest'});
  }catch(error){status(notice,error.message,'error');}
 });
 const actions=toolbar(prepareButton,button('Cancel',onBack));form.append(actions);
 host.append(notice,form,output);
 return {element:host,isDirty:dirty,dispose:()=>{if(previewUrl)URL.revokeObjectURL(previewUrl);},record};
}
