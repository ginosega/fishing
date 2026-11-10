/**
 * D6 production OAuth and canonical READ composition — SOURCE ONLY.
 *
 * Reuses the reviewed production session + App READ gateway and the
 * field-compatible first-party PKCE issuer. This is NOT a Worker entrypoint,
 * credential installer, Cloudflare binding, publisher, or public deployment.
 * Every route family is default OFF; OAuth is independently gated.
 */
import {createD6ProductionReadWithSigner}
 from './d6-production-read-with-signer.mjs';
import {createD6ProductionOAuthSessionIssuer,D6_OAUTH_ORIGIN}
 from './d6-production-oauth-session-issuer.mjs';

const response=(status,error)=>new Response(JSON.stringify({ok:false,error}),{
 status,headers:{
  'Cache-Control':'private, no-store, max-age=0',
  'Content-Type':'application/json; charset=utf-8',
  'X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'no-referrer',
 },
});
export function createD6ProductionOAuthReadComposition({
 transport,requestAppGitHub,requestOAuthGitHub,appEnv,
 oauthClientId,oauthClientSecret,AUTH_DB,csrfKey,cryptoApi,now,
 gatewayEnabled=false,staticEnabled=false,sessionEnabled=false,
 sourceEnabled=false,tokenEnabled=false,signerEnabled=false,
 oauthEnabled=false,preflightEnabled=false,
}={}){
 const flags=[gatewayEnabled,staticEnabled,sessionEnabled,sourceEnabled,
  tokenEnabled,signerEnabled,oauthEnabled,preflightEnabled];
 if(flags.some(flag=>typeof flag!=='boolean')||
    (now!==undefined&&typeof now!=='function'))
  throw Error('Invalid D6 production OAuth-read configuration');

 const reader=createD6ProductionReadWithSigner({
  transport,requestAppGitHub,appEnv,AUTH_DB,csrfKey,cryptoApi,now,
  gatewayEnabled,staticEnabled,sessionEnabled,sourceEnabled,
  tokenEnabled,signerEnabled,preflightEnabled,
 });
 const login=createD6ProductionOAuthSessionIssuer({
  AUTH_DB,clientId:oauthClientId,clientSecret:oauthClientSecret,
  requestGitHub:requestOAuthGitHub,cryptoApi,now,
  // OAuth sign-in works without enabling App signing/read or publishing,
  // but it does require the same owner-session and gateway permission.
  enabled:()=>gatewayEnabled===true&&sessionEnabled===true&&
   oauthEnabled===true,
 });
 async function fetchRequest(request){
  if(!(request instanceof Request))return reader.fetch(request);
  let url;
  try{url=new URL(request.url);}catch{return response(404,'NOT_FOUND');}
  if(url.pathname==='/auth/start'||url.pathname==='/auth/callback'){
   if(url.origin!==D6_OAUTH_ORIGIN||url.username||url.password)
    return response(404,'NOT_FOUND');
   const origin=request.headers.get('Origin');
   if(origin&&origin!==D6_OAUTH_ORIGIN)
    return response(403,'ORIGIN_DENIED');
   if(!gatewayEnabled||!sessionEnabled||!oauthEnabled)
    return response(503,'TEMPORARILY_UNAVAILABLE');
   // The callback must accept a GitHub cross-site top-level redirect, but
   // PKCE state, host-only flow cookie, and atomic D1 consumption all apply.
   return url.pathname==='/auth/start'?
    login.start(request):login.callback(request);
  }
  return reader.fetch(request);
 }
 // Never return the OAuth issuer, GitHub tokens, D1, CSRF or signer.
 return Object.freeze({
  fetch:fetchRequest,
  verifyHostedBytes:reader.verifyHostedBytes,
 });
}
