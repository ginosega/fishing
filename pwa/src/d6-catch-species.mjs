/**
 * Owner-initiated Species creation from Add/Edit Catch. The KB record is
 * independently verified in D1 before the Catch can reference its ID.
 * Creating a KB entry is deliberate and is not undone by cancelling a Catch.
 */
import {newId} from './shared.mjs';
import {narrativePath} from './d6-v3-content-paths.mjs';

const normalize=value=>typeof value==='string'?value.trim().replace(/\s+/g,' '):'';
export function buildNewCatchSpecies(name,entries=[]){
 const label=normalize(name);
 if(!label||label.length>160)throw Error('Enter a species name of 1–160 characters.');
 if(/[\x00-\x1f\x7f<>:"\\/|?*]/.test(label)||/[. ]$/.test(label))
  throw Error('Species name contains unsupported filename characters.');
 if(entries.some(x=>x.name?.toLocaleLowerCase()===label.toLocaleLowerCase()))
  throw Error('This name already exists in the Knowledge Base. Select it from the Species list.');
 const id=newId(label,new Set());
 if(entries.some(x=>x.id===id))
  throw Error('A Knowledge Base item already uses this generated ID. Choose a more specific species name.');
 const record={id,type:'species',name:label};
 record.content=narrativePath('kb',record);
 if(entries.some(x=>x.content===record.content||
  x.content?.toLocaleLowerCase()===record.content.toLocaleLowerCase()))
  throw Error('Another Knowledge Base item already uses this Notes path. Choose a more specific species name.');
 return {record,markdown:'# '+label+'\n'};
}

export async function createCatchSpecies({name,context}={}){
 const canSave=context?.v3?.directKBCanSave;
 const client=context?.v3?.directKBClient;
 if(typeof canSave!=='function'||canSave()!==true||
  typeof client?.list!=='function'||typeof client?.save!=='function')
  throw Error('Work Offline or signed out. Adding a species requires an online owner session.');
 // Read the authoritative D1 catalog to prevent stale duplicate creation.
 const entries=await client.list();
 const {record,markdown}=buildNewCatchSpecies(name,entries);
 const saved=await client.save({record,markdown,expectedRevision:0});
 if(saved?.revision!==1||saved.record?.id!==record.id||
  saved.record?.type!=='species'||saved.record?.content!==record.content||
  saved.record?.name!==record.name||saved.markdown!==markdown)
  throw Error('New Species was not independently verified in the Knowledge Base.');
 // Only update the editor's local catalog after an independently verified save.
 context.data.kb.entities=entries.concat(saved.record);
 context.maps?.kb?.set(saved.record.id,saved.record);
 context.v3.source?.files?.add(saved.record.content);
 try{context.v3.onDirectKBSaved?.();}catch{/* verified KB row is authoritative */}
 return saved.record;
}
