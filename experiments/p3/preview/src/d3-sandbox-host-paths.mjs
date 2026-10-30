/**
 * FISH118 D3: exact test-only sandbox hosted resource paths.
 * The route is NOT part of public /fishing/ and cannot request unrelated
 * repository files. Filenames (including spaces) use canonical per-segment
 * percent encoding; aliases, traversal and extra URL parameters are denied.
 */
import {safePath} from '../../../../pwa/src/shared.mjs';
const OP=/^p3_[a-f0-9-]{36}$/;
const ROOT='/__d3_test__/operations/';
const JSON_FILES=new Set(['pwa/Gear/gear.json','pwa/KB/kb.json','pwa/Catches/catches.json']);
export class D3HostPathError extends Error{
 constructor(code){
  super('D3 isolated hosted resource path refused');
  this.name='D3HostPathError';this.code=code;
 }
}
const deny=code=>{throw new D3HostPathError(code);};
const need=(ok,code)=>{if(!ok)deny(code);};
export function expectedD3HostedPaths(pkg,media=[]){
 need(pkg?.format==='fishing-companion-change-v2'&&
  ['gear','kb','catches'].includes(pkg.domain)&&
  ['edit','add'].includes(pkg.operation)&&
  ['keep','add','replace','remove'].includes(pkg.picture?.action)&&
  ['keep','set','remove'].includes(pkg.pictureSequence?.action??'keep')&&
  ['keep','create','replace'].includes(pkg.notes?.action),
  'INVALID_PACKAGE');
 const base=pkg.domain==='gear'?'pwa/Gear/gear.json':
  pkg.domain==='kb'?'pwa/KB/kb.json':'pwa/Catches/catches.json';
 const result=[base];
 if(pkg.notes.action!=='keep'){
  let path;
  try{path=safePath(pkg.notes.path);}catch{deny('UNSAFE_MARKDOWN');}
  const prefix=pkg.domain==='gear'?'Gear/':
   pkg.domain==='kb'?'KB/':'Catches/content/';
  need(path.startsWith(prefix)&&path.includes('/content/')&&
   path.endsWith('.md')&&
   (pkg.domain==='catches'?path.split('/').length===3:
    path.split('/').length>=4),
   'UNSAFE_MARKDOWN');
  result.push('pwa/'+path);
 }
 need(Array.isArray(media)&&media.length<=24,'INVALID_MEDIA_PATHS');
 for(const m of media){
  let file;try{file=safePath(m.path);}catch{deny('INVALID_MEDIA_PATHS');}
  need(pkg.domain!=='catches'&&
   file.startsWith(pkg.domain==='gear'?'Gear/':'KB/')&&
   file.includes('/assets/')&&/\.(jpe?g|png|webp|gif)$/i.test(file)&&
   /^[a-f0-9]{40}$/.test(m.blobSha??'')&&
   /^[a-f0-9]{64}$/.test(m.sha256??''),
   'INVALID_MEDIA_PATHS');
  result.push('pwa/'+file);
 }
 need(result.length<=26&&new Set(result).size===result.length,
  'DUPLICATE_HOSTED_PATH');
 return Object.freeze(result);
}
export function d3HostedTestPath(operationId,file){
 need(OP.test(operationId),'INVALID_OPERATION');
 need(typeof file==='string'&&file.startsWith('pwa/')&&
  (JSON_FILES.has(file)||isMarkdown(file)||isMedia(file)),'INVALID_FILE');
 const parts=file.split('/');
 need(parts.every(p=>p!==''&&p!=='.'&&p!=='..'),'INVALID_FILE');
 return ROOT+operationId+'/'+parts.map(encodeURIComponent).join('/');
}
function isMedia(file){
 try{
  const path=safePath(file.slice(4));
  return file==='pwa/'+path&&
   (path.startsWith('Gear/')||path.startsWith('KB/'))&&
   path.includes('/assets/')&&/\.(jpe?g|png|webp|gif)$/i.test(path);
 }catch{return false;}
}
function isMarkdown(file){
 try{
  const path=safePath(file.slice(4));
  return file==='pwa/'+path&&
   (path.startsWith('Gear/')||path.startsWith('KB/')||
    path.startsWith('Catches/content/'))&&
   path.includes('/content/')&&path.endsWith('.md')&&
   (!path.startsWith('Catches/')||path.split('/').length===3);
 }catch{return false;}
}
export function parseD3HostedTestPath(pathname){
 if(typeof pathname!=='string'||!pathname.startsWith(ROOT))
  return null;
 const suffix=pathname.slice(ROOT.length);
 const n=suffix.indexOf('/');
 if(n<0)return null;
 const operationId=suffix.slice(0,n);
 if(!OP.test(operationId))return null;
 const encoded=suffix.slice(n+1);
 let file;
 try{
  file=encoded.split('/').map(decodeURIComponent).join('/');
  if(d3HostedTestPath(operationId,file)!==pathname)return null;
 }catch{return null;}
 return Object.freeze({operationId,file});
}
