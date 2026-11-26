import {createApp} from './ui.mjs';
import {validateRecords} from './validation.mjs';
import {DOMAIN,encodedPath} from './shared.mjs';
import {chooseD6BootstrapContent,readD6VerifiedMode} from './d6-online-content-bootstrap.mjs';
import {createD6ContentImageResolver,loadD6PublishedMediaPaths} from './d6-content-image-resolver.mjs';

export async function bootstrap({root,release},{v3=null}={}){
 const base=new URL('releases/'+release.id+'/',root).href;
 const standalone=release.standaloneV3===true;
 if(standalone&&(!(v3?.enabled===true&&v3?.readerOnly===true)||
    typeof v3.offlineContentReader!=='function'||
    v3.liveMediaReadApproved!==true))
  throw Error('STANDALONE_V3_CONTENT_RUNTIME_UNAVAILABLE');
 // Private fully migrated V3 reads current Gear, KB and Catches from D1
 // directly in verified Automatic. Opted-in O03 Work Offline reads the
 // complete V3 content cache, never a frozen release or network fallback.
 const selected=await chooseD6BootstrapContent({
  v3,standalone,online:navigator.onLine===true,
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
 const offlineContent=selected.source==='v3-content'?
  selected.offlineReader:null;
 const manifest=globalThis.__FISHING_BOOT__.manifest;
 const asset=file=>standalone?null:
  new URL('content/'+encodedPath(file),base).href;
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
   thumbnailEnabled:()=>v3?.thumbnailReadApproved===true,
  }):null;
 if(standalone&&selected.source==='d1'&&!liveMedia)
  throw Error('STANDALONE_V3_MEDIA_UNAVAILABLE');
 const image=file=>offlineContent?offlineContent.image(file):
  liveMedia?liveMedia.resolve(file):asset(file);
 const thumbnail=file=>{
  if(offlineContent)return offlineContent.thumbnail(file);
  if(liveMedia)return v3?.thumbnailReadApproved===true?
   liveMedia.resolveThumbnail(file):image(file);
  if(standalone)return null;
  const thumb=manifest.cardThumbnails?.[file];
  return thumb?new URL('card-thumbnails/'+encodedPath(thumb),base).href:asset(file);
 };
 const notesThumbnail=file=>liveMedia&&v3?.thumbnailReadApproved===true?
  liveMedia.resolveThumbnail(file):null;
 const context={root,base,release,manifest,data,maps,asset,thumbnail,image,notesThumbnail,
  offlineMarkdown:offlineContent?.markdown??null,
  mediaLiveReader:Boolean(liveMedia||offlineContent),
  mediaPublishedPaths:offlineContent?
   new Set(offlineContent.images.keys()):
   mediaPaths?new Set(mediaPaths):null,
  ...(v3?.enabled===true&&v3?.readerOnly===true?{v3:{...v3,
   contentSource:selected.source,contentReadingMode:selected.readingMode}}:{}),
 };
 const runtimeInfo={releaseId:release.id,sourceRevision:release.sourceRevision,counts:{gear:data.gear.items.length,kb:data.kb.entities.length,catches:data.catches.catches.length}};
 if(standalone)window.__FISHING_V3__=runtimeInfo;
 else window.__FISHING_V2__=runtimeInfo;
 createApp(context);
}
