/**
 * Standalone private test-entry bundle. NEVER import from the public V2
 * entrypoint or install as a public canonical /fishing/ release asset.
 * Host only under the owner-session-gated, no-store D3 pilot route.
 */
import {createD3OwnerPilotEntry} from './d3-owner-pilot-entry.mjs';
import {installPageHero} from '../../../../pwa/src/page-hero.mjs';
const main=document.getElementById('app');
const fail=error=>{
  if(!main)return;
  main.replaceChildren();
  const title=document.createElement('h1');
  title.textContent='Sandbox test unavailable';
  const message=document.createElement('p');
  message.textContent='The private owner pilot could not load. The public Fishing Companion is unchanged.';
  main.append(title,message);
  console.error('D3_PILOT_BOOTSTRAP_FAILED',error?.code??'UNAVAILABLE');
};
try{
  installPageHero();
  const entry=createD3OwnerPilotEntry({
    origin:location.origin,
    request:(url,opts)=>fetch(url,opts),
    documentObject:document,
    windowObject:window,
    // Pilot bundling alone does not authorize a server session or GitHub
    // write. The dedicated Worker test-only route must check those itself.
    enabled:()=>true,
    online:()=>navigator.onLine,
    storage:window.localStorage,
  });
  void entry.start().catch(fail);
}catch(error){fail(error);}
