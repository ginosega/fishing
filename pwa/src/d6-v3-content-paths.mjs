/** Standalone V3 keeps only record path helpers from retired GitHub handoff. */
import {canonical,categoryFolder,suggestedFilename,safePath} from './shared.mjs';

export function equal(a,b){return canonical(a)===canonical(b);}
export function narrativePath(domain,record){
 return categoryFolder(domain,domain==='gear'?record.category:record.type)+
  '/content/'+suggestedFilename(record.name);
}
export function picturePath(domain,record,filename){
 return safePath(categoryFolder(domain,
  domain==='gear'?record.category:record.type)+'/assets/'+filename);
}
export async function prepareChange(){
 throw Error('V3_LEGACY_GITHUB_CHANGE_PACKAGE_DISABLED');
}
