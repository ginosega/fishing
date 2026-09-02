const MEDIA_DATA_URL = './gear-media.json';
const VIDEO_TITLES_URL = './video-titles.json';
const MAX_VIDEO_TITLE = 76;
const VIEWER_MARGIN = 0.94;

const mediaUiState = {
  media: [], videoTitles: {}, enhanceQueued: false, viewer: null,
  scale: 1, translateX: 0, translateY: 0, pointers: new Map(),
  pinchStartDistance: 0, pinchStartScale: 1, dragStart: null
};
const mediaUiApp = document.querySelector('#app');

Promise.all([fetchJson(MEDIA_DATA_URL, []), fetchJson(VIDEO_TITLES_URL, {})]).then(([media, titles]) => {
  mediaUiState.media = Array.isArray(media) ? media : (media?.items || []);
  mediaUiState.videoTitles = titles || {};
  queueEnhance();
}).catch(error => console.warn('Fishing Companion media enhancement unavailable:', error));

if (mediaUiApp) new MutationObserver(queueEnhance).observe(mediaUiApp, { childList: true, subtree: true });
window.addEventListener('hashchange', queueEnhance);
window.addEventListener('resize', () => { if (mediaUiState.viewer?.classList.contains('open')) fitViewerImage(); });
window.visualViewport?.addEventListener('resize', () => { if (mediaUiState.viewer?.classList.contains('open')) fitViewerImage(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && mediaUiState.viewer?.classList.contains('open')) closeViewer(); });

async function fetchJson(url, fallback) {
  try { const response = await fetch(url, { cache: 'no-cache' }); return response.ok ? await response.json() : fallback; }
  catch { return fallback; }
}

function queueEnhance() {
  if (mediaUiState.enhanceQueued) return;
  mediaUiState.enhanceQueued = true;
  requestAnimationFrame(() => { mediaUiState.enhanceQueued = false; enhanceRenderedPage(); });
}

function enhanceRenderedPage() {
  enhanceVideoLinks(document);
  enhanceInventoryLists();
  if (!location.hash.startsWith('#/inventory/item/')) return;

  const title = document.querySelector('.section-title h2')?.textContent?.trim() || '';
  const subtitle = document.querySelector('.section-title p')?.textContent?.trim() || '';
  if (!title) return;

  applyAcceptanceCorrections(title, subtitle);
  applyCuratedLureGuidance(title, subtitle);
  formatHowToResources(title, subtitle);
  enhanceVideoLinks(document);

  if (/^knots$/i.test(subtitle)) return;
  if (/^rods & reels\s*-/i.test(subtitle)) { enhanceRodReelSections(); return; }
  enhanceStandardGearLeaf(document.querySelector('.section-title h2')?.textContent?.trim() || title);
}

function enhanceInventoryLists() {
  if (location.hash === '#/inventory/rods-reels') {
    const group = [...document.querySelectorAll('.item-group')].find(section => normalize(section.querySelector('h2')?.textContent) === 'spincasting');
    const card = group?.querySelector('.item-card');
    if (card) {
      setText(card.querySelector('h3'), 'Pflueger President Spincast Combo');
      setText(card.querySelector('.item-meta span'), 'Rod: Pflueger President Spincast Combo, Reel: Pflueger President Spincast Combo');
    }
  }
  if (location.hash === '#/inventory/weights') {
    for (const card of document.querySelectorAll('.item-card')) {
      const heading = card.querySelector('h3');
      if (normalize(heading?.textContent) === 'swiveling trolling torpedo weights') setText(heading, 'Swiveling trolling sinkers');
    }
  }
}

function applyAcceptanceCorrections(title, subtitle) {
  const normalizedTitle = normalize(title), normalizedSubtitle = normalize(subtitle);

  if (normalizedSubtitle.startsWith('rods and reels')) {
    for (const panel of document.querySelectorAll('.panel')) {
      if (normalize(panel.querySelector('h3')?.textContent) === 'my catch history') setText(panel.querySelector('.empty'), 'No catches have been recorded with this rod & reel.');
    }
    if (normalizedSubtitle === 'rods and reels spinning') {
      setDetailValueIn(componentPanel('Rod'), 'Specifications', `7', medium power, fast action, 2-piece, part TATULAXT702MFS`);
      setDetailValueIn(componentPanel('Reel'), 'Specifications', '6.2:1 gear ratio, part EXELT2500D-XH');
    }
    if (normalizedSubtitle === 'rods and reels baitcasting') {
      const reel = componentPanel('Reel'), cell = findDetailCellIn(reel, 'Specifications');
      const current = cell?.querySelector('.value')?.textContent?.trim() || '';
      if (!/7\.4\s*:\s*1\s*gear ratio/i.test(current)) setDetailValueIn(reel, 'Specifications', current ? `${current.replace(/[;,.\s]+$/, '')}; 7.4:1 gear ratio` : '7.4:1 gear ratio');
    }
    if (normalizedSubtitle === 'rods and reels spincasting') {
      setText(document.querySelector('.section-title h2'), 'Rod: Pflueger President Spincast Combo, Reel: Pflueger President Spincast Combo');
      const rod = componentPanel('Rod'), reel = componentPanel('Reel');
      setDetailValueIn(rod, 'Manufacturer / Model', 'Pflueger President Spincast Combo');
      setDetailValueIn(reel, 'Manufacturer / Model', 'Pflueger President Spincast Combo');
      setDetailValueIn(rod, 'Specifications', `6'6", medium power, 2-piece, part PRESSC-606L2CBO`);
      setDetailValueIn(reel, 'Specifications', '8-14 lb line weight, 3.8:1 gear ratio, part PRESSC-606L2CBO');
      const link = [{ label: 'Pflueger', url: 'https://pfluegerfishing.com/products/president-spincast-combo-1595561' }];
      setLinksIn(rod, link); setLinksIn(reel, link);
      for (const heading of document.querySelectorAll('.panel h4')) if (normalize(heading.textContent) === 'best use') heading.remove();
    }
  }

  if (normalizedTitle === 'cylinder weights') setDetailValue('Manufacturer / Model', 'THKFISH / 28 pcs sinkers set');
  if (normalizedTitle === 'swiveling trolling torpedo weights' || normalizedTitle === 'swiveling trolling sinkers') {
    setText(document.querySelector('.section-title h2'), 'Swiveling trolling sinkers');
    setText(document.querySelector('.section-title p'), 'Weights - Swiveling trolling sinkers');
    const how = panelByHeading('How to use it');
    if (how) {
      const body = how.querySelector('.guidance-body') || how;
      const desired = `<p>Used for <a href="#/kb/kb-kayak-trolling">kayak trolling</a> in <a href="#/kb/kb-trout-fishing">trout fishing</a>.</p>`;
      if (body.innerHTML !== desired) body.innerHTML = desired;
    }
  }
  if (normalizedTitle === 'glass beads') setDetailValue('Manufacturer / Model', 'Top Brass / Czechoslovakian Glass Beads');
  if (normalizedTitle === 'kastmaster') {
    setDetailValue('Manufacturer / Model', 'Acme / Kastmaster');
    const core = [...document.querySelectorAll('.panel')].find(panel => panel.querySelector('.detail-grid'));
    setLinksIn(core, [{ label: 'Acme', url: 'https://www.acmetackle.com/products/kastmaster-plain-treble-hook-solid?variant=46771792582' }]);
  }
  if (normalizedTitle === 'generic 0 inline spinner assortment') setDetailValue('Manufacturer / Model', 'Generic / #0 inline spinner assortment');
  if (normalizedTitle === 'generic 1 inline spinner') setDetailValue('Manufacturer / Model', 'Generic / #1 inline spinner');
  if (normalizedTitle === 'mepps aglia 3') {
    setDetailValue('Manufacturer / Model', 'Mepps / Aglia #3');
    setDetailValue('Specifications', '1/4 OZ, Gold/Red Dot Blade, Plain');
  }
  if (normalizedTitle === 'south bend hook assortment') {
    setDetailValue('Manufacturer / Model', 'South Bend / Hook Assortment');
    setDetailValue('Specifications', '#4, #6, #8 standard and Aberdeen/long-shank');
  }
  if (normalizedTitle === 'booyah pad crasher') {
    setDetailValue('Manufacturer / Model', 'Booyah / Pad Crasher');
    setDetailValue('Specifications', 'Pad Crasher, Pad Crasher Jr.');
  }
  if (normalizedTitle === 'z man ned rig kit') setDetailValue('Specifications', '3.5", Green Pumpkin, Trick ShotZ, Finesse ShadZ, GobyZ');
  if (normalizedTitle === 'tsuridamashii ball bearing swivels' || normalizedTitle === 'tsuridamashii ball bearing snap swivels') removeUnlinkedManufacturer('Tsuridamashii');
  if (normalizedTitle === 'yum christie craw') removeUnlinkedManufacturer('YUM');
  if (normalizedTitle === 'fg' && normalizedSubtitle === 'knots') setDetailValue('Description', 'Preferred braid-to-fluorocarbon leader knot.');
  if (normalizedTitle === 'trilene' && normalizedSubtitle === 'knots') {
    for (const anchor of document.querySelectorAll('a[href*="#/inventory/snaps-swivels"]')) if (normalize(anchor.textContent) === 'snaps and swivels') anchor.replaceWith(document.createTextNode(anchor.textContent));
  }
}

function applyCuratedLureGuidance(title, subtitle) {
  if (!normalize(subtitle).startsWith('lures')) return;
  const n = normalize(title);
  if (n === '6th sense divine swimbait' || n === 'berkley gulp minnow') {
    replaceGuidancePanel('Knots & connections', `<div class="recommendation"><h4>Hook</h4><div class="guidance-body"><p>Use a 4/0 EWG worm offset hook.</p><p>Video: <a href="https://youtu.be/dOgX9l18DQk" target="_blank" rel="noopener">How to rig a soft jerkbait ↗</a></p></div></div>`);
    replaceGuidancePanel('How to use it', `<div class="recommendation"><h4>Use</h4><div class="guidance-body"><ul><li>Target big fish.</li><li>Use in clear water and around baitfish schools, especially post-spawn and in fall.</li><li>Gear: 7'–8' heavy or extra-heavy rod, 6.2:1-or-slower baitcaster, and 15–25 lb fluorocarbon or 65 lb braid with an optional fluorocarbon leader.</li></ul></div></div><div class="recommendation"><h4>Technique</h4><div class="guidance-body"><ul><li>Target points, ledges, weed edges, docks, and submerged structure.</li><li>Retrieve slow and steady.</li><li>Adjust retrieve speed or weight to control depth.</li><li>For glide baits, add half-turn pauses or gentle twitches to trigger following fish.</li></ul></div></div>`);
  }
  if (n === 'yamamoto senko') {
    replaceGuidancePanel('Knots & connections', `<div class="recommendation"><div class="guidance-body"><p>Tie directly to the hook with a <a href="#/inventory/item/knots-palomar">Palomar knot</a>.</p></div></div>`);
    const panel = replaceGuidancePanel('How to use it', `<div class="recommendation"><h4>Use</h4><div class="guidance-body"><ul><li>Use for finicky or pressured bass from spring through early fall, especially around the spawn and post-spawn.</li><li>Best in clear to lightly stained shallow water, roughly 2–8 ft, around cover, docks, grass edges, and visible fish.</li><li>If fish are not responding or you need to work deeper, try a Ned rig.</li></ul></div></div><div class="recommendation"><h4>Technique</h4><div class="guidance-body"><ul><li>Cast, let the Senko fall, twitch lightly, and pause.</li><li>In water deeper than about 5 ft, pause 5–6 seconds so it can sink and wiggle.</li><li>Do not set the hook too early; wait until you feel the fish's weight.</li></ul></div></div><div class="recommendation"><h4>Resources</h4><div class="guidance-body"><p>Video: <a href="https://youtu.be/FBWjutCCV9Q?si=Z9Ng67D-LSa7umtT" target="_blank" rel="noopener">Wacky Rig - Wendell Fishing ↗</a></p></div></div>`);
    if (panel) panel.dataset.resourcesFormatted = '1';
  }
  if (n === 'fin sanity bluegill') {
    const how = panelByHeading('How to use it');
    if (how) for (const anchor of [...how.querySelectorAll('a[href]')]) if (youtubeId(anchor.href)) removeResourceAnchor(anchor);
  }
}

function formatHowToResources(title, subtitle) {
  const panel = panelByHeading('How to use it');
  if (!panel || panel.dataset.resourcesFormatted === '1') return;
  const isLure = normalize(subtitle).startsWith('lures');
  if (isLure) {
    for (const node of [...panel.querySelectorAll('p, li')]) {
      const text = normalize(node.textContent);
      if (text.includes('onenote linked') || text.includes('onenote source resources') || text.startsWith('rigging ')) {
        [...node.querySelectorAll('a[href]')].filter(isExternalResourceLink).forEach(anchor => stashResource(panel, anchor));
        node.remove();
      }
    }
  }
  for (const anchor of [...panel.querySelectorAll('a[href]')]) {
    if (!isExternalResourceLink(anchor)) continue;
    stashResource(panel, anchor); removeResourceAnchor(anchor);
  }
  const resources = readStashedResources(panel);
  if (resources.length && !panel.querySelector('[data-resource-block]')) {
    const block = document.createElement('div');
    block.className = 'recommendation'; block.dataset.resourceBlock = '1';
    const lines = resources.map(resource => `<p>${isVideoUrl(resource.url) ? 'Video' : 'Article'}: <a href="${escapeAttr(resource.url)}" target="_blank" rel="noopener">${escapeHtml(resource.label)} ↗</a></p>`).join('');
    block.innerHTML = `<h4>Resources</h4><div class="guidance-body">${lines}</div>`; panel.append(block);
  }
  panel.dataset.resourcesFormatted = '1';
}

function stashResource(panel, anchor) {
  const url = anchor.href; if (!url) return;
  const resources = readStashedResources(panel); if (resources.some(item => item.url === url)) return;
  const label = anchor.title || anchor.textContent.replace(/\s*↗\s*$/, '').trim() || (isVideoUrl(url) ? 'Video' : 'Article');
  resources.push({ url, label }); panel.dataset.resources = JSON.stringify(resources);
}
function readStashedResources(panel) { try { return JSON.parse(panel.dataset.resources || '[]'); } catch { return []; } }
function removeResourceAnchor(anchor) {
  const li = anchor.closest('li');
  if (li) {
    const residual = normalize(li.textContent.replace(anchor.textContent, '').replace(/\b(video|article)\b/gi, ''));
    if (!residual) { li.remove(); return; }
  }
  const parent = anchor.parentElement;
  anchor.remove();
  if (parent) {
    const residual = normalize(parent.textContent.replace(/\b(video|article)\b/gi, ''));
    if (!residual) parent.remove();
  }
}
function isExternalResourceLink(anchor) {
  try { const url = new URL(anchor.href, location.href); return /^https?:$/.test(url.protocol) && url.origin !== location.origin; }
  catch { return false; }
}
function isVideoUrl(url) {
  try { const host = new URL(url, location.href).hostname.replace(/^www\./, ''); return host === 'youtu.be' || host.endsWith('youtube.com') || host.includes('vimeo.com'); }
  catch { return false; }
}

function replaceGuidancePanel(heading, bodyHtml) {
  let panel = panelByHeading(heading);
  if (!panel) {
    const firstCatch = [...document.querySelectorAll('.panel')].find(p => normalize(p.querySelector('h3')?.textContent) === 'my catch history');
    panel = document.createElement('section'); panel.className = 'panel';
    if (firstCatch) firstCatch.before(panel); else document.querySelector('#app')?.append(panel);
  }
  const desired = `<h3>${escapeHtml(heading)}</h3>${bodyHtml}`;
  if (panel.innerHTML !== desired) panel.innerHTML = desired;
  panel.dataset.curatedGuidance = '1'; return panel;
}
function panelByHeading(heading) { const wanted = normalize(heading); return [...document.querySelectorAll('.panel')].find(panel => normalize(panel.querySelector('h3')?.textContent) === wanted) || null; }
function componentPanel(name) { const wanted = normalize(name); return [...document.querySelectorAll('.panel')].find(panel => normalize(panel.querySelector('h2.subsection-heading')?.textContent) === wanted) || null; }
function findDetailCellIn(root, label) { if (!root) return null; const wanted = normalize(label); return [...root.querySelectorAll('.detail-cell')].find(cell => normalize(cell.querySelector('.label')?.textContent) === wanted) || null; }
function findDetailCell(label) { return findDetailCellIn(document, label); }
function setDetailValue(label, value) { setText(findDetailCell(label)?.querySelector('.value'), value); }
function setDetailValueIn(root, label, value) { setText(findDetailCellIn(root, label)?.querySelector('.value'), value); }
function setLinksIn(panel, links) {
  if (!panel) return;
  let cell = findDetailCellIn(panel, 'Links'); const grid = panel.querySelector('.detail-grid');
  if (!cell && grid) { cell = document.createElement('div'); cell.className = 'detail-cell'; cell.innerHTML = '<div class="label">Links</div><div class="value"></div>'; grid.append(cell); }
  const value = cell?.querySelector('.value'); if (!value) return;
  const html = `<div class="detail-links">${links.map(link => `<a href="${escapeAttr(link.url)}" target="_blank" rel="noopener">${escapeHtml(link.label)} ↗</a>`).join('<br>')}</div>`;
  if (value.innerHTML !== html) value.innerHTML = html;
}
function removeUnlinkedManufacturer(label) {
  const value = findDetailCell('Links')?.querySelector('.value'); if (!value) return;
  const muted = [...value.querySelectorAll('.muted')].filter(el => normalize(el.textContent) === normalize(label)); if (!muted.length) return;
  const anchors = [...value.querySelectorAll('a[href]')].map(anchor => anchor.outerHTML);
  value.innerHTML = anchors.length ? `<div class="detail-links">${anchors.join('<br>')}</div>` : '<span class="muted">No links recorded.</span>';
}
function setText(element, value) { if (element && element.textContent !== value) element.textContent = value; }

function enhanceVideoLinks(root) {
  for (const anchor of root.querySelectorAll('a[href]')) {
    const id = youtubeId(anchor.href); if (!id) continue;
    const preferred = id === 'MQ9sCXQNGMI' ? 'How to tie the Trilene knot' : mediaUiState.videoTitles[id]?.title || mediaUiState.videoTitles[id] || '';
    if (!preferred) continue;
    const display = truncateTitle(preferred, MAX_VIDEO_TITLE), desired = `${display} ↗`;
    if (anchor.textContent.trim() !== desired) anchor.textContent = desired;
    anchor.title = preferred; anchor.setAttribute('aria-label', `${preferred} (opens video)`);
  }
}

function enhanceStandardGearLeaf(title) {
  const media = findMedia(title); if (!media?.asset) return;
  const firstPanel = [...document.querySelectorAll('.panel')].find(panel => panel.querySelector('.detail-grid'));
  if (!firstPanel || firstPanel.querySelector('.gear-media-button')) return;
  attachMediaToPanel(firstPanel, media, title);
}
function enhanceRodReelSections() {
  const spincast = normalize(document.querySelector('.section-title p')?.textContent) === 'rods and reels spincasting';
  for (const panel of document.querySelectorAll('.panel')) {
    const heading = panel.querySelector('h2.subsection-heading'); if (!heading || !/^(rod|reel)$/i.test(heading.textContent.trim())) continue;
    if (spincast && normalize(heading.textContent) === 'reel') continue;
    if (panel.querySelector('.gear-media-button')) continue;
    const manufacturerCell = [...panel.querySelectorAll('.detail-cell')].find(cell => normalize(cell.querySelector('.label')?.textContent) === 'manufacturer model');
    const identity = manufacturerCell?.querySelector('.value')?.textContent?.trim() || ''; if (!identity || normalize(identity) === 'unknown') continue;
    const media = findMedia(identity); if (media?.asset) attachMediaToPanel(panel, media, identity);
  }
}
function attachMediaToPanel(panel, media, label) {
  const detailGrid = panel.querySelector('.detail-grid'); if (!detailGrid) return;
  const layout = document.createElement('div'); layout.className = 'gear-detail-layout'; detailGrid.replaceWith(layout); layout.append(createMediaButton(media, label), detailGrid);
}
function createMediaButton(media, label) {
  const button = document.createElement('button'); button.type = 'button'; button.className = 'gear-media-button'; button.setAttribute('aria-label', `Enlarge image of ${media.alt || label}`);
  const image = document.createElement('img'); image.src = media.asset; image.alt = media.alt || label; image.loading = 'eager'; image.decoding = 'async';
  const hint = document.createElement('span'); hint.className = 'gear-media-hint'; hint.textContent = 'Tap to enlarge';
  button.append(image, hint); button.addEventListener('click', () => openViewer(media)); return button;
}
function findMedia(text) {
  const target = normalize(text); if (!target) return null;
  const candidates = mediaUiState.media.map(item => { let score = 0; for (const alias of item.aliases || []) { const a = normalize(alias); if (!a) continue; if (target === a) score = Math.max(score, 1000 + a.length); else if (target.includes(a) || a.includes(target)) score = Math.max(score, 500 + Math.min(a.length, target.length)); } return { item, score }; }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);
  return candidates[0]?.item || null;
}

function openViewer(media) {
  const viewer = ensureViewer(), image = viewer.querySelector('.media-viewer-image'), title = viewer.querySelector('.media-viewer-title'), product = viewer.querySelector('.media-product-link');
  title.textContent = media.alt || 'Gear image'; product.href = media.destination || media.sourcePage || '#'; product.hidden = !(media.destination || media.sourcePage);
  viewer.classList.add('open'); viewer.setAttribute('aria-hidden', 'false'); document.body.classList.add('media-viewer-open'); resetViewerTransform();
  image.onload = () => requestAnimationFrame(fitViewerImage); image.src = media.asset; image.alt = media.alt || 'Gear image';
  if (image.complete && image.naturalWidth && image.naturalHeight) requestAnimationFrame(fitViewerImage);
  viewer.querySelector('.media-close-button').focus({ preventScroll: true });
}
function closeViewer() { const viewer = mediaUiState.viewer; if (!viewer) return; viewer.classList.remove('open'); viewer.setAttribute('aria-hidden', 'true'); document.body.classList.remove('media-viewer-open'); mediaUiState.pointers.clear(); }
function ensureViewer() {
  if (mediaUiState.viewer) return mediaUiState.viewer;
  const viewer = document.createElement('div'); viewer.className = 'media-modal'; viewer.setAttribute('role', 'dialog'); viewer.setAttribute('aria-modal', 'true'); viewer.setAttribute('aria-hidden', 'true');
  viewer.innerHTML = `<div class="media-dialog"><div class="media-viewer-header"><div class="media-viewer-title"></div><button class="media-icon-button media-close-button" type="button" aria-label="Close image viewer">✕</button></div><div class="media-stage" aria-label="Zoomable gear image"><img class="media-viewer-image" alt="" draggable="false" /></div><div class="media-toolbar" aria-label="Image controls"><button class="media-icon-button" type="button" data-media-zoom-out aria-label="Zoom out">−</button><button class="media-reset-button" type="button" data-media-reset>Reset</button><button class="media-icon-button" type="button" data-media-zoom-in aria-label="Zoom in">+</button><a class="media-product-link" target="_blank" rel="noopener">🌐 Product page ↗</a></div></div>`;
  document.body.append(viewer); mediaUiState.viewer = viewer;
  viewer.querySelector('.media-close-button').addEventListener('click', closeViewer);
  viewer.querySelector('[data-media-zoom-in]').addEventListener('click', () => setViewerScale(mediaUiState.scale * 1.35));
  viewer.querySelector('[data-media-zoom-out]').addEventListener('click', () => setViewerScale(mediaUiState.scale / 1.35));
  viewer.querySelector('[data-media-reset]').addEventListener('click', resetViewerTransform);
  viewer.addEventListener('click', event => { if (event.target === viewer) closeViewer(); });
  const stage = viewer.querySelector('.media-stage');
  stage.addEventListener('wheel', event => { event.preventDefault(); setViewerScale(mediaUiState.scale * (event.deltaY < 0 ? 1.12 : 0.89)); }, { passive: false });
  stage.addEventListener('pointerdown', pointerDown); stage.addEventListener('pointermove', pointerMove); stage.addEventListener('pointerup', pointerUp); stage.addEventListener('pointercancel', pointerUp); stage.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse') pointerUp(event); });
  return viewer;
}
function fitViewerImage() {
  const viewer = mediaUiState.viewer; if (!viewer?.classList.contains('open')) return;
  const stage = viewer.querySelector('.media-stage'), image = viewer.querySelector('.media-viewer-image'); if (!stage || !image?.naturalWidth || !image?.naturalHeight) return;
  const maxWidth = Math.max(1, stage.clientWidth * VIEWER_MARGIN), maxHeight = Math.max(1, stage.clientHeight * VIEWER_MARGIN), fitRatio = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
  image.style.width = `${Math.max(1, Math.floor(image.naturalWidth * fitRatio))}px`; image.style.height = `${Math.max(1, Math.floor(image.naturalHeight * fitRatio))}px`; image.style.maxWidth = 'none'; image.style.maxHeight = 'none'; resetViewerTransform();
}
function pointerDown(event) {
  const stage = event.currentTarget; stage.setPointerCapture?.(event.pointerId); mediaUiState.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (mediaUiState.pointers.size === 1) mediaUiState.dragStart = { x: event.clientX, y: event.clientY, translateX: mediaUiState.translateX, translateY: mediaUiState.translateY };
  else if (mediaUiState.pointers.size === 2) { mediaUiState.pinchStartDistance = pointerDistance(); mediaUiState.pinchStartScale = mediaUiState.scale; mediaUiState.dragStart = null; }
}
function pointerMove(event) {
  if (!mediaUiState.pointers.has(event.pointerId)) return; mediaUiState.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (mediaUiState.pointers.size === 2 && mediaUiState.pinchStartDistance > 0) { setViewerScale(mediaUiState.pinchStartScale * (pointerDistance() / mediaUiState.pinchStartDistance), false); return; }
  if (mediaUiState.pointers.size === 1 && mediaUiState.scale > 1 && mediaUiState.dragStart) { mediaUiState.translateX = mediaUiState.dragStart.translateX + event.clientX - mediaUiState.dragStart.x; mediaUiState.translateY = mediaUiState.dragStart.translateY + event.clientY - mediaUiState.dragStart.y; applyViewerTransform(); }
}
function pointerUp(event) {
  mediaUiState.pointers.delete(event.pointerId); if (mediaUiState.pointers.size < 2) mediaUiState.pinchStartDistance = 0;
  if (mediaUiState.pointers.size === 1) { const point = [...mediaUiState.pointers.values()][0]; mediaUiState.dragStart = { x: point.x, y: point.y, translateX: mediaUiState.translateX, translateY: mediaUiState.translateY }; }
  else if (!mediaUiState.pointers.size) mediaUiState.dragStart = null;
}
function pointerDistance() { const points = [...mediaUiState.pointers.values()]; return points.length < 2 ? 0 : Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y); }
function setViewerScale(value, recenterWhenFit = true) { mediaUiState.scale = Math.min(6, Math.max(1, value)); if (mediaUiState.scale <= 1.001 && recenterWhenFit) { mediaUiState.translateX = 0; mediaUiState.translateY = 0; } applyViewerTransform(); }
function resetViewerTransform() { mediaUiState.scale = 1; mediaUiState.translateX = 0; mediaUiState.translateY = 0; applyViewerTransform(); }
function applyViewerTransform() {
  const viewer = mediaUiState.viewer, image = viewer?.querySelector('.media-viewer-image'); if (!image) return;
  image.style.transform = `translate(${mediaUiState.translateX}px, ${mediaUiState.translateY}px) scale(${mediaUiState.scale})`;
  const reset = viewer.querySelector('[data-media-reset]'), zoomOut = viewer.querySelector('[data-media-zoom-out]'); if (reset) reset.textContent = mediaUiState.scale === 1 ? 'Reset' : `${Math.round(mediaUiState.scale * 100)}%`; if (zoomOut) zoomOut.disabled = mediaUiState.scale <= 1.001;
}

function youtubeId(url) {
  try { const parsed = new URL(url, location.href), host = parsed.hostname.replace(/^www\./, ''); if (host === 'youtu.be') return parsed.pathname.split('/').filter(Boolean)[0] || ''; if (host.endsWith('youtube.com')) { if (parsed.pathname === '/watch') return parsed.searchParams.get('v') || ''; const match = /^\/(?:shorts|embed)\/([^/?#]+)/.exec(parsed.pathname); return match?.[1] || ''; } }
  catch {} return '';
}
function truncateTitle(text, max) { const value = String(text || '').trim(); return value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`; }
function normalize(value = '') { return String(value).toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim(); }
function escapeHtml(value = '') { return String(value).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]); }
function escapeAttr(value = '') { return escapeHtml(value).replace(/'/g, '&#39;'); }
