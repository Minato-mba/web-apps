const mobile = {
    selectedComponentType: null,
    selectedComponent: null,
    init: function () {
        const showComponentsBtn = document.getElementById('show-components');
        const showEditorBtn = document.getElementById('show-editor');
        const showPreviewBtn = document.getElementById('show-preview');
        const showTemplatesBtn = document.getElementById('show-templates');

        const sidebar = document.querySelector('.sidebar');
        const editorArea = document.querySelector('.editor-area');
        const previewArea = document.querySelector('.preview-area');
        const templatesPanel = document.querySelector('.template-selector-panel');

        this.createFloatingComponentPanel();
        this.createFloatingTemplatesPanel();
        this.createFloatingPropertiesPanel();
        this.createComponentsListPanel();
        this.createPropertiesButton();

        showComponentsBtn.addEventListener('click', function () {
            const drawer = document.getElementById('mobile-component-drawer');
            if (drawer.classList.contains('open')) {
                drawer.classList.remove('open');
                showComponentsBtn.innerHTML = '<i class="fas fa-th"></i> Open Components';
            } else {
                drawer.classList.add('open');
                showComponentsBtn.innerHTML = '<i class="fas fa-times"></i> Close Components';

                const templateDrawer = document.getElementById('mobile-templates-drawer');
                if (templateDrawer && templateDrawer.classList.contains('open')) {
                    templateDrawer.classList.remove('open');
                    showTemplatesBtn.innerHTML = '<i class="fas fa-layer-group"></i> Open Templates';
                }
            }

            sidebar.style.display = 'none';
            editorArea.style.display = 'block';
            previewArea.style.display = 'none';
            templatesPanel.style.display = 'none';

            showEditorBtn.classList.add('active');
            showPreviewBtn.classList.remove('active');
            showTemplatesBtn.classList.remove('active');
        });

        showEditorBtn.addEventListener('click', function () {
            const drawer = document.getElementById('mobile-component-drawer');
            drawer.classList.remove('open');
            showComponentsBtn.innerHTML = '<i class="fas fa-th"></i> Open Components';

            sidebar.style.display = 'none';
            editorArea.style.display = 'block';
            previewArea.style.display = 'none';
            templatesPanel.style.display = 'none';

            showComponentsBtn.classList.remove('active');
            showEditorBtn.classList.add('active');
            showPreviewBtn.classList.remove('active');
            showTemplatesBtn.classList.remove('active');
        });

        showPreviewBtn.addEventListener('click', function () {
            const drawer = document.getElementById('mobile-component-drawer');
            drawer.classList.remove('open');
            showComponentsBtn.innerHTML = '<i class="fas fa-th"></i> Open Components';

            sidebar.style.display = 'none';
            editorArea.style.display = 'none';
            previewArea.style.display = 'block';
            templatesPanel.style.display = 'none';

            showComponentsBtn.classList.remove('active');
            showEditorBtn.classList.remove('active');
            showPreviewBtn.classList.add('active');
            showTemplatesBtn.classList.remove('active');
        });

        showTemplatesBtn.addEventListener('click', function () {
            const templateDrawer = document.getElementById('mobile-templates-drawer');
            if (templateDrawer.classList.contains('open')) {
                templateDrawer.classList.remove('open');
                showTemplatesBtn.innerHTML = '<i class="fas fa-layer-group"></i> Open Templates';
            } else {
                templateDrawer.classList.add('open');
                showTemplatesBtn.innerHTML = '<i class="fas fa-times"></i> Close Templates';

                const componentDrawer = document.getElementById('mobile-component-drawer');
                if (componentDrawer && componentDrawer.classList.contains('open')) {
                    componentDrawer.classList.remove('open');
                    showComponentsBtn.innerHTML = '<i class="fas fa-th"></i> Open Components';
                }
            }

            sidebar.style.display = 'none';
            editorArea.style.display = 'block';
            previewArea.style.display = 'none';
            templatesPanel.style.display = 'none';

            showComponentsBtn.classList.remove('active');
            showEditorBtn.classList.add('active');
            showPreviewBtn.classList.remove('active');
            showTemplatesBtn.classList.add('active');
        });

        const canvas = document.getElementById('component-container');
        canvas.addEventListener('click', this.handleCanvasTap.bind(this));

        this.checkMobileLayout();

        window.addEventListener('resize', this.checkMobileLayout.bind(this));
    },

    createFloatingComponentPanel: function () {
        const drawer = document.createElement('div');
        drawer.id = 'mobile-component-drawer';
        drawer.className = 'mobile-component-drawer';

        const componentList = document.querySelector('.component-list');
        const clonedList = componentList.cloneNode(true);
        drawer.appendChild(clonedList);

        const drawerHeader = document.createElement('div');
        drawerHeader.className = 'drawer-header';
        drawerHeader.innerHTML = '<span>Select a component, then tap where to place it</span>';
        drawer.insertBefore(drawerHeader, clonedList);

        document.querySelector('.app-container').appendChild(drawer);

        const drawerComponents = drawer.querySelectorAll('.component-item');
        drawerComponents.forEach(comp => {
            comp.addEventListener('click', this.handleComponentSelect.bind(this));
        });

        const closeButton = document.createElement('button');
        closeButton.className = 'drawer-close-button';
        closeButton.innerHTML = 'Done';
        closeButton.addEventListener('click', function () {
            drawer.classList.remove('open');
            const showComponentsBtn = document.getElementById('show-components');
            if (showComponentsBtn) {
                showComponentsBtn.innerHTML = '<i class="fas fa-th"></i> Open Components';
            }
        });
        drawer.querySelector('.drawer-header').appendChild(closeButton);

        const placementInstructions = document.createElement('div');
        placementInstructions.id = 'mobile-placement-instructions';
        placementInstructions.className = 'mobile-placement-instructions';
        placementInstructions.innerHTML = 'Tap on editor to place component';
        placementInstructions.style.display = 'none';
        document.querySelector('.app-container').appendChild(placementInstructions);
    },

    handleComponentSelect: function (e) {
        const allComponents = document.querySelectorAll('.mobile-component-drawer .component-item');
        allComponents.forEach(comp => comp.classList.remove('selected'));

        const componentItem = e.currentTarget;
        componentItem.classList.add('selected');

        this.selectedComponentType = componentItem.getAttribute('data-type');

        const instructions = document.getElementById('mobile-placement-instructions');
        if (instructions) {
            instructions.style.display = 'block';

            setTimeout(() => {
                instructions.style.display = 'none';
            }, 3000);
        }

        const drawer = document.getElementById('mobile-component-drawer');
        drawer.classList.remove('open');

        const showComponentsBtn = document.getElementById('show-components');
        if (showComponentsBtn) {
            showComponentsBtn.innerHTML = '<i class="fas fa-th"></i> Open Components';
        }
    },

    handleCanvasTap: function (e) {
        if (!this.selectedComponentType) return;

        const rect = e.currentTarget.getBoundingClientRect();
        let x = Math.floor(e.clientX - rect.left);
        let y = Math.floor(e.clientY - rect.top);

        if (editor.snapToGrid) {
            x = util.snapToGrid(x);
            y = util.snapToGrid(y);
        }

        const component = createComponent(this.selectedComponentType, x, y);
        editor.addComponent(component);
        editor.selectComponent(component);

        this.selectedComponentType = null;
        document.querySelectorAll('.mobile-component-drawer .component-item').forEach(comp => {
            comp.classList.remove('selected');
        });

        const instructions = document.getElementById('mobile-placement-instructions');
        if (instructions) {
            instructions.style.display = 'none';
        }
    },

    createFloatingTemplatesPanel: function () {
        const drawer = document.createElement('div');
        drawer.id = 'mobile-templates-drawer';
        drawer.className = 'mobile-templates-drawer';

        const templateList = document.querySelector('.template-list');
        const clonedList = templateList.cloneNode(true);
        drawer.appendChild(clonedList);

        const drawerHeader = document.createElement('div');
        drawerHeader.className = 'drawer-header';
        drawerHeader.innerHTML = '<span>Select a template</span>';
        drawer.insertBefore(drawerHeader, clonedList);

        document.querySelector('.app-container').appendChild(drawer);

        const templateItems = drawer.querySelectorAll('.template-item');
        templateItems.forEach(item => {
            item.addEventListener('click', (e) => {
                this.handleTemplateSelection(item);
            });

            item.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.handleTemplateSelection(item);
            });

            item.addEventListener('touchstart', () => {
                item.classList.add('template-active');
            });

            item.addEventListener('touchend', () => {
                setTimeout(() => {
                    item.classList.remove('template-active');
                }, 150);
            });

            item.addEventListener('touchcancel', () => {
                item.classList.remove('template-active');
            });
        });

        const closeButton = document.createElement('button');
        closeButton.className = 'drawer-close-button';
        closeButton.innerHTML = 'Done';
        closeButton.addEventListener('click', function () {
            drawer.classList.remove('open');
            const showTemplatesBtn = document.getElementById('show-templates');
            if (showTemplatesBtn) {
                showTemplatesBtn.innerHTML = '<i class="fas fa-layer-group"></i> Open Templates';
            }
        });
        drawer.querySelector('.drawer-header').appendChild(closeButton);
    },

    handleTemplateSelection: function (templateItem) {
        const templateName = templateItem.getAttribute('data-template');

        templateItem.classList.add('template-selected');
        setTimeout(() => {
            templateItem.classList.remove('template-selected');
        }, 300);

        if (templateName) {

            if (window.templates && typeof window.templates.loadTemplate === 'function') {
                try {
                    window.templates.loadTemplate(templateName);

                    const drawer = document.getElementById('mobile-templates-drawer');
                    if (drawer) {
                        drawer.classList.remove('open');
                    }

                    const showTemplatesBtn = document.getElementById('show-templates');
                    if (showTemplatesBtn) {
                        showTemplatesBtn.innerHTML = '<i class="fas fa-layer-group"></i> Open Templates';
                    }
                } catch (err) {
                    console.error('Error loading template:', err);

                    const originalTemplate = document.querySelector(`.template-selector-panel .template-item[data-template="${templateName}"]`);
                    if (originalTemplate) {
                        originalTemplate.click();
                    }
                }
            } else {
                console.error('Templates object or loadTemplate function not available');

                const originalTemplate = document.querySelector(`.template-selector-panel .template-item[data-template="${templateName}"]`);
                if (originalTemplate) {
                    originalTemplate.click();
                }
            }
        }
    },

    createPropertiesButton: function () {
        const button = document.createElement('button');
        button.id = 'mobile-properties-button';
        button.className = 'mobile-properties-button';
        button.innerHTML = '<i class="fas fa-sliders-h"></i> Edit Properties';
        button.style.display = 'none';
        document.querySelector('.app-container').appendChild(button);

        button.addEventListener('click', () => {
            if (this.propertiesDrawer) {
                this.propertiesDrawer.classList.add('open');
            }
        });

        this.propertiesButton = button;
    },

    createFloatingPropertiesPanel: function () {
        const drawer = document.createElement('div');
        drawer.id = 'mobile-properties-drawer';
        drawer.className = 'mobile-properties-drawer';

        const drawerHeader = document.createElement('div');
        drawerHeader.className = 'drawer-header';
        drawerHeader.innerHTML = '<span>Properties</span>';
        drawer.appendChild(drawerHeader);


        const deleteButton = document.createElement('button');
        deleteButton.className = 'drawer-delete-button';
        deleteButton.innerHTML = '<i class="fas fa-trash"></i> Delete';
        deleteButton.addEventListener('click', () => {
            if (this.selectedComponent && confirm('Are you sure you want to delete this component?')) {
                editor.removeComponent(this.selectedComponent);
                drawer.classList.remove('open');
                if (this.propertiesButton) {
                    this.propertiesButton.style.display = 'none';
                }
            }
        });
        drawerHeader.appendChild(deleteButton);

        const propertiesContainer = document.createElement('div');
        propertiesContainer.id = 'mobile-properties-container';
        propertiesContainer.className = 'mobile-properties-container';
        propertiesContainer.innerHTML = '<p class="no-selection">No component selected</p>';
        drawer.appendChild(propertiesContainer);

        const closeButton = document.createElement('button');
        closeButton.className = 'drawer-close-button';
        closeButton.innerHTML = 'Done';
        closeButton.addEventListener('click', function () {
            drawer.classList.remove('open');
        });
        drawerHeader.appendChild(closeButton);

        document.querySelector('.app-container').appendChild(drawer);

        this.propertiesDrawer = drawer;
        this.propertiesContainer = propertiesContainer;
        this.propertiesDrawerHeader = drawerHeader;

        const originalSelectComponent = editor.selectComponent;
        editor.selectComponent = function (component) {
            originalSelectComponent.call(editor, component);

            if (window.innerWidth < 768) {
                mobile.selectedComponent = component;
                if (mobile.propertiesButton) {
                    mobile.propertiesButton.style.display = 'none';
                }

                if (component) {

                    if (mobile.propertiesButton) {
                        mobile.propertiesButton.style.display = 'flex';
                    }

                    const componentType = componentTypes[component.type];
                    if (!componentType) return;

                    const templateId = componentType.template.substring(1);
                    const template = document.getElementById(templateId);
                    if (!template) return;

                    const content = document.importNode(template.content, true);

                    mobile.propertiesContainer.innerHTML = '';
                    mobile.propertiesContainer.appendChild(content);

                    mobile.setMobilePropertyValues(mobile.propertiesContainer, component);

                    if (componentType) {
                        mobile.propertiesDrawerHeader.querySelector('span').textContent =
                            `${componentType.name} Properties`;
                    }

                    mobile.setupPropertyEventListeners(mobile.propertiesContainer);
                } else {
                    if (mobile.propertiesDrawer) {
                        mobile.propertiesDrawer.classList.remove('open');
                    }
                    if (mobile.propertiesButton) {
                        mobile.propertiesButton.style.display = 'none';
                    }
                }
            }
        };

        const originalUpdateComponentPosition = editor.updateComponentPosition;
        editor.updateComponentPosition = function (component) {
            originalUpdateComponentPosition.call(editor, component);

            if (window.innerWidth < 768 && editor.selectedComponent &&
                component.id === editor.selectedComponent.id) {

                mobile.updateMobilePropertyValues(component);

            }
        };

        this.canvas = document.getElementById('component-container');
        this.canvas.addEventListener('click', (e) => {
            if (e.target === this.canvas) {
                drawer.classList.remove('open');
            }
        });
    },

    updateMobilePropertyValues: function (component) {
        if (!this.propertiesContainer || !component) return;

        const xInput = this.propertiesContainer.querySelector('[data-property="x"]');
        const yInput = this.propertiesContainer.querySelector('[data-property="y"]');

        if (xInput) xInput.value = component.x;
        if (yInput) yInput.value = component.y;
    },

    setMobilePropertyValues: function (container, component) {
        const xInput = container.querySelector('[data-property="x"]');
        const yInput = container.querySelector('[data-property="y"]');
        if (xInput) xInput.value = component.x;
        if (yInput) yInput.value = component.y;

        const widthInput = container.querySelector('[data-property="width"]');
        const heightInput = container.querySelector('[data-property="height"]');
        if (widthInput) widthInput.value = component.width;
        if (heightInput) heightInput.value = component.height;

        Object.keys(component.properties).forEach(propName => {
            const input = container.querySelector(`[data-property="${propName}"]`);
            if (!input) return;

            const propValue = component.properties[propName];

            if (input.type === 'checkbox') {
                input.checked = !!propValue;
            } else if (input.tagName === 'SELECT') {
                input.value = propValue;
            } else if (input.type === 'range') {
                input.value = propValue;
                const display = input.nextElementSibling;
                if (display && display.classList.contains('value-display')) {
                    display.textContent = util.formatNumber(propValue);
                }
            } else {
                input.value = propValue;
            }
        });

        if (component.type === 'label' && component.properties.color) {
            const colorR = container.querySelector('[data-property="color-r"]');
            const colorG = container.querySelector('[data-property="color-g"]');
            const colorB = container.querySelector('[data-property="color-b"]');
            const colorPreview = container.querySelector('.color-preview');

            if (colorR) colorR.value = component.properties.color[0];
            if (colorG) colorG.value = component.properties.color[1];
            if (colorB) colorB.value = component.properties.color[2];

            if (colorPreview) {
                const colorHex = util.rgbArrayToHex(component.properties.color);
                colorPreview.style.backgroundColor = colorHex;
            }

            const colorOptions = container.querySelectorAll('.color-option');
            colorOptions.forEach(option => {
                const colorData = option.getAttribute('data-color');
                try {
                    const colorArray = JSON.parse(colorData.replace(/'/g, '"'));
                    if (JSON.stringify(colorArray) === JSON.stringify(component.properties.color)) {
                        option.classList.add('selected');
                    }
                } catch (e) {
                    console.error('Error parsing color data', e);
                }
            });
        }

        if ((component.type === 'image' && component.properties.texture) ||
            (component.type === 'container_item_with_picture' && component.properties.picture) ||
            (component.type === 'pot' && component.properties.texture)) {

            const propName = component.type === 'container_item_with_picture' ? 'picture' : 'texture';
            const propValue = component.properties[propName];

            if (imageManager.isUploadedImage(propValue)) {
                const previewContainer = container.querySelector('.image-preview-container');
                const imagePreview = container.querySelector('.custom-image-preview');

                if (previewContainer && imagePreview) {
                    previewContainer.style.display = 'block';
                    imagePreview.style.backgroundImage = `url('${imageManager.getImageUrl(propValue)}')`;
                    imagePreview.style.backgroundSize = 'contain';
                    imagePreview.style.backgroundRepeat = 'no-repeat';
                    imagePreview.style.backgroundPosition = 'center';
                    imagePreview.style.height = '100px';
                }

                const textureInput = container.querySelector(`[data-property="${propName}"]`);
                if (textureInput && !component.properties.userEditedTexturePath) {
                    const imageName = propValue.replace('user_uploaded:', '');
                    const minecraftPath = `textures/ui/custom/${imageName}`;
                    textureInput.value = minecraftPath;
                    textureInput.setAttribute('data-original-path', propValue);
                }
            }
        }

        this.addMobileUploadButton(container, component, 'texture');
        this.addMobileUploadButton(container, component, 'picture');
    },

    addMobileUploadButton: function (container, component, propertyName) {
        if (!component.properties || !(propertyName in component.properties)) return;

        const propInput = container.querySelector(`[data-property="${propertyName}"]`);
        if (!propInput) return;

        const inputContainer = propInput.closest('.property');
        if (!inputContainer) return;

        if (inputContainer.querySelector('.upload-image-btn')) return;

        const uploadContainer = document.createElement('div');
        uploadContainer.className = 'image-upload-container';
        uploadContainer.innerHTML = `
            <button type="button" class="upload-image-btn">Upload Custom ${propertyName === 'texture' ? 'Image' : 'Picture'}</button>
            <input type="file" class="image-upload" accept="image/*" style="display:none">
        `;
        inputContainer.appendChild(uploadContainer);

        if (!inputContainer.querySelector('.image-preview-container')) {
            const previewContainer = document.createElement('div');
            previewContainer.className = 'image-preview-container';
            previewContainer.style.display = 'none';
            previewContainer.innerHTML = `
                <p>Custom ${propertyName === 'texture' ? 'image' : 'picture'}:</p>
                <div class="custom-image-preview"></div>
            `;
            inputContainer.appendChild(previewContainer);
        }
    },

    setupPropertyEventListeners: function (container) {
        const inputs = container.querySelectorAll('input, select');
        inputs.forEach(input => {
            const propName = input.getAttribute('data-property');
            if (!propName) return;

            if (input.type === 'checkbox') {
                input.addEventListener('change', (e) => {
                    const desktopInput = document.querySelector(`[data-property="${propName}"]`);
                    if (desktopInput) {
                        desktopInput.checked = e.target.checked;
                        const event = new Event('change', { bubbles: true });
                        desktopInput.dispatchEvent(event);
                    }
                });
            }
            else if (input.type === 'range') {
                input.addEventListener('input', (e) => {
                    const desktopInput = document.querySelector(`[data-property="${propName}"]`);
                    if (desktopInput) {
                        desktopInput.value = e.target.value;
                        const event = new Event('input', { bubbles: true });
                        desktopInput.dispatchEvent(event);

                        const valueDisplay = input.nextElementSibling;
                        if (valueDisplay && valueDisplay.classList.contains('value-display')) {
                            valueDisplay.textContent = util.formatNumber(e.target.value);
                        }
                    }
                });
            }
            else {
                input.addEventListener('input', (e) => {
                    const desktopInput = document.querySelector(`[data-property="${propName}"]`);
                    if (desktopInput) {
                        desktopInput.value = e.target.value;
                        const event = new Event('input', { bubbles: true });
                        desktopInput.dispatchEvent(event);
                    }
                });
            }
        });

        const colorOptions = container.querySelectorAll('.color-option');
        colorOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const desktopOption = document.querySelector(`.properties-panel .color-option[data-color='${option.getAttribute('data-color')}']`);
                if (desktopOption) {
                    desktopOption.click();
                }
            });
        });

        const uploadBtns = container.querySelectorAll('.upload-image-btn');
        uploadBtns.forEach(uploadBtn => {
            const inputContainer = uploadBtn.closest('.property');
            if (!inputContainer) return;

            const uploadInput = inputContainer.querySelector('.image-upload');
            if (!uploadInput) return;

            uploadBtn.addEventListener('click', () => {
                uploadInput.click();
            });

            uploadInput.addEventListener('change', (e) => {
                if (!this.selectedComponent || !e.target.files.length) return;

                const file = e.target.files[0];
                if (!file.type.startsWith('image/')) {
                    alert('Please select an image file.');
                    return;
                }

                const propertyInput = inputContainer.querySelector('[data-property]');
                if (!propertyInput) return;

                const propName = propertyInput.getAttribute('data-property');
                if (!propName) return;

                imageManager.storeImage(file, (imagePath) => {
                    const imageName = imagePath.replace('user_uploaded:', '');
                    const minecraftPath = `textures/ui/custom/${imageName}`;

                    propertyInput.value = minecraftPath;
                    propertyInput.setAttribute('data-original-path', imagePath);

                    this.selectedComponent.properties[propName] = imagePath;
                    this.selectedComponent.properties.userEditedTexturePath = false;

                    const previewContainer = inputContainer.querySelector('.image-preview-container');
                    const imagePreview = previewContainer?.querySelector('.custom-image-preview');

                    if (previewContainer && imagePreview) {
                        previewContainer.style.display = 'block';
                        imagePreview.style.backgroundImage = `url('${imageManager.getImageUrl(imagePath)}')`;
                        imagePreview.style.backgroundSize = 'contain';
                        imagePreview.style.backgroundRepeat = 'no-repeat';
                        imagePreview.style.backgroundPosition = 'center';
                        imagePreview.style.height = '100px';
                    }

                    editor.updateComponent(this.selectedComponent);
                });
            });
        });
    },

    createComponentsListPanel: function () {
        const drawer = document.createElement('div');
        drawer.id = 'mobile-components-list-drawer';
        drawer.className = 'mobile-components-list-drawer';

        const drawerHeader = document.createElement('div');
        drawerHeader.className = 'drawer-header';
        drawerHeader.innerHTML = '<span>Component List</span>';
        drawer.appendChild(drawerHeader);

        const listContainer = document.createElement('div');
        listContainer.id = 'mobile-components-list-container';
        listContainer.className = 'mobile-components-list-container';
        drawer.appendChild(listContainer);

        const closeButton = document.createElement('button');
        closeButton.className = 'drawer-close-button';
        closeButton.innerHTML = 'Done';
        closeButton.addEventListener('click', function () {
            drawer.classList.remove('open');

            const showListBtn = document.getElementById('mobile-list-button');
            if (showListBtn) {
                showListBtn.classList.remove('active');
            }
        });
        drawerHeader.appendChild(closeButton);

        document.querySelector('.app-container').appendChild(drawer);

        const listButton = document.createElement('button');
        listButton.id = 'mobile-list-button';
        listButton.className = 'mobile-list-button';
        listButton.innerHTML = '<i class="fas fa-list"></i>';
        listButton.addEventListener('click', () => {
            this.updateMobileComponentsList();
            drawer.classList.add('open');
            listButton.classList.add('active');
        });
        document.querySelector('.app-container').appendChild(listButton);
    },

    updateMobileComponentsList: function () {
        const container = document.getElementById('mobile-components-list-container');
        if (!container) return;

        const components = editor.getComponents();
        if (components.length === 0) {
            container.innerHTML = '<p class="no-components">No components added</p>';
            return;
        }

        container.innerHTML = '';

        components.forEach((component, index) => {
            const componentType = componentTypes[component.type];
            if (!componentType) return;

            const listItem = document.createElement('div');
            listItem.className = 'mobile-component-list-item';
            if (editor.selectedComponent && editor.selectedComponent.id === component.id) {
                listItem.classList.add('selected');
            }

            let displayInfo = '';
            if (component.type === 'label') {
                displayInfo = `"${component.properties.text.substring(0, 15)}"`;
                if (component.properties.text.length > 15) displayInfo += '...';
            } else if (component.properties.collection_index !== undefined) {
                displayInfo = `Index: ${component.properties.collection_index}`;
            }

            listItem.innerHTML = `
                <div class="item-details">
                    <span class="component-type">${componentType.name}</span>
                    <span class="component-info">${displayInfo}</span>
                    <span class="component-position">x:${component.x}, y:${component.y}</span>
                </div>
                <div class="item-actions">
                    <button class="up-button" ${index === 0 ? 'disabled' : ''}><i class="fas fa-arrow-up"></i></button>
                    <button class="down-button" ${index === components.length - 1 ? 'disabled' : ''}><i class="fas fa-arrow-down"></i></button>
                    <button class="edit-button"><i class="fas fa-edit"></i></button>
                    <button class="delete-button"><i class="fas fa-trash"></i></button>
                </div>
            `;

            const upButton = listItem.querySelector('.up-button');
            const downButton = listItem.querySelector('.down-button');
            const editButton = listItem.querySelector('.edit-button');
            const deleteButton = listItem.querySelector('.delete-button');

            upButton.addEventListener('click', () => {
                if (index > 0) {
                    editor.reorderComponent(component, -1);
                    this.updateMobileComponentsList();
                }
            });

            downButton.addEventListener('click', () => {
                if (index < components.length - 1) {
                    editor.reorderComponent(component, 1);
                    this.updateMobileComponentsList();
                }
            });

            editButton.addEventListener('click', () => {
                editor.selectComponent(component);
                if (this.propertiesDrawer) {
                    this.propertiesDrawer.classList.add('open');
                }
                document.getElementById('mobile-components-list-drawer').classList.remove('open');
                document.getElementById('mobile-list-button').classList.remove('active');
            });

            deleteButton.addEventListener('click', () => {
                if (confirm(`Delete this ${componentType.name}?`)) {
                    editor.removeComponent(component);
                    this.updateMobileComponentsList();
                }
            });

            container.appendChild(listItem);
        });
    },

    checkMobileLayout: function () {
        const isMobile = window.innerWidth < 768;
        const mobileNav = document.querySelector('.mobile-nav');
        const componentDrawer = document.getElementById('mobile-component-drawer');
        const templateDrawer = document.getElementById('mobile-templates-drawer');
        const propertiesDrawer = document.getElementById('mobile-properties-drawer');
        const componentsListDrawer = document.getElementById('mobile-components-list-drawer');
        const listButton = document.getElementById('mobile-list-button');

        if (isMobile) {
            mobileNav.style.display = 'flex';
            document.body.classList.add('mobile-view');

            if (componentDrawer) componentDrawer.style.display = 'block';
            if (templateDrawer) templateDrawer.style.display = 'block';
            if (propertiesDrawer) propertiesDrawer.style.display = 'block';
            if (componentsListDrawer) componentsListDrawer.style.display = 'block';
            if (listButton) listButton.style.display = 'block';

            document.querySelector('.sidebar').style.display = 'none';
            document.querySelector('.editor-area').style.display = 'block';
            document.querySelector('.preview-area').style.display = 'none';
            document.querySelector('.template-selector-panel').style.display = 'none';

            document.getElementById('show-components').classList.remove('active');
            document.getElementById('show-editor').classList.add('active');
            document.getElementById('show-preview').classList.remove('active');
            document.getElementById('show-templates').classList.remove('active');

            document.getElementById('show-components').innerHTML = '<i class="fas fa-th"></i> Open Components';
            document.getElementById('show-templates').innerHTML = '<i class="fas fa-layer-group"></i> Open Templates';
        } else {
            mobileNav.style.display = 'none';
            document.body.classList.remove('mobile-view');

            if (componentDrawer) componentDrawer.style.display = 'none';
            if (templateDrawer) templateDrawer.style.display = 'none';
            if (propertiesDrawer) propertiesDrawer.style.display = 'none';
            if (componentsListDrawer) componentsListDrawer.style.display = 'none';
            if (listButton) listButton.style.display = 'none';

            document.querySelector('.sidebar').style.display = 'block';
            document.querySelector('.editor-area').style.display = 'block';
            document.querySelector('.preview-area').style.display = 'block';
            document.querySelector('.template-selector-panel').style.display = 'block';

            if (this.propertiesButton) this.propertiesButton.style.display = 'none';
        }
    }
};
