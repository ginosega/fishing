from pathlib import Path
import re


def replace_section(path, start_heading_pattern, end_heading, replacement):
    p = Path(path)
    text = p.read_text(encoding="utf-8")
    pattern = rf"{start_heading_pattern}.*?(?={re.escape(end_heading)})"
    updated, count = re.subn(pattern, replacement.rstrip() + "\n\n", text, count=1, flags=re.S)
    assert count == 1, f"section replacement failed for {path}: {count}"
    p.write_text(updated, encoding="utf-8")


def replace_once(path, old, new):
    p = Path(path)
    text = p.read_text(encoding="utf-8")
    count = text.count(old)
    assert count == 1, f"expected one match in {path}, found {count}: {old!r}"
    p.write_text(text.replace(old, new, 1), encoding="utf-8")


readme_current = '''## Current production — September 14, 2026

FISH-TODO-107 is **DONE / production-verified**.

FISH107 shipped through [PR136](https://github.com/ginosega/fishing/pull/136). It implemented the supplied `fishing-companion-change-v2` edit package for `skylety-fishing-hook-sharpener`, correcting its canonical Gear type from `Kayaks` to `Tools`.

This was the only canonical source change. Notes, picture, picture sequence, all other record fields, counts, paths, media and unrelated source were unchanged. The package base revision `9b419e07f9a3a56a2be1ddbfb0df1760fe2730cb`, record hash `31811a75b2d315a2c98a7b25bf8b51fd52c77195b6c54783e90cdb0aa4c57db8`, and base field `type: Kayaks` were validated before application.

Current verified production:

- site: https://ginosega.github.io/fishing/
- application source: `6fae3afbe8f227b4c12875c5d5e8f0d4c0c8861f`
- release: `21d203ccdef509cd99626680ae34de98`
- production workflow: [run 34811980881](https://github.com/ginosega/fishing/actions/runs/34811980881)
- feature exact-head acceptance: [run 34811426937](https://github.com/ginosega/fishing/actions/runs/34811426937) at `f36be26dddfb2da8c0957917c0fceb389192177e`
- hosted v2 files: **342**
- production-bundle artifact: `10334724772`
- production-acceptance-evidence artifact: `10335063749`
- Pages artifact: `10334664984`
- hosted-verification artifact: `10334949254`
- canonical counts: **80 Gear, 56 KB and 5 Catches**
- measured source baselines: **110 canonical library paths, 245 inventory references**

The exact-current-main run passed source/core validation, Chromium/WebKit preview acceptance, production-browser acceptance, actual archived-v1 cutover acceptance, exact-current-main protection, Pages deployment, byte-for-byte hosted verification and hosted-browser verification.

FISH102–FISH106 remain complete and production-verified. FISH106 added six Gear items including the Skylety sharpener using its then-supplied `Kayaks` type; FISH107 supersedes that classification for current canonical state by setting Skylety to `Tools`.'''
replace_section("README.md", r"## Current production — .*?\n", "## Current product behavior", readme_current)
replace_once("README.md", "FISH071–076 and FISH078–106 are complete;", "FISH071–076 and FISH078–107 are complete;")
replace_once("README.md", "The next unused canonical application task ID is **FISH-TODO-107** unless actual newer `main` has already allocated it.", "The next unused canonical application task ID is **FISH-TODO-108** unless actual newer `main` has already allocated it.")

context_current = '''## Current authoritative state — September 14, 2026

FISH-TODO-107 is **DONE / production-verified**.

### FISH107 — Skylety Fishing Hook Sharpener type correction

FISH107 shipped through [PR136](https://github.com/ginosega/fishing/pull/136). It implemented one supplied `fishing-companion-change-v2` Gear edit package:

- Gear ID: `skylety-fishing-hook-sharpener`
- **Skylety Fishing Hook Sharpener**
- category remains `accessories`
- canonical type changed from `Kayaks` to `Tools`
- notes: keep
- picture: keep
- picture sequence: keep

Package validation established that base revision `9b419e07f9a3a56a2be1ddbfb0df1760fe2730cb` was the deployed application parent of the then-current docs-only `main`, the current record still had base type `Kayaks`, and its canonical fingerprint exactly matched supplied record hash `31811a75b2d315a2c98a7b25bf8b51fd52c77195b6c54783e90cdb0aa4c57db8`. `Tools` is an allowed Equipment type. There was no structured-data conflict.

The final feature diff contained exactly one file and one semantic line change in `pwa/Gear/gear.json`: `type: Kayaks` → `type: Tools`. Counts, paths, notes, pictures, picture sequences and media references were unchanged, so validator baselines remain **80 Gear / 56 KB / 5 Catches**, **110 canonical library paths**, and **245 source inventory references**.

Feature acceptance evidence:

- feature PR: [PR136](https://github.com/ginosega/fishing/pull/136)
- feature branch: `feature/fish107-skylety-type`
- final exact feature head: `f36be26dddfb2da8c0957917c0fceb389192177e`
- exact-head acceptance: [run 34811426937](https://github.com/ginosega/fishing/actions/runs/34811426937), success
- merged application source: `6fae3afbe8f227b4c12875c5d5e8f0d4c0c8861f`

Final verified production:

- source `6fae3afbe8f227b4c12875c5d5e8f0d4c0c8861f`
- release `21d203ccdef509cd99626680ae34de98`
- [workflow run 34811980881](https://github.com/ginosega/fishing/actions/runs/34811980881), run number 188
- validate job `103874988437`, success
- deploy job `103876502029`, success
- **342 hosted v2 files**
- production-bundle artifact `10334724772`
- production-acceptance-evidence artifact `10335063749`
- Pages artifact `10334664984`
- hosted-verification artifact `10334949254`

The exact-current-main production run passed durable-v1 recovery, locked dependency audit, source/core validation, Chromium/WebKit preview acceptance, production-root verification, production-browser and real archived-v1 cutover acceptance, exact-current-main guard, Pages deployment, byte-for-byte hosted verification and hosted-browser verification. Hosted verification reported source revision `6fae3afbe8f227b4c12875c5d5e8f0d4c0c8861f`, release `21d203ccdef509cd99626680ae34de98`, and 342 hosted v2 files.

FISH102–FISH106 remain complete and production-verified. FISH106's historical release evidence correctly records that Skylety entered canonical Gear using its then-supplied `Kayaks` type; FISH107 is the authoritative later correction to `Tools`.'''
replace_section("Fishing_Context.md", r"## Current authoritative state — .*?\n", "## Operating mode", context_current)
replace_once("Fishing_Context.md", "Canonical counts are **80 Gear, 56 KB and 5 Catches**. The six FISH106 Gear items are canonical under Gear → Equipment with the supplied type values.", "Canonical counts are **80 Gear, 56 KB and 5 Catches**. The six FISH106 Gear items remain canonical under Gear → Equipment; FISH107 supersedes the original Skylety classification so **Skylety Fishing Hook Sharpener is now type `Tools`**.")
replace_once("Fishing_Context.md", "FISH071–076 and FISH078–106 are complete.", "FISH071–076 and FISH078–107 are complete.")
replace_once("Fishing_Context.md", "FISH106 does not alter either conclusion.", "FISH106 and FISH107 do not alter either conclusion.")
replace_once("Fishing_Context.md", "The next unused canonical application task ID is **FISH-TODO-107** unless current `main` has already allocated it.", "The next unused canonical application task ID is **FISH-TODO-108** unless current `main` has already allocated it.")
replace_once("Fishing_Context.md", "do not restart completed FISH096–FISH106 release work.", "do not restart completed FISH096–FISH107 release work.")

todo_current = '''## Current project task state — September 14, 2026

**FISH-TODO-107 — DONE / production-verified.** FISH107 implemented the supplied Fishing Companion Gear edit package for `skylety-fishing-hook-sharpener` through [PR136](https://github.com/ginosega/fishing/pull/136), changing only its canonical type from `Kayaks` to `Tools`. Notes, picture, picture sequence, all other fields and unrelated source were preserved.

The package base revision `9b419e07f9a3a56a2be1ddbfb0df1760fe2730cb`, record hash `31811a75b2d315a2c98a7b25bf8b51fd52c77195b6c54783e90cdb0aa4c57db8`, and base type `Kayaks` were validated before application. Final feature acceptance passed at exact PR head `f36be26dddfb2da8c0957917c0fceb389192177e` in [run 34811426937](https://github.com/ginosega/fishing/actions/runs/34811426937).

Verified production is application source `6fae3afbe8f227b4c12875c5d5e8f0d4c0c8861f`, release `21d203ccdef509cd99626680ae34de98`, [run 34811980881](https://github.com/ginosega/fishing/actions/runs/34811980881), with **342 hosted v2 files** and hosted-verification artifact `10334949254`. Canonical counts remain **80 Gear, 56 KB and 5 Catches**; measured source baselines remain **110 canonical library paths** and **245 inventory references**. Full source/core, Chromium/WebKit, production-browser, archived-v1 cutover, exact-main, Pages, hosted-byte and hosted-browser verification passed.

FISH-TODO-102 through FISH-TODO-106 remain DONE / production-verified. FISH106's original Skylety `Kayaks` classification is superseded in current canonical state by FISH107's `Tools` correction.

**Fishing Companion v3** — historically `FISH-TODO-077/P2` — remains **DEFERRED**. Future scope includes authentication, direct GitHub save/upload, integrated uploads, offline authoring/outbox/sync, Catch authoring and multi-user generalization. Do not treat any of that as current production or implicitly approved implementation work.

The next unused canonical application task ID is **FISH-TODO-108**.'''
replace_section("Fishing_TODO.md", r"## Current project task state — .*?\n", "## Completed/superseded application work", todo_current)
replace_once("Fishing_TODO.md", "FISH071–076 and FISH078–106 are complete.", "FISH071–076 and FISH078–107 are complete.")
replace_once("Fishing_TODO.md", "FISH106 does not change either backlog conclusion.", "FISH106 and FISH107 do not change either backlog conclusion.")
replace_once("Fishing_TODO.md", "For new application work, allocate **FISH-TODO-107** unless a newer task has already been created on current `main`.", "For new application work, allocate **FISH-TODO-108** unless a newer task has already been created on current `main`.")
replace_once("Fishing_TODO.md", "does not consume FISH-TODO-107.", "does not consume FISH-TODO-108.")
replace_once("Fishing_TODO.md", "Do not reopen FISH096–FISH106", "Do not reopen FISH096–FISH107")

p = Path("Fishing_Decision_Log.md")
text = p.read_text(encoding="utf-8")
marker = "## Fishing Companion v3 — deferred boundary"
assert text.count(marker) == 1
fish107_decision = '''## FISH107 — Skylety Fishing Hook Sharpener type correction

**Decision/status:** DONE and production-verified. [PR136](https://github.com/ginosega/fishing/pull/136) implemented the supplied `fishing-companion-change-v2` edit package for Gear ID `skylety-fishing-hook-sharpener`.

**Decision/result:** The canonical **Skylety Fishing Hook Sharpener** remains category `accessories`, with notes/picture/picture sequence unchanged, but its type is corrected from `Kayaks` to **`Tools`**. This later correction supersedes FISH106's historical supplied classification for current canonical state; FISH106's closeout remains accurate as historical evidence of what that earlier package supplied.

Package validation confirmed base revision `9b419e07f9a3a56a2be1ddbfb0df1760fe2730cb`, record hash `31811a75b2d315a2c98a7b25bf8b51fd52c77195b6c54783e90cdb0aa4c57db8`, and current base type `Kayaks` before the edit. The final feature diff was one semantic line in `pwa/Gear/gear.json`.

Final feature head `f36be26dddfb2da8c0957917c0fceb389192177e` passed exact-head acceptance in [run 34811426937](https://github.com/ginosega/fishing/actions/runs/34811426937). Final verified production source is `6fae3afbe8f227b4c12875c5d5e8f0d4c0c8861f`, release `21d203ccdef509cd99626680ae34de98`, [run 34811980881](https://github.com/ginosega/fishing/actions/runs/34811980881), **342 hosted v2 files**, hosted-verification artifact `10334949254`. Canonical baselines remain **80 Gear / 56 KB / 5 Catches**, **110 canonical library paths**, and **245 inventory references**.

**Decision:** FISH107 is a structured Gear classification correction only. It does not change the Gear schema, P1 authoring boundary, FISH091 offline model, FISH096 sequence model, FISH103 link/upload behavior, or unresolved conclusions for `FISH-TODO-005` and `FISH-TODO-014`.

'''
p.write_text(text.replace(marker, fish107_decision + marker, 1), encoding="utf-8")
replace_once("Fishing_Decision_Log.md", "FISH071–076 and FISH078–106 are complete;", "FISH071–076 and FISH078–107 are complete;")
replace_once("Fishing_Decision_Log.md", "The next unused canonical application task ID is **FISH-TODO-107** unless actual current `main` has already allocated it.", "The next unused canonical application task ID is **FISH-TODO-108** unless actual current `main` has already allocated it.")

bootstrap_current = '''## Current production continuation point — September 14, 2026

FISH-TODO-107 is **DONE / production-verified**.

FISH107 shipped through [PR136](https://github.com/ginosega/fishing/pull/136). It implemented the supplied Fishing Companion Gear edit package for **Skylety Fishing Hook Sharpener**, correcting only its canonical type from `Kayaks` to `Tools`. Notes, picture, picture sequence, every other record field, counts, paths, media and unrelated source remain unchanged.

The package base revision `9b419e07f9a3a56a2be1ddbfb0df1760fe2730cb`, record hash `31811a75b2d315a2c98a7b25bf8b51fd52c77195b6c54783e90cdb0aa4c57db8`, and base type `Kayaks` were validated before application.

Current verified production:

- application source: `6fae3afbe8f227b4c12875c5d5e8f0d4c0c8861f`
- release: `21d203ccdef509cd99626680ae34de98`
- production workflow: [run 34811980881](https://github.com/ginosega/fishing/actions/runs/34811980881)
- feature exact-head acceptance: [run 34811426937](https://github.com/ginosega/fishing/actions/runs/34811426937) at `f36be26dddfb2da8c0957917c0fceb389192177e`
- hosted v2 files: **342**
- production-bundle artifact: `10334724772`
- production-acceptance-evidence artifact: `10335063749`
- Pages artifact: `10334664984`
- hosted-verification artifact: `10334949254`
- site: https://ginosega.github.io/fishing/
- canonical counts: **80 Gear, 56 KB and 5 Catches**
- measured source baselines: **110 canonical library paths, 245 inventory references**

The exact-main production run passed source/core validation, Chromium/WebKit preview and production acceptance, archived-v1 cutover acceptance, exact-current-main protection, Pages deployment, hosted-byte verification and hosted-browser verification.

FISH102–FISH106 remain DONE / production-verified. FISH106's closeout correctly records that Skylety originally entered canonical Gear using its then-supplied `Kayaks` type; current canonical state is the later FISH107 correction to `Tools`. Do **not** restart FISH096–FISH107 implementation/deployment work.'''
replace_section("Fishing_New_Chat_Bootstrap_Prompt.md", r"## Current production continuation point — .*?\n", "## Current durable behavior", bootstrap_current)
replace_once("Fishing_New_Chat_Bootstrap_Prompt.md", "FISH106 is a Gear/content release only and does not alter either of those unresolved backlog conclusions or any current runtime/authoring architecture.", "FISH106 is a Gear/content release only and does not alter either of those unresolved backlog conclusions or any current runtime/authoring architecture. FISH107 only corrects Skylety's structured type to `Tools` and likewise changes none of those runtime/authoring decisions or backlog conclusions.")
replace_once("Fishing_New_Chat_Bootstrap_Prompt.md", "FISH071–076 and FISH078–106 are complete.", "FISH071–076 and FISH078–107 are complete.")
replace_once("Fishing_New_Chat_Bootstrap_Prompt.md", "The next unused canonical application task ID is **FISH-TODO-107** unless actual newer `main` has already allocated it.", "The next unused canonical application task ID is **FISH-TODO-108** unless actual newer `main` has already allocated it.")
replace_once("Fishing_New_Chat_Bootstrap_Prompt.md", "not** FISH-TODO-107 and does not consume an application task ID.", "not** FISH-TODO-108 and does not consume an application task ID.")

pwa_current = '''## Current verified production — September 14, 2026

FISH107 is live and production-verified.

FISH107 shipped through [PR136](https://github.com/ginosega/fishing/pull/136). It corrected the canonical **Skylety Fishing Hook Sharpener** Gear type from `Kayaks` to `Tools`. This was the only canonical source change; notes, picture, picture sequence and all other fields remain unchanged.

Current production:

- application source: `6fae3afbe8f227b4c12875c5d5e8f0d4c0c8861f`
- release: `21d203ccdef509cd99626680ae34de98`
- production workflow: [run 34811980881](https://github.com/ginosega/fishing/actions/runs/34811980881)
- feature exact-head acceptance: [run 34811426937](https://github.com/ginosega/fishing/actions/runs/34811426937) at `f36be26dddfb2da8c0957917c0fceb389192177e`
- hosted v2 files: **342**
- production-bundle artifact: `10334724772`
- production-acceptance-evidence artifact: `10335063749`
- Pages artifact: `10334664984`
- hosted-verification artifact: `10334949254`

The exact-current-main deployment passed complete source/core validation, Chromium/WebKit preview and production acceptance, archived-v1 cutover acceptance, exact-current-main protection, Pages deployment, hosted-byte verification and hosted-browser verification. Hosted verification reported source revision `6fae3afbe8f227b4c12875c5d5e8f0d4c0c8861f`, release `21d203ccdef509cd99626680ae34de98`, and 342 hosted v2 files.

Canonical counts remain **80 Gear, 56 KB and 5 Catches**. Current measured source-validation baselines remain **110 canonical library paths** and **245 inventory references**.

FISH102–FISH106 remain live and production-verified. FISH106 originally promoted Skylety using its supplied `Kayaks` type; FISH107 supersedes that classification for current production by setting it to `Tools`.'''
replace_section("pwa/README.md", r"## Current verified production — .*?\n", "## Directory layout", pwa_current)
replace_once("pwa/README.md", "FISH106 is a content/Gear release only; it does not alter the runtime, schema, offline, sequence, or authoring architecture described above.", "FISH106 and FISH107 are content/Gear releases only; FISH107's Skylety type correction does not alter the runtime, schema, offline, sequence, or authoring architecture described above.")

closeout = '''# FISH107 Production Closeout — 2026-09-14

## Status

**DONE / production-verified.** FISH107 implemented the supplied structured Gear edit for `skylety-fishing-hook-sharpener`, correcting its type from `Kayaks` to `Tools`. No runtime, schema, authoring, offline, notes or media change was introduced.

## Package validation

Supplied package:

- format: `fishing-companion-change-v2`
- domain: `gear`
- operation: `edit`
- ID: `skylety-fishing-hook-sharpener`
- base schema version: `2`
- base source revision: `9b419e07f9a3a56a2be1ddbfb0df1760fe2730cb`
- base record hash: `31811a75b2d315a2c98a7b25bf8b51fd52c77195b6c54783e90cdb0aa4c57db8`
- base type: `Kayaks`
- requested type: `Tools`
- notes: keep
- picture: keep
- picture sequence: keep

Before application, the base revision was confirmed as an ancestor/current application parent, the current record still had base type `Kayaks`, the record fingerprint exactly matched the supplied hash, and `Tools` was confirmed as an allowed Equipment type. There was no intervening structured Gear conflict.

## Feature PR

- Task: `FISH-TODO-107`
- Branch: `feature/fish107-skylety-type`
- Feature PR: [PR136](https://github.com/ginosega/fishing/pull/136)
- Final exact PR head: `f36be26dddfb2da8c0957917c0fceb389192177e`
- Exact-head acceptance: [run 34811426937](https://github.com/ginosega/fishing/actions/runs/34811426937) — success
- Merged application source: `6fae3afbe8f227b4c12875c5d5e8f0d4c0c8861f`

The final PR patch contained exactly one semantic source change in `pwa/Gear/gear.json`:

```diff
-      "type": "Kayaks",
+      "type": "Tools",
```

No other canonical source, notes, picture, picture sequence, media or acceptance baseline changed.

## Acceptance baselines

Because FISH107 is a one-field reclassification, the validated baselines remain:

- **80 Gear / 56 KB / 5 Catches**
- **110 canonical library paths**
- **245 source inventory references**

The exact feature head passed durable-v1 recovery, dependency audit, source/core validation, Chromium/WebKit preview acceptance, production-root verification, production-browser acceptance and real archived-v1 cutover acceptance.

## Production evidence

Merged-main production source:

- source revision: `6fae3afbe8f227b4c12875c5d5e8f0d4c0c8861f`
- release ID: `21d203ccdef509cd99626680ae34de98`
- production workflow: [run 34811980881](https://github.com/ginosega/fishing/actions/runs/34811980881), run number 188, success
- validate job: `103874988437`, success
- deploy job: `103876502029`, success
- hosted v2 files: **342**
- production-bundle artifact: `10334724772`
- production-acceptance-evidence artifact: `10335063749`
- Pages artifact: `10334664984`
- actual-hosted-production-verification artifact: `10334949254`
- production URL: https://ginosega.github.io/fishing/

The merged-main run passed:

- durable v1 recovery verification;
- locked dependency install/audit;
- source/core validation and preview build;
- Chromium and WebKit preview acceptance;
- production-root build/verification;
- production-browser acceptance and real archived-v1 cutover acceptance;
- exact-current-main guard;
- Pages publication;
- byte-for-byte hosted production verification; and
- hosted browser verification.

Hosted verification reported:

- `sourceRevision`: `6fae3afbe8f227b4c12875c5d5e8f0d4c0c8861f`
- `releaseId`: `21d203ccdef509cd99626680ae34de98`
- `v2Files`: `342`

The hosted verifier also passed production online-only default behavior, explicit complete-library preparation/offline reload, navigation/counts, pinned Knot ordering, image viewer behavior, FISH096 hosted Knot-sequence authoring coverage and FISH103 physical-source/link/caption/Markdown-preview coverage.

## Historical interpretation

FISH106's closeout remains accurate historical evidence: that earlier supplied add package classified Skylety as `Kayaks`. FISH107 is the later authoritative correction, so current canonical and production state is **Skylety Fishing Hook Sharpener → `Tools`**.

## Backlog impact

FISH107 does not imply purchase/completion decisions and does not change unrelated open backlog status.

- `FISH-TODO-005` remains **WAITING ON USER**.
- `FISH-TODO-014` remains **OPEN**.
- Fishing Companion v3 (`FISH-TODO-077/P2`) remains **DEFERRED**.

## Continuation

FISH071–076 and FISH078–107 are complete. The next unused canonical application task ID is **FISH-TODO-108** unless a newer task has already been allocated on actual current `main`.
'''
Path("pwa/docs/FISH107_Production_Closeout_2026-09-14.md").write_text(closeout, encoding="utf-8")

print("FISH107 documentation reconciliation applied")
