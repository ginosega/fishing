/**
 * FISH118 D3: browser-side validation of OWNER-ONLY private-sandbox
 * authoring source. Explicit opt-in; no public V2 bootstrap integration.
 * Never use the public V2 release SHA as the sandbox edit base.
 * This is a display/editor source, NOT publication authorization.
 */
import {validateRecords,collectPaths,checkPathCollisions}
  from '../../../../pwa/src/validation.mjs';
const ID=1430581407;
const SHA=/^[a-f0-9]{40}$/;
const enc=new TextEncoder();
const MAX_BODY=1024*1024;
const PATH='/api/v3/authoring-source';
export class D3SourceClientError extends Error{
  constructor(code){
    super('Trusted sandbox authoring source cannot be displayed');
    this.name='D3SourceClientError';this.code=code;
  }
}
const fail=code=>{throw new D3SourceClientError(code);};
const need=(v,code)=>{if(!v)fail(code);};
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const safeRelative=path=>typeof path==='string'&&
  path.length>0&&path.length<=512&&!path.startsWith('/')&&
  !path.includes('\\')&&!path.includes('//')&&
  !path.includes('\0')&&!path.split('/').some(x=>x==='.'||x==='..');
const validOrigin=value=>{
 try{const u=new URL(value);return u.protocol==='https:'&&
  u.origin===value&&!u.username&&!u.password&&
  u.pathname==='/'&&!u.search&&!u.hash;}
 catch{return false;}
};
export function createD3SandboxSourceClient({
  origin,request,enabled=()=>false,online=()=>true,
}={}){
  need(validOrigin(origin)&&typeof request==='function'&&
    typeof enabled==='function'&&typeof online==='function',
    'INVALID_CONFIGURATION');
  async function load(){
    need(enabled()===true,'NOT_ENABLED');
    need(online()===true,'OFFLINE_DENIED');
    let response;
    try{
      response=await request(origin+PATH,{
        method:'GET',credentials:'same-origin',
        redirect:'manual',cache:'no-store',
        headers:{'Accept':'application/json'},
      });
    }catch{fail('SOURCE_UNAVAILABLE');}
    if(response?.status===401||response?.status===403)
      fail('OWNER_SESSION_REQUIRED');
    need(response instanceof Response&&response.status===200&&
      !response.redirected&&
      (response.headers.get('Content-Type')??'').toLowerCase()
        .includes('application/json'),'SOURCE_UNAVAILABLE');
    let body;
    try{const text=await response.text();
      need(enc.encode(text).length<=MAX_BODY,'SOURCE_TOO_LARGE');
      body=JSON.parse(text);
    }catch(e){if(e instanceof D3SourceClientError)throw e;
      fail('INVALID_RESPONSE');}
    need(obj(body)&&body.ok===true&&
      body.repositoryId===ID&&SHA.test(body.sourceRevision??'')&&
      SHA.test(body.treeSha??'')&&
      body.canonicalLive===false&&body.sandboxOnly===true&&
      obj(body.data)&&Array.isArray(body.files)&&
      Array.isArray(body.markdown),'UNTRUSTED_SOURCE');
    let referenced;
    try{
      validateRecords(body.data);
      referenced=[...collectPaths(body.data)];
      checkPathCollisions(referenced);
    }catch{fail('INVALID_RECORDS');}
    need(body.files.length<=1800&&body.markdown.length<=120,
      'UNTRUSTED_SOURCE');
    const files=new Set(),lowercase=new Set();
    for(const path of body.files){
      need(safeRelative(path)&&!files.has(path)&&
        !lowercase.has(path.normalize('NFC').toLowerCase()),
        'UNTRUSTED_SOURCE');
      files.add(path);lowercase.add(path.normalize('NFC').toLowerCase());
    }
    const markdown=new Map();
    for(const entry of body.markdown){
      need(obj(entry)&&safeRelative(entry.path)&&
        entry.path.endsWith('.md')&&
        files.has(entry.path)&&typeof entry.body==='string'&&
        enc.encode(entry.body).length<=131072&&
        !markdown.has(entry.path),'UNTRUSTED_SOURCE');
      markdown.set(entry.path,entry.body);
    }
    for(const file of referenced){
      need(files.has(file),'MISSING_CANONICAL_FILE');
      if(file.endsWith('.md'))
        need(markdown.has(file),'MISSING_CANONICAL_MARKDOWN');
    }
    // All content is in-memory and must be revalidated independently by the
    // privileged backend on Save and Publish; this does not enable writes.
    return Object.freeze({
      repositoryId:ID,sourceRevision:body.sourceRevision,
      treeSha:body.treeSha,data:body.data,files,markdown,
      canonicalLive:false,sandboxOnly:true,
    });
  }
  return Object.freeze({load});
}
