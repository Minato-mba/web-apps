const defaultSettings = {
    mainPanelHeight: 166,  // Default total chest panel height (vanilla)
    mainPanelLayer: 5,
    titleOffsetX: 10,       // Default title horizontal offset
    titleOffsetY: -6,       // Default title vertical offset
    titleFontScaleFactor: 1.0,
    titleColor: [1.0, 1.0, 1.0],
    dialogBackground: 'textures/ui/dialog_background_opaque',  // Default chest panel background texture
    showCloseButton: true     // Default show close button
};

const chestUiManager = {
    uis: [],
    activeId: null,

    init: function () {
        const addButton = document.getElementById('add-chest-ui');
        const triggerTitleInput = document.getElementById('chest-ui-trigger-title');
        const newTitleInput = document.getElementById('chest-ui-new-title');

        if (addButton && triggerTitleInput && newTitleInput) {
            addButton.addEventListener('click', () => {
                const triggerTitle = triggerTitleInput.value.trim();
                const newTitle = newTitleInput.value.trim();
                
                if (!triggerTitle && !newTitle) {
                    // If both are empty, use different defaults
                    this.addUi(`§F§l§a§g§r§T§i§t§l§e§r${this.insertSectionBeforeNumbers(this.uis.length + 1)}`, `Display Name ${this.uis.length + 1}`);
                } else {
                    // Use provided values, fallback to different defaults if one is empty
                    const finalTriggerTitle = triggerTitle || `§F§l§a§g§r§T§i§t§l§e§r${this.insertSectionBeforeNumbers(this.uis.length + 1)}`;
                    const finalNewTitle = newTitle || `${triggerTitle || `Display Name ${this.uis.length + 1}`}`;
                    this.addUi(finalTriggerTitle, finalNewTitle);
                }
                
                triggerTitleInput.value = '';
                newTitleInput.value = '';
            });

            [triggerTitleInput, newTitleInput].forEach(input => {
                input.addEventListener('keydown', e => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        addButton.click();
                    }
                });
            });
        }
    },

    createDefaultUi: function (components = [], triggerTitle = '§F§l§a§g§r§T§i§t§l§e§r', newTitle = 'Display Name') {
        return {
            id: util.generateUniqueId(),
            triggerTitle,
            newTitle,
            title: newTitle, // Keep title for backward compatibility
            settings: {
                mainPanelHeight: defaultSettings.mainPanelHeight,
                mainPanelLayer: defaultSettings.mainPanelLayer,
                titleOffsetX: defaultSettings.titleOffsetX,
                titleOffsetY: defaultSettings.titleOffsetY,
                titleFontScaleFactor: defaultSettings.titleFontScaleFactor,
                titleColor: defaultSettings.titleColor,
                dialogBackground: defaultSettings.dialogBackground,
                showCloseButton: defaultSettings.showCloseButton
            },
            components: this.cloneComponents(components)
        };
    },

    resetFromCurrent: function (triggerTitle = '§F§l§a§g§r§T§i§t§l§e§r', newTitle = 'Display Name') {
        const ui = this.createDefaultUi(editor.getComponents(), triggerTitle, newTitle);
        this.uis = [ui];
        this.activeId = ui.id;
        this.renderList();
        
        // Apply title display for the newly created UI
        this.updateTitleDisplay(ui);
        
        // Apply reset settings to both editor and preview
        preview.updatePreviewWithSettings(editor.getComponents(), ui.settings);
        preview.applyCloseButtonToEditor(ui.settings);
    },

    load: function (uiProject, fallbackComponents = []) {
        const importedUis = Array.isArray(uiProject?.uis) ? uiProject.uis : [];
        this.uis = importedUis.map((ui, index) => {
            const baseTitle = this.hasOwn(ui, 'title') ? ui.title : ``;
            const triggerTitle = this.hasOwn(ui, 'triggerTitle') ? ui.triggerTitle : baseTitle;
            const newTitle = this.hasOwn(ui, 'newTitle') ? ui.newTitle : (this.hasOwn(ui, 'triggerTitle') ? baseTitle : baseTitle);
            return {
                id: ui.id || util.generateUniqueId(),
                triggerTitle,
                newTitle,
                title: this.hasOwn(ui, 'title') ? ui.title : newTitle,
                settings: this.normalizeSettings(ui.settings),
                components: this.cloneComponents(ui.components || [], true)
            };
        });

        if (this.uis.length === 0) {
            this.uis = [this.createDefaultUi(fallbackComponents)];
        }

        this.activeId = uiProject?.activeId || this.uis[0].id;
        if (!this.uis.some(ui => ui.id === this.activeId)) {
            this.activeId = this.uis[0].id;
        }

        this.loadActiveIntoEditor();
        this.renderList();
    },

    captureActive: function () {
        const active = this.getActiveUi();
        if (active) {
            active.components = this.cloneComponents(editor.getComponents());
        }
    },

    getActiveUi: function () {
        return this.uis.find(ui => ui.id === this.activeId) || null;
    },

    getExportUis: function () {
        this.captureActive();
        return this.uis.map(ui => ({
            id: ui.id,
            title: ui.title,
            triggerTitle: ui.triggerTitle,
            newTitle: ui.newTitle,
            settings: ui.settings,
            components: this.cloneComponents(ui.components)
        }));
    },

    toJSON: function () {
        this.captureActive();
        return {
            activeId: this.activeId,
            uis: this.getExportUis()
        };
    },

    addUi: function (triggerTitle, newTitle) {
        this.captureActive();
        const ui = {
            id: util.generateUniqueId(),
            triggerTitle,
            newTitle,
            title: newTitle, // Keep title for backward compatibility
            settings: {
                mainPanelHeight: defaultSettings.mainPanelHeight,
                mainPanelLayer: defaultSettings.mainPanelLayer,
                titleOffsetX: defaultSettings.titleOffsetX,
                titleOffsetY: defaultSettings.titleOffsetY,
                titleFontScaleFactor: defaultSettings.titleFontScaleFactor,
                titleColor: defaultSettings.titleColor,
                dialogBackground: defaultSettings.dialogBackground,
                showCloseButton: defaultSettings.showCloseButton
            },
            components: []
        };
        this.uis.push(ui);
        this.activeId = ui.id;
        this.loadActiveIntoEditor();
        this.renderList();
    },

    selectUi: function (id) {
        if (id === this.activeId) return;
        
        // Capture current UI settings before switching
        this.captureActive();
        
        // Switch to new UI
        this.activeId = id;
        
        // Load the new UI into editor
        this.loadActiveIntoEditor();
        
        // Apply the selected UI's settings to the preview with delay to ensure DOM is ready
        const selectedUi = this.getActiveUi();
        console.log('selectUi: selectedUi =', selectedUi);
        if (selectedUi && selectedUi.settings) {
            console.log('selectUi: applying settings =', selectedUi.settings);
            preview.updatePreviewWithSettings(editor.getComponents(), selectedUi.settings);
            util.applySettings(selectedUi.settings);
            setTimeout(() => {
                console.log('selectUi: calling applyCloseButtonToEditor with settings =', selectedUi.settings);
                preview.applyCloseButtonToEditor(selectedUi.settings);
            }, 50);
        }
        
        this.updateTitleDisplay(selectedUi);
        
        this.renderList();
    },

    deleteUi: function (id) {
        if (this.uis.length <= 1) {
            alert('Keep at least one chest UI in the project.');
            return;
        }

        const index = this.uis.findIndex(ui => ui.id === id);
        if (index === -1) return;

        this.uis.splice(index, 1);
        if (this.activeId === id) {
            this.activeId = this.uis[Math.max(0, index - 1)].id;
            this.loadActiveIntoEditor();
        }
        this.renderList();
    },

    renameUi: function (id, title, type = 'title') {
        const ui = this.uis.find(item => item.id === id);
        if (!ui) return;
        
        // Allow empty string - don't trim if user wants empty title
        const processedTitle = title;
        
        if (type === 'trigger') {
            ui.triggerTitle = processedTitle;
        } else if (type === 'new') {
            ui.newTitle = processedTitle;
            ui.title = processedTitle; // Keep title in sync with new title for backward compatibility
        } else {
            ui.title = processedTitle;
            ui.triggerTitle = processedTitle;
            ui.newTitle = processedTitle;
        }
        
        this.renderList();
        
        // Capture the updated state so title changes are applied immediately
        this.captureActive();
        
        // Update the visible title display if this is the active UI
        if (this.getActiveUi()?.id === ui.id) {
            this.updateTitleDisplay(ui);
            preview.updatePreviewWithSettings(editor.getComponents(), ui.settings);
        }
    },

    loadActiveIntoEditor: function () {
        const active = this.getActiveUi();
        console.log('loadActiveIntoEditor: active =', active);
        if (!active) {
            console.log('loadActiveIntoEditor: no active UI found');
            return;
        }

        editor.isRestoringState = true;
        editor.components = [];
        editor.canvas.innerHTML = '';
        this.cloneComponents(active.components).forEach(component => {
            editor.components.push(component);
            editor.renderComponent(component);
        });
        editor.selectComponent(null);
        preview.updatePreviewWithSettings(editor.getComponents(), active.settings);
        util.applySettings(active.settings);
        editor.updateComponentList();
        editor.fixComponentZIndices();
        
        // Update title display with offset
        this.updateTitleDisplay(active);
        
        // Apply close button visibility to editor with slight delay to ensure DOM is ready
        setTimeout(() => {
            console.log('loadActiveIntoEditor: calling applyCloseButtonToEditor with settings =', active.settings);
            preview.applyCloseButtonToEditor(active.settings);
        }, 50);
        
        editor.isRestoringState = false;
    },

    updateTitleDisplay: function (ui) {
        const editorTitle = document.getElementById('editor-chest-title');
        const previewTitle = document.getElementById('preview-chest-title');
        const displayTitle = this.hasOwn(ui, 'newTitle') ? ui.newTitle : (this.hasOwn(ui, 'title') ? ui.title : '');
        
        if (editorTitle && ui.settings) {
            editorTitle.textContent = displayTitle;
            // Apply offset values directly (CSS provides base position)
            editorTitle.style.left = `${ui.settings.titleOffsetX ?? defaultSettings.titleOffsetX}px`;
            editorTitle.style.top = `${(ui.settings.titleOffsetY ?? defaultSettings.titleOffsetY) + 10}px`;
            editorTitle.style.fontSize = `${10 * (Number(ui.settings.titleFontScaleFactor) || defaultSettings.titleFontScaleFactor)}px`;
            editorTitle.style.color = util.rgbArrayToHex(ui.settings.titleColor || defaultSettings.titleColor);
        }
        
        if (previewTitle && ui.settings) {
            previewTitle.textContent = displayTitle;
            // Apply offset values directly (CSS provides base position)
            previewTitle.style.left = `${ui.settings.titleOffsetX ?? defaultSettings.titleOffsetX}px`;
            previewTitle.style.top = `${(ui.settings.titleOffsetY ?? defaultSettings.titleOffsetY) + 10}px`;
            previewTitle.style.fontSize = `${10 * (Number(ui.settings.titleFontScaleFactor) || defaultSettings.titleFontScaleFactor)}px`;
            previewTitle.style.color = util.rgbArrayToHex(ui.settings.titleColor || defaultSettings.titleColor);
        }
    },

    renderList: function () {
        const list = document.getElementById('chest-ui-list');
        if (!list) return;

        list.innerHTML = '';
        this.uis.forEach(ui => {
            const row = document.createElement('div');
            row.className = `chest-ui-row${ui.id === this.activeId ? ' active' : ''}`;
            row.innerHTML = `
                <div class="chest-ui-titles">
                    <input class="chest-ui-trigger-title" value="${this.escapeAttribute(this.hasOwn(ui, 'triggerTitle') ? ui.triggerTitle : ui.title)}" title="Trigger title (condition)" placeholder="Trigger">
                    <input class="chest-ui-new-title" value="${this.escapeAttribute(this.hasOwn(ui, 'newTitle') ? ui.newTitle : ui.title)}" title="New title (display)" placeholder="Display">
                </div>
                <button class="delete-chest-ui" title="Delete chest UI"><i class="fas fa-trash"></i></button>
            `;

            row.addEventListener('click', e => {
                if (!e.target.closest('.delete-chest-ui') && !e.target.classList.contains('chest-ui-trigger-title') && !e.target.classList.contains('chest-ui-new-title')) {
                    this.selectUi(ui.id);
                }
            });

            const triggerInput = row.querySelector('.chest-ui-trigger-title');
            const newInput = row.querySelector('.chest-ui-new-title');
            
            triggerInput.addEventListener('change', e => this.renameUi(ui.id, e.target.value, 'trigger'));
            
            newInput.addEventListener('change', e => this.renameUi(ui.id, e.target.value, 'new'));

            row.querySelector('.delete-chest-ui').addEventListener('click', e => {
                e.stopPropagation();
                this.deleteUi(ui.id);
            });

            list.appendChild(row);
        });
    },

    cloneComponents: function (components) {
        return JSON.parse(JSON.stringify(components || [])).map(component => {
            const componentType = componentTypes[component.type];
            if (componentType && componentType.defaultProps) {
                component.properties = {
                    ...componentType.defaultProps,
                    ...(component.properties || {})
                };
            }
            return component;
        });
    },

    escapeAttribute: function (value) {
        return String(value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },

    hasOwn: function (object, key) {
        return Object.prototype.hasOwnProperty.call(object || {}, key);
    },

    normalizeSettings: function (settings = {}) {
        return {
            mainPanelHeight: settings.mainPanelHeight ?? defaultSettings.mainPanelHeight,
            mainPanelLayer: settings.mainPanelLayer ?? defaultSettings.mainPanelLayer,
            titleOffsetX: settings.titleOffsetX ?? defaultSettings.titleOffsetX,
            titleOffsetY: settings.titleOffsetY ?? defaultSettings.titleOffsetY,
            titleFontScaleFactor: settings.titleFontScaleFactor ?? defaultSettings.titleFontScaleFactor,
            titleColor: settings.titleColor ?? defaultSettings.titleColor,
            dialogBackground: settings.dialogBackground ?? defaultSettings.dialogBackground,
            showCloseButton: settings.showCloseButton ?? defaultSettings.showCloseButton
        };
    },

    insertSectionBeforeNumbers: function (number) {
        return String(number).split('').map(digit => `§${digit}`).join('');
    }
};

document.addEventListener('DOMContentLoaded', function () {
    propertiesPanel.init();
    editor.init();
    preview.init();
    templates.init();
    mobile.init();
    chestUiManager.init();
    setupActionButtons();
    setupSettingsModal();
    setupFoldablePanels();
    const projectLoaded = loadSavedProject({ silent: true });
    if (!projectLoaded) {
        templates.loadTemplate('vanilla');
        chestUiManager.resetFromCurrent();
    } else {
        // If project loaded, apply the active UI's settings to show title and offset
        const activeUi = chestUiManager.getActiveUi();
        if (activeUi && activeUi.settings) {
            util.applySettings(activeUi.settings);
            chestUiManager.updateTitleDisplay(activeUi);
        }
    }

    editor.fixComponentZIndices();
    
    // Apply active UI's settings to preview
    const activeUi = chestUiManager.getActiveUi();
    if (activeUi && activeUi.settings) {
        util.applySettings(activeUi.settings);
        chestUiManager.updateTitleDisplay(activeUi);
    }
    
    // Ensure title is visible and positioned correctly after initial load
    setTimeout(() => {
        const activeUiAgain = chestUiManager.getActiveUi();
        if (activeUiAgain && activeUiAgain.settings) {
            chestUiManager.updateTitleDisplay(activeUiAgain);
        }
    }, 100);

    document.getElementById('import-zip').addEventListener('click', function() {
        importZipProject();
    });

    setupCodeViewer();

    if (typeof releaseNotice !== 'undefined') {
        releaseNotice.init();
    }
});

function setupActionButtons() {
    // Reset button
    document.getElementById('reset-button').addEventListener('click', () => {
        if (confirm('Reset all saved projects? This will clear all saved data from browser cache.\n\nThis action cannot be undone!')) {
            try {
                util.saveToLocalStorage('minecraft_chest_ui_project', null);
                util.saveToLocalStorage('chest_ui_settings', defaultSettings);
                util.applySettings(defaultSettings);

                // Also update the settings modal if it's open
                const heightInput = document.getElementById('main-panel-height');
                const layerInput = document.getElementById('main-panel-layer');
                const titleOffsetXInput = document.getElementById('title-offset-x');
                const titleOffsetYInput = document.getElementById('title-offset-y');
                const titleFontScaleInput = document.getElementById('title-font-scale-factor');
                const titleColorRInput = document.getElementById('title-color-r');
                const titleColorGInput = document.getElementById('title-color-g');
                const titleColorBInput = document.getElementById('title-color-b');
                const titleColorPreview = document.querySelector('.title-color-preview');
                const dialogBackgroundInput = document.getElementById('dialog-background');
                const showCloseButtonInput = document.getElementById('show-close-button');
                const backgroundPreviewContainer = document.getElementById('background-preview-container');
                
                if (heightInput && layerInput && titleOffsetXInput && titleOffsetYInput) {
                    heightInput.value = defaultSettings.mainPanelHeight;
                    layerInput.value = defaultSettings.mainPanelLayer;
                    titleOffsetXInput.value = defaultSettings.titleOffsetX;
                    titleOffsetYInput.value = defaultSettings.titleOffsetY;
                }

                if (titleFontScaleInput) {
                    titleFontScaleInput.value = defaultSettings.titleFontScaleFactor;
                }

                if (titleColorRInput && titleColorGInput && titleColorBInput) {
                    titleColorRInput.value = defaultSettings.titleColor[0];
                    titleColorGInput.value = defaultSettings.titleColor[1];
                    titleColorBInput.value = defaultSettings.titleColor[2];
                }

                if (titleColorPreview) {
                    titleColorPreview.style.backgroundColor = util.rgbArrayToHex(defaultSettings.titleColor);
                }
                
                if (dialogBackgroundInput) {
                    dialogBackgroundInput.value = defaultSettings.dialogBackground;
                    dialogBackgroundInput.removeAttribute('data-original-path');
                }
                
                if (showCloseButtonInput) {
                    showCloseButtonInput.checked = defaultSettings.showCloseButton;
                }
                
                if (backgroundPreviewContainer) {
                    backgroundPreviewContainer.style.display = 'none';
                }

                alert('Cache cleared successfully! Saved projects have been removed.');
                // Optionally reload to show empty state
                editor.clearComponents();
                chestUiManager.resetFromCurrent();
            } catch (e) {
                console.error('Error clearing cache:', e);
                alert('Error clearing cache: ' + e.message);
            }
        }
    });

    document.getElementById('new-project').addEventListener('click', () => {
        if (confirm('Start a new project? This will clear all current components.')) {
            editor.clearComponents();
            chestUiManager.resetFromCurrent();
            util.applySettings(defaultSettings);
            util.saveToLocalStorage('chest_ui_settings', defaultSettings);
            util.saveToLocalStorage('minecraft_chest_ui_project', null);

            // Also update the settings modal if it's open
            const heightInput = document.getElementById('main-panel-height');
            const layerInput = document.getElementById('main-panel-layer');
            const titleOffsetXInput = document.getElementById('title-offset-x');
            const titleOffsetYInput = document.getElementById('title-offset-y');
            const titleFontScaleInput = document.getElementById('title-font-scale-factor');
            const titleColorRInput = document.getElementById('title-color-r');
            const titleColorGInput = document.getElementById('title-color-g');
            const titleColorBInput = document.getElementById('title-color-b');
            const titleColorPreview = document.querySelector('.title-color-preview');
            if (heightInput && layerInput && titleOffsetXInput && titleOffsetYInput) {
                heightInput.value = defaultSettings.mainPanelHeight;
                layerInput.value = defaultSettings.mainPanelLayer;
                titleOffsetXInput.value = defaultSettings.titleOffsetX;
                titleOffsetYInput.value = defaultSettings.titleOffsetY;
            }
            if (titleFontScaleInput) {
                titleFontScaleInput.value = defaultSettings.titleFontScaleFactor;
            }
            if (titleColorRInput && titleColorGInput && titleColorBInput) {
                titleColorRInput.value = defaultSettings.titleColor[0];
                titleColorGInput.value = defaultSettings.titleColor[1];
                titleColorBInput.value = defaultSettings.titleColor[2];
            }
            if (titleColorPreview) {
                titleColorPreview.style.backgroundColor = util.rgbArrayToHex(defaultSettings.titleColor);
            }
        }
    });
    document.getElementById('save-project').addEventListener('click', () => {
        try {
            projectFormat.saveToBrowser();
            alert('Project saved!');
        } catch (e) {
            console.error('Error while saving project:', e);
            alert('Error saving project: ' + e.message);
        }
    });
    document.getElementById('load-project').addEventListener('click', () => {
        loadSavedProject();
    });

    // Setup export dropdown functionality
    setupExportDropdown();
}

function loadSavedProject(options = {}) {
    const silent = options.silent === true;

    try {
        const data = util.loadFromLocalStorage('minecraft_chest_ui_project');
        if (!data) {
            if (!silent) {
                alert('No saved project found. Use Save first.');
            }
            return false;
        }

        if (!projectFormat.apply(data, { silent })) {
            return false;
        }

        if (!silent) {
            alert('Project loaded successfully!');
        }
        return true;
    } catch (e) {
        console.error('Error loading project:', e);
        if (!silent) {
            alert('Error loading project: ' + e.message);
        }
        return false;
    }
}

function setupSettingsModal() {
    const settingsButton = document.getElementById('settings-button');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettings = document.getElementById('close-settings');
    const cancelSettings = document.getElementById('cancel-settings');
    const saveSettings = document.getElementById('save-settings');
    const modalBackdrop = settingsModal.querySelector('.modal-backdrop');

    // Open settings modal
    settingsButton.addEventListener('click', () => {
        openSettingsModal();
    });

    // Close modal handlers
    const closeModal = () => {
        settingsModal.style.display = 'none';
    };

    closeSettings.addEventListener('click', closeModal);
    cancelSettings.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', closeModal);

    // Handle background texture upload
    const uploadBackgroundBtn = document.getElementById('upload-background-btn');
    const backgroundUploadInput = document.getElementById('background-upload');
    const backgroundPreviewContainer = document.getElementById('background-preview-container');
    const customBackgroundPreview = document.getElementById('custom-background-preview');
    const dialogBackgroundInput = document.getElementById('dialog-background');
    const titleColorR = document.getElementById('title-color-r');
    const titleColorG = document.getElementById('title-color-g');
    const titleColorB = document.getElementById('title-color-b');
    const titleColorPreview = document.querySelector('.title-color-preview');
    const titleColorOptions = document.querySelectorAll('.title-color-picker .color-option');

    const setTitleColorInputs = (color) => {
        const nextColor = Array.isArray(color) ? color : defaultSettings.titleColor;
        if (titleColorR) titleColorR.value = nextColor[0];
        if (titleColorG) titleColorG.value = nextColor[1];
        if (titleColorB) titleColorB.value = nextColor[2];
        if (titleColorPreview) titleColorPreview.style.backgroundColor = util.rgbArrayToHex(nextColor);

        titleColorOptions.forEach(option => {
            option.classList.remove('selected');
            try {
                const optionColor = JSON.parse(option.getAttribute('data-color').replace(/'/g, '"'));
                if (JSON.stringify(optionColor) === JSON.stringify(nextColor)) {
                    option.classList.add('selected');
                }
            } catch (e) {
                console.error('Error parsing title color option', e);
            }
        });
    };

    titleColorOptions.forEach(option => {
        option.addEventListener('click', () => {
            try {
                setTitleColorInputs(JSON.parse(option.getAttribute('data-color').replace(/'/g, '"')));
            } catch (e) {
                console.error('Error parsing title color option', e);
            }
        });
    });

    [titleColorR, titleColorG, titleColorB].forEach(input => {
        if (input) {
            input.addEventListener('input', () => {
                setTitleColorInputs([
                    parseFloat(titleColorR.value) || 0,
                    parseFloat(titleColorG.value) || 0,
                    parseFloat(titleColorB.value) || 0
                ]);
            });
        }
    });

    if (uploadBackgroundBtn) {
        if (uploadBackgroundBtn._clickHandler) {
            uploadBackgroundBtn.removeEventListener('click', uploadBackgroundBtn._clickHandler);
        }

        uploadBackgroundBtn._clickHandler = function () {
            backgroundUploadInput.click();
        };

        uploadBackgroundBtn.addEventListener('click', uploadBackgroundBtn._clickHandler);
    }

    if (backgroundUploadInput) {
        if (backgroundUploadInput._changeHandler) {
            backgroundUploadInput.removeEventListener('change', backgroundUploadInput._changeHandler);
        }

        backgroundUploadInput._changeHandler = function (e) {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                if (!file.type.startsWith('image/')) {
                    alert('Please select an image file.');
                    return;
                }

                imageManager.storeImage(file, (imagePath) => {
                    const imageName = imagePath.replace('user_uploaded:', '');
                    const minecraftPath = `textures/ui/custom/${imageName}`;

                    dialogBackgroundInput.value = minecraftPath;
                    dialogBackgroundInput.setAttribute('data-original-path', imagePath);

                    // Show preview
                    backgroundPreviewContainer.style.display = 'block';
                    customBackgroundPreview.style.backgroundImage = `url('${imageManager.getImageUrl(imagePath)}')`;
                    customBackgroundPreview.style.backgroundSize = 'cover';
                    customBackgroundPreview.style.backgroundPosition = 'center';
                    customBackgroundPreview.style.width = '100%';
                    customBackgroundPreview.style.height = '80px';
                    customBackgroundPreview.style.border = '1px solid var(--mc-border)';
                    customBackgroundPreview.style.borderRadius = '4px';
                });
            }
        };

        backgroundUploadInput.addEventListener('change', backgroundUploadInput._changeHandler);
        backgroundUploadInput._hasChangeHandler = true;
    }

    // Handle manual texture path changes
    if (dialogBackgroundInput) {
        if (dialogBackgroundInput._inputHandler) {
            dialogBackgroundInput.removeEventListener('input', dialogBackgroundInput._inputHandler);
        }

        dialogBackgroundInput._inputHandler = function () {
            const originalPath = dialogBackgroundInput.getAttribute('data-original-path');
            if (originalPath && this.value !== this.getAttribute('data-original-minecraft-path')) {
                dialogBackgroundInput.setAttribute('data-user-edited', 'true');
                dialogBackgroundInput.removeAttribute('data-original-path');
                backgroundPreviewContainer.style.display = 'none';
            }
        };

        dialogBackgroundInput.addEventListener('input', dialogBackgroundInput._inputHandler);
        
        // Store the original minecraft path for comparison
        if (dialogBackgroundInput.getAttribute('data-original-path')) {
            dialogBackgroundInput.setAttribute('data-original-minecraft-path', dialogBackgroundInput.value);
        }
    }

    // Save settings
    saveSettings.addEventListener('click', () => {
        const activeUi = chestUiManager.getActiveUi();
        if (!activeUi) {
            alert('No active chest UI to save settings to.');
            return;
        }

        const parsedHeight = parseInt(document.getElementById('main-panel-height').value);
        const parsedLayer = parseInt(document.getElementById('main-panel-layer').value);
        const parsedTitleOffsetX = parseInt(document.getElementById('title-offset-x').value);
        const parsedTitleOffsetY = parseInt(document.getElementById('title-offset-y').value);
        const parsedTitleFontScale = parseFloat(document.getElementById('title-font-scale-factor').value);
        const height = Number.isFinite(parsedHeight) ? parsedHeight : defaultSettings.mainPanelHeight;
        const layer = Number.isFinite(parsedLayer) ? parsedLayer : defaultSettings.mainPanelLayer;
        const titleOffsetX = Number.isFinite(parsedTitleOffsetX) ? parsedTitleOffsetX : defaultSettings.titleOffsetX;
        const titleOffsetY = Number.isFinite(parsedTitleOffsetY) ? parsedTitleOffsetY : defaultSettings.titleOffsetY;
        const titleFontScaleFactor = Number.isFinite(parsedTitleFontScale) ? parsedTitleFontScale : defaultSettings.titleFontScaleFactor;
        const titleColor = [
            parseFloat(document.getElementById('title-color-r').value) || 0,
            parseFloat(document.getElementById('title-color-g').value) || 0,
            parseFloat(document.getElementById('title-color-b').value) || 0
        ];
        const showCloseButton = document.getElementById('show-close-button').checked;
        const dialogBackgroundInput = document.getElementById('dialog-background');
        let dialogBackground = dialogBackgroundInput.value.trim() || defaultSettings.dialogBackground;
        
        // Check if this is an uploaded image and get the original path
        const originalPath = dialogBackgroundInput.getAttribute('data-original-path');
        if (originalPath && !dialogBackgroundInput.getAttribute('data-user-edited')) {
            dialogBackground = originalPath;
        }
        
        // Update active UI settings
        activeUi.settings = {
            mainPanelHeight: height,
            mainPanelLayer: layer,
            titleOffsetX: titleOffsetX,
            titleOffsetY: titleOffsetY,
            titleFontScaleFactor: titleFontScaleFactor,
            titleColor: titleColor,
            dialogBackground: dialogBackground,
            showCloseButton: showCloseButton
        };

        // Update preview with new settings
        preview.updatePreviewWithSettings(editor.getComponents(), activeUi.settings);
        
        // Apply settings to the preview canvas
        util.applySettings(activeUi.settings);
        chestUiManager.updateTitleDisplay(activeUi);
        
        // Update project in localStorage (current format version)
        projectFormat.persistLocal(projectFormat.buildFromEditor());
        
        closeModal();
        alert('Settings applied successfully!');
    });
}

function openSettingsModal() {
    const settingsModal = document.getElementById('settings-modal');
    const activeUi = chestUiManager.getActiveUi();
    
    if (!activeUi) {
        alert('Please select a chest UI first.');
        return;
    }
    
    const settings = { ...defaultSettings, ...activeUi.settings };
    
    // Populate current values from active UI
    document.getElementById('main-panel-height').value = settings.mainPanelHeight;
    document.getElementById('main-panel-layer').value = settings.mainPanelLayer;
    document.getElementById('title-offset-x').value = settings.titleOffsetX;
    document.getElementById('title-offset-y').value = settings.titleOffsetY;
    document.getElementById('title-font-scale-factor').value = settings.titleFontScaleFactor ?? defaultSettings.titleFontScaleFactor;
    const titleColor = settings.titleColor || defaultSettings.titleColor;
    document.getElementById('title-color-r').value = titleColor[0];
    document.getElementById('title-color-g').value = titleColor[1];
    document.getElementById('title-color-b').value = titleColor[2];
    const titleColorPreview = document.querySelector('.title-color-preview');
    if (titleColorPreview) {
        titleColorPreview.style.backgroundColor = util.rgbArrayToHex(titleColor);
    }
    document.querySelectorAll('.title-color-picker .color-option').forEach(option => {
        option.classList.remove('selected');
        try {
            const optionColor = JSON.parse(option.getAttribute('data-color').replace(/'/g, '"'));
            if (JSON.stringify(optionColor) === JSON.stringify(titleColor)) {
                option.classList.add('selected');
            }
        } catch (e) {
            console.error('Error parsing title color option', e);
        }
    });
    document.getElementById('show-close-button').checked = settings.showCloseButton !== false;
    
    const dialogBackgroundInput = document.getElementById('dialog-background');
    const backgroundPreviewContainer = document.getElementById('background-preview-container');
    const customBackgroundPreview = document.getElementById('custom-background-preview');
    
    // Handle uploaded background image
    if (settings.dialogBackground && imageManager.isUploadedImage(settings.dialogBackground)) {
        const imageName = settings.dialogBackground.replace('user_uploaded:', '');
        const minecraftPath = `textures/ui/custom/${imageName}`;
        
        dialogBackgroundInput.value = minecraftPath;
        dialogBackgroundInput.setAttribute('data-original-path', settings.dialogBackground);
        
        // Show preview
        backgroundPreviewContainer.style.display = 'block';
        customBackgroundPreview.style.backgroundImage = `url('${imageManager.getImageUrl(settings.dialogBackground)}')`;
        customBackgroundPreview.style.backgroundSize = 'cover';
        customBackgroundPreview.style.backgroundPosition = 'center';
        customBackgroundPreview.style.width = '100%';
        customBackgroundPreview.style.height = '80px';
        customBackgroundPreview.style.border = '1px solid var(--mc-border)';
        customBackgroundPreview.style.borderRadius = '4px';
    } else {
        dialogBackgroundInput.value = settings.dialogBackground || defaultSettings.dialogBackground;
        dialogBackgroundInput.removeAttribute('data-original-path');
        backgroundPreviewContainer.style.display = 'none';
    }
    
    settingsModal.style.display = 'flex';
}

function loadSettings() {
    const saved = util.loadFromLocalStorage('chest_ui_settings');
    const settings = saved ? { ...defaultSettings, ...saved } : defaultSettings;
    
    util.applySettings(settings);
    return settings;
}

function setupFoldablePanels() {

    const panels = document.querySelectorAll('.panel');
    const DEBOUNCE_DELAY = 300; // milliseconds

    panels.forEach(panel => {
        const header = panel.querySelector('.panel-header');
        const foldButton = panel.querySelector('.fold-button');

        if (!header || !foldButton) return;


        const panelClass = Array.from(panel.classList)
            .find(cls => cls !== 'panel');

        const panelId = panelClass || 'unknown_panel';
        const isFolded = localStorage.getItem(`panel_${panelId}_folded`) === 'true';

        if (isFolded) {
            panel.classList.add('folded');
        }

        // Per-panel debouncing to prevent double-toggle
        let lastToggleTime = 0;

        const toggleFold = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Debounce to prevent double-clicking
            const now = Date.now();
            if (now - lastToggleTime < DEBOUNCE_DELAY) {
                return; // Ignore rapid clicks
            }
            lastToggleTime = now;

            panel.classList.toggle('folded');
            localStorage.setItem(
                `panel_${panelId}_folded`,
                panel.classList.contains('folded')
            );

        };


        foldButton.addEventListener('click', toggleFold);


        header.addEventListener('click', (e) => {
            // Don't toggle if clicking on the fold button itself (prevents double toggle)
            if (e.target.classList.contains('fold-button') || e.target.closest('.fold-button')) {
                return;
            }

            if (e.target === header || e.target.tagName === 'H3') {
                toggleFold(e);
            }
        });
    });
    const propertiesPanel = document.querySelector('.properties-panel');
    if (propertiesPanel) {
        propertiesPanel.classList.remove('folded');
        localStorage.setItem('panel_properties-panel_folded', 'false');
    }
}

function setupExportDropdown() {
    const exportButton = document.getElementById('export-json');
    const exportDropdown = document.getElementById('export-dropdown');
    const exportItems = exportDropdown.querySelectorAll('.export-dropdown-item');
    
    // Toggle dropdown on button click
    exportButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = exportDropdown.style.display === 'block';
        exportDropdown.style.display = isVisible ? 'none' : 'block';
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!exportButton.contains(e.target) && !exportDropdown.contains(e.target)) {
            exportDropdown.style.display = 'none';
        }
    });
    
    // Handle dropdown item clicks
    exportItems.forEach(item => {
        item.addEventListener('click', () => {
            const action = item.getAttribute('data-action');
            exportDropdown.style.display = 'none';
            
            if (action === 'zip') {
                exportAsZip();
            } else if (action === 'code') {
                viewAsCode();
            }
        });
    });
}

function exportAsZip() {
    if (typeof exporter !== 'undefined' && exporter.exportProject) {
        exporter.exportProject();
    } else {
        console.error('Exporter module not loaded properly');
        alert('Export functionality is not available. Please refresh the page and try again.');
    }
}

function viewAsCode() {
    try {
        // Load settings
        const settings = util.loadFromLocalStorage('chest_ui_settings') || {
            mainPanelHeight: 166,
            mainPanelLayer: 5
        };
        
        chestUiManager.captureActive();
        const json = preview.generateProjectJSON(settings, chestUiManager.getExportUis());
        
        // Store both full and custom-only JSON for tab switching
        window.generatedJSON = {
            full: json,
            custom: json.customUi || {}
        };
        
        // Display in modal (default to full view)
        const modal = document.getElementById('code-viewer-modal');
        displayCodeView('full');
        modal.style.display = 'flex';
        
        // Reset tab selection
        document.querySelectorAll('.code-tab').forEach(tab => {
            tab.classList.toggle('active', tab.getAttribute('data-view') === 'full');
        });
        
    } catch (error) {
        console.error('Error generating code:', error);
        alert('Error generating code: ' + error.message);
    }
}

function displayCodeView(view) {
    const codeDisplay = document.getElementById('json-code-display');
    
    if (!window.generatedJSON) return;
    
    let codeString;
    if (view === 'custom') {
        // Show custom UI sections (exclude namespace)
        const fullJSON = window.generatedJSON.custom || window.generatedJSON.full;
        const customSections = {};
        
        // Copy all properties except namespace and small_chest_screen
        for (const key in fullJSON) {
            if (key !== 'namespace' && !key.startsWith('small_chest_screen')) {
                customSections[key] = fullJSON[key];
            }
        }
        
        // Format without outer braces
        const entries = Object.entries(customSections);
        const formattedEntries = entries.map(([key, value]) => {
            const valueJSON = JSON.stringify(value, null, 2);
            // Indent the value JSON by 2 spaces (except first line)
            const indentedValue = valueJSON.split('\n').map((line, i) => 
                i === 0 ? line : line
            ).join('\n');
            return `"${key}": ${indentedValue}`;
        });
        
        codeString = formattedEntries.join(',\n');
    } else {
        // Show full JSON
        codeString = JSON.stringify(window.generatedJSON.full, null, 2);
    }
    
    codeDisplay.textContent = codeString;
    
    // Store current view for copy function
    window.currentCodeView = view;
}

function setupCodeViewer() {
    const modal = document.getElementById('code-viewer-modal');
    const closeBtn = document.getElementById('close-code-viewer');
    const copyBtn = document.getElementById('copy-code-btn');
    const copyStatus = document.getElementById('copy-status');
    const backdrop = modal.querySelector('.modal-backdrop');
    const codeTabs = document.querySelectorAll('.code-tab');
    
    // Close modal handlers
    const closeModal = () => {
        modal.style.display = 'none';
    };
    
    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);
    
    // Tab switching
    codeTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const view = tab.getAttribute('data-view');
            
            // Update active tab
            codeTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Display the selected view
            displayCodeView(view);
        });
    });
    
    // Copy to clipboard
    copyBtn.addEventListener('click', async () => {
        const codeDisplay = document.getElementById('json-code-display');
        const code = codeDisplay.textContent;
        
        try {
            await navigator.clipboard.writeText(code);
            copyStatus.textContent = 'Copied!';
            copyStatus.classList.add('show');
            
            setTimeout(() => {
                copyStatus.classList.remove('show');
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = code;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                copyStatus.textContent = 'Copied!';
                copyStatus.classList.add('show');
                
                setTimeout(() => {
                    copyStatus.classList.remove('show');
                }, 2000);
            } catch (err2) {
                alert('Failed to copy code. Please copy manually.');
            }
            document.body.removeChild(textArea);
        }
    });
}


