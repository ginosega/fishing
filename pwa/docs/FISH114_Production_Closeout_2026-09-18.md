# FISH114 Production Closeout — Android/Edge Maskable Launcher Icon

**Closed:** September 18, 2026  
**Status:** IMPLEMENTED / PRODUCTION-VERIFIED / USER-VERIFIED / CLOSED

## Scope

FISH114 addressed Android/Edge adaptive-icon rendering for installed Fishing Companion shortcuts. The approved transparent source icon was intentionally preserved; the application build now generates a dedicated maskable launcher icon for platforms that require an opaque adaptive-icon-safe asset.

## Final implementation

- Approved source icon remains `pwa/icon.png` and is not rewritten.
- The build generates `icon-maskable.png` from the approved source artwork.
- Generated maskable background is opaque `#11665c`.
- The artwork is trimmed, resized to fit the maskable-safe composition, centered, and flattened to remove alpha.
- The web manifest publishes two icon entries:
  - `./icon.png` with `purpose: "any"`;
  - `./icon-maskable.png` with `purpose: "maskable"`.
- Release identity includes both the ordinary icon and generated maskable icon.
- Regression coverage verifies:
  - the exact two-entry manifest shape;
  - preservation of the original transparent source icon bytes;
  - maskable dimensions;
  - opaque maskable output;
  - expected background RGB `17,102,92` (`#11665c`);
  - distinction between ordinary and maskable outputs.

## Implementation and validation evidence

- implementation PR: **#179**
- merged production source revision: `771c80baa21fe17f331614f6658b5278475178ed`
- production workflow: **#349**
- workflow run ID: `35306208653`
- release lane: **Full Application Release**
- `validate-full`: passed
- `deploy-full`: passed
- GitHub Pages deployment: passed
- actual hosted byte/browser verification: passed

Hosted release evidence for the FISH114 deployment:

- hosted release ID: `9e9cc6e2f388439c1d745c0e74122c33`
- source revision: `771c80baa21fe17f331614f6658b5278475178ed`
- hosted file count: 386
- hosted counts: Gear 85 / KB 57 / Catch 6

The first PR validation attempt exposed that Sharp metadata still reported alpha after compositing. The branch was corrected by flattening/removing alpha, and the final PR validation completed successfully before merge.

## User verification

After deployment, the user inspected the Android launcher result and confirmed: **“It looks great, thank you.”**

## Closeout decision

FISH114 is closed. Subsequent Fast Content Releases may advance production source/release identity while retaining this application behavior. The next unused application/architecture task ID is **FISH-TODO-115** unless newer `main` has already allocated it.
