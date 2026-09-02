const app = document.querySelector('#app');
const homeButton = document.querySelector('#homeButton');
const statusDot = document.querySelector('#onlineStatus');
const copyrightFooter = document.querySelector('#copyrightFooter');
const versionQuery = new URL(import.meta.url).search;
let legacyPromise = null;

homeButton?.addEventListener('click', () => {
  location.hash = '#/home';
  window.scrollTo({ top:0, behavior:'smooth' });
});

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
window.addEventListener('hashchange', () => {
  if (!isGearRoute()) ensureLegacyApp();
});

updateOnlineStatus();
if (copyrightFooter) copyrightFooter.textContent = `© ${new Date().getFullYear()} Gino Sega`;
registerServiceWorker();
if (!isGearRoute()) ensureLegacyApp();

function isGearRoute() {
  return (location.hash || '').startsWith('#/inventory');
}

function ensureLegacyApp() {
  if (legacyPromise || isGearRoute()) return legacyPromise;
  if (app?.dataset.gearV2Root === 'true') {
    delete app.dataset.gearV2Root;
    app.innerHTML = '<section class="loading-card"><div class="spinner" aria-hidden="true"></div><p>Loading your fishing knowledge…</p></section>';
  }
  legacyPromise = import(`./app.js${versionQuery}`).catch(error => {
    legacyPromise = null;
    console.error(error);
    if (app) app.innerHTML = `<section class="panel error"><h2>Couldn’t load the fishing knowledge base</h2><p>${escapeHtml(error.message)}</p></section>`;
  });
  return legacyPromise;
}

function updateOnlineStatus() {
  if (!statusDot) return;
  const offline = !navigator.onLine;
  statusDot.classList.toggle('offline', offline);
  statusDot.title = offline ? 'Offline' : 'Online';
  statusDot.setAttribute('aria-label', offline ? 'Offline' : 'Online');
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(error => console.warn('Service worker registration failed:', error));
}

function escapeHtml(value='') {
  return String(value).replace(/[&<>\"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[char]));
}
