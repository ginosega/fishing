// D6 opt-in reader Markdown original-image viewer behavior. The parser has already
// resolved every image to a repository-local source and rejected remote URLs.
// This module never loads arbitrary URLs or invents missing source references.
export function bindMarkdownPictureViewer(article,{references,resolveAsset,resolveThumbnail=null,resolveStagedAsset=null,openViewer,resolveAllImages=false}){
 const images=[...article.querySelectorAll('img')];
 const allowed=references.filter(ref=>ref.isImage===true);
 // Fail closed if sanitized DOM no longer matches the validated Markdown
 // image sequence; V2 keeps its old unchanged rendered Markdown.
 if(images.length!==allowed.length)return false;
 images.forEach((img,index)=>{
  const reference=allowed[index];
  if(reference.isImage!==true||reference.kind!=='local'||reference.local==null)return;
  // A sanitizer/browser may normalize the src DOM property differently
  // from the token's literal URL (notably percent-encoded spaces). Compare
  // only canonical absolute URLs, never match by alt text or filename.
  let rendered,expected;
  try{
   rendered=new URL(img.getAttribute('src')||img.src,
    article.ownerDocument.baseURI||reference.target).href;
   expected=new URL(reference.target).href;
  }catch{return;}
  if(rendered!==expected)return;
  const alt=img.getAttribute('alt')||'Picture';
  const caption=reference.viewerCaption||'';
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
  if(reference.viewerEnabled!==true&&!resolveAllImages)return;
  const source=resolveAsset(reference.local);
  if(!source){if(resolveAllImages)img.replaceWith(fallback());return;}
  // Candidate acceptance uses a loopback secure-context exception. Never
  // permit plaintext remote images, even when the original Markdown target
  // has been validated as a repository-local reference.
  let url;
  try{url=new URL(source);}catch{return;}
  const localPreviewBlob=url.protocol==='blob:'&&
   typeof resolveStagedAsset==='function'&&
   resolveStagedAsset(reference.local)===source&&
   url.origin===new URL(article.ownerDocument.baseURI||reference.target).origin;
  if(!localPreviewBlob&&url.protocol!=='https:'&&!(url.protocol==='http:'&&
    ['localhost','127.0.0.1','[::1]'].includes(url.hostname)))return;
  if(url.username||url.password){
   if(resolveAllImages)img.replaceWith(fallback());return;
  }
  // The exact published R2 URL, or the selected immutable release URL
  // before migration, is used for both ordinary and viewer-tagged images.
  let displaySource=source;
  if(reference.viewerEnabled===true&&reference.viewerThumbnail===true&&
      typeof resolveThumbnail==='function'){
   const selected=resolveThumbnail(reference.local);
   if(selected){
    try{
     const urlThumb=new URL(selected);
     if(urlThumb.origin===url.origin&&!urlThumb.username&&!urlThumb.password&&
        !urlThumb.search&&!urlThumb.hash&&
        urlThumb.pathname.startsWith('/api/v3/media/thumb/'))
      displaySource=urlThumb.href;
    }catch{ /* Reuse the verified original, not a foreign URL. */ }
   }
  }
  img.src=displaySource;
  if(reference.viewerEnabled!==true)return;
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
   if(img.src!==source){img.src=source;return;}
   if(wrapper)wrapper.replaceWith(fallback());
   else img.replaceWith(fallback());
  });
 });
 return true;
}
