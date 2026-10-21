# P0-A — Coherent Current-Release Transition Fix (Deployed October 21, 2026)

**Reviewed:** October 21, 2026  
**Implementation:** [draft PR #254](https://github.com/ginosega/fishing/pull/254), exact checked head `1131f1e824142775168428f837d16724e164f3a5`.  
**Validation:** [Full Application CI #534](https://github.com/ginosega/fishing/actions/runs/39643607290) **SUCCESS**: core tests **46 passed, 0 failed**; preview Chromium/WebKit **54 passed**, production-root Chromium/WebKit **56 passed**. Both browser scopes covered the removed-previous-release My Gear card-icons case and protection of dirty editors. Deploy-content/deploy-full **skipped**. **No production merge, Pages deployment or hosted acceptance yet.**

## Production release closeout — October 21, 2026

The owner separately authorized production deployment of the validated reliability fix. [PR #254](https://github.com/ginosega/fishing/pull/254) was marked ready and merged **without code changes** from the tested head, producing `main` merge commit `953cba549515b08aec76a8408868a6b3bdac2117`. The only intervening `main` updates since the prior PR base were nonoverlapping documentation.

[Full Application main workflow #535](https://github.com/ginosega/fishing/actions/runs/39676555110) **SUCCEEDED** after rerunning core tests, Chromium/WebKit preview and production-root browser acceptance, then publishing GitHub Pages and verifying the actual hosted bytes, release identity and browser behavior.

- Live URL: https://ginosega.github.io/fishing/
- **Hosted release ID:** `855b2b33d7d3fdca7ac5e92be881824b`
- **Production source revision:** `953cba549515b08aec76a8408868a6b3bdac2117`
- **Hosted manifest:** 577 files, counts 100 Gear / 60 KB / 12 Catches
- **Host verification artifact:** [actual-hosted-production-verification-1](https://github.com/ginosega/fishing/actions/runs/39676555110/artifacts/12381174185)
- **No legacy Pages assets:** The new release supersedes old releases. Prepared offline libraries retain prior explicit semantics. Tabs open on the **pre-fix** JS may need one manual refresh at this transition; future deployments are addressed by the new transition handler.

**Disposition:** P0-A reliability fix implemented, validated, merged and hosted-verified. Real physical Android/iOS confirmation was not part of acceptance. AUTH-P0, GitHub App/provider permission setup, and v3 cutover remain separate gates.

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

## Release authorization gate — satisfied

The separate production authorization was explicitly granted, PR #254 merged, and main Full Application workflow #535 verified the live hosted release. The previously stated pre-release hold applied before that authorization and is now **closed**.

A real previously deployed A tab cannot retroactively gain this fix before its first load of the new application code. The improvement covers transition behavior starting with the release that implements it and all subsequent replacements, under the user-approved no-old-assets model. Physical Android/iPhone testing remains unperformed; desktop browser simulation does not prove every browser lifecycle state.
