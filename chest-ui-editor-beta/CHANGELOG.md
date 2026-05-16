# Changelog

---

## [2.0.0] - 2026-05-16

Project and ZIP data now use **`formatVersion: 2`** (`formatLabel: "2.0.0"`). Older browser saves and ZIPs without `formatVersion: 2` (including `version: "1.1.0"`) are rejected on load/import.

### Added

- **Tab** component - A tab button that allow switching between layouts using toggles.
- **Dynamic Grid** - scrollable slot grid with configurable slot size, content height, and scrollbar textures (vanilla or uploaded)
- **Button** component - container actions on `target_collection_index`; optional embedded label/image; borderless button textures
- **Close Button** component - `common.close_button` with custom default/hover/pressed textures
- **Multi–Chest UI** - `chestUiManager` for multiple UIs per project (separate trigger title, display name, settings, and components)
- **Import ZIP** - restore project from exported pack; validates v2 data; persists browser save after import
- **Per-slot textures** on container item, container item with picture, container type, and dynamic grid (`slot_background_texture`, `slot_selected_texture`, `slot_highlight_texture`)
- **Background Texture** - Chest UI background texture is now customizable.
- **Chest UI Size** - Chest UI size is now customizable.
- **Chest UI Title** - Chest UI title is now customizable and taggable (use the label component for more control).
- **Double Chest Template** - New template that looks like the vanilla double chest.

### Changed

- **Small Chest Template** - Small chest template now uses dynamic grid.
- **Project format** (`scripts/project-format.js`) - shared `build`, `validate`, `apply`, `persistLocal`, `saveToBrowser` for browser save and ZIP `chest_ui_data.json`
- **Close Button** - Default vanilla close button can now be turned off.
- **Mobile** layout - components / editor / preview / templates tabs; touch placement; properties drawer; preview refresh on tab switch.
- **Layering** - Fixed a bug that was caused by a hardcoded layer property in some components.
- **Layout** - Layer tab now place newly placed components on top.
- **Chest UI Flag** - You can now edit what trigger a UI to show.
- **Files** - The generated UI file are now organized into multiple files instead of only using one file.

---

## [1.0.0] - 2025-03-14

- Initial release.