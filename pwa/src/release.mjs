import {safePath,assert,sha256} from './shared.mjs';

const ID=/^[a-f0-9]{32}$/;
const HASH=/^[a-f0-9]{64}$/;
const MAX_FILES=10000;
const MAX_BYTES=1024*1024*1024;
export const isReleaseId=value=>typeof value==='string'&&ID.test(value);
export const isDigest=value=>typeof value==='string'&&HASH.test(value);
export function manifestPath(id){assert(isReleaseId(id),'Invalid release ID');return `releases/${id}/manifest.json`;}
export function releasePath(value){
 assert(typeof value==='string','Invalid release path');
 return safePath(value);
}
export function validatePointer(pointer){
 assert(pointer&&typeof pointer==='object'&&!Array.isArray(pointer),'Invalid release pointer');
 assert(isReleaseId(pointer.id),'Invalid release ID');
 assert(pointer.manifest===manifestPath(pointer.id),'Invalid manifest path');
 assert(isDigest(pointer.manifestSha256),'Invalid manifest digest');
 assert(pointer.schemaVersions?.gear===2&&pointer.schemaVersions?.kb===2&&pointer.schemaVersions?.catches===2,'Incompatible schema versions');
 assert(typeof pointer.sourceRevision==='string'&&pointer.sourceRevision.length>0,'Missing source revision');
 return pointer;
}
export function validateManifest(manifest,pointer,base){
 validatePointer(pointer);
 assert(manifest&&typeof manifest==='object'&&manifest.format==='fishing-companion-release-v2','Invalid release manifest');
 assert(manifest.releaseId===pointer.id&&manifest.sourceRevision===pointer.sourceRevision,'Release identity mismatch');
 assert(manifest.base===base,'Release scope mismatch');
 assert(manifest.schemaVersions?.gear===2&&manifest.schemaVersions?.kb===2&&manifest.schemaVersions?.catches===2,'Incompatible release');
 assert(Array.isArray(manifest.files)&&manifest.files.length>0&&manifest.files.length<=MAX_FILES,'Invalid release file count');
 const entries=new Map();let total=0;
 for(const file of manifest.files){
  releasePath(file.path);
  assert(!entries.has(file.path),'Duplicate release asset');
  assert(Number.isSafeInteger(file.bytes)&&file.bytes>=0&&isDigest(file.sha256),'Invalid release asset metadata');
  total+=file.bytes;assert(Number.isSafeInteger(total)&&total<=MAX_BYTES,'Release exceeds storage budget');
  assert(file.path!==pointer.manifest&&file.path!=='release.json'&&!file.path.endsWith('/__fishing_complete__'),'Invalid manifest self-reference');
  entries.set(file.path,file);
 }
 assert(manifest.totalBytes===total,'Release byte count mismatch');
 const required=['index.html','loader.js','sw.js','manifest.webmanifest',`releases/${pointer.id}/app.js`,`releases/${pointer.id}/styles.css`,`releases/${pointer.id}/content/Gear/gear.json`,`releases/${pointer.id}/content/KB/kb.json`,`releases/${pointer.id}/content/Catches/catches.json`];
 assert(entries.has('revised-icon.png')||entries.has('icon.svg'),'Missing required release icon');
 for(const file of required)assert(entries.has(file),`Missing required release asset: ${file}`);
 return entries;
}
export async function verifyBytes(bytes,entry){
 assert(bytes.byteLength===entry.bytes,'Asset byte count mismatch');
 assert(await sha256(bytes)===entry.sha256,'Asset integrity mismatch');
 return bytes;
}
export async function decodeVerifiedJson(bytes,expectedHash){
 assert(await sha256(bytes)===expectedHash,'JSON integrity mismatch');
 return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}
