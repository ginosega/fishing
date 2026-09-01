from pathlib import Path

feedback = Path('pwa/TESTING_FEEDBACK.md')
s = feedback.read_text()
marker = '## Knots — requested workflow/model changes'
if marker not in s:
    insert = '''## Knots — requested workflow/model changes

### Knots list page

- **UI/UX — ACCEPTED:** Remove Search because the current normalized knot list is below the general 12-card search threshold.
- **CARD DISPLAY — ACCEPTED:** Show only the knot name as the card title; no card subtext is needed.

### Individual Knot pages

- **LEAF SUBTITLE — ACCEPTED EXCEPTION:** Knot leaf pages show only `Knots` beneath the H1. Do not show `Saved knots` and do not force the general `[gear category] - [type]` pattern where no useful knot type exists.
- **CORE DISPLAY — KNOT-SPECIFIC:** Replace the generic Knot / OneNote Guidance region and separate link with two cards: **Description** and **Links**.
- **DESCRIPTION:** Use the already distilled knot description. Include cautions when the source indicates a knot may be a poor choice in some situations; the Loop knot weakness/conflict is the key example.
- **LINKS — HIGH VALUE:** Preserve all knot links. Improve generic labels such as `video` or `link` to useful destination/video titles where practical. The first OneNote link for a knot is generally the canonical how-to video and should have a descriptive title.
- **REMOVE:** Do not show a separate **Knots & connections** section on knot pages.
- **HOW TO USE IT — RELATIONSHIP-DRIVEN:** List the important rigs, terminal tackle, lures, bait, and techniques that use the knot, with links to their pages. Keep these summaries concise; detailed technique instructions belong on the linked KB pages.

### Rods & Reels icon

- **UI/UX — ACCEPTED:** With Rods and Reels merged, use a single icon that clearly represents a fishing rod with a reel attached. Current implementation target is the `🎣` icon.

---

## First My Gear acceptance pass — checkpoint

- **STATUS:** First-pass review of Home + all My Gear categories is complete.
- **IMPLEMENTATION DECISION:** Implement the consolidated My Gear batch now, including normalized product/setup models, type-level reusable guidance, explicit linked relationships, duplicate-record fixes, search/filter heuristics, site-wide field/display rules, and dead-code cleanup.
- **NEXT:** Deploy the rebuilt PWA and perform a second My Gear acceptance pass before moving deeper into the Knowledge Base workflow.

---

'''
    s = s.replace('## Implementation status\n', insert + '## Implementation status\n')
    s = s.replace(
        '**QUEUED / DO NOT DEPLOY DURING FIRST PASS.** Continue reviewing remaining My Gear categories on the current stable build. Consolidate repeated patterns into reusable page/data-model rules before implementing the My Gear batch.',
        '**IMPLEMENTED / SECOND-PASS RETEST NEXT.** The first My Gear acceptance pass is complete and the consolidated refactor has been implemented. Next: deploy/verify the rebuilt PWA, then perform a second My Gear acceptance pass before deeper Knowledge Base testing.'
    )
    feedback.write_text(s)

tackle = Path('Fishing_Tackle_Inventory.md')
s = tackle.read_text().replace('| Wacky rigging | [VMC Crossover Rings]', '| Wacky | [VMC Crossover Rings]')
tackle.write_text(s)

todo = Path('Fishing_TODO.md')
s = todo.read_text()
old = '| FISH-TODO-035 | P1 | IN PROGRESS | Fishing Companion PWA | Build and acceptance-test the mobile/offline front end for the Fishing knowledge base. | MVP source is under `pwa/`: two workflows (`My Gear & Knots` and `Build a Fishing Plan`), runtime Markdown parsing, offline service worker, inventory/item pages, knot/connection guidance, deterministic plan ranking, catch-history matching, automated GitHub Pages build/deploy workflow, and cache-busting build assets. Live URL: `https://ginosega.github.io/fishing/`. Current product scope is single-user/personal; a public-but-non-advertised URL is acceptable. Next: complete browser/device acceptance testing and refine parser/ranking issues found in real use. |'
new = '| FISH-TODO-035 | P1 | IN PROGRESS | Fishing Companion PWA | Build and acceptance-test the mobile/offline front end for the Fishing knowledge base. | First My Gear acceptance pass completed and consolidated refactor implemented: Home now routes to **My Gear** and **Knowledge Base**; Rods & Reels are setup-centric; duplicate gear/line imports are removed; type/product-family grouping and reusable type-level knowledge are supported; gear leaf pages use normalized fields and explicit KB relationships. Live URL: `https://ginosega.github.io/fishing/`. Next: second My Gear acceptance pass, then deeper Knowledge Base/planner testing. |'
if old in s:
    s = s.replace(old, new)
if 'FISH-TODO-039' not in s:
    anchor = '| FISH-TODO-037 | P3 | DEFERRED | PWA / multi-user product | Generalize Fishing Companion for multiple users. | Current app remains intentionally single-user/personal even though its deployment URL may be publicly reachable. Future product concept: users maintain their own inventories, fishing locations, and catch logs while sharing the generic planner/knowledge architecture. Revisit only after the personal version is mature. |'
    extra = anchor + '\n| FISH-TODO-039 | P2 | OPEN | PWA / catch history | Add rod/reel setup to future catch-log records. | Setup-specific catch history cannot be reliable until catches record the setup used. Do not invent historical setup attribution unless recoverable or user-confirmed. |\n| FISH-TODO-040 | P3 | WAITING ON USER | Gear registry | Identify the exact rod on the owned spincast setup. | Current setup is a Pflueger President push-button/spincast reel on a short rod; user will provide the rod make/model when available. |'
    s = s.replace(anchor, extra)
todo.write_text(s)

decisions = Path('Fishing_Decision_Log.md')
s = decisions.read_text()
decision = '| 2026-08-31 | Fishing Companion / My Gear architecture | Model My Gear around normalized owned records plus reusable type-level knowledge and explicit relationships. Rods & Reels are first-class setups shown in a flat grouped list (no intermediate setup-type pages); lure families aggregate owned variants without discarding variant detail; search/filter controls appear progressively based on list size/usefulness; applicable gear leaf pages standardize on Manufacturer / Model, Specifications, and Links while technique detail is linked rather than unnecessarily duplicated. | Keep generic inventory rows and mention-search rendering; expose every data hierarchy level as navigation; or normalize records and relationships while flattening phone UI | First-pass mobile testing showed duplicates, incorrect taxonomies, excessive hierarchy, and lossy mention summaries. Separating product/setup identity from reusable type guidance preserves Markdown as source of truth while making the field UI faster and more coherent. | CURRENT / IMPLEMENTED | `pwa/app.js`; `pwa/TESTING_FEEDBACK.md`; `Topics/Rods_Reels_Line_Knots.md`; `Fishing_Tackle_Inventory.md` |'
if decision not in s:
    s = s.replace('\n## Preserved research/candidate decisions\n', '\n' + decision + '\n\n## Preserved research/candidate decisions\n')
decisions.write_text(s)
