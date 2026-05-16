const exporter = {
    defaultButtonTextures: new Set([
        'textures/ui/button_borderless_light',
        'textures/ui/button_borderless_lighthover',
        'textures/ui/button_borderless_lightpressed',
        'textures/ui/button_borderless_lightpressednohover',
        'textures/ui/cell_image',
        'textures/ui/cell_image_selected',
        'textures/ui/highlight_slot'
    ]),

    shouldPackageTexture: function (path) {
        return !this.defaultButtonTextures.has(path);
    },

    extractTexturePaths: function (json) {
        const texturePaths = new Set();

        const findTextures = (obj) => {
            if (!obj || typeof obj !== 'object') return;

            if (obj.texture && typeof obj.texture === 'string' && !obj.texture.startsWith('$')) {
                texturePaths.add(obj.texture);
            }

            if (obj.picture && typeof obj.picture === 'string' && !obj.picture.startsWith('$')) {
                texturePaths.add(obj.picture);
            }

            if (obj.$texture && typeof obj.$texture === 'string' && !obj.$texture.startsWith('$')) {
                texturePaths.add(obj.$texture);
            }

            if (obj.$path_to_image && typeof obj.$path_to_image === 'string' && !obj.$path_to_image.startsWith('$')) {
                texturePaths.add(obj.$path_to_image);
            }

            [
                '$default_button_texture',
                '$hover_button_texture',
                '$pressed_button_texture',
                '$pressed_no_hover_texture',
                '$default_texture',
                '$hover_texture',
                '$embedded_image_texture',
                '$cell_image_texture',
                '$cell_image_selected_texture',
                '$highlight_slot_texture'
            ].forEach(textureVariable => {
                if (obj[textureVariable] && typeof obj[textureVariable] === 'string' && !obj[textureVariable].startsWith('$')) {
                    if (this.shouldPackageTexture(obj[textureVariable])) {
                        texturePaths.add(obj[textureVariable]);
                    }
                }
            });

            // Handle dynamic grid texture variables that contain uploaded images
            if (obj.$scroll_background_image_texture && typeof obj.$scroll_background_image_texture === 'string' && obj.$scroll_background_image_texture.startsWith('user_uploaded:')) {
                texturePaths.add(obj.$scroll_background_image_texture);
            }

            if (obj.$scroll_indent_image_texture && typeof obj.$scroll_indent_image_texture === 'string' && obj.$scroll_indent_image_texture.startsWith('user_uploaded:')) {
                texturePaths.add(obj.$scroll_indent_image_texture);
            }

            if (obj.$scrollbar_box_image_texture && typeof obj.$scrollbar_box_image_texture === 'string' && obj.$scrollbar_box_image_texture.startsWith('user_uploaded:')) {
                texturePaths.add(obj.$scrollbar_box_image_texture);
            }

            // Handle dialog background texture that contains uploaded images or regular paths
            if (obj.$dialog_background_texture && typeof obj.$dialog_background_texture === 'string' && !obj.$dialog_background_texture.startsWith('$')) {
                // Skip the default dialog_background_opaque texture - it's already in Minecraft
                if (obj.$dialog_background_texture !== 'textures/ui/dialog_background_opaque') {
                    // Convert Minecraft texture path back to user_uploaded path for extraction
                    if (obj.$dialog_background_texture.startsWith('textures/ui/custom/')) {
                        const imageName = obj.$dialog_background_texture.replace('textures/ui/custom/', '');
                        texturePaths.add(`user_uploaded:${imageName}`);
                    } else {
                        texturePaths.add(obj.$dialog_background_texture);
                    }
                }
            }

            if (Array.isArray(obj)) {
                obj.forEach(item => findTextures(item));
            } else {
                for (let key in obj) {
                    findTextures(obj[key]);
                }
            }
        };

        findTextures(json);
        return texturePaths;
    },

    extractTexturesFromComponents: function (components, texturePaths) {
        const findComponentTextures = (component) => {
            if (!component || !component.properties) return;

            // Check for uploaded images in component properties
            for (const [key, value] of Object.entries(component.properties)) {
                if (typeof value === 'string' && value.startsWith('user_uploaded:')) {
                    texturePaths.add(value);
                }
            }
        };

        if (Array.isArray(components)) {
            components.forEach(component => findComponentTextures(component));
        }
    },

    getExportFiles: function (json) {
        if (json && json.uiDefs && json.chestScreen && json.customUi) {
            const files = {
                "_ui_defs.json": json.uiDefs,
                "chest_screen.json": json.chestScreen,
                "custom_chest_ui.json": json.customUi
            };

            // Add custom scroller file if it exists
            if (json.customScroller) {
                files["custom_scroll.json"] = json.customScroller;
            }

            return files;
        }

        return {
            "chest_screen.json": json
        };
    },

    generatePlaceholderTexture: function (path) {
        return new Promise(async (resolve) => {
            const localPath = `../assets/${path.replace('textures', 'images')}.png`;
            const bedrockSamplePath = path.startsWith('textures/ui/')
                ? `https://raw.githubusercontent.com/Mojang/bedrock-samples/main/resource_pack/${path}.png`
                : null;

            for (const textureUrl of [localPath, bedrockSamplePath].filter(Boolean)) {
                try {
                    const response = await fetch(textureUrl);

                    if (response.ok) {
                        const blob = await response.blob();
                        resolve({
                            blob: blob,
                            isPlaceholder: false
                        });
                        return;
                    }
                } catch (error) {
                    console.error(`Error loading texture from ${textureUrl}:`, error);
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');

            const filename = path.split('/').pop();

            const hash = path.split('').reduce((a, b) => {
                a = ((a << 5) - a) + b.charCodeAt(0);
                return a & a;
            }, 0);

            const hue = Math.abs(hash) % 360;

            ctx.fillStyle = `hsl(${hue}, 70%, 70%)`;
            ctx.fillRect(0, 0, 64, 64);

            ctx.strokeStyle = `hsl(${hue}, 70%, 40%)`;
            ctx.lineWidth = 1;

            for (let i = 8; i < 64; i += 8) {
                ctx.beginPath();
                ctx.moveTo(0, i);
                ctx.lineTo(64, i);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, 64);
                ctx.stroke();
            }

            ctx.strokeStyle = `hsl(${hue}, 70%, 30%)`;
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, 64, 64);

            ctx.fillStyle = `hsl(${hue}, 70%, 20%)`;
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(filename, 32, 32);

            canvas.toBlob(blob => {
                resolve({
                    blob: blob,
                    isPlaceholder: true
                });
            });
        });
    },

    createResourcePackZip: async function (json, settings = null) {
        const zip = new JSZip();
        const resourcePack = zip.folder("ChestUI_ResourcePack");
        const jsonForExport = JSON.parse(JSON.stringify(json));
        const exportFiles = this.getExportFiles(jsonForExport);
        const texturePaths = this.extractTexturePaths(jsonForExport);

        // Also extract textures from component data (for dynamic grid uploaded images)
        const components = editor.getComponents();
        this.extractTexturesFromComponents(components, texturePaths);

        const componentsData = projectFormat.build({
            components,
            uiProject: typeof chestUiManager !== 'undefined' ? chestUiManager.toJSON() : null,
            settings
        });
        zip.file('chest_ui_data.json', JSON.stringify(componentsData, null, 2));

        const manifestJson = this.generateManifestJson();
        resourcePack.file("manifest.json", JSON.stringify(manifestJson, null, 2));

        for (const path of [...texturePaths]) {
            if (path.startsWith('user_uploaded:')) {
                if (imageManager.uploadedImages[path]) {
                    const imageData = imageManager.uploadedImages[path].data;
                    const imageName = path.replace('user_uploaded:', '');
                    const actualTexturePath = `textures/ui/custom/${imageName}`;

                    const textureFolder = resourcePack.folder('textures/ui/custom');
                    const base64Data = imageData.split(',')[1];
                    const byteCharacters = atob(base64Data);
                    const byteArrays = [];

                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteArrays.push(byteCharacters.charCodeAt(i));
                    }

                    const blob = new Uint8Array(byteArrays);
                    textureFolder.file(`${imageName}.png`, blob);
                    this.updateImagePath(jsonForExport, path, actualTexturePath);
                }
            }
            else if (path.startsWith('textures/ui/custom/custom_')) {
                const userUploadedPath = 'user_uploaded:' + path.replace('textures/ui/custom/', '');
                if (imageManager.uploadedImages[userUploadedPath]) {
                    continue;
                }
            }
        }

        Object.entries(exportFiles).forEach(([filename, fileJson]) => {
            resourcePack.file(`ui/${filename}`, JSON.stringify(fileJson, null, 2));
        });

        for (const path of texturePaths) {
            if (!path.startsWith('user_uploaded:') && path.startsWith('textures/')) {
                if (path.startsWith('textures/ui/custom/custom_')) {
                    const userUploadedPath = 'user_uploaded:' + path.replace('textures/ui/custom/', '');
                    if (imageManager.uploadedImages[userUploadedPath]) {
                        continue;
                    }
                }

                if (this.defaultButtonTextures.has(path)) {
                    continue;
                }

                const textureResult = await this.generatePlaceholderTexture(path);

                const pathParts = path.split('/');
                const filename = pathParts.pop();
                let currentPath = resourcePack;

                for (const part of pathParts) {
                    currentPath = currentPath.folder(part);
                }

                if (textureResult.isPlaceholder) {
                    currentPath.file(`${filename}.png`, textureResult.blob);
                } else {
                    currentPath.file(`${filename}.png`, textureResult.blob);
                }
            }
        }

        return zip.generateAsync({ 
            type: "blob",
            compression: "DEFLATE",
            compressionOptions: {
                level: 9
            }
        });
    },

    generateManifestJson: function () {
        return {
            "format_version": 2,
            "header": {
                "name": "Custom Chest UI",
                "description": "Custom chest UI created with Chest UI Editor",
                "uuid": this.generateUUID(),
                "version": [1, 0, 0],
                "min_engine_version": [1, 16, 0]
            },
            "modules": [
                {
                    "type": "resources",
                    "uuid": this.generateUUID(),
                    "version": [1, 0, 0]
                }
            ]
        };
    },

    updateImagePath: function (json, oldPath, newPath) {
        const updatePath = (obj) => {
            if (!obj || typeof obj !== 'object') return;

            if (obj.texture === oldPath) {
                obj.texture = newPath;
            }

            if (obj.$texture === oldPath) {
                obj.$texture = newPath;
            }

            if (obj.$path_to_image === oldPath) {
                obj.$path_to_image = newPath;
            }

            ['$default_button_texture', '$hover_button_texture', '$pressed_button_texture', '$embedded_image_texture'].forEach(textureVariable => {
                if (obj[textureVariable] === oldPath) {
                    obj[textureVariable] = newPath;
                }
            });

            if (Array.isArray(obj)) {
                obj.forEach(item => updatePath(item));
            } else {
                for (let key in obj) {
                    updatePath(obj[key]);
                }
            }
        };

        updatePath(json);
    },

    generateUUID: function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0,
                v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    exportProject: async function () {
        try {
            const exportButton = document.getElementById('export-json');
            const originalText = exportButton.innerHTML;
            exportButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span class="button-text">Processing...</span>';
            exportButton.disabled = true;

            // Load settings before generating JSON
            const settings = util.loadFromLocalStorage('chest_ui_settings') || {
                mainPanelHeight: 166,
                mainPanelLayer: 5
            };
            
            if (typeof chestUiManager !== 'undefined') {
                chestUiManager.captureActive();
            }

            const json = preview.generateProjectJSON(
                settings,
                typeof chestUiManager !== 'undefined' ? chestUiManager.getExportUis() : null
            );

            const zipBlob = await this.createResourcePackZip(json, settings);

            // Create a blob with explicit MIME type for ZIP files
            const properZipBlob = new Blob([zipBlob], { type: 'application/zip' });

            const a = document.createElement('a');
            a.href = URL.createObjectURL(properZipBlob);
            a.download = "ChestUI_ResourcePack.zip";
            a.setAttribute('download', 'ChestUI_ResourcePack.zip'); // Force download attribute
            document.body.appendChild(a);
            a.click();

            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(a.href);
                exportButton.innerHTML = originalText;
                exportButton.disabled = false;
            }, 100);

        } catch (error) {
            console.error("Error exporting project:", error);
            alert("Error creating resource pack: " + error.message);

            document.getElementById('export-json').innerHTML = '<i class="fas fa-file-export"></i><span class="button-text">Export</span>';
            document.getElementById('export-json').disabled = false;
        }
    }
};

function importZipProject() {
    util.importZipFile(async (data, imageFiles) => {
        try {
            projectFormat.assertValid(data);

            if (imageFiles && imageFiles.length > 0) {
                await Promise.all(imageFiles.map(item => {
                    return new Promise((resolve) => {
                        imageManager.storeImage(item.file, () => {
                            resolve();
                        }, item.path);
                    });
                }));
            }

            if (!projectFormat.apply(data, { silent: true })) {
                throw new Error('Imported ZIP project failed validation after loading images.');
            }

            projectFormat.persistLocal(projectFormat.buildFromEditor());

            alert(`Project imported successfully (format ${projectFormat.FORMAT_LABEL}).`);
        } catch (err) {
            console.error('Error importing project:', err);
            alert('Error importing project: ' + err.message);
        }
    });
}
