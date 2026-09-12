// Shared, framework-free domain and authoring primitives. No browser storage.
export const DOMAIN = {
  gear: {file:'Gear/gear.json', array:'items', definition:'gearBundle'},
  kb: {file:'KB/kb.json', array:'entities', definition:'kbBundle'},
  catches: {file:'Catches/catches.json', array:'catches', definition:'catchBundle'}
};
export const GEAR_CATEGORIES = [
  ['rods-reels','Rods & Reels','Rods-Reels'],['line','Line','Line'],
  ['weights','Weights','Weights'],['snaps-swivels','Snaps & Swivels','Snaps-Swivels'],['hooks','Hooks','Hooks'],['lures','Lures','Lures'],['bait','Bait','Bait'],
  ['accessories','Equipment','Equipment']
];
export const KB_TYPES = [
  ['location','Locations','Locations'],['species','Species','Species'],
  ['equipment','Gear Guides','Gear-Guides'],['technique','Techniques','Techniques'],['knot','Knots','Knots']
];
export const ROD_TYPES = ['Baitcasting rod','Spinning rod','Spincasting rod','Baitcasting reel','Spinning reel','Spincasting reel'];
export const EQUIPMENT_TYPES = ['Kayaks','Tools','Tackle Management','Electronics','Storage','Accessories'];
export const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const forbidden = /[<>:"\\|?*\p{Cc}\p{Cf}]/u;
const reserved = /^(?:CON|PRN|AUX|NUL|COM[0-9¹²³]|LPT[0-9¹²³])(?:\..*)?$/i;
export function safePath(value) {
  if (typeof value !== 'string' || !value || value.startsWith('/') || value.startsWith('./')) throw new Error(`Unsafe path: ${value}`);
  if (value !== value.normalize('NFC') || BufferByteLength(value)>240) throw new Error(`Noncanonical or excessive path: ${value}`);
  for(const part of value.split('/')) {
    if (!part || part==='.' || part==='..' || part.length>180 || BufferByteLength(part)>240 || forbidden.test(part) || /[. ]$/.test(part) || reserved.test(part)) throw new Error(`Unsafe filename: ${part}`);
  }
  return value;
}
function BufferByteLength(text) {return new TextEncoder().encode(text).length;}
export function pathKey(path) {return safePath(path).normalize('NFKC').toLowerCase();}
export function encodedPath(path) {return safePath(path).split('/').map(encodeURIComponent).join('/');}
export function sequenceFolder(record){assert(record?.id&&ID_PATTERN.test(record.id),'Valid Knot ID required for sequence path');return safePath(`KB/Knots/assets/${record.id}`);}
export function sequencePicturePath(record,filename){return safePath(`${sequenceFolder(record)}/${filename}`);}
export function localDateValid(date) {if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return false; const [y,m,d]=date.split('-').map(Number);const v=new Date(Date.UTC(y,m-1,d));return v.getUTCFullYear()===y&&v.getUTCMonth()===m-1&&v.getUTCDate()===d;}
export function canonical(value) {
  if (value===undefined) return 'undefined';
  if (Array.isArray(value)) return '['+value.map(canonical).join(',')+']';
  if(value && typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
  return JSON.stringify(value);
}
export async function sha256(value) {
  const bytes=typeof value==='string'?new TextEncoder().encode(value):value;
  const hash=await crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
export async function fingerprint(value) {return sha256(canonical(value));}
export function assert(condition,message) {if(!condition)throw new Error(message);}
function validatePictureSequence(record,domain){
  if(record.pictureSequence===undefined)return;
  assert(domain==='kb'&&record.type==='knot',`Picture sequence is Knot-only: ${record.id}`);
  assert(record.picture&&typeof record.picture.src==='string',`Picture sequence requires representative picture: ${record.id}`);
  assert(Array.isArray(record.pictureSequence)&&record.pictureSequence.length>=2,`Picture sequence requires at least two frames: ${record.id}`);
  const folder=sequenceFolder(record)+'/',seen=new Set();
  record.pictureSequence.forEach((raw,index)=>{
    const file=safePath(raw);assert(file.startsWith(folder)&&!file.slice(folder.length).includes('/'),`Invalid sequence folder: ${file}`);
    const basename=file.slice(folder.length),match=/^step-(\d+)\.(jpe?g|png|webp|gif)$/i.exec(basename);assert(match,`Invalid sequence filename: ${file}`);
    const expected=String(index+1).padStart(2,'0');assert(match[1]===expected,`Noncontiguous sequence frame: expected step-${expected}, got ${basename}`);
    const key=pathKey(file);assert(!seen.has(key),`Duplicate sequence frame: ${file}`);seen.add(key);
  });
  assert(record.picture.src===record.pictureSequence.at(-1),`Representative picture must be final sequence frame: ${record.id}`);
}
export function validateSemantics(data, taxonomy={}) {
  const maps={};
  for(const [domain,config] of Object.entries(DOMAIN)) {
    const records=data[domain]?.[config.array];assert(Array.isArray(records),`Missing ${domain} records`);
    maps[domain]=new Map();
    for(const r of records) {
      assert(ID_PATTERN.test(r.id),`Invalid ${domain} ID: ${r.id}`);
      assert(!maps[domain].has(r.id),`Duplicate ${domain} ID: ${r.id}`);
      maps[domain].set(r.id,r);
      if(domain==='gear') {
        assert(GEAR_CATEGORIES.some(x=>x[0]===r.category),`Unknown Gear category: ${r.category}`);
        const types=r.category==='rods-reels'?ROD_TYPES:r.category==='accessories'?EQUIPMENT_TYPES:taxonomy[r.category];
        assert(types&&types.includes(r.type),`Invalid Gear type: ${r.id} / ${r.type}`);
      }
      if(domain==='catches')assert(localDateValid(r.date),`Invalid Catch date: ${r.id}`);
      for(const key of ['notes','content'])if(r[key])safePath(r[key]);
      if(r.picture)safePath(r.picture.src);
      validatePictureSequence(r,domain);
      for(const link of r.links||[]) {const url=new URL(link.url);assert(['http:','https:'].includes(url.protocol),`Unsafe link: ${r.id}`);}
    }
  }
  for(const c of maps.catches.values()) {
    for(const [key,domain,type] of [['speciesId','kb','species'],['locationId','kb','location']])if(c[key])assert(maps[domain].get(c[key])?.type===type,`Invalid Catch ${key}: ${c.id}`);
    if(c.lureOrBaitId)assert(['lures','bait'].includes(maps.gear.get(c.lureOrBaitId)?.category),`Invalid Catch lure/bait: ${c.id}`);
  }
  return maps;
}
export function sortGear(items) {return [...items].sort((a,b)=>a.type.localeCompare(b.type)||a.name.localeCompare(b.name));}
export function sortNames(items) {return [...items].sort((a,b)=>a.name.localeCompare(b.name));}
export function sortCatches(items) {return [...items].sort((a,b)=>b.date.localeCompare(a.date)||String(b.time||'').localeCompare(String(a.time||''))||a.id.localeCompare(b.id));}
export function catchHistory(data, domain, id) {
  const field=domain==='gear'?'lureOrBaitId':data.kb.entities.find(x=>x.id===id)?.type==='species'?'speciesId':'locationId';
  if(domain==='gear'&&!['lures','bait'].includes(data.gear.items.find(x=>x.id===id)?.category))return [];
  if(domain==='kb'&&!['species','location'].includes(data.kb.entities.find(x=>x.id===id)?.type))return [];
  return sortCatches(data.catches.catches.filter(c=>c[field]===id));
}
export function parseRoute(hash) {
  const [raw,query='']=(hash||'').replace(/^#\/?/,'').split('?');
  const parts=raw.split('/').filter(Boolean).map(decodeURIComponent);
  const section=new URLSearchParams(query).get('section');
  if(!parts.length)return {page:'home'};
  const detail=(page,id)=>({page,id,...(section?{section}:{})});
  if(parts[0]==='inventory') {
    if(parts.length===1)return {page:'gear-root'};
    if(parts[1]==='item'&&parts.length===3)return detail('gear-detail',parts[2]);
    if(parts[1]==='edit'&&parts.length===3)return {page:'gear-edit',id:parts[2]};
    if(parts[1]==='add'&&parts.length===3)return {page:'gear-add',category:parts[2]};
    if(parts[1]==='category'&&parts.length===3)return {page:'gear-list',category:parts[2]};
    if(GEAR_CATEGORIES.some(x=>x[0]===parts[1]))return parts[2]?detail('gear-detail',parts[2]):{page:'gear-list',category:parts[1]};
  }
  if(parts[0]==='kb') {
    if(parts.length===1)return {page:'kb-root'};
    if(parts[1]==='edit'&&parts.length===3)return {page:'kb-edit',id:parts[2]};
    if(parts[1]==='add'&&parts.length===3)return {page:'kb-add',type:parts[2]};
    if((parts[1]==='category'||parts[1]==='type')&&parts.length===3)return {page:'kb-list',type:parts[2]};
    if(KB_TYPES.some(x=>x[0]===parts[1]))return parts[2]?detail('kb-detail',parts[2]):{page:'kb-list',type:parts[1]};
    if(parts.length===2)return detail('kb-detail',parts[1]);
  }
  if((parts[0]==='catches'||parts[0]==='catch-log')&&parts.length<=2)return parts[1]?detail('catch-detail',parts[1]):{page:'catch-list'};
  return {page:'missing'};
}
export function routeFor(domain,id) {return domain==='gear'?`#/inventory/item/${encodeURIComponent(id)}`:domain==='kb'?`#/kb/${encodeURIComponent(id)}`:`#/catches/${encodeURIComponent(id)}`;}
export function internalLink(uri,maps) {
  const match=/^(gear|kb):\/\/([a-z0-9][a-z0-9-]*)$/.exec(uri);
  if(!match||!maps[match[1]]?.has(match[2]))throw new Error(`Unknown internal reference: ${uri}`);
  return routeFor(match[1],match[2]);
}
export function categoryFolder(domain,key) {const row=(domain==='gear'?GEAR_CATEGORIES:KB_TYPES).find(x=>x[0]===key);assert(row,`Unknown category: ${key}`);return (domain==='gear'?'Gear/':'KB/')+row[2];}
export function suggestedFilename(name,ext='.md') {const text=name.normalize('NFC').replace(/[<>:"\\/|?*\x00-\x1f\x7f]/g,'').replace(/[. ]+$/,'').slice(0,175);return text+ext;}
export function newId(name,existing) {const base=name.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'item';let id=base;let n=2;while(existing.has(id))id=base+'-'+n++;return id;}
