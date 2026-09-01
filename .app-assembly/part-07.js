function bindRouteButtons() {
  document.querySelectorAll('[data-route]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.route)));
  document.querySelectorAll('[data-history-back]').forEach(b=>b.addEventListener('click',()=>history.back()));
}

function navigate(hash) {
  if(location.hash===hash)renderRoute();else location.hash=hash;
  window.scrollTo({top:0,behavior:'smooth'});
}

function updateOnlineStatus() {
  statusDot.classList.toggle('offline',!navigator.onLine);
  statusDot.title=navigator.onLine?'Online':'Offline — cached knowledge remains available';
}

async function registerServiceWorker() {
  if('serviceWorker'in navigator)try{await navigator.serviceWorker.register('./sw.js');}catch(e){console.warn(e);}
}

function readPlanDraft(){try{return JSON.parse(localStorage.getItem('fishing-plan-draft')||'{}');}catch{return{};}}
function todayLocal(){const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function seasonForDate(s){const m=Number(s?.slice(5,7));return[12,1,2].includes(m)?'winter':[3,4,5].includes(m)?'spring':[6,7,8].includes(m)?'summer':[9,10,11].includes(m)?'fall':'';}

function findSection(key,title,parentTitle='') {
  const target=normalize(title), parent=normalize(parentTitle);
  return state.sections[key]?.find(s=>normalize(s.title)===target && (!parent || s.path.slice(0,-1).map(normalize).includes(parent)));
}

function parseSections(markdown,sourceKey) {
  const lines=markdown.split(/\r?\n/),heads=[],stack=[];
  lines.forEach((line,i)=>{const m=/^(#{1,6})\s+(.+?)\s*$/.exec(line);if(!m)return;const level=m[1].length,title=cleanMarkdown(m[2]);stack.length=level-1;stack[level-1]=title;heads.push({level,title,startLine:i,path:stack.filter(Boolean).slice(),sourceKey});});
  return heads.map((h,i)=>{let end=lines.length-1;for(let j=i+1;j<heads.length;j++)if(heads[j].level<=h.level){end=heads[j].startLine-1;break;}return{...h,endLine:end,content:lines.slice(h.startLine+1,end+1).join('\n').trim()};});
}

function parseTables(markdown,sections,sourceKey) {
  const lines=markdown.split(/\r?\n/),out=[];
  for(let i=0;i<lines.length-1;i++){
    if(!/^\s*\|/.test(lines[i])||!/^\s*\|?\s*:?-{3,}/.test(lines[i+1]))continue;
    const headers=splitTableRow(lines[i]).map(cleanMarkdown),rows=[];let j=i+2;
    while(j<lines.length&&/^\s*\|/.test(lines[j])){const cells=splitTableRow(lines[j]),row={};headers.forEach((h,k)=>row[h]=cells[k]??'');rows.push(row);j++;}
    const section=sections.filter(s=>s.startLine<=i&&s.endLine>=i).sort((a,b)=>b.level-a.level)[0];
    out.push({headers,rows,startLine:i,endLine:j-1,sectionPath:section?.path||[],sourceKey});i=j-1;
  }
  return out;
}

function splitTableRow(line) {
  const s=line.trim().replace(/^\|/,'').replace(/\|$/,''),cells=[];let cur='',esc=false;
  for(const ch of s){if(esc){cur+=ch;esc=false;continue;}if(ch==='\\'){cur+=ch;esc=true;continue;}if(ch==='|'){cells.push(cur.trim());cur='';continue;}cur+=ch;}
  cells.push(cur.trim());return cells;
}

function tableRowsInSection(key,title){const n=normalize(title);return state.tables[key].filter(t=>normalize(t.sectionPath.at(-1)||'')===n).flatMap(t=>t.rows);}
function valueByHeader(row,wanted){const k=Object.keys(row||{}).find(x=>normalize(x)===normalize(wanted));return k?row[k]:'';}
function extractLinks(md=''){const out=[];for(const m of String(md).matchAll(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g))out.push({label:cleanMarkdown(m[1]),url:m[2]});return out;}
function collectLinksFromRow(row){return Object.values(row||{}).flatMap(extractLinks);}
function uniqueLinks(links){const s=new Set();return (links||[]).filter(l=>l?.url&&!s.has(l.url)&&s.add(l.url));}
function uniqueStrings(values){const seen=new Set();return values.filter(v=>{const n=normalize(v);if(!n||seen.has(n))return false;seen.add(n);return true;});}
function dedupeBy(values,keyFn){const map=new Map();for(const v of values){const k=keyFn(v);if(!map.has(k))map.set(k,v);}return [...map.values()];}

function stableItemId(item){return slug(`${item.category}-${item.type||''}-${item.name}-${item.specifications||''}`);}
function searchText(item){return normalize(`${item.name} ${item.type||''} ${item.manufacturerModel||''} ${item.specifications||''} ${item.aliases?.join(' ')||''}`);}

function itemAliases(item) {
  const out=new Set([normalize(item.name),...(item.aliases||[])]);
  if (item.variants) item.variants.forEach(v=>out.add(normalize(v.name)));
  const brands=['z man','strike king','berkley','rapala','river2sea','booyah','gamakatsu','vmc','owner','mack s','mepps','panther martin','yamamoto','6th sense','rebel','daiwa','shimano','seaguar','sufix','powerpro','pflueger','kastmaster','dick nite'];
  for(const name of [...out]) {
    for(const b of brands) if(name.startsWith(`${b} `)) out.add(name.slice(b.length+1));
    const words=name.split(' ').filter(w=>w.length>2);if(words.length>=2)out.add(words.slice(-2).join(' '));
  }
  return [...out].filter(x=>x.length>=4);
}

function textMatchesItem(text,item){return itemAliases(item).some(a=>text.includes(a));}

function connectionMatchesItem(row,item) {
  const type=normalize(valueByHeader(row,'Lure type')), sub=normalize(item.type), name=normalize(item.name);
  return type&&(sub.includes(type.replace(/s$/,''))||type.includes(sub.replace(/s$/,''))||name.includes(type.replace(/s$/,''))||connectionAlias(type,sub));
}

function connectionAlias(type,sub){
  return(type.includes('crankbait')&&sub.includes('crankbait'))||(type.includes('hard jerkbait')&&sub.includes('jerkbait'))||(type.includes('spoon')&&sub.includes('spoon'))||(type.includes('inline spinner')&&sub.includes('inline spinner'))||(type.includes('spinnerbait')&&sub.includes('spinnerbait'))||(type.includes('chatterbait')&&sub.includes('chatterbait'))||(type.includes('wacky ned drop shot')&&/wacky|ned|drop shot/.test(sub))||(type.includes('topwater')&&/topwater|frog/.test(sub));
}

function extractKnotSentences(text) {
  const names=['palomar','fg knot','albright','alberto','trilene','improved clinch','modified uni','double uni','loop knot'];
  return[...new Set(cleanMarkdown(text).split(/(?<=[.!?])\s+|\n+/).filter(s=>names.some(n=>normalize(s).includes(n))||/tie direct|snap|swivel/i.test(s)).map(s=>s.trim().slice(0,360)))];
}

function dedupeGuidance(items) {
  const s=new Set();
  return items.filter(x=>{const k=normalize(`${x.title||''} ${x.text||''} ${stripHtml(x.html||'')}`);if(s.has(k))return false;s.add(k);return true;});
}

function markdownExcerpt(markdown){return markdownToHtml(markdown.split('\n').filter(x=>x.trim()).slice(0,8).join('\n'));}


function markdownToHtmlWithKbLinks(md,currentName='') {
  let out=[],list=false;
  for(const raw of String(md||'').split('\n')){
    const line=raw.trim();
    if(!line){if(list){out.push('</ul>');list=false;}continue;}
    if(/^[-*]\s+/.test(line)){if(!list){out.push('<ul>');list=true;}out.push(`<li>${markdownInline(line.replace(/^[-*]\s+/,''))}</li>`);continue;}
    if(list){out.push('</ul>');list=false;}
    if(/^#{1,6}\s+/.test(line)){
      const title=cleanMarkdown(line.replace(/^#{1,6}\s+/,''));
      const record=normalize(title)!==normalize(currentName)?findKbByName(title):null;
      out.push(`<h4>${record?`<a href="#/kb/${escapeAttr(record.id)}">${escapeHtml(title)}</a>`:escapeHtml(title)}</h4>`);
      continue;
    }
    if(!/^\|/.test(line)&&!/^```/.test(line))out.push(`<p>${markdownInline(line)}</p>`);
  }
  if(list)out.push('</ul>');
  return out.join('');
}

function markdownToHtml(md) {
  let out=[],list=false;
  for(const raw of String(md||'').split('\n')){
    const line=raw.trim();
    if(!line){if(list){out.push('</ul>');list=false;}continue;}
    if(/^[-*]\s+/.test(line)){if(!list){out.push('<ul>');list=true;}out.push(`<li>${markdownInline(line.replace(/^[-*]\s+/,''))}</li>`);continue;}
    if(list){out.push('</ul>');list=false;}
    if(/^#{1,6}\s+/.test(line)){out.push(`<h4>${markdownInline(line.replace(/^#{1,6}\s+/,''))}</h4>`);continue;}
    if(!/^\|/.test(line)&&!/^```/.test(line))out.push(`<p>${markdownInline(line)}</p>`);
  }
  if(list)out.push('</ul>');
  return out.join('');
}

function markdownInline(md='') {
  let x=escapeHtml(md);
  x=x.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1 ↗</a>')
    .replace(/`([^`]+)`/g,'<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
  return x;
}

function cleanMarkdown(v=''){return String(v).replace(/\[([^\]]+)\]\(([^)]+)\)/g,'$1').replace(/`([^`]+)`/g,'$1').replace(/[*_~]/g,'').replace(/^[-*]\s+/gm,'').replace(/^#+\s+/gm,'').replace(/\s+/g,' ').trim();}
function normalize(v=''){return cleanMarkdown(v).toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();}
function slug(v=''){return normalize(v).replace(/\s+/g,'-').slice(0,140)||'item';}
function countOccurrences(text,n){return n?text.split(n).length-1:0;}
function titleCase(v){return v.replace(/\b\w/g,c=>c.toUpperCase());}
function optionHtml(label,selected,value=label){return`<option value="${escapeAttr(value)}" ${selected===value?'selected':''}>${escapeHtml(label)}</option>`;}
function escapeHtml(v=''){return String(v).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);}
function escapeAttr(v=''){return escapeHtml(v).replace(/'/g,'&#39;');}
function stripHtml(v=''){return String(v).replace(/<[^>]+>/g,' ');}

function inferManufacturer(name='') {
