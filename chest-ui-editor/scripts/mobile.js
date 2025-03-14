const mobile = {
    
    init: function() {
        const showComponentsBtn = document.getElementById('show-components');
        const showEditorBtn = document.getElementById('show-editor');
        const showPreviewBtn = document.getElementById('show-preview');
        
        const sidebar = document.querySelector('.sidebar');
        const editorArea = document.querySelector('.editor-area');
        const previewArea = document.querySelector('.preview-area');
        
        
        this.createFloatingComponentPanel();
        
        
        showComponentsBtn.addEventListener('click', function() {
            const drawer = document.getElementById('mobile-component-drawer');
            if (drawer.classList.contains('open')) {
                drawer.classList.remove('open');
                showComponentsBtn.innerHTML = '<i class="fas fa-th"></i> Open Components';
            } else {
                drawer.classList.add('open');
                showComponentsBtn.innerHTML = '<i class="fas fa-times"></i> Close Components';
            }
            
            
            sidebar.style.display = 'none';
            editorArea.style.display = 'block';
            previewArea.style.display = 'none';
            
            showEditorBtn.classList.add('active');
            showPreviewBtn.classList.remove('active');
        });
        
        showEditorBtn.addEventListener('click', function() {
            
            const drawer = document.getElementById('mobile-component-drawer');
            drawer.classList.remove('open');
            showComponentsBtn.innerHTML = '<i class="fas fa-th"></i> Open Components';
            
            sidebar.style.display = 'none';
            editorArea.style.display = 'block';
            previewArea.style.display = 'none';
            
            
            showComponentsBtn.classList.remove('active');
            showEditorBtn.classList.add('active');
            showPreviewBtn.classList.remove('active');
        });
        
        showPreviewBtn.addEventListener('click', function() {
            
            const drawer = document.getElementById('mobile-component-drawer');
            drawer.classList.remove('open');
            showComponentsBtn.innerHTML = '<i class="fas fa-th"></i> Open Components';
            
            sidebar.style.display = 'none';
            editorArea.style.display = 'none';
            previewArea.style.display = 'block';
            
            
            showComponentsBtn.classList.remove('active');
            showEditorBtn.classList.remove('active');
            showPreviewBtn.classList.add('active');
        });
        
        
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
        drawerHeader.innerHTML = 'Drag components to editor';
        drawer.insertBefore(drawerHeader, clonedList);
        
        
        document.querySelector('.app-container').appendChild(drawer);
        
        
        const drawerComponents = drawer.querySelectorAll('.component-item');
        drawerComponents.forEach(comp => {
            comp.addEventListener('dragstart', function(e) {
                const original = document.querySelector(`.component-item[data-type="${comp.dataset.type}"]`);
                if (original) {
                    
                    const event = new DragEvent('dragstart', {
                        bubbles: true,
                        cancelable: true,
                        dataTransfer: e.dataTransfer
                    });
                    original.dispatchEvent(event);
                }
            });
            
            comp.addEventListener('touchstart', function(e) {
                e.preventDefault();
                const type = comp.getAttribute('data-type');
                
                this.classList.add('touch-dragging');
                
            }, { passive: false });
        });
        
        drawer.addEventListener('touchend', function(e) {
            const touchElements = drawer.querySelectorAll('.touch-dragging');
            touchElements.forEach(el => el.classList.remove('touch-dragging'));
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
    },
    checkMobileLayout: function() {
        const isMobile = window.innerWidth < 768;
        const mobileNav = document.querySelector('.mobile-nav');
        const drawer = document.getElementById('mobile-component-drawer');
        
        if (isMobile) {
            
            mobileNav.style.display = 'flex';
            document.body.classList.add('mobile-view');
            
            if (drawer) drawer.style.display = 'block';
            
            
            document.querySelector('.sidebar').style.display = 'none';
            document.querySelector('.editor-area').style.display = 'block';
            document.querySelector('.preview-area').style.display = 'none';
            
            
            document.getElementById('show-components').classList.remove('active');
            document.getElementById('show-editor').classList.add('active');
            document.getElementById('show-preview').classList.remove('active');
            
            
            document.getElementById('show-components').innerHTML = '<i class="fas fa-th"></i> Open Components';
        } else {
            
            mobileNav.style.display = 'none';
            document.body.classList.remove('mobile-view');
            if (drawer) drawer.style.display = 'none';
            
            
            document.querySelector('.sidebar').style.display = 'block';
            document.querySelector('.editor-area').style.display = 'block';
            document.querySelector('.preview-area').style.display = 'block';
        }
    }
};
