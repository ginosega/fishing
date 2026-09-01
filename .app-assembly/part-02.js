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
