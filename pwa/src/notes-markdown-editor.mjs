// Shared owner-facing Notes editor. No upload or publishing occurs here:
// selected original bytes stay in memory until the guarded Save and Publish.
import {el,button,field,status} from './dom.mjs';
import {categoryFolder,ID_PATTERN,safePath} from './shared.mjs';
import {validateBrowserImage} from './image-validation.mjs';
import {parseMarkdown,sanitizeHtml} from './markdown.mjs';
import {notesLinkTargets,findNotesLinkTargets,notesLinkMarkdown} from './notes-link.mjs';

export function noteImagePath(domain,record,filename){
 if(!ID_PATTERN.test(record?.id??'')){
  if(domain==='catches')
   throw Error('Complete the Catch details so its ID is generated before inserting an image.');
  if(!record?.name?.trim())
   throw Error('Enter a Name above first. The generated item ID is required to store the image.');
  throw Error('The item ID is not yet valid. Check the Name field before inserting an image.');
 }
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
// Resolve saved private originals from the already verified source inventory.
// Newly staged originals use their in-memory object URLs; a missing/foreign
// source is never substituted with a public V2 release URL.
export function notesPreviewSource(reference,{staged,knownPaths,resolveSavedAsset}={}){
 if(reference?.isImage!==true||reference.kind!=='local'||
    typeof reference.local!=='string')return null;
 const local=staged?.get(reference.local);
 if(local?.url)return local.url;
 if(!knownPaths?.has(reference.local)||typeof resolveSavedAsset!=='function')
  return null;
 const url=resolveSavedAsset(reference.local);
 if(typeof url!=='string')return null;
 let parsed;
 try{parsed=new URL(url);}catch{return null;}
 if(parsed.username||parsed.password||
    parsed.protocol!=='https:'&&!(parsed.protocol==='http:'&&
      ['localhost','127.0.0.1','[::1]'].includes(parsed.hostname)))
  return null;
 return url;
}

/* V3 shared toolbar icons; button text remains available via aria-label/title. */
function notesToolbarIcon(kind){
 const ns='http://www.w3.org/2000/svg';
 const svg=document.createElementNS(ns,'svg');
 for(const [key,val] of Object.entries({viewBox:'0 0 24 24',width:22,height:22,
  fill:'none',stroke:'currentColor','stroke-width':1.8,
  'stroke-linecap':'round','stroke-linejoin':'round',
  'aria-hidden':'true',focusable:'false'}))svg.setAttribute(key,String(val));
 function shape(tag,attrs){
  const node=document.createElementNS(ns,tag);
  for(const [key,val] of Object.entries(attrs))node.setAttribute(key,String(val));
  svg.append(node);
 }
 if(kind==='image'){
  shape('rect',{x:2.5,y:3,width:19,height:18,rx:2.5});
  shape('path',{d:'M4 18l5.5-7 3.5 4 2.2-2.7L20 18H4Z',
   fill:'#6ca6e8',stroke:'none'});
  shape('circle',{cx:16.7,cy:8,r:2.1,fill:'#e9b66d',stroke:'none'});
 }else{
  const paths={
   link:'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
   expand:'M8 3H3v5 M3 3l6 6 M16 3h5v5 M21 3l-6 6 M3 16v5h5 M3 21l6-6 M21 16v5h-5 M21 21l-6-6',
   restore:'M3 9h6V3 M9 9L3 3 M21 9h-6V3 M15 9l6-6 M3 15h6v6 M9 15l-6 6 M21 15h-6v6 M15 15l6 6',
  };
  if(!Object.hasOwn(paths,kind))throw Error('Invalid Notes toolbar icon');
  shape('path',{d:paths[kind]});
 }
 return svg;
}
function setNotesToolbarIcon(control,kind,label){
 control.classList.add('notes-icon-button');
 control.replaceChildren(notesToolbarIcon(kind));
 control.setAttribute('aria-label',label);
 control.setAttribute('title',label);
}

export function createNotesMarkdownEditor({
 domain,getRecord,value='',label='Markdown',onChange=()=>{},previewOptions,
 knownPaths=()=>new Set(),allowUpload=false,linkMaps=()=>previewOptions().maps,
 resolveSavedAsset=null,
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
 const previewButton=button('Preview',()=>{
  if(showPreview){showPreview=false;view.hidden=true;editorField.hidden=false;input.hidden=false;previewButton.textContent='Preview';syncInsertionButtons();input.focus();return;}
  try{
   const options=previewOptions(),exists=new Set([...knownPaths(),...staged.keys()]);
   const parsed=parseMarkdown(input.value,{...options,exists,allowMissing:false,viewerImages:true});
   view.innerHTML=sanitizeHtml(parsed.html,window);
   const images=[...view.querySelectorAll('img')];
   const refs=parsed.references.filter(x=>x.isImage);
   // Do not rebind images unless sanitized DOM still matches the exact
   // parser references in order. Never infer assets from alt text.
   if(images.length!==refs.length)throw Error('Markdown image preview mismatch.');
   const verifiedPaths=knownPaths();
   images.forEach((image,i)=>{
    const ref=refs[i];
    const actual=new URL(image.getAttribute('src')||'',document.baseURI).href;
    if(actual!==new URL(ref.target).href)
     throw Error('Markdown image preview mismatch.');
    const source=notesPreviewSource(ref,{staged,knownPaths:verifiedPaths,
     resolveSavedAsset});
    if(source)image.src=source;
   });
   showPreview=true;view.hidden=false;editorField.hidden=true;input.hidden=true;
   previewButton.textContent='Edit';
   // Preview is read-only: insertion controls cannot exit it implicitly.
   syncInsertionButtons();closeLink();closeImage();
   status(message,'Markdown preview is local and has not been saved.','info');
  }catch(error){status(message,error.message,'error');}
 });
 const expandButton=button('Expand',()=>setExpanded(!expanded));
 setNotesToolbarIcon(expandButton,'expand','Expand editor');
 expandButton.setAttribute('aria-expanded','false');
 function setExpanded(value){
  expanded=value;outer.classList.toggle('expanded',expanded);
  setNotesToolbarIcon(expandButton,expanded?'restore':'expand',
   expanded?'Exit full-page editor':'Expand editor');
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
  if(showPreview)return;
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
 setNotesToolbarIcon(linkButton,'link','Insert Link');
 const confirmLink=button('Insert',()=>{
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
  if(showPreview)return;
  closeLink();
  selection=[input.selectionStart,input.selectionEnd];
  details.hidden=false;details.scrollIntoView({block:'nearest'});
 });
 setNotesToolbarIcon(imageButton,'image','Insert Image');
 imageButton.hidden=!allowUpload;
 function syncInsertionButtons(){
  linkButton.disabled=showPreview;
  imageButton.disabled=showPreview;
 }
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
 const insert=button('Insert',()=>{
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
