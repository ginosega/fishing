  const n=normalize(item.name);
  if (n==='palomar') return [
    {html:`<p>Used for direct ties in the ${kbLinkByName('Wacky worm','Wacky Worm')}, ${kbLinkByName('Ned rig','Ned rig')}, and ${kbLinkByName('Chatterbait / bladed jig','Chatterbait')} techniques.</p>`},
    {html:`<p>Also used for braid to snaps and for many direct lure or hook connections where the current KB calls for a strong terminal knot.</p>`}
  ];
  if (n==='fg') return [{html:`<p>Preferred for connecting ${inventoryCategoryLink('Line','line')} braid to a fluorocarbon leader.</p>`}];
  if (n==='albright') return [{html:`<p>Easier on-the-water alternative for connecting braid to a fluorocarbon leader; see ${inventoryCategoryLink('Line','line')}.</p>`}];
  if (n==='trilene') return [{html:`<p>Used to connect fluorocarbon to ${inventoryCategoryLink('snaps and swivels','snaps-swivels')}.</p>`}];
  if (n==='improved clinch') return [{html:`<p>Used with ${kbLinkByName('Inline spinners','inline spinners')} and for many monofilament/fluorocarbon connections to small hooks, snaps, and swivels.</p>`}];
  if (n==='modified uni') return [{html:`<p>Saved guidance uses this as a direct braid-to-lure option for topwater fishing.</p>`}];
  if (n==='double uni') return [{html:`<p>Used to connect two lines together, though the current KB prefers the FG for braid-to-leader connections; see ${inventoryCategoryLink('Line','Line')}.</p>`}];
  if (n.includes('loop')) return [
    {html:`<p>Some lure guidance, including ${kbLinkByName('Chatterbait / bladed jig','Chatterbait')}, uses a loop knot when extra lure freedom is desired.</p>`},
    {html:`<p><strong>Caution:</strong> the saved knot guidance also says not to use this knot because it is weak. This conflict remains unresolved.</p>`}
  ];
  if (n==='single uni') return [{html:`<p><strong>Caution:</strong> no recommended use is currently recorded; the saved knot guidance marks this knot as weak.</p>`}];
  if (n==='arbor') return [{html:`<p>Used when spooling ${inventoryCategoryLink('fishing line','line')} onto a reel.</p>`}];
  return [];
}

function filteredTechniqueHtml(markdown) {
  const lines=markdown.split('\n');
  const keep=[];
  let skip=false;
  for (const raw of lines) {
    const line=raw.trim();
    if (/^(Gear|Current gear|Rigging):?$/i.test(line)) {skip=true; continue;}
    if (/^(Technique|Use|Colors?|Trailers?|Weight rules?|Leader from hook to weight):?$/i.test(line)) {skip=false; keep.push(`**${line.replace(/:$/,'')}**`); continue;}
    if (skip && !/^[A-Z][A-Za-z /&-]+:$/.test(line)) continue;
    if (/^OneNote linked|^OneNote source resources/i.test(line)) continue;
    if (line) keep.push(raw);
  }
  return markdownToHtml(keep.slice(0,28).join('\n'));
}

function renderPlanBuilder() {
  const saved=readPlanDraft();
  const lureOptions=state.inventory.filter(i=>['lures','bait'].includes(i.category)).sort((a,b)=>a.name.localeCompare(b.name));
  app.innerHTML=`${pageHeader('Build a Fishing Plan','Start anywhere. Every selection adds context and narrows the same plan.','#/home')}
  <section class="plan-form">
    <div class="form-card"><label>📍 Where</label><div class="hint">Location-specific structure and historical notes will be prioritized.</div><select class="input" id="planLocation"><option value="">Not specified</option>${state.locations.map(l=>optionHtml(l.name,saved.location)).join('')}</select></div>
    <div class="form-row"><div class="form-card"><label>📅 Date</label><div class="hint">Used to infer season.</div><input class="input" id="planDate" type="date" value="${escapeAttr(saved.date||todayLocal())}" /></div><div class="form-card"><label>🕓 Time of day</label><div class="hint">Used for morning/midday/evening notes.</div><select class="input" id="planTime">${['','Dawn / early morning','Morning','Midday','Afternoon','Evening / dusk','Night'].map(v=>optionHtml(v||'Not specified',saved.time,v)).join('')}</select></div></div>
    <div class="form-card"><label>🐟 Target species</label><div class="hint">Leave blank if the water or setup should drive the plan.</div><select class="input" id="planSpecies"><option value="">Not specified</option>${SPECIES.map(s=>optionHtml(s,saved.species)).join('')}</select></div>
    <div class="form-card"><label>🎣 Gear setup</label><div class="hint">Choose a current setup if you already know which rod/reel you want.</div><select class="input" id="planSetup"><option value="">Not specified</option>${state.setups.map(s=>optionHtml(s.name,saved.setup)).join('')}</select></div>
    <div class="form-card"><label>🧰 Lure or bait already tied on</label><div class="hint">Optional; this strongly biases the plan toward using that item.</div><select class="input" id="planItem"><option value="">Not specified</option>${lureOptions.map(i=>`<option value="${escapeAttr(i.id)}" ${saved.itemId===i.id?'selected':''}>${escapeHtml(i.name)}${i.type?` — ${escapeHtml(i.type)}`:''}</option>`).join('')}</select></div>
  </section><div class="plan-actions"><button class="primary-button" id="buildPlanButton">Build my fishing plan</button></div>`;
  document.querySelector('#buildPlanButton').addEventListener('click',()=>{
    const draft={location:document.querySelector('#planLocation').value,date:document.querySelector('#planDate').value,time:document.querySelector('#planTime').value,species:document.querySelector('#planSpecies').value,setup:document.querySelector('#planSetup').value,itemId:document.querySelector('#planItem').value};
    localStorage.setItem('fishing-plan-draft',JSON.stringify(draft));
    state.currentPlan=buildPlan(draft);
    navigate('#/plan/result');
  });
}

function renderPlanResult() {
  const plan=state.currentPlan||buildPlan(readPlanDraft()); state.currentPlan=plan;
  const c=plan.context; const title=[c.location,c.species,c.time].filter(Boolean).join(' · ')||'Fishing Plan';
  app.innerHTML=`<div class="plan-header"><button class="back-button" data-route="#/plan">← Adjust plan</button><h2>${escapeHtml(title)}</h2><p>${escapeHtml(plan.contextSummary)}</p></div>
  <section class="panel"><h3>Where to fish</h3>${plan.where.length?`<span class="badge inference">🧭 App inference</span><ul>${plan.where.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul>`:'<div class="empty">Choose a location for structure-specific targets.</div>'}</section>
  <section class="panel"><h3>Gear, lures & bait</h3>${plan.setup?`<div class="recommendation"><span class="badge inference">🎣 App inference</span><h4>${escapeHtml(plan.setup.name)}</h4><p>${escapeHtml(setupSummary(plan.setup))}</p></div>`:''}${plan.items.length?plan.items.map(x=>`<div class="recommendation"><span class="badge inference">🧰 App inference</span><h4>${escapeHtml(x.item.name)}</h4><p>${escapeHtml(x.reason)}</p><button class="secondary-button" data-item-open="${escapeAttr(x.item.id)}">Open item</button></div>`).join(''):'<div class="empty">Add a species, location, or lure for owned-tackle recommendations.</div>'}</section>
  <section class="panel"><h3>Rig & knots</h3>${plan.knots.length?guidanceHtml(plan.knots):'<div class="empty">No explicit knot guidance could be derived for this combination.</div>'}</section>
  <section class="panel"><h3>Techniques</h3>${plan.techniques.length?plan.techniques.map(t=>`<div class="recommendation"><span class="badge inference">🧠 App inference</span><h4>${escapeHtml(t.technique.name)}</h4><div class="markdown-snippet">${markdownExcerpt(t.technique.markdown)}</div></div>`).join(''):'<div class="empty">Add more context to rank techniques.</div>'}</section>
  <section class="panel"><h3>Species in this context</h3>${plan.species.length?`<ul>${plan.species.map(s=>`<li>${escapeHtml(titleCase(s))}</li>`).join('')}</ul>`:'<div class="empty">No species inferred.</div>'}</section>
  <section class="panel"><h3>Similar results from my catch log</h3>${plan.history.length?plan.history.map(h=>`<div class="recommendation"><span class="badge observed">✓ User observed</span>${catchRowHtml(h.row)}<div class="score">Similarity score ${h.score}</div></div>`).join(''):'<div class="empty">No sufficiently similar logged catches yet.</div>'}</section>
  <section class="panel"><h3>How this plan was assembled</h3><p><span class="badge">📚 Curated KB</span> is directly sourced from Markdown. <span class="badge observed">✓ User observed</span> is catch-log evidence. <span class="badge inference">🧠 App inference</span> is deterministic ranking/combination of existing knowledge, not a new historical fact.</p></section>`;
  bindRouteButtons();
  document.querySelectorAll('[data-item-open]').forEach(b=>b.addEventListener('click',()=>navigate(`#/inventory/item/${encodeURIComponent(b.dataset.itemOpen)}`)));
}

function buildPlan(context) {
  const location=state.locations.find(l=>l.name===context.location), selectedItem=state.inventory.find(i=>i.id===context.itemId), selectedSetup=state.setups.find(s=>s.name===context.setup), season=seasonForDate(context.date), locationText=normalize(location?.text||''), speciesTerms=speciesAliases(context.species);
  const techniques=state.techniques.map(technique=>{ const text=normalize(`${technique.name} ${technique.text}`); let score=0; if(context.species&&speciesTerms.some(t=>text.includes(t)))score+=5; if(context.species?.toLowerCase().includes('bass')&&text.includes('bass'))score+=2; if(location&&techniqueMentioned(locationText,technique.name))score+=6; if(selectedItem&&textMatchesItem(text,selectedItem))score+=8; if(selectedSetup&&text.includes(normalize(selectedSetup.name).split(' ')[0]))score+=2; if(season&&text.includes(season))score+=1; return {technique,score}; }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,5);
  let setup=selectedSetup;
  if(!setup&&techniques.length){const combined=normalize(techniques.map(t=>t.technique.text).join(' ')); const spinning=countOccurrences(combined,'spinning'), bait=countOccurrences(combined,'baitcast'); setup=state.setups.find(s=>normalize(s.name).includes(spinning>=bait?'spinning':'baitcasting'));}
  const items=state.inventory.filter(i=>['lures','bait'].includes(i.category)).map(item=>{let score=0;const reasons=[];if(selectedItem?.id===item.id){score+=100;reasons.push('already selected');}if(location&&textMatchesItem(locationText,item)){score+=7;reasons.push(`named in ${location.name} notes`);}for(const t of techniques){if(textMatchesItem(normalize(t.technique.text),item)){score+=5;reasons.push(`used with ${t.technique.name}`);}if(normalize(item.type).includes(normalize(t.technique.name))){score+=3;reasons.push(`matches ${t.technique.name}`);}}return {item,score,reasons:[...new Set(reasons)]};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,8).map(x=>({item:x.item,reason:x.reasons.join('; ')||'Matches selected context.'}));
  const primary=selectedItem||items[0]?.item;
  const where=location?extractStructureTargets(location.markdown,context.time).slice(0,8):[];
  const history=scoreCatchHistory(context,selectedItem).slice(0,5);
  const species=inferSpecies(location?.text||techniques.map(t=>t.technique.text).join(' '),context.species);
  const bits=[context.location,context.date?`${season} ${context.date}`.trim():'',context.time,context.species?`targeting ${context.species}`:'',selectedItem?`starting with ${selectedItem.name}`:''].filter(Boolean);
  return {context,contextSummary:bits.join(' · ')||'Broad knowledge-base plan',where,setup,items,knots:planKnotGuidance(setup,primary,techniques.map(t=>t.technique)),techniques,species,history};
}

function planKnotGuidance(setup,item,techniques) {
  const out=[];
  if(setup){
    const text=normalize(setup.text);
    const row=state.braidLeaderRows.find(r=>{const s=normalize(valueByHeader(r,'Setup'));return(text.includes('15 lb')&&s.includes('15 lb'))||(text.includes('30 lb')&&s.includes('30 lb'));});
    if(row)out.push({title:'Main line → leader',text:`${cleanMarkdown(valueByHeader(row,'Preferred knot'))} preferred; ${cleanMarkdown(valueByHeader(row,'Easier field knot'))} is the easier field alternative. ${cleanMarkdown(valueByHeader(row,'Notes'))}`});
  }
  if(item)out.push(...knotGuidanceForItem(item).slice(0,2));
  const explicit=extractKnotSentences(techniques.map(t=>t.text).join('\n')); explicit.slice(0,2).forEach(text=>out.push({title:'Technique-specific knot note',text}));
  return dedupeGuidance(out);
}

function catchesForItem(item) {
  return state.catches.filter(r=>textMatchesItem(normalize(valueByHeader(r,'Gear used')),item));
}

function scoreCatchHistory(context,item) {
  const terms=speciesAliases(context.species),month=context.date?.slice(5,7);
  return state.catches.map(row=>{let score=0;const water=normalize(valueByHeader(row,'Water')),result=normalize(valueByHeader(row,'Results')),conditions=normalize(valueByHeader(row,'Conditions'));if(context.location&&water.includes(normalize(context.location).replace(/ wa$/,'')))score+=8;if(context.species&&terms.some(t=>result.includes(t)))score+=7;if(item&&textMatchesItem(normalize(valueByHeader(row,'Gear used')),item))score+=8;if(month&&valueByHeader(row,'Date')?.slice(5,7)===month)score+=2;if(context.time&&conditions.includes(normalize(context.time).split(' ')[0]))score+=1;return{row,score};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
}

function extractStructureTargets(markdown,time) {
  const tw=normalize(time||'').split(' ')[0];
  const rows=markdown.split('\n').map(x=>x.trim()).filter(x=>/^[-*]\s+/.test(x)).map(line=>{const text=cleanMarkdown(line.replace(/^[-*]\s+/,'')),norm=normalize(text);let score=STRUCTURE_TERMS.reduce((n,t)=>n+(norm.includes(t)?1:0),0);if(tw&&norm.includes(tw))score+=2;if(/launch:|caught|source/i.test(text))score-=2;return{text,score};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
  return [...new Map(rows.map(x=>[normalize(x.text),x.text])).values()];
}

function inferSpecies(text,selected) {
  const norm=normalize(text),out=[];
  if(selected)out.push(selected.toLowerCase());
  FISH_TERMS.forEach(f=>{if(norm.includes(normalize(f)))out.push(f);});
  return [...new Set(out)].slice(0,8);
}

function techniqueMentioned(text,name) {
  const n=normalize(name);
  if(text.includes(n))return true;
  const words=n.split(' ').filter(w=>w.length>3);
  return words.length&&words.every(w=>text.includes(w));
}

function speciesAliases(s) {
  s=normalize(s||'');
  if(!s)return[];
  if(s.includes('largemouth'))return['largemouth','bass'];
  if(s.includes('smallmouth'))return['smallmouth','bass'];
  if(s.includes('cutthroat'))return['cutthroat','trout'];
  if(s.includes('rainbow'))return['rainbow','trout'];
  if(s==='trout')return['trout','rainbow','cutthroat'];
  return[s];
}

function setupSummary(setup) {
  const t=setup.tables?.[0];
  if(t?.rows?.length)return t.rows.map(r=>`${cleanMarkdown(valueByHeader(r,'Component'))}: ${cleanMarkdown(valueByHeader(r,'Details'))}`).filter(Boolean).slice(0,5).join(' · ');
  return setup.text.slice(0,420);
}

function catchRowHtml(row) {
  const date=cleanMarkdown(valueByHeader(row,'Date')),water=cleanMarkdown(valueByHeader(row,'Water')),result=cleanMarkdown(valueByHeader(row,'Results')),gear=cleanMarkdown(valueByHeader(row,'Gear used')),conditions=cleanMarkdown(valueByHeader(row,'Conditions'));
  return`<div class="recommendation"><h4>${escapeHtml(result||'Logged outing')}</h4><p><strong>${escapeHtml(water)}</strong>${date?` · ${escapeHtml(date)}`:''}</p><p>${escapeHtml(gear)}${conditions?` · ${escapeHtml(conditions)}`:''}</p></div>`;
}

function pageHeader(title,subtitle='',back='#/home',historyBack=false) {
  return `<div class="section-title"><div><h2>${escapeHtml(title)}</h2>${subtitle?`<p>${escapeHtml(subtitle)}</p>`:''}</div>${historyBack?'<button class="back-button" data-history-back>← Back</button>':back?`<button class="back-button" data-route="${escapeAttr(back)}">← Back</button>`:''}</div>`;
}

