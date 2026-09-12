# FISH096 — Knot Step-by-Step Picture Sequences Design

**Document type:** Implementation design  
**Status:** APPROVED / IMPLEMENTED / PRODUCTION-VERIFIED  
**Date:** September 12, 2026  
**Requirements:** `FISH096_Knot_Step_By_Step_Picture_Sequences_Requirements_2026-09-12.md`, approved as written including S1–S11  
**Requirements approval:** `FISH096_Requirements_Approval_2026-09-12.md`  
**Baseline:** current `main` at `a79e66d5207cf1405f6ce331287fbd2627a65506`  
**Approval/outcome:** The user separately approved this design and authorized implementation; implementation, production deployment, hosted verification, and project-state closeout are complete. See `FISH096_Design_Approval_2026-09-12.md` and `FISH096_Production_Closeout_2026-09-12.md`.  
**Historical gate note:** This design document did not itself authorize implementation while it was awaiting design review; that gate was later satisfied by the separate design approval.

## 1. Design summary

FISH096 will extend the existing Knowledge Base picture model with one optional Knot-only ordered field, `pictureSequence`, while preserving the existing `picture` object as the canonical representative-picture contract.

A sequenced Knot will therefore have:

- its existing `picture` object, whose `src` is always the final sequence frame; and
- an explicit ordered `pictureSequence` array containing every sequence-frame repository path from first through final.

The ordinary card/detail UI will continue to read only `picture.src`, so a sequenced Knot displays the completed/final knot exactly like a normal static picture. Only activation of that picture will switch to the sequence viewer.

Authoring will remain inside the existing Picture section. The editor will treat `picture` plus `pictureSequence` as one logical media state so conversions between static and sequence states are explicit and conflict-safe. Sequence files remain manually uploaded to GitHub under `KB/Knots/assets/<knot-id>/` before repository promotion.

No generic gallery framework, per-frame caption model, new backend, Direct Save capability, or FISH077/P2 behavior is introduced.

## 2. Current implementation surfaces

The design is based on the current production architecture:

- `pwa/src/viewer.mjs` exposes `openViewer(src, alt, caption)` with modal dialog, zoom, pan, pinch, wheel zoom, keyboard zoom, Close and focus restoration.
- `pwa/src/ui.mjs` uses `record.picture.src` for the displayed image and opens `openViewer(...)` from the detail-page picture.
- `pwa/src/editor.mjs` has one Picture section, one Picture action selector, one file input, one repository picture path field, one optional caption, one preview, and one post-Prepare repository upload link.
- `pwa/src/handoff.mjs` treats picture changes separately from generic structured fields and produces `fishing-companion-change-v2` packages.
- `pwa/contracts/schema.json` currently allows one optional `picture` on KB entities.
- `pwa/src/validation.mjs` currently collects `notes`, `content`, and `picture.src` as authoritative source paths.
- `pwa/tools/library.mjs` validates every referenced image and builds the release manifest from referenced structured paths plus local Markdown references.
- FISH091 already makes ordinary browsing online-only by default and makes complete offline-library preparation explicit.

FISH096 will extend these surfaces rather than replace them.

## 3. Canonical data model

### 3.1 New optional field

Add this optional property to KB entities:

```json
"pictureSequence": [
  "KB/Knots/assets/knot-trilene/step-01.jpg",
  "KB/Knots/assets/knot-trilene/step-02.jpg",
  "KB/Knots/assets/knot-trilene/step-03.jpg"
]
```

The field is intentionally a simple ordered array of repository-relative paths. No per-frame object wrapper is needed because FISH096 has no per-frame caption, title, duration, crop, or annotation metadata.

### 3.2 Representative picture remains authoritative

For a sequence record, the normal `picture` object remains present:

```json
"picture": {
  "src": "KB/Knots/assets/knot-trilene/step-12.jpg",
  "caption": "Trilene Knot"
}
```

The invariant is:

```text
picture.src === pictureSequence[pictureSequence.length - 1]
```

That means existing list/card/detail rendering continues to work without learning a second representative-image rule.

### 3.3 No schema-version bump

`KB/kb.json` remains `schemaVersion: 2` and the handoff envelope remains `fishing-companion-change-v2`.

The new field is additive and optional; old records need no migration. Current release integrity prevents mixing an old application bundle with a newer incompatible release payload, so a broad schema-version migration would add complexity without product value.

### 3.4 Schema shape

`pwa/contracts/schema.json` will add `pictureSequence` to `kbEntity` with:

- array type;
- minimum 2 items;
- unique path strings;
- the existing `$defs/path` contract for each item.

Cross-field rules that JSON Schema cannot express cleanly—Knot-only, exact folder, filename numbering, and final-frame equality—will be enforced by semantic validation.

## 4. Sequence path and semantic validation

### 4.1 Canonical sequence folder helper

Add a shared helper concept equivalent to:

```text
sequenceFolder(record) = KB/Knots/assets/<record.id>
```

and a frame-path helper equivalent to:

```text
sequencePicturePath(record, filename) =
  KB/Knots/assets/<record.id>/<filename>
```

Both paths pass through the existing `safePath` protections.

### 4.2 Filename validation

A valid sequence filename uses the canonical stem:

```text
step-01.ext
step-02.ext
...
```

The implementation will parse the decimal suffix and require that the suffix for frame N equals `String(N).padStart(2, '0')`.

This allows the convention to continue naturally past 99 if ever needed (`step-100`) without permitting ambiguous forms such as `step-001` for frame 1.

Accepted extensions remain the existing JPEG/JPG/PNG/WebP/GIF set. Mixed supported extensions are allowed because the requirements did not require a uniform extension across a sequence.

### 4.3 Semantic sequence rules

`validateSemantics` / sequence-specific helpers will require all of the following whenever `pictureSequence` exists:

1. domain is KB;
2. `record.type === 'knot'`;
3. `record.picture` exists;
4. sequence contains at least two paths;
5. every path is unique;
6. every path is under exactly `KB/Knots/assets/<record.id>/`;
7. every basename matches the canonical step pattern;
8. parsed step numbers are exactly contiguous from 1 through N;
9. array order matches those step numbers;
10. the final array element equals `record.picture.src`.

A non-Knot KB entry with `pictureSequence` fails closed.

### 4.4 Source-path collection

`collectPaths(data)` will add every `pictureSequence` entry to the authoritative path set in addition to `picture.src`.

Because the final frame appears in both places, the existing `Set` naturally deduplicates it.

This one change causes every sequence frame to flow through current source existence, image decode, dimensions, byte-limit, collision, manifest, release-integrity, and explicit-offline-library machinery.

### 4.5 Library-path validation

`validateLibraryPaths(data)` will retain the current general picture validation and add sequence-specific location validation. It will not discover frames by scanning directories.

Directory scanning remains only an integrity/collision check; authoritative membership comes from `pictureSequence`.

## 5. Sequence viewer design

### 5.1 Preserve static viewer API

`openViewer(src, alt, caption='')` will remain callable with its existing behavior and visible controls.

Add a separate public function:

```text
openSequenceViewer(sources, alt, caption='')
```

The two viewers should share internal stage/gesture/dialog helpers where practical so zoom/pan accessibility behavior does not diverge, but static behavior must remain regression-compatible.

### 5.2 Viewer state

The sequence viewer owns only transient in-memory state:

- `index`, initially 0;
- `playing`, initially false;
- one playback timer or scheduled timeout;
- zoom/pan state for the currently displayed frame;
- object/image preload state.

No browser persistence is introduced.

### 5.3 Frame rendering

Opening a sequence viewer:

1. displays `sources[0]` immediately;
2. displays frame indicator `1 of N`;
3. disables Previous;
4. enables Next unless N is 1, which canonical validation already prevents;
5. renders caption below the image using the same general treatment as the static viewer;
6. starts background preloading of the remaining sequence frames only.

Ordinary page/card rendering does not preload the sequence.

### 5.4 Controls

Visible primary controls are exactly:

**Previous | Play/Pause | Next | Close**

- Previous decrements by one and never wraps.
- Next increments by one and never wraps.
- Play starts timed advancement.
- While playing, the button text becomes Pause.
- Close stops playback and closes the dialog.

The frame indicator is separate from the four-button row so it does not become a fifth control.

### 5.5 Playback timing

Play does not advance immediately. The current frame remains visible for the normal interval, then advances approximately every 1000 ms.

On each automatic tick:

```text
index = (index + 1) % sources.length
```

so the final frame remains visible for its normal interval before looping to frame 1.

Pause clears the active timer without changing the current index.

### 5.6 Manual navigation while playing

Previous or Next first stops playback, then moves exactly one valid frame.

The Play/Pause label returns to Play after that manual navigation.

### 5.7 Zoom and pan on frame changes

Any frame change—manual or automatic—resets zoom/pan to the default 100% centered state before displaying the new frame.

This is the proposed design because carrying translation/zoom coordinates across differently sized instructional photographs can show the next frame off-center or partially outside the visible stage.

Pinch, pointer pan, Ctrl/Cmd-wheel zoom and the existing internal 1×–8× zoom bounds remain available on the current frame. The sequence viewer does not add the static viewer's visible `−`, `+`, or `Reset` controls.

### 5.8 Keyboard behavior

Within the sequence dialog:

- Left Arrow = Previous;
- Right Arrow = Next;
- Space = Play/Pause;
- Escape = Close/native dialog cancellation.

The Space shortcut must not double-fire when focus is already on a button; native button activation wins for interactive controls.

Manual keyboard Previous/Next follows the same non-wrapping and playback-pausing rules as pointer activation.

### 5.9 Accessibility

- Dialog retains modal semantics and prior-focus restoration.
- Buttons use explicit accessible names.
- Disabled Previous/Next use actual disabled state.
- Frame indicator remains ordinary accessible text rather than an assertive/live announcement, avoiding one announcement per playback second.
- Image alt text remains based on the Knot name; current frame position is conveyed separately by the indicator.
- No autoplay occurs on open.
- `prefers-reduced-motion` requires no extra automatic suppression because playback is explicitly user-started and the design adds no decorative frame-transition animation.

### 5.10 Frame load failure

If a requested frame cannot load during an online session, playback stops and the viewer reports the failure rather than skipping the frame or silently changing sequence order.

Release build validation still guarantees that deployed sequence references are structurally valid; this runtime case primarily covers transient online/network failure.

## 6. Page integration

`pwa/src/ui.mjs` will keep using `record.picture.src` to render the ordinary picture.

`appendPicture(...)` will branch only on whether a validated `record.pictureSequence` exists:

- static record → existing `openViewer(...)`;
- sequenced Knot → `openSequenceViewer(record.pictureSequence.map(ctx.asset), record.name, caption)`.

No card/list rendering change is needed because those surfaces already use `record.picture.src`, which is the approved final frame.

## 7. Editor media-state design

### 7.1 One Picture section remains

No separate sequence editor section will be added.

The current Picture section continues to contain:

- Picture action;
- preview;
- local file chooser;
- Repository picture path;
- Caption (optional).

Sequence mode changes the behavior of those same controls.

### 7.2 User-facing Picture action choices

For a new or existing Knot with no picture:

- Keep no picture
- Add picture
- Add step-by-step sequence

For a Knot with a static picture:

- Keep current picture
- Replace picture
- Replace with step-by-step sequence
- Remove picture

For a Knot with a sequence:

- Keep current sequence
- Replace step-by-step sequence
- Replace with single picture
- Remove sequence, keep representative picture
- Remove picture

Non-Knot entries retain static-picture choices only.

### 7.3 Type-change resolution

If an existing sequence is present and the user changes Type away from Knot, the editor does not hide the controls needed to resolve that sequence.

It shows a corrective warning and allows the user to choose one of:

- Replace with single picture;
- Remove sequence, keep representative picture;
- Remove picture.

Prepare Changes remains blocked while a non-Knot working record still contains sequence state.

### 7.4 Internal media action

The editor may use a more expressive internal `mediaAction` state than the existing four package actions, for example:

```text
keep
add-static
replace-static
add-sequence
replace-with-sequence
replace-sequence
replace-with-static
remove-sequence-keep-picture
remove-picture
```

This is an editor implementation detail. At package time it maps to the separate `picture` and `pictureSequence` package actions described later.

## 8. Sequence file selection and preview

### 8.1 Multi-file input

In sequence mode the existing input receives `multiple` and retains the current accepted image MIME/extensions.

The label becomes **Choose local pictures**. Browser-native chooser button/status wording is not customized.

### 8.2 Browser validation

Every selected file is passed through the existing `validateBrowserImage` path.

After individual image validation, a sequence validator:

1. parses step numbers from filenames;
2. rejects duplicate step numbers;
3. rejects gaps;
4. sorts by numeric step;
5. verifies canonical filename numbering;
6. derives each destination path from current Knot ID;
7. derives the final representative `picture.src` from the final ordered frame.

The browser selection order therefore does not become authoritative; filenames and explicit resulting array order do.

### 8.3 Add-entry ID changes

On Add Entry, the existing ID is derived from Name until manually touched.

If a sequence has already been selected and that auto-derived ID later changes, the editor recomputes every derived sequence destination path and the final Repository picture path from the new ID.

If the user manually edits ID before preparing, the same recomputation occurs from the manually chosen valid ID.

Edit Entry IDs remain read-only as today.

### 8.4 Repository picture path field

In static mode, the existing field behavior remains.

In sequence mode, Repository picture path is automatically populated with the final ordered frame path and is read-only while the sequence action is active. The user does not independently type or choose a different representative picture.

### 8.5 Sequence selection summary

Below the representative preview, the editor shows compact text such as:

```text
12 pictures selected
First frame: step-01.jpg
Representative picture: step-12.jpg
```

A large thumbnail grid or drag/drop sequence reordering UI is not added.

### 8.6 Preview behavior

The preview surface displays the final representative frame, matching the eventual record page.

Clicking that preview opens the real sequence viewer at frame 1 using local object URLs for the selected files. This lets the user verify order, frame count, Previous/Next, Play/Pause, loop behavior, caption, zoom/pan, and final representative selection before Prepare Changes.

All generated object URLs are revoked when the selection changes, the action changes away from that sequence, or the editor disposes.

## 9. Handoff/change-package design

### 9.1 Keep the v2 envelope

The package remains:

```text
format: fishing-companion-change-v2
base.schemaVersion: 2
```

Existing static-picture packages remain valid.

### 9.2 Treat `pictureSequence` outside generic structured changes

`prepareChange(...)` / `promoteChange(...)` will exclude both `picture` and `pictureSequence` from generic `changes.set` / `changes.unset` processing.

They are handled explicitly so the picture and sequence cannot drift apart during conflict handling.

### 9.3 Extend package with `pictureSequence`

A sequence-aware package adds a sibling object:

```json
"pictureSequence": {
  "action": "set",
  "paths": [
    "KB/Knots/assets/knot-trilene/step-01.jpg",
    "KB/Knots/assets/knot-trilene/step-02.jpg",
    "KB/Knots/assets/knot-trilene/step-03.jpg"
  ],
  "files": [
    {
      "path": "KB/Knots/assets/knot-trilene/step-01.jpg",
      "bytes": 123456,
      "sha256": "..."
    }
  ]
}
```

Allowed sequence package actions are:

- `keep`
- `set`
- `remove`

For edit packages whose sequence action is not `keep`, `base` stores the prior `pictureSequence` value or the existing absent sentinel, matching current picture conflict semantics.

### 9.4 Static/sequence action mapping

| User action | `picture.action` | `pictureSequence.action` |
|---|---|---|
| Keep current sequence | `keep` unless caption metadata changed | `keep` |
| Add sequence | `add` | `set` |
| Static → sequence | `replace` | `set` |
| Replace sequence | `replace` | `set` |
| Sequence → new static picture | `replace` | `remove` |
| Remove sequence, keep representative | `keep` if picture metadata unchanged; otherwise `replace` | `remove` |
| Remove picture entirely | `remove` | `remove` |

When `pictureSequence.action === 'set'`, the final `paths` entry must equal `picture.path`.

### 9.5 File metadata

For a sequence set operation, `pictureSequence.files` contains one metadata record for every selected original:

- repository destination path;
- byte count;
- SHA-256.

The final representative frame is already included in that list, so `picture.file` does not duplicate its metadata for sequence packages.

Static picture packages retain the existing `picture.file` behavior.

### 9.6 Package validation

`validatePackage(...)` will verify:

- sequence action enum;
- safe paths;
- set action has >=2 paths;
- paths are unique and ordered;
- files cover every path exactly once when local originals are part of the prepared operation;
- file metadata byte counts and SHA-256 formats are valid;
- final sequence path equals picture path;
- remove/set semantics are compatible with picture action.

### 9.7 Promotion and conflicts

On Edit promotion:

- current `picture` is compared with `picture.base` when picture action changes;
- current `pictureSequence` is compared with `pictureSequence.base` when sequence action changes;
- a mismatch raises the existing review/conflict path;
- picture and sequence changes are applied to an in-memory candidate together;
- full record validation runs only after both are applied.

This prevents one side of the media state from being promoted while the other is stale.

The existing whole-record source revision/fingerprint protections remain unchanged.

## 10. Post-Prepare upload-link design

### 10.1 Static picture behavior

Existing static-picture upload-link behavior remains outside FISH096 unless a shared helper is refactored without changing outcome.

### 10.2 Sequence link

For Add/Replace sequence operations, the prepared-package output near **Copy Changes** will show the sequence destination folder and a clickable link labeled consistently with the existing upload workflow, for example:

```text
Upload the selected originals to:
KB/Knots/assets/knot-trilene/
[Open the repository upload folder]
```

### 10.3 Direct GitHub upload URL

Use a dedicated sequence-upload helper that targets GitHub's upload route, not the current `tree/main/...` browsing route:

```text
https://github.com/ginosega/fishing/upload/main/KB/Knots/assets/<knot-id>
```

Path segments are encoded with the existing safe-path/encoding helper.

This route is chosen because the sequence subfolder may not exist before the first upload; a `tree/main/<new-folder>` URL would not be a valid first-use target.

Implementation must browser-verify the GitHub route during FISH096 acceptance. If GitHub's web behavior changes, implementation must adopt another direct GitHub upload URL/flow that still satisfies S11; falling back to only `KB/Knots/assets/` is not acceptable.

### 10.4 Output timing

The sequence upload link appears only after a package containing a new/replacement local sequence has been successfully prepared, matching the existing static-picture workflow.

No upload link is needed for **Remove sequence, keep representative picture** because no new local files are required.

## 11. Build, release and offline behavior

### 11.1 Build inventory

Once `collectPaths` contains every sequence frame, `pwa/tools/library.mjs` will naturally:

- require each referenced source file to exist;
- validate bytes/format/dimensions/decode budget;
- include each frame in the release manifest;
- include each frame in total release bytes and hashes.

No directory scan is used to add extra unreferenced frames to production.

### 11.2 FISH091 online behavior

No service-worker or offline-lifecycle redesign is expected.

Ordinary card/detail display requests only the final representative image. When the user opens the sequence viewer, that viewer requests the first frame and preloads the remainder of that one sequence.

It does not enumerate unrelated library assets and therefore does not regress FISH091's online-only default.

### 11.3 Explicit offline library

Because every sequence frame is in the release manifest, the existing explicit **Connection Status → Update offline library** operation automatically downloads and verifies all sequence frames.

Once that complete generation is prepared, the same sequence viewer works offline without a separate sequence cache.

### 11.4 Failure behavior

A missing/invalid referenced frame fails source build/verification. A failed explicit offline-library refresh retains the prior complete generation under the existing FISH091 rules.

## 12. Planned implementation surface

Expected files, subject to implementation-time validation:

| File | Planned responsibility |
|---|---|
| `pwa/contracts/schema.json` | Add optional KB `pictureSequence` array shape. |
| `pwa/src/shared.mjs` | Sequence folder/path helpers and cross-record semantic sequence invariants. |
| `pwa/src/validation.mjs` | Collect every sequence path; validate exact Knot asset location and numbering. |
| `pwa/src/viewer.mjs` | Add `openSequenceViewer`; share current stage/zoom/pan/dialog mechanics without changing static viewer behavior. |
| `pwa/src/ui.mjs` | Open sequence viewer for records with `pictureSequence`; retain `picture.src` display. |
| `pwa/src/editor.mjs` | Context-sensitive Picture actions, multi-file selection/validation, auto final picture path, local sequence preview, package output and direct per-Knot upload link. |
| `pwa/src/handoff.mjs` | Add explicit sequence package state, metadata, conflict handling and promotion. |
| `pwa/src/image-validation.mjs` | Reuse individual validation; add helper only if useful for multi-file orchestration. |
| `pwa/tools/library.mjs` | No conceptual redesign; consumes expanded `collectPaths` and validates all sequence images. |
| `pwa/test/core.test.mjs` | Schema/semantic/path/handoff/promotion/build regression coverage. |
| `pwa/test/browser.spec.mjs` | Viewer, Add/Edit transitions, preview, package and upload-link behavior in Chromium/WebKit. |
| `pwa/tools/verify-hosted.mjs` | Hosted authoring/preview verification without requiring a permanent production sample sequence. |
| PWA stylesheet | Sequence-control/indicator/editor-summary styling using existing visual language. |

No canonical Knot record or image is added merely to implement FISH096.

## 13. Test and acceptance design

### 13.1 Core/schema tests

Add deterministic tests for:

- static KB records remain valid;
- sequence only on Knot;
- sequence requires picture;
- min two frames;
- duplicate/gapped/misordered numbering fails;
- wrong `<knot-id>` folder fails;
- unsafe/unsupported paths fail;
- final sequence entry must equal `picture.src`;
- every frame appears in `collectPaths` and release manifest;
- final frame is not duplicated in the manifest;
- handoff package validates every media transition;
- promotion applies sequence/picture atomically;
- stale picture or stale sequence base produces conflict review;
- sequence file metadata covers all intended frames.

### 13.2 Browser viewer tests

Use isolated test-release fixtures containing a synthetic Knot sequence so production canonical data does not need test content.

Verify:

- ordinary page shows final frame;
- click opens frame 1;
- indicator updates;
- Previous/Next boundary disabling;
- no manual wrap;
- Play waits one interval then advances;
- final→first automatic loop;
- Pause;
- manual action pauses playback;
- Close clears timer;
- Left/Right/Space/Escape;
- caption remains unchanged across frames;
- zoom/pan capability remains available;
- zoom/pan resets on frame change;
- static viewer retains existing controls/regressions.

### 13.3 Authoring tests

Use Playwright multi-file input fixtures to verify:

- Add Knot exposes Add step-by-step sequence;
- non-Knot Add does not;
- multi-select validates all files;
- selection order does not override filename step order;
- invalid filename/gap/duplicate blocks Prepare;
- final frame auto-populates Repository picture path;
- sequence summary shows count/first/final;
- representative preview opens sequence viewer at frame 1;
- Add ID changes recalculate folder/path;
- static→sequence conversion requires full selected sequence;
- existing static picture is not implicitly reused;
- sequence→sequence replacement;
- sequence→new static picture;
- remove sequence/keep representative without a new file;
- remove picture removes both states;
- type-away-from-Knot is blocked until sequence resolved;
- caption survives or updates correctly across conversions.

### 13.4 Upload-link tests

For both Add and Edit set-sequence operations:

- Prepare Changes renders the link near the package controls;
- displayed folder is `KB/Knots/assets/<knot-id>/`;
- href targets the encoded direct GitHub upload route for that exact folder;
- no parent-only `KB/Knots/assets/` link is accepted;
- first-time sequence folder uses the same direct destination pattern.

Implementation acceptance must also manually/browser-verify that the live GitHub route can accept files into a previously absent per-Knot path.

### 13.5 FISH091 regression tests

A normal online page view of a sequenced Knot must read fewer than the full manifest and must not create a complete offline generation.

Opening a sequence may request that sequence's frames but not unrelated library assets.

After explicit Update offline library, disconnect and full reload; the sequence must remain fully usable offline.

### 13.6 Hosted verification without permanent sample data

If no real sequence has yet been committed at deployment time, hosted verification will exercise the deployed Add/Edit authoring path with local test image fixtures and the local sequence preview viewer.

Canonical-record runtime sequence behavior remains covered by isolated build/browser fixtures. A future real Knot sequence content change will then pass the same source/build/hosted integrity pipeline naturally.

## 14. Acceptance mapping highlights

The implementation must cover all approved A01–A29 requirements. In particular:

- A03/A04 → final representative display + frame-1 viewer open;
- A05–A12 → manual/playback/keyboard/cleanup behavior;
- A13–A22 → Add/Edit state machine and conversions;
- A23 → build failure on missing frame;
- A24 → online-only normal browsing regression;
- A25/A26 → explicit offline preparation and offline viewer;
- A27 → Chromium/WebKit regression suite;
- A28 → hosted deployed behavior;
- A29 → exact per-Knot post-Prepare upload link.

## 15. Approved design choices

The following implementation choices were approved with this design and subsequently implemented unless implementation-time validation required an equivalent change consistent with the approved requirements:

1. Canonical field name is `pictureSequence`, an ordered array of path strings.
2. `picture.src` remains mandatory for a sequence and equals the final array element.
3. No schema-version or handoff-format version bump.
4. Browser file-selection order is ignored; canonical order comes from validated `step-##` filenames.
5. Sequence-mode Repository picture path is auto-populated and read-only.
6. Frame changes reset zoom/pan to 100% centered state.
7. Background preload begins only after the viewer opens and is limited to that one sequence.
8. Handoff adds a sibling `pictureSequence` package object with `keep | set | remove` actions rather than proliferating many picture-action enum values.
9. The direct sequence upload link uses GitHub's `/upload/main/KB/Knots/assets/<knot-id>` route, subject to implementation-time live verification.
10. FISH096 itself does not add a permanent example Knot sequence to canonical production data.

## 16. Failure rules

- Never infer authoritative sequence membership by scanning a folder.
- Never accept a non-Knot sequence.
- Never allow `picture.src` and final sequence frame to disagree.
- Never silently renumber, rename, skip, or reorder invalid local files.
- Never promote only one half of a conflicting picture/sequence media state.
- Never automatically reuse a prior static picture when creating a sequence.
- Never delete superseded source files as part of this feature.
- Never load all Fishing Companion images merely because a sequence viewer exists.
- Never skip a failed frame during playback and pretend the sequence is complete.
- Never make a first-time sequence upload link point only to the generic Knot assets parent when the approved per-Knot destination is required.

## 17. Non-goals

No FISH077/P2 features are introduced: no Direct Save, auth, integrated upload, outbox, offline editing, synchronization, Catch authoring, account/backend infrastructure, or automatic repository mutation.

No general gallery, per-frame captions, drag/drop ordering UI, per-frame editing UI, speed selector, autoplay-on-open, video/audio, or animated-file generation is added.

Static Gear and non-Knot KB picture behavior is not redesigned.

## 18. Design signoff gate — satisfied

The user explicitly approved this design and authorized implementation; that approval is recorded in `FISH096_Design_Approval_2026-09-12.md`.

Implementation, automated acceptance, PR/CI, merge, production deployment, hosted verification, and final project-state reconciliation were subsequently completed. The authoritative release record is `FISH096_Production_Closeout_2026-09-12.md`.
