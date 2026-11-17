/**
 * D6 production-origin, source-only READ composition.
 *
 * One trusted HTTPS gateway, one owner identity authority. No Worker default
 * export, OAuth callback, session cookie issuance, secrets/bindings, GitHub
 * installation token minting, publishing APIs or scheduled coordinator.
 *
 * ALL capabilities default OFF. This factory only composes existing
 * validated D6 read components; activating real provider bindings requires
 * separately approved source, security review and owner authorization.
 */
import {createD6ProductionOwnerSession} from './d6-production-owner-session.mjs';
import {createD6ReadProviderCandidate} from './d6-read-provider-candidate.mjs';

export function createD6ProductionReadComposition({
 transport,issueReadToken,AUTH_DB,csrfKey,now,pagesBase,origin,stagingMode=false,
 gatewayEnabled=false,staticEnabled=false,sessionEnabled=false,
 sourceEnabled=false,preflightEnabled=false,
}={}){
 const flags=[gatewayEnabled,staticEnabled,sessionEnabled,
  sourceEnabled,preflightEnabled];
 if(flags.some(value=>typeof value!=='boolean')||
   (now!==undefined&&typeof now!=='function'))
  throw Error('Invalid D6 production read configuration');

 // The D5-proven session verifier handles only the exact production host
 // and selected owner. Neither this composition nor its public projection
 // exposes the CSRF token, cookie/session hash, D1 handle or owner ID.
 const ownerSession=createD6ProductionOwnerSession({
  AUTH_DB,csrfKey,now,origin,
  enabled:()=>gatewayEnabled===true&&sessionEnabled===true,
 });

 const provider=createD6ReadProviderCandidate({
  transport,issueReadToken,ownerSession,pagesBase,origin,stagingMode,
  gatewayEnabled,staticEnabled,sessionEnabled,
  sourceEnabled,preflightEnabled,
 });
 // Both exported operations are read-only. verifyHostedBytes is an
 // explicit operator preflight, never an HTTP route.
 return Object.freeze({
  fetch:provider.fetch,
  verifyHostedBytes:provider.verifyHostedBytes,
 });
}
