# How to Add a New Component to the Chest UI Editor

This guide describes the current component integration points in the editor. Use it as a checklist when adding a new draggable component.

## Existing components

| Type key | Palette name | Uses `collection_index` |
|----------|--------------|-------------------------|
| `container_item` | Container Item | Yes (auto) |
| `container_item_with_picture` | Container Item with Picture | Yes (auto) |
| `progress_bar` | Progress Bar | Yes (auto) |
| `on_off_item` | On/Off Item | Yes (auto) |
| `pot` | Uninteractable Slot | Yes (auto) |
| `container_type` | Container Type | Yes (auto) |
| `dynamic_grid` | Dynamic Grid | No (grid export) |
| `tab` | Tab | No |
| `button` | Button | No (`target_collection_index`) |
| `image` | Image | No |
| `label` | Label | No |
| `close_button` | Close Button | No |

User-facing descriptions: [`README.md`](README.md). Architecture detail: [`workspace-documentation.md`](workspace-documentation.md).

## 1. Component Definition

File: `scripts/components.js`

Add a key to the `componentTypes` object:

```javascript
your_component: {
    name: 'Your Component Name',
    defaultWidth: 32,
    defaultHeight: 32,
    defaultProps: {
        property1: 'default_value'
    },
    template: '#your-component-properties',
    render: (component) => {
        return `<div class="editor-component your-component"
                    data-id="${component.id}"
                    data-type="your_component"
                    data-property1="${component.properties.property1}"
                    style="left:${component.x}px;top:${component.y}px;width:${component.width}px;height:${component.height}px;">
                </div>`;
    },
    renderPreview: (component) => {
        return `<div class="preview-component your-component"
                    data-property1="${component.properties.property1}"
                    style="left:${component.x}px;top:${component.y}px;width:${component.width}px;height:${component.height}px;">
                </div>`;
    },
    generateJSON: (component) => {
        return {
            type: "your_component",
            property1: component.properties.property1,
            x: component.x,
            y: component.y,
            width: component.width,
            height: component.height
        };
    }
}
```

Notes:
- Use inline styles for dynamic layout values such as `left`, `top`, `width`, and `height`.
- Use CSS classes for static visuals.
- Add `data-id` and `data-type` in editor rendering so selection, dragging, and updates work.
- Keep `render` and `renderPreview` visually aligned unless the preview intentionally differs.
- Put every saved component option in `defaultProps`. `chestUiManager.cloneComponents()` reapplies these defaults when projects load or when switching between Chest UIs, so new properties are backfilled into older saves.
- Avoid `value || defaultValue` for properties where `0`, `false`, or `""` are valid. Use `value ?? defaultValue` or an explicit ownership check instead.

## 2. Collection Index Behavior

File: `scripts/components.js`

If the component owns a `collection_index` and should auto-pick the next available slot index, add its type to the `needsIndex` array in `createComponent()`:

```javascript
const needsIndex = [
    'container_item',
    'container_item_with_picture',
    'progress_bar',
    'on_off_item',
    'pot',
    'container_type',
    'your_component'
].includes(type);
```

Do not add components that only target an existing slot. For example, the `button` component uses `target_collection_index`, so it does not consume its own slot index.

## 3. HTML Properties Template

File: `index.html`

Add a template with inputs using `data-property`. The properties panel automatically binds most text, number, checkbox, range, and select inputs.

```html
<template id="your-component-properties">
    <div class="property-group">
        <h4>Position</h4>
        <div class="property">
            <label>X:</label>
            <input type="number" data-property="x" class="position-input">
        </div>
        <div class="property">
            <label>Y:</label>
            <input type="number" data-property="y" class="position-input">
        </div>
    </div>
    <div class="property-group">
        <h4>Size</h4>
        <div class="property">
            <label>Width:</label>
            <input type="number" data-property="width" value="32" class="size-input">
        </div>
        <div class="property">
            <label>Height:</label>
            <input type="number" data-property="height" value="32" class="size-input">
        </div>
    </div>
    <div class="property-group">
        <h4>Properties</h4>
        <div class="property">
            <label>Property 1:</label>
            <input type="text" data-property="property1" value="default_value">
        </div>
    </div>
</template>
```

For a dropdown, use:

```html
<select data-property="property1">
    <option value="value_a">Value A</option>
    <option value="value_b">Value B</option>
</select>
```

## 4. Component Palette

File: `index.html`

Add the component to the palette using the current markup pattern:

```html
<div class="component-item" data-type="your_component" draggable="true">
    <div class="component-icon your-component"></div>
    <span>Your Component</span>
</div>
```

The `data-type` value must match the `componentTypes` key.

## 5. CSS Styling

File: `styles/components.css`

Add a palette icon and editor/preview styles:

```css
.component-icon.your-component {
    background-image: url('../assets/images/your_component_icon.png');
}

.editor-component.your-component,
.preview-component.your-component {
    background-color: rgba(100, 100, 100, 0.15);
}

.editor-component.your-component.selected {
    outline: 2px solid var(--mc-selection);
}

.editor-component.your-component.selecting {
    outline: 2px dashed var(--mc-selection);
}
```

Avoid fixed `width` and `height` in CSS when the component supports resizing. Let inline styles from `render()` and `renderPreview()` control dimensions.

## 6. Properties Panel Logic

File: `scripts/properties.js`

Most `data-property` inputs are handled automatically. Add a branch in `setupEventListeners()` only when the component needs special behavior such as texture uploads, derived dropdown options, custom previews, or grouped controls.

Texture upload example:

```javascript
} else if (component.type === 'your_component') {
    this.setupTextureUpload(fragment, component, 'texture');
}
```

Dropdown of existing collection indexes example:

```javascript
} else if (component.type === 'your_component') {
    const targetSelect = fragment.querySelector('[data-property="target_collection_index"]');
    const targetIndexInput = fragment.querySelector('.target-slot-index-input');
    if (targetSelect && targetIndexInput) {
        const indexes = [...new Set(editor.getComponents()
            .filter(current => current.id !== component.id && current.properties && 'collection_index' in current.properties)
            .map(current => Number(current.properties.collection_index))
            .filter(index => Number.isFinite(index) && index >= 0))]
            .sort((a, b) => a - b);

        const currentTarget = Number(component.properties.target_collection_index) || 0;
        targetSelect.innerHTML = indexes.length
            ? indexes.map(index => `<option value="${index}">Slot ${index}</option>`).join('')
            : '<option value="">No slots</option>';
        targetSelect.value = indexes.includes(currentTarget) ? String(currentTarget) : '';
        targetIndexInput.value = String(currentTarget);

        targetSelect.addEventListener('change', e => {
            if (e.target.value === '') return;

            component.properties.target_collection_index = Number(e.target.value);
            targetIndexInput.value = e.target.value;
            editor.updateComponent(component);
        });

        targetIndexInput.addEventListener('input', e => {
            const value = Math.max(0, parseInt(e.target.value, 10) || 0);
            component.properties.target_collection_index = value;
            targetSelect.value = indexes.includes(value) ? String(value) : '';
            editor.updateComponent(component);
        });
    }
}
```

Generic numeric fields are saved as input values by the shared properties binding. If the exported JSON needs a number, convert with `Number(...)` or `parseFloat(...)` during render/export.

## 7. Preview and JSON Generation

File: `scripts/preview.js`

Add the component to `generateJSON()` when it needs a custom exported control structure:

```javascript
else if (component.type === 'your_component') {
    const controlName = `your_component_${controls.length}@${namespace}.your_component`;

    controls.push({
        [controlName]: {
            "anchor_from": "top_left",
            "anchor_to": "top_left",
            "offset": [component.x + 1, component.y],
            "size": [component.width, component.height],
            "$property1": component.properties.property1
        }
    });
}
```

If the component can use the default container item export path, no custom branch may be needed. For non-slot components, buttons, custom panels, or components with root definitions, add an explicit branch.

## 8. Root Component Definitions

File: `scripts/preview.js`

If exported controls inherit from a custom element, add that root definition in `addComponentDefinitions()` only when the component is used:

```javascript
if (components.some(c => c.type === 'your_component')) {
    json.your_component = {
        "type": "panel",
        "size": [32, 32],
        "controls": [
            {
                "default": {
                    "type": "image",
                    "texture": "$texture"
                }
            }
        ]
    };
}
```

For inherited names, include the full key:

```javascript
json["drop_button@common.button"] = {
    "$default_button_texture|default": "textures/ui/button_borderless_light",
    "controls": []
};
```

## 9. Texture Handling

Texture path formats:
- In-editor uploaded image: `user_uploaded:custom_name`
- Exported uploaded image: `textures/ui/custom/custom_name`
- Vanilla or pack texture: `textures/ui/path_name`

Use these patterns in `scripts/components.js` or component-specific helpers:

```javascript
function getTextureUrl(texturePath) {
    if (!texturePath) return '';

    if (texturePath.startsWith('user_uploaded:')) {
        return imageManager.getImageUrl(texturePath);
    }

    if (texturePath.startsWith('textures/ui/')) {
        const filename = texturePath.replace('textures/ui/', '');
        return `https://raw.githubusercontent.com/Mojang/bedrock-samples/main/resource_pack/textures/ui/${filename}.png`;
    }

    return texturePath;
}

function getExportTexturePath(texturePath) {
    if (texturePath && texturePath.startsWith('user_uploaded:')) {
        const imageName = texturePath.replace('user_uploaded:', '');
        return `textures/ui/custom/${imageName}`;
    }

    return texturePath;
}
```

If the component uses custom texture variable names, update `scripts/export.js` so export can find and package them:

```javascript
if (obj.$your_texture && typeof obj.$your_texture === 'string' && !obj.$your_texture.startsWith('$')) {
    texturePaths.add(obj.$your_texture);
}
```

If a vanilla default texture should stay referenced but not be included in the resource pack, add it to a skip list such as `defaultButtonTextures` and check it before adding the texture path.

For editor/preview CSS backgrounds and `border-image`, use pixelated scaling:

```javascript
function withPixelatedRendering(style) {
    return `${style};image-rendering:pixelated;image-rendering:crisp-edges`;
}
```

`styles/components.css` also applies `image-rendering: pixelated` broadly to layout textures.

## 10. Nine-Slice Textures

For Minecraft JSON UI images that should preserve their border, add `nineslice_size`.

Example from the button component:

```json
{
  "default": {
    "type": "image",
    "texture": "$default_button_texture",
    "nineslice_size": 1
  }
}
```

For editor and preview rendering, mirror the same behavior with CSS `border-image`:

```javascript
function getButtonBorderStyles(defaultUrl, hoverUrl, pressedUrl) {
    const borderSlice = 1;
    const borderWidth = 1;

    return [
        `--button-default-texture:url('${defaultUrl}')`,
        `--button-hover-texture:url('${hoverUrl}')`,
        `--button-pressed-texture:url('${pressedUrl}')`,
        `border-image-source:url('${defaultUrl}')`,
        `border-image-slice:${borderSlice} fill`,
        `border-image-width:${borderWidth}px`,
        `border-image-repeat:stretch`,
        `background-image:none`
    ].join(';');
}
```

## 11. Button Component Reference

The button component is a useful model for non-slot interactive controls.

Properties:
- `target_collection_index`: target slot from existing collection indexes
- `pressed_button_name`: action to perform
- `default_texture`, `hover_texture`, `pressed_texture`: state textures
- `show_label`, `label_text`, `label_color`, `label_font_scale_factor`, `label_offset_x`, `label_offset_y`: optional embedded label
- `show_image`, `image_texture`, `image_width`, `image_height`, `image_offset_x`, `image_offset_y`: optional embedded image
- `x`, `y`, `width`, `height`

The target dropdown lists existing slot indexes, and the numeric target field can be set to any collection index even when no component currently owns that slot.

Supported actions:
- `button.container_take_all_place_all`
- `button.container_take_half_place_one`
- `button.container_auto_place`
- `button.drop_one`
- `button.drop_all`
- `button.coalesce_stack`

Default textures:
- `textures/ui/button_borderless_light`
- `textures/ui/button_borderless_lighthover`
- `textures/ui/button_borderless_lightpressed`

Export shape:

```json
{
  "button0@custom_chest_ui.drop_button": {
    "anchor_from": "top_left",
    "anchor_to": "top_left",
    "offset": [10, 19],
    "size": [16, 16],
    "$pressed_button_name": "button.container_auto_place",
    "property_bag": {
      "#collection_index": 0,
      "#collection_name": "container_items"
    },
    "$default_button_texture": "textures/ui/button_borderless_light",
    "$hover_button_texture": "textures/ui/button_borderless_lighthover",
    "$pressed_button_texture": "textures/ui/button_borderless_lightpressed"
  }
}
```

With optional embedded image and label enabled, the button instance sets variables for the inherited root controls:

```json
{
  "button0@custom_chest_ui.drop_button": {
    "anchor_from": "top_left",
    "anchor_to": "top_left",
    "offset": [10, 19],
    "size": [16, 16],
    "$pressed_button_name": "button.coalesce_stack",
    "property_bag": {
      "#collection_index": 0,
      "#collection_name": "container_items"
    },
    "$default_button_texture": "textures/ui/button_borderless_light",
    "$hover_button_texture": "textures/ui/button_borderless_lighthover",
    "$pressed_button_texture": "textures/ui/button_borderless_lightpressed",
    "$show_embedded_image": true,
    "$embedded_image_texture": "textures/ui/dark_plus",
    "$embedded_image_size": [8, 8],
    "$embedded_image_offset": [-3, 2],
    "$show_embedded_label": true,
    "$embedded_label_text": "Go",
    "$embedded_label_color": [1.0, 1.0, 1.0],
    "$embedded_label_font_scale_factor": 1.0,
    "$embedded_label_offset": [1, -1]
  }
}
```

Do not add `controls` directly to the button instance for embedded content, because that can replace the inherited `drop_button@common.button` controls. Put the embedded controls in the root definition and drive them with instance variables.

Root definition:

```json
{
  "drop_button@common.button": {
    "$default_button_texture|default": "textures/ui/button_borderless_light",
    "$hover_button_texture|default": "textures/ui/button_borderless_lighthover",
    "$pressed_button_texture|default": "textures/ui/button_borderless_lightpressed",
    "$show_embedded_image|default": false,
    "$embedded_image_texture|default": "",
    "$embedded_image_size|default": [8, 8],
    "$embedded_image_offset|default": [0, 0],
    "$show_embedded_label|default": false,
    "$embedded_label_text|default": "",
    "$embedded_label_color|default": [1.0, 1.0, 1.0],
    "$embedded_label_font_scale_factor|default": 1.0,
    "$embedded_label_offset|default": [0, 0],
    "controls": [
      {
        "default": {
          "type": "image",
          "texture": "$default_button_texture",
          "nineslice_size": 1
        }
      },
      {
        "hover": {
          "type": "image",
          "texture": "$hover_button_texture",
          "nineslice_size": 1
        }
      },
      {
        "pressed": {
          "type": "image",
          "texture": "$pressed_button_texture",
          "nineslice_size": 1
        }
      },
      {
        "embedded_image": {
          "type": "image",
          "texture": "$embedded_image_texture",
          "visible": "$show_embedded_image",
          "anchor_from": "center",
          "anchor_to": "center",
          "offset": "$embedded_image_offset",
          "size": "$embedded_image_size",
          "layer": 2
        }
      },
      {
        "embedded_label": {
          "type": "label",
          "text": "$embedded_label_text",
          "color": "$embedded_label_color",
          "font_scale_factor": "$embedded_label_font_scale_factor",
          "visible": "$show_embedded_label",
          "anchor_from": "center",
          "anchor_to": "center",
          "offset": "$embedded_label_offset",
          "layer": 3
        }
      }
    ]
  }
}
```

## 12. Label and Text Properties

Minecraft JSON UI labels support:

```json
{
  "type": "label",
  "text": "Label Text",
  "color": [1.0, 1.0, 1.0],
  "font_scale_factor": 1.0
}
```

Use `font_scale_factor` as a normal property, not a variable, unless the component intentionally needs per-instance variables from a root definition. The standalone `label` component stores it as `font_scale_factor`; the button embedded label stores editor data as `label_font_scale_factor` and exports the actual label property as `font_scale_factor`.

For editor and live preview rendering, mirror the scale by multiplying the base 10px Minecraft label size:

```javascript
const fontScale = Number(component.properties.font_scale_factor) || 1.0;
style="font-size:${10 * fontScale}px;"
```

The title label is configured from Chest UI settings rather than a draggable component. If adding more title label settings, add them to:
- `defaultSettings`
- `chestUiManager.normalizeSettings()`
- `chestUiManager.updateTitleDisplay()`
- the Settings modal in `index.html`
- `preview.generateJSON()` / `preview.generateChestScreenJSON()` if exported

Empty display titles are valid. Do not use `ui.newTitle || ui.title` for title display or export; it breaks intentionally empty strings. Use an explicit ownership check such as:

```javascript
const displayTitle = Object.prototype.hasOwnProperty.call(ui, 'newTitle') ? ui.newTitle : (ui.title ?? '');
```

## 13. Project Save, Load, Import, and Switching

Files: `scripts/project-format.js`, `scripts/app.js`, `scripts/export.js`, `scripts/components.js`

### Versioned format (`formatVersion: 2`)

All persisted project data uses `scripts/project-format.js`:

| API | Purpose |
|-----|---------|
| `build()` / `buildFromEditor()` | Create v2 payload |
| `validate()` / `assertValid()` | Reject legacy/unversioned data |
| `apply(data, { silent })` | Restore editor + `chestUiManager` + settings + `uploadedImages` |
| `persistLocal(data)` | Write `minecraft_chest_ui_project` |
| `saveToBrowser()` | Save button handler |

Payload fields: `formatVersion`, `formatLabel`, `exportedAt`, `components`, `uiProject`, `settings`, `uploadedImages`.

**Save / Load** - browser `localStorage` only. No file download or file picker.

**Import ZIP / Export ZIP** - files and in-game resource pack; ZIP includes the same v2 `chest_ui_data.json`. After import, `persistLocal(buildFromEditor())` updates the browser save.

Legacy saves with `version: "1.1.0"` and no `formatVersion: 2` are refused. Bump `FORMAT_VERSION` in `project-format.js` when breaking the schema.

### Multi-Chest-UI (`chestUiManager`)

- `captureActive()` - store current canvas components on the active UI before switch
- `loadActiveIntoEditor()` - restore selected UI into editor and preview
- `cloneComponents()` - deep clone + merge `defaultProps` (backfills new properties on old data)
- `normalizeSettings()` - defaults for per-UI settings (title, background, close button, …)

When adding a component property, add it to `defaultProps` so browser saves, ZIP import, and UI switching backfill correctly.

When adding a Chest UI setting, add it to `defaultSettings` and `normalizeSettings()`.

## 14. Export and Import Checks

File: `scripts/export.js`

When a component introduces new texture fields:
- Add JSON extraction for those fields.
- Ensure `updateImagePath()` rewrites uploaded paths for those fields.
- Decide whether default vanilla textures should be packaged or skipped (see `defaultButtonTextures` for borderless button/tab defaults).
- Ensure `extractTexturesFromComponents()` can still pick up uploaded images from component properties.

ZIP export embeds `projectFormat.build({ components, uiProject, settings })` in `chest_ui_data.json`. Import calls `projectFormat.assertValid()` then `apply()`.

Test both:
- **Browser:** Save → reload page or Load → components and all Chest UIs restore
- **ZIP:** Export → Import ZIP → same result; browser save updated to v2

Settings modal save should call `projectFormat.persistLocal(projectFormat.buildFromEditor())`.

## 15. Testing Checklist

- Component appears in the palette with the correct icon.
- Dragging from the palette creates the component.
- Selecting the component shows the correct properties template.
- Position and size inputs update editor and preview rendering.
- Component-specific dropdowns populate correctly.
- Texture uploads work for every texture property.
- Uploaded textures display in editor and preview.
- Exported JSON has the intended control shape.
- Root definitions are included only when the component is used.
- Uploaded texture paths convert to `textures/ui/custom/...`.
- Unchanged vanilla default textures are skipped when they should not be packaged.
- ZIP export includes changed/custom textures.
- Re-import restores the component and its properties.
- Browser save/reload restores the component and its properties.
- Switching between multiple Chest UIs preserves inactive UI component properties and settings.
- Empty strings remain empty when they are valid values.
- Run `node --check` on changed JavaScript files.
- Smoke-test `preview.generateJSON()` for the new component.

## 16. Tab Component Reference

Tabs are **individual** components (one toggle + one page each), not a single bundled tab panel.

### Properties (`componentTypes.tab`)

- `toggle_index` → exported `$name` is `toggle1`, `toggle2`, … (bindings use these short names)
- `toggle_group_name` (default `custom_chest_tabs`)
- `is_active` - editor-only; which tab is being edited
- Textures: `default_texture` (unselected), `hover_texture` (selected / `lightpressednohover`), `pressed_texture` (hover when unselected / `lighthover`) - same borderless paths as Button
- Embedded label: same as Button (`show_label`, `label_text`, …)

### Editor (`scripts/editor.js`)

- `setActiveTab(tabId)` - sets `is_active` on tab components
- New non-tab components dropped while a tab is active receive `tab_parent_id` = active tab `id`
- `isComponentVisibleInActiveTab()` - hides other tabs’ children on the canvas
- Render as `<motion.div class="editor-component button tab">`, not `<button>` (avoids `main.css` `button { border-radius }`)
- Inline `onclick` / `ontouchend` call `setActiveTab`; use string concat for `classList` in `onmouseleave`, not `` `${this.classList...}` `` at render time

### Export (`scripts/preview.js`)

- `createTabsLayout()` - tab bar + invisible `100%` page `panel`s with `#visible` → `source_control_name: toggleN`
- Children with `tab_parent_id` export inside the matching page via `createNestedComponentControl()`
- Root definition `tab_toggle` uses `common_toggles.light_text_toggle` pattern with `$size` / `$padding` from tab dimensions
- Do not bind page visibility to `tab_component_*` editor ids

### Properties panel

- Template `#tab-properties` in `index.html`
- `properties.js` - texture uploads + embedded label; on mobile, use full `propertiesPanel.setupEventListeners()` (not a reduced handler set)

### Palette icon

`styles/components.css`:

```css
.component-icon.tab {
    background-image: url('../assets/images/tab.png');
}
```

Tab-specific components usually **do not** use `needsIndex` (no `collection_index`).

## 17. Mobile Considerations

File: `scripts/mobile.js`, `styles/mobile.css`

When changing editor interaction or properties:

- Tap-to-place must account for canvas scale and zoom
- Properties drawer should use `propertiesPanel.setInputValues()` and `setupEventListeners()` so tab/button texture fields work
- `updateComponent` / `updateComponentPosition` should sync the properties panel
- Preview tab switch: call `refreshPreviewView()` when relevant
- Coarse pointers: minimum ~44px touch targets for small components where applicable
- Canvas tap-to-place only when `e.target === e.currentTarget` (empty canvas)

Mobile does not need duplicate Save/Load file flows; keep files on Import/Export ZIP only.

## 18. Common Mistakes

- Using `data-component` in the palette instead of the current `data-type` pattern.
- Forgetting to add the properties template ID used by `componentTypes[type].template`.
- Adding a target-only component to `needsIndex`, causing it to consume slot indexes incorrectly.
- Forgetting `anchor_from`, `anchor_to`, `offset`, or `size` in exported JSON.
- Adding new texture variables in preview JSON but not extracting them in `export.js`.
- Converting uploaded paths for normal texture fields but forgetting custom `$variable_texture` fields.
- Hardcoding CSS width/height for resizable components.
- Adding root definitions unconditionally, which bloats exports and can create unused JSON.
- Using `||` fallbacks for values where `0`, `false`, or `""` are valid.
- Adding a new saved property but forgetting `defaultProps`, `cloneComponents()`, or `normalizeSettings()` coverage.
- Using `<button>` for tab/button editor chrome (round corners from global CSS).
- Binding tab page `#visible` to long editor ids instead of `toggle1`, `toggle2`, …
- Putting file download/upload on Save/Load (belongs on Import/Export ZIP only).
- Saving projects without `formatVersion: 2` or expecting legacy `version: "1.1.0"` loads to work.

Keeping these steps aligned with the existing component system helps new components integrate with drag/drop, properties, preview, JSON export, ZIP export, versioned browser save/load, and project re-import.
