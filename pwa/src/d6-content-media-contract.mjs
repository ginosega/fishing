import {KB_KNOTS} from './taxonomy.mjs';
/**
 * M02 — one immutable source-side logical media-path contract for Gear/KB/Catch.
 * The Notes path remains the accepted D5 editor path. Cover images stay in
 * their category assets folder, and ordered Knot frames live under the one
 * canonical KB Knots /assets/<id>/step-NN.ext folder.
 *
 * This is not a live media registry. Staging a file NEVER makes it readable.
 */
import {categoryFolder,sequenceFolder,safePath,ID_PATTERN} from './shared.mjs';
import {noteImagePath} from './notes-markdown-editor.mjs';

export const D6_IMAGE_ROLES=Object.freeze([
 'notes','cover','knot-step',
]);
const EXT=/\.(?:jpe?g|png|webp|gif)$/i;
const ID=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const fail=reason=>{throw Error('MEDIA_INVALID: '+reason);};

function baseCheck(domain,record,path){
 if(!['gear','kb','catches'].includes(domain)||!record||
  typeof record!=='object'||typeof record.id!=='string'||
  record.id.length>160||!ID.test(record.id)||!ID_PATTERN.test(record.id))
  return fail('owner');
 if(!EXT.test(path))return fail('extension');
}
function coverFolder(domain,record){
 if(domain==='catches')return fail('Catch has no cover');
 try{return categoryFolder(domain,
   domain==='gear'?record.category:record.type)+'/assets/';}
 catch{return fail('category');}
}
function notesOwned(domain,record,path){
 const filename=path.split('/').at(-1);
 try{return noteImagePath(domain,record,filename)===path;}
 catch{return false;}
}
function coverOwned(domain,record,path){
 if(domain==='catches')return false;
 const prefix=coverFolder(domain,record);
 return path.startsWith(prefix)&&!path.slice(prefix.length).includes('/');
}
function stepOwned(record,path){
 if(record.type!==KB_KNOTS)return false;
 const prefix=sequenceFolder(record)+'/';
 if(!path.startsWith(prefix))return false;
 const tail=path.slice(prefix.length);
 return /^step-(?:0[1-9]|[1-9]\d)\.(?:jpe?g|png|webp|gif)$/i.test(tail);
}
/** All frames must be strictly numbered in canonical order; final frame
 * is the representative cover. No loose subset may become live. */
export function d6ValidKnotSequence(record){
 if(record?.type!==KB_KNOTS||!Array.isArray(record.pictureSequence)||
  record.pictureSequence.length<2||record.pictureSequence.length>32||
  record.picture?.src!==record.pictureSequence.at(-1))return false;
 try{
  return record.pictureSequence.every((p,i)=>{
   const path=safePath(p);
   const prefix=sequenceFolder(record)+'/';
   const file=path.startsWith(prefix)?path.slice(prefix.length):'';
   const number=String(i+1).padStart(2,'0');
   return new RegExp('^step-'+number+'\\.(?:jpe?g|png|webp|gif)$','i').test(file);
  });
 }catch{return false;}
}
/** Stage-only paths can be proposed without editing a live D1 record.
 * Role must be explicit for non-Notes; later publisher independently proves
 * the *actual* owning record uses the exact path. */
export function validateD6MediaOwnerPath({
 domain,record,logicalPath,role='notes',
}={}){
 let path;
 try{path=safePath(logicalPath);}catch{return fail('path');}
 baseCheck(domain,record,path);
 if(!D6_IMAGE_ROLES.includes(role))return fail('role');
 if(role==='notes'&&!notesOwned(domain,record,path))
  return fail('owner Notes path');
 if(role==='cover'&&!coverOwned(domain,record,path))
  return fail('cover category path');
 if(role==='knot-step'&&(domain!=='kb'||!stepOwned(record,path)))
  return fail('Knot step path');
 return Object.freeze({logicalPath:path,role});
}
/** A D1 record link AND the registered role AND D1 reference metadata are
 * necessary before the private R2 reader may expose an image. */
export function publishedD6MediaRole({domain,record,logicalPath,
 notesLinked=false}={}){
 let path;
 try{path=safePath(logicalPath);baseCheck(domain,record,path);}
 catch{return null;}
 if(notesOwned(domain,record,path))
  return notesLinked?'notes':null;
 if(domain==='kb'&&stepOwned(record,path)&&(
    d6ValidKnotSequence(record)&&record.pictureSequence.includes(path)||
    // "Remove sequence, keep representative picture" retains the final
    // step as one standalone image without copying or deleting its R2 bytes.
    !record.pictureSequence?.length&&record.picture?.src===path))
  return 'knot-step';
 if(record.picture?.src===path&&coverOwned(domain,record,path)&&
    !(domain==='kb'&&record.pictureSequence?.length))
  return 'cover';
 return null;
}
