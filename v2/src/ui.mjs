import {el,text,button,link,field,input,select,empty,status,picture,section,toolbar,table} from './dom.mjs';
import {DOMAIN,GEAR_CATEGORIES,KB_TYPES,ROD_TYPES,sortGear,sortNames,sortCatches,catchHistory,parseRoute,routeFor,encodedPath} from './shared.mjs';
import {TAXONOMY} from './validation.mjs';
import {parseMarkdown,sanitizeHtml,markdownRouteMap} from './markdown.mjs';
import {createEditor} from './editor.mjs';
import {openViewer} from './viewer.mjs';
import {createOffline} from './offline.mjs';

const categoryLabel=(domain,key)=>(domain==='gear'?GEAR_CATEGORIES:KB_TYPES).find(x=>x[0]===key)?.[1]||key;
const categoryRoute=(domain,key)=>domain==='gear'?`#/inventory/category/${key}`:`#/kb/category/${key}`;
const rootRoute=domain=>domain==='gear'?'#/inventory':domain==='kb'?'#/kb':'#/catches';
const recordTitle=(ctx,domain,record)=>domain==='catches'?`${ctx.maps.kb.get(record.speciesId)?.name||'Catch'} · ${record.date}`:record.name;
export function createApp(ctx){
 const root=document.getElementById('app'),alertHost=document.getElementById('app-notice'),offlineHost=document.getElementById('offline-status');
 const routes=markdownRouteMap(ctx.data),exists=new Set(ctx.manifest.files.filter(x=>x.path.startsWith(`releases/${ctx.release.id}/content/`)).map(x=>x.path.slice(`releases/${ctx.release.id}/content/`.length)));
 let currentHash=location.hash||'#/',route=parseRoute(currentHash),editor=null,serial=0,offline=null;
 function notify(message,kind='info'){status(alertHost,message,kind);}
 function dirty(){return Boolean(editor?.isDirty());}
 function canLeave(){return !dirty()||confirm('Your changes have not been saved. Discard this edit and leave?');}
 function disposeEditor(){editor?.dispose?.();editor=null;}
 function navigate(hash){if(hash===currentHash){if(!dirty())render();return;}if(!canLeave())return;location.hash=hash;}
 function anchor(label,href,cls=''){const a=link(label,href,cls);if(href.startsWith('#/'))a.addEventListener('click',event=>{event.preventDefault();navigate(href);});return a;}
 function copyLink(domain,id){const uri=domain+'://'+id;const full=new URL(routeFor(domain,id),ctx.root).href;const box=el('div',{class:'copy-dialog'},text('p','Stable internal link'),el('code',{},uri),text('p','Shareable browser URL'),el('code',{},full),toolbar(button('Copy stable link',()=>copy(uri)),button('Copy browser URL',()=>copy(full))));const dialog=el('dialog',{class:'small-dialog'},box,button('Close',()=>dialog.close()));dialog.addEventListener('close',()=>dialog.remove());document.body.append(dialog);dialog.showModal();}
 async function copy(value){try{await navigator.clipboard.writeText(value);notify('Copied to clipboard.','success');}catch{const area=el('textarea',{readonly:true,value});alertHost.replaceChildren(text('p','Select and copy this text:'),area);area.focus();area.select();}}
 function frame(title,parent,actions=[]){const header=el('div',{class:'page-header'},el('div',{},text('h1',title)),toolbar(...actions));return el('div',{class:'page'},parent?toolbar(button('← Back',()=>navigate(parent),{variant:'ghost'})):null,header);}
 function card(title,description,href,icon='↗',image=null){return el('a',{href,class:'nav-card',onclick:event=>{event.preventDefault();navigate(href);}},image||el('span',{class:'card-icon','aria-hidden':'true'},icon),el('div',{},text('h2',title),description?text('p',description,'muted'):null),el('span',{class:'card-arrow','aria-hidden':'true'},'→'));}
 function recordCard(domain,record){const href=routeFor(domain,record.id),src=record.picture?.src?ctx.asset(record.picture.src):domain==='catches'?ctx.maps.kb.get(record.speciesId)?.picture?.src:null;const image=typeof src==='string'&&src.startsWith('http')?src:src?ctx.asset(src):null;return card(recordTitle(ctx,domain,record),domain==='gear'?record.type:domain==='kb'?record.description||'':record.size||'',href,'↗',image?el('img',{src:image,alt:'',loading:'lazy',class:'card-thumbnail',onerror:event=>{event.target.hidden=true;}}):null);}
 function renderHome(){const page=frame('Fishing Companion',null);page.append(text('p','Fishing reference and catch log','lead'),el('div',{class:'nav-grid'},card('My Gear','Your rods, reels, tackle, and equipment.','#/inventory','🎣'),card('Knowledge Base','Locations, species, gear guides, techniques, and knots.','#/kb','📖'),card('Catch Log','Recorded catches.','#/catches','🐟')));return page;}
 function listControls(domain,records,{search=false,filter=false,sort='name'}={}){
  const controls=el('div',{class:'list-controls'}),results=el('div',{class:'record-grid'}),count=text('p','','result-count');let query='',type='';
  if(search){const searchInput=input('',{type:'search',placeholder:'Search '+(domain==='gear'?'gear':'Knowledge Base')});searchInput.addEventListener('input',()=>{query=searchInput.value.toLocaleLowerCase();draw();});controls.append(field('Search',searchInput));}
  const types=[...new Set(records.map(r=>r.type))].sort();
  if(filter&&records.length>9&&types.length>1){const filterSelect=select([['','All Types'],...types.map(x=>[x,x])],'',()=>{type=filterSelect.value;draw();});controls.append(field('Type',filterSelect));}
  function draw(){let items=records.filter(r=>(!type||r.type===type)&&(!query||[r.name,r.type,r.description,r.manufacturer,r.model].filter(Boolean).join(' ').toLocaleLowerCase().includes(query)));items=sort==='gear'?sortGear(items):sortNames(items);count.textContent=items.length===records.length?'':`${items.length} matching ${items.length===1?'item':'items'}`;results.replaceChildren(...(items.length?items.map(r=>recordCard(domain,r)):[empty('No matching entries.')]));}
  draw();return el('div',{},controls,count,results);
 }
 function renderRoot(domain){const gear=domain==='gear',rows=gear?GEAR_CATEGORIES:KB_TYPES,all=ctx.data[domain][DOMAIN[domain].array];const page=frame(gear?'My Gear':'Knowledge Base','#/');
  const searchInput=input('',{type:'search',placeholder:'Search all '+(gear?'gear':'Knowledge Base')});const searchResults=el('div',{class:'record-grid',hidden:true});const categories=el('div',{class:'nav-grid'},...rows.map(([key,label])=>card(label,'',categoryRoute(domain,key),gear?'▦':'◇')));
  searchInput.addEventListener('input',()=>{const q=searchInput.value.trim().toLocaleLowerCase();searchResults.hidden=!q;categories.hidden=Boolean(q);if(!q){searchResults.replaceChildren();return;}const matches=all.filter(r=>[r.name,r.type,r.description,r.manufacturer,r.model].filter(Boolean).join(' ').toLocaleLowerCase().includes(q));searchResults.replaceChildren(...(matches.length?sortNames(matches).map(r=>recordCard(domain,r)):[empty('No matching entries.')]));});
  page.append(field('Search all '+(gear?'gear':'Knowledge Base'),searchInput),categories,searchResults);return page;
 }
 function renderList(domain,key){const gear=domain==='gear',rows=gear?GEAR_CATEGORIES:KB_TYPES;const definition=rows.find(x=>x[0]===key);if(!definition)return missing('Unknown category',rootRoute(domain));
  const records=ctx.data[domain][DOMAIN[domain].array].filter(r=>(gear?r.category:r.type)===key);
  const page=frame(definition[1],rootRoute(domain),[button('Add '+(gear?'Gear':'Entry'),()=>navigate(gear?`#/inventory/add/${key}`:`#/kb/add/${key}`),{variant:'primary'})]);
  if(!gear&&key==='equipment')page.append(text('p','Equipment, rig, and presentation reference','muted'));
  if(!gear&&key==='technique')page.append(text('p','Strategy, conditions, and species reference','muted'));
  page.append(listControls(domain,records,{search:gear?key==='lures':key==='equipment',filter:gear,sort:gear?'gear':'name'}));return page;
 }
 function missing(message,parent='#/'){const page=frame('Not found',parent);page.append(empty(message),anchor('Return to the parent page',parent));return page;}
 function appendPicture(page,record,domain){const pic=record.picture;if(!pic){page.append(picture(null,record.name));return;}const src=ctx.asset(pic.src),caption=pic.caption||'';page.append(picture(src,pic.caption||record.name,caption,()=>openViewer(src,record.name,caption)));}
 async function markdownContent(owner,textValue){const parsed=parseMarkdown(textValue,{owner,maps:ctx.maps,assetBase:ctx.base,exists,pathRoutes:routes});const article=el('article',{class:'markdown-body'});article.innerHTML=sanitizeHtml(parsed.html,window);article.addEventListener('click',event=>{const a=event.target.closest('a[href^="#/"]');if(a){event.preventDefault();navigate(a.getAttribute('href'));}});return article;}
 async function appendMarkdown(page,pathValue,heading){if(!pathValue)return;const response=await fetch(ctx.asset(pathValue));if(!response.ok)throw new Error(`Cannot load ${pathValue}: HTTP ${response.status}`);const content=await response.text();page.append(section(heading,await markdownContent(pathValue,content)));}
 function historySection(domain,record){const catches=catchHistory(ctx.data,domain,record.id);if(!catches.length)return null;return section('Catch History',el('div',{class:'record-grid'},...catches.map(c=>recordCard('catches',c))));}
 function detailActions(domain,record){const actions=[button('Copy Link',()=>copyLink(domain,record.id),{variant:'secondary'})];if(domain!=='catches')actions.push(button('Edit',()=>navigate(domain==='gear'?`#/inventory/edit/${record.id}`:`#/kb/edit/${record.id}`),{variant:'primary'}));return actions;}
 async function renderDetail(domain,id){const record=ctx.maps[domain].get(id);if(!record)return missing('This item does not exist or its ID has been retired.',rootRoute(domain));
  const parent=domain==='catches'?'#/catches':categoryRoute(domain,domain==='gear'?record.category:record.type),page=frame(recordTitle(ctx,domain,record),parent,detailActions(domain,record));
  if(domain==='catches'){
   const species=ctx.maps.kb.get(record.speciesId),location=ctx.maps.kb.get(record.locationId),lure=ctx.maps.gear.get(record.lureOrBaitId);
   if(species?.picture)appendPicture(page,{...species,name:species.name},'kb');
   page.append(table([['Date',record.date],...(record.time?[['Time',record.time]]:[]),...(record.size?[['Size',record.size]]:[]),...(species?[['Species',anchor(species.name,routeFor('kb',species.id))]]:[]),...(location?[['Location',anchor(location.name,routeFor('kb',location.id))]]:[]),...(lure?[['Lure or bait',anchor(lure.name,routeFor('gear',lure.id))]]:[])]));
   await appendMarkdown(page,record.notes,'Notes');return page;
  }
  appendPicture(page,record,domain);
  if(domain==='gear'){
   page.append(text('p',record.type,'eyebrow'));
   const details=[...(record.manufacturer?[['Manufacturer',record.manufacturer]]:[]),...(record.model?[['Model',record.model]]:[]),...(record.specifications||[]).map(s=>[s.label||'Specification',s.value])];
   if(details.length)page.append(section('Specifications',table(details)));
   if(record.links?.length)page.append(section('Links',el('div',{class:'links-list'},...record.links.map(l=>el('a',{href:l.url,rel:'noopener noreferrer'},l.label,' ↗')))));
   await appendMarkdown(page,record.notes,'Notes');
  }else{
   if(record.description)page.append(text('p',record.description,'lead'));
   await appendMarkdown(page,record.content,'Content');
  }
  const history=historySection(domain,record);if(history)page.append(history);return page;
 }
 function renderCatches(){const page=frame('Catch Log','#/');page.append(text('p','Recorded catches','muted'),el('div',{class:'record-grid'},...sortCatches(ctx.data.catches.catches).map(c=>recordCard('catches',c))));return page;}
 async function renderEditor(domain,id,category,type){const record=id?ctx.maps[domain].get(id):null;if(id&&!record)return missing('This item does not exist or its ID has been retired.',rootRoute(domain));const parent=record?routeFor(domain,record.id):categoryRoute(domain,domain==='gear'?category:type);
  const page=frame(record?'Edit entry':'Add entry',parent);const created=await createEditor(ctx,{domain,baseRecord:record,category,type,onBack:()=>navigate(parent),onDirty:()=>{}});editor=created;page.append(created.element);return page;
 }
 async function render(){const ticket=++serial;disposeEditor();route=parseRoute(currentHash);root.replaceChildren(el('div',{class:'loading'},'Loading…'));
  try{let page;
   switch(route.page){case 'home':page=renderHome();break;case 'gear-root':page=renderRoot('gear');break;case 'kb-root':page=renderRoot('kb');break;case 'gear-list':page=renderList('gear',route.category);break;case 'kb-list':page=renderList('kb',route.type);break;case 'gear-detail':page=await renderDetail('gear',route.id);break;case 'kb-detail':page=await renderDetail('kb',route.id);break;case 'catch-list':page=renderCatches();break;case 'catch-detail':page=await renderDetail('catches',route.id);break;case 'gear-edit':page=await renderEditor('gear',route.id);break;case 'kb-edit':page=await renderEditor('kb',route.id);break;case 'gear-add':page=await renderEditor('gear',null,route.category);break;case 'kb-add':page=await renderEditor('kb',null,null,route.type);break;default:page=missing('The requested page is not available.');}
   if(ticket!==serial){if(editor&&ticket!==serial)disposeEditor();return;}root.replaceChildren(page);document.title=(page.querySelector('h1')?.textContent||'Fishing Companion')+' · Fishing Companion';
   if(route.section){requestAnimationFrame(()=>{const heading=[...page.querySelectorAll('[id]')].find(e=>e.id===route.section);heading?.scrollIntoView({block:'start'});});}
  }catch(error){if(ticket===serial){const page=missing('Unable to display this page: '+error.message);page.append(button('Retry',()=>render(),{variant:'primary'}));root.replaceChildren(page);}console.error(error);}
 }
 window.addEventListener('hashchange',()=>{const requested=location.hash||'#/';if(requested===currentHash)return;if(!canLeave()){history.replaceState(null,'',currentHash);return;}currentHash=requested;alertHost.replaceChildren();render();window.scrollTo(0,0);});
 window.addEventListener('beforeunload',event=>{if(dirty()){event.preventDefault();event.returnValue='';}});
 for(const a of document.querySelectorAll('[data-nav]'))a.addEventListener('click',event=>{event.preventDefault();navigate(a.getAttribute('href'));});
 offline=createOffline({root:ctx.root,releaseId:ctx.release.id,onStatus:state=>{const label=state.state==='Ready'?`Offline ready · ${state.files||0} files`:state.state==='Downloading'?`Downloading · ${state.completed||0}/${state.files||'?'} files`:'Offline incomplete';offlineHost.replaceChildren(text('span',label),state.message?text('span',state.message,'hint'):null);offlineHost.dataset.state=state.state;offlineHost.dataset.releaseId=state.releaseId||'';document.getElementById('offline-reload').disabled=state.state==='Downloading';},isDirty:dirty,notify});
 document.getElementById('offline-update').addEventListener('click',()=>offline.update());document.getElementById('offline-reload').addEventListener('click',()=>offline.reload());
 document.getElementById('release-details').textContent=`Release ${ctx.release.id.slice(0,12)} · Source ${ctx.release.sourceRevision.slice(0,12)}${ctx.release.pendingMedia?' · Pending media preview':''}`;
 if(ctx.release.pendingMedia)notify('Preview only: some approved image replacements remain unresolved. This is not a production-cutover candidate.','warning');
 render();offline.start();
 return {navigate,isDirty:dirty,render};
}
