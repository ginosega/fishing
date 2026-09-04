# Fishing New Chat Bootstrap Prompt

**Status:** ACTIVE HANDOFF — PRODUCTION HEALTHY; PR #36 UX POLISH DEPLOYED; PR #28 ACCEPTANCE CLOSED — 2026-09-04

Copy the prompt below into a new **Chat-mode** Fishing conversation.

---

You are helping with my persistent **Fishing** project. The durable project repository is `ginosega/fishing` on GitHub. Do not rely on assumptions from an old chat; restore current state from the repository first.

## Operating mode

Operating mode: This project uses Chat mode by default. Do not recommend Work unless a task specifically requires a Work-only capability. Never recommend Work merely because the project or task is complex, lengthy, file-heavy, analytical, or involves creating artifacts. Explain the specific need and obtain my approval before recommending a temporary switch.

## First actions in this new chat

Read these files first, in order:

1. `README.md`
2. `Fishing_Context.md`
3. `Fishing_TODO.md`
4. `Fishing_Decision_Log.md`
5. `pwa/README.md`

Then, depending on the task:

- For **My Gear**, inspect `pwa/data/gear.seed.json`, `pwa/gear-model.js`, `pwa/gear-store.js`, `pwa/gear-app.js`, `pwa/media-owners.json`, `pwa/media-sources.json`, `pwa/local-media.json`, and `pwa/apply-local-media.mjs`.
- For **Knowledge Base/Catch Log**, inspect `pwa/data/kb.seed.json`, `pwa/data/catches.seed.json`, `pwa/kb-model.js`, `pwa/kb-app.js`, `pwa/markdown-render.js`, and the relevant complete documents under `pwa/kb-content/`.
- For data-model rationale, inspect `pwa/KB_DATA_MODEL_DESIGN.md` and `pwa/DATA_MODEL_RECONCILIATION_DESIGN.md`.
- Use `Topics/*.md`, `Fishing_Gear_Registry.md`, and `Fishing_Tackle_Inventory.md` only as migrated/reference history when useful; they are **not runtime application data sources**.

## Current architecture — important

Fishing Companion has three durable application-data domains that share identity/ownership/validation principles without forcing identical storage.

### 1. My Gear — structured local-first

- source/baseline: `pwa/data/gear.seed.json`
- schema version `2`
- data version `2026-09-04-my-gear-v2-final-content-1`
- **63 records** across Rods & Reels, Line, Weights, Snaps & Swivels, Hooks, Lures, and Bait
- live browser store: IndexedDB via `pwa/gear-store.js`
- all `#/inventory/...` routes: `pwa/gear-app.js`

My Gear owns structured owned facts such as manufacturer, model, specifications, typed external links, and stable identity. Optional `notes` is Markdown narrative.

Do **not** reintroduce the retired v1 concepts: profiles, structured usage/connections, setup `mainLine`/`leader`, speculative configuration/knowledgeRefs, raw HTML guidance, or inference from Markdown/display text.

Authored Notes may use `gear://stable-gear-id` and `kb://stable-kb-id`; those are navigation links, not maintained domain relationships.

**Knots are not My Gear records.**

Current **user-facing** lure type labels include **Soft plastics and swimbaits**, **Topwater**, and **Trolling**. The bundled seed still stores `Trolling lures`; `gear-app.js` intentionally maps that internal value to the user-facing `Trolling` label so this copy-only change does not force an IndexedDB seed migration.

### 2. Knowledge Base — unified indexed Markdown documents

Every KB entity uses the same envelope:

- stable `id`
- `type`: `location`, `species`, `equipment`, `technique`, or `knot`
- `name`
- optional `description`
- optional `picture`
- `content`: one complete Markdown document

Current seed:

- schema version `1`
- data version `2026-09-04-kb-v1-final-content-1`
- **54 entities**: 8 Locations, 7 Species, 22 Equipment, 7 Techniques, 10 Knots

**Equipment** is a flat peer type for rigs, presentations, lure/gear guides, and equipment-oriented fishing knowledge. **Technique** is for strategy, seasonal/condition guidance, species tactics, and other non-equipment methods. Existing stable `technique-*` IDs may remain unchanged when an article is classified as Equipment.

Equipment and Technique article bodies currently share `pwa/kb-content/techniques/`; the entity `type` determines the browse category. Content-only edits are valid. Do not rename or move a document without updating its registered `content` path in `pwa/data/kb.seed.json`.

Authored internal navigation may appear under `# Links`, `## Related`, or another sensible section. The durable invariant is a valid `gear://` / `kb://` stable-ID target, **not a particular Markdown heading**.

Markdown list indentation is semantic. `pwa/markdown-render.js` must preserve nested unordered/ordered list structure; do not flatten nested source or rewrite valid nested Markdown merely to accommodate the renderer.

### 3. Catch Log — structured historical relationships

`pwa/data/catches.seed.json` currently contains **5 catches**.

Catch Log owns exact structured relationships required by current behavior: Species, Location, exactly one Lure/Bait, and optional setup/presentation references when actually recorded. Historical setup/technique is never inferred. Backlinks are computed rather than stored redundantly. Exact catch pictures override Species-picture fallback.

## Retired product concepts

Do not reintroduce unless I explicitly reopen them:

- Planner / Planner Attributes
- fishing sessions / Session ID
- trip history or no-catch session model
- legacy Markdown fact parser/router
- fuzzy Gear identity matching
- fuzzy media-to-Gear matching

The current application is browse-focused and personal.

## Current Fishing Companion production state

Live site: `https://ginosega.github.io/fishing/`

### Latest verified runtime release

**PR #36 — Polish Gear labels, thumbnails, and root search UX**

- exact tested PR head: `30c8fb265b66d9287efe7fe3c34f732f98f9f7ca`
- PR CI: **#176 / 33893140327** — success
- merge commit: `15c5ac6f8f3d37ad8b884436c6312083b1939921`
- production workflow: **#177 / 33893200789** — success
- all tests/build/transformed-local-media validation/bundle verification: success
- GitHub Pages artifact + actual deployment: success

PR #36 implemented these durable presentation behaviors:

- My Gear displays `Trolling lures` as **Trolling** without changing the stored seed value.
- Gear, KB, and Catch card thumbnails use square white frames and `object-fit: contain`; full wide/tall images remain visible with white letterboxing instead of cropping.
- On root My Gear and Knowledge Base pages, entering a Search query hides the category cards and shows matching result cards immediately below the page controls. A global `[hidden] { display: none !important; }` rule protects this behavior from grid/list display declarations.

PR #34 remains the earlier renderer fix for nested Markdown lists.

### Current authored-content lineage

PR #36 was created from exact `main` `97857fb947603c9e27a683b8c1f646fd540b1a1a`, preserving all direct user-authored Markdown changes through `trilene.md`. The runtime merge `15c5ac6f8f3d37ad8b884436c6312083b1939921` contains that content unchanged plus the PR #36 UX changes.

The earlier night-end content checkpoint `955d37bf675f3163fe610324809a972916c98ef0` / run #166 remains historical audit evidence, not the current production head.

### Recovery/acceptance sequence is closed

PR #24 taxonomy → PR #25 catch/media polish → PR #26 local-media hardening → PR #27 Recovery B → PR #28 final MHT content/images → PR #29 reconciliation → PR #30 Gear-backed-picture production hotfix → PR #31 reconciliation → PR #32 final content acceptance → PR #33 reconciliation.

No separate post-PR #29 hidden/unmerged application build was found. PR #34 and later PRs are normal subsequent maintenance.

## Current UI/content conventions

- Root My Gear and root Knowledge Base always have Search.
- When a root Search query becomes non-empty, the category-card grid is hidden and matching results appear directly under the title/back/search controls.
- Browse-list Search appears at **10 or more entries** and is omitted below 10.
- On pages with both Search and a dropdown/filter, the filter is right-aligned.
- Line is intentionally flat; Rods & Reels retains grouping.
- My Gear contains no Knots category and remains browse-only: no Add/Edit/Delete forms and no visible import/export UI.
- Gear leaf pages use structured Manufacturer / Model, Specifications, Links, and optional Markdown Notes.
- KB representative pictures that depict a specific owned item may store explicit `gearItemId` and link the caption to that My Gear leaf.
- Authored stable-ID links are heading-independent.
- Nested lists must preserve Markdown indentation in Fishing Companion.
- Gear/KB/Catch card thumbnails must show the complete source image inside a square white frame; do not crop wide images or require square source files.

Current user-facing lure type labels include **Soft plastics and swimbaits**, **Topwater**, and **Trolling**.

## Media workflow — standing rule

For future user-supplied images:

1. You specify the exact feature branch, repository path, and filename.
2. I upload the binary image directly to GitHub myself on that branch.
3. You verify the GitHub file.
4. You update `pwa/local-media.json`, data, Markdown, tests, and build checks as appropriate.
5. **Do not try to base64-encode or upload image binaries through ChatGPT/GitHub connector calls.**

`pwa/apply-local-media.mjs` validates repository-local image size, signature/structure, and filename extension, copies active local assets into `dist`, verifies built bytes, updates built media/KB metadata, and revalidates the final transformed KB bundle.

A build step that mutates already-validated structured data must validate the **final deployable transformed data** after the mutation. Source-only validation is not sufficient.

The square thumbnail presentation rule does **not** require rewriting image binaries; it is implemented in CSS.

## Direct Markdown editing convention

For deliberate one-file authored-content cleanup, direct editing of `pwa/kb-content/**` in GitHub is acceptable. Do not rename/move registered KB files without updating `kb.seed.json`.

Be aware that every `pwa/**` commit triggers the shared Fishing Pages workflow. The workflow uses one global `fishing-pages` concurrency group with `cancel-in-progress: true`, so overlapping direct `main` edits can cancel an in-progress PR or production run. During coordinated runtime changes, avoid overlapping direct content pushes until exact-head CI/deploy has completed.

## My Gear v2 editing — still deferred

Do not build editing UI unless I explicitly resume it. When resumed, normal forms are the everyday Add/Edit/Delete path; validated JSON export/import may support backup/bulk editing; no in-app raw JSON editor.

## Current core fishing setup

- Kayak: Bonafide RVR119, paddle-only; no motor/anchor/drift sock currently documented as owned.
- Electronics: Humminbird Helix 5 CHIRP DI GPS G3 + XNT 9 HW DI T; Garmin Navionics phone app for detailed contours.
- Spinning: Daiwa Tatula XT `TATULAXT702MFS` + Daiwa Exceler LT `EXELT2500D-XH`; Sufix 832 15 lb braid + Seaguar InvizX 8 lb leader.
- Baitcasting: Shimano Zodias `ZDC72MHB` + Shimano 22 SLX DC XT 71HG; PowerPro Super8 Slick V2 30 lb braid + Seaguar InvizX 12 lb leader.
- Shore trout: Pflueger President Spincast Combo `PRESSC-606L2CBO`; recommended 6 lb mono.

For exact product values/current inventory, trust `pwa/data/gear.seed.json`.

## Current unresolved priorities

Use `Fishing_TODO.md` as canonical. Important current items include:

1. Resolve the PowerBait hook-size conflict (#4 OneNote rig vs. prior #8 guidance).
2. Resolve the loop-knot guidance conflict.
3. Continue adding structured catches; record setup on new catches when known.
4. Verify actual fish-finder power/wiring installed state.
5. Verify Bonafide RVR119 brass insert/thread sizes.
6. Resolve rear flush rod-holder angle modification.
7. Confirm purchase status of Bonafide under-seat tackle storage and YakAttack fish cooler bag.
8. Remaining candidate KB articles include Texas Rig, Carolina Rig, Alabama Rig, Neko Rig, and Spoons.

FISH-TODO-052 (PR #28 formatting acceptance), FISH-TODO-055 (nested-list renderer defect), and FISH-TODO-056 (PR #36 UX polish) are complete and must not be presented as current work.

## Durable update rules

### My Gear

Update `pwa/data/gear.seed.json` for durable baseline Gear **data** changes; preserve stable IDs and strict schema-v2 validity; update tests when invariants change; data fixes belong in structured records, not presentation hacks. Pure wording/presentation aliases may remain in the presentation layer when changing stored data would create an unnecessary migration, as with the PR #36 `Trolling lures` → `Trolling` display label.

### Knowledge Base / Catch Log

Update `pwa/data/kb.seed.json` for the entity index, registered documents under `pwa/kb-content/` for authored KB content, and `pwa/data/catches.seed.json` for structured catches. Preserve stable IDs and validate `gear://`, `kb://`, registered relative links, and Catch relationships. Do not infer domain relationships from prose.

### Project state

Update `Fishing_Context.md`, `Fishing_Decision_Log.md`, and `Fishing_TODO.md` as appropriate and keep this bootstrap consistent when transferring chats.

## Development/deployment workflow

For meaningful PWA changes:

1. fetch latest `main` and create a normal feature/fix branch;
2. make coherent durable commits;
3. open a PR;
4. wait for **PR CI on the exact final head**;
5. fix failures until that exact head is green;
6. merge that tested head;
7. verify production on the exact merge commit;
8. verify both production build and actual **Deploy to GitHub Pages** succeeded;
9. only then call the change live.

Avoid disposable workflows. If a task is interrupted, prefer durable GitHub checkpoints over keeping important state only in the chat.

## Immediate continuation instruction

Start in **Chat mode**. Restore state from the repository in the read order above and confirm current `main` before making changes. Treat My Gear schema v2, unified five-type KB Entity model, structured Catch Log, flat Equipment taxonomy, direct-GitHub image workflow, final transformed-data validation, retired Planner scope, browse-only My Gear behavior, heading-independent authored stable-ID links, indentation-aware nested Markdown list rendering, root-search replacement UX, and non-cropping square thumbnail presentation as durable decisions unless I explicitly reopen them.

The PR #28 recovery/acceptance sequence is closed. Continue from my current request or the canonical `Fishing_TODO.md` backlog; do not resume obsolete cleanup work.

---

This bootstrap supersedes all earlier Fishing bootstrap versions.
