const MEDIA_DATA_URL = './gear-media.json';
const VIDEO_TITLES_URL = './video-titles.json';
const VIEWER_MARGIN = 0.94;
const MAX_VIDEO_TITLE = 76;

const state = {
  media: [],
  videoTitles: {},
  queued: false,
  viewer: null,
  scale: 1,
  translateX: 0,
  translateY: 0,
  pointers: new Map(),
  pinchStartDistance: 0,
  pinchStartScale: 1,
  dragStart: null
};

Promise.all([fetchJson(MEDIA_DATA_URL, []), fetchJson(VIDEO_TITLES_URL, {})]).then(([media,titles]) => {
  state.media = Array.isArray(media) ? media : [];
  state.videoTitles = titles || {};
  queueEnhance();
});

const app = document.querySelector('#app');
if (app) new MutationObserver(queueEnhance).observe(app, {childList:true,subtree:true});
window.addEventListener('hashchange', queueEnhance);
window.addEventListener('resize', () => { if (state.viewer?.classList.contains('open')) fitViewerImage(); });
window.visualViewport?.addEventListener('resize', () => { if (state.viewer?.classList.contains('open')) fitViewerImage(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && state.viewer?.classList.contains('open')) closeViewer(); });

async function fetchJson(url,fallback) {
  try { const response = await fetch(url,{cache:'no-cache'}); return response.ok ? await response.json() : fallback; }
  catch { return fallback; }
}

function queueEnhance() {
  if (state.queued) return;
  state.queued = true;
  requestAnimationFrame(() => { state.queued = false; enhancePage(); });
}

function enhancePage() {
  enhanceVideoLinks(document);
  if (!location.hash.startsWith('#/inventory/item/')) return;
  const subtitle = document.querySelector('.section-title p')?.textContent?.trim() || '';
  if (/^Rods & Reels\s*-/i.test(subtitle)) enhanceRodReelSections();
  else {
    const title = document.querySelector('.section-title h2')?.textContent?.trim() || '';
    if (title) enhanceStandardGearLeaf(title);
  }
}

function enhanceStandardGearLeaf(title) {
  const media = findMedia(title);
  if (!media?.asset) return;
  const panel = [...document.querySelectorAll('.panel')].find(section => section.querySelector('.detail-grid'));
  if (!panel || panel.querySelector('.gear-media-button')) return;
  attachMedia(panel,media,title);
}

function enhanceRodReelSections() {
  for (const panel of document.querySelectorAll('.panel')) {
    const heading = panel.querySelector('h2.subsection-heading');
    if (!heading || !/^(Rod|Reel)$/i.test(heading.textContent.trim()) || panel.querySelector('.gear-media-button')) continue;
    const cell = [...panel.querySelectorAll('.detail-cell')].find(detail => normalize(detail.querySelector('.label')?.textContent) === 'manufacturer model');
    const identity = cell?.querySelector('.value')?.textContent?.trim() || '';
    const media = findMedia(identity);
    if (media?.asset) attachMedia(panel,media,identity);
  }
}

function attachMedia(panel,media,label) {
  const grid = panel.querySelector('.detail-grid');
  if (!grid) return;
  const layout = document.createElement('div');
  layout.className = 'gear-detail-layout';
  grid.replaceWith(layout);
  layout.append(createMediaButton(media,label),grid);
}

function createMediaButton(media,label) {
  const button = document.createElement('button');
  button.type='button';
  button.className='gear-media-button';
  button.setAttribute('aria-label',`Enlarge image of ${media.alt || label}`);
  const image=document.createElement('img');
  image.src=media.asset; image.alt=media.alt || label; image.loading='eager'; image.decoding='async';
  const hint=document.createElement('span'); hint.className='gear-media-hint'; hint.textContent='Tap to enlarge';
  button.append(image,hint);
  button.addEventListener('click',()=>openViewer(media));
  return button;
}

function findMedia(text) {
  const target=normalize(text);
  if (!target) return null;
  const matches=state.media.map(item => {
    let score=0;
    for (const alias of item.aliases || []) {
      const a=normalize(alias);
      if (!a) continue;
      if (target===a) score=Math.max(score,1000+a.length);
      else if (target.includes(a) || a.includes(target)) score=Math.max(score,500+Math.min(a.length,target.length));
    }
    return {item,score};
  }).filter(match=>match.score>0).sort((a,b)=>b.score-a.score);
  return matches[0]?.item || null;
}

function enhanceVideoLinks(root) {
  for (const anchor of root.querySelectorAll('a[href]')) {
    const id=youtubeId(anchor.href);
    if (!id) continue;
    const title=state.videoTitles[id]?.title || state.videoTitles[id] || '';
    if (!title) continue;
    const desired=`${truncate(title,MAX_VIDEO_TITLE)} ↗`;
    if (anchor.textContent.trim()!==desired) anchor.textContent=desired;
    anchor.title=title;
    anchor.setAttribute('aria-label',`${title} (opens video)`);
  }
}

function openViewer(media) {
  const viewer=ensureViewer();
  const image=viewer.querySelector('.media-viewer-image');
  viewer.querySelector('.media-viewer-title').textContent=media.alt || 'Gear image';
  const product=viewer.querySelector('.media-product-link');
  product.href=media.destination || media.sourcePage || '#';
  product.hidden=!(media.destination || media.sourcePage);
  viewer.classList.add('open');
  viewer.setAttribute('aria-hidden','false');
  document.body.classList.add('media-viewer-open');
  resetViewerTransform();
  image.onload=()=>requestAnimationFrame(fitViewerImage);
  image.src=media.asset;
  image.alt=media.alt || 'Gear image';
  if (image.complete && image.naturalWidth && image.naturalHeight) requestAnimationFrame(fitViewerImage);
  viewer.querySelector('.media-close-button').focus({preventScroll:true});
}

function closeViewer() {
  if (!state.viewer) return;
  state.viewer.classList.remove('open');
  state.viewer.setAttribute('aria-hidden','true');
  document.body.classList.remove('media-viewer-open');
  state.pointers.clear();
}

function ensureViewer() {
  if (state.viewer) return state.viewer;
  const viewer=document.createElement('div');
  viewer.className='media-modal'; viewer.setAttribute('role','dialog'); viewer.setAttribute('aria-modal','true'); viewer.setAttribute('aria-hidden','true');
  viewer.innerHTML=`<div class="media-dialog">
    <div class="media-viewer-header"><div class="media-viewer-title"></div><button class="media-icon-button media-close-button" type="button" aria-label="Close image viewer">✕</button></div>
    <div class="media-stage" aria-label="Zoomable gear image"><img class="media-viewer-image" alt="" draggable="false" /></div>
    <div class="media-toolbar" aria-label="Image controls"><button class="media-icon-button" type="button" data-media-zoom-out aria-label="Zoom out">−</button><button class="media-reset-button" type="button" data-media-reset>Reset</button><button class="media-icon-button" type="button" data-media-zoom-in aria-label="Zoom in">+</button><a class="media-product-link" target="_blank" rel="noopener">🌐 Product page ↗</a></div>
  </div>`;
  document.body.append(viewer); state.viewer=viewer;
  viewer.querySelector('.media-close-button').addEventListener('click',closeViewer);
  viewer.querySelector('[data-media-zoom-in]').addEventListener('click',()=>setViewerScale(state.scale*1.35));
  viewer.querySelector('[data-media-zoom-out]').addEventListener('click',()=>setViewerScale(state.scale/1.35));
  viewer.querySelector('[data-media-reset]').addEventListener('click',resetViewerTransform);
  viewer.addEventListener('click',event=>{if(event.target===viewer)closeViewer();});
  const stage=viewer.querySelector('.media-stage');
  stage.addEventListener('wheel',event=>{event.preventDefault();setViewerScale(state.scale*(event.deltaY<0?1.12:0.89));},{passive:false});
  stage.addEventListener('pointerdown',pointerDown);
  stage.addEventListener('pointermove',pointerMove);
  stage.addEventListener('pointerup',pointerUp);
  stage.addEventListener('pointercancel',pointerUp);
  stage.addEventListener('pointerleave',event=>{if(event.pointerType==='mouse')pointerUp(event);});
  return viewer;
}

function fitViewerImage() {
  const viewer=state.viewer;
  if (!viewer?.classList.contains('open')) return;
  const stage=viewer.querySelector('.media-stage');
  const image=viewer.querySelector('.media-viewer-image');
  if (!stage || !image?.naturalWidth || !image?.naturalHeight) return;
  const maxWidth=Math.max(1,stage.clientWidth*VIEWER_MARGIN);
  const maxHeight=Math.max(1,stage.clientHeight*VIEWER_MARGIN);
  const ratio=Math.min(maxWidth/image.naturalWidth,maxHeight/image.naturalHeight);
  image.style.width=`${Math.max(1,Math.floor(image.naturalWidth*ratio))}px`;
  image.style.height=`${Math.max(1,Math.floor(image.naturalHeight*ratio))}px`;
  image.style.maxWidth='none'; image.style.maxHeight='none';
  resetViewerTransform();
}

function pointerDown(event) {
  event.currentTarget.setPointerCapture?.(event.pointerId);
  state.pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
  if (state.pointers.size===1) state.dragStart={x:event.clientX,y:event.clientY,translateX:state.translateX,translateY:state.translateY};
  else if (state.pointers.size===2) { state.pinchStartDistance=pointerDistance(); state.pinchStartScale=state.scale; state.dragStart=null; }
}
function pointerMove(event) {
  if (!state.pointers.has(event.pointerId)) return;
  state.pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
  if (state.pointers.size===2 && state.pinchStartDistance>0) { setViewerScale(state.pinchStartScale*(pointerDistance()/state.pinchStartDistance),false); return; }
  if (state.pointers.size===1 && state.scale>1 && state.dragStart) {
    state.translateX=state.dragStart.translateX+event.clientX-state.dragStart.x;
    state.translateY=state.dragStart.translateY+event.clientY-state.dragStart.y;
    applyViewerTransform();
  }
}
function pointerUp(event) {
  state.pointers.delete(event.pointerId);
  if (state.pointers.size<2) state.pinchStartDistance=0;
  if (state.pointers.size===1) {
    const point=[...state.pointers.values()][0];
    state.dragStart={x:point.x,y:point.y,translateX:state.translateX,translateY:state.translateY};
  } else if (!state.pointers.size) state.dragStart=null;
}
function pointerDistance() { const points=[...state.pointers.values()]; return points.length<2?0:Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y); }
function setViewerScale(value,recenter=true) { state.scale=Math.min(6,Math.max(1,value)); if(state.scale<=1.001&&recenter){state.translateX=0;state.translateY=0;} applyViewerTransform(); }
function resetViewerTransform() { state.scale=1;state.translateX=0;state.translateY=0;applyViewerTransform(); }
function applyViewerTransform() {
  const image=state.viewer?.querySelector('.media-viewer-image'); if(!image)return;
  image.style.transform=`translate(${state.translateX}px, ${state.translateY}px) scale(${state.scale})`;
  const reset=state.viewer.querySelector('[data-media-reset]'); const out=state.viewer.querySelector('[data-media-zoom-out]');
  if(reset)reset.textContent=state.scale===1?'Reset':`${Math.round(state.scale*100)}%`;
  if(out)out.disabled=state.scale<=1.001;
}

function youtubeId(url) {
  try {
    const parsed=new URL(url,location.href); const host=parsed.hostname.replace(/^www\./,'');
    if(host==='youtu.be')return parsed.pathname.split('/').filter(Boolean)[0]||'';
    if(host.endsWith('youtube.com')) { if(parsed.pathname==='/watch')return parsed.searchParams.get('v')||''; return /^\/(?:shorts|embed)\/([^/?#]+)/.exec(parsed.pathname)?.[1]||''; }
  } catch {}
  return '';
}
function normalize(value=''){return String(value).toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();}
function truncate(value,max){const text=String(value||'').trim();return text.length<=max?text:`${text.slice(0,max-1).trimEnd()}…`;}
