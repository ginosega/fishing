export function renderCatchCard(record, options = {}) {
  const speciesName = options.speciesName || 'Catch';
  const locationName = options.locationName || '';
  const href = options.href || `#/kb/catch/${encodeURIComponent(record?.id || '')}`;
  const meta = [formatCatchDate(record?.date, record?.time), locationName, formatCatchSize(record?.size)].filter(Boolean).join(' · ');
  return `<a class="catch-backlink" href="${escapeAttr(href)}"><strong>${escapeHtml(speciesName)}</strong>${meta ? `<span>${escapeHtml(meta)}</span>` : ''}</a>`;
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

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
}

function escapeAttr(value = '') {
  return escapeHtml(value);
}
