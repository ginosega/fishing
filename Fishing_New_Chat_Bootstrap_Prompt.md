# Fishing New Chat Bootstrap Prompt

**Status:** ACTIVE HANDOFF — STRUCTURED MY GEAR / KB REDESIGN NEXT

Copy the prompt below into a new Fishing chat.

---

You are helping with my persistent **Fishing** project. The durable project repository is `ginosega/fishing` on GitHub. Do not rely on assumptions from an old chat; restore current state from the repository first.

## First actions in this new chat

Read these files first, in order:

1. `README.md`
2. `Fishing_Context.md`
3. `Fishing_TODO.md`
4. `Fishing_Decision_Log.md`
5. `pwa/README.md`

Then, depending on the task:

- For **My Gear data/content**, inspect `pwa/data/gear.seed.json`, `pwa/gear-model.js`, `pwa/gear-store.js`, and `pwa/gear-app.js`.
- For **Knowledge Base/planner work**, read the relevant Markdown topic files, especially `Topics/Rods_Reels_Line_Knots.md`, `Topics/Fishing_Techniques.md`, `Topics/Local_Waters_Locations.md`, and `Topics/Trip_Logs_Field_Observations.md`.
- Use `Fishing_Gear_Registry.md` and `Fishing_Tackle_Inventory.md` as migrated/reference/transitional material when useful, but **do not treat them as the My Gear PWA data source**.

Other topic files:

- `Topics/Bonafide_RVR119_Kayak.md`
- `Topics/Kayak_Rigging_Accessories_Storage.md`
- `Topics/Fish_Finder_Electronics_Wiring.md`
- `Topics/Safety_Regulations_Fish_Handling.md`
- `Topics/Maintenance_Repairs_Procedures.md`
- `Topics/Researched_Candidate_Gear.md`

## Current project architecture — important

The project now has **two data domains**.

### 1. My Gear — structured local-first

My Gear was refactored on 2026-09-01 and **no longer parses Markdown tables for inventory records**.

Architecture:

```text
pwa/data/gear.seed.json
        ↓
schema validation
        ↓
IndexedDB local store
        ↓
GearRepository
        ↓
structured My Gear UI
```

Key files:

- `pwa/data/gear.seed.json` — bundled baseline/portable dataset
- `pwa/gear-model.js` — schema/validation/display helpers
- `pwa/gear-store.js` — IndexedDB repository
- `pwa/gear-app.js` — My Gear routes/rendering
- `pwa/media-ui.js` — presentation/media only; must not mutate gear facts

Current seed metadata:

- schema version `1`
- data version `2026-09-01-my-gear-v1`

Current My Gear categories:

- Rods & Reels
- Line
- Weights
- Snaps & Swivels
- Hooks
- Lures
- Bait

**Knots are not My Gear records.** They belong in the Knowledge Base domain and were intentionally removed from My Gear because they do not fit the gear model (manufacturer/model/etc.). Gear may later reference KB knot IDs.

The structured model explicitly stores category, type, manufacturer, model, optional specifications, typed links, optional connection guidance, optional usage guidance, and stable IDs. Do not reintroduce parsing heuristics to infer manufacturer/model/link types from Markdown.

### 2. Knowledge Base / planner — transitional Markdown

The Knowledge Base/planner has **not yet been redesigned**. The legacy application still consumes selected migrated Markdown for techniques, locations, current catch history, and planner behavior.

This is deliberately transitional. Before deeper KB work, we need to decide whether the Knowledge Base should use a structured or hybrid model and how to represent:

- Knots
- techniques and rigs
- species
- season/depth/structure relationships
- locations
- narrative knowledge
- stable relationships to My Gear
- catch history/provenance

Do not automatically extend the old Markdown-parser architecture merely because it exists.

## Current Fishing Companion production state

Live site:

`https://ginosega.github.io/fishing/`

Structured My Gear refactor:

- PR #9
- merge commit `972dca92812d4e129ab7311e64a0915e3f158c69`

A Sev 1 regression was found immediately afterward: gear category cards could not open leaf pages because the legacy router and structured My Gear router both reacted to `#/inventory/...` hashes; the My Gear header layout also regressed and a temporary My Gear import/export card was unwanted.

That was fixed in **PR #10**.

Current verified production commit:

`8af0c654168cdefad37f79368719ac66a69c98b1`

Production GitHub Actions run:

**#70 / 33590304599**

Verified successful:

- JavaScript validation
- structured My Gear model tests
- My Gear routing/layout regression tests
- PWA build
- bundle verification
- GitHub Pages artifact
- GitHub Pages deployment

The routing boundary is now explicit:

- `pwa/gear-app.js` owns all `#/inventory/...` routes.
- `pwa/legacy-app-loader.js` loads the legacy `app.js` only for Home/Knowledge Base/planner routes.
- `pwa/my-gear-routing.test.mjs` guards this boundary.

## Current accepted My Gear UI requirements

After PR #10, current intended behavior is:

- Home My Gear card subtext: **`Browse your inventory of equipment, tackle, and bait`**
- My Gear page title and subtitle on the **left**, Back button on the **right**
- My Gear subtitle: **`Browse your inventory of equipment, tackle, and bait`**
- no Knots category in My Gear
- no visible **My Gear data** card
- no current Export/Import buttons
- category cards open category pages
- gear cards open leaf pages rather than bouncing back to My Gear
- applicable leaf pages use **Manufacturer / Model**, **Specifications**, **Links**
- manufacturer links display only the manufacturer's name
- retailer links are separate typed links
- catch history appears only where appropriate (rod/reel setups, lures, bait)
- images/media viewer remain presentation-only

The immediate next action is to **retest this post-PR #10 My Gear flow**. If it looks correct, move on to the Knowledge Base architecture discussion rather than adding v2 My Gear editing features.

## v2 editing scope — deferred

I do plan eventually to add normal My Gear forms such as **Add a new hook** and **Edit this page**, but **do not build those yet**.

Also do not expose JSON import/export in the current v1 UI. We discussed JSON export → edit externally → import as a useful future bulk-edit workflow, but I specifically asked to remove the temporary My Gear data card for now.

When v2 work resumes:

- normal forms are the everyday CRUD path;
- JSON export/import can be a bulk-edit/backup path;
- do **not** add an in-app raw JSON editor.

## Current core fishing setup

### Kayak

- Bonafide RVR119, paddle-only.
- No pedal drive, motor, anchor, stakeout pole, or drift sock currently documented as owned.
- Humminbird Helix 5 CHIRP DI GPS G3 with XNT 9 HW DI T transducer.
- Garmin Navionics phone app for detailed contours.

### Main spinning setup

- Daiwa Tatula XT `TATULAXT702MFS`
- 7', medium power, fast action, 2-piece
- Daiwa Exceler LT `EXELT2500D-XH`, 6.2:1 gear ratio
- Sufix 832 15 lb Hi-Vis Yellow braid, 300 yd
- Seaguar InvizX 8 lb fluorocarbon leader

### Main baitcasting setup

- Shimano Zodias `ZDC72MHB`, 7'2", medium-heavy, fast
- Shimano 22 SLX DC XT 71HG, 7.4:1 gear ratio
- PowerPro Super8 Slick V2 30 lb Moss Green braid
- Seaguar InvizX 12 lb fluorocarbon leader

### Shore trout spincast setup

- Pflueger President Spincast Combo
- part `PRESSC-606L2CBO`
- 6'6" medium-power 2-piece rod
- reel rated 8-14 lb line, 3.8:1 gear ratio
- recommended 6 lb mono

Jacob and I share tackle; his smaller hard baits generally fit the spinning setup best.

For kayak fishing plans, account for paddle-only boat control by favoring routes, controlled drifts, trolling passes, and casting ahead rather than assuming stationary hovering.

## Important My Gear content decisions already incorporated

The deep My Gear scrub immediately before the data refactor corrected many product identities/specs/links and should not be lost. The structured seed was created from that reviewed content.

Important examples:

- Sufix 832 manufacturer link is Sufix/Rapala; no separate original Amazon link.
- PowerPro Super8 Slick V2 has explicit PowerPro/Shimano manufacturer link.
- Seaguar InvizX manufacturer link is explicit; 8 lb has original Amazon retailer link, 12 lb has original Tackle Warehouse retailer link.
- Cylinder weights: `THKFISH / 28 pcs sinkers set`.
- Egg sinkers: `Eagle Claw / Egg sinkers`.
- Swiveling trolling sinkers: `Eagle Claw / Swiveling trolling sinkers`.
- Glass beads: `Top Brass / Czechoslovakian Glass Beads`.
- VMC Crossover Rings model: `Crossover rings`.
- VMC Redline Weedless Wacky Neko model: `Redline Weedless Wacky Neko`.
- Gamakatsu G-Finesse Drop Shot Hook model: `G-Finesse Drop Shot Hook`.
- Gamakatsu EWG Worm Offset Hook model: `EWG Worm Offset Hook`.
- South Bend Hook Assortment combines standard and Aberdeen/long-shank hooks.
- Lure type names include **Jigs** and **Soft plastics**.
- Panther Martin entries were removed after identifying the owned spinner as Mepps Aglia #3.
- Owned inline-spinner records include Mepps Aglia #3 plus two Generic spinner records.
- Acme is the manufacturer for Kastmaster.
- Dick Nite spoon guidance includes: rig split rings top/bottom with the single hook point toward the concave side, and fish with a bit of nightcrawler or PowerBait egg.

For exact values, trust `pwa/data/gear.seed.json` rather than reconstructing from this summary.

## Media state

The PWA caches representative product images at build time and has a zoom viewer. Previous blocker fixes established:

- minimum/100% view contains the full source image;
- pinch zoom/pan and +/-/reset work;
- mobile viewer stays inside the visible dynamic viewport with accessible close control;
- full exact Tatula XT product image is used;
- Pearl White Flicker Shad 5 image was corrected;
- requested manufacturer-source images were refreshed where verifiable.

The two Tsuridamashii products still have **no product image**. Amazon blocks reliable automated retrieval, and exact external mirrors also did not yield usable image responses. Do not substitute unverified look-alike images.

## Knowledge-base migration history

The OneNote PDF was migrated to GitHub Markdown. The later OneNote MHT export restored external hyperlinks inline. On 2026-08-29, I designated OneNote as the most up-to-date historical source of truth and closed the migration audit without requiring exhaustive reconciliation of every earlier ChatGPT transcript.

Historical chats remain useful supplemental evidence, but they are not a completeness gate. Do not resurrect old rejected/superseded ideas without checking current files and the decision log.

## Evidence/status labels for Markdown knowledge/reference material

- **OWNED / INSTALLED** — actually owned or installed.
- **USER VERIFIED** — physically measured, inspected, or explicitly confirmed by me.
- **USER OBSERVED** — behavior I personally observed.
- **MANUFACTURER DOCUMENTED** — exact manufacturer documentation.
- **ONENOTE SOURCE** — imported from OneNote PDF.
- **ONENOTE LINK RESTORED** — URL recovered from OneNote MHT.
- **HISTORICAL CHAT SEED** — supplemental prior-chat evidence.
- **RESEARCHED / CANDIDATE** — considered but not purchased/installed.
- **REJECTED / SUPERSEDED** — no longer current.
- **PROBABLE** — strong inference, not verified.
- **UNKNOWN / UNRESOLVED** — not established.

Do not convert candidate gear into owned gear unless I confirm it or current durable data already establishes ownership.

## Current open priorities

Use `Fishing_TODO.md` as canonical. Especially important now:

1. Finish post-PR #10 My Gear acceptance testing.
2. Redesign the **Knowledge Base** data model before deeper KB work; Knots belong there.
3. Later move catch history to structured records with stable gear/setup/location references.
4. Defer My Gear CRUD forms and JSON import/export UI until v2.
5. Resolve PowerBait hook-size conflict (#4 in OneNote rig vs prior #8 guidance).
6. Resolve loop-knot conflict during the KB/knot redesign.
7. Verify actual fish-finder power/wiring installed state.
8. Verify Bonafide RVR119 brass insert/thread sizes.
9. Resolve rear flush rod-holder angle modification.
10. Confirm purchase status of Bonafide under-seat tackle storage and YakAttack fish cooler bag.

## Durable update rules

Use the correct owner for the data domain:

### My Gear

- Update `pwa/data/gear.seed.json` for durable baseline My Gear data changes while the current database is seed-managed.
- Keep schema/stable IDs valid; update tests when model invariants change.
- Do not patch presentation code to correct data that belongs in the structured record.
- Do not fall back to Markdown parsing to derive My Gear facts.

### Knowledge Base / general fishing reference

- Update the appropriate `Topics/*.md` file and cross-reference rather than duplicating long content.
- Update `Fishing_TODO.md` and/or `Fishing_Decision_Log.md` for unresolved work or durable decisions.
- `Fishing_Gear_Registry.md` and `Fishing_Tackle_Inventory.md` remain useful migrated/reference material during the transition, but are not the My Gear application's source.

For current regulations, stocking, access, prices, availability, or conditions, recheck authoritative current sources.

## Development/deployment workflow

For meaningful PWA changes:

1. Fetch the latest `main` state/SHA.
2. Create a normal feature/fix branch.
3. Make coherent changes on that branch.
4. Open a PR and let **PR CI run build-only validation**.
5. Do not merge until the exact final head passes.
6. Merge normally.
7. Verify both production **build** and **GitHub Pages deploy** jobs before telling me it is live.

Avoid disposable Actions workflows and routine direct-to-main edits. Earlier temporary workflow experiments produced confusing failure notification emails; the normal branch/PR path is the preferred operating procedure.

If I give a requirement that would materially affect architecture, deployment, maintenance burden, performance, or usability, explain the impact and discuss its priority before letting it drive the design. This applies across application work, including TowCalc. Privacy/access control is P3 unless explicitly elevated.

## Immediate continuation instruction

Start by confirming the repository state and the PR #10 production deployment above. Then ask me to retest—or, if I already provide retest results, continue directly from them. Do **not** start Knowledge Base implementation until My Gear is accepted. Once My Gear is accepted, begin with a design discussion for the KB data model rather than coding immediately.

---

This bootstrap supersedes the pre-refactor Markdown-only bootstrap.
