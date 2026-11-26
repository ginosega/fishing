import {NORMALIZED_V3,GEAR_EQUIPMENT,KB_LOCATIONS,KB_GUIDES,KB_TECHNIQUES,KB_KNOTS} from './taxonomy.mjs';
import * as archivedRoutes from './browser-routes.mjs';
import * as normalizedRoutes from './v3-routes.mjs';
export const {parseRoute,routeFor,rootRoute,categoryRoute,addRoute,editRoute}=NORMALIZED_V3?normalizedRoutes:archivedRoutes;
// Shared, framework-free domain and authoring primitives. No browser storage.
export const DOMAIN = {
  gear: {file:'Gear/gear.json', array:'items', definition:'gearBundle'},
  kb: {file:'KB/kb.json', array:'entities', definition:'kbBundle'},
  catches: {file:'Catches/catches.json', array:'catches', definition:'catchBundle'}
};
export const GEAR_CATEGORIES = [
  ['rods-reels','Rods & Reels','Rods-Reels'],['line','Line','Line'],
  ['weights','Weights','Weights'],['snaps-swivels','Snaps & Swivels','Snaps-Swivels'],['hooks','Hooks','Hooks'],['lures','Lures','Lures'],['bait','Bait','Bait'],
  [GEAR_EQUIPMENT,'Equipment','Equipment']
];
// Built-in categories retain their approved paths. Owner-added categories use
// lowercase stable keys and an independent Custom namespace.
export function gearCategoryLabel(key){
 return GEAR_CATEGORIES.find(row=>row[0]===key)?.[1]||
  key.split('-').filter(Boolean).map(part=>part[0].toUpperCase()+part.slice(1)).join(' ');
}
export function gearCategoryKey(value){
 const label=String(value??'').trim();
 if(!label)return '';
 const existing=GEAR_CATEGORIES.find(row=>row[0]===label.toLowerCase()||
  row[1].toLowerCase()===label.toLowerCase());
 return existing?.[0]||newId(label,new Set());
}
export function gearCategoryChoices(records=[]){
 const seen=new Set(GEAR_CATEGORIES.map(x=>x[0]));
 const custom=[];
 for(const record of records){
  const key=record.category;
  if(!seen.has(key)){seen.add(key);custom.push([key,gearCategoryLabel(key)]);}
 }
 custom.sort((a,b)=>a[1].localeCompare(b[1]));
 return [...GEAR_CATEGORIES.map(row=>row.slice(0,2)),...custom];
}

export const KB_TYPES = [
  [KB_LOCATIONS,'Locations','Locations'],['species','Species','Species'],
  [KB_GUIDES,'Gear Guides','Gear-Guides'],[KB_TECHNIQUES,'Techniques','Techniques'],[KB_KNOTS,'Knots','Knots']
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
  assert(domain==='kb'&&record.type===KB_KNOTS,`Picture sequence is Knot-only: ${record.id}`);
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
      assert(ID_PATTERN.test(r.id)&&(!NORMALIZED_V3||!['add','edit'].includes(r.id)),`Invalid ${domain} ID: ${r.id}`);
      assert(!maps[domain].has(r.id),`Duplicate ${domain} ID: ${r.id}`);
      maps[domain].set(r.id,r);
      if(domain==='gear') {
        assert(typeof r.category==='string'&&/^[a-z0-9][a-z0-9-]*$/.test(r.category)&&r.category.length<=80,
         `Invalid Gear category: ${r.category}`);
        assert(typeof r.type==='string'&&r.type.trim()&&r.type.length<=160,
         `Invalid Gear type: ${r.id} / ${r.type}`);
      }
      if(domain==='catches')assert(localDateValid(r.date),`Invalid Catch date: ${r.id}`);
      for(const key of ['notes','content'])if(r[key])safePath(r[key]);
      if(r.picture)safePath(r.picture.src);
      validatePictureSequence(r,domain);
      for(const link of r.links||[]) {const url=new URL(link.url);assert(['http:','https:'].includes(url.protocol),`Unsafe link: ${r.id}`);}
    }
  }
  for(const c of maps.catches.values()) {
    for(const [key,domain,type] of [['speciesId','kb','species'],['locationId','kb',KB_LOCATIONS]])if(c[key])assert(maps[domain].get(c[key])?.type===type,`Invalid Catch ${key}: ${c.id}`);
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
  if(domain==='kb'&&!['species',KB_LOCATIONS].includes(data.kb.entities.find(x=>x.id===id)?.type))return [];
  return sortCatches(data.catches.catches.filter(c=>c[field]===id));
}
// Only approved navigation pages and existing canonical records resolve.
// Catch IDs may be referenced manually but are never listed by the Notes picker.
const INTERNAL_SITE_ROUTES=Object.freeze({
 'site://home':'#/','site://gear':rootRoute('gear'),
 'site://kb':rootRoute('kb'),'site://catches':rootRoute('catches'),
});
export function internalLink(uri,maps) {
  if(Object.hasOwn(INTERNAL_SITE_ROUTES,uri))return INTERNAL_SITE_ROUTES[uri];
  const match=/^(gear|kb|catches):\/\/([a-z0-9][a-z0-9-]*)$/.exec(uri);
  if(!match||!maps?.[match[1]]?.has(match[2]))throw new Error(`Unknown internal reference: ${uri}`);
  return routeFor(match[1],maps[match[1]].get(match[2]));
}
export function categoryFolder(domain,key) {const row=(domain==='gear'?GEAR_CATEGORIES:KB_TYPES).find(x=>x[0]===key);if(row)return (domain==='gear'?'Gear/':'KB/')+row[2];assert(domain==='gear'&&typeof key==='string'&&/^[a-z0-9][a-z0-9-]*$/.test(key)&&key.length<=80,`Unknown category: ${key}`);return safePath('Gear/Custom/'+key);}
export function suggestedFilename(name,ext='.md') {const text=name.normalize('NFC').replace(/[<>:"\\/|?*\x00-\x1f\x7f]/g,'').replace(/[. ]+$/,'').slice(0,175);return text+ext;}
export function newId(name,existing) {const base=name.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'item';let id=base;let n=2;while(existing.has(id)||(NORMALIZED_V3&&['add','edit'].includes(id)))id=base+'-'+n++;return id;}
