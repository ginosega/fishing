import {createApp} from './ui.mjs';
import {validateRecords} from './validation.mjs';
import {DOMAIN,encodedPath} from './shared.mjs';

export async function bootstrap({root,release}){
 const base=new URL('releases/'+release.id+'/',root).href;
 const data={};
 for(const [domain,config] of Object.entries(DOMAIN)){
  const response=await fetch(new URL('content/'+encodedPath(config.file),base));
  if(!response.ok)throw new Error(`Unable to load ${domain}: HTTP ${response.status}`);
  data[domain]=await response.json();
 }
 const maps=validateRecords(data);
 const context={root,base,release,manifest:globalThis.__FISHING_BOOT__.manifest,data,maps,asset:file=>new URL('content/'+encodedPath(file),base).href};
 window.__FISHING_V2__={releaseId:release.id,sourceRevision:release.sourceRevision,counts:{gear:data.gear.items.length,kb:data.kb.entities.length,catches:data.catches.catches.length}};
 createApp(context);
}
