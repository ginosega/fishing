// Apply a validated browser handoff to repository source files. No network or
// image-byte transport. Run on a clean feature branch, then review and commit.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateKbBundle, validateCatchBundle } from './kb-model.js';
import { validateKbChangePackage, validateKbMarkdown, safeKbPath, authoredTargets } from './kb-authoring-model.js';
import { stableJson } from './authoring-common.js';
import { materializeKbEntity, kbPictureSource } from './kb-picture-model.js';
import { readValidatedImage } from './image-validation.mjs';

const defaultRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const readJson = async filename => JSON.parse(await fs.readFile(filename,'utf8'));
const json = value => JSON.stringify(value,null,2) + '\n';

export async function planKbPromotion(pkg, options = {}) {
  const root = path.resolve(options.root || defaultRoot);
  const pwa = path.join(root,'pwa');
  const safeFile = async relative => {
    if (typeof relative !== 'string' || !relative.startsWith('pwa/') || !safeKbPath(`./${relative.slice(4)}`)) throw new Error(`Unsafe repository path: ${relative}`);
    const absolute = path.resolve(root,relative);
    if (!absolute.startsWith(pwa + path.sep)) throw new Error(`Path escapes pwa/: ${relative}`);
    // A symlink must not redirect a write or image read outside the project.
    let cursor = root;
    for (const part of relative.split('/')) {
      cursor = path.join(cursor,part);
      try { if ((await fs.lstat(cursor)).isSymbolicLink()) throw new Error(`Symlink is not allowed: ${relative}`); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
    return absolute;
  };
  const bundle=await readJson(path.join(pwa,'data/kb.seed.json'));
  const gear=await readJson(path.join(pwa,'data/gear.seed.json'));
  const catches=await readJson(path.join(pwa,'data/catches.seed.json'));
  const local=await readJson(path.join(pwa,'local-media.json'));
  const sourceOriginal=bundle.entities.find(row=>row.id===pkg?.kbId)||null;
  const previous=kbPictureSource(pkg?.kbId,local);
  const contentPath=pkg?.content?.path;
  if (contentPath !== `pwa/${pkg?.entity?.content?.slice(2)}`) throw new Error('Content path does not match the entity.');
  const target=await safeFile(contentPath);
  let originalMarkdown=null;
  try { originalMarkdown=await fs.readFile(target,'utf8'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (pkg.operation==='edit' && originalMarkdown===null) throw new Error('The original Markdown document is missing.');
  if (pkg.operation==='add' && originalMarkdown!==null) throw new Error('The proposed Markdown file already exists.');
  let availableMedia=options.availableMedia;
  if (!availableMedia) {
    try {
      const builtGear=await readJson(path.join(pwa,'dist/data/gear.seed.json'));
      if (stableJson(builtGear)!==stableJson(gear)) throw new Error('The local build does not match current Gear source.');
      availableMedia=await readJson(path.join(pwa,'dist/gear-media.json'));
    } catch(error) {
      if (pkg.picture?.action==='reuse' || previous?.gearMediaId) throw new Error(`Build the current PWA before promoting a Gear-picture reuse: ${error.message}`);
      availableMedia=[];
    }
  }
  const original=sourceOriginal ? materializeKbEntity(sourceOriginal,local,availableMedia,gear) : null;
  const displayBundle={...bundle,entities:bundle.entities.map(row=>row.id===pkg?.kbId && original ? original : row)};
  const result=validateKbChangePackage(pkg,displayBundle,gear,catches,originalMarkdown,availableMedia,{sourceBundle:bundle,localMedia:local});
  if (!result.valid) throw new Error(result.errors.join('\n'));
  const next=structuredClone(bundle);
  if (pkg.operation==='edit') next.entities=next.entities.map(row=>row.id===pkg.kbId?structuredClone(pkg.sourceEntity):row);
  else next.entities.push(structuredClone(pkg.sourceEntity));
  next.dataVersion=options.dataVersion || `${bundle.dataVersion}-change-${new Date().toISOString().replace(/[-:.TZ]/g,'').slice(0,14)}`;
  const validation=validateKbBundle(next);
  if (!validation.valid) throw new Error(validation.errors.join('\n'));
  const catchValidation=validateCatchBundle(catches,next,gear);
  if (!catchValidation.valid) throw new Error(catchValidation.errors.join('\n'));

  const picture=pkg.picture;
  const entryIndex=local.kb.findIndex(row=>row.entityId===pkg.kbId);
  if (picture.action==='add'||picture.action==='replace') {
    const upload=await safeFile(picture.uploadPath);
    if (picture.uploadPath!==`pwa/${picture.desired.src.slice(2)}` || !picture.desired.src.startsWith('./assets/kb/')) throw new Error('Picture upload path does not match the approved KB asset.');
    const bytes=await readValidatedImage(upload);
    await assertExclusiveKbImageSource(picture.desired.src,pkg.kbId,bundle,catches,local,pwa,safeFile);
    if (!bytes.length) throw new Error('Empty image.');
  }
  if (picture.action==='reuse') {
    const selected=availableMedia.find(row=>row.id===picture.gearMediaId);
    if (!selected?.owners?.some(owner=>owner.gearItemId===picture.desired.gearItemId)) throw new Error('The selected Gear picture has no exact owner association.');
  }
  const metadata = desired => ({alt:desired.alt,caption:desired.caption ?? null,credit:desired.credit ?? null,sourceUrl:desired.sourceUrl ?? null,
    ...(desired.gearItemId ? {gearItemId:desired.gearItemId} : {})});
  let replacement=null;
  if (picture.action==='add'||picture.action==='replace') replacement={entityId:pkg.kbId,source:picture.desired.src,...metadata(picture.desired)};
  else if (picture.action==='reuse') replacement={entityId:pkg.kbId,gearMediaId:picture.gearMediaId,...metadata(picture.desired)};
  else if (picture.action==='update' && previous) replacement={...previous,...metadata(picture.desired)};
  else if (picture.action==='keep') replacement=previous;
  if (entryIndex>=0) local.kb.splice(entryIndex,1);
  if (replacement) local.kb.push(replacement);
  // No image sources are deleted: removing a picture only removes its association.

  // Verify local Markdown image files and exact source bytes before writing.
  const availableAssets=new Set();
  for (const image of authoredTargets(pkg.content.markdown,true)) {
    if (/^https?:\/\//i.test(image)) continue;
    let resolved;
    try { resolved=new URL(image,new URL(pkg.entity.content.slice(2),'https://local.invalid/')); }
    catch { throw new Error(`Unsafe image: ${image}`); }
    if (resolved.origin!=='https://local.invalid') throw new Error(`Unsafe image: ${image}`);
    const relative=`.${decodeURIComponent(resolved.pathname)}`;
    if (!safeKbPath(relative)) throw new Error(`Unsafe image: ${image}`);
    const filename=await safeFile(`pwa/${relative.slice(2)}`);
    await readValidatedImage(filename);
    availableAssets.add(relative);
  }
  const contentErrors=validateKbMarkdown(pkg.content.markdown,pkg.entity,next,gear,{availableAssets});
  if (contentErrors.length) throw new Error(contentErrors.join('\n'));
  const transformed={...next,entities:next.entities.map(row=>materializeKbEntity(row,local,availableMedia,gear))};
  const transformedValidation=validateKbBundle(transformed);
  if (!transformedValidation.valid) throw new Error(transformedValidation.errors.join('\n'));
  const transformedCatches=validateCatchBundle(catches,transformed,gear);
  if (!transformedCatches.valid) throw new Error(transformedCatches.errors.join('\n'));
  const historyPath=path.join(pwa,'kb-media-history.json');
  let history={version:1,entries:[]};
  try { history=await readJson(historyPath); } catch(error) { if(error.code!=='ENOENT') throw error; }
  if(history.version!==1 || !Array.isArray(history.entries)) throw new Error('Invalid KB media history.');
  const priorPicture=sourceOriginal?.picture || original?.picture || null;
  if(priorPicture && picture.action !== 'keep' && stableJson(priorPicture)!==stableJson(pkg.sourceEntity.picture)) {
    history.entries.push({entityId:pkg.kbId,recordedAt:new Date().toISOString(),dataVersion:bundle.dataVersion,action:picture.action,sourcePicture:structuredClone(sourceOriginal?.picture ?? null),displayPicture:structuredClone(original?.picture ?? null),localMedia:structuredClone(previous),replacement:structuredClone(pkg.sourceEntity.picture)});
  }
  const writes=new Map([
    [path.join(pwa,'data/kb.seed.json'),json(next)],
    [path.join(pwa,'local-media.json'),json(local)]
  ]);
  if (pkg.content.action!=='keep') writes.set(target,pkg.content.markdown);
  if (history.entries.length) writes.set(historyPath,json(history));
  return {writes,bundle:next,localMedia:local,summary:pkg.summary,original,sourceOriginal,originalMarkdown};
}

async function assertExclusiveKbImageSource(src,id,bundle,catches,local,pwa,safeFile) {
  for(const row of bundle.entities) {
    if(row.id!==id && row.picture?.src===src) throw new Error(`Image source is already used by ${row.id}.`);
  }
  for(const row of local.kb) {
    if(row.entityId!==id && row.source===src) throw new Error(`Image source is already registered to ${row.entityId}.`);
  }
  for(const row of catches.catches) if(row.picture?.src===src) throw new Error(`Image source is used by catch ${row.id}.`);
  // Also protect images shared through authored Markdown. The owner may
  // intentionally reuse its own hero as a supporting image.
  for(const row of bundle.entities) {
    if(row.id===id) continue;
    const filename=await safeFile(`pwa/${row.content.slice(2)}`);
    let markdown='';
    try { markdown=await fs.readFile(filename,'utf8'); } catch(error) { if(error.code!=='ENOENT') throw error; }
    for(const target of authoredTargets(markdown,true)) {
      if(/^https?:\/\//i.test(target)) continue;
      let resolved;
      try {resolved=`.${decodeURIComponent(new URL(target,new URL(row.content.slice(2),'https://local.invalid/')).pathname)}`;} catch {continue;}
      if(resolved===src) throw new Error(`Image source is referenced by ${row.id}; use a different filename.`);
    }
  }
}

export async function promoteKbChange(pkg,options={}) {
  const plan=await planKbPromotion(pkg,options);
  if (!options.apply) return plan;
  const backups=[];
  try {
    for (const [filename,content] of plan.writes) {
      let old=null;
      try {old=await fs.readFile(filename);} catch(error){if(error.code!=='ENOENT')throw error;}
      backups.push({filename,old});
      await fs.mkdir(path.dirname(filename),{recursive:true});
      const temp=`${filename}.kb-authoring-${process.pid}.tmp`;
      await fs.writeFile(temp,content);
      await fs.rename(temp,filename);
    }
  } catch(error) {
    for (const {filename,old} of backups.reverse()) {
      if(old===null) await fs.rm(filename,{force:true});
      else await fs.writeFile(filename,old);
    }
    throw error;
  }
  return plan;
}

if (process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const filename=process.argv[2];
  if (!filename) throw new Error('Usage: node pwa/promote-kb-change.mjs <package.json> [--apply]');
  const pkg=await readJson(path.resolve(filename));
  const plan=await promoteKbChange(pkg,{apply:process.argv.includes('--apply')});
  console.log(`${process.argv.includes('--apply')?'Applied':'Validated'} KB change ${pkg.kbId}: ${plan.summary.join(' ')}`);
  if (!process.argv.includes('--apply')) console.log('No repository files were changed. Review the package and use --apply on a feature branch to promote it.');
}
