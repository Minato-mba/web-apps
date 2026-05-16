const imageManager = {
    uploadedImages: {},

    generateImageName: function (filename) {
        const baseName = filename.replace(/\.[^/.]+$/, ''); const sanitizedName = baseName.replace(/[^a-z0-9_]/gi, '_').toLowerCase();
        const uniqueId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        return `custom_${sanitizedName}_${uniqueId}`;
    },

    storeImage: function (file, callback) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageName = this.generateImageName(file.name);
            const imagePath = `user_uploaded:${imageName}`;
            this.uploadedImages[imagePath] = {
                data: e.target.result,
                type: file.type,
                originalName: file.name
            };
            callback(imagePath);
        };
        reader.readAsDataURL(file);
    },

    getImageUrl: function (path) {
        if (!path) return '';

        if (path.startsWith('user_uploaded:')) {
            return this.uploadedImages[path]?.data || '';
        }

        if (path.startsWith('textures/ui/')) {
            const filename = path.replace('textures/ui/', '');
            return `https://raw.githubusercontent.com/Mojang/bedrock-samples/main/resource_pack/textures/ui/${filename}.png`;
        }

        return `../assets/${path.replace('textures', 'images')}.png`;
    },

    isUploadedImage: function (path) {
        return path.startsWith('user_uploaded:');
    }
};

function getButtonTextureUrl(texturePath) {
    if (!texturePath) return '';

    if (texturePath.startsWith('user_uploaded:')) {
        return imageManager.getImageUrl(texturePath);
    }

    if (texturePath.startsWith('textures/ui/')) {
        const filename = texturePath.replace('textures/ui/', '');
        return `https://raw.githubusercontent.com/Mojang/bedrock-samples/main/resource_pack/textures/ui/${filename}.png`;
    }

    return texturePath;
}

function getExportTexturePath(texturePath) {
    if (texturePath === 'textures/ui/slot_highlight') {
        return defaultSlotTextures.highlight;
    }

    if (texturePath && texturePath.startsWith('user_uploaded:')) {
        const imageName = texturePath.replace('user_uploaded:', '');
        return `textures/ui/custom/${imageName}`;
    }

    return texturePath;
}

const defaultSlotTextures = {
    background: 'textures/ui/cell_image',
    selected: 'textures/ui/cell_image_selected',
    highlight: 'textures/ui/highlight_slot'
};

const defaultButtonTextures = {
    default_texture: 'textures/ui/button_borderless_light',
    hover_texture: 'textures/ui/button_borderless_lighthover',
    pressed_texture: 'textures/ui/button_borderless_lightpressed'
};

const defaultTabTextures = {
    default_texture: 'textures/ui/button_borderless_light',
    hover_texture: 'textures/ui/button_borderless_lightpressednohover',
    pressed_texture: 'textures/ui/button_borderless_lighthover'
};

function getTabTextureUrls(component) {
    const properties = component.properties || {};
    return {
        defaultUrl: getButtonTextureUrl(properties.default_texture || defaultTabTextures.default_texture),
        selectedUrl: getButtonTextureUrl(properties.hover_texture || defaultTabTextures.hover_texture),
        hoverUrl: getButtonTextureUrl(properties.pressed_texture || defaultTabTextures.pressed_texture)
    };
}

function getTabMouseHandlers(defaultUrl, selectedUrl, hoverUrl) {
    return [
        `onmouseenter="this.style.borderImageSource='url(' + (this.classList.contains('active') ? '${selectedUrl}' : '${hoverUrl}') + ')'"`,
        `onmouseleave="this.style.borderImageSource='url(' + (this.classList.contains('active') ? '${selectedUrl}' : '${defaultUrl}') + ')'"`,
        `onmousedown="this.style.borderImageSource='url(' + (this.classList.contains('active') ? '${selectedUrl}' : '${hoverUrl}') + ')'"`,
        `onmouseup="this.style.borderImageSource='url(' + (this.classList.contains('active') ? '${selectedUrl}' : '${defaultUrl}') + ')'"`
    ].join(' ');
}

const pixelatedTextureRendering = 'image-rendering:pixelated;image-rendering:-moz-crisp-edges;image-rendering:crisp-edges';

function withPixelatedRendering(styles) {
    if (!styles) return pixelatedTextureRendering;
    return styles.includes('image-rendering') ? styles : `${styles};${pixelatedTextureRendering}`;
}

function getSlotTextureStyles(component) {
    const texturePath = component.properties.slot_background_texture;

    if (!texturePath || texturePath === defaultSlotTextures.background) {
        return '';
    }

    return withPixelatedRendering([
        `background-image:url('${imageManager.getImageUrl(texturePath)}')`,
        'background-size:100% 100%',
        'background-repeat:no-repeat',
        'background-position:center',
        'background-color:transparent',
        'border:none'
    ].join(';'));
}

function getButtonBorderStyles(defaultUrl, hoverUrl, pressedUrl) {
    const borderSlice = 1;
    const borderWidth = 1;

    return withPixelatedRendering([
        `--button-default-texture:url('${defaultUrl}')`,
        `--button-hover-texture:url('${hoverUrl}')`,
        `--button-pressed-texture:url('${pressedUrl}')`,
        `border-image-source:url('${defaultUrl}')`,
        `border-image-slice:${borderSlice} fill`,
        `border-image-width:${borderWidth}px`,
        `border-image-repeat:stretch`,
        `background-image:none`
    ].join(';'));
}

function getButtonContentHtml(component) {
    const properties = component.properties;
    const controls = [];

    if (properties.show_image) {
        const imageUrl = getButtonTextureUrl(properties.image_texture);
        controls.push(`<div class="button-embedded-image"
            style="${withPixelatedRendering(`width:${properties.image_width || 8}px;height:${properties.image_height || 8}px;left:calc(50% + ${properties.image_offset_x || 0}px);top:calc(50% + ${properties.image_offset_y || 0}px);background-image:url('${imageUrl}');background-size:contain;background-repeat:no-repeat;background-position:center`)}"></div>`);
    }

    if (properties.show_label) {
        const labelColor = util.rgbArrayToHex(properties.label_color || [1, 1, 1]);
        const labelScale = Number(properties.label_font_scale_factor) || 1.0;
        controls.push(`<div class="button-embedded-label"
            style="left:calc(50% + ${properties.label_offset_x || 0}px);top:calc(50% + ${properties.label_offset_y || 0}px);color:${labelColor};font-size:${10 * labelScale}px;">
            ${properties.label_text || ''}
        </div>`);
    }

    return controls.join('');
}

const componentTypes = {
    tab: {
        name: 'Tab',
        defaultWidth: 16,
        defaultHeight: 16,
        defaultProps: {
            toggle_index: 1,
            toggle_group_name: 'custom_chest_tabs',
            is_active: false,
            ...defaultTabTextures,
            show_label: false,
            label_text: '',
            label_color: [1.0, 1.0, 1.0],
            label_font_scale_factor: 1.0,
            label_offset_x: 0,
            label_offset_y: 0,
            show_image: false,
            image_texture: 'textures/ui/dark_plus',
            image_width: 8,
            image_height: 8,
            image_offset_x: 0,
            image_offset_y: 0
        },
        template: '#tab-properties',
        render: (component) => {
            const { defaultUrl, selectedUrl, hoverUrl } = getTabTextureUrls(component);
            const isActive = !!component.properties.is_active;
            const displayUrl = isActive ? selectedUrl : defaultUrl;

            return `<div class="editor-component button tab${isActive ? ' active' : ''}"
                        data-id="${component.id}"
                        data-type="tab"
                        data-default-texture="${component.properties.default_texture}"
                        data-hover-texture="${component.properties.hover_texture}"
                        data-pressed-texture="${component.properties.pressed_texture}"
                        ${getTabMouseHandlers(defaultUrl, selectedUrl, hoverUrl)}
                        style="left:${component.x}px;top:${component.y}px;width:${component.width}px;height:${component.height}px;${getButtonBorderStyles(displayUrl, selectedUrl, hoverUrl)}"
                        ontouchend="event.stopPropagation(); editor.setActiveTab('${component.id}');"
                        onclick="event.stopPropagation(); editor.setActiveTab('${component.id}');">
                        ${getButtonContentHtml(component)}
                    </div>`;
        },
        renderPreview: (component) => {
            const { defaultUrl, selectedUrl, hoverUrl } = getTabTextureUrls(component);
            const isActive = !!component.properties.is_active;
            const displayUrl = isActive ? selectedUrl : defaultUrl;

            return `<div class="preview-component button tab${isActive ? ' active' : ''}"
                        data-default-texture="${component.properties.default_texture}"
                        data-hover-texture="${component.properties.hover_texture}"
                        data-pressed-texture="${component.properties.pressed_texture}"
                        ${getTabMouseHandlers(defaultUrl, selectedUrl, hoverUrl)}
                        style="left:${component.x}px;top:${component.y}px;width:${component.width}px;height:${component.height}px;${getButtonBorderStyles(displayUrl, selectedUrl, hoverUrl)}">
                        ${getButtonContentHtml(component)}
                    </div>`;
        },
        generateJSON: (component) => {
            return {
                type: "tab",
                toggle_index: component.properties.toggle_index,
                toggle_group_name: component.properties.toggle_group_name,
                default_texture: component.properties.default_texture,
                hover_texture: component.properties.hover_texture,
                pressed_texture: component.properties.pressed_texture,
                show_label: component.properties.show_label,
                label_text: component.properties.label_text,
                label_color: component.properties.label_color,
                label_font_scale_factor: component.properties.label_font_scale_factor,
                label_offset_x: component.properties.label_offset_x,
                label_offset_y: component.properties.label_offset_y,
                show_image: component.properties.show_image,
                image_texture: component.properties.image_texture,
                image_width: component.properties.image_width,
                image_height: component.properties.image_height,
                image_offset_x: component.properties.image_offset_x,
                image_offset_y: component.properties.image_offset_y,
                x: component.x,
                y: component.y,
                width: component.width,
                height: component.height
            };
        }
    },

    container_item: {
        name: 'Container Item',
        defaultWidth: 18,
        defaultHeight: 18,
        defaultProps: {
            collection_index: 0,
            slot_background_texture: defaultSlotTextures.background,
            slot_selected_texture: defaultSlotTextures.selected,
            slot_highlight_texture: defaultSlotTextures.highlight
        },
        template: '#container-item-properties',
        render: (component) => {
            return `<div class="editor-component container-item" 
                        data-id="${component.id}" 
                        data-type="container_item" 
                        data-collection-index="${component.properties.collection_index}"
                        style="left:${component.x}px;top:${component.y}px;width:${component.width}px;height:${component.height}px;${getSlotTextureStyles(component)}">
                    </div>`;
        },
        renderPreview: (component) => {
            return `<div class="preview-component container-item" 
                        data-collection-index="${component.properties.collection_index}"
                        style="left:${component.x}px;top:${component.y}px;width:${component.width}px;height:${component.height}px;${getSlotTextureStyles(component)}">
                    </div>`;
        },
        generateJSON: (component) => {
            return {
                type: "container_item",
                collection_index: component.properties.collection_index,
                slot_background_texture: component.properties.slot_background_texture,
                slot_selected_texture: component.properties.slot_selected_texture,
                slot_highlight_texture: component.properties.slot_highlight_texture,
                x: component.x,
                y: component.y,
                width: component.width,
                height: component.height
            };
        }
    },

    container_item_with_picture: {
        name: 'Container Item with Picture',
        defaultWidth: 18,
        defaultHeight: 18,
        defaultProps: {
            collection_index: 0,
            picture: 'textures/ui/book_ui',
            slot_background_texture: defaultSlotTextures.background,
            slot_selected_texture: defaultSlotTextures.selected,
            slot_highlight_texture: defaultSlotTextures.highlight
        },
        template: '#container-item-with-picture-properties',
        render: (component) => {
            const isUploaded = imageManager.isUploadedImage(component.properties.picture);
            const bgImage = isUploaded ?
                withPixelatedRendering(`background-image:url('${imageManager.getImageUrl(component.properties.picture)}');background-size:contain;background-repeat:no-repeat;background-position:center`) : '';

            return `<div class="editor-component container-item-with-picture ${isUploaded ? 'custom-picture' : ''}" 
                        data-id="${component.id}" 
                        data-type="container_item_with_picture" 
                        data-collection-index="${component.properties.collection_index}"
                        data-picture="${component.properties.picture}"
                        style="left:${component.x}px;top:${component.y}px;width:${component.width}px;height:${component.height}px;${getSlotTextureStyles(component)}">
                        ${isUploaded ? '<div class="custom-picture-content" style="' + bgImage + '"></div>' : ''}
                    </div>`;
        },
        renderPreview: (component) => {
            const isUploaded = imageManager.isUploadedImage(component.properties.picture);
            const bgImage = isUploaded ?
                withPixelatedRendering(`background-image:url('${imageManager.getImageUrl(component.properties.picture)}');background-size:contain;background-repeat:no-repeat;background-position:center`) : '';

                    return `<div class="preview-component container-item-with-picture ${isUploaded ? 'custom-picture' : ''}" 
                        data-collection-index="${component.properties.collection_index}"
                        data-picture="${component.properties.picture}"
                        style="left:${component.x}px;top:${component.y}px;width:${component.width}px;height:${component.height}px;${getSlotTextureStyles(component)}">
                        ${isUploaded ? '<div class="custom-picture-content" style="' + bgImage + '"></div>' : ''}
                    </div>`;
        },
        generateJSON: (component) => {
            return {
                type: "container_item_with_picture",
                collection_index: component.properties.collection_index,
                picture: component.properties.picture,
                slot_background_texture: component.properties.slot_background_texture,
                slot_selected_texture: component.properties.slot_selected_texture,
                slot_highlight_texture: component.properties.slot_highlight_texture,
                x: component.x,
                y: component.y,
                width: component.width,
                height: component.height
            };
        }
    },

    progress_bar: {
        name: 'Progress Bar',
        defaultWidth: 22,
        defaultHeight: 15,
        defaultProps: {
            collection_index: 0,
            value: 0
        },
        template: '#progress-bar-properties',
        render: (component) => {
            return `<div class="editor-component progress-bar" 
                        data-id="${component.id}" 
                        data-type="progress_bar" 
                        data-collection-index="${component.properties.collection_index}"
                        data-value="${component.properties.value}"
                        style="left:${component.x}px;top:${component.y}px;width:${component.width}px;height:${component.height}px;">
                    </div>`;
        },
        renderPreview: (component) => {
            return `<div class="preview-component progress-bar" 
                        data-collection-index="${component.properties.collection_index}"
                        data-value="${component.properties.value}"
                        style="left:${component.x}px;top:${component.y}px;width:${component.width}px;height:${component.height}px;">
                    </div>`;
        },
        generateJSON: (component) => {
            return {
                type: "progress_bar",
                collection_index: component.properties.collection_index,
                value: component.properties.value,
                x: component.x,
                y: component.y,
                width: component.width,
                height: component.height
            };
        }
    },

    on_off_item: {
        name: 'on_off Item',
        defaultWidth: 16,
        defaultHeight: 14,
        defaultProps: {
            collection_index: 0,
            active: false
        },
        template: '#on_off-item-properties',
        render: (component) => {
            const activeClass = component.properties.active ? ' active' : '';
            return `<div class="editor-component on_off-item${activeClass}" 
                        data-id="${component.id}" 
                        data-type="on_off_item" 
                        data-collection-index="${component.properties.collection_index}"
                        data-active="${component.properties.active}"
                        style="left:${component.x}px;top:${component.y}px;width:${component.width}px;height:${component.height}px;">
                    </div>`;
        },
        renderPreview: (component) => {
            const activeClass = component.properties.active ? ' active' : '';
            return `<div class="preview-component on_off-item${activeClass}" 
                        data-collection-index="${component.properties.collection_index}"
                        data-active="${component.properties.active}"
                        style="left:${component.x}px;top:${component.y}px;width:${component.width}px;height:${component.height}px;">
                    </div>`;
        },
        generateJSON: (component) => {
            return {
                type: "on_off_item",
                collection_index: component.properties.collection_index,
                active: component.properties.active,
                x: component.x,
                y: component.y,
                width: component.width,
                height: component.height
            };
        }
    },

    pot: {
        name: 'uninteractable slot',
        defaultWidth: 26,
        defaultHeight: 30,
        defaultProps: {
            collection_index: 0,
            texture: 'textures/ui/pot/pot'
        },
        template: '#pot-properties',
        render: (component) => {
            const isUploaded = imageManager.isUploadedImage(component.properties.texture);
            const bgImage = isUploaded ?
                withPixelatedRendering(`background-image:url('${imageManager.getImageUrl(component.properties.texture)}');background-size:contain;background-repeat:no-repeat;background-position:center`) : '';

            return `<div class="editor-component pot ${isUploaded ? 'custom-texture' : ''}" 
                        data-id="${component.id}" 
                        data-type="pot" 
                        data-collection-index="${component.properties.collection_index}"
                        data-texture="${component.properties.texture}"
                        style="left:${component.x}px;top:${component.y}px;width:${component.width}px;height:${component.height}px;">
                        ${isUploaded ? '<div class="custom-texture-content" style="' + bgImage + '"></div>' : ''}
                    </div>`;
        },
        renderPreview: (component) => {
            const isUploaded = imageManager.isUploadedImage(component.properties.texture);
            const bgImage = isUploaded ?
                withPixelatedRendering(`background-image:url('${imageManager.getImageUrl(component.properties.texture)}');background-size:contain;background-repeat:no-repeat;background-position:center`) : '';

            return `<div class="preview-component pot ${isUploaded ? 'custom-texture' : ''}" 
                        data-collection-index="${component.properties.collection_index}"
                        data-texture="${component.properties.texture}"
                        style="left:${component.x}px;top:${component.y}px;width:${component.width}px;height:${component.height}px;">
                        ${isUploaded ? '<div class="custom-texture-content" style="' + bgImage + '"></div>' : ''}
                    </div>`;
        },
        generateJSON: (component) => {
            return {
                type: "pot",
                collection_index: component.properties.collection_index,
                texture: component.properties.texture, x: component.x,
                y: component.y,
                width: component.width,
                height: component.height
            };
        }
    },

    container_type: {
        name: 'Container Type',
        defaultWidth: 18,
        defaultHeight: 18,
        defaultProps: {
            collection_index: 0,
            container_type: '0',
            slot_background_texture: defaultSlotTextures.background,
            slot_selected_texture: defaultSlotTextures.selected,
            slot_highlight_texture: defaultSlotTextures.highlight
        },
        template: '#container-type-properties',
        render: (component) => {
            return `<div class="editor-component container-type" 
                        data-id="${component.id}" 
                        data-type="container_type" 
                        data-collection-index="${component.properties.collection_index}"
                        data-type="${component.properties.container_type}"
                        style="left:${component.x}px;top:${component.y}px;width:${component.width}px;height:${component.height}px;${getSlotTextureStyles(component)}">
                    </div>`;
        },
        renderPreview: (component) => {
                    return `<div class="preview-component container-type" 
                        data-collection-index="${component.properties.collection_index}"
                        data-type="${component.properties.container_type}"
                        style="left:${component.x}px;top:${component.y}px;width:${component.width}px;height:${component.height}px;${getSlotTextureStyles(component)}">
                    </div>`;
        },
        generateJSON: (component) => {
            return {
                type: "container_type",
                collection_index: component.properties.collection_index,
                container_type: component.properties.container_type,
                slot_background_texture: component.properties.slot_background_texture,
                slot_selected_texture: component.properties.slot_selected_texture,
                slot_highlight_texture: component.properties.slot_highlight_texture,
                x: component.x,
                y: component.y,
                width: component.width,
                height: component.height
            };
        }
    },

    dynamic_grid: {
        name: 'Dynamic Grid',
        defaultWidth: 162,
        defaultHeight: 54,
        defaultProps: {
            slot_width: 18,
            slot_height: 18,
            preview_slots: 27,
            content_height: 180,
            scroll_size_width: 8,
            scrollbar_box_image_size_width: 8,
            scroll_indent_image_texture: "textures/ui/ScrollRail",
            scrollbar_box_image_texture: "textures/ui/ScrollHandle",
            show_background: true,
            scroll_background_image_texture: "textures/ui/ScrollRail",
            slot_background_texture: defaultSlotTextures.background,
            slot_selected_texture: defaultSlotTextures.selected,
            slot_highlight_texture: defaultSlotTextures.highlight
        },
        template: '#dynamic-grid-properties',
        render: (component) => {
            const slots = Number(component.properties.preview_slots) || 0;
            const slotWidth = Number(component.properties.slot_width) || 18;
            const slotHeight = Number(component.properties.slot_height) || 18;
            const scrollSize = Number(component.properties.scroll_size_width ?? 8);
            const availableWidth = (component.width || slotWidth) - scrollSize;
            const columns = Math.max(1, Math.floor(availableWidth / slotWidth));
            const slotTextureStyles = getSlotTextureStyles(component);
            const slotHtml = Array.from({ length: slots }, () => `<span class="dynamic-grid-slot" style="${slotTextureStyles}"></span>`).join('');

            const isCustomRail = component.properties.scroll_indent_image_texture && component.properties.scroll_indent_image_texture.startsWith('user_uploaded:');
            const isCustomHandle = component.properties.scrollbar_box_image_texture && component.properties.scrollbar_box_image_texture.startsWith('user_uploaded:');
            const isCustomBg = component.properties.scroll_background_image_texture && component.properties.scroll_background_image_texture.startsWith('user_uploaded:');
            const hasBgTexture = component.properties.show_background !== false && component.properties.scroll_background_image_texture;
            
            return `<div class="editor-component dynamic-grid scroll-panel-wrapper"
                        data-id="${component.id}"
                        data-type="dynamic_grid"
                        data-scroll-rail-custom="${isCustomRail}"
                        data-scroll-handle-custom="${isCustomHandle}"
                        data-scroll-bg-custom="${isCustomBg}"
                        style="left:${component.x}px;top:${component.y}px;width:${component.width}px;height:${component.height}px;--slot-width:${slotWidth}px;--slot-height:${slotHeight}px;--grid-columns:${columns};--scroll-size:${scrollSize}px;${isCustomRail ? `--scroll-rail-custom-image:url('${imageManager.getImageUrl(component.properties.scroll_indent_image_texture)}')` : ''};${isCustomHandle ? `--scroll-handle-custom-image:url('${imageManager.getImageUrl(component.properties.scrollbar_box_image_texture)}')` : ''};${isCustomBg ? `--scroll-bg-custom-image:url('${imageManager.getImageUrl(component.properties.scroll_background_image_texture)}')` : ''}">
                        <div class="dynamic-grid-content" style="width: calc(100% - ${scrollSize}px);${hasBgTexture && !isCustomBg ? `${withPixelatedRendering(`background-image:url('${imageManager.getImageUrl(component.properties.scroll_background_image_texture)}');background-repeat:repeat;background-size:100% 100%`)};` : ''}">${slotHtml}</div>
                        <div class="fake-scrollbar" style="width: ${scrollSize}px; right: 0;">
                            <div class="fake-scrollbar-track"></div>
                            <div class="fake-scrollbar-thumb"></div>
                        </div>
                        <span class="scroll-panel-label">Dynamic Grid (Scroll)</span>
                    </div>`;
        },
        renderPreview: (component) => {
            const slots = Number(component.properties.preview_slots) || 0;
            const slotWidth = Number(component.properties.slot_width) || 18;
            const slotHeight = Number(component.properties.slot_height) || 18;
            const scrollSize = Number(component.properties.scroll_size_width ?? 8);
            const availableWidth = (component.width || slotWidth) - scrollSize;
            const columns = Math.max(1, Math.floor(availableWidth / slotWidth));
            const slotTextureStyles = getSlotTextureStyles(component);
            const slotHtml = Array.from({ length: slots }, () => `<span class="dynamic-grid-slot" style="${slotTextureStyles}"></span>`).join('');

            const isCustomRail = component.properties.scroll_indent_image_texture && component.properties.scroll_indent_image_texture.startsWith('user_uploaded:');
            const isCustomHandle = component.properties.scrollbar_box_image_texture && component.properties.scrollbar_box_image_texture.startsWith('user_uploaded:');
            const isCustomBg = component.properties.scroll_background_image_texture && component.properties.scroll_background_image_texture.startsWith('user_uploaded:');
            const hasBgTexture = component.properties.show_background !== false && component.properties.scroll_background_image_texture;

            return `<div class="preview-component dynamic-grid scroll-panel-wrapper"
                        data-scroll-rail-custom="${isCustomRail}"
                        data-scroll-handle-custom="${isCustomHandle}"
                        data-scroll-bg-custom="${isCustomBg}"
                        style="left:${component.x}px;top:${component.y}px;width:${component.width}px;height:${component.height}px;--slot-width:${slotWidth}px;--slot-height:${slotHeight}px;--grid-columns:${columns};--scroll-size:${scrollSize}px;${isCustomRail ? `--scroll-rail-custom-image:url('${imageManager.getImageUrl(component.properties.scroll_indent_image_texture)}')` : ''};${isCustomHandle ? `--scroll-handle-custom-image:url('${imageManager.getImageUrl(component.properties.scrollbar_box_image_texture)}')` : ''};${isCustomBg ? `--scroll-bg-custom-image:url('${imageManager.getImageUrl(component.properties.scroll_background_image_texture)}')` : ''}">
                        <div class="dynamic-grid-content" style="width: calc(100% - ${scrollSize}px);${hasBgTexture && !isCustomBg ? `${withPixelatedRendering(`background-image:url('${imageManager.getImageUrl(component.properties.scroll_background_image_texture)}');background-repeat:repeat;background-size:100% 100%`)};` : ''}">${slotHtml}</div>
                        <div class="fake-scrollbar" style="width: ${scrollSize}px; right: 0;">
                            <div class="fake-scrollbar-track"></div>
                            <div class="fake-scrollbar-thumb"></div>
                        </div>
                        <span class="scroll-panel-label">Dynamic Grid (Scroll)</span>
                    </div>`;
        },
        generateJSON: (component) => {
            return {
                type: "dynamic_grid",
                slot_width: component.properties.slot_width,
                slot_height: component.properties.slot_height,
                content_height: component.properties.content_height,
                slot_background_texture: component.properties.slot_background_texture,
                slot_selected_texture: component.properties.slot_selected_texture,
                slot_highlight_texture: component.properties.slot_highlight_texture,
                x: component.x,
                y: component.y,
                width: component.width,
                height: component.height
            };
        }
    },

    /* removed duplicate tab_panel */

    button: {
        name: 'Button',
        defaultWidth: 16,
        defaultHeight: 16,
        defaultProps: {
            target_collection_index: 0,
            pressed_button_name: 'button.container_auto_place',
            default_texture: 'textures/ui/button_borderless_light',
            hover_texture: 'textures/ui/button_borderless_lighthover',
            pressed_texture: 'textures/ui/button_borderless_lightpressed',
            show_label: false,
            label_text: 'Button',
            label_color: [1.0, 1.0, 1.0],
            label_font_scale_factor: 1.0,
            label_offset_x: 0,
            label_offset_y: 0,
            show_image: false,
            image_texture: 'textures/ui/dark_plus',
            image_width: 8,
            image_height: 8,
            image_offset_x: 0,
            image_offset_y: 0
        },
        template: '#button-properties',
        render: (component) => {
            const defaultUrl = getButtonTextureUrl(component.properties.default_texture);
            const hoverUrl = getButtonTextureUrl(component.properties.hover_texture);
            const pressedUrl = getButtonTextureUrl(component.properties.pressed_texture);

            return `<div class="editor-component button" 
                        data-id="${component.id}" 
                        data-type="button"
                        data-target-collection-index="${component.properties.target_collection_index}"
                        data-default-texture="${component.properties.default_texture}"
                        data-hover-texture="${component.properties.hover_texture}"
                        data-pressed-texture="${component.properties.pressed_texture}"
                        onmouseenter="this.style.borderImageSource='url(${hoverUrl})'"
                        onmouseleave="this.style.borderImageSource='url(${defaultUrl})'"
                        onmousedown="this.style.borderImageSource='url(${pressedUrl})'"
                        onmouseup="this.style.borderImageSource='url(${hoverUrl})'"
                        style="left:${component.x}px;top:${component.y}px;width:${component.width}px;height:${component.height}px;${getButtonBorderStyles(defaultUrl, hoverUrl, pressedUrl)}">
                        ${getButtonContentHtml(component)}
                    </div>`;
        },
        renderPreview: (component) => {
            const defaultUrl = getButtonTextureUrl(component.properties.default_texture);
            const hoverUrl = getButtonTextureUrl(component.properties.hover_texture);
            const pressedUrl = getButtonTextureUrl(component.properties.pressed_texture);

            return `<div class="preview-component button" 
                        data-target-collection-index="${component.properties.target_collection_index}"
                        data-default-texture="${component.properties.default_texture}"
                        data-hover-texture="${component.properties.hover_texture}"
                        data-pressed-texture="${component.properties.pressed_texture}"
                        onmouseenter="this.style.borderImageSource='url(${hoverUrl})'"
                        onmouseleave="this.style.borderImageSource='url(${defaultUrl})'"
                        onmousedown="this.style.borderImageSource='url(${pressedUrl})'"
                        onmouseup="this.style.borderImageSource='url(${hoverUrl})'"
                        style="left:${component.x}px;top:${component.y}px;width:${component.width}px;height:${component.height}px;${getButtonBorderStyles(defaultUrl, hoverUrl, pressedUrl)}">
                        ${getButtonContentHtml(component)}
                    </div>`;
        },
        generateJSON: (component) => {
            return {
                type: "button",
                target_collection_index: component.properties.target_collection_index,
                pressed_button_name: component.properties.pressed_button_name,
                default_texture: component.properties.default_texture,
                hover_texture: component.properties.hover_texture,
                pressed_texture: component.properties.pressed_texture,
                show_label: component.properties.show_label,
                label_text: component.properties.label_text,
                label_color: component.properties.label_color,
                label_font_scale_factor: component.properties.label_font_scale_factor,
                label_offset_x: component.properties.label_offset_x,
                label_offset_y: component.properties.label_offset_y,
                show_image: component.properties.show_image,
                image_texture: component.properties.image_texture,
                image_width: component.properties.image_width,
                image_height: component.properties.image_height,
                image_offset_x: component.properties.image_offset_x,
                image_offset_y: component.properties.image_offset_y,
                x: component.x,
                y: component.y,
                width: component.width,
                height: component.height
            };
        }
    },

    image: {
        name: 'Image',
        defaultWidth: 32,
        defaultHeight: 32,
        defaultProps: {
            texture: 'textures/ui/combiner_cross',
            alpha: 1.0
        },
        template: '#image-properties',
        render: (component) => {
            const isUploaded = imageManager.isUploadedImage(component.properties.texture);
            const bgImage = isUploaded ?
                withPixelatedRendering(`background-image:url('${imageManager.getImageUrl(component.properties.texture)}');background-size:contain;background-repeat:no-repeat;background-position:center`) :
                '';

            return `<div class="editor-component image ${isUploaded ? 'custom-image' : ''}" 
                        data-id="${component.id}" 
                        data-type="image" 
                        data-texture="${component.properties.texture}"
                        style="left:${component.x}px;top:${component.y}px;width:${component.width}px;height:${component.height}px;opacity:${component.properties.alpha};${bgImage}">
                    </div>`;
        },
        renderPreview: (component) => {
            const isUploaded = imageManager.isUploadedImage(component.properties.texture);
            const bgImage = isUploaded ?
                withPixelatedRendering(`background-image:url('${imageManager.getImageUrl(component.properties.texture)}');background-size:contain;background-repeat:no-repeat;background-position:center`) :
                '';

            return `<div class="preview-component image ${isUploaded ? 'custom-image' : ''}" 
                        data-texture="${component.properties.texture}"
                        style="left:${component.x}px;top:${component.y}px;width:${component.width}px;height:${component.height}px;opacity:${component.properties.alpha};${bgImage}">
                    </div>`;
        },
        generateJSON: (component) => {
            return {
                type: "image",
                texture: component.properties.texture,
                alpha: component.properties.alpha,
                x: component.x,
                y: component.y,
                width: component.width,
                height: component.height
            };
        }
    },

    label: {
        name: 'Label',
        defaultWidth: 80,
        defaultHeight: 20,
        defaultProps: {
            text: 'Label Text',
            color: [1.0, 1.0, 1.0],
            font_scale_factor: 1.0
        },
        template: '#label-properties',
        render: (component) => {
            const color = util.rgbArrayToHex(component.properties.color);
            const fontScale = Number(component.properties.font_scale_factor) || 1.0;
            return `<div class="editor-component label" 
                        data-id="${component.id}" 
                        data-type="label"
                        style="left:${component.x}px;top:${component.y}px;color:${color};font-size:${10 * fontScale}px;">
                        ${component.properties.text}
                    </div>`;
        },
        renderPreview: (component) => {
            const color = util.rgbArrayToHex(component.properties.color);
            const fontScale = Number(component.properties.font_scale_factor) || 1.0;
            return `<div class="preview-component label" 
                        style="left:${component.x}px;top:${component.y}px;color:${color};font-size:${10 * fontScale}px;">
                        ${component.properties.text}
                    </div>`;
        },
        generateJSON: (component) => {
            return {
                type: "label",
                text: component.properties.text,
                color: component.properties.color,
                font_scale_factor: Number(component.properties.font_scale_factor) || 1.0,
                x: component.x,
                y: component.x
            };
        }
    },

    close_button: {
        name: 'Close Button',
        defaultWidth: 16,
        defaultHeight: 16,
        defaultProps: {
            default_texture: 'textures/ui/close_button_default',
            hover_texture: 'textures/ui/close_button_hover',
            pressed_texture: 'textures/ui/close_button_pressed'
        },
        template: '#close-button-properties',
        render: (component) => {
            // Convert texture paths to URLs for editor display
            const getEditorUrl = (texturePath) => {
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
            
            return `<div class="editor-component close-button" 
                        data-id="${component.id}" 
                        data-type="close_button"
                        data-default-texture="${component.properties.default_texture}"
                        data-hover-texture="${component.properties.hover_texture}"
                        data-pressed-texture="${component.properties.pressed_texture}"
                        style="left:${component.x}px;top:${component.y}px;width:${component.width}px;height:${component.height}px;${withPixelatedRendering(`background-image:url('${getEditorUrl(component.properties.default_texture)}');background-size:contain;background-repeat:no-repeat;background-position:center`)}">
                    </div>`;
        },
        renderPreview: (component) => {
            // Convert texture paths to URLs for preview display
            const getPreviewUrl = (texturePath) => {
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
            
            return `<div class="preview-component close-button" 
                        data-default-texture="${component.properties.default_texture}"
                        data-hover-texture="${component.properties.hover_texture}"
                        data-pressed-texture="${component.properties.pressed_texture}"
                        style="left:${component.x}px;top:${component.y}px;width:${component.width}px;height:${component.height}px;${withPixelatedRendering(`background-image:url('${getPreviewUrl(component.properties.default_texture)}');background-size:contain;background-repeat:no-repeat;background-position:center`)}">
                    </div>`;
        },
        generateJSON: (component) => {
            // Convert user_uploaded paths to in-game paths for export
            const getExportPath = (texturePath) => {
                if (texturePath && texturePath.startsWith('user_uploaded:')) {
                    const imageName = texturePath.replace('user_uploaded:', '');
                    return `textures/ui/custom/${imageName}`;
                }
                return texturePath;
            };
            
            return {
                close_button_holder: {
                    type: "stack_panel",
                    anchor_from: "top_left",
                    anchor_to: "top_left",
                    offset: [component.x + 1, component.y],
                    $close_button_panel_size: [component.width, component.height],
                    controls: [
                        {
                            "close@common.close_button": {
                                controls: [
                                    {
                                        "default@common.close_button_panel": {
                                            $close_button_texture: getExportPath(component.properties.default_texture)
                                        }
                                    },
                                    {
                                        "hover@common.close_button_panel": {
                                            $close_button_texture: getExportPath(component.properties.hover_texture)
                                        }
                                    },
                                    {
                                        "pressed@common.close_button_panel": {
                                            $close_button_texture: getExportPath(component.properties.pressed_texture)
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
            };
        }
    }
};

function getNextToggleIndex(components) {
    let maxIndex = 0;

    components.forEach(component => {
        if (component.type === 'tab' &&
            component.properties &&
            Number(component.properties.toggle_index) > maxIndex) {
            maxIndex = Number(component.properties.toggle_index);
        }
    });

    return maxIndex + 1;
}

function getNextCollectionIndex(components) {
    let maxIndex = -1;

    components.forEach(component => {
        if (component.properties &&
            'collection_index' in component.properties &&
            component.properties.collection_index > maxIndex) {
            maxIndex = component.properties.collection_index;
        }
    });

    return maxIndex + 1;
}

function createComponent(type, x = 0, y = 0) {
    if (!componentTypes[type]) {
        console.error(`Unknown component type: ${type}`);
        return null;
    }

    const componentType = componentTypes[type];
    const component = {
        id: util.generateUniqueId(),
        type: type,
        x: x,
        y: y,
        width: componentType.defaultWidth,
        height: componentType.defaultHeight,
        properties: { ...componentType.defaultProps }
    };
    const needsIndex = ['container_item', 'container_item_with_picture', 'progress_bar',
        'on_off_item', 'pot', 'container_type'].includes(type);

    if (needsIndex) {
        const currentComponents = editor.getComponents();
        component.properties.collection_index = getNextCollectionIndex(currentComponents);
    }

    return component;
}
