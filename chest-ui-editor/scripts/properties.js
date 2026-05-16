const propertiesPanel = {

    selectedComponent: null,
    container: null,
    init: function () {
        this.container = document.getElementById('properties-container');
        this.propertiesContainer = this.container;  // Keep backward compatibility
    },
    showMultiSelectProperties: function (components) {
        if (!this.container) return;
        
        this.container.innerHTML = '';
        
        if (!components || components.length === 0) {
            this.container.innerHTML = '<p class="no-selection">No component selected</p>';
            return;
        }

        const info = document.createElement('div');
        info.className = 'multi-select-info';
        info.innerHTML = `
            <h4>Multiple Components Selected</h4>
            <p>${components.length} components selected</p>
            <p class="help-text">Use arrow keys to move all selected components by 1px. Click on canvas to deselect.</p>
        `;
        this.container.appendChild(info);
    },
    showPropertiesFor: function (component) {
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
    setInputValues: function (fragment, component) {

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
            if (propName === 'slot_highlight_texture' && propValue === 'textures/ui/slot_highlight') {
                component.properties[propName] = defaultSlotTextures.highlight;
            }

            if (input.type === 'checkbox') {
                input.checked = !!component.properties[propName];
            } else if (input.tagName === 'SELECT') {
                input.value = component.properties[propName];
            } else if (input.type === 'range') {
                input.value = component.properties[propName];
                const display = input.nextElementSibling;
                if (display && display.classList.contains('value-display')) {
                    display.textContent = util.formatNumber(component.properties[propName]);
                }
            } else {
                input.value = component.properties[propName];
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

        if ((component.type === 'button' || component.type === 'tab') && component.properties.label_color) {
            const colorR = fragment.querySelector('[data-property="label_color-r"]');
            const colorG = fragment.querySelector('[data-property="label_color-g"]');
            const colorB = fragment.querySelector('[data-property="label_color-b"]');
            const colorPreview = fragment.querySelector('.button-label-color-preview');

            if (colorR) colorR.value = component.properties.label_color[0];
            if (colorG) colorG.value = component.properties.label_color[1];
            if (colorB) colorB.value = component.properties.label_color[2];

            if (colorPreview) {
                const colorHex = util.rgbArrayToHex(component.properties.label_color);
                colorPreview.style.backgroundColor = colorHex;
            }
        }
    },

    setupEventListeners: function (fragment, component) {
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
            if (propName === 'x' || propName === 'y' || propName === 'width' || propName === 'height' ||
                propName.startsWith('label_color-')) {
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

        if (component.type === 'label') {
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
        }

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

        if (component.type === 'button') {
            const colorR = fragment.querySelector('[data-property="label_color-r"]');
            const colorG = fragment.querySelector('[data-property="label_color-g"]');
            const colorB = fragment.querySelector('[data-property="label_color-b"]');
            const colorPreview = fragment.querySelector('.button-label-color-preview');

            const updateButtonLabelColor = () => {
                const r = parseFloat(colorR?.value) || 0;
                const g = parseFloat(colorG?.value) || 0;
                const b = parseFloat(colorB?.value) || 0;

                component.properties.label_color = [r, g, b];

                if (colorPreview) {
                    const colorHex = util.rgbArrayToHex(component.properties.label_color);
                    colorPreview.style.backgroundColor = colorHex;
                }

                editor.updateComponent(component);
            };

            if (colorR) colorR.addEventListener('input', updateButtonLabelColor);
            if (colorG) colorG.addEventListener('input', updateButtonLabelColor);
            if (colorB) colorB.addEventListener('input', updateButtonLabelColor);

            const colorOptions = fragment.querySelectorAll('.button-label-color-picker .color-option');
            colorOptions.forEach(option => {
                option.addEventListener('click', e => {
                    const colorData = option.getAttribute('data-color');
                    try {
                        component.properties.label_color = JSON.parse(colorData.replace(/'/g, '"'));

                        if (colorR) colorR.value = component.properties.label_color[0];
                        if (colorG) colorG.value = component.properties.label_color[1];
                        if (colorB) colorB.value = component.properties.label_color[2];

                        if (colorPreview) {
                            const colorHex = util.rgbArrayToHex(component.properties.label_color);
                            colorPreview.style.backgroundColor = colorHex;
                        }

                        editor.updateComponent(component);
                    } catch (e) {
                        console.error('Error parsing color data', e);
                    }
                });
            });
        }

        if (component.type === 'image') {
            const uploadBtn = fragment.querySelector('.upload-image-btn');
            const uploadInput = fragment.querySelector('#image-upload');
            const previewContainer = fragment.querySelector('.image-preview-container');
            const imagePreview = fragment.querySelector('.custom-image-preview');
            const textureInput = fragment.querySelector('[data-property="texture"]');

            if (component.properties.texture && imageManager.isUploadedImage(component.properties.texture)) {
                previewContainer.style.display = 'block';
                imagePreview.style.backgroundImage = `url('${imageManager.getImageUrl(component.properties.texture)}')`;
                imagePreview.style.backgroundSize = 'contain';
                imagePreview.style.backgroundRepeat = 'no-repeat';
                imagePreview.style.backgroundPosition = 'center';
                imagePreview.style.height = '100px';

                if (textureInput && !component.properties.userEditedTexturePath) {
                    const imageName = component.properties.texture.replace('user_uploaded:', '');
                    const minecraftPath = `textures/ui/custom/${imageName}`;
                    textureInput.value = minecraftPath;
                    textureInput.setAttribute('data-original-path', component.properties.texture);
                }
            }

            if (textureInput) {
                textureInput.addEventListener('change', e => {
                    const newTexturePath = e.target.value.trim();
                    const originalPath = textureInput.getAttribute('data-original-path');

                    if (originalPath && newTexturePath !== originalPath &&
                        !newTexturePath.startsWith('user_uploaded:')) {
                        component.properties.userEditedTexturePath = true;
                        component.properties.texture = newTexturePath;
                        textureInput.removeAttribute('data-original-path');
                    } else {
                        component.properties.texture = newTexturePath;
                    }

                    if (imageManager.isUploadedImage(component.properties.texture)) {
                        if (previewContainer && imagePreview) {
                            previewContainer.style.display = 'block';
                            imagePreview.style.backgroundImage = `url('${imageManager.getImageUrl(component.properties.texture)}')`;
                            imagePreview.style.backgroundSize = 'contain';
                            imagePreview.style.backgroundRepeat = 'no-repeat';
                            imagePreview.style.backgroundPosition = 'center';
                        }
                    } else {
                        if (previewContainer) {
                            previewContainer.style.display = 'none';
                        }
                    }

                    editor.updateComponent(component);
                });
            }

            if (uploadBtn) {

                if (uploadBtn._clickHandler) {
                    uploadBtn.removeEventListener('click', uploadBtn._clickHandler);
                }


                uploadBtn._clickHandler = function () {
                    uploadInput.click();
                };


                uploadBtn.addEventListener('click', uploadBtn._clickHandler);
            }

            if (uploadInput) {

                if (uploadInput._changeHandler) {
                    uploadInput.removeEventListener('change', uploadInput._changeHandler);
                }


                uploadInput._changeHandler = function (e) {
                    if (e.target.files.length > 0) {
                        const file = e.target.files[0];
                        if (!file.type.startsWith('image/')) {
                            alert('Please select an image file.');
                            return;
                        }

                        imageManager.storeImage(file, (imagePath) => {
                            const imageName = imagePath.replace('user_uploaded:', '');
                            const minecraftPath = `textures/ui/custom/${imageName}`;

                            textureInput.value = minecraftPath;
                            textureInput.setAttribute('data-original-path', imagePath);

                            component.properties.userEditedTexturePath = false;
                            component.properties.texture = imagePath;

                            if (previewContainer && imagePreview) {
                                previewContainer.style.display = 'block';
                                imagePreview.style.backgroundImage = `url('${imageManager.getImageUrl(imagePath)}')`;
                                imagePreview.style.backgroundSize = 'contain';
                                imagePreview.style.backgroundRepeat = 'no-repeat';
                                imagePreview.style.backgroundPosition = 'center';
                                imagePreview.style.height = '100px';
                            }

                            editor.updateComponent(component);
                        });
                    }
                };


                uploadInput.addEventListener('change', uploadInput._changeHandler);


                uploadInput._hasChangeHandler = true;
            }


            this.setupTextureUpload(fragment, component, 'picture');
            this.setupTextureUpload(fragment, component, 'slot_background_texture');
            this.setupTextureUpload(fragment, component, 'slot_selected_texture');
            this.setupTextureUpload(fragment, component, 'slot_highlight_texture');
        } else if (component.type === 'button') {
            const targetSelect = fragment.querySelector('[data-property="target_collection_index"]');
            const targetIndexInput = fragment.querySelector('.target-slot-index-input');
            if (targetSelect && targetIndexInput) {
                const indexes = [...new Set(editor.getComponents()
                    .filter(current => current.id !== component.id && current.properties && 'collection_index' in current.properties)
                    .map(current => Number(current.properties.collection_index))
                    .filter(index => Number.isFinite(index) && index >= 0))]
                    .sort((a, b) => a - b);

                const currentTarget = Number(component.properties.target_collection_index) || 0;
                targetSelect.innerHTML = indexes.length
                    ? indexes.map(index => `<option value="${index}">Slot ${index}</option>`).join('')
                    : '<option value="">No slots</option>';
                targetSelect.value = indexes.includes(currentTarget) ? String(currentTarget) : '';
                targetIndexInput.value = String(currentTarget);

                targetSelect.addEventListener('change', e => {
                    if (e.target.value === '') return;

                    component.properties.target_collection_index = Number(e.target.value);
                    targetIndexInput.value = e.target.value;
                    editor.updateComponent(component);
                });

                targetIndexInput.addEventListener('input', e => {
                    const value = Math.max(0, parseInt(e.target.value, 10) || 0);
                    component.properties.target_collection_index = value;
                    targetSelect.value = indexes.includes(value) ? String(value) : '';
                    editor.updateComponent(component);
                });
            }

            this.setupTextureUpload(fragment, component, 'default_texture');
            this.setupTextureUpload(fragment, component, 'hover_texture');
            this.setupTextureUpload(fragment, component, 'pressed_texture');
            this.setupTextureUpload(fragment, component, 'image_texture');
        } else if (component.type === 'close_button') {
            // Setup texture upload for all three close button textures
            this.setupTextureUpload(fragment, component, 'default_texture');
            this.setupTextureUpload(fragment, component, 'hover_texture');
            this.setupTextureUpload(fragment, component, 'pressed_texture');
            
            // Update component background images based on texture properties
            const updateCloseButtonTextures = () => {
                const editorElement = document.querySelector(`[data-id="${component.id}"].editor-component.close-button`);
                const previewElement = document.querySelector(`[data-id="${component.id}"].preview-component.close-button`);
                
                // Convert texture paths to URLs for display
                const getDisplayUrl = (texturePath) => {
                    if (texturePath.startsWith('textures/ui/')) {
                        let filename;
                        if (texturePath.includes('hover')) {
                            filename = 'close_button_hover';
                        } else if (texturePath.includes('pressed')) {
                            filename = 'close_button_pressed';
                        } else {
                            filename = 'close_button_default';
                        }
                        return `https://raw.githubusercontent.com/Mojang/bedrock-samples/main/resource_pack/textures/ui/${filename}.png`;
                    } else if (texturePath.startsWith('user_uploaded:')) {
                        // Handle uploaded images
                        return imageManager.getImageUrl(texturePath);
                    }
                    return texturePath;
                };
                
                if (editorElement) {
                    editorElement.style.imageRendering = 'pixelated';
                    editorElement.style.backgroundImage = `url('${getDisplayUrl(component.properties.default_texture)}')`;
                    editorElement.addEventListener('mouseenter', () => {
                        editorElement.style.backgroundImage = `url('${getDisplayUrl(component.properties.hover_texture)}')`;
                    });
                    editorElement.addEventListener('mouseleave', () => {
                        editorElement.style.backgroundImage = `url('${getDisplayUrl(component.properties.default_texture)}')`;
                    });
                    editorElement.addEventListener('mousedown', () => {
                        editorElement.style.backgroundImage = `url('${getDisplayUrl(component.properties.pressed_texture)}')`;
                    });
                    editorElement.addEventListener('mouseup', () => {
                        editorElement.style.backgroundImage = `url('${getDisplayUrl(component.properties.hover_texture)}')`;
                    });
                }
                
                if (previewElement) {
                    previewElement.style.imageRendering = 'pixelated';
                    previewElement.style.backgroundImage = `url('${getDisplayUrl(component.properties.default_texture)}')`;
                }
            };
            
            // Initial texture update
            updateCloseButtonTextures();
            
            // Handle initial display of uploaded images
            ['default_texture', 'hover_texture', 'pressed_texture'].forEach(textureProp => {
                const textureInput = fragment.querySelector(`[data-property="${textureProp}"]`);
                if (textureInput && component.properties[textureProp] && imageManager.isUploadedImage(component.properties[textureProp])) {
                    const inputContainer = textureInput.closest('.property');
                    const previewContainer = inputContainer.querySelector('.image-preview-container');
                    const imagePreview = previewContainer?.querySelector('.custom-image-preview');
                    
                    if (previewContainer && imagePreview) {
                        previewContainer.style.display = 'block';
                        imagePreview.style.backgroundImage = `url('${imageManager.getImageUrl(component.properties[textureProp])}')`;
                        imagePreview.style.backgroundSize = 'contain';
                        imagePreview.style.backgroundRepeat = 'no-repeat';
                        imagePreview.style.backgroundPosition = 'center';
                        imagePreview.style.height = '100px';
                    }
                    
                    if (!component.properties[`userEdited${textureProp}Path`]) {
                        const imageName = component.properties[textureProp].replace('user_uploaded:', '');
                        const minecraftPath = `textures/ui/custom/${imageName}`;
                        textureInput.value = minecraftPath;
                        textureInput.setAttribute('data-original-path', component.properties[textureProp]);
                    }
                }
                
                // Add change listener to update textures when changed
                if (textureInput) {
                    textureInput.addEventListener('input', () => {
                        updateCloseButtonTextures();
                    });
                }
            });
        } else if (component.type === 'tab') {
            const colorR = fragment.querySelector('[data-property="label_color-r"]');
            const colorG = fragment.querySelector('[data-property="label_color-g"]');
            const colorB = fragment.querySelector('[data-property="label_color-b"]');
            const colorPreview = fragment.querySelector('.button-label-color-preview');

            const updateTabLabelColor = () => {
                const r = parseFloat(colorR?.value) || 0;
                const g = parseFloat(colorG?.value) || 0;
                const b = parseFloat(colorB?.value) || 0;

                component.properties.label_color = [r, g, b];

                if (colorPreview) {
                    colorPreview.style.backgroundColor = util.rgbArrayToHex(component.properties.label_color);
                }

                editor.updateComponent(component);
            };

            if (colorR) colorR.addEventListener('input', updateTabLabelColor);
            if (colorG) colorG.addEventListener('input', updateTabLabelColor);
            if (colorB) colorB.addEventListener('input', updateTabLabelColor);

            const colorOptions = fragment.querySelectorAll('.button-label-color-picker .color-option');
            colorOptions.forEach(option => {
                option.addEventListener('click', () => {
                    const colorData = option.getAttribute('data-color');
                    try {
                        component.properties.label_color = JSON.parse(colorData.replace(/'/g, '"'));

                        if (colorR) colorR.value = component.properties.label_color[0];
                        if (colorG) colorG.value = component.properties.label_color[1];
                        if (colorB) colorB.value = component.properties.label_color[2];

                        if (colorPreview) {
                            colorPreview.style.backgroundColor = util.rgbArrayToHex(component.properties.label_color);
                        }

                        editor.updateComponent(component);
                    } catch (error) {
                        console.error('Error parsing color data', error);
                    }
                });
            });

            this.setupTextureUpload(fragment, component, 'default_texture');
            this.setupTextureUpload(fragment, component, 'hover_texture');
            this.setupTextureUpload(fragment, component, 'pressed_texture');
        } else if (component.type === 'dynamic_grid') {
            // Handle show_background checkbox toggle to control scroll background texture visibility
            const showBackgroundCheckbox = fragment.querySelector('[data-property="show_background"]');
            const scrollBgTextureProperty = fragment.querySelector('[data-property="scroll_background_image_texture"]').closest('.property');
            
            if (showBackgroundCheckbox && scrollBgTextureProperty) {
                // Set initial state
                const isBackgroundVisible = component.properties.show_background !== false;
                scrollBgTextureProperty.style.display = isBackgroundVisible ? 'block' : 'none';
                
                // Add change handler
                showBackgroundCheckbox.addEventListener('change', e => {
                    const isVisible = e.target.checked;
                    scrollBgTextureProperty.style.display = isVisible ? 'block' : 'none';
                    
                    // Also control upload button and preview container visibility
                    const scrollBgUploadBtn = fragment.querySelector('.upload-scroll-bg-btn');
                    const scrollBgPreviewContainer = fragment.querySelector('.scroll-bg-preview-container');
                    
                    if (scrollBgUploadBtn) scrollBgUploadBtn.style.display = isVisible ? 'block' : 'none';
                    if (scrollBgPreviewContainer) scrollBgPreviewContainer.style.display = isVisible ? 'block' : 'none';
                    
                    component.properties.show_background = isVisible;
                    editor.updateComponent(component);
                });
            }
            
            const scrollRailUploadBtn = fragment.querySelector('.upload-scroll-rail-btn');
            const scrollRailUploadInput = fragment.querySelector('#scroll-rail-upload');
            const scrollRailPreviewContainer = fragment.querySelector('.scroll-rail-preview-container');
            const scrollRailPreview = fragment.querySelector('.custom-scroll-rail-preview');
            const scrollRailTextureInput = fragment.querySelector('[data-property="scroll_indent_image_texture"]');

            const scrollHandleUploadBtn = fragment.querySelector('.upload-scroll-handle-btn');
            const scrollHandleUploadInput = fragment.querySelector('#scroll-handle-upload');
            const scrollHandlePreviewContainer = fragment.querySelector('.scroll-handle-preview-container');
            const scrollHandlePreview = fragment.querySelector('.custom-scroll-handle-preview');
            const scrollHandleTextureInput = fragment.querySelector('[data-property="scrollbar_box_image_texture"]');

            // Handle scroll rail texture upload
            if (scrollRailUploadBtn && scrollRailUploadInput && scrollRailPreviewContainer && scrollRailPreview) {
                if (component.properties.scroll_indent_image_texture && imageManager.isUploadedImage(component.properties.scroll_indent_image_texture)) {
                    scrollRailPreviewContainer.style.display = 'block';
                    scrollRailPreview.style.backgroundImage = `url('${imageManager.getImageUrl(component.properties.scroll_indent_image_texture)}')`;
                    scrollRailPreview.style.backgroundSize = 'contain';
                    scrollRailPreview.style.backgroundRepeat = 'no-repeat';
                    scrollRailPreview.style.backgroundPosition = 'center';
                    scrollRailPreview.style.height = '40px';

                    if (scrollRailTextureInput && !component.properties.userEditedScrollRailTexturePath) {
                        const imageName = component.properties.scroll_indent_image_texture.replace('user_uploaded:', '');
                        const minecraftPath = `textures/ui/custom/${imageName}`;
                        scrollRailTextureInput.value = minecraftPath;
                        scrollRailTextureInput.setAttribute('data-original-path', component.properties.scroll_indent_image_texture);
                    }
                }

                if (scrollRailUploadBtn._clickHandler) {
                    scrollRailUploadBtn.removeEventListener('click', scrollRailUploadBtn._clickHandler);
                }

                scrollRailUploadBtn._clickHandler = function () {
                    scrollRailUploadInput.click();
                };

                scrollRailUploadBtn.addEventListener('click', scrollRailUploadBtn._clickHandler);
            }

            if (scrollRailUploadInput) {
                if (scrollRailUploadInput._changeHandler) {
                    scrollRailUploadInput.removeEventListener('change', scrollRailUploadInput._changeHandler);
                }

                scrollRailUploadInput._changeHandler = function (e) {
                    if (e.target.files.length > 0) {
                        const file = e.target.files[0];
                        if (!file.type.startsWith('image/')) {
                            alert('Please select an image file.');
                            return;
                        }

                        imageManager.storeImage(file, (imagePath) => {
                            const imageName = imagePath.replace('user_uploaded:', '');
                            const minecraftPath = `textures/ui/custom/${imageName}`;

                            scrollRailTextureInput.value = minecraftPath;
                            scrollRailTextureInput.setAttribute('data-original-path', imagePath);

                            component.properties.userEditedScrollRailTexturePath = false;
                            component.properties.scroll_indent_image_texture = imagePath;

                            if (scrollRailPreviewContainer && scrollRailPreview) {
                                scrollRailPreviewContainer.style.display = 'block';
                                scrollRailPreview.style.backgroundImage = `url('${imageManager.getImageUrl(imagePath)}')`;
                                scrollRailPreview.style.backgroundSize = 'contain';
                                scrollRailPreview.style.backgroundRepeat = 'no-repeat';
                                scrollRailPreview.style.backgroundPosition = 'center';
                                scrollRailPreview.style.height = '40px';
                            }

                            editor.updateComponent(component);
                        });
                    }
                };

                scrollRailUploadInput.addEventListener('change', scrollRailUploadInput._changeHandler);
                scrollRailUploadInput._hasChangeHandler = true;
            }

            // Handle scroll handle texture upload
            if (scrollHandleUploadBtn && scrollHandleUploadInput && scrollHandlePreviewContainer && scrollHandlePreview) {
                if (component.properties.scrollbar_box_image_texture && imageManager.isUploadedImage(component.properties.scrollbar_box_image_texture)) {
                    scrollHandlePreviewContainer.style.display = 'block';
                    scrollHandlePreview.style.backgroundImage = `url('${imageManager.getImageUrl(component.properties.scrollbar_box_image_texture)}')`;
                    scrollHandlePreview.style.backgroundSize = 'contain';
                    scrollHandlePreview.style.backgroundRepeat = 'no-repeat';
                    scrollHandlePreview.style.backgroundPosition = 'center';
                    scrollHandlePreview.style.height = '40px';

                    if (scrollHandleTextureInput && !component.properties.userEditedScrollHandleTexturePath) {
                        const imageName = component.properties.scrollbar_box_image_texture.replace('user_uploaded:', '');
                        const minecraftPath = `textures/ui/custom/${imageName}`;
                        scrollHandleTextureInput.value = minecraftPath;
                        scrollHandleTextureInput.setAttribute('data-original-path', component.properties.scrollbar_box_image_texture);
                    }
                }

                if (scrollHandleUploadBtn._clickHandler) {
                    scrollHandleUploadBtn.removeEventListener('click', scrollHandleUploadBtn._clickHandler);
                }

                scrollHandleUploadBtn._clickHandler = function () {
                    scrollHandleUploadInput.click();
                };

                scrollHandleUploadBtn.addEventListener('click', scrollHandleUploadBtn._clickHandler);
            }

            if (scrollHandleUploadInput) {
                if (scrollHandleUploadInput._changeHandler) {
                    scrollHandleUploadInput.removeEventListener('change', scrollHandleUploadInput._changeHandler);
                }

                scrollHandleUploadInput._changeHandler = function (e) {
                    if (e.target.files.length > 0) {
                        const file = e.target.files[0];
                        if (!file.type.startsWith('image/')) {
                            alert('Please select an image file.');
                            return;
                        }

                        imageManager.storeImage(file, (imagePath) => {
                            const imageName = imagePath.replace('user_uploaded:', '');
                            const minecraftPath = `textures/ui/custom/${imageName}`;

                            scrollHandleTextureInput.value = minecraftPath;
                            scrollHandleTextureInput.setAttribute('data-original-path', imagePath);

                            component.properties.userEditedScrollHandleTexturePath = false;
                            component.properties.scrollbar_box_image_texture = imagePath;

                            if (scrollHandlePreviewContainer && scrollHandlePreview) {
                                scrollHandlePreviewContainer.style.display = 'block';
                                scrollHandlePreview.style.backgroundImage = `url('${imageManager.getImageUrl(imagePath)}')`;
                                scrollHandlePreview.style.backgroundSize = 'contain';
                                scrollHandlePreview.style.backgroundRepeat = 'no-repeat';
                                scrollHandlePreview.style.backgroundPosition = 'center';
                                scrollHandlePreview.style.height = '40px';
                            }

                            editor.updateComponent(component);
                        });
                    }
                };

                scrollHandleUploadInput.addEventListener('change', scrollHandleUploadInput._changeHandler);
                scrollHandleUploadInput._hasChangeHandler = true;
            }

            // Handle scroll background texture upload
            const scrollBgUploadBtn = fragment.querySelector('.upload-scroll-bg-btn');
            const scrollBgUploadInput = fragment.querySelector('#scroll-bg-upload');
            const scrollBgPreviewContainer = fragment.querySelector('.scroll-bg-preview-container');
            const scrollBgPreview = fragment.querySelector('.custom-scroll-bg-preview');
            const scrollBgTextureInput = fragment.querySelector('[data-property="scroll_background_image_texture"]');

            // Set initial visibility based on show_background checkbox
            const isBackgroundVisible = component.properties.show_background !== false;
            if (scrollBgUploadBtn) scrollBgUploadBtn.style.display = isBackgroundVisible ? 'block' : 'none';
            if (scrollBgPreviewContainer) scrollBgPreviewContainer.style.display = isBackgroundVisible ? 'block' : 'none';

            if (scrollBgUploadBtn && scrollBgUploadInput && scrollBgPreviewContainer && scrollBgPreview) {
                if (component.properties.scroll_background_image_texture && imageManager.isUploadedImage(component.properties.scroll_background_image_texture)) {
                    scrollBgPreviewContainer.style.display = 'block';
                    scrollBgPreview.style.backgroundImage = `url('${imageManager.getImageUrl(component.properties.scroll_background_image_texture)}')`;
                    scrollBgPreview.style.backgroundSize = 'contain';
                    scrollBgPreview.style.backgroundRepeat = 'no-repeat';
                    scrollBgPreview.style.backgroundPosition = 'center';
                    scrollBgPreview.style.height = '40px';

                    if (scrollBgTextureInput && !component.properties.userEditedScrollBgTexturePath) {
                        const imageName = component.properties.scroll_background_image_texture.replace('user_uploaded:', '');
                        const minecraftPath = `textures/ui/custom/${imageName}`;
                        scrollBgTextureInput.value = minecraftPath;
                        scrollBgTextureInput.setAttribute('data-original-path', component.properties.scroll_background_image_texture);
                    }
                }

                if (scrollBgUploadBtn._clickHandler) {
                    scrollBgUploadBtn.removeEventListener('click', scrollBgUploadBtn._clickHandler);
                }

                scrollBgUploadBtn._clickHandler = function () {
                    scrollBgUploadInput.click();
                };

                scrollBgUploadBtn.addEventListener('click', scrollBgUploadBtn._clickHandler);
            }

            if (scrollBgUploadInput) {
                if (scrollBgUploadInput._changeHandler) {
                    scrollBgUploadInput.removeEventListener('change', scrollBgUploadInput._changeHandler);
                }

                scrollBgUploadInput._changeHandler = function (e) {
                    if (e.target.files.length > 0) {
                        const file = e.target.files[0];
                        if (!file.type.startsWith('image/')) {
                            alert('Please select an image file.');
                            return;
                        }

                        imageManager.storeImage(file, (imagePath) => {
                            const imageName = imagePath.replace('user_uploaded:', '');
                            const minecraftPath = `textures/ui/custom/${imageName}`;

                            scrollBgTextureInput.value = minecraftPath;
                            scrollBgTextureInput.setAttribute('data-original-path', imagePath);

                            component.properties.userEditedScrollBgTexturePath = false;
                            component.properties.scroll_background_image_texture = imagePath;

                            if (scrollBgPreviewContainer && scrollBgPreview) {
                                scrollBgPreviewContainer.style.display = 'block';
                                scrollBgPreview.style.backgroundImage = `url('${imageManager.getImageUrl(imagePath)}')`;
                                scrollBgPreview.style.backgroundSize = 'contain';
                                scrollBgPreview.style.backgroundRepeat = 'no-repeat';
                                scrollBgPreview.style.backgroundPosition = 'center';
                                scrollBgPreview.style.height = '40px';
                            }

                            editor.updateComponent(component);
                        });
                    }
                };

                scrollBgUploadInput.addEventListener('change', scrollBgUploadInput._changeHandler);
                scrollBgUploadInput._hasChangeHandler = true;
            }

            this.setupTextureUpload(fragment, component, 'slot_background_texture');
            this.setupTextureUpload(fragment, component, 'slot_selected_texture');
            this.setupTextureUpload(fragment, component, 'slot_highlight_texture');
        } else {

            this.setupTextureUpload(fragment, component, 'texture');
            this.setupTextureUpload(fragment, component, 'picture');
            this.setupTextureUpload(fragment, component, 'slot_background_texture');
            this.setupTextureUpload(fragment, component, 'slot_selected_texture');
            this.setupTextureUpload(fragment, component, 'slot_highlight_texture');
        }
    },

    setupTextureUpload: function (fragment, component, propertyName) {

        if (component.type === 'image' && propertyName === 'texture') return;

        if (!component.properties || !(propertyName in component.properties)) return;

        const textureInput = fragment.querySelector(`[data-property="${propertyName}"]`);
        if (!textureInput) return;

        const inputContainer = textureInput.closest('.property');
        if (!inputContainer) return;

        let uploadContainer = inputContainer.querySelector('.image-upload-container');
        let previewContainer = inputContainer.querySelector('.image-preview-container');
        const uploadLabelByProperty = {
            slot_background_texture: 'Normal Texture',
            slot_highlight_texture: 'Hover Texture',
            slot_selected_texture: 'Selected Texture',
            default_texture: 'Default Texture',
            hover_texture: 'Hover Texture',
            pressed_texture: 'Pressed Texture',
            image_texture: 'Image',
            picture: 'Picture',
            texture: 'Texture'
        };
        const uploadLabel = uploadLabelByProperty[propertyName] ||
            propertyName.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());

        if (!uploadContainer) {
            uploadContainer = document.createElement('div');
            uploadContainer.className = 'image-upload-container';
            uploadContainer.innerHTML = `
                <button type="button" class="upload-image-btn">Upload Custom ${uploadLabel}</button>
                <input type="file" class="image-upload" accept="image/*" style="display:none">
            `;
            inputContainer.appendChild(uploadContainer);
        }

        if (!previewContainer) {
            previewContainer = document.createElement('div');
            previewContainer.className = 'image-preview-container';
            previewContainer.style.display = 'none';
            previewContainer.innerHTML = `
                <p>Custom image:</p>
                <div class="custom-image-preview"></div>
            `;
            inputContainer.appendChild(previewContainer);
        }

        const uploadBtn = uploadContainer.querySelector('.upload-image-btn');
        const uploadInput = uploadContainer.querySelector('.image-upload');
        const imagePreview = previewContainer.querySelector('.custom-image-preview');

        if (component.properties[propertyName] && imageManager.isUploadedImage(component.properties[propertyName])) {
            previewContainer.style.display = 'block';
            imagePreview.style.backgroundImage = `url('${imageManager.getImageUrl(component.properties[propertyName])}')`;
            imagePreview.style.backgroundSize = 'contain';
            imagePreview.style.backgroundRepeat = 'no-repeat';
            imagePreview.style.backgroundPosition = 'center';
            imagePreview.style.height = '100px';

            if (!component.properties.userEditedTexturePath) {
                const imageName = component.properties[propertyName].replace('user_uploaded:', '');
                const minecraftPath = `textures/ui/custom/${imageName}`;
                textureInput.value = minecraftPath;
                textureInput.setAttribute('data-original-path', component.properties[propertyName]);
            }
        }

        textureInput.addEventListener('change', e => {
            const newTexturePath = e.target.value.trim();
            const originalPath = textureInput.getAttribute('data-original-path');

            if (originalPath && newTexturePath !== originalPath &&
                !newTexturePath.startsWith('user_uploaded:')) {
                component.properties.userEditedTexturePath = true;
                component.properties[propertyName] = newTexturePath;
                textureInput.removeAttribute('data-original-path');
            } else {
                component.properties[propertyName] = newTexturePath;
            }

            if (imageManager.isUploadedImage(component.properties[propertyName])) {
                if (previewContainer && imagePreview) {
                    previewContainer.style.display = 'block';
                    imagePreview.style.backgroundImage = `url('${imageManager.getImageUrl(component.properties[propertyName])}')`;
                    imagePreview.style.backgroundSize = 'contain';
                    imagePreview.style.backgroundRepeat = 'no-repeat';
                    imagePreview.style.backgroundPosition = 'center';
                }
            } else {
                if (previewContainer) {
                    previewContainer.style.display = 'none';
                }
            }

            editor.updateComponent(component);
        });


        if (uploadBtn._clickHandler) {
            uploadBtn.removeEventListener('click', uploadBtn._clickHandler);
        }


        uploadBtn._clickHandler = function () {
            uploadInput.click();
        };


        uploadBtn.addEventListener('click', uploadBtn._clickHandler);


        if (!uploadInput._hasChangeHandler) {
            uploadInput._hasChangeHandler = true;

            uploadInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    const file = e.target.files[0];
                    if (!file.type.startsWith('image/')) {
                        alert('Please select an image file.');
                        return;
                    }

                    imageManager.storeImage(file, (imagePath) => {
                        const imageName = imagePath.replace('user_uploaded:', '');
                        const minecraftPath = `textures/ui/custom/${imageName}`;

                        textureInput.value = minecraftPath;
                        textureInput.setAttribute('data-original-path', imagePath);

                        component.properties.userEditedTexturePath = false;

                        component.properties[propertyName] = imagePath;

                        if (previewContainer && imagePreview) {
                            previewContainer.style.display = 'block';
                            imagePreview.style.backgroundImage = `url('${imageManager.getImageUrl(imagePath)}')`;
                            imagePreview.style.backgroundSize = 'contain';
                            imagePreview.style.backgroundRepeat = 'no-repeat';
                            imagePreview.style.backgroundPosition = 'center';
                            imagePreview.style.height = '100px';
                        }

                        editor.updateComponent(component);
                    });
                }
            });
        }
    },

    clear: function () {
        this.selectedComponent = null;
        this.propertiesContainer.innerHTML = '<p class="no-selection">No component selected</p>';
    }
};
