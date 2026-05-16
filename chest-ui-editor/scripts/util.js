const util = {

    generateUniqueId: () => {
        return 'component_' + Math.random().toString(36).substr(2, 9);
    },


    rgbArrayToHex: (rgbArray) => {
        if (!Array.isArray(rgbArray) || rgbArray.length < 3) {
            return '#FFFFFF';
        }

        const r = Math.round(rgbArray[0] * 255);
        const g = Math.round(rgbArray[1] * 255);
        const b = Math.round(rgbArray[2] * 255);

        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
    },


    hexToRgbArray: (hex) => {

        hex = hex.replace('#', '');


        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;


        return [r, g, b];
    },
    snapToGrid: (value, gridSize = 18) => {
        return Math.round(value / gridSize) * gridSize;
    },
    formatNumber: (value, decimals = 1) => {
        return Number(value).toFixed(decimals);
    },
    saveToLocalStorage: (key, data) => {
        try {
            if (data === null) {
                localStorage.removeItem(key);
                return;
            }


            const serialized = JSON.stringify(data);


            const testKey = `test_${Date.now()}`;
            localStorage.setItem(testKey, '1');
            localStorage.removeItem(testKey);


            localStorage.setItem(key, serialized);
            return true;
        } catch (e) {
            console.error('Error saving to local storage:', e);

            if (e.name === 'QuotaExceededError') {
                alert('Storage quota exceeded. Try clearing some browser data.');
            }
            return false;
        }
    },
    loadFromLocalStorage: (key) => {
        try {
            const data = localStorage.getItem(key);
            if (!data) {
                return null;
            }

            const parsed = JSON.parse(data);
            return parsed;
        } catch (e) {
            console.error('Error loading from local storage:', e);
            return null;
        }
    },
    downloadJSON: (data, filename = 'chest_ui.json') => {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();


        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    },
    uploadFile: (onLoad, accept = 'application/json') => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    onLoad(data);
                } catch (error) {
                    console.error('Error parsing JSON file:', error);
                    alert('Invalid JSON file');
                }
            };
            reader.readAsText(file);
        };

        input.click();
    },
    importZipFile: (onLoad) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.zip';

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const zipData = await file.arrayBuffer();
                const zip = await JSZip.loadAsync(zipData);

                const jsonFile = zip.file("chest_ui_data.json");
                if (!jsonFile) {
                    alert('Invalid ZIP file: Missing UI data (chest_ui_data.json not found)');
                    return;
                }

                const jsonContent = await jsonFile.async('string');
                let data;
                try {
                    data = JSON.parse(jsonContent);
                } catch (parseError) {
                    alert('Invalid ZIP file: chest_ui_data.json is not valid JSON.');
                    return;
                }

                const imagePromises = [];
                const imageFiles = [];

                let imageFolder = zip.folder("images");

                if (!imageFolder || Object.keys(imageFolder.files).length === 0) {
                    imageFolder = zip.folder("ChestUI_ResourcePack/textures/ui/custom");
                }

                if (imageFolder) {
                    imageFolder.forEach((relativePath, zipEntry) => {
                        if (!zipEntry.dir) {
                            const promise = zipEntry.async("blob").then(blob => {
                                const imageName = relativePath.split('/').pop();
                                const imageFile = new File([blob], imageName, { type: blob.type || 'image/png' });
                                imageFiles.push({
                                    file: imageFile,
                                    path: 'user_uploaded:' + imageName
                                });
                            });
                            imagePromises.push(promise);
                        }
                    });
                }

                await Promise.all(imagePromises);

                onLoad(data, imageFiles);
            } catch (error) {
                console.error('Error importing ZIP file:', error);
                alert('Error importing ZIP file: ' + error.message);
            }
        };

        input.click();
    },
    applySettings: function(settings) {
        // Validate settings parameter
        if (!settings || typeof settings !== 'object') {
            console.error('util.applySettings: Invalid settings parameter:', settings);
            return;
        }
        
        // Apply height to entire chest panel (like main_panel size in fisher_table)
        try {
            const editorChestPanel = document.querySelector('.editor-canvas .chest-panel');
            const previewChestPanel = document.querySelector('.preview-canvas .chest-panel');
            
            console.log('util.applySettings: Applying panel height:', settings.mainPanelHeight);
            
            if (editorChestPanel) {
                editorChestPanel.style.height = `${settings.mainPanelHeight}px`;
                console.log('util.applySettings: Set editor panel height to:', editorChestPanel.style.height);
            }
            
            if (previewChestPanel) {
                previewChestPanel.style.height = `${settings.mainPanelHeight}px`;
                console.log('util.applySettings: Set preview panel height to:', previewChestPanel.style.height);
            }

            if (typeof editor !== 'undefined' && editor.getTabPanel && typeof preview !== 'undefined') {
                const tabPanel = editor.getTabPanel();
                if (tabPanel) {
                    tabPanel.x = 0;
                    tabPanel.y = 0;
                    tabPanel.width = 162;
                    tabPanel.height = preview.calculatePanelHeight(settings);

                    const tabElement = editor.canvas?.querySelector(`[data-id="${tabPanel.id}"]`);
                    if (tabElement) {
                        tabElement.style.left = '0px';
                        tabElement.style.top = '0px';
                        tabElement.style.width = `${tabPanel.width}px`;
                        tabElement.style.height = `${tabPanel.height}px`;
                    }
                }
            }
            
            // Apply title offset to both editor and preview
            const editorTitle = document.getElementById('editor-chest-title');
            const previewTitle = document.getElementById('preview-chest-title');
            
            if (editorTitle && previewTitle && settings.titleOffsetX !== undefined && settings.titleOffsetY !== undefined) {
                console.log('util.applySettings: Applying title offsets:', {
                    titleOffsetX: settings.titleOffsetX,
                    titleOffsetY: settings.titleOffsetY
                });
                
                editorTitle.style.left = `${settings.titleOffsetX}px`;
                editorTitle.style.top = `${settings.titleOffsetY}px`;
                editorTitle.style.fontSize = `${10 * (Number(settings.titleFontScaleFactor) || 1.0)}px`;
                editorTitle.style.color = util.rgbArrayToHex(settings.titleColor || [1.0, 1.0, 1.0]);
                console.log('util.applySettings: Set editor title position:', {
                    left: editorTitle.style.left,
                    top: editorTitle.style.top
                });
                
                previewTitle.style.left = `${settings.titleOffsetX}px`;
                previewTitle.style.top = `${settings.titleOffsetY}px`;
                previewTitle.style.fontSize = `${10 * (Number(settings.titleFontScaleFactor) || 1.0)}px`;
                previewTitle.style.color = util.rgbArrayToHex(settings.titleColor || [1.0, 1.0, 1.0]);
                console.log('util.applySettings: Set preview title position:', {
                    left: previewTitle.style.left,
                    top: previewTitle.style.top
                });
            } else {
                console.log('util.applySettings: Title offset values are undefined, skipping title positioning');
            }
            
            // Apply close button visibility to both editor and preview
            if ('showCloseButton' in settings) {
                try {
                    const editorCloseButton = editorChestPanel?.querySelector('.chest-close-button');
                    const previewCloseButton = previewChestPanel?.querySelector('.chest-close-button');
                    
                    console.log('util.applySettings: Applying close button setting:', settings.showCloseButton);
                    
                    if (editorCloseButton) {
                        editorCloseButton.style.display = settings.showCloseButton ? 'block' : 'none';
                        console.log('util.applySettings: Set editor close button display to:', editorCloseButton.style.display);
                    }
                    
                    if (previewCloseButton) {
                        previewCloseButton.style.display = settings.showCloseButton ? 'block' : 'none';
                        console.log('util.applySettings: Set preview close button display to:', previewCloseButton.style.display);
                    }
                } catch (error) {
                    console.error('util.applySettings: Error applying close button setting:', error);
                }
            } else {
                console.log('util.applySettings: showCloseButton property not found in settings, skipping close button update');
            }
        } catch (error) {
            console.error('util.applySettings: Error applying settings:', error);
        }
        
        // Apply layer to the component container (where user places components)
        const editorComponentContainer = document.querySelector('.editor-canvas .component-container');
        const previewComponentContainer = document.querySelector('.preview-canvas .component-container');
        
        if (editorComponentContainer) {
            editorComponentContainer.style.zIndex = settings.mainPanelLayer;
        }
        
        if (previewComponentContainer) {
            previewComponentContainer.style.zIndex = settings.mainPanelLayer;
        }
    }
};
