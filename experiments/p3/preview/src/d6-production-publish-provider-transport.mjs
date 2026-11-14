/**
 * FISH-TODO-118 WP3 — pinned GitHub provider transport for existing coordinators.
 *
 * SOURCE ONLY / DEFAULT OFF / UNWIRED. This narrowly validates the single
 * GitHub origin, repository, operation-owned branch, request method and
 * server-held token shape before passing an existing step's request through
 * an injected trusted-server transport. It does not authenticate users,
 * construct write intents, fence D1, issue tokens or retry mutations: the
 * already-tested caller coordinators remain responsible for those gates.
 *
 * Never use as a browser/Worker route or as an independent publishing API.
 */
import {D6_PUBLISH_REPOSITORY as REPO}
 from './d6-production-publish-intake.mjs';

const ROOT='https://api.github.com/repos/'+REPO.name;
const UUID='[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}';
const SHA='[a-f0-9]{40}';
const PUBLISH=new RegExp('^fish-v3/publish/'+UUID+'$');
const REF=new RegExp('^refs/heads/fish-v3/publish/'+UUID+'$');
const BRANCH_READ=new RegExp('^/git/ref/heads/fish-v3/publish/'+UUID+'$');
const BRANCH_PATCH=new RegExp('^/git/refs/heads/fish-v3/publish/'+UUID+'$');
const GIT_COMMIT=new RegExp('^/git/commits/'+SHA+'$');
const GIT_TREE=new RegExp('^/git/trees/'+SHA+'$');
const GIT_BLOB=new RegExp('^/git/blobs/'+SHA+'$');
const PR_DETAIL=/^\/pulls\/[1-9][0-9]{0,9}$/;
const PR_LIST=new RegExp('^\\?state=all&head=ginosega%3[Aa]fish-v3%2[Ff]publish%2[Ff]'+UUID+'&base=main&per_page=2$');
const HEX40=new RegExp('^'+SHA+'$');
const BODY_LIMIT=20*1024*1024;
const own=o=>o!==null&&typeof o==='object'&&
 !Array.isArray(o)&&Object.getPrototypeOf(o)===Object.prototype;

export class D6PublishProviderTransportError extends Error{
 constructor(code){
  super('WP3 trusted GitHub provider transport denied');
  this.name='D6PublishProviderTransportError';this.code=code;
 }
}
const deny=code=>{throw new D6PublishProviderTransportError(code);};
const need=(ok,code)=>{if(!ok)deny(code);};
function describe(url,method){
 let u;
 try{u=new URL(url);}catch{deny('URL_DENIED');}
 need(u.origin==='https://api.github.com'&&
  u.username===''&&u.password===''&&u.hash===''&&
  url.startsWith(ROOT)&&
  u.pathname.startsWith('/repos/'+REPO.name),
  'URL_DENIED');
 const relative=u.pathname.slice(('/repos/'+REPO.name).length);
 need(method==='GET'||method==='POST'||method==='PATCH',
  'METHOD_DENIED');
 if(method==='GET'){
  const valid=relative===''||relative==='/git/ref/heads/main'||
   BRANCH_READ.test(relative)||GIT_COMMIT.test(relative)||
   GIT_TREE.test(relative)||GIT_BLOB.test(relative)||
   PR_DETAIL.test(relative)||relative==='/pulls'&&PR_LIST.test(u.search);
  need(valid,'URL_DENIED');
  need((relative==='/pulls')===Boolean(u.search),
   'URL_DENIED');
 }else{
  const valid=method==='POST'&&
   ['/git/blobs','/git/trees','/git/commits','/git/refs','/pulls']
    .includes(relative)||
   method==='PATCH'&&BRANCH_PATCH.test(relative);
  need(valid&&!u.search,'URL_DENIED');
 }
 need(u.toString()===url,'URL_DENIED');
 return relative;
}
function body(urlPath,method,raw){
 if(method==='GET'){need(raw===undefined,'BODY_DENIED');return;}
 need(typeof raw==='string'&&raw.length>1&&raw.length<=BODY_LIMIT,
  'BODY_DENIED');
 let data;
 try{data=JSON.parse(raw);}catch{deny('BODY_DENIED');}
 need(own(data),'BODY_DENIED');
 const keys=Object.keys(data).sort().join(',');
 if(urlPath==='/git/blobs'){
  need(keys==='content,encoding'&&data.encoding==='base64'&&
   typeof data.content==='string'&&data.content.length>0&&
   data.content.length<=BODY_LIMIT&&
   /^[A-Za-z0-9+/]+={0,2}$/.test(data.content),'BODY_DENIED');
 }else if(urlPath==='/git/trees'){
  need(keys==='base_tree,tree'&&HEX40.test(data.base_tree??'')&&
   Array.isArray(data.tree)&&data.tree.length>0&&
   data.tree.length<=400,'BODY_DENIED');
 }else if(urlPath==='/git/refs'){
  need(keys==='ref,sha'&&REF.test(data.ref??'')&&
   HEX40.test(data.sha??''),'BODY_DENIED');
 }else if(urlPath==='/git/commits'){
  need(keys==='message,parents,tree'&&
   /^Fishing Companion V3 content update [0-9a-f-]{36}$/.test(
    data.message??'')&&
   HEX40.test(data.tree??'')&&Array.isArray(data.parents)&&
   data.parents.length===1&&HEX40.test(data.parents[0]??''),
   'BODY_DENIED');
 }else if(method==='PATCH'){
  need(keys==='force,sha'&&data.force===false&&
   HEX40.test(data.sha??''),'BODY_DENIED');
 }else if(urlPath==='/pulls'){
  need(keys==='base,body,draft,head,title'&&data.base==='main'&&
   data.draft===false&&PUBLISH.test(data.head??'')&&
   /^Fishing Companion V3: (gear|kb|catches) [0-9a-f-]{36}$/.test(
    data.title??'')&&typeof data.body==='string'&&
   data.body.length>0&&data.body.length<=8192,'BODY_DENIED');
 }else deny('BODY_DENIED');
}

export function createD6ProductionPublishProviderTransport({
 upstream,enabled=()=>false,
}={}){
 need(typeof upstream==='function'&&typeof enabled==='function',
  'INVALID_CONFIG');
 async function request(url,options){
  need(enabled()===true,'DISABLED');
  need(own(options)&&typeof options.method==='string',
   'INVALID_REQUEST');
  const path=describe(url,options.method);
  const headers=options.headers;
  need(own(headers)&&Object.keys(headers).every(h=>[
   'Authorization','Accept','X-GitHub-Api-Version',
   'Content-Type','User-Agent'].includes(h))&&
   typeof headers.Authorization==='string'&&
   /^Bearer [^\s]{20,}$/.test(headers.Authorization)&&
   headers.Accept==='application/vnd.github+json'&&
   headers['X-GitHub-Api-Version']==='2026-03-10'&&
   /^fishing-[A-Za-z0-9-]{1,100}$/.test(headers['User-Agent']??'')&&
   (options.method==='GET'?
    headers['Content-Type']===undefined:
    headers['Content-Type']==='application/json')&&
   options.redirect==='manual'&&options.cache==='no-store'&&
   options.credentials==='omit'&&Object.keys(options).every(k=>[
    'method','redirect','cache','credentials','headers','body'
   ].includes(k)),
   'OPTIONS_DENIED');
  body(path,options.method,options.body);
  need(enabled()===true,'DISABLED');
  // No retries, redirects, token refreshes, state changes, or claims here.
  // The caller must apply step-specific response/readback verification.
  return upstream(url,{method:options.method,redirect:'manual',
   cache:'no-store',credentials:'omit',
   headers:{...headers},
   ...(options.method==='GET'?{}:{body:options.body})});
 }
 return Object.freeze({request});
}
