const propertiesPanel = {
    
    selectedComponent: null,
    init: function() {
        this.propertiesContainer = document.getElementById('properties-container');
    },
    showPropertiesFor: function(component) {
        this.selectedComponent = component;
        
        if (!component) {
            this.propertiesContainer.innerHTML = '<p class="no-selection">No component selected</p>';
            return;
        }
        
        const componentType = componentTypes[component.type];
        if (!componentType || !componentType.template) {
            this.propertiesContainer.innerHTML = '<p>No properties available for this component</p>';
            return;
        }
        
        
        const template = document.querySelector(componentType.template);
        if (!template) {
            console.error(`Template ${componentType.template} not found`);
            return;
        }
        
        
        const fragment = document.importNode(template.content, true);
        
        
        this.setInputValues(fragment, component);
        
        
        this.setupEventListeners(fragment, component);
        
        
        this.propertiesContainer.innerHTML = '';
        this.propertiesContainer.appendChild(fragment);
    },
    setInputValues: function(fragment, component) {
        
        const xInput = fragment.querySelector('[data-property="x"]');
        const yInput = fragment.querySelector('[data-property="y"]');
        
        if (xInput) xInput.value = component.x;
        if (yInput) yInput.value = component.y;
        
        
        const widthInput = fragment.querySelector('[data-property="width"]');
        const heightInput = fragment.querySelector('[data-property="height"]');
        
        if (widthInput) widthInput.value = component.width;
        if (heightInput) heightInput.value = component.height;
        
        
        Object.keys(component.properties).forEach(propName => {
            const input = fragment.querySelector(`[data-property="${propName}"]`);
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
        
        
        if (component.properties.color) {
            const colorOptions = fragment.querySelectorAll('.color-option');
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
        
        if (component.type === 'label' && component.properties.color) {
            const colorR = fragment.querySelector('[data-property="color-r"]');
            const colorG = fragment.querySelector('[data-property="color-g"]');
            const colorB = fragment.querySelector('[data-property="color-b"]');
            const colorPreview = fragment.querySelector('.color-preview');
            
            if (colorR) colorR.value = component.properties.color[0];
            if (colorG) colorG.value = component.properties.color[1];
            if (colorB) colorB.value = component.properties.color[2];
            
            if (colorPreview) {
                const colorHex = util.rgbArrayToHex(component.properties.color);
                colorPreview.style.backgroundColor = colorHex;
            }
        }
    },

    setupEventListeners: function(fragment, component) {
         const xInput = fragment.querySelector('[data-property="x"]');
        const yInput = fragment.querySelector('[data-property="y"]');
        
        if (xInput) {
            xInput.addEventListener('input', e => {
                component.x = parseInt(e.target.value) || 0;
                editor.updateComponentPosition(component);
            });
        }
        
        if (yInput) {
            yInput.addEventListener('input', e => {
                component.y = parseInt(e.target.value) || 0;
                editor.updateComponentPosition(component);
            });
        }
        
         const widthInput = fragment.querySelector('[data-property="width"]');
        const heightInput = fragment.querySelector('[data-property="height"]');
        
        if (widthInput) {
            widthInput.addEventListener('input', e => {
                component.width = parseInt(e.target.value) || componentTypes[component.type].defaultWidth;
                editor.updateComponent(component);
            });
        }
        
        if (heightInput) {
            heightInput.addEventListener('input', e => {
                component.height = parseInt(e.target.value) || componentTypes[component.type].defaultHeight;
                editor.updateComponent(component);
            });
        }
        
         const propertyInputs = fragment.querySelectorAll('[data-property]');
        propertyInputs.forEach(input => {
            const propName = input.getAttribute('data-property');
            if (propName === 'x' || propName === 'y' || propName === 'width' || propName === 'height') {
                return;
            }
            
            if (input.type === 'checkbox') {
                input.addEventListener('change', e => {
                    component.properties[propName] = e.target.checked;
                    editor.updateComponent(component);
                });
            } else if (input.tagName === 'SELECT') {
                input.addEventListener('change', e => {
                    component.properties[propName] = e.target.value;
                    editor.updateComponent(component);
                });
            } else if (input.type === 'range') {
                input.addEventListener('input', e => {
                    const value = parseFloat(e.target.value);
                    component.properties[propName] = value;
                    const display = input.nextElementSibling;
                    if (display && display.classList.contains('value-display')) {
                        display.textContent = util.formatNumber(value);
                    }
                    editor.updateComponent(component);
                });
            } else {
                input.addEventListener('input', e => {
                    component.properties[propName] = e.target.value;
                    editor.updateComponent(component);
                });
            }
        });
        
         const colorOptions = fragment.querySelectorAll('.color-option');
        colorOptions.forEach(option => {
            option.addEventListener('click', e => {
                colorOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                
                const colorData = option.getAttribute('data-color');
                try {
                    component.properties.color = JSON.parse(colorData.replace(/'/g, '"'));
                    editor.updateComponent(component);
                } catch (e) {
                    console.error('Error parsing color data', e);
                }
            });
        });
        
         if (component.type === 'label') {
            const colorR = fragment.querySelector('[data-property="color-r"]');
            const colorG = fragment.querySelector('[data-property="color-g"]');
            const colorB = fragment.querySelector('[data-property="color-b"]');
            const colorPreview = fragment.querySelector('.color-preview');
            
            const updateColor = () => {
                const r = parseFloat(colorR.value) || 0;
                const g = parseFloat(colorG.value) || 0;
                const b = parseFloat(colorB.value) || 0;
                
                component.properties.color = [r, g, b];
                
                 if (colorPreview) {
                    const colorHex = util.rgbArrayToHex(component.properties.color);
                    colorPreview.style.backgroundColor = colorHex;
                }
                
                 editor.updateComponent(component);
            };
            
            if (colorR) colorR.addEventListener('input', updateColor);
            if (colorG) colorG.addEventListener('input', updateColor);
            if (colorB) colorB.addEventListener('input', updateColor);
            
             const colorOptions = fragment.querySelectorAll('.color-option');
            colorOptions.forEach(option => {
                option.addEventListener('click', e => {
                    
                     if (colorR) colorR.value = component.properties.color[0];
                    if (colorG) colorG.value = component.properties.color[1];
                    if (colorB) colorB.value = component.properties.color[2];
                    
                     if (colorPreview) {
                        const colorHex = util.rgbArrayToHex(component.properties.color);
                        colorPreview.style.backgroundColor = colorHex;
                    }
                });
            });
        }
    },
    
    clear: function() {
        this.selectedComponent = null;
        this.propertiesContainer.innerHTML = '<p class="no-selection">No component selected</p>';
    }
};
