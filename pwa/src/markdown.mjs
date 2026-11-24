import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';
import {safePath,encodedPath,internalLink,assert,routeFor} from './shared.mjs';

const md=new MarkdownIt({html:false,linkify:false,typographer:false,breaks:false});
md.validateLink=url=>!(/^(?:javascript|vbscript|data|file|blob):/i.test(url)||url.startsWith('//'));
const rawImage=md.renderer.rules.image||((tokens,i,options,env,self)=>self.renderToken(tokens,i,options,env,self));
md.renderer.rules.image=(tokens,i,options,env,self)=>{tokens[i].attrSet('loading','lazy');tokens[i].attrSet('decoding','async');return rawImage(tokens,i,options,env,self);};
// Markdown pipe tables cannot contain block lists. Allow simple inline lists
// separated by <br>, <br/> or </br> inside a table cell, without enabling HTML.
function inlineTableLists(tokens){
 let inCell=false;
 for(const token of tokens){
  if(token.type==='th_open'||token.type==='td_open')inCell=true;
  else if(token.type==='th_close'||token.type==='td_close')inCell=false;
  if(!inCell||token.type!=='inline'||!/<\/?br\s*\/?>/i.test(token.content))continue;
  const fragments=token.content.split(/<\/?br\s*\/?>/i)
   .map(x=>x.trim()).filter(Boolean);
  if(fragments.length<2)continue;
  const items=fragments.map(x=>/^([-*+]|\d+[.)])\s+(.+)$/s.exec(x));
  if(items.some(x=>!x))continue;
  const ordered=/^\d/.test(items[0][1]);
  if(!items.every(x=>/^\d/.test(x[1])===ordered))continue;
  const start=ordered?Number.parseInt(items[0][1],10):1;
  if(!Number.isSafeInteger(start)||start<1||start>9999)continue;
  // Markdown-it renders inline tokens directly from token.children; its
  // renderer.rules.inline hook is not invoked by the block renderer.
  // Construct only trusted list tag tokens, never HTML from the Notes text.
  const html=content=>{const t=new token.constructor('html_inline','',0);
   t.content=content;return t;};
  const tag=ordered?'ol':'ul';
  const startAttr=ordered&&start!==1?' start="'+start+'"':'';
  const children=[html('<'+tag+startAttr+'>')];
  for(const item of items){
   children.push(html('<li>'),...md.parseInline(item[2],{})[0].children,
    html('</li>'));
  }
  children.push(html('</'+tag+'>'));
  token.children=children;
 }
}

const imageExtension=/\.(?:jpe?g|png|webp|gif)$/i;
function slug(value){return value.normalize('NFKD').toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu,'').trim().replace(/\s+/g,'-');}
function splitTarget(value){const match=/^([^?#]*)(\?[^#]*)?(#.*)?$/.exec(value);return {path:match[1],query:match[2]||'',fragment:match[3]||''};}
function decode(value){try{return decodeURIComponent(value);}catch{throw new Error(`Malformed URL encoding: ${value}`);}}
function localPath(owner,relative){
 const parts=owner.split('/').slice(0,-1);
 for(const encoded of relative.split('/')){
  if(/%(?:2f|5c)/i.test(encoded))throw new Error('Encoded path separator');
  const part=decode(encoded);
  if(!part||part==='.')continue;
  if(part==='..'){assert(parts.length>0,'Path escapes repository');parts.pop();}
  else parts.push(part);
 }
 return safePath(parts.join('/'));
}
function section(url){return url?`?section=${encodeURIComponent(decode(url.slice(1)))}`:'';}
export function resolveMarkdownTarget(url,{owner,maps,assetBase,pathRoutes=new Map(),ownerRoute}={}){
 assert(typeof url==='string'&&url.length>0,'Empty Markdown URL');
 if(/^(gear|kb|catches|site):\/\//.test(url))return {target:internalLink(url,maps),kind:'internal'};
 if(url.startsWith('#'))return {target:(ownerRoute||pathRoutes.get(owner)||'#/')+section(url),kind:'anchor'};
 if(/^https?:\/\//i.test(url)){const u=new URL(url);assert(['http:','https:'].includes(u.protocol),'Unsafe URL');return {target:url,kind:'external'};}
 if(url.startsWith('//')||url.startsWith('/')||url.includes('\\')||/^[a-z][a-z0-9+.-]*:/i.test(url))throw new Error(`Unsafe Markdown URL: ${url}`);
 const {path,query,fragment}=splitTarget(url);
 assert(path,'Empty local Markdown path');
 const local=localPath(owner,path);
 const route=pathRoutes.get(local);
 if(route)return {target:route+section(fragment),kind:'internal',local};
 return {target:new URL('content/'+encodedPath(local)+query+fragment,assetBase).href,kind:'local',local};
}
export function parseMarkdown(text,{owner,maps,assetBase='https://example.invalid/fishing/releases/test/',exists,pathRoutes=new Map(),ownerRoute,allowMissing=false,allowMissingImages=false,viewerImages=false,resolveImage=null}={}){
 const tokens=md.parse(text,{}),references=[];
 inlineTableLists(tokens);
 function walk(items){for(const token of items){
  if(token.children)walk(token.children);
  if(token.type!=='link_open'&&token.type!=='image')continue;
  const image=token.type==='image',attr=image?'src':'href',original=token.attrGet(attr);
  if(image&&!token.content?.trim())throw new Error(`Image alternative text required: ${owner}`);
  const resolved=resolveMarkdownTarget(original,{owner,maps,assetBase,pathRoutes,ownerRoute});
  if(image){
   if(resolved.kind!=='local'||!imageExtension.test(resolved.local)||/[?#]/.test(original))throw new Error(`Remote or unsafe Markdown image: ${owner} -> ${original}`);
  }
  const title=image?token.attrGet('title')||'':'';
  const viewerMatch=viewerImages&&image?/^viewer(-thumb)?(?:\s*:\s*(.*))?$/i.exec(title.trim()):null;
  if(viewerMatch){
   if(viewerMatch[1])token.attrSet('class','notes-inline-thumbnail');
   if(viewerMatch[2])token.attrSet('title',viewerMatch[2]);
   else token.attrs=token.attrs?.filter(([key])=>key!=='title')||[];
  }
  const missing=Boolean(resolved.local&&exists&&!exists.has(resolved.local));
  if(missing&&!allowMissing&&!(image&&allowMissingImages))
   throw new Error(`Missing Markdown resource: ${owner} -> ${resolved.local}`);
  // For a verified D1/R2 online reader, resolve before HTML insertion.
  // A missing published image becomes plain text; never first load the
  // stale immutable-release URL and then swap the DOM src afterward.
  if(image&&typeof resolveImage==='function'){
   const live=resolveImage(resolved.local);
   if(!live){
    const alt=token.content?.trim()||'Picture';
    token.type='text';token.tag='';token.attrs=null;token.children=null;
    token.content='[Picture unavailable: '+alt+']';
    continue;
   }
   let url,origin;
   try{url=new URL(live);origin=new URL(assetBase);}
   catch{throw Error('Unverified image source: '+owner);}
   if(url.origin!==origin.origin||url.username||url.password||
      url.search||url.hash||!(url.protocol==='https:'||
       (url.protocol==='http:'&&
        ['localhost','127.0.0.1','[::1]'].includes(url.hostname))))
    throw Error('Unverified image source: '+owner);
   resolved.target=url.href;
  }
  references.push({owner,kind:image?'image':'link',source:original,...resolved,
   ...(viewerImages&&image?{isImage:true,viewerEnabled:Boolean(viewerMatch),viewerCaption:viewerMatch?.[2]||'',viewerThumbnail:Boolean(viewerMatch?.[1])}:{}),
   ...(image&&missing&&allowMissingImages?{missing:true}:{})});
  token.attrSet(attr,resolved.target);
  if(!image&&resolved.kind==='external'){
   token.attrSet('target','_blank');token.attrSet('rel','noopener noreferrer');
  }
 }}
 walk(tokens);
 const headings=new Map();for(let i=0;i<tokens.length;i++)if(tokens[i].type==='heading_open'){
  const content=tokens[i+1];const plain=(content?.children||[]).map(t=>t.content).join('');
  const base=slug(plain)||'section';const count=headings.get(base)||0;headings.set(base,count+1);tokens[i].attrSet('id',base+(count?'-'+count:''));
 }
 return {html:md.renderer.render(tokens,md.options,{}),references,tokens};
}
export function sanitizeHtml(html,window){
 const purifier=DOMPurify(window);
 return purifier.sanitize(html,{USE_PROFILES:{html:true},ADD_ATTR:['target','rel'],FORBID_TAGS:['iframe','object','embed','script','style','form','input','button','video','audio','source','svg','math'],FORBID_ATTR:['style','srcset','onerror','onclick','onload'],ALLOW_DATA_ATTR:false});
}
export function renderMarkdown(text,options){return sanitizeHtml(parseMarkdown(text,options).html,options.window);}
export function markdownRouteMap(data){const routes=new Map();for(const r of data.gear.items)if(r.notes)routes.set(r.notes,routeFor('gear',r.id));for(const r of data.kb.entities)routes.set(r.content,routeFor('kb',r.id));for(const r of data.catches.catches)if(r.notes)routes.set(r.notes,routeFor('catches',r.id));return routes;}
