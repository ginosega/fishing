export function renderMarkdown(markdown, options = {}) {
  const lines = String(markdown || '').replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  let paragraph = [];
  let quote = [];
  let code = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(`<p>${renderParagraphLines(paragraph, options)}</p>`);
    paragraph = [];
  };
  const flushQuote = () => {
    if (!quote.length) return;
    blocks.push(`<blockquote><p>${renderParagraphLines(quote, options)}</p></blockquote>`);
    quote = [];
  };
  const flushAll = () => { flushParagraph(); flushQuote(); };

  for (let index = 0; index < lines.length; index++) {
    const raw = lines[index];
    if (code) {
      if (/^```/.test(raw)) { blocks.push(`<pre><code>${escapeHtml(code.lines.join('\n'))}</code></pre>`); code = null; }
      else code.lines.push(raw);
      continue;
    }
    const fence = /^```\s*([\w-]*)/.exec(raw);
    if (fence) { flushAll(); code = { language:fence[1], lines:[] }; continue; }
    if (!raw.trim()) { flushAll(); continue; }

    const table = readTable(lines, index);
    if (table) {
      flushAll();
      blocks.push(renderTable(table.headers, table.rows, options));
      index = table.endIndex;
      continue;
    }

    const heading = /^(#{1,6})\s+(.+?)\s*$/.exec(raw);
    if (heading) {
      flushAll();
      const level = Math.min(6, heading[1].length + 1);
      blocks.push(`<h${level}>${renderInline(heading[2], options)}</h${level}>`);
      continue;
    }
    if (/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(raw)) { flushAll(); blocks.push('<hr>'); continue; }

    const listBlock = readList(lines, index);
    if (listBlock) {
      flushAll();
      blocks.push(renderList(listBlock.lists, options));
      index = listBlock.endIndex;
      continue;
    }

    const quoted = /^\s*>\s?(.*)$/.exec(raw);
    if (quoted) { flushParagraph(); quote.push(quoted[1]); continue; }
    paragraph.push(raw.trimStart());
  }
  if (code) blocks.push(`<pre><code>${escapeHtml(code.lines.join('\n'))}</code></pre>`);
  flushAll();
  return blocks.join('');
}

export function renderInline(markdown, options = {}) {
  const tokens = [];
  const token = html => `\u0000${tokens.push(html) - 1}\u0000`;
  let text = String(markdown || '');

  text = text.replace(/`([^`]+)`/g, (_, code) => token(`<code>${escapeHtml(code)}</code>`));
  text = text.replace(/!\[([^\]]*)\]\((\S+?)(?:\s+["']([^"']*)["'])?\)/g, (_, alt, source, title) => {
    const src = resolveImageSource(source, options.contentPath);
    if (!src) return escapeHtml(alt);
    const titleAttr = title ? ` title="${escapeAttr(title)}"` : '';
    return token(`<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" loading="lazy" decoding="async"${titleAttr}>`);
  });
  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+["']([^"']*)["'])?\)/g, (_, label, target, title) => {
    const link = resolveLink(target, options);
    if (!link) return escapeHtml(label);
    const attrs = link.external ? ' target="_blank" rel="noopener"' : '';
    const titleAttr = title ? ` title="${escapeAttr(title)}"` : '';
    return token(`<a href="${escapeAttr(link.href)}"${attrs}${titleAttr}>${escapeHtml(label)}${link.external ? ' ↗' : ''}</a>`);
  });
  text = escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
    .replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>');
  return text.replace(/\u0000(\d+)\u0000/g, (_, index) => tokens[Number(index)] || '');
}

export function renderCatchCard(record, options = {}) {
  const speciesName = options.speciesName || 'Catch';
  const locationName = options.locationName || '';
  const href = options.href || `#/kb/catch/${encodeURIComponent(record?.id || '')}`;
  const pictureSrc = options.pictureSrc || '';
  const pictureAlt = options.pictureAlt || speciesName;
  const meta = [formatCatchDate(record?.date, record?.time), locationName, formatCatchSize(record?.size)].filter(Boolean).join(' · ');
  const picture = pictureSrc ? `<img class="catch-card-picture" src="${escapeAttr(pictureSrc)}" alt="${escapeAttr(pictureAlt)}" loading="lazy" decoding="async">` : '';
  return `<a class="catch-backlink${picture ? ' has-picture' : ''}" href="${escapeAttr(href)}">${picture}<div class="catch-card-body"><strong>${escapeHtml(speciesName)}</strong>${meta ? `<span class="catch-card-meta">${escapeHtml(meta)}</span>` : ''}</div></a>`;
}

export function formatCatchDate(date, time) {
  if (!date) return '';
  const parsed = new Date(`${date}T12:00:00Z`);
  const label = Number.isNaN(parsed.valueOf())
    ? date
    : new Intl.DateTimeFormat(undefined, { year:'numeric', month:'short', day:'numeric', timeZone:'UTC' }).format(parsed);
  return time ? `${label} at ${time}` : label;
}

export function formatCatchSize(size) {
  if (!size) return 'Size not recorded';
  const parts = [];
  if (size.length) parts.push(`${size.length.value} ${size.length.unit}`);
  if (size.weight) parts.push(`${size.weight.value} ${size.weight.unit}`);
  if (size.display) parts.push(size.display);
  return parts.join(' · ') || 'Size not recorded';
}

function resolveLink(target, options) {
  const value = decodeEntities(String(target || '').trim());
  if (/^https?:\/\//i.test(value)) return { href:value, external:true };
  if (/^gear:\/\/[a-z0-9][a-z0-9-]*$/i.test(value)) return { href:`#/inventory/item/${encodeURIComponent(value.slice(7))}`, external:false };
  if (/^kb:\/\/[a-z0-9][a-z0-9-]*$/i.test(value)) return { href:`#/kb/entity/${encodeURIComponent(value.slice(5))}`, external:false };
  if (/^#\//.test(value)) return { href:value, external:false };
  if (/^(?:javascript|data|vbscript):/i.test(value)) return null;
  const resolved = resolveRelative(value, options.contentPath);
  const entity = options.entityByContentPath?.get(resolved.replace(/^\.\//, '')) || options.entityByContentPath?.get(`./${resolved.replace(/^\.\//, '')}`);
  if (entity) return { href:`#/kb/entity/${encodeURIComponent(entity.id)}`, external:false };
  return resolved ? { href:`./${resolved.replace(/^\.\//, '')}`, external:false } : null;
}

function resolveImageSource(source, contentPath) {
  const value = decodeEntities(String(source || '').trim());
  if (/^https?:\/\//i.test(value)) return value;
  if (/^(?:javascript|data|vbscript):/i.test(value)) return '';
  const resolved = resolveRelative(value, contentPath);
  return resolved ? `./${resolved.replace(/^\.\//, '')}` : '';
}

function resolveRelative(target, contentPath = './kb-content/index.md') {
  try {
    const base = new URL(String(contentPath).replace(/^\.\//, ''), 'https://local.invalid/');
    const resolved = new URL(target, base);
    if (resolved.origin !== 'https://local.invalid') return '';
    return decodeURIComponent(resolved.pathname.replace(/^\//, '')) + resolved.search + resolved.hash;
  } catch { return ''; }
}

function renderParagraphLines(lines, options) {
  return lines.map((line, index) => {
    const hardBreak = / {2,}$/.test(line);
    const html = renderInline(line.replace(/ {2,}$/, ''), options);
    if (index === lines.length - 1) return html;
    return `${html}${hardBreak ? '<br>' : ' '}`;
  }).join('');
}

function readList(lines, index) {
  const first = listMarker(lines[index]);
  if (!first) return null;

  const list = { tag:first.tag, start:first.ordinal || 1, items:[] };
  const baseIndent = first.indent;
  let cursor = index;

  while (cursor < lines.length) {
    const marker = listMarker(lines[cursor]);
    if (!marker || marker.indent !== baseIndent || marker.tag !== list.tag) break;

    const item = { lines:[marker.text] };
    cursor++;
    let paragraphInterrupted = false;

    while (cursor < lines.length) {
      const raw = lines[cursor];
      const sibling = listMarker(raw);

      if (sibling && sibling.indent === baseIndent) {
        if (sibling.tag === list.tag) break;
        return { lists:[list], endIndex:cursor - 1 };
      }

      if (!raw.trim()) {
        let lookahead = cursor + 1;
        while (lookahead < lines.length && !lines[lookahead].trim()) lookahead++;
        if (lookahead >= lines.length) {
          cursor = lookahead;
          break;
        }

        const nextMarker = listMarker(lines[lookahead]);
        if (nextMarker && nextMarker.indent === baseIndent && nextMarker.tag === list.tag) {
          cursor = lookahead;
          break;
        }

        if (leadingIndent(lines[lookahead]) > baseIndent) {
          item.lines.push('');
          cursor++;
          paragraphInterrupted = true;
          continue;
        }

        list.items.push(item);
        return { lists:[list], endIndex:cursor - 1 };
      }

      if (leadingIndent(raw) > baseIndent) {
        item.lines.push(raw);
        cursor++;
        continue;
      }

      if (!paragraphInterrupted && !startsTopLevelBlock(raw)) {
        item.lines.push(raw);
        cursor++;
        continue;
      }

      list.items.push(item);
      return { lists:[list], endIndex:cursor - 1 };
    }

    list.items.push(item);
  }

  return { lists:[list], endIndex:cursor - 1 };
}

function listMarker(line) {
  const match = /^(\s*)([-*+]|\d+[.)])\s+(.+)$/.exec(line || '');
  if (!match) return null;
  const indent = match[1].replace(/\t/g, '    ').length;
  const ordered = /^\d/.test(match[2]);
  return {
    indent,
    tag:ordered ? 'ol' : 'ul',
    ordinal:ordered ? Number.parseInt(match[2], 10) : null,
    text:match[3]
  };
}

function leadingIndent(line) {
  const match = /^(\s*)/.exec(line || '');
  return (match?.[1] || '').replace(/\t/g, '    ').length;
}

function startsTopLevelBlock(line) {
  return /^(?:#{1,6}\s+|```|\s*>\s?|\s*([-*_])(?:\s*\1){2,}\s*$)/.test(line || '');
}

function renderList(lists, options) {
  return lists.map(list => {
    const start = list.tag === 'ol' && list.start !== 1 ? ` start="${list.start}"` : '';
    return `<${list.tag}${start}>${list.items.map(item => `<li>${renderListItem(item, options)}</li>`).join('')}</${list.tag}>`;
  }).join('');
}

function renderListItem(item, options) {
  const html = renderMarkdown(item.lines.join('\n'), options);
  const loose = item.lines.some(line => !line.trim() || / {2,}$/.test(line));
  return loose ? html : html.replace(/^<p>([\s\S]*?)<\/p>/, '$1');
}

function readTable(lines, index) {
  if (!/^\s*\|/.test(lines[index] || '') || !/^\s*\|?\s*:?-{3,}/.test(lines[index + 1] || '')) return null;
  const headers = splitTableRow(lines[index]);
  const rows = [];
  let cursor = index + 2;
  while (cursor < lines.length && /^\s*\|/.test(lines[cursor])) rows.push(splitTableRow(lines[cursor++]));
  return { headers, rows, endIndex:cursor - 1 };
}

function renderTable(headers, rows, options) {
  return `<div class="table-scroll"><table><thead><tr>${headers.map(cell => `<th>${renderInline(cell, options)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${headers.map((_, index) => `<td>${renderInline(row[index] || '', options)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function splitTableRow(line) {
  const cells = [];
  let current = '';
  let escaped = false;
  for (const char of line.trim().replace(/^\||\|$/g, '')) {
    if (escaped) { current += char; escaped = false; continue; }
    if (char === '\\') { escaped = true; continue; }
    if (char === '|') { cells.push(current.trim()); current = ''; continue; }
    current += char;
  }
  cells.push(current.trim());
  return cells;
}

function decodeEntities(value) { return value.replaceAll('&amp;', '&'); }
function escapeHtml(value = '') { return String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]); }
function escapeAttr(value = '') { return escapeHtml(value); }
