import {bootstrap} from './app.mjs';
import {selectV3ReaderCandidate} from './v3-reader-candidate.mjs';
import {installPageHero} from './page-hero.mjs';
const settings=globalThis.__FISHING_BOOT__;
installPageHero();
const readerCandidate=typeof __FISHING_V3_READER_CANDIDATE__!=='undefined'&&
 __FISHING_V3_READER_CANDIDATE__===true;
Promise.resolve().then(()=>bootstrap(settings,{
 v3:selectV3ReaderCandidate({enabled:readerCandidate,
  root:settings.root,release:settings.release,manifest:settings.manifest}),
})).catch(error=>{
 const main=document.getElementById('app');main.replaceChildren();
 const heading=document.createElement('h1');heading.textContent='Fishing Companion could not load';
 const message=document.createElement('p');message.textContent=error.message;
 const retry=document.createElement('button');retry.textContent='Retry';retry.onclick=()=>location.reload();
 main.append(heading,message,retry);console.error(error);
});
