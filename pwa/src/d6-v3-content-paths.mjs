/** Standalone V3 keeps only record path helpers from retired GitHub handoff. */
import {canonical,categoryFolder,suggestedFilename,safePath} from './shared.mjs';

export function equal(a,b){return canonical(a)===canonical(b);}
export function narrativePath(domain,record){
 return categoryFolder(domain,domain==='gear'?record.category:record.type)+
  '/content/'+suggestedFilename(record.name);
}
export function picturePath(domain,record,filename){
 // New V3 covers belong to their item, not the original uploaded filename.
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record?.id??''))
  throw Error('Enter an item name before selecting its picture.');
 const extension=/\.(jpe?g|png|webp|gif)$/i.exec(filename)?.[1];
 if(!extension)throw Error('Unsupported picture filename.');
 return safePath(categoryFolder(domain,
  domain==='gear'?record.category:record.type)+
  '/assets/'+record.id+'-cover.'+extension.toLowerCase());
}
export function newNarrativePath(domain,record){
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record?.id??''))
  throw Error('Enter an item name before saving Notes.');
 return safePath(categoryFolder(domain,
  domain==='gear'?record.category:record.type)+
  '/content/'+record.id+'.md');
}
export async function prepareChange(){
 throw Error('V3_LEGACY_GITHUB_CHANGE_PACKAGE_DISABLED');
}
