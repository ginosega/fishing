    ${uses.length?`<section class="panel"><h3>How to use it</h3>${guidanceHtml(uses)}</section>`:''}
    ${showCatch?renderCatchHistory(item):''}`;
  bindRouteButtons();
}

function renderSetupItem(item) {
  const guidance=setupGuidance(item.type);
  app.innerHTML=`${pageHeader(item.headerTitle,`Rods & Reels - ${item.type}`,'#/inventory/rods-reels')}
    ${setupComponentSection('Rod',item.rod)}
    ${setupComponentSection('Reel',item.reel)}
    ${guidance.length?`<section class="panel"><h3>How to use it</h3>${guidanceHtml(guidance)}</section>`:''}
    <section class="panel"><h3>My catch history</h3><div class="empty">Rod/reel setup was not recorded in the current catch log.</div></section>`;
  bindRouteButtons();
}

function setupComponentSection(title,component) {
  const cells=[
    detailCell('Manufacturer / Model',escapeHtml(component.manufacturerModel||'unknown')),
    detailCell('Specifications',escapeHtml(component.specifications||'unknown')),
    component.links?.length?detailCell('Links',linksHtml(component.links)):''
  ].filter(Boolean).join('');
  return `<section class="panel"><h2 class="subsection-heading">${escapeHtml(title)}</h2><div class="detail-grid">${cells}</div></section>`;
}

function renderKnotItem(item) {
  const uses=knotUsageGuidance(item);
  app.innerHTML=`${pageHeader(item.name,'Knots','#/inventory/knots')}
    <section class="panel"><div class="detail-grid">
      ${detailCell('Description',escapeHtml(item.description||'No description recorded.'))}
      ${detailCell('Links',item.links.length?linksHtml(item.links):'<span class="muted">No links recorded.</span>')}
    </div></section>
    ${uses.length?`<section class="panel"><h3>How to use it</h3>${guidanceHtml(uses)}</section>`:''}`;
  bindRouteButtons();
}

function renderCoreDetails(item) {
  const cells=[];
  if (item.manufacturerModel) cells.push(detailCell('Manufacturer / Model',escapeHtml(item.manufacturerModel)));
  if (item.specifications) cells.push(detailCell('Specifications',escapeHtml(item.specifications)));
  if (item.links?.length) cells.push(detailCell('Links',linksHtml(item.links)));
  return `<div class="detail-grid">${cells.join('')}</div>`;
}

function renderCatchHistory(item) {
  const catches=catchesForItem(item);
  const noun=item.category==='bait'?'bait':'lure';
  return `<section class="panel"><h3>My catch history</h3>${catches.length?catches.map(catchRowHtml).join(''):`<div class="empty">No catches have been recorded with this ${noun}.</div>`}</section>`;
}

function renderKbRecord(encodedId) {
  const id=decodeURIComponent(encodedId||'');
  const record=state.kbRecords.find(r=>r.id===id);
  if (!record) return navigate('#/home');
  app.innerHTML=`${pageHeader(record.name,'',null,true)}<section class="panel"><div class="markdown-snippet">${markdownToHtmlWithKbLinks(record.markdown,record.name)}</div></section>`;
  bindRouteButtons();
}

function listControlPolicy(category,items,types) {
  if (category==='lures') return {search:true,filter:true};
  if (category==='hooks') return {search:false,filter:true};
  if (['bait','knots','weights','snaps-swivels','line','rods-reels'].includes(category)) return {search:false,filter:false};
  return {
    search:items.length>=12,
    filter:types.length>=3 && items.length>=8
  };
}

function itemCardHtml(item) {
  const meta=item.cardMeta||'';
  return `<article class="item-card" data-item-id="${escapeAttr(item.id)}"><h3>${escapeHtml(item.name)}</h3>${meta?`<div class="item-meta"><span>${escapeHtml(meta)}</span></div>`:''}</article>`;
}

function bindItemCards(root=document) {
  root.querySelectorAll('[data-item-id]').forEach(el=>el.addEventListener('click',()=>navigate(`#/inventory/item/${encodeURIComponent(el.dataset.itemId)}`)));
}

function detailCell(label,valueHtml) {
  return `<div class="detail-cell"><div class="label">${escapeHtml(label)}</div><div class="value">${valueHtml}</div></div>`;
}

function linksHtml(links) {
  return `<div class="detail-links">${uniqueLinks(links).map(l=>l.url?`<a href="${escapeAttr(l.url)}" target="_blank" rel="noopener">${escapeHtml(l.label||'Website')} ↗</a>`:`<span class="muted">${escapeHtml(l.label||'Unknown')}</span>`).join('<br>')}</div>`;
}

function guidanceHtml(items) {
  return items.map(item=>`<div class="recommendation">${item.title?`<h4>${escapeHtml(item.title)}</h4>`:''}<div class="guidance-body">${item.html||`<p>${escapeHtml(item.text||'')}</p>`}</div></div>`).join('');
}

function setupGuidance(type) {
  if (type==='Spinning') return [{
    title:'Use spinning gear when:',
    html:`<ul>
      <li>You’re fishing light baits such as wacky worms, drop shots, Ned rigs, small jerkbaits, or inline spinners.</li>
      <li>You need to cast very light lures far.</li>
      <li>You’re fishing clear water and want to use 6–10 lb fluorocarbon for stealth.</li>
      <li>You’re fishing windy conditions, where spinning reels handle wind better and avoid backlash.</li>
      <li>You’re vertical jigging or fishing from a kayak, where easy one-handed control helps.</li>
    </ul>`
  },{
    title:'Typical spinning combo:',
    html:`<ul><li>Rod: Medium-light to medium power, fast action, 6'6"–7'2".</li><li>Reel: 2500–3000 size spinning reel.</li><li>Line: 10–15 lb braid + 6–10 lb fluorocarbon leader.</li></ul>`
  }];
  if (type==='Baitcasting') return [{
    title:'Use baitcasting gear when:',
    html:`<ul>
      <li>You’re throwing heavier lures such as spinnerbaits, chatterbaits, crankbaits, swimbaits, or topwaters.</li>
      <li>You’re fishing thick cover such as weeds, wood, or docks and need to horse fish out.</li>
      <li>You’re targeting larger fish with heavier line: 15+ lb fluorocarbon or 30+ lb braid.</li>
      <li>You need pinpoint casting accuracy, such as skipping under docks or hitting tight shoreline targets.</li>
      <li>You want instant power transfer on hooksets.</li>
    </ul>`
  },{
    title:'Baitcaster Reel Setup & Casting',
    html:`<ul>
      <li>Set the internal line-type dial for mono (M), fluorocarbon (F), or braid/PE (P). This defines the braking range; it does not have to match the line type exactly.</li>
      <li>With a lure attached, hold the rod tip up and press the clutch. Set spool tension so the lure drops at a medium, controlled speed.</li>
      <li>Use W/4 for lightweight lures or wind; 3 or lower for heavier lures and calm conditions.</li>
      <li>Thumb the spool at splashdown to avoid backlash.</li>
    </ul>`
  }];
  const section=findSection('knots','Spincast / shore trout setup');
  return section?[{title:'Best use',html:markdownToHtml(section.content.split('Avoid braid')[0])}]:[];
}

function knotGuidanceForItem(item) {
  if (item.category==='line') return lineKnotGuidance(item.type);
  if (item.category==='snaps-swivels') return snapKnotGuidance(item.type);
  if (item.category==='hooks') return hookKnotGuidance(item);
  if (item.category==='lures') return lureKnotGuidance(item);
  return [];
}

function lineKnotGuidance(type) {
  if (type==='Braided') return [{
    html:`<ul>
      <li>To leader: use an ${kbOrTextLink('FG knot','FG')} or ${kbOrTextLink('Albright knot','Albright')} when you need an easier on-the-water alternative.</li>
      <li>To snap: use a ${kbOrTextLink('Palomar knot','Palomar')}.</li>
      <li>To lure: use a ${kbOrTextLink('Palomar knot','Palomar')} or ${kbOrTextLink('Modified Uni knot','Modified Uni')} for direct topwater applications; otherwise use a leader.</li>
    </ul>`
  }];
  if (type==='Fluorocarbon') return [{
    html:`<ul>
      <li>To swivel or snap: use a ${kbOrTextLink('Trilene knot','Trilene')}.</li>
      <li>To hook: use an ${kbOrTextLink('Improved Clinch knot','Improved Clinch')} or a ${kbOrTextLink('Palomar knot','Palomar')} for heavier tackle.</li>
      <li>To lure: use a snap when more action is desired; otherwise use a ${kbOrTextLink('Palomar knot','Palomar')}.</li>
      <li>Wet fluorocarbon knots before tightening.</li>
    </ul>`
  }];
  return [{
    html:`<ul>
