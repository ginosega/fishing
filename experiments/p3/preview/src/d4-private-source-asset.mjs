/**
 * D4: owner-authenticated display of exact image bytes referenced by the
 * CURRENT immutable private sandbox source. Never proxies arbitrary GitHub
 * files, grants anonymous access, or mutates public /fishing/.
 */
import {safePath} from '../../../../pwa/src/shared.mjs';
import {collectPaths} from '../../../../pwa/src/validation.mjs';
import {decodeD4OriginalGitBlob} from './d4-git-blob-stage.mjs';

const ID=1430581407,OWNER=265665562;
const API='https://api.github.com/repos/ginosega/fishing-p3-sandbox';
const PREFIX='/api/v3/assets/';
const REV=/^[a-f0-9]{40}$/;
const ALLOWED=/^(Gear|KB)\/.+\/assets\/.+\.(jpe?g|png|webp|gif)$/i;
const fail=()=>new Response('Not found',{status:404,headers:{
 'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff',
 'Referrer-Policy':'no-referrer','Vary':'Cookie',
}});
export function createD4PrivateSourceAsset({
 origin,ownerSession,loadSnapshot,issueReadToken,
 requestGitHub,enabled=()=>false,
}={}){
 if(!origin||typeof ownerSession?.authorizeStatus!=='function'||
  [loadSnapshot,issueReadToken,requestGitHub,enabled]
   .some(f=>typeof f!=='function'))throw Error('INVALID_D4_ASSET_CONFIGURATION');
 async function read(token,path){
  if(!path.startsWith(API+'/'))throw Error('BAD_GITHUB_URL');
  const response=await requestGitHub(path,{
   method:'GET',redirect:'manual',headers:{
    Authorization:'Bearer '+token,
    Accept:'application/vnd.github+json',
    'X-GitHub-Api-Version':'2026-03-10',
    'User-Agent':'fishing-d4-owner-only-source-image',
   },
  });
  if(response?.status!==200||!response.ok||response.redirected)
   throw Error('UNAVAILABLE');
  return response.json();
 }
 async function serve(request){
  if(!enabled()||request?.method!=='GET')return fail();
  try{
   const u=new URL(request.url);
   if(u.origin!==origin||u.protocol!=='https:'||
    !u.pathname.startsWith(PREFIX)||u.hash||
    [...u.searchParams.keys()].join(',')!=='revision'||
    !REV.test(u.searchParams.get('revision')??'')||
    request.headers.has('Authorization'))return fail();
   const encoded=u.pathname.slice(PREFIX.length);
   const parts=encoded.split('/');
   if(!parts.length||parts.some(p=>!p))return fail();
   const path=parts.map(decodeURIComponent).join('/');
   if(parts.map(encodeURIComponent).join('/')!==encoded)return fail();
   const relative=safePath(path);
   if(relative!==path||!ALLOWED.test(path))return fail();
   const session=await ownerSession.authorizeStatus(request);
   if(session?.authorized!==true||session.ownerGitHubId!==OWNER)
    return fail();
   // Recompute canonical source references from privately verified main.
   // Do not trust the image pathname or client-supplied revision alone.
   const snapshot=await loadSnapshot({repositoryId:ID});
   if(snapshot?.repositoryId!==ID||
    snapshot.sourceRevision!==u.searchParams.get('revision')||
    !snapshot.files?.has(path)||
    !collectPaths(snapshot.data).has(path))return fail();
   const grant=await issueReadToken({repositoryId:ID,
    permissions:{contents:'read'}});
   if(grant?.repositoryId!==ID||
    grant.permissions?.contents!=='read'||
    Object.keys(grant.permissions).length!==1||
    typeof grant.token!=='string'||grant.token.length<12)return fail();
   const token=grant.token;
   const tree=await read(token,API+'/git/trees/'+snapshot.treeSha+'?recursive=1');
   if(tree?.sha!==snapshot.treeSha||tree.truncated!==false||
    !Array.isArray(tree.tree)||tree.tree.length>1800)return fail();
   const matches=tree.tree.filter(f=>f.path==='pwa/'+path);
   if(matches.length!==1)return fail();
   const entry=matches[0];
   if(entry.sha!==snapshot.blobHashes?.get('pwa/'+path))
    return fail();
   const blob=await read(token,API+'/git/blobs/'+entry.sha);
   const original=await decodeD4OriginalGitBlob(entry,blob);
   const last=await read(token,API+'/git/ref/heads/main');
   if(last?.object?.sha!==snapshot.sourceRevision)return fail();
   return new Response(original.bytes,{status:200,headers:{
    'Content-Type':original.mime,
    'Cache-Control':'private, no-store','Vary':'Cookie',
    'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',
    'X-Fish-D4-Source-Sha':snapshot.sourceRevision,
    'X-Fish-D4-Original-Sha256':original.sha256,
   }});
  }catch{return fail();}
 }
 return Object.freeze({serve});
}
