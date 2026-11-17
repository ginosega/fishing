/**
 * D6 provider-facing READ transport and gateway factory.
 * SOURCE ONLY: no Worker default export, OAuth callback, secrets, GitHub
 * App token generation, binding to a route or deployment descriptor.
 *
 * Future production credentials and owner sessions must be separately
 * reviewed. The only credentials accepted here are injected, trusted
 * server-side read-token issuers; nothing can publish.
 */
import {createD6SameOriginGateway}
 from './d6-same-origin-gateway.mjs';
import {createD6HostedBytesPreflight}
 from './d6-hosted-bytes-preflight.mjs';
import {D6_TRUSTED_PAGES_BASE}
 from './d6-hosted-revision-reader.mjs';
import {isD6TrustedPagesBase,D6_PUBLIC_ORIGIN}
 from '../../../../pwa/server/d6-pages-path-gateway.mjs';
import {D6_PROOF_ORIGINS}
 from './d6-hosted-bytes-preflight.mjs';

const API='https://api.github.com/repos/ginosega/fishing';
const GRAPHQL='https://api.github.com/graphql';
const SHA=/^[a-f0-9]{40}$/;
const fail=()=>{throw Error('D6 trusted read transport denied');};
const isPage=(url,pagesBase)=>{
 const PAGE=new URL(pagesBase);
 let u;
 try{u=new URL(url);}catch{return false;}
 return u.origin===PAGE.origin&&u.pathname.startsWith(PAGE.pathname)&&
  !u.username&&!u.password&&!u.search&&!u.hash&&
  !/%(?:2f|5c|2e|00)/i.test(u.pathname);
};
const isGateway=(url,origin)=>{
 const GATEWAY=new URL(origin+'/fishing/');
 let u;
 try{u=new URL(url);}catch{return false;}
 return u.origin===GATEWAY.origin&&u.pathname.startsWith(GATEWAY.pathname)&&
  !u.username&&!u.password&&!u.search&&!u.hash&&
  !/%(?:2f|5c|2e|00)/i.test(u.pathname);
};
const isGitHub=url=>{
 let u;
 try{u=new URL(url);}catch{return false;}
 if(u.origin!=='https://api.github.com'||u.username||u.password||
  u.hash)return false;
 const base='/repos/ginosega/fishing';
 const p=u.pathname;
 if(p===base)return u.search==='';
 if(p===base+'/git/ref/heads/main')return u.search==='';
 if(new RegExp('^'+base+'/git/(?:commits|blobs)/[a-f0-9]{40}$').test(p))
  return u.search==='';
 if(new RegExp('^'+base+'/git/trees/[a-f0-9]{40}$').test(p))
  return u.search===''||u.search==='?recursive=1';
 return false;
};

export function createD6ReadProviderCandidate({
 transport,ownerSession,issueReadToken,
 pagesBase=D6_TRUSTED_PAGES_BASE,origin=D6_PUBLIC_ORIGIN,
 stagingMode=false,
 gatewayEnabled=false,staticEnabled=false,
 sessionEnabled=false,sourceEnabled=false,preflightEnabled=false,
}={}){
 if(typeof transport!=='function'||
  typeof ownerSession?.describe!=='function'||
  typeof ownerSession?.authorizeStatus!=='function'||
  typeof issueReadToken!=='function'||
  [gatewayEnabled,staticEnabled,sessionEnabled,sourceEnabled,preflightEnabled]
   .some(value=>typeof value!=='boolean')||
  !isD6TrustedPagesBase(pagesBase)||typeof stagingMode!=='boolean')fail();

 const fetchStaticAsset=(url,options)=>{
  if(!isPage(url,pagesBase)||!['GET','HEAD'].includes(options?.method)||
   options.redirect!=='manual')fail();
  return transport(url,{method:options.method,redirect:'manual',
   cache:'no-store',credentials:'omit'});
 };
 const fetchHostedAsset=(url,options)=>{
  if(!isPage(url,pagesBase)||options?.method!=='GET'||
   options.redirect!=='manual')fail();
  return transport(url,{method:'GET',redirect:'manual',cache:'no-store',
   credentials:'omit',
   headers:{Accept:'application/json'}});
 };
 const requestGitHub=(url,options)=>{
  const graphql=url===GRAPHQL&&options?.method==='POST'&&
   options?.headers?.['Content-Type']==='application/json'&&
   typeof options?.body==='string'&&options.body.length<=16000&&
   options.body.startsWith('{"query":"query WP2VerifiedMarkdown ');
  if(!graphql&&(!isGitHub(url)||options?.method!=='GET'||
   options?.body!==undefined))fail();
  if(options?.redirect!=='manual'||
   typeof options?.headers?.Authorization!=='string'||
   !/^Bearer [^\s]{12,}$/.test(options.headers.Authorization)||
   options.headers.Accept!=='application/vnd.github+json')fail();
  return transport(url,{
   method:graphql?'POST':'GET',
   redirect:'manual',cache:'no-store',credentials:'omit',
   headers:{...options.headers},
   ...(graphql?{body:options.body}:{}),
  });
 };
 const fetchGateway=(url,options)=>{
  if(!isGateway(url,origin)||options?.method!=='GET'||
   options.redirect!=='manual')fail();
  return transport(url,{method:'GET',redirect:'manual',cache:'no-store',
   credentials:'omit'});
 };
 const gateway=createD6SameOriginGateway({
  fetchStaticAsset,fetchHostedAsset,requestGitHub,issueReadToken,
  ownerSession,pagesBase,origin,stagingMode,
  gatewayEnabled:()=>gatewayEnabled,
  staticEnabled:()=>staticEnabled,
  sessionEnabled:()=>sessionEnabled,
  sourceEnabled:()=>sourceEnabled,
 });
 const hosted=createD6HostedBytesPreflight({
  fetchPages:fetchStaticAsset,fetchGateway,pagesBase,origin,
  enabled:()=>preflightEnabled,
 });
 return Object.freeze({
  fetch:gateway.fetch,
  // This is an operator preflight, NOT a browser route or automatic
  // request-time check. It only yields evidence for owner review.
  verifyHostedBytes:hosted.verify,
 });
}
