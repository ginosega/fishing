# P0-A — Coherent Current-Release Transition Fix (Nonproduction)

**Reviewed:** October 21, 2026  
**Implementation:** [draft PR #254](https://github.com/ginosega/fishing/pull/254), exact checked head `1131f1e824142775168428f837d16724e164f3a5`.  
**Validation:** [Full Application CI #534](https://github.com/ginosega/fishing/actions/runs/39643607290) **SUCCESS**: core tests **46 passed, 0 failed**; preview Chromium/WebKit **54 passed**, production-root Chromium/WebKit **56 passed**. Both browser scopes covered the removed-previous-release My Gear card-icons case and protection of dirty editors. Deploy-content/deploy-full **skipped**. **No production merge, Pages deployment or hosted acceptance yet.**

## Owner architecture decision

After the [actual Edge A-to-B field failure](Fishing_Companion_v3_P0A_Edge_Field_Reproduction_2026-10-21.md), the owner explicitly requested proceeding with the reliability fix and stated that a newer release **should supersede** its predecessor: **do not retain old online release assets** for ordinary browsing. The fix is a coherent whole-page transition, not dual-serving A and B.

The separate, explicitly prepared and verified **offline library** remains intact under existing FISH091 semantics. An opted-in offline snapshot may continue to be available as a fallback in disconnected operation; this is not keeping old release files on GitHub Pages or provisioning old assets automatically.

## Implementation details

- `pwa/src/sw.mjs` answers `CHECK_CURRENT` requests through the service worker, fetching current production `release.json` and SHA-verified manifest *from the network*, not relying on the asking tab's intercepted/pinned copy. Unavailable or unverifiable pointers yield no new-release announcement. Runtime identity is not dependent on volatile per-client worker maps.
- `pwa/src/offline.mjs` checks release freshness when a tab is activated, becomes visible, gains online connectivity, changes controlling service worker, or navigates within the app. A **clean** outdated page reloads into B, preserving its hash route and fetching B's coherent JS/JSON/CSS/media. A **dirty** editor is not automatically reloaded; a warning directs the user to finish/copy changes first. Duplicate checks are coalesced and verified network unavailability does not trigger false reloads. Broad unconditional “Fishing Companion was updated” notices on `controllerchange` are removed.
- `pwa/src/ui.mjs` gates route rendering before DOM/CSS/Markdown requests and correctly disposes an unsaved editor **only after the user explicitly confirms leaving/discarding**, resolving a regression caught by browser acceptance.
- `pwa/test/offline-integrity.test.mjs` reproduces old A pinned `card-icons` and KB Markdown failures after hosted A deletion, verifies B selection via the worker and rejects unverified B manifest data.
- `pwa/test/release-transition.test.mjs` verifies matching releases/no false notices, clean-client reload, editor protection, unavailable network, service-worker controller activation.
- `pwa/test/browser.spec.mjs` simulates removal of old hosted release assets when B replaces A, proving a clean old tab navigates into B without requesting deleted A card-icons, in both Chromium and WebKit. Existing dirty-editor acceptance tests also pass.

## Remaining gate

This code is **implemented and CI-validated only**. User authorization to *develop* the P0-A fix is **not authorization for a separate live v2 Full Application maintenance release**. Keep PR #254 draft/unmerged until owner explicitly approves the specific production deployment; recheck current `main`, exact PR head, full suite, rollback readiness, and actual hosted release/byte verification at release time.

A real previously deployed A tab cannot retroactively gain this fix before its first load of the new application code. The improvement covers transition behavior starting with the release that implements it and all subsequent replacements, under the user-approved no-old-assets model. Physical Android/iPhone testing remains unperformed; desktop browser simulation does not prove every browser lifecycle state.
