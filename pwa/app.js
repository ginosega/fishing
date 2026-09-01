const SOURCE_FILES = {
  gear: './kb/Fishing_Gear_Registry.md',
  tackle: './kb/Fishing_Tackle_Inventory.md',
  knots: './kb/Rods_Reels_Line_Knots.md',
  techniques: './kb/Fishing_Techniques.md',
  locations: './kb/Local_Waters_Locations.md',
  catches: './kb/Trip_Logs_Field_Observations.md'
};

const CATEGORY_META = {
  'rods-reels': { label: 'Rods & Reels', icon: '🎣' },
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

const state = {
  docs:{}, sections:{}, tables:{}, inventory:[], catches:[], locations:[], techniques:[],
  setups:[], braidLeaderRows:[], connectionRows:[], kbRecords:[], currentPlan:null
};

const app = document.querySelector('#app');
const homeButton = document.querySelector('#homeButton');
const statusDot = document.querySelector('#onlineStatus');
const copyrightFooter = document.querySelector('#copyrightFooter');

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
  copyrightFooter.textContent = `© ${new Date().getFullYear()} Gino Sega`;
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
  state.catches = buildCatchLog();
  state.locations = state.sections.locations
    .filter(s => s.level===2 && !/other local|regulation\/access/i.test(s.title))
    .map(s => ({name:s.title, markdown:s.content, text:cleanMarkdown(s.content), sourceSection:s.path.join(' › ')}));

  state.kbRecords = buildKnowledgeBaseRecords();
  const parents = ['trout fishing','bass finesse techniques','bass power search techniques'];
  state.techniques = state.kbRecords
    .filter(r => r.kind==='technique' && r.level===3 && parents.some(p => r.path.map(normalize).includes(p)))
    .map(r => ({name:r.name, markdown:r.markdown, text:r.text, sourceSection:r.sourceSection}));

  const setupItems = buildSetupInventory();
  state.setups = setupItems.map(item => ({
    name: item.type,
    markdown: item.setupMarkdown,
    text: cleanMarkdown(item.setupMarkdown),
    tables: item.setupTables,
    sourceSection: item.sourceSection
  }));

  const items = [
    ...setupItems,
    ...buildLineInventory(),
    ...buildTackleInventory(),
    ...buildKnotInventory()
  ];
  state.inventory = items.map(item => ({...item, id:item.id || stableItemId(item)}));

  state.braidLeaderRows = tableRowsInSection('knots','Braid-to-leader knots');
  state.connectionRows = tableRowsInSection('knots','Direct tie / snap / swivel guidance');
}

function buildKnowledgeBaseRecords() {
  const records = [];
  for (const section of state.sections.techniques) {
    if (section.level < 2 || /todo finesse pages/i.test(section.title)) continue;
    if (section.level===2 && normalize(section.title)!=='trout fishing') continue;
    if (section.level>3) continue;
    const isSlipSinker = normalize(section.title)==='still fishing' || normalize(section.title)==='slip sinker rig';
    const name = isSlipSinker ? 'Slip sinker rig' : section.title;
    records.push({
      id: slug(`kb-${name}`), kind:'technique', name, aliases:isSlipSinker?['Still fishing']:[], level:section.level, path:section.path,
      markdown:section.content, text:cleanMarkdown(section.content),
      sourceSection:`Fishing Techniques › ${section.path.join(' › ')}`
    });
  }
  return dedupeBy(records, r => normalize(r.name));
}

function buildSetupInventory() {
  const setupDefs = [
    {section:'Spinning setup', type:'Spinning'},
    {section:'Baitcasting setup', type:'Baitcasting'},
    {section:'Spincast / shore trout setup', type:'Spincasting'}
  ];
  return setupDefs.map(def => {
    const section = findSection('knots', def.section);
    const tables = section ? state.tables.knots.filter(t => t.startLine>=section.startLine && t.startLine<=section.endLine) : [];
    const table = tables.find(t => t.headers.some(h => normalize(h)==='component'));
    const rows = table?.rows || [];
    const rod = buildSetupComponent(rows.find(r => normalize(valueByHeader(r,'Component'))==='rod'), 'rod', def.type);
    const reel = buildSetupComponent(rows.find(r => normalize(valueByHeader(r,'Component'))==='reel'), 'reel', def.type);
    const mainLine = rows.find(r => /main line/i.test(valueByHeader(r,'Component')));
    const leader = rows.find(r => normalize(valueByHeader(r,'Component'))==='leader');
    const displayRod = rod.displayName || 'unknown';
    const displayReel = reel.displayName || 'unknown';
    const header = `Rod: ${displayRod}, Reel: ${displayReel}`;
    return {
      category:'rods-reels', type:def.type, subcategory:def.type,
      name: `${displayRod} + ${displayReel}`,
      headerTitle: header,
      cardMeta: header,
      rod, reel,
      mainLine: mainLine ? cleanMarkdown(valueByHeader(mainLine,'Details')) : '',
      leader: leader ? cleanMarkdown(valueByHeader(leader,'Details')) : '',
      fields:{},
      links: uniqueLinks([...(rod.links||[]), ...(reel.links||[])]),
      sourceSection: section?.path.join(' › ') || 'Rods, Reels, Line, and Knots',
      setupMarkdown: section?.content || '',
      setupTables: tables
    };
  });
}

function buildSetupComponent(row, kind, setupType) {
  if (!row) return {displayName:'unknown', manufacturerModel:'unknown', specifications:'unknown', links:[]};
  const details = valueByHeader(row,'Details');
  const links = extractLinks(details);
  const clean = cleanMarkdown(details);
  let displayName = links[0]?.label || clean.split(';')[0].trim();
  if (setupType==='Spincasting' && kind==='rod') displayName = 'unknown';
  if (setupType==='Spincasting' && kind==='reel') displayName = 'Pflueger President';
  const manufacturer = inferManufacturer(displayName);
  const manufacturerModel = displayName==='unknown' ? 'unknown' : displayName;
  let specifications = clean;
  for (const link of links) specifications = specifications.replace(link.label, '').trim();
  specifications = specifications
    .replace(/^[-,;:\s]+/,'')
    .replace(/;\s*(Tackle Warehouse listing|Amazon listing|JDM Tackle Heaven listing|video).*$/i,'')
    .replace(/\s+/g,' ')
    .trim();
  if (!specifications || normalize(specifications)===normalize(displayName)) specifications = kind==='rod' || kind==='reel' ? 'unknown' : specifications;
  const normalizedLinks = normalizeProductLinks(links, manufacturer);
  if (setupType==='Spinning' && kind==='reel') {
    const maintenance = extractLinks(state.docs.knots).find(l => /greasing and oiling your spinning reel/i.test(l.label));
    if (maintenance) normalizedLinks.push({label:'Maintenance', url:maintenance.url});
  }
  return {displayName, manufacturerModel, specifications, links:uniqueLinks(normalizedLinks)};
}

function buildLineInventory() {
  const table = state.tables.gear.find(t => t.sectionPath.some(p => normalize(p).includes('rods reels line')));
  if (!table) return [];
  return table.rows.flatMap(row => {
    const cat = normalize(valueByHeader(row,'Category'));
    if (!['line','leader'].includes(cat)) return [];
    const cell = valueByHeader(row,'Manufacturer / Model');
    const firstLink = extractLinks(cell)[0];
    const rawName = firstLink?.label || cleanMarkdown(cell);
    const type = /fluoro/i.test(rawName) ? 'Fluorocarbon' : /mono/i.test(rawName) ? 'Monofilament' : 'Braided';
    const name = normalizeLineProductName(rawName);
    const specRaw = cleanMarkdown(valueByHeader(row,'Important specifications'));
    const color = lineColorFromName(rawName);
    const specs = orderLineSpecs(specRaw, color);
    const manufacturer = inferManufacturer(name);
    return [{
      category:'line', type, subcategory:type, name,
      manufacturerModel:name,
      specifications:specs,
      fields:row,
      links:normalizeProductLinks(collectLinksFromRow(row), manufacturer),
      sourceSection:table.sectionPath.join(' › '),
      cardMeta:specs
    }];
  });
}

function buildTackleInventory() {
  const raw = [];
  for (const table of state.tables.tackle) {
    const path = table.sectionPath.map(normalize);
    const section = table.sectionPath.at(-1)||'';
    let category = 'lures';
    if (path.some(p=>p==='hooks')) category='hooks';
    else if (path.some(p=>p.includes('weights sinkers'))) category='weights';
    else if (path.some(p=>p.includes('snaps and swivels'))) category='snaps-swivels';
    else if (path.some(p=>p==='trout bait')) category='bait';
    else if (!table.headers.some(h=>normalize(h)==='item')) continue;
    for (const row of table.rows) {
      const cell = valueByHeader(row,'Item');
      if (!cell) continue;
      const links = extractLinks(cell);
      raw.push({
        category,
        type: category==='hooks' ? normalizeHookType(cleanMarkdown(valueByHeader(row,'Category'))) :
              category==='bait' ? 'Trout bait' : section,
        name: links[0]?.label || cleanMarkdown(cell),
        fields:row,
        links:collectLinksFromRow(row),
        sourceSection:table.sectionPath.join(' › ')
      });
    }
  }
  return [
    ...buildWeightItems(raw.filter(x=>x.category==='weights')),
    ...raw.filter(x=>x.category==='snaps-swivels').map(buildSnapSwivelItem),
    ...raw.filter(x=>x.category==='hooks').map(buildHookItem),
    ...buildLureItems(raw.filter(x=>x.category==='lures')),
    ...raw.filter(x=>x.category==='bait').map(buildBaitItem)
  ];
}

function buildWeightItems(items) {
  const groups = new Map();
  for (const item of items) {
    let type = /drop-shot cylinder/i.test(item.name) ? 'Cylinder weights'
      : /egg sinker/i.test(item.name) ? 'Egg sinkers'
      : /torpedo|trolling sinker/i.test(item.name) ? 'Swiveling trolling / torpedo weights'
      : /glass bead/i.test(item.name) ? 'Glass beads' : item.name;
    if (!groups.has(type)) groups.set(type, []);
    groups.get(type).push(item);
  }
  return [...groups.entries()].map(([type, rows]) => {
    const sizes = uniqueStrings(rows.map(r => normalizeWeightSize(cleanMarkdown(valueByHeader(r.fields,'Size / weight')))).filter(Boolean));
    let manufacturerModel='unknown';
    if (type==='Egg sinkers') manufacturerModel='Eagle Claw';
    if (type==='Swiveling trolling / torpedo weights') manufacturerModel='Eagle Claw';
    if (type==='Glass beads') manufacturerModel='Top Brass';
    const extra = type==='Glass beads' ? 'Red' : '';
    const specifications = [...sizes, extra].filter(Boolean).join(', ');
    return {
      category:'weights', type, subcategory:type, name:type,
      manufacturerModel, specifications,
      fields:{}, links:normalizeProductLinks(uniqueLinks(rows.flatMap(r=>r.links)), inferManufacturer(manufacturerModel)),
      sourceSection:rows[0]?.sourceSection||'Fishing Tackle Inventory',
      cardMeta:sizes.join(', ')
    };
  });
}

function buildSnapSwivelItem(item) {
  const type = /snap swivel/i.test(item.name) ? 'Snap swivels' : /swivel/i.test(item.name) ? 'Swivels' : 'Snaps';
  const manufacturer = inferManufacturer(item.name);
  const model = stripManufacturer(item.name, manufacturer);
  const size = cleanMarkdown(valueByHeader(item.fields,'Size / rating'));
  const detail = cleanMarkdown(valueByHeader(item.fields,'Part / details'));
  return {
    ...item, type, subcategory:type,
    manufacturerModel:[manufacturer||'unknown', model||'unknown'].filter(Boolean).join(' / '),
    specifications:[size,detail].filter(Boolean).join('; '),
    links:normalizeProductLinks(item.links, manufacturer),
    cardMeta:`${type} - ${size}`
  };
}

function buildHookItem(item) {
  const type = normalizeHookType(item.type);
  const manufacturer = inferManufacturer(item.name);
  const size = cleanMarkdown(valueByHeader(item.fields,'Size'));
  const part = cleanMarkdown(valueByHeader(item.fields,'Part / specs'));
  let model = stripManufacturer(item.name, manufacturer);
  let specifications = size;
  if (/gamakatsu octopus hook/i.test(item.name)) model = part || model;
  else if (/vmc redline weedless wacky neko/i.test(item.name) || /vmc crossover rings/i.test(item.name) || /g-finesse drop shot/i.test(item.name)) model = part || model;
  else if (part && part!=='—') specifications = [size, part].filter(Boolean).join(', ');
  return {
    ...item, type, subcategory:type,
    manufacturerModel:[manufacturer||'unknown', model||'unknown'].join(' / '),
    specifications:specifications||'unknown',
    links:normalizeProductLinks(item.links, manufacturer),
    cardMeta:[type,size].filter(Boolean).join(' · ')
  };
}

function buildLureItems(items) {
  const groups = new Map();
  for (const item of items) {
    const key = lureFamilyKey(item.name);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return [...groups.values()].map(rows => {
    const primary = rows[0];
    const name = lureFamilyName(rows);
    const type = primary.type;
    const sizeValues = uniqueStrings(rows.flatMap(r => [
      cleanMarkdown(valueByHeader(r.fields,'Size / weight')),
      cleanMarkdown(valueByHeader(r.fields,'Size')),
      cleanMarkdown(valueByHeader(r.fields,'Size / details'))
    ]).filter(Boolean));
    const colors = uniqueStrings(rows.flatMap(r => [
      cleanMarkdown(valueByHeader(r.fields,'Color')),
      cleanMarkdown(valueByHeader(r.fields,'Color / scent'))
    ]).filter(Boolean));
    const depth = uniqueStrings(rows.map(r => cleanMarkdown(valueByHeader(r.fields,'Buoyancy / depth'))).filter(Boolean));
    const specs = uniqueStrings([...splitCommaSpecs(sizeValues), ...splitColorSpecs(colors), ...depth]).join(', ');
    const manufacturer = inferManufacturer(name);
    return {
      category:'lures', type, subcategory:type, name,
      manufacturerModel:[manufacturer||'unknown', stripManufacturer(name,manufacturer)||name].join(' / '),
      specifications:specs||'unknown',
      fields:primary.fields,
      links:normalizeProductLinks(uniqueLinks(rows.flatMap(r=>r.links)), manufacturer),
      sourceSection:primary.sourceSection,
      aliases:uniqueStrings(rows.map(r=>normalize(r.name))),
      variants:rows.map(r=>({name:r.name, fields:r.fields})),
      cardMeta:[type,specs].filter(Boolean).join(' · ')
    };
  });
}

function buildBaitItem(item) {
  const manufacturer = 'Berkley';
  const model = item.name.replace(/^Berkley\s+/i,'');
  const notes = cleanMarkdown(valueByHeader(item.fields,'Status / notes'));
  const color = /color:\s*([^;]+)/i.exec(notes)?.[1]?.trim() || '';
  return {
    ...item, type:'Trout bait', subcategory:'Trout bait',
    manufacturerModel:`${manufacturer} / ${model}`,
    specifications:color ? `Color: ${color}` : 'unknown',
    links:normalizeProductLinks(item.links, manufacturer),
    cardMeta:['Trout bait', color].filter(Boolean).join(' · ')
  };
}

function buildKnotInventory() {
  const table = state.tables.knots.find(t=>normalize(t.sectionPath.at(-1)||'').includes('knots from onenote'));
  if (!table) return [];
  return table.rows.map(row => {
    const cell=valueByHeader(row,'Knot');
    const links=collectLinksFromRow(row);
    const name=extractLinks(cell)[0]?.label||cleanMarkdown(cell);
    const description=cleanMarkdown(valueByHeader(row,'OneNote guidance / source link'));
    return {
      category:'knots', type:'', subcategory:'', name,
      description, specifications:'', manufacturerModel:'',
      fields:row, links:links.map((l,i)=>({...l,label:knotLinkLabel(name,l,i,links.length)})),
      sourceSection:table.sectionPath.join(' › '), cardMeta:''
    };
  });
}

function buildCatchLog() {
  return state.tables.catches.find(t=>normalize(t.sectionPath.at(-1)||'').includes('onenote catch log'))?.rows || [];
}

function renderRoute() {
  const parts=(location.hash||'#/home').replace(/^#\//,'').split('/').filter(Boolean);
  if (parts[0]==='kb'&&parts[1]) return renderKbRecord(parts.slice(1).join('/'));
  if (parts[0]==='inventory'&&parts[1]==='item') return renderItem(parts.slice(2).join('/'));
  if (parts[0]==='inventory'&&parts[1]) return renderInventoryList(parts[1]);
  if (parts[0]==='inventory') return renderInventoryCategories();
  if (parts[0]==='plan'&&parts[1]==='result') return renderPlanResult();
  if (parts[0]==='plan') return renderPlanBuilder();
  renderHome();
}

function renderHome() {
  app.innerHTML=`<section class="hero"><h2>Fishing Companion</h2></section>
  <section class="choice-grid">
    <button class="choice-card" data-route="#/inventory"><span class="choice-icon">🎒</span><div><strong>My Gear</strong><p>Rods, reels, line, terminal tackle, lures, bait, knots, instructions, links, and catch history.</p></div></button>
    <button class="choice-card" data-route="#/plan"><span class="choice-icon">🧭</span><div><strong>Knowledge Base</strong><p>Build a fishing plan based on your location, gear, and target species.</p></div></button>
  </section>`;
  bindRouteButtons();
}

function renderInventoryCategories() {
  app.innerHTML=`${pageHeader('My Gear','Browse your inventory of equipment, tackle, bait, and your knot library','#/home')}
    <section class="category-grid">${Object.entries(CATEGORY_META).map(([k,m])=>`<button class="category-card" data-route="#/inventory/${k}"><span>${m.icon}</span><strong>${m.label}</strong></button>`).join('')}</section>`;
  bindRouteButtons();
}

function renderInventoryList(category) {
  const meta=CATEGORY_META[category];
  if (!meta) return navigate('#/inventory');
  const items=state.inventory.filter(i=>i.category===category);

  if (category==='rods-reels') return renderGroupedInventory(meta, items, ['Spinning','Baitcasting','Spincasting']);
  if (category==='line') return renderGroupedInventory(meta, items, ['Braided','Fluorocarbon','Monofilament']);

  const types=[...new Set(items.map(i=>i.type).filter(Boolean))].sort();
  const controls=listControlPolicy(category,items,types);
  app.innerHTML=`${pageHeader(meta.label,'','#/inventory')}
    ${controls.search||controls.filter?`<div class="toolbar">${controls.search?`<input class="search" id="inventorySearch" type="search" placeholder="Search ${meta.label.toLowerCase()}…" />`:''}${controls.filter?`<select class="select" id="subcategoryFilter"><option value="">All types</option>${types.map(s=>`<option value="${escapeAttr(s)}">${escapeHtml(s)}</option>`).join('')}</select>`:''}</div>`:''}
    <section class="item-list" id="itemList"></section>`;

  const search=document.querySelector('#inventorySearch');
  const filter=document.querySelector('#subcategoryFilter');
  const list=document.querySelector('#itemList');
  const draw=()=>{
    const q=normalize(search?.value||''), type=filter?.value||'';
    const filtered=items.filter(i=>(!q||searchText(i).includes(q))&&(!type||i.type===type));
    list.innerHTML=filtered.length?filtered.map(itemCardHtml).join(''):'<div class="empty">No matching records.</div>';
    bindItemCards(list);
  };
  search?.addEventListener('input',draw);
  filter?.addEventListener('change',draw);
  draw();
}

function renderGroupedInventory(meta, items, order) {
  const present = order.filter(type=>items.some(i=>i.type===type));
  app.innerHTML=`${pageHeader(meta.label,'','#/inventory')}<div class="grouped-list">${present.map(type=>`
    <section class="item-group"><h2>${escapeHtml(type)}</h2><div class="item-list">${items.filter(i=>i.type===type).map(itemCardHtml).join('')}</div></section>`).join('')}</div>`;
  bindItemCards(app);
}

function renderItem(encodedId) {
  const item=state.inventory.find(i=>i.id===decodeURIComponent(encodedId||''));
  if (!item) return navigate('#/inventory');
  if (item.category==='rods-reels') return renderSetupItem(item);
  if (item.category==='knots') return renderKnotItem(item);

  const meta=CATEGORY_META[item.category];
  const subtitle=item.type?`${meta.label} - ${item.type}`:meta.label;
  const core=renderCoreDetails(item);
  const knots=knotGuidanceForItem(item);
  const uses=usageGuidanceForItem(item);
  const showCatch=['lures','bait'].includes(item.category);
  app.innerHTML=`${pageHeader(item.name,subtitle,`#/inventory/${item.category}`)}
    <section class="panel">${core}</section>
    ${knots.length?`<section class="panel"><h3>Knots & connections</h3>${guidanceHtml(knots)}</section>`:''}
    ${uses.length?`<section class="panel"><h3>How to use it</h3>${guidanceHtml(uses)}</section>`:''}
    ${showCatch?renderCatchHistory(item):''}`;
  bindRouteButtons();
}

function renderSetupItem(item) {
  const guidance=setupGuidance(item.type);
  app.innerHTML=`${pageHeader(item.headerTitle,`Rods & Reels - ${item.type}`,'#/inventory/rods-reels')}
    ${setupComponentSection('Rod',item.rod)}
    ${setupComponentSection('Reel',item.reel)}
    ${guidance.length?`<section class="panel"><h3>How to use it</h3>${guidanceHtml(guidance)}</section>`:''}
    <section class="panel"><h3>My catch history</h3><div class="empty">Rod/reel setup was not recorded in the current catch log.</div></section>`;
  bindRouteButtons();
}

function setupComponentSection(title,component) {
  const cells=[
    detailCell('Manufacturer / Model',escapeHtml(component.manufacturerModel||'unknown')),
    detailCell('Specifications',escapeHtml(component.specifications||'unknown')),
    component.links?.length?detailCell('Links',linksHtml(component.links)):''
  ].filter(Boolean).join('');
  return `<section class="panel"><h2 class="subsection-heading">${escapeHtml(title)}</h2><div class="detail-grid">${cells}</div></section>`;
}

function renderKnotItem(item) {
  const uses=knotUsageGuidance(item);
  app.innerHTML=`${pageHeader(item.name,'Knots','#/inventory/knots')}
    <section class="panel"><div class="detail-grid">
      ${detailCell('Description',escapeHtml(item.description||'No description recorded.'))}
      ${detailCell('Links',item.links.length?linksHtml(item.links):'<span class="muted">No links recorded.</span>')}
    </div></section>
    ${uses.length?`<section class="panel"><h3>How to use it</h3>${guidanceHtml(uses)}</section>`:''}`;
  bindRouteButtons();
}

function renderCoreDetails(item) {
  const cells=[];
  if (item.manufacturerModel) cells.push(detailCell('Manufacturer / Model',escapeHtml(item.manufacturerModel)));
  if (item.specifications) cells.push(detailCell('Specifications',escapeHtml(item.specifications)));
  if (item.links?.length) cells.push(detailCell('Links',linksHtml(item.links)));
  return `<div class="detail-grid">${cells.join('')}</div>`;
}

function renderCatchHistory(item) {
  const catches=catchesForItem(item);
  const noun=item.category==='bait'?'bait':'lure';
  return `<section class="panel"><h3>My catch history</h3>${catches.length?catches.map(catchRowHtml).join(''):`<div class="empty">No catches have been recorded with this ${noun}.</div>`}</section>`;
}

function renderKbRecord(encodedId) {
  const id=decodeURIComponent(encodedId||'');
  const record=state.kbRecords.find(r=>r.id===id);
  if (!record) return navigate('#/home');
  app.innerHTML=`${pageHeader(record.name,'',null,true)}<section class="panel"><div class="markdown-snippet">${markdownToHtmlWithKbLinks(record.markdown,record.name)}</div></section>`;
  bindRouteButtons();
}

function listControlPolicy(category,items,types) {
  if (category==='lures') return {search:true,filter:true};
  if (category==='hooks') return {search:false,filter:true};
  if (['bait','knots','weights','snaps-swivels','line','rods-reels'].includes(category)) return {search:false,filter:false};
  return {
    search:items.length>=12,
    filter:types.length>=3 && items.length>=8
  };
}

function itemCardHtml(item) {
  const meta=item.cardMeta||'';
  return `<article class="item-card" data-item-id="${escapeAttr(item.id)}"><h3>${escapeHtml(item.name)}</h3>${meta?`<div class="item-meta"><span>${escapeHtml(meta)}</span></div>`:''}</article>`;
}

function bindItemCards(root=document) {
  root.querySelectorAll('[data-item-id]').forEach(el=>el.addEventListener('click',()=>navigate(`#/inventory/item/${encodeURIComponent(el.dataset.itemId)}`)));
}

function detailCell(label,valueHtml) {
  return `<div class="detail-cell"><div class="label">${escapeHtml(label)}</div><div class="value">${valueHtml}</div></div>`;
}

function linksHtml(links) {
  return `<div class="detail-links">${uniqueLinks(links).map(l=>l.url?`<a href="${escapeAttr(l.url)}" target="_blank" rel="noopener">${escapeHtml(l.label||'Website')} ↗</a>`:`<span class="muted">${escapeHtml(l.label||'Unknown')}</span>`).join('<br>')}</div>`;
}

function guidanceHtml(items) {
  return items.map(item=>`<div class="recommendation">${item.title?`<h4>${escapeHtml(item.title)}</h4>`:''}<div class="guidance-body">${item.html||`<p>${escapeHtml(item.text||'')}</p>`}</div></div>`).join('');
}

function setupGuidance(type) {
  if (type==='Spinning') return [{
    title:'Use spinning gear when:',
    html:`<ul>
      <li>You’re fishing light baits such as wacky worms, drop shots, Ned rigs, small jerkbaits, or inline spinners.</li>
      <li>You need to cast very light lures far.</li>
      <li>You’re fishing clear water and want to use 6–10 lb fluorocarbon for stealth.</li>
      <li>You’re fishing windy conditions, where spinning reels handle wind better and avoid backlash.</li>
      <li>You’re vertical jigging or fishing from a kayak, where easy one-handed control helps.</li>
    </ul>`
  },{
    title:'Typical spinning combo:',
    html:`<ul><li>Rod: Medium-light to medium power, fast action, 6'6"–7'2".</li><li>Reel: 2500–3000 size spinning reel.</li><li>Line: 10–15 lb braid + 6–10 lb fluorocarbon leader.</li></ul>`
  }];
  if (type==='Baitcasting') return [{
    title:'Use baitcasting gear when:',
    html:`<ul>
      <li>You’re throwing heavier lures such as spinnerbaits, chatterbaits, crankbaits, swimbaits, or topwaters.</li>
      <li>You’re fishing thick cover such as weeds, wood, or docks and need to horse fish out.</li>
      <li>You’re targeting larger fish with heavier line: 15+ lb fluorocarbon or 30+ lb braid.</li>
      <li>You need pinpoint casting accuracy, such as skipping under docks or hitting tight shoreline targets.</li>
      <li>You want instant power transfer on hooksets.</li>
    </ul>`
  },{
    title:'Baitcaster Reel Setup & Casting',
    html:`<ul>
      <li>Set the internal line-type dial for mono (M), fluorocarbon (F), or braid/PE (P). This defines the braking range; it does not have to match the line type exactly.</li>
      <li>With a lure attached, hold the rod tip up and press the clutch. Set spool tension so the lure drops at a medium, controlled speed.</li>
      <li>Use W/4 for lightweight lures or wind; 3 or lower for heavier lures and calm conditions.</li>
      <li>Thumb the spool at splashdown to avoid backlash.</li>
    </ul>`
  }];
  const section=findSection('knots','Spincast / shore trout setup');
  return section?[{title:'Best use',html:markdownToHtml(section.content.split('Avoid braid')[0])}]:[];
}

function knotGuidanceForItem(item) {
  if (item.category==='line') return lineKnotGuidance(item.type);
  if (item.category==='snaps-swivels') return snapKnotGuidance(item.type);
  if (item.category==='hooks') return hookKnotGuidance(item);
  if (item.category==='lures') return lureKnotGuidance(item);
  return [];
}

function lineKnotGuidance(type) {
  if (type==='Braided') return [{
    html:`<ul>
      <li>To leader: use an ${kbOrTextLink('FG knot','FG')} or ${kbOrTextLink('Albright knot','Albright')} when you need an easier on-the-water alternative.</li>
      <li>To snap: use a ${kbOrTextLink('Palomar knot','Palomar')}.</li>
      <li>To lure: use a ${kbOrTextLink('Palomar knot','Palomar')} or ${kbOrTextLink('Modified Uni knot','Modified Uni')} for direct topwater applications; otherwise use a leader.</li>
    </ul>`
  }];
  if (type==='Fluorocarbon') return [{
    html:`<ul>
      <li>To swivel or snap: use a ${kbOrTextLink('Trilene knot','Trilene')}.</li>
      <li>To hook: use an ${kbOrTextLink('Improved Clinch knot','Improved Clinch')} or a ${kbOrTextLink('Palomar knot','Palomar')} for heavier tackle.</li>
      <li>To lure: use a snap when more action is desired; otherwise use a ${kbOrTextLink('Palomar knot','Palomar')}.</li>
      <li>Wet fluorocarbon knots before tightening.</li>
    </ul>`
  }];
  return [{
    html:`<ul>
      <li>To swivel or snap: use an ${kbOrTextLink('Improved Clinch knot','Improved Clinch')}.</li>
      <li>To hook: use an ${kbOrTextLink('Improved Clinch knot','Improved Clinch')} or a ${kbOrTextLink('Palomar knot','Palomar')} for heavier tackle.</li>
      <li>To lure: use a snap when more action is desired; otherwise use a ${kbOrTextLink('Palomar knot','Palomar')}.</li>
    </ul>`
  }];
}

function snapKnotGuidance(type) {
  if (type==='Swivels') return [{html:`<p>Use a ${kbOrTextLink('Trilene knot','Trilene')} when using a swivel on a fluorocarbon line.</p>`}];
  if (type==='Snaps') return [{html:`<p>Use a ${kbOrTextLink('Trilene knot','Trilene')} when using a snap on a fluorocarbon line.</p>`}];
  return [{html:`<p>When fluorocarbon is tied to the swivel end, use a ${kbOrTextLink('Trilene knot','Trilene')}.</p>`}];
}

function hookKnotGuidance(item) {
  const n=normalize(item.name);
  if (/octopus hook|weedless wacky neko|crossover rings/.test(n)) return [{
    html:`<p>When using with a ${kbLinkByName('Wacky worm','Wacky Worm')}, tie directly to a leader with a ${knotItemLink('Palomar knot','Palomar')}.</p>`
  }];
  if (/finesse shroom/.test(n)) return [{html:`<p>When using with a ${kbLinkByName('Ned rig','Ned rig')}, tie directly with a ${knotItemLink('Palomar knot','Palomar')}.</p>`}];
  if (/g finesse drop shot/.test(n)) return [{html:`<p>Use the knot and hook orientation described on the ${kbLinkByName('Drop shot','Drop shot')} page.</p>`}];
  return [];
}

function lureKnotGuidance(item) {
  const type=normalize(item.type), name=normalize(item.name);
  if (type.includes('chatterbait') || name.includes('chatterbait')) return [{
    html:`<p>Tie line directly to the lure using a ${knotItemLink('Palomar knot','Palomar')}. No snap or swivel; it can disrupt blade startup and vibration. Use a ${knotItemLink('loop knot','Loop / non-slip loop')} in cold water or finesse situations to let the blade swing more freely. Retie often, as vibrations stress the knot.</p>`
  }];
  if (type.includes('inline spinner')) return [{
    html:`<p><strong>Tackle:</strong> If using only fluorocarbon or monofilament line, use a swivel about 12–18 inches ahead of the lure and don't add a dressing. Add a snap if changing lures.<br><code>Mainline → swivel → 12–18” leader → snap (optional) → lure</code></p>
    <p>If using braided line and a leader, insert a swivel in the leader.<br><code>Mainline → 12–18” leader → swivel → 12–18” leader → snap (optional) → lure</code></p>
    <p><strong>Knot:</strong> ${knotItemLink('Improved Clinch','Improved Clinch')}. Retie often, as vibrations stress the knot over time.</p>`
  }];
  const row=state.connectionRows.find(r=>connectionMatchesItem(r,item));
  if (!row) return [];
  return [{html:`<p>${escapeHtml(cleanMarkdown(valueByHeader(row,'Connection')))}. ${escapeHtml(cleanMarkdown(valueByHeader(row,'Swivel use')))}</p>`}];
}

function usageGuidanceForItem(item) {
  if (item.category==='line') return lineUsageGuidance(item.type);
  if (item.category==='weights') return weightUsageGuidance(item.type);
  if (item.category==='snaps-swivels') return snapUsageGuidance(item.type);
  if (item.category==='hooks') return hookUsageGuidance(item);
  if (item.category==='lures') return lureUsageGuidance(item);
  if (item.category==='bait') return baitUsageGuidance(item);
  return [];
}

function lineUsageGuidance(type) {
  const target=type==='Braided'?'Braid':type;
  const section=findSection('knots',target,'Line material notes');
  return section?[{html:markdownToHtml(section.content)}]:[];
}

function weightUsageGuidance(type) {
  if (type==='Cylinder weights') return [{html:`<p>Used with a ${kbLinkByName('Drop shot','Drop shot rig')}.</p>`}];
  if (type==='Egg sinkers') return [{html:`<p>Used with a ${kbLinkByName('Slip sinker rig','Slip sinker rig')}.</p>`}];
  if (type==='Swiveling trolling / torpedo weights') return [{html:`<p>Used for kayak trolling in ${kbLinkByName('Trout fishing','trout fishing')}.</p>`}];
  if (type==='Glass beads') return [{html:`<p>Used between the egg sinker and swivel in a ${kbLinkByName('Slip sinker rig','slip sinker rig')}.</p>`}];
  return [];
}

function snapUsageGuidance(type) {
  const section=findSection('knots',type,'Snaps and swivels');
  if (section) return [{html:markdownToHtml(section.content)}];
  if (type==='Snaps') return [{html:`<ul>
    <li>Snaps have a weight rating; use a snap rated appropriately for the line.</li>
    <li>Use a snap to switch quickly between lures or when the bait has a tie point with edges.</li>
    <li>Use a snap with fast-moving lures that will be retrieved quickly or trolled.</li>
    <li>Do not use a snap with live or jig bait worked slowly; tie directly so the presentation stays natural.</li>
    <li>Do not use a snap with a weedless presentation because it can catch weeds; tie directly to the hook.</li>
    <li>Do not use snaps or swivels with floating/topwater bait when the added weight could pull it down.</li>
  </ul>`}];
  if (type==='Swivels') return [{html:`<ul>
    <li>Use a swivel to prevent line twist with spinning lures such as spoons, spinners, and flashers, or with a vertical jigging lure that swims in a circle.</li>
    <li>Ball-bearing swivels are preferred over barrel swivels for connecting lures and leaders when using monofilament and when spinning or trolling.</li>
    <li>A barrel swivel is acceptable for sinker rigs or for connecting a monofilament leader to braid, although a direct line-to-line knot is preferable when practical so a swivel cannot strike the rod guides.</li>
  </ul>`}];
  if (type==='Snap swivels') return [{html:`<ul>
    <li>Avoid connecting snap swivels directly to a lure because they add weight and can look unnatural.</li>
    <li>They may be acceptable with spinners and spoons that are changed frequently because those lures already carry substantial hardware.</li>
  </ul>`}];
  return [];
}

function hookUsageGuidance(item) {
  const n=normalize(item.name);
  const rows=[];
  if (/octopus hook|weedless wacky neko|crossover rings/.test(n)) rows.push({html:`<p>This item is commonly used with a ${kbLinkByName('Wacky worm','Wacky Worm')}.</p>`});
  if (/finesse shroom/.test(n)) rows.push({html:`<p>This hook is commonly used with a ${kbLinkByName('Ned rig','Ned rig')}.</p>`});
  if (/g finesse drop shot/.test(n)) rows.push({html:`<p>This hook is used with a ${kbLinkByName('Drop shot','Drop shot rig')}.</p>`});
  if (/twistlock|ewg worm/.test(n)) rows.push({html:`<p>Use with soft-plastic presentations; see the relevant lure/technique page for rig-specific instructions.</p>`});
  if (/swimbait jig/.test(n)) rows.push({html:`<p>Use with swimbaits and other jighead-mounted soft plastics.</p>`});
  if (/bait hooks|aberdeen/.test(n)) rows.push({html:`<p>Used for ${kbLinkByName('Trout fishing','trout fishing')} and other natural-bait presentations.</p>`});
  return rows;
}

function lureUsageGuidance(item) {
  const type=normalize(item.type), name=normalize(item.name);
  if (type.includes('inline spinner')) return [{
    title:'Use',
    html:`<ul>
      <li>Use in clear, cold rivers, creeks, and lakes; the tight wobble and flash excels when fish are finicky.</li>
      <li>Best in open water along the deep edge of cover, over the top of cover, or along the edge of current in a river.</li>
      <li>Don't use in heavy cover; inline spinners do not deflect well and can snag easily.</li>
    </ul>`
  },{
    title:'Technique',
    html:`<ul>
      <li>After casting, pop the rod tip to get the blade spinning.</li>
      <li>Retrieve at a constant rate, keeping the lure just under the surface or a few feet down.</li>
      <li>Adjust speed so the blade barely flashes under the surface for a natural presentation.</li>
      <li>Retrieve slowly in cold water and faster in warm water.</li>
      <li>In rivers and streams, cast upstream at about a 1:00 or 11:00 angle and guide the spinner past cover and obstructions.</li>
    </ul>`
  },{
    title:'Color',
    html:`<ul><li>Clear water: silver, copper, or natural finishes.</li><li>Stained water: gold, chartreuse, or black with bright dots.</li><li>Low light: glow, fluorescent, or UV-painted blades.</li></ul>`
  }];
  const candidates=[
    ['chatterbait','Chatterbait / bladed jig'],
    ['spinnerbait','Spinnerbait'],
    ['crankbait','Crankbait'],
    ['jerkbait','Jerkbait'],
    ['jig','Jigs'],
    ['wacky','Wacky worm'],
    ['ned','Ned rig'],
    ['drop shot','Drop shot'],
    ['topwater','Topwater']
  ];
  const hit=candidates.find(([needle])=>type.includes(needle)||name.includes(needle));
  if (!hit) return [];
  const section=findSection('techniques',hit[1]);
  return section?[{html:filteredTechniqueHtml(section.content)}]:[];
}

function baitUsageGuidance(item) {
  const n=normalize(item.name);
  if (/trout dough|trout nuggets/.test(n)) return [{html:`<p>Use with a ${kbLinkByName('Slip sinker rig','slip sinker rig')} for ${kbLinkByName('Trout fishing','trout fishing')}.</p>`}];
  if (/power eggs/.test(n)) {
    const spoon=findInventoryByName('Dick Nite spoon');
    return [
      {html:`<p>Use in trout trolling rigs; see ${kbLinkByName('Trout fishing','Trout fishing')} for the overall setup.</p>`},
      {html:`<p>Power Eggs can also be used when trout fishing with spoons${spoon?`, including the ${itemInternalLink(spoon,'Dick Nite spoon')}`:', including Dick Nite spoons'}.</p>`}
    ];
  }
  return [];
}

function knotUsageGuidance(item) {
  const n=normalize(item.name);
  if (n==='palomar') return [
    {html:`<p>Used for direct ties in the ${kbLinkByName('Wacky worm','Wacky Worm')}, ${kbLinkByName('Ned rig','Ned rig')}, and ${kbLinkByName('Chatterbait / bladed jig','Chatterbait')} techniques.</p>`},
    {html:`<p>Also used for braid to snaps and for many direct lure or hook connections where the current KB calls for a strong terminal knot.</p>`}
  ];
  if (n==='fg') return [{html:`<p>Preferred for connecting ${inventoryCategoryLink('Line','line')} braid to a fluorocarbon leader.</p>`}];
  if (n==='albright') return [{html:`<p>Easier on-the-water alternative for connecting braid to a fluorocarbon leader; see ${inventoryCategoryLink('Line','line')}.</p>`}];
  if (n==='trilene') return [{html:`<p>Used to connect fluorocarbon to ${inventoryCategoryLink('snaps and swivels','snaps-swivels')}.</p>`}];
  if (n==='improved clinch') return [{html:`<p>Used with ${kbLinkByName('Inline spinners','inline spinners')} and for many monofilament/fluorocarbon connections to small hooks, snaps, and swivels.</p>`}];
  if (n==='modified uni') return [{html:`<p>Saved guidance uses this as a direct braid-to-lure option for topwater fishing.</p>`}];
  if (n==='double uni') return [{html:`<p>Used to connect two lines together, though the current KB prefers the FG for braid-to-leader connections; see ${inventoryCategoryLink('Line','Line')}.</p>`}];
  if (n.includes('loop')) return [
    {html:`<p>Some lure guidance, including ${kbLinkByName('Chatterbait / bladed jig','Chatterbait')}, uses a loop knot when extra lure freedom is desired.</p>`},
    {html:`<p><strong>Caution:</strong> the saved knot guidance also says not to use this knot because it is weak. This conflict remains unresolved.</p>`}
  ];
  if (n==='single uni') return [{html:`<p><strong>Caution:</strong> no recommended use is currently recorded; the saved knot guidance marks this knot as weak.</p>`}];
  if (n==='arbor') return [{html:`<p>Used when spooling ${inventoryCategoryLink('fishing line','line')} onto a reel.</p>`}];
  return [];
}

function filteredTechniqueHtml(markdown) {
  const lines=markdown.split('\n');
  const keep=[];
  let skip=false;
  for (const raw of lines) {
    const line=raw.trim();
    if (/^(Gear|Current gear|Rigging):?$/i.test(line)) {skip=true; continue;}
    if (/^(Technique|Use|Colors?|Trailers?|Weight rules?|Leader from hook to weight):?$/i.test(line)) {skip=false; keep.push(`**${line.replace(/:$/,'')}**`); continue;}
    if (skip && !/^[A-Z][A-Za-z /&-]+:$/.test(line)) continue;
    if (/^OneNote linked|^OneNote source resources/i.test(line)) continue;
    if (line) keep.push(raw);
  }
  return markdownToHtml(keep.slice(0,28).join('\n'));
}

function renderPlanBuilder() {
  const saved=readPlanDraft();
  const lureOptions=state.inventory.filter(i=>['lures','bait'].includes(i.category)).sort((a,b)=>a.name.localeCompare(b.name));
  app.innerHTML=`${pageHeader('Build a Fishing Plan','Start anywhere. Every selection adds context and narrows the same plan.','#/home')}
  <section class="plan-form">
    <div class="form-card"><label>📍 Where</label><div class="hint">Location-specific structure and historical notes will be prioritized.</div><select class="input" id="planLocation"><option value="">Not specified</option>${state.locations.map(l=>optionHtml(l.name,saved.location)).join('')}</select></div>
    <div class="form-row"><div class="form-card"><label>📅 Date</label><div class="hint">Used to infer season.</div><input class="input" id="planDate" type="date" value="${escapeAttr(saved.date||todayLocal())}" /></div><div class="form-card"><label>🕓 Time of day</label><div class="hint">Used for morning/midday/evening notes.</div><select class="input" id="planTime">${['','Dawn / early morning','Morning','Midday','Afternoon','Evening / dusk','Night'].map(v=>optionHtml(v||'Not specified',saved.time,v)).join('')}</select></div></div>
    <div class="form-card"><label>🐟 Target species</label><div class="hint">Leave blank if the water or setup should drive the plan.</div><select class="input" id="planSpecies"><option value="">Not specified</option>${SPECIES.map(s=>optionHtml(s,saved.species)).join('')}</select></div>
    <div class="form-card"><label>🎣 Gear setup</label><div class="hint">Choose a current setup if you already know which rod/reel you want.</div><select class="input" id="planSetup"><option value="">Not specified</option>${state.setups.map(s=>optionHtml(s.name,saved.setup)).join('')}</select></div>
    <div class="form-card"><label>🧰 Lure or bait already tied on</label><div class="hint">Optional; this strongly biases the plan toward using that item.</div><select class="input" id="planItem"><option value="">Not specified</option>${lureOptions.map(i=>`<option value="${escapeAttr(i.id)}" ${saved.itemId===i.id?'selected':''}>${escapeHtml(i.name)}${i.type?` — ${escapeHtml(i.type)}`:''}</option>`).join('')}</select></div>
  </section><div class="plan-actions"><button class="primary-button" id="buildPlanButton">Build my fishing plan</button></div>`;
  document.querySelector('#buildPlanButton').addEventListener('click',()=>{
    const draft={location:document.querySelector('#planLocation').value,date:document.querySelector('#planDate').value,time:document.querySelector('#planTime').value,species:document.querySelector('#planSpecies').value,setup:document.querySelector('#planSetup').value,itemId:document.querySelector('#planItem').value};
    localStorage.setItem('fishing-plan-draft',JSON.stringify(draft));
    state.currentPlan=buildPlan(draft);
    navigate('#/plan/result');
  });
}

function renderPlanResult() {
  const plan=state.currentPlan||buildPlan(readPlanDraft()); state.currentPlan=plan;
  const c=plan.context; const title=[c.location,c.species,c.time].filter(Boolean).join(' · ')||'Fishing Plan';
  app.innerHTML=`<div class="plan-header"><button class="back-button" data-route="#/plan">← Adjust plan</button><h2>${escapeHtml(title)}</h2><p>${escapeHtml(plan.contextSummary)}</p></div>
  <section class="panel"><h3>Where to fish</h3>${plan.where.length?`<span class="badge inference">🧭 App inference</span><ul>${plan.where.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul>`:'<div class="empty">Choose a location for structure-specific targets.</div>'}</section>
  <section class="panel"><h3>Gear, lures & bait</h3>${plan.setup?`<div class="recommendation"><span class="badge inference">🎣 App inference</span><h4>${escapeHtml(plan.setup.name)}</h4><p>${escapeHtml(setupSummary(plan.setup))}</p></div>`:''}${plan.items.length?plan.items.map(x=>`<div class="recommendation"><span class="badge inference">🧰 App inference</span><h4>${escapeHtml(x.item.name)}</h4><p>${escapeHtml(x.reason)}</p><button class="secondary-button" data-item-open="${escapeAttr(x.item.id)}">Open item</button></div>`).join(''):'<div class="empty">Add a species, location, or lure for owned-tackle recommendations.</div>'}</section>
  <section class="panel"><h3>Rig & knots</h3>${plan.knots.length?guidanceHtml(plan.knots):'<div class="empty">No explicit knot guidance could be derived for this combination.</div>'}</section>
  <section class="panel"><h3>Techniques</h3>${plan.techniques.length?plan.techniques.map(t=>`<div class="recommendation"><span class="badge inference">🧠 App inference</span><h4>${escapeHtml(t.technique.name)}</h4><div class="markdown-snippet">${markdownExcerpt(t.technique.markdown)}</div></div>`).join(''):'<div class="empty">Add more context to rank techniques.</div>'}</section>
  <section class="panel"><h3>Species in this context</h3>${plan.species.length?`<ul>${plan.species.map(s=>`<li>${escapeHtml(titleCase(s))}</li>`).join('')}</ul>`:'<div class="empty">No species inferred.</div>'}</section>
  <section class="panel"><h3>Similar results from my catch log</h3>${plan.history.length?plan.history.map(h=>`<div class="recommendation"><span class="badge observed">✓ User observed</span>${catchRowHtml(h.row)}<div class="score">Similarity score ${h.score}</div></div>`).join(''):'<div class="empty">No sufficiently similar logged catches yet.</div>'}</section>
  <section class="panel"><h3>How this plan was assembled</h3><p><span class="badge">📚 Curated KB</span> is directly sourced from Markdown. <span class="badge observed">✓ User observed</span> is catch-log evidence. <span class="badge inference">🧠 App inference</span> is deterministic ranking/combination of existing knowledge, not a new historical fact.</p></section>`;
  bindRouteButtons();
  document.querySelectorAll('[data-item-open]').forEach(b=>b.addEventListener('click',()=>navigate(`#/inventory/item/${encodeURIComponent(b.dataset.itemOpen)}`)));
}

function buildPlan(context) {
  const location=state.locations.find(l=>l.name===context.location), selectedItem=state.inventory.find(i=>i.id===context.itemId), selectedSetup=state.setups.find(s=>s.name===context.setup), season=seasonForDate(context.date), locationText=normalize(location?.text||''), speciesTerms=speciesAliases(context.species);
  const techniques=state.techniques.map(technique=>{ const text=normalize(`${technique.name} ${technique.text}`); let score=0; if(context.species&&speciesTerms.some(t=>text.includes(t)))score+=5; if(context.species?.toLowerCase().includes('bass')&&text.includes('bass'))score+=2; if(location&&techniqueMentioned(locationText,technique.name))score+=6; if(selectedItem&&textMatchesItem(text,selectedItem))score+=8; if(selectedSetup&&text.includes(normalize(selectedSetup.name).split(' ')[0]))score+=2; if(season&&text.includes(season))score+=1; return {technique,score}; }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,5);
  let setup=selectedSetup;
  if(!setup&&techniques.length){const combined=normalize(techniques.map(t=>t.technique.text).join(' ')); const spinning=countOccurrences(combined,'spinning'), bait=countOccurrences(combined,'baitcast'); setup=state.setups.find(s=>normalize(s.name).includes(spinning>=bait?'spinning':'baitcasting'));}
  const items=state.inventory.filter(i=>['lures','bait'].includes(i.category)).map(item=>{let score=0;const reasons=[];if(selectedItem?.id===item.id){score+=100;reasons.push('already selected');}if(location&&textMatchesItem(locationText,item)){score+=7;reasons.push(`named in ${location.name} notes`);}for(const t of techniques){if(textMatchesItem(normalize(t.technique.text),item)){score+=5;reasons.push(`used with ${t.technique.name}`);}if(normalize(item.type).includes(normalize(t.technique.name))){score+=3;reasons.push(`matches ${t.technique.name}`);}}return {item,score,reasons:[...new Set(reasons)]};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,8).map(x=>({item:x.item,reason:x.reasons.join('; ')||'Matches selected context.'}));
  const primary=selectedItem||items[0]?.item;
  const where=location?extractStructureTargets(location.markdown,context.time).slice(0,8):[];
  const history=scoreCatchHistory(context,selectedItem).slice(0,5);
  const species=inferSpecies(location?.text||techniques.map(t=>t.technique.text).join(' '),context.species);
  const bits=[context.location,context.date?`${season} ${context.date}`.trim():'',context.time,context.species?`targeting ${context.species}`:'',selectedItem?`starting with ${selectedItem.name}`:''].filter(Boolean);
  return {context,contextSummary:bits.join(' · ')||'Broad knowledge-base plan',where,setup,items,knots:planKnotGuidance(setup,primary,techniques.map(t=>t.technique)),techniques,species,history};
}

function planKnotGuidance(setup,item,techniques) {
  const out=[];
  if(setup){
    const text=normalize(setup.text);
    const row=state.braidLeaderRows.find(r=>{const s=normalize(valueByHeader(r,'Setup'));return(text.includes('15 lb')&&s.includes('15 lb'))||(text.includes('30 lb')&&s.includes('30 lb'));});
    if(row)out.push({title:'Main line → leader',text:`${cleanMarkdown(valueByHeader(row,'Preferred knot'))} preferred; ${cleanMarkdown(valueByHeader(row,'Easier field knot'))} is the easier field alternative. ${cleanMarkdown(valueByHeader(row,'Notes'))}`});
  }
  if(item)out.push(...knotGuidanceForItem(item).slice(0,2));
  const explicit=extractKnotSentences(techniques.map(t=>t.text).join('\n')); explicit.slice(0,2).forEach(text=>out.push({title:'Technique-specific knot note',text}));
  return dedupeGuidance(out);
}

function catchesForItem(item) {
  return state.catches.filter(r=>textMatchesItem(normalize(valueByHeader(r,'Gear used')),item));
}

function scoreCatchHistory(context,item) {
  const terms=speciesAliases(context.species),month=context.date?.slice(5,7);
  return state.catches.map(row=>{let score=0;const water=normalize(valueByHeader(row,'Water')),result=normalize(valueByHeader(row,'Results')),conditions=normalize(valueByHeader(row,'Conditions'));if(context.location&&water.includes(normalize(context.location).replace(/ wa$/,'')))score+=8;if(context.species&&terms.some(t=>result.includes(t)))score+=7;if(item&&textMatchesItem(normalize(valueByHeader(row,'Gear used')),item))score+=8;if(month&&valueByHeader(row,'Date')?.slice(5,7)===month)score+=2;if(context.time&&conditions.includes(normalize(context.time).split(' ')[0]))score+=1;return{row,score};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
}

function extractStructureTargets(markdown,time) {
  const tw=normalize(time||'').split(' ')[0];
  const rows=markdown.split('\n').map(x=>x.trim()).filter(x=>/^[-*]\s+/.test(x)).map(line=>{const text=cleanMarkdown(line.replace(/^[-*]\s+/,'')),norm=normalize(text);let score=STRUCTURE_TERMS.reduce((n,t)=>n+(norm.includes(t)?1:0),0);if(tw&&norm.includes(tw))score+=2;if(/launch:|caught|source/i.test(text))score-=2;return{text,score};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
  return [...new Map(rows.map(x=>[normalize(x.text),x.text])).values()];
}

function inferSpecies(text,selected) {
  const norm=normalize(text),out=[];
  if(selected)out.push(selected.toLowerCase());
  FISH_TERMS.forEach(f=>{if(norm.includes(normalize(f)))out.push(f);});
  return [...new Set(out)].slice(0,8);
}

function techniqueMentioned(text,name) {
  const n=normalize(name);
  if(text.includes(n))return true;
  const words=n.split(' ').filter(w=>w.length>3);
  return words.length&&words.every(w=>text.includes(w));
}

function speciesAliases(s) {
  s=normalize(s||'');
  if(!s)return[];
  if(s.includes('largemouth'))return['largemouth','bass'];
  if(s.includes('smallmouth'))return['smallmouth','bass'];
  if(s.includes('cutthroat'))return['cutthroat','trout'];
  if(s.includes('rainbow'))return['rainbow','trout'];
  if(s==='trout')return['trout','rainbow','cutthroat'];
  return[s];
}

function setupSummary(setup) {
  const t=setup.tables?.[0];
  if(t?.rows?.length)return t.rows.map(r=>`${cleanMarkdown(valueByHeader(r,'Component'))}: ${cleanMarkdown(valueByHeader(r,'Details'))}`).filter(Boolean).slice(0,5).join(' · ');
  return setup.text.slice(0,420);
}

function catchRowHtml(row) {
  const date=cleanMarkdown(valueByHeader(row,'Date')),water=cleanMarkdown(valueByHeader(row,'Water')),result=cleanMarkdown(valueByHeader(row,'Results')),gear=cleanMarkdown(valueByHeader(row,'Gear used')),conditions=cleanMarkdown(valueByHeader(row,'Conditions'));
  return`<div class="recommendation"><h4>${escapeHtml(result||'Logged outing')}</h4><p><strong>${escapeHtml(water)}</strong>${date?` · ${escapeHtml(date)}`:''}</p><p>${escapeHtml(gear)}${conditions?` · ${escapeHtml(conditions)}`:''}</p></div>`;
}

function pageHeader(title,subtitle='',back='#/home',historyBack=false) {
  return `<div class="section-title"><div><h2>${escapeHtml(title)}</h2>${subtitle?`<p>${escapeHtml(subtitle)}</p>`:''}</div>${historyBack?'<button class="back-button" data-history-back>← Back</button>':back?`<button class="back-button" data-route="${escapeAttr(back)}">← Back</button>`:''}</div>`;
}

function bindRouteButtons() {
  document.querySelectorAll('[data-route]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.route)));
  document.querySelectorAll('[data-history-back]').forEach(b=>b.addEventListener('click',()=>history.back()));
}

function navigate(hash) {
  if(location.hash===hash)renderRoute();else location.hash=hash;
  window.scrollTo({top:0,behavior:'smooth'});
}

function updateOnlineStatus() {
  statusDot.classList.toggle('offline',!navigator.onLine);
  statusDot.title=navigator.onLine?'Online':'Offline — cached knowledge remains available';
}

async function registerServiceWorker() {
  if('serviceWorker'in navigator)try{await navigator.serviceWorker.register('./sw.js');}catch(e){console.warn(e);}
}

function readPlanDraft(){try{return JSON.parse(localStorage.getItem('fishing-plan-draft')||'{}');}catch{return{};}}
function todayLocal(){const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function seasonForDate(s){const m=Number(s?.slice(5,7));return[12,1,2].includes(m)?'winter':[3,4,5].includes(m)?'spring':[6,7,8].includes(m)?'summer':[9,10,11].includes(m)?'fall':'';}

function findSection(key,title,parentTitle='') {
  const target=normalize(title), parent=normalize(parentTitle);
  return state.sections[key]?.find(s=>normalize(s.title)===target && (!parent || s.path.slice(0,-1).map(normalize).includes(parent)));
}

function parseSections(markdown,sourceKey) {
  const lines=markdown.split(/\r?\n/),heads=[],stack=[];
  lines.forEach((line,i)=>{const m=/^(#{1,6})\s+(.+?)\s*$/.exec(line);if(!m)return;const level=m[1].length,title=cleanMarkdown(m[2]);stack.length=level-1;stack[level-1]=title;heads.push({level,title,startLine:i,path:stack.filter(Boolean).slice(),sourceKey});});
  return heads.map((h,i)=>{let end=lines.length-1;for(let j=i+1;j<heads.length;j++)if(heads[j].level<=h.level){end=heads[j].startLine-1;break;}return{...h,endLine:end,content:lines.slice(h.startLine+1,end+1).join('\n').trim()};});
}

function parseTables(markdown,sections,sourceKey) {
  const lines=markdown.split(/\r?\n/),out=[];
  for(let i=0;i<lines.length-1;i++){
    if(!/^\s*\|/.test(lines[i])||!/^\s*\|?\s*:?-{3,}/.test(lines[i+1]))continue;
    const headers=splitTableRow(lines[i]).map(cleanMarkdown),rows=[];let j=i+2;
    while(j<lines.length&&/^\s*\|/.test(lines[j])){const cells=splitTableRow(lines[j]),row={};headers.forEach((h,k)=>row[h]=cells[k]??'');rows.push(row);j++;}
    const section=sections.filter(s=>s.startLine<=i&&s.endLine>=i).sort((a,b)=>b.level-a.level)[0];
    out.push({headers,rows,startLine:i,endLine:j-1,sectionPath:section?.path||[],sourceKey});i=j-1;
  }
  return out;
}

function splitTableRow(line) {
  const s=line.trim().replace(/^\|/,'').replace(/\|$/,''),cells=[];let cur='',esc=false;
  for(const ch of s){if(esc){cur+=ch;esc=false;continue;}if(ch==='\\'){cur+=ch;esc=true;continue;}if(ch==='|'){cells.push(cur.trim());cur='';continue;}cur+=ch;}
  cells.push(cur.trim());return cells;
}

function tableRowsInSection(key,title){const n=normalize(title);return state.tables[key].filter(t=>normalize(t.sectionPath.at(-1)||'')===n).flatMap(t=>t.rows);}
function valueByHeader(row,wanted){const k=Object.keys(row||{}).find(x=>normalize(x)===normalize(wanted));return k?row[k]:'';}
function extractLinks(md=''){const out=[];for(const m of String(md).matchAll(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g))out.push({label:cleanMarkdown(m[1]),url:m[2]});return out;}
function collectLinksFromRow(row){return Object.values(row||{}).flatMap(extractLinks);}
function uniqueLinks(links){const s=new Set();return (links||[]).filter(l=>{if(!l)return false;const key=l.url||`missing:${normalize(l.label||'')}`;if(!key||s.has(key))return false;s.add(key);return true;});}
function uniqueStrings(values){const seen=new Set();return values.filter(v=>{const n=normalize(v);if(!n||seen.has(n))return false;seen.add(n);return true;});}
function dedupeBy(values,keyFn){const map=new Map();for(const v of values){const k=keyFn(v);if(!map.has(k))map.set(k,v);}return [...map.values()];}

function stableItemId(item){return slug(`${item.category}-${item.type||''}-${item.name}-${item.specifications||''}`);}
function searchText(item){return normalize(`${item.name} ${item.type||''} ${item.manufacturerModel||''} ${item.specifications||''} ${item.aliases?.join(' ')||''}`);}

function itemAliases(item) {
  const out=new Set([normalize(item.name),...(item.aliases||[])]);
  if (item.variants) item.variants.forEach(v=>out.add(normalize(v.name)));
  const brands=['z man','strike king','berkley','rapala','river2sea','booyah','gamakatsu','vmc','owner','mack s','mepps','panther martin','yamamoto','6th sense','rebel','daiwa','shimano','seaguar','sufix','powerpro','pflueger','kastmaster','dick nite'];
  for(const name of [...out]) {
    for(const b of brands) if(name.startsWith(`${b} `)) out.add(name.slice(b.length+1));
    const words=name.split(' ').filter(w=>w.length>2);if(words.length>=2)out.add(words.slice(-2).join(' '));
  }
  return [...out].filter(x=>x.length>=4);
}

function textMatchesItem(text,item){return itemAliases(item).some(a=>text.includes(a));}

function connectionMatchesItem(row,item) {
  const type=normalize(valueByHeader(row,'Lure type')), sub=normalize(item.type), name=normalize(item.name);
  return type&&(sub.includes(type.replace(/s$/,''))||type.includes(sub.replace(/s$/,''))||name.includes(type.replace(/s$/,''))||connectionAlias(type,sub));
}

function connectionAlias(type,sub){
  return(type.includes('crankbait')&&sub.includes('crankbait'))||(type.includes('hard jerkbait')&&sub.includes('jerkbait'))||(type.includes('spoon')&&sub.includes('spoon'))||(type.includes('inline spinner')&&sub.includes('inline spinner'))||(type.includes('spinnerbait')&&sub.includes('spinnerbait'))||(type.includes('chatterbait')&&sub.includes('chatterbait'))||(type.includes('wacky ned drop shot')&&/wacky|ned|drop shot/.test(sub))||(type.includes('topwater')&&/topwater|frog/.test(sub));
}

function extractKnotSentences(text) {
  const names=['palomar','fg knot','albright','alberto','trilene','improved clinch','modified uni','double uni','loop knot'];
  return[...new Set(cleanMarkdown(text).split(/(?<=[.!?])\s+|\n+/).filter(s=>names.some(n=>normalize(s).includes(n))||/tie direct|snap|swivel/i.test(s)).map(s=>s.trim().slice(0,360)))];
}

function dedupeGuidance(items) {
  const s=new Set();
  return items.filter(x=>{const k=normalize(`${x.title||''} ${x.text||''} ${stripHtml(x.html||'')}`);if(s.has(k))return false;s.add(k);return true;});
}

function markdownExcerpt(markdown){return markdownToHtml(markdown.split('\n').filter(x=>x.trim()).slice(0,8).join('\n'));}


function markdownToHtmlWithKbLinks(md,currentName='') {
  let out=[],list=false;
  for(const raw of String(md||'').split('\n')){
    const line=raw.trim();
    if(!line){if(list){out.push('</ul>');list=false;}continue;}
    if(/^[-*]\s+/.test(line)){if(!list){out.push('<ul>');list=true;}out.push(`<li>${markdownInline(line.replace(/^[-*]\s+/,''))}</li>`);continue;}
    if(list){out.push('</ul>');list=false;}
    if(/^#{1,6}\s+/.test(line)){
      const title=cleanMarkdown(line.replace(/^#{1,6}\s+/,''));
      const record=normalize(title)!==normalize(currentName)?findKbByName(title):null;
      out.push(`<h4>${record?`<a href="#/kb/${escapeAttr(record.id)}">${escapeHtml(title)}</a>`:escapeHtml(title)}</h4>`);
      continue;
    }
    if(!/^\|/.test(line)&&!/^```/.test(line))out.push(`<p>${markdownInline(line)}</p>`);
  }
  if(list)out.push('</ul>');
  return out.join('');
}

function markdownToHtml(md) {
  let out=[],list=false;
  for(const raw of String(md||'').split('\n')){
    const line=raw.trim();
    if(!line){if(list){out.push('</ul>');list=false;}continue;}
    if(/^[-*]\s+/.test(line)){if(!list){out.push('<ul>');list=true;}out.push(`<li>${markdownInline(line.replace(/^[-*]\s+/,''))}</li>`);continue;}
    if(list){out.push('</ul>');list=false;}
    if(/^#{1,6}\s+/.test(line)){out.push(`<h4>${markdownInline(line.replace(/^#{1,6}\s+/,''))}</h4>`);continue;}
    if(!/^\|/.test(line)&&!/^```/.test(line))out.push(`<p>${markdownInline(line)}</p>`);
  }
  if(list)out.push('</ul>');
  return out.join('');
}

function markdownInline(md='') {
  let x=escapeHtml(md);
  x=x.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1 ↗</a>')
    .replace(/`([^`]+)`/g,'<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
  return x;
}

function cleanMarkdown(v=''){return String(v).replace(/\[([^\]]+)\]\(([^)]+)\)/g,'$1').replace(/`([^`]+)`/g,'$1').replace(/[*_~]/g,'').replace(/^[-*]\s+/gm,'').replace(/^#+\s+/gm,'').replace(/\s+/g,' ').trim();}
function normalize(v=''){return cleanMarkdown(v).toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();}
function slug(v=''){return normalize(v).replace(/\s+/g,'-').slice(0,140)||'item';}
function countOccurrences(text,n){return n?text.split(n).length-1:0;}
function titleCase(v){return v.replace(/\b\w/g,c=>c.toUpperCase());}
function optionHtml(label,selected,value=label){return`<option value="${escapeAttr(value)}" ${selected===value?'selected':''}>${escapeHtml(label)}</option>`;}
function escapeHtml(v=''){return String(v).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);}
function escapeAttr(v=''){return escapeHtml(v).replace(/'/g,'&#39;');}
function stripHtml(v=''){return String(v).replace(/<[^>]+>/g,' ');}

function inferManufacturer(name='') {
  const manufacturers=['6th Sense','Berkley','Booyah','Daiwa','Dick Nite','Gamakatsu','KastKing','Mack\'s','Mepps','Owner','Panther Martin','Pflueger','PowerPro','Rapala','Rebel','River2Sea','Seaguar','Shimano','Strike King','Sufix','Top Brass','Tsuridamashii','VMC','Yamamoto','YUM','Z-Man','Luhr Jensen','Fin-Sanity'];
  return manufacturers.find(m=>normalize(name).startsWith(normalize(m)))||'';
}

function stripManufacturer(name,manufacturer) {
  if (!manufacturer) return name;
  return name.replace(new RegExp(`^${escapeRegex(manufacturer)}\\s*`,'i'),'').trim();
}

function normalizeProductLinks(links,manufacturer) {
  const unique=uniqueLinks(links);
  const retail=/amazon|a\.co|tacklewarehouse|cabelas|dickssportinggoods|walmart|jdmtackleheaven/i;
  const manufacturerNorm=normalize(manufacturer||'');
  let hasManufacturerLink=false;
  const normalized=unique.map((link,index)=>{
    let label=link.label||'Website';
    const labelNorm=normalize(link.label||'');
    const looksManufacturer=manufacturerNorm && !retail.test(link.url) && (labelNorm.startsWith(manufacturerNorm) || normalize(link.url).includes(manufacturerNorm.replace(/ /g,'')) || index===0);
    if(looksManufacturer){label=manufacturer;hasManufacturerLink=true;}
    if(/amazon|a\.co/i.test(`${link.label} ${link.url}`)) label='Amazon';
    if(/tacklewarehouse/i.test(link.url)) label='Tackle Warehouse';
    if(/cabelas/i.test(link.url)) label="Cabela's";
    if(/dickssportinggoods/i.test(link.url)) label="Dick's Sporting Goods";
    if(/walmart/i.test(link.url)) label='Walmart';
    if(/jdmtackleheaven/i.test(link.url)) label='JDM Tackle Heaven';
    return {...link,label};
  });
  if(manufacturer && !hasManufacturerLink) normalized.unshift({label:manufacturer,url:'',missing:true});
  return normalized;
}

function normalizeLineProductName(raw) {
  let s=cleanMarkdown(raw);
  s=s.replace(/\bHi-Vis Yellow\b/ig,'').replace(/\bMoss Green\b/ig,'').replace(/\bfluorocarbon\b/ig,'').replace(/\bbraided?\b/ig,'').replace(/\bbraid\b/ig,'').replace(/\s+/g,' ').trim();
  return s;
}

function lineColorFromName(raw) {
  if (/hi-vis yellow/i.test(raw)) return 'Hi-Vis Yellow';
  if (/moss green/i.test(raw)) return 'Moss Green';
  return '';
}

function orderLineSpecs(specRaw,color) {
  const parts=specRaw.split(',').map(s=>s.trim()).filter(Boolean);
  const test=parts.find(p=>/\blb\b/i.test(p))||'';
  const length=parts.find(p=>/\byd\b/i.test(p))||'';
  return [test,color,length,...parts.filter(p=>p!==test&&p!==length)].filter(Boolean).join(', ');
}

function normalizeWeightSize(raw) {
  const oz=/([0-9/]+\s*oz)/i.exec(raw)?.[1];
  return oz?oz.replace(/\s+/g,' '):raw;
}

function normalizeHookType(type) {
  const n=normalize(type);
  if(n==='wacky rigging')return'Wacky';
  return cleanMarkdown(type);
}

function lureFamilyKey(name) {
  const n=normalize(name);
  if(n.startsWith('kastmaster'))return'kastmaster';
  if(n.startsWith('panther martin'))return'panther martin';
  return n;
}

function lureFamilyName(rows) {
  const names=rows.map(r=>r.name);
  if(names.some(n=>/^kastmaster/i.test(n)))return'Kastmaster';
  if(names.some(n=>/^panther martin/i.test(n)))return'Panther Martin';
  return names[0];
}

function splitCommaSpecs(values) {
  return values.flatMap(v=>v.split(',').map(x=>x.trim()).filter(Boolean)).map(v=>v.replace(/\bclass\b/i,'').trim());
}

function splitColorSpecs(values) {
  return values.flatMap(v=>{
    if (/^chrome neon blue$/i.test(v.trim())) return ['Chrome','Neon Blue'];
    return v.split(',').map(x=>x.trim()).filter(Boolean);
  });
}

function knotLinkLabel(knot,link,index,total) {
  const k=normalize(knot);
  if(k==='improved clinch')return'How to Tie the Improved Clinch Knot';
  if(k==='double uni')return'How to Tie the Double Uni Knot';
  if(k.includes('loop'))return'Tie a No Slip Loop Knot';
  if(k==='single uni')return'How to Tie the Uni Knot';
  if(k==='fg')return total>1?`FG knot video ${index+1}`:'FG knot video';
  if(k==='palomar')return'Palomar knot video';
  if(k==='albright')return'Albright knot video';
  if(k==='trilene')return'Trilene knot video';
  if(k==='modified uni')return'Modified Uni knot video';
  if(k==='arbor')return'Arbor knot video';
  return link.label&& !/^(video|link)$/i.test(link.label)?link.label:`${knot} video${total>1?` ${index+1}`:''}`;
}

function findKbByName(name) {
  const n=normalize(name);
  return state.kbRecords.find(r=>normalize(r.name)===n || (r.aliases||[]).some(a=>normalize(a)===n)) ||
    state.kbRecords.find(r=>normalize(r.name).includes(n)||n.includes(normalize(r.name))||(r.aliases||[]).some(a=>normalize(a).includes(n)||n.includes(normalize(a))));
}

function kbLinkByName(name,label=name) {
  const record=findKbByName(name);
  return record?`<a href="#/kb/${escapeAttr(record.id)}">${escapeHtml(label)}</a>`:escapeHtml(label);
}

function findKnotItem(name) {
  const n=normalize(name);
  return state.inventory.find(i=>i.category==='knots'&&(normalize(i.name)===n||normalize(i.name).includes(n)||n.includes(normalize(i.name))));
}

function knotItemLink(label,name) {
  const item=findKnotItem(name);
  return item?itemInternalLink(item,label):escapeHtml(label);
}

function kbOrTextLink(label,knotName) {
  return knotItemLink(label,knotName);
}

function itemInternalLink(item,label=item.name) {
  return `<a href="#/inventory/item/${encodeURIComponent(item.id)}">${escapeHtml(label)}</a>`;
}

function inventoryCategoryLink(label,category) {
  return `<a href="#/inventory/${escapeAttr(category)}">${escapeHtml(label)}</a>`;
}

function findInventoryByName(name) {
  const n=normalize(name);
  return state.inventory.find(i=>normalize(i.name)===n||normalize(i.name).includes(n)||n.includes(normalize(i.name)));
}

function escapeRegex(v=''){return String(v).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
