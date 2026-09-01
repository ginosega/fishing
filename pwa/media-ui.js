const MEDIA_DATA_URL = './gear-media.json';
const VIDEO_TITLES_URL = './video-titles.json';
const MAX_VIDEO_TITLE = 76;

const mediaUiState = {
  media: [],
  videoTitles: {},
  enhanceQueued: false,
  viewer: null,
  scale: 1,
  translateX: 0,
  translateY: 0,
  pointers: new Map(),
  pinchStartDistance: 0,
  pinchStartScale: 1,
  dragStart: null
};

const mediaUiApp = document.querySelector('#app');

Promise.all([
  fetchJson(MEDIA_DATA_URL, []),
  fetchJson(VIDEO_TITLES_URL, {})
]).then(([media, titles]) => {
  mediaUiState.media = Array.isArray(media) ? media : (media?.items || []);
  mediaUiState.videoTitles = titles || {};
  queueEnhance();
}).catch(error => console.warn('Fishing Companion media enhancement unavailable:', error));

if (mediaUiApp) {
  new MutationObserver(queueEnhance).observe(mediaUiApp, { childList: true, subtree: true });
}
window.addEventListener('hashchange', queueEnhance);

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && mediaUiState.viewer?.classList.contains('open')) closeViewer();
});

async function fetchJson(url, fallback) {
  try {
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) return fallback;
    return await response.json();
  } catch {
    return fallback;
  }
}

function queueEnhance() {
  if (mediaUiState.enhanceQueued) return;
  mediaUiState.enhanceQueued = true;
  requestAnimationFrame(() => {
    mediaUiState.enhanceQueued = false;
    enhanceRenderedPage();
  });
}

function enhanceRenderedPage() {
  enhanceVideoLinks(document);
  if (!location.hash.startsWith('#/inventory/item/')) return;

  const title = document.querySelector('.section-title h2')?.textContent?.trim() || '';
  const subtitle = document.querySelector('.section-title p')?.textContent?.trim() || '';
  if (!title) return;

  applyAcceptanceCorrections(title, subtitle);
  if (/^knots$/i.test(subtitle)) return;

  if (/^rods & reels\s*-/i.test(subtitle)) {
    enhanceRodReelSections();
    return;
  }
  enhanceStandardGearLeaf(title);
}

function applyAcceptanceCorrections(title, subtitle) {
  if (/^rods & reels\s*-/i.test(subtitle)) {
    for (const panel of document.querySelectorAll('.panel')) {
      if (normalize(panel.querySelector('h3')?.textContent) !== 'my catch history') continue;
      const empty = panel.querySelector('.empty');
      if (empty && empty.textContent.trim() !== 'No catches have been recorded with this rod & reel.') {
        empty.textContent = 'No catches have been recorded with this rod & reel.';
      }
    }
  }

  if (normalize(title) === 'cylinder weights') {
    const manufacturerCell = findDetailCell('Manufacturer / Model');
    const value = manufacturerCell?.querySelector('.value');
    if (value && value.textContent.trim() !== 'THKFISH / 28 pcs sinkers set') {
      value.textContent = 'THKFISH / 28 pcs sinkers set';
    }
  }

  if (normalize(title) === 'trilene') {
    for (const anchor of document.querySelectorAll('a[href*="#/inventory/snaps-swivels"]')) {
      if (normalize(anchor.textContent) === 'snaps and swivels') {
        anchor.replaceWith(document.createTextNode(anchor.textContent));
      }
    }
  }
}

function enhanceVideoLinks(root) {
  for (const anchor of root.querySelectorAll('a[href]')) {
    const id = youtubeId(anchor.href);
    if (!id) continue;
    const preferred = id === 'MQ9sCXQNGMI'
      ? 'How to tie the Trilene knot'
      : mediaUiState.videoTitles[id]?.title || mediaUiState.videoTitles[id] || '';
    if (!preferred) continue;
    const display = truncateTitle(preferred, MAX_VIDEO_TITLE);
    const desired = `${display} ↗`;
    if (anchor.textContent.trim() !== desired) anchor.textContent = desired;
    anchor.title = preferred;
    anchor.setAttribute('aria-label', `${preferred} (opens video)`);
  }
}

function enhanceStandardGearLeaf(title) {
  const media = findMedia(title);
  if (!media?.asset) return;
  const firstPanel = [...document.querySelectorAll('.panel')].find(panel => panel.querySelector('.detail-grid'));
  if (!firstPanel || firstPanel.querySelector('.gear-media-button')) return;
  attachMediaToPanel(firstPanel, media, title);
}

function enhanceRodReelSections() {
  for (const panel of document.querySelectorAll('.panel')) {
    const heading = panel.querySelector('h2.subsection-heading');
    if (!heading || !/^(rod|reel)$/i.test(heading.textContent.trim())) continue;
    if (panel.querySelector('.gear-media-button')) continue;
    const manufacturerCell = [...panel.querySelectorAll('.detail-cell')].find(cell =>
      normalize(cell.querySelector('.label')?.textContent) === 'manufacturer model'
    );
    const identity = manufacturerCell?.querySelector('.value')?.textContent?.trim() || '';
    if (!identity || normalize(identity) === 'unknown') continue;
    const media = findMedia(identity);
    if (!media?.asset) continue;
    attachMediaToPanel(panel, media, identity);
  }
}

function attachMediaToPanel(panel, media, label) {
  const detailGrid = panel.querySelector('.detail-grid');
  if (!detailGrid) return;
  const layout = document.createElement('div');
  layout.className = 'gear-detail-layout';
  detailGrid.replaceWith(layout);
  layout.append(createMediaButton(media, label), detailGrid);
}

function createMediaButton(media, label) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'gear-media-button';
  button.setAttribute('aria-label', `Enlarge image of ${media.alt || label}`);

  const image = document.createElement('img');
  image.src = media.asset;
  image.alt = media.alt || label;
  image.loading = 'eager';
  image.decoding = 'async';

  const hint = document.createElement('span');
  hint.className = 'gear-media-hint';
  hint.textContent = 'Tap to enlarge';

  button.append(image, hint);
  button.addEventListener('click', () => openViewer(media));
  return button;
}

function findMedia(text) {
  const target = normalize(text);
  if (!target) return null;
  const candidates = mediaUiState.media.map(item => {
    let score = 0;
    for (const alias of item.aliases || []) {
      const a = normalize(alias);
      if (!a) continue;
      if (target === a) score = Math.max(score, 1000 + a.length);
      else if (target.includes(a) || a.includes(target)) score = Math.max(score, 500 + Math.min(a.length, target.length));
    }
    return { item, score };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);
  return candidates[0]?.item || null;
}

function findDetailCell(label) {
  const wanted = normalize(label);
  return [...document.querySelectorAll('.detail-cell')].find(cell =>
    normalize(cell.querySelector('.label')?.textContent) === wanted
  );
}

function openViewer(media) {
  const viewer = ensureViewer();
  const image = viewer.querySelector('.media-viewer-image');
  const title = viewer.querySelector('.media-viewer-title');
  const product = viewer.querySelector('.media-product-link');

  image.src = media.asset;
  image.alt = media.alt || 'Gear image';
  title.textContent = media.alt || 'Gear image';
  product.href = media.destination || media.sourcePage || '#';
  product.hidden = !(media.destination || media.sourcePage);
  resetViewerTransform();
  viewer.classList.add('open');
  viewer.setAttribute('aria-hidden', 'false');
  document.body.classList.add('media-viewer-open');
  viewer.querySelector('.media-close-button').focus({ preventScroll: true });
}

function closeViewer() {
  const viewer = mediaUiState.viewer;
  if (!viewer) return;
  viewer.classList.remove('open');
  viewer.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('media-viewer-open');
  mediaUiState.pointers.clear();
}

function ensureViewer() {
  if (mediaUiState.viewer) return mediaUiState.viewer;

  const viewer = document.createElement('div');
  viewer.className = 'media-modal';
  viewer.setAttribute('role', 'dialog');
  viewer.setAttribute('aria-modal', 'true');
  viewer.setAttribute('aria-hidden', 'true');
  viewer.innerHTML = `
    <div class="media-dialog">
      <div class="media-viewer-header">
        <div class="media-viewer-title"></div>
        <button class="media-icon-button media-close-button" type="button" aria-label="Close image viewer">✕</button>
      </div>
      <div class="media-stage" aria-label="Zoomable gear image">
        <img class="media-viewer-image" alt="" draggable="false" />
      </div>
      <div class="media-toolbar" aria-label="Image controls">
        <button class="media-icon-button" type="button" data-media-zoom-out aria-label="Zoom out">−</button>
        <button class="media-reset-button" type="button" data-media-reset>Reset</button>
        <button class="media-icon-button" type="button" data-media-zoom-in aria-label="Zoom in">+</button>
        <a class="media-product-link" target="_blank" rel="noopener">🌐 Product page ↗</a>
      </div>
    </div>`;
  document.body.append(viewer);
  mediaUiState.viewer = viewer;

  viewer.querySelector('.media-close-button').addEventListener('click', closeViewer);
  viewer.querySelector('[data-media-zoom-in]').addEventListener('click', () => setViewerScale(mediaUiState.scale * 1.35));
  viewer.querySelector('[data-media-zoom-out]').addEventListener('click', () => setViewerScale(mediaUiState.scale / 1.35));
  viewer.querySelector('[data-media-reset]').addEventListener('click', resetViewerTransform);
  viewer.addEventListener('click', event => {
    if (event.target === viewer) closeViewer();
  });

  const stage = viewer.querySelector('.media-stage');
  stage.addEventListener('wheel', event => {
    event.preventDefault();
    setViewerScale(mediaUiState.scale * (event.deltaY < 0 ? 1.12 : 0.89));
  }, { passive: false });
  stage.addEventListener('pointerdown', pointerDown);
  stage.addEventListener('pointermove', pointerMove);
  stage.addEventListener('pointerup', pointerUp);
  stage.addEventListener('pointercancel', pointerUp);
  stage.addEventListener('pointerleave', event => {
    if (event.pointerType === 'mouse') pointerUp(event);
  });

  return viewer;
}

function pointerDown(event) {
  const stage = event.currentTarget;
  stage.setPointerCapture?.(event.pointerId);
  mediaUiState.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (mediaUiState.pointers.size === 1) {
    mediaUiState.dragStart = {
      x: event.clientX,
      y: event.clientY,
      translateX: mediaUiState.translateX,
      translateY: mediaUiState.translateY
    };
  } else if (mediaUiState.pointers.size === 2) {
    mediaUiState.pinchStartDistance = pointerDistance();
    mediaUiState.pinchStartScale = mediaUiState.scale;
    mediaUiState.dragStart = null;
  }
}

function pointerMove(event) {
  if (!mediaUiState.pointers.has(event.pointerId)) return;
  mediaUiState.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (mediaUiState.pointers.size === 2 && mediaUiState.pinchStartDistance > 0) {
    const ratio = pointerDistance() / mediaUiState.pinchStartDistance;
    setViewerScale(mediaUiState.pinchStartScale * ratio, false);
    return;
  }
  if (mediaUiState.pointers.size === 1 && mediaUiState.scale > 1 && mediaUiState.dragStart) {
    mediaUiState.translateX = mediaUiState.dragStart.translateX + event.clientX - mediaUiState.dragStart.x;
    mediaUiState.translateY = mediaUiState.dragStart.translateY + event.clientY - mediaUiState.dragStart.y;
    applyViewerTransform();
  }
}

function pointerUp(event) {
  mediaUiState.pointers.delete(event.pointerId);
  if (mediaUiState.pointers.size < 2) mediaUiState.pinchStartDistance = 0;
  if (mediaUiState.pointers.size === 1) {
    const point = [...mediaUiState.pointers.values()][0];
    mediaUiState.dragStart = {
      x: point.x,
      y: point.y,
      translateX: mediaUiState.translateX,
      translateY: mediaUiState.translateY
    };
  } else if (!mediaUiState.pointers.size) {
    mediaUiState.dragStart = null;
  }
}

function pointerDistance() {
  const points = [...mediaUiState.pointers.values()];
  if (points.length < 2) return 0;
  return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
}

function setViewerScale(value, recenterWhenFit = true) {
  mediaUiState.scale = Math.min(6, Math.max(1, value));
  if (mediaUiState.scale <= 1.001 && recenterWhenFit) {
    mediaUiState.translateX = 0;
    mediaUiState.translateY = 0;
  }
  applyViewerTransform();
}

function resetViewerTransform() {
  mediaUiState.scale = 1;
  mediaUiState.translateX = 0;
  mediaUiState.translateY = 0;
  applyViewerTransform();
}

function applyViewerTransform() {
  const image = mediaUiState.viewer?.querySelector('.media-viewer-image');
  if (!image) return;
  image.style.transform = `translate(${mediaUiState.translateX}px, ${mediaUiState.translateY}px) scale(${mediaUiState.scale})`;
  const reset = mediaUiState.viewer.querySelector('[data-media-reset]');
  reset.textContent = mediaUiState.scale === 1 ? 'Reset' : `${Math.round(mediaUiState.scale * 100)}%`;
}

function youtubeId(url) {
  try {
    const parsed = new URL(url, location.href);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return parsed.pathname.split('/').filter(Boolean)[0] || '';
    if (host.endsWith('youtube.com')) {
      if (parsed.pathname === '/watch') return parsed.searchParams.get('v') || '';
      const match = /^\/(?:shorts|embed)\/([^/?#]+)/.exec(parsed.pathname);
      return match?.[1] || '';
    }
  } catch {}
  return '';
}

function truncateTitle(text, max) {
  const value = String(text || '').trim();
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

function normalize(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
