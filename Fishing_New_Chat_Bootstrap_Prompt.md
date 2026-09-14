You are continuing my persistent **Fishing** project. The durable repository is `ginosega/fishing` on GitHub. Restore current state from the latest `main` before acting; do not rely on an old chat or assume a previously observed commit is still current.

## Operating mode

Operating mode: This project uses Chat mode by default. Do not recommend Work unless a task specifically requires a Work-only capability. Never recommend Work merely because the project or task is complex, lengthy, file-heavy, analytical, requires research/calculations, creates artifacts, or involves substantial context. Explain the specific Work-only need and obtain my approval before recommending a temporary switch. Return to Chat afterward.

## First actions

Read these files from actual latest `main`, in order:

1. `README.md`
2. `Fishing_Context.md`
3. `Fishing_TODO.md`
4. `Fishing_Decision_Log.md`
5. `Fishing_New_Chat_Bootstrap_Prompt.md`

Before implementation, release or repository-write work, also confirm current open-PR state. Newer primary repository evidence controls over stale chat descriptions.

## Chat-transfer convention

For this project, the phrase **“It’s time to transfer to a new chat”** is the standard transfer cue. If I say that (or clearly say that the current chat is getting too long and should be transferred), ask me to confirm that I want the **full project handoff** prepared.

After I confirm, execute the handoff end-to-end without making me repeatedly say “Proceed”:

- restore actual latest `main` and current open-PR state;
- reconcile all work completed in the chat against current repository and production evidence;
- update `README.md`, `Fishing_Context.md`, `Fishing_TODO.md`, `Fishing_Decision_Log.md`, `Fishing_New_Chat_Bootstrap_Prompt.md`, and any other records materially affected by the chat;
- preserve exact continuation state, unresolved work, purchase uncertainty, relevant task IDs, PRs, SHAs, releases, workflow runs and artifacts;
- perform a final cross-file consistency check;
- leave the repository in a clean continuation state, using the normal documentation PR/merge workflow when records require changes; and
- finish with a clickable GitHub link to `Fishing_New_Chat_Bootstrap_Prompt.md` so I can open it and copy its contents into the next Chat-mode conversation.

This is a durable Fishing-project convention, not an automatic ChatGPT product feature. If I explicitly request a lighter transfer, follow that narrower request instead.

## Current production continuation point — September 13, 2026

FISH-TODO-105 is **DONE / production-verified**.

FISH105 shipped through [PR132](https://github.com/ginosega/fishing/pull/132). It implemented five supplied Fishing Companion Gear packages together:

- Perception Joyride 10.0: type corrected from `Accessories` to `Kayaks`; caption `Perception Joyride 10.0 - Funkadelic` added while retaining its existing picture.
- KastKing HyperSeal Waterproof Tackle Box: new `Tackle Management` Gear item, size `3600`, Orange.
- KastKing Fishing Tackle Bag: new `Tackle Management` Gear item, Medium, Orange, with Markdown `Gear/Equipment/content/KastKing Fishing Tackle Bag.md`.
- KastKing Signature Lure Bag: new `Tackle Management` Gear item.
- KastKing BaitShield Tackle Storage Bag: new `Tackle Management` Gear item, Medium.

The four KastKing PNGs were user-supplied files already uploaded under physical source `pwa/Gear/Equipment/assets/` before package promotion. FISH105 referenced them in place rather than rewriting them. The unrelated direct Bonafide RVR119 Markdown update already on `main` was preserved unchanged.

Current verified production:

- source: `dc7e6434757f19c15f05d29fc120251425108fe8`
- release: `6b10de29a03200d6f06040847007aaa8`
- production workflow: [run 34804905643](https://github.com/ginosega/fishing/actions/runs/34804905643)
- hosted v2 files: **334**
- production-bundle artifact: `10332637362`
- production-acceptance-evidence artifact: `10333116452`
- Pages artifact: `10333001931`
- hosted-verification artifact: `10332432676`
- site: https://ginosega.github.io/fishing/
- canonical counts: **74 Gear, 56 KB and 5 Catches**
- measured source baselines: **108 canonical library paths, 240 inventory references**

The exact-main production run passed source/core validation, Chromium/WebKit preview and production acceptance, archived-v1 cutover acceptance, exact-current-main protection, Pages deployment, hosted-byte verification and hosted-browser verification.

FISH102–FISH104 remain DONE / production-verified. Do **not** restart FISH096–FISH105 implementation/deployment work.

## Current durable behavior

Fishing Companion uses independent Gear, KB and Catch domains. Canonical physical data is under `pwa/Gear/`, `pwa/KB/` and `pwa/Catches/`; logical record/release paths remain `Gear/...`, `KB/...` and `Catches/...`. Active application/build/test code is under `pwa/`. `.github/workflows/fishing-production.yml` is the sole active production publisher.

FISH091 remains active: normal online use does not provision the complete offline library. **Connection Status → Update offline library** is the explicit verified complete-library preparation/refresh action. Online browsing uses current production; a prior complete generation may remain offline fallback; failed/corrupt updates preserve that prior generation.

FISH096 remains active: Knot records may optionally use explicit ordered `pictureSequence` frames. Logical paths use `KB/Knots/assets/<knot-id>/step-01...`; physical source lives under `pwa/KB/Knots/assets/<knot-id>/`. `picture.src` equals the final frame and remains the representative picture. Directory contents alone never create a sequence.

Gear/KB Prepare Changes → Copy Changes remains a source-aware handoff. It carries structured changes, content and sequence intent where applicable, but it still does not write to GitHub directly.

Simple Markdown-only narrative/content edits to existing canonical content files may be made directly in GitHub. Use Fishing Companion Edit or an equivalent source-aware workflow for structured record fields, paths, pictures/sequences or relationships; do not casually rename/move content files during direct Markdown editing.

FISH102's Line-Tackle-Knot Reference is pinned first only on KB → Knots. Other list ordering is unchanged.

FISH103's link behavior is durable: external HTTP(S) links open in a new tab; internal `gear://`, `kb://`, anchors/local and other in-app links remain same-tab. Caption editing must retain focus, and new-KB Markdown Preview must validate with a provisional required content path.

FISH104 does **not** by itself close `FISH-TODO-005`: its notes document a fish-finder power architecture and parts list, but do not explicitly confirm that every listed component is the installed configuration. Preserve that item as WAITING ON USER until I confirm the installed system.

FISH105 does **not** by itself close `FISH-TODO-014`: the HyperSeal item is size 3600, but the supplied package does not explicitly identify it as the backlog's specific “KastKing 3600 deep box” target. Preserve that item as OPEN until I explicitly resolve it.

## Fishing Companion v3

**Fishing Companion v3** is the preferred name for the future phase historically tracked as `FISH-TODO-077/P2`. It remains **DEFERRED**. Historical references to `FISH-TODO-077/P2` are still valid identifiers, but new prose should call it Fishing Companion v3.

Future scope includes authentication, direct GitHub save/upload, integrated uploads, offline authoring/outbox/sync, Catch authoring and multi-user generalization. None of these are current production or implicitly approved implementation work.

## Task state

FISH071–076 and FISH078–105 are complete. Fishing Companion v3 (`FISH-TODO-077/P2`) remains deferred. Preserve all unresolved fishing/equipment/content backlog and explicit purchase uncertainty in `Fishing_TODO.md`.

The next unused canonical application task ID is **FISH-TODO-106** unless actual newer `main` has already allocated it.

The new-chat transfer/handoff convention is a project operating rule, **not** FISH-TODO-106 and does not consume an application task ID.

## Working rules

- Use current GitHub source as authority for code, content, project state and release evidence.
- Do not repeat completed migration/cutover/release work.
- Preserve unrelated concurrent source changes and user-uploaded bytes.
- For source/runtime changes, use a feature PR, full CI, merge, production deployment and hosted verification unless the user explicitly changes that workflow.
- Documentation-only reconciliation does not republish production.
- P1 authoring packages are implementation instructions, not merely JSON to explain.
- Do not infer purchases/ownership or close WAITING ON USER/open purchase-watch items without sufficient user confirmation.
- Historical v1/preview files, old task snapshots and prior release identities are evidence only; current state is in the five restore-order files and dated `pwa/docs/` closeouts.
- After actual milestones, update Context, TODO, Decision Log, README, affected technical/release records and this bootstrap, then cross-check them before handoff.
