// Standalone V3 browser routes. The D1 record IDs and Notes URIs stay unchanged.
import {D6_ORIGINAL_IDS} from './d6-original-id-ledger.mjs';
const ID=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const valid=s=>typeof s==='string'&&ID.test(s);
const escaped=s=>s==='id'||s.startsWith('id-');
const reserved=s=>s==='add'||s==='edit'||escaped(s);
const kbCategories=Object.freeze({location:'locations',species:'species',equipment:'gear-guides',technique:'techniques',knot:'knots'});
const kbKeys=new Map(Object.entries(kbCategories).map(([key,slug])=>[slug,key]));
// Derive the cosmetic historical aliases from the existing immutable ID proof,
// not a second catalog or mutable names. Reserve aliases for future additions.
const kbAliases=new Map(D6_ORIGINAL_IDS.kb.map(id=>{
 const slug=id.startsWith('knot-')?id.slice(5)+'-knot':
  id.replace(/^(?:location|species|technique)-/,'');
 return [id,slug];
}).filter(([id,slug])=>id!==slug));
const kbAliasIds=new Map([...kbAliases].map(([id,slug])=>[slug,id]));
if(kbAliasIds.size!==kbAliases.size)throw Error('Duplicate original KB URL aliases');
function itemSlug(domain,id){
 if(!valid(id))throw Error('Invalid record URL ID');
 if(domain==='kb'&&kbAliases.has(id))return kbAliases.get(id);
 if(domain==='catches'){
  const slug=id.startsWith('catch-')?id.slice(6):'';
  return valid(slug)&&!reserved(slug)?slug:'id-'+id;
 }
 return reserved(id)||(domain==='kb'&&kbAliasIds.has(id))?'id-'+id:id;
}
function itemId(domain,slug){
 if(!valid(slug))return null;
 const id=slug.startsWith('id-')?slug.slice(3):
  domain==='kb'?(kbAliasIds.get(slug)||slug):
  domain==='catches'?'catch-'+slug:slug;
 return valid(id)&&itemSlug(domain,id)===slug?id:null;
}
function categorySlug(domain,key){
 if(domain==='kb'){
  if(!Object.hasOwn(kbCategories,key))throw Error('Invalid KB URL category');
  return kbCategories[key];
 }
 if(domain!=='gear'||!valid(key))throw Error('Invalid Gear URL category');
 return key==='accessories'?'equipment':
  key==='equipment'||escaped(key)?'id-'+key:key;
}
function categoryKey(domain,slug){
 if(domain==='kb')return kbKeys.get(slug)||null;
 if(!valid(slug))return null;
 const key=slug==='equipment'?'accessories':slug.startsWith('id-')?slug.slice(3):slug;
 return valid(key)&&categorySlug(domain,key)===slug?key:null;
}
export function rootRoute(domain){
 if(!['gear','kb','catches'].includes(domain))throw Error('Invalid URL domain');
 return '#/'+domain;
}
export const categoryRoute=(domain,key)=>rootRoute(domain)+'/'+categorySlug(domain,key);
export const addRoute=(domain,key)=> (domain==='catches'?rootRoute(domain):categoryRoute(domain,key))+'/add';
export function routeFor(domain,record){
 const id=typeof record==='string'?record:record?.id;
 const root=domain==='catches'?rootRoute(domain):
  categoryRoute(domain,domain==='gear'?record?.category:record?.type);
 return root+'/'+itemSlug(domain,id);
}
export const editRoute=(domain,record)=>routeFor(domain,record)+'/edit';
export function parseRoute(hash){
 const missing={page:'missing'};
 if(hash===''||hash==='#/'||hash==null)return {page:'home'};
 if(typeof hash!=='string'||!hash.startsWith('#/'))return missing;
 const [raw,query,...extra]=hash.slice(2).split('?');
 if(extra.length||!raw)return missing;
 const parts=raw.split('/');
 if(parts.some(x=>!valid(x)))return missing;
 const [domain,a,b,c]=parts;
 if(!['gear','kb','catches'].includes(domain))return missing;
 const section=query?new URLSearchParams(query).get('section'):null;
 const detail=(page,id,category={})=>({page,id,...category,...(section?{section}:{})});
 if(domain==='catches'){
  if(parts.length===1&&!query)return {page:'catch-list'};
  if(parts.length===2&&a==='add'&&!query)return {page:'catch-add'};
  const id=itemId(domain,a);
  if(!id)return missing;
  if(parts.length===2)return detail('catch-detail',id);
  if(parts.length===3&&b==='edit'&&!query)return {page:'catch-edit',id};
  return missing;
 }
 if(parts.length===1&&!query)return {page:domain+'-root'};
 const key=categoryKey(domain,a);
 if(!key)return missing;
 const category=domain==='gear'?{category:key}:{type:key};
 if(parts.length===2&&!query)return {page:domain+'-list',...category};
 if(parts.length===3&&b==='add'&&!query)return {page:domain+'-add',...category};
 const id=itemId(domain,b);
 if(!id)return missing;
 if(parts.length===3)return detail(domain+'-detail',id,category);
 if(parts.length===4&&c==='edit'&&!query)return {page:domain+'-edit',id,...category};
 return missing;
}
