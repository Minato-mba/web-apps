/**
 * Chest UI Editor project format (browser save/load and ZIP chest_ui_data.json).
 * Bump FORMAT_VERSION when making breaking changes.
 * Only projects with matching formatVersion can be saved or loaded.
 */
const projectFormat = {
    FORMAT_VERSION: 2,
    FORMAT_LABEL: '2.0.0',

    build: function ({ components, uiProject = null, settings = null, uploadedImages = null }) {
        const payload = {
            formatVersion: this.FORMAT_VERSION,
            formatLabel: this.FORMAT_LABEL,
            exportedAt: Date.now(),
            components: components || [],
            uiProject: uiProject
        };

        if (settings !== null && settings !== undefined) {
            payload.settings = settings;
        }

        if (uploadedImages !== null && uploadedImages !== undefined) {
            payload.uploadedImages = uploadedImages;
        }

        return payload;
    },

    buildFromEditor: function () {
        if (typeof chestUiManager !== 'undefined') {
            chestUiManager.captureActive();
        }

        const cleanComponents = editor.getComponents().map(component => ({
            id: component.id,
            type: component.type,
            x: component.x,
            y: component.y,
            width: component.width,
            height: component.height,
            properties: { ...component.properties }
        }));

        const activeUi = typeof chestUiManager !== 'undefined' ? chestUiManager.getActiveUi() : null;
        const settings = activeUi?.settings || util.loadFromLocalStorage('chest_ui_settings') || {
            mainPanelHeight: 166,
            mainPanelLayer: 5
        };

        return this.build({
            components: cleanComponents,
            uiProject: typeof chestUiManager !== 'undefined' ? chestUiManager.toJSON() : null,
            settings,
            uploadedImages: typeof imageManager !== 'undefined' ? imageManager.uploadedImages : null
        });
    },

    validate: function (data) {
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            return {
                ok: false,
                message: 'Invalid project file: expected a JSON project object.'
            };
        }

        if (data.formatVersion !== this.FORMAT_VERSION) {
            const legacy = data.formatVersion ?? data.version ?? 'none';
            return {
                ok: false,
                message:
                    `This project uses an unsupported format (${legacy}). ` +
                    `Save again or use Import/Export with Chest UI Editor ${this.FORMAT_LABEL} or later. ` +
                    `Older data (including 1.1.0) cannot be loaded.`
            };
        }

        if (!Array.isArray(data.components)) {
            return {
                ok: false,
                message: 'Invalid project file: missing or invalid "components" array.'
            };
        }

        return { ok: true };
    },

    assertValid: function (data) {
        const result = this.validate(data);
        if (!result.ok) {
            throw new Error(result.message);
        }
    },

    apply: function (data, options = {}) {
        const silent = options.silent === true;
        const validation = this.validate(data);

        if (!validation.ok) {
            if (!silent) {
                alert(validation.message);
            }
            return false;
        }

        if (data.uploadedImages && typeof imageManager !== 'undefined') {
            imageManager.uploadedImages = data.uploadedImages;
        }

        if (data.settings) {
            util.saveToLocalStorage('chest_ui_settings', data.settings);
            util.applySettings(data.settings);
        }

        const legacyComponents = Array.isArray(data.components) ? data.components : [];
        editor.clearComponents();

        legacyComponents.forEach(comp => {
            const component = createComponent(
                comp.type,
                comp.x,
                comp.y,
                comp.width,
                comp.height,
                comp.properties
            );

            if (comp.id) {
                component.id = comp.id;
            }

            if (comp.zIndex !== undefined) {
                component.zIndex = comp.zIndex;
            }

            editor.addComponent(component);
        });

        editor.fixComponentZIndices();

        const uiProject = data.uiProject || (Array.isArray(data.uis) ? data : null);
        if (uiProject && typeof chestUiManager !== 'undefined') {
            chestUiManager.load(uiProject, legacyComponents);
        } else if (typeof chestUiManager !== 'undefined') {
            chestUiManager.resetFromCurrent();
        }

        const activeUi = typeof chestUiManager !== 'undefined' ? chestUiManager.getActiveUi() : null;
        if (activeUi?.settings) {
            util.applySettings(activeUi.settings);
            chestUiManager.updateTitleDisplay(activeUi);
        }

        return true;
    },

    persistLocal: function (data) {
        this.assertValid(data);
        util.saveToLocalStorage('minecraft_chest_ui_project', data);
    },

    saveToBrowser: function () {
        const data = this.buildFromEditor();
        this.persistLocal(data);
        return data;
    }
};
