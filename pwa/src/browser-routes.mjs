import {GEAR_CATEGORIES,KB_TYPES} from './shared.mjs';

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
  if(parts[0]==='catches'&&parts[1]==='add'&&parts.length===2)
   return {page:'catch-add'};
  if(parts[0]==='catches'&&parts[1]==='edit'&&parts.length===3)
   return {page:'catch-edit',id:parts[2]};
  if((parts[0]==='catches'||parts[0]==='catch-log')&&parts.length<=2)return parts[1]?detail('catch-detail',parts[1]):{page:'catch-list'};
  return {page:'missing'};
}
export function routeFor(domain,record) {const id=typeof record==='string'?record:record.id;return domain==='gear'?`#/inventory/item/${encodeURIComponent(id)}`:domain==='kb'?`#/kb/${encodeURIComponent(id)}`:`#/catches/${encodeURIComponent(id)}`;}
export const rootRoute=domain=>domain==='gear'?'#/inventory':domain==='kb'?'#/kb':'#/catches';
export const categoryRoute=(domain,key)=>domain==='gear'?`#/inventory/category/${key}`:`#/kb/category/${key}`;
export const addRoute=(domain,key)=>domain==='catches'?'#/catches/add':`${rootRoute(domain)}/add/${key}`;
export const editRoute=(domain,record)=>`${rootRoute(domain)}/edit/${encodeURIComponent(typeof record==='string'?record:record.id)}`;
