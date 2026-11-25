/**
 * D6 canonical-production READ pipeline composition — SOURCE ONLY.
 *
 * Connects the D6 owner-session/read gateway to the independently vetted
 * production GitHub App contents:read token issuer. Not a deployable Worker,
 * OAuth callback, cloud binding, credential store or publisher.
 *
 * All gateway/session/source/token capabilities default OFF. A separate
 * tokenEnabled switch is required in addition to every session/source gate.
 * No sandbox repository token or pre-existing D2/D3 credential is used.
 */
import {createD6ProductionReadComposition}
 from './d6-production-read-composition.mjs';
import {createD6ProductionReadTokenIssuer}
 from './d6-production-read-token.mjs';

export function createD6ProductionReadWithApp({
 transport,requestAppGitHub,signAppJwt,appEnv,
 AUTH_DB,csrfKey,now,pagesBase,origin,stagingMode=false,
 gatewayEnabled=false,staticEnabled=false,sessionEnabled=false,
 sourceEnabled=false,tokenEnabled=false,preflightEnabled=false,
}={}){
 const switches=[gatewayEnabled,staticEnabled,sessionEnabled,
  sourceEnabled,tokenEnabled,preflightEnabled];
 if(switches.some(x=>typeof x!=='boolean')||
  (now!==undefined&&typeof now!=='function'))
  throw Error('Invalid D6 read-with-App configuration');

 // Both the selected owner session and independently verified hosted V3
 // canonical-main source are required before a read token is requested.
 // The read issuer itself also verifies its exact repo/installation/scope.
 const issuer=createD6ProductionReadTokenIssuer({
  env:appEnv,request:requestAppGitHub,signAppJwt,now,
  enabled:()=>gatewayEnabled===true&&sessionEnabled===true&&
   sourceEnabled===true&&tokenEnabled===true,
 });
 const provider=createD6ProductionReadComposition({
  transport,AUTH_DB,csrfKey,now,pagesBase,origin,stagingMode,
  issueReadToken:issuer.issueReadToken,
  gatewayEnabled,staticEnabled,sessionEnabled,
  sourceEnabled,preflightEnabled,
 });
 // Do not export issuer, session implementation, App key, token, or
 // any write method. Explicit hosted preflight is not an HTTP route.
 return Object.freeze({
  fetch:provider.fetch,
  verifyHostedBytes:provider.verifyHostedBytes,
 });
}
