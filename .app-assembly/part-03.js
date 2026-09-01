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
