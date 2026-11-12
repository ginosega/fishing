/**
 * D6 canonical-production owner session bridge — SOURCE ONLY.
 *
 * Selectively reuses the already field-tested D2/D5 first-party session
 * verifier. It does NOT install login/callback routes, connect a Worker,
 * bind a D1 database or secret, issue a cookie, grant publishing authority,
 * or expose the sandbox writer.
 *
 * The only public projection is authenticated/authorized/login. Even the
 * session's internal CSRF value and expiration do not cross this boundary.
 */
import {createD2UnifiedOwnerSession} from './d2-unified-owner-session.mjs';
import {isD6GatewayOrigin}
 from '../../../../pwa/server/d6-pages-path-gateway.mjs';

export const D6_OWNER_SESSION_ORIGIN='https://fishing.ginosega.workers.dev';
export const D6_OWNER_GITHUB_ID=265665562;

export function createD6ProductionOwnerSession({
 AUTH_DB,csrfKey,enabled=()=>false,now,
 origin=D6_OWNER_SESSION_ORIGIN,
}={}){
 if(!isD6GatewayOrigin(origin)||typeof enabled!=='function'||
   (now!==undefined&&typeof now!=='function'))
  throw Error('D6 owner session configuration invalid');
 let delegate=null;
 const requireDelegate=()=>{
  // Never use a cached session verifier after the capability is disabled.
  if(enabled()!==true)throw Error('D6 owner session unavailable');
  if(!delegate)delegate=createD2UnifiedOwnerSession({
   AUTH_DB,ownerGitHubId:D6_OWNER_GITHUB_ID,
   origin,csrfKey,now,
  });
  return delegate;
 };
 async function describe(request){
  const result=await requireDelegate().describe(request);
  const response={authenticated:result.authenticated===true,
   authorized:result.authorized===true};
  if(response.authenticated&&response.authorized&&
    result.ownerLogin==='ginosega')response.ownerLogin='ginosega';
  // No CSRF, session cookie/hash, owner ID or expiry in a status response.
  return Object.freeze(response);
 }
 async function authorizeStatus(request){
  const verified=await requireDelegate().authorizeStatus(request);
  if(verified?.authorized!==true||
    verified.ownerGitHubId!==D6_OWNER_GITHUB_ID)
   throw Error('D6 owner session unavailable');
  // Server-side only; the D6 gateway checks this owner ID a second time.
  return Object.freeze({ownerGitHubId:D6_OWNER_GITHUB_ID,authorized:true});
 }
 // Deliberately no authorizeWrite, OAuth, media, or publishing method.
 return Object.freeze({describe,authorizeStatus});
}
