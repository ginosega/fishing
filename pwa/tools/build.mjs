#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import * as esbuild from 'esbuild';
import sharp from 'sharp';
import {isL01SourceImporter,assertL01StandaloneModuleBoundary}
 from './l01-module-boundary.mjs';
import {digest} from './library.mjs';
import {generateStaticPageArtwork} from './static-page-artwork.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../..');
const args=process.argv.slice(2),option=(key,fallback)=>args.find(x=>x.startsWith(key+'='))?.slice(key.length+1)||fallback;
// One supported software release: standalone V3. These existing manifest
// markers remain fixed for the accepted app and service-worker protocol.
const base='/fishing/',pendingMedia=false,d6StaticStaging=false;
const d6ReaderCandidate=true,d6OwnerConnectionCandidate=true,
 d6OwnerEditorPreview=true,d6DirectGearSave=true,d6DirectKBSave=true,
 d6DirectCatchSave=true,d6OwnerMediaUpload=true,d6R2CardThumbnails=true,
 d6OfflineContentPreparation=true,d6OfflineContentReading=true,
 d6StandaloneV3=true,d6Wp2Staging=true;
for(const arg of args)if(!/^--(?:out|source-revision)=.+$/.test(arg))
 throw Error('Unsupported build option: '+arg+'; V3 is the only build');
const output=path.resolve(option('--out',path.join(repo,'pwa/dist-v3-pilot')));
const sourceRevision=option('--source-revision',(()=>{try{return execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim();}catch{return 'uncommitted-source';}})());
const pageAssetsRoot=path.join(repo,'pwa/assets');
const write=async(file,bytes)=>{await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,bytes);};
const stableJson=value=>JSON.stringify(value,null,2)+'\n';
const hashFiles=async root=>{const result=[];async function scan(dir){for(const entry of await fs.readdir(dir,{withFileTypes:true})){const abs=path.join(dir,entry.name);if(entry.isDirectory())await scan(abs);else if(entry.isFile()){const relative=path.relative(root,abs).split(path.sep).join('/'),bytes=await fs.readFile(abs);result.push({path:relative,bytes:bytes.length,sha256:digest(bytes)});}}}await scan(root);return result.sort((a,b)=>a.path.localeCompare(b.path,'en'));};
export async function build(){
 const icon=await fs.readFile(path.join(repo,'pwa/icon.png'));const iconMeta=await sharp(icon).metadata();
 if(iconMeta.format!=='png'||iconMeta.width!==iconMeta.height)throw new Error('Application icon must be a square PNG');
 await sharp(icon).raw().toBuffer();
 const maskableArtSize=Math.round(iconMeta.width*0.88);
 const maskableArt=await sharp(icon).trim({background:{r:0,g:0,b:0,alpha:0}}).resize(maskableArtSize,maskableArtSize,{fit:'contain'}).png().toBuffer();
 const maskableIcon=await sharp({create:{width:iconMeta.width,height:iconMeta.height,channels:3,background:'#11665c'}}).composite([{input:maskableArt,gravity:'centre'}]).removeAlpha().png().toBuffer();
 // Keep the staging tree on the output filesystem; /tmp→workspace rename
 // fails EXDEV in container CI. A random sibling retains atomic promotion.
 await fs.mkdir(path.dirname(output),{recursive:true});
 const tmp=await fs.mkdtemp(path.join(path.dirname(output),'.fishing-v3-'));
 try{
  const artwork=await generateStaticPageArtwork({assets:pageAssetsRoot,destination:path.join(tmp,'static-page-artwork')});
  const app=await esbuild.build({entryPoints:[path.join(repo,'pwa/src/entry.mjs')],bundle:true,format:'iife',platform:'browser',target:'es2022',minify:true,write:false,legalComments:'none',
   metafile:d6StandaloneV3,
   plugins:d6StandaloneV3?[{
    name:'l01-remove-v2-editor',
    setup(builder){
     builder.onResolve({filter:/^\.\/browser-routes\.mjs$/},args=>{
      if(!isL01SourceImporter(args.importer))return null;
      return {path:path.join(repo,'pwa/src/v3-routes.mjs')};
     });
     builder.onResolve({filter:/^\.\/(?:editor|handoff|change-prompt|d6-canonical-authoring-source)\.mjs$/},args=>{
      if(!isL01SourceImporter(args.importer))return null;
      const replacements={
       './editor.mjs':'d6-legacy-editor-denial.mjs',
       './handoff.mjs':'d6-v3-content-paths.mjs',
       './change-prompt.mjs':'d6-legacy-change-prompt-denial.mjs',
       './d6-canonical-authoring-source.mjs':'d6-legacy-source-denial.mjs',
      };
      return {path:path.join(repo,'pwa/src',replacements[args.path])};
     });
    },
   }]:[],define:{'process.env.NODE_ENV':'"production"',
    '__FISHING_D6_PUBLIC_READER__':d6ReaderCandidate?'true':'false',
     '__FISHING_D6_STATIC_STAGING__':d6StaticStaging?'true':'false',
    '__FISHING_D6_OWNER_CONNECTION__':d6OwnerConnectionCandidate?'true':'false',
    '__FISHING_D6_WP2_STAGING__':d6Wp2Staging?'true':'false',
    '__FISHING_D6_OWNER_EDITOR_PREVIEW__':d6OwnerEditorPreview?'true':'false',
    '__FISHING_D6_DIRECT_GEAR_SAVE__':d6DirectGearSave?'true':'false',
     '__FISHING_D6_DIRECT_KB_SAVE__':d6DirectKBSave?'true':'false',
     '__FISHING_D6_DIRECT_CATCH_SAVE__':d6DirectCatchSave?'true':'false',
     '__FISHING_D6_OWNER_MEDIA_UPLOAD__':d6OwnerMediaUpload?'true':'false',
     '__FISHING_D6_R2_CARD_THUMBNAILS__':d6R2CardThumbnails?'true':'false',
      '__FISHING_D6_O02_OFFLINE_CONTENT__':d6OfflineContentPreparation?'true':'false',
      '__FISHING_D6_O03_OFFLINE_READING__':d6OfflineContentReading?'true':'false',
      '__FISHING_D6_STANDALONE_V3__':d6StandaloneV3?'true':'false'}});
  if(d6StandaloneV3){
    assertL01StandaloneModuleBoundary(app.metafile?.inputs);
    if(Object.keys(app.metafile?.inputs||{}).some(name=>name.replaceAll('\\','/').endsWith('/browser-routes.mjs')))
     throw Error('Standalone V3 contains legacy browser routes');
   }
  const baseCss=await fs.readFile(path.join(repo,'pwa/src/styles.css')),cardIconCss=await fs.readFile(path.join(repo,'pwa/src/card-icons.css')).then(bytes=>d6StandaloneV3?Buffer.from(bytes.toString('utf8').replace(/data-art="(gear-accessories|kb-location|kb-technique|kb-knot|kb-equipment)"/g,(_,key)=>'data-art="'+({"gear-accessories":"gear-equipment","kb-location":"kb-locations","kb-technique":"kb-techniques","kb-knot":"kb-knots","kb-equipment":"kb-gear-guides"})[key]+'"')):bytes),pageHeroCss=await fs.readFile(path.join(repo,'pwa/src/page-hero.css')),css=Buffer.concat([baseCss,Buffer.from('\n'),cardIconCss,Buffer.from('\n'),pageHeroCss]);
  const staticImageHashes=await hashFiles(path.join(tmp,'static-page-artwork')),originalStaticImageHashes=await hashFiles(pageAssetsRoot);const lock=await fs.readFile(path.join(repo,'pwa/package-lock.json'));
  const codeHashes=[];for(const dir of ['src','tools'])for(const file of await hashFiles(path.join(repo,'pwa',dir)))codeHashes.push({...file,path:dir+'/'+file.path});
  const releaseId=digest(Buffer.from(stableJson({sourceRevision,base,pendingMedia,d6ReaderCandidate,d6StaticStaging,d6Wp2Staging,d6StandaloneV3,
 ...(d6OwnerConnectionCandidate?{d6OwnerConnectionCandidate:true}:{}),
 ...(d6OwnerEditorPreview?{d6OwnerEditorPreview:true}:{}),
 ...(d6DirectGearSave?{d6DirectGearSave:true}:{}),
  ...(d6DirectKBSave?{d6DirectKBSave:true}:{}),
  ...(d6DirectCatchSave?{d6DirectCatchSave:true}:{}),
  ...(d6OwnerMediaUpload?{d6OwnerMediaUpload:true}:{}),
  ...(d6R2CardThumbnails?{d6R2CardThumbnails:true}:{}),
   ...(d6OfflineContentPreparation?{d6OfflineContentPreparation:true}:{}),
    ...(d6OfflineContentReading?{d6OfflineContentReading:true}:{}),
    ...(d6Wp2Staging?{d6Wp2Staging:true}:{}),cardThumbnails:null,staticArt:staticImageHashes,sourceStaticArt:originalStaticImageHashes,icon:digest(icon),maskableIcon:digest(maskableIcon),app:digest(app.outputFiles[0].contents),css:digest(css),lock:digest(lock),code:codeHashes}))).slice(0,32);
  const releaseRoot=path.join(tmp,'releases',releaseId);await fs.mkdir(releaseRoot,{recursive:true});await fs.rename(path.join(tmp,'static-page-artwork','card-icons'),path.join(releaseRoot,'card-icons'));await fs.rename(path.join(tmp,'static-page-artwork','page-hero'),path.join(releaseRoot,'page-hero'));
  await write(path.join(releaseRoot,'app.js'),app.outputFiles[0].contents);await write(path.join(releaseRoot,'styles.css'),css);
  const release={id:releaseId,sourceRevision,schemaVersions:{gear:2,kb:2,catches:2},pendingMedia,manifest:`releases/${releaseId}/manifest.json`,
    ...(d6StandaloneV3?{standaloneV3:true}:{}),
    ...(d6ReaderCandidate?{d6ReaderCandidate:true}:{}),
    ...(d6StaticStaging?{d6StaticStaging:true}:{}),
    ...(d6OwnerConnectionCandidate?{d6OwnerConnectionCandidate:true}:{}),
    ...(d6OwnerEditorPreview?{d6OwnerEditorPreview:true}:{}),
    ...(d6DirectGearSave?{d6DirectGearSave:true}:{}),
  ...(d6DirectKBSave?{d6DirectKBSave:true}:{}),
  ...(d6DirectCatchSave?{d6DirectCatchSave:true}:{}),
  ...(d6OwnerMediaUpload?{d6OwnerMediaUpload:true}:{}),
  ...(d6R2CardThumbnails?{d6R2CardThumbnails:true}:{}),
   ...(d6OfflineContentPreparation?{d6OfflineContentPreparation:true}:{}),
    ...(d6OfflineContentReading?{d6OfflineContentReading:true}:{}),
    ...(d6Wp2Staging?{d6Wp2Staging:true}:{})};
  const loader=await fs.readFile(path.join(repo,'pwa/src',
   'loader-v3.js'));
  const previewBanner='';
  const index=`<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#11665c"><meta name="description" content="Fishing reference and catch log"><link rel="manifest" href="./manifest.webmanifest"><link rel="icon" href="./icon.png" type="image/png"><link rel="apple-touch-icon" href="./icon.png"><style>${baseCss.toString()}</style><title>Fishing Companion</title><script defer src="./loader.js"></script></head><body>${previewBanner}<header class="site-header"><div class="header-inner"><a class="brand" data-nav href="#/">Fishing <span>Companion</span></a><button id="connection-status" class="connection-status" type="button" title="Connection status" aria-label="Connection status"><span class="connection-dot" aria-hidden="true"></span></button></div></header><main id="app" class="site-main" tabindex="-1"><p>Loading Fishing Companion…</p></main><aside id="app-notice" class="site-main" aria-live="polite" style="min-height:0;padding-top:0;padding-bottom:0"></aside><dialog id="connection-dialog" class="small-dialog" aria-labelledby="connection-title"><h2 id="connection-title">Connection status</h2><p id="connection-network"></p><div class="offline-panel"><span id="offline-status" class="offline-state" role="status">Offline library not prepared</span><div class="toolbar"><button id="offline-update" class="btn secondary" type="button" disabled>Update offline library</button><button id="offline-reload" class="btn secondary" type="button" disabled>Reload</button></div></div><button id="connection-close" class="btn secondary dialog-close" type="button">Close</button></dialog>${base==='/fishing/v2-preview/'?'<footer class="site-footer"><div class="footer-inner"><span id="release-details"></span></div></footer>':''}</body></html>\n`;
  await write(path.join(tmp,'index.html'),index);await write(path.join(tmp,'loader.js'),loader);
  await write(path.join(tmp,'manifest.webmanifest'),stableJson({name:'Fishing Companion',short_name:'Fishing',description:'Fishing reference and catch log',start_url:'./',scope:'./',display:'standalone',background_color:'#101b18',theme_color:'#11665c',icons:[{src:'./icon.png',sizes:`${iconMeta.width}x${iconMeta.height}`,type:'image/png',purpose:'any'},{src:'./icon-maskable.png',sizes:`${iconMeta.width}x${iconMeta.height}`,type:'image/png',purpose:'maskable'}]}));
  await write(path.join(tmp,'icon.png'),icon);await write(path.join(tmp,'icon-maskable.png'),maskableIcon);
  const sw=await esbuild.build({entryPoints:[path.join(repo,'pwa/src/sw.mjs')],bundle:true,format:'iife',platform:'browser',target:'es2022',minify:true,write:false,
    define:{'__FISHING_V3_READING_MODE__':d6ReaderCandidate?'true':'false',
      '__FISHING_D6_O03_OFFLINE_READING__':d6OfflineContentReading?'true':'false',
      '__FISHING_D6_STANDALONE_V3__':d6StandaloneV3?'true':'false'}});
  await write(path.join(tmp,'sw.js'),sw.outputFiles[0].contents);
  const files=(await hashFiles(tmp)).filter(x=>x.path!==release.manifest&&x.path!=='release.json');
  const manifest={format:'fishing-companion-software-v3',releaseId,sourceRevision,schemaVersions:release.schemaVersions,pendingMedia,base,
    ...(d6StandaloneV3?{standaloneV3:true}:{}),
    ...(d6ReaderCandidate?{d6ReaderCandidate:true}:{}),
    ...(d6StaticStaging?{d6StaticStaging:true}:{}),
    ...(d6OwnerConnectionCandidate?{d6OwnerConnectionCandidate:true}:{}),
    ...(d6OwnerEditorPreview?{d6OwnerEditorPreview:true}:{}),
    ...(d6DirectGearSave?{d6DirectGearSave:true}:{}),
  ...(d6DirectKBSave?{d6DirectKBSave:true}:{}),
  ...(d6DirectCatchSave?{d6DirectCatchSave:true}:{}),
  ...(d6OwnerMediaUpload?{d6OwnerMediaUpload:true}:{}),
  ...(d6R2CardThumbnails?{d6R2CardThumbnails:true}:{}),
   ...(d6OfflineContentPreparation?{d6OfflineContentPreparation:true}:{}),
    ...(d6OfflineContentReading?{d6OfflineContentReading:true}:{}),
    ...(d6Wp2Staging?{d6Wp2Staging:true}:{}),files,cardThumbnails:null,totalBytes:files.reduce((sum,x)=>sum+x.bytes,0),
  };
  const manifestBytes=stableJson(manifest);
  await write(path.join(tmp,release.manifest),manifestBytes);
  release.manifestSha256=digest(Buffer.from(manifestBytes));
  await write(path.join(tmp,'release.json'),stableJson(release));
  for(const file of files){const bytes=await fs.readFile(path.join(tmp,file.path));if(bytes.length!==file.bytes||digest(bytes)!==file.sha256)throw new Error('Final artifact mismatch: '+file.path);}
  await fs.rm(output,{recursive:true,force:true});await fs.mkdir(path.dirname(output),{recursive:true});await fs.rename(tmp,output);
  console.log(stableJson({releaseId,sourceRevision,files:files.length,bytes:manifest.totalBytes,cardThumbnails:null,staticPageArtwork:{files:artwork.files,sourceBytes:artwork.sourceBytes,generatedBytes:artwork.generatedBytes},counts:manifest.counts??null,pendingMedia:0,standaloneV3:d6StandaloneV3,output}));
  return {releaseId,output,manifest};
 }catch(error){await fs.rm(tmp,{recursive:true,force:true});throw error;}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))build().catch(error=>{console.error(error);process.exitCode=1;});
