#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import * as esbuild from 'esbuild';
import {inventorySource,digest} from './library.mjs';
import {encodedPath,DOMAIN} from '../src/shared.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../..');
const args=process.argv.slice(2),option=(key,fallback)=>args.find(x=>x.startsWith(key+'='))?.slice(key.length+1)||fallback;
const base=option('--base','/fishing/v2-preview/');
if(!base.startsWith('/')||!base.endsWith('/')||base.includes('..')||base.includes('//'))throw new Error('Build base must be a canonical absolute directory path');
const pendingMedia=args.includes('--pending-media');
if(pendingMedia&&base!=='/fishing/v2-preview/')throw new Error('Pending media may only be built for the isolated preview');
const source=path.resolve(option('--source',repo)),output=path.resolve(option('--out',path.join(repo,'pwa/dist')));
const sourceRevision=option('--source-revision',(()=>{try{return execFileSync('git',['rev-parse','HEAD'],{cwd:source,encoding:'utf8'}).trim();}catch{return 'uncommitted-source';}})());
const write=async(file,bytes)=>{await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,bytes);};
const stableJson=value=>JSON.stringify(value,null,2)+'\n';
const hashFiles=async root=>{const result=[];async function scan(dir){for(const entry of await fs.readdir(dir,{withFileTypes:true})){const abs=path.join(dir,entry.name);if(entry.isDirectory())await scan(abs);else if(entry.isFile()){const relative=path.relative(root,abs).split(path.sep).join('/'),bytes=await fs.readFile(abs);result.push({path:relative,bytes:bytes.length,sha256:digest(bytes)});}}}await scan(root);return result.sort((a,b)=>a.path.localeCompare(b.path,'en'));};
export async function build(){
 const library=await inventorySource(source,{pendingMedia}),tmp=await fs.mkdtemp(path.join(os.tmpdir(),'fishing-v2-'));
 try{
  const content=path.join(tmp,'content');
  for(const file of library.files){const src=path.join(source,file.path),dest=path.join(content,file.path);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.copyFile(src,dest);const copied=await fs.readFile(dest);if(copied.length!==file.bytes||digest(copied)!==file.sha256)throw new Error('Source changed while copying: '+file.path);}
  for(const config of Object.values(DOMAIN)){const src=path.join(source,config.file),dest=path.join(content,config.file);await write(dest,await fs.readFile(src));}
  const app=await esbuild.build({entryPoints:[path.join(repo,'pwa/src/entry.mjs')],bundle:true,format:'iife',platform:'browser',target:'es2022',minify:true,write:false,legalComments:'none',define:{'process.env.NODE_ENV':'"production"'}});
  const css=await fs.readFile(path.join(repo,'pwa/src/styles.css'));
  const inputHashes=await hashFiles(content);const lock=await fs.readFile(path.join(repo,'pwa/package-lock.json'));
  const codeHashes=[];for(const dir of ['src','tools'])for(const file of await hashFiles(path.join(repo,'pwa',dir)))codeHashes.push({...file,path:dir+'/'+file.path});
  const releaseId=digest(Buffer.from(stableJson({sourceRevision,base,pendingMedia,files:inputHashes,app:digest(app.outputFiles[0].contents),css:digest(css),lock:digest(lock),code:codeHashes}))).slice(0,32);
  const releaseRoot=path.join(tmp,'releases',releaseId);await fs.mkdir(releaseRoot,{recursive:true});await fs.rename(content,path.join(releaseRoot,'content'));
  await write(path.join(releaseRoot,'app.js'),app.outputFiles[0].contents);await write(path.join(releaseRoot,'styles.css'),css);
  const release={id:releaseId,sourceRevision,schemaVersions:{gear:2,kb:2,catches:2},pendingMedia,manifest:`releases/${releaseId}/manifest.json`};
  const loader=await fs.readFile(path.join(repo,'pwa/src/loader.js'));
  const index=`<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#11665c"><meta name="description" content="Fishing reference and catch log"><link rel="manifest" href="./manifest.webmanifest"><link rel="icon" href="./icon.svg" type="image/svg+xml"><style>${css.toString()}</style><title>Fishing Companion</title><script defer src="./loader.js"></script></head><body><div class="preview-banner"${pendingMedia?'':' hidden'}>V2 preview · Pending media · Production remains unchanged</div><header class="site-header"><div class="header-inner"><a class="brand" data-nav href="#/">Fishing <span>Companion</span></a><button id="connection-status" class="connection-status" type="button" title="Connection status" aria-label="Connection status"><span class="connection-dot" aria-hidden="true"></span></button></div></header><main id="app" class="site-main" tabindex="-1"><p>Loading Fishing Companion…</p></main><aside id="app-notice" class="site-main" aria-live="polite" style="min-height:0;padding-top:0;padding-bottom:0"></aside><dialog id="connection-dialog" class="small-dialog" aria-labelledby="connection-title"><h2 id="connection-title">Connection status</h2><p id="connection-network"></p><div class="offline-panel"><span id="offline-status" class="offline-state" role="status">Offline incomplete</span><div class="toolbar"><button id="offline-update" class="btn secondary" type="button" disabled>Update offline library</button><button id="offline-reload" class="btn secondary" type="button" disabled>Reload</button></div></div><button id="connection-close" class="btn secondary dialog-close" type="button">Close</button></dialog>${base==='/fishing/v2-preview/'?'<footer class="site-footer"><div class="footer-inner"><span id="release-details"></span></div></footer>':''}</body></html>\n`;
  await write(path.join(tmp,'index.html'),index);await write(path.join(tmp,'loader.js'),loader);
  await write(path.join(tmp,'manifest.webmanifest'),stableJson({name:'Fishing Companion',short_name:'Fishing',description:'Fishing reference and catch log',start_url:'./',scope:'./',display:'standalone',background_color:'#101b18',theme_color:'#11665c',icons:[{src:'./icon.svg',sizes:'any',type:'image/svg+xml',purpose:'any maskable'}]}));
  await write(path.join(tmp,'icon.svg'),await fs.readFile(path.join(repo,'pwa/icon.svg')));
  const sw=await esbuild.build({entryPoints:[path.join(repo,'pwa/src/sw.mjs')],bundle:true,format:'iife',platform:'browser',target:'es2022',minify:true,write:false,define:{__RELEASE_ID__:JSON.stringify(releaseId)}});
  await write(path.join(tmp,'sw.js'),sw.outputFiles[0].contents);
  const files=(await hashFiles(tmp)).filter(x=>x.path!==release.manifest&&x.path!=='release.json');
  const manifest={format:'fishing-companion-release-v2',releaseId,sourceRevision,schemaVersions:release.schemaVersions,pendingMedia,base,files,totalBytes:files.reduce((sum,x)=>sum+x.bytes,0),counts:{gear:library.data.gear.items.length,kb:library.data.kb.entities.length,catches:library.data.catches.catches.length},unresolvedMedia:library.pending};
  const manifestBytes=stableJson(manifest);
  await write(path.join(tmp,release.manifest),manifestBytes);
  release.manifestSha256=digest(Buffer.from(manifestBytes));
  await write(path.join(tmp,'release.json'),stableJson(release));
  for(const file of files){const bytes=await fs.readFile(path.join(tmp,file.path));if(bytes.length!==file.bytes||digest(bytes)!==file.sha256)throw new Error('Final artifact mismatch: '+file.path);}
  await fs.rm(output,{recursive:true,force:true});await fs.mkdir(path.dirname(output),{recursive:true});await fs.rename(tmp,output);
  console.log(stableJson({releaseId,sourceRevision,files:files.length,bytes:manifest.totalBytes,counts:manifest.counts,pendingMedia:library.pending.length,output}));
  return {releaseId,output,manifest};
 }catch(error){await fs.rm(tmp,{recursive:true,force:true});throw error;}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))build().catch(error=>{console.error(error);process.exitCode=1;});
