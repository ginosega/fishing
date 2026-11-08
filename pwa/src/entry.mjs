import {bootstrap} from './app.mjs';
import {selectD6PublicReader} from './d6-public-reader.mjs';
import {installPageHero} from './page-hero.mjs';
const settings=globalThis.__FISHING_BOOT__;
installPageHero();
const d6Reader=typeof __FISHING_D6_PUBLIC_READER__!=='undefined'&&
 __FISHING_D6_PUBLIC_READER__===true;
Promise.resolve().then(()=>bootstrap(settings,d6Reader?
 {v3:selectD6PublicReader({enabled:true,root:settings.root,
  release:settings.release,manifest:settings.manifest})}:{})).catch(error=>{
 const main=document.getElementById('app');main.replaceChildren();
 const heading=document.createElement('h1');heading.textContent='Fishing Companion could not load';
 const message=document.createElement('p');message.textContent=error.message;
 const retry=document.createElement('button');retry.textContent='Retry';retry.onclick=()=>location.reload();
 main.append(heading,message,retry);console.error(error);
});
