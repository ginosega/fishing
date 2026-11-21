/** M02 — shared, browser/Worker-safe Notes image reference proof.
 * Only an actual Markdown image token with nonempty alt text counts.
 * A plain link, code fence, escaped token or incidental substring does not.
 * Path ownership, MIME, D1 revision and authenticated R2 access are separate
 * mandatory checks performed by their respective services.
 */
import MarkdownIt from 'markdown-it';
import {safePath} from './shared.mjs';
import {noteImageReference} from './notes-markdown-editor.mjs';

const parser=new MarkdownIt({html:false,linkify:false,typographer:false});

export function isD6NotesImageLinked(markdown,logicalPath){
 if(typeof markdown!=='string'||typeof logicalPath!=='string')return false;
 let wanted;
 try{wanted=noteImageReference(safePath(logicalPath));}
 catch{return false;}
 try{
  const tokens=parser.parse(markdown,{});
  const stack=[...tokens];
  while(stack.length){
   const token=stack.pop();
   if(token.children)stack.push(...token.children);
   if(token.type==='image'&&token.attrGet('src')===wanted&&
      token.content?.trim())return true;
  }
 }catch{return false;}
 return false;
}
