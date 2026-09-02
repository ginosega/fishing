const LINK_RULES = [
  {
    title: /^River2Sea Whopper Plopper 60$/i,
    manufacturer: 'River2Sea',
    manufacturerUrl: 'https://www.river2seausa.com/product/whopper-plopper-60/',
    allowedRetailers: []
  },
  {
    title: /^Sufix 832$/i,
    manufacturer: 'Sufix',
    manufacturerUrl: 'https://www.rapala.com/us_en/832-advanced-superline?childSku=us-660-115Y',
    allowedRetailers: []
  },
  {
    title: /^Seaguar InvizX$/i,
    specs: /\b8 lb\b/i,
    manufacturer: 'Seaguar',
    manufacturerUrl: 'https://seaguar.com/products/invizx',
    allowedRetailers: ['amazon']
  },
  {
    title: /^Seaguar InvizX$/i,
    specs: /\b12 lb\b/i,
    manufacturer: 'Seaguar',
    manufacturerUrl: 'https://seaguar.com/products/invizx',
    allowedRetailers: ['tackle-warehouse']
  },
  {
    title: /^Cylinder weights$/i,
    manufacturer: 'THKFISH',
    manufacturerUrl: 'https://thkfish.net/products/thkfish-fishing-weights-fishing-sinker-drop-shot-weights-fishing-weights-kit-drop-shot-rig-wacky-hooks-offset-hooks-fishing-tackle-28pcs'
  },
  {
    title: /^(?:Swiveling trolling \/ torpedo weights|Swiveling trolling sinkers)$/i,
    manufacturer: 'Eagle Claw',
    manufacturerUrl: 'https://eagleclaw.com/products/eagle-claw-swiveling-trolling-sinkers'
  },
  {
    title: /^Egg sinkers$/i,
    manufacturer: 'Eagle Claw',
    manufacturerUrl: 'https://eagleclaw.com/products/eagle-claw-egg-sinkers'
  }
];

const MANUFACTURER_HOSTS = new Map(Object.entries({
  '6th Sense': ['6thsensefishing.com'],
  'Acme': ['acmetackle.com'],
  'Berkley': ['berkley-fishing.com'],
  'Booyah': ['shopbooyah.shop', 'booyahbaits.com'],
  'Daiwa': ['daiwa.us'],
  'Dick Nite': ['gibbsfishing.com'],
  'Eagle Claw': ['eagleclaw.com'],
  'Fin-Sanity': ['tacklingthewater.com'],
  'Gamakatsu': ['gamakatsu.com'],
  "Mack's": ['mackslure.com'],
  'Mepps': ['mepps.com', 'store.mepps.com'],
  'Owner': ['ownerhooks.com'],
  'Pflueger': ['pfluegerfishing.com'],
  'PowerPro': ['fishshop.shimano.com'],
  'Rapala': ['rapala.com'],
  'Rebel': ['therebellures.com'],
  'River2Sea': ['river2seausa.com'],
  'Seaguar': ['seaguar.com'],
  'Shimano': ['shimano.com'],
  'Strike King': ['strikeking.com'],
  'Sufix': ['rapala.com'],
  'THKFISH': ['thkfish.net'],
  'Top Brass': ['topbrasstackle.com'],
  'VMC': ['rapala.com'],
  'Yamamoto': ['yamamotobaits.com'],
  'Z-Man': ['zmanfishing.com'],
  'Luhr Jensen': ['rapala.com']
}));

const KNOWN_MANUFACTURERS = [...MANUFACTURER_HOSTS.keys()].sort((a, b) => b.length - a.length);
const linkUiApp = document.querySelector('#app');
let linkUiQueued = false;

if (linkUiApp) new MutationObserver(queueLinkUi).observe(linkUiApp, { childList: true, subtree: true });
window.addEventListener('hashchange', queueLinkUi);
queueLinkUi();

function queueLinkUi() {
  if (linkUiQueued) return;
  linkUiQueued = true;
  requestAnimationFrame(() => {
    linkUiQueued = false;
    normalizeRenderedGearLinks();
  });
}

function normalizeRenderedGearLinks() {
  if (!location.hash.startsWith('#/inventory/item/')) return;
  const title = document.querySelector('.section-title h2')?.textContent?.trim() || '';
  if (!title) return;

  for (const panel of document.querySelectorAll('.panel')) {
    const manufacturerCell = findCell(panel, 'Manufacturer / Model');
    if (!manufacturerCell) continue;
    normalizePanelLinks(panel, title, manufacturerCell);
  }
}

function normalizePanelLinks(panel, title, manufacturerCell) {
  const specs = findCell(panel, 'Specifications')?.querySelector('.value')?.textContent?.trim() || '';
  const rule = LINK_RULES.find(candidate => candidate.title.test(title) && (!candidate.specs || candidate.specs.test(specs)));
  const manufacturerValue = manufacturerCell.querySelector('.value')?.textContent?.trim() || '';
  const manufacturer = rule?.manufacturer || inferKnownManufacturer(manufacturerValue);
  if (!manufacturer) return;

  let linksCell = findCell(panel, 'Links');
  const grid = panel.querySelector('.detail-grid');
  if (!linksCell && grid && rule?.manufacturerUrl) {
    linksCell = document.createElement('div');
    linksCell.className = 'detail-cell';
    linksCell.innerHTML = '<div class="label">Links</div><div class="value"></div>';
    grid.append(linksCell);
  }
  if (!linksCell) return;

  const value = linksCell.querySelector('.value');
  if (!value) return;

  const existing = [...value.querySelectorAll('a[href]')].map(anchor => ({
    url: anchor.href,
    label: anchor.textContent.replace(/\s*↗\s*$/, '').trim()
  }));

  const manufacturerUrl = rule?.manufacturerUrl || findManufacturerUrl(existing, manufacturer);
  const normalized = [];
  if (manufacturerUrl) normalized.push({ label: manufacturer, url: manufacturerUrl, kind: 'manufacturer' });

  for (const link of existing) {
    if (sameUrl(link.url, manufacturerUrl)) continue;
    const retailer = retailerFor(link.url);
    if (retailer) {
      if (rule?.allowedRetailers && !rule.allowedRetailers.includes(retailer.id)) continue;
      normalized.push({ label: retailer.label, url: link.url, kind: 'retailer' });
      continue;
    }
    if (isManufacturerUrl(link.url, manufacturer)) {
      if (!manufacturerUrl) normalized.unshift({ label: manufacturer, url: link.url, kind: 'manufacturer' });
      continue;
    }
    normalized.push({ label: cleanLinkLabel(link.label), url: link.url, kind: 'other' });
  }

  const deduped = dedupeLinks(normalized);
  const html = deduped.length
    ? `<div class="detail-links">${deduped.map(link => `<a href="${escapeAttr(link.url)}" target="_blank" rel="noopener">${escapeHtml(link.label)} ↗</a>`).join('<br>')}</div>`
    : `<span class="muted">${escapeHtml(manufacturer)}</span>`;

  if (value.innerHTML !== html) value.innerHTML = html;
}

function findCell(root, label) {
  const wanted = normalizeText(label);
  return [...root.querySelectorAll('.detail-cell')].find(cell => normalizeText(cell.querySelector('.label')?.textContent) === wanted) || null;
}

function inferKnownManufacturer(value) {
  const normalized = normalizeText(value);
  return KNOWN_MANUFACTURERS.find(name => normalized.startsWith(normalizeText(name))) || '';
}

function findManufacturerUrl(links, manufacturer) {
  return links.find(link => isManufacturerUrl(link.url, manufacturer))?.url ||
    links.find(link => normalizeText(link.label).startsWith(normalizeText(manufacturer)) && !retailerFor(link.url))?.url || '';
}

function isManufacturerUrl(url, manufacturer) {
  const hostname = host(url);
  return (MANUFACTURER_HOSTS.get(manufacturer) || []).some(expected => hostname === expected || hostname.endsWith(`.${expected}`));
}

function retailerFor(url) {
  const hostname = host(url);
  if (hostname === 'a.co' || hostname.endsWith('.amazon.com') || hostname === 'amazon.com') return { id: 'amazon', label: 'Amazon' };
  if (hostname.includes('tacklewarehouse.com')) return { id: 'tackle-warehouse', label: 'Tackle Warehouse' };
  if (hostname.includes('cabelas.com')) return { id: 'cabelas', label: "Cabela's" };
  if (hostname.includes('dickssportinggoods.com')) return { id: 'dicks', label: "Dick's Sporting Goods" };
  if (hostname.includes('walmart.com')) return { id: 'walmart', label: 'Walmart' };
  if (hostname.includes('jdmtackleheaven.com')) return { id: 'jdm-tackle-heaven', label: 'JDM Tackle Heaven' };
  if (hostname.includes('basspro.com')) return { id: 'bass-pro', label: 'Bass Pro Shops' };
  return null;
}

function host(url) {
  try { return new URL(url, location.href).hostname.toLowerCase().replace(/^www\./, ''); }
  catch { return ''; }
}

function sameUrl(a, b) {
  if (!a || !b) return false;
  try {
    const left = new URL(a, location.href), right = new URL(b, location.href);
    left.hash = ''; right.hash = '';
    return left.href === right.href;
  } catch { return a === b; }
}

function cleanLinkLabel(label) {
  return String(label || 'Website').replace(/\s*listing\s*$/i, '').trim() || 'Website';
}

function dedupeLinks(links) {
  const seen = new Set();
  return links.filter(link => {
    const key = `${link.kind}:${link.url}`;
    if (!link.url || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeText(value = '') {
  return String(value).toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]);
}

function escapeAttr(value = '') {
  return escapeHtml(value).replace(/'/g, '&#39;');
}
