// V3-only Markdown original-image viewer behavior. The parser has already
// resolved every image to a repository-local source and rejected remote URLs.
// This module never loads arbitrary URLs or invents missing source references.
export function bindMarkdownPictureViewer(article,{references,resolveAsset,openViewer}){
 const images=[...article.querySelectorAll('img')];
 const allowed=references.filter(ref=>ref.kind==='image');
 // Fail closed if sanitized DOM no longer matches the validated Markdown
 // image sequence; V2 keeps its old unchanged rendered Markdown.
 if(images.length!==allowed.length)return false;
 images.forEach((img,index)=>{
  const reference=allowed[index];
  if(reference.kind!=='image'||reference.local==null)return;
  if(img.src!==reference.target)return;
  const alt=img.getAttribute('alt')||'Picture';
  const caption=img.getAttribute('title')||'';
  const fallback=()=>{
   const label=article.ownerDocument.createElement('span');
   label.className='markdown-image-unavailable';
   label.setAttribute('role','status');
   label.textContent='Picture unavailable: '+alt;
   return label;
  };
  if(reference.missing===true){
   img.replaceWith(fallback());return;
  }
  const source=resolveAsset(reference.local);
  if(typeof source!=='string'||!/^https:\/\//.test(source))return;
  // The private V3 sandbox serves immutable original bytes from the owner
  // asset endpoint, not an unrelated public V2 content release.
  img.src=source;
  const linked=img.closest('a');
  let wrapper=null;
  if(!linked){
   wrapper=article.ownerDocument.createElement('button');
   wrapper.type='button';
   wrapper.className='markdown-image-button';
   wrapper.setAttribute('aria-label','Enlarge '+alt);
   wrapper.addEventListener('click',()=>openViewer(source,alt,caption));
   img.replaceWith(wrapper);
   wrapper.append(img);
  }
  img.addEventListener('error',()=>{
   if(wrapper)wrapper.replaceWith(fallback());
   else img.replaceWith(fallback());
  },{once:true});
 });
 return true;
}
