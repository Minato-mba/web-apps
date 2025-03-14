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
        
        showComponentsBtn.addEventListener('click', function() {
            const drawer = document.getElementById('mobile-component-drawer');
            if (drawer.classList.contains('open')) {
                drawer.classList.remove('open');
                showComponentsBtn.innerHTML = '<i class="fas fa-th"></i> Open Components';
            } else {
                drawer.classList.add('open');
                showComponentsBtn.innerHTML = '<i class="fas fa-times"></i> Close Components';
                
                // Close template drawer if open
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
                
                // Close component drawer if open
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
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;
        
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
        
        // Clone the template list
        const templateList = document.querySelector('.template-list');
        const clonedList = templateList.cloneNode(true);
        drawer.appendChild(clonedList);
        
        // Create header
        const drawerHeader = document.createElement('div');
        drawerHeader.className = 'drawer-header';
        drawerHeader.innerHTML = '<span>Select a template</span>';
        drawer.insertBefore(drawerHeader, clonedList);
        
        // Add to document
        document.querySelector('.app-container').appendChild(drawer);
        
        // Add event listeners to template items
        const templateItems = drawer.querySelectorAll('.template-item');
        templateItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const templateName = item.getAttribute('data-template');
                if (templateName) {
                    // Use the existing template functionality
                    if (window.templates && templates.loadTemplate) {
                        templates.loadTemplate(templateName);
                        
                        // Close the drawer
                        drawer.classList.remove('open');
                        const showTemplatesBtn = document.getElementById('show-templates');
                        if (showTemplatesBtn) {
                            showTemplatesBtn.innerHTML = '<i class="fas fa-layer-group"></i> Open Templates';
                        }
                    }
                }
            });
        });
        
        // Add close button
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
    
    checkMobileLayout: function() {
        const isMobile = window.innerWidth < 768;
        const mobileNav = document.querySelector('.mobile-nav');
        const componentDrawer = document.getElementById('mobile-component-drawer');
        const templateDrawer = document.getElementById('mobile-templates-drawer');
        
        if (isMobile) {
            mobileNav.style.display = 'flex';
            document.body.classList.add('mobile-view');
            
            if (componentDrawer) componentDrawer.style.display = 'block';
            if (templateDrawer) templateDrawer.style.display = 'block';
            
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
            
            document.querySelector('.sidebar').style.display = 'block';
            document.querySelector('.editor-area').style.display = 'block';
            document.querySelector('.preview-area').style.display = 'block';
            document.querySelector('.template-selector-panel').style.display = 'block';
        }
    }
};
