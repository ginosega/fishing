import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

/**
 * Deterministic display-only derivatives of canonical static page art.
 * Canonical PNGs in assets/ are never changed or published in the release.
 * The 128px icon box exceeds 2x display density for 45px CSS card icons.
 * Page heroes retain their source aspect ratios and CSS responsive behavior.
 */
export async function generateStaticPageArtwork({assets,destination}){
 const groups=[
  {directory:'card-icons',width:128,match:/^(?:home|gear|kb)-[a-z0-9-]+\.png$/,expected:16},
  {directory:'page-hero',width:null,match:/^page-hero(?:-wide)?\.png$/,expected:2}
 ];
 const summary={files:0,sourceBytes:0,generatedBytes:0,outputs:[]};
 for(const group of groups){
  const srcDir=path.join(assets,group.directory);
  const names=(await fs.readdir(srcDir)).filter(name=>name.endsWith('.png')).sort();
  if(names.length!==group.expected||names.some(name=>!group.match.test(name)))throw new Error('Unexpected '+group.directory+' art list');
  const destDir=path.join(destination,group.directory);
  await fs.mkdir(destDir,{recursive:true});
  for(const name of names){
   const original=await fs.readFile(path.join(srcDir,name));
   const metadata=await sharp(original,{limitInputPixels:36000000,failOn:'error'}).metadata();
   if(metadata.format!=='png'||!metadata.hasAlpha)throw new Error('Expected transparent source PNG: '+name);
   if(group.directory==='card-icons'&&metadata.width!==metadata.height)throw new Error('Card icon not square: '+name);
   const target=group.width||(name==='page-hero-wide.png'?2560:1440);
   const output=await sharp(original,{limitInputPixels:36000000,failOn:'error'})
    .resize({width:target,height:group.width||undefined,fit:'inside',withoutEnlargement:true})
    .webp({quality:82,alphaQuality:95,effort:4}).toBuffer();
   const webp=await sharp(output).metadata();
   if(webp.format!=='webp'||webp.width>target||(group.width&&webp.height>target))throw new Error('Invalid converted static art: '+name);
   const filename=name.replace(/\.png$/,'.webp');
   await fs.writeFile(path.join(destDir,filename),output);
   summary.files++;summary.sourceBytes+=original.length;summary.generatedBytes+=output.length;
   summary.outputs.push(group.directory+'/'+filename);
  }
 }
 return summary;
}
