const mobile = {
    selectedComponentType: null,
    
    init: function() {
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
        this.createPropertiesButton();
        
        showComponentsBtn.addEventListener('click', function() {
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
        
        showEditorBtn.addEventListener('click', function() {
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
        
        showPreviewBtn.addEventListener('click', function() {
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
        
        showTemplatesBtn.addEventListener('click', function() {
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
    
    createFloatingComponentPanel: function() {
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
        closeButton.addEventListener('click', function() {
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
    
    handleComponentSelect: function(e) {
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
    
    handleCanvasTap: function(e) {
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
    
    createFloatingTemplatesPanel: function() {
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
        closeButton.addEventListener('click', function() {
            drawer.classList.remove('open');
            const showTemplatesBtn = document.getElementById('show-templates');
            if (showTemplatesBtn) {
                showTemplatesBtn.innerHTML = '<i class="fas fa-layer-group"></i> Open Templates';
            }
        });
        drawer.querySelector('.drawer-header').appendChild(closeButton);
    },

    handleTemplateSelection: function(templateItem) {
        const templateName = templateItem.getAttribute('data-template');
        
        templateItem.classList.add('template-selected');
        setTimeout(() => {
            templateItem.classList.remove('template-selected');
        }, 300);
        
        if (templateName) {
            console.log('Mobile template selection:', templateName);
            
            if (window.templates && typeof window.templates.loadTemplate === 'function') {
                try {
                    window.templates.loadTemplate(templateName);
                    console.log('Template loaded successfully');
                    
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
                        console.log('Triggering click on original template item');
                        originalTemplate.click();
                    }
                }
            } else {
                console.error('Templates object or loadTemplate function not available');
                
                const originalTemplate = document.querySelector(`.template-selector-panel .template-item[data-template="${templateName}"]`);
                if (originalTemplate) {
                    console.log('Triggering click on original template item');
                    originalTemplate.click();
                }
            }
        }
    },
    
    createPropertiesButton: function() {
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
    
    createFloatingPropertiesPanel: function() {
        const drawer = document.createElement('div');
        drawer.id = 'mobile-properties-drawer';
        drawer.className = 'mobile-properties-drawer';
        
        const drawerHeader = document.createElement('div');
        drawerHeader.className = 'drawer-header';
        drawerHeader.innerHTML = '<span>Properties</span>';
        drawer.appendChild(drawerHeader);
        
        const propertiesContainer = document.createElement('div');
        propertiesContainer.id = 'mobile-properties-container';
        propertiesContainer.className = 'mobile-properties-container';
        propertiesContainer.innerHTML = '<p class="no-selection">No component selected</p>';
        drawer.appendChild(propertiesContainer);
        
        const closeButton = document.createElement('button');
        closeButton.className = 'drawer-close-button';
        closeButton.innerHTML = 'Done';
        closeButton.addEventListener('click', function() {
            drawer.classList.remove('open');
        });
        drawerHeader.appendChild(closeButton);
        
        document.querySelector('.app-container').appendChild(drawer);
        
        this.propertiesDrawer = drawer;
        this.propertiesContainer = propertiesContainer;
        this.propertiesDrawerHeader = drawerHeader;
        
        const originalSelectComponent = editor.selectComponent;
        editor.selectComponent = function(component) {
            originalSelectComponent.call(editor, component);
            
            if (window.innerWidth < 768) {
                if (mobile.propertiesButton) {
                    mobile.propertiesButton.style.display = 'none';
                }
                
                if (component) {
                    console.log('Component selected on mobile, showing properties button');
                    
                    // Show the button at the bottom of the screen instead of next to the component
                    if (mobile.propertiesButton) {
                        mobile.propertiesButton.style.display = 'flex';
                        // No need to position relative to the component anymore
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
        editor.updateComponentPosition = function(component) {
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

    updateMobilePropertyValues: function(component) {
        if (!this.propertiesContainer || !component) return;
        
        const xInput = this.propertiesContainer.querySelector('[data-property="x"]');
        const yInput = this.propertiesContainer.querySelector('[data-property="y"]');
        
        if (xInput) xInput.value = component.x;
        if (yInput) yInput.value = component.y;
    },

    setMobilePropertyValues: function(container, component) {
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
    },

    setupPropertyEventListeners: function(container) {
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
    },
    
    checkMobileLayout: function() {
        const isMobile = window.innerWidth < 768;
        const mobileNav = document.querySelector('.mobile-nav');
        const componentDrawer = document.getElementById('mobile-component-drawer');
        const templateDrawer = document.getElementById('mobile-templates-drawer');
        const propertiesDrawer = document.getElementById('mobile-properties-drawer');
        
        if (isMobile) {
            mobileNav.style.display = 'flex';
            document.body.classList.add('mobile-view');
            
            if (componentDrawer) componentDrawer.style.display = 'block';
            if (templateDrawer) templateDrawer.style.display = 'block';
            if (propertiesDrawer) propertiesDrawer.style.display = 'block';
            
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
            
            document.querySelector('.sidebar').style.display = 'block';
            document.querySelector('.editor-area').style.display = 'block';
            document.querySelector('.preview-area').style.display = 'block';
            document.querySelector('.template-selector-panel').style.display = 'block';
            
            if (this.propertiesButton) this.propertiesButton.style.display = 'none';
        }
    }
};
