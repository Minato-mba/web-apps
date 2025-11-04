const editor = {
    components: [],
    selectedComponent: null,
    snapToGrid: false,
    zoomLevel: 1,

    init: function () {
        this.canvas = document.getElementById('component-container');
        this.componentList = document.getElementById('component-list-container');
        this.editorCanvas = document.getElementById('editor-canvas');
        this.setupEventListeners();
        this.setupCanvasDragDrop();
        this.setupComponentDragging();
        this.updateComponentList();
        this.setupZoom();
    },

    setupEventListeners: function () {
        const toggleGridButton = document.getElementById('toggle-grid');
        toggleGridButton.addEventListener('click', () => {
            this.canvas.parentElement.classList.toggle('grid-on');
        });

        const snapToGridCheckbox = document.getElementById('snap-to-grid');
        snapToGridCheckbox.addEventListener('change', e => {
            this.snapToGrid = e.target.checked;
        });

        this.canvas.addEventListener('click', e => {
            if (e.target === this.canvas) {
                this.selectComponent(null);
            }
        });

        document.addEventListener('keydown', e => {
            const isEditingField = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) ||
                e.target.isContentEditable;

            if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedComponent && !isEditingField) {
                e.preventDefault();
                this.removeComponent(this.selectedComponent);
            }
        });

        this.editorCanvas.addEventListener('wheel', e => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                this.adjustZoom(delta);
            }
        });
    },

    setupCanvasDragDrop: function () {
        this.canvas.addEventListener('dragover', e => {
            e.preventDefault();
        });

        this.canvas.addEventListener('drop', e => {
            e.preventDefault();

            const type = e.dataTransfer.getData('component-type');
            if (!type) return;

            const rect = this.canvas.getBoundingClientRect();
            let x = (e.clientX - rect.left) / this.zoomLevel;
            let y = (e.clientY - rect.top) / this.zoomLevel;

            if (this.snapToGrid) {
                x = util.snapToGrid(x);
                y = util.snapToGrid(y);
            }

            const component = createComponent(type, x, y);
            this.addComponent(component);
            this.selectComponent(component);
        });

        const componentItems = document.querySelectorAll('.component-item');
        componentItems.forEach(item => {
            item.addEventListener('dragstart', e => {
                const type = item.getAttribute('data-type');
                e.dataTransfer.setData('component-type', type);
            });

            item.addEventListener('touchstart', e => {
                e.preventDefault();

                const type = item.getAttribute('data-type');
                this.currentTouchComponent = {
                    type: type,
                    element: item
                };

                item.classList.add('touch-dragging');
            }, { passive: false });
        });

        this.canvas.addEventListener('touchend', e => {
            if (!this.currentTouchComponent) return;

            e.preventDefault();

            const touch = e.changedTouches[0];
            const rect = this.canvas.getBoundingClientRect();

            if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
                touch.clientY >= rect.top && touch.clientY <= rect.bottom) {

                let x = (touch.clientX - rect.left) / this.zoomLevel;
                let y = (touch.clientY - rect.top) / this.zoomLevel;

                if (this.snapToGrid) {
                    x = util.snapToGrid(x);
                    y = util.snapToGrid(y);
                }

                const component = createComponent(this.currentTouchComponent.type, x, y);
                this.addComponent(component);
                this.selectComponent(component);
            }

            this.currentTouchComponent.element.classList.remove('touch-dragging');
            this.currentTouchComponent = null;
        }, { passive: false });

        document.body.addEventListener('touchend', e => {
            if (this.currentTouchComponent && this.currentTouchComponent.element) {
                if (this.currentTouchComponent.element.classList) {
                    this.currentTouchComponent.element.classList.remove('touch-dragging');
                }
                this.currentTouchComponent = null;
            }
        });

        document.body.addEventListener('touchmove', e => {
            if (this.currentTouchComponent) {
                e.preventDefault();
            }
        }, { passive: false });
    },

    setupComponentDragging: function () {
        let draggedComponent = null;
        let startX = 0;
        let startY = 0;
        let offsetX = 0;
        let offsetY = 0;

        this.canvas.addEventListener('mousedown', e => {
            const component = this.findComponentElement(e.target);
            if (!component) return;

            e.preventDefault();

            const componentId = component.getAttribute('data-id');
            draggedComponent = this.getComponentById(componentId);

            if (!draggedComponent) return;

            this.selectComponent(draggedComponent);

            startX = e.clientX;
            startY = e.clientY;
            offsetX = draggedComponent.x;
            offsetY = draggedComponent.y;

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        this.canvas.addEventListener('touchstart', e => {
            const component = this.findComponentElement(e.target);
            if (!component) return;

            e.preventDefault();

            const componentId = component.getAttribute ? component.getAttribute('data-id') : null;
            if (!componentId) return;

            draggedComponent = this.getComponentById(componentId);

            if (!draggedComponent) return;

            this.selectComponent(draggedComponent);
            this.isDraggingComponent = true;

            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            offsetX = draggedComponent.x;
            offsetY = draggedComponent.y;

            document.addEventListener('touchmove', onTouchMove, { passive: false });
            document.addEventListener('touchend', onTouchEnd, { passive: false });
            document.addEventListener('touchcancel', onTouchEnd, { passive: false });
        }, { passive: false });

        document.body.addEventListener('touchmove', e => {
            if (this.isDraggingComponent) {
                e.preventDefault();
            }
        }, { passive: false });

        const onMouseMove = e => {
            if (!draggedComponent) return;

            e.preventDefault();

            let newX = offsetX + (e.clientX - startX) / this.zoomLevel;
            let newY = offsetY + (e.clientY - startY) / this.zoomLevel;

            if (this.snapToGrid) {
                newX = util.snapToGrid(newX);
                newY = util.snapToGrid(newY);
            }

            draggedComponent.x = newX;
            draggedComponent.y = newY;

            this.updateComponentPosition(draggedComponent);
        };

        const onMouseUp = e => {
            if (!draggedComponent) return;

            draggedComponent = null;

            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        const onTouchMove = e => {
            if (!draggedComponent) return;

            e.preventDefault();
            e.stopPropagation();

            const touch = e.touches[0];

            let newX = offsetX + (touch.clientX - startX) / this.zoomLevel;
            let newY = offsetY + (touch.clientY - startY) / this.zoomLevel;

            if (this.snapToGrid) {
                newX = util.snapToGrid(newX);
                newY = util.snapToGrid(newY);
            }

            draggedComponent.x = newX;
            draggedComponent.y = newY;

            this.updateComponentPosition(draggedComponent);
        };

        const onTouchEnd = e => {
            if (!draggedComponent) return;

            e.preventDefault();
            e.stopPropagation();

            this.isDraggingComponent = false;
            draggedComponent = null;

            document.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('touchend', onTouchEnd);
            document.removeEventListener('touchcancel', onTouchEnd);
        };
    },
    findComponentElement: function (target) {
        while (target && target !== this.canvas) {
            if (target.classList && target.classList.contains('editor-component')) {
                return target;
            }
            target = target.parentElement;
        }
        return null;
    },
    getComponentById: function (id) {
        return this.components.find(c => c.id === id) || null;
    },
    addComponent: function (component) {
        if (!component) return;

        if (component.zIndex === undefined) {
            const maxZIndex = this.components.reduce((max, comp) =>
                Math.max(max, comp.zIndex || 0), 0);

            component.zIndex = maxZIndex + 10;
        }

        this.components.push(component);
        this.renderComponent(component);
        preview.updatePreview(this.getComponents());
        this.updateComponentList();
    },
    renderComponent: function (component) {
        const componentType = componentTypes[component.type];
        if (!componentType) return;

        const html = componentType.render(component);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        const element = tempDiv.firstElementChild;

        if (component.zIndex !== undefined) {
            element.style.zIndex = component.zIndex;
        } else {
            component.zIndex = 0; element.style.zIndex = 0;
        }

        this.canvas.appendChild(element);

        element.addEventListener('click', e => {
            e.stopPropagation();
            this.selectComponent(component);
        });
    },
    updateComponentPosition: function (component) {
        const element = this.canvas.querySelector(`[data-id="${component.id}"]`);
        if (!element) return;

        element.style.left = `${component.x}px`;
        element.style.top = `${component.y}px`;

        if (component.zIndex !== undefined) {
            element.style.zIndex = component.zIndex;
        }

        preview.updateComponent(component);

        if (this.selectedComponent && this.selectedComponent.id === component.id) {
            const xInput = document.querySelector('[data-property="x"]');
            const yInput = document.querySelector('[data-property="y"]');

            if (xInput) xInput.value = component.x;
            if (yInput) yInput.value = component.y;
        }
    },
    updateComponent: function (component) {
        const element = this.canvas.querySelector(`[data-id="${component.id}"]`);
        if (!element) return;

        element.parentNode.removeChild(element);

        this.renderComponent(component);

        preview.updateComponent(component);
    },
    selectComponent: function (component) {
        const prevSelected = this.canvas.querySelector('.editor-component.selected');
        if (prevSelected) {
            prevSelected.classList.remove('selected');
        }

        const prevSelectedListItem = this.componentList.querySelector('.component-list-item.selected');
        if (prevSelectedListItem) {
            prevSelectedListItem.classList.remove('selected');
        }

        this.selectedComponent = component;

        if (component) {
            const element = this.canvas.querySelector(`[data-id="${component.id}"]`);
            if (element) {
                element.classList.add('selected');

                element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }

            const listItem = this.componentList.querySelector(`[data-id="${component.id}"]`);
            if (listItem) {
                listItem.classList.add('selected');
                listItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }

        propertiesPanel.showPropertiesFor(component);
    },
    removeComponent: function (component) {
        const index = this.components.findIndex(c => c.id === component.id);
        if (index !== -1) {
            this.components.splice(index, 1);
        }

        const element = this.canvas.querySelector(`[data-id="${component.id}"]`);
        if (element) {
            element.parentNode.removeChild(element);
        }

        if (this.selectedComponent && this.selectedComponent.id === component.id) {
            this.selectComponent(null);
        }

        preview.updatePreview(this.components);
        this.updateComponentList();
    },
    clearComponents: function () {
        this.components = [];
        this.canvas.innerHTML = '';
        this.selectComponent(null);
        preview.updatePreview([]);
        this.updateComponentList();
    },
    getComponents: function () {
        return [...this.components].sort((a, b) => {
            return (a.zIndex || 0) - (b.zIndex || 0);
        });
    },
    updateComponentList: function () {
        if (!this.componentList) return;

        this.componentList.innerHTML = '';

        if (this.components.length === 0) {
            this.componentList.innerHTML = '<p class="no-components">No components added</p>';
            return;
        }

        const sortedComponents = [...this.components].sort((a, b) => {
            return (a.zIndex || 0) - (b.zIndex || 0);
        });

        sortedComponents.forEach((component, index) => {
            const componentType = componentTypes[component.type];
            if (!componentType) return;

            const listItem = document.createElement('div');
            listItem.className = 'component-list-item';
            if (this.selectedComponent && this.selectedComponent.id === component.id) {
                listItem.classList.add('selected');
            }
            listItem.setAttribute('data-id', component.id);

            let displayInfo = '';
            if (component.type === 'label') {
                displayInfo = `"${component.properties.text.substring(0, 15)}"`;
                if (component.properties.text.length > 15) displayInfo += '...';
            } else if (component.properties.collection_index !== undefined) {
                displayInfo = `Index: ${component.properties.collection_index}`;
            }

            listItem.innerHTML = `
                <div class="component-info-container">
                    <span class="component-type">${componentType.name}</span>
                    <span class="component-info">${displayInfo}</span>
                </div>
                <div class="reorder-controls">
                    <button class="move-up-btn" title="Move Up" ${index === 0 ? 'disabled' : ''}><i class="fas fa-arrow-up"></i></button>
                    <button class="move-down-btn" title="Move Down" ${index === sortedComponents.length - 1 ? 'disabled' : ''}><i class="fas fa-arrow-down"></i></button>
                </div>
            `;

            listItem.addEventListener('click', () => {
                this.selectComponent(component);
            });

            const moveUpBtn = listItem.querySelector('.move-up-btn');
            const moveDownBtn = listItem.querySelector('.move-down-btn');

            moveUpBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (index > 0) {
                    this.reorderComponent(component, -1);
                }
            });

            moveDownBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (index < sortedComponents.length - 1) {
                    this.reorderComponent(component, 1);
                }
            });

            this.componentList.appendChild(listItem);
        });
    },
    reorderComponent: function (component, direction) {
        this.components.forEach((c, index) => {
            if (c.zIndex === undefined) {
                c.zIndex = index * 10;
            }
        });

        const sortedComponents = [...this.components].sort((a, b) => {
            return (a.zIndex || 0) - (b.zIndex || 0);
        });

        const currentIndex = sortedComponents.findIndex(c => c.id === component.id);
        const targetIndex = currentIndex + direction;

        if (targetIndex < 0 || targetIndex >= sortedComponents.length) {
            return;
        }

        sortedComponents.forEach((c, i) => {
            c.zIndex = i * 10;
        });

        const targetComponent = sortedComponents[targetIndex];
        const tempZIndex = component.zIndex;
        component.zIndex = targetComponent.zIndex;
        targetComponent.zIndex = tempZIndex;

        const componentElement = this.canvas.querySelector(`[data-id="${component.id}"]`);
        const targetElement = this.canvas.querySelector(`[data-id="${targetComponent.id}"]`);

        if (componentElement) componentElement.style.zIndex = component.zIndex;
        if (targetElement) targetElement.style.zIndex = targetComponent.zIndex;

        this.updateComponentList();
        preview.updatePreview(this.getComponents());
    },
    fixComponentZIndices: function () {
        this.components.forEach((c, index) => {
            if (c.zIndex === undefined) {
                c.zIndex = index * 10;
            }
        });

        this.components.forEach(component => {
            const element = this.canvas.querySelector(`[data-id="${component.id}"]`);
            if (element) {
                element.style.zIndex = component.zIndex;
            }
        });
    },
    setupZoom: function () {
        const zoomControls = document.createElement('div');
        zoomControls.className = 'zoom-controls';
        zoomControls.innerHTML = `
            <button id="editor-zoom-out" class="zoom-btn" title="Zoom Out"><i class="fas fa-search-minus"></i></button>
            <span id="editor-zoom-level" class="zoom-level">100%</span>
            <button id="editor-zoom-in" class="zoom-btn" title="Zoom In"><i class="fas fa-search-plus"></i></button>
            <button id="editor-zoom-reset" class="zoom-btn" title="Reset Zoom"><i class="fas fa-sync-alt"></i></button>
        `;

        const headerControls = document.querySelector('.editor-area .panel-header .editor-controls-container');
        if (headerControls) {
            headerControls.prepend(zoomControls);
        }

        document.getElementById('editor-zoom-in').addEventListener('click', () => this.adjustZoom(0.1));
        document.getElementById('editor-zoom-out').addEventListener('click', () => this.adjustZoom(-0.1));
        document.getElementById('editor-zoom-reset').addEventListener('click', () => this.setZoom(1));
    },

    setZoom: function (level) {
        this.zoomLevel = level;
        this.applyZoom();
        this.updateZoomDisplay();
    },

    adjustZoom: function (delta) {
        const newZoom = Math.max(0.25, Math.min(3, this.zoomLevel + delta));
        this.setZoom(newZoom);
    },

    applyZoom: function () {
        const chestPanel = this.editorCanvas.querySelector('.chest-panel');
        if (chestPanel) {
            chestPanel.style.transform = `scale(${this.zoomLevel})`;
            chestPanel.style.transformOrigin = 'top center';

            this.editorCanvas.style.padding = this.zoomLevel > 1 ?
                `${20 * this.zoomLevel}px` : '20px';
        }
    },

    updateZoomDisplay: function () {
        const display = document.getElementById('editor-zoom-level');
        if (display) {
            display.textContent = `${Math.round(this.zoomLevel * 100)}%`;
        }
    }
};
