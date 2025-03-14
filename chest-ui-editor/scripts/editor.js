const editor = {
    
    components: [],
    selectedComponent: null,
    snapToGrid: false,
    init: function() {
        this.canvas = document.getElementById('component-container');
        this.componentList = document.getElementById('component-list-container');
        this.setupEventListeners();
        this.setupCanvasDragDrop();
        this.setupComponentDragging();
        this.updateComponentList();
    },
    setupEventListeners: function() {
        
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
    },
    setupCanvasDragDrop: function() {
        
        this.canvas.addEventListener('dragover', e => {
            e.preventDefault();
        });
        
        this.canvas.addEventListener('drop', e => {
            e.preventDefault();
            
            const type = e.dataTransfer.getData('component-type');
            if (!type) return;
            
            const rect = this.canvas.getBoundingClientRect();
            let x = e.clientX - rect.left;
            let y = e.clientY - rect.top;
            
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
        });
    },
    setupComponentDragging: function() {
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
        
        
        const onMouseMove = e => {
            if (!draggedComponent) return;
            
            e.preventDefault();
            
            
            let newX = offsetX + (e.clientX - startX);
            let newY = offsetY + (e.clientY - startY);
            
            
            if (this.snapToGrid) {
                newX = util.snapToGrid(newX);
                newY = util.snapToGrid(newY);
            }
            
            
            draggedComponent.x = newX
            draggedComponent.y = newY
            
            
            this.updateComponentPosition(draggedComponent);
        };
        
        
        const onMouseUp = e => {
            if (!draggedComponent) return;
            
            draggedComponent = null;
            
            
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
    },
    findComponentElement: function(target) {
        while (target && !target.classList.contains('editor-component')) {
            target = target.parentElement;
        }
        return target;
    },
    getComponentById: function(id) {
        return this.components.find(c => c.id === id) || null;
    },
    addComponent: function(component) {
        if (!component) return;
        
        this.components.push(component);
        this.renderComponent(component);
        preview.updatePreview(this.components);
        this.updateComponentList();
    },
    renderComponent: function(component) {
        const componentType = componentTypes[component.type];
        if (!componentType) return;
        
        const html = componentType.render(component);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        
        const element = tempDiv.firstElementChild;
        this.canvas.appendChild(element);
        
        
        element.addEventListener('click', e => {
            e.stopPropagation();
            this.selectComponent(component);
        });
    },
    updateComponentPosition: function(component) {
        const element = this.canvas.querySelector(`[data-id="${component.id}"]`);
        if (!element) return;
        
        element.style.left = `${component.x}px`;
        element.style.top = `${component.y}px`;
        
        preview.updateComponent(component);
        
        
        if (this.selectedComponent && this.selectedComponent.id === component.id) {
            const xInput = document.querySelector('[data-property="x"]');
            const yInput = document.querySelector('[data-property="y"]');
            
            if (xInput) xInput.value = component.x;
            if (yInput) yInput.value = component.y;
        }
    },
    updateComponent: function(component) {
        const element = this.canvas.querySelector(`[data-id="${component.id}"]`);
        if (!element) return;
        
        
        element.parentNode.removeChild(element);
        
        
        this.renderComponent(component);
        
        
        preview.updateComponent(component);
    },
    selectComponent: function(component) {
        
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
    removeComponent: function(component) {
        
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
    clearComponents: function() {
        this.components = [];
        this.canvas.innerHTML = '';
        this.selectComponent(null);
        preview.updatePreview([]);
        this.updateComponentList();
    },
    getComponents: function() {
        return [...this.components];
    },
    updateComponentList: function() {
        if (!this.componentList) return;
        
        
        this.componentList.innerHTML = '';
        
        
        if (this.components.length === 0) {
            this.componentList.innerHTML = '<p class="no-components">No components added</p>';
            return;
        }
        
        
        this.components.forEach((component, index) => {
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
                <span class="component-type">${componentType.name}</span>
                <span class="component-info">${displayInfo}</span>
            `;
            
            
            listItem.addEventListener('click', () => {
                this.selectComponent(component);
            });
            
            this.componentList.appendChild(listItem);
        });
    }
};
