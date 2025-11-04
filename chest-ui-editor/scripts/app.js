document.addEventListener('DOMContentLoaded', function () {
    propertiesPanel.init();
    editor.init();
    preview.init();
    templates.init();
    mobile.init();
    setupActionButtons();
    setupSettingsModal();
    setupFoldablePanels();
    const projectLoaded = loadSavedProject();
    if (!projectLoaded) {
        templates.loadTemplate('vanilla');
    }

    editor.fixComponentZIndices();
    
    // Load and apply saved settings
    loadSettings();

    document.getElementById('import-zip').addEventListener('click', function() {
        importZipProject();
    });
});

function setupActionButtons() {
    // Reset button
    document.getElementById('reset-button').addEventListener('click', () => {
        if (confirm('Reset all saved projects? This will clear all saved data from browser cache.\n\nThis action cannot be undone!')) {
            try {
                util.saveToLocalStorage('minecraft_chest_ui_project', null);
                alert('Cache cleared successfully! Saved projects have been removed.');
                // Optionally reload to show empty state
                editor.clearComponents();
            } catch (e) {
                console.error('Error clearing cache:', e);
                alert('Error clearing cache: ' + e.message);
            }
        }
    });

    document.getElementById('new-project').addEventListener('click', () => {
        if (confirm('Start a new project? This will clear all current components.')) {
            editor.clearComponents();

            util.saveToLocalStorage('minecraft_chest_ui_project', null);
        }
    });
    document.getElementById('save-project').addEventListener('click', () => {
        try {

            const cleanComponents = editor.getComponents().map(component => {

                const cleanComponent = {
                    id: component.id,
                    type: component.type,
                    x: component.x,
                    y: component.y,
                    width: component.width,
                    height: component.height,
                    properties: { ...component.properties }
                };
                return cleanComponent;
            });

            const data = {
                components: cleanComponents,
                uploadedImages: imageManager.uploadedImages,
                version: '1.0.2',
                timestamp: Date.now()
            };

            util.saveToLocalStorage('minecraft_chest_ui_project', data);
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

function loadSavedProject() {
    try {
        const data = util.loadFromLocalStorage('minecraft_chest_ui_project');

        if (!data || !Array.isArray(data.components)) return false;


        if (data.uploadedImages) {
            imageManager.uploadedImages = data.uploadedImages;
        }

        editor.clearComponents();

        data.components.forEach(component => {

            if (!component.id) {
                component.id = util.generateUniqueId();
            }


            const componentType = componentTypes[component.type];
            if (componentType && componentType.defaultProps) {
                component.properties = {
                    ...componentType.defaultProps,
                    ...component.properties
                };
            }

            editor.addComponent(component);
        });

        editor.fixComponentZIndices();

        alert('Project loaded successfully!');
        return true;
    } catch (e) {
        console.error('Error loading project:', e);
        alert('Error loading project: ' + e.message);
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

    // Save settings
    saveSettings.addEventListener('click', () => {
        const height = parseInt(document.getElementById('main-panel-height').value);
        const layer = parseInt(document.getElementById('main-panel-layer').value);

        const settings = {
            mainPanelHeight: height,
            mainPanelLayer: layer
        };

        util.saveToLocalStorage('chest_ui_settings', settings);
        applySettings(settings);
        closeModal();
        alert('Settings applied successfully!');
    });
}

function openSettingsModal() {
    const settingsModal = document.getElementById('settings-modal');
    const settings = loadSettings();
    
    // Populate current values
    document.getElementById('main-panel-height').value = settings.mainPanelHeight;
    document.getElementById('main-panel-layer').value = settings.mainPanelLayer;
    
    settingsModal.style.display = 'flex';
}

function loadSettings() {
    const defaultSettings = {
        mainPanelHeight: 166,  // Default total chest panel height (vanilla)
        mainPanelLayer: 5
    };
    
    const saved = util.loadFromLocalStorage('chest_ui_settings');
    const settings = saved ? { ...defaultSettings, ...saved } : defaultSettings;
    
    applySettings(settings);
    return settings;
}

function applySettings(settings) {
    // Apply height to the entire chest panel (like main_panel size in fisher_table)
    const editorChestPanel = document.querySelector('.editor-canvas .chest-panel');
    const previewChestPanel = document.querySelector('.preview-canvas .chest-panel');
    
    if (editorChestPanel) {
        editorChestPanel.style.height = `${settings.mainPanelHeight}px`;
    }
    
    if (previewChestPanel) {
        previewChestPanel.style.height = `${settings.mainPanelHeight}px`;
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
        
        // Generate JSON
        const json = preview.generateJSON(settings);
        
        // Store both full and custom-only JSON for tab switching
        window.generatedJSON = {
            full: json,
            custom: json.custom || {}
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
        // Show custom sections (exclude namespace and small_chest_screen)
        const fullJSON = window.generatedJSON.full;
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

// Initialize code viewer on page load
document.addEventListener('DOMContentLoaded', function () {
    setupCodeViewer();
});
