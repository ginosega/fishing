import {createApp} from './ui.mjs';
import {validateRecords} from './validation.mjs';
import {DOMAIN,encodedPath} from './shared.mjs';

export async function bootstrap({root,release},{v3=null,sandboxSource=null}={}){
 const base=new URL('releases/'+release.id+'/',root).href;
 const data={};
 for(const [domain,config] of Object.entries(DOMAIN)){
  const response=await fetch(new URL('content/'+encodedPath(config.file),base));
  if(!response.ok)throw new Error(`Unable to load ${domain}: HTTP ${response.status}`);
  data[domain]=await response.json();
 }
 // The ordinary public V2 entry calls bootstrap with ONE argument, leaving
 // every release byte and authoring behavior unchanged. Only a separately
 // bundled, explicitly enabled owner pilot can supply private sandbox data.
 const isolated=v3?.enabled===true&&sandboxSource?.sandboxOnly===true&&
  sandboxSource?.repositoryId===1430581407&&
  /^[a-f0-9]{40}$/.test(sandboxSource.sourceRevision??'')&&
  sandboxSource.files instanceof Set&&sandboxSource.markdown instanceof Map;
 const library=isolated?sandboxSource.data:data;
 const visibleRelease=isolated?{...release,
  sourceRevision:sandboxSource.sourceRevision}:release;
 const maps=validateRecords(library);
 const manifest=globalThis.__FISHING_BOOT__.manifest;
 const asset=file=>new URL('content/'+encodedPath(file),base).href;
 const thumbnail=file=>{
  const thumb=manifest.cardThumbnails?.[file];
  return thumb?new URL('card-thumbnails/'+encodedPath(thumb),base).href:asset(file);
 };
 const context={root,base,release:visibleRelease,manifest,
  data:library,maps,asset,thumbnail,
  ...(v3?.enabled===true?{v3:{
   ...v3,
   // Only an immutable trusted owner-source response permits publication.
   publish:isolated?v3.publish:null,
   source:isolated?sandboxSource:null,
  }}:{})};
 window.__FISHING_V2__={releaseId:release.id,sourceRevision:release.sourceRevision,counts:{gear:data.gear.items.length,kb:data.kb.entities.length,catches:data.catches.catches.length}};
 createApp(context);
}
