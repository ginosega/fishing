// Shared, dependency-free authoring rules. Domain schemas remain authoritative.
export const STABLE_ID = /^[a-z0-9][a-z0-9-]*$/;
export const IMAGE_FILENAME = /^[a-z0-9][a-z0-9._-]*\.(?:jpe?g|png|webp|gif)$/i;

export function slugify(value) {
  return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100);
}
export function uniqueStableId(name, existingIds, prefix = '') {
  const slug = slugify(name);
  if (!slug) return '';
  const base = `${prefix}${slug}`;
  const ids = new Set(existingIds);
  let candidate = base, suffix = 2;
  while (ids.has(candidate)) candidate = `${base}-${suffix++}`;
  return candidate;
}
export function isHttpUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
}
export function isSafeImageFilename(value) {
  return typeof value === 'string' && IMAGE_FILENAME.test(value) && !value.includes('..') && !/[\\/]/.test(value);
}
export function validatePlainText(value, label, max, errors, required = false) {
  if (required && !String(value || '').trim()) { errors.push(`${label} is required.`); return; }
  if (!value) return;
  if (value.length > max) errors.push(`${label} must be ${max} characters or fewer.`);
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value)) errors.push(`${label} contains unsupported control characters.`);
  if (/<\s*\/?\s*(script|iframe|object|embed|style|link|meta)\b/i.test(value)) errors.push(`${label} contains disallowed executable markup.`);
}
export function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
export function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[char]);
}
export function renderPreparedHandoff(panel, prepared, options = {}) {
  if (!panel) return;
  const payload = JSON.stringify(prepared, null, 2);
  const id = options.id || 'authoringPackage';
  const label = options.label || 'changes';
  const picture = prepared.picture;
  const content = prepared.content || prepared.notes;
  const upload = picture?.uploadPath ? `<p><strong>Picture upload:</strong> <code>${escapeHtml(picture.uploadPath)}</code></p><p>Upload the actual image directly to GitHub. The current picture is unchanged until the replacement is validated and promoted.</p>` : '';
  panel.innerHTML = `<h3>${escapeHtml(label)} ready to hand off</h3>
    <p>Copy this package and paste it into our Fishing chat. Validation has not saved changes to GitHub or local application storage.</p>
    <ul>${(prepared.summary || []).map(line => `<li>${escapeHtml(line)}</li>`).join('')}</ul>
    ${upload}${content?.path ? `<p><strong>Markdown file:</strong> <code>${escapeHtml(content.path)}</code></p>` : ''}
    <label class="field-label" for="${id}">Change package</label>
    <textarea class="input handoff-package" id="${id}" rows="16" readonly>${escapeHtml(payload)}</textarea>
    <div class="inline-actions"><button class="primary-button" id="${id}Copy" type="button">Copy change package</button><span class="copy-status" id="${id}Status" aria-live="polite"></span></div>`;
  panel.hidden = false;
  panel.querySelector(`#${id}Copy`).addEventListener('click', async () => {
    const status = panel.querySelector(`#${id}Status`);
    try { await navigator.clipboard.writeText(payload); status.textContent = 'Copied.'; }
    catch { panel.querySelector(`#${id}`).select(); status.textContent = 'Clipboard unavailable; package selected for manual copy.'; }
  });
  panel.scrollIntoView({behavior:'smooth',block:'start'});
}
