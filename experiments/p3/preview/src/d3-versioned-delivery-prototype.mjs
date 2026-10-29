/**
 * FISH118 / V3-SAVE-09: OFFLINE SOURCE-ONLY proof-of-concept for a versioned
 * public-content delivery lane. DOES NOT deploy, publish, authorize, or
 * return a public/canonical Live receipt. All adapters are injected.
 *
 * The canonical loader MUST independently verify the actual GitHub main,
 * protected PR/check/merge lineage, and returned blob SHAs. This module
 * additionally checks the canonical file content against those blob SHAs.
 * CAS MUST be an atomic primary/strongly consistent operation, not a KV write.
 *
 * A successful commit-addressed staging/activation simulation is NOT a
 * real provider benchmark or a substitute for independent public host proof.
 */
const ID=1430581407, REPO='ginosega/fishing';
const SHA=/^[0-9a-f]{40}$/;
const SIZE_LIMIT=512*1024, FILE_LIMIT=20;
const enc=new TextEncoder();
const validPath=p=>typeof p==='string'&&
  /^pwa\/(?:Gear|KB|Catches)\/[A-Za-z0-9_.\/-]+$/.test(p)&&
  !p.split('/').includes('..')&&!p.split('/').includes('.')&&
  (p.endsWith('.json')||p.endsWith('.md'))&&p.length<=240;
const isBytes=x=>x instanceof Uint8Array;
export class D3VersionedDeliveryError extends Error{
 constructor(code){super('D3 isolated versioned delivery denied');this.name='D3VersionedDeliveryError';this.code=code;}
}
const deny=code=>{throw new D3VersionedDeliveryError(code)};
const need=(v,code)=>{if(!v)deny(code)};
async function digest(algorithm,bytes){
 const hash=await crypto.subtle.digest(algorithm,bytes);
 return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function gitBlobHash(bytes){
 const header=enc.encode('blob '+bytes.length+'\0');
 const body=new Uint8Array(header.length+bytes.length);
 body.set(header);body.set(bytes,header.length);
 return digest('SHA-1',body);
}
const same=(a,b)=>isBytes(a)&&isBytes(b)&&
 a.length===b.length&&a.every((v,i)=>v===b[i]);
const objectKey=(commit,path)=>'v3-content/'+commit+'/'+path;
export function createD3VersionedDeliveryPrototype({
 loadCanonical,putImmutable,getImmutable,compareAndSwapActive,
 readActive,publicGet,enabled=()=>false,
}={}){
 need([loadCanonical,putImmutable,getImmutable,compareAndSwapActive,
  readActive,publicGet,enabled].every(x=>typeof x==='function'),
  'INVALID_CONFIGURATION');
 async function activate({operationId,expectedPrevious=null}={}){
  need(enabled()===true,'DISABLED');
  need(/^p3_[0-9a-f-]{36}$/.test(operationId??'')&&
    (expectedPrevious===null||SHA.test(expectedPrevious)),
    'INVALID_REQUEST');
  // Trusted adapter verifies GitHub source identity; never use an owner
  // browser's claimed main, merge SHA, PR or checked head.
  const source=await loadCanonical({operationId,repository:REPO});
  need(source?.repository===REPO&&
    source.repositoryId!==ID&&
    SHA.test(source.commitSha??'')&&
    source.commitSha===source.mergeSha&&
    SHA.test(source.prHeadSha??'')&&
    source.exactHeadCheckVerified===true&&
    source.protectedMergeVerified===true&&
    source.mainMatchesMerge===true&&
    Array.isArray(source.files)&&source.files.length>=1&&
    source.files.length<=FILE_LIMIT,'CANONICAL_SOURCE_UNVERIFIED');
  const paths=new Set(),entries=[];
  let total=0;
  for(const f of source.files){
   need(validPath(f?.path)&&!paths.has(f.path)&&
     SHA.test(f.gitBlobSha??'')&&isBytes(f.bytes),
     'INVALID_CANONICAL_FILE');
   paths.add(f.path);
   total+=f.bytes.byteLength;
   need(total<=SIZE_LIMIT,'SOURCE_TOO_LARGE');
   const bytes=new Uint8Array(f.bytes);
   need(await gitBlobHash(bytes)===f.gitBlobSha,
     'GITHUB_BLOB_MISMATCH');
   entries.push({path:f.path,bytes,gitBlobSha:f.gitBlobSha,
     sha256:await digest('SHA-256',bytes)});
  }
  entries.sort((a,b)=>a.path.localeCompare(b.path,'en'));
  // The immutable generation key contains the canonical commit SHA. A
  // writer MUST use create-if-absent semantics; never overwrite it.
  for(const e of entries){
   const key=objectKey(source.commitSha,e.path);
   const stored=await putImmutable({key,bytes:e.bytes,sha256:e.sha256});
   need(stored?.immutable===true,'STAGING_NOT_IMMUTABLE');
   const read=await getImmutable(key);
   need(same(read,e.bytes)&&await digest('SHA-256',read)===e.sha256,
     'STAGED_BYTES_MISMATCH');
  }
  const manifest=enc.encode(JSON.stringify({
   version:1,repository:REPO,commitSha:source.commitSha,
   files:entries.map(({path,gitBlobSha,sha256,bytes})=>({
    path,gitBlobSha,sha256,size:bytes.length,
   })),
  }));
  const manifestKey=objectKey(source.commitSha,'release-manifest.json');
  const manifestSha256=await digest('SHA-256',manifest);
  const staged=await putImmutable({key:manifestKey,bytes:manifest,
    sha256:manifestSha256});
  need(staged?.immutable===true&&
    same(await getImmutable(manifestKey),manifest),
    'MANIFEST_NOT_IMMUTABLE');
  // Fail closed when GitHub main advanced during staging. Abandon staged
  // objects (safe, unreachable); NEVER promote a stale canonical commit.
  const newest=await loadCanonical({operationId,repository:REPO});
  need(newest?.commitSha===source.commitSha&&
    newest.mainMatchesMerge===true,'MAIN_MOVED');
  const current=await readActive();
  need(current===expectedPrevious,'PREVIOUS_VERSION_MOVED');
  // A rejected/unknown CAS result must NEVER be blindly repeated. A
  // strong single-writer primary CAS is required from the storage adapter.
  let moved;
  try{moved=await compareAndSwapActive({
    expectedVersion:expectedPrevious,nextVersion:source.commitSha,
    manifestSha256,operationId,
  });}catch{deny('ACTIVATION_OUTCOME_UNKNOWN');}
  need(moved?.activated===true,'ACTIVATION_UNCONFIRMED');
  need(await readActive()===source.commitSha,'ACTIVE_POINTER_UNCONFIRMED');
  // Independent anonymous/public HTTP GETs, not a direct storage read.
  // No auto-rollback of an ambiguous activation or a later writer's release.
  const publicFiles=[{path:'release-manifest.json',
    bytes:manifest,sha256:manifestSha256},...entries];
  for(const item of publicFiles){
   let response;
   try{response=await publicGet({
    version:source.commitSha,path:item.path,
   });}catch{deny('PUBLIC_PROOF_UNAVAILABLE');}
   need(response?.status===200&&response.anonymous===true&&
     response.version===source.commitSha&&
     same(response.bytes,item.bytes)&&
     await digest('SHA-256',response.bytes)===item.sha256,
     'PUBLIC_BYTES_UNVERIFIED');
  }
  need(await readActive()===source.commitSha,'SUPERSEDED_BEFORE_PROOF');
  // Prototype passes do not confer real-world publication status.
  return Object.freeze({prototypeVerified:true,canonicalLive:false,
   realPublicLive:false,release:source.commitSha,fileCount:entries.length,
   manifestSha256,requiresLiveProviderBenchmark:true});
 }
 return Object.freeze({activate});
}
