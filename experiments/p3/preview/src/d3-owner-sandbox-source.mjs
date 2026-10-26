/**
 * FISH118 D3: read-only owner-authorized private-sandbox authoring source.
 * Source-only and default OFF; never mounted on current public V2 site.
 * A signed-in owner can use one immutable sandbox GitHub snapshot as the
 * actual editor base (NOT public V2's unrelated release sourceRevision).
 *
 * Contains NO GitHub token, OAuth/CSRF token, signing material, media bytes
 * or capability to publish. No publicly cacheable private repo content.
 */
const ID=1430581407,OWNER=265665562;
const SHA=/^[a-f0-9]{40}$/;
const PATH='/api/v3/authoring-source';
const MAX_RESPONSE=1024*1024;
const encoder=new TextEncoder();
const baseHeaders={
  'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'private, no-store, max-age=0',
  'Vary':'Cookie',
  'X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'no-referrer',
  'X-Robots-Tag':'noindex, nofollow',
};
const result=(value,status=200)=>new Response(JSON.stringify(value),
  {status,headers:baseHeaders});
export class D3OwnerSourceError extends Error{
  constructor(code){
    super('Owner sandbox authoring source unavailable');
    this.name='D3OwnerSourceError';this.code=code;
  }
}
const deny=code=>{throw new D3OwnerSourceError(code);};
const need=(v,code)=>{if(!v)deny(code);};
const record=x=>x!==null&&typeof x==='object'&&
  Object.getPrototypeOf(x)===Object.prototype;
const safeRelative=path=>typeof path==='string'&&
  path.length>0&&path.length<=512&&
  !path.startsWith('/')&&!path.includes('\\')&&
  !path.includes('//')&&!path.includes('\0')&&
  !path.split('/').some(x=>x==='.'||x==='..');
const reject=(status,code)=>result({ok:false,error:code},status);

export function createD3OwnerSandboxSource({
  origin,ownerSession,loadSnapshot,enabled=()=>false,
}={}){
  need(typeof origin==='string'&&origin.startsWith('https://')&&
    new URL(origin).origin===origin&&
    typeof ownerSession?.authorizeStatus==='function'&&
    typeof loadSnapshot==='function'&&typeof enabled==='function',
    'INVALID_CONFIGURATION');
  async function serve(request){
    if(enabled()!==true)return reject(503,'TEMPORARILY_UNAVAILABLE');
    if(!(request instanceof Request)||request.method!=='GET')
      return reject(404,'NOT_FOUND');
    let url;
    try{url=new URL(request.url);}catch{return reject(404,'NOT_FOUND');}
    if(url.origin!==origin||url.pathname!==PATH||
      url.search!==''||url.hash!==''||request.headers.has('Authorization'))
      return reject(404,'NOT_FOUND');
    let identity;
    try{identity=await ownerSession.authorizeStatus(request);}
    catch{return reject(401,'OWNER_SESSION_REQUIRED');}
    if(identity?.authorized!==true||identity.ownerGitHubId!==OWNER)
      return reject(401,'OWNER_SESSION_REQUIRED');
    let snapshot;
    try{snapshot=await loadSnapshot({repositoryId:ID});}
    catch{return reject(503,'SOURCE_UNAVAILABLE');}
    if(snapshot?.repositoryId!==ID||
      !SHA.test(snapshot.sourceRevision??'')||
      !SHA.test(snapshot.treeSha??'')||
      !record(snapshot.data)||snapshot.files?.constructor!==Set||
      snapshot.markdown?.constructor!==Map)
      return reject(503,'INVALID_SOURCE');
    // Only explicitly projected canonical content and referenced narratives.
    // Do not stringify opaque GitHub API objects, token grants or metadata.
    const narratives=[];
    for(const [path,body] of snapshot.markdown){
      if(!safeRelative(path)||typeof body!=='string'||
        !snapshot.files.has(path)||!path.endsWith('.md'))
        return reject(503,'INVALID_SOURCE');
      narratives.push({path,body});
    }
    const files=[...snapshot.files];
    if(files.length>1800||files.some(f=>!safeRelative(f))||
      narratives.length>120)
      return reject(503,'INVALID_SOURCE');
    const payload={
      ok:true,repositoryId:ID,sourceRevision:snapshot.sourceRevision,
      treeSha:snapshot.treeSha,canonicalLive:false,sandboxOnly:true,
      data:{
        gear:snapshot.data.gear,
        kb:snapshot.data.kb,
        catches:snapshot.data.catches,
      },
      markdown:narratives,files,
    };
    let serialized;
    try{serialized=JSON.stringify(payload);}
    catch{return reject(503,'INVALID_SOURCE');}
    if(encoder.encode(serialized).length>MAX_RESPONSE)
      return reject(503,'SOURCE_TOO_LARGE');
    return new Response(serialized,{status:200,headers:baseHeaders});
  }
  return Object.freeze({serve});
}
