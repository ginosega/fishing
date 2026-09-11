# Knowledge Base source layout

Each Fishing Companion Knowledge Base category uses the same repository structure:

- `content/` contains the authoritative Markdown article for each entry. Local images or other local media referenced from that Markdown may also be stored in the same `content/` tree and linked with relative Markdown paths.
- `assets/` is the canonical upload location for representative pictures owned by that KB category. When an entry has its own representative image, the normal convention is for `picture.src` in `KB/kb.json` to point there; the application uses that picture for the entry card and at the top of the detail page.

The five canonical category roots are:

- `KB/Locations/`
- `KB/Species/`
- `KB/Gear-Guides/`
- `KB/Techniques/`
- `KB/Knots/`

All five roots must retain both `content/` and `assets/`, even when a category currently has no representative pictures. Because Git does not store empty directories, a `.gitkeep` file may be used to keep an otherwise-empty `assets/` directory available as a GitHub upload destination.

Representative pictures remain optional. Some existing KB entries deliberately reuse a canonical local picture owned elsewhere in the repository (for example, a Gear Guide may reuse an owned-Gear image); those intentional cross-domain references remain valid. New KB-owned representative picture files should be uploaded to that category's `assets/` folder.

Adding a file to an `assets/` directory does not associate it with an entry until the corresponding `picture` field is added or changed in `KB/kb.json` through the normal Fishing Companion change-package workflow.
