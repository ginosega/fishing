/**
 * One source of live image truth: D1 refs + the actual current D1 record.
 * This compatibility adapter recognizes original V1/V2 image paths without
 * renaming content or granting publication rights to newly uploaded paths.
 * New V3 uploads still use the strict role/path validator.
 */
import MarkdownIt from 'markdown-it';
import {safePath} from './shared.mjs';
import {publishedD6MediaRole} from './d6-content-media-contract.mjs';
import {isD6NotesImageLinked} from './d6-notes-image-link.mjs';

const md=new MarkdownIt({html:false,linkify:false});
const IMAGE=/\.(?:jpe?g|png|webp|gif)$/i;
const MIME={jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',
 webp:'image/webp',gif:'image/gif'};

export function d6HistoricalMime(path){
 try{
  const clean=safePath(path);
  return MIME[clean.split('.').at(-1).toLowerCase()]??null;
 }catch{return null;}
}
export function d6HistoricalMarkdownLinked(text,logicalPath,owner){
 if(typeof text!=='string'||typeof owner!=='string')return false;
 let target;
 try{target=safePath(logicalPath);safePath(owner);}
 catch{return false;}
 if(!IMAGE.test(target)||!owner.includes('/'))return false;
 const prefix=owner.split('/').slice(0,-1);
 const tokenPaths=[...md.parse(text,{})];
 while(tokenPaths.length){
  const token=tokenPaths.pop();
  if(token.children)tokenPaths.push(...token.children);
  if(token.type!=='image'||!token.content?.trim())continue;
  const value=token.attrGet('src');
  if(typeof value!=='string'||!value||
   value.startsWith('/')||value.startsWith('//')||
   /[?#\\]/.test(value)||/^[a-z][a-z\d+.-]*:/i.test(value)||
   /%(?:2f|5c)/i.test(value))continue;
  const parts=[...prefix];
  let valid=true;
  for(const component of value.split('/')){
   let part;
   try{part=decodeURIComponent(component);}catch{valid=false;break;}
   if(!part||part==='.')continue;
   if(part==='..'){if(!parts.length){valid=false;break;}parts.pop();}
   else if(part.includes('/')||part.includes('\\')){valid=false;break;}
   else parts.push(part);
  }
  if(!valid)continue;
  try{if(safePath(parts.join('/'))===target)return true;}
  catch{/* malformed Markdown link: never grant read */}
 }
 return false;
}
export function d6ReadableMediaRole({domain,record,logicalPath,markdown,
 allowLegacy=false}={}){
 if(!['gear','kb','catches'].includes(domain)||!record||
  !d6HistoricalMime(logicalPath))return null;
 const strict=publishedD6MediaRole({
  domain,record,logicalPath,
  notesLinked:isD6NotesImageLinked(markdown,logicalPath),
 });
 if(strict)return strict;
 if(allowLegacy!==true)return null;
 // Historical records may have a cover in a different folder, cross-domain
 // KB→Gear picture, or noncanonical original Knot frame names.
 if(domain!=='catches'&&record.picture?.src===logicalPath)
  return record.type==='knot'&&record.pictureSequence?.includes(logicalPath)?
   'knot-step':'cover';
 if(domain==='kb'&&record.type==='knot'&&
    record.pictureSequence?.includes(logicalPath))
  return 'knot-step';
 const owner=domain==='kb'?record.content:record.notes;
 if(d6HistoricalMarkdownLinked(markdown,logicalPath,owner))
  return domain==='kb'?'article':'notes';
 return null;
}
