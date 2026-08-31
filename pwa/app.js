const SOURCE_FILES = {
  gear: './kb/Fishing_Gear_Registry.md',
  tackle: './kb/Fishing_Tackle_Inventory.md',
  knots: './kb/Rods_Reels_Line_Knots.md',
  techniques: './kb/Fishing_Techniques.md',
  locations: './kb/Local_Waters_Locations.md',
  catches: './kb/Trip_Logs_Field_Observations.md'
};

const CATEGORY_META = {
  rods: { label: 'Rods', icon: '🪶' },
  reels: { label: 'Reels', icon: '⚙️' },
  line: { label: 'Line', icon: '〰️' },
  weights: { label: 'Weights', icon: '⚓' },
  'snaps-swivels': { label: 'Snaps & Swivels', icon: '🔗' },
  hooks: { label: 'Hooks', icon: '🪝' },
  lures: { label: 'Lures', icon: '🐟' },
  bait: { label: 'Bait', icon: '🪱' },
  knots: { label: 'Knots', icon: '🪢' }
};

const SPECIES = ['Largemouth bass','Smallmouth bass','Trout','Coastal cutthroat trout','Rainbow trout','Kokanee','Yellow perch','Northern pikeminnow','Panfish'];
const FISH_TERMS = ['largemouth bass','smallmouth bass','bass','coastal cutthroat trout','cutthroat trout','rainbow trout','trout','kokanee','yellow perch','perch','northern pikeminnow','pikeminnow','panfish','tiger muskie','bullhead'];
const STRUCTURE_TERMS = ['point','weed','dock','bench','flat','drop','drop-off','rock','rocky','shelf','shoreline','bank','cove','edge','riprap','break','structure','transition','channel','mouth','wood','cover','grass'];

const state = { docs:{}, sections:{}, tables:{}, inventory:[], catches:[], locations:[], techniques:[], setups:[], braidLeaderRows:[], connectionRows:[], currentPlan:null };
const app = document.querySelector('#app');
const homeButton = document.querySelector('#homeButton');
const statusDot = document.querySelector('#onlineStatus');
const dataStatus = document.querySelector('#dataStatus');

homeButton.addEventListener('click', () => navigate('#/home'));
window.addEventListener('hashchange', renderRoute);
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

boot().catch(error => {
  console.error(error);
  app.innerHTML = `<section class="panel error"><h2>Couldn’t load the fishing knowledge base</h2><p>${escapeHtml(error.message)}</p><p>The app needs the deployed <code>kb/</code> Markdown files at least once so they can be cached for offline use.</p></section>`;
});

async function boot() {
  updateOnlineStatus();
  await loadKnowledgeBase();
  buildModels();
  registerServiceWorker();
  dataStatus.textContent = `${state.inventory.length} owned gear/tackle/knot records loaded from GitHub Markdown.`;
  if (!location.hash) location.hash = '#/home';
  renderRoute();
}

async function loadKnowledgeBase() {
  const entries = await Promise.all(Object.entries(SOURCE_FILES).map(async ([key,url]) => {
    const response = await fetch(url, { cache:'no-cache' });
    if (!response.ok) throw new Error(`Failed to load ${url} (${response.status})`);
    return [key, await response.text()];
  }));
  state.docs = Object.fromEntries(entries);
  for (const [key,markdown] of Object.entries(state.docs)) {
    state.sections[key] = parseSections(markdown, key);
    state.tables[key] = parseTables(markdown, state.sections[key], key);
  }
}

function buildModels() {
  state.inventory = dedupeInventory([...buildGearInventory(), ...buildSetupGearInventory(), ...buildTackleInventory(), ...buildKnotInventory()]).map(item => ({...item, id:stableItemId(item)}));
  state.catches = buildCatchLog();
  state.locations = state.sections.locations.filter(s => s.level===2 && !/other local|regulation\/access/i.test(s.title)).map(s => ({name:s.title, markdown:s.content, text:cleanMarkdown(s.content), sourceSection:s.path.join(' › ')}));
  const parents = ['trout fishing','bass finesse techniques','bass power search techniques'];
  state.techniques = state.sections.techniques.filter(s => s.level===3 && parents.some(p => s.path.map(normalize).includes(p)) && !/todo/i.test(s.title)).map(s => ({name:s.title, markdown:s.content, text:cleanMarkdown(s.content), sourceSection:s.path.join(' › ')}));
  const setupNames = ['spinning setup','baitcasting setup','spincast shore trout setup'];
  state.setups = state.sections.knots.filter(s => s.level===3 && setupNames.includes(normalize(s.title))).map(s => ({name:s.title.replace(/—.*/, '').trim(), markdown:s.content, text:cleanMarkdown(s.content), tables:state.tables.knots.filter(t => t.startLine>=s.startLine && t.startLine<=s.endLine), sourceSection:s.path.join(' › ')}));
  state.braidLeaderRows = tableRowsInSection('knots','Braid-to-leader knots');
  state.connectionRows = tableRowsInSection('knots','Direct tie / snap / swivel guidance');
}

function buildGearInventory() {
  const table = state.tables.gear.find(t => t.sectionPath.some(p => normalize(p).includes('rods reels line')));
  if (!table) return [];
  return table.rows.flatMap(row => {
    const raw = valueByHeader(row,'Category');
    const c = normalize(raw);
    const category = c==='rod'||c==='rod reel' ? 'rods' : c==='reel' ? 'reels' : c==='line'||c==='leader' ? 'line' : null;
    if (!category) return [];
    const cell = valueByHeader(row,'Manufacturer / Model');
    const links = extractLinks(cell);
    return [{ category, subcategory:cleanMarkdown(raw), name:links[0]?.label||cleanMarkdown(cell)||cleanMarkdown(valueByHeader(row,'Component')), fields:row, links:collectLinksFromRow(row), sourceSection:table.sectionPath.join(' › ') }];
  });
}

function buildSetupGearInventory() {
  const out=[]; const wanted=['spinning setup','baitcasting setup','spincast shore trout setup'];
  for (const table of state.tables.knots) {
    if (!table.sectionPath.some(p => wanted.includes(normalize(p))) || !table.headers.some(h => normalize(h)==='component')) continue;
    for (const row of table.rows) {
      const component=normalize(valueByHeader(row,'Component')); const status=normalize(valueByHeader(row,'Status / Evidence'));
      if (!/owned|current setup/.test(status)) continue;
      const category = component==='rod'?'rods':component==='reel'?'reels':component==='main line'||component==='leader'?'line':null;
      if (!category) continue;
      const cell=valueByHeader(row,'Details'); const links=extractLinks(cell);
      out.push({category, subcategory:cleanMarkdown(valueByHeader(row,'Component')), name:links[0]?.label||cleanMarkdown(cell), fields:row, links:collectLinksFromRow(row), sourceSection:table.sectionPath.join(' › ')});
    }
  }
  return out;
}

function buildTackleInventory() {
  const out=[];
  for (const table of state.tables.tackle) {
    const path=table.sectionPath.map(normalize); const section=table.sectionPath.at(-1)||''; let category='lures';
    if (path.some(p=>p==='hooks')) category='hooks';
    else if (path.some(p=>p.includes('weights sinkers'))) category='weights';
    else if (path.some(p=>p.includes('snaps and swivels'))) category='snaps-swivels';
    else if (path.some(p=>p==='trout bait')) category='bait';
    else if (!table.headers.some(h=>normalize(h)==='item')) continue;
    for (const row of table.rows) {
      const cell=valueByHeader(row,'Item'); if (!cell) continue; const links=extractLinks(cell);
      out.push({category, subcategory:category==='hooks'?cleanMarkdown(valueByHeader(row,'Category')):section, name:links[0]?.label||cleanMarkdown(cell), fields:row, links:collectLinksFromRow(row), sourceSection:table.sectionPath.join(' › ')});
    }
  }
  return out;
}

function buildKnotInventory() {
  const table=state.tables.knots.find(t=>normalize(t.sectionPath.at(-1)||'').includes('knots from onenote'));
  return table ? table.rows.map(row => { const cell=valueByHeader(row,'Knot'); const links=collectLinksFromRow(row); return {category:'knots',subcategory:'Saved knots',name:extractLinks(cell)[0]?.label||cleanMarkdown(cell),fields:row,links,sourceSection:table.sectionPath.join(' › ')}; }) : [];
}

function buildCatchLog() {
  return state.tables.catches.find(t=>normalize(t.sectionPath.at(-1)||'').includes('onenote catch log'))?.rows || [];
}

function renderRoute() {
  const parts=(location.hash||'#/home').replace(/^#\//,'').split('/').filter(Boolean);
  if (parts[0]==='inventory'&&parts[1]==='item') return renderItem(parts.slice(2).join('/'));
  if (parts[0]==='inventory'&&parts[1]) return renderInventoryList(parts[1]);
  if (parts[0]==='inventory') return renderInventoryCategories();
  if (parts[0]==='plan'&&parts[1]==='result') return renderPlanResult();
  if (parts[0]==='plan') return renderPlanBuilder();
  renderHome();
}

function renderHome() {
  app.innerHTML=`<section class="hero"><h2>What do you want to do?</h2><p>Browse everything you own and the knowledge connected to it, or build an actionable plan from where, when, what you want to catch, or what you already have tied on.</p></section><section class="choice-grid"><button class="choice-card" data-route="#/inventory"><span class="choice-icon">🎒</span><div><strong>My Gear & Knots</strong><p>Rods, reels, line, terminal tackle, lures, bait, knots, instructions, links, and catch history.</p></div></button><button class="choice-card" data-route="#/plan"><span class="choice-icon">🧭</span><div><strong>Build a Fishing Plan</strong><p>Start with a situation, target species, setup, or lure and turn the knowledge base into a plan.</p></div></button></section>`;
  bindRouteButtons();
}

function renderInventoryCategories() {
  const counts=Object.fromEntries(Object.keys(CATEGORY_META).map(k=>[k,state.inventory.filter(i=>i.category===k).length]));
  app.innerHTML=`${pageHeader('My Gear & Knots','Browse owned equipment, tackle, bait, and your saved knot library.','#/home')}<section class="category-grid">${Object.entries(CATEGORY_META).map(([k,m])=>`<button class="category-card" data-route="#/inventory/${k}"><span>${m.icon}</span><strong>${m.label}</strong><small>${counts[k]} record${counts[k]===1?'':'s'}</small></button>`).join('')}</section>`;
  bindRouteButtons();
}

function renderInventoryList(category) {
  const meta=CATEGORY_META[category]; if (!meta) return navigate('#/inventory');
  const items=state.inventory.filter(i=>i.category===category); const subs=[...new Set(items.map(i=>i.subcategory).filter(Boolean))].sort();
  app.innerHTML=`${pageHeader(meta.label,`${items.length} owned/saved records from the canonical Markdown knowledge base.`,'#/inventory')}<div class="toolbar"><input class="search" id="inventorySearch" type="search" placeholder="Search ${meta.label.toLowerCase()}…" />${subs.length>1?`<select class="select" id="subcategoryFilter"><option value="">All types</option>${subs.map(s=>`<option value="${escapeAttr(s)}">${escapeHtml(s)}</option>`).join('')}</select>`:''}</div><section class="item-list" id="itemList"></section>`;
  const search=document.querySelector('#inventorySearch'), filter=document.querySelector('#subcategoryFilter'), list=document.querySelector('#itemList');
  const draw=()=>{ const q=normalize(search.value), sub=filter?.value||''; const filtered=items.filter(i=>(!q||normalize(`${i.name} ${i.subcategory} ${Object.values(i.fields).join(' ')}`).includes(q))&&(!sub||i.subcategory===sub)); list.innerHTML=filtered.length?filtered.map(itemCardHtml).join(''):'<div class="empty">No matching records.</div>'; list.querySelectorAll('[data-item-id]').forEach(el=>el.addEventListener('click',()=>navigate(`#/inventory/item/${encodeURIComponent(el.dataset.itemId)}`))); };
  search.addEventListener('input',draw); filter?.addEventListener('change',draw); draw();
}

function renderItem(encodedId) {
  const item=state.inventory.find(i=>i.id===decodeURIComponent(encodedId||'')); if (!item) return navigate('#/inventory');
  const mentions=findKnowledgeMentions(item).slice(0,6), catches=catchesForItem(item), knots=knotGuidanceForItem(item), meta=CATEGORY_META[item.category];
  app.innerHTML=`${pageHeader(item.name,`${meta?.label||item.category}${item.subcategory?` · ${item.subcategory}`:''}`,`#/inventory/${item.category}`)}<section class="panel"><div class="detail-grid">${Object.entries(item.fields).filter(([,v])=>cleanMarkdown(v)).map(([k,v])=>`<div class="detail-cell"><div class="label">${escapeHtml(k)}</div><div class="value">${markdownInline(v)}</div></div>`).join('')}</div>${item.links.length?`<div class="link-list">${uniqueLinks(item.links).map(l=>`<a class="link-chip" href="${escapeAttr(l.url)}" target="_blank" rel="noopener">${escapeHtml(l.label||'Website')} ↗</a>`).join('')}</div>`:''}<div class="source-note">Source: ${escapeHtml(item.sourceSection)}</div></section><section class="panel"><h3>Knots & connections</h3>${knots.length?knots.map(k=>`<div class="recommendation"><span class="badge">🪢 Curated KB</span><h4>${escapeHtml(k.title)}</h4><p>${escapeHtml(k.text)}</p><div class="source-note">${escapeHtml(k.source||'Rods, Reels, Line, and Knots')}</div></div>`).join(''):'<div class="empty">No item-specific knot or connection guidance is currently explicit.</div>'}</section><section class="panel"><h3>How to use it</h3>${mentions.length?mentions.map(m=>`<div class="recommendation"><span class="badge">📚 Curated KB</span><h4>${escapeHtml(m.title)}</h4><div class="markdown-snippet">${markdownExcerpt(m.markdown,item)}</div><div class="source-note">${escapeHtml(m.source)}</div></div>`).join(''):'<div class="empty">No additional instructional mentions found yet.</div>'}</section><section class="panel"><h3>My catch history</h3>${catches.length?catches.map(catchRowHtml).join(''):'<div class="empty">No catches in the current log are linked to this item yet.</div>'}</section>`;
}

function renderPlanBuilder() {
  const saved=readPlanDraft(); const lureOptions=state.inventory.filter(i=>['lures','bait'].includes(i.category)).sort((a,b)=>a.name.localeCompare(b.name));
  app.innerHTML=`${pageHeader('Build a Fishing Plan','Start anywhere. Every selection adds context and narrows the same plan.','#/home')}<section class="plan-form"><div class="form-card"><label>📍 Where</label><div class="hint">Location-specific structure and historical notes will be prioritized.</div><select class="input" id="planLocation"><option value="">Not specified</option>${state.locations.map(l=>optionHtml(l.name,saved.location)).join('')}</select></div><div class="form-row"><div class="form-card"><label>📅 Date</label><div class="hint">Used to infer season.</div><input class="input" id="planDate" type="date" value="${escapeAttr(saved.date||todayLocal())}" /></div><div class="form-card"><label>🕓 Time of day</label><div class="hint">Used for morning/midday/evening notes.</div><select class="input" id="planTime">${['','Dawn / early morning','Morning','Midday','Afternoon','Evening / dusk','Night'].map(v=>optionHtml(v||'Not specified',saved.time,v)).join('')}</select></div></div><div class="form-card"><label>🐟 Target species</label><div class="hint">Leave blank if the water or setup should drive the plan.</div><select class="input" id="planSpecies"><option value="">Not specified</option>${SPECIES.map(s=>optionHtml(s,saved.species)).join('')}</select></div><div class="form-card"><label>🎣 Gear setup</label><div class="hint">Choose a current setup if you already know which rod/reel you want.</div><select class="input" id="planSetup"><option value="">Not specified</option>${state.setups.map(s=>optionHtml(s.name,saved.setup)).join('')}</select></div><div class="form-card"><label>🧰 Lure or bait already tied on</label><div class="hint">Optional; this strongly biases the plan toward using that item.</div><select class="input" id="planItem"><option value="">Not specified</option>${lureOptions.map(i=>`<option value="${escapeAttr(i.id)}" ${saved.itemId===i.id?'selected':''}>${escapeHtml(i.name)}${i.subcategory?` — ${escapeHtml(i.subcategory)}`:''}</option>`).join('')}</select></div></section><div class="plan-actions"><button class="primary-button" id="buildPlanButton">Build my fishing plan</button></div>`;
  document.querySelector('#buildPlanButton').addEventListener('click',()=>{ const draft={location:document.querySelector('#planLocation').value,date:document.querySelector('#planDate').value,time:document.querySelector('#planTime').value,species:document.querySelector('#planSpecies').value,setup:document.querySelector('#planSetup').value,itemId:document.querySelector('#planItem').value}; localStorage.setItem('fishing-plan-draft',JSON.stringify(draft)); state.currentPlan=buildPlan(draft); navigate('#/plan/result'); });
}

function renderPlanResult() {
  const plan=state.currentPlan||buildPlan(readPlanDraft()); state.currentPlan=plan; const c=plan.context; const title=[c.location,c.species,c.time].filter(Boolean).join(' · ')||'Fishing Plan';
  app.innerHTML=`<div class="plan-header"><button class="back-button" data-route="#/plan">← Adjust plan</button><h2>${escapeHtml(title)}</h2><p>${escapeHtml(plan.contextSummary)}</p></div><section class="panel"><h3>Where to fish</h3>${plan.where.length?`<span class="badge inference">🧭 App inference</span><ul>${plan.where.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul>`:'<div class="empty">Choose a location for structure-specific targets.</div>'}</section><section class="panel"><h3>Gear, lures & bait</h3>${plan.setup?`<div class="recommendation"><span class="badge inference">🎣 App inference</span><h4>${escapeHtml(plan.setup.name)}</h4><p>${escapeHtml(setupSummary(plan.setup))}</p></div>`:''}${plan.items.length?plan.items.map(x=>`<div class="recommendation"><span class="badge inference">🧰 App inference</span><h4>${escapeHtml(x.item.name)}</h4><p>${escapeHtml(x.reason)}</p><button class="secondary-button" data-item-open="${escapeAttr(x.item.id)}">Open item</button></div>`).join(''):'<div class="empty">Add a species, location, or lure for owned-tackle recommendations.</div>'}</section><section class="panel"><h3>Rig & knots</h3>${plan.knots.length?plan.knots.map(k=>`<div class="recommendation"><span class="badge">🪢 Curated KB</span><h4>${escapeHtml(k.title)}</h4><p>${escapeHtml(k.text)}</p><div class="source-note">${escapeHtml(k.source)}</div></div>`).join(''):'<div class="empty">No explicit knot guidance could be derived for this combination.</div>'}</section><section class="panel"><h3>Techniques</h3>${plan.techniques.length?plan.techniques.map(t=>`<div class="recommendation"><span class="badge inference">🧠 App inference</span><h4>${escapeHtml(t.technique.name)}</h4><div class="markdown-snippet">${markdownExcerpt(t.technique.markdown)}</div><div class="source-note">${escapeHtml(t.technique.sourceSection)}</div></div>`).join(''):'<div class="empty">Add more context to rank techniques.</div>'}</section><section class="panel"><h3>Species in this context</h3>${plan.species.length?`<ul>${plan.species.map(s=>`<li>${escapeHtml(titleCase(s))}</li>`).join('')}</ul>`:'<div class="empty">No species inferred.</div>'}</section><section class="panel"><h3>Similar results from my catch log</h3>${plan.history.length?plan.history.map(h=>`<div class="recommendation"><span class="badge observed">✓ User observed</span>${catchRowHtml(h.row)}<div class="score">Similarity score ${h.score}</div></div>`).join(''):'<div class="empty">No sufficiently similar logged catches yet.</div>'}</section><section class="panel"><h3>How this plan was assembled</h3><p><span class="badge">📚 Curated KB</span> is directly sourced from Markdown. <span class="badge observed">✓ User observed</span> is catch-log evidence. <span class="badge inference">🧠 App inference</span> is deterministic ranking/combination of existing knowledge, not a new historical fact.</p></section>`;
  bindRouteButtons(); document.querySelectorAll('[data-item-open]').forEach(b=>b.addEventListener('click',()=>navigate(`#/inventory/item/${encodeURIComponent(b.dataset.itemOpen)}`)));
}

function buildPlan(context) {
  const location=state.locations.find(l=>l.name===context.location), selectedItem=state.inventory.find(i=>i.id===context.itemId), selectedSetup=state.setups.find(s=>s.name===context.setup), season=seasonForDate(context.date), locationText=normalize(location?.text||''), speciesTerms=speciesAliases(context.species);
  const techniques=state.techniques.map(technique=>{ const text=normalize(`${technique.name} ${technique.text}`); let score=0; if(context.species&&speciesTerms.some(t=>text.includes(t)))score+=5; if(context.species?.toLowerCase().includes('bass')&&text.includes('bass'))score+=2; if(location&&techniqueMentioned(locationText,technique.name))score+=6; if(selectedItem&&textMatchesItem(text,selectedItem))score+=8; if(selectedSetup&&text.includes(normalize(selectedSetup.name).split(' ')[0]))score+=2; if(season&&text.includes(season))score+=1; return {technique,score}; }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,5);
  let setup=selectedSetup;
  if(!setup&&techniques.length){const combined=normalize(techniques.map(t=>t.technique.text).join(' ')); const spinning=countOccurrences(combined,'spinning'), bait=countOccurrences(combined,'baitcast'); setup=state.setups.find(s=>normalize(s.name).includes(spinning>=bait?'spinning':'baitcasting'));}
  const items=state.inventory.filter(i=>['lures','bait'].includes(i.category)).map(item=>{let score=0;const reasons=[];if(selectedItem?.id===item.id){score+=100;reasons.push('already selected');}if(location&&textMatchesItem(locationText,item)){score+=7;reasons.push(`named in ${location.name} notes`);}for(const t of techniques){if(textMatchesItem(normalize(t.technique.text),item)){score+=5;reasons.push(`used with ${t.technique.name}`);}if(normalize(item.subcategory).includes(normalize(t.technique.name))){score+=3;reasons.push(`matches ${t.technique.name}`);}}return {item,score,reasons:[...new Set(reasons)]};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,8).map(x=>({item:x.item,reason:x.reasons.join('; ')||'Matches selected context.'}));
  const primary=selectedItem||items[0]?.item;
  const where=location?extractStructureTargets(location.markdown,context.time).slice(0,8):[];
  const history=scoreCatchHistory(context,selectedItem).slice(0,5);
  const species=inferSpecies(location?.text||techniques.map(t=>t.technique.text).join(' '),context.species);
  const bits=[context.location,context.date?`${season} ${context.date}`.trim():'',context.time,context.species?`targeting ${context.species}`:'',selectedItem?`starting with ${selectedItem.name}`:''].filter(Boolean);
  return {context,contextSummary:bits.join(' · ')||'Broad knowledge-base plan',where,setup,items,knots:planKnotGuidance(setup,primary,techniques.map(t=>t.technique)),techniques,species,history};
}

function planKnotGuidance(setup,item,techniques) {
  const out=[];
  if(setup){const text=normalize(setup.text);const row=state.braidLeaderRows.find(r=>{const s=normalize(valueByHeader(r,'Setup'));return(text.includes('15 lb')&&s.includes('15 lb'))||(text.includes('30 lb')&&s.includes('30 lb'));});if(row)out.push({title:'Main line → leader',text:`${cleanMarkdown(valueByHeader(row,'Preferred knot'))} preferred; ${cleanMarkdown(valueByHeader(row,'Easier field knot'))} is the easier field alternative. ${cleanMarkdown(valueByHeader(row,'Notes'))}`,source:'Rods, Reels, Line, and Knots › Braid-to-leader knots'});}
  if(item)out.push(...knotGuidanceForItem(item).slice(0,2));
  const explicit=extractKnotSentences(techniques.map(t=>t.text).join('\n')); explicit.slice(0,2).forEach(text=>out.push({title:'Technique-specific knot note',text,source:'Fishing Techniques'}));
  return dedupeGuidance(out);
}

function knotGuidanceForItem(item) {
  const out=[];
  if(item.category==='knots'){const guidance=cleanMarkdown(valueByHeader(item.fields,'OneNote guidance / source link'));if(guidance)out.push({title:item.name,text:guidance,source:item.sourceSection});return out;}
  const sub=normalize(item.subcategory), name=normalize(item.name);
  const row=state.connectionRows.find(r=>{const type=normalize(valueByHeader(r,'Lure type'));return type&&(sub.includes(type.replace(/s$/,''))||type.includes(sub.replace(/s$/,''))||name.includes(type.replace(/s$/,''))||connectionAlias(type,sub));});
  if(row)out.push({title:'Leader → terminal tackle',text:`${cleanMarkdown(valueByHeader(row,'Connection'))}. ${cleanMarkdown(valueByHeader(row,'Swivel use'))}`,source:'Rods, Reels, Line, and Knots › Direct tie / snap / swivel guidance'});
  findKnowledgeMentions(item).forEach(m=>extractKnotSentences(cleanMarkdown(m.markdown)).forEach(text=>out.push({title:'Knot note',text,source:m.source})));
  if(item.category==='hooks'&&!out.some(x=>/palomar|clinch/i.test(x.text)))out.push({title:'Hook connection reference',text:'Saved guidance identifies the Palomar as strong and easy for small hooks/light line, and the Improved Clinch as good with mono/fluorocarbon on small hooks and jigheads.',source:'Rods, Reels, Line, and Knots › Knots from OneNote'});
  if(item.category==='snaps-swivels'&&!out.some(x=>/trilene/i.test(x.text)))out.push({title:'Snap/swivel knot reference',text:'Saved guidance identifies the Trilene knot as a good choice for tying fluorocarbon to swivels and snaps; wet fluorocarbon before tightening.',source:'Rods, Reels, Line, and Knots › Knots from OneNote'});
  return dedupeGuidance(out).slice(0,5);
}

function findKnowledgeMentions(item) {
  const aliases=itemAliases(item), out=[];
  for(const key of ['techniques','knots','locations'])for(const section of state.sections[key]){if(section.level<2)continue;const text=normalize(`${section.title} ${section.content}`);if(!aliases.some(a=>a.length>=4&&text.includes(a)))continue;out.push({title:section.title,markdown:section.content,source:`${sourceLabel(key)} › ${section.path.join(' › ')}`,relevance:aliases.reduce((n,a)=>n+countOccurrences(text,a),0)});}
  return out.sort((a,b)=>b.relevance-a.relevance);
}

function catchesForItem(item){return state.catches.filter(r=>textMatchesItem(normalize(valueByHeader(r,'Gear used')),item));}
function scoreCatchHistory(context,item){const terms=speciesAliases(context.species),month=context.date?.slice(5,7);return state.catches.map(row=>{let score=0;const water=normalize(valueByHeader(row,'Water')),result=normalize(valueByHeader(row,'Results')),conditions=normalize(valueByHeader(row,'Conditions'));if(context.location&&water.includes(normalize(context.location).replace(/ wa$/,'')))score+=8;if(context.species&&terms.some(t=>result.includes(t)))score+=7;if(item&&textMatchesItem(normalize(valueByHeader(row,'Gear used')),item))score+=8;if(month&&valueByHeader(row,'Date')?.slice(5,7)===month)score+=2;if(context.time&&conditions.includes(normalize(context.time).split(' ')[0]))score+=1;return{row,score};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);}
function extractStructureTargets(markdown,time){const tw=normalize(time||'').split(' ')[0];const rows=markdown.split('\n').map(x=>x.trim()).filter(x=>/^[-*]\s+/.test(x)).map(line=>{const text=cleanMarkdown(line.replace(/^[-*]\s+/,'')),norm=normalize(text);let score=STRUCTURE_TERMS.reduce((n,t)=>n+(norm.includes(t)?1:0),0);if(tw&&norm.includes(tw))score+=2;if(/launch:|caught|source/i.test(text))score-=2;return{text,score};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);return[...new Map(rows.map(x=>[normalize(x.text),x.text])).values()];}
function inferSpecies(text,selected){const norm=normalize(text),out=[];if(selected)out.push(selected.toLowerCase());FISH_TERMS.forEach(f=>{if(norm.includes(normalize(f)))out.push(f);});return[...new Set(out)].slice(0,8);}
function techniqueMentioned(text,name){const n=normalize(name);if(text.includes(n))return true;const words=n.split(' ').filter(w=>w.length>3);return words.length&&words.every(w=>text.includes(w));}
function speciesAliases(s){s=normalize(s||'');if(!s)return[];if(s.includes('largemouth'))return['largemouth','bass'];if(s.includes('smallmouth'))return['smallmouth','bass'];if(s.includes('cutthroat'))return['cutthroat','trout'];if(s.includes('rainbow'))return['rainbow','trout'];if(s==='trout')return['trout','rainbow','cutthroat'];return[s];}
function setupSummary(setup){const t=setup.tables?.[0];if(t?.rows?.length)return t.rows.map(r=>`${cleanMarkdown(valueByHeader(r,'Component'))}: ${cleanMarkdown(valueByHeader(r,'Details'))}`).filter(Boolean).slice(0,5).join(' · ');return setup.text.slice(0,420);}
function catchRowHtml(row){const date=cleanMarkdown(valueByHeader(row,'Date')),water=cleanMarkdown(valueByHeader(row,'Water')),result=cleanMarkdown(valueByHeader(row,'Results')),gear=cleanMarkdown(valueByHeader(row,'Gear used')),conditions=cleanMarkdown(valueByHeader(row,'Conditions'));return`<div class="recommendation"><h4>${escapeHtml(result||'Logged outing')}</h4><p><strong>${escapeHtml(water)}</strong>${date?` · ${escapeHtml(date)}`:''}</p><p>${escapeHtml(gear)}${conditions?` · ${escapeHtml(conditions)}`:''}</p></div>`;}
function itemCardHtml(item){const bits=[item.subcategory,compactField(item,['Size / weight','Size','Size / rating','Important specifications']),compactField(item,['Color','Color / scent'])].filter(Boolean);return`<article class="item-card" data-item-id="${escapeAttr(item.id)}"><h3>${escapeHtml(item.name)}</h3><div class="item-meta">${bits.map(x=>`<span>${escapeHtml(x)}</span>`).join('<span>·</span>')}</div></article>`;}
function compactField(item,headers){for(const h of headers){const v=cleanMarkdown(valueByHeader(item.fields,h));if(v)return v;}return'';}
function pageHeader(title,subtitle,back){return`<div class="section-title"><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(subtitle)}</p></div><button class="back-button" data-route="${escapeAttr(back)}">← Back</button></div>`;}
function bindRouteButtons(){document.querySelectorAll('[data-route]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.route)));}
function navigate(hash){if(location.hash===hash)renderRoute();else location.hash=hash;window.scrollTo({top:0,behavior:'smooth'});}
function updateOnlineStatus(){statusDot.classList.toggle('offline',!navigator.onLine);statusDot.title=navigator.onLine?'Online':'Offline — cached knowledge remains available';}
async function registerServiceWorker(){if('serviceWorker'in navigator)try{await navigator.serviceWorker.register('./sw.js');}catch(e){console.warn(e);}}
function readPlanDraft(){try{return JSON.parse(localStorage.getItem('fishing-plan-draft')||'{}');}catch{return{};}}
function todayLocal(){const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function seasonForDate(s){const m=Number(s?.slice(5,7));return[12,1,2].includes(m)?'winter':[3,4,5].includes(m)?'spring':[6,7,8].includes(m)?'summer':[9,10,11].includes(m)?'fall':'';}

function parseSections(markdown,sourceKey){const lines=markdown.split(/\r?\n/),heads=[],stack=[];lines.forEach((line,i)=>{const m=/^(#{1,6})\s+(.+?)\s*$/.exec(line);if(!m)return;const level=m[1].length,title=cleanMarkdown(m[2]);stack.length=level-1;stack[level-1]=title;heads.push({level,title,startLine:i,path:stack.filter(Boolean).slice(),sourceKey});});return heads.map((h,i)=>{let end=lines.length-1;for(let j=i+1;j<heads.length;j++)if(heads[j].level<=h.level){end=heads[j].startLine-1;break;}return{...h,endLine:end,content:lines.slice(h.startLine+1,end+1).join('\n').trim()};});}
function parseTables(markdown,sections,sourceKey){const lines=markdown.split(/\r?\n/),out=[];for(let i=0;i<lines.length-1;i++){if(!/^\s*\|/.test(lines[i])||!/^\s*\|?\s*:?-{3,}/.test(lines[i+1]))continue;const headers=splitTableRow(lines[i]).map(cleanMarkdown),rows=[];let j=i+2;while(j<lines.length&&/^\s*\|/.test(lines[j])){const cells=splitTableRow(lines[j]),row={};headers.forEach((h,k)=>row[h]=cells[k]??'');rows.push(row);j++;}const section=sections.filter(s=>s.startLine<=i&&s.endLine>=i).sort((a,b)=>b.level-a.level)[0];out.push({headers,rows,startLine:i,endLine:j-1,sectionPath:section?.path||[],sourceKey});i=j-1;}return out;}
function splitTableRow(line){const s=line.trim().replace(/^\|/,'').replace(/\|$/,''),cells=[];let cur='',esc=false;for(const ch of s){if(esc){cur+=ch;esc=false;continue;}if(ch==='\\'){cur+=ch;esc=true;continue;}if(ch==='|'){cells.push(cur.trim());cur='';continue;}cur+=ch;}cells.push(cur.trim());return cells;}
function tableRowsInSection(key,title){const n=normalize(title);return state.tables[key].filter(t=>normalize(t.sectionPath.at(-1)||'')===n).flatMap(t=>t.rows);}
function valueByHeader(row,wanted){const k=Object.keys(row||{}).find(x=>normalize(x)===normalize(wanted));return k?row[k]:'';}
function extractLinks(md=''){const out=[];for(const m of md.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g))out.push({label:cleanMarkdown(m[1]),url:m[2]});return out;}
function collectLinksFromRow(row){return Object.values(row).flatMap(extractLinks);}
function uniqueLinks(links){const s=new Set();return links.filter(l=>!s.has(l.url)&&s.add(l.url));}
function dedupeInventory(items){const m=new Map();for(const item of items){const key=`${item.category}|${normalize(item.name)}|${normalize(compactField(item,['Size / weight','Size','Size / rating','Important specifications']))}|${normalize(compactField(item,['Color','Color / scent']))}`;if(!m.has(key))m.set(key,item);}return[...m.values()];}
function stableItemId(item){return slug(`${item.category}-${item.subcategory}-${item.name}-${compactField(item,['Size / weight','Size','Size / rating'])}-${compactField(item,['Color','Color / scent'])}`);}
function itemAliases(item){const name=normalize(item.name),out=new Set([name]);const brands=['z man','strike king','berkley','rapala','river2sea','booyah','gamakatsu','vmc','owner','mack s','mepps','panther martin','yamamoto','6th sense','rebel','daiwa','shimano','seaguar','sufix','powerpro'];for(const b of brands)if(name.startsWith(`${b} `))out.add(name.slice(b.length+1));const words=name.split(' ').filter(w=>w.length>2);if(words.length>=2)out.add(words.slice(-2).join(' '));return[...out].filter(x=>x.length>=4);}
function textMatchesItem(text,item){return itemAliases(item).some(a=>text.includes(a));}
function connectionAlias(type,sub){return(type.includes('crankbait')&&sub.includes('crankbait'))||(type.includes('hard jerkbait')&&sub.includes('jerkbait'))||(type.includes('spoon')&&sub.includes('spoon'))||(type.includes('inline spinner')&&sub.includes('inline spinner'))||(type.includes('spinnerbait')&&sub.includes('spinnerbait'))||(type.includes('chatterbait')&&sub.includes('chatterbait'))||(type.includes('wacky ned drop shot')&&/wacky|ned|drop shot/.test(sub))||(type.includes('topwater')&&/topwater|frog/.test(sub));}
function extractKnotSentences(text){const names=['palomar','fg knot','albright','alberto','trilene','improved clinch','modified uni','double uni','loop knot'];return[...new Set(cleanMarkdown(text).split(/(?<=[.!?])\s+|\n+/).filter(s=>names.some(n=>normalize(s).includes(n))||/tie direct|snap|swivel/i.test(s)).map(s=>s.trim().slice(0,360)))];}
function dedupeGuidance(items){const s=new Set();return items.filter(x=>{const k=normalize(`${x.title} ${x.text}`);if(s.has(k))return false;s.add(k);return true;});}
function markdownExcerpt(markdown,item=null){let lines=markdown.split('\n').filter(x=>x.trim());if(item){const aliases=itemAliases(item),idx=lines.findIndex(l=>aliases.some(a=>normalize(l).includes(a)));if(idx>=0)lines=lines.slice(Math.max(0,idx-2),idx+5);}return markdownToHtml(lines.slice(0,8).join('\n'));}
function markdownToHtml(md){let out=[],list=false;for(const raw of md.split('\n')){const line=raw.trim();if(!line){if(list){out.push('</ul>');list=false;}continue;}if(/^[-*]\s+/.test(line)){if(!list){out.push('<ul>');list=true;}out.push(`<li>${markdownInline(line.replace(/^[-*]\s+/,''))}</li>`);continue;}if(list){out.push('</ul>');list=false;}if(!/^\|/.test(line)&&!/^```/.test(line))out.push(`<p>${markdownInline(line)}</p>`);}if(list)out.push('</ul>');return out.join('');}
function markdownInline(md=''){let x=escapeHtml(md);x=x.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1 ↗</a>').replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');return x;}
function cleanMarkdown(v=''){return String(v).replace(/\[([^\]]+)\]\(([^)]+)\)/g,'$1').replace(/`([^`]+)`/g,'$1').replace(/[*_~]/g,'').replace(/^[-*]\s+/gm,'').replace(/^#+\s+/gm,'').replace(/\s+/g,' ').trim();}
function normalize(v=''){return cleanMarkdown(v).toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();}
function slug(v=''){return normalize(v).replace(/\s+/g,'-').slice(0,120)||'item';}
function sourceLabel(k){return({techniques:'Fishing Techniques',knots:'Rods, Reels, Line, and Knots',locations:'Local Waters and Fishing Locations'})[k]||k;}
function countOccurrences(text,n){return n?text.split(n).length-1:0;}
function titleCase(v){return v.replace(/\b\w/g,c=>c.toUpperCase());}
function optionHtml(label,selected,value=label){return`<option value="${escapeAttr(value)}" ${selected===value?'selected':''}>${escapeHtml(label)}</option>`;}
function escapeHtml(v=''){return String(v).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);}
function escapeAttr(v=''){return escapeHtml(v).replace(/'/g,'&#39;');}
