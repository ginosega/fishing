/**
 * FISH118 D3: actual deployable same-origin Worker entry.
 * NOT DEPLOYED / DEFAULT OFF. Build ignored Text module FIRST with
 * pwa/tools/build-d3-pilot.mjs and validate its exact local SHA-256.
 *
 * Wrangler imports .txt files as Text modules (non-JavaScript), so this
 * bundle is packaged within the owner Worker; there is NO separate static
 * asset, public R2 bucket, Pages route or unauthorized asset binding.
 * Only the independently owner-authenticated /__d3_pilot__/ endpoint may
 * return these bytes, with no-store and checksum verification on each GET.
 *
 * The public /fishing/ proxy and existing parked D2 Worker remain unchanged
 * until a separately authorized version-locked deployment.
 */
import pilotSource from './generated/d3-pilot.bundle.txt';
import pilotStyle from './generated/d3-pilot.css.txt';
import {createD3LiveOwnerWorker} from './d3-live-owner-worker.mjs';
import {createD3GatedAuthGateway} from './d3-gated-auth-gateway.mjs';

const bytes=new TextEncoder().encode(pilotSource);
const cssBytes=new TextEncoder().encode(pilotStyle);
if(bytes.length<1024||bytes.length>3*1024*1024)
 throw Error('D3 pilot bundle missing or too large');
if(cssBytes.length<1024||cssBytes.length>160*1024)
 throw Error('D3 private stylesheet missing or too large');
const route=createD3GatedAuthGateway({
 readPilotBundle:async()=>new Uint8Array(bytes),
 readPilotStylesheet:async()=>new Uint8Array(cssBytes),
});
export default createD3LiveOwnerWorker({route});

// Source-only class export; NO durable_object binding or migration is active.
export {D3FastWakeAlarm} from './d3-fast-wake-do.mjs';
