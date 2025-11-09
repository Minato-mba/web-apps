const editor = {
    components: [],
    selectedComponent: null,
    selectedComponents: [],  // Array for multi-select
    lastClickedComponent: null,  // For Shift+Click range selection
    clipboard: null,  // Store copied components
    history: [],  // Undo/redo history
    historyIndex: -1,  // Current position in history
    maxHistorySize: 50,  // Maximum history entries
    isRestoringState: false,  // Flag to prevent history during restore
    snapToGrid: false,
    zoomLevel: 1,

    init: function () {
        this.canvas = document.getElementById('component-container');
        this.componentList = document.getElementById('component-list-container');
        this.editorCanvas = document.getElementById('editor-canvas');
        this.chestTopHalf = this.canvas.parentElement;  // Get the chest-top-half container
        this.setupEventListeners();
        this.setupCanvasDragDrop();
        this.setupComponentDragging();
        this.setupContextMenu();
        this.updateComponentList();
        this.setupZoom();
        
        // Save initial empty state
        this.saveState('Initial state');
    },

    setupEventListeners: function () {
        const toggleGridButton = document.getElementById('toggle-grid');
        toggleGridButton.addEventListener('click', () => {
            this.canvas.parentElement.classList.toggle('grid-on');
        });

        const snapToGridCheckbox = document.getElementById('snap-to-grid');
        snapToGridCheckbox.addEventListener('change', e => {
            this.snapToGrid = e.target.checked;
            e.target.blur();
        });

        // Store click handler flag at module level so selection box can access it
        this.ignoreNextCanvasClick = false;
        
        this.canvas.addEventListener('click', e => {
            // Ignore click if we just finished a selection box
            if (this.ignoreNextCanvasClick) {
                this.ignoreNextCanvasClick = false;
                return;
            }
            
            if (e.target === this.canvas) {
                this.selectComponent(null);
            }
        });

        document.addEventListener('keydown', e => {
            const isEditingField = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) ||
                e.target.isContentEditable;

            // Delete selected components
            if ((e.key === 'Delete' || e.key === 'Backspace') && !isEditingField) {
                e.preventDefault();
                if (this.selectedComponents.length > 0) {
                    // Delete all selected components as a batch
                    this.deleteComponents(this.selectedComponents);
                } else if (this.selectedComponent) {
                    this.removeComponent(this.selectedComponent);
                }
            }

            // Move selected components with arrow keys (1px at a time)
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && !isEditingField) {
                e.preventDefault();
                
                const componentsToMove = this.selectedComponents.length > 0 
                    ? this.selectedComponents 
                    : (this.selectedComponent ? [this.selectedComponent] : []);

                if (componentsToMove.length === 0) return;

                componentsToMove.forEach(component => {
                    switch(e.key) {
                        case 'ArrowUp':
                            component.y -= 1;
                            break;
                        case 'ArrowDown':
                            component.y += 1;
                            break;
                        case 'ArrowLeft':
                            component.x -= 1;
                            break;
                        case 'ArrowRight':
                            component.x += 1;
                            break;
                    }
                    this.updateComponentPosition(component);
                });

                // Save state once after all arrow key movements
                if (!this.isRestoringState) {
                    this.saveState('Move with arrow keys');
                }
            }

            // Keyboard shortcuts for copy/paste/cut/undo/redo/select all
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'a' && !isEditingField) {
                    e.preventDefault();
                    this.selectAllComponents();
                } else if (e.key === 'c' && !isEditingField) {
                    e.preventDefault();
                    this.copyComponents();
                } else if (e.key === 'x' && !isEditingField) {
                    e.preventDefault();
                    this.cutComponents();
                } else if (e.key === 'v' && !isEditingField) {
                    e.preventDefault();
                    this.pasteComponents();
                } else if (e.key === 'z' && !e.shiftKey && !isEditingField) {
                    e.preventDefault();
                    this.undo();
                } else if ((e.key === 'y' || (e.key === 'z' && e.shiftKey)) && !isEditingField) {
                    e.preventDefault();
                    this.redo();
                }
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
            // Account for browser zoom
            const scaleX = rect.width / this.canvas.offsetWidth;
            const scaleY = rect.height / this.canvas.offsetHeight;
            let x = (e.clientX - rect.left) / scaleX / this.zoomLevel;
            let y = (e.clientY - rect.top) / scaleY / this.zoomLevel;

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

                // Account for browser zoom
                const scaleX = rect.width / this.canvas.offsetWidth;
                const scaleY = rect.height / this.canvas.offsetHeight;
                let x = (touch.clientX - rect.left) / scaleX / this.zoomLevel;
                let y = (touch.clientY - rect.top) / scaleY / this.zoomLevel;

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
        let componentOffsets = [];  // Store offsets for all selected components
        let isSelectionBoxActive = false;
        let selectionBox = null;
        let selectionStartX = 0;
        let selectionStartY = 0;
        let justFinishedSelectionBox = false;  // Flag to prevent immediate click after selection box

        // Attach to the entire editor canvas area for maximum click area
        const clickArea = this.editorCanvas;
        
        clickArea.addEventListener('mousedown', e => {
            // Ignore clicks right after selection box finishes
            if (justFinishedSelectionBox) {
                justFinishedSelectionBox = false;
                return;
            }

            // Don't start selection on close button or other non-canvas elements
            if (e.target.classList.contains('chest-close-button') || 
                e.target.classList.contains('inventory-cell') ||
                e.target.classList.contains('hotbar-cell')) {
                return;
            }

            const component = this.findComponentElement(e.target);
            
            // If clicking on a component, handle component dragging or multi-select
            if (component) {
                const componentId = component.getAttribute('data-id');
                draggedComponent = this.getComponentById(componentId);

                if (!draggedComponent) return;

                // Handle multi-select with Ctrl/Cmd key (with or without Shift)
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggleComponentSelection(draggedComponent);
                    return; // Don't start dragging when Ctrl+clicking for multi-select
                }

                e.preventDefault();

                // If clicked component is not in current selection, make it the only selection
                if (!this.selectedComponents.includes(draggedComponent)) {
                    this.selectComponent(draggedComponent);
                }

                // Get mouse position relative to canvas accounting for scale
                const rect = this.canvas.getBoundingClientRect();
                startX = (e.clientX - rect.left);
                startY = (e.clientY - rect.top);

                // Store initial positions for all selected components
                const componentsToMove = this.selectedComponents.length > 0 
                    ? this.selectedComponents 
                    : [draggedComponent];
                
                componentOffsets = componentsToMove.map(comp => ({
                    component: comp,
                    offsetX: comp.x,
                    offsetY: comp.y
                }));

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
                return;
            }
            
            // If clicking on empty area, start selection box (only if no Ctrl key)
            if (e.ctrlKey || e.metaKey) {
                return; // Don't start selection box when Ctrl is pressed
            }
            
            e.preventDefault();
            isSelectionBoxActive = true;
            console.log('Starting selection box, isSelectionBoxActive:', isSelectionBoxActive);
            
            const rect = this.editorCanvas.getBoundingClientRect();
            // Account for browser zoom by getting actual rendered dimensions
            const scaleX = rect.width / this.editorCanvas.offsetWidth;
            const scaleY = rect.height / this.editorCanvas.offsetHeight;
            selectionStartX = (e.clientX - rect.left) / scaleX;
            selectionStartY = (e.clientY - rect.top) / scaleY;
            
            // Create selection box element
            selectionBox = document.createElement('div');
            selectionBox.className = 'selection-box';
            selectionBox.style.left = `${selectionStartX}px`;
            selectionBox.style.top = `${selectionStartY}px`;
            selectionBox.style.width = '0px';
            selectionBox.style.height = '0px';
            this.editorCanvas.appendChild(selectionBox);
            
            document.addEventListener('mousemove', onSelectionBoxMove);
            document.addEventListener('mouseup', onSelectionBoxEnd, { capture: true });
            // Add to editorCanvas directly to catch events inside
            this.editorCanvas.addEventListener('mouseup', onSelectionBoxEnd, { capture: true });
            // Also add to window as backup
            window.addEventListener('mouseup', onSelectionBoxEnd, { capture: true });
        });

        const onSelectionBoxMove = (e) => {
            if (!isSelectionBoxActive || !selectionBox) return;
            
            const rect = this.editorCanvas.getBoundingClientRect();
            // Account for browser zoom
            const scaleX = rect.width / this.editorCanvas.offsetWidth;
            const scaleY = rect.height / this.editorCanvas.offsetHeight;
            const currentX = (e.clientX - rect.left) / scaleX;
            const currentY = (e.clientY - rect.top) / scaleY;
            
            const left = Math.min(selectionStartX, currentX);
            const top = Math.min(selectionStartY, currentY);
            const width = Math.abs(currentX - selectionStartX);
            const height = Math.abs(currentY - selectionStartY);
            
            selectionBox.style.left = `${left}px`;
            selectionBox.style.top = `${top}px`;
            selectionBox.style.width = `${width}px`;
            selectionBox.style.height = `${height}px`;
            
            // Real-time selection feedback
            const boxLeft = left;
            const boxTop = top;
            const boxRight = left + width;
            const boxBottom = top + height;
            
            // Clear previous highlights
            const allComponents = this.canvas.querySelectorAll('.editor-component');
            allComponents.forEach(el => el.classList.remove('selecting'));
            
            const allListItems = this.componentList.querySelectorAll('.component-list-item');
            allListItems.forEach(el => el.classList.remove('selecting'));
            
            // Get component-container offset within editorCanvas
            const canvasRect = this.canvas.getBoundingClientRect();
            const editorRect = this.editorCanvas.getBoundingClientRect();
            const offsetX = (canvasRect.left - editorRect.left) / scaleX;
            const offsetY = (canvasRect.top - editorRect.top) / scaleY;
            
            // Highlight components within selection box
            this.components.forEach(comp => {
                // Convert component coordinates to editorCanvas coordinates
                // Scale component position and size by zoom level
                const compLeft = (comp.x * this.zoomLevel) + offsetX;
                const compTop = (comp.y * this.zoomLevel) + offsetY;
                const compRight = compLeft + ((comp.width || 18) * this.zoomLevel);
                const compBottom = compTop + ((comp.height || 18) * this.zoomLevel);
                
                // Check if component intersects with selection box
                if (compLeft < boxRight && compRight > boxLeft &&
                    compTop < boxBottom && compBottom > boxTop) {
                    
                    const element = this.canvas.querySelector(`[data-id="${comp.id}"]`);
                    if (element) {
                        element.classList.add('selecting');
                    }
                    
                    const listItem = this.componentList.querySelector(`[data-id="${comp.id}"]`);
                    if (listItem) {
                        listItem.classList.add('selecting');
                    }
                }
            });
        };

        const onSelectionBoxEnd = (e) => {
            console.log('onSelectionBoxEnd called:', {
                isActive: isSelectionBoxActive,
                target: e.target,
                targetClass: e.target.className,
                clientX: e.clientX,
                clientY: e.clientY
            });
            
            if (!isSelectionBoxActive) {
                console.log('Selection box not active, returning early');
                return;
            }
            
            // Immediately set to false to prevent multiple calls
            isSelectionBoxActive = false;
            console.log('Processing selection box end');
            
            // Remove all listeners first to prevent duplicate calls
            document.removeEventListener('mousemove', onSelectionBoxMove);
            document.removeEventListener('mouseup', onSelectionBoxEnd, { capture: true });
            this.editorCanvas.removeEventListener('mouseup', onSelectionBoxEnd, { capture: true });
            window.removeEventListener('mouseup', onSelectionBoxEnd, { capture: true });
            
            // Get selection box dimensions
            const rect = this.editorCanvas.getBoundingClientRect();
            // Account for browser zoom
            const scaleX = rect.width / this.editorCanvas.offsetWidth;
            const scaleY = rect.height / this.editorCanvas.offsetHeight;
            const currentX = (e.clientX - rect.left) / scaleX;
            const currentY = (e.clientY - rect.top) / scaleY;
            
            const boxLeft = Math.min(selectionStartX, currentX);
            const boxTop = Math.min(selectionStartY, currentY);
            const boxRight = Math.max(selectionStartX, currentX);
            const boxBottom = Math.max(selectionStartY, currentY);
            
            // Get component-container offset within editorCanvas
            const canvasRect = this.canvas.getBoundingClientRect();
            const editorRect = this.editorCanvas.getBoundingClientRect();
            const offsetX = (canvasRect.left - editorRect.left) / scaleX;
            const offsetY = (canvasRect.top - editorRect.top) / scaleY;
            
            // Find all components within the selection box
            const selectedComps = [];
            console.log('Box coords:', { boxLeft, boxTop, boxRight, boxBottom, offsetX, offsetY });
            console.log('Component count:', this.components.length);
            console.log('Editor zoom level:', this.zoomLevel);
            
            this.components.forEach(comp => {
                // Convert component coordinates to editorCanvas coordinates
                // Scale component position and size by zoom level
                const compLeft = (comp.x * this.zoomLevel) + offsetX;
                const compTop = (comp.y * this.zoomLevel) + offsetY;
                const compRight = compLeft + ((comp.width || 18) * this.zoomLevel);
                const compBottom = compTop + ((comp.height || 18) * this.zoomLevel);
                
                console.log(`Component ${comp.id}:`, { 
                    x: comp.x, y: comp.y, 
                    compLeft, compTop, compRight, compBottom,
                    intersects: (compLeft < boxRight && compRight > boxLeft && compTop < boxBottom && compBottom > boxTop)
                });
                
                // Check if component intersects with selection box
                if (compLeft < boxRight && compRight > boxLeft &&
                    compTop < boxBottom && compBottom > boxTop) {
                    selectedComps.push(comp);
                }
            });
            
            // Clear temporary selection feedback
            const allComponents = this.canvas.querySelectorAll('.editor-component');
            allComponents.forEach(el => el.classList.remove('selecting'));
            
            const allListItems = this.componentList.querySelectorAll('.component-list-item');
            allListItems.forEach(el => el.classList.remove('selecting'));
            
            console.log('Selected components:', selectedComps.length, selectedComps);
            
            // Select all components in the box
            if (selectedComps.length > 0) {
                console.log('Calling selectMultipleComponents with', selectedComps.length, 'components');
                this.selectMultipleComponents(selectedComps);
                
                // Set flag to ignore the next canvas click event
                // (which fires after mouseup if mouse hasn't moved much)
                this.ignoreNextCanvasClick = true;
                setTimeout(() => {
                    this.ignoreNextCanvasClick = false;
                }, 100);
            } else {
                console.log('No components selected, clearing selection');
                this.selectComponent(null);
            }
            
            // Remove selection box
            if (selectionBox && selectionBox.parentNode) {
                selectionBox.parentNode.removeChild(selectionBox);
            }
            selectionBox = null;
            
            // Set flag to prevent immediate mousedown from interfering
            justFinishedSelectionBox = true;
            // Clear the flag after a short delay
            setTimeout(() => {
                justFinishedSelectionBox = false;
            }, 50);
        };

        this.canvas.addEventListener('touchstart', e => {
            const component = this.findComponentElement(e.target);
            if (!component) return;

            e.preventDefault();

            const componentId = component.getAttribute ? component.getAttribute('data-id') : null;
            if (!componentId) return;

            draggedComponent = this.getComponentById(componentId);

            if (!draggedComponent) return;

            // For touch, always single select (no multi-select on mobile)
            this.selectComponent(draggedComponent);
            this.isDraggingComponent = true;

            // Get touch position relative to canvas accounting for scale
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            startX = (touch.clientX - rect.left);
            startY = (touch.clientY - rect.top);

            // Store initial positions for selected components
            const componentsToMove = this.selectedComponents.length > 0 
                ? this.selectedComponents 
                : [draggedComponent];
            
            componentOffsets = componentsToMove.map(comp => ({
                component: comp,
                offsetX: comp.x,
                offsetY: comp.y
            }));

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
            if (!draggedComponent || componentOffsets.length === 0) return;

            e.preventDefault();

            // Get current mouse position relative to canvas
            const rect = this.canvas.getBoundingClientRect();
            const currentX = (e.clientX - rect.left);
            const currentY = (e.clientY - rect.top);
            
            // Calculate delta in logical canvas pixels
            // Both start and current are in rendered pixels, divide by zoom to get logical pixels
            const deltaX = (currentX - startX) / this.zoomLevel;
            const deltaY = (currentY - startY) / this.zoomLevel;

            // Move all selected components together
            componentOffsets.forEach(({ component, offsetX, offsetY }) => {
                let newX = offsetX + deltaX;
                let newY = offsetY + deltaY;

                if (this.snapToGrid) {
                    newX = util.snapToGrid(newX);
                    newY = util.snapToGrid(newY);
                }
                // Don't round during drag to keep smooth movement at high zoom

                component.x = newX;
                component.y = newY;

                this.updateComponentPosition(component);
            });
        };

        const onMouseUp = e => {
            if (!draggedComponent) return;

            // Round to 1 decimal place after drag is complete
            if (!this.snapToGrid) {
                componentOffsets.forEach(({ component }) => {
                    component.x = Math.round(component.x * 10) / 10;
                    component.y = Math.round(component.y * 10) / 10;
                    this.updateComponentPosition(component);
                });
            }

            // Save state after moving components
            if (!this.isRestoringState) {
                this.saveState('Move component');
            }

            draggedComponent = null;
            componentOffsets = [];

            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        const onTouchMove = e => {
            if (!draggedComponent || componentOffsets.length === 0) return;

            e.preventDefault();
            e.stopPropagation();

            const touch = e.touches[0];
            
            // Get current touch position relative to canvas
            const rect = this.canvas.getBoundingClientRect();
            const currentX = (touch.clientX - rect.left);
            const currentY = (touch.clientY - rect.top);
            
            // Calculate delta in logical canvas pixels
            const canvasLogicalWidth = this.canvas.offsetWidth;
            const canvasRenderedWidth = rect.width;
            const scale = canvasRenderedWidth / canvasLogicalWidth;
            
            const deltaX = (currentX - startX) / scale;
            const deltaY = (currentY - startY) / scale;

            // Move all selected components together
            componentOffsets.forEach(({ component, offsetX, offsetY }) => {
                let newX = offsetX + deltaX;
                let newY = offsetY + deltaY;

                if (this.snapToGrid) {
                    newX = util.snapToGrid(newX);
                    newY = util.snapToGrid(newY);
                }
                // Don't round during drag to keep smooth movement at high zoom

                component.x = newX;
                component.y = newY;

                this.updateComponentPosition(component);
            });
        };

        const onTouchEnd = e => {
            if (!draggedComponent) return;

            e.preventDefault();
            e.stopPropagation();

            // Round to 1 decimal place after drag is complete
            if (!this.snapToGrid) {
                componentOffsets.forEach(({ component }) => {
                    component.x = Math.round(component.x * 10) / 10;
                    component.y = Math.round(component.y * 10) / 10;
                    this.updateComponentPosition(component);
                });
            }

            this.isDraggingComponent = false;
            draggedComponent = null;
            componentOffsets = [];

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
        
        // Save state after adding component
        if (!this.isRestoringState) {
            this.saveState('Add component');
        }
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

        // Note: Component selection is now handled in setupComponentDragging
        // Don't add click listener here as it interferes with multi-select
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
    toggleComponentSelection: function (component) {
        const index = this.selectedComponents.indexOf(component);
        
        if (index > -1) {
            // Remove from selection
            this.selectedComponents.splice(index, 1);
            const element = this.canvas.querySelector(`[data-id="${component.id}"]`);
            if (element) {
                element.classList.remove('selected');
            }
            
            const listItem = this.componentList.querySelector(`[data-id="${component.id}"]`);
            if (listItem) {
                listItem.classList.remove('selected');
            }
        } else {
            // Add to selection
            this.selectedComponents.push(component);
            const element = this.canvas.querySelector(`[data-id="${component.id}"]`);
            if (element) {
                element.classList.add('selected');
            }
            
            const listItem = this.componentList.querySelector(`[data-id="${component.id}"]`);
            if (listItem) {
                listItem.classList.add('selected');
            }
        }

        // Update selectedComponent to the last selected
        this.selectedComponent = this.selectedComponents.length > 0 
            ? this.selectedComponents[this.selectedComponents.length - 1] 
            : null;

        // Show properties for multi-select
        if (this.selectedComponents.length > 1) {
            propertiesPanel.showMultiSelectProperties(this.selectedComponents);
        } else if (this.selectedComponents.length === 1) {
            propertiesPanel.showPropertiesFor(this.selectedComponents[0]);
        } else {
            propertiesPanel.showPropertiesFor(null);
        }
    },

    selectMultipleComponents: function (components) {
        // Clear all previous selections
        const prevSelected = this.canvas.querySelectorAll('.editor-component.selected');
        prevSelected.forEach(el => el.classList.remove('selected'));

        const prevSelectedListItem = this.componentList.querySelectorAll('.component-list-item.selected');
        prevSelectedListItem.forEach(el => el.classList.remove('selected'));

        // Set new selections
        this.selectedComponents = [...components];
        this.selectedComponent = components.length > 0 ? components[0] : null;

        // Highlight all selected components
        components.forEach(comp => {
            const element = this.canvas.querySelector(`[data-id="${comp.id}"]`);
            if (element) {
                element.classList.add('selected');
            }

            const listItem = this.componentList.querySelector(`[data-id="${comp.id}"]`);
            if (listItem) {
                listItem.classList.add('selected');
            }
        });

        // Show properties
        if (components.length > 1) {
            propertiesPanel.showMultiSelectProperties(components);
        } else if (components.length === 1) {
            propertiesPanel.showPropertiesFor(components[0]);
        } else {
            propertiesPanel.showPropertiesFor(null);
        }
    },

    selectAllComponents: function () {
        if (this.components.length === 0) return;
        
        // Select all components
        this.selectMultipleComponents(this.components);
        
        console.log(`Selected all ${this.components.length} component(s)`);
    },

    selectRangeInList: function (startComponent, endComponent, sortedComponents) {
        // Find the indices of start and end components
        const startIndex = sortedComponents.findIndex(c => c.id === startComponent.id);
        const endIndex = sortedComponents.findIndex(c => c.id === endComponent.id);
        
        if (startIndex === -1 || endIndex === -1) return;
        
        // Determine range direction
        const minIndex = Math.min(startIndex, endIndex);
        const maxIndex = Math.max(startIndex, endIndex);
        
        // Select all components in range
        const componentsInRange = sortedComponents.slice(minIndex, maxIndex + 1);
        this.selectMultipleComponents(componentsInRange);
    },

    selectComponent: function (component) {
        // Clear all previous selections
        const prevSelected = this.canvas.querySelectorAll('.editor-component.selected');
        prevSelected.forEach(el => el.classList.remove('selected'));

        const prevSelectedListItem = this.componentList.querySelectorAll('.component-list-item.selected');
        prevSelectedListItem.forEach(el => el.classList.remove('selected'));

        // Clear multi-select array
        this.selectedComponents = [];
        this.selectedComponent = component;

        if (component) {
            // Add to multi-select array
            this.selectedComponents.push(component);

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
    removeComponent: function (component, skipStateSave = false) {
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
        
        // Save state after removing component (unless skipped for batch operations)
        if (!this.isRestoringState && !skipStateSave) {
            this.saveState('Remove component');
        }
    },

    deleteComponents: function (componentsToDelete) {
        if (!componentsToDelete || componentsToDelete.length === 0) return;

        // Delete all components without saving state for each
        [...componentsToDelete].forEach(component => {
            this.removeComponent(component, true);  // Skip state save
        });

        this.selectedComponents = [];
        this.selectedComponent = null;

        // Save state once after all deletions
        if (!this.isRestoringState) {
            const count = componentsToDelete.length;
            this.saveState(`Delete ${count} component${count > 1 ? 's' : ''}`);
        }
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

            listItem.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Shift+Click for range selection
                if (e.shiftKey && this.lastClickedComponent) {
                    e.preventDefault();
                    this.selectRangeInList(this.lastClickedComponent, component, sortedComponents);
                }
                // Ctrl+Click for toggle selection
                else if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.toggleComponentSelection(component);
                    this.lastClickedComponent = component;
                }
                // Regular click
                else {
                    this.selectComponent(component);
                    this.lastClickedComponent = component;
                }
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
    },

    setupContextMenu: function () {
        const contextMenu = document.getElementById('context-menu');
        const copyBtn = document.getElementById('context-copy');
        const cutBtn = document.getElementById('context-cut');
        const pasteBtn = document.getElementById('context-paste');

        // Show context menu on right-click
        this.editorCanvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();

            // Only show if components are selected
            if (this.selectedComponents.length === 0) {
                contextMenu.style.display = 'none';
                return;
            }

            // Position menu at mouse location
            contextMenu.style.left = `${e.clientX}px`;
            contextMenu.style.top = `${e.clientY}px`;
            contextMenu.style.display = 'block';

            // Show paste option only if clipboard has content
            if (this.clipboard && this.clipboard.length > 0) {
                pasteBtn.style.display = 'flex';
            } else {
                pasteBtn.style.display = 'none';
            }
        });

        // Hide context menu when clicking elsewhere
        document.addEventListener('click', () => {
            contextMenu.style.display = 'none';
        });

        // Context menu actions
        copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.copyComponents();
            contextMenu.style.display = 'none';
        });

        cutBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.cutComponents();
            contextMenu.style.display = 'none';
        });

        pasteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.pasteComponents();
            contextMenu.style.display = 'none';
        });
    },

    copyComponents: function () {
        if (this.selectedComponents.length === 0) return;

        // Deep clone all selected components with all their properties
        this.clipboard = this.selectedComponents.map(comp => ({
            id: util.generateUniqueId(),  // Generate new ID for paste
            type: comp.type,
            x: comp.x,
            y: comp.y,
            width: comp.width,
            height: comp.height,
            zIndex: comp.zIndex,
            properties: JSON.parse(JSON.stringify(comp.properties))  // Deep clone properties
        }));

        console.log(`Copied ${this.clipboard.length} component(s)`);
        alert(`Copied ${this.clipboard.length} component(s)`);
    },

    cutComponents: function () {
        if (this.selectedComponents.length === 0) return;

        // Copy first
        this.copyComponents();

        // Then delete as a batch
        this.deleteComponents(this.selectedComponents);
    },

    pasteComponents: function () {
        if (!this.clipboard || this.clipboard.length === 0) return;

        // Clear current selection
        this.selectComponent(null);

        // Paste components with slight offset
        const pastedComponents = [];
        this.clipboard.forEach(comp => {
            const newComponent = {
                id: util.generateUniqueId(),  // New unique ID
                type: comp.type,
                x: comp.x + 10,  // Offset by 10px so it doesn't overlap exactly
                y: comp.y + 10,
                width: comp.width,
                height: comp.height,
                properties: JSON.parse(JSON.stringify(comp.properties))  // Deep clone properties
            };

            this.addComponent(newComponent);
            pastedComponents.push(newComponent);
        });

        // Select the newly pasted components
        if (pastedComponents.length > 0) {
            this.selectMultipleComponents(pastedComponents);
        }

        console.log(`Pasted ${pastedComponents.length} component(s)`);
        
        // Save state after pasting
        this.saveState('Paste components');
    },

    saveState: function (action) {
        // Don't save during restore operations
        if (this.isRestoringState) return;

        // Create deep clone of current state
        const state = {
            action: action,
            timestamp: Date.now(),
            components: JSON.parse(JSON.stringify(this.components))
        };

        // Remove any states after current index (for redo after undo)
        this.history = this.history.slice(0, this.historyIndex + 1);

        // Add new state
        this.history.push(state);

        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }

        console.log(`State saved: ${action} (${this.historyIndex + 1}/${this.history.length})`);
    },

    undo: function () {
        if (this.historyIndex <= 0) {
            console.log('Nothing to undo');
            return;
        }

        this.historyIndex--;
        this.restoreState(this.history[this.historyIndex]);
        console.log(`Undo: ${this.history[this.historyIndex].action} (${this.historyIndex + 1}/${this.history.length})`);
    },

    redo: function () {
        if (this.historyIndex >= this.history.length - 1) {
            console.log('Nothing to redo');
            return;
        }

        this.historyIndex++;
        this.restoreState(this.history[this.historyIndex]);
        console.log(`Redo: ${this.history[this.historyIndex].action} (${this.historyIndex + 1}/${this.history.length})`);
    },

    restoreState: function (state) {
        this.isRestoringState = true;

        // Clear current components
        this.components = [];
        this.canvas.innerHTML = '';

        // Restore components from state
        const restoredComponents = JSON.parse(JSON.stringify(state.components));
        restoredComponents.forEach(comp => {
            this.components.push(comp);
            this.renderComponent(comp);
        });

        // Clear selection
        this.selectComponent(null);

        // Update views
        preview.updatePreview(this.components);
        this.updateComponentList();
        this.fixComponentZIndices();

        this.isRestoringState = false;
    }
};
