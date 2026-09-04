# Fishing recovery batch — 2026-09-03

This file is the durable handoff for recovery work started after repeated ChatGPT/tool-turn failures. Production remains based on the current `main` branch until a later PR is tested, merged, and deployed.

## Recovery operating rule

Nothing is marked complete merely because it was prepared in ChatGPT or `/mnt/data`. A step is complete only after the corresponding GitHub commit is verified on the recovery branch.

## Recovery A — local-media hardening

- [x] Start recovery branch `recovery/local-media-hardening-20260903` from known-good production commit `26aebfe4f428bebd735baf5a1b30ffa26b8a0b33`.
- [x] Add repository-local Gear media source support to the PWA build through `pwa/local-media.json` and `pwa/apply-local-media.mjs`.
- [x] Add local image-format/integrity validation before repository-local media is included in the production bundle.
- [x] Add the user-supplied Kokanee image and override the production KB reference so the broken Kokanee WebP is excluded from the built bundle.
- [x] Add the user-supplied Northern Pikeminnow image and use it as the production KB species picture.
- [x] Add the user-supplied Booyah Pad Crasher image and use the same blob for the owned Gear item and Frogs KB article.
- [x] Add the user-supplied VMC Swimbait Jig image and use it for the Gear item.
- [x] Add the four South Bend product images as staged repository-local source assets for Recovery B.
- [x] Reuse the existing stable media ownership mappings for Booyah and VMC; add local-media metadata and CI regression checks for Recovery A.
- [x] Reconcile the recovery branch with the current `main` history and audit `main...recovery/local-media-hardening-20260903`; the recovery branch is ahead and not behind.
- [x] Recovery Checkpoint A is durable in GitHub. PR / CI / merge / deployment remain deliberately outside this checkpoint.

## Recovery B — pending UI/content work

- [ ] My Gear > Line: remove Braided and Fluorocarbon section headings as a one-off layout treatment.
- [ ] Booyah Pad Crasher Gear record: remove manufacturer link and add Dick's Sporting Goods retailer link.
- [ ] Lure leaf pages: add Notes links to the applicable KB Equipment articles.
- [ ] Desktop/large-screen list Search: place Search to the left of Back rather than on a separate full-width row.
- [ ] Add Search to the root Knowledge Base / Guides page.
- [ ] Confirm whether root My Gear Search should remain from the interrupted branch or be handled separately.
- [ ] Rename/update the South Bend 3-Piece Classic Dressed Spinners record and exact specifications.
- [ ] Add South Bend 125-Piece Removable Split Shot Sinkers and exact specifications.
- [ ] Add South Bend 24-Piece Assorted Brass Swivels and exact specifications.
- [ ] Rename/update South Bend 120-Piece Hook Assortment and exact specifications.
- [ ] Wire the four staged South Bend pictures to their final stable Gear records.
- [ ] Update regression tests and dataVersion values for the content/UI release.

## Supplied image inventory

All eight supplied images are now committed on the recovery branch. The repository files preserve the uploaded formats rather than forcing a re-encode:

- Booyah Pad Crasher — `pwa/assets/gear-source/booyah-pad-crasher.jpg` — active Gear + Frogs KB override.
- Kokanee spawning/non-spawning comparison — `pwa/assets/kb/species/kokanee-phases.png` — active KB override.
- Northern Pikeminnow — `pwa/assets/kb/species/northern-pikeminnow.png` — active KB override.
- VMC Swimbait Jig — `pwa/assets/gear-source/vmc-swimbait-jig.png` — active Gear override.
- South Bend 120-Piece Hook Assortment — `pwa/assets/gear-source/south-bend-hook-assortment.png` — staged for Recovery B.
- South Bend 3-Piece Classic Dressed Spinners — `pwa/assets/gear-source/south-bend-dressed-spinners.jpg` — staged for Recovery B.
- South Bend 125-Piece Removable Split Shot Sinkers — `pwa/assets/gear-source/south-bend-split-shot.png` — staged for Recovery B.
- South Bend 24-Piece Assorted Brass Swivels — `pwa/assets/gear-source/south-bend-brass-swivels.png` — staged for Recovery B.

For the Frogs KB article, the Booyah image blob is also referenced at `pwa/assets/kb/equipment/booyah-pad-crasher.jpg` without retransmitting or re-encoding the image.
