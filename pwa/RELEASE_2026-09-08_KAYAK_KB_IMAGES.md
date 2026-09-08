# Kayak correction and three KB hero images

**Status: COMPLETE.** Production deployed September 8, 2026. FISH065 and FISH066 DONE.

## Scope and preservation

The user confirmed the Dagger Axis 10.5 Length is `10' 6"`. Only that structured specification was corrected; all other facts, links, IDs, ownership and no-Notes state remain unchanged. Gear schema4 retains 65 records, dataVersion `2026-09-08-my-gear-v4-dagger-length-1`. KB schema1 retains 54 entities, dataVersion `2026-09-08-kb-v1-three-hero-images-1`. Catch schema2/five historical records and its dataVersion `2026-09-04-catches-v2-external-notes-1` are unchanged.

The exact picture additions are:

| Entity | Source path | Git blob | Bytes | Explicit Gear link |
|---|---|---|---:|---|
| Fishing Line | `pwa/assets/kb/entries/technique-fishing-line.jpg` | `6bbf79095fb60cda21ea086553a1ec3bf64132cb` | 34540 | `sufix-832-15` |
| Walking Bait | `pwa/assets/kb/entries/technique-walking-bait.jpg` | `9181d2b9a5767ae01855bbcdffdfa5d6c7dcd7d8` | 65306 | None supplied |
| Rods & Reels | `pwa/assets/kb/entries/technique-rods-reels.png` | `0304c3a3c3964f280db88ab70edca52e593a49e2` | 133226 | None supplied |

Alt text is respectively `Sufix 832 fishing line`, `Heddon Zara Spook`, and `Baitcasting reel`. Caption, credit and sourceUrl remain null. The exact user-supplied entity IDs, names, descriptions, types, picture paths and Content paths are retained. No external image provenance or unrequested Gear relationship was invented.

All three complete authored Markdown files were retained byte-for-byte. Their respective source Git blobs are `f5b4b1f11638c7630889e9ecc2a59bd94b1ffc70`, `766aa8bbb0445184b9804abf5119bc2274089900`, and `50e36182db41b7a222a5231c545799ad25bbc270`. Every unrelated Gear, KB and Catch record and media registration is preserved.

The user concurrently replaced the Dagger PNG on main in commit `5265a393cce601a59540de2a17f5b7c56b4d3535`. Current source blob `17ad66ac19cc0a71f3ca4c3fd4ea6ec5e881ac51` is 393226 bytes, at the existing Gear source path with existing owner/destination. The original blob `b6b9c96057adda124b7369952e851b13cf2f3b7b` remains in Git history. No image bytes were transported through the assistant connector.

## Implementation and validation

The existing KB authoring and promotion models were used with the current resolved Gear media catalog, preserving unrelated media reuse relationships. Two isolated preparation attempts failed safely before committing because of filesystem URL normalization and unavailable resolved Gear media. The corrected third preparation run #3 / `34188394921` passed all source checks and committed the validated changes. Temporary source executors and scripts were removed from the final runtime tree. No historical migration was rerun or denied permission bypassed.

Permanent `pwa/accepted-2026-09-08.test.mjs` checks exact source facts, counts and versions, image identities/blobs, authored Markdown and explicit associations, plus byte-identical transformed assets and offline inclusion. The existing Dagger test now verifies the corrected full item and latest PNG. All standard model, routing, authoring, promotion, media, content, build, Notes and final-bundle gates remain enabled.

## Release evidence

PR56: https://github.com/ginosega/fishing/pull/56

Final head: `d17d7b0c52955c06ef55659d6062e8b6f4a44759`. Normal CI #284 / `34188600391` passed against main `5265a393cce601a59540de2a17f5b7c56b4d3535`, including all source and final-bundle tests. Merge: `531f04a84c0d75e2a7f23dc368149de5026b607b`. Production #285 / `34188668110` passed all tests, build, authored Notes, local media, final transformed-bundle verification and the actual Deploy to GitHub Pages step.

Production workflow: https://github.com/ginosega/fishing/actions/runs/34188668110

Live site: https://ginosega.github.io/fishing/

Deployment is verified through GitHub Actions/Pages; independent live HTTP and user-browser acceptance are not claimed. FISH063 remains open for the separate KB filename/destination usability issue. No application release remains pending from this transaction.

The authoritative root README, Context, TODO, Decision Log, bootstrap, PWA README and this closeout are reconciled. Exact pre-closeout records are preserved under `History/2026-09-08-pre-three-kb-images/`, with older history intact. Future work must restore actual current main and consult the canonical backlog.

## Subsequent concurrent media and regression maintenance

After production #285, the user replaced the Dagger source again at commit `2c79f685f5d3fc1020930874cfea486425840c3c`, blob `cfb44c09b6ab3d79a53d50e626664dde5e148a3a` (259840 bytes), and uploaded `pwa/assets/gear-source/perception-joyride-10.png`, blob `f24403f79788755e267ee721f5e93c34c3f8f472` (562530 bytes). Both are preserved. The Perception file is unregistered pending an explicit Gear handoff; no ownership is inferred. The earlier Dagger replacement `17ad66ac19cc0a71f3ca4c3fd4ea6ec5e881ac51` and original image remain in Git history. PR57/FISH067 removes the frozen source-hash assertion, retaining actual image validation, stable metadata and exact source-to-bundle byte checks. The PR56 historical release hashes above remain accurate for that release.
