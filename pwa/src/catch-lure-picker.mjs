// Searchable Catch lure/bait chooser. Do not enumerate every catalog item
// as an expanded browser datalist; show a bounded scrollable select instead.
// Explicit Gear IDs are preserved even when more than one item shares a name.
const norm=v=>typeof v==='string'?v.trim():'';
const lower=v=>norm(v).toLocaleLowerCase();
export function catchLureTargets(data){
 const gear=(data?.gear?.items??[]).filter(e=>
  (e.category==='lures'||e.category==='bait')&&
  typeof e.id==='string'&&typeof e.name==='string'&&e.name.trim())
  .map(e=>({key:'gear:'+e.id,id:e.id,name:e.name,
   group:e.type?.trim()||'Other Gear',kind:'gear'}));
 const seen=new Set(gear.map(e=>lower(e.name)));
 const history=[];
 for(const value of (data?.catches?.catches??[]).map(e=>e.lureOrBaitName)){
  const name=norm(value),key=lower(name);
  if(!name||seen.has(key))continue;
  seen.add(key);
  history.push({key:'history:'+history.length,name,group:'Previous entries',kind:'name'});
 }
 if(!seen.has('other'))history.push({key:'other',name:'Other',
  group:'Previous entries',kind:'name'});
 return [...gear,...history].sort((a,b)=>
  a.group.localeCompare(b.group)||a.name.localeCompare(b.name)||a.key.localeCompare(b.key));
}
export function filterCatchLureTargets(targets,{query='',group='all'}={}){
 const q=lower(query);
 return targets.filter(t=>(group==='all'||t.group===group)&&
  (!q||lower(t.name+' '+t.group).includes(q)));
}
export function applyCatchLureSelection(record,target){
 if(!record||!target||typeof target.name!=='string')
  throw Error('Choose a lure or bait.');
 delete record.lureOrBaitId;delete record.lureOrBaitName;
 if(target.kind==='gear'&&typeof target.id==='string'&&target.id){
  record.lureOrBaitId=target.id;
 }else if(target.kind==='name'&&target.name.trim()){
  record.lureOrBaitName=target.name.trim();
 }else throw Error('Invalid lure or bait selection.');
 return record;
}
