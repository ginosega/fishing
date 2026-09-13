from pathlib import Path
import re

SOURCE='4912f93149e9de1e9cde9ff5176b4a4831a67812'
RELEASE='beff9138c96489abd9723c5fcfeef0ff'
RUN='34770966552'
HOSTED='10322381375'
BUNDLE='10322401209'
PAGES='10321928523'
PR='124'
VALIDATION='34770293743'
APPLY='34770525893'
PREMERGE='34770617470'


def read(p): return Path(p).read_text()
def write(p,s): Path(p).write_text(s)
def section(text,start,next_header,new_body):
    pattern=re.escape(start)+r'.*?(?=\n'+re.escape(next_header)+r')'
    repl=start+'\n\n'+new_body.rstrip()+'\n'
    out,n=re.subn(pattern,repl,text,flags=re.S)
    if n!=1: raise RuntimeError(f'section replace failed {start}: {n}')
    return out

prod=(
"FISH-TODO-102 is **DONE / production-verified**. The user-supplied `fishing-companion-change-v2` add package for `line-tackle-knot-reference` was validated in [run 34770293743](https://github.com/ginosega/fishing/actions/runs/34770293743): its submitted base revision `360d71ff2bfaf075ad498d18f05126268f6606f1` is a valid ancestor of the then-current main `1b421ac67d27fb6279b4e5f5a7db9402596323ea`, the ID and Markdown path were unused, and the pre-uploaded PNG exactly matched **2,603,991 bytes** and SHA-256 `520957564ae81f5f0bdee377785f35a31026366260b4822216b1a537ef851072`. Apply/verification [run 34770525893](https://github.com/ginosega/fishing/actions/runs/34770525893) passed all 31 source tests and production-style build verification.\n\n"
"[PR124](https://github.com/ginosega/fishing/pull/124) adds the exact submitted Knot record and Markdown, references `KB/Knots/assets/Line-Tackle-Knot Reference.png`, and adds one scoped display exception: **Line-Tackle-Knot Reference is always the first card on the KB/Knots page; all remaining Knot cards retain alphabetical order**. Pre-merge production acceptance [run 34770617470](https://github.com/ginosega/fishing/actions/runs/34770617470) passed. The feature merge/application source is `4912f93149e9de1e9cde9ff5176b4a4831a67812`. Canonical KB count is **56**; validated library paths are **106** and referenced source files remain **235**.\n\n"
"Current verified production:\n\n"
"- site: https://ginosega.github.io/fishing/\n"
"- source: `4912f93149e9de1e9cde9ff5176b4a4831a67812`\n"
"- release: `beff9138c96489abd9723c5fcfeef0ff`\n"
"- production workflow: [run 34770966552](https://github.com/ginosega/fishing/actions/runs/34770966552)\n"
"- hosted v2 files: **327**\n"
"- production-bundle artifact: `10322401209`\n"
"- Pages artifact: `10321928523`\n"
"- hosted-verification artifact: `10322381375`\n\n"
"The exact-current-main run passed source/core validation, Chromium/WebKit preview and production acceptance, archived-v1 cutover acceptance, exact-current-main protection, Pages deployment, hosted-byte/browser verification, and the explicit live assertion that Line-Tackle-Knot Reference is first while all remaining Knots are alphabetical."
)

p='README.md'; t=read(p); t=section(t,'## Current production — September 13, 2026','## Current product behavior',prod)
t=t.replace('FISH077/P2 — authentication, Direct Save, integrated uploads, offline authoring, outbox/sync and Catch authoring — remains **DEFERRED**.','**Fishing Companion v3** (historical task marker `FISH-TODO-077/P2`) — authentication, Direct Save/direct GitHub writes, integrated browser uploads, offline authoring, outbox/sync, Catch authoring and multi-user generalization — remains **DEFERRED**.')
t=t.replace('The next unused canonical task ID is **FISH-TODO-102**.','The next unused canonical task ID is **FISH-TODO-103**.')
write(p,t)

p='Fishing_Context.md'; t=read(p); context=prod+"\n\nFISH091 offline-library behavior and FISH096 Knot-sequence behavior are unchanged. The new reference uses a static representative picture and no `pictureSequence`."
t=section(t,'## Current authoritative state — September 13, 2026','## Operating mode',context)
t=t.replace('## Deferred scope\n\nFISH-TODO-077/P2 remains **DEFERRED**. Do not treat the following as implemented or implicitly approved: authentication, Direct Save, integrated browser-side GitHub uploads, offline authoring, outbox/sync, Catch authoring or multi-user generalization.','## Fishing Companion v3 — deferred future phase\n\n**Fishing Companion v3** (historical task marker `FISH-TODO-077/P2`) remains **DEFERRED**. Do not treat the following as implemented or implicitly approved: authentication, Direct Save/direct GitHub repository writes, integrated browser-side uploads, offline authoring, outbox/sync, Catch authoring or multi-user generalization. Current production remains **Fishing Companion v2**.')
t=t.replace('FISH071–076 and FISH078–101 are complete except FISH077/P2, which remains deferred.','FISH071–076 and FISH078–102 are complete. Fishing Companion v3 (historical task marker `FISH-TODO-077/P2`) remains deferred.')
t=t.replace('The next unused canonical task ID is **FISH-TODO-102**.','The next unused canonical task ID is **FISH-TODO-103**.')
t=t.replace('do not restart completed FISH096–FISH101 release work.','do not restart completed FISH096–FISH102 release work.')
t=t.replace('Non-Slip Loop uses the submitted static representative `Non-Splip Loop Knot.png`. Every sequence','Non-Slip Loop uses the submitted static representative `Non-Splip Loop Knot.png`. Line-Tackle-Knot Reference uses the static representative `Line-Tackle-Knot Reference.png` and is pinned first on the Knots page; all other Knot cards remain alphabetical. Every sequence')
write(p,t)

p='Fishing_TODO.md'; t=read(p); todo=(prod+"\n\n**Fishing Companion v3** (historical task marker `FISH-TODO-077/P2`) remains **DEFERRED**. It is the future phase for authentication, Direct Save/direct GitHub writes, integrated browser uploads, offline authoring, outbox/sync, Catch authoring and multi-user generalization. Current production remains Fishing Companion v2.\n\nThe next unused canonical task ID is **FISH-TODO-103**.")
t=section(t,'## Current project task state — September 13, 2026','## Completed/superseded application work',todo)
t=t.replace('FISH071–076 and FISH078–101 are complete. FISH077 is the intentional deferred P2 boundary.','FISH071–076 and FISH078–102 are complete. Fishing Companion v3 is the intentional deferred future phase; `FISH-TODO-077/P2` is retained only as its historical task marker.')
t=t.replace('allocate **FISH-TODO-102** unless a newer task has already been created on current `main`. Do not reopen FISH096–FISH101 or P2 work without an explicit new user request.','allocate **FISH-TODO-103** unless a newer task has already been created on current `main`. Do not reopen FISH096–FISH102 or Fishing Companion v3 work without an explicit new user request.')
write(p,t)

p='Fishing_Decision_Log.md'; t=read(p)
t=t.replace('FISH096–FISH101 do not change this decision.','FISH096–FISH102 do not change this decision.')
insert=(
"## FISH102 — Line-Tackle-Knot Reference and pinned-first ordering\n\n"
"**Decision/status:** DONE and production-verified. The user-supplied add package was validated in [run 34770293743](https://github.com/ginosega/fishing/actions/runs/34770293743), including ancestor/base safety, unused identity/path checks and exact verification of the pre-uploaded 2,603,991-byte PNG at SHA-256 `520957564ae81f5f0bdee377785f35a31026366260b4822216b1a537ef851072`. Apply/verification [run 34770525893](https://github.com/ginosega/fishing/actions/runs/34770525893) passed all source tests/build verification. [PR124](https://github.com/ginosega/fishing/pull/124) added the exact submitted record/Markdown/static picture reference plus a narrowly scoped Knot-list ordering exception. Full pre-merge acceptance [run 34770617470](https://github.com/ginosega/fishing/actions/runs/34770617470) passed.\n\n"
"**Durable ordering decision:** `line-tackle-knot-reference` is pinned first on the KB/Knots page. All other Knot cards remain alphabetically sorted. This exception is scoped to the Knot category and does not alter sorting for other KB or Gear lists.\n\n"
"Final verified production source is `4912f93149e9de1e9cde9ff5176b4a4831a67812`, release `beff9138c96489abd9723c5fcfeef0ff`, [run 34770966552](https://github.com/ginosega/fishing/actions/runs/34770966552), **327 hosted v2 files**, hosted-verification artifact `10322381375`. The live verifier explicitly passed pinned Knot ordering, hosted bytes/browser behavior, FISH091 offline behavior and FISH096 sequence acceptance. Canonical KB count is 56.\n\n"
)
marker='## Deferred P2 boundary'
if marker not in t: raise RuntimeError('decision deferred marker missing')
t=t.replace(marker,insert+'## Fishing Companion v3 — deferred future phase',1)
t=t.replace('**Decision:** FISH-TODO-077/P2 remains **DEFERRED**. Authentication, Direct Save, integrated GitHub upload, offline authoring, outbox/sync, Catch authoring and multi-user generalization are not implemented or implicitly authorized by FISH096–FISH101.','**Decision:** **Fishing Companion v3** (historical task marker `FISH-TODO-077/P2`) remains **DEFERRED**. It is the future phase for authentication, Direct Save/direct GitHub repository writes, integrated browser uploads, offline authoring, outbox/sync, Catch authoring and multi-user generalization. None of those capabilities are implemented or implicitly authorized by Fishing Companion v2/FISH096–FISH102.')
t=t.replace('FISH071–076 and FISH078–101 are complete; FISH077/P2 remains deferred.','FISH071–076 and FISH078–102 are complete; Fishing Companion v3 (historical task marker `FISH-TODO-077/P2`) remains deferred.')
t=t.replace('The next unused canonical task ID is **FISH-TODO-102**.','The next unused canonical task ID is **FISH-TODO-103**.')
write(p,t)

p='Fishing_New_Chat_Bootstrap_Prompt.md'; t=read(p); boot=(prod+"\n\nDo **not** restart FISH096–FISH102 implementation/deployment work.")
t=section(t,'## Current production continuation point — September 13, 2026','## Current durable behavior',boot)
t=t.replace('FISH-TODO-077/P2 remains **DEFERRED**: no authentication, Direct Save, integrated browser upload, offline authoring, outbox/sync or Catch authoring.','**Fishing Companion v3** (historical task marker `FISH-TODO-077/P2`) remains **DEFERRED**. It is the future phase for authentication, Direct Save/direct GitHub writes, integrated browser uploads, offline authoring, outbox/sync, Catch authoring and multi-user generalization. Current production remains Fishing Companion v2.')
t=t.replace('FISH071–076 and FISH078–101 are complete. FISH077/P2 remains deferred.','FISH071–076 and FISH078–102 are complete. Fishing Companion v3 remains deferred; `FISH-TODO-077/P2` is its historical task marker.')
t=t.replace('The next unused canonical task ID is **FISH-TODO-102** unless actual newer `main` has already allocated it.','The next unused canonical task ID is **FISH-TODO-103** unless actual newer `main` has already allocated it.')
write(p,t)

p='pwa/README.md'; t=read(p); pwa=(prod+"\n\nActive Knot sequences remain Palomar 13 PNG, Albright 15 JPG, Arbor 9 JPG, Bowline 7 JPG, FG 29 JPG, Improved Clinch 11 PNG, Modified Uni 12 JPG and Trilene 15 PNG. Non-Slip Loop and Line-Tackle-Knot Reference use static representative pictures. Line-Tackle-Knot Reference is the intentional first card on the Knots page; all remaining Knots remain alphabetical.")
t=section(t,'## Current verified production — September 13, 2026','## Directory layout',pwa)
t=t.replace('FISH077/P2 remains deferred: no authentication, Direct Save, integrated browser uploads, offline authoring/outbox/sync or Catch authoring.','**Fishing Companion v3** (historical task marker `FISH-TODO-077/P2`) remains deferred: no authentication, Direct Save/direct GitHub writes, integrated browser uploads, offline authoring/outbox/sync, Catch authoring or multi-user generalization. Current production remains Fishing Companion v2.')
write(p,t)

files=['README.md','Fishing_Context.md','Fishing_TODO.md','Fishing_Decision_Log.md','Fishing_New_Chat_Bootstrap_Prompt.md','pwa/README.md']
for p in files:
    s=read(p)
    for needle in [SOURCE,RELEASE,'34770966552','Fishing Companion v3']:
        if needle not in s: raise RuntimeError(f'{p} missing {needle}')
    if 'next unused canonical task ID is **FISH-TODO-102**' in s: raise RuntimeError(f'{p} has stale next ID')
if 'KB_PINNED_FIRST' not in read('pwa/src/ui.mjs'): raise RuntimeError('runtime pinned rule missing')
print('FISH102_DOCS_RECONCILIATION_PASSED=1')
