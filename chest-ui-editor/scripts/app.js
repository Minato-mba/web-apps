document.addEventListener('DOMContentLoaded', function () {

    propertiesPanel.init();
    editor.init();
    preview.init();
    templates.init();
    mobile.init();
    setupActionButtons();
    setupFoldablePanels();
    const projectLoaded = loadSavedProject();
    if (!projectLoaded) {
        templates.loadTemplate('vanilla');
    }
}); function setupActionButtons() {

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
    document.getElementById('export-json').addEventListener('click', () => {
                if (typeof exporter !== 'undefined' && exporter.exportProject) {
            exporter.exportProject();
        } else {
            console.error('Exporter module not loaded properly');
            alert('Export functionality is not available. Please refresh the page and try again.');
        }
    });
} function loadSavedProject() {
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

        alert('Project loaded successfully!');
        return true;
    } catch (e) {
        console.error('Error loading project:', e);
        alert('Error loading project: ' + e.message);
        return false;
    }
} function setupFoldablePanels() {

    const panels = document.querySelectorAll('.panel');

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


        const toggleFold = (e) => {
            e.preventDefault();
            e.stopPropagation();

            panel.classList.toggle('folded');
            localStorage.setItem(
                `panel_${panelId}_folded`,
                panel.classList.contains('folded')
            );

        };


        foldButton.addEventListener('click', toggleFold);


        header.addEventListener('click', (e) => {

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
