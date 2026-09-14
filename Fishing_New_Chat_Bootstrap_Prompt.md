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

FISH-TODO-102 and FISH-TODO-103 are **DONE / production-verified**.

FISH102 shipped through [PR124](https://github.com/ginosega/fishing/pull/124). It added the **Line-Tackle-Knot Reference** KB Knot record, Markdown and picture and pins that card first only on KB → Knots while keeping all remaining Knot cards alphabetical. FISH102 verified production was source `4912f93149e9de1e9cde9ff5176b4a4831a67812`, release `beff9138c96489abd9723c5fcfeef0ff`, [run 34770966552](https://github.com/ginosega/fishing/actions/runs/34770966552), hosted-verification artifact `10322381375`.

FISH103 shipped through feature [PR125](https://github.com/ginosega/fishing/pull/125), followed by verifier-only [PR126](https://github.com/ginosega/fishing/pull/126) and [PR127](https://github.com/ginosega/fishing/pull/127). It:

- moved canonical physical domain source to `pwa/Gear/`, `pwa/KB/` and `pwa/Catches/` while preserving logical record/release paths as `Gear/...`, `KB/...` and `Catches/...`;
- changed GitHub upload-folder links to the physical `pwa/...` folders;
- makes external HTTP(S) structured/Markdown links open in a new tab with `noopener noreferrer`, while internal/in-app/local links remain same-tab;
- keeps Gear/KB Caption input focused while the picture caption preview updates;
- gives new-KB Markdown Preview a provisional required content path before whole-library validation.

Current verified production:

- source: `94772e62788fa98903930e4b5649fabb9629c6d0`
- release: `b8c8222697222f1dd43861427d5006fb`
- production workflow: [run 34795289032](https://github.com/ginosega/fishing/actions/runs/34795289032)
- hosted v2 files: **327**
- production-bundle artifact: `10328869743`
- production-acceptance-evidence artifact: `10329538071`
- Pages artifact: `10329392228`
- hosted-verification artifact: `10329313590`
- site: https://ginosega.github.io/fishing/

The current exact-main production run passed source/core validation, Chromium/WebKit preview and production acceptance, archived-v1 cutover acceptance, exact-current-main protection, Pages deployment, hosted-byte verification and hosted-browser verification. Hosted verification explicitly confirmed FISH103's physical source layout, external/internal link targets, Caption focus stability and new-KB Markdown Preview.

Do **not** restart FISH096–FISH103 implementation/deployment work.

## Current durable behavior

Fishing Companion uses independent Gear, KB and Catch domains. Canonical physical data is under `pwa/Gear/`, `pwa/KB/` and `pwa/Catches/`; logical record/release paths remain `Gear/...`, `KB/...` and `Catches/...`. Active application/build/test code is under `pwa/`. `.github/workflows/fishing-production.yml` is the sole active production publisher.

FISH091 remains active: normal online use does not provision the complete offline library. **Connection Status → Update offline library** is the explicit verified complete-library preparation/refresh action. Online browsing uses current production; a prior complete generation may remain offline fallback; failed/corrupt updates preserve that prior generation.

FISH096 remains active: Knot records may optionally use explicit ordered `pictureSequence` frames. Logical paths use `KB/Knots/assets/<knot-id>/step-01...`; physical source lives under `pwa/KB/Knots/assets/<knot-id>/`. `picture.src` equals the final frame and remains the representative picture. Directory contents alone never create a sequence.

Gear/KB Prepare Changes → Copy Changes remains a source-aware handoff. It carries structured changes, content and sequence intent where applicable, but it still does not write to GitHub directly.

FISH102's Line-Tackle-Knot Reference is pinned first only on KB → Knots. Other list ordering is unchanged.

FISH103's link behavior is durable: external HTTP(S) links open in a new tab; internal `gear://`, `kb://`, anchors/local and other in-app links remain same-tab. Caption editing must retain focus, and new-KB Markdown Preview must validate with a provisional required content path.

## Fishing Companion v3

**Fishing Companion v3** is the preferred name for the future phase historically tracked as `FISH-TODO-077/P2`. It remains **DEFERRED**. Historical references to `FISH-TODO-077/P2` are still valid identifiers, but new prose should call it Fishing Companion v3.

Future scope includes authentication, direct GitHub save/upload, integrated uploads, offline authoring/outbox/sync, Catch authoring and multi-user generalization. None of these are current production or implicitly approved implementation work.

## Task state

FISH071–076 and FISH078–103 are complete. Fishing Companion v3 (`FISH-TODO-077/P2`) remains deferred. Preserve all unresolved fishing/equipment/content backlog and explicit purchase uncertainty in `Fishing_TODO.md`.

The next unused canonical application task ID is **FISH-TODO-104** unless actual newer `main` has already allocated it.

The new-chat transfer/handoff convention is a project operating rule, **not** FISH-TODO-104 and does not consume an application task ID.

## Working rules

- Use current GitHub source as authority for code, content, project state and release evidence.
- Do not repeat completed migration/cutover/release work.
- Preserve unrelated concurrent source changes and user-uploaded bytes.
- For source/runtime changes, use a feature PR, full CI, merge, production deployment and hosted verification unless the user explicitly changes that workflow.
- Documentation-only reconciliation does not republish production.
- P1 authoring packages are implementation instructions, not merely JSON to explain.
- Do not infer purchases/ownership or close WAITING ON USER items without user confirmation.
- Historical v1/preview files, old task snapshots and prior release identities are evidence only; current state is in the five restore-order files and dated `pwa/docs/` closeouts.
- After actual milestones, update Context, TODO, Decision Log, README, affected technical/release records and this bootstrap, then cross-check them before handoff.