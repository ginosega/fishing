import {createApp} from './ui.mjs';
import {validateRecords} from './validation.mjs';
import {DOMAIN,encodedPath} from './shared.mjs';
import {composeD5OwnerOverlay} from './d5-owner-overlay.mjs';

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
 const manifest=globalThis.__FISHING_BOOT__.manifest;
 const releaseContentPrefix='releases/'+release.id+'/content/';
 const realFiles=new Set(manifest.files.filter(item=>
  item.path.startsWith(releaseContentPrefix)).map(item=>
  item.path.slice(releaseContentPrefix.length)));
 // This is D5-only and never changes public V2 or the historical D3 pilot.
 // A private edit is always based on the original, immutable sandbox source,
 // never on merged display data or a real-library record.
 const display=isolated&&v3?.displayPublishedLibrary===true?
  composeD5OwnerOverlay({
   canonical:data,sandbox:sandboxSource.data,
   canonicalFiles:realFiles,sandboxFiles:sandboxSource.files,
  }):null;
 const library=display?.data??(isolated?sandboxSource.data:data);
 const maps=validateRecords(library);
 const sandboxMaps=display?validateRecords(sandboxSource.data):null;
 const visibleRelease=isolated?{...release,
  sourceRevision:sandboxSource.sourceRevision}:release;
 const privateAssets=isolated&&v3?.privateAssets===true;
 const asset=file=>privateAssets&&sandboxSource.files.has(file)?
  new URL('api/v3/assets/'+encodedPath(file)+
   '?revision='+sandboxSource.sourceRevision,new URL(root).origin+'/').href:
  new URL('content/'+encodedPath(file),base).href;
 const thumbnail=file=>{
  // A private image must use its own verified immutable original bytes,
  // not a stale thumbnail from the unrelated public V2 release.
  if(privateAssets&&sandboxSource.files.has(file))return asset(file);
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
   ...(display?{display:{
    ...display,sandboxData:sandboxSource.data,sandboxMaps,
   }}:{}),
  }}:{})};
 window.__FISHING_V2__={releaseId:release.id,sourceRevision:release.sourceRevision,counts:{gear:data.gear.items.length,kb:data.kb.entities.length,catches:data.catches.catches.length}};
 createApp(context);
}
