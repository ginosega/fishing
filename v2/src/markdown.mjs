import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';
import {safePath,encodedPath,internalLink,assert,routeFor} from './shared.mjs';

const md=new MarkdownIt({html:false,linkify:false,typographer:false,breaks:false});
md.validateLink=url=>!(/^(?:javascript|vbscript|data|file|blob):/i.test(url)||url.startsWith('//'));
const rawLink=md.renderer.rules.link_open||((tokens,i,options,env,self)=>self.renderToken(tokens,i,options));
md.renderer.rules.link_open=(tokens,i,options,env,self)=>{tokens[i].attrSet('target','_self');return rawLink(tokens,i,options,env,self);};
const rawImage=md.renderer.rules.image||((tokens,i,options,env,self)=>self.renderToken(tokens,i,options,env,self));
md.renderer.rules.image=(tokens,i,options,env,self)=>{tokens[i].attrSet('loading','lazy');tokens[i].attrSet('decoding','async');return rawImage(tokens,i,options,env,self);};
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
 if(/^(gear|kb):\/\//.test(url))return {target:internalLink(url,maps),kind:'internal'};
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
export function parseMarkdown(text,{owner,maps,assetBase='https://example.invalid/fishing/releases/test/',exists,pathRoutes=new Map(),ownerRoute,allowMissing=false}={}){
 const tokens=md.parse(text,{}),references=[];
 function walk(items){for(const token of items){
  if(token.children)walk(token.children);
  if(token.type!=='link_open'&&token.type!=='image')continue;
  const image=token.type==='image',attr=image?'src':'href',original=token.attrGet(attr);
  if(image&&!token.content?.trim())throw new Error(`Image alternative text required: ${owner}`);
  const resolved=resolveMarkdownTarget(original,{owner,maps,assetBase,pathRoutes,ownerRoute});
  if(image){
   if(resolved.kind!=='local'||!imageExtension.test(resolved.local)||/[?#]/.test(original))throw new Error(`Remote or unsafe Markdown image: ${owner} -> ${original}`);
  }
  if(resolved.local&&exists&&!exists.has(resolved.local)&&!allowMissing)throw new Error(`Missing Markdown resource: ${owner} -> ${resolved.local}`);
  references.push({owner,kind:image?'image':'link',source:original,...resolved});token.attrSet(attr,resolved.target);
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
 return purifier.sanitize(html,{USE_PROFILES:{html:true},FORBID_TAGS:['iframe','object','embed','script','style','form','input','button','video','audio','source','svg','math'],FORBID_ATTR:['style','srcset','onerror','onclick','onload'],ALLOW_DATA_ATTR:false});
}
export function renderMarkdown(text,options){return sanitizeHtml(parseMarkdown(text,options).html,options.window);}
export function markdownRouteMap(data){const routes=new Map();for(const r of data.gear.items)if(r.notes)routes.set(r.notes,routeFor('gear',r.id));for(const r of data.kb.entities)routes.set(r.content,routeFor('kb',r.id));for(const r of data.catches.catches)if(r.notes)routes.set(r.notes,routeFor('catches',r.id));return routes;}
