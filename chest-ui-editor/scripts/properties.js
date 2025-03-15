const propertiesPanel = {

    selectedComponent: null,
    init: function () {
        this.propertiesContainer = document.getElementById('properties-container');
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
                uploadBtn.addEventListener('click', () => {
                    uploadInput.click();
                });
            }

            if (uploadInput) {
                uploadInput.addEventListener('change', (e) => {
                    if (e.target.files.length > 0) {
                        const file = e.target.files[0];
                        if (!file.type.startsWith('image/')) {
                            alert('Please select an image file.');
                            return;
                        }

                        imageManager.storeImage(file, (imagePath) => {
                            if (textureInput) {
                                const imageName = imagePath.replace('user_uploaded:', '');
                                const minecraftPath = `textures/ui/custom/${imageName}`;

                                textureInput.value = minecraftPath;
                                textureInput.setAttribute('data-original-path', imagePath);

                                component.properties.userEditedTexturePath = false;
                            }

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
                });
            }
        }

        this.setupTextureUpload(fragment, component, 'texture');
        this.setupTextureUpload(fragment, component, 'picture');
    },

    setupTextureUpload: function (fragment, component, propertyName) {
        if (!component.properties || !(propertyName in component.properties)) return;

        const textureInput = fragment.querySelector(`[data-property="${propertyName}"]`);
        if (!textureInput) return;

        const inputContainer = textureInput.closest('.property');
        if (!inputContainer) return;

        let uploadContainer = inputContainer.querySelector('.image-upload-container');
        let previewContainer = inputContainer.querySelector('.image-preview-container');

        if (!uploadContainer) {
            uploadContainer = document.createElement('div');
            uploadContainer.className = 'image-upload-container';
            uploadContainer.innerHTML = `
                <button type="button" class="upload-image-btn">Upload Custom ${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}</button>
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

        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                uploadInput.click();
            });
        }

        if (uploadInput) {
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
