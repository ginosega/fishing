/** G1-D independent HTTPS byte comparison. Read-only, no cookies/secrets.
 * Run from Node.js 20+: node tools/compare-hosted-bytes.mjs
 */
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
export const PAGES='https://ginosega.github.io/fishing/';
export const GATEWAY='https://fishing-auth-p0-test.ginosega.workers.dev/fishing/';
const hash=b=>createHash('sha256').update(b).digest('hex');
function check(x,msg){if(!x)throw Error(msg);}
function assetUrl(root,path){
 check(typeof path==='string'&&path&&!path.startsWith('/')&&!path.includes('\\')
   &&!path.split('/').some(s=>s==='.'||s==='..')&&!/[?#\0]/.test(path),'Unsafe asset path: '+path);
 return root+path.split('/').map(encodeURIComponent).join('/');
}
export async function getLive(url){
 const start=performance.now();
 const res=await fetch(url,{redirect:'error',cache:'no-store',signal:AbortSignal.timeout(30000)});
 check(res.status===200&&!res.redirected,'HTTP '+res.status+' / unexpected redirect: '+url);
 return {bytes:Buffer.from(await res.arrayBuffer()),elapsedMs:Math.round(performance.now()-start)};
}
export function samplePaths(files,id){
 const paths=[
  'index.html','loader.js','sw.js','manifest.webmanifest',
  'releases/'+id+'/app.js','releases/'+id+'/styles.css',
  'releases/'+id+'/content/Gear/gear.json',
  'releases/'+id+'/content/KB/kb.json',
  'releases/'+id+'/content/Catches/catches.json'];
 const available=new Set(files.map(f=>f.path));
 for(const path of paths)check(available.has(path),'Missing mandatory asset: '+path);
 const pick=(prefix,regex)=>files.find(f=>f.path.startsWith('releases/'+id+'/'+prefix)&&regex.test(f.path))?.path;
 const extra=[
  pick('content/Gear/',/\.(png|jpe?g|webp)$/i),
  pick('content/KB/',/\.(png|jpe?g|webp)$/i),
  pick('card-thumbnails/',/\.(webp|png)$/i),
  pick('content/KB/',/\.md$/i)].filter(Boolean);
 check(extra.length>=3,'Insufficient media/Markdown sample assets');
 return [...new Set([...paths,...extra])];
}
export async function verifyHosted({get=getLive,pages=PAGES,gateway=GATEWAY,paths=null}={}){
 const pair=async path=>{
  const [a,b]=await Promise.all([get(assetUrl(pages,path)),get(assetUrl(gateway,path))]);
  check(Buffer.isBuffer(a.bytes)&&Buffer.isBuffer(b.bytes),'Invalid fetch result');
  check(a.bytes.equals(b.bytes),'PAGES/GATEWAY BYTE MISMATCH: '+path);
  return {bytes:a.bytes,pagesMs:a.elapsedMs,gatewayMs:b.elapsedMs};
 };
 const p=await pair('release.json');
 const pointer=JSON.parse(p.bytes.toString('utf8'));
 check(/^[a-f0-9]{32}$/.test(pointer.id),'Invalid release ID');
 check(pointer.manifest==='releases/'+pointer.id+'/manifest.json','Invalid manifest reference');
 check(/^[a-f0-9]{64}$/.test(pointer.manifestSha256),'Invalid manifest digest');
 check(typeof pointer.sourceRevision==='string'&&pointer.sourceRevision,'Invalid source revision');
 const m=await pair(pointer.manifest);
 check(hash(m.bytes)===pointer.manifestSha256,'Manifest SHA-256 mismatch');
 const manifest=JSON.parse(m.bytes.toString('utf8'));
 check(manifest.releaseId===pointer.id&&manifest.sourceRevision===pointer.sourceRevision,'Release identity mismatch');
 check(manifest.base==='/fishing/','Scope mismatch');
 check(Array.isArray(manifest.files)&&manifest.files.length>0,'Empty release manifest');
 const entries=new Map();let sum=0;
 for(const f of manifest.files){
  check(typeof f.path==='string'&&!entries.has(f.path),'Invalid/duplicate asset path');
  check(Number.isSafeInteger(f.bytes)&&f.bytes>=0,'Invalid file size');
  check(/^[a-f0-9]{64}$/.test(f.sha256),'Invalid digest');
  entries.set(f.path,f);sum+=f.bytes;
 }
 check(sum===manifest.totalBytes,'Manifest totalBytes mismatch');
 const list=paths??samplePaths(manifest.files,pointer.id);
 check(list.length>0,'No assets selected');
 const checked=[];
 for(const path of list){
  const f=entries.get(path);check(f,'Asset not in manifest: '+path);
  const actual=await pair(path);
  check(actual.bytes.length===f.bytes,'Manifest BYTE SIZE mismatch: '+path);
  check(hash(actual.bytes)===f.sha256,'Manifest SHA-256 mismatch: '+path);
  checked.push({path,bytes:f.bytes,sha256:f.sha256,pagesMs:actual.pagesMs,gatewayMs:actual.gatewayMs});
 }
 const after=await pair('release.json');
 check(after.bytes.equals(p.bytes),'Release changed during comparison; retry after publication');
 return {status:'PASS',sourceRevision:pointer.sourceRevision,releaseId:pointer.id,
  pointerSha256:hash(p.bytes),manifestSha256:pointer.manifestSha256,
  manifestFiles:manifest.files.length,manifestTotalBytes:manifest.totalBytes,
  checkedAssets:checked,checkedAssetCount:checked.length};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 verifyHosted().then(r=>console.log(JSON.stringify(r,null,2)))
  .catch(e=>{console.error('G1-D NOT VERIFIED: '+e.message);process.exitCode=1;});
}
