# Fishing recovery batch — 2026-09-03

This file is the durable handoff for recovery work started after repeated ChatGPT/tool-turn failures. Production remains based on merge commit `26aebfe4f428bebd735baf5a1b30ffa26b8a0b33` until a later PR is tested, merged, and deployed.

## Recovery operating rule

Nothing is marked complete merely because it was prepared in ChatGPT or `/mnt/data`. A step is complete only after the corresponding GitHub commit is verified on the recovery branch.

## Recovery A — local-media hardening

- [x] Start recovery branch `recovery/local-media-hardening-20260903` from known-good production `main` commit `26aebfe4f428bebd735baf5a1b30ffa26b8a0b33`.
- [ ] Add repository-local Gear media source support to the PWA build.
- [ ] Add local image-format/integrity validation before an image is included in the production bundle.
- [ ] Commit verified user-supplied Kokanee JPEG and replace the broken Kokanee WebP reference.
- [ ] Commit verified user-supplied Northern Pikeminnow JPEG and use it on the KB species page.
- [ ] Commit verified user-supplied Booyah Pad Crasher JPEG and use it for the owned Gear item and Frogs KB article.
- [ ] Commit verified user-supplied VMC Swimbait Jig JPEG and use it for the Gear item.
- [ ] Commit the four verified South Bend JPEGs as staged repository-local source assets for Recovery B.
- [ ] Update media source/ownership metadata and regression tests for Recovery A.
- [ ] Audit `main...recovery/local-media-hardening-20260903` and verify every Recovery A change is durable in GitHub.
- [ ] PR / CI / merge / deployment are deliberately outside Recovery Checkpoint A.

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

All eight files have been locally verified as decodable JPEGs before repository ingestion:

- Booyah Pad Crasher — active Gear + Frogs KB override.
- Kokanee spawning/non-spawning comparison — active KB override.
- Northern Pikeminnow — active KB override.
- VMC Swimbait Jig — active Gear override.
- South Bend 120-Piece Hook Assortment — staged for Recovery B.
- South Bend 3-Piece Classic Dressed Spinners — staged for Recovery B.
- South Bend 125-Piece Removable Split Shot Sinkers — staged for Recovery B.
- South Bend 24-Piece Assorted Brass Swivels — staged for Recovery B.
