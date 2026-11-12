/**
 * D6 canonical-production READ composition with trusted App JWT signer.
 * SOURCE ONLY. No deployable Worker, OAuth flow, Cloudflare bindings, live
 * credentials, App installation, token HTTP route, or publisher.
 *
 * All server capabilities are explicit and default OFF. A production App
 * signing capability is independent of the session/source/read-token gates.
 * The signer returns an App JWT only to the trusted read-token issuer; neither
 * the key nor any JWT or installation token crosses the browser boundary.
 */
import {createD6ProductionReadWithApp}
 from './d6-production-read-with-app.mjs';
import {createD6ProductionAppSigner}
 from './d6-production-app-signer.mjs';

export function createD6ProductionReadWithSigner({
 transport,requestAppGitHub,appEnv,AUTH_DB,csrfKey,now,cryptoApi,pagesBase,
 gatewayEnabled=false,staticEnabled=false,sessionEnabled=false,
 sourceEnabled=false,tokenEnabled=false,signerEnabled=false,
 preflightEnabled=false,
}={}){
 const flags=[gatewayEnabled,staticEnabled,sessionEnabled,sourceEnabled,
  tokenEnabled,signerEnabled,preflightEnabled];
 if(flags.some(flag=>typeof flag!=='boolean')||
  (now!==undefined&&typeof now!=='function'))
  throw Error('Invalid D6 production signed read configuration');

 // A live runtime must separately approve both token minting and signing,
 // plus all exact-owner/hosted-source gates. Disable is rechecked at signing.
 const signer=createD6ProductionAppSigner({
  cryptoApi,
  enabled:()=>gatewayEnabled===true&&sessionEnabled===true&&
   sourceEnabled===true&&tokenEnabled===true&&signerEnabled===true,
 });
 const reader=createD6ProductionReadWithApp({
  transport,requestAppGitHub,signAppJwt:signer.signAppJwt,appEnv,
  AUTH_DB,csrfKey,now,pagesBase,
  gatewayEnabled,staticEnabled,sessionEnabled,sourceEnabled,
  tokenEnabled,preflightEnabled,
 });
 // Expose only public/static and authorized READ handlers plus the explicit
 // operator-hosted preflight. Never export the signer, App grant or keys.
 return Object.freeze({
  fetch:reader.fetch,
  verifyHostedBytes:reader.verifyHostedBytes,
 });
}
