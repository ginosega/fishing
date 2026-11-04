import {bootstrap} from './app.mjs';
import {selectV3ReaderCandidate} from './v3-reader-candidate.mjs';
import {startD5OwnerCandidate} from './d5-owner-candidate.mjs';
import {installPageHero} from './page-hero.mjs';
const settings=globalThis.__FISHING_BOOT__;
installPageHero();
const readerCandidate=typeof __FISHING_V3_READER_CANDIDATE__!=='undefined'&&
 __FISHING_V3_READER_CANDIDATE__===true;
const ownerCandidate=typeof __FISHING_V3_OWNER_CANDIDATE__!=='undefined'&&
 __FISHING_V3_OWNER_CANDIDATE__===true;
const safeStorage=()=>{try{return globalThis.localStorage??null;}catch{return null;}};
Promise.resolve().then(()=>ownerCandidate?
 startD5OwnerCandidate(settings,{storage:safeStorage()}):readerCandidate?
 bootstrap(settings,{v3:selectV3ReaderCandidate({enabled:true,
  root:settings.root,release:settings.release,manifest:settings.manifest})}):
 bootstrap(settings)).catch(error=>{
 const main=document.getElementById('app');main.replaceChildren();
 const heading=document.createElement('h1');heading.textContent='Fishing Companion could not load';
 const message=document.createElement('p');message.textContent=error.message;
 const retry=document.createElement('button');retry.textContent='Retry';retry.onclick=()=>location.reload();
 main.append(heading,message,retry);console.error(error);
});
