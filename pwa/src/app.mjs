import {createApp} from './ui.mjs';
import {validateRecords} from './validation.mjs';
import {DOMAIN,encodedPath} from './shared.mjs';
import {chooseD6BootstrapContent,readD6VerifiedMode} from './d6-online-content-bootstrap.mjs';
import {createD6ContentImageResolver,d6ResolveImageForDisplay,loadD6PublishedMediaPaths} from './d6-content-image-resolver.mjs';

export async function bootstrap({root,release},{v3=null}={}){
 const base=new URL('releases/'+release.id+'/',root).href;
 // Private fully migrated V3 reads current Gear, KB and Catches from D1
 // directly in a verified Automatic session. Work Offline (and ordinary V2)
 // still uses the existing immutable, service-worker-verified release files.
 const selected=await chooseD6BootstrapContent({
  v3,online:navigator.onLine===true,
  readMode:()=>readD6VerifiedMode(),
  loadRelease:async()=>{
   const catalogs=await Promise.all(Object.entries(DOMAIN).map(async([domain,config])=>{
    const response=await fetch(new URL('content/'+encodedPath(config.file),base));
    if(!response.ok)throw new Error(`Unable to load ${domain}: HTTP ${response.status}`);
    return [domain,await response.json()];
   }));
   return Object.fromEntries(catalogs);
  },
 });
 const data=selected.data;
 const maps=validateRecords(data);
 const manifest=globalThis.__FISHING_BOOT__.manifest;
 const asset=file=>new URL('content/'+encodedPath(file),base).href;
 // Live media URLs are selectable ONLY with an independent verified D1
 // media registry and an explicitly approved, separately mounted reader.
 // This flag is not configured in the current Worker or V3 owner client.
 const liveMediaApproved=selected.source==='d1'&&v3?.enabled===true&&
  v3?.readerOnly===true&&v3?.liveMediaReadApproved===true;
 // D1, not a caller-provided Set or the immutable release, is the source
 // of published content images. This is still OFF in the current build.
 const mediaPaths=liveMediaApproved?
  await loadD6PublishedMediaPaths({
   root,request:fetch,enabled:()=>true,
   readingMode:()=>selected.readingMode,
  }):null;
 const liveMedia=mediaPaths?
  createD6ContentImageResolver({
   root,enabled:()=>true,readingMode:()=>selected.readingMode,
   publishedPaths:mediaPaths,
  }):null;
 const image=file=>liveMedia?
  d6ResolveImageForDisplay(file,{verifiedLive:liveMedia,
   frozenAsset:asset,strictOnline:true}):asset(file);
 const thumbnail=file=>{
  if(liveMedia)return image(file);
  const thumb=manifest.cardThumbnails?.[file];
  return thumb?new URL('card-thumbnails/'+encodedPath(thumb),base).href:asset(file);
 };
 const context={root,base,release,manifest,data,maps,asset,thumbnail,image,
  mediaLiveReader:Boolean(liveMedia),
  mediaPublishedPaths:mediaPaths?new Set(mediaPaths):null,
  ...(v3?.enabled===true&&v3?.readerOnly===true?{v3:{...v3,
   contentSource:selected.source,contentReadingMode:selected.readingMode}}:{}),
 };
 window.__FISHING_V2__={releaseId:release.id,sourceRevision:release.sourceRevision,counts:{gear:data.gear.items.length,kb:data.kb.entities.length,catches:data.catches.catches.length}};
 createApp(context);
}
