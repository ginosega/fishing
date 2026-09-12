# FISH096 — Knot Step-by-Step Picture Sequences

**Document type:** Change request and requirements specification  
**Status:** DRAFT FOR REQUIREMENTS REVIEW AND SIGNOFF  
**Date:** September 12, 2026  
**Repository:** `ginosega/fishing`  
**Baseline:** `fee8fb1657df06ac1d74d324d153998aa03988a7`  
**Implementation authorization:** **None.** This document does not authorize design, runtime, schema, build, or production changes.

## 1. Change request

Extend Fishing Companion so that Knowledge Base entries of Type **Knot** may optionally have a step-by-step picture sequence in addition to the existing single representative-picture behavior.

The feature is intended for knots for which a series of instructional photographs shows successive stages of tying the knot. A sequenced Knot must:

- display its final sequence frame as the ordinary representative picture on cards and the Knot detail page;
- open the picture viewer at the first instructional frame;
- allow the user to move manually backward and forward through the sequence;
- allow automatic 1-second-per-frame playback;
- loop automatic playback continuously until paused or closed;
- preserve the existing picture caption concept; and
- remain compatible with Fishing Companion's existing source validation, release generation, explicit offline-library workflow, and Add/Edit change-package workflow.

Knot entries without a sequence must continue to behave as they do today.

## 2. Problem statement

Fishing Companion currently supports one authoritative representative picture for a Gear or Knowledge Base entry. The existing picture viewer is appropriate for static pictures but cannot represent a multi-step instructional process.

Many Knot entries have or may receive approximately 10–15 photographs showing successive stages of tying the knot. Animated image formats were considered for this material, but a user-controlled stepper is preferred because it allows:

1. pausing indefinitely on a specific instructional step;
2. moving backward or forward one frame at a time;
3. automatically viewing the sequence when desired; and
4. retaining the clarity and resolution of the original still images.

The feature should extend the existing picture model and authoring UX rather than create a separate, unrelated media subsystem.

## 3. Relationship to the approved Fishing Companion baseline

FISH096 extends the existing Knowledge Base picture capability but does not change the broader Fishing Companion domain architecture.

The following existing principles remain in force:

- Gear, Knowledge Base, and Catch remain distinct domain contracts.
- The repository remains the durable source of truth.
- Knowledge Base narrative content remains Markdown.
- Static representative pictures remain supported exactly as before.
- Existing supported local image formats and image safety limits remain authoritative unless separately changed.
- Preparing an Add/Edit change package is not the same as saving to the repository.
- Integrated repository authentication, Direct Save, browser-side upload, offline authoring, synchronization, and other deferred P2 capabilities remain out of scope.
- FISH091's online-only default and explicit **Update offline library** behavior remain unchanged.

FISH096 adds an optional Knot-specific sequence capability; it does not convert the Knowledge Base into a generic gallery or multi-image system.

## 4. Goals and objectives

FISH096 must achieve all of the following:

1. **Clear instructional viewing.** Users can study knot-tying photographs one frame at a time.
2. **Convenient automatic playback.** Users can play the sequence automatically at one frame per second.
3. **Simple representative-image behavior.** The completed/final knot remains the picture shown before the viewer is opened.
4. **Minimal authoring UX change.** Sequence authoring remains inside the existing Picture section and Picture action workflow.
5. **Backward compatibility.** Existing Knot entries and all non-Knot Gear/KB entries remain valid and retain current static-picture behavior.
6. **Deterministic source data.** Sequence membership and ordering are explicit and validated rather than inferred at runtime from arbitrary directory contents.
7. **Release integrity.** Every sequence image participates in normal source validation, production release generation, and explicit offline-library preparation.
8. **Narrow scope.** Do not introduce general-purpose galleries, per-frame descriptions, remote media, browser-side repository uploads, or unrelated authoring capabilities.

## 5. Definitions

For FISH096:

- **Static picture** means the existing single representative picture associated with a Gear or KB record.
- **Step-by-step sequence** means an ordered collection of two or more local still images associated with one KB Knot entry.
- **Frame** means one image in a step-by-step sequence.
- **First frame** means the first instructional image in the sequence.
- **Final frame** means the last image in the sequence.
- **Representative picture** means the image displayed on the Knot's ordinary card/detail presentation before the picture viewer is opened.
- **Sequence viewer** means the picture viewer when opened for a Knot that has a step-by-step sequence.
- **Static viewer** means the existing single-picture viewer used by entries without a sequence.
- **Sequence caption** means the existing entry-level picture caption associated with the representative picture and displayed while viewing the sequence. FISH096 does not introduce per-frame captions.

## 6. Source organization requirements

### FISH096-R01 — Sequences are Knot-only

A step-by-step sequence may be associated only with a Knowledge Base entry whose Type is **Knot**.

Gear records and other KB Types must continue to use the existing static-picture behavior.

### FISH096-R02 — Dedicated per-Knot asset folder

Sequence frames must be stored under a dedicated subfolder beneath the existing Knot assets folder using the Knot's stable ID.

Required pattern:

`KB/Knots/assets/<knot-id>/`

Example:

`KB/Knots/assets/knot-trilene/`

### FISH096-R03 — Frame filename convention

Sequence frames must use contiguous, zero-padded step numbers beginning with `01`.

Example:

`step-01.jpg`  
`step-02.jpg`  
`step-03.jpg`

The supported image extension may be any image format already permitted by Fishing Companion's image policy.

### FISH096-R04 — Contiguous sequence

A valid sequence must contain at least two frames.

Step numbers must be contiguous. Missing steps, duplicate step numbers, or ambiguous ordering must fail validation rather than being guessed.

### FISH096-R05 — Explicit authoritative ordering

The authoritative KB data must explicitly identify every frame in sequence order.

Runtime behavior must not depend on scanning an assets directory and guessing sequence membership from whatever files happen to exist there.

The exact data/schema representation is a design decision, but the ordered frame membership must be explicit and deterministic.

### FISH096-R06 — Filename order and authoritative order agree

The explicit sequence order and the `step-##` filenames must agree.

For example, `step-03` must not be represented as frame 7.

### FISH096-R07 — Final frame is the representative picture

For a Knot with a sequence, the final sequence frame must also be its ordinary representative picture.

The authoritative data must not permit the sequence's final frame and the Knot's representative picture to disagree.

### FISH096-R08 — Existing image validation applies to every frame

Every frame must satisfy the same applicable safe-path, supported-format, format/content consistency, file-size, dimensions, decode-safety, path-collision, and source-existence protections that apply to ordinary Fishing Companion pictures.

## 7. Knot page and viewer requirements

### FISH096-R09 — Ordinary Knot presentation shows final frame

When a Knot has a valid sequence, its final frame must be displayed anywhere Fishing Companion ordinarily uses that Knot's representative picture, including its detail page and applicable cards/thumbnails.

No automatic animation occurs on the ordinary Knot page.

### FISH096-R10 — Viewer opens at frame 1

When the user activates the representative picture of a sequenced Knot, the sequence viewer must open displaying the first frame, not the final representative frame.

### FISH096-R11 — Sequence controls

The sequence viewer must provide these primary controls below the image:

- **Previous**
- **Play**, changing to **Pause** during automatic playback
- **Next**
- **Close**

The controls should use the same visual language and button treatment as the current static picture viewer controls.

### FISH096-R12 — Manual Previous behavior

**Previous** moves backward exactly one frame.

When the first frame is displayed, Previous must be unavailable/disabled rather than wrapping to the final frame.

### FISH096-R13 — Manual Next behavior

**Next** moves forward exactly one frame.

When the final frame is displayed, Next must be unavailable/disabled rather than wrapping to the first frame.

### FISH096-R14 — Manual navigation pauses playback

If automatic playback is active, selecting Previous or Next must stop/pause playback and then display the requested adjacent frame.

### FISH096-R15 — Playback timing

Automatic playback must advance at a fixed interval of approximately **1 second per frame**.

FISH096 does not require a user-adjustable playback-speed control.

### FISH096-R16 — Playback loops

Automatic playback must loop continuously.

After displaying the final frame for the normal playback interval, playback continues with the first frame.

### FISH096-R17 — Play/Pause resumes from current position

Selecting Play begins or resumes automatic playback from the currently displayed frame.

Selecting Pause stops automatic advancement while leaving the current frame displayed.

### FISH096-R18 — Frame-position indicator

The sequence viewer must display the user's current position in the sequence in a concise form such as:

`4 of 12`

The precise placement and styling are design decisions.

### FISH096-R19 — Caption remains visible

If the Knot has a picture caption, the same caption must be displayed in the sequence viewer using the same general caption treatment as the current static viewer.

The caption is entry-level and remains the same across all sequence frames.

FISH096 does not introduce per-frame captions.

### FISH096-R20 — Existing zoom/pan capability is preserved

The sequence viewer must retain the useful image-inspection capabilities of the current viewer, including applicable pointer/touch pan, pinch zoom, and supported desktop zoom gestures.

The sequence viewer is not required to display the static viewer's visible `−`, `+`, and `Reset` buttons.

### FISH096-R21 — Keyboard interaction

Where the platform provides a physical keyboard:

- Left Arrow moves to the previous frame.
- Right Arrow moves to the next frame.
- Space toggles Play/Pause.
- Escape closes the viewer using normal dialog behavior.

Keyboard behavior must not cause manual Previous/Next navigation to wrap.

### FISH096-R22 — Viewer cleanup

Closing the viewer must stop any active playback timer and must not allow playback activity to continue after the dialog has closed.

Existing focus-restoration and modal-dialog accessibility behavior must be preserved.

### FISH096-R23 — Static viewer remains unchanged

Entries without a sequence must continue to use the existing static picture viewer and its existing static-image controls and behavior.

FISH096 must not require a sequence viewer for ordinary single pictures.

## 8. Add Entry authoring requirements

### FISH096-R24 — Existing Picture section remains the authoring surface

Sequence authoring must be integrated into the existing **Picture** section of Add Entry.

A separate Step-by-step Sequence form section is not desired.

### FISH096-R25 — Knot Add Entry action

When adding a KB entry whose Type is Knot, the **Picture action** control must offer an **Add step-by-step sequence** option in addition to applicable existing picture actions.

This sequence-specific action must not appear for non-Knot KB Types or Gear.

### FISH096-R26 — Multi-file selection

When **Add step-by-step sequence** is selected:

- the existing single-file input changes to accept multiple local pictures;
- the field label changes from **Choose a local picture** to **Choose local pictures**;
- the native browser/platform multi-file picker may supply its own plural button/status wording;
- no custom-styled file picker is required merely to force exact text such as “Choose Files” or “No files chosen.”

### FISH096-R27 — Repository picture path remains

The existing **Repository picture path** field remains part of the Picture section.

For a sequence, it represents the final/representative frame path.

Once a valid complete sequence has been selected, Fishing Companion must derive/populate this path from the final frame rather than require the user to independently identify the representative image.

### FISH096-R28 — Caption remains

The existing **Caption (optional)** field remains available in sequence mode.

The caption applies to the overall picture/sequence and is the caption displayed in the sequence viewer.

### FISH096-R29 — Complete sequence supplied together

Creating a sequence through Add Entry requires selecting the complete intended sequence.

The user must not be required to add frames individually through repeated authoring operations.

### FISH096-R30 — Sequence selection feedback

After local files are selected, the editor must provide enough feedback for the user to verify that the intended sequence was recognized before preparing changes.

At minimum, the UI must communicate:

- number of pictures selected;
- first frame;
- final/representative frame; and
- any filename/order validation error.

The exact use of thumbnails versus text is a design decision.

### FISH096-R31 — Preview uses sequence behavior

The Add Entry page must provide a way to preview the selected sequence using the actual sequence-viewer behavior before preparing the change package.

The preview must allow verification of sequence order, representative/final frame relationship, manual navigation, playback, looping, caption, and frame count.

## 9. Edit Entry authoring requirements

### FISH096-R32 — Picture actions are context-sensitive

On Edit Entry, the Picture action choices must reflect whether the current Knot has:

1. no picture;
2. one static picture; or
3. a step-by-step sequence.

The UI must not require the user to understand or manually edit underlying sequence metadata.

### FISH096-R33 — Static picture to sequence

For a Knot that currently has one static picture, Edit Entry must offer:

**Replace with step-by-step sequence**

Selecting this action must:

- switch the local picture input into multi-file mode;
- require the complete intended sequence to be selected;
- validate the entire selected sequence;
- replace the record's sequence state with the selected sequence; and
- make the selected final frame the representative picture.

### FISH096-R34 — Existing static picture is not implicitly reused

When converting a static picture to a sequence, Fishing Companion must **not** offer or perform an automatic “use current picture as final frame” conversion.

The user must supply the complete intended sequence, including its final representative frame.

### FISH096-R35 — Existing source file is not automatically deleted

When a static picture is replaced by a sequence, the previous static source image must not be automatically deleted from GitHub/source storage merely because its record reference is replaced.

Source-file cleanup, if desired, remains a deliberate repository action.

### FISH096-R36 — Sequence replacement

For a Knot that already has a sequence, Edit Entry must offer:

**Replace step-by-step sequence**

Replacing a sequence requires selecting the complete new intended sequence rather than editing individual frames in place.

### FISH096-R37 — Sequence to new static picture

For a Knot that currently has a sequence, Edit Entry must offer:

**Replace with single picture**

Selecting this action must:

- switch the local picture input back to single-file mode;
- accept and validate one replacement picture;
- remove the sequence association from the record; and
- use the selected picture as the Knot's ordinary representative picture.

### FISH096-R38 — Remove sequence but retain representative picture

For a Knot that currently has a sequence, Edit Entry must also offer:

**Remove sequence, keep representative picture**

This action must:

- require no new picture file;
- remove the sequence association;
- retain the current final frame as the Knot's static representative picture; and
- retain the current caption unless the user edits it.

### FISH096-R39 — Sequence files are not automatically deleted

Removing or replacing a sequence must not automatically delete the prior sequence frame files from source storage.

The change-package/repository workflow may identify now-unreferenced files for later deliberate cleanup, but source deletion must not occur implicitly.

### FISH096-R40 — Standard picture removal remains possible

The user must retain an explicit way to remove the Knot's picture entirely.

For a sequenced Knot, removing the picture entirely must also remove its sequence association because a valid sequence requires a representative final frame.

### FISH096-R41 — Changing away from Knot

A KB record with a sequence must not be silently changed from Type Knot to another KB Type while retaining invalid sequence metadata.

If the user changes Type away from Knot, the authoring workflow must require an explicit resolution of the existing sequence before Prepare Changes can succeed.

The exact UI treatment is a design decision.

## 10. Change-package requirements

### FISH096-R42 — Prepared package represents sequence intent explicitly

A prepared `fishing-companion-change-v2` package involving a sequence must contain enough explicit information for repository promotion to distinguish:

- keep existing sequence;
- add/replace sequence;
- replace sequence with one static picture;
- remove sequence while retaining the representative picture; and
- remove picture/sequence entirely.

The promotion workflow must not infer the user's intended operation merely by comparing filenames.

### FISH096-R43 — Prepared package includes complete intended sequence state

When a sequence is added or replaced, the package must represent the complete intended ordered sequence, not only a partial delta of individual frames.

### FISH096-R44 — Existing source-aware safety remains

Sequence authoring must retain the existing source-aware protections of the Fishing Companion change-package workflow, including applicable source revision/base-record validation and avoidance of silently overwriting unrelated newer repository changes.

### FISH096-R45 — Preparing is not saving

Adding, replacing, or removing a sequence through Add/Edit only prepares a change package.

FISH096 does not authorize browser-side repository writes or integrated file upload.

### FISH096-R45A — Sequence upload link targets the per-Knot asset folder

After the user selects **Prepare Changes** for an Add Entry or Edit Entry operation that adds or replaces a step-by-step sequence, the prepared-package area near the Copy Changes controls must include the clickable repository upload-location link used by the existing picture workflow.

For a sequence, that link must target the sequence's dedicated per-Knot upload location:

`KB/Knots/assets/<knot-id>/`

For example, a sequence for `knot-trilene` must direct the user to:

`KB/Knots/assets/knot-trilene/`

The link must not target only the parent `KB/Knots/assets/` folder, the Knot content folder, or an individual frame path. The later design must make this direct per-Knot upload destination work both when the subfolder already exists and when it is being created for the first sequence upload.

## 11. Build, release, and offline requirements

### FISH096-R46 — Every referenced frame is production content

Every frame explicitly referenced by a valid sequence must be included in source inventory and production release generation in the same manner as other authoritative local pictures.

### FISH096-R47 — Missing frames fail closed

A production build must fail if authoritative sequence data references a missing, invalid, unsafe, corrupt, unsupported, or otherwise unacceptable frame.

Production must not silently omit the bad frame and publish a shortened sequence.

### FISH096-R48 — Sequence frames participate in release integrity

Each sequence frame must participate in the applicable release manifest/hash/integrity process.

### FISH096-R49 — FISH091 behavior is preserved

Normal online browsing must not download the entire Fishing Companion library merely because Knot sequences exist.

A sequenced Knot's images should be obtained as needed during ordinary online use, subject to normal browser caching and the approved implementation design.

### FISH096-R50 — Explicit offline library includes sequences

When the user intentionally selects **Connection Status → Update offline library**, every referenced sequence frame in the current release must be included in the complete verified offline library.

After successful offline preparation, sequenced Knots must be fully usable offline.

### FISH096-R51 — Failed offline update retains existing guarantees

The addition of sequence assets must not weaken FISH091's atomic offline-library update, verification, or last-known-good fallback behavior.

## 12. Performance and loading requirements

### FISH096-N01 — No unnecessary sequence load on ordinary page view

Displaying a Knot's ordinary page or card must not require loading every frame merely to show the final representative picture.

### FISH096-N02 — Viewer playback should be smooth

Once the sequence viewer is opened, implementation should load/preload frames as necessary to make 1-second playback and manual stepping reasonably smooth on supported clients.

The requirements do not prescribe the exact preloading algorithm.

### FISH096-N03 — Avoid duplicate source storage by design

The final frame should function as both the sequence's last frame and the representative picture; FISH096 must not require a duplicate copy of identical image bytes solely to satisfy those two roles.

### FISH096-N04 — Existing supported clients remain in scope

The feature must remain compatible with the currently supported Fishing Companion browser/device scope, including applicable Windows Chromium, iPhone/WebKit, and Android Chromium targets used by the production test strategy.

## 13. Accessibility and interaction requirements

### FISH096-A11Y01 — Controls have accessible names

Previous, Play/Pause, Next, and Close must expose clear accessible names.

### FISH096-A11Y02 — Disabled boundary controls are truthful

Previous on the first frame and Next on the final frame must communicate their disabled/unavailable state appropriately.

### FISH096-A11Y03 — Current frame is understandable

The current-position indicator must be available to assistive technology in a reasonable manner without causing disruptive repeated announcements during automatic playback.

The exact ARIA treatment is a design decision.

### FISH096-A11Y04 — Existing dialog accessibility is preserved

The sequence viewer must preserve appropriate modal semantics, keyboard focus behavior, Close/Escape behavior, and focus restoration from the current viewer.

### FISH096-A11Y05 — Reduced-motion consideration

The design must consider the browser/OS `prefers-reduced-motion` setting.

FISH096 does not require autoplay when the viewer opens; playback always begins only after explicit user activation of Play.

The later design should determine whether reduced-motion requires any additional behavior beyond preserving this explicit-start rule.

## 14. Acceptance scenarios

The eventual implementation must demonstrate at least the following behaviors.

| ID | Scenario | Required result |
|---|---|---|
| A01 | Existing non-Knot KB entry with static picture | Existing static page/viewer behavior remains unchanged. |
| A02 | Existing Knot with static picture and no sequence | Existing static page/viewer behavior remains unchanged until explicitly converted. |
| A03 | Sequenced Knot shown on category/detail page | Final sequence frame appears as representative picture. |
| A04 | User opens sequenced Knot picture | Viewer opens on frame 1 and shows correct caption and frame count. |
| A05 | User selects Next repeatedly | Advances one frame at a time; stops with Next disabled at final frame; no manual wrap. |
| A06 | User selects Previous repeatedly | Moves backward one frame at a time; stops with Previous disabled at first frame; no manual wrap. |
| A07 | User selects Play | Frames advance approximately once per second. |
| A08 | Automatic playback reaches final frame | Playback loops to frame 1 and continues. |
| A09 | User selects Pause | Automatic advancement stops on current frame. |
| A10 | User selects Previous/Next during playback | Playback pauses and requested adjacent frame is shown. |
| A11 | User closes viewer during playback | Dialog closes and playback activity/timers stop. |
| A12 | Keyboard navigation | Left/Right navigate, Space toggles Play/Pause, Escape closes. |
| A13 | Add Knot → Add step-by-step sequence | Multi-file mode appears; valid complete sequence can be selected and previewed. |
| A14 | Sequence files contain missing/duplicate/noncontiguous numbering | Prepare Changes fails with a clear validation error. |
| A15 | Valid Add sequence selected | Repository picture path resolves to final frame automatically; caption remains editable. |
| A16 | Static Knot → Replace with step-by-step sequence | Complete selected sequence replaces static reference; final selected frame becomes representative picture. |
| A17 | Static Knot conversion does not reselect/include old picture | Old static picture is not automatically inserted into the sequence. |
| A18 | Existing sequence → Replace step-by-step sequence | Complete new sequence replaces old sequence state. |
| A19 | Existing sequence → Replace with single picture | Sequence association is removed and new static picture becomes representative. |
| A20 | Existing sequence → Remove sequence, keep representative picture | No new file is required; final frame remains as normal static picture and caption remains. |
| A21 | Existing sequence → Remove picture entirely | Both representative picture and sequence association are removed. |
| A22 | Sequenced Knot changed to non-Knot Type without resolving sequence | Prepare Changes is blocked with a clear corrective instruction. |
| A23 | Build sees one missing referenced sequence frame | Build fails rather than publishing an incomplete sequence. |
| A24 | Ordinary online visit to sequenced Knot | Representative picture loads without an automatic complete-library download. |
| A25 | Explicit Update offline library | Every sequence frame is downloaded/verified as part of complete offline preparation. |
| A26 | Prepared library, device offline | Knot sequence viewer, manual navigation, caption, and playback work offline. |
| A27 | Chromium and WebKit automated suites | Sequence behavior passes alongside existing static viewer, authoring, release-integrity, and offline regressions. |
| A28 | Hosted production verification | Deployed Knot sequence behavior is verified against the exact production source/release. |
| A29 | Add or Edit sequence → Prepare Changes | The clickable repository upload link near the prepared-package/Copy Changes controls opens the direct `KB/Knots/assets/<knot-id>/` upload location, including for a first-time sequence folder. |

## 15. Out of scope

FISH096 does **not** include:

- step-by-step sequences for Gear;
- sequences for KB Types other than Knot;
- generic photo galleries;
- multiple unrelated pictures for one entry;
- per-frame captions, annotations, titles, or narrative text;
- user-adjustable playback speed;
- automatic playback when the viewer opens;
- audio or video;
- animated WebP/GIF generation from sequence frames;
- drag-and-drop frame reordering;
- arbitrary frame insertion/removal as a dedicated browser editing operation;
- automatic reuse of an existing static representative picture when converting to a sequence;
- automatic deletion of superseded/unreferenced source image files;
- integrated GitHub/repository image upload from the PWA;
- Direct Save, authentication, offline authoring, synchronization, outbox, or Catch authoring;
- redesign of unrelated KB/Gear picture behavior.

## 16. Design constraints, not design decisions

The later design must respect these constraints but may choose the implementation details:

1. A static picture and a step-by-step sequence must remain distinguishable authoritative states.
2. Sequence membership/order must be explicit in authoritative KB data.
3. The final sequence frame and representative picture cannot drift apart.
4. Existing records must remain backward-compatible without migration merely because they have a static picture or no picture.
5. Sequence images must flow through existing source validation, release integrity, and explicit offline preparation.
6. Add/Edit must extend the existing Picture action workflow rather than add a separate sequence editor section.
7. Converting **into** a sequence requires supplying the complete intended sequence.
8. Converting **out of** a sequence may either supply a new static picture or retain the existing final representative frame.
9. Runtime directory scanning must not become the source of truth for sequence membership or ordering.
10. The implementation must avoid unnecessary architecture outside the scope required for FISH096.

## 17. Proposed clarifications requiring requirements signoff

The following interpretations are proposed for explicit approval before design begins.

### S1 — Sequence filename convention

**Proposed requirement interpretation:** sequence source files live in:

`KB/Knots/assets/<knot-id>/`

and use contiguous zero-padded filenames beginning with:

`step-01`, `step-02`, etc.

The supported file extension may vary among formats already accepted by Fishing Companion, but sequence step numbering remains unique and contiguous.

### S2 — Representative image relationship

**Proposed requirement interpretation:** for a sequenced Knot, the final sequence frame is always the ordinary representative picture. The user does not separately choose another canonical picture while the sequence exists.

### S3 — Static-to-sequence conversion

**Proposed requirement interpretation:** **Replace with step-by-step sequence** requires selecting the entire new sequence, including its final frame. The existing static picture is never automatically incorporated as the final frame.

### S4 — Sequence-to-static conversion

**Proposed requirement interpretation:** a sequenced Knot supports both:

1. **Replace with single picture**, which selects a new static image; and
2. **Remove sequence, keep representative picture**, which removes the sequence association while retaining the existing final frame as the static picture.

### S5 — Sequence editing granularity

**Proposed requirement interpretation:** adding or replacing a sequence uses the complete intended ordered sequence. FISH096 does not add browser UI for inserting, deleting, or rearranging individual frames within an existing sequence.

### S6 — Viewer controls

**Proposed requirement interpretation:** the sequence viewer's visible primary button row is:

**Previous | Play/Pause | Next | Close**

Manual Previous/Next does not wrap. Automatic Play loops. Existing zoom/pan gestures remain available even though the static viewer's visible `− / + / Reset` buttons are not part of the sequence control row.

### S7 — Playback timing

**Proposed requirement interpretation:** automatic playback advances at approximately **1 second per frame**, loops indefinitely until paused/closed/manual navigation occurs, and does not provide a speed setting.

### S8 — Caption behavior

**Proposed requirement interpretation:** the existing optional Picture caption is retained as one sequence-level caption and displayed beneath every frame in the sequence viewer. There are no per-frame captions.

### S9 — Native multi-file picker

**Proposed requirement interpretation:** sequence mode changes the field label to **Choose local pictures** and enables native multi-file selection. Platform/browser-native picker text is accepted; FISH096 does not require a custom control solely to guarantee exact plural wording.

### S10 — Source deletion policy

**Proposed requirement interpretation:** replacing/removing a static picture or sequence changes authoritative references but does not implicitly delete now-unreferenced source image files. Cleanup remains a deliberate repository operation.

### S11 — Prepared-package upload link

**Proposed requirement interpretation:** whenever Add Entry or Edit Entry prepares a change package that adds or replaces a sequence, the clickable repository upload-location link shown with the prepared package must take the user directly to the sequence's `KB/Knots/assets/<knot-id>/` upload location. The design must support this direct destination whether that per-Knot folder already exists or is being created for the first sequence upload.

## 18. Requirements signoff gate

The FISH096 requirements phase is complete only after the user explicitly:

1. approves or revises the requirements in this document;
2. resolves S1–S11 above; and
3. authorizes preparation of the separate FISH096 design document.

**Requirements approval alone does not authorize implementation.**

After requirements signoff, the next phase is:

**Design document → design review and explicit signoff → implementation/build/test → production deployment → hosted verification → project-state reconciliation.**

No runtime, schema, build, authoring, or production change may begin until the design is separately approved.