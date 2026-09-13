from pathlib import Path
import re

def replace_section(path, start, end, body):
    p=Path(path); text=p.read_text()
    pattern=rf'{re.escape(start)}.*?(?=\n{re.escape(end)})'
    new,n=re.subn(pattern,body.rstrip(),text,count=1,flags=re.S)
    if n != 1: raise SystemExit(f'could not replace section in {path}: {n}')
    p.write_text(new)

readme='''## Current production — September 13, 2026

FISH-TODO-099 is **DONE / production-verified**. Four user-supplied `fishing-companion-change-v2` KB packages were validated against current source and applied together in [PR116](https://github.com/ginosega/fishing/pull/116): Albright content/description refinement, Arbor content plus a 9-frame sequence, new Bowline Knot content plus a 7-frame sequence, and FG content plus a 29-frame sequence. Branch validation [run 34738967489](https://github.com/ginosega/fishing/actions/runs/34738967489) verified all package base fingerprints/content hashes and recomputed all **45** pre-uploaded JPG byte counts and SHA-256 hashes before promotion. Pre-merge production acceptance [run 34738991146](https://github.com/ginosega/fishing/actions/runs/34738991146) passed.

The first production deploy exposed only a stale hosted-verifier count fixture after Bowline raised the KB count from 56 to 57. Verification-only [PR117](https://github.com/ginosega/fishing/pull/117) changed that expected count and passed full CI before merge. The clean exact-current-main production rerun then passed end to end.

Current verified production:

- site: https://ginosega.github.io/fishing/
- source: `9899849be676e971e3670fe72eba7ffd66986d68`
- release: `b331a8c5575769159113a59a17b12bca`
- production workflow: [run 34740072017](https://github.com/ginosega/fishing/actions/runs/34740072017)
- hosted v2 files: **288**
- hosted-verification artifact: `10312475498`

The final production run passed source/core validation, Chromium/WebKit preview and production acceptance, archived-v1 cutover acceptance, exact-current-main protection, Pages deployment, all hosted-byte comparisons and hosted browser verification.

FISH099 preserves Albright's existing 15-frame sequence while changing its description to `Easier on-the-water braid-to-fluoro alternative to the FG knot` and replacing its Markdown exactly. Arbor now uses description `Use for tying line to spool`, the submitted Markdown, representative `step-09.jpg`, and ordered `step-01.jpg` through `step-09.jpg`. Bowline Knot is a new canonical Knot with the submitted Markdown, representative `step-07.jpg`, and ordered `step-01.jpg` through `step-07.jpg`. FG retains its existing structured description, uses the submitted Markdown, representative `step-29.jpg`, and ordered `step-01.jpg` through `step-29.jpg`.
'''
replace_section('README.md','## Current production —','## Current product behavior',readme)
p=Path('README.md'); t=p.read_text()
t=t.replace('FISH097 applies that capability to Palomar with 13 explicit PNG frames. FISH098 applies it to Albright with 15 explicit JPG frames and the exact submitted Markdown replacement.','FISH097 applies that capability to Palomar with 13 explicit PNG frames. FISH098 applies it to Albright with 15 explicit JPG frames. FISH099 adds explicit Arbor (9 JPG), Bowline (7 JPG), and FG (29 JPG) sequences and updates the submitted knot content while preserving Palomar and Albright sequence behavior.')
t=t.replace('The next unused canonical task ID is **FISH-TODO-099**.','The next unused canonical task ID is **FISH-TODO-100**.')
p.write_text(t)

context='''## Current authoritative state — September 13, 2026

FISH-TODO-099 is **DONE / production-verified**. Four explicit user-supplied KB change packages were validated and applied through [PR116](https://github.com/ginosega/fishing/pull/116). Branch validation [run 34738967489](https://github.com/ginosega/fishing/actions/runs/34738967489) confirmed source-aware record/content bases and recomputed all 45 pre-uploaded JPG byte counts/SHA-256 hashes exactly. Pre-merge acceptance [run 34738991146](https://github.com/ginosega/fishing/actions/runs/34738991146) passed. A one-line stale hosted-verifier KB-count expectation discovered after the initial Pages deploy was repaired in verification-only [PR117](https://github.com/ginosega/fishing/pull/117), which also passed full CI.

Current verified production:

- source `9899849be676e971e3670fe72eba7ffd66986d68`
- release `b331a8c5575769159113a59a17b12bca`
- [workflow run 34740072017](https://github.com/ginosega/fishing/actions/runs/34740072017)
- 288 hosted v2 files
- hosted-verification artifact `10312475498`

The final run passed source/core validation, Chromium/WebKit preview acceptance, production-browser acceptance, actual archived-v1 cutover acceptance, exact-current-main guard, Pages deployment, hosted-byte verification and hosted-browser verification.

FISH096 remains the implemented sequence capability. FISH097 activates Palomar, FISH098 activates Albright, and FISH099 adds Arbor, Bowline, and FG sequences while updating only the package-requested canonical content. Albright keeps its existing 15-frame sequence and now has description `Easier on-the-water braid-to-fluoro alternative to the FG knot`. Arbor uses 9 frames with `step-09.jpg` representative. Bowline is a new Knot using 7 frames with `step-07.jpg` representative. FG retains its prior structured description and uses 29 frames with `step-29.jpg` representative.
'''
replace_section('Fishing_Context.md','## Current authoritative state —','## Operating mode',context)
p=Path('Fishing_Context.md'); t=p.read_text()
old='''The 13 Palomar step frames at `KB/Knots/assets/knot-palomar/step-01.png` through `step-13.png` are now explicitly referenced by the canonical `knot-palomar` record and are included in the verified production release. `step-13.png` is the representative picture and all 13 frames are part of explicit offline-library preparation.

The 15 Albright step frames at `KB/Knots/assets/knot-albright/step-01.jpg` through `step-15.jpg` are explicitly referenced by the canonical `knot-albright` record and included in verified production. `step-15.jpg` is the representative picture and all 15 frames participate in explicit offline-library preparation.'''
new='''The active Knot sequences are Palomar (13 PNG frames, `step-13.png` representative), Albright (15 JPG frames, `step-15.jpg` representative), Arbor (9 JPG frames, `step-09.jpg` representative), Bowline (7 JPG frames, `step-07.jpg` representative), and FG (29 JPG frames, `step-29.jpg` representative). Every sequence is explicitly referenced by canonical KB data and participates in FISH091 explicit complete-library preparation; directory contents alone never create a sequence.'''
if old not in t: raise SystemExit('context media block mismatch')
t=t.replace(old,new).replace('FISH071–076, FISH078–098 are complete except FISH077/P2','FISH071–076, FISH078–099 are complete except FISH077/P2').replace('The next unused canonical task ID is **FISH-TODO-099**.','The next unused canonical task ID is **FISH-TODO-100**.').replace('do not restart completed FISH096, FISH097 or FISH098 release work.','do not restart completed FISH096, FISH097, FISH098 or FISH099 release work.')
p.write_text(t)

todo='''## Current project task state — September 13, 2026

**FISH-TODO-099 — DONE / production-verified.** Four user-supplied `fishing-companion-change-v2` KB packages were validated and applied through [PR116](https://github.com/ginosega/fishing/pull/116). Branch validation [run 34738967489](https://github.com/ginosega/fishing/actions/runs/34738967489) verified the record/content bases and all **45** uploaded JPG byte counts/SHA-256 hashes before promotion. Pre-merge acceptance [run 34738991146](https://github.com/ginosega/fishing/actions/runs/34738991146) passed.

Requested canonical results: Albright description/Markdown updated while its 15-frame sequence was kept; Arbor description/Markdown updated and its 9-frame sequence activated; Bowline Knot added with Markdown and a 7-frame sequence; FG Markdown replaced and its 29-frame sequence activated while keeping its structured description. Representative frames are Albright `step-15.jpg`, Arbor `step-09.jpg`, Bowline `step-07.jpg`, and FG `step-29.jpg`.

The initial production deploy exposed a stale hosted-verifier expected KB count (56 instead of the correct 57 after adding Bowline). Verification-only [PR117](https://github.com/ginosega/fishing/pull/117) repaired that one-line expectation and passed full CI. Final verified production is source `9899849be676e971e3670fe72eba7ffd66986d68`, release `b331a8c5575769159113a59a17b12bca`, [run 34740072017](https://github.com/ginosega/fishing/actions/runs/34740072017), with **288 hosted v2 files** and hosted-verification artifact `10312475498`.

FISH-TODO-077/P2 remains **DEFERRED**. Authentication, Direct Save, integrated uploads, offline authoring, outbox/sync and Catch authoring are not part of current production.

The next unused canonical task ID is **FISH-TODO-100**.
'''
replace_section('Fishing_TODO.md','## Current project task state —','## Completed/superseded application work',todo)
p=Path('Fishing_TODO.md'); t=p.read_text().replace('FISH071–076 and FISH078–098 are complete.','FISH071–076 and FISH078–099 are complete.').replace('allocate **FISH-TODO-099** unless a newer task has already been created on current `main`.','allocate **FISH-TODO-100** unless a newer task has already been created on current `main`.').replace('Do not reopen FISH096/FISH097/FISH098 or P2 work','Do not reopen FISH096/FISH097/FISH098/FISH099 or P2 work')
p.write_text(t)

p=Path('Fishing_Decision_Log.md'); t=p.read_text().replace('FISH096/FISH097/FISH098 do not change this decision.','FISH096/FISH097/FISH098/FISH099 do not change this decision.')
marker='\n## Deferred P2 boundary\n'
section='''
## FISH099 — four Knot content/sequence packages

**Decision/status:** DONE and production-verified. Four explicit user-supplied `fishing-companion-change-v2` packages were applied together through [PR116](https://github.com/ginosega/fishing/pull/116). Branch validation [run 34738967489](https://github.com/ginosega/fishing/actions/runs/34738967489) verified all package record/content bases and recomputed all 45 pre-uploaded JPG byte counts/SHA-256 hashes exactly before promotion. Pre-merge acceptance [run 34738991146](https://github.com/ginosega/fishing/actions/runs/34738991146) passed.

The package set is authoritative for these changes: Albright keeps its existing 15-frame sequence but updates description and Markdown; Arbor receives the submitted description/Markdown plus a 9-frame sequence with `step-09.jpg` representative; Bowline Knot is added with submitted Markdown plus a 7-frame sequence with `step-07.jpg` representative; FG retains its existing structured description, receives the submitted Markdown, and activates a 29-frame sequence with `step-29.jpg` representative. No unrelated domain architecture changed.

The first production deployment correctly published the new 57-record KB but exposed a stale hosted-verifier expected count of 56. Verification-only [PR117](https://github.com/ginosega/fishing/pull/117) changed that one expectation to 57. Final verified production source is `9899849be676e971e3670fe72eba7ffd66986d68`, release `b331a8c5575769159113a59a17b12bca`, [run 34740072017](https://github.com/ginosega/fishing/actions/runs/34740072017), 288 hosted v2 files, hosted-verification artifact `10312475498`. Full CI, exact-current-main deployment, hosted-byte verification and hosted-browser verification passed.
'''
if marker not in t: raise SystemExit('decision marker missing')
t=t.replace(marker,section+marker,1).replace('FISH071–076 and FISH078–098 are complete;','FISH071–076 and FISH078–099 are complete;').replace('The next unused canonical task ID is **FISH-TODO-099**.','The next unused canonical task ID is **FISH-TODO-100**.')
p.write_text(t)

bootstrap='''## Current production continuation point — September 13, 2026

FISH-TODO-099 is **DONE / production-verified**. Four user-supplied KB change packages were validated and applied through [PR116](https://github.com/ginosega/fishing/pull/116). Validation [run 34738967489](https://github.com/ginosega/fishing/actions/runs/34738967489) verified the source-aware bases and all 45 pre-uploaded JPG byte counts/SHA-256 hashes before promotion; pre-merge acceptance [run 34738991146](https://github.com/ginosega/fishing/actions/runs/34738991146) passed. A stale hosted-verifier KB-count fixture discovered after the first deployment was repaired in verification-only [PR117](https://github.com/ginosega/fishing/pull/117).

Current verified production:

- source: `9899849be676e971e3670fe72eba7ffd66986d68`
- release: `b331a8c5575769159113a59a17b12bca`
- production workflow: [run 34740072017](https://github.com/ginosega/fishing/actions/runs/34740072017)
- hosted v2 files: 288
- hosted-verification artifact: `10312475498`
- site: https://ginosega.github.io/fishing/

Active canonical Knot sequences are Palomar (13 PNG), Albright (15 JPG), Arbor (9 JPG), Bowline (7 JPG), and FG (29 JPG). FISH099 changed only the package-requested content/fields and explicit sequence references: Albright description/Markdown; Arbor description/Markdown/sequence; new Bowline record/Markdown/sequence; FG Markdown/sequence with its structured description preserved.

The final production run passed source/core validation, Chromium/WebKit preview and production acceptance, archived-v1 cutover acceptance, exact-current-main deployment protection, Pages deployment, hosted-byte verification and hosted-browser verification.

Do **not** restart FISH096, FISH097, FISH098 or FISH099 implementation/deployment work.
'''
replace_section('Fishing_New_Chat_Bootstrap_Prompt.md','## Current production continuation point —','## Current durable behavior',bootstrap)
p=Path('Fishing_New_Chat_Bootstrap_Prompt.md'); t=p.read_text().replace('FISH071–076 and FISH078–098 are complete.','FISH071–076 and FISH078–099 are complete.').replace('The next unused canonical task ID is **FISH-TODO-099** unless actual newer `main` has already allocated it.','The next unused canonical task ID is **FISH-TODO-100** unless actual newer `main` has already allocated it.')
p.write_text(t)

pwa='''## Current verified production — September 13, 2026

FISH099 is live through [PR116](https://github.com/ginosega/fishing/pull/116) plus verification-only [PR117](https://github.com/ginosega/fishing/pull/117). The four change packages update Albright content/description, activate a 9-frame Arbor sequence, add Bowline with a 7-frame sequence, and activate a 29-frame FG sequence. Package validation [run 34738967489](https://github.com/ginosega/fishing/actions/runs/34738967489) verified all source-aware bases and all 45 exact image byte counts/SHA-256 hashes; pre-merge acceptance [run 34738991146](https://github.com/ginosega/fishing/actions/runs/34738991146) passed.

Current production:

- source: `9899849be676e971e3670fe72eba7ffd66986d68`
- release: `b331a8c5575769159113a59a17b12bca`
- production workflow: [run 34740072017](https://github.com/ginosega/fishing/actions/runs/34740072017)
- hosted v2 files: 288
- hosted-verification artifact: `10312475498`

The clean final deployment passed complete source/core validation, Chromium/WebKit preview and production acceptance, archived-v1 cutover acceptance, exact-current-main guard, Pages deployment, hosted-byte verification and hosted-browser verification. The earlier first deploy had already published correct application content; PR117 repaired only the hosted verifier's stale expected KB count after Bowline increased the KB from 56 to 57.

Active Knot sequences are Palomar 13 PNG frames, Albright 15 JPG frames, Arbor 9 JPG frames, Bowline 7 JPG frames, and FG 29 JPG frames. Representative frames are their respective final frames. Directory contents alone still never activate a sequence; canonical explicit references do.
'''
replace_section('pwa/README.md','## Current verified production —','## Directory layout',pwa)

for file in ['README.md','Fishing_Context.md','Fishing_TODO.md','Fishing_Decision_Log.md','Fishing_New_Chat_Bootstrap_Prompt.md','pwa/README.md']:
    text=Path(file).read_text()
    assert 'b331a8c5575769159113a59a17b12bca' in text, file
    assert '9899849be676e971e3670fe72eba7ffd66986d68' in text, file
for file in ['README.md','Fishing_Context.md','Fishing_TODO.md','Fishing_Decision_Log.md','Fishing_New_Chat_Bootstrap_Prompt.md']:
    assert 'FISH-TODO-100' in Path(file).read_text(), file
