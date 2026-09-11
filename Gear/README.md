# Gear source layout

Each Fishing Companion Gear category uses the same repository structure:

- `assets/` is the canonical location for representative/item pictures owned by that Gear category. When a Gear record has a picture, its `picture.src` in `Gear/gear.json` normally points to a file here.
- `content/` is the canonical location for optional Markdown notes/content owned by Gear items in that category. Local images or other local media referenced from that Markdown may also be stored in the same `content/` tree and linked with relative Markdown paths.

The eight canonical Gear category roots are:

- `Gear/Bait/`
- `Gear/Equipment/`
- `Gear/Hooks/`
- `Gear/Line/`
- `Gear/Lures/`
- `Gear/Rods-Reels/`
- `Gear/Snaps-Swivels/`
- `Gear/Weights/`

All eight roots must retain both `assets/` and `content/`, even when a category currently has no pictures or no Markdown notes. Because Git does not store empty directories, a `.gitkeep` file may be used to keep an otherwise-empty directory available as a GitHub upload destination.

Pictures and Markdown notes remain optional at the item level. Adding a file to one of these directories does not associate it with an item until the corresponding `picture` or `content` field is added or changed in `Gear/gear.json` through the normal Fishing Companion change-package workflow.
