/**
 * Authenticated synthetic R2+D1 delivery benchmark, never public/canonical.
 * The ONLY paths are /__d3_benchmark__/current, /run, and /asset.
 * No GitHub/App writing, no installed PWA/public release mutation.
 */
import {createD3StorageBenchmark,D3StorageBenchmarkError}
 from './d3-r2-d1-storage-benchmark.mjs';
import {D2SessionError} from './d2-unified-owner-session.mjs';
const BASE='/__d3_benchmark__/';
const RUN=/^bench_[0-9a-f]{32}$/;
const reply=(value,status=200)=>new Response(JSON.stringify(value),{
 status,headers:{'Content-Type':'application/json; charset=utf-8',
 'Cache-Control':'private, no-store, max-age=0','Vary':'Cookie',
 'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'},
});
const error=(status,code)=>reply({ok:false,code},status);
const safe=err=>err instanceof D3StorageBenchmarkError?
 err.code:err instanceof D2SessionError?'OWNER_DENIED':'BENCHMARK_UNAVAILABLE';
export function createD3BenchmarkOwnerRoute({
 origin,ownerSession,R2,D1,enabled=()=>false,
}={}){
 if(typeof origin!=='string'||!origin.startsWith('https://')||
    ownerSession==null||typeof ownerSession.authorizeStatus!=='function'||
    typeof ownerSession.authorizeWrite!=='function'||
    typeof enabled!=='function')
  throw Error('Benchmark route configuration invalid');
 async function handle(request){
  let url;try{url=new URL(request.url);}catch{return error(404,'NOT_FOUND');}
  if(!url.pathname.startsWith(BASE)||url.origin!==origin||
     url.search||!['current','asset','run'].includes(
      url.pathname.slice(BASE.length)))return error(404,'NOT_FOUND');
  if(!enabled())return error(404,'NOT_FOUND');
  try{
   const storage=createD3StorageBenchmark({R2,D1,enabled});
   if(request.method==='GET'&&url.pathname===BASE+'current'){
    await ownerSession.authorizeStatus(request);
    const value=await storage.current();
    const {bytes,...metadata}=value;
    return reply({ok:true,...metadata,canonicalLive:false});
   }
   if(request.method==='GET'&&url.pathname===BASE+'asset'){
    await ownerSession.authorizeStatus(request);
    const value=await storage.current();
    if(value.state==='Empty')return error(404,'NOT_FOUND');
    return new Response(value.bytes,{status:200,headers:{
     'Content-Type':'application/octet-stream',
     'Cache-Control':'private, no-store, max-age=0',
     'Vary':'Cookie','X-Content-Type-Options':'nosniff',
     'X-D3-Benchmark-Version':value.version,
     'X-D3-Benchmark-SHA256':value.sha256,
     'X-D3-Test-Only':'true',
    }});
   }
   if(request.method==='POST'&&url.pathname===BASE+'run'){
    await ownerSession.authorizeWrite(request);
    const contentLength=request.headers.get('Content-Length');
    if(contentLength!==null&&(!/^\d+$/.test(contentLength)||
       Number(contentLength)>256))return error(413,'REQUEST_TOO_LARGE');
    const body=await request.text();
    if(new TextEncoder().encode(body).length>256)return error(413,'REQUEST_TOO_LARGE');
    let data;try{data=JSON.parse(body);}catch{return error(400,'INVALID_JSON');}
    if(!data||typeof data!=='object'||Array.isArray(data)||
       Object.keys(data).sort().join(',')!=='expectedVersion,runId,sizeBytes'||
       !RUN.test(data.runId??'')||
       (data.expectedVersion!==null&&!RUN.test(data.expectedVersion??''))||
       !Number.isSafeInteger(data.sizeBytes))
     return error(400,'INVALID_REQUEST');
    const result=await storage.stageAndActivate(data);
    return reply({ok:true,...result});
   }
   return error(405,'METHOD_NOT_ALLOWED');
  }catch(e){
   const code=safe(e);
   const status=code==='OWNER_DENIED'?404:
    ['INVALID_BENCHMARK_REQUEST'].includes(code)?400:
    ['BENCHMARK_POINTER_CHANGED','BENCHMARK_RUN_ALREADY_APPLIED',
     'D1_POINTER_CAS_FAILED','R2_IMMUTABLE_OBJECT_EXISTS'].includes(code)?409:503;
   return error(status,status===503?'BENCHMARK_UNAVAILABLE':code);
  }
 }
 return Object.freeze({handle});
}
