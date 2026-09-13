from pathlib import Path
import re

source = '141198d1fbc1c651cd0b41d642d057c0f3b8a81c'
release = 'cbc4dc21ece3855a8761169070795043'
production_run = '34740936792'
hosted_artifact = '10312795660'
validation_run = '34740644154'
premerge_run = '34740670930'


def replace_section(path, start, end, body):
    p = Path(path)
    text = p.read_text()
    pattern = rf'{re.escape(start)}.*?(?=\n{re.escape(end)})'
    new, n = re.subn(pattern, body.rstrip(), text, count=1, flags=re.S)
    if n != 1:
        raise SystemExit(f'could not replace section in {path}: {n}')
    p.write_text(new)


def replace_once(path, old, new):
    p = Path(path)
    text = p.read_text()
    if text.count(old) != 1:
        raise SystemExit(f'expected one match in {path}: {old!r}; got {text.count(old)}')
    p.write_text(text.replace(old, new, 1))

readme = '''## Current production — September 13, 2026

FISH-TODO-100 is **DONE / production-verified**. The user-supplied `fishing-companion-change-v2` edit package for Palomar was validated and applied through [PR119](https://github.com/ginosega/fishing/pull/119). Package validation [run 34740644154](https://github.com/ginosega/fishing/actions/runs/34740644154) confirmed the submitted base source is an ancestor of current source, the current Palomar record fingerprint exactly matched `d09e83e7cfc3ddd6531389fc460620c66b23cfafb5a1b4866f6c20c89be8e94a`, and the current Markdown SHA-256 exactly matched `05a439f4d5b2a5db6b37666c20dc742e29685cd11aaffce351ae7cc0e7ff8580`. All source tests passed. Pre-merge production acceptance [run 34740670930](https://github.com/ginosega/fishing/actions/runs/34740670930) passed.

FISH100 changes only `KB/Knots/content/palomar.md` to the exact submitted replacement. No structured Palomar fields changed. The existing representative picture `KB/Knots/assets/knot-palomar/step-13.png` and the full explicit 13-frame `pictureSequence` remain unchanged.

Current verified production:

- site: https://ginosega.github.io/fishing/
- source: `141198d1fbc1c651cd0b41d642d057c0f3b8a81c`
- release: `cbc4dc21ece3855a8761169070795043`
- production workflow: [run 34740936792](https://github.com/ginosega/fishing/actions/runs/34740936792)
- hosted v2 files: **288**
- hosted-verification artifact: `10312795660`

The exact-current-main production run passed source/core validation, Chromium/WebKit preview and production acceptance, archived-v1 cutover acceptance, exact-current-main protection, Pages deployment, hosted-byte verification and hosted-browser verification.
'''
replace_section('README.md', '## Current production —', '## Current product behavior', readme)
replace_once('README.md', 'The next unused canonical task ID is **FISH-TODO-100**.', 'The next unused canonical task ID is **FISH-TODO-101**.')

context = '''## Current authoritative state — September 13, 2026

FISH-TODO-100 is **DONE / production-verified**. The explicit user-supplied Palomar `fishing-companion-change-v2` package was validated and applied through [PR119](https://github.com/ginosega/fishing/pull/119). Validation [run 34740644154](https://github.com/ginosega/fishing/actions/runs/34740644154) confirmed the package base ancestry, exact current record fingerprint `d09e83e7cfc3ddd6531389fc460620c66b23cfafb5a1b4866f6c20c89be8e94a`, exact current Markdown SHA-256 `05a439f4d5b2a5db6b37666c20dc742e29685cd11aaffce351ae7cc0e7ff8580`, and unchanged picture/13-frame sequence state. All source tests passed; pre-merge production acceptance [run 34740670930](https://github.com/ginosega/fishing/actions/runs/34740670930) passed.

Current verified production:

- source `141198d1fbc1c651cd0b41d642d057c0f3b8a81c`
- release `cbc4dc21ece3855a8761169070795043`
- [workflow run 34740936792](https://github.com/ginosega/fishing/actions/runs/34740936792)
- 288 hosted v2 files
- hosted-verification artifact `10312795660`

The final run passed source/core validation, Chromium/WebKit preview acceptance, production-browser acceptance, actual archived-v1 cutover acceptance, exact-current-main guard, Pages deployment, hosted-byte verification and hosted-browser verification.

FISH100 replaces only the Palomar Markdown body with the user's submitted instructions and video link. Palomar's structured record remains unchanged, including representative `step-13.png` and its explicit ordered 13-frame PNG sequence. FISH096 sequence behavior, FISH091 offline behavior, and the other active Knot sequences remain unchanged.
'''
replace_section('Fishing_Context.md', '## Current authoritative state —', '## Operating mode', context)
replace_once('Fishing_Context.md', 'FISH071–076, FISH078–099 are complete except FISH077/P2', 'FISH071–076, FISH078–100 are complete except FISH077/P2')
replace_once('Fishing_Context.md', 'The next unused canonical task ID is **FISH-TODO-100**.', 'The next unused canonical task ID is **FISH-TODO-101**.')
replace_once('Fishing_Context.md', 'do not restart completed FISH096, FISH097, FISH098 or FISH099 release work.', 'do not restart completed FISH096, FISH097, FISH098, FISH099 or FISH100 release work.')

todo = '''## Current project task state — September 13, 2026

**FISH-TODO-100 — DONE / production-verified.** The user-supplied Palomar `fishing-companion-change-v2` package was validated and applied through [PR119](https://github.com/ginosega/fishing/pull/119). Validation [run 34740644154](https://github.com/ginosega/fishing/actions/runs/34740644154) confirmed package ancestry, the exact current record fingerprint and exact notes base hash, retained representative `step-13.png`, and retained all 13 explicit sequence frames. All source tests passed. Pre-merge production acceptance [run 34740670930](https://github.com/ginosega/fishing/actions/runs/34740670930) passed.

The requested canonical result is Markdown-only: `KB/Knots/content/palomar.md` was replaced exactly with the submitted four instructional bullets and Palomar video link. No structured fields, picture, or `pictureSequence` references changed.

Final verified production is source `141198d1fbc1c651cd0b41d642d057c0f3b8a81c`, release `cbc4dc21ece3855a8761169070795043`, [run 34740936792](https://github.com/ginosega/fishing/actions/runs/34740936792), with **288 hosted v2 files** and hosted-verification artifact `10312795660`.

FISH-TODO-077/P2 remains **DEFERRED**. Authentication, Direct Save, integrated uploads, offline authoring, outbox/sync and Catch authoring are not part of current production.

The next unused canonical task ID is **FISH-TODO-101**.
'''
replace_section('Fishing_TODO.md', '## Current project task state —', '## Completed/superseded application work', todo)
replace_once('Fishing_TODO.md', 'FISH071–076 and FISH078–099 are complete.', 'FISH071–076 and FISH078–100 are complete.')
replace_once('Fishing_TODO.md', 'allocate **FISH-TODO-100** unless a newer task has already been created on current `main`.', 'allocate **FISH-TODO-101** unless a newer task has already been created on current `main`.')
replace_once('Fishing_TODO.md', 'Do not reopen FISH096/FISH097/FISH098/FISH099 or P2 work', 'Do not reopen FISH096/FISH097/FISH098/FISH099/FISH100 or P2 work')

p = Path('Fishing_Decision_Log.md')
t = p.read_text()
t = t.replace('FISH096/FISH097/FISH098/FISH099 do not change this decision.', 'FISH096/FISH097/FISH098/FISH099/FISH100 do not change this decision.', 1)
marker = '\n## Deferred P2 boundary\n'
section = '''
## FISH100 — Palomar Markdown refinement

**Decision/status:** DONE and production-verified. The explicit user-supplied `fishing-companion-change-v2` edit package for `knot-palomar` was validated and applied through [PR119](https://github.com/ginosega/fishing/pull/119). Validation [run 34740644154](https://github.com/ginosega/fishing/actions/runs/34740644154) confirmed base-source ancestry, exact current record fingerprint `d09e83e7cfc3ddd6531389fc460620c66b23cfafb5a1b4866f6c20c89be8e94a`, exact current Markdown SHA-256 `05a439f4d5b2a5db6b37666c20dc742e29685cd11aaffce351ae7cc0e7ff8580`, and unchanged representative picture/13-frame sequence state. All source tests passed. Pre-merge acceptance [run 34740670930](https://github.com/ginosega/fishing/actions/runs/34740670930) passed.

The package is authoritative for this change: only `KB/Knots/content/palomar.md` is replaced with the exact submitted Markdown. No structured Palomar fields change; `picture.src` remains `KB/Knots/assets/knot-palomar/step-13.png`, and the existing 13-frame `pictureSequence` remains unchanged.

Current production source is `141198d1fbc1c651cd0b41d642d057c0f3b8a81c`, release `cbc4dc21ece3855a8761169070795043`, [run 34740936792](https://github.com/ginosega/fishing/actions/runs/34740936792), 288 hosted v2 files, hosted-verification artifact `10312795660`. Full CI, exact-current-main deployment, hosted-byte verification and hosted-browser verification passed.
'''
if marker not in t:
    raise SystemExit('decision marker missing')
t = t.replace(marker, section + marker, 1)
t = t.replace('FISH071–076 and FISH078–099 are complete;', 'FISH071–076 and FISH078–100 are complete;', 1)
t = t.replace('The next unused canonical task ID is **FISH-TODO-100**.', 'The next unused canonical task ID is **FISH-TODO-101**.', 1)
t = t.replace('not implemented or implicitly authorized by FISH096–FISH099.', 'not implemented or implicitly authorized by FISH096–FISH100.', 1)
p.write_text(t)

bootstrap = '''## Current production continuation point — September 13, 2026

FISH-TODO-100 is **DONE / production-verified**. The user-supplied Palomar Markdown-only change package was validated and applied through [PR119](https://github.com/ginosega/fishing/pull/119). Validation [run 34740644154](https://github.com/ginosega/fishing/actions/runs/34740644154) confirmed package ancestry, exact current record fingerprint and Markdown base hash, and unchanged picture/13-frame sequence state. Pre-merge production acceptance [run 34740670930](https://github.com/ginosega/fishing/actions/runs/34740670930) passed.

Current verified production:

- source: `141198d1fbc1c651cd0b41d642d057c0f3b8a81c`
- release: `cbc4dc21ece3855a8761169070795043`
- production workflow: [run 34740936792](https://github.com/ginosega/fishing/actions/runs/34740936792)
- hosted v2 files: 288
- hosted-verification artifact: `10312795660`
- site: https://ginosega.github.io/fishing/

FISH100 changes only `KB/Knots/content/palomar.md` to the user's exact submitted replacement. Palomar's structured record, `step-13.png` representative image, and explicit 13-frame sequence remain unchanged. All other FISH099 content and active Knot sequences remain intact.

The production run passed source/core validation, Chromium/WebKit preview and production acceptance, archived-v1 cutover acceptance, exact-current-main deployment protection, Pages deployment, hosted-byte verification and hosted-browser verification.

Do **not** restart FISH096, FISH097, FISH098, FISH099 or FISH100 implementation/deployment work.
'''
replace_section('Fishing_New_Chat_Bootstrap_Prompt.md', '## Current production continuation point —', '## Current durable behavior', bootstrap)
replace_once('Fishing_New_Chat_Bootstrap_Prompt.md', 'FISH071–076 and FISH078–099 are complete.', 'FISH071–076 and FISH078–100 are complete.')
replace_once('Fishing_New_Chat_Bootstrap_Prompt.md', 'The next unused canonical task ID is **FISH-TODO-100** unless actual newer `main` has already allocated it.', 'The next unused canonical task ID is **FISH-TODO-101** unless actual newer `main` has already allocated it.')

pwa = '''## Current verified production — September 13, 2026

FISH100 is live through [PR119](https://github.com/ginosega/fishing/pull/119). The user-supplied change package replaces only Palomar's canonical Markdown; no structured record, representative image, or sequence references changed. Package validation [run 34740644154](https://github.com/ginosega/fishing/actions/runs/34740644154) verified exact base ancestry, record fingerprint and Markdown SHA-256 and retained all 13 sequence frames. Pre-merge production acceptance [run 34740670930](https://github.com/ginosega/fishing/actions/runs/34740670930) passed.

Current production:

- source: `141198d1fbc1c651cd0b41d642d057c0f3b8a81c`
- release: `cbc4dc21ece3855a8761169070795043`
- production workflow: [run 34740936792](https://github.com/ginosega/fishing/actions/runs/34740936792)
- hosted v2 files: 288
- hosted-verification artifact: `10312795660`

The exact-current-main deployment passed complete source/core validation, Chromium/WebKit preview and production acceptance, archived-v1 cutover acceptance, Pages deployment, hosted-byte verification and hosted-browser verification.

Active Knot sequences remain Palomar 13 PNG frames, Albright 15 JPG frames, Arbor 9 JPG frames, Bowline 7 JPG frames, and FG 29 JPG frames. FISH100 does not alter sequence behavior or media; it changes only Palomar's Markdown instructions/video content.
'''
replace_section('pwa/README.md', '## Current verified production —', '## Directory layout', pwa)

# Cross-file consistency guard.
for path in ['README.md','Fishing_Context.md','Fishing_TODO.md','Fishing_Decision_Log.md','Fishing_New_Chat_Bootstrap_Prompt.md','pwa/README.md']:
    text = Path(path).read_text()
    if source not in text or release not in text or production_run not in text or hosted_artifact not in text:
        raise SystemExit(f'missing FISH100 production identity in {path}')
for path in ['README.md','Fishing_Context.md','Fishing_TODO.md','Fishing_Decision_Log.md','Fishing_New_Chat_Bootstrap_Prompt.md']:
    if 'FISH-TODO-101' not in Path(path).read_text():
        raise SystemExit(f'next task ID not advanced in {path}')
print('FISH100 reconciliation prepared and cross-file consistency checks passed')
