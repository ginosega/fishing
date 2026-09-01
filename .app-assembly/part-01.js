const SOURCE_FILES = {
  gear: './kb/Fishing_Gear_Registry.md',
  tackle: './kb/Fishing_Tackle_Inventory.md',
  knots: './kb/Rods_Reels_Line_Knots.md',
  techniques: './kb/Fishing_Techniques.md',
  locations: './kb/Local_Waters_Locations.md',
  catches: './kb/Trip_Logs_Field_Observations.md'
};

const CATEGORY_META = {
  'rods-reels': { label: 'Rods & Reels', icon: '🎣' },
  line: { label: 'Line', icon: '〰️' },
  weights: { label: 'Weights', icon: '⚓' },
  'snaps-swivels': { label: 'Snaps & Swivels', icon: '🔗' },
  hooks: { label: 'Hooks', icon: '🪝' },
  lures: { label: 'Lures', icon: '🐟' },
  bait: { label: 'Bait', icon: '🪱' },
  knots: { label: 'Knots', icon: '🪢' }
};

const SPECIES = ['Largemouth bass','Smallmouth bass','Trout','Coastal cutthroat trout','Rainbow trout','Kokanee','Yellow perch','Northern pikeminnow','Panfish'];
const FISH_TERMS = ['largemouth bass','smallmouth bass','bass','coastal cutthroat trout','cutthroat trout','rainbow trout','trout','kokanee','yellow perch','perch','northern pikeminnow','pikeminnow','panfish','tiger muskie','bullhead'];
const STRUCTURE_TERMS = ['point','weed','dock','bench','flat','drop','drop-off','rock','rocky','shelf','shoreline','bank','cove','edge','riprap','break','structure','transition','channel','mouth','wood','cover','grass'];

const state = {
  docs:{}, sections:{}, tables:{}, inventory:[], catches:[], locations:[], techniques:[],
  setups:[], braidLeaderRows:[], connectionRows:[], kbRecords:[], currentPlan:null
};

const app = document.querySelector('#app');
const homeButton = document.querySelector('#homeButton');
const statusDot = document.querySelector('#onlineStatus');
const copyrightFooter = document.querySelector('#copyrightFooter');

homeButton.addEventListener('click', () => navigate('#/home'));
window.addEventListener('hashchange', renderRoute);
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

boot().catch(error => {
  console.error(error);
  app.innerHTML = `<section class="panel error"><h2>Couldn’t load the fishing knowledge base</h2><p>${escapeHtml(error.message)}</p><p>The app needs the deployed <code>kb/</code> Markdown files at least once so they can be cached for offline use.</p></section>`;
});

async function boot() {
  updateOnlineStatus();
  await loadKnowledgeBase();
  buildModels();
  registerServiceWorker();
  copyrightFooter.textContent = `© ${new Date().getFullYear()} Gino Sega`;
  if (!location.hash) location.hash = '#/home';
  renderRoute();
}

async function loadKnowledgeBase() {
  const entries = await Promise.all(Object.entries(SOURCE_FILES).map(async ([key,url]) => {
    const response = await fetch(url, { cache:'no-cache' });
    if (!response.ok) throw new Error(`Failed to load ${url} (${response.status})`);
    return [key, await response.text()];
  }));
  state.docs = Object.fromEntries(entries);
  for (const [key,markdown] of Object.entries(state.docs)) {
    state.sections[key] = parseSections(markdown, key);
    state.tables[key] = parseTables(markdown, state.sections[key], key);
  }
}

function buildModels() {
  state.catches = buildCatchLog();
  state.locations = state.sections.locations
    .filter(s => s.level===2 && !/other local|regulation\/access/i.test(s.title))
    .map(s => ({name:s.title, markdown:s.content, text:cleanMarkdown(s.content), sourceSection:s.path.join(' › ')}));

  state.kbRecords = buildKnowledgeBaseRecords();
  const parents = ['trout fishing','bass finesse techniques','bass power search techniques'];
  state.techniques = state.kbRecords
    .filter(r => r.kind==='technique' && r.level===3 && parents.some(p => r.path.map(normalize).includes(p)))
    .map(r => ({name:r.name, markdown:r.markdown, text:r.text, sourceSection:r.sourceSection}));

  const setupItems = buildSetupInventory();
  state.setups = setupItems.map(item => ({
    name: item.type,
    markdown: item.setupMarkdown,
    text: cleanMarkdown(item.setupMarkdown),
    tables: item.setupTables,
    sourceSection: item.sourceSection
  }));

  const items = [
    ...setupItems,
    ...buildLineInventory(),
    ...buildTackleInventory(),
    ...buildKnotInventory()
  ];
  state.inventory = items.map(item => ({...item, id:item.id || stableItemId(item)}));

  state.braidLeaderRows = tableRowsInSection('knots','Braid-to-leader knots');
  state.connectionRows = tableRowsInSection('knots','Direct tie / snap / swivel guidance');
}

function buildKnowledgeBaseRecords() {
  const records = [];
  for (const section of state.sections.techniques) {
    if (section.level < 2 || /todo finesse pages/i.test(section.title)) continue;
    if (section.level===2 && normalize(section.title)!=='trout fishing') continue;
    if (section.level>3) continue;
    const isSlipSinker = normalize(section.title)==='still fishing' || normalize(section.title)==='slip sinker rig';
    const name = isSlipSinker ? 'Slip sinker rig' : section.title;
    records.push({
      id: slug(`kb-${name}`), kind:'technique', name, aliases:isSlipSinker?['Still fishing']:[], level:section.level, path:section.path,
      markdown:section.content, text:cleanMarkdown(section.content),
      sourceSection:`Fishing Techniques › ${section.path.join(' › ')}`
    });
  }
  return dedupeBy(records, r => normalize(r.name));
}

function buildSetupInventory() {
  const setupDefs = [
    {section:'Spinning setup', type:'Spinning'},
    {section:'Baitcasting setup', type:'Baitcasting'},
    {section:'Spincast / shore trout setup', type:'Spincasting'}
  ];
  return setupDefs.map(def => {
    const section = findSection('knots', def.section);
    const tables = section ? state.tables.knots.filter(t => t.startLine>=section.startLine && t.startLine<=section.endLine) : [];
    const table = tables.find(t => t.headers.some(h => normalize(h)==='component'));
    const rows = table?.rows || [];
    const rod = buildSetupComponent(rows.find(r => normalize(valueByHeader(r,'Component'))==='rod'), 'rod', def.type);
    const reel = buildSetupComponent(rows.find(r => normalize(valueByHeader(r,'Component'))==='reel'), 'reel', def.type);
    const mainLine = rows.find(r => /main line/i.test(valueByHeader(r,'Component')));
    const leader = rows.find(r => normalize(valueByHeader(r,'Component'))==='leader');
    const displayRod = rod.displayName || 'unknown';
    const displayReel = reel.displayName || 'unknown';
    const header = `Rod: ${displayRod}, Reel: ${displayReel}`;
    return {
      category:'rods-reels', type:def.type, subcategory:def.type,
      name: `${displayRod} + ${displayReel}`,
      headerTitle: header,
      cardMeta: header,
      rod, reel,
      mainLine: mainLine ? cleanMarkdown(valueByHeader(mainLine,'Details')) : '',
      leader: leader ? cleanMarkdown(valueByHeader(leader,'Details')) : '',
      fields:{},
      links: uniqueLinks([...(rod.links||[]), ...(reel.links||[])]),
      sourceSection: section?.path.join(' › ') || 'Rods, Reels, Line, and Knots',
      setupMarkdown: section?.content || '',
      setupTables: tables
    };
  });
}
