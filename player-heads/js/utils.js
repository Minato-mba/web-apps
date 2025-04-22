const Utils = {
    stringToHex: function (str) {
        let hex = '';
        for (let i = 0; i < str.length; i++) {
            hex += str.charCodeAt(i).toString(16);
        }
        return hex;
    },

    generateUUID: function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    extractFaceLayer: function (image, x, y) {
        const canvas = document.createElement('canvas');
        canvas.width = 8;
        canvas.height = 8;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, x, y, 8, 8, 0, 0, 8, 8);
        return canvas;
    },

    extractBase64FromDataUrl: function (dataUrl) {
        if (typeof dataUrl !== 'string') {
            return dataUrl;
        }

        const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
            return matches[2];
        }

        return dataUrl;
    },

    createHeadPreview: async function (skinImage, canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 16;
        tempCanvas.height = 16;
        const tempCtx = tempCanvas.getContext('2d');

        const skinSize = {
            width: skinImage.width,
            height: skinImage.height
        };

        let normalizedSkin = skinImage;
        if (skinSize.width === 128 && (skinSize.height === 128 || skinSize.height === 64)) {
            const normCanvas = document.createElement('canvas');
            normCanvas.width = 64;
            normCanvas.height = 64;
            const normCtx = normCanvas.getContext('2d');
            normCtx.drawImage(skinImage, 0, 0, 64, 64);
            normalizedSkin = normCanvas;
        }

        tempCtx.clearRect(0, 0, 16, 16);

        tempCtx.fillStyle = 'black';
        tempCtx.fillRect(3, 3, 10, 10);

        const faceLayer = this.extractFaceLayer(normalizedSkin, 8, 8);
        const overlayLayer = this.extractFaceLayer(normalizedSkin, 40, 8);

        tempCtx.drawImage(faceLayer, 4, 4);
        tempCtx.drawImage(overlayLayer, 4, 4);

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);

        return canvas;
    },

    createItemTexture: async function (skinImage) {
        const skinSize = {
            width: skinImage.width,
            height: skinImage.height
        };

        const outputSize = skinSize.width === 128 ? 32 : 16;

        const canvas = document.createElement('canvas');
        canvas.width = outputSize;
        canvas.height = outputSize;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        ctx.clearRect(0, 0, outputSize, outputSize);

        ctx.fillStyle = 'black';

        const padding = outputSize === 32 ? 6 : 3;
        const innerSize = outputSize - (padding * 2);
        ctx.fillRect(padding, padding, innerSize, innerSize);

        let faceX = 8, faceY = 8, overlayX = 40, overlayY = 8;

        if (skinSize.width === 128) {
            faceX = 16;
            faceY = 16;
            overlayX = 80;
            overlayY = 16;
        }

        const faceCanvas = document.createElement('canvas');
        const faceSize = outputSize === 32 ? 16 : 8;
        faceCanvas.width = faceSize;
        faceCanvas.height = faceSize;
        const faceCtx = faceCanvas.getContext('2d');
        faceCtx.imageSmoothingEnabled = false;

        const overlayCanvas = document.createElement('canvas');
        overlayCanvas.width = faceSize;
        overlayCanvas.height = faceSize;
        const overlayCtx = overlayCanvas.getContext('2d');
        overlayCtx.imageSmoothingEnabled = false;

        let scale = skinSize.width === 128 ? 2 : 1;
        faceCtx.drawImage(skinImage, faceX, faceY, 8 * scale, 8 * scale, 0, 0, faceSize, faceSize);
        overlayCtx.drawImage(skinImage, overlayX, overlayY, 8 * scale, 8 * scale, 0, 0, faceSize, faceSize);

        const facePosition = outputSize === 32 ? 8 : 4;
        ctx.drawImage(faceCanvas, facePosition, facePosition);
        ctx.drawImage(overlayCanvas, facePosition, facePosition);

        return new Promise(resolve => {
            canvas.toBlob(blob => {
                resolve(blob);
            }, 'image/png');
        });
    },

    createBlockTexture: async function (skinImage) {
        const canvas = document.createElement('canvas');
        const skinSize = {
            width: skinImage.width,
            height: skinImage.height
        };

        canvas.width = skinSize.width === 128 ? 128 : 64;
        canvas.height = skinSize.width === 128 ? 32 : 16;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(skinImage, 0, 0);

        return new Promise(resolve => {
            canvas.toBlob(blob => {
                resolve(blob);
            }, 'image/png');
        });
    },

    createPackIcon: async function (color = null, iconIndex = null) {
        if (!color) {
            color = this.getRandomColor();
        }

        const canvas = document.createElement('canvas');
        canvas.width = 225;
        canvas.height = 225;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (iconIndex === null) {
            iconIndex = Math.random() <= 0.01 ? 8 : Math.floor(Math.random() * 8);
        }

        try {
            const iconUrl = `../assets/images/pack_icon${iconIndex}.png`;
            const iconImage = await this.loadImage(iconUrl);
            ctx.drawImage(iconImage, 0, 0, 225, 225);
        } catch (error) {
            console.error('Failed to load pack icon:', error);

            ctx.fillStyle = '#ffffff';
            ctx.font = '48px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Head', canvas.width / 2, canvas.height / 2);
        }

        return new Promise(resolve => {
            canvas.toBlob(blob => {
                resolve(blob);
            }, 'image/png');
        });
    },

    getRandomColor: function () {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    },

    loadImage: function (url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
            img.src = url;
        });
    },

    loadImageFromFile: function (file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function (e) {
                const img = new Image();
                img.onload = function () {
                    resolve(img);
                };
                img.onerror = function () {
                    reject(new Error('Failed to load image'));
                };
                img.src = e.target.result;
            };
            reader.onerror = function () {
                reject(new Error('Failed to read file'));
            };
            reader.readAsDataURL(file);
        });
    },

    validateSkinFile: async function (file) {

        if (file.type !== 'image/png') {
            return {
                valid: false,
                message: 'Skin must be a PNG image',
                image: null
            };
        }

        try {
            const img = await this.loadImageFromFile(file);

            const validDimensions = (
                ((img.width === 64 && (img.height === 64 || img.height === 32)) ||
                    (img.width === 128 && (img.height === 128 || img.height === 64)))
            );

            if (!validDimensions) {
                return {
                    valid: false,
                    message: 'Skin must be 64x64, 64x32, 128x128, or 128x64 pixels',
                    image: null
                };
            }

            return {
                valid: true,
                message: 'Valid skin file',
                image: img
            };
        } catch (error) {
            return {
                valid: false,
                message: 'Failed to load skin image',
                image: null
            };
        }
    },

    generatePackZip: async function (packData) {

        if (typeof JSZip === 'undefined') {
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
        }

        const zip = new JSZip();

        const bpUuid = this.generateUUID();
        const rpUuid = this.generateUUID();
        const addonName = packData.addonName || 'Player Heads';
        const headCount = packData.heads.length;

        const bpManifest = {
            "format_version": 2,
            "header": {
                "min_engine_version": [1, 20, 70],
                "name": `${addonName} (BP)`,
                "description": "By: minato4743",
                "uuid": bpUuid,
                "version": [1, 0, 0]
            },
            "modules": [
                {
                    "type": "data",
                    "uuid": "7d348ebc-f9c2-417d-86f0-239ace2deafd",
                    "version": [1, 0, 0]
                },
                {
                    "type": "script",
                    "language": "javascript",
                    "entry": "scripts/index.js",
                    "uuid": "85af954c-28ca-454b-a81e-6e64f84d0033",
                    "version": [1, 0, 0]
                }
            ],
            "metadata": {
                "head_count": headCount,
                "generated_by": "Player Head Generator by minato4743",
                "authors": ["unknown"],
                "license": "MIT"
            },
            "dependencies": [
                { "uuid": rpUuid, "version": [1, 0, 0] },
                { "module_name": "@minecraft/server", "version": "1.9.0" }
            ]
        };

        const rpManifest = {
            "format_version": 2,
            "header": {
                "min_engine_version": [1, 20, 70],
                "name": `${addonName} (RP)`,
                "description": "By: minato4743",
                "uuid": rpUuid,
                "version": [1, 0, 0]
            },
            "modules": [
                {
                    "type": "resources",
                    "uuid": "655c0cc1-adca-476b-bf18-9de67a379bc8",
                    "version": [1, 0, 0]
                }
            ],
            "metadata": {
                "head_count": headCount,
                "generated_by": "Player Head Generator by minato4743",
                "authors": ["unknown"],
                "license": "MIT"
            },
            "dependencies": [
                { "uuid": bpUuid, "version": [1, 0, 0] }
            ]
        };

        zip.file(`player_head_bp/manifest.json`, JSON.stringify(bpManifest));
        zip.file(`player_head_rp/manifest.json`, JSON.stringify(rpManifest));

        const terrainTexture = {
            "num_mip_levels": 4,
            "padding": 8,
            "resource_pack_name": "mba_head",
            "texture_name": "atlas.terrain",
            "texture_data": {}
        };

        zip.file(`player_head_rp/texts/languages.json`, JSON.stringify(["en_US"]));

        let langContent = `minato:heads_group=Player Heads\nitem.minato:head_=head\ntile.minato:head.name=head\n`;

        const itemCatalog = {
            "format_version": "1.21.60",
            "minecraft:crafting_items_catalog": {
                "categories": [
                    {
                        "category_name": "equipment",
                        "groups": [
                            {
                                "group_identifier": {
                                    "name": "minato:heads_group",
                                    "icon": null
                                },
                                "items": []
                            }
                        ]
                    }
                ]
            }
        }

        for (const head of packData.heads) {
            const hexName = this.stringToHex(head.name);

            const blockTextureBase64 = this.extractBase64FromDataUrl(head.blockTexture);

            if (!itemCatalog["minecraft:crafting_items_catalog"].categories[0].groups[0].group_identifier.icon) {
                itemCatalog["minecraft:crafting_items_catalog"].categories[0].groups[0].group_identifier.icon = `minato:head_${hexName}`;
            }

            itemCatalog["minecraft:crafting_items_catalog"].categories[0].groups[0].items.push(`minato:head_${hexName}`);

            zip.file(`player_head_rp/textures/blocks/head_${hexName}.png`, blockTextureBase64, { base64: true });
            terrainTexture.texture_data[`head_${hexName}`] = { "textures": `textures/blocks/head_${hexName}` };

            langContent += `tile.minato:head_${hexName}.name=${head.name}'s head\nitem.minato:head_${hexName}=${head.name}'s head\n`;

            const blockJson = {
                "format_version": "1.21.50",
                "minecraft:block": {
                    "description": {
                        "identifier": `minato:head_${hexName}`,
                        "menu_category": {
                            "category": "none",
                            "is_hidden_in_commands": true
                        },
                        "traits": {
                            "minecraft:placement_position": {
                                "enabled_states": ["minecraft:block_face"]
                            }
                        },
                        "states": {
                            "minato:head_rotation": {
                                "values": { "min": 0, "max": 15 }
                            }
                        }
                    },
                    "components": {
                        "minecraft:destructible_by_mining": {
                            "seconds_to_destroy": 1.5
                        },
                        "minecraft:loot": `loot_tables/blocks/head_${hexName}.json`,
                        "minecraft:collision_box": {
                            "origin": [-4.5, 0, -4.5],
                            "size": [9, 9, 9]
                        },
                        "minecraft:selection_box": {
                            "origin": [-4.5, 0, -4.5],
                            "size": [9, 9, 9]
                        },
                        "minecraft:geometry": {
                            "identifier": `geometry.head`,
                            "bone_visibility": {
                                "up_0": "q.block_state('minecraft:block_face') == 'up' && !math.mod(q.block_state('minato:head_rotation'), 4)",
                                "up_22_5": "q.block_state('minecraft:block_face') == 'up' && !math.mod(q.block_state('minato:head_rotation') - 1, 4)",
                                "up_45": "q.block_state('minecraft:block_face') == 'up' && !math.mod(q.block_state('minato:head_rotation') - 2, 4)",
                                "up_67_5": "q.block_state('minecraft:block_face') == 'up' && !math.mod(q.block_state('minato:head_rotation') - 3, 4)",
                                "side": "q.block_state('minecraft:block_face') != 'up'"
                            }
                        },
                        "minecraft:material_instances": {
                            "*": {
                                "texture": `head_${hexName}`,
                                "render_method": "alpha_test_single_sided"
                            }
                        },
                        "minecraft:placement_filter": {
                            "conditions": [
                                {
                                    "allowed_faces": ["up", "side"]
                                }
                            ]
                        }
                    },
                    "permutations": [
                        {
                            "condition": "q.block_state('minato:head_rotation') >= 4 || q.block_state('minecraft:block_face') == 'east'",
                            "components": {
                                "minecraft:transformation": { "rotation": [0, -90, 0] }
                            }
                        },
                        {
                            "condition": "q.block_state('minato:head_rotation') >= 8 || q.block_state('minecraft:block_face') == 'south'",
                            "components": {
                                "minecraft:transformation": { "rotation": [0, 180, 0] }
                            }
                        },
                        {
                            "condition": "q.block_state('minato:head_rotation') >= 12 || q.block_state('minecraft:block_face') == 'west'",
                            "components": {
                                "minecraft:transformation": { "rotation": [0, 90, 0] }
                            }
                        },
                        {
                            "condition": "q.block_state('minecraft:block_face') != 'up'",
                            "components": {
                                "minecraft:collision_box": {
                                    "origin": [-4.5, 3.5, -1],
                                    "size": [9, 9, 9]
                                },
                                "minecraft:selection_box": {
                                    "origin": [-4.5, 3.5, -1],
                                    "size": [9, 9, 9]
                                }
                            }
                        }
                    ]
                }
            };
            zip.file(`player_head_bp/blocks/head_${hexName}.json`, JSON.stringify(blockJson));

            const itemJson = {
                "format_version": "1.21.50",
                "minecraft:item": {
                    "description": {
                        "identifier": `minato:head_${hexName}`,
                        "menu_category": {
                            "category": "equipment"
                        }
                    },
                    "components": {
                        "minecraft:block_placer": {
                            "block": `minato:head_${hexName}`,
                            "replace_block_item": true
                        },
                        "minecraft:max_stack_size": { "value": 1 },
                        "minecraft:wearable": {
                            "slot": "slot.armor.head"
                        }
                    }
                }
            };
            zip.file(`player_head_bp/items/head_${hexName}.json`, JSON.stringify(itemJson));

            const lootTable = {
                "pools": [
                    {
                        "rolls": 1,
                        "entries": [
                            {
                                "type": "item",
                                "name": `minato:head_${hexName}`
                            }
                        ]
                    }
                ]
            };
            zip.file(`player_head_bp/loot_tables/blocks/head_${hexName}.json`, JSON.stringify(lootTable));

            const attachable = {
                "format_version": "1.10.0",
                "minecraft:attachable": {
                    "description": {
                        "identifier": `minato:head_${hexName}`,
                        "materials": {
                            "default": "armor",
                            "enchanted": "armor_enchanted"
                        },
                        "textures": {
                            "default": `textures/blocks/head_${hexName}`,
                            "enchanted": "textures/misc/enchanted_item_glint"
                        },
                        "geometry": {
                            "default": "geometry.attachable_head",
                        },
                        "render_controllers": [
                            "controller.render.item_default"
                        ]
                    }
                }
            };
            zip.file(`player_head_rp/attachables/item.head_${hexName}.json`, JSON.stringify(attachable));
        }

        zip.file(`player_head_rp/textures/terrain_texture.json`, JSON.stringify(terrainTexture));

        zip.file(`player_head_rp/texts/en_US.lang`, langContent);

        const packIcon = await this.createPackIcon(packData.color, packData.iconIndex);
        zip.file(`player_head_bp/pack_icon.png`, packIcon);
        zip.file(`player_head_rp/pack_icon.png`, packIcon);

        zip.file(`player_head_bp/item_catalog/crafting_item_catalog.json`, JSON.stringify(itemCatalog));

        const headGeoJson = await this.fetchJSON('../assets/json/head.geo.json');
        const attachableHeadGeoJson = await this.fetchJSON('../assets/json/attachable.geo.json');

        zip.file(`player_head_rp/models/blocks/head.geo.json`, JSON.stringify(headGeoJson));
        zip.file(`player_head_rp/models/blocks/attachable.geo.json`, JSON.stringify(attachableHeadGeoJson));

        const scriptContent = `import { world, Player, ItemStack} from "@minecraft/server";

world.afterEvents.playerPlaceBlock.subscribe((event) => {
  const {player,block} = event
  const {y} = player.getRotation()
  const face = block.permutation.getState("minecraft:block_face")
  if(block.permutation.getState("minato:head_rotation") === undefined) return
  if(face == "up"){    
    let rot = y + 360*(y!=Math.abs(y))
    rot = Math.round(rot/22.5)
    rot = rot!=16?rot:0
    block.setPermutation(block.permutation.withState("minato:head_rotation",rot));
  }
});

world.afterEvents.entityDie.subscribe((event) => {
  const {damageSource,deadEntity} = event
  const killer = damageSource.damagingEntity
  if(!(deadEntity instanceof Player) || killer == undefined) return
  const name = deadEntity.name
  const hexName = convert_hex(name)
  
  try {
    const killerName = killer.nameTag?killer.nameTag:killer.typeId.split(":")[1]
    const head = new ItemStack(\`minato:head_\${hexName}\`)
    head.setLore([\`Killed by: \${killerName}\`])
    deadEntity.dimension.spawnItem(head, deadEntity.location);
  } catch (error) {
    deadEntity.sendMessage(\`§c\${name}\'s head doesn\'t exist in the heads pack§r\`);
    if(killer instanceof Player){
      killer.sendMessage(\`§c\${name}\'s head doesn\'t exist in the heads pack§r\`);
    }
  }
});

function convert_hex(name) {
  let hex_name = "";
  for (let i = 0; i < name.length; i++) {
    hex_name += name.charCodeAt(i).toString(16);
  }
  return hex_name;
}`;

        zip.file(`player_head_bp/scripts/index.js`, scriptContent);

        return zip;
    },

    loadScript: function (src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },

    fetchJSON: async function (url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch JSON from ${url}: ${response.statusText}`);
        }
        return response.json();
    }
};
