const preview = {
    zoomLevel: 1,

    init: function () {
        this.previewContainer = document.getElementById('preview-component-container');
        this.previewCanvas = document.getElementById('preview-canvas');
        this.setupZoom();
        this.previewManager = {
            convertTexturePath: function (texturePath) {
                if (!texturePath || typeof texturePath !== 'string') return texturePath;
                
                if (texturePath.startsWith('user_uploaded:')) {
                    const imageName = texturePath.replace('user_uploaded:', '');
                    return `textures/ui/custom/${imageName}`;
                }
                
                return texturePath;
            }
        };
    },

    updatePreview: function (components) {
        this.previewContainer.innerHTML = '';

        components.filter(component => {
            return typeof editor === 'undefined' || editor.isComponentVisibleInActiveTab(component);
        }).forEach(component => {
            const componentType = componentTypes[component.type];
            if (!componentType) return;

            const previewHtml = componentType.renderPreview(component);
            if (previewHtml) {
                this.previewContainer.innerHTML += previewHtml;
            }
        });

        // Apply background texture from current active UI
        const activeUi = chestUiManager.getActiveUi();
        if (activeUi && activeUi.settings) {
            this.applyBackgroundToPreview(activeUi.settings);
        }
    },

    updatePreviewWithSettings: function (components, settings) {
        this.previewContainer.innerHTML = '';

        components.filter(component => {
            return typeof editor === 'undefined' || editor.isComponentVisibleInActiveTab(component);
        }).forEach(component => {
            const componentType = componentTypes[component.type];
            if (!componentType) return;

            const previewHtml = componentType.renderPreview(component);
            if (previewHtml) {
                this.previewContainer.innerHTML += previewHtml;
            }
        });

        // Apply background texture to chest panel
        this.applyBackgroundToPreview(settings);
    },

    applyBackgroundToPreview: function (settings) {
        if (!settings) return;

        // Apply background directly to the chest panel
        const chestPanel = document.querySelector('.preview-canvas .chest-panel');
        if (!chestPanel) return;

        chestPanel.style.imageRendering = 'pixelated';

        // Handle close button visibility
        const closeButton = chestPanel.querySelector('.chest-close-button');
        if (closeButton) {
            closeButton.style.display = settings.showCloseButton !== false ? 'block' : 'none';
        }

        if (!settings.dialogBackground) return;

        // Check if it's an uploaded image
        if (imageManager.isUploadedImage(settings.dialogBackground)) {
            const imageUrl = imageManager.getImageUrl(settings.dialogBackground);
            chestPanel.style.backgroundImage = `url('${imageUrl}')`;
            chestPanel.style.backgroundSize = 'cover';
            chestPanel.style.backgroundPosition = 'center';
            chestPanel.style.backgroundRepeat = 'no-repeat';
            // Override border-image that might interfere
            chestPanel.style.borderImageSource = 'none';
            chestPanel.style.borderImageSlice = 'initial';
            chestPanel.style.borderImageWidth = 'initial';
        } else {
            // For regular texture paths, restore default background
            chestPanel.style.backgroundImage = '';
            chestPanel.style.backgroundColor = 'var(--mc-panel-bg)';
            // Restore default border-image
            chestPanel.style.borderImageSource = "url('https://raw.githubusercontent.com/Mojang/bedrock-samples/main/resource_pack/textures/ui/dialog_background_opaque.png')";
            chestPanel.style.borderImageSlice = '4 fill';
            chestPanel.style.borderImageWidth = '4px';
        }
    },

    applyCloseButtonToEditor: function (settings) {
        console.log('applyCloseButtonToEditor called with settings:', settings);
        
        if (!settings) {
            console.log('No settings provided');
            return;
        }

        // Handle close button visibility in editor canvas
        const editorChestPanel = document.querySelector('.editor-canvas .chest-panel');
        console.log('editorChestPanel:', editorChestPanel);
        
        if (!editorChestPanel) {
            console.log('editorChestPanel not found');
            return;
        }

        const closeButton = editorChestPanel.querySelector('.chest-close-button');
        console.log('closeButton:', closeButton);
        console.log('showCloseButton setting:', settings.showCloseButton);
        
        if (closeButton) {
            const shouldShow = settings.showCloseButton !== false;
            console.log('Setting close button display to:', shouldShow ? 'block' : 'none');
            closeButton.style.display = shouldShow ? 'block' : 'none';
        } else {
            console.log('closeButton element not found in editor panel');
        }
    },

    updateComponent: function (component) {
        const componentType = componentTypes[component.type];
        if (!componentType) return;

        const currentComponents = editor.getComponents();
        this.updatePreview(currentComponents);
    },

    generateJSON: function (settings = null, options = {}) {
        const components = options.components || editor.getComponents();
        const namespace = options.namespace || "chest";
        const panelPrefix = options.panelPrefix || "custom";
        const usesCollectionHost = !components.some(component => component.type === 'dynamic_grid');
        
        // Get settings from active UI if not provided
        if (!settings) {
            const activeUi = chestUiManager.getActiveUi();
            settings = activeUi ? activeUi.settings : defaultSettings;
        }
        
        // Store current components for calculatePanelHeight to access
        this.currentComponents = components;
        
        const controls = [];
        let buttonCount = 0;
        components.filter(component => !component.properties?.tab_parent_id && component.type !== 'tab').forEach(component => {
            const componentType = componentTypes[component.type];
            if (!componentType) return;

            if (component.type === 'label') {
                controls.push({
                    "name": {
                        "type": "label",
                        "text": component.properties.text,
                        "color": component.properties.color,
                        "font_scale_factor": Number(component.properties.font_scale_factor) || 1.0,
                        "anchor_from": "top_left",
                        "anchor_to": "top_left",
                        "offset": [component.x + 1, component.y]
                    }
                });
            }
            else if (component.type === 'image') {
                const imageId = `image_${controls.length}`;
                controls.push({
                    [imageId]: {
                        "type": "image",
                        "texture": component.properties.texture,
                        "alpha": component.properties.alpha,
                        "anchor_from": "top_left",
                        "anchor_to": "top_left",
                        "offset": [component.x + 1, component.y],
                        "size": [component.width, component.height]
                    }
                });
            }
            else if (component.type === 'progress_bar') {
                
                const index = Number(component.properties.collection_index);
                const controlName = `item${index}@${namespace}.progress_bar`;

                const progressControl = {
                    [controlName]: {
                        "collection_index": index,
                        "anchor_from": "top_left",
                        "anchor_to": "top_left",
                        "offset": [component.x + 1, component.y],
                        "controls": [
                            {
                                "default": {
                                    "type": "image",
                                    "texture": "textures/ui/progress_bar/progress_bar",
                                    "layer": 2,
                                    "size": ["100%", "100%"]
                                }
                            }
                        ]
                    }
                };

                for (let i = 0; i <= 9; i++) {
                    progressControl[controlName].controls.push({
                        [`progress${i + 1}@image_template`]: {
                            "$texture": `textures/ui/progress_bar/progress_bar${i}`,
                            "$binding_text": i,
                            "layer": 3
                        }
                    });
                }

                controls.push(progressControl);
            }
            else if (component.type === 'on_off_item') {
                
                const index = Number(component.properties.collection_index);
                const controlName = `item${index}@${namespace}.on_off_item`;

                controls.push({
                    [controlName]: {
                        "collection_index": index,
                        "anchor_from": "top_left",
                        "anchor_to": "top_left",
                        "offset": [component.x + 1, component.y],
                        "controls": [
                            {
                                "default": {
                                    "type": "image",
                                    "texture": "textures/ui/on_off/on_off",
                                    "layer": 2,
                                    "size": ["100%", "100%"]
                                }
                            },
                            {
                                "on_off_active@image_template": {
                                    "$texture": "textures/ui/on_off/on_off_active",
                                    "$binding_text": 1,
                                    "layer": 3
                                }
                            }
                        ]
                    }
                });
            }
            else if (component.type === 'pot') {
                
                const index = Number(component.properties.collection_index);
                const controlName = `item${index}@${namespace}.pot`;

                controls.push({
                    [controlName]: {
                        "collection_index": index,
                        "anchor_from": "top_left",
                        "anchor_to": "top_left",
                        "offset": [component.x + 1, component.y],
                        "$texture": component.properties.texture
                    }
                });
            }
            else if (component.type === 'container_type') {
                
                const index = Number(component.properties.collection_index);
                const controlName = `item${index}@${namespace}.container_type`;

                const containerControl = {
                    [controlName]: {
                        "collection_index": index,
                        "anchor_from": "top_left",
                        "anchor_to": "top_left",
                        "offset": [component.x + 1, component.y],
                        ...this.getSlotTextureVariables(component, namespace),
                        "controls": []
                    }
                };

                for (let i = 0; i <= 9; i++) {
                    containerControl[controlName].controls.push({
                        [`container_type${i}@image_template`]: {
                            "$texture": `textures/ui/container_type/container_type${i}`,
                            "$binding_text": i,
                            "layer": 8
                        }
                    });
                }

                controls.push(containerControl);
            }
            else if (component.type === 'container_item_with_picture') {
                
                const index = Number(component.properties.collection_index);
                const controlName = `item${index}@${namespace}.container_item_with_picture`;

                controls.push({
                    [controlName]: {
                        "collection_index": index,
                        "anchor_from": "top_left",
                        "anchor_to": "top_left",
                        "offset": [component.x + 1, component.y],
                        ...this.getSlotTextureVariables(component, namespace),
                        "$path_to_image": component.properties.picture
                    }
                });
            }
            else if (component.type === 'dynamic_grid') {
                const gridName = `${panelPrefix}_${this.safeId(component.id)}_dynamic_grid`;
                const panelName = `${panelPrefix}_${this.safeId(component.id)}_scroll_panel`;
                const contentName = `${panelName}_content`;
                const gridContentName = `${contentName}_${this.safeId(component.id)}_dynamic_grid`;

                controls.push({
                    [`${panelName}_wrapper`]: {
                        "type": "panel",
                        "offset": [component.x + 1, component.y],
                        "size": [component.width, component.height],
                        "anchor_from": "top_left",
                        "anchor_to": "top_left",
                        "controls": [
                            {
                                [`${panelName}@custom_scroll.scrolling_panel`]: {
                                    "offset": [0, 0],
                                    "size": [component.width, component.height],
                                    "$scroll_bar_contained": false,
                                    "$scroll_size": [`${component.properties.scroll_size_width ?? 8}px`, "100%"],
                                    "$scrollbar_box_image_size": [`${component.properties.scrollbar_box_image_size_width ?? 8}px`, "100%"],
                                    "$scroll_track_offset": component.properties.scroll_track_offset || [`${component.properties.scroll_size_width ?? 8}px`, 0],
                                    "$show_background": component.properties.show_background !== false,
                                    "$scroll_indent_image_texture": this.previewManager.convertTexturePath(component.properties.scroll_indent_image_texture || "textures/ui/ScrollRail"),
                                    "$scrollbar_box_image_texture": this.previewManager.convertTexturePath(component.properties.scrollbar_box_image_texture || "textures/ui/ScrollHandle"),
                                    "$scroll_background_image_texture": this.previewManager.convertTexturePath(component.properties.scroll_background_image_texture || "textures/ui/ScrollRail"),
                                    "$background_size": [component.width, component.height],
                                    "$background_offset": [0, 0],
                                    "$scrolling_content|default": `${namespace}.${gridContentName}`
                                }
                            }
                        ]
                    }
                });
            }
            else if (component.type === 'button') {
                const index = Number(component.properties.target_collection_index) || 0;
                const controlName = `button${buttonCount++}@${namespace}.drop_button`;

                const buttonControl = {
                    [controlName]: {
                        "anchor_from": "top_left",
                        "anchor_to": "top_left",
                        "offset": [component.x + 1, component.y],
                        "size": [component.width, component.height],
                        "$pressed_button_name": component.properties.pressed_button_name,
                        "property_bag": {
                            "#collection_index": index,
                            "#collection_name": "container_items"
                        },
                        "$default_button_texture": getExportTexturePath(component.properties.default_texture),
                        "$hover_button_texture": getExportTexturePath(component.properties.hover_texture),
                        "$pressed_button_texture": getExportTexturePath(component.properties.pressed_texture),
                        "$show_embedded_image": !!component.properties.show_image,
                        "$embedded_image_texture": getExportTexturePath(component.properties.image_texture),
                        "$embedded_image_size": [
                            Number(component.properties.image_width) || 8,
                            Number(component.properties.image_height) || 8
                        ],
                        "$embedded_image_offset": [
                            Number(component.properties.image_offset_x) || 0,
                            Number(component.properties.image_offset_y) || 0
                        ],
                        "$show_embedded_label": !!component.properties.show_label,
                        "$embedded_label_text": component.properties.label_text || "",
                        "$embedded_label_color": component.properties.label_color || [1.0, 1.0, 1.0],
                        "$embedded_label_font_scale_factor": Number(component.properties.label_font_scale_factor) || 1.0,
                        "$embedded_label_offset": [
                            Number(component.properties.label_offset_x) || 0,
                            Number(component.properties.label_offset_y) || 0
                        ]
                    }
                };

                controls.push(buttonControl);
            }
            else if (component.type === 'close_button') {
                // Use the component's generateJSON method to get the proper structure
                const closeButtonJson = componentTypes.close_button.generateJSON(component);
                controls.push(closeButtonJson);
            }
            else {
                
                const index = Number(component.properties.collection_index);
                const controlName = `item${index}@${namespace}.container_item`;

                const control = {
                    [controlName]: {
                        "collection_index": index,
                        "anchor_from": "top_left",
                        "anchor_to": "top_left",
                        "offset": [component.x + 1, component.y],
                        ...this.getSlotTextureVariables(component, namespace)
                    }
                };

                if (component.width !== componentTypes[component.type].defaultWidth ||
                    component.height !== componentTypes[component.type].defaultHeight) {
                    control[controlName]["$cell_image_size"] = [component.width, component.height];
                }

                controls.push(control);
            }
        });

        const tabsLayout = this.createTabsLayout(components, namespace, panelPrefix);
        if (tabsLayout) {
            controls.push(tabsLayout);
        }

        const json = {
            "namespace": namespace,

            [`${panelPrefix}_panel`]: {
                "type": "panel",
                "controls": [
                    {
                        "root_panel@common.root_panel": {
                            "size": [178, this.getMainPanelHeight(settings)],
                            "layer": 1,
                            "controls": [
                                { 
                                    "common_panel@common.common_panel": {
                                        "$dialog_background": "custom_chest_ui.dialog_background",
                                        "$dialog_background_texture": settings.dialogBackground && settings.dialogBackground.startsWith('user_uploaded:') ? 
                    `textures/ui/custom/${settings.dialogBackground.replace('user_uploaded:', '')}` : 
                    settings.dialogBackground,
                                        "$show_close_button": settings.showCloseButton !== false
                                    }
                                },
                                {
                            "chest_panel": {
                                "type": "panel",
                                "size": ["100%", this.getMainPanelHeight(settings)],
                                "layer": 5,
                                "controls": [
                                            {
                                                [`${panelPrefix}_top_half@${namespace}.${panelPrefix}_top_half`]: {}
                                            },
                                            {
                                                "inventory_panel_bottom_half_with_label@common.inventory_panel_bottom_half_with_label": {}
                                            },
                                            { "hotbar_grid@common.hotbar_grid_template": {} },
                                            {
                                                "inventory_take_progress_icon_button@common.inventory_take_progress_icon_button": {}
                                            },
                                            {
                                                "flying_item_renderer@common.flying_item_renderer": {
                                                    "layer": 15
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    "inventory_selected_icon_button@common.inventory_selected_icon_button": {}
                                },
                                { "gamepad_cursor@common.gamepad_cursor_button": {} }
                            ]
                        }
                    }
                ]
            },

            [`${panelPrefix}_top_half`]: {
                "type": "panel",
                "size": ["100%", "50%"],
                "offset": [0, 12],
                "anchor_to": "top_left",
                "anchor_from": "top_left",
                "controls": [
                    { "chest_label@chest.chest_label": { "offset": [settings.titleOffsetX ?? 10, settings.titleOffsetY ?? -6], "color": settings.titleColor || [1.0, 1.0, 1.0], "font_scale_factor": Number(settings.titleFontScaleFactor) || 1.0 } },
                    { [`${panelPrefix}_content@${namespace}.${panelPrefix}_content`]: {} }
                ]
            },

            [`${panelPrefix}_content`]: {
                "type": usesCollectionHost ? "collection_panel" : "panel",
                "size": [162, this.calculatePanelHeight(settings)],
                "anchor_from": "top_left",
                "anchor_to": "top_left",
                ...(usesCollectionHost ? {
                    "$item_collection_name": "container_items",
                    "collection_name": "container_items",
                    "$dark_border_toggle_hover_color": [1.0, 1.0, 1.0]
                } : {}),
                "controls": controls
            },

            "image_template": {
                "type": "image",
                "texture": "$texture",
                "bindings": [
                    {
                        "binding_name": "#hover_text",
                        "binding_type": "collection",
                        "binding_collection_name": "container_items"
                    },
                    {
                        "binding_type": "view",
                        "source_property_name": "( #hover_text - ('%.6s' * #hover_text) = $binding_text)",
                        "target_property_name": "#visible"
                    }
                ]
            }
        };

        components
            .filter(component => component.type === 'dynamic_grid')
            .forEach(component => {
                const panelName = `${panelPrefix}_${this.safeId(component.id)}_scroll_panel`;
                const contentName = `${panelName}_content`;
                const gridName = `${contentName}_${this.safeId(component.id)}_dynamic_grid`;
                
                json[`${gridName}@common.container_grid`] = this.createDynamicGridDefinition(component, namespace);
            });

        // Add custom scroller definition only if dynamic grids are used
        if (components.some(component => component.type === 'dynamic_grid')) {
            // Get texture properties from first dynamic grid component
            const dynamicGridComponent = components.find(c => c.type === 'dynamic_grid');
            const scrollRailTexture = dynamicGridComponent?.properties?.scroll_indent_image_texture || "textures/ui/ScrollRail";
            const scrollHandleTexture = dynamicGridComponent?.properties?.scrollbar_box_image_texture || "textures/ui/ScrollHandle";
            
            json.custom_scroll = {
                "namespace": "custom_scroll",

                "scroll_background_and_viewport": {
                    "type": "panel",
                    "size": "$view_port_size",
                    "anchor_from": "top_left",
                    "anchor_to": "top_left",
                    "$view_port_clip_background|default": true,
                    "clips_children": "$view_port_clip_background",
                    "controls": [
                        {
                            "background@$scroll_background_image_control": {
                                "visible": "$show_background",
                                "anchor_to": "top_left",
                                "anchor_from": "top_left",
                                "offset": "$background_offset",
                                "size": "$background_size"
                            }
                        },
                        {
                            "scrolling_view_port": {
                                "layer": 1,
                                "type": "panel",
                                "anchor_from": "top_left",
                                "anchor_to": "top_left",
                                "offset": "$scroll_view_port_offset",
                                "size": "$scroll_view_port_size",
                                "max_size": "$scroll_view_port_max_size",
                                "$scroll_view_port_clips_children|default": true,
                                "clips_children": "$scroll_view_port_clips_children",
                                "controls": [
                                    {
                                        "scrolling_content@$scrolling_content": {
                                            "layer": 1,
                                            "$scrolling_content_anchor_from|default": "top_left",
                                            "$scrolling_content_anchor_to|default": "top_left",
                                            "anchor_from": "$scrolling_content_anchor_from",
                                            "anchor_to": "$scrolling_content_anchor_to"
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                },

                "scroll_bar_and_track": {
                    "type": "panel",
                    "size": "$scroll_size",
                    "clips_children": true,
                    "anchor_from": "right_middle",
                    "anchor_to": "right_middle",
                    "$scroll_track_offset|default": [ 0, 0 ],
                    "offset": "$scroll_track_offset",
                    "controls": [
                        {
                            "track@custom_scroll.scrollbar_track": {
                                "layer": 2,
                                "anchor_from": "center",
                                "anchor_to": "center"
                            }
                        },
                        {
                            "box": {
                                "type": "scrollbar_box",
                                "layer": 5,
                                "anchor_to": "top_left",
                                "anchor_from": "top_left",
                                "visible": "$scroll_box_visible",
                                "contained": true,
                                "draggable": "vertical",
                                "button_mappings": [
                                    {
                                        "from_button_id": "button.menu_select",
                                        "to_button_id": "button.menu_select",
                                        "mapping_type": "pressed",
                                        "button_up_right_of_first_refusal": true
                                    }
                                ],
                                "controls": [
                                    {
                                        "box_image@$scroll_box_image_control": {
                                            "size": "$scroll_box_size"
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                },
                "scroll_indent_image": {
                    "type": "image",
                    "fill": true,
                    "$scroll_indent_image_texture|default": "textures/ui/ScrollRail",
                    "texture": "$scroll_indent_image_texture",
                    "$scroll_indent_image_size|default": "$scroll_size",
                    "size": "$scroll_indent_image_size",
                    "layer": 3
                },

                "scroll_background_image": {
                    "type": "image",
                    "fill": true,
                    "$scroll_background_image_texture|default": "textures/ui/ScrollRail",
                    "texture": "$scroll_background_image_texture",
                    "$scroll_background_image_size|default": "$view_port_size",
                    "size": "$scroll_background_image_size",
                    "layer": 3
                },

                "scrollbar_box_image": {
                    "type": "image",
                    "fill": true,
                    "$scrollbar_box_image_texture|default": "textures/ui/ScrollHandle",
                    "texture": "$scrollbar_box_image_texture",
                    "$scrollbar_box_image_size|default": "$scroll_size",
                    "size": "$scrollbar_box_image_size",
                    "layer": 4
                },

                "scrollbar_track": {
                    "type": "scroll_track",
                    "$focus_for_tts_enabled|default": true,
                    "focus_enabled": "$focus_for_tts_enabled",
                    "$scrollbar_tts_name|default": "accessibility.scrollbar.tts.title",
                    "tts_name": "$scrollbar_tts_name",
                    "tts_ignore_count": true,
                    "button_mappings": [
                        {
                            "from_button_id": "button.menu_select",
                            "to_button_id": "button.scrollbar_skip_track",
                            "mapping_type": "pressed"
                        }
                    ],
                    "controls": [
                        {
                            "bar_indent@$scroll_track_image_control": {
                                "visible": "$scroll_box_visible"
                            }
                        }
                    ]
                },

                "scroll_view_control": {
                    "type": "scroll_view",
                    "size": "$scroll_view_control_size",
                    "$scroll_view_control_anchor|default": "center",
                    "anchor_to": "$scroll_view_control_anchor",
                    "anchor_from": "$scroll_view_control_anchor",
                    "scroll_speed": 15,
                    "scrollbar_track_button": "button.scrollbar_skip_track",
                    "scrollbar_touch_button": "button.scrollbar_touch",
                    "always_listen_to_input": true,
                    "always_handle_pointer": true,
                    "$always_handle_scrolling|default": false,
                    "always_handle_scrolling": "$always_handle_scrolling",
                    "$scrollbar_always_visible|default": false,
                    "scrollbar_always_visible": "$scrollbar_always_visible",
                    "scrollbar_track": "track",
                    "scrollbar_box": "box",
                    "scroll_content": "scrolling_content",
                    "scroll_view_port": "scrolling_view_port",
                    "scroll_box_and_track_panel": "bar_and_track",
                    "$jump_to_bottom_on_update|default": false,
                    "jump_to_bottom_on_update": "$jump_to_bottom_on_update",
                    "$scroll_background_image_control|default": "custom_scroll.scroll_background_image",
                    "$scroll_track_image_control|default": "custom_scroll.scroll_indent_image",
                    "$force_scroll_to_end_binding_name|default": "",
                    "$force_scroll_to_end_binding_type|default": "none",
                    "button_mappings": [
                        {
                            "from_button_id": "button.menu_select",
                            "to_button_id": "button.scrollbar_touch",
                            "mapping_type": "pressed",
                            "button_up_right_of_first_refusal": true
                        }
                    ],
                    "bindings": [
                        {
                            "binding_name": "#gesture_control_enabled"
                        },
                        {
                            "binding_type": "$force_scroll_to_end_binding_type",
                            "binding_name": "$force_scroll_to_end_binding_name",
                            "binding_name_override": "#force_scroll_to_end",
                            "binding_condition": "always_when_visible"
                        }
                    ],
                    "controls": [
                        {
                            "stack_panel": {
                                "ignored": "$scroll_bar_contained",
                                "type": "stack_panel",
                                "orientation": "horizontal",
                                "anchor_to": "top_left",
                                "anchor_from": "top_left",
                                "$scroll_view_stack_panel_size|default": [ "100%", "100%" ],
                                "size": "$scroll_view_stack_panel_size",
                                "controls": [
                                    { "background_and_viewport@custom_scroll.scroll_background_and_viewport": {} },
                                    { "bar_and_track@custom_scroll.scroll_bar_and_track": {} }
                                ]
                            }
                        },
                        {
                            "panel": {
                                "ignored": "(not $scroll_bar_contained)",
                                "type": "panel",
                                "anchor_to": "top_left",
                                "anchor_from": "top_left",
                                "$view_port_size|default": [ "100%", "100%" ],
                                "$scroll_view_port_panel_size|default": [ "100%", "100%" ],
                                "size": "$scroll_view_port_panel_size",
                                "controls": [
                                    { "background_and_viewport@custom_scroll.scroll_background_and_viewport": {} },
                                    { "bar_and_track@custom_scroll.scroll_bar_and_track": {} }
                                ]
                            }
                        }
                    ]
                },

                "scrolling_panel": {
                    "type": "input_panel",
                    "anchor_to": "top_left",
                    "anchor_from": "top_left",
                    "$scroll_panel_consume_hover_events|default": true,
                    "consume_hover_events": "$scroll_panel_consume_hover_events",
                    "$scrolling_panel_base_button_mappings|default": [],
                    "button_mappings": "$scrolling_panel_base_button_mappings",
                    "tts_ignore_count": true,

                    "$scroll_view_control_size|default": [ "100%", "100%" ],
                    "$background_size|default": [ "100%", "100%" ],
                    "$background_offset|default": [ 0, 0 ],
                    "$scroll_view_port_size|default": [ "100%", "100%" ],
                    "$scroll_view_port_max_size|default": [ "100%", "100%" ],
                    "$scroll_view_port_offset|default": [ 0, 0 ],
                    "$view_port_size|default": [ "fill", "100%" ],
                    "$scroll_bar_contained|default": false,
                    "$scroll_size|default": [ "4px", "100%" ],
                    "$scroll_box_size|default": [ "100%", "100%" ],
                    "$scroll_box_image_control|default": "custom_scroll.scrollbar_box_image",
                    "$scroll_box_visible|default": true,
                    "$show_background|default": true,
                    "$allow_scrolling_even_when_content_fits|default": true,

                    "controls": [
                        {
                            "scroll_view@custom_scroll.scroll_view_control": {
                                "allow_scroll_even_when_content_fits": "$allow_scrolling_even_when_content_fits"
                            }
                        }
                    ]
                }
            };
        }

        this.addComponentDefinitions(json, components);

        return json;
    },

    generateProjectJSON: function (settings = null, chestUis = null) {
        const uis = (chestUis && chestUis.length ? chestUis : [{
            id: "default",
            title: "§F§l§a§g§r§T§i§t§l§e§r",
            components: editor.getComponents()
        }]).map((ui, index) => ({
            ...ui,
            title: ui.title || ``,
            panelPrefix: this.createPanelPrefix(ui, index)
        }));

        const chestScreen = this.generateChestScreenJSON(uis);
        const customUi = { "namespace": "custom_chest_ui" };
        const allComponents = [];
        let customScroller = null;

        uis.forEach(ui => {
            const uiJson = this.generateJSON(ui.settings, {
                components: ui.components || [],
                namespace: "custom_chest_ui",
                panelPrefix: ui.panelPrefix,
                includeChestScreen: false
            });

            Object.keys(uiJson).forEach(key => {
                if (key !== "namespace") {
                    if (key === "custom_scroll") {
                        // Extract custom scroller to separate file
                        customScroller = { "namespace": "custom_scroll", ...uiJson[key] };
                    } else {
                        customUi[key] = uiJson[key];
                    }
                }
            });

            allComponents.push(...(ui.components || []));
        });

        this.addComponentDefinitions(customUi, allComponents);

        const uiDefs = {
            "ui_defs": [
                "ui/custom_chest_ui.json",
                "ui/chest_screen.json"
            ]
        };

        // Add custom scroller file to ui_defs if needed
        if (customScroller) {
            uiDefs.ui_defs.push("ui/custom_scroll.json");
        }

        return {
            uiDefs,
            chestScreen,
            customUi,
            ...(customScroller ? { customScroller } : {})
        };
    },

    generateChestScreenJSON: function (uis) {
        const modifications = uis.map(ui => {
            const settings = ui.settings || defaultSettings;
            const triggerTitle = Object.prototype.hasOwnProperty.call(ui || {}, 'triggerTitle') ? ui.triggerTitle : (ui.title ?? "");
            const displayTitle = Object.prototype.hasOwnProperty.call(ui || {}, 'newTitle') ? ui.newTitle : (ui.title ?? "");
            return {
                "array_name": "variables",
                "operation": "insert_back",
                "value": {
                    "requires": `($new_container_title = '${this.escapeJsonUiString(triggerTitle)}')`,
                    "$screen_content": `custom_chest_ui.${ui.panelPrefix}_panel`,
                    "$new_container_title": displayTitle
                }
            };
        });

        return {
            "namespace": "chest",
            "chest_label": {
                "$new_container_title|default": "$container_title",
                "type": "label",
                "text": "$new_container_title",
                "font_scale_factor": 1.0
            },
            "small_chest_screen@common.inventory_screen_common": {
                "$close_on_player_hurt|default": true,
                "$use_custom_pocket_toast|default": false,
                "use_custom_pocket_toast": "$use_custom_pocket_toast",
                "close_on_player_hurt": "$close_on_player_hurt",
                "$new_container_title|default": "$container_title",
                "$container_size|default": 27,
                "modifications": modifications
            }
        };
    },

    buildTitleMatchExpression: function (uis) {
        return uis
            .map(ui => `($new_container_title = '${this.escapeJsonUiString(ui.title)}')`)
            .join(" or ");
    },

    createPanelPrefix: function (ui, index) {
        const raw = (ui.title || ui.newTitle || ui.triggerTitle || ui.id || `custom_${index + 1}`).toLowerCase();
        const clean = raw.replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
        return clean ? `ui_${index + 1}_${clean}` : `ui_${index + 1}`;
    },

    escapeJsonUiString: function (value) {
        return String(value || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    },

    createNestedComponentControl: function (component, namespace, panelPrefix) {
        if (component.type === 'label') {
            return {
                [`label_${this.safeId(component.id)}`]: {
                    "type": "label",
                    "text": component.properties.text,
                    "color": component.properties.color,
                    "font_scale_factor": Number(component.properties.font_scale_factor) || 1.0,
                    "anchor_from": "top_left",
                    "anchor_to": "top_left",
                    "offset": [component.x + 1, component.y]
                }
            };
        }

        if (component.type === 'image') {
            return {
                [`image_${this.safeId(component.id)}`]: {
                    "type": "image",
                    "texture": component.properties.texture,
                    "alpha": component.properties.alpha,
                    "anchor_from": "top_left",
                    "anchor_to": "top_left",
                    "offset": [component.x + 1, component.y],
                    "size": [component.width, component.height]
                }
            };
        }

        if (component.type === 'button') {
            const index = Number(component.properties.target_collection_index) || 0;
            return {
                [`button_${this.safeId(component.id)}@${namespace}.drop_button`]: {
                    "anchor_from": "top_left",
                    "anchor_to": "top_left",
                    "offset": [component.x + 1, component.y],
                    "size": [component.width, component.height],
                    "$pressed_button_name": component.properties.pressed_button_name,
                    "property_bag": {
                        "#collection_index": index,
                        "#collection_name": "container_items"
                    },
                    "$default_button_texture": getExportTexturePath(component.properties.default_texture),
                    "$hover_button_texture": getExportTexturePath(component.properties.hover_texture),
                    "$pressed_button_texture": getExportTexturePath(component.properties.pressed_texture),
                    "$show_embedded_image": !!component.properties.show_image,
                    "$embedded_image_texture": getExportTexturePath(component.properties.image_texture),
                    "$embedded_image_size": [Number(component.properties.image_width) || 8, Number(component.properties.image_height) || 8],
                    "$embedded_image_offset": [Number(component.properties.image_offset_x) || 0, Number(component.properties.image_offset_y) || 0],
                    "$show_embedded_label": !!component.properties.show_label,
                    "$embedded_label_text": component.properties.label_text || "",
                    "$embedded_label_color": component.properties.label_color || [1.0, 1.0, 1.0],
                    "$embedded_label_font_scale_factor": Number(component.properties.label_font_scale_factor) || 1.0,
                    "$embedded_label_offset": [Number(component.properties.label_offset_x) || 0, Number(component.properties.label_offset_y) || 0]
                }
            };
        }

        if (component.type === 'dynamic_grid') {
            const panelName = `${panelPrefix}_${this.safeId(component.id)}_scroll_panel`;
            const contentName = `${panelName}_content`;
            const gridContentName = `${contentName}_${this.safeId(component.id)}_dynamic_grid`;
            return {
                [`${panelName}_wrapper`]: {
                    "type": "panel",
                    "offset": [component.x + 1, component.y],
                    "size": [component.width, component.height],
                    "anchor_from": "top_left",
                    "anchor_to": "top_left",
                    "controls": [
                        {
                            [`${panelName}@custom_scroll.scrolling_panel`]: {
                                "offset": [0, 0],
                                "size": [component.width, component.height],
                                "$scroll_bar_contained": false,
                                "$scroll_size": [`${component.properties.scroll_size_width ?? 8}px`, "100%"],
                                "$scrollbar_box_image_size": [`${component.properties.scrollbar_box_image_size_width ?? 8}px`, "100%"],
                                "$scroll_track_offset": component.properties.scroll_track_offset || [`${component.properties.scroll_size_width ?? 8}px`, 0],
                                "$show_background": component.properties.show_background !== false,
                                "$scroll_indent_image_texture": this.previewManager.convertTexturePath(component.properties.scroll_indent_image_texture || "textures/ui/ScrollRail"),
                                "$scrollbar_box_image_texture": this.previewManager.convertTexturePath(component.properties.scrollbar_box_image_texture || "textures/ui/ScrollHandle"),
                                "$scroll_background_image_texture": this.previewManager.convertTexturePath(component.properties.scroll_background_image_texture || "textures/ui/ScrollRail"),
                                "$background_size": [component.width, component.height],
                                "$background_offset": [0, 0],
                                "$scrolling_content|default": `${namespace}.${gridContentName}`
                            }
                        }
                    ]
                }
            };
        }

        if (component.type === 'progress_bar') {
            const index = Number(component.properties.collection_index);
            const controlName = `item${index}@${namespace}.progress_bar`;
            const control = {
                [controlName]: {
                    "collection_index": index,
                    "anchor_from": "top_left",
                    "anchor_to": "top_left",
                    "offset": [component.x + 1, component.y],
                    "controls": [
                        {
                            "default": {
                                "type": "image",
                                "texture": "textures/ui/progress_bar/progress_bar",
                                "layer": 2,
                                "size": ["100%", "100%"]
                            }
                        }
                    ]
                }
            };

            for (let i = 0; i <= 9; i++) {
                control[controlName].controls.push({
                    [`progress${i + 1}@image_template`]: {
                        "$texture": `textures/ui/progress_bar/progress_bar${i}`,
                        "$binding_text": i,
                        "layer": 3
                    }
                });
            }

            return control;
        }

        if (component.type === 'on_off_item') {
            const index = Number(component.properties.collection_index);
            return {
                [`item${index}@${namespace}.on_off_item`]: {
                    "collection_index": index,
                    "anchor_from": "top_left",
                    "anchor_to": "top_left",
                    "offset": [component.x + 1, component.y],
                    "controls": [
                        {
                            "default": {
                                "type": "image",
                                "texture": "textures/ui/on_off/on_off",
                                "layer": 2,
                                "size": ["100%", "100%"]
                            }
                        },
                        {
                            "on_off_active@image_template": {
                                "$texture": "textures/ui/on_off/on_off_active",
                                "$binding_text": 1,
                                "layer": 3
                            }
                        }
                    ]
                }
            };
        }

        if (component.type === 'pot') {
            const index = Number(component.properties.collection_index);
            return {
                [`item${index}@${namespace}.pot`]: {
                    "collection_index": index,
                    "anchor_from": "top_left",
                    "anchor_to": "top_left",
                    "offset": [component.x + 1, component.y],
                    "$texture": component.properties.texture
                }
            };
        }

        if (component.type === 'container_type') {
            const index = Number(component.properties.collection_index);
            const controlName = `item${index}@${namespace}.container_type`;
            const control = {
                [controlName]: {
                    "collection_index": index,
                    "anchor_from": "top_left",
                    "anchor_to": "top_left",
                    "offset": [component.x + 1, component.y],
                    ...this.getSlotTextureVariables(component, namespace),
                    "controls": []
                }
            };

            for (let i = 0; i <= 9; i++) {
                control[controlName].controls.push({
                    [`container_type${i}@image_template`]: {
                        "$texture": `textures/ui/container_type/container_type${i}`,
                        "$binding_text": i,
                        "layer": 8
                    }
                });
            }

            return control;
        }

        if (component.type === 'container_item_with_picture') {
            const index = Number(component.properties.collection_index);
            return {
                [`item${index}@${namespace}.container_item_with_picture`]: {
                    "collection_index": index,
                    "anchor_from": "top_left",
                    "anchor_to": "top_left",
                    "offset": [component.x + 1, component.y],
                    ...this.getSlotTextureVariables(component, namespace),
                    "$path_to_image": component.properties.picture
                }
            };
        }

        if (component.type === 'close_button') {
            return componentTypes.close_button.generateJSON(component);
        }

        const index = Number(component.properties.collection_index);
        const controlName = `item${index}@${namespace}.container_item`;
        const control = {
            [controlName]: {
                "collection_index": index,
                "anchor_from": "top_left",
                "anchor_to": "top_left",
                "offset": [component.x + 1, component.y],
                ...this.getSlotTextureVariables(component, namespace)
            }
        };

        if (component.width !== componentTypes[component.type].defaultWidth ||
            component.height !== componentTypes[component.type].defaultHeight) {
            control[controlName]["$cell_image_size"] = [component.width, component.height];
        }

        return control;
    },

    getTabToggleName: function (tab) {
        return `toggle${Number(tab.properties.toggle_index) || 1}`;
    },

    createTabsLayout: function (components, namespace, panelPrefix) {
        const tabs = components
            .filter(component => component.type === 'tab')
            .sort((a, b) => (Number(a.properties.toggle_index) || 0) - (Number(b.properties.toggle_index) || 0));

        if (!tabs.length) return null;

        const groupName = tabs[0].properties.toggle_group_name || 'custom_chest_tabs';
        const tabBarHeight = Math.max(...tabs.map(tab => Number(tab.height) || 16), 16);

        const toggleControls = tabs.map(tab => {
            const toggleName = this.getTabToggleName(tab);
            const tabWidth = Number(tab.width) || 16;
            const tabHeight = Number(tab.height) || 16;
            const label = tab.properties.show_label ? (tab.properties.label_text || '') : '';

            return {
                [`tab_${this.safeId(tab.id)}@${namespace}.tab_toggle`]: {
                    "$name": toggleName,
                    "$text": label,
                    "$index": Number(tab.properties.toggle_index) || 1,
                    "$toggle_name": groupName,
                    "$toggle_size": [tabWidth, tabHeight],
                    "$padding": [tabWidth, tabHeight],
                    "$default_texture": getExportTexturePath(tab.properties.default_texture || defaultTabTextures.default_texture),
                    "$hover_texture": getExportTexturePath(tab.properties.hover_texture || defaultTabTextures.hover_texture),
                    "$pressed_texture": getExportTexturePath(tab.properties.pressed_texture || defaultTabTextures.pressed_texture),
                    "$pressed_no_hover_texture": getExportTexturePath(tab.properties.hover_texture || defaultTabTextures.hover_texture),
                    "anchor_from": "top_left",
                    "anchor_to": "top_left",
                    "offset": [tab.x + 1, tab.y],
                    "layer": 20
                }
            };
        });

        const pageControls = tabs.map(tab => {
            const toggleName = this.getTabToggleName(tab);
            const pageChildren = components
                .filter(child => child.properties?.tab_parent_id === tab.id)
                .map(child => this.createNestedComponentControl(child, namespace, panelPrefix));

            return {
                [`page_${this.safeId(tab.id)}`]: {
                    "type": "panel",
                    "size": ["100%", "100%"],
                    "anchor_from": "top_left",
                    "anchor_to": "top_left",
                    "bindings": [
                        {
                            "binding_type": "view",
                            "source_control_name": toggleName,
                            "source_property_name": "#toggle_state",
                            "target_property_name": "#visible"
                        }
                    ],
                    "controls": [
                        {
                            [`page_content_${this.safeId(tab.id)}`]: {
                                "type": "collection_panel",
                                "size": ["100%", "100%"],
                                "anchor_from": "top_left",
                                "anchor_to": "top_left",
                                "$item_collection_name": "container_items",
                                "collection_name": "container_items",
                                "$dark_border_toggle_hover_color": [1.0, 1.0, 1.0],
                                "controls": pageChildren
                            }
                        }
                    ]
                }
            };
        });

        return {
            tabs_layout: {
                "type": "stack_panel",
                "orientation": "vertical",
                "size": ["100%", "100%"],
                "anchor_from": "top_left",
                "anchor_to": "top_left",
                "controls": [
                    {
                        "tab_bar": {
                            "type": "panel",
                            "size": ["100%", tabBarHeight],
                            "controls": toggleControls
                        }
                    },
                    {
                        "pages": {
                            "type": "stack_panel",
                            "size": ["100%", "fill"],
                            "controls": pageControls
                        }
                    }
                ]
            }
        };
    },

    safeId: function (value) {
        return String(value || '').replace(/[^a-zA-Z0-9_]+/g, '_');
    },

    getSlotTextureVariables: function (component, namespace) {
        const properties = component?.properties || {};

        return {
            "$background_images": `${namespace}.cell_image_panel`,
            "$highlight_control": `${namespace}.highlight_slot_panel`,
            "$cell_image_texture": getExportTexturePath(properties.slot_background_texture || defaultSlotTextures.background),
            "$cell_image_selected_texture": getExportTexturePath(properties.slot_selected_texture || defaultSlotTextures.selected),
            "$highlight_slot_texture": getExportTexturePath(properties.slot_highlight_texture || defaultSlotTextures.highlight)
        };
    },

    createDynamicGridDefinition: function (component = null, namespace = "custom_chest_ui") {
        const slotWidth = component ? Number(component.properties.slot_width) || 18 : 18;
        const slotHeight = component ? Number(component.properties.slot_height) || 18 : 18;
        
        const definition = {
            "anchor_from": "top_left",
            "anchor_to": "top_left",
            "layer": 3,
            "grid_item_template": component ? `${namespace}.${this.getCustomGridTemplateName(component)}` : "common.container_item",
            "collection_name": "container_items",
            "$item_collection_name": "container_items"
        };

        // Remove hardcoded size to let engine calculate natural item positions
        // Only set size if it's a custom slot size that needs different dimensions
        if (component && (slotWidth !== 18 || slotHeight !== 18)) {
            definition.size = [component.width, component.height];
        }

        return definition;
    },

    getCustomGridTemplateName: function(component) {
        const panelPrefix = typeof chestUiManager !== 'undefined' ? 
            chestUiManager.getActiveUi()?.panelPrefix || "custom" : "custom";
        return `${panelPrefix}_${this.safeId(component.id)}_grid_item`;
    },

    getMainPanelHeight: function (settings) {
        const DEFAULT_MAIN_PANEL_HEIGHT = 166;  // Default total chest panel height
        
        if (!settings || !settings.mainPanelHeight) {
            return DEFAULT_MAIN_PANEL_HEIGHT;
        }
        
        return settings.mainPanelHeight;
    },

    calculatePanelHeight: function (settings) {
        const DEFAULT_COLLECTION_PANEL_HEIGHT = 54;  // Default collection panel height
        
        if (!settings || !settings.mainPanelHeight) {
            return DEFAULT_COLLECTION_PANEL_HEIGHT;
        }
        
        // Calculate based on the actual component positions
        const components = this.currentComponents || [];
        let maxY = 0;
        
        // Find the maximum Y position + height from all components
        components.filter(component => {
            return typeof editor === 'undefined' || editor.isComponentVisibleInActiveTab(component);
        }).forEach(component => {
            const componentBottom = component.y + (component.height || 18);
            if (componentBottom > maxY) {
                maxY = componentBottom;
            }
        });
        
        // If there are components, use their maximum extent + some padding
        if (maxY > 0) {
            const calculatedHeight = Math.ceil(maxY + 2); // Add 2px padding
            return Math.max(DEFAULT_COLLECTION_PANEL_HEIGHT, calculatedHeight);
        }
        
        // Otherwise, calculate from settings
        const INVENTORY_HEIGHT = 92;
        const TOP_OFFSET = 12;
        const LABEL_PADDING = 8;
        const FIXED_OVERHEAD = INVENTORY_HEIGHT + TOP_OFFSET + LABEL_PADDING;
        
        const collectionPanelHeight = settings.mainPanelHeight - FIXED_OVERHEAD;
        
        return Math.max(DEFAULT_COLLECTION_PANEL_HEIGHT, collectionPanelHeight);
    },

    addComponentDefinitions: function (json, components) {
        const namespace = json.namespace || "custom_chest_ui";
        const usesCustomSlots = components.some(c => [
            'container_item',
            'container_item_with_picture',
            'container_type',
            'dynamic_grid'
        ].includes(c.type));

        if (usesCustomSlots) {
            json.cell_image = {
                "type": "image",
                "texture": "$cell_image_texture",
                "nineslice_size": 1
            };

            json.cell_image_selected = {
                "type": "image",
                "texture": "$cell_image_selected_texture",
                "nineslice_size": 1
            };

            json.cell_image_panel = {
                "type": "panel",
                "controls": [
                    {
                        [`cell_image@${namespace}.cell_image`]: {
                            "$cell_selected_binding_name|default": "#is_selected_slot",
                            "visible": true,
                            "bindings": [
                                {
                                    "binding_name": "(not $cell_selected_binding_name)",
                                    "binding_name_override": "#visible",
                                    "binding_type": "collection",
                                    "binding_collection_name": "$item_collection_name"
                                }
                            ]
                        }
                    },
                    {
                        [`cell_image_selected@${namespace}.cell_image_selected`]: {
                            "$cell_selected_binding_name|default": "#is_selected_slot",
                            "visible": false,
                            "bindings": [
                                {
                                    "binding_name": "$cell_selected_binding_name",
                                    "binding_name_override": "#visible",
                                    "binding_type": "collection",
                                    "binding_collection_name": "$item_collection_name"
                                }
                            ]
                        }
                    }
                ]
            };

            json.highlight_slot = {
                "type": "image",
                "texture": "$highlight_slot_texture",
                "size": ["100% - 2px", "100% - 2px"],
                "alpha": 0.8
            };

            json.highlight_slot_panel = {
                "type": "panel",
                "controls": [
                    {
                        [`highlight@${namespace}.highlight_slot`]: {
                            "controls": [
                                {
                                    "hover_text@common.hover_text": {
                                        "layer": 29,
                                        "$hover_text_binding_name|default": "#hover_text",
                                        "bindings": [
                                            {
                                                "binding_name": "$hover_text_binding_name",
                                                "binding_name_override": "#hover_text",
                                                "binding_type": "collection",
                                                "binding_collection_name": "$item_collection_name"
                                            }
                                        ]
                                    }
                                }
                            ],
                            "bindings": [
                                {
                                    "binding_name": "#show_persistent_bundle_hover_text",
                                    "binding_name_override": "#visible"
                                }
                            ]
                        }
                    },
                    {
                        "white_border@common.white_border_slot": {
                            "bindings": [
                                {
                                    "binding_name": "#show_persistent_bundle_hover_text",
                                    "binding_name_override": "#visible"
                                }
                            ]
                        }
                    }
                ]
            };

            json[`container_slot_button_prototype@common.container_slot_button_prototype`] = {
                "$highlight_control|default": `${namespace}.highlight_slot_panel`,
                "$highlight_slot_texture|default": defaultSlotTextures.highlight
            };
        }

        if (components.some(c => c.type === 'tab')) {
            json.tab_toggle = {
                "type": "panel",
                "$toggle_size|default": [16, 16],
                "$padding|default": [16, 16],
                "$name|default": "toggle1",
                "$text|default": "",
                "$index|default": 1,
                "$toggle_name|default": "custom_chest_tabs",
                "$default_texture|default": "textures/ui/button_borderless_light",
                "$hover_texture|default": "textures/ui/button_borderless_lightpressednohover",
                "$pressed_texture|default": "textures/ui/button_borderless_lighthover",
                "$pressed_no_hover_texture|default": "textures/ui/button_borderless_lightpressednohover",
                "size": "$padding",
                "controls": [
                    {
                        "custom_toggle@common_toggles.light_text_toggle": {
                            "$default_texture": "$default_texture",
                            "$hover_texture": "$hover_texture",
                            "$pressed_texture": "$pressed_texture",
                            "$pressed_no_hover_texture": "$pressed_no_hover_texture",
                            "$hover_checked_text_color": [0.8, 0.8, 0.8],
                            "$default_checked_text_color": [0.8, 0.8, 0.8],
                            "$hover_text_color": [0.7, 0.7, 0.7],
                            "$default_text_color": [0.6, 0.6, 0.6],
                            "$default_border_visible": false,
                            "$hover_border_visible": false,
                            "$toggle_name": "$toggle_name",
                            "$button_text": "$text",
                            "size": "$toggle_size",
                            "$toggle_view_binding_name": "$name",
                            "$radio_toggle_group": true,
                            "$toggle_group_default_selected": 1,
                            "$toggle_group_forced_index": "$index",
                            "anchor_from": "center",
                            "anchor_to": "center"
                        }
                    }
                ]
            };
        }

        if (components.some(c => c.type === 'container_item')) {
            json.container_item = {
                "type": "input_panel",
                "size": [18, 18],
                "layer": 1,
                "$cell_image_size|default": [18, 18],
                "$cell_overlay_ref|default": "common.cell_overlay",
                "$button_ref|default": `${namespace}.container_slot_button_prototype`,
                "$stack_count_required|default": true,
                "$durability_bar_required|default": true,
                "$storage_bar_required|default": true,
                "$item_renderer|default": "common.item_renderer",
                "$item_renderer_panel_size|default": [18, 18],
                "$item_renderer_size|default": [16, 16],
                "$item_renderer_offset|default": [0, 0],
                "$background_images|default": `${namespace}.cell_image_panel`,
                "$highlight_control|default": `${namespace}.highlight_slot_panel`,
                "$background_image_control_name|default": "bg",
                "$cell_image_texture|default": defaultSlotTextures.background,
                "$cell_image_selected_texture|default": defaultSlotTextures.selected,
                "$highlight_slot_texture|default": defaultSlotTextures.highlight,

                "$focus_id|default": "",
                "$focus_override_down|default": "",
                "$focus_override_up|default": "",
                "$focus_override_left|default": "",
                "$focus_override_right|default": "",
                "focus_identifier": "$focus_id",
                "focus_change_down": "$focus_override_down",
                "focus_change_up": "$focus_override_up",
                "focus_change_left": "$focus_override_left",
                "focus_change_right": "$focus_override_right",
                "focus_enabled": true,
                "focus_wrap_enabled": false,
                "focus_magnet_enabled": true,

                "controls": [
                    {
                        "item_cell": {
                            "type": "panel",
                            "size": "$cell_image_size",
                            "layer": 0,
                            "controls": [
                                {
                                    "$background_image_control_name@$background_images": {
                                        "layer": 1
                                    }
                                },
                                {
                                    "item": {
                                        "type": "panel",
                                        "size": "$item_renderer_panel_size",
                                        "layer": 0,
                                        "controls": [
                                            {
                                                "stack_count_label@common.stack_count_label": {
                                                    "layer": 27
                                                }
                                            },
                                            {
                                                "$item_renderer@$item_renderer": {
                                                    "size": "$item_renderer_size",
                                                    "offset": "$item_renderer_offset",
                                                    "anchor_to": "center",
                                                    "anchor_from": "center",
                                                    "layer": 7
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    "durability_bar@common.durability_bar": {
                                        "layer": 20
                                    }
                                },
                                {
                                    "storage_bar@common.storage_bar": {
                                        "layer": 20
                                    }
                                }
                            ]
                        }
                    },
                    {
                        "item_cell_overlay_ref@$cell_overlay_ref": {
                            "layer": 3
                        }
                    },
                    {
                        "item_selected_image@common.slot_selected": {
                            "layer": 4
                        }
                    },
                    {
                        "item_button_ref@$button_ref": {
                            "tts_ignore_count": true,
                            "tts_skip_message": true,
                            "tts_inherit_siblings": true,
                            "$highlight_control": `${namespace}.highlight_slot_panel`,
                            "$highlight_slot_texture": "$highlight_slot_texture",
                            "layer": 5
                        }
                    },
                    {
                        "container_item_lock_overlay@common.container_item_lock_overlay": {
                            "size": "$item_renderer_size",
                            "offset": [1, 1],
                            "anchor_to": "top_left",
                            "anchor_from": "top_left",
                            "layer": 6
                        }
                    },
                    {
                        "item_lock_cell_image@common.item_lock_cell_image": {
                            "layer": 2
                        }
                    }
                ]
            };
        }

        // Add custom grid item definitions so dynamic grids can use per-grid slot textures.
        components
            .filter(c => c.type === 'dynamic_grid')
            .forEach(component => {
                const slotWidth = Number(component.properties.slot_width) || 18;
                const slotHeight = Number(component.properties.slot_height) || 18;
                const templateName = this.getCustomGridTemplateName(component);
                const namespace = json.namespace || "custom_chest_ui";

                json[templateName] = {
                    "type": "input_panel",
                    "size": [slotWidth, slotHeight],
                    "layer": 1,
                    "$cell_image_size|default": [slotWidth, slotHeight],
                    "$cell_overlay_ref|default": "common.cell_overlay",
                    "$button_ref|default": `${namespace}.container_slot_button_prototype`,
                    "$stack_count_required|default": true,
                    "$durability_bar_required|default": true,
                    "$storage_bar_required|default": true,
                    "$item_renderer|default": "common.item_renderer",
                    "$item_renderer_panel_size|default": [slotWidth, slotHeight],
                    "$item_renderer_size|default": [Math.max(1, slotWidth - 2), Math.max(1, slotHeight - 2)],
                    "$item_renderer_offset|default": [0, 0],
                    "$background_images|default": `${namespace}.cell_image_panel`,
                    "$highlight_control|default": `${namespace}.highlight_slot_panel`,
                    "$background_image_control_name|default": "bg",
                    "$cell_image_texture|default": getExportTexturePath(component.properties.slot_background_texture || defaultSlotTextures.background),
                    "$cell_image_selected_texture|default": getExportTexturePath(component.properties.slot_selected_texture || defaultSlotTextures.selected),
                    "$highlight_slot_texture|default": getExportTexturePath(component.properties.slot_highlight_texture || defaultSlotTextures.highlight),

                    "$focus_id|default": "",
                    "$focus_override_down|default": "",
                    "$focus_override_up|default": "",
                    "$focus_override_left|default": "",
                    "$focus_override_right|default": "",
                    "focus_identifier": "$focus_id",
                    "focus_change_down": "$focus_override_down",
                    "focus_change_up": "$focus_override_up",
                    "focus_change_left": "$focus_override_left",
                    "focus_change_right": "$focus_override_right",
                    "focus_enabled": true,
                    "focus_wrap_enabled": false,
                    "focus_magnet_enabled": true,

                    "controls": [
                            {
                                "item_cell": {
                                    "type": "panel",
                                    "size": "$cell_image_size",
                                    "layer": 0,
                                    "controls": [
                                        {
                                            "$background_image_control_name@$background_images": {
                                                "layer": 1
                                            }
                                        },
                                        {
                                            "item": {
                                                "type": "panel",
                                                "size": "$item_renderer_panel_size",
                                                "layer": 0,
                                                "controls": [
                                                    {
                                                        "stack_count_label@common.stack_count_label": {
                                                            "layer": 27
                                                        }
                                                    },
                                                    {
                                                        "$item_renderer@$item_renderer": {
                                                            "size": "$item_renderer_size",
                                                            "offset": "$item_renderer_offset",
                                                            "anchor_to": "center",
                                                            "anchor_from": "center",
                                                            "layer": 7
                                                        }
                                                    }
                                                ]
                                            }
                                        },
                                        {
                                            "durability_bar@common.durability_bar": {
                                                "layer": 20
                                            }
                                        },
                                        {
                                            "storage_bar@common.storage_bar": {
                                                "layer": 20
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                "item_cell_overlay_ref@$cell_overlay_ref": {
                                    "layer": 3
                                }
                            },
                            {
                                "item_selected_image@common.slot_selected": {
                                    "layer": 4
                                }
                            },
                            {
                                "item_button_ref@$button_ref": {
                                    "tts_ignore_count": true,
                                    "tts_skip_message": true,
                                    "tts_inherit_siblings": true,
                                    "$highlight_control": `${namespace}.highlight_slot_panel`,
                                    "$highlight_slot_texture": "$highlight_slot_texture",
                                    "layer": 5
                                }
                            },
                            {
                                "container_item_lock_overlay@common.container_item_lock_overlay": {
                                    "size": "$item_renderer_size",
                                    "offset": [1, 1],
                                    "anchor_to": "top_left",
                                    "anchor_from": "top_left",
                                    "layer": 6
                                }
                            },
                            {
                                "item_lock_cell_image@common.item_lock_cell_image": {
                                    "layer": 2
                                }
                            }
                    ]
                };
            });

        if (components.some(c => c.type === 'container_item_with_picture')) {
            json.container_item_with_picture = {
                "type": "input_panel",
                "size": [18, 18],
                "layer": 1,
                "$path_to_image|default": "",
                "$cell_image_size|default": [18, 18],
                "$cell_overlay_ref|default": "common.cell_overlay",
                "$button_ref|default": `${namespace}.container_slot_button_prototype`,
                "$stack_count_required|default": true,
                "$durability_bar_required|default": true,
                "$storage_bar_required|default": true,
                "$item_renderer|default": "common.item_renderer",
                "$item_renderer_panel_size|default": [18, 18],
                "$item_renderer_size|default": [16, 16],
                "$item_renderer_offset|default": [0, 0],
                "$background_images|default": `${namespace}.cell_image_panel`,
                "$highlight_control|default": `${namespace}.highlight_slot_panel`,
                "$background_image_control_name|default": "bg",
                "$cell_image_texture|default": defaultSlotTextures.background,
                "$cell_image_selected_texture|default": defaultSlotTextures.selected,
                "$highlight_slot_texture|default": defaultSlotTextures.highlight,

                "$focus_id|default": "",
                "$focus_override_down|default": "",
                "$focus_override_up|default": "",
                "$focus_override_left|default": "",
                "$focus_override_right|default": "",
                "focus_identifier": "$focus_id",
                "focus_change_down": "$focus_override_down",
                "focus_change_up": "$focus_override_up",
                "focus_change_left": "$focus_override_left",
                "focus_change_right": "$focus_override_right",
                "focus_enabled": true,
                "focus_wrap_enabled": false,
                "focus_magnet_enabled": true,

                "controls": [
                    {
                        "item_cell": {
                            "type": "panel",
                            "size": "$cell_image_size",
                            "layer": 0,
                            "controls": [
                                {
                                    "$background_image_control_name@$background_images": {
                                        "layer": 1
                                    }
                                },
                                {
                                    "item": {
                                        "type": "panel",
                                        "size": "$item_renderer_panel_size",
                                        "layer": 0,
                                        "controls": [
                                            {
                                                "stack_count_label@common.stack_count_label": {
                                                    "layer": 27
                                                }
                                            },
                                            {
                                                "pic": {
                                                    "type": "image",
                                                    "texture": "$path_to_image",
                                                    "layer": 6,
                                                    "anchor_from": "center",
                                                    "anchor_to": "center",
                                                    "size": [16, 16]
                                                }
                                            },
                                            {
                                                "$item_renderer@$item_renderer": {
                                                    "size": "$item_renderer_size",
                                                    "offset": "$item_renderer_offset",
                                                    "anchor_to": "center",
                                                    "anchor_from": "center",
                                                    "layer": 7
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    "durability_bar@common.durability_bar": {
                                        "layer": 20
                                    }
                                },
                                {
                                    "storage_bar@common.storage_bar": {
                                        "layer": 20
                                    }
                                }
                            ]
                        }
                    },
                    {
                        "item_cell_overlay_ref@$cell_overlay_ref": {
                            "layer": 3
                        }
                    },
                    {
                        "item_selected_image@common.slot_selected": {
                            "layer": 4
                        }
                    },
                    {
                        "item_button_ref@$button_ref": {
                            "tts_ignore_count": true,
                            "tts_skip_message": true,
                            "tts_inherit_siblings": true,
                            "$highlight_control": `${namespace}.highlight_slot_panel`,
                            "$highlight_slot_texture": "$highlight_slot_texture",
                            "layer": 5
                        }
                    }
                ]
            };
        }

        if (components.some(c => c.type === 'progress_bar')) {
            json.progress_bar = {
                "type": "input_panel",
                "size": [22, 15],
                "layer": 1,
                "$cell_image_size|default": [22, 15],
                "$cell_overlay_ref|default": "common.cell_overlay",
                "$button_ref|default": `${namespace}.container_slot_button_prototype`,
                "$stack_count_required|default": false,
                "$durability_bar_required|default": false,
                "$storage_bar_required|default": false,
                "$item_renderer|default": "common.item_renderer",
                "$item_renderer_panel_size|default": [22, 15],
                "$item_renderer_size|default": [22, 15],
                "$item_renderer_offset|default": [0, 0],

                "controls": [
                    {
                        "item_cell": {
                            "type": "panel",
                            "size": "$cell_image_size",
                            "layer": 0,
                            "controls": [
                                {
                                    "item": {
                                        "type": "panel",
                                        "size": "$item_renderer_panel_size",
                                        "layer": 0,
                                        "controls": [
                                            {
                                                "$item_renderer@$item_renderer": {
                                                    "size": "$item_renderer_size",
                                                    "offset": "$item_renderer_offset",
                                                    "anchor_to": "center",
                                                    "anchor_from": "center",
                                                    "layer": 7
                                                }
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                ]
            };
        }

        if (components.some(c => c.type === 'on_off_item')) {
            json.on_off_item = {
                "type": "input_panel",
                "size": [16, 14],
                "layer": 1,
                "$cell_image_size|default": [16, 14],
                "$cell_overlay_ref|default": "common.cell_overlay",
                "$button_ref|default": `${namespace}.container_slot_button_prototype`,
                "$stack_count_required|default": false,
                "$durability_bar_required|default": false,
                "$storage_bar_required|default": false,
                "$item_renderer|default": "common.item_renderer",
                "$item_renderer_panel_size|default": [16, 14],
                "$item_renderer_size|default": [16, 14],
                "$item_renderer_offset|default": [0, 0],

                "controls": [
                    {
                        "item_cell": {
                            "type": "panel",
                            "size": "$cell_image_size",
                            "layer": 0,
                            "controls": [
                                {
                                    "item": {
                                        "type": "panel",
                                        "size": "$item_renderer_panel_size",
                                        "layer": 0,
                                        "controls": [
                                            {
                                                "$item_renderer@$item_renderer": {
                                                    "size": "$item_renderer_size",
                                                    "offset": "$item_renderer_offset",
                                                    "anchor_to": "center",
                                                    "anchor_from": "center",
                                                    "layer": 7
                                                }
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                ]
            };
        }

        if (components.some(c => c.type === 'pot')) {
            json.pot = {
                "type": "input_panel",
                "size": [26, 30],
                "layer": 1,
                "$cell_image_size|default": [26, 30],
                "$cell_overlay_ref|default": "common.cell_overlay",
                "$button_ref|default": "common.container_slot_button_prototype",
                "$stack_count_required|default": true,
                "$durability_bar_required|default": false,
                "$storage_bar_required|default": false,
                "$item_renderer|default": "common.item_renderer",
                "$item_renderer_panel_size|default": [26, 30],
                "$item_renderer_size|default": [16, 16],
                "$item_renderer_offset|default": [0, 3],

                "controls": [
                    {
                        "default": {
                            "type": "image",
                            "texture": "$texture", "layer": 0,
                            "size": ["100%", "100%"]
                        }
                    },
                    {
                        "item_cell": {
                            "type": "panel",
                            "size": "$cell_image_size",
                            "layer": 0,
                            "controls": [
                                {
                                    "item": {
                                        "type": "panel",
                                        "size": "$item_renderer_panel_size",
                                        "layer": 1,
                                        "controls": [
                                            {
                                                "stack_count_label@common.stack_count_label": {
                                                    "layer": 27,
                                                    "offset": [-3, -3]
                                                }
                                            },
                                            {
                                                "$item_renderer@$item_renderer": {
                                                    "size": "$item_renderer_size",
                                                    "offset": "$item_renderer_offset",
                                                    "anchor_to": "center",
                                                    "anchor_from": "center",
                                                    "layer": 7
                                                }
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    },
                    {
                        "item_cell_overlay_ref@$cell_overlay_ref": {
                            "layer": 3
                        }
                    },
                    {
                        "item_selected_image@common.slot_selected": {
                            "layer": 4
                        }
                    }
                ]
            };
        }

        if (components.some(c => c.type === 'container_type')) {
            json.container_type = {
                "type": "input_panel",
                "size": [18, 18],
                "layer": 1,
                "$cell_image_size|default": [18, 18],
                "$cell_overlay_ref|default": "common.cell_overlay",
                "$button_ref|default": "common.container_slot_button_prototype",
                "$stack_count_required|default": true,
                "$durability_bar_required|default": true,
                "$storage_bar_required|default": true,
                "$item_renderer|default": "common.item_renderer",
                "$item_renderer_panel_size|default": [18, 18],
                "$item_renderer_size|default": [16, 16],
                "$item_renderer_offset|default": [0, 0],
                "$background_images|default": `${namespace}.cell_image_panel`,
                "$highlight_control|default": `${namespace}.highlight_slot_panel`,
                "$background_image_control_name|default": "bg",
                "$cell_image_texture|default": defaultSlotTextures.background,
                "$cell_image_selected_texture|default": defaultSlotTextures.selected,
                "$highlight_slot_texture|default": defaultSlotTextures.highlight,

                "$focus_id|default": "",
                "$focus_override_down|default": "",
                "$focus_override_up|default": "",
                "$focus_override_left|default": "",
                "$focus_override_right|default": "",
                "focus_identifier": "$focus_id",
                "focus_change_down": "$focus_override_down",
                "focus_change_up": "$focus_override_up",
                "focus_change_left": "$focus_override_left",
                "focus_change_right": "$focus_override_right",
                "focus_enabled": true,
                "focus_wrap_enabled": false,
                "focus_magnet_enabled": true,

                "controls": [
                    {
                        "item_cell": {
                            "type": "panel",
                            "size": "$cell_image_size",
                            "layer": 0,
                            "controls": [
                                {
                                    "$background_image_control_name@$background_images": {
                                        "layer": 1
                                    }
                                },
                                {
                                    "container_type0@image_template": {
                                        "$texture": "textures/ui/container_type/container_type0",
                                        "$binding_text": 0,
                                        "layer": 8
                                    }
                                },
                                {
                                    "container_type1@image_template": {
                                        "$texture": "textures/ui/container_type/container_type1",
                                        "$binding_text": 1,
                                        "layer": 8
                                    }
                                },
                                {
                                    "container_type2@image_template": {
                                        "$texture": "textures/ui/container_type/container_type2",
                                        "$binding_text": 2,
                                        "layer": 8
                                    }
                                },
                                {
                                    "container_type3@image_template": {
                                        "$texture": "textures/ui/container_type/container_type3",
                                        "$binding_text": 3,
                                        "layer": 8
                                    }
                                },
                                {
                                    "container_type4@image_template": {
                                        "$texture": "textures/ui/container_type/container_type4",
                                        "$binding_text": 4,
                                        "layer": 8
                                    }
                                },
                                {
                                    "container_type5@image_template": {
                                        "$texture": "textures/ui/container_type/container_type5",
                                        "$binding_text": 5,
                                        "layer": 8
                                    }
                                },
                                {
                                    "container_type6@image_template": {
                                        "$texture": "textures/ui/container_type/container_type6",
                                        "$binding_text": 6,
                                        "layer": 8
                                    }
                                },
                                {
                                    "container_type7@image_template": {
                                        "$texture": "textures/ui/container_type/container_type7",
                                        "$binding_text": 7,
                                        "layer": 8
                                    }
                                },
                                {
                                    "container_type8@image_template": {
                                        "$texture": "textures/ui/container_type/container_type8",
                                        "$binding_text": 8,
                                        "layer": 8
                                    }
                                },
                                {
                                    "container_type9@image_template": {
                                        "$texture": "textures/ui/container_type/container_type9",
                                        "$binding_text": 9,
                                        "layer": 8
                                    }
                                }
                            ]
                        }
                    },
                    {
                        "item_cell_overlay_ref@$cell_overlay_ref": {
                            "layer": 3
                        }
                    },
                    {
                        "item_selected_image@common.slot_selected": {
                            "layer": 4
                        }
                    },
                    {
                        "item_button_ref@$button_ref": {
                            "tts_inherit_siblings": true,
                            "$highlight_control": `${namespace}.highlight_slot_panel`,
                            "$highlight_slot_texture": "$highlight_slot_texture",
                            "layer": 5
                        }
                    }
                ]
            };
        }

        if (components.some(c => c.type === 'button')) {
            json["drop_button@common.button"] = {
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
            };
        }

        // Always include dialog_background component
        json.dialog_background = {
            "type": "image",
            "$dialog_background_texture|default": "textures/ui/dialog_background_opaque",
            "texture": "$dialog_background_texture",
            "layer": 1
        };
    },

    
    setupZoom: function () {
        const zoomControls = document.createElement('div');
        zoomControls.className = 'zoom-controls';
        zoomControls.innerHTML = `
            <button id="preview-zoom-out" class="zoom-btn" title="Zoom Out"><i class="fas fa-search-minus"></i></button>
            <span id="preview-zoom-level" class="zoom-level">100%</span>
            <button id="preview-zoom-in" class="zoom-btn" title="Zoom In"><i class="fas fa-search-plus"></i></button>
            <button id="preview-zoom-reset" class="zoom-btn" title="Reset Zoom"><i class="fas fa-sync-alt"></i></button>
        `;

        const controlsContainer = document.querySelector('.preview-area .panel-header .preview-controls-container');
        if (controlsContainer) {
            const foldButton = controlsContainer.querySelector('.fold-button');
            if (foldButton) {
                controlsContainer.insertBefore(zoomControls, foldButton);
            } else {
                controlsContainer.appendChild(zoomControls);
            }
        } else {
            const headerControls = document.querySelector('.preview-area .panel-header');
            if (headerControls) {
                headerControls.appendChild(zoomControls);
            }
        }

        document.getElementById('preview-zoom-in').addEventListener('click', () => this.adjustZoom(0.1));
        document.getElementById('preview-zoom-out').addEventListener('click', () => this.adjustZoom(-0.1));
        document.getElementById('preview-zoom-reset').addEventListener('click', () => this.setZoom(1));

        this.previewCanvas.addEventListener('wheel', e => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                this.adjustZoom(delta);
            }
        });
    },

    setZoom: function (level) {
        this.zoomLevel = level;
        this.applyZoom();
        this.updateZoomDisplay();
    },

    adjustZoom: function (delta) {
        const newZoom = Math.max(0.25, Math.min(3, this.zoomLevel + delta));
        this.setZoom(newZoom);
    },

    applyZoom: function () {
        const chestPanelContainer = this.previewCanvas.querySelector('.chest-panel-background');
        const chestPanel = this.previewCanvas.querySelector('.chest-panel');

        if (chestPanel) {
            if (chestPanelContainer) {
                chestPanelContainer.style.transform = '';
            }

            chestPanel.style.transform = `scale(${this.zoomLevel})`;
            chestPanel.style.transformOrigin = 'top center';

            this.previewCanvas.style.padding = this.zoomLevel > 1 ?
                `${20 * this.zoomLevel}px` : '20px';
        }
    },

    updateZoomDisplay: function () {
        const display = document.getElementById('preview-zoom-level');
        if (display) {
            display.textContent = `${Math.round(this.zoomLevel * 100)}%`;
        }
    }
};

