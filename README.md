# web-apps

Browser tools for Minecraft Bedrock Edition development. Hosted at [minato-mba.github.io/web-apps](https://minato-mba.github.io/web-apps).

## [web-editor](https://minato-mba.github.io/web-apps/web-editor.html)

A simple web-based code editor for Minecraft Bedrock Edition scripting with autocomplete.

## [Chest UI Editor (Beta)](https://minato-mba.github.io/web-apps/chest-ui-editor-beta)

Visual editor for custom **small chest** JSON UIs (162×54). Drag components onto the canvas, preview in the browser, and export a Bedrock resource pack ZIP. Folder: [`chest-ui-editor-beta/`](chest-ui-editor-beta/).

**Workflow**

| Action | What it does |
|--------|----------------|
| **Save** / **Load** | Versioned project in browser storage (`formatVersion: 2`) |
| **Import ZIP** / **Export** | Resource pack + `chest_ui_data.json` for files and in-game use |
| **New** / **Reset** | Clear or start over |
| **Settings** | Per–Chest UI title, background, panel height/layer, close button |

**Features**

- Live editor + preview; templates (vanilla grid, cooking pot, crafting, …)
- Multiple Chest UIs in one project (`triggerTitle` / display name per UI)
- Custom image uploads (`textures/ui/custom/` in the exported pack)
- Export as ZIP or view generated JSON in the app
- Mobile-friendly layout (components / editor / preview / templates tabs)
- Versioned save format — older unversioned exports are not loaded (re-export with this build)

**Components** (12 types — see [beta README](chest-ui-editor-beta/README.md) for full detail)

| Component | Summary |
|-----------|---------|
| Container item | Standard slot; optional custom slot textures |
| Container item with picture | Slot + background image |
| Progress bar | 0–9 progress via item rename |
| On/off item | Toggle via item rename |
| Uninteractable slot (pot) | Custom-shaped slot background |
| Container type | Slot background 0–9 via item rename |
| Dynamic grid | Scrollable slot grid + scrollbar textures |
| Tab | Per-tab pages; children use `tab_parent_id` |
| Button | Container action on a target slot index |
| Image | Static texture |
| Label | Static text + color + font scale |
| Close button | Vanilla close control with custom textures |

**In-game**

- UI opens when the chest title matches the configured display name (formatting codes supported).
- Use Script API to drive slot contents; progress/on-off/container-type states often use renamed unobtainable items in slots (see [beta README](chest-ui-editor-beta/README.md)).

**Developer docs** (in repo)

- [`chest-ui-editor-beta/CHANGELOG.md`](chest-ui-editor-beta/CHANGELOG.md) — version history
- [`chest-ui-editor-beta/workspace-documentation.md`](chest-ui-editor-beta/workspace-documentation.md) — architecture and JSON UI patterns
- [`chest-ui-editor-beta/how_to_add_new_component.md`](chest-ui-editor-beta/how_to_add_new_component.md) — checklist for new components

## [Chest UI Editor (stable)](https://minato-mba.github.io/web-apps/chest-ui-editor)

Earlier release without beta features (tabs, dynamic grid, versioned project format, multi–Chest UI manager). Use **Chest UI Editor (Beta)** for new work unless you need the legacy build.

## [9slice](https://minato-mba.github.io/web-apps/9slice/)

A simple 9-slice viewer for inspecting nine-slice UI assets.

## [Player Heads](https://minato-mba.github.io/web-apps/player-heads)

A Minecraft player head addon generator — creates resource-pack style addons from head textures.

## [Textures to Glyph](https://minato-mba.github.io/web-apps/textures-to-glyph/)

A tool to add vanilla or custom textures into a glyph picture/atlas so they can be used as glyphs.
