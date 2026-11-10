// Authoring-only Markdown preview for incomplete Gear/KB drafts.
// The source catalog has already been schema/semantics validated at bootstrap.
// Never validate the draft until Save and Publish; preview is not a publish gate.
import {ID_PATTERN,categoryFolder,routeFor} from './shared.mjs';
import {narrativePath} from './handoff.mjs';
import {markdownRouteMap} from './markdown.mjs';

export function draftNotesPreviewOptions(ctx,domain,record){
 if(!['gear','kb'].includes(domain)||!ctx?.maps||!ctx?.data||
  !record||typeof record!=='object')throw Error('Invalid Notes preview configuration');
 const key=domain==='gear'?'notes':'content';
 const fallback=categoryFolder(domain,
  domain==='gear'?record.category:record.type)+'/content/Notes-Preview.md';
 const owner=record[key]||(typeof record.name==='string'&&record.name.trim()?
  narrativePath(domain,record):fallback);
 const routes=markdownRouteMap(ctx.data);
 if(ID_PATTERN.test(record.id??''))routes.set(owner,routeFor(domain,record.id));
 return {owner,maps:ctx.maps,assetBase:ctx.base,pathRoutes:routes};
}
