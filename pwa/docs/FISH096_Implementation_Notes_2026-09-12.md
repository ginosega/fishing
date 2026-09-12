# FISH096 Implementation Notes — September 12, 2026

Implementation follows the approved FISH096 requirements and design.

## Implemented surfaces

- optional Knot-only `pictureSequence` authoritative data field;
- semantic path, folder, numbering, uniqueness, and representative-final invariants;
- release path collection for every sequence frame;
- dedicated sequence viewer with Previous / Play-Pause / Next / Close, one-second looping playback, frame indicator, caption, keyboard controls, zoom/pan, preload-after-open, and frame-load failure stop;
- Add/Edit Picture-action sequence workflow, complete multi-file validation, filename-defined ordering, auto representative path, local preview, static↔sequence conversions, and type-away resolution;
- `fishing-companion-change-v2` sequence package state with ordered paths, per-file metadata, and atomic picture/sequence conflict handling;
- exact post-Prepare direct GitHub upload destination `KB/Knots/assets/<knot-id>/` using the GitHub `/upload/main/...` route;
- dedicated core and Chromium/WebKit acceptance fixtures without adding permanent production sample sequence data.

## Scope

No FISH077/P2 capability is introduced. There is no Direct Save, integrated repository upload, outbox, sync, Catch authoring, generic gallery, per-frame captions, drag/drop ordering, speed selector, or autoplay-on-open.

This file records implementation scope only; CI, production deployment, hosted verification, and project-state closeout are recorded separately when complete.
