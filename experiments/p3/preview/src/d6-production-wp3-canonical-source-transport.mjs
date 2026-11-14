/**
 * FISH-TODO-118 WP3 — existing D6 canonical GitHub SOURCE loader transport.
 * SOURCE ONLY / UNMOUNTED / DEFAULT OFF.
 *
 * The original source loader uses {method,headers,redirect:'manual'} while
 * #488's publishing coordinator transport also demands explicit cache and
 * credentials options. This adapter verifies the original request form and
 * adds only cache:no-store / credentials:omit on outbound network requests.
 *
 * Accept only exact immutable GitHub source endpoints: pinned repository,
 * main ref, commits, blobs and trees with at most ?recursive=1; plus the
 * original bounded WP2VerifiedMarkdown read-only GraphQL batch. No mutations,
 * user-selected endpoints, cookies, redirects, CORS or credential leakage.
 */
import {D6_PUBLISH_REPOSITORY as REPO}
 from './d6-production-publish-intake.mjs';

const ROOT='https://api.github.com/repos/'+REPO.name;
const GQL='https://api.github.com/graphql';
const SHA='[0-9a-f]{40}';
const PATH=new RegExp('^/repos/'+REPO.name.replace('/','\\/')+
 '/git/(?:commits|blobs|trees)/'+SHA+'$');
const GIT_TREE=new RegExp('^/repos/'+REPO.name.replace('/','\\/')+
 '/git/trees/'+SHA+'$');
const MAIN='/repos/'+REPO.name+'/git/ref/heads/main';
const HEADER_KEYS=new Set(['Authorization','Accept','X-GitHub-Api-Version',
 'User-Agent','Content-Type']);
export class D6Wp3CanonicalSourceTransportError extends Error{
 constructor(code){
  super('WP3 canonical-source transport denied');
  this.name='D6Wp3CanonicalSourceTransportError';this.code=code;
 }
}
const deny=code=>{throw new D6Wp3CanonicalSourceTransportError(code);};
const need=(ok,code)=>{if(!ok)deny(code);};
const plain=v=>v&&typeof v==='object'&&
 !Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype;
export function createD6Wp3CanonicalSourceTransport({
 upstream,enabled=()=>false,
}={}){
 need(typeof upstream==='function'&&typeof enabled==='function',
  'INVALID_CONFIG');
 async function request(url,opts){
  need(enabled()===true,'DISABLED');
  need(typeof url==='string'&&plain(opts)&&plain(opts.headers),
   'INVALID_REQUEST');
  let u;try{u=new URL(url);}catch{deny('URL_DENIED');}
  const repo=u.pathname==='/repos/'+REPO.name;
  const source=repo||u.pathname===MAIN||PATH.test(u.pathname);
  const tree=GIT_TREE.test(u.pathname);
  const sourceQuery=u.search===''||tree&&u.search==='?recursive=1';
  const read=opts.method==='GET'&&source&&sourceQuery&&
   opts.body===undefined&&opts.headers['Content-Type']===undefined;
  const graph=opts.method==='POST'&&url===GQL&&
   opts.headers['Content-Type']==='application/json'&&
   typeof opts.body==='string'&&opts.body.length<=16000&&
   opts.body.startsWith('{"query":"query WP2VerifiedMarkdown ')&&
   // Only the read-only query format from the vetted snapshot loader.
   !opts.body.includes('\\u0000');
  need(u.protocol==='https:'&&u.hostname==='api.github.com'&&
   u.origin==='https://api.github.com'&&
   !u.username&&!u.password&&!u.hash&&
   u.toString()===url&&(read||graph),'URL_DENIED');
  need(opts.redirect==='manual'&&
   (opts.cache===undefined||opts.cache==='no-store')&&
   (opts.credentials===undefined||opts.credentials==='omit')&&
   Object.keys(opts).every(k=>[
    'method','headers','body','redirect','cache','credentials'
   ].includes(k))&&
   Object.keys(opts.headers).every(k=>HEADER_KEYS.has(k))&&
   /^Bearer [^\s]{20,}$/.test(opts.headers.Authorization??'')&&
   opts.headers.Accept==='application/vnd.github+json'&&
   opts.headers['X-GitHub-Api-Version']==='2026-03-10'&&
   opts.headers['User-Agent']==='fishing-d6-canonical-read-only',
   'OPTIONS_DENIED');
  need(enabled()===true,'DISABLED');
  return upstream(url,{
   method:opts.method,headers:{...opts.headers},
   redirect:'manual',cache:'no-store',credentials:'omit',
   ...(graph?{body:opts.body}:{}),
  });
 }
 return Object.freeze({request});
}
