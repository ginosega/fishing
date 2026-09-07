import { KB_TYPES, KB_DESCRIPTION_MAX_LENGTH } from './kb-model.js';
import { KB_CONTENT_MAX_LENGTH, newKbIdentity, newKbContentPath, prepareKbChange } from './kb-authoring-model.js';
import { escapeHtml, isSafeImageFilename, renderPreparedHandoff } from './authoring-common.js';
import { renderMarkdown } from './markdown-render.js';

const LABELS = {location:'Location',species:'Species',equipment:'Gear Guide',technique:'Technique',knot:'Knot'};
const field = (label, control, help = '') => `<div class="form-field"><label class="field-label">${escapeHtml(label)}</label>${control}${help ? `<div class="form-help">${escapeHtml(help)}</div>` : ''}</div>`;
const input = (id, value, max, extra = '') => `<input class="input${extra.includes('readonly') ? ' read-only-input' : ''}" id="${id}" value="${escapeHtml(value || '')}" maxlength="${max}" ${extra}>`;
const option = (value, label, selected) => `<option value="${escapeHtml(value)}"${value === selected ? ' selected' : ''}>${escapeHtml(label)}</option>`;
const radio = (name, value, label, checked) => `<label><input type="radio" name="${name}" value="${value}"${checked ? ' checked' : ''}> ${label}</label>`;
const row = (label, value) => `<div class="current-state-note">${escapeHtml(label)}: <code>${escapeHtml(value || '(none)')}</code></div>`;

export function mountKbEditor(options) {
  const {root,bundle,sourceBundle = bundle,gearBundle,catchBundle,original = null,sourceOriginal = original,markdown = '',media = [],localMedia = null,entityByContentPath,onCancel} = options;
  const editing = Boolean(original);
  const initialType = original?.type || (KB_TYPES.includes(options.initialType) ? options.initialType : '');
  const initialId = original?.id || '';
  const current = original?.picture || null;
  const currentLocal = (localMedia?.kb || []).find(entry => entry.entityId === original?.id);
  const currentMedia = media.find(entry => entry.asset === current?.src && (entry.owners || []).some(owner => owner.gearItemId === current?.gearItemId));
  const currentSource = currentLocal?.source || currentMedia?.sourcePath || currentMedia?.imageSource || current?.src || '';
  const currentFilename = currentLocal?.source?.split('/').pop() || (current?.src?.startsWith('./assets/kb/') ? current.src.split('/').pop() : '');
  const choices = media.flatMap(entry => (entry.owners || []).filter(owner => gearBundle.items.some(item => item.id === owner.gearItemId)).map(owner => ({...entry,owner}))).filter(entry => entry.asset);
  const pictureYes = Boolean(current);
  const initialOwner = current?.gearItemId || '';
  root.innerHTML = `<form class="gear-editor" id="kbEditor" novalidate>
    <section class="panel form-panel">
      <div class="form-errors" id="kbFormErrors" role="alert" hidden></div>
      <div class="form-grid">
        ${field('KB ID', input('kbId',initialId,140,'readonly aria-readonly="true"'), 'Generated from Name and Type for new entries. Existing IDs never change.')}
        ${field('Type *', `<select class="select" id="kbType" required><option value="">Select type…</option>${KB_TYPES.map(type => option(type,LABELS[type],initialType)).join('')}</select>`, 'Choose among the five flat KB Types; the taxonomy is maintained in chat.')}
        ${field('Name *', input('kbName',original?.name,160,'required'))}
        ${field('Description', `<textarea class="input" id="kbDescription" maxlength="${KB_DESCRIPTION_MAX_LENGTH}" rows="2">${escapeHtml(original?.description || '')}</textarea>`, `Optional card/header summary, ${KB_DESCRIPTION_MAX_LENGTH} characters maximum.`)}
        ${field('Content path', input('kbContentPath',original?.content || '',250,'readonly aria-readonly="true"'), 'The complete Markdown document has a stable path. Renaming or reclassifying an entry never moves it.')}
      </div>
    </section>
    <section class="panel form-panel">
      <fieldset class="choice-fieldset"><legend>Picture? *</legend>${radio('kbPictureChoice','yes','Yes',pictureYes)}${radio('kbPictureChoice','no','No',!pictureYes)}</fieldset>
      ${current ? `<div class="current-state-note"><img class="kb-editor-current-picture" src="${escapeHtml(current.src)}" alt="${escapeHtml(current.alt)}"></div>${row('Current asset',current.src)}${row('Source',currentSource)}${currentMedia ? row('Gear media ID',currentMedia.id) : ''}${current.gearItemId ? row('Owned Gear',current.gearItemId) : ''}` : ''}
      <div id="kbPictureFields" hidden>
        <fieldset class="choice-fieldset"><legend>Picture action</legend>
          ${current ? radio('kbPictureAction','keep','Keep current picture',true) : ''}
          ${radio('kbPictureAction','upload',current ? 'Replace with an uploaded image' : 'Upload a new image',!current)}
          ${radio('kbPictureAction','reuse','Reuse an existing owned Gear picture',false)}
        </fieldset>
        <div id="kbUploadFields">
          ${field('Source filename *', input('kbPictureFilename',currentFilename || '',180), 'Use the actual JPG, PNG, WebP, or GIF extension. New filenames are prefixed with the stable KB ID; the existing filename may be reused.')}
        </div>
        <div id="kbReuseFields" hidden>
          ${field('Owned Gear picture *', `<select class="select" id="kbReuseMedia"><option value="">Select picture…</option>${choices.map(entry => option(`${entry.id}|${entry.owner.gearItemId}`,`${gearBundle.items.find(item=>item.id===entry.owner.gearItemId)?.name || entry.owner.gearItemId}${entry.owner.component ? ` · ${entry.owner.component}` : ''} · ${entry.id}`,currentMedia && current?.gearItemId === entry.owner.gearItemId ? `${currentMedia.id}|${entry.owner.gearItemId}` : '')).join('')}</select>`, 'Reuses the existing media asset and explicit Gear ownership; no duplicate image is created.')}
        </div>
        <div id="kbPictureMetadata">
          <div class="form-grid">
            ${field('Alternative text *',input('kbPictureAlt',current?.alt || '',500))}
            ${field('Caption',input('kbPictureCaption',current?.caption || '',500))}
            ${field('Credit',input('kbPictureCredit',current?.credit || '',500))}
            ${field('Source URL',input('kbPictureSourceUrl',current?.sourceUrl || '',2000,'inputmode="url"'))}
            ${field('Owned Gear depicted',`<select class="select" id="kbPictureGear"><option value="">None / not applicable</option>${gearBundle.items.map(item => option(item.id,item.name,initialOwner)).join('')}</select>`, 'Optional exact ownership association for an uploaded picture. Never infer ownership from its caption.')}
          </div>
        </div>
      </div>
    </section>
    <section class="panel form-panel">
      <h3>Content Markdown *</h3>
      <p class="form-help">This is the complete article, not a separate Notes field. Use authored gear:// and kb:// links for internal navigation. Supporting images may be placed in assets/kb/ or alongside this document with an ID-prefixed filename. New files appear in Preview after deployment.</p>
      <textarea class="input markdown-editor" id="kbMarkdown" maxlength="${KB_CONTENT_MAX_LENGTH}" rows="18" required>${escapeHtml(markdown)}</textarea>
      <div class="inline-actions"><button class="secondary-button" id="previewKbMarkdown" type="button">Preview</button></div>
      <div class="panel markdown-preview" id="kbMarkdownPreview" hidden><h3>Content preview</h3><div class="kb-content" id="kbMarkdownPreviewBody"></div></div>
    </section>
    <div class="form-actions"><button class="primary-button" type="submit">${editing ? 'Prepare changes' : 'Prepare new entry'}</button><button class="secondary-button" id="cancelKbEditor" type="button">Cancel</button></div>
  </form><section class="panel prepared-change" id="kbPreparedPanel" hidden></section>`;

  const el = id => root.querySelector(`#${id}`);
  const value = id => el(id)?.value.trim() || '';
  const checked = name => root.querySelector(`input[name="${name}"]:checked`)?.value;
  const form = el('kbEditor');
  let autoFilename = !currentFilename;
  let dirty = false;
  const updateIdentity = () => {
    if (editing) return;
    const id = newKbIdentity(value('kbType'),value('kbName'),bundle);
    el('kbId').value = id;
    el('kbContentPath').value = id ? newKbContentPath(value('kbType'),id) : '';
    if (autoFilename) el('kbPictureFilename').value = id ? `${id}-hero.jpg` : '';
  };
  const updatePicture = () => {
    const yes = checked('kbPictureChoice') === 'yes';
    el('kbPictureFields').hidden = !yes;
    const action = checked('kbPictureAction');
    el('kbUploadFields').hidden = !yes || action !== 'upload';
    el('kbReuseFields').hidden = !yes || action !== 'reuse';
    el('kbPictureMetadata').hidden = !yes;
    el('kbPictureGear').closest('.form-field').hidden = action !== 'upload';
  };
  const updateReuse = () => {
    const selected = choices.find(row => `${row.id}|${row.owner.gearItemId}` === value('kbReuseMedia'));
    if (!selected) return;
    el('kbPictureAlt').value = selected.alt || '';
    el('kbPictureGear').value = selected.owner.gearItemId;
    el('kbPictureCaption').value = '';
    el('kbPictureCredit').value = '';
    el('kbPictureSourceUrl').value = '';
  };
  const errorBox = el('kbFormErrors');
  const showErrors = errors => {
    errorBox.hidden = !errors.length;
    errorBox.innerHTML = errors.length ? `<strong>Please correct the following:</strong><ul>${errors.map(error => `<li>${escapeHtml(error)}</li>`).join('')}</ul>` : '';
    if (errors.length) errorBox.scrollIntoView({behavior:'smooth',block:'center'});
  };
  const collect = () => {
    const id = value('kbId'),type = value('kbType');
    const entity = {id,type,name:value('kbName'),description:value('kbDescription') || null,
      picture:current ? structuredClone(current) : null,content:value('kbContentPath')};
    const yes = checked('kbPictureChoice') === 'yes';
    const action = !yes ? (current ? 'remove' : 'none') : checked('kbPictureAction') === 'keep' ? 'keep' : checked('kbPictureAction') === 'reuse' ? 'reuse' : current ? 'replace' : 'add';
    const picturePlan = {action,filename:value('kbPictureFilename'),gearMediaId:value('kbReuseMedia').split('|')[0],availableMedia:media,
      alt:value('kbPictureAlt'),caption:value('kbPictureCaption'),credit:value('kbPictureCredit'),sourceUrl:value('kbPictureSourceUrl'),gearItemId:checked('kbPictureAction') === 'reuse' ? value('kbReuseMedia').split('|')[1] || '' : value('kbPictureGear')};
    if (action === 'keep' && current) {
      const updated = {...current,alt:picturePlan.alt,caption:picturePlan.caption || null,credit:picturePlan.credit || null,sourceUrl:picturePlan.sourceUrl || null};
      if (JSON.stringify(updated) !== JSON.stringify(current)) picturePlan.action = 'update';
    }
    return prepareKbChange({bundle,sourceBundle,gearBundle,catchBundle,original,sourceOriginal,localMedia,availableMedia:media,originalMarkdown:markdown,entity,markdown:el('kbMarkdown').value,picturePlan});
  };
  form.addEventListener('input', event => {
    dirty = true;
    el('kbPreparedPanel').hidden = true;
    if (event.target.id === 'kbPictureFilename') autoFilename = false;
    if (['kbName','kbType'].includes(event.target.id)) updateIdentity();
  });
  el('kbType').addEventListener('change',updateIdentity);
  root.querySelectorAll('input[name="kbPictureChoice"],input[name="kbPictureAction"]').forEach(node => node.addEventListener('change',updatePicture));
  el('kbReuseMedia').addEventListener('change',updateReuse);
  el('previewKbMarkdown').addEventListener('click',() => {
    el('kbMarkdownPreviewBody').innerHTML = renderMarkdown(el('kbMarkdown').value,{contentPath:value('kbContentPath') || './kb-content/index.md',entityByContentPath});
    el('kbMarkdownPreview').hidden = false;
  });
  el('cancelKbEditor').addEventListener('click',() => {
    if (!dirty || window.confirm('Discard your unprepared changes?')) onCancel();
  });
  form.addEventListener('submit',event => {
    event.preventDefault();
    const result = collect();
    if (!result.valid) return showErrors(result.errors);
    const pkg = result.package;
    if (current && pkg.picture.action === 'remove' && !window.confirm('Prepare a request to remove this picture association? The source image will not be deleted.')) return;
    showErrors([]);
    renderPreparedHandoff(el('kbPreparedPanel'),pkg,{id:'kbChangePackage',label:editing?'KB changes':'KB entry'});
  });
  updateIdentity();
  updatePicture();
  return {collect};
}
