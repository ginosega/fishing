import {bootstrap} from './app.mjs';
import {selectD6PublicReader} from './d6-public-reader.mjs';
import {createD6OwnerSessionReadiness} from './d6-owner-session-readiness.mjs';
import {installPageHero} from './page-hero.mjs';
const settings=globalThis.__FISHING_BOOT__;
installPageHero();
const d6Reader=typeof __FISHING_D6_PUBLIC_READER__!=='undefined'&&
 __FISHING_D6_PUBLIC_READER__===true;
function d6Context(){
 if(!d6Reader)return {};
 const reader=selectD6PublicReader({enabled:true,root:settings.root,
  release:settings.release,manifest:settings.manifest});
 const ownerReadiness=createD6OwnerSessionReadiness({
  root:settings.root,request:(url,options)=>fetch(url,options),
  enabled:()=>true,online:()=>navigator.onLine===true,
 });
 // The owner readiness check is read-only UI status; it cannot grant writes.
 return {v3:{...reader,ownerReadiness}};
}
Promise.resolve().then(()=>bootstrap(settings,d6Context())).catch(error=>{
 const main=document.getElementById('app');main.replaceChildren();
 const heading=document.createElement('h1');heading.textContent='Fishing Companion could not load';
 const message=document.createElement('p');message.textContent=error.message;
 const retry=document.createElement('button');retry.textContent='Retry';retry.onclick=()=>location.reload();
 main.append(heading,message,retry);console.error(error);
});
