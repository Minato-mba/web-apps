

const componentTypes = {
    container_item: {
        name: 'Container Item',
        defaultWidth: 18,
        defaultHeight: 18,
        defaultProps: {
            collection_index: 0
        },
        template: '#container-item-properties',
        render: (component) => {
            return `<div class="editor-component container-item" 
                        data-id="${component.id}" 
                        data-type="container_item" 
                        data-collection-index="${component.properties.collection_index}"
                        style="left:${component.x}px;top:${component.y}px;width:${component.width}px;height:${component.height}px;">
                    </div>`;
        },
        renderPreview: (component) => {
            return `<div class="preview-component container-item" 
                        data-collection-index="${component.properties.collection_index}"
                        style="left:${component.x}px;top:${component.y}px;width:${component.width}px;height:${component.height}px;">
                    </div>`;
        },
        generateJSON: (component) => {
            return {
                type: "container_item",
                collection_index: component.properties.collection_index,
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
            picture: 'textures/ui/book_ui'
        },
        template: '#container-item-with-picture-properties',
        render: (component) => {
            return `<div class="editor-component container-item-with-picture" 
                        data-id="${component.id}" 
                        data-type="container_item_with_picture" 
                        data-collection-index="${component.properties.collection_index}"
                        data-picture="${component.properties.picture}"
                        style="left:${component.x}px;top:${component.y}px;width:${component.width}px;height:${component.height}px;">
                    </div>`;
        },
        renderPreview: (component) => {
            return `<div class="preview-component container-item-with-picture" 
                        data-collection-index="${component.properties.collection_index}"
                        data-picture="${component.properties.picture}"
                        style="left:${component.x}px;top:${component.y}px;width:${component.width}px;height:${component.height}px;">
                    </div>`;
        },
        generateJSON: (component) => {
            return {
                type: "container_item_with_picture",
                collection_index: component.properties.collection_index,
                picture: component.properties.picture,
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
            collection_index: 0
        },
        template: '#pot-properties',
        render: (component) => {
            return `<div class="editor-component pot" 
                        data-id="${component.id}" 
                        data-type="pot" 
                        data-collection-index="${component.properties.collection_index}"
                        style="left:${component.x}px;top:${component.y}px;width:${component.width}px;height:${component.height}px;">
                    </div>`;
        },
        renderPreview: (component) => {
            return `<div class="preview-component pot" 
                        data-collection-index="${component.properties.collection_index}"
                        style="left:${component.x}px;top:${component.y}px;width:${component.width}px;height:${component.height}px;">
                    </div>`;
        },
        generateJSON: (component) => {
            return {
                type: "pot",
                collection_index: component.properties.collection_index,
                x: component.x,
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
            container_type: '0'
        },
        template: '#container-type-properties',
        render: (component) => {
            return `<div class="editor-component container-type" 
                        data-id="${component.id}" 
                        data-type="container_type" 
                        data-collection-index="${component.properties.collection_index}"
                        data-type="${component.properties.container_type}"
                        style="left:${component.x}px;top:${component.y}px;width:${component.width}px;height:${component.height}px;">
                    </div>`;
        },
        renderPreview: (component) => {
            return `<div class="preview-component container-type" 
                        data-collection-index="${component.properties.collection_index}"
                        data-type="${component.properties.container_type}"
                        style="left:${component.x}px;top:${component.y}px;width:${component.width}px;height:${component.height}px;">
                    </div>`;
        },
        generateJSON: (component) => {
            return {
                type: "container_type",
                collection_index: component.properties.collection_index,
                container_type: component.properties.container_type,
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
            texture: 'textures/ui/altar_cross',
            alpha: 1.0
        },
        template: '#image-properties',
        render: (component) => {
            return `<div class="editor-component image" 
                        data-id="${component.id}" 
                        data-type="image" 
                        data-texture="${component.properties.texture}"
                        style="left:${component.x}px;top:${component.y}px;width:${component.width}px;height:${component.height}px;opacity:${component.properties.alpha};">
                    </div>`;
        },
        renderPreview: (component) => {
            return `<div class="preview-component image" 
                        data-texture="${component.properties.texture}"
                        style="left:${component.x}px;top:${component.y}px;width:${component.width}px;height:${component.height}px;opacity:${component.properties.alpha};">
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
            color: [1.0, 1.0, 1.0]
        },
        template: '#label-properties',
        render: (component) => {
            const color = util.rgbArrayToHex(component.properties.color);
            return `<div class="editor-component label" 
                        data-id="${component.id}" 
                        data-type="label"
                        style="left:${component.x}px;top:${component.y}px;color:${color};">
                        ${component.properties.text}
                    </div>`;
        },
        renderPreview: (component) => {
            const color = util.rgbArrayToHex(component.properties.color);
            return `<div class="preview-component label" 
                        style="left:${component.x}px;top:${component.y}px;color:${color};">
                        ${component.properties.text}
                    </div>`;
        },
        generateJSON: (component) => {
            return {
                type: "label",
                text: component.properties.text,
                color: component.properties.color,
                x: component.x,
                y: component.y
            };
        }
    }
};function getNextCollectionIndex(components) {
    let maxIndex = -1;
    
    components.forEach(component => {
        if (component.properties && 
            'collection_index' in component.properties && 
            component.properties.collection_index > maxIndex) {
            maxIndex = component.properties.collection_index;
        }
    });
    
    return maxIndex + 1;
}function createComponent(type, x = 0, y = 0) {
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
        console.log(`Assigned index ${component.properties.collection_index} to ${type}`);
    }
    
    return component;
}
