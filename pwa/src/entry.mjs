import {bootstrap} from './app.mjs';
import {selectD6PublicReader} from './d6-public-reader.mjs';
import {createD6OwnerSessionReadiness} from './d6-owner-session-readiness.mjs';
import {createD6CanonicalSourceClient} from './d6-canonical-authoring-source.mjs';
import {installPageHero} from './page-hero.mjs';
const settings=globalThis.__FISHING_BOOT__;
installPageHero();
const d6Reader=typeof __FISHING_D6_PUBLIC_READER__!=='undefined'&&
 __FISHING_D6_PUBLIC_READER__===true;
const d6StaticStaging=typeof __FISHING_D6_STATIC_STAGING__!=='undefined'&&
 __FISHING_D6_STATIC_STAGING__===true;
const d6Wp2Staging=typeof __FISHING_D6_WP2_STAGING__!=='undefined'&&
 __FISHING_D6_WP2_STAGING__===true;
const d6OwnerConnection=typeof __FISHING_D6_OWNER_CONNECTION__!=='undefined'&&
 __FISHING_D6_OWNER_CONNECTION__===true;
const d6EditorPreview=typeof __FISHING_D6_OWNER_EDITOR_PREVIEW__!=='undefined'&&
 __FISHING_D6_OWNER_EDITOR_PREVIEW__===true;
function d6Context(){
 if(!d6Reader)return {};
 const reader=selectD6PublicReader({enabled:true,staticStaging:d6StaticStaging,wp2Staging:d6Wp2Staging,
  root:settings.root,
  release:settings.release,manifest:settings.manifest});
 // Staging may expose only immutable anonymous reading. It never creates
 // a session probe or a canonical authoring-source client.
 if(d6StaticStaging){
  if(d6EditorPreview)throw Error('D6 editor preview cannot use static staging');
  return {v3:{...reader}};
 }
 const ownerReadiness=createD6OwnerSessionReadiness({
  root:settings.root,request:(url,options)=>fetch(url,options),
  wp2Staging:d6Wp2Staging,
  enabled:()=>true,online:()=>navigator.onLine===true,
 });
 const canonicalSource=createD6CanonicalSourceClient({
  root:settings.root,expectedReleaseRevision:settings.release.sourceRevision,
  wp2Staging:d6Wp2Staging,
  request:(url,options)=>fetch(url,options),
  enabled:()=>true,online:()=>navigator.onLine===true,
 });
 if(d6Wp2Staging&&
   (settings.release?.d6Wp2Staging!==true||
    settings.manifest?.d6Wp2Staging!==true))
  throw Error('D6 WP2 staging build identity missing');
 // Even after both read checks, nothing authorizes a repository write.
 if(d6OwnerConnection&&
   (settings.release?.d6OwnerConnectionCandidate!==true||
    settings.manifest?.d6OwnerConnectionCandidate!==true))
  throw Error('D6 approved Connection Status build identity missing');
 if(d6EditorPreview&&(!d6OwnerConnection||
    settings.release?.d6OwnerEditorPreview!==true||
    settings.manifest?.d6OwnerEditorPreview!==true))
  throw Error('D6 owner editor preview build identity missing');
 return {v3:{...reader,ownerReadiness,canonicalSource,
  wp2Staging:d6Wp2Staging,ownerConnectionCandidate:d6OwnerConnection,
  ownerEditorPreview:d6EditorPreview}};
}
Promise.resolve().then(()=>bootstrap(settings,d6Context())).catch(error=>{
 const main=document.getElementById('app');main.replaceChildren();
 const heading=document.createElement('h1');heading.textContent='Fishing Companion could not load';
 const message=document.createElement('p');message.textContent=error.message;
 const retry=document.createElement('button');retry.textContent='Retry';retry.onclick=()=>location.reload();
 main.append(heading,message,retry);console.error(error);
});
