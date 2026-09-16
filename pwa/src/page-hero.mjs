const HERO_ROUTES=new Set(['#/','#/inventory','#/kb']);

export function isPageHeroRoute(hash){
 return HERO_ROUTES.has(hash||'#/');
}

export function applyPageHero(root=document.getElementById('app'),hash=location.hash||'#/'){
 if(!root)return;
 const page=root.querySelector(':scope > .page');
 if(!page)return;
 const header=page.querySelector(':scope > .page-header');
 if(!header)return;
 const enabled=isPageHeroRoute(hash);
 header.classList.toggle('page-hero',enabled);
 if(enabled&&hash==='#/'){
  const heading=header.querySelector('.page-heading');
  const lead=page.querySelector(':scope > .lead');
  if(heading&&lead){
   lead.classList.remove('lead');
   lead.classList.add('page-subtitle');
   heading.append(lead);
  }
 }
}

export function installPageHero(root=document.getElementById('app')){
 if(!root)return()=>{};
 const apply=()=>queueMicrotask(()=>applyPageHero(root));
 const observer=new MutationObserver(apply);
 observer.observe(root,{childList:true});
 window.addEventListener('hashchange',apply);
 apply();
 return()=>{
  observer.disconnect();
  window.removeEventListener('hashchange',apply);
 };
}
