/**
 * D6 isolated production runtime binding contract — SOURCE ONLY.
 *
 * Accepts trusted Cloudflare-shaped bindings and an explicitly injected server
 * transport, but exports NO Worker entrypoint, deployed route, credentials,
 * writer, migration, cron or GitHub provider privilege activation.
 *
 * Exact strings, host and repository/owner pins plus an independent global
 * kill switch are required. Nothing is enabled merely by a secret existing.
 * D6_* values are NOT browser request parameters or query switches.
 */
import {createD6ProductionOAuthReadComposition}
 from './d6-production-oauth-read-composition.mjs';
import {D6_GITHUB_PAGES_BASE,D6_ISOLATED_PAGES_BASE}
 from '../../../../pwa/server/d6-pages-path-gateway.mjs';
import {D6_WP2_STAGING_ORIGIN}
 from '../../../../pwa/src/d6-public-reader.mjs';

const ORIGIN='https://fishing.ginosega.workers.dev';
const OWNER='265665562';
const REPO='1350909744';
const API='https://api.github.com';
const fail=()=>{throw Error('D6 trusted runtime outbound request denied');};
const blocked=()=>new Response(JSON.stringify({
 ok:false,error:'TEMPORARILY_UNAVAILABLE',
}),{status:503,headers:{
 'Content-Type':'application/json; charset=utf-8',
 'Cache-Control':'private, no-store, max-age=0',
 'X-Content-Type-Options':'nosniff',
}});
const httpOpts=(opts)=>opts&&opts.redirect==='manual'&&
 opts.credentials==='omit'&&opts.cache==='no-store';
const httpsExact=(url,expected)=>{
 if(typeof url!=='string')return false;
 let u;try{u=new URL(url);}catch{return false;}
 return u.protocol==='https:'&&!u.username&&!u.password&&
  !u.hash&&u.toString()===expected;
};
const num=v=>typeof v==='string'&&/^[1-9]\d{0,15}$/.test(v)&&
 Number.isSafeInteger(Number(v));

/**
 * The runtime must be constructed only in trusted server code. In tests the
 * network argument is a fake HTTPS backend; production must inject native
 * fetch. The adapter never exposes network or credentials as returned fields.
 */
export function createD6ProductionRuntimeBindingContract({
 env={},network=globalThis.fetch,cryptoApi=globalThis.crypto,now,
}={}){
 if(!env||typeof env!=='object'||typeof network!=='function'||
    (now!==undefined&&typeof now!=='function'))
  throw Error('D6 runtime binding configuration denied');
 // Only two immutable trust profiles. Staging credentials/cookies must not
 // accidentally be accepted on the future public production hostname.
 const stagingMode=env.D6_WP2_STAGING_ENABLED==='true';
 const origin=stagingMode?D6_WP2_STAGING_ORIGIN:ORIGIN;
 const isolated=env.D6_ISOLATED_PAGES_ENABLED==='true';
 const globalOn=env.D6_PRODUCTION_ENABLED==='true'&&
   env.D6_ORIGIN===origin&&
   env.D6_OWNER_GITHUB_ID===OWNER&&
   env.D6_REPOSITORY_ID===REPO&&
   (stagingMode?isolated:!isolated);
 const gatewayEnabled=globalOn&&env.D6_GATEWAY_ENABLED==='true';
 const flag=name=>gatewayEnabled&&env[name]==='true';
 const staticEnabled=flag('D6_STATIC_ENABLED');
 const sessionEnabled=flag('D6_SESSION_ENABLED');
 const sourceEnabled=flag('D6_SOURCE_ENABLED');
 const tokenEnabled=flag('D6_READ_TOKEN_ENABLED');
 const signerEnabled=flag('D6_SIGNER_ENABLED');
 const oauthEnabled=flag('D6_OAUTH_ENABLED');
 const signoutEnabled=flag('D6_SIGNOUT_ENABLED');
 const preflightEnabled=flag('D6_HOSTED_PREFLIGHT_ENABLED');
 // Only a trusted server-side exact-string flag can select D6 Stage A Pages.
 // Never derive the upstream from a browser-supplied URL or header.
 const pagesBase=stagingMode?
  D6_ISOLATED_PAGES_BASE:D6_GITHUB_PAGES_BASE;
 const readTarget=API+'/repos/ginosega/fishing/installation';
 const installation=num(env.D6_GITHUB_INSTALLATION_ID)?
  API+'/app/installations/'+env.D6_GITHUB_INSTALLATION_ID:null;
 const mint=installation?installation+'/access_tokens':null;

 const transport=async(url,options)=>{
  // POST is permitted only for bounded GitHub GraphQL immutable blob reads.
  // All remaining URLs and write-capable methods retain their old deny gate.
  const graphql=url===API+'/graphql'&&options?.method==='POST'&&
   options?.headers?.['Content-Type']==='application/json'&&
   typeof options?.body==='string'&&options.body.length<=16000&&
   options.body.startsWith('{"query":"query WP2VerifiedMarkdown ')&&
   /^Bearer [^\s]{12,}$/.test(options?.headers?.Authorization??'');
  if(typeof url!=='string'||!url.startsWith('https://')||
    !httpOpts(options)||!graphql&&options.method!=='GET'&&
    options.method!=='HEAD')fail();
  return network(url,options);
 };
 const requestAppGitHub=async(url,options)=>{
  const valid=(installation&&httpsExact(url,installation)&&
    options?.method==='GET')||
   (httpsExact(url,readTarget)&&options?.method==='GET')||
   (mint&&httpsExact(url,mint)&&options?.method==='POST');
  if(!valid||!httpOpts(options)||
    !/^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(
     options?.headers?.Authorization??'')||
    (options?.method==='POST'?
     typeof options?.body!=='string'||
      options.headers['Content-Type']!=='application/json':
      options?.body!==undefined))fail();
  return network(url,options);
 };
 const requestOAuthGitHub=async(url,options)=>{
  const exchange='https://github.com/login/oauth/access_token';
  const identity=API+'/user';
  const valid=(httpsExact(url,exchange)&&options?.method==='POST'&&
   options?.headers?.['Content-Type']==='application/json'&&
   typeof options?.body==='string')||
   (httpsExact(url,identity)&&options?.method==='GET'&&
    options?.body===undefined&&
    /^Bearer [A-Za-z0-9_-]{16,2048}$/.test(
     options?.headers?.Authorization??''));
  if(!valid||!httpOpts(options))fail();
  return network(url,options);
 };
 // All flags default OFF. A missing or mis-pinned configuration returns
 // 503 *without building a credentialed composition or touching the network*.
 if(!globalOn)return Object.freeze({
  fetch:async()=>blocked(),
 });
 const composed=createD6ProductionOAuthReadComposition({
  transport,requestAppGitHub,requestOAuthGitHub,
  appEnv:{
   D6_GITHUB_APP_ID:env.D6_GITHUB_APP_ID,
   D6_GITHUB_INSTALLATION_ID:env.D6_GITHUB_INSTALLATION_ID,
   D6_GITHUB_APP_PRIVATE_KEY:env.D6_GITHUB_APP_PRIVATE_KEY,
  },
  oauthClientId:env.D6_OAUTH_CLIENT_ID,
  oauthClientSecret:env.D6_OAUTH_CLIENT_SECRET,
  AUTH_DB:env.AUTH_DB,csrfKey:env.D6_CSRF_KEY,
  cryptoApi,now,pagesBase,origin,stagingMode,
  gatewayEnabled,staticEnabled,sessionEnabled,
  sourceEnabled,tokenEnabled,signerEnabled,
  oauthEnabled,signoutEnabled,preflightEnabled,
 });
 return Object.freeze({fetch:composed.fetch,
  // Operator-only preflight is NOT an HTTP route; caller must not publish it.
  verifyHostedBytes:composed.verifyHostedBytes,
 });
}
