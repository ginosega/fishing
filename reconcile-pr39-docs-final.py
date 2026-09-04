from pathlib import Path

replacements = {
    'README.md': [
        ('`pwa/gear-model.js` — strict schema-v2 validation and display helpers', '`pwa/gear-model.js` — strict schema-v3 validation and display helpers'),
        ('PR #25 catch/media polish → PR #26 local-media hardening → PR #27 Recovery B → PR #28 final content/image batch → PR #29 reconciliation → PR #30 transformed-picture validation hotfix → PR #31 reconciliation → PR #32 final content acceptance → PR #33 reconciliation → PR #34 nested-list renderer fix → PR #35 night-end reconciliation → PR #36 UX polish.', 'PR #25 catch/media polish → PR #26 local-media hardening → PR #27 Recovery B → PR #28 final content/image batch → PR #29 reconciliation → PR #30 transformed-picture validation hotfix → PR #31 reconciliation → PR #32 final content acceptance → PR #33 reconciliation → PR #34 nested-list renderer fix → PR #35 night-end reconciliation → PR #36 UX polish → PR #38 external Gear Notes → PR #39 Gear/Catch authored-Notes unification.'),
        ('- Gear leaf pages use structured product facts plus optional Markdown **Notes**.', '- Gear leaf pages use structured product facts plus optional external Markdown **Notes**.'),
        ('## Deferred v2 editing features', '## Deferred My Gear editing features'),
    ],
    'pwa/README.md': [
        ('`gear-model.js` — strict schema-v2 validation/display helpers', '`gear-model.js` — strict schema-v3 validation/display helpers'),
        ('`DATA_MODEL_RECONCILIATION_DESIGN.md` — shared architectural principles and My Gear schema-v2 rationale', '`DATA_MODEL_RECONCILIATION_DESIGN.md` — shared architectural principles, current My Gear schema-v3 rationale, and authored-Notes ownership rules'),
        ('- leaf pages use structured Manufacturer / Model, Specifications, Links, and optional Markdown **Notes**', '- leaf pages use structured Manufacturer / Model, Specifications, Links, and optional external Markdown **Notes**'),
    ],
    'Fishing_Context.md': [
        ('## Deferred v2 behavior', '## Deferred My Gear editing behavior'),
    ],
    'Fishing_New_Chat_Bootstrap_Prompt.md': [
        ('**Status:** ACTIVE HANDOFF — PRODUCTION HEALTHY; PR #36 UX POLISH DEPLOYED; PR #28 ACCEPTANCE CLOSED — 2026-09-04', '**Status:** ACTIVE HANDOFF — PRODUCTION HEALTHY; PR #39 AUTHORED-NOTES UNIFICATION DEPLOYED; PR #28 ACCEPTANCE CLOSED — 2026-09-04'),
        ('- For **My Gear**, inspect `pwa/data/gear.seed.json`, `pwa/gear-model.js`, `pwa/gear-store.js`, `pwa/gear-app.js`, `pwa/media-owners.json`, `pwa/media-sources.json`, `pwa/local-media.json`, and `pwa/apply-local-media.mjs`.', '- For **My Gear**, inspect `pwa/data/gear.seed.json`, `pwa/gear-model.js`, `pwa/gear-store.js`, `pwa/gear-app.js`, `pwa/gear-content/`, `pwa/apply-authored-notes.mjs`, `pwa/media-owners.json`, `pwa/media-sources.json`, `pwa/local-media.json`, and `pwa/apply-local-media.mjs`.'),
        ('- For **Knowledge Base/Catch Log**, inspect `pwa/data/kb.seed.json`, `pwa/data/catches.seed.json`, `pwa/kb-model.js`, `pwa/kb-app.js`, `pwa/markdown-render.js`, and the relevant complete documents under `pwa/kb-content/`.', '- For **Knowledge Base/Catch Log**, inspect `pwa/data/kb.seed.json`, `pwa/data/catches.seed.json`, `pwa/catch-content/`, `pwa/apply-authored-notes.mjs`, `pwa/kb-model.js`, `pwa/kb-app.js`, `pwa/markdown-render.js`, and the relevant complete documents under `pwa/kb-content/`.'),
        ('PR #24 taxonomy → PR #25 catch/media polish → PR #26 local-media hardening → PR #27 Recovery B → PR #28 final MHT content/images → PR #29 reconciliation → PR #30 Gear-backed-picture production hotfix → PR #31 reconciliation → PR #32 final content acceptance → PR #33 reconciliation.', 'PR #24 taxonomy → PR #25 catch/media polish → PR #26 local-media hardening → PR #27 Recovery B → PR #28 final MHT content/images → PR #29 reconciliation → PR #30 Gear-backed-picture production hotfix → PR #31 reconciliation → PR #32 final content acceptance → PR #33 reconciliation → PR #34 nested-list rendering → PR #36 UX polish → PR #38 external Gear Notes → PR #39 Gear/Catch authored-Notes unification.'),
        ('## My Gear v2 editing — still deferred', '## My Gear editing — still deferred'),
        ('Update `pwa/data/gear.seed.json` for durable baseline Gear **data** changes; preserve stable IDs and strict schema-v2 validity; update tests when invariants change; data fixes belong in structured records, not presentation hacks.', 'Update `pwa/data/gear.seed.json` for durable baseline Gear **data** changes; preserve stable IDs and strict schema-v3 validity. Edit optional authored Notes in `pwa/gear-content/<gear-id>.md`; do not reintroduce inline JSON `notes`. Update tests when invariants change; data fixes belong in structured records, not presentation hacks.'),
        ('Update `pwa/data/kb.seed.json` for the entity index, registered documents under `pwa/kb-content/` for authored KB content, and `pwa/data/catches.seed.json` for structured catches. Preserve stable IDs and validate `gear://`, `kb://`, registered relative links, and Catch relationships. Do not infer domain relationships from prose.', 'Update `pwa/data/kb.seed.json` for the entity index, registered documents under `pwa/kb-content/` for authored KB content, `pwa/data/catches.seed.json` for structured Catch facts/relationships, and `pwa/catch-content/<catch-id>.md` for optional authored Catch Notes. Preserve stable IDs and validate `gear://`, `kb://`, registered relative links, Catch relationships, and authored-Notes ownership. Do not infer domain relationships from prose.'),
        ('FISH-TODO-052 (PR #28 formatting acceptance), FISH-TODO-055 (nested-list renderer defect), and FISH-TODO-056 (PR #36 UX polish) are complete and must not be presented as current work.', 'FISH-TODO-052 (PR #28 formatting acceptance), FISH-TODO-055 (nested-list renderer defect), FISH-TODO-056 (PR #36 UX polish), and FISH-TODO-057 (PR #39 authored-Notes architecture) are complete and must not be presented as current work.'),
        ('Treat My Gear schema v2, unified five-type KB Entity model, structured Catch Log, flat Equipment taxonomy, direct-GitHub image workflow, final transformed-data validation, retired Planner scope, browse-only My Gear behavior, heading-independent authored stable-ID links, indentation-aware nested Markdown list rendering, root-search replacement UX, and non-cropping square thumbnail presentation as durable decisions unless I explicitly reopen them.', 'Treat My Gear schema v3 with external stable-ID Notes, Catch schema v2 with external stable-ID Notes, the unified five-type KB Entity model, flat Equipment taxonomy, direct-GitHub image workflow, final transformed-data validation, retired Planner scope, browse-only My Gear behavior, heading-independent authored stable-ID links, indentation-aware nested Markdown list rendering, root-search replacement UX, and non-cropping square thumbnail presentation as durable decisions unless I explicitly reopen them.'),
    ],
    'pwa/KB_DATA_MODEL_DESIGN.md': [
        ('Only Catch records own catch relationships. Backlinks are computed at render time for applicable Location, Species, presentation/Technique/Equipment, setup, lure, and bait pages. KB/Gear records do not store duplicate catch-ID arrays.', 'Only Catch records own catch relationships. Backlinks are computed at render time for Location and Species KB pages and for applicable Gear setup/lure/bait pages. Equipment, Technique, and Knot KB pages do not currently render Catch backlinks. KB/Gear records do not store duplicate catch-ID arrays.'),
    ],
    'Fishing_Decision_Log.md': [
        ('| 2026-09-02 | My Gear schema v2 | Remove profiles, structured usage/connections, `knowledgeRefs`, setup `mainLine`/`leader`, raw HTML guidance, and unknown structural fields; use optional Markdown Notes. | Preserve v1 guidance/profile model. | Simplifies My Gear into owned facts + lightweight narrative and aligns it with shared architectural principles. | CURRENT / IMPLEMENTED | `pwa/gear-model.js`; `pwa/data/gear.seed.json`; PR #16 |', '| 2026-09-02 | My Gear schema v2 | Remove profiles, structured usage/connections, `knowledgeRefs`, setup `mainLine`/`leader`, raw HTML guidance, and unknown structural fields; use optional Markdown Notes. | Preserve v1 guidance/profile model. | This established the owned-facts + authored-narrative boundary later completed by schema v3, which moved Notes fully out of structured JSON. | SUPERSEDED BY SCHEMA V3 / HISTORICAL | `pwa/gear-model.js`; `pwa/data/gear.seed.json`; PR #16; PR #39 |'),
    ],
}

for filename, pairs in replacements.items():
    p = Path(filename)
    text = p.read_text()
    for old, new in pairs:
        if old not in text:
            raise RuntimeError(f'Missing expected text in {filename}: {old[:100]}')
        text = text.replace(old, new, 1)
    p.write_text(text)

Path(__file__).unlink()
print('Final PR #39 documentation consistency cleanup complete.')
