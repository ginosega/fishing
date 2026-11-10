/**
 * Canonical Catch input model. Recognized names retain KB/Gear ID links.
 * Unlisted names stay on the Catch itself; no implicit KB/Gear creation.
 * Handles older ID-only Catch records without changing their data shape.
 */
const text=value=>typeof value==='string'?value.trim():'';
const same=(a,b)=>a.toLocaleLowerCase()===b.toLocaleLowerCase();
export function catchFieldValue(record,prefix,entries=[]){
 const id=text(record?.[prefix+'Id']),name=text(record?.[prefix+'Name']);
 if(id){
  const entry=entries.find(e=>e.id===id);
  return entry?.name??name;
 }
 return name;
}
export function applyCatchField(record,prefix,input,entries=[]){
 if(!record||!['species','location','lureOrBait'].includes(prefix))
  throw Error('Unsupported Catch input field.');
 const value=text(input);
 delete record[prefix+'Id'];delete record[prefix+'Name'];
 if(!value)return record;
 const matches=entries.filter(e=>same(e.name,value));
 // Ambiguous display names are not silently assigned to the wrong source.
 if(matches.length===1)record[prefix+'Id']=matches[0].id;
 else record[prefix+'Name']=value;
 return record;
}
export function speciesCatchChoices(data){
 const kb=(data?.kb?.entities??[]).filter(e=>e.type==='species')
  .map(e=>({id:e.id,name:e.name}));
 const names=(data?.catches?.catches??[]).map(c=>c.speciesName)
  .filter(Boolean);
 return {linked:kb,suggestions:uniqueNames([...kb.map(x=>x.name),...names])};
}
export function lureCatchChoices(data){
 const gear=(data?.gear?.items??[]).filter(e=>
  e.category==='lures'||e.category==='bait').map(e=>({id:e.id,name:e.name}));
 const other=(data?.catches?.catches??[]).map(c=>c.lureOrBaitName)
  .filter(Boolean);
 return {linked:gear,suggestions:uniqueNames([...gear.map(x=>x.name),...other,'Other'])};
}
export function uniqueNames(names){
 const found=new Set(),list=[];
 for(const raw of names){
  const name=text(raw);
  if(!name||found.has(name.toLocaleLowerCase()))continue;
  found.add(name.toLocaleLowerCase());list.push(name);
 }
 return list.sort((a,b)=>a.localeCompare(b));
}
