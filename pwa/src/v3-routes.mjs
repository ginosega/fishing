// Standalone V3 routes use canonical D1 keys and IDs directly.
const ID=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const valid=s=>typeof s==='string'&&ID.test(s);
const recordId=s=>valid(s)&&!['add','edit'].includes(s);
const kbTypes=new Set(['locations','species','gear-guides','techniques','knots']);
const category=(domain,key)=>valid(key)&&(domain==='gear'||domain==='kb'&&kbTypes.has(key));
export function rootRoute(domain){
 if(!['gear','kb','catches'].includes(domain))throw Error('Invalid URL domain');
 return '#/'+domain;
}
export function categoryRoute(domain,key){
 if(!category(domain,key))throw Error('Invalid URL category');
 return rootRoute(domain)+'/'+key;
}
export const addRoute=(domain,key)=>(domain==='catches'?rootRoute(domain):categoryRoute(domain,key))+'/add';
export function routeFor(domain,record){
 if(!recordId(record?.id))throw Error('Invalid record URL ID');
 return (domain==='catches'?rootRoute(domain):categoryRoute(domain,domain==='gear'?record.category:record.type))+'/'+record.id;
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
 const detail=(page,id,fields={})=>({page,id,...fields,...(section?{section}:{})});
 if(domain==='catches'){
  if(parts.length===1&&!query)return {page:'catch-list'};
  if(parts.length===2&&a==='add'&&!query)return {page:'catch-add'};
  if(!recordId(a))return missing;
  if(parts.length===2)return detail('catch-detail',a);
  if(parts.length===3&&b==='edit'&&!query)return {page:'catch-edit',id:a};
  return missing;
 }
 if(parts.length===1&&!query)return {page:domain+'-root'};
 if(!category(domain,a))return missing;
 const fields=domain==='gear'?{category:a}:{type:a};
 if(parts.length===2&&!query)return {page:domain+'-list',...fields};
 if(parts.length===3&&b==='add'&&!query)return {page:domain+'-add',...fields};
 if(!recordId(b))return missing;
 if(parts.length===3)return detail(domain+'-detail',b,fields);
 if(parts.length===4&&c==='edit'&&!query)return {page:domain+'-edit',id:b,...fields};
 return missing;
}
