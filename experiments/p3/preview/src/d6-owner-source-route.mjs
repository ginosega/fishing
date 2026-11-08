/**
 * D6 source-only owner-authorized READ route, default OFF.
 * No GitHub credentials, editor write authority or deployment entrypoint.
 * Caller must inject the trusted hosted-revision reader and GitHub snapshot
 * loader; browser-provided revision, repo identity and tokens are ignored.
 */
import {D6_SOURCE_REPOSITORY} from './d6-canonical-snapshot-loader.mjs';
import {D6_TRUSTED_PAGES_BASE} from './d6-hosted-revision-reader.mjs';

export const D6_SOURCE_ORIGIN='https://fishing.ginosega.workers.dev';
export const D6_SOURCE_PATH='/api/v3/authoring-source';
const OWNER=265665562;
const SHA=/^[a-f0-9]{40}$/;
const RELEASE=/^[a-f0-9]{32}$/;
const MAX_BODY=2*1024*1024;
const encoder=new TextEncoder();
const headers=Object.freeze({
 'Content-Type':'application/json; charset=utf-8',
 'Cache-Control':'private, no-store, max-age=0',
 'Vary':'Cookie',
 'X-Content-Type-Options':'nosniff',
 'Referrer-Policy':'no-referrer',
 'X-Robots-Tag':'noindex, nofollow',
});
const response=(body,status)=>new Response(JSON.stringify(body),{status,headers});
const reject=(status,error)=>response({ok:false,error},status);
const sameProof=(a,b)=>a?.sourceRevision===b?.sourceRevision&&
 a?.releaseId===b?.releaseId&&a?.manifestSha256===b?.manifestSha256;
const goodPath=v=>typeof v==='string'&&v.length>0&&v.length<=512&&
 /^(?:Gear|KB|Catches)\//.test(v)&&
 !v.startsWith('/')&&!v.includes('\\')&&!v.includes('//')&&
 !v.includes('\0')&&!/%(?:2e|2f|5c|00)/i.test(v)&&
 !v.split('/').some(x=>x==='.'||x==='..');

export function createD6OwnerSourceRoute({
 ownerSession,readHostedRevision,loadSnapshot,
 enabled=()=>false,
}={}){
 if(typeof ownerSession?.authorizeStatus!=='function'||
   typeof readHostedRevision!=='function'||
   typeof loadSnapshot!=='function'||typeof enabled!=='function')
  throw Error('D6 read route requires trusted server dependencies');
 async function serve(request){
  if(enabled()!==true)return reject(503,'TEMPORARILY_UNAVAILABLE');
  if(!(request instanceof Request)||request.method!=='GET'||
     request.headers.has('Authorization'))return reject(404,'NOT_FOUND');
  let url;
  try{url=new URL(request.url);}catch{return reject(404,'NOT_FOUND');}
  if(url.origin!==D6_SOURCE_ORIGIN||url.pathname!==D6_SOURCE_PATH||
    url.search||url.hash||url.username||url.password)
   return reject(404,'NOT_FOUND');
  let identity;
  try{identity=await ownerSession.authorizeStatus(request);}
  catch{return reject(401,'OWNER_SESSION_REQUIRED');}
  if(identity?.authorized!==true||identity.ownerGitHubId!==OWNER)
   return reject(401,'OWNER_SESSION_REQUIRED');

  // Server fetches hosted release identity. Never take source SHA from a
  // query, request header, client cookie, body or auth session fields.
  let hosted,source,finalHosted;
  try{
   hosted=await readHostedRevision();
   if(!SHA.test(hosted?.sourceRevision??'')||
      !RELEASE.test(hosted?.releaseId??'')||
      !/^[a-f0-9]{64}$/.test(hosted?.manifestSha256??''))
    return reject(503,'HOSTED_RELEASE_UNVERIFIED');
   source=await loadSnapshot({
    expectedReleaseRevision:hosted.sourceRevision,
   });
   finalHosted=await readHostedRevision();
  }catch{return reject(503,'SOURCE_UNAVAILABLE');}
  if(!sameProof(hosted,finalHosted))
   return reject(503,'HOSTED_RELEASE_CHANGED');
  if(source?.repositoryId!==D6_SOURCE_REPOSITORY.id||
    source?.repositoryFullName!==D6_SOURCE_REPOSITORY.fullName||
    source?.ref!==D6_SOURCE_REPOSITORY.ref||
    source?.sourceRevision!==hosted.sourceRevision||
    !SHA.test(source?.treeSha??'')||
    source?.sourceOnly!==true||source?.canPublish!==false||
    source?.files?.constructor!==Set||source?.markdown?.constructor!==Map||
    !source?.data||typeof source.data!=='object'||Array.isArray(source.data))
   return reject(503,'INVALID_SOURCE');

  const files=[...source.files];
  const md=[...source.markdown];
  if(files.length>1800||md.length>240||files.some(x=>!goodPath(x)))
   return reject(503,'INVALID_SOURCE');
  if(md.some(([path,body])=>!goodPath(path)||!path.endsWith('.md')||
    !source.files.has(path)||typeof body!=='string'||
    encoder.encode(body).byteLength>131072))
   return reject(503,'INVALID_SOURCE');
  // Only three canonical domains enter response; no object spread, no
  // credentials, owner cookie, GitHub grant, token, receipt or media tickets.
  const body={
   ok:true,repositoryId:D6_SOURCE_REPOSITORY.id,
   repositoryFullName:D6_SOURCE_REPOSITORY.fullName,
   ref:D6_SOURCE_REPOSITORY.ref,
   sourceRevision:source.sourceRevision,treeSha:source.treeSha,
   sandboxOnly:false,
   data:{gear:source.data.gear,kb:source.data.kb,catches:source.data.catches},
   files,markdown:md.map(([path,body])=>({path,body})),
  };
  let json;
  try{json=JSON.stringify(body);}catch{return reject(503,'INVALID_SOURCE');}
  if(encoder.encode(json).byteLength>MAX_BODY)
   return reject(503,'SOURCE_TOO_LARGE');
  return new Response(json,{status:200,headers});
 }
 return Object.freeze({serve});
}
