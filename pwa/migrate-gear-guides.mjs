import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const read = p => fs.readFile(p, 'utf8');
const write = (p,s) => fs.writeFile(p,s);
const edit = async (p,fn) => write(p,fn(await read(p)));
const replace = (s,a,b) => { assert.ok(s.includes(a), `Missing expected source: ${a.slice(0,90)}`); return s.replace(a,b); };
const version = '2026-09-06-my-gear-v4-ordered-links-1';
const seed = JSON.parse(await read('pwa/data/gear.seed.json'));
assert.equal(seed.schemaVersion,3);
assert.equal(seed.dataVersion,'2026-09-06-my-gear-v3-bonafide-rvr119-1');
function convertPart(part) {
  if (!part) return;
  const manufacturer = part.manufacturer;
  const links = [...(part.links || [])].map(({kind,...link}) => link);
  if (manufacturer?.url) {
    links.unshift({label:manufacturer.name,url:manufacturer.url});
    delete manufacturer.url;
  }
  if (links.length) part.links = links;
  else delete part.links;
}
for (const item of seed.items) {
  if (item.category === 'accessories' && item.type === 'Miscellaneous') item.type = 'Accessories';
  if (item.category === 'rods-reels') {
    convertPart(item.rod); convertPart(item.reel);
    item.rod.links ||= []; item.reel.links ||= [];
  } else convertPart(item);
}
seed.schemaVersion = 4;
seed.dataVersion = version;
await write('pwa/data/gear.seed.json',JSON.stringify(seed,null,2)+'\n');
await edit('pwa/gear-model.js',s => {
  s=replace(s,'GEAR_SCHEMA_VERSION = 3','GEAR_SCHEMA_VERSION = 4');
  s=replace(s,"'Storage','Miscellaneous'","'Storage','Accessories'");
  s=replace(s,"const MANUFACTURER_FIELDS = ['name','url'];","const MANUFACTURER_FIELDS = ['name'];");
  s=replace(s,"const LINK_FIELDS = ['kind','label','url'];","const LINK_FIELDS = ['label','url'];");
  s=replace(s,"  if (item.category !== 'rods-reels' && item.manufacturer?.url) links.push({ kind:'manufacturer', label:item.manufacturer.name, url:item.manufacturer.url });\n",'');
  s=replace(s,'  return dedupeLinks(links);','  return links;');
  s=replace(s,"  if (item.category === 'accessories' && !GEAR_ACCESSORY_TYPES.includes(item.type)) errors.push(`${at}.type must be one of ${GEAR_ACCESSORY_TYPES.join(', ')} for Accessories.`);","  if (item.category === 'accessories' && !GEAR_ACCESSORY_TYPES.includes(item.type)) errors.push(`${at}.type must be one of ${GEAR_ACCESSORY_TYPES.join(', ')} for Equipment.`);");
  s=replace(s,"  if (manufacturer.url != null) validateUrl(manufacturer.url, `${at}.url`, errors);\n",'');
  s=replace(s,"    if (!['retailer','resource','other'].includes(link.kind || 'other')) errors.push(`${row}.kind is invalid.`);\n",'');
  const begin=s.indexOf('function dedupeLinks(links) {');
  const end=s.indexOf('function stableJson(value)',begin);
  assert.ok(begin>=0&&end>begin); return s.slice(0,begin)+s.slice(end);
});
await edit('pwa/kb-app.js',s=>replace(s,"equipment: { label:'Equipment', icon:'🧰', description:'Rigs, presentations, and gear guides.' }","equipment: { label:'Gear Guides', icon:'🧰', description:'Equipment, rigs, and presentations reference' }"));
await edit('pwa/gear-app.js',s=>{
  s=replace(s,"accessories: { label:'Accessories', iconHtml:ACCESSORIES_ICON }","accessories: { label:'Equipment', iconHtml:ACCESSORIES_ICON }");
  s=replace(s,"'Create a validated Gear item package for repository handoff.'","'Create a new Gear item entry for handoff.'");
  s=replace(s,"const links = item?.links?.length ? item.links : [{kind:'other',label:'',url:''}];","const links = item?.links?.length ? item.links : [{label:'',url:''}];");
  s=replace(s,"          ${formField('Manufacturer URL', `<input class=\"input\" id=\"gearManufacturerUrl\" inputmode=\"url\" maxlength=\"2000\" placeholder=\"https://…\" value=\"${escapeAttr(item?.manufacturer?.url || '')}\">`)}\n",'');
  s=s.replaceAll("{kind:'other',label:'',url:''}","{label:'',url:''}");
  s=replace(s,"  const manufacturerUrl = document.querySelector('#gearManufacturerUrl').value.trim();\n",'');
  s=replace(s,"  if (manufacturerUrl && !manufacturerName) errors.push('Enter Manufacturer when a Manufacturer URL is provided.');\n  if (manufacturerUrl && !isHttpUrl(manufacturerUrl)) errors.push('Manufacturer URL must be a valid http(s) URL.');\n",'');
  s=replace(s,"    const kind = row.querySelector('[data-link-kind]').value;\n",'');
  s=replace(s,"    if (!['retailer','resource','other'].includes(kind)) errors.push(`Link ${index + 1} type is invalid.`);\n",'');
  s=replace(s,'    links.push({kind,label,url});','    links.push({label,url});');
  s=replace(s,"item.manufacturer = { name:manufacturerName, ...(manufacturerUrl ? {url:manufacturerUrl} : {}) };","item.manufacturer = { name:manufacturerName };");
  s=replace(s,"    ['Manufacturer URL', before.manufacturer?.url || '', after.manufacturer?.url || ''],\n",'');
  const start=s.indexOf('function linkRowHtml(link={}) {');
  const end=s.indexOf('function validatePlainText(',start);
  assert.ok(start>=0&&end>start);
  s=s.slice(0,start)+`function linkRowHtml(link={}) {
  return \`<div class="repeater-row link-row">
    <input class="input" data-link-label maxlength="120" placeholder="Link text" aria-label="Link text" value="\${escapeAttr(link.label || '')}">
    <input class="input" data-link-url maxlength="2000" inputmode="url" placeholder="https://…" aria-label="URL" value="\${escapeAttr(link.url || '')}">
    <button class="remove-row-button" type="button" data-remove-row aria-label="Remove link">×</button>
  </div>\`;
}

`+s.slice(end);
  s=replace(s,"  if (component.manufacturer.url) links.push({kind:'manufacturer',label:component.manufacturer.name,url:component.manufacturer.url});\n",'');
  s=replace(s,"${dedupeLinks(links).map(link =>", "${links.map(link =>");
  return s;
});
await edit('pwa/index.html',s=>replace(s,'.link-row { grid-template-columns: 130px minmax(130px,.7fr) minmax(200px,1.3fr) 42px; }','.link-row { grid-template-columns: minmax(130px,.7fr) minmax(200px,1.3fr) 42px; }'));
console.log('Migration source edits completed.');
