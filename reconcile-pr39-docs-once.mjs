import fs from 'node:fs/promises';

const RELEASE = {
  prHead:'77ec40db223b275366a73091974ecd4d421a2c90',
  prRun:'33907218850',
  prRunNumber:'196',
  merge:'e997492b995f7e7cb8fa4af21ef1f2953df63a78',
  prodRun:'33907284576',
  prodRunNumber:'197'
};

async function read(path) { return fs.readFile(path, 'utf8'); }
async function write(path, text) { return fs.writeFile(path, text); }
function replaceOnce(text, from, to, label) {
  const i = text.indexOf(from);
  if (i < 0) throw new Error(`Missing pattern: ${label}`);
  if (text.indexOf(from, i + from.length) >= 0) throw new Error(`Ambiguous pattern: ${label}`);
  return text.slice(0, i) + to + text.slice(i + from.length);
}
function replaceRegexOnce(text, regex, to, label) {
  const flags = regex.flags.includes('g') ? regex.flags : `${regex.flags}g`;
  const matches = [...text.matchAll(new RegExp(regex.source, flags))];
  if (matches.length !== 1) throw new Error(`${label} matched ${matches.length} times`);
  return text.replace(regex, to);
}

const releaseBlock = `**PR #39 — Unify authored Gear and Catch Notes as Markdown**\n\n- exact tested PR head: \`${RELEASE.prHead}\`\n- PR CI: **#${RELEASE.prRunNumber} / ${RELEASE.prRun}** — success\n- merge commit: \`${RELEASE.merge}\`\n- production workflow: **#${RELEASE.prodRunNumber} / ${RELEASE.prodRun}** — success\n- all structured-model/routing/Markdown/final-content tests: success\n- PWA build + unified authored-Notes validation + transformed/local-media validation: success\n- bundle verification and GitHub Pages artifact upload: success\n- **Deploy to GitHub Pages: success**\n\nPR #39 completed the authored-content architecture cleanup begun in PR #38: My Gear schema v3 contains only structured owned facts while optional Notes live in \`pwa/gear-content/<gear-id>.md\`; Catch Log schema v2 contains only structured catch facts/relationships while optional Notes live in \`pwa/catch-content/<catch-id>.md\`. The five existing user-authored Exact Spot Notes were preserved verbatim as Catch Markdown. The prior generated Catch Notes and Provenance/source card were retired, so Catch leaves now render one optional Markdown-backed **Notes** card. Gear and Catch Notes use the same renderer, stable-ID navigation conventions, build validation, asset-manifest pattern, and offline caching.\n\nPR #36 remains the prior UX-polish release for the **Trolling** display alias, square non-cropping thumbnails, and root-search replacement behavior.`;

// README.md
{
  let t = await read('README.md');
  t = replaceOnce(t,
    '**Status: NORMAL PROJECT MAINTENANCE / PRODUCTION HEALTHY / PR #36 UX POLISH DEPLOYED / PR #28 CONTENT ACCEPTANCE CLOSED**',
    '**Status: NORMAL PROJECT MAINTENANCE / PRODUCTION HEALTHY / PR #39 AUTHORED-NOTES UNIFICATION DEPLOYED / PR #28 CONTENT ACCEPTANCE CLOSED**',
    'README status');
  t = replaceOnce(t,
    '1. **My Gear** — structured owned inventory in JSON + IndexedDB, with optional Markdown Notes.\n2. **Knowledge Base** — a strict structured entity index over complete authored Markdown documents.\n3. **Catch Log** — separate structured historical records that own the exact cross-entity relationships required by current application behavior.',
    '1. **My Gear** — structured owned facts in JSON + IndexedDB, with optional authored Notes stored separately as stable-ID Markdown files.\n2. **Knowledge Base** — a strict structured entity index over complete authored Markdown documents.\n3. **Catch Log** — separate structured historical facts/relationships, with optional authored Notes stored separately as stable-ID Markdown files.',
    'README domain summary');
  t = replaceOnce(t,
    '- `pwa/gear-app.js` — all `#/inventory/...` routes\n- `pwa/media-owners.json`,',
    '- `pwa/gear-app.js` — all `#/inventory/...` routes\n- `pwa/gear-content/` — optional authored Notes keyed deterministically by Gear stable ID\n- `pwa/apply-authored-notes.mjs` — validates/materializes Gear + Catch authored Notes and generates offline manifests\n- `pwa/media-owners.json`,',
    'README Gear owners');
  t = replaceOnce(t, '- schema version `2`\n- data version `2026-09-04-my-gear-v2-final-content-1`', '- schema version `3`\n- data version `2026-09-04-my-gear-v3-external-notes-1`', 'README Gear seed');
  t = replaceOnce(t,
    'Manufacturer, model, specifications, and typed links are structured facts. `notes` is optional Markdown narrative. Do not reintroduce `profiles`, structured usage/connection guidance, `knowledgeRefs`, setup `mainLine`/`leader`, or inference from display text/Markdown.',
    'Manufacturer, model, specifications, and typed links are structured facts. Narrative is not stored in Gear JSON: optional Notes live at `pwa/gear-content/<gear-id>.md`, keyed by stable Gear ID and validated/materialized by `pwa/apply-authored-notes.mjs`. Do not reintroduce inline `notes`, `profiles`, structured usage/connection guidance, `knowledgeRefs`, setup `mainLine`/`leader`, or inference from display text/Markdown.',
    'README Gear narrative');
  t = replaceOnce(t,
    '- source: `pwa/data/catches.seed.json`\n- **5 structured catches** remain in the current seed',
    '- structured source: `pwa/data/catches.seed.json`\n- authored Notes: `pwa/catch-content/<catch-id>.md`\n- schema version `2`, data version `2026-09-04-catches-v2-external-notes-1`\n- **5 structured catches** remain in the current seed',
    'README Catch sources');
  t = replaceOnce(t,
    '- optional exact catch pictures override the default Species-picture fallback',
    '- optional exact catch pictures override the default Species-picture fallback\n- optional Catch Notes are authored Markdown keyed by Catch stable ID; structured Catch records do not contain narrative/provenance fields',
    'README Catch notes');
  t = replaceRegexOnce(t, /### Latest verified runtime release\n\n[\s\S]*?\n### Latest verified authored-content baseline before PR #36/, `### Latest verified runtime release\n\n${releaseBlock}\n\n### Latest verified authored-content baseline before PR #36`, 'README release section');
  await write('README.md', t);
}

// Fishing_Context.md
{
  let t = await read('Fishing_Context.md');
  t = replaceRegexOnce(t, /^\*\*Status:\*\* .*$/m,
    '**Status:** Active authoritative current-state summary. OneNote migration/link restoration completed 2026-08-29; My Gear local-first/data-model reconciliation completed 2026-09-02; repository-local media recovery completed 2026-09-03; PR #28 content acceptance, PR #34 nested-list rendering, PR #36 UX polish, PR #38 Gear Notes externalization, and PR #39 Gear/Catch authored-Notes unification production-deployed by 2026-09-04. Project is in normal maintenance state.',
    'Context status');
  t = replaceOnce(t,
    '- `pwa/gear-app.js`\n- `pwa/media-owners.json`',
    '- `pwa/gear-app.js`\n- `pwa/gear-content/`\n- `pwa/apply-authored-notes.mjs`\n- `pwa/media-owners.json`',
    'Context Gear owners');
  t = replaceOnce(t, '- schema version `2`\n- data version `2026-09-04-my-gear-v2-final-content-1`', '- schema version `3`\n- data version `2026-09-04-my-gear-v3-external-notes-1`', 'Context Gear seed');
  t = replaceOnce(t,
    'My Gear owns structured product/setup facts. Optional `notes` is Markdown. `gear://` and `kb://` links inside Notes are authored navigation, not maintained domain relationships. Knots are intentionally not in My Gear.',
    'My Gear owns structured product/setup facts. Optional authored Notes live separately at `pwa/gear-content/<gear-id>.md`; inline JSON `notes` are retired. `gear://` and `kb://` links inside Notes are authored navigation, not maintained domain relationships. Knots are intentionally not in My Gear.',
    'Context Gear narrative');
  t = replaceOnce(t,
    '- source: `pwa/data/catches.seed.json`\n- **5 structured catches**',
    '- structured source: `pwa/data/catches.seed.json`\n- authored Notes: `pwa/catch-content/<catch-id>.md`\n- schema version `2`, data version `2026-09-04-catches-v2-external-notes-1`\n- **5 structured catches**',
    'Context Catch sources');
  t = replaceOnce(t,
    '- optional exact catch picture overrides Species-picture fallback',
    '- optional exact catch picture overrides Species-picture fallback\n- Catch narrative is one optional Markdown-backed **Notes** card; the old structured Exact Spot Notes / generated Notes / source-Provenance fields are retired',
    'Context Catch narrative');
  t = replaceRegexOnce(t, /### Latest verified runtime release\n\n[\s\S]*?\n### Current production lineage/, `### Latest verified runtime release\n\n${releaseBlock}\n\n### Current production lineage`, 'Context release section');
  t = replaceOnce(t, '- PR #36: Gear label / thumbnail / root-search UX polish', '- PR #36: Gear label / thumbnail / root-search UX polish\n- PR #38: external Gear Notes Markdown pipeline\n- PR #39: remove inline Gear Notes duplicates; externalize Catch Notes and retire Catch Provenance', 'Context sequence');
  t = replaceOnce(t,
    '- Gear leaf pages show structured facts plus optional Markdown **Notes**.',
    '- Gear leaf pages show structured facts plus optional external Markdown **Notes**.\n- Catch leaves show structured facts plus one optional external Markdown **Notes** card; no Provenance card.',
    'Context accepted Notes UI');
  await write('Fishing_Context.md', t);
}

// Fishing_New_Chat_Bootstrap_Prompt.md
{
  let t = await read('Fishing_New_Chat_Bootstrap_Prompt.md');
  t = replaceOnce(t, '- schema version `2`\n- data version `2026-09-04-my-gear-v2-final-content-1`', '- schema version `3`\n- data version `2026-09-04-my-gear-v3-external-notes-1`', 'Bootstrap Gear seed');
  t = replaceOnce(t,
    'My Gear owns structured owned facts such as manufacturer, model, specifications, typed external links, and stable identity. Optional `notes` is Markdown narrative.',
    'My Gear owns structured owned facts such as manufacturer, model, specifications, typed external links, and stable identity. Optional Notes are external Markdown at `pwa/gear-content/<gear-id>.md`; inline structured `notes` are retired.',
    'Bootstrap Gear narrative');
  t = replaceOnce(t,
    '`pwa/data/catches.seed.json` currently contains **5 catches**.\n\nCatch Log owns exact structured relationships required by current behavior:',
    '`pwa/data/catches.seed.json` currently contains **5 catches** (schema `2`, data version `2026-09-04-catches-v2-external-notes-1`). Optional authored Notes live at `pwa/catch-content/<catch-id>.md`.\n\nCatch Log owns exact structured relationships required by current behavior:',
    'Bootstrap Catch intro');
  t = replaceOnce(t,
    'Catch Log owns exact structured relationships required by current behavior: Species, Location, exactly one Lure/Bait, and optional setup/presentation references when actually recorded. Historical setup/technique is never inferred. Backlinks are computed rather than stored redundantly. Exact catch pictures override Species-picture fallback.',
    'Catch Log owns exact structured relationships required by current behavior: Species, Location, exactly one Lure/Bait, and optional setup/presentation references when actually recorded. Historical setup/technique is never inferred. Backlinks are computed rather than stored redundantly. Exact catch pictures override Species-picture fallback. Narrative/provenance fields are not stored in Catch JSON; Catch pages render one optional Markdown-backed **Notes** card.',
    'Bootstrap Catch narrative');
  t = replaceRegexOnce(t, /### Latest verified runtime release\n\n[\s\S]*?\n### Current authored-content lineage/, `### Latest verified runtime release\n\n${releaseBlock}\n\n### Current authored-content lineage`, 'Bootstrap release section');
  t = replaceOnce(t,
    '- Gear leaf pages use structured Manufacturer / Model, Specifications, Links, and optional Markdown Notes.',
    '- Gear leaf pages use structured Manufacturer / Model, Specifications, Links, and optional external Markdown Notes.\n- Catch leaves use structured facts/relationships plus one optional external Markdown Notes card; Provenance is retired.',
    'Bootstrap UI conventions');
  await write('Fishing_New_Chat_Bootstrap_Prompt.md', t);
}

// pwa/README.md
{
  let t = await read('pwa/README.md');
  t = replaceOnce(t,
    '- **My Gear** — structured local-first owned inventory plus lightweight Markdown Notes.\n- **Knowledge Base** — unified structured index over complete authored Markdown documents.\n- **Catch Log** — separate structured historical data that owns the exact cross-entity relationships current product behavior needs.',
    '- **My Gear** — structured local-first owned facts plus optional stable-ID Markdown Notes.\n- **Knowledge Base** — unified structured index over complete authored Markdown documents.\n- **Catch Log** — structured historical facts/relationships plus optional stable-ID Markdown Notes.',
    'PWA domain summary');
  t = replaceOnce(t, 'strict schema-v2 validation', 'strict schema-v3 validation', 'PWA diagram schema');
  t = replaceOnce(t, '- `gear-app.js` — all `#/inventory/...` routes and user-facing type-label aliases', '- `gear-app.js` — all `#/inventory/...` routes and user-facing type-label aliases\n- `gear-content/` — optional authored Notes keyed by Gear stable ID\n- `apply-authored-notes.mjs` — shared Gear/Catch Notes validation, materialization, and offline manifests', 'PWA Gear files');
  t = replaceOnce(t, '- schema version `2`\n- data version `2026-09-04-my-gear-v2-final-content-1`', '- schema version `3`\n- data version `2026-09-04-my-gear-v3-external-notes-1`', 'PWA Gear seed');
  t = replaceOnce(t,
    'Ordinary product facts are explicit structured data. Optional `notes` is Markdown narrative. Rods & Reels remain first-class setup records with embedded rod/reel value objects.',
    'Ordinary product facts are explicit structured data. Optional authored Notes live at `gear-content/<gear-id>.md` and are not duplicated in Gear JSON. Rods & Reels remain first-class setup records with embedded rod/reel value objects.',
    'PWA Gear narrative');
  t = replaceOnce(t,
    'Catch Log is separate because catches require exact historical relationships rather than general authored knowledge.\n\nEach record includes stable identity/date/size, required Species and Location IDs, exactly one Lure or Bait relationship, optional rod/reel setup and presentation/technique IDs when actually recorded, optional exact catch picture, Markdown narrative, and provenance.',
    'Catch Log is separate because catches require exact historical relationships rather than general authored knowledge. Structured Catch JSON contains only stable identity/date/size, required Species and Location IDs, exactly one Lure or Bait relationship, optional rod/reel setup and presentation/technique IDs when actually recorded, and an optional exact catch picture.\n\nOptional authored Catch Notes live separately at `catch-content/<catch-id>.md`. The old structured Exact Spot Notes, generated Notes, and source/Provenance fields are retired; Catch leaves render one optional **Notes** card from Markdown.',
    'PWA Catch model');
  t = replaceOnce(t, 'The Service Worker caches the shell, seed datasets, registered KB Content, local KB assets, and available build-time/local Gear images.', 'The Service Worker caches the shell, seed datasets, registered KB Content, validated Gear/Catch authored Notes manifests and Markdown, local KB assets, and available build-time/local Gear images.', 'PWA offline notes');
  t = replaceOnce(t, 'node pwa/build.mjs\nnode pwa/apply-local-media.mjs', 'node pwa/build.mjs\nnode pwa/apply-authored-notes.mjs\nnode pwa/apply-local-media.mjs', 'PWA build pipeline');
  t = replaceRegexOnce(t, /### Latest verified runtime release\n\n[\s\S]*?\nFor meaningful runtime changes,/, `### Latest verified runtime release\n\n${releaseBlock}\n\nFor meaningful runtime changes,`, 'PWA release section');
  t = t.replaceAll('My Gear v2 editing', 'My Gear editing');
  await write('pwa/README.md', t);
}

// pwa/DATA_MODEL_RECONCILIATION_DESIGN.md
{
  let t = await read('pwa/DATA_MODEL_RECONCILIATION_DESIGN.md');
  t = replaceRegexOnce(t, /^\*\*Reconciled through:\*\* .*$/m, '**Reconciled through:** 2026-09-04 / PR #39 / production `e997492b995f7e7cb8fa4af21ef1f2953df63a78` / run #197', 'Design reconciled through');
  t = replaceOnce(t, 'strict schema-v2 validation', 'strict schema-v3 validation', 'Design Gear diagram');
  t = replaceOnce(t, 'Current production seed: schema version `2`, data version `2026-09-04-my-gear-v2-final-content-1`, **63 records**.', 'Current production seed: schema version `3`, data version `2026-09-04-my-gear-v3-external-notes-1`, **63 records**.', 'Design Gear seed');
  t = replaceOnce(t, 'My Gear owns owned identity and product/setup facts: manufacturer, model, specifications, typed external links, and item/setup-specific Notes.', 'My Gear owns owned identity and product/setup facts: manufacturer, model, specifications, and typed external links. Item/setup-specific Notes are authored separately at `pwa/gear-content/<gear-id>.md` and are not duplicated in structured Gear records.', 'Design Gear ownership intro');
  t = replaceOnce(t, '- item/setup-specific Markdown Notes;', '- item/setup-specific authored Markdown Notes keyed by stable ID under `pwa/gear-content/`;', 'Design Gear owns bullets');
  t = replaceOnce(t, '- catch-specific narrative and provenance.', '- catch-specific authored Markdown Notes keyed by stable ID under `pwa/catch-content/`; provenance is not a current Catch UI/data field.', 'Design Catch owns bullets');
  t = replaceOnce(t, '## 7. My Gear schema v2', '## 7. My Gear schema v3', 'Design Gear section title');
  t = replaceOnce(t, '"schemaVersion": 2,\n  "dataVersion": "YYYY-MM-DD-my-gear-v2",', '"schemaVersion": 3,\n  "dataVersion": "YYYY-MM-DD-my-gear-v3",', 'Design Gear envelope');
  t = replaceOnce(t,
    'Ordinary items contain accepted structured fields for stable ID, category, type, name, manufacturer, model, specifications, links, and optional Markdown `notes`. Rods & Reels remain first-class setup records with embedded rod/reel product value objects and optional Notes.\n\nRetired/rejected from schema v2:',
    'Ordinary items contain accepted structured fields for stable ID, category, type, name, manufacturer, model, specifications, and links. Rods & Reels remain first-class setup records with embedded rod/reel product value objects. Optional Notes are external Markdown at `pwa/gear-content/<stable-id>.md`; `notes` is not an accepted structured field.\n\nRetired/rejected from schema v3:',
    'Design Gear v3 fields');
  t = replaceOnce(t, '- exact spot/depth/structure/conditions belong in catch Markdown narrative;', '- exact spot/depth/structure/conditions belong in optional `pwa/catch-content/<catch-id>.md` authored Notes;', 'Design Catch notes rule');
  t = replaceOnce(t, '- Catch Log remains structured JSON until an editing feature justifies a writable repository/store.', '- Catch Log keeps structured facts/relationships in JSON and optional authored Notes in stable-ID Markdown until an editing feature justifies a writable repository/store.', 'Design storage symmetry');
  t = replaceOnce(t, '- strict exact Gear record shapes and legacy-field rejection;', '- strict exact Gear schema-v3 record shapes, including rejection of inline `notes` and legacy fields;', 'Design validation Gear');
  t = replaceOnce(t, '- Catch type/category relationships and exactly one lure/bait per Catch;', '- Catch schema-v2 exact fields/type/category relationships and exactly one lure/bait per Catch;\n- one-to-one stable-ID validation/materialization for external Gear and Catch Notes;', 'Design validation Catch');
  t = replaceOnce(t, '- PR #34 — indentation-aware nested Markdown list rendering', '- PR #34 — indentation-aware nested Markdown list rendering\n- PR #36 — root-search/thumbnail/Trolling presentation polish\n- PR #38 — external Gear Notes pipeline introduced\n- PR #39 — Gear schema v3 removed inline Notes; Catch schema v2 externalized authored Notes and retired Provenance', 'Design release sequence');
  t = replaceRegexOnce(t, /Latest verified runtime release:\n\n[\s\S]*?Latest audited production content checkpoint before nightly reconciliation:/, `Latest verified runtime release:\n\n- PR #39 exact tested head \`${RELEASE.prHead}\`\n- CI #${RELEASE.prRunNumber} / \`${RELEASE.prRun}\` success\n- merge \`${RELEASE.merge}\`\n- production #${RELEASE.prodRunNumber} / \`${RELEASE.prodRun}\` tests + build + authored-Notes/local-media validation + bundle verification + Pages deploy success\n\nLatest audited production content checkpoint before nightly reconciliation:`, 'Design latest release');
  await write('pwa/DATA_MODEL_RECONCILIATION_DESIGN.md', t);
}

// pwa/KB_DATA_MODEL_DESIGN.md
{
  let t = await read('pwa/KB_DATA_MODEL_DESIGN.md');
  t = replaceRegexOnce(t, /^\*\*Current implementation verification:\*\* .*$/m,
    `**Current implementation verification:** The unified KB/Catch architecture originated in PR #13, was extended with flat Equipment taxonomy in PR #24, hardened for transformed Gear-backed pictures in PR #30, completed authored-content acceptance in PR #32, gained indentation-aware nested Markdown lists in PR #34, and converged authored narrative storage in PR #39. Latest verified runtime merge is \`${RELEASE.merge}\`; production run #${RELEASE.prodRunNumber} / \`${RELEASE.prodRun}\` completed tests, build, authored-Notes/local-media validation, bundle verification, GitHub Pages artifact upload, and deployment successfully.`,
    'KB design verification');
  t = replaceOnce(t,
    'pwa/data/catches.seed.json       # Structured Catch Log\npwa/kb-content/',
    'pwa/data/catches.seed.json       # Structured Catch Log facts/relationships\npwa/catch-content/                  # Optional Catch Notes keyed by stable Catch ID\npwa/gear-content/                   # Optional Gear Notes keyed by stable Gear ID\npwa/apply-authored-notes.mjs        # Shared authored-Notes validation/materialization/manifests\npwa/kb-content/',
    'KB design source layout');
  t = replaceOnce(t, '"schemaVersion": 1,\n  "dataVersion": "YYYY-MM-DD-catches-v1",', '"schemaVersion": 2,\n  "dataVersion": "YYYY-MM-DD-catches-v2",', 'KB design Catch envelope');
  t = replaceOnce(t,
    '- Markdown exact-spot/depth/structure/conditions narrative;\n- optional `rodReelSetupId` only when known;\n- optional presentation/technique reference only when explicitly recorded;\n- exactly one Lure or Bait stable ID plus name snapshot;\n- optional exact catch picture;\n- catch-specific Markdown notes and provenance.',
    '- optional `rodReelSetupId` only when known;\n- optional presentation/technique reference only when explicitly recorded;\n- exactly one Lure or Bait stable ID plus name snapshot;\n- optional exact catch picture;\n- optional authored Notes at `pwa/catch-content/<catch-id>.md`, keyed deterministically by stable Catch ID.\n\nStructured Catch records do **not** contain Exact Spot Notes, generated Notes, or source/Provenance fields. Existing user-authored Exact Spot Notes were migrated verbatim into the external Notes files in PR #39.',
    'KB design Catch rules');
  t = replaceOnce(t, '- Catch Species/Location/Gear/presentation references resolve to valid targets/categories;', '- Catch schema-v2 exact fields and Species/Location/Gear/presentation references resolve to valid targets/categories;\n- external Catch Notes files map one-to-one to valid Catch stable IDs and are materialized into the deployable/offline bundle;', 'KB design validation');
  t = replaceOnce(t, 'If future KB/Catch editing is requested, add a repository/store layer only when the editing feature justifies it.', 'If future KB/Catch editing is requested, add a repository/store layer only when the editing feature justifies it. Catch structured facts remain JSON while authored Notes remain stable-ID Markdown until such a feature requires another persistence layer.', 'KB design editing');
  t = replaceRegexOnce(t, /Latest verified runtime release:\n\n[\s\S]*?Latest verified production content checkpoint:/, `Latest verified runtime release:\n\n- PR #39 exact tested head \`${RELEASE.prHead}\`\n- PR CI #${RELEASE.prRunNumber} / \`${RELEASE.prRun}\` — success\n- merge \`${RELEASE.merge}\`\n- production #${RELEASE.prodRunNumber} / \`${RELEASE.prodRun}\` — tests, build, authored-Notes/local-media validation, bundle verification, Pages artifact, and Deploy to GitHub Pages all succeeded\n\nLatest verified production content checkpoint:`, 'KB design latest release');
  await write('pwa/KB_DATA_MODEL_DESIGN.md', t);
}

// Fishing_Decision_Log.md
{
  let t = await read('Fishing_Decision_Log.md');
  t = replaceRegexOnce(t, /^\*\*Status:\*\* .*$/m,
    '**Status:** Active decision history. Migration closed 2026-08-29; My Gear local-first refactor completed 2026-09-01; unified KB/Catch model and cross-domain reconciliation completed 2026-09-02; flat Equipment type/media recovery established 2026-09-03; final content acceptance, nested-list rendering, PR #36 UX polish, PR #38 Gear Notes externalization, and PR #39 Gear/Catch authored-Notes unification production-verified on 2026-09-04.',
    'Decision status');
  const anchor = '| 2026-09-02 | My Gear schema v2 | Remove profiles, structured usage/connections, `knowledgeRefs`, setup `mainLine`/`leader`, raw HTML guidance, and unknown structural fields; use optional Markdown Notes. | Preserve v1 guidance/profile model. | Simplifies My Gear into owned facts + lightweight narrative and aligns it with shared architectural principles. | CURRENT / IMPLEMENTED | `pwa/gear-model.js`; `pwa/data/gear.seed.json`; PR #16 |';
  const row = `${anchor}\n| 2026-09-04 | Authored Notes storage unification | Keep structured Gear/Catch records limited to durable facts/relationships; store optional user-authored narrative as stable-ID Markdown (`gear-content/<gear-id>.md`, `catch-content/<catch-id>.md`). Gear schema v3 rejects inline \`notes\`; Catch schema v2 rejects Exact Spot Notes/generated Notes/source-Provenance fields and renders one Notes card. | Keep duplicate inline JSON narrative; keep separate Exact Spot Notes + Notes + Provenance Catch cards. | One editable Markdown narrative surface per record aligns Gear and Catch authoring, avoids duplicated content, keeps structured schemas stable, and reuses one renderer/build/offline pattern. | CURRENT / IMPLEMENTED | \`pwa/gear-content/\`; \`pwa/catch-content/\`; \`pwa/apply-authored-notes.mjs\`; PR #38; PR #39 |`;
  t = replaceOnce(t, anchor, row, 'Decision authored Notes row');
  await write('Fishing_Decision_Log.md', t);
}

// Fishing_TODO.md
{
  let t = await read('Fishing_TODO.md');
  t = replaceOnce(t,
    'The application has three durable data domains: My Gear uses structured JSON/IndexedDB, the Knowledge Base uses a unified structured entity index over complete Markdown documents, and Catch Log is separate structured historical data.',
    'The application has three durable data domains: My Gear uses structured JSON/IndexedDB for facts plus stable-ID Markdown Notes, the Knowledge Base uses a unified structured entity index over complete Markdown documents, and Catch Log uses structured historical facts/relationships plus stable-ID Markdown Notes.',
    'TODO architecture intro');
  t = replaceOnce(t,
    '| FISH-TODO-045 | P2 | DEFERRED | PWA / My Gear v2 editing | Add normal Add/Edit/Delete forms and expose validated JSON import/export when v2 work resumes. | Current UI remains browse-only. Future bulk-edit preference is Export JSON → edit externally → Import JSON; no raw JSON editor. |',
    '| FISH-TODO-045 | P2 | DEFERRED | PWA / My Gear editing | Add normal Add/Edit/Delete forms and expose validated JSON import/export when editing work resumes against the current schema. | Current UI remains browse-only. Future bulk-edit preference is Export JSON → edit externally → Import JSON; no raw JSON editor. External Markdown Notes remain a separate authored-content surface. |',
    'TODO editing item');
  const completedAnchor = '| FISH-TODO-056 | 2026-09-04 | PWA / UX polish | PR #36 changed the user-facing My Gear lure label from `Trolling lures` to **Trolling** without a data migration, made Gear/KB/Catch card thumbnails square with white `object-fit: contain` letterboxing so wide images are not cropped, and fixed root My Gear/KB Search so category cards disappear while results are shown directly below the page controls. Exact head `30c8fb265b66d9287efe7fe3c34f732f98f9f7ca` passed PR CI #176 / `33893140327`; merge `15c5ac6f8f3d37ad8b884436c6312083b1939921`; production #177 / `33893200789` passed all tests, build, transformed/local-media validation, bundle verification, Pages artifact upload, and deployment. |';
  const completedRow = `${completedAnchor}\n| FISH-TODO-057 | 2026-09-04 | PWA / authored Notes architecture | PR #38 established external My Gear Markdown Notes; PR #39 completed the cleanup by moving My Gear to schema v3 with no inline \`notes\`, moving Catch Log to schema v2 with the five user-authored Exact Spot Notes preserved verbatim as \`pwa/catch-content/<catch-id>.md\`, retiring generated Catch Notes and Provenance/source, and rendering one optional Catch Notes card through the shared authored-Notes pipeline. PR #39 exact head \`${RELEASE.prHead}\` passed CI #${RELEASE.prRunNumber} / \`${RELEASE.prRun}\`; merge \`${RELEASE.merge}\`; production #${RELEASE.prodRunNumber} / \`${RELEASE.prodRun}\` passed all tests, build, authored-Notes/local-media validation, bundle verification, Pages artifact upload, and deployment. |`;
  t = replaceOnce(t, completedAnchor, completedRow, 'TODO completed authored Notes');
  await write('Fishing_TODO.md', t);
}

await fs.rm(new URL(import.meta.url));
console.log('PR #39 durable-state documentation reconciliation complete.');
