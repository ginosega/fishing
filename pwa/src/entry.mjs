import {bootstrap} from './app.mjs';
import {installPageHero} from './page-hero.mjs';
const settings=globalThis.__FISHING_BOOT__;
installPageHero();
bootstrap(settings).catch(error=>{
 const main=document.getElementById('app');main.replaceChildren();
 const heading=document.createElement('h1');heading.textContent='Fishing Companion could not load';
 const message=document.createElement('p');message.textContent=error.message;
 const retry=document.createElement('button');retry.textContent='Retry';retry.onclick=()=>location.reload();
 main.append(heading,message,retry);console.error(error);
});
