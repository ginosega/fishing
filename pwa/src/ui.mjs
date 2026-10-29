import {el,text,button,link,field,input,select,empty,status,picture,section,toolbar,table} from './dom.mjs';
import {DOMAIN,GEAR_CATEGORIES,KB_TYPES,ROD_TYPES,sortGear,sortNames,sortCatches,catchHistory,parseRoute,routeFor,encodedPath} from './shared.mjs';
import {TAXONOMY} from './validation.mjs';
import {parseMarkdown,sanitizeHtml,markdownRouteMap} from './markdown.mjs';
import {createEditor} from './editor.mjs';
import {createCatchEditor} from './catch-editor.mjs';
import {openViewer,openSequenceViewer} from './viewer.mjs';
import {createOffline} from './offline.mjs';
import {createD3ConnectionController,mountD3ConnectionPanel} from './v3-connection.mjs';

const KAYAK_ICON=`<svg viewBox="0 0 64 64" role="img" aria-label="Kayak">
  <defs><linearGradient id="kayakHull" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#a2def7"/><stop offset="1" stop-color="#76c8ef"/></linearGradient></defs>
  <g transform="rotate(-35 32 32)" stroke-linecap="round" stroke-linejoin="round">
    <path d="M32 3 C40 9 43 20 43 32 C43 46 38 56 32 61 C26 56 21 46 21 32 C21 20 24 9 32 3Z" fill="url(#kayakHull)" stroke="#2f8fc0" stroke-width="2"/>
    <path d="M32 5 C27 12 25 20 25 32 M32 5 C37 12 39 20 39 32" fill="none" stroke="#e5f6fd" stroke-width=".8" opacity=".8"/>
    <path d="M25 15 39 19 M25 19 39 15 M24 45 40 49 M24 49 40 45" fill="none" stroke="#367da3" stroke-width="1.2"/>
    <ellipse cx="32" cy="32" rx="8.5" ry="12" fill="#233b4e" stroke="#377fa4" stroke-width="1.6"/>
    <ellipse cx="32" cy="32" rx="5.2" ry="7.5" fill="#344d60"/>
    <path d="M27 27 Q32 24 37 27 M27 37 Q32 40 37 37" fill="none" stroke="#6d8998" stroke-width="1.2"/>
    <path d="M8 32H56" stroke="#555e63" stroke-width="2.8"/>
    <path d="M8 29 3 25 Q1 32 3 39 L8 35Z" fill="#a9afb2" stroke="#737b80" stroke-width="1.2"/>
    <path d="M56 29 61 25 Q63 32 61 39 L56 35Z" fill="#a9afb2" stroke="#737b80" stroke-width="1.2"/>
  </g>
</svg>`;
const ROOT_SUBTITLES={gear:'Browse your inventory of equipment, tackle, and bait',kb:'Fishing reference library'};
const KB_PINNED_FIRST={knot:'line-tackle-knot-reference'};
const CATEGORY_PRESENTATION={gear:{'rods-reels':{icon:'🎣'},line:{icon:'〰️'},weights:{icon:'⚓'},'snaps-swivels':{icon:'🔗'},hooks:{icon:'🪝'},lures:{icon:'🐟'},bait:{icon:'🪱'},accessories:{icon:'🛶',svg:KAYAK_ICON}},kb:{location:{icon:'📍',description:'Waters, access, seasonal patterns, and local observations'},species:{icon:'🐟',description:'Fish identification, behavior, habitat, and targeting notes'},equipment:{icon:'🧰',description:'Equipment, rig, and presentation reference'},technique:{icon:'🧭',description:'Strategy, conditions, and species reference'},knot:{icon:'🪢',description:'Connection guidance, cautions, and learning resources'}}};
const categoryLabel=(domain,key)=>(domain==='gear'?GEAR_CATEGORIES:KB_TYPES).find(x=>x[0]===key)?.[1]||key;
const categoryRoute=(domain,key)=>domain==='gear'?`#/inventory/category/${key}`:`#/kb/category/${key}`;
const rootRoute=domain=>domain==='gear'?'#/inventory':domain==='kb'?'#/kb':'#/catches';
const recordTitle=(ctx,domain,record)=>domain==='catches'?`${ctx.maps.kb.get(record.speciesId)?.name||record.speciesName||'Catch'} · ${record.date}`:record.name;
export function createApp(ctx){
 const root=document.getElementById('app'),alertHost=document.getElementById('app-notice'),offlineHost=document.getElementById('offline-status');
 const routes=markdownRouteMap(ctx.data),exists=ctx.v3?.source?.files instanceof Set?
  new Set(ctx.v3.source.files):
  new Set(ctx.manifest.files.filter(x=>x.path.startsWith(`releases/${ctx.release.id}/content/`)).map(x=>x.path.slice(`releases/${ctx.release.id}/content/`.length)));
 let currentHash=location.hash||'#/',route=parseRoute(currentHash),editor=null,serial=0,offline=null,approvedNavigation=null,previousHash=null;
 // V2 stays unchanged. V3 owner controls are strictly opt-in via an
 // authenticated, same-origin integration; server authorization is still
 // mandatory for every actual write, regardless of client-side visibility.
 const v3Mode=ctx.v3?.enabled===true;
 const privatePilot=v3Mode&&[
  '/__d3_pilot__/','/fishing/__d3_pilot__/',
 ].includes(location.pathname);
 if(v3Mode)ctx.v3.authorized=false; // do not trust stale browser state
 const canAuthor=()=>!v3Mode||(ctx.v3?.authorized===true&&typeof ctx.v3?.publish==='function');
 function notify(message,kind='info'){status(alertHost,message,kind);}
 function dirty(){return Boolean(editor?.isDirty());}
 function canLeave(){return !dirty()||confirm('Your changes have not been saved. Discard this edit and leave?');}
 function disposeEditor(){editor?.dispose?.();editor=null;}
 function navigate(hash){if(hash===currentHash){if(!dirty())render();return;}if(!canLeave())return;disposeEditor();approvedNavigation=hash;location.hash=hash;}
 function anchor(label,href,cls=''){const a=link(label,href,cls);if(href.startsWith('#/'))a.addEventListener('click',event=>{event.preventDefault();navigate(href);});return a;}
 function copyLink(domain,id){const uri=domain+'://'+id;const full=new URL(routeFor(domain,id),ctx.root).href;const box=el('div',{class:'copy-dialog'},text('p','Internal link'),el('code',{},uri),text('p','Shareable browser URL'),el('code',{},full),toolbar(button('Copy internal link',()=>copy(uri)),button('Copy browser URL',()=>copy(full))));const dialog=el('dialog',{class:'small-dialog','aria-label':'Create Link'},box,button('Close',()=>dialog.close()));dialog.addEventListener('close',()=>dialog.remove());document.body.append(dialog);dialog.showModal();}
 async function copy(value){try{await navigator.clipboard.writeText(value);notify('Copied to clipboard.','success');}catch{const area=el('textarea',{readonly:true,value});alertHost.replaceChildren(text('p','Select and copy this text:'),area);area.focus();area.select();}}
 function frame(title,parent,actions=[],subtitle=''){const header=el('div',{class:'page-header'},el('div',{class:'page-heading'},text('h1',title),subtitle?text('p',subtitle,'page-subtitle'):null),el('div',{class:'page-actions'},...actions,parent?button('Back',()=>navigate(parent)):null));return el('div',{class:'page'},header);}
 function card(title,description,href,icon='',image=null){return el('a',{href,class:'nav-card',onclick:event=>{event.preventDefault();navigate(href);}},image||(icon?el('span',{class:'card-icon','aria-hidden':'true'},icon):el('span',{class:'card-thumbnail card-spacer','aria-hidden':'true'})),el('div',{},text('h2',title),description?text('p',description,'muted'):null));}
 function recordCard(domain,record){const href=routeFor(domain,record.id),pictureSrc=record.picture?.src||(domain==='catches'?ctx.maps.kb.get(record.speciesId)?.picture?.src:null),image=pictureSrc?ctx.thumbnail(pictureSrc):null;const item=card(domain==='catches'?(ctx.maps.kb.get(record.speciesId)?.name||record.speciesName||'Catch'):recordTitle(ctx,domain,record),domain==='gear'?record.type:domain==='kb'?record.description||'':record.size||'',href,'',image?el('img',{src:image,alt:'',loading:'lazy',decoding:'async',class:'card-thumbnail',onerror:event=>{event.target.hidden=true;}}):null);if(domain==='catches')item.querySelector('h2').after(el('time',{class:'catch-date muted',datetime:record.date},record.date));return item;}
 function renderHome(){const page=frame('Fishing Companion',null);page.append(text('p','Fishing reference and catch log','lead'),el('div',{class:'nav-grid home-grid'},card('My Gear',ROOT_SUBTITLES.gear,'#/inventory','🎒'),card('Knowledge Base',ROOT_SUBTITLES.kb,'#/kb','📚'),card('Catch Log','Recorded catches','#/catches','🐟')));return page;}
 function listControls(domain,records,{search=false,filter=false,sort='name',title='',pinnedId=''}={}){
  const controls=el('div',{class:'list-controls'}),results=el('div',{class:'record-grid'}),count=text('p','','result-count');let query='',type='';
  if(search){const searchInput=input('',{type:'search',placeholder:'Search '+title});searchInput.addEventListener('input',()=>{query=searchInput.value.toLocaleLowerCase();draw();});searchInput.setAttribute('aria-label','Search');controls.append(searchInput);}
  const types=[...new Set(records.map(r=>r.type))].sort();
  if(filter&&records.length>9&&types.length>1){const filterSelect=select([['','All Types'],...types.map(x=>[x,x])],'',()=>{type=filterSelect.value;draw();});filterSelect.setAttribute('aria-label','Type');controls.append(filterSelect);}
  function draw(){let items=records.filter(r=>(!type||r.type===type)&&(!query||[r.name,r.type,r.description,r.manufacturer,r.model].filter(Boolean).join(' ').toLocaleLowerCase().includes(query)));items=sort==='gear'?sortGear(items):sortNames(items);if(pinnedId){const index=items.findIndex(r=>r.id===pinnedId);if(index>0)items.unshift(...items.splice(index,1));}count.textContent=items.length===records.length?'':`${items.length} matching ${items.length===1?'item':'items'}`;results.replaceChildren(...(items.length?items.map(r=>recordCard(domain,r)):[empty('No matching entries.')]));}
  draw();return {controls,element:el('div',{},count,results)};
 }
 function renderRoot(domain){const gear=domain==='gear',rows=gear?GEAR_CATEGORIES:KB_TYPES,all=ctx.data[domain][DOMAIN[domain].array];const page=frame(gear?'My Gear':'Knowledge Base','#/',[],ROOT_SUBTITLES[domain]);
  const searchInput=input('',{type:'search',placeholder:'Search '+(gear?'My Gear':'Knowledge Base')});const searchResults=el('div',{class:'record-grid',hidden:true});const categories=el('div',{class:'nav-grid'},...rows.map(([key,label])=>{const meta=CATEGORY_PRESENTATION[domain][key];const item=card(label,meta.description||'',categoryRoute(domain,key),meta.icon);if(meta.svg)item.querySelector('.card-icon').innerHTML=meta.svg;return item;}));
  searchInput.addEventListener('input',()=>{const q=searchInput.value.trim().toLocaleLowerCase();searchResults.hidden=!q;categories.hidden=Boolean(q);if(!q){searchResults.replaceChildren();return;}const matches=all.filter(r=>[r.name,r.type,r.description,r.manufacturer,r.model].filter(Boolean).join(' ').toLocaleLowerCase().includes(q));searchResults.replaceChildren(...(matches.length?sortNames(matches).map(r=>recordCard(domain,r)):[empty('No matching entries.')]));});
  searchInput.setAttribute('aria-label','Search '+(gear?'My Gear':'Knowledge Base'));page.querySelector('.page-actions').prepend(searchInput);page.append(categories,searchResults,...(canAuthor()?[anchor(gear?'Add Gear':'Add Entry',gear?'#/inventory/add/lures':'#/kb/add/technique','page-edit-link')]:[]));return page;
 }
 function renderList(domain,key){const gear=domain==='gear',rows=gear?GEAR_CATEGORIES:KB_TYPES;const definition=rows.find(x=>x[0]===key);if(!definition)return missing('Unknown category',rootRoute(domain));
  const records=ctx.data[domain][DOMAIN[domain].array].filter(r=>(gear?r.category:r.type)===key);
  const page=frame(definition[1],rootRoute(domain));
  if(!gear&&key==='equipment')page.append(text('p','Equipment, rig, and presentation reference','muted'));
  if(!gear&&key==='technique')page.append(text('p','Strategy, conditions, and species reference','muted'));
  const list=listControls(domain,records,{title:definition[1],search:gear?key==='lures':key==='equipment',filter:gear,sort:gear?'gear':'name',pinnedId:gear?'':KB_PINNED_FIRST[key]||''});page.querySelector('.page-actions').prepend(...list.controls.children);page.append(list.element,...(canAuthor()?[anchor(gear?'Add Gear':'Add Entry',gear?`#/inventory/add/${key}`:`#/kb/add/${key}`,'page-edit-link')]:[]));return page;
 }
 function missing(message,parent='#/'){const page=frame('Not found',parent);page.append(empty(message),anchor('Return to the parent page',parent));return page;}
 function appendPicture(page,record,domain){const pic=record.picture;if(!pic)return;const src=ctx.asset(pic.src),caption=pic.caption||'';const activate=record.pictureSequence?.length?()=>openSequenceViewer(record.pictureSequence.map(ctx.asset),record.name,caption):()=>openViewer(src,record.name,caption);page.append(picture(src,pic.caption||record.name,caption,activate));}
 async function markdownContent(owner,textValue){const parsed=parseMarkdown(textValue,{owner,maps:ctx.maps,assetBase:ctx.base,exists,pathRoutes:routes});const article=el('article',{class:'markdown-body'});article.innerHTML=sanitizeHtml(parsed.html,window);article.addEventListener('click',event=>{const a=event.target.closest('a[href^="#/"]');if(a){event.preventDefault();navigate(a.getAttribute('href'));}});return article;}
 async function appendMarkdown(page,pathValue,heading){
  if(!pathValue)return;
  let content;
  if(ctx.v3?.source?.markdown instanceof Map){
   // The test-only editor must never mix public V2 Markdown with the
   // private sandbox's immutable record/sourceRevision.
   if(!ctx.v3.source.markdown.has(pathValue))
    throw new Error('Sandbox Markdown is unavailable: '+pathValue);
   content=ctx.v3.source.markdown.get(pathValue);
  }else{
   const response=await fetch(ctx.asset(pathValue));
   if(!response.ok)
    throw new Error(`Cannot load ${pathValue}: HTTP ${response.status}`);
   content=await response.text();
  }
  page.append(section(heading,await markdownContent(pathValue,content)));
 }
 function historySection(domain,record){const catches=catchHistory(ctx.data,domain,record.id);if(!catches.length)return null;return section('Catch History',el('div',{class:'record-grid'},...catches.map(c=>recordCard('catches',c))));}
 async function renderDetail(domain,id){const record=ctx.maps[domain].get(id);if(!record)return missing('This item does not exist or its ID has been retired.',rootRoute(domain));
  const parent=domain==='catches'?'#/catches':categoryRoute(domain,domain==='gear'?record.category:record.type),page=frame(recordTitle(ctx,domain,record),parent,[],domain==='gear'?categoryLabel(domain,record.category)+' – '+record.type:domain==='kb'?record.description||'':'');
  if(domain==='catches'){
   const species=ctx.maps.kb.get(record.speciesId),location=ctx.maps.kb.get(record.locationId),lure=ctx.maps.gear.get(record.lureOrBaitId);
   if(species?.picture)appendPicture(page,{...species,name:species.name},'kb');
   page.append(table([['Date',record.date],...(record.time?[['Time',record.time]]:[]),...(record.size?[['Size',record.size]]:[]),...(species?[['Species',anchor(species.name,routeFor('kb',species.id))]]:record.speciesName?[['Species',record.speciesName]]:[]),...(location?[['Location',anchor(location.name,routeFor('kb',location.id))]]:record.locationName?[['Location',record.locationName]]:[]),...(lure?[['Lure or bait',anchor(lure.name,routeFor('gear',lure.id))]]:record.lureOrBaitName?[['Lure or bait',record.lureOrBaitName]]:[])]));
   await appendMarkdown(page,record.notes,'Notes');return page;
  }
  appendPicture(page,record,domain);
  if(domain==='gear'){
   const details=[...(record.manufacturer?[['Manufacturer',record.manufacturer]]:[]),...(record.model?[['Model',record.model]]:[]),...(record.specifications||[]).map(s=>[s.label||'Specification',s.value])];
   if(details.length)page.append(section('Specifications',table(details)));
   if(record.links?.length)page.append(section('Links',el('div',{class:'links-list'},...record.links.map(l=>el('a',{href:l.url,target:'_blank',rel:'noopener noreferrer'},l.label,' ↗')))));
   await appendMarkdown(page,record.notes,'Notes');
  }else{
   await appendMarkdown(page,record.content,'Notes');
  }
  const history=historySection(domain,record);if(history)page.append(history);if(canAuthor()&&(domain!=='catches'||v3Mode))page.append(anchor('Edit item',domain==='gear'?`#/inventory/edit/${record.id}`:domain==='kb'?`#/kb/edit/${record.id}`:`#/catches/edit/${record.id}`,'page-edit-link'));return page;
 }
 function renderCatches(){const page=frame('Recorded catches','#/');if(v3Mode&&canAuthor())page.querySelector('.page-actions').prepend(anchor('Add Catch','#/catches/add','page-edit-link'));page.append(el('div',{class:'record-grid'},...sortCatches(ctx.data.catches.catches).map(c=>recordCard('catches',c))));return page;}
 async function renderEditor(domain,id,category,type){if(!canAuthor())return missing('Owner sign-in is required to edit. Open Connection Status to sign in.',rootRoute(domain));const record=id?ctx.maps[domain].get(id):null;if(id&&!record)return missing('This item does not exist or its ID has been retired.',rootRoute(domain));const fallback=categoryRoute(domain,domain==='gear'?category:type);const origin=previousHash===rootRoute(domain)||previousHash===fallback?previousHash:fallback;const parent=record?routeFor(domain,record.id):fallback;const exitTarget=record?parent:origin;
  const page=frame(record?'Edit '+record.name:domain==='gear'?'Add Gear':'Add Entry',parent,record?[button('Create Link',()=>copyLink(domain,record.id))]:[]);const created=await createEditor(ctx,{domain,baseRecord:record,category,type,onBack:()=>navigate(parent),onExit:()=>{disposeEditor();navigate(exitTarget);},onDirty:()=>{},publishChange:v3Mode?ctx.v3.publish:null,onPrepared:v3Mode?(receipt)=>ctx.v3.onPublicationReceipt?.(receipt):null});editor=created;page.append(created.element);return page;
 }
 async function renderCatchEditor(id=null){
  if(!v3Mode||!canAuthor())return missing('Owner sign-in is required to edit Catches. Open Connection Status to sign in.','#/catches');
  const record=id?ctx.maps.catches.get(id):null;
  if(id&&!record)return missing('This Catch does not exist.','#/catches');
  const parent=record?routeFor('catches',record.id):'#/catches';
  const page=frame(record?'Edit Catch':'Add Catch',parent);
  const created=await createCatchEditor(ctx,{baseRecord:record,
   onBack:()=>navigate(parent),onExit:()=>{disposeEditor();navigate('#/catches');},
   onDirty:()=>{},publishChange:ctx.v3.publish,
   onPrepared:receipt=>ctx.v3.onPublicationReceipt?.(receipt),
  });editor=created;page.append(created.element);return page;
 }
 async function render(){const ticket=++serial;if(offline&&!(await offline.checkCurrent()))return;if(ticket!==serial)return;disposeEditor();route=parseRoute(currentHash);root.replaceChildren(el('div',{class:'loading'},'Loading…'));
  try{let page;
   switch(route.page){case 'home':page=renderHome();break;case 'gear-root':page=renderRoot('gear');break;case 'kb-root':page=renderRoot('kb');break;case 'gear-list':page=renderList('gear',route.category);break;case 'kb-list':page=renderList('kb',route.type);break;case 'gear-detail':page=await renderDetail('gear',route.id);break;case 'kb-detail':page=await renderDetail('kb',route.id);break;case 'catch-list':page=renderCatches();break;case 'catch-detail':page=await renderDetail('catches',route.id);break;case 'catch-add':page=await renderCatchEditor();break;case 'catch-edit':page=await renderCatchEditor(route.id);break;case 'gear-edit':page=await renderEditor('gear',route.id);break;case 'kb-edit':page=await renderEditor('kb',route.id);break;case 'gear-add':page=await renderEditor('gear',null,route.category);break;case 'kb-add':page=await renderEditor('kb',null,null,route.type);break;default:page=missing('The requested page is not available.');}
   if(ticket!==serial){if(editor&&ticket!==serial)disposeEditor();return;}root.replaceChildren(page);document.title=(page.querySelector('h1')?.textContent||'Fishing Companion')+' · Fishing Companion';
   if(route.section){requestAnimationFrame(()=>{const heading=[...page.querySelectorAll('[id]')].find(e=>e.id===route.section);heading?.scrollIntoView({block:'start'});});}
  }catch(error){if(ticket===serial){const page=missing('Unable to display this page: '+error.message);page.append(button('Retry',()=>render(),{variant:'primary'}));root.replaceChildren(page);}console.error(error);}
 }
 window.addEventListener('hashchange',()=>{const requested=location.hash||'#/';if(requested===currentHash)return;if(approvedNavigation!==requested&&!canLeave()){history.replaceState(null,'',currentHash);return;}disposeEditor();approvedNavigation=null;previousHash=currentHash;currentHash=requested;alertHost.replaceChildren();render();window.scrollTo(0,0);});
 window.addEventListener('beforeunload',event=>{if(dirty()){event.preventDefault();event.returnValue='';}});
 for(const a of document.querySelectorAll('[data-nav]'))a.addEventListener('click',event=>{event.preventDefault();navigate(a.getAttribute('href'));});
 offline=createOffline({root:ctx.root,releaseId:ctx.release.id,onlineOnly:privatePilot,onStatus:state=>{const needsUpdate=state.state==='Incomplete'&&Boolean(state.message);const label=state.state==='Ready'?(navigator.onLine?(state.releaseId===ctx.release.id?`Offline library ready · current · ${state.files||0} files`:`Offline library ready · update available · ${state.files||0} files`):`Offline library ready · ${state.files||0} files`):state.state==='Downloading'?`Preparing offline library · ${state.completed||0}/${state.files||'?'} files`:needsUpdate?'Offline library needs update':'Offline library not prepared';offlineHost.replaceChildren(text('span',label),...(state.message?[text('span',state.message,'hint')]:[]));offlineHost.dataset.state=state.state;offlineHost.dataset.releaseId=state.releaseId||'';document.getElementById('offline-reload').disabled=privatePilot||Boolean(state.updating)||state.state==='Downloading';document.getElementById('offline-update').disabled=privatePilot||Boolean(state.updating)||state.state==='Downloading'||!navigator.onLine;},isDirty:dirty,notify});
 globalThis.__FISHING_SHELL_CLEANUP__?.();
 const connection=document.getElementById('connection-status'),connectionDialog=document.getElementById('connection-dialog');
 const updateConnection=()=>{connection.dataset.online=String(navigator.onLine);document.getElementById('connection-network').textContent=navigator.onLine?'Online':'Offline';const current=offline.getStatus();document.getElementById('offline-update').disabled=privatePilot||Boolean(current?.state==='Downloading')||!navigator.onLine;};
 let ownerPanel=null;
 const ownerController=v3Mode&&ctx.v3?.auth&&ctx.v3?.lifecycle?
  createD3ConnectionController({
   auth:ctx.v3.auth,lifecycle:ctx.v3.lifecycle,
   enabled:()=>v3Mode,online:()=>navigator.onLine,
   onChange:state=>{
    const prior=ctx.v3.authorized;
    ctx.v3.authorized=state.authorized;
    ownerPanel?.paint();
    if(prior!==state.authorized){
     if(!dirty())void render();
     else notify('Owner session changed. Your unfinished edit is preserved.','warning');
    }
   },
  }):null;
 if(ownerController)ownerPanel=mountD3ConnectionPanel({
  dialog:connectionDialog,controller:ownerController,documentObject:document,
  online:()=>navigator.onLine,windowObject:window,
 });
 if(ownerController&&v3Mode){
  // A durable Accepted receipt should update Connection Status immediately,
  // even if the editor is subsequently closed or navigated away from.
  // The lifecycle retains only the operation ID, never package/credentials.
  ctx.v3.onPublicationReceipt=receipt=>{
   if(!/^p3_[0-9a-f-]{36}$/.test(receipt?.operationId??'')||
    receipt?.canonicalLive!==false)return;
   void ownerController.refreshPublication().then(
    ()=>ownerPanel?.paint(),()=>ownerPanel?.paint());
  };
 }
 const refreshOwner=async()=>{
  if(!ownerController)return;
  await ownerController.restore();
  if(ownerController.current().authorized)
   await ownerController.refreshPublication();
  ownerPanel?.paint();
 };
 connection.addEventListener('click',()=>{
  connectionDialog.showModal();
  if(ownerController)void refreshOwner();
 });document.getElementById('connection-close').addEventListener('click',()=>{
  ownerPanel?.suspend();connectionDialog.close();
 });window.addEventListener('online',updateConnection);window.addEventListener('offline',updateConnection);updateConnection();
 document.getElementById('offline-update').disabled=privatePilot||!navigator.onLine;
 document.getElementById('offline-update').addEventListener('click',()=>offline.update());document.getElementById('offline-reload').addEventListener('click',()=>offline.reload());
 const releaseDetails=document.getElementById('release-details');if(releaseDetails)releaseDetails.textContent=`Release ${ctx.release.id.slice(0,12)} · Source ${ctx.release.sourceRevision.slice(0,12)}${ctx.release.pendingMedia?' · Pending media preview':''}`;
 if(ctx.release.pendingMedia)notify('Preview only: some approved image replacements remain unresolved. This is not a production-cutover candidate.','warning');
 render();offline.start();
 if(ownerController)void refreshOwner();
 return {navigate,isDirty:dirty,render};
}
