      <li>To swivel or snap: use an ${kbOrTextLink('Improved Clinch knot','Improved Clinch')}.</li>
      <li>To hook: use an ${kbOrTextLink('Improved Clinch knot','Improved Clinch')} or a ${kbOrTextLink('Palomar knot','Palomar')} for heavier tackle.</li>
      <li>To lure: use a snap when more action is desired; otherwise use a ${kbOrTextLink('Palomar knot','Palomar')}.</li>
    </ul>`
  }];
}

function snapKnotGuidance(type) {
  if (type==='Swivels') return [{html:`<p>Use a ${kbOrTextLink('Trilene knot','Trilene')} when using a swivel on a fluorocarbon line.</p>`}];
  if (type==='Snaps') return [{html:`<p>Use a ${kbOrTextLink('Trilene knot','Trilene')} when using a snap on a fluorocarbon line.</p>`}];
  return [{html:`<p>When fluorocarbon is tied to the swivel end, use a ${kbOrTextLink('Trilene knot','Trilene')}.</p>`}];
}

function hookKnotGuidance(item) {
  const n=normalize(item.name);
  if (/octopus hook|weedless wacky neko|crossover rings/.test(n)) return [{
    html:`<p>When using with a ${kbLinkByName('Wacky worm','Wacky Worm')}, tie directly to a leader with a ${knotItemLink('Palomar knot','Palomar')}.</p>`
  }];
  if (/finesse shroom/.test(n)) return [{html:`<p>When using with a ${kbLinkByName('Ned rig','Ned rig')}, tie directly with a ${knotItemLink('Palomar knot','Palomar')}.</p>`}];
  if (/g finesse drop shot/.test(n)) return [{html:`<p>Use the knot and hook orientation described on the ${kbLinkByName('Drop shot','Drop shot')} page.</p>`}];
  return [];
}

function lureKnotGuidance(item) {
  const type=normalize(item.type), name=normalize(item.name);
  if (type.includes('chatterbait') || name.includes('chatterbait')) return [{
    html:`<p>Tie line directly to the lure using a ${knotItemLink('Palomar knot','Palomar')}. No snap or swivel; it can disrupt blade startup and vibration. Use a ${knotItemLink('loop knot','Loop / non-slip loop')} in cold water or finesse situations to let the blade swing more freely. Retie often, as vibrations stress the knot.</p>`
  }];
  if (type.includes('inline spinner')) return [{
    html:`<p><strong>Tackle:</strong> If using only fluorocarbon or monofilament line, use a swivel about 12–18 inches ahead of the lure and don't add a dressing. Add a snap if changing lures.<br><code>Mainline → swivel → 12–18” leader → snap (optional) → lure</code></p>
    <p>If using braided line and a leader, insert a swivel in the leader.<br><code>Mainline → 12–18” leader → swivel → 12–18” leader → snap (optional) → lure</code></p>
    <p><strong>Knot:</strong> ${knotItemLink('Improved Clinch','Improved Clinch')}. Retie often, as vibrations stress the knot over time.</p>`
  }];
  const row=state.connectionRows.find(r=>connectionMatchesItem(r,item));
  if (!row) return [];
  return [{html:`<p>${escapeHtml(cleanMarkdown(valueByHeader(row,'Connection')))}. ${escapeHtml(cleanMarkdown(valueByHeader(row,'Swivel use')))}</p>`}];
}

function usageGuidanceForItem(item) {
  if (item.category==='line') return lineUsageGuidance(item.type);
  if (item.category==='weights') return weightUsageGuidance(item.type);
  if (item.category==='snaps-swivels') return snapUsageGuidance(item.type);
  if (item.category==='hooks') return hookUsageGuidance(item);
  if (item.category==='lures') return lureUsageGuidance(item);
  if (item.category==='bait') return baitUsageGuidance(item);
  return [];
}

function lineUsageGuidance(type) {
  const target=type==='Braided'?'Braid':type;
  const section=findSection('knots',target,'Line material notes');
  return section?[{html:markdownToHtml(section.content)}]:[];
}

function weightUsageGuidance(type) {
  if (type==='Cylinder weights') return [{html:`<p>Used with a ${kbLinkByName('Drop shot','Drop shot rig')}.</p>`}];
  if (type==='Egg sinkers') return [{html:`<p>Used with a ${kbLinkByName('Slip sinker rig','Slip sinker rig')}.</p>`}];
  if (type==='Swiveling trolling / torpedo weights') return [{html:`<p>Used for kayak trolling in ${kbLinkByName('Trout fishing','trout fishing')}.</p>`}];
  if (type==='Glass beads') return [{html:`<p>Used between the egg sinker and swivel in a ${kbLinkByName('Slip sinker rig','slip sinker rig')}.</p>`}];
  return [];
}

function snapUsageGuidance(type) {
  const section=findSection('knots',type,'Snaps and swivels');
  if (section) return [{html:markdownToHtml(section.content)}];
  if (type==='Snaps') return [{html:`<ul>
    <li>Snaps have a weight rating; use a snap rated appropriately for the line.</li>
    <li>Use a snap to switch quickly between lures or when the bait has a tie point with edges.</li>
    <li>Use a snap with fast-moving lures that will be retrieved quickly or trolled.</li>
    <li>Do not use a snap with live or jig bait worked slowly; tie directly so the presentation stays natural.</li>
    <li>Do not use a snap with a weedless presentation because it can catch weeds; tie directly to the hook.</li>
    <li>Do not use snaps or swivels with floating/topwater bait when the added weight could pull it down.</li>
  </ul>`}];
  if (type==='Swivels') return [{html:`<ul>
    <li>Use a swivel to prevent line twist with spinning lures such as spoons, spinners, and flashers, or with a vertical jigging lure that swims in a circle.</li>
    <li>Ball-bearing swivels are preferred over barrel swivels for connecting lures and leaders when using monofilament and when spinning or trolling.</li>
    <li>A barrel swivel is acceptable for sinker rigs or for connecting a monofilament leader to braid, although a direct line-to-line knot is preferable when practical so a swivel cannot strike the rod guides.</li>
  </ul>`}];
  if (type==='Snap swivels') return [{html:`<ul>
    <li>Avoid connecting snap swivels directly to a lure because they add weight and can look unnatural.</li>
    <li>They may be acceptable with spinners and spoons that are changed frequently because those lures already carry substantial hardware.</li>
  </ul>`}];
  return [];
}

function hookUsageGuidance(item) {
  const n=normalize(item.name);
  const rows=[];
  if (/octopus hook|weedless wacky neko|crossover rings/.test(n)) rows.push({html:`<p>This item is commonly used with a ${kbLinkByName('Wacky worm','Wacky Worm')}.</p>`});
  if (/finesse shroom/.test(n)) rows.push({html:`<p>This hook is commonly used with a ${kbLinkByName('Ned rig','Ned rig')}.</p>`});
  if (/g finesse drop shot/.test(n)) rows.push({html:`<p>This hook is used with a ${kbLinkByName('Drop shot','Drop shot rig')}.</p>`});
  if (/twistlock|ewg worm/.test(n)) rows.push({html:`<p>Use with soft-plastic presentations; see the relevant lure/technique page for rig-specific instructions.</p>`});
  if (/swimbait jig/.test(n)) rows.push({html:`<p>Use with swimbaits and other jighead-mounted soft plastics.</p>`});
  if (/bait hooks|aberdeen/.test(n)) rows.push({html:`<p>Used for ${kbLinkByName('Trout fishing','trout fishing')} and other natural-bait presentations.</p>`});
  return rows;
}

function lureUsageGuidance(item) {
  const type=normalize(item.type), name=normalize(item.name);
  if (type.includes('inline spinner')) return [{
    title:'Use',
    html:`<ul>
      <li>Use in clear, cold rivers, creeks, and lakes; the tight wobble and flash excels when fish are finicky.</li>
      <li>Best in open water along the deep edge of cover, over the top of cover, or along the edge of current in a river.</li>
      <li>Don't use in heavy cover; inline spinners do not deflect well and can snag easily.</li>
    </ul>`
  },{
    title:'Technique',
    html:`<ul>
      <li>After casting, pop the rod tip to get the blade spinning.</li>
      <li>Retrieve at a constant rate, keeping the lure just under the surface or a few feet down.</li>
      <li>Adjust speed so the blade barely flashes under the surface for a natural presentation.</li>
      <li>Retrieve slowly in cold water and faster in warm water.</li>
      <li>In rivers and streams, cast upstream at about a 1:00 or 11:00 angle and guide the spinner past cover and obstructions.</li>
    </ul>`
  },{
    title:'Color',
    html:`<ul><li>Clear water: silver, copper, or natural finishes.</li><li>Stained water: gold, chartreuse, or black with bright dots.</li><li>Low light: glow, fluorescent, or UV-painted blades.</li></ul>`
  }];
  const candidates=[
    ['chatterbait','Chatterbait / bladed jig'],
    ['spinnerbait','Spinnerbait'],
    ['crankbait','Crankbait'],
    ['jerkbait','Jerkbait'],
    ['jig','Jigs'],
    ['wacky','Wacky worm'],
    ['ned','Ned rig'],
    ['drop shot','Drop shot'],
    ['topwater','Topwater']
  ];
  const hit=candidates.find(([needle])=>type.includes(needle)||name.includes(needle));
  if (!hit) return [];
  const section=findSection('techniques',hit[1]);
  return section?[{html:filteredTechniqueHtml(section.content)}]:[];
}

function baitUsageGuidance(item) {
  const n=normalize(item.name);
  if (/trout dough|trout nuggets/.test(n)) return [{html:`<p>Use with a ${kbLinkByName('Slip sinker rig','slip sinker rig')} for ${kbLinkByName('Trout fishing','trout fishing')}.</p>`}];
  if (/power eggs/.test(n)) {
    const spoon=findInventoryByName('Dick Nite spoon');
    return [
      {html:`<p>Use in trout trolling rigs; see ${kbLinkByName('Trout fishing','Trout fishing')} for the overall setup.</p>`},
      {html:`<p>Power Eggs can also be used when trout fishing with spoons${spoon?`, including the ${itemInternalLink(spoon,'Dick Nite spoon')}`:', including Dick Nite spoons'}.</p>`}
    ];
  }
  return [];
}

function knotUsageGuidance(item) {
