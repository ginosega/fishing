# Fishing New Chat Bootstrap Prompt

**Status: ACTIVE HANDOFF — production healthy; Gear schema-4 refinement pending release.**

Copy the prompt below into a new Chat-mode Fishing conversation. This is the authoritative current-state bootstrap; historical release details remain in the project records.

---

You are helping with my persistent **Fishing** project. The durable repository is `ginosega/fishing` on GitHub. Restore current state from the repository before acting; do not rely on an old chat or assume that a previously observed commit is still current.

## Operating mode

Use Chat mode by default. Do not recommend Work merely because a task is complex, lengthy, file-heavy, analytical, involves research or calculations, or creates artifacts. Recommend a temporary switch only for a specific Work-only capability, explain the need, and obtain my approval first.

## First actions and exact continuation

Read the following files from the latest `main`, in order:

1. `README.md`
2. `Fishing_Context.md`
3. `Fishing_TODO.md`
4. `Fishing_Decision_Log.md`
5. `pwa/README.md`
6. `Fishing_Release_Handoff_2026-09-06.md`

Then inspect the actual pending branch, its diff, source files, and workflow status. The immediate task is to finish the already-implemented Gear authoring refinement, not restart it.

At the reconciliation checkpoint, production/main was `cdb1c500f08394a9c44ea2012b6de72adbd46ecc`, PR #45, with production workflow #235 reported successful. The unmerged feature is `feature/gear-guides-ordered-links`, exact head `24ea22ac187f81b42c2d91743e0a470ba3d1ad94`. It was 21 commits ahead, zero behind, and had no open PR. The temporary migration workflow #6 / `34088215783` passed and preserved this head, but normal final PR CI and production deployment have NOT happened. This documentation handoff is being reconciled separately on `docs/handoff-unmerged-gear-release`; fetch latest main and preserve the feature when incorporating the handoff. Never reset or overwrite it with older main source.

The full feature inventory, approved decisions, workflow failures/recovery, temporary-file cleanup list, exact source versions, and release checklist are in `Fishing_Release_Handoff_2026-09-06.md`. Read that document before modifying the feature. Do not rerun one-time migration scripts against schema-4 data. Do not invent a PR number or call the feature live before exact-head CI, merge, and actual Pages deployment have succeeded.

## Current deployed architecture

Fishing Companion is a single-user, offline-capable personal PWA at https://ginosega.github.io/fishing/. It has three durable domains with shared identity/ownership/validation principles, not identical schemas or storage.

**My Gear:** structured owned facts in `pwa/data/gear.seed.json`, strict validation in `pwa/gear-model.js`, IndexedDB through `pwa/gear-store.js`, and all `#/inventory/...` routes in `pwa/gear-app.js`. Main has schema3, data version `2026-09-06-my-gear-v3-bonafide-rvr119-1`, and 64 records. Optional Notes are external `pwa/gear-content/<stable-id>.md`; inline JSON Notes are retired. The Add/Edit forms create validated `fishing-companion-gear-change-v1` handoff packages, not a competing local database or direct GitHub writes. Existing IDs are immutable. Category/Type administration remains chat-managed. Rods & Reels retain a strict paired-component schema and limited editor.

**Knowledge Base:** schema1, data version `2026-09-04-kb-v1-final-content-1`, 54 entities (8 Locations, 7 Species, 22 Equipment, 7 Techniques, 10 Knots). One unified envelope: id, type, name, optional description/picture, complete Markdown Content path. The internal equipment type is unchanged by the pending Gear Guides card rename. Equipment and Technique documents currently share `pwa/kb-content/techniques/`. No nested subtype taxonomy or entity-specific atomic guidance fields.

**Catch Log:** schema2, data version `2026-09-04-catches-v2-external-notes-1`, 5 catches. Structured historical facts and exact Species/Location, one Lure/Bait, optional known setup/presentation relationships. No inferred historical relationships, sessions, trip history, or Planner. Optional `pwa/catch-content/<catch-id>.md` Notes; no inline Exact Spot Notes, generated Notes, or Provenance. Backlinks are computed, and an exact Catch picture overrides the Species-picture fallback.

`gear://` and `kb://` are authored stable-ID navigation links, not maintained relationship graphs. Store a structured relationship only when current application behavior requires it. Do not infer identity or relationships from display names, Markdown prose, or image aliases. Preserve stable IDs through taxonomy/name changes. Knots belong in KB, not My Gear.

## Approved pending Gear refinement

The preserved feature implements Gear schema4/data version `2026-09-06-my-gear-v4-ordered-links-1`, retaining 64 records. My Gear **Equipment** retains internal category key `accessories`; Types are Kayaks, Tools, Tackle Management, Electronics, Storage, Accessories. KB equipment card becomes **Gear Guides** with subtitle `Equipment, rigs, and presentations reference`. The approved light-blue kayak/gray-paddle SVG is the Equipment icon.

Manufacturer has only `name`; Links are ordered `{label,url}` pairs. Existing manufacturer URLs migrate into first link positions, all classifications are removed, and the form has no separate Manufacturer URL or Link Type. Links render in entered order; an empty Links section is omitted. New Gear Item subtitle is `Create a new Gear item entry for handoff.` The schema3 non-seed local-store upgrade must preserve records.

Approved Gear Notes images may be colocated with Markdown in `pwa/gear-content/`, with safe Gear-ID-prefixed JPEG/PNG/WebP/GIF filenames and relative references. The build validates file safety, actual format/extension, size up to 10 MiB, ownership/path, byte preservation, and offline inclusion. Existing `assets/gear-notes/` references remain supported. Hero/thumbnail media stays separately owned.

Existing-picture Edit shows real source and media ID, defaults to Keep, offers explicit Replace, and permits same-filename replacement. The handoff preserves media identity and identifies `pwa/assets/gear-source/<filename>`. Do not change or remove an existing image until a valid user-uploaded replacement is registered. No bulk migration is required.

## Release procedure and remaining work

The pending feature is tracked by FISH-TODO-058. Fetch latest main; incorporate the handoff documentation without overwriting source; remove seven temporary migration/finalization files and workflow listed in the release handoff; retain the permanent image-validation, media-policy-test, and final-bundle-verifier files. Integrate their tests into the permanent Pages workflow using an authorized workflow-file write. Run the full build/tests, open a normal PR against current main, verify exact final head/base, merge with expected head SHA, then verify the production workflow and actual Deploy to GitHub Pages. Only afterward mark FISH-TODO-058 complete and reconcile production status. The old temporary workflow's success is not a substitute.

Do not modify runtime merely to complete this documentation handoff. It is acceptable to publish docs-only reconciliation separately while retaining the unmerged feature. Do not claim a future PR number or release result before it exists.

## Media and content rules

For user-supplied image binaries, specify exact branch/path/filename; I upload the file directly to GitHub; you verify the actual file and update text manifests/data/tests. Never transport image bytes/base64 through ChatGPT/GitHub connector calls. Validate final deployable transformed data after media substitution, not only the original source.

Direct GitHub edits to existing stable-ID Markdown are acceptable for ordinary content maintenance. Each `pwa/**` commit triggers Pages; the shared `fishing-pages` concurrency group uses `cancel-in-progress: true`, so avoid overlapping direct-main edits with coordinated runtime CI/deployment. No need to rewrite source images to square: card thumbnails use white square frames and `object-fit: contain`.

The custom Markdown renderer must preserve nested and loose ordered-list structure, continuation paragraphs, safe links, and normal authored content. Do not flatten valid Markdown to work around rendering. Authored links may appear under any sensible heading; validate targets, not a required `## Related` label. Current lure labels include Soft plastics and swimbaits, Topwater, and Trolling; the stored `Trolling lures` value intentionally uses a presentation alias.

## Content and unresolved items

Bonafide RVR119 is owned and already in main from PR45, ID `bonafide-rvr119`, hero `pwa/assets/gear-source/bonafide-rvr119.png`, Notes `pwa/gear-content/bonafide-rvr119.md`. Preserve its exact user-authored facts and Notes. Cylinder Weights replacement remains pending a user-provided image: Gear ID `cylinder-weights`, media ID `thkfish-cylinder-weights`; suggested upload `pwa/assets/gear-source/cylinder-weights.png` with matching actual extension. Preserve the current image until replacement is registered.

Use `Fishing_TODO.md` for all other open work. Important items include fish-finder installed wiring verification, kayak insert threads, rear flush rod-holder angle, under-seat tackle storage/cooler purchase status, PowerBait hook-size and loop-knot conflicts, remaining Texas/Carolina/Alabama/Neko/Spoons KB pages, and ongoing Catch additions. The 2026-09-04 historical migration/content acceptance is closed; do not reopen it as a new audit. Historical Topics/registry/tackle files are references, not runtime data sources. The separate Trailer griddle shopping item belongs to the Trailer repository, not Fishing.

## Durable records and final handoff rule

Keep README, Context, TODO, Decision Log, bootstrap, PWA README, and the data-model design documents consistent. Distinguish deployed state from approved-but-unmerged design and from historical decisions. Preserve every original source fact, stable ID, and user-authored Markdown item. When completing the pending feature, update authoritative release records only after evidence exists. Start by restoring the repository and continue the existing work rather than asking me to reconstruct this long conversation.

---

This bootstrap supersedes earlier Fishing bootstrap versions. The exact interrupted-release detail is in `Fishing_Release_Handoff_2026-09-06.md`.