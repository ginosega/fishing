# Fishing

Persistent Fishing project and source repository for Fishing Companion.

## Current production — September 13, 2026

FISH-TODO-105 is **DONE / production-verified**.

FISH105 shipped through [PR132](https://github.com/ginosega/fishing/pull/132). It implemented five supplied `fishing-companion-change-v2` Gear packages together:

- changed **Perception Joyride 10.0** from type `Accessories` to `Kayaks` and added picture caption `Perception Joyride 10.0 - Funkadelic` while preserving the existing picture path/bytes;
- added **KastKing HyperSeal Waterproof Tackle Box** (`3600`, Orange);
- added **KastKing Fishing Tackle Bag** (`Medium`, Orange) plus Markdown `Gear/Equipment/content/KastKing Fishing Tackle Bag.md`;
- added **KastKing Signature Lure Bag**; and
- added **KastKing BaitShield Tackle Storage Bag** (`Medium`).

The four KastKing PNGs had already been uploaded to canonical physical source under `pwa/Gear/Equipment/assets/` before package promotion. FISH105 referenced those user-supplied files in place rather than rewriting them. The unrelated direct Bonafide RVR119 Markdown update already on `main` was preserved unchanged.

Current verified production:

- site: https://ginosega.github.io/fishing/
- source: `dc7e6434757f19c15f05d29fc120251425108fe8`
- release: `6b10de29a03200d6f06040847007aaa8`
- production workflow: [run 34804905643](https://github.com/ginosega/fishing/actions/runs/34804905643)
- hosted v2 files: **334**
- production-bundle artifact: `10332637362`
- production-acceptance-evidence artifact: `10333116452`
- Pages artifact: `10333001931`
- hosted-verification artifact: `10332432676`
- canonical counts: **74 Gear, 56 KB and 5 Catches**

The exact-current-main run passed source/core validation, Chromium/WebKit preview acceptance, production-browser acceptance, actual archived-v1 cutover acceptance, exact-current-main protection, Pages deployment, byte-for-byte hosted verification and hosted-browser verification.

FISH102–FISH104 remain complete and production-verified. FISH102 added the Line-Tackle-Knot Reference and its pinned-first Knot-category behavior. FISH103 moved canonical physical domain source beneath `pwa/` and fixed external/internal link targeting, Caption focus and new-KB Markdown Preview validation ordering. FISH104 added the Humminbird Fish Finder Gear record and its operating/setup/navigation/kayak-installation notes.

## Current product behavior

Fishing Companion has independent Gear, Knowledge Base and Catch domains. Canonical physical domain source lives under `pwa/Gear/`, `pwa/KB/` and `pwa/Catches/`. Logical record paths and generated release content remain `Gear/...`, `KB/...` and `Catches/...`. The active application/build/test system is under `pwa/`.

FISH091 remains in force: ordinary online use is lightweight and does **not** download the complete library. **Connection Status → Update offline library** explicitly creates/refreshes a verified complete offline generation. A prior complete generation can remain as offline fallback; failed or corrupt updates preserve it.

FISH096 remains in force: Knot records may optionally have explicit ordered `pictureSequence` frames under logical `KB/Knots/assets/<knot-id>/`; `picture.src` is the final/representative frame. Normal browsing loads only the representative frame. Sequence Add/Edit remains a source-aware Prepare/Copy handoff, not Direct Save.

FISH102's **Line-Tackle-Knot Reference** is the first card only on KB → Knots; the remaining Knot cards stay alphabetical. Other list/search/detail ordering is unchanged.

FISH103 keeps authoring as Prepare Changes → Copy Changes. GitHub upload-folder links point to the physical `pwa/...` source folders. External HTTP(S) links from structured Links and Markdown open a new tab with `noopener noreferrer`; `gear://`, `kb://`, anchors, local links and other in-app navigation remain same-tab.

## Fishing Companion v3

**Fishing Companion v3** is the preferred name for the future phase historically tracked as `FISH-TODO-077/P2`. It remains **DEFERRED**. Do not treat authentication, direct GitHub save/upload, integrated uploads, offline authoring/outbox/sync, Catch authoring or multi-user generalization as implemented or implicitly approved.

## Project continuation

Chat mode is the permanent default. Do not recommend Work merely because work is complex, lengthy, file-heavy, analytical, research-heavy or artifact-producing. Use Work only for a genuinely Work-only capability after explaining why and obtaining explicit approval.

At the start of a new chat, restore actual latest `main`, then read in order:

1. `README.md`
2. `Fishing_Context.md`
3. `Fishing_TODO.md`
4. `Fishing_Decision_Log.md`
5. `Fishing_New_Chat_Bootstrap_Prompt.md`

When the user says **“It’s time to transfer to a new chat”** (or clearly says the current chat is too long and should be transferred), ask for confirmation that they want the full handoff. Once confirmed, reconcile the chat against current repository/production state, update the authoritative project records and bootstrap prompt, perform a final cross-file consistency check, and leave a clean continuation point without repeated “Proceed” prompts. The final handoff response must include a clickable GitHub link to `Fishing_New_Chat_Bootstrap_Prompt.md` so the user can copy it into the new Chat-mode conversation.

Preserve unresolved fishing/equipment/content backlog and explicit purchase uncertainty. FISH071–076 and FISH078–105 are complete; Fishing Companion v3 (`FISH-TODO-077/P2`) remains deferred. The next unused canonical application task ID is **FISH-TODO-106** unless actual newer `main` has already allocated it.

Historical milestones and release evidence remain in Git history and `pwa/docs/`; the root project-state files intentionally describe the current continuation state rather than repeating every prior release. Use [`pwa/docs/README.md`](pwa/docs/README.md) as the authority guide for interpreting dated project records and milestone-era “current” statements.

## Development

Use Node 24 and the locked `pwa/package-lock.json`. From `pwa/`: `npm ci`, `npm test`, `npm run build -- --base=/fishing/`, `npm run verify`.

`.github/workflows/fishing-production.yml` is the sole active production pipeline. Runtime/source changes use the normal feature-PR/CI path and deploy only from exact current `main`. Documentation-only project-state reconciliation does not republish the application.
