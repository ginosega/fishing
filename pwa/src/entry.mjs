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
const d6OwnerConnection=typeof __FISHING_D6_OWNER_CONNECTION__!=='undefined'&&
 __FISHING_D6_OWNER_CONNECTION__===true;
function d6Context(){
 if(!d6Reader)return {};
 const reader=selectD6PublicReader({enabled:true,staticStaging:d6StaticStaging,
  root:settings.root,
  release:settings.release,manifest:settings.manifest});
 // Staging may expose only immutable anonymous reading. It never creates
 // a session probe or a canonical authoring-source client.
 if(d6StaticStaging)return {v3:{...reader}};
 const ownerReadiness=createD6OwnerSessionReadiness({
  root:settings.root,request:(url,options)=>fetch(url,options),
  enabled:()=>true,online:()=>navigator.onLine===true,
 });
 const canonicalSource=createD6CanonicalSourceClient({
  root:settings.root,expectedReleaseRevision:settings.release.sourceRevision,
  request:(url,options)=>fetch(url,options),
  enabled:()=>true,online:()=>navigator.onLine===true,
 });
 // Even after both read checks, nothing authorizes a repository write.
 if(d6OwnerConnection&&
   (settings.release?.d6OwnerConnectionCandidate!==true||
    settings.manifest?.d6OwnerConnectionCandidate!==true))
  throw Error('D6 approved Connection Status build identity missing');
 return {v3:{...reader,ownerReadiness,canonicalSource,
  ownerConnectionCandidate:d6OwnerConnection}};
}
Promise.resolve().then(()=>bootstrap(settings,d6Context())).catch(error=>{
 const main=document.getElementById('app');main.replaceChildren();
 const heading=document.createElement('h1');heading.textContent='Fishing Companion could not load';
 const message=document.createElement('p');message.textContent=error.message;
 const retry=document.createElement('button');retry.textContent='Retry';retry.onclick=()=>location.reload();
 main.append(heading,message,retry);console.error(error);
});
