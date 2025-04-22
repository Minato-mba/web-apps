const UI = {
    currentPackId: null,
    previewPackColor: null,
    previewPackIconIndex: null,

    initialize: function () {
        Storage.initialize();

        const activePackId = Storage.getActivePack();
        if (activePackId) {
            const pack = Storage.getPack(activePackId);
            if (pack) {
                this.loadPack(activePackId);
            } else {
                Storage.clearActivePack();
                this.showWelcomeScreen();
            }
        } else {
            this.showWelcomeScreen();
        }
        this.setupEventListeners();
    },

    setupEventListeners: function () {
        document.getElementById('create-pack-btn').addEventListener('click', () => this.showModal('create-pack-modal'));
        document.getElementById('load-pack-btn').addEventListener('click', () => this.showLoadPackModal());
        document.getElementById('add-head-btn').addEventListener('click', () => this.showModal('add-head-modal'));
        document.getElementById('generate-pack-btn').addEventListener('click', () => this.showGenerateModal());
        document.getElementById('save-pack-btn').addEventListener('click', () => this.saveCurrentPack());
        document.getElementById('delete-pack-btn').addEventListener('click', () => this.confirmDeletePack());
        document.getElementById('back-to-menu-btn').addEventListener('click', () => this.backToMenu());

        document.getElementById('delete-head-btn').addEventListener('click', () => {
            const headName = document.getElementById('edit-head-name').value;
            if (headName) {
                this.confirmDeleteHead(headName);
            }
        });

        document.getElementById('create-pack-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const packName = document.getElementById('pack-name').value.trim();
            if (packName) {
                this.createNewPack(packName);
            }
        });

        const addHeadForm = document.getElementById('add-head-form');
        addHeadForm.addEventListener('submit', (e) => {
            e.preventDefault();

            if (addHeadForm.dataset.processing === 'true') {
                return;
            }

            addHeadForm.dataset.processing = 'true';

            this.addHead()
                .then(() => {
                    this.hideModal('add-head-modal');
                    addHeadForm.reset();
                    this.resetFileButtonText('skin-file');
                })
                .catch(error => {
                    console.error('Error adding head:', error);
                    this.showToast(error.message || 'Failed to add head', 'error');
                })
                .finally(() => {

                    addHeadForm.dataset.processing = 'false';
                });
        });

        const editHeadForm = document.getElementById('edit-head-form');
        editHeadForm.addEventListener('submit', (e) => {
            e.preventDefault();

            if (editHeadForm.dataset.processing === 'true') {
                return;
            }

            editHeadForm.dataset.processing = 'true';

            this.updateHead()
                .then(() => {
                    this.hideModal('edit-head-modal');
                    editHeadForm.reset();

                    this.resetFileButtonText('edit-skin-file');
                })
                .catch(error => {
                    console.error('Error updating head:', error);
                    this.showToast(error.message || 'Failed to update head', 'error');
                })
                .finally(() => {
                    editHeadForm.dataset.processing = 'false';
                });
        });

        document.getElementById('search-heads').addEventListener('input', (e) => {
            this.filterHeads(e.target.value.trim().toLowerCase());
        });

        document.getElementById('generate-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.generateAddon();
        });

        const importBtn = document.getElementById('import-pack-btn');
        importBtn.addEventListener('click', (e) => {
            if (importBtn.dataset.processing === 'true') {
                return;
            }

            importBtn.dataset.processing = 'true';

            this.importPackFromFile()
                .then(() => {
                    document.getElementById('import-pack-file').value = '';
                    this.resetFileButtonText('import-pack-file');
                })
                .catch(error => {
                    console.error('Error importing pack:', error);
                    this.showToast(error.message || 'Failed to import pack', 'error');
                })
                .finally(() => {
                    importBtn.dataset.processing = 'false';
                });
        });

        document.querySelectorAll('.close-modal').forEach(button => {
            button.addEventListener('click', () => {
                const modal = button.closest('.modal');
                this.hideModal(modal.id);
            });
        });

        document.getElementById('confirm-cancel').addEventListener('click', () => {
            this.hideModal('confirm-modal');
        });

        document.getElementById('skin-file').addEventListener('change', (e) => {
            this.previewSkinFile(e.target.files[0], 'skin-preview-canvas', 'head-preview-faces');
        });

        document.getElementById('edit-skin-file').addEventListener('change', (e) => {
            this.previewSkinFile(e.target.files[0], null, 'new-head-faces');
        });

        this.setupFileInputHandlers();
    },

    setupFileInputHandlers: function () {

        const fileSelectBtns = document.querySelectorAll('.file-select-btn');

        fileSelectBtns.forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();

                const label = this.closest('label.file-input-label');
                if (label) {

                    const inputId = label.getAttribute('for');
                    if (inputId) {

                        document.getElementById(inputId).click();
                    }
                }
            });
        });

        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.updateFileButtonText(input.id);
            });
        });
    },

    updateFileButtonText: function (inputId) {
        const input = document.getElementById(inputId);
        const label = document.querySelector(`label[for="${inputId}"]`);
        const btn = label.querySelector('.file-select-btn');

        if (input.files.length > 0) {
            const fileName = input.files[0].name;
            const icon = btn.querySelector('.material-symbols-outlined');

            btn.innerHTML = '';

            btn.appendChild(icon);

            const fileNameSpan = document.createElement('span');
            fileNameSpan.className = 'file-name';
            fileNameSpan.textContent = fileName;
            btn.appendChild(fileNameSpan);
        }
    },

    resetFileButtonText: function (inputId) {
        const label = document.querySelector(`label[for="${inputId}"]`);
        const btn = label.querySelector('.file-select-btn');
        const icon = btn.querySelector('.material-symbols-outlined');

        btn.innerHTML = '';

        btn.appendChild(icon);

        let defaultText = 'Choose File';
        if (inputId === 'skin-file' || inputId === 'edit-skin-file') {
            defaultText = 'Choose Skin File';
        } else if (inputId === 'import-pack-file') {
            defaultText = 'Choose Pack File';
        }

        btn.appendChild(document.createTextNode(' ' + defaultText));
    },

    importPackFromFile: function () {
        return new Promise((resolve, reject) => {
            const fileInput = document.getElementById('import-pack-file');
            const file = fileInput.files[0];

            if (!file) {
                reject(new Error('Please select a file to import'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const packData = JSON.parse(e.target.result);
                    const packId = Storage.importPack(packData);

                    if (packId) {
                        this.hideModal('load-pack-modal');
                        this.loadPack(packId);
                        this.showToast('Pack imported successfully!', 'success');
                        resolve();
                    } else {
                        reject(new Error('Invalid pack data format'));
                    }
                } catch (error) {
                    console.error('Import error:', error);
                    reject(new Error('Failed to import pack: ' + error.message));
                }
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsText(file);
        });
    },

    showWelcomeScreen: function () {
        document.getElementById('welcome-screen').classList.remove('hidden');
        document.getElementById('pack-editor').classList.add('hidden');
        this.currentPackId = null;
        Storage.clearActivePack();
    },

    showPackEditor: function () {
        document.getElementById('welcome-screen').classList.add('hidden');
        document.getElementById('pack-editor').classList.remove('hidden');
    },

    loadPack: function (packId) {
        const pack = Storage.getPack(packId);
        if (!pack) {
            this.showToast('Pack not found', 'error');
            return;
        }

        this.currentPackId = packId;
        Storage.setActivePack(packId);

        document.getElementById('pack-name-display').textContent = pack.name;
        document.getElementById('heads-count').textContent = `Heads: ${pack.heads.length}`;

        this.refreshHeadsList();

        this.showPackEditor();
    },

    createNewPack: function (packName) {
        const packId = Storage.createPack(packName);
        this.hideModal('create-pack-modal');
        document.getElementById('pack-name').value = '';
        this.loadPack(packId);
        this.showToast('Pack created successfully!', 'success');
    },

    showLoadPackModal: function () {
        const savedPacksList = document.getElementById('saved-packs-list');
        savedPacksList.innerHTML = '';

        const packs = Storage.getAllPacks();
        const packIds = Object.keys(packs);

        if (packIds.length === 0) {
            savedPacksList.innerHTML = '<div class="no-packs-message">No saved packs found.</div>';
        } else {
            for (const packId of packIds) {
                const pack = packs[packId];
                const packItem = document.createElement('div');
                packItem.className = 'saved-pack-item';

                const packInfo = document.createElement('div');
                packInfo.className = 'saved-pack-info';

                const packName = document.createElement('h3');
                packName.textContent = pack.name;

                const packDetails = document.createElement('p');
                packDetails.textContent = `Heads: ${pack.heads.length} | Last modified: ${new Date(pack.lastModified).toLocaleDateString()}`;

                packInfo.appendChild(packName);
                packInfo.appendChild(packDetails);

                const packActions = document.createElement('div');
                packActions.className = 'saved-pack-actions';

                const loadBtn = document.createElement('button');
                loadBtn.textContent = 'Load';
                loadBtn.addEventListener('click', () => {
                    this.loadPack(packId);
                    this.hideModal('load-pack-modal');
                });

                const exportBtn = document.createElement('button');
                exportBtn.textContent = 'Export';
                exportBtn.addEventListener('click', () => {
                    this.exportPack(packId);
                });

                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Delete';
                deleteBtn.className = 'delete';
                deleteBtn.addEventListener('click', () => {
                    this.confirmDeletePackFromModal(packId, packItem);
                });

                packActions.appendChild(loadBtn);
                packActions.appendChild(exportBtn);
                packActions.appendChild(deleteBtn);

                packItem.appendChild(packInfo);
                packItem.appendChild(packActions);

                savedPacksList.appendChild(packItem);
            }
        }

        this.showModal('load-pack-modal');
    },

    exportPack: function (packId) {
        const pack = Storage.exportPack(packId || this.currentPackId);
        if (!pack) {
            this.showToast('No pack to export', 'error');
            return;
        }

        const packJson = JSON.stringify(pack);
        const blob = new Blob([packJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${pack.name.replace(/\s+/g, '_')}_pack.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('Pack exported successfully!', 'success');
    },

    saveCurrentPack: function () {
        if (!this.currentPackId) {
            this.showToast('No active pack to save', 'error');
            return;
        }

        const pack = Storage.getPack(this.currentPackId);
        if (pack) {
            Storage.savePack(pack);
            this.showToast('Pack saved successfully!', 'success');
        }
    },

    async addHead() {
        if (!this.currentPackId) {
            throw new Error('No active pack');
        }

        const headName = document.getElementById('head-name').value.trim();
        const skinFile = document.getElementById('skin-file').files[0];

        if (!headName) {
            throw new Error('Please enter a head name');
        }

        if (headName.length > 16) {
            throw new Error('Head name must be 16 characters or less');
        }

        if (!skinFile) {
            throw new Error('Please select a skin file');
        }

        try {

            const validation = await Utils.validateSkinFile(skinFile);
            if (!validation.valid) {
                this.showToast(validation.message, 'error');
                return;
            }

            const skinImage = validation.image;
            const itemTexture = await Utils.createItemTexture(skinImage);
            const blockTexture = await Utils.createBlockTexture(skinImage);

            const head = {
                name: headName,
                itemTexture: await this.blobToBase64(itemTexture),
                blockTexture: await this.blobToBase64(blockTexture),
            };

            const success = Storage.addHead(this.currentPackId, head);

            if (success) {
                this.hideModal('add-head-modal');
                document.getElementById('head-name').value = '';
                document.getElementById('skin-file').value = '';

                const skinPreviewCanvas = document.getElementById('skin-preview-canvas');
                const skinPreviewCtx = skinPreviewCanvas.getContext('2d');
                skinPreviewCtx.clearRect(0, 0, skinPreviewCanvas.width, skinPreviewCanvas.height);

                const headFaces = document.querySelectorAll('#head-preview-faces > div');
                headFaces.forEach(face => {
                    face.style.backgroundImage = '';

                    face.classList.remove('width-ratio-0-25', 'width-ratio-0-5');
                });

                this.refreshHeadsList();
                document.getElementById('heads-count').textContent = `Heads: ${Storage.getPack(this.currentPackId).heads.length}`;

                this.showToast('Head added successfully!', 'success');
            } else {
                this.showToast('A head with this name already exists', 'error');
            }
        } catch (error) {
            console.error('Error adding head:', error);
            this.showToast('Failed to add head: ' + error.message, 'error');
        }
    },

    async updateHead() {
        if (!this.currentPackId) {
            throw new Error('No active pack');
        }

        const headName = document.getElementById('edit-head-name').value;
        const skinFile = document.getElementById('edit-skin-file').files[0];

        if (!headName) {
            throw new Error('Missing head name');
        }

        if (!skinFile) {
            throw new Error('Please select a skin file');
        }

        try {

            const validation = await Utils.validateSkinFile(skinFile);
            if (!validation.valid) {
                this.showToast(validation.message, 'error');
                return;
            }

            const skinImage = validation.image;
            const itemTexture = await Utils.createItemTexture(skinImage);
            const blockTexture = await Utils.createBlockTexture(skinImage);

            const updateData = {
                itemTexture: await this.blobToBase64(itemTexture),
                blockTexture: await this.blobToBase64(blockTexture),
            };

            const success = Storage.updateHead(this.currentPackId, headName, updateData);

            if (success) {
                this.hideModal('edit-head-modal');
                document.getElementById('edit-skin-file').value = '';

                const currentFaces = document.querySelectorAll('#current-head-faces > div');
                const newFaces = document.querySelectorAll('#new-head-faces > div');

                currentFaces.forEach(face => {
                    face.style.backgroundImage = '';

                    if (!face.classList.contains('width-ratio-0-25')) {
                        face.classList.remove('width-ratio-0-5');
                    }
                });

                newFaces.forEach(face => {
                    face.style.backgroundImage = '';
                    face.classList.remove('width-ratio-0-25', 'width-ratio-0-5');
                });

                this.refreshHeadsList();

                this.showToast('Head updated successfully!', 'success');
            } else {
                this.showToast('Failed to update head', 'error');
            }
        } catch (error) {
            console.error('Error updating head:', error);
            this.showToast('Failed to update head: ' + error.message, 'error');
        }
    },

    showEditHeadModal(headName) {
        if (!this.currentPackId) return;

        const pack = Storage.getPack(this.currentPackId);
        const head = pack.heads.find(h => h.name === headName);

        if (!head) {
            this.showToast('Head not found', 'error');
            return;
        }

        document.getElementById('edit-head-name').value = head.name;

        const faces = document.querySelectorAll('#current-head-faces > div');
        faces.forEach(face => {
            face.style.backgroundImage = `url(${head.blockTexture})`;
        });

        const newFaces = document.querySelectorAll('#new-head-faces > div');
        newFaces.forEach(face => {
            face.style.backgroundImage = '';
        });

        this.showModal('edit-head-modal');
    },

    deleteHead(headName) {
        if (!this.currentPackId) {
            this.showToast('No active pack', 'error');
            return;
        }

        const success = Storage.removeHead(this.currentPackId, headName);

        if (success) {
            this.hideModal('confirm-modal');
            this.hideModal('edit-head-modal');

            this.refreshHeadsList();
            document.getElementById('heads-count').textContent = `Heads: ${Storage.getPack(this.currentPackId).heads.length}`;

            this.showToast('Head deleted successfully!', 'success');
        } else {
            this.showToast('Failed to delete head', 'error');
        }
    },

    confirmDeleteHead(headName) {
        document.getElementById('confirm-title').textContent = 'Delete Head';
        document.getElementById('confirm-message').textContent = `Are you sure you want to delete the head "${headName}"?`;

        document.getElementById('confirm-ok').onclick = () => {
            this.deleteHead(headName);
        };

        this.showModal('confirm-modal');
    },

    deletePack() {
        if (!this.currentPackId) {
            this.showToast('No active pack to delete', 'error');
            return;
        }

        const success = Storage.deletePack(this.currentPackId);

        if (success) {
            this.hideModal('confirm-modal');
            this.showWelcomeScreen();
            this.showToast('Pack deleted successfully!', 'success');
        } else {
            this.showToast('Failed to delete pack', 'error');
        }
    },

    confirmDeletePack() {
        if (!this.currentPackId) return;

        const pack = Storage.getPack(this.currentPackId);

        document.getElementById('confirm-title').textContent = 'Delete Pack';
        document.getElementById('confirm-message').textContent = `Are you sure you want to delete the pack "${pack.name}"? This action cannot be undone.`;

        document.getElementById('confirm-ok').onclick = () => {
            this.deletePack();
        };

        this.showModal('confirm-modal');
    },

    confirmDeletePackFromModal(packId, packElement) {
        const pack = Storage.getPack(packId);

        document.getElementById('confirm-title').textContent = 'Delete Pack';
        document.getElementById('confirm-message').textContent = `Are you sure you want to delete the pack "${pack.name}"? This action cannot be undone.`;

        document.getElementById('confirm-ok').onclick = () => {
            const success = Storage.deletePack(packId);

            if (success) {
                this.hideModal('confirm-modal');

                packElement.remove();

                const savedPacksList = document.getElementById('saved-packs-list');
                if (savedPacksList.children.length === 0) {
                    savedPacksList.innerHTML = '<div class="no-packs-message">No saved packs found.</div>';
                }

                if (packId === this.currentPackId) {
                    this.showWelcomeScreen();
                }

                this.showToast('Pack deleted successfully!', 'success');
            } else {
                this.showToast('Failed to delete pack', 'error');
            }
        };

        this.showModal('confirm-modal');
    },

    async generateAddon() {
        if (!this.currentPackId) {
            this.showToast('No active pack', 'error');
            return;
        }

        const pack = Storage.getPack(this.currentPackId);
        if (pack.heads.length === 0) {
            this.showToast('Pack has no heads to generate', 'error');
            return;
        }

        const addonName = document.getElementById('addon-name').value.trim();
        if (!addonName) {
            this.showToast('Please enter an add-on name', 'error');
            return;
        }

        try {
            this.showToast('Generating add-on...', 'info');

            const packData = {
                addonName: addonName,
                heads: pack.heads,
                color: this.previewPackColor || Utils.getRandomColor(),
                iconIndex: this.previewPackIconIndex
            };

            const zip = await Utils.generatePackZip(packData);

            zip.generateAsync({ type: 'blob' }).then(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${addonName.replace(/\s+/g, '_')}_${pack.heads.length}_Heads.mcaddon`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                this.hideModal('generate-modal');
                this.showToast('Add-on generated successfully!', 'success');
            });
        } catch (error) {
            console.error('Error generating add-on:', error);
            this.showToast('Failed to generate add-on: ' + error.message, 'error');
        }
    },

    showGenerateModal() {
        if (!this.currentPackId) return;

        const pack = Storage.getPack(this.currentPackId);

        document.getElementById('addon-name').value = pack.name;

        document.getElementById('preview-head-count').textContent = `Heads: ${pack.heads.length}`;

        const previewCanvas = document.getElementById('pack-icon-preview');
        this.previewPackColor = Utils.getRandomColor();

        this.previewPackIconIndex = Math.random() <= 0.01 ? 8 : Math.floor(Math.random() * 8);

        Utils.createPackIcon(this.previewPackColor, this.previewPackIconIndex).then(blob => {
            const url = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = () => {
                const ctx = previewCanvas.getContext('2d');
                ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
                ctx.drawImage(img, 0, 0, previewCanvas.width, previewCanvas.height);
                URL.revokeObjectURL(url);
            };
            img.src = url;
        });

        this.showModal('generate-modal');
    },

    refreshHeadsList() {
        if (!this.currentPackId) return;

        const pack = Storage.getPack(this.currentPackId);
        const headsContainer = document.getElementById('heads-container');
        headsContainer.innerHTML = '';

        if (pack.heads.length === 0) {
            const noHeadsMessage = document.createElement('div');
            noHeadsMessage.className = 'no-heads-message';
            noHeadsMessage.innerHTML = '<p>No heads in this pack yet. Click "Add Head" to get started.</p>';
            headsContainer.appendChild(noHeadsMessage);
            return;
        }

        for (const head of pack.heads) {
            const headItem = document.createElement('div');
            headItem.className = 'head-item';
            headItem.dataset.name = head.name;

            const headImage = document.createElement('img');
            headImage.className = 'head-image';
            headImage.src = head.itemTexture;
            headImage.alt = head.name;

            const headName = document.createElement('div');
            headName.className = 'head-name';
            headName.textContent = head.name;

            headItem.appendChild(headImage);
            headItem.appendChild(headName);

            headItem.addEventListener('click', () => {
                this.showEditHeadModal(head.name);
            });

            headsContainer.appendChild(headItem);
        }
    },

    filterHeads(query) {
        const headItems = document.querySelectorAll('.head-item');

        headItems.forEach(item => {
            const name = item.dataset.name.toLowerCase();
            if (name.includes(query)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    },

    async previewSkinFile(file, skinCanvasId, headFacesId) {
        if (!file) return;

        try {
            const validation = await Utils.validateSkinFile(file);
            if (!validation.valid) {
                this.showToast(validation.message, 'error');
                return;
            }

            const skinImage = validation.image;

            if (skinCanvasId) {
                const skinCanvas = document.getElementById(skinCanvasId);
                const skinCtx = skinCanvas.getContext('2d');
                skinCtx.clearRect(0, 0, skinCanvas.width, skinCanvas.height);

                const scale = Math.min(skinCanvas.width / skinImage.width, skinCanvas.height / skinImage.height);
                const x = (skinCanvas.width - skinImage.width * scale) / 2;
                const y = (skinCanvas.height - skinImage.height * scale) / 2;

                skinCtx.imageSmoothingEnabled = false;
                skinCtx.drawImage(skinImage, x, y, skinImage.width * scale, skinImage.height * scale);
            }

            if (headFacesId) {

                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = skinImage.width;
                tempCanvas.height = skinImage.height;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.drawImage(skinImage, 0, 0);
                const skinUrl = tempCanvas.toDataURL('image/png');

                const faces = document.querySelectorAll(`#${headFacesId} > div`);

                let widthRatioClass = '';
                if (skinImage.height === 64 && skinImage.width === 64) {

                    widthRatioClass = '';
                } else if (skinImage.height === 32 && skinImage.width === 64) {
                    widthRatioClass = 'width-ratio-0-5';
                } else if (skinImage.width === 128 && skinImage.height === 128) {

                    widthRatioClass = '';
                } else if (skinImage.width === 128 && skinImage.height === 64) {
                    widthRatioClass = 'width-ratio-0-5';
                } else if (skinImage.height !== skinImage.width) {

                    const ratio = skinImage.height / skinImage.width;
                    widthRatioClass = `width-ratio-${ratio}`;
                }

                faces.forEach(face => {
                    face.style.backgroundImage = `url(${skinUrl})`;

                    face.classList.remove('width-ratio-0-25', 'width-ratio-0-5');

                    if (widthRatioClass) {
                        face.classList.add(widthRatioClass);
                    }
                });
            }
        } catch (error) {
            console.error('Error previewing skin:', error);
            this.showToast('Failed to preview skin: ' + error.message, 'error');
        }
    },

    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {

                resolve(reader.result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    },

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('show');
    },

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('show');
    },

    backToMenu() {

        document.getElementById('confirm-title').textContent = 'Return to Menu';
        document.getElementById('confirm-message').textContent = 'Are you sure you want to return to the main menu?';

        document.getElementById('confirm-ok').onclick = () => {
            this.hideModal('confirm-modal');
            this.showWelcomeScreen();
        };

        this.showModal('confirm-modal');
    },

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = 'toast';
        toast.classList.add(type);
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
};
