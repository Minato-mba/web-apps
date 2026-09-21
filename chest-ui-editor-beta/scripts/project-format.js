/**
 * Chest UI Editor project format (browser save/load and ZIP chest_ui_data.json).
 * Bump FORMAT_VERSION when making breaking changes.
 * Only projects with matching formatVersion can be saved or loaded.
 */
const projectFormat = {
    FORMAT_VERSION: 3,
    FORMAT_LABEL: '3.0.0',

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
            anchor_from: component.anchor_from,
            anchor_to: component.anchor_to,
            zIndex: component.zIndex,
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

        if (![2, this.FORMAT_VERSION].includes(data.formatVersion)) {
            const legacy = data.formatVersion ?? data.version ?? 'none';
            return {
                ok: false,
                message:
                    `This project uses an unsupported format (${legacy}). ` +
                    `Use a project exported by Chest UI Editor 2.0.0 or later.`
            };
        }

        if (!Array.isArray(data.components)) {
            return {
                ok: false,
                message: 'Invalid project file: missing or invalid "components" array.'
            };
        }

        const validateComponents = (components, location) => {
            if (!Array.isArray(components)) {
                return `${location} must be an array.`;
            }
            if (components.length > 1000) {
                return `${location} exceeds the 1000 component safety limit.`;
            }
            const ids = new Set();
            for (let index = 0; index < components.length; index++) {
                const component = components[index];
                const path = `${location}[${index}]`;
                if (!component || typeof component !== 'object' || Array.isArray(component)) {
                    return `${path} must be an object.`;
                }
                if (typeof component.type !== 'string' ||
                    (typeof componentTypes !== 'undefined' && !componentTypes[component.type])) {
                    return `${path} has an unsupported component type.`;
                }
                if (component.id != null) {
                    if (!/^[A-Za-z0-9_-]{1,100}$/.test(String(component.id))) {
                        return `${path}.id contains unsupported characters.`;
                    }
                    if (ids.has(component.id)) return `${path}.id is duplicated.`;
                    ids.add(component.id);
                }
                for (const field of ['x', 'y', 'width', 'height']) {
                    const value = Number(component[field]);
                    if (!Number.isFinite(value)) return `${path}.${field} must be finite.`;
                    if ((field === 'width' || field === 'height') && (value <= 0 || value > 4096)) {
                        return `${path}.${field} must be between 1 and 4096.`;
                    }
                    if ((field === 'x' || field === 'y') && Math.abs(value) > 100000) {
                        return `${path}.${field} is outside the supported range.`;
                    }
                }
                if (component.properties != null &&
                    (typeof component.properties !== 'object' || Array.isArray(component.properties))) {
                    return `${path}.properties must be an object.`;
                }
                for (const [key, value] of Object.entries(component.properties || {})) {
                    if ((key.includes('texture') || key === 'picture') && typeof value === 'string' &&
                        !/^[A-Za-z0-9_./:-]*$/.test(value)) {
                        return `${path}.properties.${key} is not a safe texture path.`;
                    }
                }
            }
            return null;
        };

        let componentError = validateComponents(data.components, 'components');
        if (componentError) return { ok: false, message: `Invalid project file: ${componentError}` };

        const uis = data.uiProject?.uis || data.uis;
        if (uis != null) {
            if (!Array.isArray(uis) || uis.length > 100) {
                return { ok: false, message: 'Invalid project file: uiProject.uis must contain at most 100 UIs.' };
            }
            for (let index = 0; index < uis.length; index++) {
                componentError = validateComponents(uis[index]?.components, `uiProject.uis[${index}].components`);
                if (componentError) return { ok: false, message: `Invalid project file: ${componentError}` };
            }
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

        data = this.migrate(data);

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
                comp.properties,
                comp
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

    migrate: function (data) {
        const migrated = JSON.parse(JSON.stringify(data));
        if (migrated.formatVersion !== 2) return migrated;

        const migrateComponents = components => {
            (components || []).forEach(component => {
                component.anchor_from = component.anchor_from || 'top_left';
                component.anchor_to = component.anchor_to || 'top_left';
                // v2 added one pixel only during export. Fold it into the real
                // Bedrock offset so existing packs keep their in-game position.
                component.x = (Number(component.x) || 0) + 1;
                component.y = Number(component.y) || 0;
            });
        };

        migrateComponents(migrated.components);
        (migrated.uiProject?.uis || migrated.uis || []).forEach(ui => migrateComponents(ui.components));
        migrated.formatVersion = this.FORMAT_VERSION;
        migrated.formatLabel = this.FORMAT_LABEL;
        migrated.migratedFrom = 2;
        return migrated;
    },

    persistLocal: function (data) {
        this.assertValid(data);
        const saved = util.saveToLocalStorage('minecraft_chest_ui_project', data);
        if (!saved) {
            throw new Error('The browser could not save this project. Storage may be full or unavailable.');
        }
        return true;
    },

    saveToBrowser: function () {
        const data = this.buildFromEditor();
        this.persistLocal(data);
        return data;
    }
};
