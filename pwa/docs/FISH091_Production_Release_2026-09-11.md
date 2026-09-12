# FISH091 Production Release — September 11, 2026

**Status:** DONE / production-verified  
**Implementation PR:** [PR105](https://github.com/ginosega/fishing/pull/105)  
**Production source:** `44fa3bcbff289d2a7aa37c4967e0f5f195b53ca0`  
**Release ID:** `01c5ed3535d358086032b0985e2af87b`  
**Production workflow:** [run 34676802369](https://github.com/ginosega/fishing/actions/runs/34676802369)  
**Hosted v2 files:** 214  
**Hosted-verification artifact:** `10292867385`

## Implemented behavior

- Normal online startup and navigation do not provision the complete offline library.
- Online full loads use current production content rather than being pinned to an older prepared offline generation.
- **Connection Status → Update offline library** is the explicit action that downloads and verifies a complete offline generation.
- Existing complete generations remain usable as offline fallback until explicitly refreshed.
- Failed or corrupt explicit updates preserve the previous complete generation.
- A device with no prepared complete generation does not falsely report offline readiness.
- Online browsing does not opportunistically assemble or repair a complete offline library.
- FISH077/P2 authentication, direct-save, upload, offline-edit and synchronization scope remains deferred.

## Acceptance and release evidence

The exact production source passed core/source validation, Chromium and WebKit preview acceptance, production browser and real-v1-cutover acceptance, production build verification, the exact-current-main deployment guard, actual hosted byte verification and hosted browser verification. The hosted verifier reported release `01c5ed3535d358086032b0985e2af87b`, source revision `44fa3bcbff289d2a7aa37c4967e0f5f195b53ca0`, and 214 v2 files.

The final failed-update regression validates preservation of the inactive older generation by inspecting that generation directly in Cache Storage; it does not ask the active service worker to serve an inactive release URL.

A concurrent user edit to `KB/Techniques/content/trout-fishing.md` on main was preserved by rebasing FISH091 onto commit `2aa7a3fba2f2b9d6c04d8fd776558d8393ea6a7a` before the final merge.
