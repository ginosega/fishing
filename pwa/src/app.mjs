import {createApp} from './ui.mjs';
import {validateRecords} from './validation.mjs';
import {DOMAIN,encodedPath} from './shared.mjs';

export async function bootstrap({root,release},{v3=null}={}){
 const base=new URL('releases/'+release.id+'/',root).href;
 // Catalogs are independent, immutable files within the pinned release.
 // Fetch them together; preserve the fixed DOMAIN order and fail closed if
 // any response fails. No publishing, cache or validation rules change.
 const catalogs=await Promise.all(Object.entries(DOMAIN).map(async([domain,config])=>{
  const response=await fetch(new URL('content/'+encodedPath(config.file),base));
  if(!response.ok)throw new Error(`Unable to load ${domain}: HTTP ${response.status}`);
  return [domain,await response.json()];
 }));
 const data=Object.fromEntries(catalogs);
 const maps=validateRecords(data);
 const manifest=globalThis.__FISHING_BOOT__.manifest;
 const asset=file=>new URL('content/'+encodedPath(file),base).href;
 const thumbnail=file=>{
  const thumb=manifest.cardThumbnails?.[file];
  return thumb?new URL('card-thumbnails/'+encodedPath(thumb),base).href:asset(file);
 };
 const context={root,base,release,manifest,data,maps,asset,thumbnail,
  ...(v3?.enabled===true&&v3?.readerOnly===true?{v3}:{}),
 };
 window.__FISHING_V2__={releaseId:release.id,sourceRevision:release.sourceRevision,counts:{gear:data.gear.items.length,kb:data.kb.entities.length,catches:data.catches.catches.length}};
 createApp(context);
}
