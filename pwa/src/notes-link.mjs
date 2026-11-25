// V3 Markdown Notes link insertion. Keep targets stable across site releases.
// Catches are resolvable by manual catches://ID, never enumerated in picker.
import {ID_PATTERN,internalLink} from './shared.mjs';

export const SITE_LINK_TARGETS=Object.freeze([
 Object.freeze({uri:'site://home',title:'Home',group:'Navigation'}),
 Object.freeze({uri:'site://gear',title:'My Gear',group:'Navigation'}),
 Object.freeze({uri:'site://kb',title:'Knowledge Base',group:'Navigation'}),
 Object.freeze({uri:'site://catches',title:'Catch Log',group:'Navigation'}),
]);

export function notesLinkTargets(maps){
 const targets=[...SITE_LINK_TARGETS];
 for(const [domain,group] of [['gear','Gear'],['kb','Knowledge Base']]){
  if(!(maps?.[domain] instanceof Map))continue;
  for(const [id,record] of maps[domain]){
   if(!ID_PATTERN.test(id)||typeof record?.name!=='string')continue;
   targets.push({uri:domain+'://'+id,title:record.name,group});
  }
 }
 return targets.sort((a,b)=>a.group.localeCompare(b.group)||
  a.title.localeCompare(b.title)||a.uri.localeCompare(b.uri));
}
export function findNotesLinkTargets(targets,{query='',group='all'}={}){
 const q=query.trim().toLocaleLowerCase();
 return targets.filter(t=>(group==='all'||t.group===group)&&
  (!q||(t.title+' '+t.group+' '+t.uri).toLocaleLowerCase().includes(q)));
}
export function notesLinkMarkdown(label,uri,maps){
 if(typeof label!=='string'||!label.trim())throw Error('Link text is required.');
 if(typeof uri!=='string'||!uri.trim())throw Error('Choose a link destination.');
 let destination=uri.trim();
 if(/^(?:gear|kb|catches|site):\/\//.test(destination)){
  // Resolving here also rejects missing or retired item IDs.
  internalLink(destination,maps);
 }else{
  let parsed;
  try{parsed=new URL(destination);}catch{throw Error('Enter a valid HTTP or HTTPS URL.');}
  if(!['http:','https:'].includes(parsed.protocol)||parsed.username||
   parsed.password||/\s/.test(destination))
   throw Error('Enter a valid HTTP or HTTPS URL without credentials.');
  destination=parsed.href;
 }
 // Markdown link destinations cannot contain unescaped parentheses.
 destination=destination.replace(/\(/g,'%28').replace(/\)/g,'%29');
 const text=label.trim().replace(/\s+/g,' ')
  .replace(/\\/g,'\\\\').replace(/\[/g,'\\[').replace(/\]/g,'\\]');
 return '['+text+']('+destination+')';
}
