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
