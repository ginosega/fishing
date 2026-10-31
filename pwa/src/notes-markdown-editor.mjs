// Shared owner-facing Notes editor. No upload or publishing occurs here:
// selected original bytes stay in memory until the guarded Save and Publish.
import {el,button,field,status} from './dom.mjs';
import {categoryFolder,ID_PATTERN,safePath} from './shared.mjs';
import {validateBrowserImage} from './image-validation.mjs';
import {parseMarkdown,sanitizeHtml} from './markdown.mjs';
import {notesLinkTargets,findNotesLinkTargets,notesLinkMarkdown} from './notes-link.mjs';

export function noteImagePath(domain,record,filename){
 if(!ID_PATTERN.test(record?.id??''))throw Error('Complete the item fields to generate an ID before inserting an image.');
 const root=domain==='catches'?'Catches':
  categoryFolder(domain,domain==='gear'?record.category:record.type);
 return safePath(root+'/assets/'+record.id+'/notes/'+filename);
}
export function noteImageReference(path){
 const at=path.indexOf('/assets/');
 if(at<0)throw Error('Invalid Notes image path');
 return '../'+path.slice(at+1).split('/').map(part=>
  encodeURIComponent(part).replace(/[()]/g,ch=>'%'+ch.charCodeAt(0).toString(16).toUpperCase())
 ).join('/');
}
export function viewerMarkdownTitle(enabled,caption=''){
 if(!enabled)return '';
 const safe=caption.trim().replace(/[\r\n"\\]/g,' ');
 return ' "'+(safe?'viewer: '+safe:'viewer')+'"';
}
export function notesImageMarkdown(path,alt,{viewer=false,caption=''}={}){
 const name=alt.trim().replace(/[\r\n\[\]\\]/g,' ');
 if(!name)throw Error('Image alternative text is required.');
 return '!['+name+']('+noteImageReference(path)+viewerMarkdownTitle(viewer,caption)+')';
}
export function createNotesMarkdownEditor({
 domain,getRecord,value='',label='Markdown',onChange=()=>{},previewOptions,
 knownPaths=()=>new Set(),allowUpload=false,linkMaps=()=>previewOptions().maps,
}={}){
 if(!['gear','kb','catches'].includes(domain)||typeof getRecord!=='function'||
  typeof previewOptions!=='function')throw Error('Invalid Markdown editor configuration');
 const staged=new Map(),previews=new Set();
 const outer=el('div',{class:'notes-editor'});
 const toolbar=el('div',{class:'notes-toolbar'});
 const input=el('textarea',{rows:14,class:'markdown-editor',spellcheck:true,value});
 const view=el('div',{class:'markdown-preview markdown-body',hidden:true});
 const editorField=field(label,input);
 const message=el('div',{class:'notes-editor-message','aria-live':'polite'});
 const details=el('div',{class:'notes-image-panel',hidden:true});
 const linkPanel=el('div',{class:'notes-link-panel',hidden:true});
 const choose=el('input',{type:'file',accept:'.jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif'});
 const alt=el('input',{type:'text',maxlength:160,placeholder:'Describe this image'});
 const viewer=el('input',{type:'checkbox'});
 const caption=el('input',{type:'text',maxlength:160,placeholder:'Caption (optional)'});
 const captionField=field('Picture Viewer caption (optional)',caption);
 const previewThumb=el('div',{class:'notes-image-thumb'});
 const imageMessage=el('div',{'aria-live':'polite'});
 let candidate=null,expanded=false,showPreview=false,selection=[0,0];
 function changed(){onChange(input.value);}
 input.addEventListener('input',changed);
 const previewButton=button('Preview Markdown',()=>{
  if(showPreview){showPreview=false;view.hidden=true;editorField.hidden=false;input.hidden=false;previewButton.textContent='Preview Markdown';input.focus();return;}
  try{
   const options=previewOptions(),exists=new Set([...knownPaths(),...staged.keys()]);
   const parsed=parseMarkdown(input.value,{...options,exists,allowMissing:false,viewerImages:true});
   view.innerHTML=sanitizeHtml(parsed.html,window);
   const images=[...view.querySelectorAll('img')];
   const refs=parsed.references.filter(x=>x.isImage);
   images.forEach((image,i)=>{
    const item=staged.get(refs[i]?.local);
    if(item)image.src=item.url;
   });
   showPreview=true;view.hidden=false;editorField.hidden=true;input.hidden=true;
   previewButton.textContent='Edit Markdown';
   status(message,'Markdown preview is local and has not been saved.','info');
  }catch(error){status(message,error.message,'error');}
 });
 const expandButton=button('Expand',()=>setExpanded(!expanded));
 function setExpanded(value){
  expanded=value;outer.classList.toggle('expanded',expanded);
  expandButton.textContent=expanded?'Exit full page':'Expand';
  expandButton.setAttribute('aria-expanded',String(expanded));
  if(!showPreview)input.focus();
 }
 const onKey=event=>{if(event.key==='Escape'&&expanded){setExpanded(false);event.preventDefault();}};
 document.addEventListener('keydown',onKey);
 function insertAtCursor(markdown){
  const a=Math.max(0,Math.min(selection[0],input.value.length));
  const b=Math.max(a,Math.min(selection[1],input.value.length));
  input.value=input.value.slice(0,a)+markdown+input.value.slice(b);
  input.setSelectionRange(a+markdown.length,a+markdown.length);
  selection=[a+markdown.length,a+markdown.length];changed();input.focus();
 }
 input.addEventListener('select',()=>{selection=[input.selectionStart,input.selectionEnd];});
 input.addEventListener('keyup',()=>{selection=[input.selectionStart,input.selectionEnd];});
 input.addEventListener('click',()=>{selection=[input.selectionStart,input.selectionEnd];});
 // Links are inserted as Markdown, never published independently.
 // Search deliberately enumerates Gear, KB and four site navigation pages,
 // but does not enumerate any Catch records (manual catches://ID still works).
 const linkKindName='notes-link-type-'+Math.random().toString(36).slice(2);
 const linkSiteRadio=el('input',{type:'radio',name:linkKindName,value:'site',checked:true});
 const linkExternalRadio=el('input',{type:'radio',name:linkKindName,value:'external'});
 const linkLabel=el('input',{type:'text',maxlength:500,placeholder:'Text displayed to readers'});
 const linkSearch=el('input',{type:'search',placeholder:'Search pages by title'});
 const linkFilter=el('select',{},
  el('option',{value:'all'},'All pages'),
  el('option',{value:'Gear'},'Gear'),
  el('option',{value:'Knowledge Base'},'Knowledge Base'),
  el('option',{value:'Navigation'},'Navigation'));
 const linkList=el('select',{size:7,'aria-label':'Link to page'});
 const linkUrl=el('input',{type:'url',placeholder:'https://example.com/manual'});
 const linkSiteFields=el('div',{class:'notes-link-site'},
  field('Search site pages',linkSearch),field('Page category',linkFilter),
  field('Link to page',linkList));
 const linkExternalFields=el('div',{class:'notes-link-external',hidden:true},
  field('Destination URL',linkUrl));
 const linkMessage=el('div',{'aria-live':'polite'});
 let linkChoices=[],linkLabelCustom=false;
 function selectedLinkTarget(){
  return linkChoices.find(t=>t.uri===linkList.value);
 }
 function renderLinkChoices(){
  const saved=linkList.value;
  linkChoices=findNotesLinkTargets(notesLinkTargets(linkMaps()),{
   query:linkSearch.value,group:linkFilter.value});
  linkList.replaceChildren(...(linkChoices.length?
   linkChoices.map(t=>el('option',{value:t.uri},t.group+' · '+t.title)):
   [el('option',{value:''},'No matching pages')]));
  if(linkChoices.some(t=>t.uri===saved))linkList.value=saved;
  else if(linkChoices.length)linkList.value=linkChoices[0].uri;
  if(!linkLabelCustom)linkLabel.value=selectedLinkTarget()?.title||'';
 }
 linkSearch.addEventListener('input',renderLinkChoices);
 linkFilter.addEventListener('change',renderLinkChoices);
 linkList.addEventListener('change',()=>{
  if(!linkLabelCustom)linkLabel.value=selectedLinkTarget()?.title||'';
 });
 linkLabel.addEventListener('input',()=>{linkLabelCustom=true;});
 function renderLinkKind(){
  linkSiteFields.hidden=!linkSiteRadio.checked;
  linkExternalFields.hidden=linkSiteRadio.checked;
  if(!linkLabelCustom)linkLabel.value=linkSiteRadio.checked?
   selectedLinkTarget()?.title||'':'External link';
 }
 linkSiteRadio.addEventListener('change',renderLinkKind);
 linkExternalRadio.addEventListener('change',renderLinkKind);
 function closeLink(){
  linkPanel.hidden=true;linkMessage.replaceChildren();
 }
 const linkButton=button('Insert link',()=>{
  if(showPreview)previewButton.click();
  closeImage();
  selection=[input.selectionStart,input.selectionEnd];
  const highlighted=input.value.slice(...selection).trim();
  linkLabelCustom=Boolean(highlighted);
  linkLabel.value=highlighted;
  linkSearch.value='';linkFilter.value='all';linkSiteRadio.checked=true;
  linkExternalRadio.checked=false;linkUrl.value='';
  renderLinkKind();renderLinkChoices();
  linkPanel.hidden=false;
  linkPanel.scrollIntoView({block:'nearest'});
  if(highlighted)linkLabel.focus();else linkSearch.focus();
 });
 const confirmLink=button('Insert into Notes',()=>{
  try{
   const target=linkSiteRadio.checked?selectedLinkTarget()?.uri:linkUrl.value;
   const markdown=notesLinkMarkdown(linkLabel.value,target,linkMaps());
   insertAtCursor(markdown);
   closeLink();
  }catch(error){status(linkMessage,error.message,'error');}
 });
 linkPanel.append(el('h3',{},'Insert link'),
  el('fieldset',{class:'notes-link-kind'},
   el('legend',{},'Destination'),
   el('label',{},linkSiteRadio,' Site page'),
   el('label',{},linkExternalRadio,' External URL')),
  field('Link text',linkLabel),linkSiteFields,linkExternalFields,
  linkMessage,el('div',{class:'notes-image-actions'},
   button('Cancel',closeLink),confirmLink));
 function closeImage(){
  details.hidden=true;candidate=null;choose.value='';imageMessage.replaceChildren();
  previewThumb.replaceChildren();
 }
 const imageButton=button('Insert image',()=>{
  if(showPreview)previewButton.click();
  closeLink();
  selection=[input.selectionStart,input.selectionEnd];
  details.hidden=false;details.scrollIntoView({block:'nearest'});
 });
 imageButton.hidden=!allowUpload;
 viewer.addEventListener('change',()=>{captionField.hidden=!viewer.checked;});
 captionField.hidden=true;
 choose.addEventListener('change',async()=>{
  candidate=null;previewThumb.replaceChildren();imageMessage.replaceChildren();
  const file=choose.files?.[0];if(!file)return;
  try{
   const info=await validateBrowserImage(file);
   candidate={file,info};
   const url=URL.createObjectURL(file);previews.add(url);
   previewThumb.append(el('img',{src:url,alt:'Selected picture preview'}),
    el('p',{},info.name+' · '+info.width+' × '+info.height));
   alt.value=file.name.replace(/\.[^.]+$/,'').replace(/[-_]+/g,' ');
  }catch(error){status(imageMessage,error.message,'error');}
 });
 const insert=button('Insert into Notes',()=>{
  if(!candidate){status(imageMessage,'Choose a supported image first.','error');return;}
  try{
   const record=getRecord(),existing=new Set([...knownPaths(),...staged.keys()]);
   const name=candidate.file.name,dot=name.lastIndexOf('.');
   const stem=name.slice(0,dot),ext=name.slice(dot);
   let path=noteImagePath(domain,record,name),suffix=2;
   while(existing.has(path)){path=noteImagePath(domain,record,stem+'-'+suffix+ext);suffix++;}
   const url=URL.createObjectURL(candidate.file);previews.add(url);
   const markdown=notesImageMarkdown(path,alt.value,{viewer:viewer.checked,caption:caption.value});
   staged.set(path,{path,file:candidate.file,url,bytes:candidate.info.bytes,sha256:candidate.info.sha256});
   insertAtCursor(markdown);
   closeImage();
  }catch(error){status(imageMessage,error.message,'error');}
 });
 details.append(el('h3',{},'Insert image'),field('Choose image',choose),
  previewThumb,field('Alternative text (required)',alt),
  el('label',{class:'notes-viewer-checkbox'},viewer,' Enable Picture Viewer'),
  captionField,imageMessage,el('div',{class:'notes-image-actions'},
   button('Cancel',closeImage),insert));
 toolbar.append(linkButton,imageButton,previewButton,expandButton);
 outer.append(toolbar,editorField,view,linkPanel,details,message);
 function syncPaths(){
  const record=getRecord();
  if(!ID_PATTERN.test(record?.id??''))return;
  for(const [old,item] of [...staged]){
   const next=noteImagePath(domain,record,old.split('/').at(-1));
   if(next===old)continue;
   if(staged.has(next)||knownPaths().has(next))throw Error('Notes image filename conflict after changing the item ID.');
   input.value=input.value.split(noteImageReference(old)).join(noteImageReference(next));
   staged.delete(old);item.path=next;staged.set(next,item);
  }
  changed();
 }
 function getUploads(){
  const body=input.value;
  return [...staged.values()].filter(item=>body.includes(noteImageReference(item.path)))
   .map(({path,file,bytes,sha256})=>({path,file,bytes,sha256}));
 }
 return {element:outer,textarea:input,value:()=>input.value,uploads:getUploads,syncPaths,
  dispose:()=>{document.removeEventListener('keydown',onKey);
   for(const url of previews)URL.revokeObjectURL(url);},
 };
}
