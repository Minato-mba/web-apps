const preview = {
    zoomLevel: 1,

    init: function () {
        this.previewContainer = document.getElementById('preview-component-container');
        this.previewCanvas = document.getElementById('preview-canvas');
        this.setupZoom();
    },

    updatePreview: function (components) {
        this.previewContainer.innerHTML = '';

        components.forEach(component => {
            const componentType = componentTypes[component.type];
            if (!componentType) return;

            const previewHtml = componentType.renderPreview(component);
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = previewHtml;

            const previewElement = tempDiv.firstElementChild;
            this.previewContainer.appendChild(previewElement);
        });
    },

    updateComponent: function (component) {
        const componentType = componentTypes[component.type];
        if (!componentType) return;

        const currentComponents = editor.getComponents();
        this.updatePreview(currentComponents);
    },

    generateJSON: function () {
        const components = editor.getComponents(); const controls = [];

        components.forEach(component => {
            const componentType = componentTypes[component.type];
            if (!componentType) return;

            if (component.type === 'label') {
                controls.push({
                    "name": {
                        "type": "label",
                        "text": component.properties.text,
                        "color": component.properties.color,
                        "anchor_from": "top_left",
                        "anchor_to": "top_left",
                        "offset": [component.x, component.y]
                    }
                });
            }
            else if (component.type === 'image') {
                const imageId = `image_${controls.length}`;
                controls.push({
                    [imageId]: {
                        "type": "image",
                        "texture": component.properties.texture,
                        "layer": 2,
                        "alpha": component.properties.alpha,
                        "anchor_from": "top_left",
                        "anchor_to": "top_left",
                        "offset": [component.x, component.y],
                        "size": [component.width, component.height]
                    }
                });
            }
            else if (component.type === 'progress_bar') {
                
                const index = Number(component.properties.collection_index);
                const controlName = `item${index}@chest.progress_bar`;

                const progressControl = {
                    [controlName]: {
                        "collection_index": index,
                        "anchor_from": "top_left",
                        "anchor_to": "top_left",
                        "offset": [component.x, component.y],
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
                const controlName = `item${index}@chest.on_off_item`;

                controls.push({
                    [controlName]: {
                        "collection_index": index,
                        "anchor_from": "top_left",
                        "anchor_to": "top_left",
                        "offset": [component.x, component.y],
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
                const controlName = `item${index}@chest.pot`;

                controls.push({
                    [controlName]: {
                        "collection_index": index,
                        "anchor_from": "top_left",
                        "anchor_to": "top_left",
                        "offset": [component.x, component.y],
                        "$texture": component.properties.texture
                    }
                });
            }
            else if (component.type === 'container_type') {
                
                const index = Number(component.properties.collection_index);
                const controlName = `item${index}@chest.container_type`;

                const containerControl = {
                    [controlName]: {
                        "collection_index": index,
                        "anchor_from": "top_left",
                        "anchor_to": "top_left",
                        "offset": [component.x, component.y],
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
                const controlName = `item${index}@chest.container_item_with_picture`;

                controls.push({
                    [controlName]: {
                        "collection_index": index,
                        "anchor_from": "top_left",
                        "anchor_to": "top_left",
                        "offset": [component.x, component.y],
                        "$path_to_image": component.properties.picture
                    }
                });
            }
            else {
                
                const index = Number(component.properties.collection_index);
                const controlName = `item${index}@chest.container_item`;

                const control = {
                    [controlName]: {
                        "collection_index": index,
                        "anchor_from": "top_left",
                        "anchor_to": "top_left",
                        "offset": [component.x, component.y]
                    }
                };

                if (component.width !== componentTypes[component.type].defaultWidth ||
                    component.height !== componentTypes[component.type].defaultHeight) {
                    control[controlName]["$cell_image_size"] = [component.width, component.height];
                }

                controls.push(control);
            }
        });

        const json = {
            "namespace": "chest",

            "small_chest_screen@common.inventory_screen_common": {
                "$close_on_player_hurt|default": true,
                "$use_custom_pocket_toast|default": false,
                "close_on_player_hurt": "$close_on_player_hurt",
                "$text": "$container_title",
                "variables": [
                    {
                        "requires": "($desktop_screen and (not ($text = '§t§e§s§t§r')))",
                        "$screen_content": "chest.small_chest_panel",
                        "$screen_bg_content": "common.screen_background",
                        "$screen_background_alpha": 0.4
                    },
                    {
                        "requires": "($pocket_screen and (not ($text = '§t§e§s§t§r')))",
                        "$use_custom_pocket_toast": true,
                        "$screen_content": "pocket_containers.small_chest_panel"
                    },
                    {
                        "requires": "($text = '§t§e§s§t§r')",
                        "$screen_content": "chest.custom"
                    }
                ]
            },

            "custom": {
                "type": "panel",
                "controls": [
                    {
                        "root_panel@common.root_panel": {
                            "layer": 1,
                            "controls": [
                                { "common_panel@common.common_panel": {} },
                                {
                                    "chest_panel": {
                                        "type": "panel",
                                        "layer": 5,
                                        "controls": [
                                            {
                                                "small_chest_custom_panel_top_half@chest.small_chest_custom_panel_top_half": {}
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

            "small_chest_custom_panel_top_half": {
                "type": "panel",
                "size": ["100%", "50%"],
                "offset": [0, 12],
                "anchor_to": "top_left",
                "anchor_from": "top_left",
                "controls": [
                    { "chest_label@chest.chest_label": {} },
                    { "small_chest_custom_panel@chest.small_chest_custom_panel": {} }
                ]
            },

            "small_chest_custom_panel": {
                "type": "collection_panel",
                "size": [162, 54],
                "anchor_from": "top_left",
                "anchor_to": "top_left",
                "$item_collection_name": "container_items",
                "collection_name": "container_items",
                "$dark_border_toggle_hover_color": [1.0, 1.0, 1.0],
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

        this.addComponentDefinitions(json, components);

        return json;
    },

    addComponentDefinitions: function (json, components) {
        if (components.some(c => c.type === 'container_item')) {
            json.container_item = {
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
                "$background_images|default": "common.cell_image_panel",
                "$background_image_control_name|default": "bg",

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

        if (components.some(c => c.type === 'container_item_with_picture')) {
            json.container_item_with_picture = {
                "type": "input_panel",
                "size": [18, 18],
                "layer": 1,
                "$path_to_image|default": "",
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
                "$background_images|default": "common.cell_image_panel",
                "$background_image_control_name|default": "bg",

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
                "$button_ref|default": "common.container_slot_button_prototype",
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
                "$button_ref|default": "common.container_slot_button_prototype",
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
                "$background_images|default": "common.cell_image_panel",
                "$background_image_control_name|default": "bg",

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
                            "layer": 5
                        }
                    }
                ]
            };
        }
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
