import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const edit = async (file, transform) => fs.writeFile(file, transform(await fs.readFile(file, 'utf8')));
const replace = (source, before, after) => { assert.ok(source.includes(before), `Missing expected source: ${before.slice(0,100)}`); return source.replace(before, after); };

await fs.writeFile('pwa/image-validation.mjs', `import fs from 'node:fs/promises';
import path from 'node:path';

export function detectImageType(bytes, filename='image') {
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9) return 'jpeg';
  const pngSignature = Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
  const pngEnd = Buffer.from([0x49,0x45,0x4e,0x44,0xae,0x42,0x60,0x82]);
  if (bytes.length >= 20 && bytes.subarray(0,8).equals(pngSignature) && bytes.subarray(-8).equals(pngEnd)) return 'png';
  if (isStructurallyValidWebp(bytes)) return 'webp';
  const gif = bytes.subarray(0,6).toString('ascii');
  if ((gif === 'GIF87a' || gif === 'GIF89a') && bytes.at(-1) === 0x3b) return 'gif';
  throw new Error(\`Unsupported or structurally invalid image: \${filename}\`);
}

export function assertExtensionMatches(filename, detected) {
  const ext = path.extname(filename).toLowerCase();
  const expected = detected === 'jpeg' ? ['.jpg','.jpeg'] : [\`.\${detected}\`];
  if (!expected.includes(ext)) throw new Error(\`Image extension does not match content for \${filename}: detected \${detected}\`);
}

export async function readValidatedImage(filename) {
  const bytes = await fs.readFile(filename);
  if (!bytes.length || bytes.length > 10 * 1024 * 1024) throw new Error(\`Invalid image size for \${filename}: \${bytes.length}\`);
  const detected = detectImageType(bytes, filename);
  assertExtensionMatches(filename, detected);
  return bytes;
}

export function imageExtension(filename, bytes) {
  const detected = detectImageType(bytes, filename);
  return detected === 'jpeg' ? 'jpg' : detected;
}

function isStructurallyValidWebp(bytes) {
  if (bytes.length < 20 || bytes.subarray(0,4).toString('ascii') !== 'RIFF' || bytes.subarray(8,12).toString('ascii') !== 'WEBP') return false;
  if (bytes.readUInt32LE(4) + 8 !== bytes.length) return false;
  let offset = 12;
  while (offset < bytes.length) {
    if (offset + 8 > bytes.length) return false;
    const chunkLength = bytes.readUInt32LE(offset + 4);
    offset += 8 + chunkLength + (chunkLength % 2);
    if (offset > bytes.length) return false;
  }
  return offset === bytes.length;
}
`);

await edit('pwa/apply-local-media.mjs', source => {
  source = replace(source, "import { validateKbBundle } from './kb-model.js';", "import { validateKbBundle } from './kb-model.js';\nimport { readValidatedImage, imageExtension } from './image-validation.mjs';");
  const begin = source.indexOf('async function readValidatedImage(filename) {');
  const end = source.indexOf('function safeFilename(value)', begin);
  assert.ok(begin >= 0 && end > begin);
  source = source.slice(0, begin) + source.slice(end);
  source = replace(source, "    imageSource:item.source,\n    bytes:bytes.length,", "    imageSource:item.source,\n    sourcePath:`pwa/${normalizeRelative(item.source)}`,\n    bytes:bytes.length,");
  return source;
});

await edit('pwa/apply-authored-notes.mjs', source => {
  source = replace(source, "import { fileURLToPath } from 'node:url';", "import { fileURLToPath } from 'node:url';\nimport { readValidatedImage } from './image-validation.mjs';");
  source = replace(source, "  localAssetRoot:'assets/gear-notes/',", "  localAssetRoot:'assets/gear-notes/',\n  siblingImages:true,");
  source = replace(source, "      if (!imagePath.startsWith(config.localAssetRoot)) {\n        throw new Error(`${relativeContentPath} references local image outside ./${config.localAssetRoot}: ${imageTarget}`);\n      }\n      await copyBuildFile(safePwaPath(imagePath), imagePath, config.label);", `      const sibling = config.siblingImages && imagePath.startsWith(config.sourceDir + '/') &&
        path.posix.dirname(imagePath) === config.sourceDir &&
        path.posix.basename(imagePath).startsWith(id + '-') &&
        /^[a-z0-9][a-z0-9._-]*\\.(?:jpe?g|png|webp|gif)$/.test(path.posix.basename(imagePath)) &&
        !path.posix.basename(imagePath).includes('..');
      const legacy = imagePath.startsWith(config.localAssetRoot);
      if (!sibling && !legacy) {
        throw new Error(\`${'${relativeContentPath}'} references local image outside its approved Notes image locations: ${'${imageTarget}'}\`);
      }
      const imageSource = safePwaPath(imagePath);
      await readValidatedImage(imageSource);
      await copyBuildFile(imageSource, imagePath, config.label);`);
  return source;
});

await edit('pwa/build.mjs', source => replace(source, "      imageSource: imageUrl,\n      bytes: bytes.length", "      imageSource: imageUrl,\n      sourceKind:'remote',\n      bytes: bytes.length"));

await edit('pwa/gear-app.js', source => {
  source = replace(source, "  const currentFilename = basename(currentMedia?.asset || '');", "  const currentFilename = currentMedia?.sourcePath ? basename(currentMedia.sourcePath) : '';\n  const suggestedFilename = item ? `${item.id}.png` : '';\n  const pictureSource = currentMedia?.sourcePath || currentMedia?.imageSource || '';\n  const currentMediaId = currentMedia?.id || item?.id || null;");
  source = replace(source, "        ${hasPicture ? `<div class=\"current-state-note\">Current picture: <code>${escapeHtml(currentFilename || currentMedia?.asset || 'configured media')}</code></div>` : ''}\n        <div id=\"pictureFields\" ${hasPicture ? '' : 'hidden'}>\n          ${formField('Preferred source filename *', `<input class=\"input\" id=\"gearPictureFilename\" maxlength=\"180\" value=\"${escapeAttr(currentFilename)}\" placeholder=\"example-item.jpg\">`, 'Use a filename only, not a folder path. Supported: JPG, PNG, WebP, GIF.')}\n        </div>", `        \${hasPicture ? \`<div class="current-state-note">Current picture: <code>\${escapeHtml(currentMedia.asset)}</code><br>Media ID: <code>\${escapeHtml(currentMediaId)}</code><br>Source: \${pictureSource ? pictureSource.startsWith('https://') || pictureSource.startsWith('http://') ? \`<a href="\${escapeAttr(pictureSource)}" target="_blank" rel="noopener">\${escapeHtml(pictureSource)}</a>\` : \`<code>\${escapeHtml(pictureSource)}</code>\` : 'Source unavailable'}\${currentMedia.sourcePath ? \`<br>Repository source: <code>\${escapeHtml(currentMedia.sourcePath)}</code>\` : ''}</div>\` : ''}
        <div id="pictureFields" \${hasPicture ? '' : 'hidden'}>
          \${hasPicture ? \`<fieldset class="choice-fieldset"><legend>Picture action</legend><label><input type="radio" name="gearPictureAction" value="keep" checked> Keep current picture</label><label><input type="radio" name="gearPictureAction" value="replace"> Replace picture</label></fieldset>\` : ''}
          <div id="replacementPictureFields" \${hasPicture ? 'hidden' : ''}>
            \${formField('Preferred source filename *', \`<input class="input" id="gearPictureFilename" maxlength="180" value="\${escapeAttr(currentFilename || suggestedFilename)}" placeholder="example-item.jpg">\`, 'Use the exact extension of your replacement image. JPG, PNG, WebP, and GIF are supported. The filename may be the same as the existing one.')}
          </div>
        </div>`);
  source = replace(source, "  bindProductEditor({ item, notesMarkdown, currentMedia, currentFilename, hasNotes, hasPicture, back });", "  bindProductEditor({ item, notesMarkdown, currentMedia, currentFilename, currentMediaId, hasNotes, hasPicture, back });");
  source = replace(source, "  let autoPictureFilename = !context.hasPicture;", "  let autoPictureFilename = !context.hasPicture;\n  const updatePictureAction = () => {\n    const replacement = document.querySelector('#replacementPictureFields');\n    if (replacement) replacement.hidden = context.hasPicture && document.querySelector('input[name=\"gearPictureAction\"]:checked')?.value !== 'replace';\n  };\n  document.querySelectorAll('input[name=\"gearPictureAction\"]').forEach(input => input.addEventListener('change', updatePictureAction));");
  source = replace(source, "    toggleChoicePanel('gearPictureChoice','pictureFields');\n    if (!context.item", "    toggleChoicePanel('gearPictureChoice','pictureFields');\n    updatePictureAction();\n    if (!context.item");
  source = replace(source, "  const pictureFilename = document.querySelector('#gearPictureFilename')?.value.trim() || '';\n  if (pictureYes && !isSafeImageFilename(pictureFilename))", "  const pictureFilename = document.querySelector('#gearPictureFilename')?.value.trim() || '';\n  const pictureAction = context.hasPicture ? document.querySelector('input[name=\"gearPictureAction\"]:checked')?.value : 'add';\n  if (pictureYes && (!context.hasPicture || pictureAction === 'replace') && !isSafeImageFilename(pictureFilename))");
  source = replace(source, "  const picture = pictureChange(context, pictureYes, pictureFilename, id);", "  const picture = pictureChange(context, pictureYes, pictureFilename, id, pictureAction);");
  const start = source.indexOf('function pictureChange(context, desired, filename, id) {');
  const end = source.indexOf('function notesChange(',start);
  assert.ok(start >= 0 && end > start);
  source = source.slice(0,start) + `function pictureChange(context, desired, filename, id, pictureAction='add') {
  const current = context.currentMedia || null;
  const currentAsset = current?.asset || null;
  const mediaId = context.currentMediaId || current?.id || id;
  const currentSource = current?.sourcePath || current?.imageSource || null;
  const currentInfo = { mediaId, currentAsset, currentSource };
  if (!context.hasPicture && !desired) return { action:'none', hasPicture:false };
  if (context.hasPicture && !desired) return { action:'remove', hasPicture:false, ...currentInfo };
  if (context.hasPicture && pictureAction !== 'replace') return { action:'keep', hasPicture:true, ...currentInfo };
  const uploadPath = \`pwa/assets/gear-source/\${filename}\`;
  return { action:context.hasPicture ? 'replace' : 'add', hasPicture:true, mediaId,
    sourceFilename:filename, uploadPath, ...(context.hasPicture ? currentInfo : {}) };
}

` + source.slice(end);
  source = replace(source, "    ? `<p><strong>Picture upload:</strong> <code>${escapeHtml(prepared.picture.uploadPath)}</code></p>`", "    ? `<p><strong>Picture upload:</strong> <code>${escapeHtml(prepared.picture.uploadPath)}</code></p><p>Upload the replacement directly to GitHub. The handoff preserves the existing media ID and owner; it has not changed the current picture.</p>`");
  source = replace(source, "  if (picture.action === 'add') summary.push(`Picture: add ${picture.sourceFilename}.`);", "  if (picture.action === 'add') summary.push(`Picture: add ${picture.sourceFilename}.`);");
  return source;
});

await edit('pwa/index.html', source => replace(source, "    .choice-fieldset input[type=\"radio\"] { width: 18px; height: 18px; accent-color: var(--accent); }", "    .choice-fieldset input[type=\"radio\"] { width: 18px; height: 18px; accent-color: var(--accent); }\n    #replacementPictureFields { margin-top: 12px; }\n    .current-state-note a { overflow-wrap: anywhere; }"));

console.log('Approved Notes image and picture replacement changes applied.');
